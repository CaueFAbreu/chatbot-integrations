import { IntentHandler, IntentContext } from "./IntentHandler";
import { GithubClient } from "../services/githubClient";

const GITHUB_PATTERN = /\b(issue|issues|pull request|pr\b)/i;

export class GithubHandler implements IntentHandler {
  readonly name = "github";

  constructor(private readonly githubClient: GithubClient) {}

  matches(text: string): boolean {
    return GITHUB_PATTERN.test(text);
  }

  async handle(_context: IntentContext): Promise<string> {
    const issues = await this.githubClient.listOpenIssues();

    if (issues.length === 0) {
      return "Não há issues abertas no repositório no momento. 🎉";
    }

    const lines = issues
      .slice(0, 5)
      .map((issue) => `#${issue.number} — ${issue.title} (${issue.url})`);

    return `Issues abertas:\n${lines.join("\n")}`;
  }
}
