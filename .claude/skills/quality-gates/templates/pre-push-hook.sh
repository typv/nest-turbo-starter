#!/usr/bin/env bash
# ADF Quality Gates — pre-push hook
# Runs secrets + sast + deps checks before push.
# Install: copy to .git/hooks/pre-push and chmod +x

SKILL_DIR="$(git rev-parse --show-toplevel)/.claude/skills/quality-gates"

if [ -f "$SKILL_DIR/run-all.sh" ]; then
  QUALITY_GATES_SCOPE=pre-push bash "$SKILL_DIR/run-all.sh" --check secrets
  QUALITY_GATES_SCOPE=pre-push bash "$SKILL_DIR/run-all.sh" --check sast
  QUALITY_GATES_SCOPE=pre-push bash "$SKILL_DIR/run-all.sh" --check deps
fi

exit 0
