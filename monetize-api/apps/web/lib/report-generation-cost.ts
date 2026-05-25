/** Client-safe estimated live report fee (see core agnic/report-generation-cost.ts). */

export const MONETIZEAPI_LIVE_REPORT_GENERATION_FEE_USD = 0.03;

export function formatMonetizeApiReportGenerationFee(
  amountUsd: number = MONETIZEAPI_LIVE_REPORT_GENERATION_FEE_USD,
): string {
  return `$${amountUsd.toFixed(2)} USD`;
}
