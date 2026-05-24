import type { MonetizationReport } from "@monetize-api/schemas";

import { artifactsToFileMap, type ArtifactFileMap } from "./write-artifacts.js";
import { renderAllArtifacts } from "./render-all-artifacts.js";
import { renderPaidCallSimulationJson } from "../simulator/render-paid-call-simulation-json.js";
import { renderPaidCallSimulationMd } from "../simulator/render-paid-call-simulation-md.js";
import { generatePaidCallSimulation } from "../simulator/generate-paid-call-simulation.js";

export type ReportPackage = {
  reportId: string;
  mode: "live" | "fixture";
  generatedAt: string;
  model?: string;
  modelInsight?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  files: ArtifactFileMap & {
    "paid-call-simulation.json": string;
    "paid-call-simulation.md": string;
  };
};

export function buildReportPackage(params: {
  report: MonetizationReport;
  mode: "live" | "fixture";
  model?: string;
  modelInsight?: string;
  usage?: ReportPackage["usage"];
}): ReportPackage {
  const artifacts = renderAllArtifacts(params.report);
  const artifactFiles = artifactsToFileMap(artifacts);
  const simulation = generatePaidCallSimulation(params.report);

  return {
    reportId: params.report.reportId,
    mode: params.mode,
    generatedAt: params.report.generatedAt,
    model: params.model,
    modelInsight: params.modelInsight,
    usage: params.usage,
    files: {
      ...artifactFiles,
      "paid-call-simulation.json": renderPaidCallSimulationJson(simulation),
      "paid-call-simulation.md": renderPaidCallSimulationMd(simulation),
    },
  };
}

export function serializeReportPackage(pkg: ReportPackage): string {
  return `${JSON.stringify(pkg, null, 2)}\n`;
}
