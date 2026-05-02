/**
 * FIX-L2 — security headers (CSP, X-Content-Type-Options, X-Frame-Options,
 * Referrer-Policy).
 *
 * Baseline headers (nosniff / frame-deny / referrer-policy) are sent on every
 * response. CSP is sent only when the server binds beyond loopback
 * (HOST !== 127.0.0.1 / ::1 / localhost) — that's the threat model where a
 * LAN attacker could reach the server, so XSS exfiltration becomes possible.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

let createApp;

before(async () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'sec-headers-'));
  mkdirSync(resolve(dir, 'config'), { recursive: true });
  mkdirSync(resolve(dir, 'data'), { recursive: true });
  mkdirSync(resolve(dir, 'modes'), { recursive: true });
  writeFileSync(resolve(dir, 'cv.md'), '# placeholder\n');
  writeFileSync(resolve(dir, 'config', 'profile.yml'), 'candidate:\n  full_name: Test\n');
  writeFileSync(resolve(dir, 'portals.yml'), 'tracked_companies: []\n');
  writeFileSync(resolve(dir, 'data', 'applications.md'), '');
  writeFileSync(resolve(dir, 'data', 'pipeline.md'), '# pipeline\n');
  writeFileSync(resolve(dir, 'modes', 'oferta.md'), 'oferta\n');
  process.env.CAREER_OPS_ROOT = dir;
  ({ createApp } = await import('../server/index.mjs'));
});

after(() => {
  delete process.env.CAREER_OPS_ROOT;
  delete process.env.HOST;
});

async function bootAndGet(host, path) {
  process.env.HOST = host;
  const app = createApp();
  const server = await new Promise((r) => {
    const s = app.listen(0, '127.0.0.1', () => r(s));
  });
  try {
    const port = server.address().port;
    const res = await fetch(`http://127.0.0.1:${port}${path}`);
    await res.text();
    return Object.fromEntries(res.headers);
  } finally {
    await new Promise((r) => server.close(r));
  }
}

// ───────────────────────── baseline (always on) ─────────────────────────

test('baseline headers present on /', async () => {
  const h = await bootAndGet('127.0.0.1', '/');
  assert.equal(h['x-content-type-options'], 'nosniff');
  assert.equal(h['x-frame-options'], 'DENY');
  assert.equal(h['referrer-policy'], 'same-origin');
});

test('baseline headers present on /api/health', async () => {
  const h = await bootAndGet('127.0.0.1', '/api/health');
  assert.equal(h['x-content-type-options'], 'nosniff');
  assert.equal(h['x-frame-options'], 'DENY');
  assert.equal(h['referrer-policy'], 'same-origin');
});

// ───────────────────────── CSP gating by HOST ─────────────────────────

test('CSP NOT sent on loopback (HOST=127.0.0.1)', async () => {
  const h = await bootAndGet('127.0.0.1', '/');
  assert.equal(h['content-security-policy'], undefined);
});

test('CSP NOT sent on ::1', async () => {
  const h = await bootAndGet('::1', '/');
  assert.equal(h['content-security-policy'], undefined);
});

test('CSP NOT sent when HOST=localhost', async () => {
  const h = await bootAndGet('localhost', '/');
  assert.equal(h['content-security-policy'], undefined);
});

test('CSP IS sent when HOST=0.0.0.0 (LAN-exposed)', async () => {
  const h = await bootAndGet('0.0.0.0', '/');
  const csp = h['content-security-policy'];
  assert.ok(csp, 'expected Content-Security-Policy header');
  // Critical directives that block XSS exfiltration / inline-script execution:
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self'/);
  assert.match(csp, /connect-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  // Must NOT allow 'unsafe-inline' for scripts (that would defeat the purpose):
  assert.ok(!/script-src[^;]*unsafe-inline/.test(csp), 'script-src must not allow unsafe-inline');
  // BUT must allow Google Fonts (used by the SPA):
  assert.match(csp, /style-src[^;]*fonts\.googleapis\.com/);
  assert.match(csp, /font-src[^;]*fonts\.gstatic\.com/);
});

test('CSP also sent on JSON endpoints when LAN-exposed', async () => {
  const h = await bootAndGet('0.0.0.0', '/api/health');
  assert.ok(h['content-security-policy']);
});

test('CSP sent for any non-loopback HOST', async () => {
  const h = await bootAndGet('192.168.1.42', '/');
  assert.ok(h['content-security-policy']);
});
