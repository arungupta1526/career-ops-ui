# REGRESSION — career-ops-ui · FINAL (perennial, run on every release)

> **This is the single authoritative, version-agnostic regression
> prompt.** Paste it verbatim to a QA agent (or run it yourself) on
> every release. It always validates *the current `HEAD`* — read
> `package.json::version` first and treat that as "the version under
> test" (vX) everywhere below. Record the run in
> `qa/v54-regression/<YYYY-MM-DD>-REGRESSION.md`.
>
> Lineage: supersedes `REGRESSION-v1.54.9.md` (cycle-specific) and
> `REGRESSION-v1.54.md` (P-31 final). Those stay for historical diff.
>
> **Doctrine.** A check that needs a code change → open it as ONE
> one-fix ship: bump + CHANGELOG ×8 (parity-gated) + a test +
> Playwright-verify + pre-commit AI-review to LGTM + CI-watch to
> green. Never batch. Never `--no-verify`. HIGH → MEDIUM → LOW.

---

## §0 — Pre-flight (HARD GATE — nothing below runs until this is green)

```bash
vX=$(node -p "require('./package.json').version")
npm ci && npm run test:ci          # MUST: N/N pass · ✓ no .also( · ✓ CHANGELOG parity all 8 @ vX
node tests/e2e.mjs                 # MUST: failed: 0
node tests/e2e-comprehensive.mjs   # MUST: 0 failed
npm run test:e2e:browser           # MUST: 32/32 · NO "generated asynchronous activity" / "not ok 2"
node --test tests/sh-files.test.mjs        # MUST: green
node scripts/check-changelog-parity.mjs    # MUST: all 8 locales @ vX
node scripts/check-no-also-leftovers.mjs   # MUST: ✓
career-ops-ui doctor               # MUST: exit 0
```

- `package.json::version` == footer `/api/health.version` == every
  `CHANGELOG*.md` top entry == README ×8 `release-vX` badge ==
  `docs/architecture/TESTING.md` totals version.
- README ×8 `tests-N%20passed` badge == the `npm run test:ci` count ==
  `TESTING.md` totals count.
- `git status` clean · HEAD has tag `vX` on `origin/main` · the
  latest CI run on `origin/main` is green on **all 4 jobs**
  (Unit+integration node 18/20/22 + Playwright e2e).
- `.claude/settings.json` untracked (gitignored).
- **Parent-project safety:** `git log --stat -20` shows zero writes
  outside `web-ui/`. The server only writes parent files on explicit
  user POST/PUT/DELETE — never at rest, never from a code path.

## §1 — Every SPA route renders clean

For each hash route: navigate, assert exactly one `<h1.page-title>`
in `#content`, **zero console errors**, no unhandled rejection, no
network 4xx/5xx for first-paint assets (all `.js/.css` →
`Cache-Control: no-store`).

`#/dashboard #/scan #/pipeline #/auto #/evaluate #/batch #/deep
#/apply #/tracker #/reports #/cv #/profile #/settings(alias) #/config
#/health #/activity #/help` + the 7 `#/<mode>` pages + `#/portals`
(MUST alias → `#/config`, never the 404 view).

## §2 — Accessibility invariants (WCAG, regression-locked)

Every row below has a dedicated `tests/*.test.mjs` static guarantee —
none may regress. Spot-verify the starred ones live with a screen
reader / the accessibility tree:

- ★ Route change moves focus to the new view's `<h1>`.
- `#/config`: WAI-ARIA Tabs (`role=tablist/tab/tabpanel`,
  `aria-selected` synced, ←/→/Home/End, roving tabindex).
- Destructive parent-file writes (`#/config` raw save, modes
  full-rebuild, `#/tracker` fix, `#/pipeline` delete) go through the
  focus-trapped `UI.confirm()` (Cancel-default; Esc/backdrop/× ⇒
  false). **No native `confirm()` anywhere.**
- ★ `#/cv`: exactly one `<h1>` (page title). A CV body `# Name`
  renders `<h2>` (heading-shift); h6 → `role=heading aria-level=7`.
- `#/scan`: console `role=log aria-live=polite` + assertive
  done/error status; Stop closes the EventSource; `aria-busy` on the
  multi-minute crawl; SSE failure = persistent `role=alert` + Retry.
- ★ `#/pipeline`: every per-row `▶`/`✕` has a URL-disambiguated
  `aria-label`; preview is a labelled `role=region aria-live`;
  fetch-fail is a distinct `role=alert`.
- `#/tracker`: `th scope=col`; Date/Score/Status sortable buttons +
  `aria-sort` (reset scoped to sortable headers); localized
  destructive labels with no trailing dash on empty company/role.
- `#/help`: single `<h1>`; labelled + filterable TOC; focus-on-anchor;
  back-to-top carries the canonical `.back-to-top` class.
- ★ `#/batch`: the TSV `<textarea>` has an `aria-label` (a
  description via `aria-describedby` is **not** a name).
- `#/auto`, `#/evaluate`: run-button busy state + `aria-busy`;
  HTTP-fail surfaces an actionable message both inline AND as a
  toast; clipboard has an async fallback; eval result is `role=status`.

## §3 — Config: API-keys, providers & the "OR" model (v1.55.0)

`#/config` → API-keys tab: structured field-form over the parent
`.env`, opening with a note explaining career-ops is CLI-agnostic
(Claude Code · Codex · Gemini · OpenCode · Qwen · Copilot · Kimi)
while the web-ui ⚡ eval is headless and key-driven.

- `LLM_PROVIDER` select MUST offer `auto · claude · gemini · openai ·
  qwen`. `auto` = first provider whose key is set, preferring
  **Anthropic → Gemini → OpenAI → Qwen** (`providerOrder()`); an
  explicit value pins exactly one; forced + no key ⇒ manual prompt.
- Per-provider model `<select>`s for Anthropic, Gemini, OpenAI
  (`OPENAI_MODEL`, default `gpt-5-codex`) and Qwen (`QWEN_MODEL`,
  default `qwen-max`). `*_API_KEY` ∈ `SECRET_KEYS` (masked, never
  logged); `*_MODEL` and `LLM_PROVIDER` are **not** secret.
- `KNOWN_KEYS` includes `ANTHROPIC_*`, `GEMINI_*`, `OPENAI_*`,
  `QWEN_*`, `LLM_PROVIDER`, `PORT`, `HOST`; all LLM keys are
  `KEY_GROUPS.core`. Saving applies live — honoured **without a
  server restart** (see §6).
- The "works via OR" contract: with ONLY one of the four keys set,
  `#/evaluate` ⚡ run-live MUST succeed via that provider; the result
  header reports which (`anthropic`/`gemini`/`openai`/`qwen`). Same
  for `#/deep`, `#/mode/:slug`, and the `#/auto` pipeline. No key
  anywhere ⇒ the copy-paste manual prompt, never a hard error.

## §4 — Config: Modes canonical-schema field-form

`#/config` → Modes tab MUST render the **5 canonical career-ops.org
§Step-5 fields in documented order** — Target Roles / Adaptive
Framing / Comp Targets (repeatable labelled line-inputs), Exit
Narrative / Location Policy (labelled prose textareas) — **even when
the parent `modes/_profile.md` is empty, a stub, or non-schema**
(there must be NO "no sections — use raw editor" dead end). Each field
shows a description sourced from the canonical docs, wired via
`aria-describedby`. `## Your Target Roles` ≡ `## Target Roles`.
Save is tagged: existing-schema ⇒ non-destructive `{ sections }`
merge (preamble + untouched + custom sections byte-stable);
missing-schema ⇒ confirm-gated `{ markdown }` full rebuild. Raw
full-file editor remains the confirm-gated **Advanced** disclosure.
Verify a stub fixture round-trips: stub → 5 fields → fill → confirm →
all 5 canonical sections persisted, preamble + custom kept.

## §5 — Deploy hygiene

`GET` of any `.js`/`.mjs`/`.css`, static `index.html`, and the SPA
catch-all shell ⇒ `Cache-Control: no-store`. Non-code assets keep
default caching. Security headers unchanged: CSP (only when bound
beyond loopback) excludes `'unsafe-inline'`/`'unsafe-eval'`,
`frame-ancestors 'none'`; `X-Content-Type-Options: nosniff`;
`X-Frame-Options: DENY`; `Referrer-Policy: same-origin`.

## §6 — LLM routing honours the live parent `.env`

With a key ONLY in the parent `.env` (NOT in the server's boot
`process.env`): `#/evaluate` run-live MUST route to that provider —
never error on a different/stale one. `effectiveEnv()` resolves
keys/model as: non-empty `process.env` wins, else current parent
`.env`; detection (`hasAnthropicKey`/`hasGeminiKey`/`hasOpenAIKey`/
`hasQwenKey`) matches the key actually sent; no restart needed after
a `.env` / `POST /api/config` change. Walk the OR matrix: for each of
the 4 providers, set ONLY its key in `.env` and confirm a live eval
runs via exactly that provider (`anthropic`/`gemini`/`openai`/`qwen`
in the response). Keys are never logged or echoed — the no-leak
canary is green in `tests/anthropic.test.mjs` and
`tests/openai.test.mjs`.

## §7 — Streaming / disconnect hygiene

Every SSE endpoint (`/api/auto-pipeline`, `/api/stream/*`,
`/api/stream/scan-*`) survives a mid-stream client disconnect with
**no uncaughtException / unhandled rejection** server-side: `res`
has an `'error'` listener, writes are guarded on
`writableEnded||destroyed`, and `res.on('close')` aborts in-flight
`safeGet()` cleanly. The Playwright e2e job MUST be green with no
"asynchronous activity after the test ended".

## §8 — SSRF / input safety

`/api/pipeline`, `/api/pipeline/preview`, `/api/auto-pipeline` reject
loopback / `file://` / script-char / non-http(s) URLs via
`isValidJobUrl`, and fetch only through `safeGet` (DNS-pinned,
per-redirect re-validated, byte-capped). All CV/markdown ingress
routes through `stripDangerousMarkdown`. CV import rejects
non-allowed binary envelopes (415).

## §9 — i18n & docs parity (top-down vs career-ops.org)

- Every i18n key present in all 8 locales (`tests/i18n-coverage`).
- CHANGELOG ×8 at vX (`check-changelog-parity`); README ×8 badges
  at vX/N; `TESTING.md` totals at vX/N/files.
- Help bundles ×8: 17 H2 / 70 H3 parity gate green; the
  "App settings & API keys" section describes the Modes **field-form**
  + the OpenAI/Codex model selector (not raw markdown).
- `CLAUDE.md` (route-module count, version) and
  `.claude/PROJECT-CONTEXT.md` (repo-state + test baseline) reflect
  reality.
- Spot-check each in-scope screen against its career-ops.org/docs
  page (Quick Start, What-is, Scan, Apply, Batch, Playwright + the
  Reference nav: Modes, auto-pipeline, pipeline, oferta(s), contacto,
  deep, interview-prep, pdf, training, project, tracker, patterns,
  followup, Portals). Any divergence in *documented behaviour* → a
  one-fix ship.

## §10 — Pyramid & shell surface

`bin/*.sh`, `.githooks/*`, `scripts/*.mjs` covered by
`tests/sh-files.test.mjs`. Coverage floor ≥ 80 % line / branch on
non-trivial logic (`npm run test:coverage`). unit → integration →
acceptance → e2e all green.

## §11 — v1.55.x→v1.56.4 consolidated UX-fix invariants (regression-locked)

The 2026-05-14→18 audit's 12 UX findings + 2 v1.55.0 a11y findings
shipped one-fix-per-release (v1.55.1→v1.56.0); the follow-on
`qa/FIX-PROMPT-FINAL.md` cycle then closed an a11y focus-ring
regression (v1.56.1), UX-N1 (v1.56.2), a reported key-detection
trust bug (v1.56.3) and UX-N2 (v1.56.4). Each has a dedicated
`tests/*.test.mjs` static guarantee — none may regress. Spot-verify
the ★ ones live.

- ★ **`#/auto` stepper pre-render** (F-V55-E/UX-1, **CLOSED v1.55.1**):
  `<ol.auto-stepper>` shows the 5 documented stages (validate → fetch
  → evaluate → save report → add tracker) in `pending` state **on
  mount**, before any Run click; labelled `auto.stepperAria`.
  `tests/auto-stepper-prerender.test.mjs`.
- ★ **`#/cv` editor accessible name** (F-V55-H/UX-5, **CLOSED
  v1.55.2**): `#cv-editor` has a descriptive `aria-label`
  (`cv.editorAria` ×8); no redundant `aria-labelledby`.
  `tests/cv-editor-a11y.test.mjs`.
- ★ **4-provider OR onboarding** (UX-2, **CLOSED v1.55.3**):
  `GET /api/status/providers` → `{activeProvider, activeModel,
  keysConfigured}`; SPA `#onboarding-banner` shows a red banner (0
  keys, CTA → `#/config?tab=api-keys`) or a quiet active-provider
  chip (≥1). `selectActiveProvider()` honors the `LLM_PROVIDER` pin.
  `tests/onboarding-key-banner.test.mjs`.
- **`#/auto` ETA + `#/scan` Stop prominence** (UX-6, **CLOSED
  v1.55.4**): `.auto-eta` "~1–2 min" next to Run; `setScanRunning`
  flips Stop `btn-ghost`↔`btn-danger` while `aria-busy`.
  `tests/auto-eta-stop.test.mjs`.
- **`#/dashboard` hero** (UX-3, **CLOSED v1.55.5**): `.dash-hero`
  with the 2 P0 CTAs (`.btn-hero`) + a focal last-eval hint precedes
  the Quick-actions grid; status buckets are `.dash-chip`.
  `tests/dashboard-hero.test.mjs`.
- **`#/scan` Advanced-filters disclosure** (UX-4, **CLOSED
  v1.55.6**): free-text + remote stay visible; scope + source + the
  post-scan facet chips collapse behind a `<details.scan-advanced>`.
  `tests/scan-advanced-disclosure.test.mjs`.
- **`#/pipeline` virtualization** (UX-7, **CLOSED v1.55.7**): at
  `>VIRTUALIZE_THRESHOLD` (1000) rows the list is a 70vh scroll
  viewport with a `flex:0 0 auto` spacer (full scroll range) +
  rAF-throttled window (≤threshold keeps the simple render
  byte-for-byte); rows keep URL-disambiguated ▶/✕ aria-labels.
  `tests/pipeline-virtualize.test.mjs`.
- **`#/tracker` server-side pagination + funnel** (UX-8, **CLOSED
  v1.55.8**): `GET /api/tracker` with no params ⇒ exactly `{rows}`
  (back-compat); `?page&pageSize&status` ⇒ `{rows,total,page,
  pageSize,funnel}` (pageSize≤500, whole-history funnel); clickable
  `.tracker-chip` funnel bar drives the Status filter.
  `tests/tracker-server-paged.test.mjs`.
- **LOW polish bundle** (**CLOSED v1.56.0**): UX-9 `#/cv` title is a
  single-`<h1>` `.cv-breadcrumb` chip (F-V54-A intact);
  UX-10 shared `UI.providerCostHint(t)` cost ballpark next to ⚡ Run
  live on auto/evaluate/deep/`<mode>` (reuses
  `/api/status/providers`; `cost.estimate`/`cost.manual` ×8);
  UX-11 `#/help` TOC filter → exactly-1-match 300ms-debounced
  autoscroll; UX-12 first-paint `<h1>` is `tabindex=-1` + `#content`
  `aria-live=polite` **without** stealing focus (v1.41.0 skip-link
  contract preserved). `tests/{cv-breadcrumb,run-cost-line,
  help-toc-autoscroll,dashboard-initial-focus}.test.mjs`.
- **a11y focus-ring fix** (**CLOSED v1.56.1**): router-managed
  `tabindex="-1"` heading focus no longer paints the brand
  `*:focus-visible` ring (a red box around every view's `<h1>`,
  baked into the dashboard screenshots). Scoped rule
  `[tabindex="-1"]:focus,[tabindex="-1"]:focus-visible{outline:none}`;
  global keyboard ring intact (WCAG 2.4.7).
  `tests/managed-focus-no-ring.test.mjs`.
- **UX-N1 per-route title** (**CLOSED v1.56.2**): `router.js`
  `focusNewView()` sets a per-route, locale-aware `document.title`
  from the view `<h1>` before the first-paint guard (multi-tab /
  bookmarks / SR page-change). `tests/document-title-per-route.test.mjs`.
- **key-detection plausibility** (**CLOSED v1.56.3**): a placeholder /
  too-short secret in a parent `.env` is no longer reported "✓ set"
  or mis-selected as the active provider. New pure `isUsableKey()`
  (≥20 chars + not a known placeholder) gates
  `has{Anthropic,Gemini,OpenAI,Qwen}Key()` and the `/api/health`
  key rows (now on the same effective+plausible view as
  `/api/status/providers`). `tests/key-detection-rejects-placeholder.test.mjs`.
  *(Field note: if `career-ops/.env` pins `LLM_PROVIDER` to a
  provider with no real key, `activeProvider` is correctly `null` —
  that is honest, not a regression; it is the user's `.env` to fix.)*
- **UX-N2 ⌘K hint** (**CLOSED v1.56.4**): a visible, platform-aware
  `<kbd class="kbd-shortcut">` (⌘K macOS/iOS · Ctrl K else) inside
  the `.searchbar`; `aria-hidden` (aria-label already announces it),
  keybinding unchanged. `tests/cmdk-hint-visible.test.mjs`.
- **Pipeline AI-review** (workflow, regression-locked by file): the
  `.github/workflows/ai-review.yml` `push-review` job runs on every
  push to `main` and posts an advisory commit comment (fail-soft;
  needs the `ANTHROPIC_API_KEY` repo secret to post — without it it
  logs a clear skip and stays green). ci.yml remains the hard gate;
  `scripts/ai-precommit-review.mjs` is the local advisory layer.
- **Senior obs ledger:** S-7 closed v1.54.6 · W-001 closed v1.54.7 ·
  S-1→UX-3 (v1.55.5) · S-2→UX-7 (v1.55.7) · S-3→UX-4 (v1.55.6) ·
  S-4→F-V55-E/UX-1 (v1.55.1) · S-5→UX-9 (v1.56.0) · S-6→UX-8
  (v1.55.8).
- **G-005** (cross-repo, **OPEN — blocked on parent**): the only
  remaining backlog item. `server/lib/prompts.mjs` still references
  the A-G `modes/oferta.md` schema *because the parent still emits
  A-G*; the web-ui A-F flip must land **after** the parent
  `santifer/career-ops` commit (see `qa/G-005-closure-kit.md`
  STEP 1) or the model gets contradictory instructions. Renderer is
  schema-tolerant; help §9 ×8 already canonical A-F (v1.15.0).

---

### Exit criteria

§0 gate green · §1–§11 every MUST satisfied · `git status` clean ·
tag `vX` on `origin/main` with the latest CI green on all 4 jobs · no
open MEDIUM/HIGH finding (the consolidated v1.55.x→v1.56.0 fix-prompt
AND the follow-on `qa/FIX-PROMPT-FINAL.md` cycle — a11y focus-ring
v1.56.1, UX-N1 v1.56.2, key-detection trust fix v1.56.3, UX-N2
v1.56.4 — are all fully closed; **G-005** is the sole open item,
MINOR, cross-repo, blocked on the parent commit). New findings → one-fix ships
(HIGH→MEDIUM→LOW), each fully shipped (bump + CHANGELOG ×8 + test +
Playwright-verify + AI-review LGTM + CI-watch) before the next.
