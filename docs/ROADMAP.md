# ROADMAP — career-ops-ui

> Public roadmap. Mirrors the active milestone in `.planning/ROADMAP.md` (which is GSD-managed and gitignored). Update this file when a milestone closes or scope shifts.

## Current milestone — `v2.0.x` (planning)

| # | Phase | Status | Goal |
|---|---|---|---|
| P-11 | TS/JSDoc adoption evaluation | pending | Re-evaluate the TS migration heuristic. Combined LOC trajectory + bug-class analysis from v1.7–1.9. |
| P-12 | Auth gate for LAN exposure | pending | When `HOST=0.0.0.0`, require a token-bearer header gated by `WEB_UI_AUTH_TOKEN`. Today the user is on their honor. |
| P-13 | Persistent SSE log archive | pending | Today scan logs vanish on page reload. Persist last N runs under `data/scan-logs/`. Provide a `/#/activity` filter to browse them. |
| P-14 | Public Plug-in scanners | pending | Allow third-party portal source modules (`server/lib/sources/*.mjs`) to be auto-discovered rather than hard-coded in `en-scanner.mjs`. |
| P-15 | UI views split | pending | `public/js/views/scan.js` is 461 LOC — extract Active Companies card to `views/scan/active-companies.js`. Audit other views for the same pressure. |

## Completed milestones

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
