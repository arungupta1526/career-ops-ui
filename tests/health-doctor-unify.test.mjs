/**
 * FIX-C6 + FIX-H6 — Health checks now mirror what `node doctor.mjs`
 * would report (parent-deps, Playwright, dirs, profile-customized,
 * HH_USER_AGENT). Single source of truth via /api/health, no second
 * read of state via the Doctor button.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

let server;
let baseUrl;
let projectRoot;

before(async () => {
  projectRoot = mkdtempSync(resolve(tmpdir(), 'health-unify-'));
  mkdirSync(resolve(projectRoot, 'config'), { recursive: true });
  mkdirSync(resolve(projectRoot, 'data'), { recursive: true });
  mkdirSync(resolve(projectRoot, 'modes'), { recursive: true });
  writeFileSync(resolve(projectRoot, 'cv.md'), '# placeholder\n');
  writeFileSync(resolve(projectRoot, 'config', 'profile.yml'), 'candidate:\n  full_name: "Jane Smith"\n');
  writeFileSync(resolve(projectRoot, 'portals.yml'), 'tracked_companies: []\n');
  writeFileSync(resolve(projectRoot, 'data', 'applications.md'), '');
  writeFileSync(resolve(projectRoot, 'data', 'pipeline.md'), '# pipeline\n');
  writeFileSync(resolve(projectRoot, 'modes', 'oferta.md'), 'oferta\n');
  process.env.CAREER_OPS_ROOT = projectRoot;
  const { createApp } = await import('../server/index.mjs');
  const app = createApp();
  await new Promise((r) => {
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      r();
    });
  });
});

after(() => {
  delete process.env.CAREER_OPS_ROOT;
  return new Promise((r) => server.close(r));
});

async function getHealth() {
  const res = await fetch(baseUrl + '/api/health');
  return res.json();
}

test('Health: surfaces all the checks Doctor used to expose', async () => {
  const h = await getHealth();
  const names = h.checks.map((c) => c.name);
  // Required for FIX-C6: ≥13 checks (was: 9 — the fix-prompt acceptance bar)
  assert.ok(h.checks.length >= 13, `expected ≥13 checks, got ${h.checks.length}: ${names.join(', ')}`);
  // Critical doctor parity:
  for (const expected of [
    'Profile customized',
    'GEMINI_API_KEY',
    'HH_USER_AGENT',
    'Playwright (parent node_modules)',
    'Parent project dependencies',
    'data/ directory',
    'reports/ directory',
    'output/ directory',
    'jds/ directory',
  ]) {
    assert.ok(names.includes(expected), `missing check "${expected}". got: ${names.join(', ')}`);
  }
});

test('FIX-H6: placeholder "Jane Smith" profile flagged but does NOT flip ok', async () => {
  const h = await getHealth();
  const c = h.checks.find((x) => x.name === 'Profile customized');
  assert.ok(c, 'Profile customized check missing');
  assert.equal(c.ok, false);
  assert.equal(c.required, false, 'kept optional so a half-setup install does not break ok=true semantics');
  assert.match(c.value, /Jane Smith|template/i);
  // Overall ok should still be true since required checks still pass.
  assert.equal(h.ok, true);
  assert.ok(h.warnings >= 1);
});

test('FIX-H6: real name flips Profile customized to ok=true', async () => {
  writeFileSync(resolve(projectRoot, 'config', 'profile.yml'), 'candidate:\n  full_name: "Sergey Emelyanov"\n');
  const h = await getHealth();
  const c = h.checks.find((x) => x.name === 'Profile customized');
  assert.equal(c.ok, true);
  assert.equal(c.value, 'Sergey Emelyanov');
});

test('FIX-H6: empty / missing full_name → ok:false with explicit hint', async () => {
  writeFileSync(resolve(projectRoot, 'config', 'profile.yml'), 'candidate: {}\n');
  let h = await getHealth();
  let c = h.checks.find((x) => x.name === 'Profile customized');
  assert.equal(c.ok, false);
  assert.match(c.value, /full_name/);

  // Garbled YAML → also flagged but with a parse-error message
  writeFileSync(resolve(projectRoot, 'config', 'profile.yml'), '::: not yaml ::: : :');
  h = await getHealth();
  c = h.checks.find((x) => x.name === 'Profile customized');
  assert.equal(c.ok, false);
});
