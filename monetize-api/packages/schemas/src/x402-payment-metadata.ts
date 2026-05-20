import { z } from "zod";

export const X402PaymentMetadataSchema = z.object({
  protocol: z.literal("x402"),
  mode: z.literal("simulated"),
  pricePerCallUsd: z.number().nonnegative(),
  currency: z.literal("USD"),
  settlement: z.literal("deferred"),
  resource: z.string().min(1),
  headers: z.record(z.string()).default({}),
});

export type X402PaymentMetadata = z.infer<typeof X402PaymentMetadataSchema>;
