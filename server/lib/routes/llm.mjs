/**
 * LLM-bound routes: evaluate, deep research, generic modes, apply-helper,
 * and interview-prep archive.
 *
 *   POST /api/evaluate                 → score JD vs CV (Anthropic | Gemini | manual)
 *   POST /api/evaluate/test-gemini     → smoke check for GEMINI_API_KEY
 *   POST /api/evaluate/test-anthropic  → smoke check for ANTHROPIC_API_KEY (P-7)
 *   POST /api/deep                     → company deep-dive
 *   POST /api/mode/:slug               → generic mode runner (whitelisted slugs)
 *   POST /api/apply-helper             → static checklist text
 *   GET  /api/interview-prep           → list saved deep-research files
 *   GET  /api/interview-prep/:name     → read one
 *   DELETE /api/interview-prep/:name   → unlink one
 *
 * P-7: /api/evaluate now reaches Anthropic in addition to Gemini. The
 * routing rule mirrors /api/deep — Anthropic is preferred when both keys
 * are present. Fallback chain: Anthropic → Gemini → manual.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { PATHS, path as projPath } from '../paths.mjs';
import { slugify, today } from '../parsers.mjs';
import { runNodeScript } from '../runner.mjs';
import { runAnthropic, hasAnthropicKey, hasGeminiKey } from '../anthropic.mjs';
import { sanitizeJobDescription } from '../security.mjs';
import {
  bundleProjectContext,
  buildEvaluationPrompt,
  buildDeepPrompt,
  buildModePrompt,
  buildApplyChecklist,
} from '../prompts.mjs';

// Generic mode endpoints — kept narrow on purpose. Modes that have a
// dedicated route (oferta → /api/evaluate, deep → /api/deep) and
// modes the user only runs in Claude Code (apply, scan, pipeline,
// tracker, pdf, latex, ofertas, auto-pipeline) intentionally stay off
// this list. Update when a UI page adds support for a new mode.
const MODE_ALLOWLIST = ['batch', 'contacto', 'followup', 'interview-prep', 'patterns', 'project', 'training'];

// Smoke-test fixture — chosen to be ≥50 chars after sanitization so it
// passes the same gate as real /api/evaluate calls.
const SMOKE_JD = 'Smoke test: Senior Backend Engineer with PHP and Go responsibilities, including microservice ownership and code review duties.';

export function registerLlmRoutes(app) {
  // ─── /api/evaluate ──────────────────────────────────────────────────
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

    const promptText = buildEvaluationPrompt(jd);

    // P-7 — Anthropic parity. Prefer Anthropic over Gemini when both keys
    // present (better long-form structured output for oferta-style A-G
    // evaluations). REVIEW-A1 inlining: bundle cv + profile + _shared +
    // oferta so the model has the files the prompt references.
    if (hasAnthropicKey()) {
      const ctx = bundleProjectContext({ modeSlugs: ['_shared', 'oferta'] });
      const r = await runAnthropic(ctx + promptText, { maxTokens: 8192 });
      if (r.error) return res.status(502).json({ mode: 'anthropic', prompt: promptText, error: r.error, saved });
      return res.json({ mode: 'anthropic', prompt: promptText, markdown: r.markdown, usage: r.usage, saved });
    }

    if (hasGeminiKey()) {
      // Use the existing gemini-eval.mjs pipe interface — it reads the
      // CV from disk itself (it's a Node script in the parent), so no
      // bundleProjectContext needed here.
      const tmpFile = projPath('output', `web-jd-${Date.now()}.txt`);
      mkdirSync(PATHS.outputDir, { recursive: true });
      writeFileSync(tmpFile, jd);
      const result = await runNodeScript('gemini-eval.mjs', ['--file', tmpFile], { timeoutMs: 120_000 });
      return res.json({ mode: 'gemini', saved, ...result });
    }

    return res.json({
      mode: 'manual',
      message: 'No LLM key set — copy this prompt into Claude/ChatGPT/Gemini',
      prompt: promptText,
      saved,
    });
  });

  // Smoke-test endpoints — verify each provider key is wired without
  // burning a real evaluation. Kept as separate routes so the SPA can
  // probe each independently from /#/config.
  app.post('/api/evaluate/test-gemini', async (_req, res) => {
    if (!hasGeminiKey()) {
      return res.status(400).json({ ok: false, error: 'GEMINI_API_KEY not set' });
    }
    const tmp = projPath('output', `gemini-smoke-${Date.now()}.txt`);
    mkdirSync(PATHS.outputDir, { recursive: true });
    writeFileSync(tmp, SMOKE_JD);
    try {
      const result = await runNodeScript('gemini-eval.mjs', ['--file', tmp], { timeoutMs: 30_000 });
      const sample = (result.stdout || '').slice(0, 200);
      const ok = result.code === 0 && sample.length > 0;
      res.json({ ok, code: result.code, sampleLength: (result.stdout || '').length, sample });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // P-7 — Anthropic equivalent of test-gemini. Sends a tiny prompt
  // (≤256 tokens output) so it costs essentially nothing. Returns a
  // 200-char sample so the SPA can show "✓ Anthropic working".
  app.post('/api/evaluate/test-anthropic', async (_req, res) => {
    if (!hasAnthropicKey()) {
      return res.status(400).json({ ok: false, error: 'ANTHROPIC_API_KEY not set' });
    }
    try {
      const r = await runAnthropic('Reply with the single word "ok".', { maxTokens: 256, timeoutMs: 30_000 });
      if (r.error) return res.json({ ok: false, error: r.error });
      const sample = (r.markdown || '').slice(0, 200);
      res.json({ ok: sample.length > 0, sampleLength: (r.markdown || '').length, sample, usage: r.usage });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // ─── /api/deep ──────────────────────────────────────────────────────
  app.post('/api/deep', async (req, res) => {
    const { company, role, run } = req.body || {};
    if (!company) return res.status(400).json({ error: 'company required' });
    const prompt = buildDeepPrompt(company, role);

    // When run:true AND a key is configured, execute server-side and
    // return the rendered Markdown so the user sees real research output
    // without leaving the browser. Persist every successful run into
    // interview-prep/ for future browsing.
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

  // ─── Interview-prep archive ─────────────────────────────────────────
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

  // ─── /api/mode/:slug — generic mode runner ──────────────────────────
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

  // ─── /api/apply-helper ──────────────────────────────────────────────
  app.post('/api/apply-helper', (req, res) => {
    const { url, jd } = req.body || {};
    if (!url) return res.status(400).json({ error: 'url required' });
    res.json({
      checklist: buildApplyChecklist(url, jd),
      message: 'Live application checklist generated.',
    });
  });
}
