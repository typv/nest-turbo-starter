#!/usr/bin/env bash
# setup-sonar.sh — Inject sonar-project.properties from template with auto-detected values.
# Requires: SONAR_HOST_URL, SONAR_TOKEN env vars.
# Safe-by-default: skips if sonar-project.properties already exists unless --force.

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SKILL_DIR/checks/lib-gate-utils.sh"

FORCE=false
for arg in "$@"; do [ "$arg" = "--force" ] && FORCE=true; done

TARGET="sonar-project.properties"
TEMPLATE="$SKILL_DIR/templates/sonar-project.properties"

if [ -z "${SONAR_HOST_URL:-}" ]; then
  print_status "sonar" "skip" "SONAR_HOST_URL not set — skipping sonar setup"
  exit 0
fi

if [ -z "${SONAR_TOKEN:-}" ]; then
  print_status "sonar" "warn" "SONAR_TOKEN not set — sonar-scanner will fail at runtime"
fi

if [ -f "$TARGET" ] && [ "$FORCE" != "true" ]; then
  print_status "sonar" "skip" "$TARGET already exists (use --force to override)"
  exit 0
fi

# Auto-detect project key from git remote
detect_project_key() {
  git remote get-url origin 2>/dev/null \
    | sed 's/.*[:/]\([^/]*\)\/\([^.]*\).*/\1_\2/' \
    | tr '[:upper:]' '[:lower:]' \
    | tr -cd '[:alnum:]_-'
}

PROJECT_KEY="${SONAR_PROJECT_KEY:-$(detect_project_key)}"
if [ -z "$PROJECT_KEY" ]; then
  PROJECT_KEY="my-project"
  print_status "sonar" "warn" "could not detect project key — using '$PROJECT_KEY' (edit $TARGET to change)"
fi

# Use repo root as sources — exclusions handle what to skip (works for monorepos)
SOURCES="."

# Build sonar.exclusions by merging template defaults with scope.exclude from config.yaml
build_sonar_exclusions() {
  local defaults="**/node_modules/**,**/dist/**,**/__pycache__/**,**/migrations/**,**/*.test.*,**/*_test.*,**/*_spec.*,.claude/**,skills/**"
  local from_config
  # read_config_array returns newline-separated values; convert to comma-separated
  from_config="$(read_config_array "scope.exclude" 2>/dev/null | tr '\n' ',' | sed 's/,$//')"
  if [ -n "$from_config" ]; then
    echo "${defaults},${from_config}"
  else
    echo "$defaults"
  fi
}

SONAR_EXCLUSIONS="$(build_sonar_exclusions)"

if [ -f "$TEMPLATE" ]; then
  sed \
    -e "s/__PROJECT_KEY__/${PROJECT_KEY}/g" \
    -e "s/__PROJECT_NAME__/${PROJECT_KEY}/g" \
    -e "s|__SOURCES__|${SOURCES}|g" \
    -e "s|__SONAR_EXCLUSIONS__|${SONAR_EXCLUSIONS}|g" \
    "$TEMPLATE" > "$TARGET"
else
  # Inline fallback if template missing
  cat > "$TARGET" << EOF
sonar.projectKey=${PROJECT_KEY}
sonar.projectName=${PROJECT_KEY}
sonar.sources=${SOURCES}
sonar.host.url=${SONAR_HOST_URL}
# sonar.token is read from SONAR_TOKEN env var at runtime
sonar.exclusions=**/node_modules/**,**/dist/**,**/__pycache__/**,**/vendor/**,**/*.test.*
sonar.coverage.exclusions=**/*.test.*,**/*_test.*,**/*_spec.*
EOF
fi

print_status "sonar" "ok" "created $TARGET (projectKey=${PROJECT_KEY}, sources=${SOURCES})"
echo ""
echo "Review $TARGET and adjust sonar.sources / sonar.exclusions as needed."
echo "Run: SONAR_TOKEN=\$SONAR_TOKEN sonar-scanner"
