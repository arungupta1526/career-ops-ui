# 变更日志

**career-ops-ui** 的所有重要变更。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/),版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。

翻译: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [繁體中文](CHANGELOG.zh-TW.md)

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

在 v1.13.0 registry 之上新增 3 个 ATS 适配器,支持的 ATS 总数从 3 → 6 (Greenhouse / Ashby / Lever **+ Workable / SmartRecruiters / Workday-beta**)。面向用户的文档在 17 个文件中一次性从 "3 ATSes" 升级为 "6 ATSes"(42 处短语):README × 8 语言、help bundle × 8 语言、PROJECT.md。在 `docs/portals-examples.md` 中加入 13 个 trending 公司的 paste-ready YAML 块,可粘贴到父项目 `portals.yml`。

### ✨ 功能

- **`feat(portals): 3 个新 ATS — Workable, SmartRecruiters, Workday-beta`** — registry 现在解析 6 ATSes(之前 3)。新文件:`server/lib/portals/adapters/{workable,smartrecruiters,workday}.mjs`(uniform contract 薄包装器)+ `server/lib/sources/{workable,smartrecruiters,workday}.mjs`(原始 HTTP + 规范化)。
  - **Workable**:检测 `apply.workable.com/<slug>` 以及 legacy `<subdomain>.workable.com`。Endpoint:`https://apply.workable.com/api/v3/accounts/<slug>/jobs?details=true`。
  - **SmartRecruiters**:检测 `jobs.smartrecruiters.com/<slug>` 以及 `careers.smartrecruiters.com/<slug>`。Endpoint:`https://api.smartrecruiters.com/v1/companies/<slug>/postings`。
  - **Workday (beta)**:检测 `<tenant>.wd<N>.myworkdayjobs.com/<lang>/<site>`。Endpoint:POST 到 `/wday/cxs/<tenant>/<site>/jobs`。URL 无 site 时默认 `site=External`。Beta 是因为部分 tenant 用 CAPTCHA 封锁 CXS feed — fallback 到父项目 `/career-ops scan`(Playwright)。

### 📚 文档

- **`docs(portals-examples): trending boards block`** — `docs/portals-examples.md` 扩展 v1.14.0 部分,把 13 个 trending 公司列为 `tracked_companies` 的 paste-ready YAML:Greenhouse-hosted (Stripe, GitLab, HashiCorp, Cloudflare, Datadog, Hugging Face) + Ashby-hosted (Notion, Linear, PostHog, Replicate, Modal Labs, Fly.io, Render)。全部 `enabled: false` — 用户启用前自行验证 slug。还有 Workable / SmartRecruiters / Workday 示例块。
- **`docs(framing): 17 个面向用户的文件中 42 处 ATS 短语更新`** — 用户文档中每处 "Greenhouse / Ashby / Lever" 现在显示为 "Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday"。受影响:README × 8 语言、help bundle × 8 语言、PROJECT.md。历史 CHANGELOG 条目和 bug-fix 处方文档(`qa/fixes/F-014`、`qa/FIX-PROMPT`)有意未触 — 描述过去状态或已正确。
- **`docs(qa): browser test scenario 19`** — `qa/claude-cowork-browser-test-prompt.md` 扩展 Scenario 19:`ALL_ADAPTERS.length === 6` 不变量、对 6 个全部进行 `resolveAdapter()` URL 检测扫描、`#/scan` Active Companies 卡片 soft-check、`docs/portals-examples.md` 结构检查。

### 🧪 测试

- `tests/adapter-registry.test.mjs` 扩展 7 个新案例,覆盖 3 个新适配器(Workable apply-URL、Workable legacy subdomain、SmartRecruiters jobs.* + careers.*、显式 site 的 Workday tenant.wd5.*、Workday default-site fallback、`ALL_ADAPTERS.length === 6` 不变量、`detectApi()` legacy-shape 兼容性)。
- 总计:**386 / 386** unit 测试(之前 379;+7 净增)。0 失败。

### Out of scope

| 项 | 说明 |
|---|---|
| 13 个 trending Greenhouse/Ashby 公司的 per-company 条目 | `docs/portals-examples.md` v1.14.0 块以 paste 可用 YAML 列出;批量加入父项目 `portals.yml` 是独立阶段。 |
| Workday CAPTCHA-fallback 自动化 | Workday adapter 在 CXS feed 被封时抛出;计划的 fallback 委托给父项目 `/career-ops scan`(Playwright)。SPA scan UX 接线为 v1.15+。 |

---

## [1.13.0] — 2026-05-13

Большой релиз. Закрывает все 4 отложенных пункта одним коммитом: PR-4 (полный multer pipeline), Adapter registry (архитектурное продолжение F-018), Batch evaluate SPA-страница, и locale-aware mode-template scaffolding. Плюс mid-session фикс таблиц в dark theme.

### ✨ Фичи

- **`feat(cv): multer multipart upload (PR-4 полный)`** — `/api/cv/import` теперь принимает И octet-stream (оригинальный контракт), И `multipart/form-data` через multer. v1.10.2 415-reject был заглушкой; v1.13.0 — настоящий fix. curl `-F`, Postman default, любой HTTP-клиент работают seamlessly. Новая зависимость: `multer ^2.1.1`.
- **`feat(portals): adapter registry`** — Greenhouse / Ashby / Lever fetcher'ы вынесены в `server/lib/portals/adapters/*.mjs` с единым контрактом. `server/lib/portals/registry.mjs::resolveAdapter()` — единая точка диспатча. Добавление нового ATS теперь = один файл в `adapters/` + строчка в `ALL_ADAPTERS`.
- **`feat(batch): #/batch evaluate page`** — новая SPA-view + 4 эндпоинта (`GET /api/batch`, `PUT /api/batch`, `GET /api/stream/batch`, `POST /api/batch/merge`). TSV-редактор для `batch/batch-input.tsv`, контролы parallel/min-score/dry-run/retry, live SSE log `bash batch/batch-runner.sh`, кнопка `Merge to tracker` (запускает `node merge-tracker.mjs`). Sidebar link. 21 новый i18n-ключ × 8 локалей.
- **`feat(prompts): locale-aware mode scaffolding`** — `buildModePrompt` + `buildEvaluationPrompt` теперь оборачивают английское тело parent'овского mode-template'а локализованным scaffolding-текстом (role-line, "Read these files first", "User-supplied context") на 8 локалях.

### 🎨 UX фиксы

- **`fix(theme): dark-mode таблицы + tab-btn`** — захардкоженные `#fafafa` / `#fff` / `#f7f7f7` заменены на токены. Hover на тёмной теме теперь читается. Добавлен `.row-boosted` accent strip.

### 🧪 Тесты

- Новые `tests/adapter-registry.test.mjs` (7), `tests/batch-endpoints.test.mjs` (5), `tests/locale-scaffold.test.mjs` (6).
- `tests/cv-upload-multipart-reject.test.mjs` переписан под v1.13.0 контракт (multipart parsed properly).
- Итого: **379 / 379** юнит-тестов (было 360; +19). 0 failures. Покрытие **95.46% линий / 84.06% веток**.
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright.

### За пределами слайса

- **14 новых portal adapter'ов** — registry готов, добавление = один файл каждый; portal-by-portal research остаётся.
- **Перевод parent's `modes/<slug>.md` тел** — требует PR в upstream `santifer/career-ops` (CLAUDE.md hard rule #1).

### Документация

- `docs/reviews/REVIEW-2026-05-13-v1.13.0.md`.
- Полный текст: [CHANGELOG.md](CHANGELOG.md#1130--2026-05-13).

---

## [1.12.0] — 2026-05-13

Bug-fix + UX + brand pass. Закрывает 8 пунктов backlog'а после v1.11.1 (тестовые дыры #9–12, console error #8, portals-dead drift #4, seniority_boost surface #6, F-018 endpoint consolidation). Добавлен day/night toggle темы, убрано упоминание "Airbnb-styled" из всех документов, package metadata и описания GitHub-репо.

### ✨ Фичи

- **`feat(theme): day/night toggle`** — новая кнопка темы в top-bar. Cycles light ↔ dark, сохраняется в `localStorage`, восстанавливается до рендера через pre-paint bootstrap (`public/js/lib/theme-bootstrap.js`). Уважает `prefers-color-scheme` для первой загрузки. Полная dark-палитра в `public/css/app.css` под `[data-theme="dark"]`.
- **`feat(scan): /api/stream/scan?source=ats|regional|both` (F-018 LITE)`** — один консолидированный SSE endpoint. SPA открывает ОДИН event-stream, который последовательно прогоняет обе фазы (ATS, потом regional). Legacy `/api/stream/scan-en` + `/api/stream/scan-ru` остаются как deprecated aliases.
- **`feat(scan): seniority_boost surface`** — оба сканера читают `portals.yml::title_filter.seniority_boost` и проставляют `_boosted: true` на джобах с матчем. SPA сортирует boosted-строки наверх и рендерит `⬆ boosted` badge.

### 🐛 Фиксы

- **`fix(ui): null-safe .message в 4 местах (#8)`** — `app.js`, `views/tracker.js`, `views/apply.js`, `views/evaluate.js`. Раньше Promise rejection без Error payload бросал "Cannot read properties of undefined" в e2e teardown.
- **`fix(test): portals-dead drift warning instead of failure (#4)`** — конвертирован assertion в stderr warning. CI идёт зелёным на parent drift; release-решения остаются ручными.

### 📝 Brand / docs

- **`docs(brand): убраны 'Airbnb' references из всех doc + package + GitHub repo description`** — 8 README, CLAUDE.md, FRONTEND.md, package.json и описание репо переведены с "Airbnb-styled" на "Clean, docs-style".

### 🧪 Тесты

- Новый `tests/canonical-docs-coverage.test.mjs` (5 кейсов) закрывает test gaps #9–12.
- Новый `tests/scan-consolidated.test.mjs` (6 кейсов) покрывает F-018 LITE.
- Итого: **360 / 360** юнит-тестов (было 349; +11 новых). 0 failures. Покрытие: **95.62 % линий / 84.37 % веток**.
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright.

### Документация

- `docs/reviews/REVIEW-2026-05-13-v1.12.0.md`.
- Полный текст: [CHANGELOG.md](CHANGELOG.md#1120--2026-05-13).

### За пределами слайса (без изменений с v1.11.1)

Batch evaluate SPA-страница; полный adapter registry (F-018 архитектурный рефактор); полный multer pipeline (PR-4); перевод mode templates.

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

功能回归补丁。修复 v1.10.1 手动验证中发现的两个 bug;扩展文档面。

### 🐛 修复

- **`fix(cv): /api/cv/import 用 415 拒绝 multipart/form-data`** — 默认发送 `multipart/form-data` 的外部客户端以前会把 wire envelope 写入 `cv.md`。现在 415 加提示。SPA 路径(octet-stream + X-Filename)不受影响。
- **`fix(pdf): /api/stream/pdf 用正确的位置参数调用 generate-pdf.mjs`** — 以前用 `[]` 调用,脚本打印 `Usage:` 并以代码 1 退出,不生成 PDF。现在路由把 `cv.md` 渲染为 HTML,写入 `output/cv-input-<TIMESTAMP>.html`,然后用 `<input.html> <output.pdf> --format=a4` 启动脚本。

### 🧪 测试

- 新增 `tests/cv-upload-multipart-reject.test.mjs`(5 用例),新增 `tests/pdf-stream-args.test.mjs`(3 用例)。**单元测试 340 个**(原 318)。覆盖率 94.63 % 行 / 84.94 % 分支。

### 📝 文档

- 新增 `docs/test-scenarios/` — 21 个英文场景文件。
- 新增 `docs/reviews/REVIEW-2026-05-12-v1.10.2.md`。
- 完整文本见 [CHANGELOG.md](CHANGELOG.md#1102--2026-05-12)。

---

## [1.10.1] — 2026-05-09

基于 v1.10.0 QA 回归结果的关键修复补丁 (`qa/reports/00-FINAL-SUMMARY.md`)。

### 🛡️ 安全

- **`fix(security): SSRF 攻击面收紧 + DNS 重绑定防御 (PR-3 / F-003)`** — `isValidJobUrl` 现拒绝 RFC1918、整个 127/8 回环、链路本地 `169.254/16`（含 AWS IMDS）、`0.0.0.0`、CGNAT `100.64/10`、IPv6 ULA / 链路本地。新增辅助函数 `isPrivateOrLoopbackHost()`。预览代理在每一跳进行 `dns.lookup`,地址落入私有范围即阻断 — 防御 DNS 重绑定。

### 🐛 修复

- **`fix(activity)`**: 仅记录成功的状态变更 (PR-5 / F-005);4xx 拒绝的请求不再写日志。新增 `profile.save`、`config.save`、`cv.import` 事件 (F-008)。
- **`fix(help)`**: 添加 `ko` → `ko-KR.md` 别名,使韩语正文不再回退到英文 (F-002)。
- **`fix(llm): /api/evaluate 尊重 mode:'manual'`** — 与 `/api/deep` 行为一致,不消耗 Anthropic 额度 (F-009)。
- **`fix(api): DELETE /api/pipeline`** 同时接受 `?url=` 与 `body.url`;URL 不存在时返回 404 (PR-6 / F-017)。

### ✨ 功能

- **`feat(llm): 所有提示注入 locale (PR-2 / F-012)`** — `resolveLocale(req)`、`buildLocaleDirective(lang)`。SPA 自动附加 `Accept-Language` + `lang`。
- **`feat(scripts): post-qa-cleanup.mjs (PR-11)`** — 重放 QA 回归后清理清单;`--apply` 写入,默认 dry-run,幂等。

### 🧪 测试

- 新增 `tests/critical-fixes.test.mjs`(15 用例)。`tests/url-validation.test.mjs` 扩展 5 个用例。**单元测试 318 个**(原 298)。`portals-dead.test.mjs` 中已有失败源于 parent 的 `templates/portals.example.yml` 数据漂移 — 与 web-ui 代码无关。

### 📝 文档

- 新增 `docs/reviews/REVIEW-2026-05-09-v1.10.1.md`。所有 8 个 README 已更新(徽章 + 截图 + "v1.10.1 新增内容"章节)。所有 8 个 CHANGELOG 收录此条目。

---

## [1.10.0] — 2026-05-08

> 完整文本见 [CHANGELOG.md](CHANGELOG.md#1100--2026-05-08)。摘要:CV 导入(`.docx`/`.doc`/`.odt`/`.rtf`/`.pdf`/`.html`/`.txt`/`.md`,经 pandoc + pdftotext,上限 10 MB)、Generate-PDF 后自动下载新 PDF、`#/config` 双标签页(API keys & runtime + Profile)、`#/profile` 正式成为规范路由、8 个 locale 帮助文档刷新。

---

## [1.9.1] — 2026-05-08

生产就绪通过。4 项定向修复(BF-1..BF-4),Playwright 烟雾测试从 5 个扩展到 12 个。

### 🐛 修复

- **BF-1 (tracker)**: `|` 和换行的转义现在应用于所有单元格,不仅是 notes。`"Acme | Co"` 这样的名称不会再破坏表格。`parseMarkdownTable` 支持 GFM 的 `\|` 转义 — 无损 round-trip。
- **BF-2 (config)**: `updateEnvFile` 包裹在 try/catch 中 — 权限拒绝时返回干净的 500 而不是未处理的 rejection。
- **BF-3/BF-4 (llm)**: 在 `/api/evaluate`、`/api/deep`、`/api/mode/:slug` 的 Anthropic 分支上对组装的 prompt 设 200 KB 软上限 — 返回 413 而不是超时。

### 🧪 Playwright 烟雾测试 — 5 → 12 个

Tracker(含 BF-1 round-trip)、pipeline 添加 + 无效 URL 扫除、reports 空状态、evaluate 手动回退、config 密钥掩码、CV PUT 净化、pipeline preview 400。

---

## [1.9.0] — 2026-05-08

v1.8.0 待办列表中的 P-6 → P-10 全部一次性发布。要点:`server/index.mjs` 现在是 130 行的编排器(原 762 行,累计 1230 → 130 = -89 %),每个路由主题各自一个模块。`/api/evaluate` 的 Anthropic 对等支持、多 CLI 桥接文件、扩展的 i18n 对等测试,以及 CI 中的 Playwright 浏览器烟雾测试。

### 🏗️ P-6 — server/index.mjs 拆分第二阶段

P-2 的延续。剩下的 9 个路由主题已抽到 `server/lib/routes/<topic>.mjs`。`index.mjs` 现在是纯编排器:中间件、12 个 `register<Topic>Routes(app)` 调用、SPA 兜底路由。

模块:`activity`、`config`、`health`(含 dashboard)、`help`、`jds`、`llm`、`pipeline`(含 preview)、`reports`、`tracker`。行为不变。每一步 283/283 unit tests 全绿。

### 🔌 P-7 — `/api/evaluate` 的 Anthropic 对等

`/api/evaluate` 之前是 Gemini 或 manual。v1.9.0 加入 Anthropic 分支(两把 key 同时存在时优先)。通过 `bundleProjectContext({ modeSlugs: ['_shared', 'oferta'] })` — REVIEW-A1 扩展。回退顺序:Anthropic → Gemini → manual。

新端点 **`POST /api/evaluate/test-anthropic`** — 针对 `ANTHROPIC_API_KEY` 的烟雾检测。

### 🌐 P-8 — Help 中心 i18n 对等

8 个 locale 都已覆盖同样的 14 个规范 h2 段落。测试加强:

- `tests/help-ui.test.mjs` 现在遍历全部 8 个 locale(此前只有 en + ru)。
- 新增:每个 locale 不少于 `en.md` 的 30 % — 防止 stub。

### 🤖 P-9 — CI 加入 Playwright 浏览器烟雾测试

`tests/playwright-smoke.mjs`(v1.8.0 的 opt-in)现在已是 CI 工作流的一部分。

### 🌍 P-10 — 多 CLI 兼容

新增 `web-ui/AGENTS.md`(Codex / Aider / 通用)与 `web-ui/GEMINI.md` 作为指向规范 `CLAUDE.md` 的桥接文件。

### 🧪 测试

- **284 unit tests**(原 283):新增 1 个 i18n 对等测试。
- **5 个 Playwright 烟雾测试** 现已纳入 CI。

### 📦 新端点

| 方法 | 路径 | 用途 |
|---|---|---|
| `POST` | `/api/evaluate/test-anthropic` | `ANTHROPIC_API_KEY` 烟雾检测 (P-7)。 |

---

## [1.8.0] — 2026-05-08

加固、重构与 SDD 基础。三项高严重性修复(A1、A2、A3)、四项中等(B1–B4)、六项轻微清理、父项目 career-ops v1.7.0 审计、`server/index.mjs` 拆分(P-2 第 1 阶段)、Playwright 浏览器烟雾测试,以及 `docs/` 与 `.claude/` 中的完整 SDD 基础。

### 🔥 高严重性修复

- **`fix(deep): 在 Anthropic SDK 调用中内联 cv/profile/mode 文件 (REVIEW-A1)`** — `/api/deep` 与 `/api/mode/:slug` 之前指示模型"先读取这些文件",但 Anthropic SDK 没有文件系统。输出空洞。`bundleProjectContext` 读取 `cv.md`、`config/profile.yml`、`modes/_shared.md` 与模式模板,各截取至 16 KB,在提示前插入 `<project_context>` 块。实测:`claude-sonnet-4-6` 返回 26 KB 有依据的 markdown。
- **`fix(runner): 宽限期后 SIGTERM → SIGKILL 升级 (REVIEW-A2)`** — 卡在系统调用的子进程会无限挂起 SSE 连接。两条路径都启动 5 秒 watchdog 升级到 `SIGKILL`。
- **`fix(runner): streaming 端点的最大运行时上限 (REVIEW-A3)`** — `/api/stream/{scan,liveness,pdf}` 设 30 分钟上限。

### 🛡️ 中等严重性

- **`fix(preview): /api/pipeline/preview 的逐跳验证 (REVIEW-B1)`** — 从 `redirect: 'follow'` 切换到手动重定向遍历。每个 `Location` 都通过 `isValidJobUrl` 重新验证,3 跳上限。敌意板不能再将我们重定向到 loopback / 私有 IP / `file://`。
- **`refactor(keys): hasGeminiKey 统一 LLM 密钥检查 (REVIEW-B2)`**。
- **`feat(scanners): 通过 hh.ru、Habr、Greenhouse、Ashby、Lever 传递 AbortSignal (REVIEW-B3)`** — 客户端断开时,飞行中 fetch 被中止。
- **`test(anthropic): log-guard 防止 API 密钥未来通过 console 泄漏 (REVIEW-B4)`**。

### 🧹 轻微清理

- **`fix(parsers): addPipelineUrl 内部的 URL 闸门作为纵深防御 (REVIEW-C4)`**。
- **`docs(readme): 徽章 88 → 277 tests (REVIEW-C3)`**。
- **`test(i18n): 缺失键消息按 locale 分组 (REVIEW-C6)`**。

### 🏗️ P-2 第 1 阶段 — server/index.mjs 拆分 (1230 → 762 LOC, −38 %)

行为不变。每一步 283/283 unit tests 全绿。

- `server/lib/security.mjs` — 净化器与信任检查。
- `server/lib/prompts.mjs` — LLM 提示构建器。
- `server/lib/store.mjs` — 防御性读取器 + 首次启动引导。
- `server/lib/routes/{scan,runners,content}.mjs` — `registerXxxRoutes(app)`。

第 2 阶段将提取 tracker / pipeline / reports / jds / llm / health。

### 🔍 父项目 career-ops v1.7.0 审计

UI 兼容。模式目录:7 → 19(UI 故意只暴露 7 个)。`portals.yml` 使用 `tracked_companies`(96 条目,87 启用,71 含 API)。在 `docs/architecture/DATA-FLOWS.md` 中记录。

### 🤖 SDD / GSD 基础

- `CLAUDE.md`(根)、`.aiignore`、`.claude/agents/*`(3 个)、`.claude/commands/*`(2 个)。
- `docs/` 树:PROJECT、ROADMAP、sdd/{SDD-GUIDE, CONVENTIONS}、architecture/{OVERVIEW, SERVER, FRONTEND, API, DATA-FLOWS}、reviews/REVIEW-2026-05-07。

### 🔒 安全与仓库卫生

- **`chore(.gitignore): 扩展纵深防御模式`** — env 变体、IDE、GSD scratch、代理私有配置、Playwright 产物、通用密钥模式。

### 🧪 测试

- **283 unit tests**(原为 277):新增 6 个。
- **5 个 Playwright 浏览器烟雾测试**(新增,通过 `npm run test:e2e:browser` opt-in)。
- 覆盖率 ~93 % line / ~83 % branch。

### 📝 新增 npm 脚本

| 脚本 | 用途 |
|---|---|
| `npm run test:e2e:browser` | 针对 in-process 服务器的 Playwright smoke(5 个测试)。 |

---

## [1.7.2] — 2026-05-04

帮助中心、UI 内应用设置、移动端侧边栏、单一 Scan 按钮、所有 prompt-builder 的"显示结果"快捷方式。

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

基于 QA r5 的 35 次提交的安全加固 + UX + 功能完善。三层安全落地,所有缺失的 CRUD 端点补齐,父项目 bootstrap 完全自动化,UI 新增 **9 个页面** — Activity、重新设计的 Deep Research,以及 7 个分组侧边栏模式 (project / training / followup / batch / outreach / interview-prep / patterns) 覆盖父 `modes/` 的 100%。测试覆盖率从 **73** 增加到 **209**,**24 个测试文件** + **23 步综合 Playwright e2e**。Coverage: **93.5 % 行 / 82.6 % 分支**。

### 🔒 安全

- **`fix(cv): 净化 CV Markdown 以阻止预览中的存储型 XSS` (FIX-C10)** — `PUT /api/cv` 在写入 `cv.md` 之前去除 `<script>`、`<iframe>`、`<object>`、`<embed>`、`<style>`、`<form>`、`<svg>`、`on*=` 处理器以及 `javascript:`/`vbscript:`/`data:text/html` URI。请求体限制 1 MB(超出返回 413)。客户端 `UI.md()` 重写为在任何 markdown 转换 *之前* 转义所有字节,原始 HTML 永远无法到达 `innerHTML`。链接 `href` 通过安全 scheme 白名单 (`http`/`https`/`mailto`/`tel`/相对 + 仅 `data:image`) 校验。新增 17 个测试。
- **`fix(server): CSP + 基线安全头` (FIX-L2)** — 每个响应都携带 `X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy: same-origin`。当服务器绑定到 loopback 之外 (`HOST` ≠ `127.0.0.1`/`::1`/`localhost`) 时,在其上叠加严格的 `Content-Security-Policy`: `default-src 'self'`、`script-src 'self'` (无 `unsafe-inline`)、Google Fonts 加入白名单、`connect-src 'self'` 阻断 XSS 数据外渗。`index.html` 和 `router.js` 的内联 `onclick` 处理器迁移到 `addEventListener`。新增 8 个测试。
- **`fix(api): 加强 pipeline URL 验证器` (FIX-M7)** — `POST /api/pipeline` 曾接受 `"not-a-url"` 并持久化它。现在 `isValidJobUrl()` 拒绝裸字符串、长度 <10 或 >2000、含空白的 URL、非 `http(s)` scheme、loopback 主机名。包含 **FIX-M3** + **FIX-M6**。
- **`fix(api): 在组装 prompt 之前净化 JD` (FIX-M5)** — `POST /api/evaluate` 去除 ANSI 转义、控制字节、内联 `<script>` 标签,trim 空白。50 KB 长度上限。50 字符的最低值在 *净化后的* 文本上检查。
- **`fix(health): HOST!=loopback 时遮蔽 Node 版本 + 项目根` (FIX-M1)** — `/api/health` 不再在 LAN 暴露的部署中泄露主机指纹。

### ✨ 新功能

- **`feat: 7 个新侧边栏模式 + 分组侧边栏` (FIX-C8)** — 100% 覆盖父 `modes/`。新路由: `#/project`、`#/training`、`#/followup`、`#/batch`、`#/contacto`、`#/interview-prep`、`#/patterns`。单一 view 工厂 + 通用端点 `POST /api/mode/:slug`。侧边栏分 6 组。共 18 项。12 个新测试。
- **`fix: 父依赖 + russian_portals 默认值 bootstrap` (FIX-C4 + C9 + C12 + H2)** — `bin/start.sh` 在新克隆上自动安装父 `node_modules` + Playwright Chromium。`createApp()` 在 `russian_portals:` 块缺失时追加。幂等。3 个新测试。
- **`fix: 禁用 9 个死链接 portal slugs` (FIX-C3)** — 9 个 slugs 标记为 `enabled: false`。新 `scripts/portals-health-check.mjs`。3 个新测试。
- **`feat(activity): 用户操作日志 + Activity 侧边栏页面`** — 每个状态变更的 API 请求都被记录到 `data/activity.jsonl`。新侧边栏项 **活动** — 操作前缀 chip 过滤器、✓/✗ 徽章、刷新按钮。5 MB 自动轮转。新增 10 个测试。
- **`feat(deep): 在浏览器中查看 Deep Research + 已保存结果存档`** — Deep Research 页面现在 (a) 当 `{ run: true }` 且设置了 `GEMINI_API_KEY` 时通过 Gemini 实时执行,持久化到 `interview-prep/{slug}.md`;(b) 以带相对时间戳的卡片列出所有已保存的 deep-research 文件;(c) 将结果渲染为 Markdown,每个结果提供 **📋 复制 / ⬇ 下载 .md / ↗ 在新标签打开** 操作。新 REST: `GET /api/interview-prep`、`GET /api/interview-prep/:name`、`DELETE /api/interview-prep/:name`。新增 7 个测试。
- **`feat(cv): 在浏览器中生成 + 下载 PDF + PDF 存档`** — CV 页面新 **📄 生成 PDF** 按钮在模态控制台中流式传输 `/api/stream/pdf`。`ERR_MODULE_NOT_FOUND` / `playwright` 错误时显示可复制粘贴的引导命令。"已生成的 PDF" 部分在每次成功后自动加载,列出所有 `output/*.pdf` 及 **↗ 打开** + **⬇ 下载** 按钮。新 REST: `GET /api/output/pdfs`、`GET /api/output/pdfs/:name`。新增 6 个测试。
- **`feat(api): POST /api/tracker — 从 UI 添加行` (FIX-H8)** — 从浏览器在 `data/applications.md` 中追加规范行。校验 company + role,根据 `templates/states.yml` 规范化状态,自动递增零填充 `#`,按 company+role 不区分大小写去重。新增 6 个测试。
- **`feat(api): DELETE /api/jds/:name` (FIX-H4)** — 无需 shell 即可删除已保存的 JD。path-traversal 净化、必须 `.txt` 后缀。新增 5 个测试。
- **`feat(api): POST /api/evaluate/test-gemini` (FIX-H7)** — 通过 `gemini-eval.mjs` 推送 50 字符的虚拟 JD,以便用户验证 API key 是否生效的 smoke-test 端点。

### 🐛 Bug 修复

- **`fix(router): catch-all 404 视图 + i18n 覆盖率守护` (FIX-C7)** — 未知 hash 路由不再静默回落到 dashboard。显示专门的 404 页面。新 `tests/i18n-coverage.test.mjs` 验证所有 173+ 键 × 8 locales。
- **`fix(router): #/profile → settings 别名` (FIX-C2)** — 两个地址都到达同一视图,侧边栏正确高亮。
- **`fix(health): 统一 Health/Doctor + 标记模板配置` (FIX-C6 + FIX-H6)** — `/api/health` 现在公开 Doctor 报告的全部内容 (parent deps、Playwright、目录、profile-customized、`HH_USER_AGENT`)。
- **`fix(scan): RU 配置的 query↔negative 冲突警告` (FIX-H3)** — 当 `portals.yml` 的 negative 含 `"PHP"` 而查询面向 Senior PHP 时会过滤所有结果。`runRuScan()` 在开始前 emit 警告。
- **`fix(scan): HH_USER_AGENT 未设置时警告` (FIX-H1)** — `/scan` 显示黄色卡片。
- **`fix(api): POST /api/jds slug 净化时警告` (FIX-M2)** — 响应中返回 `warning` 字段。
- **`fix(ui): 路由切换时清空全局搜索 + 按钮加载圈` (FIX-M4 + FIX-L1)** — 新辅助函数 `UI.withSpinner(button, fn)`。
- **`fix(ui): 空 modal-title 占位符` (FIX-H9)** — 移除硬编码英文 `"Title"`。

### 🌐 i18n

- 173+ 翻译键 × 8 locales (`en`、`es`、`pt-BR`、`ko`、`ja`、`ru`、`zh-CN`、`zh-TW`)。所有 locales 添加新键。覆盖率由 `tests/i18n-coverage.test.mjs` 强制。

### ⚙️ DevOps

- **测试数:** 73 → **225**(+152 个测试,25 个文件)。Coverage: 93.5% 行 / 82.6% 分支。
- **综合 Playwright e2e**(`tests/e2e-comprehensive.mjs`,23 步)。
- **GitHub Actions:** `ci.yml`、`ai-review.yml`(Claude Code 审查每个 PR)、`release.yml`。
- **CSP 友好 UI:** 移除所有内联 `onclick`。

### 📦 新 REST 端点

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET`    | `/api/activity`              | 用户活动事件列表 |
| `GET`    | `/api/interview-prep`        | 已保存 Deep Research 列表 |
| `GET`    | `/api/interview-prep/:name`  | 读取单个 Deep Research |
| `DELETE` | `/api/interview-prep/:name`  | 删除 Deep Research |
| `GET`    | `/api/output/pdfs`           | 已生成 PDF 列表 |
| `GET`    | `/api/output/pdfs/:name`     | 下载 PDF (attachment) |
| `POST`   | `/api/tracker`               | 向 `applications.md` 添加行 |
| `DELETE` | `/api/jds/:name`             | 删除已保存 JD |
| `POST`   | `/api/evaluate/test-gemini`  | Gemini API key smoke-test |

---

## [1.6.0] — 2026-05-02

Web UI 首次公开发布。功能清单见 `README.md`。
