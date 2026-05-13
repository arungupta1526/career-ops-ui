# 变更日志

**career-ops-ui** 的所有重要变更。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/),版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。

翻译: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [繁體中文](CHANGELOG.zh-TW.md)

> **i18n 注释** — 从 v1.12.0 起,各条目按语言本地化。之前的条目(v1.11.x、v1.10.x)按项目惯例保留俄文;规范英文正文在 [CHANGELOG.md](CHANGELOG.md)。

---

## [1.17.0] — 2026-05-13

**Polish + a11y + CI fix release.** Closes 9 follow-ups from v1.16.0 REVIEW: browser smoke verify, README badge truth, coverage refresh, `lastWorkdayFallback` 🔒 chip в SPA, full E2E re-baseline после v1.16 UX-change, Playwright auto-pipeline scenarios, a11y ARIA + focus trap pass, condensed historical CHANGELOG в 6 локалях, expanded non-EN READMEs с reference sections.

### 🐛 Fixes

- **`fix(e2e): smoke + comprehensive re-aligned с v1.16 UX`** — v1.16 Cmd+K Enter → AutoPipeline modal изменение сделало `search.press('Enter')` в e2e тестах открывающим modal. Тесты теперь используют `Shift+Enter` для legacy quick-add path. **Это и был CI failure на push v1.16.0** — Playwright e2e таймаутил 30s на backdrop-intercepted кликах.
- **`fix(mode-page): /#/batch-prompt → modes/batch.md via serverSlug`** — v1.15 переименовал legacy mode slug в `batch-prompt`, но server `POST /api/mode/:slug` искал `modes/batch-prompt.md`. Новое поле `serverSlug` развязывает route hash от parent mode filename.
- **`chore: bump deprecation messages с v1.16.0 → v1.17.0`** — scan-en/scan-ru deprecation copy + batch-prompt banner ссылались на прошедшую версию.

### ✨ Features

- **`feat(scan): 🔒 Workday CAPTCHA chip в Active Companies card`** — server-side `lastWorkdayFallback` export из v1.16 PR-7 теперь consumed в SPA. `/api/scan-results` возвращает snapshot; `#/scan` рендерит warn-tinted card сверху при Workday fallback.

### ♿ Accessibility

- **`a11y: ARIA roles + focus management pass`** —
  - `index.html`: `role` attrs на `<aside>` (navigation), `<header>` (banner), `<section id="content">` (main), `<div id="modal">` (dialog + aria-modal + aria-labelledby), toast/banner (status + aria-live), searchbar (search).
  - `#sidebar-toggle`: `aria-controls` + `aria-expanded` sync.
  - `#global-search`: visually-hidden `<label>` + `aria-label` с Cmd+K hint.
  - Decorative backdrops: `aria-hidden="true"`.
  - **Focus trap в modal** через `UI.modal()` — запоминает click owner, фокусит первый non-close focusable на open, циклит Tab/Shift+Tab внутри modal. `UI.closeModal()` восстанавливает focus.
  - Новый `.visually-hidden` utility class (WAI-ARIA AP стандарт).

### 📚 Документация

- **`docs(readme): badge truth × 8 READMEs`** — tests `284/379/360` → **427**; release `v1.9.1/v1.13.0` → **v1.16.0** → v1.17.0.
- **`docs(readme): расширены 7 non-EN READMEs с reference sections`** — каждый вырос 170 → ~240 строк с Architecture / API / Security / Tests / A11y / Limitations / License разделами на native language.
- **`docs(changelog): condensed pre-v1.12 в 6 локалях`** — длинные RU-bodied v1.11.x + v1.10.x записи заменены на компактный "Earlier releases" exec summary на native language.

### 🛠️ Tooling

- **`coverage: refresh numbers`** — последний публичный был 95.46 % / 84.06 % (v1.13.0 REVIEW). v1.17 baseline: **94.14 % линий / 82.98 % веток / 93.20 % функций**. Slight drop от новых error paths в auto-pipeline + reports-write; всё ещё выше 80 % floor.

### 🧪 Тесты

- Итого: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + **32 / 32** Playwright (было 28; +4 новых auto-pipeline scenarios).

### Out of scope (v1.18+)

| Item | Notes |
|---|---|
| Translate v1.16.0 в non-EN CHANGELOGs | Сейчас RU-bodied (~30 строк × 6 = 180). Был вне явного scope (только v1.11.x/v1.10.x). |
| Full non-EN README parity (585 строк как EN) | v1.17 принёс non-EN до ~240; marketing-heavy секции остаются EN-only. |
| Parent commit для canonical A-F prompt | Всё ещё ждёт upstream rewrite `santifer/career-ops::modes/oferta.md`. |
| Full WCAG 2.2 AA audit | v1.17 покрыл structural ARIA + focus trap; per-component contrast/Tab-order — отложено. |

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

大型发布。在一次提交中关闭 4 个延期项: PR-4(完整 multer 管道)、Adapter registry(F-018 架构后续)、Batch evaluate SPA 页面、locale-aware mode-template scaffolding。还有 mid-session 的深色主题表格修复。

### ✨ 功能

- **`feat(cv): multer multipart upload (PR-4 完整)`** — `/api/cv/import` 现在同时接受 octet-stream(原始契约)和 `multipart/form-data`(经 multer)。v1.10.2 的 415-reject 是临时方案;v1.13.0 是真正修复。curl `-F`、Postman 默认、任何 HTTP 客户端都顺畅工作。新依赖:`multer ^2.1.1`。
- **`feat(portals): adapter registry`** — Greenhouse / Ashby / Lever fetcher 抽取到 `server/lib/portals/adapters/*.mjs`,采用统一契约。`server/lib/portals/registry.mjs::resolveAdapter()` 是唯一的 dispatch 点。新增 ATS = `adapters/` 一个文件 + `ALL_ADAPTERS` 一行。
- **`feat(batch): #/batch evaluate page`** — 新 SPA 视图 + 4 个端点(`GET /api/batch`、`PUT /api/batch`、`GET /api/stream/batch`、`POST /api/batch/merge`)。`batch/batch-input.tsv` 的 TSV 编辑器,parallel/min-score/dry-run/retry 控件,`bash batch/batch-runner.sh` 的实时 SSE 日志,`Merge to tracker` 按钮(执行 `node merge-tracker.mjs`)。Sidebar 链接。21 个新 i18n 键 × 8 语言。
- **`feat(prompts): locale-aware mode scaffolding`** — `buildModePrompt` + `buildEvaluationPrompt` 现在用本地化的 scaffolding 文本(role-line、"Read these files first"、"User-supplied context")在 8 个语言中包裹 parent 的 mode-template 英文主体。

### 🎨 UX 修复

- **`fix(theme): 深色模式表格 + tab-btn`** — 硬编码的 `#fafafa` / `#fff` / `#f7f7f7` 替换为 token。深色下的 hover 现在可读。新增 `.row-boosted` accent strip。

### 🧪 测试

- 新增 `tests/adapter-registry.test.mjs` (7)、`tests/batch-endpoints.test.mjs` (5)、`tests/locale-scaffold.test.mjs` (6)。
- `tests/cv-upload-multipart-reject.test.mjs` 按 v1.13.0 契约(multipart parsed properly)重写。
- 总计 **379 / 379** 单元(此前 360;+19)。0 失败。覆盖率 **95.46 % 行 / 84.06 % 分支**。
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright。

### 范围外

- **14 个新 portal adapter** — registry 已就绪;添加 = 每个一个文件;portal-by-portal 调研仍待办。
- **翻译 parent 的 `modes/<slug>.md` 主体** — 需要向 `santifer/career-ops` 提交 upstream PR(CLAUDE.md hard rule #1)。

### 文档

- `docs/reviews/REVIEW-2026-05-13-v1.13.0.md`。
- 完整文本: [CHANGELOG.md](CHANGELOG.md#1130--2026-05-13)。

---

## [1.12.0] — 2026-05-13

错误修复 + UX + 品牌 pass。在 v1.11.1 后关闭 8 个 backlog 项(测试空缺 #9–12、console error #8、portals-dead drift #4、seniority_boost surface #6、F-018 端点合并)。新增主题 day/night 切换,所有文档/包元数据/GitHub 仓库描述中删除 "Airbnb-styled" 提及。

### ✨ 功能

- **`feat(theme): day/night 切换`** — top-bar 新增主题按钮。light ↔ dark 循环,持久化到 `localStorage`,首次绘制前通过 `public/js/lib/theme-bootstrap.js` 还原。首次加载尊重 `prefers-color-scheme`。`public/css/app.css` 中 `[data-theme="dark"]` 下完整深色调色板。
- **`feat(scan): /api/stream/scan?source=ats|regional|both` (F-018 LITE)`** — 单一合并的 SSE 端点。SPA 打开一个 event-stream,顺序执行两阶段(ATS,然后 regional)。旧版 `/api/stream/scan-en` + `/api/stream/scan-ru` 作为 deprecated alias 保留。
- **`feat(scan): seniority_boost surface`** — 两个扫描器都读取 `portals.yml::title_filter.seniority_boost`,在匹配 job 上标记 `_boosted: true`。SPA 将 boosted 行排到顶部并渲染 `⬆ boosted` badge。

### 🐛 修复

- **`fix(ui): 4 处 .message null-safe (#8)`** — `app.js`、`views/tracker.js`、`views/apply.js`、`views/evaluate.js`。此前没有 Error payload 的 Promise rejection 在 e2e teardown 中抛出 "Cannot read properties of undefined"。
- **`fix(test): portals-dead drift 改为 warning 而非 failure (#4)`** — assertion 转为 stderr warning。CI 在 parent drift 上保持绿色;release 决策仍由人工把关。

### 📝 Brand / docs

- **`docs(brand): 所有 doc + package + GitHub 仓库描述中删除 'Airbnb' 引用`** — 8 个 README、CLAUDE.md、FRONTEND.md、package.json 及仓库描述从 "Airbnb-styled" 迁移到 "Clean, docs-style"。

### 🧪 测试

- 新增 `tests/canonical-docs-coverage.test.mjs` (5 案例) 关闭 test gap #9–12。
- 新增 `tests/scan-consolidated.test.mjs` (6 案例) 覆盖 F-018 LITE。
- 总计 **360 / 360** 单元(此前 349;+11 新增)。0 失败。覆盖率:**95.62 % 行 / 84.37 % 分支**。
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright。

### 文档

- `docs/reviews/REVIEW-2026-05-13-v1.12.0.md`。
- 完整文本: [CHANGELOG.md](CHANGELOG.md#1120--2026-05-13)。

### 范围外 (自 v1.11.1 起无变化)

Batch evaluate SPA 页面;完整 adapter registry(F-018 架构 refactor);完整 multer 管道(PR-4);mode template 翻译。

---

## 之前的发布 (v1.11.x 和 v1.10.x)

v1.11.0 / v1.11.1 / v1.10.0–v1.10.3 的详细条目在 [英文 CHANGELOG](CHANGELOG.md) 中。摘要:

- **v1.11.1 — 2026-05-13** · 抛光: `#/apply` 的 Playwright 提示、统一的 taglines、仪表板 score-thresholds 卡片。349/349 测试。
- **v1.11.0 — 2026-05-13** · 在 8 个 help bundle 和 8 个 README 中集成 career-ops.org/docs。新 `docs/career-ops-canonical.md`。Mode/Archetype/Pipeline/Tracker/Report/Scan history 概念已文档化。348/349 测试。
- **v1.10.3 — 2026-05-12** · 错误修复切片:关闭 v1.10.2 回归运行的 11 个 QA 发现中的 7 个。
- **v1.10.2 — 2026-05-12** · CV multipart 415-拒绝 (v1.13.0 multer 之前的临时补丁);PDF 生成修复。
- **v1.10.1 — 2026-05-09** · 来自 v1.10.0 发布 QA 回归运行的关键补丁。
- **v1.10.0 — 2026-05-08** · `#/profile` 编辑器 + CV 上传 UX (pandoc/pdftotext/passthrough),8 个 locale × 16 H2 help 对等,locale switcher。
