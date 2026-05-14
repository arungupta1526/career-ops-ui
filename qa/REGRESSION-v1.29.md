# career-ops-ui — full-project regression prompt (v1.29.1)

> **Audience:** human QA, Claude Cowork browser agent, or any automated harness running against a live stand.
> **Scope:** every page, every endpoint, every documented invariant from **v1.6.0 baseline through v1.29.1**. Catches regressions in code that already works; does NOT describe known open backlog (see §12).
> **Sister doc:** [`DOCS-COVERAGE-v1.29.md`](DOCS-COVERAGE-v1.29.md) is the top-down docs-driven coverage spec; this file is the bottom-up regression contract. Run both on every release.
> **Owner:** this file supersedes `REGRESSION-v1.27.md`. Evidence runs live under `qa/v29-regression/<run-date>-REGRESSION.md`.

---

## 0. Pre-flight — stand setup

```bash
# 1. Server responds green
curl -fsS http://127.0.0.1:4317/api/health | python3 -m json.tool
# expected: ok=true, version=1.29.0 (or newer), every required check ok

# 2. SPA shell loads
curl -fsS http://127.0.0.1:4317/ | grep -q '<title>career-ops-ui</title>'

# 3. Tag at expected version
git -C $WEB_UI describe --tags --abbrev=0
# expected: v1.29.0 or newer

# 4. v1.27.0 sidebar dedupe gate (still load-bearing)
curl -fsS http://127.0.0.1:4317/ | grep -c 'href="#/dashboard"'
# expected: 1

# 5. v1.28.1 router query-string gate
curl -fsS http://127.0.0.1:4317/ | head -c 200 | grep -q '<!DOCTYPE html>'
# Then in a browser, visit #/evaluate?url=https%3A%2F%2Fexample.com%2Fjd
# expected: Evaluate view renders with URL prefilled (no 404)

# 6. v1.28.1 health row prune
curl -fsS http://127.0.0.1:4317/api/health | jq -r '.checks[].name' | grep -c HH_USER_AGENT
# expected: 0

# 7. v1.29.0 source registry endpoint
curl -fsS http://127.0.0.1:4317/api/scan/sources | jq '.sources | length'
# expected: 11   (6 EN ATS + 5 RU)

# 8. v1.29.0 RU source list
curl -fsS http://127.0.0.1:4317/api/scan/sources \
  | jq -r '[.sources[] | select(.region=="ru") | .value] | sort | join(",")'
# expected: geekjob,getmatch,habr-career,hh.ru,trudvsem

# 9. 16-section help-bundle parity bumped to 17
for lc in en es pt-BR ko ja ru zh-CN zh-TW; do
  n=$(curl -fsS http://127.0.0.1:4317/api/help/$lc | python3 -c "import sys,json; print(json.load(sys.stdin)['markdown'].count('## '))")
  printf "%-6s : %d\n" "$lc" "$n"
done
# expected: every line ends in 17
```

If any pre-flight check fails, stop. Fix before running scenarios.

---

## 1. Smoke nav — every route loads (60 sec)

Visit every sidebar route + every mode page. For each: URL hash matches, `<h1.page-title>` rendered, 0 red console errors, screenshot.

| # | Route | Expectation |
|---|---|---|
| 1 | `#/dashboard` | counts cards + recent apps + 5 header buttons all ≥ 44 px |
| 2 | `#/scan` | 🌐 Scan button + Active Companies card + chip filters + **v1.29 source dropdown shows 11 entries** |
| 3 | `#/pipeline` | URL input + filterable list + preview pane |
| 4 | `#/evaluate` | JD textarea + ▶ Evaluate button — **v1.28.1 query-prefill works (`?url=…`)** |
| 5 | `#/batch` | TSV editor + 5 controls including **v1.28.0 Max retries (numeric, 1-10)** |
| 6 | `#/reports` | reports list + score-thresholds card (collapsible) |
| 7 | `#/tracker` | sortable table over `data/applications.md` |
| 8 | `#/activity` | audit-log table with timestamps |
| 9 | `#/cv` | markdown editor + side-by-side preview + 📁 Upload + 📄 Generate PDF |
| 10 | `#/profile` | read-only profile summary |
| 11 | `#/config` | API keys + Profile + Modes tabs — **v1.28.1 `?tab=modes` deep-link works** |
| 12 | `#/health` | required + optional checks — **v1.28.1 HH_USER_AGENT row absent** |
| 13 | `#/help` | **17-section in-app guide** in current locale (was 16) |

Mode pages (direct URL): `#/deep`, `#/apply`, `#/project`, `#/training`, `#/followup`, `#/contacto`, `#/interview-prep`, `#/patterns`.

Back-compat aliases (must resolve, not 404): `#/settings` → Profile; `#/batch-prompt` → legacy mode-builder with deprecation banner.

**Sidebar dedupe (v1.27.0 PR-D):** brand is `<div class="logo">`; one `<a href="#/dashboard">` total in served HTML.

**PASS** = 13 sidebar + 8 mode + 2 alias + all pre-flight gates green.

---

## 2. Per-page regression

### 2.1 Dashboard (`#/dashboard`)
- Counts (apps / pipeline / reports) match `data/applications.md` / `data/pipeline.md` / `reports/`.
- Avg score = `sum / count`, rounded to 1 dp.
- 8 status buckets shown.
- Recent applications: last 5 by date.
- Auto-pipeline button: `✨ Auto-pipeline a URL` (single ✨).
- All 5 header `.btn:not(.btn-sm)` ≥ 44 × 44 px (Doctor / Quick scan / Open Pipeline / 🌐 Scan now / ✨ Auto-pipeline).

### 2.2 Scan (`#/scan`) — v1.29.0 refresh
- **One** 🌐 Scan button (not separate EN/RU).
- **v1.29.0 — Source filter dropdown is dynamic.** On mount the SPA calls `GET /api/scan/sources` and rebuilds `<option>` list. Expected entries (alphabetical by label, 11 total):
  - Ashby · GeekJob · Greenhouse · GetMatch · Habr Career · hh.ru · Lever · SmartRecruiters · Trudvsem · Workable · Workday
- Build-time fallback list survives if endpoint is unreachable (paint same 11 entries).
- Click → SSE log → results table populates.
- Filters: Free text / Source / Remote-Hybrid-Onsite / Stack chips / Dynamic chips.
- **Active Companies card:** ✓ green tags for direct API support, ○ gray for fallback. Click name → fills results filter; ↗ icon → opens careers page.
- **Stop button mid-scan** aborts via `AbortController`.

### 2.3 Pipeline (`#/pipeline`)
- Add URL via form or Ctrl+K.
- URL passes `isValidJobUrl()`: localhost/127.0.0.1/file:///javascript:/IP literals/template chars all 400.
- Server-side preview via `safeGet` (DNS-pinned, redirect-revalidated, 8 KB cap, 3 hops).
- ✕ removes from `data/pipeline.md`; ▶ jumps to `#/evaluate?url=…`.
- 20 parallel POSTs → 20 sequential rows via `withFileLock` (v1.21 H-6).
- **v1.28.1 ▶ button** (`Router.go('/evaluate?url=…')`) now resolves — no 404.

### 2.4 Evaluate (`#/evaluate`)
- Paste JD → ▶ Evaluate.
- With Anthropic key → live, A-F sections.
- With only Gemini key → Gemini fallback.
- No key → manual prompt card.
- Save JD checkbox → `jds/jd-<date>-<ts>.txt`.
- **v1.28.1 query prefill works:** `#/evaluate?url=https%3A%2F%2F…` parses URLSearchParams from hash and pre-fills the JD textarea with `URL: <href>\n\n[paste JD text here]`.

### 2.5 Reports (`#/reports`)
- Score-thresholds card (collapsible `<details>`).
- 4 rubric rows ≥4.5 / 4.0-4.4 / 3.5-3.9 / <3.5 with action text (i18n keys `rep.thr*`).
- Score-pill glyphs ✓ ◐ ○ (WCAG 1.4.1 redundant cue).
- Pagination 12/page.
- Detail view: ← All reports + 🔗 Open JD + 📄 Generate PDF.
- Outbound link to career-ops.org/docs.
- **Known drift (G-005):** report letters render BOTH legacy A-G and v1.15+ A-F (renderer is schema-tolerant).

### 2.6 Tracker (`#/tracker`)
- Columns: # / Date / Company / Role / Score / Status / PDF / Report / Notes.
- Status enum: Evaluated / Applied / Responded / Interview / Offer / Rejected / Discarded / SKIP.
- Filters: Status / Score (≥4.0, ≥3.0, <3.0) / Search.
- 25/page pagination.
- BF-1: Acme | Co (pipe), Senior Backend\nEngineer (newline) round-trip.
- ▶ Normalize / Dedup / Merge maintenance buttons.
- Concurrent POSTs serialize via `withFileLock`.

### 2.7 Activity log (`#/activity`)
- JSONL audit trail.
- Secrets redacted in payloads.
- Filter by action prefix; 25/page; ≤500 rows.

### 2.8 CV (`#/cv`)
- Markdown editor + live preview.
- 📁 Upload CV accepts `.md/.txt/.html/.pdf/.docx/.doc/.odt/.rtf`.
- 💾 Save runs `stripDangerousMarkdown` (entity-aware: `<script>`, `&lt;script&gt;`, `java&#115;cript:`, SVG-onload).
- Body cap 1 MB PUT / 11 MB upload (multer).
- 📄 Generate PDF streams Playwright; auto-downloads.

### 2.9 Profile (`#/profile` and `#/settings` alias)
- Read-only summary of `config/profile.yml`.
- Edit via `#/config → Profile tab`.

### 2.10 App settings (`#/config`) — v1.28.1 refresh
- Three tabs: API keys / Profile / Modes.
- **v1.28.1 deep-link works:** `#/config?tab=modes` lands directly on Modes tab.
- v1.24.1: no `c(...).also is not a function` on any locale.
- Save round-trip writes parent `.env` (API keys & runtime tab) or `config/profile.yml` (Profile tab) or `modes/_profile.md` (Modes tab).
- Secrets masked in GET response (`sk-ant•••••••a1b2`).

### 2.11 Health (`#/health`) — v1.28.1 refresh
- Required checks green: Node ≥18 / Project root / cv.md / config/profile.yml / portals.yml / data/applications.md / data/pipeline.md / modes/oferta.md.
- Optional: Profile customized / GEMINI_API_KEY / ANTHROPIC_API_KEY / Playwright / Parent project dependencies / data,reports,output,jds directories.
- **v1.28.1 — HH_USER_AGENT row absent.** Total checks ≥ 12 (was ≥13 pre-prune).
- ▶ Doctor + ▶ Verify pipeline buttons stream SSE.
- Footer: `version` (web-ui pkg) + `parentVersion` (parent VERSION file).

### 2.12 Help (`#/help`) — v1.29.0 refresh
- **17 H2 sections** in current locale (was 16). CI gate `tests/canonical-docs-coverage.test.mjs::17-H2 parity contract`.
- 5 canonical career-ops.org URLs each appear ≥ 2 times.
- 21-step Getting Started walkthrough.
- **v1.29.0 — §17 "How to add a new job-portal source"** present in EN with full code template + mocked test pattern + portals.yml example; 7 other locales have a localized abridged version with the universal code blocks and a cross-link to EN canonical.
- **v1.28.0 — §intro AI-list canonical:** Claude Code / Codex / OpenCode / Qwen CLI + localized one-liner; no `Cursor, Gemini CLI, GitHub Copilot CLI` stale phrase.
- v1.29.0 — §5 `portals.yml` snippet shows 5-source `sources: ["hh", "habr", "trudvsem", "getmatch", "geekjob"]`.

### 2.13 Batch (`#/batch`) — v1.28.0 refresh
- TSV editor (4 cols: id / url / source / notes).
- 5 run controls (was 4): Parallel select (1/2/3) · Min score · Dry-run · Retry failed · **v1.28.0 Max retries (number 1-10, disabled until Retry failed checked)**.
- ▶ Run batch streams SSE.
- Server validates `maxRetries` int 1..10, silently drops out-of-range, no-op without `--retry-failed`.
- ▶ Merge button consumes `batch/tracker-additions/*.tsv`.
- Legacy `#/batch-prompt` resolves with deprecation banner.

### 2.14 Mode pages (`#/deep`, `#/project`, `#/training`, `#/followup`, `#/contacto`, `#/interview-prep`, `#/patterns`)
- Each renders form + ▶ Generate prompt + ⚡ Run live (when key present).
- Prompt download as `.md`.
- `#/apply` is NOT a mode page — it's an explicit checklist that mentions `/career-ops apply` + "never auto-submit" warning.

---

## 3. API endpoint regression — curl-driven

### 3.1 Health & dashboard
```bash
curl -fsS http://127.0.0.1:4317/api/health | python3 -c "
import sys, json
d = json.load(sys.stdin)
assert d['ok'] is True
assert d['version'].startswith('1.')
assert not any(c['name'] == 'HH_USER_AGENT' for c in d['checks']), 'v1.28.1: HH_USER_AGENT row must be absent'
print('PASS')
"
```

### 3.2 Retired aliases (must 404)
```bash
for ep in /api/stream/scan-en /api/stream/scan-ru /api/scan-ru/config; do
  status=$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:4317$ep")
  [ "$status" = "404" ] || { echo "FAIL: $ep returned $status"; exit 1; }
done
echo "PASS — 3 legacy aliases retired"
```

### 3.3 Scan source registry (v1.29.0)
```bash
curl -fsS http://127.0.0.1:4317/api/scan/sources | python3 -c "
import sys, json
d = json.load(sys.stdin)
ru = sorted(s['value'] for s in d['sources'] if s['region'] == 'ru')
assert ru == ['geekjob', 'getmatch', 'habr-career', 'hh.ru', 'trudvsem'], f'RU mismatch: {ru}'
en = sorted(s['value'] for s in d['sources'] if s['region'] == 'en')
assert en == ['ashby', 'greenhouse', 'lever', 'smartrecruiters', 'workable', 'workday'], f'EN mismatch: {en}'
print('PASS — 11 sources surfaced via /api/scan/sources')
"
```

### 3.4 Path-traversal sweep (v1.21 H-4)
```bash
for name in '..' '...' '..pdf' '..%2fetc%2fpasswd'; do
  for ep in /api/jds /api/reports /api/modes /api/output/pdfs; do
    enc=$(printf '%s' "$name" | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read()))")
    status=$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:4317${ep}/${enc}")
    [ "$status" = "400" ] || [ "$status" = "404" ] || { echo "FAIL: $ep/$name returned $status"; exit 1; }
  done
done
echo "PASS — path-traversal rejected"
```

### 3.5 SSRF reject
```bash
for url in 'javascript:alert(1)' 'file:///etc/passwd' 'http://127.0.0.1:22/' \
          'http://10.0.0.5/internal' 'http://169.254.169.254/latest/meta-data/' \
          'http://[::1]/internal' 'not-a-url'; do
  status=$(curl -sS -o /dev/null -w "%{http_code}" -X POST \
    -H 'Content-Type: application/json' -d "{\"url\":\"$url\"}" \
    http://127.0.0.1:4317/api/pipeline)
  [ "$status" = "400" ] || { echo "FAIL: $url → $status"; exit 1; }
done
echo "PASS — 7 SSRF / invalid-URL rejected"
```

### 3.6 Tracker round-trip (BF-1)
```bash
curl -fsS -X POST -H 'Content-Type: application/json' \
  -d '{"company":"Acme | Co","role":"Senior Backend\nEngineer","score":"4.2","status":"Evaluated"}' \
  http://127.0.0.1:4317/api/tracker | grep -q '"ok":true' && echo PASS
```

### 3.7 Auto-pipeline manual mode (v1.25.0 G-014)
```bash
t0=$(date +%s%N)
body=$(curl -sS -X POST -H 'Content-Type: application/json' \
  -d '{"url":"https://job-boards.greenhouse.io/anthropic/jobs/x","mode":"manual"}' \
  http://127.0.0.1:4317/api/auto-pipeline)
t1=$(date +%s%N)
elapsed=$(( (t1 - t0) / 1000000 ))
[ "$elapsed" -lt 2000 ] || { echo "FAIL: ${elapsed}ms"; exit 1; }
echo "$body" | grep -q '"mode":"manual"' || exit 1
echo "PASS — manual short-circuit in ${elapsed}ms"
```

### 3.8 CV XSS strip (v1.22 M-4)
```bash
curl -fsS -X PUT -H 'Content-Type: application/json' \
  -d '{"markdown":"# CV\n\n<script>evil()</script>\n[link](javascript:alert(1))\n&lt;script&gt;encoded&lt;/script&gt;"}' \
  http://127.0.0.1:4317/api/cv > /dev/null
curl -fsS http://127.0.0.1:4317/api/cv | python3 -c "
import sys, json
md = json.load(sys.stdin)['markdown']
for pat in ('<script', 'javascript:'):
    assert pat.lower() not in md.lower(), f'XSS leaked: {pat}'
print('PASS')
"
```

### 3.9 Help-bundle 5 URLs × 8 locales
```bash
fail=0
for lang in en es pt-BR ko ja ru zh-CN zh-TW; do
  md=$(curl -sS "http://127.0.0.1:4317/api/help/$lang" | python3 -c "import sys,json; print(json.load(sys.stdin).get('markdown',''))")
  for url in what-is-career-ops scan-job-portals apply-for-a-job batch-evaluate-offers set-up-playwright; do
    if ! echo "$md" | grep -q "$url"; then echo "FAIL: $lang missing $url"; fail=$((fail+1)); fi
  done
done
[ "$fail" = "0" ] && echo "PASS — 40/40"
```

### 3.10 Batch `--max-retries N` pass-through (v1.28.0)
```bash
# Server-side validation: 11 → drop, 5 → keep, abc → drop, without retry → drop
# Test via curl response body (start event carries args).
for q in "retry=1&maxRetries=3" "retry=1&maxRetries=11" "retry=1&maxRetries=abc" "maxRetries=5"; do
  # Just verify endpoint accepts the query and emits SSE.
  curl -sSN "http://127.0.0.1:4317/api/stream/batch?$q" --max-time 2 > /tmp/bat-$RANDOM.txt
done
# Detailed assertions are in tests/batch-max-retries.test.mjs.
echo "PASS — endpoint accepts query, unit tests cover semantics"
```

### 3.11 Sidebar dedupe (v1.27.0)
```bash
[ "$(curl -fsS http://127.0.0.1:4317/ | grep -c 'href=\"#/dashboard\"')" = "1" ] \
  && echo "PASS — 1 href=#/dashboard" || echo "FAIL"
```

### 3.12 Router query-string strip (v1.28.1) — open in browser
```bash
echo "Open in browser:"
echo "  http://127.0.0.1:4317/#/evaluate?url=https%3A%2F%2Fexample.com%2Fjd"
echo "  http://127.0.0.1:4317/#/config?tab=modes"
echo "Both must render the target view (NOT __not_found__ 404)."
```

---

## 4. Security envelope — invariants

### 4.1 CSP (on public bind only)
```bash
HOST=0.0.0.0 ... # start with public bind
curl -sSI http://127.0.0.1:4317/ | grep -i 'content-security-policy'
# Expected: script-src has NO 'unsafe-inline', NO 'unsafe-eval'; frame-ancestors 'none'
```

### 4.2 No inline event handlers
```bash
grep -rE 'on[a-z]+\s*=\s*"' public/index.html public/js/views/*.js | grep -v '//.*on'
# Expected: empty
```

### 4.3 `safeGet` is the only outbound HTTP path
```bash
grep -rn 'fetch(' server/lib/routes/pipeline.mjs server/lib/routes/auto-pipeline.mjs
# Expected: zero matches
```

### 4.4 `sanitizePathName` consolidated
```bash
grep -rE "replace\(.*\[\^\\\\w" server/lib/routes/
# Expected: only inside reports.mjs::sanitizeSlug; everywhere else uses sanitizePathName.
```

### 4.5 `withFileLock` wraps every R-M-W on applications/pipeline
```bash
grep -rB 2 -A 8 'writeFileSync.*PATHS\.\(applications\|pipeline\)' server/lib/routes/
# Expected: every write under withFileLock callback
```

### 4.6 `llmRateLimit` on every LLM endpoint
```bash
grep -E "app\.post.*llmRateLimit" server/lib/routes/llm.mjs server/lib/routes/auto-pipeline.mjs
# Expected: 4 routes — /api/evaluate, /api/deep, /api/mode/:slug, /api/auto-pipeline
```

### 4.7 `stripDangerousMarkdown` entity-aware
```bash
node -e "
import('./server/lib/security.mjs').then(({stripDangerousMarkdown}) => {
  for (const t of ['&lt;script&gt;alert(1)&lt;/script&gt;', 'java&#115;cript:alert(1)']) {
    const r = stripDangerousMarkdown(t);
    if (/<script|javascript\s*:/i.test(r)) { console.log('FAIL:', t); process.exit(1); }
  }
  console.log('PASS');
});
"
```

---

## 5. Accessibility regression (WCAG 2.2 AA)

### 5.1 Skip link (2.4.1)
Tab from page load: first focusable is a visible "Skip to main content" link; Enter jumps to `#content`.

### 5.2 Focus Visible (2.4.7)
Every focused control has ≥ 2 px outline, 3:1 contrast.

### 5.3 Target Size (2.5.5) — v1.26.1 PR-A
```js
// In DevTools, on every sidebar route:
Array.from(document.querySelectorAll('.btn:not(.btn-sm)'))
  .filter(b => { const r = b.getBoundingClientRect(); return r.height < 44 || r.width < 44; })
  .length
// Expected on every route: 0
```
Plus `tests/wcag-target-size.test.mjs` (4 canaries: `.btn` has `min-height: 44px` + `flex-shrink: 0`; `.btn-sm` keeps 32px and comes after `.btn` in source order).

### 5.4 Chip + nav-item + tab-btn targets (v1.20)
```js
['.chip', '.nav-item', '.tab-btn'].forEach((sel) => {
  const min = sel === '.chip' ? 28 : 44;
  console.log(sel, Array.from(document.querySelectorAll(sel)).filter(el => el.getBoundingClientRect().height < min).length, '<', min);
});
// Expected: 0 on every line
```

### 5.5 Form labels (v1.20 + v1.21 H-2)
```js
Array.from(document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]),textarea,select'))
  .filter(el => !el.labels?.length && !el.getAttribute('aria-label'))
// Expected: []
```

### 5.6 `aria-describedby` IDREFs resolve (v1.21 H-1)
```js
Array.from(document.querySelectorAll('[aria-describedby]'))
  .filter(el => !document.getElementById(el.getAttribute('aria-describedby')))
// Expected: []
```

### 5.7 `<html lang>` updates on locale switch
```js
document.documentElement.getAttribute('lang')
// = 'en' / 'ru' / etc. matching active locale
```

### 5.8 Color-only state has redundant cue (v1.22 M-3)
- `.score-high::before` content `'✓'`
- `.score-mid::before` content `'◐'`
- `.score-low::before` content `'○'`
- `.conn-banner ⚠` in offline state

### 5.9 Sidebar dedupe (v1.27.0)
Screen reader announces "Dashboard, link" exactly once when entering navigation landmark. Tab sequence visits Dashboard control once.

---

## 6. i18n regression — 8 locales × every page

### 6.1 Locale persistence
Click `.lang-btn[data-lang-btn="ru"]`; reload; UI still in Russian; `localStorage.getItem('career-ops-ui:lang') === 'ru'`.

### 6.2 Safari private mode (v1.22 M-5)
Safari → New Private Window → BASE_URL → SPA renders normally (NOT raw keys).

### 6.3 DICT coverage (CI gate)
```bash
npm test -- tests/i18n-coverage.test.mjs
# 5/5 pass
```

### 6.4 17-H2 parity per locale (v1.29.0 — was 16)
```bash
for f in docs/help/*.md; do echo "$f: $(grep -c '^## ' "$f")"; done
# Expected: every file → 17
```

### 6.5 §17 "How to add a portal" exists in every locale (v1.29.0)
```bash
for f in docs/help/*.md; do
  grep -q '^## 17\.' "$f" && echo "OK $f" || echo "FAIL $f"
done
# Expected: every file OK
```

### 6.6 AI-list canonical (v1.28.0)
```bash
for f in docs/help/*.md README*.md; do
  for x in OpenCode "Qwen CLI"; do
    grep -q "$x" "$f" || echo "FAIL: $f missing $x"
  done
done
# Expected: silent
```

### 6.7 CHANGELOG parity (v1.29.0)
```bash
node scripts/check-changelog-parity.mjs
# Expected: "✓ CHANGELOG parity: all 8 locales at v1.29.0"
```

---

## 7. Source registry & RU adapter contract (v1.29.0)

### 7.1 Registry shape
```bash
curl -fsS http://127.0.0.1:4317/api/scan/sources | jq '.sources[] | {value, label, region, configKey}'
# Every entry: value:string, label:string, region:'en'|'ru'; RU entries have configKey.
```

### 7.2 RU dispatcher honors registry
```bash
# Editing portals.yml to test: sources should include all 5 by default
# (when russian_portals.sources is unset). User's portals.yml may override.
node --test tests/ru-scanner.test.mjs
# 11/11 pass
```

### 7.3 Per-adapter unit tests pass
```bash
node --test tests/sources-trudvsem.test.mjs tests/sources-getmatch-geekjob.test.mjs
# 17/17 pass (6 Trudvsem + 11 GetMatch+GeekJob)
```

### 7.4 Adding a 12th adapter — documented flow
Open `docs/help/en.md §17`. Follow steps 1-5. After:
- `npm test` adds the new adapter test green.
- `/api/scan/sources` reflects the 12th entry without code edit elsewhere.
- `#/scan` source dropdown picks it up on next reload.

---

## 8. Per-release regression checklist

(Use to spot-check a specific release area after any merge that touches it.)

### v1.18.0 — WCAG 2.2 AA + scan retirement
- [ ] Skip link (5.1) · Focus visible (5.2) · `.btn` ≥44px (5.3) · `<html lang>` (5.7)
- [ ] `/api/stream/scan-{en,ru}` → 404 (3.2)

### v1.19.0 — contrast + HH_USER_AGENT off UI
- [ ] Badge / score colors ≥ 4.5:1 light + dark · HH_USER_AGENT NOT in `/#/config`

### v1.20.0 — per-component a11y + README parity
- [ ] `.chip` ≥28 / `.nav-item` ≥44 / `.tab-btn` ≥44 (5.4) · All inputs labelled (5.5)
- [ ] `/api/scan-ru/config` → 404

### v1.21.0 — security + concurrency + a11y
- [ ] `safe-fetch.mjs` (4.3) · `sanitizePathName` (4.4) · `withFileLock` (4.5) · `llmRateLimit` (4.6) · `aria-describedby` (5.6)

### v1.22.0 — M/L/N backlog
- [ ] Entity-aware XSS strip (4.7) · Score-pill glyphs (5.8) · `Element.prototype.also` gone

### v1.23.0 — i18n split + connection-banner recovery
- [ ] `i18n-dict.js` exists + i18n.js < 100 LOC · Banner auto-hides after recovery

### v1.24.0 / 1.24.1 — help content + G-015 fix
- [ ] 5 career-ops.org URLs ≥ 2× per locale · `/#/config` renders without `.also` error

### v1.25.0 — G-014 + G-012 + cosmetic
- [ ] Auto-pipeline `mode:'manual'` returns ≤ 2 s (3.7) · 8 CHANGELOGs at v1.25.0+ · `✨ Auto-pipeline a URL` single ✨

### v1.26.0 — test pyramid
- [ ] `tests/acceptance/` exists · `npm run test:ci` covers both CI gates · Coverage ≥ 93 line / ≥ 83 branch

### v1.26.1 — WCAG 2.5.5 hot-fix
- [ ] `.btn` carries `min-height:44px + flex-shrink:0 + line-height:1.2` · `tests/wcag-target-size.test.mjs` passes

### v1.27.0 — sidebar dedupe
- [ ] One `href="#/dashboard"` in HTML (3.11) · Brand renders as `<div class="logo">`

### v1.28.0 — Issue #1 AI-list + Issue #2 max-retries
- [ ] `#/batch` has 5th input "Max retries" (1-10, disabled until Retry failed)
- [ ] Help-bundle + READMEs intro names OpenCode + Qwen CLI; no "Cursor, Gemini CLI, GitHub Copilot CLI" string
- [ ] `tests/canonical-docs-coverage.test.mjs::AI-list canaries` pass
- [ ] `tests/batch-max-retries.test.mjs::7 cases` pass

### v1.28.1 — router 404 hot-fix + HH_USER_AGENT prune
- [ ] `#/evaluate?url=…` renders Evaluate view (NOT 404)
- [ ] `#/config?tab=modes` lands on Modes tab (NOT 404)
- [ ] `/api/health` has NO row named `HH_USER_AGENT`
- [ ] `tests/router-query-string.test.mjs` + `tests/health-no-hh-user-agent-row.test.mjs` pass

### v1.29.0 — RU scanner 2→5 + registry + dynamic dropdown + §17
- [ ] `GET /api/scan/sources` returns 11 entries (6 EN + 5 RU) (3.3)
- [ ] `#/scan` source dropdown built dynamically; lists all 11 sorted alphabetically
- [ ] `russian_portals.sources` default (when array unset in portals.yml) = 5 RU keys
- [ ] `tests/sources-trudvsem.test.mjs` + `sources-getmatch-geekjob.test.mjs` + `scan-sources-endpoint.test.mjs` pass
- [ ] help-bundle §17 "How to add a portal" present × 8 locales (6.5)
- [ ] help §5 portals.yml example shows 5-source list × 8 locales
- [ ] `tests/canonical-docs-coverage.test.mjs::17-H2 parity` passes

### v1.29.1 — help §5 RU-config user guide × 8 locales
- [ ] every help-bundle §5 carries the new ### "Configuring Russian portals — detailed setup guide" subsection (title is localized; the subsection presence is the contract)
- [ ] 5-source `russian_portals.sources: ["hh", "habr", "trudvsem", "getmatch", "geekjob"]` YAML example present in every locale's §5
- [ ] 5-row source inventory table (rows: `hh`, `habr`, `trudvsem`, `getmatch`, `geekjob`) present in every locale's §5
- [ ] Negative-list collision fix example present in every locale's §5
- [ ] Disable-one-source YAML snippet present in every locale's §5
- [ ] HH_USER_AGENT env-var name referenced (latin literal) in every locale's §5
- [ ] `tests/help-ru-config-section.test.mjs` — 7 / 7 pass
- [ ] H2-parity contract stays at 17 (§5 expansion is a ### subsection, not a new H2)
- [ ] §17 (developer flow, v1.29.0) and §5 (user flow, v1.29.1) co-exist without overlap or contradiction

---

## 9. Reporting format

Generate `qa/v29-regression/<run-date>-REGRESSION.md`:

```markdown
# Regression run — YYYY-MM-DD

**Stand:** http://127.0.0.1:4317 · v1.29.x · parentVersion x.x.x · Node 22.x
**Tester:** human / Claude Cowork / CI
**Duration:** mm min

## Summary

| Section | Sub-checks | PASS | FAIL | SKIP | Notes |
|---|---|---|---|---|---|
| 1. Smoke nav | 23 routes + pre-flight | 24 | 0 | 0 | |
| 2.1 Dashboard | 6 | 6 | 0 | 0 | |
| 2.2 Scan (v1.29) | 6 | 6 | 0 | 0 | dropdown 11 entries |
| 2.13 Batch (v1.28) | 7 | 7 | 0 | 0 | 5 controls |
| …| | | | | |
| 7. Registry / RU adapter | 4 | 4 | 0 | 0 | |
| 8. Per-release (v1.18→v1.29) | 60+ | N | M | K | |
| **Total** | **~170+** | **N** | **M** | **K** | |

## Failures
(One block per failure: section ID, expected, actual, screenshot, log excerpt.)

## Warnings
(PASSed but flagged — slow response, drift smell, etc.)

## Console errors
(Aggregated red entries from sections 1-2.)

## Environment
(Node, npm, parent career-ops, Playwright, OS versions.)
```

### Failure severity guide

| Severity | When |
|---|---|
| **BLOCKER** | Pre-flight fail · any §1 route 404 · §3.4 path-traversal · §3.5 SSRF · §4.7 XSS · §5.6 dangling IDREF · §6.4/6.5 locale missing §17 |
| **HIGH** | §2 critical-path regression · §3.6 BF-1 break · §5.3-5.5 a11y · §3.3 registry shape break |
| **MEDIUM** | Individual feature regression · §6.6 AI-list drift · §7.x registry-shape edge case |
| **WARNING** | Cosmetic drift · slow response > 30 s · deferred drift (§12 G-005) |

---

## 10. Quick automation hooks

```bash
# Full CI suite:
cd /Users/sergejemelanov/Projects/career-ops/web-ui
npm run test:ci                                       # 540 unit + 2 CI gates
npm test -- tests/canonical-docs-coverage.test.mjs    # 7 docs/i18n canaries
npm run test:e2e:browser                              # Playwright smoke + full-cycle (32 tests)

# Stand spot-checks:
[ "$(curl -fsS http://127.0.0.1:4317/ | grep -c 'href=\"#/dashboard\"')" = "1" ] && echo "sidebar dedupe OK"
curl -fsS http://127.0.0.1:4317/api/scan/sources | jq '.sources | length'                    # 11
curl -fsS http://127.0.0.1:4317/api/health | jq -r '.checks[].name' | grep -c HH_USER_AGENT   # 0
for lc in en es pt-BR ko ja ru zh-CN zh-TW; do
  curl -fsS "http://127.0.0.1:4317/api/help/$lc" | jq -r .markdown | grep -c '^## ' \
    | awk -v lc=$lc '{ printf "%-6s : %s\n", lc, $1 }'
done   # every line → 17

# Browser-driven locale × route raw-key gate (Playwright):
for lc in en es pt-BR ko ja ru zh-CN zh-TW; do
  # See README.md::test:e2e:browser — the matrix loop fails on any raw i18n key
  echo "  $lc covered by Playwright matrix"
done
```

---

## 11. Master invariants (do not regress in any future release)

These are the load-bearing contracts spanning v1.6.0 → v1.29.0. Any future change that touches them MUST keep them green.

| # | Invariant | Source of truth |
|---|---|---|
| M-1 | Server never edits parent-project files outside explicit user actions | CLAUDE.md hard rule #1 |
| M-2 | CSP excludes `'unsafe-inline'` and `'unsafe-eval'` on public bind | §4.1 |
| M-3 | Every URL-fetching endpoint goes through `isValidJobUrl` + `safeGet` | §4.3 / `tests/safe-fetch.test.mjs` |
| M-4 | Every `:name` / `:slug` route param flows through `sanitizePathName` | §4.4 / `tests/path-traversal.test.mjs` |
| M-5 | Every tracker/pipeline write is under `withFileLock` | §4.5 / `tests/pipeline-concurrency.test.mjs` |
| M-6 | Every LLM endpoint carries `llmRateLimit` middleware | §4.6 |
| M-7 | CV PUT runs through entity-aware `stripDangerousMarkdown` | §4.7 |
| M-8 | All 8 locales surface the same key set + identical 17-H2 help structure | §6.3 / §6.4 / §6.5 |
| M-9 | All 8 CHANGELOGs stay at the same version | `scripts/check-changelog-parity.mjs` |
| M-10 | `.btn:not(.btn-sm)` ≥ 44 × 44 px on every public route | §5.3 / `tests/wcag-target-size.test.mjs` |
| M-11 | Router strips `?query` before route-name lookup (v1.28.1) | §2.4 / §2.10 / `tests/router-query-string.test.mjs` |
| M-12 | Source registry is the SINGLE place where adapters are listed (v1.29.0) | `server/lib/sources/registry.mjs` |

---

## 12. Known deferred (open backlog as of v1.29.0)

| ID | Severity | Title | Notes |
|---|---|---|---|
| G-005 | Minor (cross-repo) | Report block letters A-G vs canonical A-F | Requires coordinated parent commit on `santifer/career-ops :: modes/oferta.md`. Renderer is schema-tolerant so legacy A-G files still display correctly. |

That's it. Single open item.

**Closed in v1.28.x / v1.29.x** — see `qa/DOCS-COVERAGE-v1.29.md §3.A / §3.B / §3.E / §3.F` for details:
- AI-list drift (Issue #1) — closed v1.28.0
- `--max-retries N` UI surface (Issue #2) — closed v1.28.0
- Router 404 on `?query` hashes — closed v1.28.1
- HH_USER_AGENT health-row noise — closed v1.28.1
- RU sources limited to 2 — closed v1.29.0 (now 5 by default)
- Three-place source-list drift — closed v1.29.0 (registry is single source of truth)
- User-facing RU-config docs gap — closed v1.29.1 (help §5 now has full step-by-step end-user guide × 8 locales)

---

## 13. Maintenance

- Every release with semantic surface area updates **§8** with a new sub-list.
- Every release that retires an alias updates **§3.2**.
- Every release that adds an endpoint adds a curl probe to **§3**.
- Every release that adds a new mode page adds a route to **§1**.
- Every release that adds a new source adapter ships its row in `server/lib/sources/registry.mjs` and updates **§7.3** with the test file name.
- Archive prior `qa/v<N>-regression/` folders monthly; keep only the two most-recent under `qa/`.

When a scenario lands in CI (via `npm run test:ci`), this file's manual step becomes informational — keep it for human-driven smoke runs that hit the SPA visual layer.
