# QA REGRESSION PROMPT — career-ops-ui v1.59.11 (DEFINITIVE FINAL)

Single hand-off for a QA tester (human or agent) to verify v1.59.11 end-to-end. Standalone — walking top-to-bottom signs off the build without needing the rest of the `qa/` tree.

**Baseline at v1.59.11:** **988** unit · 62 Playwright · 20 smoke E2E · **23 / 23** comprehensive E2E · CI matrix `success` on Node 18 / 20 / 22 + Playwright e2e.
**Server:** `http://127.0.0.1:4317` (start with `npm start`).
**Browser smoke:** Chrome stable + 1 secondary (Firefox or Safari).
**Cycle closed:** **26 releases** v1.58.52 → v1.59.11 — all CI-green, all AI-review LGTM, zero rollbacks.

---

## §−1 — Probe methodology footguns (READ BEFORE STARTING)

Two methodological errors caused **false-negative sign-offs** earlier in this cycle. Avoid them.

### Footgun 1 — file-path vs inline implementation

The v1.59.9 FIX-PROMPT *suggested* extracting the scroll-spy into a new file `public/js/help-toc.js`. The actual implementation **inlined** it into `public/js/views/help.js` (which is the existing route module). **Do not assert presence of a separate file** — `git grep` for the **behaviour** (debug marker + class application), not for a specific filename:

```bash
# ✓ Correct
git grep -n "data-toc-spy" public/js/views/help.js   # → 3 matches in v1.59.11
git grep -n "computeActiveAndApply" public/js/views/help.js   # → ≥1 match

# ✗ Wrong (the file was never extracted)
git grep -n "mountHelpToc" public/   # → 0 matches; this is NOT a regression
ls public/js/help-toc.js              # → no such file; also NOT a regression
```

**Behavioural check** (the only one that actually tells you the spy works):

```js
// Open #/help in a real browser, wait ~1500 ms for the SPA to mount, then:
document.body.dataset.tocSpy                        // → "active"
document.querySelectorAll('.help-toc a.toc-current').length   // → 1
```

If either is wrong **after the mount window**, file a regression. If you check too eagerly (before the route handler resolves), you'll see `undefined`/`0` — that's a probe race, not a bug.

### Footgun 2 — URL normalisation on the client side

`fetch('/api/jds/../../../etc/passwd')` and `curl 'http://…/api/jds/../../../etc/passwd'` **normalise the URL before sending**. They send `/etc/passwd` to the server. The server sees a non-`/api` path → SPA fallback → 200 HTML. **That is the CLIENT's behaviour, not a server bug.**

To verify the server's `req.originalUrl` `..` guard fires, you MUST send a verbatim raw URL. Two ways:

```bash
# ✓ curl with --path-as-is (no client-side normalisation)
curl -s --path-as-is "http://127.0.0.1:4317/api/jds/../../../etc/passwd"
# → {"error":"invalid path"}

# ✓ Node http.request with verbatim path (also no normalisation)
node -e '
import("node:http").then(({request})=>{
  const req = request({host:"127.0.0.1",port:4317,path:"/api/jds/../../../etc/passwd"},
    r => { let b=""; r.on("data",c=>b+=c).on("end",()=>console.log(r.statusCode,b)); });
  req.end();
});
'
# → 404 {"error":"invalid path"}
```

The percent-encoded variant (`%2e%2e%2f`) is also a valid probe — it returns `404 {"error":"not found"}` from the `/api/jds/:name` route's own 404 path. Both responses are JSON 404; both confirm the contract.

---

## §0 — Boot

```bash
git fetch --tags
git checkout v1.59.11
node --version              # >= 18
npm ci
make clean-test-fixtures    # purge example.com/qa-fixture-* rows from data/pipeline.md
npm test                    # MUST report 988 / 988 pass, 0 fail
                            #   ⚠️ DO NOT pipe through `grep` — it masks the exit code
npm start                   # server on 127.0.0.1:4317
open http://127.0.0.1:4317
```

Expected: `/api/health` → `{"version":"1.59.11","ok":true, checks: 20+ rows}`.

---

## §1 — Server-side fixes (curl probes, 60 seconds)

| # | Command | Expect |
|---|---|---|
| 1.1 | `curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4317/api/no-such-endpoint` | `404 application/json` (NEW-F1, v1.59.5) |
| 1.2 | `curl -s -o /dev/null -w "%{http_code} %{content_type}\n" -X POST http://127.0.0.1:4317/api/no-such-endpoint` | `404 application/json` (was `text/html` pre-v1.59.5) |
| 1.3 | `curl -s -o /dev/null -w "%{http_code} %{content_type}\n" -X DELETE http://127.0.0.1:4317/api/no-such-endpoint` | `404 application/json` |
| **1.4** | `curl -s --path-as-is "http://127.0.0.1:4317/api/jds/../../../etc/passwd"` | **`{"error":"invalid path"}`** (NEW-F1-sub-r1, v1.59.10) — **`--path-as-is` is mandatory**; see §−1 Footgun 2 |
| 1.5 | `curl -s -X POST "http://127.0.0.1:4317/api/no-such-endpoint"` | **`{"error":"unknown api"}`** (regression lock — guard MUST NOT swallow plain unknown endpoints) |
| 1.6 | `curl -s -i http://127.0.0.1:4317/api/cv \| grep -i cache-control` | `Cache-Control: no-store` (NEW-D3-cache, v1.59.7) |
| 1.7 | `curl -s http://127.0.0.1:4317/api/status/providers \| grep -o '"keysConfigured":\\[[^]]*\\]'` | array of provider names (NOT a number) |

| # | Header / Probe | Expect |
|---|---|---|
| 1.8 | `Content-Security-Policy` on `/` | contains `default-src 'self'`; **must NOT** contain `'unsafe-inline'` in `script-src`; `object-src 'none'`; `frame-ancestors 'none'` |
| 1.9 | `X-Content-Type-Options` | `nosniff` |
| 1.10 | `X-Frame-Options` | `DENY` |
| 1.11 | `Referrer-Policy` | `same-origin` (or `no-referrer`) |

---

## §2 — SPA route walk (en + 1 non-en locale)

For each route below, open in browser. Check H1 text, no console errors, no untranslated `key.path` leaks, no truncation.

| # | Route | What to verify |
|---|---|---|
| 2.1 | `#/dashboard` | Hero with 2 CTAs · `.dash-chip--provider` reads `⚡ Live evals: Anthropic <model>` (capital A) OR `📋 Manual prompt mode` · 4 metric cards · Pipeline tile has stronger visual weight (`.qa-tile--primary`) |
| 2.2 | `#/pipeline` | Counter accurate · filter chips work · `+ Add` toast `Added to pipeline` |
| 2.3 | `#/config → API keys` | `.api-keys__summary` chip reads `Active: <Provider>` + `Keys: N / 5`. **NOT** sticky-overlapping the tablist on scroll. Save → counter **never** flashes `0 / 5` |
| 2.4 | `#/cv` | Edit textarea → Save button gains `.btn-dirty` · navigate away → confirm dialog `You have unsaved CV changes. Leave anyway?` |
| 2.5 | `#/deep` | Saved cards render with `<span.saved-card__title>` + `<time.saved-card__date>` · brief lacking ≥3 of 6 canonical H2 sections shows `.brief-warning` ribbon |
| 2.6 | `#/help` | **THE HEADLINE TEST** — see §4 |
| 2.7 | `#/health` | Failing rows show `Fix →` ghost button · clicking lands on the right config tab |
| 2.8 | `#/auto` | Stepper pre-renders with 5 steps in `aria-disabled` state · ⚡ submit fires SSE log |
| 2.9 | `#/scan` | `Open Scan` (NOT `Quick scan`) on top-bar · Advanced filters inside `<details>` |
| 2.10 | `#/tracker` | Funnel chips · server-side pagination on >50 rows · search box has localized `aria-label` |
| 2.11 | `#/evaluate` | Empty JD submit → distinct toast `Paste a job description first` (or localized) |
| 2.12 | `#/apply` | Interactive checklist · `[company]-[role]` slug substituted from URL/JD |
| extra | `#/this-route-does-not-exist` | H1 `404 — page not found` + Back-to-Dashboard link |

**Locale switch:** sidebar footer → `ru`. Verify H1 / nav text flip, `<html lang="ru">` set, per-route `document.title` updates.

**Mobile:** Chrome DevTools → device emulation iPhone SE (375 px). Verify `#/dashboard` card-row stacks 1-up, hero CTAs full-width, `#/config → API keys` chip wraps cleanly.

**Reduced motion:** Chrome DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`. No fade/slide animations.

---

## §3 — Notifications drawer

| # | Action | Expect |
|---|---|---|
| 3.1 | Click bell 🔔 in top-bar | drawer slides in · `aria-expanded="true"` on bell · `aria-controls="notif-drawer"` |
| 3.2 | Trigger an error toast (e.g. POST with bad payload) | drawer journal records the message + the `(METHOD /path · HTTP NNN)` postfix in a collapsed `<details>` |
| 3.3 | Click `× Dismiss` on a single entry | that entry disappears, unread badge does NOT increment |
| 3.4 | Click `Clear all` in drawer head | journal empties, badge clears, button hides (correctly auto-hidden when journal is empty) |
| 3.5 | Close drawer (× or Esc) | `aria-expanded="false"` |

---

## §4 — Help TOC scroll-spy (UX-A5-r4 lock-test) — THE HEADLINE REGRESSION CLOSE

The longest-running regression in this cycle — **6 closure attempts** (v1.58.45 → v1.58.52 → v1.59.0 → v1.59.3 → v1.59.8 → v1.59.9). Each previous closure shipped passing static tests but the user-visible bug stayed open. v1.59.9 finally closed it with a behavioural test that drives synthetic scroll positions through the algorithm.

> **🛑 STOP — RE-READ §−1 BEFORE THIS SECTION**. Earlier sign-offs marked §4 FAIL because the probe (a) looked for a separate file `public/js/help-toc.js` that the implementation chose to inline into `public/js/views/help.js`, and (b) checked `document.body.dataset.tocSpy` before the SPA had finished mounting. Both are probe errors, not bugs. The implementation IS `public/js/views/help.js` (`grep -n "data-toc-spy" public/js/views/help.js` returns 3 matches), and the marker becomes `"active"` only after the route handler resolves (~500–1500 ms on a cold start).

### 4.1 Debug marker — single-selector "is the spy alive?"

Open `#/help`. **Wait 1500 ms after page load.** In DevTools console:

```js
document.body.dataset.tocSpy
// Expect: "active"
```

Navigate to `#/dashboard`. Wait 200 ms:
```js
document.body.dataset.tocSpy
// Expect: undefined (removed by hashchange cleanup)
```

Return to `#/help`. Wait 1500 ms:
```js
document.body.dataset.tocSpy
// Expect: "active" (re-attached on re-mount)
```

**If this marker is wrong AFTER the mount window** → file a regression. **Do not** assert before the mount completes.

### 4.2 Initial paint

On `#/help` first load (after 1500 ms):
```js
document.querySelectorAll('.help-toc a.toc-current').length
// Expect: 1 (section 0 is highlighted on first paint, before any scroll)
```

### 4.3 Scroll progression

```js
document.getElementById('help-h-5').scrollIntoView({ block: 'center' });
// wait 600ms
document.querySelector('.help-toc a.toc-current').getAttribute('href');
// Expect: #help-h-N where N is in [3..7] (the section currently around 30 % from top)
```

### 4.4 TOC click

Click a TOC entry (any). Within 800 ms:
```js
document.querySelector('.help-toc a.toc-current').getAttribute('href');
// Expect: the href of the clicked link
```

### 4.5 Visual paint check

```js
const cur = document.querySelector('.help-toc a.toc-current');
getComputedStyle(cur).borderLeftColor;
// Expect: rgb() matching var(--rausch) — e.g. "rgb(255, 56, 92)" in light theme
// (One previous cycle attached the class but a later CSS rule reset border-left:0)
```

### 4.6 Re-mount

Navigate `#/dashboard` → `#/help`. Repeat steps 4.1–4.5. All must pass.

**If any step fails AFTER the mount window** → file `qa/FIX-PROMPT-v1.59.<N>.md` referencing UX-A5-r4 and `tests/help-toc-spy-behavior.test.mjs`.

---

## §5 — i18n parity sweep

Help bundle parity: **18 H2 / 73 H3 across all 8 locales.** Run `npm test` — the `canonical-docs-coverage`, `help-ru-config-section`, and `help-ui` tests assert this.

Per-route H1 spot-checks (must be exact):
- `#/pipeline` (es) → **`Pipeline de candidaturas`** (NOT `Pipeline de vacantes`)
- `#/dashboard` (ru) → **`Командный центр`**
- `#/help` (ja) → **`ヘルプ`**
- Footer hotkey hint: macOS → `⌘K`, others → `Ctrl+K`

Static parity gates (run before any tag):

```bash
node scripts/check-changelog-parity.mjs   # must report all 8 locales at v1.59.11
node scripts/check-no-also-leftovers.mjs  # no `.also(` leftovers
```

---

## §6 — Full test pyramid (CI-equivalent)

```bash
npm test                          # 988 / 988 unit, 0 fail
npm run test:coverage             # line >= 93%, branch >= 83%
npm run test:e2e                  # 20 / 20 smoke
npm run test:e2e:full             # 23 / 23 comprehensive (v1.59.11 fixed the 12-case CI failure)
npm run test:e2e:browser          # 62 Playwright (smoke + full-cycle + forms)
```

⚠️ **Pre-commit AI review is advisory; `ci.yml` is the hard gate.** Watch the GitHub Actions CI run after tag push — Node 18 / 20 / 22 + Playwright e2e must all finish `success`. v1.59.11 was the first commit where ALL 4 jobs (3 unit matrices + Playwright e2e) went green simultaneously.

---

## §7 — 27 cycle invariants (v1.58.52 → v1.59.11) — quick reference

Every row below has a static or behavioural lock-test in `tests/qa-report-fixes.test.mjs`, `tests/api-404-json.test.mjs`, `tests/api-path-traversal.test.mjs`, `tests/help-toc-spy-behavior.test.mjs`, or `tests/e2e-comprehensive.mjs`.

### Maturity-10 cycle (v1.58.52 → v1.59.0) — 15 invariants

| Release | Invariant |
|---|---|
| v1.58.52 UX-A5 | help.js TOC scroll-spy (re-cycled — see §4 + v1.59.9) |
| v1.58.53 UX-A6 | every saved-research card flows through `renderSavedCard(f)` |
| v1.58.54 UX-A1 | `looksLikeStructuredBrief()` checks ≥ 3 of 6 canonical H2 sections |
| v1.58.55 UX-A3 | dashboard provider chip + hashchange cleanup |
| v1.58.56 UX-A4 | `.lang-btn` 28×28 px (WCAG 2.5.8) |
| v1.58.57 UX-A7 | `providers-changed` event dispatch + advisor views |
| v1.58.58 UX-A10 | `#/cv` `beforeunload` + `hashchange` guards |
| v1.58.59 UX-A13 | health `FIX_TARGETS` map + `.health-fix` ghost button |
| v1.58.60 UX-A12 | notif-clear-all + per-item × |
| v1.58.61 UX-A8 | all 8 READMEs reference `make clean-test-fixtures` |
| v1.58.62 UX-A9 | `.api-keys__summary` chip |
| v1.58.63 UX-A15 | `.qa-tile--primary` on Pipeline tile |
| v1.58.64 UX-A11 | es / pt-BR copy polish · es `pipe.title` = `Pipeline de candidaturas` |
| v1.58.65 UX-A2 | `modes-form.js` CANON 5 fields |
| v1.59.0 UX-A14 | `@media (max-width: 420px)` mobile block |

### Final polish cycle (v1.59.1 → v1.59.11) — 12 invariants

| Release | Invariant |
|---|---|
| v1.59.1 NEW-D1 patch | `i18n-no-latin-leaks` regex accepts `vacant\|candidatur` (es) |
| v1.59.2 chip hotfix | chips read `keysConfigured` as array; NAME map keyed `anthropic`; `.api-keys__summary` NOT sticky |
| v1.59.3 UX-A5-r2 | (superseded by v1.59.8 → v1.59.9) |
| v1.59.4 NEW-OR1 | `refreshApiSummary` race-safe: `inFlight` token + atomic `replaceChildren()` + `lastGoodSt` cache |
| v1.59.5 NEW-F1 | `app.all('/api/*', …)` JSON-404 on every verb |
| v1.59.6 NEW-D2-motion | `@media (prefers-reduced-motion: reduce)` neutralizes animations |
| v1.59.7 NEW-D3-cache | `GET /api/cv` sends `Cache-Control: no-store` |
| v1.59.8 UX-A5-r3 | (superseded by v1.59.9) |
| v1.59.8 NEW-F1-sub | (superseded by v1.59.10) |
| **v1.59.9 UX-A5-r4** | `<body data-toc-spy="active">` debug marker · synchronous initial paint + double-rAF re-compute + resize listener · linear scan with `else break;` · 7-case behavioural test in `tests/help-toc-spy-behavior.test.mjs` |
| **v1.59.10 NEW-F1-sub-r1** | server `req.originalUrl` `..` guard hoisted ABOVE all `register*Routes(app)` calls — pattern `/^\/api(\/\|$)/.test && /\.\.\//.test`. 6-case test in `tests/api-path-traversal.test.mjs` |
| **v1.59.11 e2e-harness-r1** | `tests/e2e-comprehensive.mjs` uses `goRoute(hash)` helper that bounces via `about:blank` — fixes 12 chronically-failing CI cases (Playwright's `page.goto` is a no-op on hash-only URL changes) |

---

## §8 — Sign-off matrix

| Gate | Pass? |
|---|---|
| §−1 — methodology footguns understood (file-path vs inline; client URL normalisation) | ☐ |
| §0 — `npm test` 988 / 988, 0 fail · `make clean-test-fixtures` idempotent | ☐ |
| §1 — all 11 curl probes match Expect column (incl. **#1.4 with `--path-as-is`**) | ☐ |
| §2 — all 13 routes + 1 non-en locale + mobile + reduced-motion | ☐ |
| §3 — notifications drawer 5 interactions | ☐ |
| §4 — help TOC scroll-spy 6 steps (THE headline regression close, with mount-window wait) | ☐ |
| §5 — i18n parity gates + 4 spot-checks | ☐ |
| §6 — full test pyramid (`npm test` + 3 e2e suites + coverage floor) | ☐ |
| §6 — CI matrix (Node 18 / 20 / 22 + **Playwright e2e**) all `success` after tag push | ☐ |
| §7 — 27 invariants verified by test names (no lock-test failures) | ☐ |
| Security envelope byte-stable (CSP / XFO / nosniff / Referrer-Policy) | ☐ |
| Parent-project read-only contract preserved | ☐ |

---

## §9 — On failure

1. **First, re-check §−1.** Most "failures" in this cycle were probe-methodology errors.
2. Capture **route + exact copy + browser version + locale + screenshot** of the symptom.
3. Identify the failing lock-test (`node --test tests/qa-report-fixes.test.mjs tests/api-404-json.test.mjs tests/api-path-traversal.test.mjs tests/help-toc-spy-behavior.test.mjs`).
4. File `qa/FIX-PROMPT-v1.59.<N+1>.md` with the failure evidence, the §7 invariant ID, and the proposed fix shape (HOW + TEST + ACCEPTANCE + CHANGELOG ×8 sketch).
5. **Doctrine: one fix per release.** Exception: explicit bundled HIGH+LOW like v1.59.8 — only when an audit report authorises it in writing.
6. Pre-commit AI review is advisory; `ci.yml` is the hard gate. Pass both before tagging.

**Open out-of-scope items at v1.59.11** (not regressions — parent-blocked or v1.60+):

| ID | Owner | Status |
|---|---|---|
| C-1 (parent `modes/deep.md`) | parent | blocked — UX-A1 defensive UI workaround |
| G-005 (parent `modes/oferta.md`) | parent | blocked — schema-tolerant render |
| UX-022 (parent `portals.yml`) | parent | blocked |
| CLI locale (parent stdout) | parent | post v1.60 |
| RTL support (Arabic / Hebrew) | this repo | post v1.60 |
| Drag-and-drop reorder · bulk delete · PWA / offline | this repo | post v1.60 |

---

## §10 — Doctrine lessons (the 23-item knowledge base accumulated across this cycle)

Hard-won, do not re-learn:

1. ONE fix per release. Doctrine exceptions only with audit authorisation.
2. CHANGELOG parity is non-negotiable. `node scripts/check-changelog-parity.mjs` before every commit.
3. `ci.yml` is the hard gate. Pre-commit AI review is advisory.
4. `[hidden]` is shadowed by author `display:` rules — add explicit override.
5. `npm test 2>&1 | grep` masks the exit code. Run first, grep second.
6. `cleanLlmMarkdown` is NOT an XSS sanitizer. Boundaries are `stripDangerousMarkdown()` (server) + `UI.md()` (client).
7. `PATHS` resolves once per process.
8. Lifecycle listeners must scope to the route via `hashchange` cleanup.
9. Author cascade beats UA-level `[hidden]`.
10. Help bundle parity (H2 + H3) is locked: 18 H2 / 73 H3 baseline.
11. `saveBtn.onclick =` is a footgun on `c()`-built elements — use bubble-phase `addEventListener`.
12. GitHub Packages publish runs against the tagged ref, not main.
13. i18n copy polish can break older static guards — check existing regexes.
14. Server contract: `keysConfigured` is an ARRAY, `activeProvider` is the resolved NAME (`anthropic`, not `claude`).
15. `position: sticky` + `z-index` creates a floating stacking context.
16. `app.get('/api/*')` is GET-only — use `app.all` for JSON-404 across all verbs.
17. DOM refresh races: build new nodes first, then `replaceChildren()` atomically.
18. IO `rootMargin` too tight = scroll skips trigger; in this codebase, IO refused to fire across 4 cycles and was replaced with a scroll listener.
19. `req.url` is normalised; `req.originalUrl` is verbatim. Use `originalUrl` for raw-string guards.
20. **Middleware position matters as much as content.** Express order is strictly imperative — "right code, wrong place" is unreachable code.
21. **Static lock-tests can pass while user-visible bugs stay open.** A regression-lock test must drive the actual scenario (simulated scroll → algorithm output), not `git grep` for a symbol.
22. **Playwright `page.goto(url)` is a no-op when only the URL fragment changes** (v1.59.11 e2e-harness-r1). Bounce through `about:blank` to force a real navigation when probing hash-routed SPAs.
23. **Probe methodology can produce false-negative sign-offs.** Two examples from this cycle: (a) asserting presence of a *suggested* extracted file when the impl was inlined into an existing one — assert behaviour, not file paths; (b) using `fetch` / curl-without-`--path-as-is` to probe path-traversal — both client-side normalise the URL before sending. See §−1.

---

*Definitive final QA hand-off for v1.59.11. Hand to a human tester or an agent — copy-paste top-to-bottom, fill the §8 matrix, file FIX-PROMPT on any failure. Generated 2026-05-21 after the 26-release v1.58.52 → v1.59.11 cycle closed at 988 / 988 unit + 23 / 23 comprehensive e2e + CI matrix all-green.*
