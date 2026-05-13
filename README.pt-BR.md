# career-ops-ui

> Interface web limpa, estilo docs para o pipeline de busca de emprego com IA [career-ops](https://github.com/santifer/career-ops).
> Buscar, avaliar, fazer deep-dive, aplicar e rastrear cada vaga em uma única aba do navegador — sem ficar pulando entre Claude Code, terminais e arquivos markdown.

[English](README.md) | [Español](README.es.md) | **Português (Brasil)** | [한국어](README.ko-KR.md) | [日本語](README.ja.md) | [Русский](README.ru.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

[![tests](https://img.shields.io/badge/tests-427%20passed-brightgreen)](README.md#tests)
[![playwright](https://img.shields.io/badge/playwright-12%20smoke-brightgreen)](#tests)
[![node](https://img.shields.io/badge/node-%E2%89%A518-blue)](README.md#requirements)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![release](https://img.shields.io/badge/release-v1.16.0-blue)](https://github.com/Fighter90/career-ops-ui/releases/tag/v1.16.0)

> 📦 **v1.9.1** — Servidor refatorado para um orquestrador de 130 linhas + 12 módulos de rotas em `server/lib/routes/`. Paridade Anthropic em `/api/evaluate` (preferida sobre Gemini quando ambas as chaves estão presentes). Shims multi-CLI (`AGENTS.md`, `GEMINI.md`) para Codex / Aider / Cursor / Gemini CLI. **284 unit + 12 Playwright smoke tests**. Para a avaliação completa de production-readiness: [`docs/PRODUCTION-READINESS.md`](docs/PRODUCTION-READINESS.md). Pronto para deploy single-tenant loopback; o gate de auth para LAN chega em v2.0 (P-12).

![career-ops-ui — Centro de Comando](./images/dashboard-pt-BR.png)

## Sobre o career-ops

[career-ops](https://career-ops.org) é um sistema open-source de busca de emprego que roda como slash-comandos dentro de qualquer CLI de codificação com IA (Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot CLI). Modelo-agnóstico. Avalia cada vaga contra seu CV com uma rubrica de seis dimensões 0.0–5.0, gera CVs PDF adaptados, e registra cada candidatura localmente — sem contas na nuvem, sem telemetria, sem auto-envio.

**Este repositório (career-ops-ui)** é uma interface web polida sobre o CLI. O CLI continua dono do form-fill (via Playwright MCP) e dos slash-comandos; a SPA dá uma superfície tipo CRM sobre os mesmos `cv.md` / `data/applications.md` / `reports/`. Dados compartilhados.

**Limiares por score** (de [career-ops.org/docs](https://career-ops.org/docs)):

| Score | Próximo passo |
|---|---|
| **≥ 4.5** | `/career-ops apply` — alto fit, aplique já |
| **4.0 – 4.4** | aplique, ou `/career-ops contacto` (warm intro) |
| **3.5 – 3.9** | `/career-ops deep` — pesquise antes |
| **< 3.5** | pule, salvo razão específica |

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

Esse comando clona ambos os repositórios (career-ops + career-ops-ui), instala as dependências e inicia o servidor em http://127.0.0.1:4317.

## Por quê?

[career-ops](https://github.com/santifer/career-ops) é um sistema poderoso de busca de emprego baseado em Claude Code: cole uma JD → receba uma nota de aderência 0-5, um PDF otimizado para ATS e uma entrada no tracker. Funciona muito bem dentro do Claude Code, mas os dados ficam espalhados entre `cv.md`, `data/applications.md`, `reports/*.md`, `data/pipeline.md`, `portals.yml`, `config/profile.yml` — fácil de perder, difícil de revisar.

`career-ops-ui` adiciona uma UI bem feita por cima:

- **Navega** o tracker, os relatórios e o pipeline como um CRM.
- **Dispara** scans (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday **e** hh.ru / Habr Career) e acompanha logs SSE ao vivo.
- **Avalia** uma JD via API do Gemini ou pega um prompt prontinho para Claude.
- **Edita** `cv.md` com preview markdown lado a lado.
- **Mantém** o sistema: doctor, verify, normalize, dedup, merge — um clique cada.

É puramente aditivo: nada dentro de `career-ops/` é modificado. Suas customizações continuam suas.

## Funções por página

| Página           | O que faz                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Dashboard**    | Contadores agregados (apps / pipeline / relatórios), score médio, breakdown por status, últimas 5 apps + último relatório. |
| **Scan**         | **🌐 Botão único 🌐 Scan** — percorre cada fonte habilitada em uma única passagem (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday para EN, hh.ru + Habr Career para RU). Streaming SSE ao vivo + tabela de resultados com chips de stack/nível e filtros location / Remote-Hybrid / reloc / source. |
| **Pipeline**     | CRUD em `data/pipeline.md`. Pula direto da URL para avaliar.                                                       |
| **Evaluate**     | Cole JD → se `GEMINI_API_KEY` estiver setado, roda `gemini-eval.mjs`; senão, devolve um prompt para Claude.       |
| **Deep research**| Gera o prompt completo de `modes/deep.md` para a empresa/role indicados.                                          |
| **Apply helper** | Gera um checklist de aplicação; o form-fill real com Playwright continua em `/career-ops apply` no Claude Code.    |
| **Tracker**      | Tabela filtrável sobre `data/applications.md` (status, score, texto livre). Botões one-click para normalize/dedup/merge. |
| **Reports**      | Navega e lê cada relatório de `reports/` com cabeçalho parseado (Score / Legitimacy / URL).                        |
| **CV**           | Editor markdown ao vivo de `cv.md` com preview lado a lado + sync-check.                                           |
| **Profile**      | Visão read-only de `config/profile.yml` + arquétipos.                                                              |
| **Health**       | Todos os checks de setup em badges OK / OPTIONAL / FAIL + botões para `doctor.mjs` e `verify-pipeline.mjs`.        |

## Requisitos

| | |
| --- | --- |
| **Node.js** | ≥ 18 |
| **career-ops** | Clonado e onboarded |
| **Opcional** | `GEMINI_API_KEY` em `.env` para avaliação de um clique |
| **Opcional** | `HH_USER_AGENT` em `.env` se estiver fora da Rússia e quiser que a API do hh.ru pare de retornar 403 |

## Filtros chip por stack e nível

A tabela de vagas inclui chips multi-select para:

- **Stack:** PHP, Symfony, Laravel, Go, Rust, Node.js, TypeScript, Python, Ruby, Java, C#/.NET, C++, Backend, Frontend, Fullstack, Microservices, High-load, Distributed, DevOps/SRE, Data, ML/AI, Mobile, Security, Database, Cloud, API
- **Nível:** Lead/Tech Lead, Architect, Manager, Principal/Staff, Senior, Middle, Junior

Multi-select dentro de cada categoria (OR), intersecção entre categorias (AND). Contagens mostradas; só aparecem chips com resultados.

## Documentação completa

Para arquitetura completa, referência da API, configuração avançada e notas de segurança — veja o [README em inglês](README.md).

## Licença

MIT. Construído sobre [career-ops](https://github.com/santifer/career-ops) de [santifer](https://santifer.io).

---

## 🌍 Getting Started — primeiros passos após instalação

Após o one-command install você tem dois repos clonados com arquivos scaffold (`cv.md`, `config/profile.yml`, `portals.yml`, `data/applications.md`, `data/pipeline.md` com marcadores **EDIT ME**). A página Health deve estar toda verde no primeiro arranque. Substitua os placeholders pelos seus dados reais:

### 1. Crie seu CV (`cv.md`)

- **A — cole um currículo existente** em `career-ops/cv.md` em markdown limpo.
- **B — carregue pela UI:** click **CV** → **📁 Carregar CV** → escolha `.md`/`.txt` → revise preview → click **💾 Salvar**.
- **C — dê seu LinkedIn ao Claude Code:** abra Claude Code, execute `/career-ops`, peça "extraia meu CV e salve em cv.md".

### 2. Edite perfil (`config/profile.yml`)

Substitua placeholders: nome, email, localização, LinkedIn, vagas-alvo, **arquétipos** (o mais importante), faixa salarial.

### 3. Configure scanner (`portals.yml`)

Ajuste `title_filter.positive`/`negative`. Já há 3 boards (GitLab, Vercel, Linear). Mais em [`docs/portals-examples.md`](docs/portals-examples.md).

### 4. (Opcional) Gemini API key

```bash
echo "GEMINI_API_KEY=sua-chave" >> career-ops/.env
```

### 5. Verifique e use

Health → tudo verde. **🌐 Buscar em todas as fontes** → tabela com chips → copy URL → **Pipeline** → **Evaluate**.

Documentação completa (arquitetura, API, segurança): [README em inglês](README.md).

---

## ✨ Novidades v1.16.0 (auto-pipeline server-side)

> **A grande mudança de UX.** Até v1.15.0 havia 5 cliques manuais entre `#/pipeline → #/evaluate → #/cv → #/tracker`. Agora, um único botão `✨ Auto-pipeline a URL` (em `#/dashboard` e via `Cmd+K → colar URL → Enter`) executa toda a pipeline em uma timeline SSE observável.

### Como funciona
1. **Valida a URL** (gate SSRF + DNS-rebind).
2. **Busca a JD** via proxy SSRF-safe.
3. **Avalia contra seu CV** (Anthropic ou Gemini), score 0–5 extraído do markdown.
4. **Salva o relatório** em `reports/<slug>.md` (novo endpoint `POST /api/reports`).
5. **Adiciona linha ao tracker** referenciando o relatório + URL.

```bash
# Curl direto (CI / smoke):
curl -N -X POST http://127.0.0.1:4317/api/auto-pipeline \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://job-boards.greenhouse.io/anthropic/jobs/4567"}'
```

Eventos SSE: `start → step (×5) → done` ou `error`. Falha limpa em qualquer passo; o chain para e retorna o que foi completado.

### Outros highlights v1.16.0
- **Paginação SmartRecruiters** — percorre todas as páginas, não só as primeiras 100. Cap de segurança: 30 páginas / 3000 jobs.
- **Workday CAPTCHA-fallback** — um tenant com CAPTCHA não aborta mais o scan inteiro. Renderiza chip 🔒 no card Active Companies; demais tenants continuam.
- **`#/scan` source filter** — dropdown reconstruído do adapter registry: 6 ATSes + hh.ru + Habr, alfabético, sem prefixos geo.
- **`scripts/import-trending-companies.mjs`** — verifica as 13 empresas trending de `docs/portals-examples.md` e emite YAML colável para seu `portals.yml`. Execute `npm run import:trending`.
- **CI workflow** — `.github/workflows/dashboard-screenshots.yml` regenera os 8 PNGs hero e falha o build se houver drift visual não comitado.

### Referências
- Documentação completa: [README em inglês](README.md) — 585 linhas com seções de arquitetura, API e segurança.
- Help in-app: `#/help` (16 seções × 8 locales).
- CHANGELOG: [`CHANGELOG.pt-BR.md`](CHANGELOG.pt-BR.md).
- Documentos canônicos: [career-ops.org/docs](https://career-ops.org/docs).

---

## Arquitetura

| Camada | Stack | Arquivos |
|---|---|---|
| Server | Node ≥18, Express 4, js-yaml, multer | `server/index.mjs` (~130 LOC), `server/lib/routes/*.mjs` (13 módulos) |
| SPA | Vanilla JS, hash-router, sem framework | `public/index.html`, `public/js/{app,router,api}.js`, `public/js/views/*.js` |
| Styling | CSS hand-written, docs-style tokens, dark theme | `public/css/app.css` |
| Tests | `node --test` (TAP), Express in-process | `tests/*.test.mjs`, Playwright |
| Build | Nenhum — arquivos servidos as-is | — |

O servidor lê arquivos do pai (`../cv.md`, `../config/profile.yml`, etc.) e só escreve em ações explícitas (`POST /api/tracker`, `PUT /api/cv`, `POST /api/reports`, `POST /api/auto-pipeline`).

## Referência API

Endpoints chave (lista completa em [README EN](README.md#api-reference)):

| Método + Rota | Propósito |
|---|---|
| `GET /api/health` | system status + 18 checks |
| `GET /api/dashboard` | counts + score-thresholds + activity tail |
| `GET /api/scan-results` | snapshot último scan + `workdayFallback` (v1.17+) |
| `GET /api/stream/scan?source=ats\|regional\|both` | SSE consolidado |
| `POST /api/pipeline { url }` | adicionar URL (gate SSRF) |
| `GET /api/pipeline/preview?url=` | proxy SSRF-safe + DNS-rebind guard |
| `POST /api/evaluate { jd, save?, mode? }` | Anthropic / Gemini / manual eval |
| `POST /api/reports { slug, markdown }` | persist em `reports/<slug>.md` (v1.16+) |
| `POST /api/auto-pipeline { url }` | SSE 5-step orchestrator (v1.16+) |
| `POST /api/tracker { company, role, … }` | append em `data/applications.md` |
| `GET /api/modes/_profile` + `PUT` | editor `modes/_profile.md` (v1.15+) |
| `POST /api/stream/pdf/inline` | SSE PDF via Playwright |

## Notas de segurança

- **CSP** estrito: `script-src 'self'` sem `'unsafe-inline'`. Handlers via `addEventListener`.
- **SSRF**: cada fetch de URL passa por `isValidJobUrl()` — rejeita loopback, IPs privadas, schemes perigosos, redirects inseguros.
- **XSS**: cada markdown que entra passa por `stripDangerousMarkdown()`.
- **DNS-rebind guard** em `/api/pipeline/preview` e auto-pipeline.
- **Headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`.
- **Body caps**: 5 MB JSON, 1 MB report, 256 KB profile / modes_profile, 10 MB CV upload.
- Sem auth — single-tenant loopback only. Auth LAN → P-12 (v2.0).

## Testes

- `npm test` — **427** testes unitários + integração. Isolamento via `CAREER_OPS_ROOT=$(mktemp -d)`.
- `npm run test:coverage` — **94 % linhas / 83 % branches**.
- `npm run test:e2e` — 20 smoke E2E.
- `npm run test:e2e:full` — 23 comprehensive E2E.
- `npm run test:e2e:browser` — **32** Playwright (smoke + full-cycle + auto-pipeline scenarios).

## A11y (v1.17+)

- ARIA roles: `banner`, `navigation`, `main`, `dialog`, `status`, `search`.
- Focus trap em modais com restauração de foco para click owner.
- `aria-expanded` sync em sidebar-toggle.
- Label do global search via classe `visually-hidden`.

## Limitações

- **Single-tenant, loopback only** — sem login, sem multi-user.
- **PDF requer Playwright** no pai.
- **Live LLM requer ANTHROPIC_API_KEY ou GEMINI_API_KEY**; sem chave → manual prompt.
- **Workday CAPTCHA-gated tenants** caem em fallback graceful (no jobs); use `/career-ops scan`.

## License

MIT — veja [LICENSE](LICENSE).
