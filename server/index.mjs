/**
 * career-ops web UI — Express server
 *
 * Serves the Airbnb-styled SPA from /public and exposes /api/* endpoints
 * that wrap the underlying career-ops Node scripts and data files.
 *
 * Run from the web-ui/ folder:
 *   node server/index.mjs
 *
 * Env:
 *   PORT       (default 4317)
 *   HOST       (default 127.0.0.1)
 *   GEMINI_API_KEY   forwarded to gemini-eval.mjs if present
 */
import express from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import yaml from 'js-yaml';
import { PATHS, PROJECT_ROOT, PUBLIC_DIR, WEB_UI_ROOT, path as projPath } from './lib/paths.mjs';
import {
  parseApplications,
  parsePipeline,
  addPipelineUrl,
  removePipelineUrl,
  parseReportHeader,
  slugify,
  today,
} from './lib/parsers.mjs';
import { runNodeScript } from './lib/runner.mjs';
import { registerScanRoutes } from './lib/routes/scan.mjs';
import { registerRunnerRoutes } from './lib/routes/runners.mjs';
import { registerContentRoutes } from './lib/routes/content.mjs';
import { activityMiddleware, readActivity, logActivity } from './lib/activity-log.mjs';
import { loadEnvFile } from './lib/dotenv.mjs';
import { runAnthropic, hasAnthropicKey, hasGeminiKey } from './lib/anthropic.mjs';
import { KNOWN_KEYS, SECRET_KEYS, parseEnv, maskSecret, validateConfig, updateEnvFile } from './lib/env-config.mjs';
import {
  isValidJobUrl,
  isPubliclyExposed,
  sanitizeJobDescription,
  stripDangerousMarkdown,
} from './lib/security.mjs';
import {
  bundleProjectContext,
  buildModePrompt,
  buildEvaluationPrompt,
  buildDeepPrompt,
  buildApplyChecklist,
} from './lib/prompts.mjs';
import {
  safeReadApps,
  safeReadPipeline,
  safeListReports,
  checkProfileCustomized,
  ensureRussianPortalsDefaults,
} from './lib/store.mjs';

// Re-exports preserved for backward compatibility — earlier tests
// (and any external consumers) imported these from server/index.mjs.
// New code should import from the lib/ modules directly.
export { isValidJobUrl, sanitizeJobDescription, stripDangerousMarkdown };

// Load parent's .env (HH_USER_AGENT, GEMINI_API_KEY, …) BEFORE createApp
// runs so health checks and scanner config see the real values.
loadEnvFile(PATHS.envFile);

export function createApp() {
  ensureRussianPortalsDefaults();
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use(express.text({ limit: '5mb', type: ['text/plain', 'text/markdown'] }));

  // ──────────────── Security headers ────────────────
  // Always-on baseline (cheap, no breakage). CSP is layered on top when the
  // server is exposed beyond loopback (HOST=0.0.0.0) — that's the only case
  // where exfiltration via XSS becomes reachable from a LAN attacker.
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'same-origin');
    if (isPubliclyExposed()) {
      // default-src 'self' covers img-src/script-src/connect-src etc.;
      // explicit allowlists below loosen only what the SPA needs:
      //   - Google Fonts CSS at fonts.googleapis.com
      //   - Google Fonts WOFF2 at fonts.gstatic.com
      //   - inline style="..." attrs in router error template (style-src 'unsafe-inline')
      //   - inline favicon as data: URI (img-src 'self' data:)
      // 'unsafe-inline' is intentionally NOT in script-src — all event
      // handlers were moved to addEventListener.
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data:",
          "connect-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "frame-ancestors 'none'",
          "form-action 'self'",
        ].join('; ')
      );
    }
    next();
  });

  // Activity log — records every state-changing request so the UI can show
  // a history page. Must come BEFORE express.static so the same middleware
  // covers both API and asset routes (asset GETs are filtered out).
  app.use(activityMiddleware);

  app.use(express.static(PUBLIC_DIR));

  // ───────────────────────────── App config (parent .env) ─────────────────────────────
  // These two endpoints back the /#/config page. Writes go to the
  // parent project's .env so career-ops scripts AND web-ui pick the
  // values up the next time they read process.env.

  app.get('/api/config', (_req, res) => {
    let parsed = {};
    if (existsSync(PATHS.envFile)) {
      try { parsed = parseEnv(readFileSync(PATHS.envFile, 'utf8')); } catch {}
    }
    const out = {};
    for (const k of KNOWN_KEYS) {
      const live = process.env[k];
      // Prefer the on-disk value (what the user just saved); fall back
      // to whatever's currently in process.env (set via shell).
      const v = parsed[k] !== undefined ? parsed[k] : live;
      out[k] = SECRET_KEYS.has(k) ? maskSecret(v) : (v || '');
    }
    res.json({ envFile: PATHS.envFile, keys: KNOWN_KEYS, secretKeys: [...SECRET_KEYS], values: out });
  });

  app.post('/api/config', (req, res) => {
    const body = req.body || {};
    const v = validateConfig(body);
    if (!v.ok) return res.status(400).json({ error: 'validation failed', details: v.errors });
    // Filter to known keys only — never write attacker-supplied env vars.
    const safe = {};
    for (const k of KNOWN_KEYS) {
      if (Object.prototype.hasOwnProperty.call(body, k)) safe[k] = body[k];
    }
    try {
      mkdirSync(dirname(PATHS.envFile), { recursive: true });
    } catch {}
    const written = updateEnvFile(PATHS.envFile, safe);
    // Apply to the running process so the change takes effect immediately
    // (no restart needed). Iterate the SAFE map (not just written) so
    // empty-string requests delete the corresponding process.env var
    // even though updateEnvFile reports them as "deleted" rather than
    // "written".
    for (const [k, v] of Object.entries(safe)) {
      if (v === '' || v == null) delete process.env[k];
      else process.env[k] = v;
    }
    res.json({ ok: true, written });
  });

  // ───────────────────────────── Help ─────────────────────────────
  // Serves the Markdown user guide. Lives in web-ui/docs/help/{lang}.md.
  // Falls back to the English file if the requested locale is missing.

  app.get('/api/help/:lang', (req, res) => {
    const safeLang = req.params.lang.replace(/[^a-zA-Z0-9_-]/g, '');
    const helpDir = resolve(WEB_UI_ROOT, 'docs', 'help');
    const candidates = [`${safeLang}.md`, 'en.md'];
    for (const fname of candidates) {
      const full = resolve(helpDir, fname);
      if (existsSync(full)) {
        res.json({ lang: fname.replace(/\.md$/, ''), markdown: readFileSync(full, 'utf8') });
        return;
      }
    }
    res.status(404).json({ error: 'help docs not found' });
  });

  // ───────────────────────────── Activity log ─────────────────────────────

  app.get('/api/activity', (req, res) => {
    const limit = Number.parseInt(req.query.limit, 10) || 200;
    const prefix = typeof req.query.type === 'string' ? req.query.type : undefined;
    res.json({ events: readActivity({ limit, actionPrefix: prefix }) });
  });

  // ───────────────────────────── Health & Dashboard ─────────────────────────────

  app.get('/api/health', async (_req, res) => {
    const checks = [];
    // When the UI is exposed beyond loopback, anyone on the LAN can hit
    // /api/health. We strip absolute paths and exact Node versions from
    // the response so a curious neighbor can't fingerprint the host.
    const hidden = isPubliclyExposed() ? 'hidden' : null;
    // Required checks — system can't function without these
    checks.push({ name: 'Node version', required: true, ok: parseInt(process.versions.node) >= 18, value: hidden ?? `v${process.versions.node}` });
    checks.push({ name: 'Project root', required: true, ok: existsSync(PROJECT_ROOT), value: hidden ?? PROJECT_ROOT });
    checks.push({ name: 'cv.md', required: true, ok: existsSync(PATHS.cv) });
    checks.push({ name: 'config/profile.yml', required: true, ok: existsSync(PATHS.profile) });
    checks.push({ name: 'portals.yml', required: true, ok: existsSync(PATHS.portals) });
    checks.push({ name: 'data/applications.md', required: true, ok: existsSync(PATHS.applications) });
    checks.push({ name: 'data/pipeline.md', required: true, ok: existsSync(PATHS.pipeline) });
    checks.push({ name: 'modes/oferta.md', required: true, ok: existsSync(projPath('modes', 'oferta.md')) });
    // FIX-H6 — flag fresh installs that still have placeholder profile data.
    // Marked optional (required:false) so a half-set-up project doesn't
    // make `body.ok === false` system-wide; the Health page still shows
    // a visible warning badge thanks to the optional/warn rendering path.
    const profileCustomized = checkProfileCustomized();
    checks.push({
      name: 'Profile customized',
      required: false,
      ok: profileCustomized.ok,
      value: hidden ?? profileCustomized.value,
    });

    // Optional — UI works fine without these
    checks.push({ name: 'GEMINI_API_KEY', required: false, ok: !!process.env.GEMINI_API_KEY, value: process.env.GEMINI_API_KEY ? 'set' : 'unset (manual mode)' });
    checks.push({ name: 'ANTHROPIC_API_KEY', required: false, ok: !!process.env.ANTHROPIC_API_KEY, value: process.env.ANTHROPIC_API_KEY ? 'set' : 'unset (set to enable live "Run" buttons)' });
    // FIX-H1 — surface hh.ru anti-bot gate as an optional setup hint.
    checks.push({ name: 'HH_USER_AGENT', required: false, ok: !!process.env.HH_USER_AGENT, value: process.env.HH_USER_AGENT ? 'set' : 'unset (hh.ru may 403 from non-RU IPs)' });
    // Playwright lives in the parent project — required for PDF generation
    // and liveness checks. We don't install it (parent is off-limits), but
    // we surface the gap so the user knows why those buttons error out.
    const playwrightInstalled = existsSync(projPath('node_modules', 'playwright'));
    checks.push({ name: 'Playwright (parent node_modules)', required: false, ok: playwrightInstalled, value: playwrightInstalled ? 'installed' : 'run: cd $CAREER_OPS_ROOT && npm install && npx playwright install chromium' });
    // Same gate for the parent's own deps — scan.mjs / pdf-gen / liveness
    // all crash with ERR_MODULE_NOT_FOUND when these are missing.
    const parentDepsInstalled = existsSync(projPath('node_modules', 'js-yaml'));
    checks.push({ name: 'Parent project dependencies', required: false, ok: parentDepsInstalled, value: parentDepsInstalled ? 'installed' : 'run: cd $CAREER_OPS_ROOT && npm install' });
    // FIX-C6 — directories the scripts write into. We don't fail when they
    // are missing (auto-created on first write) but surface the state so
    // the Health page mirrors what `node doctor.mjs` would report.
    for (const [label, dir] of [
      ['data/ directory',    PATHS.applications.replace(/\/applications\.md$/, '')],
      ['reports/ directory', PATHS.reportsDir],
      ['output/ directory',  PATHS.outputDir],
      ['jds/ directory',     PATHS.jdsDir],
    ]) {
      checks.push({ name: label, required: false, ok: existsSync(dir), value: hidden ?? (existsSync(dir) ? 'exists' : 'will be auto-created on first write') });
    }

    // The footer shows the WEB-UI version (this repo's package.json),
    // not the parent project's VERSION file — those drift independently
    // and the footer is about "what UI am I running?".
    let version = '?';
    let parentVersion = null;
    try {
      const pkg = JSON.parse(readFileSync(resolve(WEB_UI_ROOT, 'package.json'), 'utf8'));
      version = pkg.version || '?';
    } catch {}
    try {
      parentVersion = readFileSync(PATHS.version, 'utf8').trim();
    } catch {}
    // ok = all REQUIRED checks pass. Optional misses are warnings only.
    const ok = checks.filter((c) => c.required).every((c) => c.ok);
    const warnings = checks.filter((c) => !c.required && !c.ok).length;
    res.json({ ok, warnings, version, parentVersion, checks });
  });

  app.get('/api/dashboard', (_req, res) => {
    const apps = safeReadApps();
    const pipeline = safeReadPipeline();
    const reports = safeListReports();

    const byStatus = {};
    let totalScore = 0;
    let scored = 0;
    for (const a of apps) {
      const s = (a.status || 'Unknown').trim();
      byStatus[s] = (byStatus[s] || 0) + 1;
      if (typeof a.scoreNum === 'number') {
        totalScore += a.scoreNum;
        scored += 1;
      }
    }

    const recent = apps.slice(-5).reverse();
    res.json({
      counts: {
        applications: apps.length,
        pipeline: pipeline.length,
        reports: reports.length,
      },
      avgScore: scored ? +(totalScore / scored).toFixed(2) : null,
      byStatus,
      recent,
      pipeline: pipeline.slice(0, 10),
      lastReport: reports[0] || null,
    });
  });

  // ───────────────────────────── Tracker ─────────────────────────────

  app.get('/api/tracker', (_req, res) => {
    res.json({ rows: safeReadApps() });
  });

  // POST a row to data/applications.md. Bridges the "scan → evaluate →
  // save report → add to tracker" loop into the UI. No-op for duplicates
  // (same company + role) so users can't accidentally bloat the tracker.
  app.post('/api/tracker', (req, res) => {
    const { company, role, score, status, url, reportSlug, notes, date } = req.body || {};
    if (!company || !role) {
      return res.status(400).json({ error: 'company and role are required' });
    }
    const ALLOWED_STATUSES = ['Evaluated', 'Applied', 'Responded', 'Interview', 'Offer', 'Rejected', 'Discarded', 'SKIP'];
    const safeStatus = ALLOWED_STATUSES.includes(status) ? status : 'Evaluated';
    const safeScore = (score && /^[\d.]+\/?5?$/.test(String(score))) ? String(score).replace(/\/5$/, '') + '/5' : '—';
    const safeDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today();
    const safeReport = reportSlug ? `[${reportSlug}](reports/${reportSlug.replace(/^reports\//, '').replace(/\.md$/, '')}.md)` : '';
    const safeNotes = String(notes || '').replace(/\|/g, '\\|').slice(0, 200) || (url ? url : '');

    let content = '';
    try { content = readFileSync(PATHS.applications, 'utf8'); } catch { content = ''; }
    // Dedup: skip if same company + role already present (case-insensitive).
    const existing = parseApplications(content);
    const dup = existing.find((r) => (r.company || '').toLowerCase() === company.toLowerCase()
      && (r.role || '').toLowerCase() === role.toLowerCase());
    if (dup) {
      return res.json({ ok: true, deduped: true, existingNum: dup.num });
    }

    // Compute next #
    const nextNum = String((Math.max(0, ...existing.map((r) => parseInt(r.num, 10) || 0))) + 1).padStart(3, '0');

    // Build the row using the existing column order:
    //   # | Date | Company | Role | Score | Status | PDF | Report | Notes
    const row = `| ${nextNum} | ${safeDate} | ${company} | ${role} | ${safeScore} | ${safeStatus} | ❌ | ${safeReport} | ${safeNotes} |`;

    let updated;
    if (!content || !/^\|\s*#/m.test(content)) {
      // Empty file or no table yet — bootstrap with header.
      updated = [
        '# Applications Tracker',
        '',
        '| # | Date | Company | Role | Score | Status | PDF | Report | Notes |',
        '|---|------|---------|------|-------|--------|-----|--------|-------|',
        row,
        '',
      ].join('\n');
    } else {
      // Append to the end of the existing table — match trailing newlines.
      updated = content.replace(/\n*$/, '\n') + row + '\n';
    }
    mkdirSync(projPath('data'), { recursive: true });
    writeFileSync(PATHS.applications, updated);
    res.json({ ok: true, num: nextNum });
  });

  // ───────────────────────────── Pipeline ─────────────────────────────

  app.get('/api/pipeline', (_req, res) => {
    res.json({ urls: safeReadPipeline() });
  });

  app.post('/api/pipeline', (req, res) => {
    const url = (req.body?.url || req.body?.text || '').toString().trim();
    if (!url) return res.status(400).json({ error: 'url required' });
    if (!isValidJobUrl(url)) {
      return res.status(400).json({ error: 'invalid url (must be http/https, no script/template chars)' });
    }
    let content = '';
    try {
      content = readFileSync(PATHS.pipeline, 'utf8');
    } catch {
      content = '';
    }
    const before = parsePipeline(content);
    const deduped = before.includes(url);
    const updated = addPipelineUrl(content, url);
    mkdirSync(projPath('data'), { recursive: true });
    writeFileSync(PATHS.pipeline, updated);
    res.json({ ok: true, deduped, urls: parsePipeline(updated) });
  });

  // Server-side fetch proxy for the pipeline preview pane. Most ATS
  // boards (Greenhouse, Ashby, Lever) don't send CORS headers, so the
  // browser can't read them directly; we fetch on the server and return
  // a stripped text snippet (script/style removed, whitespace squashed).
  // The validator in isValidJobUrl() already gates inputs to http(s)
  // non-loopback hosts, so SSRF surface is small.
  app.get('/api/pipeline/preview', async (req, res) => {
    const url = (req.query.url || '').toString();
    if (!isValidJobUrl(url)) return res.status(400).json({ error: 'invalid url' });
    try {
      // REVIEW-B1 — Walk redirects manually so every hop passes
      // isValidJobUrl(). `redirect: 'follow'` would silently allow a
      // hostile board to bounce us to localhost / a private IP / a
      // file:// URL. Cap at 3 hops to mirror typical ATS behavior.
      const MAX_REDIRECTS = 3;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15_000);
      let current = url;
      let upstream;
      let hops = 0;
      while (true) {
        upstream = await fetch(current, {
          signal: ctrl.signal,
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (career-ops-ui preview) AppleWebKit/537.36',
            Accept: 'text/html,application/xhtml+xml',
          },
        });
        const isRedirect = upstream.status >= 300 && upstream.status < 400 && upstream.headers.get('location');
        if (!isRedirect) break;
        if (++hops > MAX_REDIRECTS) {
          clearTimeout(timer);
          return res.json({ status: upstream.status, text: `(too many redirects: >${MAX_REDIRECTS})` });
        }
        const next = new URL(upstream.headers.get('location'), current).toString();
        if (!isValidJobUrl(next)) {
          clearTimeout(timer);
          return res.json({ status: upstream.status, text: `(unsafe redirect target rejected)` });
        }
        current = next;
      }
      clearTimeout(timer);
      if (!upstream.ok) {
        return res.json({ status: upstream.status, text: '(HTTP ' + upstream.status + ')' });
      }
      const html = await upstream.text();
      // Strip scripts, styles, and HTML tags; cap at 8 KB so big pages
      // don't bloat the response.
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n+/g, '\n\n')
        .trim()
        .slice(0, 8000);
      res.json({ status: upstream.status, text });
    } catch (e) {
      res.json({ status: 0, text: '(' + (e.name === 'AbortError' ? 'timeout' : e.message) + ')' });
    }
  });

  app.delete('/api/pipeline', (req, res) => {
    const url = (req.query.url || '').toString();
    if (!url) return res.status(400).json({ error: 'url required' });
    let content = '';
    try {
      content = readFileSync(PATHS.pipeline, 'utf8');
    } catch {
      return res.status(404).json({ error: 'pipeline not found' });
    }
    writeFileSync(PATHS.pipeline, removePipelineUrl(content, url));
    res.json({ ok: true });
  });

  // ───────────────────────────── Reports ─────────────────────────────

  app.get('/api/reports', (_req, res) => {
    res.json({ reports: safeListReports() });
  });

  app.get('/api/reports/:slug', (req, res) => {
    const slug = req.params.slug.replace(/[^\w\-.]/g, '');
    const file = projPath('reports', slug.endsWith('.md') ? slug : `${slug}.md`);
    if (!existsSync(file)) return res.status(404).json({ error: 'not found' });
    const text = readFileSync(file, 'utf8');
    res.json({ slug, ...parseReportHeader(text), markdown: text });
  });

  // ───────────────────────────── JDs (job descriptions) ─────────────────────────────

  app.get('/api/jds', (_req, res) => {
    if (!existsSync(PATHS.jdsDir)) return res.json({ jds: [] });
    const files = readdirSync(PATHS.jdsDir)
      .filter((f) => f.endsWith('.txt') || f.endsWith('.md'))
      .map((f) => {
        const stat = statSync(projPath('jds', f));
        return { name: f, size: stat.size, mtime: stat.mtime };
      });
    res.json({ jds: files });
  });

  app.get('/api/jds/:name', (req, res) => {
    const name = req.params.name.replace(/[^\w\-.]/g, '');
    const file = projPath('jds', name);
    if (!existsSync(file)) return res.status(404).json({ error: 'not found' });
    res.type('text/plain').send(readFileSync(file, 'utf8'));
  });

  app.delete('/api/jds/:name', (req, res) => {
    // Strip path-traversal characters; require the canonical .txt suffix
    // so we cannot accidentally remove an unrelated file.
    const safe = req.params.name.replace(/[^\w\-.]/g, '');
    if (!safe || !safe.endsWith('.txt')) {
      return res.status(400).json({ error: 'invalid jd name' });
    }
    const file = projPath('jds', safe);
    if (!existsSync(file)) return res.status(404).json({ error: 'not found' });
    unlinkSync(file);
    res.json({ ok: true, deleted: safe });
  });

  app.post('/api/jds', (req, res) => {
    const { text, slug } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text required' });
    let warning = null;
    let safeSlug = null;
    if (slug) {
      safeSlug = slugify(slug);
      if (!safeSlug) {
        return res.status(400).json({ error: 'slug had no usable characters' });
      }
      // Only flag the cases users care about: unsafe characters were
      // stripped. Pure case-folding ("Acme" → "acme") and whitespace
      // collapsing don't deserve a warning.
      const stripped = /[^\w\s-]/.test(slug);
      if (stripped) warning = `slug normalized from "${slug}" to "${safeSlug}"`;
    }
    const name = (safeSlug || `jd-${today()}-${Date.now()}`) + '.txt';
    mkdirSync(PATHS.jdsDir, { recursive: true });
    writeFileSync(projPath('jds', name), text);
    res.json({ ok: true, name, ...(warning ? { warning } : {}) });
  });

  // CV / Profile / Portals / Modes — see lib/routes/content.mjs.
  registerContentRoutes(app);

  // Script runners (buffered + streaming) and generated-PDF list/download
  // live in lib/routes/runners.mjs. Scan routes (RU + EN in-process)
  // live in lib/routes/scan.mjs. P-2 split — the route-module pattern.
  registerRunnerRoutes(app);
  registerScanRoutes(app);

  // ───────────────────────────── Evaluate (Gemini if available, else prompt) ─────────────────────────────

  app.post('/api/evaluate', async (req, res) => {
    const { jd: rawJd, save } = req.body || {};
    const jd = sanitizeJobDescription(rawJd);
    if (!jd || jd.length < 50) {
      return res.status(400).json({ error: 'JD text required (min 50 chars after sanitization)' });
    }

    let saved = null;
    if (save) {
      const name = `jd-${today()}-${Date.now()}.txt`;
      mkdirSync(PATHS.jdsDir, { recursive: true });
      writeFileSync(projPath('jds', name), jd);
      saved = name;
    }

    if (!hasGeminiKey()) {
      const promptText = buildEvaluationPrompt(jd);
      return res.json({
        mode: 'manual',
        message: 'GEMINI_API_KEY not set — copy this prompt into Claude/ChatGPT/Gemini',
        prompt: promptText,
        saved,
      });
    }

    // Use the existing gemini-eval.mjs pipe interface
    const tmpFile = projPath('output', `web-jd-${Date.now()}.txt`);
    mkdirSync(PATHS.outputDir, { recursive: true });
    writeFileSync(tmpFile, jd);
    const result = await runNodeScript('gemini-eval.mjs', ['--file', tmpFile], { timeoutMs: 120_000 });
    res.json({ mode: 'gemini', saved, ...result });
  });

  // Smoke-test endpoint — verify GEMINI_API_KEY is wired up without
  // burning a real evaluation. Only runs when the key is set; returns
  // a small sample of the model's response so the user knows it works.
  app.post('/api/evaluate/test-gemini', async (_req, res) => {
    if (!hasGeminiKey()) {
      return res.status(400).json({ ok: false, error: 'GEMINI_API_KEY not set' });
    }
    const tmp = projPath('output', `gemini-smoke-${Date.now()}.txt`);
    mkdirSync(PATHS.outputDir, { recursive: true });
    // 50-char minimum from /api/evaluate also applies to gemini-eval.mjs
    writeFileSync(tmp, 'Smoke test: Senior Backend Engineer with PHP and Go responsibilities, including microservice ownership and code review duties.');
    try {
      const result = await runNodeScript('gemini-eval.mjs', ['--file', tmp], { timeoutMs: 30_000 });
      const sample = (result.stdout || '').slice(0, 200);
      const ok = result.code === 0 && sample.length > 0;
      res.json({ ok, code: result.code, sampleLength: (result.stdout || '').length, sample });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/deep', async (req, res) => {
    const { company, role, run } = req.body || {};
    if (!company) return res.status(400).json({ error: 'company required' });
    const prompt = buildDeepPrompt(company, role);

    // When the client opts in via { run: true } AND Gemini is configured,
    // execute the prompt server-side and return the rendered Markdown so
    // the user sees real research output without leaving the browser.
    // Gemini has no web-search tool, so the result is shallower than what
    // Claude Code can produce, but it's directly viewable. We persist
    // every successful run into interview-prep/ for future browsing.
    if (run) {
      let result = null;
      let mode = null;
      if (hasAnthropicKey()) {
        mode = 'anthropic';
        // REVIEW-A1 — Anthropic has no filesystem; inline cv/profile/mode
        // content so "Read these files first" actually has files to read.
        const ctx = bundleProjectContext({ modeSlugs: ['_shared', 'deep'] });
        const r = await runAnthropic(ctx + prompt, { maxTokens: 8192 });
        if (r.error) return res.status(502).json({ mode, prompt, error: r.error });
        result = { markdown: r.markdown, code: 0 };
      } else if (hasGeminiKey()) {
        mode = 'gemini';
        const tmp = projPath('output', `web-deep-${Date.now()}.txt`);
        mkdirSync(PATHS.outputDir, { recursive: true });
        writeFileSync(tmp, prompt);
        const sub = await runNodeScript('gemini-eval.mjs', ['--file', tmp], { timeoutMs: 180_000 });
        result = { markdown: (sub.stdout || '').trim(), code: sub.code };
      }
      if (result) {
        let saved = null;
        if (result.markdown) {
          const slug = `${slugify(company)}-${role ? slugify(role) : 'general'}.md`;
          mkdirSync(PATHS.interviewPrepDir, { recursive: true });
          writeFileSync(projPath('interview-prep', slug), result.markdown);
          saved = slug;
        }
        return res.json({ mode, prompt, markdown: result.markdown, saved, code: result.code });
      }
    }

    res.json({
      mode: 'manual',
      prompt,
      message: (hasAnthropicKey() || hasGeminiKey())
        ? 'Set { run: true } to execute via Anthropic/Gemini, or copy the prompt into Claude Code.'
        : 'No API key set. Paste this into Claude Code for full deep research with WebFetch.',
    });
  });

  // ───────────────────────── Interview-prep (deep research archive) ─────────────────────────

  app.get('/api/interview-prep', (_req, res) => {
    if (!existsSync(PATHS.interviewPrepDir)) return res.json({ files: [] });
    const files = readdirSync(PATHS.interviewPrepDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const stat = statSync(projPath('interview-prep', f));
        return { name: f, size: stat.size, mtime: stat.mtime };
      })
      .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
    res.json({ files });
  });

  app.get('/api/interview-prep/:name', (req, res) => {
    const safe = req.params.name.replace(/[^\w\-.]/g, '');
    if (!safe || !safe.endsWith('.md')) return res.status(400).json({ error: 'invalid name' });
    const file = projPath('interview-prep', safe);
    if (!existsSync(file)) return res.status(404).json({ error: 'not found' });
    res.json({ name: safe, markdown: readFileSync(file, 'utf8') });
  });

  app.delete('/api/interview-prep/:name', (req, res) => {
    const safe = req.params.name.replace(/[^\w\-.]/g, '');
    if (!safe || !safe.endsWith('.md')) return res.status(400).json({ error: 'invalid name' });
    const file = projPath('interview-prep', safe);
    if (!existsSync(file)) return res.status(404).json({ error: 'not found' });
    unlinkSync(file);
    res.json({ ok: true, deleted: safe });
  });

  // ───────────────────────── Generic mode prompts (FIX-C8) ─────────────────────────
  // Single endpoint per mode in `modes/`. Reads the prompt template from
  // `modes/{slug}.md`, prepends the user-supplied context as a JSON block,
  // and returns either the assembled prompt (manual mode) or — when the
  // caller passes { run: true } AND GEMINI_API_KEY is set — the actual
  // Gemini output for live in-browser viewing.
  //
  // Allowed slugs are an explicit list — we don't want users browsing the
  // entire modes/ directory through this endpoint.
  // Generic mode endpoints — kept narrow on purpose. Modes that have a
  // dedicated route (oferta → /api/evaluate, deep → /api/deep) and
  // modes the user only runs in Claude Code (apply, scan, pipeline,
  // tracker, pdf, latex, ofertas, auto-pipeline) intentionally stay off
  // this list. Update when a UI page adds support for a new mode.
  const MODE_ALLOWLIST = ['batch', 'contacto', 'followup', 'interview-prep', 'patterns', 'project', 'training'];

  app.post('/api/mode/:slug', async (req, res) => {
    const slug = req.params.slug;
    if (!MODE_ALLOWLIST.includes(slug)) {
      return res.status(404).json({ error: `unknown mode "${slug}"` });
    }
    const modeFile = projPath('modes', `${slug}.md`);
    if (!existsSync(modeFile)) {
      return res.status(404).json({ error: `modes/${slug}.md not found in parent project` });
    }
    const template = readFileSync(modeFile, 'utf8');
    const context = (req.body && typeof req.body === 'object') ? req.body : {};
    const prompt = buildModePrompt(template, slug, context);

    if (context.run) {
      // Prefer Anthropic for live execution (better at long-form
      // structured output than Gemini for these modes); fall back to
      // Gemini if no Anthropic key. Either path produces the same
      // response shape so the UI doesn't care which engine ran.
      if (hasAnthropicKey()) {
        // REVIEW-A1 — buildModePrompt already inlines modes/<slug>.md;
        // here we add cv.md + profile.yml + modes/_shared.md so Anthropic
        // has the same context that Claude Code would read locally.
        const ctx = bundleProjectContext({ modeSlugs: ['_shared'] });
        const r = await runAnthropic(ctx + prompt);
        if (r.error) return res.status(502).json({ mode: 'anthropic', slug, prompt, error: r.error });
        return res.json({ mode: 'anthropic', slug, prompt, markdown: r.markdown, usage: r.usage });
      }
      if (hasGeminiKey()) {
        const tmp = projPath('output', `web-${slug}-${Date.now()}.txt`);
        mkdirSync(PATHS.outputDir, { recursive: true });
        writeFileSync(tmp, prompt);
        const result = await runNodeScript('gemini-eval.mjs', ['--file', tmp], { timeoutMs: 180_000 });
        return res.json({ mode: 'gemini', slug, prompt, markdown: (result.stdout || '').trim(), code: result.code });
      }
    }
    res.json({
      mode: 'manual',
      slug,
      prompt,
      message: (hasAnthropicKey() || hasGeminiKey())
        ? 'Set { run: true } to execute via Anthropic/Gemini, or copy this prompt into Claude Code.'
        : 'No API key set. Copy this prompt into Claude Code (it has WebFetch/WebSearch).',
    });
  });

  app.post('/api/apply-helper', (req, res) => {
    const { url, jd } = req.body || {};
    if (!url) return res.status(400).json({ error: 'url required' });
    res.json({
      checklist: buildApplyChecklist(url, jd),
      message: 'Live application checklist generated.',
    });
  });

  // ───────────────────────────── Catch-all → SPA ─────────────────────────────

  app.get('/api/*', (_req, res) => res.status(404).json({ error: 'unknown api' }));
  app.get('*', (_req, res) => res.sendFile('index.html', { root: PUBLIC_DIR }));

  return app;
}

// ───────────────────────────── boot ─────────────────────────────

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const port = parseInt(process.env.PORT || '4317', 10);
  const host = process.env.HOST || '127.0.0.1';
  const app = createApp();
  app.listen(port, host, () => {
    console.log('');
    console.log('  🛫  career-ops web UI');
    console.log(`     http://${host}:${port}`);
    console.log(`     project: ${PROJECT_ROOT}`);
    console.log('');
  });
}
