import { GroqProvider } from "../src/llmProvider";

describe("GroqProvider", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it("lança erro quando a API key não está configurada", async () => {
    const provider = new GroqProvider("");
    await expect(provider.generateReply([{ role: "user", content: "oi" }])).rejects.toThrow(
      "GROQ_API_KEY não configurada"
    );
  });

  it("retorna o conteúdo da primeira escolha quando a chamada tem sucesso", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Olá! Como posso ajudar?" } }],
      }),
    }) as unknown as typeof fetch;

    const provider = new GroqProvider("fake-key");
    const reply = await provider.generateReply([{ role: "user", content: "oi" }]);

    expect(reply).toBe("Olá! Como posso ajudar?");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("lança erro quando a API retorna status de falha", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "internal error",
    }) as unknown as typeof fetch;

    const provider = new GroqProvider("fake-key");
    await expect(provider.generateReply([{ role: "user", content: "oi" }])).rejects.toThrow(
      /Falha na API do LLM/
    );
  });
});