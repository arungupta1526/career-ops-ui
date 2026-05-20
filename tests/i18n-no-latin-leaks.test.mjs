/**
 * v1.58.37 (NEW-D1) — Catch Latin-only page-title leaks on non-Latin
 * locales.
 *
 * The spirit of the v1.58.18 (I-3) closure was: page H1s must read in
 * the user's language, not English. The same principle applies to any
 * `*.title` key — if the value on a non-Latin locale is pure Latin
 * letters (with no whitelisted proper noun, acronym, or product name),
 * it's a leak.
 *
 * The script-style test parses the consolidated DICT in
 * `public/js/lib/i18n-dict.js` (no JSON import — the file is a JS
 * module so we extract per-key rows with a regex).
 *
 * Whitelisted tokens stay Latin in every locale by design (proper nouns,
 * acronyms, product names). Anything else in `*.title` keys on the 5
 * non-Latin locales is a failure.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __d = dirname(fileURLToPath(import.meta.url));
const DICT = readFileSync(resolve(__d, '..', 'public', 'js', 'lib', 'i18n-dict.js'), 'utf8');

// Tokens that legitimately read as Latin in every locale.
const WHITELIST = new Set([
  'CV', 'API', 'URL', 'JD', 'PDF', 'TSV', 'CSV',
  'LinkedIn', 'OpenAI', 'OpenRouter', 'Anthropic', 'Gemini', 'Qwen', 'GitHub',
  'Pipeline', // — exception: en-locale row, others are tested below
]);

// A "pure Latin" value contains only ASCII letters, digits, spaces,
// and a small set of punctuation. CJK / Cyrillic / Hangul / Hiragana /
// Katakana / Hangeul / non-Latin scripts all fail this test.
const PURE_LATIN = /^[A-Za-z][A-Za-z0-9\s\-/·:.,()&]*$/;

// Locales whose UX expects native (non-Latin) script.
const NON_LATIN_LOCALES = ['ru', 'ko', 'ja', 'zh-CN', 'zh-TW'];

// Parse `'key.path':   { en: '…', es: '…', … }` rows from the DICT and
// return Map<key, Map<locale, value>>.
function parseDict() {
  const map = new Map();
  const rowRe = /^\s*'([\w.-]+)':\s*\{([^}]+)\}/gm;
  let m;
  while ((m = rowRe.exec(DICT)) !== null) {
    const key = m[1];
    const body = m[2];
    const locValues = new Map();
    const localeRe = /(?:'([\w-]+)'|(\w+))\s*:\s*'((?:\\'|[^'])*)'/g;
    let lm;
    while ((lm = localeRe.exec(body)) !== null) {
      const locale = lm[1] || lm[2];
      const value = lm[3].replace(/\\'/g, "'");
      locValues.set(locale, value);
    }
    map.set(key, locValues);
  }
  return map;
}

test('NEW-D1: no Latin-only *.title leaks on ru / ja / ko / zh-CN / zh-TW', () => {
  const dict = parseDict();
  const failures = [];
  for (const [key, locales] of dict.entries()) {
    if (!/\.title$/.test(key)) continue;
    for (const loc of NON_LATIN_LOCALES) {
      const v = locales.get(loc);
      if (!v) continue;
      if (PURE_LATIN.test(v) && !WHITELIST.has(v)) {
        failures.push(`${loc}.${key} = "${v}"`);
      }
    }
  }
  assert.deepEqual(
    failures,
    [],
    'Latin-only *.title leaks found in non-Latin locales:\n  ' + failures.join('\n  '),
  );
});

test('NEW-D1: pipe.title is fully localized on the 3 previously-leaking locales (es / pt-BR / ru)', () => {
  const dict = parseDict();
  const row = dict.get('pipe.title');
  assert.ok(row, 'pipe.title row must exist');
  // RU must be fully Cyrillic — no Latin letters at all.
  assert.match(row.get('ru'), /^[А-Яа-яЁё\s]+$/,
    `pipe.title[ru] must be Cyrillic, got "${row.get('ru')}"`);
  // ES must not be just "Pipeline" — has to add a noun.
  assert.notEqual(row.get('es'), 'Pipeline',
    'pipe.title[es] must contextualize (e.g. "Pipeline de vacantes")');
  assert.match(row.get('es'), /vacant|vaca/i,
    'pipe.title[es] must mention "vacantes"');
  // pt-BR must add Portuguese "vagas".
  assert.notEqual(row.get('pt-BR'), 'Pipeline',
    'pipe.title[pt-BR] must contextualize (e.g. "Pipeline de vagas")');
  assert.match(row.get('pt-BR'), /vaga/i,
    'pipe.title[pt-BR] must mention "vagas"');
});
