# career-ops-ui — Quick Agent Context

> **Purpose.** Single-file orientation for AI agents and IDE assistants
> joining a session. The canonical project rules live in
> [`../CLAUDE.md`](../CLAUDE.md). This file is the compressed version
> a fresh agent should read first.
>
> **Audience.** Claude Code subagents, Cursor / Codex / Aider sessions,
> any IDE assistant that doesn't auto-load CLAUDE.md.
>
> **Repo state.** v1.56.0 (2026-05-19). 813 `node --test` cases across
> 110 files, 32 Playwright smoke,
> the v1.55.1→v1.56.0 consolidated UX fix-prompt complete (all 12 UX
> findings + F-V55-E/F-V55-H shipped one-per-release, AI-reviewer
> rebuilt to run on push→main, docs/ + qa/ actualized). Sole open
> item: G-005 (cross-repo, blocked on the parent oferta.md commit).

---

## What this repo is

`career-ops-ui` is an Express + vanilla-JS SPA that puts a polished
web interface on top of
[`santifer/career-ops`](https://github.com/santifer/career-ops) —
a Claude-Code-driven AI job-search pipeline. It sits inside the
parent project as `career-ops/web-ui/` and reads/writes the same
data files (`cv.md`, `data/applications.md`, `reports/`,
`portals.yml`).

**Single-tenant, loopback-by-default, no telemetry, no cloud accounts.**

---

## Stack snapshot

| Layer | Tech | Where |
|---|---|---|
| Server | Node ≥ 18, Express 4, js-yaml, multer | `server/index.mjs` (~130-LOC orchestrator) + `server/lib/routes/*.mjs` (14 modules) |
| Helpers (v1.21+) | ESM, no transpiler | `server/lib/{paths,parsers,runner,security,prompts,store,anthropic,env-config,activity-log,dotenv,safe-fetch,file-lock,rate-limit,en-scanner,ru-scanner}.mjs` + `server/lib/sources/{greenhouse,ashby,lever,workable,smartrecruiters,workday,hh,habr}.mjs` |
| SPA | Vanilla JS, hash-router | `public/index.html`, `public/js/{app,router,api}.js`, `public/js/views/*.js`, `public/js/lib/{i18n,skills,auto-pipeline,pdf-generate}.js` |
| Styling | Hand-written CSS + design tokens | `public/css/app.css` |
| Tests | `node --test` (TAP) + Playwright | `tests/*.test.mjs`, `tests/playwright-smoke.mjs`, `tests/e2e*.mjs` |
| Build | None | Files served as-is from `public/` |
| CI | GitHub Actions, Node 18/20/22 | `.github/workflows/{ci,release,publish-package,ai-review,dashboard-screenshots}.yml` |

**Test baseline (v1.56.0):** 813/813 unit · 32/32 Playwright · 20/20 smoke E2E · 23/23 comprehensive E2E.

---

## Hard rules (full text in `CLAUDE.md`)

1. **Never edit anything outside `web-ui/`.** Parent career-ops is read-only from this repo.
2. **Never load real user data into context.** `.aiignore` exists.
3. **Never weaken security headers.** CSP excludes `'unsafe-inline'`.
4. **Never bypass `isValidJobUrl`** for URL-fetching endpoints. v1.21+ also requires routing through `server/lib/safe-fetch.mjs::safeGet` for the actual fetch (DNS-rebind defense).
5. **Never sanitize CV markdown outside `stripDangerousMarkdown`.** Entity-aware as of v1.22.0.
6. **Never commit `.env`.** Use `.env.example` placeholders.
7. **Never use `--no-verify` / `--force` / `git reset --hard`** without explicit user approval.
8. **Tests must be CI-isolated.** No parent dependency, no live network, no port collision (`server.listen(0)`).

---

## v1.21–v1.22 security envelope (added since last big update)

When auditing or extending these surfaces, route through the helpers below — don't reinvent.

| Surface | Helper | Lives in |
|---|---|---|
| URL validation (input gate) | `isValidJobUrl(s)` | `server/lib/security.mjs` |
| Outbound GET (DNS-pinned, redirect-revalidated) | `safeGet(url, opts)` | `server/lib/safe-fetch.mjs` |
| `:name` / `:slug` route-param sanitization | `sanitizePathName(s)` | `server/lib/security.mjs` |
| CV markdown XSS strip (entity-aware) | `stripDangerousMarkdown(s)` | `server/lib/security.mjs` |
| LLM endpoint throttle (LAN deploys only) | `llmRateLimit` middleware | `server/lib/rate-limit.mjs` |
| Concurrent-write mutex on parent files | `withFileLock(path, fn)` | `server/lib/file-lock.mjs` |
| i18n key coverage (CI canary) | `tests/i18n-coverage.test.mjs` | (test-time) |
| a11y form-wire validity (CI canary) | `tests/a11y-form-wires.test.mjs` | (test-time) |

---

## SPA invariants

- **No build step.** Add a script via `<script src>` in `public/index.html`; the file ships as-is.
- **No inline event handlers.** CSP blocks them. Use `addEventListener` via the `on*` branch of `UI.el()`.
- **All markdown rendering** goes through `UI.md(text)` (in `public/js/api.js`). It escape-firsts. Don't bypass with raw `innerHTML`.
- **All i18n** goes through `t('key', 'EN fallback')`. The fallback is for development; missing-from-DICT keys fail the `i18n-coverage` test in CI.
- **a11y form wires.** Every `<input>` / `<textarea>` / `<select>` needs either a `<label htmlFor="…">` or an `aria-label`. Every `aria-describedby` must point at an existing `id`. The `a11y-form-wires` test enforces both.
- **`UI.el()`** accepts `htmlFor` as a React-style alias for the `for` attribute (v1.20.0+, null-guarded v1.22.0+).

---

## Project tree (top three levels)

```
career-ops-ui/
├─ AGENTS.md, CLAUDE.md, GEMINI.md            # agent shims (CLAUDE.md is canonical)
├─ CHANGELOG.{,es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md
├─ README.{,es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md
├─ LICENSE, package.json, package-lock.json
├─ bin/
│  ├─ start.sh                                  # one-shot launcher
│  ├─ setup.sh                                  # bootstrap (clones career-ops + web-ui)
│  └─ run_all.sh                                # every test surface in one go
├─ server/
│  ├─ index.mjs                                 # orchestrator: middleware + 14 register*Routes(app)
│  └─ lib/
│     ├─ paths.mjs, parsers.mjs, runner.mjs
│     ├─ security.mjs                          # isValidJobUrl, sanitizePathName, stripDangerousMarkdown, …
│     ├─ safe-fetch.mjs                        # v1.21.0 (B-1) DNS-pinned safeGet
│     ├─ file-lock.mjs                         # v1.21.0 (H-6) withFileLock
│     ├─ rate-limit.mjs                        # v1.21.0 (H-5) llmRateLimit
│     ├─ prompts.mjs, store.mjs, anthropic.mjs
│     ├─ env-config.mjs, activity-log.mjs, dotenv.mjs
│     ├─ en-scanner.mjs, ru-scanner.mjs
│     ├─ sources/                              # 8 ATS adapter clients
│     ├─ portals/                              # adapter registry + resolveAdapter()
│     └─ routes/                               # 14 route modules — one per topic
├─ public/
│  ├─ index.html                               # CSP-locked shell
│  ├─ css/app.css                              # design tokens, WCAG 2.2 AA + 1.4.1 redundant cues
│  └─ js/{app,router,api}.js + js/lib/* + js/views/*
├─ tests/
│  ├─ *.test.mjs                               # 813 unit + integration
│  ├─ playwright-{smoke,full-cycle}.mjs        # 32 browser flows
│  ├─ e2e{,-comprehensive}.mjs                 # 43 E2E
│  └─ fixtures/                                # CI-isolated test data
├─ docs/
│  ├─ PROJECT.md, ROADMAP.md, PRODUCTION-READINESS.md, portals-examples.md
│  ├─ sdd/{SDD-GUIDE,CONVENTIONS}.md
│  ├─ architecture/{OVERVIEW,SERVER,FRONTEND,API,DATA-FLOWS}.md
│  ├─ reviews/REVIEW-*.md                      # per-release code reviews
│  ├─ specs/V1.20.1-BACKLOG.md                 # last sprint backlog (closed)
│  ├─ help/{en,es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md   # 16-section help bundles
│  └─ adr/                                     # architecture decision records
├─ .claude/
│  ├─ settings.json
│  ├─ PROJECT-CONTEXT.md                       # this file
│  ├─ agents/                                  # 3 project-specific subagents
│  └─ commands/                                # slash-command stubs
├─ .github/
│  ├─ workflows/                               # 5 CI workflows
│  └─ copilot-instructions.md                  # GitHub Copilot canonical entry point
├─ qa/
│  └─ claude-cowork-browser-test-prompt.md     # E2E manual + automated prompt
└─ .planning/                                   # GSD scratch (gitignored)
```

---

## How to navigate

| Question | Read this |
|---|---|
| High-level project goal | [`../docs/PROJECT.md`](../docs/PROJECT.md) |
| Server architecture | [`../docs/architecture/SERVER.md`](../docs/architecture/SERVER.md) |
| Every endpoint + payload | [`../docs/architecture/API.md`](../docs/architecture/API.md) |
| Data flows in/out of parent files | [`../docs/architecture/DATA-FLOWS.md`](../docs/architecture/DATA-FLOWS.md) |
| Last shipped release | [`../docs/reviews/REVIEW-2026-05-14-v1.21.0.md`](../docs/reviews/REVIEW-2026-05-14-v1.21.0.md) |
| Deferred work | [`../docs/PRODUCTION-READINESS.md`](../docs/PRODUCTION-READINESS.md) |
| Spec-driven workflow | [`../docs/sdd/SDD-GUIDE.md`](../docs/sdd/SDD-GUIDE.md) |
| Coding conventions | [`../docs/sdd/CONVENTIONS.md`](../docs/sdd/CONVENTIONS.md) |

---

## Standard agent loop (for non-trivial work)

```
1. gsd-explore           → research what exists / what's needed
2. gsd-plan-phase        → docs/specs/V<X.Y.Z>-BACKLOG.md or .planning/ artifact
3. gsd-execute-phase     → small atomic commits with passing tests
4. gsd-verify-work       → goal-backward check against the spec
5. gsd-code-review       → produce docs/reviews/REVIEW-*.md
```

For trivial work (single file, single concern, < 30 min): just edit, run tests, commit.

---

## Common pitfalls (read once, avoid forever)

- **Hardcoded `../cv.md`** — use `PATHS.cv` from `server/lib/paths.mjs`.
- **Hardcoded port 4317** — tests bind to `:0` and read `server.address().port`.
- **Inline event handlers** (`<button onclick="…">`) — CSP rejects. Use `addEventListener` via `UI.el()`.
- **`innerHTML` without `UI.md`** — bypass of XSS strip. Route all markdown through `UI.md(text)`.
- **`globalThis.fetch` for outbound HTTP** — bypasses DNS-rebind defense. Use `safeGet` from `server/lib/safe-fetch.mjs`.
- **Read-modify-write on `applications.md` / `pipeline.md`** without `withFileLock(path, fn)` — race condition will silently drop rows.
- **New i18n key without DICT entry** — `tests/i18n-coverage.test.mjs` fails. Add to `public/js/lib/i18n.js` for all 8 locales.
- **`aria-describedby` without matching `id`** — `tests/a11y-form-wires.test.mjs` fails.
- **New runtime dep** — current production deps are `express`, `js-yaml`, `multer`. Adding more needs a spec.
- **Real LLM calls in tests** — mock the SDK adapter; never hit Anthropic / Gemini from a unit test.
