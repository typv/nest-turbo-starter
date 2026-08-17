# Component Catalog

Lightweight component inventory for `docs/design-system/component-catalog.md`.

## Catalog Format

The catalog is a markdown file with a table of components:

```markdown
# Component Catalog

| Component | Description | Status | Source |
|-----------|-------------|--------|--------|
| Button | Primary action trigger with variants | stable | src/components/ui/button.tsx |
| Card | Content container with header/body/footer | stable | src/components/ui/card.tsx |
| Modal | Overlay dialog for focused interactions | beta | src/components/ui/modal.tsx |
| Tooltip | Deprecated — use Popover instead | deprecated | src/components/ui/tooltip.tsx |
```

## Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| Component | Display name (PascalCase) | `Button`, `DataTable` |
| Description | One-line purpose (no period) | `Primary action trigger with variants` |
| Status | Lifecycle stage | `stable`, `beta`, `deprecated` |
| Source | Relative path to source file | `src/components/ui/button.tsx` |

## Status Values

| Status | Meaning | Usage |
|--------|---------|-------|
| `stable` | Production-ready, API frozen | Safe for all use |
| `beta` | Functional but API may change | Use with caution |
| `deprecated` | Scheduled for removal | Migrate to replacement |

When marking `deprecated`, include replacement in description: `"Deprecated — use Popover instead"`.

## Discovery Workflow

The `discover` action scans the codebase for component patterns:

### Step 1: Scan for component files
Use Glob tool (not `find` command) to search for component patterns:
```
Glob("src/**/components/**/*.tsx")
Glob("src/**/components/**/*.vue")
Glob("lib/**/components/**/*.tsx")
Glob("lib/**/widgets/**/*.dart")
```

### Step 2: Extract component names
- React: `export function ComponentName` or `export const ComponentName`
- Vue: `<script>` with `name: 'ComponentName'`
- Svelte: filename is component name

### Step 3: Generate catalog entries
For each discovered component:
1. Extract name from export/filename
2. Read first JSDoc/comment line for description
3. Default status to `stable` unless marked otherwise
4. Record relative source path

### Step 4: Merge with existing catalog
- New components → append to table
- Existing components → update description/status if changed
- Removed components → mark as `deprecated` (don't delete)

## Manual Updates

To add a component manually via `update` action:
1. Read existing `docs/design-system/component-catalog.md`
2. Ask user for: component name, description, status, source path
3. Insert alphabetically by component name
4. Write updated file

## Guidelines

- Keep descriptions under 60 characters
- One component per row (no grouping rows)
- Sort alphabetically by component name
- Link source paths relative to project root
- Don't track internal/private components (prefixed with `_` or `Internal`)
- Don't document props, variants, or APIs — that's the component's own docs' job
