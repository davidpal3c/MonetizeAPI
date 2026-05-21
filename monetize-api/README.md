# MonetizeAPI

From endpoint to paid agent-ready tool.

MonetizeAPI turns endpoint/spec input into a structured monetization report, pricing/quota recommendation, x402 suitability score, MCP tool schema, Ceiba-ready policy config, docs snippet, launch checklist, and paid-call simulator.

## Required flow

```txt
endpoint/spec input
-> structured monetization report
-> pricing/quota recommendation
-> x402 suitability score
-> MCP tool schema
-> Ceiba-ready policy config
-> docs snippet
-> launch checklist
-> paid-call simulator
```

## Required artifacts

```txt
monetization-report.md
ceiba-policy.json
mcp-tool.json
x402-payment.json
docs.md
launch-checklist.md
```

## Canonical fixture

```txt
examples/company-risk-score/input.txt
```

## First implementation slice

```txt
feat/monetizeapi-core-schemas-and-fixture-demo
```

This slice should define schemas and generate a validated fixture-first monetization report. It should not require Agnic, live x402 settlement, MCP runtime, Ceiba enforcement, marketplace, saved reports, or paid exports.

## Ceiba relationship

MonetizeAPI / Ceiba Launchpad is the productization and onboarding layer. Ceiba Runtime, Ceiba Control Plane, Ceiba SDKs, Ceiba x402 Provider, and Ceiba Guard are future enforcement, configuration, integration, payment, and governance layers.

## Agnic hackathon path

MonetizeAPI is accepted into the Agnic hackathon under Track: Monetize Your AI App. The hackathon demo path uses live Agnic credentials and services through an adapter, starting with model calls and `X-Partner-Id`. OAuth, checkout/top-up, balance, and earnings proof follow in later slices. Agnic is an adapter, not the product core. Fixture mode remains mandatory as the local safety fallback when live credentials or services are unavailable.
