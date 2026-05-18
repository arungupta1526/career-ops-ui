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

- **`index.mjs`** — `createApp()` factory (~130 LOC after **P-2 phase 2** in v1.9.0). Pure orchestrator: wires middleware, calls `register<Topic>Routes(app)` for each route module, mounts the static `/public` serve and the SPA catch-all. No inline route handlers remain.
  - Middleware: JSON / text body parsing, security headers (CSP only when not on loopback), `activityMiddleware`, static file serving from `public/`.
  - Routes: see `API.md` for the full inventory.
  - Inline sanitizers: `isValidJobUrl`, `stripDangerousMarkdown`, `sanitizeJobDescription`, `buildEvaluationPrompt`, `buildDeepPrompt`, `buildModePrompt`, `safeReadApps/Pipeline/Reports`, `checkProfileCustomized`, `isPubliclyExposed`.
- **`lib/paths.mjs`** — single source of truth for parent-project paths. `resolveProjectRoot()` tries `CAREER_OPS_ROOT` → `..` → `cwd()` and verifies via `cv.md` / `portals.yml` existence.
- **`lib/runner.mjs`** — `runNodeScript` (buffered) and `streamNodeScript` (SSE). Both spawn `node <script>` inside the parent project. Hard timeout, forced kill on client disconnect.
- **`lib/parsers.mjs`** — Markdown table parsers (applications, pipeline, report headers) and `slugify`/`today` helpers.
- **`lib/ru-scanner.mjs`** — in-process scanner for 5 RU portals (since v1.29.0): hh.ru + Habr Career + Trudvsem + GetMatch + GeekJob. Reads `russian_portals:` from `portals.yml`, dispatches via `RU_DISPATCH` table keyed by `registry.mjs::RU_CONFIG_KEYS`, normalizes results to the common job shape, writes `data/scan-history.tsv` + `data/last-scan.json`. Adding a 6th source = one entry in the registry + one new adapter file + one row in `RU_DISPATCH`.
- **`lib/en-scanner.mjs`** — same shape but for the 6 EN ATS (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday), dispatching to `lib/sources/*.mjs`.
- **`lib/sources/*.mjs`** — per-portal HTTP clients (11 adapters as of v1.29.0): `ashby.mjs`, `greenhouse.mjs`, `lever.mjs`, `smartrecruiters.mjs`, `workable.mjs`, `workday.mjs` (EN ATS); `habr.mjs`, `hh.mjs`, `trudvsem.mjs`, `getmatch.mjs`, `geekjob.mjs` (RU portals). Each exports a uniform `search<Name>(query, opts)` returning normalized job objects with `{ id, title, company, url, salary, location, isRemote, workplaceType, relocates, date, snippet, source }`. The EN scanner reads `tracked_companies:` from `portals.yml`.
- **`lib/sources/registry.mjs`** *(v1.29.0)* — single source of truth for every adapter (`{ value, label, region, configKey }`). Consumed by `ru-scanner.mjs::RU_DISPATCH`, `GET /api/scan/sources`, and the SPA's `#/scan` source-filter dropdown. Pre-v1.29 the same list lived hardcoded in three places.
- **`lib/anthropic.mjs`** — minimal Anthropic SDK adapter. Exposes `runAnthropic(prompt, opts)`, `hasAnthropicKey()`, and `hasGeminiKey()` (REVIEW-B2). No streaming; bounded by `maxTokens`.
- **`lib/security.mjs`** *(P-2)* — `isValidJobUrl`, `stripDangerousMarkdown` (v1.22.0 M-4: entity-decoded), `sanitizeJobDescription`, `isPubliclyExposed`, **`sanitizePathName`** (v1.21.0 H-4: consolidated path-name sanitizer). Single source of truth for project-wide sanitizers; re-exported from `index.mjs` for backward-compat.
- **`lib/safe-fetch.mjs`** *(v1.21.0, B-1)* — DNS-rebind-safe GET. Resolves hostname once, pins TCP connect to validated IP, sets SNI/Host so cert validation still targets the original hostname. Used by `routes/pipeline.mjs` (preview proxy) and `routes/auto-pipeline.mjs` (JD fetch). Streams chunks and caps body at `opts.maxBytes`. Test hook: `_setTransport(fn)` for mocked upstreams.
- **`lib/file-lock.mjs`** *(v1.21.0, H-6)* — `withFileLock(path, fn)` — per-path async mutex. Wraps every read-modify-write on `applications.md` / `pipeline.md` so concurrent POSTs cannot drop rows. Independent paths run in parallel.
- **`lib/rate-limit.mjs`** *(v1.21.0, H-5)* — `llmRateLimit` middleware. No-op on loopback; 10 req/min/IP on public bind (`HOST=0.0.0.0`). Configurable via `LLM_RATE_LIMIT="N/Ws"`. Wired into all four LLM-calling routes.
- **`lib/prompts.mjs`** *(P-2)* — `bundleProjectContext`, `buildEvaluationPrompt`, `buildDeepPrompt`, `buildModePrompt`, `buildApplyChecklist`. Inlines parent files into Anthropic prompts (REVIEW-A1).
- **`lib/store.mjs`** *(P-2)* — defensive readers `safeReadApps/Pipeline/Reports`, `checkProfileCustomized`, plus the first-boot `ensureRussianPortalsDefaults`.
- **`lib/routes/activity.mjs`** *(P-2 phase 2)* — `registerActivityRoutes(app)` for `GET /api/activity`.
- **`lib/routes/config.mjs`** *(P-2 phase 2)* — `registerConfigRoutes(app)` for `GET/POST /api/config` (parent .env round-trip).
- **`lib/routes/content.mjs`** *(P-2)* — `registerContentRoutes(app)` for CV / Profile / Portals / Modes.
- **`lib/routes/health.mjs`** *(P-2 phase 2)* — `registerHealthRoutes(app)` for `/api/health`, `/api/dashboard`, and **`/api/status/providers`** *(v1.55.3)* — read-only LLM-provider readiness (`{ activeProvider, activeModel, keysConfigured }`, no secrets) for the SPA onboarding banner/chip + the ⚡ Run-live cost hint; `activeProvider` from `env-config.mjs::selectActiveProvider()`.
- **`lib/routes/help.mjs`** *(P-2 phase 2)* — `registerHelpRoutes(app)` for `/api/help/:lang`.
- **`lib/routes/jds.mjs`** *(P-2 phase 2)* — `registerJdsRoutes(app)` for the `/api/jds*` CRUD.
- **`lib/routes/llm.mjs`** *(P-2 phase 2)* — `registerLlmRoutes(app)` for `/api/evaluate`, `/api/evaluate/test-{gemini,anthropic}`, `/api/deep`, `/api/mode/:slug`, `/api/apply-helper`, `/api/interview-prep*`. **P-7** added the Anthropic branch in `/api/evaluate` (preferred over Gemini when both keys present) and `/api/evaluate/test-anthropic` smoke endpoint.
- **`lib/routes/pipeline.mjs`** *(P-2 phase 2)* — `registerPipelineRoutes(app)` for `/api/pipeline*` including the SSRF-safe preview proxy.
- **`lib/routes/reports.mjs`** *(P-2 phase 2)* — `registerReportsRoutes(app)` for `/api/reports*`.
- **`lib/routes/runners.mjs`** *(P-2)* — buffered `/api/run/*` table, streaming `/api/stream/{scan,liveness,pdf}`, generated-PDF list/download.
- **`lib/routes/scan.mjs`** *(P-2)* — `registerScanRoutes(app)` for the consolidated `/api/stream/scan?source=ats|regional|both` SSE endpoint, `/api/scan/regional/config`, `/api/scan-results`. v1.18.0 retired the `/api/stream/scan-{en,ru}` split aliases; v1.20.0 retired the `/api/scan-ru/config` legacy alias.
- **`lib/routes/tracker.mjs`** *(P-2 phase 2)* — `registerTrackerRoutes(app)` for `/api/tracker` GET + POST (dedup-aware). *(v1.55.8)* GET gains **optional** `?page=&pageSize=&status=` server-side pagination + a whole-history `funnel` count; with no params the response is byte-for-byte the legacy `{ rows }` (strict back-compat).
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
