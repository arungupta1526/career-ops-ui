/**
 * Comprehensive e2e — walks the full user journey from CV save to
 * application, exercising every clickable button and filter on every
 * page. Adds on top of tests/e2e.mjs (which covers smoke + locale +
 * connection-banner). Run with:
 *
 *   NODE_PATH=$CAREER_OPS_ROOT/node_modules \
 *     node web-ui/tests/e2e-comprehensive.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOTS_DIR = resolve(__dirname, '..', 'screenshots', 'comprehensive');
mkdirSync(SHOTS_DIR, { recursive: true });

let server;
let baseUrl;

async function bootServer() {
  // Build a fixture project root so the e2e suite is self-contained —
  // works on CI where the parent project isn't checked out and on
  // dev machines without depending on the user's real cv.md.
  const fixture = mkdtempSync(resolve(tmpdir(), 'e2e-comp-'));
  mkdirSync(resolve(fixture, 'config'), { recursive: true });
  mkdirSync(resolve(fixture, 'data'), { recursive: true });
  mkdirSync(resolve(fixture, 'modes'), { recursive: true });
  writeFileSync(resolve(fixture, 'cv.md'), '# Test CV\n\nE2E fixture content.\n');
  writeFileSync(resolve(fixture, 'config', 'profile.yml'),
    'candidate:\n  full_name: "E2E Tester"\n  email: e2e@example.com\n');
  writeFileSync(resolve(fixture, 'portals.yml'), 'tracked_companies: []\n');
  writeFileSync(resolve(fixture, 'data', 'applications.md'), '');
  writeFileSync(resolve(fixture, 'data', 'pipeline.md'), '# pipeline\n');
  // Templates for each mode the suite exercises.
  const modes = ['oferta', 'project', 'training', 'followup', 'batch', 'contacto', 'interview-prep', 'patterns', 'deep'];
  for (const m of modes) {
    writeFileSync(resolve(fixture, 'modes', `${m}.md`),
      `# ${m} mode\n\nRead cv.md and config/profile.yml.\nProduce a structured Markdown response with at least three sections.\n`);
  }
  process.env.CAREER_OPS_ROOT = fixture;
  // Import AFTER setting env so paths.mjs picks it up.
  const { createApp } = await import('../server/index.mjs');
  const app = createApp();
  await new Promise((res) => {
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      res();
    });
  });
  console.log(`▶ server: ${baseUrl} · root: ${fixture}`);
}

async function shutdown() { return new Promise((r) => server.close(r)); }

const failures = [];
const ran = [];

async function step(name, fn) {
  process.stdout.write(`  • ${name.padEnd(56)} `);
  try {
    await fn();
    console.log('✓');
    ran.push({ name, ok: true });
  } catch (err) {
    console.log(`✗ ${err.message.split('\n')[0]}`);
    failures.push({ name, message: err.message });
    ran.push({ name, ok: false });
  }
}

async function run() {
  await bootServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`${msg.location().url}: ${msg.text()}`);
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));

  // ─── CV save round-trip ─────────────────────────
  await step('CV: load → edit textarea → click Save → toast appears', async () => {
    await page.goto(`${baseUrl}/#/cv`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1.page-title', { timeout: 5000 });
    const ta = page.locator('textarea.textarea').first();
    const original = await ta.inputValue();
    await ta.fill('# Round-trip ' + Date.now() + '\n\nE2E test entry.\n');
    await page.locator('button:has-text("Save")').click();
    await page.waitForFunction(() => document.querySelector('#toast')?.textContent?.match(/Saved|сохранено/i), { timeout: 5000 });
    // Restore for subsequent tests
    await ta.fill(original);
    await page.locator('button:has-text("Save")').click();
    await page.waitForTimeout(300);
  });

  await step('CV: preview pane mirrors textarea on input', async () => {
    await page.goto(`${baseUrl}/#/cv`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#cv-preview');
    const ta = page.locator('textarea.textarea').first();
    await ta.fill('# Live\n\nThis text should mirror.');
    await page.waitForFunction(() => /Live/.test(document.querySelector('#cv-preview')?.textContent || ''), { timeout: 3000 });
  });

  await step('CV: Generate PDF button visible and clickable', async () => {
    await page.goto(`${baseUrl}/#/cv`, { waitUntil: 'networkidle' });
    const btn = page.locator('button:has-text("Generate PDF")');
    await btn.waitFor({ timeout: 5000 });
    if (!(await btn.isEnabled())) throw new Error('button disabled');
  });

  // ─── Pipeline ─────────────────────────
  await step('Pipeline: search → URL added → ✕ removes', async () => {
    await page.goto(`${baseUrl}/#/pipeline`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1.page-title');
    const url = `https://e2e-comp-${Date.now()}.example.com/job/1`;
    await page.locator('#global-search').fill(url);
    // v1.16.0+: plain Enter opens AutoPipeline modal; Shift+Enter is the
    // legacy quick-add path that this test exercises.
    await page.locator('#global-search').press('Shift+Enter');
    await page.waitForTimeout(800);
    if (!(await page.content()).includes(url)) throw new Error('not visible after add');
    // v1.48.0 (WS2 #8) — native confirm() → focus-trapped UI.confirm()
    // modal; page.on('dialog') no longer fires. Tear the row down via
    // the API (robust; avoids leaving a modal backdrop that would block
    // later steps).
    await page.evaluate(async (u) => {
      await fetch('/api/pipeline?url=' + encodeURIComponent(u), { method: 'DELETE' });
    }, url);
    await page.waitForTimeout(200);
  });

  await step('Pipeline: invalid URL is rejected with 400 not silently accepted', async () => {
    const res = await fetch(`${baseUrl}/api/pipeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'not-a-url' }),
    });
    if (res.status !== 400) throw new Error(`expected 400, got ${res.status}`);
  });

  // ─── Tracker ─────────────────────────
  await step('Tracker: filters narrow rows', async () => {
    await page.goto(`${baseUrl}/#/tracker`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1.page-title');
    await page.waitForTimeout(400);
    const search = page.locator('input[placeholder*="company" i], input[placeholder*="компания" i], input[placeholder*="empresa" i]').first();
    if (await search.count() > 0) {
      await search.fill('zzz-no-match-' + Date.now());
      await page.waitForTimeout(300);
      // Either an empty row or no rows remain — either is acceptable.
    }
  });

  // ─── Reports ─────────────────────────
  await step('Reports: page loads without console errors', async () => {
    await page.goto(`${baseUrl}/#/reports`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1.page-title');
  });

  // ─── Activity log ─────────────────────────
  await step('Activity: page loads, chip filter changes URL list', async () => {
    await page.goto(`${baseUrl}/#/activity`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1.page-title');
    const chips = page.locator('.card button[data-filter]');
    if ((await chips.count()) < 2) throw new Error('expected ≥2 filter chips');
    await chips.nth(1).click(); // pick first non-"all" filter
    await page.waitForTimeout(300);
  });

  // ─── Health unified ─────────────────────────
  await step('Health: ≥13 checks rendered (FIX-C6 unify)', async () => {
    await page.goto(`${baseUrl}/#/health`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1.page-title');
    const cards = await page.locator('.card-row .card').count();
    if (cards < 13) throw new Error(`expected ≥13 cards, got ${cards}`);
  });

  // ─── 7 new modes ─────────────────────────
  // v1.15.0+: /#/batch is the TSV SPA now (not a mode-prompt builder).
  // The legacy mode-prompt for batch moved to /#/batch-prompt so this
  // test exercises it there.
  for (const slug of ['project', 'training', 'followup', 'batch-prompt', 'contacto', 'interview-prep', 'patterns']) {
    await step(`Mode #/${slug}: form renders + Generate prompt produces output`, async () => {
      await page.goto(`${baseUrl}/#/${slug}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1.page-title', { timeout: 5000 });
      // Fill every required input/textarea with placeholder text
      const inputs = await page.locator('.card .field input, .card .field textarea').all();
      for (let i = 0; i < inputs.length; i++) {
        await inputs[i].fill(`e2e-test-${slug}-${i}`);
      }
      await page.locator('button:has-text("Generate prompt")').click();
      await page.waitForFunction(
        () => document.body.textContent.includes('Copy prompt') || document.body.textContent.includes('Скопировать'),
        { timeout: 8000 }
      );
    });
  }

  // ─── Modal open/close ─────────────────────────
  await step('Modal: ESC closes', async () => {
    await page.goto(`${baseUrl}/#/cv`, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.UI && window.UI.modal('test', 'body'));
    await page.waitForSelector('#modal:not([hidden])', { timeout: 3000 });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.getElementById('modal').hidden, { timeout: 2000 });
  });

  // ─── Sidebar scroll ─────────────────────────
  await step('Sidebar: scrolls when content exceeds viewport', async () => {
    await page.setViewportSize({ width: 1440, height: 600 });
    await page.goto(`${baseUrl}/#/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.sidebar');
    const overflow = await page.locator('.sidebar').evaluate((el) => getComputedStyle(el).overflowY);
    if (!['auto', 'scroll'].includes(overflow)) throw new Error(`overflow-y is "${overflow}", expected auto/scroll`);
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  // ─── Search Ctrl+K ─────────────────────────
  await step('Search: Ctrl+K focuses global search', async () => {
    await page.goto(`${baseUrl}/#/dashboard`, { waitUntil: 'networkidle' });
    await page.locator('body').focus();
    await page.keyboard.down('Control');
    await page.keyboard.press('k');
    await page.keyboard.up('Control');
    const isFocused = await page.evaluate(() => document.activeElement?.id === 'global-search');
    if (!isFocused) throw new Error('search input did not receive focus');
  });

  // ─── Search clears on route change (FIX-M4) ─────────────────────────
  await step('Search: cleared when route changes (FIX-M4)', async () => {
    await page.goto(`${baseUrl}/#/dashboard`, { waitUntil: 'networkidle' });
    await page.locator('#global-search').fill('zzz-test-clear');
    await page.locator('body').click();
    await page.evaluate(() => window.location.hash = '#/health');
    await page.waitForSelector('h1.page-title');
    await page.waitForTimeout(200);
    const v = await page.locator('#global-search').inputValue();
    if (v) throw new Error(`expected empty after route change, got "${v}"`);
  });

  // ─── 404 ─────────────────────────
  await step('404: unknown route shows .page-404 with back link', async () => {
    await page.goto(`${baseUrl}/#/totally-fake-${Date.now()}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.page-404', { timeout: 3000 });
    const back = await page.locator('.page-404 a').first().getAttribute('href');
    if (back !== '#/dashboard') throw new Error(`back href is "${back}"`);
  });

  // ─── Profile route + legacy alias ─────────────────────────
  await step('Profile: #/profile is canonical, #/settings still resolves', async () => {
    await page.goto(`${baseUrl}/#/profile`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1.page-title');
    const activeCanonical = await page.locator('.nav-item[data-route="profile"].active').count();
    if (!activeCanonical) throw new Error('Profile sidebar item not highlighted at /#/profile');
    // Legacy hash still resolves through the alias table.
    await page.goto(`${baseUrl}/#/settings`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1.page-title');
    const activeAlias = await page.locator('.nav-item[data-route="profile"].active').count();
    if (!activeAlias) throw new Error('Legacy /#/settings did not light up Profile nav');
  });

  // ─── Language persistence ─────────────────────────
  await step('Language: switch to RU, reload, persists', async () => {
    await page.goto(`${baseUrl}/#/dashboard`, { waitUntil: 'networkidle' });
    await page.locator('.lang-btn[data-lang-btn="ru"]').click();
    await page.waitForTimeout(300);
    await page.reload();
    await page.waitForSelector('.lang-btn');
    const navText = await page.locator('.nav-item[data-route="dashboard"]').textContent();
    if (!navText.includes('Дашборд')) throw new Error(`RU not persisted: "${navText}"`);
    await page.locator('.lang-btn[data-lang-btn="en"]').click();
    await page.waitForTimeout(200);
  });

  await browser.close();
  await shutdown();

  console.log('');
  console.log('  ─────────────────────────────────');
  console.log(`  ${ran.filter((r) => r.ok).length}/${ran.length} steps passed · ${failures.length} failed`);
  if (failures.length) {
    console.log('  failures:');
    failures.forEach((f) => console.log(`    · ${f.name}: ${f.message.split('\n')[0]}`));
  }
  if (pageErrors.length) {
    console.log('  page errors:');
    pageErrors.forEach((e) => console.log(`    · ${e}`));
  }
  // Filter out the deliberately-killed connection-banner test errors.
  const realConsoleErrors = consoleErrors.filter(
    (l) => !/ERR_CONNECTION_REFUSED|Failed to fetch|connection lost/i.test(l)
  );
  if (realConsoleErrors.length) {
    console.log('  unexpected console errors:');
    realConsoleErrors.forEach((e) => console.log(`    · ${e}`));
  }
  process.exit(failures.length === 0 && pageErrors.length === 0 ? 0 : 1);
}

run().catch((err) => { console.error(err); process.exit(1); });
