#!/usr/bin/env node
/**
 * WS8.2 (v1.39.0) — `career-ops-ui init`.
 *
 * Interactive (or flag-driven) provider + API-key wizard. Writes the
 * parent project's `.env` via the SAME validated path the #/config
 * Save uses (`env-config.updateEnvFile`) — running `init` IS an
 * explicit user action (CLAUDE.md hard rule #1 allows parent writes
 * on explicit user action, same as POST /api/config).
 *
 * Provider keys mirror what santifer/career-ops actually implements:
 *   - GEMINI_API_KEY    — parent's own gemini-eval.mjs
 *   - ANTHROPIC_API_KEY — web-ui Anthropic SDK + Claude Code CLI
 *   - OPENAI_API_KEY    — Codex / OpenCode CLI side
 * LLM_PROVIDER ∈ auto|claude|gemini sets web-ui live-eval preference.
 *
 * Non-interactive:
 *   career-ops-ui init --provider claude --anthropic-key sk-ant-…
 *   career-ops-ui init --provider gemini --gemini-key … --yes
 *   career-ops-ui init --openai-key … --provider auto
 */
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function parseArgs(argv) {
  const o = { provider: '', anthropic: '', gemini: '', openai: '', yes: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--provider') o.provider = (argv[++i] || '').toLowerCase();
    else if (a === '--anthropic-key') o.anthropic = argv[++i] || '';
    else if (a === '--gemini-key') o.gemini = argv[++i] || '';
    else if (a === '--openai-key') o.openai = argv[++i] || '';
    else if (a === '--yes' || a === '-y') o.yes = true;
  }
  return o;
}

/** Build the {KEY:value} update object (only non-empty keys written). */
export function buildUpdates(o) {
  const u = {};
  const prov = ['auto', 'claude', 'gemini'].includes(o.provider) ? o.provider : 'auto';
  u.LLM_PROVIDER = prov;
  if (o.anthropic) u.ANTHROPIC_API_KEY = o.anthropic.trim();
  if (o.gemini) u.GEMINI_API_KEY = o.gemini.trim();
  if (o.openai) u.OPENAI_API_KEY = o.openai.trim();
  return u;
}

function ask(rl, q) {
  return new Promise((r) => rl.question(q, (a) => r(a.trim())));
}

/**
 * Like `ask`, but the typed value is NOT echoed to the terminal — so
 * an API key never lands in shell scrollback / screen-share / tmux
 * history. (Acts on the v1.39.0 AI-review nit.) Falls back to plain
 * `ask` when stdin is not a TTY (piped / CI).
 */
function askSecret(rl, q) {
  if (!process.stdin.isTTY) return ask(rl, q);
  return new Promise((r) => {
    const onData = (ch) => {
      const s = ch.toString('utf8');
      if (s === '\n' || s === '\r' || s === '') process.stdin.removeListener('data', onData);
      else process.stdout.write('\x1b[2K\x1b[200D' + q + '*'.repeat(rl.line.length));
    };
    process.stdin.on('data', onData);
    rl.question(q, (a) => { process.stdin.removeListener('data', onData); process.stdout.write('\n'); r(a.trim()); });
  });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { PATHS } = await import('../server/lib/paths.mjs');
  const { updateEnvFile } = await import('../server/lib/env-config.mjs');

  if (!opts.yes && (!opts.provider || (!opts.anthropic && !opts.gemini && !opts.openai))) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      console.log('career-ops-ui init — choose your LLM provider\n');
      console.log('  1) Claude / Claude Code   (ANTHROPIC_API_KEY — web-ui live-eval)');
      console.log('  2) Gemini / Gemini CLI    (GEMINI_API_KEY — parent gemini-eval)');
      console.log('  3) Codex / OpenCode CLI   (OPENAI_API_KEY — parent multi-CLI side)');
      console.log('  4) Auto                   (Anthropic → Gemini fallback) [default]\n');
      const pick = await ask(rl, 'Provider [1-4, default 4]: ');
      const map = { 1: 'claude', 2: 'gemini', 3: 'auto', 4: 'auto' };
      opts.provider = map[pick] || 'auto';
      if (pick === '1') opts.anthropic = await askSecret(rl, 'ANTHROPIC_API_KEY: ');
      else if (pick === '2') opts.gemini = await askSecret(rl, 'GEMINI_API_KEY: ');
      else if (pick === '3') opts.openai = await askSecret(rl, 'OPENAI_API_KEY (Codex): ');
      else {
        opts.anthropic = await askSecret(rl, 'ANTHROPIC_API_KEY (blank to skip): ');
        opts.gemini = await askSecret(rl, 'GEMINI_API_KEY (blank to skip): ');
      }
    } finally { rl.close(); }
  }

  const updates = buildUpdates(opts);
  updateEnvFile(PATHS.envFile, updates);
  const keysWritten = Object.keys(updates).filter((k) => k !== 'LLM_PROVIDER' && updates[k]);
  console.log(`\n✓ wrote ${PATHS.envFile}`);
  console.log(`  LLM_PROVIDER=${updates.LLM_PROVIDER}` +
    (keysWritten.length ? ` · keys: ${keysWritten.join(', ')}` : ' · (no keys set yet)'));
  console.log('\nNext:  career-ops-ui doctor   # verify   →   career-ops-ui run');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error('init failed:', e.message); process.exit(1); });
}
