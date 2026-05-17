# Registro de cambios

Todos los cambios destacables de **career-ops-ui**. Formato según [Keep a Changelog](https://keepachangelog.com/es/1.1.0/), versionado [SemVer](https://semver.org/lang/es/).

Traducciones: [English](CHANGELOG.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

> **Nota i18n** — desde v1.12.0 en adelante las entradas están localizadas en cada idioma. Las entradas anteriores (v1.11.x, v1.10.x) permanecen en ruso por convención del proyecto; el contenido normativo inglés está en [CHANGELOG.md](CHANGELOG.md).

> **Nota de traducción (v1.22.0)** — este archivo está ahora íntegramente traducido al español técnico. Se han retirado los avisos provisionales "ver CHANGELOG.md en inglés" que aparecían en las entradas v1.13.0 a v1.21.0.

---

## [1.39.0] — 2026-05-18

**WS8.2 — selector de proveedor LLM + clave OpenAI/Codex + asistente `init` interactivo.** `LLM_PROVIDER` (auto|claude|gemini) + `OPENAI_API_KEY` en env-config (secreto). `providerOrder()` consultado por los 6 gate-sites de llm.mjs vía `_provGate()`; sin cambio de comportamiento para auto. Select + campo en #/config. `scripts/init.mjs` ahora es un asistente real (escribe parent .env por la ruta validada). 7 tests. 622 → 629. README ×8 / fold canónico = WS8.3/WS10. Detalle en [`CHANGELOG.md`](CHANGELOG.md).

---

## [1.38.0] — 2026-05-17

**WS8.1 — dispatcher CLI unificado + verbo `doctor`.** `bin/career-ops-ui.sh` despacha setup/run/doctor/init/help. `scripts/doctor.mjs` reutiliza el motor `/api/health` exacto (createApp in-process → reporte terminal); exit 0 sólo si todos los checks REQUERIDOS pasan. docs/sdd + help §1 ×8. 6 tests. 616 → 622. README quickstart ×8 = WS8.3 (paso final). Detalle en [`CHANGELOG.md`](CHANGELOG.md).

---

## [1.37.0] — 2026-05-17

**WS7 — revisión AI pre-commit en el workflow git.** Floor determinista (fail-HARD): bloquea `.env`/secretos staged, patrones de clave en el diff, `.also(` en vistas staged, fallo `node --check`. Capa AI (fail-SOFT): `claude -p` sobre el diff si el CLI está disponible y `AI_REVIEW != off`. `.githooks/pre-commit` + `prepare` cablea `core.hooksPath`. Nunca `--no-verify`. docs/sdd. 6 tests. 610 → 616. Detalle en [`CHANGELOG.md`](CHANGELOG.md).

---

## [1.36.0] — 2026-05-17

**WS6.3 — pestaña Modes: blob crudo → editor por secciones. WS6 completo.** `modes/_profile.md` se edita por sección `##` (un textarea plegable por encabezado). Server `splitProfileSections` byte-exacto; `PUT { sections }` fusiona solo las secciones nombradas — preámbulo + secciones ajenas + orden se conservan byte a byte. Encabezado desconocido → 400. Ruta raw `{ markdown }` intacta. i18n 5 claves ×8. help §2 ×8. 6 tests nuevos. 604 → 610. WS6 cerrado (API-keys/Profile-escalares/Profile-arrays/Modes-secciones todo estructurado). Detalle en [`CHANGELOG.md`](CHANGELOG.md).

---

## [1.35.0] — 2026-05-17

**WS6.4 — editores de arrays del Profile + auditoría WS6.2 de API-keys.** `PUT /api/profile` acepta `{ arrays }` (combinable con `{ fields }`): Target roles/Superpowers (listas), Archetypes (name/level/fit), Proof points (name/url/hero-metric). Misma garantía merge-not-replace; filas vacías descartadas; lista vacía elimina la clave. 4 editores add/remove en #/config. i18n 6 claves ×8. Auditoría: server KNOWN_KEYS ≡ client FIELDS, sin gap. 7 tests nuevos. 597 → 604. Detalle en [`CHANGELOG.md`](CHANGELOG.md).

---

## [1.34.0] — 2026-05-17

**WS5 — pantalla Auto-pipeline de un clic (`#/auto`).** El modal de auto-pipeline pasó a una página dedicada y enlazable. Un clic ejecuta validar→obtener→evaluar→guardar informe→tracker vía SSE. Stepper accesible (lista ordenada, `aria-current`, live-region), deep-links a informe/tracker, modo manual sin key, enlazable `#/auto?url=…&go=1`. Entrada en sidebar; botón ✨ del dashboard ahora va aquí. i18n 14 claves ×8. help §1 ×8 + README ×8. 8 tests nuevos. 589 → 597. Detalle en [`CHANGELOG.md`](CHANGELOG.md).

---

## [1.33.0] — 2026-05-17

**WS4 — auditoría de paridad con career-ops 1.8.0 + `location_filter`.** El `scan.mjs` del proyecto padre ganó `location_filter` (#570); los scanners in-process de web-ui no delegan en él, así que no fluía. Nuevo `server/lib/location-filter.mjs` replica la semántica verbatim; integrado en ambos scanners. Doc help §5 ×8. 8 tests nuevos. 581 → 589. Resto del delta padre clasificado en PARENT-PARITY.md (FLOW/CLI-ONLY/N/A). Detalle en [`CHANGELOG.md`](CHANGELOG.md).

---

## [1.32.0] — 2026-05-17

**Pestaña Profile de `#/config` — blob YAML crudo → formulario por campos (WS1).** 3 secciones plegables (Candidato / Narrativa / Compensación), 14 rutas escalares. El guardado por campos hace **merge** en `config/profile.yml`: arquetipos, proof points y claves propias se conservan intactos. Escape-hatch raw-YAML retenido en *Advanced* (preserva comentarios). 23 claves i18n ×8. 7 tests nuevos (incl. invariante de supervivencia de claves desconocidas). 574 → 581. Detalle en [`CHANGELOG.md`](CHANGELOG.md).

---

## [1.31.0] — 2026-05-17

**Sync con career-ops 1.8.0 — `#/batch` expone `--model` + `--start-from`.** El proyecto padre subió 1.7.1 → 1.8.0; `batch-runner.sh` ganó `--model NAME` (#504) y `--start-from N`. web-ui los expone en `#/batch` (campos **Model** y **Desde #**) con validación defense-in-depth en el servidor (charset para model, entero 1..100000 para start-from). i18n ×8. 7 tests nuevos. 567 → 574. Detalle completo en [`CHANGELOG.md`](CHANGELOG.md).

---

## [1.30.0] — 2026-05-14

**Paginador en `#/scan` — reemplaza el truncamiento «primeros 200 de N» de v1.12.**

Pre-v1.30 la tabla de resultados de scan estaba acotada a las primeras 200 filas filtradas con una nota «Showing first 200 of N» al pie. Las filas 201..N eran inalcanzables desde la UI. v1.30.0 cambia el cap por `UI.paginate` (mismo helper que `#/tracker` / `#/reports` / `#/activity`). `PAGE_SIZE = 200` conserva la densidad visual previa; orden boosted-to-top estable entre páginas (orden COMPLETO y luego paginación); reset automático a página 1 al cambiar filtros. Clave i18n obsoleta `scan.shownTop` eliminada (×8 locales). 9 nuevos casos de prueba en `tests/scan-paginator.test.mjs` (7 canarios estáticos + 1 tabla lógica con 6 casos límite + 1 cómputo del resumen). **558 → 567** unit + acceptance (+9). Detalles completos en [`CHANGELOG.md`](CHANGELOG.md).

---

## [1.29.2] — 2026-05-14

**Hot-fix: `🌐 Scan` con `source=both` solo ejecutaba la fase EN. La fase RU se eliminaba silenciosamente.**

El cliente SSE (`public/js/api.js:156`) cerraba el `EventSource` en el PRIMER evento `done`, pero el servidor emite uno por fase en `source=both`. La fase RU arrancaba e inmediatamente se cancelaba. Fix: el servidor marca cada `done` con `final: true|false`; el cliente cierra solo cuando `final !== false`. Retrocompatible — los productores de fase única sin `final` siguen cerrando como antes. **547 → 558** unit + acceptance (+11 nuevos). Detalles completos en [`CHANGELOG.md`](CHANGELOG.md).

---

## [1.29.1] — 2026-05-14

**Guía detallada del usuario para configurar los 5 portales RU en el help-bundle §5, en las 8 locales.**

Nueva subsección "Configurar los portales rusos — guía detallada" dentro de §5 (Portals & sources): tabla inventario de 5 fuentes con auth y restricciones geográficas, paso a paso para localizar y editar `portals.yml`, ejemplo YAML completo de las 5 fuentes, colisión con la lista negativa con corrección, cómo deshabilitar una fuente, cómo verificar vía 🌐 Scan + log SSE. §17 (shipped en v1.29.0) cubre el flujo del desarrollador; §5 v1.29.1 cubre el flujo del usuario final. **540 → 547** unit + acceptance (+7 nuevos). Detalles completos en [`CHANGELOG.md`](CHANGELOG.md).

---

## [1.29.0] — 2026-05-14

**Scanner de portales rusos pasa de 2 a 5 fuentes; registry + dropdown dinámico; nueva sección §17 "Cómo añadir un nuevo portal".**

- **3 nuevos adaptadores RU:** `Trudvsem` (API open-data del gobierno, sin auth ni geo-gate), `GetMatch` y `GeekJob` (HTML scrape con parser defensivo — `[]` si no parsea, nunca throw en 200 sano).
- **Source registry** en `server/lib/sources/registry.mjs` — única fuente de verdad consumida por dispatcher + endpoint + dropdown. Pre-v1.29 el listado de fuentes vivía hardcoded en TRES lugares.
- **Nuevo endpoint** `GET /api/scan/sources` con `Cache-Control: max-age=60` — el SPA reconstruye el dropdown del filtro de fuente al cargar `#/scan`.
- **Help-bundle §17 nueva** en las 8 locales: «Cómo añadir un nuevo portal» (plantilla de adaptador, entry del registry, dispatcher, test mockeado, `portals.yml`).
- **`russian_portals.sources` por defecto** cambia de `["hh", "habr"]` a las 5 fuentes; si tu `portals.yml` ya lista `sources:` explícitamente, debes añadir las 3 nuevas a mano.
- Tests: **520 → 540** (+20). Detalles completos en [`CHANGELOG.md`](CHANGELOG.md).

---

## [1.28.1] — 2026-05-14

**Hot-fix: router 404 con hashes que llevan `?query`. Fila HH_USER_AGENT eliminada de health.**

Antes de v1.28.1 `Router.go('/evaluate?url=…')` producía un hash cuyo primer `split('/')` era el literal `"evaluate?url=…"`, que nunca coincidía con una ruta registrada → `__not_found__` (404). Fix de una línea: `hash.split('?')[0]` antes del split del nombre. Cubre dos clicks reportados: `#/pipeline → ▶` y "App settings → Modes". La fila opcional `HH_USER_AGENT` se elimina de `/api/health` (la pista 403-fuera-de-Rusia sigue en help-bundle §16 y se emite en stderr al escanear). **515 → 520** unit + acceptance (+ 5 nuevos). Detalles completos en [`CHANGELOG.md`](CHANGELOG.md).

---

## [1.28.0] — 2026-05-14

**Alineación de docs + nuevo control `--max-retries N` en `#/batch`.** Cierra las dos issues abiertas levantadas por `qa/QA-PROMPT-docs-vs-app.md`.

- **Issue #2** — `#/batch` ahora expone un campo numérico "Max retries" (1–10) que sólo se habilita cuando "Retry failed" está activado. El servidor parsea + valida 1≤N≤10 (los valores fuera de rango se descartan silenciosamente) y omite `--max-retries` sin `--retry-failed`. 7 casos de prueba en `tests/batch-max-retries.test.mjs`. 2 claves i18n nuevas × 8 locales.
- **Issue #1** — la lista de CLIs de IA en los 8 help-bundles y 8 READMEs se alinea con el canon de career-ops.org/docs (Claude Code · Codex · OpenCode · Qwen CLI), con una frase localizada: *«otras CLIs compatibles con Claude también funcionan vía la misma superficie de slash-comandos»*. El bullet "Multi-CLI" del README sobre los archivos shim de web-ui se conserva intacto (describe otra superficie). 2 nuevos canarios en `tests/canonical-docs-coverage.test.mjs`.
- **506 → 515** unit + acceptance (+ 9 nuevos). Playwright 32/32 sin cambios. Detalles completos en [`CHANGELOG.md`](CHANGELOG.md).

---

## [1.27.0] — 2026-05-14

**Pulido cosmético + a11y: deduplicar la entrada de barra lateral `#/dashboard`.**

En la barra lateral, el logo de marca (`<a class="logo" href="#/dashboard">`) y el primer ítem de navegación apuntaban a la misma ruta. Los lectores de pantalla anunciaban «Dashboard» dos veces y los usuarios de teclado tenían un tab-stop redundante. El bloque de marca ahora es un `<div class="logo">` plano; el ítem de navegación sigue siendo el único enlace a `#/dashboard`. **506 / 506** unit + **32 / 32** Playwright — sin cambios. Detalles completos en [`CHANGELOG.md`](CHANGELOG.md).

---

## [1.26.1] — 2026-05-14

**Hot-fix WCAG 2.5.5 — altura mínima 44 px de `.btn` restaurada.**

v1.26.0 perdió la declaración `min-height: 44px` en `.btn`; los botones del header renderizaban a 39-41 px (violación WCAG 2.5.5). v1.26.1 restaura el suelo de 44 px + `flex-shrink: 0` + `line-height: 1.2`. **502 → 506** unit, 32/32 Playwright sin cambios. Detalle en [`CHANGELOG.md`](CHANGELOG.md).

---

## [1.26.0] — 2026-05-14

**Pirámide de tests + cobertura ≥ 93 % línea.**

Adopta la estructura de 4 niveles (unit → functional → acceptance → e2e) según el backlog de v1.25. Añade 22 tests nuevos cubriendo los mayores gaps de cobertura de v1.25 (jds.mjs 61.64 % → 100 %, ramas de rechazo en auto-pipeline). Introduce el directorio `tests/acceptance/` para tests de jornada de usuario multi-endpoint. **480 → 502** unit + acceptance, 32/32 Playwright sin cambios. Detalle completo en [`CHANGELOG.md`](CHANGELOG.md) y [`docs/architecture/TESTING.md`](docs/architecture/TESTING.md).

---

## [1.25.0] — 2026-05-14

**Cortocircuito manual del auto-pipeline + ajuste cosmético del dashboard + nivelación de paridad del CHANGELOG.** Cierra G-014 (el auto-pipeline ignoraba `mode: 'manual'`), G-012 (deriva de paridad del CHANGELOG — 6 *locales* iban 2 versiones por detrás) y la duplicación cosmética del glifo `✨ ✨` en el dashboard. G-003 (renombrado de `README.cn.md`) ya estaba cerrado de facto — el repositorio solo contiene `README.zh-CN.md`. G-005 (realineamiento del bloque de informe A-G → A-F) requiere un *commit* coordinado en el proyecto padre y queda diferido.

### 🛡️ G-014 — Cortocircuito de `mode: 'manual'` en el auto-pipeline

- **`fix(auto-pipeline): G-014 — honour mode:'manual' short-circuit`** ([`server/lib/routes/auto-pipeline.mjs:158-195`](server/lib/routes/auto-pipeline.mjs#L158-L195)) — antes de v1.25 el endpoint siempre llamaba a un LLM. Pasar `mode: 'manual'` (replicando `/api/evaluate` desde v1.10.2) era ignorado de forma silenciosa y la petición quedaba colgada de 1 a 3 minutos contra Anthropic. Ahora el manejador:
  - Acepta `mode` Y `evalMode` para retrocompatibilidad. Cualquiera de los dos con valor `'manual'` dispara el cortocircuito.
  - Emite las 5 etapas SSE con `status: 'done'` / `status: 'skipped'`. Sin *fetch*. Sin llamada al LLM. Sin los 0,05 $ por petición.
  - El *payload* `done` lleva `{ mode: 'manual', prompt: <buildEvaluationPrompt scaffold>, message }` — la SPA puede renderizarlo como la actual tarjeta de *prompt* manual de `/api/evaluate`.
- **Cierra un riesgo de DoS** en `HOST=0.0.0.0`: anteriormente, incluso con `llmRateLimit` limitando a 10 req/60 s/IP, 10 atacantes × 10 peticiones = 50 $/min en consumo de Anthropic. El cortocircuito actúa antes de que el decremento del limitador de tasa cuente como llamada real.
- **Pruebas** — [`tests/auto-pipeline-manual-mode.test.mjs`](tests/auto-pipeline-manual-mode.test.mjs): 3 tests confirman (1) que `mode: 'manual'` responde en menos de 2 s con las 5 claves de etapa, (2) que incluso con `ANTHROPIC_API_KEY` configurado el cortocircuito sigue activándose (el síntoma original), (3) que los llamadores antiguos con `evalMode: 'manual'` continúan funcionando.

### 📝 G-012 — Nivelación de paridad del CHANGELOG (6 *locales* × 2 versiones ausentes)

- **`docs(changelog): backfill v1.23.0, v1.24.0, v1.24.1, v1.25.0 in 6 lagging locales`** — antes de v1.25 solo EN tenía v1.23-v1.24; RU iba 1 versión por detrás y los otros 6 iban 2 versiones por detrás. v1.25 despliega agentes de traducción en paralelo (replicando el patrón de v1.23) para incorporar las cuatro entradas en `CHANGELOG.{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md`. RU recibe v1.24.0 + v1.24.1 + v1.25.0 (ya tenía v1.23.0 del ciclo v1.23).
- **`feat(ci): scripts/check-changelog-parity.mjs gate`** — falla la *build* si la entrada más reciente de cualquier *locale* del CHANGELOG es más antigua que la canónica en EN. Conectado a `npm run test:ci`. La deriva preexistente de G-012 se habría detectado a sí misma en el momento mismo de cruzar el umbral de EN.

### ✨ Cosmético — deduplicación del doble glifo del dashboard

- **`fix(dashboard): dedup ✨ glyph in auto-pipeline button label`** ([`public/js/lib/i18n-dict.js:219`](public/js/lib/i18n-dict.js#L219)) — `dash.autoPipeline` llevaba un `✨` inicial en la cadena de cada *locale* Y `public/js/views/dashboard.js:58` anteponía otro `✨` en la vista. Resultado: el botón se renderizaba como `✨ ✨ Auto-pipeline …`. v1.25 retira el glifo inicial de la entrada DICT de cada *locale*; el prefijo de la vista pasa a ser la única fuente. La misma pasada de auditoría barrió el resto del *bundle* i18n — no se hallaron otros patrones de doble glifo.

### 🚫 Diferido a una versión futura

- **G-005 — Realineamiento del bloque de informe A-G → A-F por canónico career-ops.org/docs** — requiere un *commit* coordinado en el proyecto padre `santifer/career-ops` (reescribir `modes/oferta.md` para emitir A=Role, B=CV-match, C=Strategy, D=Comp, E=Personalization, F=STAR — eliminando C-Risks/G-Legitimacy como bloques separados). v1.25.0 entrega el lado web-ui listo para el nuevo esquema (`reports.js` acepta letras de bloque arbitrarias desde v1.13). Se rastrea para la próxima ventana de versión en que padre e hijo puedan aterrizar juntos.
- **G-003 — Renombrado de `README.cn.md` → `README.zh-CN.md`** — verificado durante la preparación de v1.25: el repositorio ya contiene `README.zh-CN.md` (no hay ningún `README.cn.md` huérfano bajo el *worktree*). El hallazgo de G-003 estaba obsoleto.

### 🧪 Pruebas

- **477 → 480** *unit* (+3 de PR-B `auto-pipeline-manual-mode.test.mjs`).
- 32/32 Playwright sin cambios.
- `npm run test:ci` ejecuta ahora `npm test` + `check-no-also-leftovers.mjs` + `check-changelog-parity.mjs`.

### Verificación

```bash
$ npm run test:ci
# 480 / 480
# ✓ no .also( leftovers in views/
# ✓ CHANGELOG parity: all 8 locales at v1.25.0

# G-014 — el modo manual responde en < 2 s incluso con ANTHROPIC_API_KEY configurado:
$ ANTHROPIC_API_KEY=sk-ant-test PORT=4317 npm start &
$ sleep 3
$ time curl -sS -X POST -H 'Content-Type: application/json' \
    -d '{"url":"https://job-boards.greenhouse.io/anthropic/jobs/x","mode":"manual"}' \
    http://127.0.0.1:4317/api/auto-pipeline | head -20
# real  0m0.1xx s  (antes 1-3 min)
# event: start … event: step (×5) … event: done {"mode":"manual","prompt":"…"}

# G-012 — cada CHANGELOG localizado incluye la entrada v1.25.0:
$ grep -c '^## \[1.25.0\]' CHANGELOG*.md
# 8 ficheros, cada uno → 1

# Cosmético — glifo del dashboard:
$ grep "dash.autoPipeline" public/js/lib/i18n-dict.js
# Ningún ✨ inicial en ningún valor de locale (la vista aporta el único glifo)
```

### Cambios incompatibles

Ninguno. `mode: 'manual'` es opcional; los llamadores antiguos con `evalMode: 'manual'` continúan funcionando sin cambios.

### Fuera de alcance (v1.26+)

| Ítem | Notas |
|---|---|
| G-005 — Realineamiento A-F del bloque de informe | Requiere un *commit* coordinado del padre (`santifer/career-ops` reescribe `modes/oferta.md`). |
| Ejecución en vivo de los sub-tests **visuales** del escenario QA 31 | Requieren un agente con navegador (Claude Cowork). Cubierto parcialmente por el *smoke* de Playwright. |
| Objetivo de 400 LOC en `i18n-dict.js` | *Fixture* de traducción — exento por política. Dividirlo añadiría peticiones HTTP sin un *bundler*. |

---

## [1.24.1] — 2026-05-14

**Parche urgente: caída de `#/config` en los 8 *locales* (G-015).**

### 🚑 *Hot-fix* crítico

- **`fix(config): G-015 — replace removed Element.prototype.also call in config.js`** ([`public/js/views/config.js:371`](public/js/views/config.js#L371)) — N-2 de v1.22.0 retiró el *monkey-patch* global `Element.prototype.also` y migró `cv.js` a un patrón de instrucciones libres, pero **se olvidó de `config.js`**. Resultado: `#/config` se caía en la primera invocación en cada *locale* con `c(...).also is not a function`. v1.24.1 aplica el mismo patrón de migración de `cv.js:188-201` — extraer el árbol a una `const root = c(...)`, ejecutar el bloque de activación por separado y luego `return root;`.

### 🛡️ Verja de CI

- **`feat(ci): scripts/check-no-also-leftovers.mjs sweep`** — recorre cada archivo bajo `public/js/views/` y falla la *build* ante cualquier llamada `.also(` (se permiten las referencias en comentarios). Conectado al nuevo *script* `npm run test:ci`. Una futura reversión de la eliminación del *monkey-patch* no podrá reintroducir la misma regresión en silencio.

### 🧪 Pruebas

- **`test: tests/config-view-syntax.test.mjs`** — tres guardas:
  - parsea `config.js` vía `node:vm.Script` (detecta regresiones a nivel de sintaxis sin necesidad de Playwright)
  - comprueba que no sobrevive ningún `.also(` fuera de comentarios
  - comprueba que están presentes los anclajes de migración `const root = c(...)` / `return root;`
- **474 → 477** *unit* (+3) + 32/32 Playwright sin cambios.

### Verificación

```bash
$ npm run test:ci
# 477 / 477
# ✓ no .also( leftovers in views/

# Smoke en navegador:
$ open http://127.0.0.1:4317/#/config
# → se renderiza con normalidad, sin tarjeta "is not a function". Lo mismo en cada locale.
```

### Fuera de alcance (diferido a v1.25)

- G-014, G-012, G-005, G-003 — ver la entrada v1.25.0 más arriba para el lote.

---

## [1.24.0] — 2026-05-14

**Renovación del *help-bundle* en profundidad de contenidos + ejecución en vivo del escenario QA 31 + CHANGELOG RU de cabo a rabo.** Cierra los dos ítems que la tabla "Fuera de alcance" de v1.23.0 difirió a v1.24: la renovación completa en profundidad de contenidos de los 8 *help bundles* desde las 5 URL canónicas de career-ops.org/docs (era solo cobertura de URL desde v1.11.x) y la ejecución en vivo del escenario QA 31 contra un servidor activo (era "requiere agente con navegador + credenciales LLM" — resultó que 6 de 6 sub-tests son alcanzables vía curl + grep; solo los sub-tests visuales necesitan navegador).

### 📖 Renovación en profundidad de contenidos del *help-bundle*

- **`docs(help): refresh en.md from 5 canonical career-ops.org/docs URLs`** ([`docs/help/en.md`](docs/help/en.md)) — antes de v1.24 el *bundle* EN tenía 1113 líneas y enumeraba las 5 URL canónicas en el *front-matter* pero no las desarrollaba en el cuerpo. v1.24 obtiene las 5 URL vía WebFetch y profundiza las secciones H2 correspondientes:
  - **About career-ops (front-matter)** — añadidos los principios (soberanía de datos, agnosticismo de IA, control humano), bloque "What career-ops is NOT", inventario de conceptos ampliado de 6 a 10 filas (añadidos Proof points, JD store, Interview-prep, Batch additions).
  - **§5 Portals** — añadido el *bootstrap* canónico `cp templates/portals.example.yml portals.yml`, aclarados los campos obligatorios frente a los opcionales por cada entrada `tracked_companies`.
  - **§7 Scan** — añadida la nota "no se consumen tokens de IA" para la Opción A, lista de órdenes de seguimiento (`apply` / `contacto` / `deep` / `tracker`).
  - **§14 Apply checklist** — dividida en modo SPA checklist frente a Manual-vs-Playwright-assisted frente al flujo CLI completo (los 8 pasos numerados canónicos desde `/career-ops apply <company>` hasta `Submitted.` con transición automática `Evaluated → Applied`); la subsección *batch evaluate* tiene ahora tabla de esquema TSV + las 4 banderas documentadas + `merge-tracker.mjs --dry-run`; la subsección *Playwright Setup* enumera órdenes de instalación, registro MCP, alternativa `.claude/settings.local.json`, nota *headless-by-default*.
- **Paridad de 16 secciones H2 preservada** (el test CI `help-ui.test.mjs::section-parity` exige exactamente 16 secciones H2 en los 8 *locales*).
- **Cada una de las 5 URL canónicas aparece ≥ 2 veces** en el *bundle* (lo impone el test CI `canonical-docs-coverage.test.mjs`). Recuento por URL tras v1.24: `what-is-career-ops` × 4, `scan-job-portals` × 5, `apply-for-a-job` × 3, `batch-evaluate-offers` × 5, `set-up-playwright` × 3.
- **`docs(help): translate the v1.24 deepening to 7 non-EN locales`** — 7 agentes de traducción en paralelo. Cada *locale* destino (es / pt-BR / ko-KR / ja / ru / zh-CN / zh-TW) recibe un *bundle* renovado que refleja la estructura EN sección por sección, preserva *verbatim* los bloques de código / URL / rutas de fichero / etiquetas de botón (📁 Upload CV / 🌐 Scan now / ▶ Evaluate / 📄 Generate PDF / 💾 Save) y las abreviaturas inglesas (CSP, SSRF, TOCTOU, WCAG, ATS, JD, SSE, REST, API), y traduce la profundización a un estilo técnico nativo de calidad publicable en el idioma destino.

### 🧪 Escenario QA 31 — ejecución en vivo (6/6 PASS)

- **`docs(qa): append last-verified live-execution log to qa/claude-cowork-browser-test-prompt.md`** — antes de v1.24 el escenario 31 estaba documentado pero nunca se había ejecutado contra un servidor real (diferido como "requiere agente con navegador + credenciales LLM"). v1.24 ejecutó los 6 sub-tests contra `http://127.0.0.1:4317`:

  | Sub | Descripción | Estado |
  |---|---|---|
  | 31.1 | Umbrales de puntuación en los *help bundles* | ✅ PASS (4.5 × 3, 4.0 × 9, 3.5 × 6 menciones en `docs/help/en.md`) |
  | 31.2 | Endpoints del flujo de *scan* | ✅ PASS (`/api/stream/scan-{en,ru}` + `/api/scan-ru/config` → 404; `/api/scan/regional/config` → 200) |
  | 31.3 | Checklist de `/api/apply-helper` | ✅ PASS (el cuerpo contiene `career-ops apply` + aviso `auto-submit`) |
  | 31.4 | Endpoint `/api/batch` | ✅ PASS (claves `[exists, runnerExists, raw, rows, additions]`) |
  | 31.5 | Disponibilidad de Playwright | ✅ PASS (`/api/health` reporta `Playwright (parent node_modules) ok: true, value: installed`) |
  | 31.6 | Cobertura de URL en *help-bundles* (5 URL × 8 *locales*) | ✅ PASS (**40 / 40 ✓**) |

  Los sub-tests exclusivamente visuales (requieren navegador) se marcan aparte en el *prompt* QA — siguen siendo ejecutables vía Claude Cowork o `npm run test:e2e:browser`.

### 🌐 CHANGELOG RU de cabo a rabo (seguimiento de M-9)

- **`docs(translate): CHANGELOG.ru.md retry agent — full body translation`** ([`CHANGELOG.ru.md`](CHANGELOG.ru.md)) — la versión v1.23.0 se publicó con el agente de reintento del CHANGELOG RU aún en curso (había caído con un error de *socket* y fue redespachado). v1.24 recoge la traducción completa de 1542 líneas del agente: cada entrada de v1.23.0 → v1.6.0 tiene un cuerpo en ruso de calidad publicable, sin más parches provisionales con cuerpo en EN. La disciplina estilística iguala la renovación de calidad del README en v1.22.0: "функциональность" / "возможности" / "поведение" reemplazan al torpe "функционал"; "через" / "с помощью" reemplazan "при помощи"; voz activa frente a pasiva; "эндпоинт", "лимит запросов", "состояние гонки", "санитайзинг" como términos canónicos; abreviaturas inglesas (TOCTOU, CSP, SSRF, WCAG, ATS, JD, SSE, REST, API) preservadas.

### 🧪 Pruebas

- **474 / 474** *unit* + 20 / 20 *smoke* E2E + 32 / 32 Playwright. Cero deltas en pruebas de comportamiento; cada aserción CI del *help-bundle* (16 secciones H2 × 8 *locales*, 5 URL × ≥ 2 menciones, suelo de contenido) sigue en verde.

### Verificación

```bash
$ npm test                            # 474 / 474

# Profundización del help-bundle:
$ wc -l docs/help/en.md
# ~1270 líneas (antes 1113 — profundizado, no inflado)

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

# Escenario 31.6 — 40/40 cobertura de URL:
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

### Cambios incompatibles

Ninguno.

### Fuera de alcance (v1.25+)

| Ítem | Notas |
|---|---|
| Ejecución en vivo de los sub-tests **visuales** del escenario 31 | Requieren un agente con navegador (Claude Cowork o `npm run test:e2e:browser`). Fuera de alcance para la ejecución solo con curl; cubierto por el *smoke* de Playwright existente. |
| Traducción del cuerpo del CHANGELOG RU **de las entradas más antiguas** (v1.5.x y anteriores) | El agente de reintento solo cubrió desde v1.6.0 en adelante. Las entradas pre-v1.6 (`v1.5.x`, etc.) — si alguna vez existieron — permanecen como contenido preexistente. |
| Regresión visual sobre capturas del dashboard tras futuros cambios de la SPA | `scripts/capture-dashboard-screenshots.mjs` regenera los PNG por *locale*; actualmente no hay *diff* automatizado. |

---

## [1.23.0] — 2026-05-14

**División de i18n + arreglo CI del *banner* de conexión + capturas del dashboard localizadas + cada parche provisional del *backlog* cerrado.** Entrega los tres ítems que la tabla "Fuera de alcance" de v1.22.0 marcó para v1.23 (cuerpos del CHANGELOG por *locale* M-9, división LOC de `i18n.js` N-1, auditoría de contenido del *help-bundle*) más un parche urgente para el test *smoke* E2E que dejó en rojo el CI de la rama principal tras v1.22.0.

### 🚑 *Hot-fix* de CI — recuperación del *banner* de conexión

- **`fix(client): reset health-poll cadence + visibilitychange eager re-check`** ([`public/js/api.js:21-91`](public/js/api.js#L21-L91)) — el *backoff* exponencial M-6 de v1.22.0 era correcto (3 s → 6 s → 12 s → tope de 15 s, frente al tope original de 60 s) pero el `setTimeout` en curso quedaba anclado al *delay* fijado previamente. Un servidor caído en t=0,1 con la primera *ping* en t=3 fallaba, duplicaba el *delay* a 6 y la siguiente sonda de recuperación no se disparaba hasta t=9. El *smoke* E2E "Flujo 2a: el *banner* de conexión aparece al caer el servidor y se oculta al recuperarse" esperaba solo 4 s y se ponía en rojo en `main`.

    v1.23.0 remodela el bucle de *polling*:

    - Se rastrea `_healthHandle` para que `setConnectionState(lost=true)` pueda hacer `clearTimeout` y reprogramar con `_HEALTH_MIN`. La primera sonda de recuperación se dispara ahora dentro de los 3 s desde la caída, independientemente del *delay* que estuviera encolado.
    - `_HEALTH_MAX` rebajado de 60 s a 15 s. Una pestaña en segundo plano contra un servidor caído sigue recuperándose dentro de un ciclo de *polling* cuando el usuario vuelve; el ahorro de ancho de banda se mantiene sustancial.
    - `document.addEventListener('visibilitychange')` revuelve a sondear ansiosamente cuando la pestaña recupera el foco y `connectionLost === true` — un Cmd-Tab de vuelta no espera al siguiente *tick* del *backoff*.

### 🧹 N-1 — División de `i18n.js` (por encima del objetivo de 400 LOC)

- **`refactor(client): split DICT into i18n-dict.js (data) + i18n.js (logic)`** — antes de v1.23 `public/js/lib/i18n.js` tenía 639 LOC. El grueso (líneas 23-586) era la tabla de traducción `DICT` — datos estructurados puros. v1.23.0 extrae eso a [`public/js/lib/i18n-dict.js`](public/js/lib/i18n-dict.js) (578 LOC, exento de la regla de LOC según CLAUDE.md "Exempt from these limits: generated files, migrations, test fixtures, lock files, vendored code" — las tablas de traducción califican como *fixtures*), dejando [`public/js/lib/i18n.js`](public/js/lib/i18n.js) en 86 LOC de pura lógica de módulo (muy por debajo del objetivo de 400 LOC).
- **Contrato del cargador:** `i18n-dict.js` rellena `window.__I18N_DICT = { … }`, y luego `i18n.js` lo lee dentro de la IIFE existente. [`public/index.html`](public/index.html) los carga en orden — `i18n-dict.js` antes que `i18n.js` — de modo que la IIFE ve un DICT completamente poblado en el momento de su construcción. *Fallback* de DICT ausente: cada llamada a `t()` devuelve su *fallback* en línea o la clave desnuda, lo que aflora una mala configuración de forma ruidosa sin tumbar la SPA.
- **Cableado de pruebas actualizado:** [`tests/i18n-coverage.test.mjs`](tests/i18n-coverage.test.mjs), [`tests/help-ui.test.mjs`](tests/help-ui.test.mjs), [`tests/canonical-docs-coverage.test.mjs`](tests/canonical-docs-coverage.test.mjs) ejecutan ahora ambos archivos a través del contexto VM de prueba (o concatenan su fuente para el barrido regex), preservando cada aserción existente.

### 🌐 M-9 — Traducciones del cuerpo del CHANGELOG por *locale*

- **`docs(translate): 7 non-EN CHANGELOG files end-to-end`** — antes de v1.23 `CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md` llevaban notas provisionales con cuerpo en EN para cada entrada desde v1.13.0 en adelante, con un pie remitiendo al lector al canónico EN. v1.23.0 despliega 7 agentes de traducción en paralelo — uno por *locale* — que reescriben cada cuerpo a un estilo técnico de calidad publicable en el idioma destino. Notas provisionales retiradas. Bloques de código, rutas de fichero, URL, cadenas con estilo de *commit-message* (`fix(security): B-1 — …`), variables de entorno y etiquetas de enlace preservadas *verbatim* en todos los *locales*.

### 🖼️ Capturas del dashboard localizadas en cada README

- **`docs(readme): wire each locale README at its locale-specific PNG`** — antes de v1.23 solo `README.pt-BR.md` referenciaba `dashboard-pt-BR.png`; los otros 6 README no ingleses seguían apuntando a `dashboard-en.png`. Las capturas (ya tomadas en el ciclo de v1.22.0 por [`scripts/capture-dashboard-screenshots.mjs`](scripts/capture-dashboard-screenshots.mjs)) estaban presentes en `images/` pero sin uso. v1.23.0 actualiza la línea 14 de cada `README.{es,ja,ko-KR,ru,zh-CN,zh-TW}.md` a su propio `dashboard-<locale>.png`.

### 🧪 Pruebas

- Los mismos 474 / 474 *unit* + 32 / 32 Playwright que v1.22.0. **El *smoke* E2E pasa ahora a 20 / 20** (era 19 / 1 fallo en `main` tras v1.22.0 por la regresión de recuperación del *banner*; la reprogramación de v1.23.0 lo cierra).
- Tres pruebas existentes recableadas para acomodar la división de i18n. Cero archivos de prueba nuevos; cero aserciones eliminadas.

### Verificación

```bash
$ npm test
# 474 / 474

$ npm run test:e2e
# passed: 20    failed: 0    (era 19/1 en main v1.22.0)

$ wc -l public/js/lib/i18n.js public/js/lib/i18n-dict.js
#       86 public/js/lib/i18n.js          ← lógica, bajo el objetivo
#      578 public/js/lib/i18n-dict.js     ← fixture de datos, exento

$ grep -h 'dashboard-' README*.md | sed -E 's/.*(dashboard-[^)]+).*/\1/' | sort -u
# dashboard-en.png    (solo README.md)
# dashboard-es.png    dashboard-ja.png
# dashboard-ko-KR.png dashboard-pt-BR.png
# dashboard-ru.png    dashboard-zh-CN.png  dashboard-zh-TW.png

# Cordura de la traducción del CHANGELOG: cada archivo de locale > 200 líneas de contenido nativo
$ wc -l CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md | grep -v total
```

### Cambios incompatibles

Ninguno. `public/index.html` carga ahora dos *scripts* donde antes cargaba uno — quien sirva la SPA desde una CDN debe incorporar `i18n-dict.js`; el orden de carga del *script* lo impone el orden de las etiquetas `<script src>` en `index.html`. El *fallback* en tiempo de ejecución (DICT vacío → `t()` devuelve el *fallback* EN en línea) previene caídas duras cuando el archivo nuevo falta.

### Fuera de alcance (v1.24+)

| Ítem | Notas |
|---|---|
| Renovación en profundidad del CONTENIDO del *help-bundle* desde career-ops.org/docs (frente a cobertura de URL) | Las 5 URL canónicas ya aparecen en cada *help-bundle* localizado desde v1.11.x y el escenario 31.6 del *prompt* QA verifica la cobertura. La renovación en profundidad del cuerpo del contenido es candidata a v1.24+. |
| Ejecución en vivo del escenario QA 31 contra un servidor activo | Requiere agente con navegador + credenciales LLM en vivo. Candidato a v1.24. |
| Barrido por componente del *touch-target* en los nuevos párrafos *hint* de la página de modos | M-1 de v1.22.0 añadió elementos `<p class="field-hint">` que aún no se han verificado contra la altura mínima WCAG 2.5.5 en los 8 *locales*. |

---

## [1.22.0] — 2026-05-14

**Limpieza del backlog M/L/N + alineación documental + pase de calidad en traducciones.** Todo el tramo medio-e-inferior de `v1.20.1-BACKLOG.md` se entrega en una sola versión: nueve ítems M, cinco ítems L, dos *nits*. Se suma una auditoría de alineación contra las cinco guías canónicas de [career-ops.org/docs](https://career-ops.org/docs), una actualización de los *system prompts* bajo `.claude/` y `.github/`, y un repaso de calidad de los README en los 7 *locales* no ingleses.

### 🛡️ Endurecimiento de seguridad (defensa en profundidad)

- **`fix(security): M-4 — stripDangerousMarkdown consciente de entidades`** ([`server/lib/security.mjs`](server/lib/security.mjs)) — la regex previa a v1.22 coincidía con `<script>`, `javascript:`, `on*=` como subcadenas literales. `&lt;script&gt;`, `java&#115;cript:` y `<img src="data:image/svg+xml,<svg onload=…>">` se colaban sin filtro. El saneamiento ahora decodifica entidades `&lt;`, `&gt;`, `&amp;`, `&quot;`, numéricas (`&#NN;`) y hexadecimales (`&#xHH;`) **antes** de ejecutar la regex de saneamiento. Validado por 11 pruebas en [`tests/cv-xss-bypasses.test.mjs`](tests/cv-xss-bypasses.test.mjs). La defensa real sigue siendo la canalización *escape-first* `UI.md` del lado cliente; esto endurece el fichero en reposo.

- **`fix(security): L-2 — bash --noprofile --norc en el ejecutor de lotes`** ([`server/lib/routes/batch.mjs:108`](server/lib/routes/batch.mjs#L108)) — `spawn('bash', [PATHS.batchRunner, ...])` heredaba el `~/.bashrc` del usuario. Un fichero rc hostil podía influir en la ejecución. Ahora `spawn('bash', ['--noprofile', '--norc', PATHS.batchRunner, ...])`.

### 🔒 Resiliencia

- **`fix(client): M-6 — *backoff* exponencial en el ping de salud`** ([`public/js/api.js:22-48`](public/js/api.js#L22-L48)) — el *poller* del estado desconectado lanzaba 28 800 *fetches* contra un servidor caído durante la noche. Ahora 3 s → 6 s → 12 s → 24 s → 60 s, con reinicio a 3 s en el primer 2xx de recuperación. La configuración es una cadena de `setTimeout` (no un `setInterval`), de modo que cada paso adopta el nuevo retardo.

- **`fix(client): M-5 — protección frente a localStorage del modo privado de Safari`** ([`public/js/lib/i18n.js:572-583`](public/js/lib/i18n.js#L572-L583)) — Safari en modo privado lanza `SecurityError` en cada `localStorage.getItem/setItem`. La IIFE de carga rompía el módulo i18n completo y dejaba el SPA mostrando claves en bruto. Se envolvieron ambas llamadas en try/catch con respaldo a `detect()` por el idioma del navegador.

- **`fix(server): M-2 — tope de tamaño en *fetches* salientes de vista previa (prueba + verificación)`** — el `safeGet` introducido en v1.21.0 ya transmitía por *chunks* y cortaba en `opts.maxBytes`. v1.22 añade una prueba explícita de regresión en [`tests/ssrf-redirect-rebind.test.mjs`](tests/ssrf-redirect-rebind.test.mjs) para fijar el contrato: 100 KB de origen + 4 KB de tope → respuesta ≤ 4 KB.

- **`fix(client): L-5 — limpiar setTimeout al cambiar de hash en scan.js`** ([`public/js/views/scan.js:6-22, :113-120`](public/js/views/scan.js#L6-L22)) — el temporizador de `refreshResults()` a los 300 ms tras *done* tenía fuga si el usuario salía de `#/scan` en esa ventana. El *handle* ahora se captura y se cancela en `__cancelActiveScanPoll`.

- **`fix(client): L-4 — combinador de líneas `data:` multilínea en SSE`** ([`public/js/lib/auto-pipeline.js:158-176`](public/js/lib/auto-pipeline.js#L158-L176)) — el *parser* SSE usaba `match()` (una sola línea). Según la especificación, un evento puede arrastrar varias líneas `data:` que el consumidor une con `\n`. El servidor envía hoy JSON en línea única, así que el código antiguo funcionaba — pero era frágil ante cualquier carga útil multilínea futura.

### ♿ Accesibilidad

- **`feat(a11y): M-3 — WCAG 1.4.1 pistas redundantes en píldoras de puntuación y banner de conexión`** ([`public/css/app.css:602-625, :812-822`](public/css/app.css#L602-L625)) — `score-high` / `score-mid` / `score-low` transmitían el estado solo por tono (rojo/ámbar/verde). Quien no percibe el tono se quedaba sin recurso. Cada nivel recibe ahora un glifo redundante vía `::before` (✓ / ◐ / ○). El banner de conexión incorpora un glifo `⚠` en el estado *offline*. Los puntos de renderizado no se tocan — endurecimiento puramente CSS.

- **`feat(a11y): M-1 — párrafos de pista en línea para cada campo de mode-page`** ([`public/js/views/mode-page.js`](public/js/views/mode-page.js), [`public/js/lib/i18n.js`](public/js/lib/i18n.js)) — v1.20.0 cableó `htmlFor → id` en cada campo de *mode-page* pero no arrastró el texto de pista en línea; sólo los recorridos del README describían la intención del campo. v1.22.0 incorpora 19 claves i18n de pista × 8 *locales* = **152 traducciones nuevas** y el constructor `field()` renderiza ahora un `<p id="…-hint">` con su cableado `aria-describedby` por campo. Los usuarios de lector de pantalla oyen la pista al enfocar el campo.

- **`fix(a11y): M-7 — protección contra null en el alias htmlFor de UI.el()`** ([`public/js/api.js:194-198`](public/js/api.js#L194-L198)) — `htmlFor: null` producía un literal `for="null"`. Espejo en una línea de la guarda `v != null && v !== false` de la rama de respaldo.

### 🧹 Calidad / portabilidad

- **`fix(server): L-1 — radix en parseInt en health.mjs + bin/start.sh + bin/setup.sh`** — `parseInt(process.versions.node)` sin radix dispara un aviso del *linter* y es frágil si Node llegara a publicar versiones hexadecimales. Se añadió `10` en todas partes.

- **`fix(server): L-3 — comprobación de punto de entrada segura en Windows`** ([`server/index.mjs:159-163`](server/index.mjs#L159-L163)) — `import.meta.url === \`file://${process.argv[1]}\`` maneja mal letras de unidad y barras invertidas en Windows. Sustituido por `fileURLToPath(import.meta.url) === path.resolve(process.argv[1])`.

- **`refactor(client): N-2 — eliminar el parche de Element.prototype.also`** ([`public/js/views/cv.js:188-201`](public/js/views/cv.js#L188-L201)) — contaminación global del prototipo DOM. Sustituido por una variable local con la raíz del árbol.

- **`test(canary): M-8 — prueba de regresión 404 para /api/scan-ru/config retirado`** ([`tests/scan-consolidated.test.mjs`](tests/scan-consolidated.test.mjs)) — v1.20.0 retiró el alias pero no dejó canario. Añadido en tres líneas como espejo de las pruebas de retirada de v1.18.

### 📚 Documentación + system prompts

- **`docs(architecture): refrescar OVERVIEW + DATA-FLOWS para la superficie de v1.21+`** — añadidos `safe-fetch.mjs` (GET con DNS fijado), `file-lock.mjs` (mutex por ruta), `rate-limit.mjs` (estrangulamiento del LLM) y `sanitizePathName` a OVERVIEW.md. DATA-FLOWS.md gana dos secciones nuevas: "*Outbound URL fetches (DNS-rebind-safe)*" y "*LLM endpoint rate-limiting*".

- **`docs(readme): refresco de la sección sobre el sobre de seguridad`** — la sección "Security notes" del README.md documenta ahora cada *helper* del sobre de seguridad de v1.21+ (sanitizePathName, safeGet, withFileLock, llmRateLimit, stripDangerousMarkdown consciente de entidades).

- **`docs(qa): escenario 31 — alineación con career-ops.org/docs`** ([`qa/claude-cowork-browser-test-prompt.md`](qa/claude-cowork-browser-test-prompt.md)) — seis nuevas subpruebas (31.1–31.6) que verifican que la UI coincide con el comportamiento descrito en las cinco guías canónicas de career-ops.org/docs: umbrales de puntuación, flujo de *scan* (un botón), flujo de aplicación (lista, no autoenvío), flujo de lotes (editor TSV), arranque de Playwright (fallo elegante) y cobertura del *help bundle* (5 URLs × 8 *locales*).

- **`docs(translate): refresco de calidad del README × 7 *locales* no ingleses`** — cada README no inglés reescrito a un estilo técnico de calidad editorial en su lengua nativa. Reemplazados los calcos torpes habituales; añadidas las menciones al sobre de seguridad v1.21/v1.22; *badges* de versión y de pruebas actualizados.

- **`docs(system): .claude/PROJECT-CONTEXT.md + .github/copilot-instructions.md`** — orientación en un único fichero para los agentes que se incorporan a una sesión. Resume CLAUDE.md, nombra los *helpers* de v1.21+ y enumera los tropiezos habituales.

- **`docs(bin): actualizar comentarios de start.sh / setup.sh / run_all.sh`** — "dos dependencias" → "tres dependencias" (express + js-yaml + multer); "298 tests" → "474+ tests"; radix de `parseInt` añadido.

### 🧪 Tests

- **461 → 474 *unit*** (+13) + 32/32 Playwright sin cambios.
- Ficheros nuevos: `cv-xss-bypasses.test.mjs` (M-4, 11 pruebas).
- Ampliados: `ssrf-redirect-rebind.test.mjs` (+1 para el tope de cuerpo M-2), `scan-consolidated.test.mjs` (+1 para el canario M-8 del alias).
- Cero *deltas* de comportamiento en suites existentes — cada *fix* es aditivo o queda cubierto por un canario nuevo.

### Verificación

```bash
npm test                          # 474 / 474
npm run test:e2e:browser          # 32 / 32

# Saneamiento XSS con entidades:
node -e "import('./server/lib/security.mjs').then(({stripDangerousMarkdown}) => console.log(stripDangerousMarkdown('&lt;script&gt;alert(1)&lt;/script&gt;')))"
# → '' (ningún <script> sobrevive)

# Backoff del health-ping (abre devtools, mata el servidor, observa el panel de red):
#   3 s → 6 s → 12 s → 24 s → 60 s, reinicio en el primer ping exitoso

# Glifo de la píldora de puntuación (abre #/reports en tema claro y oscuro):
#   .score-high muestra ✓ + puntuación numérica
#   .score-mid  muestra ◐ + puntuación numérica
#   .score-low  muestra ○ + puntuación numérica

# Pistas en mode-page (#/contacto, etc):
#   <input aria-describedby="mode-contacto-recipient-hint">  ← apunta a <p id="…">

# Alias retirado:
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4317/api/scan-ru/config
# → 404
```

### Cambios incompatibles

Ninguno. Cada *fix* es aditivo o preserva los contratos de los *endpoints* existentes.

### Fuera de alcance (v1.23+)

| Ítem | Notas |
|---|---|
| M-9 — traducción de los cuerpos del CHANGELOG por *locale* | Todas las entradas v1.13+ de `CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md` eran provisionales con cuerpo inglés. Candidato a traducción masiva cuando se ralentice la cadencia de versiones. |
| N-1 — `public/js/lib/i18n.js` por encima del objetivo de 400 LOC | Dividir por *locale* incrementa el coste HTTP sin un empaquetador. Se aplaza hasta que se decida el paso de *build*. |
| Refresco del contenido del *help bundle* desde career-ops.org/docs | Las cinco URLs canónicas ya aparecen en el *help bundle* de cada *locale* (desde v1.11.x). El escenario 31.6 del *prompt* QA verifica la cobertura. Refresco de profundidad es candidato a v1.23. |

---

## [1.21.0] — 2026-05-14

**Pulido de seguridad + concurrencia + accesibilidad procedente de dos pases independientes de revisión de código.** Siete hallazgos del documento [`docs/specs/V1.20.1-BACKLOG.md`](docs/specs/V1.20.1-BACKLOG.md) se entregan en una sola versión: un bloqueante (TOCTOU de DNS-rebind), seis errores de severidad alta (dispersión del saneamiento de *path traversal*, hueco de *rate-limit* en despliegues LAN, condición de carrera de escritura, agujero de cobertura i18n, `aria-describedby` huérfano, asociaciones de etiqueta ausentes). 34 pruebas nuevas; la línea base sube de 427 → 461 *unit* + 32/32 Playwright. Cada *fix* aterriza tras una prueba de regresión con nombre.

### 🛡️ Seguridad

- **`fix(security): B-1 — cerrar el TOCTOU de DNS-rebind con safe-fetch.mjs`** ([`server/lib/safe-fetch.mjs`](server/lib/safe-fetch.mjs)) — el patrón previo hacía un `dnsLookup` explícito para validar y luego dejaba que `fetch()` resolviera por su cuenta. Un atacante de *DNS rebind* con TTL=0 podía devolver una IP pública en la búsqueda 1 y `127.0.0.1` / `169.254.169.254` / una dirección LAN en la búsqueda 2, sorteando `isPrivateOrLoopbackHost`. El nuevo `safeGet` resuelve UNA vez, fija la conexión TCP a esa IP exacta vía node:http(s), y configura SNI/Host para que la validación del certificado siga apuntando al *hostname* original. Lo usan `/api/pipeline/preview` y `/api/auto-pipeline`. Fallo CERRADO ante un error de búsqueda (invierte el anterior `try { … } catch { /* fall through */ }`). Validado por 8 pruebas nuevas en [`tests/ssrf-redirect-rebind.test.mjs`](tests/ssrf-redirect-rebind.test.mjs).

- **`fix(security): H-4 — consolidar sanitizePathName a través de 10 rutas`** ([`server/lib/security.mjs`](server/lib/security.mjs)) — la regex `replace(/[^\w\-.]/g, '')` estaba duplicada a lo largo de `jds.mjs`, `content.mjs`, `reports.mjs`, `llm.mjs`, `runners.mjs` y conservaba los caracteres `.`, de modo que `..pdf`, `....md` y los nombres con punto inicial sobrevivían. Sólo `reports.mjs::sanitizeSlug` lo hacía bien. v1.21.0 eleva la versión correcta (`sanitizePathName`) a `security.mjs`, elimina 10 copias rotas y rechaza con 400 los resultados vacíos. Validado por 12 pruebas en [`tests/path-traversal.test.mjs`](tests/path-traversal.test.mjs).

- **`fix(security): H-5 — limitar la tasa en los *endpoints* LLM con bind público`** ([`server/lib/rate-limit.mjs`](server/lib/rate-limit.mjs)) — `/api/evaluate`, `/api/deep`, `/api/mode/:slug`, `/api/auto-pipeline` no tenían antes un *throttle* por IP. Los usuarios *loopback* no se ven afectados; los despliegues expuestos a LAN (`HOST=0.0.0.0`) reciben 10 req/min/IP con cabeceras `Retry-After` y `X-RateLimit-*` al rebosar. Configurable mediante `LLM_RATE_LIMIT="N/Ws"`. Defensa interina barata antes de la puerta de autenticación P-12 de v2.0. Validado por 6 pruebas en [`tests/rate-limit.test.mjs`](tests/rate-limit.test.mjs).

### 🔒 Concurrencia

- **`fix(data): H-6 — mutex por fichero en applications.md / pipeline.md`** ([`server/lib/file-lock.mjs`](server/lib/file-lock.mjs)) — un `POST /api/tracker` concurrente (o el *auto-pipeline* compitiendo contra un alta manual) leía `num=42` por ambos lados, escribía `num=43` por ambos lados y descartaba en silencio la fila más antigua. `withFileLock(path, fn)` serializa el ciclo leer-modificar-escribir por ruta; las rutas independientes siguen ejecutándose en paralelo. Cableado en `tracker.mjs`, `pipeline.mjs` (POST + DELETE) y en el paso *tracker* de `auto-pipeline.mjs`. Validado por 5 pruebas en [`tests/concurrent-tracker-write.test.mjs`](tests/concurrent-tracker-write.test.mjs), incluida una de integración con 20 POSTs concurrentes que comprueba que las filas 001..020 aterrizan en orden.

### ♿ Accesibilidad

- **`fix(a11y): H-1 — id="batch-tsv-hint" en el párrafo de pista de batch.js`** ([`public/js/views/batch.js`](public/js/views/batch.js)) — v1.20.0 añadió `aria-describedby="batch-tsv-hint"` al *textarea* TSV pero nunca dotó al `<p>` de pista de un `id` coincidente. Los lectores de pantalla no tenían nada que vocalizar. Corregido.

- **`fix(a11y): H-2 — htmlFor en las etiquetas batch-parallel / batch-min-score`** ([`public/js/views/batch.js`](public/js/views/batch.js)) — cuatro *inputs* de v1.20.0 recibieron *ids* nuevos pero sus etiquetas no estaban asociadas programáticamente. WCAG 3.3.2 queda ahora satisfecho.

- Nuevo canario de análisis estático en [`tests/a11y-form-wires.test.mjs`](tests/a11y-form-wires.test.mjs) — recorre cada fichero de vista y comprueba que cada IDREF de `aria-describedby` / `htmlFor` apunta a un `id:` hermano. Detecta regresiones tipo-errata en tiempo de CI.

### 🌐 i18n

- **`fix(i18n): H-3 — 13 claves de v1.20.0 caían en silencio al inglés en 7 *locales*`** ([`public/js/lib/i18n.js`](public/js/lib/i18n.js)) — `pipe.filter`, `pipe.count`, `pipe.preview*`, `pipe.openTab`, `pipe.evaluateAll*`, `eval.jdHint`, `batch.parallelAria`, `batch.minScoreAria`, además de `common.delete`, `config.group{Core,Runtime,Regional}`, `config.profileEmpty`, `config.viewProfile`, `scan.atsBadge`, `scan.regionalBadge` se referenciaban con `t('key', 'EN fallback')` pero nunca se añadieron a DICT. Los usuarios de lector de pantalla en ruso, japonés y chino oían `aria-label` en inglés — anulando directamente la conquista WCAG 3.3.2 que reclamaba v1.20.0. v1.21.0 añade las 19 claves × 8 *locales* (≈ 150 traducciones nuevas) y extiende [`tests/i18n-coverage.test.mjs`](tests/i18n-coverage.test.mjs) con un pase de análisis estático que escanea cada llamada `t('key', …)` en `public/js/**/*.js` y comprueba que cada clave existe en DICT. La deriva futura queda detectada en tiempo de CI.

### 🧪 Tests

- **427 → 461 *unit*** (+34) + 32/32 Playwright sin cambios.
- Ficheros nuevos: `ssrf-redirect-rebind`, `path-traversal`, `concurrent-tracker-write`, `rate-limit`, `a11y-form-wires`.
- `pipeline-preview.test.mjs` recableado desde el *mock* `globalThis.fetch` al nuevo punto de inyección `_setTransport` de `safe-fetch.mjs` — la ruta SSRF ya no pasa por *fetch*, así que el *mock* viejo era sorteado en silencio.

### Verificación

```bash
npm test                              # 461 / 461
npm run test:e2e:browser              # 32 / 32
node --test tests/ssrf-redirect-rebind.test.mjs tests/path-traversal.test.mjs \
  tests/concurrent-tracker-write.test.mjs tests/rate-limit.test.mjs \
  tests/a11y-form-wires.test.mjs      # 34 pruebas nuevas, todas verdes

# Path-traversal: cada :name al estilo traversal devuelve 400 / 404
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4317/api/jds/..pdf
# → 400

# Rate-limit con bind público:
HOST=0.0.0.0 LLM_RATE_LIMIT=3/60s npm start &
for i in 1 2 3 4; do
  curl -sS -o /dev/null -w '%{http_code} ' -X POST -H 'Content-Type: application/json' \
    -d '{"jd":"…"}' http://0.0.0.0:4317/api/evaluate
done
# → 200 200 200 429

# Escrituras concurrentes al tracker: 20 POSTs paralelos, 20 filas aterrizan:
node tests/concurrent-tracker-write.test.mjs
# 20 filas secuenciales 001..020

# Cordura del cableado aria:
grep -r 'aria-describedby' public/js/views/ | wc -l
# todas las búsquedas `id:` correspondientes resuelven (canario a11y-form-wires.test.mjs)
```

### Fuera de alcance (v1.22+)

| Ítem | Notas |
|---|---|
| Tope por *streaming* del cuerpo en `pipeline-preview` (M-2) | `await upstream.text()` lee el cuerpo entero antes del corte a 8 KB; un *stream* malicioso de 1 GB podría agotar la memoria. Lectura por *stream* con contador de bytes y *abort*. |
| WCAG 1.4.1 — estado sólo-color en `.connection-banner` y píldoras de puntuación (M-3) | El tono por sí solo señala el estado; añadir prefijo de icono (✓ / ◐ / ○) o sufijo de texto. |
| Sorteos de `stripDangerousMarkdown` vía entidades HTML (M-4) | `&lt;script&gt;`, `java&#115;cript:`, `<img src="data:image/svg+xml,<svg onload=…>">` sobreviven a la regex. La defensa en profundidad vía `UI.md` aguanta; documentar y fijar los sorteos en una pasada de pruebas. |
| Acceso a `localStorage` en modo privado de Safari sin try/catch (M-5) | `i18n.js:544/571` lanza → el SPA renderiza claves en bruto. Envolver en try/catch con `'en'` por defecto. |
| `setInterval(checkHealth, 3000)` *poll* sin *backoff* (M-6) | Exponencial 3s → 6s → 12s → tope 60s. |
| Falta de guarda para *null* en el alias `htmlFor` (M-7) | Defensa de una línea `if (v != null && v !== false)`. |
| Canario 404 para `/api/scan-ru/config` retirado (M-8) | Prueba de tres líneas siguiendo el precedente de v1.18. |
| Traducciones del cuerpo del CHANGELOG por *locale* (M-9) | Candidato a traducción masiva cuando se ralentice la cadencia de versiones. |
| Párrafos de pista en línea para cada campo de *mode-page* (M-1) | ~168 claves i18n × 8 *locales*; reservado como pulido. |
| Pequeñeces L-1 a L-5 | Radix de parseInt, bash --noprofile, fileURLToPath seguro en Windows, SSE multilínea, limpieza del temporizador de scan.js. |

---

## [1.20.0] — 2026-05-13

**Pulido de accesibilidad por componente + paridad de README no inglés + retirada del alias `/api/scan-ru/config`.** Cierra los cuatro ítems que la tabla "Fuera de alcance" de v1.19.0 marcó para v1.20.

### ♿ WCAG 2.5.5 / 2.5.8 — auditoría de objetivo táctil por componente

- **`a11y(touch-target): chip min-height 28 px + 8 px de gap (excepción 2.5.8 spaced-target)`** — `.chip` era 24 × ~50 px (la vertical caía a 24, por debajo del piso 24 px de 2.5.5 para controles agrupados); la excepción *spaced-target* de 2.5.8 exige o bien ≥ 24 × 24 px, o bien 24 px de separación. Se elevó `.chip` a `min-height: 28px; padding: 6px 12px;` y la fila contenedora `.chip-row` a `gap: 8px;` para que ambas condiciones se cumplan.
- **`a11y(touch-target): sidebar nav-item min-height 44 px`** — `.nav-item` sólo añadía `10px 14px` de relleno, con altura calculada ~36 px en la mayoría de *viewports*. Ahora `padding: 12px 14px; min-height: 44px; box-sizing: border-box;`. Coincide con el piso de `.btn`.
- **`a11y(touch-target): tab-btn min-height 44 px`** — mismo tratamiento para *Sortable Headers* / pestañas de categoría en Reports, Tracker y resultados de Scan.

### ♿ WCAG 1.3.1 / 3.3.2 — `aria-describedby` en pistas en línea

Cada control de formulario del SPA dispone ahora de un `id` estable, su `<label>` lo apunta vía `htmlFor`, y todo párrafo de pista en línea se asocia mediante `aria-describedby`. Cinco ficheros de vista han sido recableados:

- **`a11y(forms): config.js`** — `id` por clave + asociación de pista (`cfg-<key>` / `cfg-<key>-hint`).
- **`a11y(forms): evaluate.js`** — *textarea* `eval-jd` + párrafo `eval-jd-hint` que documenta el mínimo de 50 caracteres tras el saneamiento.
- **`a11y(forms): batch.js`** — `batch-tsv` / `batch-tsv-hint`, más `aria-label` en `batch-parallel`, `batch-min-score`, `batch-dry-run`, `batch-retry`.
- **`a11y(forms): pipeline.js`** — `pipe-filter` + `pipe-new-url` / `pipe-new-url-hint`.
- **`a11y(forms): mode-page.js`** — cada campo a lo largo de los 7 *modes* genéricos (`project`, `training`, `followup`, `batch-prompt`, `contacto`, `interview-prep`, `patterns`) obtiene *ids* `mode-<slug>-<name>` y etiquetas con `htmlFor`.

`UI.el()` aprende un alias `htmlFor` al estilo React para que el código de vista permanezca declarativo — establece el atributo subyacente `for` (que está reservado en JS como nombre de propiedad).

### 🌍 Paridad de README no inglés

- **`docs(readme): traducir 7 locales a la paridad de 585 líneas con el maestro EN`** — `README.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md` ocupaban entre 306 y 316 líneas (cubrían titulares pero saltaban los recorridos *marketing* y la mayor parte de la referencia de API). Los siete reflejan ahora la estructura EN extremo a extremo: About → instalación de un comando → Why? → Quick start (3 pasos numerados) → Requirements → tabla What you get → Scan → Architecture (árbol de directorios completo) → referencia de API (cada tabla de rutas) → Tests → Configuration → Security notes → Limitations → Contributing → recorrido 🌍 Getting Started de 5 pasos → License.

### 🧹 Alias `/api/scan-ru/config` retirado

- **`feat!(scan): remove /api/scan-ru/config legacy alias (sunset v1.20)`** — conservado como alias de una versión en v1.19 por compatibilidad hacia atrás. El canónico `/api/scan/regional/config` es ahora la única ruta. Eliminados: registro de ruta en `server/lib/routes/scan.mjs`, referencias en `README.md`, `docs/architecture/{OVERVIEW,SERVER,API}.md`. Las pruebas ya cubrían la ruta canónica — sin cambios de prueba.

### 🧪 Tests

- Misma suite que v1.19. **427 / 427** *unit* + 20/20 smoke + 23/23 *comprehensive* + 32/32 Playwright. Todo el cableado de accesibilidad es aditivo (más atributos `id` / `for` / `aria-describedby`) — sin cambios de comportamiento, sin *deltas* de prueba.

### Verificación

```bash
npm test                              # 427 / 427
npm run test:e2e:browser              # 32 / 32

# Objetivos táctiles — cada chip / nav-item / tab-btn ≥ 28 / 44 / 44 px:
#   Chrome DevTools → Computed → height/min-height en .chip, .nav-item, .tab-btn

# Etiquetas de formulario — cada input tiene una asociación label[for=…]:
#   document.querySelectorAll('input,textarea,select').forEach(el =>
#     console.assert(el.labels?.length || el.getAttribute('aria-label'), el))

# Alias desaparecido:
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4317/api/scan-ru/config
# → 404

# Canónico sigue funcionando:
curl -s http://127.0.0.1:4317/api/scan/regional/config | jq '.'
```

### Cambios incompatibles

- `DELETE /api/scan-ru/config` — eliminado. Usa `/api/scan/regional/config`. Se anunció el *sunset* en el CHANGELOG de v1.19.0 y en su *script* de verificación.

### Fuera de alcance (v1.21+)

| Ítem | Notas |
|---|---|
| Párrafos de pista en línea por cada campo de *mode-page* | Hoy sólo la asociación `<label for=…>` está en su sitio; el texto de pista visible por campo sigue en inglés en el SPA. Los recorridos del README documentan la intención del campo en cada *locale*, así que esto es pulido, no bloqueante. |
| Estado por sólo-color en `.connection-banner` y píldoras de puntuación del *dashboard* (WCAG 1.4.1) | El banner depende de rojo/ámbar/verde; necesita icono o sufijo de texto para quien no percibe el tono. |
| Traducción del cuerpo del CHANGELOG por *locale* | Provisionales con cuerpo inglés persisten en `CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md`. La traducción se hará cuando se ralentice la cadencia v1.x. |

---

## [1.19.0] — 2026-05-13

**Contraste WCAG 1.4.3 + unificación del *scan* (final) + retirada de HH_USER_AGENT de la UI.** Cierra la auditoría de contraste fuera de alcance de v1.18, finaliza la eliminación del *split* EN/RU iniciada en v1.18, y retira el control de configuración `HH_USER_AGENT` de la UI por indicación del usuario (un valor por defecto razonable ya viene incrustado en el servidor para IPs no rusas, que cubre a la mayoría).

### ♿ Pase de contraste WCAG 1.4.3

- **`a11y(contrast): introduce AA-passing *-text variants for accent tokens`** — tema claro: `--rausch-text: #b80f42` (6,59:1 sobre blanco, antes 3,52:1), `--kazan-text: #066507` (7,31:1, antes 4,53:1), `--darjeeling-text: #7a5800` (5,73:1 sobre fondo ámbar, antes 4,24:1), `--babu-text: #00665e` (6,09:1, antes 2,70:1). Tema oscuro: espejos aclarados (`#ff8aa0`, `#6ee7b7`, `#fcd34d`, `#5eead4`) alcanzan el mismo piso 4,5:1 sobre papel `#161a22`.
- Las clases de *badge* (`.badge-ok`, `.badge-warn`, `.badge-bad`, `.badge-info`) y las píldoras de puntuación (`.score-high`, `.score-mid`, `.score-low`) se enrutan ahora por las nuevas variantes `*-text` — cada combinación texto-sobre-fondo-tintado pasa AA. Los tokens de relleno de acento (`--rausch`, `--kazan`, etc.) no varían para bordes y contornos (que sólo necesitan 3:1 al ser componentes UI no textuales).

### 🧹 Unificación del *scan* (cierra el trabajo de v1.18)

- **`docs(scan): scrub remaining EN/RU split references across READMEs + help + architecture docs`** — ocho READMEs + ocho *help bundles* + tres documentos de arquitectura (API.md, SERVER.md, OVERVIEW.md, DATA-FLOWS.md) + un comentario en scan.js describen ahora un único método de *scan* consolidado. Los alias legacy `/api/stream/scan-{en,ru}` ya habían desaparecido en v1.18; v1.19 atrapa la documentación y la copia que todavía enmarcaba el *scan* como un proceso EN+RU en dos pasos.
- **`feat(scan): canonical /api/scan/regional/config endpoint`** — `/api/scan-ru/config` se conserva como alias delgado durante una versión por compatibilidad. La nueva ruta sigue la convención de nomenclatura por origen (`?source=regional`).

### 🛠️ HH_USER_AGENT retirado de la UI

- **`feat!(config): drop HH_USER_AGENT field from /#/config + KNOWN_KEYS`** — los usuarios avanzados pueden seguir fijando `HH_USER_AGENT` directamente en `career-ops/.env` (el servidor lo lee mediante `process.env.HH_USER_AGENT` en `server/lib/sources/hh.mjs` con el UA incrustado como respaldo). La UI deja de exponerlo porque el valor por defecto funciona para la mayoría y ver un campo *User-Agent* indescifrable en la página de App Settings era una fuente recurrente de confusión.
- Las menciones en los README de 8 *locales* + las menciones en el *help bundle* de 8 *locales* se reemplazan por el consejo "ejecuta vía una IP rusa / VPN". La clave i18n `scan.hhWarning` se reformula para descartar el detalle de configuración de la variable de entorno.
- `KEY_GROUPS` se colapsa: ya no hay clasificación `regional` (sólo contenía HH_USER_AGENT). Pruebas actualizadas; el campo `regionalActive` del *payload* se conserva por compatibilidad hacia atrás del SPA.

### 🧪 Tests

- `tests/env-config.test.mjs` — la aserción `KNOWN_KEYS` ya excluye HH_USER_AGENT; nueva aserción que la clave está deliberadamente ausente.
- `tests/config-endpoint.test.mjs` — la prueba multi-clave POST-write usa `GEMINI_MODEL` como segunda clave conocida en lugar de HH_USER_AGENT.
- `tests/config-groups.test.mjs` — `groups.HH_USER_AGENT` se espera ahora `undefined`.
- Total: **427 / 427** *unit* + 20/20 smoke E2E + 23/23 *comprehensive* E2E + 32/32 Playwright. Mismos conteos que v1.18.0 porque cada prueba ajustada ya estaba contada.

### Verificación

```bash
npm test                              # 427 / 427

# Contraste (Chrome DevTools o axe) en claro + oscuro:
#   .badge-ok / .badge-warn / .badge-bad / .badge-info → AA pass (4,5:1+)
#   .score-high / .score-mid / .score-low → AA pass

# HH_USER_AGENT ya no aparece en /api/config:
curl -s http://127.0.0.1:4317/api/config | jq '.values | keys'
# → ["ANTHROPIC_API_KEY","ANTHROPIC_MODEL","GEMINI_API_KEY","GEMINI_MODEL","HOST","PORT"]
# (sin HH_USER_AGENT)

# Endpoint canónico de configuración regional:
curl -s http://127.0.0.1:4317/api/scan/regional/config | jq '.'
# Alias legacy todavía vivo hasta v1.20:
curl -s http://127.0.0.1:4317/api/scan-ru/config | jq '.'
```

### Fuera de alcance (v1.20+)

| Ítem | Notas |
|---|---|
| Auditoría de objetivo táctil por componente (chips de filtro, cabeceras ordenables, *nav* lateral) | v1.18 fijó el piso global (`.btn` 44 px, `.btn-sm` 32 px); la verificación por componente a lo largo del SPA queda pendiente. |
| `aria-describedby` en pistas de formulario en línea (`#/config`, `#/pipeline`, `#/evaluate`, `#/batch`) | v1.17 cubrió `aria-label` en la búsqueda global y el cierre de modal. La asociación de pista por *input* es la siguiente capa de pulido. |
| Paridad total de README no inglés (585 líneas como EN) | v1.18 llevó los no ingleses a ~307 (53 % del EN). Los recorridos "Quick start" y "🌍 Getting Started" *marketing-heavy* siguen sólo en inglés. |
| Retirar el alias legacy `/api/scan-ru/config` | *Sunset* planificado para v1.20. El canónico `/api/scan/regional/config` es el destino de migración. |

---

## [1.18.0] — 2026-05-13

**Consolidación del endpoint scan + paso WCAG 2.2 AA + finalización i18n long-tail.** Retira los aliases legacy `/api/stream/scan-{en,ru}` (ventana *Sunset* 2026-10-01 adelantada a v1.18 por dirección del usuario). Lleva los READMEs no ingleses a ~307 líneas y traduce las entradas CHANGELOG v1.16.0 + v1.17.0 RU-bodied restantes en 6 *locales*.

### 🚪 Breaking

- **`feat!(scan): retire legacy /api/stream/scan-{en,ru} aliases`** — los *endpoints* SSE *split* EN/RU deprecados desaparecen. Cada consumidor pasa por el *endpoint* consolidado `/api/stream/scan?source=ats|regional|both` (vivo desde v1.12.0). Las rutas legacy llevaban cabeceras *Deprecation* + *Sunset* (RFC 8594) desde v1.15.0; la ventana de migración está cerrada. Las integraciones externas en las rutas antiguas reciben un **404** limpio en vez de ser enrutadas silenciosamente al *catch-all* del SPA.

### ♿ Accesibilidad (paso WCAG 2.2 AA)

- **WCAG 2.4.1 *Bypass Blocks*** — nuevo enlace **Skip to main content** como primer enfocable en cada página. Visualmente oculto vía `.skip-link` hasta recibir foco, se ancla en la esquina superior izquierda al pulsar Tab desde la carga.
- **WCAG 2.4.7 *Focus Visible*** — estilo global `*:focus-visible`. Anillos de foco *off* en clics de ratón, *on* en Tab desde teclado (patrón estándar WAI-ARIA AP). El cierre del modal (×) recibe un anillo de foco de mayor contraste.
- **WCAG 2.5.5 *Target Size*** — objetivo táctil mínimo 44×44 px en `.skip-link`. `.btn-sm` mantiene `min-height: 32px` (combinado con el espaciado de fila cumple la excepción AAA 24×24 + *spacing* para controles compactos en filas de tabla).
- **WCAG 3.1.1 *Language of Page*** — `<html lang="en">` corregido desde `lang="ru"`. El *bootstrap* JS i18n ya sobrescribía esto en carga, pero el *default* SSR coincide ahora con el *locale* por defecto del SPA.
- **WCAG 1.3.1 *Info & Relationships*** — `#content` recibe `tabindex="-1"` para que el destino del *skip-link* reciba foco limpiamente. (Los roles ARIA + *focus-trap* ya estaban en v1.17.)

### 📚 i18n long-tail

- **`docs(i18n): CHANGELOG v1.16.0 + v1.17.0 traducidos en 6 locales`** — las entradas antes con cuerpo en ruso en `CHANGELOG.{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md` están ahora en su idioma nativo. El conteo de caracteres rusos por *locale* cayó 79 → 42 → 23.
- **`docs(readme): expandir READMEs no ingleses con Why / Requirements / Features / Configuration / Contributing`** — cada README no inglés creció de 240 → ~307 líneas. Cubre ahora las mismas secciones no *marketing* que el EN de 585 líneas.

### 🧪 Tests

- Total: **427 / 427** *unit* + 20/20 smoke E2E + 23/23 *comprehensive* E2E + 32/32 Playwright (conteo sin cambios; +2 nuevas aserciones correctas de retirada legacy reemplazan las +2 aserciones legacy-still-works).

---

## [1.17.0] — 2026-05-13

**Pulido + accesibilidad + *fix* de CI.** Cierra 9 *follow-ups* del REVIEW de v1.16.0: verificación de humo en navegador, *badge truth* en READMEs, refresco de cobertura, *chip* 🔒 `lastWorkdayFallback` en el SPA, re-*baseline* E2E completo tras el cambio UX de v1.16, escenarios Playwright para *auto-pipeline*, pase de accesibilidad ARIA + *focus trap*, condensación del CHANGELOG histórico en 6 *locales*, expansión de los READMEs no ingleses con secciones de referencia.

### 🐛 Fixes

- **`fix(e2e): smoke + comprehensive re-alineados con UX de v1.16`** — el cambio de v1.16 Cmd+K Enter → modal *AutoPipeline* hizo que `search.press('Enter')` en los tests E2E abriera un modal que interceptaba los clics siguientes. Los tests usan ahora `Shift+Enter` para el camino legacy *quick-add*. **Este era el fallo de CI en el push de v1.16.0** — Playwright E2E expiraba a los 30 s en clics interceptados por el *backdrop*.
- **`fix(mode-page): /#/batch-prompt → modes/batch.md vía serverSlug`** — v1.15 renombró el *slug* legacy a `batch-prompt`, pero `POST /api/mode/:slug` en el servidor buscaba `modes/batch-prompt.md`, que no existe. El nuevo campo `serverSlug` desacopla el *hash* de ruta del nombre de fichero del *mode* del padre.
- **`chore: bump de mensajes de deprecación de v1.16.0 → v1.17.0`** — la copia de deprecación de `scan-en`/`scan-ru` y el banner de `batch-prompt` referenciaban la versión pasada.

### ✨ Features

- **`feat(scan): chip 🔒 Workday CAPTCHA en card Active Companies`** — el *export* server-side `lastWorkdayFallback` de v1.16 PR-7 lo consume ahora el SPA. `/api/scan-results` devuelve la instantánea; `#/scan` renderiza una tarjeta tintada de aviso sobre *Active Companies* cuando un *tenant* Workday cayó al respaldo ("🔒 Workday tenant blocked — fallback: usa /career-ops scan (Playwright)"). El nuevo `getLastWorkdayFallback()` evita la ambigüedad de *live-binding* en ESM. 2 nuevas claves i18n × 8 *locales*.

### ♿ Accesibilidad

- **`a11y: pase de roles ARIA + gestión de foco`** —
  - `index.html`: atributos `role` en `<aside>` (*navigation*), `<header>` (*banner*), `<section id="content">` (*main*), `<div id="modal">` (*dialog* con `aria-modal`/`aria-labelledby`), `<div id="toast">` + `#conn-banner` (*status* con `aria-live`), `<div class="searchbar">` (*search*).
  - `#sidebar-toggle` recibe `aria-controls="sidebar"` + `aria-expanded` sincronizado por JS al abrir/cerrar.
  - `#global-search` obtiene un `<label>` *visually-hidden* más un `aria-label` explícito que aflora la pista del atajo Cmd+K.
  - El cierre del modal (×) recibe `aria-label="Close dialog"`.
  - Los *backdrops* decorativos reciben `aria-hidden="true"`.
  - **Focus trap en modal** — `UI.modal()` recuerda el propietario del clic, enfoca el primer enfocable no *close* al abrir, y cicla Tab/Shift+Tab dentro del modal. `UI.closeModal()` restaura el foco al propietario previo.
  - Nueva clase de utilidad `.visually-hidden` en `public/css/app.css` (patrón estándar WAI-ARIA AP).

### 📚 Documentación

- **`docs(readme): badge truth a través de 8 READMEs`** — *badge* de pruebas `284 / 379 / 360` → **427**; *badge* de versión `v1.9.1 / v1.13.0` → **v1.16.0**, luego → v1.17.0 vía el *bump* de v1.17. Destinos de los enlaces de versión actualizados.
- **`docs(readme): expandir 7 READMEs no ingleses con secciones de referencia`** — cada uno creció de 170 a ~240 líneas con nuevas secciones *Architecture* / *API reference* / *Security notes* / *Tests* / *A11y* / *Limitations* / *License* en el idioma nativo. Todavía no en paridad completa de 585 líneas con EN, pero cubre todas las superficies no *marketing* clave.
- **`docs(changelog): condensar entradas pre-v1.12 en 6 locales`** — las entradas largas con cuerpo en ruso de v1.11.x + v1.10.x que sangraban en los CHANGELOG no-EN/no-RU se reemplazan ahora por un resumen ejecutivo compacto "*Earlier releases*" en el idioma nativo de cada *locale*. La historia detallada queda en `CHANGELOG.md` (EN).

### 🛠️ Tooling

- **`coverage: refresh de números`** — el último publicado fue 95,46 % de líneas / 84,06 % de ramas (REVIEW v1.13.0). Línea base v1.17: **94,14 % líneas / 82,98 % ramas / 93,20 % funciones**. Caída ligera por nuevas rutas de error en *auto-pipeline* + *reports-write*; muy por encima aún del piso de 80 % en CLAUDE.md.

### 🧪 Tests

- Total: **427 / 427** *unit* + 20/20 smoke E2E + 23/23 *comprehensive* E2E + **32 / 32** Playwright (era 28; +4 escenarios nuevos de *auto-pipeline*: botón abre modal, Cmd+K *paste* dispara modal, URL inválida cierra el paso 1, encuadre de eventos SSE `POST /api/auto-pipeline`).
- Suite E2E re-alineada con UX de v1.16.0 (Shift+Enter *quick-add*, /#/batch-prompt para el *mode* legacy).

### Fuera de alcance (v1.18+)

| Ítem | Notas |
|---|---|
| Traducir la entrada v1.16.0 en los CHANGELOG no ingleses | Actualmente con cuerpo en ruso (~30 líneas × 6 *locales* = 180 líneas). Quedó fuera del alcance explícito v1.11.x/v1.10.x del usuario. |
| Paridad completa de README no inglés (585 líneas como EN) | v1.17 llevó los no ingleses a ~240; los recorridos "Why?" / "Quick start" *marketing-heavy* permanecen sólo en inglés. |
| Auditoría completa WCAG 2.2 AA | v1.17 cubrió ARIA estructural + *focus trap*; la auditoría por componente de contraste/orden de Tab queda pendiente. |

---

## [1.16.0] — 2026-05-13

**Finalización del auto-pipeline + pulido de adaptadores + i18n long-tail.** Cierra los 11 *follow-ups* del REVIEW de v1.15.0: SSE *auto-pipeline* en el servidor, primitiva `POST /api/reports`, atajo Cmd+K, paginación de SmartRecruiters, respaldo CAPTCHA de Workday, puerta de CI para *drift* de capturas, UX del filtro de origen en *scan*, traducción del CHANGELOG histórico (v1.13.0/v1.12.0 × 6 *locales*), expansión de los READMEs no ingleses, importador *paste-ready* de empresas en tendencia.

### ✨ Features

- **`feat(auto-pipeline): orquestador SSE server-side`** (#1, #2, #3, #8) — el orquestador *client-side chained-fetch* de v1.15 se elimina. `POST /api/auto-pipeline` es ahora un *endpoint* SSE *curl-able* que ejecuta validar → traer JD → evaluar → guardar informe → tracker en el servidor con eventos por paso en tiempo real. La llamada lenta a Anthropic (30–90 s) emite ahora eventos `running` en vez de un *spinner* genérico. Los fallos emiten `error` con `step` + `message`. El orquestador también persiste el *markdown* del informe en `reports/<slug>.md` del padre (se perdía en v1.15).
- **`feat(reports): primitiva POST /api/reports`** — nuevo *writer* en `server/lib/routes/reports.mjs`. Saneamiento de *slug* con guarda contra *path traversal*. Tope de 1 MB (413). 409 si el fichero existe sin `overwrite:true`. Escritura atómica a través de `stripDangerousMarkdown`. Registro de actividad `activity.reports.save`. Pruebas: 9 casos.
- **`feat(app): Cmd+K paste URL → auto-pipeline`** — pegar una URL en la búsqueda global + Enter abre el modal *AutoPipeline* con `autoStart=true`. Shift+Enter preserva el camino legacy "*add to pipeline only*".
- **`feat(portals): paginación SmartRecruiters`** (#4) — `server/lib/sources/smartrecruiters.mjs` recorre páginas mediante `?limit=100&offset=N` hasta alcanzar `totalFound`, O página vacía, O tope de seguridad de 30 páginas / 3000 *jobs*. Boards grandes (Procter & Gamble) ya no pierden el resto de sus publicaciones. Pruebas: 6 casos.
- **`feat(portals): respaldo CAPTCHA de Workday elegante`** (#7) — `server/lib/sources/workday.mjs` deja de lanzar en 4xx / no-JSON / errores de red. Devuelve `[]` y anota el nuevo *export* `lastWorkdayFallback`. La línea de tiempo del *scanner* continúa con el siguiente *tenant*. *Opt-in* al *throw* de v1.14 vía `strict:true`. Pruebas: 7 casos.

### 🛠️ Tooling + CI

- **`ci(workflows): puerta de drift de dashboard-screenshots`** (#5) — nuevo `.github/workflows/dashboard-screenshots.yml`. En PRs que tocan `public/css/app.css`, `public/js/views/dashboard.js`, `public/js/lib/i18n.js` o `public/index.html`, el *workflow* arranca el servidor contra un andamiaje en /tmp, regenera los 8 PNG *hero* vía Playwright + chromium, y falla la *build* si el resultado deriva del *committed*.
- **`feat(scripts): import-trending-companies.mjs`** (#11) — verifica las 13 empresas en tendencia de `docs/portals-examples.md` vía su API de *boards* real y emite YAML pegable para el `portals.yml::tracked_companies` del padre. `enabled: false` se estampa en candidatos cuyo *slug* devuelve 404. Se ejecuta con `npm run import:trending`.
- **`feat(scripts): npm run capture:dashboards`** — expone `scripts/capture-dashboard-screenshots.mjs` como *script* de primer nivel.

### 🎨 UX

- **`fix(scan): dropdown de filtro source consolidado`** (#6) — el desplegable de origen en `#/scan` reconstruido a partir del *registry* de adaptadores de v1.14: 6 ATSes + hh.ru + Habr Career, alfabético, sin prefijos geográficos. `runEnScan`/`runRuScan` apuntan ahora al *endpoint* consolidado `/api/stream/scan?source={ats,regional}`.

### 📚 i18n long-tail

- **`docs(i18n): traducir CHANGELOG v1.13.0 + v1.12.0 en 6 locales`** (#9) — entradas antes con cuerpo en ruso en `CHANGELOG.{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md` ahora en su *locale* real. Cada CHANGELOG no-EN/no-RU recibe además una nota i18n explicando que las entradas pre-v1.12 permanecen en ruso por convención del proyecto.
- **`docs: expandir READMEs no ingleses con sección de destacados v1.16.0`** (#10) — 6 READMEs no ingleses (es / pt-BR / ko-KR / ja / ru / zh-CN / zh-TW) reciben una nueva sección de ~35 líneas que cubre: flujo de un clic *auto-pipeline* + ejemplo curl, paginación de SmartRecruiters, respaldo de Workday, UX del filtro de origen en *scan*, *script* importador y *workflow* CI de capturas.

### 🧪 Tests

- Nuevo `tests/reports-write.test.mjs` (9 casos) — camino feliz, saneamiento de *slug* (incl. guarda contra *path traversal*), conflicto 409, *flag* *overwrite*, *strip* XSS, 400 con campos faltantes, 413 con >1 MB, *round-trip* GET/POST.
- Nuevo `tests/auto-pipeline.test.mjs` (5 casos) — encuadre SSE, puerta de URL inválida, puerta SSRF/*loopback*, ruta de error sin clave LLM, cabecera `Content-Type: text/event-stream`.
- Nuevo `tests/smartrecruiters-pagination.test.mjs` (6 casos) — *single page*, 3 páginas, *early-stop* por página vacía, tope duro respetado, *query strip*, lanzamiento en 503.
- Nuevo `tests/workday-fallback.test.mjs` (7 casos) — camino feliz, 403/429 elegante, cuerpo no-JSON, error de red, *opt-in* estricto para 4xx y errores de red.
- Total: **427 / 427** *unit* (era 400; +27 netos). 0 fallos. 28/28 Playwright + 23/23 *comprehensive* E2E + 20/20 smoke E2E en verde desde la línea base v1.15.0.

### Fuera de alcance (v1.17+)

| Ítem | Notas |
|---|---|
| Traducir entradas pre-v1.12 del CHANGELOG (v1.11.x, v1.10.x) | Convención preservada: con cuerpo en ruso. El *backport* son ~1800 líneas de traducción; diferido. |
| Paridad completa de README no inglés (585 líneas como EN) | v1.16 añadió ~35 líneas por *locale*; el espejo completo es un pase de traducción aparte. |
| Aflorar `lastWorkdayFallback` en la tarjeta *Active Companies* del SPA | *Export* en servidor cableado; consumo en UI es v1.17. |
| *Bulk add* per-empresa de `tracked_companies` para las 9 en tendencia ya verificadas | El *script* `import:trending` lo hace en 1 comando + 1 pegado. Automatizar escrituras al `portals.yml` del padre violaría la regla dura #1 de CLAUDE.md. |

### Verificación

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

**Release de conformidad documental.** Cierra 9 de 10 hallazgos abiertos en la auditoría de conformidad (`qa/conformance-vs-docs/00-CONFORMANCE-REPORT.md`) más imágenes *hero* localizadas. Alinea la UI con el flujo canónico de career-ops.org/docs — el mismo pipeline que promete el CLI, ahora extremo a extremo en navegador y en las 8 *locales*.

### ✨ Features

- **`feat(auto-pipeline): PR-C — un clic "pegar URL → informe + PDF + fila de tracker"`** (G-007) — hasta v1.15 el usuario hacía 5 clics manuales por /#/pipeline → /#/evaluate → /#/cv → /#/tracker. Ahora un único botón ✨ en /#/dashboard encadena: validar URL → traer JD (a prueba de SSRF) → evaluar contra el CV → generar PDF → añadir fila al *tracker*. Línea de tiempo modal paso a paso con [✓]/[…]/[✗]. Extracción heurística de empresa/rol. Fichero nuevo: `public/js/lib/auto-pipeline.js`. 19 claves i18n nuevas × 8 *locales*.
- **`feat(modes): PR-D — editor modes/_profile.md como pestaña Modes en #/config`** (G-008) — el fichero canónico "*Career framing*" del Quick Start §Step-5 es ahora visible en la UI. Nuevos *endpoints* `GET/PUT /api/modes/_profile` con tope 256 KB, pase XSS de `stripDangerousMarkdown`, andamiaje desde `_profile.template.md`. 9 claves i18n nuevas × 8 *locales*.
- **`feat(profile): PR-E — esquema canónico + location + headline`** (G-009) — `/api/profile` acepta TANTO el legacy (`candidate:{...}`) COMO el canónico (top-level `full_name`, `narrative.headline`, `target_roles.primary`, `compensation.target_range`). El legacy gana en colisión. Nuevo `summarizeProfile()`. /#/profile muestra `narrative.headline` como nueva tarjeta. 2 claves i18n nuevas × 8 *locales*.
- **`feat(tracker): PR-B — columna Legitimacy en #/tracker`** (G-006) — restaura paridad con la tabla de salida del *pipeline* canónico. Entre Status y PDF, con realce *badge-ok/warn/bad*. Degradación elegante para filas previas a v1.15. 1 clave i18n nueva × 8 *locales*.
- **`fix(routing): PR-H — deduplicar sidebar; #/batch → SPA TSV de v1.13.0`** (G-011) — antes del *fix*, /#/batch aparecía DOS veces en el *sidebar* Y ambas entradas llevaban al constructor de *mode-prompt* legacy. El SPA TSV de v1.13.0 (8 KB) era inaccesible. Duplicado eliminado; el legacy renombrado a `batch-prompt` con banner de deprecación.

### 📚 Documentación

- **`docs(evaluate): PR-A — realineación Block A-F`** (G-005) — career-ops.org/docs usa A–F (Estrategia/Personalización/historias STAR en C/E/F). Emitíamos A–G. v1.15 actualiza los 8 *help bundles* §9 con A–F canónico y un *callout* de compatibilidad hacia atrás. ⚠ Aún se requiere un *commit* en el padre: `santifer/career-ops::modes/oferta.md` debe reescribirse aguas arriba.
- **`docs: PR-F — seniority_boost + search_queries en help §5 × 8 locales + scaffold`** (G-010) — la sección §5 de la ayuda en las 8 *locales* documenta la tercera clave *title-filter* + bloque ejemplo `search_queries`. `bin/setup.sh` siembra `seniority_boost: ["Senior", "Staff", "Lead"]` por defecto.
- **`docs: PR-I — imágenes hero localizadas por locale de README`** — cada uno de los 8 README tiene su `images/dashboard-<locale>.png` específico (HiDPI 1440×900) generado vía `scripts/capture-dashboard-screenshots.mjs`. El viejo `public/images/screen_vacancy_found.png` se elimina.

### 🧹 Limpiezas arrastradas

- **`PR-G — G-001`** i18n `scan.noResults`: 8 cadenas con el literal "EN or RU scan" reemplazadas.
- **`PR-G — G-002`** 📄 *Generate PDF* aflora ahora en los paneles de resultado de `#/interview-prep`.
- **`PR-G — G-003`** `README.cn.md` → `README.zh-CN.md` (etiqueta *locale* canónica).
- **`PR-G — G-004`** `/api/stream/scan-en` + `scan-ru` emiten ahora cabeceras RFC 8594 *Sunset* + *Deprecation* + *Link* (sunset 2026-10-01). Retirada en v1.16.0.

### 🧪 Tests

- Nuevo `tests/profile-canonical-schema.test.mjs` (6 casos).
- Nuevo `tests/modes-profile-crud.test.mjs` (8 casos).
- Corregida una regresión de aislamiento en *fixtures* de prueba: las pruebas usan ahora el patrón `before/after + dynamic-import` para no mutar el `config/profile.yml` del padre.
- Total: **400 / 400** pruebas *unit* (era 386; +14). 0 fallos.

### Fuera de alcance (v1.16+)

| Ítem | Notas |
|---|---|
| *Commit* en el padre para el *prompt* canónico A–F | `santifer/career-ops::modes/oferta.md` debe reescribirse aguas arriba. La regla dura #1 de CLAUDE.md nos prohíbe tocar el padre. |
| `POST /api/auto-pipeline` SSE en el servidor | El orquestador *client-side* aporta la victoria UX; el server-side dará *retry-from-step-N* + ejecutable por curl en CI. |
| Primitiva `POST /api/reports` | *Auto-pipeline* muestra el *markdown* en línea pero no lo persiste en `reports/` del padre. |
| Cmd+K pegar-URL → ejecutar *auto-pipeline* | Diferido a v1.16+. |

---

## [1.14.0] — 2026-05-13

3 nuevos adaptadores ATS sobre el *registry* de v1.13.0, llevando el total de 3 → 6 ATSes soportados (Greenhouse / Ashby / Lever **+ Workable / SmartRecruiters / Workday-beta**). Documentación de cara al usuario actualizada en los 17 archivos de "3 ATSes" a "6 ATSes" en una sola pasada (42 frases): README × 8 *locales*, *help bundle* × 8 *locales*, PROJECT.md. Añadidos bloques YAML listos para pegar de 13 empresas en tendencia en `docs/portals-examples.md` para el `portals.yml` del padre.

### ✨ Features

- **`feat(portals): 3 nuevos ATS — Workable, SmartRecruiters, Workday-beta`** — el *registry* resuelve ahora 6 ATSes (antes 3). Ficheros nuevos: `server/lib/portals/adapters/{workable,smartrecruiters,workday}.mjs` (envoltorios finos con el contrato uniforme) + `server/lib/sources/{workable,smartrecruiters,workday}.mjs` (HTTP crudo + normalización al *shape* canónico).
  - **Workable**: detecta `apply.workable.com/<slug>` Y legacy `<subdomain>.workable.com`. *Endpoint*: `https://apply.workable.com/api/v3/accounts/<slug>/jobs?details=true`.
  - **SmartRecruiters**: detecta `jobs.smartrecruiters.com/<slug>` Y `careers.smartrecruiters.com/<slug>`. *Endpoint*: `https://api.smartrecruiters.com/v1/companies/<slug>/postings`.
  - **Workday (beta)**: detecta `<tenant>.wd<N>.myworkdayjobs.com/<lang>/<site>`. *Endpoint*: POST a `/wday/cxs/<tenant>/<site>/jobs`. `site=External` por defecto si la URL no incluye *site*. Beta porque algunos *tenants* cierran el *feed* CXS con CAPTCHA — el respaldo es el `/career-ops scan` del padre (Playwright).

### 📚 Documentación

- **`docs(portals-examples): bloque de boards en tendencia`** — `docs/portals-examples.md` extendido con la sección v1.14.0 que lista 13 empresas en tendencia como YAML listo para pegar en `tracked_companies`: alojadas en Greenhouse (Stripe, GitLab, HashiCorp, Cloudflare, Datadog, Hugging Face) + alojadas en Ashby (Notion, Linear, PostHog, Replicate, Modal Labs, Fly.io, Render). Todas con `enabled: false` — el usuario verifica el *slug* antes de activar. Bloques de ejemplo adicionales para Workable / SmartRecruiters / Workday.
- **`docs(framing): 42 frases ATS actualizadas en 17 ficheros de cara al usuario`** — cada aparición de "Greenhouse / Ashby / Lever" en documentación de usuario se lee ahora como "Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday". Afectados: README × 8 *locales*, *help bundle* × 8 *locales*, PROJECT.md. Las entradas históricas del CHANGELOG y los documentos prescriptivos de *bug-fix* (`qa/fixes/F-014`, `qa/FIX-PROMPT`) se dejan intactos deliberadamente — describen estado pasado o ya correcto.
- **`docs(qa): escenario 19 del *browser test*`** — `qa/claude-cowork-browser-test-prompt.md` extendido con el escenario 19: invariante `ALL_ADAPTERS.length === 6`, barrido de detección de URL vía `resolveAdapter()` para los 6, comprobación *soft* de la tarjeta *Active Companies* en `#/scan`, comprobación estructural de `docs/portals-examples.md`.

### 🧪 Tests

- `tests/adapter-registry.test.mjs` extendido con 7 casos nuevos para los 3 adaptadores (Workable *apply-URL*, Workable subdominio legacy, SmartRecruiters jobs.* + careers.*, Workday `tenant.wd5.*` con *site* explícito, Workday respaldo a *site* por defecto, invariante `ALL_ADAPTERS.length === 6`, compatibilidad del *shape* legacy `detectApi()`).
- Total: **386 / 386** pruebas *unit* (antes 379; +7 netos). 0 fallos.

### Fuera de alcance

| Ítem | Notas |
|---|---|
| Entradas por empresa para las 13 en tendencia Greenhouse/Ashby | El bloque v1.14.0 de `docs/portals-examples.md` las lista como YAML pegable; el *bulk-add* al `portals.yml` del padre es fase aparte. |
| Automatización del respaldo CAPTCHA de Workday | El adaptador Workday lanza cuando el *feed* CXS está bloqueado; el respaldo planificado delega al `/career-ops scan` del padre (Playwright). El cableado en el UX de *scan* del SPA es para v1.15+. |

---

## [1.13.0] — 2026-05-13

Gran versión. Cierra los 4 ítems diferidos en un solo *commit*: PR-4 (*pipeline multer* completo), *Adapter registry* (continuación arquitectónica de F-018), página SPA *Batch evaluate*, y andamiaje de *mode-template* consciente del *locale*. Más un *fix* a mitad de sesión de tablas en tema oscuro.

### ✨ Features

- **`feat(cv): subida multipart con multer (PR-4 completo)`** — `/api/cv/import` acepta ahora TANTO *octet-stream* (contrato original) COMO `multipart/form-data` mediante multer. El rechazo 415 de v1.10.2 era un parche; v1.13.0 es la corrección real. curl `-F`, *default* de Postman, cualquier cliente HTTP funcionan sin fricción. Nueva dependencia: `multer ^2.1.1`.
- **`feat(portals): adapter registry`** — los *fetchers* de Greenhouse / Ashby / Lever extraídos a `server/lib/portals/adapters/*.mjs` con contrato uniforme. `server/lib/portals/registry.mjs::resolveAdapter()` es el único punto de despacho. Añadir un nuevo ATS = un fichero en `adapters/` + una línea en `ALL_ADAPTERS`.
- **`feat(batch): página #/batch *evaluate*`** — nueva vista SPA + 4 *endpoints* (`GET /api/batch`, `PUT /api/batch`, `GET /api/stream/batch`, `POST /api/batch/merge`). Editor TSV para `batch/batch-input.tsv`, controles *parallel*/*min-score*/*dry-run*/*retry*, *log* SSE en vivo de `bash batch/batch-runner.sh`, botón `Merge to tracker` (ejecuta `node merge-tracker.mjs`). Enlace en *sidebar*. 21 claves i18n nuevas × 8 *locales*.
- **`feat(prompts): andamiaje de mode consciente del locale`** — `buildModePrompt` + `buildEvaluationPrompt` envuelven ahora el cuerpo inglés de la plantilla *mode* del padre con andamiaje localizado (línea de rol, "Read these files first", "User-supplied context") en 8 *locales*.

### 🎨 Fixes de UX

- **`fix(theme): tablas en modo oscuro + tab-btn`** — `#fafafa` / `#fff` / `#f7f7f7` *hardcoded* sustituidos por *tokens*. El *hover* en oscuro es ahora legible. Añadido `.row-boosted` con franja de acento.

### 🧪 Tests

- Nuevos `tests/adapter-registry.test.mjs` (7), `tests/batch-endpoints.test.mjs` (5), `tests/locale-scaffold.test.mjs` (6).
- `tests/cv-upload-multipart-reject.test.mjs` reescrito al contrato v1.13.0 (*multipart* parseado correctamente).
- Total: **379 / 379** *unit* (era 360; +19). 0 fallos. Cobertura **95,46 % líneas / 84,06 % ramas**.
- 20/20 smoke E2E · 23/23 *comprehensive* E2E · 28/28 Playwright.

### Fuera de alcance

- **14 adaptadores de portal nuevos** — el *registry* está; añadirlos = un fichero cada uno; queda el *research* portal por portal.
- **Traducir cuerpos de `modes/<slug>.md` del padre** — requiere PR aguas arriba a `santifer/career-ops` (regla dura #1 de CLAUDE.md).

### Documentación

- `docs/reviews/REVIEW-2026-05-13-v1.13.0.md`.

---

## [1.12.0] — 2026-05-13

Pase de *bug-fix* + UX + *brand*. Cierra 8 ítems del *backlog* tras v1.11.1 (huecos de prueba #9–12, error de consola #8, deriva *portals-dead* #4, afloramiento de `seniority_boost` #6, consolidación de *endpoint* F-018). Añadido conmutador día/noche de tema, eliminada la mención "*Airbnb-styled*" de todos los documentos, *metadata* del paquete y descripción del repo de GitHub.

### ✨ Features

- **`feat(theme): conmutador día/noche`** — nuevo botón de tema en la *top-bar*. Ciclo claro ↔ oscuro, persistente en `localStorage`, restaurado antes del primer pintado vía `public/js/lib/theme-bootstrap.js`. Respeta `prefers-color-scheme` en la primera carga. Paleta oscura completa en `public/css/app.css` bajo `[data-theme="dark"]`.
- **`feat(scan): /api/stream/scan?source=ats|regional|both` (F-018 LITE)`** — un *endpoint* SSE consolidado. El SPA abre UN único *event-stream* que ejecuta secuencialmente ambas fases (ATS, después regional). Los legacy `/api/stream/scan-en` + `/api/stream/scan-ru` permanecen como alias deprecados.
- **`feat(scan): afloramiento de seniority_boost`** — ambos *scanners* leen `portals.yml::title_filter.seniority_boost` y marcan `_boosted: true` en *jobs* coincidentes. El SPA ordena las filas potenciadas arriba y renderiza un *badge* `⬆ boosted`.

### 🐛 Fixes

- **`fix(ui): .message null-safe en 4 sitios (#8)`** — `app.js`, `views/tracker.js`, `views/apply.js`, `views/evaluate.js`. Antes, un *Promise rejection* sin *payload Error* lanzaba "Cannot read properties of undefined" en el *teardown* E2E.
- **`fix(test): drift portals-dead como aviso, no fallo (#4)`** — aserción convertida en aviso por *stderr*. CI sigue en verde ante deriva del padre; las decisiones de versión son manuales.

### 📝 Brand / docs

- **`docs(brand): eliminadas referencias 'Airbnb' de todos los doc + package + descripción del repo de GitHub`** — 8 README, CLAUDE.md, FRONTEND.md, package.json y la descripción del repo migrados de "*Airbnb-styled*" a "*Clean, docs-style*".

### 🧪 Tests

- Nuevo `tests/canonical-docs-coverage.test.mjs` (5 casos) cierra los huecos de prueba #9–12.
- Nuevo `tests/scan-consolidated.test.mjs` (6 casos) cubre F-018 LITE.
- Total: **360 / 360** *unit* (era 349; +11 netos). 0 fallos. Cobertura: **95,62 % líneas / 84,37 % ramas**.
- 20/20 smoke E2E · 23/23 *comprehensive* E2E · 28/28 Playwright.

### Documentación

- `docs/reviews/REVIEW-2026-05-13-v1.12.0.md`.

### Fuera de alcance (sin cambios desde v1.11.1)

Página SPA *Batch evaluate*; *adapter registry* completo (refactor arquitectónico F-018); *pipeline multer* completo (PR-4); traducción de plantillas *mode*.

---

## Versiones anteriores (v1.11.x y v1.10.x)

Las entradas detalladas para v1.11.0 / v1.11.1 / v1.10.0–v1.10.3 viven en el [CHANGELOG EN](CHANGELOG.md). Resumen ejecutivo:

- **v1.11.1 — 2026-05-13** · Pulido: pista de Playwright en `#/apply`, *taglines* unificadas, tarjeta de umbrales de puntuación en el *dashboard*. 349/349 pruebas.
- **v1.11.0 — 2026-05-13** · Integración de career-ops.org/docs en los 8 *help bundles* y los 8 README. Nuevo `docs/career-ops-canonical.md`. Documentados los conceptos *Mode*/*Archetype*/*Pipeline*/*Tracker*/*Report*/*Scan history*. 348/349 pruebas.
- **v1.10.3 — 2026-05-12** · Tramo de *bug-fix*: cierra 7 de 11 hallazgos QA del pase de regresión de v1.10.2.
- **v1.10.2 — 2026-05-12** · Rechazo 415 en *multipart* CV (parche temporal hasta el multer de v1.13.0); corrección de generación de PDF.
- **v1.10.1 — 2026-05-09** · Parche crítico del pase de regresión QA de v1.10.0.
- **v1.10.0 — 2026-05-08** · Editor `#/profile` + UX de subida de CV (pandoc/pdftotext/passthrough), 8 *locales* × 16 H2 de paridad de ayuda, conmutador de *locale*.
