# Registro de cambios

Todos los cambios destacables de **career-ops-ui**. Formato según [Keep a Changelog](https://keepachangelog.com/es/1.1.0/), versionado [SemVer](https://semver.org/lang/es/).

Traducciones: [English](CHANGELOG.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

> **Nota i18n** — desde v1.12.0 hacia adelante las entradas están localizadas en cada idioma. Entradas anteriores (v1.11.x, v1.10.x) permanecen en ruso por convención del proyecto; el contenido inglés normativo está en [CHANGELOG.md](CHANGELOG.md).

---

## [1.17.0] — 2026-05-13

**Polish + a11y + CI fix release.** Closes 9 follow-ups from v1.16.0 REVIEW: browser smoke verify, README badge truth, coverage refresh, `lastWorkdayFallback` 🔒 chip в SPA, full E2E re-baseline после v1.16 UX-change, Playwright auto-pipeline scenarios, a11y ARIA + focus trap pass, condensed historical CHANGELOG в 6 локалях, expanded non-EN READMEs с reference sections.

### 🐛 Fixes

- **`fix(e2e): smoke + comprehensive re-aligned с v1.16 UX`** — v1.16 Cmd+K Enter → AutoPipeline modal изменение сделало `search.press('Enter')` в e2e тестах открывающим modal. Тесты теперь используют `Shift+Enter` для legacy quick-add path. **Это и был CI failure на push v1.16.0** — Playwright e2e таймаутил 30s на backdrop-intercepted кликах.
- **`fix(mode-page): /#/batch-prompt → modes/batch.md via serverSlug`** — v1.15 переименовал legacy mode slug в `batch-prompt`, но server `POST /api/mode/:slug` искал `modes/batch-prompt.md`. Новое поле `serverSlug` развязывает route hash от parent mode filename.
- **`chore: bump deprecation messages с v1.16.0 → v1.17.0`** — scan-en/scan-ru deprecation copy + batch-prompt banner ссылались на прошедшую версию.

### ✨ Features

- **`feat(scan): 🔒 Workday CAPTCHA chip в Active Companies card`** — server-side `lastWorkdayFallback` export из v1.16 PR-7 теперь consumed в SPA. `/api/scan-results` возвращает snapshot; `#/scan` рендерит warn-tinted card сверху при Workday fallback.

### ♿ Accessibility

- **`a11y: ARIA roles + focus management pass`** —
  - `index.html`: `role` attrs на `<aside>` (navigation), `<header>` (banner), `<section id="content">` (main), `<div id="modal">` (dialog + aria-modal + aria-labelledby), toast/banner (status + aria-live), searchbar (search).
  - `#sidebar-toggle`: `aria-controls` + `aria-expanded` sync.
  - `#global-search`: visually-hidden `<label>` + `aria-label` с Cmd+K hint.
  - Decorative backdrops: `aria-hidden="true"`.
  - **Focus trap в modal** через `UI.modal()` — запоминает click owner, фокусит первый non-close focusable на open, циклит Tab/Shift+Tab внутри modal. `UI.closeModal()` восстанавливает focus.
  - Новый `.visually-hidden` utility class (WAI-ARIA AP стандарт).

### 📚 Документация

- **`docs(readme): badge truth × 8 READMEs`** — tests `284/379/360` → **427**; release `v1.9.1/v1.13.0` → **v1.16.0** → v1.17.0.
- **`docs(readme): расширены 7 non-EN READMEs с reference sections`** — каждый вырос 170 → ~240 строк с Architecture / API / Security / Tests / A11y / Limitations / License разделами на native language.
- **`docs(changelog): condensed pre-v1.12 в 6 локалях`** — длинные RU-bodied v1.11.x + v1.10.x записи заменены на компактный "Earlier releases" exec summary на native language.

### 🛠️ Tooling

- **`coverage: refresh numbers`** — последний публичный был 95.46 % / 84.06 % (v1.13.0 REVIEW). v1.17 baseline: **94.14 % линий / 82.98 % веток / 93.20 % функций**. Slight drop от новых error paths в auto-pipeline + reports-write; всё ещё выше 80 % floor.

### 🧪 Тесты

- Итого: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + **32 / 32** Playwright (было 28; +4 новых auto-pipeline scenarios).

### Out of scope (v1.18+)

| Item | Notes |
|---|---|
| Translate v1.16.0 в non-EN CHANGELOGs | Сейчас RU-bodied (~30 строк × 6 = 180). Был вне явного scope (только v1.11.x/v1.10.x). |
| Full non-EN README parity (585 строк как EN) | v1.17 принёс non-EN до ~240; marketing-heavy секции остаются EN-only. |
| Parent commit для canonical A-F prompt | Всё ещё ждёт upstream rewrite `santifer/career-ops::modes/oferta.md`. |
| Full WCAG 2.2 AA audit | v1.17 покрыл structural ARIA + focus trap; per-component contrast/Tab-order — отложено. |

---

## [1.16.0] — 2026-05-13

**Auto-pipeline finalization + adapter polish + i18n long-tail.** Закрывает все 11 follow-up из v1.15.0 REVIEW: server-side SSE auto-pipeline, `POST /api/reports` primitive, Cmd+K shortcut, SmartRecruiters пагинация, Workday CAPTCHA-fallback, CI screenshot-drift gate, scan source filter UX, перевод исторического CHANGELOG (v1.13.0/v1.12.0 × 6 локалей), расширение non-EN READMEs, paste-ready trending-companies importer.

### ✨ Фичи

- **`feat(auto-pipeline): server-side SSE orchestrator`** (#1, #2, #3, #8) — v1.15 client-side chained-fetch orchestrator удалён. `POST /api/auto-pipeline` теперь curl-able SSE endpoint, гоняющий chain validate → fetch JD → evaluate → save report → tracker server-side с real-time step events. Медленный Anthropic call (30–90 с) теперь эмитит `running` event вместо generic спиннера. Failures эмитят `error` с `step` + `message`. Orchestrator также persist'ит report markdown в parent `reports/<slug>.md` (терялось в v1.15).
- **`feat(reports): POST /api/reports primitive`** — новый writer в `server/lib/routes/reports.mjs`. Slug sanitization с path-traversal guard. 1 MB cap (413). 409 на existing file без `overwrite:true`. Atomic write через `stripDangerousMarkdown`. Тесты: 9 кейсов.
- **`feat(app): Cmd+K paste URL → auto-pipeline`** — paste URL в global search + Enter теперь открывает AutoPipeline modal с `autoStart=true`. Shift+Enter сохраняет legacy "add to pipeline only" поведение.
- **`feat(portals): SmartRecruiters пагинация`** (#4) — обходит ВСЕ страницы, не только первые 100. Safety cap: 30 страниц / 3000 jobs. Strip caller-supplied limit/offset. Тесты: 6 кейсов.
- **`feat(portals): Workday CAPTCHA-fallback graceful`** (#7) — не throws на 4xx / non-JSON / network errors. Возвращает `[]` и аннотирует `lastWorkdayFallback`. Опт-ин обратно через `strict:true`. Тесты: 7 кейсов.

### 🛠️ Tooling + CI

- **`ci(workflows): dashboard-screenshots drift gate`** (#5) — `.github/workflows/dashboard-screenshots.yml` регенерит 8 hero PNGs и валит build при visual drift'е.
- **`feat(scripts): import-trending-companies.mjs`** (#11) — верифицирует 13 trending компаний из `docs/portals-examples.md` и эмитит paste-ready YAML. Запуск: `npm run import:trending`.
- **`feat(scripts): npm run capture:dashboards`** — exposes Playwright capture как top-level script.

### 🎨 UX

- **`fix(scan): consolidated source-filter dropdown`** (#6) — dropdown пересобран из v1.14 adapter registry: 6 ATSes + hh.ru + Habr Career, алфавитный порядок, без geo-префиксов. `runEnScan`/`runRuScan` теперь используют `/api/stream/scan?source={ats,regional}` consolidated endpoint.

### 📚 i18n long-tail

- **`docs(i18n): translate v1.13.0 + v1.12.0 CHANGELOG в 6 локалях`** (#9) — записи переведены на их фактический язык. Каждая локаль также получает i18n note о том что pre-v1.12 записи остаются RU-bodied per project convention.
- **`docs: expand non-EN READMEs с v1.16.0 highlights section`** (#10) — 6 non-EN READMEs + RU READMEs получают ~35-line section про auto-pipeline + curl example + остальные v1.16 фичи.

### 🧪 Тесты

- Новые `tests/reports-write.test.mjs` (9), `tests/auto-pipeline.test.mjs` (5), `tests/smartrecruiters-pagination.test.mjs` (6), `tests/workday-fallback.test.mjs` (7).
- Итого: **427 / 427** unit (было 400; +27). 0 failures.

### Out of scope (v1.17+)

| Item | Notes |
|---|---|
| Parent commit для canonical A-F prompt | Всё ещё ждёт upstream rewrite `santifer/career-ops::modes/oferta.md` (CLAUDE.md hard rule #1). |
| Translate pre-v1.12 CHANGELOG (v1.11.x, v1.10.x) | Сохранена convention: RU-bodied. ~1800 строк перевода — отложено. |
| Full non-EN README паритет (585 строк как EN) | v1.16 добавил ~35 строк per locale; полный паритет — отдельный effort. |

---

## [1.15.0] — 2026-05-13

**Doc-conformance релиз.** Закрывает 9 из 10 открытых findings из conformance audit (`qa/conformance-vs-docs/00-CONFORMANCE-REPORT.md`) плюс локализованные hero-images. Приводит UI в соответствие с canonical career-ops.org/docs workflow — тот же pipeline что обещает CLI, теперь end-to-end через браузер во всех 8 локалях.

### ✨ Фичи

- **`feat(auto-pipeline): PR-C — 1-click "paste URL → report + PDF + tracker row"`** (G-007) — до v1.15 пользователи делали 5 ручных кликов через /#/pipeline → /#/evaluate → /#/cv → /#/tracker. Теперь одна ✨ кнопка на /#/dashboard chain'ит: validate URL → fetch JD (SSRF-safe) → evaluate против CV → generate PDF → добавить tracker row. Step-by-step modal timeline с [✓]/[…]/[✗]. Heuristic company/role extraction. Новый файл: `public/js/lib/auto-pipeline.js`. 19 новых i18n ключей × 8 локалей.
- **`feat(modes): PR-D — modes/_profile.md редактор как #/config → Modes таб`** (G-008) — канонический "Career framing" файл из Quick Start §Step-5 теперь виден в UI. Новые endpoints `GET/PUT /api/modes/_profile` с 256 KB cap, `stripDangerousMarkdown` XSS pass, scaffold из `_profile.template.md`. 9 новых i18n ключей × 8 локалей.
- **`feat(profile): PR-E — canonical schema + location + headline`** (G-009) — `/api/profile` принимает И legacy (`candidate:{...}`) И canonical (top-level `full_name`, `narrative.headline`, `target_roles.primary`, `compensation.target_range`). Legacy выигрывает при коллизии. Новый `summarizeProfile()`. /#/profile показывает `narrative.headline` как новую карточку. 2 новых i18n ключа × 8 локалей.
- **`feat(tracker): PR-B — Legitimacy колонка на #/tracker`** (G-006) — восстанавливает паритет с canonical pipeline output table. Между Status и PDF, badge-ok/warn/bad подсветка. Graceful degrade для pre-v1.15 строк. 1 новый i18n ключ × 8 локалей.
- **`fix(routing): PR-H — dedupe sidebar; #/batch → v1.13.0 TSV SPA`** (G-011) — до фикса /#/batch был ДВАЖДЫ в sidebar И оба пункта вели в legacy mode-prompt builder. v1.13.0 TSV SPA (8 KB) был недоступен. Убран дубликат; legacy переименован в `batch-prompt` с deprecation banner.

### 📚 Документация

- **`docs(evaluate): PR-A — Block A-F realignment`** (G-005) — career-ops.org/docs использует A–F (Strategy/Personalization/STAR stories в C/E/F). Мы эмитили A–G. v1.15 обновляет все 8 help bundles §9 с canonical A–F и callout о back-compat. ⚠ Parent commit ещё требуется: `santifer/career-ops::modes/oferta.md` надо переписать upstream.
- **`docs: PR-F — seniority_boost + search_queries в help §5 × 8 локалей + scaffold`** (G-010) — Help §5 во всех 8 локалях документирует третий title-filter ключ + блок-пример search_queries. `bin/setup.sh` сидит `seniority_boost: ["Senior", "Staff", "Lead"]` по умолчанию.
- **`docs: PR-I — локализованные hero images по локалям README`** — каждый из 8 README имеет locale-specific `images/dashboard-<locale>.png` (HiDPI 1440×900) сгенерированных через `scripts/capture-dashboard-screenshots.mjs`. Старый `public/images/screen_vacancy_found.png` удалён.

### 🧹 Carryover cleanups

- **`PR-G — G-001`** scan.noResults i18n: заменены 8 строк с "EN or RU scan" литералом.
- **`PR-G — G-002`** 📄 Generate PDF теперь surface'ит на #/interview-prep result panel'ях.
- **`PR-G — G-003`** `README.cn.md` → `README.zh-CN.md` (canonical locale tag).
- **`PR-G — G-004`** `/api/stream/scan-en` + `scan-ru` теперь эмитят RFC 8594 Sunset + Deprecation + Link headers (sunset 2026-10-01). Удаление в v1.16.0.

### 🧪 Тесты

- Новый `tests/profile-canonical-schema.test.mjs` (6 кейсов).
- Новый `tests/modes-profile-crud.test.mjs` (8 кейсов).
- Исправлена isolation регрессия в test fixtures: тесты теперь используют `before/after + dynamic-import` pattern, чтобы не мутировать parent `config/profile.yml`.
- Итого: **400 / 400** unit-тестов (было 386; +14). 0 падений.

### Out of scope (v1.16+)

| Item | Notes |
|---|---|
| Parent commit для canonical A–F prompt | `santifer/career-ops::modes/oferta.md` надо переписать upstream. CLAUDE.md hard rule #1 запрещает нам трогать parent. |
| Server-side `POST /api/auto-pipeline` SSE | Client-side orchestrator ships UX win; server-side даст retry-from-step-N + curl-able CI. |
| `POST /api/reports` primitive | Auto-pipeline показывает markdown inline, но не persist'ит в parent `reports/`. |
| Cmd+K paste-URL → run auto-pipeline | Defer to v1.16+. |

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

Gran release. Cierra los 4 items diferidos en un solo commit: PR-4 (pipeline multer completo), Adapter registry (continuación arquitectónica de F-018), página SPA Batch evaluate, y locale-aware mode-template scaffolding. Más un fix mid-session de tablas en dark theme.

### ✨ Features

- **`feat(cv): multer multipart upload (PR-4 completo)`** — `/api/cv/import` ahora acepta TANTO octet-stream (contrato original) COMO `multipart/form-data` via multer. El 415-reject de v1.10.2 era un stopgap; v1.13.0 es el fix real. curl `-F`, default de Postman, cualquier cliente HTTP funcionan sin fricción. Nueva dependencia: `multer ^2.1.1`.
- **`feat(portals): adapter registry`** — los fetchers de Greenhouse / Ashby / Lever extraídos a `server/lib/portals/adapters/*.mjs` con contrato uniforme. `server/lib/portals/registry.mjs::resolveAdapter()` es el único punto de dispatch. Añadir un nuevo ATS = un archivo en `adapters/` + una línea en `ALL_ADAPTERS`.
- **`feat(batch): #/batch evaluate page`** — nueva vista SPA + 4 endpoints (`GET /api/batch`, `PUT /api/batch`, `GET /api/stream/batch`, `POST /api/batch/merge`). Editor TSV para `batch/batch-input.tsv`, controles parallel/min-score/dry-run/retry, log SSE en vivo de `bash batch/batch-runner.sh`, botón `Merge to tracker` (ejecuta `node merge-tracker.mjs`). Link en sidebar. 21 keys i18n nuevas × 8 locales.
- **`feat(prompts): locale-aware mode scaffolding`** — `buildModePrompt` + `buildEvaluationPrompt` ahora envuelven el cuerpo inglés del mode-template del parent con scaffolding localizado (role-line, "Read these files first", "User-supplied context") en 8 locales.

### 🎨 UX fixes

- **`fix(theme): tablas dark-mode + tab-btn`** — `#fafafa` / `#fff` / `#f7f7f7` hardcoded reemplazados con tokens. Hover en dark ahora legible. Añadido `.row-boosted` accent strip.

### 🧪 Tests

- Nuevos `tests/adapter-registry.test.mjs` (7), `tests/batch-endpoints.test.mjs` (5), `tests/locale-scaffold.test.mjs` (6).
- `tests/cv-upload-multipart-reject.test.mjs` reescrito al contrato v1.13.0 (multipart parsed properly).
- Total: **379 / 379** unit (era 360; +19). 0 failures. Cobertura **95.46 % líneas / 84.06 % ramas**.
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright.

### Fuera de scope

- **14 adapters de portal nuevos** — registry está; añadirlos = un archivo cada uno; queda el portal-by-portal research.
- **Traducir cuerpos de `modes/<slug>.md` del parent** — requiere PR upstream a `santifer/career-ops` (CLAUDE.md hard rule #1).

### Documentación

- `docs/reviews/REVIEW-2026-05-13-v1.13.0.md`.
- Texto completo: [CHANGELOG.md](CHANGELOG.md#1130--2026-05-13).

---

## [1.12.0] — 2026-05-13

Pass de bug-fix + UX + brand. Cierra 8 items del backlog tras v1.11.1 (huecos de test #9–12, console error #8, drift portals-dead #4, surface seniority_boost #6, consolidación de endpoint F-018). Añadido toggle day/night de tema, eliminada la mención "Airbnb-styled" de todos los docs, metadata del package y descripción del repo GitHub.

### ✨ Features

- **`feat(theme): toggle day/night`** — nuevo botón de tema en la top-bar. Ciclo light ↔ dark, persiste en `localStorage`, se restaura antes del primer pintado via `public/js/lib/theme-bootstrap.js`. Respeta `prefers-color-scheme` en la primera carga. Paleta dark completa en `public/css/app.css` bajo `[data-theme="dark"]`.
- **`feat(scan): /api/stream/scan?source=ats|regional|both` (F-018 LITE)`** — un endpoint SSE consolidado. El SPA abre UN solo event-stream que ejecuta secuencialmente ambas fases (ATS, luego regional). Legacy `/api/stream/scan-en` + `/api/stream/scan-ru` permanecen como deprecated aliases.
- **`feat(scan): seniority_boost surface`** — ambos scanners leen `portals.yml::title_filter.seniority_boost` y marcan `_boosted: true` en jobs coincidentes. El SPA ordena las filas boosted arriba y renderiza un badge `⬆ boosted`.

### 🐛 Fixes

- **`fix(ui): .message null-safe en 4 sitios (#8)`** — `app.js`, `views/tracker.js`, `views/apply.js`, `views/evaluate.js`. Antes un Promise rejection sin Error payload arrojaba "Cannot read properties of undefined" en e2e teardown.
- **`fix(test): drift portals-dead como warning, no failure (#4)`** — assertion convertida a warning en stderr. CI sigue verde en parent drift; las decisiones de release son manuales.

### 📝 Brand / docs

- **`docs(brand): eliminadas referencias 'Airbnb' de todos los doc + package + descripción del repo GitHub`** — 8 README, CLAUDE.md, FRONTEND.md, package.json y la descripción del repo migrados de "Airbnb-styled" a "Clean, docs-style".

### 🧪 Tests

- Nuevo `tests/canonical-docs-coverage.test.mjs` (5 casos) cierra test gaps #9–12.
- Nuevo `tests/scan-consolidated.test.mjs` (6 casos) cubre F-018 LITE.
- Total: **360 / 360** unit (era 349; +11 nuevos). 0 failures. Cobertura: **95.62 % líneas / 84.37 % ramas**.
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright.

### Documentación

- `docs/reviews/REVIEW-2026-05-13-v1.12.0.md`.
- Texto completo: [CHANGELOG.md](CHANGELOG.md#1120--2026-05-13).

### Fuera de scope (sin cambios desde v1.11.1)

Página SPA Batch evaluate; adapter registry completo (refactor arquitectónico F-018); pipeline multer completo (PR-4); traducción de mode templates.

---

## Releases anteriores (v1.11.x y v1.10.x)

Las entradas detalladas para v1.11.0 / v1.11.1 / v1.10.0–v1.10.3 viven en el [CHANGELOG EN](CHANGELOG.md). Resumen ejecutivo:

- **v1.11.1 — 2026-05-13** · Polish: hint Playwright en `#/apply`, taglines unificadas, dashboard score-thresholds card. 349/349 tests.
- **v1.11.0 — 2026-05-13** · Integración career-ops.org/docs en las 8 help bundles y los 8 README. Nuevo `docs/career-ops-canonical.md`. Conceptos Mode/Archetype/Pipeline/Tracker/Report/Scan history documentados. 348/349 tests.
- **v1.10.3 — 2026-05-12** · Bug-fix slice: cierra 7 de 11 hallazgos QA del run de regresión v1.10.2.
- **v1.10.2 — 2026-05-12** · CV multipart 415-reject (parche temporal hasta v1.13.0 multer); fix de generación de PDF.
- **v1.10.1 — 2026-05-09** · Parche crítico del QA regression run del v1.10.0.
- **v1.10.0 — 2026-05-08** · `#/profile` editor + CV upload UX (pandoc/pdftotext/passthrough), 8 locales × 16 H2 help parity, locale switcher.
