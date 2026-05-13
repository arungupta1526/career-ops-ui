# career-ops-ui

> Interfaz web limpia, estilo docs para la pipeline de búsqueda de empleo con IA [career-ops](https://github.com/santifer/career-ops).
> Buscar, evaluar, investigar a fondo, aplicar y rastrear cada oferta desde una sola pestaña del navegador — en lugar de saltar entre Claude Code, terminales y archivos markdown.

[English](README.md) | **Español** | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko-KR.md) | [日本語](README.ja.md) | [Русский](README.ru.md) | [简体中文](README.cn.md) | [繁體中文](README.zh-TW.md)

[![tests](https://img.shields.io/badge/tests-284%20passed-brightgreen)](README.md#tests)
[![playwright](https://img.shields.io/badge/playwright-12%20smoke-brightgreen)](#tests)
[![node](https://img.shields.io/badge/node-%E2%89%A518-blue)](README.md#requirements)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![release](https://img.shields.io/badge/release-v1.9.1-blue)](https://github.com/Fighter90/career-ops-ui/releases/tag/v1.9.1)

> 📦 **v1.9.1** — Servidor refactorizado a un orquestador de 130 líneas + 12 módulos de rutas en `server/lib/routes/`. Paridad Anthropic en `/api/evaluate` (preferida sobre Gemini cuando ambas claves están presentes). Shims multi-CLI (`AGENTS.md`, `GEMINI.md`) para Codex / Aider / Cursor / Gemini CLI. **284 unit + 12 Playwright smoke tests**. Para la evaluación de production-readiness completa: [`docs/PRODUCTION-READINESS.md`](docs/PRODUCTION-READINESS.md). Listo para deploy single-tenant loopback; el gate de auth para LAN llega en v2.0 (P-12).

![career-ops-ui — vacancy search](./public/images/screen_vacancy_found.png)

## Sobre career-ops

[career-ops](https://career-ops.org) es un sistema open-source de búsqueda de empleo que corre como slash-comandos dentro de cualquier CLI de codificación con IA (Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot CLI). Modelo-agnóstico. Evalúa cada puesto contra tu CV con una rúbrica de seis dimensiones 0.0–5.0, genera CVs PDF adaptados, y registra cada aplicación localmente — sin cuentas en la nube, sin telemetría, sin auto-envío.

**Este repositorio (career-ops-ui)** es una interfaz web pulida encima del CLI. El CLI sigue siendo dueño del form-fill (vía Playwright MCP) y los slash-comandos; la SPA da una superficie tipo CRM sobre los mismos `cv.md` / `data/applications.md` / `reports/`. Datos compartidos.

**Umbrales por score** (de [career-ops.org/docs](https://career-ops.org/docs)):

| Score | Siguiente paso |
|---|---|
| **≥ 4.5** | `/career-ops apply` — alto fit, aplica de inmediato |
| **4.0 – 4.4** | aplica, o `/career-ops contacto` (warm intro) |
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

Este comando clona ambos repositorios (career-ops + career-ops-ui), instala las dependencias e inicia el servidor en http://127.0.0.1:4317.

## ¿Por qué?

[career-ops](https://github.com/santifer/career-ops) es un sistema potente de búsqueda de empleo basado en Claude Code: pegas una oferta → obtienes una puntuación de ajuste 0-5, un PDF optimizado para ATS y una entrada en el tracker. Funciona genial dentro de Claude Code, pero los datos viven repartidos entre `cv.md`, `data/applications.md`, `reports/*.md`, `data/pipeline.md`, `portals.yml`, `config/profile.yml` — fácil de perder, difícil de revisar.

`career-ops-ui` añade una UI pulida encima:

- **Explora** el tracker, los reportes y la pipeline como un CRM.
- **Lanza** scans (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday **y** hh.ru / Habr Career) y mira los logs SSE en vivo.
- **Evalúa** una oferta con la API de Gemini o copia un prompt listo para Claude.
- **Edita** `cv.md` con vista previa markdown lado a lado.
- **Mantén** el sistema: doctor, verify, normalize, dedup, merge — un click cada uno.

Es puramente aditivo: nada dentro de `career-ops/` se modifica. Tus personalizaciones siguen siendo tuyas.

## Funciones por página

| Página           | Qué hace                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**    | Conteos agregados (apps / pipeline / reports), score promedio, desglose por estado, últimas 5 apps + último reporte. |
| **Scan**         | **🌐 Botón único 🌐 Scan** — recorre cada fuente activada en un solo barrido (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday para EN, hh.ru + Habr Career para RU). Streaming SSE en vivo + tabla de resultados con chips de stack/nivel y filtros location / Remote-Hybrid / reloc / source. |
| **Pipeline**     | CRUD sobre `data/pipeline.md`. Salta directo de URL a evaluar.                                                       |
| **Evaluate**     | Pega oferta → si `GEMINI_API_KEY` está activo, ejecuta `gemini-eval.mjs`; si no, devuelve un prompt para Claude.    |
| **Deep research**| Genera el prompt completo de `modes/deep.md` para la empresa/rol indicados.                                         |
| **Apply helper** | Genera un checklist de aplicación; el form-fill real con Playwright sigue en `/career-ops apply` dentro de Claude Code. |
| **Tracker**      | Tabla filtrable sobre `data/applications.md` (estado, score, texto libre). Botones one-click para normalize/dedup/merge. |
| **Reports**      | Navega y lee cada reporte de `reports/` con header parseado (Score / Legitimacy / URL).                              |
| **CV**           | Editor markdown en vivo de `cv.md` con preview lado a lado + sync-check.                                             |
| **Profile**      | Vista read-only de `config/profile.yml` + arquetipos.                                                                |
| **Health**       | Todos los checks de setup en badges OK / OPTIONAL / FAIL + botones para `doctor.mjs` y `verify-pipeline.mjs`.        |

## Requisitos

| | |
| --- | --- |
| **Node.js** | ≥ 18 |
| **career-ops** | Clonado y onboarded |
| **Opcional** | `GEMINI_API_KEY` en `.env` para evaluación de un click |
| **Opcional** | `HH_USER_AGENT` en `.env` si estás fuera de Rusia y quieres que la API de hh.ru deje de devolver 403 |

## Filtros chip por stack y nivel

La tabla de vacantes incluye chips multi-select para:

- **Stack:** PHP, Symfony, Laravel, Go, Rust, Node.js, TypeScript, Python, Ruby, Java, C#/.NET, C++, Backend, Frontend, Fullstack, Microservices, High-load, Distributed, DevOps/SRE, Data, ML/AI, Mobile, Security, Database, Cloud, API
- **Nivel:** Lead/Tech Lead, Architect, Manager, Principal/Staff, Senior, Middle, Junior

Multi-select dentro de cada categoría (OR), intersección entre categorías (AND). Cuentas mostradas; solo aparecen chips con resultados.

## Documentación completa

Para arquitectura completa, referencia API, configuración avanzada y notas de seguridad — ver el [README en inglés](README.md).

## Licencia

MIT. Construido sobre [career-ops](https://github.com/santifer/career-ops) por [santifer](https://santifer.io).

---

## 🌍 Getting Started — primeros pasos tras la instalación

Tras el one-command install tienes dos repos clonados con archivos scaffold (`cv.md`, `config/profile.yml`, `portals.yml`, `data/applications.md`, `data/pipeline.md` con marcadores **EDIT ME**). La página Health debería estar toda verde al primer arranque. Reemplaza los placeholders con tus datos reales:

### 1. Crea tu CV (`cv.md`)

- **A — pega un currículum existente** en `career-ops/cv.md` en markdown limpio.
- **B — sube desde la UI:** click **CV** → **📁 Cargar CV** → elige `.md`/`.txt` → revisa preview → click **💾 Guardar**.
- **C — dale tu LinkedIn a Claude Code:** abre Claude Code, ejecuta `/career-ops`, pide "extrae mi CV y escríbelo a cv.md".

### 2. Edita perfil (`config/profile.yml`)

Reemplaza placeholders: nombre, email, ubicación, LinkedIn, roles objetivo, **arquetipos** (lo más importante), rango salarial.

### 3. Configura scanner (`portals.yml`)

Ajusta `title_filter.positive`/`negative`. Ya hay 3 boards (GitLab, Vercel, Linear). Más en [`docs/portals-examples.md`](docs/portals-examples.md).

### 4. (Opcional) Gemini API key

```bash
echo "GEMINI_API_KEY=tu-clave" >> career-ops/.env
```

### 5. Verifica y empieza

Health → todo verde. **🌐 Buscar en todas las fuentes** → tabla con chips → copia URL → **Pipeline** → **Evaluate**.

Documentación completa (arquitectura, API, seguridad): [README en inglés](README.md).
