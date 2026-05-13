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
import { stripDangerousMarkdown } from '../security.mjs';
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
  app.get('/api/profile', (_req, res) => {
    if (!existsSync(PATHS.profile)) return res.json({ profile: null });
    try {
      const text = readFileSync(PATHS.profile, 'utf8');
      res.json({ profile: yaml.load(text), raw: text });
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
    if (!parsed.candidate || typeof parsed.candidate !== 'object') {
      return res.status(400).json({ error: 'profile.candidate is required' });
    }
    // Stamp a header so the file remains identifiable when shared.
    const header = '# Career-Ops Profile Configuration\n';
    const body = raw.startsWith('#') ? raw : header + raw;
    const dir = dirname(PATHS.profile);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(PATHS.profile, body);
    res.json({ ok: true, bytes: body.length, candidate: parsed.candidate.full_name || null });
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

  app.get('/api/modes/:name', (req, res) => {
    const name = req.params.name.replace(/[^\w\-.]/g, '');
    const file = projPath('modes', `${name}.md`);
    if (!existsSync(file)) return res.status(404).json({ error: 'not found' });
    res.type('text/plain').send(readFileSync(file, 'utf8'));
  });
}
