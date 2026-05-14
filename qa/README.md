# QA artifacts — career-ops-ui

Tracks regressions, fix-prompts, and live evidence across releases.

## CURRENT (v1.29.2)

Two complementary regression specs — **run both** on each release cycle.

| File | Perspective | Purpose |
|---|---|---|
| **[`REGRESSION-v1.29.2.md`](./REGRESSION-v1.29.2.md)** | **Bottom-up** | Canonical regression spec from baseline v1.6.0 through v1.29.2. Every page, endpoint, security invariant, a11y rule, multi-phase SSE contract. Catches regressions in working code. |
| **[`DOCS-COVERAGE-v1.29.md`](./DOCS-COVERAGE-v1.29.md)** | **Top-down** | Docs-driven coverage spec for v1.29.x. Every claim in the 5 canonical career-ops.org/docs guides mapped to its SPA surface. Catches features missing from the SPA vs what the docs promise. |
| [`REGRESSION-v1.27.md`](./REGRESSION-v1.27.md) | Bottom-up — historical | Older spec frozen at v1.27.0. Kept for diff-only re-runs against shipped findings. |
| [`DOCS-COVERAGE-v1.28.md`](./DOCS-COVERAGE-v1.28.md) | Top-down — historical | Older docs coverage frozen at v1.28.0. |
| [`v28-regression/`](./v28-regression/) | Bottom-up | Live run reports on v1.28.x stand. |
| [`v27-regression/2026-05-14-REGRESSION.md`](./v27-regression/2026-05-14-REGRESSION.md) | Bottom-up | Live run on v1.27.0 (40 / 40 PASS — caught the WCAG-2.5.5 issue closed in v1.26.1). |
| [`v26-regression/2026-05-14-REGRESSION.md`](./v26-regression/2026-05-14-REGRESSION.md) | Bottom-up | Prior cycle evidence. |
| [`v24-regression/01-LIVE-8-LOCALES-WORKFLOWS.md`](./v24-regression/01-LIVE-8-LOCALES-WORKFLOWS.md) | Historical | 8 locales × 5 docs workflows × every button/filter at v1.24.0. |
| [`docs-coverage-runs/`](./docs-coverage-runs/) | Top-down | Live docs-vs-app run reports. |

## Open backlog (v1.29.2)

Per `REGRESSION-v1.29.2.md §13`:

| ID | Severity | Title | Target |
|---|---|---|---|
| G-005 | Minor (cross-repo) | Report blocks A-G in our `oferta.md` vs canonical career-ops.org A-F (apply-for-a-job §step-8 still names "Section G") | Coordinated parent commit |

That's it. **Single open item.**

## Closed since v1.27.0

| ID | Closed in | How verified |
|---|---|---|
| AI-assistant list drift (Cursor/Gemini/Copilot → Claude/Codex/OpenCode/Qwen) | v1.28.0 | all 8 help-bundles: `OpenCode=2, Qwen=2, legacy-triad=0` |
| `--max-retries N` UI surface (Issue #2) | v1.28.0 | `#/batch` 5th control + `tests/batch-max-retries.test.mjs` (7 cases) |
| Router 404 on `?query` hashes (▶ on `#/pipeline`, `#/config?tab=modes`) | v1.28.1 | `tests/router-query-string.test.mjs` (3 cases) |
| `HH_USER_AGENT` health-row noise | v1.28.1 | `tests/health-no-hh-user-agent-row.test.mjs` (2 cases) |
| RU sources limited to 2 (hh, habr) | v1.29.0 | 3 new adapters (Trudvsem / GetMatch / GeekJob) + registry + dynamic dropdown |
| Three-place source-list drift | v1.29.0 | `server/lib/sources/registry.mjs` is the single source of truth |
| User-facing RU-config docs gap | v1.29.1 | help §5 "Configuring Russian portals — detailed setup guide" × 8 locales + `tests/help-ru-config-section.test.mjs` (7 cases) |
| Multi-phase SSE close bug (RU phase silently dropped from `🌐 Scan`) | v1.29.2 | `tests/scan-stream-multi-phase.test.mjs` (11 cases incl. bug-forensics) |

## Cumulative closures since v1.10 baseline

**31 of 32 prior findings shipped across v1.15 → v1.29.2.** Only G-005 remains, intentionally deferred pending a coordinated parent commit.

## Folder layout

```text
qa/
├── README.md                          ← you are here
├── REGRESSION-v1.29.2.md              ← bottom-up regression spec (CURRENT — replaces v1.27/v1.29)
├── DOCS-COVERAGE-v1.29.md             ← top-down docs-driven coverage (CURRENT — replaces v1.28)
├── REGRESSION-v1.27.md                ← prior bottom-up spec (kept for diff)
├── DOCS-COVERAGE-v1.28.md             ← prior top-down spec (kept for diff)
├── v29-regression/                    ← live evidence on v1.29.x stand (run reports go here)
├── v28-regression/                    ← v1.28.x evidence
├── v27-regression/2026-05-14-REGRESSION.md   ← v1.27.0 live run (40 / 40 PASS)
├── v26-regression/2026-05-14-REGRESSION.md   ← v1.26.x evidence
├── v24-regression/                    ← historical v1.24.x evidence
├── docs-coverage-runs/                ← top-down live-run reports
└── archive/                           ← historical, do not act on
    ├── v1.10-fixes/                    (19 F-* + 5 scenarios + preflight)
    ├── v1.14-reports/                  (live v1.14 matrix + functional audit)
    ├── v1.15-fix-prompts/              (FIX-PROMPT-v15 × 3 + conformance audit)
    ├── v1.25-fix-prompts/              (FIX-PROMPT-v24.1 — all but G-005 shipped)
    └── v1.26-fix-prompts/              (FIX-PROMPT-v26.1 + REGRESSION-v1.26 superseded)
```

## How to use this folder

**For developers:**

Single open item is **G-005** (cross-repo). Context lives in `REGRESSION-v1.29.2.md §13`; full plan in `archive/v1.26-fix-prompts/FIX-PROMPT-v26.1-shipped.md → PR-B`. Requires a coordinated commit in parent `santifer/career-ops` to rewrite `modes/oferta.md` to A-F, then a web-ui commit to update §9 of help bundles + report-render strip-G logic.

**For QA running the next regression cycle:**

1. **Bottom-up regression** — `REGRESSION-v1.29.2.md`. Walk §0 → §14. Pre-flight (§0) gates everything else. Most sub-checks have a curl probe or JS snippet ready to paste. Save run report under `qa/v29-regression/<date>-REGRESSION.md`.
2. **Top-down docs coverage** — `DOCS-COVERAGE-v1.29.md`. Walk §1.A → §1.E feature matrix on every locale. Save run report under `qa/docs-coverage-runs/<date>-docs-vs-app.md`.
3. Both specs catch different things: bottom-up catches regressions in working code; top-down catches drift between what the docs say and what the SPA implements.

**For anyone reading the history:**

Everything in `archive/` is closed. Do not file new tickets for those IDs without first checking the source tree against the v1.29.2 implementation notes.
