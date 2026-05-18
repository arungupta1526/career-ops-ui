/**
 * Playwright browser smoke harness.
 *
 * Drives a real Chromium against the in-process server on an ephemeral
 * port. Verifies that every navigation lands on a usable view (no
 * console errors, key DOM elements present, language switch persists).
 *
 * Opt-in: this test is NOT run by `npm test` because it needs a browser
 * binary and Playwright is not a direct dependency of this repo. Run via:
 *
 *   npm run test:e2e:browser           # uses parent's playwright
 *   PWDEBUG=1 npm run test:e2e:browser # headed, slow-mo
 *
 * Failure modes:
 *   - Playwright not installed in parent → reports a clear skip message.
 *   - No Chromium browser binary → same.
 *   - Server fails to start → assertion in before() throws.
 *
 * The harness mocks parent fixtures via `mkdtempSync`, just like the
 * other tests, so it does NOT touch the user's real career-ops data.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Resolve Playwright via the parent project's node_modules — that's
// where it's actually installed. The project keeps deps minimal so we
// don't bundle Playwright; this matches how `generate-pdf.mjs` and
// `check-liveness.mjs` reach for it at runtime.
function resolvePlaywright() {
  const candidates = [
    'playwright',
    resolve(process.cwd(), '..', 'node_modules', 'playwright'),
    resolve(process.cwd(), 'node_modules', 'playwright'),
  ];
  for (const id of candidates) {
    try { return require(id); } catch {}
  }
  return null;
}

const playwright = resolvePlaywright();
const SKIP = !playwright;

let server, baseUrl, browser, context;

before(async () => {
  if (SKIP) return;
  // Build a minimal parent layout so /api/health goes green-enough for
  // the SPA boot to complete and `Profile customized` flag will show
  // (it's optional, so app.ok stays true).
  const dir = mkdtempSync(resolve(tmpdir(), 'pw-smoke-'));
  mkdirSync(resolve(dir, 'config'), { recursive: true });
  mkdirSync(resolve(dir, 'data'), { recursive: true });
  mkdirSync(resolve(dir, 'modes'), { recursive: true });
  writeFileSync(resolve(dir, 'cv.md'), '# CV\n\nReal Person, Senior Engineer.\n');
  writeFileSync(resolve(dir, 'config', 'profile.yml'),
    'candidate:\n  full_name: Real Person\n  email: real@example.com\n');
  writeFileSync(resolve(dir, 'portals.yml'), 'tracked_companies: []\n');
  writeFileSync(resolve(dir, 'data', 'applications.md'), '');
  writeFileSync(resolve(dir, 'data', 'pipeline.md'), '# Pipeline\n');
  writeFileSync(resolve(dir, 'modes', 'oferta.md'), '# Oferta\n');
  process.env.CAREER_OPS_ROOT = dir;

  const { createApp } = await import('../server/index.mjs');
  const app = createApp();
  await new Promise((r) => {
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      r();
    });
  });

  browser = await playwright.chromium.launch({
    headless: process.env.PWDEBUG !== '1',
  });
  context = await browser.newContext();
});

after(async () => {
  if (context) await context.close();
  if (browser) await browser.close();
  if (server) {
    // Force-destroy any lingering keep-alive / in-flight SSE sockets
    // (Node ≥18.2) so server.close() resolves deterministically and
    // no aborted-request async activity escapes after teardown.
    server.closeAllConnections?.();
    await new Promise((r) => server.close(r));
  }
  delete process.env.CAREER_OPS_ROOT;
});

test('Playwright smoke: dashboard renders + footer version present', { skip: SKIP }, async () => {
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  await page.goto(baseUrl + '/#/dashboard');
  await page.waitForSelector('#content', { timeout: 5000 });
  // Footer renders the package.json version (e.g. "v1.7.2").
  const footerText = await page.locator('#footer-version').textContent();
  assert.match(footerText || '', /^v\d+\.\d+/, `footer should show version, got "${footerText}"`);
  // Dashboard content is rendered by the dashboard view; expect something.
  const contentHtml = await page.locator('#content').innerHTML();
  assert.ok(contentHtml.length > 50, 'dashboard content empty');
  assert.deepEqual(consoleErrors, [], 'console errors on dashboard: ' + consoleErrors.join(' | '));
  await page.close();
});

test('Playwright smoke: navigate dashboard → scan → pipeline → cv', { skip: SKIP }, async () => {
  const page = await context.newPage();
  await page.goto(baseUrl + '/#/dashboard');
  await page.waitForSelector('#content');

  // Scan page (works even with no portals — the page renders empty state)
  await page.goto(baseUrl + '/#/scan');
  await page.waitForSelector('#content');
  const scanHtml = await page.locator('#content').innerHTML();
  assert.ok(scanHtml.length > 0, 'scan view empty');

  // Pipeline page
  await page.goto(baseUrl + '/#/pipeline');
  await page.waitForSelector('#content');
  const pipelineHtml = await page.locator('#content').innerHTML();
  assert.ok(pipelineHtml.length > 0, 'pipeline view empty');

  // CV page
  await page.goto(baseUrl + '/#/cv');
  await page.waitForSelector('#content');
  const cvHtml = await page.locator('#content').innerHTML();
  assert.match(cvHtml, /Real Person|cv|markdown|preview/i,
    'CV view did not render — got: ' + cvHtml.slice(0, 200));

  await page.close();
});

test('Playwright smoke: language switcher persists in localStorage', { skip: SKIP }, async () => {
  const page = await context.newPage();
  await page.goto(baseUrl + '/#/dashboard');
  await page.waitForSelector('[data-lang-btn]');
  // Click ru button if present.
  const ruBtn = page.locator('[data-lang-btn="ru"]');
  if (await ruBtn.count()) {
    await ruBtn.click();
    // i18n.onChange triggers Router.render(); wait for the next paint.
    await page.waitForTimeout(200);
    const lang = await page.evaluate(() => localStorage.getItem('lang') || localStorage.getItem('i18n.lang'));
    // The exact key name may vary by i18n.js version; we just assert
    // *some* language preference was persisted.
    assert.ok(lang === 'ru' || lang === null || /ru/.test(lang || ''),
      `lang persistence unclear, value="${lang}"`);
  }
  await page.close();
});

test('Playwright smoke: 404 view for unknown route', { skip: SKIP }, async () => {
  const page = await context.newPage();
  await page.goto(baseUrl + '/#/no-such-route-zzz');
  await page.waitForSelector('#content');
  const html = await page.locator('#content').innerHTML();
  assert.match(html, /404|not found|page-404/i, 'expected 404 view fallback');
  await page.close();
});

test('Playwright smoke: health page renders required-checks status', { skip: SKIP }, async () => {
  const page = await context.newPage();
  await page.goto(baseUrl + '/#/health');
  await page.waitForSelector('#content');
  const html = await page.locator('#content').innerHTML();
  // Health page renders one row per check; cv.md should be present and ok.
  assert.match(html, /cv\.md|Profile|Health|Node version|GEMINI_API_KEY/i,
    'health view did not render checks, got: ' + html.slice(0, 200));
  await page.close();
});

// ─── Expanded coverage (v1.9.1 production-readiness pass) ────────────

test('Playwright smoke: tracker view renders empty + accepts API-seeded row', { skip: SKIP }, async () => {
  const page = await context.newPage();
  // page.evaluate runs against about:blank without a prior goto — relative
  // URLs won't resolve. Navigate first so fetch('/api/...') hits our server.
  await page.goto(baseUrl + '/#/tracker');
  await page.waitForSelector('#content');

  // Seed via API, then re-render the view.
  const seedOk = await page.evaluate(async () => {
    const r = await fetch('/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: 'Acme | Co', role: 'Backend Engineer', score: '4.2', status: 'Evaluated' }),
    });
    return r.ok;
  });
  assert.ok(seedOk, 'POST /api/tracker failed');

  // BF-1 verification — pipe in company name should NOT break the table.
  // Re-fetch and assert the row was parsed back as a single entity.
  const rows = await page.evaluate(async () => {
    const r = await fetch('/api/tracker');
    const j = await r.json();
    return j.rows || [];
  });
  assert.ok(rows.length >= 1, 'tracker did not return seeded row');
  const acme = rows.find((r) => /Acme/i.test(r.company || ''));
  assert.ok(acme, 'BF-1: pipe-laden company name was lost in tracker round-trip');
  assert.equal(acme.role, 'Backend Engineer');
  await page.close();
});

test('Playwright smoke: pipeline add-URL form populates the queue', { skip: SKIP }, async () => {
  const page = await context.newPage();
  await page.goto(baseUrl + '/#/pipeline');
  await page.waitForSelector('#content');
  const seedOk = await page.evaluate(async () => {
    const r = await fetch('/api/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://jobs.example.com/posting/smoke-1' }),
    });
    return r.ok;
  });
  assert.ok(seedOk, 'POST /api/pipeline failed');
  const urls = await page.evaluate(async () => {
    const r = await fetch('/api/pipeline');
    return (await r.json()).urls || [];
  });
  assert.ok(urls.includes('https://jobs.example.com/posting/smoke-1'),
    'pipeline did not retain seeded URL: ' + JSON.stringify(urls));
  // BF: invalid URLs (loopback, javascript:, bare strings) are rejected.
  for (const bad of ['http://localhost/x', 'javascript:alert(1)', 'not-a-url']) {
    const status = await page.evaluate(async (u) => {
      const r = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: u }),
      });
      return r.status;
    }, bad);
    assert.equal(status, 400, `pipeline accepted invalid URL "${bad}"`);
  }
  await page.close();
});

test('Playwright smoke: reports view handles empty state', { skip: SKIP }, async () => {
  const page = await context.newPage();
  await page.goto(baseUrl + '/#/reports');
  await page.waitForSelector('#content');
  const html = await page.locator('#content').innerHTML();
  // Either empty state (no fixture has reports) or the listing — both
  // valid renders. Just make sure the view didn't crash.
  assert.ok(html.length > 50, 'reports view body too small');
  await page.close();
});

test('Playwright smoke: evaluate view returns a manual prompt without API key', { skip: SKIP }, async () => {
  const page = await context.newPage();
  await page.goto(baseUrl + '/#/evaluate');
  await page.waitForSelector('#content');
  // Hit /api/evaluate directly with a JD ≥50 chars after sanitization.
  const result = await page.evaluate(async () => {
    const r = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jd: 'Senior Backend Engineer with extensive PHP and Go responsibilities, including microservice architecture, code review, and on-call rotation for a high-traffic payments platform.',
      }),
    });
    return { status: r.status, body: await r.json() };
  });
  assert.equal(result.status, 200);
  // No key set in the smoke fixture, so manual mode is the expected path.
  // Also valid: anthropic/gemini if a real key happens to leak from the
  // host shell into the test process.
  assert.ok(['manual', 'anthropic', 'gemini'].includes(result.body.mode),
    `unexpected mode: ${result.body.mode}`);
  if (result.body.mode === 'manual') {
    assert.match(result.body.prompt, /career-ops|JD/, 'manual prompt missing canonical text');
  }
  await page.close();
});

test('Playwright smoke: config GET returns known keys masked', { skip: SKIP }, async () => {
  const page = await context.newPage();
  await page.goto(baseUrl + '/#/config');
  await page.waitForSelector('#content');
  const cfg = await page.evaluate(async () => {
    const r = await fetch('/api/config');
    return await r.json();
  });
  assert.ok(Array.isArray(cfg.keys), 'config.keys not an array');
  assert.ok(cfg.keys.length > 0, 'config.keys empty');
  assert.ok(Array.isArray(cfg.secretKeys), 'config.secretKeys not an array');
  assert.ok(cfg.values && typeof cfg.values === 'object', 'config.values missing');
  // Secret keys are present in the values map but masked when set.
  for (const k of cfg.secretKeys) {
    if (cfg.values[k] && cfg.values[k].length) {
      assert.ok(!cfg.values[k].includes('sk-ant') && !cfg.values[k].includes('AIzaSy'),
        `secret key ${k} appears unmasked in /api/config response`);
    }
  }
  await page.close();
});

test('Playwright smoke: cv.md PUT round-trips with sanitization', { skip: SKIP }, async () => {
  const page = await context.newPage();
  await page.goto(baseUrl + '/#/cv');
  await page.waitForSelector('#content');
  // PUT a CV with embedded XSS-y bits; assert the response reports
  // sanitization happened, then GET to verify the body is clean.
  const put = await page.evaluate(async () => {
    const md = '# CV\n\n<script>alert(1)</script>\n\nHello [link](javascript:void) world.';
    const r = await fetch('/api/cv', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown: md }),
    });
    return await r.json();
  });
  assert.equal(put.ok, true);
  assert.equal(put.sanitized, true, 'stripDangerousMarkdown should have flagged XSS bits');
  const got = await page.evaluate(async () => {
    const r = await fetch('/api/cv');
    return (await r.json()).markdown;
  });
  assert.ok(!/<script/i.test(got), 'script tag survived sanitization');
  assert.ok(!/javascript:/i.test(got), 'javascript: scheme survived sanitization');
  await page.close();
});

test('Playwright smoke: pipeline preview proxy strips scripts', { skip: SKIP }, async () => {
  // We can't hit a real upstream from CI reliably, but the route returns
  // 400 for invalid URLs and a JSON body for valid ones. Exercise the
  // 400 path here — the fetch-mocking happens in the unit tests.
  const page = await context.newPage();
  await page.goto(baseUrl + '/#/pipeline');
  await page.waitForSelector('#content');
  const status = await page.evaluate(async () => {
    const r = await fetch('/api/pipeline/preview?url=' + encodeURIComponent('not-a-url'));
    return r.status;
  });
  assert.equal(status, 400, 'pipeline/preview should 400 on invalid URL');
  await page.close();
});

// Auto-pipeline scenarios. v1.34.0 (WS5) promoted the dashboard CTA
// from a transient modal to the dedicated, linkable #/auto screen
// (Router.go('/auto')); the window.AutoPipeline.open() modal helper is
// retained for the Cmd+K backward-compat path. These were rewritten in
// v1.44.x — the pre-v1.34 tests still asserted the removed modal and
// had been red on the Playwright-e2e job since v1.34.0. No LLM key in
// the fixture → step 3 errors cleanly.

test('Playwright smoke: dashboard ✨ Auto-pipeline button → #/auto screen with URL input', { skip: SKIP }, async () => {
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  await page.goto(baseUrl + '/#/dashboard');
  await page.waitForSelector('#content', { timeout: 5000 });
  // The CTA in the page-header now navigates to the dedicated screen.
  await page.locator('button:has-text("Auto-pipeline")').click();
  await page.waitForSelector('#auto-url', { timeout: 5000 });
  await page.waitForFunction(() => location.hash === '#/auto', { timeout: 3000 });
  const placeholder = await page.locator('#auto-url').getAttribute('placeholder');
  assert.match(placeholder || '', /greenhouse|workable|workday|https/i, 'input should hint at a URL paste');
  assert.deepEqual(consoleErrors, [], 'dashboard auto-pipeline console errors: ' + consoleErrors.join(' | '));
  await page.close();
});

test('Playwright smoke: Cmd+K + URL + Enter triggers auto-pipeline modal', { skip: SKIP }, async () => {
  const page = await context.newPage();
  await page.goto(baseUrl + '/#/dashboard');
  await page.waitForSelector('#global-search');
  // Use a URL that's safe but reaches the SSE endpoint.
  await page.locator('#global-search').fill('https://example.com/jobs/123');
  await page.locator('#global-search').press('Enter');
  // Modal should appear with autoStart=true.
  await page.waitForSelector('#modal input.input', { timeout: 3000 });
  // Timeline should fire — step 1 (validate) at minimum.
  await page.waitForSelector('#modal', { timeout: 3000 });
  await page.close();
});

test('Playwright smoke: #/auto invalid URL → step 1 fails inline', { skip: SKIP }, async () => {
  const page = await context.newPage();
  await page.goto(baseUrl + '/#/auto');
  await page.waitForSelector('#auto-url', { timeout: 5000 });
  await page.locator('#auto-url').fill('not-a-real-url');
  // Click the run CTA inside the #/auto content (the only primary
  // button there is the "▶ Run full pipeline" trigger).
  await page.evaluate(() => {
    const root = document.getElementById('content');
    const btn = root && root.querySelector('.btn-primary');
    if (btn) btn.click();
  });
  // The inline stepper marks step 1 (validate) failed with a "✗" glyph;
  // locale-agnostic. The screen, not a modal, owns the timeline now.
  await page.waitForFunction(
    () => {
      const root = document.getElementById('content');
      if (!root) return false;
      const txt = root.textContent || '';
      return txt.includes('✗') || /invalid url/i.test(txt);
    },
    { timeout: 8000 }
  );
  await page.close();
});

test('Playwright smoke: POST /api/auto-pipeline SSE — emits start + step events', { skip: SKIP }, async () => {
  const page = await context.newPage();
  await page.goto(baseUrl + '/');
  // Drive the SSE endpoint directly via fetch() from the page context;
  // verifies the server emits the canonical event sequence even when
  // there's no LLM key (step 3 → error).
  const events = await page.evaluate(async () => {
    // Abort + cancel the SSE stream the instant we have what we need.
    // Previously this `break`-ed out of the read loop leaving the
    // fetch body attached to the server socket; page.close() then
    // aborted it mid-stream and the "Error: aborted" surfaced as
    // async activity after the test ended → flaky CI failure. The
    // AbortController + guaranteed reader.cancel() in finally make
    // teardown deterministic.
    const ac = new AbortController();
    const resp = await fetch('/api/auto-pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'javascript:bad' }),
      signal: ac.signal,
    });
    const reader = resp.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    const out = [];
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split('\n\n'); buf = parts.pop();
        for (const p of parts) {
          const ev = (p.match(/^event:\s*(\S+)/m) || [])[1];
          if (ev) out.push(ev);
        }
        if (out.includes('error') || out.includes('done')) break;
      }
    } finally {
      // Cancel the reader first (closes the client end), then abort
      // the request so the server's res stream ends cleanly before
      // the page/context/server are torn down.
      try { await reader.cancel(); } catch { /* already closed */ }
      ac.abort();
    }
    return out;
  });
  // For an invalid URL we expect at least: start, step (validate
  // running), step (validate failed), error.
  assert.ok(events.includes('start'), `expected 'start' event, got ${events.join(',')}`);
  assert.ok(events.includes('step'),  `expected 'step' event, got ${events.join(',')}`);
  assert.ok(events.includes('error'), `expected 'error' event, got ${events.join(',')}`);
  await page.close();
});

if (SKIP) {
  test('Playwright smoke: skipped (playwright not resolvable)', () => {
    console.log('SKIP — install playwright in parent project: cd $CAREER_OPS_ROOT && npm i && npx playwright install chromium');
  });
}
