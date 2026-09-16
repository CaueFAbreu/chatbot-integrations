export class TelegramClient {
  private readonly apiUrl: string;

  constructor(botToken: string) {
    this.apiUrl = `https://api.telegram.org/bot${botToken}`;
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
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

/** Formato mínimo do payload que o Telegram envia ao webhook. */
export interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
  };
}
