#!/usr/bin/env bash
# setup-hooks.sh — Install ADF quality gate git hooks into .git/hooks/.
# Safe-by-default: skips existing hooks unless --force.
# Usage: bash setup-hooks.sh [--force]

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SKILL_DIR/checks/lib-gate-utils.sh"

FORCE=false
for arg in "$@"; do [ "$arg" = "--force" ] && FORCE=true; done

HOOKS_DIR="$(git rev-parse --show-toplevel 2>/dev/null)/.git/hooks"

if [ -z "$HOOKS_DIR" ] || [ ! -d "$(dirname "$HOOKS_DIR")" ]; then
  print_status "hooks" "error" "Not inside a git repository"
  exit 1
fi

mkdir -p "$HOOKS_DIR"

install_hook() {
  local hook_name="$1"
  local template="$2"
  local target="$HOOKS_DIR/$hook_name"

  if [ -f "$target" ] && [ "$FORCE" != "true" ]; then
    print_status "hooks" "skip" "$hook_name already exists (use --force to override)"
    return
  fi

  cp "$template" "$target"
  chmod +x "$target"
  print_status "hooks" "ok" "installed $hook_name → $target"
}

install_hook "pre-commit" "$SKILL_DIR/templates/pre-commit-hook.sh"
install_hook "pre-push"   "$SKILL_DIR/templates/pre-push-hook.sh"

echo ""
echo "Git hooks installed. Gates will run automatically on commit/push."
