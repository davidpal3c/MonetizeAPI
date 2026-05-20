import type { MonetizationReport } from "@monetize-api/schemas";

export function renderCeibaPolicyJson(report: MonetizationReport): string {
  return `${JSON.stringify(report.ceibaPolicy, null, 2)}\n`;
}
