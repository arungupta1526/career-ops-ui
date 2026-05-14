# QA artifacts — career-ops-ui

Tracks regressions, fix-prompts, and live evidence across releases.

## CURRENT (v1.28.0)

Two complementary regression specs — **run both** on each release cycle.

| File | Perspective | Purpose |
|---|---|---|
| **[`REGRESSION-v1.27.md`](./REGRESSION-v1.27.md)** | **Bottom-up** | Canonical regression spec from baseline v1.6.0 through v1.27.0. Every page, endpoint, security invariant, a11y rule. Catches regressions in working code. |
| **[`DOCS-COVERAGE-v1.28.md`](./DOCS-COVERAGE-v1.28.md)** | **Top-down** | Docs-driven coverage spec for v1.28.0. Every claim in the 5 canonical career-ops.org/docs guides mapped to its SPA surface. Catches features missing from the SPA vs what the docs promise. |
| [`v27-regression/2026-05-14-REGRESSION.md`](./v27-regression/2026-05-14-REGRESSION.md) | Bottom-up | Last live run (40/40 PASS on v1.27.0). |
| [`v26-regression/2026-05-14-REGRESSION.md`](./v26-regression/2026-05-14-REGRESSION.md) | Bottom-up | Prior live run (caught WCAG-2.5.5 fixed in v1.26.1). |
| [`v24-regression/01-LIVE-8-LOCALES-WORKFLOWS.md`](./v24-regression/01-LIVE-8-LOCALES-WORKFLOWS.md) | Historical | 8 locales × 5 docs workflows × every button/filter at v1.24.0. |

## Open backlog (v1.28.0)

Per `DOCS-COVERAGE-v1.28.md §3` + `REGRESSION-v1.27.md §11`:

| ID | Severity | Title | Target |
|---|---|---|---|
| G-005 | Minor (cross-repo) | Report blocks A-G in our `oferta.md` vs canonical career-ops.org A-F (apply-for-a-job §step-8 still names "Section G") | Coordinated parent commit |
| §3.C | Minor (decision needed) | `/career-ops ofertas` — docs name it without semantics, help-bundle silent. Confirm with project owner. | one-shot |

**Closed since v1.27.0 (this cycle):**

| ID | Closed in | How verified |
|---|---|---|
| §3.B AI-assistant list (Cursor/Gemini/Copilot → Claude/Codex/OpenCode/Qwen) | v1.28.0 | all 8 help-bundles: `OpenCode=2, Qwen=2, legacy-triad=0` |
| §3.E `--max-retries N` UI surface | v1.28.0 | `public/js/views/batch.js:73-89` + i18n × 8 + `tests/batch-max-retries.test.mjs` |
| CHANGELOG parity | v1.28.0 | all 8 CHANGELOGs at `## [1.28.0] — 2026-05-14` |

## Cumulative closures since v1.10 baseline

**27 of 28 prior findings shipped across v1.15 → v1.28:**

- v1.15.0 — G-006 Legitimacy column, G-007 auto-pipeline, G-008 modes editor, G-009 canonical profile schema, G-011 sidebar + #/batch SPA
- v1.17.0 — legacy #/batch-prompt deprecation banner
- v1.18.0 — F-018 / G-004 scan aliases retired + WCAG 2.2 AA baseline
- v1.19.0 — F-013 HH_USER_AGENT removed + contrast
- v1.20.0 — per-component a11y + /api/scan-ru/config retired
- v1.21.0 — B-1 / H-4 / H-5 / H-6 security pass
- v1.22.0 — M/L/N backlog clearout (entity-aware XSS strip, glyphs, etc.)
- v1.23.0 — i18n.js split, connection-banner recovery
- v1.24.0 — help-bundle content depth × 8 locales
- v1.24.1 — G-015 #/config hot-fix
- v1.25.0 — G-014 auto-pipeline manual + G-012 CHANGELOG parity + cosmetic ✨
- v1.26.0 — test pyramid (TESTING.md, tests/acceptance/, CI gates)
- v1.26.1 — WCAG 2.5.5 button-height hot-fix
- v1.27.0 — sidebar dedupe (#/dashboard) + README.cn.md → README.zh-CN.md
- **v1.28.0 — AI-assistant list alignment + --max-retries UI surface**

Only G-005 remains, and it's intentionally deferred pending a coordinated parent-project commit.

## Folder layout

```
qa/
├── README.md                        ← you are here
├── REGRESSION-v1.27.md              ← bottom-up regression spec (working invariants)
├── DOCS-COVERAGE-v1.28.md           ← top-down docs-driven coverage spec (NEW)
├── v27-regression/2026-05-14-REGRESSION.md   ← live evidence v1.27.0 (40/40 PASS)
├── v26-regression/2026-05-14-REGRESSION.md   ← prior cycle evidence
├── v24-regression/                  ← historical v1.24.x evidence (3 files)
└── archive/                         ← historical, do not act on
    ├── v1.10-fixes/                  (19 F-* + 5 scenarios + preflight)
    ├── v1.14-reports/                (live v1.14 matrix + functional audit)
    ├── v1.15-fix-prompts/            (FIX-PROMPT-v15 × 3 + conformance audit)
    ├── v1.25-fix-prompts/            (FIX-PROMPT-v24.1 — all but G-005 shipped)
    └── v1.26-fix-prompts/            (FIX-PROMPT-v26.1 + REGRESSION-v1.26 superseded)
```

## How to use this folder

**For developers:**

Single open item is **G-005** (cross-repo). Open the §11 of `REGRESSION-v1.27.md` for context, then the full plan in `archive/v1.26-fix-prompts/FIX-PROMPT-v26.1-shipped.md → PR-B`. Requires a coordinated commit in parent `santifer/career-ops` to rewrite `modes/oferta.md` to A-F, then a web-ui commit to update §9 of help bundles + report-render strip-G logic.

**For QA running the next regression cycle:**

1. **Bottom-up regression** — `REGRESSION-v1.27.md`. Walk §1 → §11. Most sub-checks have curl probe or JS snippet ready to paste. Save run report under `qa/v28-regression/<date>-REGRESSION.md`.
2. **Top-down docs coverage** — `DOCS-COVERAGE-v1.28.md`. Walk §1.A → §1.E feature matrix on every locale. Save run report under `qa/docs-coverage-runs/<date>-docs-vs-app.md`.
3. Both specs catch different things: bottom-up catches regressions in working code; top-down catches drift between what the docs say and what the SPA implements.

**For anyone reading the history:**

Everything in `archive/` is closed. Do not file new tickets for those IDs without first checking the source tree against the v1.28.0 implementation notes.

