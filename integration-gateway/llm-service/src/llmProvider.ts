/**
 * Isola toda a comunicação com o provedor de LLM (Groq, por padrão — tier
 * gratuito, sem custo). Trocar de provedor no futuro significa mexer só
 * neste arquivo — é o ponto central do desacoplamento que esse
 * microsserviço existe para garantir. A API da Groq é compatível com o
 * formato da OpenAI, então trocar de volta pra OpenAI/outro provedor
 * exigiria só ajustar a URL e o nome do modelo.
 */

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LlmProvider {
  generateReply(history: ChatMessage[]): Promise<string>;
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export class GroqProvider implements LlmProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = "openai/gpt-oss-20b"
  ) {}

  async generateReply(history: ChatMessage[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error("GROQ_API_KEY não configurada");
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: history,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Falha na API do LLM (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };

    return data.choices[0]?.message?.content ?? "Não consegui gerar uma resposta agora.";
  }
}