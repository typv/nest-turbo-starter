#!/usr/bin/env bash
# lib-scope-resolver.sh — Resolve scan scope (excludes) for quality gate tools.
# Sourced by all check scripts.
#
# Scope strategy: always scan from root (.) and control what is excluded.
#
# Exclude sources (merged, deduped):
#   1. .quality-gates/config.yaml  scope.exclude
#   2. .gitignore patterns (dir-level entries only)
#   3. Stack-default excludes (node_modules, dist, etc.)
#   4. Hardcoded safety fallbacks (always excluded)

readonly QG_CONFIG=".quality-gates/config.yaml"

# resolve_scan_includes — always returns "." (scan from root)
resolve_scan_includes() {
  echo "."
}

# resolve_scan_excludes — return merged exclude patterns (one per line, deduped)
resolve_scan_excludes() {
  local excludes=()

  # 1. From config.yaml scope.exclude
  if [ -f "$QG_CONFIG" ]; then
    while IFS= read -r pat; do
      [ -n "$pat" ] && excludes+=("$pat")
    done < <(read_config_array "scope.exclude")
  fi

  # 2. From .gitignore — extract dir-level entries only (skip comments, negations, file patterns)
  if [ -f ".gitignore" ]; then
    while IFS= read -r line; do
      # Skip blank lines, comments, and negation patterns
      [[ -z "$line" || "$line" =~ ^# || "$line" =~ ^! ]] && continue
      # Strip leading slash (absolute gitignore paths like /coverage, /.next/)
      local stripped="${line#/}"
      # Keep entries that look like directories (trailing slash) or bare names without dots
      if [[ "$stripped" =~ /$ ]] || [[ "$stripped" =~ ^[a-zA-Z_][a-zA-Z0-9_-]*$ ]]; then
        # Strip trailing slash and wrap in glob
        dir="${stripped%/}"
        excludes+=("**/${dir}/**")
      fi
    done < ".gitignore"
  fi

  # 3. File-marker-based excludes (replaces DETECTED_STACKS dependency)
  if [ -d "node_modules" ] || [ -f "package.json" ]; then
    excludes+=("**/node_modules/**" "**/dist/**" "**/.next/**" "**/build/**" "**/.turbo/**")
  fi
  if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "Pipfile" ]; then
    excludes+=("**/__pycache__/**" "**/.venv/**" "**/venv/**" "**/*.egg-info/**" "**/.tox/**")
  fi
  if [ -f "go.mod" ]; then
    excludes+=("**/vendor/**")
  fi
  if [ -f "pom.xml" ] || [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
    excludes+=("**/target/**" "**/.gradle/**")
  fi
  if [ -f "Gemfile" ]; then
    excludes+=("**/vendor/bundle/**")
  fi
  if ls ./*.csproj 2>/dev/null | grep -q . || ls ./*.sln 2>/dev/null | grep -q .; then
    excludes+=("**/bin/**" "**/obj/**")
  fi

  # 4. Always-exclude safety fallbacks
  excludes+=(
    "**/*.test.*"
    "**/*_test.*"
    "**/*_spec.*"
    "**/migrations/**"
    "**/.git/**"
    "**/*.min.js"
  )

  printf '%s\n' "${excludes[@]}" | sort -u
}

# format_excludes_for_tool — emit exclude flags in the correct format for each tool.
# Usage: format_excludes_for_tool semgrep|trivy|tokei|gitleaks
# Prints a single line of flags (or empty for tools that don't support dir excludes).
format_excludes_for_tool() {
  local tool="$1"
  local excludes=()
  # Read into array without mapfile (bash 3.2 compatible)
  while IFS= read -r line; do
    excludes+=("$line")
  done < <(resolve_scan_excludes)

  case "$tool" in
    semgrep)
      # --exclude pattern  (one flag per pattern)
      for pat in "${excludes[@]}"; do
        printf -- '--exclude %s ' "$pat"
      done
      ;;
    trivy)
      # --skip-dirs dir1,dir2  (dirs only, strip glob wrappers; skip file-glob patterns)
      local dirs=()
      for pat in "${excludes[@]}"; do
        local dir
        dir="${pat//\*\*\//}"       # strip leading **/
        dir="${dir%%/**}"            # strip trailing /**
        # Skip file-glob patterns (contain a dot — these are filename matchers, not dirs)
        [[ "$dir" == *"."* ]] && continue
        [ -n "$dir" ] && dirs+=("$dir")
      done
      # Deduplicate and join with comma
      printf '%s\n' "${dirs[@]}" | sort -u | paste -sd',' -
      ;;
    tokei)
      # --exclude pattern  (one flag per pattern)
      for pat in "${excludes[@]}"; do
        printf -- '--exclude %s ' "$pat"
      done
      ;;
    gitleaks)
      # gitleaks uses .gitleaks.toml allowlists — no CLI dir-exclude flag
      echo ""
      ;;
    *)
      echo ""
      ;;
  esac
}
