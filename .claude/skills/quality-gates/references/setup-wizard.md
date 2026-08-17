# Setup Wizard — Step-by-Step Execution

> **EXECUTION CONTRACT:**
> 1. Steps execute in strict order. Do NOT skip or reorder.
> 2. Steps marked **[BLOCKING]** require a tool call or user response before advancing.
> 3. Never infer answers to [BLOCKING] steps — always call the tool or ask the user.

---

## Step 1: Read project context [BLOCKING]

**Action:** Check if `docs/codebase-summary.md` exists (use Glob or Read tool).

**Branch A — file exists:**
- Read `docs/codebase-summary.md`, `docs/code-standards.md`, `docs/system-architecture.md` in parallel
- Proceed to Step 2

**Branch B — file does NOT exist:**
- **[BLOCKING] Call `AskUserQuestion` NOW. Do NOT read any project files. Do NOT proceed to Step 2.**
  ```
  Header: "Project Docs"
  Question: "No docs/ found. How should I gather project context?"
  Options:
    - "Run /docs init first (Recommended)" — richer context, better config
    - "Scan files directly" — faster, less accurate for complex projects
  ```
- **If "Run /docs init first":** invoke `/docs init` skill, wait for completion, read `docs/*.md` → Step 2
- **If "Scan files directly":** read manifest files directly:
  - Check: `package.json`, `pyproject.toml`, `requirements.txt`, `go.mod`, `pom.xml`, `build.gradle`, `Gemfile`, `composer.json`, `Cargo.toml`, `Dockerfile`, `*.tf`
  - Also check: `tsconfig.json`, `.env`, `migrations/`, `generated/`
  - Proceed to Step 2

After reading project context, **infer extra exclude patterns** based on detected stack/tooling:

| Detected | Add to `--exclude` |
|----------|--------------------|
| Next.js / Vite / Webpack | `.next/`, `out/`, `build/`, `.turbo/` |
| Storybook | `.storybook/`, `storybook-static/` |
| Generated code (prisma, graphql-codegen, openapi) | `**/generated/**`, `**/*.generated.*` |
| Go | `vendor/` |
| Python (venv, poetry) | `.venv/`, `__pycache__/`, `*.pyc` |
| Java / Gradle / Maven | `target/`, `.gradle/`, `build/` |
| Terraform / Pulumi | `.terraform/`, `*.tfstate*` |
| iOS / macOS | `Pods/`, `DerivedData/`, `*.xcworkspace/` |
| Android | `.gradle/`, `build/`, `*.apk` |
| Monorepo (Turborepo, Nx) | `**/dist/**`, `**/.next/**`, `**/.turbo/**` |
| Docker | `.docker/` |

Collect inferred patterns as `EXTRA_EXCLUDES` — pass as `--exclude=<csv>` to generate-config.sh in Step 4. Show to user in Step 3 for confirmation.

---

## Step 2: Ask about optional gates [BLOCKING]

**Never silently skip SonarQube, DAST, or hooks.** Use `AskUserQuestion` with 3 questions in one call:

**Q1 — SonarQube:**
- Header: "SonarQube" | "Would you like to enable SonarQube quality gate?"
- "Yes, I have a server" → ask for `SONAR_HOST_URL` + `SONAR_TOKEN`; pass `--sonar-host-url=<url>` to generate-config.sh (Step 4 will also run setup-sonar.sh after config is written)
- "No, skip for now" → disable gate in config

**Q2 — DAST (nuclei):**
- Header: "DAST scanning" | "Would you like to enable DAST (dynamic security testing with nuclei)?"
- "Yes, enable for CI" → pass nothing extra to generate-config.sh
- "Yes, enable locally too" → pass `--dast-allow-local` to generate-config.sh
- "No, skip" → disable gate in config

If DAST enabled, ask for target URL immediately after (separate `AskUserQuestion` call):
- Header: "DAST target URL" | "Enter your staging/target URL(s) to scan (one per line):"
- Free-text input — write each non-empty line to `.quality-gates/endpoints.txt` (create file, skip comment lines)
- Inform user: "You can add more URLs later by editing `.quality-gates/endpoints.txt`"

Then add 2 follow-up questions to the same DAST call:

- **DAST Tags** — Header: "DAST scan scope"
  - Read `references/nuclei-templates-catalog.md` → use the Docs-Signal → Nuclei Config Mapping table to pre-select tags based on detected stack signals from Step 1
  - Present pre-selected tags as the "Recommended" option (e.g. "Recommended for your stack: sqli,xss,ssrf,rce,lfi,auth-bypass,exposure,misconfig,cve,jwt,api")
  - "Recommended for your stack: <pre-selected tags>"
  - "Broad: owasp,sqli,xss,ssrf,rce,lfi,auth-bypass,exposure,misconfig,cve"
  - "Minimal: owasp,sqli,xss"
  - "Custom" → ask for comma-separated tags

- **DAST Blocking threshold** — Header: "DAST blocking threshold"
  - "Critical only" → `dast.block_severity: critical`
  - "Critical + High (Recommended)" → `dast.block_severity: high`
  - "Critical + High + Medium" → `dast.block_severity: medium`

**Q3 — Git hooks:**
- Header: "Git hooks" | "Install quality gates as git hooks?"
- "Yes, install hooks (Recommended)" → pass `--setup-hooks` to setup-all.sh
- "No, skip hooks" → do not pass `--setup-hooks`

**SonarQube profile assignment (if enabled):**
1. Query available profiles per detected language:
```bash
curl -s "$SONAR_HOST_URL/api/qualityprofiles/search?language=<lang>" \
     -H "Authorization: Bearer $SONAR_TOKEN"
```
2. Select profile name: prefer `"Sonar way Recommended"` if available, else `"Sonar way"`
3. Assign selected profile to project via API:
```bash
curl -s -X POST "$SONAR_HOST_URL/api/qualityprofiles/add_project" \
     -H "Authorization: Bearer $SONAR_TOKEN" \
     -d "qualityProfile=<selected-profile-name>&project=<SONAR_PROJECT_KEY>&language=<lang>"
```
4. If assignment fails (403 = insufficient permissions, 404 = profile not found): warn user, continue without blocking setup.

**Credential persistence:**
- `sonar.host_url` → write to `.quality-gates/config.yaml` (non-sensitive)
- `SONAR_TOKEN` → append to `.env` (never write to config)
- Verify `.env` is in `.gitignore` — add it if missing

---

## Step 3: Confirm with user [BLOCKING]

Use `AskUserQuestion`:
- Show: `Detected: <stacks + frameworks>`
- Show: TypeScript: yes/no, ORM: yes/no, Template engine: yes/no
- Show: `Extra excludes (inferred): <EXTRA_EXCLUDES csv, or "none">` — user can add/remove
- Show: coverage threshold
- Show: sonar: enabled/disabled, dast: enabled/disabled, hooks: yes/no
- Options: `Apply this config` / `Customize` / `Use minimal defaults`
- If `Customize`: ask user to provide final exclude list (pre-filled with inferred values)

---

## Step 4: Generate config + persist credentials

```bash
bash .claude/skills/quality-gates/setup/generate-config.sh --non-interactive \
  --stacks=<stacks> \
  --coverage=<N> \
  [--exclude=<patterns-csv>] \
  [--gates=<gates-csv>] \
  [--dast-tags=<tags-csv>] \
  [--dast-block-severity=<critical|high|medium>] \
  [--dast-allow-local] \
  [--sonar-host-url=<url>] [--sonar-project-key=<key>] \
  [--force]
```

**Gitleaks config (always run after generate-config.sh):**
Read `references/gitleaks-rules-reference.md` and compose `.quality-gates/gitleaks.toml` based on stack signals from Step 1:
- Always start with the Base Config (`[extend] useDefault = true`)
- Add custom rules matching detected signals (internal token patterns, DB connection strings, etc.)
- Add allowlists matching detected patterns (test dirs, CI env refs, template vars, docs dirs)
- If no special signals detected, use the Minimal Config from the reference
- Write to `.quality-gates/gitleaks.toml` and set `gitleaks.config_path: .quality-gates/gitleaks.toml` in config.yaml

**SonarQube (if enabled):**
Read `references/sonar-properties-reference.md` → select snippets matching detected stacks → pass as context when running setup-sonar.sh:
```bash
SONAR_HOST_URL=<url> SONAR_TOKEN=<token> bash .claude/skills/quality-gates/setup/setup-sonar.sh
```
setup-sonar.sh generates `sonar-project.properties` — after it runs, augment the file with stack-specific settings from the reference (test paths, coverage report paths, exclusions).

After generating, persist credentials:
```
# Non-sensitive → .quality-gates/config.yaml (already written by generate-config.sh)

# Sensitive → append to .env (do not overwrite existing)
SONAR_TOKEN=<token>
```

Ensure `.quality-gates/reports/` exists: `mkdir -p .quality-gates/reports`

---

## Step 5: Setup + install validation

```bash
bash .claude/skills/quality-gates/setup/setup-all.sh --non-interactive --json \
  --stacks=<stacks> --coverage=<N> --file-max-loc=<N> \
  --gates=<gates> [--setup-dast] [--setup-hooks]
```

Parse JSON: `installed[]`, `missing[]`, `configured[]`, `skipped[]`.

---

## Step 6: Install guidance (per tool in missing[])

For each tool in `missing[]`:
1. Explain why the gate needs it
2. Use `AskUserQuestion`: "Install now / Disable gate / Install later"
   - **Install:** run install command, verify with `command -v <tool>`
   - **Disable:** re-run setup-all.sh with remaining gates
   - **Later:** note as pending
3. Re-run setup-all.sh to confirm final status

---

## Step 7: Summary

Print:
- Gates enabled and status
- Tools installed / missing
- Config files created
- `Run /quality-gates run to verify`
- Pending installs checklist (if any)
