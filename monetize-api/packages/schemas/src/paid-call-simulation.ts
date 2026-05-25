import { z } from "zod";

import { McpToolDefinitionSchema } from "./mcp-tool-definition.js";
import { UsageEventSchema } from "./usage-event.js";
import { X402PaymentMetadataSchema } from "./x402-payment-metadata.js";

export const PaidCallSimulationStepSchema = z.object({
  step: z.number().int().positive(),
  phase: z.enum([
    "endpoint_request",
    "payment_required",
    "payment_authorized",
    "tool_call_allowed",
    "usage_recorded",
  ]),
  timestamp: z.string().datetime(),
  summary: z.string().min(1),
});

export const PaidCallSimulationSchema = z.object({
  simulationId: z.string().min(1),
  reportId: z.string().min(1),
  generatedAt: z.string().datetime(),
  fixtureMode: z.boolean(),
  settlementMode: z.literal("simulated"),
  endpointRequest: z.object({
    method: z.string().min(1),
    path: z.string().min(1),
    headers: z.record(z.string()),
    body: z.record(z.unknown()),
  }),
  paymentRequired: z.object({
    httpStatus: z.literal(402),
    reason: z.string().min(1),
    x402: X402PaymentMetadataSchema,
  }),
  paymentAuthorization: z.object({
    callId: z.string().min(1),
    status: z.enum(["authorized", "settled_simulated", "rejected"]),
    priceChargedUsd: z.number().nonnegative(),
    currency: z.literal("USD"),
    payerType: z.enum(["agent", "human", "system"]),
  }),
  toolCallAllowed: z.object({
    toolName: z.string().min(1),
    allowed: z.literal(true),
    mcpTool: McpToolDefinitionSchema,
  }),
  usageEvent: UsageEventSchema,
  timeline: z.array(PaidCallSimulationStepSchema).min(5),
});

export type PaidCallSimulationStep = z.infer<typeof PaidCallSimulationStepSchema>;
export type PaidCallSimulation = z.infer<typeof PaidCallSimulationSchema>;
