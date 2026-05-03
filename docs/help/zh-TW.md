# 說明 — career-ops-ui

每個頁面的逐步指南。名稱與左側欄選單一致。

---

## 1. 快速開始

5 分鐘完成全流程:

1. **CV** (`#/cv`) — 貼上或上傳 Markdown 履歷。點選 **💾 儲存**。
2. **設定** (`#/settings`) — 編輯 `config/profile.yml`: 姓名、信箱、目標薪資、地點。
3. **Health** (`#/health`) — 檢查所有必需卡片是否綠色。選用項目 (Gemini / Anthropic / HH_USER_AGENT) 僅在使用對應功能時需要。
4. **Scan** (`#/scan`) — 點選 **🌐 Scan all** 抓取所有啟用的招聘網站。或透過 Ctrl+K → Enter 貼上單一 URL。
5. **Pipeline** (`#/pipeline`) — 檢視掃描器入隊項目。點選任一 URL → 右側預覽。點選 **▶ Evaluate** 與 CV 對比評分。
6. **Tracker** (`#/tracker`) — 所有評估到這裡。按分數、狀態、文字過濾。產生客製 PDF、申請、更新狀態。

---

## 2. CV (`#/cv`)

每次評估的真實來源。按鈕: **📁 Upload CV**、**sync-check**、**📄 Generate PDF**、**💾 儲存**。右側即時預覽。

## 3. 設定 (`#/settings`, 也可 `#/profile`)

顯示解析後的 `config/profile.yml`。直接在磁碟編輯;重新載入抓取變更。Health 頁 **Profile customized** 檢查會標記 `Jane Smith` 等範本值。

## 4. Scan (`#/scan`)

招聘網站爬蟲。**🌐 Scan all** = EN + RU;**🌍 EN scan** = Greenhouse/Ashby/Lever;**🇷🇺 RU scan** = hh.ru + Habr Career (需要 `HH_USER_AGENT`)。按文字、遠端/混合/搬遷、來源、技術/級別 chip 過濾。

## 5. Pipeline (`#/pipeline`)

URL 收件匣。透過 input + **+ Add** 或 Ctrl+K 新增。點選 URL → 右側 server-side 預覽。列操作: **▶** Evaluate, **✕** Delete。即時過濾 + 計數器。

## 6. Evaluate (`#/evaluate`)

將 JD 與 `cv.md` + `profile.yml` 對比評分。無 API key → Claude Code 的 manual prompt;設定 `ANTHROPIC_API_KEY`/`GEMINI_API_KEY` → 伺服器端執行並渲染 Markdown。**💾 Save JD** 封存到 `jds/*.txt`。

## 7. Deep research (`#/deep`)

公司簡報: 團隊、文化、新聞、談判槓桿、聰明問題。**⚡ Run live** 執行 + 儲存到 `interview-prep/{slug}.md`。**▶ Generate prompt** 產生手動 prompt;**顯示結果** 設定 key 後重新執行。

## 8. Apply checklist (`#/apply`)

可貼上清單。真實表單填寫僅在 Claude Code 中: `/career-ops apply <url>`。

## 9. Tracker (`#/tracker`)

申請登記 — `data/applications.md`。按狀態 / 分數段 / 文字過濾。按鈕: **Normalize**、**Dedup**、**Merge TSV**。

## 10. Reports (`#/reports`)

`reports/` 下所有 A-G 報告。點選渲染 Markdown (XSS 安全)。

## 11. Modes (`#/project`、`#/training`、`#/followup`、`#/batch`、`#/contacto`、`#/interview-prep`、`#/patterns`)

7 個專門 prompt-builder。相同 UX: 填表單 → **▶ Generate prompt** 或 **⚡ Run live** (有 key 時) → Markdown / 📋 Copy / ⬇ Download。

| 模式 | 產生內容 |
|---|---|
| **Project** | 作品集構想的 scope + signal-fit 回饋。 |
| **Training** | 決定課程/認證是否值得時間投入。 |
| **Follow-up** | 申請節奏: 何時催促、說什麼。 |
| **Batch** | `batch/run.mjs` 用 prompt — 平行評估。 |
| **Outreach** | LinkedIn 外聯: 找到合適聯絡人 + 起草訊息。 |
| **Interview prep** | 面試階段特定準備。 |
| **Patterns** | 過往申請的反覆弱點模式。 |

## 12. Activity (`#/activity`)

每個狀態變更 API 呼叫的稽核日誌。`data/activity.jsonl`。按操作 prefix chip 過濾。5 MB 自動輪轉。

## 13. Health (`#/health`)

設定診斷。綠 = 就緒、黃 = 選用缺失、紅 = 必需缺失。**Doctor** + **Verify** 按鈕。

## 14. 設定提示

- **`.env`** — 從 `.env.example` 複製。`ANTHROPIC_API_KEY`/`GEMINI_API_KEY` 啟用即時執行。`HH_USER_AGENT` 用於 hh.ru。
- **語言切換** 在 sidebar footer — 8 locales,持久化到 localStorage。
- **Ctrl+K** 聚焦全域搜尋。URL → Enter → pipeline。文字 → Enter → tracker。
- **Esc** 關閉開啟的模態。
