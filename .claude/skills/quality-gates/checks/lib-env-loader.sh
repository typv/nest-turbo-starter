#!/usr/bin/env bash
# lib-env-loader.sh — Safe .env file parser for quality-gates.
# Parses .env at project root (CWD); exports only allowed key prefixes.
# Security: never uses `source .env` — manual grep/sed parsing only.
# Precedence: existing shell env vars take priority (no clobber).
#
# Allowed key prefixes: QUALITY_GATES_*, SONAR_*, BASE_SHA

# load_dotenv — parse .env file and export allowed keys into the current shell.
# Usage: load_dotenv [path-to-.env]   (default: .env in CWD)
load_dotenv() {
  local env_file="${1:-.env}"
  [ -f "$env_file" ] || return 0

  while IFS= read -r line || [ -n "$line" ]; do
    # Skip comments and blank lines
    case "$line" in
      '#'*|'') continue ;;
    esac

    # Must contain '=' to be a valid assignment
    case "$line" in
      *'='*) ;;
      *) continue ;;
    esac

    # Extract KEY (everything before first '=') and VALUE (everything after)
    local key value
    key="${line%%=*}"
    value="${line#*=}"

    # Strip surrounding quotes from value (single or double)
    case "$value" in
      '"'*'"') value="${value#\"}" ; value="${value%\"}" ;;
      "'"*"'") value="${value#\'}" ; value="${value%\'}" ;;
    esac

    # Validate key: letters, digits, underscores only — no spaces or special chars
    case "$key" in
      *[!A-Za-z0-9_]*) continue ;;
    esac

    # Only export keys with allowed prefixes
    case "$key" in
      QUALITY_GATES_*|SONAR_*|BASE_SHA) ;;
      *) continue ;;
    esac

    # Never clobber an existing env var — .env is lower precedence than shell env
    eval "local existing=\${${key}+set}"
    if [ "$existing" != "set" ]; then
      export "${key}=${value}"
    fi
  done < "$env_file"
}

# Auto-load .env from CWD when this lib is sourced
load_dotenv
