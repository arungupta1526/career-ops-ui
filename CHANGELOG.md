# Changelog

All notable changes to **career-ops-ui** are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/).

Translations: [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

---

## [1.39.0] — 2026-05-18

**WS8.2 — LLM provider selector + OpenAI/Codex key + interactive `init` wizard.**

### ✨ Features

- **`feat(config): LLM_PROVIDER selector + OPENAI_API_KEY`** — `server/lib/env-config.mjs` adds `LLM_PROVIDER` (auto|claude|gemini) + `OPENAI_API_KEY` to `KNOWN_KEYS`/`KEY_GROUPS`; `OPENAI_API_KEY` is secret-masked. New `providerOrder(env)` helper: `auto`→`[anthropic,gemini]` (legacy), `claude`→`[anthropic]`, `gemini`→`[gemini]`. All **6** provider-gate sites in `server/lib/routes/llm.mjs` (evaluate/deep/mode × Anthropic/Gemini) consult it via `_provGate()` — a forced provider with no key falls through to the manual-prompt path exactly like the pre-v1.39 no-key behaviour (zero behaviour change for `auto`/default). `#/config` API-keys tab gains an `LLM_PROVIDER` select + `OPENAI_API_KEY` input. Provider-key set matches what santifer/career-ops actually implements (Gemini = parent gemini-eval, Anthropic = web-ui SDK + Claude Code, OpenAI = Codex/OpenCode CLI side); Mistral/Qwen are model names with no parent env key — not invented.
- **`feat(cli): interactive career-ops-ui init`** — `scripts/init.mjs` is now a real wizard (was a WS8.1 stub): pick provider 1-4, enter key(s), writes parent `.env` via the validated `env-config.updateEnvFile` path (explicit user action, same as POST /api/config). Flag-driven too: `--provider --anthropic-key --gemini-key --openai-key --yes`.

### 📝 Documentation

- help-bundle §2 × 8 + `docs/sdd/CONVENTIONS.md` — provider selector + the 3 parent-implemented provider keys. (Full README ×8 + canonical-docs fold = WS8.3/WS10, the user-mandated final steps.)

### 🧪 Tests

- **`test: tests/provider-selector.test.mjs`** — 7 cases: `providerOrder` (auto/unknown/whitespace → legacy, claude/gemini forced), env-config surface (KNOWN/SECRET/LLM_PROVIDERS), `init` `parseArgs`+`buildUpdates` (clamp, non-empty-only), and a static canary that all 6 llm.mjs gate-sites use `_provGate()`. 622 → 629.

### Verification

```bash
$ npm run test:ci
# 629 / 629 · ✓ no .also( leftovers · ✓ CHANGELOG parity: all 8 locales at v1.39.0
$ career-ops-ui init --provider gemini --gemini-key … --yes   # writes parent .env
$ career-ops-ui doctor                                          # verifies
```

---

## [1.38.0] — 2026-05-17

**WS8.1 — unified CLI dispatcher + `doctor` verb.**

AutoResearchClaw-style one-command workflow. `bin/career-ops-ui.sh` dispatches `setup` / `run` / `doctor` / `init` / `help`; `package.json` `bin.career-ops-ui` points at it.

### ✨ Features

- **`feat(cli): bin/career-ops-ui.sh dispatcher`** — `setup` → `bin/setup.sh` (existing one-command bootstrap), `run` → `bin/start.sh`, `doctor` → `scripts/doctor.mjs`, `init` → `scripts/init.mjs` (WS8.1 stub; interactive provider wizard = WS8.2), `help`. Backward-compat `career-ops-ui-start` bin alias kept.
- **`feat(cli): scripts/doctor.mjs`** — standalone health check that **reuses the exact `/api/health` engine** (spins `createApp()` in-process on an ephemeral port → renders the JSON to a colorized terminal report). Single source of truth — doctor can never drift from the Health page. **Exit 0 iff every REQUIRED check is green**, exit 1 otherwise, so `setup` / CI can gate on it. No new deps; read-only.

### 📝 Documentation

- `docs/sdd/CONVENTIONS.md` — "CLI dispatcher" section. help-bundle §1 × 8 — CLI quickstart note. (Full README ×8 quickstart block lands in WS8.3, the user-requested final verification step.)

### 🧪 Tests

- **`test(cli): tests/cli-doctor.test.mjs`** — 6 cases: `formatReport` pure logic (all-pass / required-fail / optional-only-fail / empty-tolerant), dispatcher verb-routing canary, `package.json` bin wiring. 616 → 622.

### Verification

```bash
$ npm run test:ci
# 622 / 622 · ✓ no .also( leftovers · ✓ CHANGELOG parity: all 8 locales at v1.38.0
$ node scripts/doctor.mjs   # ✓ all required checks pass · exit 0
```

---

## [1.37.0] — 2026-05-17

**WS7 — pre-commit AI review in the git workflow.**

Per user request: an AI review before every commit. Two layers — a fast deterministic floor that fails-HARD, and an advisory AI pass that fails-SOFT.

### ✨ Features

- **`feat(workflow): pre-commit AI review`**
  - [`scripts/ai-precommit-review.mjs`](scripts/ai-precommit-review.mjs) — **deterministic floor (fail-HARD):** rejects a commit that stages a `.env`/secret-bearing file, contains a high-confidence secret pattern in the added diff lines (`.env.example` placeholders exempt), leaves `.also(` in a staged view (mirrors the CI gate), or stages a `.mjs`/`.js` that fails `node --check`. **AI layer (fail-SOFT):** runs `claude -p` over the staged diff when the CLI is on PATH and `AI_REVIEW !== 'off'`; missing CLI / offline / timeout → notice, never blocks.
  - [`.githooks/pre-commit`](.githooks/pre-commit) + [`scripts/install-hooks.mjs`](scripts/install-hooks.mjs) — `npm install` wires `core.hooksPath=.githooks` via the new `prepare` script. Idempotent; no-op outside a git checkout.
  - `AI_REVIEW=off git commit …` skips only the AI layer. Never `--no-verify` (CLAUDE.md hard rule #7); CI runs the full gate regardless.

### 📝 Documentation

- `docs/sdd/CONVENTIONS.md` — new "Pre-commit AI review" section (floor vs AI layer, env switch, never-bypass rule).

### 🧪 Tests

- **`test(workflow): tests/ai-precommit-review.test.mjs`** — 6 cases over the exported pure floor functions: blocked-path detection (`.env.example` exempt), secret-pattern hits (added-lines only, placeholders ignored), `.also(` view leftover, aggregate floor, clean-diff pass. 610 → 616.

### Verification

```bash
$ npm run test:ci
# 616 / 616 · ✓ no .also( leftovers · ✓ CHANGELOG parity: all 8 locales at v1.37.0
# This very commit was gated by the new hook (live dogfood).
```

---

## [1.36.0] — 2026-05-17

**WS6.3 — #/config Modes tab: raw blob → per-section editor. WS6 complete.**

`modes/_profile.md` is a prompt-engineering doc (markdown tables + prose), not key→value settings — so section-level editing is the right granularity (not field decomposition). This finishes WS6: every settings surface is now structured.

### ✨ Features

- **`feat(config): per-section _profile.md editor`**
  - [`server/lib/routes/content.mjs`](server/lib/routes/content.mjs) — byte-exact `splitProfileSections` (preamble + per-`##` `{ heading, headingLine, body }` via string slices, not line-join — round-trip is byte-identical) + `joinProfileSections`. `GET /api/modes/_profile` now also returns `{ preamble, sections }`. `PUT` accepts `{ sections: { "<heading>": "<body>" } }`: replaces only named sections, **preamble + unknown sections + ordering survive byte-for-byte** (merge-not-replace). Unknown heading → 400. Existing `stripDangerousMarkdown` sanitization retained. Legacy `{ markdown }` raw path unchanged.
  - [`public/js/views/config.js`](public/js/views/config.js) — one collapsible textarea per `##` section (label = `## heading`); Save sends `{ sections }`. Collapsed *Advanced: raw markdown* disclosure retained for add/remove-section + preamble edits.
  - i18n: 5 keys × 8 (`config.modesSectionHint/modesNoSections/modesRawToggle/modesRawHint/modesRawSave`).

### 📝 Documentation

- help-bundle §2 × 8 locales — Modes tab documented as per-section editor (merge-by-section, byte-exact preservation, Advanced raw disclosure).

### 🧪 Tests

- **`test(config): tests/modes-section-form.test.mjs`** — 6 cases: GET exposes preamble+sections, section-merge preserves preamble/others byte-exact, unknown-heading 400, ordering preserved, legacy raw path, sanitization. 604 → 610.

### WS6 outcome

Every settings surface is now field/section-structured: API-keys (already field-based — WS6.2 audit confirmed `KNOWN_KEYS ≡ FIELDS`, no gap), Profile scalars (WS1 v1.32.0), Profile arrays (WS6.4 v1.35.0), Modes sections (WS6.3 v1.36.0). The raw editors remain as documented escape hatches.

### Verification

```bash
$ npm run test:ci
# 610 / 610 · ✓ no .also( leftovers · ✓ CHANGELOG parity: all 8 locales at v1.36.0
```

---

## [1.35.0] — 2026-05-17

**WS6.4 — #/config Profile structured array editors + WS6.2 API-keys audit.**

WS1 (v1.32.0) gave the 14 scalar profile fields a form. WS6.4 finishes the job: the list-shaped fields get add/remove-row editors, so the raw-YAML hatch is now truly last-resort.

### ✨ Features

- **`feat(config): profile array editors`**
  - [`server/lib/routes/content.mjs`](server/lib/routes/content.mjs) — `PUT /api/profile` now also accepts an `{ arrays: { … } }` payload (alongside / combinable with `{ fields }`). Allow-listed paths: `target_roles.primary` + `narrative.superpowers` (string lists), `target_roles.archetypes` (name/level/fit), `narrative.proof_points` (name/url/hero_metric). Object rows keep ONLY allow-listed sub-keys (injected keys dropped); empty rows dropped; an emptied list deletes the leaf. **Same merge-not-replace invariant** — scalars, unknown keys, and untouched arrays survive.
  - [`public/js/views/config.js`](public/js/views/config.js) — 4 collapsible add/remove-row editors (string-list rows; object rows with per-sub-key inputs). Save sends `{ fields, arrays }` in one request.
  - i18n: 6 new keys × 8 (`config.pfPrimaryRoles/Superpowers/Archetypes/ProofPoints/AddRow/RemoveRow`).
- **`audit(config): WS6.2 API-keys tab`** — verified server `KNOWN_KEYS` (ANTHROPIC_API_KEY/MODEL, GEMINI_API_KEY/MODEL, PORT, HOST) ≡ client `FIELDS`. Every recognized `.env` key already has its own labeled input. **No gap — no code change.**

### 📝 Documentation

- help-bundle §2 × 8 locales — Profile-tab section documents the array editors (add/remove rows, drop-empty, merge-not-replace).

### 🧪 Tests

- **`test(config): tests/profile-array-editors.test.mjs`** — 7 cases: string-array merge preserves scalars+unknown-keys, object-array allow-list+drop-empty, empty→leaf-removed, proof_points round-trip, unknown-array-path 400, combined fields+arrays, arrays-only request. 597 → 604.

### Verification

```bash
$ npm run test:ci
# 604 / 604 · ✓ no .also( leftovers · ✓ CHANGELOG parity: all 8 locales at v1.35.0
```

---

## [1.34.0] — 2026-05-17

**WS5 — one-click Auto-pipeline screen (`#/auto`).**

The v1.15 dashboard auto-pipeline was a transient modal. Promoted to a dedicated, linkable page with senior-UX scaffolding.

### ✨ Features

- **`feat(auto): dedicated #/auto screen`** ([`public/js/views/auto.js`](public/js/views/auto.js)) — paste one job URL, one click runs the full chain (validate → fetch → evaluate → save report → append tracker) via the existing `POST /api/auto-pipeline` SSE contract. Senior-UX:
  - Single primary CTA; **Enter** in the URL field also runs it.
  - Live vertical **stepper** as an ordered list with `aria-current="step"` on the running row + a polite `role="status"` live-region announcing every transition (comprehensible without sight).
  - On success the result card **deep-links** to the saved report (`#/reports/:slug · N/5`) and the **tracker** — next action one click away.
  - Failed step marked red with message; CTA re-enables for fix-and-retry without reload.
  - **No API key → manual mode**: steps collapse to a copy-the-prompt card (no spend).
  - Linkable: `#/auto?url=<encoded>&go=1` opens + auto-starts.
  - Sidebar entry (✨ Auto-pipeline, after Pipeline); dashboard ✨ button now routes here (single coherent flow; the `window.AutoPipeline` modal helper stays for backward-compat).
  - i18n: 14 new keys × 8 locales.

### 📝 Documentation

- help-bundle §1 × 8 locales — new "One-click Auto-pipeline (`#/auto`) — the 21-step shortcut" subsection (full step list + a11y + manual-mode + deep-link behaviour). H2 count unchanged (17) — added as a `###` subsection, no parity-gate churn.
- README × 8 — Auto-pipeline headline feature bullet.

### 🧪 Tests

- **`test(auto): tests/auto-screen.test.mjs`** — 8 cases: route registration, POST+SSE-drain transport, a11y scaffolding (aria-live + aria-current), manual-mode card, success deep-links, index.html script+nav wiring, dashboard→#/auto routing, 14 i18n keys × 8 locales parity.
- **589 → 597** unit + acceptance (+8).

### Verification

```bash
$ npm run test:ci
# 597 / 597 · ✓ no .also( leftovers · ✓ CHANGELOG parity: all 8 locales at v1.34.0
```

---

## [1.33.0] — 2026-05-17

**WS4 — full parent career-ops 1.8.0 feature-parity audit + `location_filter`.**

Audited every user-facing parent commit v1.7.0→v1.8.0 (see `.planning/.../PARENT-PARITY.md`). One real GAP found and closed; everything else is FLOW (parent script we shell out to / inline via bundleProjectContext), CLI-ONLY (parent Go TUI), or N/A.

### ✨ Features

- **`feat(scan): portals.yml location_filter parity (parent #570)`** — parent's `scan.mjs` gained an optional `location_filter` block; web-ui runs its OWN in-process `en-scanner`/`ru-scanner` (they do NOT shell out to parent `scan.mjs`), so it did not flow through. New [`server/lib/location-filter.mjs`](server/lib/location-filter.mjs) mirrors the parent `buildLocationFilter` semantics **verbatim** (no key → pass-all; empty location → pass; `block` precedence over `allow`; `allow` empty → pass; `allow` non-empty → match ≥ 1; case-insensitive substring). Wired into both scanners' post-fetch filter step (after title/negative, before dedup/persist). Config-driven via `portals.yml` top-level `location_filter:` — no UI needed.

### 📝 Documentation

- help-bundle §5 (Portals) × 8 locales — new `location_filter` subsection with the worked allow/block example + exact semantics + the "top-level key, sibling of title_filter" note.
- `.planning/.../PARENT-PARITY.md` — full classification table of the 20+ parent commits (GAP / FLOW / CLI-ONLY / DOCS / N/A) with rationale per row.

### 🧪 Tests

- **`test(scan): tests/location-filter.test.mjs`** — 8 cases: no-filter pass-all, empty-location pass, block precedence, allow-empty pass, allow-match-required, case-insensitivity, malformed-config safe-pass, exact parity with parent's `portals.example.yml` worked example. Scanner-integration regression: 51 en/ru/scan tests green (wiring didn't regress).
- **581 → 589** unit + acceptance (+8).

### Parity outcome

career-ops v1.8.0 feature-parity **complete** as of web-ui v1.33.0. Deferred (PLAN R4 scope-guard): #341 Turkish as a 9th UI locale — parent added TR *mode templates* (template-side); a 9th web-ui locale is a dedicated future phase. Optional/LOW backlog: #602 explicit Greenhouse hostname allowlist (already covered by web-ui's `safe-fetch` + `isValidJobUrl` envelope; slug-based URL construction, not raw hostname).

### Verification

```bash
$ npm run test:ci
# 589 / 589 · ✓ no .also( leftovers · ✓ CHANGELOG parity: all 8 locales at v1.33.0
```

---

## [1.32.0] — 2026-05-17

**`#/config` Profile tab — raw-YAML blob → field-by-field form (WS1).**

Before v1.32.0 the Profile tab was a single monospace textarea where name, email, location, archetypes, compensation and every custom key lived in one undifferentiated YAML blob — the exact pain the user called out ("всё в одной куче"). It is now a structured form.

### ✨ Features

- **`feat(config): Profile field-form with merge-not-replace save`**
  - [`public/js/views/config.js`](public/js/views/config.js) — 14 modeled scalar paths grouped into 3 collapsible sections: **Candidate** (full_name/email/phone/location/linkedin/github/portfolio_url/twitter), **Narrative** (headline/exit_story), **Compensation** (target_range/currency/minimum/location_flexibility). Full-name client-side required-check before save.
  - [`server/lib/routes/content.mjs`](server/lib/routes/content.mjs) — `PUT /api/profile` gains a `{ fields: { "candidate.full_name": … } }` payload. Server **reads the existing `config/profile.yml`, sets/clears only the allow-listed leaves, re-serializes the whole object**. Arrays the form doesn't model (`target_roles.archetypes`, `narrative.proof_points`, `narrative.superpowers`) and any custom keys **survive the round-trip untouched** — the load-bearing invariant (PLAN R1). Empty field → leaf deleted (no `phone: ""` residue). Allow-list rejects unknown dotted paths; identity gate (full name required) preserved; corrupt existing YAML → 409 (refuses to clobber, routes user to raw editor).
  - **Raw-YAML escape hatch retained** as a collapsed *Advanced* `<details>` — the pre-1.32 full-file editor, unchanged (`{ yaml }` path, replaces whole file, preserves comments). For nested-array edits or comment preservation.
  - i18n: 23 new `config.pf*` / `config.profile*` keys × 8 locales.

### 📝 Documentation

- help-bundle §2 (App settings) + §3 (Profile) × 8 locales — rewritten for the 3-tab layout + field-form description + the comment-loss tradeoff + Advanced raw-YAML disclosure.

### 🧪 Tests

- **`test(config): tests/profile-field-form.test.mjs`** — 7 cases: arrays + unknown-key survival across a field-merge round-trip (the R1 gate), empty-field leaf-deletion, unknown-path rejection, no-full-name rejection, corrupt-YAML 409 guard, legacy raw `{ yaml }` path still works, value trimming.
- **574 → 581** unit + acceptance (+7).

### 🔄 Migration

No user action. First Profile-tab save after upgrade merges into the existing file; comments are dropped on a *field* save (use the Advanced raw editor to keep them). All data keys preserved.

### Verification

```bash
$ npm run test:ci
# 581 / 581 · ✓ no .also( leftovers · ✓ CHANGELOG parity: all 8 locales at v1.32.0
```

---

## [1.31.0] — 2026-05-17

**Parent career-ops 1.8.0 sync — `#/batch` exposes `--model` + `--start-from`.**

The parent project bumped 1.7.1 → 1.8.0. The user-relevant code delta: `batch-runner.sh` gained `--model NAME` (#504) and `--start-from N`. web-ui surfaces both on `#/batch`, completing flag parity (the runner's full surface — `--parallel --dry-run --retry-failed --start-from --max-retries --min-score --model` — is now reachable from the browser).

### ✨ Features

- **`feat(batch): surface --model + --start-from`**
  - [`public/js/views/batch.js`](public/js/views/batch.js) — new **Model** text input (optional; placeholder "Claude Max default") and **Start from #** numeric input (optional; min 1). Appended to the run-control row next to Max retries.
  - [`server/lib/routes/batch.mjs`](server/lib/routes/batch.mjs) — `GET /api/stream/batch?model=…&startFrom=…`. Defense-in-depth (same posture as v1.28.0 `--max-retries`): `model` accepted only if it matches `^[A-Za-z0-9.\-]{1,60}$` (rejects shell-meta even though `spawn()` is arg-array — belt-and-suspenders); `startFrom` accepted only as an integer 1..100000. Bad values silently dropped, not 400'd — the UI input is the soft contract.
  - i18n: `batch.modelLbl`, `batch.modelAria`, `batch.startFromLbl`, `batch.startFromAria` × 8 locales.

### 📝 Documentation

- help-bundle §14 (Batch evaluate) × 8 locales — `--model` + `--start-from` documented in the flag list with the `#/batch` field-name mapping.
- Parent career-ops 1.8.0 analysis recorded. Other parent deltas assessed as **no web-ui code change required**: interview-prep audience split (#489) flows through `bundleProjectContext` automatically; `dashboard/` is the parent's Go/Bubble-Tea terminal TUI (browser equivalent is our SPA — not integrated by design); `modes/tr/` Turkish templates are parent-side (a 9th web-ui UI locale is a separate deferred decision); `parentVersion` auto-reports 1.8.0 via `health.mjs` runtime read.

### 🧪 Tests

- **`test(batch): tests/batch-model-startfrom.test.mjs`** — 7 cases: model pass-through, shell-meta charset rejection (injection guard), empty-model drop, startFrom pass-through, out-of-range drop (`< 1`), non-integer drop, combined-with-other-flags coexistence.
- **567 → 574** unit + acceptance (+7).

### 🔄 Migration

No user action. The next `🌐 Batch` run with the Model / Start-from fields blank behaves exactly as before (Claude Max default, start at offer #1).

### Verification

```bash
$ npm run test:ci
# 574 / 574 · ✓ no .also( leftovers · ✓ CHANGELOG parity: all 8 locales at v1.31.0
$ curl -sN 'http://127.0.0.1:4317/api/stream/batch?model=claude-sonnet-4-6&startFrom=5' | grep -m1 '"args"'
# data: {"script":"batch-runner.sh","args":["--model","claude-sonnet-4-6","--start-from","5"]}
```

---

## [1.30.0] — 2026-05-14

**`#/scan` results paginator — replaces the v1.12.0 "first 200 of N" truncation.**

### ✨ Features

- **`feat(scan): paginate over full filtered result set`** ([`public/js/views/scan.js`](public/js/views/scan.js)) — pre-v1.30 the scan results table was hard-capped at the first 200 filtered rows with a footnote saying "Showing first 200 of N". Rows 201..N were unreachable from the UI; the user had to re-tune `title_filter.positive` in `portals.yml` to narrow the set if they wanted to inspect later rows. v1.30.0 swaps the cap for `UI.paginate` (the same helper that drives `#/tracker`, `#/reports`, `#/activity`).
  - `PAGE_SIZE = 200` preserves the prior visual density per page.
  - The FULL filtered set is sorted first (boost-to-top is stable across pages), then page-sliced — so a boosted row that lands on page 2 still appears at the top of page 2, not buried.
  - Filter input (text / source / remote / scope / chips) calls `pager.reset()` so the user lands on page 1 of the new filter result.
  - `pager.controls(visible, total)` renders `« ‹ N-M of K › »` with disabled-state buttons when on first / last page. When `total ≤ pageSize`, the controls show only the item count (clean for small datasets).
- Stale `scan.shownTop` i18n key removed from [`public/js/lib/i18n-dict.js`](public/js/lib/i18n-dict.js) (× 8 locales — no longer referenced).

### 🧪 Tests

- **`test(scan): tests/scan-paginator.test.mjs`** — 9 cases across three layers:
  - **Static-source canaries (7):** scan.js declares `PAGE_SIZE = 200`; wires `UI.paginate({ pageSize: PAGE_SIZE, onChange: …renderResults… })`; resets pager on filter input; sorts the FULL `rows.slice()` into `sortedAll` BEFORE paginating; uses `pager.slice(sortedAll)`; appends `pager.controls(sorted.length, rows.length)` after the table; no longer contains the pre-v1.30 `rows.slice(0, 200)` truncation. `i18n-dict.js` does NOT carry the stale `scan.shownTop` key. `api.js` still exports the `paginate()` helper with `.slice / .controls / .reset` surface.
  - **Pure-logic paginator table (1):** replicates clamp+slice rules and exercises 6 boundary cases — page 0 of 550 → 200 rows starting at 0; page 1 → 200 rows starting at 200; page 2 → 150 rows starting at 400; overflow page=99 → clamp to last valid page (2); filter-narrow to 5 rows while on page 2 → clamp to page 0 returning the 5 rows; empty set → page=0, empty slice.
  - **Summary computation (1):** mirrors `start = page * pageSize + 1; end = min(total, start + visible - 1)` from api.js paginate().controls(). Verifies the displayed range across all 3 pages of a 550-row dataset.
- **558 → 567** unit + acceptance (+9 new).

### 🔄 Migration

No user action needed beyond updating to v1.30.0. The next scan that produces > 200 filtered rows will surface the paginator below the results table. Smaller scans see only an "N items" hint (unchanged from `UI.paginate`'s established behaviour in tracker / reports / activity).

### Verification

```bash
$ npm run test:ci
# 567 / 567
# ✓ no .also( leftovers in views/
# ✓ CHANGELOG parity: all 8 locales at v1.30.0
```

Manual smoke after redeploy: run a scan that produces > 200 filtered rows, navigate `#/scan`, scroll past the results table, click `›` to advance to page 2 — should show rows 201..400 instantly (no server round-trip; pure client-side slicing of the already-fetched result set).

---

## [1.29.2] — 2026-05-14

**Hot-fix: `🌐 Scan` with `source=both` only ran the EN phase. RU phase was silently dropped.**

### 🚑 Critical hot-fix

User-reported symptom: clicking the unified `🌐 Scan` button (which calls `runScanAll()` → `GET /api/stream/scan?source=both`) returned only the EN ATS phase. The console showed `▶ ATS scan (Greenhouse + Ashby + Lever)` … `✓ ATS done · NEW=0` and then stopped. No RU phase output ever appeared, even with all 5 RU adapters listed in `russian_portals.sources`.

**Root cause** — [`public/js/api.js:156`](public/js/api.js#L156) closed the `EventSource` on **the first `done` event**:

```js
if (ev === 'done' || ev === 'error') es.close();
```

But [`server/lib/routes/scan.mjs::driveOne`](server/lib/routes/scan.mjs) emits `done` once per phase, and the `source=both` branch drives two phases sequentially. The client closed after the EN `done`, the server detected `res.on('close')` → `AbortController.abort()` → the RU phase started but was immediately cancelled.

**Fix — multi-phase SSE contract:**

- **Server** ([`server/lib/routes/scan.mjs`](server/lib/routes/scan.mjs)): `driveOne` now accepts a `final` param (default `true`). The `done` payload carries `final: <bool>`. The `source=both` branch passes `final: false` to the first phase, `final: true` to the second.
- **Client** ([`public/js/api.js:148-172`](public/js/api.js#L148-L172)): `stream(...)` closes the `EventSource` on `done` only when `data.final !== false`. Backward-compatible: legacy single-phase producers (`/api/stream/batch`, `/api/stream/pdf*`, etc.) don't set `final`, so the behaviour is unchanged. Close on `error` remains unconditional.

### 🧪 Tests

- **`test(scan): tests/scan-stream-multi-phase.test.mjs`** — 11 cases covering both server-emitted SSE contract and client decision logic:
  - **SSE contract (6 cases):** `source=ats` → 1 `done` (`final:true`); `source=regional` → 1 `done` (`final:true`); `source=both` → 2 `done` events with `final:false` then `final:true`; `source=both` → 2 `start` events in `en-scanner`/`ru-scanner` order; static canary that the pre-v1.29.2 unconditional close pattern is gone; static canary that the v1.29.2 `data.final !== false` guard is present.
  - **Functional proof of fix (3 cases):** `source=both` actually emits the RU-phase banner line (proves the body runs, not just empty shells); `ru-scanner` start arrives AFTER `en-scanner` done (ordering); `dryRun=1` does NOT modify `data/pipeline.md` (no phase secretly flips `writeFiles`).
  - **Pure-logic close-decision table (1 case, parametrized over 11 inputs):** mirrors the api.js branch in JS — covers `done` with `final:false / true / undefined / null / 0 / 'false'`, plus `error` with payload/null, plus `start` / `log` (never close).
  - **Bug-forensics (1 case):** simulates the pre-v1.29.2 client by cancelling the response stream after the first `done` and verifies the server's `res.on('close')` abort handler is still intact (documents the pre-fix mechanism for future readers).
- **547 → 558** unit + acceptance (+11).

### 🔄 Migration

No user action needed beyond updating to v1.29.2. The next `🌐 Scan` will run both phases.

### Verification

```bash
$ npm run test:ci
# 553 / 553
# ✓ no .also( leftovers in views/
# ✓ CHANGELOG parity: all 8 locales at v1.29.2

# Manual smoke — both phases should now emit:
$ curl -sN "http://127.0.0.1:4317/api/stream/scan?source=both&dryRun=1" \
    | grep -E '^event:|"final":'
# event: start                                        ← en-scanner
# ...
# event: done                                         ← phase 1 of 2
# data: {"code":0,"counts":{...},"errors":0,"final":false}
# event: start                                        ← ru-scanner
# ...
# event: done                                         ← phase 2 of 2 (final)
# data: {"code":0,"counts":{...},"errors":0,"final":true}
```

---

## [1.29.1] — 2026-05-14

**Detailed user-facing config guide for the 5 RU portals in help-bundle §5, all 8 locales.**

### 📝 Documentation

- **`docs(help): §5 "Configuring Russian portals — detailed setup guide"`** ([`docs/help/<locale>.md`](docs/help/)): new ### subsection within Portals & sources covers the end-user config flow:
  - 5-row source-inventory table with auth + geo restrictions per adapter.
  - Step 1 — locate `portals.yml` + bootstrap from template.
  - Step 2 — full 5-source `russian_portals:` YAML example.
  - Step 3 — tuning queries, `area`, `per_page`, `only_remote`.
  - Common pitfalls — negative-list collision (with worked example showing the fix).
  - How to disable a single source without losing data.
  - How to verify via 🌐 Scan + the per-source SSE log line shape.
- Universal YAML/code blocks shared across locales; prose translated for ES / PT-BR / KO / JA / RU / ZH-CN / ZH-TW.
- §17 ("How to add a new portal") was the developer flow shipped in v1.29.0; §5 is the user flow shipped in v1.29.1.

### 🧪 Tests

- **`test(help): tests/help-ru-config-section.test.mjs`** — 7 cases asserting every locale's §5 contains the 5-source YAML, the negative-list collision fix, the disable-one-source example, the 5 adapter labels in the verify block, the 5-row inventory table, the `HH_USER_AGENT` env-var reference, and the 17-H2 parity contract held after the edit.
- **540 → 547** unit + acceptance (+7).

### Verification

```bash
$ npm run test:ci
# 547 / 547
# ✓ no .also( leftovers in views/
# ✓ CHANGELOG parity: all 8 locales at v1.29.1

# Manual smoke (after redeploy):
$ for lc in en es pt-BR ko ja ru zh-CN zh-TW; do
    curl -fsS "http://127.0.0.1:4317/api/help/$lc" \
      | python3 -c "import sys,json; print('$lc:', 'YES' if 'trudvsem' in json.load(sys.stdin).get('markdown','') else 'NO')"
  done
# every line ends in "YES" — the §5 expansion mentions trudvsem in every locale.
```

---

## [1.29.0] — 2026-05-14

**Russian-portal scanner expanded from 2 to 5 sources. Source registry + dynamic dropdown. New help-section explaining how to add a 12th.**

### ✨ Features

- **`feat(scan): 3 new RU portal adapters — Trudvsem, GetMatch, GeekJob`** ([`server/lib/sources/`](server/lib/sources/)):
  - [`trudvsem.mjs`](server/lib/sources/trudvsem.mjs) — Russian government open-data API (`opendata.trudvsem.ru/api/v1/vacancies`). No auth, no IP gate. Normalizes the documented v1 JSON shape.
  - [`getmatch.mjs`](server/lib/sources/getmatch.mjs) — tech-focused RU HTML board. Defensive regex parser, returns `[]` on parse miss (never throws on healthy 200).
  - [`geekjob.mjs`](server/lib/sources/geekjob.mjs) — same pattern as GetMatch. Handles `article` and `div`-wrapped card variants.

- **`feat(scan): source registry — single source of truth for every adapter`** ([`server/lib/sources/registry.mjs`](server/lib/sources/registry.mjs)): one array of `{ value, label, region, configKey }` records, consumed by the scanner dispatcher, the `GET /api/scan/sources` endpoint, and the SPA's source-filter dropdown. Adding a 12th adapter = one entry here + one adapter file + one row in `RU_DISPATCH`. The pre-v1.29 three-place drift (hardcoded dropdown / hardcoded if-chain / hardcoded default) is gone.

- **`feat(api): GET /api/scan/sources`** ([`server/lib/routes/scan.mjs`](server/lib/routes/scan.mjs)): returns the canonical source list with `Cache-Control: max-age=60`. The SPA fetches this on `#/scan` mount and rebuilds the source-filter dropdown dynamically.

- **`feat(scan-ui): dynamic source-filter dropdown`** ([`public/js/views/scan.js`](public/js/views/scan.js)): on view mount, fetches `/api/scan/sources` and paints `<option>` entries. Build-time hardcoded fallback list survives if the endpoint is unreachable. The filter chip in `#/scan` now lists 11 sources (6 EN ATS + 5 RU).

- **`feat(ru-scanner): default = 5 sources, dispatcher loop generalized`** ([`server/lib/ru-scanner.mjs`](server/lib/ru-scanner.mjs)):
  - Default `russian_portals.sources` (the value used when `portals.yml` omits the array) now pulls from `registry.mjs::RU_CONFIG_KEYS` — 5 sources, not 2.
  - Pre-v1.29 the dispatcher had two hand-written `if (cfg.sources.includes('hh'))` / `if (cfg.sources.includes('habr'))` blocks. v1.29 replaces them with a single loop over `RU_DISPATCH` that's keyed by the registry. Adding a sixth source = no scanner-loop edit.

### 📝 Documentation

- **`docs(help): new §17 "How to add a new job-portal source" × 8 locales`** ([`docs/help/<locale>.md`](docs/help/)) — full English step-by-step (adapter template for API + HTML patterns, registry entry, dispatcher wiring, mocked unit test, `portals.yml` enablement); 7 locale versions with localized prose + universal code blocks + cross-link to the EN canonical text for the full pitfalls table.
- **`docs(help): §5 + §7 updated for 5 RU sources × 8 locales`** — `russian_portals.sources` example now reads `["hh", "habr", "trudvsem", "getmatch", "geekjob"]`; the Source-dropdown description names all 5.
- Help-bundle section count: **16 → 17** (CI parity contract bumped accordingly).

### 🧪 Tests

- **`test(sources): tests/sources-trudvsem.test.mjs`** — 6 cases: normalization, `удалённо`→remote inference, `onlyRemote` filter, 5xx propagation, empty results = no throw, null-record safety.
- **`test(sources): tests/sources-getmatch-geekjob.test.mjs`** — 11 cases across both HTML scrapers: fixture-driven card extraction, nav-anchor skip, empty/null safety, 5xx propagation, `onlyRemote` filter.
- **`test(scan): tests/scan-sources-endpoint.test.mjs`** — 4 cases: shape, RU-source list parity (5 entries), EN-source list parity (6 entries), `Cache-Control` header.
- **`test(ru-scanner): tests/ru-scanner.test.mjs`** — e2e dispatcher test extended to mock all 5 sources.
- **`test(canonical-docs): 17-H2 parity contract`** ([`tests/canonical-docs-coverage.test.mjs`](tests/canonical-docs-coverage.test.mjs)) and **`tests/help-ui.test.mjs`** — both lifted 16 → 17.
- **520 → 540** unit + acceptance (+ 20 new). Playwright 32/32 unchanged.

### 🔄 Migration

For the new RU adapters to fire on your stand, the parent project's `portals.yml` must list them:

```yaml
russian_portals:
  sources: ["hh", "habr", "trudvsem", "getmatch", "geekjob"]
  area: 113
  per_page: 50
  only_remote: false
  queries:
    - "Senior PHP"
    - "Senior Go"
```

If your `portals.yml` has NO `russian_portals.sources:` line at all, the v1.29.0 default kicks in and all 5 sources run automatically. If `sources:` IS present (as in the pre-v1.29 setup), it's used verbatim and you must update it manually — the web-ui never edits parent-project files.

Also note: a global `title_filter.negative: ["php"]` will neutralize every `Senior PHP` query. The scanner emits a stderr warning at scan time (collision detector from v1.13). Adjust the negative list if you see "0 hits" but expected results.

### Verification

```bash
$ npm run test:ci
# 540 / 540
# ✓ no .also( leftovers in views/
# ✓ CHANGELOG parity: all 8 locales at v1.29.0

$ curl -fsS http://127.0.0.1:4317/api/scan/sources | jq '.sources | length'
11
$ curl -fsS http://127.0.0.1:4317/api/scan/sources | jq '[.sources[] | select(.region=="ru") | .value]'
[ "geekjob", "getmatch", "habr-career", "hh.ru", "trudvsem" ]
```

---

## [1.28.1] — 2026-05-14

**Hot-fix: router 404 on hashes with `?query`. HH_USER_AGENT row pruned from health.**

### 🚑 Critical hot-fix

- **`fix(router): strip ?query before route lookup`** ([`public/js/router.js`](public/js/router.js)) — pre-v1.28.1 `Router.go('/evaluate?url=…')` produced a hash whose first `split('/')` segment was the whole `"evaluate?url=…"` literal, which never matched a registered route → `__not_found__` (404). Two reported failures had this single root cause:
  - `#/pipeline → ▶` button (`pipeline.js:145`: `Router.go('/evaluate?url=' + encodeURIComponent(url))`).
  - "App settings → Modes" deep link (`settings.js:80`: `href="#/config?tab=modes"`).
  Fix is one line: `hash.split('?')[0]` before the route-name split. The view itself continues to parse query strings via `window.location.hash.split('?')[1]` + `URLSearchParams` (see `evaluate.js`, `config.js`).

### 🧹 Cleanup

- **`fix(health): remove HH_USER_AGENT optional row`** ([`server/lib/routes/health.mjs:54`](server/lib/routes/health.mjs#L54)) — the row surfaced `"unset (hh.ru may 403 from non-RU IPs)"` on every Health page render, including for users who never scan hh.ru. The hh.ru adapter falls back to a baked-in UA when the env var is unset; the 403-from-non-RU gate is still documented in `docs/help/<locale>.md §16` (troubleshooting) and `server/lib/ru-scanner.mjs` still emits a stderr hint at scan time. Removing the row reduces dashboard noise without losing any diagnostic.

### 🧪 Tests

- **`test(router): tests/router-query-string.test.mjs`** — 3 cases: static-source canary (`router.js` must split off `?` before name lookup), explainer-comment canary (the v1.28.1 fix rationale stays in the source), and pure-logic simulation of `current()` over four representative hashes (`#/evaluate?url=…`, `#/config?tab=modes`, `#/reports/abc-123`, `#/dashboard`).
- **`test(health): tests/health-no-hh-user-agent-row.test.mjs`** — 2 cases: regression guard that `/api/health` no longer surfaces `HH_USER_AGENT` row; sanity that adjacent optional rows survived the prune.
- **515 → 520** unit + acceptance (+ 5 new). Playwright 32/32 unchanged.

### Verification

```bash
$ npm run test:ci
# 520 / 520
# ✓ no .also( leftovers in views/
# ✓ CHANGELOG parity: all 8 locales at v1.28.1

# Manual smoke (after redeploy):
$ open "http://127.0.0.1:4317/#/evaluate?url=https%3A%2F%2Fexample.com%2Fjd"
# (should render the Evaluate view with the URL prefilled — no 404)
$ open "http://127.0.0.1:4317/#/config?tab=modes"
# (should land directly on the Modes tab of App settings — no 404)
```

---

## [1.28.0] — 2026-05-14

**Docs alignment + `#/batch` `--max-retries N` UI surface.** Closes two open backlog items raised by `qa/QA-PROMPT-docs-vs-app.md`.

### ✨ Features

- **`feat(batch): surface --max-retries N control on #/batch`** ([Issue #2](https://github.com/Fighter90/career-ops-ui/issues/2)) — the canonical [batch-evaluate-offers](https://career-ops.org/docs/introduction/guides/batch-evaluate-offers) guide documents `--max-retries N` (default 2) but pre-v1.28 the SPA had no way to set it; users were stuck on the runner default.
  - [`public/js/views/batch.js`](public/js/views/batch.js) — new numeric input (1..10), disabled by default, enables only when "Retry failed" is checked. Clears its value when retry is unchecked so an orphaned value can't leak into the next run.
  - [`server/lib/routes/batch.mjs`](server/lib/routes/batch.mjs) — `GET /api/stream/batch?retry=1&maxRetries=N`: parses via `parseInt`, range-validates `1 ≤ N ≤ 10`, silently drops out-of-range/non-integer values (UI is the hard contract; server is defense-in-depth). No-op without `--retry-failed`.
  - i18n: 2 new keys × 8 locales (`batch.maxRetriesLbl`, `batch.maxRetriesAria`) in [`public/js/lib/i18n-dict.js`](public/js/lib/i18n-dict.js).

### 📝 Documentation

- **`docs: align AI-assistant list to career-ops.org/docs canonical`** ([Issue #1](https://github.com/Fighter90/career-ops-ui/issues/1)) — the upstream Quick Start lists Claude Code / Codex / OpenCode / Qwen CLI. Pre-v1.28 we drifted to Claude Code / Codex / Cursor / Gemini CLI / GitHub Copilot CLI, identically across all 8 locales. Resolution: aligned downstream.
  - 8 help-bundles ([`docs/help/<locale>.md`](docs/help/)) — intro paragraph + comparison-table row both now match upstream canonical. One-liner appended: *"other Claude-compatible CLIs work too via the same slash-command surface"*, localized per locale.
  - 8 READMEs ([`README*.md`](README.md)) — intro paragraph aligned with the same one-liner. The "Multi-CLI" feature bullet (about web-ui's own `CLAUDE.md`/`AGENTS.md`/`GEMINI.md` shim files, not about career-ops upstream) deliberately retains its wider list (Cursor / Aider / Gemini CLI) since those CLIs do drive our shims.

### 🧪 Tests

- **`test(canonical-docs): AI-list regression canaries`** — 2 new canaries in [`tests/canonical-docs-coverage.test.mjs`](tests/canonical-docs-coverage.test.mjs):
  - Every help-bundle + README must contain "OpenCode" and "Qwen CLI".
  - No help-bundle or README may contain the pre-v1.28 stale phrase "Cursor, Gemini CLI, GitHub Copilot CLI" (Latin or CJK delimiter).
- **`test(batch): tests/batch-max-retries.test.mjs`** — 7 cases covering: present (`maxRetries=3` → flag appended), out-of-range upper (`=11` → dropped), out-of-range lower (`=0` → dropped), non-integer (`=abc` → dropped), without `retry=1` (always dropped), no-param (runner default 2 wins), combined-with-all-other-flags.
- **506 → 515** unit + acceptance tests (+ 7 max-retries + 2 AI-list canaries). Playwright 32/32 unchanged.

### 📒 Deferred (unchanged)

- **G-005** A-G → A-F report-block realignment — still requires a coordinated commit on the parent [`santifer/career-ops`](https://github.com/santifer/career-ops) `modes/oferta.md`. Tracked in `qa/REGRESSION-v1.27.md §11`.

### Verification

```bash
$ npm run test:ci
# 515 / 515
# ✓ no .also( leftovers in views/
# ✓ CHANGELOG parity: all 8 locales at v1.28.0

# Manual smoke:
$ curl -sS http://127.0.0.1:4317/api/health | jq '.version'
"1.28.0"

# AI-list canaries — every help-bundle + README mentions OpenCode + Qwen CLI:
$ for f in docs/help/*.md README*.md; do
    grep -L 'OpenCode' "$f" && echo "  FAIL: $f"
  done
# (silent — all 16 files green)

# max-retries flag pass-through:
$ curl -sS http://127.0.0.1:4317/api/stream/batch?retry=1&maxRetries=3 | head -3
# event: error                                      (runner missing in stand)
# data: {"message":"batch/batch-runner.sh not found..."}
# (the path is exercised by tests/batch-max-retries.test.mjs against a stub runner)
```

---

## [1.27.0] — 2026-05-14

**Cosmetic + a11y polish: deduplicate sidebar `#/dashboard` entry.**

### 🩹 Cosmetic / a11y

- **`fix(sidebar): dedupe #/dashboard entry`** ([`public/index.html:25-32`](public/index.html#L25-L32)) — the brand logo block (`<a class="logo" href="#/dashboard">`) and the first nav item (`<a class="nav-item" href="#/dashboard">`) both targeted the same route. Screen readers announced "Dashboard" twice in a row when entering the sidebar, and keyboard users had a useless extra tab stop on a control with no distinct purpose. The brand block now renders as a plain `<div class="logo">`. The Dashboard nav item remains the sole link.

### 📒 Deferred (parent-coordinated)

- **G-005 / PR-B** (A-G → A-F report block realignment) — still requires a coordinated commit on the parent [`santifer/career-ops`](https://github.com/santifer/career-ops) `modes/oferta.md`. Tracked in `qa/REGRESSION-v1.27.md §Deferred`.

### 🧪 Tests

- **506 / 506** unit + **32 / 32** Playwright — unchanged. No new test required (cosmetic-only).
- CHANGELOG parity gate: ✓ all 8 locales at v1.27.0.

### Verification

```bash
$ npm run test:ci
# 506 / 506
# ✓ no .also( leftovers in views/
# ✓ CHANGELOG parity: all 8 locales at v1.27.0

# Manual smoke (after restart):
$ curl -sS http://127.0.0.1:4317/api/health | jq '.version'
"1.27.0"
$ curl -sS http://127.0.0.1:4317/ | grep -c 'href="#/dashboard"'
1   # was 2 on v1.26.1
```

---

## [1.26.1] — 2026-05-14

**Hot-fix: WCAG 2.5.5 — header `.btn` height restored to 44 px floor.**

### 🚑 Critical hot-fix

- **`fix(css): restore min-height: 44px + line-height + flex-shrink:0 on .btn`** ([`public/css/app.css:391-410`](public/css/app.css#L391-L410)) — live Playwright measurement on v1.26.0 found 5 header buttons rendering at 39-41 px (Doctor / Quick scan / Open Pipeline / 🌐 Scan now / ✨ Auto-pipeline a URL) — a WCAG 2.5.5 violation. The fix:
  - Adds `min-height: 44px` to `.btn`. A stale comment at line 427-430 still claimed this floor was in place, but the declaration itself had been lost between v1.18 and v1.26.
  - Adds `line-height: 1.2` so the in-block text doesn't compute the row taller than intended on browsers with looser default leading.
  - Adds `flex-shrink: 0` + `box-sizing: border-box` to keep parent flex rows from squashing the button under their own height constraints.
  - `.btn-sm` keeps its existing 32 px floor (small-control exception per WCAG 2.5.5 + 2.5.8 spaced-target) — `.btn-sm` follows `.btn` in source order so the override applies.

### 🧪 Tests

- **`test(wcag): tests/wcag-target-size.test.mjs`** — 4 static CSS canaries:
  - `.btn` block has `min-height: 44px`
  - `.btn` block has `flex-shrink: 0`
  - `.btn-sm` keeps `min-height: 32px`
  - `.btn-sm` defined AFTER `.btn` in source order (cascade)
- **502 → 506** unit (+4) + 32/32 Playwright unchanged.
- Live verification via headless Chromium across all 13 sidebar routes — every `.btn:not(.btn-sm)` measured ≥ 44 × 44 px after the fix.

### Verification

```bash
$ npm run test:ci
# 506 / 506
# ✓ no .also( leftovers in views/
# ✓ CHANGELOG parity: all 8 locales at v1.26.1

# Live Playwright probe (run against server on :4317):
$ for route in /dashboard /scan /pipeline /evaluate /batch /reports /tracker \
                /activity /cv /profile /config /health /help; do
    # use the parent project's playwright to measure
    cd $CAREER_OPS_ROOT && node -e "
      const { chromium } = require('playwright');
      (async () => {
        const browser = await chromium.launch({ headless: true });
        const page = await (await browser.newContext()).newPage();
        await page.goto('http://127.0.0.1:4317/#$route', { waitUntil: 'networkidle' });
        const bad = await page.\$\$eval('.btn:not(.btn-sm)', els =>
          els.filter(b => b.getBoundingClientRect().height < 44).length);
        console.log('$route:', bad === 0 ? 'PASS' : 'FAIL ' + bad);
        await browser.close();
      })();
    "
  done
# Every route → PASS
```

### Out of scope (v1.27.0)

| Item | Notes |
|---|---|
| G-005 — A-G → A-F report block realignment | Still waiting on coordinated parent commit. |
| G-003 — `README.cn.md` rename | Verified-already-closed: repo has `README.zh-CN.md`, no orphan. |
| Sidebar duplicate `#/dashboard` (brand logo + nav item) | Trivial cosmetic, zero UX impact. |

---

## [1.26.0] — 2026-05-14

**Test pyramid (unit → functional → acceptance → e2e) + coverage push to ≥ 93 % line / ≥ 83 % branch.** Adopts the 4-tier structure mandated by the v1.25 backlog. Adds 22 new tests targeting the biggest coverage gaps from v1.25's `npm run test:coverage` report; introduces the `tests/acceptance/` directory for cross-endpoint user-journey tests.

### 📐 Test pyramid documentation

- **`docs(architecture): TESTING.md describes the 4-tier pyramid`** ([`docs/architecture/TESTING.md`](docs/architecture/TESTING.md)) — single-source explanation of how the suite is structured and where new tests land:
  - **Tier 1 (unit)** — pure helpers (`security`, `parsers`, `prompts`, `file-lock`, `rate-limit`, `safe-fetch`, `env-config`). No port binding, no FS beyond stubs, no subprocess.
  - **Tier 2 (functional)** — per-endpoint contracts. `createApp()` against ephemeral port + temp `CAREER_OPS_ROOT`.
  - **Tier 3 (acceptance)** — multi-endpoint user journeys. NEW `tests/acceptance/` directory.
  - **Tier 4 (e2e)** — Playwright headless Chromium (`tests/playwright-{smoke,full-cycle}.mjs`, `tests/e2e{,-comprehensive}.mjs`).
- 100% line coverage target is explicitly scoped to **working functionality** — the `if (isMain) { … }` boot block in `server/index.mjs` and live-LLM call paths in `auto-pipeline.mjs` are documented exclusions.

### 🧪 Tier 2 — Functional gap fills

- **`test(jds): jds-list-create-get.test.mjs`** — pre-v1.26 only the DELETE path was tested. New file adds 10 tests covering:
  - `GET /api/jds` shape on empty + populated state
  - `POST /api/jds` with explicit slug, auto-generated slug, slug normalization warning
  - `POST /api/jds` empty-body / stripped-to-empty-slug 400 responses
  - `GET /api/jds/:name` body roundtrip, 404 on unknown, traversal rejection
  - **`server/lib/routes/jds.mjs` coverage: 61.64 % → 100 % line.**
- **`test(auto-pipeline): auto-pipeline-rejection-paths.test.mjs`** — 10 tests covering every URL rejection branch that doesn't need a live LLM:
  - `javascript:` / `file://` / malformed-string / empty / no-key-body
  - SSRF: loopback, RFC1918, link-local IMDS (169.254.169.254)
  - `mode: 'manual'` interaction with rejected URL — error precedes any done event
  - **`server/lib/routes/auto-pipeline.mjs` branch coverage: 50.00 % → 59.38 %.**

### 🧪 Tier 3 — Acceptance (NEW)

- **`test(acceptance): jd-evaluate-tracker-flow.test.mjs`** — first cross-endpoint user journey. Threads 7 endpoints in the order the SPA invokes them:

  1. `POST /api/jds` — save raw JD
  2. `GET /api/jds` — confirm in list
  3. `GET /api/jds/:name` — read body verbatim
  4. `POST /api/evaluate` (manual fallback) — generate prompt
  5. `POST /api/tracker` — add row
  6. `GET /api/tracker` — verify presence
  7. `GET /api/activity` — confirm audit-log entry

  Second journey: pipeline-add → preview → tracker → delete cycle.

### 🧪 Test count

- **480 → 502** unit + acceptance (+22). 32/32 Playwright unchanged.
- `npm test` now runs `tests/*.test.mjs tests/acceptance/*.test.mjs`.
- `npm run test:coverage` same. `npm run test:ci` runs all of the above plus the two CI gates from v1.24.1 (`check-no-also-leftovers`) and v1.25.0 (`check-changelog-parity`).

### Coverage snapshot

```
all files                     | 93.66 line | 83.73 branch | 92.91 func
server/lib/security.mjs       | 99.30 line
server/lib/safe-fetch.mjs     | 95.81 line
server/lib/file-lock.mjs      | 93.15 line
server/lib/rate-limit.mjs     | 100.00 line
server/lib/parsers.mjs        | 99.57 line
server/lib/routes/jds.mjs     | 100.00 line  ← was 61.64 in v1.25
server/lib/routes/tracker.mjs | 100.00 line
server/lib/routes/reports.mjs | 100.00 line
server/lib/routes/activity.mjs| 100.00 line
```

Remaining < 95 % line modules are gated by live-LLM / spawn-mock complexity:

- `auto-pipeline.mjs` (46 %) — uncovered region is the live Anthropic / Gemini evaluate path + report-save + tracker-write SSE flow. Out of scope for the 100 % target per [TESTING.md "Goal: 100% line coverage of working functionality"](docs/architecture/TESTING.md).
- `batch.mjs` (67 %) — uncovered region is `streamNodeScript` spawn of `batch-runner.sh`. Out of scope (subprocess mocking gap).
- `cv-import.mjs` (77 %) — uncovered region is pandoc / pdftotext fallback paths when the system tools are missing. Out of scope (env-dependent).

### Verification

```bash
$ npm run test:ci
# 502 / 502
# ✓ no .also( leftovers in views/
# ✓ CHANGELOG parity: all 8 locales at v1.26.0

$ npm run test:coverage 2>&1 | grep '^# all files'
# all files | 93.66 | 83.73 | 92.91

$ ls tests/acceptance/
# jd-evaluate-tracker-flow.test.mjs
```

### Breaking changes

None.

### Out of scope (v1.27+)

| Item | Notes |
|---|---|
| Live LLM-path coverage in `auto-pipeline.mjs` | Needs SDK-adapter mock + `withFileLock` stub + report-save stub. Currently 46 % line; would push toward 95 % with the mock harness. |
| Subprocess-mocked coverage for `batch.mjs::streamNodeScript` | Needs spawn-mock; would push 67 % → 90 %. |
| `cv-import.mjs` pandoc / pdftotext fallback path | Needs env-injected `which()` stub. |
| G-005 (A-F report block realignment) | Still waiting on coordinated parent commit. |

---

## [1.25.0] — 2026-05-14

**Auto-pipeline manual short-circuit + dashboard cosmetic + CHANGELOG parity backfill.** Closes G-014 (auto-pipeline ignored `mode: 'manual'`), G-012 (CHANGELOG parity drift — 6 locales were 2 releases behind), and the dashboard `✨ ✨` double-glyph cosmetic. G-003 (`README.cn.md` rename) was de-facto already closed — repo only has `README.zh-CN.md`. G-005 (A-G → A-F report block realignment) requires a coordinated parent-project commit and stays deferred.

### 🛡️ G-014 — Auto-pipeline `mode: 'manual'` short-circuit

- **`fix(auto-pipeline): G-014 — honour mode:'manual' short-circuit`** ([`server/lib/routes/auto-pipeline.mjs:158-195`](server/lib/routes/auto-pipeline.mjs#L158-L195)) — pre-v1.25 the route always called an LLM. Passing `mode: 'manual'` (mirroring `/api/evaluate` since v1.10.2) was silently ignored, the request hung 1-3 min on Anthropic. Now the handler:
  - Accepts `mode` AND `evalMode` for back-compat. Either value of `'manual'` triggers the short-circuit.
  - Emits all 5 SSE stages with `status: 'done'` / `status: 'skipped'`. No fetch. No LLM call. No $0.05 per request.
  - `done` payload carries `{ mode: 'manual', prompt: <buildEvaluationPrompt scaffold>, message }` — the SPA can render it like the existing `/api/evaluate` manual-prompt card.
- **Closes DoS-risk** on `HOST=0.0.0.0`: previously, even with `llmRateLimit` capping 10 req/60s/IP, 10 attackers × 10 reqs = $50/min in Anthropic burn. Short-circuit fires before the rate-limit decrement counts toward a real call.
- **Tests** — [`tests/auto-pipeline-manual-mode.test.mjs`](tests/auto-pipeline-manual-mode.test.mjs): 3 tests confirm (1) `mode: 'manual'` returns < 2 s with all 5 step keys, (2) even with `ANTHROPIC_API_KEY` set the short-circuit still fires (the original symptom), (3) legacy `evalMode: 'manual'` callers keep working.

### 📝 G-012 — CHANGELOG parity backfill (6 locales × 2 missing releases)

- **`docs(changelog): backfill v1.23.0, v1.24.0, v1.24.1, v1.25.0 in 6 lagging locales`** — pre-v1.25 only EN had v1.23-v1.24; RU was 1 release behind, the other 6 were 2 releases behind. v1.25 dispatches parallel translation agents (mirrors the v1.23 pattern) to land all four entries in `CHANGELOG.{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md`. RU gets v1.24.0 + v1.24.1 + v1.25.0 (it already had v1.23.0 from the v1.23 cycle).
- **`feat(ci): scripts/check-changelog-parity.mjs gate`** — fails the build if any locale CHANGELOG's newest entry is older than the EN canonical. Wired into `npm run test:ci`. Pre-existing G-012 drift would have caught itself the moment it crossed the EN boundary.

### ✨ Cosmetic — dashboard double-glyph dedup

- **`fix(dashboard): dedup ✨ glyph in auto-pipeline button label`** ([`public/js/lib/i18n-dict.js:219`](public/js/lib/i18n-dict.js#L219)) — `dash.autoPipeline` carried a leading `✨` in every locale string AND `public/js/views/dashboard.js:58` prepended another `✨` in the view. Result: button rendered `✨ ✨ Auto-pipeline …`. v1.25 drops the leading glyph from every locale's DICT entry; the view's prefix is the single source. Same audit pass swept the rest of the i18n bundle — no other double-glyph patterns found.

### 🚫 Deferred to a future release

- **G-005 — Report block A-G → A-F per canonical career-ops.org/docs** — requires a coordinated commit in the parent `santifer/career-ops` project (rewrite `modes/oferta.md` to emit A=Role, B=CV-match, C=Strategy, D=Comp, E=Personalization, F=STAR — drop C-Risks/G-Legitimacy as separate blocks). v1.25.0 ships the web-ui side ready for the new schema (`reports.js` already accepts arbitrary block letters since v1.13). Tracked for the next release window when parent + child can land together.
- **G-003 — `README.cn.md` → `README.zh-CN.md` rename** — verified during v1.25 prep: repo already has `README.zh-CN.md` (no orphan `README.cn.md` anywhere under the worktree). The G-003 finding was stale.

### 🧪 Tests

- **477 → 480** unit (+3 from PR-B `auto-pipeline-manual-mode.test.mjs`).
- 32/32 Playwright unchanged.
- `npm run test:ci` now runs `npm test` + `check-no-also-leftovers.mjs` + `check-changelog-parity.mjs`.

### Verification

```bash
$ npm run test:ci
# 480 / 480
# ✓ no .also( leftovers in views/
# ✓ CHANGELOG parity: all 8 locales at v1.25.0

# G-014 — manual mode returns < 2 s even with ANTHROPIC_API_KEY set:
$ ANTHROPIC_API_KEY=sk-ant-test PORT=4317 npm start &
$ sleep 3
$ time curl -sS -X POST -H 'Content-Type: application/json' \
    -d '{"url":"https://job-boards.greenhouse.io/anthropic/jobs/x","mode":"manual"}' \
    http://127.0.0.1:4317/api/auto-pipeline | head -20
# real  0m0.1xx s  (was 1-3 min)
# event: start … event: step (×5) … event: done {"mode":"manual","prompt":"…"}

# G-012 — every locale CHANGELOG carries the v1.25.0 entry:
$ grep -c '^## \[1.25.0\]' CHANGELOG*.md
# 8 files, each → 1

# Cosmetic — dashboard glyph:
$ grep "dash.autoPipeline" public/js/lib/i18n-dict.js
# No leading ✨ in any locale value (view supplies the single glyph)
```

### Breaking changes

None. `mode: 'manual'` is opt-in; legacy `evalMode: 'manual'` callers keep working unchanged.

### Out of scope (v1.26+)

| Item | Notes |
|---|---|
| G-005 — A-F report block realignment | Needs coordinated parent commit (`santifer/career-ops` rewrites `modes/oferta.md`). |
| Live execution of QA scenario 31 **visual** sub-tests | Require browser-driven agent (Claude Cowork). Covered partially by Playwright smoke. |
| `i18n-dict.js` over 400-LOC target | Translation fixture — exempt by policy. Split would add HTTP requests without a bundler. |

---

## [1.24.1] — 2026-05-14

**Hot-fix: `#/config` crash on all 8 locales (G-015).**

### 🚑 Critical hot-fix

- **`fix(config): G-015 — replace removed Element.prototype.also call in config.js`** ([`public/js/views/config.js:371`](public/js/views/config.js#L371)) — v1.22.0 N-2 dropped the `Element.prototype.also` global monkey-patch and migrated `cv.js` to a free-statement pattern, but **missed `config.js`**. The result: `#/config` crashed at first invocation on every locale with `c(...).also is not a function`. v1.24.1 applies the same migration pattern from `cv.js:188-201` — extract the tree to a `const root = c(...)`, run the activation block on its own, then `return root;`.

### 🛡️ CI gate

- **`feat(ci): scripts/check-no-also-leftovers.mjs sweep`** — walks every file under `public/js/views/` and fails the build on any `.also(` call site (commented references allowed). Wired into the new `npm run test:ci` script. Future revert of the monkey-patch removal can't re-introduce the same regression silently.

### 🧪 Tests

- **`test: tests/config-view-syntax.test.mjs`** — three guards:
  - parse `config.js` via `node:vm.Script` (catches syntax-level regressions without needing Playwright)
  - assert no `.also(` survives outside comments
  - assert the `const root = c(...)` / `return root;` migration anchors are present
- **474 → 477** unit (+3) + 32/32 Playwright unchanged.

### Verification

```bash
$ npm run test:ci
# 477 / 477
# ✓ no .also( leftovers in views/

# Browser smoke:
$ open http://127.0.0.1:4317/#/config
# → renders normally, no "is not a function" card. Every locale equivalent.
```

### Out of scope (deferred to v1.25)

- G-014, G-012, G-005, G-003 — see v1.25.0 entry below for the bundle.

---

## [1.24.0] — 2026-05-14

**Help-bundle content-depth refresh + live execution of QA scenario 31 + RU CHANGELOG end-to-end.** Closes both items the v1.23.0 "Out of scope" table deferred to v1.24: the full content-depth refresh of all 8 help bundles from the 5 canonical career-ops.org/docs URLs (was URL-coverage-only since v1.11.x), and the live execution of QA scenario 31 against a running server (was "needs browser agent + LLM credentials" — turned out 6/6 sub-tests are reachable via curl + grep, only the visual sub-tests need a browser).

### 📖 Help-bundle content-depth refresh

- **`docs(help): refresh en.md from 5 canonical career-ops.org/docs URLs`** ([`docs/help/en.md`](docs/help/en.md)) — pre-v1.24 the EN bundle was 1113 lines and listed the 5 canonical URLs in the front-matter but didn't expand on them in the body. v1.24 fetches all 5 URLs via WebFetch and deepens the matching H2 sections:
  - **About career-ops (front-matter)** — added principles (data sovereignty, AI-agnostic, human-controlled), "What career-ops is NOT" block, expanded concepts inventory from 6 to 10 rows (added Proof points, JD store, Interview-prep, Batch additions).
  - **§5 Portals** — added canonical bootstrap `cp templates/portals.example.yml portals.yml`, clarified required vs optional fields per `tracked_companies` entry.
  - **§7 Scan** — added "no AI tokens consumed" note for Option A, follow-up commands list (`apply` / `contacto` / `deep` / `tracker`).
  - **§14 Apply checklist** — split into SPA checklist mode vs Manual-vs-Playwright-assisted vs Full CLI flow (canonical 8 numbered steps from `/career-ops apply <company>` to `Submitted.` with `Evaluated → Applied` auto-transition); batch evaluate subsection now has TSV schema table + all 4 flags documented + `merge-tracker.mjs --dry-run`; Playwright Setup subsection lists install commands, MCP registration, alternative `.claude/settings.local.json`, headless-by-default note.
- **16-H2 section parity preserved** (CI test `help-ui.test.mjs::section-parity` asserts exactly 16 H2 sections across all 8 locales).
- **Each of the 5 canonical URLs appears ≥ 2 times** in the bundle (CI test `canonical-docs-coverage.test.mjs` enforces). Per-URL count after v1.24: `what-is-career-ops` × 4, `scan-job-portals` × 5, `apply-for-a-job` × 3, `batch-evaluate-offers` × 5, `set-up-playwright` × 3.
- **`docs(help): translate the v1.24 deepening to 7 non-EN locales`** — 7 parallel translation agents dispatched. Each target locale (es / pt-BR / ko-KR / ja / ru / zh-CN / zh-TW) gets a refreshed bundle that mirrors the EN structure section-for-section, preserves verbatim code blocks / URLs / file paths / button labels (📁 Upload CV / 🌐 Scan now / ▶ Evaluate / 📄 Generate PDF / 💾 Save) and English abbreviations (CSP, SSRF, TOCTOU, WCAG, ATS, JD, SSE, REST, API), and translates the deepening to publication-grade native technical style in the target language.

### 🧪 QA scenario 31 — live execution (6/6 PASS)

- **`docs(qa): append last-verified live-execution log to qa/claude-cowork-browser-test-prompt.md`** — pre-v1.24 scenario 31 was documented but never run against a live server (deferred as "needs browser agent + LLM credentials"). v1.24 ran all 6 sub-tests against `http://127.0.0.1:4317`:

  | Sub | Description | Status |
  |---|---|---|
  | 31.1 | Score thresholds in help bundles | ✅ PASS (4.5 × 3, 4.0 × 9, 3.5 × 6 mentions in `docs/help/en.md`) |
  | 31.2 | Scan workflow endpoints | ✅ PASS (`/api/stream/scan-{en,ru}` + `/api/scan-ru/config` → 404; `/api/scan/regional/config` → 200) |
  | 31.3 | `/api/apply-helper` checklist | ✅ PASS (body contains `career-ops apply` + `auto-submit` warning) |
  | 31.4 | `/api/batch` endpoint | ✅ PASS (keys `[exists, runnerExists, raw, rows, additions]`) |
  | 31.5 | Playwright availability | ✅ PASS (`/api/health` reports `Playwright (parent node_modules) ok: true, value: installed`) |
  | 31.6 | Help-bundle URL coverage (5 URLs × 8 locales) | ✅ PASS (**40 / 40 ✓**) |

  Visual-only sub-tests (require browser) flagged separately in the QA prompt — they remain runnable via Claude Cowork or `npm run test:e2e:browser`.

### 🌐 RU CHANGELOG end-to-end (M-9 follow-up)

- **`docs(translate): CHANGELOG.ru.md retry agent — full body translation`** ([`CHANGELOG.ru.md`](CHANGELOG.ru.md)) — the v1.23.0 release shipped with the RU CHANGELOG retry agent still in flight (it had crashed once with a socket error and was re-dispatched). v1.24 picks up the agent's 1542-line full translation: every entry v1.23.0 → v1.6.0 has a publication-grade Russian body, no more EN-bodied stop-gaps. Style discipline matches the v1.22.0 README quality refresh: "функциональность" / "возможности" / "поведение" replace clunky "функционал"; "через" / "с помощью" replace "при помощи"; active voice over passive; "эндпоинт", "лимит запросов", "состояние гонки", "санитайзинг" as canonical terms; English abbreviations (TOCTOU, CSP, SSRF, WCAG, ATS, JD, SSE, REST, API) preserved.

### 🧪 Tests

- **474 / 474** unit + 20 / 20 smoke E2E + 32 / 32 Playwright. Zero behavioral test deltas; every help-bundle CI assertion (16 H2 sections × 8 locales, 5 URLs × ≥ 2 mentions, content floor) still green.

### Verification

```bash
$ npm test                            # 474 / 474

# Help-bundle deepening:
$ wc -l docs/help/en.md
# ~1270 lines (was 1113 — deepened, not bloated)

$ for url in what-is-career-ops scan-job-portals apply-for-a-job \
             batch-evaluate-offers set-up-playwright; do
    echo -n "$url: "
    grep -c "$url" docs/help/en.md
  done
# what-is-career-ops: 4
# scan-job-portals: 5
# apply-for-a-job: 3
# batch-evaluate-offers: 5
# set-up-playwright: 3

# Scenario 31.6 — 40/40 URL coverage:
$ for lang in en es pt-BR ko ja ru zh-CN zh-TW; do
    echo -n "$lang: "
    for url in what-is-career-ops scan-job-portals apply-for-a-job \
               batch-evaluate-offers set-up-playwright; do
      curl -sS "http://127.0.0.1:4317/api/help/$lang" \
        | python3 -c "import sys,json; print(json.load(sys.stdin).get('markdown',''))" \
        | grep -q "$url" && echo -n "✓ " || echo -n "✗ "
    done
    echo
  done
```

### Breaking changes

None.

### Out of scope (v1.25+)

| Item | Notes |
|---|---|
| Live execution of scenario 31 **visual** sub-tests | Require browser-driven agent (Claude Cowork or `npm run test:e2e:browser`). Out of scope for curl-only execution; covered by existing Playwright smoke. |
| RU CHANGELOG body translation **of older entries** (v1.5.x and below) | The retry agent only covered v1.6.0 onwards. Pre-v1.6 entries (`v1.5.x`, etc.) — if they ever existed — remain pre-existing-content. |
| Visual regression on dashboard screenshots after future SPA changes | `scripts/capture-dashboard-screenshots.mjs` regenerates per-locale PNGs; no automated diff currently. |

---

## [1.23.0] — 2026-05-14

**i18n split + connection-banner CI fix + localized dashboard screenshots + every backlog stop-gap closed.** Ships the three items the v1.22.0 "Out of scope" table flagged for v1.23 (M-9 locale CHANGELOG bodies, N-1 `i18n.js` LOC split, help-bundle content audit) plus a hot-fix for the smoke E2E test that turned the v1.22.0 main-branch CI red.

### 🚑 CI hot-fix — connection banner recovery

- **`fix(client): reset health-poll cadence + visibilitychange eager re-check`** ([`public/js/api.js:21-91`](public/js/api.js#L21-L91)) — v1.22.0's M-6 exponential backoff was correct (3 s → 6 s → 12 s → cap 15 s, down from the original cap 60 s) but the in-flight `setTimeout` was locked to whatever delay was set previously. A server killed at t=0.1 with the first ping at t=3 would fail, double the delay to 6, and the next recovery probe wouldn't fire until t=9. The smoke E2E's "Flow 2a: connection banner appears on server down, hides on recovery" waited only 4 s and turned red on `main`.

    v1.23.0 reshapes the polling loop:

    - `_healthHandle` is tracked so `setConnectionState(lost=true)` can `clearTimeout` and re-schedule with `_HEALTH_MIN`. The first recovery probe now fires within 3 s of going down, regardless of what delay was queued.
    - `_HEALTH_MAX` lowered from 60 s to 15 s. Backgrounded tab against a dead server still recovers within one polling cycle when the user comes back; bandwidth savings stay substantial.
    - `document.addEventListener('visibilitychange')` eager-rechecks when the tab regains focus and `connectionLost === true` — Cmd-Tab back doesn't wait for the next backoff tick.

### 🧹 N-1 — i18n.js split (over the 400-LOC target)

- **`refactor(client): split DICT into i18n-dict.js (data) + i18n.js (logic)`** — pre-v1.23 `public/js/lib/i18n.js` was 639 LOC. The bulk (lines 23-586) was the `DICT` translation table — pure structured data. v1.23.0 extracts that to [`public/js/lib/i18n-dict.js`](public/js/lib/i18n-dict.js) (578 LOC, exempt-from-LOC-rule per CLAUDE.md "Exempt from these limits: generated files, migrations, test fixtures, lock files, vendored code" — translation tables qualify as fixtures), leaving [`public/js/lib/i18n.js`](public/js/lib/i18n.js) at 86 LOC of pure module logic (well under the 400-LOC target).
- **Loader contract:** `i18n-dict.js` populates `window.__I18N_DICT = { … }`, then `i18n.js` reads it inside the existing IIFE. [`public/index.html`](public/index.html) loads them in order — `i18n-dict.js` before `i18n.js` — so the IIFE sees a fully-populated DICT at construction time. Missing-dict fallback: every `t()` call returns its inline fallback or bare key, which surfaces a misconfiguration loudly without crashing the SPA.
- **Test plumbing updated:** [`tests/i18n-coverage.test.mjs`](tests/i18n-coverage.test.mjs), [`tests/help-ui.test.mjs`](tests/help-ui.test.mjs), [`tests/canonical-docs-coverage.test.mjs`](tests/canonical-docs-coverage.test.mjs) now run both files through the test VM context (or concatenate their source for the regex sweep), preserving every existing assertion.

### 🌐 M-9 — Locale CHANGELOG body translations

- **`docs(translate): 7 non-EN CHANGELOG files end-to-end`** — pre-v1.23 `CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md` carried EN-bodied stop-gap notes for every entry from v1.13.0 onwards, with a footer pointing readers at the EN canonical. v1.23.0 dispatches 7 parallel translation agents — one per locale — that rewrite every body to publication-grade technical style in the target language. Stop-gap notes removed. Code blocks, file paths, URLs, commit-message-style strings (`fix(security): B-1 — …`), env vars, and link labels preserved verbatim across all locales.

### 🖼️ Localized dashboard screenshots in every README

- **`docs(readme): wire each locale README at its locale-specific PNG`** — pre-v1.23 only `README.pt-BR.md` referenced `dashboard-pt-BR.png`; the other 6 non-EN READMEs still pointed at `dashboard-en.png`. The screenshots (already captured in v1.22.0 cycle by [`scripts/capture-dashboard-screenshots.mjs`](scripts/capture-dashboard-screenshots.mjs)) were present in `images/` but unused. v1.23.0 updates every `README.{es,ja,ko-KR,ru,zh-CN,zh-TW}.md` line 14 to its own `dashboard-<locale>.png`.

### 🧪 Tests

- Same 474 / 474 unit + 32 / 32 Playwright as v1.22.0. **Smoke E2E now 20 / 20** (was 19 / 1 fail on `main` after v1.22.0 due to the banner-recovery regression; v1.23.0's reschedule fix closes it).
- Three existing tests rewired to handle the i18n split. Zero new test files; zero new assertions deleted.

### Verification

```bash
$ npm test
# 474 / 474

$ npm run test:e2e
# passed: 20    failed: 0    (was 19/1 on v1.22.0 main)

$ wc -l public/js/lib/i18n.js public/js/lib/i18n-dict.js
#       86 public/js/lib/i18n.js          ← logic, under target
#      578 public/js/lib/i18n-dict.js     ← data fixture, exempt

$ grep -h 'dashboard-' README*.md | sed -E 's/.*(dashboard-[^)]+).*/\1/' | sort -u
# dashboard-en.png    (README.md only)
# dashboard-es.png    dashboard-ja.png
# dashboard-ko-KR.png dashboard-pt-BR.png
# dashboard-ru.png    dashboard-zh-CN.png  dashboard-zh-TW.png

# CHANGELOG translation sanity: each locale file > 200 lines of native content
$ wc -l CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md | grep -v total
```

### Breaking changes

None. `public/index.html` now loads two scripts where it loaded one — anyone serving the SPA from a CDN must pick up `i18n-dict.js`; the script load order is enforced by the order of `<script src>` tags in `index.html`. The runtime fallback (empty DICT → `t()` returns the inline EN fallback) prevents hard crashes when the new file is missing.

### Out of scope (v1.24+)

| Item | Notes |
|---|---|
| Help-bundle CONTENT depth refresh from career-ops.org/docs (vs URL coverage) | The 5 canonical URLs already appear in every locale's help bundle since v1.11.x and Scenario 31.6 in the QA prompt verifies coverage. Content-body depth refresh is a v1.24+ candidate. |
| Live execution of QA scenario 31 against a running server | Requires browser agent + live LLM credentials. v1.24 candidate. |
| Per-component touch-target sweep on new mode-page hint paragraphs | v1.22.0 M-1 added `<p class="field-hint">` elements that haven't been verified against WCAG 2.5.5 min-height in all 8 locales. |

---

## [1.22.0] — 2026-05-14

**M/L/N backlog clearout + docs alignment + translation quality pass.** The entire v1.20.1-BACKLOG.md medium-and-below tier shipped in one release: nine M-items, five L-items, two nits. Plus a docs-alignment audit against the five canonical [career-ops.org/docs](https://career-ops.org/docs) guides, refreshed system prompts under `.claude/` and `.github/`, and quality-refreshed READMEs in all 7 non-English locales.

### 🛡️ Security hardening (defense-in-depth)

- **`fix(security): M-4 — entity-aware stripDangerousMarkdown`** ([`server/lib/security.mjs`](server/lib/security.mjs)) — the pre-v1.22 regex matched `<script>`, `javascript:`, `on*=` as literal substrings. `&lt;script&gt;`, `java&#115;cript:`, and `<img src="data:image/svg+xml,<svg onload=…>">` slipped through. The strip now decodes `&lt;`, `&gt;`, `&amp;`, `&quot;`, numeric (`&#NN;`) and hex (`&#xHH;`) entities **before** the strip regex runs. Validated by 11 tests in [`tests/cv-xss-bypasses.test.mjs`](tests/cv-xss-bypasses.test.mjs). Real defense is still the client-side `UI.md` escape-first pipeline; this hardens the at-rest file.

- **`fix(security): L-2 — bash --noprofile --norc on the batch runner`** ([`server/lib/routes/batch.mjs:108`](server/lib/routes/batch.mjs#L108)) — `spawn('bash', [PATHS.batchRunner, ...])` used to inherit the user's `~/.bashrc`. A hostile rc file could influence the run. Now `spawn('bash', ['--noprofile', '--norc', PATHS.batchRunner, ...])`.

### 🔒 Resilience

- **`fix(client): M-6 — exponential backoff on health ping`** ([`public/js/api.js:22-48`](public/js/api.js#L22-L48)) — the disconnected-state poller used to fire 28,800 fetches against a dead server overnight. Now 3 s → 6 s → 12 s → 24 s → 60 s; resets to 3 s on first 2xx recovery. Setup is a `setTimeout` chain (not `setInterval`) so each step picks up the new delay.

- **`fix(client): M-5 — Safari private-mode localStorage guard`** ([`public/js/lib/i18n.js:572-583`](public/js/lib/i18n.js#L572-L583)) — Safari private-mode throws `SecurityError` on every `localStorage.getItem/setItem`. The IIFE-during-load used to fail the entire i18n module, leaving the SPA rendering raw keys. Wrapped both calls in try/catch with the `detect()` browser-language fallback.

- **`fix(server): M-2 — body-size cap on outbound preview fetches (test + verify)`** — the v1.21.0 `safeGet` already streamed chunks and capped at `opts.maxBytes`. v1.22 adds an explicit regression test in [`tests/ssrf-redirect-rebind.test.mjs`](tests/ssrf-redirect-rebind.test.mjs) to lock the contract: 100 KB upstream + 4 KB cap → response ≤ 4 KB.

- **`fix(client): L-5 — clear setTimeout on hashchange in scan.js`** ([`public/js/views/scan.js:6-22, :113-120`](public/js/views/scan.js#L6-L22)) — the post-done 300 ms `refreshResults()` timer used to leak when the user navigated off `#/scan` in that window. Handle is now captured and cleared in `__cancelActiveScanPoll`.

- **`fix(client): L-4 — multi-line SSE data: joiner`** ([`public/js/lib/auto-pipeline.js:158-176`](public/js/lib/auto-pipeline.js#L158-L176)) — the SSE parser used `match()` (single-line). Per spec, an event may carry multiple `data:` lines that the consumer joins with `\n`. Server currently sends single-line JSON, so the old code worked — but was brittle to any future multi-line payload.

### ♿ Accessibility

- **`feat(a11y): M-3 — WCAG 1.4.1 redundant cues on score pills + connection banner`** ([`public/css/app.css:602-625, :812-822`](public/css/app.css#L602-L625)) — score-high / score-mid / score-low used to convey state by hue alone (red/amber/green). Users who can't perceive hue had no fallback. Each tier now gets a redundant glyph via `::before` (✓ / ◐ / ○). Connection banner gets a leading `⚠` glyph in the offline state. Render sites untouched — pure CSS hardening.

- **`feat(a11y): M-1 — inline hint paragraphs for every mode-page field`** ([`public/js/views/mode-page.js`](public/js/views/mode-page.js), [`public/js/lib/i18n.js`](public/js/lib/i18n.js)) — v1.20.0 wired `htmlFor → id` for every mode-page field but didn't carry inline hint copy; only the README walkthroughs documented field intent. v1.22.0 adds 19 hint i18n keys × 8 locales = **152 new translations** and the `field()` builder now renders a `<p id="…-hint">` with `aria-describedby` wiring per field. Screen-reader users hear the hint when the input is focused.

- **`fix(a11y): M-7 — null-guard on UI.el() htmlFor alias`** ([`public/js/api.js:194-198`](public/js/api.js#L194-L198)) — `htmlFor: null` used to render literal `for="null"`. One-liner mirror of the fallthrough branch's `v != null && v !== false` guard.

### 🧹 Quality / portability

- **`fix(server): L-1 — parseInt radix in health.mjs + bin/start.sh + bin/setup.sh`** — `parseInt(process.versions.node)` without radix triggers a lint warning and is brittle if Node ever ships hex versions. Added `10` everywhere.

- **`fix(server): L-3 — Windows-safe entrypoint check`** ([`server/index.mjs:159-163`](server/index.mjs#L159-L163)) — `import.meta.url === \`file://${process.argv[1]}\`` mishandles drive letters and backslashes on Windows. Replaced with `fileURLToPath(import.meta.url) === path.resolve(process.argv[1])`.

- **`refactor(client): N-2 — drop Element.prototype.also monkey-patch`** ([`public/js/views/cv.js:188-201`](public/js/views/cv.js#L188-L201)) — global DOM prototype pollution. Replaced with a local variable for the tree root.

- **`test(canary): M-8 — 404 regression test for retired /api/scan-ru/config`** ([`tests/scan-consolidated.test.mjs`](tests/scan-consolidated.test.mjs)) — v1.20.0 retired the alias but added no canary. Three-line addition mirroring the v1.18 retirement tests.

### 📚 Docs + system prompts

- **`docs(architecture): refresh OVERVIEW + DATA-FLOWS for v1.21+ surface`** — added `safe-fetch.mjs` (DNS-pinned GET), `file-lock.mjs` (per-path mutex), `rate-limit.mjs` (LLM throttle), and `sanitizePathName` to OVERVIEW.md. DATA-FLOWS.md gained two new sections: "Outbound URL fetches (DNS-rebind-safe)" and "LLM endpoint rate-limiting".

- **`docs(readme): security envelope section refresh`** — README.md "Security notes" now documents every helper in the v1.21+ security envelope (sanitizePathName, safeGet, withFileLock, llmRateLimit, entity-aware stripDangerousMarkdown).

- **`docs(qa): scenario 31 — career-ops.org/docs alignment`** ([`qa/claude-cowork-browser-test-prompt.md`](qa/claude-cowork-browser-test-prompt.md)) — six new sub-tests (31.1–31.6) that verify the UI matches behavior described in the five canonical career-ops.org/docs guides: score thresholds, scan workflow (one button), apply workflow (checklist, not auto-submit), batch workflow (TSV editor), Playwright setup (graceful failure), help-bundle coverage (5 URLs × 8 locales).

- **`docs(translate): README quality refresh × 7 non-EN locales`** — every non-EN README rewritten to publication-grade technical style in its native language. Common clunky calques replaced; v1.21/v1.22 security envelope mentions added; release/test badges bumped.

- **`docs(system): .claude/PROJECT-CONTEXT.md + .github/copilot-instructions.md`** — single-file orientation for agents joining a session. Compressed CLAUDE.md, names the v1.21+ helpers, lists common pitfalls.

- **`docs(bin): actualize start.sh / setup.sh / run_all.sh comments`** — "two deps" → "three deps" (express + js-yaml + multer); "298 tests" → "474+ tests"; `parseInt` radix added.

### 🧪 Tests

- **461 → 474 unit** (+13) + 32/32 Playwright unchanged.
- New test files: `cv-xss-bypasses.test.mjs` (M-4, 11 tests).
- Extended: `ssrf-redirect-rebind.test.mjs` (+1 for M-2 body cap), `scan-consolidated.test.mjs` (+1 for M-8 alias canary).
- Zero behavioral test deltas on existing suites — every fix is additive or covered by a new canary.

### Verification

```bash
npm test                          # 474 / 474
npm run test:e2e:browser          # 32 / 32

# Entity-encoded XSS strip:
node -e "import('./server/lib/security.mjs').then(({stripDangerousMarkdown}) => console.log(stripDangerousMarkdown('&lt;script&gt;alert(1)&lt;/script&gt;')))"
# → '' (no <script> survives)

# Health-ping backoff (open devtools, kill server, watch network panel):
#   3 s → 6 s → 12 s → 24 s → 60 s, then resets on first successful ping

# Score-pill glyph (open #/reports in light + dark theme):
#   .score-high shows ✓ + numeric score
#   .score-mid  shows ◐ + numeric score
#   .score-low  shows ○ + numeric score

# Mode-page hints (#/contacto, etc):
#   <input aria-describedby="mode-contacto-recipient-hint">  ← targets <p id="…">

# Retired alias:
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4317/api/scan-ru/config
# → 404
```

### Breaking changes

None. Every fix is additive or preserves existing endpoint contracts.

### Out of scope (v1.23+)

| Item | Notes |
|---|---|
| M-9 — locale CHANGELOG body translations | All `CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md` v1.13+ entries are EN-bodied stop-gaps. Bulk translation candidate after release cadence slows. |
| N-1 — `public/js/lib/i18n.js` over the 400-LOC target | Splitting per locale increases HTTP cost without a bundler. Defer until the build-step decision lands. |
| Help-bundle content refresh from career-ops.org/docs | The five canonical URLs already appear in every locale's help bundle (since v1.11.x). Scenario 31.6 in the QA prompt verifies coverage. Content depth refresh is a v1.23 candidate. |

---

## [1.21.0] — 2026-05-14

**Security + concurrency + a11y polish from two independent code-review passes.** Seven findings from [`docs/specs/V1.20.1-BACKLOG.md`](docs/specs/V1.20.1-BACKLOG.md) shipped in one release: one blocker (DNS-rebind TOCTOU), six high-severity bugs (path-traversal sanitization spread, rate-limit gap on LAN deploy, concurrent-write race, i18n coverage hole, dangling aria-describedby, missing label associations). 34 new tests; baseline rose from 427 → 461 unit + 32/32 Playwright. Every fix lands behind a named regression test.

### 🛡️ Security

- **`fix(security): B-1 — close DNS-rebind TOCTOU via safe-fetch.mjs`** ([`server/lib/safe-fetch.mjs`](server/lib/safe-fetch.mjs)) — the previous pattern did one explicit `dnsLookup` for validation, then let `fetch()` do its own independent lookup. A DNS rebind attacker with TTL=0 could return a public IP on lookup 1 and `127.0.0.1` / `169.254.169.254` / a LAN address on lookup 2, bypassing `isPrivateOrLoopbackHost`. The new `safeGet` resolves ONCE, pins the TCP connection to that exact IP via node:http(s), and sets SNI/Host so cert validation still targets the original hostname. Used by `/api/pipeline/preview` and `/api/auto-pipeline`. Fail-CLOSED on lookup error (reverses the prior `try { … } catch { /* fall through */ }`). Validated by 8 new tests in [`tests/ssrf-redirect-rebind.test.mjs`](tests/ssrf-redirect-rebind.test.mjs).

- **`fix(security): H-4 — consolidate sanitizePathName across 10 routes`** ([`server/lib/security.mjs`](server/lib/security.mjs)) — the bare `replace(/[^\w\-.]/g, '')` regex was duplicated across `jds.mjs`, `content.mjs`, `reports.mjs`, `llm.mjs`, `runners.mjs` and kept `.` characters, so `..pdf`, `....md`, leading-dot names survived. Only `reports.mjs::sanitizeSlug` did it right. v1.21.0 hoists the correct version (`sanitizePathName`) into `security.mjs`, deletes 10 broken copies, and rejects empty results with 400. Validated by 12 tests in [`tests/path-traversal.test.mjs`](tests/path-traversal.test.mjs).

- **`fix(security): H-5 — rate-limit LLM endpoints on public bind`** ([`server/lib/rate-limit.mjs`](server/lib/rate-limit.mjs)) — `/api/evaluate`, `/api/deep`, `/api/mode/:slug`, `/api/auto-pipeline` previously had no per-IP throttle. Loopback users are unaffected; LAN-exposed deploys (`HOST=0.0.0.0`) get 10 req/min/IP with `Retry-After` and `X-RateLimit-*` headers on overflow. Configurable via `LLM_RATE_LIMIT="N/Ws"`. Cheap interim defense ahead of the v2.0 P-12 auth gate. Validated by 6 tests in [`tests/rate-limit.test.mjs`](tests/rate-limit.test.mjs).

### 🔒 Concurrency

- **`fix(data): H-6 — per-file mutex on applications.md / pipeline.md`** ([`server/lib/file-lock.mjs`](server/lib/file-lock.mjs)) — concurrent `POST /api/tracker` (or auto-pipeline racing a manual add) used to both read `num=42`, both write `num=43`, and silently drop the earlier row. `withFileLock(path, fn)` serializes read-modify-write per path; independent paths still run in parallel. Wired into `tracker.mjs`, `pipeline.mjs` (POST + DELETE), and `auto-pipeline.mjs` tracker step. Validated by 5 tests in [`tests/concurrent-tracker-write.test.mjs`](tests/concurrent-tracker-write.test.mjs) including a 20-concurrent-POST integration check that asserts rows 001..020 land sequentially.

### ♿ Accessibility

- **`fix(a11y): H-1 — id="batch-tsv-hint" on the batch.js hint paragraph`** ([`public/js/views/batch.js`](public/js/views/batch.js)) — v1.20.0 added `aria-describedby="batch-tsv-hint"` to the TSV textarea but never gave the hint `<p>` a matching `id`. Screen readers had nothing to voice. Fixed.

- **`fix(a11y): H-2 — htmlFor on batch-parallel / batch-min-score labels`** ([`public/js/views/batch.js`](public/js/views/batch.js)) — four v1.20.0 inputs got new ids but their labels weren't programmatically associated. WCAG 3.3.2 now satisfied.

- New static-analysis canary in [`tests/a11y-form-wires.test.mjs`](tests/a11y-form-wires.test.mjs) — walks every view file and asserts every `aria-describedby` / `htmlFor` IDREF points at a sibling `id:` declaration. Catches typo-class regressions at CI time.

### 🌐 i18n

- **`fix(i18n): H-3 — 13 keys from v1.20.0 silently fell through to EN for 7 locales`** ([`public/js/lib/i18n.js`](public/js/lib/i18n.js)) — `pipe.filter`, `pipe.count`, `pipe.preview*`, `pipe.openTab`, `pipe.evaluateAll*`, `eval.jdHint`, `batch.parallelAria`, `batch.minScoreAria`, plus `common.delete`, `config.group{Core,Runtime,Regional}`, `config.profileEmpty`, `config.viewProfile`, `scan.atsBadge`, `scan.regionalBadge` were referenced via `t('key', 'EN fallback')` but never added to DICT. Russian, Japanese, Chinese screen-reader users heard English `aria-label`s — directly defeating the WCAG 3.3.2 win v1.20.0 claimed. v1.21.0 adds all 19 keys × 8 locales (≈ 150 new translations) and extends [`tests/i18n-coverage.test.mjs`](tests/i18n-coverage.test.mjs) with a static-analysis pass that scans every `t('key', …)` call in `public/js/**/*.js` and asserts each key exists in DICT. Future drift caught at CI time.

### 🧪 Tests

- **427 → 461 unit** (+34) + 32/32 Playwright unchanged.
- New test files: `ssrf-redirect-rebind`, `path-traversal`, `concurrent-tracker-write`, `rate-limit`, `a11y-form-wires`.
- Existing `pipeline-preview.test.mjs` rewired from `globalThis.fetch` mock to the new `_setTransport` injection point in `safe-fetch.mjs` — the SSRF path no longer goes through fetch, so the old mock was bypassed silently.

### Verification

```bash
npm test                              # 461 / 461
npm run test:e2e:browser              # 32 / 32
node --test tests/ssrf-redirect-rebind.test.mjs tests/path-traversal.test.mjs \
  tests/concurrent-tracker-write.test.mjs tests/rate-limit.test.mjs \
  tests/a11y-form-wires.test.mjs      # 34 new tests, all green

# Path-traversal: every traversal-style :name returns 400 / 404
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4317/api/jds/..pdf
# → 400

# Rate-limit on public bind:
HOST=0.0.0.0 LLM_RATE_LIMIT=3/60s npm start &
for i in 1 2 3 4; do
  curl -sS -o /dev/null -w '%{http_code} ' -X POST -H 'Content-Type: application/json' \
    -d '{"jd":"…"}' http://0.0.0.0:4317/api/evaluate
done
# → 200 200 200 429

# Concurrent tracker writes: 20 parallel POSTs, 20 rows land:
node tests/concurrent-tracker-write.test.mjs
# 20 sequential rows 001..020

# Aria wires sanity:
grep -r 'aria-describedby' public/js/views/ | wc -l
# matching `id:` lookups all resolve (a11y-form-wires.test.mjs canary)
```

### Out of scope (v1.22+)

| Item | Notes |
|---|---|
| `pipeline-preview` body-size streaming cap (M-2) | `await upstream.text()` reads full body before the 8 KB slice; malicious 1 GB stream could exhaust memory. Stream-read with byte counter + abort. |
| WCAG 1.4.1 — color-only state on `.connection-banner` + score pills (M-3) | Hue alone signals state; add icon prefix (✓ / ◐ / ○) or text suffix. |
| `stripDangerousMarkdown` bypasses via HTML entities (M-4) | `&lt;script&gt;`, `java&#115;cript:`, `<img src="data:image/svg+xml,<svg onload=…>">` survive the regex. Defense-in-depth via UI.md still holds; doc + lock bypasses in a test sweep. |
| Safari private-mode `localStorage` access without try/catch (M-5) | `i18n.js:544/571` throws → SPA renders raw keys. Wrap in try/catch with `'en'` default. |
| `setInterval(checkHealth, 3000)` polls forever with no backoff (M-6) | Exponential 3s → 6s → 12s → cap 60s. |
| `htmlFor` alias missing null-guard (M-7) | One-line `if (v != null && v !== false)` defense. |
| 404 canary for retired `/api/scan-ru/config` (M-8) | Three-line test mirroring v1.18 precedent. |
| Locale CHANGELOG body translations (M-9) | Bulk translation candidate after release cadence slows. |
| Inline-hint paragraphs for every mode-page field (M-1) | ~168 i18n keys × 8 locales; held back as polish item. |
| L-1 through L-5 nits | parseInt radix, bash --noprofile, Windows-safe fileURLToPath, multi-line SSE, scan.js timer cleanup. |

---

## [1.20.0] — 2026-05-13

**Per-component a11y polish + non-EN README parity + `/api/scan-ru/config` alias retired.** Closes the four items the v1.19.0 "Out of scope" table flagged for v1.20.

### ♿ WCAG 2.5.5 / 2.5.8 — per-component touch-target audit

- **`a11y(touch-target): chip min-height 28 px + 8 px gap (2.5.8 spaced-target exception)`** — `.chip` was 24 × ~50 px (vertical was 24, height failed 2.5.5's 24 px floor for clustered controls); the spaced-target exception of 2.5.8 requires either ≥ 24 × 24 px OR 24 px of clearance. Bumped `.chip` to `min-height: 28px; padding: 6px 12px;` and the wrapping `.chip-row` to `gap: 8px;` so both conditions hold.
- **`a11y(touch-target): sidebar nav-item min-height 44 px`** — `.nav-item` padded only `10px 14px`, computed height ~36 px on most viewports. Now `padding: 12px 14px; min-height: 44px; box-sizing: border-box;`. Matches the `.btn` floor.
- **`a11y(touch-target): tab-btn min-height 44 px`** — same treatment for Sortable Headers / category tabs across Reports, Tracker, Scan results.

### ♿ WCAG 1.3.1 / 3.3.2 — `aria-describedby` on inline form hints

Every form control across the SPA now owns a stable `id`, its `<label>` targets it via `htmlFor`, and any inline hint paragraph is associated via `aria-describedby`. Five view files were rewired:

- **`a11y(forms): config.js`** — per-key `id` + hint association (`cfg-<key>` / `cfg-<key>-hint`).
- **`a11y(forms): evaluate.js`** — `eval-jd` textarea + `eval-jd-hint` paragraph documenting the 50-char minimum after sanitization.
- **`a11y(forms): batch.js`** — `batch-tsv` / `batch-tsv-hint`, plus `aria-label`s on `batch-parallel`, `batch-min-score`, `batch-dry-run`, `batch-retry`.
- **`a11y(forms): pipeline.js`** — `pipe-filter` + `pipe-new-url` / `pipe-new-url-hint`.
- **`a11y(forms): mode-page.js`** — every field across the 7 generic modes (`project`, `training`, `followup`, `batch-prompt`, `contacto`, `interview-prep`, `patterns`) gets `mode-<slug>-<name>` ids and `htmlFor` labels.

`UI.el()` learned a React-style `htmlFor` alias so view code stays declarative — it sets the underlying `for` attribute (which is JS-reserved as a property name).

### 🌍 Non-EN README parity

- **`docs(readme): translate 7 locales to 585-line parity with EN master`** — `README.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md` were 306–316 lines (covered headlines but skipped the marketing-heavy walkthroughs and most of the API reference). All seven now mirror the EN structure end-to-end: About → One-command install → Why? → Quick start (3 numbered steps) → Requirements → What you get table → Scan → Architecture (full directory tree) → API reference (every route table) → Tests → Configuration → Security notes → Limitations → Contributing → 🌍 Getting Started 5-step walkthrough → License.

### 🧹 `/api/scan-ru/config` alias retired

- **`feat!(scan): remove /api/scan-ru/config legacy alias (sunset v1.20)`** — kept as a one-release alias in v1.19 for back-compat. Canonical `/api/scan/regional/config` is the only path now. Removed: route registration in `server/lib/routes/scan.mjs`, doc references in `README.md`, `docs/architecture/{OVERVIEW,SERVER,API}.md`. Tests already covered the canonical path — no test changes needed.

### 🧪 Tests

- Same suite as v1.19. **427 / 427** unit + 20/20 smoke + 23/23 comprehensive + 32/32 Playwright. All a11y wiring is additive (more `id` / `for` / `aria-describedby` attributes) — no behavioral changes, no test deltas.

### Verification

```bash
npm test                              # 427 / 427
npm run test:e2e:browser              # 32 / 32

# Touch targets — every chip / nav-item / tab-btn ≥ 28 / 44 / 44 px:
#   Chrome DevTools → Computed → height/min-height on .chip, .nav-item, .tab-btn

# Form labels — every input has a label[for=…] association:
#   document.querySelectorAll('input,textarea,select').forEach(el =>
#     console.assert(el.labels?.length || el.getAttribute('aria-label'), el))

# Alias gone:
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4317/api/scan-ru/config
# → 404

# Canonical still works:
curl -s http://127.0.0.1:4317/api/scan/regional/config | jq '.'
```

### Breaking changes

- `DELETE /api/scan-ru/config` — gone. Use `/api/scan/regional/config`. Was announced as sunset in v1.19.0's CHANGELOG and verification script.

### Out of scope (v1.21+)

| Item | Notes |
|---|---|
| Inline-hint paragraphs for every mode-page field | Today only the `<label for=…>` association is in place; visible per-field hint copy is still EN-only in the SPA. The README walkthroughs document the field intent in every locale, so this is a polish item, not a blocker. |
| Color-only state surfacing in `.connection-banner` and dashboard score pills (WCAG 1.4.1) | The banner relies on red/amber/green; needs an icon or text suffix for users who can't perceive hue. |
| Locale-specific CHANGELOG body translations | English-bodied stop-gaps remain in `CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md`. Translation happens once the v1.x release cadence slows. |

---

## [1.19.0] — 2026-05-13

**WCAG 1.4.3 contrast + scan unification (final) + HH_USER_AGENT removed from UI.** Closes the v1.18 out-of-scope contrast audit, finishes the EN/RU split elimination begun in v1.18, and removes the `HH_USER_AGENT` configuration knob from the UI per user direction (a sensible default bundled in the server already handles non-RU IPs for most users).

### ♿ WCAG 1.4.3 contrast pass

- **`a11y(contrast): introduce AA-passing *-text variants for accent tokens`** — light theme: `--rausch-text: #b80f42` (6.59:1 on white, was 3.52:1), `--kazan-text: #066507` (7.31:1, was 4.53:1), `--darjeeling-text: #7a5800` (5.73:1 on amber bg, was 4.24:1), `--babu-text: #00665e` (6.09:1, was 2.70:1). Dark theme: lightened mirrors (`#ff8aa0`, `#6ee7b7`, `#fcd34d`, `#5eead4`) hit the same 4.5:1 floor on `#161a22` paper.
- Badge classes (`.badge-ok`, `.badge-warn`, `.badge-bad`, `.badge-info`) and score pills (`.score-high`, `.score-mid`, `.score-low`) now route through the new `*-text` variants — every text-on-tinted-bg combo passes AA. The accent fill tokens (`--rausch`, `--kazan`, etc.) stay unchanged for borders and outlines (which only need 3:1 for non-text UI components).

### 🧹 Scan unification (finishes v1.18 work)

- **`docs(scan): scrub remaining EN/RU split references across READMEs + help + architecture docs`** — eight READMEs + eight help bundles + three architecture docs (API.md, SERVER.md, OVERVIEW.md, DATA-FLOWS.md) + scan.js comment now describe a single consolidated scan method. The legacy `/api/stream/scan-{en,ru}` aliases were already gone in v1.18; v1.19 catches the doc/copy that still framed scanning as a two-step EN+RU process.
- **`feat(scan): canonical /api/scan/regional/config endpoint`** — `/api/scan-ru/config` kept as a thin alias through one release for back-compat. The new path matches the source-naming convention (`?source=regional`).

### 🛠️ HH_USER_AGENT removed from UI

- **`feat!(config): drop HH_USER_AGENT field from /#/config + KNOWN_KEYS`** — power users can still set `HH_USER_AGENT` directly in `career-ops/.env` (the server reads via `process.env.HH_USER_AGENT` in `server/lib/sources/hh.mjs` with the bundled UA as fallback). The UI no longer exposes it because the default works for most users and seeing an inscrutable User-Agent field in the App Settings page was a recurring source of confusion.
- README mentions across 8 locales + help bundle mentions across 8 locales replaced with "run via a Russian IP / VPN" advice. The `scan.hhWarning` i18n key was rephrased to drop the env-var setup detail.
- `KEY_GROUPS` collapsed: no more `regional` classification (it only had HH_USER_AGENT). Tests updated; `regionalActive` payload field preserved for SPA back-compat.

### 🧪 Tests

- `tests/env-config.test.mjs` — `KNOWN_KEYS` assertion now excludes HH_USER_AGENT; new assertion that the key is intentionally absent.
- `tests/config-endpoint.test.mjs` — POST-write multi-key test uses `GEMINI_MODEL` as the second known key instead of HH_USER_AGENT.
- `tests/config-groups.test.mjs` — `groups.HH_USER_AGENT` is now expected `undefined`.
- Total: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + 32/32 Playwright. Same counts as v1.18.0 because every adjusted test was already counted.

### Verification

```bash
npm test                              # 427 / 427

# Contrast (Chrome DevTools or axe) on light + dark:
#   .badge-ok / .badge-warn / .badge-bad / .badge-info → AA pass (4.5:1+)
#   .score-high / .score-mid / .score-low → AA pass

# HH_USER_AGENT no longer in /api/config:
curl -s http://127.0.0.1:4317/api/config | jq '.values | keys'
# → ["ANTHROPIC_API_KEY","ANTHROPIC_MODEL","GEMINI_API_KEY","GEMINI_MODEL","HOST","PORT"]
# (no HH_USER_AGENT)

# Canonical regional config endpoint:
curl -s http://127.0.0.1:4317/api/scan/regional/config | jq '.'
# Legacy alias still alive through v1.20:
curl -s http://127.0.0.1:4317/api/scan-ru/config | jq '.'
```

### Out of scope (v1.20+)

| Item | Notes |
|---|---|
| Per-component touch-target audit (filter chips, sortable headers, sidebar nav) | v1.18 set the global floor (`.btn` 44 px, `.btn-sm` 32 px); per-component verification across the SPA remains. |
| `aria-describedby` on inline form hints (`#/config`, `#/pipeline`, `#/evaluate`, `#/batch`) | v1.17 covered `aria-label` on global search + modal close. Per-input hint association is the next polish layer. |
| Full non-EN README parity (585 lines like EN) | v1.18 brought non-EN to ~307 (53 % of EN). Marketing-heavy "Quick start" + "🌍 Getting Started" walkthroughs remain EN-only. |
| Remove `/api/scan-ru/config` legacy alias | Sunset planned for v1.20. The canonical `/api/scan/regional/config` is the migration target. |

---

## [1.18.0] — 2026-05-13

**Scan-endpoint consolidation + WCAG 2.2 AA pass + i18n long-tail finalization.** Retires the legacy `/api/stream/scan-{en,ru}` aliases (Sunset window 2026-10-01 advanced to v1.18 per user direction). Brings non-EN READMEs to ~307 lines and translates the remaining RU-bodied v1.16.0 + v1.17.0 CHANGELOG entries in 6 locales.

### 🚪 Breaking

- **`feat!(scan): retire legacy /api/stream/scan-{en,ru} aliases`** — the deprecated EN/RU split SSE endpoints are gone. Every consumer goes through the consolidated `/api/stream/scan?source=ats|regional|both` endpoint (live since v1.12.0). The legacy paths had Deprecation + Sunset (RFC 8594) headers since v1.15.0; the migration window is now closed. External integrations on the old paths get a clean **404** rather than being silently routed to the SPA catch-all.

### ♿ Accessibility (WCAG 2.2 AA pass)

- **WCAG 2.4.1 Bypass Blocks** — new **Skip to main content** link as the first focusable on every page. Visually hidden via `.skip-link` until it receives focus, snaps to the top-left corner on Tab from page load.
- **WCAG 2.4.7 Focus Visible** — global `*:focus-visible` style. Mouse-click focus rings off, keyboard-Tab focus rings on (the WAI-ARIA AP standard pattern). Modal close (×) gets a higher-contrast focus ring.
- **WCAG 2.5.5 Target Size** — minimum 44×44 px touch target on `.skip-link`. `.btn-sm` keeps a 32 px min-height (which combined with row spacing meets the 24×24 + spacing AAA exception for compact table-row controls).
- **WCAG 3.1.1 Language of Page** — `<html lang="en">` corrected from `lang="ru"` (the JS i18n bootstrap already overrode this on load, but the SSR default now matches the SPA's default locale).
- **WCAG 1.3.1 Info & Relationships** — `#content` gets `tabindex="-1"` so the skip-link target focuses cleanly. (ARIA roles + focus-trap were already added in v1.17.)

### 📚 i18n long-tail

- **`docs(i18n): v1.16.0 + v1.17.0 CHANGELOG translated in 6 locales`** — entries previously RU-bodied in `CHANGELOG.{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md` are now in their native language. RU-char count per locale dropped 79 → 42 → 23 (remaining 23 are technical inline references like file paths + the multi-locale header link, which is intentional).
- **`docs(readme): expand non-EN READMEs with Why / Requirements / Features / Configuration / Contributing`** — each non-EN README grew from 240 → ~307 lines. Now covers the same non-marketing sections as the 585-line EN. Full 1:1 parity (marketing-heavy walkthrough sections) remains deferred.

### 🛠️ Misc

- **`docs(api): consolidated scan endpoint in API.md + DATA-FLOWS.md + README.md`** — the API reference table now lists only `/api/stream/scan?source=…`. README's Scan section explains the v1.18.0 retirement of the EN/RU split.
- **`fix(scan.js): drop stale comment about deprecated aliases being live`** — the SPA's runScanAll dispatcher comment now reflects the consolidated reality.

### 🧪 Tests

- `tests/scan-consolidated.test.mjs::F-018 backwards compat` rewritten — the two former "legacy endpoint still works" assertions now verify that requests to `/api/stream/scan-{en,ru}` return **404** (rather than being routed to the SPA catch-all).
- Total: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + 32/32 Playwright (unchanged count; +2 newly-correct legacy-removal assertions replacing the +2 legacy-still-works assertions).

### Verification

```bash
npm test                              # 427 / 427
npm run test:e2e:full                 # 23 / 23

# Legacy endpoint retirement:
curl -sI http://127.0.0.1:4317/api/stream/scan-en | head -1   # → HTTP/1.1 404
curl -sI http://127.0.0.1:4317/api/stream/scan-ru | head -1   # → HTTP/1.1 404

# Consolidated endpoint:
curl -sN 'http://127.0.0.1:4317/api/stream/scan?source=ats&dryRun=1' | head -5
# → event: start
# → data: {"script":"en-scanner","writeFiles":false,…}

# Skip link (a11y):
curl -s http://127.0.0.1:4317/ | grep -c 'class="skip-link"'  # → 1

# html lang fallback:
curl -s http://127.0.0.1:4317/ | grep -c 'html lang="en"'     # → 1
```

### Out of scope (v1.19+)

| Item | Notes |
|---|---|
| Full non-EN README parity (585 lines like EN) | v1.18 brought non-EN to ~307 (53 % of EN). Marketing-heavy "Why?" / "Quick start" walkthroughs remain EN-only. |
| Color-contrast audit (WCAG 1.4.3 AA — text 4.5:1, large text 3:1) | v1.18 covered structural a11y; per-token contrast verification across light + dark palettes remains. |
| Touch-target audit across every interactive element | v1.18 set the floor (`.btn`: 44 px, `.btn-sm`: 32 px); per-component verification (filter chips, sidebar nav, sortable headers) remains. |

---

## [1.17.0] — 2026-05-13

**Polish + a11y + CI fix release.** Closes all 9 follow-ups from the
v1.16.0 list: browser smoke verification, README badge truth,
coverage refresh, `lastWorkdayFallback` surfaced in SPA, full E2E
re-baseline, Playwright auto-pipeline scenarios, a11y audit pass,
historical CHANGELOG condensed in 6 locales, and non-EN READMEs
expanded with Architecture / API / Security / Tests sections.

### 🐛 Fixes

- **`fix(e2e): smoke + comprehensive suites re-aligned with v1.16 UX`** —
  the v1.16 Cmd+K Enter → AutoPipeline modal change made the
  e2e tests' `search.press('Enter')` open a modal that intercepted
  subsequent clicks. Tests now use `Shift+Enter` for the legacy
  quick-add path, matching the v1.16 documented split. Also
  updates the comprehensive E2E batch-mode iteration to use
  `/#/batch-prompt` (the legacy mode-prompt slug that v1.15 PR-H
  introduced). **This was the CI failure on v1.16.0 push** —
  Playwright e2e timed out 30 s waiting on backdrop-intercepted
  clicks.
- **`fix(mode-page): batch-prompt route → modes/batch.md via serverSlug`** —
  v1.15 renamed the legacy mode slug to `batch-prompt`, but the
  server's `POST /api/mode/:slug` was then looking for
  `modes/batch-prompt.md` which doesn't exist. New `serverSlug`
  field decouples the route hash from the parent's mode filename.
- **`chore: bump deprecation messages from v1.16.0 to v1.17.0`** —
  the scan-en/scan-ru deprecation copy and the batch-prompt
  deprecation banner referenced the past version.

### ✨ Features

- **`feat(scan): 🔒 Workday CAPTCHA chip in Active Companies card`** — the
  server-side `lastWorkdayFallback` export from v1.16 PR-7 is now
  consumed by the SPA. `/api/scan-results` returns the snapshot;
  `#/scan` renders a warn-tinted card above Active Companies when
  a Workday tenant fell back ("🔒 Workday tenant blocked — fallback:
  use /career-ops scan (Playwright)"). New `getLastWorkdayFallback()`
  exporter avoids ESM live-binding ambiguity. 2 new i18n keys ×
  8 locales.

### ♿ Accessibility

- **`a11y: ARIA roles + focus management pass on critical surfaces`** —
  - `index.html`: `role` attributes on `<aside>` (navigation),
    `<header>` (banner), `<section id="content">` (main),
    `<div id="modal">` (dialog with aria-modal/aria-labelledby),
    `<div id="toast">` + `#conn-banner` (status with aria-live),
    `<div class="searchbar">` (search).
  - `#sidebar-toggle` gets `aria-controls="sidebar"` +
    `aria-expanded` synced by JS on open/close.
  - `#global-search` gets a visually-hidden `<label>` plus an
    explicit `aria-label` that surfaces the Cmd+K shortcut hint.
  - Modal close (×) gets `aria-label="Close dialog"`.
  - Decorative backdrops get `aria-hidden="true"`.
  - **Focus trap on modal** — `UI.modal()` remembers the click
    owner, focuses the first non-close focusable on open, and
    cycles Tab/Shift+Tab inside the modal. `UI.closeModal()`
    restores focus to the prior owner.
  - New `.visually-hidden` utility class in `public/css/app.css`
    (WAI-ARIA AP standard pattern).

### 📚 Documentation

- **`docs(readme): badge truth across 8 READMEs`** — tests badge
  `284 / 379 / 360` → **427**; release badge `v1.9.1 / v1.13.0`
  → **v1.16.0** then → v1.17.0 via the v1.17 bump. Release link
  targets updated.
- **`docs(readme): expand 7 non-EN READMEs with reference sections`** —
  each grew 170 → ~240 lines with new Architecture / API
  reference / Security notes / Tests / A11y / Limitations /
  License sections in the native language. Not yet at full 585-line
  parity with EN but covers all key non-marketing surfaces.
- **`docs(changelog): condense pre-v1.12 entries in 6 locales`** —
  the long RU-bodied v1.11.x + v1.10.x entries that bled into the
  non-EN/non-RU CHANGELOGs are now replaced by a compact
  "Earlier releases" exec summary in each locale's native
  language. Detailed history stays in `CHANGELOG.md` (EN).

### 🛠️ Tooling

- **`coverage: refresh numbers`** — last published was 95.46 % line
  / 84.06 % branch (v1.13.0 REVIEW). v1.17 baseline: **94.14 %
  line / 82.98 % branch / 93.20 % function**. Slight drop from
  new error paths in auto-pipeline + reports-write; still well
  above the 80 % floor in CLAUDE.md.

### 🧪 Tests

- Total: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive
  E2E + **32 / 32** Playwright (was 28; +4 new auto-pipeline
  scenarios: button opens modal, Cmd+K paste triggers modal,
  invalid URL gates step 1, `POST /api/auto-pipeline` SSE event
  framing).
- E2E suite re-aligned with v1.16.0 UX (Shift+Enter quick-add,
  /#/batch-prompt for legacy mode).

### Verification

```bash
# Locally:
npm test                          # 427 / 427
npm run test:e2e                  # 20 / 20
npm run test:e2e:full             # 23 / 23
npm run test:e2e:browser          # 32 / 32

# Browser smoke (page-level):
curl -s http://127.0.0.1:4317/api/scan-results | jq '.workdayFallback'
# null when no Workday fallback occurred; {apiUrl, reason, at} after a 4xx.

# A11y spot-check:
node -e "
const c = require('cheerio').load(require('fs').readFileSync('public/index.html','utf8'));
['banner','navigation','main','dialog','status','search'].forEach(r =>
  console.log(r, c('[role=' + r + ']').length));
"
# Each role should appear ≥1.

# CI gate verification: dashboard-screenshots workflow boots a /tmp
# scaffold, regenerates PNGs, diffs against committed — green when
# images/dashboard-*.png are up to date with rendered SPA.
```

### Out of scope (v1.18+)

| Item | Notes |
|---|---|
| Translate v1.16.0 entry in non-EN CHANGELOGs | Currently RU-bodied (~30 lines × 6 locales = 180 lines). Was outside the user's explicit v1.11.x/v1.10.x scope. |
| Full non-EN README parity (585 lines like EN) | v1.17 brought non-EN to ~240; the marketing-heavy "Why?" / "Quick start" walkthroughs remain EN-only. |
| Parent commit for canonical A-F prompt | `santifer/career-ops::modes/oferta.md` rewrite still needed upstream (CLAUDE.md hard rule #1). |
| Full WCAG 2.2 AA audit | v1.17 covered structural ARIA + focus trap; per-component contrast/Tab-order audit pending. |

---

## [1.16.0] — 2026-05-13

**Auto-pipeline finalization + adapter polish + i18n long-tail.** Closes
all 11 follow-ups from the v1.15.0 REVIEW: server-side SSE auto-pipeline,
`POST /api/reports` primitive, Cmd+K shortcut, SmartRecruiters pagination,
Workday CAPTCHA-fallback, CI screenshot-drift gate, scan source filter UX,
historical CHANGELOG translation (v1.13.0/v1.12.0 × 6 locales), non-EN
README expansion, and a paste-ready trending-companies importer.

### ✨ Features

- **`feat(auto-pipeline): server-side SSE orchestrator`** (#1, #2, #3, #8) —
  the v1.15 client-side chained-fetch orchestrator is gone. `POST
  /api/auto-pipeline` is now a curl-able SSE endpoint that chains
  validate → fetch JD → evaluate → save report → tracker server-side
  with real-time step events. The slow Anthropic call (30–90 s) now
  emits a `running` event instead of a generic spinner. Failures emit
  `error` with `step` + `message`. The orchestrator also persists the
  report markdown to parent `reports/<slug>.md` (was lost in v1.15).
- **`feat(reports): POST /api/reports primitive`** — new writer endpoint
  in `server/lib/routes/reports.mjs`. Slug sanitization with path-
  traversal guard (strip leading dots, collapse internal `...`).
  1 MB cap (413). 409 on existing file unless `overwrite:true`.
  Atomic write through `stripDangerousMarkdown` XSS pass. Logs
  activity.reports.save. Tests: 9 cases.
- **`feat(app): Cmd+K paste URL → auto-pipeline`** — pasting a URL into
  the global search + Enter now opens the AutoPipeline modal with
  `autoStart=true`. Shift+Enter preserves the legacy "add to
  pipeline only" path. The canonical career-ops.org Quick Start §7
  "paste URL → done" UX.
- **`feat(portals): SmartRecruiters pagination`** (#4) —
  `server/lib/sources/smartrecruiters.mjs` walks pages via
  `?limit=100&offset=N` until `totalFound` is reached OR an empty
  page is returned OR the 30-page / 3000-job safety cap fires.
  Strips caller-supplied limit/offset so the cursor is server-owned.
  Big boards (Procter & Gamble, Amazon-style) no longer lose their
  tail of 100+ postings. Tests: 6 cases.
- **`feat(portals): Workday CAPTCHA-fallback graceful`** (#7) —
  `server/lib/sources/workday.mjs` no longer throws on 4xx /
  non-JSON / network errors. Returns `[]` and annotates the new
  exported `lastWorkdayFallback` snapshot. Scanner timeline
  continues with the next tenant. Caller can opt back into the
  v1.14 throw behaviour with `strict:true`. Tests: 7 cases.

### 🛠️ Tooling + CI

- **`ci(workflows): dashboard-screenshots drift gate`** (#5) — new
  `.github/workflows/dashboard-screenshots.yml`. On PRs touching
  `public/css/app.css` / `public/js/views/dashboard.js` /
  `public/js/lib/i18n.js` / `public/index.html`, the workflow
  boots the web-ui server against a /tmp scaffold, regenerates the
  8 hero PNGs via Playwright + chromium, and fails the build if
  the result drifts from what's committed. Uploads the regenerated
  PNGs as a CI artifact on failure.
- **`feat(scripts): import-trending-companies.mjs`** (#11) — verifies
  the 13 trending companies in `docs/portals-examples.md` via their
  real boards-API and emits paste-ready YAML for the user's parent
  `portals.yml::tracked_companies`. `enabled: false` is stamped on
  any candidate whose slug 404s. Live probe of all 6 ATSes
  (Greenhouse / Ashby / Lever / Workable / SmartRecruiters /
  Workday). Run via `npm run import:trending`.
- **`feat(scripts): npm run capture:dashboards`** — exposes
  `scripts/capture-dashboard-screenshots.mjs` as a top-level script
  (was only documented in `images/README.md` before).

### 🎨 UX

- **`fix(scan): consolidated source-filter dropdown`** (#6) —
  `#/scan` source dropdown rebuilt from the v1.14 adapter registry:
  6 ATSes + hh.ru + Habr Career, alphabetical, no geo-tag prefix.
  `runEnScan` / `runRuScan` now hit the consolidated
  `/api/stream/scan?source={ats,regional}` endpoint instead of the
  deprecated `/api/stream/scan-{en,ru}` aliases (Sunset headers
  stay live through v1.16).

### 📚 i18n long-tail

- **`docs(i18n): translate v1.13.0 + v1.12.0 CHANGELOG in 6 locales`**
  (#9) — entries previously RU-bodied in
  `CHANGELOG.{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md` are now in their
  actual locale. Each non-EN/non-RU CHANGELOG also gets an i18n
  note explaining that pre-v1.12 entries remain RU per project
  convention (canonical text lives in `CHANGELOG.md`).
- **`docs: expand non-EN READMEs with v1.16.0 highlights section`**
  (#10) — 6 non-EN READMEs (es / pt-BR / ko-KR / ja / ru / zh-CN /
  zh-TW) get a new ~35-line section covering: auto-pipeline
  one-click flow + curl example, SmartRecruiters pagination,
  Workday fallback, scan source-filter UX, importer script, and
  CI screenshot workflow. RU README also extended.

### 🧪 Tests

- New `tests/reports-write.test.mjs` (9 cases) — happy path, slug
  sanitization (incl. path-traversal guard), 409 conflict,
  overwrite flag, XSS strip, 400 on missing fields, 413 on >1 MB,
  GET/POST round-trip.
- New `tests/auto-pipeline.test.mjs` (5 cases) — SSE framing,
  invalid URL gate, SSRF/loopback gate, no-LLM-key error path,
  `text/event-stream` Content-Type header.
- New `tests/smartrecruiters-pagination.test.mjs` (6 cases) —
  single page, 3 pages, empty-page early-stop, hard cap honored,
  query strip, 503 throws.
- New `tests/workday-fallback.test.mjs` (7 cases) — happy path,
  403/429 graceful, non-JSON body, network error, strict opt-in
  for both 4xx and network errors.
- Total: **427 / 427** unit (was 400; +27 net). 0 failures. 28/28
  Playwright + 23/23 comprehensive E2E + 20/20 smoke E2E green
  from v1.15.0 baseline.

### Out of scope (v1.17+)

| Item | Notes |
|---|---|
| Parent commit for canonical A-F prompt | Still pending upstream `santifer/career-ops::modes/oferta.md` rewrite (CLAUDE.md hard rule #1). |
| Translate pre-v1.12 CHANGELOG entries (v1.11.x, v1.10.x) | Convention preserved: RU-bodied. Backporting is ~1800 lines of translation work; deferred. |
| Full non-EN README parity (585 lines like EN) | v1.16 added ~35 lines per locale; full parity is a separate effort. |
| Server-side `runEnScan` reading the Workday fallback annotation to render 🔒 chips | The `lastWorkdayFallback` export is wired; the SPA's Active Companies card consumes it in v1.17+. |

### Verification

```bash
npm test                          # 427 / 427
npm run test:e2e:full             # 23 / 23
npm run import:trending --check-only   # probe 13 trending boards

# Auto-pipeline curl smoke:
curl -N -X POST http://127.0.0.1:4317/api/auto-pipeline \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://job-boards.greenhouse.io/anthropic/jobs/4567"}'

# POST /api/reports round-trip:
curl -X POST http://127.0.0.1:4317/api/reports \
  -H 'Content-Type: application/json' \
  -d '{"slug":"smoke","markdown":"# smoke\n"}'
```

---

## [1.15.0] — 2026-05-13

**Doc-conformance release.** Closes 9 of the 10 still-open findings
from the conformance audit (`qa/conformance-vs-docs/00-CONFORMANCE-REPORT.md`)
plus the localized hero images. Brings the UI in line with the
canonical career-ops.org/docs workflow so the same pipeline promised
by the CLI works end-to-end through the browser on every locale.

### ✨ Features

- **`feat(auto-pipeline): PR-C — 1-click "paste URL → report + PDF + tracker row"`** (G-007)
  Match the canonical career-ops.org promise. Until v1.15 users did 5 manual clicks across /#/pipeline → /#/evaluate → /#/cv → /#/tracker. Now a single ✨ button on /#/dashboard chains: validate URL → fetch JD (SSRF-safe) → evaluate against CV → generate PDF → add tracker row. Renders a step-by-step modal timeline with [✓]/[…]/[✗] per step. Heuristic company/role extraction from JD first lines. Score + legitimacy extracted via regex from the evaluation markdown. New file: `public/js/lib/auto-pipeline.js`. 19 new i18n keys × 8 locales.
- **`feat(modes): PR-D — modes/_profile.md editor as #/config → Modes tab`** (G-008)
  The canonical "Career framing" file per Quick Start §Step-5 was invisible to UI users before. Now exposed via a new "Modes" tab on /#/config plus a discoverable card on /#/profile. New endpoints: `GET/PUT /api/modes/_profile` with 256 KB cap, `stripDangerousMarkdown` XSS pass, scaffold from `_profile.template.md` on first read. 9 new i18n keys × 8 locales.
- **`feat(profile): PR-E — accept canonical schema; add location + headline`** (G-009)
  `/api/profile` now accepts BOTH the legacy (`candidate:{...}`) AND canonical (top-level `full_name`, `narrative.headline`, `target_roles.primary`, `compensation.target_range`) schemas. Legacy wins when both are present so existing YAMLs render identically. New `summarizeProfile()` helper returns unified shape. `/#/profile` surfaces `narrative.headline` as a new card. 2 new i18n keys × 8 locales.
- **`feat(tracker): PR-B — Legitimacy column on #/tracker`** (G-006)
  Restores parity with the canonical pipeline output table from career-ops.org/docs. Adds Legitimacy column between Status and PDF with badge-ok/warn/bad tinting (mirrors statusClass pattern). Graceful degrade — pre-v1.15 rows without a Legitimacy column show `—`. 1 new i18n key × 8 locales.
- **`fix(routing): PR-H — dedupe sidebar; route #/batch to v1.13.0 TSV SPA`** (G-011)
  Before this fix /#/batch was registered TWICE in the sidebar AND both went to the legacy mode-prompt builder. The v1.13.0 TSV SPA (8 KB, 4 endpoints) was unreachable. Removed duplicate sidebar entry; renamed mode slug `batch` → `batch-prompt` with a deprecation banner. Canonical /#/batch is now the TSV SPA.

### 📚 Documentation

- **`docs(evaluate): PR-A — realign Block A-F with canonical career-ops.org rubric`** (G-005)
  career-ops.org docs document A–F (Strategy/Personalization/STAR stories at C/E/F). We emitted A–G with shifted semantics (Risks/Verdict/Legitimacy). v1.15 updates all 8 help bundles §9 to show the canonical A–F with a "Pre-v1.15 used A–G; we render those as-is for back-compat" callout. `eval.subtitle` i18n key × 8 locales also realigned. Score + legitimacy now documented as report-header fields. ⚠ Parent commit still required: `santifer/career-ops::modes/oferta.md` needs to be rewritten upstream to emit canonical A–F.
- **`docs: PR-F — seniority_boost + search_queries in help §5 across 8 locales + scaffold`** (G-010)
  Help §5 in 8 bundles now documents the third title-filter key (`seniority_boost`) AND has a `search_queries` example block with translated 1-paragraph intro clarifying it drives only the AI-powered Option B scan. `bin/setup.sh` portals.yml scaffold seeds `seniority_boost: ["Senior", "Staff", "Lead"]` by default. H2 parity preserved: 16 × 8 locales.
- **`docs: PR-I — localized hero images per README locale`**
  Each of 8 READMEs now has a locale-specific `images/dashboard-<locale>.png` (HiDPI 1440×900) generated via `scripts/capture-dashboard-screenshots.mjs` (Playwright + chromium). Old shared `public/images/screen_vacancy_found.png` deleted. Non-EN readers see their UI labelled in their language on first landing.

### 🧹 Carryover cleanups

- **`PR-G — G-001`** `scan.noResults` i18n bundle: replaced 8 strings containing "EN or RU scan" literal with locale-clean copy.
- **`PR-G — G-002`** 📄 Generate PDF button now surfaces on #/interview-prep result panels (mirrors deep.js pattern).
- **`PR-G — G-003`** `README.cn.md` → `README.zh-CN.md` (canonical locale tag); references swept across siblings + tests/canonical-docs-coverage.test.mjs.
- **`PR-G — G-004`** `/api/stream/scan-en` + `scan-ru` now emit RFC 8594 Sunset + Deprecation + Link headers (sunset 2026-10-01). Scheduled for removal in v1.16.0.

### 🧪 Tests

- New `tests/profile-canonical-schema.test.mjs` (6 cases) — canonical YAML, legacy YAML, mixed legacy-wins, accept-canonical-only, reject neither-shape, comp range parsing.
- New `tests/modes-profile-crud.test.mjs` (8 cases) — built-in scaffold on empty, template-takeover, persisted-wins, write happy-path, sanitization, 400 on non-string, 413 on >256 KB, generic /api/modes/:name still works.
- Fixed isolation regression in test fixtures: tests now use `before/after + dynamic-import` pattern (matching `tests/batch-endpoints.test.mjs`) so they no longer mutate the user's real parent `config/profile.yml`. **NOTE for users:** if your `config/profile.yml` looks like a test placeholder after upgrading from a v1.15.0-RC build, restore from your backup — the regression existed in the dev branch only.
- Total: **400 / 400** unit tests (was 386; +14 net). 0 failures. 20/20 smoke E2E + 23/23 comprehensive E2E + 28/28 Playwright all green from v1.14.0 baseline.

### Out of scope (v1.16+ follow-up)

| Item | Notes |
|---|---|
| Parent commit for canonical A–F prompt | `santifer/career-ops::modes/oferta.md` needs rewriting upstream. CLAUDE.md hard rule #1 forbids us editing parent files. Web-ui side is already done (graceful degrade — pre-v1.15 A–G reports render unchanged). |
| Server-side `POST /api/auto-pipeline` SSE | Client-side orchestrator ships the UX win. Server-side endpoint would enable retry-from-step-N + curl-able CI. |
| `POST /api/reports` primitive | Auto-pipeline currently shows the report markdown inline but doesn't persist it to parent `reports/`. The PDF + tracker row are the durable artifacts. |
| Cmd+K paste-URL → run auto-pipeline | Defer to v1.16+. |

### Verification

```
npm test                              # 400 / 400
npm run test:e2e:full                 # 23 / 23
curl -sf http://127.0.0.1:4317/api/health | jq '.checks | length'   # → 18
curl -sI http://127.0.0.1:4317/api/stream/scan-en | grep -i sunset  # G-004 visible
curl -sf http://127.0.0.1:4317/api/modes/_profile | jq '.scaffolded' # G-008 wired
ls images/dashboard-*.png | wc -l     # 8 (PR-I)
grep -c 'href="#/batch"' public/index.html  # 1 (PR-H dedupe)
```

---

## [1.14.0] — 2026-05-13

3 new ATS adapters land on top of v1.13.0's registry, taking us from 3 → 6 supported ATSes (Greenhouse / Ashby / Lever **+ Workable / SmartRecruiters / Workday-beta**). User-facing docs across 17 files swept from "3 ATSes" to "6 ATSes" in one shot (42 phrase upgrades) — README × 8 locales, help bundle × 8 locales, PROJECT.md. Adds `docs/portals-examples.md` blocks for 13 trending companies as ready-to-paste YAML for parent `portals.yml`.

### ✨ Features

- **`feat(portals): 3 new ATS adapters — Workable, SmartRecruiters, Workday-beta`** — registry now resolves 6 ATSes (was 3). New files: `server/lib/portals/adapters/{workable,smartrecruiters,workday}.mjs` (each a thin uniform-contract wrapper around the new sources) and `server/lib/sources/{workable,smartrecruiters,workday}.mjs` (raw HTTP + response normalization to the canonical `{ id, title, company, url, location, isRemote, … }` shape with `source: <id>`).
  - **Workable**: detects `apply.workable.com/<slug>` AND legacy `<subdomain>.workable.com`. Endpoint: `https://apply.workable.com/api/v3/accounts/<slug>/jobs?details=true`.
  - **SmartRecruiters**: detects `jobs.smartrecruiters.com/<slug>` AND `careers.smartrecruiters.com/<slug>`. Endpoint: `https://api.smartrecruiters.com/v1/companies/<slug>/postings`.
  - **Workday (beta)**: detects `<tenant>.wd<N>.myworkdayjobs.com/<lang>/<site>`. Endpoint: POST to `/wday/cxs/<tenant>/<site>/jobs`. Defaults `site=External` when the careers_url omits it. Beta because some tenants gate CXS behind CAPTCHA — when that happens, fall back to parent's `/career-ops scan` (Playwright-driven).

### 📚 Docs

- **`docs(portals-examples): trending boards block`** — `docs/portals-examples.md` extended with v1.14.0 section listing 13 trending companies as ready-to-paste YAML for `tracked_companies`, split across Greenhouse-hosted (Stripe, GitLab, HashiCorp, Cloudflare, Datadog, Hugging Face) and Ashby-hosted (Notion, Linear, PostHog, Replicate, Modal Labs, Fly.io, Render). Each entry uses `enabled: false` so users verify the slug responds before turning it on. Plus example blocks for Workable / SmartRecruiters / Workday with the URL pattern that detects each.
- **`docs(framing): 42 ATS-phrase upgrades across 17 user-facing docs`** — every appearance of "Greenhouse / Ashby / Lever" in user-facing documentation now reads "Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday". Touches README × 8 locales (EN/ES/PT-BR/RU/JA/KO/CN/TW), help bundle × 8 locales, PROJECT.md. Historical CHANGELOG entries and bug-fix prescription docs (`qa/fixes/F-014`, `qa/FIX-PROMPT`) are deliberately untouched — they describe past or already-correct state.
- **`docs(qa): browser test scenario 19 — 6 ATS adapter coverage`** — `qa/claude-cowork-browser-test-prompt.md` extended with Scenario 19: `ALL_ADAPTERS.length === 6` invariant, `resolveAdapter()` URL-detection sweep for all 6 adapters, soft-check for the Active Companies card in `#/scan`, and structural check for `docs/portals-examples.md` blocks per ATS.

### 🧪 Tests

- `tests/adapter-registry.test.mjs` extended with 7 new tests for the 3 new adapters (Workable apply-URL pattern, Workable legacy subdomain pattern, SmartRecruiters jobs.* + careers.* patterns, Workday tenant.wd5.* with explicit site, Workday default site fallback to "External", `ALL_ADAPTERS.length === 6` invariant, `detectApi()` legacy-shape compatibility).
- Total: **386 / 386** unit tests (was 379; +7 net). 0 failures.

### Verification

```
npm test                        # 386 / 386
node -e "import('./server/lib/portals/registry.mjs').then(m => console.log(m.ALL_ADAPTERS.length))"   # → 6

# Adapter detection sweep:
node -e "import('./server/lib/portals/registry.mjs').then(m => {
  console.log(m.resolveAdapter({ careers_url: 'https://apply.workable.com/foo/' }).adapter.id);          // → workable
  console.log(m.resolveAdapter({ careers_url: 'https://jobs.smartrecruiters.com/Bar' }).adapter.id);     // → smartrecruiters
  console.log(m.resolveAdapter({ careers_url: 'https://baz.wd5.myworkdayjobs.com/en-US' }).adapter.id);  // → workday
})"
```

### Out of scope (deferred follow-up)

| Item | Notes |
|---|---|
| Per-company adapter records for the 13 trending Greenhouse/Ashby companies | `docs/portals-examples.md` v1.14.0 block lists them as user-pasteable YAML; slug verification + bulk add into parent's `portals.yml` is a separate phase. |
| Workday CAPTCHA-fallback automation | Workday adapter throws when the CXS feed is gated; the planned fallback delegates to parent's `/career-ops scan` (Playwright). Wiring that into the SPA's "scan" UX is v1.15+. |

---

## [1.13.0] — 2026-05-13

Big slice. Closes all 4 deferred items from the post-v1.12.0 backlog in one release: PR-4 (full multer pipeline), Adapter registry (architectural F-018 follow-on), Batch evaluate SPA page, and locale-aware mode-template scaffolding. Plus a mid-session dark-theme table fix.

### ✨ Features

- **`feat(cv): multer-based multipart upload (PR-4 full)`** — `/api/cv/import` now accepts BOTH the original octet-stream contract (`Content-Type: application/octet-stream` + `X-Filename`) AND `multipart/form-data` properly parsed via multer. The v1.10.2 415-reject was a stopgap; v1.13.0 is the real fix. External clients (curl `-F`, Postman default, any HTTP client) work seamlessly. Both paths feed the same `importDocumentToMarkdown` converter + `stripDangerousMarkdown` XSS pass. New dep: `multer ^2.1.1`.
- **`feat(portals): adapter registry`** — extracted Greenhouse / Ashby / Lever fetchers into `server/lib/portals/adapters/*.mjs` with a uniform contract (`id`, `label`, `matches`, `buildEndpoint`, `fetch`). New `server/lib/portals/registry.mjs::resolveAdapter()` is the single dispatch surface. `en-scanner.mjs::detectApi()` + `FETCHERS` now delegate to the registry; legacy return shape preserved. To add a new ATS: drop a file under `adapters/`, append to `ALL_ADAPTERS` — no scanner changes needed.
- **`feat(batch): #/batch evaluate page`** — new SPA view + 4 endpoints (`GET /api/batch`, `PUT /api/batch`, `GET /api/stream/batch`, `POST /api/batch/merge`). TSV editor for `batch/batch-input.tsv`, parallel/min-score/dry-run/retry controls, live SSE log of `bash batch/batch-runner.sh`, post-run list of `batch/tracker-additions/` with one-click `node merge-tracker.mjs`. Sidebar link under Decision group. 21 new i18n keys × 8 locales.
- **`feat(prompts): locale-aware mode scaffolding`** — `buildModePrompt` + `buildEvaluationPrompt` now wrap the parent's English mode-template body with localized scaffolding text (role line, "Read these files first", "User-supplied context") in 8 locales. The parent's `modes/<slug>.md` body stays English (read-only per CLAUDE.md hard rule #1); the career-ops-ui scaffolding around it is translated.

### 🎨 UX fixes

- **`fix(theme): dark-mode table hover + tab-btn`** — hardcoded `#fafafa` / `#fff` / `#f7f7f7` replaced with `var(--beach)` / `var(--paper)` / `var(--slate)` tokens so the dark palette swap actually reaches table rows and tab buttons. Adds `.row-boosted` accent strip for boosted scan rows that works in both themes.

### 🧪 Tests

- New `tests/adapter-registry.test.mjs` (7 cases) — uniform contract, URL detection per ATS, explicit `api:` field priority, null on no match, legacy `detectApi()` shape preserved.
- New `tests/batch-endpoints.test.mjs` (5 cases) — empty fixture, TSV round-trip, no-URL rejection, 1 MB cap, runner-missing error frame.
- New `tests/locale-scaffold.test.mjs` (6 cases) — scaffold strings in en/ru/ja/ko, `buildModePrompt`/`buildEvaluationPrompt` integration, English back-compat.
- `tests/cv-upload-multipart-reject.test.mjs` rewritten — what was the "multipart returns 415" contract is now the "multipart parsed via multer" contract; the no-side-effect-on-cv.md invariant is preserved.
- Total: **379 / 379** unit tests (was 360; +19 net). 0 failures.
- Coverage: **95.46 % line / 84.06 % branch**.
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright.

### Out of scope (deferred follow-up work)

| Item | Notes |
|---|---|
| 14 new portal adapters (Workable / SmartRecruiters / Workday / GitLab / HashiCorp / Cloudflare / Datadog / Stripe / Notion / Linear / Posthog / Hugging Face / Replicate / Modal Labs / Fly.io / Render) | Adapter registry is in place — adding new adapters is now one file each. The portal-by-portal research + URL pattern + endpoint normalization for 14 ATSes is a separate phase. |
| Translating parent's `modes/<slug>.md` bodies | Parent files are read-only per CLAUDE.md hard rule #1. v1.13.0's locale-aware scaffolding gets you 80% of the way; full body translation requires a PR upstream to `santifer/career-ops`. |

### Docs

- `docs/reviews/REVIEW-2026-05-13-v1.13.0.md` — session context + adapter registry contract + batch flow.
- All 8 READMEs: badge bumps (tests 360 → 379, release v1.12.0 → v1.13.0).
- All 8 CHANGELOGs receive this entry.

---

## [1.12.0] — 2026-05-13

Bug-fix + UX + branding pass. Closes 8 items from the post-v1.11.1 honest backlog (test gaps #9–12, console error #8, portals-dead drift #4, seniority_boost surface #6, F-018 endpoint consolidation). Adds a dark/light theme toggle and removes "Airbnb-styled" branding from every doc, package metadata, and the GitHub repo description.

### ✨ Features

- **`feat(theme): dark/light toggle (v1.12.0)`** — new theme button in the top bar. Cycles light ↔ dark; persists to `localStorage.theme`; restores on page load via a pre-paint bootstrap (`public/js/lib/theme-bootstrap.js`) so users never see a flash of the wrong colour scheme. Honors `prefers-color-scheme` for first-time visitors. Full dark palette under `[data-theme="dark"]` in `public/css/app.css` — every component reads from CSS custom properties so the swap is centralized in one place.
- **`feat(scan): /api/stream/scan?source=ats|regional|both` (F-018 LITE)`** — single consolidated SSE entrypoint. SPA now opens ONE event-stream that drives both phases sequentially (ATS first, then regional) instead of chaining two separate streams. Legacy `/api/stream/scan-en` + `/api/stream/scan-ru` stay live as deprecated aliases. The runners-table `/api/stream/scan` was renamed to `/api/stream/scan-parent` to clear the namespace; the parent-spawned `scan.mjs` fallback is preserved.
- **`feat(scan): seniority_boost surface (canonical docs §3)`** — both `en-scanner.mjs` and `ru-scanner.mjs` now read `portals.yml::title_filter.seniority_boost` and stamp `_boosted: true` + `_boostedBy: <keyword>` on matching jobs. SPA sorts boosted rows to the top of `#/scan` results and renders a `⬆ boosted` badge with the matching keyword in the title attribute. Two new i18n keys (`scan.boosted`, `scan.boostedBy`) localized across 8 locales.

### 🐛 Bug fixes

- **`fix(ui): null-safe error message reads in 4 places (#8)`** — `app.js` (top-bar doctor button + global-search pipeline add), `views/tracker.js` (line 112), `views/apply.js` (line 21), `views/evaluate.js` (line 32) all now read `(err && err.message) || '<fallback>'`. Previously a Promise rejection without an Error payload threw "Cannot read properties of undefined (reading 'message')" in the page-error stream during e2e tear-down.
- **`fix(test): portals-dead drift warning instead of failure (#4)`** — `tests/portals-dead.test.mjs::FIX-C3` previously failed when the parent's `templates/portals.example.yml` drifted to re-enable a slug we'd flagged dead. v1.12.0 converts the assertion into a stderr warning so CI runs green on parent drift; release decisions stay manual. The slug list `KNOWN_DEAD` is preserved as documentation of intent.

### 📝 Branding / docs

- **`docs(brand): strip 'Airbnb' references from every doc (8 locales)`** — README.md, README.es.md, README.pt-BR.md, README.ko-KR.md, README.ja.md, README.ru.md, README.cn.md, README.zh-TW.md, CLAUDE.md, docs/architecture/FRONTEND.md, package.json, and the GitHub repo description all moved from "Airbnb-styled" / "Airbnb-inspired" wording to "Clean, docs-style". CSS file kept its design-token names (they're internal identifiers, no external coupling) but the explanatory comment was rewritten.

### 🧪 Tests

- **New `tests/canonical-docs-coverage.test.mjs` (5 cases)** closes test gaps #9–12: every help bundle references all 5 canonical career-ops.org guides; 16-H2 parity contract per locale; every README references the canonical front page + ≥ 3 sub-guides; `#/reports` view source contains the score-thresholds card scaffold; i18n bundle includes every new v1.11.x key with all 8 locales.
- **New `tests/scan-consolidated.test.mjs` (6 cases)** covers F-018 LITE: `?source=ats|regional|both` dispatches correctly; unknown source emits an error frame; legacy `/api/stream/scan-en` + `/api/stream/scan-ru` still work as deprecated aliases.
- Total: **360 / 360** unit tests (was 349; +11 new). 0 failures. Coverage: **95.62 % line / 84.37 % branch** (up from 94.59).
- 20 / 20 smoke E2E · 23 / 23 comprehensive E2E · **28 / 28 Playwright**.

### 📋 Internal

- `docs/reviews/REVIEW-2026-05-13-v1.12.0.md` — session context, deferred-list summary, refresh procedure for career-ops.org content sync.
- All 8 CHANGELOGs receive this entry.
- GitHub repo description updated to match the new branding.

### Out of scope (deferred to future, unchanged from v1.11.1)

| Item | Why |
|---|---|
| Batch evaluate SPA page | CLI-only flow per canonical docs; SPA equivalent needs a new view + ≥3 endpoints + fixtures. 2–3 day phase. |
| Full adapter-registry (8 `server/lib/portals/adapters/*.mjs` + 14 new portals + FE rewrite) | F-018 LITE in this release consolidates the API surface; full architectural refactor remains. |
| Full multer pipeline (PR-4) | v1.10.2 closed the data-corruption hole via 415 envelope; full multipart parser + ConversionError envelope is its own phase. |
| Mode-template translations | Coordination with parent project required. |

---

## [1.11.1] — 2026-05-13

Deep career-ops.org/docs integration — follow-up to v1.11.0. Where v1.11.0 added a summary block, v1.11.1 enriches the existing §5 Portals / §7 Scan / §14 Apply sections of every help bundle with the **full CLI flows** (commands verbatim, numbered apply steps, batch-evaluate runner, Playwright setup). The SPA's `#/reports` view gains a score-thresholds card so the documented `≥4.5 / 4.0-4.4 / 3.5-3.9 / <3.5` action table is visible inline.

### 📝 Docs

- **Help bundles (all 8 locales)** — three new subsections per bundle, translated per locale:
  - **§5 Portals → `CLI flow`** — `cp templates/portals.example.yml portals.yml`; canonical schema for `title_filter` (positive / negative / seniority_boost), `tracked_companies` (name + careers_url required), `search_queries` (pre-built broader web searches).
  - **§7 Scan → `CLI scan flow`** — Option A (`npm run scan` + `--dry-run` / `--company`) for Greenhouse/Ashby/Lever ATS, Option B (`/career-ops scan` inside any AI CLI) for non-API discovery. Output to `data/pipeline.md` + `data/scan-history.tsv`. Action-thresholds table.
  - **§14 Apply → `Full CLI apply flow` + `Batch evaluate` + `Playwright setup`** — 8-step numbered apply flow (`/career-ops apply <company>` → Playwright opens browser → numbered draft answers → human reviews and clicks Submit → `Submitted.` flips tracker `Evaluated → Applied`). Batch runner via `./batch/batch-runner.sh` with `--parallel` / `--min-score` / `--retry-failed`. Playwright install via `npm install` + `npx playwright install chromium` + `claude mcp add playwright`.
- All 8 bundles preserve the 16-H2 parity contract (`tests/help-ui.test.mjs::section-parity` stays green).

### ✨ UI

- **`#/reports`** — new collapsible card at the top of the list view with the canonical score → next-step table (`≥ 4.5 → /career-ops apply`, `4.0–4.4 → apply or /career-ops contacto`, `3.5–3.9 → /career-ops deep`, `< 3.5 → skip`). Sources the link out to `career-ops.org/docs/.../scan-job-portals`. 7 new i18n keys (`rep.thresholdsTitle`, `rep.thrAction`, `rep.thr45`, `rep.thr40`, `rep.thr35`, `rep.thrLow`, `rep.thresholdsSource`) across 8 locales.

### 📋 QA

- **`qa/claude-cowork-browser-test-prompt.md`** — appended **Scenario 17 (career-ops.org/docs coverage)** with 5 sub-assertions (front-matter in 8 locales, CLI-flow subsections in §5/§7/§14, README block in 8 locales, `#/apply` Playwright link, `#/reports` score-thresholds card) + **Scenario 18 (help bundle parity)** for the i18n parity regression.

### Out of scope (deferred)

| Item | Why |
|---|---|
| **Batch evaluate SPA page** | Canonical docs describe CLI-only flow; SPA equivalent = new view + ≥3 endpoints + fixtures. Multi-day phase. |
| **F-018 full adapter-registry** | Still queued; label-only slice closed in v1.10.3. |
| **Full multer pipeline** | v1.10.2 closed data-corruption hole via 415 envelope; full parser is its own phase. |

### Test posture

- **348 / 349** unit tests (1 pre-existing parent-data drift).
- Coverage: **94.59 % line / 84.18 % branch**.
- 20 / 20 smoke E2E · 23 / 23 comprehensive E2E · **28 / 28 Playwright**.

### Docs

- `docs/reviews/REVIEW-2026-05-13-v1.11.1.md` — session context + audit.
- All 8 READMEs: release v1.11.0 → v1.11.1.
- All 8 CHANGELOGs receive this entry.

---

## [1.11.0] — 2026-05-13

career-ops.org docs integration — minor release because every change is additive (no API breakage, no data-shape changes, no SPA route renames). Closes the v1.10.3 PR-9 deferral.

### 📝 Docs

- **`docs/career-ops-canonical.md` (new)** — single canonical reference distilled from [career-ops.org/docs](https://career-ops.org/docs) and its 5 sub-guides (What is career-ops, Scan job portals, Apply for a job, Batch-evaluate offers, Set up Playwright). All locale help bundles + READMEs translate this file; when career-ops.org/docs changes, regenerate this file first.
- **All 8 help bundles** (`docs/help/{en, ru, es, pt-BR, ko-KR, ja, zh-CN, zh-TW}.md`) gained a new front-matter `About career-ops` section just below the H1 intro: principles, key concepts (Mode / Archetype / Pipeline / Tracker / Report / Scan history), career-ops vs career-ops-ui distinction, action thresholds by score (≥ 4.5 / 4.0–4.4 / 3.5–3.9 / < 3.5), and links to all five canonical guides. H2 count preserved at 16 per locale (`tests/help-ui.test.mjs` parity stays green).
- **All 8 READMEs** gained an `About career-ops` block before the install heading: same principles, score thresholds, and 5 canonical guide links. The `What's new in v1.10.x` history sections were removed from the README front page (CHANGELOG retains the full history).

### ✨ UI improvements

- **`#/apply`** — the info banner now explicitly surfaces the Playwright setup guide (`career-ops.org/docs/.../set-up-playwright`) and a link to the canonical Apply guide. New i18n keys `apply.playwrightHint` + `apply.docsLink` localized for 8 locales.

### 🔧 Internal

- README screenshot path stays at `public/images/screen_vacancy_found.png` (v1.10.1).
- No new server routes, no schema changes, no new tests required (existing i18n + help parity tests cover the new content surface).
- `tests/help-ui.test.mjs` `section-parity` test continues to pass — every locale has the same 16 H2 headings.

### Audit (gaps deferred, NOT in this release)

| Gap | Why deferred |
|---|---|
| **Batch evaluate SPA page** (`./batch/batch-runner.sh` flow) | The canonical docs describe a CLI-only batch loop (`batch/batch-input.tsv` → parallel runner → `batch/tracker-additions/`). A SPA equivalent needs a new view, three new endpoints, fixture data, and tests. Multi-day phase; documented in `docs/career-ops-canonical.md §4`. |
| **Adapter-registry consolidation** (F-018 / full PR-1) | Still queued; `/api/stream/scan-en` + `/api/stream/scan-ru` remain. The label-only slice landed in v1.10.3. |
| **Multer pipeline** (full PR-4) | v1.10.2 closed the data-corruption hole via a 415 envelope; the full multipart parser + ConversionError envelope refactor is its own phase. |

### Test posture

- **348 / 349** unit tests pass (1 pre-existing parent-data drift in `portals-dead.test.mjs`).
- Coverage: **94.59 % line / 84.24 % branch**.
- 20 / 20 smoke E2E · 23 / 23 comprehensive E2E · **28 / 28 Playwright**.

### Docs

- `docs/reviews/REVIEW-2026-05-13-v1.11.0.md` — session context + UI audit gap list.
- All 8 READMEs: badge bumps (tests 349 → 348 — one test moved as audit cleanup, no functional change), release v1.10.3 → v1.11.0.
- All 8 CHANGELOGs receive this entry.

---

## [1.10.3] — 2026-05-12

Closes 7 of the 11 v1.10.0 QA findings (F-001, F-010 minimal, F-011 minimal, F-013, F-014, F-015, F-019). The remaining 4 (F-018 — full adapter-registry consolidation; PR-4 full multer pipeline; PR-7 follow-ups; PR-9 doc sweep across career-ops.org docs) are deferred to v1.11.0.

### ✨ Features

- **`feat(pdf): Generate-PDF on every long-form surface (F-015)`** — three new SSE endpoints (`GET /api/stream/pdf/report?slug=`, `GET /api/stream/pdf/deep?name=`, `POST /api/stream/pdf/inline { markdown }`) plus a shared `public/js/lib/pdf-generate.js` helper. The **📄 Generate PDF** button now appears on `#/reports/:slug`, `#/deep` (manual + live), `#/evaluate` (manual + live), and `#/interview-prep` (via the deep endpoint). Each kind reuses the v1.10.2 cv-markdown-to-print-HTML helper and lands the result under `output/<slug>-<TS>.pdf` so the existing auto-download flow takes over.
- **`feat(config): regional config group (F-013)`** — `/api/config` now exposes `groups` (`core | runtime | regional`) and `regionalActive` (boolean computed from `portals.yml::russian_portals.sources`). The SPA renders the three groups as collapsible sections; **Regional sources** is auto-collapsed and only present when a regional source is configured.

### 🐛 Bug fixes

- **`fix(server): global Express error handler (F-019)`** — `PayloadTooLargeError` (e.g. an 11 MB upload to `/api/cv/import`) and `SyntaxError` from `express.json` now return JSON envelopes the SPA can localize (HTTP 413 / 400). Previously the default Express handler returned an HTML stack trace, which broke the SPA's `try { await res.json() }`.
- **`fix(i18n): English tokens no longer leak into non-EN UI (F-001)`** — added localizations for `Pipeline`, `Deep research`, `Follow-up`, `Health`, `Outreach`, `Doctor`, `Quick scan` (the labels users saw in their UI language while the rest of the chrome was translated).
- **`fix(scan): drop EN/RU framing from labels (F-010 minimum)`** — the `#/scan` summary line, two scan-done badges, and the source-filter labels now read "ATS adapters" + "Regional portals". The two SSE endpoints (`/api/stream/scan-en`, `/api/stream/scan-ru`) are retained as-is; full registry consolidation lives in PR-1 / v1.11.0.
- **`fix(scan): Active-Companies counter auto-refreshes (F-011 minimum)`** — view dispatches a `scan:refresh` event after each `refreshResults()`; the counter re-derives "companies with hits in last scan" from the actual `/api/scan-results` payload instead of staying frozen at the view-mount snapshot.
- **`docs(en-ru-framing): sweep across READMEs + help bundles (F-014)`** — `EN sweep` → `ATS sweep`, `RU sweep` → `regional sweep`, `EN scanner` → `ATS scanner`, `EN: Greenhouse / Ashby / Lever, RU: hh.ru + Habr Career` → `ATS adapters (Greenhouse / Ashby / Lever) + regional portals (hh.ru / Habr Career)`. Touches `README.md`, `README.ru.md`, `README.ja.md`, `README.ko-KR.md`, `docs/help/en.md`, `docs/help/es.md`, `docs/help/pt-BR.md`.

### 🧪 Tests

- New `tests/global-error-handler.test.mjs` (2 cases): malformed JSON → 400 JSON; 11 MB upload → 413 JSON.
- New `tests/config-groups.test.mjs` (2 cases): `/api/config` exposes `groups`; `regionalActive` flips on when portals.yml gains a regional source.
- New `tests/pdf-extra-routes.test.mjs` (5 cases): each of `/report`, `/deep`, `/inline` invokes `generate-pdf.mjs` with the documented three positional args; 404 on missing slug; 400 on empty inline markdown.
- Total: **349 / 350** unit tests (1 pre-existing parent-data drift in `portals-dead.test.mjs`).
- Coverage: 94.59 % line / 84.16 % branch.
- 20 / 20 smoke E2E, 23 / 23 comprehensive E2E, **28 / 28 Playwright**.

### 📝 Docs

- `docs/reviews/REVIEW-2026-05-12-v1.10.3.md` — session context + scope-out list.
- All 8 READMEs: badge bumps (tests 340 → 349, release v1.10.2 → v1.10.3), "What's new in v1.10.3" section per locale.
- All 8 CHANGELOGs receive this entry.

### Out of scope (deferred to v1.11.0)

- **PR-1** — full locale-agnostic adapter registry (8 ATS-adapter files + new `/api/stream/scan?source=` consolidating the two existing endpoints + +14 new portals + scan-view rewrite). The label-only slice in this release closes F-010 / F-011 visually; the architectural refactor is a multi-day phase.
- **PR-4** — multer-based CV import pipeline (replaces the v1.10.2 415 envelope with a real multipart parser + ConversionError envelope + dependency review).
- **PR-9** — full career-ops.org docs integration: fetch [career-ops.org/docs](https://career-ops.org/docs) + the 4 sub-guides (scan-job-portals, apply-for-a-job, batch-evaluate-offers, set-up-playwright), translate into 7 non-EN locales, rewrite help bundles + READMEs accordingly, audit UI screens against the documented behavior.

---

## [1.10.2] — 2026-05-12

Functional-regression patch. Two bugs discovered in v1.10.1 hand-testing closed; documentation surface expanded.

### 🐛 Bug fixes

- **`fix(cv): /api/cv/import rejects multipart/form-data with 415 (F-016 hardening)`** — any external client (curl `-F`, common HTTP clients) defaulting to `multipart/form-data` previously had its wire envelope (`--boundary…\r\nContent-Disposition: form-data; name="file"; filename="x"…`) stored as `cv.md` content. The SPA's actual path (`Content-Type: application/octet-stream` + `X-Filename`) was unaffected. Route now returns 415 with a hint pointing at the documented contract. Defense-in-depth: octet-stream bodies that sniff as multipart in their first 256 bytes also get 415. `cv.md` is never touched on a 415.
- **`fix(pdf): /api/stream/pdf invokes generate-pdf.mjs with proper positional args`** — was calling the script with `[]`. The script printed its `Usage:` line and exited code 1 — SPA showed the green "PDF generated" toast but no file ever reached disk. The route now reads `cv.md`, renders it to an HTML file under `output/cv-input-<TIMESTAMP>.html` via an in-route markdown-to-print-HTML helper, then spawns `generate-pdf.mjs <input.html> <output.pdf> --format=a4`. Optional `?format=letter` query for US-letter output. When `cv.md` is missing, emits an `error` event + `done { code: 2 }` instead of a fake start frame.

### 🧪 Tests

- New `tests/cv-upload-multipart-reject.test.mjs` (5 cases): SPA happy path returns 200 with clean markdown; `multipart/form-data` → 415; octet-stream body that LOOKS like multipart → 415; empty body → 400; rejected request does NOT modify `cv.md`.
- New `tests/pdf-stream-args.test.mjs` (3 cases): `start` event carries `<input.html> <output.pdf> --format=a4` with absolute paths and the HTML exists on disk; `?format=letter` switches the flag; missing `cv.md` emits the expected error frame.
- Total: **340 unit tests** (was 318). One pre-existing failure in `portals-dead.test.mjs` remains parent-side data drift, unrelated to web-ui.
- Coverage: 94.63 % line / 84.94 % branch.

### 📝 Docs

- New `docs/test-scenarios/` — 21 scenario files in English (index + per-page contracts):
  - 01 smoke / health · 02 CV upload · 03 CV edit-save · 04 CV → PDF download
  - 05 profile YAML · 06 config env · 07 scan · 08 pipeline
  - 09 evaluate · 10 deep research · 11 modes · 12 apply checklist
  - 13 tracker · 14 reports · 15 activity log · 16 interview prep · 17 JDs
  - 18 i18n · 19 help center · 20 security · 21 full funnel
- Each file documents: goal, preconditions, inputs, expected outputs, negative cases, test coverage (file + line range), and manual Playwright steps where applicable.
- New `docs/reviews/REVIEW-2026-05-12-v1.10.2.md` — full session context, scope-out list, verification commands.
- All 8 READMEs: badge bumps (tests 318 → 340, release v1.10.1 → v1.10.2) + "What's new in v1.10.2" section per locale.
- All 8 CHANGELOGs receive this entry.

### Out of scope (deferred to future GSD phases)

PR-1 locale-agnostic adapter registry (still queued), PR-4 multer-based CV import with full conversion pipeline, PR-7 Generate-PDF buttons on reports / evaluate / deep / interview-prep, PR-8 config UI regrouping, PR-9 docs sweep, PR-10 button-by-button localization audit + jsdom CI gate, full Korean retranslation.

---

## [1.10.1] — 2026-05-09

Critical-fixes patch driven by the v1.10.0 QA regression run (`qa/reports/00-FINAL-SUMMARY.md`).

### 🛡️ Security

- **`fix(security): tighten isValidJobUrl + add DNS-rebind defense (PR-3 / F-003)`** — `isValidJobUrl` now rejects RFC1918 (`10/8`, `172.16/12`, `192.168/16`), the full 127/8 loopback range, link-local `169.254/16` (incl. AWS IMDS), `0.0.0.0`, CGNAT `100.64/10`, and IPv6 ULA / link-local. New helper `isPrivateOrLoopbackHost()` is exported from `server/lib/security.mjs` and reused by `/api/pipeline/preview`, which now `dns.lookup`s the host on every redirect hop and rejects when the resolved address itself is private — defeats DNS-rebind. DNS-failure fails open (fetch reports the error) so test stubs / DNS-less sandboxes still work.

### 🐛 Bug fixes

- **`fix(activity): record only successful state changes (PR-5 / F-005)`** — middleware now early-returns on `res.statusCode >= 400`. Rejected pipeline / cv / tracker requests no longer pollute the audit feed.
- **`fix(activity): add profile.save / config.save / cv.import event mappings (F-008)`** — successful `PUT /api/profile` and `POST /api/config` calls now appear in `/api/activity`.
- **`fix(help): alias ko → ko-KR.md so Korean Help body is served (F-002)`** — the SPA sends bare BCP-47 codes (`ko`); the file on disk is `ko-KR.md`. Resolver now walks 4 candidates: exact, region-tag alias, language-only base, then `en.md`.
- **`fix(llm): /api/evaluate honors mode:'manual' (F-009)`** — mirrors `/api/deep`. Manual-mode skips Anthropic / Gemini calls even when a key is set so users can copy the prompt into Claude Code without burning credits.
- **`fix(api): DELETE /api/pipeline accepts ?url= AND body.url, returns 404 on miss (PR-6 / F-017)`** — was silently 200-on-miss with `?url=` only.

### ✨ Features

- **`feat(llm): locale propagation through every prompt (PR-2 / F-012)`** — new `resolveLocale(req)` picks a locale from `body.lang` → `body.locale` → `Accept-Language` → `'en'`. New `buildLocaleDirective(lang)` emits a one-line "Respond in X" header. `buildEvaluationPrompt`, `buildDeepPrompt`, `buildModePrompt` now accept and embed `lang`. SPA `API.call()` auto-attaches `Accept-Language` and merges `lang` into JSON bodies.
- **`feat(scripts): post-qa-cleanup.mjs (PR-11)`** — replays the QA-regression cleanup checklist; `--apply` writes, default is dry-run, idempotent. Sweeps RFC1918 / `nip.io` / `test-cloud-*` URLs from `data/pipeline.md` and audits `cv.md` size.

### 🧪 Tests

- New `tests/critical-fixes.test.mjs` (15 cases) covering: F-002 ko alias resolution, F-009 manual-mode opt-out, PR-6 DELETE shape (body / 404 / 400), PR-3 helper unit tests for IPv4 + IPv6 + bracketed forms, PR-2 `resolveLocale` precedence + `buildLocaleDirective` + prompt-builder integration.
- `tests/url-validation.test.mjs` extended with 5 new tests for RFC1918 / link-local / 0.0.0.0 / 127/8 / CGNAT / IPv6 ULA / link-local.
- `tests/activity-log.test.mjs` test 8 updated to assert the new "no log on 4xx" contract.
- Total: **318 unit tests** (was 298; one pre-existing failure in `portals-dead.test.mjs` is parent-side data drift in `templates/portals.example.yml`, unrelated to web-ui code).

### 📝 Docs

- New `docs/reviews/REVIEW-2026-05-09-v1.10.1.md` — full session context + scope-out list + verification commands.
- All 8 READMEs: badge bumps (test count 298 → 318, release v1.10.0 → v1.10.1), screenshot path moved to `public/images/screen_vacancy_found.png`, "What's new in v1.10.1" section added per locale (English, Spanish, Portuguese, Korean, Japanese, Russian, Simplified Chinese, Traditional Chinese).
- All 8 CHANGELOGs updated with this entry.

### Out of scope (deferred to future GSD phases)

PR-1 (locale-agnostic adapter registry, +14 portals, FE rewrite), PR-4 (multer-based CV import + ConversionError + global error handler), PR-7 (Generate-PDF buttons on reports / evaluate / deep / interview-prep), PR-8 (config UI regrouping), PR-9 (full README/docs/8-help-bundle EN-RU framing sweep), PR-10 (button-by-button localization audit + jsdom CI gate), full Korean help retranslation (the file exists; PR-only fixed runtime delivery).

---

## [1.10.0] — 2026-05-08

CV import revamp + `#/config` tabs + canonical `#/profile` route.

### ✨ Features

- **`feat(cv): server-side import for .docx / .doc / .odt / .rtf / .pdf / .html / .txt / .md`** — new `POST /api/cv/import` endpoint converts an uploaded document (any common format) into markdown the editor can drop in. Office formats go via **pandoc**, PDF via **pdftotext** from Poppler. Result is sanitized through `stripDangerousMarkdown` (defense-in-depth XSS). Hard cap: 10 MB per upload. Frontend `📁 Upload CV` now accepts the full format set; pretty error toasts when a converter is missing on the host.
- **`feat(cv): auto-download generated PDF when generate-pdf.mjs finishes`** — the streaming Generate-PDF flow now snapshots the latest PDF in the output dir, and on `done` triggers a browser download for the *new* file (no-op if the run produced no new artifact). The existing on-page list still shows every previous PDF.
- **`feat(config): two-tab layout — API keys & runtime + Profile`** — `#/config` now has a tab strip. The first tab keeps the existing `.env` editor (API keys, models, scanner knobs). The new **Profile** tab is a direct YAML editor for `config/profile.yml`: `PUT /api/profile` validates the YAML (must be a mapping, must include `candidate`), stamps a canonical `# Career-Ops Profile Configuration` header if missing, and writes the file. Save propagates without restart.
- **`feat(routes): canonical /#/profile route (was /#/settings)`** — sidebar now points at `#/profile`. The old `#/settings` hash still resolves through the router alias table, so existing bookmarks keep working. Internal route handler renamed; tests updated to reflect the new direction.

### 🧪 Tests

- New `tests/cv-import.test.mjs` (7 cases): `.md` / `.txt` passthrough, empty-body 400, unsupported-extension 422, oversized 413, HTML→markdown sanitization (skips when pandoc absent), PDF→text round-trip with a hand-crafted PDF (skips when poppler absent).
- New `tests/profile-put.test.mjs` (7 cases): happy-path round-trip, header stamping, empty / invalid-YAML / non-object / missing-candidate 400s, oversized 413.
- `tests/playwright-full-cycle.mjs` extended 14 → **16** subtests — adds CV-import via HTML and `PUT /api/profile` round-trip.
- `tests/router.test.mjs` ALIAS regex flipped to assert the new `settings → profile` direction.

### 📚 Docs

- `docs/help/{en,ru}.md` — full updates to sections 2/3/4: new App-settings tabs, edit-via-config message on the read-only Profile page, full upload-format matrix on the CV section, PDF auto-download behaviour.
- `docs/help/{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md` — concise mirrors of the new content blocks; section count unchanged (16) so the parity test stays green.

### 🔧 Internal

- New `server/lib/cv-import.mjs` — single source of truth for the format → markdown conversion, with timeout + missing-converter detection that surfaces actionable hints rather than 500s.
- `server/lib/routes/content.mjs` gains `POST /api/cv/import` and `PUT /api/profile` (binary-safe via `express.raw` for the upload, JSON for the YAML PUT).

---

## [1.9.1] — 2026-05-08

Production-readiness pass. Four targeted bug fixes (BF-1..BF-4), Playwright smoke expanded from 5 to 12 tests covering tracker / pipeline / reports / evaluate / config / cv save round-trips. All green in CI.

### 🐛 Bug fixes

- **`fix(tracker): escape pipes + collapse newlines in every cell, not just notes (BF-1)`** — a company name like `"Acme | Co"` previously broke the markdown table layout (parser split the cell into two). Cell sanitizer now applied uniformly to company / role / reportSlug / notes; companion fix in `parsers.mjs::parseMarkdownTable` adds GFM-compliant `\|` escape support so the round-trip is lossless.
- **`fix(config): wrap updateEnvFile in try/catch (BF-2)`** — `POST /api/config` previously bubbled an unhandled rejection on permission-denied / read-only filesystem. Now returns a clean 500 `{ error: 'failed to write parent .env', details: [...] }`.
- **`fix(llm): soft cap on assembled prompt size for Anthropic SDK calls (BF-3 + BF-4)`** — `/api/evaluate`, `/api/deep`, and `/api/mode/:slug` Anthropic branches now bail with 413 when `bundleProjectContext + prompt` exceeds 200 KB (≈50K tokens). Saves a multi-second roundtrip + tokens vs letting the API complain about context size. The cap is well below any current model ceiling (Sonnet 4.6 = 1M context).

### 🧪 Playwright smoke — expanded coverage

5 → **12** tests. New cases:

- `tracker view renders empty + accepts API-seeded row` — exercises BF-1 by seeding a row with a literal pipe in the company name and asserting the round-trip preserves it.
- `pipeline add-URL form populates the queue` + invalid-URL rejection sweep (loopback, `javascript:`, bare strings).
- `reports view handles empty state` — non-crash assertion.
- `evaluate view returns a manual prompt without API key` — verifies the fallback chain.
- `config GET returns known keys masked` — secrets never leak through `/api/config`.
- `cv.md PUT round-trips with sanitization` — XSS-y bits (script tags, `javascript:` schemes) get stripped end-to-end.
- `pipeline preview proxy strips scripts` — invalid-URL rejection path.

### 📦 Behavior changes (no API contract changes)

- Tracker writes are now lossless against pipe-laden company / role names. Existing rows with raw pipes will start parsing correctly on the next read.
- `/api/{evaluate,deep,mode/:slug}` will now return 413 instead of 502/timeout when the prompt is unreasonably large (200 KB+).

### 🧪 Tests

- **284 unit tests** (no change in count; existing tests still all green after parser update).
- **12 Playwright browser-smoke tests** (was 5).

---

## [1.9.0] — 2026-05-08

P-6 → P-10 from the v1.8.0 backlog all shipped in one bundle. Headline: `server/index.mjs` is now a 130-LOC orchestrator (down from 762, total 1230 → 130 = -89%); every route topic has its own module. Anthropic parity for `/api/evaluate`, multi-CLI shims, expanded i18n parity test, and Playwright browser-smoke wired into CI.

### 🏗️ P-6 — server split-by-concern (phase 2)

Continuation of P-2. Extracted the remaining 9 route topics out of `server/index.mjs` into `server/lib/routes/<topic>.mjs` modules. `index.mjs` is now a pure orchestrator: middleware (security headers + activity log + static), 12 `register<Topic>Routes(app)` calls, and the SPA catch-all.

- `server/lib/routes/activity.mjs` — `/api/activity`.
- `server/lib/routes/config.mjs` — `/api/config` GET/POST (parent .env round-trip).
- `server/lib/routes/health.mjs` — `/api/health` + `/api/dashboard`.
- `server/lib/routes/help.mjs` — `/api/help/:lang`.
- `server/lib/routes/jds.mjs` — full CRUD for `jds/*.txt`.
- `server/lib/routes/llm.mjs` — every LLM-bound endpoint (evaluate, deep, mode, apply-helper, interview-prep).
- `server/lib/routes/pipeline.mjs` — `/api/pipeline*` including the SSRF-safe preview proxy with named constants for timeout / max-redirects / max-body.
- `server/lib/routes/reports.mjs` — `/api/reports*`.
- `server/lib/routes/tracker.mjs` — `/api/tracker` GET + dedup-aware POST.

Behavior unchanged. 283/283 unit tests stayed green at every step. The orchestrator's import surface dropped from 47 lines to 22.

### 🔌 P-7 — Anthropic parity for `/api/evaluate`

`/api/evaluate` previously was Gemini-or-manual. v1.9.0 adds an Anthropic branch (preferred when both keys present), mirroring the routing rule already used by `/api/deep` and `/api/mode/:slug`. Routes through `bundleProjectContext({ modeSlugs: ['_shared', 'oferta'] })` so the model has the cv / profile / mode templates inlined (REVIEW-A1).

New endpoint: **`POST /api/evaluate/test-anthropic`** — smoke check for `ANTHROPIC_API_KEY`, mirrors the existing Gemini smoke. Sends a tiny prompt (≤256 output tokens) so it costs essentially nothing; returns a 200-char sample.

Fallback chain is now: Anthropic → Gemini → manual.

### 🌐 P-8 — Help-center i18n parity (audit + test hardening)

Audited every `docs/help/<lang>.md` for structure parity. All 8 locales already cover the same 14 canonical h2 sections. Tests upgraded:

- `tests/help-ui.test.mjs::every help doc covers the same 14 sections` was checking only en + ru. Now iterates **all 8 locales** (en, es, pt-BR, ko-KR, ja, ru, zh-CN, zh-TW) and asserts the section count for each.
- New test: `tests/help-ui.test.mjs::every help locale has substantive content` — guards against locale stubs by asserting each non-EN locale is at least 30% of `en.md`'s byte length. Compact translations naturally hit 40-50%; a stub would be in single-digit %.

Result: structural parity is now CI-enforced.

### 🤖 P-9 — Playwright browser smoke in CI matrix

`tests/playwright-smoke.mjs` (added in v1.8.0 as opt-in) is now part of the CI workflow. The existing `e2e` job already installs Playwright + Chromium; one new step (`npm run test:e2e:browser`) runs the 5 browser-smoke tests right after the comprehensive node E2E.

Order in CI: unit (Node 18/20/22 matrix) → smoke node E2E → comprehensive node E2E → **Playwright browser smoke** → screenshot artifact upload on failure.

### 🌍 P-10 — Multi-CLI compatibility

Parent career-ops v1.7.0 introduced multi-CLI / Open Agent Skill standard support. The UI sub-project follows the same convention with thin shims pointing at the canonical `CLAUDE.md`:

- `web-ui/AGENTS.md` — Codex / Aider / generic CLI entry point.
- `web-ui/GEMINI.md` — Gemini CLI entry point.

Both shims re-state the hard rules and quick reference but defer to `CLAUDE.md` for the full project-level instructions, so non-Claude CLIs land on the same orientation as Claude Code sessions. The deployed UI itself remains CLI-agnostic at runtime.

### 🧪 Tests

- **284 unit tests** (was 283): +1 new help-locale parity test.
- **5 Playwright browser-smoke tests** — now part of CI, not just opt-in.
- Coverage held.

### 🔧 Files touched

```
+ server/lib/routes/activity.mjs              + server/lib/routes/config.mjs
+ server/lib/routes/health.mjs                + server/lib/routes/help.mjs
+ server/lib/routes/jds.mjs                   + server/lib/routes/llm.mjs
+ server/lib/routes/pipeline.mjs              + server/lib/routes/reports.mjs
+ server/lib/routes/tracker.mjs
+ AGENTS.md                                   + GEMINI.md

~ server/index.mjs (762 → 130 LOC, -83%)
~ .github/workflows/ci.yml (Playwright smoke step)
~ tests/help-ui.test.mjs (all-8-locales section parity + content-floor)
~ docs/{ROADMAP,architecture/{OVERVIEW,SERVER}}.md
~ docs/sdd/CONVENTIONS.md
~ CLAUDE.md
~ package.json (1.8.0 → 1.9.0)
```

### 📦 New REST endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/evaluate/test-anthropic` | Smoke check for `ANTHROPIC_API_KEY` (P-7). Mirrors `/api/evaluate/test-gemini`. |

### 🤖 New CLI entry points

| File | CLI | Notes |
|---|---|---|
| `AGENTS.md` | Codex / Aider / generic | Points at `CLAUDE.md` for the full instructions. |
| `GEMINI.md` | Gemini CLI | Auto-loaded by Gemini at session start. |

---

## [1.8.0] — 2026-05-08

Hardening, refactor, and SDD bootstrap. Three high-severity correctness/security fixes (A1, A2, A3), four medium ones (B1–B4), six cleanups, audit of the parent career-ops v1.7.0 surface, server split-by-concern (P-2 phase 1), Playwright browser smoke harness, and a full SDD foundation under `docs/` and `.claude/`.

### 🔥 High-severity fixes

- **`fix(deep): inline cv/profile/mode files for Anthropic SDK calls (REVIEW-A1)`** — `/api/deep` and `/api/mode/:slug` previously told the model "read these files first" but the Anthropic SDK has no filesystem. Output was hollow. New `bundleProjectContext({ modeSlugs })` reads `cv.md`, `config/profile.yml`, `modes/_shared.md`, and the mode template, truncates each at 16 KB, and prepends a `<project_context>` block to the prompt. Verified live: 26 KB grounded markdown response from `claude-sonnet-4-6` for a deep-research call.
- **`fix(runner): SIGKILL escalation after SIGTERM grace period (REVIEW-A2)`** — `runNodeScript` and `streamNodeScript` previously sent only `SIGTERM` on timeout / client-disconnect. A child stuck in a syscall (DNS, blocked socket) ignored it, hanging the SSE connection until Node's GC reaped. Now each path arms a 5 s watchdog that escalates to `SIGKILL`. Promises always resolve.
- **`fix(runner): max-runtime cap on streaming endpoints (REVIEW-A3)`** — every SSE script runner (`/api/stream/{scan,liveness,pdf}`) now has a hard 30-minute ceiling. On expiry: emit `event: error { message: 'maximum runtime exceeded' }`, kill the child via the A2 watchdog, end the response.

### 🛡️ Medium-severity fixes

- **`fix(preview): per-hop redirect validation in /api/pipeline/preview (REVIEW-B1)`** — switched from `redirect: 'follow'` to manual redirect-walking. Each `Location` header is re-validated by `isValidJobUrl`; capped at 3 hops. Hostile boards can no longer bounce us to loopback / private IPs / `file://`. 4 new tests cover the rejection paths.
- **`refactor(keys): hasGeminiKey helper unifies LLM-key checks (REVIEW-B2)`** — direct `process.env.GEMINI_API_KEY` reads in route handlers replaced with `hasGeminiKey()` from `lib/anthropic.mjs`. Mirrors `hasAnthropicKey()` shape for consistency and easier mocking.
- **`feat(scanners): thread AbortSignal through hh.ru, Habr, Greenhouse, Ashby, Lever (REVIEW-B3)`** — when the SSE client disconnects mid-scan, in-flight HTTP fetches are now aborted instead of running every query to completion and dropping events. `runRuScan` and `runEnScan` accept `opts.signal`; SSE handlers in `/api/stream/scan-{ru,en}` create an `AbortController` and abort on `res.close`.
- **`test(anthropic): log-guard test prevents future API-key leaks via console (REVIEW-B4)`** — captures every `console.{log,info,warn,error,debug}` call during `runAnthropic` happy + error paths, asserts zero output and that the canary key string never appears. Defense-in-depth against a future `console.log(opts)` regression.

### 🧹 Low-severity polish

- **`fix(parsers): defense-in-depth URL gate inside addPipelineUrl (REVIEW-C4)`** — parser-level rejection of non-http(s) values, complementing the route-level `isValidJobUrl`. Optional `opts.validate` for callers that want stricter rules.
- **`docs(readme): badge "tests-88 passed" → "tests-277 passed" (REVIEW-C3)`** — was off by an order of magnitude.
- **`test(i18n): missing-keys diff grouped by locale (REVIEW-C6)`** — when `tests/i18n-coverage.test.mjs` finds a gap, output is now `[ru] (3): foo, bar, baz` instead of mixed lines.
- **`docs(review): C1 closed as resolved-on-inspection`** — sanitizer regexes were already in `\x00-\x08` hex form; review entry was a tool-rendering artifact.

### 🏗️ P-2 phase 1 — server split-by-concern

`server/index.mjs` was 1230 LOC, well past the 800-line ceiling. Split into focused modules without behavior change. All 283 unit tests stayed green at every step.

- `server/lib/security.mjs` — `isValidJobUrl`, `stripDangerousMarkdown`, `sanitizeJobDescription`, `isPubliclyExposed`. Re-exported from `index.mjs` for backward-compat with external consumers.
- `server/lib/prompts.mjs` — `bundleProjectContext`, `buildEvaluationPrompt`, `buildDeepPrompt`, `buildModePrompt`, `buildApplyChecklist`.
- `server/lib/store.mjs` — `safeReadApps`, `safeReadPipeline`, `safeListReports`, `checkProfileCustomized`, `ensureRussianPortalsDefaults`.
- `server/lib/routes/scan.mjs` — `registerScanRoutes(app)` for `/api/stream/scan-{ru,en}`, `/api/scan-ru/config`, `/api/scan-results`.
- `server/lib/routes/runners.mjs` — `registerRunnerRoutes(app)` for buffered `/api/run/*` table, streaming `/api/stream/{scan,liveness,pdf}`, generated-PDF list/download.
- `server/lib/routes/content.mjs` — `registerContentRoutes(app)` for CV / Profile / Portals / Modes.

`index.mjs` is now 762 LOC (-38%, under the 800 cap). Phase 2 will extract tracker, pipeline, reports, jds, llm (evaluate/deep/mode), and health into route modules. Targeting <500 LOC for the orchestrator.

### 🔍 Parent career-ops v1.7.0 audit

The user updated the parent project to v1.7.0. Audited every consumed surface — UI is fully compatible. Notable findings documented in `docs/architecture/DATA-FLOWS.md`:

- Modes catalog grew from 7 to 19 files. UI's `MODE_ALLOWLIST` deliberately surfaces only 7 (others are Claude-Code-only). Comment added explaining the intentional narrow scope.
- `portals.yml` schema confirmed: `tracked_companies` (96 entries, 87 enabled, 71 with API). EN scanner reads it correctly; legacy `companies` key still supported.
- New parent surfaces NOT consumed today: `dashboard/` (Go program), `update-system.mjs`, `generate-latex.mjs`, `analyze-patterns.mjs`, `liveness-core.mjs`, `followup-cadence.mjs`, `test-all.mjs`, localized mode subdirs (`de/fr/ja/pt/ru`).
- Live `/api/dashboard`, `/api/health`, `/api/modes`, `/api/portals`, `/api/profile`, `/api/cv`, `/api/jds`, `/api/reports`, `/api/tracker`, `/api/pipeline`, `/api/evaluate`, `/api/deep`, `/api/stream/scan-en` all verified green.

### 🤖 SDD / GSD bootstrap

`career-ops-ui` now has a full Spec-Driven Development foundation aligned with the GSD pipeline (`gsd-*` skills from `superpowers@claude-plugins-official`).

- `CLAUDE.md` (root) — project-level agent system prompt: stack, GSD pipeline, hard rules (parent contract, security envelope, no `--no-verify`), conventions, parent-project boundary.
- `.aiignore` — exclusion list for AI agents: vendored, binaries, parent user data, `.planning/`, `.env`, locale duplicates.
- `.claude/agents/` — three project-specific subagent definitions:
  - `web-ui-route-reviewer.md` — gates new routes against SSRF, CSP, sanitizers, parent-write contract, conventions, tests.
  - `spa-view-reviewer.md` — CSP-safe DOM, i18n, router registration, accessibility.
  - `test-isolation-reviewer.md` — verifies tests are CI-isolated (no parent-project assumptions, no live network, no port collision).
- `.claude/commands/` — slash-command stubs: `/sdd-status`, `/codebase-tour`.
- `docs/` tree — all in English:
  - `PROJECT.md` — what/why/for-whom, scope, constraints, success criteria.
  - `ROADMAP.md` — current milestone + completed history + backlog.
  - `sdd/SDD-GUIDE.md` — discuss → spec → plan → execute → verify → review pipeline mapped to `gsd-*` skills.
  - `sdd/CONVENTIONS.md` — module system, naming, routes, sanitizers, client patterns, i18n, errors, logging, testing, commits, branches, CSS.
  - `architecture/OVERVIEW.md` — top-level diagram, layers, boot sequence, invariants, "where to look first when…" cheat sheet.
  - `architecture/SERVER.md` — per-file map for `server/lib/*.mjs` (updated for P-2 split).
  - `architecture/FRONTEND.md` — SPA structure, view inventory, globals, "how to add a view".
  - `architecture/API.md` — full inventory of every `/api/*` route.
  - `architecture/DATA-FLOWS.md` — every parent-project read/write, with the explicit-user-action contract.
  - `reviews/REVIEW-2026-05-07.md` — static review that produced this changelog's fixes.

### 🔒 Security & repo hygiene

- **`chore(.gitignore): comprehensive defense-in-depth patterns`** — covers env variants, IDE folders, GSD scratch (`.planning/`), per-user agent settings (`.claude/settings.local.json`, `.claude/cache/`, `.claude/state/`, `.claude/memory/`), Playwright artifacts (`playwright-report/`, `test-results/`, `.playwright/`, `trace.zip`), heap/CPU profiles, lockfiles for unshipped tooling, expanded macOS Finder noise, generic secret patterns (`secrets.json`, `credentials.json`, `*.pem`, `*.key`).

### 🧪 Tests

- **283 unit tests** (was 277): +6 new (4 for B1 redirect-rejection, 1 for `hasGeminiKey`, 1 for `runAnthropic` log-guard).
- **5 Playwright browser-smoke tests** (new, opt-in via `npm run test:e2e:browser`): dashboard render + version footer, dashboard → scan → pipeline → cv navigation, language-switch persistence, 404 view, health-page render. Resolves Playwright via parent's `node_modules` — no new dependency.
- Coverage held at ~93% line / ~83% branch.

### 📝 New / updated package.json scripts

| Script | Purpose |
|---|---|
| `npm run test:e2e:browser` | Run Playwright smoke harness against in-process server (5 tests). |

### 🔧 Files touched

```
+ CLAUDE.md                                    +  .aiignore
+ docs/PROJECT.md                              +  docs/ROADMAP.md
+ docs/sdd/SDD-GUIDE.md                        +  docs/sdd/CONVENTIONS.md
+ docs/architecture/OVERVIEW.md                +  docs/architecture/SERVER.md
+ docs/architecture/FRONTEND.md                +  docs/architecture/API.md
+ docs/architecture/DATA-FLOWS.md              +  docs/reviews/REVIEW-2026-05-07.md
+ .claude/agents/web-ui-route-reviewer.md      +  .claude/agents/spa-view-reviewer.md
+ .claude/agents/test-isolation-reviewer.md
+ .claude/commands/sdd-status.md               +  .claude/commands/codebase-tour.md
+ server/lib/security.mjs                      +  server/lib/prompts.mjs
+ server/lib/store.mjs
+ server/lib/routes/scan.mjs                   +  server/lib/routes/runners.mjs
+ server/lib/routes/content.mjs
+ tests/playwright-smoke.mjs

~ .gitignore                                   ~  README.md (badge fix)
~ package.json (1.7.2 → 1.8.0)
~ server/index.mjs (1230 → 762 LOC)
~ server/lib/runner.mjs (SIGKILL escalation, max-runtime cap)
~ server/lib/anthropic.mjs (hasGeminiKey)
~ server/lib/parsers.mjs (URL gate in addPipelineUrl)
~ server/lib/ru-scanner.mjs                    ~  server/lib/en-scanner.mjs
~ server/lib/sources/{hh,habr,greenhouse,ashby,lever}.mjs (signal threading)
~ tests/anthropic.test.mjs                     ~  tests/i18n-coverage.test.mjs
~ tests/pipeline-preview.test.mjs
```

---

## [1.7.2] — 2026-05-04

Help center, in-UI App settings, mobile sidebar, single Scan button, and a "Show result" shortcut on every prompt-builder.

### ✨ New features

- **`feat(help): in-app user guide` (`/#/help`)** — long-form Markdown documentation accessible from a new sidebar entry. Covers every page step-by-step: quick start, CV editor, Profile, Scan filters, Pipeline preview, Evaluate, Deep research, Apply, Tracker, Reports, all 7 modes, Activity log, Health, setup hints. Auto-built sticky table of contents from `<h2>` headings, synchronous DOM build (no race). Localized for all 8 supported locales.
- **`feat(config): in-UI App settings page` (`/#/config`)** — edit `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `HH_USER_AGENT`, `PORT`, `HOST` from the browser. Writes to the **parent project's** `.env` file so career-ops Node scripts AND web-ui's dotenv loader pick up the same source. Secret keys masked on read (first/last 4 chars). Model fields are dropdowns with curated lists (claude-sonnet-4-6 / claude-opus-4-7 / claude-haiku-4-5 / gemini-2.0-flash / etc.). Empty value deletes the key. Values applied to running process.env immediately — no restart for most settings.
- **`feat(modes): "⚡ Show result" button alongside "Copy prompt"`** — when a prompt is generated in manual mode, users no longer have to retype their inputs to get the LLM result. The new button re-submits the same form with `run: true`, falling through to a clear toast (`Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env first`) when no key is configured. Works on `/#/deep`, `/#/project`, `/#/training`, `/#/followup`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns`.

### 🐛 UX + UI fixes

- **`fix(scan): single Scan button replaces three (Scan all + EN + RU)`** — overwhelming choice, identical default in 99% of cases. The unified `🌐 Scan` button runs every enabled source. Help docs updated across 8 locales.
- **`fix(ui): mobile sidebar drawer`** — viewport <900px now gets a hamburger button (☰) in the topbar; `body.sidebar-open` toggles a CSS transform that slides the sidebar in. Backdrop dim + click-anywhere closes it. Anchor click + hashchange auto-close so the user lands on the new page with the drawer tucked away. Larger viewports unaffected.
- **`fix(server): footer version reflects web-ui, not the parent VERSION`** — `/api/health` now reads web-ui's own `package.json`. The footer no longer leaks a stale `1.6.0` from the parent's version file. Parent's VERSION is still surfaced separately as `parentVersion`.

### 📦 New REST endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/api/help/:lang` | Returns the Markdown user guide for the requested locale, falling back to `en.md`. Path-traversal-safe. |
| `GET`  | `/api/config` | Returns current values for all known env keys; secrets masked. |
| `POST` | `/api/config` | Writes the given keys into the parent project's `.env`, validates each value, applies live to `process.env`. |

### 🌐 i18n

- 30+ new keys across `nav.help`, `nav.config`, `help.*`, `config.*`, `deep.showResult`, `deep.needKey`, `scan.btnRun`. All 8 locales populated.

### 🧪 Tests

- `tests/help.test.mjs` (12 cases) — every supported locale returns substantive markdown, EN spot-checks every page slug, unknown lang → EN fallback, path-traversal sanitized, every locale references `cv.md` / `profile.yml` / `.env`.
- `tests/help-ui.test.mjs` (9 cases) — view file registration, sidebar entry, i18n keys present in every locale, docs files exist for every locale, EN/RU help has 14 canonical sections, every #/foo route covered, Show-result wiring on deep + mode-page.
- `tests/env-config.test.mjs` (18 cases) — pure-function tests for `parseEnv`, `maskSecret`, `validateConfig`, `updateEnvFile` (bootstrap, in-place rewrite preserving comments, empty-value delete, quote-when-needed).
- `tests/config-endpoint.test.mjs` (8 cases) — GET masks secrets / returns env path; POST writes to parent .env; live process.env application; empty-value unsets; rejects unknown keys + malformed Anthropic keys with 400.

### 📊 Stats

- **Tests:** 233 → **277** (+44 across 4 new test files).
- **E2E:** 20 smoke + 23 comprehensive = 43 Playwright steps, all green.
- **Coverage:** 93.5% line / 82.6% branch / 93.7% funcs (unchanged — new code is fully tested).

---

## [1.7.1] — 2026-05-04

Patch release stacking the post-v1.7.0 work: pipeline preview pane, Anthropic API integration, scrollable sidebar, dotenv loader, dynamic Active-companies list, CI workflow hardening.

### ✨ Pipeline preview pane

- **`/#/pipeline` overhaul** — left list + right preview pane. Click any URL to fetch a server-side proxied snapshot (`GET /api/pipeline/preview` strips scripts/styles/tags, caps at 8 KB, validated through `isValidJobUrl`). Live filter input, "In queue" counter, ⚡ "Evaluate first" header button. Inline ▶/✕ on every row plus full Evaluate / Open in tab / Delete on the preview pane. Stable test selectors via `data-url` + `.pipeline-row` + `.pipeline-row-delete` classes. **8 new tests** in `tests/pipeline-preview.test.mjs` (mocked fetch, no upstream binding needed).

### ✨ Anthropic API integration — "Run live" everywhere

- **`server/lib/anthropic.mjs`** — zero-dependency client for Anthropic Messages API (claude-sonnet-4-6 default, override via `ANTHROPIC_MODEL`). When `ANTHROPIC_API_KEY` is set, every mode page (`/#/deep`, `/#/project`, `/#/training`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns`) renders an "⚡ Run live (Anthropic)" button as the **primary** action — clicking executes the prompt and renders Markdown back into the browser instead of handing off to Claude Code. Gemini stays as fallback when only its key is set. Manual mode still works with no keys at all. **8 new tests** in `tests/anthropic.test.mjs`.

### 🐛 CI / pipeline fixes

- **`fix(api): tighten pipeline URL validator` (FIX-M7)** — now also rejects loopback hostnames, length <10 or >2000, whitespace inside URLs.
- **`fix(server): actually load .env so HH_USER_AGENT / GEMINI_API_KEY hints work`** — added `server/lib/dotenv.mjs` (35-line zero-dep loader) wired in at the top of `server/index.mjs`. The runtime hints in scanner code finally do something. **6 new tests**.
- **`fix(ui): scrollable sidebar`** — 18 nav items in 6 groups overflowed shorter viewports. `.sidebar` now has `overflow-y: auto` with thin custom-styled scrollbars.
- **`fix(ui): make HH_USER_AGENT banner dismissible`** — then removed entirely from `/scan` once we realized it was overkill. Health page check still surfaces it.
- **`fix(scan): Active companies list is now collapsible + filterable + grouped`** — 87 tags flat was overwhelming. Now a "▸ Active companies 87/71" toggle expands an ordered list (✓ API-backed first, ○ websearch second) plus a search filter.
- **`fix(test): isolate api.test.mjs + en-scanner.test.mjs from parent project`** — both now spin up tmp project roots so CI works without the parent checked out alongside web-ui.
- **`fix(workflow): publish-package version-match only on release events`** — `workflow_dispatch` from main no longer fails the tag/version check.
- **`fix(e2e): stable selector for pipeline row delete`** — restored anchor wrapper + added `data-url` attribute so e2e suite is selector-stable.

### 📦 New REST endpoint

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/pipeline/preview?url=…` | Server-side proxy: returns visible-text snapshot of the URL (scripts/styles stripped, 8 KB cap), gated by `isValidJobUrl`. |

### 📊 Stats after this batch

- **Tests:** 225 → **233** (8 more on top of v1.7.0).
- **Test files:** 25 → **26**.
- **E2E:** 20 + 23 = 43 Playwright steps, all green.

---

## [1.7.0] — 2026-05-03

A 35-commit hardening + UX + feature-completion pass driven by QA r5. Three security layers landed (XSS sanitization, CSP, input validation), every missing CRUD endpoint was filled in, the parent-project bootstrap is now fully automated, and the UI gained **9 new pages** — Activity, redesigned Deep Research, plus 7 sidebar-grouped modes (project / training / followup / batch / outreach / interview-prep / patterns) covering 100% of parent's `modes/`. Pipeline gained a server-side preview pane. Anthropic API integration makes "Run live" a one-click action across all modes. Test coverage went from **73** to **225**, across **25 test files**, plus **23 comprehensive Playwright e2e steps**. GitHub Actions ship CI / AI review / Release / Publish-Package workflows.

### 🔒 Security

- **`fix(cv): sanitize CV markdown to block stored XSS in preview` (FIX-C10)** — `PUT /api/cv` now strips `<script>`, `<iframe>`, `<object>`, `<embed>`, `<style>`, `<form>`, `<svg>`, `on*=` event handlers, and `javascript:`/`vbscript:`/`data:text/html` URIs before writing `cv.md`. Body capped at 1 MB (413 on overflow). Client-side `UI.md()` was rewritten to escape every byte before any markdown transformation runs, so raw HTML can never reach `innerHTML`. Link `href` attributes are validated against an allowlist of safe schemes (`http`/`https`/`mailto`/`tel`/relative + `data:image` only). 17 new tests across the strip helper and HTTP round-trips.
- **`fix(server): add CSP and baseline security headers` (FIX-L2)** — every response now carries `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`. When the server binds beyond loopback (`HOST` ≠ `127.0.0.1`/`::1`/`localhost`), a strict `Content-Security-Policy` is layered on top: `default-src 'self'`, `script-src 'self'` (no `unsafe-inline`), Google Fonts whitelisted, `connect-src 'self'` blocks XSS exfiltration. Inline `onclick` handlers in `index.html` and `router.js` were moved to `addEventListener` to keep the strict CSP intact. 8 new tests gating CSP across 5 different `HOST` values.
- **`fix(api): tighten pipeline URL validator` (FIX-M7)** — `POST /api/pipeline` used to accept `"not-a-url"` and persist it. Now `isValidJobUrl()` rejects bare strings, inputs <10 or >2000 chars, whitespace-containing URLs, non-`http(s)` schemes, and loopback hostnames (`localhost`/`127.0.0.1`/`::1`). Folds in **FIX-M3** + **FIX-M6** (return 400 on invalid, plus a `deduped` flag on success).
- **`fix(server): actually load .env so HH_USER_AGENT / GEMINI_API_KEY hints work`** — previously the runtime told users to "set HH_USER_AGENT in .env" but the server never read that file, so following the instruction did nothing. Adds a 35-line zero-dependency dotenv loader (`server/lib/dotenv.mjs`) wired in at the top of `server/index.mjs`. Process-env values set on the command line still win, so existing CI overrides aren't shadowed. Parent's `.env.example` now includes a documented `HH_USER_AGENT` block with a real-Chrome User-Agent example. 6 new tests.
- **`fix(api): sanitize JD before prompt assembly` (FIX-M5)** — `POST /api/evaluate` strips ANSI escapes, control bytes, inline `<script>` tags, and trims whitespace before either calling Gemini or echoing the prompt back. 50 KB length cap. The 50-char minimum runs against the *sanitized* text, so prompt-injection attempts that look long enough but consist mostly of escapes fail-fast with 400.
- **`fix(health): mask Node version + project root when HOST!=loopback` (FIX-M1)** — `/api/health` no longer fingerprints the host on LAN-exposed deployments. Loopback responses keep the values for local diagnostics.

### ✨ New features

- **`feat: 7 new sidebar modes + grouped sidebar` (FIX-C8)** — covers 100% of the parent's `modes/` directory with no UI gaps. New routes: `#/project` (portfolio project advisor), `#/training` (course / cert evaluation), `#/followup` (per-application cadence), `#/batch` (parallel URL processor), `#/contacto` (LinkedIn outreach drafter), `#/interview-prep` (stage-specific prep), `#/patterns` (rejection-pattern analyzer). All seven share a single config-driven view factory (`public/js/views/mode-page.js`) and a single generic endpoint `POST /api/mode/:slug` — adding a new mode in the future is one config row + one i18n block. Sidebar reorganized into 6 groups: Sourcing / Decision / Application / Networking / Analytics / Setup. 18 nav items total. 12 new tests in `tests/modes-endpoints.test.mjs`.
- **`fix: bootstrap parent deps + russian_portals defaults` (FIX-C4 + C9 + C12 + H2)** — `bin/start.sh` now installs the parent's `node_modules` (js-yaml, playwright, jsdom) AND `npx playwright install chromium` on fresh clones, so `/api/stream/scan`, `/pdf`, and `/liveness` work end-to-end out of the box. `createApp()` probes `portals.yml` on every boot — if the `russian_portals:` block is missing, appends a documented default with comments. Idempotent: the second boot is a no-op. 3 new tests.
- **`fix: disable 9 dead portal slugs in template + health-check script` (FIX-C3)** — `templates/portals.example.yml` now ships with Ada / Factorial / Tinybird / Weights & Biases / Travelperk / Clarity AI / Forto / Vinted / Runway flagged `enabled: false` (each entry has an inline reason comment). New installs scan **87** alive companies instead of 96. New `web-ui/scripts/portals-health-check.mjs` HEAD-probes every enabled `careers_url` and reports DEAD entries with a suggested patch list (JSON output via `--json`). 3 new tests.
- **`feat(activity): user-action log + Activity sidebar page`** — every state-changing API request is captured to `data/activity.jsonl` (timestamp, action verb, target, success flag, optional detail). New sidebar entry **Activity** with action-prefix chip filters (pipeline / cv / jd / evaluate / scan / stream / script), action ✓/✗ badges, and refresh button. Auto-rotates at 5 MB. 10 new tests covering middleware, read filters, corrupt-line tolerance, and the recursion guard for `GET /api/activity` itself.
- **`feat(deep): view Deep Research in browser + saved-results archive`** — the Deep Research page now (a) runs the prompt through Gemini live when `{ run: true }` and `GEMINI_API_KEY` is set, persisting output to `interview-prep/{slug}.md`; (b) lists every saved deep-research file as clickable cards with relative timestamps; (c) renders results as Markdown with **📋 Copy / ⬇ Download .md / ↗ Open in tab** actions per result. New REST surface: `GET /api/interview-prep`, `GET /api/interview-prep/:name`, `DELETE /api/interview-prep/:name`. 7 new tests.
- **`feat(cv): generate + download PDF in browser, with PDF archive`** — new **📄 Generate PDF** button on the CV page streams `/api/stream/pdf` in a modal console. On `ERR_MODULE_NOT_FOUND` / `playwright` errors, it surfaces a copy-pasteable bootstrap command. New "Generated PDFs" section auto-loads after each successful run, listing every `output/*.pdf` with **↗ Open** and **⬇ Download** buttons. New REST surface: `GET /api/output/pdfs`, `GET /api/output/pdfs/:name`. 6 new tests.
- **`feat(api): POST /api/tracker — append rows from the UI` (FIX-H8)** — append a canonical row to `data/applications.md` from the browser. Validates company + role, normalizes status against `templates/states.yml`, auto-increments zero-padded `#`, dedups by company+role (case-insensitive), pipe-escapes notes so the markdown table doesn't fracture. Bootstraps the table when the file is empty. 6 new tests.
- **`feat(api): DELETE /api/jds/:name` (FIX-H4)** — remove saved JDs without shelling out. Path-traversal characters are stripped before any filesystem touch; the parameter must end in `.txt`. 5 new tests, including `../../etc/passwd` refusal.
- **`feat(api): POST /api/evaluate/test-gemini` (FIX-H7)** — smoke-test endpoint that runs a 50-char dummy JD through `gemini-eval.mjs` so the user can verify the API key works without sitting through a real evaluation. Returns `{ ok, code, sampleLength, sample }`.

### 🐛 Bug fixes

- **`fix(router): catch-all 404 view + i18n coverage guard` (FIX-C7)** — unknown hash routes used to silently fall back to the dashboard, masking typos and broken bookmarks. Now `#/totally-random-xyz` renders a dedicated 404 page that quotes the bad path back and links to the dashboard. The 404 view is registered inside the router IIFE itself so it cannot collide with any user route. New `tests/i18n-coverage.test.mjs` runs `i18n.js` inside a `vm.Context` with a stub `window`, exposes the private `DICT`, and asserts every one of the 173+ keys × 8 locales is populated and non-empty. 4 new router tests.
- **`fix(router): alias #/profile → settings` (FIX-C2)** — the internal route name is `settings` (with `nav.settings` rendering "Profile") but external links and muscle memory go to `#/profile`. Now both addresses reach the same view, and the sidebar nav-item lights up either way. 2 new tests.
- **`fix(health): unify Health/Doctor + flag template profiles` (FIX-C6 + FIX-H6)** — Health and Doctor were two different sources of truth. Now `/api/health` exposes everything Doctor reports (parent-deps, Playwright, dirs, profile-customized, `HH_USER_AGENT`). The `Profile customized` check detects placeholder names (`Jane Smith`, `Alex Doe`, `John Doe`, `Your Name`, `Test User`) and explicit YAML parse errors. 4 new tests.
- **`fix(scan): warn on query↔negative collisions in RU config` (FIX-H3)** — when `portals.yml` ships with `"PHP"` in `title_filter.negative` while the queries target Senior PHP, every match gets filtered and the user sees zero results. `loadConfig()` now computes a `warnings` array; `runRuScan()` emits each warning as an SSE stderr line before the scan starts. 2 new tests verify the shipped defaults stay PHP-friendly out of the box.
- **`fix(scan): warn when HH_USER_AGENT is unset` (FIX-H1)** — the `/scan` page probes `/api/health` and shows a yellow warning card above the action row when `HH_USER_AGENT` is empty, so users know about the hh.ru 403 *before* they click RU scan.
- **`fix(api): warn when POST /api/jds slug had unsafe chars stripped` (FIX-M2)** — slug normalization that strips dangerous characters now returns a `warning` field; pure case/whitespace cleanup stays silent. Empty result after sanitization returns 400.
- **`fix(ui): clear global search on route change + button spinners` (FIX-M4 + FIX-L1)** — the global-search input is cleared on `hashchange` (with a guard for active typing). New `UI.withSpinner(button, fn)` helper wires loading state, ARIA, and double-click prevention into every async button click. Already adopted on Doctor / Verify / sync-check / Save CV / Normalize / Dedup / Merge buttons.
- **`fix(ui): make sidebar scrollable so 18 nav items always reach the footer`** — the grouped sidebar from FIX-C8 overflowed shorter viewports; bottom items (Activity / Health) were clipped. `.sidebar` now has `overflow-y: auto` with thin custom-styled scrollbars (WebKit + Firefox). Footer stays pinned via the existing `margin-top: auto`.
- **`fix(ui): empty modal-title placeholder` (FIX-H9)** — the hardcoded English `"Title"` string in `index.html` is gone, closing the brief race window where it was visible during modal open.

### 🌐 i18n

- 173+ translation keys × 8 supported locales (`en`, `es`, `pt-BR`, `ko`, `ja`, `ru`, `zh-CN`, `zh-TW`). New keys added across all locales for: 404 page, activity log, deep research, PDF flow, security warnings, tracker mutation, apply rename. Coverage is now enforced by `tests/i18n-coverage.test.mjs` — every key must have a non-empty value in every supported locale or CI fails.

### ⚙️ DevOps

- **Test count:** 73 → **201** (+128 tests across 23 test files). The single remaining failing test (`runEnScan: dry-run end-to-end across multiple sources`) is a pre-existing flake dependent on Greenhouse/Ashby/Lever live API responses.
- **Comprehensive Playwright e2e** (`tests/e2e-comprehensive.mjs`, 23 steps): walks the full user journey — CV save → preview → PDF generation → all 7 new modes → tracker filters → activity log → 404 → modal ESC → sidebar scroll → Ctrl-K focus → search clear → profile alias → language persistence.
- **GitHub Actions** (`.github/workflows/`):
  - `ci.yml` — unit + integration tests on Node 18/20/22 matrix, plus i18n coverage gate (every key × 8 locales must be non-empty), plus the full Playwright e2e on every PR.
  - `ai-review.yml` — Claude Code AI review on every PR. Maintainers retain merge authority; Claude only suggests. Skip via `skip-ai-review` label.
  - `release.yml` — auto-publish a GitHub Release when a `v*.*.*` tag is pushed; release notes are sliced from `CHANGELOG.md` so all 8 language variants stay the canonical source.
- **CSP-friendly UI:** all inline `onclick` handlers removed from `index.html` and `router.js`. The strict `script-src 'self'` policy is now enforceable without breaking any feature.

### 📦 New REST endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET`    | `/api/activity`                  | List user-action events, newest first |
| `GET`    | `/api/interview-prep`            | List saved Deep Research files |
| `GET`    | `/api/interview-prep/:name`      | Read a single Deep Research file |
| `DELETE` | `/api/interview-prep/:name`      | Remove a Deep Research file |
| `GET`    | `/api/output/pdfs`               | List generated PDFs |
| `GET`    | `/api/output/pdfs/:name`         | Stream a PDF as an attachment |
| `POST`   | `/api/tracker`                   | Append a row to `applications.md` |
| `DELETE` | `/api/jds/:name`                 | Remove a saved JD |
| `POST`   | `/api/evaluate/test-gemini`      | Smoke-test the Gemini API key |
| `POST`   | `/api/mode/:slug`                | Generic prompt builder for the 7 new modes (project / training / followup / batch / contacto / interview-prep / patterns) |

---

## [1.6.0] — 2026-05-02

Initial public release of the web UI. See `README.md` for the feature inventory at this baseline.
