import type { AgnicConfig } from "./config.js";

export type AgnicChatCompletionResult = {
  model: string;
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

type OpenAIChatResponse = {
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
};

export async function callAgnicChatCompletion(
  config: AgnicConfig,
  prompt: string,
): Promise<AgnicChatCompletionResult> {
  const endpoint = `${config.baseUrl}/chat/completions`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
      "X-Partner-Id": config.partnerId,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 120,
    }),
  });

  const body = (await response.json()) as OpenAIChatResponse;

  if (!response.ok) {
    const message =
      body.error?.message ?? `Agnic request failed with HTTP ${response.status}`;
    const error = new Error(message) as Error & { httpStatus?: number };
    error.httpStatus = response.status;
    throw error;
  }

  const content = body.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Agnic response did not include message content.");
  }

  return {
    model: body.model ?? config.model,
    content,
    usage: body.usage,
  };
}
