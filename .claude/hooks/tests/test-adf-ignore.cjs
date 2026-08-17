#!/usr/bin/env node

/**
 * Test script for adf-ignore.txt functionality
 * Tests that scout-block.sh respects config/adf-ignore.txt patterns
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', 'scout-block', 'scout-block.sh');
const adfIgnorePath = path.join(__dirname, '..', '..', 'config', 'adf-ignore.txt');
const adfIgnoreBackupPath = adfIgnorePath + '.backup';

// Backup original adf-ignore.txt if exists
let originalAdfIgnore = null;
if (fs.existsSync(adfIgnorePath)) {
  originalAdfIgnore = fs.readFileSync(adfIgnorePath, 'utf-8');
  fs.copyFileSync(adfIgnorePath, adfIgnoreBackupPath);
}

function runTest(name, input, expected) {
  try {
    const inputJson = JSON.stringify(input);
    execSync(`bash "${scriptPath}"`, {
      input: inputJson,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const actual = 'ALLOWED';
    const success = actual === expected;
    return { name, expected, actual, success };
  } catch (error) {
    const actual = error.status === 2 ? 'BLOCKED' : 'ERROR';
    const success = actual === expected;
    return { name, expected, actual, success, error: error.stderr?.toString().trim() };
  }
}

function writeAdfIgnore(patterns) {
  // Ensure config directory exists
  const configDir = path.dirname(adfIgnorePath);
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(adfIgnorePath, patterns.join('\n') + '\n');
}

function restoreAdfIgnore() {
  if (originalAdfIgnore !== null) {
    fs.writeFileSync(adfIgnorePath, originalAdfIgnore);
    if (fs.existsSync(adfIgnoreBackupPath)) {
      fs.unlinkSync(adfIgnoreBackupPath);
    }
  }
}

console.log('Testing config/adf-ignore.txt functionality...\n');

let passed = 0;
let failed = 0;

// Test 1: Default patterns work (with existing adf-ignore.txt)
console.log('--- Test 1: Default patterns from adf-ignore.txt ---');
let result = runTest(
  'node_modules blocked (default)',
  { tool_name: 'Read', tool_input: { file_path: 'node_modules/pkg.json' } },
  'BLOCKED'
);
if (result.success) {
  console.log(`✓ ${result.name}: ${result.actual}`);
  passed++;
} else {
  console.log(`✗ ${result.name}: expected ${result.expected}, got ${result.actual}`);
  failed++;
}

// Test 2: Custom pattern - only block 'vendor' directory
console.log('\n--- Test 2: Custom adf-ignore.txt with only "vendor" ---');
writeAdfIgnore(['# Custom ignore', 'vendor']);

result = runTest(
  'vendor blocked (custom)',
  { tool_name: 'Read', tool_input: { file_path: 'vendor/lib.js' } },
  'BLOCKED'
);
if (result.success) {
  console.log(`✓ ${result.name}: ${result.actual}`);
  passed++;
} else {
  console.log(`✗ ${result.name}: expected ${result.expected}, got ${result.actual}`);
  failed++;
}

result = runTest(
  'node_modules ALLOWED when not in adf-ignore.txt',
  { tool_name: 'Read', tool_input: { file_path: 'node_modules/pkg.json' } },
  'ALLOWED'
);
if (result.success) {
  console.log(`✓ ${result.name}: ${result.actual}`);
  passed++;
} else {
  console.log(`✗ ${result.name}: expected ${result.expected}, got ${result.actual}`);
  failed++;
}

// Test 3: Multiple custom patterns
console.log('\n--- Test 3: Multiple custom patterns ---');
writeAdfIgnore(['vendor', 'temp', '.cache']);

result = runTest(
  'vendor blocked',
  { tool_name: 'Grep', tool_input: { pattern: 'test', path: 'vendor' } },
  'BLOCKED'
);
if (result.success) {
  console.log(`✓ ${result.name}: ${result.actual}`);
  passed++;
} else {
  console.log(`✗ ${result.name}: expected ${result.expected}, got ${result.actual}`);
  failed++;
}

result = runTest(
  'temp blocked',
  { tool_name: 'Bash', tool_input: { command: 'ls temp/' } },
  'BLOCKED'
);
if (result.success) {
  console.log(`✓ ${result.name}: ${result.actual}`);
  passed++;
} else {
  console.log(`✗ ${result.name}: expected ${result.expected}, got ${result.actual}`);
  failed++;
}

result = runTest(
  '.cache blocked',
  { tool_name: 'Glob', tool_input: { pattern: '.cache/**' } },
  'BLOCKED'
);
if (result.success) {
  console.log(`✓ ${result.name}: ${result.actual}`);
  passed++;
} else {
  console.log(`✗ ${result.name}: expected ${result.expected}, got ${result.actual}`);
  failed++;
}

result = runTest(
  'src still allowed',
  { tool_name: 'Read', tool_input: { file_path: 'src/index.js' } },
  'ALLOWED'
);
if (result.success) {
  console.log(`✓ ${result.name}: ${result.actual}`);
  passed++;
} else {
  console.log(`✗ ${result.name}: expected ${result.expected}, got ${result.actual}`);
  failed++;
}

// Test 4: Comments and empty lines ignored
console.log('\n--- Test 4: Comments and empty lines handled ---');
writeAdfIgnore(['# This is a comment', '', 'blockeddir', '# Another comment', '']);

result = runTest(
  'blockeddir blocked',
  { tool_name: 'Read', tool_input: { file_path: 'blockeddir/file.txt' } },
  'BLOCKED'
);
if (result.success) {
  console.log(`✓ ${result.name}: ${result.actual}`);
  passed++;
} else {
  console.log(`✗ ${result.name}: expected ${result.expected}, got ${result.actual}`);
  failed++;
}

result = runTest(
  'otherdir allowed',
  { tool_name: 'Read', tool_input: { file_path: 'otherdir/file.txt' } },
  'ALLOWED'
);
if (result.success) {
  console.log(`✓ ${result.name}: ${result.actual}`);
  passed++;
} else {
  console.log(`✗ ${result.name}: expected ${result.expected}, got ${result.actual}`);
  failed++;
}

// Restore original adf-ignore.txt
restoreAdfIgnore();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
