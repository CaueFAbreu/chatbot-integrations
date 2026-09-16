import { ChatMessage } from "./conversationService";

/**
 * Adaptador HTTP para o microsserviço llm-service.
 * O chat-engine não sabe (nem deve saber) qual provedor de IA está por trás.
 */
export class LlmClient {
  constructor(private readonly baseUrl: string) {}

  async generateReply(history: ChatMessage[]): Promise<string> {
    const response = await fetch(`${this.baseUrl}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history }),
    });

    if (!response.ok) {
      throw new Error(`llm-service respondeu com erro (${response.status})`);
    }

    const data = (await response.json()) as { reply: string };
    return data.reply;
  }
}
