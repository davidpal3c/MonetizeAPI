import { z } from "zod";

export const X402SuitabilitySchema = z.object({
  score: z.number().int().min(0).max(100),
  level: z.enum(["low", "medium", "high"]),
  machineCallable: z.boolean(),
  idempotent: z.boolean(),
  rationale: z.string().min(1),
  blockers: z.array(z.string()).default([]),
});

export type X402Suitability = z.infer<typeof X402SuitabilitySchema>;
