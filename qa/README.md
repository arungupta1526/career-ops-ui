# QA artifacts — career-ops-ui

Tracks regressions, fix-prompts, and live evidence across releases.

## CURRENT (v1.54.0 — FINAL, post P-31 WS0–WS10)

**One authoritative spec.** [`REGRESSION-v1.54.md`](./REGRESSION-v1.54.md)
fuses the bottom-up (regressions in working code) and top-down (drift
vs the 5 canonical career-ops.org/docs guides) perspectives into a
single runnable end-to-end QA progress prompt. Run §0→§9 on every
release; §0 gates the rest. Save run reports under
`qa/v54-regression/<date>-REGRESSION.md`.

It supersedes the prior split specs (`REGRESSION-v1.29.2.md` +
`DOCS-COVERAGE-v1.29.md`), which stay for historical diff only.

| File | Status | Purpose |
|---|---|---|
| **[`REGRESSION-v1.54.md`](./REGRESSION-v1.54.md)** | **CURRENT** | End-to-end regression + canonical conformance. Pre-flight, 17 routes, the 40 WS2 a11y invariants, 8-locale parity, security envelope, SSE, CLI/shell surface, canonical-docs map, parent-sync, backlog. |
| [`REGRESSION-v1.29.2.md`](./REGRESSION-v1.29.2.md) | Historical | Prior bottom-up spec (baseline v1.6.0→v1.29.2). Diff-only. |
| [`DOCS-COVERAGE-v1.29.md`](./DOCS-COVERAGE-v1.29.md) | Historical | Prior top-down docs-coverage. Diff-only. |
| `REGRESSION-v1.27.md`, `DOCS-COVERAGE-v1.28.md` | Historical | Older frozen specs. |
| `v{14,24,26,27,28,29}-regression/`, `docs-coverage-runs/` | Historical | Live-run evidence per past cycle. Read-only. |

## P-31 program — shipped (v1.31 → v1.54)

The senior-UX + parent-sync + test-pyramid program ran as one
fix-per-release loop, every release CI-green, each through pre-commit
AI-review to LGTM:

| Workstream | Releases | Outcome |
|---|---|---|
| WS0 parent-sync | v1.31 | batch `--model`/`--start-from` parity |
| WS1 #/config field-forms | v1.32 | per-field profile/config editors, merge-not-replace invariant |
| WS4 parity · WS5 #/auto · WS6 settings-decomposition · WS7 pre-commit AI-review · WS8 CLI (setup/init/doctor/run/open + provider selector) | v1.33–1.40 | feature parity + bootstrap |
| **WS2 senior UX-audit** | **v1.41–v1.52** | **40 findings (HIGH→LOW) all fixed**, one ship each, every screen Playwright-verified — see `REGRESSION-v1.54.md §2` |
| WS9 test pyramid | v1.53 | shell-surface tests (`bin/*.sh` + `.githooks`); 717 `node --test` + 4 E2E + TESTING.md |
| WS10 canonical re-validation | v1.54 | help-bundle H3-parity closed (all 8 → 17 H2 / 70 H3) + gate; `docs/sdd/` refreshed |

## Open backlog

| ID | Severity | Title | Target |
|---|---|---|---|
| G-005 | Minor (cross-repo) | `oferta.md` report blocks A-G vs canonical career-ops.org A-F | coordinated `santifer/career-ops` commit |

**Single open item**, unchanged since v1.27 — intentionally deferred
(needs the parent repo to rewrite `modes/oferta.md` to A-F first, then a
web-ui commit to update help §9 + the report-render strip-G logic). All
other findings — 31 from the v1.10 baseline + 40 from the WS2 UX-audit —
are shipped and each regression-locked by a `tests/*.test.mjs`.

## Folder layout

```text
qa/
├── README.md                 ← you are here
├── REGRESSION-v1.54.md       ← CURRENT end-to-end spec (run this)
├── REGRESSION-v1.29.2.md     ← prior bottom-up (historical, diff-only)
├── DOCS-COVERAGE-v1.29.md    ← prior top-down (historical, diff-only)
├── REGRESSION-v1.27.md · DOCS-COVERAGE-v1.28.md   ← older frozen
├── v54-regression/           ← NEW: live run reports for the current spec
├── v{14,24,26,27,28,29}-regression/   ← historical evidence (read-only)
├── docs-coverage-runs/       ← historical top-down run reports
├── conformance-vs-docs/ · functional-vs-docs/   ← reserved for new runs
└── archive/                  ← closed; do not act on without checking HEAD
    ├── v1.10-fixes/ · v1.14-reports/ · v1.15-fix-prompts/
    └── v1.25-fix-prompts/ · v1.26-fix-prompts/
```

## How to use this folder

**Running the next regression cycle:** walk
[`REGRESSION-v1.54.md`](./REGRESSION-v1.54.md) §0→§9. §0 (`npm run
test:ci` + e2e + sh-files + doctor) gates everything. §2 is the WS2
a11y matrix — every row has a static test plus a live spot-check. Save
the report under `qa/v54-regression/<YYYY-MM-DD>-REGRESSION.md`.

**Filing a finding:** one finding = one fix-ship (bump + CHANGELOG ×8 +
test + Playwright-verify + pre-commit AI-review to LGTM). Never batch
unrelated fixes; never `--no-verify`.

**Reading history:** everything in `archive/` and the `v{14..29}-`
dirs is closed/historical. Check the source tree against the v1.54
implementation before re-filing any old ID.
