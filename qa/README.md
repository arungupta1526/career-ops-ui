# QA artifacts — career-ops-ui

Tracks regressions, fix-prompts, and live evidence across releases.

## CURRENT (v1.27.0)

| File | Purpose |
|---|---|
| **[`REGRESSION-v1.27.md`](./REGRESSION-v1.27.md)** | Canonical full-project regression spec. Run on every release. 12 sections × ~210 sub-checks, plus §11 known-deferred list. |
| [`v27-regression/2026-05-14-REGRESSION.md`](./v27-regression/2026-05-14-REGRESSION.md) | Latest live run: **40 / 40 PASS** on v1.27.0. Sidebar dedupe + WCAG button heights + CHANGELOG parity all green. |
| [`v26-regression/2026-05-14-REGRESSION.md`](./v26-regression/2026-05-14-REGRESSION.md) | Previous live run on v1.26.0 (caught WCAG-2.5.5 button regression that v1.26.1 then closed). |
| [`v24-regression/01-LIVE-8-LOCALES-WORKFLOWS.md`](./v24-regression/01-LIVE-8-LOCALES-WORKFLOWS.md) | Historical: 8 locales × 5 docs workflows × every button/filter at v1.24.0. |

## Open backlog (single item)

Per `REGRESSION-v1.27.md` §11:

| ID | Severity | Title | Target |
|---|---|---|---|
| G-005 | Minor (docs / cross-repo) | Report blocks A-G (`C=Risks, F=Verdict, G=Legitimacy`) vs canonical career-ops.org A-F (`C=Strategy, F=STAR`, no Legitimacy) | future release · requires coordinated parent commit |

That's it. Everything else from the v1.10 → v1.27 backlog is shipped.

## Closed across v1.15 → v1.27 (consolidated)

**25 of 26 prior findings shipped:**

- v1.15.0 — G-006 Legitimacy column, G-007 auto-pipeline, G-008 modes/_profile.md editor, G-009 canonical profile schema, G-011 sidebar + `#/batch` SPA
- v1.17.0 — legacy `#/batch-prompt` deprecation banner
- v1.18.0 — F-018 / G-004 (scan-en + scan-ru aliases retired) + WCAG 2.2 AA baseline
- v1.19.0 — F-013 HH_USER_AGENT removed + contrast
- v1.20.0 — per-component a11y (`.chip` / `.nav-item` / `.tab-btn`) + `/api/scan-ru/config` retired
- v1.21.0 — security + concurrency: B-1 (DNS-rebind TOCTOU), H-4 (path-traversal), H-5 (LLM rate-limit), H-6 (file-lock)
- v1.22.0 — M/L/N backlog clearout (entity-aware strip, redundant glyphs, parseInt radix, etc.)
- v1.23.0 — i18n.js split, connection-banner recovery
- v1.24.0 — help-bundle content depth × 8 locales
- **v1.24.1 — G-015 `/#/config` hot-fix**
- **v1.25.0 — G-014 auto-pipeline manual flag + G-012 CHANGELOG parity + cosmetic ✨ dedup**
- **v1.26.0 — test pyramid (TESTING.md, tests/acceptance/, CI gates)**
- **v1.26.1 — WCAG 2.5.5 button-height hot-fix**
- **v1.27.0 — sidebar dedupe (`#/dashboard`) + README.cn.md → README.zh-CN.md**

## Folder layout

```
qa/
├── README.md                        ← you are here
├── REGRESSION-v1.27.md              ← canonical regression spec (run on every release)
├── v27-regression/                  ← live evidence on v1.27.x
│   └── 2026-05-14-REGRESSION.md
├── v26-regression/                  ← previous-release evidence (kept for transition)
│   └── 2026-05-14-REGRESSION.md
├── v24-regression/                  ← historical v1.24.x evidence
│   ├── 00-v24-REGRESSION.md
│   ├── 01-LIVE-8-LOCALES-WORKFLOWS.md
│   └── G-015-config-also-not-function.md
└── archive/                         ← historical, do not act on
    ├── v1.10-fixes/                  (19 F-* + 5 scenario reports + preflight)
    ├── v1.14-reports/                (live v1.14 matrix + functional audit)
    ├── v1.15-fix-prompts/            (FIX-PROMPT-v15 in 3 forms + conformance audit)
    ├── v1.25-fix-prompts/            (FIX-PROMPT-v24.1 — all but 3 items shipped in v1.24.1/v1.25.0)
    └── v1.26-fix-prompts/            (FIX-PROMPT-v26.1 shipped; superseded REGRESSION-v1.26.md)
```

## How to use this folder

**For developers:**

Read `REGRESSION-v1.27.md` §11 "Known deferred" — that's the open backlog (currently just G-005). Every other check in §1-§10 is an invariant gate against regressions, NOT new work.

**For QA running the next regression:**

1. Open `REGRESSION-v1.27.md`.
2. Pre-flight: `curl -fsS http://127.0.0.1:4317/api/health` returns `ok:true, version:1.27.x`.
3. Walk §1 → §11. Most sub-checks have a curl probe or JS snippet ready to paste.
4. Save the run report under `qa/v27-regression/<run-date>-REGRESSION.md` mirroring today's shape.

**For anyone reading the history:**

Everything in `archive/` is closed. Do not file new tickets for those IDs without first checking the source tree against the v1.27.0 implementation notes.

