/**
 * server/lib/anthropic.mjs — direct fetch client for the Anthropic
 * Messages API. Covers the response-shape contract plus error paths,
 * with a fakeFetch so we never burn real API credits.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAnthropic, hasAnthropicKey, hasGeminiKey } from '../server/lib/anthropic.mjs';

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('runAnthropic: returns 400 when no API key', async () => {
  const prev = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    const r = await runAnthropic('hello');
    assert.equal(r.markdown, '');
    assert.match(r.error, /ANTHROPIC_API_KEY/);
  } finally {
    if (prev) process.env.ANTHROPIC_API_KEY = prev;
  }
});

test('runAnthropic: concatenates text blocks from a successful response', async () => {
  const fakeFetch = async () =>
    jsonResponse(200, {
      content: [
        { type: 'text', text: '# Title\n' },
        { type: 'text', text: 'Body line.' },
        { type: 'tool_use', id: 't1', name: 'x', input: {} }, // ignored
      ],
      usage: { input_tokens: 10, output_tokens: 20 },
    });
  const r = await runAnthropic('say hi', { apiKey: 'sk-test', fetchImpl: fakeFetch });
  assert.equal(r.error, null);
  assert.equal(r.markdown, '# Title\n\nBody line.');
  assert.equal(r.usage.input_tokens, 10);
});

test('runAnthropic: 4xx → error, no markdown', async () => {
  const fakeFetch = async () =>
    jsonResponse(401, { error: { type: 'authentication_error', message: 'invalid x-api-key' } });
  const r = await runAnthropic('hi', { apiKey: 'sk-bad', fetchImpl: fakeFetch });
  assert.equal(r.markdown, '');
  assert.match(r.error, /authentication_error|invalid|HTTP 401/);
});

test('runAnthropic: 5xx → error', async () => {
  const fakeFetch = async () => jsonResponse(503, { error: { message: 'overloaded' } });
  const r = await runAnthropic('hi', { apiKey: 'sk-test', fetchImpl: fakeFetch });
  assert.equal(r.markdown, '');
  assert.match(r.error, /overloaded|HTTP 5/);
});

test('runAnthropic: clamps maxTokens into [256, 16384]', async () => {
  let body;
  const fakeFetch = async (_url, opts) => {
    body = JSON.parse(opts.body);
    return jsonResponse(200, { content: [{ type: 'text', text: 'ok' }] });
  };
  await runAnthropic('hi', { apiKey: 'sk', fetchImpl: fakeFetch, maxTokens: 10 });
  assert.equal(body.max_tokens, 256, 'lower clamp');
  await runAnthropic('hi', { apiKey: 'sk', fetchImpl: fakeFetch, maxTokens: 99999 });
  assert.equal(body.max_tokens, 16384, 'upper clamp');
});

test('runAnthropic: timeout returns "timeout" error', async () => {
  const fakeFetch = (_url, opts) => new Promise((_, rej) => {
    opts.signal.addEventListener('abort', () =>
      rej(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  });
  const r = await runAnthropic('hi', { apiKey: 'sk', fetchImpl: fakeFetch, timeoutMs: 50 });
  assert.equal(r.markdown, '');
  assert.equal(r.error, 'timeout');
});

test('runAnthropic: malformed JSON body still produces a useful error', async () => {
  const fakeFetch = async () =>
    new Response('not json', { status: 500, headers: { 'content-type': 'text/plain' } });
  const r = await runAnthropic('hi', { apiKey: 'sk', fetchImpl: fakeFetch });
  assert.equal(r.markdown, '');
  assert.match(r.error, /HTTP 500/);
});

test('hasAnthropicKey: reflects current process.env', () => {
  const prev = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  assert.equal(hasAnthropicKey(), false);
  process.env.ANTHROPIC_API_KEY = 'sk-x';
  assert.equal(hasAnthropicKey(), true);
  if (prev) process.env.ANTHROPIC_API_KEY = prev; else delete process.env.ANTHROPIC_API_KEY;
});

test('hasGeminiKey: reflects current process.env (REVIEW-B2)', () => {
  const prev = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  assert.equal(hasGeminiKey(), false);
  process.env.GEMINI_API_KEY = 'AIzaTEST';
  assert.equal(hasGeminiKey(), true);
  if (prev) process.env.GEMINI_API_KEY = prev; else delete process.env.GEMINI_API_KEY;
});

test('runAnthropic: never logs the API key on stdout (REVIEW-B4)', async () => {
  // Defense-in-depth: future code changes inside runAnthropic must not
  // call console.log/info/error/debug while the key is in scope. We
  // capture every console call during a successful run and assert the
  // captured output is empty.
  const captured = [];
  const orig = {};
  for (const m of ['log', 'info', 'warn', 'error', 'debug']) {
    orig[m] = console[m];
    console[m] = (...args) => captured.push({ level: m, args });
  }
  try {
    const fakeFetch = async () =>
      jsonResponse(200, { content: [{ type: 'text', text: 'ok' }] });
    const r = await runAnthropic('hi', { apiKey: 'sk-secret-canary-12345', fetchImpl: fakeFetch });
    assert.equal(r.error, null);
    // No console activity at all on the happy path.
    assert.equal(captured.length, 0,
      `console used during runAnthropic; output: ${JSON.stringify(captured)}`);
    // Belt-and-suspenders: even on the error path we don't leak.
    const fakeFail = async () => jsonResponse(500, { error: { message: 'boom' } });
    captured.length = 0;
    await runAnthropic('hi', { apiKey: 'sk-secret-canary-12345', fetchImpl: fakeFail });
    assert.equal(captured.length, 0, 'console used during runAnthropic error path');
    // Confirm the canary string never appeared anywhere we captured.
    const canary = JSON.stringify(captured);
    assert.equal(canary.includes('sk-secret-canary'), false);
  } finally {
    for (const m of ['log', 'info', 'warn', 'error', 'debug']) console[m] = orig[m];
  }
});
