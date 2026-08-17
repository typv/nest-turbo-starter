#!/usr/bin/env bash
# setup-all.sh — Setup wizard for quality gates.
# Interactive mode (default): prompts user for config.
# Non-interactive mode (--non-interactive): uses CLI flags, outputs JSON status.
# POSIX/bash 3.2 compatible (macOS default shell)

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SKILL_DIR/checks/lib-gate-utils.sh"

# ── Flag defaults ──────────────────────────────────────────────────────────────
FORCE=false
NON_INTERACTIVE=false
JSON_OUTPUT=false
STACKS=""
COVERAGE="70"
FILE_MAX_LOC="200"
SCOPE_INCLUDE="src/,app/,lib/"
SCOPE_EXCLUDE=""
GATES="secrets,sast,deps,coverage,file-size"
SONAR_HOST="${SONAR_HOST_URL:-}"
SONAR_PROJECT_KEY=""
ENABLE_SEMGREP=false
ENABLE_DAST=false
INSTALL_HOOKS=false

# ── Parse flags ────────────────────────────────────────────────────────────────
while [ $# -gt 0 ]; do
  case "$1" in
    --force)              FORCE=true; shift ;;
    --non-interactive)    NON_INTERACTIVE=true; shift ;;
    --json)               JSON_OUTPUT=true; shift ;;
    --stacks=*)           STACKS="${1#--stacks=}"; shift ;;
    --coverage=*)         COVERAGE="${1#--coverage=}"; shift ;;
    --file-max-loc=*)     FILE_MAX_LOC="${1#--file-max-loc=}"; shift ;;
    --scope=*)            SCOPE_INCLUDE="${1#--scope=}"; shift ;;
    --gates=*)            GATES="${1#--gates=}"; shift ;;
    --sonar-host=*)       SONAR_HOST="${1#--sonar-host=}"; export SONAR_HOST_URL="$SONAR_HOST"; shift ;;
    --sonar-project-key=*)SONAR_PROJECT_KEY="${1#--sonar-project-key=}"; shift ;;
    --setup-dast)         ENABLE_DAST=true; shift ;;
    --setup-hooks)        INSTALL_HOOKS=true; shift ;;
    *)                    shift ;;
  esac
done

# Sanitize numeric inputs
COVERAGE="${COVERAGE//[^0-9]/}"; [ -z "$COVERAGE" ] && COVERAGE=70
FILE_MAX_LOC="${FILE_MAX_LOC//[^0-9]/}"; [ -z "$FILE_MAX_LOC" ] && FILE_MAX_LOC=200

QG_DIR=".quality-gates"
CONFIG_FILE="$QG_DIR/config.yaml"
GITLEAKS_TARGET=".gitleaks.toml"
GITLEAKS_TEMPLATE="$SKILL_DIR/templates/gitleaks.toml"

# Tracking for JSON output
INSTALLED_TOOLS=""
MISSING_TOOLS=""
CONFIGURED_FILES=""
SKIPPED_SETUPS=""

echo "🛡️  Quality Gates Setup"
echo "────────────────────────────────"
echo ""

# ── Helpers ────────────────────────────────────────────────────────────────────

# Safe template injection: skip if exists unless --force
inject_if_absent() {
  local target="$1"
  local template="$2"
  if [ -f "$target" ] && [ "$FORCE" != "true" ]; then
    print_status "setup" "skip" "$target already exists (use --force to override)"
    return 1
  fi
  mkdir -p "$(dirname "$target")"
  cp "$template" "$target"
  print_status "setup" "ok" "created $target"
  CONFIGURED_FILES="${CONFIGURED_FILES} ${target}"
  return 0
}

# Prompt helper: prints question, reads answer; returns default if blank or non-interactive
prompt() {
  local question="$1"
  local default="$2"
  if [ "$NON_INTERACTIVE" = "true" ]; then
    echo "$default"
    return
  fi
  printf '%s [%s]: ' "$question" "$default"
  local answer
  read -r answer
  echo "${answer:-$default}"
}

# ── Step 1: Collect inputs (interactive or from flags) ─────────────────────────

if [ "$NON_INTERACTIVE" != "true" ]; then
  SCOPE_INCLUDE=$(prompt "Source code folders (comma-separated)" "$SCOPE_INCLUDE")
  SCOPE_EXCLUDE=$(prompt "Extra exclude patterns (comma-separated, blank for defaults)" "$SCOPE_EXCLUDE")
  COVERAGE=$(prompt "Minimum coverage threshold (%)" "$COVERAGE")
  FILE_MAX_LOC=$(prompt "Max file size (lines of code)" "$FILE_MAX_LOC")
fi

# ── Step 2: Write .quality-gates/config.yaml via generate-config.sh ───────────

mkdir -p "$QG_DIR"

GEN_FLAGS="--non-interactive --coverage=${COVERAGE} --file-max-loc=${FILE_MAX_LOC} --scope=${SCOPE_INCLUDE} --gates=${GATES}"
[ -n "$STACKS" ]           && GEN_FLAGS="$GEN_FLAGS --stacks=${STACKS}"
[ -n "$SCOPE_EXCLUDE" ]    && GEN_FLAGS="$GEN_FLAGS --scope-exclude=${SCOPE_EXCLUDE}"
[ "$FORCE" = "true" ]      && GEN_FLAGS="$GEN_FLAGS --force"

# shellcheck disable=SC2086
bash "$SKILL_DIR/setup/generate-config.sh" $GEN_FLAGS
GEN_EXIT=$?

if [ "$GEN_EXIT" -eq 0 ] && [ -f "$CONFIG_FILE" ]; then
  CONFIGURED_FILES="${CONFIGURED_FILES} ${CONFIG_FILE}"
fi

# ── Step 3: Inject .gitleaks.toml ─────────────────────────────────────────────

inject_if_absent "$GITLEAKS_TARGET" "$GITLEAKS_TEMPLATE"

# ── Step 4: SAST (semgrep) enable/disable ─────────────────────────────────────

if [ "$NON_INTERACTIVE" = "true" ]; then
  SAST_CHOICE="y"
  [ "$ENABLE_SEMGREP" = "true" ] || SAST_CHOICE="N"
else
  SAST_CHOICE=$(prompt "Enable SAST gate (semgrep --config auto)? (Y/n)" "Y")
fi

if [[ "$SAST_CHOICE" =~ ^[Nn]$ ]]; then
  GATES=$(echo "$GATES" | sed 's/,sast//g; s/sast,//g; s/^sast$//g')
  SKIPPED_SETUPS="${SKIPPED_SETUPS} sast"
else
  print_status "setup" "ok" "SAST enabled (semgrep auto)"
fi

# ── Step 5: SonarQube setup (conditional) ─────────────────────────────────────

if [ -n "${SONAR_HOST:-}" ]; then
  FORCE_FLAG=""
  [ "$FORCE" = "true" ] && FORCE_FLAG="--force"
  bash "$SKILL_DIR/setup/setup-sonar.sh" $FORCE_FLAG
  CONFIGURED_FILES="${CONFIGURED_FILES} sonar-project.properties"
else
  print_status "setup" "skip" "SonarQube: SONAR_HOST_URL not set — skipping"
  SKIPPED_SETUPS="${SKIPPED_SETUPS} sonar"
fi

# ── Step 6: DAST endpoints placeholder ────────────────────────────────────────

if [ "$NON_INTERACTIVE" = "true" ]; then
  DAST_CHOICE="N"
  [ "$ENABLE_DAST" = "true" ] && DAST_CHOICE="y"
else
  DAST_CHOICE=$(prompt "Enable DAST? Creates .quality-gates/endpoints.txt placeholder (y/N)" "N")
fi

if [[ "$DAST_CHOICE" =~ ^[Yy]$ ]]; then
  ENDPOINTS_FILE="$QG_DIR/endpoints.txt"
  if [ -f "$ENDPOINTS_FILE" ] && [ "$FORCE" != "true" ]; then
    print_status "setup" "skip" "$ENDPOINTS_FILE already exists"
  else
    cat > "$ENDPOINTS_FILE" << 'EOF'
# DAST target endpoints — one URL per line.
# Only endpoints listed here will be scanned by nuclei.
# Example:
# https://staging.myapp.com/api/v1
# https://staging.myapp.com/login
EOF
    print_status "setup" "ok" "created $ENDPOINTS_FILE (add your staging endpoints)"
    CONFIGURED_FILES="${CONFIGURED_FILES} ${ENDPOINTS_FILE}"
  fi
else
  SKIPPED_SETUPS="${SKIPPED_SETUPS} dast"
fi

# ── Step 7: Git hooks (optional) ──────────────────────────────────────────────

if [ "$NON_INTERACTIVE" = "true" ]; then
  HOOKS_CHOICE="N"
  [ "$INSTALL_HOOKS" = "true" ] && HOOKS_CHOICE="y"
else
  HOOKS_CHOICE=$(prompt "Install quality gate git hooks (pre-commit + pre-push)? (y/N)" "N")
fi

if [[ "$HOOKS_CHOICE" =~ ^[Yy]$ ]]; then
  FORCE_FLAG=""
  [ "$FORCE" = "true" ] && FORCE_FLAG="--force"
  bash "$SKILL_DIR/setup/setup-hooks.sh" $FORCE_FLAG
  CONFIGURED_FILES="${CONFIGURED_FILES} .git/hooks/pre-commit .git/hooks/pre-push"
else
  SKIPPED_SETUPS="${SKIPPED_SETUPS} hooks"
fi

# ── Step 8: Validate tool installation ────────────────────────────────────────

# Gate → tool binary mapping (space-delimited pairs for bash 3.2)
GATE_TOOL_MAP="secrets:gitleaks deps:trivy sast:semgrep dast:nuclei sonar:sonar-scanner"

validate_tools() {
  for entry in $GATE_TOOL_MAP; do
    local gate="${entry%%:*}"
    local tool="${entry#*:}"

    # Check if gate is in enabled list
    if echo "$GATES" | grep -qE "(^|,)${gate}(,|$)"; then
      if command -v "$tool" &>/dev/null; then
        INSTALLED_TOOLS="${INSTALLED_TOOLS} ${tool}"
      else
        MISSING_TOOLS="${MISSING_TOOLS} ${tool}"
        print_status "setup" "warn" "${tool} not installed (required for ${gate} gate)"
      fi
    fi
  done
}

validate_tools

# ── Step 9: Emit JSON status (when --json flag) ────────────────────────────────

emit_json_status() {
  # Convert space-separated strings to JSON arrays
  to_json_array() {
    local items="$1"
    local arr="["
    local first=true
    for item in $items; do
      [ "$first" = "true" ] && first=false || arr="${arr},"
      arr="${arr}\"${item}\""
    done
    arr="${arr}]"
    echo "$arr"
  }

  local installed_arr missing_arr configured_arr skipped_arr
  installed_arr="$(to_json_array "$INSTALLED_TOOLS")"
  missing_arr="$(to_json_array "$MISSING_TOOLS")"
  configured_arr="$(to_json_array "$CONFIGURED_FILES")"
  skipped_arr="$(to_json_array "$SKIPPED_SETUPS")"

  printf '{\n'
  printf '  "installed": %s,\n' "$installed_arr"
  printf '  "missing": %s,\n'   "$missing_arr"
  printf '  "configured": %s,\n' "$configured_arr"
  printf '  "skipped": %s\n'    "$skipped_arr"
  printf '}\n'
}

# ── Summary ────────────────────────────────────────────────────────────────────

echo ""
echo "────────────────────────────────"

if [ "$JSON_OUTPUT" = "true" ]; then
  emit_json_status
else
  echo "Setup complete. Next steps:"
  echo "  1. Review $CONFIG_FILE"
  echo "  2. Run: /quality-gates run"
  [ -n "$MISSING_TOOLS" ] && echo "  3. Install missing tools: ${MISSING_TOOLS}"
  [ -z "${SONAR_HOST:-}" ] && echo "  4. Set SONAR_HOST_URL + SONAR_TOKEN to enable SonarQube gate"
fi
