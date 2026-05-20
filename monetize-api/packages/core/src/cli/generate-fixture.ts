import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateCompanyRiskScoreReport } from "../load-fixture.js";
import { writeArtifactsToDirectory } from "../artifacts/write-artifacts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(
  __dirname,
  "../../../../examples/company-risk-score",
);

const report = await generateCompanyRiskScoreReport();
const files = await writeArtifactsToDirectory(report, outputDir);

console.log(`Validated MonetizationReport and artifacts written to ${outputDir}`);
console.log(`reportId=${report.reportId} readinessScore=${report.readinessScore}`);
console.log(`artifacts=${Object.keys(files).join(", ")}`);
