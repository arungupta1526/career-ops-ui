# Промпт для Claude Cowork — браузерное E2E тестирование career-ops-ui v1.10.0

> ⚠️ **Перед запуском:** Claude Cowork работает с публичными URL — а у вас приложение крутится на `127.0.0.1:4317`. Самый быстрый способ открыть его наружу — запустить `ngrok http 4317` (или `cloudflared tunnel --url http://127.0.0.1:4317`) и подставить полученный HTTPS-URL в `BASE_URL` ниже. Без этого облачный браузер до приложения не достучится.

---

## Сценарий 0 — Bootstrap из одной команды (проверяется отдельно)

Это **первый и обязательный** сценарий: всё приложение должно подниматься единственной командой. Если Claude Cowork умеет выполнять shell на стенде — пусть выполнит её сам и продолжит остальные сценарии против поднятого инстанса. Если умеет только браузер — этот сценарий запускает оператор вручную, и тогда облачный агент ждёт сообщения о готовности.

**Команда для развёртывания на чистой машине:**

```bash
curl -fsSL https://raw.githubusercontent.com/Fighter90/career-ops-ui/main/bin/setup.sh | bash
```

Что должно произойти за один прогон (без интерактивных запросов):

1. Клонируется `santifer/career-ops` и `Fighter90/career-ops-ui` в `./career-ops/` и `./career-ops/web-ui/` соответственно
2. В `career-ops/.gitignore` добавляется строка `/web-ui/` — родитель не должен трекать вложенный репо
3. `npm install` в `web-ui/` (только две зависимости — `express` + `js-yaml`)
4. Скаффолятся стартовые файлы если их нет: `cv.md` (демо-CV «Alex Doe»), `config/profile.yml` (плейсхолдеры), `portals.yml` (минимум: GitLab + Vercel + Linear), `data/applications.md`, `data/pipeline.md`
5. Запускается сервер на `http://127.0.0.1:4317` — отдаёт SPA сразу

**Проверки этого сценария:**

- Команда отработала с exit code 0 (нет красных ошибок)
- В stdout есть строки `✓ git, node`, `✓ added /web-ui/`, `✓ scaffolded …`, `Setup complete.`, `Launching at http://127.0.0.1:4317/`
- `curl -sf http://127.0.0.1:4317/api/health` возвращает JSON с `"ok":true` (или зелёный с warnings — допустимо)
- `curl -sf http://127.0.0.1:4317/` возвращает HTML с `<title>career-ops-ui</title>` и подключёнными `/css/app.css`, `/js/app.js`
- Файл `./career-ops/cv.md` существует, начинается с `# Alex Doe`
- Файл `./career-ops/config/profile.yml` существует
- Файл `./career-ops/portals.yml` существует и парсится как YAML (`yq . portals.yml` или `node -e "console.log(require('js-yaml').load(require('fs').readFileSync('career-ops/portals.yml','utf8')).tracked_companies.length)"`)

**Идемпотентность:** запусти команду ВТОРОЙ раз в той же папке. Должно отработать без ошибок и без повторных скаффолдингов (увидишь сообщения вида `✓ already cloned — fetching updates`, `✓ /web-ui/ already in .gitignore`, `✓ npm deps already installed`). Сервер при втором запуске поднимется поверх уже живого процесса (порт 4317 будет занят) — это ожидаемо: `ngrok` тогда продолжит работать с первым.

**После успеха** — `BASE_URL` для остальных сценариев берётся из туннеля поверх того же `127.0.0.1:4317`.

**PASS** = одна команда подняла рабочий инстанс + повторный запуск идемпотентен + Health отвечает зелёным.

**BLOCKER** если: команда упала, сервер не запустился, скаффолд-файлы не создались, или `/api/health` возвращает 500.

---

## Контекст

Я тестирую **career-ops-ui** v1.10.0 — это веб-интерфейс на Express + vanilla JS поверх AI-пайплайна для поиска работы. Хеш-роутер, 16 страниц, 8 локалей, режим работы single-tenant на loopback.

```
BASE_URL = <вставь сюда https://...ngrok-free.app>
LOCALE   = ru   (можно en, es, pt-BR, ko-KR, ja, zh-CN, zh-TW)
```

На стенде уже:

- ANTHROPIC_API_KEY и/или GEMINI_API_KEY заданы в `.env` (если нет — manual-fallback всё равно работает, см. сценарий 7)
- Демо-CV «Alex Doe» (8 лет PHP+Go) и стартовый `portals.yml` с GitLab/Vercel/Linear

Открой `BASE_URL` в браузере — должна загрузиться страница `/#/dashboard`. Если нет — упади с понятным error-репортом и не продолжай дальнейшие сценарии.

---

## Глобальные правила тестирования

1. **Каждый сценарий = независимый блок.** Если падает шаг 3 — продолжай с шага 4, а не выходи. В отчёте отметь PASS/FAIL/SKIP по каждому подшагу.
2. **Селекторы — по тексту и `data-route`**, не по случайным классам. Sidebar-ссылки имеют атрибут `data-route="<имя>"`. Кнопки имеют видимый текст («💾 Save», «📁 Upload CV», «📄 Generate PDF», «🌐 Scan now», «▶ Evaluate», «▶ Test Anthropic», «▶ Test Gemini»).
3. **Скриншоты на каждом шаге** — название по шаблону `<NN>-<scenario>-<step>.png`.
4. **Между сетевыми действиями** жди исчезновения `.loading` спиннера или появления toast-сообщения. Не используй фиксированные `sleep` — жди по селектору.
5. **Локализуй проверки** — переключи язык в правом нижнем углу sidebar (`.lang-btn[data-lang-btn="ru"]`) перед стартом, и далее проверяй заголовки кнопок на выбранном языке.
6. **Никогда не отправляй реальные отклики**. Все формы apply-checklist / outreach генерируют ТЕКСТ, ничего не сабмитят на внешние сайты. Если кнопка ведёт на `https://job-boards.greenhouse.io` или подобное — ОТКРОЙ во вкладке для проверки, но НИКАКИХ сабмитов.

---

## Сценарий 1 — Дым-тест навигации (60 секунд)

Зайди на `BASE_URL` и пройди по каждому пункту sidebar. Кликни по очереди:
**Dashboard → Scan → Pipeline → Evaluate → Reports → Tracker → Activity → CV → Profile → App settings → Health → Help**.

Для каждого:

- Проверь, что URL содержит ожидаемый хеш (`#/scan`, `#/pipeline`, ...)
- Проверь, что отрисовался `<h1.page-title>` (заголовок страницы)
- Проверь, что в консоли браузера НЕТ красных ошибок (только warnings допустимы)
- Сделай скриншот

Отдельно проверь back-compat: открой `BASE_URL/#/settings` — должен резолвиться в Profile-вью, в sidebar должен подсвечиваться пункт Profile (старая ссылка не должна 404-иться).

**PASS = 13 страниц + 1 алиас, 0 console errors.**

---

## Сценарий 2 — Health (зелёная основа)

1. Открой `#/health`
2. Дождись таблицы с чек-листом (`.card` блоки с зелёными/красными бейджами)
3. Все required-чеки должны быть зелёными:
   - `cv.md exists`
   - `config/profile.yml exists`
   - `portals.yml exists`
   - `Profile customized` (true когда full_name ≠ placeholder)
   - `API key set` (хотя бы один)
4. Если что-то красное — сделай скриншот и продолжай дальше; в финальном отчёте отметь как «known prerequisite missing».

**PASS = required-чеки зелёные ИЛИ корректный hint-текст для каждого красного.**

---

## Сценарий 3 — Profile editor (новинка v1.10.0)

1. `#/config` → клик по табу **«Profile»** (вторая вкладка)
2. Должен появиться textarea с YAML, начинающимся с `# Career-Ops Profile Configuration`
3. Замени значение `candidate.full_name:` на `"Cloud Tester"` (через `.fill()` после `.click()`)
4. Клик **💾 Save**
5. Жди toast `Profile saved · Cloud Tester` (или локализованный аналог)
6. Перейди на `#/profile` — в карточке `Name` должно быть `Cloud Tester`
7. Перезагрузи страницу — значение должно сохраниться

**Негативные кейсы (тесты валидации):**

8. Вернись в `#/config → Profile`. Очисти textarea и нажми Save → ожидаемый toast «empty» или эквивалент, статус остался прежним
9. Заменить весь YAML на `- not\n- a\n- mapping` → Save → toast с ошибкой `mapping`/`maps`
10. Удалить ключ `candidate:` целиком → Save → toast с ошибкой `candidate`

**PASS = 7 happy-path шагов + 3 negative-кейса с правильными ошибками.**

---

## Сценарий 4 — CV import (главная новинка v1.10.0)

Тестируем все форматы загрузки. Перед каждой загрузкой `#/cv` должна быть открыта; после успешной загрузки textarea заполняется конвертированным markdown.

### 4a. .md (passthrough)

1. Создай файл во временной папке cloud-агента: `test.md` с содержимым `# Hello from cloud\n\nMD passthrough test.`
2. `#/cv` → клик **📁 Upload CV** → выбери `test.md`
3. Toast `Loaded test.md (passthrough) — review, then Save`
4. В textarea видно `# Hello from cloud`

### 4b. .txt (passthrough)

То же что 4a, но `test.txt` с любым текстом.

### 4c. .html (pandoc)

1. `test.html` с содержимым:

   ```html
   <h1>HTML CV</h1>
   <script>window.__pwn=1</script>
   <p>Body text.</p>
   ```

2. Загрузи через **📁 Upload CV**
3. Toast `Loaded test.html (pandoc) ...`
4. В textarea видно `# HTML CV` И НЕ ВИДНО ни `<script>`, ни `__pwn` (XSS-санитизация работает)

### 4d. .pdf (pdftotext)

1. Если у cloud-агента есть готовый PDF — загрузи. Иначе сгенерируй mini-PDF любым способом (например запросив у бекенда `📄 Generate PDF` сначала, потом скачай результат и загрузи как input).
2. Toast `Loaded ... (pdftotext)`
3. В textarea — извлечённый текст из PDF

### 4e. .docx (pandoc)

Если есть тестовый .docx — загрузи. Иначе SKIP с пометкой.

### 4f. Negative — неподдерживаемый формат

1. `test.exe` (любой бинарь, ≥1 KB)
2. Загрузи → ожидается toast с ошибкой `unsupported format ".exe"`
3. textarea **не должна** измениться

### 4g. Negative — слишком большой файл

1. Сгенерируй файл `huge.txt` размером ровно 11 MB (`dd if=/dev/zero of=huge.txt bs=1M count=11`)
2. Загрузи → ожидается ошибка `413` или сообщение `too large`

**PASS = 4a, 4b, 4c, 4d, 4f, 4g обязательные; 4e желательный.**

---

## Сценарий 5 — CV save round-trip + XSS strip

1. `#/cv` → в textarea вставь:

   ```markdown
   # Cloud Tester CV

   <script>window.__cloud_pwn=1</script>
   [malicious](javascript:alert(1))

   ## Summary
   Senior backend engineer.
   ```

2. Клик **💾 Save**
3. Toast `Saved`
4. **Перезагрузи** страницу `#/cv`
5. Проверь что в textarea:
   - есть `# Cloud Tester CV`
   - есть `Senior backend engineer`
   - НЕТ `<script>`, `__cloud_pwn`, `javascript:`

**PASS = 5 проверок выполнены.**

---

## Сценарий 6 — Generate PDF + auto-download

⚠️ Этот тест требует Playwright в parent-проекте. Если на стенде его нет, шаг будет падать с подсказкой «Playwright is missing» — это **ожидаемое** SKIP-поведение, отметь и иди дальше.

1. `#/cv` → клик **📄 Generate PDF**
2. Должно открыться модальное окно с SSE-логом
3. Жди до строки `✓ done (exit 0)` или ошибки
4. Если успех:
   - PDF должен **автоматически скачаться** в загрузки cloud-агента
   - Внизу страницы (`#/cv`) появилась карточка с именем PDF и кнопками **↗ Open / ⬇ Download**
   - Имя файла соответствует только что сгенерированному
5. Если ошибка с `Playwright` — отметь SKIP, продолжай.

**PASS = либо PDF скачался + список обновился, либо чёткое сообщение о Playwright-зависимости.**

---

## Сценарий 7 — Evaluate (с ключом и без)

### 7a. Manual fallback (если ключи НЕ заданы)

1. `#/evaluate`
2. В textarea вставь:

   ```
   Senior Backend Engineer at TestCo. Lead a small team building distributed systems with PHP, Go, and Postgres. 10+ years XP, on-call rotation, code review responsibilities, mentoring mid-level engineers. Remote EU.
   ```

3. Клик **▶ Evaluate**
4. Должна появиться карточка с бейджем `Manual mode (no GEMINI_API_KEY)` (или эквивалент) и блоком `<pre>` с готовым промптом для копирования
5. Клик **⧉ Copy prompt** → toast `Prompt copied` (clipboard может быть недоступен в cloud-окружении — тогда просто проверь что кнопка не падает)

### 7b. Live mode (если ключ задан)

1. То же что 7a, но без ключа в `.env` это даст manual; с ключом — структурный отчёт.
2. Жди до 60 секунд (live-вызов LLM может тормозить)
3. Должна появиться карточка с бейджем `Anthropic · exit 0` (или `Gemini · exit 0`) И тело Markdown-отчёта с секциями A–G
4. Если поставлен чекбокс «Save JD» (`#save-jd`), бейдж `Saved: jd-...md` тоже должен быть

**PASS = 7a выполнен. 7b желательно, SKIP если ключи отсутствуют.**

---

## Сценарий 8 — Pipeline + dedup + invalid-URL reject

1. `#/pipeline`
2. В поле URL вставь `https://job-boards.greenhouse.io/anthropic/jobs/test-cycle-cloud-1`
3. Клик кнопки добавления (надпись локализована — ищи по `<button>` ниже поля)
4. Запись должна появиться в списке
5. Повтори вставку того же URL → toast `deduped` или счётчик «1 дубль»
6. Вставь `javascript:alert(1)` → должна быть ошибка валидации, ничего в список не добавляется
7. Вставь `http://127.0.0.1/x` → ошибка (loopback запрещён SSRF-гардом)
8. Вставь `not-a-url` → ошибка

**PASS = 1 успешный add + 1 dedup + 3 reject-кейса.**

---

## Сценарий 9 — Tracker (BF-1 pipe round-trip)

Ключевой regression-тест: компании с `|` в названии раньше ломали markdown-таблицу.

1. `#/tracker` → клик «Add» (или эквивалент локализованный)
2. Заполни поля:
   - Company: `Acme | Co`
   - Role: `Senior Backend\nEngineer` (с переносом строки)
   - Score: `4.2`
   - Status: `Evaluated`
   - Notes: `Cloud regression test`
3. Сохрани
4. **Перезагрузи** страницу
5. Найди строку с компанией `Acme | Co` (именно с пайпом!) — она должна остаться целой, не разбившейся на две колонки
6. Проверь что Role содержит и `Senior Backend`, и `Engineer`

**PASS = строка сохранилась, pipe и newline не сломали layout.**

---

## Сценарий 10 — Reports + пагинация

1. `#/reports` → должны отображаться карточки сгенерированных отчётов
2. Если их > 12 — должен быть пагинатор внизу. Кликни «Next» / `→` — список меняется
3. Кликни на любую карточку → загружается полный markdown отчёта в новом view

**PASS = пагинатор работает (или их < 12 → просто список без пагинатора), детальный отчёт открывается.**

---

## Сценарий 11 — Deep research (manual fallback)

1. `#/deep`
2. Заполни Company = `Anthropic`, Role = `Senior Backend Engineer`
3. Клик соответствующей кнопки запуска
4. Без ключа: получи manual prompt, проверь что в нём есть `Anthropic`, `Senior Backend Engineer`, `interview-prep` (это путь сохранения)
5. С ключом: получишь полный 7-секционный бриф (живой LLM, до 60 секунд)

**PASS = manual prompt построен корректно, либо live-результат сохранился в `interview-prep/`.**

---

## Сценарий 12 — Mode prompts (7 режимов)

Пройди по `#/project`, `#/training`, `#/followup`, `#/batch`, `#/contacto`, `#/interview-prep`, `#/patterns`. Для каждого:

1. Открой страницу
2. Заполни обязательные поля (минимум — что просит форма)
3. Клик кнопки построения промпта
4. Проверь что результат содержит:
   - правильный slug (`r.slug` равен имени маршрута)
   - текст с упоминанием режима (например для `interview-prep` — слово `interview-prep` в промпте)

**PASS = 7 режимов выдают непустой prompt без console errors.**

---

## Сценарий 13 — Apply checklist

1. `#/apply`
2. URL = `https://job-boards.greenhouse.io/anthropic/jobs/test`
3. JD = `Senior Backend Engineer`
4. Запусти билдер чек-листа
5. Результат должен содержать:
   - текст `career-ops apply` (упоминание парент-команды)
   - предупреждение `NEVER auto-submit` (или локализованный вариант)
   - длина > 200 символов

**PASS = чек-лист сгенерирован с обоими маркерами.**

---

## Сценарий 14 — Activity log (audit trail)

1. `#/activity`
2. После всех предыдущих сценариев в логе должны быть записи:
   - `cv.save` (после сценария 5)
   - `pipeline.add` (после сценария 8)
   - `tracker.add` (после сценария 9)
   - `evaluate` (после сценария 7)
3. Каждая запись имеет timestamp в ISO формате

**PASS = минимум 4 ожидаемых action'а в логе.**

---

## Сценарий 15 — Help (8 локалей)

1. `#/help` на текущей локали (LOCALE из конфига)
2. Должно загрузиться 16 секций (`<h2>` в правой колонке + TOC слева)
3. Секция 1 должна содержать слова с маркерами `Шаг 1`, `Шаг 21` (для RU) или `Step 1`/`Step 21` (для EN), и упоминание `📁 Upload CV`, `🌐 Scan now`, `▶ Evaluate`, `📄 Generate PDF`
4. Переключи язык на en → перезагрузи help → проверь что контент тоже 16 секций и тоже содержит 21-шаговый walkthrough
5. Скриншот для каждой локали

**PASS = в обеих проверенных локалях help грузится, 16 секций, 21 шаг.**

---

## Сценарий 16 — Полный E2E flow (главная цель)

Это сценарий-капитан: пройди весь жизненный цикл за один проход, имитируя поведение реального пользователя.

1. **Setup**: Сценарий 2 (Health зелёный) → Сценарий 3 (Profile editor — поставь имя `E2E Cloud Tester`)
2. **CV**: Сценарий 4a (`.md` upload) → Сценарий 5 (Save с XSS-стрипом)
3. **Find**: Сценарий 8 (Pipeline add)
4. **Score**: Сценарий 7a (Evaluate с manual prompt)
5. **Track**: Сценарий 9 (Tracker add)
6. **Verify**: Сценарий 14 (Activity log содержит все action'ы из шагов выше)

**PASS = все 6 фаз отработали без падения. Это imitation полного «from CV to applied» flow, как описано в Help.**

---

## Финальный отчёт

После всех 16 сценариев выдай таблицу:

| Сценарий | Шаги | PASS | FAIL | SKIP | Заметки |
|---|---|---|---|---|---|
| 1. Smoke nav | 13 | ... | ... | ... | ... |
| ... | ... | ... | ... | ... | ... |
| **Итого** | **~120** | **N** | **M** | **K** | |

Плюс:

- **Console errors суммарно:** число и список уникальных строк
- **Network failures:** все 4xx/5xx ответы (кроме сценариев 3.8–3.10, 4.6–4.7, 8.6–8.8 где они ожидаемые)
- **Скриншоты:** ссылки на artefacts
- **Среднее время отклика** UI (TTFB до first paint) — для оценки производительности

---

## Что является BLOCKER vs WARNING

**Blocker** (заваливает релиз):

- Сценарий 1 — не загрузилась хоть одна страница
- Сценарий 2 — required-чек красный без обоснования
- Сценарий 3 — Profile YAML save уронил сервер (5xx) или потерял данные после reload
- Сценарий 4c — XSS payload пробрался в textarea (это security-баг)
- Сценарий 5 — `<script>` или `javascript:` оказался в сохранённом cv.md после round-trip
- Сценарий 9 — pipe в company name всё ещё ломает таблицу (BF-1 регрессия)
- Сценарий 16 — упал хоть один из 6 шагов полного flow

**Warning** (репортишь, но релиз пропускаешь):

- Сценарий 6 — отсутствие Playwright (зависит от стенда)
- Сценарий 7b — отсутствие ключа Anthropic/Gemini
- Сценарий 4d/4e — отсутствие pdftotext/pandoc на хосте (тогда тест должен фейлиться gracefully с hint-текстом — ЭТО ожидаемое поведение, не warning)

---

## Сценарий 17. career-ops.org/docs coverage в Help (v1.11.0+)

**Цель.** v1.11.0+ интегрирует все 5 канонических гайдов career-ops.org/docs в help-бандлы. Этот сценарий проверяет, что интеграция полная и работает на всех 8 локалях.

**Канонические URL** (фетчатся из help / README):

- <https://career-ops.org/docs/introduction/what-is-career-ops>
- <https://career-ops.org/docs/introduction/guides/scan-job-portals>
- <https://career-ops.org/docs/introduction/guides/apply-for-a-job>
- <https://career-ops.org/docs/introduction/guides/batch-evaluate-offers>
- <https://career-ops.org/docs/introduction/guides/set-up-playwright>

### 17.1. О career-ops секция присутствует в каждой локали Help

Для каждой из 8 локалей (`en`, `ru`, `es`, `pt-BR`, `ko`, `ja`, `zh-CN`, `zh-TW`):

```bash
curl -sf "http://127.0.0.1:4317/api/help/<lang>" | jq -r .markdown | head -100
```

**Assertions:**

- Раздел «About career-ops» / «О career-ops» / эквивалент присутствует в первой трети.
- Все 5 канонических URL career-ops.org встречаются хотя бы один раз.
- Таблица action thresholds по score (`≥ 4.5` / `4.0–4.4` / `3.5–3.9` / `< 3.5`) присутствует.
- Концепты Mode / Archetype / Pipeline / Tracker / Report / Scan history перечислены.

### 17.2. CLI-флоу обогащение в §5 / §7 / §14

В каждой из 8 локалей:

- **§5 (Portals)** содержит подсекцию `CLI flow (...)` с командами `cp templates/portals.example.yml portals.yml`.
- **§7 (Scan)** содержит подсекцию `CLI scan flow (...)` с обеими опциями: `npm run scan` и `/career-ops scan`.
- **§14 (Apply)** содержит:
  - Полный нумерованный CLI apply flow с шагами 1–8 (от `/career-ops apply <company>` до `Submitted.`).
  - Подсекцию `Batch evaluate` с командами `./batch/batch-runner.sh` (включая `--parallel`, `--min-score`, `--retry-failed`).
  - Подсекцию `Playwright setup` с командами `npx playwright install chromium` и `claude mcp add playwright npx @playwright/mcp@latest`.

**Assertion (грубая регрессия):** в EN-бандле каждая из 5 канонических URL встречается ≥ 2 раз (header front-matter + соответствующая CLI-подсекция).

### 17.3. README имеет «About career-ops» в каждой локали

```bash
grep -l "career-ops.org/docs" README*.md | wc -l   # должно быть 8
```

И в каждом из 8: блок `About career-ops` / «О career-ops» / эквивалент с 5 каноническими ссылками + таблицей action thresholds.

### 17.4. #/apply показывает Playwright setup ссылку

1. Открой `#/apply` в любой локали.
2. Info-баннер должен содержать ссылку на `career-ops.org/docs/.../set-up-playwright` (не просто текст — это `<a href>`).
3. Клик → открывает `https://career-ops.org/docs/introduction/guides/set-up-playwright` в новой вкладке.

### 17.5. #/reports score-thresholds card (v1.11.1+)

1. Открой `#/reports`.
2. Над списком отчётов должна быть карточка-подсказка с таблицей score → action.
3. Карточку можно свернуть (`<details>` с `summary`).

### Финальный gate сценария 17

| Подпункт | Что проверяет | Pass если |
|---|---|---|
| 17.1 | Front-matter блок в 8 локалях | все 8 локалей × все 5 URL присутствуют |
| 17.2 | CLI-флоу подсекции в §5/§7/§14 | в каждой локали все 3 секции содержат подсекцию с командами |
| 17.3 | README блок в 8 локалях | `grep -l 'career-ops.org/docs' README*.md` = 8 |
| 17.4 | #/apply ссылка | `<a href="https://career-ops.org/docs/.../set-up-playwright">` присутствует |
| 17.5 | #/reports подсказка | карточка с таблицей score → action видна на странице |

**PASS = все 5 подпунктов зелёные.**

---

## Сценарий 18. Help bundle parity (i18n)

Регрессия для `tests/help-ui.test.mjs::section-parity` контракта.

```bash
for f in docs/help/*.md; do
  echo "$f: $(grep -c '^## ' "$f") H2 sections"
done
```

**Assertion:** все 8 бандлов должны вернуть ровно **16** H2 секций. Любое расхождение — blocker (parity-тест в CI упадёт).

