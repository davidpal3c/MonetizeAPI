import type { EndpointInput, MonetizationReport } from "@monetize-api/schemas";
import { MonetizationReportSchema } from "@monetize-api/schemas";
import { z } from "zod";

import { callAgnicChatCompletion } from "./adapter.js";
import type { AgnicConfig } from "./config.js";

const NarrativeEnhancementSchema = z.object({
  summary: z.string().min(1).max(2000).optional(),
  pricingRationale: z.string().min(1).max(1000).optional(),
  quotaRationale: z.string().min(1).max(1000).optional(),
  accessModelRationale: z.string().min(1).max(1000).optional(),
  x402Rationale: z.string().min(1).max(1000).optional(),
  risks: z.array(z.string().min(1).max(500)).min(1).max(8).optional(),
  docsOverview: z.string().min(1).max(1500).optional(),
  usageNotes: z.string().min(1).max(1000).optional(),
  launchChecklistNotes: z.array(z.string().min(1).max(300)).min(1).max(8).optional(),
});

export type ReportNarrativeEnhancement = z.infer<typeof NarrativeEnhancementSchema>;

export class NarrativeEnhancementError extends Error {
  readonly code = "narrative_invalid" as const;

  constructor(message: string) {
    super(message);
    this.name = "NarrativeEnhancementError";
  }
}

function buildNarrativePrompt(endpoint: EndpointInput, rawInput: string): string {
  return [
    "You are MonetizeAPI. Return ONLY valid JSON (no markdown fences) with optional keys:",
    "summary, pricingRationale, quotaRationale, accessModelRationale, x402Rationale, risks (string array),",
    "docsOverview, usageNotes, launchChecklistNotes (string array).",
    "Write concise, specific guidance for THIS endpoint only.",
    "Do not invent pricing numbers, quota numbers, or schema fields.",
    "",
    "Endpoint:",
    `${endpoint.method} ${endpoint.path}`,
    `Domain: ${endpoint.domain}`,
    `Input fields: ${endpoint.inputFields.join(", ")}`,
    `Output fields: ${endpoint.outputFields.join(", ")}`,
    `Target users: ${endpoint.targetUsers}`,
    `Expected usage: ${endpoint.expectedUsage}`,
    "",
    "User input:",
    rawInput.trim(),
  ].join("\n");
}

function extractJsonObject(content: string): unknown {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new NarrativeEnhancementError("Model response did not contain a JSON object.");
  }

  return JSON.parse(candidate.slice(start, end + 1)) as unknown;
}

export function parseAndValidateNarrativeEnhancement(
  content: string,
): ReportNarrativeEnhancement {
  let parsed: unknown;
  try {
    parsed = extractJsonObject(content);
  } catch (err) {
    if (err instanceof NarrativeEnhancementError) {
      throw err;
    }
    throw new NarrativeEnhancementError("Model response was not valid JSON.");
  }

  const result = NarrativeEnhancementSchema.safeParse(parsed);
  if (!result.success) {
    throw new NarrativeEnhancementError(
      `Model JSON failed validation: ${result.error.issues.map((i) => i.message).join("; ")}`,
    );
  }

  if (Object.keys(result.data).length === 0) {
    throw new NarrativeEnhancementError("Model JSON contained no usable narrative fields.");
  }

  return result.data;
}

export async function generateReportNarrativeEnhancement(params: {
  config: AgnicConfig;
  endpoint: EndpointInput;
  rawInput: string;
}): Promise<{
  enhancement: ReportNarrativeEnhancement;
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}> {
  const prompt = buildNarrativePrompt(params.endpoint, params.rawInput);
  const result = await callAgnicChatCompletion(params.config, prompt, { maxTokens: 512 });
  return {
    enhancement: parseAndValidateNarrativeEnhancement(result.content),
    model: result.model,
    usage: result.usage,
  };
}

export function applyNarrativeEnhancement(
  report: MonetizationReport,
  enhancement: ReportNarrativeEnhancement,
): MonetizationReport {
  const launchItems = report.launchChecklist.items.map((item, index) => {
    const note = enhancement.launchChecklistNotes?.[index];
    if (!note) {
      return item;
    }
    return { ...item, label: `${item.label} — ${note}` };
  });

  const docsMarkdown = report.docs.markdown;
  const usageSection = enhancement.usageNotes
    ? `\n\n## Usage notes\n\n${enhancement.usageNotes}`
    : "";

  const merged: MonetizationReport = {
    ...report,
    summary: enhancement.summary ?? report.summary,
    pricing: {
      ...report.pricing,
      rationale: enhancement.pricingRationale ?? report.pricing.rationale,
    },
    quota: {
      ...report.quota,
      rationale: enhancement.quotaRationale ?? report.quota.rationale,
    },
    accessModel: {
      ...report.accessModel,
      rationale: enhancement.accessModelRationale ?? report.accessModel.rationale,
    },
    x402Suitability: {
      ...report.x402Suitability,
      rationale: enhancement.x402Rationale ?? report.x402Suitability.rationale,
    },
    abuseCostRisks: enhancement.risks ?? report.abuseCostRisks,
    docs: {
      ...report.docs,
      summary: enhancement.docsOverview ?? report.docs.summary,
      markdown: enhancement.docsOverview
        ? `# ${report.docs.title}\n\n${enhancement.docsOverview}${usageSection}`
        : `${docsMarkdown}${usageSection}`,
    },
    launchChecklist: {
      ...report.launchChecklist,
      items: launchItems,
    },
  };

  return MonetizationReportSchema.parse(merged);
}
