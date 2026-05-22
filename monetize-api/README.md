# MonetizeAPI

From endpoint to paid agent-ready tool.

MonetizeAPI turns endpoint or API spec input into a structured monetization report and launch-ready artifacts: pricing guidance, x402 suitability, MCP tool schema, policy config, docs, checklist, and a paid-call simulator.

## Demo flow

```txt
endpoint/spec input
-> monetization report
-> launch artifacts (policy, MCP, x402, docs, checklist)
-> paid-call simulation
```

## Try it locally (no API keys required)

From this directory:

```bash
npx pnpm@9.15.9 install
npx pnpm@9.15.9 build
npx pnpm@9.15.9 generate:fixture
```

Outputs are written to `examples/company-risk-score/`. The canonical input fixture is `examples/company-risk-score/input.txt`.

Optional: `npx pnpm@9.15.9 dev:web` starts the web app on port 3000 for the Agnic sign-in demo.

## Live demo

**https://monetize-api-six.vercel.app**

Vercel project settings (Root Directory, install/build commands): see [docs/vercel-deploy.md](docs/vercel-deploy.md).

## Agnic hackathon

Built for **Agnic — Track: Monetize Your AI App**. Agnic powers OAuth sign-in and live model calls; the product contracts and report pipeline are provider-independent. Fixture mode always works without live credentials.

## Repository layout

```txt
packages/schemas   — validation contracts
packages/core      — report generation, artifacts, simulator
apps/web           — minimal OAuth demo UI
examples/company-risk-score/
```
