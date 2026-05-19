/**
 * v1.58.0 — regression guards for the external QA report fixes.
 *
 * Browser-only files (api.js, mode-page.js, router.js, views) are
 * asserted statically (the project's router.test/openai-model-selector
 * pattern). checkProfileCustomized is importable → exercised directly.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __d = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(resolve(__d, '..', ...p), 'utf8');

test('BUG-003: UI.md() runs inline() on block-quote lines (bold/code/links render)', () => {
  const src = read('public', 'js', 'api.js');
  // the blockquote replacement must map through inline(), not raw text
  assert.match(src, /<blockquote>'\s*\+\s*block\.split\('\\n'\)\.map\(\(l\)\s*=>\s*inline\(l\.replace/);
});

test('BUG-007/008: UI exposes dismissToast; health view dismisses + reuses button label as modal title', () => {
  const api = read('public', 'js', 'api.js');
  assert.match(api, /function dismissToast\(\)/);
  assert.match(api, /return \{ toast, dismissToast, modal,/);
  const health = read('public', 'js', 'views', 'health.js');
  assert.match(health, /UI\.dismissToast\(\);\s*\n\s*UI\.modal\(t\('health\.runDoctor'\)/);
  assert.match(health, /UI\.dismissToast\(\);\s*\n\s*UI\.modal\(t\('health\.verify'\)/);
  assert.ok(!/UI\.modal\('doctor'/.test(health), "modal title must not be the hardcoded lowercase 'doctor'");
});

test('BUG-001: followup lastContact has an ISO-date pattern; validate() enforces spec.pattern', () => {
  const mp = read('public', 'js', 'views', 'mode-page.js');
  const field = mp.match(/name: 'lastContact'[\s\S]{0,800}?patternMsgFallback/);
  assert.ok(field, 'lastContact field missing pattern wiring');
  assert.ok(field[0].includes("patternMsgKey: 'followup.lastErr'"), 'lastContact missing patternMsgKey');
  // the source string literal is `'^\\d{4}-\\d{2}-\\d{2}$'` → two
  // backslash bytes per group; match them literally.
  assert.ok(field[0].includes('\\\\d{4}-\\\\d{2}-\\\\d{2}'), 'lastContact missing ISO-date pattern');
  assert.ok(mp.includes('spec.pattern && val && !new RegExp(spec.pattern).test(val)'),
    'validate() does not enforce spec.pattern');
});

test('BUG-004: router aliases #/outreach → contacto', () => {
  const r = read('public', 'js', 'router.js');
  assert.match(r, /outreach: 'contacto'/);
});

test('BUG-005: pipeline add surfaces server `deduped` as an info toast', () => {
  const p = read('public', 'js', 'views', 'pipeline.js');
  assert.match(p, /r\.deduped\) UI\.toast\(t\('pipe\.dup'/);
});

test('BUG-006: server returns a humanized, sentence-cased invalid-URL message', () => {
  const route = read('server', 'lib', 'routes', 'pipeline.mjs');
  assert.match(route, /That doesn't look like a valid job posting URL/);
  assert.ok(!/error: 'invalid url \(must be http/.test(route), 'old terse message must be gone');
});

test('BUG-010: reports empty state renders a page-subtitle', () => {
  const rep = read('public', 'js', 'views', 'reports.js');
  const empty = rep.match(/reports\.length === 0[\s\S]{0,600}?rep\.empty/);
  assert.ok(empty, 'empty-state block not found');
  assert.ok(empty[0].includes("rep.subtitle") && empty[0].includes('page-subtitle'),
    'empty state still missing the page-subtitle');
});

test('i18n: new QA keys cover all 8 locales', () => {
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  const locales = ['en', 'es', 'pt-BR', 'ko', 'ja', 'ru', 'zh-CN', 'zh-TW'];
  for (const key of ['followup.lastErr', 'pipe.dup', 'rep.subtitle']) {
    const line = dict.split('\n').find((l) => l.includes(`'${key}'`));
    assert.ok(line, `i18n key ${key} missing`);
    for (const loc of locales) {
      const tok = /-/.test(loc) ? `'${loc}':` : `${loc}:`;
      assert.ok(line.includes(tok), `${key} missing locale ${loc}`);
    }
  }
});

test('I18N-012/013: Deep research is localized in Russian (no leftover English)', () => {
  const dict = read('public', 'js', 'lib', 'i18n-dict.js');
  const title = dict.split('\n').find((l) => l.includes("'deep.title'"));
  assert.ok(!/ru: 'Deep research'/.test(title), 'deep.title ru still English');
  const sub = dict.split('\n').find((l) => l.includes("'deep.subtitle'"));
  assert.ok(!/smart questions/.test(sub.split("ru: '")[1].split("'")[0]),
    'deep.subtitle ru still contains untranslated "smart questions"');
});

test('BUG-002/UX-032: store.mjs allow-list flags fixtures + is exact-anchored (no false positives)', () => {
  // Static guard — robust + CI-isolated. checkProfileCustomized()
  // reads PATHS.profile (resolved once per process), so a multi-root
  // behavioural test can't run inside the shared `npm test` process;
  // assert the allow-list contract directly instead.
  const src = read('server', 'lib', 'store.mjs');
  for (const name of ['Acceptance Test', 'Real Person', 'QA', 'Sample User', 'Placeholder', 'Example User', 'Test User?']) {
    assert.ok(src.includes(name), `allow-list must flag "${name}"`);
  }
  assert.match(src, /still on template \/ test fixture/);

  // Pull the exact regex literal and prove it is ^…$-anchored +
  // case-insensitive, so a real name merely *containing* a fixture
  // word (e.g. "María Testanova") can never be false-flagged.
  const m = src.match(/if \(\/\^\((.+?)\)\$\/i\.test\(name\)\)/);
  assert.ok(m, 'allow-list must be a single ^(…)$/i anchored regex');
  const re = new RegExp('^(' + m[1] + ')$', 'i');
  assert.equal(re.test('Acceptance Test'), true);
  assert.equal(re.test('Real Person'), true);
  assert.equal(re.test('María Testanova'), false, 'real name containing "test" must NOT match');
  assert.equal(re.test('Testy McTestface'), false, 'substring "Test" must NOT match the anchored list');
});

// ── v1.58.3 — FIX-C2: <html lang> contract (the QA "stuck on en" was
// a stale-localStorage/pre-redeploy artifact; the code is correct —
// lock it so it can't regress). i18n.js is browser-only → static.
test('FIX-C2: i18n.js sets document.documentElement.lang on setLang AND at boot, detects navigator.language', () => {
  const src = read('public', 'js', 'lib', 'i18n.js');
  // setLang writes the attribute
  assert.match(src, /function setLang\(code\)\s*\{[\s\S]*document\.documentElement\.lang\s*=\s*code/,
    'setLang must set <html lang>');
  // boot sets it from the resolved current locale
  assert.match(src, /document\.documentElement\.lang\s*=\s*current/,
    'boot must set <html lang> from the resolved locale');
  // first-load detection from the browser
  assert.match(src, /navigator\.language/, 'must detect from navigator.language');
  // persisted choice
  assert.match(src, /STORAGE_KEY\s*=\s*'career-ops-ui:lang'/, 'locale persisted to localStorage');
});
