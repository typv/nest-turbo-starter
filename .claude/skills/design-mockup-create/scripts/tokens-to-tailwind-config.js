#!/usr/bin/env node
/**
 * Convert W3C DTCG tokens.json to a tailwind.config.js file for mockup builds.
 * Usage: node tokens-to-tailwind-config.js --tokens-dir docs/design-system/ --output path/to/tailwind.config.js
 */

const fs = require('fs');
const path = require('path');

// Map DTCG token path prefixes to Tailwind theme.extend keys
const TAILWIND_MAPPING = {
  'color': 'colors',
  'dimension.spacing': 'spacing',
  'dimension.radius': 'borderRadius',
  'fontFamily': 'fontFamily',
  'shadow': 'boxShadow',
};

// Security blocklist patterns — reject any $value containing these
const SECURITY_PATTERNS = /url\(|expression\(|@import|<script|javascript:|eval\(|var\(--|data:/i;

function isSafeValue(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return !SECURITY_PATTERNS.test(text);
}

/**
 * Walk token tree, yield [dotPath, $type, $value] for each token leaf.
 */
function* collectTokenPaths(data, parentPath = '', inheritedType = null) {
  const currentType = data['$type'] || inheritedType;
  for (const [key, val] of Object.entries(data)) {
    if (key.startsWith('$')) continue;
    const childPath = parentPath ? `${parentPath}.${key}` : key;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      if ('$value' in val) {
        yield [childPath, val['$type'] || currentType, val['$value']];
      } else {
        yield* collectTokenPaths(val, childPath, currentType);
      }
    }
  }
}

/** Unsafe prototype keys to guard against prototype pollution. */
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Set a value in a nested object using an array of keys. */
function setNested(obj, keys, value) {
  for (let i = 0; i < keys.length - 1; i++) {
    if (UNSAFE_KEYS.has(keys[i])) return;
    if (!(keys[i] in obj)) obj[keys[i]] = {};
    obj = obj[keys[i]];
  }
  if (!UNSAFE_KEYS.has(keys[keys.length - 1])) obj[keys[keys.length - 1]] = value;
}

/** Convert DTCG shadow composite to Tailwind box-shadow string. */
function formatShadowValue(value) {
  if (Array.isArray(value)) {
    return value.map(v => formatShadowValue(v)).join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    const ox = value.offsetX || '0px';
    const oy = value.offsetY || '0px';
    const blur = value.blur || '0px';
    const spread = value.spread || '0px';
    const color = value.color || '#000000';
    return `${ox} ${oy} ${blur} ${spread} ${color}`;
  }
  return String(value);
}

/** Normalize fontFamily value to an array for Tailwind compatibility. */
function normalizeFontFamily(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map(s => s.trim());
  return [String(value)];
}

/** Walk tokens and build the Tailwind theme.extend object. */
function buildTailwindExtend(data) {
  const extend = {};
  for (const [tokenPath, , rawValue] of collectTokenPaths(data)) {
    if (!isSafeValue(rawValue)) {
      console.error(`Warning: skipping ${tokenPath} — blocked security pattern`);
      continue;
    }
    const parts = tokenPath.split('.');
    let mapped = false;
    for (const [dtcgPrefix, twKey] of Object.entries(TAILWIND_MAPPING)) {
      const prefixParts = dtcgPrefix.split('.');
      if (parts.slice(0, prefixParts.length).join('.') === dtcgPrefix) {
        const remaining = parts.slice(prefixParts.length);
        let value = rawValue;
        if (twKey === 'boxShadow') value = formatShadowValue(value);
        if (twKey === 'fontFamily') value = normalizeFontFamily(value);
        if (!extend[twKey]) extend[twKey] = {};
        if (remaining.length) {
          setNested(extend[twKey], remaining, value);
        } else {
          extend[twKey] = value;
        }
        mapped = true;
        break;
      }
    }
    // Skip unmapped tokens (typography composites, etc.)
    if (!mapped) continue;
  }
  return extend;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { tokensDir: 'docs/design-system', output: null, contentGlob: './*.html' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tokens-dir' && args[i + 1]) parsed.tokensDir = args[++i];
    else if (args[i] === '--output' && args[i + 1]) parsed.output = args[++i];
    else if (args[i] === '--content-glob' && args[i + 1]) parsed.contentGlob = args[++i];
  }
  if (!parsed.output) {
    console.error('Usage: node tokens-to-tailwind-config.js --tokens-dir <dir> --output <path> [--content-glob <glob>]');
    console.error('  --output is required');
    process.exit(1);
  }
  return parsed;
}

function main() {
  const { tokensDir, output, contentGlob } = parseArgs();
  const tokensFile = path.join(tokensDir, 'tokens.json');
  if (!fs.existsSync(tokensFile)) {
    console.error(`Error: ${tokensFile} not found`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(tokensFile, 'utf-8'));
  } catch (e) {
    console.error(`Error: ${tokensFile} is not valid JSON — ${e.message}`);
    process.exit(1);
  }
  const extend = buildTailwindExtend(data);

  // Detect themes
  const themesDir = path.join(tokensDir, 'themes');
  const hasThemes = fs.existsSync(themesDir) &&
    fs.readdirSync(themesDir).some(f => f.endsWith('.json'));

  const config = { content: [contentGlob], theme: { extend } };
  if (hasThemes) config.darkMode = 'class';

  const configJs = [
    '/** @type {import("tailwindcss").Config} */',
    `module.exports = ${JSON.stringify(config, null, 2)}`,
    '',
  ].join('\n');

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, configJs, 'utf-8');
  console.error(`Generated ${output}`);
}

main();
