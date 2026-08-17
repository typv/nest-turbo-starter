#!/usr/bin/env bash
# check-file-size.sh — Gate: file size audit (warn-only, never hard blocks).
# Exit codes: 0=all within limit, 2=files exceed threshold, 4=no source files found

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib-gate-utils.sh"
source "$SCRIPT_DIR/lib-scope-resolver.sh"

GATE="file-size"

# Read threshold from config (default: 200 LOC)
THRESHOLD="$(read_config_value "thresholds.file_max_loc")"
THRESHOLD="${THRESHOLD:-200}"

# Collect include dirs
INCLUDES=()
while IFS= read -r dir; do
  [ -n "$dir" ] && INCLUDES+=("$dir")
done < <(resolve_scan_includes)
[ ${#INCLUDES[@]} -eq 0 ] && INCLUDES+=(".")

RAW_DIR="${QUALITY_GATES_RUN_DIR:-.quality-gates/reports/raw/${QUALITY_GATES_RUN_ID:-manual-$(date +%H%M%S)}}"
mkdir -p "$RAW_DIR"
OUTFILE="$RAW_DIR/file-size-report.txt"
: > "$OUTFILE"

RUN_MODE="$(resolve_run_mode)"
BASE="$(resolve_base_sha)"

SRC_EXT='\.(js|ts|jsx|tsx|py|go|java|kt|rb|php|rs|cs|sh|swift)$'

_find_all_source_files() {
  # Build exclude flags from shared resolver (avoids hardcoded drift)
  local exclude_args=()
  while IFS= read -r pat; do
    [ -n "$pat" ] && exclude_args+=("!" "-path" "*/${pat#\*\*/}*")
  done < <(resolve_scan_excludes)

  # Record debug command (first dir only for brevity)
  local first_dir="${INCLUDES[0]:-.}"
  printf 'find %s -type f \\( -name "*.js" -o -name "*.ts" ... \\) %s\n' \
    "$first_dir" "$(printf '%s ' "${exclude_args[@]}")" > "$RAW_DIR/file-size.cmd"

  for dir in "${INCLUDES[@]}"; do
    find "$dir" -type f \( \
      -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \
      -o -name "*.py" -o -name "*.go" -o -name "*.java" -o -name "*.kt" \
      -o -name "*.rb" -o -name "*.php" -o -name "*.rs" -o -name "*.cs" \
      -o -name "*.sh" -o -name "*.swift" \
    \) "${exclude_args[@]}" 2>/dev/null
  done
}

get_files_to_check() {
  case "$RUN_MODE" in
    pre-commit)
      git diff --cached --name-only --diff-filter=ACMR 2>/dev/null | grep -E "$SRC_EXT"
      ;;
    pre-push|pr|diff)
      if [ -n "$BASE" ]; then
        git diff --name-only "$BASE" HEAD 2>/dev/null | grep -E "$SRC_EXT"
      else
        _find_all_source_files
      fi
      ;;
    full|ci|*)
      _find_all_source_files
      ;;
  esac
}

OVERSIZED=()

if command -v tokei &>/dev/null && { [ "$RUN_MODE" = "full" ] || [ "$RUN_MODE" = "ci" ]; }; then
  # Use tokei for accurate LOC on full scans
  for dir in "${INCLUDES[@]}"; do
    while IFS= read -r line; do
      FILE=$(echo "$line" | jq -r '.name' 2>/dev/null)
      LOC=$(echo "$line" | jq -r '.code' 2>/dev/null)
      if [ -n "$FILE" ] && [ -n "$LOC" ] && [ "$LOC" -gt "$THRESHOLD" ] 2>/dev/null; then
        OVERSIZED+=("${LOC} ${FILE}")
        echo "${LOC} LOC: ${FILE}" >> "$OUTFILE"
      fi
    done < <(tokei "$dir" --files --output json 2>/dev/null | jq -c '.[] | .reports[]?' 2>/dev/null)
  done
else
  # wc -l for diff-mode files or tokei fallback
  while IFS= read -r file; do
    [ -f "$file" ] || continue
    LOC=$(wc -l < "$file" 2>/dev/null | tr -d ' ')
    if [ -n "$LOC" ] && [ "$LOC" -gt "$THRESHOLD" ] 2>/dev/null; then
      OVERSIZED+=("${LOC} ${file}")
      echo "${LOC} LOC: ${file}" >> "$OUTFILE"
    fi
  done < <(get_files_to_check)
fi

COUNT=${#OVERSIZED[@]}

if [ "$COUNT" -eq 0 ]; then
  print_status "$GATE" "ok" "all files within ${THRESHOLD} LOC limit"
  exit 0
else
  print_status "$GATE" "warn" "${COUNT} file(s) exceed ${THRESHOLD} LOC → $OUTFILE"
  exit 2
fi
