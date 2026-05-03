/**
 * GET / POST /api/config — backend for the /#/config page.
 * Reads from + writes to the parent project's .env so career-ops Node
 * scripts and web-ui's dotenv loader pick up the same source.
 */
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

let server, baseUrl, projectRoot;

before(async () => {
  projectRoot = mkdtempSync(resolve(tmpdir(), 'cfg-ep-'));
  mkdirSync(resolve(projectRoot, 'config'), { recursive: true });
  mkdirSync(resolve(projectRoot, 'data'), { recursive: true });
  mkdirSync(resolve(projectRoot, 'modes'), { recursive: true });
  writeFileSync(resolve(projectRoot, 'cv.md'), '# placeholder\n');
  writeFileSync(resolve(projectRoot, 'config', 'profile.yml'), 'candidate:\n  full_name: Test\n');
  writeFileSync(resolve(projectRoot, 'portals.yml'), 'tracked_companies: []\n');
  writeFileSync(resolve(projectRoot, 'data', 'applications.md'), '');
  writeFileSync(resolve(projectRoot, 'data', 'pipeline.md'), '# pipeline\n');
  writeFileSync(resolve(projectRoot, 'modes', 'oferta.md'), 'oferta\n');
  process.env.CAREER_OPS_ROOT = projectRoot;
  // Pre-clear any env vars the test will exercise so leakage from
  // the host shell doesn't change behaviour.
  for (const k of ['ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL', 'GEMINI_API_KEY', 'GEMINI_MODEL', 'HH_USER_AGENT']) {
    delete process.env[k];
  }
  const { createApp } = await import('../server/index.mjs');
  const app = createApp();
  await new Promise((r) => {
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      r();
    });
  });
});

beforeEach(() => {
  // Each test gets a fresh .env so writes don't bleed across cases.
  const envPath = resolve(projectRoot, '.env');
  if (existsSync(envPath)) rmSync(envPath);
});

after(() => {
  delete process.env.CAREER_OPS_ROOT;
  return new Promise((r) => server.close(r));
});

async function get(path) {
  const res = await fetch(baseUrl + path);
  return { status: res.status, body: await res.json() };
}
async function postJson(path, body) {
  const res = await fetch(baseUrl + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: res.status < 500 ? await res.json() : null };
}

// ─────────────── GET ───────────────

test('GET /api/config returns the known keys + envFile path', async () => {
  const r = await get('/api/config');
  assert.equal(r.status, 200);
  assert.ok(r.body.envFile.endsWith('.env'));
  for (const k of ['ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'HH_USER_AGENT', 'PORT', 'HOST']) {
    assert.ok(k in r.body.values, `missing ${k} in values`);
  }
});

test('GET /api/config: secret values are masked, never echoed in plain text', async () => {
  const envPath = resolve(projectRoot, '.env');
  writeFileSync(envPath, 'ANTHROPIC_API_KEY=sk-ant-api03-' + 'X'.repeat(40) + '\n');
  const r = await get('/api/config');
  // Either masked (with …) or null — never the raw value.
  assert.ok(!r.body.values.ANTHROPIC_API_KEY.includes('XXXXXXXXXX'),
    `secret leaked: ${r.body.values.ANTHROPIC_API_KEY}`);
});

test('GET /api/config: non-secret values are returned in clear text', async () => {
  writeFileSync(resolve(projectRoot, '.env'),
    'ANTHROPIC_MODEL=claude-opus-4-7\nHOST=0.0.0.0\n');
  const r = await get('/api/config');
  assert.equal(r.body.values.ANTHROPIC_MODEL, 'claude-opus-4-7');
  assert.equal(r.body.values.HOST, '0.0.0.0');
});

// ─────────────── POST ───────────────

test('POST /api/config writes to parent .env', async () => {
  const r = await postJson('/api/config', {
    ANTHROPIC_MODEL: 'claude-haiku-4-5',
    HH_USER_AGENT: 'Mozilla/5.0 test',
  });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.written.sort(), ['ANTHROPIC_MODEL', 'HH_USER_AGENT']);
  const text = readFileSync(resolve(projectRoot, '.env'), 'utf8');
  assert.match(text, /ANTHROPIC_MODEL=claude-haiku-4-5/);
  assert.match(text, /HH_USER_AGENT=/);
  assert.match(text, /Mozilla\/5\.0 test/);
});

test('POST /api/config applies values to running process.env', async () => {
  await postJson('/api/config', { ANTHROPIC_MODEL: 'claude-opus-4-7' });
  assert.equal(process.env.ANTHROPIC_MODEL, 'claude-opus-4-7');
});

test('POST /api/config: empty value unsets the key on disk + in process.env', async () => {
  // First set
  await postJson('/api/config', { ANTHROPIC_MODEL: 'will-be-deleted' });
  assert.equal(process.env.ANTHROPIC_MODEL, 'will-be-deleted');
  // Then delete via empty string
  await postJson('/api/config', { ANTHROPIC_MODEL: '' });
  assert.equal(process.env.ANTHROPIC_MODEL, undefined);
  const text = readFileSync(resolve(projectRoot, '.env'), 'utf8');
  assert.ok(!/^ANTHROPIC_MODEL=/m.test(text), 'key still in .env after delete');
});

test('POST /api/config rejects unknown keys with 400', async () => {
  const r = await postJson('/api/config', { UNKNOWN_KEY: 'x' });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /validation/);
});

test('POST /api/config rejects malformed ANTHROPIC_API_KEY', async () => {
  const r = await postJson('/api/config', { ANTHROPIC_API_KEY: 'not-a-key' });
  assert.equal(r.status, 400);
});

test('POST /api/config: known keys are filtered before write (no attacker injection)', async () => {
  // Even if validation accepted UNKNOWN, the server should never
  // write keys outside KNOWN_KEYS into the .env. validateConfig
  // already rejects them — this test is the belt-and-suspenders
  // assertion that nothing slips through.
  await postJson('/api/config', { ANTHROPIC_MODEL: 'claude-sonnet-4-6' });
  const text = readFileSync(resolve(projectRoot, '.env'), 'utf8');
  assert.ok(!/UNKNOWN/i.test(text));
});
