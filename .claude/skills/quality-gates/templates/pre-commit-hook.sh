#!/usr/bin/env bash
# ADF Quality Gates — pre-commit hook
# Runs secrets check only (fast, <1s, hard block).
# Install: copy to .git/hooks/pre-commit and chmod +x

SKILL_DIR="$(git rev-parse --show-toplevel)/.claude/skills/quality-gates"

if [ -f "$SKILL_DIR/checks/check-secrets.sh" ]; then
  QUALITY_GATES_SCOPE=pre-commit bash "$SKILL_DIR/checks/check-secrets.sh"
  if [ $? -eq 1 ]; then
    echo "❌ Secret detected — commit blocked. Fix before committing."
    exit 1
  fi
fi

exit 0
