#!/usr/bin/env bash
# Build Tailwind CSS for a mockup flow directory.
# Usage: build-mockup-css.sh <flow-dir> [--watch]
set -euo pipefail

FLOW_DIR="${1:-}"
WATCH=false

# Parse args
for arg in "$@"; do
  case "$arg" in
    --watch) WATCH=true ;;
  esac
done

if [ -z "$FLOW_DIR" ]; then
  echo "Usage: build-mockup-css.sh <flow-dir> [--watch]" >&2
  echo "  flow-dir: path to mockup flow directory (e.g., docs/design-mockups/auth-flow/)" >&2
  exit 1
fi

# Normalize trailing slash
FLOW_DIR="${FLOW_DIR%/}"

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "Error: Node.js not found. Install from https://nodejs.org/" >&2
  exit 1
fi

# Check npx
if ! command -v npx &>/dev/null; then
  echo "Error: npx not found. Install Node.js 8.2+ from https://nodejs.org/" >&2
  exit 1
fi

# Validate required files
INPUT_CSS="$FLOW_DIR/input.css"
OUTPUT_CSS="$FLOW_DIR/output.css"
TW_CONFIG="$FLOW_DIR/tailwind.config.js"

if [ ! -f "$INPUT_CSS" ]; then
  echo "Error: $INPUT_CSS not found. Run scaffold-mockup-flow.js first." >&2
  exit 1
fi

if [ ! -f "$TW_CONFIG" ]; then
  echo "Error: $TW_CONFIG not found. Run tokens-to-tailwind-config.js first." >&2
  exit 1
fi

# Use tailwindcss@3 explicitly — v4 changed CLI interface and config format
TW_PKG="tailwindcss@3"

# Build command
CMD=(npx "$TW_PKG" -i "$INPUT_CSS" -o "$OUTPUT_CSS" -c "$TW_CONFIG")

if [ "$WATCH" = true ]; then
  echo "Building CSS (watch mode)..." >&2
  CMD+=(--watch)
else
  echo "Building CSS..." >&2
  CMD+=(--minify)
fi

"${CMD[@]}"

if [ "$WATCH" = false ]; then
  echo "Built $OUTPUT_CSS" >&2
fi
