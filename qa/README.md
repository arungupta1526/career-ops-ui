# career-ops-ui v1.10.0 — QA Regression Run

**Started:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**Stand:** http://127.0.0.1:4317/ (local Mac)
**Browser:** Claude in Chrome (Browser 1, macOS)
**Scope:** 16 scenarios × 8 locales (ru, en, es, pt-BR, ko-KR, ja, zh-CN, zh-TW)

## Layout

- `fixes/` — one .md per finding with reproducible repro + suggested patch
- `screenshots/` — raw evidence, named `<NN>-<scenario>-<step>-<locale>.png`
- `logs/` — console errors, network failures, raw API responses
- `reports/` — final per-locale and combined summary tables

## Status legend

- PASS — all assertions matched
- FAIL — produced output but assertion failed (gets a fix file)
- SKIP — unmet prerequisite (Playwright/pandoc/api-key etc.)
- BLOCKER — environment broke; halts that locale
