#!/usr/bin/env bash
# check-sast.sh — Gate: static analysis via semgrep.
# Exit codes: 0=pass, 1=ERROR findings, 2=WARNING only, 3=tool missing, 4=skipped

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib-gate-utils.sh"
source "$SCRIPT_DIR/lib-scope-resolver.sh"

GATE="sast"

check_tool_installed semgrep

RAW_DIR="${QUALITY_GATES_RUN_DIR:-.quality-gates/reports/raw/${QUALITY_GATES_RUN_ID:-manual-$(date +%H%M%S)}}"
mkdir -p "$RAW_DIR"
OUTFILE="$RAW_DIR/sast-report.json"

BASE="$(resolve_base_sha)"

RULESETS=("--config" "auto")

# Build exclude flags
EXCLUDE_FLAGS=()
while IFS= read -r pat; do
  [ -n "$pat" ] && EXCLUDE_FLAGS+=("--exclude" "$pat")
done < <(resolve_scan_excludes)

# Read semgrep.extra_args from config; split safely without eval
EXTRA_ARGS_STR="$(read_config_value "semgrep.extra_args")"
EXTRA_ARGS=()
if [ -n "$EXTRA_ARGS_STR" ]; then
  # Word-split on whitespace using set -- (safe, no eval)
  set -- $EXTRA_ARGS_STR
  EXTRA_ARGS=("$@")
fi

# Mode-aware scan target + baseline selection
RUN_MODE="$(resolve_run_mode)"

SCAN_TARGETS=()
BASELINE_FLAG=()

case "$RUN_MODE" in
  pre-commit)
    # Scan only staged source files — semgrep --baseline-commit doesn't work with staged
    STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null \
      | grep -E '\.(js|ts|jsx|tsx|py|go|java|kt|rb|php|rs|cs|swift)$')
    if [ -z "$STAGED_FILES" ]; then
      print_status "$GATE" "ok" "semgrep: no staged source files to scan"
      exit 0
    fi
    while IFS= read -r f; do
      [ -n "$f" ] && [ -f "$f" ] && SCAN_TARGETS+=("$f")
    done <<< "$STAGED_FILES"
    ;;
  pre-push|pr|diff)
    if [ -n "$BASE" ]; then
      BASELINE_FLAG=("--baseline-commit" "$BASE")
    fi
    while IFS= read -r dir; do
      [ -n "$dir" ] && SCAN_TARGETS+=("$dir")
    done < <(resolve_scan_includes)
    ;;
  full|ci|*)
    # Full scan — no baseline
    while IFS= read -r dir; do
      [ -n "$dir" ] && SCAN_TARGETS+=("$dir")
    done < <(resolve_scan_includes)
    ;;
esac

[ ${#SCAN_TARGETS[@]} -eq 0 ] && SCAN_TARGETS+=(".")

# Record exact command for debug reference — quote glob patterns so copy-paste is shell-safe
_cmd_log='semgrep'
for _a in "${RULESETS[@]}" "${BASELINE_FLAG[@]}" "${EXTRA_ARGS[@]}"; do
  _cmd_log="$_cmd_log $_a"
done
_exclude_next=false
for _a in "${EXCLUDE_FLAGS[@]}"; do
  if [ "$_exclude_next" = "true" ]; then
    _cmd_log="$_cmd_log '$_a'"    # glob pattern — quoted
    _exclude_next=false
  else
    _cmd_log="$_cmd_log $_a"      # --exclude flag
    _exclude_next=true
  fi
done
_cmd_log="$_cmd_log --json --output \"$OUTFILE\" --quiet"
for _a in "${SCAN_TARGETS[@]}"; do
  _cmd_log="$_cmd_log $_a"
done
printf '%s\n' "$_cmd_log" > "$RAW_DIR/sast.cmd"
unset _cmd_log _a _exclude_next

semgrep \
  "${RULESETS[@]}" \
  "${BASELINE_FLAG[@]}" \
  "${EXCLUDE_FLAGS[@]}" \
  "${EXTRA_ARGS[@]}" \
  --json \
  --output "$OUTFILE" \
  --quiet \
  "${SCAN_TARGETS[@]}" 2>/dev/null
SEMGREP_EXIT=$?

# When using --output file, semgrep always exits 0 regardless of findings.
# Always read findings from the JSON report file.
if [ ! -f "$OUTFILE" ]; then
  print_status "$GATE" "ok" "semgrep: no findings"
  exit 0
fi

ERROR_COUNT=0
WARN_COUNT=0
TOTAL=0

# Validate report is parseable JSON before counting
if command -v jq &>/dev/null && jq empty "$OUTFILE" 2>/dev/null; then
  ERROR_COUNT=$(jq '[.results[]? | select(.extra.severity=="ERROR")] | length' "$OUTFILE" 2>/dev/null || echo 0)
  WARN_COUNT=$(jq '[.results[]? | select(.extra.severity=="WARNING")] | length' "$OUTFILE" 2>/dev/null || echo 0)
  TOTAL=$(jq '.results | length' "$OUTFILE" 2>/dev/null || echo 0)
fi

if [ "$ERROR_COUNT" -gt 0 ]; then
  print_status "$GATE" "error" "semgrep: ${ERROR_COUNT} ERROR finding(s) → $OUTFILE"
  exit 1
elif [ "$WARN_COUNT" -gt 0 ] || [ "$TOTAL" -gt 0 ]; then
  print_status "$GATE" "warn" "semgrep: ${TOTAL} finding(s) → $OUTFILE"
  exit 2
else
  print_status "$GATE" "ok" "semgrep: no findings"
  exit 0
fi
