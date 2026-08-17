#!/usr/bin/env bash
# lib-lockfile-detector.sh — Detect lockfiles and coverage reports from project markers.
# Sourced by check-deps.sh and check-coverage.sh.
# Provides lockfile detection without stack detection dependency.

# get_trivy_targets — find lockfiles on disk directly (no stack detection needed)
get_trivy_targets() {
  local targets=()

  # Node
  [ -f package-lock.json ] && targets+=("package-lock.json")
  [ -f yarn.lock ]         && targets+=("yarn.lock")
  [ -f pnpm-lock.yaml ]    && targets+=("pnpm-lock.yaml")
  # Python
  [ -f requirements.txt ]  && targets+=("requirements.txt")
  [ -f Pipfile.lock ]      && targets+=("Pipfile.lock")
  [ -f poetry.lock ]       && targets+=("poetry.lock")
  # Go
  [ -f go.sum ]            && targets+=("go.sum")
  # JVM
  { [ -f pom.xml ] || [ -f build.gradle ] || [ -f build.gradle.kts ]; } && targets+=(".")
  # Ruby
  [ -f Gemfile.lock ]      && targets+=("Gemfile.lock")
  # PHP
  [ -f composer.lock ]     && targets+=("composer.lock")
  # Rust
  [ -f Cargo.lock ]        && targets+=("Cargo.lock")
  # Docker/IaC
  { [ -f Dockerfile ] || [ -f docker-compose.yml ] || [ -f docker-compose.yaml ]; } && targets+=(".")

  [ ${#targets[@]} -eq 0 ] && targets+=(".")
  printf '%s\n' "${targets[@]}" | sort -u
}

# get_coverage_report_path — find first matching coverage report
get_coverage_report_path() {
  # Node
  [ -f coverage/lcov.info ]             && echo "coverage/lcov.info"             && return
  [ -f coverage/coverage-summary.json ] && echo "coverage/coverage-summary.json" && return
  # Python
  [ -f coverage.xml ]                   && echo "coverage.xml"                   && return
  [ -f .coverage ]                      && echo ".coverage"                      && return
  # Go
  [ -f coverage.out ]                   && echo "coverage.out"                   && return
  # JVM
  local jacoco; jacoco=$(find . -name "jacoco.xml" -not -path "*/node_modules/*" 2>/dev/null | head -1)
  [ -n "$jacoco" ] && echo "$jacoco" && return
  # Ruby
  [ -f coverage/.resultset.json ]       && echo "coverage/.resultset.json"       && return
  # .NET
  local cobertura; cobertura=$(find . -name "coverage.cobertura.xml" 2>/dev/null | head -1)
  [ -n "$cobertura" ] && echo "$cobertura" && return
  echo ""
}
