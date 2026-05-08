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

Current outliers:

- `server/index.mjs` (~760 LOC after **P-2 phase 1** in v1.8.0). Down from 1230 LOC. Phase 2 will drive it under 500. Do not grow further; new routes go into `server/lib/routes/<topic>.mjs`.
- `public/js/views/scan.js` (~461 LOC) — past the 400-LOC soft target. Flagged for split next time it is touched (extract Active Companies card → `views/scan/active-companies.js`).
- `public/css/app.css` (~700 LOC) — borderline; split if a dedicated `views/<name>.css` would tighten the boundary.

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

These functions live in `server/index.mjs` (or its eventual splits). DO NOT duplicate. Route every relevant ingress through them:

| Concern | Function |
|---|---|
| Job URL → SSRF guard | `isValidJobUrl(url)` |
| CV / markdown → XSS strip | `stripDangerousMarkdown(md)` |
| JD text → length / char strip | `sanitizeJobDescription(jd)` |
| User-supplied slug → filesystem-safe | `slugify(s)` |
| Filename param → safe | `replace(/[^\w\-.]/g, '')` |
| Env-config writes | `validateConfig(body)` then `updateEnvFile(...)` |
| Activity log redaction | handled by `activityMiddleware` |

Route reviewers (`web-ui-route-reviewer` agent) flag every miss.

## Client-side patterns

- **Event handlers via `addEventListener`.** Never `onclick=`. CSP enforces this.
- **Markdown rendering** for CV / reports / interview-prep goes through the project markdown renderer (sanitizes `<script>`, `javascript:` URLs, `onerror=` attributes). Never bypass.
- **API calls** through `window.API.{get,post,put,delete}`. Never raw `fetch` from a view.
- **Navigation** via `Router.go('/path')`. Never set `window.location.hash` directly outside `router.js`.

## i18n

- Static strings: `<element data-i18n="key.path">English fallback</element>`.
- Dynamic strings: `I18n.t('key.path', 'English fallback')`.
- New key → add to all 8 locales (`en, es, pt-BR, ko-KR, ja, ru, zh-CN, zh-TW`). The English fallback must always be present in code; locale files override it.
- `tests/i18n-coverage.test.mjs` enforces parity. If you add a key and forget a locale, that test fails.

## Error handling

- Server: catch known failure modes (file not found, parse error, upstream timeout) and return a 4xx/5xx with a JSON body. Let unexpected errors bubble — Express's default 500 is acceptable.
- Client: `API` wrapper transforms network errors into a banner. Per-view try/catch toasts a friendly message and offers retry.

## Logging

- Server: `console.log` for startup banners and one-shot lifecycle events. `console.warn` for recoverable degradations. No `console.error` for handled errors — those belong in the activity log.
- Never log full request bodies. Never log values for keys in `SECRET_KEYS`. The activity-log middleware redacts on the way in; respect that.
- Client: `console.error(err)` for unhandled render errors so DevTools shows the stack — paired with the toast.

## Testing

- `node --test tests/*.test.mjs`. In-process via `createApp()`. Bind to ephemeral port (`server.listen(0)`).
- Fixtures: tests bootstrap any parent layout they need under `mkdtemp`. No reliance on `../cv.md` etc.
- Coverage floor: 80 % line / 75 % branch on non-trivial logic. Exempt: pure data mappers, getters, generated code.
- TDD when adding behavior. Pure refactors with full coverage may skip TDD.
- Long-running tests (E2E): keep them under `tests/e2e*.mjs`, not in the default `npm test` matcher.

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
