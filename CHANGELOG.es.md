# Registro de cambios

Todos los cambios destacables de **career-ops-ui**. Formato según [Keep a Changelog](https://keepachangelog.com/es/1.1.0/), versionado [SemVer](https://semver.org/lang/es/).

Traducciones: [English](CHANGELOG.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

> **Nota i18n** — desde v1.12.0 hacia adelante las entradas están localizadas en cada idioma. Entradas anteriores (v1.11.x, v1.10.x) permanecen en ruso por convención del proyecto; el contenido inglés normativo está en [CHANGELOG.md](CHANGELOG.md).

---

## [1.21.0] — 2026-05-14

**Security + concurrency + a11y polish from two independent code-review passes.** Seven findings from `docs/specs/V1.20.1-BACKLOG.md` shipped in one release. 34 new tests; baseline **461 / 461** unit + 32/32 Playwright.

### Highlights

- **B-1 (Security):** new `server/lib/safe-fetch.mjs` closes the DNS-rebind TOCTOU window in `/api/pipeline/preview` and `/api/auto-pipeline`.
- **H-4 (Security):** `sanitizePathName` hoisted into `security.mjs`; 10 broken regex copies deleted; path-traversal sweep test added.
- **H-5 (Security):** new `llmRateLimit` middleware — 10 req/min/IP on `HOST=0.0.0.0`. No-op on loopback.
- **H-6 (Concurrency):** new `server/lib/file-lock.mjs::withFileLock(path, fn)` serializes read-modify-write on `applications.md` / `pipeline.md`.
- **H-3 (i18n):** 19 missing keys × 8 locales = ~150 new translations; static-analysis canary added.
- **H-1 / H-2 (a11y):** `id="batch-tsv-hint"` on the hint paragraph + `htmlFor` on two labels.

### Breaking changes

None. `LLM_RATE_LIMIT` is opt-in via env.

See [`CHANGELOG.md`](CHANGELOG.md) for the full English changelog with verification commands.

---

## [1.20.0] — 2026-05-13

**Per-component a11y polish + non-EN README parity + `/api/scan-ru/config` alias retired.** Closes the four items the v1.19.0 "Out of scope" table flagged for v1.20.

### Highlights

- **WCAG 2.5.5 / 2.5.8 — per-component touch-targets:** `.chip` → `min-height: 28px` + `.chip-row { gap: 8px }` (spaced-target exception). `.nav-item` and `.tab-btn` → `min-height: 44px`.
- **WCAG 1.3.1 / 3.3.2 — `aria-describedby` on form hints:** every form control across `config.js` / `evaluate.js` / `batch.js` / `pipeline.js` / `mode-page.js` now owns a stable `id`, `<label htmlFor=…>`, and `aria-describedby` for inline hints. `UI.el()` learned a React-style `htmlFor` alias.
- **Non-EN README parity:** all 7 locales now mirror the 585-line EN structure end-to-end (Why?, Quick start, full API reference, Architecture, 🌍 Getting Started walkthrough).
- **Alias retired:** `DELETE /api/scan-ru/config`. Use `/api/scan/regional/config`. Sunset was announced in v1.19.0.

### Tests

**427 / 427** unit + 20/20 smoke + 23/23 comprehensive + 32/32 Playwright. All a11y wiring is additive; no behavioral test deltas.

### Breaking changes

- `GET /api/scan-ru/config` — removed (use `/api/scan/regional/config`).

See [`CHANGELOG.md`](CHANGELOG.md) for the full English changelog.

---

## [1.19.0] — 2026-05-13

**WCAG 1.4.3 contrast + scan unification (final) + HH_USER_AGENT removed from UI.** Closes the v1.18 out-of-scope contrast audit, finishes the EN/RU split elimination begun in v1.18, and removes the `HH_USER_AGENT` configuration knob from the UI per user direction (a sensible default bundled in the server already handles non-RU IPs for most users).

### ♿ WCAG 1.4.3 contrast pass

- **`a11y(contrast): introduce AA-passing *-text variants for accent tokens`** — light theme: `--rausch-text: #b80f42` (6.59:1 on white, was 3.52:1), `--kazan-text: #066507` (7.31:1, was 4.53:1), `--darjeeling-text: #7a5800` (5.73:1 on amber bg, was 4.24:1), `--babu-text: #00665e` (6.09:1, was 2.70:1). Dark theme: lightened mirrors (`#ff8aa0`, `#6ee7b7`, `#fcd34d`, `#5eead4`) hit the same 4.5:1 floor on `#161a22` paper.
- Badge classes (`.badge-ok`, `.badge-warn`, `.badge-bad`, `.badge-info`) and score pills (`.score-high`, `.score-mid`, `.score-low`) now route through the new `*-text` variants — every text-on-tinted-bg combo passes AA. The accent fill tokens (`--rausch`, `--kazan`, etc.) stay unchanged for borders and outlines (which only need 3:1 for non-text UI components).

### 🧹 Scan unification (finishes v1.18 work)

- **`docs(scan): scrub remaining EN/RU split references across READMEs + help + architecture docs`** — eight READMEs + eight help bundles + three architecture docs (API.md, SERVER.md, OVERVIEW.md, DATA-FLOWS.md) + scan.js comment now describe a single consolidated scan method. The legacy `/api/stream/scan-{en,ru}` aliases were already gone in v1.18; v1.19 catches the doc/copy that still framed scanning as a two-step EN+RU process.
- **`feat(scan): canonical /api/scan/regional/config endpoint`** — `/api/scan-ru/config` kept as a thin alias through one release for back-compat. The new path matches the source-naming convention (`?source=regional`).

### 🛠️ HH_USER_AGENT removed from UI

- **`feat!(config): drop HH_USER_AGENT field from /#/config + KNOWN_KEYS`** — power users can still set `HH_USER_AGENT` directly in `career-ops/.env` (the server reads via `process.env.HH_USER_AGENT` in `server/lib/sources/hh.mjs` with the bundled UA as fallback). The UI no longer exposes it because the default works for most users and seeing an inscrutable User-Agent field in the App Settings page was a recurring source of confusion.
- README mentions across 8 locales + help bundle mentions across 8 locales replaced with "run via a Russian IP / VPN" advice. The `scan.hhWarning` i18n key was rephrased to drop the env-var setup detail.
- `KEY_GROUPS` collapsed: no more `regional` classification (it only had HH_USER_AGENT). Tests updated; `regionalActive` payload field preserved for SPA back-compat.

### 🧪 Tests

- `tests/env-config.test.mjs` — `KNOWN_KEYS` assertion now excludes HH_USER_AGENT; new assertion that the key is intentionally absent.
- `tests/config-endpoint.test.mjs` — POST-write multi-key test uses `GEMINI_MODEL` as the second known key instead of HH_USER_AGENT.
- `tests/config-groups.test.mjs` — `groups.HH_USER_AGENT` is now expected `undefined`.
- Total: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + 32/32 Playwright. Same counts as v1.18.0 because every adjusted test was already counted.

### Verification

```bash
npm test                              # 427 / 427

# Contrast (Chrome DevTools or axe) on light + dark:
#   .badge-ok / .badge-warn / .badge-bad / .badge-info → AA pass (4.5:1+)
#   .score-high / .score-mid / .score-low → AA pass

# HH_USER_AGENT no longer in /api/config:
curl -s http://127.0.0.1:4317/api/config | jq '.values | keys'
# → ["ANTHROPIC_API_KEY","ANTHROPIC_MODEL","GEMINI_API_KEY","GEMINI_MODEL","HOST","PORT"]
# (no HH_USER_AGENT)

# Canonical regional config endpoint:
curl -s http://127.0.0.1:4317/api/scan/regional/config | jq '.'
# Legacy alias still alive through v1.20:
curl -s http://127.0.0.1:4317/api/scan-ru/config | jq '.'
```

### Out of scope (v1.20+)

| Item | Notes |
|---|---|
| Per-component touch-target audit (filter chips, sortable headers, sidebar nav) | v1.18 set the global floor (`.btn` 44 px, `.btn-sm` 32 px); per-component verification across the SPA remains. |
| `aria-describedby` on inline form hints (`#/config`, `#/pipeline`, `#/evaluate`, `#/batch`) | v1.17 covered `aria-label` on global search + modal close. Per-input hint association is the next polish layer. |
| Full non-EN README parity (585 lines like EN) | v1.18 brought non-EN to ~307 (53 % of EN). Marketing-heavy "Quick start" + "🌍 Getting Started" walkthroughs remain EN-only. |
| Remove `/api/scan-ru/config` legacy alias | Sunset planned for v1.20. The canonical `/api/scan/regional/config` is the migration target. |

---

## [1.18.0] — 2026-05-13

**Consolidación del endpoint scan + paso WCAG 2.2 AA + finalización i18n long-tail.** Retira los aliases legacy `/api/stream/scan-{en,ru}` (ventana Sunset 2026-10-01 adelantada a v1.18 por dirección del usuario). Lleva los READMEs non-EN a ~307 líneas y traduce las entradas CHANGELOG v1.16.0 + v1.17.0 RU-bodied restantes en 6 locales.

### 🚪 Breaking

- **`feat!(scan): retire legacy /api/stream/scan-{en,ru} aliases`** — los endpoints SSE split EN/RU deprecados se han ido. Cada consumidor pasa por el endpoint consolidado `/api/stream/scan?source=ats|regional|both` (vivo desde v1.12.0). Los paths legacy tenían headers Deprecation + Sunset (RFC 8594) desde v1.15.0; la ventana de migración está cerrada. Integraciones externas en los paths antiguos reciben un **404** limpio en vez de ser ruteadas silenciosamente al catch-all del SPA.

### ♿ Accesibilidad (paso WCAG 2.2 AA)

- **WCAG 2.4.1 Bypass Blocks** — nuevo link **Skip to main content** como primer focusable en cada página. Visualmente oculto vía `.skip-link` hasta que recibe focus, se ajusta a la esquina superior izquierda en Tab desde carga de página.
- **WCAG 2.4.7 Focus Visible** — estilo global `*:focus-visible`. Mouse-click focus rings off, keyboard-Tab focus rings on (patrón estándar WAI-ARIA AP). Modal close (×) recibe un focus ring de mayor contraste.
- **WCAG 2.5.5 Target Size** — mínimo 44×44 px touch target en `.skip-link`. `.btn-sm` mantiene 32 px min-height (combinado con row spacing cumple la excepción AAA 24×24 + spacing para controles compactos de table-row).
- **WCAG 3.1.1 Language of Page** — `<html lang="en">` corregido de `lang="ru"`. El bootstrap JS i18n ya sobrescribía esto en load, pero el SSR default ahora coincide con el default locale del SPA.
- **WCAG 1.3.1 Info & Relationships** — `#content` recibe `tabindex="-1"` para que el target del skip-link reciba focus limpiamente. (ARIA roles + focus-trap ya estaban en v1.17.)

### 📚 i18n long-tail

- **`docs(i18n): CHANGELOG v1.16.0 + v1.17.0 traducidos en 6 locales`** — entradas antes RU-bodied en `CHANGELOG.{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md` están ahora en su idioma nativo. RU-char count por locale cayó 79 → 42 → 23.
- **`docs(readme): expandir READMEs non-EN con Why / Requirements / Features / Configuration / Contributing`** — cada README non-EN creció de 240 → ~307 líneas. Ahora cubre las mismas secciones non-marketing que el EN de 585 líneas.

### 🧪 Tests

- Total: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + 32/32 Playwright (count sin cambios; +2 nuevas assertions correctas de legacy-removal reemplazan las +2 assertions legacy-still-works).

---

## [1.17.0] — 2026-05-13

**Polish + a11y + fix de CI.** Cierra 9 follow-ups del REVIEW de v1.16.0: verificación smoke en browser, badge truth en READMEs, refresh de coverage, chip 🔒 `lastWorkdayFallback` en SPA, re-baseline E2E completo tras cambio UX de v1.16, scenarios Playwright para auto-pipeline, pase a11y ARIA + focus trap, condensación de CHANGELOG histórico en 6 locales, expansión de READMEs non-EN con secciones de referencia.

### 🐛 Fixes

- **`fix(e2e): smoke + comprehensive re-alineados con UX de v1.16`** — el cambio de v1.16 Cmd+K Enter → modal AutoPipeline hizo que `search.press('Enter')` en e2e tests abriera un modal que interceptaba clicks siguientes. Tests ahora usan `Shift+Enter` para el path legacy quick-add. **Este era el fallo de CI en push v1.16.0** — Playwright e2e taimaba 30s en clicks interceptados por el backdrop.
- **`fix(mode-page): /#/batch-prompt → modes/batch.md vía serverSlug`** — v1.15 renombró el legacy mode slug a `batch-prompt`, pero el server `POST /api/mode/:slug` buscaba `modes/batch-prompt.md` que no existe. Nuevo campo `serverSlug` desacopla el hash de ruta del filename del mode del padre.
- **`chore: bump de mensajes de deprecación de v1.16.0 → v1.17.0`** — el copy de deprecación de scan-en/scan-ru y el banner de batch-prompt referenciaban la versión pasada.

### ✨ Features

- **`feat(scan): chip 🔒 Workday CAPTCHA en card Active Companies`** — el export server-side `lastWorkdayFallback` de v1.16 PR-7 es ahora consumido por el SPA. `/api/scan-results` devuelve el snapshot; `#/scan` renderiza un card warn-tinted sobre Active Companies cuando un tenant Workday cayó al fallback ("🔒 Workday tenant blocked — fallback: usa /career-ops scan (Playwright)"). Nuevo `getLastWorkdayFallback()` evita ambigüedad de live-binding ESM. 2 nuevas keys i18n × 8 locales.

### ♿ Accesibilidad

- **`a11y: pase de ARIA roles + focus management`** —
  - `index.html`: atributos `role` en `<aside>` (navigation), `<header>` (banner), `<section id="content">` (main), `<div id="modal">` (dialog con aria-modal/aria-labelledby), `<div id="toast">` + `#conn-banner` (status con aria-live), `<div class="searchbar">` (search).
  - `#sidebar-toggle` obtiene `aria-controls="sidebar"` + `aria-expanded` sincronizado por JS en open/close.
  - `#global-search` obtiene un `<label>` visually-hidden más un `aria-label` explícito que surface el hint del shortcut Cmd+K.
  - El close del modal (×) obtiene `aria-label="Close dialog"`.
  - Backdrops decorativos obtienen `aria-hidden="true"`.
  - **Focus trap en modal** — `UI.modal()` recuerda el click owner, focusea el primer focusable non-close en open, y cicla Tab/Shift+Tab dentro del modal. `UI.closeModal()` restaura focus al owner previo.
  - Nuevo utility class `.visually-hidden` en `public/css/app.css` (patrón estándar WAI-ARIA AP).

### 📚 Documentación

- **`docs(readme): badge truth a través de 8 READMEs`** — badge de tests `284 / 379 / 360` → **427**; badge release `v1.9.1 / v1.13.0` → **v1.16.0** luego → v1.17.0 vía el bump de v1.17. Targets de links de release actualizados.
- **`docs(readme): expandir 7 READMEs non-EN con secciones de referencia`** — cada uno creció 170 → ~240 líneas con nuevas secciones Architecture / API reference / Security notes / Tests / A11y / Limitations / License en el idioma nativo. Todavía no en paridad completa de 585 líneas con EN pero cubre todos los surfaces non-marketing clave.
- **`docs(changelog): condensar entradas pre-v1.12 en 6 locales`** — las entradas largas RU-bodied v1.11.x + v1.10.x que sangraban en los CHANGELOGs non-EN/non-RU son ahora reemplazadas por un resumen ejecutivo "Earlier releases" compacto en el idioma nativo de cada locale. Historia detallada queda en `CHANGELOG.md` (EN).

### 🛠️ Tooling

- **`coverage: refresh de números`** — último publicado fue 95.46 % línea / 84.06 % rama (REVIEW v1.13.0). Baseline v1.17: **94.14 % línea / 82.98 % rama / 93.20 % función**. Caída ligera por nuevos error paths en auto-pipeline + reports-write; aún muy arriba del piso 80 % en CLAUDE.md.

### 🧪 Tests

- Total: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + **32 / 32** Playwright (era 28; +4 nuevos scenarios auto-pipeline: button abre modal, Cmd+K paste triggers modal, URL inválida gates step 1, framing de eventos SSE `POST /api/auto-pipeline`).
- Suite E2E re-alineado con UX de v1.16.0 (Shift+Enter quick-add, /#/batch-prompt para mode legacy).

### Out of scope (v1.18+)

| Item | Notas |
|---|---|
| Traducir entrada v1.16.0 en CHANGELOGs non-EN | Actualmente RU-bodied (~30 líneas × 6 locales = 180 líneas). Fue fuera del scope explícito v1.11.x/v1.10.x del user. |
| Paridad completa de README non-EN (585 líneas como EN) | v1.17 trajo non-EN a ~240; los walkthroughs "Why?" / "Quick start" marketing-heavy permanecen EN-only. |
| Audit completo WCAG 2.2 AA | v1.17 cubrió ARIA estructural + focus trap; audit per-componente contrast/Tab-order pendiente. |

---

## [1.16.0] — 2026-05-13

**Finalización del auto-pipeline + pulido de adapters + i18n long-tail.** Cierra los 11 follow-ups del REVIEW de v1.15.0: SSE auto-pipeline server-side, primitiva `POST /api/reports`, atajo Cmd+K, paginación SmartRecruiters, Workday CAPTCHA-fallback, gate CI de drift de screenshots, UX del filtro de source en scan, traducción del CHANGELOG histórico (v1.13.0/v1.12.0 × 6 locales), expansión de READMEs non-EN, importer paste-ready de empresas trending.

### ✨ Features

- **`feat(auto-pipeline): orchestrator SSE server-side`** (#1, #2, #3, #8) — el orchestrator client-side chained-fetch de v1.15 ha sido eliminado. `POST /api/auto-pipeline` es ahora un endpoint SSE curl-able que ejecuta validate → fetch JD → evaluate → save report → tracker en el servidor con eventos step en tiempo real. La llamada lenta a Anthropic (30–90 s) ahora emite eventos `running` en vez de un spinner genérico. Los fallos emiten `error` con `step` + `message`. El orchestrator también persiste el markdown del report en el padre `reports/<slug>.md` (se perdía en v1.15).
- **`feat(reports): primitiva POST /api/reports`** — nuevo writer en `server/lib/routes/reports.mjs`. Saneamiento de slug con guard de path-traversal. Tope de 1 MB (413). 409 en file existente sin `overwrite:true`. Atomic write a través de `stripDangerousMarkdown`. Logs activity.reports.save. Tests: 9 casos.
- **`feat(app): Cmd+K paste URL → auto-pipeline`** — pegar URL en global search + Enter abre el modal AutoPipeline con `autoStart=true`. Shift+Enter preserva la ruta legacy "add to pipeline only".
- **`feat(portals): paginación SmartRecruiters`** (#4) — `server/lib/sources/smartrecruiters.mjs` recorre páginas vía `?limit=100&offset=N` hasta alcanzar `totalFound` O página vacía O safety cap de 30 páginas / 3000 jobs. Boards grandes (Procter & Gamble) ya no pierden el resto de sus postings. Tests: 6 casos.
- **`feat(portals): Workday CAPTCHA-fallback graceful`** (#7) — `server/lib/sources/workday.mjs` ya no lanza en 4xx / non-JSON / network errors. Devuelve `[]` y anota el nuevo export `lastWorkdayFallback`. La timeline del scanner continúa con el siguiente tenant. Opt-in al throw de v1.14 vía `strict:true`. Tests: 7 casos.

### 🛠️ Tooling + CI

- **`ci(workflows): drift gate de dashboard-screenshots`** (#5) — nuevo `.github/workflows/dashboard-screenshots.yml`. En PRs que tocan `public/css/app.css`, `public/js/views/dashboard.js`, `public/js/lib/i18n.js` o `public/index.html`, el workflow bootea el server contra un /tmp scaffold, regenera los 8 hero PNGs vía Playwright + chromium, y falla el build si el resultado drift'a de lo committed.
- **`feat(scripts): import-trending-companies.mjs`** (#11) — verifica las 13 empresas trending en `docs/portals-examples.md` vía su boards-API real y emite YAML pegueable para el `portals.yml::tracked_companies` del padre. `enabled: false` se estampa en candidatos cuyo slug 404'ea. Run vía `npm run import:trending`.
- **`feat(scripts): npm run capture:dashboards`** — expone `scripts/capture-dashboard-screenshots.mjs` como top-level script.

### 🎨 UX

- **`fix(scan): dropdown de filtro source consolidado`** (#6) — el dropdown de source de `#/scan` reconstruido del adapter registry de v1.14: 6 ATSes + hh.ru + Habr Career, alfabético, sin prefijos geo. `runEnScan`/`runRuScan` ahora apuntan al endpoint consolidado `/api/stream/scan?source={ats,regional}`.

### 📚 i18n long-tail

- **`docs(i18n): traducir CHANGELOG v1.13.0 + v1.12.0 en 6 locales`** (#9) — entradas antes RU-bodied en `CHANGELOG.{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md` ahora están en su locale real. Cada CHANGELOG non-EN/non-RU también recibe una nota i18n explicando que las entradas pre-v1.12 permanecen en RU por convención del proyecto.
- **`docs: expandir READMEs non-EN con sección de highlights v1.16.0`** (#10) — 6 READMEs non-EN (es / pt-BR / ko-KR / ja / ru / zh-CN / zh-TW) reciben una nueva sección de ~35 líneas cubriendo: flujo one-click auto-pipeline + ejemplo curl, paginación SmartRecruiters, Workday fallback, UX del filtro source en scan, script importer, y workflow CI de screenshots.

### 🧪 Tests

- Nuevo `tests/reports-write.test.mjs` (9 casos) — happy path, slug sanitization (incl. path-traversal guard), conflicto 409, flag overwrite, strip XSS, 400 en campos faltantes, 413 en >1 MB, round-trip GET/POST.
- Nuevo `tests/auto-pipeline.test.mjs` (5 casos) — framing SSE, gate URL inválida, gate SSRF/loopback, ruta error sin LLM key, header Content-Type `text/event-stream`.
- Nuevo `tests/smartrecruiters-pagination.test.mjs` (6 casos) — single page, 3 pages, empty-page early-stop, hard cap honored, query strip, 503 lanza.
- Nuevo `tests/workday-fallback.test.mjs` (7 casos) — happy path, 403/429 graceful, non-JSON body, network error, strict opt-in para 4xx y network errors.
- Total: **427 / 427** unit (era 400; +27 netos). 0 fallos. 28/28 Playwright + 23/23 comprehensive E2E + 20/20 smoke E2E verde desde baseline v1.15.0.

### Out of scope (v1.17+)

| Item | Notas |
|---|---|
| Translate pre-v1.12 CHANGELOG entries (v1.11.x, v1.10.x) | Convención preservada: RU-bodied. Backport es ~1800 líneas de traducción; diferido. |
| Paridad completa de README non-EN (585 líneas como EN) | v1.16 agregó ~35 líneas por locale; mirror completo es un pase de traducción separado. |
| Surface de `lastWorkdayFallback` en el card SPA Active Companies | Server export cableado; consumo UI es v1.17. |
| Bulk add per-company de `tracked_companies` para las 9 trending verificadas | El script `import:trending` lo hace 1-comando + 1-paste. Automatizar writes al `portals.yml` del padre violaría CLAUDE.md hard rule #1. |

### Verification

```
npm test                              # 427 / 427
node -e "import('./server/lib/portals/registry.mjs').then(m => console.log(m.ALL_ADAPTERS.length))"   # → 6

curl -N -X POST http://127.0.0.1:4317/api/auto-pipeline \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://job-boards.greenhouse.io/anthropic/jobs/4567"}'

curl -X POST http://127.0.0.1:4317/api/reports \
  -H 'Content-Type: application/json' \
  -d '{"slug":"smoke","markdown":"# smoke
"}'
```

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
