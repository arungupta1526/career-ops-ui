# Registro de cambios

Todos los cambios destacables de **career-ops-ui**. Formato según [Keep a Changelog](https://keepachangelog.com/es/1.1.0/), versionado [SemVer](https://semver.org/lang/es/).

Traducciones: [English](CHANGELOG.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

---

## [1.7.0] — 2026-05-03

Pase de hardening + UX de 21 commits guiado por el QA del v1.6.0. Aterrizaron tres capas de seguridad (sanitización XSS, CSP, validación de entrada), se completaron los endpoints CRUD que faltaban (DELETE jds, POST tracker), y la UI ganó dos páginas nuevas: **Activity** y un **Deep Research** rediseñado que se ejecuta en el navegador. La cobertura de tests pasó de **73** a **177**, con **14 archivos de test nuevos**.

### 🔒 Seguridad

- **`fix(cv): sanitizar Markdown del CV para bloquear XSS persistente` (FIX-C10)** — `PUT /api/cv` elimina ahora `<script>`, `<iframe>`, `<object>`, `<embed>`, `<style>`, `<form>`, `<svg>`, manejadores `on*=` y URIs `javascript:`/`vbscript:`/`data:text/html` antes de escribir `cv.md`. Cuerpo limitado a 1 MB (413 si se excede). El `UI.md()` cliente fue reescrito para escapar todo el origen *antes* de cualquier transformación markdown — el HTML crudo nunca llega a `innerHTML`. Los `href` se validan contra una lista blanca (`http`/`https`/`mailto`/`tel`/relativos + sólo `data:image`). 17 nuevos tests.
- **`fix(server): cabeceras CSP + base de seguridad` (FIX-L2)** — cada respuesta lleva `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`. Cuando el servidor escucha más allá de loopback (`HOST` ≠ `127.0.0.1`/`::1`/`localhost`), se aplica un `Content-Security-Policy` estricto: `default-src 'self'`, `script-src 'self'` (sin `unsafe-inline`), Google Fonts en whitelist, `connect-src 'self'` bloquea exfiltración. Los `onclick` inline de `index.html` y `router.js` migraron a `addEventListener`. 8 nuevos tests.
- **`fix(api): endurecer validador de URL en pipeline` (FIX-M7)** — `POST /api/pipeline` aceptaba `"not-a-url"` y lo persistía. Ahora `isValidJobUrl()` rechaza cadenas sin esquema, longitud <10 o >2000, URLs con espacios, esquemas distintos de `http(s)`, hostnames loopback. Incluye **FIX-M3** + **FIX-M6**.
- **`fix(api): sanitizar JD antes del prompt` (FIX-M5)** — `POST /api/evaluate` quita escapes ANSI, bytes de control, `<script>` inline y recorta espacios antes de llamar a Gemini o devolver el prompt. Tope 50 KB. El mínimo de 50 chars se evalúa contra el texto *sanitizado*.
- **`fix(health): ocultar Node version + project root cuando HOST!=loopback` (FIX-M1)** — `/api/health` deja de revelar fingerprint del host en despliegues LAN.

### ✨ Nuevas funcionalidades

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

- **Tests:** 73 → **177** (+104 tests en 14 archivos nuevos). El único test fallando (`runEnScan: dry-run end-to-end`) es un flake preexistente dependiente de APIs vivas.
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
