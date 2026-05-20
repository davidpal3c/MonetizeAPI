import type { MonetizationReport } from "@monetize-api/schemas";

export function renderMcpToolJson(report: MonetizationReport): string {
  return `${JSON.stringify(report.mcpTool, null, 2)}\n`;
}
