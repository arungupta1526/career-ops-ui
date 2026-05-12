# 07 — Scan

## Goal

User opens `#/scan`, picks a source (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday / hh.ru / Habr Career), optionally filters by company, clicks **Run**. The server streams SSE events as adapters work, hits are added to a results table, and the user can filter / paginate the results.

## Source surface (v1.10.x)

The current implementation still uses two SSE endpoints:

- `GET /api/stream/scan-en` — Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday adapters via `server/lib/en-scanner.mjs`.
- `GET /api/stream/scan-ru` — hh.ru + Habr Career via `server/lib/ru-scanner.mjs`.
- `GET /api/stream/scan` — proxies to the parent's `scan.mjs` for the kitchen-sink case.

> **Roadmap note.** PR-1 of `qa/FIX-PROMPT.md` consolidates both into one locale-agnostic `GET /api/stream/scan?source=<id>` over an adapter registry. Not yet shipped; that work needs its own phase. This scenario documents the v1.10.x behavior only.

## Inputs

| Query | Meaning |
|---|---|
| `company=<name>` | Restrict to a single tracked company |
| `dryRun=1` | Skip writing the result to `data/scan-history.tsv` |
| `format=letter` | (Parent `scan.mjs` only) — N/A for in-process scanners |

## SSE events

```
event: start    { script, args }
event: log      { stream: "stdout"|"stderr", line }
event: hit      { company, role, url, source }   # per-vacancy
event: done     { code: 0, hits: <int> }
event: error    { message }
```

## Expected outputs

- New hits appended to `data/scan-history.tsv` (unless `dryRun=1`).
- `GET /api/scan-results` (or the legacy `{en, ru}` shape per route) returns the latest unique hits, sorted newest-first.
- Filters in the SPA table:
  - **Company** dropdown — built from `tracked_companies` in `portals.yml`. Should auto-populate when portals.yml changes (live reload via `GET /api/portals` on view mount).
  - **Source** chip — Greenhouse / Ashby / Lever / hh.ru / Habr / Workable / SmartRecruiters / Workday.
  - **Search** — substring match over role + company.
  - **Score** — numeric range, but only populated when the user evaluates a hit first.

## Negative cases

| Case | Expected |
|---|---|
| Portals.yml empty | Empty company dropdown; "Run" still works against scanner defaults |
| Network failure on one adapter | `event: log { stream: "stderr", line: "<adapter>: <error>" }`; other adapters keep running |
| Client disconnect | Runner SIGTERMs the child (REVIEW-A2) |

## Test coverage

- `tests/en-scanner.test.mjs`, `tests/ru-scanner.test.mjs` — adapter-level fixture replay.
- `tests/portals-bootstrap.test.mjs` — `portals.yml` template parses cleanly.
- `tests/portals-dead.test.mjs` — known-dead slugs stay `enabled: false`.
- `tests/critical-fixes.test.mjs` — full-funnel covers a stubbed scan run.

## Known limitations (recorded for future scope)

- Scan filters are static lists today, not driven by the actual hit corpus. PR-10 of FIX-PROMPT covers dynamic filter rebuilding from `bySource` aggregation.
- Performance with 10k+ hits is untested; current ceiling is empirical-only.
