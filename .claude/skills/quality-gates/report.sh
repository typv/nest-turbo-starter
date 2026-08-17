#!/usr/bin/env bash
# report.sh — Generate markdown report from gate output files in .quality-gates/.
# Usage: report.sh [--output-dir <path>]
# Writes: .quality-gates/report-{timestamp}.md → symlinked as latest-report.md
# ADF integration: copies to $ADF_REPORTS_PATH if set.

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SKILL_DIR/checks/lib-gate-utils.sh"

OUTPUT_DIR=".quality-gates/reports"
RUN_ID=""
while [ $# -gt 0 ]; do
  case "$1" in
    --output-dir) OUTPUT_DIR="$2"; shift 2 ;;
    --run-id)     RUN_ID="$2"; shift 2 ;;
    *) shift ;;
  esac
done

mkdir -p "$OUTPUT_DIR"

# Resolve raw dir for this run
if [ -n "$RUN_ID" ]; then
  RAW_DIR="$OUTPUT_DIR/raw/$RUN_ID"
else
  # Find latest raw dir
  RAW_DIR="$(ls -1td "$OUTPUT_DIR/raw"/*/ 2>/dev/null | head -1)"
  RAW_DIR="${RAW_DIR%/}"  # strip trailing slash
fi

if [ -z "$RAW_DIR" ] || [ ! -d "$RAW_DIR" ]; then
  # Fallback: read from output dir root (legacy/standalone runs)
  RAW_DIR="$OUTPUT_DIR"
fi

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_FILE="$OUTPUT_DIR/report-${TIMESTAMP}.md"
LATEST_LINK="$OUTPUT_DIR/latest-report.md"

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
DATE_HUMAN=$(date '+%Y-%m-%d %H:%M:%S %Z')

# Detect trigger context
TRIGGER="manual"
[ -n "${CI:-}" ] && TRIGGER="CI"
[ "${QUALITY_GATES_SCOPE:-}" = "pre-commit" ] && TRIGGER="pre-commit"
[ "${QUALITY_GATES_SCOPE:-}" = "pre-push" ] && TRIGGER="pre-push"

# ── Helper: status label from exit-code file ───────────────────────────────────
# Gate scripts write their exit code to .quality-gates/{gate}.exit when run via run-all.sh
# Fallback: infer from presence/content of report files.

gate_status_icon() {
  local gate="$1"
  local exit_file="$RAW_DIR/${gate}.exit"
  local code=4  # default: skipped

  [ -f "$exit_file" ] && code=$(cat "$exit_file")

  case "$code" in
    0) echo "✅ Pass" ;;
    1) echo "❌ Fail" ;;
    2) echo "⚠️ Warn" ;;
    3) echo "⚠️ Tool missing" ;;
    4) echo "ℹ️ Skipped" ;;
    *) echo "❓ Unknown" ;;
  esac
}

gate_findings_summary() {
  local gate="$1"
  local report="$RAW_DIR/${gate}-report.json"

  if [ ! -f "$report" ]; then
    echo "—"
    return
  fi

  case "$gate" in
    secrets)
      if command -v jq &>/dev/null; then
        COUNT=$(jq 'length' "$report" 2>/dev/null || echo "?")
        echo "${COUNT} finding(s)"
      else
        echo "see $report"
      fi
      ;;
    deps)
      if command -v jq &>/dev/null; then
        C=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity=="CRITICAL")] | length' "$report" 2>/dev/null || echo 0)
        H=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity=="HIGH")] | length' "$report" 2>/dev/null || echo 0)
        echo "${C} CRITICAL, ${H} HIGH"
      else
        echo "see $report"
      fi
      ;;
    sast)
      if command -v jq &>/dev/null; then
        E=$(jq '[.results[]? | select(.extra.severity=="ERROR")] | length' "$report" 2>/dev/null || echo 0)
        W=$(jq '[.results[]? | select(.extra.severity=="WARNING")] | length' "$report" 2>/dev/null || echo 0)
        echo "${E} ERROR, ${W} WARNING"
      else
        echo "see $report"
      fi
      ;;
    file-size)
      local txt="$RAW_DIR/file-size-report.txt"
      if [ -f "$txt" ]; then
        COUNT=$(wc -l < "$txt" | tr -d ' ')
        echo "${COUNT} file(s) over limit"
      else
        echo "—"
      fi
      ;;
    coverage)
      local exit_file="$RAW_DIR/${gate}.exit"
      [ -f "$exit_file" ] && [ "$(cat "$exit_file")" = "0" ] && echo "above threshold" || echo "below threshold"
      ;;
    sonar)
      echo "see SonarQube dashboard"
      ;;
    dast)
      if command -v jq &>/dev/null && [ -f "$report" ]; then
        COUNT=$(jq -s 'length' "$report" 2>/dev/null || echo "?")
        echo "${COUNT} finding(s)"
      else
        echo "—"
      fi
      ;;
    *)
      echo "—"
      ;;
  esac
}

# ── Write report ──────────────────────────────────────────────────────────────
{
  echo "# Quality Gates Report"
  echo ""
  echo "**Date:** ${DATE_HUMAN}"
  echo "**Branch:** \`${BRANCH}\`"
  echo "**Commit:** \`${COMMIT}\`"
  echo "**Triggered by:** ${TRIGGER}"
  echo ""
  echo "## Summary"
  echo ""
  echo "| Gate | Status | Findings |"
  echo "|------|--------|----------|"

  for gate in secrets deps sast file-size coverage sonar dast; do
    STATUS=$(gate_status_icon "$gate")
    FINDINGS=$(gate_findings_summary "$gate")
    echo "| $gate | $STATUS | $FINDINGS |"
  done

  echo ""
  echo "## Details"
  echo ""

  # Helper: print the recorded command for a gate (if available)
  _print_cmd() {
    local gate="$1"
    local cmd_file="$RAW_DIR/${gate}.cmd"
    if [ -f "$cmd_file" ] && [ -s "$cmd_file" ]; then
      echo '```sh'
      cat "$cmd_file"
      echo '```'
      echo ""
    fi
  }

  # Helper: gate ran if .exit file exists
  _gate_ran() { [ -f "$RAW_DIR/${1}.exit" ]; }

  # SAST detail — always show if gate ran
  if _gate_ran "sast"; then
    echo "### SAST (semgrep)"
    echo ""
    _print_cmd "sast"
    SAST_REPORT="$RAW_DIR/sast-report.json"
    if [ -f "$SAST_REPORT" ] && command -v jq &>/dev/null; then
      COUNT=$(jq '.results | length' "$SAST_REPORT" 2>/dev/null || echo 0)
      if [ "$COUNT" -gt 0 ]; then
        echo "| Severity | Rule | File | Line | Description |"
        echo "|----------|------|------|------|-------------|"
        jq -r '.results[]? | "| \(.extra.severity // "INFO") | \(.check_id) | \(.path) | \(.start.line) | \(.extra.message // "—") |"' "$SAST_REPORT" 2>/dev/null | head -20
        [ "$COUNT" -gt 20 ] && echo "" && echo "_... and $((COUNT - 20)) more. See \`${SAST_REPORT}\`_"
      else
        echo "_No findings._"
      fi
    else
      echo "_No report file._"
    fi
    echo ""
  fi

  # Deps detail — always show if gate ran
  if _gate_ran "deps"; then
    echo "### Dependency Vulnerabilities (trivy)"
    echo ""
    _print_cmd "deps"
    DEPS_REPORT="$RAW_DIR/deps-report.json"
    if [ -f "$DEPS_REPORT" ] && command -v jq &>/dev/null; then
      TOTAL=$(jq '[.Results[]?.Vulnerabilities[]?] | length' "$DEPS_REPORT" 2>/dev/null || echo 0)
      if [ "$TOTAL" -gt 0 ]; then
        echo "| Severity | CVE | Package | Fixed Version | Description |"
        echo "|----------|-----|---------|---------------|-------------|"
        jq -r '.Results[]?.Vulnerabilities[]? | "| \(.Severity) | \(.VulnerabilityID) | \(.PkgName) \(.InstalledVersion) | \(.FixedVersion // "—") | \(.Title // .Description // "—" | .[0:120]) |"' \
          "$DEPS_REPORT" 2>/dev/null | head -20
        [ "$TOTAL" -gt 20 ] && echo "" && echo "_... and $((TOTAL - 20)) more. See \`${DEPS_REPORT}\`_"
      else
        echo "_No findings._"
      fi
    else
      echo "_No report file._"
    fi
    echo ""
  fi

  # Secrets detail — always show if gate ran
  if _gate_ran "secrets"; then
    echo "### Secrets (gitleaks)"
    echo ""
    _print_cmd "secrets"
    SECRETS_REPORT="$RAW_DIR/secrets-report.json"
    if [ -f "$SECRETS_REPORT" ] && command -v jq &>/dev/null && jq empty "$SECRETS_REPORT" 2>/dev/null; then
      COUNT=$(jq 'length' "$SECRETS_REPORT" 2>/dev/null || echo 0)
      if [ "$COUNT" -gt 0 ]; then
        echo "| Rule | File | Line | Secret (masked) |"
        echo "|------|------|------|-----------------|"
        jq -r '.[]? | "| \(.RuleID // "unknown") | \(.File // "—") | \(.StartLine // "—") | \(.Secret[0:4] // "")... |"' \
          "$SECRETS_REPORT" 2>/dev/null | head -20
        [ "$COUNT" -gt 20 ] && echo "" && echo "_... and $((COUNT - 20)) more. See \`${SECRETS_REPORT}\`_"
      else
        echo "_No findings._"
      fi
    else
      echo "_No report file._"
    fi
    echo ""
  fi

  # File-size detail — always show if gate ran
  if _gate_ran "file-size"; then
    echo "### File Size"
    echo ""
    _print_cmd "file-size"
    FILESIZE_REPORT="$RAW_DIR/file-size-report.txt"
    if [ -f "$FILESIZE_REPORT" ] && [ -s "$FILESIZE_REPORT" ]; then
      echo '```'
      head -30 "$FILESIZE_REPORT"
      echo '```'
    else
      echo "_No files over limit._"
    fi
    echo ""
  fi

  # Coverage detail — always show if gate ran
  if _gate_ran "coverage"; then
    echo "### Coverage"
    echo ""
    COVERAGE_REPORT="$RAW_DIR/coverage-report.txt"
    ACTUAL=$(grep -oE '[0-9]+(\.[0-9]+)?%' "$COVERAGE_REPORT" 2>/dev/null | head -1)
    THRESHOLD=$(read_config_value "thresholds.coverage" 2>/dev/null || echo "?")
    COVERAGE_EXIT=$(cat "$RAW_DIR/coverage.exit" 2>/dev/null || echo "?")
    STATUS_LABEL="pass"; [ "$COVERAGE_EXIT" != "0" ] && STATUS_LABEL="fail"
    echo "| Actual | Threshold | Status |"
    echo "|--------|-----------|--------|"
    echo "| ${ACTUAL:-?} | ${THRESHOLD}% | ${STATUS_LABEL} |"
    echo ""
  fi

  # DAST detail — always show if gate ran
  if _gate_ran "dast"; then
    echo "### DAST (nuclei)"
    echo ""
    _print_cmd "dast"
    DAST_REPORT="$RAW_DIR/dast-report.json"
    if [ -f "$DAST_REPORT" ] && [ -s "$DAST_REPORT" ]; then
      COUNT_DAST=$(grep -c '^{' "$DAST_REPORT" 2>/dev/null || echo 0)
      if [ "$COUNT_DAST" -gt 0 ]; then
        echo "| Severity | Template | Host | Name | Description |"
        echo "|----------|----------|------|------|-------------|"
        while IFS= read -r line; do
          [[ "$line" != {* ]] && continue
          if command -v jq &>/dev/null; then
            jq -r '"| \(.info.severity // "?") | \(.["template-id"] // "—") | \(.host // "—") | \(.info.name // "—") | \(.info.description // "—" | .[0:120]) |"' \
              <<< "$line" 2>/dev/null
          else
            sev=$(echo "$line" | grep -oE '"severity":"[^"]+"' | head -1 | sed 's/.*":"//' | tr -d '"')
            tmpl=$(echo "$line" | grep -oE '"template-id":"[^"]+"' | head -1 | sed 's/.*":"//' | tr -d '"')
            host=$(echo "$line" | grep -oE '"host":"[^"]+"' | head -1 | sed 's/.*":"//' | tr -d '"')
            name=$(echo "$line" | grep -oE '"name":"[^"]+"' | head -1 | sed 's/.*":"//' | tr -d '"')
            echo "| $sev | $tmpl | $host | $name | — |"
          fi
        done < "$DAST_REPORT" | head -20
        [ "$COUNT_DAST" -gt 20 ] && echo "" && echo "_... and $((COUNT_DAST - 20)) more. See \`${DAST_REPORT}\`_"
      else
        echo "_No findings._"
      fi
    else
      echo "_No report file._"
    fi
    echo ""
  fi

  # SonarQube detail — always show if gate ran
  if _gate_ran "sonar"; then
    echo "### SonarQube"
    echo ""
    _print_cmd "sonar"
    SONAR_RAW="$RAW_DIR/sonar-report.json"
    if [ -f "$SONAR_RAW" ] && command -v jq &>/dev/null && jq empty "$SONAR_RAW" 2>/dev/null; then
      SONAR_STATUS=$(jq -r '.projectStatus.status // "UNKNOWN"' "$SONAR_RAW" 2>/dev/null)
      SONAR_PROJECT_KEY_RPT="${SONAR_PROJECT_KEY:-$(read_config_value "sonar.project_key" 2>/dev/null)}"
      SONAR_HOST_RPT="${SONAR_HOST_URL:-$(read_config_value "sonar.host_url" 2>/dev/null)}"
      echo "**Quality Gate:** ${SONAR_STATUS}"
      if [ -n "$SONAR_HOST_RPT" ] && [ -n "$SONAR_PROJECT_KEY_RPT" ]; then
        echo ""
        echo "**Dashboard:** [${SONAR_HOST_RPT}/dashboard?id=${SONAR_PROJECT_KEY_RPT}](${SONAR_HOST_RPT}/dashboard?id=${SONAR_PROJECT_KEY_RPT})"
      fi
      echo ""

      # Dashboard metrics (from /api/measures/component)
      MEASURE_COUNT=$(jq '[.measures[]?] | length' "$SONAR_RAW" 2>/dev/null || echo 0)
      if [ "$MEASURE_COUNT" -gt 0 ]; then
        # Helper: extract metric value by key
        _m() { jq -r --arg k "$1" '.measures[]? | select(.metric==$k) | .value // "—"' "$SONAR_RAW" 2>/dev/null | head -1; }
        # Rating: 1=A 2=B 3=C 4=D 5=E
        _rating() {
          local v; v=$(_m "$1")
          case "${v%.*}" in 1) echo "A" ;; 2) echo "B" ;; 3) echo "C" ;; 4) echo "D" ;; 5) echo "E" ;; *) echo "${v:-—}" ;; esac
        }

        echo "| Metric | Value | Rating |"
        echo "|--------|-------|--------|"
        echo "| Security | $(_m vulnerabilities) vulnerabilities | $(_rating security_rating) |"
        echo "| Reliability | $(_m bugs) bugs | $(_rating reliability_rating) |"
        echo "| Maintainability | $(_m code_smells) code smells | $(_rating sqale_rating) |"
        echo "| Coverage | $(_m coverage)% | — |"
        echo "| Duplications | $(_m duplicated_lines_density)% | — |"
        echo "| Security Hotspots | $(_m security_hotspots) | — |"
        echo "| Accepted Issues | $(_m accepted_issues) | — |"
        echo "| Lines of Code | $(_m ncloc) | — |"
        echo ""
      fi

      # Quality gate conditions breakdown
      CONDITION_COUNT=$(jq '[.projectStatus.conditions[]?] | length' "$SONAR_RAW" 2>/dev/null || echo 0)
      if [ "$CONDITION_COUNT" -gt 0 ]; then
        echo "**Quality Gate Conditions:**"
        echo ""
        echo "| Metric | Status | Actual | Threshold |"
        echo "|--------|--------|--------|-----------|"
        jq -r '.projectStatus.conditions[]? | "| \(.metricKey) | \(.status) | \(.actualValue // "—") | \(.errorThreshold // "—") |"' \
          "$SONAR_RAW" 2>/dev/null
        echo ""
      fi

      # Issues list (from sonar-issues.json fetched by check-sonar.sh)
      SONAR_ISSUES="$RAW_DIR/sonar-issues.json"
      if [ -f "$SONAR_ISSUES" ] && command -v jq &>/dev/null && jq empty "$SONAR_ISSUES" 2>/dev/null; then
        ISSUE_COUNT=$(jq '[.issues[]?] | length' "$SONAR_ISSUES" 2>/dev/null || echo 0)
        if [ "$ISSUE_COUNT" -gt 0 ]; then
          echo "**Issues (top ${ISSUE_COUNT} — ordered by severity):**"
          echo ""
          echo "| Severity | Type | File | Line | Message |"
          echo "|----------|------|------|------|---------|"
          jq -r '.issues[]? | "| \(.severity // "?") | \(.type // "—") | \(.component | split(":") | last) | \(.line // "—") | \(.message // "—" | .[0:120]) |"' \
            "$SONAR_ISSUES" 2>/dev/null | head -30
          [ "$ISSUE_COUNT" -gt 30 ] && echo "" && echo "_... and $((ISSUE_COUNT - 30)) more. See \`${SONAR_ISSUES}\`_"
          echo ""
        fi
      fi
    else
      echo "_No report file._"
    fi
    echo ""
  fi

  echo "---"
  echo "_Generated by [quality-gates](/.claude/skills/quality-gates/) skill_"

} > "$REPORT_FILE"

# Symlink latest-report.md → current report
ln -sf "$(basename "$REPORT_FILE")" "$LATEST_LINK"

echo "📄 Report written: $REPORT_FILE"
echo "🔗 Latest: $LATEST_LINK"

# ADF integration: copy to ADF_REPORTS_PATH if set
if [ -n "${ADF_REPORTS_PATH:-}" ]; then
  mkdir -p "$ADF_REPORTS_PATH"
  DEST="$ADF_REPORTS_PATH/quality-gates-${TIMESTAMP}.md"
  cp "$REPORT_FILE" "$DEST"
  echo "📁 Copied to: $DEST"
fi
