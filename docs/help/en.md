# Help — career-ops-ui

A complete walkthrough of every page, from the moment you launch the
app to landing an interview. Each `##` heading below corresponds to a
sidebar entry or a phase of the workflow. Read top-to-bottom on first
run; jump to a specific section later via the table of contents in the
help sidebar.

> **Audience:** anyone who just dropped this UI inside a `career-ops`
> checkout and ran `bash bin/start.sh`. No prior career-ops knowledge
> assumed.

### About career-ops

[career-ops](https://career-ops.org) is an open-source job-search system
that runs as slash commands inside any AI coding CLI (Claude Code,
Codex, Cursor, Gemini CLI, GitHub Copilot CLI). Model-agnostic. It
evaluates each posting against your CV with a six-dimension 0.0–5.0
rubric, generates tailored PDF résumés, and tracks every application
locally on your machine.

**Defining principles** (from [career-ops.org/docs](https://career-ops.org/docs)):

- **Open source, seriously** — MIT, no paid tier, no waitlist, no
  telemetry, no accounts.
- **Data sovereignty** — `cv.md`, `config/profile.yml`, `data/`,
  `reports/`, `interview-prep/` never leave your laptop unless you
  explicitly push them.
- **Human-controlled submissions** — career-ops drafts answers and
  opens the form, but **you click Submit**. The system never
  auto-applies.
- **Structured search** — built for an active, deliberate job hunt;
  not a recommendation engine.

**Key concepts**

| Concept | What it is |
|---|---|
| **Mode** | A prompt template under `modes/<slug>.md`. Built-in: `oferta`, `deep`, `apply`, `pipeline`, `batch`, `contacto`, `followup`, `interview-prep`, `patterns`, `project`, `training`. |
| **Archetype** | A target-role profile in `config/profile.yml`. The rubric weights skill matches against the active archetype — **the single most important field**. |
| **Pipeline** | `data/pipeline.md` — inbox of JD URLs waiting to be evaluated. |
| **Tracker** | `data/applications.md` — historical GFM table of every evaluation + application status. |
| **Report** | `reports/<NNN>-<company>-<DATE>.md` — full A–G evaluation per JD, with score + legitimacy. |
| **Scan history** | `data/scan-history.tsv` — append-only log; prevents duplicates across scans. |

### career-ops vs career-ops-ui (this app)

| | career-ops (CLI) | career-ops-ui (this app) |
|---|---|---|
| Where it runs | inside Claude Code / Codex / Cursor / Gemini CLI | `http://127.0.0.1:4317` in your browser |
| Surface | `/career-ops <mode>` slash commands | sidebar with one page per workflow |
| Form-fill | yes, via Playwright MCP | no — generates the checklist, you finish in the CLI |
| PDF | `generate-pdf.mjs` | `📄 Generate PDF` on `#/cv`, `#/reports/:slug`, `#/evaluate`, `#/deep`, `#/interview-prep` |
| Data files | shared with career-ops-ui | shared with career-ops |

career-ops-ui is **pure additions**. Nothing inside `career-ops/`
changes. Both surfaces share the same `cv.md`, `config/profile.yml`,
`portals.yml`, `data/`, `reports/`, `interview-prep/`, `modes/`.

### Action thresholds by score

Once a JD has an evaluation, the score determines what to do next:

| Score | Next step |
|---|---|
| **≥ 4.5** | Run `/career-ops apply` — high fit, push immediately. |
| **4.0 – 4.4** | Apply, or `/career-ops contacto` for warm intro first. |
| **3.5 – 3.9** | Run `/career-ops deep` — research the company / role before deciding. |
| **< 3.5** | Skip unless you have a specific personal reason. |

career-ops-ui's `#/dashboard` and `#/tracker` highlight every row at or
above 4.0 so you can pick action without re-running anything.

### External docs

Full reference for the underlying career-ops engine
(scanning, evaluation rubric, batch processing, apply flow,
Playwright setup) is at
[career-ops.org/docs](https://career-ops.org/docs):

- [What is career-ops](https://career-ops.org/docs/introduction/what-is-career-ops)
- [Scan job portals](https://career-ops.org/docs/introduction/guides/scan-job-portals)
- [Apply for a job](https://career-ops.org/docs/introduction/guides/apply-for-a-job)
- [Batch-evaluate offers](https://career-ops.org/docs/introduction/guides/batch-evaluate-offers)
- [Set up Playwright](https://career-ops.org/docs/introduction/guides/set-up-playwright)

---

## 1. Quick start — full step-by-step from "create CV" to "applied & messaged"

This is the canonical, button-by-button playbook. Follow it in order
the first time. Every step names the exact route, the exact button,
and what you'll see on success. Sections 2–16 below dive deeper into
each phase.

### A. Setup (do these once, ~5 minutes)

**Step 1 — Open the app at `http://127.0.0.1:4317`.** If it isn't
running, in a terminal run `bash bin/start.sh` from the repo root.
The Dashboard (`#/dashboard`) loads.

**Step 2 — Click `❤ Health` in the left sidebar.** Every required
check must be green:

- `cv.md`, `config/profile.yml`, `portals.yml` exist
- API key set (at least one of `ANTHROPIC_API_KEY` / `GEMINI_API_KEY`)
- Playwright installed (only required if you'll use Generate PDF)

If anything is red, the page tells you the exact file or env var to
fix. Don't proceed until Health is green.

**Step 3 — Click `⚒ App settings` in the sidebar.** You land on the
**API keys & runtime** tab.
- Paste `ANTHROPIC_API_KEY` (preferred — better long-form scoring)
  and/or `GEMINI_API_KEY`. Get keys from
  <https://console.anthropic.com/settings/keys> or
  <https://aistudio.google.com/apikey>.
- Click **💾 Save**. Then click **▶ Test Anthropic** (or Gemini) — a
  tiny round-trip confirms the key works.

**Step 4 — Switch to the `Profile` tab on the same page.** This is the
direct YAML editor for `config/profile.yml`. Edit at minimum:
- `candidate.full_name` — replace any placeholder ("Jane Smith") with
  your real name
- `candidate.email`, `linkedin`, `github` — used in cover letters
- `target.roles` — the job titles you'll apply to
- `target.comp_total_min_usd` — minimum total comp; offers below this
  get flagged in section D of every evaluation
- `target.archetypes` — the career patterns you accept (single
  most-impactful field)

Click **💾 Save**. Server validates the YAML and stamps the canonical
`# Career-Ops Profile Configuration` header.

### B. CV (do this once, ~10 minutes)

**Step 5 — Click `✎ CV` in the sidebar.** Two columns: editor on the
left, live preview on the right.

**Step 6 — Pick one path to fill the editor:**
- **Upload an existing résumé** — click **📁 Upload CV**, pick any of
  `.docx / .doc / .odt / .rtf / .pdf / .html / .txt / .md`. The
  server converts to markdown via pandoc or pdftotext, sanitizes XSS,
  and drops the result in the editor. **Review the conversion** —
  PDFs especially can lose layout fidelity.
- **Paste markdown directly** — the textarea is a markdown editor;
  the right pane is what the LLM (and your future recruiter) will see.
- **Tone tips:** one bullet = one accomplishment with a metric. Keep
  under 1500 words. Sections in this order: Summary, Experience,
  Projects, Education, Skills.

**Step 7 — Click `💾 Save` (top-right of CV page).** The server
sanitizes (`<script>` / `javascript:` / inline handlers stripped) and
writes `cv.md`. Toast: *"Saved"*.

**Step 8 (optional) — Click `📄 Generate PDF`.** Runs
`generate-pdf.mjs` in the parent (Playwright required) and **the new
PDF auto-downloads** to your browser when done. The list at the
bottom of the page keeps every previously generated file.

### C. Find vacancies (~2 minutes per scan)

**Step 9 — Click `🌐 Scan` in the sidebar.** Confirm `portals.yml`
lists the boards you care about (sections 5 of this help). Press the
**🌐 Scan now** button. A live SSE log streams while the scanner
walks Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday (English boards) and hh.ru / Habr
Career (Russian boards if enabled).

**Step 10 — When the scan finishes, review results.** Click any
company tag to filter; click the ↗ icon to open the company's
careers page in a new tab. Every vacancy that survived the
title-filter is queued in the Pipeline.

### D. Score the offers (~30 seconds per JD)

**Step 11 — Click `Pipeline` in the sidebar.** You see every URL
the scanner queued. Click an entry to preview the JD inline.

**Step 12 — Click `▶ Evaluate` next to any JD.** This jumps to
`#/evaluate`. With an API key set, it runs live; without one, you
get a manual prompt to paste into your own LLM. Live mode produces a
**0–5 score** against your CV across sections A–G (Role / Company /
Compensation / Risk / Stretch / Cultural fit / Verdict). Save lands
in `reports/<date>-<slug>.md`.

**Step 13 — Click `Reports` in the sidebar** and review the latest
evaluation. Anything below your `comp_total_min_usd` is flagged red
in section D. Anything with `Verdict: pursue` is your shortlist.

### E. Decide & deeply research the shortlisted company (~3 minutes)

**Step 14 — Pick a vacancy worth pursuing. Click `Deep research`
in the sidebar.** Enter the company name and role. The model
produces a 7-section company brief (mission, recent news, tech
stack, hiring signals, comp benchmarks, risks, recommended angle).
Save lands in `interview-prep/<company>-<role>.md`.

### F. Apply (~5 minutes per application)

**Step 15 — Click `Apply checklist` in the sidebar.** Paste the
vacancy URL + JD. The helper generates a step-by-step submission
checklist:
- Tailored cover-letter draft (uses your `cv.md` + `profile.yml`)
- Specific keywords to mirror from the JD
- Files to attach (CV PDF — see step 8)
- Where to apply (the canonical careers URL, not aggregator
  redirects)
- Reminder: **NEVER auto-submit** — final review and submission is
  always manual.

**Step 16 — Open the careers page in a new tab.** Use the apply
checklist as your todo list. Submit through the company's actual
form. Attach the PDF you generated in step 8.

**Step 17 — Reach out to a real human.** Open the **Outreach** mode
(`#/contacto` in the sidebar). The model drafts a short LinkedIn /
email message tailored to the company brief from step 14. Personalize
the opener (one specific detail from your deep-research brief).
Send it.

### G. Track & follow up (continuous)

**Step 18 — Click `Tracker` in the sidebar** and add a row for
the application: company, role, score, status `Applied`, link to the
report, link to the deep-research brief. Date is auto-filled.

**Step 19 — A week later: open `Follow-up` mode** (`#/followup`).
Drafts a polite check-in email referencing the original application.
Send. Update tracker status to `Followed up`.

**Step 20 — When you get an interview invite, run `Interview prep`
mode** (`#/interview-prep`). Generates targeted prep for the
specific company + stage (system design / behavioral / coding).
Pulls from the deep-research brief automatically.

**Step 21 — Got the offer? Update Tracker status to `Offer`** and
revisit the comp section of your evaluation report — your minimum
acceptance number is right there.

### TL;DR — sidebar order matches the workflow

`Health → App settings → Profile → CV → Scan → Pipeline → Evaluate
→ Reports → Deep research → Apply checklist → Outreach → Tracker
→ Follow-up → Interview prep → Activity log`

That's it. 21 steps, button-by-button, from zero to offer.

---

## 2. App settings & API keys (`#/config`)

Two tabs:

1. **API keys & runtime** — edit the parent project's `.env` from
   the browser (same file the career-ops Node scripts read on startup).
2. **Profile** — direct YAML editor for `config/profile.yml`. Save
   stamps the canonical `# Career-Ops Profile Configuration` header.

A save in either tab propagates immediately — no server restart.

### Profile tab

- The textarea shows the current `config/profile.yml` verbatim.
- Edit and click **💾 Save**. The server validates the YAML
  (must be a mapping, must contain `candidate`) and writes the file.
- A `# Career-Ops Profile Configuration` header is added if missing.
- The read-only summary at `#/profile` is the visual companion.

### Recognized keys

| Key | What it does | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | Enables live Anthropic SDK calls. Preferred when both Anthropic + Gemini are set — better long-form structured output for JD scoring and deep research. | <https://console.anthropic.com/settings/keys> |
| `ANTHROPIC_MODEL` | Override the default `claude-sonnet-4-6`. Try `claude-opus-4-7` for harder reasoning, `claude-haiku-4-5-20251001` for cheap-and-fast. | — |
| `GEMINI_API_KEY` | Fallback when no Anthropic key. Used by `gemini-eval.mjs` for `oferta` mode. Free tier works for low volume. | <https://aistudio.google.com/apikey> |
| `GEMINI_MODEL` | Override default Gemini model. | — |
| `HH_USER_AGENT` | Required when running `hh.ru` scans from outside Russia (the API returns 403 on plain User-Agents). Register an app at <https://dev.hh.ru/admin> and use its UA string. | dev.hh.ru |
| `PORT` | Express bind port. Default 4317. | — |
| `HOST` | Bind address. Default `127.0.0.1`. Setting `0.0.0.0` exposes the UI on the LAN — **no auth gate yet**, see Production-readiness doc. | — |

### Behavior

- **Read** (`GET /api/config`) returns every recognized key. Secret
  keys (`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`) are **masked** — you see
  `sk-ant•••••••a1b2`, never the full value.
- **Save** (`POST /api/config`) validates each value, writes to
  `<parent>/.env`, and immediately applies to the running process.
  No restart needed.
- **Empty value deletes** the key. Useful if you want to unset
  `HH_USER_AGENT` while testing.

### Smoke-test buttons

After saving, click **▶ Test Anthropic** or **▶ Test Gemini** — both
fire a tiny prompt (≤256 tokens output) so you spend essentially
nothing while confirming the key is wired up correctly. Returns a
~200-character sample on success.

---

## 3. Profile (`#/profile` — also reachable as `#/settings`)

A read-only summary card view of `config/profile.yml`. **To edit**,
go to **App settings → Profile tab** (`#/config` → Profile). Saves
land in the same file; this page re-parses on reload.

The fields that matter most:

- `candidate.full_name` — used in every prompt. **Replace the
  template `Jane Smith`** before scanning anything for real, or your
  generated cover letters will go out under the placeholder name.
- `candidate.email`, `linkedin`, `github` — referenced in cover-letter
  generation and the apply checklist.
- `target.roles` — accepted job titles. The scanner's positive filter
  uses this implicitly (via `portals.yml::title_filter`).
- `target.comp_total_min_usd` — minimum total comp. Section D of every
  evaluation flags offers below this.
- `target.archetypes` — the *most important field*. These are the
  career patterns you accept (e.g. `Tech-Lead-Backend`,
  `Founding-Engineer`, `Data-Platform`). Every JD is matched against
  them and the best-fit archetype lands in the report header.

The Health page surfaces a **Profile customized** check that fails as
long as `full_name` matches a known placeholder name.

---

## 4. CV (`#/cv`)

Single source of truth for every evaluation, deep research, and cover
letter. Lives in `cv.md` at the parent project root.

### Editing options

- **Paste it directly** — the textarea on the left is a markdown
  editor. The right-hand pane mirrors what the LLM (and your future
  recruiter) sees.
- **📁 Upload CV** — pick a local file in any of these formats and
  the server converts it to markdown for you:
  - **Text formats** — `.md`, `.markdown`, `.txt`, `.html`, `.htm`
    are passed through (HTML goes via pandoc → GFM markdown).
  - **Office formats** — `.docx`, `.doc`, `.odt`, `.rtf` are
    converted via **pandoc** (`brew install pandoc` on macOS,
    `apt install pandoc` on Linux).
  - **PDF** — `.pdf` is extracted via **pdftotext** from Poppler
    (`brew install poppler` / `apt install poppler-utils`).
  - The converted markdown lands in the editor; click **💾 Save**
    to persist. The result is sanitized (same XSS strip as paste).
  - Hard cap: **10 MB** per upload. Larger files → 413.
- **From LinkedIn** — easiest path: open Claude Code in the parent
  project, run `/career-ops`, paste your LinkedIn URL, and ask
  `extract my CV from this and write it to cv.md`.

### What gets sanitized

Server-side, every PUT to `/api/cv` runs through `stripDangerousMarkdown`:

- `<script>`, `<iframe>`, `<object>`, `<embed>`, `<svg>`, `<style>`,
  `<form>` tags — removed entirely.
- Inline event handlers (`onclick=`, `onerror=`, etc.) — stripped.
- `javascript:`, `vbscript:`, `data:text/html` URI schemes — neutered.

The response includes `sanitized: true` whenever any of the above were
removed, so you know if the source had something nasty.

Max body size: 1 MB. Anything larger returns 413.

### Other buttons

- **sync-check** — runs `cv-sync-check.mjs` in the parent project.
  Flags inconsistencies: a project listed in your CV but not in
  `data/applications.md` archetypes, etc.
- **📄 Generate PDF** — streams `generate-pdf.mjs`. Output lands in
  `output/*.pdf`. Requires Playwright (Health page shows whether it's
  installed in the parent's `node_modules`). When generation finishes,
  the **newest** PDF is auto-downloaded to your default Downloads
  folder; the on-page list keeps every previously generated file.

### Tone / format tips

- One bullet = one accomplishment with a metric.
  *"Reduced p99 latency by 38%"* beats *"improved performance"* for
  every evaluation rubric.
- Sections in this order: **Summary** (3–5 lines), **Experience**
  (reverse-chronological), **Projects** (max 5), **Education**,
  **Skills** (deduplicated, no buzzword soup).
- Keep it under 1500 words. The scoring rubric uses dense info; a
  sprawling CV gets penalized for noise.

---

## 5. Portals & sources (`portals.yml`)

The scanner config lives in `portals.yml` at the parent root. Three
sections matter:

### `title_filter`

```yaml
title_filter:
  positive: [backend, engineer, senior, tech lead, golang, php]
  negative: [junior, intern, frontend, ios, android, java]
  seniority_boost: [Senior, Staff, Lead, Principal]
```

A scanned vacancy passes when its title contains **at least one
positive** keyword AND **none of the negative** keywords. Tune both.

`seniority_boost` is the third title-filter key. Keywords listed
here don't filter anything out — they push matching jobs higher in
the results so a "Senior Backend Engineer" lands above an "Engineer".
Default: `["Senior", "Staff", "Lead"]`. Tune to match how your
target roles are titled.

### `search_queries`

```yaml
search_queries:
  - name: "Greenhouse — Rails Engineer"
    query: 'site:job-boards.greenhouse.io "Rails Engineer" OR "Ruby on Rails" remote'
    enabled: true
  - name: "Ashby — Senior Backend"
    query: 'site:jobs.ashbyhq.com "Senior Backend" remote'
    enabled: false
```

`search_queries` drive the AI-powered Option B scan (`/career-ops scan`
inside Claude Code / Codex). They are NOT executed by the in-process
`npm run scan` (which only hits public boards APIs). Use them when
you want to discover roles at companies not yet in
`tracked_companies`. Set `enabled: false` to keep an entry without
running it.

### `tracked_companies`

```yaml
tracked_companies:
  - { name: Stripe,     enabled: true, careers_url: https://job-boards.greenhouse.io/stripe }
  - { name: Linear,     enabled: true, careers_url: https://jobs.ashbyhq.com/linear }
  - { name: JetBrains,  enabled: true, careers_url: https://jobs.lever.co/jetbrains }
```

The ATS scanner detects the ATS from the URL pattern
(`job-boards.greenhouse.io/<slug>` → Greenhouse, etc.) and fetches each
company's public boards-api directly. Companies without a recognizable
ATS are skipped (the **Active Companies** card on `/#/scan` shows them
in gray with `○`).

### `russian_portals`

```yaml
russian_portals:
  sources: [hh, habr]      # or just one
  area: 113                 # 1=Moscow, 2=SPb, 113=Russia, 1001=remote
  per_page: 50
  only_remote: false
  queries:
    - "Senior PHP"
    - "Senior Go"
    - "Тимлид PHP"
```

`queries` are case-insensitive substring matches against vacancy titles
on hh.ru and Habr Career. **Be careful with overlap with the negative
list** — if `"Senior PHP"` is in `queries` but `"php"` ends up in
`title_filter.negative`, the scan will return zero results and the
console will warn you about the conflict.

### CLI flow ([career-ops.org/docs/.../scan-job-portals](https://career-ops.org/docs/introduction/guides/scan-job-portals))

The canonical career-ops setup (run from the parent root once):

```bash
cp templates/portals.example.yml portals.yml
$EDITOR portals.yml
```

`portals.yml` has three sections; the canonical career-ops.org schema
matches the SPA's three sections above 1:1:

- **title_filter** — `positive`, `negative`, `seniority_boost` keyword
  lists (case-insensitive). A vacancy needs ≥ 1 `positive` match and
  zero `negative` matches to pass. `seniority_boost` ranks higher
  without filtering. Start with 3–5 positive keywords for clarity.
- **tracked_companies** — every entry MUST have `name` and
  `careers_url`. Optional: `api` (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday
  endpoint), `enabled: true|false` to include/exclude without
  deleting the entry.
- **search_queries** — pre-built broader web searches (LinkedIn /
  Indeed-style). Defaults work for most users.

### Bootstrap

On first run the server appends a documented `russian_portals:` block
to `portals.yml` if it's missing — idempotent (second boot is a no-op
because the literal `russian_portals:` line is now there).

---

## 6. Health (`#/health`)

Every setup gate, in OK / OPTIONAL / FAIL badges. Read this before
filing any "doesn't work" issue.

### Required checks (system can't function without these)

- `Node version` ≥ 18 — the server uses native `fetch` and
  `node:test`.
- `Project root` — that `CAREER_OPS_ROOT` (env or auto-detected)
  exists.
- `cv.md`, `config/profile.yml`, `portals.yml`,
  `data/applications.md`, `data/pipeline.md`, `modes/oferta.md`.

### Optional checks (warnings only)

- `Profile customized` — `candidate.full_name` is not the template
  placeholder.
- `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` — set in `.env`.
- `HH_USER_AGENT` — only matters if you scan hh.ru from outside Russia.
- `Playwright (parent node_modules)` — required for PDF generation
  and `check-liveness.mjs`. Install with
  `cd $CAREER_OPS_ROOT && npm install && npx playwright install chromium`.
- `Parent project dependencies` — `cd $CAREER_OPS_ROOT && npm install`
  if missing.
- `data/`, `reports/`, `output/`, `jds/` directories — auto-created on
  first write.

When the server is exposed beyond loopback (`HOST=0.0.0.0`) the
absolute paths and exact Node version are replaced with `"hidden"` in
the response so a curious neighbor can't fingerprint your install.

### Run buttons

- **▶ Doctor** runs `node doctor.mjs` and shows the output in a modal.
- **▶ Verify pipeline** runs `node verify-pipeline.mjs`.

---

## 7. Scan (`#/scan`)

The scanner crawls every enabled board, deduplicates against your
history, and writes hits into `data/last-scan.json` and
`data/pipeline.md`.

### One-click scan

**🌐 Scan** runs every enabled source in a single sweep:

- Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday (the ATS sweep) for every company in
  `tracked_companies` with a recognizable ATS URL.
- hh.ru API + Habr Career HTML for every query in `russian_portals`.

Live SSE log streams to the right pane while the scan runs. Click
**Stop** (or just navigate away) to abort — the server cancels
in-flight HTTPS requests via `AbortController`.

### Filtering results

Below the log, the results table renders rows from `data/last-scan.json`.

Filters:

- **Free text** — substring match against title / company.
- **Source** dropdown — Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday / hh.ru / Habr.
- **Remote / Hybrid / Onsite** dropdown.
- **Stack chips** (PHP / Go / Backend / Senior / …) — auto-detected
  per row by `Skills.detectTech` and `Skills.detectLevel`. Multi-select
  intersection — selecting `PHP + Senior` shows rows that have BOTH.
- **Dynamic chips** below the static stack ones — top-25 most
  frequent capitalized tokens from titles, so the UI adapts to
  whatever roles you actually scan (marketing, design, finance…)
  instead of being locked to the backend-engineer vocabulary.

### Active Companies card

A collapsible card listing every company in `portals.yml` with its
scan status:

- ✓ green tag — direct API support (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday).
- ○ gray tag — fallback to web-search prompt (no API match).

**Click the company name** → fills the results filter above with that
name. **Click the ↗ icon** → opens the company's `careers_url` in a
new tab.

### CLI scan flow ([career-ops.org/docs/.../scan-job-portals](https://career-ops.org/docs/introduction/guides/scan-job-portals))

Two ways to scan from the CLI side (both deposit URLs to the same
`data/pipeline.md` that the SPA reads):

**Option A — direct script (~30 s, zero AI tokens):**

```bash
npm run scan                          # all Greenhouse/Ashby/Lever boards
npm run scan -- --dry-run             # preview without persisting
npm run scan -- --company Anthropic   # narrow to one tracked company
```

Works only for Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday (recognizable ATS URLs).

**Option B — AI-powered browser scan:**

```
/career-ops scan
```

Inside Claude Code / Codex / Cursor / Gemini CLI. Uses model tokens.
Visits each `tracked_companies` page directly and can discover non-API
boards (career pages, custom ATS, regional portals). Slower but
broader.

**Output (both paths)** — new JD URLs appended to `data/pipeline.md`,
every visited URL logged to `data/scan-history.tsv` (dedup across all
future scans), summary printed: companies scanned · jobs found ·
filtered by title · duplicates skipped · new offers added.

**Action thresholds by score** (apply after `/career-ops pipeline`
batch-scores the new URLs):

| Score | Recommended next step |
|---|---|
| **≥ 4.5** | `/career-ops apply` — high fit, push immediately |
| **4.0 – 4.4** | apply, or `/career-ops contacto` for warm intro |
| **3.5 – 3.9** | `/career-ops deep` — research first |
| **< 3.5** | skip unless you have a specific personal reason |

The SPA's `#/dashboard` and `#/tracker` highlight every row at or
above 4.0 so you can pick action without re-running anything.

---

## 8. Pipeline (`#/pipeline`)

Inbox of URLs waiting to be evaluated. Lives in `data/pipeline.md`.

### Adding URLs

Three ways:

- Type / paste a URL into the input + click **+ Add**.
- Press **Ctrl+K** (or **Cmd+K**) to focus the global search, paste
  any `http(s)://…` link, hit **Enter** — the URL goes into the
  pipeline immediately.
- Run a Scan (see above) — fresh hits go to the pipeline
  automatically.

Every URL passes through `isValidJobUrl()` server-side. Loopback
(`localhost`, `127.0.0.1`), `file://`, `javascript:`, IP literals, and
strings with template chars (`<`, `>`, `"`) all 400.

### Server-side preview pane

Click any pipeline row to load a preview on the right. Most ATS boards
don't send CORS headers so the browser can't fetch them directly; the
server proxies the request, strips `<script>` / `<style>` / HTML tags,
and returns up to 8 KB of plain text.

The preview proxy walks redirects manually with **per-hop SSRF
validation** — every `Location` header runs through `isValidJobUrl()`
again, so a hostile board can't bounce you to loopback / private IP
/ `file://`. Capped at 3 hops, 15-second timeout.

### Row actions

- **▶** — jumps to `#/evaluate?url=…` with the URL pre-filled.
- **✕** — removes the URL from `data/pipeline.md`.

### Top-right buttons

- **⚡ Evaluate first** — opens the first queued URL on the Evaluate
  page, ready to score.
- **Scan** — back to the scanner if you want more URLs.

---

## 9. Evaluate (`#/evaluate`)

Scores a single Job Description against `cv.md` and
`config/profile.yml`. Returns a structured A–G evaluation per
`modes/oferta.md` plus a 0–5 score.

### Input

Paste the JD into the textarea, or arrive here from `#/pipeline` with
`?url=<href>` — the page fetches the URL through the same SSRF-safe
proxy used for pipeline previews and pre-fills the textarea.

Click **💾 Save JD** to persist the JD to `jds/jd-<date>-<ts>.txt`
for the audit trail (or pass `save: true` in the API call — same
effect).

### Fallback chain

1. **Anthropic** — preferred when `ANTHROPIC_API_KEY` is set. The
   server bundles `cv.md`, `config/profile.yml`, `modes/_shared.md`,
   and `modes/oferta.md` into a `<project_context>` block before the
   prompt (each file capped at 16 KB, full prompt soft-capped at
   200 KB). Returns grounded markdown directly to the page.
2. **Gemini** — when only `GEMINI_API_KEY` is set. Server spawns
   `gemini-eval.mjs` with the JD as a temp file. Free-tier model
   (`gemini-2.0-flash`) is fine for routine scoring.
3. **Manual** — no key set. The page returns a fully-formed prompt
   you can paste into Claude Code, ChatGPT, or any other LLM.

### Output sections

A. **Role Summary** — 3-bullet recap.
B. **CV Match** — top 3 skills hit + top 3 missing.
C. **Risks** — 1–3 concrete concerns (compensation, role ambiguity,
seniority drift, etc.).
D. **Compensation** — relative to your `target.comp_total_min_usd`.
E. **Application Strategy** — should we apply? Yes/No + 1-line
reason.
F. **Verdict** — final 0–5 score with 0.1 precision.
G. **Posting Legitimacy** — flags obvious red flags (vague company,
zero salary band, "rockstar/ninja" copy, no email contact).

### Saving the report

Click **💾 Save report** (or use the save toggle in the API call) to
persist the markdown to `reports/<date>-<company>-<role>.md`. The
report's parsed header (Score / Legitimacy / URL) appears on the
**Reports** page and the **Dashboard**.

---

## 10. Reports (`#/reports`)

Browse every saved evaluation. Cards show title, date, legitimacy
flag, and score (color-coded: green ≥ 4.0, yellow ≥ 3.0, red below).

Click a card to read the full markdown. Pagination: 12 per page;
controls at the bottom.

The single-report view also has:

- **← All reports** — back to the grid.
- **🔗 Open JD** — opens the original job posting in a new tab.

---

## 11. Tracker (`#/tracker`)

The CRM. One row per application; lives in `data/applications.md` as a
GitHub-Flavored Markdown table.

### Status flow

`Evaluated` → `Applied` → `Responded` → `Interview` → `Offer` /
`Rejected` / `Discarded` / `SKIP`.

The status whitelist is enforced server-side; sending anything else in
a `POST /api/tracker` defaults to `Evaluated`.

### Column layout

| Column | What it is |
|---|---|
| `#` | Auto-numbered, zero-padded (`001`, `002`, …). |
| `Date` | ISO date (`YYYY-MM-DD`). Defaults to today. |
| `Company` | Free text. **Pipes (`\|`) and newlines are escaped automatically.** |
| `Role` | Same. |
| `Score` | `N/5` format (e.g. `4.2/5`). |
| `Status` | Whitelisted enum. |
| `PDF` | ✅ once `generate-pdf.mjs` succeeded for this row. |
| `Report` | Markdown link to the matching `reports/*.md`. |
| `Notes` | Free text, capped at 200 chars. |

### Filters

- **Status** dropdown.
- **Score** dropdown — `≥ 4.0` (high), `≥ 3.0` (mid), `< 3.0` (low).
- **Search** — substring match across company + role.

Every filter resets the paginator to page 1. 25 rows per page.

### Maintenance buttons

- **▶ Normalize** runs `normalize-statuses.mjs` — re-canonicalizes
  status spellings (`applied` → `Applied`, `interview` → `Interview`).
- **▶ Dedup** runs `dedup-tracker.mjs` — removes case-insensitive
  duplicates by `(company, role)`.
- **▶ Merge** runs `merge-tracker.mjs` — pulls in pending entries from
  `batch/tracker-additions/*.tsv` (where the parent's batch flow drops
  applications submitted via the Apply helper).

### Adding rows

`POST /api/tracker` — body `{ company, role, score?, status?, url?,
reportSlug?, notes?, date? }`. Dedup by `(company, role)`
case-insensitive. From the UI, the Evaluate page offers an "Add to
tracker" button after a successful score.

---

## 12. Deep research (`#/deep`)

Generate a structured company brief: snapshot, engineering culture,
recent news, Glassdoor sentiment, interview process, negotiation
leverage points, three smart questions to ask the recruiter.

### Input

Two fields — company name and (optional) role. The mode template
(`modes/deep.md`) is what shapes the structure.

### Output paths

Same fallback chain as Evaluate:

1. **Anthropic live** (preferred) — `bundleProjectContext` inlines
   cv + profile + `_shared.md` + `deep.md`. Output: 10–30 KB of
   grounded markdown saved to
   `interview-prep/<company>-<role>.md`.
2. **Gemini live** — `gemini-eval.mjs` invocation. Same save target.
3. **Manual prompt** — the page hands you a ready prompt for Claude
   Code (which has WebFetch + WebSearch and can do real research).

### Tips

- Anthropic on `claude-sonnet-4-6` typically returns ~13 KB of useful
  text in 1–3 minutes per call.
- The Anthropic SDK has no built-in web search. For roles where you
  need fresh news + Glassdoor sentiment, paste the manual prompt into
  Claude Code and let it use its WebFetch tool.
- Live runs are billed; one Sonnet 4.6 deep-research call costs ≈
  $0.30–0.50.

---

## 13. Mode prompts (the seven `/#/<mode>` pages)

Seven prompt builders: **Project** ideas, **Training** plans,
**Follow-up** emails, **Batch** evaluations, **Outreach** to
recruiters, **Interview prep** one-pagers, and **Patterns**
retrospectives. Each one wraps a specific `modes/<slug>.md` template:

| Page | Slug | Purpose |
|---|---|---|
| `#/project` | `project` | Tailor a portfolio project for a target role. |
| `#/training` | `training` | Skill-gap analysis → curriculum. |
| `#/followup` | `followup` | After-interview email draft. |
| `#/batch` | `batch` | Multi-JD batch evaluation prompt. |
| `#/contacto` | `contacto` | Outreach message to a recruiter / referral. |
| `#/interview-prep` | `interview-prep` | One-pager prep for a specific interview round. |
| `#/patterns` | `patterns` | "What patterns made me successful?" reflective analysis. |

### Shared shape

Each page has a small form (the fields are mode-specific), a **▶
Generate prompt** button (manual), and — when an Anthropic or Gemini
key is present — a **⚡ Run live** button that promotes to primary.

Clicking **▶ Generate prompt** returns the assembled prompt with your
form values JSON-stringified into a `User-supplied context:` block,
followed by the verbatim `modes/<slug>.md` template. Copy and paste
into your LLM of choice.

Clicking **⚡ Run live** sends the same prompt to Anthropic (or
Gemini), with `cv.md` + `profile.yml` + `_shared.md` inlined via
`bundleProjectContext`. Result is rendered on the page, copyable, and
downloadable as `.md`.

The seven pages are an explicit allowlist — modes that have a
dedicated route (`oferta` → Evaluate, `deep` → Deep research) and
modes the parent project supports only inside Claude Code (`apply`,
`scan`, `pipeline`, `tracker`, `pdf`, `latex`, `ofertas`,
`auto-pipeline`) deliberately stay off this UI.

---

## 14. Apply checklist (`#/apply`)

Once you've decided to apply, this Apply helper page generates a
submission checklist for the actual application step. It does **NOT** auto-fill
forms — that flow stays in `/career-ops apply` inside Claude Code,
which uses Playwright in the parent project.

The checklist covers:

0. Run `/career-ops apply <url>` in Claude Code to read the form via
   Playwright.
1. Verify the posting is still live (`check-liveness.mjs`).
2. Confirm CV is the latest (`cv-sync-check.mjs`, then PDF if score ≥ 4.0).
3. Tailor the cover letter / "Why us?" answer using STAR+R proof
   points from `cv.md`.
4. Answer EEO / sponsorship / start-date questions truthfully.
5. Save filled answers to
   `interview-prep/{company}-{role}.md` before submitting.
6. **NEVER auto-submit** — you (the human) click the final button.
7. After submit: add row to `data/applications.md` (or write TSV to
   `batch/tracker-additions/`).

### Full CLI apply flow ([career-ops.org/docs/.../apply-for-a-job](https://career-ops.org/docs/introduction/guides/apply-for-a-job))

Prerequisites:

1. Run `/career-ops pipeline` first so the JD has an evaluation report.
2. Have the report and profile loaded.
3. **Recommended:** Playwright installed (`npx playwright install
   chromium`). Falls back to WebFetch (text-only) when missing.

Numbered flow:

1. **Run the command** with the company name:

   ```
   /career-ops apply <company>
   ```

   Example: `/career-ops apply Anthropic`. Without an argument, supply
   a screenshot of the form, the form text pasted, or the application
   URL on the next turn.

2. **Playwright opens the browser** automatically and reads the form.
   You do NOT open the browser yourself.

3. **Draft answers come back** as a numbered list matching the form's
   field order, sourced from the report's proof points and STAR
   stories.

4. **Flagged items** point at things needing human attention — salary
   anchor, missing résumé details, optional questions.

5. **You review every answer**, fill the form, and click **Submit**
   yourself. career-ops never clicks Submit.

6. **Confirm submission** in chat:

   ```
   Submitted.
   ```

7. **Automatic updates** — status flips `Evaluated → Applied` in
   `data/applications.md`; the filled answers persist in the report's
   Section G.

8. **Handoff to tracker**:

   ```
   /career-ops tracker
   ```

### Batch evaluate ([career-ops.org/docs/.../batch-evaluate-offers](https://career-ops.org/docs/introduction/guides/batch-evaluate-offers))

When you've got 10+ JDs to score at once (the SPA's one-at-a-time
`#/evaluate` is impractical for that volume), use the batch runner
from the CLI:

1. **Edit** `batch/batch-input.tsv` with tab-separated columns
   `id | url | source | notes`. One row per JD. Example row:

   ```
   1<TAB>https://jobs.example.com/senior<TAB>LinkedIn<TAB>
   ```

2. **Dry-run** (recommended first):

   ```bash
   ./batch/batch-runner.sh --dry-run
   ```

3. **Run** — sequential or parallel:

   ```bash
   ./batch/batch-runner.sh                       # one at a time
   ./batch/batch-runner.sh --parallel 2          # two concurrent
   ./batch/batch-runner.sh --parallel 3          # three concurrent
   ./batch/batch-runner.sh --parallel 2 --min-score 4.0  # only persist high-fit
   ```

4. **Retry failures** (network / rate-limit):

   ```bash
   ./batch/batch-runner.sh --retry-failed --max-retries 3
   ```

5. **Reports** land in `reports/` (format
   `NNN-company-YYYY-MM-DD.md`). Summary rows append to
   `batch/tracker-additions/`.

6. **Merge into tracker**:

   ```bash
   node merge-tracker.mjs                 # apply the batch additions
   node merge-tracker.mjs --dry-run       # preview the merge
   ```

The SPA surfaces the resulting reports under `#/reports` (paginated,
score-pill colored) and the tracker rows under `#/tracker` — exactly
as if you'd added each one through `#/evaluate`.

### Playwright setup ([career-ops.org/docs/.../set-up-playwright](https://career-ops.org/docs/introduction/guides/set-up-playwright))

Required for the form-fill step above (and for `📄 Generate PDF` on
`#/cv` / `#/reports/:slug` / `#/evaluate` / `#/deep` /
`#/interview-prep` in this SPA). Without it the apply flow falls back
to WebFetch (text-only form preview, no click-fill).

```bash
# from the career-ops root
npm install
npx playwright install chromium

# Register the Playwright MCP so Claude Code can drive forms
claude mcp add playwright npx @playwright/mcp@latest

# Verify
npm run doctor
```

Alternative MCP registration via `.claude/settings.local.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

---

## 15. Interview preparation

This is the post-research, pre-interview phase. Three artifacts in
this app converge:

1. **Saved deep-research files** under `interview-prep/`, one per
   company-role pair you ran. Browse from the **Deep research** page
   or directly via `/api/interview-prep`.
2. **Patterns mode** (`#/patterns`) — generates a self-reflective
   prompt: "across my last N interviews / offers / rejections, what
   patterns hold?" Useful when you've accumulated 5+ tracker rows.
3. **Interview-prep mode** (`#/interview-prep`) — pre-fills a
   one-pager for a specific upcoming round (behavioral, technical,
   system design). Output goes into the same `interview-prep/`
   folder.

### Recommended workflow

For each interview you have on the books:

1. **Re-run Deep** (or open the saved file) the day before.
2. **`#/interview-prep`** — generate a one-pager for the specific
   round. Paste into your notes.
3. **System design / coding rounds** — open `#/training` and ask for
   a 30-minute targeted refresher on the specific subsystem the JD
   emphasizes.
4. **Compensation rounds** — open the deep-research file, jump to
   "Negotiation leverage points." Bring 2–3 specific data points
   (Glassdoor band, recent funding, comparable offer at another
   company).
5. **Behavioral rounds** — pull STAR+R stories from your `cv.md` that
   land in section B of the original Evaluate report.

After the interview, immediately:

1. Update the tracker row: status → `Responded` (then `Interview`,
   `Offer`, etc.).
2. Run `#/followup` to draft the thank-you email.
3. If you got new intel (compensation range, team makeup, tech stack
   surprise), edit the saved `interview-prep/<company>-<role>.md`
   with `## Post-round notes` so future-you has it.

---

## 16. Activity log + Troubleshooting

### Activity log (`#/activity`)

Audit trail of every state-changing request hitting the server.
Records: pipeline adds, tracker writes, CV saves, JD saves, evaluate
runs, deep-research runs, scan runs, config changes, mode runs.

Secrets (`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`) are redacted on the
way in; you'll never see a real key value in `data/activity.jsonl`.

Filter by action prefix (`pipeline.`, `cv.`, `evaluate`, `scan.`,
etc.). 25 rows per page; server returns up to 500 most-recent
events.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Health page red on `cv.md` | First run, file doesn't exist yet | `touch $CAREER_OPS_ROOT/cv.md` then refresh. |
| Health red on `Profile customized` | `candidate.full_name` still says `Jane Smith` | Edit `config/profile.yml`. |
| `hh.ru: HTTP 403` in scan log | Non-Russian IP, no `HH_USER_AGENT` | Register at `dev.hh.ru/admin`, set `HH_USER_AGENT` in `.env`. |
| `gemini-eval.mjs: ERR_MODULE_NOT_FOUND` | Parent project deps not installed | `cd $CAREER_OPS_ROOT && npm install`. |
| Generate PDF errors | Playwright not installed in parent | `cd $CAREER_OPS_ROOT && npx playwright install chromium`. |
| Server reports `EADDRINUSE: 4317` | Old instance still running | `pkill -f 'node server/index.mjs'` then restart. |
| Live LLM call hangs > 2 min | Prompt huge or Anthropic slow | Check `/api/health` Anthropic flag; the server soft-caps prompts at 200 KB and returns 413. |
| Pipeline preview shows `(unsafe redirect)` | Posting redirected to a private IP / loopback | This is a security feature (REVIEW-B1). The redirect target is rejected and the original URL is unchanged. |
| Tracker row text breaks the table | Pipe in company name pre-v1.9.1 | Update to v1.9.1+ — pipes are escaped end-to-end (BF-1). |
| `npm test` fails on fresh clone | Tests assume parent project layout | Use `CAREER_OPS_ROOT=$(mktemp -d)` and bootstrap fixtures. |

For deeper diagnostics: run **▶ Doctor** on the Health page, copy the
output, and search the issue tracker on
<https://github.com/Fighter90/career-ops-ui/issues>.
