# 變更日誌

**career-ops-ui** 的所有重要變更。格式遵循 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),版本號遵循 [SemVer](https://semver.org/)。

翻譯: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md)

> **i18n 註釋** — 從 v1.12.0 起,各條目按語言本地化。之前的條目(v1.11.x、v1.10.x)按專案慣例保留俄文;規範英文正文在 [CHANGELOG.md](CHANGELOG.md)。

---

## [1.16.0] — 2026-05-13

**Auto-pipeline finalization + adapter polish + i18n long-tail.** Закрывает все 11 follow-up из v1.15.0 REVIEW: server-side SSE auto-pipeline, `POST /api/reports` primitive, Cmd+K shortcut, SmartRecruiters пагинация, Workday CAPTCHA-fallback, CI screenshot-drift gate, scan source filter UX, перевод исторического CHANGELOG (v1.13.0/v1.12.0 × 6 локалей), расширение non-EN READMEs, paste-ready trending-companies importer.

### ✨ Фичи

- **`feat(auto-pipeline): server-side SSE orchestrator`** (#1, #2, #3, #8) — v1.15 client-side chained-fetch orchestrator удалён. `POST /api/auto-pipeline` теперь curl-able SSE endpoint, гоняющий chain validate → fetch JD → evaluate → save report → tracker server-side с real-time step events. Медленный Anthropic call (30–90 с) теперь эмитит `running` event вместо generic спиннера. Failures эмитят `error` с `step` + `message`. Orchestrator также persist'ит report markdown в parent `reports/<slug>.md` (терялось в v1.15).
- **`feat(reports): POST /api/reports primitive`** — новый writer в `server/lib/routes/reports.mjs`. Slug sanitization с path-traversal guard. 1 MB cap (413). 409 на existing file без `overwrite:true`. Atomic write через `stripDangerousMarkdown`. Тесты: 9 кейсов.
- **`feat(app): Cmd+K paste URL → auto-pipeline`** — paste URL в global search + Enter теперь открывает AutoPipeline modal с `autoStart=true`. Shift+Enter сохраняет legacy "add to pipeline only" поведение.
- **`feat(portals): SmartRecruiters пагинация`** (#4) — обходит ВСЕ страницы, не только первые 100. Safety cap: 30 страниц / 3000 jobs. Strip caller-supplied limit/offset. Тесты: 6 кейсов.
- **`feat(portals): Workday CAPTCHA-fallback graceful`** (#7) — не throws на 4xx / non-JSON / network errors. Возвращает `[]` и аннотирует `lastWorkdayFallback`. Опт-ин обратно через `strict:true`. Тесты: 7 кейсов.

### 🛠️ Tooling + CI

- **`ci(workflows): dashboard-screenshots drift gate`** (#5) — `.github/workflows/dashboard-screenshots.yml` регенерит 8 hero PNGs и валит build при visual drift'е.
- **`feat(scripts): import-trending-companies.mjs`** (#11) — верифицирует 13 trending компаний из `docs/portals-examples.md` и эмитит paste-ready YAML. Запуск: `npm run import:trending`.
- **`feat(scripts): npm run capture:dashboards`** — exposes Playwright capture как top-level script.

### 🎨 UX

- **`fix(scan): consolidated source-filter dropdown`** (#6) — dropdown пересобран из v1.14 adapter registry: 6 ATSes + hh.ru + Habr Career, алфавитный порядок, без geo-префиксов. `runEnScan`/`runRuScan` теперь используют `/api/stream/scan?source={ats,regional}` consolidated endpoint.

### 📚 i18n long-tail

- **`docs(i18n): translate v1.13.0 + v1.12.0 CHANGELOG в 6 локалях`** (#9) — записи переведены на их фактический язык. Каждая локаль также получает i18n note о том что pre-v1.12 записи остаются RU-bodied per project convention.
- **`docs: expand non-EN READMEs с v1.16.0 highlights section`** (#10) — 6 non-EN READMEs + RU READMEs получают ~35-line section про auto-pipeline + curl example + остальные v1.16 фичи.

### 🧪 Тесты

- Новые `tests/reports-write.test.mjs` (9), `tests/auto-pipeline.test.mjs` (5), `tests/smartrecruiters-pagination.test.mjs` (6), `tests/workday-fallback.test.mjs` (7).
- Итого: **427 / 427** unit (было 400; +27). 0 failures.

### Out of scope (v1.17+)

| Item | Notes |
|---|---|
| Parent commit для canonical A-F prompt | Всё ещё ждёт upstream rewrite `santifer/career-ops::modes/oferta.md` (CLAUDE.md hard rule #1). |
| Translate pre-v1.12 CHANGELOG (v1.11.x, v1.10.x) | Сохранена convention: RU-bodied. ~1800 строк перевода — отложено. |
| Full non-EN README паритет (585 строк как EN) | v1.16 добавил ~35 строк per locale; полный паритет — отдельный effort. |

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

## [1.11.1] — 2026-05-13

Глубокая интеграция career-ops.org/docs — follow-up к v1.11.0. v1.11.0 добавил summary блок; v1.11.1 обогащает существующие §5 Portals / §7 Scan / §14 Apply каждого help-бандла **полными CLI-флоу** (команды verbatim, нумерованные apply-шаги, batch-evaluate runner, Playwright setup). `#/reports` получает карточку score → action.

### 📝 Документация

- **Help-бандлы (все 8 локалей)** — три новые подсекции в каждом, переведено:
  - **§5 Portals → `CLI flow`** — `cp templates/portals.example.yml`, schema title_filter / tracked_companies / search_queries.
  - **§7 Scan → `CLI scan flow`** — Option A (`npm run scan`) для Greenhouse/Ashby/Lever, Option B (`/career-ops scan`) для non-API discovery, таблица action thresholds.
  - **§14 Apply → `Full CLI apply flow` + `Batch evaluate` + `Playwright setup`** — 8-шаговый apply, `./batch/batch-runner.sh --parallel`, `npx playwright install chromium`.
- Все 8 бандлов сохраняют 16-H2 parity.

### ✨ UI

- **`#/reports`** — новая свёртываемая карточка над списком с канонической таблицей score → действие. 7 новых i18n-ключей × 8 локалей.

### 📋 QA

- **`qa/claude-cowork-browser-test-prompt.md`** — добавлены Сценарий 17 (career-ops.org/docs coverage, 5 подпунктов) + Сценарий 18 (help bundle parity).

### Тесты

- **348 / 349** юнит (1 pre-existing drift), 94.59% линий, 23/23 E2E, 28/28 Playwright.

### Документация

- `docs/reviews/REVIEW-2026-05-13-v1.11.1.md`.
- Полный текст: [CHANGELOG.md](CHANGELOG.md#1111--2026-05-13).

---

## [1.11.0] — 2026-05-13

Интеграция career-ops.org/docs. Все изменения аддитивные (нет breakage API, нет смены маршрутов SPA, нет смены формы данных). Закрывает PR-9, отложенный из v1.10.3.

### 📝 Документация

- **Новый `docs/career-ops-canonical.md`** — каноническая EN-справка, собранная из [career-ops.org/docs](https://career-ops.org/docs) и 5 саб-гайдов (What is career-ops, Scan job portals, Apply for a job, Batch-evaluate offers, Set up Playwright).
- **Все 8 help-бандлов** получили новую front-matter секцию `About career-ops` сразу после H1: принципы, ключевые концепты (Mode / Archetype / Pipeline / Tracker / Report / Scan history), различие career-ops vs career-ops-ui, пороги действий по score (≥4.5 / 4.0–4.4 / 3.5–3.9 / <3.5), ссылки на 5 канонических гайдов. H2 count сохранён — 16 на локаль.
- **Все 8 README** получили блок `About career-ops` перед install-якорем. Секции `What's new in v1.10.x` убраны с первого экрана (полная история — в CHANGELOG).

### ✨ UI

- **`#/apply`** — info-баннер теперь явно ссылается на гайд по настройке Playwright (`career-ops.org/docs/.../set-up-playwright`) и канонический Apply guide. Новые i18n-ключи `apply.playwrightHint` + `apply.docsLink` локализованы для 8 локалей.

### Аудит (что отложено)

- **Batch evaluate SPA-страница** — каноническая дока описывает CLI-only поток (`batch/batch-runner.sh`). SPA-эквивалент требует новой view + 3 эндпоинтов + фикстур + тестов. Многодневная фаза.
- **Полный адаптерный реестр** (F-018 / PR-1) — всё ещё в очереди.
- **Полный multer-pipeline** — v1.10.2 закрыл дыру через 415; рефактор остаётся отложенным.

### Тесты

- **348 / 349** юнит (1 pre-existing parent-data drift), 94.59% линий / 84.24% веток, 23/23 comprehensive E2E, 28/28 Playwright.

### Документация

- `docs/reviews/REVIEW-2026-05-13-v1.11.0.md`.
- Полный текст: [CHANGELOG.md](CHANGELOG.md#1110--2026-05-13).

---

## [1.10.3] — 2026-05-12

Закрывает 7 из 11 находок v1.10.0 QA (F-001, F-010 минимум, F-011 минимум, F-013, F-014, F-015, F-019). Оставшиеся 4 (F-018 — полная консолидация адаптерного реестра; PR-4 полный multer-pipeline; PR-7 follow-up; PR-9 doc sweep по career-ops.org docs) отложены в v1.11.0.

### ✨ Фичи

- **`feat(pdf): Generate-PDF на каждой длинной поверхности (F-015)`** — три новых SSE-эндпоинта (`GET /api/stream/pdf/report?slug=`, `GET /api/stream/pdf/deep?name=`, `POST /api/stream/pdf/inline { markdown }`) и общий хелпер `public/js/lib/pdf-generate.js`. Кнопка **📄 Generate PDF** теперь на `#/reports/:slug`, `#/deep` (manual + live), `#/evaluate` (manual + live), `#/interview-prep`.
- **`feat(config): региональная группа конфига (F-013)`** — `/api/config` отдаёт `groups` (`core | runtime | regional`) и `regionalActive`. SPA рендерит три свёртываемые секции; **Regional sources** auto-collapsed и показывается только когда есть региональный источник.

### 🐛 Фиксы

- **`fix(server): глобальный Express error handler (F-019)`** — `PayloadTooLargeError` и невалидный JSON теперь возвращают JSON-конверт (413 / 400). Раньше шёл HTML stack trace.
- **`fix(i18n): EN-токены больше не протекают в не-EN UI (F-001)`** — локализованы `Pipeline`, `Deep research`, `Follow-up`, `Health`, `Outreach`, `Doctor`, `Quick scan`.
- **`fix(scan): EN/RU framing удалён из ярлыков (F-010 минимум)`** — ярлыки читаются как "ATS adapters" + "Regional portals". Два SSE-эндпоинта оставлены; полная консолидация — PR-1 / v1.11.0.
- **`fix(scan): счётчик Active-Companies авто-обновляется (F-011 минимум)`** — view диспатчит `scan:refresh` после каждого `refreshResults()`; счётчик считает компании с хитами из реального `/api/scan-results`.
- **`docs(en-ru-framing): sweep по README + help-бандлам (F-014)`** — `EN sweep` → `ATS sweep`, `RU sweep` → `regional sweep`, и т.п. в `README.md`, `README.ru.md`, `README.ja.md`, `README.ko-KR.md`, `docs/help/en.md`, `docs/help/es.md`, `docs/help/pt-BR.md`.

### 🧪 Тесты

- Новые `tests/global-error-handler.test.mjs` (2 кейса), `tests/config-groups.test.mjs` (2 кейса), `tests/pdf-extra-routes.test.mjs` (5 кейсов).
- Итого: **349 / 350** юнит-тестов (1 pre-existing drift). Покрытие 94.59 % линий / 84.16 % веток. 23/23 comprehensive E2E, 28/28 Playwright.

### 📝 Документация

- `docs/reviews/REVIEW-2026-05-12-v1.10.3.md` — контекст сессии + список отложенного.
- Все 8 README обновлены, все 8 CHANGELOG-ов получили эту запись.

### За пределами слайса (отложено в v1.11.0)

PR-1 (полный адаптерный реестр), PR-4 (multer-pipeline), PR-9 (career-ops.org docs integration в 7 не-EN локалей + UI-аудит).

---

## [1.10.2] — 2026-05-12

功能回歸修補。修復 v1.10.1 手動驗證中發現的兩個 bug;擴充文件面。

### 🐛 修復

- **`fix(cv): /api/cv/import 用 415 拒絕 multipart/form-data`** — 預設傳送 `multipart/form-data` 的外部用戶端以前會把 wire envelope 寫入 `cv.md`。現在 415 加提示。SPA 路徑(octet-stream + X-Filename)不受影響。
- **`fix(pdf): /api/stream/pdf 用正確的位置引數呼叫 generate-pdf.mjs`** — 以前用 `[]` 呼叫,指令碼印出 `Usage:` 並以代碼 1 退出,不生成 PDF。現在路由把 `cv.md` 渲染為 HTML,寫入 `output/cv-input-<TIMESTAMP>.html`,然後用 `<input.html> <output.pdf> --format=a4` 啟動指令碼。

### 🧪 測試

- 新增 `tests/cv-upload-multipart-reject.test.mjs`(5 案例),新增 `tests/pdf-stream-args.test.mjs`(3 案例)。**單元測試 340 個**(原 318)。覆蓋率 94.63 % 行 / 84.94 % 分支。

### 📝 文件

- 新增 `docs/test-scenarios/` — 21 個英文情境檔案。
- 新增 `docs/reviews/REVIEW-2026-05-12-v1.10.2.md`。
- 完整文字見 [CHANGELOG.md](CHANGELOG.md#1102--2026-05-12)。

---

## [1.10.1] — 2026-05-09

基於 v1.10.0 QA 回歸結果的關鍵修復補丁 (`qa/reports/00-FINAL-SUMMARY.md`)。

### 🛡️ 安全

- **`fix(security): SSRF 攻擊面收緊 + DNS 重綁定防禦 (PR-3 / F-003)`** — `isValidJobUrl` 現拒絕 RFC1918、整個 127/8 迴環、鏈路本地 `169.254/16`(含 AWS IMDS)、`0.0.0.0`、CGNAT `100.64/10`、IPv6 ULA / 鏈路本地。新增輔助函式 `isPrivateOrLoopbackHost()`。預覽代理在每一跳進行 `dns.lookup`,地址落入私有範圍即阻斷 — 防禦 DNS 重綁定。

### 🐛 修復

- **`fix(activity)`**: 僅記錄成功的狀態變更 (PR-5 / F-005);4xx 拒絕的請求不再寫日誌。新增 `profile.save`、`config.save`、`cv.import` 事件 (F-008)。
- **`fix(help)`**: 新增 `ko` → `ko-KR.md` 別名,讓韓文本文不再回退到英文 (F-002)。
- **`fix(llm): /api/evaluate 尊重 mode:'manual'`** — 與 `/api/deep` 行為一致,不消耗 Anthropic 額度 (F-009)。
- **`fix(api): DELETE /api/pipeline`** 同時接受 `?url=` 與 `body.url`;URL 不存在時回傳 404 (PR-6 / F-017)。

### ✨ 功能

- **`feat(llm): 所有提示注入 locale (PR-2 / F-012)`** — `resolveLocale(req)`、`buildLocaleDirective(lang)`。SPA 自動附加 `Accept-Language` + `lang`。
- **`feat(scripts): post-qa-cleanup.mjs (PR-11)`** — 重播 QA 回歸後清理清單;`--apply` 寫入,預設 dry-run,冪等。

### 🧪 測試

- 新增 `tests/critical-fixes.test.mjs`(15 案例)。`tests/url-validation.test.mjs` 擴充 5 個案例。**單元測試 318 個**(原 298)。`portals-dead.test.mjs` 中既有失敗源於 parent 的 `templates/portals.example.yml` 資料漂移 — 與 web-ui 程式碼無關。

### 📝 文件

- 新增 `docs/reviews/REVIEW-2026-05-09-v1.10.1.md`。所有 8 個 README 已更新(徽章 + 截圖 + 「v1.10.1 新增內容」章節)。所有 8 個 CHANGELOG 收錄此條目。

---

## [1.10.0] — 2026-05-08

> 完整文字見 [CHANGELOG.md](CHANGELOG.md#1100--2026-05-08)。摘要:CV 匯入(`.docx`/`.doc`/`.odt`/`.rtf`/`.pdf`/`.html`/`.txt`/`.md`,經 pandoc + pdftotext,上限 10 MB)、Generate-PDF 後自動下載新 PDF、`#/config` 雙標籤頁(API keys & runtime + Profile)、`#/profile` 正式成為標準路由、8 個 locale 說明文件刷新。

---

## [1.9.1] — 2026-05-08

生產就緒通過。4 項定向修復(BF-1..BF-4),Playwright 煙霧測試從 5 個擴展到 12 個。

### 🐛 修復

- **BF-1 (tracker)**: `|` 和換行的轉義現在套用於所有儲存格,不僅是 notes。`"Acme | Co"` 這樣的名稱不會再破壞表格。`parseMarkdownTable` 支援 GFM 的 `\|` 轉義 — 無損 round-trip。
- **BF-2 (config)**: `updateEnvFile` 包裹在 try/catch 中 — 權限拒絕時回傳乾淨的 500 而不是未處理的 rejection。
- **BF-3/BF-4 (llm)**: 在 `/api/evaluate`、`/api/deep`、`/api/mode/:slug` 的 Anthropic 分支上對組裝的 prompt 設 200 KB 軟上限 — 回傳 413 而不是逾時。

### 🧪 Playwright 煙霧測試 — 5 → 12 個

Tracker(含 BF-1 round-trip)、pipeline 新增 + 無效 URL 掃除、reports 空狀態、evaluate 手動回退、config 金鑰遮罩、CV PUT 淨化、pipeline preview 400。

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
