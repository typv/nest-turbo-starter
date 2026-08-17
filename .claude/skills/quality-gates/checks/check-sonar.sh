#!/usr/bin/env bash
# check-sonar.sh — Gate: SonarQube quality gate via sonar-scanner.
# Exit codes: 0=gate OK, 1=gate FAILED, 3=tool missing, 4=skipped (no SONAR_HOST_URL)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib-gate-utils.sh"

GATE="sonar"

# Resolve connection params: env vars take precedence over config.yaml values
SONAR_HOST_URL="${SONAR_HOST_URL:-$(read_config_value "sonar.host_url")}"
# SONAR_TOKEN is always env-only (never read from config — security)
SONAR_PROJECT_KEY="${SONAR_PROJECT_KEY:-$(read_config_value "sonar.project_key")}"

# Skip if SonarQube not configured
if [ -z "${SONAR_HOST_URL:-}" ]; then
  print_status "$GATE" "skip" "skipped (SONAR_HOST_URL not set and sonar.host_url empty in config)"
  exit 4
fi

if [ -z "${SONAR_TOKEN:-}" ]; then
  print_status "$GATE" "skip" "skipped (SONAR_TOKEN not set — use env var or .env file)"
  exit 4
fi

check_tool_installed sonar-scanner

# Locate sonar-project.properties
PROPS_FILE=""
if [ -f "sonar-project.properties" ]; then
  PROPS_FILE="sonar-project.properties"
elif [ -f ".quality-gates/sonar-project.properties" ]; then
  PROPS_FILE=".quality-gates/sonar-project.properties"
fi

SONAR_ARGS=(
  "-Dsonar.host.url=${SONAR_HOST_URL}"
  "-Dsonar.token=${SONAR_TOKEN}"
)

[ -n "$PROPS_FILE" ] && SONAR_ARGS+=("-Dproject.settings=${PROPS_FILE}")

# Always inject projectKey — sonar-scanner requires it if sonar-project.properties absent
if [ -n "${SONAR_PROJECT_KEY:-}" ]; then
  SONAR_ARGS+=("-Dsonar.projectKey=${SONAR_PROJECT_KEY}")
elif [ -z "$PROPS_FILE" ]; then
  # Derive from git remote or directory name as last resort
  _derived_key="$(git remote get-url origin 2>/dev/null | sed 's|.*/||;s|\.git$||' | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9_-' '-' | sed 's/^-//;s/-$//')"
  [ -z "$_derived_key" ] && _derived_key="$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9_-' '-' | sed 's/^-//;s/-$//')"
  if [ -n "$_derived_key" ]; then
    SONAR_ARGS+=("-Dsonar.projectKey=${_derived_key}")
    print_status "$GATE" "info" "sonar.projectKey not set — derived: ${_derived_key} (set SONAR_PROJECT_KEY or sonar.project_key to override)"
  else
    print_status "$GATE" "error" "sonar.projectKey missing — set sonar.project_key in config.yaml or SONAR_PROJECT_KEY env var"
    exit 1
  fi
fi

# Auto-inject PR decoration params in PR mode
RUN_MODE="$(resolve_run_mode)"
if [ "$RUN_MODE" = "pr" ]; then
  PR_KEY=""
  if [ -n "${GITHUB_REF:-}" ]; then
    PR_KEY=$(echo "$GITHUB_REF" | grep -oE 'pull/[0-9]+' | grep -oE '[0-9]+')
  fi
  [ -z "$PR_KEY" ] && PR_KEY="${GITHUB_PR_NUMBER:-${CI_MERGE_REQUEST_IID:-}}"

  PR_BRANCH="${GITHUB_HEAD_REF:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null)}"
  PR_BASE="${GITHUB_BASE_REF:-${CI_MERGE_REQUEST_TARGET_BRANCH_NAME:-main}}"

  [ -n "$PR_KEY" ]    && SONAR_ARGS+=("-Dsonar.pullrequest.key=${PR_KEY}")
  [ -n "$PR_BRANCH" ] && SONAR_ARGS+=("-Dsonar.pullrequest.branch=${PR_BRANCH}")
  [ -n "$PR_BASE" ]   && SONAR_ARGS+=("-Dsonar.pullrequest.base=${PR_BASE}")
fi

if [ "$RUN_MODE" = "ci" ]; then
  BRANCH_NAME="${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null)}"
  [ -n "$BRANCH_NAME" ] && SONAR_ARGS+=("-Dsonar.branch.name=${BRANCH_NAME}")
fi

RAW_DIR="${QUALITY_GATES_RUN_DIR:-.quality-gates/reports/raw/${QUALITY_GATES_RUN_ID:-manual-$(date +%H%M%S)}}"
mkdir -p "$RAW_DIR"

# Record exact command for debug reference
printf 'sonar-scanner %s\n' "$(printf '%s ' "${SONAR_ARGS[@]}")" > "$RAW_DIR/sonar.cmd"

# Run sonar-scanner — save raw log to raw/
sonar-scanner "${SONAR_ARGS[@]}" 2>&1 | tee "$RAW_DIR/sonar-scanner.log" | grep -E "ANALYSIS|ERROR|WARN|Quality Gate" || true
SCANNER_EXIT=${PIPESTATUS[0]}

if [ "$SCANNER_EXIT" -ne 0 ]; then
  print_status "$GATE" "error" "sonar-scanner failed (exit $SCANNER_EXIT) → $RAW_DIR/sonar-scanner.log"
  exit 1
fi

# Extract project key: properties file > scanner log > config.yaml > SONAR_PROJECT_KEY env
PROJECT_KEY=""
if [ -n "$PROPS_FILE" ]; then
  PROJECT_KEY=$(grep -E "^sonar\.projectKey" "$PROPS_FILE" | sed 's/^[^=]*=[ \t]*//' | tr -d ' \t')
fi

if [ -z "$PROJECT_KEY" ]; then
  PROJECT_KEY=$(grep -oE 'Project key: [^ ]+' $RAW_DIR/sonar-scanner.log | head -1 | sed 's/Project key: //')
fi
if [ -z "$PROJECT_KEY" ]; then
  PROJECT_KEY=$(grep -oE "component key: '[^']+'" $RAW_DIR/sonar-scanner.log | head -1 | sed "s/component key: '//;s/'//")
fi

if [ -z "$PROJECT_KEY" ]; then
  PROJECT_KEY="${SONAR_PROJECT_KEY:-}"
fi

if [ -z "$PROJECT_KEY" ]; then
  print_status "$GATE" "warn" "sonar-scanner completed but could not determine project key for gate status poll"
  exit 2
fi

# Try to read quality gate status from scanner log first (sonar.qualitygate.wait=true)
# Log line format: "QUALITY GATE STATUS: PASSED" or "QUALITY GATE STATUS: FAILED"
GATE_STATUS=""
if [ -f "$RAW_DIR/sonar-scanner.log" ]; then
  LOG_STATUS=$(grep -oE "QUALITY GATE STATUS: [A-Z]+" $RAW_DIR/sonar-scanner.log | tail -1 | sed 's/QUALITY GATE STATUS: //')
  case "$LOG_STATUS" in
    PASSED) GATE_STATUS="OK" ;;
    FAILED) GATE_STATUS="ERROR" ;;
    WARN)   GATE_STATUS="WARN" ;;
  esac
fi

# Fallback: poll SonarQube API if log didn't contain gate status
if [ -z "$GATE_STATUS" ]; then
  MAX_WAIT=60
  WAITED=0
  SLEEP_INTERVAL=5
  GATE_STATUS="NONE"

  while [ "$WAITED" -lt "$MAX_WAIT" ]; do
    GATE_STATUS=$(curl -sf \
      -H "Authorization: Bearer ${SONAR_TOKEN}" \
      "${SONAR_HOST_URL}/api/qualitygates/project_status?projectKey=${PROJECT_KEY}" \
      2>/dev/null | (command -v jq &>/dev/null && jq -r '.projectStatus.status' || grep -oE '"status":"[^"]+"' | head -1 | sed 's/.*":"//' | tr -d '"'))

    if [ "$GATE_STATUS" = "OK" ] || [ "$GATE_STATUS" = "WARN" ] || [ "$GATE_STATUS" = "ERROR" ] || [ "$GATE_STATUS" = "NONE" ]; then
      break
    fi

    sleep "$SLEEP_INTERVAL"
    WAITED=$((WAITED + SLEEP_INTERVAL))
  done
fi

# Save raw data as JSON for report.sh to consume
# sonar-report.json: merged object with qualityGate + measures
SONAR_RAW_JSON="$RAW_DIR/sonar-report.json"
if command -v curl &>/dev/null && [ -n "$PROJECT_KEY" ]; then
  # Quality gate conditions
  QG_JSON=$(curl -sf \
    -H "Authorization: Bearer ${SONAR_TOKEN}" \
    "${SONAR_HOST_URL}/api/qualitygates/project_status?projectKey=${PROJECT_KEY}" \
    2>/dev/null || printf '{"projectStatus":{"status":"%s"}}' "$GATE_STATUS")

  # Component measures: all metrics visible on the dashboard
  MEASURES_JSON=$(curl -sf \
    -H "Authorization: Bearer ${SONAR_TOKEN}" \
    "${SONAR_HOST_URL}/api/measures/component?component=${PROJECT_KEY}&metricKeys=security_rating,reliability_rating,sqale_rating,vulnerabilities,bugs,code_smells,coverage,duplicated_lines_density,security_hotspots,accepted_issues,ncloc" \
    2>/dev/null || echo '{}')

  # Merge into single JSON using jq if available, else write gate JSON only
  if command -v jq &>/dev/null; then
    printf '%s' "$QG_JSON" | jq --argjson m "$MEASURES_JSON" '. + {measures: ($m.component.measures // [])}' \
      2>/dev/null > "$SONAR_RAW_JSON" || printf '%s' "$QG_JSON" > "$SONAR_RAW_JSON"
  else
    printf '%s' "$QG_JSON" > "$SONAR_RAW_JSON"
  fi

  # Fetch issues list (top 500, ordered by severity) — saved separately for report.sh
  curl -sf \
    -H "Authorization: Bearer ${SONAR_TOKEN}" \
    "${SONAR_HOST_URL}/api/issues/search?componentKeys=${PROJECT_KEY}&resolved=false&severities=BLOCKER,CRITICAL,MAJOR,MINOR,INFO&ps=500&s=SEVERITY&asc=false" \
    2>/dev/null > "$RAW_DIR/sonar-issues.json" || true
else
  printf '{"projectStatus":{"status":"%s"}}' "$GATE_STATUS" > "$SONAR_RAW_JSON"
fi

case "$GATE_STATUS" in
  OK)
    print_status "$GATE" "ok" "SonarQube quality gate: PASSED → $RAW_DIR/sonar-scanner.log"
    exit 0
    ;;
  WARN)
    print_status "$GATE" "warn" "SonarQube quality gate: WARN → $RAW_DIR/sonar-scanner.log"
    exit 2
    ;;
  ERROR|FAILED)
    print_status "$GATE" "error" "SonarQube quality gate: FAILED → $RAW_DIR/sonar-scanner.log"
    exit 1
    ;;
  *)
    print_status "$GATE" "warn" "SonarQube quality gate status unknown: ${GATE_STATUS} → $RAW_DIR/sonar-scanner.log"
    exit 2
    ;;
esac
