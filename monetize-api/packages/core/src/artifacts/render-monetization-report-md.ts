import type { MonetizationReport } from "@monetize-api/schemas";

function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

export function renderMonetizationReportMd(report: MonetizationReport): string {
  const { endpoint } = report;

  return [
    "# Monetization Report",
    "",
    `**Report ID:** ${report.reportId}`,
    `**Generated:** ${report.generatedAt}`,
    `**Fixture mode:** ${report.fixtureMode ? "yes" : "no"}`,
    `**Readiness score:** ${report.readinessScore}/100`,
    "",
    "## Summary",
    "",
    report.summary,
    "",
    "## Endpoint",
    "",
    `- **Method:** ${endpoint.method}`,
    `- **Path:** ${endpoint.path}`,
    `- **Domain:** ${endpoint.domain}`,
    `- **Target users:** ${endpoint.targetUsers}`,
    `- **Estimated cost per call:** $${endpoint.estimatedCostPerCallUsd.toFixed(2)} USD`,
    `- **Expected usage:** ${endpoint.expectedUsage}`,
    `- **Inputs:** ${endpoint.inputFields.join(", ")}`,
    `- **Outputs:** ${endpoint.outputFields.join(", ")}`,
    "",
    "## Pricing",
    "",
    `- **Model:** ${report.pricing.model}`,
    `- **Suggested price per call:** $${report.pricing.suggestedPricePerCallUsd.toFixed(2)} ${report.pricing.currency}`,
    `- **Estimated margin:** ${report.pricing.estimatedMarginPercent}%`,
    `- **Rationale:** ${report.pricing.rationale}`,
    "",
    "## Quota",
    "",
    `- **Tier:** ${report.quota.tier}`,
    `- **Requests per day:** ${report.quota.requestsPerDay}`,
    `- **Burst limit:** ${report.quota.burstLimit}`,
    `- **Rationale:** ${report.quota.rationale}`,
    "",
    "## Access model",
    "",
    `- **Primary:** ${report.accessModel.primary}`,
    `- **Secondary:** ${report.accessModel.secondary.join(", ") || "none"}`,
    `- **Agent ready:** ${report.accessModel.agentReady ? "yes" : "no"}`,
    `- **Human ready:** ${report.accessModel.humanReady ? "yes" : "no"}`,
    `- **Rationale:** ${report.accessModel.rationale}`,
    "",
    "## x402 suitability",
    "",
    `- **Score:** ${report.x402Suitability.score}/100 (${report.x402Suitability.level})`,
    `- **Machine callable:** ${report.x402Suitability.machineCallable ? "yes" : "no"}`,
    `- **Idempotent:** ${report.x402Suitability.idempotent ? "yes" : "no"}`,
    `- **Rationale:** ${report.x402Suitability.rationale}`,
    report.x402Suitability.blockers.length > 0
      ? `- **Blockers:**\n${bulletList(report.x402Suitability.blockers)}`
      : "",
    "",
    "## Abuse and cost risks",
    "",
    bulletList(report.abuseCostRisks),
    "",
    "## Simulated paid call",
    "",
    `- **Call ID:** ${report.simulatedPaidCall.callId}`,
    `- **Status:** ${report.simulatedPaidCall.status}`,
    `- **Price charged:** $${report.simulatedPaidCall.priceChargedUsd.toFixed(2)} ${report.simulatedPaidCall.currency}`,
    `- **Payer:** ${report.simulatedPaidCall.payerType}`,
    `- **Summary:** ${report.simulatedPaidCall.responseSummary}`,
    "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}
