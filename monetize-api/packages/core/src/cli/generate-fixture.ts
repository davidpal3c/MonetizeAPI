import path from "node:path";
import { fileURLToPath } from "node:url";

import { writeArtifactsToDirectory } from "../artifacts/write-artifacts.js";
import { generateCompanyRiskScoreReport } from "../load-fixture.js";
import { writePaidCallSimulationToDirectory } from "../simulator/write-paid-call-simulation.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(
  __dirname,
  "../../../../examples/company-risk-score",
);

const report = await generateCompanyRiskScoreReport();
const files = await writeArtifactsToDirectory(report, outputDir);
const simulationFiles = await writePaidCallSimulationToDirectory(report, outputDir);

console.log(`Validated MonetizationReport and artifacts written to ${outputDir}`);
console.log(`reportId=${report.reportId} readinessScore=${report.readinessScore}`);
console.log(`artifacts=${Object.keys(files).join(", ")}`);
console.log(`simulation=${Object.keys(simulationFiles).join(", ")}`);
