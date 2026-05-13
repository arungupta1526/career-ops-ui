/**
 * Content routes — read/write of the parent project's text artifacts:
 *   GET  /api/cv          → { markdown }
 *   PUT  /api/cv          → save (sanitized) markdown
 *   POST /api/cv/import   → convert uploaded docx/pdf/html/… to markdown
 *   GET  /api/profile     → { profile, raw }
 *   PUT  /api/profile     → write the YAML body (validated)
 *   GET  /api/portals     → { portals, raw }
 *   GET  /api/modes       → { modes: string[] }
 *   GET  /api/modes/:name → text/plain
 *
 * Writes are explicit user actions. CV ingress goes through
 * stripDangerousMarkdown; profile YAML is parsed before write so
 * malformed input fails fast with 400.
 */
import express from 'express';
import multer from 'multer';
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import yaml from 'js-yaml';
import { PATHS, path as projPath } from '../paths.mjs';
import { stripDangerousMarkdown, sanitizePathName } from '../security.mjs';
import { logActivity } from '../activity-log.mjs';
import { importDocumentToMarkdown, MAX_UPLOAD_BYTES } from '../cv-import.mjs';

// v1.13.0 (PR-4 full) — multer for proper multipart parsing. The
// v1.10.2 415-reject path was a stopgap; this is the real fix. Memory
// storage so we hand the same Buffer to importDocumentToMarkdown
// without writing to disk first. Size cap mirrors the octet-stream
// limit (10 MB).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

export function registerContentRoutes(app) {
  // ─── CV ───
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

  // ─── CV import ───
  // v1.13.0 (PR-4 full) — accepts BOTH:
  //   • Content-Type: application/octet-stream + X-Filename: <name>
  //     (the original SPA contract — preserved verbatim, no behavior
  //     change for existing clients).
  //   • Content-Type: multipart/form-data with a `file` field
  //     (curl -F file=@cv.docx, Postman default, any standard HTTP
  //     client). The previous v1.10.2 415-reject was a stopgap; multer
  //     now parses the multipart envelope properly and extracts the
  //     first file part regardless of field name.
  //
  // Both paths feed the same `importDocumentToMarkdown` converter and
  // the same `stripDangerousMarkdown` XSS pass — no behaviour drift.
  // Conversion errors come back as 422 with `{ ok:false, error, hint }`;
  // payload-too-large is caught by the global error handler from F-019
  // and returned as 413 JSON.
  app.post(
    '/api/cv/import',
    // Dispatch on Content-Type. multer's `.any()` accepts any field name;
    // express.raw handles the original octet-stream wire format. Both
    // run with the same `MAX_UPLOAD_BYTES` cap.
    (req, res, next) => {
      const ct = (req.headers['content-type'] || '').toLowerCase();
      if (ct.startsWith('multipart/')) return upload.any()(req, res, next);
      return express.raw({ type: '*/*', limit: MAX_UPLOAD_BYTES })(req, res, next);
    },
    async (req, res) => {
      let buf = null;
      let filename = 'upload.txt';

      const ct = (req.headers['content-type'] || '').toLowerCase();
      if (ct.startsWith('multipart/')) {
        // multer populated req.files with parsed parts.
        const file = (req.files && req.files[0]) || null;
        if (!file) {
          return res.status(400).json({
            ok: false,
            error: 'multipart body has no file part',
            hint: 'send a `file` field with the file bytes',
          });
        }
        buf = file.buffer;
        filename = file.originalname || 'upload.bin';
      } else {
        // Original octet-stream path. X-Filename gives the extension hint.
        filename = (req.headers['x-filename'] || 'upload.txt').toString();
        buf = Buffer.isBuffer(req.body) ? req.body : null;
        if (!buf || buf.length === 0) {
          return res.status(400).json({
            error: 'empty body — upload the file as the request body with X-Filename header',
          });
        }
        // Defense in depth: octet-stream with multipart bytes inside is
        // a misconfigured client. Still reject — this is unambiguously wrong.
        const preview = buf.slice(0, 256).toString('latin1');
        if (/Content-Disposition:\s*form-data/i.test(preview)) {
          return res.status(415).json({
            ok: false,
            error: 'request body looks like multipart/form-data under octet-stream Content-Type',
            hint: 'either switch to Content-Type: multipart/form-data, or POST raw bytes',
          });
        }
      }

      try {
        const result = await importDocumentToMarkdown(buf, filename);
        if (!result.ok) return res.status(422).json(result);
        result.markdown = stripDangerousMarkdown(result.markdown);
        res.json(result);
      } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
      }
    },
  );

  // ─── Profile ───
  // G-009 (v1.15.0): summarizer accepts BOTH the legacy schema
  // (candidate:{full_name,email,linkedin}, target:{roles,
  // comp_total_min_usd, archetypes}) AND the canonical career-ops.org
  // schema (top-level full_name/email/location/narrative.headline,
  // target_roles.primary, compensation.target_range). Legacy fields
  // win when both are present so existing YAMLs continue to render
  // identically.
  function parseCompRange(s) {
    if (!s || typeof s !== 'string') return null;
    // Match shapes like "$120K-160K", "120000-160000 USD", "€100k–120k", "120K+"
    const norm = s.replace(/[€$£¥]/g, '').replace(/[,\s]/g, '');
    const m = norm.match(/(\d+)\s*[Kk]?\s*[-–~]\s*(\d+)\s*[Kk]?/);
    if (m) {
      const lo = Number(m[1]) * (norm.toLowerCase().includes('k') ? 1000 : 1);
      const hi = Number(m[2]) * (norm.toLowerCase().includes('k') ? 1000 : 1);
      return { min: Math.min(lo, hi), max: Math.max(lo, hi) };
    }
    const single = norm.match(/(\d+)\s*[Kk]?\+?$/);
    if (single) return { min: Number(single[1]) * (norm.toLowerCase().includes('k') ? 1000 : 1), max: null };
    return null;
  }

  function summarizeProfile(p) {
    if (!p || typeof p !== 'object') return null;
    const candidate = (p.candidate && typeof p.candidate === 'object') ? p.candidate : {};
    const target = (p.target && typeof p.target === 'object') ? p.target : {};
    const targetRoles = (p.target_roles && typeof p.target_roles === 'object') ? p.target_roles : {};
    const compensation = (p.compensation && typeof p.compensation === 'object') ? p.compensation : {};
    const narrative = (p.narrative && typeof p.narrative === 'object') ? p.narrative : {};
    return {
      full_name: candidate.full_name || p.full_name || null,
      email:     candidate.email     || p.email     || null,
      linkedin:  candidate.linkedin  || p.linkedin  || null,
      github:    candidate.github    || p.github    || null,
      location:  candidate.location  || p.location  || null,
      headline:  candidate.headline  || narrative.headline || null,
      target_roles: Array.isArray(target.roles) ? target.roles
                  : (Array.isArray(targetRoles.primary) ? targetRoles.primary : []),
      comp_min_usd: target.comp_total_min_usd
                    ?? parseCompRange(compensation.target_range)?.min
                    ?? null,
      archetypes: Array.isArray(target.archetypes) ? target.archetypes : [],
    };
  }

  app.get('/api/profile', (_req, res) => {
    if (!existsSync(PATHS.profile)) return res.json({ profile: null, summary: null });
    try {
      const text = readFileSync(PATHS.profile, 'utf8');
      const parsed = yaml.load(text);
      res.json({ profile: parsed, raw: text, summary: summarizeProfile(parsed) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/profile', (req, res) => {
    const raw = (req.body?.yaml ?? '').toString();
    if (!raw.trim()) {
      return res.status(400).json({ error: 'yaml body required (string under "yaml" key)' });
    }
    if (raw.length > 256 * 1024) {
      return res.status(413).json({ error: 'profile yaml too large (max 256 KB)' });
    }
    let parsed;
    try {
      parsed = yaml.load(raw);
    } catch (e) {
      return res.status(400).json({ error: 'invalid YAML: ' + e.message });
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return res.status(400).json({ error: 'profile must be a YAML mapping' });
    }
    // G-009: accept EITHER legacy `candidate:` block OR canonical top-level `full_name:`.
    const hasCandidate = parsed.candidate && typeof parsed.candidate === 'object';
    const hasCanonical = typeof parsed.full_name === 'string' && parsed.full_name.trim();
    if (!hasCandidate && !hasCanonical) {
      return res.status(400).json({
        error: 'profile.candidate.full_name OR top-level full_name is required',
      });
    }
    // Stamp a header so the file remains identifiable when shared.
    const header = '# Career-Ops Profile Configuration\n';
    const body = raw.startsWith('#') ? raw : header + raw;
    const dir = dirname(PATHS.profile);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(PATHS.profile, body);
    const summary = summarizeProfile(parsed);
    res.json({ ok: true, bytes: body.length, candidate: summary?.full_name || null, summary });
  });

  // ─── Portals ───
  app.get('/api/portals', (_req, res) => {
    if (!existsSync(PATHS.portals)) return res.json({ portals: null });
    try {
      const text = readFileSync(PATHS.portals, 'utf8');
      res.json({ portals: yaml.load(text), raw: text });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Modes (prompt templates) ───
  app.get('/api/modes', (_req, res) => {
    if (!existsSync(PATHS.modesDir)) return res.json({ modes: [] });
    const list = readdirSync(PATHS.modesDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''));
    res.json({ modes: list });
  });

  // G-008 (v1.15.0) — modes/_profile.md as a first-class editable file.
  // MUST be registered BEFORE /api/modes/:name (next handler) so the
  // literal path wins. Returns JSON {markdown, bytes} (not text/plain
  // like the generic mode getter) because the editor needs metadata.
  // Scaffold from _profile.template.md if missing on first read.
  app.get('/api/modes/_profile', (_req, res) => {
    try {
      let markdown = '';
      if (existsSync(PATHS.modesProfile)) {
        markdown = readFileSync(PATHS.modesProfile, 'utf8');
      } else if (existsSync(PATHS.modesProfileTemplate)) {
        markdown = readFileSync(PATHS.modesProfileTemplate, 'utf8');
        // Don't persist on read — let the user opt in by hitting Save.
      } else {
        markdown = [
          '# Career framing (modes/_profile.md)',
          '',
          '> This file is the most-edited per career-ops.org Quick Start §Step-5.',
          '> Never committed. Fill in your target roles, framing, exit narrative,',
          '> comp targets, and location policy here.',
          '',
          '## Target Roles',
          '',
          '- ',
          '',
          '## Adaptive Framing',
          '',
          '- ',
          '',
          '## Exit Narrative',
          '',
          '',
          '',
          '## Comp Targets',
          '',
          '- ',
          '',
          '## Location Policy',
          '',
          '',
          '',
        ].join('\n');
      }
      res.json({
        markdown,
        bytes: Buffer.byteLength(markdown),
        scaffolded: !existsSync(PATHS.modesProfile),
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/modes/_profile', (req, res) => {
    const md = req.body?.markdown;
    if (typeof md !== 'string') {
      return res.status(400).json({ error: 'markdown body required (string under "markdown" key)' });
    }
    if (Buffer.byteLength(md) > 256 * 1024) {
      return res.status(413).json({ error: 'modes/_profile.md too large (max 256 KB)' });
    }
    const sanitized = stripDangerousMarkdown(md);
    const dir = dirname(PATHS.modesProfile);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(PATHS.modesProfile, sanitized);
    logActivity({
      type: 'modes_profile.save',
      target: 'modes/_profile.md',
      bytes: Buffer.byteLength(sanitized),
    });
    res.json({
      ok: true,
      sanitized: sanitized !== md,
      bytes: Buffer.byteLength(sanitized),
    });
  });

  app.get('/api/modes/:name', (req, res) => {
    const name = sanitizePathName(req.params.name);
    if (!name) return res.status(400).json({ error: 'invalid mode name' });
    const file = projPath('modes', `${name}.md`);
    if (!existsSync(file)) return res.status(404).json({ error: 'not found' });
    res.type('text/plain').send(readFileSync(file, 'utf8'));
  });
}
