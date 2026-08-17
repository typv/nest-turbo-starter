#!/usr/bin/env bash
# install.sh — Check which quality-gate tools are installed and print hints for missing ones.
# Informational only — always exits 0.

GATE_UTILS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/checks/lib-gate-utils.sh"
source "$GATE_UTILS"

echo "🔍 Quality Gates — Tool Check"
echo ""

# Helper: check tool and print version or install hint
check_tool() {
  local name="$1"
  local hint="$2"
  local required="$3"   # "required" | "optional" | "conditional"
  local note="$4"        # extra note for conditional tools

  if command -v "$name" &>/dev/null; then
    local version
    version=$("$name" --version 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+[^ ]*' | head -1 || echo "installed")
    printf '[%-14s] ✅ installed (%s)\n' "$name" "$version"
  else
    case "$required" in
      required)    printf '[%-14s] ❌ not found → %s\n' "$name" "$hint" ;;
      optional)    printf '[%-14s] ⚠️  not found → %s (fallback available)\n' "$name" "$hint" ;;
      conditional) printf '[%-14s] ℹ️  not found → %s %s\n' "$name" "$hint" "$note" ;;
    esac
  fi
}

check_tool "gitleaks"      "$(_os_install_hint gitleaks)"      "required"    ""
check_tool "semgrep"       "$(_os_install_hint semgrep)"       "required"    ""
check_tool "trivy"         "$(_os_install_hint trivy)"         "optional"    ""
check_tool "tokei"         "$(_os_install_hint tokei)"         "optional"    ""
check_tool "sonar-scanner" "$(_os_install_hint sonar-scanner)" "conditional" "(required only if SONAR_HOST_URL set)"
check_tool "nuclei"        "$(_os_install_hint nuclei)"        "conditional" "(required only for DAST in CI)"
check_tool "yq"            "$(_os_install_hint yq)"            "optional"    "(auto-installed on first run if missing)"
check_tool "jq"            "$(_os_install_hint jq)"            "optional"    ""

echo ""
echo "Required for core gates : gitleaks, semgrep"
echo "Optional (with fallback): trivy, tokei, jq"
echo "Auto-installed on use   : yq (YAML parser — improves config parsing reliability)"
echo "Conditional             : sonar-scanner (if SONAR_HOST_URL set), nuclei (DAST in CI)"

exit 0
