import "dotenv/config";
import express, { Request, Response } from "express";
import { GithubApi } from "./githubApi";

const app = express();
app.use(express.json());

const githubApi = new GithubApi(
  process.env.GITHUB_TOKEN ?? "",
  process.env.GITHUB_REPO ?? "CaueFAbreu/chatbot-integrations"
);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "github-service" });
});

app.get("/issues", async (_req: Request, res: Response) => {
  try {
    const issues = await githubApi.listOpenIssues();
    return res.json({ issues });
  } catch (error) {
    console.error("Erro ao listar issues:", error);
    return res.status(502).json({ error: "Falha ao consultar a API do GitHub" });
  }
});

app.post("/issues/:number/comment", async (req: Request, res: Response) => {
  const issueNumber = Number(req.params.number);
  const { body } = req.body as { body: string };

  if (!body) {
    return res.status(400).json({ error: "Campo 'body' é obrigatório" });
  }

  try {
    await githubApi.commentOnIssue(issueNumber, body);
    return res.status(201).json({ status: "comentário criado" });
  } catch (error) {
    console.error("Erro ao comentar na issue:", error);
    return res.status(502).json({ error: "Falha ao comentar na issue" });
  }
});

const PORT = process.env.PORT ?? 4002;
app.listen(PORT, () => {
  console.log(`github-service rodando na porta ${PORT}`);
});

export default app;
