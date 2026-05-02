import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/index.mjs';

let server;
let baseUrl;

before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(() => {
  return new Promise((resolve) => server.close(resolve));
});

async function get(path) {
  const res = await fetch(baseUrl + path);
  const text = await res.text();
  const ct = res.headers.get('content-type') || '';
  let body = null;
  if (text && ct.includes('application/json')) {
    try { body = JSON.parse(text); } catch { body = null; }
  }
  return { status: res.status, body, raw: text, ct };
}

async function post(path, body) {
  const res = await fetch(baseUrl + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

// ───────────────────────── smoke: each endpoint responds ─────────────────────────

test('GET /api/health → 200 with checks[]', async () => {
  const { status, body } = await get('/api/health');
  assert.equal(status, 200);
  assert.ok(Array.isArray(body.checks));
  assert.ok(body.checks.length > 5);
  assert.ok('version' in body);
  // every check has the required flag (true|false)
  assert.ok(body.checks.every((c) => typeof c.required === 'boolean'));
});

test('GET /api/health: ok=true even when only optional checks fail', async () => {
  const prevKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const { body } = await get('/api/health');
    // GEMINI_API_KEY is OPTIONAL → must not flip overall ok flag
    const geminiCheck = body.checks.find((c) => c.name === 'GEMINI_API_KEY');
    assert.equal(geminiCheck.required, false);
    assert.equal(geminiCheck.ok, false);
    assert.equal(body.ok, true, 'ok should be true since only optional check failed');
    assert.ok(body.warnings >= 1);
  } finally {
    if (prevKey) process.env.GEMINI_API_KEY = prevKey;
  }
});

test('GET /api/dashboard → 200 with counts', async () => {
  const { status, body } = await get('/api/dashboard');
  assert.equal(status, 200);
  assert.ok(body.counts);
  assert.equal(typeof body.counts.applications, 'number');
  assert.equal(typeof body.counts.pipeline, 'number');
  assert.equal(typeof body.counts.reports, 'number');
});

test('GET /api/tracker → 200 with rows[]', async () => {
  const { status, body } = await get('/api/tracker');
  assert.equal(status, 200);
  assert.ok(Array.isArray(body.rows));
});

test('GET /api/pipeline → 200 with urls[]', async () => {
  const { status, body } = await get('/api/pipeline');
  assert.equal(status, 200);
  assert.ok(Array.isArray(body.urls));
});

test('GET /api/reports → 200 with reports[]', async () => {
  const { status, body } = await get('/api/reports');
  assert.equal(status, 200);
  assert.ok(Array.isArray(body.reports));
});

test('GET /api/portals → 200 with portals data', async () => {
  const { status, body } = await get('/api/portals');
  assert.equal(status, 200);
  assert.ok('portals' in body);
});

test('GET /api/profile → 200', async () => {
  const { status, body } = await get('/api/profile');
  assert.equal(status, 200);
  assert.ok('profile' in body);
});

test('GET /api/cv → 200 with markdown', async () => {
  const { status, body } = await get('/api/cv');
  assert.equal(status, 200);
  assert.equal(typeof body.markdown, 'string');
});

test('GET /api/modes → 200 with modes[]', async () => {
  const { status, body } = await get('/api/modes');
  assert.equal(status, 200);
  assert.ok(Array.isArray(body.modes));
  assert.ok(body.modes.includes('oferta'));
});

test('GET /api/modes/oferta → text/plain content', async () => {
  const { status, raw, ct } = await get('/api/modes/oferta');
  assert.equal(status, 200);
  assert.match(ct || '', /text\/plain/);
  assert.ok(raw.length > 100);
});

test('GET /api/modes/.. → blocked path traversal', async () => {
  const { status } = await get('/api/modes/' + encodeURIComponent('../../etc/passwd'));
  // sanitizer strips → becomes "etcpasswd" → 404, never reaches /etc/passwd
  assert.equal(status, 404);
});

test('GET /api/* unknown → 404', async () => {
  const { status } = await get('/api/nonexistent');
  assert.equal(status, 404);
});

// ───────────────────────── pipeline POST/DELETE ─────────────────────────

test('POST /api/pipeline rejects missing url', async () => {
  const { status, body } = await post('/api/pipeline', {});
  assert.equal(status, 400);
  assert.ok(body.error);
});

test('POST /api/pipeline + DELETE round-trip', async () => {
  const url = 'https://test-' + Date.now() + '.example.com/job/1';
  const add = await post('/api/pipeline', { url });
  assert.equal(add.status, 200);
  assert.ok(add.body.urls.includes(url));

  const list = await get('/api/pipeline');
  assert.ok(list.body.urls.includes(url));

  const res = await fetch(baseUrl + '/api/pipeline?url=' + encodeURIComponent(url), { method: 'DELETE' });
  assert.equal(res.status, 200);

  const after = await get('/api/pipeline');
  assert.ok(!after.body.urls.includes(url));
});

// ───────────────────────── evaluate fallback (no Gemini) ─────────────────────────

test('POST /api/evaluate without GEMINI_API_KEY → manual prompt', async () => {
  const prevKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const r = await post('/api/evaluate', {
      jd: 'About the role: looking for a Senior Backend Engineer with PHP and Go experience. Responsibilities include building services and reviewing code.',
    });
    assert.equal(r.status, 200);
    assert.equal(r.body.mode, 'manual');
    assert.ok(r.body.prompt.includes('cv.md'));
  } finally {
    if (prevKey) process.env.GEMINI_API_KEY = prevKey;
  }
});

test('POST /api/evaluate rejects short JD', async () => {
  const r = await post('/api/evaluate', { jd: 'too short' });
  assert.equal(r.status, 400);
});

// ───────────────────────── deep / apply prompt builders ─────────────────────────

test('POST /api/deep returns prompt referencing company', async () => {
  const r = await post('/api/deep', { company: 'Wheely', role: 'Senior Backend' });
  assert.equal(r.status, 200);
  assert.ok(r.body.prompt.includes('Wheely'));
  assert.ok(r.body.prompt.includes('interview-prep/'));
});

test('POST /api/deep rejects missing company', async () => {
  const r = await post('/api/deep', {});
  assert.equal(r.status, 400);
});

test('POST /api/apply-helper returns checklist', async () => {
  const r = await post('/api/apply-helper', { url: 'https://x.com/1' });
  assert.equal(r.status, 200);
  assert.ok(r.body.checklist.includes('NEVER auto-submit'));
});

// ───────────────────────── static SPA ─────────────────────────

test('GET / serves SPA shell', async () => {
  const res = await fetch(baseUrl + '/');
  const html = await res.text();
  assert.equal(res.status, 200);
  assert.match(html, /career-ops/);
  assert.match(html, /<aside class="sidebar"/);
});

test('GET /unknown → SPA fallback (200 html)', async () => {
  const res = await fetch(baseUrl + '/random-route');
  const html = await res.text();
  assert.equal(res.status, 200);
  assert.match(html, /career-ops/);
});
