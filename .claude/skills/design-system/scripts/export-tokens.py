#!/usr/bin/env python3
"""Export W3C DTCG design tokens to CSS custom properties, Tailwind config, or flat JSON."""

import argparse
import json
import re
import sys
from pathlib import Path

# Add scripts dir to path for local imports and win_compat
SCRIPTS_DIR = Path(__file__).parent
CLAUDE_ROOT = SCRIPTS_DIR.parent.parent.parent
sys.path.insert(0, str(SCRIPTS_DIR))
sys.path.insert(0, str(CLAUDE_ROOT / 'scripts'))
try:
    from win_compat import ensure_utf8_stdout
    ensure_utf8_stdout()
except ImportError:
    if sys.platform == 'win32':
        import io
        if hasattr(sys.stdout, 'buffer'):
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from token_utils import collect_token_paths, deep_merge, is_safe_value

# Allowed characters in CSS variable name segments
CSS_SAFE_RE = re.compile(r'^[a-zA-Z0-9-]+$')


def load_tokens(tokens_dir, theme=None):
    """Load tokens.json, optionally merge theme overrides."""
    tokens_dir = Path(tokens_dir).resolve()
    tokens_file = tokens_dir / 'tokens.json'
    if not tokens_file.exists():
        print(f'Error: {tokens_file} not found', file=sys.stderr)
        sys.exit(1)

    data = json.loads(tokens_file.read_text(encoding='utf-8'))

    if theme:
        # Path traversal guard
        themes_root = (tokens_dir / 'themes').resolve()
        theme_file = (themes_root / f'{theme}.json').resolve()
        if not str(theme_file).startswith(str(themes_root) + '/'):
            print('Error: theme name contains path traversal', file=sys.stderr)
            sys.exit(1)
        if not theme_file.exists():
            print(f'Error: theme file {theme_file} not found', file=sys.stderr)
            sys.exit(1)
        theme_data = json.loads(theme_file.read_text(encoding='utf-8'))
        data = deep_merge(data, theme_data)

    return data


def format_css_value(token_type, value):
    """Convert a token value to its CSS string representation."""
    if token_type == 'fontFamily' and isinstance(value, list):
        return ', '.join(f'"{f}"' if ' ' in f else f for f in value)
    if isinstance(value, dict):
        return json.dumps(value)
    return str(value)


def sanitize_css_name(path):
    """Convert dot path to safe CSS variable name, rejecting unsafe segments."""
    segments = path.replace('.', '-').split('-')
    for seg in segments:
        if not CSS_SAFE_RE.match(seg):
            return None
    return '--' + '-'.join(segments)


def export_css(data):
    """Export tokens as CSS custom properties."""
    lines = [':root {']
    for path, token_type, value in collect_token_paths(data):
        if not is_safe_value(value):
            print(f'Warning: skipping {path} — blocked security pattern', file=sys.stderr)
            continue
        css_var = sanitize_css_name(path)
        if css_var is None:
            print(f'Warning: skipping {path} — unsafe characters in name', file=sys.stderr)
            continue
        css_val = format_css_value(token_type, value)
        lines.append(f'  {css_var}: {css_val};')
    lines.append('}')
    return '\n'.join(lines)


def set_nested(obj, keys, value):
    """Set a value in a nested dict using a list of keys."""
    for key in keys[:-1]:
        obj = obj.setdefault(key, {})
    obj[keys[-1]] = value


def export_tailwind(data):
    """Export tokens as Tailwind theme.extend config."""
    tw_mapping = {
        'color': 'colors',
        'dimension.spacing': 'spacing',
        'dimension.radius': 'borderRadius',
        'fontFamily': 'fontFamily',
    }

    extend = {}
    for path, token_type, value in collect_token_paths(data):
        parts = path.split('.')
        mapped = False
        for dtcg_prefix, tw_key in tw_mapping.items():
            prefix_parts = dtcg_prefix.split('.')
            if parts[:len(prefix_parts)] == prefix_parts:
                remaining = parts[len(prefix_parts):]
                if remaining:
                    set_nested(extend.setdefault(tw_key, {}), remaining, value)
                else:
                    extend[tw_key] = value
                mapped = True
                break
        if not mapped:
            set_nested(extend, parts, value)

    return json.dumps({'theme': {'extend': extend}}, indent=2)


def export_flat_json(data):
    """Export tokens as flat key-value JSON."""
    flat = {}
    for path, _token_type, value in collect_token_paths(data):
        flat[path] = value
    return json.dumps(flat, indent=2)


FORMATTERS = {
    'css': export_css,
    'tailwind': export_tailwind,
    'json-flat': export_flat_json,
}


def main():
    parser = argparse.ArgumentParser(description='Export W3C DTCG design tokens')
    parser.add_argument('tokens_dir', nargs='?', default='docs/design-system',
                        help='Path to design system directory (default: docs/design-system)')
    parser.add_argument('--format', choices=FORMATTERS.keys(), required=True,
                        help='Output format: css, tailwind, json-flat')
    parser.add_argument('--theme', default=None,
                        help='Theme to merge (e.g., light, dark)')
    parser.add_argument('--output', default=None,
                        help='Output file path (default: stdout)')
    args = parser.parse_args()

    data = load_tokens(args.tokens_dir, args.theme)
    output = FORMATTERS[args.format](data)

    if args.output:
        Path(args.output).write_text(output + '\n', encoding='utf-8')
        print(f'Exported to {args.output}', file=sys.stderr)
    else:
        print(output)


if __name__ == '__main__':
    main()
