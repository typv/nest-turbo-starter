#!/usr/bin/env python3
"""Validate W3C DTCG design tokens — schema, security, theme consistency."""

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

from token_utils import SUPPORTED_TYPES, collect_token_paths, collect_key_paths, security_check

# Type-specific validation regexes
COLOR_RE = re.compile(r'^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$')
DIMENSION_RE = re.compile(r'^-?\d+(\.\d+)?(px|rem|em)$')
DURATION_RE = re.compile(r'^-?\d+(\.\d+)?(ms|s)$')
FONT_WEIGHT_KEYWORDS = {'normal', 'bold', 'lighter', 'bolder'}

# Required keys for composite types
SHADOW_KEYS = {'color', 'offsetX', 'offsetY', 'blur', 'spread'}
BORDER_KEYS = {'color', 'width', 'style'}
TYPOGRAPHY_KEYS = {'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'}
TRANSITION_KEYS = {'duration', 'delay', 'timingFunction'}

# Naming: kebab-case or camelCase (DTCG standard uses camelCase for type names)
KEBAB_OR_CAMEL_RE = re.compile(r'^[a-z][a-zA-Z0-9]*(-[a-z0-9]+)*$|^\d+$')


def validate_value(token_type, value, path):
    """Validate $value matches $type format. Returns list of error strings."""
    errors = []
    if token_type == 'color':
        if not isinstance(value, str) or not COLOR_RE.match(value):
            errors.append(f'[ERROR] {path}: $value "{value}" is not valid hex (expected #RRGGBB or #RRGGBBAA)')
    elif token_type == 'dimension':
        if not isinstance(value, str) or not DIMENSION_RE.match(value):
            errors.append(f'[ERROR] {path}: $value "{value}" is not valid dimension (expected number+px/rem/em)')
    elif token_type == 'fontFamily':
        if not isinstance(value, list) or not all(isinstance(v, str) for v in value):
            errors.append(f'[ERROR] {path}: $value must be array of strings for fontFamily')
    elif token_type == 'fontWeight':
        valid = (isinstance(value, int) and 100 <= value <= 900 and value % 100 == 0)
        valid = valid or (isinstance(value, str) and value.lower() in FONT_WEIGHT_KEYWORDS)
        if not valid:
            errors.append(f'[ERROR] {path}: $value "{value}" is not valid fontWeight (100-900 or keyword)')
    elif token_type == 'duration':
        if not isinstance(value, str) or not DURATION_RE.match(value):
            errors.append(f'[ERROR] {path}: $value "{value}" is not valid duration (expected number+ms/s)')
    elif token_type == 'cubicBezier':
        if not isinstance(value, list) or len(value) != 4 or not all(isinstance(v, (int, float)) for v in value):
            errors.append(f'[ERROR] {path}: cubicBezier must be array of 4 numbers')
        elif not (0 <= value[0] <= 1 and 0 <= value[2] <= 1):
            errors.append(f'[ERROR] {path}: cubicBezier x-values (indices 0,2) must be in [0,1]')
    elif token_type == 'number':
        if not isinstance(value, (int, float)):
            errors.append(f'[ERROR] {path}: $value must be a number')
    elif token_type == 'shadow':
        if not isinstance(value, dict) or not SHADOW_KEYS.issubset(value.keys()):
            errors.append(f'[ERROR] {path}: shadow must have keys: {", ".join(sorted(SHADOW_KEYS))}')
    elif token_type == 'border':
        if not isinstance(value, dict) or not BORDER_KEYS.issubset(value.keys()):
            errors.append(f'[ERROR] {path}: border must have keys: {", ".join(sorted(BORDER_KEYS))}')
    elif token_type == 'typography':
        if not isinstance(value, dict) or not TYPOGRAPHY_KEYS.issubset(value.keys()):
            errors.append(f'[ERROR] {path}: typography must have keys: {", ".join(sorted(TYPOGRAPHY_KEYS))}')
    elif token_type == 'gradient':
        if not isinstance(value, list) or not all(isinstance(s, dict) and 'color' in s and 'position' in s for s in value):
            errors.append(f'[ERROR] {path}: gradient must be array of {{color, position}} objects')
    elif token_type == 'strokeStyle':
        if isinstance(value, str):
            pass  # string shorthand is valid
        elif isinstance(value, dict):
            if 'dashArray' not in value or 'lineCap' not in value:
                errors.append(f'[ERROR] {path}: strokeStyle object must have dashArray and lineCap')
        else:
            errors.append(f'[ERROR] {path}: strokeStyle must be string or object')
    elif token_type == 'transition':
        if not isinstance(value, dict) or not TRANSITION_KEYS.issubset(value.keys()):
            errors.append(f'[ERROR] {path}: transition must have keys: {", ".join(sorted(TRANSITION_KEYS))}')
    return errors


def validate_naming(path):
    """Check that each segment of a token path is kebab-case or camelCase."""
    errors = []
    segments = path.split('.')
    if len(segments) > 4:
        errors.append(f'[WARN]  {path}: exceeds recommended 4-level nesting depth')
    for seg in segments:
        if not KEBAB_OR_CAMEL_RE.match(seg):
            errors.append(f'[WARN]  {path}: segment "{seg}" is not kebab-case or camelCase')
    return errors


def validate_base(base_data):
    """Validate base tokens. Returns (messages, base_paths)."""
    messages = []
    base_paths = set()
    for path, token_type, value in collect_token_paths(base_data):
        base_paths.add(path)
        if not token_type:
            messages.append(f'[ERROR] {path}: missing $type (no own or inherited type)')
            continue
        if token_type not in SUPPORTED_TYPES:
            messages.append(f'[ERROR] {path}: unsupported $type "{token_type}"')
            continue
        messages.extend(validate_value(token_type, value, path))
        messages.extend(security_check(value, path))
        messages.extend(validate_naming(path))
    return messages, base_paths


def validate_themes(tokens_dir, base_paths):
    """Validate theme files against base tokens. Returns messages."""
    themes_dir = tokens_dir / 'themes'
    if not themes_dir.exists():
        return ['[INFO]  No themes/ directory found — skipping theme checks']

    messages = []
    theme_files = sorted(themes_dir.glob('*.json'))
    all_theme_keys = {}

    for theme_file in theme_files:
        theme_name = theme_file.stem
        try:
            theme_data = json.loads(theme_file.read_text(encoding='utf-8'))
        except json.JSONDecodeError as e:
            messages.append(f'[ERROR] themes/{theme_file.name}: invalid JSON — {e}')
            continue

        # Must have theme metadata
        theme_meta = theme_data.get('$extensions', {}).get('theme', {})
        if not theme_meta.get('name'):
            messages.append(f'[ERROR] themes/{theme_file.name}: missing $extensions.theme.name')

        # Collect and validate theme keys
        theme_keys = collect_key_paths(theme_data)
        all_theme_keys[theme_name] = theme_keys
        extra_keys = theme_keys - base_paths
        for key in sorted(extra_keys):
            messages.append(f'[ERROR] themes/{theme_file.name}: key "{key}" not found in base tokens.json')

        # Validate theme token values
        for path, token_type, value in collect_token_paths(theme_data):
            theme_path = f'themes/{theme_name}.{path}'
            if token_type and token_type in SUPPORTED_TYPES:
                messages.extend(validate_value(token_type, value, theme_path))
            elif token_type and token_type not in SUPPORTED_TYPES:
                messages.append(f'[ERROR] {theme_path}: unsupported $type "{token_type}"')
            messages.extend(security_check(value, theme_path))

        messages.append(f'[INFO]  themes/{theme_file.name}: {len(theme_keys)} tokens override base')

    # Cross-theme consistency for semantic tokens
    if len(all_theme_keys) > 1:
        all_keys = set().union(*all_theme_keys.values())
        for theme_name, keys in all_theme_keys.items():
            for key in sorted(all_keys - keys):
                if 'semantic' in key:
                    messages.append(f'[WARN]  themes/{theme_name}.json: missing semantic token "{key}" present in other themes')

    return messages


def main():
    parser = argparse.ArgumentParser(description='Validate W3C DTCG design tokens')
    parser.add_argument('tokens_dir', nargs='?', default='docs/design-system',
                        help='Path to design system directory (default: docs/design-system)')
    args = parser.parse_args()

    tokens_dir = Path(args.tokens_dir)
    tokens_file = tokens_dir / 'tokens.json'

    if not tokens_file.exists():
        print('[ERROR] tokens.json not found')
        print('\nSummary: 1 error(s), 0 warning(s), 0 info(s)')
        sys.exit(1)

    try:
        base_data = json.loads(tokens_file.read_text(encoding='utf-8'))
    except json.JSONDecodeError as e:
        print(f'[ERROR] tokens.json: invalid JSON — {e}')
        print('\nSummary: 1 error(s), 0 warning(s), 0 info(s)')
        sys.exit(1)

    messages, base_paths = validate_base(base_data)
    messages.extend(validate_themes(tokens_dir, base_paths))

    for msg in messages:
        print(msg)

    errors = sum(1 for m in messages if m.startswith('[ERROR]'))
    warnings = sum(1 for m in messages if m.startswith('[WARN]'))
    infos = sum(1 for m in messages if m.startswith('[INFO]'))
    print(f'\nSummary: {errors} error(s), {warnings} warning(s), {infos} info(s)')
    sys.exit(1 if errors > 0 else 0)


if __name__ == '__main__':
    main()
