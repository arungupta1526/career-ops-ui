# career-ops-ui

> Чистый docs-style веб-интерфейс для AI-пайплайна поиска работы [career-ops](https://github.com/santifer/career-ops).
> Ищите, оценивайте, делайте deep-dive, подавайте заявки и трекайте каждый оффер из одной вкладки браузера — вместо беготни между Claude Code, терминалами и markdown-файлами.

[English](README.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko-KR.md) | [日本語](README.ja.md) | **Русский** | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

[![tests](https://img.shields.io/badge/tests-427%20passed-brightgreen)](#тесты)
[![playwright](https://img.shields.io/badge/playwright-28%20e2e-brightgreen)](#тесты)
[![node](https://img.shields.io/badge/node-%E2%89%A518-blue)](#требования)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![release](https://img.shields.io/badge/release-v1.19.0-blue)](https://github.com/Fighter90/career-ops-ui/releases/tag/v1.19.0)

![career-ops-ui — Командный центр](./images/dashboard-en.png)

## О career-ops

[career-ops](https://career-ops.org) — это open-source система поиска работы, которая запускается как slash-команды внутри любого AI coding CLI (Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot CLI). Модель-агностична. Оценивает каждую вакансию против вашего CV по шестимерной рубрике 0.0–5.0, генерирует подогнанные PDF-резюме и трекает каждую заявку локально — без облачных аккаунтов, без телеметрии, без авто-сабмита.

**Этот репозиторий (career-ops-ui)** — отполированный веб-интерфейс поверх CLI. CLI продолжает владеть заполнением форм (через Playwright MCP) и slash-командными режимами; SPA даёт CRM-стиль браузерной поверхности над теми же файлами `cv.md` / `data/applications.md` / `reports/`. У обоих общие данные.

**Пороги действий по score** (из [career-ops.org/docs](https://career-ops.org/docs)):

| Score | Следующий шаг |
|---|---|
| **≥ 4.5** | `/career-ops apply` — высокий fit, подавайте сразу |
| **4.0 – 4.4** | подача или `/career-ops contacto` для warm intro |
| **3.5 – 3.9** | `/career-ops deep` — сначала исследование |
| **< 3.5** | пропустите, если нет конкретной причины |

**Канонические гайды** на [career-ops.org/docs](https://career-ops.org/docs):

- [What is career-ops](https://career-ops.org/docs/introduction/what-is-career-ops)
- [Scan job portals](https://career-ops.org/docs/introduction/guides/scan-job-portals)
- [Apply for a job](https://career-ops.org/docs/introduction/guides/apply-for-a-job)
- [Batch-evaluate offers](https://career-ops.org/docs/introduction/guides/batch-evaluate-offers)
- [Set up Playwright](https://career-ops.org/docs/introduction/guides/set-up-playwright)

## Установка одной командой

```bash
curl -fsSL https://raw.githubusercontent.com/Fighter90/career-ops-ui/main/bin/setup.sh | bash
```

Эта команда клонирует оба репозитория (career-ops + career-ops-ui), устанавливает зависимости и запускает сервер на http://127.0.0.1:4317.

---

## Зачем?

[career-ops](https://github.com/santifer/career-ops) — это мощная система поиска работы на базе Claude Code: вставьте JD → получите fit-score 0-5, ATS-оптимизированный PDF и запись в трекере. Внутри Claude Code работает отлично, но данные раскиданы по `cv.md`, `data/applications.md`, `reports/*.md`, `data/pipeline.md`, `portals.yml`, `config/profile.yml` — легко потерять, сложно охватить взглядом.

`career-ops-ui` накладывает сверху отполированный UI:

- **Просматривайте** трекер, отчёты и pipeline как CRM.
- **Запускайте** сканы (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday **и** hh.ru / Habr Career) и наблюдайте live SSE-логи.
- **Оценивайте** JD live через Anthropic (предпочтительно) или Gemini, или получите copy-paste промпт для Claude Code, если API-ключ не задан.
- **Deep research** компаний live через Anthropic SDK с автоматически инлайнящимися cv / profile / mode файлами.
- **Редактируйте** `cv.md` со side-by-side markdown-превью и server-side XSS-санитизацией.
- **Поддерживайте** систему: doctor, verify, normalize, dedup, merge — каждое одним кликом.
- **Multi-CLI:** одинаково управляется из Claude Code, Codex, Cursor, Aider или Gemini CLI — `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` шимы указывают на единый источник истины.

Это чистые добавления: внутри `career-ops/` ничего не меняется. Все ваши кастомизации остаются вашими.

---

## Быстрый старт

### 1. Сначала установите career-ops

```bash
git clone https://github.com/santifer/career-ops.git
cd career-ops
```

Следуйте [career-ops onboarding](https://github.com/santifer/career-ops#first-run--onboarding), чтобы `cv.md`, `config/profile.yml` и `portals.yml` существовали.

### 2. Положите career-ops-ui внутрь

```bash
git clone https://github.com/Fighter90/career-ops-ui.git web-ui
```

Ваше дерево теперь выглядит так:

```
career-ops/
├─ cv.md
├─ portals.yml
├─ config/
├─ data/
├─ modes/
├─ reports/
├─ scan.mjs … doctor.mjs … (и т.д.)
└─ web-ui/                 ← этот репозиторий
   ├─ bin/start.sh
   ├─ package.json
   ├─ server/
   ├─ public/
   └─ tests/
```

### 3. Запуск

```bash
bash web-ui/bin/start.sh
```

Скрипт:

1. Проверяет Node ≥ 18.
2. `npm install` (только при первом запуске, две зависимости — Express + js-yaml).
3. Запускает Express-сервер на `127.0.0.1:4317`.
4. Открывает http://127.0.0.1:4317/ в браузере по умолчанию.

Кастомный порт / хост:

```bash
PORT=8080 bash web-ui/bin/start.sh
HOST=0.0.0.0 PORT=4317 bash web-ui/bin/start.sh   # открыть на LAN
```

Если вы склонировали репозиторий куда-то ещё (не как `career-ops/web-ui`), укажите путь к career-ops через env:

```bash
CAREER_OPS_ROOT=/path/to/career-ops bash bin/start.sh
```

---

## Требования

| | |
| --- | --- |
| **Node.js** | ≥ 18 (использует нативные `fetch`, `node:test`) |
| **career-ops** | Склонирован и onboarded — см. выше |
| **Опционально** | `GEMINI_API_KEY` в `.env` родительского проекта (бесплатная модель `gemini-2.0-flash`) для оценки JD в один клик. Иначе UI вернёт copy-paste промпт для Claude. |
| **Опционально** | Запуск с российского IP / VPN, если hh.ru возвращает 403. Habr Career работает с любого IP. |
| **Опционально** | Playwright (уже транзитивная зависимость career-ops) для e2e тест-сьюта. |

---

## Что вы получаете — постранично

| Страница         | Что делает                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Дашборд**      | Агрегированные счётчики (apps / pipeline / отчёты), средний score, разбивка по статусам, последние 5 заявок + последний отчёт. |
| **Поиск**        | **🌐 Одна кнопка Scan** — за один проход запускает каждый включённый источник (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday для EN, hh.ru + Habr Career для RU). Live SSE-стрим логов + кликабельная таблица результатов с фильтрами location / Remote-Hybrid badge / relocation flag / salary / source и динамическими chip-фильтрами стек / уровень / ключевые слова. Карточка Active Companies перечисляет все отслеживаемые доски с их API health. |
| **Pipeline**     | CRUD над `data/pipeline.md`. Server-side preview-прокси (SSRF-safe, валидация redirect'ов per-hop, лимит тела 8 KB). Прыжок прямо с URL на оценку. |
| **Оценка**       | Вставьте JD → **Anthropic-first** (предпочтительно, когда оба ключа заданы), затем Gemini, затем manual prompt fallback. Anthropic-путь автоматически инлайнит cv / profile / `_shared.md` / `oferta.md` (REVIEW-A1). Опциональное сохранение JD в `jds/`. |
| **Deep research**| Та же fallback-цепочка, что у Evaluate. Live Anthropic возвращает ~10-30 KB grounded markdown, сохраняемого в `interview-prep/<company>-<role>.md`. |
| **Modes**        | 7 generic-страниц режимов (`/#/project`, `/#/training`, `/#/followup`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns`) с тем же Anthropic / Gemini / manual fallback. |
| **Apply helper** | Генерирует чек-лист подачи; реальное Playwright заполнение формы остаётся в `/career-ops apply` внутри Claude Code. |
| **Трекер**       | Filterable-таблица над `data/applications.md` (статус, score, free-text). One-click `normalize-statuses.mjs` / `dedup-tracker.mjs` / `merge-tracker.mjs`. Экранирование pipe и newline соответствует GFM — имена вроде `"Acme \| Co"` ходят туда-обратно без потерь. |
| **Отчёты**       | Просмотр и чтение каждого отчёта в `reports/` с распарсенным header (Score / Legitimacy / URL).                  |
| **CV**           | Live markdown-редактор для `cv.md` со side-by-side preview + one-click `cv-sync-check.mjs` + 📁 Upload CV. Server-side XSS strip при сохранении (`<script>`, `javascript:`, `on*=` handlers). |
| **Профиль**      | Read-only вьюшка `config/profile.yml` + архетипы — UI-friendly summary.                                          |
| **App settings** | In-UI редактор для родительских `.env` ключей: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, model-оверрайды, port / host. Секреты замаскированы на чтении. |
| **Health**       | Все setup-проверки в badge'ах OK / OPTIONAL / FAIL + кнопки запуска `doctor.mjs` и `verify-pipeline.mjs`.        |
| **Help**         | In-app Markdown user guide (`/#/help`), локализован для всех 8 поддерживаемых языков (en / es / pt-BR / ko-KR / ja / ru / zh-CN / zh-TW). |
| **Activity log** | Audit-trail каждого state-changing запроса (writes, runs, scans). Секреты замаскированы. |

Глобальные клавиатурные шорткаты:

- `Ctrl+K` / `Cmd+K` — фокус на глобальный поиск.
- Вставка URL в глобальный поиск автоматически добавляет его в pipeline.
- `Esc` — закрыть любое открытое модальное окно.

---

## Сканирование

Zero-token сканирование порталов, которое реально возвращает вакансии. **Одна кнопка 🌐 Scan** в UI запускает каждый сконфигурированный источник за один проход:

- **Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday** — публичный boards-api для каждой компании в `portals.yml::tracked_companies` с распознаваемым ATS-паттерном. Встроенный список покрывает Stripe, GitLab, Vercel, Cloudflare, Datadog, Discord, Elastic, Grafana Labs, CockroachDB, Fastly, Twilio, Coinbase, Reddit, Robinhood, Affirm, Lyft, Linear, Supabase, PostHog, Ramp, Modal Labs, Railway, Browserbase, JetBrains — расширяйте или сокращайте свободно.
- **hh.ru** — публичный API (возвращает 403 с не-RU IP; запускайте с российского IP / VPN, либо пропустите — повторяющиеся 403 от одного источника схлопываются, и источник отключается на лету). Сервер шлёт разумный User-Agent по умолчанию; power-users всё ещё могут переопределить через российский IP / VPN.
- **Habr Career** — HTML-скрейпинг `career.habr.com/vacancies`. Работает с любого IP, без авторизации.

Все источники проходят через единый pipeline: normalize → filter (`title_filter.positive` / `title_filter.negative`) → dedup против `data/scan-history.tsv` + `data/pipeline.md` + `data/applications.md` → append в `data/pipeline.md` → сохранение полного результата в `data/last-scan.json` для filterable-таблицы UI.

Конфигурация через `portals.yml`:

```yaml
title_filter:
  positive: [backend, engineer, senior, tech lead, golang, php]
  negative: [junior, intern, frontend, ios, android]
tracked_companies:
  - { name: Stripe, enabled: true, careers_url: https://job-boards.greenhouse.io/stripe }
  - { name: Linear, enabled: true, careers_url: https://jobs.ashbyhq.com/linear }
  # ...
russian_portals:
  sources: ["hh", "habr"]   # один или оба
  area: 113                  # 1=Москва, 2=СПб, 113=Россия, 1001=remote
  per_page: 50
  only_remote: false
  queries: ["Senior PHP", "Senior Go", "Tech Lead"]
```

Все источники проходят через единый SSE-endpoint: `/api/stream/scan?source=ats|regional|both`. Кнопка **🌐 Scan** в UI вызывает `source=both`, поэтому каждый adapter (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday + hh.ru + Habr Career) запускается в одном соединении. Уважает `AbortSignal` при дисконнекте клиента — никаких сиротских fetch'ей.

---

## Архитектура

```
career-ops-ui/
├─ CLAUDE.md                 # инструкции для агента на уровне проекта (каноническая версия)
├─ AGENTS.md                 # Codex / Aider / generic CLI шим → CLAUDE.md
├─ GEMINI.md                 # Gemini CLI шим → CLAUDE.md
├─ .aiignore                 # exclusion-список для AI-тулов
├─ .claude/                  # конфиг агента Claude Code
│  ├─ agents/                # 3 субагента уровня проекта (route, view, test isolation)
│  └─ commands/               # заглушки slash-команд
├─ bin/start.sh              # one-shot лаунчер (Node check → npm install → server → open browser)
├─ package.json              # 2 runtime-зависимости: express, js-yaml
├─ server/
│  ├─ index.mjs              # ~130 LOC оркестратор: middleware + 12 вызовов register<Topic>Routes(app) + SPA catch-all
│  └─ lib/
│     ├─ paths.mjs           # абсолютные пути к файлам career-ops (CAREER_OPS_ROOT aware)
│     ├─ parsers.mjs         # markdown / pipeline / report парсеры (GFM-совместимое экранирование pipe)
│     ├─ runner.mjs          # runNodeScript() + streamNodeScript() с эскалацией SIGTERM→SIGKILL + 30 min cap
│     ├─ security.mjs        # isValidJobUrl, stripDangerousMarkdown, sanitizeJobDescription, isPubliclyExposed
│     ├─ prompts.mjs         # bundleProjectContext, buildEvaluationPrompt, buildDeepPrompt, buildModePrompt
│     ├─ store.mjs           # safeReadApps/Pipeline/Reports, checkProfileCustomized, ensureRussianPortalsDefaults
│     ├─ anthropic.mjs       # минимальный Anthropic SDK adapter (runAnthropic, hasAnthropicKey, hasGeminiKey)
│     ├─ env-config.mjs      # .env round-trip с маскированием секретов + валидация
│     ├─ activity-log.mjs    # JSONL audit-trail middleware (секреты замаскированы)
│     ├─ dotenv.mjs          # крошечный dotenv-лоадер
│     ├─ en-scanner.mjs      # in-process Greenhouse/Ashby/Lever оркестратор (AbortSignal aware)
│     ├─ ru-scanner.mjs      # in-process hh.ru + Habr оркестратор (AbortSignal aware)
│     ├─ sources/
│     │  ├─ greenhouse.mjs   # boards-api.greenhouse.io клиент
│     │  ├─ ashby.mjs        # api.ashbyhq.com клиент
│     │  ├─ lever.mjs        # api.lever.co клиент
│     │  ├─ hh.mjs           # api.hh.ru клиент (UA-aware)
│     │  └─ habr.mjs         # career.habr.com HTML-парсер (без cheerio, только regex)
│     └─ routes/             # 12 модулей маршрутов — по одному на тему (P-2)
│        ├─ activity.mjs     # /api/activity
│        ├─ config.mjs       # /api/config (родительский .env round-trip)
│        ├─ content.mjs      # /api/cv, /api/profile, /api/portals, /api/modes
│        ├─ health.mjs       # /api/health, /api/dashboard
│        ├─ help.mjs         # /api/help/:lang
│        ├─ jds.mjs          # /api/jds CRUD
│        ├─ llm.mjs          # /api/evaluate, /api/deep, /api/mode/:slug, /api/apply-helper, /api/interview-prep*
│        ├─ pipeline.mjs     # /api/pipeline + SSRF-safe preview-прокси
│        ├─ reports.mjs      # /api/reports
│        ├─ runners.mjs      # /api/run/* + /api/stream/{scan,liveness,pdf} + /api/output/pdfs
│        ├─ scan.mjs         # /api/stream/scan-{ru,en} + /api/scan-results
│        └─ tracker.mjs      # /api/tracker
├─ public/                   # статичная SPA — без build-шага
│  ├─ index.html
│  ├─ css/app.css            # design tokens (docs-style палитра)
│  └─ js/
│     ├─ api.js              # fetch-обёртка + state connection-баннера + UI-хелперы + safe markdown renderer
│     ├─ router.js           # hash-based роутер с 404 fallback + поддержка alias
│     ├─ app.js              # boot + глобальные клавиатурные обработчики + mobile sidebar drawer
│     ├─ lib/{i18n,skills}.js
│     └─ views/              # по файлу на страницу (dashboard, scan, pipeline, evaluate, deep, apply, tracker, reports, cv, settings, health, config, help, activity, mode-page)
├─ docs/                     # публичный референс: архитектура, API, data-flows, SDD, конвенции, ревью
│  ├─ PROJECT.md             # что / зачем / для кого
│  ├─ ROADMAP.md             # текущий milestone + завершённая история
│  ├─ PRODUCTION-READINESS.md # честная оценка deployment-gate
│  ├─ sdd/{SDD-GUIDE,CONVENTIONS}.md
│  ├─ architecture/{OVERVIEW,SERVER,FRONTEND,API,DATA-FLOWS}.md
│  └─ reviews/REVIEW-*.md
└─ tests/                    # 284 unit + 12 Playwright + 23 e2e:full + 20 e2e:smoke
   ├─ parsers.test.mjs       # markdown / pipeline / report парсеры (чистые функции)
   ├─ api.test.mjs           # каждый endpoint, эфемерный сервер, без сети
   ├─ {ru,en}-scanner.test.mjs   # mocked fetch
   ├─ pipeline-preview.test.mjs   # валидация redirect'ов per-hop (REVIEW-B1)
   ├─ anthropic.test.mjs     # SDK adapter + log-guard test (REVIEW-B4)
   ├─ url-validation.test.mjs    # SSRF reject sweep (FIX-M3 + M6 + M7)
   ├─ cv-xss.test.mjs        # stripDangerousMarkdown round-trip
   ├─ jd-sanitize.test.mjs   # sanitizeJobDescription
   ├─ help.test.mjs / help-ui.test.mjs    # i18n parity для всех 8 локалей
   ├─ playwright-smoke.mjs   # 12 browser-флоу (CV save, tracker, pipeline, evaluate, config и т.д.)
   └─ e2e{,-comprehensive}.mjs   # полный Playwright walkthrough
```

### Почему без build-шага?

Vanilla HTML/CSS/JS оставляет крошечную поверхность атаки: один `npm install` двух зависимостей — и вы запущены. Никакого Webpack, никакого Vite, никаких `node_modules` ужаса. Весь UI < 30 KB в minified-виде. Если хотите hot-reload во время разработки, `npm run dev` использует встроенный в Node `--watch`.

### Spec-Driven Development

Нетривиальные изменения проходят через GSD-пайплайн (`gsd-*` скиллы из `superpowers@claude-plugins-official`):

```
discuss → spec → plan → execute → verify → review
```

Публичный референс: [`docs/sdd/SDD-GUIDE.md`](docs/sdd/SDD-GUIDE.md). Все артефакты планирования живут под `.planning/` (gitignored). Дерево `docs/` — это долгоживущий публичный контракт.

---

## API reference

Все endpoints под `/api/*`. JSON in / JSON out, если не указано иначе.

### Health & dashboard

| Method | Path                     | Response                                                                    |
| ------ | ------------------------ | --------------------------------------------------------------------------- |
| GET    | `/api/health`            | `{ ok, warnings, version, parentVersion, checks: [{name, ok, required, value?}] }` |
| GET    | `/api/dashboard`         | `{ counts, avgScore, byStatus, recent, pipeline, lastReport }`              |
| GET    | `/api/activity?limit&type` | хвост `data/activity.jsonl` audit-trail                                   |
| GET    | `/api/help/:lang`        | локализованный in-app user guide (fallback: `en.md`)                        |

### App settings (родительский .env round-trip)

| Method | Path             | Назначение                                                             |
| ------ | ---------------- | ---------------------------------------------------------------------- |
| GET    | `/api/config`    | известные env-ключи с замаскированными секретами                       |
| POST   | `/api/config`    | валидация + запись родительского `.env`; применяется к `process.env` на месте |

### Файлы данных

| Method | Path                                | Назначение                                                             |
| ------ | ----------------------------------- | ---------------------------------------------------------------------- |
| GET    | `/api/tracker`                      | `{ rows: [распарсенный applications.md] }`                             |
| POST   | `/api/tracker`                      | body `{ company, role, score?, status?, url?, notes?, date? }` — dedup-aware (case-insensitive по company + role) |
| GET    | `/api/pipeline`                     | `{ urls: [...] }`                                                      |
| POST   | `/api/pipeline`                     | body `{ url }` → добавление в `data/pipeline.md` с dedup + `isValidJobUrl` |
| GET    | `/api/pipeline/preview?url=…`       | server-side fetch-прокси (per-hop SSRF check, ≤3 редиректа, 8 KB cap) |
| DELETE | `/api/pipeline?url=…`               | удаление URL                                                           |
| GET    | `/api/reports`                      | распарсенный список `reports/*.md`                                     |
| GET    | `/api/reports/:slug`                | полный markdown + распарсенный header                                  |
| GET    | `/api/jds`                          | список сохранённых JD-файлов                                           |
| GET    | `/api/jds/:name`                    | text/plain — сырой JD                                                  |
| POST   | `/api/jds`                          | body `{ text, slug? }` → сохранение в `jds/`                           |
| DELETE | `/api/jds/:name`                    | unlink (требуется суффикс `.txt`)                                      |
| GET    | `/api/cv`                           | `{ markdown }`                                                         |
| PUT    | `/api/cv`                           | body `{ markdown }` → запись `cv.md` (XSS-stripped, ≤1 MB)             |
| GET    | `/api/profile`                      | `{ profile: yaml-parsed, raw: text }`                                  |
| GET    | `/api/portals`                      | `{ portals: yaml-parsed, raw: text }`                                  |
| GET    | `/api/modes`                        | список mode-файлов                                                     |
| GET    | `/api/modes/:name`                  | text/plain — сырой mode-prompt                                         |
| GET    | `/api/output/pdfs`                  | список сгенерированных PDF                                             |
| GET    | `/api/output/pdfs/:name`            | скачивание (`Content-Disposition: attachment`)                         |
| GET    | `/api/interview-prep`               | список сохранённых deep-research файлов                                |
| GET    | `/api/interview-prep/:name`         | `{ name, markdown }`                                                   |
| DELETE | `/api/interview-prep/:name`         | unlink (требуется суффикс `.md`)                                       |

### Скрипт-раннеры (buffered, one-shot)

| Method | Path                    | Wraps                       |
| ------ | ----------------------- | --------------------------- |
| POST   | `/api/run/doctor`       | `node doctor.mjs`           |
| POST   | `/api/run/verify`       | `node verify-pipeline.mjs`  |
| POST   | `/api/run/normalize`    | `node normalize-statuses.mjs` |
| POST   | `/api/run/dedup`        | `node dedup-tracker.mjs`    |
| POST   | `/api/run/merge`        | `node merge-tracker.mjs`    |
| POST   | `/api/run/sync-check`   | `node cv-sync-check.mjs`    |

Все buffered-запуски ограничены 60 с; эскалация SIGTERM → SIGKILL после 5-секундного grace-периода.

### Стримы (SSE)

| Method | Path                          | Стримит                            |
| ------ | ----------------------------- | ---------------------------------- |
| GET    | `/api/stream/scan`            | legacy `node scan.mjs` (subprocess)|
| GET    | `/api/stream/scan?source=ats\|regional\|both` | консолидированный in-process scanner SSE — query: `dryRun=1`, `company=…` (только ATS). |
| GET    | `/api/stream/liveness`        | `node check-liveness.mjs`          |
| GET    | `/api/stream/pdf`             | `node generate-pdf.mjs`            |

Типы SSE-событий:

```
event: start    data: { script, args?, writeFiles? }
event: log      data: { stream: "stdout"|"stderr", line: string }
event: done     data: { code, counts?, errors? }
event: error    data: { message }
```

### LLM endpoints (Anthropic-first → Gemini → manual fallback)

| Method | Path                                | Назначение                                                                       |
| ------ | ----------------------------------- | -------------------------------------------------------------------------------- |
| POST   | `/api/evaluate`                     | body `{ jd, save? }` → оценка JD (секции A–G по `oferta.md`)                     |
| POST   | `/api/evaluate/test-gemini`         | smoke-check `GEMINI_API_KEY`                                                     |
| POST   | `/api/evaluate/test-anthropic`      | smoke-check `ANTHROPIC_API_KEY`                                                  |
| POST   | `/api/deep`                         | body `{ company, role?, run? }` → deep-research промпт или live grounded markdown |
| POST   | `/api/mode/:slug`                   | generic mode-раннер; allowlist: `batch`, `contacto`, `followup`, `interview-prep`, `patterns`, `project`, `training` |
| POST   | `/api/apply-helper`                 | body `{ url, jd? }` → чек-лист подачи                                            |
| GET    | `/api/scan-results`                 | `{ en: {when, fresh[], filtered[], errors[]}, ru: { ... } }` — последний скан    |
| GET    | `/api/scan/regional/config`         | эффективный конфиг regional-сканера (queries, negatives, sources). |

Когда `run: true` указано на `/api/deep` или `/api/mode/:slug`, сервер предпочитает Anthropic (когда оба ключа заданы), инлайнит `cv.md` + `config/profile.yml` + `modes/_shared.md` + соответствующий mode-шаблон в блок `<project_context>` и возвращает grounded markdown модели напрямую. Soft cap: 200 KB на собранный промпт — переполнение возвращает 413.

---

## Тесты

```bash
npm test                       # 284 unit/integration теста
npm run test:e2e               # 20 smoke e2e (запускает собственный сервер)
npm run test:e2e:full          # 23 comprehensive e2e
npm run test:e2e:browser       # 12 Playwright browser-smoke
npm run test:coverage          # то же, что `npm test`, плюс V8-coverage
```

| Suite                       | Тестов | Что                                                                                                        |
| --------------------------- | ----- | ---------------------------------------------------------------------------------------------------------- |
| `node --test tests/*.test.mjs` (unit + integration) | **284** | Каждый endpoint, эфемерный сервер, без сети. Включая парсер, scanner (mocked), runner, anthropic, security-headers, XSS, JD-санитизацию, URL-валидацию, i18n parity. |
| `tests/e2e.mjs` (smoke)      | 20    | Playwright headless: каждый маршрут рендерится, базовые флоу.                                              |
| `tests/e2e-comprehensive.mjs` | 23    | Полный Playwright walkthrough: 11 маршрутов + 12 функциональных флоу.                                      |
| `tests/playwright-smoke.mjs` (`npm run test:e2e:browser`) | **12** | Browser-driven smoke: рендер дашборда, навигация, переключение языка, 404, health, tracker round-trip (BF-1), pipeline add + invalid-URL sweep, reports empty, evaluate manual fallback, config keys masked, CV PUT XSS strip, pipeline preview 400. |
| **Всего**                   | **339** | **0 fails, 0 flakes**                                                                                    |

Покрытие: ~93% строк / ~83% веток через `--experimental-test-coverage`.

Парсеры — чистые функции (без I/O) — тестируются на реальных фрагментах данных из `applications.md`, `pipeline.md` и `reports/*.md`. API-тесты поднимают Express-приложение на эфемерном порту и прокручивают каждый endpoint end-to-end. Тесты сканера мокают `fetch`, поэтому проходят даже если hh.ru блокирует ваш IP. Playwright browser smoke запускается против in-process сервера и резолвит Playwright через `node_modules` родительского проекта — никаких новых зависимостей в `web-ui/`.

CI прогоняет матрицу unit + e2e + Playwright на каждый push в `main` против Node 18 / 20 / 22.

---

## Конфигурация

Переменные окружения (читаются на старте сервера, все опциональны, кроме отмеченных):

| Var                  | Default            | Назначение                                                                          |
| -------------------- | ------------------ | ----------------------------------------------------------------------------------- |
| `PORT`               | `4317`             | Порт привязки Express                                                               |
| `HOST`               | `127.0.0.1`        | Хост привязки Express. CSP подключается для non-loopback; auth-гейт запланирован на v2.0.0. |
| `CAREER_OPS_ROOT`    | `..` от скрипта    | Где искать `cv.md`, `data/`, `portals.yml`, `modes/` и т.д.                         |
| `ANTHROPIC_API_KEY`  | unset              | Включает live-режим `/api/evaluate`, `/api/deep`, `/api/mode/:slug` (предпочтительно, когда оба ключа заданы). |
| `ANTHROPIC_MODEL`    | `claude-sonnet-4-6` | Переопределение Anthropic-модели.                                                  |
| `GEMINI_API_KEY`     | unset              | Прокидывается в `gemini-eval.mjs` и используется как fallback для `/api/evaluate`.  |
| `GEMINI_MODEL`       | `gemini-2.0-flash` | Переопределение Gemini-модели.                                                      |
| `(server uses default UA)`      | unset              | Переопределение hh.ru User-Agent (помогает снизить 403 с не-RU IP)                  |

Расширение `portals.yml`, распознаваемое этим UI (добавьте к существующему файлу в родительском проекте):

```yaml
russian_portals:
  sources: ["hh", "habr"]
  area: 113          # hh.ru area id
  per_page: 50
  only_remote: false
  queries: ["Senior PHP", "Тимлид Go", ...]
```

Также можно расширить любую запись компании явным `api:` URL. См. [`docs/portals-examples.md`](docs/portals-examples.md) (в этом репозитории) для готовых блоков 24 верифицированных компаний.

---

## Заметки по безопасности

- Сервер биндится к `127.0.0.1` по умолчанию — никогда не выставлен в интернет без явного `HOST=0.0.0.0`.
- Все file-path inputs от клиента санитизируются (`replace(/[^\w\-.]/g, '')`).
- Subprocess-вызовы используют `spawn` с массивами аргументов — **никогда никакой shell-интерполяции**.
- Streaming-endpoints убивают дочерний процесс при дисконнекте клиента (никаких сиротских сканеров).
- Write-endpoints трогают только известные пути career-ops: `data/`, `jds/`, `cv.md`, `config/`, `portals.yml`, `output/`. Никогда нигде ещё.
- Connection-баннер пингует `/api/health` каждые 3 с пока отключён, и автоочищается при восстановлении — никакого toast-спама.

---

## Ограничения

Полностью LLM-driven режимы (`oferta`, `deep`, `contacto`, `apply`, `batch`, `patterns`, `followup`) требуют LLM для реальной работы. Веб-UI даёт вам три опции:

1. **Anthropic (предпочтительно)** — задайте `ANTHROPIC_API_KEY` в `.env` родительского проекта. Идёт через `runAnthropic` с автоматически инлайнящимися `cv.md` / `config/profile.yml` / `modes/_shared.md` / mode-шаблоном (REVIEW-A1). Верифицировано live в v1.8.0+ с `claude-sonnet-4-6`, возвращающим 26 KB grounded markdown для deep-research вызова.
2. **`gemini-eval.mjs`** как fallback — работает «из коробки», когда задан только `GEMINI_API_KEY`.
3. **Copy-paste промпт** — когда ключ не задан, UI генерирует готовый промпт, отформатированный для Claude Code / ChatGPT / Gemini Web.

Существующий Playwright form-fill флоу `/career-ops apply` внутри Claude Code остаётся единственным способом реально автозаполнить формы заявок — *Apply helper* в UI генерирует чек-лист вместо этого.

Оценку production-готовности (deployment gates, риск-реестр, отложенные работы) см. в [`docs/PRODUCTION-READINESS.md`](docs/PRODUCTION-READINESS.md). TL;DR: готов для single-tenant loopback; LAN-выставление ждёт auth-гейта v2.0 P-12.

---

## Contributing

Issues и PR приветствуются. Правила:

- Прогоните `npm test` перед push — **284 проверки green** — это планка (плюс 12 Playwright, если трогаете UI).
- Нетривиальные изменения проходят через GSD-пайплайн. См. [`docs/sdd/SDD-GUIDE.md`](docs/sdd/SDD-GUIDE.md).
- Не модифицируйте ничего в родительском `career-ops/` из этого репо. Вся суть в том, что это неинвазивный overlay. Жёсткие правила в [`CLAUDE.md`](CLAUDE.md).
- Conventional commits: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`. Опциональный scope: `feat(scan):`. Breaking change: `feat!:`.
- Тесты должны быть CI-изолированными — bootstrap фикстур через `mkdtempSync` или `CAREER_OPS_ROOT=$(mktemp -d)`.

Управляете репозиторием из не-Claude CLI (Codex, Aider, Cursor, Gemini)? Прочитайте [`AGENTS.md`](AGENTS.md) или [`GEMINI.md`](GEMINI.md) — оба шимятся к каноническому `CLAUDE.md`.

---

---

## 🌍 Getting Started — первые шаги после установки

После one-command install у вас два пустых git-клона со скаффолд-шаблонами `cv.md`,
`config/profile.yml`, `portals.yml`, `data/applications.md` и `data/pipeline.md`,
содержащими маркеры **EDIT ME**. Health-страница должна быть полностью зелёной
с первого запуска. Замените заглушки на свои реальные данные:

### 1. Создайте CV (`cv.md`)

Три варианта:

- **Вариант A — вставьте существующее резюме:** откройте `career-ops/cv.md`,
  замените EDIT-ME заглушки на ваше реальное резюме в чистом markdown
  (секции: Summary, Experience, Projects, Education, Skills). Чем проще,
  тем лучше — `career-ops` читает это как plain text.
- **Вариант B — загрузите из UI:** клик **CV** в сайдбаре →
  **📁 Upload CV** → выберите ваш `.md` / `.txt` файл → проверьте preview →
  клик **💾 Save**.
- **Вариант C — дайте свой LinkedIn URL Claude Code:** откройте Claude Code в
  `career-ops/`, запустите `/career-ops`, вставьте LinkedIn URL и попросите
  *«extract my CV from this and write it to cv.md»*.

Делайте каждую метрику конкретной (например, *«снизил p99 latency на 38%»*,
не *«улучшил производительность»*). Pipeline оценки читает метрики прямо
из этого файла.

### 2. Отредактируйте профиль (`config/profile.yml`)

```bash
$EDITOR career-ops/config/profile.yml
```

Замените заглушки на полное имя, email, локацию, LinkedIn, целевые роли,
архетипы, salary target. **Архетипы** — самое важное поле — именно через
них каждый JD матчится против вас.

### 3. Настройте сканер (`portals.yml`)

```bash
$EDITOR career-ops/portals.yml
```

Задайте `title_filter.positive` (например, `"PHP"`, `"Go"`, `"Backend"`, `"Senior"`)
и `title_filter.negative` (например, `"Junior"`, `"Java"`, `"iOS"`) под ваш
стек и сениорность. Встроенный список `tracked_companies` уже включает
3 верифицированные Greenhouse / Ashby доски (GitLab, Vercel, Linear).
24+ дополнительных готовых блоков см. в [`docs/portals-examples.md`](docs/portals-examples.md).

Если хотите сканирование hh.ru / Habr Career, отредактируйте блок
`russian_portals:`, который создал setup-скрипт — добавьте свои
поисковые запросы (например, `"Senior PHP"`, `"Тимлид Go"`).

### 4. (Опционально) LLM API-ключи

UI предпочитает Anthropic над Gemini, когда оба заданы. Любой из них
или ни одного — работает в любом случае. Без ключа **Evaluate** возвращает
copy-paste промпт для Claude Code.

```bash
# Anthropic (предпочтительно)
echo "ANTHROPIC_API_KEY=sk-ant-..." >> career-ops/.env
# Gemini (fallback)
echo "GEMINI_API_KEY=AIza..." >> career-ops/.env
```

Или задайте их через страницу **App settings** в UI (`/#/config`) — тот же
файл, masked-on-read, применяется к `process.env` мгновенно.

### 5. Проверьте и начинайте работу

Обновите Health-страницу — каждая обязательная проверка должна быть зелёной. Затем:

1. Клик **🌐 Scan** → подождите ~5 секунд → Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday +
   hh.ru / Habr Career просканированы, вакансии появятся в таблице ниже.
2. Клик по любому заголовку → оригинальная вакансия открывается в новой вкладке.
3. Фильтруйте по стек-chip'ам (PHP / Go / Backend / Senior), пока не увидите
   что-то перспективное.
4. Скопируйте URL → вставьте в **Pipeline** → клик **Evaluate**, чтобы
   получить score 0-5 live (Anthropic / Gemini) или manual-промпт.
5. Отчёты ложатся в `reports/`, трекер в `data/applications.md`,
   live deep-research в `interview-prep/`. Всё видно в UI.

> Переводы этого гайда живут в каждом языко-специфичном README:
> [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) ·
> [한국어](README.ko-KR.md) · [日本語](README.ja.md) ·
> [Русский](README.ru.md) · [简体中文](README.zh-CN.md) ·
> [繁體中文](README.zh-TW.md)

---

## Лицензия

MIT. См. [LICENSE](LICENSE).

Построено поверх [career-ops](https://github.com/santifer/career-ops) от [santifer](https://santifer.io). Спасибо за блестящий pipeline.
