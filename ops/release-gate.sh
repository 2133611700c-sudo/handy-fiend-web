#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[1/3] Build asset inventory"
node ops/build-asset-inventory.mjs

echo "[2/3] Build post pack"
node ops/build-post-pack.mjs

echo "[3/3] Run mandatory factory guard"
node ops/factory-guard.mjs

echo "✅ RELEASE GATE PASSED"
