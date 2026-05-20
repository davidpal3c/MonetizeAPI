import { z } from "zod";

export const UsageEventSchema = z.object({
  eventId: z.string().min(1),
  timestamp: z.string().datetime(),
  endpoint: z.string().min(1),
  callerType: z.enum(["agent", "human", "system"]),
  units: z.number().int().positive(),
  costUsd: z.number().nonnegative(),
  outcome: z.enum(["success", "error", "throttled"]),
});

export type UsageEvent = z.infer<typeof UsageEventSchema>;
