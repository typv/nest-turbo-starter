---
name: quality-gates
description: "Run security and quality gates (secrets, SAST, deps, DAST, coverage, file-size) for any project. CI/CD-ready. Use before code review or push."
argument-hint: "[setup|run|report] [--dry-run] [--check <gate>] [--no-block] [--json] [--mode <mode>]"
---

# Quality Gates

Language-agnostic security and quality scanning. Wraps gitleaks, trivy, semgrep, nuclei, SonarQube, and file-size checks.

## Default (No Arguments)

If invoked without arguments, use `AskUserQuestion`:

| Option | Description |
|--------|-------------|
| `setup` | Claude wizard — reads docs, generates config, guides install |
| `run` | Run all applicable gates |
| `report` | Generate markdown report from last run |

Present via `AskUserQuestion` with header "Quality Gates", question "What would you like to do?".

## Commands

| Command | Script | Description |
|---------|--------|-------------|
| `/quality-gates setup` | wizard (Claude) | Full setup wizard — Load `references/setup-wizard.md` |
| `/quality-gates run` | `run-all.sh` | Run all gates (blocked if setup incomplete) |
| `/quality-gates run --check <gate>` | `run-all.sh` | Run one gate only |
| `/quality-gates run --no-block` | `run-all.sh` | Print findings, always exit 0 |
| `/quality-gates run --json` | `run-all.sh` | Machine-readable JSON summary |
| `/quality-gates run --mode <mode>` | `run-all.sh` | Force run mode (pre-commit/pre-push/pr/ci/diff/full) |
| `/quality-gates report` | `report.sh` | Generate markdown report from gate outputs |

**Setup guard:** `run` is blocked if `.quality-gates/config.yaml` is missing or required tools not installed. Use `--no-block` to override.

## Setup Wizard

When `/quality-gates setup` is invoked:

**Load `references/setup-wizard.md` and follow ALL steps in order.**

Steps overview:
1. **Read project context** — check `docs/` first, ask user if missing [BLOCKING]
2. **Ask optional gates** — SonarQube, DAST (tags + blocking threshold), hooks [BLOCKING]
3. **Confirm with user** — show full config summary [BLOCKING]
4. **Generate config** — run `generate-config.sh`
5. **Setup validation** — run `setup-all.sh --json`
6. **Install guidance** — per missing tool
7. **Summary** — print final status

## Gate Reference

| Gate | Tool | Block condition | Scope |
|------|------|----------------|-------|
| `secrets` | gitleaks | exit 1 always | staged / diff / full history |
| `deps` | trivy | exit 1 on CRITICAL, exit 2 on HIGH | lockfiles only |
| `sast` | semgrep | exit 1 on ERROR, exit 2 on WARNING | diff-aware (BASE_SHA) |
| `dast` | nuclei | exit 1 at `block_severity` threshold, exit 2 below | endpoints.txt (CI-only by default) |
| `coverage` | bash/jq | exit 1 if below threshold | coverage report files |
| `file-size` | tokei/wc | exit 2 only (warn, never block) | all dirs (scope.exclude applied) |
| `sonar` | sonar-scanner | exit 1 if gate FAILED | full project (PR decoration: Developer Edition+) |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Pass |
| 1 | Hard block (error) |
| 2 | Warn only (non-blocking) |
| 3 | Tool not installed |
| 4 | Skipped (condition not met) |

## Run Modes

Auto-detected. Override with `QUALITY_GATES_MODE=<mode>` or `--mode <mode>`.

| Mode | Auto-detected when | Scan scope |
|------|-------------------|------------|
| `pre-commit` | `QUALITY_GATES_SCOPE=pre-commit` | staged files only |
| `pre-push` | `QUALITY_GATES_SCOPE=pre-push` | upstream tracking branch |
| `pr` | CI + PR env vars (GITHUB_BASE_REF etc.) | merge-base with PR target |
| `ci` | `CI` env set, no PR | full scan |
| `diff` | local default | merge-base with origin/main |
| `full` | `QUALITY_GATES_MODE=full` | full scan |

Override baseline: `BASE_SHA=<sha> /quality-gates run`

## Output Format

```
🔍 Running Quality Gates...

[secrets]    ✅ gitleaks: no secrets found
[deps]       ⚠️  trivy: not installed → brew install trivy
[sast]       ❌ semgrep: 2 ERROR findings → .quality-gates/reports/raw/20260329-181500/sast-report.json
[file-size]  ⚠️  3 files exceed 200 LOC
[coverage]   ✅ 78% (threshold: 70%)
[sonar]      ℹ️  Skipped (SONAR_HOST_URL not set)
[dast]       ℹ️  Skipped (CI only)

────────────────────────────────
Summary: 1 error, 2 warnings, 2 skipped
```

## Configuration

Config: `.quality-gates/config.yaml` (created by setup wizard).
Template: `.claude/skills/quality-gates/templates/quality-gates-config.yaml`.

Key fields: `scope.exclude`, `thresholds.coverage`, `thresholds.file_max_loc`, `dast.tags`, `dast.block_severity`, `gates.<name>.enabled`.

## Integration

- **Pre-commit:** secrets check only (fast, hard block)
- **Pre-push:** secrets + sast + deps (via `QUALITY_GATES_SCOPE=pre-push`)
- **CI pipeline:** Full run including DAST + SonarQube
- **`/code-review`:** Run gates first, feed `latest-report.md` into review context
- **`/cook`:** Run gates before code review gate

## References

| File | Purpose |
|------|---------|
| `references/setup-wizard.md` | Full 9-step wizard execution (load when running setup) |
| `references/archetype-table.md` | Archetype presets + customization signals + SonarQube profiles |
| `references/nuclei-templates-catalog.md` | Signal → nuclei tags/profiles |
| `references/sonar-properties-reference.md` | Per-stack sonar-project.properties |
| `references/gitleaks-rules-reference.md` | Custom gitleaks rules + allowlists |
