import { PrismaClient } from "@prisma/client";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const MAX_HISTORY_MESSAGES = 10;

/**
 * Isola o acesso ao banco (Prisma/MySQL). O restante do chat-engine
 * trabalha só com ChatMessage[] em memória — não sabe como o histórico
 * é persistido nem precisa saber.
 */
export class ConversationService {
  constructor(private readonly prisma: PrismaClient) {}

  private async getOrCreateConversation(chatId: string) {
    return this.prisma.conversation.upsert({
      where: { chatId },
      update: {},
      create: { chatId },
    });
  }

  async getHistory(chatId: string): Promise<ChatMessage[]> {
    const conversation = await this.getOrCreateConversation(chatId);
    const messages = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: MAX_HISTORY_MESSAGES,
    });

    return messages.map((m) => ({
      role: m.role as ChatMessage["role"],
      content: m.content,
    }));
  }

  async appendMessage(chatId: string, message: ChatMessage): Promise<void> {
    const conversation = await this.getOrCreateConversation(chatId);
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: message.role,
        content: message.content,
      },
    });
  }
}
