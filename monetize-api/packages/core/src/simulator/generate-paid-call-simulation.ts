import type { MonetizationReport, PaidCallSimulation } from "@monetize-api/schemas";
import { PaidCallSimulationSchema } from "@monetize-api/schemas";

const SIMULATION_ID = "sim-timeline-company-risk-score-v1";
const BASE_TIMESTAMP = "2026-05-16T00:00:00.000Z";

function offsetTimestamp(base: string, offsetMs: number): string {
  const time = new Date(base).getTime() + offsetMs;
  return new Date(time).toISOString();
}

export function generatePaidCallSimulation(
  report: MonetizationReport,
): PaidCallSimulation {
  const { endpoint, simulatedPaidCall, usageEvent, x402Payment, mcpTool } = report;

  const simulation: PaidCallSimulation = {
    simulationId: SIMULATION_ID,
    reportId: report.reportId,
    generatedAt: BASE_TIMESTAMP,
    fixtureMode: true,
    settlementMode: "simulated",
    endpointRequest: {
      method: simulatedPaidCall.method,
      path: simulatedPaidCall.endpoint,
      headers: {
        "Content-Type": "application/json",
        "X-Caller-Type": simulatedPaidCall.payerType,
      },
      body: simulatedPaidCall.requestPayload,
    },
    paymentRequired: {
      httpStatus: 402,
      reason: "Payment required before tool execution (x402 simulated).",
      x402: x402Payment,
    },
    paymentAuthorization: {
      callId: simulatedPaidCall.callId,
      status: simulatedPaidCall.status,
      priceChargedUsd: simulatedPaidCall.priceChargedUsd,
      currency: simulatedPaidCall.currency,
      payerType: simulatedPaidCall.payerType,
    },
    toolCallAllowed: {
      toolName: mcpTool.name,
      allowed: true,
      mcpTool,
    },
    usageEvent,
    timeline: [
      {
        step: 1,
        phase: "endpoint_request",
        timestamp: offsetTimestamp(BASE_TIMESTAMP, 0),
        summary: `${simulatedPaidCall.method} ${simulatedPaidCall.endpoint} received from ${simulatedPaidCall.payerType} caller.`,
      },
      {
        step: 2,
        phase: "payment_required",
        timestamp: offsetTimestamp(BASE_TIMESTAMP, 100),
        summary: `HTTP 402 returned with x402 metadata for $${x402Payment.pricePerCallUsd.toFixed(2)} ${x402Payment.currency} per call.`,
      },
      {
        step: 3,
        phase: "payment_authorized",
        timestamp: offsetTimestamp(BASE_TIMESTAMP, 200),
        summary: `Simulated payment ${simulatedPaidCall.status} for call ${simulatedPaidCall.callId}.`,
      },
      {
        step: 4,
        phase: "tool_call_allowed",
        timestamp: offsetTimestamp(BASE_TIMESTAMP, 300),
        summary: `MCP tool ${mcpTool.name} execution allowed after simulated authorization.`,
      },
      {
        step: 5,
        phase: "usage_recorded",
        timestamp: offsetTimestamp(BASE_TIMESTAMP, 400),
        summary: `Usage event ${usageEvent.eventId} recorded with outcome ${usageEvent.outcome}.`,
      },
    ],
  };

  return PaidCallSimulationSchema.parse(simulation);
}
