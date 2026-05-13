/**
 * server/lib/env-config.mjs — pure-function tests for parse / mask /
 * validate / updateEnvFile. The HTTP wrapper is exercised separately
 * in tests/config-endpoint.test.mjs.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import {
  KNOWN_KEYS, SECRET_KEYS,
  parseEnv, maskSecret, validateConfig, updateEnvFile,
} from '../server/lib/env-config.mjs';

// ────────────────────── parseEnv ──────────────────────

test('parseEnv: KEY=value lines populate the object', () => {
  const out = parseEnv('A=1\nB=hello world\nC="quoted"');
  assert.equal(out.A, '1');
  assert.equal(out.B, 'hello world');
  assert.equal(out.C, 'quoted');
});

test('parseEnv: comments + blanks ignored', () => {
  const out = parseEnv('# top\n\nA=1\n  # indented\n\nB=2\n');
  assert.deepEqual(Object.keys(out).sort(), ['A', 'B']);
});

test('parseEnv: malformed lines skipped', () => {
  const out = parseEnv('NO_EQUALS\n=just-equals\nGOOD=x\n');
  assert.deepEqual(out, { GOOD: 'x' });
});

test('parseEnv: empty input → {}', () => {
  assert.deepEqual(parseEnv(''), {});
  assert.deepEqual(parseEnv(null), {});
});

// ────────────────────── maskSecret ──────────────────────

test('maskSecret: short secrets fully masked', () => {
  assert.equal(maskSecret('abc'), '***');
  assert.equal(maskSecret('12345678'), '********');
});

test('maskSecret: long secrets show first/last 4', () => {
  assert.equal(maskSecret('sk-ant-api03-XXXXXXXXXXXXyyyy'), 'sk-a…yyyy');
});

test('maskSecret: empty / placeholder → null', () => {
  assert.equal(maskSecret(''), null);
  assert.equal(maskSecret(undefined), null);
  assert.equal(maskSecret('your_anthropic_key_here'), null);
});

// ────────────────────── validateConfig ──────────────────────

test('validateConfig: known keys + valid values → ok', () => {
  const r = validateConfig({
    ANTHROPIC_API_KEY: 'sk-ant-api03-' + 'x'.repeat(40),
    GEMINI_MODEL: 'gemini-2.0-flash',
    PORT: '4317',
    HOST: '127.0.0.1',
  });
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, []);
});

test('validateConfig: rejects unknown keys', () => {
  const r = validateConfig({ MALICIOUS: 'x' });
  assert.equal(r.ok, false);
  assert.match(r.errors[0], /not a known/);
});

test('validateConfig: bad ANTHROPIC_API_KEY format', () => {
  const r = validateConfig({ ANTHROPIC_API_KEY: 'not-a-real-key' });
  assert.equal(r.ok, false);
  assert.match(r.errors[0], /sk-ant/);
});

test('validateConfig: PORT must be 1-65535', () => {
  const r = validateConfig({ PORT: 'abc' });
  assert.equal(r.ok, false);
  assert.match(r.errors[0], /PORT/);
});

test('validateConfig: rejects newlines', () => {
  const r = validateConfig({ HH_USER_AGENT: 'line1\nline2' });
  assert.equal(r.ok, false);
});

test('validateConfig: empty values are accepted (means delete the key)', () => {
  const r = validateConfig({ ANTHROPIC_API_KEY: '' });
  assert.equal(r.ok, true);
});

test('validateConfig: rejects oversized values', () => {
  const r = validateConfig({ HH_USER_AGENT: 'x'.repeat(5000) });
  assert.equal(r.ok, false);
});

test('validateConfig: rejects non-object body', () => {
  assert.equal(validateConfig(null).ok, false);
  assert.equal(validateConfig('hi').ok, false);
  assert.equal(validateConfig(42).ok, false);
});

// ────────────────────── updateEnvFile ──────────────────────

test('updateEnvFile: bootstraps a fresh .env', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'envcfg-1-'));
  const path = resolve(dir, '.env');
  updateEnvFile(path, { ANTHROPIC_MODEL: 'claude-opus-4-7' });
  const text = readFileSync(path, 'utf8');
  assert.match(text, /ANTHROPIC_MODEL=claude-opus-4-7/);
  assert.match(text, /added via web-ui/);
});

test('updateEnvFile: rewrites existing key in place + preserves comments', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'envcfg-2-'));
  const path = resolve(dir, '.env');
  writeFileSync(path, [
    '# Top comment',
    'ANTHROPIC_MODEL=claude-sonnet-4-6',
    'GEMINI_API_KEY=keep_me',
    '# trailing',
  ].join('\n') + '\n');
  updateEnvFile(path, { ANTHROPIC_MODEL: 'claude-opus-4-7' });
  const text = readFileSync(path, 'utf8');
  assert.match(text, /^# Top comment/m);
  assert.match(text, /ANTHROPIC_MODEL=claude-opus-4-7/);
  assert.match(text, /GEMINI_API_KEY=keep_me/);
  assert.match(text, /^# trailing/m);
  // Should NOT have appended a duplicate at the bottom.
  const occurrences = (text.match(/ANTHROPIC_MODEL=/g) || []).length;
  assert.equal(occurrences, 1);
});

test('updateEnvFile: empty value deletes the key', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'envcfg-3-'));
  const path = resolve(dir, '.env');
  writeFileSync(path, 'A=1\nB=2\nC=3\n');
  updateEnvFile(path, { B: '' });
  const text = readFileSync(path, 'utf8');
  assert.match(text, /A=1/);
  assert.ok(!/^B=/m.test(text));
  assert.match(text, /C=3/);
});

test('updateEnvFile: values with spaces / quotes get quoted', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'envcfg-4-'));
  const path = resolve(dir, '.env');
  updateEnvFile(path, { HH_USER_AGENT: 'Mozilla/5.0 (Macintosh)' });
  const text = readFileSync(path, 'utf8');
  assert.match(text, /HH_USER_AGENT="Mozilla\/5\.0 \(Macintosh\)"/);
});

// ────────────────────── KNOWN_KEYS / SECRET_KEYS sanity ──────────────────────

test('KNOWN_KEYS includes Anthropic + Gemini + server runtime (v1.19.0 dropped HH_USER_AGENT)', () => {
  for (const k of ['ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'PORT', 'HOST']) {
    assert.ok(KNOWN_KEYS.includes(k), `${k} missing from KNOWN_KEYS`);
  }
  // v1.19.0: HH_USER_AGENT removed from KNOWN_KEYS so the UI doesn't
  // expose it. Power users can still set it via raw `.env`; the
  // server reads from process.env directly in server/lib/sources/hh.mjs.
  assert.ok(!KNOWN_KEYS.includes('HH_USER_AGENT'), 'HH_USER_AGENT should NOT be in KNOWN_KEYS post v1.19.0');
});

test('SECRET_KEYS only contains the actual secrets', () => {
  assert.ok(SECRET_KEYS.has('ANTHROPIC_API_KEY'));
  assert.ok(SECRET_KEYS.has('GEMINI_API_KEY'));
  assert.ok(!SECRET_KEYS.has('HH_USER_AGENT'));
  assert.ok(!SECRET_KEYS.has('PORT'));
  assert.ok(!SECRET_KEYS.has('HOST'));
});
