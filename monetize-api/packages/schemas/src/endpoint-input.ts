import { z } from "zod";

export const EndpointInputSchema = z.object({
  method: z.string().min(1),
  path: z.string().min(1),
  inputFields: z.array(z.string().min(1)).min(1),
  outputFields: z.array(z.string().min(1)).min(1),
  targetUsers: z.string().min(1),
  estimatedCostPerCallUsd: z.number().nonnegative(),
  expectedUsage: z.string().min(1),
  domain: z.string().min(1),
  sourceFixture: z.string().optional(),
});

export type EndpointInput = z.infer<typeof EndpointInputSchema>;
