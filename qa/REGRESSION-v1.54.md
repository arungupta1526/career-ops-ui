# REGRESSION & CONFORMANCE — career-ops-ui v1.54.0 (FINAL)

> The single authoritative end-to-end QA progress prompt. Supersedes
> `REGRESSION-v1.29.2.md` + `DOCS-COVERAGE-v1.29.md` — it fuses the
> bottom-up (regressions in working code) and top-down (drift vs the 5
> canonical career-ops.org/docs guides) perspectives into one runnable
> script that validates the whole project after the P-31 program
> (WS0–WS10, v1.31→v1.54: parent-sync, field-form config, the 40-finding
> senior UX audit, the test-pyramid, canonical re-validation).
>
> **How to run:** walk §0→§9 in order. §0 gates everything. Every check
> names the exact route/command and the pass condition. Record findings
> in `qa/v54-regression/<YYYY-MM-DD>-REGRESSION.md`. A check that needs a
> code change → open it as a one-fix ship (bump + CHANGELOG ×8 + test +
> Playwright-verify + pre-commit AI-review to LGTM), never batch.

---

## §0 — Pre-flight (gates everything below)

```bash
npm ci && npm run test:ci          # MUST: 717/717 · ✓ no .also( · ✓ CHANGELOG parity all 8 @ 1.54.0
node tests/e2e.mjs                 # MUST: passed: N  failed: 0
node tests/e2e-comprehensive.mjs   # MUST: N/N steps passed · 0 failed
node --test tests/sh-files.test.mjs        # MUST: 10/10 (bin/*.sh + hook)
node scripts/check-changelog-parity.mjs    # MUST: all 8 locales at v1.54.0
node scripts/check-no-also-leftovers.mjs   # MUST: ✓
career-ops-ui doctor               # MUST: exit 0, all required green
```

- `package.json::version` == `1.54.0` == footer `/api/health.version`.
- `git status` clean; HEAD tag `v1.54.0` on `origin/main`; CI green.
- `.claude/settings.json` is gitignored (untracked) — no allowlist churn in git.

## §1 — Routes (all 17 SPA screens render, 0 console errors)

For each: navigate, assert `#content` has a single `<h1.page-title>`,
no console errors, no unhandled rejection. Routes:
`#/dashboard #/scan #/pipeline #/auto #/evaluate #/batch #/deep
#/apply #/tracker #/reports #/cv #/profile(+#/settings alias) #/config
#/health #/activity #/help` + the 7 `#/<mode>` pages + `#/portals`
(alias → `#/config`, must NOT 404).

## §2 — WS2 UX-audit a11y invariants (the 40 findings, regression-locked)

| # | Screen | Invariant |
|---|---|---|
| 1 | all | route change moves focus to the new view's `h1` (`router.focusNewView`) |
| 2 | #/portals | resolves to config (alias) — never the 404 view |
| 3 | #/config | `role=tablist`/`tab`/`tabpanel`, `aria-selected` synced, ←/→/Home/End nav |
| 4 / 9 | #/config raw, #/tracker fix | destructive write → focus-trapped `UI.confirm` (Cancel-default, Esc/backdrop/× = false); **no native `confirm()`** anywhere |
| 5 / 6 / 21 / 24 | #/scan | console `role=log aria-live=polite` + assertive status; Stop closes EventSource; `aria-busy` on run; persistent `role=alert` + Retry |
| 7 / 16 / 30 / 31 | scan/cv/deep/apply | every control has a programmatic name (`label[for]`↔`id` or `aria-labelledby`) |
| 8 / 22 | #/pipeline | per-row/preview delete via `UI.confirm`; preview `role=region aria-live`; fetch-fail = distinct `role=alert` |
| 10 / 11 / 25 / 26 | #/tracker | `th scope=col`; Date/Score/Status sortable buttons + `aria-sort`; localized destructive labels; first-run empty state ≠ no-match |
| 12 / 27 / 28 | #/help | single `<h1>`; labelled+filterable TOC; focus-on-anchor; back-to-top |
| 13 / 14 / 18 / 19 / 20 | #/auto, #/evaluate | run-button busy state; actionable+toasted HTTP fail; async Clipboard w/ real-failure toast; eval `role=status`; eval spinner-wrapped |
| 33–40 | dashboard/profile/health/reports/activity/batch/mode | LOW polish (icon consistency, labelled chips, i18n toasts, list semantics, keyboard cards, 500-cap notice, localized placeholders, relabel announce) |

Each row has a dedicated `tests/*.test.mjs` (static guarantee) + was
Playwright-verified at ship. Re-run the test, then spot-check live.

## §3 — i18n / 8-locale parity

- `node --test tests/i18n-coverage.test.mjs` — every `t()` key resolves in all 8 locales.
- All 8 help bundles: **17 H2 / 70 H3** (`tests/help-ru-config-section.test.mjs` H2+H3 gates).
- All 8 CHANGELOG locales at `1.54.0` (parity gate).
- Rotate the lang switcher through all 8 (`en es pt-BR ko ja ru zh-CN zh-TW`): titles localize, persists across reload, no key leaks.

## §4 — Security envelope (must NOT regress)

- CSP excludes `'unsafe-inline'`/`'unsafe-eval'`; `frame-ancestors 'none'`; X-CTO/X-Frame/Referrer set (`server/index.mjs`).
- `isValidJobUrl` SSRF sweep (loopback/RFC1918/IMDS/CGNAT/IPv6-ULA/`file://`) on `/api/pipeline` + `/api/pipeline/preview`.
- `stripDangerousMarkdown` entity-aware XSS sweep on `PUT /api/cv`.
- Parent project is read-only except the documented explicit-action writes.
- No secret/`.env`/PII in git history (verified clean); `.env.example` placeholders only.

## §5 — Streaming / SSE

- `🌐 Scan` (`source=both`) emits ATS `done(final:false)` then RU terminal `done` — RU phase not dropped (`tests/scan-stream-multi-phase.test.mjs`).
- Stop button aborts an in-flight scan EventSource; poll cancelled on hashchange.
- `#/auto` SSE stepper: per-step events, manual-mode fallback with no key, HTTP-fail surfaced + toasted.

## §6 — CLI / shell surface (WS8 + WS9)

- `career-ops-ui setup|init|doctor|run|open|help` — `help` exits 0 + no shell-source leak; unknown verb exits 2.
- `init` writes parent `.env` via the validated `env-config` path; key entry echo-suppressed (raw-mode); `--provider/--*-key/--yes` non-interactive.
- `LLM_PROVIDER` (auto|claude|gemini) honored by evaluate/deep/mode/auto.
- `setup`/`run` autostart raises the browser tab; `NO_OPEN=1` disables.
- `.githooks/pre-commit` runs the deterministic floor + fail-soft AI layer; never `--no-verify`.

## §7 — Canonical-docs conformance (top-down)

`node --test tests/canonical-docs-coverage.test.mjs` (7/7) maps every
claim in the 5 guides to its SPA surface:

- [what-is-career-ops](https://career-ops.org/docs/introduction/what-is-career-ops) — model-agnostic, 0–5 rubric, local-only.
- [scan-job-portals](https://career-ops.org/docs/introduction/guides/scan-job-portals) — ATS + RU sources, `portals.yml`.
- [apply-for-a-job](https://career-ops.org/docs/introduction/guides/apply-for-a-job) — score thresholds, apply checklist.
- [batch-evaluate-offers](https://career-ops.org/docs/introduction/guides/batch-evaluate-offers) — `#/batch` flags incl. `--model`/`--start-from`.
- [set-up-playwright](https://career-ops.org/docs/introduction/guides/set-up-playwright) — Generate-PDF / liveness streams.

Help §1–§17 mirror these 1:1; the coverage test fails if a guide claim
has no SPA surface.

## §8 — Parent-sync

`git -C .. log` delta classified in
`.planning/.../PARENT-PARITY.md`: every parent v1.7.1→1.8.0 user-facing
change is surfaced (batch `--model`/`--start-from`), CLI-only by design,
or docs-only. No open GAP.

## §9 — Open backlog

| ID | Severity | Title | Target |
|---|---|---|---|
| G-005 | Minor (cross-repo) | `oferta.md` report blocks A-G vs canonical A-F | coordinated parent commit |

**Single open item, unchanged since v1.27.** Ready-to-apply plan:
**[`G-005-closure-kit.md`](./G-005-closure-kit.md)** — Step 1 a parent
`santifer/career-ops` `modes/oferta.md` A-F rewrite, Step 2 a one-line
web-ui `prompts.mjs` follow-up (help §9 ×8 already canonical A-F since
v1.15.0), Step 3 a lock test. Renderer is schema-tolerant (graceful
degrade), so this is nomenclature drift, not a functional break.
Everything else from the v1.10 baseline (31 prior findings) + the 40
WS2 UX-audit findings is shipped and regression-locked by a test.

---

## Exit criteria (this spec passes when)

`test:ci` 717/717 · e2e + e2e-comprehensive + sh-files green ·
8-locale H2/H3/CHANGELOG parity · canonical-docs-coverage 7/7 ·
all §2 a11y invariants hold live · security §4 unbroken · only G-005
open. At that point the SPA is correct, accessible, documented in 8
languages, and conformant with the canonical docs end-to-end.
