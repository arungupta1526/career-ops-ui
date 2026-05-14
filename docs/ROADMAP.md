# ROADMAP — career-ops-ui

> Public roadmap. Mirrors the active milestone in `.planning/ROADMAP.md` (which is GSD-managed and gitignored). Update this file when a milestone closes or scope shifts.

## Current milestone — `v2.0.x` (planning)

| # | Phase | Status | Goal |
|---|---|---|---|
| P-11 | TS/JSDoc adoption evaluation | pending | Re-evaluate the TS migration heuristic. Combined LOC trajectory + bug-class analysis from v1.7–1.9. |
| P-12 | Auth gate for LAN exposure | pending | When `HOST=0.0.0.0`, require a token-bearer header gated by `WEB_UI_AUTH_TOKEN`. Today the user is on their honor. |
| P-13 | Persistent SSE log archive | pending | Today scan logs vanish on page reload. Persist last N runs under `data/scan-logs/`. Provide a `/#/activity` filter to browse them. |
| P-14 | Public Plug-in scanners | **partial (v1.29.0)** | `server/lib/sources/registry.mjs` lays the foundation. Remaining: support DYNAMIC adapter discovery (auto-load every `server/lib/sources/*.mjs` rather than explicit registry entries) so users can drop in adapters without editing core files. |
| P-15 | UI views split | pending | `public/js/views/scan.js` is now ~670 LOC (was 461 at last measurement) — past 400-LOC soft target. Extract Active Companies card to `views/scan/active-companies.js`; consider splitting source-filter logic. `public/css/app.css` at ~958 LOC is past the 800-LOC hard target — split candidates: paginator → `views/paginator.css`, sidebar → `views/sidebar.css`. |
| P-16 | G-005 report-block alignment | deferred | A-G → canonical A-F (`apply-for-a-job §step-8` still names "Section G"). Requires coordinated parent commit on `santifer/career-ops :: modes/oferta.md`. Renderer is schema-tolerant — legacy A-G files still display correctly, so this is vocabulary alignment, not a behavioural fix. |

## Completed milestones

- **`v1.30.0` (May 2026)** — `#/scan` results paginator replaces the v1.12 "first 200 of N" truncation. `UI.paginate({ pageSize: 200 })` consistent with `#/tracker` / `#/reports` / `#/activity`. Sort full filtered set before page-slicing so boost-to-top is stable across pages. Filter inputs reset to page 0. Stale `scan.shownTop` key removed (8 locales). 9 new tests. 567 unit + 32 Playwright.
- **`v1.29.x` (May 2026)** — Regional scanner expanded from 2 to **5 RU adapters**: Trudvsem (open-data API), GetMatch + GeekJob (HTML) added alongside hh.ru + Habr Career. New `server/lib/sources/registry.mjs` as single source of truth. Dynamic source-filter dropdown via `GET /api/scan/sources`. Help-bundle §17 "How to add a portal" (developer flow) + §5 "Configuring RU portals" (user flow) × 8 locales. **v1.29.2 hot-fix:** multi-phase SSE contract — `done` payload carries `final: true|false`; client `EventSource` closes only on `final !== false`. Pre-v1.29.2 the RU phase was silently dropped from 🌐 Scan. 558 unit + 32 Playwright.
- **`v1.28.x` (May 2026)** — Two GitHub-issue closures: #1 AI-assistant list aligned to upstream (Claude Code · Codex · OpenCode · Qwen CLI), #2 `#/batch` exposes `--max-retries N` (1-10). **v1.28.1 hot-fix:** router strips `?query` before route-name lookup (closes 404 on `#/pipeline → ▶` and `#/config?tab=modes`); `HH_USER_AGENT` row pruned from health-check. 520 unit + 32 Playwright.
- **`v1.27.0` (May 2026)** — Sidebar `#/dashboard` dedupe (brand block now `<div>`, not duplicate `<a>`).
- **`v1.26.x` (May 2026)** — v1.26.0 test pyramid (TESTING.md + `tests/acceptance/` + 2 CI gates). **v1.26.1 hot-fix:** restored WCAG-2.5.5 `.btn` 44 px floor + `flex-shrink: 0`.
- **`v1.25.0` (May 2026)** — G-014 auto-pipeline manual-mode short-circuit (returns in ≤ 2 s without LLM key). G-012 CHANGELOG locale parity gate.
- **`v1.24.x` (May 2026)** — Help-bundle content depth refresh × 8 locales (each canonical career-ops.org URL ≥ 2× per file). **v1.24.1 hot-fix:** G-015 `#/config` crash (`c(...).also is not a function`) closed with CI gate.
- **`v1.23.0` (May 2026)** — `i18n.js` split into `i18n-dict.js` (data, 578 LOC) + `i18n.js` (logic, 86 LOC). Connection-banner cadence fix.
- **`v1.22.0` (May 2026)** — M/L/N backlog clearout: entity-aware `stripDangerousMarkdown` (M-4), score-pill redundant glyphs (M-3), Safari private-mode robustness (M-5), `Element.prototype.also` retired (N-2).
- **`v1.21.0` (May 2026)** — Security + concurrency pass: B-1 DNS-rebind-safe `safe-fetch.mjs`, H-4 consolidated `sanitizePathName`, H-5 `llmRateLimit` middleware, H-6 `withFileLock` for tracker/pipeline writes.
- **`v1.20.x` (May 2026)** — WCAG 2.5.5 / 2.5.8 / 1.3.1 / 3.3.2 per-component a11y. `/api/scan-ru/config` alias retired.
- **`v1.19.0` (May 2026)** — WCAG 1.4.3 contrast pass. `HH_USER_AGENT` removed from `#/config` UI surface.
- **`v1.18.0` (May 2026)** — F-018 / G-004: scan-en + scan-ru SSE aliases retired (consolidated `/api/stream/scan?source=…`). WCAG 2.2 AA baseline.
- **`v1.15.0` – `v1.17.0` (May 2026)** — G-006/7/8/9/11 scope: Legitimacy column, auto-pipeline endpoint, modes editor (`#/config → Modes`), canonical profile schema, sidebar dedup + `#/batch` SPA. `#/batch-prompt` legacy alias with deprecation banner (v1.17).
- **`v1.9.x` (May 2026)** — P-2 phase 2 finishes the server split: `index.mjs` 762 → 130 LOC (-83%). Twelve route modules under `lib/routes/`. P-7 Anthropic parity for `/api/evaluate` + new `/api/evaluate/test-anthropic` smoke endpoint. P-8 help-center i18n parity test now covers all 8 locales with content-floor guard. P-9 Playwright browser smoke wired into CI matrix. P-10 multi-CLI shims (`AGENTS.md` for Codex, `GEMINI.md` for Gemini CLI). **v1.9.1** added a production-readiness pass with 4 targeted bug fixes (BF-1 tracker pipe escape + GFM-compliant parser, BF-2 config write try/catch, BF-3/BF-4 prompt-size soft cap on Anthropic SDK calls) and Playwright smoke expanded 5 → 12 tests. 284 unit + 12 Playwright. See `CHANGELOG.md`.
- **`v1.8.x` (May 2026)** — Hardening + SDD bootstrap. Three high-severity fixes (A1 Anthropic file context, A2 SIGKILL escalation, A3 SSE max-runtime), four medium (B1 redirect validation, B2 key check unification, B3 AbortSignal in scanners, B4 log guard). P-2 phase 1: server split 1230 → 762 LOC. P-1: full SDD foundation (`docs/`, `.claude/`, `CLAUDE.md`, `.aiignore`). Parent career-ops v1.7.0 audit. Playwright browser smoke (5 tests). 283 unit tests. See `CHANGELOG.md`.
- **`v1.7.x` (May 2026)** — Help center, mobile sidebar drawer, real version surface, Active Companies card, Anthropic live execution, runner unit tests, E2E comprehensive harness, GitHub Packages publish, CI workflows. See `CHANGELOG.md`.
- **`v1.6.x` (Apr–May 2026)** — QA fix sprint: stored XSS in CV markdown preview (FIX-C10), CSP headers (FIX-L2), URL validation in pipeline (FIX-M3/M6), 31-defect bug fix queue, dotenv loader, security headers, JD sanitization, JD delete, health doctor unify, output PDFs.

## Backlog (not yet scheduled)

- **TS migration evaluation.** Revisit if combined LOC > 10k or if implicit-any bug count > N/quarter. For now, JSDoc + `// @ts-check` on hot paths is enough.
- **Authentication for LAN exposure.** When `HOST=0.0.0.0`, add token-bearer auth gated by an env var. Today the user is on their honor.
- **Bundler experiment.** Test esbuild-based optional bundling for `public/js/` for production deployments while keeping the dev story zero-tooling.
- **Plug-in scanners.** Allow third-party portal source modules (`server/lib/sources/*.mjs`) to be discovered automatically rather than hard-coded.
- **Persistent SSE log archive.** Today scan logs vanish on page reload. Persist last N runs under `data/scan-logs/`.

## How phases get added

1. Run `/gsd-explore` (or `/superpowers:brainstorming`) for ideation.
2. Run `/gsd-plan-phase` — produces `.planning/phases/P-NN-<slug>/PLAN.md`.
3. After the user approves the plan, the phase is added here as **pending**.
4. On execution start, status becomes **active**.
5. On completion (verify + review pass), status becomes **completed** and the phase moves into the milestone history.

See `docs/sdd/SDD-GUIDE.md` for the full pipeline.
