# Gitleaks Rules Reference

Used by the setup wizard (Step 6) to generate `.gitleaks.toml` for the project.

## How the Wizard Uses This File

1. **Always include** `[extend] useDefault = true` — preserves all built-in gitleaks rules
2. **Add custom rules** based on stack signals (see Signal → Rule table below)
3. **Add allowlists** based on detected test/fixture/template patterns
4. Write combined output to `.quality-gates/gitleaks.toml` and set `gitleaks.config_path` in `config.yaml`

---

## Signal → Custom Rule Mapping

| Signal detected | Add rule |
|----------------|----------|
| Internal API pattern in codebase (e.g. `internal_token`, `service_key`) | `custom-internal-token` (see below) |
| `.env.example` or `*.env.sample` present | allowlist those paths |
| `tests/`, `__tests__/`, `spec/` dirs present | allowlist test fixture paths |
| Handlebars/Jinja/ERB templates present | allowlist template variable patterns |
| CI env var references (`$SECRET`, `${TOKEN}`) in code | allowlist env ref patterns |
| `docs/`, `README*`, `*.md` files with example keys | allowlist doc paths |

---

## Base Config (always use this as the foundation)

```toml
# .quality-gates/gitleaks.toml
[extend]
useDefault = true   # Keep all built-in gitleaks rules

# Add custom rules and allowlists below
```

---

## Custom Rule Snippets

### Internal API token pattern
```toml
[[rules]]
id = "custom-internal-token"
description = "Internal service API token"
regex = '''(?i)(internal|service|app)[_-]?(token|key|secret)\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]'''
secretGroup = 0
tags = ["internal", "api-key"]
```

### Database connection string
```toml
[[rules]]
id = "custom-db-connection"
description = "Database connection string with credentials"
regex = '''(?i)(postgres|mysql|mongodb|redis):\/\/[^:]+:[^@]+@'''
secretGroup = 0
tags = ["database", "credentials"]
```

---

## Allowlist Snippets

### Test fixtures (add when test dirs detected)
```toml
[allowlist]
description = "Test fixture files"
paths = [
  '''tests?/fixtures/.*''',
  '''__tests__/.*''',
  '''spec/.*''',
  '''.*\.(test|spec)\.(ts|js|py|rb|go)''',
]
```

### Example/placeholder values (always include)
```toml
[[allowlists]]
id = "example-placeholders"
description = "Example and placeholder secret-like strings"
regexes = [
  '''(?i)(example|placeholder|your[_-]?key|changeme|xxx+|test[_-]?key|fake[_-]?secret|dummy)''',
  '''(?i)insert[_-]?(your|the)[_-]?(key|token|secret)''',
]
```

### CI/template variable references (add when template files or CI configs detected)
```toml
[[allowlists]]
id = "ci-env-references"
description = "CI environment variable references and template placeholders"
regexes = [
  '''\$\{[A-Z_][A-Z0-9_]*\}''',   # ${ENV_VAR}
  '''\$[A-Z_][A-Z0-9_]*''',        # $ENV_VAR
  '''<%=\s*[A-Z_].*?%>''',         # ERB <%= SECRET %>
  '''\{\{\s*[a-z_].*?\}\}''',      # Handlebars/Jinja {{ secret }}
]
```

### Documentation files (add when docs/ or README present)
```toml
[[allowlists]]
id = "documentation-paths"
description = "Documentation files with example values"
paths = [
  '''README.*''',
  '''docs/.*''',
  '''.*\.md''',
  '''CHANGELOG.*''',
]
```

---

## Minimal Config (no custom signals detected)

When no special signals detected, write only:

```toml
[extend]
useDefault = true

[[allowlists]]
id = "example-placeholders"
description = "Example and placeholder secret-like strings"
regexes = [
  '''(?i)(example|placeholder|your[_-]?key|changeme|xxx+|test[_-]?key|fake[_-]?secret|dummy)''',
]
```

---

## config.yaml Integration

After writing `.quality-gates/gitleaks.toml`, set in `config.yaml`:

```yaml
gitleaks:
  config_path: .quality-gates/gitleaks.toml
```

If no custom config needed, leave `config_path` empty — gitleaks auto-discovers `.gitleaks.toml` in project root.
