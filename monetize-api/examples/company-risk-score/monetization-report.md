# Monetization Report
**Report ID:** report-company-risk-score-fixture-v1
**Generated:** 2026-05-16T00:00:00.000Z
**Fixture mode:** yes
**Readiness score:** 82/100
## Summary
POST /company-risk-score is a data_api endpoint for procurement teams and AI research agents. Fixture mode recommends per-call pricing with hybrid x402/API access for low-frequency, high-value agent calls.
## Endpoint
- **Method:** POST
- **Path:** /company-risk-score
- **Domain:** data_api
- **Target users:** procurement teams and AI research agents
- **Estimated cost per call:** $0.04 USD
- **Expected usage:** low-frequency, high-value, machine-callable endpoint
- **Inputs:** companyName, domain
- **Outputs:** risk score, sanctions flags, ESG notes, supplier notes
## Pricing
- **Model:** per_call
- **Suggested price per call:** $0.12 USD
- **Estimated margin:** 67%
- **Rationale:** Low-frequency, high-value usage supports per-call pricing with roughly 3x cost coverage.
## Quota
- **Tier:** starter
- **Requests per day:** 500
- **Burst limit:** 20
- **Rationale:** Low-frequency procurement and agent research traffic fits a conservative starter quota.
## Access model
- **Primary:** hybrid
- **Secondary:** api_key, x402
- **Agent ready:** yes
- **Human ready:** yes
- **Rationale:** Machine-callable risk lookups benefit from x402 for agents and API keys for human workflows.
## x402 suitability
- **Score:** 88/100 (high)
- **Machine callable:** yes
- **Idempotent:** yes
- **Rationale:** Structured inputs, deterministic JSON-style outputs, and low-frequency agent usage are strong x402 candidates.
- **Blockers:**
- Live settlement remains deferred in fixture mode.
## Abuse and cost risks
- Bulk enrichment on free tiers could inflate upstream data costs.
- Domain/name typos may trigger repeated paid retries without validation.
- High-cardinality lookups can be abused for passive reconnaissance.
## Simulated paid call
- **Call ID:** sim-call-company-risk-score-001
- **Status:** settled_simulated
- **Price charged:** $0.12 USD
- **Payer:** agent
- **Summary:** Simulated paid call returned risk score 42 with no sanctions flags.