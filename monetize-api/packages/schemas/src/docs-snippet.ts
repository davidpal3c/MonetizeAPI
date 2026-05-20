import { z } from "zod";

export const DocsSnippetSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  exampleRequest: z.string().min(1),
  exampleResponse: z.string().min(1),
  markdown: z.string().min(1),
});

export type DocsSnippet = z.infer<typeof DocsSnippetSchema>;
