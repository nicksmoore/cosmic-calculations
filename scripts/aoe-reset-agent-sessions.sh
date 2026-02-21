#!/usr/bin/env bash
set -euo pipefail

# Deletes known agent sessions created for this repo, then recreates valid ones.
# Usage:
#   ./scripts/aoe-reset-agent-sessions.sh

for name in \
  "Vietnamese" \
  "gemini-cli" \
  "mistral-vibe" \
  "codex" \
  "claude-code" \
  "opencode" \
  "m2 3.6.610;rgb:dcaa/dcab/dcaa11;rgb:158e/193a/1e75"; do
  aoe remove "$name" >/dev/null 2>&1 || true
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/aoe-add-agents.sh" "$SCRIPT_DIR/.."

echo "AoE sessions reset complete."
