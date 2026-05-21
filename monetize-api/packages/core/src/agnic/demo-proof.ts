import type { AgnicConfig } from "./config.js";
import { loadAgnicConfigFromEnv } from "./config.js";
import { callAgnicChatCompletion } from "./adapter.js";
import type { AgnicDemoProof } from "./types.js";

const DEMO_PROMPT =
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
  return {
    status,
    generatedAt: new Date().toISOString(),
    reason,
    env: {
      baseUrl: config?.baseUrl ?? process.env.AGNIC_BASE_URL ?? "https://api.agnic.ai/v1",
      model: config?.model ?? process.env.AGNIC_MODEL ?? "gpt-4o-mini",
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
    const result = await callAgnicChatCompletion(config, DEMO_PROMPT);

    return {
      ...baseProofFields("success", "Agnic model call succeeded.", config),
      request: {
        endpoint,
        method: "POST",
        headersSent: ["Authorization", "Content-Type", "X-Partner-Id"],
        prompt: DEMO_PROMPT,
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
        prompt: DEMO_PROMPT,
      },
      error: { message, httpStatus },
    };
  }
}
