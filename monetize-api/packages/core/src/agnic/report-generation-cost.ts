/**
 * Estimated MonetizeAPI fee shown before live report generation.
 * Not a confirmed Agnic debit unless balance proof shows a matching delta.
 */
export const MONETIZEAPI_LIVE_REPORT_GENERATION_FEE_USD = 0.03;

export function formatMonetizeApiReportGenerationFee(
  amountUsd: number = MONETIZEAPI_LIVE_REPORT_GENERATION_FEE_USD,
): string {
  return `$${amountUsd.toFixed(2)} USD`;
}
