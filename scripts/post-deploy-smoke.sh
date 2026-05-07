#!/usr/bin/env bash
# Post-deploy smoke checks against the live site.
# Exits non-zero on any failure.

set -euo pipefail

URL="${1:-https://elements.seanmahoney.ai}"

ok() { echo "  ✓ $1"; }
fail() {
  echo "  ✗ $1" >&2
  exit 1
}

check() {
  local path="$1"
  local pattern="$2"
  local label="$3"
  local body
  body=$(curl -sfL "${URL}${path}" || true)
  if [ -z "$body" ]; then
    fail "${label} — no response from ${URL}${path}"
  fi
  if ! echo "$body" | grep -q "$pattern"; then
    fail "${label} — expected pattern '${pattern}' not found"
  fi
  ok "$label"
}

echo "Smoke-checking ${URL}"
check "/" "Periodic Table" "landing"
check "/elements/h" "Hydrogen" "/elements/h"
check "/elements/og" "Oganesson" "/elements/og"
check "/games" "Trivia" "/games"
check "/games/element" "Guess the Element" "/games/element"
echo "✓ all smoke checks passed"
