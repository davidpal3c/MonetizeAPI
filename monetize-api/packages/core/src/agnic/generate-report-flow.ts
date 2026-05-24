import type { EndpointInput } from "@monetize-api/schemas";

import { buildReportPackage, type ReportPackage } from "../artifacts/package-report.js";
import { generateMonetizationReport } from "../generate-report.js";
import { parseFixtureText } from "../parse-fixture.js";
import { COMPANY_RISK_SCORE_FIXTURE, loadCompanyRiskScoreFixture } from "../load-fixture.js";
import { callAgnicChatCompletion } from "./adapter.js";
import type { AgnicConfig } from "./config.js";

export const REPORT_GENERATION_PROMPT_PREFIX =
  "You are MonetizeAPI. Analyze this API endpoint input for monetization potential. Reply in 2-3 sentences with pricing and agent-readiness guidance:\n\n";

export type PaidReportGenerationResult = {
  package: ReportPackage;
  parseSource: "user_input" | "fixture_fallback";
};

async function resolveEndpointInputAsync(rawInput: string): Promise<{
  endpoint: EndpointInput;
  parseSource: "user_input" | "fixture_fallback";
}> {
  const trimmed = rawInput.trim();
  if (trimmed) {
    try {
      return {
        endpoint: parseFixtureText(trimmed, "user-input"),
        parseSource: "user_input",
      };
    } catch {
      // fall through
    }
  }

  const fixtureRaw = await loadCompanyRiskScoreFixture();
  return {
    endpoint: parseFixtureText(fixtureRaw, COMPANY_RISK_SCORE_FIXTURE),
    parseSource: "fixture_fallback",
  };
}

export async function generateFixtureReportPackage(
  rawInput?: string,
): Promise<PaidReportGenerationResult> {
  const { endpoint, parseSource } = await resolveEndpointInputAsync(rawInput ?? "");
  const report = generateMonetizationReport(endpoint);

  return {
    parseSource,
    package: buildReportPackage({
      report,
      mode: "fixture",
    }),
  };
}

export async function generatePaidReportPackage(params: {
  config: AgnicConfig;
  rawInput: string;
}): Promise<PaidReportGenerationResult> {
  const { endpoint, parseSource } = await resolveEndpointInputAsync(params.rawInput);
  const prompt = `${REPORT_GENERATION_PROMPT_PREFIX}${params.rawInput.trim() || endpoint.path}`;

  const modelResult = await callAgnicChatCompletion(params.config, prompt, {
    maxTokens: 256,
  });

  const report = generateMonetizationReport(endpoint, {
    generatedAt: new Date().toISOString(),
    summaryPrefix: modelResult.content,
  });

  return {
    parseSource,
    package: buildReportPackage({
      report,
      mode: "live",
      model: modelResult.model,
      modelInsight: modelResult.content,
      usage: modelResult.usage,
    }),
  };
}
