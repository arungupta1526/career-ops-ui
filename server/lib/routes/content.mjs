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
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import yaml from 'js-yaml';
import { PATHS, path as projPath } from '../paths.mjs';
import { stripDangerousMarkdown } from '../security.mjs';
import { importDocumentToMarkdown, MAX_UPLOAD_BYTES } from '../cv-import.mjs';

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
  // Binary-safe upload: express.raw stops the global JSON parser from
  // mangling the buffer; we cap payload size before it reaches us.
  app.post(
    '/api/cv/import',
    express.raw({ type: '*/*', limit: MAX_UPLOAD_BYTES }),
    async (req, res) => {
      const filename = (req.headers['x-filename'] || 'upload.txt').toString();
      const buf = Buffer.isBuffer(req.body) ? req.body : null;
      if (!buf || buf.length === 0) {
        return res.status(400).json({ error: 'empty body — upload the file as the request body with X-Filename header' });
      }
      try {
        const result = await importDocumentToMarkdown(buf, filename);
        if (!result.ok) {
          return res.status(422).json(result);
        }
        // Sanitize the converted markdown the same way PUT /api/cv does
        // so an HTML upload with an inline <script> can't slip through.
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
