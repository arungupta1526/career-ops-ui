# Справка — career-ops-ui

Полный обзор каждой страницы — от первого запуска до подготовки к
интервью. Каждый `##` заголовок ниже соответствует пункту бокового
меню или фазе рабочего процесса. При первом запуске читайте сверху
вниз; позже переходите к нужному разделу через TOC в боковой панели
справки.

> **Для кого:** для тех, кто только что положил этот UI внутрь
> `career-ops` checkout и запустил `bash bin/start.sh`. Знание
> career-ops не предполагается.

---

## 1. Быстрый старт (5 минут с нуля)

Полный цикл за пять минут:

1. **Health** (`#/health`) — убедитесь, что все required-чеки зелёные.
   Если `cv.md`, `config/profile.yml` или `portals.yml` отсутствуют,
   страница точно скажет, какой файл нужно создать.
2. **App settings** (`#/config`) — вставьте `ANTHROPIC_API_KEY` и
   (опционально) `GEMINI_API_KEY`. Нажмите **Save**. Ключи пишутся
   в `.env` родительского проекта, поэтому скрипты career-ops тоже
   их подхватят.
3. **Profile** (`#/profile`) — откройте `config/profile.yml` и
   замените шаблонное имя (`Jane Smith`) на ваше настоящее.
4. **CV** (`#/cv`) — вставьте или загрузите резюме. Нажмите
   **💾 Save** — серверный sanitizer уберёт `<script>`, ссылки
   `javascript:` и `on*=` обработчики перед записью.
5. **Scan** (`#/scan`) — нажмите **🌐 Scan** для обхода всех
   включённых источников (Greenhouse / Ashby / Lever для EN,
   hh.ru / Habr Career для RU). SSE-лог стримится в реальном времени.
6. **Pipeline** (`#/pipeline`) — просмотрите URL, добавленные
   сканером. Кликните любую запись, чтобы получить превью JD справа.
7. **Evaluate** (`#/evaluate`) — вставьте JD (или нажмите
   **▶ Evaluate** в pipeline). С Anthropic / Gemini ключом модель
   оценит JD 0–5 против вашего CV, результат уйдёт в `reports/`.
8. **Tracker** (`#/tracker`) — каждая оценка получает строку.
9. **Apply checklist** (`#/apply`) — генерирует чек-лист подачи.
10. **Deep research** (`#/deep`) — когда решите подаваться, запустите
    бриф по компании. Сохраняется в `interview-prep/`.

---

## 2. Настройки приложения и API-ключи (`#/config`)

Редактируйте `.env` родительского проекта прямо из браузера. Это тот
же файл, который читают Node-скрипты career-ops при старте, поэтому
сохранение здесь распространяется и на `gemini-eval.mjs`, и на
`process.env` живого сервера.

### Распознаваемые ключи

| Ключ | Что делает | Где взять |
|---|---|---|
| `ANTHROPIC_API_KEY` | Включает live-вызовы Anthropic SDK. Предпочтителен при наличии обоих ключей — лучше структурный длинный output для оценки JD и deep research. | <https://console.anthropic.com/settings/keys> |
| `ANTHROPIC_MODEL` | Переопределяет дефолтный `claude-sonnet-4-6`. Используйте `claude-opus-4-7` для сложных задач, `claude-haiku-4-5-20251001` для быстрого/дешёвого. | — |
| `GEMINI_API_KEY` | Fallback при отсутствии Anthropic. Используется `gemini-eval.mjs` для `oferta` mode. Free tier работает для малого объёма. | <https://aistudio.google.com/apikey> |
| `GEMINI_MODEL` | Переопределение Gemini-модели. | — |
| `HH_USER_AGENT` | Нужен для скана `hh.ru` из-за пределов России (API возвращает 403 на обычные UA). Зарегистрируйте app на <https://dev.hh.ru/admin> и используйте его UA. | dev.hh.ru |
| `PORT` | Порт Express. По умолчанию 4317. | — |
| `HOST` | Bind-адрес. По умолчанию `127.0.0.1`. `0.0.0.0` открывает UI в LAN — **auth-gate'а нет**, см. Production-readiness doc. | — |

### Поведение

- **Чтение** (`GET /api/config`) возвращает все известные ключи.
  Секретные (`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`) **маскируются** —
  вы видите `sk-ant•••••••a1b2`, но никогда полное значение.
- **Сохранение** (`POST /api/config`) валидирует каждое значение,
  пишет в `<parent>/.env` и сразу применяет к запущенному процессу.
  Перезапуск не нужен.
- **Пустое значение удаляет** ключ.

### Smoke-test кнопки

После сохранения нажмите **▶ Test Anthropic** или **▶ Test Gemini** —
обе шлют крошечный prompt (≤256 output-токенов), почти бесплатно
проверяя что ключ работает. Возвращают ~200-символьный sample.

---

## 3. Profile (`#/profile` — также доступно как `#/settings`)

Read-only view `config/profile.yml`. Редактируйте файл напрямую на
диске; страница перепарсит на reload.

Ключевые поля:

- `candidate.full_name` — используется в каждом prompt.
  **Замените шаблонное `Jane Smith`** перед реальным сканом, иначе
  cover letters уйдут с placeholder-именем.
- `candidate.email`, `linkedin`, `github` — для генерации cover
  letters и apply checklist.
- `target.roles` — приемлемые job titles. Positive-фильтр сканера
  использует это неявно.
- `target.comp_total_min_usd` — минимальный total comp. Секция D
  каждой оценки флагит офферы ниже этого.
- `target.archetypes` — *самое важное поле*. Карьерные паттерны,
  которые вы принимаете (`Tech-Lead-Backend`, `Founding-Engineer`,
  `Data-Platform`). Каждый JD матчится против них, лучший архетип
  попадает в header отчёта.

Health-страница флагит **Profile customized** пока `full_name` равен
известному placeholder.

---

## 4. CV (`#/cv`)

Источник истины для всех оценок, deep research и cover letters.
Хранится в `cv.md` в корне родительского проекта.

### Способы редактирования

- **Вставить напрямую** — textarea слева markdown-редактор. Правая
  панель показывает то, что увидит LLM (и будущий рекрутер).
- **📁 Upload CV** — выберите локальный `.md`, `.txt` или `.html`
  файл. Содержимое заменит textarea; **💾 Save** сохранит.
- **Из LinkedIn** — самый простой путь: откройте Claude Code в
  родительском проекте, запустите `/career-ops`, вставьте
  LinkedIn URL и попросите `extract my CV from this and write it
  to cv.md`.

### Что санитизируется

Серверно, каждый PUT в `/api/cv` проходит через
`stripDangerousMarkdown`:

- `<script>`, `<iframe>`, `<object>`, `<embed>`, `<svg>`, `<style>`,
  `<form>` — удаляются полностью.
- Inline-обработчики (`onclick=`, `onerror=`, и т.д.) — стрипаются.
- `javascript:`, `vbscript:`, `data:text/html` URI — нейтрализуются.

Ответ включает `sanitized: true` если что-то было удалено.

Max body size: 1 MB. Больше — 413.

### Другие кнопки

- **sync-check** — запускает `cv-sync-check.mjs`. Флагит
  несоответствия между CV и tracker.
- **📄 Generate PDF** — стримит `generate-pdf.mjs`. Output идёт в
  `output/*.pdf`. Требует Playwright (Health показывает статус).

### Советы по форматированию

- Один bullet = одно достижение с метрикой.
  *"Reduced p99 latency by 38%"* лучше *"improved performance"*.
- Секции в порядке: **Summary** (3–5 строк), **Experience**
  (reverse-chronological), **Projects** (max 5), **Education**,
  **Skills**.
- Держите < 1500 слов. Scoring rubric использует плотную инфу;
  раскидистый CV получит штраф за шум.

---

## 5. Порталы и источники (`portals.yml`)

Конфиг сканера в `portals.yml`. Три раздела важны:

### `title_filter`

```yaml
title_filter:
  positive: [backend, engineer, senior, tech lead, golang, php]
  negative: [junior, intern, frontend, ios, android, java]
```

Вакансия проходит если её title содержит **хотя бы одно
positive**-слово И **ни одного negative**.

### `tracked_companies`

```yaml
tracked_companies:
  - { name: Stripe,     enabled: true, careers_url: https://job-boards.greenhouse.io/stripe }
  - { name: Linear,     enabled: true, careers_url: https://jobs.ashbyhq.com/linear }
  - { name: JetBrains,  enabled: true, careers_url: https://jobs.lever.co/jetbrains }
```

EN-сканер определяет ATS по URL (`job-boards.greenhouse.io/<slug>` →
Greenhouse) и фетчит публичные boards-api напрямую. Компании без
определимого ATS пропускаются (карточка **Active Companies** на
`/#/scan` показывает их серым `○`).

### `russian_portals`

```yaml
russian_portals:
  sources: [hh, habr]
  area: 113                 # 1=Москва, 2=СПб, 113=Россия, 1001=удалёнка
  per_page: 50
  only_remote: false
  queries:
    - "Senior PHP"
    - "Senior Go"
    - "Тимлид PHP"
```

`queries` — case-insensitive substring matches против titles на
hh.ru и Habr Career. **Осторожно с пересечением с negative** — если
`"Senior PHP"` в queries, а `"php"` в `title_filter.negative`, скан
вернёт ноль и консоль предупредит о конфликте.

### Bootstrap

При первом запуске сервер дописывает блок `russian_portals:` в
`portals.yml` если он отсутствует (idempotent).

---

## 6. Health (`#/health`)

Все setup-проверки в OK / OPTIONAL / FAIL badges. Прочитайте перед
открытием любого "не работает" issue.

### Required (без них система не работает)

- `Node version` ≥ 18.
- `Project root` — `CAREER_OPS_ROOT` существует.
- `cv.md`, `config/profile.yml`, `portals.yml`,
  `data/applications.md`, `data/pipeline.md`, `modes/oferta.md`.

### Optional (только warnings)

- `Profile customized` — `candidate.full_name` не placeholder.
- `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` — заданы в `.env`.
- `HH_USER_AGENT` — нужен только для скана hh.ru вне РФ.
- `Playwright (parent node_modules)` — для PDF-генерации.
- `Parent project dependencies` — `npm install` в родителе.
- `data/`, `reports/`, `output/`, `jds/` — auto-create при первом
  write.

При `HOST=0.0.0.0` абсолютные пути и точная Node-версия скрываются
(`"hidden"`), чтобы не давать fingerprinting.

### Run-кнопки

- **▶ Doctor** — `node doctor.mjs` с outputом в modal.
- **▶ Verify pipeline** — `node verify-pipeline.mjs`.

---

## 7. Scan (`#/scan`)

Сканер обходит все включённые boards, дедуплицирует против истории и
пишет хиты в `data/last-scan.json` и `data/pipeline.md`.

### One-click scan

**🌐 Scan** запускает все источники в одном sweep:

- Greenhouse / Ashby / Lever для каждой компании в
  `tracked_companies` с ATS-URL.
- hh.ru API + Habr Career HTML для каждого query в
  `russian_portals`.

Live SSE log стримит справа. **Stop** (или просто навигация)
прервёт скан.

### Фильтры результатов

- **Free text** — substring match по title / company.
- **Source** — Greenhouse / Ashby / Lever / hh.ru / Habr.
- **Remote / Hybrid / Onsite** dropdown.
- **Stack chips** (PHP / Go / Backend / Senior) — auto-detected из
  title + snippet. Multi-select intersection.
- **Dynamic chips** — top-25 наиболее частых capitalized токенов из
  titles, адаптируется под ваши роли.

### Active Companies card

Раскрывающаяся карточка со списком всех компаний из `portals.yml`:

- ✓ зелёный — direct API support.
- ○ серый — fallback на web-search prompt.

**Клик по имени** → заполняет фильтр результатов выше. **Клик ↗** →
открывает `careers_url` в новой вкладке.

---

## 8. Pipeline (`#/pipeline`)

Inbox URL'ов, ожидающих оценки. Хранится в `data/pipeline.md`.

### Добавление URL

Три способа:

- Введите/вставьте URL + **+ Add**.
- **Ctrl+K** (или **Cmd+K**) фокусирует global search, вставьте
  любой `http(s)://…` link, **Enter** — URL уйдёт в pipeline.
- Run a Scan — свежие хиты идут в pipeline автоматически.

Каждый URL проходит `isValidJobUrl()` серверно. Loopback, `file://`,
`javascript:`, IP-литералы, template-чары — все 400.

### Server-side preview pane

Клик по строке pipeline загружает превью справа. Большинство ATS
не отдают CORS-заголовки, поэтому сервер проксирует, стрипает
`<script>`/`<style>`/HTML-теги и возвращает до 8 KB plain text.

Preview proxy ходит по редиректам **с per-hop SSRF-валидацией** —
каждый `Location` проходит `isValidJobUrl()` ещё раз. Cap: 3 hops,
15 sec timeout.

### Row actions

- **▶** — переходит на `#/evaluate?url=…` с pre-filled URL.
- **✕** — удаляет URL.

### Top-right buttons

- **⚡ Evaluate first** — открывает первый URL на Evaluate.
- **Scan** — обратно к сканеру.

---

## 9. Evaluate (`#/evaluate`)

Оценивает JD против `cv.md` и `config/profile.yml`. Возвращает
структурную A–G оценку по `modes/oferta.md` плюс score 0–5.

### Input

Вставьте JD в textarea, или приходите с `#/pipeline` через
`?url=<href>` — страница фетчит URL через тот же SSRF-safe proxy и
заполняет textarea.

**💾 Save JD** для сохранения в `jds/jd-<date>-<ts>.txt` (audit
trail).

### Цепочка fallback

1. **Anthropic** — preferred при `ANTHROPIC_API_KEY`. Сервер
   bundle'ит `cv.md`, `config/profile.yml`, `modes/_shared.md`,
   `modes/oferta.md` в `<project_context>` блок (каждый файл
   обрезается на 16 KB, prompt soft-cap 200 KB). Возвращает
   grounded markdown прямо на страницу.
2. **Gemini** — при только `GEMINI_API_KEY`. Спавнит
   `gemini-eval.mjs`. Free-tier `gemini-2.0-flash` подходит.
3. **Manual** — без ключа. Страница даёт готовый prompt для
   копирования в Claude Code / ChatGPT / любой другой LLM.

### Output sections

A. **Role Summary** — 3 буллета.
B. **CV Match** — топ 3 совпадения и топ 3 пропуска.
C. **Risks** — 1–3 конкретных риска (комп, размытость роли,
сениорити-дрифт).
D. **Compensation** — относительно `target.comp_total_min_usd`.
E. **Application Strategy** — apply? Yes/No + причина.
F. **Verdict** — финальный 0–5 score с точностью 0.1.
G. **Posting Legitimacy** — флагит red flags (vague компания, нет
salary band, "rockstar/ninja" copy).

### Сохранение report

**💾 Save report** сохраняет markdown в
`reports/<date>-<company>-<role>.md`. Распарсенный header (Score /
Legitimacy / URL) появляется на **Reports** странице и Dashboard.

---

## 10. Reports (`#/reports`)

Просмотр всех сохранённых оценок. Карточки показывают title, дату,
legitimacy флаг и score (зелёный ≥ 4.0, жёлтый ≥ 3.0, красный
ниже).

Клик по карточке открывает полный markdown. Пагинация: 12 на
страницу.

В режиме одного report есть:

- **← All reports** — назад к grid.
- **🔗 Open JD** — открывает оригинальный JD в новой вкладке.

---

## 11. Tracker (`#/tracker`)

CRM. Одна строка = одна заявка. Хранится в `data/applications.md`
как GFM markdown table.

### Status flow

`Evaluated` → `Applied` → `Responded` → `Interview` → `Offer` /
`Rejected` / `Discarded` / `SKIP`.

Whitelist enforced серверно; любой другой статус в `POST /api/tracker`
дефолтится в `Evaluated`.

### Колонки

| Колонка | Что |
|---|---|
| `#` | Auto-numbered, zero-padded (`001`, `002`). |
| `Date` | ISO date. |
| `Company` | Free text. **Pipes (`\|`) и newlines экранируются.** |
| `Role` | То же. |
| `Score` | `N/5`. |
| `Status` | Whitelist enum. |
| `PDF` | ✅ если `generate-pdf.mjs` сработал. |
| `Report` | Markdown link на `reports/*.md`. |
| `Notes` | Free text, max 200 chars. |

### Фильтры

- **Status** dropdown.
- **Score** dropdown — `≥ 4.0`, `≥ 3.0`, `< 3.0`.
- **Search** — substring match.

Любой фильтр сбрасывает paginator на page 1. 25 строк на страницу.

### Maintenance кнопки

- **▶ Normalize** — `normalize-statuses.mjs` (каноникализация
  написания: `applied` → `Applied`).
- **▶ Dedup** — `dedup-tracker.mjs` (case-insensitive дубликаты).
- **▶ Merge** — `merge-tracker.mjs` (импорт из
  `batch/tracker-additions/*.tsv`).

### Добавление строк

`POST /api/tracker` с body `{ company, role, score?, status?, … }`.
Dedup по `(company, role)` case-insensitive. На странице Evaluate
есть "Add to tracker" после успешного score.

---

## 12. Deep research (`#/deep`)

Генерирует структурный бриф компании: snapshot, engineering culture,
recent news, Glassdoor sentiment, interview process, negotiation
leverage points, три умных вопроса для рекрутера.

### Input

Два поля — название компании и (опц.) роль. Шаблон mode
(`modes/deep.md`) задаёт структуру.

### Output paths

Та же fallback chain что и Evaluate:

1. **Anthropic live** (preferred) — `bundleProjectContext` инлайнит
   cv + profile + `_shared.md` + `deep.md`. Output: 10–30 KB
   grounded markdown в `interview-prep/<company>-<role>.md`.
2. **Gemini live** — `gemini-eval.mjs`. То же сохранение.
3. **Manual prompt** — готовый prompt для Claude Code (с WebFetch +
   WebSearch для реального ресёрча).

### Подсказки

- Anthropic на `claude-sonnet-4-6` обычно возвращает ~13 KB
  полезного текста за 1–3 минуты.
- У Anthropic SDK нет встроенного web search. Для свежих новостей +
  Glassdoor sentiment вставьте manual prompt в Claude Code.
- Live-вызовы платные; один Sonnet 4.6 deep-research call ≈
  $0.30–0.50.

---

## 13. Mode prompts (семь страниц `/#/<mode>`)

Семь prompt builders: **Project** идеи, **Training** планы,
**Follow-up** письма, **Batch** оценки, **Outreach** к рекрутерам,
**Interview prep** one-pagers и **Patterns** ретроспективы. Каждая
оборачивает шаблон `modes/<slug>.md`:

| Страница | Slug | Назначение |
|---|---|---|
| `#/project` | `project` | Подгон портфолио-проекта под целевую роль. |
| `#/training` | `training` | Анализ skill-gap → curriculum. |
| `#/followup` | `followup` | Драфт post-interview email. |
| `#/batch` | `batch` | Multi-JD batch evaluation prompt. |
| `#/contacto` | `contacto` | Outreach-сообщение для рекрутера / referral. |
| `#/interview-prep` | `interview-prep` | One-pager prep для конкретного раунда. |
| `#/patterns` | `patterns` | "Какие паттерны сделали меня успешным?" |

### Общая форма

Каждая страница имеет небольшую форму, **▶ Generate prompt** кнопку
(manual) и — при наличии Anthropic/Gemini ключа — **⚡ Run live**
кнопку (primary).

**▶ Generate prompt** возвращает собранный prompt с вашими
form-значениями JSON-ифицированными в `User-supplied context:`
блок, плюс verbatim шаблон `modes/<slug>.md`. Скопируйте в свой LLM.

**⚡ Run live** шлёт тот же prompt в Anthropic (или Gemini), с
`cv.md` + `profile.yml` + `_shared.md` инлайн через
`bundleProjectContext`. Результат рендерится на странице, копируемый,
скачиваемый как `.md`.

Семь страниц — explicit allowlist. Modes с dedicated routes
(`oferta` → Evaluate, `deep` → Deep research) и modes только для
Claude Code (`apply`, `scan`, `pipeline`, `tracker`, `pdf`, `latex`,
`ofertas`, `auto-pipeline`) намеренно не в этом UI.

---

## 14. Apply checklist (`#/apply`)

Когда вы решили подаваться, эта страница Apply helper генерирует
чек-лист подачи. Она **НЕ** автозаполняет формы — этот flow остаётся
в `/career-ops apply` внутри Claude Code, который использует
Playwright в родительском проекте.

Чек-лист покрывает:

0. Запустить `/career-ops apply <url>` в Claude Code (читает форму
   через Playwright).
1. Подтвердить что posting ещё активен (`check-liveness.mjs`).
2. Убедиться что CV актуален (`cv-sync-check.mjs`, потом PDF если
   score ≥ 4.0).
3. Адаптировать cover letter / "Why us?" answer используя STAR+R
   proof points из `cv.md`.
4. Отвечать на EEO / sponsorship / start-date вопросы честно.
5. Сохранить filled answers в
   `interview-prep/{company}-{role}.md` перед submit.
6. **НИКОГДА не auto-submit** — вы (человек) кликаете финальную
   кнопку.
7. После submit: добавить строку в `data/applications.md` (или TSV
   в `batch/tracker-additions/`).

---

## 15. Подготовка к интервью

Это пост-research, пре-interview фаза. Три артефакта в этом
приложении сходятся:

1. **Saved deep-research files** в `interview-prep/`, по одному на
   company-role pair. Браузить через **Deep research** или
   `/api/interview-prep`.
2. **Patterns mode** (`#/patterns`) — генерирует self-reflective
   prompt: "по моим последним N интервью / офферам / отказам, какие
   паттерны держатся?" Полезно когда есть 5+ tracker строк.
3. **Interview-prep mode** (`#/interview-prep`) — pre-fills
   one-pager для конкретного раунда (behavioral / technical / system
   design). Output идёт в ту же `interview-prep/` папку.

### Рекомендуемый workflow

Для каждого интервью:

1. **Re-run Deep** (или открыть сохранённый файл) за день до.
2. **`#/interview-prep`** — сгенерировать one-pager под раунд.
   Вставьте в свои заметки.
3. **System design / coding** — открыть `#/training` и попросить
   30-минутный таргетированный refresher по подсистеме из JD.
4. **Compensation rounds** — открыть deep-research файл, прыгнуть на
   "Negotiation leverage points." Принесите 2–3 data points
   (Glassdoor band, recent funding, сравнимый offer от другой
   компании).
5. **Behavioral rounds** — вытащить STAR+R истории из вашего `cv.md`
   которые попадают в секцию B исходного Evaluate report.

После интервью сразу:

1. Обновить tracker строку: status → `Responded` (потом `Interview`,
   `Offer`).
2. Запустить `#/followup` для драфта thank-you email.
3. Если получили новую инфу (compensation range, состав команды,
   неожиданный tech stack), отредактировать сохранённый
   `interview-prep/<company>-<role>.md` с `## Post-round notes` для
   будущего себя.

---

## 16. Activity log + Troubleshooting

### Activity log (`#/activity`)

Audit trail каждого state-changing запроса к серверу. Записывает:
pipeline-добавления, tracker writes, CV saves, JD saves, evaluate
runs, deep-research runs, scan runs, config changes, mode runs.

Секреты (`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`) редактируются на
входе; вы никогда не увидите real key value в `data/activity.jsonl`.

Фильтр по action prefix (`pipeline.`, `cv.`, `evaluate`, `scan.`).
25 строк на страницу; сервер возвращает до 500 последних событий.

### Troubleshooting

| Симптом | Вероятная причина | Решение |
|---|---|---|
| Health красная на `cv.md` | Первый запуск, файла нет | `touch $CAREER_OPS_ROOT/cv.md` + refresh. |
| Health красная на `Profile customized` | `full_name` всё ещё `Jane Smith` | Edit `config/profile.yml`. |
| `hh.ru: HTTP 403` в scan log | Не-РФ IP, нет `HH_USER_AGENT` | Зарегиться на `dev.hh.ru/admin`, set `HH_USER_AGENT`. |
| `gemini-eval.mjs: ERR_MODULE_NOT_FOUND` | Deps родителя не установлены | `cd $CAREER_OPS_ROOT && npm install`. |
| Generate PDF errors | Playwright не установлен | `cd $CAREER_OPS_ROOT && npx playwright install chromium`. |
| Server `EADDRINUSE: 4317` | Старый instance запущен | `pkill -f 'node server/index.mjs'` + restart. |
| Live LLM call висит > 2 мин | Огромный prompt или Anthropic тормозит | `/api/health` — Anthropic flag; soft-cap 200 KB → 413. |
| Pipeline preview `(unsafe redirect)` | Posting редиректит на private IP / loopback | Это security feature (REVIEW-B1). Target отвергается. |
| Tracker строка ломает таблицу | Pipe в company name pre-v1.9.1 | Update v1.9.1+ — pipes экранируются end-to-end (BF-1). |
| `npm test` падает на fresh clone | Тесты ассамят родительский layout | `CAREER_OPS_ROOT=$(mktemp -d)` + bootstrap фикстуры. |

Для глубокой диагностики: запустите **▶ Doctor** на Health-странице,
скопируйте output, поищите issue на
<https://github.com/Fighter90/career-ops-ui/issues>.
