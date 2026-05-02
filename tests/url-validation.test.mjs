/**
 * FIX-M3 + FIX-M6 — POST /api/pipeline must reject invalid URLs with 400,
 * not return 200 and silently drop them.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

let server;
let baseUrl;
let createApp;
let isValidJobUrl;

before(async () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'url-val-'));
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

  ({ createApp, isValidJobUrl } = await import('../server/index.mjs'));
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

async function post(body) {
  const res = await fetch(baseUrl + '/api/pipeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

// ───────────────────────── pure validator ─────────────────────────

test('isValidJobUrl: accepts http/https with hostname', () => {
  assert.equal(isValidJobUrl('https://jobs.example.com/posting/1'), true);
  assert.equal(isValidJobUrl('http://example.com'), true);
  assert.equal(isValidJobUrl('https://boards.greenhouse.io/anthropic/jobs/4042'), true);
});

test('isValidJobUrl: rejects script/template chars', () => {
  assert.equal(isValidJobUrl('<script>alert(1)</script>'), false);
  assert.equal(isValidJobUrl('https://x.com/<img>'), false);
  assert.equal(isValidJobUrl('https://x.com/" onerror="x'), false);
  assert.equal(isValidJobUrl("https://x.com/'attr'"), false);
  assert.equal(isValidJobUrl('https://x.com/`backtick`'), false);
});

test('isValidJobUrl: rejects javascript: / data: / file: schemes', () => {
  assert.equal(isValidJobUrl('javascript:alert(1)'), false);
  assert.equal(isValidJobUrl('data:text/html,<h1>x</h1>'), false);
  assert.equal(isValidJobUrl('file:///etc/passwd'), false);
  assert.equal(isValidJobUrl('ftp://example.com'), false);
  assert.equal(isValidJobUrl('vbscript:msgbox(1)'), false);
});

test('isValidJobUrl: rejects empty, whitespace, non-string', () => {
  assert.equal(isValidJobUrl(''), false);
  assert.equal(isValidJobUrl('   '), false);
  assert.equal(isValidJobUrl(null), false);
  assert.equal(isValidJobUrl(undefined), false);
  assert.equal(isValidJobUrl(42), false);
  assert.equal(isValidJobUrl({}), false);
});

test('isValidJobUrl: rejects malformed URL strings', () => {
  assert.equal(isValidJobUrl('not a url'), false);
  assert.equal(isValidJobUrl('http://'), false);
  assert.equal(isValidJobUrl('//example.com'), false);
  assert.equal(isValidJobUrl('../../etc/passwd'), false);
});

// ───────────────────────── HTTP integration ─────────────────────────

test('POST /api/pipeline {url:"<script>"} → 400', async () => {
  const r = await post({ url: '<script>alert(1)</script>' });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /invalid/i);
});

test('POST /api/pipeline {url:"javascript:..."} → 400', async () => {
  const r = await post({ url: 'javascript:alert(1)' });
  assert.equal(r.status, 400);
});

test('POST /api/pipeline {url:"<img onerror>..."} → 400', async () => {
  const r = await post({ url: '<img src=x onerror=alert(1)>' });
  assert.equal(r.status, 400);
});

test('POST /api/pipeline {url:""} → 400', async () => {
  const r = await post({});
  assert.equal(r.status, 400);
  assert.match(r.body.error, /url required/);
});

test('POST /api/pipeline {url:"https://..."} → 200', async () => {
  const r = await post({ url: 'https://valid-' + Date.now() + '.example.com/job/1' });
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
});

test('POST /api/pipeline duplicate URL → 200 with deduped:true', async () => {
  const url = 'https://dup-' + Date.now() + '.example.com/job/1';
  const first = await post({ url });
  assert.equal(first.status, 200);
  assert.equal(first.body.deduped, false);
  const second = await post({ url });
  assert.equal(second.status, 200);
  assert.equal(second.body.deduped, true);
});
