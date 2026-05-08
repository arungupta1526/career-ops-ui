/**
 * Reports routes — list + read for the parent's reports/*.md tree.
 *
 *   GET /api/reports        → { reports: ReportSummary[] }
 *   GET /api/reports/:slug  → { slug, ...parsedHeader, markdown }
 *
 * `:slug` is sanitized to [^\w\-.]/g and may include or omit the .md
 * suffix. Header fields (date, archetype, score, url, legitimacy, pdf)
 * come from parseReportHeader.
 */
import { readFileSync, existsSync } from 'node:fs';
import { path as projPath } from '../paths.mjs';
import { parseReportHeader } from '../parsers.mjs';
import { safeListReports } from '../store.mjs';

export function registerReportsRoutes(app) {
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
}
