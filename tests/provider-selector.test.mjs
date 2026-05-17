/**
 * WS8.2 (v1.39.0) — LLM_PROVIDER selector + init wizard.
 * providerOrder is the contract the 6 llm.mjs gate-sites consult;
 * buildUpdates/parseArgs back the `career-ops-ui init` wizard.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { providerOrder, LLM_PROVIDERS, KNOWN_KEYS, SECRET_KEYS } from '../server/lib/env-config.mjs';
import { parseArgs, buildUpdates, askSecret } from '../scripts/init.mjs';

test('providerOrder: auto/unset/unknown → [anthropic, gemini] (legacy)', () => {
  assert.deepEqual(providerOrder({}), ['anthropic', 'gemini']);
  assert.deepEqual(providerOrder({ LLM_PROVIDER: 'auto' }), ['anthropic', 'gemini']);
  assert.deepEqual(providerOrder({ LLM_PROVIDER: 'banana' }), ['anthropic', 'gemini']);
  assert.deepEqual(providerOrder({ LLM_PROVIDER: ' AUTO ' }), ['anthropic', 'gemini']);
});

test('providerOrder: claude → [anthropic] only; gemini → [gemini] only', () => {
  assert.deepEqual(providerOrder({ LLM_PROVIDER: 'claude' }), ['anthropic']);
  assert.deepEqual(providerOrder({ LLM_PROVIDER: 'Gemini' }), ['gemini']);
});

test('env-config exposes the new provider surface', () => {
  for (const k of ['LLM_PROVIDER', 'OPENAI_API_KEY']) {
    assert.ok(KNOWN_KEYS.includes(k), `KNOWN_KEYS missing ${k}`);
  }
  assert.ok(SECRET_KEYS.has('OPENAI_API_KEY'), 'OPENAI_API_KEY must be secret');
  assert.ok(!SECRET_KEYS.has('LLM_PROVIDER'), 'LLM_PROVIDER is not a secret');
  assert.deepEqual(LLM_PROVIDERS, ['auto', 'claude', 'gemini']);
});

test('init parseArgs: flag-driven', () => {
  const o = parseArgs(['--provider', 'CLAUDE', '--anthropic-key', 'sk-x', '--yes']);
  assert.equal(o.provider, 'claude');
  assert.equal(o.anthropic, 'sk-x');
  assert.equal(o.yes, true);
});

test('init askSecret: off a TTY, delegates to plain ask (no raw mode)', async () => {
  const realIsTTY = process.stdin.isTTY;
  Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
  try {
    let asked = '';
    const fakeRl = { question: (q, cb) => { asked = q; cb('  piped-key  '); } };
    const v = await askSecret(fakeRl, 'OPENAI_API_KEY: ');
    assert.equal(asked, 'OPENAI_API_KEY: ');
    assert.equal(v, 'piped-key'); // trimmed, same contract as ask()
  } finally {
    Object.defineProperty(process.stdin, 'isTTY', { value: realIsTTY, configurable: true });
  }
});

test('init buildUpdates: provider clamped, only non-empty keys written', () => {
  assert.deepEqual(
    buildUpdates({ provider: 'gemini', gemini: ' g-key ', anthropic: '', openai: '' }),
    { LLM_PROVIDER: 'gemini', GEMINI_API_KEY: 'g-key' });
  assert.deepEqual(
    buildUpdates({ provider: 'nonsense', anthropic: 'a', openai: 'o' }),
    { LLM_PROVIDER: 'auto', ANTHROPIC_API_KEY: 'a', OPENAI_API_KEY: 'o' });
});

test('init buildUpdates: no keys → only LLM_PROVIDER (auto)', () => {
  assert.deepEqual(buildUpdates({ provider: '' }), { LLM_PROVIDER: 'auto' });
});

test('llm.mjs gates all 6 provider sites with _provGate()', () => {
  const src = require_src();
  const hits = (src.match(/_provGate\(\)\.want(Anthropic|Gemini) && has(Anthropic|Gemini)Key\(\)/g) || []);
  assert.equal(hits.length, 6, `expected 6 gated sites, got ${hits.length}`);
});
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
function require_src() {
  const d = dirname(fileURLToPath(import.meta.url));
  return readFileSync(resolve(d, '..', 'server', 'lib', 'routes', 'llm.mjs'), 'utf8');
}
