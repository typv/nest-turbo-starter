#!/usr/bin/env bash
# run-all.sh — Orchestrate all quality gate checks in order.
# Usage: run-all.sh [--check <gate>] [--no-block] [--json] [--output-dir <path>] [--mode <mode>]
# Exit codes: 0=all pass, 1=hard block, 2=warnings only
# POSIX/bash 3.2 compatible (macOS default shell)

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECKS_DIR="$SKILL_DIR/checks"

# Source lib-gate-utils for read_config_value, .env loading
# shellcheck source=checks/lib-gate-utils.sh
source "$CHECKS_DIR/lib-gate-utils.sh"

# ── Argument parsing ──────────────────────────────────────────────────────────
SINGLE_GATE=""
NO_BLOCK=false
JSON_OUTPUT=false
OUTPUT_DIR=".quality-gates/reports"

while [ $# -gt 0 ]; do
  case "$1" in
    --check)      SINGLE_GATE="$2"; shift 2 ;;
    --no-block)   NO_BLOCK=true; shift ;;
    --json)       JSON_OUTPUT=true; shift ;;
    --output-dir) OUTPUT_DIR="$2"; shift 2 ;;
    --mode)       QUALITY_GATES_MODE="$2"; export QUALITY_GATES_MODE; shift 2 ;;
    *)            shift ;;
  esac
done

# ── Setup completeness guard ───────────────────────────────────────────────────
# _guard_tool_check <gate> <tool> [required_file]
# Appends error lines to GUARD_ERRORS (space-delimited workaround for bash 3.2)
GUARD_ERRORS=""

_guard_tool_check() {
  local gate="$1"
  local tool="$2"
  local required_file="${3:-}"

  if ! command -v "$tool" &>/dev/null; then
    GUARD_ERRORS="${GUARD_ERRORS}  [${gate}] tool '${tool}' not installed\n"
  fi
  if [ -n "$required_file" ] && [ ! -f "$required_file" ]; then
    GUARD_ERRORS="${GUARD_ERRORS}  [${gate}] required file '${required_file}' not found\n"
  fi
}

assert_setup_complete() {
  local config=".quality-gates/config.yaml"

  # Check config file exists
  if [ ! -f "$config" ]; then
    echo "❌ Setup incomplete: $config not found." >&2
    echo "   → Run: /quality-gates setup" >&2
    exit 1
  fi

  # Gate → tool → optional required file (bash 3.2: no associative arrays)
  # Format: "gate:tool:required_file" (required_file may be empty)
  local gate_defs="secrets:gitleaks:.gitleaks.toml deps:trivy: sast:semgrep: dast:nuclei:.quality-gates/endpoints.txt sonar:sonar-scanner:sonar-project.properties"

  for entry in $gate_defs; do
    local gate tool req_file
    gate="${entry%%:*}"
    rest="${entry#*:}"
    tool="${rest%%:*}"
    req_file="${rest#*:}"

    # Skip disabled gates
    local enabled
    enabled="$(read_config_value "gates.${gate}.enabled")"
    [ "${enabled:-true}" = "false" ] && continue

    # Skip if gate is not in the active gate list (e.g. sonar/dast often disabled)
    # Only check gates that have an explicit enabled:true or are in DEFAULT_GATES without being disabled
    _guard_tool_check "$gate" "$tool" "$req_file"
  done

  if [ -n "$GUARD_ERRORS" ]; then
    echo "❌ Setup incomplete — missing tools or files:" >&2
    printf "%b" "$GUARD_ERRORS" >&2
    echo "" >&2
    echo "   → Run: /quality-gates setup" >&2
    exit 1
  fi
}

mkdir -p "$OUTPUT_DIR"

# ── Run ID and raw output directory ───────────────────────────────────────────
if [ -n "$SINGLE_GATE" ]; then
  export QUALITY_GATES_RUN_ID="${QUALITY_GATES_RUN_ID:-$(date +%Y%m%d-%H%M%S)-${SINGLE_GATE}}"
else
  export QUALITY_GATES_RUN_ID="${QUALITY_GATES_RUN_ID:-$(date +%Y%m%d-%H%M%S)}"
fi
export QUALITY_GATES_RUN_DIR="${OUTPUT_DIR}/raw/${QUALITY_GATES_RUN_ID}"
mkdir -p "$QUALITY_GATES_RUN_DIR"

# ── Gate list (fixed order) ───────────────────────────────────────────────────
GATES="secrets deps sast file-size coverage sonar dast"

# is_gate_enabled — check gates.<gate>.enabled in config (default: true).
is_gate_enabled() {
  local val
  val="$(read_config_value "gates.${1}.enabled")"
  [ "${val:-true}" != "false" ]
}

# Map gate name → check script path
gate_script() {
  case "$1" in
    secrets)   echo "$CHECKS_DIR/check-secrets.sh" ;;
    deps)      echo "$CHECKS_DIR/check-deps.sh" ;;
    sast)      echo "$CHECKS_DIR/check-sast.sh" ;;
    file-size) echo "$CHECKS_DIR/check-file-size.sh" ;;
    coverage)  echo "$CHECKS_DIR/check-coverage.sh" ;;
    sonar)     echo "$CHECKS_DIR/check-sonar.sh" ;;
    dast)      echo "$CHECKS_DIR/check-dast.sh" ;;
    *)         echo "" ;;
  esac
}

# ── Single gate mode ──────────────────────────────────────────────────────────
if [ -n "$SINGLE_GATE" ]; then
  SCRIPT="$(gate_script "$SINGLE_GATE")"
  if [ -z "$SCRIPT" ] || [ ! -f "$SCRIPT" ]; then
    echo "Unknown gate: $SINGLE_GATE. Valid: secrets deps sast file-size coverage sonar dast" >&2
    exit 1
  fi
  bash "$SCRIPT"
  EXIT=$?
  [ "$NO_BLOCK" = "true" ] && exit 0
  exit "$EXIT"
fi

# ── Full run ──────────────────────────────────────────────────────────────────

# Block run if setup is incomplete (skip when --no-block or profiled report-only run)
if [ "$NO_BLOCK" != "true" ]; then
  assert_setup_complete
fi

# Use temp dir to store per-gate exit codes (bash 3.2: no associative arrays)
EXIT_DIR="$(mktemp -d)"
trap 'rm -rf "$EXIT_DIR"' EXIT

echo "🔍 Running Quality Gates..."
echo ""

for gate in $GATES; do
  SCRIPT="$(gate_script "$gate")"
  [ ! -f "$SCRIPT" ] && continue

  # Skip gates disabled in config (gates.<gate>.enabled: false)
  if ! is_gate_enabled "$gate"; then
    echo "4" > "$EXIT_DIR/${gate}.exit"
    continue
  fi

  # Run gate: stdout printed live, stderr suppressed, exit code saved to file
  bash "$SCRIPT" 2>/dev/null
  EXIT=$?
  echo "$EXIT" > "$EXIT_DIR/${gate}.exit"
  echo "$EXIT" > "$QUALITY_GATES_RUN_DIR/${gate}.exit"
done

echo ""
echo "────────────────────────────────"

# ── Tally results ─────────────────────────────────────────────────────────────
ERRORS=0
WARNINGS=0
SKIPPED=0
PASSED=0

for gate in $GATES; do
  EXIT_FILE="$EXIT_DIR/${gate}.exit"
  code=0
  [ -f "$EXIT_FILE" ] && code=$(cat "$EXIT_FILE")
  case "$code" in
    0) PASSED=$((PASSED + 1)) ;;
    1) ERRORS=$((ERRORS + 1)) ;;
    2) WARNINGS=$((WARNINGS + 1)) ;;
    3) WARNINGS=$((WARNINGS + 1)) ;;   # tool missing = warn, not hard block
    4) SKIPPED=$((SKIPPED + 1)) ;;
  esac
done

echo "Summary: ${ERRORS} error(s), ${WARNINGS} warning(s), ${SKIPPED} skipped, ${PASSED} passed"

# ── Prune old raw dirs (keep N newest) ───────────────────────────────────────
KEEP_RUNS="$(read_config_value "reports.keep_runs")"
KEEP_RUNS="${KEEP_RUNS:-10}"
RAW_BASE="${OUTPUT_DIR}/raw"
if [ -d "$RAW_BASE" ]; then
  DIRS_COUNT=$(ls -1d "$RAW_BASE"/*/ 2>/dev/null | wc -l | tr -d ' ')
  if [ "$DIRS_COUNT" -gt "$KEEP_RUNS" ]; then
    REMOVE_COUNT=$((DIRS_COUNT - KEEP_RUNS))
    ls -1td "$RAW_BASE"/*/ 2>/dev/null | tail -n "$REMOVE_COUNT" | xargs rm -rf
  fi
fi

# ── Auto-generate report ──────────────────────────────────────────────────────
bash "$SKILL_DIR/report.sh" --output-dir "$OUTPUT_DIR" --run-id "$QUALITY_GATES_RUN_ID" 2>/dev/null || true

# ── JSON output mode ──────────────────────────────────────────────────────────
if [ "$JSON_OUTPUT" = "true" ]; then
  JSON_FILE="$OUTPUT_DIR/run-summary.json"
  {
    printf '{\n'
    printf '  "timestamp": "%s",\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    printf '  "branch": "%s",\n'    "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
    printf '  "commit": "%s",\n'    "$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
    printf '  "errors": %d,\n'      "$ERRORS"
    printf '  "warnings": %d,\n'    "$WARNINGS"
    printf '  "skipped": %d,\n'     "$SKIPPED"
    printf '  "passed": %d,\n'      "$PASSED"
    printf '  "gates": {\n'
    FIRST=true
    for gate in $GATES; do
      EXIT_FILE="$EXIT_DIR/${gate}.exit"
      code=0
      [ -f "$EXIT_FILE" ] && code=$(cat "$EXIT_FILE")
      [ "$FIRST" = "true" ] && FIRST=false || printf ',\n'
      printf '    "%s": %d' "$gate" "$code"
    done
    printf '\n  }\n}\n'
  } > "$JSON_FILE"
  cat "$JSON_FILE"
fi

# ── Exit logic ────────────────────────────────────────────────────────────────
[ "$NO_BLOCK" = "true" ] && exit 0

if [ "$ERRORS" -gt 0 ]; then
  echo "Exit: 1 (hard block — fix errors before proceeding)"
  exit 1
fi

[ "$WARNINGS" -gt 0 ] && exit 2
exit 0
