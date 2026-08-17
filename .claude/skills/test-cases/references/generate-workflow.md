# Generate Workflow — /test-cases generate [scope]

Generate test cases from use case documents.

## Arguments

Optional scope from `$ARGUMENTS` after `generate`:
- No scope → all modules in `docs/usecases/*/`
- `{module}` → all UCs in `docs/usecases/{module}/`
- `{module}/{uc-file}` → single UC file

## Steps

### 1. Validate Prerequisites

Check `docs/usecases/` exists and has content.
If not, error: "No use cases found. Run `/specs init` first to create use case documentation."

### 2. Determine Scope

- List target use case files based on scope argument
- Read `docs/project-fsd.md` business rules section for context

### 3. Spawn QA Engineer Agent

Spawn `testcase-writer` agent via Task tool with:

```
Generate test cases from use case documents.

Scope: {all | module: X | specific UC: X/Y}
Use case files: {list of UC file paths}
Business rules from FSD: {BR section content}

Instructions:
1. Read templates:
   - TC: .claude/skills/test-cases/references/templates/test-case-template.md
   - Summary: .claude/skills/test-cases/references/templates/test-summary-template.md

2. For each use case file:
   - Create docs/testcases/{module}/ directory (matching docs/usecases/ structure)
   - Create tc-{module}-{nnn}-{slug}.md with test scenarios:
     * At least 1 positive (happy path from main flow)
     * At least 1 negative (invalid input or unauthorized)
     * Edge cases where applicable
     * Security scenarios for auth/data-sensitive UCs
   - Assign priority based on UC priority and business criticality
   - Link back to source UC file

3. Generate/update docs/testcases/test-summary.md:
   - Coverage by module (UC count vs TC count)
   - Priority distribution
   - Type distribution
   - UC-to-TC mapping table

4. If docs/testcases/test-config.md does not exist, create it from template:
   - Template: .claude/skills/test-cases/references/templates/test-config-template.md
   - Pre-fill environment URLs, accounts, and prerequisites based on project type
   - Mark credential fields as "{see vault/env}" — never write real secrets

Work context: {project-root}
```

### 4. Output Summary

Report:
- Modules processed
- Test cases generated per module (by type)
- Total test case count
- Coverage percentage (UCs with TCs / total UCs)
