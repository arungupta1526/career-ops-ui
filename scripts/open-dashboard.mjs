#!/usr/bin/env node
/**
 * WS8 follow-up (v1.43.0, user-requested) — open AND raise the
 * career-ops-ui dashboard in the default browser.
 *
 * The old `bin/start.sh` autostart just ran `open <url>` / `xdg-open`.
 * When the browser is already running with many tabs, the new tab can
 * land in the background and the browser window is not brought to the
 * front — the user has to hunt for it. This script:
 *
 *   1. Builds the dashboard URL from HOST/PORT (defaults 127.0.0.1:4317).
 *   2. Optionally waits for `/api/health` to answer (so the standalone
 *      `career-ops-ui open` works even while the server is still booting).
 *   3. Opens the URL in the default browser, then BEST-EFFORT activates
 *      (raises to the foreground) whichever common browser is running —
 *      macOS via `osascript`, Linux via `wmctrl`/`xdg-open`, Windows via
 *      `start`. Every raise step is best-effort and never throws.
 *   4. Always prints the URL so the terminal is a reliable fallback.
 *
 * Usage:
 *   node scripts/open-dashboard.mjs           # wait ≤12s for health, then open+raise
 *   node scripts/open-dashboard.mjs --no-wait # open immediately (server assumed up)
 *   career-ops-ui open                        # same, via the CLI dispatcher
 *   PORT=8080 career-ops-ui open
 */
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function dashboardUrl(env = process.env) {
  const host = env.HOST && env.HOST !== '0.0.0.0' ? env.HOST : '127.0.0.1';
  const port = env.PORT || '4317';
  return `http://${host}:${port}/`;
}

/** Resolve true once GET <url>api/health answers, or after `timeoutMs`. */
export async function waitForHealth(url, { timeoutMs = 12_000, stepMs = 400 } = {}) {
  const deadline = Date.now() + timeoutMs;
  const healthUrl = url.replace(/\/$/, '') + '/api/health';
  while (Date.now() < deadline) {
    try {
      const r = await fetch(healthUrl, { signal: AbortSignal.timeout(2_000) });
      if (r.ok) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, stepMs));
  }
  return false;
}

function run(cmd, args) {
  return new Promise((res) => {
    try {
      const p = spawn(cmd, args, { stdio: 'ignore', detached: false });
      p.on('error', () => res(false));
      p.on('exit', (code) => res(code === 0));
    } catch { res(false); }
  });
}

/**
 * Open `url` in the default browser and raise the browser window.
 * Pure side-effect orchestration; returns the platform key used so the
 * behaviour is unit-assertable without launching a real browser.
 */
export async function openAndRaise(url, platform = process.platform) {
  if (platform === 'darwin') {
    // `open` launches/activates the default browser; the osascript pass
    // then force-activates whichever browser is actually running so the
    // window comes to the front even if the tab opened in the back.
    await run('open', [url]);
    const browsers = ['Google Chrome', 'Brave Browser', 'Microsoft Edge', 'Safari', 'Arc', 'Firefox'];
    const osa = browsers
      .map((b) => `if application "${b}" is running then tell application "${b}" to activate`)
      .join('\n');
    await run('osascript', ['-e', osa]);
    return 'darwin';
  }
  if (platform === 'win32') {
    await run('cmd', ['/c', 'start', '', url]);
    return 'win32';
  }
  // linux / *nix — xdg-open picks the default browser; wmctrl (if present)
  // raises the browser window to the active desktop.
  await run('xdg-open', [url]);
  await run('wmctrl', ['-a', 'Mozilla Firefox']).catch(() => {});
  return 'linux';
}

async function main() {
  const args = process.argv.slice(2);
  const noWait = args.includes('--no-wait');
  const url = dashboardUrl();
  console.log(`career-ops-ui — dashboard: ${url}`);
  if (!noWait) {
    const up = await waitForHealth(url);
    if (!up) {
      console.log('  (server not answering yet — opening anyway; reload if it 404s)');
    }
  }
  await openAndRaise(url);
  console.log('  ↑ browser raised. If you don\'t see it, open the URL above manually.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error('open-dashboard failed:', e.message); process.exit(1); });
}
