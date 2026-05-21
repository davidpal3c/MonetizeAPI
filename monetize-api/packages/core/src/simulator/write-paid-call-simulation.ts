import { writeFile } from "node:fs/promises";
import path from "node:path";

import type { MonetizationReport } from "@monetize-api/schemas";

import { generatePaidCallSimulation } from "./generate-paid-call-simulation.js";
import { renderPaidCallSimulationJson } from "./render-paid-call-simulation-json.js";
import { renderPaidCallSimulationMd } from "./render-paid-call-simulation-md.js";

export type PaidCallSimulationFiles = {
  "paid-call-simulation.json": string;
  "paid-call-simulation.md": string;
};

export async function writePaidCallSimulationToDirectory(
  report: MonetizationReport,
  outputDir: string,
): Promise<PaidCallSimulationFiles> {
  const simulation = generatePaidCallSimulation(report);
  const json = renderPaidCallSimulationJson(simulation);
  const markdown = renderPaidCallSimulationMd(simulation);

  JSON.parse(json);

  const files: PaidCallSimulationFiles = {
    "paid-call-simulation.json": json,
    "paid-call-simulation.md": markdown,
  };

  await Promise.all(
    Object.entries(files).map(([filename, content]) =>
      writeFile(path.join(outputDir, filename), content, "utf8"),
    ),
  );

  return files;
}
