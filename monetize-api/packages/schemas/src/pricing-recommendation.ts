import { z } from "zod";

export const PricingRecommendationSchema = z.object({
  model: z.enum(["per_call", "subscription", "hybrid"]),
  suggestedPricePerCallUsd: z.number().nonnegative(),
  estimatedMarginPercent: z.number().min(0).max(100),
  rationale: z.string().min(1),
  currency: z.literal("USD").default("USD"),
});

export type PricingRecommendation = z.infer<typeof PricingRecommendationSchema>;
