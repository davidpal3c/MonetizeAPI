import type { MonetizationReport } from "@monetize-api/schemas";

import { renderCeibaPolicyJson } from "./render-ceiba-policy-json.js";
import { renderDocsMd } from "./render-docs-md.js";
import { renderMcpToolJson } from "./render-mcp-tool-json.js";
import { renderX402PaymentJson } from "./render-x402-payment-json.js";
import { renderLaunchChecklistMd } from "./render-launch-checklist-md.js";
import { renderMonetizationReportMd } from "./render-monetization-report-md.js";

export type ArtifactOutputs = {
  monetizationReportJson: string;
  monetizationReportMd: string;
  ceibaPolicyJson: string;
  mcpToolJson: string;
  x402PaymentJson: string;
  docsMd: string;
  launchChecklistMd: string;
};

export function renderAllArtifacts(report: MonetizationReport): ArtifactOutputs {
  const monetizationReportJson = `${JSON.stringify(report, null, 2)}\n`;
  const ceibaPolicyJson = renderCeibaPolicyJson(report);
  const mcpToolJson = renderMcpToolJson(report);
  const x402PaymentJson = renderX402PaymentJson(report);

  assertValidJson(monetizationReportJson, "monetization-report.json");
  assertValidJson(ceibaPolicyJson, "ceiba-policy.json");
  assertValidJson(mcpToolJson, "mcp-tool.json");
  assertValidJson(x402PaymentJson, "x402-payment.json");

  return {
    monetizationReportJson,
    monetizationReportMd: renderMonetizationReportMd(report),
    ceibaPolicyJson,
    mcpToolJson,
    x402PaymentJson,
    docsMd: renderDocsMd(report),
    launchChecklistMd: renderLaunchChecklistMd(report),
  };
}

function assertValidJson(content: string, label: string): void {
  try {
    JSON.parse(content);
  } catch {
    throw new Error(`Generated ${label} is not valid JSON.`);
  }
}
