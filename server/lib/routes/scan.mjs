/**
 * Scan routes — in-process portal scanners + last-scan accessor.
 *
 * Routes registered:
 *   GET /api/stream/scan?source=ats|regional|both  — consolidated entrypoint (v1.12.0)
 *   GET /api/stream/scan-en     — SSE: Greenhouse + Ashby + Lever (deprecated alias for ?source=ats)
 *   GET /api/stream/scan-ru     — SSE: hh.ru + Habr Career (deprecated alias for ?source=regional)
 *   GET /api/scan-ru/config     — current russian_portals: config
 *   GET /api/scan-results       — latest run snapshot from data/last-scan.json
 *
 * F-018 LITE: v1.12.0 adds the consolidated `/api/stream/scan?source=<id>`
 * endpoint so the SPA and external clients can drop the EN/RU split from
 * their integration. The two legacy endpoints stay as deprecated aliases
 * (no schema change, no breaking client). The full adapter-registry
 * refactor (8 separate adapter modules, +14 portals) remains a future
 * phase; this slice consolidates the dispatch surface only.
 *
 * NOTE: the buffered `scan.mjs` runner (POST /api/run/scan) lives in the
 * runners table inside index.mjs; it spawns the parent's scan.mjs and is
 * unrelated to these in-process routes.
 */
import { runRuScan, loadConfig as loadRuConfig } from '../ru-scanner.mjs';
import { runEnScan, loadLastScan } from '../en-scanner.mjs';

/**
 * Open an SSE response with the standard headers used across this repo.
 * Returns a `send(event, data)` writer.
 */
function openSse(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  return (event, data) => {
    if (event) res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
}

/**
 * Single SSE driver for one scanner. Both `/api/stream/scan-en` and
 * `/api/stream/scan-ru` defer to this; the new consolidated
 * `/api/stream/scan?source=` route uses it twice when source=both.
 */
async function driveOne({ res, send, runner, label, query }) {
  send('start', {
    script: label,
    writeFiles: query.dryRun !== '1',
    companyName: query.company ? String(query.company) : undefined,
  });
  const ctrl = new AbortController();
  let aborted = false;
  res.on('close', () => { aborted = true; ctrl.abort(); });
  try {
    const result = await runner({
      writeFiles: query.dryRun !== '1',
      companyName: query.company ? String(query.company) : undefined,
      signal: ctrl.signal,
      onLog: (stream, line) => { if (!aborted) send('log', { stream, line }); },
    });
    if (!aborted) send('done', { code: 0, counts: result.counts, errors: result.errors.length });
    return { ok: true, result };
  } catch (err) {
    if (!aborted) send('error', { message: err && err.message });
    return { ok: false };
  }
}

export function registerScanRoutes(app) {
  // ─── F-018 LITE — consolidated entrypoint ───
  // GET /api/stream/scan?source=ats|regional|both[&dryRun=1][&company=Acme]
  // Default source=both runs ATS first, then regional, in one SSE
  // connection. New SPA code should use this; the two legacy endpoints
  // below stay for backwards compat.
  app.get('/api/stream/scan', async (req, res) => {
    const source = String(req.query.source || 'both').toLowerCase();
    const send = openSse(res);
    if (source === 'ats') {
      await driveOne({ res, send, runner: runEnScan, label: 'en-scanner', query: req.query });
    } else if (source === 'regional') {
      await driveOne({ res, send, runner: runRuScan, label: 'ru-scanner', query: req.query });
    } else if (source === 'both' || source === '') {
      const a = await driveOne({ res, send, runner: runEnScan, label: 'en-scanner', query: req.query });
      if (a.ok && !res.writableEnded) {
        await driveOne({ res, send, runner: runRuScan, label: 'ru-scanner', query: req.query });
      }
    } else {
      send('error', { message: `unknown source "${source}" (expected: ats | regional | both)` });
    }
    if (!res.writableEnded) res.end();
  });

  // ─── RU portal scanner (in-process, hh.ru + Habr Career) ───
  // Deprecated alias — prefer /api/stream/scan?source=regional.
  app.get('/api/stream/scan-ru', async (req, res) => {
    const send = openSse(res);
    const writeFiles = req.query.dryRun !== '1';
    send('start', { script: 'ru-scanner', writeFiles });

    // REVIEW-B3 — when the client disconnects, abort in-flight HTTP
    // fetches inside searchHH/searchHabr instead of letting them run
    // to completion and dropping events on the floor.
    const ctrl = new AbortController();
    let aborted = false;
    res.on('close', () => { aborted = true; ctrl.abort(); });

    try {
      const result = await runRuScan({
        writeFiles,
        signal: ctrl.signal,
        onLog: (stream, line) => {
          if (aborted) return;
          send('log', { stream, line });
        },
      });
      if (!aborted) send('done', { code: 0, counts: result.counts, errors: result.errors.length });
    } catch (err) {
      if (!aborted) send('error', { message: err.message });
    } finally {
      res.end();
    }
  });

  app.get('/api/scan-ru/config', (_req, res) => {
    try {
      res.json(loadRuConfig());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── EN portal scanner (in-process, Greenhouse + Ashby + Lever) ───
  app.get('/api/stream/scan-en', async (req, res) => {
    const send = openSse(res);
    const writeFiles = req.query.dryRun !== '1';
    const companyName = req.query.company ? String(req.query.company) : undefined;
    send('start', { script: 'en-scanner', writeFiles, companyName });

    // REVIEW-B3 — same pattern as scan-ru.
    const ctrl = new AbortController();
    let aborted = false;
    res.on('close', () => { aborted = true; ctrl.abort(); });

    try {
      const result = await runEnScan({
        writeFiles,
        companyName,
        signal: ctrl.signal,
        onLog: (stream, line) => { if (!aborted) send('log', { stream, line }); },
      });
      if (!aborted) send('done', { code: 0, counts: result.counts, errors: result.errors.length });
    } catch (err) {
      if (!aborted) send('error', { message: err.message });
    } finally {
      res.end();
    }
  });

  // ─── Latest scan results (for table view in UI) ───
  app.get('/api/scan-results', (_req, res) => {
    res.json(loadLastScan());
  });
}
