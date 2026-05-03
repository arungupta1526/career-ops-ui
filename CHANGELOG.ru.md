# Журнал изменений

Все значимые изменения **career-ops-ui**. Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версии по [Semantic Versioning](https://semver.org/lang/ru/).

Переводы: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

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
