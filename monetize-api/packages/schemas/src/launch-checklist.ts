import { z } from "zod";

export const LaunchChecklistItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(["todo", "in_progress", "done"]),
  notes: z.string().optional(),
});

export const LaunchChecklistSchema = z.object({
  title: z.string().min(1),
  items: z.array(LaunchChecklistItemSchema).min(1),
});

export type LaunchChecklistItem = z.infer<typeof LaunchChecklistItemSchema>;
export type LaunchChecklist = z.infer<typeof LaunchChecklistSchema>;
