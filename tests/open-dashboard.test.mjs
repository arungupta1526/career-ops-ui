/**
 * v1.43.0 (user-requested) — `career-ops-ui open` / autostart browser
 * raise. Pure helpers (dashboardUrl, openAndRaise platform routing) are
 * unit-tested without launching a real browser; the dispatcher + start.sh
 * wiring is asserted statically (no spawn, CI-isolated).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { dashboardUrl, openAndRaise, waitForHealth } from '../scripts/open-dashboard.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const R = (...p) => resolve(__dirname, '..', ...p);

test('dashboardUrl: defaults to 127.0.0.1:4317', () => {
  assert.equal(dashboardUrl({}), 'http://127.0.0.1:4317/');
});

test('dashboardUrl: honors PORT', () => {
  assert.equal(dashboardUrl({ PORT: '8080' }), 'http://127.0.0.1:8080/');
});

test('dashboardUrl: 0.0.0.0 bind → 127.0.0.1 for the browser', () => {
  // The server may bind 0.0.0.0 (LAN) but a browser cannot open that —
  // it must be rewritten to loopback.
  assert.equal(dashboardUrl({ HOST: '0.0.0.0', PORT: '4317' }), 'http://127.0.0.1:4317/');
});

test('dashboardUrl: explicit HOST is preserved', () => {
  assert.equal(dashboardUrl({ HOST: '192.168.1.50', PORT: '4317' }), 'http://192.168.1.50:4317/');
});

test('openAndRaise: returns the platform key it routed through', async () => {
  // spawn() targets (open/osascript/xdg-open) are absent or no-op in CI;
  // we only assert the platform branch selection, not real activation.
  assert.equal(await openAndRaise('http://127.0.0.1:4317/', 'darwin'), 'darwin');
  assert.equal(await openAndRaise('http://127.0.0.1:4317/', 'win32'), 'win32');
  assert.equal(await openAndRaise('http://127.0.0.1:4317/', 'linux'), 'linux');
});

test('waitForHealth: returns false fast against a dead port (bounded)', async () => {
  const t0 = Date.now();
  const ok = await waitForHealth('http://127.0.0.1:59999/', { timeoutMs: 800, stepMs: 200 });
  assert.equal(ok, false);
  assert.ok(Date.now() - t0 < 4000, 'must respect the timeout bound');
});

test('dispatcher: open/dash/focus verbs route to open-dashboard.mjs', () => {
  const sh = readFileSync(R('bin', 'career-ops-ui.sh'), 'utf8');
  assert.match(sh, /open\|dash\|focus\)/);
  assert.match(sh, /scripts\/open-dashboard\.mjs/);
  assert.match(sh, /career-ops-ui open\s+\S+ open \+ RAISE/);
});

test('start.sh: autostart delegates to open-dashboard.mjs + honors NO_OPEN', () => {
  const sh = readFileSync(R('bin', 'start.sh'), 'utf8');
  assert.match(sh, /scripts\/open-dashboard\.mjs/);
  assert.match(sh, /NO_OPEN/);
  // The old bare-open path must be gone (no silent background tab).
  assert.ok(!/open "\$URL" 2>\/dev\/null/.test(sh), 'start.sh still uses bare `open $URL`');
});
