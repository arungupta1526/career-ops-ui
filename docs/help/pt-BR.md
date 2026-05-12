# Ajuda — career-ops-ui

Guia completo de cada página, do primeiro arranque até a preparação
para entrevistas. Cada `##` corresponde a uma entrada do sidebar ou
fase do fluxo. Leia de cima a baixo na primeira execução; depois pule
para a seção que precisar via TOC.

> **Para quem:** quem acabou de colocar este UI dentro de um checkout
> de `career-ops` e rodou `bash bin/start.sh`. Não se assume
> conhecimento prévio.


### Sobre o career-ops

[career-ops](https://career-ops.org) é um sistema open-source de busca de emprego que roda como slash-comandos dentro de qualquer CLI de codificação com IA (Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot CLI). Modelo-agnóstico. Avalia cada vaga contra seu CV com uma rubrica de seis dimensões 0.0–5.0, gera CVs PDF adaptados, e registra cada candidatura localmente.

**Princípios** (de [career-ops.org/docs](https://career-ops.org/docs)):

- **Open source, sério** — MIT, sem tier pago, sem lista de espera, sem telemetria, sem contas.
- **Soberania de dados** — `cv.md`, `config/profile.yml`, `data/`, `reports/`, `interview-prep/` não saem da sua máquina a menos que você as envie explicitamente.
- **Humano envia** — career-ops redige as respostas e abre o formulário, mas **você clica em Submit**. Nunca auto-aplica.
- **Busca estruturada** — feito para busca ativa e deliberada, não é um motor de recomendações.

**Conceitos-chave**

| Conceito | O que é |
|---|---|
| **Mode** | Template de prompt sob `modes/<slug>.md`. Built-in: `oferta`, `deep`, `apply`, `pipeline`, `batch`, `contacto`, `followup`, `interview-prep`, `patterns`, `project`, `training`. |
| **Arquétipo** | Perfil de papel-alvo em `config/profile.yml`. A rubrica pondera matches de skills contra o arquétipo ativo — **o campo mais importante**. |
| **Pipeline** | `data/pipeline.md` — inbox de URLs de JD pendentes de avaliação. |
| **Tracker** | `data/applications.md` — tabela GFM histórica de cada avaliação e status. |
| **Report** | `reports/<NNN>-<company>-<DATE>.md` — avaliação A–G completa por JD, com score + legitimidade. |
| **Scan history** | `data/scan-history.tsv` — log append-only; previne duplicatas entre scans. |

### career-ops vs career-ops-ui (este app)

| | career-ops (CLI) | career-ops-ui (este app) |
|---|---|---|
| Onde roda | dentro do Claude Code / Codex / Cursor / Gemini CLI | `http://127.0.0.1:4317` no seu navegador |
| Superfície | slash-comandos `/career-ops <mode>` | sidebar, uma página por workflow |
| Form-fill | sim, via Playwright MCP | não — gera o checklist, você finaliza no CLI |
| PDF | `generate-pdf.mjs` | `📄 Generate PDF` em `#/cv`, `#/reports/:slug`, `#/evaluate`, `#/deep`, `#/interview-prep` |
| Arquivos de dados | compartilhados com career-ops-ui | compartilhados com career-ops |

### Limiares de ação por score

| Score | Próximo passo |
|---|---|
| **≥ 4.5** | `/career-ops apply` — alto fit, candidate-se já. |
| **4.0 – 4.4** | Candidate-se, ou `/career-ops contacto` para warm intro. |
| **3.5 – 3.9** | `/career-ops deep` — pesquise a empresa/papel antes de decidir. |
| **< 3.5** | Pule, a menos que tenha razão específica. |

### Documentação externa

Referência completa do motor career-ops (scanning, rubrica, batch, apply, Playwright) em [career-ops.org/docs](https://career-ops.org/docs):

- [What is career-ops](https://career-ops.org/docs/introduction/what-is-career-ops)
- [Scan job portals](https://career-ops.org/docs/introduction/guides/scan-job-portals)
- [Apply for a job](https://career-ops.org/docs/introduction/guides/apply-for-a-job)
- [Batch-evaluate offers](https://career-ops.org/docs/introduction/guides/batch-evaluate-offers)
- [Set up Playwright](https://career-ops.org/docs/introduction/guides/set-up-playwright)

---

## 1. Início rápido — passo-a-passo de "criar CV" até "candidatado e mensagem enviada"

Playbook canônico botão-a-botão. Siga em ordem na primeira vez.

**A. Setup (uma vez, ~5 min)**

1. Abrir `http://127.0.0.1:4317` (ou `bash bin/start.sh` da raiz).
2. Sidebar **❤ Health** → todas checagens em verde.
3. Sidebar **⚒ App settings** → aba *API keys & runtime* → cole
   `ANTHROPIC_API_KEY` e/ou `GEMINI_API_KEY` → **💾 Save** →
   **▶ Test Anthropic / Gemini**.
4. Mesma página → aba *Profile* → editar `candidate.full_name`,
   `email`, `target.roles`, `target.comp_total_min_usd`,
   `target.archetypes` → **💾 Save**.

**B. CV (uma vez, ~10 min)**

5. Sidebar **✎ CV** — abrir o editor.
6. **📁 Upload CV** → enviar `.docx/.doc/.odt/.rtf/.pdf/.html/.txt
   /.md` (servidor converte e sanitiza) ou colar markdown.
7. **💾 Save** (top-right) — toast "Saved".
8. (Opcional) **📄 Generate PDF** — o PDF mais novo baixa
   automaticamente quando termina.

**C. Encontrar vagas (~2 min por scan)**

9. Sidebar **🌐 Scan** → **🌐 Scan now** → log SSE ao vivo.
10. Click em tag de empresa filtra; ↗ abre a página de carreiras.

**D. Pontuar (~30 s por JD)**

11. Sidebar **Pipeline** — click em uma entrada para preview do JD.
12. **▶ Evaluate** ao lado do JD → modelo pontua 0–5 → relatório
    em `reports/<data>-<slug>.md`.
13. Sidebar **Reports** — revisar relatório; pursuables = short-list.

**E. Decidir + pesquisar a fundo (~3 min)**

14. Sidebar **Deep research** → empresa + cargo → briefing de 7
    seções, salvo em `interview-prep/<empresa>-<cargo>.md`.

**F. Candidatar (~5 min por candidatura)**

15. Sidebar **Apply checklist** → URL + JD → checklist (cover letter,
    keywords, arquivos, **NUNCA auto-submit**).
16. Abrir a página de carreiras em nova aba → enviar manualmente.
17. Sidebar **Outreach** (`#/contacto`) → mensagem LinkedIn / email
    a partir do briefing do passo 14 → personalizar e enviar.

**G. Tracking e follow-up (contínuo)**

18. Sidebar **Tracker** → linha: empresa, cargo, score, status
    `Applied`, links para o relatório e briefing.
19. Uma semana depois: modo **Follow-up** → check-in → status
    `Followed up`.
20. Convite de entrevista: modo **Interview prep** → preparação
    para system design / behavioral / coding.
21. Oferta: atualizar Tracker para `Offer` e revisar a seção comp
    do relatório.

**TL;DR — a ordem do sidebar coincide com o workflow:**
Health → App settings → Profile → CV → Scan → Pipeline → Evaluate →
Reports → Deep research → Apply checklist → Outreach → Tracker →
Follow-up → Interview prep → Activity log.

---

## 2. App settings & API keys (`#/config`)

Duas abas: **API keys & runtime** edita o `.env` do projeto pai
(mesmo arquivo que os scripts Node leem); **Profile** é um editor
YAML direto de `config/profile.yml` que adiciona o cabeçalho canônico
`# Career-Ops Profile Configuration` e valida que exista um
`candidate`. Save em qualquer aba propaga imediato — sem reinicio.

### Chaves reconhecidas

| Chave | O que faz | Onde obter |
|---|---|---|
| `ANTHROPIC_API_KEY` | Habilita chamadas live ao SDK Anthropic. Preferida quando ambas estão set. | <https://console.anthropic.com/settings/keys> |
| `ANTHROPIC_MODEL` | Sobrescreve `claude-sonnet-4-6`. | — |
| `GEMINI_API_KEY` | Fallback. Usado por `gemini-eval.mjs` para `oferta`. | <https://aistudio.google.com/apikey> |
| `GEMINI_MODEL` | Sobrescreve modelo Gemini. | — |
| `HH_USER_AGENT` | Necessário para escanear `hh.ru` fora da Rússia. | dev.hh.ru |
| `PORT` | Porta Express. Default 4317. | — |
| `HOST` | Bind. `0.0.0.0` expõe na LAN — **sem auth gate**. | — |

### Comportamento

- **Leitura** (`GET /api/config`) — chaves secretas mascaradas
  (`sk-ant•••••a1b2`).
- **Save** (`POST /api/config`) — valida, escreve, aplica live.
- **Valor vazio apaga** a chave.

### Smoke-tests

**▶ Test Anthropic** / **▶ Test Gemini** — prompt minúsculo que
confirma que a chave funciona.

---

## 3. Profile (`#/profile` — também acessível como `#/settings`)

View read-only de `config/profile.yml`. Edite o arquivo no disco; a
página re-parse no reload.

Campos chave:

- `candidate.full_name` — usado em cada prompt. **Substitua `Jane
  Smith`** antes de qualquer scan real.
- `candidate.email`, `linkedin`, `github` — usados em cover letters
  e apply checklist.
- `target.roles` — títulos aceitos.
- `target.comp_total_min_usd` — mínimo. Seção D de cada avaliação
  marca ofertas abaixo.
- `target.archetypes` — *campo mais importante*. Cada JD se mede
  contra eles.

Health marca **Profile customized** enquanto `full_name` for
placeholder.

---

## 4. CV (`#/cv`)

Fonte da verdade para cada avaliação, deep research e cover letter.
Vive em `cv.md` na raiz do pai.

### Edição

- **Colar direto** — textarea esquerda é editor markdown.
- **📁 Upload CV** — `.md/.markdown/.txt/.html/.htm` (texto puro),
  `.docx/.doc/.odt/.rtf` (via pandoc — `brew install pandoc`),
  ou `.pdf` (via pdftotext — `brew install poppler`). O servidor
  converte para markdown, sanitiza e carrega no editor;
  **💾 Save** persiste. Limite: 10 MB.
- **Do LinkedIn** — Claude Code no pai, `/career-ops`, cole URL,
  peça `extract my CV from this and write it to cv.md`.

### Sanitização

`stripDangerousMarkdown` remove `<script>`, `<iframe>`, `<object>`,
`<embed>`, `<svg>`, `<style>`, `<form>`, handlers inline (`onclick=`),
URIs `javascript:`/`vbscript:`/`data:text/html`. Resposta inclui
`sanitized: true` quando algo foi removido. Max 1 MB.

### Outros botões

- **sync-check** — `cv-sync-check.mjs`.
- **📄 Generate PDF** — `generate-pdf.mjs` → `output/*.pdf`. Precisa
  Playwright.

### Dicas de formato

- Um bullet = uma conquista com métrica.
- Seções: **Summary**, **Experience**, **Projects**, **Education**,
  **Skills**.
- Abaixo de 1500 palavras.

---

## 5. Portais e fontes (`portals.yml`)

Config do scanner. Três seções importam:

### `title_filter`

```yaml
title_filter:
  positive: [backend, engineer, senior, tech lead, golang, php]
  negative: [junior, intern, frontend, ios, android, java]
```

Vaga passa se title contém **pelo menos uma positiva** E **nenhuma
negativa**.

### `tracked_companies`

```yaml
tracked_companies:
  - { name: Stripe,    enabled: true, careers_url: https://job-boards.greenhouse.io/stripe }
  - { name: Linear,    enabled: true, careers_url: https://jobs.ashbyhq.com/linear }
  - { name: JetBrains, enabled: true, careers_url: https://jobs.lever.co/jetbrains }
```

ATS scanner detecta o ATS pela URL e bate na boards-api direto.

### `russian_portals`

```yaml
russian_portals:
  sources: [hh, habr]
  area: 113                 # 113=Rússia, 1001=remoto
  per_page: 50
  only_remote: false
  queries:
    - "Senior PHP"
    - "Senior Go"
```

Cuidado com sobreposição entre `queries` e a lista negativa — a
console alerta sobre conflitos.

### Bootstrap

No primeiro arranque o servidor adiciona um bloco `russian_portals:`
documentado se faltar (idempotente).

---

## 6. Health (`#/health`)

Cada gate de setup em badges OK / OPTIONAL / FAIL.

### Required

`Node version` ≥ 18, `Project root`, `cv.md`, `config/profile.yml`,
`portals.yml`, `data/applications.md`, `data/pipeline.md`,
`modes/oferta.md`.

### Optional

`Profile customized`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`,
`HH_USER_AGENT`, Playwright, deps do pai, diretórios.

Quando `HOST=0.0.0.0`, paths absolutos e versão Node escondidos.

### Botões

- **▶ Doctor** — `node doctor.mjs`.
- **▶ Verify pipeline** — `node verify-pipeline.mjs`.

---

## 7. Scan (`#/scan`)

Scanner percorre boards habilitados, dedup contra histórico, escreve
hits em `data/last-scan.json` e `data/pipeline.md`.

### One-click

**🌐 Scan** roda cada fonte numa única passagem. Log SSE live à
direita. **Stop** ou navegar fora aborta.

### Filtros

Texto livre, source dropdown, Remote/Hybrid/Onsite, chips de stack
(PHP, Go, Backend, Senior), chips dinâmicos top-25 capitalized.

### Active Companies

Card colapsável: ✓ verde = API direto, ○ cinza = web-search fallback.
**Click no nome** → preenche filtro acima. **Click ↗** → abre
`careers_url` em nova aba.

---

## 8. Pipeline (`#/pipeline`)

Inbox de URLs aguardando avaliação. Em `data/pipeline.md`.

### Adicionar URLs

- Tipar/colar + **+ Add**.
- **Ctrl+K**/**Cmd+K** → search global → colar URL → Enter.
- Run Scan — hits frescos vão automaticamente.

Cada URL passa por `isValidJobUrl()`. Loopback, `file://`,
`javascript:`, IPs literais, chars de template — tudo 400.

### Preview server-side

Click numa linha carrega preview à direita. O servidor proxa, remove
scripts/styles/tags, retorna até 8 KB de texto puro.

Proxy caminha redirects **com validação SSRF por hop**. Cap 3 hops,
timeout 15s.

### Ações de linha

- **▶** — vai para `#/evaluate?url=…`.
- **✕** — remove.

### Botões topo

- **⚡ Evaluate first** — abre o primeiro URL em Evaluate.
- **Scan** — volta ao scanner.

---

## 9. Evaluate (`#/evaluate`)

Pontua um JD contra `cv.md` e `config/profile.yml`. Retorna
avaliação A–G e score 0–5.

### Input

Cole o JD ou chegue de `#/pipeline` com `?url=…`.

**💾 Save JD** persiste em `jds/jd-<date>-<ts>.txt`.

### Cadeia de fallback

1. **Anthropic** — preferida com `ANTHROPIC_API_KEY`.
   `bundleProjectContext` inlineia cv + profile + `_shared.md` +
   `oferta.md`. Soft cap 200 KB.
2. **Gemini** — só com `GEMINI_API_KEY`. Spawn `gemini-eval.mjs`.
3. **Manual** — sem chave. Prompt pronto para copiar.

### Saída

A. Role Summary · B. CV Match · C. Risks · D. Compensation · E.
Application Strategy · F. Verdict (0–5) · G. Posting Legitimacy.

**💾 Save report** salva em `reports/<date>-<company>-<role>.md`.

---

## 10. Reports (`#/reports`)

Cada avaliação salva. Cards com title, data, legitimidade, score
(verde ≥ 4.0, amarelo ≥ 3.0, vermelho abaixo). Paginação 12/página.

Vista de um único: **← All reports**, **🔗 Open JD**.

---

## 11. Tracker (`#/tracker`)

CRM. Uma linha por aplicação. Em `data/applications.md` como tabela
GFM.

### Status flow

`Evaluated` → `Applied` → `Responded` → `Interview` → `Offer` /
`Rejected` / `Discarded` / `SKIP`.

### Colunas

| Col | O que |
|---|---|
| `#` | Auto-numerado. |
| `Date` | ISO. |
| `Company` | Free text. **Pipes e newlines escapados.** |
| `Role` | Igual. |
| `Score` | `N/5`. |
| `Status` | Whitelist. |
| `PDF` | ✅ após sucesso. |
| `Report` | Link para `reports/*.md`. |
| `Notes` | Free text, max 200. |

### Filtros

Status, Score (`≥ 4.0`/`≥ 3.0`/`< 3.0`), Search. 25 linhas/página.

### Manutenção

- **▶ Normalize**, **▶ Dedup**, **▶ Merge**.

---

## 12. Deep research (`#/deep`)

Briefing estruturado: snapshot, cultura de engenharia, news, Glassdoor
sentiment, processo de entrevista, alavancas de negociação, três
perguntas inteligentes.

### Input

Empresa + (opc.) cargo. Template `modes/deep.md`.

### Saída

Mesma cadeia de Evaluate:

1. **Anthropic live** — `bundleProjectContext` inlineia cv + profile
   + `_shared.md` + `deep.md`. 10–30 KB salvos em
   `interview-prep/<company>-<role>.md`.
2. **Gemini live** — `gemini-eval.mjs`.
3. **Manual** — prompt para Claude Code (com WebFetch).

### Dicas

- Anthropic em `claude-sonnet-4-6` ~13 KB em 1–3 min.
- Custo live ≈ $0.30–0.50 por chamada.

---

## 13. Mode prompts (sete páginas `/#/<mode>`)

Sete geradores de prompt: **Project** ideias, **Training** planos,
**Follow-up** emails, **Batch** avaliações, **Outreach** para
recruiters, **Interview prep** one-pagers, **Patterns**
retrospectivas. Cada um envolve um template `modes/<slug>.md`:

| Página | Slug | Propósito |
|---|---|---|
| `#/project` | `project` | Ajustar projeto de portfólio. |
| `#/training` | `training` | Skill-gap → currículo. |
| `#/followup` | `followup` | Draft email pós-entrevista. |
| `#/batch` | `batch` | Avaliação batch multi-JD. |
| `#/contacto` | `contacto` | Mensagem outreach. |
| `#/interview-prep` | `interview-prep` | One-pager por rodada. |
| `#/patterns` | `patterns` | "Que padrões me fizeram bem-sucedido?" |

### Forma comum

Pequena forma + **▶ Generate prompt** (manual) + **⚡ Run live**
(quando há chave). Live envia a Anthropic ou Gemini com cv + profile
+ `_shared.md` inline.

---

## 14. Apply checklist (`#/apply`)

O Apply helper gera uma checklist de envio. **NÃO** auto-preenche
formulários — esse fluxo fica em `/career-ops apply` no Claude Code.

A checklist cobre:

0. Rodar `/career-ops apply <url>` no Claude Code.
1. Verificar que o posting está vivo.
2. Confirmar que o CV está atualizado.
3. Personalizar cover letter / "Why us?" com STAR+R.
4. Responder EEO / sponsorship / start-date com honestidade.
5. Salvar respostas em `interview-prep/{company}-{role}.md`.
6. **NUNCA auto-enviar** — você (humano) clica o botão final.
7. Após submit: adicionar linha ao tracker.

---

## 15. Preparação para entrevistas

Fase pós-research, pré-interview. Três artefatos:

1. **Saved deep-research files** em `interview-prep/`.
2. **Patterns mode** (`#/patterns`) — "que padrões se mantêm em meus
   últimas N entrevistas?"
3. **Interview-prep mode** (`#/interview-prep`) — one-pager por
   rodada.

### Workflow

Para cada entrevista:

1. Re-rodar Deep ou abrir arquivo salvo no dia anterior.
2. `#/interview-prep` — gerar one-pager para a rodada.
3. System design / coding — `#/training` para refresher 30 min.
4. Compensation — abrir deep-research, "Negotiation leverage." 2–3
   datapoints (Glassdoor, funding, oferta comparável).
5. Behavioral — STAR+R do `cv.md` na seção B do Evaluate.

Após a entrevista:

1. Atualizar tracker: `Responded` → `Interview` → `Offer`.
2. `#/followup` para draft.
3. Editar `interview-prep/<company>-<role>.md` com `## Post-round
   notes`.

---

## 16. Activity log + Troubleshooting

### Activity log (`#/activity`)

Audit trail de cada request state-changing. Secretos redacted —
nunca verá valor real em `data/activity.jsonl`. Filtros por prefixo.
25/página; servidor retorna até 500 eventos.

### Troubleshooting

| Sintoma | Causa | Solução |
|---|---|---|
| Health vermelho em `cv.md` | Primeiro arranque | `touch $CAREER_OPS_ROOT/cv.md`, refresh. |
| `Profile customized` falha | `full_name` ainda `Jane Smith` | Edite `config/profile.yml`. |
| `hh.ru: HTTP 403` | IP não-russo, sem `HH_USER_AGENT` | Registre app em `dev.hh.ru/admin`. |
| `gemini-eval.mjs: ERR_MODULE_NOT_FOUND` | Deps do pai não instaladas | `cd $CAREER_OPS_ROOT && npm install`. |
| Erros no Generate PDF | Playwright não instalado | `npx playwright install chromium`. |
| `EADDRINUSE: 4317` | Instância antiga | `pkill -f 'node server/index.mjs'`. |
| LLM live trava > 2 min | Prompt enorme | Soft-cap 200 KB → 413. |
| Pipeline preview `(unsafe redirect)` | Posting redireciona para IP privada | Security feature (REVIEW-B1). |
| Linha tracker quebra tabela | Pipe pre-v1.9.1 | Update v1.9.1+ (BF-1). |
| `npm test` falha em clone fresco | Tests assumem layout do pai | `CAREER_OPS_ROOT=$(mktemp -d)`. |

Para diagnóstico profundo: **▶ Doctor** em Health, copie output,
busque issue em <https://github.com/Fighter90/career-ops-ui/issues>.
