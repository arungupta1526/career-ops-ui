# Ajuda — career-ops-ui

Guia passo-a-passo de cada página. Os nomes correspondem aos do menu lateral esquerdo.

---

## 1. Início rápido

Ciclo completo, end-to-end, em cinco minutos:

1. **CV** (`#/cv`) — cole ou faça upload do seu currículo em Markdown. Clique **💾 Salvar**.
2. **Perfil** (`#/settings`) — edite `config/profile.yml`: nome, email, salário-alvo, localização.
3. **Health** (`#/health`) — verifique que todos os cards obrigatórios estão verdes. Os opcionais (Gemini / Anthropic / HH_USER_AGENT) só importam se quiser usar essas funções.
4. **Scan** (`#/scan`) — clique **🌐 Scan all** para rastrear todos os portais habilitados. Ou cole uma URL via Ctrl+K → Enter.
5. **Pipeline** (`#/pipeline`) — revise o que o scanner enfileirou. Clique em qualquer URL para pré-visualizar à direita. Clique **▶ Evaluate** para pontuar contra seu CV.
6. **Tracker** (`#/tracker`) — toda avaliação chega aqui. Filtre por score, status, texto. Gere um PDF customizado, envie a candidatura, atualize o status.

---

## 2. CV (`#/cv`)

Fonte de verdade para cada avaliação. Botões: **📁 Upload CV**, **sync-check**, **📄 Generate PDF**, **💾 Salvar**. Pré-visualização ao vivo à direita.

## 3. Perfil (`#/settings`, também `#/profile`)

Mostra `config/profile.yml` parseado. Edite no disco; reload pega mudanças. A página Health sinaliza valores template como `Jane Smith` via check **Profile customized**.

## 4. Scan (`#/scan`)

Crawler de portais. **🌐 Scan all** = EN + RU; **🌍 EN scan** = Greenhouse/Ashby/Lever; **🇷🇺 RU scan** = hh.ru + Habr Career (precisa `HH_USER_AGENT`). Filtros por texto, remoto/híbrido/relocação, fonte, chips de tech/nível.

## 5. Pipeline (`#/pipeline`)

Inbox de URLs. Adicione via input + **+ Add** ou Ctrl+K. Clique na URL → preview server-side à direita. Ações por linha: **▶** Evaluate, **✕** Delete. Filtro ao vivo + contador.

## 6. Evaluate (`#/evaluate`)

Pontua uma JD contra `cv.md` + `profile.yml`. Sem API key → manual prompt para Claude Code; com `ANTHROPIC_API_KEY`/`GEMINI_API_KEY` → execução server-side e Markdown renderizado. **💾 Save JD** arquiva em `jds/*.txt`.

## 7. Deep research (`#/deep`)

Briefing de empresa: equipe, cultura, notícias, alavancas de negociação, smart questions. **⚡ Run live** executa e salva em `interview-prep/{slug}.md`. **▶ Generate prompt** gera prompt manual; **Mostrar resultado** re-executa após configurar a key.

## 8. Apply checklist (`#/apply`)

Checklist pronto para colar. Form-fill real só no Claude Code: `/career-ops apply <url>`.

## 9. Tracker (`#/tracker`)

Registro de aplicações — `data/applications.md`. Filtros por status / score band / texto. Botões: **Normalize**, **Dedup**, **Merge TSV**.

## 10. Reports (`#/reports`)

Lista de relatórios A-G em `reports/`. Click renderiza Markdown (XSS-safe).

## 11. Modes (`#/project`, `#/training`, `#/followup`, `#/batch`, `#/contacto`, `#/interview-prep`, `#/patterns`)

Sete prompt-builders especializados. Mesmo UX: preencha form → **▶ Generate prompt** ou **⚡ Run live** (com key) → Markdown / 📋 Copy / ⬇ Download.

| Modo | O que produz |
|---|---|
| **Project** | Scope + signal-fit feedback de uma ideia de portfólio. |
| **Training** | Decide se um curso/certificação vale seu tempo. |
| **Follow-up** | Cadência per-aplicação: quando lembrar, o que dizer. |
| **Batch** | Prompt para `batch/run.mjs` — avaliação paralela. |
| **Outreach** | LinkedIn outreach: contato correto + mensagem. |
| **Interview prep** | Preparação específica por etapa de entrevista. |
| **Patterns** | Padrões recorrentes em aplicações passadas. |

## 12. Activity (`#/activity`)

Audit log de cada chamada API mutante. JSONL em `data/activity.jsonl`. Chips de filtro por prefixo de ação. Rotação a 5 MB.

## 13. Health (`#/health`)

Diagnóstico de setup. Verde = pronto, amarelo = opcional ausente, vermelho = obrigatório ausente. Botões **Doctor** + **Verify**.

## 14. Dicas de configuração

- **`.env`** — copie de `.env.example`. `ANTHROPIC_API_KEY`/`GEMINI_API_KEY` para execução ao vivo. `HH_USER_AGENT` para hh.ru.
- **Trocador de idioma** no footer do sidebar — 8 locales, persiste no localStorage.
- **Ctrl+K** foca a busca global. URL → Enter → pipeline. Texto → Enter → tracker.
- **Esc** fecha qualquer modal.
