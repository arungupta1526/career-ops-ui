# FUNCTIONALITY CHECK — career-ops-ui · FINAL (perennial, run on every release)

> **The single authoritative, version-agnostic functional-correctness
> prompt.** Where `REGRESSION-FINAL.md` proves *nothing regressed* and
> `UX-AUDIT-PROMPT.md` judges *whether it's good UX*, **this** prompt
> answers one question per item: **does it actually work — correctly,
> completely, and clearly — for a real user?** Paste it verbatim to a
> QA agent (or run it yourself). It always validates *the current
> `HEAD`* — read `package.json::version` first and treat that as `vX`.
> Record the run in `qa/v54-regression/<YYYY-MM-DD>-FUNCTIONALITY.md`.
>
> **Method.** For every item: perform the action as the user would,
> observe the real result, and mark **PASS** / **FAIL** /
> **PARTIAL** / **SKIP** with evidence (route, exact copy, response
> body, screenshot, server log line). A check is PASS only if the
> behaviour is correct *and* legible to the user — a silent success
> the user can't perceive is PARTIAL. Any FAIL → file a one-fix ship
> per the project doctrine (bump + CHANGELOG ×8 + test +
> Playwright-verify + pre-commit AI-review LGTM + CI-watch). Never
> batch. Never `--no-verify`.

---

## §0 — Boot & hard gate

```bash
vX=$(node -p "require('./package.json').version")
npm ci && npm run test:ci          # MUST: N/N pass · ✓ no .also( · ✓ CHANGELOG parity all 8 @ vX
node tests/e2e.mjs                 # MUST: passed: N · failed: 0
node tests/e2e-comprehensive.mjs   # MUST: 0 failed
npm run test:e2e:browser           # MUST: green, no "asynchronous activity after the test"
node --test tests/sh-files.test.mjs        # MUST: green
node scripts/check-changelog-parity.mjs    # MUST: all 8 @ vX
node scripts/check-no-also-leftovers.mjs   # MUST: ✓
career-ops-ui doctor               # MUST: exit 0
bash bin/start.sh                  # MUST: installs deps if missing, serves 127.0.0.1:4317, opens browser
curl -fsS 127.0.0.1:4317/api/health | python3 -m json.tool  # ok=true, version==vX
```

If §0 is not green, stop — nothing below is trustworthy.

## §1 — Every route loads and does its job

Navigate each and confirm it **renders real data, not a spinner/empty
state by accident**, exactly one `<h1>`, zero console errors, no 4xx/5xx
for first-paint assets:

`#/dashboard #/scan #/pipeline #/auto #/evaluate #/batch #/deep #/apply
#/tracker #/reports #/cv #/profile #/settings #/config #/health
#/activity #/help` + the 7 `#/<mode>` pages (contacto, followup,
interview-prep, patterns, project, training, batch-prompt) + `#/portals`
(MUST alias → `#/config`, never 404) + an unknown hash (MUST render the
dedicated 404 view, not silently fall back to dashboard).

- `#/dashboard`: the hero shows the 2 P0 CTAs + a focal *last-evaluation*
  hint (or the cold-start empty-state); KPI cards + status chips reflect
  the parent's real `applications.md`/`pipeline.md`/`reports/`.
- First paint: the `<h1>` is focusable (`tabindex=-1`) and `#content`
  is `aria-live=polite` — a screen reader hears the heading **without**
  focus being yanked from the skip-link.

## §2 — The core journey actually completes (Scenario A, cold start)

Empty parent files; set up exactly ONE provider key. Repeat the whole
arc once per provider (**Anthropic, Gemini, OpenAI, Qwen** — the "OR"
promise):

1. Land on `#/dashboard` with **0 keys** → the red onboarding banner
   states ⚡ Run-live is manual-prompt mode and links to
   `#/config?tab=api-keys`. Set one key via `#/config` → Save →
   banner is replaced by the quiet active-provider chip **without a
   server restart**.
2. `#/cv` → the editor (`#cv-editor`, descriptive `aria-label`) loads
   `cv.md`; the page title is a quiet breadcrumb, the CV preview owns
   the page; editing + Save round-trips to the parent `cv.md`.
3. `#/auto` → paste a real job URL. Before Run: the 5 pipeline steps
   are visible (pending), the "~1–2 min" ETA + the cost hint
   ("Using <Provider> <model> — ~$0.0X/eval") show. Run → the SSE
   stepper advances validate→fetch→evaluate→save report→add tracker;
   a report link + tracker row appear; the PDF is reachable.
4. `#/reports` shows the new report; `#/tracker` shows the new row;
   the funnel chips reflect it.

Every step must work end-to-end with **only that one key**. No key
anywhere ⇒ the copy-paste manual prompt (never a hard error), and the
prompt text names the canonical report blocks.

## §3 — Power-user journey (Scenario B)

`#/scan` (free-text + Remote/Hybrid/Onsite visible; Source/Scope +
facet chips behind the *Advanced filters* disclosure) → run a scan →
the multi-minute crawl shows progress, the **Stop** button is a
prominent destructive control while busy and actually aborts the
EventSource → results populate → click a company → `#/pipeline`
pre-filtered. `#/pipeline` with >1000 rows stays smooth (virtualized,
full scrollbar, ▶/✕ per row work). `#/batch` evaluates a TSV in
parallel. `#/deep` / `#/apply` / `#/<mode>` produce the right prompt
or live result, and the manual-vs-live distinction is unambiguous.

## §4 — Every API endpoint honours its contract

Hit each with valid + invalid input; assert status + body shape:

- `GET /api/health` → `{ ok, warnings, version: vX, parentVersion,
  checks[] }`.
- `GET /api/status/providers` → `{ activeProvider, activeModel,
  keysConfigured }`; matches the `.env` reality; **no secret values**.
- `GET /api/tracker` (no params) → exactly `{ rows }` (back-compat);
  `?page=&pageSize=&status=` → `{ rows, total, page, pageSize,
  funnel }` with the documented clamps; funnel = whole history.
- `GET /api/dashboard`, `/api/activity`, `/api/reports`, `/api/cv`,
  `/api/config` (secrets masked), `/api/scan/sources` (== 11),
  `/api/help/:lang` (8 locales; bad lang → `en` fallback).
- Writes only on explicit user action: `POST /api/pipeline`,
  `POST /api/tracker`, `PUT /api/cv`, `POST /api/jds`,
  `DELETE /api/{jds,interview-prep}/:name`, `POST /api/config`, the
  streaming runners. Each must actually mutate the right parent file
  and nothing else.

## §5 — Safety envelope is real, not decorative

- SSRF: `/api/pipeline`, `/api/pipeline/preview`, `/api/auto-pipeline`
  reject loopback / `file://` / non-http(s) / script-char URLs
  (`isValidJobUrl` + DNS-pinned `safeGet`).
- XSS: a CV / JD containing `<script>`, `javascript:`, `<img onerror>`,
  entity-encoded payloads renders inert (`stripDangerousMarkdown`).
- Secrets: `GET /api/config` masks; no key is ever echoed or logged
  (the no-leak canary in `anthropic.test.mjs` / `openai.test.mjs`).
- CSP (when bound beyond loopback) excludes `'unsafe-inline'` /
  `'unsafe-eval'`; `frame-ancestors 'none'`; every `.js/.css` →
  `Cache-Control: no-store`.
- Parent boundary: `git log --stat -20` shows zero writes outside
  `web-ui/`; the server never writes parent files at rest.

## §6 — Resilience & honesty

- Kill the server mid-SSE (scan / auto-pipeline): the client surfaces
  a clear, actionable error + Retry; the server logs **no**
  uncaughtException / unhandled rejection.
- Stop a scan: the EventSource closes, state resets, no zombie poll.
- Wrong/stale key: the error names the actual provider and the fix.
- Long ops (scan, auto, batch, PDF): progress + time expectation +
  cancelability + honest cost/credit signalling — never a dead UI.

## §7 — i18n, docs & deploy parity

- Switch all 8 locales (en, es, pt-BR, ko, ja, ru, zh-CN, zh-TW) on
  the core flow: no untranslated leakage, no truncation, terminology
  matches career-ops.org/docs. `tests/i18n-coverage` green.
- `package.json::version` == `/api/health.version` == every
  `CHANGELOG*.md` top entry == README ×8 badge ==
  `docs/architecture/TESTING.md` totals. Help bundles ×8 at the
  parity gate (17 H2 / 70 H3). API.md documents every live endpoint.
- Pipeline AI-review: a push to `main` triggers
  `.github/workflows/ai-review.yml`; with the `ANTHROPIC_API_KEY`
  repo secret it posts a commit-comment review, without it it logs a
  clear skip and stays green (advisory, never blocks).

## §8 — Known cross-repo caveat

**G-005** (MINOR, OPEN, blocked on the parent): `modes/oferta.md`
still emits the legacy A-G report vs canonical A-F. The renderer is
schema-tolerant — **both display correctly**, so this is *not* a
functional FAIL; mark it KNOWN. It closes only via the parent
commit in `qa/G-005-closure-kit.md` STEP 1, then the gated web-ui
follow-up.

---

### Exit criteria

§0 green · §1–§7 every item PASS (PARTIALs triaged, no FAIL) ·
§8 the only KNOWN caveat · `git status` clean · tag `vX` on
`origin/main` with CI green on all jobs. Any FAIL or new PARTIAL →
a one-fix ship (bump + CHANGELOG ×8 + test + Playwright-verify +
AI-review LGTM + CI-watch) before the release is called done.
