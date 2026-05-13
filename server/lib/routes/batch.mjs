/**
 * Batch evaluate routes — SPA equivalent of the CLI loop documented at
 * career-ops.org/docs/introduction/guides/batch-evaluate-offers.
 *
 *   GET  /api/batch                    → { exists, raw, rows, additions }
 *   PUT  /api/batch       { raw }      → write batch/batch-input.tsv
 *   GET  /api/stream/batch[?parallel=N][&minScore=4.0] → SSE: spawns
 *                                          batch/batch-runner.sh
 *   POST /api/batch/merge              → run merge-tracker.mjs, return result
 *
 * The runner script (`batch/batch-runner.sh`) lives in the parent project.
 * We shell out via `bash` so the parent's script can stay shell — the SPA
 * is a thin streaming wrapper.
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { PATHS } from '../paths.mjs';
import { runNodeScript } from '../runner.mjs';

const TSV_MAX_BYTES = 1024 * 1024; // 1 MB — generous for ~10k JD URLs.

function parseTsv(text) {
  if (!text) return [];
  const rows = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [id, url, source, ...rest] = line.split('\t');
    rows.push({ id: id || '', url: url || '', source: source || '', notes: (rest || []).join('\t') });
  }
  return rows;
}

function listAdditions() {
  if (!existsSync(PATHS.batchAdditionsDir)) return [];
  try {
    return readdirSync(PATHS.batchAdditionsDir)
      .filter((f) => !f.startsWith('.'))
      .map((f) => {
        const p = PATHS.batchAdditionsDir + '/' + f;
        const stat = statSync(p);
        return { name: f, size: stat.size, mtime: stat.mtime };
      })
      .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
  } catch { return []; }
}

export function registerBatchRoutes(app) {
  // ── GET — current input + pending additions ──
  app.get('/api/batch', (_req, res) => {
    const raw = existsSync(PATHS.batchInput) ? readFileSync(PATHS.batchInput, 'utf8') : '';
    res.json({
      exists: existsSync(PATHS.batchInput),
      runnerExists: existsSync(PATHS.batchRunner),
      raw,
      rows: parseTsv(raw),
      additions: listAdditions(),
    });
  });

  // ── PUT — replace batch-input.tsv ──
  app.put('/api/batch', (req, res) => {
    const raw = (req.body?.raw ?? '').toString();
    if (raw.length > TSV_MAX_BYTES) {
      return res.status(413).json({ error: 'batch input too large', limit: TSV_MAX_BYTES });
    }
    // Sanity: refuse a body that is obviously not TSV-shaped (no URL on
    // any non-comment, non-empty line). Better to fail fast than persist
    // a corrupt input file the runner will choke on.
    const rows = parseTsv(raw);
    if (rows.length > 0 && !rows.some((r) => /^https?:\/\//i.test(r.url))) {
      return res.status(400).json({
        error: 'no URL found in any TSV row',
        hint: 'each non-comment line should be: <id>\\t<url>\\t<source>\\t<notes>',
      });
    }
    mkdirSync(PATHS.batchDir, { recursive: true });
    writeFileSync(PATHS.batchInput, raw);
    res.json({ ok: true, bytes: raw.length, rows: rows.length });
  });

  // ── GET /api/stream/batch ── spawn batch-runner.sh and stream SSE ──
  app.get('/api/stream/batch', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    const send = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };
    if (!existsSync(PATHS.batchRunner)) {
      send('error', { message: 'batch/batch-runner.sh not found in parent project' });
      send('done', { code: 2 });
      return res.end();
    }
    const args = [];
    if (req.query.dryRun === '1') args.push('--dry-run');
    if (req.query.parallel) args.push('--parallel', String(parseInt(req.query.parallel, 10) || 1));
    if (req.query.minScore) args.push('--min-score', String(req.query.minScore));
    if (req.query.retry === '1') args.push('--retry-failed');

    send('start', { script: 'batch-runner.sh', args });
    const child = spawn('bash', [PATHS.batchRunner, ...args], {
      cwd: PATHS.root,
      env: { ...process.env },
    });
    const handleChunk = (stream, chunk) => {
      for (const line of chunk.toString().split('\n')) {
        if (!line) continue;
        res.write(`event: log\ndata: ${JSON.stringify({ stream, line })}\n\n`);
      }
    };
    child.stdout.on('data', (d) => handleChunk('stdout', d));
    child.stderr.on('data', (d) => handleChunk('stderr', d));

    let killed = false;
    res.on('close', () => {
      if (child.exitCode === null && !killed) {
        killed = true;
        try { child.kill('SIGTERM'); } catch {}
      }
    });
    child.on('close', (code) => {
      send('done', { code, additions: listAdditions().length });
      res.end();
    });
    child.on('error', (err) => {
      send('error', { message: err.message });
      res.end();
    });
  });

  // ── POST /api/batch/merge ── run merge-tracker.mjs and report result ──
  app.post('/api/batch/merge', async (req, res) => {
    const args = [];
    if (req.body?.dryRun) args.push('--dry-run');
    try {
      const r = await runNodeScript('merge-tracker.mjs', args, { timeoutMs: 60_000 });
      res.json(r);
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });
}
