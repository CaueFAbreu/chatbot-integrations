const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;

export class TelegramClient {
  private readonly apiUrl: string;

  constructor(botToken: string) {
    this.apiUrl = `https://api.telegram.org/bot${botToken}`;
  }

  /**
   * Envia texto ao Telegram, dividindo em múltiplas mensagens quando
   * ultrapassa o limite de 4096 caracteres da API (erro 400 "message is
   * too long" caso contrário). Divide em quebras de linha quando possível,
   * pra não cortar frases no meio.
   */
  async sendMessage(chatId: string, text: string): Promise<void> {
    const chunks = this.splitIntoChunks(text, TELEGRAM_MAX_MESSAGE_LENGTH);

    for (const chunk of chunks) {
      await this.sendSingleMessage(chatId, chunk);
    }
  }

  private splitIntoChunks(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > maxLength) {
      let splitAt = remaining.lastIndexOf("\n", maxLength);
      if (splitAt <= 0) {
        splitAt = maxLength;
      }
      chunks.push(remaining.slice(0, splitAt));
      remaining = remaining.slice(splitAt).trimStart();
    }

    if (remaining.length > 0) {
      chunks.push(remaining);
    }

    return chunks;
  }

  private async sendSingleMessage(chatId: string, text: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Falha ao enviar mensagem no Telegram: ${errorBody}`);
    }
  }
}
export interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
  };
}
