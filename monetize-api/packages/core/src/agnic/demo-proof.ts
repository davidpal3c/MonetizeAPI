import type { AgnicConfig } from "./config.js";
import { loadAgnicConfigFromEnv, normalizeAgnicModel } from "./config.js";
import { callAgnicChatCompletion } from "./adapter.js";
import type { AgnicDemoProof } from "./types.js";

/** Stable timestamp for skipped proofs so CLI runs do not churn the example file. */
export const SKIPPED_AGNIC_DEMO_PROOF_GENERATED_AT =
  "2026-05-16T00:00:00.000Z";

export const AGNIC_DEMO_PROOF_PROMPT =
  "In one sentence, explain why a company-risk-score API should use per-call pricing for procurement agents.";

function preview(text: string, max = 240): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}...`;
}

function baseProofFields(
  status: AgnicDemoProof["status"],
  reason: string,
  config?: AgnicConfig,
): AgnicDemoProof {
  const generatedAt =
    status === "skipped"
      ? SKIPPED_AGNIC_DEMO_PROOF_GENERATED_AT
      : new Date().toISOString();

  return {
    status,
    generatedAt,
    reason,
    env: {
      baseUrl: config?.baseUrl ?? process.env.AGNIC_BASE_URL ?? "https://api.agnic.ai/v1",
      model: normalizeAgnicModel(
        config?.model ?? process.env.AGNIC_MODEL ?? "openai/gpt-4o-mini",
      ),
      partnerIdSet: Boolean(process.env.AGNIC_PARTNER_ID?.trim()),
      accessTokenSet: Boolean(process.env.AGNIC_ACCESS_TOKEN?.trim()),
    },
  };
}

export async function runAgnicDemoProof(): Promise<AgnicDemoProof> {
  const credentialCheck = loadAgnicConfigFromEnv();

  if (!credentialCheck.ready || !credentialCheck.config) {
    return baseProofFields(
      "skipped",
      `Skipped Agnic demo proof. Missing env: ${credentialCheck.missing.join(", ")}`,
    );
  }

  const config = credentialCheck.config;
  const endpoint = `${config.baseUrl}/chat/completions`;

  try {
    const result = await callAgnicChatCompletion(config, AGNIC_DEMO_PROOF_PROMPT);

    return {
      ...baseProofFields("success", "Agnic model call succeeded.", config),
      request: {
        endpoint,
        method: "POST",
        headersSent: ["Authorization", "Content-Type", "X-Partner-Id"],
        prompt: AGNIC_DEMO_PROOF_PROMPT,
      },
      response: {
        model: result.model,
        replyPreview: preview(result.content),
        usage: {
          promptTokens: result.usage?.prompt_tokens,
          completionTokens: result.usage?.completion_tokens,
          totalTokens: result.usage?.total_tokens,
        },
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Agnic error";
    const httpStatus =
      error instanceof Error && "httpStatus" in error
        ? (error as Error & { httpStatus?: number }).httpStatus
        : undefined;

    return {
      ...baseProofFields("error", "Agnic model call failed.", config),
      request: {
        endpoint,
        method: "POST",
        headersSent: ["Authorization", "Content-Type", "X-Partner-Id"],
        prompt: AGNIC_DEMO_PROOF_PROMPT,
      },
      error: { message, httpStatus },
    };
  }
}
