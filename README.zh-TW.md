# career-ops-ui

> 用於 [career-ops](https://github.com/santifer/career-ops) AI 求職流水線的 Airbnb 風格 Web 介面。
> 在單個瀏覽器標籤中搜尋、評估、深入研究、申請和追蹤每個職位 — 而不是在 Claude Code、終端機和 markdown 檔案之間來回切換。

[English](README.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko-KR.md) | [日本語](README.ja.md) | [Русский](README.ru.md) | [简体中文](README.cn.md) | **繁體中文**

[![tests](https://img.shields.io/badge/tests-87%20passed-brightgreen)](README.md#tests)
[![node](https://img.shields.io/badge/node-%E2%89%A518-blue)](README.md#requirements)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

![career-ops-ui — vacancy search](./screen_vacancy_found.png)

## 一鍵安裝

```bash
curl -fsSL https://raw.githubusercontent.com/Fighter90/career-ops-ui/main/bin/setup.sh | bash
```

此命令複製兩個儲存庫 (career-ops + career-ops-ui),安裝相依性,並在 http://127.0.0.1:4317 啟動伺服器。

## 為什麼?

[career-ops](https://github.com/santifer/career-ops) 是一個強大的基於 Claude Code 的求職系統:貼上 JD → 取得 0-5 適配評分、ATS 最佳化的 PDF 和追蹤器條目。在 Claude Code 內部運作良好,但資料分散在 `cv.md`、`data/applications.md`、`reports/*.md`、`data/pipeline.md`、`portals.yml`、`config/profile.yml` — 容易遺失,難以瀏覽。

`career-ops-ui` 在其上添加一個精緻的 UI:

- **瀏覽** — 像 CRM 一樣瀏覽追蹤器、報告和流水線。
- **觸發** — 觸發掃描 (Greenhouse / Ashby / Lever **以及** hh.ru / Habr Career) 並查看即時 SSE 日誌。
- **評估** — 透過 Gemini API 評估 JD 或取得 Claude 的複製貼上 prompt。
- **編輯** — 使用並排 markdown 預覽編輯 `cv.md`。
- **維護** — doctor、verify、normalize、dedup、merge — 每個一鍵完成。

純加法:`career-ops/` 內部不會更改任何內容。你的自訂保持不變。

## 各頁面功能

| 頁面             | 功能                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Dashboard**    | 彙總計數 (apps / pipeline / reports)、平均分數、按狀態分類、最新 5 個 apps + 最新報告。                                     |
| **Scan**         | **兩個掃描器:** 🌍 EN scan (Greenhouse/Ashby/Lever, 24+ 已驗證 board) + 🇷🇺 RU scan (hh.ru API + Habr Career HTML 抓取)。即時 SSE 日誌 + 帶 stack/level chip 篩選器和 location / Remote-Hybrid / reloc / source 篩選器的可點擊結果表。 |
| **Pipeline**     | 對 `data/pipeline.md` 進行 CRUD。從 URL 直接跳轉到評估。                                                              |
| **Evaluate**     | 貼上 JD → 如果設定了 `GEMINI_API_KEY`,執行 `gemini-eval.mjs`;否則回傳 Claude 的複製貼上 prompt。                       |
| **Deep research**| 為指定的公司/角色產生完整的 `modes/deep.md` prompt。                                                                  |
| **Apply helper** | 產生申請清單;實際的 Playwright 表單填寫仍在 Claude Code 中的 `/career-ops apply` 中。                                    |
| **Tracker**      | `data/applications.md` 上的可篩選表 (狀態、分數、自由文字)。normalize/dedup/merge 一鍵按鈕。                            |
| **Reports**      | 瀏覽和閱讀 `reports/` 中的每個報告,帶解析的 header (Score / Legitimacy / URL)。                                       |
| **CV**           | `cv.md` 的即時 markdown 編輯器,帶並排預覽 + sync-check。                                                              |
| **Profile**      | `config/profile.yml` + 原型的唯讀檢視。                                                                              |
| **Health**       | 所有 setup 檢查在 OK / OPTIONAL / FAIL 徽章中 + 執行 `doctor.mjs` 和 `verify-pipeline.mjs` 的按鈕。                       |

## 要求

| | |
| --- | --- |
| **Node.js** | ≥ 18 |
| **career-ops** | 已複製並 onboard |
| **選用** | `.env` 中的 `GEMINI_API_KEY` 用於一鍵 JD 評估 |
| **選用** | 如果在俄羅斯境外執行並希望 hh.ru API 停止回傳 403,請使用 `.env` 中的 `HH_USER_AGENT` |

## stack 和 level 的 chip 篩選器

職位表包含以下內容的 multi-select chip:

- **Stack:** PHP, Symfony, Laravel, Go, Rust, Node.js, TypeScript, Python, Ruby, Java, C#/.NET, C++, Backend, Frontend, Fullstack, Microservices, High-load, Distributed, DevOps/SRE, Data, ML/AI, Mobile, Security, Database, Cloud, API
- **Level:** Lead/Tech Lead, Architect, Manager, Principal/Staff, Senior, Middle, Junior

每個類別內多選 (OR),類別之間交集 (AND)。顯示計數;只顯示有結果的 chip。

## 完整文件

完整架構、API 參考、進階設定和安全注意事項 — 請參閱 [英文 README](README.md)。

## 授權

MIT。基於 [santifer](https://santifer.io) 的 [career-ops](https://github.com/santifer/career-ops) 構建。

---

## 🌍 Getting Started — 安裝後的第一步

一鍵安裝後,你有兩個複製的儲存庫和腳手架檔案 (`cv.md`、`config/profile.yml`、`portals.yml`、`data/applications.md`、`data/pipeline.md` — 帶 **EDIT ME** 標記)。首次啟動時 Health 頁面應全部為綠色。用真實資料替換預留位置:

### 1. 建立 CV (`cv.md`)

- **A — 貼上現有履歷** 到 `career-ops/cv.md` 中,使用乾淨的 markdown。
- **B — 從 UI 上傳:** 點擊 **CV** → **📁 上傳履歷** → 選擇 `.md`/`.txt` → 檢查預覽 → 點擊 **💾 儲存**。
- **C — 將 LinkedIn 給 Claude Code:** 在 Claude Code 中執行 `/career-ops`,請求「擷取我的 CV 並寫入 cv.md」。

### 2. 個人資料 (`config/profile.yml`)

替換預留位置:姓名、電郵、位置、LinkedIn、目標角色、**archetypes** (最重要)、薪資範圍。

### 3. 掃描器 (`portals.yml`)

調整 `title_filter.positive`/`negative`。已預設 3 個 board (GitLab、Vercel、Linear)。更多內容:[`docs/portals-examples.md`](docs/portals-examples.md)。

### 4. (選用) Gemini API key

```bash
echo "GEMINI_API_KEY=your-key" >> career-ops/.env
```

### 5. 驗證並開始

Health → 全部為綠。**🌐 搜尋所有來源** → 帶 chip 篩選器的表格 → 複製 URL → **Pipeline** → **Evaluate**。

完整文件 (架構、API、安全):[英文 README](README.md)。
