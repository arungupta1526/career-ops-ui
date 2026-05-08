/**
 * career-ops web UI — Express server
 *
 * Serves the Airbnb-styled SPA from /public and exposes /api/* endpoints
 * that wrap the underlying career-ops Node scripts and data files.
 *
 * Run from the web-ui/ folder:
 *   node server/index.mjs
 *
 * Env:
 *   PORT       (default 4317)
 *   HOST       (default 127.0.0.1)
 *   GEMINI_API_KEY   forwarded to gemini-eval.mjs if present
 */
import express from 'express';
import { PATHS, PROJECT_ROOT, PUBLIC_DIR } from './lib/paths.mjs';
import { activityMiddleware } from './lib/activity-log.mjs';
import { loadEnvFile } from './lib/dotenv.mjs';
import { isValidJobUrl, isPubliclyExposed, sanitizeJobDescription, stripDangerousMarkdown } from './lib/security.mjs';
import { ensureRussianPortalsDefaults } from './lib/store.mjs';
// Route modules — each exports `register<Topic>Routes(app)`.
import { registerActivityRoutes } from './lib/routes/activity.mjs';
import { registerConfigRoutes } from './lib/routes/config.mjs';
import { registerContentRoutes } from './lib/routes/content.mjs';
import { registerHealthRoutes } from './lib/routes/health.mjs';
import { registerHelpRoutes } from './lib/routes/help.mjs';
import { registerJdsRoutes } from './lib/routes/jds.mjs';
import { registerLlmRoutes } from './lib/routes/llm.mjs';
import { registerPipelineRoutes } from './lib/routes/pipeline.mjs';
import { registerReportsRoutes } from './lib/routes/reports.mjs';
import { registerRunnerRoutes } from './lib/routes/runners.mjs';
import { registerScanRoutes } from './lib/routes/scan.mjs';
import { registerTrackerRoutes } from './lib/routes/tracker.mjs';

// Re-exports preserved for backward compatibility — earlier tests
// (and any external consumers) imported these from server/index.mjs.
// New code should import from the lib/ modules directly.
export { isValidJobUrl, sanitizeJobDescription, stripDangerousMarkdown };

// Load parent's .env (HH_USER_AGENT, GEMINI_API_KEY, …) BEFORE createApp
// runs so health checks and scanner config see the real values.
loadEnvFile(PATHS.envFile);

export function createApp() {
  ensureRussianPortalsDefaults();
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use(express.text({ limit: '5mb', type: ['text/plain', 'text/markdown'] }));

  // ──────────────── Security headers ────────────────
  // Always-on baseline (cheap, no breakage). CSP is layered on top when the
  // server is exposed beyond loopback (HOST=0.0.0.0) — that's the only case
  // where exfiltration via XSS becomes reachable from a LAN attacker.
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'same-origin');
    if (isPubliclyExposed()) {
      // default-src 'self' covers img-src/script-src/connect-src etc.;
      // explicit allowlists below loosen only what the SPA needs:
      //   - Google Fonts CSS at fonts.googleapis.com
      //   - Google Fonts WOFF2 at fonts.gstatic.com
      //   - inline style="..." attrs in router error template (style-src 'unsafe-inline')
      //   - inline favicon as data: URI (img-src 'self' data:)
      // 'unsafe-inline' is intentionally NOT in script-src — all event
      // handlers were moved to addEventListener.
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data:",
          "connect-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "frame-ancestors 'none'",
          "form-action 'self'",
        ].join('; ')
      );
    }
    next();
  });

  // Activity log — records every state-changing request so the UI can show
  // a history page. Must come BEFORE express.static so the same middleware
  // covers both API and asset routes (asset GETs are filtered out).
  app.use(activityMiddleware);

  app.use(express.static(PUBLIC_DIR));

  // --- Route modules (P-2 phase 2 split) ---
  // Each topic lives in server/lib/routes/<topic>.mjs and exports
  // register<Topic>Routes(app). Order grouped by surface for readability.
  registerConfigRoutes(app);
  registerHelpRoutes(app);
  registerActivityRoutes(app);
  registerHealthRoutes(app);          // includes /api/dashboard
  registerTrackerRoutes(app);
  registerPipelineRoutes(app);        // includes /api/pipeline/preview
  registerReportsRoutes(app);
  registerJdsRoutes(app);
  registerContentRoutes(app);         // CV / Profile / Portals / Modes
  registerRunnerRoutes(app);          // buffered /api/run/* + streaming /api/stream/{scan,liveness,pdf} + /api/output/pdfs
  registerScanRoutes(app);            // in-process /api/stream/scan-{ru,en} + /api/scan-results
  registerLlmRoutes(app);             // /api/evaluate, /api/deep, /api/mode/:slug, /api/apply-helper, /api/interview-prep
  // ───────────────────────────── Catch-all → SPA ─────────────────────────────

  app.get('/api/*', (_req, res) => res.status(404).json({ error: 'unknown api' }));
  app.get('*', (_req, res) => res.sendFile('index.html', { root: PUBLIC_DIR }));

  return app;
}

// ───────────────────────────── boot ─────────────────────────────

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const port = parseInt(process.env.PORT || '4317', 10);
  const host = process.env.HOST || '127.0.0.1';
  const app = createApp();
  app.listen(port, host, () => {
    console.log('');
    console.log('  🛫  career-ops web UI');
    console.log(`     http://${host}:${port}`);
    console.log(`     project: ${PROJECT_ROOT}`);
    console.log('');
  });
}
