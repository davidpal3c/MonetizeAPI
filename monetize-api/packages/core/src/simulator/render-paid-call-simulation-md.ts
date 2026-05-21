import type { PaidCallSimulation } from "@monetize-api/schemas";

function phaseTitle(phase: string): string {
  switch (phase) {
    case "endpoint_request":
      return "Endpoint request";
    case "payment_required":
      return "Payment required (402)";
    case "payment_authorized":
      return "Payment authorized (simulated)";
    case "tool_call_allowed":
      return "Tool call allowed";
    case "usage_recorded":
      return "Usage recorded";
    default:
      return phase;
  }
}

export function renderPaidCallSimulationMd(simulation: PaidCallSimulation): string {
  const timeline = simulation.timeline
    .map(
      (entry) =>
        `### Step ${entry.step}: ${phaseTitle(entry.phase)}\n\n` +
        `- **Time:** ${entry.timestamp}\n` +
        `- **Summary:** ${entry.summary}`,
    )
    .join("\n\n");

  return [
    "# Paid Call Simulation",
    "",
    `**Simulation ID:** ${simulation.simulationId}`,
    `**Report ID:** ${simulation.reportId}`,
    `**Generated:** ${simulation.generatedAt}`,
    `**Settlement mode:** ${simulation.settlementMode}`,
    "",
    "## Endpoint request",
    "",
    `\`${simulation.endpointRequest.method} ${simulation.endpointRequest.path}\``,
    "",
    "```json",
    JSON.stringify(simulation.endpointRequest.body, null, 2),
    "```",
    "",
    "## Payment required",
    "",
    `- **HTTP status:** ${simulation.paymentRequired.httpStatus}`,
    `- **Reason:** ${simulation.paymentRequired.reason}`,
    `- **Price per call:** $${simulation.paymentRequired.x402.pricePerCallUsd.toFixed(2)} ${simulation.paymentRequired.x402.currency}`,
    `- **Resource:** ${simulation.paymentRequired.x402.resource}`,
    "",
    "## Payment authorization",
    "",
    `- **Call ID:** ${simulation.paymentAuthorization.callId}`,
    `- **Status:** ${simulation.paymentAuthorization.status}`,
    `- **Charged:** $${simulation.paymentAuthorization.priceChargedUsd.toFixed(2)} ${simulation.paymentAuthorization.currency}`,
    `- **Payer:** ${simulation.paymentAuthorization.payerType}`,
    "",
    "## Tool call",
    "",
    `- **Tool:** ${simulation.toolCallAllowed.toolName}`,
    `- **Allowed:** yes`,
    "",
    "## Usage event",
    "",
    `- **Event ID:** ${simulation.usageEvent.eventId}`,
    `- **Caller:** ${simulation.usageEvent.callerType}`,
    `- **Units:** ${simulation.usageEvent.units}`,
    `- **Cost:** $${simulation.usageEvent.costUsd.toFixed(2)} USD`,
    `- **Outcome:** ${simulation.usageEvent.outcome}`,
    "",
    "## Timeline",
    "",
    timeline,
    "",
  ].join("\n");
}
