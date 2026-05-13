/**
 * JDs routes — manage saved Job Description text in jds/*.txt.
 *
 *   GET    /api/jds         → { jds: { name, size, mtime }[] }
 *   GET    /api/jds/:name   → text/plain body
 *   DELETE /api/jds/:name   → unlink (.txt suffix required)
 *   POST   /api/jds { text, slug? }
 *
 * `:name` is sanitized via [^\w\-.]/g; DELETE additionally enforces .txt
 * suffix. POST sanitizes the optional slug via slugify(); falls back to
 * `jd-<date>-<ts>.txt` when no slug supplied. Returns a `warning` field
 * when slug normalization stripped unsafe characters.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { PATHS, path as projPath } from '../paths.mjs';
import { slugify, today } from '../parsers.mjs';
import { sanitizePathName } from '../security.mjs';

export function registerJdsRoutes(app) {
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
    const name = sanitizePathName(req.params.name);
    if (!name) return res.status(400).json({ error: 'invalid jd name' });
    const file = projPath('jds', name);
    if (!existsSync(file)) return res.status(404).json({ error: 'not found' });
    res.type('text/plain').send(readFileSync(file, 'utf8'));
  });

  app.delete('/api/jds/:name', (req, res) => {
    // Strip path-traversal characters; require the canonical .txt suffix
    // so we cannot accidentally remove an unrelated file.
    const safe = sanitizePathName(req.params.name);
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
      // FIX-M2 — only flag the cases users care about: unsafe characters
      // were stripped. Pure case-folding ("Acme" → "acme") and whitespace
      // collapsing don't deserve a warning.
      const stripped = /[^\w\s-]/.test(slug);
      if (stripped) warning = `slug normalized from "${slug}" to "${safeSlug}"`;
    }
    const name = (safeSlug || `jd-${today()}-${Date.now()}`) + '.txt';
    mkdirSync(PATHS.jdsDir, { recursive: true });
    writeFileSync(projPath('jds', name), text);
    res.json({ ok: true, name, ...(warning ? { warning } : {}) });
  });
}
