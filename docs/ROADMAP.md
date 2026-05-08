# ROADMAP — career-ops-ui

> Public roadmap. Mirrors the active milestone in `.planning/ROADMAP.md` (which is GSD-managed and gitignored). Update this file when a milestone closes or scope shifts.

## Current milestone — `v1.9.x` (planning)

| # | Phase | Status | Goal |
|---|---|---|---|
| P-6 | P-2 phase 2 — finish server split | pending | Extract tracker / pipeline / reports / jds / llm / health into `lib/routes/*.mjs`. Target `index.mjs` < 500 LOC. |
| P-7 | Anthropic Run path parity | pending | Audit every "Run live" button so they reach Anthropic in addition to Gemini. Most flows already work post-A1; verify `/api/evaluate` (Gemini-only today). |
| P-8 | Help-center i18n parity | pending | Backfill `docs/help/<lang>.md` for any locale that lags behind `en.md`. |
| P-9 | Comprehensive E2E expansion | pending | Promote `tests/e2e-comprehensive.mjs` to cover every view + every SSE stream + every mode prompt. Wire Playwright smoke into CI matrix. |
| P-10 | Multi-CLI compatibility | pending | Parent v1.7.0 introduced multi-CLI / Open Agent Skill standard. Surface CLI-agnostic wiring in `bin/start.sh` and docs. |

## Completed milestones

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
