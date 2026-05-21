#!/usr/bin/env bash
# Copy monetize-api/.env to apps/web/.env.local for Next.js dev:web (both paths are gitignored).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cp "$ROOT/.env" "$ROOT/apps/web/.env.local"
echo "Synced $ROOT/.env -> $ROOT/apps/web/.env.local"
