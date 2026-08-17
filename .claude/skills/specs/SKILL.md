---
name: specs
description: "Analyze requirements, create/maintain FSD and use cases. Use for business analysis, requirements documentation, functional specs."
argument-hint: "init|analyze 'description'|update"
---

# Business Analysis

Create and maintain Functional Specification Documents (FSD) and use case documentation through codebase analysis and requirements engineering.

## Default (No Arguments)

If invoked without arguments, use `AskUserQuestion` to present available operations:

| Operation | Description |
|-----------|-------------|
| `init` | Analyze codebase & create FSD + use cases |
| `analyze` | Analyze new feature requirements |
| `update` | Sync FSD & use cases with codebase |

Present as options via `AskUserQuestion` with header "Business Analysis", question "What would you like to do?".

## Subcommands

| Subcommand | Reference | Purpose |
|------------|-----------|---------|
| `/specs init` | `references/init-workflow.md` | Analyze codebase and create initial FSD + use cases |
| `/specs analyze "feature"` | `references/analyze-workflow.md` | Analyze new feature and update FSD + use cases |
| `/specs update` | `references/update-workflow.md` | Sync FSD + use cases with current codebase state |

## Routing

Parse `$ARGUMENTS` first word:
- `init` → Load `references/init-workflow.md`
- `analyze` → Load `references/analyze-workflow.md`, pass remaining args as feature description
- `update` → Load `references/update-workflow.md`
- empty/unclear → AskUserQuestion

## Shared Context

- Detection script: `.claude/skills/common/detect-project-type.sh`
- FSD template: `references/templates/fsd-template.md`
- UC template: `references/templates/use-case-template.md`
- PRD input: `docs/project-overview-pdr.md`
- Output FSD: `docs/project-fsd.md`
- Output UCs: `docs/usecases/{module}/uc-{module}-{nnn}-{slug}.md`

**Note**: This skill was previously named `/ba`. All references now use `/specs`.

**IMPORTANT**: **Do not** start implementing code. This skill produces documentation only.
