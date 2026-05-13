# Ayuda — career-ops-ui

Recorrido completo por cada página, desde el primer arranque hasta la
preparación para entrevistas. Cada `##` corresponde a una entrada del
sidebar o a una fase del flujo. Lea de arriba a abajo en el primer
arranque; después salte a la sección que necesite mediante el TOC.

> **Para quién:** quien acaba de poner este UI dentro de un checkout
> de `career-ops` y ejecutó `bash bin/start.sh`. No se asume
> conocimiento previo.


### Sobre career-ops

[career-ops](https://career-ops.org) es un sistema open-source de búsqueda de empleo que corre como slash-comandos dentro de cualquier CLI de codificación con IA (Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot CLI). Modelo-agnóstico. Evalúa cada puesto contra tu CV con una rúbrica de seis dimensiones 0.0–5.0, genera CVs PDF adaptados, y registra cada solicitud localmente.

**Principios** (de [career-ops.org/docs](https://career-ops.org/docs)):

- **Open source, en serio** — MIT, sin tier de pago, sin lista de espera, sin telemetría, sin cuentas.
- **Soberanía de datos** — `cv.md`, `config/profile.yml`, `data/`, `reports/`, `interview-prep/` no salen de tu máquina salvo que las subas explícitamente.
- **El humano envía** — career-ops redacta las respuestas y abre el formulario, pero **tú haces clic en Submit**. Nunca auto-aplica.
- **Búsqueda estructurada** — pensado para búsqueda activa y deliberada, no es un motor de recomendaciones.

**Conceptos clave**

| Concepto | Qué es |
|---|---|
| **Mode** | Plantilla de prompt bajo `modes/<slug>.md`. Built-in: `oferta`, `deep`, `apply`, `pipeline`, `batch`, `contacto`, `followup`, `interview-prep`, `patterns`, `project`, `training`. |
| **Arquetipo** | Perfil de rol objetivo en `config/profile.yml`. La rúbrica pondera coincidencias de skills contra el arquetipo activo — **el campo más importante**. |
| **Pipeline** | `data/pipeline.md` — inbox de URLs de JD pendientes de evaluación. |
| **Tracker** | `data/applications.md` — tabla GFM histórica de cada evaluación y estado de aplicación. |
| **Report** | `reports/<NNN>-<company>-<DATE>.md` — evaluación A–G completa por JD, con score + legitimidad. |
| **Scan history** | `data/scan-history.tsv` — log append-only; previene duplicados entre scans. |

### career-ops vs career-ops-ui (esta app)

| | career-ops (CLI) | career-ops-ui (esta app) |
|---|---|---|
| Dónde corre | dentro de Claude Code / Codex / Cursor / Gemini CLI | `http://127.0.0.1:4317` en tu navegador |
| Superficie | slash-comandos `/career-ops <mode>` | sidebar, una página por workflow |
| Form-fill | sí, vía Playwright MCP | no — genera el checklist, tú lo completas en el CLI |
| PDF | `generate-pdf.mjs` | `📄 Generate PDF` en `#/cv`, `#/reports/:slug`, `#/evaluate`, `#/deep`, `#/interview-prep` |
| Archivos de datos | compartidos con career-ops-ui | compartidos con career-ops |

### Umbrales de acción por score

| Score | Siguiente paso |
|---|---|
| **≥ 4.5** | Ejecuta `/career-ops apply` — alto fit, aplica de inmediato. |
| **4.0 – 4.4** | Aplica, o `/career-ops contacto` para warm intro primero. |
| **3.5 – 3.9** | Ejecuta `/career-ops deep` — investiga la empresa/rol antes de decidir. |
| **< 3.5** | Salta salvo razón específica. |

### Documentación externa

Referencia completa del motor career-ops (scanning, rúbrica, batch, apply, Playwright) en [career-ops.org/docs](https://career-ops.org/docs):

- [What is career-ops](https://career-ops.org/docs/introduction/what-is-career-ops)
- [Scan job portals](https://career-ops.org/docs/introduction/guides/scan-job-portals)
- [Apply for a job](https://career-ops.org/docs/introduction/guides/apply-for-a-job)
- [Batch-evaluate offers](https://career-ops.org/docs/introduction/guides/batch-evaluate-offers)
- [Set up Playwright](https://career-ops.org/docs/introduction/guides/set-up-playwright)

---

## 1. Inicio rápido — paso a paso de "crear CV" hasta "postulado y mensajeado"

Playbook canónico botón-por-botón. Sígalo en orden la primera vez.

**A. Configuración (una sola vez, ~5 min)**

1. Abrir `http://127.0.0.1:4317` (o `bash bin/start.sh` desde la raíz).
2. Sidebar **❤ Health** → todos los chequeos requeridos en verde.
3. Sidebar **⚒ App settings** → pestaña *API keys & runtime* → pegar
   `ANTHROPIC_API_KEY` y/o `GEMINI_API_KEY` → **💾 Save** →
   **▶ Test Anthropic / Gemini**.
4. Misma página → pestaña *Profile* → editar `candidate.full_name`,
   `email`, `target.roles`, `target.comp_total_min_usd`,
   `target.archetypes` → **💾 Save**.

**B. CV (una sola vez, ~10 min)**

5. Sidebar **✎ CV** — abrir el editor.
6. Botón **📁 Upload CV** → subir `.docx/.doc/.odt/.rtf/.pdf/.html
   /.txt/.md` (servidor convierte y sanitiza); o pegar markdown.
7. **💾 Save** (top-right) — toast "Saved".
8. (Opcional) **📄 Generate PDF** — el PDF más reciente se descarga
   automáticamente al terminar.

**C. Encontrar vacantes (~2 min por scan)**

9. Sidebar **🌐 Scan** → **🌐 Scan now** → log SSE en vivo.
10. Click en un tag de empresa filtra; ↗ abre la página de carreras.

**D. Puntuar (~30 s por JD)**

11. Sidebar **Pipeline** — click en una entrada para preview del JD.
12. **▶ Evaluate** junto al JD → modelo puntúa 0–5 → reporte en
    `reports/<fecha>-<slug>.md`.
13. Sidebar **Reports** — revisar el reporte; pursuables = short-list.

**E. Decidir + investigar a fondo (~3 min)**

14. Sidebar **Deep research** → empresa + rol → brief de 7 secciones,
    guardado en `interview-prep/<empresa>-<rol>.md`.

**F. Postular (~5 min por aplicación)**

15. Sidebar **Apply checklist** → URL + JD → checklist (cover letter,
    keywords, archivos, **NUNCA auto-submit**).
16. Abrir la página de carreras en pestaña nueva → enviar manualmente.
17. Sidebar **Outreach** (`#/contacto`) → mensaje LinkedIn / email
    desde el brief de paso 14 → personalizar y enviar.

**G. Trackear y follow-up (continuo)**

18. Sidebar **Tracker** → fila: empresa, rol, score, status `Applied`,
    enlaces al reporte y al brief.
19. Una semana después: modo **Follow-up** → check-in → status
    `Followed up`.
20. Invitación a entrevista: modo **Interview prep** → preparación
    para system design / behavioral / coding.
21. Oferta: actualizar Tracker a `Offer` y revisar la sección comp del
    reporte.

**TL;DR — el orden del sidebar coincide con el workflow:**
Health → App settings → Profile → CV → Scan → Pipeline → Evaluate →
Reports → Deep research → Apply checklist → Outreach → Tracker →
Follow-up → Interview prep → Activity log.

---

## 2. App settings & API keys (`#/config`)

Dos pestañas: **API keys & runtime** edita el `.env` del proyecto
padre desde el navegador (mismo archivo que leen los scripts Node);
**Profile** es un editor YAML directo de `config/profile.yml` que
añade automáticamente el encabezado canónico
`# Career-Ops Profile Configuration` y valida que haya un `candidate`.
Un guardado en cualquier pestaña se aplica al instante — sin reinicio.

### Claves reconocidas

| Clave | Para qué | Dónde obtenerla |
|---|---|---|
| `ANTHROPIC_API_KEY` | Habilita llamadas live al SDK Anthropic. Preferida cuando ambas están — mejor output estructurado largo. | <https://console.anthropic.com/settings/keys> |
| `ANTHROPIC_MODEL` | Sobrescribe el default `claude-sonnet-4-6`. | — |
| `GEMINI_API_KEY` | Fallback sin Anthropic. Usada por `gemini-eval.mjs` para `oferta`. | <https://aistudio.google.com/apikey> |
| `GEMINI_MODEL` | Sobrescribe modelo Gemini. | — |
| `HH_USER_AGENT` | Necesario para escanear `hh.ru` desde fuera de Rusia. | dev.hh.ru |
| `PORT` | Puerto Express. Default 4317. | — |
| `HOST` | Bind. Default `127.0.0.1`. `0.0.0.0` expone en LAN — **sin auth gate aún**. | — |

### Comportamiento

- **Lectura** (`GET /api/config`) devuelve cada clave conocida; las
  secretas están **enmascaradas** (`sk-ant•••••a1b2`).
- **Guardado** (`POST /api/config`) valida, escribe a `.env` y aplica
  a `process.env` en vivo.
- **Valor vacío borra** la clave.

### Botones smoke-test

Tras guardar pulse **▶ Test Anthropic** o **▶ Test Gemini** — ambos
mandan un prompt minúsculo (≤256 tokens) confirmando que la clave
funciona. Devuelve un sample de ~200 caracteres.

---

## 3. Profile (`#/profile` — también accesible como `#/settings`)

Vista de solo lectura de `config/profile.yml`. Edite el archivo en
disco; la página re-parsea al recargar.

Campos clave:

- `candidate.full_name` — usado en cada prompt. **Reemplace `Jane
  Smith`** antes de cualquier scan real.
- `candidate.email`, `linkedin`, `github` — referenciados en cover
  letters y apply checklist.
- `target.roles` — títulos aceptados.
- `target.comp_total_min_usd` — comp mínimo. Sección D de cada
  evaluación marca ofertas debajo.
- `target.archetypes` — el campo *más importante*. Cada JD se mide
  contra ellos; el mejor archetype va al header del reporte.

Health marca **Profile customized** mientras `full_name` sea un
placeholder conocido.

---

## 4. CV (`#/cv`)

Fuente de verdad para cada evaluación, deep research y cover letter.
Vive en `cv.md` en la raíz del padre.

### Edición

- **Pegar directo** — el textarea izquierdo es un editor markdown.
- **📁 Upload CV** — `.md/.markdown/.txt/.html/.htm` (texto plano),
  `.docx/.doc/.odt/.rtf` (vía pandoc — `brew install pandoc`),
  o `.pdf` (vía pdftotext — `brew install poppler`). El servidor
  convierte a markdown, lo sanea, y lo carga en el editor;
  **💾 Save** persiste. Límite: 10 MB.
- **Desde LinkedIn** — abra Claude Code en el padre, ejecute
  `/career-ops`, pegue su URL y pida `extract my CV from this and
  write it to cv.md`.

### Sanitización

`stripDangerousMarkdown` remueve `<script>`, `<iframe>`, `<object>`,
`<embed>`, `<svg>`, `<style>`, `<form>`, manejadores inline (`onclick=`),
y URIs `javascript:`/`vbscript:`/`data:text/html`. Respuesta incluye
`sanitized: true` cuando algo fue tocado. Max 1 MB.

### Otros botones

- **sync-check** — `cv-sync-check.mjs`.
- **📄 Generate PDF** — `generate-pdf.mjs` → `output/*.pdf`. Necesita
  Playwright (Health lo confirma).

### Tips de formato

- Una bullet = un logro con métrica. *"Reducí p99 38%"* gana a
  *"mejoré performance"*.
- Secciones: **Summary**, **Experience**, **Projects**, **Education**,
  **Skills**.
- Bajo 1500 palabras.

---

## 5. Portales y fuentes (`portals.yml`)

Config del scanner. Tres secciones importan:

### `title_filter`

```yaml
title_filter:
  positive: [backend, engineer, senior, tech lead, golang, php]
  negative: [junior, intern, frontend, ios, android, java]
  seniority_boost: [Senior, Staff, Lead, Principal]
```

Una vacante pasa si su title contiene **al menos una positiva** Y
**ninguna negativa**.


`seniority_boost` es la tercera clave de title-filter. Las palabras listadas aquí no filtran nada — empujan los trabajos coincidentes más arriba en los resultados, así un "Senior Backend Engineer" queda por encima de un "Engineer". Por defecto: `["Senior", "Staff", "Lead"]`. Ajusta para que coincida con cómo se titulan tus puestos objetivo.

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

`search_queries` impulsa el scan AI Option B (`/career-ops scan` dentro de Claude Code / Codex). NO los ejecuta el `npm run scan` in-process (que solo consulta APIs públicas de tableros). Úsalos cuando quieras descubrir puestos en empresas que no están aún en `tracked_companies`. Pon `enabled: false` para mantener una entrada sin ejecutarla.

### `tracked_companies`

```yaml
tracked_companies:
  - { name: Stripe,    enabled: true, careers_url: https://job-boards.greenhouse.io/stripe }
  - { name: Linear,    enabled: true, careers_url: https://jobs.ashbyhq.com/linear }
  - { name: JetBrains, enabled: true, careers_url: https://jobs.lever.co/jetbrains }
```

El ATS scanner detecta el ATS por la URL y golpea boards-api directo.

### `russian_portals`

```yaml
russian_portals:
  sources: [hh, habr]
  area: 113                 # 113=Rusia, 1001=remoto
  per_page: 50
  only_remote: false
  queries:
    - "Senior PHP"
    - "Senior Go"
```

`queries` son matches de substring contra titles. **Cuide solapamiento
con la lista negativa** — si `"php"` está en negative y `"Senior PHP"`
en queries, el scan vuelve cero (la consola lo avisa).

### Bootstrap

En primer arranque el server append una sección `russian_portals:`
documentada si falta (idempotente).

---


### Flujo CLI ([career-ops.org/docs/.../scan-job-portals](https://career-ops.org/docs/introduction/guides/scan-job-portals))

Setup canónico de career-ops (ejecutar desde el padre una vez):

```bash
cp templates/portals.example.yml portals.yml
$EDITOR portals.yml
```

`portals.yml` tiene tres secciones; el schema canónico de career-ops.org coincide 1:1 con las tres secciones SPA de arriba:

- **title_filter** — listas de palabras clave `positive`, `negative`, `seniority_boost` (case-insensitive). Una vacante necesita ≥ 1 match `positive` y cero `negative`. `seniority_boost` sube el ranking sin filtrar. Empieza con 3–5 positivas para claridad.
- **tracked_companies** — cada entrada DEBE tener `name` y `careers_url`. Opcional: `api` (endpoint Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday), `enabled: true|false` para incluir/excluir sin borrar.
- **search_queries** — búsquedas web más amplias preconstruidas (LinkedIn / Indeed). Los defaults sirven para la mayoría.

---

## 6. Health (`#/health`)

Cada gate de setup en badges OK / OPTIONAL / FAIL.

### Required (sin esto el sistema no corre)

- `Node version` ≥ 18.
- `Project root` — `CAREER_OPS_ROOT` existe.
- `cv.md`, `config/profile.yml`, `portals.yml`,
  `data/applications.md`, `data/pipeline.md`, `modes/oferta.md`.

### Optional (solo warnings)

- `Profile customized`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`,
  `HH_USER_AGENT`, Playwright, deps del padre, directorios `data/`,
  `reports/`, `output/`, `jds/`.

Cuando `HOST=0.0.0.0` se ocultan rutas absolutas y versión Node
exacta.

### Botones de ejecución

- **▶ Doctor** — `node doctor.mjs`.
- **▶ Verify pipeline** — `node verify-pipeline.mjs`.

---

## 7. Scan (`#/scan`)

El scanner recorre boards habilitados, deduplica contra historia y
escribe hits a `data/last-scan.json` y `data/pipeline.md`.

### Scan de un click

**🌐 Scan** ejecuta cada fuente en una sola pasada (Greenhouse, Ashby,
Lever, hh.ru, Habr Career). Log SSE en vivo a la derecha. **Stop** o
navegar fuera aborta el scan.

### Filtros

- Búsqueda por texto.
- Source dropdown.
- Remote / Hybrid / Onsite.
- Chips de stack (PHP, Go, Backend, Senior…) auto-detectados.
- Chips dinámicos top-25 capitalized tokens.

### Active Companies

Tarjeta colapsable con cada compañía:

- ✓ verde — soporte API directo.
- ○ gris — fallback web-search.

**Click en el nombre** → llena el filtro. **Click en ↗** → abre
`careers_url` en pestaña nueva.

---


### Flujo CLI de scan ([career-ops.org/docs/.../scan-job-portals](https://career-ops.org/docs/introduction/guides/scan-job-portals))

Dos formas de escanear desde el CLI (ambas escriben al mismo `data/pipeline.md` que lee la SPA):

**Option A — script directo (~30 s, cero AI tokens):**

```bash
npm run scan                          # todos los boards Greenhouse/Ashby/Lever
npm run scan -- --dry-run             # preview sin persistir
npm run scan -- --company Anthropic   # una sola compañía
```

Funciona solo para Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday (URLs ATS reconocibles).

**Option B — AI-powered browser scan:**

```
/career-ops scan
```

Dentro de Claude Code / Codex / Cursor / Gemini CLI. Usa tokens del modelo. Visita cada página de `tracked_companies` directamente y puede descubrir boards no-API. Más lento pero más amplio.

**Output (ambos paths)** — nuevos JD URLs añadidos a `data/pipeline.md`, cada URL visitada loggeada en `data/scan-history.tsv` (dedup entre todos los scans futuros).

**Umbrales de acción por score:**

| Score | Siguiente paso |
|---|---|
| **≥ 4.5** | `/career-ops apply` — alto fit |
| **4.0 – 4.4** | aplica o `/career-ops contacto` |
| **3.5 – 3.9** | `/career-ops deep` — investiga primero |
| **< 3.5** | salta salvo razón específica |

---

## 8. Pipeline (`#/pipeline`)

Inbox de URLs por evaluar. Vive en `data/pipeline.md`.

### Agregar URLs

Tres formas:

- Tipear o pegar + **+ Add**.
- **Ctrl+K** / **Cmd+K** para focus en search global, pegar URL,
  Enter.
- Correr Scan — los hits frescos van al pipeline automáticamente.

Cada URL pasa por `isValidJobUrl()`. Loopback, `file://`,
`javascript:`, IP literales, chars de template — todos 400.

### Vista previa server-side

Click en una fila carga preview a la derecha. El servidor proxea,
quita scripts/styles/tags y devuelve hasta 8 KB de texto plano.

El proxy camina los redirects **con validación SSRF por hop** — cada
`Location` re-pasa por `isValidJobUrl()`. Cap 3 hops, timeout 15s.

### Acciones de fila

- **▶** — salta a `#/evaluate?url=…`.
- **✕** — borra del pipeline.

### Botones arriba

- **⚡ Evaluate first** — abre el primer URL en Evaluate.
- **Scan** — vuelve al scanner.

---

## 9. Evaluate (`#/evaluate`)

Puntúa un JD contra `cv.md` y `config/profile.yml`. Devuelve
evaluación A–G y score 0–5.

### Input

Pegue el JD, o llegue desde `#/pipeline` con `?url=…` (la página
fetcha vía el proxy SSRF-safe).

**💾 Save JD** persiste a `jds/jd-<date>-<ts>.txt`.

### Cadena de fallback

1. **Anthropic** — preferida con `ANTHROPIC_API_KEY`. El servidor
   inlinea cv + profile + `_shared.md` + `oferta.md` en un bloque
   `<project_context>` (cada archivo cap 16 KB, prompt soft-cap
   200 KB).
2. **Gemini** — solo con `GEMINI_API_KEY`. Spawnea `gemini-eval.mjs`.
3. **Manual** — sin clave. La página devuelve un prompt listo para
   pegar.

### Salida

A. Role Summary · B. CV Match · C. Risks · D. Compensation · E.
Application Strategy · F. Verdict (0–5 con precisión 0.1) · G.
Posting Legitimacy.

**💾 Save report** persiste el markdown a
`reports/<date>-<company>-<role>.md`.

---

## 10. Reports (`#/reports`)

Cada evaluación guardada. Cards con title, fecha, legitimidad, score
(verde ≥ 4.0, amarillo ≥ 3.0, rojo abajo). Paginación 12/página.

Vista de un solo report:

- **← All reports** — vuelve al grid.
- **🔗 Open JD** — abre el JD original.

---

## 11. Tracker (`#/tracker`)

CRM. Una fila por aplicación. Vive en `data/applications.md` como
tabla GFM.

### Status flow

`Evaluated` → `Applied` → `Responded` → `Interview` → `Offer` /
`Rejected` / `Discarded` / `SKIP`. Whitelist enforced en el server.

### Columnas

| Col | Qué |
|---|---|
| `#` | Auto-numerado. |
| `Date` | ISO. |
| `Company` | Free text. **Pipes y newlines escapados.** |
| `Role` | Igual. |
| `Score` | `N/5`. |
| `Status` | Whitelist. |
| `PDF` | ✅ tras éxito. |
| `Report` | Link a `reports/*.md`. |
| `Notes` | Free text, max 200. |

### Filtros

Status, Score (`≥ 4.0`/`≥ 3.0`/`< 3.0`), Search. 25 filas/página.

### Mantenimiento

- **▶ Normalize** — `normalize-statuses.mjs`.
- **▶ Dedup** — `dedup-tracker.mjs`.
- **▶ Merge** — `merge-tracker.mjs`.

---

## 12. Deep research (`#/deep`)

Genera un informe estructurado de empresa: snapshot, cultura de
ingeniería, news recientes, sentiment Glassdoor, proceso de
entrevistas, palancas de negociación, tres preguntas inteligentes.

### Input

Empresa + (opc.) rol. Plantilla `modes/deep.md`.

### Salida

Misma cadena que Evaluate:

1. **Anthropic live** — `bundleProjectContext` inlinea cv + profile
   + `_shared.md` + `deep.md`. 10–30 KB de markdown guardado a
   `interview-prep/<company>-<role>.md`.
2. **Gemini live** — `gemini-eval.mjs`.
3. **Manual** — prompt listo para Claude Code (con WebFetch +
   WebSearch).

### Tips

- Anthropic en `claude-sonnet-4-6` ~13 KB en 1–3 minutos.
- Anthropic SDK no tiene web search; para news frescas use Claude
  Code manual.
- Costo live ≈ $0.30–0.50 por call.

---

## 13. Mode prompts (siete páginas `/#/<mode>`)

Siete generadores de prompt: **Project** ideas, **Training** plans,
**Follow-up** emails, **Batch** evaluations, **Outreach** a
recruiters, **Interview prep** one-pagers, **Patterns** retrospectivas.
Cada uno envuelve una plantilla `modes/<slug>.md`:

| Página | Slug | Propósito |
|---|---|---|
| `#/project` | `project` | Ajustar un proyecto del portfolio. |
| `#/training` | `training` | Análisis skill-gap → currículum. |
| `#/followup` | `followup` | Draft email post-entrevista. |
| `#/batch` | `batch` | Evaluación batch multi-JD. |
| `#/contacto` | `contacto` | Mensaje outreach a recruiter / referido. |
| `#/interview-prep` | `interview-prep` | One-pager por ronda. |
| `#/patterns` | `patterns` | "¿Qué patrones me hicieron exitoso?" |

### Forma común

Cada página: pequeña forma + **▶ Generate prompt** (manual) +
**⚡ Run live** (cuando hay clave).

**▶ Generate prompt** devuelve el prompt ensamblado con sus valores
JSON-ificados.

**⚡ Run live** envía a Anthropic (o Gemini) con cv + profile +
`_shared.md` inline. Resultado renderizado, copiable, descargable.

---

## 14. Apply checklist (`#/apply`)

Una vez decidido aplicar, el Apply helper genera una checklist de
envío. **NO** auto-rellena formularios — ese flujo queda en
`/career-ops apply` dentro de Claude Code (vía Playwright).

La checklist cubre:

0. Correr `/career-ops apply <url>` en Claude Code.
1. Verificar que el posting siga vivo.
2. Confirmar que el CV está actualizado (sync-check, PDF si ≥ 4.0).
3. Personalizar cover letter / "Why us?" con proof points STAR+R.
4. Responder EEO / sponsorship / start-date con honestidad.
5. Guardar respuestas en `interview-prep/{company}-{role}.md` antes
   de enviar.
6. **NUNCA auto-enviar** — usted (humano) hace click final.
7. Tras submit: agregar fila al tracker.

---


### Flujo CLI completo de apply ([career-ops.org/docs/.../apply-for-a-job](https://career-ops.org/docs/introduction/guides/apply-for-a-job))

Prerequisitos: `/career-ops pipeline` previamente (la JD necesita un evaluation report) · Playwright instalado (`npx playwright install chromium`) recomendado · fallback a WebFetch sin él.

Flujo numerado:

1. **Ejecuta** `/career-ops apply <company>` (ej.: `/career-ops apply Anthropic`). Sin argumento, comparte screenshot del form, texto pegado, o URL en el siguiente turno.
2. **Playwright abre el navegador** automáticamente y lee el form. NO abres el navegador tú.
3. **Respuestas en borrador** vienen como lista numerada en el orden de los campos del form, desde los proof points y STAR stories del report.
4. **Items marcados** apuntan a lo que requiere atención humana — salary anchor, campos de CV ausentes, preguntas opcionales.
5. **Revisas cada respuesta**, llenas el form, y haces clic en **Submit** tú. career-ops nunca clickea Submit.
6. **Confirma envío** en chat:

   ```
   Submitted.
   ```

7. **Actualizaciones automáticas** — el status pasa `Evaluated → Applied` en `data/applications.md`; las respuestas persisten en la Section G del report.
8. **Handoff a tracker:** `/career-ops tracker`.

### Batch evaluate ([career-ops.org/docs/.../batch-evaluate-offers](https://career-ops.org/docs/introduction/guides/batch-evaluate-offers))

Cuando tienes 10+ JDs para evaluar a la vez (el `#/evaluate` uno-por-uno del SPA es impráctico a ese volumen) — usa el batch runner desde CLI:

1. **Edita** `batch/batch-input.tsv` con columnas tab-separadas `id | url | source | notes`. Una fila por JD.
2. **Dry-run** primero: `./batch/batch-runner.sh --dry-run`.
3. **Ejecuta** — secuencial o paralelo:

   ```bash
   ./batch/batch-runner.sh                       # uno a uno
   ./batch/batch-runner.sh --parallel 2          # dos concurrentes
   ./batch/batch-runner.sh --parallel 3
   ./batch/batch-runner.sh --parallel 2 --min-score 4.0
   ```

4. **Retry fallos:** `./batch/batch-runner.sh --retry-failed --max-retries 3`.
5. **Reports** aterrizan en `reports/` (formato `NNN-company-YYYY-MM-DD.md`); summary rows en `batch/tracker-additions/`.
6. **Merge a tracker:** `node merge-tracker.mjs` (o `--dry-run`).

El SPA muestra los reports en `#/reports` y los tracker rows en `#/tracker` — exactamente igual que si los hubieras agregado por `#/evaluate`.

### Setup de Playwright ([career-ops.org/docs/.../set-up-playwright](https://career-ops.org/docs/introduction/guides/set-up-playwright))

Requerido para el form-fill apply y para `📄 Generate PDF` en este SPA. Sin él, apply hace fallback a WebFetch (text-only).

```bash
# desde career-ops root
npm install
npx playwright install chromium
claude mcp add playwright npx @playwright/mcp@latest
npm run doctor
```

Alternativa MCP vía `.claude/settings.local.json`:

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

## 15. Preparación para entrevistas

Fase post-research, pre-interview. Tres artefactos convergen:

1. **Saved deep-research files** en `interview-prep/`. Browse desde
   Deep research.
2. **Patterns mode** (`#/patterns`) — "¿qué patrones se mantienen en
   mis últimas N entrevistas?" Útil con 5+ filas en tracker.
3. **Interview-prep mode** (`#/interview-prep`) — pre-rellena
   one-pager por ronda.

### Workflow recomendado

Para cada entrevista:

1. Re-correr Deep o abrir el archivo guardado el día anterior.
2. `#/interview-prep` — generar one-pager para la ronda específica.
3. System design / coding — `#/training` para refresher 30 min.
4. Compensation — abrir deep-research, jump a "Negotiation leverage."
   Lleve 2–3 datos (Glassdoor band, funding reciente, oferta
   comparable).
5. Behavioral — sacar STAR+R de su `cv.md` que aparezcan en sección B
   del Evaluate.

Tras la entrevista:

1. Actualizar tracker: `Responded` → `Interview` → `Offer`.
2. `#/followup` para draft thank-you.
3. Si hubo info nueva, editar `interview-prep/<company>-<role>.md`
   con `## Post-round notes`.

---

## 16. Activity log + Troubleshooting

### Activity log (`#/activity`)

Audit trail de cada request state-changing. Secretos redacted
on-write — nunca verá el valor real en `data/activity.jsonl`.
Filtros por prefijo de acción. 25 por página; servidor devuelve
hasta 500 eventos.

### Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| Health rojo en `cv.md` | Primer arranque, archivo no existe | `touch $CAREER_OPS_ROOT/cv.md`, refresh. |
| Health rojo en `Profile customized` | `full_name` aún `Jane Smith` | Edite `config/profile.yml`. |
| `hh.ru: HTTP 403` | IP no rusa, sin `HH_USER_AGENT` | Registre app en `dev.hh.ru/admin`, set `HH_USER_AGENT`. |
| `gemini-eval.mjs: ERR_MODULE_NOT_FOUND` | Deps del padre no instaladas | `cd $CAREER_OPS_ROOT && npm install`. |
| Errores en Generate PDF | Playwright no instalado | `npx playwright install chromium`. |
| `EADDRINUSE: 4317` | Instancia vieja corriendo | `pkill -f 'node server/index.mjs'`. |
| LLM live cuelga > 2 min | Prompt enorme o Anthropic lento | Soft-cap 200 KB → 413. |
| Pipeline preview `(unsafe redirect)` | Posting redirige a IP privada / loopback | Es un security feature (REVIEW-B1). |
| Fila tracker rompe la tabla | Pipe en company name pre-v1.9.1 | Update v1.9.1+ (BF-1). |
| `npm test` falla en clone fresco | Tests asumen layout del padre | `CAREER_OPS_ROOT=$(mktemp -d)`. |

Para diagnóstico profundo: ejecute **▶ Doctor** desde Health, copie
output, busque issue en
<https://github.com/Fighter90/career-ops-ui/issues>.
