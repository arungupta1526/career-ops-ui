/**
 * F-013 — /api/config exposes `groups` + `regionalActive` so the SPA
 * can render HH_USER_AGENT under a "Regional sources" collapse.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

let server;
let baseUrl;
let dir;

before(async () => {
  dir = mkdtempSync(resolve(tmpdir(), 'cfg-groups-'));
  mkdirSync(resolve(dir, 'config'), { recursive: true });
  mkdirSync(resolve(dir, 'data'), { recursive: true });
  mkdirSync(resolve(dir, 'modes'), { recursive: true });
  writeFileSync(resolve(dir, 'cv.md'), '# x\n');
  writeFileSync(resolve(dir, 'config', 'profile.yml'), 'candidate:\n  full_name: T\n');
  // Pre-seed russian_portals block as disabled with empty sources so
  // ensureRussianPortalsDefaults() leaves it alone (it auto-bootstraps
  // a non-empty block when russian_portals: is missing, which would
  // make regionalActive=true).
  writeFileSync(resolve(dir, 'portals.yml'),
    'tracked_companies: []\n' +
    'russian_portals:\n' +
    '  enabled: false\n' +
    '  sources: []\n');
  writeFileSync(resolve(dir, 'data', 'applications.md'), '');
  writeFileSync(resolve(dir, 'data', 'pipeline.md'), '# pipeline\n');
  writeFileSync(resolve(dir, 'modes', 'oferta.md'), 'oferta\n');
  process.env.CAREER_OPS_ROOT = dir;
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

test('F-013: /api/config returns groups + regionalActive', async () => {
  const r = await fetch(baseUrl + '/api/config').then((r) => r.json());
  assert.ok(r.groups, 'groups must be in payload');
  assert.equal(r.groups.ANTHROPIC_API_KEY, 'core');
  assert.equal(r.groups.HH_USER_AGENT, 'regional');
  assert.equal(r.groups.PORT, 'runtime');
  // No regional source in fixture → regionalActive false.
  assert.equal(r.regionalActive, false);
});

test('F-013: regionalActive flips true when portals.yml declares regional sources', async () => {
  writeFileSync(resolve(dir, 'portals.yml'),
    'tracked_companies: []\n' +
    'russian_portals:\n' +
    '  enabled: true\n' +
    '  sources:\n' +
    '    - hh.ru\n');
  const r = await fetch(baseUrl + '/api/config').then((r) => r.json());
  assert.equal(r.regionalActive, true);
});
