# QA-PROMPT — career-ops-ui vs career-ops.org/docs

> **Built:** 2026-05-14, against `web-ui@1.27.0`.
> **Source of truth (docs):** 5 canonical guides at https://career-ops.org/docs (Quick Start + 4 sub-guides).
> **Source of truth (app):** this repo's [`server/lib/routes/*.mjs`](../server/lib/routes/), [`public/js/views/*.js`](../public/js/views/), [`public/index.html`](../public/index.html), [`docs/help/<locale>.md`](../docs/help/).
> **Scope:** every feature, button, screen, command, file, threshold, error path the docs name — verified to exist in the SPA + tested ×8 locales.
> **Sister docs:** `qa/REGRESSION-v1.27.md` is the bottom-up regression spec. **This** file is the top-down docs-driven coverage spec. Run both.

---

## 0. Pre-flight

```bash
curl -fsS http://127.0.0.1:4317/api/health | jq '.version'   # → "1.27.0" (or newer)
curl -fsS http://127.0.0.1:4317/ | grep -c 'href="#/dashboard"'   # → 1   (v1.27.0 PR-D)
git -C $WEB_UI describe --tags --abbrev=0                     # → v1.27.0+

# all 8 locales must serve a 16-section help bundle
for lc in en es pt-BR ko ja ru zh-CN zh-TW; do
  printf "%-6s : %d H2\n" "$lc" "$(curl -fsS http://127.0.0.1:4317/api/help/$lc | jq -r .markdown | grep -c '^## ')"
done
# expected: every line ends in "16 H2"
```

If any of these fail, stop and fix before running the matrix.

---

## 1. Feature matrix — every doc claim mapped to its UI surface

**Legend:**

- **PASS** — doc-claim is surfaced in the SPA, tested, and i18n-covered. Run the listed verification.
- **GAP** — doc-claim exists but the SPA surface is missing, partial, or off-spec. **File a ticket.**
- **CLI-ONLY** — doc-claim is a parent-CLI command (no SPA equivalent by design). Verify only that the help-bundle mentions it correctly.
- **DRIFT** — doc-claim and SPA disagree; both currently exist (e.g. block letters A-G vs A-F). Note in report; do NOT auto-resolve.

Every row is verified on **all 8 locales** (en, es, pt-BR, ko-KR, ja, ru, zh-CN, zh-TW) unless marked `EN-only` (rare: dev-tools-only routes).

### 1.A — Quick Start (docs root: `/docs`)

| # | Doc claim (verbatim/paraphrase) | Status | SPA surface | API / file | Test gate | Locale check |
|---|---|---|---|---|---|---|
| 1 | Step 1 — `git clone`, `npm install`, `npx playwright install chromium` | **CLI-ONLY** | `#/health` shows `Playwright (parent node_modules)` check | — | `tests/canonical-docs-coverage.test.mjs` | help-bundle §14 names `npx playwright install chromium` × all 8 locales |
| 2 | Step 2 — `npm run doctor` flags missing deps | PASS | `#/health → ▶ Doctor` button | `POST /api/run/doctor` (runners.mjs:85) | `npm test -- tests/health.test.mjs` | `data-i18n="health.runDoctor"` × all 8 |
| 3 | Step 3 — `cp config/profile.example.yml config/profile.yml` + edit `full_name`, `email`, `location`, `target_roles.primary`, `compensation.target_range`, `narrative.headline` | PASS | `#/config → Profile tab` (full YAML editor) + read-only summary at `#/profile` | `GET/POST /api/profile`, `GET /api/portals` | `tests/profile-canonical-schema.test.mjs` | every field label `data-i18n` × all 8 |
| 4 | Step 4 — author `cv.md` (Summary / Experience / Skills / Education) | PASS | `#/cv` editor + 📁 Upload CV | `GET/PUT /api/cv`, `POST /api/cv/upload` | `tests/cv-roundtrip.test.mjs` | upload accepts .docx/.doc/.odt/.rtf/.pdf/.html/.txt/.md (pandoc + pdftotext on parent) × all 8 |
| 5 | Step 5 — `cp modes/_profile.template.md modes/_profile.md` + customize | PASS | `#/config → Modes tab` | `GET/PUT /api/modes/_profile` | — | tab label i18n × all 8 |
| 6 | Step 6 — open Claude / Codex / OpenCode / Qwen CLI | **DRIFT** | help-bundle §intro lists Claude Code / Codex / Cursor / Gemini CLI / GitHub Copilot CLI | — | — | **Action:** decide canonical list — is "OpenCode" + "Qwen CLI" canonical or are "Cursor / Gemini CLI / Copilot CLI" canonical? Today neither matches the other. **All 8 locales drift identically.** |
| 7 | Step 7 — `/career-ops auto-pipeline <url>` runs full pipeline ~1-2 min | PASS | `#/dashboard → ✨ Auto-pipeline a URL` button | `POST /api/auto-pipeline` (with `llmRateLimit` + `isValidJobUrl` + `safeGet`) | `tests/auto-pipeline-rejection-paths.test.mjs` + `auto-pipeline-manual-mode.test.mjs` | button label `data-i18n="dash.autoPipeline"` × all 8 |
| 8 | Anything below 4.0 = probably not a strong fit | PASS | `#/dashboard` + `#/tracker` highlight ≥ 4.0 | `GET /api/dashboard` | `tests/dashboard.test.mjs` | score-pill glyphs ✓ ◐ ○ × all 8 |
| 9 | Troubleshooting collapses (report fail / PDF fail / inaccurate scoring) | PASS | help-bundle §16 troubleshooting table | `GET /api/help/:lang` | `tests/help-ui.test.mjs::section-parity` | table renders in current locale × all 8 |

### 1.B — Scan job portals (`/docs/introduction/guides/scan-job-portals`)

| # | Doc claim | Status | SPA surface | API / file | Test gate | Locale check |
|---|---|---|---|---|---|---|
| 1 | `cp templates/portals.example.yml portals.yml` bootstrap | **CLI-ONLY** | help-bundle §5 names it; SPA reads `portals.yml` if present | — | `tests/canonical-docs-coverage.test.mjs` | help §5 × all 8 |
| 2 | `title_filter.positive` keywords (substring, case-insens) | PASS | `#/scan` chip filters surface matches | `GET /api/scan/regional/config` | `tests/scan.test.mjs` | filter chip labels × all 8 |
| 3 | `title_filter.negative` keywords | PASS | same | same | same | × all 8 |
| 4 | `title_filter.seniority_boost` (default `[Senior, Staff, Lead]`) | PASS | results sort order in `#/scan` | same | — | results card heading × all 8 |
| 5 | `tracked_companies` with `name` + `careers_url` (+ optional `api`, `enabled`) | PASS | `#/scan → Active Companies card` shows ✓ green (API match) / ○ gray (no API) | `GET /api/portals` | `tests/scan.test.mjs` | card heading + status pip i18n × all 8 |
| 6 | `search_queries` for AI-powered Option B | **CLI-ONLY** | help-bundle §5 + §7 names it (used by `/career-ops scan`) | — | — | help §5 × all 8 |
| 7 | Option A — `npm run scan`, ~30 s, zero AI tokens, only GH/Ashby/Lever/Workable/SR/Workday | PASS | `#/scan → 🌐 Scan now` runs same code in-process | `GET /api/stream/scan?source=…` (SSE) | `tests/scan.test.mjs` + `tests/scan-streaming.test.mjs` | button label × all 8 |
| 8 | Option A flag `--dry-run` | **CLI-ONLY** | not surfaced in SPA | — | — | help §7 × all 8 |
| 9 | Option A flag `--company <name>` (case-insens) | **CLI-ONLY** | help-bundle §7 names it | — | — | help §7 × all 8 |
| 10 | Option B — `/career-ops scan` (Claude Code) | **CLI-ONLY** | help-bundle §7 names it | — | — | help §7 × all 8 |
| 11 | Output `data/pipeline.md`, `data/scan-history.tsv`, `data/last-scan.json` | PASS | `#/pipeline` reads `data/pipeline.md` | `GET /api/pipeline` | `tests/pipeline.test.mjs` | row labels × all 8 |
| 12 | Threshold ≥ 4.5 → `/career-ops apply` immediately | PASS | `#/reports` score-thresholds card | `tests/canonical-docs-coverage.test.mjs::rep.thr45` | `data-i18n="rep.thr45"` × all 8 |
| 13 | Threshold 4.0–4.4 → apply or `/career-ops contacto` | PASS | same | same | `data-i18n="rep.thr40"` × all 8 |
| 14 | Threshold 3.5–3.9 → `/career-ops deep` | PASS | same | same | `data-i18n="rep.thr35"` × all 8 |
| 15 | Threshold < 3.5 → skip | PASS | same | same | `data-i18n="rep.thrLow"` × all 8 |
| 16 | "Proceed w/ Caution" legitimacy flag | PASS | `#/reports` legitimacy badge in card header | `GET /api/reports/:slug` parses header | `tests/reports-legitimacy.test.mjs` | badge label × all 8 |
| 17 | "Duplicates skipped" in scan summary | PASS | SSE log line in `#/scan` | `/api/stream/scan` | `tests/scan-streaming.test.mjs` | log labels × all 8 |
| 18 | Russian portals (`russian_portals.sources: [hh, habr]`, `area`, `per_page`, `only_remote`, `queries`) | **EXTRA** (web-ui addition beyond canonical docs) | `#/scan` SSE includes hh.ru + Habr rows | `GET /api/scan/regional/config` | `tests/scan-regional.test.mjs` | regional source labels × all 8 |
| 19 | Browse reports via `./dashboard/career-dashboard` (terminal) | **CLI-ONLY** | SPA equivalent is `#/reports` (card grid, paginated) | `GET /api/reports` | `tests/reports.test.mjs` | × all 8 |

### 1.C — Apply for a job (`/docs/introduction/guides/apply-for-a-job`)

| # | Doc claim | Status | SPA surface | API / file | Test gate | Locale check |
|---|---|---|---|---|---|---|
| 1 | Prereq — JD has evaluation report under `reports/` | PASS | `#/apply` checklist mentions step 0 + step 1 (`check-liveness.mjs`) | — | `tests/apply.test.mjs` | step labels × all 8 |
| 2 | Step 1 — run `/career-ops apply <company>` | **CLI-ONLY** | `#/apply` generates checklist + names the command | `POST /api/apply-helper` | `tests/apply.test.mjs` | checklist headline × all 8 |
| 3 | Step 1.alt — no-arg form takes screenshot / paste-questions / URL on next turn | **CLI-ONLY** | help-bundle §14 names the manual-input options | — | — | help §14 × all 8 |
| 4 | Step 2 — system locates report in `reports/` | **CLI-ONLY** | parent CLI, not in SPA | — | — | help §14 × all 8 |
| 5 | Step 3 — Playwright opens browser automatically | **CLI-ONLY** + **PASS** for fallback | `#/health` surfaces `Playwright (parent node_modules)` check | — | `tests/health.test.mjs` | × all 8 |
| 6 | Step 3.fallback — WebFetch (text-only form preview) when Playwright missing | **CLI-ONLY** | help-bundle §14 names the fallback | — | — | help §14 × all 8 |
| 7 | Step 4-6 — read fields, generate answers, return numbered list ordered simple → free-text | **CLI-ONLY** | `#/apply` checklist describes this | `POST /api/apply-helper` | `tests/apply.test.mjs` | step labels × all 8 |
| 8 | Step 7 — user copies answers into form (manual) | PASS | `#/apply` checklist step | — | `tests/apply.test.mjs` | × all 8 |
| 9 | Step 8 — user clicks Submit then types `Submitted.` in chat | **CLI-ONLY** | help-bundle §14 names the contract; never auto-submitted on web | — | `tests/apply.test.mjs` (warning text present) | × all 8 |
| 10 | On `Submitted.` → status flips Evaluated → Applied in `data/applications.md` | PASS | `#/tracker` reads `data/applications.md`; status enum honored | `POST /api/tracker` | `tests/tracker.test.mjs` | status-enum labels × all 8 |
| 11 | On `Submitted.` → filled answers persisted in **Section G** of report | **DRIFT** | reports view renders v1.x A-F (no G) but still displays legacy A-G files | `GET /api/reports/:slug` | `tests/reports.test.mjs` | **see §3.A below — known-deferred G-005** |
| 12 | Handoff to `/career-ops tracker` | PASS | `#/tracker` is the canonical SPA equivalent | `GET /api/tracker` | `tests/tracker.test.mjs` | × all 8 |
| 13 | `/career-ops contacto` recommended at score ≥ 4.0 | PASS | `#/contacto` mode page | `POST /api/mode/contacto` (with `llmRateLimit`) | `tests/mode-page.test.mjs` | × all 8 |
| 14 | `/career-ops pdf` produces tailored PDF in `output/` | PASS | 📄 Generate PDF on `#/cv` / `#/reports/:slug` / `#/evaluate` / `#/deep` / `#/interview-prep` | `GET /api/stream/pdf*` (SSE) | `tests/pdf-stream.test.mjs` | button label × all 8 |
| 15 | Reminder: NEVER auto-submit | PASS | `#/apply` carries explicit "never auto-submit" banner | `POST /api/apply-helper` returns warning string | `tests/apply.test.mjs::warning-string` | warning text × all 8 |

### 1.D — Batch evaluate offers (`/docs/introduction/guides/batch-evaluate-offers`)

| # | Doc claim | Status | SPA surface | API / file | Test gate | Locale check |
|---|---|---|---|---|---|---|
| 1 | `batch/batch-input.tsv` with cols `id`, `url`, `source`, `notes` | PASS | `#/batch` TSV editor renders + validates 4-column shape | `GET/PUT /api/batch` | `tests/batch.test.mjs` | header labels × all 8 |
| 2 | `./batch/batch-runner.sh --dry-run` | PASS | `#/batch` dry-run checkbox | `GET /api/stream/batch?dryRun=1` | `tests/batch-runner.test.mjs` | label × all 8 |
| 3 | `--parallel N` (1, 2, 3) | PASS | `#/batch` parallel select (1 / 2 / 3) | `GET /api/stream/batch?parallel=N` | `tests/batch-runner.test.mjs` | label × all 8 |
| 4 | `--min-score X.X` | PASS | `#/batch` min-score input | `GET /api/stream/batch?minScore=…` | `tests/batch-runner.test.mjs` | label × all 8 |
| 5 | `--retry-failed` | PASS | `#/batch` retry-failed checkbox | `GET /api/stream/batch?retryFailed=1` | `tests/batch-runner.test.mjs` | label × all 8 |
| 6 | `--max-retries N` (default 2) | **GAP — verify** | `#/batch` UI: is max-retries surfaced? **Run §2.D.6 below.** | `GET /api/stream/batch?maxRetries=…`? | manual smoke | × all 8 (if surfaced) |
| 7 | Reports land in `reports/{id}-{company}-{date}.md` | PASS | `#/reports` lists every file | `GET /api/reports` | `tests/reports.test.mjs` | × all 8 |
| 8 | Summary rows append to `batch/tracker-additions/*.tsv` | PASS | `#/tracker → ▶ Merge` consumes these files | `POST /api/batch/merge`, `POST /api/run/merge` | `tests/batch.test.mjs::merge` | merge-button label × all 8 |
| 9 | `node merge-tracker.mjs` + `--dry-run` | PASS | `#/tracker → ▶ Merge` button (no dry-run UI checkbox — confirm with QA) | `POST /api/run/merge` | `tests/runners.test.mjs::merge` | merge label × all 8 |
| 10 | Failed worker shows "short error message" | PASS | `#/batch` SSE log surfaces error rows | `/api/stream/batch` | `tests/batch-runner.test.mjs::error-row` | × all 8 |
| 11 | Re-running batch is "always safe" (idempotent) | PASS | dedup logic in `merge-tracker.mjs`; archives to `batch/tracker-additions/merged/` | `POST /api/run/merge` | `tests/merge-idempotent.test.mjs` | — |

### 1.E — Set up Playwright (`/docs/introduction/guides/set-up-playwright`)

| # | Doc claim | Status | SPA surface | API / file | Test gate | Locale check |
|---|---|---|---|---|---|---|
| 1 | `npm install` (parent) | **CLI-ONLY** | `bin/start.sh` runs `npm install --silent` if `node_modules/` missing | — | — | help §14 × all 8 |
| 2 | `npx playwright install chromium` | **CLI-ONLY** | `bin/start.sh` auto-installs Chromium if cache missing | — | `bin/start.sh:85-93` | help §14 × all 8 |
| 3 | `claude mcp add playwright npx @playwright/mcp@latest` | **CLI-ONLY** | help-bundle §14 names it | — | `tests/canonical-docs-coverage.test.mjs` | help §14 × all 8 |
| 4 | Alt MCP config — manual `.claude/settings.local.json` block | **CLI-ONLY** | help-bundle §14 includes the JSON snippet | — | — | help §14 × all 8 |
| 5 | `npm run doctor` verifies all three (Chromium + Playwright lib + MCP) | PASS | `#/health → ▶ Doctor` button | `POST /api/run/doctor` | `tests/health.test.mjs` | × all 8 |
| 6 | Headless by default; `open up with playwright the browser` to watch | **CLI-ONLY** | help-bundle §14 names the prompt | — | — | help §14 × all 8 |
| 7 | Used for form-fill in `/career-ops apply` and PDF generation | PASS | `#/health` shows the Playwright check + each `📄 Generate PDF` button uses it | `GET /api/stream/pdf*` | `tests/pdf-stream.test.mjs` | × all 8 |
| 8 | Fallback when Playwright missing: WebFetch (apply); PDF errors | PASS | `#/health` shows the optional check | `GET /api/stream/pdf` returns 503 + error stream | `tests/pdf-stream.test.mjs::missing-playwright` | error toast × all 8 |

---

## 2. Per-page test scenarios (every button × every locale)

Run each scenario on every locale by clicking `.lang-btn[data-lang-btn="<lc>"]` first. **A scenario passes only when it passes for ALL 8 locales.** Locale switch must persist across reload (`localStorage('career-ops-ui:lang')` carries the choice).

### 2.A — `#/health` — Setup gates

**Required checks** (must all be ✓ green):
- `Node version` ≥ 18
- `Project root` (parent career-ops resolvable)
- `cv.md`, `config/profile.yml`, `portals.yml`, `data/applications.md`, `data/pipeline.md`, `modes/oferta.md` exist

**Optional checks** (warnings only):
- `Profile customized` (`candidate.full_name` ≠ placeholder)
- `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` set
- `Playwright (parent node_modules)` installed
- `Parent project dependencies` installed

**Buttons:**
- **▶ Doctor** → streams `doctor.mjs` output in modal; `data-i18n="health.runDoctor"`
- **▶ Verify pipeline** → streams `verify-pipeline.mjs`; `data-i18n="health.runVerify"`

**Footer assertions:**
- `version` = web-ui `package.json` → must show **1.27.0**
- `parentVersion` = parent `VERSION` → distinct from web-ui version

**i18n gate:** every check label, button label, and tooltip carries `data-i18n="health.*"` and renders correctly in all 8 locales (no raw-key, no English fallback on non-EN).

### 2.B — `#/config` — App settings (3 tabs)

**Tab 1: API keys & runtime**
- Inputs: `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` / `GEMINI_API_KEY` / `GEMINI_MODEL` / `PORT` / `HOST`
- **💾 Save** writes parent `.env` + applies to live `process.env`
- **▶ Test Anthropic** / **▶ Test Gemini** smoke buttons (`POST /api/evaluate/test-anthropic` / `/test-gemini`)
- Secrets masked in `GET /api/config` response (`sk-ant•••••••a1b2`)

**Tab 2: Profile**
- Textarea = full `config/profile.yml` verbatim
- Fields docs say to edit: `candidate.full_name`, `email`, `location`, `target_roles.primary`, `compensation.target_range`, `narrative.headline`
- **💾 Save** → server validates YAML (must be mapping + must contain `candidate`); stamps `# Career-Ops Profile Configuration` header

**Tab 3: Modes**
- Textarea = `modes/_profile.md` verbatim
- **💾 Save** → server validates non-empty + writes file

**Crash-canary (v1.24.1 G-015):** every tab renders without `c(...).also is not a function` on every locale.

**i18n gate:** tab labels, all field labels, all button labels carry `data-i18n="config.*"` and render in all 8 locales.

### 2.C — `#/profile` (canonical) + `#/settings` (alias)

- Read-only summary card of `config/profile.yml`
- Both URLs resolve to the same view (alias)
- Edit via `#/config → Profile tab`
- **i18n gate:** every field label `data-i18n="profile.*"` × all 8

### 2.D — `#/cv` — CV editor

| Sub-test | Expected |
|---|---|
| `📁 Upload CV` accepts `.md / .txt / .html / .pdf / .docx / .doc / .odt / .rtf / .markdown / .htm` | All extensions parse; result lands in editor |
| Server runs `stripDangerousMarkdown` on PUT — `<script>`, `<iframe>`, `<object>`, `<embed>`, `<svg>`, `<style>`, `<form>`, `javascript:`, `vbscript:`, `data:text/html`, `onclick=` etc. all neutralized | Response has `sanitized: true` when applicable |
| Body cap 1 MB on PUT, 11 MB on upload | 413 above cap |
| **💾 Save** → toast = `i18n.msg.cvSaved` (or locale equivalent) | × all 8 |
| **📄 Generate PDF** → SSE log → PDF auto-downloads → list at bottom shows newest file at top | × all 8 |
| **▶ sync-check** → modal with `cv-sync-check.mjs` output | × all 8 |

### 2.E — `#/scan` — Scanner

| Sub-test | Expected |
|---|---|
| **🌐 Scan now** button text (single 🌐 glyph, NOT double) | `data-i18n="scan.scanNow"` × all 8 |
| One button (not separate EN / RU) — v1.18.0 unification | × all 8 |
| Click → SSE log streams → result table populates | live |
| Filters: Free text / Source (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday / hh.ru / Habr) / Remote-Hybrid-Onsite / Stack chips (PHP / Go / Backend / Senior / …) / Dynamic chips | every dropdown + chip carries i18n key × all 8 |
| **Active Companies card** — ✓ green = API match, ○ gray = fallback prompt | card heading + status pip labels × all 8 |
| Click company name → fills results filter | × all 8 |
| Click ↗ icon → opens `careers_url` in new tab | × all 8 |
| **Stop button** mid-scan aborts `AbortController` | × all 8 |

### 2.F — `#/pipeline` — URL inbox

| Sub-test | Expected |
|---|---|
| `+ Add` URL form | `data-i18n="pipe.add"` × all 8 |
| **Ctrl+K / Cmd+K** focuses global search + accepts URL paste + Enter inserts | × all 8 |
| URL goes through `isValidJobUrl()` server-side — `localhost`, `127.0.0.1`, `file://`, `javascript:`, IP literals, template-chars all 400 | `tests/auto-pipeline-rejection-paths.test.mjs` |
| Click row → preview pane via `safeGet` (DNS-pinned, redirect-revalidated, 8 KB cap, 3-hop limit) | `tests/safe-fetch.test.mjs` |
| **▶** action → jumps to `#/evaluate?url=<href>` | × all 8 |
| **✕** action → removes from `data/pipeline.md` | × all 8 |
| **⚡ Evaluate first** top-right button | × all 8 |
| Concurrent POSTs (20 parallel adds) — 20 rows result via `withFileLock` | `tests/pipeline-concurrency.test.mjs` |

### 2.G — `#/evaluate` — Score one JD

| Sub-test | Expected |
|---|---|
| Arrives with `?url=<href>` from pipeline → SSRF-safe fetch + pre-fill | × all 8 |
| **💾 Save JD** → persists to `jds/jd-<date>-<ts>.txt` | `tests/jds-list-create-get.test.mjs` |
| **▶ Evaluate** with `ANTHROPIC_API_KEY` set → live Anthropic, scores 0-5, A-F sections rendered | × all 8 |
| With only `GEMINI_API_KEY` → `gemini-eval.mjs` fallback | × all 8 |
| No key → manual prompt card with **Copy** button | × all 8 |
| **💾 Save report** → writes `reports/<date>-<company>-<role>.md` | `tests/reports-save.test.mjs` |
| **📄 Generate PDF** in single-report view | × all 8 |
| Block letters in the rendered report — see §3.A drift note | — |

### 2.H — `#/reports`

| Sub-test | Expected |
|---|---|
| Score-thresholds card (collapsible `<details>`) at top | `data-i18n="rep.thresholdsTitle"` × all 8 |
| 4 rubric rows: ≥4.5, 4.0-4.4, 3.5-3.9, <3.5 with action text | `rep.thr45 / thr40 / thr35 / thrLow` × all 8 |
| Outbound link to `career-ops.org/docs` | `tests/canonical-docs-coverage.test.mjs` |
| Card grid pagination — 12 / page | × all 8 |
| Single-report view: **← All reports** + **🔗 Open JD** + **📄 Generate PDF** | × all 8 |
| Score-pill glyphs: ✓ ≥4, ◐ ≥3, ○ <3 (WCAG 1.4.1 redundant cue) | `tests/wcag-redundant-glyph.test.mjs` |

### 2.I — `#/tracker`

| Sub-test | Expected |
|---|---|
| Columns: `#`, `Date`, `Company`, `Role`, `Score`, `Status`, `PDF`, `Report`, `Notes` | each header `data-i18n="tracker.col.*"` × all 8 |
| Status enum: `Evaluated` / `Applied` / `Responded` / `Interview` / `Offer` / `Rejected` / `Discarded` / `SKIP` | enum values rendered per locale × all 8 |
| Filters: Status dropdown / Score (`≥ 4.0`, `≥ 3.0`, `< 3.0`) / Search (substring company+role) | × all 8 |
| Pagination — 25 / page | × all 8 |
| Add row: `Acme \| Co` (pipe) + `Senior Backend\nEngineer` (newline) round-trip losslessly (BF-1) | `tests/tracker-bf1.test.mjs` |
| **▶ Normalize** → `normalize-statuses.mjs` | × all 8 |
| **▶ Dedup** → `dedup-tracker.mjs` | × all 8 |
| **▶ Merge** → `merge-tracker.mjs` (consumes `batch/tracker-additions/*.tsv`) | × all 8 |
| Concurrent POSTs (20 parallel) → 20 rows via `withFileLock` (H-6) | `tests/tracker-concurrency.test.mjs` |

### 2.J — `#/deep`, `#/project`, `#/training`, `#/followup`, `#/contacto`, `#/interview-prep`, `#/patterns`

Each is a mode page (`views/mode-page.js`). Per-mode form, **▶ Generate prompt** (manual), **⚡ Run live** (when API key set).

| Sub-test (per mode) | Expected |
|---|---|
| Form renders all fields per `modes/<slug>.md` | × all 8 |
| **▶ Generate prompt** → manual prompt with **Copy** button | × all 8 |
| **⚡ Run live** → streaming response → save to appropriate folder (`interview-prep/`, etc.) | × all 8 |
| Apply mode (`#/apply`) is NOT in mode-page.js — it has its own checklist view; verify it explicitly mentions `/career-ops apply` + the "never auto-submit" warning | `tests/apply.test.mjs::warning-string` |

### 2.K — `#/batch`

| Sub-test | Expected |
|---|---|
| TSV editor: 4 columns (`id` / `url` / `source` / `notes`) | × all 8 |
| **Parallel** select: 1 / 2 / 3 | `data-i18n="batch.parallel"` × all 8 |
| **Min score** input (0.0-5.0) | × all 8 |
| **Dry-run** checkbox | × all 8 |
| **Retry failed** checkbox | × all 8 |
| **Max retries** input — **CONFIRM IS PRESENT** (1.D row #6) | × all 8 if surfaced |
| **▶ Run batch** → SSE stream of per-row progress | × all 8 |
| Legacy `#/batch-prompt` resolves with deprecation banner pointing at `#/batch` | × all 8 |

### 2.L — `#/help`

| Sub-test | Expected |
|---|---|
| 16 H2 sections × all 8 | `tests/help-ui.test.mjs::section-parity` |
| 5 canonical career-ops.org URLs each appear ≥ 2 times in every locale | `tests/canonical-docs-coverage.test.mjs` |
| 21-step Getting Started walkthrough — all button labels named (📁 Upload CV / 🌐 Scan now / ▶ Evaluate / 📄 Generate PDF / 💾 Save) | grep-test per locale |
| `cp templates/portals.example.yml portals.yml` bootstrap command appears in §5 × all 8 | grep-test |
| `"no AI tokens consumed"` note for Option A in §7 × all 8 | grep-test |
| 8-step apply flow ending in `Submitted.` in §14 × all 8 | grep-test |

### 2.M — `#/activity` — Audit log

| Sub-test | Expected |
|---|---|
| Reverse-chronological JSONL trail | `GET /api/activity` |
| Secrets redacted in `body.*` payloads | `tests/activity-redaction.test.mjs` |
| Filter by action prefix (`pipeline.` / `cv.` / `evaluate` / `scan.` / …) | × all 8 |
| 25 rows / page; server returns ≤ 500 most-recent | × all 8 |

---

## 3. Known drift & deferred items (must appear in report — do NOT file as new bugs)

### 3.A — G-005 — Report blocks A-G vs canonical A-F

- **Canonical (career-ops.org/docs):** apply-for-a-job §step-8 says "filled answers persisted in **Section G**" — implying A-G report schema is still alive in the upstream `modes/oferta.md`.
- **Our help-bundle §9 (Evaluate):** says v1.15.0 realigned to A-F (`A=Role Summary, B=CV Match, C=Strategy, D=Compensation, E=Personalization, F=STAR stories`). Score and Legitimacy live in the report header.
- **Reports view:** renders BOTH schemas — legacy A-G files display verbatim; new A-F files use the realigned semantics.
- **Status:** **DRIFT (deferred to a coordinated parent commit — `REGRESSION-v1.27.md §11`).** QA reports the schema actually shipped on the test stand and notes the drift; does NOT file as a bug.

### 3.B — AI-assistant list mismatch

- **Canonical Quick Start (docs):** Claude Code / Codex / OpenCode / Qwen CLI.
- **Our help-bundle §intro:** Claude Code / Codex / Cursor / Gemini CLI / GitHub Copilot CLI.
- **Status:** **DRIFT — needs human decision.** Both lists are partial; neither covers the other. **Action:** ask the project owner which list is canonical, then sync both surfaces. Not actionable in QA — record only.

### 3.C — `/career-ops ofertas`

- **Docs Quick Start:** lists the command in the CLI verbs without semantics (`[INFERRED]` per docs extraction).
- **Our help-bundle:** does not mention `/career-ops ofertas` anywhere.
- **Status:** **GAP (action required):** confirm with the project owner whether `ofertas` is a valid CLI command. If yes — help-bundle §14 needs an entry. If no — docs needs an issue filed upstream.

### 3.D — `/career-ops auto-pipeline` SPA parity

- **Docs Quick Start Step 7:** the canonical entry point for a brand-new user. Single command, ~1-2 min, full pipeline.
- **Our SPA:** `#/dashboard → ✨ Auto-pipeline a URL` button → `POST /api/auto-pipeline` with `mode:'manual'` short-circuit (v1.25.0 G-014) for no-key users.
- **Status:** **PASS** — verify the manual short-circuit returns in ≤ 2 s (`REGRESSION-v1.27.md §3.7`) and that the live-key path emits SSE step events for `validate / fetch / save_jd / evaluate / save_report / append_tracker`.

### 3.E — `--max-retries N` UI surface

- **Docs:** batch-evaluate-offers lists `--max-retries N` (default 2) as a flag.
- **Our SPA:** `#/batch` has 4 controls (Parallel / Min score / Dry-run / Retry failed) — confirm whether `max-retries` is also present.
- **Status:** **VERIFY (§2.K above)** — if missing, file as a small **GAP** ticket (UI control to expose the flag the CLI already supports).

### 3.F — Russian portals (`hh.ru` + Habr Career)

- **Docs:** silent on regional portals (career-ops.org/docs covers only English ATSes).
- **Our SPA:** `#/scan` integrates hh.ru API + Habr Career HTML scraper.
- **Status:** **EXTRA** — web-ui addition beyond canonical docs. QA should verify it works, but absence in docs is NOT a bug.

---

## 4. Out-of-scope (CLI-only by design — verify help-bundle mentions only)

The following are parent-CLI commands that have no SPA equivalent by design. QA should confirm only that **`docs/help/<locale>.md`** names them correctly in the right section. No UI test needed.

- `/career-ops scan` (Option B browser-scan via Claude Code) — help §7 × all 8
- `/career-ops pipeline` (batch-evaluation entry) — help §7 + §14 × all 8
- `/career-ops apply <company>` (Playwright form-fill) — help §14 × all 8
- `/career-ops contacto` — help §13 mode page list × all 8
- `/career-ops deep` — help §12 × all 8
- `/career-ops tracker` — help §11 × all 8
- `/career-ops pdf` — help §4 + §14 × all 8
- `/career-ops auto-pipeline <url>` — help §1 step 7 × all 8 (matches the SPA button)
- `npm run scan` / `npm run scan -- --dry-run` / `npm run scan -- --company <name>` — help §7 × all 8
- `./batch/batch-runner.sh` with all flags — help §14 × all 8
- `node merge-tracker.mjs` with `--dry-run` — help §11 + §14 × all 8
- `./dashboard/career-dashboard` (terminal report browser) — help §7 mentions it × all 8
- `claude mcp add playwright …` (MCP install) — help §14 × all 8
- `npm run doctor` (Playwright verification) — help §6 + §14 × all 8

---

## 5. Locale invariant — every PASS row × 8 locales

For every PASS row in the matrix:

1. Switch to the locale via sidebar (`.lang-btn[data-lang-btn="<lc>"]`).
2. Reload page.
3. Confirm:
   - SPA renders in the chosen locale (NOT raw keys, NOT English fallback on non-EN).
   - `<html lang>` attribute matches (`document.documentElement.lang === '<lc>'`).
   - `localStorage.getItem('career-ops-ui:lang') === '<lc>'`.
   - Every button label, form label, table column header, tooltip, toast message, dropdown option, and SSE log line under test is translated.
   - Server response payloads that surface text (e.g. error messages from `POST /api/cv`, `POST /api/tracker`) carry the localized string — or carry the i18n key that the SPA then resolves.
4. **Safari private mode** — repeat once on Safari File → New Private Window. SPA must NOT break (locale switcher silent-fails on `localStorage.write`, reads default to browser auto-detect — v1.22.0 M-5).
5. **`<!-- DO NOT REVERT -->` marker** — each non-EN README has it near the dashboard-screenshot line. Translators must not revert the screenshot fix (v1.23.0 cadence).

**8 locales to cover:** `en`, `es`, `pt-BR`, `ko` (file: `ko-KR.md`), `ja`, `ru`, `zh-CN`, `zh-TW`. The locale code in `localStorage` and `<html lang>` follows BCP-47 (`ko` not `ko-KR` for the picker; files use the longer form).

**CI gates that already enforce this:**

- `tests/canonical-docs-coverage.test.mjs::i18n bundle includes every new key from v1.11.x with all 8 locales` — every i18n key in the v1.11+ set has all 8 locales present.
- `tests/help-ui.test.mjs::section-parity` — every help bundle has identical 16-H2 structure.
- `scripts/check-changelog-parity.mjs` — all 8 CHANGELOGs at the current version.

A failure on any of these CI gates is **BLOCKER** severity per `REGRESSION-v1.27.md §9`.

---

## 6. Reporting format

Output one Markdown file per QA run under `qa/docs-coverage-runs/<date>-docs-vs-app.md`:

```markdown
# career-ops-ui docs-vs-app QA — YYYY-MM-DD

**Stand:** http://127.0.0.1:4317 · v1.27.x · parentVersion 1.x.x · Node 22.x
**Tester:** human / Claude Cowork / CI
**Docs version observed:** career-ops.org/docs (5 canonical URLs, fetched YYYY-MM-DD)

## Section 1 — Matrix summary

| Doc claim | Status | Locale coverage (8) | Notes |
|---|---|---|---|
| 1.A.1 — `git clone` … | CLI-ONLY | 8/8 (help §14) | — |
| 1.A.2 — `npm run doctor` | PASS | 8/8 | — |
| 1.A.6 — AI-assistant list | DRIFT | 8/8 identical | needs canonical-list decision |
| 1.C.11 — Section G persistence | DRIFT | 8/8 identical | G-005 deferred |
| 1.D.6 — `--max-retries N` | GAP | n/a | UI control absent |
| … |

**Totals:** PASS = N · CLI-ONLY = N · GAP = N · DRIFT = N · TOTAL = M

## Section 2 — Per-page evidence

(For each of #/dashboard through #/activity: locale x screenshot if interactive, or curl log.)

## Section 3 — Failures

(One block per failure: row ID, expected vs actual, screenshot or log, severity.)

## Section 4 — Locale coverage failures

(Any row where < 8/8 locales passed. Include the failing locale + raw key or fallback observed.)

## Section 5 — Drift / deferred (§3 above)

For each drift row, record:
- The schema actually shipped on this stand
- Whether the help-bundle still references the now-stale canonical schema
- Whether the SPA renders gracefully (graceful degrade is required even on drift)
```

### Failure severity guide

| Severity | When to use |
|---|---|
| **BLOCKER** | Any 1.A-E row PASS that fails on ANY locale; any §5 CI gate red; `#/config` crashes on any locale; SSRF / XSS / path-traversal accepted on any endpoint |
| **HIGH** | Any documented button missing or non-functional on the stand; locale coverage < 8/8 on a feature row; a11y target-size regression (`§5.3` of REGRESSION-v1.27.md) |
| **MEDIUM** | Documented threshold / output / numeric contract drifts on the stand; help-bundle wording misaligned with canonical docs; missing optional UI control (e.g. `--max-retries`) |
| **WARNING** | Cosmetic drift (single ✨ glyph, label wording in one locale); deferred-known DRIFT rows (§3.A, §3.B); slow response > 30 s |

---

## 7. Quick automation for Claude Cowork / Playwright agents

```bash
# All CI-gate checks in one shot:
cd /Users/sergejemelanov/Projects/career-ops/web-ui
npm run test:ci                                       # 506 unit + check-no-also-leftovers + check-changelog-parity
npm test -- tests/canonical-docs-coverage.test.mjs    # docs URL coverage × 8 locales
npm test -- tests/help-ui.test.mjs                    # 16-H2 parity
npm run test:e2e:browser                              # Playwright smoke + full-cycle (32 tests)

# Stand spot-check (header text, button counts, etc.):
for lc in en es pt-BR ko ja ru zh-CN zh-TW; do
  printf "%-6s : " "$lc"
  curl -fsS "http://127.0.0.1:4317/api/help/$lc" | jq -r .markdown | head -1
done

# Sidebar dedupe (v1.27.0 PR-D):
[ "$(curl -fsS http://127.0.0.1:4317/ | grep -c 'href=\"#/dashboard\"')" = "1" ] && echo "  PASS"

# Auto-pipeline manual short-circuit (docs Step 7 / G-014):
t0=$(date +%s%N)
curl -sS -X POST -H 'Content-Type: application/json' \
  -d '{"url":"https://job-boards.greenhouse.io/anthropic/jobs/x","mode":"manual"}' \
  http://127.0.0.1:4317/api/auto-pipeline >/dev/null
t1=$(date +%s%N)
echo "  auto-pipeline manual: $(( (t1 - t0) / 1000000 ))ms (expected ≤ 2000)"
```

For browser-level locale × button coverage, drive Playwright with a matrix loop:

```js
for (const lc of ['en','es','pt-BR','ko','ja','ru','zh-CN','zh-TW']) {
  await page.click(`.lang-btn[data-lang-btn="${lc}"]`);
  await page.reload();
  for (const route of ['/dashboard','/scan','/pipeline','/evaluate','/batch','/reports',
                        '/tracker','/activity','/cv','/profile','/config','/health','/help']) {
    await page.goto(BASE + '/#' + route);
    await page.waitForLoadState('networkidle');
    // assert: no element has textContent that looks like a raw i18n key
    const rawKeys = await page.$$eval('*', els => els
      .filter(e => /^[a-z]+\.[a-zA-Z]+$/.test((e.textContent || '').trim()))
      .map(e => ({ tag: e.tagName, text: e.textContent.trim() })));
    assert.deepEqual(rawKeys, [], `route ${route} locale ${lc} has raw i18n keys:\n${JSON.stringify(rawKeys, null, 2)}`);
  }
}
```

---

## 8. Source provenance

- **Docs as of run date:** the 5 URLs fetched on 2026-05-14. Re-fetch on every regression to catch upstream changes (especially section numbering, threshold wording, and the apply-flow step count).
- **Code as of build:** `web-ui@1.27.0` — commit `e17a53b` and earlier. The static-HTML gate (`href="#/dashboard"` count = 1) is a v1.27.0 contract; older versions had 2.
- **Help bundle as of build:** `docs/help/en.md` 1269 lines, 16 H2 sections. 7 other locales 1184-1344 lines, all 16-H2. CI gate `tests/canonical-docs-coverage.test.mjs` keeps these in lockstep.
- **Drift records:** §3.A (G-005) and §3.B (AI-list) are tracked in `REGRESSION-v1.27.md §11`. §3.C (`/career-ops ofertas`) and §3.E (`--max-retries N`) need decisions from the project owner.

---

## 9. Maintenance

- Re-run this matrix on every release that touches `docs/help/*.md`, `public/js/views/*.js`, `server/lib/routes/*.mjs`, or `tests/canonical-docs-coverage.test.mjs`.
- If the canonical docs add a 6th guide or change a threshold, update §1 first, then patch the help-bundle so the CI gate stays green.
- Move §3 rows to "Closed" only after a coordinated parent commit + a web-ui commit land in the same release; do NOT mark closed unilaterally.
