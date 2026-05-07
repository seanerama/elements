#!/usr/bin/env bash
# Stage 8 gate — every check that must pass before Stage 9 deploys.
# Exit code: 0 if everything green, non-zero on first failure.

set -euo pipefail

cd "$(dirname "$0")/.."

step() { echo "===> $1"; }

step "npm ci"
npm ci

step "typecheck"
npm run typecheck

step "lint"
npm run lint

step "format check"
npm run format:check

step "unit tests"
npm run test

step "build"
npm run build:fast

step "e2e (production build)"
npm run test:e2e

echo
echo "✓ all stage-8 gates passed"
