import { IntentHandler, IntentContext } from "./IntentHandler";

const GREETING_PATTERN = /^(oi|ol[aá]|e a[íi]|bom dia|boa tarde|boa noite)/i;

export class GreetingHandler implements IntentHandler {
  readonly name = "greeting";

  matches(text: string): boolean {
    return GREETING_PATTERN.test(text.trim());
  }

  async handle(_context: IntentContext): Promise<string> {
    return "Olá! Eu posso conversar livremente, listar issues abertas ou comentar em uma issue do repositório. O que você precisa?";
  }
}
