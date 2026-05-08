# Architecture Overview — career-ops-ui

> The five-minute tour. Read this before any non-trivial code change. Each layer has its own deeper doc:
> `SERVER.md` (Express + lib), `FRONTEND.md` (SPA), `API.md` (route reference), `DATA-FLOWS.md` (parent integration).

## Top-level diagram

```
┌──────────────────────────────────── Browser ─────────────────────────────────────┐
│                                                                                   │
│  public/index.html ──► public/js/app.js ──► public/js/router.js ──► views/*.js   │
│         │                     │                      │                            │
│         └──────────── public/js/api.js (fetch wrapper, banner) ──────────────────┘│
│                              │                                                    │
└──────────────────────────────┼────────────────────────────────────────────────────┘
                               │ HTTP + SSE on 127.0.0.1:4317
┌──────────────────────────────┼─── Express server (Node ≥18) ───────────────────────┐
│                              ▼                                                     │
│   server/index.mjs   ─── 50+ /api/* routes ───┐                                    │
│         │                                      │                                   │
│         ▼                                      ▼                                   │
│   server/lib/paths.mjs       server/lib/runner.mjs    server/lib/{ru,en}-scanner   │
│   server/lib/parsers.mjs     server/lib/anthropic.mjs server/lib/sources/*.mjs     │
│   server/lib/env-config.mjs  server/lib/dotenv.mjs    server/lib/activity-log.mjs  │
│         │                          │                       │                       │
└─────────┼──────────────────────────┼───────────────────────┼───────────────────────┘
          │ reads cv, profile,       │ spawns Node           │ in-process HTTP fetch
          │ portals, applications,   │ scripts in parent     │ to portal APIs
          │ pipeline, reports        │ project               │
          ▼                          ▼                       ▼
┌────────────────────────── Parent project (career-ops/) ─────────────────────────┐
│                                                                                  │
│  cv.md  config/profile.yml  portals.yml  data/applications.md  data/pipeline.md  │
│  reports/*.md  modes/*.md  jds/*.txt  output/*.pdf  interview-prep/*.md          │
│  scan.mjs  doctor.mjs  verify-pipeline.mjs  generate-pdf.mjs  gemini-eval.mjs    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Layers

### 1. Browser SPA (`public/`)

- **`index.html`** — single page, ~150 LOC. Loads CSS + scripts, mounts `#content`, renders the sidebar nav and footer.
- **`js/app.js`** — boot: loads `/api/health`, renders the language switcher, kicks off the router, wires up global keyboard shortcuts (`Ctrl+K`, `Esc`) and the mobile sidebar drawer.
- **`js/router.js`** — hash-router. `Router.register('name', renderer)` per view. Renderer returns a DOM Node or HTML string. Aliases (e.g. `#/profile` → `settings`) keep URL stability across renames. Dedicated 404 view.
- **`js/api.js`** — `API.get/post/put/delete`. Wraps `fetch`, normalises errors, manages the connection-error banner.
- **`js/lib/i18n.js`** — locale loader + `data-i18n` walker. 8 locales.
- **`js/lib/skills.js`** — small UI helpers for skill chips on dashboard / scan.
- **`js/views/*.js`** — one file per route. Pure render-and-wire functions; no client-side state library.

### 2. Express server (`server/`)

- **`index.mjs`** — `createApp()` factory (~760 LOC after P-2 phase 1). Wires middleware, registers route modules, holds the remaining inline route handlers (tracker, pipeline, reports, jds, llm, health). Phase 2 of P-2 will extract those into `lib/routes/*.mjs` too — targeting <500 LOC.
  - Middleware: JSON / text body parsing, security headers (CSP only when not on loopback), `activityMiddleware`, static file serving from `public/`.
  - Routes: see `API.md` for the full inventory.
  - Inline sanitizers: `isValidJobUrl`, `stripDangerousMarkdown`, `sanitizeJobDescription`, `buildEvaluationPrompt`, `buildDeepPrompt`, `buildModePrompt`, `safeReadApps/Pipeline/Reports`, `checkProfileCustomized`, `isPubliclyExposed`.
- **`lib/paths.mjs`** — single source of truth for parent-project paths. `resolveProjectRoot()` tries `CAREER_OPS_ROOT` → `..` → `cwd()` and verifies via `cv.md` / `portals.yml` existence.
- **`lib/runner.mjs`** — `runNodeScript` (buffered) and `streamNodeScript` (SSE). Both spawn `node <script>` inside the parent project. Hard timeout, forced kill on client disconnect.
- **`lib/parsers.mjs`** — Markdown table parsers (applications, pipeline, report headers) and `slugify`/`today` helpers.
- **`lib/ru-scanner.mjs`** — in-process scanner for hh.ru + Habr Career. Reads `russian_portals:` from `portals.yml`, fetches API JSON, normalizes, writes `data/scan-history.tsv` + `data/last-scan.json`. Streams logs via callback.
- **`lib/en-scanner.mjs`** — same shape but for Greenhouse / Ashby / Lever, dispatching to `lib/sources/*.mjs`.
- **`lib/sources/*.mjs`** — per-portal HTTP clients: `greenhouse.mjs`, `ashby.mjs`, `lever.mjs`, `habr.mjs`, `hh.mjs`. Each exports a uniform `fetchCompanyJobs(slug, opts)`. The EN scanner reads either `tracked_companies:` (career-ops v1.7+) or legacy `companies:` from `portals.yml`.
- **`lib/anthropic.mjs`** — minimal Anthropic SDK adapter. Exposes `runAnthropic(prompt, opts)`, `hasAnthropicKey()`, and `hasGeminiKey()` (REVIEW-B2). No streaming; bounded by `maxTokens`.
- **`lib/security.mjs`** *(P-2)* — `isValidJobUrl`, `stripDangerousMarkdown`, `sanitizeJobDescription`, `isPubliclyExposed`. Single source of truth for project-wide sanitizers; re-exported from `index.mjs` for backward-compat.
- **`lib/prompts.mjs`** *(P-2)* — `bundleProjectContext`, `buildEvaluationPrompt`, `buildDeepPrompt`, `buildModePrompt`, `buildApplyChecklist`. Inlines parent files into Anthropic prompts (REVIEW-A1).
- **`lib/store.mjs`** *(P-2)* — defensive readers `safeReadApps/Pipeline/Reports`, `checkProfileCustomized`, plus the first-boot `ensureRussianPortalsDefaults`.
- **`lib/routes/scan.mjs`** *(P-2)* — `registerScanRoutes(app)` for `/api/stream/scan-{ru,en}`, `/api/scan-ru/config`, `/api/scan-results`.
- **`lib/routes/runners.mjs`** *(P-2)* — buffered `/api/run/*` table, streaming `/api/stream/{scan,liveness,pdf}`, generated-PDF list/download.
- **`lib/routes/content.mjs`** *(P-2)* — CV / Profile / Portals / Modes routes.
- **`lib/env-config.mjs`** — `KNOWN_KEYS`, `SECRET_KEYS`, `parseEnv`, `maskSecret`, `validateConfig`, `updateEnvFile`. Backs the `/api/config` endpoint that powers the App Settings page.
- **`lib/dotenv.mjs`** — minimal dotenv loader (no quoting edge cases beyond what the parent's `.env` actually uses). Called once at server start.
- **`lib/activity-log.mjs`** — Express middleware that records every state-changing request to `data/activity.jsonl`. Redacts secret keys.

### 3. Tests (`tests/`)

- All run via `node --test`. In-process: `createApp()` + `server.listen(0)`. No external services.
- E2E (`e2e.mjs`, `e2e-comprehensive.mjs`) spin up the real server in a child process and walk through every route. Long but valuable.
- Coverage via `--experimental-test-coverage`. Baseline: ~93% line / ~83% branch.

### 4. Operations (`bin/`, `scripts/`)

- **`bin/start.sh`** — installs deps if missing, validates Node ≥18, starts the server, opens the browser.
- **`bin/setup.sh`** — one-command installer (clones career-ops + this repo, runs `start.sh`).
- **`scripts/portals-health-check.mjs`** — out-of-band auditor: parses `portals.yml`, hits each portal API, reports dead boards.

## Boot sequence

1. `bin/start.sh` → `node server/index.mjs`.
2. `loadEnvFile(PATHS.envFile)` reads `<parent>/.env` so `HH_USER_AGENT`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY` are visible to both this process and any spawned script.
3. `ensureRussianPortalsDefaults()` appends a documented `russian_portals:` block to `portals.yml` if missing (idempotent).
4. `createApp()` wires Express, registers routes.
5. `app.listen(PORT, HOST)`.
6. Browser hits `/` → `public/index.html` → SPA boot → `/api/health` → `Router.render()`.

## Key invariants

1. **Parent layout discovery is dynamic.** Never hardcode `..` in code. Always `PATHS.<thing>`.
2. **CSP excludes `'unsafe-inline'` from `script-src`.** Every event handler is `addEventListener`. This is enforced at runtime by the browser when the server is exposed beyond loopback, and at review time by `web-ui-route-reviewer` and `spa-view-reviewer`.
3. **Writes to the parent are explicit user actions only.** No automatic "convenience" writes. See `DATA-FLOWS.md` for the full list.
4. **Sanitizers are not duplicated.** One `isValidJobUrl`, one `stripDangerousMarkdown`, one `sanitizeJobDescription`. Adding a parallel implementation = bug.

## Where to look first when…

| Symptom | Look at |
|---|---|
| Route returns 500 | `server/index.mjs` route handler + `server/lib/<module>.mjs` it calls |
| SPA renders blank / errors | DevTools console + `public/js/router.js::render()` |
| Health page shows red | The check it complains about, in `/api/health` route |
| Scan returns 0 results | `server/lib/ru-scanner.mjs` or `server/lib/en-scanner.mjs` + the source module under `server/lib/sources/` |
| `npm test` fails on fresh clone | The test almost certainly assumes parent project files; CI-isolate it |
| CSP blocks something | The route's CSP `script-src` / `connect-src` clause + the place that violates it |
