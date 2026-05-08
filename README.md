# career-ops-ui

> An Airbnb-styled web interface for the [career-ops](https://github.com/santifer/career-ops) AI job-search pipeline.
> Search, evaluate, deep-dive, apply, and track every offer from a single browser tab — instead of bouncing between Claude Code, terminals, and markdown files.

**English** | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko-KR.md) | [日本語](README.ja.md) | [Русский](README.ru.md) | [简体中文](README.cn.md) | [繁體中文](README.zh-TW.md)

[![tests](https://img.shields.io/badge/tests-298%20passed-brightgreen)](#tests)
[![playwright](https://img.shields.io/badge/playwright-28%20e2e-brightgreen)](#tests)
[![node](https://img.shields.io/badge/node-%E2%89%A518-blue)](#requirements)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![release](https://img.shields.io/badge/release-v1.10.0-blue)](https://github.com/Fighter90/career-ops-ui/releases/tag/v1.10.0)

## What's new in v1.10.0

- **CV import** — `📁 Upload CV` now accepts `.docx`, `.doc`, `.odt`, `.rtf`, `.pdf`, `.html`, `.txt`, `.md`. Office formats convert via pandoc, PDFs via Poppler's `pdftotext`. Result is sanitized through the same XSS strip as paste, capped at 10 MB.
- **PDF auto-download** — when `📄 Generate PDF` finishes, the newest output PDF is auto-downloaded to your browser; the on-page list still keeps every previous one.
- **`#/config` two-tab layout** — API keys & runtime stay on tab one; the new **Profile** tab is a direct YAML editor for `config/profile.yml` (validated, header-stamped).
- **`#/profile` is now the canonical route** (was `#/settings`). The old hash still resolves so bookmarks keep working.
- **Help docs refreshed** in all 8 locales for every change above.

![career-ops-ui — vacancy search](./screen_vacancy_found.png)

## One-command install

```bash
curl -fsSL https://raw.githubusercontent.com/Fighter90/career-ops-ui/main/bin/setup.sh | bash
```

This clones both repos (career-ops + career-ops-ui), installs deps, and starts the server at http://127.0.0.1:4317.

---

## Why?

[career-ops](https://github.com/santifer/career-ops) is a powerful Claude-Code-driven job-search system: paste a JD → get a 0-5 fit score, an ATS-optimized PDF, and a tracker entry. It works great inside Claude Code, but the data lives across `cv.md`, `data/applications.md`, `reports/*.md`, `data/pipeline.md`, `portals.yml`, `config/profile.yml` — easy to lose, hard to skim.

`career-ops-ui` puts a polished UI on top:

- **Browse** the tracker, reports, and pipeline like a CRM.
- **Trigger** scans (Greenhouse / Ashby / Lever **and** hh.ru / Habr Career) and watch live SSE logs.
- **Evaluate** a JD live via Anthropic (preferred) or Gemini, or get a copy-paste prompt for Claude Code if no API key is set.
- **Deep research** companies live via Anthropic SDK with cv / profile / mode files inlined automatically.
- **Edit** `cv.md` with side-by-side markdown preview and server-side XSS sanitization.
- **Maintain** the system: doctor, verify, normalize, dedup, merge — one click each.
- **Multi-CLI:** drives identically from Claude Code, Codex, Cursor, Aider, or Gemini CLI — `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` shims point to a single source of truth.

It's pure additions: nothing inside `career-ops/` changes. All your customizations stay yours.

---

## Quick start

### 1. Install career-ops first

```bash
git clone https://github.com/santifer/career-ops.git
cd career-ops
```

Follow [career-ops onboarding](https://github.com/santifer/career-ops#first-run--onboarding) so `cv.md`, `config/profile.yml`, and `portals.yml` exist.

### 2. Drop career-ops-ui inside it

```bash
git clone https://github.com/Fighter90/career-ops-ui.git web-ui
```

Your tree now looks like:

```
career-ops/
├─ cv.md
├─ portals.yml
├─ config/
├─ data/
├─ modes/
├─ reports/
├─ scan.mjs … doctor.mjs … (etc)
└─ web-ui/                 ← this repo
   ├─ bin/start.sh
   ├─ package.json
   ├─ server/
   ├─ public/
   └─ tests/
```

### 3. Launch

```bash
bash web-ui/bin/start.sh
```

The script:

1. Checks Node ≥ 18.
2. `npm install` (only on first run, two deps — Express + js-yaml).
3. Starts the Express server on `127.0.0.1:4317`.
4. Opens http://127.0.0.1:4317/ in your default browser.

Custom port / host:

```bash
PORT=8080 bash web-ui/bin/start.sh
HOST=0.0.0.0 PORT=4317 bash web-ui/bin/start.sh   # expose on LAN
```

If you cloned the repo somewhere else (not as `career-ops/web-ui`), point at career-ops via env:

```bash
CAREER_OPS_ROOT=/path/to/career-ops bash bin/start.sh
```

---

## Requirements

| | |
| --- | --- |
| **Node.js** | ≥ 18 (uses native `fetch`, `node:test`) |
| **career-ops** | Cloned and onboarded — see above |
| **Optional** | `GEMINI_API_KEY` in `.env` of the parent project (free-tier model `gemini-2.0-flash`) for one-click JD evaluation. Otherwise the UI returns a copy-paste prompt for Claude. |
| **Optional** | `HH_USER_AGENT` in `.env` if running outside Russia and you want hh.ru API to stop returning 403. Habr Career works from any IP regardless. |
| **Optional** | Playwright (already a transitive dep of career-ops) for the e2e test suite. |

---

## What you get — by page

| Page             | What it does                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Dashboard**    | Aggregated counts (apps / pipeline / reports), avg score, status breakdown, latest 5 apps + latest report.         |
| **Scan**         | **🌐 Single Scan button** — runs every enabled source in one go (Greenhouse / Ashby / Lever for EN, hh.ru + Habr Career for RU). Live SSE log streaming + clickable results table with location / Remote-Hybrid badge / relocation flag / salary / source filters and dynamic stack / level / keyword chips. Active-Companies card lists every tracked board with its API health. |
| **Pipeline**     | CRUD on `data/pipeline.md`. Server-side preview proxy (SSRF-safe, per-hop redirect validation, 8 KB body cap). Jump straight from a URL to evaluate.       |
| **Evaluate**     | Paste JD → **Anthropic-first** (preferred when both keys present), then Gemini, then manual prompt fallback. Anthropic path inlines cv / profile / `_shared.md` / `oferta.md` automatically (REVIEW-A1). Save JD to `jds/` optional. |
| **Deep research**| Same fallback chain as Evaluate. Live Anthropic returns ~10-30 KB of grounded markdown saved to `interview-prep/<company>-<role>.md`. |
| **Modes**        | 7 generic mode pages (`/#/project`, `/#/training`, `/#/followup`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns`) with the same Anthropic / Gemini / manual fallback. |
| **Apply helper** | Generates a submission checklist; the actual Playwright form-fill stays in `/career-ops apply` inside Claude Code. |
| **Tracker**      | Filterable table over `data/applications.md` (status, score, free-text). One-click `normalize-statuses.mjs` / `dedup-tracker.mjs` / `merge-tracker.mjs`. Pipe + newline escapes are GFM-compliant — names like `"Acme \| Co"` round-trip losslessly. |
| **Reports**      | Browse and read every report under `reports/` with parsed header (Score / Legitimacy / URL).                       |
| **CV**           | Live markdown editor for `cv.md` with side-by-side preview + one-click `cv-sync-check.mjs` + 📁 Upload CV. Server-side XSS strip on save (`<script>`, `javascript:`, `on*=` handlers). |
| **Profile**      | Read-only view of `config/profile.yml` + archetypes — UI-friendly summary.                                         |
| **App settings** | In-UI editor for parent `.env` keys: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `HH_USER_AGENT`, model overrides, port / host. Secrets masked on read. |
| **Health**       | All setup checks in OK / OPTIONAL / FAIL badges + buttons to run `doctor.mjs` and `verify-pipeline.mjs`.           |
| **Help**         | In-app Markdown user guide (`/#/help`), localized for all 8 supported languages (en / es / pt-BR / ko-KR / ja / ru / zh-CN / zh-TW). |
| **Activity log** | Audit trail of every state-changing request (writes, runs, scans). Secrets redacted. |

Global keyboard shortcuts:

- `Ctrl+K` / `Cmd+K` — focus the global search.
- Pasting a URL into global search auto-adds it to the pipeline.
- `Esc` — close any open modal.

---

## Scan

Zero-token portal scanning that actually returns vacancies. **One 🌐 Scan button** in the UI runs every configured source in a single sweep:

- **Greenhouse / Ashby / Lever** — public boards-api for every company in `portals.yml::tracked_companies` with a recognizable ATS pattern. Bundled list covers Stripe, GitLab, Vercel, Cloudflare, Datadog, Discord, Elastic, Grafana Labs, CockroachDB, Fastly, Twilio, Coinbase, Reddit, Robinhood, Affirm, Lyft, Linear, Supabase, PostHog, Ramp, Modal Labs, Railway, Browserbase, JetBrains — extend or trim freely.
- **hh.ru** — public API (returns 403 from non-RU IPs; set `HH_USER_AGENT` in `.env` to a registered app UA, or run from a Russian IP, or skip — repeated 403s from one source are coalesced and the source is disabled mid-run).
- **Habr Career** — HTML scrape of `career.habr.com/vacancies`. Works from any IP, no auth.

All sources go through the same pipeline: normalize → filter (`title_filter.positive` / `title_filter.negative`) → dedup against `data/scan-history.tsv` + `data/pipeline.md` + `data/applications.md` → append to `data/pipeline.md` → save full result set to `data/last-scan.json` for the UI's filterable table.

Configure via `portals.yml`:

```yaml
title_filter:
  positive: [backend, engineer, senior, tech lead, golang, php]
  negative: [junior, intern, frontend, ios, android]
tracked_companies:
  - { name: Stripe, enabled: true, careers_url: https://job-boards.greenhouse.io/stripe }
  - { name: Linear, enabled: true, careers_url: https://jobs.ashbyhq.com/linear }
  # ...
russian_portals:
  sources: ["hh", "habr"]   # one or both
  area: 113                  # 1=Moscow, 2=SPb, 113=Russia, 1001=remote
  per_page: 50
  only_remote: false
  queries: ["Senior PHP", "Senior Go", "Tech Lead"]
```

Under the hood the SSE endpoints are still split (`/api/stream/scan-en` and `/api/stream/scan-ru`) so you can drive each independently from the API; the **🌐 Scan** UI button calls both back-to-back. Each fan-out honors `AbortSignal` from client disconnect — no orphan fetches.

---

## Architecture

```
career-ops-ui/
├─ CLAUDE.md                 # project-level agent instructions (canonical)
├─ AGENTS.md                 # Codex / Aider / generic CLI shim → CLAUDE.md
├─ GEMINI.md                 # Gemini CLI shim → CLAUDE.md
├─ .aiignore                 # exclusion list for AI tools
├─ .claude/                  # Claude Code agent config
│  ├─ agents/                # 3 project-specific subagents (route, view, test isolation)
│  └─ commands/               # slash-command stubs
├─ bin/start.sh              # one-shot launcher (Node check → npm install → server → open browser)
├─ package.json              # 2 runtime deps: express, js-yaml
├─ server/
│  ├─ index.mjs              # ~130 LOC orchestrator: middleware + 12 register<Topic>Routes(app) calls + SPA catch-all
│  └─ lib/
│     ├─ paths.mjs           # absolute paths to career-ops files (CAREER_OPS_ROOT aware)
│     ├─ parsers.mjs         # markdown / pipeline / report parsers (GFM-compliant pipe escapes)
│     ├─ runner.mjs          # runNodeScript() + streamNodeScript() with SIGTERM→SIGKILL escalation + 30 min cap
│     ├─ security.mjs        # isValidJobUrl, stripDangerousMarkdown, sanitizeJobDescription, isPubliclyExposed
│     ├─ prompts.mjs         # bundleProjectContext, buildEvaluationPrompt, buildDeepPrompt, buildModePrompt
│     ├─ store.mjs           # safeReadApps/Pipeline/Reports, checkProfileCustomized, ensureRussianPortalsDefaults
│     ├─ anthropic.mjs       # minimal Anthropic SDK adapter (runAnthropic, hasAnthropicKey, hasGeminiKey)
│     ├─ env-config.mjs      # .env round-trip with secret masking + validation
│     ├─ activity-log.mjs    # JSONL audit trail middleware (secrets redacted)
│     ├─ dotenv.mjs          # tiny dotenv loader
│     ├─ en-scanner.mjs      # in-process Greenhouse/Ashby/Lever orchestrator (AbortSignal aware)
│     ├─ ru-scanner.mjs      # in-process hh.ru + Habr orchestrator (AbortSignal aware)
│     ├─ sources/
│     │  ├─ greenhouse.mjs   # boards-api.greenhouse.io client
│     │  ├─ ashby.mjs        # api.ashbyhq.com client
│     │  ├─ lever.mjs        # api.lever.co client
│     │  ├─ hh.mjs           # api.hh.ru client (UA-aware)
│     │  └─ habr.mjs         # career.habr.com HTML parser (no cheerio, regex only)
│     └─ routes/             # 12 route modules — one per topic (P-2)
│        ├─ activity.mjs     # /api/activity
│        ├─ config.mjs       # /api/config (parent .env round-trip)
│        ├─ content.mjs      # /api/cv, /api/profile, /api/portals, /api/modes
│        ├─ health.mjs       # /api/health, /api/dashboard
│        ├─ help.mjs         # /api/help/:lang
│        ├─ jds.mjs          # /api/jds CRUD
│        ├─ llm.mjs          # /api/evaluate, /api/deep, /api/mode/:slug, /api/apply-helper, /api/interview-prep*
│        ├─ pipeline.mjs     # /api/pipeline + SSRF-safe preview proxy
│        ├─ reports.mjs      # /api/reports
│        ├─ runners.mjs      # /api/run/* + /api/stream/{scan,liveness,pdf} + /api/output/pdfs
│        ├─ scan.mjs         # /api/stream/scan-{ru,en} + /api/scan-results
│        └─ tracker.mjs      # /api/tracker
├─ public/                   # static SPA — no build step
│  ├─ index.html
│  ├─ css/app.css            # design tokens (Airbnb-inspired)
│  └─ js/
│     ├─ api.js              # fetch wrapper + connection-banner state + UI helpers + safe markdown renderer
│     ├─ router.js           # hash-based router with 404 fallback + alias support
│     ├─ app.js              # boot + global keyboard handlers + mobile sidebar drawer
│     ├─ lib/{i18n,skills}.js
│     └─ views/              # one file per page (dashboard, scan, pipeline, evaluate, deep, apply, tracker, reports, cv, settings, health, config, help, activity, mode-page)
├─ docs/                     # public reference: architecture, API, data-flows, SDD, conventions, reviews
│  ├─ PROJECT.md             # what / why / for-whom
│  ├─ ROADMAP.md             # current milestone + completed history
│  ├─ PRODUCTION-READINESS.md # honest deployment-gate assessment
│  ├─ sdd/{SDD-GUIDE,CONVENTIONS}.md
│  ├─ architecture/{OVERVIEW,SERVER,FRONTEND,API,DATA-FLOWS}.md
│  └─ reviews/REVIEW-*.md
└─ tests/                    # 284 unit + 12 Playwright + 23 e2e:full + 20 e2e:smoke
   ├─ parsers.test.mjs       # markdown / pipeline / report parsers (pure functions)
   ├─ api.test.mjs           # every endpoint, ephemeral server, no network
   ├─ {ru,en}-scanner.test.mjs   # mocked fetch
   ├─ pipeline-preview.test.mjs   # per-hop redirect validation (REVIEW-B1)
   ├─ anthropic.test.mjs     # SDK adapter + log-guard test (REVIEW-B4)
   ├─ url-validation.test.mjs    # SSRF reject sweep (FIX-M3 + M6 + M7)
   ├─ cv-xss.test.mjs        # stripDangerousMarkdown round-trip
   ├─ jd-sanitize.test.mjs   # sanitizeJobDescription
   ├─ help.test.mjs / help-ui.test.mjs    # i18n parity across all 8 locales
   ├─ playwright-smoke.mjs   # 12 browser flows (CV save, tracker, pipeline, evaluate, config, etc.)
   └─ e2e{,-comprehensive}.mjs   # full Playwright walkthrough
```

### Why no build step?

Vanilla HTML/CSS/JS keeps the surface area tiny: one `npm install` of two deps and you're running. No Webpack, no Vite, no `node_modules` of doom. The whole UI is < 30 KB minified. If you want hot-reload during development, `npm run dev` uses Node's built-in `--watch`.

### Spec-Driven Development

Non-trivial changes go through the GSD pipeline (`gsd-*` skills from `superpowers@claude-plugins-official`):

```
discuss → spec → plan → execute → verify → review
```

Public reference: [`docs/sdd/SDD-GUIDE.md`](docs/sdd/SDD-GUIDE.md). All planning artifacts live under `.planning/` (gitignored). The `docs/` tree is the long-lived public contract.

---

## API reference

All endpoints under `/api/*`. JSON in / JSON out unless noted.

### Health & dashboard

| Method | Path                     | Response                                                                    |
| ------ | ------------------------ | --------------------------------------------------------------------------- |
| GET    | `/api/health`            | `{ ok, warnings, version, parentVersion, checks: [{name, ok, required, value?}] }` |
| GET    | `/api/dashboard`         | `{ counts, avgScore, byStatus, recent, pipeline, lastReport }`              |
| GET    | `/api/activity?limit&type` | tail of `data/activity.jsonl` audit trail                                 |
| GET    | `/api/help/:lang`        | localized in-app user guide (fallback: `en.md`)                             |

### App settings (parent .env round-trip)

| Method | Path             | Purpose                                                                |
| ------ | ---------------- | ---------------------------------------------------------------------- |
| GET    | `/api/config`    | known env keys with secrets masked                                     |
| POST   | `/api/config`    | validate + write parent `.env`; applies to `process.env` in-place      |

### Data files

| Method | Path                                | Purpose                                                                |
| ------ | ----------------------------------- | ---------------------------------------------------------------------- |
| GET    | `/api/tracker`                      | `{ rows: [parsed applications.md] }`                                   |
| POST   | `/api/tracker`                      | body `{ company, role, score?, status?, url?, notes?, date? }` — dedup-aware (case-insensitive on company + role) |
| GET    | `/api/pipeline`                     | `{ urls: [...] }`                                                      |
| POST   | `/api/pipeline`                     | body `{ url }` → adds to `data/pipeline.md` with dedup + `isValidJobUrl` |
| GET    | `/api/pipeline/preview?url=…`       | server-side fetch proxy (per-hop SSRF check, ≤3 redirects, 8 KB cap) |
| DELETE | `/api/pipeline?url=…`               | removes a URL                                                          |
| GET    | `/api/reports`                      | parsed list of `reports/*.md`                                          |
| GET    | `/api/reports/:slug`                | full markdown + parsed header                                          |
| GET    | `/api/jds`                          | list of saved JD files                                                 |
| GET    | `/api/jds/:name`                    | text/plain — raw JD                                                    |
| POST   | `/api/jds`                          | body `{ text, slug? }` → saves to `jds/`                               |
| DELETE | `/api/jds/:name`                    | unlink (`.txt` suffix required)                                        |
| GET    | `/api/cv`                           | `{ markdown }`                                                         |
| PUT    | `/api/cv`                           | body `{ markdown }` → writes `cv.md` (XSS-stripped, ≤1 MB)             |
| GET    | `/api/profile`                      | `{ profile: yaml-parsed, raw: text }`                                  |
| GET    | `/api/portals`                      | `{ portals: yaml-parsed, raw: text }`                                  |
| GET    | `/api/modes`                        | list of mode files                                                     |
| GET    | `/api/modes/:name`                  | text/plain — raw mode prompt                                           |
| GET    | `/api/output/pdfs`                  | list of generated PDFs                                                 |
| GET    | `/api/output/pdfs/:name`            | download (`Content-Disposition: attachment`)                          |
| GET    | `/api/interview-prep`               | list of saved deep-research files                                      |
| GET    | `/api/interview-prep/:name`         | `{ name, markdown }`                                                   |
| DELETE | `/api/interview-prep/:name`         | unlink (`.md` suffix required)                                         |

### Script runners (buffered, one-shot)

| Method | Path                    | Wraps                       |
| ------ | ----------------------- | --------------------------- |
| POST   | `/api/run/doctor`       | `node doctor.mjs`           |
| POST   | `/api/run/verify`       | `node verify-pipeline.mjs`  |
| POST   | `/api/run/normalize`    | `node normalize-statuses.mjs` |
| POST   | `/api/run/dedup`        | `node dedup-tracker.mjs`    |
| POST   | `/api/run/merge`        | `node merge-tracker.mjs`    |
| POST   | `/api/run/sync-check`   | `node cv-sync-check.mjs`    |

All buffered runs cap at 60 s; SIGTERM → SIGKILL escalation after a 5 s grace period.

### Streams (SSE)

| Method | Path                          | Streams                            |
| ------ | ----------------------------- | ---------------------------------- |
| GET    | `/api/stream/scan`            | legacy `node scan.mjs` (subprocess)|
| GET    | `/api/stream/scan-en`         | in-process EN scanner — query: `dryRun=1`, `company=…` |
| GET    | `/api/stream/scan-ru`         | in-process RU scanner — query: `dryRun=1`              |
| GET    | `/api/stream/liveness`        | `node check-liveness.mjs`          |
| GET    | `/api/stream/pdf`             | `node generate-pdf.mjs`            |

SSE event types:

```
event: start    data: { script, args?, writeFiles? }
event: log      data: { stream: "stdout"|"stderr", line: string }
event: done     data: { code, counts?, errors? }
event: error    data: { message }
```

### LLM endpoints (Anthropic-first → Gemini → manual fallback)

| Method | Path                                | Purpose                                                                          |
| ------ | ----------------------------------- | -------------------------------------------------------------------------------- |
| POST   | `/api/evaluate`                     | body `{ jd, save? }` → JD evaluation (A–G sections per `oferta.md`)              |
| POST   | `/api/evaluate/test-gemini`         | smoke check `GEMINI_API_KEY`                                                     |
| POST   | `/api/evaluate/test-anthropic`      | smoke check `ANTHROPIC_API_KEY`                                                  |
| POST   | `/api/deep`                         | body `{ company, role?, run? }` → deep-research prompt or live grounded markdown |
| POST   | `/api/mode/:slug`                   | generic mode runner; allowlist: `batch`, `contacto`, `followup`, `interview-prep`, `patterns`, `project`, `training` |
| POST   | `/api/apply-helper`                 | body `{ url, jd? }` → application checklist                                      |
| GET    | `/api/scan-results`                 | `{ en: {when, fresh[], filtered[], errors[]}, ru: { ... } }` — last scan         |
| GET    | `/api/scan-ru/config`               | effective RU-scanner config (queries, negatives, sources)                        |

When `run: true` is set on `/api/deep` or `/api/mode/:slug`, the server prefers Anthropic (when both keys present), inlines `cv.md` + `config/profile.yml` + `modes/_shared.md` + the relevant mode template into a `<project_context>` block, and returns the model's grounded markdown directly. Soft cap: 200 KB on the assembled prompt — overflow returns 413.

---

## Tests

```bash
npm test                       # 284 unit/integration tests
npm run test:e2e               # 20 smoke e2e (boots own server)
npm run test:e2e:full          # 23 comprehensive e2e
npm run test:e2e:browser       # 12 Playwright browser-smoke
npm run test:coverage          # same as `npm test` plus V8 coverage
```

| Suite                       | Tests | What                                                                                                       |
| --------------------------- | ----- | ---------------------------------------------------------------------------------------------------------- |
| `node --test tests/*.test.mjs` (unit + integration) | **284** | Every endpoint, ephemeral server, no network. Includes parser, scanner (mocked), runner, anthropic, security headers, XSS, JD sanitize, URL validation, i18n parity. |
| `tests/e2e.mjs` (smoke)      | 20    | Playwright headless: every route renders, basic flows.                                                     |
| `tests/e2e-comprehensive.mjs` | 23    | Full Playwright walkthrough: 11 routes + 12 functional flows.                                              |
| `tests/playwright-smoke.mjs` (`npm run test:e2e:browser`) | **12** | Browser-driven smoke: dashboard render, navigation, language switch, 404, health, tracker round-trip (BF-1), pipeline add + invalid-URL sweep, reports empty, evaluate manual fallback, config keys masked, CV PUT XSS strip, pipeline preview 400. |
| **Total**                   | **339** | **0 fails, 0 flakes**                                                                                    |

Coverage: ~93% line / ~83% branch via `--experimental-test-coverage`.

Parsers are pure functions (no I/O) — tested against real data fragments from `applications.md`, `pipeline.md`, and `reports/*.md`. API tests boot the Express app on an ephemeral port and exercise every endpoint end-to-end. Scanner tests mock `fetch` so they pass even if hh.ru blocks your IP. The Playwright browser smoke runs against the in-process server and resolves Playwright via the parent project's `node_modules` — no new dependency in `web-ui/`.

CI runs the unit + e2e + Playwright matrix on every push to `main` against Node 18 / 20 / 22.

---

## Configuration

Environment variables (read at server start, all optional except where noted):

| Var                  | Default            | Purpose                                                                            |
| -------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| `PORT`               | `4317`             | Express bind port                                                                  |
| `HOST`               | `127.0.0.1`        | Express bind host. CSP attaches when non-loopback; auth gate planned for v2.0.0.   |
| `CAREER_OPS_ROOT`    | `..` from script   | Where to find `cv.md`, `data/`, `portals.yml`, `modes/`, etc.                      |
| `ANTHROPIC_API_KEY`  | unset              | Enables `/api/evaluate`, `/api/deep`, `/api/mode/:slug` live mode (preferred when both keys set). |
| `ANTHROPIC_MODEL`    | `claude-sonnet-4-6` | Override Anthropic model.                                                         |
| `GEMINI_API_KEY`     | unset              | Forwarded to `gemini-eval.mjs` and used as fallback for `/api/evaluate`.           |
| `GEMINI_MODEL`       | `gemini-2.0-flash` | Override Gemini model.                                                             |
| `HH_USER_AGENT`      | unset              | Override hh.ru User-Agent (helps reduce 403 from non-RU IPs)                       |

`portals.yml` extension recognized by this UI (add to your existing file in the parent project):

```yaml
russian_portals:
  sources: ["hh", "habr"]
  area: 113          # hh.ru area id
  per_page: 50
  only_remote: false
  queries: ["Senior PHP", "Тимлид Go", ...]
```

You can also extend any company entry with an explicit `api:` URL. See [`docs/portals-examples.md`](docs/portals-examples.md) (in this repo) for ready-to-paste blocks for 24 verified companies.

---

## Security notes

- Server binds to `127.0.0.1` by default — never exposed to the internet without explicit `HOST=0.0.0.0`.
- All file path inputs from the client are sanitized (`replace(/[^\w\-.]/g, '')`).
- Subprocess invocations use `spawn` with arg arrays — **no shell interpolation, ever**.
- Streaming endpoints kill the child process on client disconnect (no orphaned scanners).
- Write endpoints touch only known career-ops paths: `data/`, `jds/`, `cv.md`, `config/`, `portals.yml`, `output/`. Never anywhere else.
- The connection banner pings `/api/health` every 3 s while disconnected and auto-clears on recovery — no toast spam.

---

## Limitations

The fully LLM-driven modes (`oferta`, `deep`, `contacto`, `apply`, `batch`, `patterns`, `followup`) need an LLM to actually run. The web UI gives you three options:

1. **Anthropic (preferred)** — set `ANTHROPIC_API_KEY` in the parent project's `.env`. Routes through `runAnthropic` with `cv.md` / `config/profile.yml` / `modes/_shared.md` / mode template inlined automatically (REVIEW-A1). Verified live in v1.8.0+ with `claude-sonnet-4-6` returning 26 KB of grounded markdown for a deep-research call.
2. **`gemini-eval.mjs`** as fallback — works out of the box when only `GEMINI_API_KEY` is set.
3. **Copy-paste prompt** — when no key is set, the UI generates a ready prompt formatted for Claude Code / ChatGPT / Gemini Web.

The existing `/career-ops apply` Playwright form-fill flow inside Claude Code remains the only way to truly auto-fill application forms — the UI's *Apply helper* generates a checklist instead.

For the production-readiness assessment (deployment gates, risk register, deferred work), see [`docs/PRODUCTION-READINESS.md`](docs/PRODUCTION-READINESS.md). TL;DR: ready for single-tenant loopback; LAN exposure waits on the v2.0 P-12 auth gate.

---

## Contributing

Issues and PRs welcome. House rules:

- Run `npm test` before pushing — **284 checks green** is the bar (plus 12 Playwright if you touch UI).
- Non-trivial changes go through the GSD pipeline. See [`docs/sdd/SDD-GUIDE.md`](docs/sdd/SDD-GUIDE.md).
- Don't modify anything in the parent `career-ops/` project from inside this repo. The whole point is that this is a non-invasive overlay. Hard rules in [`CLAUDE.md`](CLAUDE.md).
- Conventional commits: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`. Optional scope: `feat(scan):`. Breaking change: `feat!:`.
- Tests must be CI-isolated — bootstrap fixtures via `mkdtempSync` or `CAREER_OPS_ROOT=$(mktemp -d)`.

Driving the repo from a non-Claude CLI (Codex, Aider, Cursor, Gemini)? Read [`AGENTS.md`](AGENTS.md) or [`GEMINI.md`](GEMINI.md) — both shim to the canonical `CLAUDE.md`.

---

---

## 🌍 Getting Started — first steps after install

After the one-command install you have two empty git clones, scaffolded with
starter `cv.md`, `config/profile.yml`, `portals.yml`, `data/applications.md`,
and `data/pipeline.md` files containing **EDIT ME** markers. The Health page
should already be all-green on first launch. Replace the placeholders with
your real data:

### 1. Create your CV (`cv.md`)

You have three options:

- **Option A — paste an existing resume:** open `career-ops/cv.md`, replace
  the EDIT-ME placeholders with your real resume in clean markdown
  (sections: Summary, Experience, Projects, Education, Skills). The simpler
  the better — `career-ops` reads it as plain text.
- **Option B — upload from the UI:** click **CV** in the sidebar →
  **📁 Upload CV** → pick your `.md` / `.txt` file → review the preview →
  click **💾 Save**.
- **Option C — give your LinkedIn URL to Claude Code:** open Claude Code in
  `career-ops/`, run `/career-ops`, paste your LinkedIn URL, and ask
  *"extract my CV from this and write it to cv.md"*.

Make every metric specific (e.g. *"reduced p99 latency by 38%"* not
*"improved performance"*). The evaluation pipeline reads metrics straight
from this file.

### 2. Edit your profile (`config/profile.yml`)

```bash
$EDITOR career-ops/config/profile.yml
```

Replace the placeholders for full name, email, location, LinkedIn, target
roles, archetypes, salary target. The **archetypes** are the most important
field — they're how every JD is matched against you.

### 3. Tune the scanner (`portals.yml`)

```bash
$EDITOR career-ops/portals.yml
```

Set `title_filter.positive` (e.g. `"PHP"`, `"Go"`, `"Backend"`, `"Senior"`)
and `title_filter.negative` (e.g. `"Junior"`, `"Java"`, `"iOS"`) to your
stack and seniority. The bundled `tracked_companies` list already includes
3 verified Greenhouse / Ashby boards (GitLab, Vercel, Linear). For 24+ more
ready-to-paste blocks, see [`docs/portals-examples.md`](docs/portals-examples.md).

If you want hh.ru / Habr Career scanning, edit the `russian_portals:` block
that the setup script created — add your search queries (e.g. `"Senior PHP"`,
`"Тимлид Go"`).

### 4. (Optional) LLM API keys

The UI prefers Anthropic over Gemini when both are present. Either or
neither works — without a key, **Evaluate** returns a copy-paste prompt
for Claude Code instead.

```bash
# Anthropic (preferred)
echo "ANTHROPIC_API_KEY=sk-ant-..." >> career-ops/.env
# Gemini (fallback)
echo "GEMINI_API_KEY=AIza..." >> career-ops/.env
```

Or set them via the **App settings** page in the UI (`/#/config`) — same
file, masked-on-read, applied to `process.env` immediately.

### 5. Verify and start working

Refresh the Health page — every required check should be green. Then:

1. Click **🌐 Scan** → wait ~5 seconds → Greenhouse / Ashby / Lever +
   hh.ru / Habr Career are scanned, vacancies appear in the table below.
2. Click any title → the original posting opens in a new tab.
3. Filter by stack chips (PHP / Go / Backend / Senior) until you see
   something promising.
4. Copy the URL → paste it into **Pipeline** → click **Evaluate** to
   score it 0-5 live (Anthropic / Gemini) or get a manual prompt.
5. Reports land in `reports/`, tracker in `data/applications.md`,
   live deep-research in `interview-prep/`. All visible in the UI.

> Translations of this guide live in each language-specific README:
> [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) ·
> [한국어](README.ko-KR.md) · [日本語](README.ja.md) ·
> [Русский](README.ru.md) · [简体中文](README.cn.md) ·
> [繁體中文](README.zh-TW.md)

---

## License

MIT. See [LICENSE](LICENSE).

Built on top of [career-ops](https://github.com/santifer/career-ops) by [santifer](https://santifer.io). Thanks for the brilliant pipeline.
