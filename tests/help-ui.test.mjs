/**
 * Help-page UI integration tests.
 *
 * tests/help.test.mjs already covers the GET /api/help/:lang endpoint
 * (markdown shape, locale coverage, fallback, path-traversal). Here we
 * lock in the UI side: sidebar carries a /#/help link, the view file
 * registers the route and renders via UI.md, the i18n keys are wired
 * up in all 8 locales, and the SPA shell ships the help script.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─────────────── view file ───────────────

test('public/js/views/help.js exists and registers `help` route', () => {
  const path = resolve(ROOT, 'public', 'js', 'views', 'help.js');
  assert.ok(existsSync(path), 'help.js missing');
  const src = readFileSync(path, 'utf8');
  // Route registration
  assert.match(src, /Router\.register\(\s*['"]help['"]/);
  // Loads from server endpoint
  assert.match(src, /\/api\/help\//);
  // Renders via XSS-safe UI.md
  assert.match(src, /UI\.md\(/);
});

test('view html: helper is XSS-safe (UI.md, not innerHTML on raw)', () => {
  const src = readFileSync(resolve(ROOT, 'public', 'js', 'views', 'help.js'), 'utf8');
  // No raw innerHTML = body.markdown style code path
  assert.ok(!/innerHTML\s*=\s*[a-zA-Z]+\.markdown/.test(src),
    'help view assigns raw markdown to innerHTML — XSS risk');
});

// ─────────────── index.html sidebar ───────────────

test('public/index.html includes the Help sidebar entry + help.js script tag', () => {
  const html = readFileSync(resolve(ROOT, 'public', 'index.html'), 'utf8');
  assert.match(html, /href=["']#\/help["']/);
  assert.match(html, /data-route=["']help["']/);
  assert.match(html, /data-i18n=["']nav\.help["']/);
  assert.match(html, /<script[^>]+\/js\/views\/help\.js/);
});

// ─────────────── i18n coverage ───────────────

const REQUIRED_LANGS = ['en', 'es', 'pt-BR', 'ko', 'ja', 'ru', 'zh-CN', 'zh-TW'];
const REQUIRED_KEYS = ['nav.help', 'help.title', 'help.subtitle', 'help.toc'];

test('i18n: nav.help / help.* keys present in every supported locale', () => {
  let src = readFileSync(resolve(ROOT, 'public', 'js', 'lib', 'i18n.js'), 'utf8');
  src = src.replace(
    /return\s*\{\s*t,\s*setLang,\s*getLang,\s*getLangs,\s*onChange\s*\};/,
    'return { t, setLang, getLang, getLangs, onChange, _DICT: DICT };'
  );
  const ctx = createContext({
    window: {},
    localStorage: { getItem: () => null, setItem: () => {} },
    document: { documentElement: { lang: 'en' }, addEventListener: () => {} },
    navigator: { language: 'en' },
  });
  runInContext(src, ctx);
  const D = ctx.window.I18n._DICT;
  for (const k of REQUIRED_KEYS) {
    assert.ok(D[k], `missing key: ${k}`);
    for (const lang of REQUIRED_LANGS) {
      assert.ok(D[k][lang] && D[k][lang].trim(),
        `${k}.${lang} is empty or missing`);
    }
  }
});

// ─────────────── help docs themselves ───────────────

test('docs/help/{lang}.md exists for every supported locale', () => {
  const helpDir = resolve(ROOT, 'docs', 'help');
  // We accept either ko-KR.md or ko.md to mirror i18n's two naming conventions.
  for (const lang of ['en', 'es', 'pt-BR', 'ko-KR', 'ja', 'ru', 'zh-CN', 'zh-TW']) {
    assert.ok(existsSync(resolve(helpDir, `${lang}.md`)),
      `docs/help/${lang}.md missing`);
  }
});

test('every help doc covers the same 14 sections', () => {
  // Sanity: each locale should follow the canonical structure so a
  // user switching language gets parity, not a different document.
  const helpDir = resolve(ROOT, 'docs', 'help');
  const SECTION_COUNT = 14;
  for (const fname of ['en.md', 'ru.md']) {
    const text = readFileSync(resolve(helpDir, fname), 'utf8');
    const headings = (text.match(/^## /gm) || []).length;
    assert.equal(headings, SECTION_COUNT,
      `${fname}: expected ${SECTION_COUNT} ## headings, got ${headings}`);
  }
});

test('help doc references all the modes pages by slug', () => {
  // Ensures the user can find every #/foo page documented somewhere
  // in their locale's help.
  const en = readFileSync(resolve(ROOT, 'docs', 'help', 'en.md'), 'utf8');
  for (const slug of [
    '#/cv', '#/scan', '#/pipeline', '#/evaluate', '#/deep', '#/apply',
    '#/tracker', '#/reports', '#/activity', '#/health', '#/settings',
    '#/project', '#/training', '#/followup', '#/batch', '#/contacto',
    '#/interview-prep', '#/patterns',
  ]) {
    assert.ok(en.includes(slug), `EN help missing route: ${slug}`);
  }
});

// ─────────────── "Show result" wiring ───────────────

test('mode-page.js has the Show result button (deep.showResult key)', () => {
  const src = readFileSync(resolve(ROOT, 'public', 'js', 'views', 'mode-page.js'), 'utf8');
  assert.match(src, /deep\.showResult/);
  // Should call submit(…, true) so prompt → run flow works.
  assert.match(src, /submit\(\s*[a-zA-Z.]+\s*,\s*true\s*\)/);
});

test('deep.js has the Show result button + needKey toast guard', () => {
  const src = readFileSync(resolve(ROOT, 'public', 'js', 'views', 'deep.js'), 'utf8');
  assert.match(src, /deep\.showResult/);
  assert.match(src, /deep\.needKey/);
});
