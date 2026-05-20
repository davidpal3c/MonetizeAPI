import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { EndpointInput, MonetizationReport } from "@monetize-api/schemas";

import { generateMonetizationReport } from "./generate-report.js";
import { parseFixtureText } from "./parse-fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const COMPANY_RISK_SCORE_FIXTURE = path.resolve(
  __dirname,
  "../../../examples/company-risk-score/input.txt",
);

export async function loadCompanyRiskScoreFixture(
  fixturePath: string = COMPANY_RISK_SCORE_FIXTURE,
): Promise<string> {
  return readFile(fixturePath, "utf8");
}

const FIXTURE_SOURCE_LABEL = "examples/company-risk-score/input.txt";

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
