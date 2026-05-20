import type { EndpointInput } from "@monetize-api/schemas";
import { EndpointInputSchema } from "@monetize-api/schemas";

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCostUsd(value: string): number {
  const normalized = value.replace(/^\$/, "").trim();
  const amount = Number.parseFloat(normalized);
  if (Number.isNaN(amount)) {
    throw new Error(`Invalid estimated cost: ${value}`);
  }
  return amount;
}

export function parseFixtureText(
  raw: string,
  sourceFixture?: string,
): EndpointInput {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const fields = new Map<string, string>();
  for (const line of lines) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    fields.set(key, value);
  }

  const route = lines[0];
  if (!route) {
    throw new Error("Fixture must start with method and path.");
  }

  const [method, path] = route.split(/\s+/);
  if (!method || !path) {
    throw new Error(`Invalid route line: ${route}`);
  }

  const input = {
    method: method.toUpperCase(),
    path,
    inputFields: parseList(fields.get("Input") ?? ""),
    outputFields: parseList(fields.get("Output") ?? ""),
    targetUsers: fields.get("Target users") ?? "",
    estimatedCostPerCallUsd: parseCostUsd(
      fields.get("Estimated cost per call") ?? "",
    ),
    expectedUsage: fields.get("Expected usage") ?? "",
    domain: fields.get("Domain") ?? "",
    sourceFixture,
  };

  return EndpointInputSchema.parse(input);
}
