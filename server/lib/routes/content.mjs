/**
 * Content routes — read/write of the parent project's text artifacts:
 *   GET  /api/cv          → { markdown }
 *   PUT  /api/cv          → save (sanitized) markdown
 *   GET  /api/profile     → { profile, raw }     parsed YAML + raw text
 *   GET  /api/portals     → { portals, raw }
 *   GET  /api/modes       → { modes: string[] }
 *   GET  /api/modes/:name → text/plain
 *
 * All writes are explicit user actions (the only write here is PUT /api/cv).
 * CV ingress goes through stripDangerousMarkdown — defense-in-depth XSS.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import yaml from 'js-yaml';
import { PATHS, path as projPath } from '../paths.mjs';
import { stripDangerousMarkdown } from '../security.mjs';

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
