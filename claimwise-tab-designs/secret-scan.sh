#!/usr/bin/env bash
set -euo pipefail

PATTERN='(sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{20,}|AKIA[0-9A-Z]{16})'

if rg -n --hidden --glob '!node_modules/**' --glob '!.git/**' "$PATTERN" .; then
  echo "❌ Potential secrets detected"
  exit 1
fi

echo "✅ No obvious hardcoded secrets detected"
