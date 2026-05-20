import { z } from "zod";

export const AccessModelRecommendationSchema = z.object({
  primary: z.enum(["api_key", "oauth", "x402", "hybrid"]),
  secondary: z.array(z.enum(["api_key", "oauth", "x402"])).default([]),
  agentReady: z.boolean(),
  humanReady: z.boolean(),
  rationale: z.string().min(1),
});

export type AccessModelRecommendation = z.infer<
  typeof AccessModelRecommendationSchema
>;
