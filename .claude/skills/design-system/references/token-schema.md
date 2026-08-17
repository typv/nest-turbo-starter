# W3C Design Token Schema & Validation

Reference for W3C Design Token Community Group (DTCG) format.

## Token Structure

Each token is a JSON object with required fields:

```json
{
  "$type": "color",
  "$value": "#1a73e8",
  "$description": "Primary brand color"
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `$type` | string | Token type (see Supported Types) |
| `$value` | varies | Value matching the type spec |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `$description` | string | Human-readable purpose |
| `$extensions` | object | Custom metadata (theme info, aliases) |

## Supported Types

| Type | `$value` Format | Example |
|------|-----------------|---------|
| `color` | Hex string (#RRGGBB or #RRGGBBAA) | `"#1a73e8"` |
| `dimension` | Number + unit (px, rem, em) | `"16px"`, `"1rem"` |
| `fontFamily` | Array of font name strings | `["Inter", "sans-serif"]` |
| `fontWeight` | Number (100-900) or keyword | `400`, `"bold"` |
| `duration` | Number + ms/s | `"200ms"` |
| `cubicBezier` | Array of 4 numbers (x: 0-1, y: unrestricted) | `[0.4, 0, 0.2, 1]` |
| `number` | Plain number | `1.5` |
| `shadow` | Object: color, offsetX/Y, blur, spread | See below |
| `border` | Object: color, width, style | See below |
| `typography` | Object: fontFamily, fontSize, fontWeight, lineHeight, letterSpacing | See below |
| `gradient` | Array of gradient stops | See below |
| `strokeStyle` | String or object with dashArray/lineCap | See below |
| `transition` | Object: duration, delay, timingFunction | See below |

**Color format note:** Hex strings are widely supported and recommended for interoperability. The W3C DTCG 2025.10 spec also defines a structured color format with `colorSpace`/`components` for wide-gamut colors — use that when Display P3 or OKLCh precision is needed.

### Composite Type: `shadow`
```json
{
  "$type": "shadow",
  "$value": {
    "color": "#00000026",
    "offsetX": "0px",
    "offsetY": "4px",
    "blur": "8px",
    "spread": "0px"
  }
}
```

### Composite Type: `border`
```json
{
  "$type": "border",
  "$value": {
    "color": "#e0e0e0",
    "width": "1px",
    "style": "solid"
  }
}
```

### Composite Type: `typography`
```json
{
  "$type": "typography",
  "$value": {
    "fontFamily": ["Inter", "system-ui", "sans-serif"],
    "fontSize": "16px",
    "fontWeight": 400,
    "lineHeight": "1.5",
    "letterSpacing": "0px"
  }
}
```

### Composite Type: `gradient`
```json
{
  "$type": "gradient",
  "$value": [
    { "color": "#1a73e8", "position": 0 },
    { "color": "#34a853", "position": 1 }
  ]
}
```

### Composite Type: `strokeStyle`
```json
{
  "$type": "strokeStyle",
  "$value": {
    "dashArray": ["4px", "8px"],
    "lineCap": "round"
  }
}
```
String shorthand also valid: `"solid"`, `"dashed"`, `"dotted"`.

### Composite Type: `transition`
```json
{
  "$type": "transition",
  "$value": {
    "duration": "200ms",
    "delay": "0ms",
    "timingFunction": [0.4, 0, 0.2, 1]
  }
}
```

## Token Groups

Tokens organized in nested groups. Groups inherit `$type` from parent:

```json
{
  "color": {
    "$type": "color",
    "primary": {
      "500": { "$value": "#1a73e8" },
      "600": { "$value": "#1557b0" }
    },
    "neutral": {
      "50":  { "$value": "#fafafa" },
      "900": { "$value": "#171717" }
    }
  }
}
```

When a group sets `$type`, child tokens inherit it (no need to repeat).

## Naming Conventions

- Use **kebab-case** for token names: `font-size`, `line-height`
- Use **dot notation** for referencing: `color.primary.500`
- Group hierarchy: `category.variant.scale` (e.g., `spacing.section.lg`)
- Max nesting depth: 4 levels

## Validation Rules

### Schema Checks
1. Every token MUST have `$type` (own or inherited from parent group)
2. Every token MUST have `$value` matching its type format
3. `$type` must be one of the supported types listed above
4. Color hex values must be valid 6 or 8 digit hex (#RRGGBB or #RRGGBBAA)
5. Dimension values must include a unit (px, rem, em)
6. fontWeight must be 100-900 (multiples of 100) or a valid keyword
7. fontFamily `$value` must be an array of strings, not comma-separated
8. cubicBezier x-values (indices 0, 2) must be in [0, 1]; y-values unrestricted

### Security Sanitization (MANDATORY)
Reject any `$value` containing:
- `url(` — prevents external resource loading
- `expression(` — prevents CSS expression injection
- `@import` — prevents stylesheet injection
- `<script` — prevents XSS
- `javascript:` — prevents JS protocol injection
- `eval(` — prevents code execution
- `var(--` — prevents CSS variable injection in token values
- `data:` — prevents data URI content injection

### Consistency Checks
1. No duplicate token names within the same group
2. All theme override files must use keys that exist in base `tokens.json`
3. Semantic tokens (e.g., `color.semantic.*`) MUST have stubs in base `tokens.json` so themes can override them
4. Referenced aliases (`$value: "{color.primary.500}"`) must resolve to existing tokens

### Error Reporting Format
```
[SEVERITY] path.to.token: description
  [ERROR] color.primary.500: $value "#xyz" is not valid hex
  [WARN]  spacing.sm: missing $description (recommended)
  [INFO]  themes/dark.json: 3 tokens override base
```
