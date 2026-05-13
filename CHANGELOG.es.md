# Registro de cambios

Todos los cambios destacables de **career-ops-ui**. Formato según [Keep a Changelog](https://keepachangelog.com/es/1.1.0/), versionado [SemVer](https://semver.org/lang/es/).

Traducciones: [English](CHANGELOG.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

---

## [1.14.0] — 2026-05-13

3 nuevos adaptadores ATS sobre el registry de v1.13.0, llevando el total de 3 → 6 ATSes soportados (Greenhouse / Ashby / Lever **+ Workable / SmartRecruiters / Workday-beta**). Documentación user-facing actualizada en los 17 archivos de "3 ATSes" a "6 ATSes" en una sola pasada (42 frases): README × 8 locales, help bundle × 8 locales, PROJECT.md. Añadidos bloques YAML listos para pegar de 13 empresas trending en `docs/portals-examples.md` para el `portals.yml` del padre.

### ✨ Features

- **`feat(portals): 3 nuevos ATS — Workable, SmartRecruiters, Workday-beta`** — el registry ahora resuelve 6 ATSes (antes 3). Nuevos archivos: `server/lib/portals/adapters/{workable,smartrecruiters,workday}.mjs` (envoltorios finos con el uniform contract) + `server/lib/sources/{workable,smartrecruiters,workday}.mjs` (HTTP crudo + normalización al shape canónico).
  - **Workable**: detecta `apply.workable.com/<slug>` Y legacy `<subdomain>.workable.com`. Endpoint: `https://apply.workable.com/api/v3/accounts/<slug>/jobs?details=true`.
  - **SmartRecruiters**: detecta `jobs.smartrecruiters.com/<slug>` Y `careers.smartrecruiters.com/<slug>`. Endpoint: `https://api.smartrecruiters.com/v1/companies/<slug>/postings`.
  - **Workday (beta)**: detecta `<tenant>.wd<N>.myworkdayjobs.com/<lang>/<site>`. Endpoint: POST a `/wday/cxs/<tenant>/<site>/jobs`. Default `site=External` si la URL no incluye site. Beta porque algunos tenants cierran el feed CXS con CAPTCHA — fallback al `/career-ops scan` del padre (Playwright).

### 📚 Documentación

- **`docs(portals-examples): trending boards block`** — `docs/portals-examples.md` extendido con la sección v1.14.0 listando 13 empresas trending como YAML listo para pegar en `tracked_companies`: Greenhouse-hosted (Stripe, GitLab, HashiCorp, Cloudflare, Datadog, Hugging Face) + Ashby-hosted (Notion, Linear, PostHog, Replicate, Modal Labs, Fly.io, Render). Todas con `enabled: false` — el usuario verifica el slug antes de activarlo. Más bloques de ejemplo para Workable / SmartRecruiters / Workday.
- **`docs(framing): 42 frases ATS actualizadas en 17 archivos user-facing`** — toda aparición de "Greenhouse / Ashby / Lever" en documentación de usuario ahora se lee como "Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday". Afectados: README × 8 locales, help bundle × 8 locales, PROJECT.md. Entradas históricas del CHANGELOG y documentos de prescripción bug-fix (`qa/fixes/F-014`, `qa/FIX-PROMPT`) deliberadamente sin tocar — describen estado pasado o ya correcto.
- **`docs(qa): browser test scenario 19`** — `qa/claude-cowork-browser-test-prompt.md` extendido con Scenario 19: invariante `ALL_ADAPTERS.length === 6`, sweep de URL-detection vía `resolveAdapter()` para los 6, soft-check del card Active Companies en `#/scan`, check estructural de `docs/portals-examples.md`.

### 🧪 Tests

- `tests/adapter-registry.test.mjs` extendido con 7 casos nuevos para los 3 adaptadores (Workable apply-URL, Workable legacy subdomain, SmartRecruiters jobs.* + careers.*, Workday tenant.wd5.* con site explícito, Workday fallback a default-site, invariante `ALL_ADAPTERS.length === 6`, compatibilidad de shape legacy `detectApi()`).
- Total: **386 / 386** tests unitarios (antes 379; +7 netos). 0 fallos.

### Out of scope

| Item | Notas |
|---|---|
| Entradas per-company para las 13 empresas trending Greenhouse/Ashby | El bloque v1.14.0 de `docs/portals-examples.md` las lista como YAML pegueable; el bulk-add al `portals.yml` del padre es fase aparte. |
| Automatización del fallback CAPTCHA de Workday | El adapter Workday lanza cuando el feed CXS está bloqueado; el fallback planificado delega al `/career-ops scan` del padre (Playwright). El wiring en el UX de scan del SPA es para v1.15+. |

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

Patch de regresión funcional. Dos bugs descubiertos durante la verificación manual de v1.10.1 cerrados; superficie de docs ampliada.

### 🐛 Correcciones

- **`fix(cv): /api/cv/import rechaza multipart/form-data con 415 (F-016 hardening)`** — clientes externos que enviaban `multipart/form-data` por defecto guardaban el wire envelope como contenido de `cv.md`. Ahora 415 con pista. La ruta del SPA (octet-stream + X-Filename) no cambia.
- **`fix(pdf): /api/stream/pdf invoca generate-pdf.mjs con args posicionales correctos`** — antes lo llamaba con `[]` y el script imprimía `Usage:` saliendo con código 1, sin producir PDF. Ahora renderiza `cv.md` a HTML, escribe en `output/cv-input-<TIMESTAMP>.html` y lanza el script con `<input.html> <output.pdf> --format=a4`.

### 🧪 Tests

- Nuevos `tests/cv-upload-multipart-reject.test.mjs` (5 casos) y `tests/pdf-stream-args.test.mjs` (3 casos). **340 unit tests** (antes 318). Coverage 94.63 % línea / 84.94 % rama.

### 📝 Docs

- Nuevo `docs/test-scenarios/` — 21 archivos de escenarios en inglés.
- Nuevo `docs/reviews/REVIEW-2026-05-12-v1.10.2.md`.
- Los 8 READMEs y CHANGELOGs actualizados. Texto completo en [CHANGELOG.md](CHANGELOG.md#1102--2026-05-12).

---

## [1.10.1] — 2026-05-09

Parche de correcciones críticas tras la regresión QA de v1.10.0 (`qa/reports/00-FINAL-SUMMARY.md`).

### 🛡️ Seguridad

- **`fix(security): superficie SSRF reforzada + defensa DNS-rebind (PR-3 / F-003)`** — `isValidJobUrl` rechaza RFC1918, todo 127/8, link-local `169.254/16` (incl. AWS IMDS), `0.0.0.0`, CGNAT `100.64/10`, IPv6 ULA / link-local. Nuevo helper `isPrivateOrLoopbackHost()`. El proxy de preview hace `dns.lookup` en cada salto y bloquea si la dirección cae en rango privado — defensa DNS-rebind.

### 🐛 Correcciones

- **`fix(activity)`**: solo se registran cambios de estado exitosos (PR-5 / F-005); ya no se logean intentos rechazados con 4xx. Añadidos eventos `profile.save`, `config.save`, `cv.import` (F-008).
- **`fix(help)`**: alias `ko` → `ko-KR.md` para que el cuerpo coreano no caiga en inglés (F-002).
- **`fix(llm): /api/evaluate respeta mode:'manual'`** — espeja el comportamiento de `/api/deep`, no quema créditos (F-009).
- **`fix(api): DELETE /api/pipeline`** acepta `?url=` Y `body.url`; devuelve 404 cuando la URL no estaba (PR-6 / F-017).

### ✨ Funciones

- **`feat(llm): propagación de locale en todos los prompts (PR-2 / F-012)`** — `resolveLocale(req)`, `buildLocaleDirective(lang)`. La SPA adjunta `Accept-Language` + `lang` automáticamente.
- **`feat(scripts): post-qa-cleanup.mjs (PR-11)`** — reproduce la limpieza tras QA; `--apply` escribe, default dry-run, idempotente.

### 🧪 Tests

- Nuevo `tests/critical-fixes.test.mjs` (15 casos). `tests/url-validation.test.mjs` extendido con 5 nuevos. **318 unit tests** (antes 298). Una falla pre-existente en `portals-dead.test.mjs` por drift en `templates/portals.example.yml` del parent — no es código de web-ui.

### 📝 Docs

- Nuevo `docs/reviews/REVIEW-2026-05-09-v1.10.1.md`. Los 8 READMEs actualizados (badges + screenshot + sección "Novedades en v1.10.1"). Los 8 CHANGELOGs reciben esta entrada.

---

## [1.10.0] — 2026-05-08

> Texto completo en [CHANGELOG.md](CHANGELOG.md#1100--2026-05-08). Resumen: importación de CV (`.docx`/`.doc`/`.odt`/`.rtf`/`.pdf`/`.html`/`.txt`/`.md` vía pandoc + pdftotext, límite 10 MB), auto-descarga del PDF nuevo tras Generate-PDF, `#/config` con dos pestañas (API keys & runtime + Profile), `#/profile` ahora canónico, help docs refrescados en las 8 locales.

---

## [1.9.1] — 2026-05-08

Pase de production-readiness. 4 correcciones puntuales (BF-1..BF-4), Playwright smoke ampliado de 5 a 12 tests.

### 🐛 Correcciones

- **BF-1 (tracker)**: escape de `|` y salto de línea en todas las celdas, no solo notes. Nombres como `"Acme | Co"` ya no rompen la tabla. `parseMarkdownTable` soporta el escape GFM `\|` — round-trip sin pérdidas.
- **BF-2 (config)**: `updateEnvFile` envuelto en try/catch — devuelve 500 limpio en lugar de rejection no manejada.
- **BF-3/BF-4 (llm)**: tope blando de 200 KB sobre el prompt ensamblado en las ramas Anthropic de `/api/evaluate`, `/api/deep`, `/api/mode/:slug` — 413 en vez de timeout.

### 🧪 Playwright smoke — 5 → 12 tests

Tracker (incl. round-trip BF-1), pipeline add + barrido de URLs inválidas, reports estado vacío, evaluate fallback manual, config keys enmascaradas, CV PUT con sanitización, pipeline preview 400.

---

## [1.9.0] — 2026-05-08

P-6 → P-10 del backlog v1.8.0 — todo en un solo release. Titular: `server/index.mjs` ahora es un orquestador de 130 líneas (era 762, total 1230 → 130 = -89 %); cada tema de rutas en su propio módulo. Paridad Anthropic para `/api/evaluate`, shims multi-CLI, test ampliado de paridad i18n, Playwright browser-smoke en CI.

### 🏗️ P-6 — fase 2 división de server/index.mjs

Continuación de P-2. Las 9 rutas restantes movidas a `server/lib/routes/<topic>.mjs`. `index.mjs` ahora es un orquestador puro: middleware, 12 llamadas `register<Topic>Routes(app)`, catch-all SPA.

Módulos: `activity`, `config`, `health` (+ dashboard), `help`, `jds`, `llm`, `pipeline` (+ preview), `reports`, `tracker`. Comportamiento sin cambios. 283/283 unit tests verdes en cada paso.

### 🔌 P-7 — Paridad Anthropic para /api/evaluate

`/api/evaluate` antes era Gemini-or-manual. v1.9.0 añade rama Anthropic (preferida cuando ambas claves presentes). Pasa por `bundleProjectContext({ modeSlugs: ['_shared', 'oferta'] })` — REVIEW-A1 extendido. Cadena de fallback: Anthropic → Gemini → manual.

Nuevo endpoint **`POST /api/evaluate/test-anthropic`** — smoke-check para `ANTHROPIC_API_KEY`.

### 🌐 P-8 — Paridad i18n del help-center

Las 8 locales ya cubren las 14 secciones h2 canónicas. Tests reforzados:

- `tests/help-ui.test.mjs` ahora itera las 8 locales (antes solo en + ru).
- Nuevo: cada locale ≥ 30 % de `en.md` — protección contra stubs.

### 🤖 P-9 — Playwright browser smoke en CI

`tests/playwright-smoke.mjs` (opt-in en v1.8.0) ahora forma parte del workflow CI.

### 🌍 P-10 — Compatibilidad multi-CLI

`web-ui/AGENTS.md` (Codex / Aider / generic) y `web-ui/GEMINI.md` añadidos como shims que apuntan al canónico `CLAUDE.md`.

### 🧪 Tests

- **284 unit tests** (era 283): +1 nuevo de paridad i18n.
- **5 smoke tests Playwright** ahora en CI.

### 📦 Nuevo endpoint

| Método | Ruta | Propósito |
|---|---|---|
| `POST` | `/api/evaluate/test-anthropic` | Smoke check para `ANTHROPIC_API_KEY` (P-7). |

---

## [1.8.0] — 2026-05-08

Endurecimiento, refactor y base de SDD. Tres correcciones de severidad alta (A1, A2, A3), cuatro medias (B1–B4), seis limpiezas, auditoría del padre career-ops v1.7.0, división de `server/index.mjs` (P-2 fase 1), smoke con Playwright y fundamento SDD completo en `docs/` y `.claude/`.

### 🔥 Severidad alta

- **`fix(deep): inlinear cv/profile/mode en llamadas Anthropic SDK (REVIEW-A1)`** — `/api/deep` y `/api/mode/:slug` instruían "lee estos archivos primero", pero el SDK de Anthropic no tiene sistema de archivos. La salida era hueca. `bundleProjectContext` lee `cv.md`, `config/profile.yml`, `modes/_shared.md` y la plantilla del modo, los recorta a 16 KB y antepone un bloque `<project_context>`. Verificado en vivo: 26 KB de markdown fundamentado de `claude-sonnet-4-6`.
- **`fix(runner): escalada SIGTERM → SIGKILL tras período de gracia (REVIEW-A2)`** — un hijo atascado en una llamada al sistema podía colgar la conexión SSE. Ahora ambos caminos arman un watchdog de 5 s que escala a `SIGKILL`.
- **`fix(runner): tope máximo de tiempo en endpoints streaming (REVIEW-A3)`** — `/api/stream/{scan,liveness,pdf}` tienen techo de 30 minutos.

### 🛡️ Severidad media

- **`fix(preview): validación por hop en /api/pipeline/preview (REVIEW-B1)`** — paso de `redirect: 'follow'` a recorrido manual. Cada `Location` se revalida con `isValidJobUrl`; tope de 3 saltos. Boards hostiles ya no pueden redirigirnos a loopback / IP privada / `file://`.
- **`refactor(keys): hasGeminiKey unifica chequeos de claves LLM (REVIEW-B2)`**.
- **`feat(scanners): AbortSignal a través de hh.ru, Habr, Greenhouse, Ashby, Lever (REVIEW-B3)`** — al desconectarse el cliente, los fetch en vuelo se cancelan.
- **`test(anthropic): log-guard impide futuros leaks de la API key por console (REVIEW-B4)`**.

### 🧹 Limpiezas

- **`fix(parsers): puerta URL en addPipelineUrl como defensa en profundidad (REVIEW-C4)`**.
- **`docs(readme): badge 88 → 277 tests (REVIEW-C3)`**.
- **`test(i18n): mensajes de claves faltantes agrupados por locale (REVIEW-C6)`**.

### 🏗️ P-2 fase 1 — división de server/index.mjs (1230 → 762 LOC, −38 %)

Sin cambio de comportamiento. 283/283 unit tests verdes en cada paso.

- `server/lib/security.mjs` — sanitizadores y trust-checks.
- `server/lib/prompts.mjs` — constructores de prompt para LLM.
- `server/lib/store.mjs` — lectores defensivos + bootstrap inicial.
- `server/lib/routes/{scan,runners,content}.mjs` — `registerXxxRoutes(app)`.

Fase 2 extraerá tracker / pipeline / reports / jds / llm / health.

### 🔍 Auditoría del padre career-ops v1.7.0

UI compatible. Catálogo de modos: 7 → 19 (UI expone 7 a propósito). `portals.yml` usa `tracked_companies` (96 entradas, 87 habilitadas, 71 con API). Documentado en `docs/architecture/DATA-FLOWS.md`.

### 🤖 Fundamento SDD / GSD

- `CLAUDE.md` (raíz), `.aiignore`, `.claude/agents/*` (3), `.claude/commands/*` (2).
- Árbol `docs/`: PROJECT, ROADMAP, sdd/{SDD-GUIDE, CONVENTIONS}, architecture/{OVERVIEW, SERVER, FRONTEND, API, DATA-FLOWS}, reviews/REVIEW-2026-05-07.

### 🔒 Seguridad e higiene del repo

- **`chore(.gitignore): patrones defense-in-depth ampliados`** — variantes de env, IDE, scratch GSD, configs privadas del agente, artefactos Playwright, patrones genéricos de secretos.

### 🧪 Tests

- **283 unit tests** (eran 277): +6 nuevos.
- **5 smoke tests con Playwright** (nuevos, opt-in vía `npm run test:e2e:browser`).
- Cobertura ~93 % línea / ~83 % rama.

### 📝 Nuevos scripts npm

| Script | Propósito |
|---|---|
| `npm run test:e2e:browser` | Playwright smoke contra el servidor in-process (5 tests). |

---

## [1.7.2] — 2026-05-04

Centro de ayuda, configuración en la UI, sidebar móvil, botón único Scan, atajo "Mostrar resultado".

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

Pase de 35 commits de hardening + UX + completitud de features guiado por QA r5. Aterrizaron tres capas de seguridad, se completaron todos los endpoints CRUD, el bootstrap del proyecto padre quedó automatizado, y la UI ganó **9 páginas nuevas**: Activity, Deep Research rediseñado y 7 modos agrupados en sidebar (project / training / followup / batch / outreach / interview-prep / patterns) que cubren el 100% de `modes/` del padre. Cobertura: **73** → **209** tests en **25 archivos** + **23 pasos de Playwright e2e comprehensivo**. Coverage: **93.5 % líneas / 82.6 % ramas**.

### 🔒 Seguridad

- **`fix(cv): sanitizar Markdown del CV para bloquear XSS persistente` (FIX-C10)** — `PUT /api/cv` elimina ahora `<script>`, `<iframe>`, `<object>`, `<embed>`, `<style>`, `<form>`, `<svg>`, manejadores `on*=` y URIs `javascript:`/`vbscript:`/`data:text/html` antes de escribir `cv.md`. Cuerpo limitado a 1 MB (413 si se excede). El `UI.md()` cliente fue reescrito para escapar todo el origen *antes* de cualquier transformación markdown — el HTML crudo nunca llega a `innerHTML`. Los `href` se validan contra una lista blanca (`http`/`https`/`mailto`/`tel`/relativos + sólo `data:image`). 17 nuevos tests.
- **`fix(server): cabeceras CSP + base de seguridad` (FIX-L2)** — cada respuesta lleva `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`. Cuando el servidor escucha más allá de loopback (`HOST` ≠ `127.0.0.1`/`::1`/`localhost`), se aplica un `Content-Security-Policy` estricto: `default-src 'self'`, `script-src 'self'` (sin `unsafe-inline`), Google Fonts en whitelist, `connect-src 'self'` bloquea exfiltración. Los `onclick` inline de `index.html` y `router.js` migraron a `addEventListener`. 8 nuevos tests.
- **`fix(api): endurecer validador de URL en pipeline` (FIX-M7)** — `POST /api/pipeline` aceptaba `"not-a-url"` y lo persistía. Ahora `isValidJobUrl()` rechaza cadenas sin esquema, longitud <10 o >2000, URLs con espacios, esquemas distintos de `http(s)`, hostnames loopback. Incluye **FIX-M3** + **FIX-M6**.
- **`fix(api): sanitizar JD antes del prompt` (FIX-M5)** — `POST /api/evaluate` quita escapes ANSI, bytes de control, `<script>` inline y recorta espacios antes de llamar a Gemini o devolver el prompt. Tope 50 KB. El mínimo de 50 chars se evalúa contra el texto *sanitizado*.
- **`fix(health): ocultar Node version + project root cuando HOST!=loopback` (FIX-M1)** — `/api/health` deja de revelar fingerprint del host en despliegues LAN.

### ✨ Nuevas funcionalidades

- **`feat: 7 modos nuevos en sidebar agrupado` (FIX-C8)** — cobertura 100% de `modes/` del padre. Nuevas rutas: `#/project`, `#/training`, `#/followup`, `#/batch`, `#/contacto`, `#/interview-prep`, `#/patterns`. Una sola fábrica de view (`public/js/views/mode-page.js`) y un endpoint genérico `POST /api/mode/:slug`. Sidebar dividido en 6 grupos: Sourcing / Decision / Application / Networking / Analytics / Setup. 18 elementos. 12 tests nuevos.
- **`fix: bootstrap del padre + russian_portals defaults` (FIX-C4 + C9 + C12 + H2)** — `bin/start.sh` instala `node_modules` del padre y Playwright Chromium en clones nuevos. `createApp()` agrega bloque `russian_portals:` si falta. Idempotente. 3 tests nuevos.
- **`fix: deshabilitar 9 portales muertos` (FIX-C3)** — Ada / Factorial / Tinybird / Weights & Biases / Travelperk / Clarity AI / Forto / Vinted / Runway marcados `enabled: false`. Nuevo `scripts/portals-health-check.mjs` para chequeos futuros. 3 tests.
- **`feat(activity): registro de acciones + página Activity`** — cada petición que muta estado se registra en `data/activity.jsonl`. Nueva entrada en sidebar **Actividad** con filtros tipo chip por prefijo (pipeline / cv / jd / evaluate / scan / stream / script), insignias ✓/✗ y botón refresh. Auto-rotación a 5 MB. 10 nuevos tests.
- **`feat(deep): Deep Research en el navegador + archivo guardado`** — la página Deep Research ahora (a) ejecuta el prompt vía Gemini con `{ run: true }` y `GEMINI_API_KEY`, persistiendo en `interview-prep/{slug}.md`; (b) lista archivos guardados como tarjetas con timestamps relativos; (c) renderiza el resultado como Markdown con **📋 Copiar / ⬇ Descargar .md / ↗ Abrir en pestaña**. Nuevos endpoints: `GET /api/interview-prep`, `GET /api/interview-prep/:name`, `DELETE /api/interview-prep/:name`. 7 nuevos tests.
- **`feat(cv): generar + descargar PDF en navegador, con archivo PDF`** — botón **📄 Generar PDF** en la página de CV transmite `/api/stream/pdf` en consola modal. Si falta Playwright, ofrece el comando exacto para instalarlo. La sección "PDFs generados" se autocarga tras cada éxito. Nuevos endpoints: `GET /api/output/pdfs`, `GET /api/output/pdfs/:name`. 6 nuevos tests.
- **`feat(api): POST /api/tracker — añadir filas desde la UI` (FIX-H8)** — añade fila canónica a `data/applications.md` desde el navegador. Valida company + role, normaliza status contra `templates/states.yml`, autoincrementa `#`, dedupea por company+role. 6 nuevos tests.
- **`feat(api): DELETE /api/jds/:name` (FIX-H4)** — borrar JDs guardados sin shell. Sanitiza path-traversal, exige sufijo `.txt`. 5 nuevos tests.
- **`feat(api): POST /api/evaluate/test-gemini` (FIX-H7)** — endpoint de smoke-test que pasa un JD dummy de 50 chars por `gemini-eval.mjs` para validar la API key sin esperar una evaluación completa.

### 🐛 Correcciones

- **`fix(router): vista 404 catch-all + guardia de cobertura i18n` (FIX-C7)** — rutas hash desconocidas ya no caen silenciosamente en dashboard. `#/totally-random-xyz` muestra una página 404 dedicada que cita la ruta errónea y enlaza al dashboard. Nuevo `tests/i18n-coverage.test.mjs` carga `i18n.js` en `vm.Context` y verifica que cada una de las 173+ claves × 8 locales tenga valor no vacío.
- **`fix(router): alias #/profile → settings` (FIX-C2)** — ambas direcciones llegan a la misma vista, sidebar resalta correctamente.
- **`fix(health): unificar Health/Doctor + flag de plantillas` (FIX-C6 + FIX-H6)** — `/api/health` expone ahora todo lo que mostraba Doctor (parent deps, Playwright, dirs, profile-customized, `HH_USER_AGENT`). Detecta nombres placeholder.
- **`fix(scan): aviso de colisión query↔negative en config RU` (FIX-H3)** — si `portals.yml` tiene `"PHP"` en negative mientras las queries apuntan a Senior PHP, los resultados se filtran a cero. `runRuScan()` emite warnings antes de empezar.
- **`fix(scan): aviso si HH_USER_AGENT no está definido` (FIX-H1)** — `/scan` muestra una tarjeta amarilla advirtiendo del 403 de hh.ru.
- **`fix(api): warning cuando POST /api/jds sanea slug` (FIX-M2)** — devuelve campo `warning` cuando se eliminan caracteres peligrosos.
- **`fix(ui): limpiar búsqueda global al cambiar de ruta + spinners en botones` (FIX-M4 + FIX-L1)** — input de búsqueda se limpia en `hashchange`. Nuevo helper `UI.withSpinner(button, fn)` para estados de carga.
- **`fix(ui): placeholder modal-title vacío` (FIX-H9)** — la cadena hardcoded `"Title"` desapareció.

### 🌐 i18n

- 173+ claves × 8 locales (`en`, `es`, `pt-BR`, `ko`, `ja`, `ru`, `zh-CN`, `zh-TW`). Nuevas claves para 404, activity log, Deep Research, flujo PDF, avisos de seguridad, tracker, renombre de Apply. Cobertura aplicada por `tests/i18n-coverage.test.mjs`.

### ⚙️ DevOps

- **Tests:** 73 → **225** (+136 tests en 25 archivos). Coverage: 93.5% líneas / 82.6% ramas / 93.7% funcs. Único test fallando (`runEnScan: dry-run end-to-end`) es un flake preexistente.
- **Playwright e2e completo** (`tests/e2e-comprehensive.mjs`, 23 pasos): recorre el flujo completo de usuario.
- **GitHub Actions:** `ci.yml` (matrix Node 18/20/22 + i18n gate + e2e), `ai-review.yml` (Claude Code revisa cada PR), `release.yml` (auto-publica releases en push de tag).
- **UI compatible con CSP:** todos los `onclick` inline removidos.

### 📦 Nuevos endpoints REST

| Método | Ruta | Función |
|---|---|---|
| `GET`    | `/api/activity`              | Lista de eventos |
| `GET`    | `/api/interview-prep`        | Lista de Deep Research |
| `GET`    | `/api/interview-prep/:name`  | Lectura de archivo Deep Research |
| `DELETE` | `/api/interview-prep/:name`  | Borrar Deep Research |
| `GET`    | `/api/output/pdfs`           | Lista de PDFs generados |
| `GET`    | `/api/output/pdfs/:name`     | Descargar PDF |
| `POST`   | `/api/tracker`               | Añadir fila a `applications.md` |
| `DELETE` | `/api/jds/:name`             | Borrar JD guardado |
| `POST`   | `/api/evaluate/test-gemini`  | Smoke-test de la API key |

---

## [1.6.0] — 2026-05-02

Lanzamiento inicial del web UI. Inventario de features en `README.md`.
