/**
 * Tiny OpenAI-compatible Chat Completions client. Zero dependencies —
 * direct fetch, same secure pattern as anthropic.mjs (no SDK, no
 * arbitrary CLI execution; key never logged; AbortController timeout).
 *
 * Covers BOTH providers the user asked to run headless via "OR":
 *   - OpenAI    → https://api.openai.com/v1/chat/completions
 *   - Qwen      → Alibaba DashScope OpenAI-compatible endpoint
 * Both speak the identical request/response schema, so one core
 * (`runOpenAICompatible`) backs two thin wrappers.
 *
 * Key/model lookups go through effectiveEnv() (v1.54.9 contract): a
 * key set in the parent `.env` after boot is honoured without a
 * restart, and DETECTION (has*Key) matches the key the request SENDS.
 */
import { effectiveEnv } from './env-config.mjs';
import { PATHS } from './paths.mjs';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
// DashScope's OpenAI-compatible mode. International endpoint — works
// from non-CN regions; CN users can override via QWEN_BASE_URL.
const QWEN_URL_DEFAULT =
  'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';

const envKey = (k) => effectiveEnv(k, PATHS.envFile);

/**
 * @returns {{ markdown: string, usage: object|null, error: string|null }}
 */
export async function runOpenAICompatible(prompt, opts = {}) {
  const { url, apiKey, model, label } = opts;
  if (!apiKey) {
    return { markdown: '', usage: null, error: `${label} key not set` };
  }
  const maxTokens = Math.min(Math.max(opts.maxTokens || 8192, 256), 16384);
  const timeoutMs = opts.timeoutMs || 180_000;
  const fetchImpl = opts.fetchImpl || fetch;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!res.ok) {
      const detail = json?.error?.message || json?.error?.type || `HTTP ${res.status}`;
      return { markdown: '', usage: null, error: `${label} API: ${detail}` };
    }
    // OpenAI-compatible: choices[].message.content (string or block[]).
    const choice = (json.choices || [])[0] || {};
    const content = choice.message && choice.message.content;
    const markdown = (Array.isArray(content)
      ? content.filter((b) => b && (b.type === 'text' || b.text))
        .map((b) => b.text || '').join('\n')
      : String(content || '')).trim();
    return { markdown, usage: json.usage || null, error: null };
  } catch (e) {
    return { markdown: '', usage: null, error: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally {
    clearTimeout(timer);
  }
}

/** Run a prompt via the OpenAI API (model from OPENAI_MODEL). */
export async function runOpenAI(prompt, opts = {}) {
  return runOpenAICompatible(prompt, {
    url: OPENAI_URL,
    apiKey: opts.apiKey || envKey('OPENAI_API_KEY'),
    model: opts.model || envKey('OPENAI_MODEL') || 'gpt-5-codex',
    label: 'OpenAI',
    ...opts,
  });
}

/** Run a prompt via Qwen (DashScope OpenAI-compatible mode). */
export async function runQwen(prompt, opts = {}) {
  return runOpenAICompatible(prompt, {
    url: opts.url || envKey('QWEN_BASE_URL') || QWEN_URL_DEFAULT,
    apiKey: opts.apiKey || envKey('QWEN_API_KEY'),
    model: opts.model || envKey('QWEN_MODEL') || 'qwen-max',
    label: 'Qwen',
    ...opts,
  });
}

/** "Is the OpenAI key set?" — effectiveEnv view (process.env ∨ .env). */
export function hasOpenAIKey() {
  return !!envKey('OPENAI_API_KEY');
}

/** "Is the Qwen key set?" — same effectiveEnv view. */
export function hasQwenKey() {
  return !!envKey('QWEN_API_KEY');
}
