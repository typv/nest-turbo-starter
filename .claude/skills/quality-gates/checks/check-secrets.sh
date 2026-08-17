#!/usr/bin/env bash
# check-secrets.sh — Gate: secret detection via gitleaks.
# Exit codes: 0=pass, 1=secrets found, 3=tool missing, 4=skipped

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib-gate-utils.sh"

GATE="secrets"

check_tool_installed gitleaks

# Determine scan mode from QUALITY_GATES_SCOPE or git context
SCOPE="${QUALITY_GATES_SCOPE:-}"
BASE="$(resolve_base_sha)"

# Locate custom config: gitleaks.config_path in config takes priority, then auto-detect
GITLEAKS_CONFIG_PATH="$(read_config_value "gitleaks.config_path")"
CONFIG_FLAG=""
if [ -n "$GITLEAKS_CONFIG_PATH" ] && [ -f "$GITLEAKS_CONFIG_PATH" ]; then
  CONFIG_FLAG="--config $GITLEAKS_CONFIG_PATH"
elif [ -f ".gitleaks.toml" ]; then
  CONFIG_FLAG="--config .gitleaks.toml"
elif [ -f ".quality-gates/gitleaks.toml" ]; then
  CONFIG_FLAG="--config .quality-gates/gitleaks.toml"
elif [ -f ".claude/skills/quality-gates/templates/gitleaks.toml" ]; then
  CONFIG_FLAG="--config .claude/skills/quality-gates/templates/gitleaks.toml"
fi

# Read extra log options from config (e.g. --all for full history)
GITLEAKS_LOG_OPTS="$(read_config_value "gitleaks.log_opts")"

RAW_DIR="${QUALITY_GATES_RUN_DIR:-.quality-gates/reports/raw/${QUALITY_GATES_RUN_ID:-manual-$(date +%H%M%S)}}"
mkdir -p "$RAW_DIR"
OUTFILE="$RAW_DIR/secrets-report.json"

if [ "$SCOPE" = "pre-commit" ]; then
  # shellcheck disable=SC2086
  echo "gitleaks protect --staged $CONFIG_FLAG --report-format json --report-path \"$OUTFILE\" --no-banner" > "$RAW_DIR/secrets.cmd"
  gitleaks protect --staged $CONFIG_FLAG --report-format json --report-path "$OUTFILE" --no-banner 2>/dev/null
  STATUS=$?
elif [ -n "$BASE" ]; then
  LOG_OPTS_ARG="${BASE}..HEAD${GITLEAKS_LOG_OPTS:+ ${GITLEAKS_LOG_OPTS}}"
  # shellcheck disable=SC2086
  echo "gitleaks detect --log-opts \"${LOG_OPTS_ARG}\" $CONFIG_FLAG --report-format json --report-path \"$OUTFILE\" --no-banner" > "$RAW_DIR/secrets.cmd"
  gitleaks detect --log-opts "${LOG_OPTS_ARG}" $CONFIG_FLAG --report-format json --report-path "$OUTFILE" --no-banner 2>/dev/null
  STATUS=$?
else
  # shellcheck disable=SC2086
  echo "gitleaks detect ${GITLEAKS_LOG_OPTS:+--log-opts \"$GITLEAKS_LOG_OPTS\"} $CONFIG_FLAG --report-format json --report-path \"$OUTFILE\" --no-banner" > "$RAW_DIR/secrets.cmd"
  gitleaks detect ${GITLEAKS_LOG_OPTS:+--log-opts "$GITLEAKS_LOG_OPTS"} $CONFIG_FLAG --report-format json --report-path "$OUTFILE" --no-banner 2>/dev/null
  STATUS=$?
fi

if [ "$STATUS" -eq 0 ]; then
  print_status "$GATE" "ok" "gitleaks: no secrets found"
  exit 0
else
  COUNT=0
  if [ -f "$OUTFILE" ] && command -v jq &>/dev/null; then
    COUNT=$(jq 'length' "$OUTFILE" 2>/dev/null || echo "?")
  fi
  print_status "$GATE" "error" "gitleaks: ${COUNT} secret(s) found → $OUTFILE"
  exit 1
fi
