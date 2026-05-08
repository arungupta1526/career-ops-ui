# 說明 — career-ops-ui

從首次啟動到面試準備的每個頁面的完整指南。每個 `##` 對應側邊欄項目
或工作流程的一個階段。首次執行從上到下閱讀;之後透過說明側邊欄中的
TOC 跳轉到所需部分。

> **適用對象:** 剛把這個 UI 放到 `career-ops` checkout 中並執行了
> `bash bin/start.sh` 的人。不假設你了解 career-ops。

---

## 1. 快速入門 (5 分鐘從零開始)

完整循環:

1. **Health** (`#/health`) — 確認每項必需檢查為綠色。如果缺少
   `cv.md`、`config/profile.yml` 或 `portals.yml`,頁面會準確告訴你
   該建立哪個檔案。
2. **App settings** (`#/config`) — 貼上 `ANTHROPIC_API_KEY` 和
   (可選) `GEMINI_API_KEY`。點擊 **Save**。金鑰會寫入父專案的
   `.env`,以便 career-ops 腳本也讀取。
3. **Profile** (`#/profile`) — 檢查 `config/profile.yml`,把範本
   姓名 (`Jane Smith`) 替換為你的真實姓名。
4. **CV** (`#/cv`) — 貼上或上傳你的履歷。點擊 **💾 Save** —
   伺服器端淨化器在寫入前會去除 `<script>`、`javascript:` URL 和
   `on*=` 處理器。
5. **Scan** (`#/scan`) — 點擊 **🌐 Scan** 一次性掃描所有啟用的來源
   (Greenhouse / Ashby / Lever 用於 EN,hh.ru / Habr Career 用於
   RU)。
6. **Pipeline** (`#/pipeline`) — 檢查掃描器排隊的 URL。點擊任何
   項目以在右側預覽 JD。
7. **Evaluate** (`#/evaluate`) — 貼上 JD (或從 pipeline 點擊
   **▶ Evaluate**)。如果設定了 Anthropic / Gemini 金鑰,模型會以
   0–5 分對照你的 CV 評分,結果儲存到 `reports/`。
8. **Tracker** (`#/tracker`) — 每次評估都會得到一行。
9. **Apply checklist** (`#/apply`) — 產生提交清單。
10. **Deep research** (`#/deep`) — 決定申請後,執行公司簡報。儲存到
    `interview-prep/`。

---

## 2. 應用設定和 API 金鑰 (`#/config`)

兩個分頁:**API keys & runtime** 從瀏覽器編輯父專案的 `.env`(與
career-ops Node 腳本啟動時讀取的同一檔案);**Profile** 是
`config/profile.yml` 的直接 YAML 編輯器,自動加入正規檔頭
`# Career-Ops Profile Configuration` 並驗證 `candidate` 鍵存在。
任一分頁的儲存都立即生效——無需重啟。

### 識別的金鑰

| 金鑰 | 作用 | 取得位址 |
|---|---|---|
| `ANTHROPIC_API_KEY` | 啟用 Anthropic SDK 即時呼叫。兩個金鑰都設定時優先。 | <https://console.anthropic.com/settings/keys> |
| `ANTHROPIC_MODEL` | 覆寫預設 `claude-sonnet-4-6`。 | — |
| `GEMINI_API_KEY` | 沒有 Anthropic 時的回退。`gemini-eval.mjs` 用於 `oferta` mode。 | <https://aistudio.google.com/apikey> |
| `GEMINI_MODEL` | 覆寫 Gemini 模型。 | — |
| `HH_USER_AGENT` | 在俄羅斯外掃描 `hh.ru` 時需要。 | dev.hh.ru |
| `PORT` | Express 連接埠。預設 4317。 | — |
| `HOST` | 綁定。`0.0.0.0` 暴露到 LAN — **尚無 auth gate**。 | — |

### 行為

- **讀取** (`GET /api/config`) — 秘密金鑰**遮罩**
  (`sk-ant•••••a1b2`)。
- **儲存** (`POST /api/config`) — 驗證 → 寫入 `.env` → 立即套用到
  `process.env`。無需重啟。
- **空值刪除**金鑰。

### Smoke-test 按鈕

儲存後點擊 **▶ Test Anthropic** / **▶ Test Gemini** — 兩者都發送
微小的 prompt (≤256 tokens) 確認金鑰運作。回傳 ~200 字元樣本。

---

## 3. Profile (`#/profile` — 也可透過 `#/settings` 存取)

`config/profile.yml` 的唯讀視圖。直接在磁碟上編輯;頁面在 reload 時
重新解析。

關鍵欄位:

- `candidate.full_name` — 在每個 prompt 中使用。**在任何真實掃描
  之前替換 `Jane Smith`**。
- `candidate.email`、`linkedin`、`github` — 在 cover letter 和
  apply checklist 中參照。
- `target.roles` — 接受的職位。
- `target.comp_total_min_usd` — 最低總薪酬。每次評估的 D 節標記低於
  此值的 offer。
- `target.archetypes` — *最重要的欄位*。每個 JD 都對其匹配,最佳
  archetype 進入報告標頭。

`full_name` 仍是已知 placeholder 時,Health 標記 **Profile
customized**。

---

## 4. CV (`#/cv`)

每次評估、deep research 和 cover letter 的真實來源。位於父根的
`cv.md`。

### 編輯選項

- **直接貼上** — 左側 textarea 是 markdown 編輯器。
- **📁 Upload CV** — `.md/.markdown/.txt/.html/.htm`(文字)、
  `.docx/.doc/.odt/.rtf`(經 pandoc — `brew install pandoc`)、
  `.pdf`(經 pdftotext — `brew install poppler`)。伺服器轉為
  markdown 並清理後載入編輯器,**💾 Save** 持久化。上限 10 MB。
- **從 LinkedIn** — 在父專案中開啟 Claude Code,執行 `/career-ops`,
  貼上 LinkedIn URL,要求 `extract my CV from this and write it to
  cv.md`。

### 淨化

`stripDangerousMarkdown` 刪除 `<script>`、`<iframe>`、`<object>`、
`<embed>`、`<svg>`、`<style>`、`<form>`、行內處理器 (`onclick=`)、
URI `javascript:`/`vbscript:`/`data:text/html`。被刪除時回應包含
`sanitized: true`。最大 1 MB。

### 其他按鈕

- **sync-check** — `cv-sync-check.mjs`。
- **📄 Generate PDF** — `generate-pdf.mjs` → `output/*.pdf`。需要
  Playwright。

### 格式提示

- 一個 bullet = 一個帶指標的成就。
- 章節順序: **Summary**、**Experience**、**Projects**、
  **Education**、**Skills**。
- 保持在 1500 字以內。

---

## 5. 入口和來源 (`portals.yml`)

掃描器設定。三個區段重要:

### `title_filter`

```yaml
title_filter:
  positive: [backend, engineer, senior, tech lead, golang, php]
  negative: [junior, intern, frontend, ios, android, java]
```

vacancy 在其 title 包含**至少一個 positive** 且 **沒有任何
negative** 時通過。

### `tracked_companies`

```yaml
tracked_companies:
  - { name: Stripe,    enabled: true, careers_url: https://job-boards.greenhouse.io/stripe }
  - { name: Linear,    enabled: true, careers_url: https://jobs.ashbyhq.com/linear }
  - { name: JetBrains, enabled: true, careers_url: https://jobs.lever.co/jetbrains }
```

EN 掃描器從 URL 模式偵測 ATS,直接呼叫 boards-api。

### `russian_portals`

```yaml
russian_portals:
  sources: [hh, habr]
  area: 113                 # 113=俄羅斯,1001=遠端
  per_page: 50
  only_remote: false
  queries:
    - "Senior PHP"
    - "Senior Go"
```

注意 `queries` 與 negative 清單的重疊 — 主控台會警告衝突。

### Bootstrap

首次啟動時,如果缺少 `russian_portals:` 區塊,伺服器會附加文件化的
預設值 (idempotent)。

---

## 6. Health (`#/health`)

每個 setup gate 在 OK / OPTIONAL / FAIL 徽章中。

### 必需 (沒有這些系統無法運作)

`Node version` ≥ 18、`Project root`、`cv.md`、`config/profile.yml`、
`portals.yml`、`data/applications.md`、`data/pipeline.md`、
`modes/oferta.md`。

### 選用 (僅警告)

`Profile customized`、`GEMINI_API_KEY`、`ANTHROPIC_API_KEY`、
`HH_USER_AGENT`、Playwright、父專案 deps、目錄。

`HOST=0.0.0.0` 時,絕對路徑和準確的 Node 版本被隱藏。

### 執行按鈕

- **▶ Doctor** — `node doctor.mjs`。
- **▶ Verify pipeline** — `node verify-pipeline.mjs`。

---

## 7. Scan (`#/scan`)

掃描器爬取啟用的 boards,對歷史去重,把命中寫入
`data/last-scan.json` 和 `data/pipeline.md`。

### 一鍵掃描

**🌐 Scan** 一次執行每個來源。即時 SSE 日誌在右側。**Stop** 或離開
中止。

### 結果篩選

- 自由文字。
- Source 下拉。
- Remote / Hybrid / Onsite。
- Stack chips (PHP、Go、Backend、Senior) — 自動偵測。
- 動態 chips: 標題最頻繁的 capitalized 標記 top-25。

### Active Companies

可摺疊卡片:

- ✓ 綠 — 直接 API 支援。
- ○ 灰 — web 搜尋回退。

**點擊名稱** → 填入上方結果篩選器。**點擊 ↗** → 在新分頁開啟
`careers_url`。

---

## 8. Pipeline (`#/pipeline`)

等待評估的 URL inbox。位於 `data/pipeline.md`。

### 加入 URL

三種方式:

- 輸入或貼上 + **+ Add**。
- **Ctrl+K** / **Cmd+K** → 全域搜尋 → 貼上 URL → Enter。
- 執行 Scan — 新命中自動加入 pipeline。

每個 URL 經過伺服器端的 `isValidJobUrl()`。Loopback、`file://`、
`javascript:`、IP 字面值、樣板字元 — 都 400。

### 伺服器端預覽

點擊行載入右側預覽。伺服器代理,刪除 scripts/styles/標籤,回傳最多
8 KB 純文字。

預覽代理**逐跳 SSRF 驗證**手動行走重新導向。3 跳上限,15 秒逾時。

### 行操作

- **▶** — 跳轉 `#/evaluate?url=…`。
- **✕** — 從 pipeline 移除。

### 頂部按鈕

- **⚡ Evaluate first** — 在 Evaluate 中開啟第一個 URL。
- **Scan** — 回到掃描器。

---

## 9. Evaluate (`#/evaluate`)

針對 `cv.md` 和 `config/profile.yml` 給 JD 評分。回傳 `modes/oferta.md`
的 A–G 評估和 0–5 分。

### 輸入

把 JD 貼到 textarea,或從 `#/pipeline` 用 `?url=…` 抵達。

**💾 Save JD** 持久化到 `jds/jd-<date>-<ts>.txt`。

### 回退鏈

1. **Anthropic** — 設定了 `ANTHROPIC_API_KEY` 時優先。
   `bundleProjectContext` 把 cv + profile + `_shared.md` +
   `oferta.md` 內聯到 `<project_context>` 區塊。每檔 16 KB cap,
   prompt soft-cap 200 KB。
2. **Gemini** — 僅 `GEMINI_API_KEY` 時。spawn `gemini-eval.mjs`。
3. **Manual** — 無金鑰。頁面回傳可貼上 prompt。

### 輸出

A. Role Summary · B. CV Match · C. Risks · D. Compensation · E.
Application Strategy · F. Verdict (0.1 精度 0–5) · G. Posting
Legitimacy。

**💾 Save report** 把 markdown 持久化到
`reports/<date>-<company>-<role>.md`。

---

## 10. Reports (`#/reports`)

瀏覽每個儲存的評估。卡片顯示標題、日期、legitimacy 旗標、分數
(綠 ≥ 4.0,黃 ≥ 3.0,紅更低)。每頁 12 個。

單一報告檢視: **← All reports**、**🔗 Open JD**。

---

## 11. Tracker (`#/tracker`)

CRM。一行 = 一次申請。位於 `data/applications.md` 的 GFM 表格。

### 狀態流

`Evaluated` → `Applied` → `Responded` → `Interview` → `Offer` /
`Rejected` / `Discarded` / `SKIP`。白名單伺服器端強制。

### 欄

| 欄 | 內容 |
|---|---|
| `#` | 自動編號。 |
| `Date` | ISO。 |
| `Company` | 自由文字。**管道符和換行符自動跳脫。** |
| `Role` | 同上。 |
| `Score` | `N/5`。 |
| `Status` | 白名單。 |
| `PDF` | 成功後 ✅。 |
| `Report` | `reports/*.md` 連結。 |
| `Notes` | 自由文字,最多 200 字元。 |

### 篩選

Status、Score (`≥ 4.0`/`≥ 3.0`/`< 3.0`)、Search。每頁 25 行。

### 維護

- **▶ Normalize** / **▶ Dedup** / **▶ Merge**。

---

## 12. Deep research (`#/deep`)

產生結構化公司簡報: snapshot、工程文化、近期新聞、Glassdoor 情緒、
面試流程、談判槓桿點、對招募者提的三個聰明問題。

### 輸入

公司 + (選填) 角色。`modes/deep.md` 範本決定結構。

### 輸出路徑

與 Evaluate 相同的回退鏈:

1. **Anthropic 即時** (優先) — `bundleProjectContext` 內聯 cv +
   profile + `_shared.md` + `deep.md`。10–30 KB grounded markdown
   儲存到 `interview-prep/<company>-<role>.md`。
2. **Gemini 即時** — `gemini-eval.mjs`。
3. **Manual prompt** — 給 Claude Code 用的 prompt (用 WebFetch +
   WebSearch 做真正的研究)。

### 提示

- Anthropic `claude-sonnet-4-6` 通常 1–3 分鐘回傳 ~13 KB。
- Anthropic SDK 沒有內建 web search。新聞鮮度需要時,把 manual
  prompt 貼到 Claude Code。
- 即時呼叫收費;一次 Sonnet 4.6 deep-research 約 $0.30–0.50。

---

## 13. Mode prompts (七個 `/#/<mode>` 頁面)

七個 prompt builder: **Project** 想法、**Training** 計畫、
**Follow-up** 信件、**Batch** 評估、**Outreach** 給招募者、
**Interview prep** one-pager、**Patterns** 回顧。每個包裝一個
`modes/<slug>.md` 範本:

| 頁面 | Slug | 用途 |
|---|---|---|
| `#/project` | `project` | 為目標角色客製 portfolio 專案。 |
| `#/training` | `training` | 技能差距分析 → 課程。 |
| `#/followup` | `followup` | 面試後信件草稿。 |
| `#/batch` | `batch` | 多 JD 批次評估 prompt。 |
| `#/contacto` | `contacto` | 給招募者 / 推薦人的 outreach 訊息。 |
| `#/interview-prep` | `interview-prep` | 特定輪次的 one-pager。 |
| `#/patterns` | `patterns` | "什麼模式讓我成功?" |

### 共同形態

每個頁面: 小表單 + **▶ Generate prompt** (manual) + **⚡ Run live**
(有金鑰時為 primary)。

**▶ Generate prompt** → 回傳組裝的 prompt,把表單值 JSON 化在
`User-supplied context:` 區塊中。

**⚡ Run live** → 把同一 prompt 發給 Anthropic (或 Gemini),cv +
profile + `_shared.md` 透過 `bundleProjectContext` 內聯。結果在頁面
渲染、可複製、可下載為 `.md`。

---

## 14. Apply checklist (`#/apply`)

決定申請後,Apply helper 頁面產生提交清單。**不會**自動填表 — 那個
流程留在 Claude Code 的 `/career-ops apply` (用父的 Playwright)。

清單涵蓋:

0. 在 Claude Code 執行 `/career-ops apply <url>`。
1. 驗證 posting 仍在線 (`check-liveness.mjs`)。
2. 確認 CV 是最新 (`cv-sync-check.mjs`,score ≥ 4.0 時 PDF)。
3. 用 `cv.md` 的 STAR+R proof point 客製 cover letter / "Why us?"。
4. 誠實回答 EEO / 擔保 / 起始日期問題。
5. 提交前把答案儲存到 `interview-prep/{company}-{role}.md`。
6. **絕不自動提交** — 你 (人類) 點擊最終按鈕。
7. 提交後: 在 `data/applications.md` 加行。

---

## 15. 面試準備

post-research、pre-interview 階段。這個應用程式的三個成果物匯集:

1. **儲存的 deep-research 檔案** — `interview-prep/`,每個 company-
   role 對一個。從 Deep research 瀏覽。
2. **Patterns mode** (`#/patterns`) — "在我最近 N 次面試 / offer /
   拒絕中什麼模式持續?" 累積 5+ tracker 行後有用。
3. **Interview-prep mode** (`#/interview-prep`) — 為特定即將到來的
   輪次 (behavioral、technical、system design) 預先填寫 one-pager。

### 推薦工作流程

每次面試:

1. 前一天**重新執行 Deep** (或開啟儲存的檔案)。
2. **`#/interview-prep`** — 為特定輪次產生 one-pager。
3. **System design / coding 輪次** — 開啟 `#/training`,要求 30
   分鐘針對性 refresher。
4. **Compensation 輪次** — 開啟 deep-research 檔案,跳到
   "Negotiation leverage points"。帶 2–3 個資料點 (Glassdoor 範圍、
   最近融資、其他公司可比 offer)。
5. **Behavioral 輪次** — 從 `cv.md` 拉出 STAR+R 故事,落入原始
   Evaluate 報告的 B 節。

面試後立即:

1. 更新 tracker 行: status → `Responded` (然後 `Interview`、
   `Offer` 等)。
2. 執行 `#/followup` 草擬感謝信件。
3. 如有新情報 (薪酬範圍、團隊組成、tech stack 意外),用
   `## Post-round notes` 編輯儲存的
   `interview-prep/<company>-<role>.md`。

---

## 16. Activity 日誌 + 故障排除

### Activity 日誌 (`#/activity`)

到達伺服器的每個狀態變更請求的稽核日誌。秘密
(`ANTHROPIC_API_KEY`、`GEMINI_API_KEY`) 在寫入時被編輯 —
你永遠不會在 `data/activity.jsonl` 中看到真實金鑰值。

按操作前綴篩選 (`pipeline.`、`cv.`、`evaluate`、`scan.`)。每頁 25
行;伺服器最多回傳 500 個最近事件。

### 故障排除

| 症狀 | 可能原因 | 解決 |
|---|---|---|
| Health 在 `cv.md` 紅色 | 首次執行,檔案不存在 | `touch $CAREER_OPS_ROOT/cv.md`,重新整理。 |
| Health 在 `Profile customized` 紅色 | `full_name` 仍是 `Jane Smith` | 編輯 `config/profile.yml`。 |
| `hh.ru: HTTP 403` | 非俄羅斯 IP,無 `HH_USER_AGENT` | 在 `dev.hh.ru/admin` 註冊,設定 `HH_USER_AGENT`。 |
| `gemini-eval.mjs: ERR_MODULE_NOT_FOUND` | 父 deps 未安裝 | `cd $CAREER_OPS_ROOT && npm install`。 |
| Generate PDF 錯誤 | Playwright 未安裝 | `npx playwright install chromium`。 |
| 伺服器 `EADDRINUSE: 4317` | 舊實例執行 | `pkill -f 'node server/index.mjs'`。 |
| 即時 LLM 呼叫 > 2 分鐘掛起 | prompt 巨大或 Anthropic 慢 | soft-cap 200 KB → 413。 |
| Pipeline 預覽 `(unsafe redirect)` | posting 重新導向到私有 IP / loopback | 安全特性 (REVIEW-B1)。 |
| Tracker 行破壞表格 | v1.9.1 之前的管道 | 升級到 v1.9.1+ (BF-1)。 |
| `npm test` 在新克隆失敗 | 測試假設父布局 | `CAREER_OPS_ROOT=$(mktemp -d)`。 |

深度診斷: 在 Health 上執行 **▶ Doctor**,複製輸出,在
<https://github.com/Fighter90/career-ops-ui/issues> 搜尋 issue。
