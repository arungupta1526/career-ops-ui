# SENIOR UX-DESIGNER AUDIT — career-ops-ui

> Paste this verbatim to an agent (or run it as a senior UX
> designer). It produces a **prioritised, evidence-based UX audit of
> the whole product**, judged against the canonical product intent
> documented at **https://career-ops.org/docs**. Output a single
> `qa/v54-regression/<YYYY-MM-DD>-UX-AUDIT.md` findings file.
>
> This is a *design-critique* prompt, not a regression prompt. It
> assumes the app already works (run `REGRESSION-FINAL.md` first if in
> doubt). Your job: judge whether it works *well for the user the docs
> describe*, and whether it faithfully delivers the docs' promise.

---

## Who you are

A senior product/UX designer doing a heuristic + task-based
evaluation. You think in user goals, flows, friction, and trust — not
in code. You cite evidence (screenshot, route, exact copy) for every
finding and you rank by user impact, not by ease of fixing.

## Ground truth: read the canonical docs FIRST

Before touching the app, read and internalise the product intent from
**https://career-ops.org/docs** — every page in the nav:

- **Introduction / What is career-ops** — the core promise and value
  proposition. What does the product claim to do for the user?
- **Quick Start** — the canonical first-run journey (Steps 1–7),
  including the `profile.yml` fields and the `modes/_profile.md`
  §Step-5 schema (Target Roles / Adaptive Framing / Exit Narrative /
  Comp Targets / Location Policy) and how each is *described to the
  user*.
- **Guides:** Scan Job Portals · Apply For a Job · Batch Evaluate
  Offers · Set up Playwright.
- **Reference:** Modes, auto-pipeline, pipeline, oferta, ofertas,
  contacto, deep, interview-prep, pdf, training, project, tracker,
  patterns, followup, Portals.

Build a one-paragraph "intended user + intended outcome" statement
from the docs. Every UX finding is judged against THAT, not against
generic taste. (career-ops-ui is the web front-end onto this exact
pipeline; it must make the documented journey *easier*, never alter
or contradict it.)

## The product surface to evaluate

Run the app locally (`npm start`, http://127.0.0.1:4317). Walk every
screen as the documented user would. Map each screen to the doc
concept it serves:

| Screen | Doc concept | Judge |
|---|---|---|
| `#/dashboard` | entry / overview | Does a new user know what to do next? |
| `#/config` (API keys / Profile / Modes) | Quick Start Steps 3–5 | Is the §Step-5 schema legible *as fields*? Do field descriptions match the docs' wording? Is "what do I put here" answered in-context? Is the provider model honest — does the user understand the CLI-agnostic parent (Claude Code · Codex · Gemini · OpenCode · Qwen · Copilot · Kimi) vs the headless web-ui eval that runs on **any one** of the Anthropic/Gemini/OpenAI/Qwen API keys ("OR", auto-ordered)? Can a user with only ONE provider key tell it will work, pick it, save, and succeed without reading code? |
| `#/auto`, Cmd+K | the auto-pipeline promise ("paste a URL → full report in 1–2 min") | Is the 1-click promise visible, trustworthy, and honest about progress/cost? |
| `#/scan` | Scan Job Portals guide | Is a multi-minute crawl legible (progress, stop, results)? |
| `#/pipeline` | pipeline reference | Triage clarity at 100s of rows. |
| `#/evaluate`, `#/batch` | Apply / Batch Evaluate guides | Does the score + A–F report read the way the docs frame it? |
| `#/deep`, `#/apply`, `#/<mode>` | deep / contacto / oferta(s) refs | Is the manual-vs-live distinction clear? |
| `#/tracker` | tracker reference | Is the funnel state understandable at a glance? |
| `#/reports`, `#/cv` | reports / pdf | Review-before-send trust. |
| `#/help` | the docs, in-app | Does it answer the questions the journey raises, in the user's language? |

## Heuristic lenses (apply all; cite evidence per finding)

1. **Promise fidelity** — does the UI deliver what career-ops.org/docs
   says it does? Flag anything where the app under-delivers,
   over-promises, or silently diverges from the documented behaviour.
2. **First-run / onboarding** — a brand-new user with empty parent
   files (no `cv.md`, stub `modes/_profile.md`). Can they get to a
   first evaluation following only on-screen affordances? Where do
   they get stuck or have to leave for the terminal/docs?
3. **Information scent & next-step clarity** — on every screen, is the
   single most valuable next action obvious?
4. **Feedback & system status** — long operations (scan, auto-
   pipeline, PDF, batch): progress, time expectation, cancelability,
   honest cost/credit signalling.
5. **Error recovery** — are failures (bad URL, missing key, wrong
   provider, network) explained in the user's terms with a clear
   recovery path? (e.g. the LLM-provider/key story.)
6. **Forms & data entry** — `#/config` Profile & Modes especially: is
   the documented schema expressed as well-labelled fields with
   doc-sourced guidance, sensible defaults, and safe (non-destructive,
   confirmed) saves? Is anything still "raw text the user must format
   correctly"?
7. **Trust, safety & reversibility** — destructive parent-file writes,
   "review before send", masked secrets, no surprise external calls.
8. **Consistency** — interaction patterns, terminology (match the
   docs' vocabulary exactly), iconography, empty/loading/error states.
9. **Accessibility as UX** — keyboard-only completion of the core
   journey; screen-reader sensibility of names/roles/status (not just
   WCAG box-ticking — does it make sense *aurally*?).
10. **i18n integrity** — switch through all 8 locales on the core
    flow: truncation, untranslated leakage, RTL/character issues,
    terminology drift from the docs.
11. **Cognitive load & progressive disclosure** — is power kept
    available but not in the beginner's way (Advanced disclosures,
    defaults, sane modes)?
12. **Aesthetic & visual hierarchy** — does the design earn trust for
    a tool handling someone's job search and salary data?

## Method

1. Read the docs → write the intended-user/outcome statement.
2. Run two end-to-end task scenarios *as the user*, narrating
   friction at each step:
   - **Scenario A — cold start:** empty parent files → set up exactly
     ONE provider key (try each of Anthropic / Gemini / OpenAI / Qwen
     in separate passes — the "OR" promise) → configure profile +
     Modes fields → first auto-pipeline on a real job URL → read the
     report → find the PDF. Note every moment you'd consult the docs
     or terminal, and whether the UI made the single-key path obvious.
   - **Scenario B — returning power user:** refine Modes fields, batch-
     evaluate several offers, triage `#/pipeline`, check `#/tracker`.
3. Sweep every screen through the 12 lenses.
4. Compare 2–3 screens side-by-side with their career-ops.org/docs
   page for promise fidelity & terminology.

## Output — `qa/v54-regression/<DATE>-UX-AUDIT.md`

- **Intended user & outcome** (1 paragraph, from the docs).
- **Top 5 user-impact findings** (the executive summary).
- **Findings table:** `ID · Screen · Lens · Severity
  (HIGH/MEDIUM/LOW) · Evidence (route + screenshot + exact copy) ·
  User impact · Recommended change · Doc reference`.
  Severity = *user impact*, not fix effort. Be specific and
  actionable; no vague "improve UX".
- **Promise-fidelity ledger:** every place the app diverges from
  career-ops.org/docs (behaviour, terminology, or omission).
- **What's genuinely good** (call out strengths honestly — a credible
  audit is balanced).
- **Recommended ship order:** HIGH → MEDIUM → LOW, each as a single
  one-fix ship per the project doctrine (bump + CHANGELOG ×8 + test +
  Playwright-verify + AI-review LGTM + CI-watch). Do **not**
  implement here — this prompt only produces the audit; fixes are
  separate ships.

## Baseline — already-closed findings (do NOT re-file these)

The 2026-05-14→18 audit cycle produced 12 UX findings + 2 a11y
findings (v1.55.1→v1.56.0); the follow-on `qa/FIX-PROMPT-FINAL.md`
cycle then closed an a11y focus-ring regression (v1.56.1), UX-N1
(v1.56.2), a reported key-detection trust bug (v1.56.3) and UX-N2
(v1.56.4). **All shipped and regression-locked** (v1.55.1→v1.56.4).
A fresh audit must treat these as the *current* baseline — only
re-open one with concrete live evidence that it regressed:

| Finding | Closed in | Locked by |
|---|---|---|
| F-V55-E / UX-1 — `#/auto` stepper pre-render | v1.55.1 | `auto-stepper-prerender.test.mjs` |
| F-V55-H / UX-5 — `#/cv` editor accessible name | v1.55.2 | `cv-editor-a11y.test.mjs` |
| UX-2 — 4-provider OR onboarding banner/chip | v1.55.3 | `onboarding-key-banner.test.mjs` |
| UX-6 — `#/auto` ETA + `#/scan` Stop prominence | v1.55.4 | `auto-eta-stop.test.mjs` |
| UX-3 — `#/dashboard` hero-CTA + focal hint | v1.55.5 | `dashboard-hero.test.mjs` |
| UX-4 — `#/scan` Advanced-filters disclosure | v1.55.6 | `scan-advanced-disclosure.test.mjs` |
| UX-7 — `#/pipeline` >1000-row virtualization | v1.55.7 | `pipeline-virtualize.test.mjs` |
| UX-8 — `#/tracker` server pagination + funnel | v1.55.8 | `tracker-server-paged.test.mjs` |
| UX-9 — `#/cv` breadcrumb title | v1.56.0 | `cv-breadcrumb.test.mjs` |
| UX-10 — ⚡ Run-live cost hint | v1.56.0 | `run-cost-line.test.mjs` |
| UX-11 — `#/help` TOC 1-match autoscroll | v1.56.0 | `help-toc-autoscroll.test.mjs` |
| UX-12 — `#/dashboard` first-paint a11y | v1.56.0 | `dashboard-initial-focus.test.mjs` |
| a11y — managed-focus ring suppressed (no red `<h1>` box) | v1.56.1 | `managed-focus-no-ring.test.mjs` |
| UX-N1 — per-route locale-aware `document.title` | v1.56.2 | `document-title-per-route.test.mjs` |
| key-detection — placeholder/short keys rejected (no false "✓ set", no mis-route) | v1.56.3 | `key-detection-rejects-placeholder.test.mjs` |
| UX-N2 — visible platform-aware ⌘K / Ctrl K hint | v1.56.4 | `cmdk-hint-visible.test.mjs` |

Senior-obs ledger: S-7→v1.54.6, W-001→v1.54.7, S-1→UX-3, S-2→UX-7,
S-3→UX-4, S-4→UX-1, S-5→UX-9, S-6→UX-8. The **only open backlog
item** is **G-005** (cross-repo nomenclature, MINOR): the parent
`santifer/career-ops :: modes/oferta.md` still emits the legacy
7-block A-G report vs the canonical 6-block A-F; the renderer is
schema-tolerant so both display correctly. It is blocked on a
parent commit (see `qa/G-005-closure-kit.md`) — not a web-ui UX
defect; do not re-file it as one.

### Guardrails

Read-only. Never edit parent career-ops files. Never weaken the
security envelope. Judge against the docs' intent, not personal
preference — when you disagree with the docs, say so explicitly and
separately from findings. Cite evidence for every claim.

---

## §UX-A — EXHAUSTIVE UX MATRIX (every page × every control × 8 locales)

> Sweep this in full. For every cell, rate **GOOD / FRICTION /
> BROKEN** with evidence (screenshot, route, exact copy, locale).
> "It works" is not enough — judge whether it works *well for the
> user career-ops.org describes*. One root cause = one finding.

### §UX-A.0 — The 8-locale lens (apply to EVERY page below)

Locales: **en · es · pt-BR · ko · ja · ru · zh-CN · zh-TW**. Per page,
per locale, judge:

1. **Completeness** — zero untranslated strings / raw `key.path` /
   leftover English inside a localized sentence (regression class:
   I18N-012/013 "smart questions"/`Deep research` RU; the open
   I18N-011 help-TOC). Mixed-language UI is a trust defect, file it.
2. **Fit & truncation** — CJK (`ko`/`ja`/`zh`) and longer Romance
   (`es`/`pt-BR`) strings must not clip, wrap mid-word, overflow
   buttons, or collide (placeholders, tabs, chips, the `#/help`
   "Filter sections" box, sidebar group headers, toast width).
3. **Naturalness** — translations read like a native product wrote
   them, not literal/MT ("Связь/звонок" for Outreach, transliterated
   section headers). Note awkward copy as FRICTION.
4. **Consistency** — the same concept uses the same word everywhere
   (button label == modal title == sidebar item == help section);
   route URLs stable & bookmarkable (`#/outreach` alias);
   `document.title` localized per route and updates on lang switch.
5. **Locale-aware formatting** — dates ("today" → localized), numbers,
   the `⌘K`/`Ctrl K` hint platform-correct; placeholders that are
   examples (ISO date) stay neutral but labels around them localize.

### §UX-A.1 — Per-page heuristic pass (all pages, all 8 locales)

For **every** route — `#/dashboard #/scan #/pipeline #/evaluate
#/deep #/cv #/tracker #/reports #/activity #/config #/profile
#/health #/help #/auto #/apply #/batch` + mode pages `#/project
#/training #/followup #/contacto #/interview-prep #/patterns
#/batch-prompt` + aliases `#/settings #/portals #/outreach` + the
404 — assess: visual hierarchy (one clear H1 + descriptive subtitle;
note the `#/cv` breadcrumb-chip is a *deliberate* single-H1 WCAG
choice — critique only the UX, not as a bug), scan-ability, primary
action obvious & above the fold, empty states teach the next step
(incl. `#/reports` empty), loading states honest (spinner + ETA, not
a frozen screen), error states actionable & legible, no duplicate/
competing CTAs (the `#/dashboard` Quick-actions vs hero overlap),
responsive 420 px → 1920 px (toasts must not cover Save on narrow —
UX-027), dark theme parity on every page.

### §UX-A.2 — Per-control interaction quality

For every button / input / select / link / modal / toast / tab:
affordance (looks actionable), focus visible & logical Tab order,
hit-target ≥ 44 px, disabled/busy states clear, double-submit
impossible, **every outcome legible** — success AND failure produce a
visible localized message the user can actually read in time (error
toast dwell scales with length; wraps not clips); destructive actions
are confirm-gated with the *same verb* in title & body & button;
progress toasts clear before their result modal (doctor/verify);
copy-to-clipboard confirms; deep-links resolve.

### §UX-A.3 — Trust & content quality (the product's promise)

Judge the *output*, not just the chrome: a Deep-research / Saved
brief must read as a clean, well-formatted document — **no raw
`<tool_call>{json}` / `<tool_response>` / `<thinking>` leakage**,
correct markdown (headings, tables, bold incl. inside blockquotes),
sectioned per the docs' intent. The active-provider / cost hint must
reflect the *actual* provider+model (not a hardcoded one). Health
must not call a test-fixture profile "customized". Error copy must
say what went wrong, where, and how to fix it — never an opaque
"validation failed" or a bare stack/endpoint.

### §UX-A.4 — End-to-end task journeys (the docs' core flows)

Walk each as the target user, 8 locales spot-checked: (a) paste a JD
→ score → decide (the score→action thresholds from the docs);
(b) `#/auto` one-URL pipeline end-to-end; (c) scan portals → triage
→ pipeline → evaluate → track; (d) deep-research a company → saved
brief → PDF; (e) configure a provider key from zero → first live
eval; (f) edit CV / profile / modes and see it reflected. Rate
friction per step; cite where the flow contradicts or under-delivers
the career-ops.org promise.
