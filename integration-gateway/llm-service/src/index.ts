import "dotenv/config";
import express, { Request, Response } from "express";
import { OpenAiProvider, ChatMessage } from "./llmProvider";

const app = express();
app.use(express.json());

const provider = new OpenAiProvider(process.env.OPENAI_API_KEY ?? "");

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "llm-service" });
});

app.post("/reply", async (req: Request, res: Response) => {
  const { history } = req.body as { history: ChatMessage[] };

  if (!Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: "Campo 'history' é obrigatório e não pode ser vazio" });
  }

  try {
    const reply = await provider.generateReply(history);
    return res.json({ reply });
  } catch (error) {
    console.error("Erro ao gerar resposta do LLM:", error);
    return res.status(502).json({ error: "Falha ao consultar o provedor de LLM" });
  }
});

const PORT = process.env.PORT ?? 4001;
app.listen(PORT, () => {
  console.log(`llm-service rodando na porta ${PORT}`);
});

export default app;
