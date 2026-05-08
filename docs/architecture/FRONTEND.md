# Frontend Map — career-ops-ui

> SPA architecture. Vanilla JS, hash-routed, no framework, no build step. Pair with `OVERVIEW.md` and `API.md`.

## Entry point

`public/index.html` (~150 LOC) is the only HTML file. Loads:

1. `css/app.css`
2. `js/lib/i18n.js` (defines `window.I18n`)
3. `js/lib/skills.js` (defines small `window.UI` helpers)
4. `js/api.js` (defines `window.API`, `window.UI` extensions for spinner/toast/modal)
5. `js/router.js` (defines `window.Router`)
6. Each `js/views/*.js` (registers itself with `Router.register`)
7. `js/app.js` (boot script)

The SPA mounts inside `#content`. Sidebar nav, top-bar, and footer are static in `index.html` — they don't re-render per route.

## Globals (the entire client state)

| Global | Type | Defined in |
|---|---|---|
| `window.Router` | `{ register, render, go, current }` | `router.js` |
| `window.API` | `{ get, post, put, delete }` | `api.js` |
| `window.UI` | toast, modal, spinner, DOM helpers | `api.js` (extended by `lib/skills.js`) |
| `window.I18n` | `{ t, getLang, setLang, getLangs, onChange }` | `lib/i18n.js` |

Views must not introduce new globals.

## Router

Hash-based: `#/dashboard`, `#/scan`, `#/pipeline/<param>`, etc. Aliases: `#/profile` → `settings`. Unknown routes render the `__not_found__` view (registered inside `router.js` to guarantee availability).

`Router.register(name, async (params) => Node|string)`. The router clears `#content` to a loading state, awaits the renderer, swaps in the result, and toasts on render error (with a network-aware message and a retry button).

## Views (`public/js/views/`)

| File | Route | Purpose |
|---|---|---|
| `dashboard.js` | `#/dashboard` (default) | KPI cards, recent applications, last report. |
| `scan.js` | `#/scan` | Live SSE scanner UI for EN + RU portals. Active companies card. |
| `pipeline.js` | `#/pipeline` | Split-pane pipeline browser with server-side preview pane. |
| `evaluate.js` | `#/evaluate` | Paste a JD → save / send to Gemini / get manual prompt. |
| `deep.js` | `#/deep` | Deep research per company; live (Anthropic / Gemini) or manual. |
| `apply.js` | `#/apply` | Apply helper view. |
| `tracker.js` | `#/tracker` | Read-only view of `data/applications.md`. |
| `reports.js` | `#/reports` | Browse and read parent `reports/*.md`. |
| `cv.js` | `#/cv` | Side-by-side CV markdown editor + sanitized preview. |
| `config.js` | `#/config` | App Settings — manage parent `.env` keys. |
| `settings.js` | `#/profile`, `#/settings` | Profile YAML viewer (also under `#/profile` alias). |
| `health.js` | `#/health` | `/api/health` checks rendered with traffic-light icons. |
| `mode-page.js` | `#/mode/:slug` | Generic mode runner — reads `modes/<slug>.md`, runs Anthropic/Gemini/manual. |
| `help.js` | `#/help` | Renders `docs/help/<lang>.md` from the API. |
| `activity.js` | `#/activity` | Activity log viewer. |

Each view file:

1. Starts with `Router.register('<name>', async (params) => { ... })`.
2. Builds DOM with `document.createElement` (preferred) or static `innerHTML` for trusted templates.
3. Wires events via `addEventListener` — never inline `onclick=`.
4. Calls `API.*` for network. Never raw `fetch`.
5. Translates user-facing strings via `I18n.t('key', 'fallback')` or `data-i18n="key"` attribute.

## i18n

`public/js/lib/i18n.js`:

- Locales: `en, es, pt-BR, ko-KR, ja, ru, zh-CN, zh-TW`.
- Persistent: language choice stored in `localStorage`.
- Keys ship inline in the file as a single nested object per locale.
- `I18n.onChange(handler)` re-renders on switch — `app.js` re-applies `data-i18n` attrs and re-renders the active route.

`tests/i18n-coverage.test.mjs` enforces parity: every key present in `en` must exist in every other locale.

## API client (`public/js/api.js`)

`API.<verb>(path, body?)`:

- Adds `Content-Type: application/json` automatically when `body` is an object.
- Throws on non-2xx. Errors carry `{ message, status, network: boolean }`.
- Network errors flip a global "no connection" banner (`#conn-banner`); successful calls clear it.

`UI.withSpinner(buttonEl, fn)` — disables the button, shows a spinner, runs `fn`, restores. Used by long-press buttons (Doctor, Evaluate, scans).

`UI.toast(text, kind?)` — top-right toast with auto-dismiss. Kinds: `info` (default), `success`, `error`.

`UI.modal(title, contentNode)` — show modal. `UI.closeModal()` to dismiss; click on backdrop or `data-close` triggers it.

## CSS

`public/css/app.css` (~700 LOC). Token-based custom properties at top:

- `--ink, --foggy, --rausch, --kazan, --teal` (Airbnb-inspired palette)
- `--space-1..6, --radius, --shadow-1..3`

Mobile-first. `@media (max-width: 900px)` toggles the sidebar drawer (off-canvas) — `body.sidebar-open` is the open state, set/cleared by hamburger button + backdrop in `app.js`.

## Adding a new view

1. Pick a route name. Update `index.html` sidebar `<a data-route="...">` if the route deserves nav placement.
2. Add `public/js/views/<name>.js` with a single `Router.register(...)` call.
3. Add the script tag to `index.html` (after `router.js`, before `app.js`).
4. Add i18n keys to **every** locale block in `lib/i18n.js`.
5. Add an E2E step in `tests/e2e-comprehensive.mjs` covering the happy path.
6. If the view fetches a new endpoint, document it in `API.md` and (if it writes parent files) `DATA-FLOWS.md`.

## What NOT to do

- Don't introduce ES module imports on the client until a build step is adopted (a roadmap-level decision).
- Don't add a global except via the existing four (`Router`, `API`, `UI`, `I18n`).
- Don't bypass the markdown sanitizer for user content.
- Don't hardcode strings — use `I18n.t`.
- Don't set `window.location.hash` directly outside `router.js` — call `Router.go(...)`.
