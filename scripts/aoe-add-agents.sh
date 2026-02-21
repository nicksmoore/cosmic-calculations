#!/usr/bin/env bash
set -euo pipefail

# Create one AoE session per supported agent command in isolated worktrees.
# Usage:
#   ./scripts/aoe-add-agents.sh
#   ./scripts/aoe-add-agents.sh /path/to/repo

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_PATH="${1:-$SCRIPT_DIR/..}"
REPO_PATH="$(cd "$REPO_PATH" && pwd)"
REPO_NAME="$(basename "$REPO_PATH")"
WORKTREE_ROOT="$REPO_PATH/../${REPO_NAME}-worktrees"

add_session() {
  local title="$1"
  local cmd="$2"
  local branch="$3"
  local branch_slug
  local worktree_path

  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Skipping $title: command '$cmd' not found in PATH"
    return 0
  fi

  branch_slug="$(echo "$branch" | tr '/' '-')"
  worktree_path="$WORKTREE_ROOT/$branch_slug"

  if [ -d "$worktree_path" ]; then
    echo "Reusing existing worktree for $title: $worktree_path"
    aoe add "$worktree_path" \
      -t "$title" \
      -c "$cmd"
  else
    aoe add "$REPO_PATH" \
      -t "$title" \
      -c "$cmd" \
      -w "$branch" \
      -b
  fi
}

# Requested aliases mapped to AoE commands:
# - claude-code   -> claude
# - gemini-cli    -> gemini
# - mistral-vibe  -> vibe
add_session "opencode" "opencode" "aoe/opencode"
add_session "gemini-cli" "gemini" "aoe/gemini-cli"
add_session "mistral-vibe" "vibe" "aoe/mistral-vibe"
add_session "codex" "codex" "aoe/codex"
add_session "claude-code" "claude" "aoe/claude-code"

echo "Done. Created sessions for installed tools only."
