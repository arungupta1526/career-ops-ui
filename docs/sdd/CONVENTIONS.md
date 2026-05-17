# CONVENTIONS — career-ops-ui

> Project-specific coding conventions. Extends `~/.claude/rules/coding-style.md`. When user-global rules and these conflict, the more restrictive wins.

## Module system

- `"type": "module"` everywhere. ESM only.
- Server files: `.mjs`. Built-ins use the `node:` prefix (`node:fs`, `node:path`, `node:url`, `node:child_process`).
- SPA files: `.js`. Loaded as classic scripts via `<script src="…">` in `public/index.html`. They expose globals (`window.Router`, `window.API`, `window.UI`, `window.I18n`) — do not introduce ES module imports on the client until a build step is adopted (a ROADMAP-level decision).

## File size

| Size | Action |
|---|---|
| < 400 lines | Target. |
| 400 – 800 lines | Add `// TODO: split by concern` at top; split at next opportunity. |
| > 800 lines | Split before merging the PR. |

Current outliers (as of v1.30.0):

- `server/index.mjs` (~174 LOC after **P-2 phase 2** in v1.9.0). Pure orchestrator — middleware + `register*Routes(app)` calls + SPA catch-all. New routes go into `server/lib/routes/<topic>.mjs` exporting `register<Topic>Routes(app)`. Currently 14 route modules: `activity`, `auto-pipeline`, `batch`, `config`, `content`, `health`, `help`, `jds`, `llm`, `pipeline`, `reports`, `runners`, `scan`, `tracker`.
- `public/js/views/scan.js` (~670 LOC after v1.29.0 dynamic-dropdown + v1.30.0 paginator). Past the 400-LOC soft target. Flagged for split: extract Active Companies card → `views/scan/active-companies.js`, source-filter logic → `views/scan/source-filter.js`. Touch with caution; this is the most user-facing view.
- `public/css/app.css` (~958 LOC). Past 800-LOC hard target — split before the next CSS-heavy feature lands. Candidate split: paginator styles → `views/paginator.css`, sidebar styles → `views/sidebar.css`.

## Naming

- Files: `kebab-case.mjs` / `kebab-case.js` / `kebab-case.test.mjs`.
- Functions: `camelCase`.
- Constants from configuration: `SCREAMING_SNAKE` (e.g. `KNOWN_KEYS`, `SECRET_KEYS`, `MODE_ALLOWLIST`).
- Tests: `tests/<feature>.test.mjs` matching the module under test where possible.

## Express routes

- Method + path:
  - `GET /api/<resource>` — list / read.
  - `POST /api/<resource>` — create / append (idempotent dedup is fine).
  - `PUT /api/<resource>` — replace.
  - `DELETE /api/<resource>/:id` — delete.
  - `GET /api/stream/<verb>` — SSE long-running. Headers: `text/event-stream`, `no-cache`, `keep-alive`, `X-Accel-Buffering: no`. Events: `start`, `log`, `done`, `error`.
- Status codes: `200` ok, `400` validation, `404` not found, `413` body too large, `500` unexpected, `502` upstream LLM failure.
- Response body: always JSON, even for errors: `{ error: '...', details?: ... }`.
- Validation: gate inputs at the route handler. Don't trust `req.body` shapes — destructure with defaults.
- File-system writes: always `mkdirSync(dir, { recursive: true })` first. Never assume the parent directory exists.

## Sanitizers — single-source rules

These functions live in `server/lib/security.mjs` (after v1.21.0 H-4 consolidation — pre-v1.21 they were scattered across `server/index.mjs` and individual route files). DO NOT duplicate. Route every relevant ingress through them:

| Concern | Function | Module |
|---|---|---|
| Job URL → SSRF guard | `isValidJobUrl(url)` | `server/lib/security.mjs` |
| Outbound HTTP with DNS-pinned redirect-revalidation | `safeGet(url, opts)` | `server/lib/safe-fetch.mjs` (v1.21 B-1) |
| CV / markdown → XSS strip (entity-aware) | `stripDangerousMarkdown(md)` | `server/lib/security.mjs` (v1.22 M-4) |
| JD text → length / char strip | `sanitizeJobDescription(jd)` | `server/lib/security.mjs` |
| User-supplied slug → filesystem-safe | `sanitizePathName(s)` | `server/lib/security.mjs` (v1.21 H-4) |
| File-lock concurrency control | `withFileLock(path, fn)` | `server/lib/file-lock.mjs` (v1.21 H-6) |
| LLM rate limiting | `llmRateLimit` middleware | `server/lib/rate-limit.mjs` (v1.21 H-5) |
| Env-config writes | `validateConfig(body)` then `updateEnvFile(...)` | `server/lib/env-config.mjs` |
| Activity log redaction | handled by `activityMiddleware` | `server/lib/activity.mjs` |

Route reviewers (`web-ui-route-reviewer` agent) flag every miss.

## Client-side patterns

- **Event handlers via `addEventListener`.** Never `onclick=`. CSP enforces this.
- **Markdown rendering** for CV / reports / interview-prep goes through the project markdown renderer (sanitizes `<script>`, `javascript:` URLs, `onerror=` attributes). Never bypass.
- **API calls** through `window.API.{get,post,put,delete}`. Never raw `fetch` from a view.
- **SSE consumers** via `API.stream(path, onEvent)`. Auto-closes the `EventSource` on `done` (single-phase) or on the final `done` with `data.final !== false` (multi-phase, see v1.29.2 invariant M-13 in `qa/REGRESSION-v1.29.2.md`).
- **Navigation** via `Router.go('/path')`. Never set `window.location.hash` directly outside `router.js`. The router strips `?query` from the route-name lookup (v1.28.1 fix); views parse query params from `window.location.hash.split('?')[1]` themselves via `URLSearchParams`.
- **Paginator** via `UI.paginate({ pageSize, onChange })`. Used by `#/tracker` / `#/reports` / `#/activity` / `#/scan` (v1.30.0). Filter inputs MUST call `pager.reset()` so a deep-page user lands on page 1 when their search narrows the result set.
- **Source-list lookups** (`#/scan` filter dropdown, regional scanner dispatch) read from `server/lib/sources/registry.mjs` via `GET /api/scan/sources`. Adding a 12th adapter = one entry in the registry; never hardcode a source list in a view or the dispatcher.

## i18n

- Static strings: `<element data-i18n="key.path">English fallback</element>`.
- Dynamic strings: `I18n.t('key.path', 'English fallback')`.
- New key → add to all 8 locales (`en, es, pt-BR, ko, ja, ru, zh-CN, zh-TW` — note `ko` in the dict but `ko-KR.md` for help / README files). The English fallback must always be present in code; locale files override it.
- The DICT was split in v1.23.0: `public/js/lib/i18n-dict.js` carries the data (~580 LOC), `public/js/lib/i18n.js` carries the logic (~86 LOC). `<script>` order in `public/index.html` must load `i18n-dict.js` BEFORE `i18n.js` — `tests/i18n-script-order.test.mjs` enforces this.
- Help-bundle markdown lives in `docs/help/<locale>.md` (8 files). CI invariant: **17 H2 sections** (`tests/canonical-docs-coverage.test.mjs::17-H2 parity`).
- `tests/i18n-coverage.test.mjs` enforces locale parity. If you add a key and forget a locale, that test fails.
- CHANGELOG parity: all 8 `CHANGELOG*.md` files must reference the same `## [vX.Y.Z]` top — `scripts/check-changelog-parity.mjs` is the gate (part of `npm run test:ci`).

## Error handling

- Server: catch known failure modes (file not found, parse error, upstream timeout) and return a 4xx/5xx with a JSON body. Let unexpected errors bubble — Express's default 500 is acceptable.
- Client: `API` wrapper transforms network errors into a banner. Per-view try/catch toasts a friendly message and offers retry.

## Logging

- Server: `console.log` for startup banners and one-shot lifecycle events. `console.warn` for recoverable degradations. No `console.error` for handled errors — those belong in the activity log.
- Never log full request bodies. Never log values for keys in `SECRET_KEYS`. The activity-log middleware redacts on the way in; respect that.
- Client: `console.error(err)` for unhandled render errors so DevTools shows the stack — paired with the toast.

## Testing

- `npm test` runs `node --test tests/*.test.mjs tests/acceptance/*.test.mjs` (the acceptance dir was added in v1.26.0 — see [`docs/architecture/TESTING.md`](../architecture/TESTING.md) for the 4-tier pyramid).
- In-process via `createApp()`. Bind to ephemeral port (`server.listen(0)`).
- Fixtures: tests bootstrap any parent layout they need under `mkdtemp`. No reliance on `../cv.md` etc. — `tests/test-isolation-reviewer` enforces this on every new test diff.
- Coverage floor: 80 % line / 75 % branch on non-trivial logic. Current baseline ~93 % line / ~83 % branch — keep at or above. Exempt: pure data mappers, getters, generated code.
- TDD when adding behavior. Pure refactors with full coverage may skip TDD.
- Real network is **forbidden** in tests (CI-isolation contract). Source adapters take a `fetchImpl` opt that defaults to `globalThis.fetch`; tests inject a mock that returns canned responses. Safe-fetch supports the same via `_setTransport()`.
- Long-running tests (E2E): keep them under `tests/e2e*.mjs` / `tests/playwright-*.mjs`, not in the default `npm test` matcher. `npm run test:e2e:browser` drives them.
- CI gates (run via `npm run test:ci`): unit + acceptance + `scripts/check-no-also-leftovers.mjs` (no `.also(` patterns leaking into views) + `scripts/check-changelog-parity.mjs` (all 8 locales at the same version).
- Current count as of v1.30.0: **567** unit + acceptance tests, **32** Playwright. Run `npm run test:coverage` for the V8 coverage report.

## LLM provider selection (v1.39.0, WS8.2)

`LLM_PROVIDER` ∈ `auto|claude|gemini` (env-config `KNOWN_KEYS`).
`providerOrder(env)` in `server/lib/env-config.mjs` is the single
contract: `auto`→`[anthropic,gemini]` (legacy), `claude`→`[anthropic]`,
`gemini`→`[gemini]`. All 6 provider-gate sites in
`server/lib/routes/llm.mjs` (evaluate/deep/mode × Anthropic/Gemini)
consult it via the local `_provGate()` — never re-derive provider
preference elsewhere. Provider keys = exactly what santifer/career-ops
implements: `GEMINI_API_KEY` (parent gemini-eval), `ANTHROPIC_API_KEY`
(web-ui SDK + Claude Code), `OPENAI_API_KEY` (Codex/OpenCode CLI side).
Do NOT add speculative keys for providers the parent doesn't wire.

## CLI dispatcher (v1.38.0, WS8.1)

`bin/career-ops-ui.sh` is the unified entrypoint (`package.json`
`bin.career-ops-ui`). Verbs: `setup` (→ `bin/setup.sh`), `run`
(→ `bin/start.sh`), `doctor` (→ `scripts/doctor.mjs`), `init`
(→ `scripts/init.mjs`), `help`.

- `doctor` spins `createApp()` in-process on an ephemeral port and
  renders `/api/health` to the terminal — **single source of truth**;
  it never reimplements checks. Exit 0 iff every REQUIRED check is
  green (so `setup`/CI can gate on it).
- New verbs go in the `case` in `bin/career-ops-ui.sh` + a thin
  `scripts/<verb>.mjs`. Keep verbs standalone-usable AND chainable.

## Pre-commit AI review (v1.37.0, WS7)

`git commit` runs `.githooks/pre-commit` → `scripts/ai-precommit-review.mjs`.
`npm install` wires `core.hooksPath=.githooks` via the `prepare` script.

- **Deterministic floor — fail-HARD, always:** no `.env`/secret-bearing
  file staged; no high-confidence secret pattern in the staged diff
  (`.env.example` placeholders are exempt); no `.also(` leftover in
  staged `public/js/views/*` (mirrors the CI gate); every staged
  `.mjs`/`.js` passes `node --check`.
- **AI layer — advisory, fail-SOFT:** runs `claude -p` over the staged
  diff when the CLI is on PATH and `AI_REVIEW !== 'off'`. Missing CLI /
  offline / timeout → prints a notice, never blocks.
- `AI_REVIEW=off git commit …` skips ONLY the AI layer; the floor
  always runs. Never `--no-verify` (CLAUDE.md hard rule #7) — fix the
  cause. CI still runs the full `npm run test:ci` gate regardless.

## Commits

Conventional commits with types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`. Optional scope: `feat(scan):`, `fix(api):`. Breaking: `feat!:`. Examples:

```
feat(pipeline): add server-side preview for ATS pages
fix(cv): strip <script> from cv.md ingress (FIX-C10 follow-up)
test(runner): add subprocess kill watchdog
docs(sdd): add convergence note to SDD-GUIDE
```

Subject ≤72 chars, imperative mood, no trailing period.

## Branch and PR

- Branch names: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`. Never `feature/<…>` (the type prefix differs from commit prefixes by convention).
- One PR = one logical change. If you find an unrelated bug while in flight, open a separate branch.
- PR description ends with the GSD phase ID it implements (e.g. `Phase: P-3`).

## CSS

- Token-based — colors, spacing, radii defined as CSS custom properties at the top of `app.css`. Use the tokens; don't hardcode hex.
- Mobile-first media queries. The sidebar drawer logic lives at `<900 px`.
- No CSS-in-JS, no preprocessor.

## Versioning

- `package.json::version` is the source of truth.
- Bump in the PR that ships the user-visible change. Never bump in a separate commit "for release prep" — release-please handles tags.
- Footer reads `/api/health.version` — keep that read path unchanged.
