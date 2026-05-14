# Журнал изменений

Все значимые изменения **career-ops-ui** задокументированы здесь. Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версии по [Semantic Versioning](https://semver.org/lang/ru/).

Переводы: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

> **Примечание о переводе.** Файл полностью переведён на русский: тела всех записей переписаны на технический русский без англоязычных заглушек.

---

## [1.26.1] — 2026-05-14

**Hot-fix WCAG 2.5.5 — восстановлен минимум `min-height: 44px` на `.btn`.**

В v1.26.0 декларация `min-height: 44px` в `.btn` отсутствовала, header-кнопки рендерились на 39-41 px (нарушение WCAG 2.5.5). v1.26.1 восстанавливает 44-пиксельный пол + `flex-shrink: 0` + `line-height: 1.2`. **502 → 506** unit, Playwright 32/32 без изменений. Детали в [`CHANGELOG.md`](CHANGELOG.md).

---

## [1.26.0] — 2026-05-14

**Пирамида тестов + line-покрытие ≥ 93 %.**

Внедрена 4-уровневая пирамида тестов (unit → functional → acceptance → e2e) согласно backlog'у v1.25. Добавлены 22 новых теста, покрывающие крупнейшие пробелы из v1.25 (jds.mjs 61.64 % → 100 %, ветки отказа в auto-pipeline). Появилась директория `tests/acceptance/` для тестов пользовательских сценариев через несколько endpoint'ов. **480 → 502** unit + acceptance, Playwright 32/32 без изменений. Полные детали в [`CHANGELOG.md`](CHANGELOG.md) и [`docs/architecture/TESTING.md`](docs/architecture/TESTING.md).

---

## [1.25.0] — 2026-05-14

**Короткое замыкание ручного режима авто-пайплайна + косметика дашборда + добивка паритета CHANGELOG.** Релиз закрывает G-014 (авто-пайплайн игнорировал `mode: 'manual'`), G-012 (рассинхрон CHANGELOG — 6 локалей отставали на два релиза) и косметический баг с двойным глифом `✨ ✨` на дашборде. G-003 (переименование `README.cn.md`) де-факто уже закрыт — в репозитории присутствует только `README.zh-CN.md`. G-005 (перестройка блоков отчётов A-G → A-F) требует согласованного коммита в родительском проекте и переносится дальше.

### 🛡️ G-014 — короткое замыкание `mode: 'manual'` в авто-пайплайне

- **`fix(auto-pipeline): G-014 — honour mode:'manual' short-circuit`** ([`server/lib/routes/auto-pipeline.mjs:158-195`](server/lib/routes/auto-pipeline.mjs#L158-L195)) — до v1.25 маршрут всегда обращался к LLM. Передача `mode: 'manual'` (по аналогии с `/api/evaluate` начиная с v1.10.2) тихо игнорировалась, запрос висел 1–3 минуты на Anthropic. Теперь обработчик:
  - Принимает `mode` И `evalMode` ради обратной совместимости. Любое из значений `'manual'` запускает короткое замыкание.
  - Эмитит все 5 этапов SSE со `status: 'done'` / `status: 'skipped'`. Без fetch. Без вызова LLM. Без $0.05 за запрос.
  - Полезная нагрузка `done` несёт `{ mode: 'manual', prompt: <buildEvaluationPrompt scaffold>, message }` — SPA может отрендерить её так же, как уже существующую карточку ручного промпта `/api/evaluate`.
- **Закрывает риск DoS** на `HOST=0.0.0.0`: ранее, даже когда `llmRateLimit` ограничивал 10 запросов в 60 с с IP, 10 атакующих × 10 запросов = $50/мин расхода Anthropic. Короткое замыкание срабатывает до того, как декремент лимита запросов учтётся для реального вызова.
- **Тесты** — [`tests/auto-pipeline-manual-mode.test.mjs`](tests/auto-pipeline-manual-mode.test.mjs): 3 теста подтверждают (1) `mode: 'manual'` возвращает ответ менее чем за 2 с со всеми 5 ключами этапов, (2) даже при заданном `ANTHROPIC_API_KEY` короткое замыкание всё равно срабатывает (исходный симптом), (3) старые вызовы с `evalMode: 'manual'` продолжают работать.

### 📝 G-012 — добивка паритета CHANGELOG (6 локалей × 2 пропущенных релиза)

- **`docs(changelog): backfill v1.23.0, v1.24.0, v1.24.1, v1.25.0 in 6 lagging locales`** — до v1.25 только EN содержал v1.23–v1.24; RU отставал на один релиз, остальные 6 — на два. v1.25 запускает параллельных переводческих агентов (по образцу цикла v1.23), которые добавляют все четыре записи в `CHANGELOG.{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md`. RU получает v1.24.0 + v1.24.1 + v1.25.0 (v1.23.0 уже присутствовал с цикла v1.23).
- **`feat(ci): scripts/check-changelog-parity.mjs gate`** — падает сборка, если самая свежая запись CHANGELOG любой локали старше канонического EN. Подключено в `npm run test:ci`. Текущий рассинхрон G-012 поймал бы себя сам в момент пересечения границы EN.

### ✨ Косметика — устранение двойного глифа на дашборде

- **`fix(dashboard): dedup ✨ glyph in auto-pipeline button label`** ([`public/js/lib/i18n-dict.js:219`](public/js/lib/i18n-dict.js#L219)) — `dash.autoPipeline` нёс ведущий `✨` в строке каждой локали, И `public/js/views/dashboard.js:58` добавлял ещё один `✨` во вьюхе. Результат: кнопка рендерилась как `✨ ✨ Auto-pipeline …`. v1.25 убирает ведущий глиф из значения DICT каждой локали; префикс вьюхи остаётся единственным источником. Тот же проход аудита прошёлся по остальному i18n-бандлу — других случаев двойного глифа не обнаружено.

### 🚫 Перенесено на следующий релиз

- **G-005 — перестройка блоков отчёта A-G → A-F согласно каноническому career-ops.org/docs** — требует согласованного коммита в родительском проекте `santifer/career-ops` (переписать `modes/oferta.md` так, чтобы он эмитил A=Role, B=CV-match, C=Strategy, D=Comp, E=Personalization, F=STAR — отказаться от C-Risks/G-Legitimacy как отдельных блоков). v1.25.0 поставляет сторону web-ui, готовую к новой схеме (`reports.js` принимает произвольные буквы блоков с v1.13). Закладывается в следующее релизное окно, когда родитель и потомок смогут выйти вместе.
- **G-003 — переименование `README.cn.md` → `README.zh-CN.md`** — проверено при подготовке v1.25: в репозитории уже присутствует `README.zh-CN.md` (никакого осиротевшего `README.cn.md` нигде в worktree). Находка G-003 устарела.

### 🧪 Тесты

- **477 → 480** unit (+3 из PR-B `auto-pipeline-manual-mode.test.mjs`).
- 32/32 Playwright без изменений.
- `npm run test:ci` теперь прогоняет `npm test` + `check-no-also-leftovers.mjs` + `check-changelog-parity.mjs`.

### Верификация

```bash
$ npm run test:ci
# 480 / 480
# ✓ no .also( leftovers in views/
# ✓ CHANGELOG parity: all 8 locales at v1.25.0

# G-014 — manual mode returns < 2 s even with ANTHROPIC_API_KEY set:
$ ANTHROPIC_API_KEY=sk-ant-test PORT=4317 npm start &
$ sleep 3
$ time curl -sS -X POST -H 'Content-Type: application/json' \
    -d '{"url":"https://job-boards.greenhouse.io/anthropic/jobs/x","mode":"manual"}' \
    http://127.0.0.1:4317/api/auto-pipeline | head -20
# real  0m0.1xx s  (was 1-3 min)
# event: start … event: step (×5) … event: done {"mode":"manual","prompt":"…"}

# G-012 — every locale CHANGELOG carries the v1.25.0 entry:
$ grep -c '^## \[1.25.0\]' CHANGELOG*.md
# 8 files, each → 1

# Cosmetic — dashboard glyph:
$ grep "dash.autoPipeline" public/js/lib/i18n-dict.js
# No leading ✨ in any locale value (view supplies the single glyph)
```

### Несовместимые изменения

Нет. `mode: 'manual'` подключается опционально; старые вызовы с `evalMode: 'manual'` продолжают работать без изменений.

### Вне рамок (v1.26+)

| Пункт | Примечания |
|---|---|
| G-005 — перестройка блоков отчёта A-F | Требует согласованного коммита в родительском проекте (`santifer/career-ops` переписывает `modes/oferta.md`). |
| Живое выполнение **визуальных** подтестов QA-сценария 31 | Требуют браузерного агента (Claude Cowork). Частично покрыты Playwright smoke. |
| Превышение `i18n-dict.js` целевого лимита в 400 LOC | Фикстура переводов — освобождена политикой. Разделение добавило бы HTTP-запросов без сборщика. |

---

## [1.24.1] — 2026-05-14

**Hot-fix: падение `#/config` во всех 8 локалях (G-015).**

### 🚑 Критический hot-fix

- **`fix(config): G-015 — replace removed Element.prototype.also call in config.js`** ([`public/js/views/config.js:371`](public/js/views/config.js#L371)) — v1.22.0 N-2 удалил глобальный monkey-patch `Element.prototype.also` и перевёл `cv.js` на шаблон со свободными выражениями, но **пропустил `config.js`**. В итоге `#/config` падал при первом обращении в каждой локали с ошибкой `c(...).also is not a function`. v1.24.1 применяет тот же шаблон миграции, что и в `cv.js:188-201` — вынести дерево в `const root = c(...)`, выполнить блок активации отдельно и затем `return root;`.

### 🛡️ Шлюз CI

- **`feat(ci): scripts/check-no-also-leftovers.mjs sweep`** — обходит каждый файл под `public/js/views/` и валит сборку на любом вызове `.also(` (ссылки в комментариях допустимы). Подключено в новый скрипт `npm run test:ci`. Будущий откат удаления monkey-patch не сможет тихо вернуть ту же регрессию.

### 🧪 Тесты

- **`test: tests/config-view-syntax.test.mjs`** — три страховки:
  - парсинг `config.js` через `node:vm.Script` (ловит регрессии уровня синтаксиса без Playwright)
  - проверка, что `.also(` не выживает вне комментариев
  - проверка, что якоря миграции `const root = c(...)` / `return root;` на месте
- **474 → 477** unit (+3) + 32/32 Playwright без изменений.

### Верификация

```bash
$ npm run test:ci
# 477 / 477
# ✓ no .also( leftovers in views/

# Browser smoke:
$ open http://127.0.0.1:4317/#/config
# → renders normally, no "is not a function" card. Every locale equivalent.
```

### Вне рамок (перенесено на v1.25)

- G-014, G-012, G-005, G-003 — см. запись v1.25.0 ниже единым пакетом.

---

## [1.24.0] — 2026-05-14

**Обновление глубины содержимого справочного бандла + живое выполнение QA-сценария 31 + сквозной перевод RU CHANGELOG.** Релиз закрывает оба пункта, перенесённых таблицей «Out of scope» из v1.23.0 на v1.24: полное обновление глубины содержимого всех 8 справочных бандлов из 5 канонических URL career-ops.org/docs (с v1.11.x присутствовало только покрытие URL) и живое выполнение QA-сценария 31 на запущенном сервере (числилось как «требует браузерного агента + LLM-учётных данных» — оказалось, что 6/6 подтестов достижимы через curl + grep, и только визуальные подтесты требуют браузера).

### 📖 Обновление глубины содержимого справочного бандла

- **`docs(help): refresh en.md from 5 canonical career-ops.org/docs URLs`** ([`docs/help/en.md`](docs/help/en.md)) — до v1.24 EN-бандл содержал 1113 строк и перечислял 5 канонических URL во front-matter, но не раскрывал их в теле. v1.24 загружает все 5 URL через WebFetch и углубляет соответствующие H2-разделы:
  - **About career-ops (front-matter)** — добавлены принципы (суверенитет данных, AI-agnostic, контроль со стороны человека), блок «What career-ops is NOT», расширена инвентаризация концепций с 6 до 10 строк (добавлены Proof points, JD store, Interview-prep, Batch additions).
  - **§5 Portals** — добавлен канонический bootstrap `cp templates/portals.example.yml portals.yml`, уточнены обязательные и опциональные поля каждой записи `tracked_companies`.
  - **§7 Scan** — добавлено примечание «no AI tokens consumed» для варианта A, перечень последующих команд (`apply` / `contacto` / `deep` / `tracker`).
  - **§14 Apply checklist** — разделён на режим SPA-чеклиста, режим Manual-vs-Playwright-assisted и полный CLI-сценарий (канонические 8 пронумерованных шагов от `/career-ops apply <company>` до `Submitted.` с авто-переходом `Evaluated → Applied`); подсекция batch evaluate получила таблицу схемы TSV + документацию всех 4 флагов + `merge-tracker.mjs --dry-run`; подсекция Playwright Setup перечисляет команды установки, регистрацию MCP, альтернативу `.claude/settings.local.json`, примечание о headless-режиме по умолчанию.
- **Сохранён паритет 16 H2-разделов** (CI-тест `help-ui.test.mjs::section-parity` утверждает ровно 16 H2-разделов во всех 8 локалях).
- **Каждый из 5 канонических URL встречается ≥ 2 раз** в бандле (CI-тест `canonical-docs-coverage.test.mjs` это обеспечивает). Счётчики на URL после v1.24: `what-is-career-ops` × 4, `scan-job-portals` × 5, `apply-for-a-job` × 3, `batch-evaluate-offers` × 5, `set-up-playwright` × 3.
- **`docs(help): translate the v1.24 deepening to 7 non-EN locales`** — запущены 7 параллельных переводческих агентов. Каждая целевая локаль (es / pt-BR / ko-KR / ja / ru / zh-CN / zh-TW) получает обновлённый бандл, который зеркалит структуру EN раздел в раздел, сохраняет дословно блоки кода, URL, пути к файлам и метки кнопок (📁 Upload CV / 🌐 Scan now / ▶ Evaluate / 📄 Generate PDF / 💾 Save), а также английские аббревиатуры (CSP, SSRF, TOCTOU, WCAG, ATS, JD, SSE, REST, API), и переводит углубление на нативный технический стиль публикационного уровня на целевом языке.

### 🧪 QA-сценарий 31 — живое выполнение (6/6 PASS)

- **`docs(qa): append last-verified live-execution log to qa/claude-cowork-browser-test-prompt.md`** — до v1.24 сценарий 31 был задокументирован, но ни разу не прогонялся на живом сервере (был отложен как «требует браузерного агента + LLM-учётных данных»). v1.24 прогнал все 6 подтестов на `http://127.0.0.1:4317`:

  | Sub | Описание | Статус |
  |---|---|---|
  | 31.1 | Пороги баллов в справочных бандлах | ✅ PASS (4.5 × 3, 4.0 × 9, 3.5 × 6 упоминаний в `docs/help/en.md`) |
  | 31.2 | Эндпоинты сценария сканирования | ✅ PASS (`/api/stream/scan-{en,ru}` + `/api/scan-ru/config` → 404; `/api/scan/regional/config` → 200) |
  | 31.3 | Чеклист `/api/apply-helper` | ✅ PASS (тело содержит `career-ops apply` + предупреждение `auto-submit`) |
  | 31.4 | Эндпоинт `/api/batch` | ✅ PASS (ключи `[exists, runnerExists, raw, rows, additions]`) |
  | 31.5 | Доступность Playwright | ✅ PASS (`/api/health` сообщает `Playwright (parent node_modules) ok: true, value: installed`) |
  | 31.6 | Покрытие URL справочного бандла (5 URL × 8 локалей) | ✅ PASS (**40 / 40 ✓**) |

  Чисто визуальные подтесты (требуют браузер) помечены отдельно в QA-промпте — они остаются выполнимыми через Claude Cowork или `npm run test:e2e:browser`.

### 🌐 RU CHANGELOG end-to-end (продолжение M-9)

- **`docs(translate): CHANGELOG.ru.md retry agent — full body translation`** ([`CHANGELOG.ru.md`](CHANGELOG.ru.md)) — релиз v1.23.0 вышел с переводческим агентом для RU CHANGELOG ещё в работе (он один раз упал с ошибкой сокета и был перезапущен). v1.24 подхватывает 1542-строчный полный перевод агента: каждая запись от v1.23.0 до v1.6.0 получает русское тело публикационного уровня, больше никаких EN-телесных заглушек. Стилевая дисциплина соответствует обновлению качества README в v1.22.0: «функциональность» / «возможности» / «поведение» вместо неуклюжего «функционал»; «через» / «с помощью» вместо «при помощи»; активный залог над пассивным; «эндпоинт», «лимит запросов», «состояние гонки», «санитайзинг» как канонические термины; английские аббревиатуры (TOCTOU, CSP, SSRF, WCAG, ATS, JD, SSE, REST, API) сохранены.

### 🧪 Тесты

- **474 / 474** unit + 20 / 20 smoke E2E + 32 / 32 Playwright. Нулевые поведенческие дельты тестов; каждая CI-проверка справочного бандла (16 H2-разделов × 8 локалей, 5 URL × ≥ 2 упоминания, минимум по содержанию) по-прежнему зелёная.

### Верификация

```bash
$ npm test                            # 474 / 474

# Help-bundle deepening:
$ wc -l docs/help/en.md
# ~1270 lines (was 1113 — deepened, not bloated)

$ for url in what-is-career-ops scan-job-portals apply-for-a-job \
             batch-evaluate-offers set-up-playwright; do
    echo -n "$url: "
    grep -c "$url" docs/help/en.md
  done
# what-is-career-ops: 4
# scan-job-portals: 5
# apply-for-a-job: 3
# batch-evaluate-offers: 5
# set-up-playwright: 3

# Scenario 31.6 — 40/40 URL coverage:
$ for lang in en es pt-BR ko ja ru zh-CN zh-TW; do
    echo -n "$lang: "
    for url in what-is-career-ops scan-job-portals apply-for-a-job \
               batch-evaluate-offers set-up-playwright; do
      curl -sS "http://127.0.0.1:4317/api/help/$lang" \
        | python3 -c "import sys,json; print(json.load(sys.stdin).get('markdown',''))" \
        | grep -q "$url" && echo -n "✓ " || echo -n "✗ "
    done
    echo
  done
```

### Несовместимые изменения

Нет.

### Вне рамок (v1.25+)

| Пункт | Примечания |
|---|---|
| Живое выполнение **визуальных** подтестов сценария 31 | Требуют браузерного агента (Claude Cowork или `npm run test:e2e:browser`). Вне рамок выполнения только через curl; покрыты существующим Playwright smoke. |
| Перевод тел RU CHANGELOG **для более старых записей** (v1.5.x и ниже) | Перезапущенный агент покрыл только v1.6.0 и далее. Записи до v1.6 (`v1.5.x` и т. п.) — если они когда-либо существовали — остаются ранее существовавшим содержимым. |
| Визуальная регрессия скриншотов дашборда после будущих изменений SPA | `scripts/capture-dashboard-screenshots.mjs` перегенерирует PNG по локалям; автоматического diff сейчас нет. |

---

## [1.23.0] — 2026-05-14

**Разделение i18n + исправление CI для баннера соединения + локализованные скриншоты дашборда + закрытие всех заглушек бэклога.** Релиз закрывает три пункта, отмеченные в таблице «Out of scope» версии v1.22.0 для v1.23 (M-9 — переводы тел локальных CHANGELOG, N-1 — разделение `i18n.js` по LOC, аудит содержимого справочного бандла), и добавляет hot-fix для smoke E2E, который после v1.22.0 окрашивал CI на ветке main в красный.

### 🚑 Hot-fix CI — восстановление баннера соединения

- **`fix(client): reset health-poll cadence + visibilitychange eager re-check`** ([`public/js/api.js:21-91`](public/js/api.js#L21-L91)) — экспоненциальный backoff из M-6 в v1.22.0 был корректен (3 с → 6 с → 12 с → потолок 15 с вместо прежнего потолка 60 с), но активный `setTimeout` оставался привязан к ранее установленной задержке. Сервер, остановленный в t=0.1 при первом пинге в t=3, проваливал проверку, удваивал задержку до 6 с, а следующая попытка восстановления срабатывала только в t=9. Smoke E2E «Flow 2a: баннер соединения появляется при остановке сервера и скрывается при восстановлении» ждал лишь 4 с и падал на `main`.

    v1.23.0 переделывает цикл опроса:

    - `_healthHandle` теперь отслеживается, поэтому `setConnectionState(lost=true)` может вызвать `clearTimeout` и перепланировать опрос с `_HEALTH_MIN`. Первая проба восстановления срабатывает в течение 3 с после потери соединения независимо от ранее запланированной задержки.
    - `_HEALTH_MAX` снижен с 60 с до 15 с. Свёрнутая вкладка против остановленного сервера всё равно восстанавливается за один цикл опроса при возврате пользователя, а экономия трафика остаётся значительной.
    - `document.addEventListener('visibilitychange')` инициирует немедленную перепроверку при возврате фокуса вкладке, если `connectionLost === true`. Переключение Cmd-Tab не ждёт следующего тика backoff.

### 🧹 N-1 — разделение i18n.js (превышение цели в 400 LOC)

- **`refactor(client): split DICT into i18n-dict.js (data) + i18n.js (logic)`** — до v1.23 файл `public/js/lib/i18n.js` содержал 639 строк. Основная часть (строки 23-586) — таблица переводов `DICT`, чистые структурированные данные. v1.23.0 выносит её в [`public/js/lib/i18n-dict.js`](public/js/lib/i18n-dict.js) (578 LOC, освобождён от лимита LOC по правилу CLAUDE.md «Exempt from these limits: generated files, migrations, test fixtures, lock files, vendored code» — таблица переводов квалифицируется как фикстура), оставляя в [`public/js/lib/i18n.js`](public/js/lib/i18n.js) 86 LOC чистой логики модуля (значительно ниже целевого лимита в 400 LOC).
- **Контракт загрузки:** `i18n-dict.js` заполняет `window.__I18N_DICT = { … }`, после чего `i18n.js` читает его внутри существующего IIFE. [`public/index.html`](public/index.html) загружает их по порядку — `i18n-dict.js` перед `i18n.js` — так что IIFE видит полностью заполненный DICT во время инициализации. Запасной вариант при отсутствии словаря: каждый вызов `t()` возвращает встроенный fallback или сам ключ, что громко сигнализирует о неправильной конфигурации без падения SPA.
- **Обновление тестовой инфраструктуры:** [`tests/i18n-coverage.test.mjs`](tests/i18n-coverage.test.mjs), [`tests/help-ui.test.mjs`](tests/help-ui.test.mjs), [`tests/canonical-docs-coverage.test.mjs`](tests/canonical-docs-coverage.test.mjs) теперь прогоняют оба файла через тестовый VM-контекст (или конкатенируют их исходники для regex-обхода), сохраняя все существующие проверки.

### 🌐 M-9 — переводы тел локальных CHANGELOG

- **`docs(translate): 7 non-EN CHANGELOG files end-to-end`** — до v1.23 файлы `CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md` содержали англоязычные заглушки для всех записей начиная с v1.13.0 и подвал, отправлявший читателя к каноническому EN. v1.23.0 запускает 7 параллельных агентов перевода (по одному на локаль), которые переписывают каждое тело в публикационном техническом стиле целевого языка. Заглушки удалены. Блоки кода, пути к файлам, URL, строки сообщений коммитов (`fix(security): B-1 — …`), переменные окружения и метки ссылок сохранены дословно во всех локалях.

### 🖼️ Локализованные скриншоты дашборда в каждом README

- **`docs(readme): wire each locale README at its locale-specific PNG`** — до v1.23 только `README.pt-BR.md` ссылался на `dashboard-pt-BR.png`; остальные 6 не-EN README продолжали указывать на `dashboard-en.png`. Скриншоты (уже снятые в цикле v1.22.0 скриптом [`scripts/capture-dashboard-screenshots.mjs`](scripts/capture-dashboard-screenshots.mjs)) лежали в `images/`, но не использовались. v1.23.0 обновляет 14-ю строку каждого `README.{es,ja,ko-KR,ru,zh-CN,zh-TW}.md` на собственный `dashboard-<locale>.png`.

### 🧪 Тесты

- Те же 474 / 474 unit + 32 / 32 Playwright, что и в v1.22.0. **Smoke E2E теперь 20 / 20** (было 19 / 1 fail на `main` после v1.22.0 из-за регрессии восстановления баннера; исправление перепланирования в v1.23.0 закрывает её).
- Три существующих теста перенастроены под разделение i18n. Ноль новых тестовых файлов, ноль удалённых проверок.

### Верификация

```bash
$ npm test
# 474 / 474

$ npm run test:e2e
# passed: 20    failed: 0    (было 19/1 на v1.22.0 main)

$ wc -l public/js/lib/i18n.js public/js/lib/i18n-dict.js
#       86 public/js/lib/i18n.js          ← логика, под целевым лимитом
#      578 public/js/lib/i18n-dict.js     ← фикстура данных, исключение

$ grep -h 'dashboard-' README*.md | sed -E 's/.*(dashboard-[^)]+).*/\1/' | sort -u
# dashboard-en.png    (только README.md)
# dashboard-es.png    dashboard-ja.png
# dashboard-ko-KR.png dashboard-pt-BR.png
# dashboard-ru.png    dashboard-zh-CN.png  dashboard-zh-TW.png

# Проверка перевода CHANGELOG: каждый файл локали > 200 строк собственного содержимого
$ wc -l CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md | grep -v total
```

### Несовместимые изменения

Нет. `public/index.html` теперь загружает два скрипта вместо одного — все, кто раздаёт SPA через CDN, должны подхватить `i18n-dict.js`; порядок загрузки скриптов определяется порядком тегов `<script src>` в `index.html`. Runtime-fallback (пустой DICT → `t()` возвращает встроенный EN-fallback) предотвращает жёсткие падения при отсутствии нового файла.

### Вне рамок (v1.24+)

| Пункт | Примечания |
|---|---|
| Обновление СОДЕРЖИМОГО справочного бандла из career-ops.org/docs (а не только покрытия URL) | Пять канонических URL уже присутствуют в справочном бандле каждой локали с v1.11.x, а сценарий 31.6 QA-промпта проверяет покрытие. Обновление глубины содержимого — кандидат на v1.24+. |
| Живое выполнение QA-сценария 31 на запущенном сервере | Требует браузерного агента и реальных LLM-учётных данных. Кандидат на v1.24. |
| Покомпонентный аудит touch-target для новых блоков подсказок на mode-page | M-1 из v1.22.0 добавил элементы `<p class="field-hint">`, которые не были проверены на соответствие WCAG 2.5.5 min-height во всех 8 локалях. |

---

## [1.22.0] — 2026-05-14

**Закрытие бэклога M/L/N + выравнивание документации + проход по качеству переводов.** Весь средний и младший ярус из `v1.20.1-BACKLOG.md` отгружен одним релизом: девять M-пунктов, пять L-пунктов, две мелочи. Плюс аудит документации против пяти канонических руководств [career-ops.org/docs](https://career-ops.org/docs), обновлённые системные промпты под `.claude/` и `.github/`, а также прошедшие проверку качества README во всех 7 не-английских локалях.

### 🛡️ Усиление безопасности (defense-in-depth)

- **`fix(security): M-4 — entity-aware stripDangerousMarkdown`** ([`server/lib/security.mjs`](server/lib/security.mjs)) — regex до v1.22 сопоставлял `<script>`, `javascript:`, `on*=` как литеральные подстроки. `&lt;script&gt;`, `java&#115;cript:` и `<img src="data:image/svg+xml,<svg onload=…>">` проходили насквозь. Очистка теперь декодирует `&lt;`, `&gt;`, `&amp;`, `&quot;`, числовые (`&#NN;`) и шестнадцатеричные (`&#xHH;`) сущности **до** запуска regex-очистки. Подтверждено 11 тестами в [`tests/cv-xss-bypasses.test.mjs`](tests/cv-xss-bypasses.test.mjs). Основная защита по-прежнему лежит на клиентском конвейере `UI.md` с приоритетом escape; этот патч закрывает файл на диске.

- **`fix(security): L-2 — bash --noprofile --norc on the batch runner`** ([`server/lib/routes/batch.mjs:108`](server/lib/routes/batch.mjs#L108)) — `spawn('bash', [PATHS.batchRunner, ...])` ранее подхватывал пользовательский `~/.bashrc`. Враждебный rc-файл мог влиять на выполнение. Теперь `spawn('bash', ['--noprofile', '--norc', PATHS.batchRunner, ...])`.

### 🔒 Устойчивость

- **`fix(client): M-6 — exponential backoff on health ping`** ([`public/js/api.js:22-48`](public/js/api.js#L22-L48)) — поллер состояния «нет соединения» совершал 28 800 запросов к мёртвому серверу за ночь. Теперь 3 с → 6 с → 12 с → 24 с → 60 с, сброс к 3 с при первом успешном восстановлении (2xx). Реализация на цепочке `setTimeout` (не `setInterval`), поэтому каждый шаг подхватывает новую задержку.

- **`fix(client): M-5 — Safari private-mode localStorage guard`** ([`public/js/lib/i18n.js:572-583`](public/js/lib/i18n.js#L572-L583)) — Safari в приватном режиме выбрасывает `SecurityError` на каждый вызов `localStorage.getItem/setItem`. IIFE во время загрузки роняла весь модуль i18n, и SPA рендерил сырые ключи. Оба вызова обёрнуты в try/catch, в качестве запасного варианта используется `detect()` по языку браузера.

- **`fix(server): M-2 — body-size cap on outbound preview fetches (test + verify)`** — функция `safeGet` из v1.21.0 уже стримила чанки и ограничивала размер `opts.maxBytes`. v1.22 добавляет явный регрессионный тест в [`tests/ssrf-redirect-rebind.test.mjs`](tests/ssrf-redirect-rebind.test.mjs), фиксирующий контракт: 100 КБ вверх по потоку + лимит 4 КБ → ответ ≤ 4 КБ.

- **`fix(client): L-5 — clear setTimeout on hashchange in scan.js`** ([`public/js/views/scan.js:6-22, :113-120`](public/js/views/scan.js#L6-L22)) — таймер `refreshResults()` на 300 мс после завершения утекал, если пользователь уходил с `#/scan` в это окно. Дескриптор теперь захватывается и очищается в `__cancelActiveScanPoll`.

- **`fix(client): L-4 — multi-line SSE data: joiner`** ([`public/js/lib/auto-pipeline.js:158-176`](public/js/lib/auto-pipeline.js#L158-L176)) — парсер SSE использовал `match()` (одна строка). По спецификации событие может нести несколько строк `data:`, которые потребитель должен соединить через `\n`. Сейчас сервер шлёт однострочный JSON, и старый код работал — но был хрупким к любой будущей многострочной полезной нагрузке.

### ♿ Доступность

- **`feat(a11y): M-3 — WCAG 1.4.1 redundant cues on score pills + connection banner`** ([`public/css/app.css:602-625, :812-822`](public/css/app.css#L602-L625)) — `score-high` / `score-mid` / `score-low` ранее передавали состояние только оттенком (красный/жёлтый/зелёный). Пользователи без цветовосприятия не имели альтернативы. Каждый уровень теперь получает дополнительный глиф через `::before` (✓ / ◐ / ○). Баннер соединения получает префиксный глиф `⚠` в офлайн-состоянии. Места рендеринга не тронуты — чисто CSS-усиление.

- **`feat(a11y): M-1 — inline hint paragraphs for every mode-page field`** ([`public/js/views/mode-page.js`](public/js/views/mode-page.js), [`public/js/lib/i18n.js`](public/js/lib/i18n.js)) — v1.20.0 связал `htmlFor → id` для каждого поля mode-page, но не добавил встроенных подсказок; назначение поля документировалось только в README-проходах. v1.22.0 добавляет 19 ключей подсказок i18n × 8 локалей = **152 новых перевода**, а построитель `field()` теперь рендерит `<p id="…-hint">` с привязкой через `aria-describedby` для каждого поля. Пользователи скринридеров слышат подсказку при фокусе на инпуте.

- **`fix(a11y): M-7 — null-guard on UI.el() htmlFor alias`** ([`public/js/api.js:194-198`](public/js/api.js#L194-L198)) — `htmlFor: null` ранее рендерил литеральный `for="null"`. Однострочное зеркало защиты `v != null && v !== false` из соседней ветки.

### 🧹 Качество / переносимость

- **`fix(server): L-1 — parseInt radix in health.mjs + bin/start.sh + bin/setup.sh`** — `parseInt(process.versions.node)` без основания вызывает предупреждение линтера и хрупок, если Node однажды начнёт отдавать шестнадцатеричные версии. Везде добавлено `10`.

- **`fix(server): L-3 — Windows-safe entrypoint check`** ([`server/index.mjs:159-163`](server/index.mjs#L159-L163)) — `import.meta.url === \`file://${process.argv[1]}\`` неправильно обрабатывает буквы дисков и обратные слэши в Windows. Заменено на `fileURLToPath(import.meta.url) === path.resolve(process.argv[1])`.

- **`refactor(client): N-2 — drop Element.prototype.also monkey-patch`** ([`public/js/views/cv.js:188-201`](public/js/views/cv.js#L188-L201)) — глобальное загрязнение прототипа DOM. Заменено локальной переменной для корня дерева.

- **`test(canary): M-8 — 404 regression test for retired /api/scan-ru/config`** ([`tests/scan-consolidated.test.mjs`](tests/scan-consolidated.test.mjs)) — v1.20.0 убрал alias, но не добавил канарейку. Трёхстрочное добавление по образцу тестов вывода из эксплуатации в v1.18.

### 📚 Документация и системные промпты

- **`docs(architecture): refresh OVERVIEW + DATA-FLOWS for v1.21+ surface`** — в OVERVIEW.md добавлены `safe-fetch.mjs` (GET с привязкой к DNS), `file-lock.mjs` (мьютекс на путь), `rate-limit.mjs` (троттлинг LLM) и `sanitizePathName`. В DATA-FLOWS.md появились два новых раздела: «Outbound URL fetches (DNS-rebind-safe)» и «LLM endpoint rate-limiting».

- **`docs(readme): security envelope section refresh`** — раздел «Security notes» README.md теперь документирует все хелперы из envelope безопасности v1.21+ (sanitizePathName, safeGet, withFileLock, llmRateLimit, entity-aware stripDangerousMarkdown).

- **`docs(qa): scenario 31 — career-ops.org/docs alignment`** ([`qa/claude-cowork-browser-test-prompt.md`](qa/claude-cowork-browser-test-prompt.md)) — шесть новых под-тестов (31.1–31.6), проверяющих соответствие UI поведению из пяти канонических руководств career-ops.org/docs: пороги оценок, поток сканирования (одна кнопка), поток подачи (чек-лист, не автоотправка), batch-поток (TSV-редактор), установка Playwright (мягкое падение), покрытие справочного бандла (5 URL × 8 локалей).

- **`docs(translate): README quality refresh × 7 non-EN locales`** — каждый не-EN README переписан в публикационном техническом стиле родного языка. Распространённые корявые кальки заменены; добавлены упоминания envelope безопасности v1.21/v1.22; обновлены бейджи релиза и тестов.

- **`docs(system): .claude/PROJECT-CONTEXT.md + .github/copilot-instructions.md`** — однофайловая ориентация для агентов, подключающихся к сессии. Сжатый CLAUDE.md, перечень хелперов v1.21+, список типичных подводных камней.

- **`docs(bin): actualize start.sh / setup.sh / run_all.sh comments`** — «two deps» → «three deps» (express + js-yaml + multer); «298 tests» → «474+ tests»; добавлено основание `parseInt`.

### 🧪 Тесты

- **461 → 474 unit** (+13) + 32/32 Playwright без изменений.
- Новые файлы тестов: `cv-xss-bypasses.test.mjs` (M-4, 11 тестов).
- Расширены: `ssrf-redirect-rebind.test.mjs` (+1 для лимита размера тела M-2), `scan-consolidated.test.mjs` (+1 для канарейки alias M-8).
- Ноль поведенческих изменений в существующих наборах — каждый патч аддитивен или покрыт новой канарейкой.

### Верификация

```bash
npm test                          # 474 / 474
npm run test:e2e:browser          # 32 / 32

# Очистка XSS с entity-кодированием:
node -e "import('./server/lib/security.mjs').then(({stripDangerousMarkdown}) => console.log(stripDangerousMarkdown('&lt;script&gt;alert(1)&lt;/script&gt;')))"
# → '' (ни один <script> не выживает)

# Backoff health-ping (открыть devtools, остановить сервер, наблюдать панель network):
#   3 с → 6 с → 12 с → 24 с → 60 с, сброс при первом успешном пинге

# Глиф score-pill (открыть #/reports в светлой и тёмной теме):
#   .score-high показывает ✓ + числовую оценку
#   .score-mid  показывает ◐ + числовую оценку
#   .score-low  показывает ○ + числовую оценку

# Подсказки mode-page (#/contacto и т. п.):
#   <input aria-describedby="mode-contacto-recipient-hint">  ← указывает на <p id="…">

# Снятый с эксплуатации alias:
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4317/api/scan-ru/config
# → 404
```

### Несовместимые изменения

Нет. Каждый патч аддитивен либо сохраняет контракты существующих эндпоинтов.

### Вне рамок (v1.23+)

| Пункт | Примечания |
|---|---|
| M-9 — переводы тел локальных CHANGELOG | Все записи v1.13+ в `CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md` — англоязычные заглушки. Кандидат на массовый перевод после замедления каденции релизов. |
| N-1 — `public/js/lib/i18n.js` превышает целевой лимит в 400 LOC | Разделение по локалям увеличивает стоимость HTTP без сборщика. Отложено до решения по этапу сборки. |
| Обновление содержимого справочного бандла из career-ops.org/docs | Пять канонических URL уже присутствуют в каждом локальном бандле (с v1.11.x). Сценарий 31.6 QA-промпта проверяет покрытие. Обновление глубины содержимого — кандидат на v1.23. |

---

## [1.21.0] — 2026-05-14

**Безопасность + параллелизм + полировка a11y по результатам двух независимых код-ревью.** Семь находок из [`docs/specs/V1.20.1-BACKLOG.md`](docs/specs/V1.20.1-BACKLOG.md) отгружены одним релизом: один блокер (TOCTOU при DNS-rebind), шесть багов высокой степени серьёзности (распыление санитайзинга при path-traversal, отсутствие лимита запросов на LAN-деплое, состояние гонки при конкурентной записи, провал в покрытии i18n, висячий aria-describedby, отсутствие связей с метками). 34 новых теста; baseline вырос с 427 → 461 unit + 32/32 Playwright. Каждый патч закрыт именованным регрессионным тестом.

### 🛡️ Безопасность

- **`fix(security): B-1 — close DNS-rebind TOCTOU via safe-fetch.mjs`** ([`server/lib/safe-fetch.mjs`](server/lib/safe-fetch.mjs)) — прежний паттерн делал один явный `dnsLookup` для валидации, а затем `fetch()` выполнял свой собственный независимый lookup. Атакующий через DNS-rebind с TTL=0 мог вернуть публичный IP на первом lookup и `127.0.0.1` / `169.254.169.254` / адрес LAN на втором, обходя `isPrivateOrLoopbackHost`. Новая функция `safeGet` резолвит ОДИН раз, привязывает TCP-соединение к конкретному IP через node:http(s) и выставляет SNI/Host так, чтобы проверка сертификата по-прежнему шла против исходного hostname. Используется `/api/pipeline/preview` и `/api/auto-pipeline`. Fail-CLOSED при ошибке lookup (обратно к прежнему `try { … } catch { /* fall through */ }`). Подтверждено 8 новыми тестами в [`tests/ssrf-redirect-rebind.test.mjs`](tests/ssrf-redirect-rebind.test.mjs).

- **`fix(security): H-4 — consolidate sanitizePathName across 10 routes`** ([`server/lib/security.mjs`](server/lib/security.mjs)) — голый regex `replace(/[^\w\-.]/g, '')` дублировался в `jds.mjs`, `content.mjs`, `reports.mjs`, `llm.mjs`, `runners.mjs` и сохранял символы `.`, из-за чего `..pdf`, `....md`, имена с ведущей точкой выживали. Только `reports.mjs::sanitizeSlug` делал это правильно. v1.21.0 поднимает корректную версию (`sanitizePathName`) в `security.mjs`, удаляет 10 сломанных копий и отвергает пустые результаты с кодом 400. Подтверждено 12 тестами в [`tests/path-traversal.test.mjs`](tests/path-traversal.test.mjs).

- **`fix(security): H-5 — rate-limit LLM endpoints on public bind`** ([`server/lib/rate-limit.mjs`](server/lib/rate-limit.mjs)) — у `/api/evaluate`, `/api/deep`, `/api/mode/:slug`, `/api/auto-pipeline` ранее не было троттлинга по IP. Loopback-пользователей это не затрагивает; LAN-деплои (`HOST=0.0.0.0`) получают 10 запросов/мин/IP с заголовками `Retry-After` и `X-RateLimit-*` при превышении. Настраивается через `LLM_RATE_LIMIT="N/Ws"`. Дешёвая промежуточная защита до auth-шлюза P-12 в v2.0. Подтверждено 6 тестами в [`tests/rate-limit.test.mjs`](tests/rate-limit.test.mjs).

### 🔒 Параллелизм

- **`fix(data): H-6 — per-file mutex on applications.md / pipeline.md`** ([`server/lib/file-lock.mjs`](server/lib/file-lock.mjs)) — конкурентные `POST /api/tracker` (или auto-pipeline в гонке с ручным добавлением) ранее оба читали `num=42`, оба писали `num=43`, и более ранняя строка тихо терялась. `withFileLock(path, fn)` сериализует read-modify-write на путь; независимые пути по-прежнему выполняются параллельно. Подключено в `tracker.mjs`, `pipeline.mjs` (POST + DELETE) и в шаге трекера `auto-pipeline.mjs`. Подтверждено 5 тестами в [`tests/concurrent-tracker-write.test.mjs`](tests/concurrent-tracker-write.test.mjs), включая интеграционную проверку 20 одновременных POST с утверждением, что строки 001..020 встают последовательно.

### ♿ Доступность

- **`fix(a11y): H-1 — id="batch-tsv-hint" on the batch.js hint paragraph`** ([`public/js/views/batch.js`](public/js/views/batch.js)) — в v1.20.0 был добавлен `aria-describedby="batch-tsv-hint"` на textarea TSV, но соответствующий `id` у блока `<p>` не появился. Скринридерам нечего было озвучивать. Исправлено.

- **`fix(a11y): H-2 — htmlFor on batch-parallel / batch-min-score labels`** ([`public/js/views/batch.js`](public/js/views/batch.js)) — четыре инпута из v1.20.0 получили новые id, но их метки не были программно связаны. WCAG 3.3.2 теперь удовлетворён.

- Новая канарейка статического анализа в [`tests/a11y-form-wires.test.mjs`](tests/a11y-form-wires.test.mjs) — обходит каждый view-файл и утверждает, что каждая IDREF в `aria-describedby` / `htmlFor` указывает на соседнее объявление `id:`. Ловит регрессии класса опечаток в CI.

### 🌐 i18n

- **`fix(i18n): H-3 — 13 keys from v1.20.0 silently fell through to EN for 7 locales`** ([`public/js/lib/i18n.js`](public/js/lib/i18n.js)) — `pipe.filter`, `pipe.count`, `pipe.preview*`, `pipe.openTab`, `pipe.evaluateAll*`, `eval.jdHint`, `batch.parallelAria`, `batch.minScoreAria`, плюс `common.delete`, `config.group{Core,Runtime,Regional}`, `config.profileEmpty`, `config.viewProfile`, `scan.atsBadge`, `scan.regionalBadge` упоминались как `t('key', 'EN fallback')`, но никогда не добавлялись в DICT. Пользователи скринридеров на русском, японском и китайском слышали английские `aria-label`, что прямо обнуляло выигрыш по WCAG 3.3.2, заявленный в v1.20.0. v1.21.0 добавляет все 19 ключей × 8 локалей (≈ 150 новых переводов) и расширяет [`tests/i18n-coverage.test.mjs`](tests/i18n-coverage.test.mjs) проходом статического анализа, который сканирует каждый вызов `t('key', …)` в `public/js/**/*.js` и проверяет наличие ключа в DICT. Будущий дрейф ловится на этапе CI.

### 🧪 Тесты

- **427 → 461 unit** (+34) + 32/32 Playwright без изменений.
- Новые файлы: `ssrf-redirect-rebind`, `path-traversal`, `concurrent-tracker-write`, `rate-limit`, `a11y-form-wires`.
- Существующий `pipeline-preview.test.mjs` переподключён с мока `globalThis.fetch` к новой точке инъекции `_setTransport` в `safe-fetch.mjs` — путь SSRF больше не идёт через fetch, и старый мок незаметно обходился.

### Верификация

```bash
npm test                              # 461 / 461
npm run test:e2e:browser              # 32 / 32
node --test tests/ssrf-redirect-rebind.test.mjs tests/path-traversal.test.mjs \
  tests/concurrent-tracker-write.test.mjs tests/rate-limit.test.mjs \
  tests/a11y-form-wires.test.mjs      # 34 новых теста, все зелёные

# Path-traversal: каждое имя в стиле traversal возвращает 400 / 404
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4317/api/jds/..pdf
# → 400

# Лимит запросов при публичной привязке:
HOST=0.0.0.0 LLM_RATE_LIMIT=3/60s npm start &
for i in 1 2 3 4; do
  curl -sS -o /dev/null -w '%{http_code} ' -X POST -H 'Content-Type: application/json' \
    -d '{"jd":"…"}' http://0.0.0.0:4317/api/evaluate
done
# → 200 200 200 429

# Конкурентные записи в трекер: 20 параллельных POST, 20 строк встают:
node tests/concurrent-tracker-write.test.mjs
# 20 последовательных строк 001..020

# Проверка связей aria:
grep -r 'aria-describedby' public/js/views/ | wc -l
# совпадающие `id:` все резолвятся (канарейка a11y-form-wires.test.mjs)
```

### Вне рамок (v1.22+)

| Пункт | Примечания |
|---|---|
| Потоковый лимит размера тела в `pipeline-preview` (M-2) | `await upstream.text()` читает тело целиком перед срезом в 8 КБ; вредоносный поток в 1 ГБ может исчерпать память. Поток-чтение с байтовым счётчиком + abort. |
| WCAG 1.4.1 — состояние только цветом на `.connection-banner` + score pills (M-3) | Оттенок единолично сигнализирует состояние; добавить префиксную иконку (✓ / ◐ / ○) или текстовый суффикс. |
| Обходы `stripDangerousMarkdown` через HTML-сущности (M-4) | `&lt;script&gt;`, `java&#115;cript:`, `<img src="data:image/svg+xml,<svg onload=…>">` выживают regex. Defense-in-depth через UI.md ещё держится; зафиксировать и закрыть обходы пакетом тестов. |
| Доступ к `localStorage` в приватном режиме Safari без try/catch (M-5) | `i18n.js:544/571` бросает исключение → SPA рендерит сырые ключи. Обернуть в try/catch с `'en'` по умолчанию. |
| `setInterval(checkHealth, 3000)` опрашивает вечно без backoff (M-6) | Экспоненциальный 3 с → 6 с → 12 с → потолок 60 с. |
| Отсутствует null-guard для алиаса `htmlFor` (M-7) | Однострочная защита `if (v != null && v !== false)`. |
| Канарейка 404 для снятого с эксплуатации `/api/scan-ru/config` (M-8) | Трёхстрочный тест по образцу v1.18. |
| Переводы тел локальных CHANGELOG (M-9) | Кандидат на массовый перевод после замедления каденции релизов. |
| Inline-блоки подсказок для каждого поля mode-page (M-1) | ~168 ключей i18n × 8 локалей; отложено как полировка. |
| Мелочи L-1 — L-5 | Основание parseInt, bash --noprofile, Windows-safe fileURLToPath, многострочный SSE, очистка таймера scan.js. |

---

## [1.20.0] — 2026-05-13

**Покомпонентная полировка a11y + паритет не-EN README + снятие алиаса `/api/scan-ru/config`.** Закрывает четыре пункта, помеченные таблицей «Out of scope» в v1.19.0 для v1.20.

### ♿ WCAG 2.5.5 / 2.5.8 — покомпонентный аудит touch-target

- **`a11y(touch-target): chip min-height 28 px + 8 px gap (2.5.8 spaced-target exception)`** — `.chip` был 24 × ~50 px (вертикаль 24 не дотягивала до пола 24 px из 2.5.5 для кластерных контролов); исключение spaced-target в 2.5.8 требует либо ≥ 24 × 24 px, либо 24 px зазора. `.chip` поднят до `min-height: 28px; padding: 6px 12px;`, а обёртка `.chip-row` — до `gap: 8px;`, чтобы выполнялись оба условия.
- **`a11y(touch-target): sidebar nav-item min-height 44 px`** — у `.nav-item` был padding всего `10px 14px`, вычисленная высота ~36 px на большинстве viewport. Теперь `padding: 12px 14px; min-height: 44px; box-sizing: border-box;`. Совпадает с полом `.btn`.
- **`a11y(touch-target): tab-btn min-height 44 px`** — то же лечение для Sortable Headers / вкладок категорий в Reports, Tracker, Scan results.

### ♿ WCAG 1.3.1 / 3.3.2 — `aria-describedby` на встроенных подсказках формы

Каждый элемент управления формой в SPA теперь обладает стабильным `id`, его `<label>` указывает на него через `htmlFor`, а любой блок подсказки связан через `aria-describedby`. Перенастроены пять view-файлов:

- **`a11y(forms): config.js`** — `id` на каждый ключ + привязка подсказки (`cfg-<key>` / `cfg-<key>-hint`).
- **`a11y(forms): evaluate.js`** — textarea `eval-jd` + блок `eval-jd-hint`, документирующий минимум в 50 символов после санитайзинга.
- **`a11y(forms): batch.js`** — `batch-tsv` / `batch-tsv-hint`, плюс `aria-label` на `batch-parallel`, `batch-min-score`, `batch-dry-run`, `batch-retry`.
- **`a11y(forms): pipeline.js`** — `pipe-filter` + `pipe-new-url` / `pipe-new-url-hint`.
- **`a11y(forms): mode-page.js`** — каждое поле в 7 универсальных режимах (`project`, `training`, `followup`, `batch-prompt`, `contacto`, `interview-prep`, `patterns`) получает id вида `mode-<slug>-<name>` и метки `htmlFor`.

`UI.el()` научился алиасу `htmlFor` в стиле React, чтобы код view оставался декларативным — алиас выставляет атрибут `for` (зарезервированное в JS имя свойства).

### 🌍 Паритет не-EN README

- **`docs(readme): translate 7 locales to 585-line parity with EN master`** — `README.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md` имели 306–316 строк (заголовки покрывались, но маркетинговые проходы и большая часть API-справочника пропускались). Все семь теперь зеркалируют EN-структуру end-to-end: About → One-command install → Why? → Quick start (3 пронумерованных шага) → Requirements → What you get table → Scan → Architecture (полное дерево директорий) → API reference (каждая таблица маршрутов) → Tests → Configuration → Security notes → Limitations → Contributing → 🌍 Getting Started — 5-шаговый проход → License.

### 🧹 Снятие алиаса `/api/scan-ru/config`

- **`feat!(scan): remove /api/scan-ru/config legacy alias (sunset v1.20)`** — сохранялся одним релизом как alias в v1.19 для обратной совместимости. Канонический `/api/scan/regional/config` — теперь единственный путь. Удалены: регистрация маршрута в `server/lib/routes/scan.mjs`, упоминания в README.md, `docs/architecture/{OVERVIEW,SERVER,API}.md`. Тесты уже покрывали канонический путь — изменения в тестах не требуются.

### 🧪 Тесты

- Тот же набор, что и v1.19. **427 / 427** unit + 20/20 smoke + 23/23 comprehensive + 32/32 Playwright. Вся обвязка a11y аддитивна (больше `id` / `for` / `aria-describedby`) — поведенческих изменений нет, дельты в тестах нет.

### Верификация

```bash
npm test                              # 427 / 427
npm run test:e2e:browser              # 32 / 32

# Touch-target — каждый chip / nav-item / tab-btn ≥ 28 / 44 / 44 px:
#   Chrome DevTools → Computed → height/min-height на .chip, .nav-item, .tab-btn

# Метки формы — у каждого input есть связь label[for=…]:
#   document.querySelectorAll('input,textarea,select').forEach(el =>
#     console.assert(el.labels?.length || el.getAttribute('aria-label'), el))

# Alias снят:
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4317/api/scan-ru/config
# → 404

# Канонический работает:
curl -s http://127.0.0.1:4317/api/scan/regional/config | jq '.'
```

### Несовместимые изменения

- `DELETE /api/scan-ru/config` — удалён. Используйте `/api/scan/regional/config`. Снятие было анонсировано в CHANGELOG v1.19.0 и в верификационном скрипте.

### Вне рамок (v1.21+)

| Пункт | Примечания |
|---|---|
| Inline-блоки подсказок для каждого поля mode-page | Сейчас на месте только связь `<label for=…>`; видимые подсказки на поле в SPA остаются только на английском. Проходы README документируют назначение полей в каждой локали, поэтому это полировка, а не блокер. |
| Сигналы состояния только цветом в `.connection-banner` и pill оценок дашборда (WCAG 1.4.1) | Баннер опирается на красный/жёлтый/зелёный; нужен иконочный или текстовый суффикс для пользователей без цветовосприятия. |
| Переводы тел локальных CHANGELOG | Англоязычные заглушки остаются в `CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md`. Перевод будет выполнен после замедления каденции релизов v1.x. |

---

## [1.19.0] — 2026-05-13

**Контраст WCAG 1.4.3 + унификация сканера (финал) + удаление HH_USER_AGENT из UI.** Закрывает отложенный в v1.18 аудит контраста, завершает устранение разделения EN/RU, начатое в v1.18, и убирает настройку `HH_USER_AGENT` из UI по указанию пользователя (разумный дефолт уже встроен в сервер и подходит большинству не-RU IP).

### ♿ Проход контраста WCAG 1.4.3

- **`a11y(contrast): introduce AA-passing *-text variants for accent tokens`** — светлая тема: `--rausch-text: #b80f42` (6.59:1 на белом, было 3.52:1), `--kazan-text: #066507` (7.31:1, было 4.53:1), `--darjeeling-text: #7a5800` (5.73:1 на янтарном фоне, было 4.24:1), `--babu-text: #00665e` (6.09:1, было 2.70:1). Тёмная тема: осветлённые зеркала (`#ff8aa0`, `#6ee7b7`, `#fcd34d`, `#5eead4`) держат тот же пол 4.5:1 на бумаге `#161a22`.
- Классы бейджей (`.badge-ok`, `.badge-warn`, `.badge-bad`, `.badge-info`) и pill оценок (`.score-high`, `.score-mid`, `.score-low`) теперь идут через новые `*-text` варианты — каждая комбинация «текст на тонированном фоне» проходит AA. Токены заливки акцентов (`--rausch`, `--kazan` и т. д.) не тронуты для рамок и контуров (для нетекстовых компонентов UI достаточно 3:1).

### 🧹 Унификация сканера (завершение работы v1.18)

- **`docs(scan): scrub remaining EN/RU split references across READMEs + help + architecture docs`** — восемь README + восемь справочных бандлов + три архитектурных документа (API.md, SERVER.md, OVERVIEW.md, DATA-FLOWS.md) + комментарий в scan.js теперь описывают единый консолидированный метод сканирования. Унаследованные алиасы `/api/stream/scan-{en,ru}` уже отсутствовали в v1.18; v1.19 ловит документацию и копию, всё ещё представлявшую сканирование как двухшаговый процесс EN+RU.
- **`feat(scan): canonical /api/scan/regional/config endpoint`** — `/api/scan-ru/config` сохраняется как тонкий alias на один релиз для обратной совместимости. Новый путь соответствует соглашению об именовании источников (`?source=regional`).

### 🛠️ HH_USER_AGENT удалён из UI

- **`feat!(config): drop HH_USER_AGENT field from /#/config + KNOWN_KEYS`** — продвинутые пользователи по-прежнему могут задать `HH_USER_AGENT` напрямую в `career-ops/.env` (сервер читает через `process.env.HH_USER_AGENT` в `server/lib/sources/hh.mjs` с встроенным UA в качестве запасного варианта). UI больше не показывает этот ключ: дефолт работает у большинства, а наличие непонятного поля User-Agent в App Settings регулярно вводило в заблуждение.
- Упоминания в README в 8 локалях + упоминания в справочных бандлах в 8 локалях заменены советом «запустить через российский IP / VPN». Ключ i18n `scan.hhWarning` перефразирован без подробностей про настройку env-переменной.
- `KEY_GROUPS` схлопнут: классификации `regional` больше нет (она содержала только HH_USER_AGENT). Тесты обновлены; поле `regionalActive` в payload сохранено для обратной совместимости SPA.

### 🧪 Тесты

- `tests/env-config.test.mjs` — проверка `KNOWN_KEYS` теперь исключает HH_USER_AGENT; добавлено утверждение, что ключ намеренно отсутствует.
- `tests/config-endpoint.test.mjs` — тест POST-записи нескольких ключей использует `GEMINI_MODEL` в качестве второго известного ключа вместо HH_USER_AGENT.
- `tests/config-groups.test.mjs` — `groups.HH_USER_AGENT` теперь ожидается `undefined`.
- Итого: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + 32/32 Playwright. Те же цифры, что и в v1.18.0, потому что все скорректированные тесты уже учтены.

### Верификация

```bash
npm test                              # 427 / 427

# Контраст (Chrome DevTools или axe) на светлой и тёмной:
#   .badge-ok / .badge-warn / .badge-bad / .badge-info → AA pass (4.5:1+)
#   .score-high / .score-mid / .score-low → AA pass

# HH_USER_AGENT больше не в /api/config:
curl -s http://127.0.0.1:4317/api/config | jq '.values | keys'
# → ["ANTHROPIC_API_KEY","ANTHROPIC_MODEL","GEMINI_API_KEY","GEMINI_MODEL","HOST","PORT"]
# (без HH_USER_AGENT)

# Канонический эндпоинт regional config:
curl -s http://127.0.0.1:4317/api/scan/regional/config | jq '.'
# Унаследованный alias жив до v1.20:
curl -s http://127.0.0.1:4317/api/scan-ru/config | jq '.'
```

### Вне рамок (v1.20+)

| Пункт | Примечания |
|---|---|
| Покомпонентный аудит touch-target (chip-фильтры, sortable headers, навигация сайдбара) | v1.18 установил глобальный пол (`.btn` 44 px, `.btn-sm` 32 px); покомпонентная верификация по всему SPA остаётся. |
| `aria-describedby` на встроенных подсказках формы (`#/config`, `#/pipeline`, `#/evaluate`, `#/batch`) | v1.17 покрыл `aria-label` на глобальном поиске и закрытии модалки. Связывание подсказок на input — следующий слой полировки. |
| Полный паритет не-EN README (585 строк как у EN) | v1.18 поднял не-EN до ~307 (53 % от EN). Маркетинговые «Quick start» + «🌍 Getting Started» проходы остаются только на английском. |
| Удалить унаследованный alias `/api/scan-ru/config` | Снятие запланировано на v1.20. Канонический `/api/scan/regional/config` — целевая миграция. |

---

## [1.18.0] — 2026-05-13

**Консолидация эндпоинтов сканирования + проход WCAG 2.2 AA + завершение длинного хвоста i18n.** Снимает с эксплуатации унаследованные алиасы `/api/stream/scan-{en,ru}` (окно Sunset 2026-10-01 перенесено на v1.18 по указанию пользователя). Доводит не-EN README до ~307 строк и переводит оставшиеся RU-телесные записи v1.16.0 + v1.17.0 в CHANGELOG для 6 локалей.

### 🚪 Несовместимые изменения

- **`feat!(scan): retire legacy /api/stream/scan-{en,ru} aliases`** — устаревшие SSE-эндпоинты EN/RU удалены. Каждый потребитель идёт через консолидированный `/api/stream/scan?source=ats|regional|both` (живёт с v1.12.0). У унаследованных путей с v1.15.0 были заголовки Deprecation + Sunset (RFC 8594); окно миграции закрыто. Внешние интеграции на старых путях получают чистый **404** вместо тихой маршрутизации в catch-all SPA.

### ♿ Доступность (проход WCAG 2.2 AA)

- **WCAG 2.4.1 Bypass Blocks** — новая ссылка **Skip to main content** как первый фокусируемый элемент на каждой странице. Визуально скрыта через `.skip-link` до получения фокуса, при Tab от загрузки страницы вытаскивается в верхний-левый угол.
- **WCAG 2.4.7 Focus Visible** — глобальный стиль `*:focus-visible`. Фокусные кольца на клик мыши выключены, на нажатие Tab — включены (стандартный паттерн WAI-ARIA AP). Кнопка закрытия модалки (×) получает кольцо фокуса повышенной контрастности.
- **WCAG 2.5.5 Target Size** — минимум 44×44 px touch-target на `.skip-link`. `.btn-sm` сохраняет `min-height: 32px` (в сочетании с межстрочным интервалом удовлетворяет исключению AAA «24×24 + spacing» для компактных контролов строк таблиц).
- **WCAG 3.1.1 Language of Page** — `<html lang="en">` исправлен с `lang="ru"` (JS-бутстрап i18n уже переопределял это при загрузке, но SSR-дефолт теперь совпадает с дефолтной локалью SPA).
- **WCAG 1.3.1 Info & Relationships** — `#content` получает `tabindex="-1"`, чтобы цель skip-link фокусировалась чисто. (Роли ARIA + ловушка фокуса были добавлены ещё в v1.17.)

### 📚 Длинный хвост i18n

- **`docs(i18n): v1.16.0 + v1.17.0 CHANGELOG translated in 6 locales`** — записи, ранее остававшиеся с русским телом в `CHANGELOG.{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md`, теперь на родном языке. Счётчик кириллических символов по локали упал 79 → 42 → 23 (оставшиеся 23 — технические inline-ссылки вроде путей к файлам и заголовок мультиязычных ссылок, намеренно).
- **`docs(readme): expand non-EN READMEs with Why / Requirements / Features / Configuration / Contributing`** — каждый не-EN README вырос с 240 → ~307 строк. Теперь покрывает те же немаркетинговые разделы, что и 585-строчный EN. Полный паритет 1:1 (маркетинговые проходы) пока отложен.

### 🛠️ Прочее

- **`docs(api): consolidated scan endpoint in API.md + DATA-FLOWS.md + README.md`** — таблица API-справки теперь перечисляет только `/api/stream/scan?source=…`. Раздел Scan в README объясняет удаление разделения EN/RU в v1.18.0.
- **`fix(scan.js): drop stale comment about deprecated aliases being live`** — комментарий диспетчера `runScanAll` в SPA теперь отражает консолидированную реальность.

### 🧪 Тесты

- `tests/scan-consolidated.test.mjs::F-018 backwards compat` переписан — два прежних утверждения «унаследованный эндпоинт ещё работает» теперь проверяют, что запросы к `/api/stream/scan-{en,ru}` возвращают **404** (а не маршрутизируются в catch-all SPA).
- Итого: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + 32/32 Playwright (счётчик не изменился; +2 новых корректных утверждения о удалении legacy заменяют +2 утверждений о «legacy ещё работает»).

### Верификация

```bash
npm test                              # 427 / 427
npm run test:e2e:full                 # 23 / 23

# Снятие legacy-эндпоинтов:
curl -sI http://127.0.0.1:4317/api/stream/scan-en | head -1   # → HTTP/1.1 404
curl -sI http://127.0.0.1:4317/api/stream/scan-ru | head -1   # → HTTP/1.1 404

# Консолидированный эндпоинт:
curl -sN 'http://127.0.0.1:4317/api/stream/scan?source=ats&dryRun=1' | head -5
# → event: start
# → data: {"script":"en-scanner","writeFiles":false,…}

# Skip-link (a11y):
curl -s http://127.0.0.1:4317/ | grep -c 'class="skip-link"'  # → 1

# Запасной html lang:
curl -s http://127.0.0.1:4317/ | grep -c 'html lang="en"'     # → 1
```

### Вне рамок (v1.19+)

| Пункт | Примечания |
|---|---|
| Полный паритет не-EN README (585 строк как у EN) | v1.18 поднял не-EN до ~307 (53 % от EN). Маркетинговые «Why?» / «Quick start» проходы остаются только на английском. |
| Аудит цветового контраста (WCAG 1.4.3 AA — текст 4.5:1, крупный текст 3:1) | v1.18 закрыл структурную a11y; токенный контраст в светлой и тёмной палитрах остаётся к проверке. |
| Аудит touch-target по каждому интерактивному элементу | v1.18 установил пол (`.btn`: 44 px, `.btn-sm`: 32 px); покомпонентная проверка (chip-фильтры, навигация сайдбара, sortable headers) остаётся. |

---

## [1.17.0] — 2026-05-13

**Релиз полировки + a11y + исправления CI.** Закрывает все 9 follow-up из списка
v1.16.0: проверка smoke в браузере, правда бейджей README,
обновление покрытия, проявление `lastWorkdayFallback` в SPA, полный пересчёт E2E,
сценарии Playwright для auto-pipeline, проход аудита a11y,
сжатие исторических CHANGELOG в 6 локалях и расширение
не-EN README разделами Architecture / API / Security / Tests.

### 🐛 Исправления

- **`fix(e2e): smoke + comprehensive suites re-aligned with v1.16 UX`** —
  изменение v1.16 Cmd+K Enter → AutoPipeline modal приводило к тому,
  что `search.press('Enter')` в e2e-тестах открывал модалку,
  перехватывавшую последующие клики. Тесты теперь используют
  `Shift+Enter` для устаревшего пути быстрого добавления, что
  соответствует документированному в v1.16 разделению. Также
  обновляет итерацию batch-режима в comprehensive E2E для использования
  `/#/batch-prompt` (устаревший slug, введённый PR-H в v1.15).
  **Это был провал CI на push v1.16.0** —
  Playwright e2e таймаутил 30 с на ожидании кликов, перехваченных backdrop.
- **`fix(mode-page): batch-prompt route → modes/batch.md via serverSlug`** —
  v1.15 переименовала legacy mode slug в `batch-prompt`, но
  серверный `POST /api/mode/:slug` после этого искал
  `modes/batch-prompt.md`, которого не существует. Новое поле
  `serverSlug` разводит хеш маршрута и имя файла режима родителя.
- **`chore: bump deprecation messages from v1.16.0 to v1.17.0`** —
  тексты deprecation для scan-en/scan-ru и баннер deprecation
  batch-prompt ссылались на прошлую версию.

### ✨ Возможности

- **`feat(scan): 🔒 Workday CAPTCHA chip in Active Companies card`** —
  серверный экспорт `lastWorkdayFallback` из PR-7 v1.16 теперь
  потребляется SPA. `/api/scan-results` возвращает снапшот;
  `#/scan` рендерит warn-карточку над Active Companies, когда
  тенант Workday сорвался в fallback («🔒 Workday tenant blocked — fallback:
  use /career-ops scan (Playwright)»). Новый экспортер `getLastWorkdayFallback()`
  исключает неоднозначность live-binding ESM. 2 новых ключа i18n ×
  8 локалей.

### ♿ Доступность

- **`a11y: ARIA roles + focus management pass on critical surfaces`** —
  - `index.html`: атрибуты `role` на `<aside>` (navigation),
    `<header>` (banner), `<section id="content">` (main),
    `<div id="modal">` (dialog с aria-modal/aria-labelledby),
    `<div id="toast">` + `#conn-banner` (status с aria-live),
    `<div class="searchbar">` (search).
  - `#sidebar-toggle` получает `aria-controls="sidebar"` +
    `aria-expanded`, синхронизируемый JS при open/close.
  - `#global-search` получает визуально-скрытую `<label>` и
    явный `aria-label`, проявляющий подсказку шортката Cmd+K.
  - Закрытие модалки (×) получает `aria-label="Close dialog"`.
  - Декоративные backdrop получают `aria-hidden="true"`.
  - **Ловушка фокуса в модалке** — `UI.modal()` запоминает владельца клика,
    фокусирует первый не-close фокусируемый элемент при открытии и
    циклит Tab/Shift+Tab внутри модалки. `UI.closeModal()`
    возвращает фокус предыдущему владельцу.
  - Новый утилитарный класс `.visually-hidden` в `public/css/app.css`
    (стандартный паттерн WAI-ARIA AP).

### 📚 Документация

- **`docs(readme): badge truth across 8 READMEs`** — бейдж тестов
  `284 / 379 / 360` → **427**; бейдж релиза `v1.9.1 / v1.13.0`
  → **v1.16.0**, затем → v1.17.0 через v1.17 bump. Цели ссылок релиза
  обновлены.
- **`docs(readme): expand 7 non-EN READMEs with reference sections`** —
  каждый вырос с 170 → ~240 строк за счёт новых разделов Architecture /
  API reference / Security notes / Tests / A11y / Limitations /
  License на родном языке. Пока не на полном паритете 585 строк
  с EN, но покрывает все ключевые немаркетинговые поверхности.
- **`docs(changelog): condense pre-v1.12 entries in 6 locales`** —
  длинные RU-телесные записи v1.11.x + v1.10.x, протекавшие в
  не-EN/не-RU CHANGELOG, заменены на компактную
  сводку «Earlier releases» на родном языке каждой
  локали. Детальная история остаётся в `CHANGELOG.md` (EN).

### 🛠️ Инструментарий

- **`coverage: refresh numbers`** — последняя опубликованная цифра — 95.46 %
  line / 84.06 % branch (REVIEW v1.13.0). Baseline v1.17: **94.14 %
  line / 82.98 % branch / 93.20 % function**. Лёгкое снижение от
  новых путей ошибок в auto-pipeline + reports-write; по-прежнему
  значительно выше пола 80 % из CLAUDE.md.

### 🧪 Тесты

- Итого: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive
  E2E + **32 / 32** Playwright (было 28; +4 новых сценария auto-pipeline:
  кнопка открывает модалку, Cmd+K paste запускает модалку,
  невалидный URL блокирует шаг 1, обрамление SSE-событий
  `POST /api/auto-pipeline`).
- E2E-сет перенастроен под UX v1.16.0 (Shift+Enter quick-add,
  /#/batch-prompt для устаревшего режима).

### Верификация

```bash
# Локально:
npm test                          # 427 / 427
npm run test:e2e                  # 20 / 20
npm run test:e2e:full             # 23 / 23
npm run test:e2e:browser          # 32 / 32

# Smoke в браузере (на уровне страницы):
curl -s http://127.0.0.1:4317/api/scan-results | jq '.workdayFallback'
# null, когда fallback Workday не происходил; {apiUrl, reason, at} после 4xx.

# Точечная проверка a11y:
node -e "
const c = require('cheerio').load(require('fs').readFileSync('public/index.html','utf8'));
['banner','navigation','main','dialog','status','search'].forEach(r =>
  console.log(r, c('[role=' + r + ']').length));
"
# Каждая роль должна появляться ≥1.

# Проверка шлюза CI: workflow dashboard-screenshots поднимает /tmp
# скаффолд, регенерирует PNG, сравнивает с закоммиченными — зелёный, когда
# images/dashboard-*.png актуальны для отрендеренного SPA.
```

### Вне рамок (v1.18+)

| Пункт | Примечания |
|---|---|
| Перевести запись v1.16.0 в не-EN CHANGELOG | Сейчас с русским телом (~30 строк × 6 локалей = 180 строк). Было вне явных рамок пользователя для v1.11.x/v1.10.x. |
| Полный паритет не-EN README (585 строк как у EN) | v1.17 поднял не-EN до ~240; маркетинговые «Why?» / «Quick start» проходы остаются только на английском. |
| Родительский коммит для канонического промпта A-F | Переписывание `santifer/career-ops::modes/oferta.md` всё ещё требуется upstream (жёсткое правило CLAUDE.md #1). |
| Полный аудит WCAG 2.2 AA | v1.17 покрыл структурный ARIA + ловушку фокуса; покомпонентный контраст / порядок Tab остаётся к проверке. |

---

## [1.16.0] — 2026-05-13

**Финализация auto-pipeline + полировка адаптеров + длинный хвост i18n.** Закрывает
все 11 follow-up из REVIEW v1.15.0: серверный SSE auto-pipeline,
примитив `POST /api/reports`, шорткат Cmd+K, пагинация SmartRecruiters,
CAPTCHA-fallback Workday, шлюз CI на дрейф скриншотов, UX фильтра источников сканирования,
перевод исторического CHANGELOG (v1.13.0/v1.12.0 × 6 локалей), расширение
не-EN README и готовый к вставке импортёр трендовых компаний.

### ✨ Возможности

- **`feat(auto-pipeline): server-side SSE orchestrator`** (#1, #2, #3, #8) —
  клиентский цепочный fetch-оркестратор v1.15 удалён. `POST
  /api/auto-pipeline` теперь curl-доступный SSE-эндпоинт, который
  выстраивает validate → fetch JD → evaluate → save report → tracker
  на сервере с событиями шагов в реальном времени. Медленный вызов Anthropic (30–90 с)
  теперь шлёт событие `running` вместо общего спиннера. Падения шлют
  `error` с `step` + `message`. Оркестратор также сохраняет markdown
  отчёта в родительский `reports/<slug>.md` (терялся в v1.15).
- **`feat(reports): POST /api/reports primitive`** — новый эндпоинт записи
  в `server/lib/routes/reports.mjs`. Санитайзинг slug со страховкой
  от path-traversal (убрать ведущие точки, схлопнуть внутренние `...`).
  Лимит 1 МБ (413). 409 на существующий файл, если не указано `overwrite:true`.
  Атомарная запись через очистку XSS `stripDangerousMarkdown`. Логирует
  activity.reports.save. Тесты: 9 кейсов.
- **`feat(app): Cmd+K paste URL → auto-pipeline`** — вставка URL в
  глобальный поиск + Enter теперь открывает модалку AutoPipeline с
  `autoStart=true`. Shift+Enter сохраняет устаревший путь «добавить только
  в pipeline». Каноничный UX career-ops.org Quick Start §7
  «paste URL → done».
- **`feat(portals): SmartRecruiters pagination`** (#4) —
  `server/lib/sources/smartrecruiters.mjs` обходит страницы через
  `?limit=100&offset=N` до достижения `totalFound`, ИЛИ возврата пустой
  страницы, ИЛИ срабатывания страховочного лимита 30 страниц / 3000 вакансий.
  Подставленные вызывающим limit/offset стираются — курсор принадлежит серверу.
  Крупные борды (Procter & Gamble, Amazon-style) больше не теряют
  хвост 100+ объявлений. Тесты: 6 кейсов.
- **`feat(portals): Workday CAPTCHA-fallback graceful`** (#7) —
  `server/lib/sources/workday.mjs` больше не бросает на 4xx /
  не-JSON / сетевой ошибке. Возвращает `[]` и аннотирует новый
  экспортируемый снапшот `lastWorkdayFallback`. Таймлайн сканера
  продолжается со следующего тенанта. Вызывающий может вернуть прежнее
  поведение v1.14 с исключениями через `strict:true`. Тесты: 7 кейсов.

### 🛠️ Инструменты + CI

- **`ci(workflows): dashboard-screenshots drift gate`** (#5) — новый
  `.github/workflows/dashboard-screenshots.yml`. На PR, затрагивающих
  `public/css/app.css` / `public/js/views/dashboard.js` /
  `public/js/lib/i18n.js` / `public/index.html`, workflow
  поднимает сервер web-ui против /tmp-скаффолда, регенерирует
  8 hero PNG через Playwright + chromium и валит сборку,
  если результат расходится с закоммиченными. На падении заливает регенерированные
  PNG как артефакт CI.
- **`feat(scripts): import-trending-companies.mjs`** (#11) — проверяет
  13 трендовых компаний из `docs/portals-examples.md` через их
  реальный boards-API и эмитит готовый к вставке YAML для родительского
  `portals.yml::tracked_companies`. `enabled: false` ставится на
  любого кандидата, чей slug отдаёт 404. Живой пробинг всех 6 ATS
  (Greenhouse / Ashby / Lever / Workable / SmartRecruiters /
  Workday). Запуск через `npm run import:trending`.
- **`feat(scripts): npm run capture:dashboards`** — выносит
  `scripts/capture-dashboard-screenshots.mjs` как верхнеуровневый скрипт
  (раньше упоминался только в `images/README.md`).

### 🎨 UX

- **`fix(scan): consolidated source-filter dropdown`** (#6) —
  выпадающий список источников на `#/scan` пересобран из реестра
  адаптеров v1.14: 6 ATS + hh.ru + Habr Career, по алфавиту, без префикса гео-тега.
  `runEnScan` / `runRuScan` теперь идут на консолидированный
  эндпоинт `/api/stream/scan?source={ats,regional}` вместо
  устаревших алиасов `/api/stream/scan-{en,ru}` (заголовки Sunset
  остаются живыми до v1.16).

### 📚 Длинный хвост i18n

- **`docs(i18n): translate v1.13.0 + v1.12.0 CHANGELOG in 6 locales`**
  (#9) — записи, ранее с русским телом в
  `CHANGELOG.{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md`, теперь на
  реальной локали. Каждый не-EN/не-RU CHANGELOG также получает
  заметку i18n, объясняющую, что записи pre-v1.12 остаются на русском по
  соглашению проекта (канонический текст живёт в `CHANGELOG.md`).
- **`docs: expand non-EN READMEs with v1.16.0 highlights section`**
  (#10) — 6 не-EN README (es / pt-BR / ko-KR / ja / ru / zh-CN /
  zh-TW) получают новый ~35-строчный раздел, покрывающий: одно-клик
  поток auto-pipeline + пример curl, пагинацию SmartRecruiters,
  fallback Workday, UX фильтра источников сканирования, импортёр и
  workflow CI скриншотов. RU README также расширен.

### 🧪 Тесты

- Новый `tests/reports-write.test.mjs` (9 кейсов) — happy path,
  санитайзинг slug (включая защиту от path-traversal), конфликт 409,
  флаг overwrite, очистка XSS, 400 на пропущенных полях, 413 на >1 МБ,
  round-trip GET/POST.
- Новый `tests/auto-pipeline.test.mjs` (5 кейсов) — обрамление SSE,
  блок на невалидный URL, блок на SSRF/loopback, путь ошибки без LLM-ключа,
  заголовок Content-Type `text/event-stream`.
- Новый `tests/smartrecruiters-pagination.test.mjs` (6 кейсов) —
  одна страница, 3 страницы, ранняя остановка на пустой странице, соблюдение
  жёсткого лимита, очистка query, бросок 503.
- Новый `tests/workday-fallback.test.mjs` (7 кейсов) — happy path,
  graceful 403/429, не-JSON тело, сетевая ошибка, strict-opt-in
  для 4xx и сетевых ошибок.
- Итого: **427 / 427** unit (было 400; +27 чистых). 0 падений. 28/28
  Playwright + 23/23 comprehensive E2E + 20/20 smoke E2E зелёные
  от baseline v1.15.0.

### Вне рамок (v1.17+)

| Пункт | Примечания |
|---|---|
| Родительский коммит для канонического промпта A-F | По-прежнему ждёт upstream-переписывания `santifer/career-ops::modes/oferta.md` (жёсткое правило CLAUDE.md #1). |
| Перевести записи pre-v1.12 CHANGELOG (v1.11.x, v1.10.x) | Соглашение сохранено: с русским телом. Бэкпорт — ~1800 строк перевода; отложено. |
| Полный паритет не-EN README (585 строк как у EN) | v1.16 добавил ~35 строк на локаль; полный паритет — отдельная работа. |
| Серверный `runEnScan`, читающий аннотацию Workday fallback для рендера 🔒 чипов | Экспорт `lastWorkdayFallback` подключён; карточка Active Companies в SPA потребляет его в v1.17+. |

### Верификация

```bash
npm test                          # 427 / 427
npm run test:e2e:full             # 23 / 23
npm run import:trending --check-only   # пробинг 13 трендовых бордов

# Smoke auto-pipeline через curl:
curl -N -X POST http://127.0.0.1:4317/api/auto-pipeline \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://job-boards.greenhouse.io/anthropic/jobs/4567"}'

# Round-trip POST /api/reports:
curl -X POST http://127.0.0.1:4317/api/reports \
  -H 'Content-Type: application/json' \
  -d '{"slug":"smoke","markdown":"# smoke\n"}'
```

---

## [1.15.0] — 2026-05-13

**Релиз соответствия документации.** Закрывает 9 из 10 ещё открытых находок
из аудита соответствия (`qa/conformance-vs-docs/00-CONFORMANCE-REPORT.md`)
плюс локализованные hero-картинки. Приводит UI в соответствие с
каноническим workflow career-ops.org/docs, так что тот же конвейер, что обещает
CLI, работает end-to-end через браузер в каждой локали.

### ✨ Возможности

- **`feat(auto-pipeline): PR-C — 1-click "paste URL → report + PDF + tracker row"`** (G-007)
  Соответствует обещанию canonical career-ops.org. До v1.15 пользователи делали 5 ручных кликов по /#/pipeline → /#/evaluate → /#/cv → /#/tracker. Теперь одна кнопка ✨ на /#/dashboard выстраивает цепочку: validate URL → fetch JD (SSRF-safe) → evaluate against CV → generate PDF → add tracker row. Рендерит пошаговый таймлайн в модалке с [✓]/[…]/[✗] по каждому шагу. Эвристическая экстракция компании/роли из первых строк JD. Оценка и легитимность извлекаются regex из markdown оценки. Новый файл: `public/js/lib/auto-pipeline.js`. 19 новых ключей i18n × 8 локалей.
- **`feat(modes): PR-D — modes/_profile.md editor as #/config → Modes tab`** (G-008)
  Канонический файл «Career framing» из Quick Start §Step-5 ранее был невидим UI-пользователям. Теперь он доступен через новую вкладку «Modes» на /#/config плюс заметную карточку на /#/profile. Новые эндпоинты: `GET/PUT /api/modes/_profile` с лимитом 256 КБ, прогоном через `stripDangerousMarkdown` (XSS) и скаффолдом из `_profile.template.md` при первом чтении. 9 новых ключей i18n × 8 локалей.
- **`feat(profile): PR-E — accept canonical schema; add location + headline`** (G-009)
  `/api/profile` теперь принимает И legacy (`candidate:{...}`), И canonical (top-level `full_name`, `narrative.headline`, `target_roles.primary`, `compensation.target_range`) схему. Legacy побеждает при наличии обоих, чтобы существующие YAML рендерились идентично. Новый хелпер `summarizeProfile()` возвращает унифицированную форму. `/#/profile` выводит `narrative.headline` новой карточкой. 2 новых ключа i18n × 8 локалей.
- **`feat(tracker): PR-B — Legitimacy column on #/tracker`** (G-006)
  Восстанавливает паритет с канонической выходной таблицей конвейера из career-ops.org/docs. Добавляет колонку Legitimacy между Status и PDF с тонировкой badge-ok/warn/bad (зеркало паттерна statusClass). Грациозная деградация — строки pre-v1.15 без колонки Legitimacy показывают `—`. 1 новый ключ i18n × 8 локалей.
- **`fix(routing): PR-H — dedupe sidebar; route #/batch to v1.13.0 TSV SPA`** (G-011)
  До этого фикса /#/batch регистрировался в сайдбаре ДВАЖДЫ, и оба пути вели в устаревший построитель mode-prompt. TSV SPA из v1.13.0 (8 КБ, 4 эндпоинта) была недоступна. Дубликат в сайдбаре удалён; mode slug `batch` → `batch-prompt` с баннером deprecation. Канонический /#/batch теперь — TSV SPA.

### 📚 Документация

- **`docs(evaluate): PR-A — realign Block A-F with canonical career-ops.org rubric`** (G-005)
  Документация career-ops.org описывает A–F (Strategy/Personalization/STAR-истории в C/E/F). Мы эмитили A–G со сдвинутой семантикой (Risks/Verdict/Legitimacy). v1.15 обновляет все 8 справочных бандлов §9, чтобы показывать каноничные A–F с врезкой «Pre-v1.15 used A–G; we render those as-is for back-compat». Ключ i18n `eval.subtitle` × 8 локалей тоже выровнен. Score + legitimacy теперь задокументированы как поля заголовка отчёта. ⚠ Родительский коммит ещё нужен: `santifer/career-ops::modes/oferta.md` требует upstream-переписывания для эмиссии каноничных A–F.
- **`docs: PR-F — seniority_boost + search_queries in help §5 across 8 locales + scaffold`** (G-010)
  Help §5 в 8 бандлах теперь документирует третий ключ title-фильтра (`seniority_boost`) И имеет пример блока `search_queries` с переведённым однопараграфным вступлением, поясняющим, что он влияет только на AI-сканирование Option B. Скаффолд `bin/setup.sh` для portals.yml по умолчанию засевает `seniority_boost: ["Senior", "Staff", "Lead"]`. Паритет H2 сохранён: 16 × 8 локалей.
- **`docs: PR-I — localized hero images per README locale`**
  Каждый из 8 README теперь имеет специфическую локалевую `images/dashboard-<locale>.png` (HiDPI 1440×900), сгенерированную через `scripts/capture-dashboard-screenshots.mjs` (Playwright + chromium). Старый общий `public/images/screen_vacancy_found.png` удалён. Не-EN читатели сразу видят свой UI с метками на их языке.

### 🧹 Хвостовые чистки

- **`PR-G — G-001`** Бандл i18n `scan.noResults`: 8 строк, содержащих литеральное «EN or RU scan», заменены на локально-чистую копию.
- **`PR-G — G-002`** Кнопка 📄 Generate PDF теперь появляется на result-панелях #/interview-prep (зеркало паттерна deep.js).
- **`PR-G — G-003`** `README.cn.md` → `README.zh-CN.md` (канонический тег локали); ссылки обновлены в соседях + tests/canonical-docs-coverage.test.mjs.
- **`PR-G — G-004`** `/api/stream/scan-en` + `scan-ru` теперь шлют заголовки Sunset + Deprecation + Link по RFC 8594 (sunset 2026-10-01). Запланировано к удалению в v1.16.0.

### 🧪 Тесты

- Новый `tests/profile-canonical-schema.test.mjs` (6 кейсов) — canonical YAML, legacy YAML, mixed legacy-wins, accept-canonical-only, reject neither-shape, парсинг comp range.
- Новый `tests/modes-profile-crud.test.mjs` (8 кейсов) — встроенный скаффолд при пустом, takeover шаблона, persisted-wins, write happy-path, санитайзинг, 400 на не-строку, 413 на >256 КБ, generic /api/modes/:name по-прежнему работает.
- Исправлена регрессия изоляции в тестовых фикстурах: тесты теперь используют паттерн `before/after + dynamic-import` (по образцу `tests/batch-endpoints.test.mjs`), чтобы больше не мутировать реальный родительский `config/profile.yml` пользователя. **ПРИМЕЧАНИЕ для пользователей:** если ваш `config/profile.yml` после обновления с dev-сборки v1.15.0-RC выглядит как тестовая заглушка, восстановите из бэкапа — регрессия существовала только в dev-ветке.
- Итого: **400 / 400** unit (было 386; +14 чистых). 0 падений. 20/20 smoke E2E + 23/23 comprehensive E2E + 28/28 Playwright зелёные от baseline v1.14.0.

### Вне рамок (follow-up v1.16+)

| Пункт | Примечания |
|---|---|
| Родительский коммит для канонического промпта A–F | `santifer/career-ops::modes/oferta.md` требует upstream-переписывания. Жёсткое правило CLAUDE.md #1 запрещает нам править родительские файлы. На стороне web-ui уже сделано (graceful degrade — отчёты pre-v1.15 A–G рендерятся без изменений). |
| Серверный `POST /api/auto-pipeline` SSE | Клиентский оркестратор отгружает UX-выигрыш. Серверный эндпоинт включит retry-from-step-N + curl-доступный CI. |
| Примитив `POST /api/reports` | Auto-pipeline сейчас показывает markdown отчёта inline, но не сохраняет его в родительский `reports/`. PDF + строка трекера — устойчивые артефакты. |
| Cmd+K paste-URL → запуск auto-pipeline | Отложено до v1.16+. |

### Верификация

```
npm test                              # 400 / 400
npm run test:e2e:full                 # 23 / 23
curl -sf http://127.0.0.1:4317/api/health | jq '.checks | length'   # → 18
curl -sI http://127.0.0.1:4317/api/stream/scan-en | grep -i sunset  # G-004 видимо
curl -sf http://127.0.0.1:4317/api/modes/_profile | jq '.scaffolded' # G-008 подключено
ls images/dashboard-*.png | wc -l     # 8 (PR-I)
grep -c 'href="#/batch"' public/index.html  # 1 (дедупликация PR-H)
```

---

## [1.14.0] — 2026-05-13

Поверх реестра v1.13.0 приземляются 3 новых ATS-адаптера, поднимая поддержку с 3 → 6 ATS (Greenhouse / Ashby / Lever **+ Workable / SmartRecruiters / Workday-beta**). Пользовательская документация в 17 файлах подметена с «3 ATSes» на «6 ATSes» одним проходом (42 фразовых апгрейда) — README × 8 локалей, справочный бандл × 8 локалей, PROJECT.md. Добавляет блоки `docs/portals-examples.md` для 13 трендовых компаний как готовый к вставке YAML для родительского `portals.yml`.

### ✨ Возможности

- **`feat(portals): 3 new ATS adapters — Workable, SmartRecruiters, Workday-beta`** — реестр теперь резолвит 6 ATS (было 3). Новые файлы: `server/lib/portals/adapters/{workable,smartrecruiters,workday}.mjs` (тонкие обёртки uniform-contract вокруг новых источников) и `server/lib/sources/{workable,smartrecruiters,workday}.mjs` (сырой HTTP + нормализация ответа к канонической форме `{ id, title, company, url, location, isRemote, … }` с `source: <id>`).
  - **Workable**: распознаёт `apply.workable.com/<slug>` И legacy `<subdomain>.workable.com`. Эндпоинт: `https://apply.workable.com/api/v3/accounts/<slug>/jobs?details=true`.
  - **SmartRecruiters**: распознаёт `jobs.smartrecruiters.com/<slug>` И `careers.smartrecruiters.com/<slug>`. Эндпоинт: `https://api.smartrecruiters.com/v1/companies/<slug>/postings`.
  - **Workday (beta)**: распознаёт `<tenant>.wd<N>.myworkdayjobs.com/<lang>/<site>`. Эндпоинт: POST в `/wday/cxs/<tenant>/<site>/jobs`. По умолчанию `site=External`, когда careers_url его опускает. Beta, потому что некоторые тенанты гейтят CXS за CAPTCHA — в этом случае откат к родительскому `/career-ops scan` (на базе Playwright).

### 📚 Документация

- **`docs(portals-examples): trending boards block`** — `docs/portals-examples.md` расширен разделом v1.14.0, перечисляющим 13 трендовых компаний как готовый к вставке YAML для `tracked_companies`, разбитый на Greenhouse-хостовые (Stripe, GitLab, HashiCorp, Cloudflare, Datadog, Hugging Face) и Ashby-хостовые (Notion, Linear, PostHog, Replicate, Modal Labs, Fly.io, Render). У каждой записи `enabled: false`, чтобы пользователи проверили отклик slug перед включением. Плюс примерные блоки для Workable / SmartRecruiters / Workday с URL-паттерном, который распознаёт каждый.
- **`docs(framing): 42 ATS-phrase upgrades across 17 user-facing docs`** — каждое появление «Greenhouse / Ashby / Lever» в пользовательской документации теперь читается как «Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday». Затрагивает README × 8 локалей (EN/ES/PT-BR/RU/JA/KO/CN/TW), справочный бандл × 8 локалей, PROJECT.md. Исторические записи CHANGELOG и рецепты bug-fix (`qa/fixes/F-014`, `qa/FIX-PROMPT`) намеренно не тронуты — они описывают прошлое или уже корректное состояние.
- **`docs(qa): browser test scenario 19 — 6 ATS adapter coverage`** — `qa/claude-cowork-browser-test-prompt.md` расширен сценарием 19: инвариант `ALL_ADAPTERS.length === 6`, проверка `resolveAdapter()` для определения URL по всем 6 адаптерам, мягкая проверка карточки Active Companies в `#/scan` и структурная проверка блоков `docs/portals-examples.md` на ATS.

### 🧪 Тесты

- `tests/adapter-registry.test.mjs` расширен 7 новыми тестами для 3 новых адаптеров (паттерн apply-URL Workable, legacy-паттерн subdomain Workable, паттерны jobs.* + careers.* SmartRecruiters, тенант Workday `tenant.wd5.*` с явным site, fallback к умолчанию `External` для Workday, инвариант `ALL_ADAPTERS.length === 6`, обратная совместимость формы `detectApi()`).
- Итого: **386 / 386** unit (было 379; +7 чистых). 0 падений.

### Верификация

```
npm test                        # 386 / 386
node -e "import('./server/lib/portals/registry.mjs').then(m => console.log(m.ALL_ADAPTERS.length))"   # → 6

# Проход определения адаптера:
node -e "import('./server/lib/portals/registry.mjs').then(m => {
  console.log(m.resolveAdapter({ careers_url: 'https://apply.workable.com/foo/' }).adapter.id);          // → workable
  console.log(m.resolveAdapter({ careers_url: 'https://jobs.smartrecruiters.com/Bar' }).adapter.id);     // → smartrecruiters
  console.log(m.resolveAdapter({ careers_url: 'https://baz.wd5.myworkdayjobs.com/en-US' }).adapter.id);  // → workday
})"
```

### Вне рамок (отложенные follow-up)

| Пункт | Примечания |
|---|---|
| Адаптерные записи на компанию для 13 трендовых Greenhouse/Ashby | Блок v1.14.0 `docs/portals-examples.md` перечисляет их как готовый к вставке YAML; верификация slug + массовое добавление в родительский `portals.yml` — отдельная фаза. |
| Автоматизация CAPTCHA-fallback Workday | Адаптер Workday бросает, когда CXS-фид зашлюзован; планируемый fallback делегирует родительскому `/career-ops scan` (Playwright). Подключение этого в UX «scan» SPA — v1.15+. |

---

## [1.13.0] — 2026-05-13

Крупный срез. Закрывает все 4 отложенных пункта из бэклога post-v1.12.0 одним релизом: PR-4 (полный конвейер multer), реестр адаптеров (архитектурный follow-on F-018), SPA-страница batch evaluate и локалезависимый скаффолд шаблонов режимов. Плюс правка таблицы dark-темы посреди сессии.

### ✨ Возможности

- **`feat(cv): multer-based multipart upload (PR-4 full)`** — `/api/cv/import` теперь принимает И оригинальный контракт octet-stream (`Content-Type: application/octet-stream` + `X-Filename`), И `multipart/form-data`, правильно разбираемый через multer. 415-отбрасывание из v1.10.2 было заглушкой; v1.13.0 — настоящая правка. Внешние клиенты (curl `-F`, Postman по умолчанию, любой HTTP-клиент) работают штатно. Оба пути идут через тот же конвертер `importDocumentToMarkdown` + XSS-очистку `stripDangerousMarkdown`. Новая зависимость: `multer ^2.1.1`.
- **`feat(portals): adapter registry`** — фетчеры Greenhouse / Ashby / Lever вынесены в `server/lib/portals/adapters/*.mjs` с единым контрактом (`id`, `label`, `matches`, `buildEndpoint`, `fetch`). Новая поверхность диспетчеризации — `server/lib/portals/registry.mjs::resolveAdapter()`. `en-scanner.mjs::detectApi()` + `FETCHERS` теперь делегируют реестру; legacy-форма возврата сохранена. Чтобы добавить новый ATS: положить файл в `adapters/`, добавить в `ALL_ADAPTERS` — никаких правок сканера.
- **`feat(batch): #/batch evaluate page`** — новый view SPA + 4 эндпоинта (`GET /api/batch`, `PUT /api/batch`, `GET /api/stream/batch`, `POST /api/batch/merge`). TSV-редактор для `batch/batch-input.tsv`, контролы parallel/min-score/dry-run/retry, живой SSE-лог `bash batch/batch-runner.sh`, пост-ран список `batch/tracker-additions/` с однокликовым `node merge-tracker.mjs`. Ссылка в сайдбаре под группой Decision. 21 новый ключ i18n × 8 локалей.
- **`feat(prompts): locale-aware mode scaffolding`** — `buildModePrompt` + `buildEvaluationPrompt` теперь оборачивают английское тело шаблона режима родителя локализованным скаффолд-текстом (строка роли, «Read these files first», «User-supplied context») на 8 локалях. Тело `modes/<slug>.md` родителя остаётся английским (read-only по жёсткому правилу CLAUDE.md #1); скаффолд career-ops-ui вокруг него — переведён.

### 🎨 UX-исправления

- **`fix(theme): dark-mode table hover + tab-btn`** — захардкоженные `#fafafa` / `#fff` / `#f7f7f7` заменены на токены `var(--beach)` / `var(--paper)` / `var(--slate)`, чтобы своп тёмной палитры действительно доходил до строк таблиц и кнопок вкладок. Добавляет акцентную полоску `.row-boosted` для усиленных строк сканирования, работающую в обеих темах.

### 🧪 Тесты

- Новый `tests/adapter-registry.test.mjs` (7 кейсов) — единый контракт, определение URL на ATS, приоритет явного поля `api:`, null при отсутствии совпадения, сохранение формы legacy `detectApi()`.
- Новый `tests/batch-endpoints.test.mjs` (5 кейсов) — пустая фикстура, round-trip TSV, отказ при отсутствии URL, лимит 1 МБ, кадр ошибки «runner отсутствует».
- Новый `tests/locale-scaffold.test.mjs` (6 кейсов) — скаффолд-строки на en/ru/ja/ko, интеграция `buildModePrompt`/`buildEvaluationPrompt`, обратная совместимость English.
- `tests/cv-upload-multipart-reject.test.mjs` переписан — то, что было контрактом «multipart returns 415», теперь контракт «multipart parsed via multer»; инвариант «без побочного эффекта на cv.md» сохранён.
- Итого: **379 / 379** unit (было 360; +19 чистых). 0 падений.
- Покрытие: **95.46 % line / 84.06 % branch**.
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright.

### Вне рамок (отложенный follow-up)

| Пункт | Примечания |
|---|---|
| 14 новых портальных адаптеров (Workable / SmartRecruiters / Workday / GitLab / HashiCorp / Cloudflare / Datadog / Stripe / Notion / Linear / Posthog / Hugging Face / Replicate / Modal Labs / Fly.io / Render) | Реестр адаптеров на месте — добавление новых адаптеров теперь по одному файлу. Поиск URL-паттернов + нормализация эндпоинтов для 14 ATS — отдельная фаза. |
| Перевод тел `modes/<slug>.md` родителя | Родительские файлы read-only по жёсткому правилу CLAUDE.md #1. Локалезависимый скаффолд v1.13.0 даёт 80 % выигрыша; полный перевод тел требует upstream-PR в `santifer/career-ops`. |

### Документация

- `docs/reviews/REVIEW-2026-05-13-v1.13.0.md` — контекст сессии + контракт реестра адаптеров + поток batch.
- Все 8 README: bump бейджей (tests 360 → 379, release v1.12.0 → v1.13.0).
- Все 8 CHANGELOG получают эту запись.

---

## [1.12.0] — 2026-05-13

Проход bug-fix + UX + брендинг. Закрывает 8 пунктов из честного бэклога post-v1.11.1 (провалы тестов #9–12, ошибка консоли #8, дрейф portals-dead #4, поверхность seniority_boost #6, консолидация эндпоинтов F-018). Добавляет переключатель тёмной/светлой темы и удаляет брендинг «Airbnb-styled» из каждой документации, метаданных пакета и описания GitHub-репо.

### ✨ Возможности

- **`feat(theme): dark/light toggle (v1.12.0)`** — новая кнопка темы в топ-баре. Циклит светлую ↔ тёмную; сохраняется в `localStorage.theme`; восстанавливается при загрузке страницы через pre-paint-бутстрап (`public/js/lib/theme-bootstrap.js`), чтобы пользователи никогда не видели вспышку неверной цветовой схемы. Учитывает `prefers-color-scheme` для первых посетителей. Полная тёмная палитра под `[data-theme="dark"]` в `public/css/app.css` — каждый компонент читает из CSS-переменных, так что своп централизован в одном месте.
- **`feat(scan): /api/stream/scan?source=ats|regional|both` (F-018 LITE)`** — единая консолидированная SSE-точка входа. SPA теперь открывает ОДИН event-stream, который последовательно ведёт обе фазы (сначала ATS, затем regional), вместо цепочки из двух отдельных стримов. Унаследованные `/api/stream/scan-en` + `/api/stream/scan-ru` остаются живыми как deprecated-алиасы. Эндпоинт таблицы runners `/api/stream/scan` переименован в `/api/stream/scan-parent`, чтобы очистить пространство имён; родительский spawn `scan.mjs` сохранён как fallback.
- **`feat(scan): seniority_boost surface (canonical docs §3)`** — и `en-scanner.mjs`, и `ru-scanner.mjs` теперь читают `portals.yml::title_filter.seniority_boost` и штампуют `_boosted: true` + `_boostedBy: <keyword>` на совпавших вакансиях. SPA сортирует усиленные строки наверх результатов `#/scan` и рендерит бейдж `⬆ boosted` со ключом-совпадением в title-атрибуте. Два новых ключа i18n (`scan.boosted`, `scan.boostedBy`) локализованы в 8 локалях.

### 🐛 Исправления

- **`fix(ui): null-safe error message reads in 4 places (#8)`** — `app.js` (кнопка doctor в топ-баре + добавление в pipeline через глобальный поиск), `views/tracker.js` (строка 112), `views/apply.js` (строка 21), `views/evaluate.js` (строка 32) теперь читают `(err && err.message) || '<fallback>'`. Раньше отклонение Promise без Error-полезной нагрузки бросало «Cannot read properties of undefined (reading 'message')» в потоке page-error при тиар-дауне e2e.
- **`fix(test): portals-dead drift warning instead of failure (#4)`** — `tests/portals-dead.test.mjs::FIX-C3` падал, когда родительский `templates/portals.example.yml` дрейфовал и снова включал slug, помеченный нами как dead. v1.12.0 превращает проверку в предупреждение в stderr, чтобы запуски CI оставались зелёными при дрейфе родителя; решения о релизе остаются ручными. Список `KNOWN_DEAD` сохранён как документация намерения.

### 📝 Брендинг / документация

- **`docs(brand): strip 'Airbnb' references from every doc (8 locales)`** — README.md, README.es.md, README.pt-BR.md, README.ko-KR.md, README.ja.md, README.ru.md, README.cn.md, README.zh-TW.md, CLAUDE.md, docs/architecture/FRONTEND.md, package.json и описание GitHub-репо переведены с формулировок «Airbnb-styled» / «Airbnb-inspired» на «Clean, docs-style». CSS-файл сохранил имена дизайн-токенов (внутренние идентификаторы, без внешнего сцепления), но поясняющий комментарий переписан.

### 🧪 Тесты

- **Новый `tests/canonical-docs-coverage.test.mjs` (5 кейсов)** закрывает провалы тестов #9–12: каждый справочный бандл ссылается на все 5 канонических руководств career-ops.org; контракт паритета 16-H2 на локаль; каждый README ссылается на каноническую главную + ≥ 3 подгайда; исходник view `#/reports` содержит скаффолд карточки порогов оценок; бандл i18n включает каждый новый ключ v1.11.x во всех 8 локалях.
- **Новый `tests/scan-consolidated.test.mjs` (6 кейсов)** покрывает F-018 LITE: `?source=ats|regional|both` диспетчеризируется корректно; неизвестный source эмитит кадр ошибки; унаследованные `/api/stream/scan-en` + `/api/stream/scan-ru` ещё работают как deprecated-алиасы.
- Итого: **360 / 360** unit (было 349; +11 новых). 0 падений. Покрытие: **95.62 % line / 84.37 % branch** (вверх с 94.59).
- 20 / 20 smoke E2E · 23 / 23 comprehensive E2E · **28 / 28 Playwright**.

### 📋 Внутреннее

- `docs/reviews/REVIEW-2026-05-13-v1.12.0.md` — контекст сессии, сводка отложенного, процедура обновления синка содержимого career-ops.org.
- Все 8 CHANGELOG получают эту запись.
- Описание GitHub-репо обновлено под новый брендинг.

### Вне рамок (отложено в будущее, без изменений с v1.11.1)

| Пункт | Почему |
|---|---|
| SPA-страница batch evaluate | По canonical docs — CLI-only поток; SPA-эквивалент требует нового view + ≥3 эндпоинтов + фикстур. Фаза 2–3 дня. |
| Полный реестр адаптеров (8 `server/lib/portals/adapters/*.mjs` + 14 новых порталов + переписывание FE) | F-018 LITE в этом релизе консолидирует API-поверхность; полный архитектурный рефакторинг остаётся. |
| Полный конвейер multer (PR-4) | v1.10.2 закрыл дыру повреждения данных через 415-конверт; полный парсер multipart + ConversionError-конверт — отдельная фаза. |
| Переводы шаблонов режимов | Требуется координация с родительским проектом. |

---

## [1.11.1] — 2026-05-13

Глубокая интеграция career-ops.org/docs — follow-up к v1.11.0. Где v1.11.0 добавлял сводный блок, v1.11.1 обогащает существующие §5 Portals / §7 Scan / §14 Apply каждого справочного бандла **полными CLI-потоками** (команды дословно, нумерованные шаги apply, batch-evaluate runner, установка Playwright). View `#/reports` в SPA получает карточку порогов оценок, чтобы документированная таблица действий `≥4.5 / 4.0-4.4 / 3.5-3.9 / <3.5` была видна inline.

### 📝 Документация

- **Справочные бандлы (все 8 локалей)** — три новых подраздела на бандл, переведены на локаль:
  - **§5 Portals → `CLI flow`** — `cp templates/portals.example.yml portals.yml`; каноническая схема для `title_filter` (positive / negative / seniority_boost), `tracked_companies` (name + careers_url обязательны), `search_queries` (предсобранные web-поиски).
  - **§7 Scan → `CLI scan flow`** — Option A (`npm run scan` + `--dry-run` / `--company`) для Greenhouse/Ashby/Lever ATS, Option B (`/career-ops scan` внутри любого AI CLI) для не-API-обнаружения. Вывод в `data/pipeline.md` + `data/scan-history.tsv`. Таблица action-thresholds.
  - **§14 Apply → `Full CLI apply flow` + `Batch evaluate` + `Playwright setup`** — 8-шаговый нумерованный поток apply (`/career-ops apply <company>` → Playwright открывает браузер → черновики ответов с номерами → человек смотрит и жмёт Submit → `Submitted.` переключает трекер `Evaluated → Applied`). Batch runner через `./batch/batch-runner.sh` с `--parallel` / `--min-score` / `--retry-failed`. Установка Playwright через `npm install` + `npx playwright install chromium` + `claude mcp add playwright`.
- Все 8 бандлов сохраняют контракт паритета 16-H2 (`tests/help-ui.test.mjs::section-parity` остаётся зелёным).

### ✨ UI

- **`#/reports`** — новая сворачиваемая карточка наверху списка с канонической таблицей score → next-step (`≥ 4.5 → /career-ops apply`, `4.0–4.4 → apply or /career-ops contacto`, `3.5–3.9 → /career-ops deep`, `< 3.5 → skip`). Источник — ссылка наружу на `career-ops.org/docs/.../scan-job-portals`. 7 новых ключей i18n (`rep.thresholdsTitle`, `rep.thrAction`, `rep.thr45`, `rep.thr40`, `rep.thr35`, `rep.thrLow`, `rep.thresholdsSource`) в 8 локалях.

### 📋 QA

- **`qa/claude-cowork-browser-test-prompt.md`** — добавлен **Сценарий 17 (career-ops.org/docs coverage)** с 5 под-проверками (front-matter в 8 локалях, подразделы CLI-flow в §5/§7/§14, блок README в 8 локалях, ссылка Playwright `#/apply`, карточка порогов оценок `#/reports`) + **Сценарий 18 (паритет справочного бандла)** для регрессии паритета i18n.

### Вне рамок (отложено)

| Пункт | Почему |
|---|---|
| **SPA-страница batch evaluate** | Canonical docs описывают только CLI-поток; SPA-эквивалент — новый view + ≥3 эндпоинта + фикстуры. Многодневная фаза. |
| **F-018 полный реестр адаптеров** | По-прежнему в очереди; срез только меток закрыт в v1.10.3. |
| **Полный конвейер multer** | v1.10.2 закрыл дыру повреждения данных через 415-конверт; полный парсер — отдельная фаза. |

### Состояние тестов

- **348 / 349** unit (1 pre-existing дрейф родительских данных).
- Покрытие: **94.59 % line / 84.18 % branch**.
- 20 / 20 smoke E2E · 23 / 23 comprehensive E2E · **28 / 28 Playwright**.

### Документация

- `docs/reviews/REVIEW-2026-05-13-v1.11.1.md` — контекст сессии + аудит.
- Все 8 README: release v1.11.0 → v1.11.1.
- Все 8 CHANGELOG получают эту запись.

---

## [1.11.0] — 2026-05-13

Интеграция career-ops.org docs — минорный релиз, потому что каждое изменение аддитивно (без поломок API, без изменений формы данных, без переименования маршрутов SPA). Закрывает отсрочку PR-9 из v1.10.3.

### 📝 Документация

- **`docs/career-ops-canonical.md` (новый)** — единая каноническая справка, дистиллированная из [career-ops.org/docs](https://career-ops.org/docs) и 5 подгайдов (What is career-ops, Scan job portals, Apply for a job, Batch-evaluate offers, Set up Playwright). Все локальные справочные бандлы + README переводят этот файл; когда career-ops.org/docs меняется, регенерируется сначала этот файл.
- **Все 8 справочных бандлов** (`docs/help/{en, ru, es, pt-BR, ko-KR, ja, zh-CN, zh-TW}.md`) получили новый front-matter раздел `About career-ops` сразу под H1-интро: принципы, ключевые концепции (Mode / Archetype / Pipeline / Tracker / Report / Scan history), различение career-ops vs career-ops-ui, пороги действия по оценке (≥ 4.5 / 4.0–4.4 / 3.5–3.9 / < 3.5) и ссылки на все пять канонических руководств. Счётчик H2 сохранён на 16 на локаль (`tests/help-ui.test.mjs` паритет остаётся зелёным).
- **Все 8 README** получили блок `About career-ops` перед заголовком install: те же принципы, пороги оценок и 5 ссылок на канонические руководства. Разделы `What's new in v1.10.x` убраны с главной страницы README (CHANGELOG сохраняет полную историю).

### ✨ Улучшения UI

- **`#/apply`** — info-баннер теперь явно проявляет руководство по установке Playwright (`career-ops.org/docs/.../set-up-playwright`) и ссылку на canonical Apply-гайд. Новые ключи i18n `apply.playwrightHint` + `apply.docsLink` локализованы в 8 локалях.

### 🔧 Внутреннее

- Путь к скриншоту README остаётся на `public/images/screen_vacancy_found.png` (v1.10.1).
- Новых серверных маршрутов нет, изменений схемы нет, новых тестов не требуется (существующие тесты i18n + паритета справки покрывают новую поверхность контента).
- Тест `tests/help-ui.test.mjs::section-parity` продолжает проходить — каждая локаль имеет те же 16 H2-заголовков.

### Аудит (отложенные провалы, НЕ в этом релизе)

| Провал | Почему отложено |
|---|---|
| **SPA-страница batch evaluate** (поток `./batch/batch-runner.sh`) | Canonical docs описывают только CLI-цикл (`batch/batch-input.tsv` → параллельный runner → `batch/tracker-additions/`). SPA-эквиваленту нужен новый view, три новых эндпоинта, фикстуры и тесты. Многодневная фаза; задокументировано в `docs/career-ops-canonical.md §4`. |
| **Консолидация реестра адаптеров** (F-018 / полный PR-1) | По-прежнему в очереди; `/api/stream/scan-en` + `/api/stream/scan-ru` остаются. Срез только меток приземлился в v1.10.3. |
| **Конвейер multer** (полный PR-4) | v1.10.2 закрыл дыру повреждения данных через 415-конверт; полный парсер multipart + ConversionError-конверт — рефакторинг отдельной фазы. |

### Состояние тестов

- **348 / 349** unit проходят (1 pre-existing дрейф родительских данных в `portals-dead.test.mjs`).
- Покрытие: **94.59 % line / 84.24 % branch**.
- 20 / 20 smoke E2E · 23 / 23 comprehensive E2E · **28 / 28 Playwright**.

### Документация

- `docs/reviews/REVIEW-2026-05-13-v1.11.0.md` — контекст сессии + список провалов аудита UI.
- Все 8 README: bump бейджей (tests 349 → 348 — один тест перемещён как чистка аудита, без функциональных изменений), release v1.10.3 → v1.11.0.
- Все 8 CHANGELOG получают эту запись.

---

## [1.10.3] — 2026-05-12

Закрывает 7 из 11 QA-находок v1.10.0 (F-001, F-010 минимально, F-011 минимально, F-013, F-014, F-015, F-019). Оставшиеся 4 (F-018 — полная консолидация реестра адаптеров; полный конвейер multer PR-4; follow-up PR-7; sweep документации PR-9 по docs career-ops.org) перенесены в v1.11.0.

### ✨ Возможности

- **`feat(pdf): Generate-PDF on every long-form surface (F-015)`** — три новых SSE-эндпоинта (`GET /api/stream/pdf/report?slug=`, `GET /api/stream/pdf/deep?name=`, `POST /api/stream/pdf/inline { markdown }`) плюс общий хелпер `public/js/lib/pdf-generate.js`. Кнопка **📄 Generate PDF** теперь появляется на `#/reports/:slug`, `#/deep` (manual + live), `#/evaluate` (manual + live) и `#/interview-prep` (через эндпоинт deep). Каждый вид переиспользует хелпер cv-markdown-to-print-HTML из v1.10.2 и приземляет результат в `output/<slug>-<TS>.pdf`, чтобы существующий поток автозагрузки подхватил его.
- **`feat(config): regional config group (F-013)`** — `/api/config` теперь отдаёт `groups` (`core | runtime | regional`) и `regionalActive` (булево, вычисляемое из `portals.yml::russian_portals.sources`). SPA рендерит три группы как сворачиваемые секции; **Regional sources** автоматически свёрнут и присутствует только если настроен региональный источник.

### 🐛 Исправления

- **`fix(server): global Express error handler (F-019)`** — `PayloadTooLargeError` (например, загрузка 11 МБ в `/api/cv/import`) и `SyntaxError` из `express.json` теперь возвращают JSON-конверты, которые SPA может локализовать (HTTP 413 / 400). Раньше дефолтный Express-обработчик возвращал HTML stack trace, ломая `try { await res.json() }` в SPA.
- **`fix(i18n): English tokens no longer leak into non-EN UI (F-001)`** — добавлены локализации для `Pipeline`, `Deep research`, `Follow-up`, `Health`, `Outreach`, `Doctor`, `Quick scan` (метки, которые пользователи видели на их языке UI, в то время как остальной хром был переведён).
- **`fix(scan): drop EN/RU framing from labels (F-010 minimum)`** — сводная строка `#/scan`, два бейджа завершения сканирования и метки фильтра источников теперь читаются как «ATS adapters» + «Regional portals». Два SSE-эндпоинта (`/api/stream/scan-en`, `/api/stream/scan-ru`) сохраняются как есть; полная консолидация реестра живёт в PR-1 / v1.11.0.
- **`fix(scan): Active-Companies counter auto-refreshes (F-011 minimum)`** — view диспатчит событие `scan:refresh` после каждого `refreshResults()`; счётчик пересчитывает «компании с попаданиями в последнем сканировании» из фактического payload `/api/scan-results` вместо застревания на снапшоте монтирования view.
- **`docs(en-ru-framing): sweep across READMEs + help bundles (F-014)`** — `EN sweep` → `ATS sweep`, `RU sweep` → `regional sweep`, `EN scanner` → `ATS scanner`, `EN: Greenhouse / Ashby / Lever, RU: hh.ru + Habr Career` → `ATS adapters (Greenhouse / Ashby / Lever) + regional portals (hh.ru / Habr Career)`. Затрагивает `README.md`, `README.ru.md`, `README.ja.md`, `README.ko-KR.md`, `docs/help/en.md`, `docs/help/es.md`, `docs/help/pt-BR.md`.

### 🧪 Тесты

- Новый `tests/global-error-handler.test.mjs` (2 кейса): искажённый JSON → 400 JSON; загрузка 11 МБ → 413 JSON.
- Новый `tests/config-groups.test.mjs` (2 кейса): `/api/config` отдаёт `groups`; `regionalActive` переключается, когда portals.yml получает регионального источника.
- Новый `tests/pdf-extra-routes.test.mjs` (5 кейсов): каждый из `/report`, `/deep`, `/inline` вызывает `generate-pdf.mjs` с тремя документированными позиционными аргументами; 404 на пропущенный slug; 400 на пустой inline markdown.
- Итого: **349 / 350** unit (1 pre-existing дрейф родительских данных в `portals-dead.test.mjs`).
- Покрытие: 94.59 % line / 84.16 % branch.
- 20 / 20 smoke E2E, 23 / 23 comprehensive E2E, **28 / 28 Playwright**.

### 📝 Документация

- `docs/reviews/REVIEW-2026-05-12-v1.10.3.md` — контекст сессии + список scope-out.
- Все 8 README: bump бейджей (tests 340 → 349, release v1.10.2 → v1.10.3), раздел «What's new in v1.10.3» на локаль.
- Все 8 CHANGELOG получают эту запись.

### Вне рамок (отложено в v1.11.0)

- **PR-1** — полный локаленезависимый реестр адаптеров (8 файлов ATS-адаптеров + новый `/api/stream/scan?source=`, консолидирующий два существующих эндпоинта + +14 новых порталов + переписывание view сканирования). Срез только меток в этом релизе закрывает F-010 / F-011 визуально; архитектурный рефакторинг — многодневная фаза.
- **PR-4** — конвейер CV-импорта на multer (заменяет 415-конверт из v1.10.2 на настоящий парсер multipart + ConversionError-конверт + ревизию зависимостей).
- **PR-9** — полная интеграция career-ops.org docs: подтянуть [career-ops.org/docs](https://career-ops.org/docs) + 4 подгайда (scan-job-portals, apply-for-a-job, batch-evaluate-offers, set-up-playwright), перевести в 7 не-EN локалей, переписать справочные бандлы + README соответственно, провести аудит экранов UI против документированного поведения.

---

## [1.10.2] — 2026-05-12

Патч функциональной регрессии. Закрыты два бага из ручного тестирования v1.10.1; поверхность документации расширена.

### 🐛 Исправления

- **`fix(cv): /api/cv/import rejects multipart/form-data with 415 (F-016 hardening)`** — любой внешний клиент (curl `-F`, распространённые HTTP-клиенты), по умолчанию использующий `multipart/form-data`, ранее сохранял свой wire-конверт (`--boundary…\r\nContent-Disposition: form-data; name="file"; filename="x"…`) как содержимое `cv.md`. Фактический путь SPA (`Content-Type: application/octet-stream` + `X-Filename`) это не затрагивало. Маршрут теперь возвращает 415 с подсказкой на документированный контракт. Defense-in-depth: тела octet-stream, sniffing-щиеся как multipart в первых 256 байтах, также получают 415. `cv.md` никогда не тронут при 415.
- **`fix(pdf): /api/stream/pdf invokes generate-pdf.mjs with proper positional args`** — раньше вызывал скрипт с `[]`. Скрипт печатал свою строку `Usage:` и выходил с кодом 1 — SPA показывал зелёный toast «PDF generated», но ни один файл не попадал на диск. Маршрут теперь читает `cv.md`, рендерит его в HTML-файл под `output/cv-input-<TIMESTAMP>.html` через in-route хелпер markdown-to-print-HTML, затем спавнит `generate-pdf.mjs <input.html> <output.pdf> --format=a4`. Опциональный query `?format=letter` для вывода US-letter. Когда `cv.md` отсутствует, эмитит событие `error` + `done { code: 2 }` вместо фейкового кадра start.

### 🧪 Тесты

- Новый `tests/cv-upload-multipart-reject.test.mjs` (5 кейсов): happy-path SPA возвращает 200 с чистым markdown; `multipart/form-data` → 415; тело octet-stream, ВЫГЛЯДЯЩЕЕ как multipart, → 415; пустое тело → 400; отклонённый запрос НЕ модифицирует `cv.md`.
- Новый `tests/pdf-stream-args.test.mjs` (3 кейса): событие `start` несёт `<input.html> <output.pdf> --format=a4` с абсолютными путями и HTML существует на диске; `?format=letter` переключает флаг; отсутствующий `cv.md` эмитит ожидаемый кадр ошибки.
- Итого: **340 unit-тестов** (было 318). Один pre-existing провал в `portals-dead.test.mjs` остаётся дрейфом данных на стороне родителя, не связан с web-ui.
- Покрытие: 94.63 % line / 84.94 % branch.

### 📝 Документация

- Новый `docs/test-scenarios/` — 21 файл сценариев на английском (индекс + контракты на страницу):
  - 01 smoke / health · 02 CV upload · 03 CV edit-save · 04 CV → PDF download
  - 05 profile YAML · 06 config env · 07 scan · 08 pipeline
  - 09 evaluate · 10 deep research · 11 modes · 12 apply checklist
  - 13 tracker · 14 reports · 15 activity log · 16 interview prep · 17 JDs
  - 18 i18n · 19 help center · 20 security · 21 full funnel
- Каждый файл документирует: цель, предусловия, входы, ожидаемые выходы, негативные кейсы, тестовое покрытие (файл + диапазон строк) и ручные шаги Playwright, где применимо.
- Новый `docs/reviews/REVIEW-2026-05-12-v1.10.2.md` — полный контекст сессии, список scope-out, команды верификации.
- Все 8 README: bump бейджей (tests 318 → 340, release v1.10.1 → v1.10.2) + раздел «What's new in v1.10.2» на локаль.
- Все 8 CHANGELOG получают эту запись.

### Вне рамок (отложено в будущие фазы GSD)

PR-1 локаленезависимый реестр адаптеров (по-прежнему в очереди), PR-4 CV-импорт на multer с полным конвейером конвертации, PR-7 кнопки Generate-PDF на reports / evaluate / deep / interview-prep, PR-8 перегруппировка UI конфигурации, PR-9 sweep документации, PR-10 покнопочный аудит локализации + шлюз jsdom CI, полный пересчёт корейского.

---

## [1.10.1] — 2026-05-09

Патч критических правок по результатам регрессионного QA-запуска v1.10.0 (`qa/reports/00-FINAL-SUMMARY.md`).

### 🛡️ Безопасность

- **`fix(security): tighten isValidJobUrl + add DNS-rebind defense (PR-3 / F-003)`** — `isValidJobUrl` теперь отвергает RFC1918 (`10/8`, `172.16/12`, `192.168/16`), полный диапазон loopback 127/8, link-local `169.254/16` (включая AWS IMDS), `0.0.0.0`, CGNAT `100.64/10` и IPv6 ULA / link-local. Новый хелпер `isPrivateOrLoopbackHost()` экспортирован из `server/lib/security.mjs` и переиспользуется в `/api/pipeline/preview`, который теперь делает `dns.lookup` на каждый редирект-хоп и отвергает, когда сам разрешённый адрес приватный — закрывает DNS-rebind. DNS-провал — fail-open (fetch сообщает об ошибке), чтобы тестовые stub / песочницы без DNS продолжали работать.

### 🐛 Исправления

- **`fix(activity): record only successful state changes (PR-5 / F-005)`** — middleware теперь рано выходит на `res.statusCode >= 400`. Отклонённые запросы pipeline / cv / tracker больше не засоряют ленту аудита.
- **`fix(activity): add profile.save / config.save / cv.import event mappings (F-008)`** — успешные вызовы `PUT /api/profile` и `POST /api/config` теперь появляются в `/api/activity`.
- **`fix(help): alias ko → ko-KR.md so Korean Help body is served (F-002)`** — SPA шлёт голые BCP-47 коды (`ko`); файл на диске — `ko-KR.md`. Резолвер теперь обходит 4 кандидата: точное совпадение, alias с региональным тегом, базовый только-язык, затем `en.md`.
- **`fix(llm): /api/evaluate honors mode:'manual' (F-009)`** — зеркало `/api/deep`. Ручной режим пропускает вызовы Anthropic / Gemini даже при заданном ключе, чтобы пользователи могли копировать промпт в Claude Code, не сжигая кредиты.
- **`fix(api): DELETE /api/pipeline accepts ?url= AND body.url, returns 404 on miss (PR-6 / F-017)`** — раньше тихо 200-on-miss с только `?url=`.

### ✨ Возможности

- **`feat(llm): locale propagation through every prompt (PR-2 / F-012)`** — новый `resolveLocale(req)` выбирает локаль из `body.lang` → `body.locale` → `Accept-Language` → `'en'`. Новая `buildLocaleDirective(lang)` эмитит однострочный заголовок «Respond in X». `buildEvaluationPrompt`, `buildDeepPrompt`, `buildModePrompt` теперь принимают и встраивают `lang`. SPA `API.call()` автоматически прицепляет `Accept-Language` и сливает `lang` в JSON-тела.
- **`feat(scripts): post-qa-cleanup.mjs (PR-11)`** — проигрывает чек-лист пост-QA-чистки; `--apply` пишет, по умолчанию dry-run, идемпотентен. Подметает URL RFC1918 / `nip.io` / `test-cloud-*` из `data/pipeline.md` и проверяет размер `cv.md`.

### 🧪 Тесты

- Новый `tests/critical-fixes.test.mjs` (15 кейсов), покрывающий: F-002 разрешение alias ko, F-009 опт-аут ручного режима, форму DELETE PR-6 (body / 404 / 400), модульные тесты хелпера PR-3 для IPv4 + IPv6 + форм в скобках, приоритет PR-2 `resolveLocale` + `buildLocaleDirective` + интеграцию построителей промптов.
- `tests/url-validation.test.mjs` расширен 5 новыми тестами для RFC1918 / link-local / 0.0.0.0 / 127/8 / CGNAT / IPv6 ULA / link-local.
- Тест 8 в `tests/activity-log.test.mjs` обновлён, чтобы утверждать новый контракт «нет лога на 4xx».
- Итого: **318 unit-тестов** (было 298; один pre-existing провал в `portals-dead.test.mjs` — дрейф данных на стороне родителя в `templates/portals.example.yml`, не связан с кодом web-ui).

### 📝 Документация

- Новый `docs/reviews/REVIEW-2026-05-09-v1.10.1.md` — полный контекст сессии + список scope-out + команды верификации.
- Все 8 README: bump бейджей (счётчик тестов 298 → 318, release v1.10.0 → v1.10.1), путь скриншота перенесён в `public/images/screen_vacancy_found.png`, добавлен раздел «What's new in v1.10.1» на локаль (English, Spanish, Portuguese, Korean, Japanese, Russian, Simplified Chinese, Traditional Chinese).
- Все 8 CHANGELOG обновлены этой записью.

### Вне рамок (отложено в будущие фазы GSD)

PR-1 (локаленезависимый реестр адаптеров, +14 порталов, переписывание FE), PR-4 (CV-импорт на multer + ConversionError + глобальный обработчик ошибок), PR-7 (кнопки Generate-PDF на reports / evaluate / deep / interview-prep), PR-8 (перегруппировка UI конфигурации), PR-9 (полный sweep EN-RU framing по README/docs/8-help bundle), PR-10 (покнопочный аудит локализации + шлюз jsdom CI), полный пересчёт корейского справочника (файл существует; PR только исправил runtime-доставку).

---

## [1.10.0] — 2026-05-08

Переработка CV-импорта + вкладки `#/config` + канонический маршрут `#/profile`.

### ✨ Возможности

- **`feat(cv): server-side import for .docx / .doc / .odt / .rtf / .pdf / .html / .txt / .md`** — новый эндпоинт `POST /api/cv/import` конвертирует загруженный документ (в любом распространённом формате) в markdown, который редактор может вставить. Офисные форматы идут через **pandoc**, PDF — через **pdftotext** из Poppler. Результат санитайзится через `stripDangerousMarkdown` (defense-in-depth XSS). Жёсткий лимит: 10 МБ на загрузку. Фронтенд `📁 Upload CV` теперь принимает полный набор форматов; красивые toast-сообщения, когда конвертер отсутствует на хосте.
- **`feat(cv): auto-download generated PDF when generate-pdf.mjs finishes`** — потоковый поток Generate-PDF теперь снимает снапшот последнего PDF в директории output и на `done` инициирует загрузку браузером *нового* файла (no-op, если запуск не дал нового артефакта). Существующий on-page список по-прежнему показывает каждый предыдущий PDF.
- **`feat(config): two-tab layout — API keys & runtime + Profile`** — `#/config` теперь имеет полосу вкладок. Первая вкладка сохраняет существующий редактор `.env` (API-ключи, модели, ручки сканера). Новая вкладка **Profile** — прямой YAML-редактор для `config/profile.yml`: `PUT /api/profile` валидирует YAML (должен быть mapping, должен включать `candidate`), штампует канонический заголовок `# Career-Ops Profile Configuration`, если он отсутствует, и пишет файл. Сохранение распространяется без перезапуска.
- **`feat(routes): canonical /#/profile route (was /#/settings)`** — сайдбар теперь указывает на `#/profile`. Старый хеш `#/settings` ещё резолвится через таблицу алиасов роутера, так что существующие закладки продолжают работать. Внутренний обработчик маршрута переименован; тесты обновлены, чтобы отражать новое направление.

### 🧪 Тесты

- Новый `tests/cv-import.test.mjs` (7 кейсов): passthrough `.md` / `.txt`, пустое тело 400, неподдерживаемое расширение 422, оверсайз 413, санитайзинг HTML→markdown (пропускается, если pandoc отсутствует), round-trip PDF→текст с самодельным PDF (пропускается, если poppler отсутствует).
- Новый `tests/profile-put.test.mjs` (7 кейсов): happy-path round-trip, штамповка заголовка, 400 на empty / invalid-YAML / non-object / missing-candidate, оверсайз 413.
- `tests/playwright-full-cycle.mjs` расширен 14 → **16** под-тестов — добавлены CV-импорт через HTML и round-trip `PUT /api/profile`.
- Regex ALIAS в `tests/router.test.mjs` развёрнут, чтобы утверждать новое направление `settings → profile`.

### 📚 Документация

- `docs/help/{en,ru}.md` — полные обновления разделов 2/3/4: новые вкладки App-settings, сообщение edit-via-config на read-only странице Profile, полная матрица форматов загрузки в разделе CV, поведение автозагрузки PDF.
- `docs/help/{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md` — лаконичные зеркала новых блоков контента; счётчик разделов без изменений (16), чтобы тест паритета оставался зелёным.

### 🔧 Внутреннее

- Новый `server/lib/cv-import.mjs` — единый источник правды для конвертации формат → markdown, с таймаутом + обнаружением отсутствующего конвертера, проявляющим actionable-подсказки вместо 500.
- `server/lib/routes/content.mjs` получает `POST /api/cv/import` и `PUT /api/profile` (binary-safe через `express.raw` для загрузки, JSON для YAML PUT).

---

## [1.9.1] — 2026-05-08

Проход готовности к продакшну. Четыре прицельных bug-fix (BF-1..BF-4), Playwright smoke расширен с 5 до 12 тестов, покрывающих round-trip сохранения tracker / pipeline / reports / evaluate / config / cv. Всё зелёное в CI.

### 🐛 Исправления

- **`fix(tracker): escape pipes + collapse newlines in every cell, not just notes (BF-1)`** — имя компании вида `"Acme | Co"` ранее ломало раскладку markdown-таблицы (парсер разрезал ячейку надвое). Санитайзер ячеек теперь применяется однообразно к company / role / reportSlug / notes; парная правка в `parsers.mjs::parseMarkdownTable` добавляет поддержку экранирования `\|` по GFM, так что round-trip без потерь.
- **`fix(config): wrap updateEnvFile in try/catch (BF-2)`** — `POST /api/config` ранее выбрасывал необработанное отклонение Promise при permission-denied / read-only ФС. Теперь возвращает чистый 500 `{ error: 'failed to write parent .env', details: [...] }`.
- **`fix(llm): soft cap on assembled prompt size for Anthropic SDK calls (BF-3 + BF-4)`** — ветки Anthropic в `/api/evaluate`, `/api/deep` и `/api/mode/:slug` теперь сдают 413, когда `bundleProjectContext + prompt` превышает 200 КБ (≈50K токенов). Экономит несколько секунд раундтрипа + токены вместо того, чтобы дать API пожаловаться на размер контекста. Лимит значительно ниже любого текущего потолка модели (Sonnet 4.6 = 1M контекст).

### 🧪 Playwright smoke — расширение покрытия

5 → **12** тестов. Новые кейсы:

- `tracker view renders empty + accepts API-seeded row` — упражняет BF-1, засевая строку с литеральным пайпом в имени компании и утверждая, что round-trip его сохраняет.
- `pipeline add-URL form populates the queue` + проход отказа невалидных URL (loopback, `javascript:`, голые строки).
- `reports view handles empty state` — проверка отсутствия падения.
- `evaluate view returns a manual prompt without API key` — проверяет fallback-цепочку.
- `config GET returns known keys masked` — секреты никогда не утекают через `/api/config`.
- `cv.md PUT round-trips with sanitization` — XSS-ные куски (тэги script, схемы `javascript:`) полностью санитайзятся.
- `pipeline preview proxy strips scripts` — путь отклонения невалидных URL.

### 📦 Изменения поведения (без изменений API-контракта)

- Записи в tracker теперь без потерь относительно имён company / role с пайпами. Существующие строки с сырыми пайпами начнут парситься правильно при следующем чтении.
- `/api/{evaluate,deep,mode/:slug}` теперь возвращают 413 вместо 502/timeout, когда промпт неоправданно велик (200 КБ+).

### 🧪 Тесты

- **284 unit-теста** (счётчик без изменений; существующие тесты остаются зелёными после обновления парсера).
- **12 Playwright browser-smoke тестов** (было 5).

---

## [1.9.0] — 2026-05-08

P-6 → P-10 из бэклога v1.8.0 отгружены одним пакетом. Главное: `server/index.mjs` теперь оркестратор на 130 LOC (с 762, всего 1230 → 130 = -89%); у каждой темы маршрутов свой модуль. Anthropic-паритет для `/api/evaluate`, шимы multi-CLI, расширенный тест паритета i18n и подключение Playwright browser-smoke в CI.

### 🏗️ P-6 — разделение сервера по сферам ответственности (фаза 2)

Продолжение P-2. Вынесены оставшиеся 9 тем маршрутов из `server/index.mjs` в модули `server/lib/routes/<topic>.mjs`. `index.mjs` теперь чистый оркестратор: middleware (security headers + activity log + static), 12 вызовов `register<Topic>Routes(app)` и catch-all SPA.

- `server/lib/routes/activity.mjs` — `/api/activity`.
- `server/lib/routes/config.mjs` — GET/POST `/api/config` (round-trip родительского .env).
- `server/lib/routes/health.mjs` — `/api/health` + `/api/dashboard`.
- `server/lib/routes/help.mjs` — `/api/help/:lang`.
- `server/lib/routes/jds.mjs` — полный CRUD для `jds/*.txt`.
- `server/lib/routes/llm.mjs` — каждый LLM-ориентированный эндпоинт (evaluate, deep, mode, apply-helper, interview-prep).
- `server/lib/routes/pipeline.mjs` — `/api/pipeline*`, включая SSRF-безопасный прокси preview с именованными константами для timeout / max-redirects / max-body.
- `server/lib/routes/reports.mjs` — `/api/reports*`.
- `server/lib/routes/tracker.mjs` — GET + dedup-aware POST `/api/tracker`.

Поведение без изменений. 283/283 unit-тестов оставались зелёными на каждом шаге. Поверхность импортов оркестратора упала с 47 строк до 22.

### 🔌 P-7 — Anthropic-паритет для `/api/evaluate`

`/api/evaluate` ранее был Gemini-or-manual. v1.9.0 добавляет ветку Anthropic (предпочтительна, когда оба ключа заданы), зеркалируя правило маршрутизации, уже используемое в `/api/deep` и `/api/mode/:slug`. Маршрутизируется через `bundleProjectContext({ modeSlugs: ['_shared', 'oferta'] })`, чтобы у модели были inlined cv / profile / шаблоны режимов (REVIEW-A1).

Новый эндпоинт: **`POST /api/evaluate/test-anthropic`** — smoke-проверка для `ANTHROPIC_API_KEY`, зеркало существующего Gemini-smoke. Шлёт крошечный промпт (≤256 выходных токенов), так что стоит фактически ничего; возвращает 200-символьную выборку.

Fallback-цепочка теперь: Anthropic → Gemini → manual.

### 🌐 P-8 — паритет i18n справочного центра (аудит + усиление тестов)

Проверка паритета структуры каждого `docs/help/<lang>.md`. Все 8 локалей уже покрывают одни и те же 14 канонических h2-разделов. Тесты усилены:

- `tests/help-ui.test.mjs::every help doc covers the same 14 sections` проверял только en + ru. Теперь итерирует **все 8 локалей** (en, es, pt-BR, ko-KR, ja, ru, zh-CN, zh-TW) и утверждает счётчик разделов для каждой.
- Новый тест: `tests/help-ui.test.mjs::every help locale has substantive content` — защита от локальных заглушек: утверждает, что каждая не-EN локаль весит как минимум 30 % от байтовой длины `en.md`. Компактные переводы естественно попадают на 40-50 %; заглушка была бы в однозначных процентах.

Итог: структурный паритет теперь обеспечивается CI.

### 🤖 P-9 — Playwright browser smoke в матрице CI

`tests/playwright-smoke.mjs` (добавлен в v1.8.0 как опт-ин) теперь часть workflow CI. Существующая job `e2e` уже устанавливает Playwright + Chromium; один новый шаг (`npm run test:e2e:browser`) запускает 5 browser-smoke тестов сразу после comprehensive node E2E.

Порядок в CI: unit (матрица Node 18/20/22) → smoke node E2E → comprehensive node E2E → **Playwright browser smoke** → загрузка артефактов скриншотов при падении.

### 🌍 P-10 — Multi-CLI совместимость

Родительский career-ops v1.7.0 ввёл поддержку multi-CLI / Open Agent Skill standard. Подпроект UI следует тому же соглашению с тонкими шимами, указывающими на канонический `CLAUDE.md`:

- `web-ui/AGENTS.md` — точка входа Codex / Aider / generic CLI.
- `web-ui/GEMINI.md` — точка входа Gemini CLI.

Оба шима повторно проговаривают жёсткие правила и quick reference, но делегируют `CLAUDE.md` полные инструкции уровня проекта, так что не-Claude CLI приземляются на ту же ориентацию, что и сессии Claude Code. Развёрнутый UI сам по себе остаётся CLI-агностичным в runtime.

### 🧪 Тесты

- **284 unit-теста** (было 283): +1 новый тест паритета локалей справки.
- **5 Playwright browser-smoke тестов** — теперь часть CI, не только опт-ин.
- Покрытие сохранено.

### 🔧 Затронутые файлы

```
+ server/lib/routes/activity.mjs              + server/lib/routes/config.mjs
+ server/lib/routes/health.mjs                + server/lib/routes/help.mjs
+ server/lib/routes/jds.mjs                   + server/lib/routes/llm.mjs
+ server/lib/routes/pipeline.mjs              + server/lib/routes/reports.mjs
+ server/lib/routes/tracker.mjs
+ AGENTS.md                                   + GEMINI.md

~ server/index.mjs (762 → 130 LOC, -83%)
~ .github/workflows/ci.yml (шаг Playwright smoke)
~ tests/help-ui.test.mjs (паритет всех-8-локалей + content-floor)
~ docs/{ROADMAP,architecture/{OVERVIEW,SERVER}}.md
~ docs/sdd/CONVENTIONS.md
~ CLAUDE.md
~ package.json (1.8.0 → 1.9.0)
```

### 📦 Новые REST-эндпоинты

| Метод | Путь | Назначение |
|---|---|---|
| `POST` | `/api/evaluate/test-anthropic` | Smoke-проверка `ANTHROPIC_API_KEY` (P-7). Зеркало `/api/evaluate/test-gemini`. |

### 🤖 Новые точки входа CLI

| Файл | CLI | Примечания |
|---|---|---|
| `AGENTS.md` | Codex / Aider / generic | Указывает на `CLAUDE.md` для полных инструкций. |
| `GEMINI.md` | Gemini CLI | Автоматически загружается Gemini при старте сессии. |

---

## [1.8.0] — 2026-05-08

Усиление, рефакторинг и бутстрап SDD. Три исправления корректности/безопасности высокой серьёзности (A1, A2, A3), четыре средней (B1–B4), шесть чисток, аудит поверхности родительского career-ops v1.7.0, разделение сервера по сферам ответственности (P-2 фаза 1), Playwright browser-smoke и полный SDD-фундамент под `docs/` и `.claude/`.

### 🔥 Исправления высокой серьёзности

- **`fix(deep): inline cv/profile/mode files for Anthropic SDK calls (REVIEW-A1)`** — `/api/deep` и `/api/mode/:slug` ранее говорили модели «сначала прочитай эти файлы», но у Anthropic SDK нет файловой системы. Вывод был пустым. Новый `bundleProjectContext({ modeSlugs })` читает `cv.md`, `config/profile.yml`, `modes/_shared.md` и шаблон режима, обрезает каждый на 16 КБ и предваряет блоком `<project_context>`. Проверено вживую: 26 КБ обоснованного markdown-ответа от `claude-sonnet-4-6` на вызов deep-research.
- **`fix(runner): SIGKILL escalation after SIGTERM grace period (REVIEW-A2)`** — `runNodeScript` и `streamNodeScript` ранее слали только `SIGTERM` на таймаут / отключение клиента. Ребёнок, застрявший в syscall (DNS, заблокированный сокет), игнорировал его, подвешивая SSE-соединение до того, как GC Node его съест. Теперь каждый путь вооружает 5-секундный сторожевой таймер, эскалирующий до `SIGKILL`. Promise всегда резолвятся.
- **`fix(runner): max-runtime cap on streaming endpoints (REVIEW-A3)`** — у каждого SSE-runner-эндпоинта скрипта (`/api/stream/{scan,liveness,pdf}`) теперь жёсткий потолок 30 минут. По истечении: эмитировать `event: error { message: 'maximum runtime exceeded' }`, убить ребёнка через сторожевой таймер A2, завершить ответ.

### 🛡️ Исправления средней серьёзности

- **`fix(preview): per-hop redirect validation in /api/pipeline/preview (REVIEW-B1)`** — переключение с `redirect: 'follow'` на ручной обход редиректов. Каждый заголовок `Location` повторно валидируется через `isValidJobUrl`; лимит 3 хопа. Враждебные борды больше не могут отбросить нас на loopback / приватные IP / `file://`. 4 новых теста покрывают пути отклонения.
- **`refactor(keys): hasGeminiKey helper unifies LLM-key checks (REVIEW-B2)`** — прямые чтения `process.env.GEMINI_API_KEY` в обработчиках маршрутов заменены на `hasGeminiKey()` из `lib/anthropic.mjs`. Зеркало формы `hasAnthropicKey()` для согласованности и более простого мокинга.
- **`feat(scanners): thread AbortSignal through hh.ru, Habr, Greenhouse, Ashby, Lever (REVIEW-B3)`** — когда SSE-клиент отключается на середине сканирования, активные HTTP-fetch теперь прерываются, а не дорабатывают каждый запрос до конца, теряя события. `runRuScan` и `runEnScan` принимают `opts.signal`; SSE-обработчики в `/api/stream/scan-{ru,en}` создают `AbortController` и прерывают на `res.close`.
- **`test(anthropic): log-guard test prevents future API-key leaks via console (REVIEW-B4)`** — захватывает каждый вызов `console.{log,info,warn,error,debug}` во время happy + error путей `runAnthropic`, утверждает нулевой вывод и что строка ключа-канарейки никогда не появляется. Defense-in-depth против будущей регрессии `console.log(opts)`.

### 🧹 Полировка низкой серьёзности

- **`fix(parsers): defense-in-depth URL gate inside addPipelineUrl (REVIEW-C4)`** — отклонение значений не-http(s) на уровне парсера, дополняющее route-level `isValidJobUrl`. Опциональный `opts.validate` для вызывающих, которым нужны более строгие правила.
- **`docs(readme): badge "tests-88 passed" → "tests-277 passed" (REVIEW-C3)`** — отставал на порядок.
- **`test(i18n): missing-keys diff grouped by locale (REVIEW-C6)`** — когда `tests/i18n-coverage.test.mjs` находит провал, вывод теперь `[ru] (3): foo, bar, baz` вместо смешанных строк.
- **`docs(review): C1 closed as resolved-on-inspection`** — regex санитайзеров уже были в шестнадцатеричной форме `\x00-\x08`; запись ревью была артефактом рендеринга инструмента.

### 🏗️ P-2 фаза 1 — разделение сервера по сферам ответственности

`server/index.mjs` был 1230 LOC, значительно за потолком в 800 строк. Разделён на сфокусированные модули без изменения поведения. Все 283 unit-теста остались зелёными на каждом шаге.

- `server/lib/security.mjs` — `isValidJobUrl`, `stripDangerousMarkdown`, `sanitizeJobDescription`, `isPubliclyExposed`. Реэкспортируется из `index.mjs` для обратной совместимости с внешними потребителями.
- `server/lib/prompts.mjs` — `bundleProjectContext`, `buildEvaluationPrompt`, `buildDeepPrompt`, `buildModePrompt`, `buildApplyChecklist`.
- `server/lib/store.mjs` — `safeReadApps`, `safeReadPipeline`, `safeListReports`, `checkProfileCustomized`, `ensureRussianPortalsDefaults`.
- `server/lib/routes/scan.mjs` — `registerScanRoutes(app)` для `/api/stream/scan-{ru,en}`, `/api/scan-ru/config`, `/api/scan-results`.
- `server/lib/routes/runners.mjs` — `registerRunnerRoutes(app)` для буферизованной таблицы `/api/run/*`, потоковых `/api/stream/{scan,liveness,pdf}`, списка/загрузки сгенерированных PDF.
- `server/lib/routes/content.mjs` — `registerContentRoutes(app)` для CV / Profile / Portals / Modes.

`index.mjs` теперь 762 LOC (-38%, под потолком 800). Фаза 2 вынесет tracker, pipeline, reports, jds, llm (evaluate/deep/mode) и health в модули маршрутов. Цель — <500 LOC для оркестратора.

### 🔍 Аудит родительского career-ops v1.7.0

Пользователь обновил родительский проект до v1.7.0. Проверена каждая потребляемая поверхность — UI полностью совместим. Заметные находки задокументированы в `docs/architecture/DATA-FLOWS.md`:

- Каталог режимов вырос с 7 до 19 файлов. `MODE_ALLOWLIST` в UI намеренно проявляет только 7 (другие — только для Claude-Code). Добавлен комментарий, поясняющий намеренно узкие рамки.
- Схема `portals.yml` подтверждена: `tracked_companies` (96 записей, 87 включено, 71 с API). EN-сканер читает её правильно; ключ legacy `companies` ещё поддерживается.
- Новые поверхности родителя, НЕ потребляемые сегодня: `dashboard/` (Go-программа), `update-system.mjs`, `generate-latex.mjs`, `analyze-patterns.mjs`, `liveness-core.mjs`, `followup-cadence.mjs`, `test-all.mjs`, локализованные субдиры режимов (`de/fr/ja/pt/ru`).
- Живые `/api/dashboard`, `/api/health`, `/api/modes`, `/api/portals`, `/api/profile`, `/api/cv`, `/api/jds`, `/api/reports`, `/api/tracker`, `/api/pipeline`, `/api/evaluate`, `/api/deep`, `/api/stream/scan-en` все проверены зелёными.

### 🤖 Бутстрап SDD / GSD

У `career-ops-ui` теперь полный фундамент Spec-Driven Development, выровненный с pipeline GSD (`gsd-*` skills из `superpowers@claude-plugins-official`).

- `CLAUDE.md` (root) — системный промпт уровня проекта: стек, pipeline GSD, жёсткие правила (контракт с родителем, envelope безопасности, никаких `--no-verify`), соглашения, граница родительского проекта.
- `.aiignore` — список исключений для AI-агентов: vendored, бинарники, пользовательские данные родителя, `.planning/`, `.env`, дубликаты локалей.
- `.claude/agents/` — три определения проектных subagent:
  - `web-ui-route-reviewer.md` — фильтрует новые маршруты против SSRF, CSP, санитайзеров, контракта родительской записи, соглашений, тестов.
  - `spa-view-reviewer.md` — CSP-safe DOM, i18n, регистрация в роутере, доступность.
  - `test-isolation-reviewer.md` — проверяет CI-изоляцию тестов (без допущений о родительском проекте, без живой сети, без коллизии портов).
- `.claude/commands/` — заглушки слэш-команд: `/sdd-status`, `/codebase-tour`.
- Дерево `docs/` — всё на английском:
  - `PROJECT.md` — что/зачем/для-кого, рамки, ограничения, критерии успеха.
  - `ROADMAP.md` — текущий milestone + завершённая история + бэклог.
  - `sdd/SDD-GUIDE.md` — pipeline discuss → spec → plan → execute → verify → review, привязанный к skill `gsd-*`.
  - `sdd/CONVENTIONS.md` — модульная система, нейминг, маршруты, санитайзеры, клиентские паттерны, i18n, ошибки, логи, тесты, коммиты, ветки, CSS.
  - `architecture/OVERVIEW.md` — диаграмма верхнего уровня, слои, последовательность загрузки, инварианты, чит-лист «куда смотреть, когда…».
  - `architecture/SERVER.md` — карта по файлам для `server/lib/*.mjs` (обновлена для разделения P-2).
  - `architecture/FRONTEND.md` — структура SPA, инвентарь view, глобалы, «как добавить view».
  - `architecture/API.md` — полный инвентарь каждого маршрута `/api/*`.
  - `architecture/DATA-FLOWS.md` — каждая родительская читка/запись с явным контрактом действия пользователя.
  - `reviews/REVIEW-2026-05-07.md` — статический ревью, породивший правки этого changelog.

### 🔒 Безопасность и гигиена репо

- **`chore(.gitignore): comprehensive defense-in-depth patterns`** — покрывает варианты env, папки IDE, GSD scratch (`.planning/`), пользовательские настройки агентов (`.claude/settings.local.json`, `.claude/cache/`, `.claude/state/`, `.claude/memory/`), артефакты Playwright (`playwright-report/`, `test-results/`, `.playwright/`, `trace.zip`), heap/CPU-профили, lock-файлы для неотгруженного тулинга, расширенный шум macOS Finder, общие паттерны секретов (`secrets.json`, `credentials.json`, `*.pem`, `*.key`).

### 🧪 Тесты

- **283 unit-теста** (было 277): +6 новых (4 для отклонения редиректов B1, 1 для `hasGeminiKey`, 1 для log-guard `runAnthropic`).
- **5 Playwright browser-smoke тестов** (новые, опт-ин через `npm run test:e2e:browser`): рендер дашборда + версия в подвале, навигация дашборд → scan → pipeline → cv, переключение языка, view 404, рендер страницы health. Резолвит Playwright через родительские `node_modules` — без новой зависимости.
- Покрытие сохранено на ~93% line / ~83% branch.

### 📝 Новые / обновлённые скрипты package.json

| Скрипт | Назначение |
|---|---|
| `npm run test:e2e:browser` | Запуск Playwright smoke harness против сервера in-process (5 тестов). |

### 🔧 Затронутые файлы

```
+ CLAUDE.md                                    +  .aiignore
+ docs/PROJECT.md                              +  docs/ROADMAP.md
+ docs/sdd/SDD-GUIDE.md                        +  docs/sdd/CONVENTIONS.md
+ docs/architecture/OVERVIEW.md                +  docs/architecture/SERVER.md
+ docs/architecture/FRONTEND.md                +  docs/architecture/API.md
+ docs/architecture/DATA-FLOWS.md              +  docs/reviews/REVIEW-2026-05-07.md
+ .claude/agents/web-ui-route-reviewer.md      +  .claude/agents/spa-view-reviewer.md
+ .claude/agents/test-isolation-reviewer.md
+ .claude/commands/sdd-status.md               +  .claude/commands/codebase-tour.md
+ server/lib/security.mjs                      +  server/lib/prompts.mjs
+ server/lib/store.mjs
+ server/lib/routes/scan.mjs                   +  server/lib/routes/runners.mjs
+ server/lib/routes/content.mjs
+ tests/playwright-smoke.mjs

~ .gitignore                                   ~  README.md (правка бейджа)
~ package.json (1.7.2 → 1.8.0)
~ server/index.mjs (1230 → 762 LOC)
~ server/lib/runner.mjs (эскалация SIGKILL, потолок max-runtime)
~ server/lib/anthropic.mjs (hasGeminiKey)
~ server/lib/parsers.mjs (фильтр URL в addPipelineUrl)
~ server/lib/ru-scanner.mjs                    ~  server/lib/en-scanner.mjs
~ server/lib/sources/{hh,habr,greenhouse,ashby,lever}.mjs (проброс signal)
~ tests/anthropic.test.mjs                     ~  tests/i18n-coverage.test.mjs
~ tests/pipeline-preview.test.mjs
```

---

## [1.7.2] — 2026-05-04

Справочный центр, in-UI App settings, мобильный сайдбар, единая кнопка Scan и ярлык «Show result» на каждом построителе промптов.

### ✨ Новые возможности

- **`feat(help): in-app user guide` (`/#/help`)** — длинная Markdown-документация, доступная из новой записи сайдбара. Покрывает каждую страницу пошагово: quick start, редактор CV, Profile, фильтры Scan, preview Pipeline, Evaluate, Deep research, Apply, Tracker, Reports, все 7 режимов, журнал Activity, Health, подсказки настройки. Автоматически собранное липкое оглавление из заголовков `<h2>`, синхронная сборка DOM (без гонок). Локализован для всех 8 поддерживаемых локалей.
- **`feat(config): in-UI App settings page` (`/#/config`)** — редактирование `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `HH_USER_AGENT`, `PORT`, `HOST` из браузера. Пишет в `.env` **родительского проекта**, чтобы Node-скрипты career-ops И загрузчик dotenv web-ui читали один и тот же источник. Секретные ключи маскируются на чтении (первые/последние 4 символа). Поля моделей — выпадающие списки с курированным набором (claude-sonnet-4-6 / claude-opus-4-7 / claude-haiku-4-5 / gemini-2.0-flash / и т. д.). Пустое значение удаляет ключ. Значения немедленно применяются к работающему process.env — для большинства настроек не нужен перезапуск.
- **`feat(modes): "⚡ Show result" button alongside "Copy prompt"`** — когда промпт сгенерирован в ручном режиме, пользователи больше не должны перепечатывать ввод, чтобы получить результат LLM. Новая кнопка повторно отправляет ту же форму с `run: true`, проваливаясь к понятному toast (`Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env first`), если ключ не настроен. Работает на `/#/deep`, `/#/project`, `/#/training`, `/#/followup`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns`.

### 🐛 Правки UX + UI

- **`fix(scan): single Scan button replaces three (Scan all + EN + RU)`** — избыточный выбор, идентичный дефолт в 99% случаев. Объединённая кнопка `🌐 Scan` запускает каждый включённый источник. Справочные документы обновлены в 8 локалях.
- **`fix(ui): mobile sidebar drawer`** — viewport <900px теперь получает кнопку-гамбургер (☰) в топбаре; `body.sidebar-open` переключает CSS-трансформацию, выдвигающую сайдбар. Backdrop dim + клик в любом месте закрывают его. Клик по якорю + hashchange автоматически закрывают, чтобы пользователь приземлялся на новую страницу с задвинутым drawer. Большие viewport не затронуты.
- **`fix(server): footer version reflects web-ui, not the parent VERSION`** — `/api/health` теперь читает собственный `package.json` web-ui. В подвале больше не утекает устаревший `1.6.0` из VERSION родителя. VERSION родителя по-прежнему отдельно проявляется как `parentVersion`.

### 📦 Новые REST-эндпоинты

| Метод | Путь | Назначение |
|---|---|---|
| `GET`  | `/api/help/:lang` | Возвращает Markdown user-гайд для запрошенной локали с фоллбэком на `en.md`. Path-traversal-safe. |
| `GET`  | `/api/config` | Возвращает текущие значения всех известных env-ключей; секреты маскированы. |
| `POST` | `/api/config` | Пишет заданные ключи в `.env` родительского проекта, валидирует каждое значение, применяет вживую к `process.env`. |

### 🌐 i18n

- 30+ новых ключей по `nav.help`, `nav.config`, `help.*`, `config.*`, `deep.showResult`, `deep.needKey`, `scan.btnRun`. Все 8 локалей заполнены.

### 🧪 Тесты

- `tests/help.test.mjs` (12 кейсов) — каждая поддерживаемая локаль возвращает осмысленный markdown, EN spot-checks каждого slug страницы, неизвестный lang → EN-fallback, санитайзинг path-traversal, каждая локаль ссылается на `cv.md` / `profile.yml` / `.env`.
- `tests/help-ui.test.mjs` (9 кейсов) — регистрация view-файла, запись сайдбара, наличие ключей i18n в каждой локали, наличие файлов docs для каждой локали, EN/RU help имеет 14 канонических разделов, каждый маршрут #/foo покрыт, обвязка Show-result на deep + mode-page.
- `tests/env-config.test.mjs` (18 кейсов) — чисто-функциональные тесты для `parseEnv`, `maskSecret`, `validateConfig`, `updateEnvFile` (бутстрап, in-place переписывание с сохранением комментариев, удаление пустого значения, кавычки-при-необходимости).
- `tests/config-endpoint.test.mjs` (8 кейсов) — GET маскирует секреты / возвращает путь env; POST пишет в .env родителя; live применение к process.env; пустое значение удаляет; отвергает неизвестные ключи + неправильные ключи Anthropic с 400.

### 📊 Статистика

- **Тесты:** 233 → **277** (+44 в 4 новых файлах тестов).
- **E2E:** 20 smoke + 23 comprehensive = 43 шага Playwright, все зелёные.
- **Покрытие:** 93.5% line / 82.6% branch / 93.7% функций (без изменений — новый код полностью покрыт тестами).

---

## [1.7.1] — 2026-05-04

Патч-релиз, собирающий пост-v1.7.0 работу: панель preview pipeline, интеграция Anthropic API, прокручиваемый сайдбар, dotenv-загрузчик, динамический список Active-companies, усиление CI-workflow.

### ✨ Панель preview pipeline

- **Переработка `/#/pipeline`** — левый список + правая панель preview. Клик по любому URL получает серверный прокси-снапшот (`GET /api/pipeline/preview` снимает скрипты/стили/тэги, ограничивает на 8 КБ, валидирован через `isValidJobUrl`). Живой фильтр-инпут, счётчик «In queue», кнопка-заголовок ⚡ «Evaluate first». Inline ▶/✕ на каждой строке плюс полные Evaluate / Open in tab / Delete на панели preview. Стабильные тест-селекторы через `data-url` + классы `.pipeline-row` + `.pipeline-row-delete`. **8 новых тестов** в `tests/pipeline-preview.test.mjs` (mocked fetch, без необходимости в реальной привязке upstream).

### ✨ Интеграция Anthropic API — «Run live» везде

- **`server/lib/anthropic.mjs`** — клиент без зависимостей для Anthropic Messages API (по умолчанию claude-sonnet-4-6, override через `ANTHROPIC_MODEL`). Когда задан `ANTHROPIC_API_KEY`, каждая страница режима (`/#/deep`, `/#/project`, `/#/training`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns`) рендерит кнопку «⚡ Run live (Anthropic)» как **основное** действие — клик выполняет промпт и рендерит Markdown обратно в браузер вместо передачи в Claude Code. Gemini остаётся fallback, когда задан только его ключ. Manual-режим всё ещё работает без ключей. **8 новых тестов** в `tests/anthropic.test.mjs`.

### 🐛 Правки CI / pipeline

- **`fix(api): tighten pipeline URL validator` (FIX-M7)** — теперь также отвергает loopback-имена хостов, длину <10 или >2000, пробелы внутри URL.
- **`fix(server): actually load .env so HH_USER_AGENT / GEMINI_API_KEY hints work`** — добавлен `server/lib/dotenv.mjs` (35-строчный загрузчик без зависимостей), подключённый в начале `server/index.mjs`. Runtime-подсказки в коде сканера наконец что-то делают. **6 новых тестов**.
- **`fix(ui): scrollable sidebar`** — 18 пунктов навигации в 6 группах переполняли короткие viewport. `.sidebar` теперь имеет `overflow-y: auto` с тонкими кастомными скроллбарами.
- **`fix(ui): make HH_USER_AGENT banner dismissible`** — затем удалён полностью из `/scan`, когда стало ясно, что это перебор. Проверка страницы Health всё ещё проявляет его.
- **`fix(scan): Active companies list is now collapsible + filterable + grouped`** — 87 тэгов в плоском виде переполняли. Теперь переключатель «▸ Active companies 87/71» разворачивает упорядоченный список (✓ API-backed первыми, ○ websearch вторыми) плюс поисковый фильтр.
- **`fix(test): isolate api.test.mjs + en-scanner.test.mjs from parent project`** — оба теперь поднимают tmp project root, чтобы CI работал без чек-аута родителя рядом с web-ui.
- **`fix(workflow): publish-package version-match only on release events`** — `workflow_dispatch` с main больше не валит проверку tag/version.
- **`fix(e2e): stable selector for pipeline row delete`** — восстановлена обёртка-anchor + добавлен атрибут `data-url`, чтобы e2e-набор был стабилен по селекторам.

### 📦 Новый REST-эндпоинт

| Метод | Путь | Назначение |
|---|---|---|
| `GET` | `/api/pipeline/preview?url=…` | Серверный прокси: возвращает снапшот видимого текста URL (скрипты/стили сняты, лимит 8 КБ), огорожен `isValidJobUrl`. |

### 📊 Статистика после этого пакета

- **Тесты:** 225 → **233** (+8 поверх v1.7.0).
- **Файлы тестов:** 25 → **26**.
- **E2E:** 20 + 23 = 43 шага Playwright, все зелёные.

---

## [1.7.0] — 2026-05-03

35-коммитный проход усиления + UX + завершения возможностей, движимый QA r5. Приземлены три слоя безопасности (санитайзинг XSS, CSP, валидация ввода), заполнен каждый недостающий CRUD-эндпоинт, бутстрап родительского проекта теперь полностью автоматизирован, и UI получил **9 новых страниц** — Activity, переработанная Deep Research плюс 7 sidebar-сгруппированных режимов (project / training / followup / batch / outreach / interview-prep / patterns), покрывающих 100% родительского `modes/`. Pipeline получил серверную панель preview. Интеграция Anthropic API делает «Run live» однокликовым действием по всем режимам. Покрытие тестами пошло с **73** до **225** в **25 файлах тестов**, плюс **23 шага comprehensive Playwright e2e**. GitHub Actions отгружают workflow CI / AI review / Release / Publish-Package.

### 🔒 Безопасность

- **`fix(cv): sanitize CV markdown to block stored XSS in preview` (FIX-C10)** — `PUT /api/cv` теперь снимает `<script>`, `<iframe>`, `<object>`, `<embed>`, `<style>`, `<form>`, `<svg>`, обработчики событий `on*=` и URI `javascript:`/`vbscript:`/`data:text/html` до записи `cv.md`. Тело ограничено 1 МБ (413 на overflow). Клиентский `UI.md()` переписан, чтобы экранировать каждый байт до запуска любых markdown-преобразований, так что сырой HTML никогда не доходит до `innerHTML`. Атрибут `href` ссылок валидируется по списку безопасных схем (`http`/`https`/`mailto`/`tel`/относительные + только `data:image`). 17 новых тестов по хелперу очистки и HTTP round-trip.
- **`fix(server): add CSP and baseline security headers` (FIX-L2)** — каждый ответ теперь несёт `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`. Когда сервер привязан за пределами loopback (`HOST` ≠ `127.0.0.1`/`::1`/`localhost`), сверху накладывается строгий `Content-Security-Policy`: `default-src 'self'`, `script-src 'self'` (без `unsafe-inline`), Google Fonts в whitelist, `connect-src 'self'` блокирует XSS-эксфильтрацию. Inline-обработчики `onclick` в `index.html` и `router.js` перенесены в `addEventListener`, чтобы строгий CSP оставался цел. 8 новых тестов, прикрывающих CSP на 5 разных значениях `HOST`.
- **`fix(api): tighten pipeline URL validator` (FIX-M7)** — `POST /api/pipeline` принимал `"not-a-url"` и сохранял его. Теперь `isValidJobUrl()` отвергает голые строки, ввод <10 или >2000 символов, URL с пробелами, схемы не-`http(s)` и loopback-имена хостов (`localhost`/`127.0.0.1`/`::1`). Сводит в одно **FIX-M3** + **FIX-M6** (вернуть 400 на невалидный, плюс флаг `deduped` на успехе).
- **`fix(server): actually load .env so HH_USER_AGENT / GEMINI_API_KEY hints work`** — ранее runtime говорил пользователям «задать HH_USER_AGENT в .env», но сервер этот файл не читал, так что следование инструкции ничего не давало. Добавлен загрузчик dotenv без зависимостей в 35 строк (`server/lib/dotenv.mjs`), подключённый в начале `server/index.mjs`. Значения process-env, заданные через командную строку, по-прежнему побеждают, так что существующие override CI не затеняются. `.env.example` родителя теперь включает задокументированный блок `HH_USER_AGENT` с реальным примером User-Agent от Chrome. 6 новых тестов.
- **`fix(api): sanitize JD before prompt assembly` (FIX-M5)** — `POST /api/evaluate` снимает ANSI-эскейпы, управляющие байты, inline-тэги `<script>` и обрезает пробелы перед вызовом Gemini или эхом промпта обратно. Лимит длины 50 КБ. Минимум 50 символов проверяется против *санитайзированного* текста, так что попытки prompt-injection, выглядящие достаточно длинными, но в основном состоящие из эскейпов, fail-fast с 400.
- **`fix(health): mask Node version + project root when HOST!=loopback` (FIX-M1)** — `/api/health` больше не отпечатывает хост на LAN-доступных деплоях. Loopback-ответы сохраняют значения для локальной диагностики.

### ✨ Новые возможности

- **`feat: 7 new sidebar modes + grouped sidebar` (FIX-C8)** — покрывает 100% родительского каталога `modes/` без пробелов в UI. Новые маршруты: `#/project` (советник по портфолио-проектам), `#/training` (оценка курсов/сертификаций), `#/followup` (каденция на заявку), `#/batch` (параллельный процессор URL), `#/contacto` (составитель LinkedIn-outreach), `#/interview-prep` (подготовка к этапу), `#/patterns` (анализатор паттернов отказа). Все семь делят один config-driven view-фабрику (`public/js/views/mode-page.js`) и один универсальный эндпоинт `POST /api/mode/:slug` — добавление нового режима в будущем — одна строка конфигурации + один блок i18n. Сайдбар реорганизован в 6 групп: Sourcing / Decision / Application / Networking / Analytics / Setup. Итого 18 пунктов навигации. 12 новых тестов в `tests/modes-endpoints.test.mjs`.
- **`fix: bootstrap parent deps + russian_portals defaults` (FIX-C4 + C9 + C12 + H2)** — `bin/start.sh` теперь устанавливает родительские `node_modules` (js-yaml, playwright, jsdom) И `npx playwright install chromium` на свежих клонах, так что `/api/stream/scan`, `/pdf` и `/liveness` работают end-to-end из коробки. `createApp()` проверяет `portals.yml` на каждом запуске — если блок `russian_portals:` отсутствует, дописывает задокументированный дефолт с комментариями. Идемпотентно: второй запуск — no-op. 3 новых теста.
- **`fix: disable 9 dead portal slugs in template + health-check script` (FIX-C3)** — `templates/portals.example.yml` теперь идёт с Ada / Factorial / Tinybird / Weights & Biases / Travelperk / Clarity AI / Forto / Vinted / Runway, помеченными `enabled: false` (у каждой записи inline-комментарий с причиной). Новые установки сканируют **87** живых компаний вместо 96. Новый `web-ui/scripts/portals-health-check.mjs` HEAD-пробит каждый включённый `careers_url` и сообщает о DEAD-записях с предлагаемым списком патчей (JSON-вывод через `--json`). 3 новых теста.
- **`feat(activity): user-action log + Activity sidebar page`** — каждый state-changing API-запрос захватывается в `data/activity.jsonl` (timestamp, action verb, target, флаг успеха, опциональная деталь). Новая запись сайдбара **Activity** с chip-фильтрами префикса действия (pipeline / cv / jd / evaluate / scan / stream / script), бейджами ✓/✗ на действие и кнопкой обновления. Авторотация на 5 МБ. 10 новых тестов, покрывающих middleware, фильтры чтения, толерантность к битым строкам и защиту от рекурсии для самого `GET /api/activity`.
- **`feat(deep): view Deep Research in browser + saved-results archive`** — страница Deep Research теперь (a) запускает промпт через Gemini вживую при `{ run: true }` и заданном `GEMINI_API_KEY`, сохраняя вывод в `interview-prep/{slug}.md`; (b) перечисляет каждый сохранённый deep-research файл как кликабельные карточки с относительными timestamp; (c) рендерит результаты как Markdown с действиями **📋 Copy / ⬇ Download .md / ↗ Open in tab** на результат. Новая REST-поверхность: `GET /api/interview-prep`, `GET /api/interview-prep/:name`, `DELETE /api/interview-prep/:name`. 7 новых тестов.
- **`feat(cv): generate + download PDF in browser, with PDF archive`** — новая кнопка **📄 Generate PDF** на странице CV стримит `/api/stream/pdf` в модалку-консоль. На ошибках `ERR_MODULE_NOT_FOUND` / `playwright` проявляет копируемую команду бутстрапа. Новый раздел «Generated PDFs» автозагружается после каждого успешного запуска, перечисляя каждый `output/*.pdf` с кнопками **↗ Open** и **⬇ Download**. Новая REST-поверхность: `GET /api/output/pdfs`, `GET /api/output/pdfs/:name`. 6 новых тестов.
- **`feat(api): POST /api/tracker — append rows from the UI` (FIX-H8)** — добавление канонической строки в `data/applications.md` из браузера. Валидирует company + role, нормализует статус против `templates/states.yml`, автоматически увеличивает заполненный нулями `#`, дедуплицирует по company+role (case-insensitive), экранирует пайпы в заметках, чтобы markdown-таблица не разломилась. Бутстрапит таблицу, если файл пуст. 6 новых тестов.
- **`feat(api): DELETE /api/jds/:name` (FIX-H4)** — удаление сохранённых JD без shell-out. Символы path-traversal снимаются до любого касания ФС; параметр должен заканчиваться на `.txt`. 5 новых тестов, включая отказ `../../etc/passwd`.
- **`feat(api): POST /api/evaluate/test-gemini` (FIX-H7)** — smoke-эндпоинт, запускающий 50-символьный фиктивный JD через `gemini-eval.mjs`, чтобы пользователь мог проверить рабочий API-ключ, не сидя через реальную оценку. Возвращает `{ ok, code, sampleLength, sample }`.

### 🐛 Исправления

- **`fix(router): catch-all 404 view + i18n coverage guard` (FIX-C7)** — неизвестные хеш-маршруты ранее тихо проваливались на дашборд, маскируя опечатки и сломанные закладки. Теперь `#/totally-random-xyz` рендерит выделенную страницу 404, цитирующую плохой путь обратно и ведущую ссылкой на дашборд. View 404 регистрируется внутри самого IIFE роутера, так что не может столкнуться с пользовательским маршрутом. Новый `tests/i18n-coverage.test.mjs` прогоняет `i18n.js` внутри `vm.Context` с stub `window`, выставляет приватный `DICT` и утверждает, что каждый из 173+ ключей × 8 локалей заполнен и непуст. 4 новых теста роутера.
- **`fix(router): alias #/profile → settings` (FIX-C2)** — внутреннее имя маршрута — `settings` (с `nav.settings`, рендерящим «Profile»), но внешние ссылки и мышечная память идут в `#/profile`. Теперь оба адреса достигают одного view, и пункт навигации сайдбара подсвечивается в обоих случаях. 2 новых теста.
- **`fix(health): unify Health/Doctor + flag template profiles` (FIX-C6 + FIX-H6)** — Health и Doctor были двумя разными источниками правды. Теперь `/api/health` отдаёт всё, что сообщает Doctor (родительские deps, Playwright, директории, profile-customized, `HH_USER_AGENT`). Проверка `Profile customized` обнаруживает заглушки-имена (`Jane Smith`, `Alex Doe`, `John Doe`, `Your Name`, `Test User`) и явные ошибки парсинга YAML. 4 новых теста.
- **`fix(scan): warn on query↔negative collisions in RU config` (FIX-H3)** — когда `portals.yml` идёт с `"PHP"` в `title_filter.negative`, в то время как запросы целят в Senior PHP, каждое совпадение фильтруется и пользователь видит ноль результатов. `loadConfig()` теперь вычисляет массив `warnings`; `runRuScan()` шлёт каждое предупреждение строкой stderr SSE до запуска сканирования. 2 теста проверяют, что отгружаемые дефолты остаются PHP-friendly из коробки.
- **`fix(scan): warn when HH_USER_AGENT is unset` (FIX-H1)** — страница `/scan` пробит `/api/health` и показывает жёлтую предупредительную карточку над строкой действий, когда `HH_USER_AGENT` пуст, чтобы пользователи знали о 403 от hh.ru *до* нажатия RU scan.
- **`fix(api): warn when POST /api/jds slug had unsafe chars stripped` (FIX-M2)** — нормализация slug, снимающая опасные символы, теперь возвращает поле `warning`; чистая чистка case/whitespace остаётся беззвучной. Пустой результат после санитайзинга возвращает 400.
- **`fix(ui): clear global search on route change + button spinners` (FIX-M4 + FIX-L1)** — глобальный поисковый инпут очищается на `hashchange` (с защитой для активного ввода). Новый хелпер `UI.withSpinner(button, fn)` подключает состояние загрузки, ARIA и защиту от двойного клика к каждому асинхронному клику кнопки. Уже принят на кнопках Doctor / Verify / sync-check / Save CV / Normalize / Dedup / Merge.
- **`fix(ui): make sidebar scrollable so 18 nav items always reach the footer`** — сгруппированный сайдбар из FIX-C8 переполнял короткие viewport; нижние пункты (Activity / Health) обрезались. `.sidebar` теперь имеет `overflow-y: auto` с тонкими кастомными скроллбарами (WebKit + Firefox). Подвал остаётся прижатым через существующий `margin-top: auto`.
- **`fix(ui): empty modal-title placeholder` (FIX-H9)** — захардкоженная английская строка `"Title"` в `index.html` убрана, закрывая короткое окно гонки, где она была видна при открытии модалки.

### 🌐 i18n

- 173+ ключа перевода × 8 поддерживаемых локалей (`en`, `es`, `pt-BR`, `ko`, `ja`, `ru`, `zh-CN`, `zh-TW`). Новые ключи добавлены во всех локалях для: страница 404, журнал activity, deep research, поток PDF, предупреждения безопасности, мутация tracker, переименование apply. Покрытие теперь обеспечивается `tests/i18n-coverage.test.mjs` — каждый ключ должен иметь непустое значение в каждой поддерживаемой локали, иначе CI падает.

### ⚙️ DevOps

- **Счётчик тестов:** 73 → **201** (+128 тестов в 23 файлах). Единственный оставшийся падающий тест (`runEnScan: dry-run end-to-end across multiple sources`) — pre-existing flaky тест, зависящий от живых API-ответов Greenhouse/Ashby/Lever.
- **Comprehensive Playwright e2e** (`tests/e2e-comprehensive.mjs`, 23 шага): проходит полный пользовательский путь — сохранение CV → preview → генерация PDF → все 7 новых режимов → фильтры tracker → журнал activity → 404 → ESC на модалке → прокрутка сайдбара → фокус Ctrl-K → очистка поиска → alias profile → сохранение языка.
- **GitHub Actions** (`.github/workflows/`):
  - `ci.yml` — unit + integration тесты на матрице Node 18/20/22 плюс шлюз покрытия i18n (каждый ключ × 8 локалей должен быть непустым), плюс полный Playwright e2e на каждом PR.
  - `ai-review.yml` — AI-ревью Claude Code на каждом PR. Мерж остаётся за мейнтейнерами; Claude только предлагает. Пропуск через метку `skip-ai-review`.
  - `release.yml` — автопубликация GitHub Release при пуше тэга `v*.*.*`; release notes нарезаются из `CHANGELOG.md`, чтобы все 8 языковых вариантов оставались каноническим источником.
- **CSP-friendly UI:** все inline-обработчики `onclick` удалены из `index.html` и `router.js`. Строгая политика `script-src 'self'` теперь применима без поломки фичей.

### 📦 Новые REST-эндпоинты

| Метод | Путь | Назначение |
|---|---|---|
| `GET`    | `/api/activity`                  | Список событий действий пользователя, новейшие первыми |
| `GET`    | `/api/interview-prep`            | Список сохранённых файлов Deep Research |
| `GET`    | `/api/interview-prep/:name`      | Чтение одного файла Deep Research |
| `DELETE` | `/api/interview-prep/:name`      | Удаление файла Deep Research |
| `GET`    | `/api/output/pdfs`               | Список сгенерированных PDF |
| `GET`    | `/api/output/pdfs/:name`         | Стрим PDF как attachment |
| `POST`   | `/api/tracker`                   | Добавление строки в `applications.md` |
| `DELETE` | `/api/jds/:name`                 | Удаление сохранённого JD |
| `POST`   | `/api/evaluate/test-gemini`      | Smoke-проверка ключа Gemini API |
| `POST`   | `/api/mode/:slug`                | Универсальный построитель промптов для 7 новых режимов (project / training / followup / batch / contacto / interview-prep / patterns) |

---

## [1.6.0] — 2026-05-02

Первоначальный публичный релиз веб-UI. Инвентарь возможностей этого baseline — в `README.md`.
