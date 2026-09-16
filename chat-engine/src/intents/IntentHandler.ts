import { ChatMessage } from "../services/conversationService";

export interface IntentContext {
  chatId: string;
  text: string;
  history: ChatMessage[];
}

/**
 * Cada intenção suportada pelo bot implementa essa interface.
 * O IntentRouter não sabe (nem precisa saber) como cada uma resolve
 * a mensagem — só decide QUAL delas chamar. Isso é o Strategy pattern:
 * troca de comportamento sem tocar no código que decide.
 */
export interface IntentHandler {
  /** Nome curto usado em logs e nos testes. */
  readonly name: string;
  /** Decide se este handler deve tratar a mensagem recebida. */
  matches(text: string): boolean;
  /** Resolve a mensagem e devolve o texto de resposta ao usuário. */
  handle(context: IntentContext): Promise<string>;
}
