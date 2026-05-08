# 變更日誌

**career-ops-ui** 的所有重要變更。格式遵循 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),版本號遵循 [SemVer](https://semver.org/)。

翻譯: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md)

---

## [1.9.0] — 2026-05-08

v1.8.0 待辦清單中的 P-6 → P-10 全部一次發布。重點:`server/index.mjs` 現在是 130 行的編排器(原 762 行,累計 1230 → 130 = -89 %),每個路由主題各自一個模組。`/api/evaluate` 的 Anthropic 對等支援、多 CLI 橋接檔案、擴充的 i18n 對等測試,以及 CI 中的 Playwright 瀏覽器煙霧測試。

### 🏗️ P-6 — server/index.mjs 拆分第二階段

P-2 的延續。剩餘 9 個路由主題已抽到 `server/lib/routes/<topic>.mjs`。`index.mjs` 現在是純編排器:中介軟體、12 個 `register<Topic>Routes(app)` 呼叫、SPA 兜底路由。

模組:`activity`、`config`、`health`(含 dashboard)、`help`、`jds`、`llm`、`pipeline`(含 preview)、`reports`、`tracker`。行為不變。每一步 283/283 unit tests 全綠。

### 🔌 P-7 — `/api/evaluate` 的 Anthropic 對等

`/api/evaluate` 之前是 Gemini 或 manual。v1.9.0 加入 Anthropic 分支(兩把 key 同時存在時優先)。透過 `bundleProjectContext({ modeSlugs: ['_shared', 'oferta'] })` — REVIEW-A1 擴充。回退順序:Anthropic → Gemini → manual。

新端點 **`POST /api/evaluate/test-anthropic`** — 針對 `ANTHROPIC_API_KEY` 的煙霧檢測。

### 🌐 P-8 — Help 中心 i18n 對等

8 個 locale 都已覆蓋同樣的 14 個規範 h2 段落。測試強化:

- `tests/help-ui.test.mjs` 現在遍歷全部 8 個 locale(此前只有 en + ru)。
- 新增:每個 locale 不少於 `en.md` 的 30 % — 防止 stub。

### 🤖 P-9 — CI 加入 Playwright 瀏覽器煙霧測試

`tests/playwright-smoke.mjs`(v1.8.0 的 opt-in)現已成為 CI workflow 的一部分。

### 🌍 P-10 — 多 CLI 相容

新增 `web-ui/AGENTS.md`(Codex / Aider / 通用)與 `web-ui/GEMINI.md` 作為指向規範 `CLAUDE.md` 的橋接檔案。

### 🧪 測試

- **284 unit tests**(原 283):新增 1 個 i18n 對等測試。
- **5 個 Playwright 煙霧測試** 現已納入 CI。

### 📦 新端點

| 方法 | 路徑 | 用途 |
|---|---|---|
| `POST` | `/api/evaluate/test-anthropic` | `ANTHROPIC_API_KEY` 煙霧檢測 (P-7)。 |

---

## [1.8.0] — 2026-05-08

加固、重構與 SDD 基礎。三項高嚴重性修復(A1、A2、A3)、四項中等(B1–B4)、六項輕微清理、父專案 career-ops v1.7.0 稽核、`server/index.mjs` 拆分(P-2 第 1 階段)、Playwright 瀏覽器煙霧測試,以及 `docs/` 與 `.claude/` 中的完整 SDD 基礎。

### 🔥 高嚴重性修復

- **`fix(deep): 在 Anthropic SDK 呼叫中內聯 cv/profile/mode 檔案 (REVIEW-A1)`** — `/api/deep` 與 `/api/mode/:slug` 之前指示模型「先讀取這些檔案」,但 Anthropic SDK 沒有檔案系統。輸出空洞。`bundleProjectContext` 讀取 `cv.md`、`config/profile.yml`、`modes/_shared.md` 與模式範本,各截取至 16 KB,在提示前插入 `<project_context>` 區塊。實測:`claude-sonnet-4-6` 回傳 26 KB 有依據的 markdown。
- **`fix(runner): 寬限期後 SIGTERM → SIGKILL 升級 (REVIEW-A2)`** — 卡在系統呼叫的子行程會無限掛起 SSE 連線。兩條路徑都啟動 5 秒 watchdog 升級到 `SIGKILL`。
- **`fix(runner): streaming 端點的最大執行時間上限 (REVIEW-A3)`** — `/api/stream/{scan,liveness,pdf}` 設 30 分鐘上限。

### 🛡️ 中等嚴重性

- **`fix(preview): /api/pipeline/preview 的逐跳驗證 (REVIEW-B1)`** — 從 `redirect: 'follow'` 切換到手動重定向遍歷。每個 `Location` 都透過 `isValidJobUrl` 重新驗證,3 跳上限。敵意板不能再將我們重定向到 loopback / 私有 IP / `file://`。
- **`refactor(keys): hasGeminiKey 統一 LLM 金鑰檢查 (REVIEW-B2)`**。
- **`feat(scanners): 透過 hh.ru、Habr、Greenhouse、Ashby、Lever 傳遞 AbortSignal (REVIEW-B3)`** — 客戶端中斷時,飛行中 fetch 被中止。
- **`test(anthropic): log-guard 防止 API 金鑰未來透過 console 洩漏 (REVIEW-B4)`**。

### 🧹 輕微清理

- **`fix(parsers): addPipelineUrl 內部的 URL 閘門作為縱深防禦 (REVIEW-C4)`**。
- **`docs(readme): 徽章 88 → 277 tests (REVIEW-C3)`**。
- **`test(i18n): 缺失鍵訊息按 locale 分組 (REVIEW-C6)`**。

### 🏗️ P-2 第 1 階段 — server/index.mjs 拆分 (1230 → 762 LOC, −38 %)

行為不變。每一步 283/283 unit tests 全綠。

- `server/lib/security.mjs` — 淨化器與信任檢查。
- `server/lib/prompts.mjs` — LLM 提示建構器。
- `server/lib/store.mjs` — 防禦性讀取器 + 首次啟動引導。
- `server/lib/routes/{scan,runners,content}.mjs` — `registerXxxRoutes(app)`。

第 2 階段將提取 tracker / pipeline / reports / jds / llm / health。

### 🔍 父專案 career-ops v1.7.0 稽核

UI 相容。模式目錄:7 → 19(UI 故意只暴露 7 個)。`portals.yml` 使用 `tracked_companies`(96 條目,87 啟用,71 含 API)。在 `docs/architecture/DATA-FLOWS.md` 中記錄。

### 🤖 SDD / GSD 基礎

- `CLAUDE.md`(根)、`.aiignore`、`.claude/agents/*`(3 個)、`.claude/commands/*`(2 個)。
- `docs/` 樹:PROJECT、ROADMAP、sdd/{SDD-GUIDE, CONVENTIONS}、architecture/{OVERVIEW, SERVER, FRONTEND, API, DATA-FLOWS}、reviews/REVIEW-2026-05-07。

### 🔒 安全與儲存庫衛生

- **`chore(.gitignore): 擴展縱深防禦模式`** — env 變體、IDE、GSD scratch、代理私有設定、Playwright 產物、通用密鑰模式。

### 🧪 測試

- **283 unit tests**(原為 277):新增 6 個。
- **5 個 Playwright 瀏覽器煙霧測試**(新增,透過 `npm run test:e2e:browser` opt-in)。
- 覆蓋率 ~93 % line / ~83 % branch。

### 📝 新增 npm 指令

| 指令 | 用途 |
|---|---|
| `npm run test:e2e:browser` | 針對 in-process 伺服器的 Playwright smoke(5 個測試)。 |

---

## [1.7.2] — 2026-05-04

說明中心、UI 內應用設定、行動端側邊欄、單一 Scan 按鈕、所有 prompt-builder 的「顯示結果」捷徑。

### ✨ New features

- **`feat(help): in-app user guide` (`/#/help`)** — long-form Markdown documentation accessible from a new sidebar entry. Covers every page step-by-step: quick start, CV editor, Profile, Scan filters, Pipeline preview, Evaluate, Deep research, Apply, Tracker, Reports, all 7 modes, Activity log, Health, setup hints. Auto-built sticky table of contents from `<h2>` headings, synchronous DOM build (no race). Localized for all 8 supported locales.
- **`feat(config): in-UI App settings page` (`/#/config`)** — edit `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `HH_USER_AGENT`, `PORT`, `HOST` from the browser. Writes to the **parent project's** `.env` file so career-ops Node scripts AND web-ui's dotenv loader pick up the same source. Secret keys masked on read (first/last 4 chars). Model fields are dropdowns with curated lists (claude-sonnet-4-6 / claude-opus-4-7 / claude-haiku-4-5 / gemini-2.0-flash / etc.). Empty value deletes the key. Values applied to running process.env immediately — no restart for most settings.
- **`feat(modes): "⚡ Show result" button alongside "Copy prompt"`** — when a prompt is generated in manual mode, users no longer have to retype their inputs to get the LLM result. The new button re-submits the same form with `run: true`, falling through to a clear toast (`Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env first`) when no key is configured. Works on `/#/deep`, `/#/project`, `/#/training`, `/#/followup`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns`.

### 🐛 UX + UI fixes

- **`fix(scan): single Scan button replaces three (Scan all + EN + RU)`** — overwhelming choice, identical default in 99% of cases. The unified `🌐 Scan` button runs every enabled source. Help docs updated across 8 locales.
- **`fix(ui): mobile sidebar drawer`** — viewport <900px now gets a hamburger button (☰) in the topbar; `body.sidebar-open` toggles a CSS transform that slides the sidebar in. Backdrop dim + click-anywhere closes it. Anchor click + hashchange auto-close so the user lands on the new page with the drawer tucked away. Larger viewports unaffected.
- **`fix(server): footer version reflects web-ui, not the parent VERSION`** — `/api/health` now reads web-ui's own `package.json`. The footer no longer leaks a stale `1.6.0` from the parent's version file. Parent's VERSION is still surfaced separately as `parentVersion`.

### 📦 New REST endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/api/help/:lang` | Returns the Markdown user guide for the requested locale, falling back to `en.md`. Path-traversal-safe. |
| `GET`  | `/api/config` | Returns current values for all known env keys; secrets masked. |
| `POST` | `/api/config` | Writes the given keys into the parent project's `.env`, validates each value, applies live to `process.env`. |

### 🌐 i18n

- 30+ new keys across `nav.help`, `nav.config`, `help.*`, `config.*`, `deep.showResult`, `deep.needKey`, `scan.btnRun`. All 8 locales populated.

### 🧪 Tests

- `tests/help.test.mjs` (12 cases) — every supported locale returns substantive markdown, EN spot-checks every page slug, unknown lang → EN fallback, path-traversal sanitized, every locale references `cv.md` / `profile.yml` / `.env`.
- `tests/help-ui.test.mjs` (9 cases) — view file registration, sidebar entry, i18n keys present in every locale, docs files exist for every locale, EN/RU help has 14 canonical sections, every #/foo route covered, Show-result wiring on deep + mode-page.
- `tests/env-config.test.mjs` (18 cases) — pure-function tests for `parseEnv`, `maskSecret`, `validateConfig`, `updateEnvFile` (bootstrap, in-place rewrite preserving comments, empty-value delete, quote-when-needed).
- `tests/config-endpoint.test.mjs` (8 cases) — GET masks secrets / returns env path; POST writes to parent .env; live process.env application; empty-value unsets; rejects unknown keys + malformed Anthropic keys with 400.

### 📊 Stats

- **Tests:** 233 → **277** (+44 across 4 new test files).
- **E2E:** 20 smoke + 23 comprehensive = 43 Playwright steps, all green.
- **Coverage:** 93.5% line / 82.6% branch / 93.7% funcs (unchanged — new code is fully tested).

---

## [1.7.1] — 2026-05-04

Patch release stacking the post-v1.7.0 work: pipeline preview pane, Anthropic API integration, scrollable sidebar, dotenv loader, dynamic Active-companies list, CI workflow hardening.

### ✨ Pipeline preview pane

- `/#/pipeline` overhaul — left list + right preview pane. Click any URL to fetch a server-side proxied snapshot (`GET /api/pipeline/preview` strips scripts/styles/tags, caps at 8 KB, validated through `isValidJobUrl`). Live filter input, "In queue" counter, ⚡ "Evaluate first" header button. Inline ▶/✕ on every row plus full Evaluate / Open in tab / Delete on the preview pane. **8 new tests** in `tests/pipeline-preview.test.mjs`.

### ✨ Anthropic API integration — "Run live" everywhere

- `server/lib/anthropic.mjs` — zero-dependency client for Anthropic Messages API. When `ANTHROPIC_API_KEY` is set, every mode page (`/#/deep`, `/#/project`, `/#/training`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns`) renders **⚡ Run live (Anthropic)** as the primary action — clicking executes the prompt and renders Markdown back into the browser. Gemini stays as fallback when only its key is set. **8 new tests** in `tests/anthropic.test.mjs`.

### 🐛 CI / pipeline / UX fixes

- `fix(api): tighten pipeline URL validator` (FIX-M7) — rejects loopback hostnames, length <10 or >2000, whitespace inside URLs.
- `fix(server): actually load .env so HH_USER_AGENT / GEMINI_API_KEY hints work` — added `server/lib/dotenv.mjs` (35-line zero-dep loader). 6 new tests.
- `fix(ui): scrollable sidebar` — `.sidebar` now has `overflow-y: auto`. 18 nav items always reach the footer.
- `fix(ui): make HH_USER_AGENT banner dismissible`, then removed entirely from `/scan`. Health page check still surfaces it.
- `fix(scan): Active companies list collapsible + filterable + grouped` (✓ API-backed first, ○ websearch second).
- `fix(test): isolate api.test.mjs + en-scanner.test.mjs from parent project` — both now spin up tmp project roots so CI works without parent checked out alongside web-ui.
- `fix(workflow): publish-package version-match only on release events` — `workflow_dispatch` from main no longer fails the tag/version check.
- `fix(e2e): stable selector for pipeline row delete` — `.pipeline-row[data-url=…] .pipeline-row-delete`.

### 📦 New REST endpoint

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/pipeline/preview?url=…` | Server-side proxy: visible-text snapshot (scripts/styles stripped, 8 KB cap), gated by `isValidJobUrl`. |

### 📊 Stats

- **Tests:** 225 → **233** (+8 on top of v1.7.0).
- **Test files:** 25 → **26**.
- **E2E:** 20 + 23 = 43 Playwright steps, all green.
- **Coverage:** 93.5% line · 82.6% branch · 93.7% funcs.

---

## [1.7.0] — 2026-05-03

基於 QA r5 的 35 次提交的安全強化 + UX + 功能完善。三層安全落地,所有缺失的 CRUD 端點補齊,父專案 bootstrap 完全自動化,UI 新增 **9 個頁面** — Activity、重新設計的 Deep Research,以及 7 個分組側邊欄模式 (project / training / followup / batch / outreach / interview-prep / patterns) 覆蓋父 `modes/` 的 100%。測試覆蓋率從 **73** 增加到 **209**,**24 個測試檔案** + **23 步綜合 Playwright e2e**。Coverage: **93.5 % 行 / 82.6 % 分支**。

### 🔒 安全

- **`fix(cv): 淨化 CV Markdown 以阻止預覽中的儲存型 XSS` (FIX-C10)** — `PUT /api/cv` 在寫入 `cv.md` 之前去除 `<script>`、`<iframe>`、`<object>`、`<embed>`、`<style>`、`<form>`、`<svg>`、`on*=` 處理器以及 `javascript:`/`vbscript:`/`data:text/html` URI。請求體限制 1 MB(超出返回 413)。客戶端 `UI.md()` 重寫為在任何 markdown 轉換 *之前* 跳脫所有位元組,原始 HTML 永遠無法到達 `innerHTML`。連結 `href` 透過安全 scheme 白名單 (`http`/`https`/`mailto`/`tel`/相對 + 僅 `data:image`) 驗證。新增 17 個測試。
- **`fix(server): CSP + 基線安全標頭` (FIX-L2)** — 每個回應都攜帶 `X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy: same-origin`。當伺服器綁定到 loopback 之外 (`HOST` ≠ `127.0.0.1`/`::1`/`localhost`) 時,額外套用嚴格的 `Content-Security-Policy`: `default-src 'self'`、`script-src 'self'` (無 `unsafe-inline`)、Google Fonts 加入白名單、`connect-src 'self'` 阻斷 XSS 資料外洩。`index.html` 和 `router.js` 的內聯 `onclick` 處理器遷移到 `addEventListener`。新增 8 個測試。
- **`fix(api): 加強 pipeline URL 驗證器` (FIX-M7)** — `POST /api/pipeline` 曾接受 `"not-a-url"` 並持久化它。現在 `isValidJobUrl()` 拒絕裸字串、長度 <10 或 >2000、含空白的 URL、非 `http(s)` scheme、loopback 主機名。包含 **FIX-M3** + **FIX-M6**。
- **`fix(api): 在組合 prompt 之前淨化 JD` (FIX-M5)** — `POST /api/evaluate` 去除 ANSI 跳脫、控制位元組、內聯 `<script>` 標籤,trim 空白。50 KB 長度上限。50 字元的最低值在 *淨化後的* 文字上檢查。
- **`fix(health): HOST!=loopback 時遮蔽 Node 版本 + 專案根` (FIX-M1)** — `/api/health` 不再在 LAN 暴露的部署中洩露主機指紋。

### ✨ 新功能

- **`feat: 7 個新側邊欄模式 + 分組側邊欄` (FIX-C8)** — 100% 覆蓋父 `modes/`。新路由: `#/project`、`#/training`、`#/followup`、`#/batch`、`#/contacto`、`#/interview-prep`、`#/patterns`。單一 view 工廠 + 通用端點 `POST /api/mode/:slug`。側邊欄分 6 組。共 18 項。12 個新測試。
- **`fix: 父依賴 + russian_portals 預設值 bootstrap` (FIX-C4 + C9 + C12 + H2)** — `bin/start.sh` 在新克隆上自動安裝父 `node_modules` + Playwright Chromium。`createApp()` 在 `russian_portals:` 區塊缺失時追加。冪等。3 個新測試。
- **`fix: 停用 9 個死連結 portal slugs` (FIX-C3)** — 9 個 slugs 標記為 `enabled: false`。新 `scripts/portals-health-check.mjs`。3 個新測試。
- **`feat(activity): 使用者操作日誌 + Activity 側邊欄頁面`** — 每個狀態變更的 API 請求都被記錄到 `data/activity.jsonl`。新側邊欄項 **活動** — 操作前綴 chip 過濾器、✓/✗ 徽章、重新整理按鈕。5 MB 自動輪轉。新增 10 個測試。
- **`feat(deep): 在瀏覽器中查看 Deep Research + 已儲存結果存檔`** — Deep Research 頁面現在 (a) 當 `{ run: true }` 且設定了 `GEMINI_API_KEY` 時透過 Gemini 即時執行,持久化到 `interview-prep/{slug}.md`;(b) 以帶相對時間戳的卡片列出所有已儲存的 deep-research 檔案;(c) 將結果渲染為 Markdown,每個結果提供 **📋 複製 / ⬇ 下載 .md / ↗ 在新分頁開啟** 操作。新 REST: `GET /api/interview-prep`、`GET /api/interview-prep/:name`、`DELETE /api/interview-prep/:name`。新增 7 個測試。
- **`feat(cv): 在瀏覽器中產生 + 下載 PDF + PDF 存檔`** — CV 頁面新 **📄 產生 PDF** 按鈕在模態控制台中串流 `/api/stream/pdf`。`ERR_MODULE_NOT_FOUND` / `playwright` 錯誤時顯示可複製貼上的引導指令。「已產生的 PDF」部分在每次成功後自動載入,列出所有 `output/*.pdf` 及 **↗ 開啟** + **⬇ 下載** 按鈕。新 REST: `GET /api/output/pdfs`、`GET /api/output/pdfs/:name`。新增 6 個測試。
- **`feat(api): POST /api/tracker — 從 UI 新增列` (FIX-H8)** — 從瀏覽器在 `data/applications.md` 中追加規範列。驗證 company + role,根據 `templates/states.yml` 正規化狀態,自動遞增零填充 `#`,依 company+role 不區分大小寫去重。新增 6 個測試。
- **`feat(api): DELETE /api/jds/:name` (FIX-H4)** — 無需 shell 即可刪除已儲存的 JD。path-traversal 淨化、必須 `.txt` 後綴。新增 5 個測試。
- **`feat(api): POST /api/evaluate/test-gemini` (FIX-H7)** — 透過 `gemini-eval.mjs` 推送 50 字元的虛擬 JD,讓使用者驗證 API key 是否生效的 smoke-test 端點。

### 🐛 Bug 修復

- **`fix(router): catch-all 404 視圖 + i18n 覆蓋率守護` (FIX-C7)** — 未知 hash 路由不再靜默回落到 dashboard。顯示專門的 404 頁面。新 `tests/i18n-coverage.test.mjs` 驗證所有 173+ 鍵 × 8 locales。
- **`fix(router): #/profile → settings 別名` (FIX-C2)** — 兩個位址都到達同一視圖,側邊欄正確高亮。
- **`fix(health): 統一 Health/Doctor + 標記範本設定` (FIX-C6 + FIX-H6)** — `/api/health` 現在公開 Doctor 報告的全部內容 (parent deps、Playwright、目錄、profile-customized、`HH_USER_AGENT`)。
- **`fix(scan): RU 設定的 query↔negative 衝突警告` (FIX-H3)** — 當 `portals.yml` 的 negative 含 `"PHP"` 而查詢面向 Senior PHP 時會過濾所有結果。`runRuScan()` 在開始前 emit 警告。
- **`fix(scan): HH_USER_AGENT 未設定時警告` (FIX-H1)** — `/scan` 顯示黃色卡片。
- **`fix(api): POST /api/jds slug 淨化時警告` (FIX-M2)** — 回應中返回 `warning` 欄位。
- **`fix(ui): 路由切換時清空全域搜尋 + 按鈕載入圈` (FIX-M4 + FIX-L1)** — 新輔助函式 `UI.withSpinner(button, fn)`。
- **`fix(ui): 空 modal-title 佔位符` (FIX-H9)** — 移除硬編碼英文 `"Title"`。

### 🌐 i18n

- 173+ 翻譯鍵 × 8 locales (`en`、`es`、`pt-BR`、`ko`、`ja`、`ru`、`zh-CN`、`zh-TW`)。所有 locales 新增鍵。覆蓋率由 `tests/i18n-coverage.test.mjs` 強制。

### ⚙️ DevOps

- **測試數:** 73 → **225**(+152 個測試,25 個檔案)。Coverage: 93.5% 行 / 82.6% 分支。
- **綜合 Playwright e2e**(`tests/e2e-comprehensive.mjs`,23 步)。
- **GitHub Actions:** `ci.yml`、`ai-review.yml`(Claude Code 審查每個 PR)、`release.yml`。
- **CSP 友善 UI:** 移除所有內聯 `onclick`。

### 📦 新 REST 端點

| 方法 | 路徑 | 用途 |
|---|---|---|
| `GET`    | `/api/activity`              | 使用者活動事件列表 |
| `GET`    | `/api/interview-prep`        | 已儲存 Deep Research 列表 |
| `GET`    | `/api/interview-prep/:name`  | 讀取單個 Deep Research |
| `DELETE` | `/api/interview-prep/:name`  | 刪除 Deep Research |
| `GET`    | `/api/output/pdfs`           | 已產生 PDF 列表 |
| `GET`    | `/api/output/pdfs/:name`     | 下載 PDF (attachment) |
| `POST`   | `/api/tracker`               | 向 `applications.md` 新增列 |
| `DELETE` | `/api/jds/:name`             | 刪除已儲存 JD |
| `POST`   | `/api/evaluate/test-gemini`  | Gemini API key smoke-test |

---

## [1.6.0] — 2026-05-02

Web UI 首次公開發布。功能清單見 `README.md`。
