# GitHub Copilot — career-ops-ui

> GitHub Copilot auto-loads this file when working in this repo. The full
> project-level instructions, hard rules, conventions, and SDD pipeline
> live in [`CLAUDE.md`](../CLAUDE.md). Everything there applies to
> Copilot equally. This file is the bite-sized version for the chat
> sidebar.

## Snapshot

`career-ops-ui` is an Express + vanilla-JS SPA on top of the
[`santifer/career-ops`](https://github.com/santifer/career-ops) job-search
pipeline. Single-tenant, loopback-by-default, no telemetry, no build
step.

- **Server**: Node ≥ 18, Express 4 + js-yaml + multer. `.mjs` only (ESM). ~130-LOC orchestrator + 15 route modules under `server/lib/routes/`.
- **SPA**: Vanilla JS, hash-router, no framework, no bundler. Files served as-is from `public/`.
- **Tests**: `node --test` + Playwright. Baseline at v1.22.0 = 474+ unit / 32 Playwright. Don't reduce coverage.
- **i18n**: 8 locales (`en`, `es`, `pt-BR`, `ko`, `ja`, `ru`, `zh-CN`, `zh-TW`). DICT in `public/js/lib/i18n.js`; CI canary enforces every used key exists in every locale.

## Hard rules (Copilot, don't break these)

1. **Never edit outside `web-ui/`.** Parent career-ops is read-only.
2. **Never load real user data** (`cv.md`, `data/applications.md`, `reports/`) into chat context.
3. **Never weaken security headers.** CSP excludes `'unsafe-inline'`; don't relax `frame-ancestors 'none'`.
4. **Never bypass `isValidJobUrl` + `safeGet`** for any outbound HTTP from a user-supplied URL.
5. **Never sanitize CV markdown outside `stripDangerousMarkdown`.**
6. **Never commit `.env`** or any real secret.
7. **Tests must be CI-isolated** — no parent dependency, no live network, no port collision.

## Code conventions

- **ESM only.** `.mjs` for server, `.js` (browser classic) for SPA.
- **`node:` prefix** for built-ins: `node:fs`, `node:path`, `node:url`.
- **No new runtime deps lightly.** Current: `express`, `js-yaml`, `multer`. Adding more needs a spec.
- **File size target**: < 400 LOC. New routes go in `server/lib/routes/<topic>.mjs` exporting `register<Topic>Routes(app)`.
- **REST norms**: `GET /api/<resource>`, `POST /api/<resource>` (create/append), `PUT /api/<resource>` (replace), `DELETE /api/<resource>/:id`. SSE uses `GET /api/stream/<verb>`.
- **Conventional commits**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`. Optional scope. Breaking change: `feat!:`.

## Security envelope (v1.21+)

When generating server code that fetches a URL, accepts a `:name` param, writes to a parent file, or calls an LLM endpoint, route through:

| Surface | Helper | Module |
|---|---|---|
| URL validation | `isValidJobUrl(s)` | `server/lib/security.mjs` |
| Outbound GET | `safeGet(url, opts)` | `server/lib/safe-fetch.mjs` |
| `:name` / `:slug` sanitization | `sanitizePathName(s)` | `server/lib/security.mjs` |
| CV markdown XSS strip | `stripDangerousMarkdown(s)` | `server/lib/security.mjs` (entity-aware in v1.22+) |
| LLM endpoint throttle | `llmRateLimit` middleware | `server/lib/rate-limit.mjs` |
| Concurrent-write mutex | `withFileLock(path, fn)` | `server/lib/file-lock.mjs` |

Don't reinvent these helpers; don't fork them; don't add a parallel implementation.

## SPA conventions

- **No inline event handlers** (`onclick="..."`) — CSP rejects. Use `UI.el('button', { onClick: fn }, '…')`.
- **All markdown rendering** → `UI.md(text)` in `public/js/api.js`. Escapes first.
- **All i18n** → `t('key', 'EN fallback')` from `window.I18n`. Missing-from-DICT keys fail CI.
- **Forms**: every input needs a `<label htmlFor="…">` or `aria-label`. Every `aria-describedby="X"` must point at an existing `id="X"`.

## When in doubt

1. Read [`../docs/architecture/OVERVIEW.md`](../docs/architecture/OVERVIEW.md).
2. Run `npm test` — the suite documents existing invariants.
3. Check the latest release REVIEW in `docs/reviews/`.
4. Ask the user. Don't guess at security-sensitive code.
