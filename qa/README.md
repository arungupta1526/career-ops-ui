# QA artifacts — career-ops-ui

This folder hosts QA findings, fix-prompts, and live regression reports across releases.

## CURRENT (v1.24.0 → v1.24.1 / v1.25.0)

| File | What |
|---|---|
| **[`FIX-PROMPT-v24.1.md`](./FIX-PROMPT-v24.1.md)** | **▶ Hand this to dev.** Single canonical fix-prompt with 6 PRs for the open findings at v1.24.0. PR-A is the v1.24.1 hot-fix (G-015 BLOCKER); PR-B..F bundle into v1.25.0. |
| [`v24-regression/01-LIVE-8-LOCALES-WORKFLOWS.md`](./v24-regression/01-LIVE-8-LOCALES-WORKFLOWS.md) | Live evidence matrix: 5 docs workflows × 8 locales, every button/filter/control verified through Chrome at v1.24.0. |
| [`v24-regression/00-v24-REGRESSION.md`](./v24-regression/00-v24-REGRESSION.md) | Source-level regression report for scenarios 24-31 (auto-pipeline / WCAG / contrast / a11y / DNS-rebind / path-traversal / rate-limit / docs alignment). |
| [`v24-regression/G-015-config-also-not-function.md`](./v24-regression/G-015-config-also-not-function.md) | Standalone finding doc for the v1.24.1 blocker with drop-in patch + CI gate. |

## Open findings at v1.24.0

| ID | Severity | Title | Target release |
|---|---|---|---|
| **G-015** | **🚨 BLOCKER** | `/#/config` crash on all 8 locales — `c(...).also is not a function` | **v1.24.1** |
| G-014 | Minor (DoS-risk) | `/api/auto-pipeline` ignores `mode: 'manual'` | v1.25.0 |
| G-012 | Minor (docs) | CHANGELOG parity drift — 7 non-EN locales lag 1-2 releases | v1.25.0 |
| G-005 | Minor (docs) | Block A-G in our reports vs canonical A-F at career-ops.org/docs | v1.25.0 (coordinated parent commit) |
| G-003 | Minor (cosmetic) | `README.cn.md` → `README.zh-CN.md` | v1.25.0 |
| Cosmetic | Trivial | Dashboard auto-pipeline button shows double `✨` glyph | v1.25.0 |

Everything in `FIX-PROMPT-v24.1.md`. PR-A is hot-fix-ready (4-line change in `config.js`, mirrors a pattern that's already proven in `cv.js:189`).

## Closed findings (history → `archive/`)

**17 of 19 F-* findings + 8 of 11 G-* findings closed across v1.15-v1.24:**

- v1.15.0 → G-006 (Legitimacy column), G-007 (auto-pipeline button + endpoint), G-008 (modes/_profile.md editor), G-009 (canonical profile schema), G-011 (sidebar dedup + #/batch → TSV SPA)
- v1.17.0 → legacy `#/batch-prompt` deprecation banner
- v1.18.0 → F-018 / G-004 (scan-en + scan-ru aliases retired)
- v1.19.0 → F-013 (HH_USER_AGENT removed from UI)
- v1.20.0 → WCAG 2.5.5 / 2.5.8 / 1.3.1 / 3.3.2 polish
- v1.21.0 → B-1 (DNS-rebind TOCTOU), H-4 (path-traversal), H-5 (LLM rate-limit), H-6 (file-lock)
- earlier passes → F-001 to F-019

Detailed history in `archive/v1.10-fixes/` (19 individual finding files) and `archive/v1.15-fix-prompts/` (the original FIX-PROMPT-v15 + conformance report).

## Folder layout

```
qa/
├── README.md                        ← you are here
├── FIX-PROMPT-v24.1.md              ← CURRENT canonical hand-off doc
├── v24-regression/                  ← live evidence for v1.24.0
│   ├── 00-v24-REGRESSION.md
│   ├── 01-LIVE-8-LOCALES-WORKFLOWS.md
│   └── G-015-config-also-not-function.md
└── archive/                         ← historical artifacts, do not act on
    ├── v1.10-fixes/                  (19 F-* findings + 5 scenario reports)
    ├── v1.14-reports/                (live matrix from v1.14.0 stand)
    └── v1.15-fix-prompts/            (original FIX-PROMPT-v15 + conformance audit)
```

## How to use this folder

**For developers picking up the next sprint:**

1. Read `FIX-PROMPT-v24.1.md` end to end.
2. Ship PR-A as **v1.24.1 hot-fix** today (one file, four lines, zero behavioural risk).
3. Bundle PR-B through PR-F into the next regular release (v1.25.0).
4. After each merge run `npm test && npm run test:e2e:full` plus the CI gates defined in the fix-prompt.

**For QA running the next regression:**

1. The base regression spec lives at `docs/test-scenarios/` in the repo (not here). The version-locked spec for v1.24 was committed alongside this work.
2. The previous live matrix at `v24-regression/01-LIVE-8-LOCALES-WORKFLOWS.md` is the baseline to diff against on the next release — expect every ✅ to stay ✅, plus the open ❌ rows to flip to ✅ as PRs land.

**For anyone reading the history:**

Everything in `archive/` is closed. Do not file new tickets for those IDs without first checking the source tree against the v1.24.0 implementation notes.
