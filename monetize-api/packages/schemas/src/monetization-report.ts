import { z } from "zod";

import { AccessModelRecommendationSchema } from "./access-model-recommendation.js";
import { CeibaPolicyDraftSchema } from "./ceiba-policy-draft.js";
import { DocsSnippetSchema } from "./docs-snippet.js";
import { EndpointInputSchema } from "./endpoint-input.js";
import { LaunchChecklistSchema } from "./launch-checklist.js";
import { McpToolDefinitionSchema } from "./mcp-tool-definition.js";
import { PricingRecommendationSchema } from "./pricing-recommendation.js";
import { QuotaRecommendationSchema } from "./quota-recommendation.js";
import { SimulatedPaidCallSchema } from "./simulated-paid-call.js";
import { UsageEventSchema } from "./usage-event.js";
import { X402PaymentMetadataSchema } from "./x402-payment-metadata.js";
import { X402SuitabilitySchema } from "./x402-suitability.js";

export const MonetizationReportSchema = z.object({
  reportId: z.string().min(1),
  generatedAt: z.string().datetime(),
  fixtureMode: z.boolean(),
  endpoint: EndpointInputSchema,
  summary: z.string().min(1),
  readinessScore: z.number().int().min(0).max(100),
  pricing: PricingRecommendationSchema,
  quota: QuotaRecommendationSchema,
  accessModel: AccessModelRecommendationSchema,
  x402Suitability: X402SuitabilitySchema,
  abuseCostRisks: z.array(z.string()).min(1),
  ceibaPolicy: CeibaPolicyDraftSchema,
  mcpTool: McpToolDefinitionSchema,
  x402Payment: X402PaymentMetadataSchema,
  docs: DocsSnippetSchema,
  launchChecklist: LaunchChecklistSchema,
  simulatedPaidCall: SimulatedPaidCallSchema,
  usageEvent: UsageEventSchema,
});

export type MonetizationReport = z.infer<typeof MonetizationReportSchema>;
