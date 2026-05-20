import type { EndpointInput, MonetizationReport } from "@monetize-api/schemas";
import { MonetizationReportSchema } from "@monetize-api/schemas";

const FIXTURE_REPORT_ID = "report-company-risk-score-fixture-v1";
const FIXTURE_GENERATED_AT = "2026-05-16T00:00:00.000Z";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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

  return {
    name: slugify(endpoint.path.replace(/^\//, "")),
    description: `Returns ${endpoint.outputFields.join(", ")} for a company risk assessment.`,
    inputSchema: {
      type: "object" as const,
      properties,
      required: endpoint.inputFields,
    },
  };
}

export function generateMonetizationReport(
  endpoint: EndpointInput,
): MonetizationReport {
  const suggestedPrice = Number((endpoint.estimatedCostPerCallUsd * 3).toFixed(2));
  const marginPercent = Math.round(
    ((suggestedPrice - endpoint.estimatedCostPerCallUsd) / suggestedPrice) * 100,
  );
  const endpointId = slugify(endpoint.path.replace(/^\//, ""));

  const report: MonetizationReport = {
    reportId: FIXTURE_REPORT_ID,
    generatedAt: FIXTURE_GENERATED_AT,
    fixtureMode: true,
    endpoint,
    summary:
      `${endpoint.method} ${endpoint.path} is a ${endpoint.domain} endpoint for ${endpoint.targetUsers}. ` +
      `Fixture mode recommends per-call pricing with hybrid x402/API access for low-frequency, high-value agent calls.`,
    readinessScore: 82,
    pricing: {
      model: "per_call",
      suggestedPricePerCallUsd: suggestedPrice,
      estimatedMarginPercent: marginPercent,
      rationale:
        "Low-frequency, high-value usage supports per-call pricing with roughly 3x cost coverage.",
      currency: "USD",
    },
    quota: {
      tier: "starter",
      requestsPerDay: 500,
      burstLimit: 20,
      rationale:
        "Low-frequency procurement and agent research traffic fits a conservative starter quota.",
    },
    accessModel: {
      primary: "hybrid",
      secondary: ["api_key", "x402"],
      agentReady: true,
      humanReady: true,
      rationale:
        "Machine-callable risk lookups benefit from x402 for agents and API keys for human workflows.",
    },
    x402Suitability: {
      score: 88,
      level: "high",
      machineCallable: true,
      idempotent: true,
      rationale:
        "Structured inputs, deterministic JSON-style outputs, and low-frequency agent usage are strong x402 candidates.",
      blockers: ["Live settlement remains deferred in fixture mode."],
    },
    abuseCostRisks: [
      "Bulk enrichment on free tiers could inflate upstream data costs.",
      "Domain/name typos may trigger repeated paid retries without validation.",
      "High-cardinality lookups can be abused for passive reconnaissance.",
    ],
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
      title: "Company Risk Score API",
      summary:
        "Look up a company risk score, sanctions flags, ESG notes, and supplier notes from company name and domain.",
      exampleRequest: `POST ${endpoint.path}\n{\n  "companyName": "Acme Corp",\n  "domain": "acme.example"\n}`,
      exampleResponse:
        '{\n  "riskScore": 42,\n  "sanctionsFlags": [],\n  "esgNotes": "...",\n  "supplierNotes": "..."\n}',
      markdown:
        `# Company Risk Score\n\n` +
        `Call \`${endpoint.method} ${endpoint.path}\` with \`companyName\` and \`domain\`.\n\n` +
        `Returns risk score, sanctions flags, ESG notes, and supplier notes.`,
    },
    launchChecklist: {
      title: "Company Risk Score launch checklist",
      items: [
        {
          id: "validate-schema",
          label: "Validate MonetizationReport against schemas",
          status: "done",
        },
        {
          id: "publish-mcp-tool",
          label: "Publish MCP tool definition to agent clients",
          status: "todo",
        },
        {
          id: "configure-x402",
          label: "Attach simulated x402 payment metadata",
          status: "in_progress",
        },
        {
          id: "draft-ceiba-policy",
          label: "Review Ceiba policy draft with enforcement deferred",
          status: "todo",
        },
      ],
    },
    simulatedPaidCall: {
      callId: "sim-call-company-risk-score-001",
      endpoint: endpoint.path,
      method: endpoint.method,
      status: "settled_simulated",
      priceChargedUsd: suggestedPrice,
      currency: "USD",
      payerType: "agent",
      settlementMode: "simulated",
      requestPayload: {
        companyName: "Acme Corp",
        domain: "acme.example",
      },
      responseSummary:
        "Simulated paid call returned risk score 42 with no sanctions flags.",
    },
    usageEvent: {
      eventId: "usage-company-risk-score-001",
      timestamp: FIXTURE_GENERATED_AT,
      endpoint: endpoint.path,
      callerType: "agent",
      units: 1,
      costUsd: endpoint.estimatedCostPerCallUsd,
      outcome: "success",
    },
  };

  return MonetizationReportSchema.parse(report);
}
