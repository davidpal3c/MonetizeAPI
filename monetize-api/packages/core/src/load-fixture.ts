import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { EndpointInput, MonetizationReport } from "@monetize-api/schemas";

import { COMPANY_RISK_SCORE_FIXTURE_TEXT } from "./fixtures/company-risk-score-input.js";
import { generateMonetizationReport } from "./generate-report.js";
import { parseFixtureText } from "./parse-fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const COMPANY_RISK_SCORE_FIXTURE = path.resolve(
  __dirname,
  "../../../examples/company-risk-score/input.txt",
);

export const FIXTURE_SOURCE_LABEL = "examples/company-risk-score/input.txt";

/** Default textarea content; works without examples/ on disk (e.g. Render Docker). */
export function getDefaultCompanyRiskScoreInput(): string {
  return COMPANY_RISK_SCORE_FIXTURE_TEXT;
}

export async function loadCompanyRiskScoreFixture(
  fixturePath: string = COMPANY_RISK_SCORE_FIXTURE,
): Promise<string> {
  try {
    return await readFile(fixturePath, "utf8");
  } catch (error) {
    const code =
      error instanceof Error && "code" in error
        ? (error as NodeJS.ErrnoException).code
        : undefined;
    if (code === "ENOENT") {
      return COMPANY_RISK_SCORE_FIXTURE_TEXT;
    }
    throw error;
  }
}

export async function generateCompanyRiskScoreReport(
  fixturePath: string = COMPANY_RISK_SCORE_FIXTURE,
): Promise<MonetizationReport> {
  const raw = await loadCompanyRiskScoreFixture(fixturePath);
  const endpoint = parseFixtureText(raw, FIXTURE_SOURCE_LABEL);
  return generateMonetizationReport(endpoint);
}

export function generateReportFromEndpoint(
  endpoint: EndpointInput,
): MonetizationReport {
  return generateMonetizationReport(endpoint);
}
