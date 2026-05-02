# career-ops-ui

> An Airbnb-styled web interface for the [career-ops](https://github.com/santifer/career-ops) AI job-search pipeline.
> Search, evaluate, deep-dive, apply, and track every offer from a single browser tab — instead of bouncing between Claude Code, terminals, and markdown files.

**English** | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko-KR.md) | [日本語](README.ja.md) | [Русский](README.ru.md) | [简体中文](README.cn.md) | [繁體中文](README.zh-TW.md)

[![tests](https://img.shields.io/badge/tests-87%20passed-brightgreen)](#tests)
[![node](https://img.shields.io/badge/node-%E2%89%A518-blue)](#requirements)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

```
   ┌──────────────────────────────────────────────────────────────────────┐
   │ ◆ Dashboard      │  Command Center                                   │
   │ ◇ Scan           │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
   │ ▤ Pipeline       │  │  Apps   │ │Pipeline │ │ Reports │ │  Score  │  │
   │ ▷ Evaluate       │  │   12    │ │    3    │ │   12    │ │   4.2   │  │
   │ ⌕ Deep research  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
   │ → Apply helper   │                                                    │
   │ ≡ Tracker        │  Vacancies found  [filters: stack · level · src]  │
   │ ▦ Reports        │  ┌────────────────────────────────────────────┐   │
   │ ✎ CV             │  │ Vercel  Software Engineer, Backend  Remote │   │
   │ ⚙ Profile        │  │ GitLab  Engineering Manager, AI     Remote │   │
   │ ❤ Health         │  │ Stripe  Backend Engineer, Billing   US     │   │
   └──────────────────────────────────────────────────────────────────────┘
```

## One-command install

```bash
curl -fsSL https://raw.githubusercontent.com/Fighter90/career-ops-ui/main/bin/setup.sh | bash
```

This clones both repos (career-ops + career-ops-ui), installs deps, and starts the server at http://127.0.0.1:4317.

---

## Why?

[career-ops](https://github.com/santifer/career-ops) is a powerful Claude-Code-driven job-search system: paste a JD → get a 0-5 fit score, an ATS-optimized PDF, and a tracker entry. It works great inside Claude Code, but the data lives across `cv.md`, `data/applications.md`, `reports/*.md`, `data/pipeline.md`, `portals.yml`, `config/profile.yml` — easy to lose, hard to skim.

`career-ops-ui` puts a polished UI on top:

- **Browse** the tracker, reports, and pipeline like a CRM.
- **Trigger** scans (Greenhouse / Ashby / Lever **and** hh.ru / Habr Career) and watch live SSE logs.
- **Evaluate** a JD via the Gemini API or get a copy-paste prompt for Claude.
- **Edit** `cv.md` with side-by-side markdown preview.
- **Maintain** the system: doctor, verify, normalize, dedup, merge — one click each.

It's pure additions: nothing inside `career-ops/` changes. All your customizations stay yours.

---

## Quick start

### 1. Install career-ops first

```bash
git clone https://github.com/santifer/career-ops.git
cd career-ops
```

Follow [career-ops onboarding](https://github.com/santifer/career-ops#first-run--onboarding) so `cv.md`, `config/profile.yml`, and `portals.yml` exist.

### 2. Drop career-ops-ui inside it

```bash
git clone https://github.com/Fighter90/career-ops-ui.git web-ui
```

Your tree now looks like:

```
career-ops/
├─ cv.md
├─ portals.yml
├─ config/
├─ data/
├─ modes/
├─ reports/
├─ scan.mjs … doctor.mjs … (etc)
└─ web-ui/                 ← this repo
   ├─ bin/start.sh
   ├─ package.json
   ├─ server/
   ├─ public/
   └─ tests/
```

### 3. Launch

```bash
bash web-ui/bin/start.sh
```

The script:

1. Checks Node ≥ 18.
2. `npm install` (only on first run, two deps — Express + js-yaml).
3. Starts the Express server on `127.0.0.1:4317`.
4. Opens http://127.0.0.1:4317/ in your default browser.

Custom port / host:

```bash
PORT=8080 bash web-ui/bin/start.sh
HOST=0.0.0.0 PORT=4317 bash web-ui/bin/start.sh   # expose on LAN
```

If you cloned the repo somewhere else (not as `career-ops/web-ui`), point at career-ops via env:

```bash
CAREER_OPS_ROOT=/path/to/career-ops bash bin/start.sh
```

---

## Requirements

| | |
| --- | --- |
| **Node.js** | ≥ 18 (uses native `fetch`, `node:test`) |
| **career-ops** | Cloned and onboarded — see above |
| **Optional** | `GEMINI_API_KEY` in `.env` of the parent project (free-tier model `gemini-2.0-flash`) for one-click JD evaluation. Otherwise the UI returns a copy-paste prompt for Claude. |
| **Optional** | `HH_USER_AGENT` in `.env` if running outside Russia and you want hh.ru API to stop returning 403. Habr Career works from any IP regardless. |
| **Optional** | Playwright (already a transitive dep of career-ops) for the e2e test suite. |

---

## What you get — by page

| Page             | What it does                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Дашборд**      | Aggregated counts (apps / pipeline / reports), avg score, status breakdown, latest 5 apps + latest report.         |
| **Поиск**        | **Two scanners:** 🌍 EN scan (Greenhouse/Ashby/Lever, 24+ verified company boards) + 🇷🇺 RU scan (hh.ru API + Habr Career HTML scraping). Live SSE log streaming + clickable results table with location / Remote-Hybrid badge / relocation flag / salary / source filters. |
| **Pipeline**     | CRUD on `data/pipeline.md`. Jump straight from a URL to evaluate.                                                  |
| **Оценить**      | Paste JD → if `GEMINI_API_KEY` is set, runs `gemini-eval.mjs`; otherwise returns a ready-to-paste prompt for Claude. Save JD to `jds/` optional. |
| **Deep research**| Generates the full `modes/deep.md` prompt for the named company / role.                                            |
| **Apply helper** | Generates a submission checklist; the actual Playwright form-fill stays in `/career-ops apply` inside Claude Code. |
| **Трекер**       | Filterable table over `data/applications.md` (status, score, free-text). One-click `node normalize-statuses.mjs` / `dedup-tracker.mjs` / `merge-tracker.mjs`. |
| **Отчёты**       | Browse and read every report under `reports/` with parsed header (Score / Legitimacy / URL).                       |
| **CV**           | Live markdown editor for `cv.md` with side-by-side preview + one-click `cv-sync-check.mjs`.                        |
| **Профиль**      | Read-only view of `config/profile.yml` + archetypes — UI-friendly summary.                                         |
| **Health**       | All setup checks in OK / OPTIONAL / FAIL badges + buttons to run `doctor.mjs` and `verify-pipeline.mjs`.           |

Global keyboard shortcuts:

- `Ctrl+K` / `Cmd+K` — focus the global search.
- Pasting a URL into global search auto-adds it to the pipeline.
- `Esc` — close any open modal.

---

## The scanners

This is the killer feature: zero-token portal scanning that actually returns vacancies.

### 🌍 EN scan — `/api/stream/scan-en`

Hits the public boards-api of Greenhouse, Ashby, and Lever for every company in `portals.yml` that has either an `api:` field set or a `careers_url` matching one of the three ATS URL patterns. Pre-bundled list of 24 verified backend-friendly companies covers ~3000 jobs per run:

| ATS | Companies |
| --- | --- |
| Greenhouse | Stripe, GitLab, Vercel, Cloudflare, Datadog, Discord, Elastic, Grafana Labs, CockroachDB, Fastly, Twilio, Coinbase, Reddit, Robinhood, Affirm, Lyft |
| Ashby | Linear, Supabase, PostHog, Ramp, Modal Labs, Railway, Browserbase |
| Lever | JetBrains |

Each job is normalized to `{ id, title, company, url, location, isRemote, workplaceType, relocates, salary, source, date }`, filtered against the `title_filter.positive` and `title_filter.negative` lists from `portals.yml`, deduped against `data/scan-history.tsv` + `data/pipeline.md` + `data/applications.md`, then appended to `data/pipeline.md` for downstream `/career-ops pipeline` processing. The full result set lands in `data/last-scan.json` so the UI can render the rich filterable table.

### 🇷🇺 RU scan — `/api/stream/scan-ru`

Configured via a `russian_portals:` section in `portals.yml`:

```yaml
russian_portals:
  sources: ["hh", "habr"]   # one or both
  area: 113                  # 1=Moscow, 2=SPb, 113=Russia, 1001=remote
  per_page: 50
  only_remote: false
  queries:
    - "Senior PHP"
    - "PHP Symfony"
    - "Senior Go"
    - "Тимлид PHP"
    # …
```

- **hh.ru** uses the [public API](https://github.com/hhru/api). It returns 403 from non-Russian IP ranges; if you're outside RU, either register an app at [dev.hh.ru/admin](https://dev.hh.ru/admin) and put its UA into `HH_USER_AGENT`, or run from a Russian IP, or just rely on Habr.
- **Habr Career** scrapes [career.habr.com/vacancies](https://career.habr.com/vacancies) HTML — works from any IP, no auth, ~70 hits per multi-query run.
- Repeated 403s from one source are coalesced to a single summary line and the source is disabled for the rest of the run (no log spam).

Same normalization, dedup, and `last-scan.json` flow as the EN scanner.

---

## Architecture

```
career-ops-ui/
├─ bin/start.sh              # one-shot launcher (Node check → npm install → server → open browser)
├─ package.json              # 2 runtime deps: express, js-yaml
├─ server/
│  ├─ index.mjs              # Express app, 30+ routes, SSE streaming (createApp() exported for tests)
│  └─ lib/
│     ├─ paths.mjs           # absolute paths to career-ops files (CAREER_OPS_ROOT aware)
│     ├─ parsers.mjs         # markdown / pipeline / report parsers (pure functions)
│     ├─ runner.mjs          # runNodeScript() + streamNodeScript() (SSE wrapper)
│     ├─ en-scanner.mjs      # in-process Greenhouse/Ashby/Lever orchestrator
│     ├─ ru-scanner.mjs      # in-process hh.ru + Habr orchestrator
│     └─ sources/
│        ├─ greenhouse.mjs   # boards-api.greenhouse.io client
│        ├─ ashby.mjs        # api.ashbyhq.com client
│        ├─ lever.mjs        # api.lever.co client
│        ├─ hh.mjs           # api.hh.ru client (UA-aware)
│        └─ habr.mjs         # career.habr.com HTML parser (no cheerio, regex only)
├─ public/                   # static SPA — no build step
│  ├─ index.html
│  ├─ css/app.css            # design tokens (Airbnb-inspired)
│  └─ js/
│     ├─ api.js              # fetch wrapper + connection-banner state + UI helpers
│     ├─ router.js           # hash-based router
│     ├─ app.js              # boot + global keyboard handlers
│     └─ views/              # one file per page (dashboard, scan, pipeline, evaluate, deep, apply, tracker, reports, cv, settings, health)
└─ tests/
   ├─ parsers.test.mjs       # 18 unit tests for parsers (pure functions)
   ├─ api.test.mjs           # 22 integration tests against ephemeral server
   ├─ ru-scanner.test.mjs    # 9 unit tests, mocked fetch
   ├─ en-scanner.test.mjs    # 9 unit tests, mocked fetch
   └─ e2e.mjs                # 11 routes + 4 functional flows (Playwright headless)
```

### Why no build step?

Vanilla HTML/CSS/JS keeps the surface area tiny: one `npm install` of two deps and you're running. No Webpack, no Vite, no `node_modules` of doom. The whole UI is < 30 KB minified. If you want hot-reload during development, `npm run dev` uses Node's built-in `--watch`.

---

## API reference

All endpoints under `/api/*`. JSON in / JSON out unless noted.

### Health & dashboard

| Method | Path                     | Response                                                                    |
| ------ | ------------------------ | --------------------------------------------------------------------------- |
| GET    | `/api/health`            | `{ ok, warnings, version, checks: [{name, ok, required, value?}] }`         |
| GET    | `/api/dashboard`         | `{ counts, avgScore, byStatus, recent, pipeline, lastReport }`              |

### Data files

| Method | Path                     | Purpose                                                                     |
| ------ | ------------------------ | --------------------------------------------------------------------------- |
| GET    | `/api/tracker`           | `{ rows: [parsed applications.md] }`                                        |
| GET    | `/api/pipeline`          | `{ urls: [...] }`                                                           |
| POST   | `/api/pipeline`          | body `{ url }` → adds to `data/pipeline.md` with dedup                      |
| DELETE | `/api/pipeline?url=…`    | removes a URL                                                               |
| GET    | `/api/reports`           | parsed list of `reports/*.md`                                               |
| GET    | `/api/reports/:slug`     | full markdown + parsed header                                               |
| GET    | `/api/jds`               | list of saved JD files                                                      |
| POST   | `/api/jds`               | body `{ text, slug? }` → saves to `jds/`                                    |
| GET    | `/api/cv`                | `{ markdown }`                                                              |
| PUT    | `/api/cv`                | body `{ markdown }` → writes `cv.md`                                        |
| GET    | `/api/profile`           | `{ profile: yaml-parsed, raw: text }`                                       |
| GET    | `/api/portals`           | `{ portals: yaml-parsed, raw: text }`                                       |
| GET    | `/api/modes`             | list of mode files                                                          |
| GET    | `/api/modes/:name`       | text/plain — raw mode prompt                                                |

### Script runners (one-shot)

| Method | Path                    | Wraps                       |
| ------ | ----------------------- | --------------------------- |
| POST   | `/api/run/doctor`       | `node doctor.mjs`           |
| POST   | `/api/run/verify`       | `node verify-pipeline.mjs`  |
| POST   | `/api/run/normalize`    | `node normalize-statuses.mjs` |
| POST   | `/api/run/dedup`        | `node dedup-tracker.mjs`    |
| POST   | `/api/run/merge`        | `node merge-tracker.mjs`    |
| POST   | `/api/run/sync-check`   | `node cv-sync-check.mjs`    |

### Streams (SSE)

| Method | Path                          | Streams                            |
| ------ | ----------------------------- | ---------------------------------- |
| GET    | `/api/stream/scan`            | legacy `node scan.mjs` (subprocess)|
| GET    | `/api/stream/scan-en`         | in-process EN scanner — query: `dryRun=1`, `company=…` |
| GET    | `/api/stream/scan-ru`         | in-process RU scanner — query: `dryRun=1`              |
| GET    | `/api/stream/liveness`        | `node check-liveness.mjs`          |
| GET    | `/api/stream/pdf`             | `node generate-pdf.mjs`            |

SSE event types:

```
event: start    data: { script, args?, writeFiles? }
event: log      data: { stream: "stdout"|"stderr", line: string }
event: done     data: { code, counts?, errors? }
event: error    data: { message }
```

### Smart endpoints

| Method | Path                  | Purpose                                                                |
| ------ | --------------------- | ---------------------------------------------------------------------- |
| POST   | `/api/evaluate`       | body `{ jd, save? }` → Gemini if key set, else manual prompt           |
| POST   | `/api/deep`           | body `{ company, role? }` → deep research prompt                       |
| POST   | `/api/apply-helper`   | body `{ url, jd? }` → application checklist                            |
| GET    | `/api/scan-results`   | `{ en: {when, fresh[], filtered[], errors[]}, ru: { ... } }` — last scan |
| GET    | `/api/scan-ru/config` | effective RU-scanner config (queries, negatives, sources)              |

---

## Tests

```bash
npm test                  # 58 unit/api tests
node tests/e2e.mjs        # 15 Playwright e2e (boots own server)
```

| Suite                    | Tests | What                                                              |
| ------------------------ | ----- | ----------------------------------------------------------------- |
| `parsers.test.mjs`       | 18    | Markdown / pipeline / report parsers (pure functions)             |
| `api.test.mjs`           | 22    | Every endpoint, ephemeral server, no network                      |
| `ru-scanner.test.mjs`    | 9     | hh.ru + Habr clients with mocked `fetch`                          |
| `en-scanner.test.mjs`    | 9     | Greenhouse + Ashby + Lever clients with mocked `fetch`            |
| `e2e.mjs`                | 15    | Playwright headless: 11 routes + 4 flows (URL paste, connection banner kill+restart, real Habr scan, evaluate manual prompt) |
| **Total**                | **73** | **0 fails, 0 flakes**                                            |

Parsers are pure functions (no I/O) — tested against real data fragments from `applications.md`, `pipeline.md`, and `reports/*.md`. API tests boot the Express app on an ephemeral port and exercise every endpoint end-to-end. Scanner tests mock `fetch` so they pass even if hh.ru blocks your IP.

---

## Configuration

Environment variables (read at server start, all optional except where noted):

| Var                | Default            | Purpose                                                          |
| ------------------ | ------------------ | ---------------------------------------------------------------- |
| `PORT`             | `4317`             | Express bind port                                                |
| `HOST`             | `127.0.0.1`        | Express bind host                                                |
| `CAREER_OPS_ROOT`  | `..` from script   | Where to find `cv.md`, `data/`, `portals.yml`, `modes/`, etc.    |
| `GEMINI_API_KEY`   | unset              | Forwarded to `gemini-eval.mjs` for `/api/evaluate`               |
| `HH_USER_AGENT`    | unset              | Override hh.ru User-Agent (helps reduce 403 from non-RU IPs)     |

`portals.yml` extension recognized by this UI (add to your existing file in the parent project):

```yaml
russian_portals:
  sources: ["hh", "habr"]
  area: 113          # hh.ru area id
  per_page: 50
  only_remote: false
  queries: ["Senior PHP", "Тимлид Go", ...]
```

You can also extend any company entry with an explicit `api:` URL. See [`docs/portals-examples.md`](docs/portals-examples.md) (in this repo) for ready-to-paste blocks for 24 verified companies.

---

## Security notes

- Server binds to `127.0.0.1` by default — never exposed to the internet without explicit `HOST=0.0.0.0`.
- All file path inputs from the client are sanitized (`replace(/[^\w\-.]/g, '')`).
- Subprocess invocations use `spawn` with arg arrays — **no shell interpolation, ever**.
- Streaming endpoints kill the child process on client disconnect (no orphaned scanners).
- Write endpoints touch only known career-ops paths: `data/`, `jds/`, `cv.md`, `config/`, `portals.yml`, `output/`. Never anywhere else.
- The connection banner pings `/api/health` every 3 s while disconnected and auto-clears on recovery — no toast spam.

---

## Limitations

The fully LLM-driven modes (`oferta`, `deep`, `contacto`, `apply`, `batch`, `patterns`, `followup`) need an LLM to actually run. The web UI gives you two options:

1. **`gemini-eval.mjs`** for `oferta` (works out of the box if `GEMINI_API_KEY` is set in the parent project's `.env`).
2. **Copy-paste prompt** for everything else — the UI generates a ready prompt formatted for Claude Code / ChatGPT / Gemini Web.

The existing `/career-ops apply` Playwright form-fill flow inside Claude Code remains the only way to truly auto-fill application forms — the UI's *Apply helper* generates a checklist instead.

---

## Contributing

Issues and PRs welcome. Two house rules:

- Run `npm test` before pushing — 73 checks green is the bar.
- Don't modify anything in the parent `career-ops/` project from inside this repo. The whole point is that this is a non-invasive overlay.

---

---

## 🇷🇺 Полное руководство на русском — как развернуть и работать

### Один файл, две команды

**Самый быстрый путь (одна команда, всё с нуля):**

```bash
curl -fsSL https://raw.githubusercontent.com/Fighter90/career-ops-ui/main/bin/setup.sh | bash
```

Эта команда выполняется в текущей папке и делает следующее:

1. Проверяет, что установлен Node.js 18+
2. Клонирует [santifer/career-ops](https://github.com/santifer/career-ops) в `./career-ops/` (родительский проект — пайплайн поиска работы)
3. Клонирует [Fighter90/career-ops-ui](https://github.com/Fighter90/career-ops-ui) в `./career-ops/web-ui/` (этот веб-интерфейс)
4. Прописывает `/web-ui/` в `.gitignore` родительского репо (чтобы родитель не пытался отслеживать UI как поддиректорию)
5. Устанавливает npm-зависимости (express + js-yaml — всего 71 пакет, ~3 секунды)
6. Запускает Express-сервер на `http://127.0.0.1:4317`
7. Открывает страницу в браузере

Через ~5 секунд после запуска вы увидите Дашборд.

**Альтернативно (вручную, если страшно делать `curl | bash`):**

```bash
git clone https://github.com/santifer/career-ops.git
cd career-ops
git clone https://github.com/Fighter90/career-ops-ui.git web-ui
bash web-ui/bin/start.sh
```

### Первый запуск — онбординг

При первом запуске на странице **Health** вы увидите красные `FAIL`-бейджи рядом с обязательными файлами:

- `cv.md` — ваше CV в markdown
- `config/profile.yml` — профиль (имя, email, целевые роли, архетипы)
- `portals.yml` — конфигурация скан-портaлов

Создайте их по шаблонам из родительского проекта (см. [career-ops онбординг](https://github.com/santifer/career-ops#first-run--onboarding)). Минимальный путь:

```bash
cd career-ops
cp config/profile.example.yml config/profile.yml
cp templates/portals.example.yml portals.yml
echo "# Your CV" > cv.md  # потом наполните содержимым
```

После этого на странице **Health** все обязательные чеки станут зелёными `OK`. `GEMINI_API_KEY` остаётся `OPTIONAL` — система работает и без него (просто `Оценить` будет выдавать промпт для копи-пасты вместо автоматической оценки).

### Как пользоваться — пошагово

#### 1. Поиск вакансий (страница Поиск / Scan)

Две кнопки:

- **🌍 EN scan** — обходит публичные API Greenhouse / Ashby / Lever по 24 предустановленным backend-friendly компаниям (Stripe, Cloudflare, GitLab, Vercel, Linear, Supabase, Datadog, …). За один запуск собирает ~3000 вакансий, фильтрует по `title_filter.positive` / `title_filter.negative` из `portals.yml`, дедуплицирует через `data/scan-history.tsv` и добавляет новые URL в `data/pipeline.md`.
- **🇷🇺 RU scan** — ищет в hh.ru API + парсит HTML Habr Career по ключевым словам из секции `russian_portals.queries` в `portals.yml`. hh.ru вне РФ возвращает 403 — это нормально, Habr Career работает с любого IP.

Логи стримятся в реальном времени (через SSE) в чёрную консоль внизу. После завершения появляется **таблица найденных вакансий** с колонками: компания, роль (кликабельная ссылка), локация, тип (Remote/Hybrid badge), reloc, зарплата, источник.

**Фильтры в таблице:**

- `все matching` / `только новые` — показать всё, что прошло фильтр позитивов, или только то, что новое относительно истории.
- Текстовый поиск — по компании, роли, локации.
- Тип — `все` / `только remote` / `hybrid` / `релокация`.
- Источник — `Greenhouse` / `Ashby` / `Lever` / `hh.ru` / `Habr`.
- **Chip-фильтры по стеку** — PHP, Symfony, Laravel, Go, Rust, Node.js, TypeScript, Python, Ruby, Java, C#/.NET, C++, Backend, Frontend, Fullstack, Microservices, High-load, Distributed, DevOps/SRE, Data, ML/AI, Mobile, Security, Database, Cloud, API.
- **Chip-фильтры по уровню** — Lead/Tech Lead, Architect, Manager, Principal/Staff, Senior, Middle, Junior.

Множественный выбор внутри категории работает как **OR**, между категориями — как **AND**. Рядом с каждым chip'ом — счётчик. Кнопка `сбросить` появляется при активных фильтрах.

#### 2. Pipeline

Очередь URL вакансий, ожидающих оценки. Можно добавлять вручную (поле + кнопка `+ Добавить`), удалять (✕), или открывать прямо в браузере (клик по URL). Из строки можно прыгнуть на `Оценить` с предзаполненным URL.

#### 3. Оценить вакансию

Вставляешь полный текст JD (минимум 50 символов) → кнопка `▶ Оценить`:

- Если в `.env` родительского проекта задан `GEMINI_API_KEY` — запускает `node gemini-eval.mjs --file <tmp>` и показывает полный A–G отчёт (Role Summary, CV Match, Risks, Compensation, Strategy, Verdict, Posting Legitimacy).
- Иначе — возвращает готовый промпт, который можно скопировать в Claude Code / ChatGPT / Gemini Web. Промпт уже содержит ссылки на `cv.md`, `config/profile.yml`, `modes/_shared.md`, `modes/oferta.md`.

Чекбокс «Сохранить JD в jds/» сохраняет вакансию в `jds/jd-YYYY-MM-DD-{ts}.txt`.

#### 4. Deep research

Вводишь название компании (опционально — конкретную роль) → получаешь полный промпт по структуре `modes/deep.md`: company snapshot, engineering culture, recent news, Glassdoor sentiment, interview process intel, negotiation leverage, smart questions для рекрутера. Промпт нужно вставить в Claude Code (там есть WebFetch / WebSearch).

#### 5. Apply helper

Вводишь URL вакансии (и опционально JD) → получаешь чек-лист подачи: проверить liveness постинга, актуальность CV, подготовить STAR+R истории, ответы на EEO/sponsorship-вопросы, сохранить интервью-prep. Реальное автозаполнение форм через Playwright живёт в `/career-ops apply` внутри Claude Code.

#### 6. Трекер заявок

Таблица из `data/applications.md`. Фильтры по статусу (Evaluated / Applied / Interview / Offer / Rejected / SKIP), по диапазону score (≥4.0 / ≥3.0 / <3.0), free-text по компании и роли. Кнопки в шапке:

- **Normalize** — `node normalize-statuses.mjs` (приводит статусы к canonical форме из `templates/states.yml`)
- **Dedup** — `node dedup-tracker.mjs` (убирает дубли company+role)
- **Merge TSV** — `node merge-tracker.mjs` (мержит TSV-файлы из `batch/tracker-additions/`)

Вывод каждого скрипта показывается в модальном окне.

#### 7. Отчёты

Карточки всех файлов в `reports/`. Клик по карточке — открывает полный markdown-отчёт с распарсенным заголовком (Score, Date, Archetype, URL, Legitimacy, PDF status). Markdown рендерится встроенным renderer (без внешних зависимостей) — поддерживает заголовки, таблицы, списки, code blocks, blockquote, ссылки.

#### 8. CV

Live-редактор `cv.md` с side-by-side preview. Кнопка `💾 Сохранить` пишет в `cv.md`. Кнопка `sync-check` запускает `node cv-sync-check.mjs` — проверяет, что метрики в отчётах согласованы с CV.

#### 9. Профиль

Read-only вьюха `config/profile.yml` — имя, email, локация, LinkedIn, целевые роли, архетипы (с описанием). Если хотите редактировать — открывайте `config/profile.yml` напрямую в редакторе.

#### 10. Health

Все setup-проверки в badge'ах **OK** (зелёный) / **OPTIONAL** (янтарный) / **FAIL** (красный). Кнопки запуска `node doctor.mjs` и `node verify-pipeline.mjs` с выводом в модалку.

### Переключение языков

В нижней части сайдбара — 8 кнопок: `English`, `Español`, `Português`, `한국어`, `日本語`, `Русский`, `简体中文`, `繁體中文`. Активный язык подсвечивается чёрным. Выбор сохраняется в `localStorage` — переживает перезагрузку. По умолчанию язык определяется из `navigator.language` браузера.

При смене языка все `data-i18n`-элементы (nav, top bar, banners) перерисовываются мгновенно, активный view также перерендеривается.

### Глобальные горячие клавиши

- `Ctrl+K` / `Cmd+K` — фокус на глобальный поиск (вверху страницы). Если вставить туда URL и нажать Enter — он автоматически добавится в Pipeline.
- `Esc` — закрыть открытое модальное окно.

### Connection-banner

Если сервер падает (например, вы убили процесс) — наверху страницы появляется коралловый баннер «Сервер не отвечает» с кнопкой `Обновить`. Клиент пингует `/api/health` каждые 3 секунды и автоматически убирает баннер + показывает зелёный toast «Соединение восстановлено», когда сервер снова отвечает.

### Обновление до свежей версии

Из директории, где запускали `setup.sh`:

```bash
bash career-ops/web-ui/bin/setup.sh
```

Скрипт идемпотентный — увидит, что репо уже клонированы, сделает `git fetch && git pull --ff-only` для обоих, не тронет ваши данные (cv.md, applications.md, reports/, и т.д.) и поднимет сервер.

### Кастомизация портaлов

В `portals.yml` родительского проекта можно:

**Добавить новые компании с API** (Greenhouse / Ashby / Lever):

```yaml
tracked_companies:
  - name: My Company
    careers_url: https://mycompany.com/careers
    api: https://boards-api.greenhouse.io/v1/boards/mycompany/jobs
    scan_method: greenhouse
    notes: "Internal note"
    enabled: true
```

Готовый список 24+ проверенных компаний с рабочими slug'ами — в [`docs/portals-examples.md`](docs/portals-examples.md).

**Настроить русскоязычный поиск** (для RU scan):

```yaml
russian_portals:
  sources: ["hh", "habr"]   # один или оба источника
  area: 113                  # 1=Москва, 2=СПб, 113=Россия, 1001=удалённая работа
  per_page: 50
  only_remote: false         # true → только "Можно удалённо"
  queries:
    - "Senior PHP"
    - "Тимлид Go"
    - "Backend Senior"
    # … добавьте свои ключевые слова
```

### Что НЕ делает этот UI (limitations)

- **Не отправляет заявки автоматически.** Apply helper выдаёт чек-лист; Playwright-автозаполнение остаётся в `/career-ops apply` внутри Claude Code.
- **Не запускает LLM-режимы (oferta / deep / contacto / batch / patterns / followup) полностью.** Для них нужен LLM. UI генерирует ready-to-paste промпты для Claude.
- **Не модифицирует ничего внутри `career-ops/` за пределами разрешённых путей** (`data/`, `jds/`, `cv.md`, `config/`, `portals.yml`, `output/`). Никаких сюрпризов с перезаписью ваших настроек.

### Безопасность

- Сервер биндится на `127.0.0.1` по умолчанию — никогда не выставляется в интернет без явного `HOST=0.0.0.0`.
- Пути из клиента санитизируются (`replace(/[^\w\-.]/g, '')`).
- Все subprocess-вызовы используют `spawn` с массивом аргументов — **никакой shell-интерполяции**.
- Streaming-эндпоинты убивают child-процесс при disconnect клиента.

### Как остановить и удалить

Остановить сервер: `Ctrl+C` в окне с процессом, или `lsof -ti:4317 | xargs kill`.

Полностью удалить (вместе с вашими данными): `rm -rf career-ops`. Если хотите сохранить тренировочные данные — сначала забэкапьте `career-ops/cv.md`, `career-ops/data/`, `career-ops/reports/`, `career-ops/interview-prep/`.

---

## License

MIT. See [LICENSE](LICENSE).

Built on top of [career-ops](https://github.com/santifer/career-ops) by [santifer](https://santifer.io). Thanks for the brilliant pipeline.
