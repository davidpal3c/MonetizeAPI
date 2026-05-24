/**
 * Fixed MonetizeAPI fee shown before live report generation.
 * This is the Agnic wallet charge for the narrative enrichment call — not the
 * endpoint's suggested x402 price and not live settlement.
 */
export const MONETIZEAPI_LIVE_REPORT_GENERATION_FEE_USD = 0.03;

export function formatMonetizeApiReportGenerationFee(
  amountUsd: number = MONETIZEAPI_LIVE_REPORT_GENERATION_FEE_USD,
): string {
  return `$${amountUsd.toFixed(2)} USD`;
}
