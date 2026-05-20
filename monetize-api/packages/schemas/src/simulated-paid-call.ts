import { z } from "zod";

export const SimulatedPaidCallSchema = z.object({
  callId: z.string().min(1),
  endpoint: z.string().min(1),
  method: z.string().min(1),
  status: z.enum(["authorized", "settled_simulated", "rejected"]),
  priceChargedUsd: z.number().nonnegative(),
  currency: z.literal("USD"),
  payerType: z.enum(["agent", "human", "system"]),
  settlementMode: z.literal("simulated"),
  requestPayload: z.record(z.unknown()),
  responseSummary: z.string().min(1),
});

export type SimulatedPaidCall = z.infer<typeof SimulatedPaidCallSchema>;
