import "dotenv/config";
import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

import { IntentRouter } from "./intents/IntentRouter";
import { GreetingHandler } from "./intents/GreetingHandler";
import { GithubHandler } from "./intents/GithubHandler";
import { LlmHandler } from "./intents/LlmHandler";

import { ConversationService } from "./services/conversationService";
import { LlmClient } from "./services/llmClient";
import { GithubClient } from "./services/githubClient";

import { TelegramClient, TelegramUpdate } from "./telegram/telegramClient";

const app = express();
app.use(express.json());

const prisma = new PrismaClient();
const conversationService = new ConversationService(prisma);

const llmClient = new LlmClient(process.env.LLM_SERVICE_URL ?? "http://localhost:4001");
const githubClient = new GithubClient(process.env.GITHUB_SERVICE_URL ?? "http://localhost:4002");
const telegramClient = new TelegramClient(process.env.TELEGRAM_BOT_TOKEN ?? "");

// Ordem importa: do handler mais específico para o fallback (LLM) por último.
const intentRouter = new IntentRouter([
  new GreetingHandler(),
  new GithubHandler(githubClient),
  new LlmHandler(llmClient),
]);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "chat-engine" });
});

app.post("/webhook/telegram", async (req: Request, res: Response) => {
  const update = req.body as TelegramUpdate;
  const chatId = update.message?.chat.id?.toString();
  const text = update.message?.text;

  // Responder 200 imediatamente é prática recomendada pelo Telegram,
  // mesmo que a mensagem não seja processável.
  if (!chatId || !text) {
    return res.sendStatus(200);
  }

  try {
    const history = await conversationService.getHistory(chatId);
    await conversationService.appendMessage(chatId, { role: "user", content: text });

    const reply = await intentRouter.route({
      chatId,
      text,
      history: [...history, { role: "user", content: text }],
    });

    await conversationService.appendMessage(chatId, { role: "assistant", content: reply });
    await telegramClient.sendMessage(chatId, reply);
  } catch (error) {
    console.error("Erro ao processar mensagem do Telegram:", error);
    await telegramClient.sendMessage(chatId, "Tive um problema ao processar sua mensagem. Tenta de novo?");
  }

  return res.sendStatus(200);
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`chat-engine rodando na porta ${PORT}`);
});

export default app;
