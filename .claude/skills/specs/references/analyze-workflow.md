# Analyze Workflow — /specs analyze "feature description"

Analyze a new feature requirement and update FSD + use cases.

## Arguments

Everything after `analyze` in `$ARGUMENTS` is the feature description.
Example: `/specs analyze "add two-factor authentication to login flow"`

## Steps

### 1. Detect Project Type

```bash
sh .claude/skills/common/detect-project-type.sh
```

### 2. Read Current State

Read existing documents:
- `docs/project-fsd.md` — current FSD
- `docs/usecases/` — list existing modules and use cases via Glob

If FSD doesn't exist, warn: "No FSD found. Run `/specs init` first, or I'll create it now."

### 3. Spawn Business Analyst Agent

Spawn `business-analyst` agent via Task tool with:

```
Analyze new feature and update requirements documentation.

Feature description: {feature-description}
Project type: {detected-type}
Current FSD: {fsd-summary-or-note-if-missing}
Existing modules: {list-of-modules-from-usecases-dir}

Instructions:
1. Determine which module this feature belongs to (existing or new)
2. Read templates:
   - FSD: .claude/skills/specs/references/templates/fsd-template.md
   - UC: .claude/skills/specs/references/templates/use-case-template.md

3. Update docs/project-fsd.md:
   - Add/update feature spec section for the relevant module
   - Add new business rules if applicable
   - Update data models if new entities needed
   - Add API contracts if new endpoints (api-backend/fullstack-web)
   - Add screen descriptions if new screens (web-frontend/fullstack-web/mobile)

4. Create new use case files in docs/usecases/{module}/:
   - Determine next available UC number for the module
   - Follow template structure
   - Cross-reference with FSD

5. If creating a new module:
   - Create docs/usecases/{module}/ directory
   - Add module section to FSD

Work context: {project-root}
```

### 4. Output Summary

Report:
- Module affected (new or existing)
- Use cases created/updated
- FSD sections modified
- New business rules added

## Important
- Do not remove existing use cases — only add or update
- Preserve existing FSD content when adding new sections
