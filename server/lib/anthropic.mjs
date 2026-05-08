/**
 * Tiny Anthropic API client. Zero dependencies — direct fetch to
 * api.anthropic.com/v1/messages. Used as a Gemini-equivalent execution
 * path for /api/deep and /api/mode/:slug, so users with an
 * ANTHROPIC_API_KEY can run modes live in the browser.
 *
 * Model defaults to claude-sonnet-4-6 (current best mid-tier balance);
 * override via ANTHROPIC_MODEL env var.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

/**
 * @returns {{ markdown: string, usage: object|null, error: string|null }}
 */
export async function runAnthropic(prompt, opts = {}) {
  const apiKey = opts.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { markdown: '', usage: null, error: 'ANTHROPIC_API_KEY not set' };
  }
  const model = opts.model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
  const maxTokens = Math.min(Math.max(opts.maxTokens || 8192, 256), 16384);
  const timeoutMs = opts.timeoutMs || 180_000;
  const fetchImpl = opts.fetchImpl || fetch;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(ANTHROPIC_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
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
      return { markdown: '', usage: null, error: `Anthropic API: ${detail}` };
    }
    // Concatenate all `text` blocks. Anthropic returns content[] of typed
    // blocks (text, tool_use, etc.); we only render the text ones.
    const markdown = (json.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    return { markdown, usage: json.usage || null, error: null };
  } catch (e) {
    return { markdown: '', usage: null, error: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally {
    clearTimeout(timer);
  }
}

/** Shorthand for "is the Anthropic key set in process.env right now". */
export function hasAnthropicKey() {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Shorthand for "is the Gemini key set in process.env right now"
 * (REVIEW-B2). Standardizes the LLM-key check with `hasAnthropicKey`
 * so route handlers don't drift between `process.env.GEMINI_API_KEY`
 * and a helper.
 */
export function hasGeminiKey() {
  return !!process.env.GEMINI_API_KEY;
}
