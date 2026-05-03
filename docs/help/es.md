# Ayuda — career-ops-ui

Guía paso a paso de cada página. Los nombres coinciden con los del menú lateral izquierdo.

---

## 1. Inicio rápido

El ciclo completo, end-to-end, en cinco minutos:

1. **CV** (`#/cv`) — pega o sube tu currículum en Markdown. Pulsa **💾 Guardar**.
2. **Perfil** (`#/settings`) — edita `config/profile.yml`: nombre, email, salario objetivo, ubicación.
3. **Health** (`#/health`) — verifica que todas las tarjetas obligatorias estén verdes. Las opcionales (Gemini / Anthropic / HH_USER_AGENT) solo importan si quieres usar esas funciones.
4. **Scan** (`#/scan`) — pulsa **🌐 Scan all** para rastrear todos los portales habilitados. O pega una URL via Ctrl+K → Enter.
5. **Pipeline** (`#/pipeline`) — revisa lo que el scanner encoló. Click en cualquier URL para previsualizarla a la derecha. Pulsa **▶ Evaluate** para puntuarla contra tu CV.
6. **Tracker** (`#/tracker`) — todas las evaluaciones aterrizan aquí. Filtra por puntuación, estado, texto. Genera un PDF a medida, envía la solicitud, actualiza el estado.

---

## 2. CV (`#/cv`)

La fuente de verdad para cada evaluación. Botones: **📁 Upload CV**, **sync-check**, **📄 Generate PDF**, **💾 Guardar**. Vista previa en vivo a la derecha.

## 3. Perfil (`#/settings`, también `#/profile`)

Muestra `config/profile.yml` parseado. Edítalo en disco; recarga toma cambios. La página Health flagea valores plantilla como `Jane Smith` con el check **Profile customized**.

## 4. Scan (`#/scan`)

Crawler de portales. **🌐 Scan all** = EN + RU; **🌍 EN scan** = Greenhouse/Ashby/Lever; **🇷🇺 RU scan** = hh.ru + Habr Career (necesita `HH_USER_AGENT`). Filtros por texto, remoto/híbrido/relocación, fuente, chips de tech/nivel.

## 5. Pipeline (`#/pipeline`)

Inbox de URLs. Añade con input + **+ Add** o Ctrl+K. Click en URL → preview server-side a la derecha. Acciones por fila: **▶** Evaluate, **✕** Delete. Filtro en vivo + contador.

## 6. Evaluate (`#/evaluate`)

Puntúa una JD contra `cv.md` + `profile.yml`. Sin API key → manual prompt para Claude Code; con `ANTHROPIC_API_KEY`/`GEMINI_API_KEY` → ejecución server-side y Markdown renderizado. **💾 Save JD** archiva en `jds/*.txt`.

## 7. Deep research (`#/deep`)

Briefing de empresa: equipo, cultura, noticias, palancas de negociación, smart questions. **⚡ Run live** ejecuta y guarda en `interview-prep/{slug}.md`. **▶ Generate prompt** genera prompt manual; **Mostrar resultado** lo re-ejecuta tras configurar la key.

## 8. Apply checklist (`#/apply`)

Checklist listo para pegar. Form-fill real solo en Claude Code: `/career-ops apply <url>`.

## 9. Tracker (`#/tracker`)

Registro de aplicaciones — `data/applications.md`. Filtros por estado / score band / texto. Botones: **Normalize**, **Dedup**, **Merge TSV**.

## 10. Reports (`#/reports`)

Lista de reportes A-G en `reports/`. Click renderiza Markdown (XSS-safe).

## 11. Modes (`#/project`, `#/training`, `#/followup`, `#/batch`, `#/contacto`, `#/interview-prep`, `#/patterns`)

Siete prompt-builders especializados. Mismo UX: rellena form → **▶ Generate prompt** o **⚡ Run live** (con key) → Markdown / 📋 Copy / ⬇ Download.

| Modo | Qué produce |
|---|---|
| **Project** | Scope + signal-fit feedback de una idea de portfolio. |
| **Training** | Decide si un curso/certificación vale tu tiempo. |
| **Follow-up** | Cadencia per-aplicación: cuándo recordar, qué decir. |
| **Batch** | Prompt para `batch/run.mjs` — evaluación paralela. |
| **Outreach** | LinkedIn outreach: contacto correcto + mensaje. |
| **Interview prep** | Prep específico por etapa de entrevista. |
| **Patterns** | Patrones recurrentes en aplicaciones pasadas. |

## 12. Activity (`#/activity`)

Audit log de cada llamada API mutante. JSONL en `data/activity.jsonl`. Chips de filtro por prefijo de acción. Rotación a 5 MB.

## 13. Health (`#/health`)

Diagnóstico de setup. Verde = listo, amarillo = opcional ausente, rojo = obligatorio ausente. Botones **Doctor** + **Verify**.

## 14. Sugerencias de configuración

- **`.env`** — copia de `.env.example`. `ANTHROPIC_API_KEY`/`GEMINI_API_KEY` para ejecución en vivo. `HH_USER_AGENT` para hh.ru.
- **Cambiador de idioma** en el footer del sidebar — 8 locales, persiste en localStorage.
- **Ctrl+K** focusea el buscador global. URL → Enter → pipeline. Texto → Enter → tracker.
- **Esc** cierra cualquier modal.
