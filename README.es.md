# career-ops-ui

> Una interfaz web limpia, estilo docs, para la pipeline de búsqueda de empleo con IA [career-ops](https://github.com/santifer/career-ops).
> Busca, evalúa, investiga a fondo, aplica y rastrea cada oferta desde una sola pestaña del navegador — en lugar de saltar entre Claude Code, terminales y archivos markdown.

[English](README.md) | **Español** | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko-KR.md) | [日本語](README.ja.md) | [Русский](README.ru.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

[![tests](https://img.shields.io/badge/tests-427%20passed-brightgreen)](#tests)
[![playwright](https://img.shields.io/badge/playwright-28%20e2e-brightgreen)](#tests)
[![node](https://img.shields.io/badge/node-%E2%89%A518-blue)](#requirements)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![release](https://img.shields.io/badge/release-v1.19.0-blue)](https://github.com/Fighter90/career-ops-ui/releases/tag/v1.19.0)

![career-ops-ui — Centro de Comando](./images/dashboard-en.png)

## Sobre career-ops

[career-ops](https://career-ops.org) es un sistema open-source de búsqueda de empleo que se ejecuta como slash-comandos dentro de cualquier CLI de codificación con IA (Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot CLI). Modelo-agnóstico. Evalúa cada puesto contra tu CV con una rúbrica de seis dimensiones 0.0–5.0, genera CVs en PDF adaptados, y registra cada aplicación localmente — sin cuentas en la nube, sin telemetría, sin auto-envío.

**Este repositorio (career-ops-ui)** es una interfaz web pulida encima del CLI. El CLI sigue siendo dueño del form-fill (vía Playwright MCP) y los slash-comandos; la SPA da una superficie tipo CRM sobre los mismos archivos `cv.md` / `data/applications.md` / `reports/`. Ambos comparten los mismos datos.

**Umbrales de acción por puntuación** (de [career-ops.org/docs](https://career-ops.org/docs)):

| Score | Siguiente paso |
|---|---|
| **≥ 4.5** | `/career-ops apply` — alto fit, aplica de inmediato |
| **4.0 – 4.4** | aplica, o `/career-ops contacto` para presentación cálida |
| **3.5 – 3.9** | `/career-ops deep` — investiga primero |
| **< 3.5** | salta salvo razón específica |

**Guías canónicas** en [career-ops.org/docs](https://career-ops.org/docs):

- [What is career-ops](https://career-ops.org/docs/introduction/what-is-career-ops)
- [Scan job portals](https://career-ops.org/docs/introduction/guides/scan-job-portals)
- [Apply for a job](https://career-ops.org/docs/introduction/guides/apply-for-a-job)
- [Batch-evaluate offers](https://career-ops.org/docs/introduction/guides/batch-evaluate-offers)
- [Set up Playwright](https://career-ops.org/docs/introduction/guides/set-up-playwright)

## Instalación con un solo comando

```bash
curl -fsSL https://raw.githubusercontent.com/Fighter90/career-ops-ui/main/bin/setup.sh | bash
```

Esto clona ambos repos (career-ops + career-ops-ui), instala dependencias, e inicia el servidor en http://127.0.0.1:4317.

---

## ¿Por qué?

[career-ops](https://github.com/santifer/career-ops) es un sistema potente de búsqueda de empleo basado en Claude Code: pegas una oferta → obtienes una puntuación de fit 0-5, un PDF optimizado para ATS, y una entrada en el tracker. Funciona genial dentro de Claude Code, pero los datos viven repartidos entre `cv.md`, `data/applications.md`, `reports/*.md`, `data/pipeline.md`, `portals.yml`, `config/profile.yml` — fácil de perder, difícil de revisar.

`career-ops-ui` pone una UI pulida encima:

- **Explora** el tracker, los reportes y la pipeline como un CRM.
- **Lanza** scans (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday **y** hh.ru / Habr Career) y mira los logs SSE en vivo.
- **Evalúa** una oferta en vivo vía Anthropic (preferida) o Gemini, o consigue un prompt copy-paste para Claude Code si no hay API key configurada.
- **Deep research** de empresas en vivo vía Anthropic SDK con archivos cv / profile / mode inlineados automáticamente.
- **Edita** `cv.md` con vista previa markdown lado a lado y sanitización XSS server-side.
- **Mantén** el sistema: doctor, verify, normalize, dedup, merge — un click cada uno.
- **Multi-CLI:** se opera idénticamente desde Claude Code, Codex, Cursor, Aider o Gemini CLI — los shims `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` apuntan a una única fuente de verdad.

Es puramente aditivo: nada dentro de `career-ops/` se modifica. Tus personalizaciones siguen siendo tuyas.

---

## Inicio rápido

### 1. Instala career-ops primero

```bash
git clone https://github.com/santifer/career-ops.git
cd career-ops
```

Sigue el [onboarding de career-ops](https://github.com/santifer/career-ops#first-run--onboarding) para que existan `cv.md`, `config/profile.yml`, y `portals.yml`.

### 2. Coloca career-ops-ui dentro

```bash
git clone https://github.com/Fighter90/career-ops-ui.git web-ui
```

Tu árbol queda así:

```
career-ops/
├─ cv.md
├─ portals.yml
├─ config/
├─ data/
├─ modes/
├─ reports/
├─ scan.mjs … doctor.mjs … (etc)
└─ web-ui/                 ← este repo
   ├─ bin/start.sh
   ├─ package.json
   ├─ server/
   ├─ public/
   └─ tests/
```

### 3. Inicia

```bash
bash web-ui/bin/start.sh
```

El script:

1. Verifica Node ≥ 18.
2. Hace `npm install` (solo en el primer arranque, dos deps — Express + js-yaml).
3. Inicia el servidor Express en `127.0.0.1:4317`.
4. Abre http://127.0.0.1:4317/ en tu navegador predeterminado.

Puerto / host personalizados:

```bash
PORT=8080 bash web-ui/bin/start.sh
HOST=0.0.0.0 PORT=4317 bash web-ui/bin/start.sh   # expone en LAN
```

Si clonaste el repo en otro lugar (no como `career-ops/web-ui`), apunta a career-ops vía env:

```bash
CAREER_OPS_ROOT=/path/to/career-ops bash bin/start.sh
```

---

## Requisitos

| | |
| --- | --- |
| **Node.js** | ≥ 18 (usa `fetch` nativo, `node:test`) |
| **career-ops** | Clonado y onboarded — ver arriba |
| **Opcional** | `GEMINI_API_KEY` en el `.env` del proyecto padre (modelo free-tier `gemini-2.0-flash`) para evaluación de oferta con un click. Si no, la UI devuelve un prompt copy-paste para Claude. |
| **Opcional** | Ejecuta desde una IP rusa / VPN si hh.ru devuelve 403. Habr Career funciona desde cualquier IP. |
| **Opcional** | Playwright (ya es dep transitiva de career-ops) para la suite de tests e2e. |

---

## Funciones por página

| Página           | Qué hace                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**    | Conteos agregados (apps / pipeline / reports), score promedio, desglose por estado, últimas 5 apps + último reporte. |
| **Scan**         | **🌐 Botón único de Scan** — corre cada fuente habilitada en un solo barrido (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday para EN, hh.ru + Habr Career para RU). Streaming SSE en vivo + tabla de resultados clickeable con badges location / Remote-Hybrid / flag de reubicación / salary / filtros de fuente y chips dinámicos de stack / nivel / keyword. La tarjeta Active-Companies lista cada board rastreado con su estado de API. |
| **Pipeline**     | CRUD sobre `data/pipeline.md`. Proxy de preview server-side (SSRF-safe, validación per-hop de redirects, cap de 8 KB en body). Salta directo de una URL a evaluar. |
| **Evaluate**     | Pega oferta → **Anthropic-first** (preferido cuando ambas claves están presentes), luego Gemini, luego fallback de prompt manual. La ruta Anthropic inlinea cv / profile / `_shared.md` / `oferta.md` automáticamente (REVIEW-A1). Guardar oferta en `jds/` es opcional. |
| **Deep research**| Misma cadena de fallback que Evaluate. Anthropic en vivo devuelve ~10-30 KB de markdown fundamentado guardado en `interview-prep/<company>-<role>.md`. |
| **Modes**        | 7 páginas de mode genéricas (`/#/project`, `/#/training`, `/#/followup`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns`) con el mismo fallback Anthropic / Gemini / manual. |
| **Apply helper** | Genera un checklist de aplicación; el form-fill real con Playwright sigue en `/career-ops apply` dentro de Claude Code. |
| **Tracker**      | Tabla filtrable sobre `data/applications.md` (status, score, texto libre). Botones one-click para `normalize-statuses.mjs` / `dedup-tracker.mjs` / `merge-tracker.mjs`. Los escapes de pipe + newline son GFM-compliant — nombres como `"Acme \| Co"` viajan round-trip sin pérdidas. |
| **Reports**      | Navega y lee cada reporte bajo `reports/` con header parseado (Score / Legitimacy / URL).                          |
| **CV**           | Editor markdown en vivo de `cv.md` con preview lado a lado + one-click `cv-sync-check.mjs` + 📁 Upload CV. Strip XSS server-side al guardar (`<script>`, `javascript:`, handlers `on*=`). |
| **Profile**      | Vista read-only de `config/profile.yml` + arquetipos — resumen UI-friendly.                                       |
| **App settings** | Editor in-UI para keys del `.env` padre: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, overrides de modelo, puerto / host. Secretos enmascarados al leer. |
| **Health**       | Todos los checks de setup en badges OK / OPTIONAL / FAIL + botones para ejecutar `doctor.mjs` y `verify-pipeline.mjs`. |
| **Help**         | Guía de usuario Markdown in-app (`/#/help`), localizada para los 8 idiomas soportados (en / es / pt-BR / ko-KR / ja / ru / zh-CN / zh-TW). |
| **Activity log** | Audit trail de cada request que cambia estado (writes, runs, scans). Secretos redactados. |

Atajos de teclado globales:

- `Ctrl+K` / `Cmd+K` — enfoca la búsqueda global.
- Pegar una URL en la búsqueda global la añade automáticamente a la pipeline.
- `Esc` — cierra cualquier modal abierto.

---

## Scan

Escaneo de portales zero-token que efectivamente devuelve vacantes. **Un botón 🌐 Scan** en la UI ejecuta cada fuente configurada en un único barrido:

- **Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday** — boards-api públicas para cada empresa en `portals.yml::tracked_companies` con un patrón ATS reconocible. La lista incluida cubre Stripe, GitLab, Vercel, Cloudflare, Datadog, Discord, Elastic, Grafana Labs, CockroachDB, Fastly, Twilio, Coinbase, Reddit, Robinhood, Affirm, Lyft, Linear, Supabase, PostHog, Ramp, Modal Labs, Railway, Browserbase, JetBrains — extiende o recorta libremente.
- **hh.ru** — API pública (devuelve 403 desde IPs no-RU; ejecuta desde una IP rusa / VPN, o salta — los 403 repetidos de una fuente se coalescen y la fuente se deshabilita a mitad de run). El servidor incluye un User-Agent por defecto sensato; los power users aún pueden override vía IP rusa / VPN.
- **Habr Career** — scrape HTML de `career.habr.com/vacancies`. Funciona desde cualquier IP, sin auth.

Todas las fuentes pasan por el mismo pipeline: normalize → filter (`title_filter.positive` / `title_filter.negative`) → dedup contra `data/scan-history.tsv` + `data/pipeline.md` + `data/applications.md` → append a `data/pipeline.md` → guarda el set completo de resultados en `data/last-scan.json` para la tabla filtrable de la UI.

Configura vía `portals.yml`:

```yaml
title_filter:
  positive: [backend, engineer, senior, tech lead, golang, php]
  negative: [junior, intern, frontend, ios, android]
tracked_companies:
  - { name: Stripe, enabled: true, careers_url: https://job-boards.greenhouse.io/stripe }
  - { name: Linear, enabled: true, careers_url: https://jobs.ashbyhq.com/linear }
  # ...
russian_portals:
  sources: ["hh", "habr"]   # uno o ambos
  area: 113                  # 1=Moscú, 2=SPb, 113=Rusia, 1001=remote
  per_page: 50
  only_remote: false
  queries: ["Senior PHP", "Senior Go", "Tech Lead"]
```

Todas las fuentes fluyen a través de un único endpoint SSE: `/api/stream/scan?source=ats|regional|both`. El botón **🌐 Scan** de la UI llama `source=both` para que cada adapter (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday + hh.ru + Habr Career) corra en una conexión. Respeta `AbortSignal` al desconectarse el cliente — sin fetches huérfanos.

---

## Arquitectura

```
career-ops-ui/
├─ CLAUDE.md                 # instrucciones de agente a nivel de proyecto (canónicas)
├─ AGENTS.md                 # shim Codex / Aider / CLI genérico → CLAUDE.md
├─ GEMINI.md                 # shim Gemini CLI → CLAUDE.md
├─ .aiignore                 # lista de exclusión para herramientas IA
├─ .claude/                  # config de agente Claude Code
│  ├─ agents/                # 3 subagents específicos del proyecto (route, view, test isolation)
│  └─ commands/               # stubs de slash-comandos
├─ bin/start.sh              # launcher one-shot (check Node → npm install → server → open browser)
├─ package.json              # 2 deps runtime: express, js-yaml
├─ server/
│  ├─ index.mjs              # orquestador ~130 LOC: middleware + 12 llamadas register<Topic>Routes(app) + catch-all SPA
│  └─ lib/
│     ├─ paths.mjs           # rutas absolutas a archivos career-ops (consciente de CAREER_OPS_ROOT)
│     ├─ parsers.mjs         # parsers markdown / pipeline / report (escapes de pipe GFM-compliant)
│     ├─ runner.mjs          # runNodeScript() + streamNodeScript() con escalación SIGTERM→SIGKILL + cap de 30 min
│     ├─ security.mjs        # isValidJobUrl, stripDangerousMarkdown, sanitizeJobDescription, isPubliclyExposed
│     ├─ prompts.mjs         # bundleProjectContext, buildEvaluationPrompt, buildDeepPrompt, buildModePrompt
│     ├─ store.mjs           # safeReadApps/Pipeline/Reports, checkProfileCustomized, ensureRussianPortalsDefaults
│     ├─ anthropic.mjs       # adapter mínimo del Anthropic SDK (runAnthropic, hasAnthropicKey, hasGeminiKey)
│     ├─ env-config.mjs      # round-trip de .env con enmascarado de secretos + validación
│     ├─ activity-log.mjs    # middleware de audit trail JSONL (secretos redactados)
│     ├─ dotenv.mjs          # cargador dotenv minúsculo
│     ├─ en-scanner.mjs      # orquestador in-process Greenhouse/Ashby/Lever (consciente de AbortSignal)
│     ├─ ru-scanner.mjs      # orquestador in-process hh.ru + Habr (consciente de AbortSignal)
│     ├─ sources/
│     │  ├─ greenhouse.mjs   # cliente boards-api.greenhouse.io
│     │  ├─ ashby.mjs        # cliente api.ashbyhq.com
│     │  ├─ lever.mjs        # cliente api.lever.co
│     │  ├─ hh.mjs           # cliente api.hh.ru (consciente de UA)
│     │  └─ habr.mjs         # parser HTML de career.habr.com (sin cheerio, solo regex)
│     └─ routes/             # 12 módulos de rutas — uno por tema (P-2)
│        ├─ activity.mjs     # /api/activity
│        ├─ config.mjs       # /api/config (round-trip al .env padre)
│        ├─ content.mjs      # /api/cv, /api/profile, /api/portals, /api/modes
│        ├─ health.mjs       # /api/health, /api/dashboard
│        ├─ help.mjs         # /api/help/:lang
│        ├─ jds.mjs          # CRUD /api/jds
│        ├─ llm.mjs          # /api/evaluate, /api/deep, /api/mode/:slug, /api/apply-helper, /api/interview-prep*
│        ├─ pipeline.mjs     # /api/pipeline + proxy de preview SSRF-safe
│        ├─ reports.mjs      # /api/reports
│        ├─ runners.mjs      # /api/run/* + /api/stream/{scan,liveness,pdf} + /api/output/pdfs
│        ├─ scan.mjs         # /api/stream/scan-{ru,en} + /api/scan-results
│        └─ tracker.mjs      # /api/tracker
├─ public/                   # SPA estática — sin build step
│  ├─ index.html
│  ├─ css/app.css            # design tokens (paleta docs-style)
│  └─ js/
│     ├─ api.js              # wrapper fetch + estado del banner de conexión + helpers UI + renderer markdown seguro
│     ├─ router.js           # router hash-based con fallback 404 + soporte de alias
│     ├─ app.js              # boot + handlers de teclado globales + drawer mobile sidebar
│     ├─ lib/{i18n,skills}.js
│     └─ views/              # un archivo por página (dashboard, scan, pipeline, evaluate, deep, apply, tracker, reports, cv, settings, health, config, help, activity, mode-page)
├─ docs/                     # referencia pública: arquitectura, API, data-flows, SDD, conventions, reviews
│  ├─ PROJECT.md             # qué / por qué / para quién
│  ├─ ROADMAP.md             # milestone actual + historia completada
│  ├─ PRODUCTION-READINESS.md # assessment honesto de deployment-gate
│  ├─ sdd/{SDD-GUIDE,CONVENTIONS}.md
│  ├─ architecture/{OVERVIEW,SERVER,FRONTEND,API,DATA-FLOWS}.md
│  └─ reviews/REVIEW-*.md
└─ tests/                    # 284 unit + 12 Playwright + 23 e2e:full + 20 e2e:smoke
   ├─ parsers.test.mjs       # parsers markdown / pipeline / report (funciones puras)
   ├─ api.test.mjs           # cada endpoint, server ephemeral, sin red
   ├─ {ru,en}-scanner.test.mjs   # fetch mockeado
   ├─ pipeline-preview.test.mjs   # validación per-hop de redirect (REVIEW-B1)
   ├─ anthropic.test.mjs     # adapter SDK + test log-guard (REVIEW-B4)
   ├─ url-validation.test.mjs    # barrido de reject SSRF (FIX-M3 + M6 + M7)
   ├─ cv-xss.test.mjs        # round-trip stripDangerousMarkdown
   ├─ jd-sanitize.test.mjs   # sanitizeJobDescription
   ├─ help.test.mjs / help-ui.test.mjs    # paridad i18n a través de los 8 locales
   ├─ playwright-smoke.mjs   # 12 flujos de browser (CV save, tracker, pipeline, evaluate, config, etc.)
   └─ e2e{,-comprehensive}.mjs   # walkthrough Playwright completo
```

### ¿Por qué sin build step?

Vanilla HTML/CSS/JS mantiene la superficie de ataque mínima: un `npm install` de dos deps y ya estás corriendo. Sin Webpack, sin Vite, sin `node_modules` infernal. Toda la UI pesa < 30 KB minificada. Si quieres hot-reload durante el desarrollo, `npm run dev` usa el `--watch` nativo de Node.

### Spec-Driven Development

Los cambios no triviales van por la pipeline GSD (skills `gsd-*` de `superpowers@claude-plugins-official`):

```
discuss → spec → plan → execute → verify → review
```

Referencia pública: [`docs/sdd/SDD-GUIDE.md`](docs/sdd/SDD-GUIDE.md). Todos los artefactos de planning viven bajo `.planning/` (gitignored). El árbol `docs/` es el contrato público de larga vida.

---

## Referencia API

Todos los endpoints bajo `/api/*`. JSON in / JSON out salvo nota contraria.

### Health & dashboard

| Método | Path                     | Respuesta                                                                    |
| ------ | ------------------------ | ---------------------------------------------------------------------------- |
| GET    | `/api/health`            | `{ ok, warnings, version, parentVersion, checks: [{name, ok, required, value?}] }` |
| GET    | `/api/dashboard`         | `{ counts, avgScore, byStatus, recent, pipeline, lastReport }`               |
| GET    | `/api/activity?limit&type` | tail del audit trail `data/activity.jsonl`                                 |
| GET    | `/api/help/:lang`        | guía de usuario in-app localizada (fallback: `en.md`)                        |

### App settings (round-trip al .env padre)

| Método | Path             | Propósito                                                              |
| ------ | ---------------- | ---------------------------------------------------------------------- |
| GET    | `/api/config`    | env keys conocidas con secretos enmascarados                           |
| POST   | `/api/config`    | valida + escribe `.env` padre; aplica a `process.env` in-place         |

### Archivos de datos

| Método | Path                                | Propósito                                                              |
| ------ | ----------------------------------- | ---------------------------------------------------------------------- |
| GET    | `/api/tracker`                      | `{ rows: [applications.md parseado] }`                                 |
| POST   | `/api/tracker`                      | body `{ company, role, score?, status?, url?, notes?, date? }` — dedup-aware (case-insensitive en company + role) |
| GET    | `/api/pipeline`                     | `{ urls: [...] }`                                                      |
| POST   | `/api/pipeline`                     | body `{ url }` → añade a `data/pipeline.md` con dedup + `isValidJobUrl` |
| GET    | `/api/pipeline/preview?url=…`       | proxy fetch server-side (check SSRF per-hop, ≤3 redirects, cap 8 KB)   |
| DELETE | `/api/pipeline?url=…`               | elimina una URL                                                        |
| GET    | `/api/reports`                      | lista parseada de `reports/*.md`                                       |
| GET    | `/api/reports/:slug`                | markdown completo + header parseado                                    |
| GET    | `/api/jds`                          | lista de archivos JD guardados                                         |
| GET    | `/api/jds/:name`                    | text/plain — JD raw                                                    |
| POST   | `/api/jds`                          | body `{ text, slug? }` → guarda en `jds/`                              |
| DELETE | `/api/jds/:name`                    | unlink (sufijo `.txt` requerido)                                       |
| GET    | `/api/cv`                           | `{ markdown }`                                                         |
| PUT    | `/api/cv`                           | body `{ markdown }` → escribe `cv.md` (XSS-stripped, ≤1 MB)            |
| GET    | `/api/profile`                      | `{ profile: yaml-parsed, raw: text }`                                  |
| GET    | `/api/portals`                      | `{ portals: yaml-parsed, raw: text }`                                  |
| GET    | `/api/modes`                        | lista de archivos de mode                                              |
| GET    | `/api/modes/:name`                  | text/plain — prompt mode raw                                           |
| GET    | `/api/output/pdfs`                  | lista de PDFs generados                                                |
| GET    | `/api/output/pdfs/:name`            | descarga (`Content-Disposition: attachment`)                          |
| GET    | `/api/interview-prep`               | lista de archivos deep-research guardados                              |
| GET    | `/api/interview-prep/:name`         | `{ name, markdown }`                                                   |
| DELETE | `/api/interview-prep/:name`         | unlink (sufijo `.md` requerido)                                        |

### Script runners (buffered, one-shot)

| Método | Path                    | Envuelve                    |
| ------ | ----------------------- | --------------------------- |
| POST   | `/api/run/doctor`       | `node doctor.mjs`           |
| POST   | `/api/run/verify`       | `node verify-pipeline.mjs`  |
| POST   | `/api/run/normalize`    | `node normalize-statuses.mjs` |
| POST   | `/api/run/dedup`        | `node dedup-tracker.mjs`    |
| POST   | `/api/run/merge`        | `node merge-tracker.mjs`    |
| POST   | `/api/run/sync-check`   | `node cv-sync-check.mjs`    |

Todos los runs buffered tienen cap de 60 s; escalación SIGTERM → SIGKILL tras periodo de gracia de 5 s.

### Streams (SSE)

| Método | Path                          | Streamea                            |
| ------ | ----------------------------- | ----------------------------------- |
| GET    | `/api/stream/scan`            | `node scan.mjs` legacy (subproceso) |
| GET    | `/api/stream/scan?source=ats\|regional\|both` | SSE consolidada del scanner in-process — query: `dryRun=1`, `company=…` (solo ATS). |
| GET    | `/api/stream/liveness`        | `node check-liveness.mjs`           |
| GET    | `/api/stream/pdf`             | `node generate-pdf.mjs`             |

Tipos de evento SSE:

```
event: start    data: { script, args?, writeFiles? }
event: log      data: { stream: "stdout"|"stderr", line: string }
event: done     data: { code, counts?, errors? }
event: error    data: { message }
```

### Endpoints LLM (Anthropic-first → Gemini → fallback manual)

| Método | Path                                | Propósito                                                                        |
| ------ | ----------------------------------- | -------------------------------------------------------------------------------- |
| POST   | `/api/evaluate`                     | body `{ jd, save? }` → evaluación de JD (secciones A–G por `oferta.md`)          |
| POST   | `/api/evaluate/test-gemini`         | smoke check `GEMINI_API_KEY`                                                     |
| POST   | `/api/evaluate/test-anthropic`      | smoke check `ANTHROPIC_API_KEY`                                                  |
| POST   | `/api/deep`                         | body `{ company, role?, run? }` → prompt deep-research o markdown fundamentado en vivo |
| POST   | `/api/mode/:slug`                   | runner genérico de mode; allowlist: `batch`, `contacto`, `followup`, `interview-prep`, `patterns`, `project`, `training` |
| POST   | `/api/apply-helper`                 | body `{ url, jd? }` → checklist de aplicación                                    |
| GET    | `/api/scan-results`                 | `{ en: {when, fresh[], filtered[], errors[]}, ru: { ... } }` — último scan       |
| GET    | `/api/scan/regional/config`         | config efectiva del scanner regional (queries, negatives, sources). |

Cuando se setea `run: true` en `/api/deep` o `/api/mode/:slug`, el servidor prefiere Anthropic (cuando ambas claves están presentes), inlinea `cv.md` + `config/profile.yml` + `modes/_shared.md` + el template de mode relevante en un bloque `<project_context>`, y devuelve el markdown fundamentado del modelo directamente. Cap blando: 200 KB en el prompt ensamblado — overflow devuelve 413.

---

## Tests

```bash
npm test                       # 284 tests unit/integración
npm run test:e2e               # 20 smoke e2e (bootea su propio server)
npm run test:e2e:full          # 23 comprehensive e2e
npm run test:e2e:browser       # 12 Playwright browser-smoke
npm run test:coverage          # igual que `npm test` más cobertura V8
```

| Suite                       | Tests | Qué                                                                                                        |
| --------------------------- | ----- | ---------------------------------------------------------------------------------------------------------- |
| `node --test tests/*.test.mjs` (unit + integración) | **284** | Cada endpoint, server ephemeral, sin red. Incluye parser, scanner (mockeado), runner, anthropic, security headers, XSS, JD sanitize, URL validation, paridad i18n. |
| `tests/e2e.mjs` (smoke)      | 20    | Playwright headless: cada ruta renderiza, flujos básicos.                                                  |
| `tests/e2e-comprehensive.mjs` | 23   | Walkthrough Playwright completo: 11 rutas + 12 flujos funcionales.                                         |
| `tests/playwright-smoke.mjs` (`npm run test:e2e:browser`) | **12** | Smoke con navegador: render del dashboard, navegación, cambio de idioma, 404, health, tracker round-trip (BF-1), pipeline add + barrido de URL inválida, reports vacío, evaluate manual fallback, config keys enmascaradas, CV PUT XSS strip, pipeline preview 400. |
| **Total**                   | **339** | **0 fails, 0 flakes**                                                                                    |

Coverage: ~93% línea / ~83% rama vía `--experimental-test-coverage`.

Los parsers son funciones puras (sin I/O) — testeados contra fragmentos de datos reales de `applications.md`, `pipeline.md`, y `reports/*.md`. Los tests de API bootean el app Express en un puerto ephemeral y ejercitan cada endpoint end-to-end. Los tests del scanner mockean `fetch` para que pasen incluso si hh.ru bloquea tu IP. El Playwright browser smoke corre contra el server in-process y resuelve Playwright vía el `node_modules` del proyecto padre — sin nueva dependencia en `web-ui/`.

CI corre la matriz unit + e2e + Playwright en cada push a `main` contra Node 18 / 20 / 22.

---

## Configuración

Variables de entorno (leídas al inicio del server, todas opcionales salvo donde se indica):

| Var                  | Default            | Propósito                                                                          |
| -------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| `PORT`               | `4317`             | Puerto de bind Express                                                             |
| `HOST`               | `127.0.0.1`        | Host de bind Express. CSP se adjunta cuando es non-loopback; gate de auth planeado para v2.0.0. |
| `CAREER_OPS_ROOT`    | `..` desde script  | Dónde encontrar `cv.md`, `data/`, `portals.yml`, `modes/`, etc.                    |
| `ANTHROPIC_API_KEY`  | unset              | Habilita modo live de `/api/evaluate`, `/api/deep`, `/api/mode/:slug` (preferida cuando ambas claves están seteadas). |
| `ANTHROPIC_MODEL`    | `claude-sonnet-4-6` | Override de modelo Anthropic.                                                     |
| `GEMINI_API_KEY`     | unset              | Forwardeada a `gemini-eval.mjs` y usada como fallback para `/api/evaluate`.        |
| `GEMINI_MODEL`       | `gemini-2.0-flash` | Override de modelo Gemini.                                                         |
| `(server uses default UA)`      | unset              | Override del User-Agent de hh.ru (ayuda a reducir 403 desde IPs no-RU)             |

Extensión de `portals.yml` reconocida por esta UI (añade a tu archivo existente en el proyecto padre):

```yaml
russian_portals:
  sources: ["hh", "habr"]
  area: 113          # id de área hh.ru
  per_page: 50
  only_remote: false
  queries: ["Senior PHP", "Тимлид Go", ...]
```

También puedes extender cualquier entry de empresa con una URL `api:` explícita. Ver [`docs/portals-examples.md`](docs/portals-examples.md) (en este repo) para bloques listos para pegar de 24 empresas verificadas.

---

## Notas de seguridad

- El server hace bind a `127.0.0.1` por defecto — nunca expuesto a internet sin `HOST=0.0.0.0` explícito.
- Todos los inputs de file path desde el cliente se sanitizan (`replace(/[^\w\-.]/g, '')`).
- Las invocaciones de subproceso usan `spawn` con arrays de args — **sin interpolación de shell, jamás**.
- Los endpoints de streaming matan el proceso hijo al desconectarse el cliente (sin scanners huérfanos).
- Los endpoints de write tocan solo paths conocidos de career-ops: `data/`, `jds/`, `cv.md`, `config/`, `portals.yml`, `output/`. Nunca otro lugar.
- El banner de conexión pingea `/api/health` cada 3 s mientras está desconectado y se auto-limpia al recuperarse — sin spam de toasts.

---

## Limitaciones

Los modos fully LLM-driven (`oferta`, `deep`, `contacto`, `apply`, `batch`, `patterns`, `followup`) necesitan un LLM para realmente ejecutar. La web UI te da tres opciones:

1. **Anthropic (preferida)** — setea `ANTHROPIC_API_KEY` en el `.env` del proyecto padre. Routea a través de `runAnthropic` con `cv.md` / `config/profile.yml` / `modes/_shared.md` / template de mode inlineados automáticamente (REVIEW-A1). Verificado en vivo en v1.8.0+ con `claude-sonnet-4-6` devolviendo 26 KB de markdown fundamentado para una llamada deep-research.
2. **`gemini-eval.mjs`** como fallback — funciona out of the box cuando solo `GEMINI_API_KEY` está seteada.
3. **Prompt copy-paste** — cuando ninguna clave está seteada, la UI genera un prompt listo formateado para Claude Code / ChatGPT / Gemini Web.

El flujo existente de form-fill Playwright `/career-ops apply` dentro de Claude Code sigue siendo la única forma de realmente auto-llenar formularios de aplicación — el *Apply helper* de la UI genera un checklist en su lugar.

Para el assessment de production-readiness (gates de deployment, registro de riesgos, trabajo diferido), ver [`docs/PRODUCTION-READINESS.md`](docs/PRODUCTION-READINESS.md). TL;DR: listo para single-tenant loopback; la exposición LAN espera el gate de auth P-12 en v2.0.

---

## Contribuir

Issues y PRs bienvenidos. Reglas de la casa:

- Corre `npm test` antes de pushear — **284 checks green** es el bar (más 12 Playwright si tocas UI).
- Los cambios no triviales van por la pipeline GSD. Ver [`docs/sdd/SDD-GUIDE.md`](docs/sdd/SDD-GUIDE.md).
- No modifiques nada en el proyecto `career-ops/` padre desde dentro de este repo. El punto entero es que esto es un overlay no invasivo. Reglas duras en [`CLAUDE.md`](CLAUDE.md).
- Conventional commits: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`. Scope opcional: `feat(scan):`. Breaking change: `feat!:`.
- Los tests deben ser CI-isolated — bootstrap de fixtures vía `mkdtempSync` o `CAREER_OPS_ROOT=$(mktemp -d)`.

¿Operando el repo desde un CLI no-Claude (Codex, Aider, Cursor, Gemini)? Lee [`AGENTS.md`](AGENTS.md) o [`GEMINI.md`](GEMINI.md) — ambos hacen shim al canónico `CLAUDE.md`.

---

---

## 🌍 Getting Started — primeros pasos tras la instalación

Tras la instalación con un solo comando tienes dos clones git vacíos, andamiados con
archivos starter `cv.md`, `config/profile.yml`, `portals.yml`, `data/applications.md`,
y `data/pipeline.md` que contienen marcadores **EDIT ME**. La página Health
debería estar toda verde en el primer arranque. Reemplaza los placeholders con
tus datos reales:

### 1. Crea tu CV (`cv.md`)

Tienes tres opciones:

- **Opción A — pegar un currículum existente:** abre `career-ops/cv.md`, reemplaza
  los placeholders EDIT-ME con tu currículum real en markdown limpio
  (secciones: Summary, Experience, Projects, Education, Skills). Lo más simple
  mejor — `career-ops` lo lee como texto plano.
- **Opción B — subir desde la UI:** click **CV** en el sidebar →
  **📁 Upload CV** → elige tu archivo `.md` / `.txt` → revisa la preview →
  click **💾 Save**.
- **Opción C — dale tu URL de LinkedIn a Claude Code:** abre Claude Code en
  `career-ops/`, ejecuta `/career-ops`, pega tu URL de LinkedIn, y pide
  *"extrae mi CV de esto y escríbelo a cv.md"*.

Haz cada métrica específica (p.ej. *"reduje la latencia p99 en 38%"* no
*"mejoré el performance"*). La pipeline de evaluación lee métricas directo
de este archivo.

### 2. Edita tu perfil (`config/profile.yml`)

```bash
$EDITOR career-ops/config/profile.yml
```

Reemplaza los placeholders de nombre completo, email, ubicación, LinkedIn, roles
objetivo, arquetipos, target salarial. Los **arquetipos** son el campo más
importante — son cómo cada JD se matchea contra ti.

### 3. Sintoniza el scanner (`portals.yml`)

```bash
$EDITOR career-ops/portals.yml
```

Setea `title_filter.positive` (p.ej. `"PHP"`, `"Go"`, `"Backend"`, `"Senior"`)
y `title_filter.negative` (p.ej. `"Junior"`, `"Java"`, `"iOS"`) a tu
stack y seniority. La lista `tracked_companies` incluida ya tiene
3 boards Greenhouse / Ashby verificados (GitLab, Vercel, Linear). Para 24+ más
bloques listos para pegar, ver [`docs/portals-examples.md`](docs/portals-examples.md).

Si quieres scanning de hh.ru / Habr Career, edita el bloque `russian_portals:`
que creó el setup script — añade tus queries de búsqueda (p.ej. `"Senior PHP"`,
`"Тимлид Go"`).

### 4. (Opcional) Claves de API LLM

La UI prefiere Anthropic sobre Gemini cuando ambas están presentes. Una, otra o
ninguna funciona — sin clave, **Evaluate** devuelve un prompt copy-paste
para Claude Code en su lugar.

```bash
# Anthropic (preferida)
echo "ANTHROPIC_API_KEY=sk-ant-..." >> career-ops/.env
# Gemini (fallback)
echo "GEMINI_API_KEY=AIza..." >> career-ops/.env
```

O configúralas vía la página **App settings** en la UI (`/#/config`) — mismo
archivo, masked-on-read, aplicado a `process.env` inmediatamente.

### 5. Verifica y empieza a trabajar

Refresca la página Health — cada check requerido debería estar verde. Luego:

1. Click **🌐 Scan** → espera ~5 segundos → Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday +
   hh.ru / Habr Career son escaneados, las vacantes aparecen en la tabla debajo.
2. Click en cualquier título → el posting original se abre en una nueva pestaña.
3. Filtra por chips de stack (PHP / Go / Backend / Senior) hasta que veas
   algo prometedor.
4. Copia la URL → pégala en **Pipeline** → click **Evaluate** para
   puntuarla 0-5 en vivo (Anthropic / Gemini) u obtén un prompt manual.
5. Los reportes aterrizan en `reports/`, el tracker en `data/applications.md`,
   deep-research en vivo en `interview-prep/`. Todo visible en la UI.

> Las traducciones de esta guía viven en cada README específico de idioma:
> [English](README.md) · [Português (Brasil)](README.pt-BR.md) ·
> [한국어](README.ko-KR.md) · [日本語](README.ja.md) ·
> [Русский](README.ru.md) · [简体中文](README.zh-CN.md) ·
> [繁體中文](README.zh-TW.md)

---

## Licencia

MIT. Ver [LICENSE](LICENSE).

Construido sobre [career-ops](https://github.com/santifer/career-ops) por [santifer](https://santifer.io). Gracias por la brillante pipeline.
