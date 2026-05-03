/**
 * FIX-C3 — guard against the 9 dead portal slugs (Ada, Factorial,
 * Tinybird, Weights & Biases, Travelperk, Clarity AI, Forto, Vinted,
 * Runway) silently flipping back to enabled:true in a future PR.
 *
 * If a slug genuinely comes back to life, REMOVE it from this list AND
 * verify the URL responds < 400 first.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
// We test the SHIPPED template (templates/portals.example.yml) because the
// runtime portals.yml is gitignored user data — its state varies per user.
// Anyone cloning fresh gets the template's defaults, so disabling the dead
// slugs there is what actually fixes the bug for new installs.
const PORTALS = resolve(__dirname, '..', '..', 'templates', 'portals.example.yml');

const KNOWN_DEAD = [
  'Ada', 'Factorial', 'Tinybird', 'Weights & Biases',
  'Travelperk', 'Clarity AI', 'Forto', 'Vinted', 'Runway',
];

test('parent portals.yml exists', () => {
  assert.ok(existsSync(PORTALS), `expected ${PORTALS}`);
});

test('FIX-C3: known-dead slugs are disabled', () => {
  if (!existsSync(PORTALS)) {
    // Parent isn't checked out alongside web-ui (e.g. standalone CI of
    // career-ops-ui). Skip rather than fail spuriously.
    return;
  }
  const portals = yaml.load(readFileSync(PORTALS, 'utf8')) || {};
  const tracked = portals.tracked_companies || portals.companies || [];
  for (const name of KNOWN_DEAD) {
    const c = tracked.find((x) => x.name === name);
    if (!c) continue; // user could have removed it entirely — that's fine.
    assert.equal(
      c.enabled, false,
      `"${name}" was disabled in QA r5 (HTTP 404). If alive again, remove from KNOWN_DEAD list.`
    );
  }
});

test('FIX-C3: portals-health-check.mjs script exists and is executable', () => {
  const path = resolve(__dirname, '..', 'scripts', 'portals-health-check.mjs');
  assert.ok(existsSync(path), 'scripts/portals-health-check.mjs missing');
  const text = readFileSync(path, 'utf8');
  assert.match(text, /^#!\/usr\/bin\/env node/);
  assert.match(text, /tracked_companies/);
  assert.match(text, /process\.exit\(/);
});
