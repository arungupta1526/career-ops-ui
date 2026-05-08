/**
 * Script-runner routes — buffered + streaming wrappers around parent
 * project Node scripts, plus generated-PDF list/download.
 *
 * Buffered (POST /api/run/*):
 *   doctor / verify / normalize / dedup / merge / sync-check
 *
 * Streaming (GET /api/stream/*):
 *   scan       → spawns parent scan.mjs (the SSE sibling of the
 *                in-process scan-en/scan-ru in routes/scan.mjs)
 *   liveness   → check-liveness.mjs
 *   pdf        → generate-pdf.mjs
 *
 * Generated PDFs:
 *   GET /api/output/pdfs         → list { name, size, mtime }[]
 *   GET /api/output/pdfs/:name   → download (Content-Disposition: attachment)
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { PATHS, path as projPath } from '../paths.mjs';
import { runNodeScript, streamNodeScript } from '../runner.mjs';

const BUFFERED = [
  { route: '/api/run/doctor',     script: 'doctor.mjs' },
  { route: '/api/run/verify',     script: 'verify-pipeline.mjs' },
  { route: '/api/run/normalize',  script: 'normalize-statuses.mjs' },
  { route: '/api/run/dedup',      script: 'dedup-tracker.mjs' },
  { route: '/api/run/merge',      script: 'merge-tracker.mjs' },
  { route: '/api/run/sync-check', script: 'cv-sync-check.mjs' },
];

export function registerRunnerRoutes(app) {
  for (const def of BUFFERED) {
    app.post(def.route, async (_req, res) => {
      const result = await runNodeScript(def.script, [], { timeoutMs: 60_000 });
      res.json(result);
    });
  }

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

  // ─── List + download generated PDFs (output/*.pdf) ───
  app.get('/api/output/pdfs', (_req, res) => {
    if (!existsSync(PATHS.outputDir)) return res.json({ files: [] });
    const files = readdirSync(PATHS.outputDir)
      .filter((f) => f.endsWith('.pdf'))
      .map((f) => {
        const stat = statSync(projPath('output', f));
        return { name: f, size: stat.size, mtime: stat.mtime };
      })
      .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
    res.json({ files });
  });

  app.get('/api/output/pdfs/:name', (req, res) => {
    const safe = req.params.name.replace(/[^\w\-.]/g, '');
    if (!safe || !safe.endsWith('.pdf')) return res.status(400).json({ error: 'invalid name' });
    const file = projPath('output', safe);
    if (!existsSync(file)) return res.status(404).json({ error: 'not found' });
    // Trigger a real download with the original filename intact.
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safe}"`);
    res.sendFile(file);
  });
}
