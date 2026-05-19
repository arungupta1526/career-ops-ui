/**
 * Read / write the parent project's .env file in place. Used by the
 * /api/config endpoint so the user can edit ANTHROPIC_API_KEY, GEMINI,
 * HH_USER_AGENT, etc. through the UI and have BOTH career-ops scripts
 * (read by node) AND web-ui (read by dotenv-loader) pick them up.
 *
 * Preserves existing comments and ordering; only the keys we touch are
 * rewritten, everything else passes through unchanged.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

/**
 * Keys we expose via /api/config. Order matters — it's how they appear
 * in the file when we have to bootstrap an empty .env.
 */
export const KNOWN_KEYS = [
  // ── LLM provider selection (v1.39.0, WS8.2) ──
  'LLM_PROVIDER',          // auto | claude | gemini | openai | qwen
  // ── LLM provider keys. `auto` runs whichever key is set, in this
  //    preferred order: Anthropic > Gemini > OpenAI > Qwen (v1.55.0). ──
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_MODEL',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'OPENAI_API_KEY',        // headless live-eval (v1.55.0) + parent Codex/OpenAI CLI flow
  'OPENAI_MODEL',
  'QWEN_API_KEY',          // headless live-eval via DashScope OpenAI-compatible (v1.55.0)
  'QWEN_MODEL',
  // ── Server runtime ──
  'PORT',
  'HOST',
];

/**
 * Valid LLM_PROVIDER values. `auto` = first provider whose key is set,
 * preferring Anthropic → Gemini → OpenAI → Qwen. Explicit values pin
 * one provider; with no key it falls through to the manual-prompt
 * path exactly like the pre-v1.39 no-key behaviour.
 */
export const LLM_PROVIDERS = ['auto', 'claude', 'gemini', 'openai', 'qwen'];

/**
 * Effective provider preference order from LLM_PROVIDER:
 *   auto (default/unset/unknown) → ['anthropic','gemini','openai','qwen']
 *   claude                       → ['anthropic']
 *   gemini                       → ['gemini']
 *   openai                       → ['openai']
 *   qwen                         → ['qwen']
 * The route gates walk this list and use the first provider whose key
 * is actually set (the user's "works via OR" requirement); a forced
 * provider with no key falls through to manual-prompt.
 */
export function providerOrder(env = process.env) {
  const v = String(env.LLM_PROVIDER || 'auto').trim().toLowerCase();
  if (v === 'claude') return ['anthropic'];
  if (v === 'gemini') return ['gemini'];
  if (v === 'openai') return ['openai'];
  if (v === 'qwen') return ['qwen'];
  return ['anthropic', 'gemini', 'openai', 'qwen'];
}

/**
 * v1.55.3 (UX-2) — given the list of providers whose key is set,
 * return the one the OR-router would actually use: the first entry of
 * providerOrder(env) that is in `keysConfigured`, else null. Pure (no
 * I/O) so the /api/status/providers endpoint and its test share one
 * source of truth with the llm.mjs gate sites. An explicit
 * LLM_PROVIDER pin with no matching key correctly yields null (mirrors
 * the manual-prompt fall-through).
 */
export function selectActiveProvider(keysConfigured, env = process.env) {
  const set = new Set(keysConfigured || []);
  return providerOrder(env).find((p) => set.has(p)) || null;
}

/**
 * Group classification for the SPA config view (F-013). v1.19.0 collapsed
 * to two groups: `core` (LLM keys) and `runtime` (PORT/HOST). The
 * previous "regional" group (only HH_USER_AGENT) was removed — the
 * bundled default User-Agent in `server/lib/sources/hh.mjs` handles
 * non-RU IPs well enough that exposing the override through the UI
 * was confusing for most users. Power users can still set
 * HH_USER_AGENT directly in `career-ops/.env`.
 */
export const KEY_GROUPS = {
  LLM_PROVIDER: 'core',
  ANTHROPIC_API_KEY: 'core',
  ANTHROPIC_MODEL: 'core',
  GEMINI_API_KEY: 'core',
  GEMINI_MODEL: 'core',
  OPENAI_API_KEY: 'core',
  OPENAI_MODEL: 'core',
  QWEN_API_KEY: 'core',
  QWEN_MODEL: 'core',
  PORT: 'runtime',
  HOST: 'runtime',
};

/** Keys whose values are secret and must never be returned in plain text. */
export const SECRET_KEYS = new Set(['ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY', 'QWEN_API_KEY']);

/**
 * Parse an .env file body into a plain object. Preserves the raw text
 * via a `__raw` field so updates can rewrite in place without breaking
 * comments or ordering.
 */
export function parseEnv(text) {
  const out = {};
  if (!text) return out;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^\s+|\s+$/g, '');
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
}

/**
 * v1.54.9 — effective value of an env key for runtime LLM routing.
 *
 * The server reads keys from `process.env`, which is a SNAPSHOT taken
 * at boot. If the user later sets `ANTHROPIC_API_KEY` in the parent
 * `.env` (or it was added after the server started) the running
 * process never sees it → `hasAnthropicKey()` is false, evaluation
 * silently falls through to whatever stale key IS in process.env
 * (often an old/invalid `GEMINI_API_KEY`) and the user gets a
 * "Gemini API key not valid" error despite Anthropic being set.
 *
 * Resolution order, matching user expectation ("use whichever keys
 * are actually set"): a non-empty `process.env` value wins (covers
 * shell exports and the live-apply in POST /api/config), otherwise
 * the current parent `.env` file is consulted. This also removes the
 * asymmetry where the Gemini path (a parent Node subprocess) already
 * read the parent `.env` while the in-process Anthropic path did not.
 *
 * Never throws; returns undefined when the key is set nowhere.
 */
export function effectiveEnv(key, envFilePath) {
  const live = process.env[key];
  if (live !== undefined && live !== '') return live;
  try {
    if (envFilePath && existsSync(envFilePath)) {
      const v = parseEnv(readFileSync(envFilePath, 'utf8'))[key];
      if (v !== undefined && v !== '') return v;
    }
  } catch { /* unreadable .env → treat as unset */ }
  return undefined;
}

/**
 * Is `raw` a plausibly-real LLM API key — as opposed to unset, a
 * shipped-template placeholder, or obviously-too-short junk left in a
 * parent .env? Every supported provider's key is comfortably over 20
 * chars (Gemini `AIza…` ≈ 39, Anthropic `sk-ant-…` ≈ 100+, OpenAI
 * `sk-…` ≥ 40, Qwen/DashScope `sk-…` ≈ 35), so a conservative 20-char
 * floor never false-negatives a working key while killing the kind of
 * 10-char placeholder that (v1.56.3) a parent .env carried — it was
 * reported "✓ set" by the onboarding banner AND mis-selected as the
 * active provider over a valid ANTHROPIC key, so every live eval
 * silently failed against a dead provider. Pure; used by
 * has{Anthropic,Gemini,OpenAI,Qwen}Key() and the /api/health key rows
 * so every "is it configured?" answer agrees.
 */
export function isUsableKey(raw) {
  if (typeof raw !== 'string') return false;
  const v = raw.trim();
  if (v.length < 20) return false;                       // no real key is this short
  if (/^your_.*_here$/i.test(v)) return false;           // shipped-template form (matches maskSecret)
  if (/_here$/i.test(v)) return false;
  if (/^(your[_-]|changeme|placeholder|example|sk-xxx|todo$|none$|null$|test[_-]?key|enter[_-]|add[_-]your)/i.test(v)) return false;
  if (/^<.*>$/.test(v)) return false;                    // <your-key-here> angle form
  if (/^(.)\1+$/.test(v)) return false;                  // a single repeated char
  return true;
}

/**
 * Mask secret values: keep first 4 + last 4 chars, hide middle.
 * Returns null when the value is unset, the empty string, or a literal
 * placeholder like "your_*_here".
 */
export function maskSecret(value) {
  if (!value || /^your_.*_here$/i.test(value)) return null;
  const s = String(value);
  if (s.length <= 8) return '*'.repeat(s.length);
  return s.slice(0, 4) + '…' + s.slice(-4);
}

/**
 * Validate a config update. Returns { ok, errors: string[] }.
 * Empty values are allowed (they unset the key).
 */
export function validateConfig(body) {
  const errors = [];
  if (typeof body !== 'object' || body === null) {
    return { ok: false, errors: ['body must be an object'] };
  }
  for (const [k, v] of Object.entries(body)) {
    if (!KNOWN_KEYS.includes(k)) {
      errors.push(`${k}: not a known config key`);
      continue;
    }
    if (v === null || v === '' || v === undefined) continue;
    if (typeof v !== 'string') {
      errors.push(`${k}: must be string`);
      continue;
    }
    if (v.length > 4000) errors.push(`${k}: longer than 4000 chars`);
    if (/[\r\n]/.test(v)) errors.push(`${k}: must not contain newlines`);
    if (k === 'ANTHROPIC_API_KEY' && !/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(v) && !/^your_/i.test(v)) {
      errors.push(`${k}: expected sk-ant-… format`);
    }
    if (k === 'PORT' && !/^\d{1,5}$/.test(v)) {
      errors.push(`${k}: must be 1-65535`);
    }
    if (k === 'HOST' && !/^[a-zA-Z0-9.:_-]+$/.test(v)) {
      errors.push(`${k}: invalid hostname/ip`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Update an .env file with the given key→value map. Preserves existing
 * order and comments; new keys append at the bottom under a marker.
 * Empty-string values DELETE the key from the file. Returns the list
 * of keys that were actually written.
 */
export function updateEnvFile(path, updates) {
  let text = '';
  if (existsSync(path)) {
    try { text = readFileSync(path, 'utf8'); } catch {}
  }
  const lines = text.split(/\r?\n/);
  const written = new Set();
  const toDelete = new Set();
  for (const [k, v] of Object.entries(updates)) {
    if (v === '' || v === null) toDelete.add(k);
  }

  const newLines = [];
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (!m) {
      newLines.push(line);
      continue;
    }
    const key = m[1];
    if (toDelete.has(key)) {
      // Drop the line entirely.
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      const v = updates[key];
      newLines.push(`${key}=${quoteIfNeeded(String(v))}`);
      written.add(key);
    } else {
      newLines.push(line);
    }
  }

  // Append any keys that weren't already in the file.
  const appended = [];
  for (const [k, v] of Object.entries(updates)) {
    if (toDelete.has(k)) continue;
    if (written.has(k)) continue;
    appended.push(`${k}=${quoteIfNeeded(String(v))}`);
    written.add(k);
  }
  if (appended.length) {
    if (newLines.length && newLines[newLines.length - 1] !== '') newLines.push('');
    newLines.push('# ── added via web-ui /#/config ──');
    newLines.push(...appended);
  }

  // Trim trailing blank lines but keep one final newline.
  while (newLines.length && newLines[newLines.length - 1] === '') newLines.pop();
  writeFileSync(path, newLines.join('\n') + '\n');
  return Array.from(written);
}

function quoteIfNeeded(v) {
  // Quote when the value has whitespace OR characters that confuse
  // shell-style env parsers.
  if (/[\s"'`$]/.test(v)) return '"' + v.replace(/"/g, '\\"') + '"';
  return v;
}
