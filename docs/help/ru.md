# Справка — career-ops-ui

Пошаговое руководство по каждой странице. Названия совпадают с пунктами левого меню.

---

## 1. Быстрый старт

Полный цикл, end-to-end, за пять минут:

1. **CV** (`#/cv`) — вставь или загрузи резюме в Markdown. Нажми **💾 Сохранить**.
2. **Profile** (`#/settings`) — отредактируй `config/profile.yml`: имя, email, целевая зарплата, локация.
3. **Health** (`#/health`) — проверь, что все обязательные карточки зелёные. Опциональные (Gemini / Anthropic / HH_USER_AGENT) нужны только для соответствующих фич.
4. **Scan** (`#/scan`) — нажми **🌐 Scan all**, чтобы пройти все включённые job boards. Или вставь одну ссылку через Ctrl+K → Enter.
5. **Pipeline** (`#/pipeline`) — посмотри что добавил сканер. Клик по URL — preview справа. Нажми **▶ Evaluate** чтобы оценить под твоё CV.
6. **Tracker** (`#/tracker`) — все оценки сюда. Фильтруй по score, статусу, тексту. Сгенерируй PDF, отправь заявку, обнови статус.

---

## 2. CV (`#/cv`)

Источник истины для каждой оценки.

**Кнопки:**
- **📁 Upload CV** — выбрать локальный `.md` / `.txt` / `.html`. Файл загружается в textarea; нажми **💾 Сохранить** для записи в `cv.md`.
- **sync-check** — запускает `cv-sync-check.mjs`, ищет несоответствия между `cv.md` и портфолио.
- **📄 Generate PDF** — стримит `generate-pdf.mjs`. Результат в `output/*.pdf` появится в разделе **Generated PDFs** ниже редактора с кнопками **↗ Open** + **⬇ Download**.
- **💾 Сохранить** — пишет содержимое в `cv.md`. Серверная санитизация удаляет `<script>`, `on*=` обработчики, `javascript:` URI (defense-in-depth).

**Live preview** справа отражает textarea при вводе.

---

## 3. Profile (`#/settings` — также доступна как `#/profile`)

Показывает разобранный `config/profile.yml`. Редактируй файл напрямую на диске; страница подтянет изменения при reload. На странице Health есть проверка **Profile customized**, которая флагает placeholder-имена типа `Jane Smith` — замени на своё реальное.

---

## 4. Scan (`#/scan`)

Обходит все включённые job boards, дедуплицирует против `data/scan-history.tsv`, пишет hits в `data/last-scan.json`.

**Кнопка:** **🌐 Scan** — запускает все включённые источники одной кнопкой (Greenhouse / Ashby / Lever для EN, hh.ru + Habr Career для RU). Замечание: hh.ru возвращает 403 с не-российских IP — задай `HH_USER_AGENT` в `.env` (или через страницу App settings).

**Фильтры** (таблица результатов): текст, remote/hybrid/relocation, источник (Greenhouse / Ashby / Lever / hh.ru / Habr), плюс chip-фильтры по найденному стеку / уровню. Клик по chip — сужает; "сбросить" — снимает.

**Active companies** внизу — клик по toggle разворачивает фильтруемый список. ✓ зелёные tag'и сканируются через прямое API; ○ серые — через web-search prompts.

---

## 5. Pipeline (`#/pipeline`)

Inbox URL'ов, ждущих оценки.

**Добавить URL:** ввести в input + **+ Add**, ИЛИ нажать Ctrl+K, вставить любую ссылку `http(s)://…` → Enter. Невалидные URL возвращают 400 (FIX-M3 + M7).

**Действия в строке:**
- Клик по URL — загружает **серверный proxied preview** в правую панель (HTML scripts/styles вырезаны, ограничено 8 KB).
- **▶** — переходит в `#/evaluate?url=…` с предзаполненным URL.
- **✕** — удаляет из `data/pipeline.md`.

**Кнопки сверху-справа:** **⚡ Evaluate first** открывает первый URL на Evaluate; **Scan** возвращает к сканеру.

**Фильтр:** введи для сужения списка вживую; счётчик показывает видимое/всего.

---

## 6. Evaluate (`#/evaluate`)

Оценивает один Job Description против `cv.md` и `config/profile.yml`.

1. Вставь JD в textarea (или приди сюда из `#/pipeline` с `?url=…`).
2. Нажми **▶ Evaluate**.
3. Без `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` получишь **manual prompt** для вставки в Claude Code (у него есть WebFetch). С любым ключом — выполнение происходит на сервере, Markdown рендерится в странице.
4. Сохрани JD через **💾 Save JD** для аудита (`jds/*.txt`).
5. Output рендерится по блокам (Role Summary, CV Match, Risks, Compensation, Strategy, Verdict, Posting Legitimacy) + 0-5 score.

---

## 7. Deep research (`#/deep`)

Брифинг компании: команда, культура, новости, переговорные позиции, smart questions.

1. Заполни **Company** (обязательно) + **Role** (опционально).
2. **⚡ Run live** (когда `ANTHROPIC_API_KEY` или `GEMINI_API_KEY` задан) выполняет prompt серверно и сохраняет результат в `interview-prep/{slug}.md`.
3. Без ключа: **▶ Generate prompt**, потом **Показать результат** для повторного запуска после установки ключа.
4. Сохранённые исследования показаны карточками выше; клик — перезагружает в result pane.
5. У каждого результата 📋 **Copy** / ⬇ **Download .md** / ↗ **Open in tab**.

---

## 8. Apply checklist (`#/apply`)

Готовый чек-лист для конкретной вакансии. **Реальное автозаполнение форм только в Claude Code:** `/career-ops apply <url>` — баннер на странице постоянно об этом напоминает. Клик по **▶ Generate checklist** даёт текст для: cover letter prompt, Why-us answer, EEO/sponsorship/start-date ответы, последние sanity checks перед Submit.

---

## 9. Tracker (`#/tracker`)

Реестр заявок — `data/applications.md` отрисованный как сортируемая таблица.

**Колонки:** #, Date, Company, Role, Score, Status, PDF, Report link, Notes.

**Фильтры:** dropdown по статусу, dropdown по score-диапазону (≥4 / ≥3 / <3), свободный текст по company/role.

**Кнопки сверху:** **Normalize** (нормализует статусы по `templates/states.yml`), **Dedup** (схлопывает дубли company+role), **Merge TSV** (подтягивает `batch/tracker-additions/*.tsv` из batch runs).

**Добавить строку из UI:** `POST /api/tracker` (FIX-H8) — обычно через Reports / Pipeline страницы.

---

## 10. Reports (`#/reports`)

Список всех A-G отчётов из `reports/`. Клик по любому — рендер Markdown (XSS-safe через FIX-C10). Каждая строка несёт company + role + score из заголовка отчёта.

---

## 11. Modes (`#/project`, `#/training`, `#/followup`, `#/batch`, `#/contacto`, `#/interview-prep`, `#/patterns`)

Семь специализированных prompt-сборщиков, каждый backed шаблоном в `modes/{slug}.md`. У всех общий UX:

1. Заполни форму (у каждой страницы свои поля — см. placeholder'ы).
2. **▶ Generate prompt** — готовит структурированный prompt из `cv.md` + `profile.yml` + шаблона режима.
3. **⚡ Run live (Anthropic/Gemini)** — появляется когда ключ API задан; выполняет prompt и рендерит Markdown в страницу.
4. **Показать результат** — повторно отправляет ту же форму с `run: true` чтобы получить inline-ответ после Generate prompt.
5. У каждого результата 📋 **Copy** / ⬇ **Download .md**.

| Режим | Что производит |
|---|---|
| **Project** | Scope + signal-fit feedback для портфолио-идеи до того как ты её собрал. |
| **Training** | Решить, стоит ли курс / сертификация твоего времени с учётом целей. |
| **Follow-up** | Cadence per-application: когда напомнить, что писать, когда сдаться. |
| **Batch** | Prompt для `batch/run.mjs` — параллельная оценка списка URL. |
| **Outreach (Contacto)** | LinkedIn-outreach: найти нужного контакта + составить сообщение. |
| **Interview prep** | Подготовка под этап (recruiter screen / system design / behavioural / final). |
| **Patterns** | Найти повторяющиеся слабые места в прошлых заявках. |

---

## 12. Activity (`#/activity`)

Audit log каждого state-changing API-вызова. JSONL в `data/activity.jsonl`.

**Фильтры:** chip-фильтры по префиксу действия (pipeline / cv / jd / evaluate / scan / stream / script). ✓/✗ badge на строке — HTTP-успех.

Auto-rotation при 5 MB; последняя половина переживает.

---

## 13. Health (`#/health`)

Setup-диагностика — зелёный = готово, жёлтый = optional miss, красный = required miss.

**Обязательно:** Node ≥ 18, project root, `cv.md`, `config/profile.yml`, `portals.yml`, `data/applications.md`, `data/pipeline.md`, `modes/oferta.md`.

**Опционально:** `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `HH_USER_AGENT`, Playwright (parent), parent project deps, `Profile customized` (флагает `Jane Smith` placeholders), `data/`, `reports/`, `output/`, `jds/` директории.

**Кнопки сверху:** **Doctor** (alias `node doctor.mjs`), **Verify** (alias `verify-pipeline.mjs`).

---

## 14. Подсказки по настройке

- **`.env`** — скопируй из `.env.example`. Задай `ANTHROPIC_API_KEY` (предпочтительно) или `GEMINI_API_KEY` для live-выполнения. Задай `HH_USER_AGENT` для hh.ru сканов с не-российских IP.
- **Переключатель языка** в footer'е sidebar — 8 локалей (`en` / `es` / `pt-BR` / `ko` / `ja` / `ru` / `zh-CN` / `zh-TW`). Выбор сохраняется в localStorage.
- **Ctrl+K** фокусит глобальный поиск. Вставь URL → Enter → попадёт в pipeline. Любой текст → Enter → перейдёт в tracker-фильтр.
- **Esc** закрывает любой открытый modal.
