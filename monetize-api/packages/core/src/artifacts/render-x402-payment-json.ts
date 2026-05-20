import type { MonetizationReport } from "@monetize-api/schemas";

export function renderX402PaymentJson(report: MonetizationReport): string {
  return `${JSON.stringify(report.x402Payment, null, 2)}\n`;
}
