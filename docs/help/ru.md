# Справка — career-ops-ui

Полный обзор каждой страницы — от первого запуска до подготовки к
интервью. Каждый `##` заголовок ниже соответствует пункту бокового
меню или фазе рабочего процесса. При первом запуске читайте сверху
вниз; позже переходите к нужному разделу через TOC в боковой панели
справки.

> **Для кого:** для тех, кто только что положил этот UI внутрь
> `career-ops` checkout и запустил `bash bin/start.sh`. Знание
> career-ops не предполагается.


### О career-ops

[career-ops](https://career-ops.org) — open-source система поиска работы, которая запускается как slash-команды внутри любого AI CLI (Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot CLI). Модель-агностична. Оценивает каждую вакансию по шестимерной рубрике 0.0–5.0, генерирует подогнанное PDF-резюме и трекает каждую заявку локально.

**Принципы** (из [career-ops.org/docs](https://career-ops.org/docs)):

- **Open source, всерьёз** — MIT, ни платного тира, ни вейтлиста, ни телеметрии, ни аккаунтов.
- **Суверенитет данных** — `cv.md`, `config/profile.yml`, `data/`, `reports/`, `interview-prep/` не покидают вашу машину, если вы их не пушите явно.
- **Подаёт человек** — career-ops пишет ответы и открывает форму, но **Submit нажимаете вы**. Автоподача отсутствует.
- **Структурированный поиск** — для активного поиска, не для рекомендаций.

**Ключевые концепты**

| Концепт | Что это |
|---|---|
| **Mode** | Шаблон промпта в `modes/<slug>.md`. Встроенные: `oferta`, `deep`, `apply`, `pipeline`, `batch`, `contacto`, `followup`, `interview-prep`, `patterns`, `project`, `training`. |
| **Архетип** | Целевая ролевая модель в `config/profile.yml`. Рубрика взвешивает совпадения навыков относительно активного архетипа — **самое важное поле**. |
| **Pipeline** | `data/pipeline.md` — inbox URL-ов, ждущих оценки. |
| **Tracker** | `data/applications.md` — историческая GFM-таблица всех оценок и статусов. |
| **Report** | `reports/<NNN>-<company>-<DATE>.md` — полная A–G оценка JD + score + legitimacy. |
| **Scan history** | `data/scan-history.tsv` — append-only лог, дедупит сканы. |

### career-ops vs career-ops-ui

| | career-ops (CLI) | career-ops-ui (это приложение) |
|---|---|---|
| Где работает | внутри Claude Code / Codex / Cursor / Gemini CLI | `http://127.0.0.1:4317` в браузере |
| Поверхность | `/career-ops <mode>` слэш-команды | сайдбар, одна страница на workflow |
| Заполнение форм | да, через Playwright MCP | нет — генерит чек-лист, заполнение в CLI |
| PDF | `generate-pdf.mjs` | `📄 Generate PDF` на `#/cv`, `#/reports/:slug`, `#/evaluate`, `#/deep`, `#/interview-prep` |
| Файлы данных | общие с career-ops-ui | общие с career-ops |

### Пороги действий по score

| Score | Следующий шаг |
|---|---|
| **≥ 4.5** | `/career-ops apply` — высокий fit, подавайте сразу. |
| **4.0 – 4.4** | Подавайте или `/career-ops contacto` для warm intro. |
| **3.5 – 3.9** | `/career-ops deep` — изучите компанию/роль перед решением. |
| **< 3.5** | Пропустите, если нет персональной причины. |

### Внешние доки

Полная справка по движку career-ops (сканирование, рубрика, batch, apply, Playwright) — на [career-ops.org/docs](https://career-ops.org/docs):

- [What is career-ops](https://career-ops.org/docs/introduction/what-is-career-ops)
- [Scan job portals](https://career-ops.org/docs/introduction/guides/scan-job-portals)
- [Apply for a job](https://career-ops.org/docs/introduction/guides/apply-for-a-job)
- [Batch-evaluate offers](https://career-ops.org/docs/introduction/guides/batch-evaluate-offers)
- [Set up Playwright](https://career-ops.org/docs/introduction/guides/set-up-playwright)

---

## 1. Быстрый старт — пошаговое руководство от «создать CV» до «отклик и сообщение»

Это канонический playbook кнопка-за-кнопкой. Пройдите по порядку
один раз — каждый шаг называет точный маршрут, точную кнопку и что
вы увидите при успехе. Разделы 2–16 ниже — детальное погружение по
каждой фазе.

### A. Установка (один раз, ~5 минут)

**Шаг 1 — Откройте приложение на `http://127.0.0.1:4317`.** Если оно
не запущено, в терминале выполните `bash bin/start.sh` из корня
проекта. Загружается Dashboard (`#/dashboard`).

**Шаг 2 — Кликните `❤ Health` в левом меню.** Все required-чеки
должны быть зелёными:

- `cv.md`, `config/profile.yml`, `portals.yml` существуют
- API-ключ задан (хотя бы один из `ANTHROPIC_API_KEY` / `GEMINI_API_KEY`)
- Playwright установлен (нужен только для Generate PDF)

Если что-то красное — страница точно скажет, какой файл или
env-переменную надо исправить. Не идите дальше пока Health не
зелёный.

**Шаг 3 — Кликните `⚒ App settings` в меню.** Открывается вкладка
**API keys & runtime**.

- Вставьте `ANTHROPIC_API_KEY` (предпочтительный — лучшая структурная
  оценка) и/или `GEMINI_API_KEY`. Получите ключ на
  <https://console.anthropic.com/settings/keys> или
  <https://aistudio.google.com/apikey>.
- Нажмите **💾 Save**. Затем **▶ Test Anthropic** (или Gemini) —
  крошечный round-trip подтверждает, что ключ работает.

**Шаг 4 — Переключитесь на вкладку `Profile` на той же странице.**
Это прямой YAML-редактор `config/profile.yml`. Минимум, что нужно
отредактировать:

- `candidate.full_name` — заменить любое placeholder-имя на ваше
- `candidate.email`, `linkedin`, `github` — для cover letters
- `target.roles` — должности, на которые вы откликаетесь
- `target.comp_total_min_usd` — минимальная total comp
- `target.archetypes` — карьерные паттерны (самое важное поле)

Нажмите **💾 Save**. Сервер валидирует YAML и проставляет канонический
заголовок `# Career-Ops Profile Configuration`.

### B. CV (один раз, ~10 минут)

**Шаг 5 — Кликните `✎ CV` в меню.** Две колонки: редактор слева,
live preview справа.

**Шаг 6 — Выберите один из путей заполнения редактора:**

- **Загрузить существующее резюме** — нажмите **📁 Upload CV**, выберите
  любой из `.docx / .doc / .odt / .rtf / .pdf / .html / .txt / .md`.
  Сервер сконвертирует в markdown через pandoc или pdftotext,
  очистит XSS, и положит результат в редактор. **Проверьте конверсию** —
  PDF особенно может потерять часть форматирования.
- **Вставить markdown напрямую** — textarea это markdown-редактор;
  правая панель показывает то, что увидит LLM (и будущий рекрутер).
- **Тон:** один буллет = одно достижение с метрикой. До 1500 слов.
  Порядок секций: Summary, Experience, Projects, Education, Skills.

**Шаг 7 — Нажмите `💾 Save` (top-right на CV).** Сервер
санитизирует и пишет `cv.md`. Toast: *«Saved»*.

**Шаг 8 (опционально) — Нажмите `📄 Generate PDF`.** Запускает
`generate-pdf.mjs` (нужен Playwright) и **новый PDF автоматически
скачается** в браузер. Список внизу страницы хранит все
предыдущие файлы.

### C. Найти вакансии (~2 минуты на скан)

**Шаг 9 — Кликните `🌐 Scan` в меню.** Убедитесь что `portals.yml`
содержит нужные источники (раздел 5). Нажмите **🌐 Scan now**.
SSE-лог стримится пока сканер обходит Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday
(EN-источники) и hh.ru / Habr Career (RU-источники если включены).

**Шаг 10 — Когда скан закончился, просмотрите результаты.**
Кликните любой тег компании чтобы фильтровать; кликните иконку ↗
чтобы открыть карьерную страницу в новой вкладке. Каждая вакансия,
прошедшая title-фильтр, добавлена в Pipeline.

### D. Оценить офферы (~30 секунд на JD)

**Шаг 11 — Кликните `Pipeline` в меню.** Видите все URL, добавленные
сканером. Кликните запись для inline-preview JD.

**Шаг 12 — Нажмите `▶ Evaluate` рядом с любым JD.** Перенесёт на
`#/evaluate`. С API-ключом запускается live; без ключа получите
manual prompt для копирования в свой LLM. Live-режим выдаёт
**оценку 0–5** против вашего CV по секциям A–G (Role / Company /
Compensation / Risk / Stretch / Cultural fit / Verdict). Save идёт
в `reports/<date>-<slug>.md`.

**Шаг 13 — Кликните `Reports` в меню** и просмотрите свежую оценку.
Что ниже `comp_total_min_usd` — флагится красным в секции D. Что
с `Verdict: pursue` — ваш short-list.

### E. Решить и глубоко исследовать выбранную компанию (~3 минуты)

**Шаг 14 — Выберите вакансию для отклика. Кликните `Deep research`
в меню.** Введите название компании и должность. Модель выдаёт
7-секционный бриф по компании (миссия, недавние новости, tech-stack,
hiring-сигналы, comp-бенчмарки, риски, рекомендуемый угол подхода).
Save идёт в `interview-prep/<company>-<role>.md`.

### F. Отклик (~5 минут на отклик)

**Шаг 15 — Кликните `Apply checklist` в меню.** Вставьте URL
вакансии + JD. Хелпер генерирует пошаговый чек-лист подачи:

- Cover-letter draft (используется ваш `cv.md` + `profile.yml`)
- Конкретные ключевые слова из JD
- Файлы для прикрепления (CV PDF — см. шаг 8)
- Куда отправлять (канонический careers URL, не агрегатор)
- Напоминание: **НИКОГДА не auto-submit** — финальный review всегда
  ручной.

**Шаг 16 — Откройте careers-страницу в новой вкладке.** Используйте
apply-checklist как todo-лист. Подайтесь через настоящую форму
компании. Прикрепите PDF, сгенерированный на шаге 8.

**Шаг 17 — Напишите реальному человеку.** Откройте режим **Outreach**
(`#/contacto` в меню). Модель составит короткое LinkedIn / email
сообщение, заточенное под бриф из шага 14. Персонализируйте
opener (одна конкретная деталь из deep-research). Отправьте.

### G. Трекинг и follow-up (постоянно)

**Шаг 18 — Кликните `Tracker` в меню** и добавьте строку для
заявки: компания, роль, score, статус `Applied`, ссылка на отчёт,
ссылка на deep-research бриф. Дата проставится автоматически.

**Шаг 19 — Через неделю: откройте режим `Follow-up`** (`#/followup`).
Драфт вежливого check-in письма со ссылкой на изначальную заявку.
Отправьте. Обновите статус в Tracker до `Followed up`.

**Шаг 20 — Когда позовут на интервью, запустите режим
`Interview prep`** (`#/interview-prep`). Генерирует таргетированную
подготовку под конкретную компанию + стадию (system design /
behavioral / coding). Тянет данные из deep-research брифа автоматом.

**Шаг 21 — Получили оффер? Обновите статус в Tracker до `Offer`**
и пересмотрите comp-секцию вашего отчёта — минимальная цифра уже
там.

### TL;DR — порядок sidebar совпадает с workflow

`Health → App settings → Profile → CV → Scan → Pipeline → Evaluate
→ Reports → Deep research → Apply checklist → Outreach → Tracker
→ Follow-up → Interview prep → Activity log`

21 шаг, кнопка-за-кнопкой, от нуля до оффера.

---

## 2. Настройки приложения и API-ключи (`#/config`)

Две вкладки:

1. **API keys & runtime** — редактирование `.env` родительского
   проекта (тот же файл, что читают Node-скрипты career-ops).
2. **Profile** — прямой YAML-редактор `config/profile.yml`. Save
   проставляет канонический заголовок
   `# Career-Ops Profile Configuration`.

Сохранение в любой вкладке применяется мгновенно — рестарт не нужен.

### Вкладка Profile

- Textarea показывает текущий `config/profile.yml` дословно.
- Отредактируйте и нажмите **💾 Save**. Сервер валидирует YAML
  (должен быть mapping и содержать `candidate`) и пишет файл.
- Заголовок `# Career-Ops Profile Configuration` добавляется
  автоматически если его нет.
- Read-only сводка на `#/profile` — визуальный компаньон.

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

Read-only сводка-карточка `config/profile.yml`. **Чтобы редактировать**,
перейдите в **App settings → вкладка Profile** (`#/config` → Profile).
Save пишет в тот же файл; эта страница перепарсит на reload.

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
- **📁 Upload CV** — выберите локальный файл в любом из этих
  форматов, сервер сам сконвертирует его в markdown:
  - **Текстовые** — `.md`, `.markdown`, `.txt`, `.html`, `.htm`
    (HTML идёт через pandoc → GFM markdown).
  - **Office** — `.docx`, `.doc`, `.odt`, `.rtf` через **pandoc**
    (`brew install pandoc` / `apt install pandoc`).
  - **PDF** — `.pdf` через **pdftotext** из Poppler
    (`brew install poppler` / `apt install poppler-utils`).
  - Сконвертированный markdown появляется в редакторе; нажмите
    **💾 Save** чтобы сохранить. Результат санитизируется
    (тот же XSS-страйп, что и для paste).
  - Лимит: **10 MB** на загрузку. Больше — 413.
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
  По окончании генерации **самый свежий** PDF автоматически
  скачивается в Downloads; список на странице сохраняет все ранее
  сгенерированные файлы.

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
  seniority_boost: [Senior, Staff, Lead, Principal]
```

Вакансия проходит если её title содержит **хотя бы одно
positive**-слово И **ни одного negative**.


`seniority_boost` — третий ключ title-filter. Слова из этого списка ничего не фильтруют — они поднимают совпавшие вакансии выше в результатах, чтобы "Senior Backend Engineer" оказывался над "Engineer". По умолчанию: `["Senior", "Staff", "Lead"]`. Подстрой под то, как именуются твои целевые роли.

### `search_queries`

```yaml
search_queries:
  - name: "Greenhouse — Rails Engineer"
    query: 'site:job-boards.greenhouse.io "Rails Engineer" OR "Ruby on Rails" remote'
    enabled: true
  - name: "Ashby — Senior Backend"
    query: 'site:jobs.ashbyhq.com "Senior Backend" remote'
    enabled: false
```

`search_queries` запускает AI-powered Option B-скан (`/career-ops scan` внутри Claude Code / Codex). НЕ запускается in-process `npm run scan` (который только бьёт по публичным boards-API). Используй для поиска ролей в компаниях, которых ещё нет в `tracked_companies`. `enabled: false` сохраняет запись без запуска.

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


### CLI-флоу ([career-ops.org/docs/.../scan-job-portals](https://career-ops.org/docs/introduction/guides/scan-job-portals))

Канонический career-ops setup (запустите из родителя один раз):

```bash
cp templates/portals.example.yml portals.yml
$EDITOR portals.yml
```

`portals.yml` имеет три секции; канонический career-ops.org schema совпадает с тремя SPA-секциями выше 1:1:

- **title_filter** — списки ключевых слов `positive`, `negative`, `seniority_boost` (case-insensitive). Вакансия должна иметь ≥ 1 матч `positive` и ноль `negative`. `seniority_boost` поднимает ранг без фильтрации. Начните с 3–5 положительных слов для ясности.
- **tracked_companies** — каждая запись ОБЯЗАНА иметь `name` и `careers_url`. Опционально: `api` (endpoint Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday), `enabled: true|false` для включения/исключения без удаления.
- **search_queries** — встроенные более широкие веб-поиски (LinkedIn / Indeed). Дефолты работают для большинства.

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

- Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday для каждой компании в
  `tracked_companies` с ATS-URL.
- hh.ru API + Habr Career HTML для каждого query в
  `russian_portals`.

Live SSE log стримит справа. **Stop** (или просто навигация)
прервёт скан.

### Фильтры результатов

- **Free text** — substring match по title / company.
- **Source** — Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday / hh.ru / Habr.
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


### CLI-флоу сканирования ([career-ops.org/docs/.../scan-job-portals](https://career-ops.org/docs/introduction/guides/scan-job-portals))

Два способа сканирования из CLI (оба пишут в тот же `data/pipeline.md`, который читает SPA):

**Option A — direct script (~30 с, ноль AI-токенов):**

```bash
npm run scan                          # все доски Greenhouse/Ashby/Lever
npm run scan -- --dry-run             # превью без записи
npm run scan -- --company Anthropic   # одна компания
```

Работает только для Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday (распознаваемые ATS URL).

**Option B — AI-powered browser scan:**

```
/career-ops scan
```

Внутри Claude Code / Codex / Cursor / Gemini CLI. Использует токены модели. Заходит на каждую страницу `tracked_companies` напрямую, умеет находить не-API доски (career-страницы, кастомный ATS, региональные порталы). Медленнее, но шире.

**Output (оба пути)** — новые JD URL добавляются в `data/pipeline.md`, каждый посещённый URL пишется в `data/scan-history.tsv` (дедуп через все будущие сканы), печатается summary: companies scanned · jobs found · filtered by title · duplicates skipped · new offers added.

**Пороги действий по score** (применяйте после `/career-ops pipeline`, который batch-оценивает новые URL):

| Score | Рекомендуемый следующий шаг |
|---|---|
| **≥ 4.5** | `/career-ops apply` — высокий fit, подавайте сразу |
| **4.0 – 4.4** | подача или `/career-ops contacto` для warm intro |
| **3.5 – 3.9** | `/career-ops deep` — сначала research |
| **< 3.5** | пропустите, если нет персональной причины |

`#/dashboard` и `#/tracker` в SPA подсвечивают каждую строку ≥ 4.0, чтобы было видно действие без повторного запуска.

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

### Output sections (канонический career-ops.org A–F)

> **v1.15.0 — канонический A–F.** Буквы блоков теперь совпадают с
> [career-ops.org/docs](https://career-ops.org/docs). Pre-v1.15
> отчёты использовали A–G (`C=Risks`, `F=Verdict`, `G=Legitimacy`);
> мы рендерим их как есть для совместимости, но новые отчёты
> эмитят A–F. Score и Legitimacy теперь в header'е отчёта
> (`score: 4.2/5`, `legitimacy: High|Medium|Low`).

A. **Role Summary** — 3 буллета (риски вынесены сюда инлайном).
B. **CV Match** — топ 3 совпадения и топ 3 пропуска.
C. **Strategy** — рекомендация: apply now / contacto first /
deep first / skip. Было `Risks` до v1.15.
D. **Compensation** — относительно `target.comp_total_min_usd`
(legacy) или `compensation.target_range` (canonical).
E. **Personalization** — angle для письма / outreach, framing
по архетипу. Было `Application Strategy` до v1.15.
F. **STAR stories** — 1–3 готовых S-T-A-R блока под роль. Было
`Verdict` (raw score) до v1.15; score теперь в header'е отчёта
вместе с `legitimacy`.

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


### Полный CLI apply-флоу ([career-ops.org/docs/.../apply-for-a-job](https://career-ops.org/docs/introduction/guides/apply-for-a-job))

Предусловия:

1. Запустите `/career-ops pipeline` сначала, чтобы у JD был evaluation report.
2. Профиль и отчёт загружены.
3. **Рекомендуется:** Playwright установлен (`npx playwright install chromium`). Без него — fallback на WebFetch (text-only).

Нумерованный флоу:

1. **Запустите команду** с названием компании:

   ```
   /career-ops apply <company>
   ```

   Пример: `/career-ops apply Anthropic`. Без аргумента — на следующем шаге дайте скриншот формы, текст формы вставленный, или URL заявки.

2. **Playwright открывает браузер** автоматически и читает форму. Вы НЕ открываете браузер сами.

3. **Черновые ответы возвращаются** нумерованным списком в порядке полей формы, из proof points и STAR stories отчёта.

4. **Помеченные пункты** указывают, что требует внимания человека — salary anchor, недостающие поля CV, опциональные вопросы.

5. **Вы проверяете каждый ответ**, заполняете форму и нажимаете **Submit** сами. career-ops никогда не нажимает Submit.

6. **Подтвердите отправку** в чате:

   ```
   Submitted.
   ```

7. **Автоматические обновления** — статус меняется `Evaluated → Applied` в `data/applications.md`; заполненные ответы остаются в Section G отчёта.

8. **Handoff в tracker**:

   ```
   /career-ops tracker
   ```

### Batch evaluate ([career-ops.org/docs/.../batch-evaluate-offers](https://career-ops.org/docs/introduction/guides/batch-evaluate-offers))

Когда у вас 10+ JD для оценки за раз (one-at-a-time `#/evaluate` в SPA непрактичен для такого объёма) — используйте batch runner из CLI:

1. **Отредактируйте** `batch/batch-input.tsv` с tab-разделёнными колонками `id | url | source | notes`. Одна строка на JD. Пример:

   ```
   1<TAB>https://jobs.example.com/senior<TAB>LinkedIn<TAB>
   ```

2. **Dry-run** (рекомендуется первым):

   ```bash
   ./batch/batch-runner.sh --dry-run
   ```

3. **Запуск** — последовательно или параллельно:

   ```bash
   ./batch/batch-runner.sh                       # по одному
   ./batch/batch-runner.sh --parallel 2          # два одновременно
   ./batch/batch-runner.sh --parallel 3          # три одновременно
   ./batch/batch-runner.sh --parallel 2 --min-score 4.0  # сохранять только высокий fit
   ```

4. **Retry упавших** (network / rate-limit):

   ```bash
   ./batch/batch-runner.sh --retry-failed --max-retries 3
   ```

5. **Reports** уезжают в `reports/` (формат `NNN-company-YYYY-MM-DD.md`). Summary-строки добавляются в `batch/tracker-additions/`.

6. **Merge в tracker**:

   ```bash
   node merge-tracker.mjs                 # применить batch additions
   node merge-tracker.mjs --dry-run       # превью merge
   ```

SPA показывает получившиеся отчёты в `#/reports` (пагинация, цветные score-pill) и tracker rows в `#/tracker` — ровно так же, как если бы вы добавили каждый через `#/evaluate`.

### Установка Playwright ([career-ops.org/docs/.../set-up-playwright](https://career-ops.org/docs/introduction/guides/set-up-playwright))

Требуется для apply form-fill (и для `📄 Generate PDF` на `#/cv` / `#/reports/:slug` / `#/evaluate` / `#/deep` / `#/interview-prep` в SPA). Без Playwright apply-флоу падает на WebFetch (text-only preview формы, без click-fill).

```bash
# из career-ops root
npm install
npx playwright install chromium

# Зарегистрировать Playwright MCP, чтобы Claude Code мог управлять формами
claude mcp add playwright npx @playwright/mcp@latest

# Проверка
npm run doctor
```

Альтернатива — регистрация MCP через `.claude/settings.local.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

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
