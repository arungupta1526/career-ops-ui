# Changelog

All notable changes to **career-ops-ui** are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/).

Translations: [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

---

## [1.7.2] — 2026-05-04

Help center + "Show result" shortcut on every prompt-builder.

### ✨ New features

- **`feat(help): in-app user guide` (`/#/help`)** — long-form Markdown documentation accessible from a new sidebar entry. Covers every page step-by-step: quick start, CV editor, Profile, Scan filters, Pipeline preview, Evaluate, Deep research, Apply, Tracker, Reports, all 7 modes, Activity log, Health, setup hints. Auto-built sticky table of contents from `<h2>` headings. Localized for all 8 supported locales — full versions in `docs/help/{en,ru}.md`, concise but complete versions in `es / pt-BR / ko-KR / ja / zh-CN / zh-TW`.
- **`feat(modes): "⚡ Show result" button alongside "Copy prompt"`** — when a prompt is generated in manual mode, users no longer have to retype their inputs to get the LLM result. The new button re-submits the same form with `run: true`, falling through to a clear toast (`Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env first`) when no key is configured. Works on `/#/deep`, `/#/project`, `/#/training`, `/#/followup`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns`.

### 📦 New REST endpoint

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/help/:lang` | Returns the Markdown user guide for the requested locale, falling back to `en.md`. Path-traversal-safe (regex sanitizer). |

### 🌐 i18n

- 5 new keys: `nav.help`, `help.title`, `help.subtitle`, `help.toc`, `deep.showResult`, `deep.needKey`. All 8 locales populated.

### 🧪 Tests

- `tests/help.test.mjs` (12 cases): every supported locale returns substantive markdown (>500 chars, starts with `#`); EN spot-checks coverage of every page slug; unknown lang falls back to EN; path-traversal sanitized; all 8 files reference `cv.md` / `profile.yml` / `.env`.

### 📊 Stats

- **Tests:** 233 → **237** (+4 net after the 12 help additions de-duplicated against existing).
- **Coverage:** 93.5% line / 82.6% branch / 93.7% funcs (unchanged).

---

## [1.7.1] — 2026-05-04

Patch release stacking the post-v1.7.0 work: pipeline preview pane, Anthropic API integration, scrollable sidebar, dotenv loader, dynamic Active-companies list, CI workflow hardening.

### ✨ Pipeline preview pane

- **`/#/pipeline` overhaul** — left list + right preview pane. Click any URL to fetch a server-side proxied snapshot (`GET /api/pipeline/preview` strips scripts/styles/tags, caps at 8 KB, validated through `isValidJobUrl`). Live filter input, "In queue" counter, ⚡ "Evaluate first" header button. Inline ▶/✕ on every row plus full Evaluate / Open in tab / Delete on the preview pane. Stable test selectors via `data-url` + `.pipeline-row` + `.pipeline-row-delete` classes. **8 new tests** in `tests/pipeline-preview.test.mjs` (mocked fetch, no upstream binding needed).

### ✨ Anthropic API integration — "Run live" everywhere

- **`server/lib/anthropic.mjs`** — zero-dependency client for Anthropic Messages API (claude-sonnet-4-6 default, override via `ANTHROPIC_MODEL`). When `ANTHROPIC_API_KEY` is set, every mode page (`/#/deep`, `/#/project`, `/#/training`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns`) renders an "⚡ Run live (Anthropic)" button as the **primary** action — clicking executes the prompt and renders Markdown back into the browser instead of handing off to Claude Code. Gemini stays as fallback when only its key is set. Manual mode still works with no keys at all. **8 new tests** in `tests/anthropic.test.mjs`.

### 🐛 CI / pipeline fixes

- **`fix(api): tighten pipeline URL validator` (FIX-M7)** — now also rejects loopback hostnames, length <10 or >2000, whitespace inside URLs.
- **`fix(server): actually load .env so HH_USER_AGENT / GEMINI_API_KEY hints work`** — added `server/lib/dotenv.mjs` (35-line zero-dep loader) wired in at the top of `server/index.mjs`. The runtime hints in scanner code finally do something. **6 new tests**.
- **`fix(ui): scrollable sidebar`** — 18 nav items in 6 groups overflowed shorter viewports. `.sidebar` now has `overflow-y: auto` with thin custom-styled scrollbars.
- **`fix(ui): make HH_USER_AGENT banner dismissible`** — then removed entirely from `/scan` once we realized it was overkill. Health page check still surfaces it.
- **`fix(scan): Active companies list is now collapsible + filterable + grouped`** — 87 tags flat was overwhelming. Now a "▸ Active companies 87/71" toggle expands an ordered list (✓ API-backed first, ○ websearch second) plus a search filter.
- **`fix(test): isolate api.test.mjs + en-scanner.test.mjs from parent project`** — both now spin up tmp project roots so CI works without the parent checked out alongside web-ui.
- **`fix(workflow): publish-package version-match only on release events`** — `workflow_dispatch` from main no longer fails the tag/version check.
- **`fix(e2e): stable selector for pipeline row delete`** — restored anchor wrapper + added `data-url` attribute so e2e suite is selector-stable.

### 📦 New REST endpoint

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/pipeline/preview?url=…` | Server-side proxy: returns visible-text snapshot of the URL (scripts/styles stripped, 8 KB cap), gated by `isValidJobUrl`. |

### 📊 Stats after this batch

- **Tests:** 225 → **233** (8 more on top of v1.7.0).
- **Test files:** 25 → **26**.
- **E2E:** 20 + 23 = 43 Playwright steps, all green.

---

## [1.7.0] — 2026-05-03

A 35-commit hardening + UX + feature-completion pass driven by QA r5. Three security layers landed (XSS sanitization, CSP, input validation), every missing CRUD endpoint was filled in, the parent-project bootstrap is now fully automated, and the UI gained **9 new pages** — Activity, redesigned Deep Research, plus 7 sidebar-grouped modes (project / training / followup / batch / outreach / interview-prep / patterns) covering 100% of parent's `modes/`. Pipeline gained a server-side preview pane. Anthropic API integration makes "Run live" a one-click action across all modes. Test coverage went from **73** to **225**, across **25 test files**, plus **23 comprehensive Playwright e2e steps**. GitHub Actions ship CI / AI review / Release / Publish-Package workflows.

### 🔒 Security

- **`fix(cv): sanitize CV markdown to block stored XSS in preview` (FIX-C10)** — `PUT /api/cv` now strips `<script>`, `<iframe>`, `<object>`, `<embed>`, `<style>`, `<form>`, `<svg>`, `on*=` event handlers, and `javascript:`/`vbscript:`/`data:text/html` URIs before writing `cv.md`. Body capped at 1 MB (413 on overflow). Client-side `UI.md()` was rewritten to escape every byte before any markdown transformation runs, so raw HTML can never reach `innerHTML`. Link `href` attributes are validated against an allowlist of safe schemes (`http`/`https`/`mailto`/`tel`/relative + `data:image` only). 17 new tests across the strip helper and HTTP round-trips.
- **`fix(server): add CSP and baseline security headers` (FIX-L2)** — every response now carries `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`. When the server binds beyond loopback (`HOST` ≠ `127.0.0.1`/`::1`/`localhost`), a strict `Content-Security-Policy` is layered on top: `default-src 'self'`, `script-src 'self'` (no `unsafe-inline`), Google Fonts whitelisted, `connect-src 'self'` blocks XSS exfiltration. Inline `onclick` handlers in `index.html` and `router.js` were moved to `addEventListener` to keep the strict CSP intact. 8 new tests gating CSP across 5 different `HOST` values.
- **`fix(api): tighten pipeline URL validator` (FIX-M7)** — `POST /api/pipeline` used to accept `"not-a-url"` and persist it. Now `isValidJobUrl()` rejects bare strings, inputs <10 or >2000 chars, whitespace-containing URLs, non-`http(s)` schemes, and loopback hostnames (`localhost`/`127.0.0.1`/`::1`). Folds in **FIX-M3** + **FIX-M6** (return 400 on invalid, plus a `deduped` flag on success).
- **`fix(server): actually load .env so HH_USER_AGENT / GEMINI_API_KEY hints work`** — previously the runtime told users to "set HH_USER_AGENT in .env" but the server never read that file, so following the instruction did nothing. Adds a 35-line zero-dependency dotenv loader (`server/lib/dotenv.mjs`) wired in at the top of `server/index.mjs`. Process-env values set on the command line still win, so existing CI overrides aren't shadowed. Parent's `.env.example` now includes a documented `HH_USER_AGENT` block with a real-Chrome User-Agent example. 6 new tests.
- **`fix(api): sanitize JD before prompt assembly` (FIX-M5)** — `POST /api/evaluate` strips ANSI escapes, control bytes, inline `<script>` tags, and trims whitespace before either calling Gemini or echoing the prompt back. 50 KB length cap. The 50-char minimum runs against the *sanitized* text, so prompt-injection attempts that look long enough but consist mostly of escapes fail-fast with 400.
- **`fix(health): mask Node version + project root when HOST!=loopback` (FIX-M1)** — `/api/health` no longer fingerprints the host on LAN-exposed deployments. Loopback responses keep the values for local diagnostics.

### ✨ New features

- **`feat: 7 new sidebar modes + grouped sidebar` (FIX-C8)** — covers 100% of the parent's `modes/` directory with no UI gaps. New routes: `#/project` (portfolio project advisor), `#/training` (course / cert evaluation), `#/followup` (per-application cadence), `#/batch` (parallel URL processor), `#/contacto` (LinkedIn outreach drafter), `#/interview-prep` (stage-specific prep), `#/patterns` (rejection-pattern analyzer). All seven share a single config-driven view factory (`public/js/views/mode-page.js`) and a single generic endpoint `POST /api/mode/:slug` — adding a new mode in the future is one config row + one i18n block. Sidebar reorganized into 6 groups: Sourcing / Decision / Application / Networking / Analytics / Setup. 18 nav items total. 12 new tests in `tests/modes-endpoints.test.mjs`.
- **`fix: bootstrap parent deps + russian_portals defaults` (FIX-C4 + C9 + C12 + H2)** — `bin/start.sh` now installs the parent's `node_modules` (js-yaml, playwright, jsdom) AND `npx playwright install chromium` on fresh clones, so `/api/stream/scan`, `/pdf`, and `/liveness` work end-to-end out of the box. `createApp()` probes `portals.yml` on every boot — if the `russian_portals:` block is missing, appends a documented default with comments. Idempotent: the second boot is a no-op. 3 new tests.
- **`fix: disable 9 dead portal slugs in template + health-check script` (FIX-C3)** — `templates/portals.example.yml` now ships with Ada / Factorial / Tinybird / Weights & Biases / Travelperk / Clarity AI / Forto / Vinted / Runway flagged `enabled: false` (each entry has an inline reason comment). New installs scan **87** alive companies instead of 96. New `web-ui/scripts/portals-health-check.mjs` HEAD-probes every enabled `careers_url` and reports DEAD entries with a suggested patch list (JSON output via `--json`). 3 new tests.
- **`feat(activity): user-action log + Activity sidebar page`** — every state-changing API request is captured to `data/activity.jsonl` (timestamp, action verb, target, success flag, optional detail). New sidebar entry **Activity** with action-prefix chip filters (pipeline / cv / jd / evaluate / scan / stream / script), action ✓/✗ badges, and refresh button. Auto-rotates at 5 MB. 10 new tests covering middleware, read filters, corrupt-line tolerance, and the recursion guard for `GET /api/activity` itself.
- **`feat(deep): view Deep Research in browser + saved-results archive`** — the Deep Research page now (a) runs the prompt through Gemini live when `{ run: true }` and `GEMINI_API_KEY` is set, persisting output to `interview-prep/{slug}.md`; (b) lists every saved deep-research file as clickable cards with relative timestamps; (c) renders results as Markdown with **📋 Copy / ⬇ Download .md / ↗ Open in tab** actions per result. New REST surface: `GET /api/interview-prep`, `GET /api/interview-prep/:name`, `DELETE /api/interview-prep/:name`. 7 new tests.
- **`feat(cv): generate + download PDF in browser, with PDF archive`** — new **📄 Generate PDF** button on the CV page streams `/api/stream/pdf` in a modal console. On `ERR_MODULE_NOT_FOUND` / `playwright` errors, it surfaces a copy-pasteable bootstrap command. New "Generated PDFs" section auto-loads after each successful run, listing every `output/*.pdf` with **↗ Open** and **⬇ Download** buttons. New REST surface: `GET /api/output/pdfs`, `GET /api/output/pdfs/:name`. 6 new tests.
- **`feat(api): POST /api/tracker — append rows from the UI` (FIX-H8)** — append a canonical row to `data/applications.md` from the browser. Validates company + role, normalizes status against `templates/states.yml`, auto-increments zero-padded `#`, dedups by company+role (case-insensitive), pipe-escapes notes so the markdown table doesn't fracture. Bootstraps the table when the file is empty. 6 new tests.
- **`feat(api): DELETE /api/jds/:name` (FIX-H4)** — remove saved JDs without shelling out. Path-traversal characters are stripped before any filesystem touch; the parameter must end in `.txt`. 5 new tests, including `../../etc/passwd` refusal.
- **`feat(api): POST /api/evaluate/test-gemini` (FIX-H7)** — smoke-test endpoint that runs a 50-char dummy JD through `gemini-eval.mjs` so the user can verify the API key works without sitting through a real evaluation. Returns `{ ok, code, sampleLength, sample }`.

### 🐛 Bug fixes

- **`fix(router): catch-all 404 view + i18n coverage guard` (FIX-C7)** — unknown hash routes used to silently fall back to the dashboard, masking typos and broken bookmarks. Now `#/totally-random-xyz` renders a dedicated 404 page that quotes the bad path back and links to the dashboard. The 404 view is registered inside the router IIFE itself so it cannot collide with any user route. New `tests/i18n-coverage.test.mjs` runs `i18n.js` inside a `vm.Context` with a stub `window`, exposes the private `DICT`, and asserts every one of the 173+ keys × 8 locales is populated and non-empty. 4 new router tests.
- **`fix(router): alias #/profile → settings` (FIX-C2)** — the internal route name is `settings` (with `nav.settings` rendering "Profile") but external links and muscle memory go to `#/profile`. Now both addresses reach the same view, and the sidebar nav-item lights up either way. 2 new tests.
- **`fix(health): unify Health/Doctor + flag template profiles` (FIX-C6 + FIX-H6)** — Health and Doctor were two different sources of truth. Now `/api/health` exposes everything Doctor reports (parent-deps, Playwright, dirs, profile-customized, `HH_USER_AGENT`). The `Profile customized` check detects placeholder names (`Jane Smith`, `Alex Doe`, `John Doe`, `Your Name`, `Test User`) and explicit YAML parse errors. 4 new tests.
- **`fix(scan): warn on query↔negative collisions in RU config` (FIX-H3)** — when `portals.yml` ships with `"PHP"` in `title_filter.negative` while the queries target Senior PHP, every match gets filtered and the user sees zero results. `loadConfig()` now computes a `warnings` array; `runRuScan()` emits each warning as an SSE stderr line before the scan starts. 2 new tests verify the shipped defaults stay PHP-friendly out of the box.
- **`fix(scan): warn when HH_USER_AGENT is unset` (FIX-H1)** — the `/scan` page probes `/api/health` and shows a yellow warning card above the action row when `HH_USER_AGENT` is empty, so users know about the hh.ru 403 *before* they click RU scan.
- **`fix(api): warn when POST /api/jds slug had unsafe chars stripped` (FIX-M2)** — slug normalization that strips dangerous characters now returns a `warning` field; pure case/whitespace cleanup stays silent. Empty result after sanitization returns 400.
- **`fix(ui): clear global search on route change + button spinners` (FIX-M4 + FIX-L1)** — the global-search input is cleared on `hashchange` (with a guard for active typing). New `UI.withSpinner(button, fn)` helper wires loading state, ARIA, and double-click prevention into every async button click. Already adopted on Doctor / Verify / sync-check / Save CV / Normalize / Dedup / Merge buttons.
- **`fix(ui): make sidebar scrollable so 18 nav items always reach the footer`** — the grouped sidebar from FIX-C8 overflowed shorter viewports; bottom items (Activity / Health) were clipped. `.sidebar` now has `overflow-y: auto` with thin custom-styled scrollbars (WebKit + Firefox). Footer stays pinned via the existing `margin-top: auto`.
- **`fix(ui): empty modal-title placeholder` (FIX-H9)** — the hardcoded English `"Title"` string in `index.html` is gone, closing the brief race window where it was visible during modal open.

### 🌐 i18n

- 173+ translation keys × 8 supported locales (`en`, `es`, `pt-BR`, `ko`, `ja`, `ru`, `zh-CN`, `zh-TW`). New keys added across all locales for: 404 page, activity log, deep research, PDF flow, security warnings, tracker mutation, apply rename. Coverage is now enforced by `tests/i18n-coverage.test.mjs` — every key must have a non-empty value in every supported locale or CI fails.

### ⚙️ DevOps

- **Test count:** 73 → **201** (+128 tests across 23 test files). The single remaining failing test (`runEnScan: dry-run end-to-end across multiple sources`) is a pre-existing flake dependent on Greenhouse/Ashby/Lever live API responses.
- **Comprehensive Playwright e2e** (`tests/e2e-comprehensive.mjs`, 23 steps): walks the full user journey — CV save → preview → PDF generation → all 7 new modes → tracker filters → activity log → 404 → modal ESC → sidebar scroll → Ctrl-K focus → search clear → profile alias → language persistence.
- **GitHub Actions** (`.github/workflows/`):
  - `ci.yml` — unit + integration tests on Node 18/20/22 matrix, plus i18n coverage gate (every key × 8 locales must be non-empty), plus the full Playwright e2e on every PR.
  - `ai-review.yml` — Claude Code AI review on every PR. Maintainers retain merge authority; Claude only suggests. Skip via `skip-ai-review` label.
  - `release.yml` — auto-publish a GitHub Release when a `v*.*.*` tag is pushed; release notes are sliced from `CHANGELOG.md` so all 8 language variants stay the canonical source.
- **CSP-friendly UI:** all inline `onclick` handlers removed from `index.html` and `router.js`. The strict `script-src 'self'` policy is now enforceable without breaking any feature.

### 📦 New REST endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET`    | `/api/activity`                  | List user-action events, newest first |
| `GET`    | `/api/interview-prep`            | List saved Deep Research files |
| `GET`    | `/api/interview-prep/:name`      | Read a single Deep Research file |
| `DELETE` | `/api/interview-prep/:name`      | Remove a Deep Research file |
| `GET`    | `/api/output/pdfs`               | List generated PDFs |
| `GET`    | `/api/output/pdfs/:name`         | Stream a PDF as an attachment |
| `POST`   | `/api/tracker`                   | Append a row to `applications.md` |
| `DELETE` | `/api/jds/:name`                 | Remove a saved JD |
| `POST`   | `/api/evaluate/test-gemini`      | Smoke-test the Gemini API key |
| `POST`   | `/api/mode/:slug`                | Generic prompt builder for the 7 new modes (project / training / followup / batch / contacto / interview-prep / patterns) |

---

## [1.6.0] — 2026-05-02

Initial public release of the web UI. See `README.md` for the feature inventory at this baseline.
