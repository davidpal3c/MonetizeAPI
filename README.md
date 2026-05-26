# MonetizeAPI

**From endpoint to paid agent-ready tool.**

MonetizeAPI turns an API endpoint, spec, or function idea into a launch package for a paid agent-callable tool.

It generates:

- monetization report
- pricing and quota recommendation
- x402 payment metadata
- MCP tool definition
- Ceiba-ready policy config
- docs snippet
- launch checklist
- paid-call simulation
- downloadable launch package

## Hackathon Demo

MonetizeAPI is built for the **Agnic Monetize Your AI App** track.

The demo flow:

```txt
describe an endpoint
-> sign in with Agnic
-> see balance and estimated report cost
-> generate a paid report package
-> review payment proof
-> download the ZIP launch package
```

Agnic powers sign-in, balance, Add Funds, and live model calls. MonetizeAPI owns the product logic: report structure, pricing guidance, policy output, MCP definition, x402 metadata, and fixture fallback.

Live demo:

```txt
https://monetizeapi.onrender.com
```

## Generated Package

Each report package includes:

```txt
monetization-report.md
ceiba-policy.json
mcp-tool.json
x402-payment.json
docs.md
launch-checklist.md
paid-call-simulation.json
paid-call-simulation.md
```

## Run Locally

Requirements:

- Node.js 20+
- pnpm 9.15.9

```bash
cd monetize-api
npx pnpm@9.15.9 install
npx pnpm@9.15.9 build
npx pnpm@9.15.9 dev:web
```

Open:

```txt
http://localhost:3000
```

Fixture mode works without Agnic credentials:

```bash
npx pnpm@9.15.9 generate:fixture
```

Fixture outputs are written to:

```txt
monetize-api/examples/company-risk-score
```

## Boundaries

This alpha intentionally does **not** implement live x402 settlement, MCP runtime hosting, Ceiba enforcement, saved reports, or team accounts.

Fixture mode remains available so the demo can still run without live provider credentials.

## Project Layout

```txt
monetize-api/apps/web        web demo
monetize-api/packages/core   report generation, Agnic adapter, artifacts
monetize-api/packages/schemas shared validation contracts
monetize-api/examples        generated demo outputs
```

## License

MIT
