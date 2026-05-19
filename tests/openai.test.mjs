/**
 * v1.55.0 — server/lib/openai.mjs: zero-dep OpenAI-compatible Chat
 * Completions client backing the two new headless live-eval
 * providers the user asked to run "via OR": OpenAI and Qwen
 * (DashScope OpenAI-compatible mode). Same secure pattern as
 * anthropic.mjs — direct fetch, AbortController timeout, key never
 * logged, effectiveEnv() key resolution (process.env ∨ parent .env).
 *
 * CI-isolated: CAREER_OPS_ROOT → temp dir BEFORE import so
 * PATHS.envFile is controllable (CLAUDE.md hard rule #8). fakeFetch
 * everywhere — never burns real API credits.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

let runOpenAI, runQwen, hasOpenAIKey, hasQwenKey, runOpenAICompatible;
let ROOT, ENV_FILE;
const savedRoot = process.env.CAREER_OPS_ROOT;

before(async () => {
  ROOT = mkdtempSync(resolve(tmpdir(), 'openai-'));
  ENV_FILE = resolve(ROOT, '.env');
  writeFileSync(resolve(ROOT, 'cv.md'), '# CV\n');
  writeFileSync(resolve(ROOT, 'portals.yml'), 'tracked_companies: []\n');
  process.env.CAREER_OPS_ROOT = ROOT;
  ({ runOpenAI, runQwen, hasOpenAIKey, hasQwenKey, runOpenAICompatible } =
    await import('../server/lib/openai.mjs'));
});

after(() => {
  if (savedRoot === undefined) delete process.env.CAREER_OPS_ROOT;
  else process.env.CAREER_OPS_ROOT = savedRoot;
  try { rmSync(ROOT, { recursive: true, force: true }); } catch {}
});

function clearParentEnv() { if (existsSync(ENV_FILE)) rmSync(ENV_FILE); }
function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'content-type': 'application/json' },
  });
}
const okChat = (txt) => jsonResponse(200, {
  choices: [{ message: { role: 'assistant', content: txt } }],
  usage: { prompt_tokens: 10, completion_tokens: 20 },
});

test('runOpenAICompatible: no key → error, no markdown', async () => {
  const r = await runOpenAICompatible('hi', { url: 'x', apiKey: '', model: 'm', label: 'OpenAI' });
  assert.equal(r.markdown, '');
  assert.match(r.error, /OpenAI key not set/);
});

test('runOpenAI: concatenates string content + sends Bearer auth', async () => {
  let sentAuth, sentModel, sentUrl;
  const fakeFetch = async (url, opts) => {
    sentUrl = url; sentAuth = opts.headers.Authorization;
    sentModel = JSON.parse(opts.body).model;
    return okChat('# Title\nBody.');
  };
  const r = await runOpenAI('say hi', { apiKey: 'sk-test', model: 'gpt-5', fetchImpl: fakeFetch });
  assert.equal(r.error, null);
  assert.equal(r.markdown, '# Title\nBody.');
  assert.equal(r.usage.completion_tokens, 20);
  assert.equal(sentAuth, 'Bearer sk-test');
  assert.equal(sentModel, 'gpt-5');
  assert.equal(sentUrl, 'https://api.openai.com/v1/chat/completions');
});

test('runOpenAI: handles block-array message content', async () => {
  const fakeFetch = async () => jsonResponse(200, {
    choices: [{ message: { content: [
      { type: 'text', text: 'part 1' }, { type: 'text', text: 'part 2' },
    ] } }],
  });
  const r = await runOpenAI('hi', { apiKey: 'sk', fetchImpl: fakeFetch });
  assert.equal(r.markdown, 'part 1\npart 2');
});

test('runQwen: defaults to the DashScope intl OpenAI-compatible endpoint', async () => {
  let sentUrl, sentModel;
  const fakeFetch = async (url, opts) => {
    sentUrl = url; sentModel = JSON.parse(opts.body).model;
    return okChat('ok');
  };
  const r = await runQwen('hi', { apiKey: 'sk-qwen', fetchImpl: fakeFetch });
  assert.equal(r.error, null);
  assert.equal(sentUrl,
    'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions');
  assert.equal(sentModel, 'qwen-max', 'default QWEN_MODEL');
});

test('runQwen: QWEN_BASE_URL (parent .env) overrides the endpoint', async () => {
  writeFileSync(ENV_FILE,
    'QWEN_API_KEY=sk-dotenv\nQWEN_MODEL=qwen-plus\nQWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions\n');
  const pa = process.env.QWEN_API_KEY; delete process.env.QWEN_API_KEY;
  let sentUrl, sentModel, sentAuth;
  const fakeFetch = async (url, opts) => {
    sentUrl = url; sentModel = JSON.parse(opts.body).model;
    sentAuth = opts.headers.Authorization;
    return okChat('ok');
  };
  try {
    const r = await runQwen('hi', { fetchImpl: fakeFetch });
    assert.equal(r.error, null);
    assert.equal(sentUrl, 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions');
    assert.equal(sentModel, 'qwen-plus', 'model from parent .env');
    assert.equal(sentAuth, 'Bearer sk-dotenv', 'key from parent .env');
  } finally {
    if (pa) process.env.QWEN_API_KEY = pa;
    clearParentEnv();
  }
});

test('4xx / 5xx / malformed → error, no markdown', async () => {
  let r = await runOpenAI('hi', { apiKey: 'sk-bad', fetchImpl: async () =>
    jsonResponse(401, { error: { message: 'invalid api key' } }) });
  assert.equal(r.markdown, '');
  assert.match(r.error, /OpenAI API: invalid api key|HTTP 401/);
  r = await runQwen('hi', { apiKey: 'sk', fetchImpl: async () =>
    jsonResponse(503, { error: { message: 'overloaded' } }) });
  assert.match(r.error, /Qwen API: overloaded|HTTP 5/);
  r = await runOpenAI('hi', { apiKey: 'sk', fetchImpl: async () =>
    new Response('not json', { status: 500, headers: { 'content-type': 'text/plain' } }) });
  assert.match(r.error, /HTTP 500/);
});

test('clamps max_tokens into [256, 16384]; timeout → "timeout"', async () => {
  let body;
  const cap = async (_u, o) => { body = JSON.parse(o.body); return okChat('ok'); };
  await runOpenAI('hi', { apiKey: 'sk', fetchImpl: cap, maxTokens: 1 });
  assert.equal(body.max_tokens, 256);
  await runOpenAI('hi', { apiKey: 'sk', fetchImpl: cap, maxTokens: 1e6 });
  assert.equal(body.max_tokens, 16384);
  const hang = (_u, o) => new Promise((_, rej) =>
    o.signal.addEventListener('abort', () =>
      rej(Object.assign(new Error('aborted'), { name: 'AbortError' }))));
  const r = await runQwen('hi', { apiKey: 'sk', fetchImpl: hang, timeoutMs: 40 });
  assert.equal(r.error, 'timeout');
});

test('has{OpenAI,Qwen}Key: process.env wins, else parent .env (v1.54.9 contract)', () => {
  const po = process.env.OPENAI_API_KEY, pq = process.env.QWEN_API_KEY;
  delete process.env.OPENAI_API_KEY; delete process.env.QWEN_API_KEY;
  clearParentEnv();
  assert.equal(hasOpenAIKey(), false);
  assert.equal(hasQwenKey(), false);
  writeFileSync(ENV_FILE, 'OPENAI_API_KEY=sk-proj-dotenv-openai-aaaaaaaaaaaaaaaa\nQWEN_API_KEY=sk-dashscope-qwen-aaaaaaaaaaaaaaaa\n');
  assert.equal(hasOpenAIKey(), true, 'OpenAI key from parent .env');
  assert.equal(hasQwenKey(), true, 'Qwen key from parent .env');
  process.env.OPENAI_API_KEY = 'sk-proj-procenv-openai-bbbbbbbbbbbbbbbb';
  assert.equal(hasOpenAIKey(), true); // process.env wins (still true)
  if (po) process.env.OPENAI_API_KEY = po; else delete process.env.OPENAI_API_KEY;
  if (pq) process.env.QWEN_API_KEY = pq; else delete process.env.QWEN_API_KEY;
  clearParentEnv();
});

test('never logs the API key (canary)', async () => {
  const captured = [];
  const orig = {};
  for (const m of ['log', 'info', 'warn', 'error', 'debug']) {
    orig[m] = console[m]; console[m] = (...a) => captured.push(a);
  }
  try {
    await runOpenAI('hi', { apiKey: 'sk-secret-canary-999', fetchImpl: async () => okChat('ok') });
    await runQwen('hi', { apiKey: 'sk-secret-canary-999', fetchImpl: async () =>
      jsonResponse(500, { error: { message: 'boom' } }) });
    assert.equal(captured.length, 0, `console used: ${JSON.stringify(captured)}`);
    assert.equal(JSON.stringify(captured).includes('sk-secret-canary'), false);
  } finally {
    for (const m of ['log', 'info', 'warn', 'error', 'debug']) console[m] = orig[m];
  }
});
