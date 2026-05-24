import type { EndpointInput, MonetizationReport } from "@monetize-api/schemas";
import { MonetizationReportSchema } from "@monetize-api/schemas";

const FIXTURE_REPORT_ID = "report-company-risk-score-fixture-v1";
const FIXTURE_GENERATED_AT = "2026-05-16T00:00:00.000Z";

export type ReportGenerationMode = "fixture" | "live";

export type GenerateReportOptions = {
  mode?: ReportGenerationMode;
  generatedAt?: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildEndpointTitle(endpoint: EndpointInput): string {
  const slug = slugify(endpoint.path.replace(/^\//, ""));
  return `${titleCaseSlug(slug)} API`;
}

function exampleValueForField(field: string): string {
  const normalized = field.toLowerCase();
  if (normalized.includes("domain")) {
    return "example.com";
  }
  if (normalized.includes("email")) {
    return "user@example.com";
  }
  if (normalized.includes("id")) {
    return "item-123";
  }
  if (normalized.includes("name")) {
    return "Example Corp";
  }
  return `sample-${slugify(field) || "value"}`;
}

function buildExampleRequestPayload(
  endpoint: EndpointInput,
): Record<string, string> {
  return Object.fromEntries(
    endpoint.inputFields.map((field) => [field, exampleValueForField(field)]),
  );
}

function buildExampleResponse(endpoint: EndpointInput): string {
  const fields = endpoint.outputFields.map((field) => `  "${field}": "..."`);
  return `{\n${fields.join(",\n")}\n}`;
}

function buildMcpTool(endpoint: EndpointInput) {
  const properties = Object.fromEntries(
    endpoint.inputFields.map((field) => [
      field,
      {
        type: "string",
        description: `${field} input for ${endpoint.path}`,
      },
    ]),
  );

  const outputs = endpoint.outputFields.join(", ");
  return {
    name: slugify(endpoint.path.replace(/^\//, "")),
    description: `Calls ${endpoint.method} ${endpoint.path} and returns ${outputs}.`,
    inputSchema: {
      type: "object" as const,
      properties,
      required: endpoint.inputFields,
    },
  };
}

function defaultAbuseRisks(endpoint: EndpointInput): string[] {
  return [
    `High-cardinality ${endpoint.inputFields.join("/") || "input"} lookups can inflate upstream costs.`,
    `Repeated retries on invalid ${endpoint.domain} requests may waste paid quota.`,
    `Automated agents calling ${endpoint.path} without rate limits can spike spend.`,
  ];
}

function buildReportId(endpoint: EndpointInput, mode: ReportGenerationMode): string {
  const slug = slugify(endpoint.path.replace(/^\//, ""));
  if (mode === "fixture" && slug === "company-risk-score") {
    return FIXTURE_REPORT_ID;
  }
  if (mode === "fixture") {
    return `report-${slug}-fixture-v1`;
  }
  return `report-${slug}-live-v1`;
}

export function generateMonetizationReport(
  endpoint: EndpointInput,
  options: GenerateReportOptions = {},
): MonetizationReport {
  const mode = options.mode ?? "fixture";
  const generatedAt =
    options.generatedAt ?? (mode === "fixture" ? FIXTURE_GENERATED_AT : new Date().toISOString());
  const reportId = buildReportId(endpoint, mode);
  const endpointId = slugify(endpoint.path.replace(/^\//, ""));
  const title = buildEndpointTitle(endpoint);
  const suggestedPrice = Number((endpoint.estimatedCostPerCallUsd * 3).toFixed(2));
  const marginPercent = Math.round(
    ((suggestedPrice - endpoint.estimatedCostPerCallUsd) / suggestedPrice) * 100,
  );
  const requestPayload = buildExampleRequestPayload(endpoint);
  const outputPreview = endpoint.outputFields.slice(0, 2).join(" and ") || "response data";

  const report: MonetizationReport = {
    reportId,
    generatedAt,
    fixtureMode: mode === "fixture",
    endpoint,
    summary:
      `${endpoint.method} ${endpoint.path} is a ${endpoint.domain} endpoint for ${endpoint.targetUsers}. ` +
      `Per-call pricing with hybrid x402/API access fits ${endpoint.expectedUsage}.`,
    readinessScore: mode === "live" ? 78 : 82,
    pricing: {
      model: "per_call",
      suggestedPricePerCallUsd: suggestedPrice,
      estimatedMarginPercent: marginPercent,
      rationale: `3x upstream cost ($${endpoint.estimatedCostPerCallUsd.toFixed(2)}) supports per-call margin for ${endpoint.domain} workloads.`,
      currency: "USD",
    },
    quota: {
      tier: "starter",
      requestsPerDay: 500,
      burstLimit: 20,
      rationale: `Starter quota matches ${endpoint.expectedUsage} for ${endpoint.targetUsers}.`,
    },
    accessModel: {
      primary: "hybrid",
      secondary: ["api_key", "x402"],
      agentReady: true,
      humanReady: true,
      rationale: `${endpoint.method} ${endpoint.path} is callable by agents (x402) and humans (API key).`,
    },
    x402Suitability: {
      score: endpoint.domain === "data_api" ? 88 : 75,
      level: endpoint.domain === "data_api" ? "high" : "medium",
      machineCallable: true,
      idempotent: true,
      rationale: `Structured inputs (${endpoint.inputFields.join(", ")}) and machine callers suit x402 for ${endpoint.path}.`,
      blockers: ["Live settlement remains deferred in this demo."],
    },
    abuseCostRisks: defaultAbuseRisks(endpoint),
    ceibaPolicy: {
      version: "0.1",
      endpointId,
      access: {
        modes: ["api_key", "x402"],
        defaultMode: "x402",
      },
      pricing: {
        model: "per_call",
        pricePerCallUsd: suggestedPrice,
        currency: "USD",
      },
      quotas: {
        requestsPerDay: 500,
        burstLimit: 20,
      },
      enforcement: {
        runtime: "ceiba-runtime-deferred",
        controlPlane: "ceiba-control-plane-deferred",
      },
    },
    mcpTool: buildMcpTool(endpoint),
    x402Payment: {
      protocol: "x402",
      mode: "simulated",
      pricePerCallUsd: suggestedPrice,
      currency: "USD",
      settlement: "deferred",
      resource: endpoint.path,
      headers: {
        "X-Payment-Mode": "simulated",
      },
    },
    docs: {
      title,
      summary: `Call ${endpoint.method} ${endpoint.path} with ${endpoint.inputFields.join(" and ")} to retrieve ${outputPreview}.`,
      exampleRequest: `${endpoint.method} ${endpoint.path}\n${JSON.stringify(requestPayload, null, 2)}`,
      exampleResponse: buildExampleResponse(endpoint),
      markdown:
        `# ${title}\n\n` +
        `Call \`${endpoint.method} ${endpoint.path}\` with \`${endpoint.inputFields.join("`, `")}\`.\n\n` +
        `Returns ${endpoint.outputFields.join(", ")}.`,
    },
    launchChecklist: {
      title: `${title} launch checklist`,
      items: [
        {
          id: "validate-schema",
          label: "Validate MonetizationReport against schemas",
          status: "done",
        },
        {
          id: "publish-mcp-tool",
          label: `Publish MCP tool for ${endpoint.path}`,
          status: "todo",
        },
        {
          id: "configure-x402",
          label: `Attach simulated x402 metadata for ${endpoint.path}`,
          status: "in_progress",
        },
        {
          id: "draft-ceiba-policy",
          label: `Review Ceiba policy draft for ${endpointId}`,
          status: "todo",
        },
      ],
    },
    simulatedPaidCall: {
      callId: `sim-call-${endpointId}-001`,
      endpoint: endpoint.path,
      method: endpoint.method,
      status: "settled_simulated",
      priceChargedUsd: suggestedPrice,
      currency: "USD",
      payerType: "agent",
      settlementMode: "simulated",
      requestPayload,
      responseSummary: `Simulated paid call to ${endpoint.path} returned ${outputPreview}.`,
    },
    usageEvent: {
      eventId: `usage-${endpointId}-001`,
      timestamp: generatedAt,
      endpoint: endpoint.path,
      callerType: "agent",
      units: 1,
      costUsd: endpoint.estimatedCostPerCallUsd,
      outcome: "success",
    },
  };

  return MonetizationReportSchema.parse(report);
}
