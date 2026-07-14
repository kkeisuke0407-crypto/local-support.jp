#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Guard against sessions starting from a stale local snapshot of main.
# When that happens, .claude/commands/*.md (write-next-column, daily) can be
# missing entirely, so /write-next-column fails instantly with
# "Unknown command" and the content routine silently stalls for days.
git fetch origin main --quiet || true

if git rev-parse --verify origin/main >/dev/null 2>&1; then
  BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
  if [ "$BEHIND" -gt 0 ]; then
    echo "session-start: local base is $BEHIND commit(s) behind origin/main, syncing..." >&2
    if ! git merge origin/main --no-edit --quiet; then
      git merge --abort || true
      echo "session-start: auto-merge of origin/main failed (conflicts) — leaving branch as-is for manual resolution" >&2
    fi
  fi
fi

npm install
