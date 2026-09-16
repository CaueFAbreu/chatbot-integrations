import { IntentHandler, IntentContext } from "./IntentHandler";

/**
 * Recebe a lista de handlers já ordenada por prioridade (o mais específico
 * primeiro, o fallback do LLM por último) e delega para o primeiro que
 * reconhecer a mensagem. Adicionar uma nova intenção = criar um novo
 * IntentHandler e inserir na lista — o router em si nunca muda.
 */
export class IntentRouter {
  constructor(private readonly handlers: IntentHandler[]) {
    if (handlers.length === 0) {
      throw new Error("IntentRouter precisa de pelo menos um handler");
    }
  }

  async route(context: IntentContext): Promise<string> {
    const handler = this.handlers.find((h) => h.matches(context.text));

    if (!handler) {
      throw new Error("Nenhum handler reconheceu a mensagem (faltou um fallback?)");
    }

    return handler.handle(context);
  }
}
