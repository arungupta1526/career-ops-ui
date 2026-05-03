# Help — career-ops-ui

A step-by-step walkthrough of every page. Feature names match what you see in the sidebar on the left.

---

## 1. Quick start

The whole loop, end-to-end, in five minutes:

1. **CV** (`#/cv`) — paste or upload your résumé in Markdown. Click **💾 Save**.
2. **Profile** (`#/settings`) — edit `config/profile.yml` so it has your name, email, target salary, location.
3. **Health** (`#/health`) — check that all required cards are green. Optional ones (Gemini / Anthropic / HH_USER_AGENT) only matter if you want to use those features.
4. **Scan** (`#/scan`) — click **🌐 Scan all** to crawl every enabled job board. Or paste a single URL via Ctrl+K → Enter.
5. **Pipeline** (`#/pipeline`) — review what the scanner queued. Click any URL to preview it on the right. Click **▶ Evaluate** to score it against your CV.
6. **Tracker** (`#/tracker`) — every evaluation lands here. Filter by score, status, or text. Generate a tailored PDF, send the application, then update the status.

---

## 2. CV (`#/cv`)

The source of truth for every evaluation.

**Buttons:**
- **📁 Upload CV** — pick a local `.md` / `.txt` / `.html` file. The file is loaded into the textarea; click **💾 Save** to persist it to `cv.md`.
- **sync-check** — runs `cv-sync-check.mjs` to flag inconsistencies between `cv.md` and your portfolio.
- **📄 Generate PDF** — streams `generate-pdf.mjs`. Output lands in `output/*.pdf` and shows up in the **Generated PDFs** section below the editor with **↗ Open** + **⬇ Download** buttons.
- **💾 Save** — writes the textarea to `cv.md`. Server-side sanitization strips `<script>`, `on*=` handlers, `javascript:` URIs (defense-in-depth).

**Live preview** on the right mirrors the textarea as you type.

---

## 3. Profile (`#/settings` — also reachable as `#/profile`)

Shows `config/profile.yml` parsed and rendered. Edit the file directly on disk; the page picks up changes on reload. The Health page surfaces a **Profile customized** check that flags template defaults like `Jane Smith` — replace it with your real name.

---

## 4. Scan (`#/scan`)

Crawls every enabled job board, deduplicates against `data/scan-history.tsv`, and writes hits into `data/last-scan.json`.

**Button:** **🌐 Scan** — runs every enabled source in one go (Greenhouse / Ashby / Lever for EN, hh.ru + Habr Career for RU). Note: hh.ru returns 403 from non-RU IPs without a real-browser User-Agent — set `HH_USER_AGENT` in `.env` (or via the App settings page).

**Filters** (results table): text, remote/hybrid/relocation, source (Greenhouse / Ashby / Lever / hh.ru / Habr), plus chip filters by detected tech / level. Click a chip to narrow; click "сбросить" / "clear" to reset.

**Active companies** at the bottom — click the toggle to expand a filterable list. ✓ green tags are scanned via direct API; ○ gray tags fall back to web-search prompts.

---

## 5. Pipeline (`#/pipeline`)

Inbox of URLs waiting to be evaluated.

**Add a URL:** type or paste it into the input + click **+ Add**, OR press Ctrl+K to focus the global search and paste any `http(s)://…` link → Enter. Invalid URLs return 400 (FIX-M3 + M7).

**Row actions:**
- Click the URL row to load a **server-side proxied preview** in the right pane (HTML scripts/styles stripped, capped at 8 KB).
- **▶** — jump to `#/evaluate?url=…` with the URL pre-filled.
- **✕** — delete from `data/pipeline.md`.

**Top-right buttons:** **⚡ Evaluate first** opens the first queued URL on Evaluate; **Scan** sends you back to the scanner.

**Filter:** type to narrow the list live; counter shows visible/total.

---

## 6. Evaluate (`#/evaluate`)

Scores a single Job Description against `cv.md` and `config/profile.yml`.

1. Paste the JD into the textarea (or arrive here from `#/pipeline` with `?url=…`).
2. Click **▶ Evaluate**.
3. Without `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` you get a **manual prompt** to paste into Claude Code (which has WebFetch). With either key set, the run executes server-side and renders Markdown back into the page.
4. Save the JD via **💾 Save JD** for the audit trail (`jds/*.txt`).
5. Output renders block-by-block (Role Summary, CV Match, Risks, Compensation, Strategy, Verdict, Posting Legitimacy) plus a 0-5 score.

---

## 7. Deep research (`#/deep`)

Company brief: team, culture, news, negotiation leverage, smart questions.

1. Fill **Company** (required) + **Role** (optional).
2. **⚡ Run live** (when `ANTHROPIC_API_KEY` or `GEMINI_API_KEY` is set) executes the prompt server-side and saves the result to `interview-prep/{slug}.md`.
3. Without a key: **▶ Generate prompt** then **Show result** if you want to retry execution after setting the key.
4. Saved research shows up as cards above; click any to re-load in the result pane.
5. Each result has 📋 **Copy** / ⬇ **Download .md** / ↗ **Open in tab**.

---

## 8. Apply checklist (`#/apply`)

Fills a paste-ready checklist for a specific posting. **Real form-fill is in Claude Code only:** `/career-ops apply <url>` — the page banner is the constant reminder. Clicking **▶ Generate checklist** still gives you copy-pasteable text for: cover letter prompt, Why-us answer, EEO/sponsorship/start-date answers, last sanity checks before Submit.

---

## 9. Tracker (`#/tracker`)

The application ledger — `data/applications.md` rendered as a sortable table.

**Columns:** #, Date, Company, Role, Score, Status, PDF, Report link, Notes.

**Filters:** dropdown by status, dropdown by score band (≥4 / ≥3 / <3), free-text by company/role.

**Top buttons:** **Normalize** (canonicalizes statuses against `templates/states.yml`), **Dedup** (collapses same company+role), **Merge TSV** (pulls in `batch/tracker-additions/*.tsv` from batch runs).

**Adding a row from the UI:** `POST /api/tracker` (FIX-H8) — typically wired in via the Reports / Pipeline pages.

---

## 10. Reports (`#/reports`)

List of every generated A-G report under `reports/`. Click one to render the Markdown (XSS-safe via FIX-C10). Each row carries the company + role + score from the report header.

---

## 11. Modes (`#/project`, `#/training`, `#/followup`, `#/batch`, `#/contacto`, `#/interview-prep`, `#/patterns`)

Seven specialized prompt builders, each backed by a template in `modes/{slug}.md`. They all share the same UX:

1. Fill the form (every page has its own fields — see placeholders).
2. **▶ Generate prompt** — prepares a structured prompt against `cv.md` + `profile.yml` + the mode template.
3. **⚡ Run live (Anthropic/Gemini)** — appears when an API key is set; executes the prompt and renders Markdown back into the page.
4. **Show result** — re-submits the same form with `run: true` so you can hit it after generating the prompt for an inline answer.
5. Each result has 📋 **Copy** / ⬇ **Download .md**.

| Mode | What it produces |
|---|---|
| **Project** | Scope + signal-fit feedback for a portfolio idea before you build it. |
| **Training** | Decide if a course / certification is worth your time given your goals. |
| **Follow-up** | Per-application cadence: when to nudge, what to say, when to drop. |
| **Batch** | Prompt for `batch/run.mjs` — parallel-evaluate a list of URLs. |
| **Outreach (Contacto)** | LinkedIn outreach: find the right contact + draft the message. |
| **Interview prep** | Stage-specific prep (recruiter screen / system design / behavioural / final). |
| **Patterns** | Spot recurring weak points across past applications. |

---

## 12. Activity (`#/activity`)

Audit log of every state-changing API call. JSONL at `data/activity.jsonl`.

**Filters:** chip filters by action prefix (pipeline / cv / jd / evaluate / scan / stream / script). ✓/✗ badge per row indicates HTTP success.

Auto-rotates at 5 MB; the latest half survives.

---

## 13. Health (`#/health`)

Setup diagnostics — green = ready, yellow = optional miss, red = required miss.

**Required:** Node ≥ 18, project root, `cv.md`, `config/profile.yml`, `portals.yml`, `data/applications.md`, `data/pipeline.md`, `modes/oferta.md`.

**Optional:** `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `HH_USER_AGENT`, Playwright (parent), parent project deps, `Profile customized` (flags `Jane Smith` placeholders), `data/`, `reports/`, `output/`, `jds/` directories.

**Top buttons:** **Doctor** (alias of `node doctor.mjs`), **Verify** (alias of `verify-pipeline.mjs`).

---

## 14. Setup hints

- **`.env`** — copy from `.env.example`. Set `ANTHROPIC_API_KEY` (preferred) or `GEMINI_API_KEY` to enable live execution. Set `HH_USER_AGENT` for hh.ru scans from non-RU IPs.
- **Language switcher** in the sidebar footer — 8 locales (`en` / `es` / `pt-BR` / `ko` / `ja` / `ru` / `zh-CN` / `zh-TW`). Choice persists in localStorage.
- **Ctrl+K** focuses the global search. Paste a job URL → Enter → it lands in the pipeline. Type any text → Enter → goes to the tracker filter.
- **Esc** closes any open modal.
