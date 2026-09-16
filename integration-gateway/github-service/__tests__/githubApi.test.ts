import { GithubApi } from "../src/githubApi";

describe("GithubApi", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it("filtra pull requests e retorna apenas issues reais", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { number: 1, title: "Bug no login", html_url: "https://x/1", state: "open" },
        { number: 2, title: "PR de feature", html_url: "https://x/2", state: "open", pull_request: {} },
      ],
    }) as unknown as typeof fetch;

    const api = new GithubApi("fake-token", "user/repo");
    const issues = await api.listOpenIssues();

    expect(issues).toHaveLength(1);
    expect(issues[0].title).toBe("Bug no login");
  });

  it("lança erro quando a listagem de issues falha", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as unknown as typeof fetch;

    const api = new GithubApi("fake-token", "user/repo");
    await expect(api.listOpenIssues()).rejects.toThrow("Falha ao listar issues (404)");
  });

  it("lança erro quando comentar na issue falha", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 }) as unknown as typeof fetch;

    const api = new GithubApi("fake-token", "user/repo");
    await expect(api.commentOnIssue(1, "oi")).rejects.toThrow("Falha ao comentar na issue #1 (403)");
  });
});
