# QA artifacts — career-ops-ui

Tracks regressions, fix-prompts, and live evidence across releases.

## CURRENT (v1.27.0)

| File | Purpose |
|---|---|
| **[`REGRESSION-v1.27.md`](./REGRESSION-v1.27.md)** | Canonical full-project regression spec. Run this on every release. 12 sections × ~220 sub-checks. |
| [`REGRESSION-v1.26.md`](./REGRESSION-v1.26.md) | Prior regression spec (v1.26.x). Kept for diff-only re-runs against shipped findings. |
| [`FIX-PROMPT-v26.1.md`](./FIX-PROMPT-v26.1.md) | Historical fix-prompt — every actionable item shipped in v1.26.1 / v1.27.0. Only G-005 remains, now tracked in `REGRESSION-v1.27.md §11`. |
| [`v26-regression/2026-05-14-REGRESSION.md`](./v26-regression/2026-05-14-REGRESSION.md) | Live run on the v1.26.0 stand: 209/210 PASS, identified WCAG 2.5.5 hot-fix landed in v1.26.1. |
| [`v24-regression/01-LIVE-8-LOCALES-WORKFLOWS.md`](./v24-regression/01-LIVE-8-LOCALES-WORKFLOWS.md) | Earlier live evidence (8 locales × 5 docs workflows × every button/filter). Historical context for v1.24.x. |

## Open findings at v1.27.0

| ID | Severity | Title | Target |
|---|---|---|---|
| G-005 | Minor (docs / cross-repo) | Report blocks A-G vs canonical career-ops.org A-F | Future release — needs coordinated parent commit |

That is **the only** remaining backlog item. Full detail in `REGRESSION-v1.27.md §11`.

## Closed since v1.26.0

| ID | Closed in | Verification |
|---|---|---|
| WCAG-2.5.5-btn-height (5 header `.btn` at 39-41 px) | v1.26.1 | `tests/wcag-target-size.test.mjs` (4 canaries) + live Playwright measurement on 13 routes |
| Sidebar dup `#/dashboard` × 2 | v1.27.0 | Static HTML has exactly one `href="#/dashboard"`; brand block is `<div class="logo">` |
| G-003 `README.cn.md` → `README.zh-CN.md` | already shipped (verified during v1.26.1 cycle) | `ls README*.md` → 8 files at canonical names |

## Closed earlier (consolidated, see `archive/` for details)

**24 of 26 prior findings closed across v1.15 → v1.26:**

- v1.15.0 — G-006 (Legitimacy column), G-007 (auto-pipeline button + endpoint), G-008 (modes/_profile.md editor), G-009 (canonical profile schema), G-011 (sidebar dedup + `#/batch` → TSV SPA)
- v1.17.0 — legacy `#/batch-prompt` deprecation banner
- v1.18.0 — F-018 / G-004 (scan-en + scan-ru aliases retired)
- v1.19.0 — F-013 (HH_USER_AGENT removed)
- v1.20.0 — WCAG 2.5.5 / 2.5.8 / 1.3.1 / 3.3.2 polish, `/api/scan-ru/config` retired
- v1.21.0 — B-1 / H-4 / H-5 / H-6 security pass
- v1.22.0 — M/L/N backlog clearout (entity-aware XSS strip, redundant glyphs, etc.)
- v1.23.0 — i18n.js split, connection-banner recovery
- v1.24.0 — help-bundle content depth × 8 locales
- v1.24.1 — G-015 `/#/config` hot-fix (verified live after cache-bust)
- v1.25.0 — G-014 auto-pipeline manual + G-012 CHANGELOG parity + cosmetic ✨
- v1.26.0 — test pyramid (TESTING.md, tests/acceptance/, CI gates)
- v1.26.1 — WCAG 2.5.5 header `.btn` 44 px floor restored
- v1.27.0 — sidebar `#/dashboard` dedupe (brand block now `<div>`)

## Folder layout

```text
qa/
├── README.md                        ← you are here
├── REGRESSION-v1.27.md              ← canonical regression spec (run on every release)
├── REGRESSION-v1.26.md              ← prior spec, kept for diff re-runs
├── FIX-PROMPT-v26.1.md              ← historical fix-prompt (all but G-005 shipped)
├── v26-regression/                  ← live run reports for v1.26.x
│   └── 2026-05-14-REGRESSION.md
├── v24-regression/                  ← live run reports for v1.24.x (kept for transition context)
│   ├── 00-v24-REGRESSION.md
│   ├── 01-LIVE-8-LOCALES-WORKFLOWS.md
│   └── G-015-config-also-not-function.md
└── archive/                         ← historical, do not act on
    ├── v1.10-fixes/                  (19 F-* + 5 scenario reports + preflight log)
    ├── v1.14-reports/                (live matrix from v1.14.0 stand)
    ├── v1.15-fix-prompts/            (FIX-PROMPT-v15 in 3 forms + conformance audit)
    └── v1.25-fix-prompts/            (FIX-PROMPT-v24.1 — all but 3 items shipped in v1.24.1/v1.25.0)
```

## How to use this folder

**For developers picking up the next sprint:**

1. Skim `REGRESSION-v1.27.md §11` — only G-005 is open, and it needs a coordinated parent-project commit.
2. After every code change, re-run `npm test && npm run test:ci`. The 2 CI gates (`check-no-also-leftovers` + `check-changelog-parity`) catch the two most common shipping regressions automatically.
3. Use `REGRESSION-v1.27.md` as the contract: any new behaviour goes into the appropriate per-page or per-API block; any new release adds a row in §8.

**For QA running the next regression:**

1. Open `REGRESSION-v1.27.md`.
2. Pre-flight check: `curl -fsS http://127.0.0.1:4317/api/health` returns `ok:true, version:1.27.x` and the static HTML has exactly one `href="#/dashboard"`.
3. Walk sections 1 → 11. Most sub-checks have either a curl probe or a JS snippet ready to paste.
4. Save the run report under `qa/v27-regression/<run-date>-REGRESSION.md`, mirroring the v1.26 report shape.

**For anyone reading the history:**

Everything in `archive/` is closed. Do not file new tickets for those IDs without first checking the source tree against the v1.27.0 implementation notes.
