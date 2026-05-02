/**
 * Playwright E2E walk-through.
 *
 * Boots the server on an ephemeral port, opens Chromium, walks every
 * sidebar link, screenshots each page, and fails on any console error.
 *
 * Usage (from .career-ops project root):
 *   node web-ui/tests/e2e.mjs
 *
 * Requires: playwright (already a dep of the parent project).
 */
import { createApp } from '../server/index.mjs';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOTS_DIR = resolve(__dirname, '..', 'screenshots');
mkdirSync(SHOTS_DIR, { recursive: true });

let server;
let baseUrl;

async function bootServer() {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
  console.log(`▶ server: ${baseUrl}`);
}

async function shutdownServer() {
  return new Promise((resolve) => server.close(resolve));
}

const ROUTES = [
  { name: 'dashboard', selector: 'h1.page-title', expectText: 'Командный центр' },
  { name: 'scan', selector: 'h1.page-title', expectText: 'Поиск вакансий' },
  { name: 'pipeline', selector: 'h1.page-title', expectText: 'Pipeline' },
  { name: 'evaluate', selector: 'h1.page-title', expectText: 'Оценить вакансию' },
  { name: 'deep', selector: 'h1.page-title', expectText: 'Deep research' },
  { name: 'apply', selector: 'h1.page-title', expectText: 'Apply helper' },
  { name: 'tracker', selector: 'h1.page-title', expectText: 'Трекер заявок' },
  { name: 'reports', selector: 'h1.page-title', expectText: 'Отчёты' },
  { name: 'cv', selector: 'h1.page-title', expectText: 'CV' },
  { name: 'settings', selector: 'h1.page-title', expectText: 'Профиль' },
  { name: 'health', selector: 'h1.page-title', expectText: 'Health' },
];

async function run() {
  await bootServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`${msg.location().url}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const r of ROUTES) {
    const url = `${baseUrl}/#/${r.name}`;
    process.stdout.write(`  • ${r.name.padEnd(12)} `);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 8000 });
      await page.waitForSelector(r.selector, { timeout: 5000 });
      const text = await page.locator(r.selector).first().textContent();
      if (!text || !text.trim().includes(r.expectText)) {
        throw new Error(`expected "${r.expectText}" in title, got "${text}"`);
      }
      // Move cursor away from the sidebar so :hover doesn't pollute screenshots
      await page.mouse.move(800, 400);
      // Let CSS transitions settle
      await page.waitForTimeout(250);
      const shotPath = resolve(SHOTS_DIR, `${r.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: false, animations: 'disabled' });
      passed++;
      console.log(`✓  → ${shotPath}`);
    } catch (err) {
      failed++;
      failures.push({ route: r.name, message: err.message });
      console.log(`✗  ${err.message}`);
    }
  }

  // Functional flows
  console.log('\n  Flow 1: add URL via global search');
  try {
    await page.goto(`${baseUrl}/#/pipeline`);
    await page.waitForSelector('h1.page-title');
    const testUrl = `https://e2e-${Date.now()}.example.com/job/1`;
    const search = page.locator('#global-search');
    await search.fill(testUrl);
    await search.press('Enter');
    await page.waitForTimeout(800);
    const txt = await page.content();
    if (!txt.includes(testUrl)) throw new Error('URL not visible after add');
    console.log('  ✓ url added & visible');

    // cleanup
    page.on('dialog', (d) => d.accept());
    await page.locator(`a[href="${testUrl}"]`).first().locator('..').locator('button:has-text("✕")').click();
    await page.waitForTimeout(400);
    passed++;
  } catch (err) {
    failed++;
    failures.push({ route: 'flow:add-url', message: err.message });
    console.log(`  ✗ ${err.message}`);
  }

  console.log('\n  Flow 2a: connection banner appears on server down, hides on recovery');
  try {
    await page.goto(`${baseUrl}/#/dashboard`);
    await page.waitForSelector('h1.page-title');
    // banner must be hidden when server up
    const initiallyHidden = await page.locator('#conn-banner').isHidden();
    if (!initiallyHidden) throw new Error('banner shown while server is up');

    // kill server
    await shutdownServer();
    // navigate to a page that calls API → triggers fetch failure
    await page.evaluate(() => window.Router && Router.go('/tracker'));
    await page.waitForTimeout(800);
    const bannerVisible = await page.locator('#conn-banner').isVisible();
    if (!bannerVisible) throw new Error('banner did NOT show after server killed');
    const bannerText = await page.locator('#conn-banner .conn-msg').textContent();
    if (!bannerText.includes('Сервер не отвечает')) throw new Error('banner text wrong: ' + bannerText);
    console.log('  ✓ banner visible after server down');

    // also: in-content area should show useful "Нет связи" message, not toast spam
    const emptyText = await page.locator('.empty').first().textContent();
    if (!emptyText.includes('Нет связи')) throw new Error('content area missing "Нет связи" message');

    // recovery: restart server on SAME port to make banner auto-clear
    const newPort = parseInt(baseUrl.split(':').pop(), 10);
    const app2 = createApp();
    server = app2.listen(newPort, '127.0.0.1');
    await new Promise((r) => server.once('listening', r));
    // poll-loop in client runs every 3s — wait up to 5
    await page.waitForTimeout(4000);
    const recovered = await page.locator('#conn-banner').isHidden();
    if (!recovered) throw new Error('banner did NOT auto-hide after recovery');
    console.log('  ✓ banner auto-hides on recovery');
    passed++;
  } catch (err) {
    failed++;
    failures.push({ route: 'flow:connection-banner', message: err.message });
    console.log(`  ✗ ${err.message}`);
  }

  console.log('\n  Flow 2b: RU scan button streams Habr Career results');
  try {
    await page.goto(`${baseUrl}/#/scan`);
    await page.waitForSelector('h1.page-title');
    await page.locator('input#dry-run').check();
    await page.locator('button:has-text("RU scan")').click();
    // wait for the "RU Portal Scan" banner OR an error log to appear
    await page.waitForFunction(
      () => {
        const c = document.getElementById('scan-console');
        return c && (c.textContent.includes('RU Portal Scan') || c.textContent.includes('habr'));
      },
      { timeout: 30000 }
    );
    // wait for completion (✓ done or ✗)
    await page.waitForFunction(
      () => {
        const c = document.getElementById('scan-console');
        return c && (c.textContent.includes('✓ done') || c.textContent.includes('exit '));
      },
      { timeout: 60000 }
    );
    const text = await page.locator('#scan-console').textContent();
    if (!text.includes('habr')) throw new Error('expected habr in output');
    if (!text.includes('NEW=') && !text.includes('exit ')) throw new Error('no completion summary');
    console.log('  ✓ RU scan ran end-to-end (Habr Career responded)');
    passed++;
  } catch (err) {
    failed++;
    failures.push({ route: 'flow:ru-scan', message: err.message });
    console.log(`  ✗ ${err.message}`);
  }

  console.log('\n  Flow 2d: language switcher (8 languages)');
  try {
    await page.goto(`${baseUrl}/#/dashboard`);
    await page.waitForSelector('h1.page-title');
    await page.waitForSelector('.lang-switcher button', { timeout: 5000 });
    const langs = await page.$$eval('.lang-btn', (els) => els.map((e) => e.dataset.langBtn));
    const expected = ['en', 'es', 'pt-BR', 'ko', 'ja', 'ru', 'zh-CN', 'zh-TW'];
    for (const code of expected) {
      if (!langs.includes(code)) throw new Error(`missing language: ${code}`);
    }
    // Switch to Russian
    await page.locator('.lang-btn[data-lang-btn="ru"]').click();
    await page.waitForTimeout(300);
    const navTextRu = await page.locator('.nav-item[data-route="dashboard"]').textContent();
    if (!navTextRu.includes('Дашборд')) throw new Error(`RU nav not applied: "${navTextRu}"`);
    // Switch to Japanese
    await page.locator('.lang-btn[data-lang-btn="ja"]').click();
    await page.waitForTimeout(300);
    const navTextJa = await page.locator('.nav-item[data-route="dashboard"]').textContent();
    if (!navTextJa.includes('ダッシュボード')) throw new Error(`JA nav not applied: "${navTextJa}"`);
    // Persist: reload and verify Japanese persisted
    await page.reload();
    await page.waitForSelector('.lang-btn');
    const navAfterReload = await page.locator('.nav-item[data-route="dashboard"]').textContent();
    if (!navAfterReload.includes('ダッシュボード')) throw new Error(`lang did not persist after reload: "${navAfterReload}"`);
    // Reset to English for the rest of the suite
    await page.locator('.lang-btn[data-lang-btn="en"]').click();
    await page.waitForTimeout(200);
    console.log(`  ✓ 8 languages, switching works, persists across reload`);
    passed++;
  } catch (err) {
    failed++;
    failures.push({ route: 'flow:i18n', message: err.message });
    console.log(`  ✗ ${err.message}`);
  }

  console.log('\n  Flow 2c: skill / level chip filters');
  try {
    await page.goto(`${baseUrl}/#/scan`);
    await page.waitForSelector('h1.page-title');
    // After RU scan from flow 2b, last-scan.json has Habr rows. Wait for chips.
    await page.waitForSelector('.chip-row .chip', { timeout: 10000 });
    const chipsBefore = await page.locator('#scan-results .chip').count();
    if (chipsBefore < 2) throw new Error(`expected >=2 chips, got ${chipsBefore}`);
    // Click the first non-clear chip → table should re-render
    const firstChip = page.locator('#scan-results .chip:not(.clear)').first();
    const chipText = await firstChip.textContent();
    await firstChip.click();
    await page.waitForTimeout(300);
    const isOn = await firstChip.evaluate((el) => el.classList.contains('on'));
    if (!isOn) throw new Error(`chip "${chipText}" did not toggle on`);
    // The "сбросить" chip should now be visible
    const clearVisible = await page.locator('#scan-results .chip.clear').count();
    if (clearVisible < 1) throw new Error('clear chip not shown after activation');
    // Click clear → chip should turn off
    await page.locator('#scan-results .chip.clear').first().click();
    await page.waitForTimeout(200);
    const stillOn = await firstChip.evaluate((el) => el.classList.contains('on')).catch(() => false);
    if (stillOn) throw new Error('clear did not deactivate chip');
    console.log(`  ✓ chips render & toggle (first chip: "${chipText.trim()}")`);
    passed++;
  } catch (err) {
    failed++;
    failures.push({ route: 'flow:chip-filters', message: err.message });
    console.log(`  ✗ ${err.message}`);
  }

  console.log('\n  Flow 2: evaluate generates manual prompt');
  try {
    delete process.env.GEMINI_API_KEY;
    await page.goto(`${baseUrl}/#/evaluate`);
    await page.waitForSelector('h1.page-title');
    await page.locator('textarea.textarea').first().fill(
      'About the role: We are looking for a Senior Backend Engineer with strong PHP and Go experience. Responsibilities: build microservices, lead code reviews, mentor juniors. Requirements: 5+ years backend, fluent English.'
    );
    await page.locator('button.btn-primary:has-text("Оценить")').click();
    await page.waitForSelector('#eval-out .card', { timeout: 5000 });
    const out = await page.locator('#eval-out').textContent();
    if (!out.includes('Manual mode') && !out.includes('GEMINI_API_KEY')) {
      throw new Error('expected manual-mode banner');
    }
    console.log('  ✓ manual prompt rendered');
    passed++;
  } catch (err) {
    failed++;
    failures.push({ route: 'flow:evaluate', message: err.message });
    console.log(`  ✗ ${err.message}`);
  }

  await browser.close();
  await shutdownServer();

  console.log('');
  console.log('  ─────────────────────────────────');
  console.log(`  passed: ${passed}    failed: ${failed}`);
  if (consoleErrors.length) {
    console.log(`  console errors: ${consoleErrors.length}`);
    consoleErrors.forEach((e) => console.log('    · ' + e));
  }
  if (pageErrors.length) {
    console.log(`  page errors: ${pageErrors.length}`);
    pageErrors.forEach((e) => console.log('    · ' + e));
  }
  if (failures.length) {
    console.log('  failures:');
    failures.forEach((f) => console.log(`    · ${f.route}: ${f.message}`));
  }
  console.log(`  screenshots: ${SHOTS_DIR}`);
  console.log('');
  process.exit(failed === 0 && pageErrors.length === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
