# QA REGRESSION PROMPT — career-ops-ui v1.59.8

Standalone walkthrough for a QA tester to verify the v1.59.8 release end-to-end. Copy-pasteable: a tester (human or agent) following this top-to-bottom can sign off the build without needing the rest of the qa/ tree.

**Baseline:** **973** unit · 62 Playwright · 20 smoke E2E · 23 comprehensive E2E.
**Server:** `http://127.0.0.1:4317` (start with `npm start`).
**Browser smoke:** Chrome stable + 1 secondary (Firefox or Safari).

---

## §0 — Boot

```bash
git fetch --tags
git checkout v1.59.8
node --version              # >= 18
npm ci
make clean-test-fixtures    # purge example.com/qa-fixture-* rows from data/pipeline.md (idempotent)
npm test                    # MUST report 973 / 973 pass, 0 fail
                            #   ⚠️ DO NOT pipe through `grep` — it masks the exit code
npm start                   # server on 127.0.0.1:4317
open http://127.0.0.1:4317
```

Expected: `/api/health` → `{"version":"1.59.8","ok":true, checks: 20+ rows}`.

---

## §1 — Server-side fixes (curl probes, 60 seconds)

Run each block; every line should match the **Expect** column.

| # | Command | Expect |
|---|---|---|
| 1.1 | `curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4317/api/no-such-endpoint` | `404 application/json` |
| 1.2 | `curl -s -o /dev/null -w "%{http_code} %{content_type}\n" -X POST http://127.0.0.1:4317/api/no-such-endpoint` | `404 application/json` (was `text/html` pre-v1.59.5) |
| 1.3 | `curl -s -o /dev/null -w "%{http_code} %{content_type}\n" -X DELETE http://127.0.0.1:4317/api/no-such-endpoint` | `404 application/json` |
| 1.4 | `curl -s -o /dev/null -w "%{http_code} %{content_type}\n" --path-as-is "http://127.0.0.1:4317/api/jds/../../../etc/passwd"` | `404 application/json` (v1.59.8 NEW-F1-sub) |
| 1.5 | `curl -s -i http://127.0.0.1:4317/api/cv \| grep -i cache-control` | `Cache-Control: no-store` (v1.59.7 NEW-D3-cache) |
| 1.6 | `curl -s http://127.0.0.1:4317/api/status/providers \| grep -o '"keysConfigured":\\[[^]]*\\]'` | array of provider names (NOT a number, NOT a count) |

| # | Header / Probe | Expect |
|---|---|---|
| 1.7 | `Content-Security-Policy` on `/` | contains `default-src 'self'`; **must NOT** contain `'unsafe-inline'` in `script-src`; `object-src 'none'`; `frame-ancestors 'none'` |
| 1.8 | `X-Content-Type-Options` | `nosniff` |
| 1.9 | `X-Frame-Options` | `DENY` |
| 1.10 | `Referrer-Policy` | `same-origin` (or `no-referrer`) |

---

## §2 — SPA route walk (en + 1 non-en locale)

For each route below, open in browser. Check H1 text, no console errors, no untranslated `key.path` leaks, no truncation.

| # | Route | What to verify |
|---|---|---|
| 2.1 | `#/dashboard` | Hero with 2 CTAs (`✨ Auto-pipeline a URL`, `🌐 Scan now`) · `.dash-chip--provider` reads `⚡ Live evals: Anthropic <model>` (capital A) OR `📋 Manual prompt mode (no API key set)` · 4 metric cards · Pipeline tile in Quick-actions has stronger visual weight (`.qa-tile--primary`) |
| 2.2 | `#/pipeline` | Counter accurate · filter chips work · `+ Add` toast `Added to pipeline` |
| 2.3 | `#/config → API keys` | `.api-keys__summary` chip at top reads `Active: <Provider>` + `Keys: N / 5` correctly. **Not** sticky-overlapping the tablist on scroll. Paste a fake key into any `_API_KEY` field + Save → counter **never** flashes `0 / 5`; either stays or increments atomically |
| 2.4 | `#/cv` | Edit textarea → Save button gains `.btn-dirty` · navigate away → confirm dialog `You have unsaved CV changes. Leave anyway?` · Cancel keeps you on `#/cv` · OK leaves |
| 2.5 | `#/deep` | Saved-research cards render with `<span.saved-card__title>` + `<time.saved-card__date>` · brief lacking ≥3 of 6 canonical H2 sections shows `.brief-warning` ribbon at top |
| 2.6 | `#/help` | TOC visible on left · **scroll body — the TOC entry of the current section gets `.toc-current` class** (brand color + left border) · on first paint section 1 is already marked · navigate to `#/dashboard` and back to `#/help` → scroll-spy re-attaches and still works |
| 2.7 | `#/health` | Failing/optional rows show small `Fix →` ghost button next to the badge · clicking lands on the right config tab (`#/config?tab=profile` / `#/config?tab=api-keys` / etc.) |
| 2.8 | `#/auto` | Stepper pre-renders with all 5 steps in `aria-disabled` state · ⚡ submit fires SSE log |
| 2.9 | `#/scan` | `Open Scan` (NOT `Quick scan`) on top-bar · Advanced filters inside `<details>` · Stop button prominent during run |
| 2.10 | `#/tracker` | Funnel chips · server-side pagination on >50 rows · search box has localized `aria-label` |
| 2.11 | `#/evaluate` | Empty JD submit → distinct toast `Paste a job description first` (or localized equivalent) |
| 2.12 | `#/apply` | Interactive checklist (clickable rows persist per URL in localStorage) · `[company]-[role]` slug substituted from URL/JD |

**Locale switch:** in the sidebar footer click the language picker — try `ru`. Verify all H1 / nav text flip · `<html lang="ru">` set · per-route `document.title` updates on each navigation.

**Mobile:** Chrome DevTools → device emulation iPhone SE (375 px). Verify `#/dashboard` card-row stacks 1-up · hero CTAs full-width · `#/config → API keys` chip wraps cleanly · notifications drawer head fits.

**Reduced motion:** Chrome DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`. Click theme-toggle and notif-bell — no fade/slide animations (CSS `transition-duration` becomes 0.01 ms).

---

## §3 — Notifications drawer

| # | Action | Expect |
|---|---|---|
| 3.1 | Click bell 🔔 in top-bar | drawer slides in from right · `aria-expanded="true"` on the bell |
| 3.2 | Trigger an error toast (e.g. POST a malformed payload) | drawer journal records the message + the `(METHOD /path · HTTP NNN)` postfix in a collapsed `<details>` |
| 3.3 | Click `× Dismiss` on a single entry | that entry disappears, others remain, unread badge does NOT increment |
| 3.4 | Click `Clear all` in drawer head | journal empties, badge clears, button hides |
| 3.5 | Close drawer (× or Esc) | `aria-expanded="false"`; Esc keydown listener detached |

---

## §4 — Help TOC scroll-spy (UX-A5-r3 lock-test)

The Help TOC scroll-spy was the longest-running regression in this cycle — 4 IntersectionObserver attempts failed before v1.59.8 replaced it with a scroll listener. Verify thoroughly:

1. Open `#/help`. Open DevTools console.
2. Run:
   ```js
   document.querySelectorAll('.help-toc a.toc-current').length
   ```
   Expect: `1` (the first heading is highlighted on first paint).
3. Scroll the page body slowly down past section 5. The `.toc-current` class should move with the active section in the viewport.
4. Run again:
   ```js
   document.querySelector('.help-toc a.toc-current').getAttribute('href')
   ```
   Expect: a `#help-h-N` matching the heading currently around 30 % from top.
5. Use the TOC click — should smooth-scroll to the section and update `.toc-current`.
6. Navigate to `#/dashboard`, then back to `#/help`. Scroll-spy must still work on re-mount.

**If any step fails → file a regression report. The user-visible promise is "the active section's TOC entry is always highlighted." Mechanism (scroll listener vs IntersectionObserver) is implementation detail; v1.59.8 mechanism is scroll listener — see [`REGRESSION-PROMPT-FINAL.md`](./REGRESSION-PROMPT-FINAL.md) §3 lesson #18 for why.**

---

## §5 — i18n parity sweep (smoke)

For each of the 8 locales (`en`, `es`, `pt-BR`, `ko`, `ja`, `ru`, `zh-CN`, `zh-TW`), confirm the per-route H1 matches the expected native-equivalent translation. The full table is in [`REGRESSION-PROMPT-FINAL.md`](./REGRESSION-PROMPT-FINAL.md) §2.

Spot-checks (must be exact):
- `#/pipeline` (es) → **`Pipeline de candidaturas`** (NOT `Pipeline de vacantes` — that was the pre-v1.58.64 wording)
- `#/dashboard` (ru) → **`Командный центр`** (no Latin leakage)
- `#/help` (ja) → **`ヘルプ`** (no English bleed in TOC entries 2/5/13/14)
- Footer hotkey hint: macOS shows `⌘K`, other platforms show `Ctrl+K` — verify it flips with the platform

Static parity gate (run before tag):
```bash
node scripts/check-changelog-parity.mjs   # must report all 8 locales at v1.59.8
node scripts/check-no-also-leftovers.mjs  # must report no `.also(` leftovers
```

---

## §6 — Test pyramid (CI-equivalent)

```bash
npm test                          # 973 / 973 unit, 0 fail
npm run test:coverage             # line >= 93 %, branch >= 83 %
npm run test:e2e                  # 20 smoke
npm run test:e2e:full             # 23 comprehensive
npm run test:e2e:browser          # 62 Playwright (smoke + full-cycle + forms)
```

⚠️ **Pre-commit AI review is advisory; `ci.yml` is the hard gate.** Watch the GitHub Actions CI run after tag push — Node 18 / 20 / 22 matrix must finish `success` on every job.

---

## §7 — 24 cycle invariants (v1.58.52 → v1.59.8) — quick reference

Every row below has a static or behavioural lock-test in `tests/qa-report-fixes.test.mjs` or `tests/api-404-json.test.mjs`. A failing test points at the precise contract violation.

### Maturity-10 cycle (v1.58.52 → v1.59.0)

| Release | Invariant |
|---|---|
| v1.58.52 UX-A5 | help.js TOC scroll-spy (later replaced in v1.59.8 — see §4) |
| v1.58.53 UX-A6 | every saved-research card flows through `renderSavedCard(f)` |
| v1.58.54 UX-A1 | `looksLikeStructuredBrief()` checks ≥ 3 of 6 canonical H2 sections |
| v1.58.55 UX-A3 | dashboard provider chip (`providers-changed` + `visibilitychange`) + hashchange cleanup |
| v1.58.56 UX-A4 | `.lang-btn` 28×28 px (WCAG 2.5.8) |
| v1.58.57 UX-A7 | `providers-changed` event dispatch + 4 advisor views call `UI.providerCostHint(t)` |
| v1.58.58 UX-A10 | `#/cv` `beforeunload` + `hashchange` guards · `isDirty()` reads live |
| v1.58.59 UX-A13 | health `FIX_TARGETS` map + `_API_KEY$` regex fallback + `.health-fix` ghost button |
| v1.58.60 UX-A12 | `UI.clearToastHistory()` + `UI.dismissToastHistory(ts)` · notif-clear-all + per-item × |
| v1.58.61 UX-A8 | all 8 READMEs reference `make clean-test-fixtures` |
| v1.58.62 UX-A9 | `.api-keys__summary` chip on `#/config` API-keys tab |
| v1.58.63 UX-A15 | `qa()` 7th `primary` flag · Pipeline tile · `.qa-tile--primary` |
| v1.58.64 UX-A11 | es / pt-BR copy polish · es `pipe.title` = `Pipeline de candidaturas` |
| v1.58.65 UX-A2 | `modes-form.js` CANON has 5 fields in canonical order |
| v1.59.0 UX-A14 | `@media (max-width: 420px)` mobile block |

### Final polish cycle (v1.59.1 → v1.59.8)

| Release | Invariant |
|---|---|
| v1.59.1 NEW-D1 patch | `i18n-no-latin-leaks` regex accepts `vacant\|candidatur` (es) |
| v1.59.2 chip hotfix | chips read `keysConfigured` as array; NAME map keyed `anthropic`; `.api-keys__summary` NOT sticky |
| v1.59.3 UX-A5-r2 | rootMargin widened to 25 % band + initial-state on mount (**superseded by v1.59.8**) |
| v1.59.4 NEW-OR1 | `refreshApiSummary` race-safe: `inFlight` token + atomic `replaceChildren()` + `lastGoodSt` cache |
| v1.59.5 NEW-F1 | `app.all('/api/*', …)` JSON-404 on every verb |
| v1.59.6 NEW-D2-motion | `@media (prefers-reduced-motion: reduce)` neutralizes animations |
| v1.59.7 NEW-D3-cache | `GET /api/cv` sends `Cache-Control: no-store` |
| **v1.59.8 UX-A5-r3** | help.js TOC scroll-spy uses `function computeActiveAndApply()` + rAF-throttled passive scroll listener; IntersectionObserver fully removed |
| **v1.59.8 NEW-F1-sub** | middleware inspects `req.originalUrl` and bounces `/api` requests containing raw `..` as 404 JSON |

---

## §8 — Sign-off matrix

| Gate | Pass? |
|---|---|
| §0 — `npm test` 973 / 973, 0 fail · `make clean-test-fixtures` idempotent | ☐ |
| §1 — all 10 curl probes match Expect column | ☐ |
| §2 — all 12 routes + 1 non-en locale walk + mobile + reduced-motion | ☐ |
| §3 — notifications drawer 5 interactions | ☐ |
| §4 — help TOC scroll-spy 6 steps (the headline regression close) | ☐ |
| §5 — i18n parity gates + 4 spot-checks | ☐ |
| §6 — full test pyramid (`npm test` + 3 e2e suites + coverage floor) | ☐ |
| §6 — CI matrix (Node 18 / 20 / 22) `success` after tag push | ☐ |
| §7 — 24 invariants verified by test names (no lock-test failures) | ☐ |
| Security envelope byte-stable (CSP / XFO / nosniff / Referrer-Policy) | ☐ |
| Parent-project read-only contract preserved (no edits to `../cv.md` / `../config/` / `../modes/` / `../data/` / `../reports/`) | ☐ |
| Tagged + pushed + AI-review LGTM + CI green | ☐ |

---

## §9 — On failure

If any cell above fails:

1. Capture **route + exact copy + browser version + locale + screenshot** of the symptom.
2. Identify the failing lock-test (run `node --test tests/qa-report-fixes.test.mjs tests/api-404-json.test.mjs` and grep `not ok`).
3. File `qa/FIX-PROMPT-v1.59.<N+1>.md` with the failure evidence, the corresponding §7 invariant ID, and the proposed fix shape (HOW + TEST + ACCEPTANCE + CHANGELOG ×8 sketch).
4. Doctrine: **one fix per release.** Exception: explicit bundled HIGH+LOW like v1.59.8 — only when an audit report authorises it in writing.
5. Pre-commit AI review is advisory; `ci.yml` is the hard gate. Pass both before tagging.

Open out-of-scope items at v1.59.8 (not regressions — they belong to the parent or to v1.60+):

| ID | Owner | Status |
|---|---|---|
| C-1 (parent `modes/deep.md` prompt layer) | parent project | blocked — UX-A1 is the defensive workaround |
| G-005 (parent `modes/oferta.md` A-G nomenclature) | parent project | blocked, schema-tolerant render in place |
| UX-022 (parent `portals.yml` stale URLs) | parent project | blocked |
| CLI locale (parent stdout) | parent project | post v1.60 |
| RTL support (Arabic / Hebrew) | this repo | post v1.60 |
| Drag-and-drop reorder · bulk delete · PWA/offline | this repo | post v1.60 |

---

## §10 — Quick contact / glossary

- Long-form post-cycle prompt: `qa/REGRESSION-PROMPT-FINAL.md` (24 invariants, §0 doctrine recap with 19 hard-won lessons, security envelope, parent-project contract, maturity matrix).
- Full project regression: `qa/REGRESSION-FINAL.md` (§0 → §15, all cycles).
- UX heuristic audit: `qa/UX-AUDIT-PROMPT.md`.
- Functional walkthrough: `qa/FUNCTIONALITY-CHECK.md`.
- Designer export hand-off: `qa/DESIGNER-EXPORT-PROMPT.md`.
- Archive (closed cycles): `qa/archive/v159-cycle/` (FIX-PROMPT-FINAL-CONSOLIDATED, 2026-05-20 FINAL REGRESSION report, etc.).

---

*Standalone QA hand-off for v1.59.8. Hand to a human tester or an agent — copy-paste top-to-bottom, fill the sign-off matrix, file FIX-PROMPT on any failure. Generated 2026-05-21.*
