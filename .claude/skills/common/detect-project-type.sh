#!/bin/sh
# detect-project-type.sh — Detect project type from codebase files
# Returns one of: web-frontend, api-backend, fullstack-web, mobile, desktop, unknown
# Usage: detect-project-type.sh [--dir /path/to/project]

set -e

# Parse arguments
PROJECT_DIR="."
while [ $# -gt 0 ]; do
  case "$1" in
    --dir) PROJECT_DIR="$2"; shift 2 ;;
    *) PROJECT_DIR="$1"; shift ;;
  esac
done

# Helper: check if package.json has a dependency (dependencies or devDependencies)
has_dep() {
  dep="$1"
  if [ -f "$PROJECT_DIR/package.json" ]; then
    # Match "dep": in dependencies or devDependencies sections
    grep -q "\"${dep}\":" "$PROJECT_DIR/package.json" 2>/dev/null && return 0
  fi
  return 1
}

# 1. Check package.json dependencies
if [ -f "$PROJECT_DIR/package.json" ]; then
  # Fullstack frameworks (check first — these include both frontend and backend)
  if has_dep "next" || has_dep "nuxt" || has_dep "remix" || has_dep "@sveltejs/kit"; then
    echo "fullstack-web"
    exit 0
  fi

  # Mobile frameworks
  if has_dep "react-native" || has_dep "expo"; then
    echo "mobile"
    exit 0
  fi

  # Desktop frameworks
  if has_dep "electron" || has_dep "tauri"; then
    echo "desktop"
    exit 0
  fi

  # Backend frameworks (check before frontend — some projects have both)
  if has_dep "express" || has_dep "@nestjs/core" || has_dep "fastify" || has_dep "koa" || has_dep "hono"; then
    # If also has frontend framework, it's fullstack
    if has_dep "react" || has_dep "vue" || has_dep "@angular/core" || has_dep "svelte"; then
      echo "fullstack-web"
      exit 0
    fi
    echo "api-backend"
    exit 0
  fi

  # Frontend frameworks
  if has_dep "react" || has_dep "vue" || has_dep "@angular/core" || has_dep "svelte"; then
    echo "web-frontend"
    exit 0
  fi
fi

# 2. Flutter
if [ -f "$PROJECT_DIR/pubspec.yaml" ]; then
  echo "mobile"
  exit 0
fi

# 3. Go / Rust
if [ -f "$PROJECT_DIR/go.mod" ] || [ -f "$PROJECT_DIR/Cargo.toml" ]; then
  echo "api-backend"
  exit 0
fi

# 4. Java / Kotlin (Maven / Gradle)
if [ -f "$PROJECT_DIR/pom.xml" ] || [ -f "$PROJECT_DIR/build.gradle" ] || [ -f "$PROJECT_DIR/build.gradle.kts" ]; then
  # Check for Android
  if [ -f "$PROJECT_DIR/app/src/main/AndroidManifest.xml" ]; then
    echo "mobile"
    exit 0
  fi
  echo "api-backend"
  exit 0
fi

# 5. iOS native
for f in "$PROJECT_DIR"/*.xcodeproj "$PROJECT_DIR"/*.xcworkspace; do
  if [ -e "$f" ]; then
    echo "mobile"
    exit 0
  fi
done

# 6. Android native (standalone)
if [ -f "$PROJECT_DIR/AndroidManifest.xml" ] || [ -f "$PROJECT_DIR/app/src/main/AndroidManifest.xml" ]; then
  echo "mobile"
  exit 0
fi

# 7. Python web frameworks
if [ -f "$PROJECT_DIR/requirements.txt" ] || [ -f "$PROJECT_DIR/pyproject.toml" ] || [ -f "$PROJECT_DIR/setup.py" ]; then
  if grep -q -E "(django|flask|fastapi|starlette|sanic)" "$PROJECT_DIR/requirements.txt" 2>/dev/null || \
     grep -q -E "(django|flask|fastapi|starlette|sanic)" "$PROJECT_DIR/pyproject.toml" 2>/dev/null; then
    echo "api-backend"
    exit 0
  fi
fi

# 8. Fallback
echo "unknown"
