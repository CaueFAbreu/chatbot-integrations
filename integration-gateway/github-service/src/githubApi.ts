/**
 * Isola toda a comunicação com a API REST do GitHub.
 * O restante do sistema não sabe (nem precisa saber) como o GitHub
 * representa issues e pull requests — só recebe um formato já limpo.
 */

export interface GithubIssue {
  number: number;
  title: string;
  url: string;
  state: string;
}

export class GithubApi {
  private readonly baseUrl = "https://api.github.com";

  constructor(private readonly token: string, private readonly repo: string) {}

  private get headers() {
    return {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${this.token}`,
    };
  }

  async listOpenIssues(): Promise<GithubIssue[]> {
    const response = await fetch(
      `${this.baseUrl}/repos/${this.repo}/issues?state=open`,
      { headers: this.headers }
    );

    if (!response.ok) {
      throw new Error(`Falha ao listar issues (${response.status})`);
    }

    const data = (await response.json()) as Array<{
      number: number;
      title: string;
      html_url: string;
      state: string;
      pull_request?: unknown;
    }>;

    // A API do GitHub retorna PRs junto com issues; filtramos para manter só issues de verdade.
    return data
      .filter((item) => !item.pull_request)
      .map((item) => ({
        number: item.number,
        title: item.title,
        url: item.html_url,
        state: item.state,
      }));
  }

  async commentOnIssue(issueNumber: number, body: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/repos/${this.repo}/issues/${issueNumber}/comments`,
      {
        method: "POST",
        headers: { ...this.headers, "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      }
    );

    if (!response.ok) {
      throw new Error(`Falha ao comentar na issue #${issueNumber} (${response.status})`);
    }
  }
}
