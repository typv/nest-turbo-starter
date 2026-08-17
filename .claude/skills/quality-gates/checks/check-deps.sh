#!/usr/bin/env bash
# check-deps.sh — Gate: dependency vulnerability scan via trivy.
# Exit codes: 0=pass, 1=CRITICAL found, 2=HIGH only, 3=tool missing, 4=skipped

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib-gate-utils.sh"
source "$SCRIPT_DIR/lib-lockfile-detector.sh"
source "$SCRIPT_DIR/lib-scope-resolver.sh"

GATE="deps"

check_tool_installed trivy

RAW_DIR="${QUALITY_GATES_RUN_DIR:-.quality-gates/reports/raw/${QUALITY_GATES_RUN_ID:-manual-$(date +%H%M%S)}}"
mkdir -p "$RAW_DIR"
OUTFILE="$RAW_DIR/deps-report.json"

# Build --skip-dirs flag from resolved excludes
SKIP_DIRS="$(format_excludes_for_tool trivy)"
SKIP_FLAG=""
if [ -n "$SKIP_DIRS" ]; then
  SKIP_FLAG="--skip-dirs $SKIP_DIRS"
fi

# Collect lockfile targets for the detected stack
TARGETS=()
while IFS= read -r target; do
  [ -n "$target" ] && TARGETS+=("$target")
done < <(get_trivy_targets)

if [ ${#TARGETS[@]} -eq 0 ]; then
  print_status "$GATE" "skip" "trivy: no lockfiles found"
  exit 4
fi

RUN_MODE="$(resolve_run_mode)"
BASE="$(resolve_base_sha)"

# In diff modes, only scan lockfiles that changed
if [ -n "$BASE" ] && [ "$RUN_MODE" != "full" ] && [ "$RUN_MODE" != "ci" ]; then
  CHANGED=$(git diff --name-only "$BASE" HEAD 2>/dev/null)
  if [ -n "$CHANGED" ]; then
    TARGETS_FILTERED=()
    for t in "${TARGETS[@]}"; do
      if [ "$t" = "." ]; then
        if echo "$CHANGED" | grep -qE '(pom\.xml|build\.gradle|Dockerfile|docker-compose)'; then
          TARGETS_FILTERED+=("$t")
        fi
      else
        echo "$CHANGED" | grep -qF "$t" && TARGETS_FILTERED+=("$t")
      fi
    done
    if [ ${#TARGETS_FILTERED[@]} -eq 0 ]; then
      print_status "$GATE" "skip" "trivy: no lockfile changes in diff"
      exit 4
    fi
    TARGETS=("${TARGETS_FILTERED[@]}")
  fi
fi

# pre-commit: check staged lockfiles only
if [ "$RUN_MODE" = "pre-commit" ]; then
  STAGED=$(git diff --cached --name-only 2>/dev/null)
  TARGETS_FILTERED=()
  for t in "${TARGETS[@]}"; do
    if [ "$t" = "." ]; then
      echo "$STAGED" | grep -qE '(pom\.xml|build\.gradle|Dockerfile)' && TARGETS_FILTERED+=("$t")
    else
      echo "$STAGED" | grep -qF "$t" && TARGETS_FILTERED+=("$t")
    fi
  done
  if [ ${#TARGETS_FILTERED[@]} -eq 0 ]; then
    print_status "$GATE" "skip" "trivy: no lockfile changes staged"
    exit 4
  fi
  TARGETS=("${TARGETS_FILTERED[@]}")
fi

HAS_CRITICAL=0
HAS_HIGH=0
CRITICAL_COUNT=0
HIGH_COUNT=0

# Read trivy.ignore_file from config; pass --ignorefile if set and file exists
TRIVY_IGNORE_FILE="$(read_config_value "trivy.ignore_file")"
IGNORE_FILE_FLAG=""
if [ -n "$TRIVY_IGNORE_FILE" ] && [ -f "$TRIVY_IGNORE_FILE" ]; then
  IGNORE_FILE_FLAG="--ignorefile $TRIVY_IGNORE_FILE"
fi

for target in "${TARGETS[@]}"; do
  TARGET_OUT="$RAW_DIR/deps-report-$(basename "$target" | tr '/' '-').json"
  # shellcheck disable=SC2086
  echo "trivy fs \"$target\" --severity CRITICAL,HIGH --ignore-unfixed --format json --output \"$TARGET_OUT\" --no-progress $SKIP_FLAG $IGNORE_FILE_FLAG --quiet" >> "$RAW_DIR/deps.cmd"
  trivy fs "$target" \
    --severity "CRITICAL,HIGH" \
    --ignore-unfixed \
    --format json \
    --output "$TARGET_OUT" \
    --no-progress \
    $SKIP_FLAG \
    $IGNORE_FILE_FLAG \
    --quiet 2>/dev/null

  if [ -f "$TARGET_OUT" ] && command -v jq &>/dev/null; then
    C=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity=="CRITICAL")] | length' "$TARGET_OUT" 2>/dev/null || echo 0)
    H=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity=="HIGH")] | length' "$TARGET_OUT" 2>/dev/null || echo 0)
    CRITICAL_COUNT=$((CRITICAL_COUNT + C))
    HIGH_COUNT=$((HIGH_COUNT + H))
    [ "$C" -gt 0 ] && HAS_CRITICAL=1
    [ "$H" -gt 0 ] && HAS_HIGH=1
  fi
done

# Copy last report as canonical output
cp "$TARGET_OUT" "$OUTFILE" 2>/dev/null || true

if [ "$HAS_CRITICAL" -eq 1 ]; then
  print_status "$GATE" "error" "trivy: ${CRITICAL_COUNT} CRITICAL vuln(s) found → $OUTFILE"
  exit 1
elif [ "$HAS_HIGH" -eq 1 ]; then
  print_status "$GATE" "warn" "trivy: ${HIGH_COUNT} HIGH vuln(s) found → $OUTFILE"
  exit 2
else
  print_status "$GATE" "ok" "trivy: no CRITICAL/HIGH vulnerabilities found"
  exit 0
fi
