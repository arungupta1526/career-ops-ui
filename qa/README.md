# QA artifacts — career-ops-ui

Tracks regressions, fix-prompts, and live evidence across releases.

## CURRENT (v1.26.0)

| File | Purpose |
|---|---|
| **[`REGRESSION-v1.26.md`](./REGRESSION-v1.26.md)** | Canonical full-project regression spec. Run this on every release. 11 sections × ~210 sub-checks. |
| **[`FIX-PROMPT-v26.1.md`](./FIX-PROMPT-v26.1.md)** | **▶ Hand to dev.** Current open findings packaged as 1 hot-fix PR + 3 next-release PRs. |
| [`v26-regression/2026-05-14-REGRESSION.md`](./v26-regression/2026-05-14-REGRESSION.md) | Latest live run: 209/210 PASS, one WCAG 2.5.5 button-height regression filed. |
| [`v24-regression/01-LIVE-8-LOCALES-WORKFLOWS.md`](./v24-regression/01-LIVE-8-LOCALES-WORKFLOWS.md) | Previous live evidence (8 locales × 5 docs workflows × every button/filter). Historical context for the v1.24.0 → v1.26.0 transition. |
| [`v24-regression/G-015-config-also-not-function.md`](./v24-regression/G-015-config-also-not-function.md) | Standalone fix doc for G-015. Closed in v1.24.1 — kept for traceability. |
| [`v24-regression/00-v24-REGRESSION.md`](./v24-regression/00-v24-REGRESSION.md) | Source-level audit at v1.24.0. Historical. |

## Open findings at v1.26.0

| ID | Severity | Title | Target |
|---|---|---|---|
| **F-1 / WCAG-2.5.5-btn-height** | **HIGH** | 5 header `.btn:not(.btn-sm)` at 39-41 px (WCAG 2.5.5 violation) | **v1.26.1** hot-fix |
| G-005 | Minor (docs) | Report blocks A-G vs canonical A-F | v1.27.0 |
| G-003 | Minor (cosmetic) | `README.cn.md` → `README.zh-CN.md` | v1.27.0 |
| sidebar `#/dashboard` × 2 | Trivial | brand logo + nav item both link `#/dashboard` | nice-to-have |

Everything actionable is in `FIX-PROMPT-v26.1.md`.

## Closed (consolidated, see `archive/` for details)

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
- **v1.24.1 — G-015 `/#/config` hot-fix** (verified live after cache-bust)
- **v1.25.0 — G-014 auto-pipeline manual + G-012 CHANGELOG parity + cosmetic ✨**
- **v1.26.0 — test pyramid (TESTING.md, tests/acceptance/, CI gates)**

## Folder layout

```
qa/
├── README.md                        ← you are here
├── REGRESSION-v1.26.md              ← canonical regression spec (run on every release)
├── FIX-PROMPT-v26.1.md              ← current open backlog (1 HIGH + 2 Minor + 1 trivial)
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

1. Read `FIX-PROMPT-v26.1.md` end to end.
2. Ship **PR-A** as **v1.26.1 hot-fix** today (CSS-only, ~10 lines, zero behavioural risk; restores WCAG 2.5.5 button heights).
3. Bundle PR-B (A-F realignment, coordinated parent commit) + PR-C (README rename) into v1.27.0.
4. PR-D (sidebar `#/dashboard` dedup) is nice-to-have, no urgency.
5. After each merge run `npm test && npm run test:ci && npm run test:e2e:full`.

**For QA running the next regression:**

1. Open `REGRESSION-v1.26.md`.
2. Pre-flight check: `curl -fsS http://127.0.0.1:4317/api/health` returns `ok:true, version:1.26.x`.
3. Walk sections 1 → 11. Most sub-checks have either a curl probe or a JS snippet ready to paste.
4. Save the run report under `qa/v26-regression/<run-date>-REGRESSION.md`, mirroring today's report shape.

**For anyone reading the history:**

Everything in `archive/` is closed. Do not file new tickets for those IDs without first checking the source tree against the v1.26.0 implementation notes.

