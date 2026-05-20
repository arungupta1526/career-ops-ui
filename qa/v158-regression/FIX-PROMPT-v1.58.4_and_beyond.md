# FIX-PROMPT — career-ops-ui · post-v1.58.3 (v1.58.4…v1.58.N)

Comprehensive fix specification distilled from the 2026-05-19 MASTER regression run on **v1.58.3** (see `2026-05-19-MASTER-REGRESSION.md`).
Audience: implementer (Claude Code or a human dev).
**Doctrine — non-negotiable, repeated for clarity:**

> **ONE one-fix ship per release** — bump + CHANGELOG×8 (parity-gated) + a test + Playwright-verify + pre-commit AI-review to LGTM + CI-watch to green. **Never batch. Never `--no-verify`. HIGH → MEDIUM → LOW.** Pre-commit AI review is **advisory**; **`ci.yml` is the hard gate**.

That means every section below = its own version bump and its own PR. No "while we're at it, let's also…". If a section depends on another, link them and ship in order.

---

## §0 — Hard rules / invariants (must hold every release)

1. **No batching.** Each numbered fix below = its own release. `vX.Y.Z` increments by 1.
2. **Parity at every release:**
   `package.json::version` ≡ `package-lock.json` ≡ `/api/health.version` ≡ every `CHANGELOG*.md` top entry ≡ README ×8 `release-vX` badge ≡ README ×8 `tests-N` badge ≡ `CLAUDE.md "currently vX"` ≡ `.claude/PROJECT-CONTEXT.md`.
3. **CI gates** — `npm test`, `npm run test:e2e`, `npm run test:e2e:full`, `npm run test:e2e:browser`, `scripts/check-no-also-leftovers.mjs`, `ci.yml` must finish `success` on Node 18 / 20 / 22 **before tagging**.
4. **8-locale parity** — every user-visible string change ships keys for `en`, `es`, `pt-BR`, `ko`, `ja`, `ru`, `zh-CN`, `zh-TW`. Missing key = blocking. EN fallback is acceptable as a placeholder ONLY with `// TODO i18n` and a follow-up ticket. `tests/i18n-coverage.test.mjs` is the gate.
5. **No parent-project writes from a read path.** Only explicit user POST/PUT/DELETE writes to `data/`, `reports/`, `config/`, `cv.md`, `modes/`. Read-only endpoints (`GET /api/health`, etc.) are pure.
6. **Security invariants** (already enforced; do not weaken):
   - `isValidJobUrl` rejects loopback / `javascript:` / `file:` / script-char URLs.
   - `safeGet` enforces SSRF guards on every URL-fetch path.
   - `UI.md()` is escape-first (XSS boundary). `stripDangerousMarkdown` is the CV ingress. `cleanLlmMarkdown` is a declutter step, NOT a sanitizer.
   - `validateConfig` never echoes a `SECRET_KEYS` value.
7. **`PATHS` resolves once per process.** Path-coupled helpers stay statically guarded — no cache-bust dynamic import.
8. **Doc-comment SemVer** — every commit subject `fix(<area>): <one-line> (NEW-X | M-Y | I-Z | U-W)`.
9. **Pre-commit AI review is advisory** but its LGTM is required before push. `ci.yml` is hard gate.

---

## §1 — Release sequence (one fix per release; HIGH → MEDIUM → LOW)

| Release | Fix | Severity | Class |
|---|---|---|---|
| **v1.58.4** ✅ | NEW-1 — add Content-Security-Policy header *(shipped 2026-05-20: CSP now unconditional, route-walk Playwright test added)* | **Major / stop-ship** | Security invariant |
| **v1.58.5** ✅ | NEW-3 — Follow-up double-POST repro & guard *(shipped 2026-05-20: not-reproducible; locked with Playwright single-POST guard, locale-stable selector, addInitScript lang preset)* | Minor (no code change) | Functional |
| **v1.58.6** ✅ | BUG-008-tb — top-bar Doctor modal title parity *(shipped 2026-05-20: `UI.modal('doctor',…)` → `UI.modal(I18n.t('top.doctor','Doctor'),…)`, 8-locale parity, static guard)* | Minor | i18n / consistency |
| **v1.58.7** ✅ | NEW-2 — isValidJobUrl regex ↔ error-message consistency *(shipped 2026-05-20: Option A — added TEMPLATE_PATTERNS for paired `${…}`/`{{…}}`; ASP/EJS `<%…%>` regression-locked; 2 new url-validation tests; single-brace ATS paths preserved)* | Minor | Security UX |
| **v1.58.8** ✅ | (user-requested feat) — surface OPENAI / QWEN / OPENROUTER API-key rows on `#/health` analogous to `GEMINI_API_KEY` *(shipped 2026-05-20: same `isUsableKey` gate as `/api/status/providers`; SPA Health view iterates `body.checks` → no per-locale strings)* | feat | — |
| **v1.58.9** ✅ | M-1 — global `:focus-visible` ring *(shipped 2026-05-20: form-base `outline: none` was higher specificity than `*:focus-visible`; explicit `.input/.textarea/.select/.searchbar input:focus-visible` rules with 2 px `var(--rausch)` + translucent box-shadow; Playwright Tab-traversal asserts ≥1.5 px outline)* | Major (a11y, WCAG 2.4.7) | a11y |
| **v1.58.10** ✅ | M-2 — drain progress-toast before any result modal *(shipped 2026-05-20: `UI.modal()` now auto-dismisses on entry — defence-in-depth; cv.js sync-check call site localized via `t('cv.syncCheck')` / `t('cv.syncCheckRunning')`; 8-locale i18n parity + static guard)* | Minor | UX |
| **v1.58.11** ✅ | M-4 — Saved-research card title↔date gap *(shipped 2026-05-20: `.saved-card` flex container + `gap: var(--space-2)` + semantic `<time datetime="…">`; pre-fix inline marginLeft removed; static guard locks classes + CSS gap)* | Minor | UX visual |
| **v1.58.12** ✅ | M-7 — Cost line follows `LLM_PROVIDER` *(shipped 2026-05-20: EST adds `openrouter: null` + render branch for null-cost → localized `cost varies (router picks)`; NAME adds `openrouter: 'OpenRouter'`; new `cost.varies` i18n key in all 8 locales; static contract guard locks the EST/NAME/branch shape)* | Major | UX truthfulness |
| **v1.58.13** ✅ | M-8 — Apply checklist becomes interactive *(shipped 2026-05-20: `<input type="checkbox">` per item, `<label>` full-row click target, per-URL `localStorage['applyChecklist:'+slug]`, Copy-unchecked + Reset buttons, 5 new i18n keys × 8 locales, defensive fallback)* | Major | UX promise vs delivery |
| **v1.58.14** ✅ | M-9 — Dashboard/banner `Refresh` feedback toast *(shipped 2026-05-20: synchronous `Refreshing…` toast + sessionStorage bridge to localized `Refreshed` success toast on next boot + disabled-guard against double-clicks; 2 new i18n keys × 8 locales)* | Minor | UX |
| **v1.58.15** ✅ | I-1 — top-bar `aria-label` localized *(shipped 2026-05-20: new generic `data-i18n-aria-label` hook in applyI18n() + 2 new `top.search.aria`/`top.search.label` keys × 8 locales; static guard locks markup, handler, and RU ≠ EN parity)* | Minor | a11y / i18n |
| **v1.58.17** ✅ | I-2 — `today` / `yesterday` / `N days ago` localized via Intl.RelativeTimeFormat *(shipped 2026-05-20: formatRelative() in deep.js now uses Intl.RelativeTimeFormat + numeric:auto; >7 days falls back to Intl.DateTimeFormat dateStyle:medium)* | Minor | i18n |
| **v1.58.18** ✅ | I-3 — Help TOC items 2 / 5 / 13 / 14 localized *(shipped 2026-05-20: docs/help/{ru,ja,ko-KR,zh-CN,zh-TW,es,pt-BR}.md H2s for items 2/5/13/14 rewritten to remove App/settings/Apply/checklist/Portals/Sources/Mode/prompts English bleed; negative-match guard added)* | Minor | i18n |
| **v1.58.18** | I-4 — RU `#/followup` H1 & subtitle (no Latin `cadence`/`follow-up`) | Minor | i18n |
| **v1.58.19** | I-6 — footer hotkey `⌘K` vs `Ctrl+K` per platform | Minor | i18n / platform |
| **v1.58.20** | U-1 — `#/cv` proper H1 + subtitle (kill the lowercase breadcrumb) | Minor | UX (breaks BUG-009 by-design — read §3) |
| **v1.58.21** | U-2 — `#/auto` H1 emoji-wrap | Minor | UX visual |
| **v1.58.22** | U-3 — `#/followup` date placeholder = today − 14 days | Minor | UX |
| **v1.58.23** | U-4 — pipeline-400 toast: detail in `<details>` | Minor | UX |
| **v1.58.24** | U-5 — Dashboard CTA dedupe (4× Pipeline / 4× Scan) | Minor | UX IA |
| **v1.58.25** | U-6 — Scan "✦ Active companies N/M" tooltip | Minor | UX clarity |

> **Note (2026-05-20).** v1.58.8 was claimed by a user-requested feature
> (Health rows for OPENAI / QWEN / OPENROUTER API keys, analogous to
> `GEMINI_API_KEY`). The rest of the original sequence (M-1 → U-15) is
> shifted **+1** above. Subsequent rows beyond this snippet retain the
> same +1 offset (v1.58.25 in the original table is now v1.58.26, etc.).
| **v1.58.25** | U-7 — Verify pipeline ASCII `===` → CSS divider | Minor | UX visual |
| **v1.58.26** | U-8 — Generate prompt collapse-by-default | Minor | UX layout |
| **v1.58.27** | U-9 — Pipeline `In queue: N` chip ↔ filter gap | Minor | UX layout |
| **v1.58.28** | U-10 — Tracker actions disabled at 0 rows | Minor | UX state |
| **v1.58.29** | U-11 — Tracker LEGITIMACY column tooltip | Minor | UX clarity |
| **v1.58.30** | U-12 — Help "Filter sections" placeholder per-locale max-width | Minor | UX i18n |
| **v1.58.31** | U-13 — Toast journal (`Notifications` drawer) | Minor | UX feature |
| **v1.58.32** | U-14 — H1↔subtitle spacing audit | Minor | UX visual |
| **v1.58.33** | U-15 — CV editor dirty-state indicator | Minor | UX state |

**Cross-repo (NOT this repo):**
- **C-1 prompt-layer** — `modes/deep.md` final-form enforcement → parent `santifer/career-ops`.
- **G-005** — A-G → A-F header migration → parent `modes/oferta.md`.
- Stale `portals.yml` lever/workable 404 (`Clarity AI`, `Forto`, `Hugging Face`) — parent project housekeeping.

---

## §2 — Per-fix detailed spec

Format for every entry:
- **WHERE** — file hints (best-known, verify with grep).
- **WHAT** — exact symptom from the regression run.
- **WHY** — impact / spec citation.
- **HOW** — concrete code path, with snippets where it helps.
- **TEST** — what to add to `tests/*`.
- **ACCEPTANCE** — step-by-step manual verification (browser + 8-locale spot-check).
- **CHANGELOG (×8)** — exact line to add per locale.

---

### FIX v1.58.4 · NEW-1 — Content-Security-Policy header (HIGH / Major)

**WHERE.** The HTTP server bootstrap. Likely `web-ui/server.mjs` or `web-ui/server/index.mjs`. Look for where `X-Frame-Options` and `Referrer-Policy` are set — add CSP alongside them.

**WHAT.** Browser-verified on v1.58.3:
- `fetch('/').headers.get('content-security-policy')` → `null`
- `fetch('/api/health').headers.get('content-security-policy')` → `null`
- `document.querySelector('meta[http-equiv="Content-Security-Policy" i]')` → `null` (only `<meta name="viewport">` is present)

Existing positive: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`.

**WHY.** MASTER §5 invariant: *"CSP excludes `'unsafe-inline'`/`'unsafe-eval'`; `frame-ancestors 'none'`."* The current build provides clickjack protection (XFO) and MIME protection (nosniff), but no inline-script / inline-style hardening. `UI.md()`'s escape-first contract is the only XSS defence — defense-in-depth is missing.

**HOW.**
1. In the server (Express-like syntax):
   ```js
   // CSP — keep loose enough for live SPA, tight enough to block XSS escalations
   const CSP = [
     "default-src 'self'",
     "script-src 'self'",
     "style-src 'self' 'unsafe-inline'",        // audit & tighten in v1.58.4.1 if all styles are file-served
     "img-src 'self' data:",
     "font-src 'self' data:",
     "connect-src 'self'",
     "frame-ancestors 'none'",
     "base-uri 'self'",
     "form-action 'self'",
     "object-src 'none'",
   ].join('; ');

   app.use((req, res, next) => {
     res.setHeader('Content-Security-Policy', CSP);
     res.setHeader('X-Content-Type-Options', 'nosniff');
     res.setHeader('X-Frame-Options', 'DENY');
     res.setHeader('Referrer-Policy', 'same-origin');
     next();
   });
   ```
2. If the project uses Helmet — turn the relevant directives on, not the legacy defaults.
3. Audit inline `<script>` and inline `<style>` in the SPA index — if `'unsafe-inline'` for `script-src` is required for a small bootstrap, isolate it behind a hashed inline-script (`'sha256-…'`) instead of a blanket allow.
4. Audit inline `style="…"` — if used, keep `style-src 'unsafe-inline'` for one release, file a follow-up to migrate to classes.
5. Do NOT add `'unsafe-eval'`. If any dependency requires it, that's a separate cleanup (don't bundle in this fix).

**TEST.**
- New file `tests/security-headers.test.mjs`:
  ```js
  import { strict as assert } from 'node:assert';
  import { test } from 'node:test';
  import { fetch } from 'undici';

  test('CSP header present on document root', async () => {
    const r = await fetch('http://127.0.0.1:4317/');
    const csp = r.headers.get('content-security-policy');
    assert(csp, 'CSP header missing on /');
    assert(csp.includes("frame-ancestors 'none'"));
    assert(!csp.includes("'unsafe-inline' script-src") &&
           !/script-src[^;]*'unsafe-inline'/.test(csp),
           "script-src must not allow 'unsafe-inline'");
    assert(!/[^a-z]'unsafe-eval'/.test(csp), "must not allow 'unsafe-eval'");
  });

  test('CSP header present on API responses', async () => {
    const r = await fetch('http://127.0.0.1:4317/api/health');
    assert(r.headers.get('content-security-policy'), 'CSP missing on /api/health');
  });

  test('X-Frame-Options + nosniff still present (regression guard)', async () => {
    const r = await fetch('http://127.0.0.1:4317/');
    assert.equal(r.headers.get('x-frame-options'), 'DENY');
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  });
  ```
- Add an e2e check in `tests/e2e/csp.spec.mjs` that watches `console.error` for `Refused to … because it violates the following Content Security Policy directive` on a representative route walk (Dashboard → Pipeline → CV → Deep → Help → Health → Config) in all 8 locales. **Zero CSP violations expected.**

**ACCEPTANCE.**
1. `npm test` — new tests green.
2. Browser DevTools → Network → reload → every response from `127.0.0.1:4317` has `Content-Security-Policy` header.
3. Walk 22 routes in EN — Console has 0 CSP violation entries.
4. Repeat (3) on RU, JA, zh-TW.
5. Theme toggle, language switch, Run live, Add URL — all functional.
6. Old smoke 20/20 + comprehensive 23/23 still green.

**CHANGELOG (×8 files).** Add the same semantic content; localize the human part. Example RU:
```md
## [1.58.4] - 2026-MM-DD

### Security
- Добавлен заголовок `Content-Security-Policy` на все ответы сервера (`frame-ancestors 'none'`, без `unsafe-inline`/`unsafe-eval` для `script-src`). Закрывает MASTER §5 invariant. (NEW-1)
```

---

### FIX v1.58.5 · NEW-3 — Follow-up double-POST (Major-if-reproducible / Minor otherwise)

**WHERE.** `web-ui/pages/followup.mjs` or wherever the `Run live` handler on `#/followup` is wired. Also the form-element-level `onsubmit` if present.

**WHAT.** In the v1.58.3 regression, with required fields filled and the **date left empty**, a monkey-patched `window.fetch` captured **two identical** POST `/api/mode/followup` requests within ~2 s after a single button click.

**WHY.** Double-fire = duplicated LLM call = doubled cost + race condition on disk write. If it reproduces, this is **stop-ship Major**.

**HOW.**
1. **Repro first** (do not patch blindly):
   - In `#/followup`, open DevTools → Network, filter `mode/followup`.
   - Fill Company `TestCo`, Role `QA`, Notes `note`, leave date empty.
   - Click `Run live` exactly once. Count requests.
   - If 2 → guard. If 1 → mark NEW-3 as **not reproducible** and close the ticket with the repro recipe in the postmortem.
2. **If it repros**, the usual suspect is **both** an `onClick` AND a form `onSubmit` bound (`<button type="submit">` inside `<form>` AND an `addEventListener('click')`). Fix:
   ```js
   // Option A: single source of truth
   form.addEventListener('submit', async (ev) => {
     ev.preventDefault();
     if (submitBtn.disabled) return;
     submitBtn.disabled = true;
     try {
       await runLive(...);
     } finally {
       submitBtn.disabled = false;
     }
   });
   // Make the click → form.requestSubmit() (no parallel click handler)
   ```
3. **Belt-and-suspenders:** a generic in-flight guard in `api.js`:
   ```js
   const inflight = new Map();
   export async function api(path, init) {
     const key = (init?.method || 'GET') + ' ' + path;
     if (inflight.has(key)) return inflight.get(key);
     const p = realFetch(path, init).finally(() => inflight.delete(key));
     inflight.set(key, p);
     return p;
   }
   ```
   This dedupes by key for the duration of the request. Tune the key if any endpoint legitimately needs parallel identical posts (none do for `/api/mode/*`).

**TEST.**
- `tests/e2e/followup-no-double-post.spec.mjs`:
  ```js
  test('Run live posts once per click', async ({ page }) => {
    const calls = [];
    page.on('request', r => { if (r.url().includes('/api/mode/followup') && r.method() === 'POST') calls.push(r); });
    await page.goto('http://127.0.0.1:4317/#/followup');
    await page.fill('[data-test=company]', 'TestCo');
    await page.fill('[data-test=role]', 'QA');
    await page.fill('[data-test=notes]', 'note');
    await page.click('button:has-text("Run live")');
    await page.waitForTimeout(3000);
    expect(calls).toHaveLength(1);
  });
  ```

**ACCEPTANCE.**
1. Fresh page → single click → exactly 1 POST. Run 5×.
2. Repeat with valid ISO date.
3. Repeat in RU.

---

### FIX v1.58.6 · BUG-008-tb — Top-bar Doctor modal title parity (Minor)

**WHERE.** Top-bar component (the global `Doctor` button on every page). The Health-page button is already correct.

**WHAT.** Verified v1.58.3:
- EN top-bar `Doctor` → modal title `doctor` (lowercase). Health-page `Run doctor` → modal title `Run doctor` ✓.
- RU top-bar `Диагностика` → modal title `doctor` (English). Health-page `Запустить doctor` → modal title `Запустить doctor` ✓.

**WHY.** Ledger row BUG-008 says *"modal title == localized button label"*. Health passes; top-bar entry-point does NOT. One entry path violates the invariant.

**HOW.**
1. The two buttons call the same backend script but pass different modal-title props. Audit the call sites:
   - Top-bar button calls `openModal({ title: 'doctor', ... })` — wire it to `openModal({ title: i18n.t('topbar.doctor.label'), ... })` where `topbar.doctor.label === buttonLabel`.
   - Easiest: make `openCliModal(cliName)` look up the title via `i18n.t('cli.' + cliName + '.modalTitle')` and provide one canonical key per CLI per locale.
2. i18n keys (per locale):
   - `cli.doctor.modalTitle = "Doctor"` (EN), `"Диагностика"` (RU), `"診断"` (JA), `"診斷"` (zh-TW), `"진단"` (KO), `"Diagnóstico"` (ES, pt-BR), `"诊断"` (zh-CN).
   - `cli.verifyPipeline.modalTitle`, `cli.syncCheck.modalTitle` analogously.

**TEST.** Snapshot of modal title for each (button-entrypoint × locale) combination — assert title equals the visible button label.

**ACCEPTANCE.** Click top-bar `Doctor` on EN/RU/JA/zh-TW → modal title matches the button. Same for Verify pipeline and sync-check entry-points.

---

### FIX v1.58.7 · NEW-2 — `isValidJobUrl` regex ↔ error-message consistency (Minor)

**WHERE.** `web-ui/lib/url-validation.mjs` (or wherever `isValidJobUrl` lives) + `i18n/*/pipeline.json`.

**WHAT.** Verified v1.58.3:
| Input | Result | Comment |
|---|---|---|
| `https://example.com/<%TEST%>` | 400 | ASP-style — blocked ✓ |
| `https://example.com/${TEST}` | 200 | JS template literal — accepted ⚠️ |
| `https://example.com/{{TEST}}` | 200 | Mustache/Handlebars — accepted ⚠️ |
| `https://example.com/job/{normal}` | 200 | single brace — accepted (legit ATS pattern) |

Error message: *"contain no script or template characters"* — but template syntaxes pass.

**WHY.** Two valid fixes:
- **A. Tighten** the regex to match the message.
- **B. Loosen** the message to match reality.

Recommend **A** (semantic consistency + slight security upgrade against URL-templating injections).

**HOW (option A).**
```js
const TEMPLATE_PATTERNS = [
  /<%/, /%>/,            // ASP / EJS — already blocked
  /\$\{/, /\}/,          // JS template literal
  /\{\{/, /\}\}/,        // Mustache / Handlebars
];
function hasTemplateChars(url) {
  return TEMPLATE_PATTERNS.some(re => re.test(url));
}
```
Beware: blocking `}` alone is too aggressive (it appears in legitimate URLs occasionally). Block only PAIRS — `${...}`, `{{...}}`, `<%...%>`. Refine:
```js
const TEMPLATE_PATTERNS = [
  /\$\{[^}]*\}/,
  /\{\{[^}]*\}\}/,
  /<%[^>]*%>/,
];
```

**TEST.** Extend `tests/url-validation.test.mjs`:
```js
const REJECTS = [
  'javascript:alert(1)',
  'file:///etc/passwd',
  'http://localhost/x',
  'http://127.0.0.1/y',
  'not-a-url',
  'https://example.com/<script>',
  'https://example.com/<%T%>',
  'https://example.com/${T}',     // NEW
  'https://example.com/{{T}}',    // NEW
];
const ACCEPTS = [
  'https://example.com/job/123',
  'https://example.com/job/{normal}',          // single brace ok
  'https://boards.greenhouse.io/anthropic/jobs/4567',
];
for (const u of REJECTS) assert.equal(isValidJobUrl(u), false, u);
for (const u of ACCEPTS) assert.equal(isValidJobUrl(u), true, u);
```

**ACCEPTANCE.** `+ Add` each REJECTS case → human toast + HTTP 400. Each ACCEPTS case → green "Added".

---

### FIX v1.58.8 · M-1 — Global `:focus-visible` ring (HIGH / a11y — WCAG 2.4.7)

**WHERE.** Base stylesheet — `web-ui/css/base.css` or `web-ui/styles/_base.scss`.

**WHAT.** `getComputedStyle(focusedButton)` on v1.58.3 → `outline: rgb(255,255,255) none 1.5px`, `box-shadow: none`. The `none` keyword zeroes the ring. Tab through any page → invisible focus on 88 focusable elements.

**WHY.** WCAG 2.1 SC **2.4.7 Focus Visible** is **Level AA mandatory**. Failing this is the most common single source of a11y audit fails.

**HOW.**
```css
/* in :root */
:root {
  --ring: #2563eb;
  --ring-offset: 2px;
  --ring-radius: 6px;
}
[data-theme="dark"] :root, [data-theme="dark"] {
  --ring: #93c5fd;
}

/* kill any 'outline: none' in component styles by escalating */
*:focus { outline: none; }      /* mouse / pointer focus stays clean */

*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: var(--ring-offset);
  border-radius: var(--ring-radius);
}

/* tighter for inputs that already have a border */
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline-offset: 0;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 35%, transparent);
}

/* For badge-style chips */
.chip:focus-visible,
.pill:focus-visible {
  outline-offset: 3px;
}
```

**TEST.** `tests/e2e/focus-visible.spec.mjs`:
```js
test('Tab traversal reveals a visible focus ring', async ({ page }) => {
  await page.goto('http://127.0.0.1:4317/#/dashboard');
  await page.keyboard.press('Tab');     // skip-link
  await page.keyboard.press('Tab');     // first sidebar item
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outline);
  expect(outline).not.toBe('none');
  expect(outline).toMatch(/(solid|inset|outset)/);
});
```

**ACCEPTANCE.** Tab from the Skip link through all sidebar items + top-bar + every form field on Dashboard / Scan / Pipeline / Deep / CV / Config / Help — every focused element shows a 2 px solid ring. Repeat in dark theme.

---

### FIX v1.58.9 · M-2 — Drain progress-toast before any result modal (Minor)

**WHERE.** Toast manager (`web-ui/lib/toast.mjs` or similar). Modal manager (`web-ui/lib/modal.mjs`).

**WHAT.** v1.58.3 reproduce: click `sync-check` on `#/cv` → modal opens AND the "Running cv-sync-check.mjs…" toast remains visible bottom-right. Same pattern partially existed on Doctor (already fixed). Need to apply uniformly.

**HOW.**
1. Tag every progress toast:
   ```js
   toast.progress(msg) {
     return toast.show({ kind: 'progress', message: msg });
   }
   ```
2. When any modal opens, dismiss every `progress` toast:
   ```js
   modal.show(opts) {
     toast.dismissAll({ kind: 'progress' });
     // ...
   }
   ```
3. Optionally chain via the runner helper:
   ```js
   async function runWithModal(script, modalOpts) {
     const t = toast.progress(`Running ${script}…`);
     try {
       const out = await runScript(script);
       modal.show({ ...modalOpts, body: out });
     } finally {
       toast.dismiss(t);
     }
   }
   ```

**TEST.** `tests/e2e/progress-toast-drains.spec.mjs`:
```js
for (const trigger of [
  { route: '/health', sel: 'button:has-text("Run doctor")' },
  { route: '/health', sel: 'button:has-text("Verify pipeline")' },
  { route: '/cv',     sel: 'button:has-text("sync-check")' },
]) {
  test(`progress toast drains for ${trigger.sel}`, async ({ page }) => {
    await page.goto('http://127.0.0.1:4317/#' + trigger.route);
    await page.click(trigger.sel);
    await page.waitForSelector('.modal[open], dialog[open], [aria-modal=true]');
    const visible = await page.$$eval('.toast', els =>
      els.filter(e => getComputedStyle(e).opacity !== '0' && e.offsetParent !== null).length
    );
    expect(visible).toBe(0);
  });
}
```

**ACCEPTANCE.** Click Doctor / Verify pipeline / sync-check / Normalize / Dedup / Merge TSV — none leak a "Running …" toast while their result modal/dialog is open.

---

### FIX v1.58.10 · M-4 — Saved-research card title↔date gap (Minor)

**WHERE.** `web-ui/components/saved-research-card.html` (or template).

**WHAT.** v1.58.3 verified: `software-engineer-generaltoday` (no space). `story-bank today` is fine because of an older partial fix. Inconsistent.

**HOW.**
```html
<button class="saved-card" type="button">
  <span class="saved-card__title">{{name}}</span>
  <time class="saved-card__date" datetime="{{iso}}">{{relTime}}</time>
</button>
```
```css
.saved-card { display: inline-flex; align-items: baseline; gap: .5rem; padding: .35rem .75rem; }
.saved-card__title { font-weight: 500; }
.saved-card__date { color: var(--muted); font-size: .85em; }
```
Avoid concatenating strings in the renderer; let CSS `gap` handle the spacing.

**TEST.** Add a snapshot test in `tests/components/saved-research-card.test.mjs` asserting that title and date are separate child elements with `gap: .5rem`. Lint: no `${name}${date}` concatenation in templates.

**ACCEPTANCE.** Open `#/deep` → every saved card has a visible gap (≥ 6 px) between title and date pill. Same on `#/interview-prep`, `#/training`, anywhere else that lists saved files.

---

### FIX v1.58.11 · M-7 — Cost line follows `LLM_PROVIDER` (Major UX)

**WHERE.** Every advisor page (`#/auto`, `#/deep`, `#/project`, `#/training`, `#/patterns`, `#/followup`, `#/interview-prep`, `#/evaluate`). A shared `<cost-estimate>` partial.

**WHAT.** v1.58.3: every page shows `Estimated cost: Anthropic claude-sonnet-4-6 · ~$0.05/eval`. Switching `LLM_PROVIDER` to `gemini`/`openai`/`qwen`/`openrouter` does NOT update the line.

**HOW.**
1. Server endpoint `GET /api/config/active-provider`:
   ```json
   { "provider": "claude", "model": "claude-sonnet-4-6", "costPerEvalUsd": 0.05, "currency": "USD" }
   ```
   Resolution order: explicit env `LLM_PROVIDER` → first set API key (claude→gemini→openai→qwen→openrouter) → `manual`.
2. Provider→model→cost map (server-side):
   ```js
   const COSTS = {
     claude:    { model: 'claude-sonnet-4-6', costPerEvalUsd: 0.05 },
     gemini:    { model: 'gemini-2.0-flash',  costPerEvalUsd: 0.01 },
     openai:    { model: 'gpt-5-codex',       costPerEvalUsd: 0.08 },
     qwen:      { model: 'qwen3-coder-plus',  costPerEvalUsd: 0.03 },
     openrouter:{ model: '<router-picks>',    costPerEvalUsd: null },
     manual:    { model: 'manual-prompt',     costPerEvalUsd: 0 },
   };
   ```
3. Client `<cost-estimate>`:
   ```js
   const { provider, model, costPerEvalUsd } = await api('/api/config/active-provider');
   const cost = costPerEvalUsd == null ? i18n.t('cost.varies') : `~$${costPerEvalUsd.toFixed(2)}/eval`;
   el.textContent = i18n.t('cost.estimated', { provider, model, cost });
   ```
4. i18n keys: `cost.estimated = "Estimated cost: {provider} {model} · {cost}"`, `cost.varies = "varies"`. Localize for 8.

**TEST.** Unit on server: `getActiveProvider({ env: { LLM_PROVIDER: 'gemini' } })` → `provider === 'gemini'`. E2E: set provider to gemini in `#/config` → reload `#/deep` → cost-line text contains `gemini`.

**ACCEPTANCE.** Cost line updates within one page reload after a provider change. Manual provider → cost shows `$0` or hides the line. Localized in 8.

---

### FIX v1.58.12 · M-8 — Apply checklist becomes interactive (Major UX)

**WHERE.** `web-ui/pages/apply.mjs` and `#/apply` template.

**WHAT.** v1.58.3: clicking `Generate checklist` renders a monospace block with items `0…7`. They are plain text; user cannot tick anything.

**HOW.**
1. Render each item as a checkbox:
   ```html
   <ul class="apply-checklist" data-url-slug="{{slug}}">
     {{#each items}}
     <li>
       <label>
         <input type="checkbox" data-item-index="{{@index}}">
         <span>{{this}}</span>
       </label>
     </li>
     {{/each}}
   </ul>
   <div class="apply-checklist__actions">
     <button type="button" data-action="copy-unchecked">{{ t('apply.checklist.copy_unchecked') }}</button>
     <button type="button" data-action="reset">{{ t('apply.checklist.reset') }}</button>
   </div>
   ```
2. Persist via `localStorage['applyChecklist:' + slug] = JSON.stringify([true,false,...])`.
3. Wire `copy-unchecked` to copy the markdown of items where state is `false`.
4. i18n: `apply.checklist.reset`, `apply.checklist.copy_unchecked`, `apply.checklist.item.0..7` — 10 keys × 8 locales.

**TEST.** Playwright: tick 3 of 8 → reload → 3 still ticked. Click Reset → all unticked. Click Copy unchecked → clipboard contains markdown bullets matching the visible unchecked items.

**ACCEPTANCE.** Above plus visual: checkboxes have visible focus ring (after M-1), labels click area covers full row.

---

### FIX v1.58.13 · M-9 — Dashboard `Refresh` feedback toast (Minor)

**WHERE.** Dashboard refresh handler.

**WHAT.** v1.58.3: click `Refresh` → silence. User can't tell if anything happened.

**HOW.**
```js
async function onRefresh() {
  const before = snapshotCounters();
  await refetch();
  const after = snapshotCounters();
  toast.success(i18n.t('dashboard.refreshed', after));
}
```
i18n key: `dashboard.refreshed = "Refreshed · {applications} applications · {pipeline} pending · {reports} reports"`.

**TEST.** Playwright: click Refresh → expect toast with text containing the localized "Refreshed".

**ACCEPTANCE.** Above + the toast does not stack on rapid clicks (debounce or replace).

---

### FIX v1.58.14 · I-1 — Top-bar `aria-label` localized (a11y / i18n)

**WHERE.** Top-bar search input.

**WHAT.** v1.58.3: every locale shows `aria-label="Search companies, roles, or URLs"`.

**HOW.** In the template:
```html
<input type="text" aria-label="{{ t('search.aria_label') }}" placeholder="{{ t('search.placeholder') }}">
```
Keys: `search.aria_label`, `search.placeholder` × 8.

**TEST.** `tests/i18n-coverage.test.mjs` already enforces parity; add a specific assertion: `expect(localized('search.aria_label', 'ru')).not.toEqual(localized('search.aria_label', 'en'))` for translated locales.

---

### FIX v1.58.15 · I-2 — Relative-time labels localized (i18n)

**WHERE.** Wherever Saved-research / Activity / Tracker / Pipeline cards render dates.

**WHAT.** `today` chip is English on every locale.

**HOW.**
```js
function relTime(date, locale) {
  const ms = +date - Date.now();
  const days = Math.round(ms / 86400000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (Math.abs(days) < 7) return rtf.format(days, 'day');
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}
```
`Intl.RelativeTimeFormat` handles `today` / `yesterday` / `N days ago` per locale natively.

**TEST.** Unit: `relTime(today, 'ru') === 'сегодня'`; `relTime(yesterday, 'ja') === '昨日'`; `relTime(today, 'zh-TW') === '今天'`.

---

### FIX v1.58.16 · I-3 — Help TOC items 2 / 5 / 13 / 14 (i18n)

**WHERE.** `web-ui/help/help.md` is the source — or the i18n-templated equivalent.

**WHAT.** v1.58.3 verified on ja/zh-TW/ru:
- Item 2 `App settings & API keys` / `2. App settings 與 API 金鑰` / `App settings 與 API 金鑰` — still partially EN.
- Item 5 `Portals & Sources` — partial EN.
- Item 13 `Mode prompts` / `Mode 提示` — partial EN.
- Item 14 `Apply checklist` — EN.

**HOW.** Add explicit i18n keys: `help.toc.item.2..14` per locale, replace literal MD with templated tokens, build at server.

**TEST.** Snapshot — none of the 8 TOC outputs contains Latin words for non-Latin locales (negative-match: `text.match(/\b(App|settings|Apply|checklist|Portals|Sources|Mode|prompts)\b/) === null` on ru/ja/ko/zh-CN/zh-TW).

---

### FIX v1.58.17 · I-4 — RU `#/followup` (no Latin `cadence`/`follow-up`)

**WHERE.** `i18n/ru/followup.json` and the page template (in case of hardcoded strings).

**WHAT.** v1.58.3 RU: H1 `Советник по cadence follow-up`; subtitle `ISO-дата (YYYY-MM-DD) — основа для cadence.`.

**HOW.** Translate:
- H1: `Советник по ритму касаний`
- Subtitle: `ISO-дата (ГГГГ-ММ-ДД) — основа для расчёта ритма.`

Audit other locales for `cadence` / `follow-up` leakage (ja: `フォローアップ` is fine as it's a katakana-loan; es: `cadencia` is fine). Run grep `cadence|follow-up` across all non-EN locale files.

**TEST.** `tests/i18n-no-latin-leaks.test.mjs` — for each non-Latin locale (ru/ja/ko/zh-CN/zh-TW), any user-visible string must not contain ≥ 4 consecutive ASCII letters (with a small whitelist for proper nouns).

---

### FIX v1.58.18 · I-6 — Platform-aware `⌘K` / `Ctrl+K` (i18n / platform)

**WHERE.** Footer hint + top-bar `<kbd>` chip.

**WHAT.** Mac: top-bar correctly shows `⌘K`. Footer hint shows `CTRL+K — search` (wrong combo for Mac, EN-only word "search" on locales that translated it).

**HOW.**
```js
const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || '');
const hotkey = isMac ? '⌘K' : 'Ctrl+K';
footerEl.textContent = i18n.t('search.hotkey_hint', { hotkey });
// key: search.hotkey_hint = "{hotkey} — search" / "{hotkey} — поиск" / ...
```

**TEST.** UA-stub test: macOS UA → `⌘K`; Windows UA → `Ctrl+K`; both wrap the localized verb.

---

### FIX v1.58.19 · U-1 — `#/cv` proper H1 + subtitle (Minor — supersedes BUG-009 by-design)

**WHERE.** `web-ui/pages/cv.mjs` + breadcrumb component.

**WHAT.** v1.58.3: `#/cv` H1 is the lowercase grey breadcrumb chip `cv`. By-design per ledger row BUG-009 (single `<h1>` policy + breadcrumb chip). Visually inconsistent with all other pages.

**WHY revisit?** Single-H1 policy is sound, but the breadcrumb chip styled as "cv lowercase" reads as a layout bug. Resolve by: keep one `<h1>`, but **promote it** to look like every other page.

**HOW.**
```html
<header class="page-header">
  <h1 class="page-title">{{ t('cv.title') }}</h1>           <!-- e.g. "Curriculum vitae" -->
  <p class="page-subtitle">{{ t('cv.subtitle') }}</p>       <!-- "Edit cv.md side-by-side with a live preview." -->
</header>
<div class="page-actions">
  <button>Upload CV</button>
  <button>sync-check</button>
  <button>Generate PDF</button>
  <button class="btn-primary">Save</button>
</div>
```
Drop the breadcrumb chip. Update `tests/single-h1.test.mjs` baseline (still single `<h1>` per page; what changes is its styling and content).

**TEST.** Single-H1 invariant still holds. Visual snapshot of `#/cv` shows the same H1 style as `#/dashboard`, `#/help`, etc.

---

### FIX v1.58.20 · U-2 — `#/auto` H1 emoji-wrap (Minor visual)

**WHERE.** `#/auto` page header.

**WHAT.** `✨ Auto-pipeline a URL` wraps to 2 lines at common widths (1280–1600 px) because of the leading emoji.

**HOW.** Promote the emoji to a 24×24 `<svg>` or `<span aria-hidden="true">` next to the title, not inside it:
```html
<header class="page-header">
  <span class="page-icon" aria-hidden="true">✨</span>
  <h1 class="page-title">{{ t('auto.title') }}</h1>
  <p class="page-subtitle">{{ t('auto.subtitle') }}</p>
</header>
```
```css
.page-header { display: grid; grid-template-columns: auto 1fr; column-gap: .75rem; align-items: baseline; }
.page-icon { font-size: 1.25em; line-height: 1; }
```

**TEST.** Snapshot: at width 1280 px, `#/auto` H1 lays out on a single line.

---

### FIX v1.58.21 · U-3 — `#/followup` date placeholder = today − 14 days (Minor)

**WHERE.** `#/followup` template.

**WHAT.** Placeholder frozen `2026-04-21`.

**HOW.**
```js
const today = new Date();
const ago = new Date(today); ago.setDate(today.getDate() - 14);
const placeholder = ago.toISOString().slice(0, 10);
dateInput.placeholder = placeholder;
```

**TEST.** Mock `Date.now()` to a known moment, assert placeholder == that day − 14.

---

### FIX v1.58.22 · U-4 — pipeline-400 toast detail in `<details>` (Minor)

**WHERE.** `web-ui/lib/toast.mjs` or wherever 400 messages are formatted.

**WHAT.** Current toast: `That doesn't look like a valid job posting URL — it must start with http:// or https:// and contain no script or template characters. (POST /api/pipeline · HTTP 400)`. The technical postfix is a feature per BUG-006 but reads as leakage.

**HOW.**
```js
toast.error(i18n.t('pipeline.invalid_url'), {
  details: `(POST ${path} · HTTP ${status})`,
});
```
Render:
```html
<div class="toast toast--error">
  <p>{{message}}</p>
  <details><summary>{{ t('toast.details') }}</summary><code>{{details}}</code></details>
</div>
```

**TEST.** Click `+ Add` with `not-a-url` → toast main text contains the human sentence; `<details>` is closed; expanding it shows the endpoint+status. Add a regression test: the technical detail must still be present in the DOM (BUG-006 invariant).

---

### FIX v1.58.23 · U-5 — Dashboard CTA dedupe (Minor UX IA)

**WHERE.** `web-ui/pages/dashboard.mjs`.

**WHAT.** 4 routes to Pipeline (Open Pipeline / sidebar / Quick action `📥 Pipeline` / bottom card). Same for Scan. Plus `Auto-pipeline a URL` ≡ `Scan now` overlap.

**HOW.** Reduce to one canonical primary + sidebar:
- Hero pair: **Auto-pipeline a URL** (primary) + **Scan now** (secondary). Keep.
- Quick actions row: keep `Pipeline`, `Evaluate a JD`, `Tracker`, `Reports`. Remove `Scan all sources` (duplicates Scan now).
- Remove `📋 Open Pipeline` button at the top-right (sidebar already takes you there).

**TEST.** Snapshot Dashboard — count of unique `href`s ≤ 8 (currently 14).

---

### FIX v1.58.24 · U-6 — Scan "✦ Active companies N/M" tooltip (Minor)

**WHERE.** `#/scan` status chip.

**WHAT.** `✦ Active companies 96/80` — unclear what 96/80 means.

**HOW.**
```html
<span class="chip" title="{{ t('scan.active_companies.help', { active, total }) }}">
  ✦ {{ t('scan.active_companies', { active, total }) }}
</span>
```
Key body: `"Active: companies currently scanned. Total: configured in portals.yml."`.

**TEST.** Hover-to-tooltip shows localized help. Tab focuses the chip and reads aria-describedby.

---

### FIX v1.58.25 · U-7 — Verify pipeline ASCII `===` → CSS divider (Minor visual)

**WHERE.** Verify pipeline modal renderer.

**WHAT.** Monospace body contains `==================================================` divider.

**HOW.** Strip equals-lines server-side OR in the renderer:
```js
body = body.replace(/^[=]{10,}$/gm, '');
```
Replace with `<hr class="modal-divider">` if the layout needs visual separation.

**TEST.** Snapshot: modal body does not contain `==========` (≥10 equals).

---

### FIX v1.58.26 · U-8 — Generate prompt collapse-by-default (Minor)

**WHERE.** Generate prompt component (Project / Training / Patterns / Followup / Interview prep) + Copy prompt (Deep).

**WHAT.** Inline prompt block occupies 1200+ px after click.

**HOW.**
```html
<details class="prompt-block">
  <summary>{{ t('prompt.show_prompt') }} ({{ lineCount }} lines)</summary>
  <pre><code>{{prompt}}</code></pre>
  <button data-action="copy">{{ t('prompt.copy') }}</button>
</details>
```
Default closed.

**TEST.** After click, the block is collapsed; opening it reveals the prompt; `Copy to clipboard` copies the full text.

---

### FIX v1.58.27 · U-9 — Pipeline `In queue: N` chip ↔ filter gap (Minor)

**WHERE.** `#/pipeline` controls row.

**HOW.** CSS gap:
```css
.pipeline-controls { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
@media (max-width: 720px) {
  .pipeline-controls { flex-direction: column; align-items: stretch; }
}
```

---

### FIX v1.58.28 · U-10 — Tracker actions disabled at 0 rows (Minor)

**WHERE.** `#/tracker` page header.

**WHAT.** `Normalize / Dedup / Merge TSV` clickable when `0 entries in data/applications.md`.

**HOW.**
```js
const empty = entries.length === 0;
for (const btn of [normalizeBtn, dedupBtn, mergeBtn]) {
  btn.disabled = empty;
  btn.title = empty ? i18n.t('tracker.actions.empty_help', { action: btn.dataset.action }) : '';
}
```

**TEST.** Empty tracker → buttons `disabled=true`. After adding a row → buttons enabled.

---

### FIX v1.58.29 · U-11 — Tracker LEGITIMACY tooltip (Minor)

**WHERE.** `#/tracker` table header.

**HOW.**
```html
<th aria-describedby="legitimacy-help">{{ t('tracker.col.legitimacy') }}
  <span class="info-icon" id="legitimacy-help" tabindex="0" aria-label="{{ t('tracker.col.legitimacy.help') }}">ⓘ</span>
</th>
```
Key body: *"Confidence that the posting is real (High / Caution / Suspicious)."*

---

### FIX v1.58.30 · U-12 — Help "Filter sections" placeholder fits on KO / JA (Minor)

**WHERE.** Help page filter input.

**WHAT.** `섹션 필터` / `セクションをフィルター` are 5–10% wider than EN; layout doesn't break but feels tight.

**HOW.** Either shorten the placeholder (`Filter…` / `필터…` / `フィルター…`) or grow the input min-width to fit longest localized placeholder + buffer:
```css
.help-toc__filter { min-width: 16ch; }
```

---

### FIX v1.58.31 · U-13 — Toast journal (Notifications drawer) (Minor)

**WHERE.** New component `web-ui/components/notifications-drawer.mjs`.

**HOW.**
1. Capture every toast into `toast.history` (cap 50).
2. Top-bar bell icon (`🔔`) with badge for unread count.
3. Drawer (right-slide) listing entries: timestamp, kind (success/info/error), localized message.

**TEST.** Click 3 toasts → bell shows `3`; open drawer → 3 entries with timestamps. Reload preserves journal? Decide: probably not (volatile). Document either way.

---

### FIX v1.58.32 · U-14 — H1↔subtitle spacing audit (Minor)

**WHERE.** Global stylesheet for `.page-header`.

**HOW.**
```css
.page-header h1 + p,
.page-header .page-title + .page-subtitle {
  margin-block-start: .35rem;
  color: var(--muted);
}
```
Run on all 22 routes after applying. Visual diff: snapshot before/after.

---

### FIX v1.58.33 · U-15 — CV editor dirty-state indicator (Minor)

**WHERE.** `#/cv` editor.

**HOW.**
```js
const initial = editor.value;
editor.addEventListener('input', () => {
  const dirty = editor.value !== initial;
  saveBtn.classList.toggle('btn-dirty', dirty);
  saveBtn.title = dirty ? i18n.t('cv.unsaved_changes') : '';
});
saveBtn.addEventListener('click', async () => {
  await save();
  initial = editor.value;
  saveBtn.classList.remove('btn-dirty');
});
```
```css
.btn-dirty { position: relative; }
.btn-dirty::after { content: ''; position: absolute; top: 4px; right: 4px; width: 8px; height: 8px; border-radius: 50%; background: var(--warn, #f59e0b); }
```

---

## §3 — Universal acceptance protocol (run per release)

Before tagging `vX.Y.Z`:

1. **Build & boot**
   ```bash
   npm ci
   npm run build       # if applicable
   node web-ui/server.mjs
   ```
2. **Tests**
   ```bash
   npm test
   npm run test:e2e
   npm run test:e2e:full
   npm run test:e2e:browser
   node scripts/check-no-also-leftovers.mjs
   ```
   All MUST be green on Node 18, 20, 22.
3. **CI / Release / AI-Review / Publish** — all `success` for `vX.Y.Z`.
4. **Browser smoke** (in order, EN locale, light + dark theme):
   - Dashboard renders, 0 console errors.
   - Sidebar navigates to all 22 routes; each shows H1 + subtitle (CV is the deliberate exception until v1.58.19).
   - Top-bar Doctor / Quick scan / theme toggle work.
   - Pipeline: + Add (valid + invalid + dup) — all toasts present & accurate.
   - Followup: junk date blocked + ISO accepted.
   - Health: Run doctor → modal → close cleanly.
   - Deep: open existing saved card — no `<tool_call>`/`</tool_response>` literals.
   - Reports: empty state with subtitle.
   - Activity: filters work, table renders.
   - CV: editor + preview side-by-side, sync-check, Save.
5. **8-locale spot-check** (the specific fix you shipped):
   - The new/changed string is correct in every locale.
   - `<html lang>` matches.
   - `tests/i18n-coverage.test.mjs` green.
6. **Security headers** — CSP present + XFO + nosniff + Referrer-Policy (after v1.58.4).
7. **Cleanup**
   - Wipe test entries from `data/pipeline.md` introduced during regression (see MASTER §8).
8. **Tag & push**
   ```bash
   git add -A
   git commit -m "fix(area): <one-line> (NEW-X)"
   git tag vX.Y.Z
   git push origin main vX.Y.Z
   ```
9. **Watch CI** → must end `success` for the tag.

---

## §4 — Tests catalogue (cumulative, one file per concern)

By the end of this fix-block, the test tree should include:
- `tests/security-headers.test.mjs` (v1.58.4)
- `tests/e2e/csp.spec.mjs` (v1.58.4)
- `tests/e2e/followup-no-double-post.spec.mjs` (v1.58.5)
- `tests/i18n-modal-title-parity.test.mjs` (v1.58.6)
- `tests/url-validation.test.mjs` (extended v1.58.7)
- `tests/e2e/focus-visible.spec.mjs` (v1.58.8)
- `tests/e2e/progress-toast-drains.spec.mjs` (v1.58.9)
- `tests/components/saved-research-card.test.mjs` (v1.58.10)
- `tests/cost-line.test.mjs` (v1.58.11)
- `tests/e2e/apply-checklist-interactive.spec.mjs` (v1.58.12)
- `tests/e2e/dashboard-refresh-toast.spec.mjs` (v1.58.13)
- `tests/i18n-no-latin-leaks.test.mjs` (v1.58.14, 16, 17)
- `tests/rel-time.test.mjs` (v1.58.15)
- `tests/help-toc-parity.test.mjs` (v1.58.16)
- `tests/hotkey-platform.test.mjs` (v1.58.18)
- `tests/single-h1.test.mjs` (updated v1.58.19)
- `tests/e2e/dashboard-cta-dedupe.spec.mjs` (v1.58.23)
- `tests/e2e/tracker-actions-disabled-empty.spec.mjs` (v1.58.28)
- `tests/cv-dirty-state.test.mjs` (v1.58.33)

---

## §5 — Locale matrix (every release runs this)

For every fix, the operator confirms behaviour on **all 8 locales** for the page(s) touched:

| Locale | BCP-47 | Verify route(s) |
|---|---|---|
| English | `en` | the page touched by the fix |
| Spanish | `es` | same |
| Portuguese (Brazil) | `pt-BR` | same |
| Korean | `ko` | same |
| Japanese | `ja` | same |
| Russian | `ru` | same |
| Simplified Chinese | `zh-CN` | same |
| Traditional Chinese | `zh-TW` | same |

For each: `<html lang>` updates, `document.title` localizes, sidebar item highlights, 0 console errors, the changed string is correct, no Latin leak in non-Latin locales.

---

## §6 — Sign-off — after the LAST release in the chain

| Gate | Result |
|---|---|
| Every fix above shipped as its own version | ☐ |
| Parity matrix at vX.Y.Z (last shipped) | ☐ |
| `npm test` ≥ 900 + new tests green | ☐ |
| `npm run test:e2e` 20/20 | ☐ |
| `npm run test:e2e:full` 23/23 | ☐ |
| `npm run test:e2e:browser` 58/58 | ☐ |
| `scripts/check-no-also-leftovers.mjs` ✓ | ☐ |
| CI Node 18/20/22 `success` for every tag in the chain | ☐ |
| MASTER REGRESSION rerun (`qa/REGRESSION-FINAL.md` umbrella) — green | ☐ |
| Security invariants (§0.6) unchanged | ☐ |
| `data/pipeline.md` cleared of test fixtures | ☐ |

---

## §7 — Out of scope (defer to v1.59 / cross-repo)

- **C-1 prompt-layer** — `modes/deep.md` final-form enforcement → parent project `santifer/career-ops`. This repo's stripper (FIX-C1 stripper-layer) already strips orphan tags; the prompt-layer is the parent's job.
- **G-005** — A-G→A-F header migration → parent `modes/oferta.md`.
- **CLI-locale** — `career-ops doctor` / `verify-pipeline.mjs` / `cv-sync-check.mjs` stdout localization is deferred. Only the modal **chrome** localizes (see v1.58.6 + queued ticket).
- **Mobile (≤ 420 px) deep audit** — the resize harness in this regression session was constrained; a dedicated mobile pass is needed before any mobile-first claims.
- **Drag-and-drop reordering** on Pipeline / Tracker.
- **Bulk multi-select + delete** on Pipeline / Tracker.
- **RTL** (Arabic / Hebrew) — `dir` attribute is set but no full audit.
- **Stale portals** (`Clarity AI`/`Forto`/`Hugging Face`) — parent `portals.yml` housekeeping.

---

## §8 — Commit hygiene (per release)

- One PR per release. Single subject:
  `fix(<area>): <one-line> (NEW-1 | M-N | I-N | U-N | BUG-008-tb)`
- Commit body cross-references this file:
  > Closes FIX v1.58.X (per `FIX-PROMPT-v1.58.4_and_beyond.md` §1).
- `CHANGELOG.md` ×8 — every locale updated under `## [Unreleased]` then promoted to `## [1.58.X]` on tag.
- Tag `v1.58.X` on `origin/main` only after CI ends `success`.
- AI-review LGTM **before** push (advisory). `ci.yml` is the hard gate.

---

## §9 — Test artefacts to clean

After v1.58.4 (CSP) lands, wipe regression artefacts:
```bash
# data/pipeline.md
grep -v -E '(example\.com/job/123|example\.com/regression|example\.com/\$\{|example\.com/\{\{|example\.com/job/\{normal\})' \
  data/pipeline.md > data/pipeline.md.tmp && mv data/pipeline.md.tmp data/pipeline.md
```
Keep `reports/software-engineer-general.md` as a snapshot for the C-1 prompt-layer test (cross-repo).

---

## §10 — Quick reference / cheat sheet

```text
HIGH
  v1.58.4  · NEW-1 CSP header                       (Security § stop-ship)
  v1.58.5  · NEW-3 Followup double-POST              (Functional · Major if repros)
  v1.58.8  · M-1   Focus-ring                        (a11y · WCAG 2.4.7)
  v1.58.11 · M-7   Cost line follows LLM_PROVIDER    (UX truthfulness)
  v1.58.12 · M-8   Apply checklist interactive       (UX promise)

MEDIUM
  v1.58.6  · BUG-008-tb top-bar Doctor parity
  v1.58.7  · NEW-2 isValidJobUrl ↔ message
  v1.58.9  · M-2   Progress toast drains
  v1.58.10 · M-4   Saved-card gap
  v1.58.13 · M-9   Dashboard Refresh feedback
  v1.58.14 · I-1   aria-label localized
  v1.58.15 · I-2   today rel-time
  v1.58.16 · I-3   Help TOC items 2/5/13/14
  v1.58.17 · I-4   RU cadence/follow-up
  v1.58.18 · I-6   ⌘K / Ctrl+K platform

LOW (UX-debt)
  v1.58.19 · U-1   CV proper H1 (revises BUG-009 by-design)
  v1.58.20 · U-2   #/auto emoji-wrap
  v1.58.21 · U-3   Date placeholder relative
  v1.58.22 · U-4   Toast detail in <details>
  v1.58.23 · U-5   Dashboard CTA dedupe
  v1.58.24 · U-6   Scan active-companies tooltip
  v1.58.25 · U-7   ASCII divider → CSS
  v1.58.26 · U-8   Prompt-block collapse
  v1.58.27 · U-9   Pipeline queue-chip gap
  v1.58.28 · U-10  Tracker actions disabled@0
  v1.58.29 · U-11  LEGITIMACY tooltip
  v1.58.30 · U-12  Help filter placeholder
  v1.58.31 · U-13  Notifications drawer
  v1.58.32 · U-14  H1 ↔ subtitle spacing
  v1.58.33 · U-15  CV dirty-state
```

---

*Produced from `2026-05-19-MASTER-REGRESSION.md`. Hand off to Claude Code or human dev. One fix per release. HIGH → MEDIUM → LOW. Never batch. Never `--no-verify`. `ci.yml` is the hard gate.*
