# Theme Configuration

Multi-theme architecture using W3C DTCG tokens with base + override layers.

## Architecture

```
docs/design-system/
├── tokens.json          # Base tokens (shared across all themes)
└── themes/
    ├── light.json       # Light theme overrides
    └── dark.json        # Dark theme overrides
```

**Resolution order:** Theme values override base. Missing keys fall back to base.

## Base Tokens (`tokens.json`)

Contains all design tokens with default (theme-agnostic) values:

```json
{
  "color": {
    "$type": "color",
    "primary": {
      "500": { "$value": "#1a73e8", "$description": "Primary brand color" },
      "600": { "$value": "#1557b0", "$description": "Primary hover" }
    },
    "neutral": {
      "50":  { "$value": "#fafafa" },
      "900": { "$value": "#171717" }
    },
    "semantic": {
      "background":  { "$value": "#ffffff", "$description": "Page background" },
      "foreground":  { "$value": "#171717", "$description": "Primary text" },
      "muted":       { "$value": "#f5f5f5", "$description": "Subtle backgrounds" },
      "muted-foreground": { "$value": "#737373", "$description": "Secondary text" },
      "border":      { "$value": "#e5e5e5", "$description": "Dividers, borders" },
      "ring":        { "$value": "#1a73e8", "$description": "Focus rings" }
    }
  },
  "dimension": {
    "$type": "dimension",
    "spacing": {
      "xs": { "$value": "4px" },
      "sm": { "$value": "8px" },
      "md": { "$value": "16px" },
      "lg": { "$value": "24px" },
      "xl": { "$value": "32px" }
    },
    "radius": {
      "sm": { "$value": "4px" },
      "md": { "$value": "8px" },
      "lg": { "$value": "16px" },
      "full": { "$value": "9999px" }
    }
  },
  "fontFamily": {
    "$type": "fontFamily",
    "sans": { "$value": ["Inter", "system-ui", "sans-serif"] },
    "mono": { "$value": ["JetBrains Mono", "monospace"] }
  }
}
```

## Theme Override Files

Theme files contain ONLY tokens that differ from base. Same structure, subset of keys.

### `themes/light.json`
```json
{
  "$extensions": {
    "theme": {
      "name": "light",
      "description": "Default light theme"
    }
  },
  "color": {
    "$type": "color",
    "semantic": {
      "background":  { "$value": "#ffffff" },
      "foreground":  { "$value": "#171717" },
      "muted":       { "$value": "#f5f5f5" },
      "muted-foreground": { "$value": "#737373" },
      "border":      { "$value": "#e5e5e5" },
      "ring":        { "$value": "#1a73e8" }
    }
  }
}
```

### `themes/dark.json`
```json
{
  "$extensions": {
    "theme": {
      "name": "dark",
      "description": "Dark theme"
    }
  },
  "color": {
    "$type": "color",
    "semantic": {
      "background":  { "$value": "#0a0a0a" },
      "foreground":  { "$value": "#fafafa" },
      "muted":       { "$value": "#262626" },
      "muted-foreground": { "$value": "#a3a3a3" },
      "border":      { "$value": "#262626" },
      "ring":        { "$value": "#3b82f6" }
    }
  }
}
```

## Theme Metadata

Use `$extensions.theme` at root level for theme identification:

```json
{
  "$extensions": {
    "theme": {
      "name": "dark",
      "description": "Dark theme for low-light environments"
    }
  }
}
```

## Semantic Token Pattern

Map semantic names to palette values for theme flexibility:

| Semantic Token | Light Value | Dark Value | Purpose |
|---------------|-------------|------------|---------|
| `color.semantic.background` | `#ffffff` | `#0a0a0a` | Page background |
| `color.semantic.foreground` | `#171717` | `#fafafa` | Primary text |
| `color.semantic.muted` | `#f5f5f5` | `#262626` | Subtle backgrounds |
| `color.semantic.border` | `#e5e5e5` | `#262626` | Dividers, borders |
| `color.semantic.ring` | `#1a73e8` | `#3b82f6` | Focus rings |

**Rule:** Palette tokens (e.g., `color.primary.500`) are theme-agnostic — stay in base only. Semantic tokens (e.g., `color.semantic.background`) MUST have stubs in base `tokens.json` with default values, then each theme overrides them.

## Creating a New Theme

1. Copy an existing theme file as starting point
2. Update `$extensions.theme.name` and `description`
3. Modify `$value` for each overridden token
4. Run `validate` to check all keys exist in base
5. Add the new theme file to `docs/design-system/themes/`

## Validation Rules (Theme-Specific)

1. Theme files MUST NOT introduce keys absent from `tokens.json`
2. Theme files MUST have `$extensions.theme.name`
3. All semantic tokens in one theme MUST exist in all other themes
4. Theme `$value` types must match base token `$type`
5. Theme files should only contain overrides — don't duplicate unchanged base values
