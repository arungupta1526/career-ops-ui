# Help — career-ops-ui

A complete walkthrough of every page, from the moment you launch the
app to landing an interview. Each `##` heading below corresponds to a
sidebar entry or a phase of the workflow. Read top-to-bottom on first
run; jump to a specific section later via the table of contents in the
help sidebar.

> **Audience:** anyone who just dropped this UI inside a `career-ops`
> checkout and ran `bash bin/start.sh`. No prior career-ops knowledge
> assumed.

---

## 1. Quick start (5 minutes from zero)

The whole loop, end-to-end, in five minutes:

1. **Health** (`#/health`) — confirm every required check is green. If
   `cv.md`, `config/profile.yml`, or `portals.yml` are missing, the
   page tells you exactly which file to create.
2. **App settings** (`#/config`) — paste your `ANTHROPIC_API_KEY` and
   (optionally) `GEMINI_API_KEY`. Click **Save**. The keys are written
   to the parent project's `.env` so career-ops scripts pick them up
   too.
3. **Profile** (`#/profile`) — review `config/profile.yml` and replace
   the template name (`Jane Smith`) with your real one.
4. **CV** (`#/cv`) — paste or upload your résumé. Click **💾 Save** —
   the server-side sanitizer strips `<script>`, `javascript:` URLs,
   and `on*=` handlers before writing.
5. **Scan** (`#/scan`) — click **🌐 Scan** to crawl every enabled
   board (Greenhouse / Ashby / Lever for EN, hh.ru / Habr Career for
   RU). Live SSE log streams while it runs.
6. **Pipeline** (`#/pipeline`) — review the URLs the scanner queued.
   Click any entry to preview the JD on the right.
7. **Evaluate** (`#/evaluate`) — paste a JD (or click **▶ Evaluate**
   from the pipeline). With an Anthropic / Gemini key set, the model
   scores it 0–5 against your CV and the result lands in `reports/`.
8. **Tracker** (`#/tracker`) — every evaluation gets a row.
9. **Apply helper** (`#/apply`) — generates a submission checklist for
   the actual application step.
10. **Deep research** (`#/deep`) — once you decide to apply, run a
    company brief. Saved to `interview-prep/`.

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
```

A scanned vacancy passes when its title contains **at least one
positive** keyword AND **none of the negative** keywords. Tune both.

### `tracked_companies`

```yaml
tracked_companies:
  - { name: Stripe,     enabled: true, careers_url: https://job-boards.greenhouse.io/stripe }
  - { name: Linear,     enabled: true, careers_url: https://jobs.ashbyhq.com/linear }
  - { name: JetBrains,  enabled: true, careers_url: https://jobs.lever.co/jetbrains }
```

The EN scanner detects the ATS from the URL pattern
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

- Greenhouse / Ashby / Lever (the EN sweep) for every company in
  `tracked_companies` with a recognizable ATS URL.
- hh.ru API + Habr Career HTML for every query in `russian_portals`.

Live SSE log streams to the right pane while the scan runs. Click
**Stop** (or just navigate away) to abort — the server cancels
in-flight HTTPS requests via `AbortController`.

### Filtering results

Below the log, the results table renders rows from `data/last-scan.json`.

Filters:

- **Free text** — substring match against title / company.
- **Source** dropdown — Greenhouse / Ashby / Lever / hh.ru / Habr.
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

- ✓ green tag — direct API support (Greenhouse / Ashby / Lever).
- ○ gray tag — fallback to web-search prompt (no API match).

**Click the company name** → fills the results filter above with that
name. **Click the ↗ icon** → opens the company's `careers_url` in a
new tab.

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
