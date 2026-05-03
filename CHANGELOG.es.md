# Registro de cambios

Todos los cambios destacables de **career-ops-ui**. Formato según [Keep a Changelog](https://keepachangelog.com/es/1.1.0/), versionado [SemVer](https://semver.org/lang/es/).

Traducciones: [English](CHANGELOG.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

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
