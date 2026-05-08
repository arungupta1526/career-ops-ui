# Server Module Map — career-ops-ui

> Per-file purpose for `server/`. Pair with `OVERVIEW.md` (top-level) and `API.md` (route reference).

## `server/index.mjs` (~760 LOC, post-P-2 split)

The Express app factory `createApp()`. Phase **P-2** (May 2026) extracted helpers into `lib/{security,prompts,store}.mjs` and three route modules into `lib/routes/{scan,runners,content}.mjs`. Remaining route topics in `index.mjs`:

```
Security headers
Activity log middleware
App config (parent .env)
Help
Activity log routes
Health & Dashboard
Tracker
Pipeline
Reports
JDs
CV
Profile
Portals
Modes (templates)
Script runners (buffered / SSE)
Output PDFs
RU/EN portal scanners (in-process)
Evaluate
Deep research
Interview-prep archive
Generic mode prompts
```

Top-level helpers (defined as inline functions, used by multiple route handlers):

| Helper | Purpose |
|---|---|
| `isPubliclyExposed()` | True when `HOST` is not loopback. Gates CSP attachment + path redaction in /api/health. |
| `isValidJobUrl(url)` | SSRF guard. Rejects loopback, `file://`, `data:`, `gopher://`, IP literals, and strings with script chars / templates. |
| `stripDangerousMarkdown(md)` | Strip `<script>`, `javascript:` URLs, `onerror`/`onclick`/etc. attrs, base64 data URLs from Markdown before persisting CV. |
| `sanitizeJobDescription(s)` | JD ingress: cap length, strip control chars, normalize whitespace. |
| `buildEvaluationPrompt(jd)` | Compose the standard "score this JD vs the CV" prompt. |
| `buildDeepPrompt(company, role?)` | Compose the deep-research prompt. |
| `buildModePrompt(template, slug, ctx)` | Prepend a JSON `<context>` block to a mode template. |
| `safeReadApps()` / `safeReadPipeline()` / `safeListReports()` | Defensive readers — return empty array on missing files. |
| `checkProfileCustomized()` | Heuristic: is `profile.yml` still the placeholder shipped by career-ops? |

## `server/lib/`

### `paths.mjs` (60 LOC)

`resolveProjectRoot()`, `WEB_UI_ROOT`, `PUBLIC_DIR`, `PROJECT_ROOT`, `path()` helper, `PATHS` map (all paths the rest of the codebase needs). Single source of truth — never duplicate.

### `parsers.mjs` (190 LOC)

Markdown table parsers and slug helpers:

- `parseApplications(text)` → `{ num, date, company, role, score, scoreNum, status, pdf, report, notes }[]`
- `parsePipeline(text)` → `string[]` of URLs
- `addPipelineUrl(text, url)` → updated text (idempotent)
- `removePipelineUrl(text, url)` → updated text
- `parseReportHeader(text)` → `{ company, role, score, source, … }`
- `slugify(s)` — lowercases, strips non-`[a-z0-9-]`, collapses `-`
- `today()` — `YYYY-MM-DD`

### `runner.mjs` (90 LOC)

Spawns Node scripts in the parent project.

- `runNodeScript(script, args, opts)` — buffered, returns `{ code, stdout, stderr, killed }`. `opts.timeoutMs` defaults to 60 s.
- `streamNodeScript(res, script, args)` — SSE. Writes `event: start/log/done/error` frames. Kills child on `res.close`.

### `ru-scanner.mjs` (280 LOC)

In-process scanner for hh.ru + Habr Career.

- `loadConfig()` — reads `russian_portals:` block from `portals.yml`.
- `runRuScan({ writeFiles, onLog })` — fetches both APIs, normalizes to `{ company, role, url, source, area, salary }`, writes `data/scan-history.tsv` (append) and `data/last-scan.json` (replace) when `writeFiles`. Calls `onLog('stdout'|'stderr', line)` per progress event.

### `en-scanner.mjs` (230 LOC)

Same shape but for Greenhouse / Ashby / Lever via `lib/sources/*.mjs`.

- `runEnScan({ writeFiles, companyName?, onLog })` — `companyName` filters the company list to one entry.
- Reads `tracked_companies:` from `portals.yml` (career-ops v1.7+) and falls back to legacy `companies:`. Only entries with `enabled !== false` are scanned.
- `loadLastScan()` — reads `data/last-scan.json`, returns `{ en, ru, ... }` keyed by scan kind (or empty on missing).

### `sources/{greenhouse,ashby,lever,habr,hh}.mjs`

Per-portal HTTP clients. Each exports `fetchCompanyJobs(slug, opts)` returning a normalized job array. Self-contained — no shared state.

### `anthropic.mjs` (70 LOC)

Minimal Anthropic adapter.

- `hasAnthropicKey()` — boolean check on `process.env.ANTHROPIC_API_KEY`.
- `runAnthropic(prompt, { maxTokens })` — single non-streaming `POST /v1/messages`. Returns `{ markdown }` or `{ error }`.

Hardcoded model: see source. Bump model in a versioned commit; don't quietly switch.

### `security.mjs` (post-P-2)

Project-wide sanitizers and host-trust checks — single source of truth.

- `isValidJobUrl(url)` — SSRF guard. Rejects loopback, `file://`, `data:`, IP literals, oversized strings.
- `stripDangerousMarkdown(md)` — strip `<script>`, `<iframe>`, `on*=` handlers, `javascript:` URIs, etc. before persisting CV.
- `sanitizeJobDescription(s)` — JD ingress: cap length, strip control chars, normalize whitespace.
- `isPubliclyExposed()` — true when `HOST` is non-loopback (gates CSP attachment + path redaction).

Re-exported from `index.mjs` for backward-compat with earlier external consumers.

### `prompts.mjs` (post-P-2)

LLM-bound payload builders.

- `bundleProjectContext({ modeSlugs })` — read cv/profile/mode files, return delimited block. Used by Anthropic SDK calls (REVIEW-A1).
- `buildEvaluationPrompt(jd)` — `/api/evaluate` standard prompt.
- `buildDeepPrompt(company, role)` — `/api/deep` deep-research prompt.
- `buildModePrompt(template, slug, ctx)` — `/api/mode/:slug` generic mode wrapper.
- `buildApplyChecklist(url, jd)` — `/api/apply-helper` checklist text.

### `store.mjs` (post-P-2)

Defensive readers for parent-project Markdown / YAML, plus first-boot bootstrap.

- `safeReadApps()` / `safeReadPipeline()` / `safeListReports()` — return `[]` on missing/unreadable instead of throwing.
- `checkProfileCustomized()` — placeholder-name detector for the Health page nudge.
- `ensureRussianPortalsDefaults()` — idempotent first-boot append of `russian_portals:` to `portals.yml` (FIX-H2).

### `routes/scan.mjs` (post-P-2)

`registerScanRoutes(app)` — `/api/stream/scan-{ru,en}`, `/api/scan-ru/config`, `/api/scan-results`. Uses the in-process scanners; honors `AbortSignal` from client disconnect (REVIEW-B3).

### `routes/runners.mjs` (post-P-2)

`registerRunnerRoutes(app)` — buffered `POST /api/run/*` table (doctor, verify, normalize, dedup, merge, sync-check), streaming `GET /api/stream/{scan,liveness,pdf}`, and `GET /api/output/pdfs[/:name]` for generated-PDF list/download.

### `routes/content.mjs` (post-P-2)

`registerContentRoutes(app)` — CV (`GET /api/cv`, `PUT /api/cv` with `stripDangerousMarkdown`), Profile (`GET /api/profile`), Portals (`GET /api/portals`), Modes (`GET /api/modes`, `GET /api/modes/:name`).

### `dotenv.mjs` (40 LOC)

Tiny `.env` loader. Reads `KEY=VALUE` lines, ignores comments, supports unquoted and double-quoted values. Called once at boot from `server/index.mjs`.

### `env-config.mjs` (170 LOC)

Backs `/api/config`.

- `KNOWN_KEYS` — explicit allowlist of env vars the UI manages.
- `SECRET_KEYS` — subset whose values are masked on read.
- `parseEnv(text)` / `updateEnvFile(path, overrides)` — round-trip-safe.
- `maskSecret(value)` — preserves length hint, hides body.
- `validateConfig(body)` — per-key validators (URL format, ASCII-only, etc.).

### `activity-log.mjs` (160 LOC)

- `activityMiddleware(req, res, next)` — records every state-changing request to `data/activity.jsonl`. GET requests are recorded only for `/api/run/*` and `/api/stream/*`. Redacts `SECRET_KEYS` in body and headers.
- `readActivity({ limit, actionPrefix? })` — reads from the tail.
- `logActivity(entry)` — programmatic append (used internally).

## Cross-cutting concerns

### Security headers

Always-on baseline: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`. CSP attached only when `HOST` is non-loopback (loopback exposure is trusted; LAN exposure adds the CSP layer to mitigate XSS-via-LAN-attacker scenarios). The CSP excludes `'unsafe-inline'` from `script-src` — every event handler in the SPA is `addEventListener`.

### Body parsing limits

`express.json({ limit: '5mb' })` and `express.text({ limit: '5mb' })`. Long-string routes (CV markdown) enforce a tighter cap inline (1 MB) and return 413.

### Path-traversal guard

Every route that maps a `:param` to a filesystem path applies `replace(/[^\w\-.]/g, '')`. DELETE routes additionally require a known suffix (`.md`, `.txt`, `.pdf`).

### Timeouts

All outbound fetches use `AbortController`. All script spawns have a hard timeout. The streaming endpoints kill children on client disconnect (`res.on('close')`).

## Adding a new lib module

1. Single responsibility, < 400 LOC.
2. Pure functions where possible; side-effects (writes, network) clearly marked.
3. Export a named API; no default exports.
4. Add a unit test in `tests/<name>.test.mjs`.
5. If it reads/writes a parent file, document the row in `DATA-FLOWS.md` in the same PR.
6. If it hosts an Express route, register that in the `index.mjs` route table — do not export an Express subapp until phase P-2 is complete.
