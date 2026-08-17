---
name: design-system
description: "Design system management: W3C Design Tokens (DTCG), component catalog, themes. Actions: create, update, sync, validate, export, discover design system. Topics: tokens, themes, component catalog, brand identity, visual consistency."
argument-hint: "create|update|sync|validate|export|discover"
---

# Design System Management

Create and maintain design systems with W3C Design Tokens (DTCG), component catalogs, and multi-theme configurations.

## Default (No Arguments)

If invoked without arguments, use `AskUserQuestion` to present available operations:

| Operation | Description |
|-----------|-------------|
| `create` | Initialize design system — scaffold tokens, catalog, themes |
| `update` | Add or modify tokens, components, or themes |
| `sync` | Sync tokens from Figma variables (requires Figma MCP) |
| `validate` | Check W3C DTCG compliance and detect issues |
| `export` | Convert tokens.json to target format (CSS vars, Tailwind, etc.) |
| `discover` | Scan codebase for existing design patterns → suggest tokens |

Present as options via `AskUserQuestion` with header "Design System", question "What would you like to do?".

## Prerequisites

**MANDATORY:** Activate `ui-ux-pro-max` skill FIRST for actions: `create`, `update`, `discover`.
This provides palette, typography, and style intelligence for design decisions.

```
Activation: Skill(skill: "ui-ux-pro-max")
```

## Routing

Parse `$ARGUMENTS` first word:

| Action | Activate `ui-ux-pro-max` | Load Reference | Workflow |
|--------|--------------------------|----------------|----------|
| `create` | Yes | All 3 references | Interactive discovery → scaffold `docs/design-system/` |
| `update` | Yes | `references/token-schema.md` | Read existing tokens → modify → validate → write |
| `sync` | No | `references/token-schema.md` | Check Figma MCP → `get_variable_defs` → merge tokens.json |
| `validate` | No | `references/token-schema.md` | **Run `scripts/validate-tokens.py`** → report results |
| `export` | No | `references/token-schema.md` | **Run `scripts/export-tokens.py`** → output converted tokens |
| `discover` | Yes | `references/component-catalog.md` + `references/token-schema.md` | Scan codebase → suggest tokens + components |
| empty | — | — | `AskUserQuestion` (see Default) |

## Subcommands

| Subcommand | Reference | Purpose |
|------------|-----------|---------|
| Token schema & validation | `references/token-schema.md` | W3C DTCG spec, types, naming, validation rules |
| Component catalog | `references/component-catalog.md` | Lightweight catalog template and discovery |
| Theme configuration | `references/theme-config.md` | Multi-theme structure (base + light/dark overrides) |

## Output Structure

All output files go to `docs/design-system/`:

```
docs/design-system/
├── design-principles.md     # Visual principles, do's/don'ts, rationale (prose)
├── tokens.json              # W3C DTCG source of truth (base tokens)
├── component-catalog.md     # Component inventory (name, description, status, path)
└── themes/
    ├── light.json           # Light theme token overrides
    └── dark.json            # Dark theme token overrides
```

## Create Workflow

1. Activate `ui-ux-pro-max`
2. Ask user about project type, brand colors, typography preferences via `AskUserQuestion`
3. Use `ui-ux-pro-max` intelligence to recommend palette, font pairings, spacing scale
4. Scaffold `docs/design-system/` directory
5. Write `tokens.json` with base tokens (color, dimension, fontFamily, fontWeight, shadow)
6. Write `themes/light.json` and `themes/dark.json` with semantic overrides
7. Run `discover` to scan codebase → populate `component-catalog.md`
8. Run `validate` to confirm schema compliance

## Figma Sync (Optional)

For `sync` action — requires Figma MCP plugin:

1. Check if Figma MCP is available (test with `get_variable_defs`)
2. If available: extract variables → map to W3C DTCG types → merge into `tokens.json`
3. If unavailable: notify user, suggest manual token definition via `create` or `update`
4. Never block on Figma — all actions work without it

## Validation & Security

Load `references/token-schema.md` for full rules. Key checks:

- **Schema:** Required fields per token type (`$type`, `$value`)
- **Naming:** kebab-case, dot-separated groups (`color.primary.500`)
- **Security:** Reject values containing `url()`, `expression()`, `@import`, `<script>`, `javascript:`
- **Consistency:** Same keys must exist across base and all theme files
- **Duplicates:** No duplicate token names within same group

## Export

Read `tokens.json` → convert to requested format:

| Target | Output |
|--------|--------|
| CSS Custom Properties | `:root { --color-primary-500: #xxx; }` |
| Tailwind Config | `theme.extend` object (use `JSON.stringify` for safety) |
| JSON (flat) | Flattened key-value pairs |

Export is extensible — add formats as needed without changing core skill.

## Scripts

Deterministic operations use Python scripts (stdlib only, no pip deps):

### Validate
```bash
python .claude/skills/design-system/scripts/validate-tokens.py [tokens-dir]
# Default tokens-dir: docs/design-system/
# Exit 0 = valid, Exit 1 = errors found
```

### Export
```bash
python .claude/skills/design-system/scripts/export-tokens.py [tokens-dir] --format css|tailwind|json-flat [--theme light|dark] [--output file]
```
