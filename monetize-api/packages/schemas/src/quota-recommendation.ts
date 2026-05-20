import { z } from "zod";

export const QuotaRecommendationSchema = z.object({
  tier: z.enum(["starter", "growth", "enterprise"]),
  requestsPerDay: z.number().int().positive(),
  burstLimit: z.number().int().positive(),
  rationale: z.string().min(1),
});

export type QuotaRecommendation = z.infer<typeof QuotaRecommendationSchema>;
