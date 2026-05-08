/**
 * Pipeline routes — inbox of pending JD URLs + server-side preview proxy.
 *
 *   GET    /api/pipeline             → { urls: string[] }
 *   POST   /api/pipeline { url }     → append (URL gated by isValidJobUrl)
 *   GET    /api/pipeline/preview?url → stripped HTML snippet (≤ 8 KB)
 *   DELETE /api/pipeline?url=…       → remove
 *
 * The preview endpoint walks redirects manually, revalidating each
 * Location through isValidJobUrl (REVIEW-B1). Cap: 3 hops, 15 s timeout,
 * 8 KB body. SSRF surface is bounded by isValidJobUrl which rejects
 * loopback, file://, IP literals, etc.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { lookup as dnsLookup } from 'node:dns/promises';
import { PATHS, path as projPath } from '../paths.mjs';
import { parsePipeline, addPipelineUrl, removePipelineUrl } from '../parsers.mjs';
import { isValidJobUrl, isPrivateOrLoopbackHost } from '../security.mjs';
import { safeReadPipeline } from '../store.mjs';

const PREVIEW_TIMEOUT_MS = 15_000;
const PREVIEW_MAX_REDIRECTS = 3;
const PREVIEW_MAX_BODY_BYTES = 8000;

export function registerPipelineRoutes(app) {
  app.get('/api/pipeline', (_req, res) => {
    res.json({ urls: safeReadPipeline() });
  });

  app.post('/api/pipeline', (req, res) => {
    const url = (req.body?.url || req.body?.text || '').toString().trim();
    if (!url) return res.status(400).json({ error: 'url required' });
    if (!isValidJobUrl(url)) {
      return res.status(400).json({ error: 'invalid url (must be http/https, no script/template chars)' });
    }
    let content = '';
    try {
      content = readFileSync(PATHS.pipeline, 'utf8');
    } catch {
      content = '';
    }
    const before = parsePipeline(content);
    const deduped = before.includes(url);
    const updated = addPipelineUrl(content, url);
    mkdirSync(projPath('data'), { recursive: true });
    writeFileSync(PATHS.pipeline, updated);
    res.json({ ok: true, deduped, urls: parsePipeline(updated) });
  });

  // Server-side fetch proxy for the pipeline preview pane. Most ATS
  // boards (Greenhouse, Ashby, Lever) don't send CORS headers, so the
  // browser can't read them directly; we fetch on the server and return
  // a stripped text snippet.
  app.get('/api/pipeline/preview', async (req, res) => {
    const url = (req.query.url || '').toString();
    if (!isValidJobUrl(url)) return res.status(400).json({ error: 'invalid url' });
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), PREVIEW_TIMEOUT_MS);
      let current = url;
      let upstream;
      let hops = 0;
      while (true) {
        // Defeat DNS-rebind: re-resolve the host on every hop and reject if it
        // points into private/loopback space. isValidJobUrl rejects literal
        // private IPs in the URL string; this guard catches public-looking
        // hostnames that resolve to private addresses (PR-3).
        // Fail-OPEN when the lookup itself errors — fetch() does its own DNS
        // and surfaces the error via the existing catch path. Failing closed
        // here would break test stubs (and any sandboxed host without DNS)
        // for no security gain.
        try {
          const host = new URL(current).hostname;
          const { address } = await dnsLookup(host, { verbatim: true });
          if (isPrivateOrLoopbackHost(address)) {
            clearTimeout(timer);
            return res.json({ status: 0, text: '(blocked: host resolves to private address)' });
          }
        } catch { /* lookup failed; fetch will produce a real error below */ }
        upstream = await fetch(current, {
          signal: ctrl.signal,
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (career-ops-ui preview) AppleWebKit/537.36',
            Accept: 'text/html,application/xhtml+xml',
          },
        });
        const isRedirect = upstream.status >= 300 && upstream.status < 400 && upstream.headers.get('location');
        if (!isRedirect) break;
        if (++hops > PREVIEW_MAX_REDIRECTS) {
          clearTimeout(timer);
          return res.json({ status: upstream.status, text: `(too many redirects: >${PREVIEW_MAX_REDIRECTS})` });
        }
        const next = new URL(upstream.headers.get('location'), current).toString();
        if (!isValidJobUrl(next)) {
          clearTimeout(timer);
          return res.json({ status: upstream.status, text: `(unsafe redirect target rejected)` });
        }
        current = next;
      }
      clearTimeout(timer);
      if (!upstream.ok) {
        return res.json({ status: upstream.status, text: '(HTTP ' + upstream.status + ')' });
      }
      const html = await upstream.text();
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n+/g, '\n\n')
        .trim()
        .slice(0, PREVIEW_MAX_BODY_BYTES);
      res.json({ status: upstream.status, text });
    } catch (e) {
      res.json({ status: 0, text: '(' + (e.name === 'AbortError' ? 'timeout' : e.message) + ')' });
    }
  });

  app.delete('/api/pipeline', (req, res) => {
    const url = (req.query.url || (req.body && req.body.url) || '').toString().trim();
    if (!url) return res.status(400).json({ error: 'url required (query ?url= or body.url)' });
    let content = '';
    try {
      content = readFileSync(PATHS.pipeline, 'utf8');
    } catch {
      return res.status(404).json({ error: 'pipeline not found' });
    }
    const before = parsePipeline(content);
    if (!before.includes(url)) {
      return res.status(404).json({ error: 'url not found in pipeline', url });
    }
    writeFileSync(PATHS.pipeline, removePipelineUrl(content, url));
    res.json({ ok: true, removed: 1, url });
  });
}
