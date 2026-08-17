#!/usr/bin/env python3
"""Shared utilities for W3C DTCG design token scripts — tree walking, security, constants."""

import json
import re

# Supported W3C DTCG token types
SUPPORTED_TYPES = {
    'color', 'dimension', 'fontFamily', 'fontWeight', 'duration',
    'cubicBezier', 'number', 'shadow', 'border', 'typography',
    'gradient', 'strokeStyle', 'transition',
}

# Security blocklist patterns — reject any $value containing these
SECURITY_PATTERNS = [
    r'url\(', r'expression\(', r'@import', r'<script',
    r'javascript:', r'eval\(', r'var\(--', r'data:',
]
SECURITY_RE = re.compile('|'.join(SECURITY_PATTERNS), re.IGNORECASE)


def collect_token_paths(data, parent_path='', inherited_type=None):
    """Walk token tree, yield (dot_path, $type, $value) for each token leaf."""
    current_type = data.get('$type', inherited_type)
    for key, val in data.items():
        if key.startswith('$'):
            continue
        child_path = f'{parent_path}.{key}' if parent_path else key
        if isinstance(val, dict):
            if '$value' in val:
                yield (child_path, val.get('$type', current_type), val['$value'])
            else:
                yield from collect_token_paths(val, child_path, current_type)


def collect_key_paths(data, parent_path=''):
    """Collect all token key paths (for theme consistency checks)."""
    paths = set()
    for key, val in data.items():
        if key.startswith('$'):
            continue
        child_path = f'{parent_path}.{key}' if parent_path else key
        if isinstance(val, dict):
            if '$value' in val:
                paths.add(child_path)
            else:
                paths.update(collect_key_paths(val, child_path))
    return paths


def security_check(value, path):
    """Check $value for security-sensitive patterns. Returns list of error strings."""
    text = json.dumps(value) if not isinstance(value, str) else value
    if SECURITY_RE.search(text):
        return [f'[ERROR] {path}: $value contains blocked security pattern']
    return []


def is_safe_value(value):
    """Check token value against security blocklist. Returns True if safe."""
    text = json.dumps(value) if not isinstance(value, str) else value
    return not SECURITY_RE.search(text)


def deep_merge(base, override):
    """Deep merge override into base (returns new dict)."""
    result = dict(base)
    for key, val in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(val, dict):
            result[key] = deep_merge(result[key], val)
        else:
            result[key] = val
    return result
