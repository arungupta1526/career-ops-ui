/**
 * Tracker routes — viewer + writer for `data/applications.md`.
 *
 *   GET  /api/tracker → { rows: Application[] }
 *   POST /api/tracker → append a row (dedup by company+role, case-insensitive)
 *
 * The POST handler bridges the "scan → evaluate → save report → add to
 * tracker" loop into the UI. Status is whitelisted; score, date, notes,
 * and reportSlug are sanitized. The Markdown table is bootstrapped on
 * first write.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { PATHS, path as projPath } from '../paths.mjs';
import { parseApplications, today } from '../parsers.mjs';
import { safeReadApps } from '../store.mjs';

const ALLOWED_STATUSES = ['Evaluated', 'Applied', 'Responded', 'Interview', 'Offer', 'Rejected', 'Discarded', 'SKIP'];

export function registerTrackerRoutes(app) {
  app.get('/api/tracker', (_req, res) => {
    res.json({ rows: safeReadApps() });
  });

  app.post('/api/tracker', (req, res) => {
    const { company, role, score, status, url, reportSlug, notes, date } = req.body || {};
    if (!company || !role) {
      return res.status(400).json({ error: 'company and role are required' });
    }
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
}
