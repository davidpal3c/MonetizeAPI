import type { EndpointInput } from "@monetize-api/schemas";
import { EndpointInputSchema } from "@monetize-api/schemas";

import { parseFixtureText } from "./parse-fixture.js";

export class EndpointParseError extends Error {
  readonly code = "parse_failed" as const;

  constructor(message: string) {
    super(message);
    this.name = "EndpointParseError";
  }
}

export type ParseEndpointResult =
  | { ok: true; endpoint: EndpointInput }
  | { ok: false; error: string };

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "that",
  "this",
  "with",
  "from",
  "for",
  "and",
  "or",
  "to",
  "in",
  "on",
  "is",
  "are",
  "be",
  "by",
  "your",
  "our",
  "api",
  "endpoint",
  "post",
  "get",
  "put",
  "patch",
  "delete",
]);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function toFieldName(fragment: string): string {
  const cleaned = fragment.trim().toLowerCase();
  if (!cleaned) {
    return "";
  }
  if (cleaned.includes("company") && cleaned.includes("name")) {
    return "companyName";
  }
  if (cleaned === "domain" || cleaned.includes("domain name")) {
    return "domain";
  }
  if (cleaned.includes("email")) {
    return "email";
  }
  if (cleaned.includes("user id") || cleaned === "userid") {
    return "userId";
  }
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "";
  }
  const camel =
    words[0] +
    words
      .slice(1)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  return camel.replace(/[^a-zA-Z0-9]/g, "");
}

function looksLikeStructuredFixture(raw: string): boolean {
  const firstLine = raw
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  if (!firstLine) {
    return false;
  }
  return /^(GET|POST|PUT|PATCH|DELETE)\s+\//i.test(firstLine);
}

function extractInputFields(text: string): string[] {
  const fields = new Set<string>();
  const lower = text.toLowerCase();

  if (/company\s*names?/.test(lower)) {
    fields.add("companyName");
  }
  if (/\bdomains?\b/.test(lower)) {
    fields.add("domain");
  }
  if (/\bemails?\b/.test(lower)) {
    fields.add("email");
  }
  if (/\buser\s*ids?\b/.test(lower)) {
    fields.add("userId");
  }

  const fromMatch = lower.match(/\bfrom\s+([^.;\n]+)/);
  if (fromMatch?.[1]) {
    for (const fragment of fromMatch[1].split(/\s+and\s+|,\s*/)) {
      const name = toFieldName(fragment);
      if (name) {
        fields.add(name);
      }
    }
  }

  const usingMatch = lower.match(/\busing\s+([^.;\n]+)/);
  if (usingMatch?.[1]) {
    for (const fragment of usingMatch[1].split(/\s+and\s+|,\s*/)) {
      const name = toFieldName(fragment);
      if (name) {
        fields.add(name);
      }
    }
  }

  return [...fields];
}

function extractOutputFields(text: string): string[] {
  const lower = text.toLowerCase();
  const fields: string[] = [];

  if (/risk\s*score|score\s*company|company\s*risk/.test(lower)) {
    fields.push("risk score");
  }
  if (/sanctions?/.test(lower)) {
    fields.push("sanctions flags");
  }
  if (/\besg\b/.test(lower)) {
    fields.push("ESG notes");
  }
  if (/supplier/.test(lower)) {
    fields.push("supplier notes");
  }
  if (/enrich|summary|summariz/.test(lower)) {
    fields.push("enriched content");
  }
  if (/metadata/.test(lower)) {
    fields.push("metadata");
  }

  if (fields.length === 0) {
    fields.push("result");
  }

  return fields;
}

function inferPath(text: string): string {
  const explicit = text.match(/\/[a-zA-Z0-9][a-zA-Z0-9_/-]*/)?.[0];
  if (explicit) {
    return explicit.split(/\s/)[0] ?? explicit;
  }

  const lower = text.toLowerCase();
  if (/company[\s-]*risk|risk[\s-]*score/.test(lower)) {
    return "/company-risk-score";
  }
  if (/enrich|summariz/.test(lower)) {
    return "/content-enrichment";
  }

  const words = lower
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  return `/api/${words.slice(0, 4).join("-") || "custom-endpoint"}`;
}

function inferTargetUsers(text: string): string {
  const lower = text.toLowerCase();
  if (/procurement|vendor/.test(lower)) {
    return "procurement teams and AI research agents";
  }
  if (/agent|automation/.test(lower)) {
    return "AI agents and automation workflows";
  }
  if (/developer|engineer/.test(lower)) {
    return "developers integrating paid API calls";
  }
  return "teams building paid, machine-callable API products";
}

function inferExpectedUsage(text: string): string {
  const lower = text.toLowerCase();
  if (/high[\s-]*volume|frequent/.test(lower)) {
    return "high-volume, machine-callable endpoint";
  }
  if (/low[\s-]*frequency|occasional/.test(lower)) {
    return "low-frequency, high-value, machine-callable endpoint";
  }
  return "on-demand, machine-callable endpoint";
}

function inferCostUsd(text: string): number {
  const perCall =
    text.match(/\$?\s*(\d+(?:\.\d+)?)\s*(?:USD|usd)?\s*(?:\/|per)\s*call/i) ??
    text.match(/cost[:\s]+\$?(\d+(?:\.\d+)?)/i);
  if (perCall?.[1]) {
    const amount = Number.parseFloat(perCall[1]);
    if (Number.isFinite(amount)) {
      return amount;
    }
  }
  return 0.04;
}

function inferDomain(text: string): string {
  const lower = text.toLowerCase();
  if (/content|enrich|summariz|document/.test(lower)) {
    return "content";
  }
  return "data_api";
}

/** Derive a valid EndpointInput from plain-language API descriptions. */
export function inferFreeTextEndpoint(
  raw: string,
  sourceFixture?: string,
): EndpointInput {
  const text = raw.trim();
  const methodMatch = text.match(/\b(GET|POST|PUT|PATCH|DELETE)\b/i);
  const method = (methodMatch?.[1] ?? "POST").toUpperCase();
  const path = inferPath(text);

  const inputFields = extractInputFields(text);
  if (inputFields.length === 0) {
    inputFields.push("input");
  }

  const outputFields = extractOutputFields(text);

  return EndpointInputSchema.parse({
    method,
    path,
    inputFields,
    outputFields,
    targetUsers: inferTargetUsers(text),
    estimatedCostPerCallUsd: inferCostUsd(text),
    expectedUsage: inferExpectedUsage(text),
    domain: inferDomain(text),
    sourceFixture,
  });
}

export function tryParseEndpointInput(
  raw: string,
  sourceLabel = "user-input",
): ParseEndpointResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Describe your API or endpoint before generating a report." };
  }

  if (looksLikeStructuredFixture(trimmed)) {
    try {
      return {
        ok: true,
        endpoint: parseFixtureText(trimmed, sourceLabel),
      };
    } catch {
      // Fall through to free-text inference.
    }
  }

  try {
    return {
      ok: true,
      endpoint: inferFreeTextEndpoint(trimmed, sourceLabel),
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not interpret endpoint description.";
    return { ok: false, error: message };
  }
}

export function parseEndpointInputOrThrow(
  raw: string,
  sourceLabel = "user-input",
): EndpointInput {
  const result = tryParseEndpointInput(raw, sourceLabel);
  if (!result.ok) {
    throw new EndpointParseError(result.error);
  }
  return result.endpoint;
}
