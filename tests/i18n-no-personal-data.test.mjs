/**
 * I18N-CL1 (v1.59.12) — the i18n dictionary must never carry the
 * maintainer's personal data. The audit that triggered this test found
 * `training.coursePh` = "AWS Solutions Architect Associate" (the
 * maintainer's own certification target) shipped into the public OSS
 * dictionary across all 8 locales.
 *
 * This is a pure source-text guard: it greps the raw dictionary file
 * for forbidden patterns. Anything that matches fails the build before
 * a personal-data leak can reach a published artifact.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('../public/js/lib/i18n-dict.js', import.meta.url), 'utf8');

const FORBIDDEN = [
  // Vendor cert names that read as a real personal target, not a
  // neutral example. (A generic "Cloud architecture certification" is
  // the approved replacement.)
  /AWS\s+Solutions\s+Architect/i,
  /Azure\s+(?:Architect|Developer|Engineer)\s+Associate/i,
  /Google\s+Cloud\s+(?:Architect|Engineer)\s+Professional/i,
  // Contact details
  /[a-z0-9._%+-]+@(?:gmail|yandex|mail|outlook|proton|protonmail|hotmail)\.[a-z]{2,}/i,
  /linkedin\.com\/in\/[\w-]+/i,
];

test('I18N-CL1: i18n-dict.js carries no maintainer-personal data', () => {
  for (const re of FORBIDDEN) {
    const m = SRC.match(re);
    assert.equal(m, null,
      `Forbidden personal-data pattern ${re} matched: "${m?.[0]}". ` +
      `Replace with a neutral generic example.`);
  }
});

test('I18N-CL1: training.coursePh is the generic cloud-cert placeholder', () => {
  // Positive lock — the approved replacement must be present so a
  // future edit that re-introduces a vendor-specific value is caught
  // by the negative guard above AND this positive assertion.
  assert.match(SRC, /'training\.coursePh':\s*\{\s*en:\s*'Cloud architecture certification'/,
    'training.coursePh[en] must be the generic "Cloud architecture certification"');
});
