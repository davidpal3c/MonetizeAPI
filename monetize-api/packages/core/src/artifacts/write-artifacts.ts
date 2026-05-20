import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { MonetizationReport } from "@monetize-api/schemas";

import { renderAllArtifacts } from "./render-all-artifacts.js";

export type ArtifactFileMap = {
  "monetization-report.json": string;
  "monetization-report.md": string;
  "ceiba-policy.json": string;
  "mcp-tool.json": string;
  "x402-payment.json": string;
  "docs.md": string;
  "launch-checklist.md": string;
};

export function artifactsToFileMap(
  outputs: ReturnType<typeof renderAllArtifacts>,
): ArtifactFileMap {
  return {
    "monetization-report.json": outputs.monetizationReportJson,
    "monetization-report.md": outputs.monetizationReportMd,
    "ceiba-policy.json": outputs.ceibaPolicyJson,
    "mcp-tool.json": outputs.mcpToolJson,
    "x402-payment.json": outputs.x402PaymentJson,
    "docs.md": outputs.docsMd,
    "launch-checklist.md": outputs.launchChecklistMd,
  };
}

export async function writeArtifactsToDirectory(
  report: MonetizationReport,
  outputDir: string,
): Promise<ArtifactFileMap> {
  const outputs = renderAllArtifacts(report);
  const files = artifactsToFileMap(outputs);

  await mkdir(outputDir, { recursive: true });

  await Promise.all(
    Object.entries(files).map(([filename, content]) =>
      writeFile(path.join(outputDir, filename), content, "utf8"),
    ),
  );

  return files;
}
