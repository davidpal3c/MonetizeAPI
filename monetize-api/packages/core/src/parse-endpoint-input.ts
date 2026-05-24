import type { EndpointInput } from "@monetize-api/schemas";

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

export function tryParseEndpointInput(
  raw: string,
  sourceLabel = "user-input",
): ParseEndpointResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Endpoint input is empty." };
  }

  try {
    return {
      ok: true,
      endpoint: parseFixtureText(trimmed, sourceLabel),
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not parse endpoint/API text.";
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
