/**
 * Regression guard for the career-ops.org/docs integration shipped in
 * v1.11.0 / v1.11.1 / v1.11.2. The integration is doc-only and the
 * existing test suite didn't notice if a sed/edit later wiped the
 * canonical URLs from a bundle. These tests close that gap.
 *
 * Three asserts:
 *   1. Every help bundle (8 locales) references all 5 canonical guides.
 *   2. Every README (8 locales) references the canonical career-ops.org
 *      front page + at least 3 of the 5 sub-guides.
 *   3. The #/reports view source contains the score-thresholds card
 *      (rep.thresholdsTitle key) and an outbound link to one of the
 *      canonical guides.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const CANONICAL_URLS = [
  'https://career-ops.org/docs/introduction/what-is-career-ops',
  'https://career-ops.org/docs/introduction/guides/scan-job-portals',
  'https://career-ops.org/docs/introduction/guides/apply-for-a-job',
  'https://career-ops.org/docs/introduction/guides/batch-evaluate-offers',
  'https://career-ops.org/docs/introduction/guides/set-up-playwright',
];

const HELP_BUNDLES = ['en', 'es', 'pt-BR', 'ko-KR', 'ja', 'ru', 'zh-CN', 'zh-TW'];
const README_FILES = [
  'README.md', 'README.es.md', 'README.pt-BR.md', 'README.ko-KR.md',
  'README.ja.md', 'README.ru.md', 'README.zh-CN.md', 'README.zh-TW.md',
];

test('every help bundle references all 5 canonical career-ops.org guides', () => {
  for (const lang of HELP_BUNDLES) {
    const path = resolve(ROOT, 'docs', 'help', `${lang}.md`);
    const text = readFileSync(path, 'utf8');
    for (const url of CANONICAL_URLS) {
      assert.ok(
        text.includes(url),
        `docs/help/${lang}.md missing canonical URL: ${url}`,
      );
    }
  }
});

test('every help bundle keeps the 16-H2 parity contract', () => {
  // Belt-and-suspenders next to tests/help-ui.test.mjs::section-parity.
  // If a future edit splits a section we want the regression here too.
  let baseline = null;
  for (const lang of HELP_BUNDLES) {
    const path = resolve(ROOT, 'docs', 'help', `${lang}.md`);
    const lines = readFileSync(path, 'utf8').split('\n');
    const h2 = lines.filter((l) => l.startsWith('## ')).length;
    if (baseline === null) baseline = h2;
    assert.equal(h2, baseline, `${lang}.md has ${h2} H2 sections, expected ${baseline}`);
  }
  assert.equal(baseline, 16, `expected 16 H2 sections in every bundle, got ${baseline}`);
});

test('every README references the canonical front page + ≥3 sub-guides', () => {
  for (const name of README_FILES) {
    const text = readFileSync(resolve(ROOT, name), 'utf8');
    assert.ok(
      text.includes('https://career-ops.org/docs'),
      `${name} missing https://career-ops.org/docs reference`,
    );
    const subGuideHits = CANONICAL_URLS.slice(1).filter((u) => text.includes(u)).length;
    assert.ok(
      subGuideHits >= 3,
      `${name} references ${subGuideHits} sub-guide(s); expected ≥ 3`,
    );
  }
});

test('#/reports view source contains the score-thresholds card scaffold', () => {
  const view = readFileSync(resolve(ROOT, 'public', 'js', 'views', 'reports.js'), 'utf8');
  assert.match(view, /rep\.thresholdsTitle/, 'reports.js must reference rep.thresholdsTitle i18n key');
  assert.match(view, /career-ops\.org\/docs/, 'reports.js must link out to career-ops.org/docs');
  // Each of the four rubric rows must be present so the table can't be silently truncated.
  for (const key of ['rep.thr45', 'rep.thr40', 'rep.thr35', 'rep.thrLow']) {
    assert.ok(view.includes(key), `reports.js missing i18n key ${key}`);
  }
});

test('i18n bundle includes every new key from v1.11.x with all 8 locales', () => {
  const i18n = readFileSync(resolve(ROOT, 'public', 'js', 'lib', 'i18n.js'), 'utf8');
  const NEW_KEYS = [
    'rep.thresholdsTitle', 'rep.thrAction', 'rep.thr45', 'rep.thr40',
    'rep.thr35', 'rep.thrLow', 'rep.thresholdsSource',
    'apply.playwrightHint', 'apply.docsLink', 'common.generatePdf',
  ];
  // For each key, every locale code MUST appear in the same logical line block.
  // The bundle has one key per line, so a substring match against the key + locale
  // is a sufficient regression check (catches accidental locale-drop).
  const LOCALES = ['en:', 'es:', "'pt-BR':", 'ko:', 'ja:', 'ru:', "'zh-CN':", "'zh-TW':"];
  const lines = i18n.split('\n');
  for (const key of NEW_KEYS) {
    const idx = lines.findIndex((l) => l.includes(`'${key}'`));
    assert.notStrictEqual(idx, -1, `i18n.js missing key ${key}`);
    const line = lines[idx];
    for (const lc of LOCALES) {
      assert.ok(line.includes(lc), `i18n.js key ${key} missing locale ${lc.replace(/['":]/g, '')}`);
    }
  }
});
