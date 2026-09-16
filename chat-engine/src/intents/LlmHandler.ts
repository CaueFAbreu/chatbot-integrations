import { IntentHandler, IntentContext } from "./IntentHandler";
import { LlmClient } from "../services/llmClient";

/**
 * Handler "catch-all": trata qualquer mensagem que nenhum outro handler
 * reconheceu, delegando ao llm-service. Deve ser sempre o último da lista
 * no IntentRouter, já que matches() sempre retorna true.
 */
export class LlmHandler implements IntentHandler {
  readonly name = "llm-fallback";

  constructor(private readonly llmClient: LlmClient) {}

  matches(_text: string): boolean {
    return true;
  }

  async handle(context: IntentContext): Promise<string> {
    return this.llmClient.generateReply(context.history);
  }
}
