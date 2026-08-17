#!/usr/bin/env bash
# check-dast.sh — Gate: dynamic analysis via nuclei (CI-only, declared endpoints).
# Exit codes: 0=pass, 1=critical/high findings, 3=tool missing, 4=skipped

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib-gate-utils.sh"

GATE="dast"

ENDPOINTS_FILE="$(read_config_value "dast.endpoints_file")"
ENDPOINTS_FILE="${ENDPOINTS_FILE:-.quality-gates/endpoints.txt}"

# DAST is CI-only by default — skip unless CI env or QUALITY_GATES_DAST_LOCAL=1
DAST_ALLOW_LOCAL="${QUALITY_GATES_DAST_LOCAL:-$(read_config_value "dast.allow_local")}"

if [ -z "${CI:-}" ] && [ "$DAST_ALLOW_LOCAL" != "true" ] && [ "$DAST_ALLOW_LOCAL" != "1" ]; then
  print_status "$GATE" "skip" "nuclei: skipped (CI only — set dast.allow_local=true in config or QUALITY_GATES_DAST_LOCAL=1)"
  exit 4
fi

check_tool_installed nuclei

# Require endpoints file — never scan arbitrary targets
if [ ! -f "$ENDPOINTS_FILE" ]; then
  print_status "$GATE" "skip" "nuclei: no endpoints file at $ENDPOINTS_FILE — create it to enable DAST"
  exit 4
fi

if [ ! -s "$ENDPOINTS_FILE" ]; then
  print_status "$GATE" "skip" "nuclei: endpoints file is empty"
  exit 4
fi

RAW_DIR="${QUALITY_GATES_RUN_DIR:-.quality-gates/reports/raw/${QUALITY_GATES_RUN_ID:-manual-$(date +%H%M%S)}}"
mkdir -p "$RAW_DIR"
RAW_OUTFILE="$RAW_DIR/dast-report.json"

# Always scan all severities — blocking threshold is separate (dast.block_severity).
SCAN_SEVERITY="critical,high,medium,low,info"

# Read blocking severity threshold: only findings at or above this level exit 1
# Values: critical | high (default) | medium
BLOCK_SEVERITY="$(read_config_value "dast.block_severity")"
BLOCK_SEVERITY="${BLOCK_SEVERITY:-high}"

# Read tags from config — supports both YAML list and scalar "a,b,c" string.
# 1. Try read_config_array (handles YAML list + inline [a,b,c]), join to CSV.
# 2. If empty (plain scalar string), fall back to read_config_value.
# 3. Normalize: strip spaces around commas so nuclei -tags gets clean CSV.
TAGS="$(read_config_array "dast.tags" | tr '\n' ',' | sed 's/,$//')"
if [ -z "$TAGS" ]; then
  TAGS="$(read_config_value "dast.tags")"
fi
TAGS="$(echo "$TAGS" | tr -d ' ')"  # strip spaces
TAGS="${TAGS:-owasp,sqli,xss,ssrf,rce,lfi,auth-bypass,exposure,misconfig,cve}"
TAGS_FLAG="-tags $TAGS"

# Record exact command for debug reference
echo "nuclei -list \"$ENDPOINTS_FILE\" $TAGS_FLAG -severity \"$SCAN_SEVERITY\" -j -no-color" > "$RAW_DIR/dast.cmd"

# Run nuclei against declared endpoints — scan all severities, block only on critical/high
# Use -j (JSONL stdout) + tee to write raw file; redirect stderr (banner/logs) to /dev/null
nuclei \
  -list "$ENDPOINTS_FILE" \
  $TAGS_FLAG \
  -severity "$SCAN_SEVERITY" \
  -j \
  -no-color 2>/dev/null | tee "$RAW_OUTFILE" > /dev/null
NUCLEI_EXIT=${PIPESTATUS[0]}

if [ "$NUCLEI_EXIT" -ne 0 ]; then
  print_status "$GATE" "error" "nuclei: scan failed (exit $NUCLEI_EXIT)"
  exit 1
fi

# Count findings per severity
COUNT_CRITICAL=0; COUNT_HIGH=0; COUNT_MEDIUM=0; COUNT_LOW=0; COUNT_INFO=0; COUNT_ALL=0
if [ -f "$RAW_OUTFILE" ]; then
  COUNT_ALL=$(grep -c '^{' "$RAW_OUTFILE" 2>/dev/null | tr -d '[:space:]'); COUNT_ALL=${COUNT_ALL:-0}
  # nuclei -j format: severity is under info.severity key
  COUNT_CRITICAL=$(grep -c '"severity":"critical"' "$RAW_OUTFILE" 2>/dev/null | tr -d '[:space:]'); COUNT_CRITICAL=${COUNT_CRITICAL:-0}
  COUNT_HIGH=$(grep -c '"severity":"high"' "$RAW_OUTFILE" 2>/dev/null | tr -d '[:space:]'); COUNT_HIGH=${COUNT_HIGH:-0}
  COUNT_MEDIUM=$(grep -c '"severity":"medium"' "$RAW_OUTFILE" 2>/dev/null | tr -d '[:space:]'); COUNT_MEDIUM=${COUNT_MEDIUM:-0}
  COUNT_LOW=$(grep -c '"severity":"low"' "$RAW_OUTFILE" 2>/dev/null | tr -d '[:space:]'); COUNT_LOW=${COUNT_LOW:-0}
  COUNT_INFO=$(grep -c '"severity":"info"' "$RAW_OUTFILE" 2>/dev/null | tr -d '[:space:]'); COUNT_INFO=${COUNT_INFO:-0}
fi

# Determine blocking count based on configured block_severity threshold
# Severity ladder: critical > high > medium > low > info
case "$BLOCK_SEVERITY" in
  critical)
    COUNT_BLOCKING=$COUNT_CRITICAL
    BLOCK_LABEL="critical"
    ;;
  medium)
    COUNT_BLOCKING=$((COUNT_CRITICAL + COUNT_HIGH + COUNT_MEDIUM))
    BLOCK_LABEL="critical/high/medium"
    ;;
  high|*)
    COUNT_BLOCKING=$((COUNT_CRITICAL + COUNT_HIGH))
    BLOCK_LABEL="critical/high"
    ;;
esac

if [ "$COUNT_BLOCKING" -gt 0 ]; then
  print_status "$GATE" "error" "nuclei: ${COUNT_BLOCKING} ${BLOCK_LABEL} finding(s) → $RAW_OUTFILE"
  exit 1
elif [ "$COUNT_ALL" -gt 0 ]; then
  print_status "$GATE" "warn" "nuclei: ${COUNT_ALL} finding(s) (below block threshold: ${BLOCK_SEVERITY}) → $RAW_OUTFILE"
  exit 2
else
  print_status "$GATE" "ok" "nuclei: no findings → $RAW_OUTFILE"
  exit 0
fi
