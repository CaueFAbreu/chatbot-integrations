export interface GithubIssueDto {
  number: number;
  title: string;
  url: string;
  state: string;
}

/**
 * Adaptador HTTP para o microsserviço github-service.
 * Segue o mesmo princípio do LlmClient: o chat-engine só conhece
 * este contrato simples, nunca os detalhes da API do GitHub.
 */
export class GithubClient {
  constructor(private readonly baseUrl: string) {}

  async listOpenIssues(): Promise<GithubIssueDto[]> {
    const response = await fetch(`${this.baseUrl}/issues`);

    if (!response.ok) {
      throw new Error(`github-service respondeu com erro (${response.status})`);
    }

    const data = (await response.json()) as { issues: GithubIssueDto[] };
    return data.issues;
  }
}
