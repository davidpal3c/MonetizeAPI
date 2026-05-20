import { z } from "zod";

const JsonSchemaPropertySchema: z.ZodType<Record<string, unknown>> = z.lazy(() =>
  z
    .object({
      type: z.string().optional(),
      description: z.string().optional(),
      properties: z.record(JsonSchemaPropertySchema).optional(),
      required: z.array(z.string()).optional(),
      items: JsonSchemaPropertySchema.optional(),
    })
    .passthrough(),
);

export const McpToolDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  inputSchema: z.object({
    type: z.literal("object"),
    properties: z.record(JsonSchemaPropertySchema),
    required: z.array(z.string()).default([]),
  }),
});

export type McpToolDefinition = z.infer<typeof McpToolDefinitionSchema>;
