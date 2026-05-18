/**
 * v1.56.0 — UX-9: the #/cv page chrome shouldn't out-shout the CV
 * itself. The page title is demoted to a quiet breadcrumb chip
 * (.cv-breadcrumb) so the user's name (rendered in the preview, as
 * <h2> after the F-V54-A heading-shift) owns the visual hierarchy —
 * while the page keeps EXACTLY ONE <h1> for a11y (F-V54-A lock).
 *
 * cv.js is browser-only → asserted statically.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __d = dirname(fileURLToPath(import.meta.url));
const CV = readFileSync(resolve(__d, '..', 'public', 'js', 'views', 'cv.js'), 'utf8');
const CSS = readFileSync(resolve(__d, '..', 'public', 'css', 'app.css'), 'utf8');

test('the page title is still a single <h1>, now .cv-breadcrumb', () => {
  // Exactly one h1 creation in the view (F-V54-A: the preview md
  // shifts the user\'s own h1→h2, so this must remain the only h1).
  const h1s = [...CV.matchAll(/c\('h1'/g)];
  assert.equal(h1s.length, 1, 'cv.js must create exactly one <h1>');
  assert.match(CV, /c\('h1',\s*\{[\s\S]*?className: 'page-title cv-breadcrumb'/,
    'the h1 must carry the .cv-breadcrumb (still .page-title for the focus target)');
});

test('the loud page-subtitle paragraph is gone from the header', () => {
  // It moved to the h1 title tooltip; no <p class=page-subtitle> with
  // cv.subtitle competing with the preview.
  assert.ok(!/c\('p',\s*\{ className: 'page-subtitle' \}, t\('cv\.subtitle'\)\)/.test(CV),
    'cv.subtitle must not render as a loud page-subtitle paragraph');
  assert.match(CV, /title: t\('cv\.subtitle'\)/, 'cv.subtitle preserved as a tooltip');
});

test('.cv-breadcrumb style exists and is de-emphasized', () => {
  const m = CSS.match(/\.cv-breadcrumb\s*\{[^}]*\}/);
  assert.ok(m, '.cv-breadcrumb rule must exist');
  assert.match(m[0], /font-size:\s*1[0-3]px/, 'breadcrumb must be small');
  assert.match(m[0], /var\(--foggy\)/, 'breadcrumb must be muted');
});
