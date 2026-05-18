/**
 * v1.54.2 (USER-REQ) — #/config lacked an OpenAI/Codex model selector
 * (only ANTHROPIC_MODEL + GEMINI_MODEL had dropdowns). OPENAI_MODEL is
 * now a first-class env key (core group, NOT secret — it's a model id,
 * not a credential) with a curated select in config.js, mirroring the
 * Anthropic/Gemini model fields. config.js is browser-only → asserted
 * statically (router.test.mjs style); env-config is importable so its
 * contract is exercised directly.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { KNOWN_KEYS, KEY_GROUPS, SECRET_KEYS } from '../server/lib/env-config.mjs';

const __d = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(resolve(__d, '..', ...p), 'utf8');

test('env-config exposes OPENAI_MODEL as a core, non-secret key', () => {
  assert.ok(KNOWN_KEYS.includes('OPENAI_MODEL'), 'KNOWN_KEYS missing OPENAI_MODEL');
  // ordered right after the OpenAI key so a bootstrapped .env keeps them together
  assert.equal(
    KNOWN_KEYS.indexOf('OPENAI_MODEL'), KNOWN_KEYS.indexOf('OPENAI_API_KEY') + 1,
    'OPENAI_MODEL must follow OPENAI_API_KEY in KNOWN_KEYS');
  assert.equal(KEY_GROUPS.OPENAI_MODEL, 'core', 'OPENAI_MODEL must be in the core group');
  assert.ok(!SECRET_KEYS.has('OPENAI_MODEL'),
    'OPENAI_MODEL is a model id, not a credential — must NOT be masked');
  // the credential itself stays secret
  assert.ok(SECRET_KEYS.has('OPENAI_API_KEY'));
});

test('config.js defines an OPENAI_MODELS list defaulting to gpt-5-codex', () => {
  const src = read('public', 'js', 'views', 'config.js');
  assert.match(src, /const OPENAI_MODELS = \[/, 'OPENAI_MODELS list missing');
  // first entry is the default; gpt-5-codex is the Codex CLI default
  const list = src.match(/const OPENAI_MODELS = \[([\s\S]*?)\]/)[1];
  const first = list.split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean)[0];
  assert.equal(first, 'gpt-5-codex', `OPENAI_MODELS[0] should be gpt-5-codex, got ${first}`);
});

test('config.js wires an OPENAI_MODEL select FIELD after OPENAI_API_KEY', () => {
  const src = read('public', 'js', 'views', 'config.js');
  // Tokenized substring set (not a single whitespace-pinned regex) so a
  // reformat / trailing-comma change can't break the test without the
  // field contract actually changing.
  for (const tok of [
    "key: 'OPENAI_MODEL'", 'secret: false', "kind: 'select'",
    'options: OPENAI_MODELS', "defaultValue: 'gpt-5-codex'",
    "labelKey: 'config.openaiModel'",
  ]) {
    assert.ok(src.includes(tok), `OPENAI_MODEL field missing token: ${tok}`);
  }
  // appears after the OPENAI_API_KEY field, before the HH_USER_AGENT comment
  const iKey = src.indexOf("key: 'OPENAI_API_KEY'");
  const iModel = src.indexOf("key: 'OPENAI_MODEL'");
  assert.ok(iKey > 0 && iModel > iKey, 'OPENAI_MODEL field must follow OPENAI_API_KEY field');
});

test('i18n: config.openaiModel + config.openaiModelHint cover all 8 locales', () => {
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  const locales = ['en', 'es', 'pt-BR', 'ko', 'ja', 'ru', 'zh-CN', 'zh-TW'];
  for (const key of ['config.openaiModel', 'config.openaiModelHint']) {
    const line = dict.split('\n').find((l) => l.includes(`'${key}'`));
    assert.ok(line, `i18n key ${key} missing`);
    for (const loc of locales) {
      const tok = /-/.test(loc) ? `'${loc}':` : `${loc}:`;
      assert.ok(line.includes(tok), `${key} missing locale ${loc}`);
    }
  }
});
