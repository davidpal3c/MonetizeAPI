import { z } from "zod";

export const CeibaPolicyDraftSchema = z.object({
  version: z.literal("0.1"),
  endpointId: z.string().min(1),
  access: z.object({
    modes: z.array(z.enum(["api_key", "oauth", "x402"])).min(1),
    defaultMode: z.enum(["api_key", "oauth", "x402"]),
  }),
  pricing: z.object({
    model: z.enum(["per_call", "subscription", "hybrid"]),
    pricePerCallUsd: z.number().nonnegative(),
    currency: z.literal("USD"),
  }),
  quotas: z.object({
    requestsPerDay: z.number().int().positive(),
    burstLimit: z.number().int().positive(),
  }),
  enforcement: z.object({
    runtime: z.literal("ceiba-runtime-deferred"),
    controlPlane: z.literal("ceiba-control-plane-deferred"),
  }),
});

export type CeibaPolicyDraft = z.infer<typeof CeibaPolicyDraftSchema>;
