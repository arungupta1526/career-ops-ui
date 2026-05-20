/**
 * NEW-F1 (v1.59.5) — every unknown `/api/*` path must return a JSON 404,
 * regardless of HTTP verb. Pre-fix `app.get('/api/*', …)` was GET-only,
 * so POST/PUT/DELETE on unknown api paths fell through to the SPA
 * catch-all and returned HTML 404 — breaking the SPA's
 * `try { res.json() } catch {}` clients.
 *
 * Boots the real app via `createApp` against an isolated CAREER_OPS_ROOT
 * (same scaffolding as asset-cache-control.test.mjs).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

let createApp;

before(async () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'api-404-json-'));
  mkdirSync(resolve(dir, 'config'), { recursive: true });
  mkdirSync(resolve(dir, 'data'), { recursive: true });
  mkdirSync(resolve(dir, 'modes'), { recursive: true });
  writeFileSync(resolve(dir, 'cv.md'), '# placeholder\n');
  writeFileSync(resolve(dir, 'config', 'profile.yml'), 'candidate:\n  full_name: Test\n');
  writeFileSync(resolve(dir, 'portals.yml'), 'tracked_companies: []\n');
  writeFileSync(resolve(dir, 'data', 'applications.md'), '');
  writeFileSync(resolve(dir, 'data', 'pipeline.md'), '# pipeline\n');
  process.env.CAREER_OPS_ROOT = dir;
  ({ createApp } = await import('../server/index.mjs'));
});

after(() => { delete process.env.CAREER_OPS_ROOT; });

async function probe(method, path, body) {
  const app = createApp();
  const server = await new Promise((r) => {
    const s = app.listen(0, '127.0.0.1', () => r(s));
  });
  try {
    const port = server.address().port;
    const opts = { method, redirect: 'manual' };
    if (body !== undefined) {
      opts.headers = { 'content-type': 'application/json' };
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(`http://127.0.0.1:${port}${path}`, opts);
    const ct = res.headers.get('content-type') || '';
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not JSON */ }
    return { status: res.status, ct, json, text };
  } finally {
    await new Promise((r) => server.close(r));
  }
}

test('NEW-F1: GET /api/<unknown> returns 404 JSON {error}', async () => {
  const r = await probe('GET', '/api/no-such-endpoint');
  assert.equal(r.status, 404, 'GET unknown api must 404');
  assert.ok(r.ct.includes('application/json'), `expected JSON, got ${r.ct}`);
  assert.equal(r.json?.error, 'unknown api');
});

test('NEW-F1: POST /api/<unknown> returns 404 JSON {error} (was HTML pre-fix)', async () => {
  const r = await probe('POST', '/api/no-such-endpoint', { hello: 'world' });
  assert.equal(r.status, 404, 'POST unknown api must 404 JSON, not fall through to SPA');
  assert.ok(r.ct.includes('application/json'),
    `POST 404 must be JSON, got ${r.ct} (HTML fallthrough = NEW-F1 regression)`);
  assert.equal(r.json?.error, 'unknown api');
});

test('NEW-F1: PUT /api/<unknown> returns 404 JSON {error}', async () => {
  const r = await probe('PUT', '/api/no-such-endpoint', { hello: 'world' });
  assert.equal(r.status, 404);
  assert.ok(r.ct.includes('application/json'), `PUT 404 must be JSON, got ${r.ct}`);
  assert.equal(r.json?.error, 'unknown api');
});

test('NEW-F1: DELETE /api/<unknown> returns 404 JSON {error}', async () => {
  const r = await probe('DELETE', '/api/no-such-endpoint');
  assert.equal(r.status, 404);
  assert.ok(r.ct.includes('application/json'), `DELETE 404 must be JSON, got ${r.ct}`);
  assert.equal(r.json?.error, 'unknown api');
});

test('NEW-D3-cache (v1.59.7): GET /api/cv responds with Cache-Control: no-store', async () => {
  const r = await probe('GET', '/api/cv');
  assert.equal(r.status, 200, 'GET /api/cv must 200 (cv.md scaffolded in fixture)');
  // Pull cache-control from a fresh probe — `probe()` only returns
  // status/ct/json/text, so do an inline fetch with header capture.
  const app = createApp();
  const server = await new Promise((res) => {
    const s = app.listen(0, '127.0.0.1', () => res(s));
  });
  try {
    const port = server.address().port;
    const res = await fetch(`http://127.0.0.1:${port}/api/cv`, { redirect: 'manual' });
    await res.text();
    const cc = res.headers.get('cache-control');
    assert.equal(cc, 'no-store', `Cache-Control must be no-store, got ${cc}`);
  } finally {
    await new Promise((res) => server.close(res));
  }
});

test('NEW-F1: an unknown :name under a real handler is JSON 404 (not HTML fallthrough)', async () => {
  // The /api/jds/:name handler matches and runs its own 404 for an
  // unknown file (`{error: 'not found'}`) — that's also a valid JSON
  // 404 contract. The point of this test is to assert no HTML
  // fallthrough on a path that COULD have been misrouted.
  const r = await probe('GET', '/api/jds/non-existent-traversal-file');
  assert.equal(r.status, 404);
  assert.ok(r.ct.includes('application/json'), 'unknown :name path must JSON 404');
  assert.ok(typeof r.json?.error === 'string',
    `response body must have a string error field, got ${JSON.stringify(r.json)}`);
});
