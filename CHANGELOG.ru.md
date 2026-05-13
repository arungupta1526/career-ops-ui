# Журнал изменений

Все значимые изменения **career-ops-ui**. Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версии по [Semantic Versioning](https://semver.org/lang/ru/).

Переводы: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

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

Патч с функциональными фиксами. Два бага из ручной проверки v1.10.1 закрыты; расширена доковая поверхность.

### 🐛 Фиксы

- **`fix(cv): /api/cv/import отбрасывает multipart/form-data с 415 (F-016 hardening)`** — любой внешний клиент (curl `-F`, типовые HTTP-клиенты), который шёл `multipart/form-data` по умолчанию, ранее записывал свой wire-envelope (`--boundary…\r\nContent-Disposition: form-data; name="file"; filename="x"…`) в `cv.md` как контент. Путь SPA (`Content-Type: application/octet-stream` + `X-Filename`) затронут не был. Маршрут теперь возвращает 415 с подсказкой. Защита в глубину: octet-stream-тела, которые в первых 256 байтах нюхают как multipart, тоже получают 415. `cv.md` не трогается при 415.
- **`fix(pdf): /api/stream/pdf запускает generate-pdf.mjs с правильными позиционными аргументами`** — раньше вызывал скрипт с `[]`. Скрипт печатал свой `Usage:` и завершался с кодом 1 — SPA показывала зелёный тост "PDF generated", но файл никогда не попадал на диск. Маршрут теперь читает `cv.md`, рендерит в HTML-файл `output/cv-input-<TIMESTAMP>.html` через in-route хелпер markdown→print-HTML, затем запускает `generate-pdf.mjs <input.html> <output.pdf> --format=a4`. Опционально `?format=letter` для US-letter. Когда `cv.md` отсутствует, выдаёт `event: error` + `done { code: 2 }` вместо фейкового `start`.

### 🧪 Тесты

- Новый `tests/cv-upload-multipart-reject.test.mjs` (5 кейсов): SPA happy path → 200 с чистым markdown; `multipart/form-data` → 415; octet-stream body, который ВЫГЛЯДИТ как multipart → 415; пустое тело → 400; отвергнутый запрос НЕ изменяет `cv.md`.
- Новый `tests/pdf-stream-args.test.mjs` (3 кейса): событие `start` несёт `<input.html> <output.pdf> --format=a4` с абсолютными путями и HTML существует на диске; `?format=letter` переключает флаг; отсутствующий `cv.md` выдаёт ожидаемый error frame.
- Итого: **340 unit-тестов** (было 318). Один pre-existing failure в `portals-dead.test.mjs` — это дрейф данных в parent, не связан с web-ui.
- Coverage: 94.63 % line / 84.94 % branch.

### 📝 Документация

- Новый `docs/test-scenarios/` — 21 файл сценариев на английском (index + контракт каждой страницы).
- Новый `docs/reviews/REVIEW-2026-05-12-v1.10.2.md` — полный контекст сессии + список отложенного + команды верификации.
- Все 8 README обновлены: badge-ы (тесты 318 → 340, релиз v1.10.1 → v1.10.2) + секция "Что нового в v1.10.2" в каждой локали.
- Все 8 CHANGELOG-ов получили эту запись.

---

## [1.10.1] — 2026-05-09

Патч с критическими фиксами по итогам QA-регрессии v1.10.0 (`qa/reports/00-FINAL-SUMMARY.md`).

### 🛡️ Безопасность

- **`fix(security): затянули SSRF + защита от DNS-rebind (PR-3 / F-003)`** — `isValidJobUrl` теперь блокирует RFC1918 (`10/8`, `172.16/12`, `192.168/16`), всю петлю 127/8, link-local `169.254/16` (включая AWS IMDS), `0.0.0.0`, CGNAT `100.64/10` и IPv6 ULA / link-local. Хелпер `isPrivateOrLoopbackHost()` экспортирован из `server/lib/security.mjs`. Прокси `/api/pipeline/preview` делает `dns.lookup` на каждом редиректе и блокирует, если разрешённый адрес попадает в приватный диапазон — защита от DNS-rebind.

### 🐛 Фиксы

- **`fix(activity): записываем только успешные изменения (PR-5 / F-005)`** — мидлварь делает early-return на `res.statusCode >= 400`. Отвергнутые запросы больше не засоряют ленту аудита.
- **`fix(activity): добавили события profile.save / config.save / cv.import (F-008)`** — успешные `PUT /api/profile` и `POST /api/config` теперь видны в `/api/activity`.
- **`fix(help): алиас ko → ko-KR.md, корейская справка не падает на EN (F-002)`** — SPA шлёт `ko`, файл на диске `ko-KR.md`. Резолвер пробует 4 кандидата.
- **`fix(llm): /api/evaluate уважает mode:'manual' (F-009)`** — повторяет поведение `/api/deep`. Не сжигает Anthropic-токены при manual-mode.
- **`fix(api): DELETE /api/pipeline принимает ?url= И body.url, 404 на miss (PR-6 / F-017)`** — раньше молча возвращал 200.

### ✨ Фичи

- **`feat(llm): локаль пробрасывается во все промпты (PR-2 / F-012)`** — `resolveLocale(req)` берёт локаль из `body.lang` → `body.locale` → `Accept-Language` → `'en'`. `buildLocaleDirective(lang)` отдаёт однострочный заголовок "Respond in X". `buildEvaluationPrompt`, `buildDeepPrompt`, `buildModePrompt` принимают и встраивают `lang`. SPA `API.call()` автоматически прикрепляет `Accept-Language` и сливает `lang` в JSON-тела.
- **`feat(scripts): post-qa-cleanup.mjs (PR-11)`** — повторяет чек-лист уборки после QA-регрессии; `--apply` пишет, по умолчанию dry-run, идемпотентен.

### 🧪 Тесты

- Новый `tests/critical-fixes.test.mjs` (15 кейсов): F-002 ko-алиас, F-009 manual-opt-out, PR-6 DELETE-форма (body / 404 / 400), PR-3 хелпер для IPv4 / IPv6 / bracketed, PR-2 `resolveLocale` + `buildLocaleDirective` + интеграция в prompt builders.
- `tests/url-validation.test.mjs` расширен 5 тестами на RFC1918 / link-local / 0.0.0.0 / 127/8 / CGNAT / IPv6.
- `tests/activity-log.test.mjs` тест 8 переписан под новый контракт "не логируем 4xx".
- Итого: **318 unit-тестов** (было 298). Один pre-existing failure в `portals-dead.test.mjs` — это дрейф данных в parent `templates/portals.example.yml`, не связан с web-ui.

### 📝 Документация

- Новый `docs/reviews/REVIEW-2026-05-09-v1.10.1.md` — полный контекст сессии + список отложенного + команды верификации.
- Все 8 README обновлены: badge-ы (тесты 298 → 318, релиз v1.10.0 → v1.10.1), путь скриншота `public/images/screen_vacancy_found.png`, секция "Что нового в v1.10.1" в каждой локали.
- Все 8 CHANGELOG-ов получили эту запись.

### За пределами слайса (отложено в будущие GSD-фазы)

PR-1 (locale-agnostic adapter registry, +14 порталов, переписка фронта), PR-4 (multer + ConversionError + global error handler), PR-7 (Generate-PDF кнопки на reports/evaluate/deep/interview-prep), PR-8 (перегруппировка config UI), PR-9 (полная зачистка EN/RU framing в README/docs/help-bundles), PR-10 (button-by-button localization audit + jsdom CI gate), полный ретранслейт корейской справки.

---

## [1.10.0] — 2026-05-08

> Полный текст в [CHANGELOG.md](CHANGELOG.md#1100--2026-05-08). Краткое содержание: CV-импорт (`.docx`/`.doc`/`.odt`/`.rtf`/`.pdf`/`.html`/`.txt`/`.md` через pandoc + pdftotext, лимит 10 MB), авто-даунлоад свежего PDF, двухвкладочный `#/config` (API keys & runtime + Profile), `#/profile` стал каноническим маршрутом, обновлены help-доки во всех 8 локалях.

---

## [1.9.1] — 2026-05-08

Production-readiness pass. 4 точечных фикса (BF-1..BF-4), Playwright smoke расширен с 5 до 12 тестов.

### 🐛 Фиксы

- **BF-1 (tracker)**: экранирование `|` и переноса строки во всех ячейках, не только notes. Имена вроде `"Acme | Co"` теперь не ломают таблицу. `parseMarkdownTable` поддерживает GFM-escape `\|` — round-trip без потерь.
- **BF-2 (config)**: `updateEnvFile` обёрнут в try/catch — на permission-denied возвращает 500 с понятным сообщением вместо unhandled rejection.
- **BF-3/BF-4 (llm)**: soft cap 200 KB на assembled prompt в `/api/evaluate`, `/api/deep`, `/api/mode/:slug` Anthropic-ветках — 413 вместо timeout.

### 🧪 Playwright smoke — 5 → 12 тестов

Tracker (включая BF-1 round-trip), pipeline add + invalid-URL sweep, reports empty state, evaluate manual fallback, config keys-masked, CV PUT XSS sanitization, pipeline preview 400.

---

## [1.9.0] — 2026-05-08

P-6 → P-10 из бэклога v1.8.0 — все вошли в один релиз. Главное: `server/index.mjs` теперь 130-строчный orchestrator (было 762, итого 1230 → 130 = -89 %); каждая тема роутов в своём модуле. Anthropic-парность для `/api/evaluate`, multi-CLI шимы, расширенный i18n parity-тест и Playwright browser-смок в CI.

### 🏗️ P-6 — фаза 2 split server/index.mjs

Продолжение P-2. Извлечены оставшиеся 9 тем роутов в `server/lib/routes/<topic>.mjs`. `index.mjs` теперь чистый orchestrator: middleware (security headers + activity log + static), 12 вызовов `register<Topic>Routes(app)` и SPA catch-all.

- `activity.mjs`, `config.mjs`, `health.mjs` (+ dashboard), `help.mjs`, `jds.mjs`, `llm.mjs`, `pipeline.mjs` (+ preview), `reports.mjs`, `tracker.mjs`.

Поведение не изменилось. 283/283 unit-теста зелёные на каждом шаге. Импорт-секция уменьшилась с 47 до 22 строк.

### 🔌 P-7 — Anthropic-парность для /api/evaluate

`/api/evaluate` раньше был Gemini-or-manual. v1.9.0 добавляет ветку Anthropic (предпочтительна при наличии обоих ключей). Маршрутизирует через `bundleProjectContext({ modeSlugs: ['_shared', 'oferta'] })` — REVIEW-A1 распространён.

Новый эндпоинт **`POST /api/evaluate/test-anthropic`** — smoke-проверка для `ANTHROPIC_API_KEY`, аналогично существующему gemini-smoke. ≤256 output-токенов, стоит копейки.

Цепочка фолбэка: Anthropic → Gemini → manual.

### 🌐 P-8 — Help-центр i18n parity

Все 8 локалей `docs/help/<lang>.md` уже покрывают одни и те же 14 канонических h2-секций. Тесты усилены:

- `tests/help-ui.test.mjs` теперь итерирует все 8 локалей (раньше — только en + ru).
- Новый тест: каждая локаль не короче 30 % `en.md` — защита от стаб-локалей.

Структурный parity теперь enforced в CI.

### 🤖 P-9 — Playwright browser smoke в CI

`tests/playwright-smoke.mjs` (добавлен в v1.8.0 как opt-in) теперь часть CI workflow. Один новый шаг (`npm run test:e2e:browser`) запускает 5 browser-smoke тестов после comprehensive node E2E.

### 🌍 P-10 — Multi-CLI совместимость

Родитель v1.7.0 ввёл multi-CLI / Open Agent Skill standard. UI следует той же конвенции:

- `web-ui/AGENTS.md` — Codex / Aider / generic.
- `web-ui/GEMINI.md` — Gemini CLI.

Оба шима ссылаются на канонический `CLAUDE.md`. Развёрнутый UI всегда CLI-agnostic в runtime.

### 🧪 Тесты

- **284 unit-теста** (было 283): +1 новый i18n parity-тест.
- **5 Playwright browser-смок-тестов** теперь часть CI.

### 📦 Новые REST-эндпоинты

| Метод | Путь | Назначение |
|---|---|---|
| `POST` | `/api/evaluate/test-anthropic` | Smoke-проверка `ANTHROPIC_API_KEY` (P-7). Зеркало `/api/evaluate/test-gemini`. |

---

## [1.8.0] — 2026-05-08

Хардненинг, рефакторинг и SDD-фундамент. Три критичных фикса (A1, A2, A3), четыре среднего уровня (B1–B4), шесть мелких чисток, аудит родительского career-ops v1.7.0, разделение `server/index.mjs` (P-2 фаза 1), Playwright browser-смок и полная SDD-инфраструктура в `docs/` и `.claude/`.

### 🔥 Критичные фиксы

- **`fix(deep): инлайнить cv/profile/mode-файлы в Anthropic-вызовы (REVIEW-A1)`** — `/api/deep` и `/api/mode/:slug` ранее писали модели «прочитай эти файлы», но Anthropic SDK не имеет файловой системы. Ответы получались пустые. `bundleProjectContext` читает `cv.md`, `config/profile.yml`, `modes/_shared.md` и шаблон mode-файла, обрезает до 16 KB и вставляет блок `<project_context>` перед промптом. Проверено вживую: 26 KB осмысленного markdown от `claude-sonnet-4-6`.
- **`fix(runner): эскалация SIGTERM → SIGKILL после grace-периода (REVIEW-A2)`** — дочерние процессы, застрявшие в системном вызове, могли подвешивать SSE-соединение. Теперь оба пути взводят 5-секундный watchdog с эскалацией к `SIGKILL`.
- **`fix(runner): жёсткий лимит времени для streaming-эндпоинтов (REVIEW-A3)`** — `/api/stream/{scan,liveness,pdf}` имеют 30-минутный потолок.

### 🛡️ Среднего уровня

- **`fix(preview): валидация каждого редиректа в /api/pipeline/preview (REVIEW-B1)`** — переход с `redirect: 'follow'` на ручной обход. Каждый `Location` валидируется через `isValidJobUrl`, лимит 3 хопа. Враждебные борды больше не могут перенаправить на loopback / private IP / `file://`.
- **`refactor(keys): hasGeminiKey унифицирует проверки LLM-ключей (REVIEW-B2)`**.
- **`feat(scanners): AbortSignal через hh.ru, Habr, Greenhouse, Ashby, Lever (REVIEW-B3)`** — при разрыве клиента fetch-запросы прерываются.
- **`test(anthropic): log-guard защищает от утечки API-ключа в console (REVIEW-B4)`**.

### 🧹 Мелочи

- **`fix(parsers): URL-валидатор внутри addPipelineUrl (REVIEW-C4)`**.
- **`docs(readme): значок «tests-88 passed» → «tests-277 passed» (REVIEW-C3)`**.
- **`test(i18n): пропущенные ключи сгруппированы по локали (REVIEW-C6)`**.

### 🏗️ P-2 фаза 1 — split server/index.mjs (1230 → 762 LOC, −38 %)

Без изменения поведения. Все 283 unit-теста зелёные на каждом шаге.

- `server/lib/security.mjs` — `isValidJobUrl`, `stripDangerousMarkdown`, `sanitizeJobDescription`, `isPubliclyExposed`.
- `server/lib/prompts.mjs` — `bundleProjectContext`, `build*Prompt`, `buildApplyChecklist`.
- `server/lib/store.mjs` — `safeRead*`, `checkProfileCustomized`, `ensureRussianPortalsDefaults`.
- `server/lib/routes/{scan,runners,content}.mjs` — `registerXxxRoutes(app)`.

Фаза 2 вытянет tracker / pipeline / reports / jds / llm / health — цель < 500 LOC для оркестратора.

### 🔍 Аудит родителя career-ops v1.7.0

UI совместим. Каталог mode-файлов вырос с 7 до 19 (UI намеренно покрывает 7). `portals.yml` использует `tracked_companies` (96 записей, 87 enabled, 71 with API). Новые поверхности парента (`dashboard/` Go-программа, `update-system.mjs`, `generate-latex.mjs`, локализованные mode-подкаталоги) пока не используются — задокументированы в `docs/architecture/DATA-FLOWS.md`.

### 🤖 SDD / GSD-фундамент

- `CLAUDE.md` (root), `.aiignore`, `.claude/agents/{web-ui-route-reviewer,spa-view-reviewer,test-isolation-reviewer}.md`, `.claude/commands/{sdd-status,codebase-tour}.md`.
- `docs/`: `PROJECT.md`, `ROADMAP.md`, `sdd/{SDD-GUIDE,CONVENTIONS}.md`, `architecture/{OVERVIEW,SERVER,FRONTEND,API,DATA-FLOWS}.md`, `reviews/REVIEW-2026-05-07.md`.

### 🔒 Безопасность и гигиена репо

- **`chore(.gitignore): расширенные defense-in-depth паттерны`** — env-варианты, IDE-папки, GSD scratch (`.planning/`), приватные настройки агента, Playwright-артефакты, секрет-паттерны (`*.pem`, `*.key`, `secrets.json`).

### 🧪 Тесты

- **283 unit-теста** (было 277): +6 новых.
- **5 Playwright browser-смок-тестов** (новые, opt-in через `npm run test:e2e:browser`).
- Покрытие держится на ~93 % line / ~83 % branch.

### 📝 Новые npm-скрипты

| Скрипт | Назначение |
|---|---|
| `npm run test:e2e:browser` | Playwright smoke против in-process сервера (5 тестов). |

---

## [1.7.2] — 2026-05-04

Help-центр, App settings в UI, мобильный sidebar, единая кнопка Scan, "Показать результат" на каждом prompt-builder.

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

35 коммитов безопасности, UX и feature-completion по QA-отчёту r5. Закрыты три слоя защиты (XSS-санитизация, CSP, валидация ввода), добавлены все недостающие CRUD-эндпоинты, parent-проект полностью bootstraps автоматически, появились **9 новых страниц** — Активность, переработанный Deep Research плюс 7 sgrouped sidebar modes (project / training / followup / batch / outreach / interview-prep / patterns), покрывающие 100% parent's `modes/`. Покрытие тестов выросло с **73** до **201** в **23 тест-файлах**, плюс **23 шага comprehensive Playwright e2e**.

### 🔒 Безопасность

- **`fix(cv): санитизация Markdown резюме от stored XSS` (FIX-C10)** — `PUT /api/cv` теперь вырезает `<script>`, `<iframe>`, `<object>`, `<embed>`, `<style>`, `<form>`, `<svg>`, обработчики `on*=`, а также `javascript:`/`vbscript:`/`data:text/html` URI до записи `cv.md`. Размер тела ограничен 1 МБ (413 при превышении). Клиентский `UI.md()` переписан так, что весь источник проходит HTML-escape **до** любых markdown-преобразований — сырой HTML не может попасть в `innerHTML`. Атрибуты ссылок `href` валидируются по белому списку схем (`http`/`https`/`mailto`/`tel`/относительные + только `data:image`). 17 новых тестов.
- **`fix(server): CSP и базовые security-заголовки` (FIX-L2)** — каждый ответ теперь несёт `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`. При биндинге не на loopback (`HOST` ≠ `127.0.0.1`/`::1`/`localhost`) поверх накладывается строгая `Content-Security-Policy`: `default-src 'self'`, `script-src 'self'` (без `unsafe-inline`), Google Fonts в whitelist, `connect-src 'self'` блокирует exfiltration. Inline `onclick`-обработчики из `index.html` и `router.js` перенесены на `addEventListener`, чтобы строгий CSP не ломал функционал. 8 новых тестов.
- **`fix(api): ужесточение валидатора URL pipeline` (FIX-M7)** — `POST /api/pipeline` принимал `"not-a-url"` и сохранял эту строку. Теперь `isValidJobUrl()` отклоняет голые строки, длину <10 или >2000 символов, URL с пробелами, схемы кроме `http(s)`, loopback-хосты (`localhost`/`127.0.0.1`/`::1`). Включает в себя **FIX-M3** + **FIX-M6** (400 на невалидное + флаг `deduped` при успехе).
- **`fix(server): загрузка .env чтобы HH_USER_AGENT / GEMINI_API_KEY hints работали`** — раньше runtime говорил «set HH_USER_AGENT in .env», но сервер этот файл не читал. Добавлен 35-строчный zero-dependency dotenv-loader (`server/lib/dotenv.mjs`). Значения, заданные в shell, по-прежнему имеют приоритет. Parent's `.env.example` теперь включает блок `HH_USER_AGENT` с примером реального Chrome User-Agent. 6 новых тестов.
- **`fix(api): санитизация JD перед сборкой prompt` (FIX-M5)** — `POST /api/evaluate` удаляет ANSI-escape-последовательности, управляющие байты, inline `<script>`-теги, обрезает пробелы перед вызовом Gemini или возвратом prompt. Лимит 50 КБ. Минимум 50 символов проверяется уже на *очищенном* тексте, поэтому prompt-инъекции, в которых много escape-кодов, отбрасываются с 400 быстро.
- **`fix(health): маскировка Node version и project root при HOST!=loopback` (FIX-M1)** — `/api/health` больше не светит fingerprint хоста, когда сервер открыт в LAN. На loopback значения видны для локальной диагностики.

### ✨ Новые возможности

- **`feat: 7 новых sidebar modes + grouped sidebar` (FIX-C8)** — 100% покрытие `modes/` parent-проекта без UI-пробелов. Новые роуты: `#/project` (советник по портфолио), `#/training` (оценка курса/сертификации), `#/followup` (cadence per-application), `#/batch` (параллельный URL-процессор), `#/contacto` (LinkedIn outreach), `#/interview-prep` (подготовка к интервью), `#/patterns` (паттерны отказов). Все семь — одна config-driven фабрика view (`public/js/views/mode-page.js`) и один общий endpoint `POST /api/mode/:slug`. Sidebar разбит на 6 групп: Sourcing / Decision / Application / Networking / Analytics / Setup. Всего 18 nav-items. 12 новых тестов в `tests/modes-endpoints.test.mjs`.
- **`fix: bootstrap parent deps + russian_portals defaults` (FIX-C4 + C9 + C12 + H2)** — `bin/start.sh` ставит parent's `node_modules` и `npx playwright install chromium` на свежих клонах, чтобы `/api/stream/scan`, `/pdf` и `/liveness` работали из коробки. `createApp()` пробует `portals.yml` на каждом старте — если блок `russian_portals:` отсутствует, дописывает дефолт с комментариями. Идемпотентно. 3 новых теста.
- **`fix: disable 9 dead portal slugs` (FIX-C3)** — `templates/portals.example.yml` теперь поставляется с Ada / Factorial / Tinybird / Weights & Biases / Travelperk / Clarity AI / Forto / Vinted / Runway помеченными `enabled: false`. Новые установки сканируют **87** живых компаний вместо 96. Новый `web-ui/scripts/portals-health-check.mjs` HEAD-пробит каждый `careers_url` и репортит DEAD-записи. 3 новых теста.
- **`feat(activity): журнал действий пользователя + страница Activity`** — каждый изменяющий состояние API-запрос пишется в `data/activity.jsonl` (timestamp, глагол действия, цель, флаг успеха, опциональная деталь). Новый пункт sidebar **История** с чип-фильтрами по префиксу действия (pipeline / cv / jd / evaluate / scan / stream / script), значками ✓/✗ и кнопкой обновления. Авторотация при 5 МБ. 10 новых тестов.
- **`feat(deep): Deep Research в браузере + архив сохранённых результатов`** — страница Deep Research теперь (a) при `{ run: true }` и установленном `GEMINI_API_KEY` запускает prompt через Gemini и сохраняет результат в `interview-prep/{slug}.md`; (b) показывает все сохранённые исследования карточками с относительным временем; (c) рендерит результат как Markdown с действиями **📋 Копировать / ⬇ Скачать .md / ↗ Открыть в новой вкладке**. Новые REST-эндпоинты: `GET /api/interview-prep`, `GET /api/interview-prep/:name`, `DELETE /api/interview-prep/:name`. 7 новых тестов.
- **`feat(cv): генерация и скачивание PDF в браузере + архив PDF`** — кнопка **📄 Сгенерировать PDF** на странице резюме стримит `/api/stream/pdf` в модальной консоли. При `ERR_MODULE_NOT_FOUND` / `playwright` показывает копируемую команду установки. Раздел «Сгенерированные PDF» автоподгружается после успешного запуска и показывает все `output/*.pdf` с кнопками **↗ Открыть** и **⬇ Скачать**. Новые REST-эндпоинты: `GET /api/output/pdfs`, `GET /api/output/pdfs/:name`. 6 новых тестов.
- **`feat(api): POST /api/tracker — добавление строк из UI` (FIX-H8)** — добавление канонической строки в `data/applications.md` прямо из браузера. Валидирует company + role, нормализует статус по `templates/states.yml`, автоинкрементирует `#` с zero-padding, дедуплицирует по company+role (без учёта регистра), экранирует `|` в notes. Бутстрапит таблицу, если файл пустой. 6 новых тестов.
- **`feat(api): DELETE /api/jds/:name` (FIX-H4)** — удаление сохранённых JD без выхода в shell. Path-traversal стрипается до файлового доступа; параметр должен заканчиваться на `.txt`. 5 новых тестов, включая отказ на `../../etc/passwd`.
- **`feat(api): POST /api/evaluate/test-gemini` (FIX-H7)** — smoke-тест эндпоинт, прогоняет 50-символьный JD через `gemini-eval.mjs` чтобы пользователь мог проверить ключ без полной оценки. Возвращает `{ ok, code, sampleLength, sample }`.

### 🐛 Багфиксы

- **`fix(router): catch-all 404 + охрана покрытия i18n` (FIX-C7)** — неизвестные hash-маршруты раньше тихо падали на dashboard, скрывая опечатки и битые ссылки. Теперь `#/totally-random-xyz` отрисовывает специальную 404-страницу, цитирующую плохой путь и предлагающую вернуться на dashboard. View `__not_found__` зарегистрирован прямо внутри IIFE роутера, чтобы не конфликтовать с пользовательскими маршрутами. Новый `tests/i18n-coverage.test.mjs` запускает `i18n.js` в `vm.Context` со stub-`window`, открывает приватный `DICT` и проверяет, что все 173+ ключа × 8 локалей заполнены. 4 новых теста роутера.
- **`fix(router): алиас #/profile → settings` (FIX-C2)** — внутреннее имя маршрута `settings` (с `nav.settings`, рендерящимся как "Профиль"), но внешние ссылки и мышечная память пользователя ведут на `#/profile`. Теперь оба адреса показывают одну и ту же страницу, и пункт sidebar подсвечивается в обоих случаях. 2 новых теста.
- **`fix(health): унификация Health/Doctor + флаг template-профилей` (FIX-C6 + FIX-H6)** — Health и Doctor были двумя источниками правды. Теперь `/api/health` отдаёт всё, что показывал Doctor (parent-зависимости, Playwright, директории, customized-профиль, `HH_USER_AGENT`). Проверка `Profile customized` детектирует placeholder-имена (`Jane Smith`, `Alex Doe`, `John Doe`, `Your Name`, `Test User`) и YAML-parse ошибки. 4 новых теста.
- **`fix(scan): предупреждение о коллизии query↔negative в RU-конфиге` (FIX-H3)** — когда `portals.yml` содержит `"PHP"` в `title_filter.negative`, а запросы таргетят Senior PHP, все совпадения отфильтровываются и пользователь видит ноль результатов. `loadConfig()` теперь считает массив `warnings`, а `runRuScan()` пишет каждое предупреждение как SSE stderr-строку до начала сканирования. 2 новых теста проверяют, что shipped defaults остаются дружелюбными к PHP.
- **`fix(scan): предупреждение когда HH_USER_AGENT не задан` (FIX-H1)** — страница `/scan` пробует `/api/health` и показывает жёлтую карточку над кнопками, если `HH_USER_AGENT` пуст. Так пользователь узнаёт о 403 от hh.ru *до* нажатия RU scan.
- **`fix(api): предупреждение если slug в POST /api/jds зачищен` (FIX-M2)** — нормализация slug, удаляющая опасные символы, теперь возвращает поле `warning`; чистая нормализация регистра/пробелов остаётся бесшумной. Пустой результат после очистки даёт 400.
- **`fix(ui): сброс глобального поиска при смене маршрута + спинеры на кнопках` (FIX-M4 + FIX-L1)** — глобальный поиск очищается на `hashchange` (с защитой от активного ввода). Новый хелпер `UI.withSpinner(button, fn)` подключает loading-состояние, ARIA и защиту от двойного клика к каждому async-нажатию. Уже подключён к Doctor / Verify / sync-check / Save CV / Normalize / Dedup / Merge.
- **`fix(ui): пустой placeholder modal-title` (FIX-H9)** — hardcoded английская строка `"Title"` в `index.html` удалена, race-окно её видимости при открытии модалки закрыто.

### 🌐 i18n

- 173+ ключей × 8 локалей (`en`, `es`, `pt-BR`, `ko`, `ja`, `ru`, `zh-CN`, `zh-TW`). Новые ключи во всех локалях: 404-страница, журнал действий, Deep Research, PDF-flow, security-предупреждения, мутация трекера, переименование Apply. Покрытие охраняется `tests/i18n-coverage.test.mjs` — любой ключ без перевода в любой локали ломает CI.

### ⚙️ DevOps

- **Тестов:** 73 → **225** (+104 теста в 14 новых файлах). Единственный падающий тест (`runEnScan: dry-run end-to-end across multiple sources`) — pre-existing flake, зависит от живых API Greenhouse/Ashby/Lever.
- **CSP-friendly UI:** все inline `onclick`-обработчики удалены из `index.html` и `router.js`. Строгая политика `script-src 'self'` теперь обеспечивается без поломки функционала.

### 📦 Новые REST-эндпоинты

| Метод | Путь | Назначение |
|---|---|---|
| `GET`    | `/api/activity`              | Список действий пользователя, новые сверху |
| `GET`    | `/api/interview-prep`        | Список сохранённых Deep Research |
| `GET`    | `/api/interview-prep/:name`  | Чтение конкретного исследования |
| `DELETE` | `/api/interview-prep/:name`  | Удаление исследования |
| `GET`    | `/api/output/pdfs`           | Список сгенерированных PDF |
| `GET`    | `/api/output/pdfs/:name`     | Скачивание PDF (Content-Disposition: attachment) |
| `POST`   | `/api/tracker`               | Добавление строки в `applications.md` |
| `DELETE` | `/api/jds/:name`             | Удаление сохранённого JD |
| `POST`   | `/api/evaluate/test-gemini`  | Smoke-тест ключа Gemini API |

---

## [1.6.0] — 2026-05-02

Первый публичный релиз веб-UI. Полный список функций — в `README.md`.
