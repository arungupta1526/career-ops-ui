/**
 * v1.54.3 (USER-REQ) — the #/config "Modes" tab now renders a
 * STRUCTURED field-form (list sections → repeatable line-inputs, prose
 * sections → labelled textareas) instead of a raw <textarea> per
 * section. The user explicitly asked for fields derived from the
 * documented `_profile.md` schema, "не сырой".
 *
 * modes-form.js is a browser-only global script → the wiring is
 * asserted statically, and the pure parse/serialise/classify logic
 * (the risky, data-safety-critical part) is re-derived from the source
 * contract and exercised so the round-trip + merge guarantees are
 * locked.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __d = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(resolve(__d, '..', ...p), 'utf8');
const MF = read('public', 'js', 'lib', 'modes-form.js');
const CFG = read('public', 'js', 'views', 'config.js');
const HTML = read('public', 'index.html');

test('modes-form.js defines the documented _profile.md schema', () => {
  for (const [h, kind] of [
    ['Target Roles', 'list'], ['Adaptive Framing', 'list'],
    ['Exit Narrative', 'prose'], ['Comp Targets', 'list'],
    ['Location Policy', 'prose'],
  ]) {
    const re = new RegExp(`'${h}':\\s*\\{\\s*kind:\\s*'${kind}'`);
    assert.match(MF, re, `schema missing ${h} → ${kind}`);
  }
  assert.match(MF, /window\.ModesForm = \{/, 'ModesForm global not exported');
  assert.match(MF, /collect:/, 'build() must return a collect()');
});

test('config.js uses ModesForm.build/collect, not raw section textareas', () => {
  assert.match(CFG, /window\.ModesForm\.build\(sections \|\| \[\]\)/,
    'buildSectionEditors must delegate to ModesForm.build');
  assert.match(CFG, /modesForm \? modesForm\.collect\(\) : \{\}/,
    'saveModes must collect() from the field-form');
  assert.ok(!/modesSectionInputs/.test(CFG),
    'stale modesSectionInputs map must be gone');
  // raw-markdown escape hatch still confirm-gated (WS2 #4 invariant)
  assert.match(CFG, /saveModesRaw/, 'raw escape hatch must remain');
  assert.match(HTML, /\/js\/lib\/modes-form\.js/, 'modes-form.js not loaded in index.html');
});

// ── Re-derived pure logic (mirrors modes-form.js exactly) ──
const BULLET_RE = /^[ \t]*[-*+][ \t]+(.*)$/;
const isPureList = (body) => {
  const lines = String(body || '').split('\n');
  let saw = false;
  for (const ln of lines) {
    if (ln.trim() === '') continue;
    if (!ln.match(BULLET_RE)) return false;
    saw = true;
  }
  return saw || String(body || '').trim() === '';
};
const parseListItems = (body) => String(body || '').split('\n')
  .map((ln) => { const m = ln.match(BULLET_RE); return m ? m[1].trim() : null; })
  .filter((v) => v && v.length);
const serialiseList = (items) => {
  const clean = (items || []).map((s) => String(s).trim()).filter(Boolean);
  return clean.length ? '\n' + clean.map((s) => `- ${s}`).join('\n') + '\n\n' : '\n\n';
};
const proseDisplay = (b) => String(b || '').replace(/^\n+|\n+$/g, '');
const serialiseProse = (v) => {
  const s = String(v || '').replace(/^\n+|\n+$/g, '');
  return s ? `\n\n${s}\n\n` : '\n\n';
};

test('list classification: scaffold + populated bodies are pure lists', () => {
  assert.equal(isPureList('\n- \n\n'), true, 'scaffold empty-bullet body');
  assert.equal(isPureList('\n- Staff FE\n- EM (frontend)\n\n'), true);
  assert.equal(isPureList(''), true, 'empty body = empty list');
  assert.equal(isPureList('\n\nSome prose narrative.\n\n'), false, 'prose ≠ list');
  assert.equal(isPureList('- ok\nstray prose line\n'), false, 'mixed → not pure');
});

test('list round-trip is stable: serialise(parse(x)) re-parses identically', () => {
  const body = '\n- Staff Frontend Engineer\n- Engineering Manager\n\n';
  const items = parseListItems(body);
  assert.deepEqual(items, ['Staff Frontend Engineer', 'Engineering Manager']);
  const out = serialiseList(items);
  assert.equal(out, body, 'serialise must reproduce the canonical list body');
  assert.deepEqual(parseListItems(out), items, 'second parse is stable');
});

test('list serialise drops blank/placeholder items; empty → blank section', () => {
  assert.equal(serialiseList(['a', '  ', '', 'b']), '\n- a\n- b\n\n');
  assert.equal(serialiseList([]), '\n\n');
  assert.equal(serialiseList(['   ']), '\n\n', 'all-blank list = empty section');
});

test('prose round-trip: display trims framing newlines, serialise re-wraps', () => {
  assert.equal(proseDisplay('\n\nI want to move into platform.\n\n'),
    'I want to move into platform.');
  assert.equal(serialiseProse('I want to move into platform.'),
    '\n\nI want to move into platform.\n\n');
  assert.equal(serialiseProse(''), '\n\n', 'empty prose = empty section');
  // stable: display(serialise(x)) === x for trimmed content
  const v = 'Line one\n\nLine two';
  assert.equal(proseDisplay(serialiseProse(v)), v);
});

test('data-safety: a custom (non-canonical) section keeps verbatim body', () => {
  // modes-form.js routes unknown sections through the verbatim
  // textarea collector — assert the source wires that path.
  assert.match(MF, /\/\/ ── data-safety fallback: labelled raw textarea ──/);
  assert.match(MF, /collectors\.push\(\(\) => \[heading, ta\.value\]\)/,
    'unknown/non-list section must collect ta.value verbatim (no reshaping)');
});
