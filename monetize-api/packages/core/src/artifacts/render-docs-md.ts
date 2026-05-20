import type { MonetizationReport } from "@monetize-api/schemas";

export function renderDocsMd(report: MonetizationReport): string {
  const { docs, endpoint } = report;

  return [
    `# ${docs.title}`,
    "",
    docs.summary,
    "",
    "## Endpoint",
    "",
    `\`${endpoint.method} ${endpoint.path}\``,
    "",
    "## Example request",
    "",
    "```http",
    docs.exampleRequest,
    "```",
    "",
    "## Example response",
    "",
    "```json",
    docs.exampleResponse,
    "```",
    "",
    "## Usage",
    "",
    docs.markdown,
    "",
  ].join("\n");
}
