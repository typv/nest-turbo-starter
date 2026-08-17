#!/usr/bin/env bash
# check-coverage.sh — Gate: code coverage threshold check.
# Exit codes: 0=above threshold, 1=below threshold, 3=tool missing, 4=no report found

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib-gate-utils.sh"
source "$SCRIPT_DIR/lib-lockfile-detector.sh"

GATE="coverage"

# Read threshold from config (default: 70%)
THRESHOLD="$(read_config_value "thresholds.coverage")"
THRESHOLD="${THRESHOLD:-70}"

# Locate coverage report
REPORT="$(get_coverage_report_path)"

if [ -z "$REPORT" ] || [ ! -f "$REPORT" ]; then
  print_status "$GATE" "skip" "no coverage report found (run tests with coverage first)"
  exit 4
fi

# Parse coverage percentage based on report format
COVERAGE=""

case "$REPORT" in
  *.info)
    # lcov — sum lines found/hit from LF:/LH: pairs
    if command -v lcov &>/dev/null; then
      COVERAGE=$(lcov --summary "$REPORT" 2>&1 | grep -i "lines" | grep -oE '[0-9]+\.[0-9]+%' | head -1 | tr -d '%')
    else
      LH=$(grep "^LH:" "$REPORT" | awk -F: '{sum+=$2} END{print sum}')
      LF=$(grep "^LF:" "$REPORT" | awk -F: '{sum+=$2} END{print sum}')
      if [ -n "$LF" ] && [ "$LF" -gt 0 ]; then
        COVERAGE=$(awk "BEGIN{printf \"%.1f\", ($LH/$LF)*100}")
      fi
    fi
    ;;
  *coverage-summary.json)
    # Istanbul/nyc JSON summary
    if command -v jq &>/dev/null; then
      COVERAGE=$(jq -r '.total.lines.pct // .total.statements.pct // empty' "$REPORT" 2>/dev/null)
    fi
    ;;
  *.xml)
    # Cobertura XML (pytest-cov, dotnet, jacoco)
    COVERAGE=$(grep -oE 'line-rate="[0-9.]+"' "$REPORT" | head -1 | grep -oE '[0-9.]+')
    if [ -n "$COVERAGE" ]; then
      # line-rate is 0-1 fraction, convert to percentage
      COVERAGE=$(awk "BEGIN{printf \"%.1f\", $COVERAGE * 100}")
    fi
    ;;
  *.out)
    # Go coverage.out
    if command -v go &>/dev/null; then
      COVERAGE=$(go tool cover -func="$REPORT" 2>/dev/null | grep "^total:" | awk '{print $3}' | tr -d '%')
    fi
    ;;
  */.resultset.json)
    # SimpleCov (Ruby)
    if command -v jq &>/dev/null; then
      COVERAGE=$(jq -r '.[].coverage | to_entries | map(.value // []) | flatten | [map(select(. != null)) | length, length] | (.[0] / .[1] * 100)' "$REPORT" 2>/dev/null)
    fi
    ;;
esac

if [ -z "$COVERAGE" ]; then
  print_status "$GATE" "skip" "could not parse coverage from $REPORT"
  exit 4
fi

# Compare coverage vs threshold (integer comparison after rounding)
COVERAGE_INT=$(printf "%.0f" "$COVERAGE" 2>/dev/null || echo 0)
THRESHOLD_INT=$(printf "%.0f" "$THRESHOLD" 2>/dev/null || echo 70)

if [ "$COVERAGE_INT" -ge "$THRESHOLD_INT" ]; then
  print_status "$GATE" "ok" "${COVERAGE}% (threshold: ${THRESHOLD}%)"
  exit 0
else
  print_status "$GATE" "error" "${COVERAGE}% is below threshold of ${THRESHOLD}%"
  exit 1
fi
