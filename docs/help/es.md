# Ayuda — career-ops-ui

Recorrido completo por cada página, desde el primer arranque hasta la
preparación para entrevistas. Cada `##` corresponde a una entrada del
sidebar o a una fase del flujo. Lea de arriba a abajo en el primer
arranque; después salte a la sección que necesite mediante el TOC.

> **Para quién:** quien acaba de poner este UI dentro de un checkout
> de `career-ops` y ejecutó `bash bin/start.sh`. No se asume
> conocimiento previo.

---

## 1. Inicio rápido (5 minutos desde cero)

El ciclo completo:

1. **Health** (`#/health`) — confirme que cada chequeo requerido está
   verde. Si falta `cv.md`, `config/profile.yml` o `portals.yml`, la
   página le dice exactamente qué archivo crear.
2. **App settings** (`#/config`) — pegue `ANTHROPIC_API_KEY` y (si
   quiere) `GEMINI_API_KEY`. Las claves se escriben al `.env` del
   proyecto padre, así los scripts career-ops también las leen.
3. **Profile** (`#/profile`) — revise `config/profile.yml` y
   reemplace el nombre de plantilla (`Jane Smith`) por el suyo real.
4. **CV** (`#/cv`) — pegue o suba su currículum. Pulse **💾 Save** —
   el sanitizador del servidor remueve `<script>`, URLs `javascript:`
   y manejadores `on*=` antes de escribir.
5. **Scan** (`#/scan`) — pulse **🌐 Scan** para recorrer cada fuente
   habilitada (Greenhouse / Ashby / Lever para EN, hh.ru / Habr
   Career para RU). El log SSE se transmite en vivo.
6. **Pipeline** (`#/pipeline`) — revise las URLs en cola. Cualquier
   click muestra una vista previa del JD a la derecha.
7. **Evaluate** (`#/evaluate`) — pegue un JD (o pulse **▶ Evaluate**
   desde el pipeline). Con clave Anthropic / Gemini, el modelo lo
   puntúa 0–5 contra su CV y guarda en `reports/`.
8. **Tracker** (`#/tracker`) — cada evaluación obtiene una fila.
9. **Apply checklist** (`#/apply`) — genera una checklist de envío.
10. **Deep research** (`#/deep`) — al decidir aplicar, ejecute el
    informe de la empresa. Se guarda en `interview-prep/`.

---

## 2. App settings & API keys (`#/config`)

Edite el `.env` del proyecto padre desde el navegador. Mismo archivo
que leen los scripts Node, así un guardado se propaga inmediato a
ambos.

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
- **📁 Upload CV** — `.md`, `.txt` o `.html`; **💾 Save** persiste.
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
```

Una vacante pasa si su title contiene **al menos una positiva** Y
**ninguna negativa**.

### `tracked_companies`

```yaml
tracked_companies:
  - { name: Stripe,    enabled: true, careers_url: https://job-boards.greenhouse.io/stripe }
  - { name: Linear,    enabled: true, careers_url: https://jobs.ashbyhq.com/linear }
  - { name: JetBrains, enabled: true, careers_url: https://jobs.lever.co/jetbrains }
```

El EN scanner detecta el ATS por la URL y golpea boards-api directo.

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
