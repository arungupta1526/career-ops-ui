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
| `#/config` (API keys / Profile / Modes) | Quick Start Steps 3–5 | Is the §Step-5 schema legible *as fields*? Do field descriptions match the docs' wording? Is "what do I put here" answered in-context? |
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
   - **Scenario A — cold start:** empty parent files → configure →
     first auto-pipeline on a real job URL → read the report → find
     the PDF. Note every moment you'd consult the docs or terminal.
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

### Guardrails

Read-only. Never edit parent career-ops files. Never weaken the
security envelope. Judge against the docs' intent, not personal
preference — when you disagree with the docs, say so explicitly and
separately from findings. Cite evidence for every claim.
