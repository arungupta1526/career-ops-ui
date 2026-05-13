# 變更日誌

**career-ops-ui** 的所有重要變更。格式遵循 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),版本號遵循 [SemVer](https://semver.org/)。

翻譯: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md)

> **i18n 註釋** — 從 v1.12.0 起,各條目按語言本地化。之前的條目(v1.11.x、v1.10.x)按專案慣例保留俄文;規範英文正文在 [CHANGELOG.md](CHANGELOG.md)。

---

## [1.20.0] — 2026-05-13

**Per-component a11y polish + non-EN README parity + `/api/scan-ru/config` alias retired.** Closes the four items the v1.19.0 "Out of scope" table flagged for v1.20.

### Highlights

- **WCAG 2.5.5 / 2.5.8 — per-component touch-targets:** `.chip` → `min-height: 28px` + `.chip-row { gap: 8px }` (spaced-target exception). `.nav-item` and `.tab-btn` → `min-height: 44px`.
- **WCAG 1.3.1 / 3.3.2 — `aria-describedby` on form hints:** every form control across `config.js` / `evaluate.js` / `batch.js` / `pipeline.js` / `mode-page.js` now owns a stable `id`, `<label htmlFor=…>`, and `aria-describedby` for inline hints. `UI.el()` learned a React-style `htmlFor` alias.
- **Non-EN README parity:** all 7 locales now mirror the 585-line EN structure end-to-end (Why?, Quick start, full API reference, Architecture, 🌍 Getting Started walkthrough).
- **Alias retired:** `DELETE /api/scan-ru/config`. Use `/api/scan/regional/config`. Sunset was announced in v1.19.0.

### Tests

**427 / 427** unit + 20/20 smoke + 23/23 comprehensive + 32/32 Playwright. All a11y wiring is additive; no behavioral test deltas.

### Breaking changes

- `GET /api/scan-ru/config` — removed (use `/api/scan/regional/config`).

See [`CHANGELOG.md`](CHANGELOG.md) for the full English changelog.

---

## [1.19.0] — 2026-05-13

**WCAG 1.4.3 contrast + scan unification (final) + HH_USER_AGENT removed from UI.** Closes the v1.18 out-of-scope contrast audit, finishes the EN/RU split elimination begun in v1.18, and removes the `HH_USER_AGENT` configuration knob from the UI per user direction (a sensible default bundled in the server already handles non-RU IPs for most users).

### ♿ WCAG 1.4.3 contrast pass

- **`a11y(contrast): introduce AA-passing *-text variants for accent tokens`** — light theme: `--rausch-text: #b80f42` (6.59:1 on white, was 3.52:1), `--kazan-text: #066507` (7.31:1, was 4.53:1), `--darjeeling-text: #7a5800` (5.73:1 on amber bg, was 4.24:1), `--babu-text: #00665e` (6.09:1, was 2.70:1). Dark theme: lightened mirrors (`#ff8aa0`, `#6ee7b7`, `#fcd34d`, `#5eead4`) hit the same 4.5:1 floor on `#161a22` paper.
- Badge classes (`.badge-ok`, `.badge-warn`, `.badge-bad`, `.badge-info`) and score pills (`.score-high`, `.score-mid`, `.score-low`) now route through the new `*-text` variants — every text-on-tinted-bg combo passes AA. The accent fill tokens (`--rausch`, `--kazan`, etc.) stay unchanged for borders and outlines (which only need 3:1 for non-text UI components).

### 🧹 Scan unification (finishes v1.18 work)

- **`docs(scan): scrub remaining EN/RU split references across READMEs + help + architecture docs`** — eight READMEs + eight help bundles + three architecture docs (API.md, SERVER.md, OVERVIEW.md, DATA-FLOWS.md) + scan.js comment now describe a single consolidated scan method. The legacy `/api/stream/scan-{en,ru}` aliases were already gone in v1.18; v1.19 catches the doc/copy that still framed scanning as a two-step EN+RU process.
- **`feat(scan): canonical /api/scan/regional/config endpoint`** — `/api/scan-ru/config` kept as a thin alias through one release for back-compat. The new path matches the source-naming convention (`?source=regional`).

### 🛠️ HH_USER_AGENT removed from UI

- **`feat!(config): drop HH_USER_AGENT field from /#/config + KNOWN_KEYS`** — power users can still set `HH_USER_AGENT` directly in `career-ops/.env` (the server reads via `process.env.HH_USER_AGENT` in `server/lib/sources/hh.mjs` with the bundled UA as fallback). The UI no longer exposes it because the default works for most users and seeing an inscrutable User-Agent field in the App Settings page was a recurring source of confusion.
- README mentions across 8 locales + help bundle mentions across 8 locales replaced with "run via a Russian IP / VPN" advice. The `scan.hhWarning` i18n key was rephrased to drop the env-var setup detail.
- `KEY_GROUPS` collapsed: no more `regional` classification (it only had HH_USER_AGENT). Tests updated; `regionalActive` payload field preserved for SPA back-compat.

### 🧪 Tests

- `tests/env-config.test.mjs` — `KNOWN_KEYS` assertion now excludes HH_USER_AGENT; new assertion that the key is intentionally absent.
- `tests/config-endpoint.test.mjs` — POST-write multi-key test uses `GEMINI_MODEL` as the second known key instead of HH_USER_AGENT.
- `tests/config-groups.test.mjs` — `groups.HH_USER_AGENT` is now expected `undefined`.
- Total: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + 32/32 Playwright. Same counts as v1.18.0 because every adjusted test was already counted.

### Verification

```bash
npm test                              # 427 / 427

# Contrast (Chrome DevTools or axe) on light + dark:
#   .badge-ok / .badge-warn / .badge-bad / .badge-info → AA pass (4.5:1+)
#   .score-high / .score-mid / .score-low → AA pass

# HH_USER_AGENT no longer in /api/config:
curl -s http://127.0.0.1:4317/api/config | jq '.values | keys'
# → ["ANTHROPIC_API_KEY","ANTHROPIC_MODEL","GEMINI_API_KEY","GEMINI_MODEL","HOST","PORT"]
# (no HH_USER_AGENT)

# Canonical regional config endpoint:
curl -s http://127.0.0.1:4317/api/scan/regional/config | jq '.'
# Legacy alias still alive through v1.20:
curl -s http://127.0.0.1:4317/api/scan-ru/config | jq '.'
```

### Out of scope (v1.20+)

| Item | Notes |
|---|---|
| Per-component touch-target audit (filter chips, sortable headers, sidebar nav) | v1.18 set the global floor (`.btn` 44 px, `.btn-sm` 32 px); per-component verification across the SPA remains. |
| `aria-describedby` on inline form hints (`#/config`, `#/pipeline`, `#/evaluate`, `#/batch`) | v1.17 covered `aria-label` on global search + modal close. Per-input hint association is the next polish layer. |
| Full non-EN README parity (585 lines like EN) | v1.18 brought non-EN to ~307 (53 % of EN). Marketing-heavy "Quick start" + "🌍 Getting Started" walkthroughs remain EN-only. |
| Remove `/api/scan-ru/config` legacy alias | Sunset planned for v1.20. The canonical `/api/scan/regional/config` is the migration target. |

---

## [1.18.0] — 2026-05-13

**Scan 端點合併 + WCAG 2.2 AA 通過 + i18n long-tail 完成。** 退役遺留 `/api/stream/scan-{en,ru}` 別名(Sunset 視窗 2026-10-01 根據使用者指示提前到 v1.18)。把 non-EN README 提到 ~307 列,並在 6 個 locale 中翻譯剩餘的 v1.16.0 + v1.17.0 CHANGELOG RU-bodied 條目。

### 🚪 Breaking

- **`feat!(scan): retire legacy /api/stream/scan-{en,ru} aliases`** — 已棄用的 EN/RU 拆分 SSE 端點已移除。每個消費者通過合併的 `/api/stream/scan?source=ats|regional|both` 端點(自 v1.12.0 起活動)。外部整合現在在舊路徑上獲得乾淨的 **404**,而不是被靜默路由到 SPA catch-all。

### ♿ 無障礙 (WCAG 2.2 AA 通過)

- **WCAG 2.4.1 Bypass Blocks** — 每頁第一個 focusable 的新 **Skip to main content** 連結。
- **WCAG 2.4.7 Focus Visible** — 全域 `*:focus-visible` 樣式。
- **WCAG 2.5.5 Target Size** — `.skip-link` 的最小 44×44 px 觸控目標。`.btn-sm` 保持 32 px min-height。
- **WCAG 3.1.1 Language of Page** — `<html lang="en">` 從 `lang="ru"` 修正。
- **WCAG 1.3.1 Info & Relationships** — `#content` 取得 `tabindex="-1"`。

### 📚 i18n long-tail

- **`docs(i18n): 在 6 個 locale 中翻譯 v1.16.0 + v1.17.0 CHANGELOG`** — 每 locale 的 RU 字元數 79 → 42 → 23。
- **`docs(readme): 用 Why / Requirements / Features / Configuration / Contributing 擴展 non-EN README`** — 每個 non-EN README 從 240 增長到 ~307 列。

### 🧪 測試

- 總計 **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + 32/32 Playwright。

---

## [1.17.0] — 2026-05-13

**Polish + a11y + CI 修復。** 關閉 v1.16.0 REVIEW 的 9 個 follow-up: 瀏覽器 smoke 驗證、README 徽章 truth、coverage 刷新、SPA 中的 `lastWorkdayFallback` 🔒 chip、v1.16 UX 變更後完整 E2E 重新基線、Playwright auto-pipeline 場景、a11y ARIA + focus trap 通過、6 個 locale 中歷史 CHANGELOG 壓縮、帶參考章節的 non-EN README 擴展。

### 🐛 Fixes

- **`fix(e2e): smoke + comprehensive 與 v1.16 UX 重新對齊`** — v1.16 的 Cmd+K Enter → AutoPipeline modal 變更使 e2e 測試的 `search.press('Enter')` 開啟一個 modal,其 backdrop 攔截後續點擊。測試現在使用 `Shift+Enter` 用於 legacy quick-add 路徑。**這就是 v1.16.0 push 上的 CI 失敗** — Playwright e2e 在被 backdrop 攔截的點擊上 30 秒超時。
- **`fix(mode-page): /#/batch-prompt → modes/batch.md 經 serverSlug`** — v1.15 將 legacy mode slug 重新命名為 `batch-prompt`,但伺服器 `POST /api/mode/:slug` 在尋找不存在的 `modes/batch-prompt.md`。新 `serverSlug` 欄位將路由 hash 與父專案的 mode 檔名解耦。
- **`chore: 將 deprecation 訊息從 v1.16.0 → v1.17.0 bump`** — scan-en/scan-ru deprecation 文案和 batch-prompt 橫幅引用了過去的版本。

### ✨ Features

- **`feat(scan): Active Companies 卡片中的 🔒 Workday CAPTCHA chip`** — v1.16 PR-7 的 server-side `lastWorkdayFallback` export 現在被 SPA 消費。`/api/scan-results` 回傳 snapshot;當 Workday tenant 落入 fallback 時,`#/scan` 在 Active Companies 上方渲染 warn-tinted 卡片("🔒 Workday tenant blocked — fallback: 使用 /career-ops scan (Playwright)")。新 `getLastWorkdayFallback()` exporter 避免 ESM live-binding 模糊。2 個新 i18n 鍵 × 8 locales。

### ♿ 無障礙

- **`a11y: ARIA roles + focus management 通過`** —
  - `index.html`: `<aside>`(navigation)、`<header>`(banner)、`<section id="content">`(main)、`<div id="modal">`(帶 aria-modal/aria-labelledby 的 dialog)、`<div id="toast">` + `#conn-banner`(帶 aria-live 的 status)、`<div class="searchbar">`(search) 上的 `role` 屬性。
  - `#sidebar-toggle` 取得 `aria-controls="sidebar"` + 由 JS 在 open/close 時同步的 `aria-expanded`。
  - `#global-search` 取得 visually-hidden `<label>` 加上明確 `aria-label`,後者 surface Cmd+K shortcut 提示。
  - Modal 關閉 (×) 取得 `aria-label="Close dialog"`。
  - 裝飾性 backdrop 取得 `aria-hidden="true"`。
  - **Modal 焦點陷阱** — `UI.modal()` 記住點擊擁有者,在 open 時聚焦第一個 non-close focusable,並在 modal 內循環 Tab/Shift+Tab。`UI.closeModal()` 將焦點恢復到先前的擁有者。
  - `public/css/app.css` 中的新 `.visually-hidden` utility 類別(WAI-ARIA AP 標準模式)。

### 📚 文件

- **`docs(readme): 跨 8 個 README 的徽章 truth`** — tests 徽章 `284 / 379 / 360` → **427**; release 徽章 `v1.9.1 / v1.13.0` → **v1.16.0** 然後 → v1.17.0。
- **`docs(readme): 用參考章節擴展 7 個 non-EN README`** — 每個增長 170 → ~240 列,以原生語言加入 Architecture / API / Security / Tests / A11y / Limitations / License 章節。
- **`docs(changelog): 在 6 個 locale 中壓縮 pre-v1.12 條目`** — 長 RU-bodied v1.11.x + v1.10.x 條目現在被替換為每個 locale 原生語言的緊湊 "Earlier releases" 執行摘要。詳細歷史保留在 `CHANGELOG.md` (EN) 中。

### 🛠️ Tooling

- **`coverage: 刷新數字`** — 最後發布是 95.46% line / 84.06% branch (v1.13.0 REVIEW)。v1.17 基線: **94.14% line / 82.98% branch / 93.20% function**。auto-pipeline + reports-write 中新錯誤路徑導致輕微下降;仍遠高於 CLAUDE.md 的 80% 下限。

### 🧪 測試

- 總計 **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + **32 / 32** Playwright (此前 28;+4 個新 auto-pipeline 場景)。
- E2E 套件與 v1.16.0 UX 重新對齊 (Shift+Enter quick-add, /#/batch-prompt 用於 legacy mode)。

### Out of scope (v1.18+)

| 項 | 說明 |
|---|---|
| 在 non-EN CHANGELOGs 中翻譯 v1.16.0 條目 | 當前 RU-bodied。 |
| 完整 non-EN README 對等(像 EN 一樣 585 列) | v1.17 把 non-EN 提到 ~240;行銷重的章節仍僅 EN。 |
| 完整 WCAG 2.2 AA 審計 | v1.17 涵蓋結構 ARIA + focus trap;按元件 contrast/Tab-order 審計待辦。 |

---

## [1.16.0] — 2026-05-13

**Auto-pipeline 完結 + 適配器拋光 + i18n long-tail。** 關閉 v1.15.0 REVIEW 的 11 個 follow-up: server-side SSE auto-pipeline、`POST /api/reports` primitive、Cmd+K shortcut、SmartRecruiters 分頁、Workday CAPTCHA-fallback、CI screenshot-drift gate、scan source filter UX、歷史 CHANGELOG 翻譯(v1.13.0/v1.12.0 × 6 語言)、non-EN README 擴展、paste-ready trending-companies importer。

### ✨ 功能

- **`feat(auto-pipeline): server-side SSE orchestrator`** (#1, #2, #3, #8) — v1.15 的 client-side chained-fetch orchestrator 已刪除。`POST /api/auto-pipeline` 現在是 curl 可用的 SSE 端點,在伺服器端即時執行 validate → fetch JD → evaluate → save report → tracker,帶即時 step 事件。慢速 Anthropic 呼叫(30–90 秒)現在發出 `running` 事件而非通用 spinner。失敗帶 `step` + `message` 發出 `error`。orchestrator 還將 report markdown 持久化到父 `reports/<slug>.md`(v1.15 中遺失)。
- **`feat(reports): POST /api/reports primitive`** — `server/lib/routes/reports.mjs` 中的新 writer。帶 path-traversal guard 的 slug 淨化。1 MB cap (413)。無 `overwrite:true` 時對 existing file 回傳 409。經 `stripDangerousMarkdown` 的 atomic write。activity.reports.save 日誌。測試: 9 案例。
- **`feat(app): Cmd+K paste URL → auto-pipeline`** — 在 global search 貼上 URL + Enter 現在以 `autoStart=true` 開啟 AutoPipeline modal。Shift+Enter 保留 legacy "add to pipeline only" 路徑。
- **`feat(portals): SmartRecruiters 分頁`** (#4) — `server/lib/sources/smartrecruiters.mjs` 通過 `?limit=100&offset=N` 遍歷頁面,直到達到 `totalFound` 或回傳空頁面或觸發 30 頁 / 3000 jobs 安全上限。大型 boards 不再遺失 postings 的尾部。測試: 6 案例。
- **`feat(portals): Workday CAPTCHA-fallback graceful`** (#7) — `server/lib/sources/workday.mjs` 不再在 4xx / non-JSON / network 錯誤時拋出。回傳 `[]` 並註記新 export `lastWorkdayFallback`。掃描器時間線繼續到下一個 tenant。可通過 `strict:true` 退回 v1.14 拋出行為。測試: 7 案例。

### 🛠️ Tooling + CI

- **`ci(workflows): dashboard-screenshots drift gate`** (#5) — 新 `.github/workflows/dashboard-screenshots.yml`。在觸及 `public/css/app.css`、`public/js/views/dashboard.js`、`public/js/lib/i18n.js` 或 `public/index.html` 的 PR 上,workflow 在 /tmp scaffold 上 boot server,通過 Playwright + chromium 重新生成 8 個 hero PNG,如果結果與 commit 的內容 drift 則建置失敗。
- **`feat(scripts): import-trending-companies.mjs`** (#11) — 通過其真實 boards-API 驗證 `docs/portals-examples.md` 中的 13 trending 公司,並輸出可貼到父 `portals.yml::tracked_companies` 的 YAML。slug 404 的候選會被打上 `enabled: false`。通過 `npm run import:trending` 執行。
- **`feat(scripts): npm run capture:dashboards`** — 將 `scripts/capture-dashboard-screenshots.mjs` 公開為頂級 script。

### 🎨 UX

- **`fix(scan): 合併的 source-filter 下拉選單`** (#6) — `#/scan` source 下拉選單從 v1.14 adapter registry 重建: 6 ATSes + hh.ru + Habr Career,字母排序,無 geo 前綴。`runEnScan`/`runRuScan` 現在擊中合併的 `/api/stream/scan?source={ats,regional}` 端點。

### 📚 i18n long-tail

- **`docs(i18n): 在 6 語言中翻譯 v1.13.0 + v1.12.0 CHANGELOG`** (#9) — 之前 RU-bodied 的條目現在在其真實 locale 中。每個 non-EN/non-RU CHANGELOG 也獲得 i18n 說明,解釋 pre-v1.12 條目按專案約定保留 RU。
- **`docs: 以 v1.16.0 highlights 部分擴展 non-EN README`** (#10) — 7 個 non-EN README 獲得約 35 列的新部分,涵蓋: 一鍵 auto-pipeline + curl 範例、SmartRecruiters 分頁、Workday fallback、scan source-filter UX、importer 腳本、CI screenshot workflow。

### 🧪 測試

- 新 `tests/reports-write.test.mjs` (9 案例) — happy path、slug 淨化(含 path-traversal guard)、409 衝突、overwrite 旗標、XSS 剝離、缺失欄位 400、>1 MB 413、GET/POST round-trip。
- 新 `tests/auto-pipeline.test.mjs` (5 案例) — SSE framing、無效 URL gate、SSRF/loopback gate、無 LLM key 錯誤路徑、`text/event-stream` Content-Type 標頭。
- 新 `tests/smartrecruiters-pagination.test.mjs` (6 案例)。
- 新 `tests/workday-fallback.test.mjs` (7 案例)。
- 總計 **427 / 427** 單元(此前 400;+27 淨增)。0 失敗。

### Out of scope (v1.17+)

| 項 | 說明 |
|---|---|
| 翻譯 pre-v1.12 CHANGELOG 條目(v1.11.x, v1.10.x) | 約定保留: RU-bodied。回填需要 ~1800 列翻譯;推遲。 |
| 完整 non-EN README 對等(像 EN 一樣 585 列) | v1.16 每語言增加 ~35 列;完整鏡像是單獨的翻譯 pass。 |
| SPA Active Companies 卡片的 `lastWorkdayFallback` surface | Server export 已接線;UI 消費為 v1.17。 |
| 9 個已驗證 trending 的 per-company `tracked_companies` 批量加入 | `import:trending` 腳本以 1-command + 1-paste 完成。 |

---

## [1.15.0] — 2026-05-13

**Doc-conformance релиз.** Закрывает 9 из 10 открытых findings из conformance audit (`qa/conformance-vs-docs/00-CONFORMANCE-REPORT.md`) плюс локализованные hero-images. Приводит UI в соответствие с canonical career-ops.org/docs workflow — тот же pipeline что обещает CLI, теперь end-to-end через браузер во всех 8 локалях.

### ✨ Фичи

- **`feat(auto-pipeline): PR-C — 1-click "paste URL → report + PDF + tracker row"`** (G-007) — до v1.15 пользователи делали 5 ручных кликов через /#/pipeline → /#/evaluate → /#/cv → /#/tracker. Теперь одна ✨ кнопка на /#/dashboard chain'ит: validate URL → fetch JD (SSRF-safe) → evaluate против CV → generate PDF → добавить tracker row. Step-by-step modal timeline с [✓]/[…]/[✗]. Heuristic company/role extraction. Новый файл: `public/js/lib/auto-pipeline.js`. 19 новых i18n ключей × 8 локалей.
- **`feat(modes): PR-D — modes/_profile.md редактор как #/config → Modes таб`** (G-008) — канонический "Career framing" файл из Quick Start §Step-5 теперь виден в UI. Новые endpoints `GET/PUT /api/modes/_profile` с 256 KB cap, `stripDangerousMarkdown` XSS pass, scaffold из `_profile.template.md`. 9 новых i18n ключей × 8 локалей.
- **`feat(profile): PR-E — canonical schema + location + headline`** (G-009) — `/api/profile` принимает И legacy (`candidate:{...}`) И canonical (top-level `full_name`, `narrative.headline`, `target_roles.primary`, `compensation.target_range`). Legacy выигрывает при коллизии. Новый `summarizeProfile()`. /#/profile показывает `narrative.headline` как новую карточку. 2 новых i18n ключа × 8 локалей.
- **`feat(tracker): PR-B — Legitimacy колонка на #/tracker`** (G-006) — восстанавливает паритет с canonical pipeline output table. Между Status и PDF, badge-ok/warn/bad подсветка. Graceful degrade для pre-v1.15 строк. 1 новый i18n ключ × 8 локалей.
- **`fix(routing): PR-H — dedupe sidebar; #/batch → v1.13.0 TSV SPA`** (G-011) — до фикса /#/batch был ДВАЖДЫ в sidebar И оба пункта вели в legacy mode-prompt builder. v1.13.0 TSV SPA (8 KB) был недоступен. Убран дубликат; legacy переименован в `batch-prompt` с deprecation banner.

### 📚 Документация

- **`docs(evaluate): PR-A — Block A-F realignment`** (G-005) — career-ops.org/docs использует A–F (Strategy/Personalization/STAR stories в C/E/F). Мы эмитили A–G. v1.15 обновляет все 8 help bundles §9 с canonical A–F и callout о back-compat. ⚠ Parent commit ещё требуется: `santifer/career-ops::modes/oferta.md` надо переписать upstream.
- **`docs: PR-F — seniority_boost + search_queries в help §5 × 8 локалей + scaffold`** (G-010) — Help §5 во всех 8 локалях документирует третий title-filter ключ + блок-пример search_queries. `bin/setup.sh` сидит `seniority_boost: ["Senior", "Staff", "Lead"]` по умолчанию.
- **`docs: PR-I — локализованные hero images по локалям README`** — каждый из 8 README имеет locale-specific `images/dashboard-<locale>.png` (HiDPI 1440×900) сгенерированных через `scripts/capture-dashboard-screenshots.mjs`. Старый `public/images/screen_vacancy_found.png` удалён.

### 🧹 Carryover cleanups

- **`PR-G — G-001`** scan.noResults i18n: заменены 8 строк с "EN or RU scan" литералом.
- **`PR-G — G-002`** 📄 Generate PDF теперь surface'ит на #/interview-prep result panel'ях.
- **`PR-G — G-003`** `README.cn.md` → `README.zh-CN.md` (canonical locale tag).
- **`PR-G — G-004`** `/api/stream/scan-en` + `scan-ru` теперь эмитят RFC 8594 Sunset + Deprecation + Link headers (sunset 2026-10-01). Удаление в v1.16.0.

### 🧪 Тесты

- Новый `tests/profile-canonical-schema.test.mjs` (6 кейсов).
- Новый `tests/modes-profile-crud.test.mjs` (8 кейсов).
- Исправлена isolation регрессия в test fixtures: тесты теперь используют `before/after + dynamic-import` pattern, чтобы не мутировать parent `config/profile.yml`.
- Итого: **400 / 400** unit-тестов (было 386; +14). 0 падений.

### Out of scope (v1.16+)

| Item | Notes |
|---|---|
| Parent commit для canonical A–F prompt | `santifer/career-ops::modes/oferta.md` надо переписать upstream. CLAUDE.md hard rule #1 запрещает нам трогать parent. |
| Server-side `POST /api/auto-pipeline` SSE | Client-side orchestrator ships UX win; server-side даст retry-from-step-N + curl-able CI. |
| `POST /api/reports` primitive | Auto-pipeline показывает markdown inline, но не persist'ит в parent `reports/`. |
| Cmd+K paste-URL → run auto-pipeline | Defer to v1.16+. |

---

## [1.14.0] — 2026-05-13

在 v1.13.0 registry 之上新增 3 個 ATS 適配器,支援的 ATS 總數從 3 → 6 (Greenhouse / Ashby / Lever **+ Workable / SmartRecruiters / Workday-beta**)。面向使用者的文件在 17 個檔案中一次性從 "3 ATSes" 升級為 "6 ATSes"(42 處短語):README × 8 語言、help bundle × 8 語言、PROJECT.md。在 `docs/portals-examples.md` 中加入 13 個 trending 公司的 paste-ready YAML 區塊,可貼到父專案 `portals.yml`。

### ✨ 功能

- **`feat(portals): 3 個新 ATS — Workable, SmartRecruiters, Workday-beta`** — registry 現在解析 6 ATSes(之前 3)。新檔案:`server/lib/portals/adapters/{workable,smartrecruiters,workday}.mjs`(uniform contract 薄包裝器)+ `server/lib/sources/{workable,smartrecruiters,workday}.mjs`(原始 HTTP + 正規化)。
  - **Workable**:偵測 `apply.workable.com/<slug>` 以及 legacy `<subdomain>.workable.com`。Endpoint:`https://apply.workable.com/api/v3/accounts/<slug>/jobs?details=true`。
  - **SmartRecruiters**:偵測 `jobs.smartrecruiters.com/<slug>` 以及 `careers.smartrecruiters.com/<slug>`。Endpoint:`https://api.smartrecruiters.com/v1/companies/<slug>/postings`。
  - **Workday (beta)**:偵測 `<tenant>.wd<N>.myworkdayjobs.com/<lang>/<site>`。Endpoint:POST 到 `/wday/cxs/<tenant>/<site>/jobs`。URL 無 site 時預設 `site=External`。Beta 是因為部分 tenant 用 CAPTCHA 封鎖 CXS feed — fallback 到父專案 `/career-ops scan`(Playwright)。

### 📚 文件

- **`docs(portals-examples): trending boards block`** — `docs/portals-examples.md` 擴展 v1.14.0 部分,把 13 個 trending 公司列為 `tracked_companies` 的 paste-ready YAML:Greenhouse-hosted (Stripe, GitLab, HashiCorp, Cloudflare, Datadog, Hugging Face) + Ashby-hosted (Notion, Linear, PostHog, Replicate, Modal Labs, Fly.io, Render)。全部 `enabled: false` — 使用者啟用前自行驗證 slug。還有 Workable / SmartRecruiters / Workday 範例區塊。
- **`docs(framing): 17 個面向使用者的檔案中 42 處 ATS 短語更新`** — 使用者文件中每處 "Greenhouse / Ashby / Lever" 現在顯示為 "Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday"。受影響:README × 8 語言、help bundle × 8 語言、PROJECT.md。歷史 CHANGELOG 條目和 bug-fix 處方文件(`qa/fixes/F-014`、`qa/FIX-PROMPT`)有意未碰 — 描述過去狀態或已正確。
- **`docs(qa): browser test scenario 19`** — `qa/claude-cowork-browser-test-prompt.md` 擴展 Scenario 19:`ALL_ADAPTERS.length === 6` 不變量、對 6 個全部進行 `resolveAdapter()` URL 偵測掃描、`#/scan` Active Companies 卡片 soft-check、`docs/portals-examples.md` 結構檢查。

### 🧪 測試

- `tests/adapter-registry.test.mjs` 擴展 7 個新案例,涵蓋 3 個新適配器(Workable apply-URL、Workable legacy subdomain、SmartRecruiters jobs.* + careers.*、明確 site 的 Workday tenant.wd5.*、Workday default-site fallback、`ALL_ADAPTERS.length === 6` 不變量、`detectApi()` legacy-shape 相容性)。
- 總計:**386 / 386** unit 測試(之前 379;+7 淨增)。0 失敗。

### Out of scope

| 項 | 說明 |
|---|---|
| 13 個 trending Greenhouse/Ashby 公司的 per-company 條目 | `docs/portals-examples.md` v1.14.0 區塊以 paste 可用 YAML 列出;批量加入父專案 `portals.yml` 為獨立階段。 |
| Workday CAPTCHA-fallback 自動化 | Workday adapter 在 CXS feed 被封時拋出;計畫的 fallback 委派給父專案 `/career-ops scan`(Playwright)。SPA scan UX 接線為 v1.15+。 |

---

## [1.13.0] — 2026-05-13

大型發布。在一次提交中關閉 4 個延期項: PR-4(完整 multer 管道)、Adapter registry(F-018 架構後續)、Batch evaluate SPA 頁面、locale-aware mode-template scaffolding。還有 mid-session 的深色主題表格修復。

### ✨ 功能

- **`feat(cv): multer multipart upload (PR-4 完整)`** — `/api/cv/import` 現在同時接受 octet-stream(原始契約)和 `multipart/form-data`(經 multer)。v1.10.2 的 415-reject 是臨時方案;v1.13.0 是真正修復。curl `-F`、Postman 預設、任何 HTTP 客戶端都順暢工作。新相依: `multer ^2.1.1`。
- **`feat(portals): adapter registry`** — Greenhouse / Ashby / Lever fetcher 抽取到 `server/lib/portals/adapters/*.mjs`,採用統一契約。`server/lib/portals/registry.mjs::resolveAdapter()` 是唯一的 dispatch 點。新增 ATS = `adapters/` 一個檔案 + `ALL_ADAPTERS` 一行。
- **`feat(batch): #/batch evaluate page`** — 新 SPA 檢視 + 4 個端點(`GET /api/batch`、`PUT /api/batch`、`GET /api/stream/batch`、`POST /api/batch/merge`)。`batch/batch-input.tsv` 的 TSV 編輯器,parallel/min-score/dry-run/retry 控件,`bash batch/batch-runner.sh` 的即時 SSE 日誌,`Merge to tracker` 按鈕(執行 `node merge-tracker.mjs`)。Sidebar 連結。21 個新 i18n 鍵 × 8 語言。
- **`feat(prompts): locale-aware mode scaffolding`** — `buildModePrompt` + `buildEvaluationPrompt` 現在用本地化的 scaffolding 文字(role-line、"Read these files first"、"User-supplied context")在 8 個語言中包裹 parent 的 mode-template 英文主體。

### 🎨 UX 修復

- **`fix(theme): 深色模式表格 + tab-btn`** — 硬編碼的 `#fafafa` / `#fff` / `#f7f7f7` 替換為 token。深色下的 hover 現在可讀。新增 `.row-boosted` accent strip。

### 🧪 測試

- 新增 `tests/adapter-registry.test.mjs` (7)、`tests/batch-endpoints.test.mjs` (5)、`tests/locale-scaffold.test.mjs` (6)。
- `tests/cv-upload-multipart-reject.test.mjs` 按 v1.13.0 契約(multipart parsed properly)重寫。
- 總計 **379 / 379** 單元(此前 360;+19)。0 失敗。覆蓋率 **95.46 % 列 / 84.06 % 分支**。
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright。

### 範圍外

- **14 個新 portal adapter** — registry 已就緒;新增 = 每個一個檔案;portal-by-portal 調研仍待辦。
- **翻譯 parent 的 `modes/<slug>.md` 主體** — 需要向 `santifer/career-ops` 提交 upstream PR(CLAUDE.md hard rule #1)。

### 文件

- `docs/reviews/REVIEW-2026-05-13-v1.13.0.md`。
- 完整文本: [CHANGELOG.md](CHANGELOG.md#1130--2026-05-13)。

---

## [1.12.0] — 2026-05-13

錯誤修復 + UX + 品牌 pass。在 v1.11.1 後關閉 8 個 backlog 項(測試空缺 #9–12、console error #8、portals-dead drift #4、seniority_boost surface #6、F-018 端點合併)。新增主題 day/night 切換,所有文件/套件元資料/GitHub 倉庫描述中刪除 "Airbnb-styled" 提及。

### ✨ 功能

- **`feat(theme): day/night 切換`** — top-bar 新增主題按鈕。light ↔ dark 循環,持久化到 `localStorage`,首次繪製前透過 `public/js/lib/theme-bootstrap.js` 還原。首次載入尊重 `prefers-color-scheme`。`public/css/app.css` 中 `[data-theme="dark"]` 下完整深色調色板。
- **`feat(scan): /api/stream/scan?source=ats|regional|both` (F-018 LITE)`** — 單一合併的 SSE 端點。SPA 打開一個 event-stream,順序執行兩階段(ATS,然後 regional)。舊版 `/api/stream/scan-en` + `/api/stream/scan-ru` 作為 deprecated alias 保留。
- **`feat(scan): seniority_boost surface`** — 兩個掃描器都讀取 `portals.yml::title_filter.seniority_boost`,在匹配 job 上標記 `_boosted: true`。SPA 將 boosted 列排到頂部並渲染 `⬆ boosted` badge。

### 🐛 修復

- **`fix(ui): 4 處 .message null-safe (#8)`** — `app.js`、`views/tracker.js`、`views/apply.js`、`views/evaluate.js`。此前沒有 Error payload 的 Promise rejection 在 e2e teardown 中拋出 "Cannot read properties of undefined"。
- **`fix(test): portals-dead drift 改為 warning 而非 failure (#4)`** — assertion 轉為 stderr warning。CI 在 parent drift 上保持綠色;release 決策仍由人工把關。

### 📝 Brand / docs

- **`docs(brand): 所有 doc + package + GitHub 倉庫描述中刪除 'Airbnb' 引用`** — 8 個 README、CLAUDE.md、FRONTEND.md、package.json 及倉庫描述從 "Airbnb-styled" 遷移到 "Clean, docs-style"。

### 🧪 測試

- 新增 `tests/canonical-docs-coverage.test.mjs` (5 案例) 關閉 test gap #9–12。
- 新增 `tests/scan-consolidated.test.mjs` (6 案例) 涵蓋 F-018 LITE。
- 總計 **360 / 360** 單元(此前 349;+11 新增)。0 失敗。覆蓋率: **95.62 % 列 / 84.37 % 分支**。
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright。

### 文件

- `docs/reviews/REVIEW-2026-05-13-v1.12.0.md`。
- 完整文本: [CHANGELOG.md](CHANGELOG.md#1120--2026-05-13)。

### 範圍外 (自 v1.11.1 起無變化)

Batch evaluate SPA 頁面;完整 adapter registry(F-018 架構 refactor);完整 multer 管道(PR-4);mode template 翻譯。

---

## 之前的發布 (v1.11.x 和 v1.10.x)

v1.11.0 / v1.11.1 / v1.10.0–v1.10.3 的詳細條目在 [英文 CHANGELOG](CHANGELOG.md) 中。摘要:

- **v1.11.1 — 2026-05-13** · 拋光: `#/apply` 的 Playwright 提示、統一的 taglines、儀表板 score-thresholds 卡片。349/349 測試。
- **v1.11.0 — 2026-05-13** · 在 8 個 help bundle 和 8 個 README 中整合 career-ops.org/docs。新 `docs/career-ops-canonical.md`。Mode/Archetype/Pipeline/Tracker/Report/Scan history 概念已文件化。348/349 測試。
- **v1.10.3 — 2026-05-12** · 錯誤修復切片:關閉 v1.10.2 迴歸執行的 11 個 QA 發現中的 7 個。
- **v1.10.2 — 2026-05-12** · CV multipart 415-拒絕 (v1.13.0 multer 之前的臨時補丁);PDF 生成修復。
- **v1.10.1 — 2026-05-09** · 來自 v1.10.0 發布 QA 迴歸執行的關鍵補丁。
- **v1.10.0 — 2026-05-08** · `#/profile` 編輯器 + CV 上傳 UX (pandoc/pdftotext/passthrough),8 個 locale × 16 H2 help 對等,locale switcher。
