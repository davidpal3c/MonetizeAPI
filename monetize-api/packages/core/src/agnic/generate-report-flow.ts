import { buildReportPackage, type ReportPackage } from "../artifacts/package-report.js";
import { generateMonetizationReport } from "../generate-report.js";
import { parseFixtureText } from "../parse-fixture.js";
import { tryParseEndpointInput } from "../parse-endpoint-input.js";
import {
  FIXTURE_SOURCE_LABEL,
  loadCompanyRiskScoreFixture,
} from "../load-fixture.js";
import type { AgnicConfig } from "./config.js";
import {
  applyNarrativeEnhancement,
  generateReportNarrativeEnhancement,
  NarrativeEnhancementError,
} from "./narrative-enhancement.js";
import { EndpointParseError } from "../parse-endpoint-input.js";

export type PaidReportGenerationResult = {
  package: ReportPackage;
  parseSource: "user_input" | "fixture_fallback";
};

export async function generateFixtureReportPackage(
  rawInput?: string,
  options: { useCanonicalFixture?: boolean } = {},
): Promise<PaidReportGenerationResult> {
  const trimmed = rawInput?.trim() ?? "";
  const parsed = trimmed ? tryParseEndpointInput(trimmed) : { ok: false as const, error: "" };

  if (parsed.ok) {
    const report = generateMonetizationReport(parsed.endpoint, { mode: "fixture" });
    return {
      parseSource: "user_input",
      package: buildReportPackage({ report, mode: "fixture" }),
    };
  }

  if (!options.useCanonicalFixture && trimmed) {
    throw new EndpointParseError(
      "We couldn't interpret that description. Try the sample demo or add a bit more detail.",
    );
  }

  const fixtureRaw = await loadCompanyRiskScoreFixture();
  const endpoint = parseFixtureText(fixtureRaw, FIXTURE_SOURCE_LABEL);
  const report = generateMonetizationReport(endpoint, { mode: "fixture" });

  return {
    parseSource: "fixture_fallback",
    package: buildReportPackage({ report, mode: "fixture" }),
  };
}

export async function generatePaidReportPackage(params: {
  config: AgnicConfig;
  rawInput: string;
}): Promise<PaidReportGenerationResult> {
  const parsed = tryParseEndpointInput(params.rawInput);
  if (!parsed.ok) {
    throw new EndpointParseError(parsed.error);
  }

  const endpoint = parsed.endpoint;
  const baseReport = generateMonetizationReport(endpoint, {
    mode: "live",
    generatedAt: new Date().toISOString(),
  });

  let narrativeResult;
  try {
    narrativeResult = await generateReportNarrativeEnhancement({
      config: params.config,
      endpoint,
      rawInput: params.rawInput,
    });
  } catch (err) {
    if (err instanceof NarrativeEnhancementError) {
      throw err;
    }
    throw err;
  }

  const report = applyNarrativeEnhancement(baseReport, narrativeResult.enhancement);

  return {
    parseSource: "user_input",
    package: buildReportPackage({
      report,
      mode: "live",
      model: narrativeResult.model,
      modelInsight: narrativeResult.enhancement.summary,
      usage: narrativeResult.usage,
    }),
  };
}

export { NarrativeEnhancementError } from "./narrative-enhancement.js";
