import { IntentRouter } from "../src/intents/IntentRouter";
import { GreetingHandler } from "../src/intents/GreetingHandler";
import { GithubHandler } from "../src/intents/GithubHandler";
import { LlmHandler } from "../src/intents/LlmHandler";
import { GithubClient } from "../src/services/githubClient";
import { LlmClient } from "../src/services/llmClient";

describe("IntentRouter", () => {
  it("lança erro ao ser criado sem nenhum handler", () => {
    expect(() => new IntentRouter([])).toThrow("IntentRouter precisa de pelo menos um handler");
  });

  it("roteia para o GreetingHandler quando a mensagem é uma saudação", async () => {
    const githubClient = { listOpenIssues: jest.fn() } as unknown as GithubClient;
    const llmClient = { generateReply: jest.fn() } as unknown as LlmClient;

    const router = new IntentRouter([
      new GreetingHandler(),
      new GithubHandler(githubClient),
      new LlmHandler(llmClient),
    ]);

    const reply = await router.route({ chatId: "1", text: "Oi, tudo bem?", history: [] });

    expect(reply).toMatch(/Olá!/);
    expect(githubClient.listOpenIssues).not.toHaveBeenCalled();
    expect(llmClient.generateReply).not.toHaveBeenCalled();
  });

  it("roteia para o GithubHandler quando a mensagem menciona issues", async () => {
    const githubClient = {
      listOpenIssues: jest.fn().mockResolvedValue([
        { number: 3, title: "Corrigir bug de login", url: "https://x/3", state: "open" },
      ]),
    } as unknown as GithubClient;
    const llmClient = { generateReply: jest.fn() } as unknown as LlmClient;

    const router = new IntentRouter([
      new GreetingHandler(),
      new GithubHandler(githubClient),
      new LlmHandler(llmClient),
    ]);

    const reply = await router.route({ chatId: "1", text: "quais issues estão abertas?", history: [] });

    expect(reply).toContain("Corrigir bug de login");
    expect(llmClient.generateReply).not.toHaveBeenCalled();
  });

  it("cai no LlmHandler quando nenhuma outra intenção reconhece a mensagem", async () => {
    const githubClient = { listOpenIssues: jest.fn() } as unknown as GithubClient;
    const llmClient = {
      generateReply: jest.fn().mockResolvedValue("Resposta gerada pelo LLM"),
    } as unknown as LlmClient;

    const router = new IntentRouter([
      new GreetingHandler(),
      new GithubHandler(githubClient),
      new LlmHandler(llmClient),
    ]);

    const reply = await router.route({
      chatId: "1",
      text: "me explica o que é recursão",
      history: [],
    });

    expect(reply).toBe("Resposta gerada pelo LLM");
    expect(llmClient.generateReply).toHaveBeenCalledTimes(1);
  });
});
