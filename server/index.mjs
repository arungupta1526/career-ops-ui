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
import yaml from 'js-yaml';
import { PATHS, PROJECT_ROOT, PUBLIC_DIR, path as projPath } from './lib/paths.mjs';
import {
  parseApplications,
  parsePipeline,
  addPipelineUrl,
  removePipelineUrl,
  parseReportHeader,
  slugify,
  today,
} from './lib/parsers.mjs';
import { runNodeScript, streamNodeScript } from './lib/runner.mjs';
import { runRuScan, loadConfig as loadRuConfig } from './lib/ru-scanner.mjs';
import { runEnScan, loadLastScan } from './lib/en-scanner.mjs';
import { activityMiddleware, readActivity, logActivity } from './lib/activity-log.mjs';

export function createApp() {
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
    // Optional — UI works fine without these
    checks.push({ name: 'GEMINI_API_KEY', required: false, ok: !!process.env.GEMINI_API_KEY, value: process.env.GEMINI_API_KEY ? 'set' : 'unset (manual mode)' });

    let version = '?';
    try {
      version = readFileSync(PATHS.version, 'utf8').trim();
    } catch {}
    // ok = all REQUIRED checks pass. Optional misses are warnings only.
    const ok = checks.filter((c) => c.required).every((c) => c.ok);
    const warnings = checks.filter((c) => !c.required && !c.ok).length;
    res.json({ ok, warnings, version, checks });
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

  // ───────────────────────────── CV ─────────────────────────────

  app.get('/api/cv', (_req, res) => {
    if (!existsSync(PATHS.cv)) return res.json({ markdown: '' });
    res.json({ markdown: readFileSync(PATHS.cv, 'utf8') });
  });

  app.put('/api/cv', (req, res) => {
    const raw = (req.body?.markdown ?? req.body) || '';
    if (typeof raw !== 'string' || !raw.trim()) {
      return res.status(400).json({ error: 'markdown body required' });
    }
    if (raw.length > 1024 * 1024) {
      return res.status(413).json({ error: 'markdown too large (max 1MB)' });
    }
    const md = stripDangerousMarkdown(raw);
    writeFileSync(PATHS.cv, md);
    res.json({ ok: true, bytes: md.length, sanitized: md.length !== raw.length });
  });

  // ───────────────────────────── Profile ─────────────────────────────

  app.get('/api/profile', (_req, res) => {
    if (!existsSync(PATHS.profile)) return res.json({ profile: null });
    try {
      const text = readFileSync(PATHS.profile, 'utf8');
      res.json({ profile: yaml.load(text), raw: text });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ───────────────────────────── Portals ─────────────────────────────

  app.get('/api/portals', (_req, res) => {
    if (!existsSync(PATHS.portals)) return res.json({ portals: null });
    try {
      const text = readFileSync(PATHS.portals, 'utf8');
      res.json({ portals: yaml.load(text), raw: text });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ───────────────────────────── Modes (prompt templates) ─────────────────────────────

  app.get('/api/modes', (_req, res) => {
    if (!existsSync(PATHS.modesDir)) return res.json({ modes: [] });
    const list = readdirSync(PATHS.modesDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''));
    res.json({ modes: list });
  });

  app.get('/api/modes/:name', (req, res) => {
    const name = req.params.name.replace(/[^\w\-.]/g, '');
    const file = projPath('modes', `${name}.md`);
    if (!existsSync(file)) return res.status(404).json({ error: 'not found' });
    res.type('text/plain').send(readFileSync(file, 'utf8'));
  });

  // ───────────────────────────── Script runners ─────────────────────────────

  // Buffered (fast) endpoints
  for (const def of [
    { route: '/api/run/doctor', script: 'doctor.mjs' },
    { route: '/api/run/verify', script: 'verify-pipeline.mjs' },
    { route: '/api/run/normalize', script: 'normalize-statuses.mjs' },
    { route: '/api/run/dedup', script: 'dedup-tracker.mjs' },
    { route: '/api/run/merge', script: 'merge-tracker.mjs' },
    { route: '/api/run/sync-check', script: 'cv-sync-check.mjs' },
  ]) {
    app.post(def.route, async (_req, res) => {
      const result = await runNodeScript(def.script, [], { timeoutMs: 60_000 });
      res.json(result);
    });
  }

  // Streaming endpoints (long-running)
  app.get('/api/stream/scan', (req, res) => {
    const args = [];
    if (req.query.dryRun === '1') args.push('--dry-run');
    if (req.query.company) args.push('--company', String(req.query.company));
    streamNodeScript(res, 'scan.mjs', args);
  });

  app.get('/api/stream/liveness', (_req, res) => {
    streamNodeScript(res, 'check-liveness.mjs', []);
  });

  app.get('/api/stream/pdf', (_req, res) => {
    streamNodeScript(res, 'generate-pdf.mjs', []);
  });

  // ─── RU portal scanner (in-process, hh.ru + Habr Career) ───
  app.get('/api/stream/scan-ru', async (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders?.();
    const send = (event, data) => {
      if (event) res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const writeFiles = req.query.dryRun !== '1';
    send('start', { script: 'ru-scanner', writeFiles });

    let aborted = false;
    res.on('close', () => (aborted = true));

    try {
      const result = await runRuScan({
        writeFiles,
        onLog: (stream, line) => {
          if (aborted) return;
          send('log', { stream, line });
        },
      });
      if (!aborted) send('done', { code: 0, counts: result.counts, errors: result.errors.length });
    } catch (err) {
      if (!aborted) send('error', { message: err.message });
    } finally {
      res.end();
    }
  });

  app.get('/api/scan-ru/config', (_req, res) => {
    try {
      res.json(loadRuConfig());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── EN portal scanner (in-process replacement for scan.mjs, with rich output) ───
  app.get('/api/stream/scan-en', async (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders?.();
    const send = (event, data) => {
      if (event) res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    const writeFiles = req.query.dryRun !== '1';
    const companyName = req.query.company ? String(req.query.company) : undefined;
    send('start', { script: 'en-scanner', writeFiles, companyName });
    let aborted = false;
    res.on('close', () => (aborted = true));
    try {
      const result = await runEnScan({
        writeFiles,
        companyName,
        onLog: (stream, line) => { if (!aborted) send('log', { stream, line }); },
      });
      if (!aborted) send('done', { code: 0, counts: result.counts, errors: result.errors.length });
    } catch (err) {
      if (!aborted) send('error', { message: err.message });
    } finally {
      res.end();
    }
  });

  // ─── Latest scan results (for table view in UI) ───
  app.get('/api/scan-results', (_req, res) => {
    res.json(loadLastScan());
  });

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

    if (!process.env.GEMINI_API_KEY) {
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

  app.post('/api/deep', (req, res) => {
    const { company, role } = req.body || {};
    if (!company) return res.status(400).json({ error: 'company required' });
    res.json({
      prompt: buildDeepPrompt(company, role),
      message: 'Paste this into Claude Code for full deep research with WebFetch.',
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

// ───────────────────────────── helpers ─────────────────────────────

function safeReadApps() {
  try {
    return parseApplications(readFileSync(PATHS.applications, 'utf8'));
  } catch {
    return [];
  }
}

function safeReadPipeline() {
  try {
    return parsePipeline(readFileSync(PATHS.pipeline, 'utf8'));
  } catch {
    return [];
  }
}

function safeListReports() {
  if (!existsSync(PATHS.reportsDir)) return [];
  const files = readdirSync(PATHS.reportsDir).filter((f) => f.endsWith('.md'));
  return files
    .map((f) => {
      try {
        const text = readFileSync(projPath('reports', f), 'utf8');
        const header = parseReportHeader(text);
        const stat = statSync(projPath('reports', f));
        return { slug: f.replace(/\.md$/, ''), file: f, mtime: stat.mtime, ...header };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
}

/**
 * Sanitize a job-description text before it joins a prompt destined for
 * an LLM. Removes:
 *   - control bytes (NUL, ANSI escapes, etc.) that would confuse downstream
 *     terminals or trigger silent string-mangling in tooling
 *   - script tags, which neither contribute meaning nor belong in a JD
 *   - leading/trailing whitespace
 * Caps length at 50 KB — JDs over that size are paste mistakes, not real
 * postings, and bloat the prompt for no upside.
 */
export function sanitizeJobDescription(input) {
  if (typeof input !== 'string') return '';
  let s = input
    .replace(/\[[0-9;]*m/g, '')         // ANSI color escapes
    .replace(/[ --]/g, '') // control chars (keep \t \n \r)
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '');
  s = s.trim();
  if (s.length > 50_000) s = s.slice(0, 50_000);
  return s;
}

/**
 * Validate a string as a job-posting URL. Allowed: http(s) URL with no
 * angle brackets, quotes, or backticks (which signal template injection
 * or markup attempts). Used by POST /api/pipeline so malformed payloads
 * fail loudly with 400 instead of getting silently dropped on the floor.
 */
export function isValidJobUrl(input) {
  if (typeof input !== 'string') return false;
  const url = input.trim();
  if (!url) return false;
  if (/[<>"'`\\]/.test(url)) return false;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return false;
  if (!parsed.hostname) return false;
  return true;
}

/**
 * True when HOST binds beyond loopback — i.e. listening on 0.0.0.0 or any
 * non-127.0.0.1/::1 interface. Used to gate Content-Security-Policy so
 * stricter limits only kick in when the UI is reachable from the network.
 */
function isPubliclyExposed() {
  const host = (process.env.HOST || '127.0.0.1').trim();
  if (!host) return false;
  if (host === '127.0.0.1' || host === '::1' || host === 'localhost') return false;
  return true;
}

/**
 * Strip dangerous patterns from CV markdown before persisting.
 * Defense-in-depth — the client-side renderer also escapes everything,
 * but neutralizing the file at rest protects any consumer that bypasses
 * the renderer (e.g. raw `cat cv.md`, third-party tools, future endpoints).
 */
export function stripDangerousMarkdown(text) {
  if (!text) return '';
  let s = String(text).replace(/ /g, '');
  s = s
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<iframe\b[\s\S]*?<\/iframe\s*>/gi, '')
    .replace(/<object\b[\s\S]*?<\/object\s*>/gi, '')
    .replace(/<embed\b[^>]*\/?>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<form\b[\s\S]*?<\/form\s*>/gi, '')
    .replace(/<svg\b[\s\S]*?<\/svg\s*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '');
  return s;
}

function buildEvaluationPrompt(jd) {
  return `You are career-ops. Evaluate this Job Description against the user's CV.

Read these files first (they exist in the project root):
  • cv.md
  • config/profile.yml
  • modes/_shared.md
  • modes/oferta.md

Then output the full A-G evaluation per modes/oferta.md (Role Summary, CV Match, Risks, Compensation,
Application Strategy, Verdict, Posting Legitimacy) and a 0-5 score.

JD:
"""
${jd}
"""
`;
}

function buildDeepPrompt(company, role) {
  return `You are career-ops in deep-research mode. Produce a full company brief on ${company}${role ? ` for the role of ${role}` : ''}.

Read modes/deep.md for structure. Use WebFetch / WebSearch. Cover:
  1. Company snapshot (size, funding, runway, leadership)
  2. Engineering culture (stack, blogs, GitHub, conference talks)
  3. Recent news, layoffs, acquisitions, controversies
  4. Glassdoor/Levels.fyi/Blind sentiment
  5. Interview process intel
  6. Negotiation leverage points
  7. Three smart questions for the recruiter

Save the output to interview-prep/${slugify(company)}-${role ? slugify(role) : 'general'}.md
`;
}

function buildApplyChecklist(url, jd) {
  return [
    `URL: ${url}`,
    '',
    '0. Run /career-ops apply in Claude Code with this URL — it will read the form via Playwright.',
    '1. Verify the posting is still live (check footer/navbar vs JD presence).',
    '2. Confirm CV is the latest (run sync-check, then PDF if score ≥ 4.0).',
    '3. Tailor the cover letter / "Why us?" answer using STAR+R proof points from cv.md.',
    '4. Answer EEO / sponsorship / start-date questions truthfully.',
    '5. Save filled answers to interview-prep/{company}-{role}.md before submitting.',
    '6. NEVER auto-submit — you (the human) click the final button.',
    '7. After submit: add row to data/applications.md (or write TSV to batch/tracker-additions/).',
    jd ? '\n--- JD excerpt ---\n' + jd.slice(0, 600) + (jd.length > 600 ? '\n…' : '') : '',
  ].join('\n');
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
