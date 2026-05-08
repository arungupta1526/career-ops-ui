/**
 * GET /api/pipeline/preview — server-side proxy for the /#/pipeline
 * preview pane. Strips scripts/styles/tags, caps body at 8 KB, gates
 * inputs with isValidJobUrl() so SSRF surface mirrors the existing
 * POST /api/pipeline contract.
 *
 * Mocks `globalThis.fetch` instead of binding a real HTTP upstream so
 * the test is portable across macOS / Linux / CI without needing a
 * 127.0.0.2 loopback alias.
 */
import { test, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

let server, baseUrl;
let originalFetch;
let upstreamHandler = null;

before(async () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'pipe-preview-'));
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

  const { createApp } = await import('../server/index.mjs');
  const app = createApp();
  await new Promise((r) => {
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      r();
    });
  });
  originalFetch = globalThis.fetch;
});

after(() => {
  globalThis.fetch = originalFetch;
  delete process.env.CAREER_OPS_ROOT;
  return new Promise((r) => server.close(r));
});

beforeEach(() => {
  // Default upstream: returns a tiny HTML page. Tests can override
  // upstreamHandler before issuing the GET. Calls into 127.0.0.1 (the
  // server-under-test itself) bypass the mock so /api/* still works.
  globalThis.fetch = async (url, opts) => {
    const u = String(url);
    if (u.startsWith(baseUrl)) return originalFetch(url, opts);
    if (upstreamHandler) return upstreamHandler(url, opts);
    return new Response('<html><body><h1>OK</h1></body></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
  };
});

afterEach(() => {
  upstreamHandler = null;
});

async function get(path) {
  const r = await fetch(baseUrl + path);
  return { status: r.status, body: await r.json() };
}

const SAMPLE = 'https://jobs.example.com/posting/abc-123';

// ───────────────────────── happy path ─────────────────────────

test('GET /api/pipeline/preview strips scripts + styles + tags', async () => {
  upstreamHandler = async () => new Response(
    '<html><head><title>Hi</title></head><body><h1>Job Posting</h1>'
    + '<p>Senior Engineer, full-time, remote.</p>'
    + '<script>console.log("noise")</script><style>body{color:red}</style>'
    + '</body></html>',
    { status: 200, headers: { 'content-type': 'text/html' } }
  );
  const r = await get('/api/pipeline/preview?url=' + encodeURIComponent(SAMPLE));
  assert.equal(r.status, 200);
  assert.equal(r.body.status, 200);
  assert.match(r.body.text, /Job Posting/);
  assert.match(r.body.text, /Senior Engineer/);
  assert.ok(!/console\.log/.test(r.body.text), 'script content leaked');
  assert.ok(!/color:red/.test(r.body.text), 'style content leaked');
  assert.ok(!/<h1>/i.test(r.body.text));
});

test('GET /api/pipeline/preview caps body at 8 KB', async () => {
  upstreamHandler = async () => new Response(
    '<p>' + 'word '.repeat(5000) + '</p>',
    { status: 200, headers: { 'content-type': 'text/html' } }
  );
  const r = await get('/api/pipeline/preview?url=' + encodeURIComponent(SAMPLE));
  assert.equal(r.body.status, 200);
  assert.ok(r.body.text.length <= 8000, `expected ≤8000, got ${r.body.text.length}`);
});

test('GET /api/pipeline/preview reports upstream non-2xx via status field', async () => {
  upstreamHandler = async () => new Response('not found', { status: 404 });
  const r = await get('/api/pipeline/preview?url=' + encodeURIComponent(SAMPLE));
  assert.equal(r.body.status, 404);
  assert.match(r.body.text, /HTTP 404/);
});

test('GET /api/pipeline/preview reports network error gracefully', async () => {
  upstreamHandler = async () => { throw new Error('ENOTFOUND'); };
  const r = await get('/api/pipeline/preview?url=' + encodeURIComponent(SAMPLE));
  assert.equal(r.body.status, 0);
  assert.match(r.body.text, /ENOTFOUND/);
});

// ───────────────────────── validation ─────────────────────────

test('GET /api/pipeline/preview rejects invalid URL with 400', async () => {
  const r = await get('/api/pipeline/preview?url=not-a-url');
  assert.equal(r.status, 400);
});

test('GET /api/pipeline/preview rejects javascript: scheme', async () => {
  const r = await get('/api/pipeline/preview?url=' + encodeURIComponent('javascript:alert(1)'));
  assert.equal(r.status, 400);
});

test('GET /api/pipeline/preview rejects loopback host', async () => {
  const r = await get('/api/pipeline/preview?url=' + encodeURIComponent('http://localhost/x'));
  assert.equal(r.status, 400);
});

test('GET /api/pipeline/preview rejects empty url', async () => {
  const r = await get('/api/pipeline/preview');
  assert.equal(r.status, 400);
});

// ───────────────────────── REVIEW-B1 redirect hardening ─────────────────────────

test('REVIEW-B1: rejects redirect to loopback', async () => {
  upstreamHandler = async (url) => {
    if (String(url) === SAMPLE) {
      return new Response('', {
        status: 302,
        headers: { location: 'http://127.0.0.1:1/internal' },
      });
    }
    return new Response('LEAKED', { status: 200, headers: { 'content-type': 'text/html' } });
  };
  const r = await get('/api/pipeline/preview?url=' + encodeURIComponent(SAMPLE));
  assert.equal(r.status, 200);
  assert.match(r.body.text, /unsafe redirect/i);
  assert.ok(!/LEAKED/.test(r.body.text));
});

test('REVIEW-B1: rejects redirect to file:// scheme', async () => {
  upstreamHandler = async (url) => {
    if (String(url) === SAMPLE) {
      return new Response('', {
        status: 301,
        headers: { location: 'file:///etc/passwd' },
      });
    }
    return new Response('LEAKED', { status: 200, headers: { 'content-type': 'text/html' } });
  };
  const r = await get('/api/pipeline/preview?url=' + encodeURIComponent(SAMPLE));
  assert.equal(r.status, 200);
  assert.match(r.body.text, /unsafe redirect/i);
});

test('REVIEW-B1: caps redirect chain at 3 hops', async () => {
  let count = 0;
  upstreamHandler = async () => {
    count += 1;
    return new Response('', {
      status: 302,
      headers: { location: `https://jobs.example.com/hop-${count}` },
    });
  };
  const r = await get('/api/pipeline/preview?url=' + encodeURIComponent(SAMPLE));
  assert.equal(r.status, 200);
  assert.match(r.body.text, /too many redirects/i);
});

test('REVIEW-B1: follows safe https redirect within cap', async () => {
  let hop = 0;
  upstreamHandler = async () => {
    hop += 1;
    if (hop === 1) {
      return new Response('', {
        status: 302,
        headers: { location: 'https://careers.example.com/landing' },
      });
    }
    return new Response('<p>Real Posting</p>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
  };
  const r = await get('/api/pipeline/preview?url=' + encodeURIComponent(SAMPLE));
  assert.equal(r.status, 200);
  assert.match(r.body.text, /Real Posting/);
});
