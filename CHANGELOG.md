# Changelog

All notable changes to **career-ops-ui** are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/).

Translations: [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

---

## [1.11.1] — 2026-05-13

Deep career-ops.org/docs integration — follow-up to v1.11.0. Where v1.11.0 added a summary block, v1.11.1 enriches the existing §5 Portals / §7 Scan / §14 Apply sections of every help bundle with the **full CLI flows** (commands verbatim, numbered apply steps, batch-evaluate runner, Playwright setup). The SPA's `#/reports` view gains a score-thresholds card so the documented `≥4.5 / 4.0-4.4 / 3.5-3.9 / <3.5` action table is visible inline.

### 📝 Docs

- **Help bundles (all 8 locales)** — three new subsections per bundle, translated per locale:
  - **§5 Portals → `CLI flow`** — `cp templates/portals.example.yml portals.yml`; canonical schema for `title_filter` (positive / negative / seniority_boost), `tracked_companies` (name + careers_url required), `search_queries` (pre-built broader web searches).
  - **§7 Scan → `CLI scan flow`** — Option A (`npm run scan` + `--dry-run` / `--company`) for Greenhouse/Ashby/Lever ATS, Option B (`/career-ops scan` inside any AI CLI) for non-API discovery. Output to `data/pipeline.md` + `data/scan-history.tsv`. Action-thresholds table.
  - **§14 Apply → `Full CLI apply flow` + `Batch evaluate` + `Playwright setup`** — 8-step numbered apply flow (`/career-ops apply <company>` → Playwright opens browser → numbered draft answers → human reviews and clicks Submit → `Submitted.` flips tracker `Evaluated → Applied`). Batch runner via `./batch/batch-runner.sh` with `--parallel` / `--min-score` / `--retry-failed`. Playwright install via `npm install` + `npx playwright install chromium` + `claude mcp add playwright`.
- All 8 bundles preserve the 16-H2 parity contract (`tests/help-ui.test.mjs::section-parity` stays green).

### ✨ UI

- **`#/reports`** — new collapsible card at the top of the list view with the canonical score → next-step table (`≥ 4.5 → /career-ops apply`, `4.0–4.4 → apply or /career-ops contacto`, `3.5–3.9 → /career-ops deep`, `< 3.5 → skip`). Sources the link out to `career-ops.org/docs/.../scan-job-portals`. 7 new i18n keys (`rep.thresholdsTitle`, `rep.thrAction`, `rep.thr45`, `rep.thr40`, `rep.thr35`, `rep.thrLow`, `rep.thresholdsSource`) across 8 locales.

### 📋 QA

- **`qa/claude-cowork-browser-test-prompt.md`** — appended **Scenario 17 (career-ops.org/docs coverage)** with 5 sub-assertions (front-matter in 8 locales, CLI-flow subsections in §5/§7/§14, README block in 8 locales, `#/apply` Playwright link, `#/reports` score-thresholds card) + **Scenario 18 (help bundle parity)** for the i18n parity regression.

### Out of scope (deferred)

| Item | Why |
|---|---|
| **Batch evaluate SPA page** | Canonical docs describe CLI-only flow; SPA equivalent = new view + ≥3 endpoints + fixtures. Multi-day phase. |
| **F-018 full adapter-registry** | Still queued; label-only slice closed in v1.10.3. |
| **Full multer pipeline** | v1.10.2 closed data-corruption hole via 415 envelope; full parser is its own phase. |

### Test posture

- **348 / 349** unit tests (1 pre-existing parent-data drift).
- Coverage: **94.59 % line / 84.18 % branch**.
- 20 / 20 smoke E2E · 23 / 23 comprehensive E2E · **28 / 28 Playwright**.

### Docs

- `docs/reviews/REVIEW-2026-05-13-v1.11.1.md` — session context + audit.
- All 8 READMEs: release v1.11.0 → v1.11.1.
- All 8 CHANGELOGs receive this entry.

---

## [1.11.0] — 2026-05-13

career-ops.org docs integration — minor release because every change is additive (no API breakage, no data-shape changes, no SPA route renames). Closes the v1.10.3 PR-9 deferral.

### 📝 Docs

- **`docs/career-ops-canonical.md` (new)** — single canonical reference distilled from [career-ops.org/docs](https://career-ops.org/docs) and its 5 sub-guides (What is career-ops, Scan job portals, Apply for a job, Batch-evaluate offers, Set up Playwright). All locale help bundles + READMEs translate this file; when career-ops.org/docs changes, regenerate this file first.
- **All 8 help bundles** (`docs/help/{en, ru, es, pt-BR, ko-KR, ja, zh-CN, zh-TW}.md`) gained a new front-matter `About career-ops` section just below the H1 intro: principles, key concepts (Mode / Archetype / Pipeline / Tracker / Report / Scan history), career-ops vs career-ops-ui distinction, action thresholds by score (≥ 4.5 / 4.0–4.4 / 3.5–3.9 / < 3.5), and links to all five canonical guides. H2 count preserved at 16 per locale (`tests/help-ui.test.mjs` parity stays green).
- **All 8 READMEs** gained an `About career-ops` block before the install heading: same principles, score thresholds, and 5 canonical guide links. The `What's new in v1.10.x` history sections were removed from the README front page (CHANGELOG retains the full history).

### ✨ UI improvements

- **`#/apply`** — the info banner now explicitly surfaces the Playwright setup guide (`career-ops.org/docs/.../set-up-playwright`) and a link to the canonical Apply guide. New i18n keys `apply.playwrightHint` + `apply.docsLink` localized for 8 locales.

### 🔧 Internal

- README screenshot path stays at `public/images/screen_vacancy_found.png` (v1.10.1).
- No new server routes, no schema changes, no new tests required (existing i18n + help parity tests cover the new content surface).
- `tests/help-ui.test.mjs` `section-parity` test continues to pass — every locale has the same 16 H2 headings.

### Audit (gaps deferred, NOT in this release)

| Gap | Why deferred |
|---|---|
| **Batch evaluate SPA page** (`./batch/batch-runner.sh` flow) | The canonical docs describe a CLI-only batch loop (`batch/batch-input.tsv` → parallel runner → `batch/tracker-additions/`). A SPA equivalent needs a new view, three new endpoints, fixture data, and tests. Multi-day phase; documented in `docs/career-ops-canonical.md §4`. |
| **Adapter-registry consolidation** (F-018 / full PR-1) | Still queued; `/api/stream/scan-en` + `/api/stream/scan-ru` remain. The label-only slice landed in v1.10.3. |
| **Multer pipeline** (full PR-4) | v1.10.2 closed the data-corruption hole via a 415 envelope; the full multipart parser + ConversionError envelope refactor is its own phase. |

### Test posture

- **348 / 349** unit tests pass (1 pre-existing parent-data drift in `portals-dead.test.mjs`).
- Coverage: **94.59 % line / 84.24 % branch**.
- 20 / 20 smoke E2E · 23 / 23 comprehensive E2E · **28 / 28 Playwright**.

### Docs

- `docs/reviews/REVIEW-2026-05-13-v1.11.0.md` — session context + UI audit gap list.
- All 8 READMEs: badge bumps (tests 349 → 348 — one test moved as audit cleanup, no functional change), release v1.10.3 → v1.11.0.
- All 8 CHANGELOGs receive this entry.

---

## [1.10.3] — 2026-05-12

Closes 7 of the 11 v1.10.0 QA findings (F-001, F-010 minimal, F-011 minimal, F-013, F-014, F-015, F-019). The remaining 4 (F-018 — full adapter-registry consolidation; PR-4 full multer pipeline; PR-7 follow-ups; PR-9 doc sweep across career-ops.org docs) are deferred to v1.11.0.

### ✨ Features

- **`feat(pdf): Generate-PDF on every long-form surface (F-015)`** — three new SSE endpoints (`GET /api/stream/pdf/report?slug=`, `GET /api/stream/pdf/deep?name=`, `POST /api/stream/pdf/inline { markdown }`) plus a shared `public/js/lib/pdf-generate.js` helper. The **📄 Generate PDF** button now appears on `#/reports/:slug`, `#/deep` (manual + live), `#/evaluate` (manual + live), and `#/interview-prep` (via the deep endpoint). Each kind reuses the v1.10.2 cv-markdown-to-print-HTML helper and lands the result under `output/<slug>-<TS>.pdf` so the existing auto-download flow takes over.
- **`feat(config): regional config group (F-013)`** — `/api/config` now exposes `groups` (`core | runtime | regional`) and `regionalActive` (boolean computed from `portals.yml::russian_portals.sources`). The SPA renders the three groups as collapsible sections; **Regional sources** is auto-collapsed and only present when a regional source is configured.

### 🐛 Bug fixes

- **`fix(server): global Express error handler (F-019)`** — `PayloadTooLargeError` (e.g. an 11 MB upload to `/api/cv/import`) and `SyntaxError` from `express.json` now return JSON envelopes the SPA can localize (HTTP 413 / 400). Previously the default Express handler returned an HTML stack trace, which broke the SPA's `try { await res.json() }`.
- **`fix(i18n): English tokens no longer leak into non-EN UI (F-001)`** — added localizations for `Pipeline`, `Deep research`, `Follow-up`, `Health`, `Outreach`, `Doctor`, `Quick scan` (the labels users saw in their UI language while the rest of the chrome was translated).
- **`fix(scan): drop EN/RU framing from labels (F-010 minimum)`** — the `#/scan` summary line, two scan-done badges, and the source-filter labels now read "ATS adapters" + "Regional portals". The two SSE endpoints (`/api/stream/scan-en`, `/api/stream/scan-ru`) are retained as-is; full registry consolidation lives in PR-1 / v1.11.0.
- **`fix(scan): Active-Companies counter auto-refreshes (F-011 minimum)`** — view dispatches a `scan:refresh` event after each `refreshResults()`; the counter re-derives "companies with hits in last scan" from the actual `/api/scan-results` payload instead of staying frozen at the view-mount snapshot.
- **`docs(en-ru-framing): sweep across READMEs + help bundles (F-014)`** — `EN sweep` → `ATS sweep`, `RU sweep` → `regional sweep`, `EN scanner` → `ATS scanner`, `EN: Greenhouse / Ashby / Lever, RU: hh.ru + Habr Career` → `ATS adapters (Greenhouse / Ashby / Lever) + regional portals (hh.ru / Habr Career)`. Touches `README.md`, `README.ru.md`, `README.ja.md`, `README.ko-KR.md`, `docs/help/en.md`, `docs/help/es.md`, `docs/help/pt-BR.md`.

### 🧪 Tests

- New `tests/global-error-handler.test.mjs` (2 cases): malformed JSON → 400 JSON; 11 MB upload → 413 JSON.
- New `tests/config-groups.test.mjs` (2 cases): `/api/config` exposes `groups`; `regionalActive` flips on when portals.yml gains a regional source.
- New `tests/pdf-extra-routes.test.mjs` (5 cases): each of `/report`, `/deep`, `/inline` invokes `generate-pdf.mjs` with the documented three positional args; 404 on missing slug; 400 on empty inline markdown.
- Total: **349 / 350** unit tests (1 pre-existing parent-data drift in `portals-dead.test.mjs`).
- Coverage: 94.59 % line / 84.16 % branch.
- 20 / 20 smoke E2E, 23 / 23 comprehensive E2E, **28 / 28 Playwright**.

### 📝 Docs

- `docs/reviews/REVIEW-2026-05-12-v1.10.3.md` — session context + scope-out list.
- All 8 READMEs: badge bumps (tests 340 → 349, release v1.10.2 → v1.10.3), "What's new in v1.10.3" section per locale.
- All 8 CHANGELOGs receive this entry.

### Out of scope (deferred to v1.11.0)

- **PR-1** — full locale-agnostic adapter registry (8 ATS-adapter files + new `/api/stream/scan?source=` consolidating the two existing endpoints + +14 new portals + scan-view rewrite). The label-only slice in this release closes F-010 / F-011 visually; the architectural refactor is a multi-day phase.
- **PR-4** — multer-based CV import pipeline (replaces the v1.10.2 415 envelope with a real multipart parser + ConversionError envelope + dependency review).
- **PR-9** — full career-ops.org docs integration: fetch [career-ops.org/docs](https://career-ops.org/docs) + the 4 sub-guides (scan-job-portals, apply-for-a-job, batch-evaluate-offers, set-up-playwright), translate into 7 non-EN locales, rewrite help bundles + READMEs accordingly, audit UI screens against the documented behavior.

---

## [1.10.2] — 2026-05-12

Functional-regression patch. Two bugs discovered in v1.10.1 hand-testing closed; documentation surface expanded.

### 🐛 Bug fixes

- **`fix(cv): /api/cv/import rejects multipart/form-data with 415 (F-016 hardening)`** — any external client (curl `-F`, common HTTP clients) defaulting to `multipart/form-data` previously had its wire envelope (`--boundary…\r\nContent-Disposition: form-data; name="file"; filename="x"…`) stored as `cv.md` content. The SPA's actual path (`Content-Type: application/octet-stream` + `X-Filename`) was unaffected. Route now returns 415 with a hint pointing at the documented contract. Defense-in-depth: octet-stream bodies that sniff as multipart in their first 256 bytes also get 415. `cv.md` is never touched on a 415.
- **`fix(pdf): /api/stream/pdf invokes generate-pdf.mjs with proper positional args`** — was calling the script with `[]`. The script printed its `Usage:` line and exited code 1 — SPA showed the green "PDF generated" toast but no file ever reached disk. The route now reads `cv.md`, renders it to an HTML file under `output/cv-input-<TIMESTAMP>.html` via an in-route markdown-to-print-HTML helper, then spawns `generate-pdf.mjs <input.html> <output.pdf> --format=a4`. Optional `?format=letter` query for US-letter output. When `cv.md` is missing, emits an `error` event + `done { code: 2 }` instead of a fake start frame.

### 🧪 Tests

- New `tests/cv-upload-multipart-reject.test.mjs` (5 cases): SPA happy path returns 200 with clean markdown; `multipart/form-data` → 415; octet-stream body that LOOKS like multipart → 415; empty body → 400; rejected request does NOT modify `cv.md`.
- New `tests/pdf-stream-args.test.mjs` (3 cases): `start` event carries `<input.html> <output.pdf> --format=a4` with absolute paths and the HTML exists on disk; `?format=letter` switches the flag; missing `cv.md` emits the expected error frame.
- Total: **340 unit tests** (was 318). One pre-existing failure in `portals-dead.test.mjs` remains parent-side data drift, unrelated to web-ui.
- Coverage: 94.63 % line / 84.94 % branch.

### 📝 Docs

- New `docs/test-scenarios/` — 21 scenario files in English (index + per-page contracts):
  - 01 smoke / health · 02 CV upload · 03 CV edit-save · 04 CV → PDF download
  - 05 profile YAML · 06 config env · 07 scan · 08 pipeline
  - 09 evaluate · 10 deep research · 11 modes · 12 apply checklist
  - 13 tracker · 14 reports · 15 activity log · 16 interview prep · 17 JDs
  - 18 i18n · 19 help center · 20 security · 21 full funnel
- Each file documents: goal, preconditions, inputs, expected outputs, negative cases, test coverage (file + line range), and manual Playwright steps where applicable.
- New `docs/reviews/REVIEW-2026-05-12-v1.10.2.md` — full session context, scope-out list, verification commands.
- All 8 READMEs: badge bumps (tests 318 → 340, release v1.10.1 → v1.10.2) + "What's new in v1.10.2" section per locale.
- All 8 CHANGELOGs receive this entry.

### Out of scope (deferred to future GSD phases)

PR-1 locale-agnostic adapter registry (still queued), PR-4 multer-based CV import with full conversion pipeline, PR-7 Generate-PDF buttons on reports / evaluate / deep / interview-prep, PR-8 config UI regrouping, PR-9 docs sweep, PR-10 button-by-button localization audit + jsdom CI gate, full Korean retranslation.

---

## [1.10.1] — 2026-05-09

Critical-fixes patch driven by the v1.10.0 QA regression run (`qa/reports/00-FINAL-SUMMARY.md`).

### 🛡️ Security

- **`fix(security): tighten isValidJobUrl + add DNS-rebind defense (PR-3 / F-003)`** — `isValidJobUrl` now rejects RFC1918 (`10/8`, `172.16/12`, `192.168/16`), the full 127/8 loopback range, link-local `169.254/16` (incl. AWS IMDS), `0.0.0.0`, CGNAT `100.64/10`, and IPv6 ULA / link-local. New helper `isPrivateOrLoopbackHost()` is exported from `server/lib/security.mjs` and reused by `/api/pipeline/preview`, which now `dns.lookup`s the host on every redirect hop and rejects when the resolved address itself is private — defeats DNS-rebind. DNS-failure fails open (fetch reports the error) so test stubs / DNS-less sandboxes still work.

### 🐛 Bug fixes

- **`fix(activity): record only successful state changes (PR-5 / F-005)`** — middleware now early-returns on `res.statusCode >= 400`. Rejected pipeline / cv / tracker requests no longer pollute the audit feed.
- **`fix(activity): add profile.save / config.save / cv.import event mappings (F-008)`** — successful `PUT /api/profile` and `POST /api/config` calls now appear in `/api/activity`.
- **`fix(help): alias ko → ko-KR.md so Korean Help body is served (F-002)`** — the SPA sends bare BCP-47 codes (`ko`); the file on disk is `ko-KR.md`. Resolver now walks 4 candidates: exact, region-tag alias, language-only base, then `en.md`.
- **`fix(llm): /api/evaluate honors mode:'manual' (F-009)`** — mirrors `/api/deep`. Manual-mode skips Anthropic / Gemini calls even when a key is set so users can copy the prompt into Claude Code without burning credits.
- **`fix(api): DELETE /api/pipeline accepts ?url= AND body.url, returns 404 on miss (PR-6 / F-017)`** — was silently 200-on-miss with `?url=` only.

### ✨ Features

- **`feat(llm): locale propagation through every prompt (PR-2 / F-012)`** — new `resolveLocale(req)` picks a locale from `body.lang` → `body.locale` → `Accept-Language` → `'en'`. New `buildLocaleDirective(lang)` emits a one-line "Respond in X" header. `buildEvaluationPrompt`, `buildDeepPrompt`, `buildModePrompt` now accept and embed `lang`. SPA `API.call()` auto-attaches `Accept-Language` and merges `lang` into JSON bodies.
- **`feat(scripts): post-qa-cleanup.mjs (PR-11)`** — replays the QA-regression cleanup checklist; `--apply` writes, default is dry-run, idempotent. Sweeps RFC1918 / `nip.io` / `test-cloud-*` URLs from `data/pipeline.md` and audits `cv.md` size.

### 🧪 Tests

- New `tests/critical-fixes.test.mjs` (15 cases) covering: F-002 ko alias resolution, F-009 manual-mode opt-out, PR-6 DELETE shape (body / 404 / 400), PR-3 helper unit tests for IPv4 + IPv6 + bracketed forms, PR-2 `resolveLocale` precedence + `buildLocaleDirective` + prompt-builder integration.
- `tests/url-validation.test.mjs` extended with 5 new tests for RFC1918 / link-local / 0.0.0.0 / 127/8 / CGNAT / IPv6 ULA / link-local.
- `tests/activity-log.test.mjs` test 8 updated to assert the new "no log on 4xx" contract.
- Total: **318 unit tests** (was 298; one pre-existing failure in `portals-dead.test.mjs` is parent-side data drift in `templates/portals.example.yml`, unrelated to web-ui code).

### 📝 Docs

- New `docs/reviews/REVIEW-2026-05-09-v1.10.1.md` — full session context + scope-out list + verification commands.
- All 8 READMEs: badge bumps (test count 298 → 318, release v1.10.0 → v1.10.1), screenshot path moved to `public/images/screen_vacancy_found.png`, "What's new in v1.10.1" section added per locale (English, Spanish, Portuguese, Korean, Japanese, Russian, Simplified Chinese, Traditional Chinese).
- All 8 CHANGELOGs updated with this entry.

### Out of scope (deferred to future GSD phases)

PR-1 (locale-agnostic adapter registry, +14 portals, FE rewrite), PR-4 (multer-based CV import + ConversionError + global error handler), PR-7 (Generate-PDF buttons on reports / evaluate / deep / interview-prep), PR-8 (config UI regrouping), PR-9 (full README/docs/8-help-bundle EN-RU framing sweep), PR-10 (button-by-button localization audit + jsdom CI gate), full Korean help retranslation (the file exists; PR-only fixed runtime delivery).

---

## [1.10.0] — 2026-05-08

CV import revamp + `#/config` tabs + canonical `#/profile` route.

### ✨ Features

- **`feat(cv): server-side import for .docx / .doc / .odt / .rtf / .pdf / .html / .txt / .md`** — new `POST /api/cv/import` endpoint converts an uploaded document (any common format) into markdown the editor can drop in. Office formats go via **pandoc**, PDF via **pdftotext** from Poppler. Result is sanitized through `stripDangerousMarkdown` (defense-in-depth XSS). Hard cap: 10 MB per upload. Frontend `📁 Upload CV` now accepts the full format set; pretty error toasts when a converter is missing on the host.
- **`feat(cv): auto-download generated PDF when generate-pdf.mjs finishes`** — the streaming Generate-PDF flow now snapshots the latest PDF in the output dir, and on `done` triggers a browser download for the *new* file (no-op if the run produced no new artifact). The existing on-page list still shows every previous PDF.
- **`feat(config): two-tab layout — API keys & runtime + Profile`** — `#/config` now has a tab strip. The first tab keeps the existing `.env` editor (API keys, models, scanner knobs). The new **Profile** tab is a direct YAML editor for `config/profile.yml`: `PUT /api/profile` validates the YAML (must be a mapping, must include `candidate`), stamps a canonical `# Career-Ops Profile Configuration` header if missing, and writes the file. Save propagates without restart.
- **`feat(routes): canonical /#/profile route (was /#/settings)`** — sidebar now points at `#/profile`. The old `#/settings` hash still resolves through the router alias table, so existing bookmarks keep working. Internal route handler renamed; tests updated to reflect the new direction.

### 🧪 Tests

- New `tests/cv-import.test.mjs` (7 cases): `.md` / `.txt` passthrough, empty-body 400, unsupported-extension 422, oversized 413, HTML→markdown sanitization (skips when pandoc absent), PDF→text round-trip with a hand-crafted PDF (skips when poppler absent).
- New `tests/profile-put.test.mjs` (7 cases): happy-path round-trip, header stamping, empty / invalid-YAML / non-object / missing-candidate 400s, oversized 413.
- `tests/playwright-full-cycle.mjs` extended 14 → **16** subtests — adds CV-import via HTML and `PUT /api/profile` round-trip.
- `tests/router.test.mjs` ALIAS regex flipped to assert the new `settings → profile` direction.

### 📚 Docs

- `docs/help/{en,ru}.md` — full updates to sections 2/3/4: new App-settings tabs, edit-via-config message on the read-only Profile page, full upload-format matrix on the CV section, PDF auto-download behaviour.
- `docs/help/{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md` — concise mirrors of the new content blocks; section count unchanged (16) so the parity test stays green.

### 🔧 Internal

- New `server/lib/cv-import.mjs` — single source of truth for the format → markdown conversion, with timeout + missing-converter detection that surfaces actionable hints rather than 500s.
- `server/lib/routes/content.mjs` gains `POST /api/cv/import` and `PUT /api/profile` (binary-safe via `express.raw` for the upload, JSON for the YAML PUT).

---

## [1.9.1] — 2026-05-08

Production-readiness pass. Four targeted bug fixes (BF-1..BF-4), Playwright smoke expanded from 5 to 12 tests covering tracker / pipeline / reports / evaluate / config / cv save round-trips. All green in CI.

### 🐛 Bug fixes

- **`fix(tracker): escape pipes + collapse newlines in every cell, not just notes (BF-1)`** — a company name like `"Acme | Co"` previously broke the markdown table layout (parser split the cell into two). Cell sanitizer now applied uniformly to company / role / reportSlug / notes; companion fix in `parsers.mjs::parseMarkdownTable` adds GFM-compliant `\|` escape support so the round-trip is lossless.
- **`fix(config): wrap updateEnvFile in try/catch (BF-2)`** — `POST /api/config` previously bubbled an unhandled rejection on permission-denied / read-only filesystem. Now returns a clean 500 `{ error: 'failed to write parent .env', details: [...] }`.
- **`fix(llm): soft cap on assembled prompt size for Anthropic SDK calls (BF-3 + BF-4)`** — `/api/evaluate`, `/api/deep`, and `/api/mode/:slug` Anthropic branches now bail with 413 when `bundleProjectContext + prompt` exceeds 200 KB (≈50K tokens). Saves a multi-second roundtrip + tokens vs letting the API complain about context size. The cap is well below any current model ceiling (Sonnet 4.6 = 1M context).

### 🧪 Playwright smoke — expanded coverage

5 → **12** tests. New cases:

- `tracker view renders empty + accepts API-seeded row` — exercises BF-1 by seeding a row with a literal pipe in the company name and asserting the round-trip preserves it.
- `pipeline add-URL form populates the queue` + invalid-URL rejection sweep (loopback, `javascript:`, bare strings).
- `reports view handles empty state` — non-crash assertion.
- `evaluate view returns a manual prompt without API key` — verifies the fallback chain.
- `config GET returns known keys masked` — secrets never leak through `/api/config`.
- `cv.md PUT round-trips with sanitization` — XSS-y bits (script tags, `javascript:` schemes) get stripped end-to-end.
- `pipeline preview proxy strips scripts` — invalid-URL rejection path.

### 📦 Behavior changes (no API contract changes)

- Tracker writes are now lossless against pipe-laden company / role names. Existing rows with raw pipes will start parsing correctly on the next read.
- `/api/{evaluate,deep,mode/:slug}` will now return 413 instead of 502/timeout when the prompt is unreasonably large (200 KB+).

### 🧪 Tests

- **284 unit tests** (no change in count; existing tests still all green after parser update).
- **12 Playwright browser-smoke tests** (was 5).

---

## [1.9.0] — 2026-05-08

P-6 → P-10 from the v1.8.0 backlog all shipped in one bundle. Headline: `server/index.mjs` is now a 130-LOC orchestrator (down from 762, total 1230 → 130 = -89%); every route topic has its own module. Anthropic parity for `/api/evaluate`, multi-CLI shims, expanded i18n parity test, and Playwright browser-smoke wired into CI.

### 🏗️ P-6 — server split-by-concern (phase 2)

Continuation of P-2. Extracted the remaining 9 route topics out of `server/index.mjs` into `server/lib/routes/<topic>.mjs` modules. `index.mjs` is now a pure orchestrator: middleware (security headers + activity log + static), 12 `register<Topic>Routes(app)` calls, and the SPA catch-all.

- `server/lib/routes/activity.mjs` — `/api/activity`.
- `server/lib/routes/config.mjs` — `/api/config` GET/POST (parent .env round-trip).
- `server/lib/routes/health.mjs` — `/api/health` + `/api/dashboard`.
- `server/lib/routes/help.mjs` — `/api/help/:lang`.
- `server/lib/routes/jds.mjs` — full CRUD for `jds/*.txt`.
- `server/lib/routes/llm.mjs` — every LLM-bound endpoint (evaluate, deep, mode, apply-helper, interview-prep).
- `server/lib/routes/pipeline.mjs` — `/api/pipeline*` including the SSRF-safe preview proxy with named constants for timeout / max-redirects / max-body.
- `server/lib/routes/reports.mjs` — `/api/reports*`.
- `server/lib/routes/tracker.mjs` — `/api/tracker` GET + dedup-aware POST.

Behavior unchanged. 283/283 unit tests stayed green at every step. The orchestrator's import surface dropped from 47 lines to 22.

### 🔌 P-7 — Anthropic parity for `/api/evaluate`

`/api/evaluate` previously was Gemini-or-manual. v1.9.0 adds an Anthropic branch (preferred when both keys present), mirroring the routing rule already used by `/api/deep` and `/api/mode/:slug`. Routes through `bundleProjectContext({ modeSlugs: ['_shared', 'oferta'] })` so the model has the cv / profile / mode templates inlined (REVIEW-A1).

New endpoint: **`POST /api/evaluate/test-anthropic`** — smoke check for `ANTHROPIC_API_KEY`, mirrors the existing Gemini smoke. Sends a tiny prompt (≤256 output tokens) so it costs essentially nothing; returns a 200-char sample.

Fallback chain is now: Anthropic → Gemini → manual.

### 🌐 P-8 — Help-center i18n parity (audit + test hardening)

Audited every `docs/help/<lang>.md` for structure parity. All 8 locales already cover the same 14 canonical h2 sections. Tests upgraded:

- `tests/help-ui.test.mjs::every help doc covers the same 14 sections` was checking only en + ru. Now iterates **all 8 locales** (en, es, pt-BR, ko-KR, ja, ru, zh-CN, zh-TW) and asserts the section count for each.
- New test: `tests/help-ui.test.mjs::every help locale has substantive content` — guards against locale stubs by asserting each non-EN locale is at least 30% of `en.md`'s byte length. Compact translations naturally hit 40-50%; a stub would be in single-digit %.

Result: structural parity is now CI-enforced.

### 🤖 P-9 — Playwright browser smoke in CI matrix

`tests/playwright-smoke.mjs` (added in v1.8.0 as opt-in) is now part of the CI workflow. The existing `e2e` job already installs Playwright + Chromium; one new step (`npm run test:e2e:browser`) runs the 5 browser-smoke tests right after the comprehensive node E2E.

Order in CI: unit (Node 18/20/22 matrix) → smoke node E2E → comprehensive node E2E → **Playwright browser smoke** → screenshot artifact upload on failure.

### 🌍 P-10 — Multi-CLI compatibility

Parent career-ops v1.7.0 introduced multi-CLI / Open Agent Skill standard support. The UI sub-project follows the same convention with thin shims pointing at the canonical `CLAUDE.md`:

- `web-ui/AGENTS.md` — Codex / Aider / generic CLI entry point.
- `web-ui/GEMINI.md` — Gemini CLI entry point.

Both shims re-state the hard rules and quick reference but defer to `CLAUDE.md` for the full project-level instructions, so non-Claude CLIs land on the same orientation as Claude Code sessions. The deployed UI itself remains CLI-agnostic at runtime.

### 🧪 Tests

- **284 unit tests** (was 283): +1 new help-locale parity test.
- **5 Playwright browser-smoke tests** — now part of CI, not just opt-in.
- Coverage held.

### 🔧 Files touched

```
+ server/lib/routes/activity.mjs              + server/lib/routes/config.mjs
+ server/lib/routes/health.mjs                + server/lib/routes/help.mjs
+ server/lib/routes/jds.mjs                   + server/lib/routes/llm.mjs
+ server/lib/routes/pipeline.mjs              + server/lib/routes/reports.mjs
+ server/lib/routes/tracker.mjs
+ AGENTS.md                                   + GEMINI.md

~ server/index.mjs (762 → 130 LOC, -83%)
~ .github/workflows/ci.yml (Playwright smoke step)
~ tests/help-ui.test.mjs (all-8-locales section parity + content-floor)
~ docs/{ROADMAP,architecture/{OVERVIEW,SERVER}}.md
~ docs/sdd/CONVENTIONS.md
~ CLAUDE.md
~ package.json (1.8.0 → 1.9.0)
```

### 📦 New REST endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/evaluate/test-anthropic` | Smoke check for `ANTHROPIC_API_KEY` (P-7). Mirrors `/api/evaluate/test-gemini`. |

### 🤖 New CLI entry points

| File | CLI | Notes |
|---|---|---|
| `AGENTS.md` | Codex / Aider / generic | Points at `CLAUDE.md` for the full instructions. |
| `GEMINI.md` | Gemini CLI | Auto-loaded by Gemini at session start. |

---

## [1.8.0] — 2026-05-08

Hardening, refactor, and SDD bootstrap. Three high-severity correctness/security fixes (A1, A2, A3), four medium ones (B1–B4), six cleanups, audit of the parent career-ops v1.7.0 surface, server split-by-concern (P-2 phase 1), Playwright browser smoke harness, and a full SDD foundation under `docs/` and `.claude/`.

### 🔥 High-severity fixes

- **`fix(deep): inline cv/profile/mode files for Anthropic SDK calls (REVIEW-A1)`** — `/api/deep` and `/api/mode/:slug` previously told the model "read these files first" but the Anthropic SDK has no filesystem. Output was hollow. New `bundleProjectContext({ modeSlugs })` reads `cv.md`, `config/profile.yml`, `modes/_shared.md`, and the mode template, truncates each at 16 KB, and prepends a `<project_context>` block to the prompt. Verified live: 26 KB grounded markdown response from `claude-sonnet-4-6` for a deep-research call.
- **`fix(runner): SIGKILL escalation after SIGTERM grace period (REVIEW-A2)`** — `runNodeScript` and `streamNodeScript` previously sent only `SIGTERM` on timeout / client-disconnect. A child stuck in a syscall (DNS, blocked socket) ignored it, hanging the SSE connection until Node's GC reaped. Now each path arms a 5 s watchdog that escalates to `SIGKILL`. Promises always resolve.
- **`fix(runner): max-runtime cap on streaming endpoints (REVIEW-A3)`** — every SSE script runner (`/api/stream/{scan,liveness,pdf}`) now has a hard 30-minute ceiling. On expiry: emit `event: error { message: 'maximum runtime exceeded' }`, kill the child via the A2 watchdog, end the response.

### 🛡️ Medium-severity fixes

- **`fix(preview): per-hop redirect validation in /api/pipeline/preview (REVIEW-B1)`** — switched from `redirect: 'follow'` to manual redirect-walking. Each `Location` header is re-validated by `isValidJobUrl`; capped at 3 hops. Hostile boards can no longer bounce us to loopback / private IPs / `file://`. 4 new tests cover the rejection paths.
- **`refactor(keys): hasGeminiKey helper unifies LLM-key checks (REVIEW-B2)`** — direct `process.env.GEMINI_API_KEY` reads in route handlers replaced with `hasGeminiKey()` from `lib/anthropic.mjs`. Mirrors `hasAnthropicKey()` shape for consistency and easier mocking.
- **`feat(scanners): thread AbortSignal through hh.ru, Habr, Greenhouse, Ashby, Lever (REVIEW-B3)`** — when the SSE client disconnects mid-scan, in-flight HTTP fetches are now aborted instead of running every query to completion and dropping events. `runRuScan` and `runEnScan` accept `opts.signal`; SSE handlers in `/api/stream/scan-{ru,en}` create an `AbortController` and abort on `res.close`.
- **`test(anthropic): log-guard test prevents future API-key leaks via console (REVIEW-B4)`** — captures every `console.{log,info,warn,error,debug}` call during `runAnthropic` happy + error paths, asserts zero output and that the canary key string never appears. Defense-in-depth against a future `console.log(opts)` regression.

### 🧹 Low-severity polish

- **`fix(parsers): defense-in-depth URL gate inside addPipelineUrl (REVIEW-C4)`** — parser-level rejection of non-http(s) values, complementing the route-level `isValidJobUrl`. Optional `opts.validate` for callers that want stricter rules.
- **`docs(readme): badge "tests-88 passed" → "tests-277 passed" (REVIEW-C3)`** — was off by an order of magnitude.
- **`test(i18n): missing-keys diff grouped by locale (REVIEW-C6)`** — when `tests/i18n-coverage.test.mjs` finds a gap, output is now `[ru] (3): foo, bar, baz` instead of mixed lines.
- **`docs(review): C1 closed as resolved-on-inspection`** — sanitizer regexes were already in `\x00-\x08` hex form; review entry was a tool-rendering artifact.

### 🏗️ P-2 phase 1 — server split-by-concern

`server/index.mjs` was 1230 LOC, well past the 800-line ceiling. Split into focused modules without behavior change. All 283 unit tests stayed green at every step.

- `server/lib/security.mjs` — `isValidJobUrl`, `stripDangerousMarkdown`, `sanitizeJobDescription`, `isPubliclyExposed`. Re-exported from `index.mjs` for backward-compat with external consumers.
- `server/lib/prompts.mjs` — `bundleProjectContext`, `buildEvaluationPrompt`, `buildDeepPrompt`, `buildModePrompt`, `buildApplyChecklist`.
- `server/lib/store.mjs` — `safeReadApps`, `safeReadPipeline`, `safeListReports`, `checkProfileCustomized`, `ensureRussianPortalsDefaults`.
- `server/lib/routes/scan.mjs` — `registerScanRoutes(app)` for `/api/stream/scan-{ru,en}`, `/api/scan-ru/config`, `/api/scan-results`.
- `server/lib/routes/runners.mjs` — `registerRunnerRoutes(app)` for buffered `/api/run/*` table, streaming `/api/stream/{scan,liveness,pdf}`, generated-PDF list/download.
- `server/lib/routes/content.mjs` — `registerContentRoutes(app)` for CV / Profile / Portals / Modes.

`index.mjs` is now 762 LOC (-38%, under the 800 cap). Phase 2 will extract tracker, pipeline, reports, jds, llm (evaluate/deep/mode), and health into route modules. Targeting <500 LOC for the orchestrator.

### 🔍 Parent career-ops v1.7.0 audit

The user updated the parent project to v1.7.0. Audited every consumed surface — UI is fully compatible. Notable findings documented in `docs/architecture/DATA-FLOWS.md`:

- Modes catalog grew from 7 to 19 files. UI's `MODE_ALLOWLIST` deliberately surfaces only 7 (others are Claude-Code-only). Comment added explaining the intentional narrow scope.
- `portals.yml` schema confirmed: `tracked_companies` (96 entries, 87 enabled, 71 with API). EN scanner reads it correctly; legacy `companies` key still supported.
- New parent surfaces NOT consumed today: `dashboard/` (Go program), `update-system.mjs`, `generate-latex.mjs`, `analyze-patterns.mjs`, `liveness-core.mjs`, `followup-cadence.mjs`, `test-all.mjs`, localized mode subdirs (`de/fr/ja/pt/ru`).
- Live `/api/dashboard`, `/api/health`, `/api/modes`, `/api/portals`, `/api/profile`, `/api/cv`, `/api/jds`, `/api/reports`, `/api/tracker`, `/api/pipeline`, `/api/evaluate`, `/api/deep`, `/api/stream/scan-en` all verified green.

### 🤖 SDD / GSD bootstrap

`career-ops-ui` now has a full Spec-Driven Development foundation aligned with the GSD pipeline (`gsd-*` skills from `superpowers@claude-plugins-official`).

- `CLAUDE.md` (root) — project-level agent system prompt: stack, GSD pipeline, hard rules (parent contract, security envelope, no `--no-verify`), conventions, parent-project boundary.
- `.aiignore` — exclusion list for AI agents: vendored, binaries, parent user data, `.planning/`, `.env`, locale duplicates.
- `.claude/agents/` — three project-specific subagent definitions:
  - `web-ui-route-reviewer.md` — gates new routes against SSRF, CSP, sanitizers, parent-write contract, conventions, tests.
  - `spa-view-reviewer.md` — CSP-safe DOM, i18n, router registration, accessibility.
  - `test-isolation-reviewer.md` — verifies tests are CI-isolated (no parent-project assumptions, no live network, no port collision).
- `.claude/commands/` — slash-command stubs: `/sdd-status`, `/codebase-tour`.
- `docs/` tree — all in English:
  - `PROJECT.md` — what/why/for-whom, scope, constraints, success criteria.
  - `ROADMAP.md` — current milestone + completed history + backlog.
  - `sdd/SDD-GUIDE.md` — discuss → spec → plan → execute → verify → review pipeline mapped to `gsd-*` skills.
  - `sdd/CONVENTIONS.md` — module system, naming, routes, sanitizers, client patterns, i18n, errors, logging, testing, commits, branches, CSS.
  - `architecture/OVERVIEW.md` — top-level diagram, layers, boot sequence, invariants, "where to look first when…" cheat sheet.
  - `architecture/SERVER.md` — per-file map for `server/lib/*.mjs` (updated for P-2 split).
  - `architecture/FRONTEND.md` — SPA structure, view inventory, globals, "how to add a view".
  - `architecture/API.md` — full inventory of every `/api/*` route.
  - `architecture/DATA-FLOWS.md` — every parent-project read/write, with the explicit-user-action contract.
  - `reviews/REVIEW-2026-05-07.md` — static review that produced this changelog's fixes.

### 🔒 Security & repo hygiene

- **`chore(.gitignore): comprehensive defense-in-depth patterns`** — covers env variants, IDE folders, GSD scratch (`.planning/`), per-user agent settings (`.claude/settings.local.json`, `.claude/cache/`, `.claude/state/`, `.claude/memory/`), Playwright artifacts (`playwright-report/`, `test-results/`, `.playwright/`, `trace.zip`), heap/CPU profiles, lockfiles for unshipped tooling, expanded macOS Finder noise, generic secret patterns (`secrets.json`, `credentials.json`, `*.pem`, `*.key`).

### 🧪 Tests

- **283 unit tests** (was 277): +6 new (4 for B1 redirect-rejection, 1 for `hasGeminiKey`, 1 for `runAnthropic` log-guard).
- **5 Playwright browser-smoke tests** (new, opt-in via `npm run test:e2e:browser`): dashboard render + version footer, dashboard → scan → pipeline → cv navigation, language-switch persistence, 404 view, health-page render. Resolves Playwright via parent's `node_modules` — no new dependency.
- Coverage held at ~93% line / ~83% branch.

### 📝 New / updated package.json scripts

| Script | Purpose |
|---|---|
| `npm run test:e2e:browser` | Run Playwright smoke harness against in-process server (5 tests). |

### 🔧 Files touched

```
+ CLAUDE.md                                    +  .aiignore
+ docs/PROJECT.md                              +  docs/ROADMAP.md
+ docs/sdd/SDD-GUIDE.md                        +  docs/sdd/CONVENTIONS.md
+ docs/architecture/OVERVIEW.md                +  docs/architecture/SERVER.md
+ docs/architecture/FRONTEND.md                +  docs/architecture/API.md
+ docs/architecture/DATA-FLOWS.md              +  docs/reviews/REVIEW-2026-05-07.md
+ .claude/agents/web-ui-route-reviewer.md      +  .claude/agents/spa-view-reviewer.md
+ .claude/agents/test-isolation-reviewer.md
+ .claude/commands/sdd-status.md               +  .claude/commands/codebase-tour.md
+ server/lib/security.mjs                      +  server/lib/prompts.mjs
+ server/lib/store.mjs
+ server/lib/routes/scan.mjs                   +  server/lib/routes/runners.mjs
+ server/lib/routes/content.mjs
+ tests/playwright-smoke.mjs

~ .gitignore                                   ~  README.md (badge fix)
~ package.json (1.7.2 → 1.8.0)
~ server/index.mjs (1230 → 762 LOC)
~ server/lib/runner.mjs (SIGKILL escalation, max-runtime cap)
~ server/lib/anthropic.mjs (hasGeminiKey)
~ server/lib/parsers.mjs (URL gate in addPipelineUrl)
~ server/lib/ru-scanner.mjs                    ~  server/lib/en-scanner.mjs
~ server/lib/sources/{hh,habr,greenhouse,ashby,lever}.mjs (signal threading)
~ tests/anthropic.test.mjs                     ~  tests/i18n-coverage.test.mjs
~ tests/pipeline-preview.test.mjs
```

---

## [1.7.2] — 2026-05-04

Help center, in-UI App settings, mobile sidebar, single Scan button, and a "Show result" shortcut on every prompt-builder.

### ✨ New features

- **`feat(help): in-app user guide` (`/#/help`)** — long-form Markdown documentation accessible from a new sidebar entry. Covers every page step-by-step: quick start, CV editor, Profile, Scan filters, Pipeline preview, Evaluate, Deep research, Apply, Tracker, Reports, all 7 modes, Activity log, Health, setup hints. Auto-built sticky table of contents from `<h2>` headings, synchronous DOM build (no race). Localized for all 8 supported locales.
- **`feat(config): in-UI App settings page` (`/#/config`)** — edit `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `HH_USER_AGENT`, `PORT`, `HOST` from the browser. Writes to the **parent project's** `.env` file so career-ops Node scripts AND web-ui's dotenv loader pick up the same source. Secret keys masked on read (first/last 4 chars). Model fields are dropdowns with curated lists (claude-sonnet-4-6 / claude-opus-4-7 / claude-haiku-4-5 / gemini-2.0-flash / etc.). Empty value deletes the key. Values applied to running process.env immediately — no restart for most settings.
- **`feat(modes): "⚡ Show result" button alongside "Copy prompt"`** — when a prompt is generated in manual mode, users no longer have to retype their inputs to get the LLM result. The new button re-submits the same form with `run: true`, falling through to a clear toast (`Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env first`) when no key is configured. Works on `/#/deep`, `/#/project`, `/#/training`, `/#/followup`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns`.

### 🐛 UX + UI fixes

- **`fix(scan): single Scan button replaces three (Scan all + EN + RU)`** — overwhelming choice, identical default in 99% of cases. The unified `🌐 Scan` button runs every enabled source. Help docs updated across 8 locales.
- **`fix(ui): mobile sidebar drawer`** — viewport <900px now gets a hamburger button (☰) in the topbar; `body.sidebar-open` toggles a CSS transform that slides the sidebar in. Backdrop dim + click-anywhere closes it. Anchor click + hashchange auto-close so the user lands on the new page with the drawer tucked away. Larger viewports unaffected.
- **`fix(server): footer version reflects web-ui, not the parent VERSION`** — `/api/health` now reads web-ui's own `package.json`. The footer no longer leaks a stale `1.6.0` from the parent's version file. Parent's VERSION is still surfaced separately as `parentVersion`.

### 📦 New REST endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/api/help/:lang` | Returns the Markdown user guide for the requested locale, falling back to `en.md`. Path-traversal-safe. |
| `GET`  | `/api/config` | Returns current values for all known env keys; secrets masked. |
| `POST` | `/api/config` | Writes the given keys into the parent project's `.env`, validates each value, applies live to `process.env`. |

### 🌐 i18n

- 30+ new keys across `nav.help`, `nav.config`, `help.*`, `config.*`, `deep.showResult`, `deep.needKey`, `scan.btnRun`. All 8 locales populated.

### 🧪 Tests

- `tests/help.test.mjs` (12 cases) — every supported locale returns substantive markdown, EN spot-checks every page slug, unknown lang → EN fallback, path-traversal sanitized, every locale references `cv.md` / `profile.yml` / `.env`.
- `tests/help-ui.test.mjs` (9 cases) — view file registration, sidebar entry, i18n keys present in every locale, docs files exist for every locale, EN/RU help has 14 canonical sections, every #/foo route covered, Show-result wiring on deep + mode-page.
- `tests/env-config.test.mjs` (18 cases) — pure-function tests for `parseEnv`, `maskSecret`, `validateConfig`, `updateEnvFile` (bootstrap, in-place rewrite preserving comments, empty-value delete, quote-when-needed).
- `tests/config-endpoint.test.mjs` (8 cases) — GET masks secrets / returns env path; POST writes to parent .env; live process.env application; empty-value unsets; rejects unknown keys + malformed Anthropic keys with 400.

### 📊 Stats

- **Tests:** 233 → **277** (+44 across 4 new test files).
- **E2E:** 20 smoke + 23 comprehensive = 43 Playwright steps, all green.
- **Coverage:** 93.5% line / 82.6% branch / 93.7% funcs (unchanged — new code is fully tested).

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
