# career-ops-ui

> Interface web limpa, estilo docs, para o pipeline de busca de emprego com IA [career-ops](https://github.com/santifer/career-ops).
> Busque, avalie, faça deep-dive, aplique e rastreie cada vaga em uma única aba do navegador — em vez de ficar pulando entre Claude Code, terminais e arquivos markdown.

[English](README.md) | [Español](README.es.md) | **Português (Brasil)** | [한국어](README.ko-KR.md) | [日本語](README.ja.md) | [Русский](README.ru.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

[![tests](https://img.shields.io/badge/tests-427%20passed-brightgreen)](#tests)
[![playwright](https://img.shields.io/badge/playwright-28%20e2e-brightgreen)](#tests)
[![node](https://img.shields.io/badge/node-%E2%89%A518-blue)](#requirements)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![release](https://img.shields.io/badge/release-v1.19.0-blue)](https://github.com/Fighter90/career-ops-ui/releases/tag/v1.19.0)

![career-ops-ui — Centro de Comando](./images/dashboard-pt-BR.png)

## Sobre o career-ops

[career-ops](https://career-ops.org) é um sistema open-source de busca de emprego que roda como slash-comandos dentro de qualquer CLI de codificação com IA (Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot CLI). Modelo-agnóstico. Avalia cada vaga contra o seu CV usando uma rubrica de seis dimensões na escala 0.0–5.0, gera CVs em PDF personalizados e registra cada candidatura localmente — sem contas na nuvem, sem telemetria, sem envio automático.

**Este repositório (career-ops-ui)** é uma interface web polida por cima. O CLI continua responsável pelo preenchimento de formulários (via Playwright MCP) e pelos modos de slash-comando; a SPA oferece uma superfície de navegador estilo CRM sobre os mesmos arquivos `cv.md` / `data/applications.md` / `reports/`. Ambos compartilham os mesmos dados.

**Limiares de ação por score** (de [career-ops.org/docs](https://career-ops.org/docs)):

| Score | Próximo passo |
|---|---|
| **≥ 4.5** | `/career-ops apply` — alto fit, candidate-se já |
| **4.0 – 4.4** | candidate-se, ou `/career-ops contacto` para uma intro quente |
| **3.5 – 3.9** | `/career-ops deep` — pesquise antes |
| **< 3.5** | pule, a menos que tenha um motivo específico |

**Guias canônicos** em [career-ops.org/docs](https://career-ops.org/docs):

- [What is career-ops](https://career-ops.org/docs/introduction/what-is-career-ops)
- [Scan job portals](https://career-ops.org/docs/introduction/guides/scan-job-portals)
- [Apply for a job](https://career-ops.org/docs/introduction/guides/apply-for-a-job)
- [Batch-evaluate offers](https://career-ops.org/docs/introduction/guides/batch-evaluate-offers)
- [Set up Playwright](https://career-ops.org/docs/introduction/guides/set-up-playwright)

## Instalação com um comando

```bash
curl -fsSL https://raw.githubusercontent.com/Fighter90/career-ops-ui/main/bin/setup.sh | bash
```

Esse comando clona os dois repositórios (career-ops + career-ops-ui), instala as dependências e inicia o servidor em http://127.0.0.1:4317.

---

## Por quê?

[career-ops](https://github.com/santifer/career-ops) é um sistema poderoso de busca de emprego baseado em Claude Code: cole uma JD → receba uma nota de aderência 0-5, um PDF otimizado para ATS e uma entrada no tracker. Funciona muito bem dentro do Claude Code, mas os dados ficam espalhados entre `cv.md`, `data/applications.md`, `reports/*.md`, `data/pipeline.md`, `portals.yml`, `config/profile.yml` — fácil de perder, difícil de revisar.

O `career-ops-ui` coloca uma UI bem feita por cima:

- **Navegue** pelo tracker, relatórios e pipeline como em um CRM.
- **Dispare** scans (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday **e** hh.ru / Habr Career) e acompanhe logs SSE ao vivo.
- **Avalie** uma JD em tempo real via Anthropic (preferido) ou Gemini, ou receba um prompt pronto para copiar e colar no Claude Code, caso nenhuma chave de API esteja configurada.
- **Pesquise empresas** ao vivo via Anthropic SDK com cv / profile / arquivos de modo embutidos automaticamente.
- **Edite** `cv.md` com preview markdown lado a lado e sanitização XSS no servidor.
- **Mantenha** o sistema: doctor, verify, normalize, dedup, merge — um clique cada.
- **Multi-CLI:** funciona identicamente a partir do Claude Code, Codex, Cursor, Aider ou Gemini CLI — os shims `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` apontam para uma única fonte da verdade.

É puramente aditivo: nada dentro de `career-ops/` é modificado. Suas customizações continuam suas.

---

## Início rápido

### 1. Instale o career-ops primeiro

```bash
git clone https://github.com/santifer/career-ops.git
cd career-ops
```

Siga o [onboarding do career-ops](https://github.com/santifer/career-ops#first-run--onboarding) para que `cv.md`, `config/profile.yml` e `portals.yml` existam.

### 2. Coloque o career-ops-ui dentro dele

```bash
git clone https://github.com/Fighter90/career-ops-ui.git web-ui
```

Sua árvore agora se parece com:

```
career-ops/
├─ cv.md
├─ portals.yml
├─ config/
├─ data/
├─ modes/
├─ reports/
├─ scan.mjs … doctor.mjs … (etc)
└─ web-ui/                 ← este repositório
   ├─ bin/start.sh
   ├─ package.json
   ├─ server/
   ├─ public/
   └─ tests/
```

### 3. Inicie

```bash
bash web-ui/bin/start.sh
```

O script:

1. Verifica se há Node ≥ 18.
2. Roda `npm install` (apenas na primeira execução, duas dependências — Express + js-yaml).
3. Inicia o servidor Express em `127.0.0.1:4317`.
4. Abre http://127.0.0.1:4317/ no seu navegador padrão.

Porta / host customizados:

```bash
PORT=8080 bash web-ui/bin/start.sh
HOST=0.0.0.0 PORT=4317 bash web-ui/bin/start.sh   # expõe na LAN
```

Se você clonou o repositório em outro lugar (não como `career-ops/web-ui`), aponte para o career-ops via variável de ambiente:

```bash
CAREER_OPS_ROOT=/path/to/career-ops bash bin/start.sh
```

---

## Requisitos

| | |
| --- | --- |
| **Node.js** | ≥ 18 (usa `fetch` nativo, `node:test`) |
| **career-ops** | Clonado e com onboarding feito — veja acima |
| **Opcional** | `GEMINI_API_KEY` no `.env` do projeto pai (modelo free-tier `gemini-2.0-flash`) para avaliação de JD com um clique. Caso contrário, a UI devolve um prompt pronto para colar no Claude. |
| **Opcional** | Rode a partir de um IP / VPN russo se o hh.ru devolver 403. O Habr Career funciona de qualquer IP. |
| **Opcional** | Playwright (já é dependência transitiva do career-ops) para a suíte de testes e2e. |

---

## O que você obtém — por página

| Página           | O que faz                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Dashboard**    | Contadores agregados (apps / pipeline / relatórios), score médio, breakdown por status, últimas 5 apps + último relatório. |
| **Scan**         | **🌐 Botão único de Scan** — percorre todas as fontes habilitadas em uma única passagem (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday para EN, hh.ru + Habr Career para RU). Streaming SSE ao vivo + tabela de resultados clicável com filtros por location / badge Remote-Hybrid / flag de relocation / salário / source e chips dinâmicos por stack / nível / palavra-chave. O card Active-Companies lista cada board rastreado com o status da API. |
| **Pipeline**     | CRUD sobre `data/pipeline.md`. Proxy de preview server-side (SSRF-safe, validação de redirect por hop, cap de 8 KB no body). Pule direto de uma URL para avaliar. |
| **Evaluate**     | Cole a JD → **Anthropic-first** (preferida quando ambas as chaves estão presentes), depois Gemini, depois fallback manual. O caminho Anthropic embute automaticamente cv / profile / `_shared.md` / `oferta.md` (REVIEW-A1). Salvar a JD em `jds/` é opcional. |
| **Deep research**| Mesmo encadeamento de fallback do Evaluate. O Anthropic ao vivo retorna ~10–30 KB de markdown fundamentado, salvo em `interview-prep/<company>-<role>.md`. |
| **Modes**        | 7 páginas de modo genéricas (`/#/project`, `/#/training`, `/#/followup`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns`) com o mesmo fallback Anthropic / Gemini / manual. |
| **Apply helper** | Gera um checklist de candidatura; o form-fill real com Playwright continua em `/career-ops apply` no Claude Code. |
| **Tracker**      | Tabela filtrável sobre `data/applications.md` (status, score, texto livre). Botões one-click para `normalize-statuses.mjs` / `dedup-tracker.mjs` / `merge-tracker.mjs`. Escapes de pipe e newline são GFM-compliant — nomes como `"Acme \| Co"` round-trip sem perda. |
| **Reports**      | Navegue e leia cada relatório em `reports/` com cabeçalho parseado (Score / Legitimacy / URL).                     |
| **CV**           | Editor markdown ao vivo de `cv.md` com preview lado a lado + um clique em `cv-sync-check.mjs` + 📁 Upload de CV. Strip de XSS no servidor ao salvar (`<script>`, `javascript:`, handlers `on*=`). |
| **Profile**      | Visão read-only de `config/profile.yml` + arquétipos — resumo amigável para UI.                                    |
| **App settings** | Editor in-UI para chaves do `.env` do pai: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, overrides de modelo, port / host. Segredos mascarados na leitura. |
| **Health**       | Todos os checks de setup em badges OK / OPTIONAL / FAIL + botões para rodar `doctor.mjs` e `verify-pipeline.mjs`.   |
| **Help**         | Guia do usuário em Markdown dentro do app (`/#/help`), localizado em todos os 8 idiomas suportados (en / es / pt-BR / ko-KR / ja / ru / zh-CN / zh-TW). |
| **Activity log** | Trilha de auditoria de cada request que muda estado (escritas, runs, scans). Segredos redigidos. |

Atalhos globais de teclado:

- `Ctrl+K` / `Cmd+K` — foca na busca global.
- Colar uma URL na busca global a adiciona automaticamente ao pipeline.
- `Esc` — fecha qualquer modal aberto.

---

## Scan

Scanning de portais com zero tokens que de fato retorna vagas. **Um único botão 🌐 Scan** na UI percorre cada fonte configurada em uma única varredura:

- **Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday** — boards-api público para cada empresa em `portals.yml::tracked_companies` com um padrão de ATS reconhecível. A lista bundled cobre Stripe, GitLab, Vercel, Cloudflare, Datadog, Discord, Elastic, Grafana Labs, CockroachDB, Fastly, Twilio, Coinbase, Reddit, Robinhood, Affirm, Lyft, Linear, Supabase, PostHog, Ramp, Modal Labs, Railway, Browserbase, JetBrains — estenda ou reduza à vontade.
- **hh.ru** — API pública (retorna 403 de IPs fora da Rússia; rode a partir de um IP / VPN russo, ou pule — 403s repetidos de uma fonte são coalescidos e a fonte é desabilitada no meio do run). O servidor envia um User-Agent default sensato; power users ainda podem sobrescrever via IP / VPN russo.
- **Habr Career** — scraping HTML de `career.habr.com/vacancies`. Funciona de qualquer IP, sem auth.

Todas as fontes passam pela mesma pipeline: normalize → filter (`title_filter.positive` / `title_filter.negative`) → dedup contra `data/scan-history.tsv` + `data/pipeline.md` + `data/applications.md` → append em `data/pipeline.md` → salva o conjunto completo de resultados em `data/last-scan.json` para a tabela filtrável da UI.

Configure via `portals.yml`:

```yaml
title_filter:
  positive: [backend, engineer, senior, tech lead, golang, php]
  negative: [junior, intern, frontend, ios, android]
tracked_companies:
  - { name: Stripe, enabled: true, careers_url: https://job-boards.greenhouse.io/stripe }
  - { name: Linear, enabled: true, careers_url: https://jobs.ashbyhq.com/linear }
  # ...
russian_portals:
  sources: ["hh", "habr"]   # uma ou ambas
  area: 113                  # 1=Moscou, 2=SPb, 113=Rússia, 1001=remoto
  per_page: 50
  only_remote: false
  queries: ["Senior PHP", "Senior Go", "Tech Lead"]
```

Todas as fontes fluem por um único endpoint SSE: `/api/stream/scan?source=ats|regional|both`. O botão **🌐 Scan** chama `source=both` para que cada adapter (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday + hh.ru + Habr Career) rode em uma única conexão. Respeita `AbortSignal` no desconnect do cliente — sem fetches órfãos.

---

## Arquitetura

```
career-ops-ui/
├─ CLAUDE.md                 # instruções de agente nível projeto (canônico)
├─ AGENTS.md                 # shim para Codex / Aider / CLI genérico → CLAUDE.md
├─ GEMINI.md                 # shim para Gemini CLI → CLAUDE.md
├─ .aiignore                 # lista de exclusão para ferramentas de IA
├─ .claude/                  # config de agentes Claude Code
│  ├─ agents/                # 3 subagentes específicos do projeto (route, view, test isolation)
│  └─ commands/               # stubs de slash-command
├─ bin/start.sh              # launcher one-shot (check Node → npm install → server → abre navegador)
├─ package.json              # 2 deps de runtime: express, js-yaml
├─ server/
│  ├─ index.mjs              # orquestrador de ~130 LOC: middleware + 12 chamadas register<Topic>Routes(app) + SPA catch-all
│  └─ lib/
│     ├─ paths.mjs           # caminhos absolutos para os arquivos do career-ops (aware de CAREER_OPS_ROOT)
│     ├─ parsers.mjs         # parsers de markdown / pipeline / report (escapes de pipe GFM-compliant)
│     ├─ runner.mjs          # runNodeScript() + streamNodeScript() com escalada SIGTERM→SIGKILL + cap de 30 min
│     ├─ security.mjs        # isValidJobUrl, stripDangerousMarkdown, sanitizeJobDescription, isPubliclyExposed
│     ├─ prompts.mjs         # bundleProjectContext, buildEvaluationPrompt, buildDeepPrompt, buildModePrompt
│     ├─ store.mjs           # safeReadApps/Pipeline/Reports, checkProfileCustomized, ensureRussianPortalsDefaults
│     ├─ anthropic.mjs       # adapter mínimo do Anthropic SDK (runAnthropic, hasAnthropicKey, hasGeminiKey)
│     ├─ env-config.mjs      # round-trip de .env com mascaramento de segredos + validação
│     ├─ activity-log.mjs    # middleware de trilha de auditoria JSONL (segredos redigidos)
│     ├─ dotenv.mjs          # loader dotenv minúsculo
│     ├─ en-scanner.mjs      # orquestrador in-process Greenhouse/Ashby/Lever (aware de AbortSignal)
│     ├─ ru-scanner.mjs      # orquestrador in-process hh.ru + Habr (aware de AbortSignal)
│     ├─ sources/
│     │  ├─ greenhouse.mjs   # cliente boards-api.greenhouse.io
│     │  ├─ ashby.mjs        # cliente api.ashbyhq.com
│     │  ├─ lever.mjs        # cliente api.lever.co
│     │  ├─ hh.mjs           # cliente api.hh.ru (UA-aware)
│     │  └─ habr.mjs         # parser HTML de career.habr.com (sem cheerio, só regex)
│     └─ routes/             # 12 módulos de rota — um por tópico (P-2)
│        ├─ activity.mjs     # /api/activity
│        ├─ config.mjs       # /api/config (round-trip do .env do pai)
│        ├─ content.mjs      # /api/cv, /api/profile, /api/portals, /api/modes
│        ├─ health.mjs       # /api/health, /api/dashboard
│        ├─ help.mjs         # /api/help/:lang
│        ├─ jds.mjs          # CRUD de /api/jds
│        ├─ llm.mjs          # /api/evaluate, /api/deep, /api/mode/:slug, /api/apply-helper, /api/interview-prep*
│        ├─ pipeline.mjs     # /api/pipeline + proxy de preview SSRF-safe
│        ├─ reports.mjs      # /api/reports
│        ├─ runners.mjs      # /api/run/* + /api/stream/{scan,liveness,pdf} + /api/output/pdfs
│        ├─ scan.mjs         # /api/stream/scan-{ru,en} + /api/scan-results
│        └─ tracker.mjs      # /api/tracker
├─ public/                   # SPA estática — sem build step
│  ├─ index.html
│  ├─ css/app.css            # tokens de design (paleta estilo docs)
│  └─ js/
│     ├─ api.js              # wrapper de fetch + estado de connection-banner + helpers de UI + renderer markdown seguro
│     ├─ router.js           # router baseado em hash com fallback 404 + suporte a alias
│     ├─ app.js              # boot + handlers globais de teclado + drawer mobile da sidebar
│     ├─ lib/{i18n,skills}.js
│     └─ views/              # um arquivo por página (dashboard, scan, pipeline, evaluate, deep, apply, tracker, reports, cv, settings, health, config, help, activity, mode-page)
├─ docs/                     # referência pública: arquitetura, API, fluxos de dados, SDD, convenções, reviews
│  ├─ PROJECT.md             # o que / por que / para quem
│  ├─ ROADMAP.md             # milestone atual + histórico concluído
│  ├─ PRODUCTION-READINESS.md # avaliação honesta de deployment-gate
│  ├─ sdd/{SDD-GUIDE,CONVENTIONS}.md
│  ├─ architecture/{OVERVIEW,SERVER,FRONTEND,API,DATA-FLOWS}.md
│  └─ reviews/REVIEW-*.md
└─ tests/                    # 284 unit + 12 Playwright + 23 e2e:full + 20 e2e:smoke
   ├─ parsers.test.mjs       # parsers de markdown / pipeline / report (funções puras)
   ├─ api.test.mjs           # cada endpoint, servidor efêmero, sem rede
   ├─ {ru,en}-scanner.test.mjs   # fetch mockado
   ├─ pipeline-preview.test.mjs   # validação de redirect por hop (REVIEW-B1)
   ├─ anthropic.test.mjs     # adapter do SDK + teste de log-guard (REVIEW-B4)
   ├─ url-validation.test.mjs    # varredura de rejeição SSRF (FIX-M3 + M6 + M7)
   ├─ cv-xss.test.mjs        # round-trip de stripDangerousMarkdown
   ├─ jd-sanitize.test.mjs   # sanitizeJobDescription
   ├─ help.test.mjs / help-ui.test.mjs    # paridade i18n em todos os 8 locales
   ├─ playwright-smoke.mjs   # 12 fluxos de navegador (CV save, tracker, pipeline, evaluate, config, etc.)
   └─ e2e{,-comprehensive}.mjs   # walkthrough Playwright completo
```

### Por que sem build step?

HTML/CSS/JS vanilla mantém a superfície minúscula: um `npm install` de duas dependências e você está rodando. Sem Webpack, sem Vite, sem `node_modules` infernal. A UI inteira tem < 30 KB minificada. Se você quer hot-reload durante o desenvolvimento, `npm run dev` usa o `--watch` nativo do Node.

### Spec-Driven Development

Mudanças não-triviais passam pela pipeline GSD (skills `gsd-*` de `superpowers@claude-plugins-official`):

```
discuss → spec → plan → execute → verify → review
```

Referência pública: [`docs/sdd/SDD-GUIDE.md`](docs/sdd/SDD-GUIDE.md). Todos os artefatos de planejamento ficam em `.planning/` (gitignored). A árvore `docs/` é o contrato público de longo prazo.

---

## Referência da API

Todos os endpoints sob `/api/*`. JSON in / JSON out salvo indicação em contrário.

### Health & dashboard

| Método | Path                     | Resposta                                                                    |
| ------ | ------------------------ | --------------------------------------------------------------------------- |
| GET    | `/api/health`            | `{ ok, warnings, version, parentVersion, checks: [{name, ok, required, value?}] }` |
| GET    | `/api/dashboard`         | `{ counts, avgScore, byStatus, recent, pipeline, lastReport }`              |
| GET    | `/api/activity?limit&type` | tail da trilha de auditoria `data/activity.jsonl`                         |
| GET    | `/api/help/:lang`        | guia do usuário in-app localizado (fallback: `en.md`)                       |

### App settings (round-trip do .env do pai)

| Método | Path             | Propósito                                                              |
| ------ | ---------------- | ---------------------------------------------------------------------- |
| GET    | `/api/config`    | chaves de env conhecidas, com segredos mascarados                      |
| POST   | `/api/config`    | valida + escreve no `.env` do pai; aplica a `process.env` in-place     |

### Arquivos de dados

| Método | Path                                | Propósito                                                              |
| ------ | ----------------------------------- | ---------------------------------------------------------------------- |
| GET    | `/api/tracker`                      | `{ rows: [applications.md parseado] }`                                 |
| POST   | `/api/tracker`                      | body `{ company, role, score?, status?, url?, notes?, date? }` — com dedup (case-insensitive em company + role) |
| GET    | `/api/pipeline`                     | `{ urls: [...] }`                                                      |
| POST   | `/api/pipeline`                     | body `{ url }` → adiciona em `data/pipeline.md` com dedup + `isValidJobUrl` |
| GET    | `/api/pipeline/preview?url=…`       | proxy de fetch server-side (check SSRF por hop, ≤3 redirects, cap de 8 KB) |
| DELETE | `/api/pipeline?url=…`               | remove uma URL                                                         |
| GET    | `/api/reports`                      | lista parseada de `reports/*.md`                                       |
| GET    | `/api/reports/:slug`                | markdown completo + cabeçalho parseado                                 |
| GET    | `/api/jds`                          | lista de arquivos JD salvos                                            |
| GET    | `/api/jds/:name`                    | text/plain — JD raw                                                    |
| POST   | `/api/jds`                          | body `{ text, slug? }` → salva em `jds/`                               |
| DELETE | `/api/jds/:name`                    | unlink (sufixo `.txt` obrigatório)                                     |
| GET    | `/api/cv`                           | `{ markdown }`                                                         |
| PUT    | `/api/cv`                           | body `{ markdown }` → escreve `cv.md` (XSS-stripped, ≤1 MB)            |
| GET    | `/api/profile`                      | `{ profile: yaml parseado, raw: text }`                                |
| GET    | `/api/portals`                      | `{ portals: yaml parseado, raw: text }`                                |
| GET    | `/api/modes`                        | lista de arquivos de modo                                              |
| GET    | `/api/modes/:name`                  | text/plain — prompt de modo raw                                        |
| GET    | `/api/output/pdfs`                  | lista de PDFs gerados                                                  |
| GET    | `/api/output/pdfs/:name`            | download (`Content-Disposition: attachment`)                          |
| GET    | `/api/interview-prep`               | lista de arquivos de deep-research salvos                              |
| GET    | `/api/interview-prep/:name`         | `{ name, markdown }`                                                   |
| DELETE | `/api/interview-prep/:name`         | unlink (sufixo `.md` obrigatório)                                      |

### Runners de script (buffered, one-shot)

| Método | Path                    | Wrap                        |
| ------ | ----------------------- | --------------------------- |
| POST   | `/api/run/doctor`       | `node doctor.mjs`           |
| POST   | `/api/run/verify`       | `node verify-pipeline.mjs`  |
| POST   | `/api/run/normalize`    | `node normalize-statuses.mjs` |
| POST   | `/api/run/dedup`        | `node dedup-tracker.mjs`    |
| POST   | `/api/run/merge`        | `node merge-tracker.mjs`    |
| POST   | `/api/run/sync-check`   | `node cv-sync-check.mjs`    |

Todos os runs buffered têm cap de 60 s; escalada SIGTERM → SIGKILL após um período de graça de 5 s.

### Streams (SSE)

| Método | Path                          | Streams                            |
| ------ | ----------------------------- | ---------------------------------- |
| GET    | `/api/stream/scan`            | `node scan.mjs` legacy (subprocess) |
| GET    | `/api/stream/scan?source=ats\|regional\|both` | SSE consolidada do scanner in-process — query: `dryRun=1`, `company=…` (apenas ATS). |
| GET    | `/api/stream/liveness`        | `node check-liveness.mjs`          |
| GET    | `/api/stream/pdf`             | `node generate-pdf.mjs`            |

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
| POST   | `/api/evaluate`                     | body `{ jd, save? }` → avaliação de JD (seções A–G conforme `oferta.md`)         |
| POST   | `/api/evaluate/test-gemini`         | smoke check de `GEMINI_API_KEY`                                                  |
| POST   | `/api/evaluate/test-anthropic`      | smoke check de `ANTHROPIC_API_KEY`                                               |
| POST   | `/api/deep`                         | body `{ company, role?, run? }` → prompt de deep-research ou markdown fundamentado ao vivo |
| POST   | `/api/mode/:slug`                   | runner genérico de modo; allowlist: `batch`, `contacto`, `followup`, `interview-prep`, `patterns`, `project`, `training` |
| POST   | `/api/apply-helper`                 | body `{ url, jd? }` → checklist de candidatura                                   |
| GET    | `/api/scan-results`                 | `{ en: {when, fresh[], filtered[], errors[]}, ru: { ... } }` — último scan       |
| GET    | `/api/scan/regional/config`         | config efetiva do scanner regional (queries, negatives, sources). |

Quando `run: true` é definido em `/api/deep` ou `/api/mode/:slug`, o servidor prefere Anthropic (quando ambas as chaves estão presentes), embute `cv.md` + `config/profile.yml` + `modes/_shared.md` + o template de modo relevante em um bloco `<project_context>`, e retorna o markdown fundamentado do modelo direto. Soft cap: 200 KB no prompt montado — overflow retorna 413.

---

## Testes

```bash
npm test                       # 284 testes unit/integration
npm run test:e2e               # 20 smoke e2e (sobe o próprio server)
npm run test:e2e:full          # 23 e2e comprehensive
npm run test:e2e:browser       # 12 Playwright browser-smoke
npm run test:coverage          # mesmo que `npm test` mais V8 coverage
```

| Suíte                       | Testes | O que                                                                                                      |
| --------------------------- | ----- | ---------------------------------------------------------------------------------------------------------- |
| `node --test tests/*.test.mjs` (unit + integration) | **284** | Cada endpoint, servidor efêmero, sem rede. Inclui parser, scanner (mockado), runner, anthropic, security headers, XSS, JD sanitize, validação de URL, paridade i18n. |
| `tests/e2e.mjs` (smoke)      | 20    | Playwright headless: cada rota renderiza, fluxos básicos.                                                  |
| `tests/e2e-comprehensive.mjs` | 23    | Walkthrough Playwright completo: 11 rotas + 12 fluxos funcionais.                                          |
| `tests/playwright-smoke.mjs` (`npm run test:e2e:browser`) | **12** | Browser-driven smoke: render do dashboard, navegação, troca de idioma, 404, health, round-trip do tracker (BF-1), pipeline add + varredura de URL inválida, reports vazio, evaluate fallback manual, config com chaves mascaradas, CV PUT XSS strip, pipeline preview 400. |
| **Total**                   | **339** | **0 falhas, 0 flakes**                                                                                   |

Cobertura: ~93% linha / ~83% branch via `--experimental-test-coverage`.

Parsers são funções puras (sem I/O) — testados contra fragmentos reais de `applications.md`, `pipeline.md` e `reports/*.md`. Os testes de API sobem o app Express em uma porta efêmera e exercem cada endpoint end-to-end. Testes do scanner mockam `fetch` para passarem mesmo se o hh.ru bloquear seu IP. O smoke browser Playwright roda contra o server in-process e resolve o Playwright via `node_modules` do projeto pai — nenhuma nova dependência em `web-ui/`.

A CI roda a matriz unit + e2e + Playwright em cada push para `main` contra Node 18 / 20 / 22.

---

## Configuração

Variáveis de ambiente (lidas no start do server, todas opcionais salvo indicação):

| Var                  | Default            | Propósito                                                                          |
| -------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| `PORT`               | `4317`             | Porta de bind do Express                                                           |
| `HOST`               | `127.0.0.1`        | Host de bind do Express. CSP é anexado quando não-loopback; gate de auth planejado para v2.0.0. |
| `CAREER_OPS_ROOT`    | `..` a partir do script | Onde achar `cv.md`, `data/`, `portals.yml`, `modes/`, etc.                    |
| `ANTHROPIC_API_KEY`  | unset              | Habilita o modo live em `/api/evaluate`, `/api/deep`, `/api/mode/:slug` (preferido quando ambas as chaves estão setadas). |
| `ANTHROPIC_MODEL`    | `claude-sonnet-4-6` | Override do modelo Anthropic.                                                     |
| `GEMINI_API_KEY`     | unset              | Encaminhado para `gemini-eval.mjs` e usado como fallback para `/api/evaluate`.     |
| `GEMINI_MODEL`       | `gemini-2.0-flash` | Override do modelo Gemini.                                                         |
| `(server uses default UA)`      | unset              | Override do User-Agent do hh.ru (ajuda a reduzir 403 de IPs não-RU)     |

Extensão de `portals.yml` reconhecida por esta UI (adicione ao seu arquivo existente no projeto pai):

```yaml
russian_portals:
  sources: ["hh", "habr"]
  area: 113          # id de área do hh.ru
  per_page: 50
  only_remote: false
  queries: ["Senior PHP", "Тимлид Go", ...]
```

Você também pode estender qualquer entrada de empresa com uma URL `api:` explícita. Veja [`docs/portals-examples.md`](docs/portals-examples.md) (neste repositório) para blocos prontos para colar de 24 empresas verificadas.

---

## Notas de segurança

- O servidor faz bind em `127.0.0.1` por default — nunca exposto à internet sem `HOST=0.0.0.0` explícito.
- Todos os inputs de path de arquivo do cliente são sanitizados (`replace(/[^\w\-.]/g, '')`).
- Invocações de subprocess usam `spawn` com arrays de args — **nunca há interpolação de shell**.
- Endpoints de streaming matam o processo filho no desconnect do cliente (sem scanners órfãos).
- Endpoints de escrita tocam apenas paths conhecidos do career-ops: `data/`, `jds/`, `cv.md`, `config/`, `portals.yml`, `output/`. Nunca em outro lugar.
- O connection banner faz ping em `/api/health` a cada 3 s enquanto desconectado e auto-limpa na recuperação — sem spam de toast.

---

## Limitações

Os modos totalmente LLM-driven (`oferta`, `deep`, `contacto`, `apply`, `batch`, `patterns`, `followup`) precisam de um LLM para de fato rodar. A web UI oferece três opções:

1. **Anthropic (preferido)** — defina `ANTHROPIC_API_KEY` no `.env` do projeto pai. Roteia via `runAnthropic` com `cv.md` / `config/profile.yml` / `modes/_shared.md` / template de modo embutidos automaticamente (REVIEW-A1). Verificado ao vivo em v1.8.0+ com `claude-sonnet-4-6` retornando 26 KB de markdown fundamentado para uma chamada de deep-research.
2. **`gemini-eval.mjs`** como fallback — funciona out-of-the-box quando apenas `GEMINI_API_KEY` está setada.
3. **Prompt copy-paste** — quando nenhuma chave está setada, a UI gera um prompt pronto formatado para Claude Code / ChatGPT / Gemini Web.

O fluxo existente `/career-ops apply` com Playwright dentro do Claude Code continua sendo a única forma de realmente preencher formulários de candidatura automaticamente — o *Apply helper* da UI gera um checklist no lugar.

Para a avaliação de production-readiness (deployment gates, registro de riscos, trabalho diferido), veja [`docs/PRODUCTION-READINESS.md`](docs/PRODUCTION-READINESS.md). TL;DR: pronto para single-tenant loopback; exposição LAN aguarda o gate de auth P-12 em v2.0.

---

## Contribuir

Issues e PRs são bem-vindos. Regras da casa:

- Rode `npm test` antes de fazer push — **284 checks verdes** é a barra (mais 12 Playwright se você mexer na UI).
- Mudanças não-triviais passam pela pipeline GSD. Veja [`docs/sdd/SDD-GUIDE.md`](docs/sdd/SDD-GUIDE.md).
- Não modifique nada no projeto pai `career-ops/` a partir de dentro deste repositório. O ponto principal é que este é um overlay não-invasivo. Hard rules em [`CLAUDE.md`](CLAUDE.md).
- Conventional commits: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`. Escopo opcional: `feat(scan):`. Breaking change: `feat!:`.
- Testes devem ser CI-isolated — bootstrap de fixtures via `mkdtempSync` ou `CAREER_OPS_ROOT=$(mktemp -d)`.

Dirigindo o repositório a partir de um CLI não-Claude (Codex, Aider, Cursor, Gemini)? Leia [`AGENTS.md`](AGENTS.md) ou [`GEMINI.md`](GEMINI.md) — ambos são shims para o `CLAUDE.md` canônico.

---

---

## 🌍 Getting Started — primeiros passos após instalação

Após o one-command install você tem dois clones git vazios, com scaffold dos
arquivos starter `cv.md`, `config/profile.yml`, `portals.yml`, `data/applications.md`
e `data/pipeline.md` contendo marcadores **EDIT ME**. A página Health
já deve estar toda verde no primeiro launch. Substitua os placeholders
pelos seus dados reais:

### 1. Crie o seu CV (`cv.md`)

Você tem três opções:

- **Opção A — cole um currículo existente:** abra `career-ops/cv.md`, substitua
  os placeholders EDIT-ME pelo seu currículo real em markdown limpo
  (seções: Summary, Experience, Projects, Education, Skills). Quanto mais simples,
  melhor — `career-ops` o lê como texto puro.
- **Opção B — faça upload pela UI:** clique em **CV** na sidebar →
  **📁 Upload CV** → escolha o seu arquivo `.md` / `.txt` → revise o preview →
  clique em **💾 Save**.
- **Opção C — passe a sua URL do LinkedIn ao Claude Code:** abra o Claude Code em
  `career-ops/`, rode `/career-ops`, cole a sua URL do LinkedIn e peça
  *"extraia o meu CV disso e escreva em cv.md"*.

Deixe cada métrica específica (ex.: *"reduzi p99 de latência em 38%"*, não
*"melhorei a performance"*). A pipeline de avaliação lê métricas direto
desse arquivo.

### 2. Edite o seu profile (`config/profile.yml`)

```bash
$EDITOR career-ops/config/profile.yml
```

Substitua os placeholders de nome completo, email, localização, LinkedIn, vagas-alvo,
arquétipos, salário-alvo. Os **arquétipos** são o campo mais importante
— é assim que cada JD é cruzada contra você.

### 3. Afine o scanner (`portals.yml`)

```bash
$EDITOR career-ops/portals.yml
```

Defina `title_filter.positive` (ex.: `"PHP"`, `"Go"`, `"Backend"`, `"Senior"`)
e `title_filter.negative` (ex.: `"Junior"`, `"Java"`, `"iOS"`) conforme a sua
stack e senioridade. A lista bundled de `tracked_companies` já inclui
3 boards Greenhouse / Ashby verificados (GitLab, Vercel, Linear). Para 24+
outros blocos prontos para colar, veja [`docs/portals-examples.md`](docs/portals-examples.md).

Se quiser scanning de hh.ru / Habr Career, edite o bloco `russian_portals:`
que o script de setup criou — adicione as suas queries de busca (ex.: `"Senior PHP"`,
`"Тимлид Go"`).

### 4. (Opcional) Chaves de API de LLM

A UI prefere Anthropic sobre Gemini quando ambas estão presentes. Qualquer uma das duas
(ou nenhuma) funciona — sem chave, o **Evaluate** retorna um prompt copy-paste
para Claude Code.

```bash
# Anthropic (preferida)
echo "ANTHROPIC_API_KEY=sk-ant-..." >> career-ops/.env
# Gemini (fallback)
echo "GEMINI_API_KEY=AIza..." >> career-ops/.env
```

Ou defina pela página **App settings** na UI (`/#/config`) — mesmo
arquivo, mascarado na leitura, aplicado a `process.env` imediatamente.

### 5. Verifique e comece a trabalhar

Recarregue a página Health — todo check required deve estar verde. Então:

1. Clique em **🌐 Scan** → espere ~5 segundos → Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday +
   hh.ru / Habr Career são escaneados, vagas aparecem na tabela abaixo.
2. Clique em qualquer título → a vaga original abre numa nova aba.
3. Filtre por chips de stack (PHP / Go / Backend / Senior) até ver
   algo promissor.
4. Copie a URL → cole em **Pipeline** → clique em **Evaluate** para
   dar uma nota 0-5 ao vivo (Anthropic / Gemini) ou pegar um prompt manual.
5. Reports caem em `reports/`, tracker em `data/applications.md`,
   deep-research ao vivo em `interview-prep/`. Todos visíveis na UI.

> Traduções deste guia vivem em cada README específico de idioma:
> [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) ·
> [한국어](README.ko-KR.md) · [日本語](README.ja.md) ·
> [Русский](README.ru.md) · [简体中文](README.zh-CN.md) ·
> [繁體中文](README.zh-TW.md)

---

## Licença

MIT. Veja [LICENSE](LICENSE).

Construído sobre [career-ops](https://github.com/santifer/career-ops) por [santifer](https://santifer.io). Obrigado pela pipeline brilhante.
