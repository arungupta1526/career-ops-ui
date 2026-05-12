# career-ops-ui

> Interface web no estilo Airbnb para o pipeline de busca de emprego com IA [career-ops](https://github.com/santifer/career-ops).
> Buscar, avaliar, fazer deep-dive, aplicar e rastrear cada vaga em uma única aba do navegador — sem ficar pulando entre Claude Code, terminais e arquivos markdown.

[English](README.md) | [Español](README.es.md) | **Português (Brasil)** | [한국어](README.ko-KR.md) | [日本語](README.ja.md) | [Русский](README.ru.md) | [简体中文](README.cn.md) | [繁體中文](README.zh-TW.md)

[![tests](https://img.shields.io/badge/tests-284%20passed-brightgreen)](README.md#tests)
[![playwright](https://img.shields.io/badge/playwright-12%20smoke-brightgreen)](#tests)
[![node](https://img.shields.io/badge/node-%E2%89%A518-blue)](README.md#requirements)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![release](https://img.shields.io/badge/release-v1.9.1-blue)](https://github.com/Fighter90/career-ops-ui/releases/tag/v1.9.1)

> 📦 **v1.9.1** — Servidor refatorado para um orquestrador de 130 linhas + 12 módulos de rotas em `server/lib/routes/`. Paridade Anthropic em `/api/evaluate` (preferida sobre Gemini quando ambas as chaves estão presentes). Shims multi-CLI (`AGENTS.md`, `GEMINI.md`) para Codex / Aider / Cursor / Gemini CLI. **284 unit + 12 Playwright smoke tests**. Para a avaliação completa de production-readiness: [`docs/PRODUCTION-READINESS.md`](docs/PRODUCTION-READINESS.md). Pronto para deploy single-tenant loopback; o gate de auth para LAN chega em v2.0 (P-12).


![career-ops-ui — vacancy search](./public/images/screen_vacancy_found.png)

## Novidades em v1.10.3

- **Generate PDF em toda página longa.** Três novos endpoints SSE — `GET /api/stream/pdf/report?slug=`, `GET /api/stream/pdf/deep?name=`, `POST /api/stream/pdf/inline { markdown }`. O botão **📄 Generate PDF** agora aparece em `#/reports/:slug`, `#/deep` (manual + live), `#/evaluate` (manual + live) e `#/interview-prep`.
- **Handler global de erros Express.** `PayloadTooLargeError` e JSON malformado retornam envelopes JSON localizáveis, não traces HTML (F-019).
- **`#/config` reagrupado.** API keys / runtime / regional. `HH_USER_AGENT` vai para "Regional sources" recolhido, visível apenas se `portals.yml::russian_portals.sources` não está vazio (F-013).
- **Tokens em inglês não vazam mais em UIs não-EN** — `Pipeline`, `Deep research`, `Follow-up`, `Health`, `Outreach`, `Doctor`, `Quick scan` agora têm labels localizadas (F-001).
- **`#/scan` sem framing EN/RU** — labels "ATS adapters" + "Regional portals", contador Active-companies recalcula após cada `done` (F-010 + F-011 mínimo; consolidação completa do registro de adaptadores fica em PR-1 / v1.11.0).
- **README + bundles de ajuda limpos** do framing EN/RU em todas as 8 localidades (F-014).
- Novos testes. **349/350** unit, 94.59 % linha / 84.16 % branch, 23/23 E2E, 28/28 Playwright.

## Novidades em v1.10.2

- **O upload do CV não corrompe mais `cv.md` em uploads multipart.** Qualquer ferramenta externa (curl `-F`, clientes HTTP comuns) que usasse `multipart/form-data` por padrão armazenava o envelope wire de multipart como conteúdo de `cv.md`. `POST /api/cv/import` agora retorna **HTTP 415** com uma dica: use `Content-Type: application/octet-stream` + `X-Filename: <nome>`. Defesa em profundidade: corpos octet-stream que *parecem* multipart (sniff `Content-Disposition: form-data` nos primeiros 256 bytes) também recebem 415.
- **`📄 Generate PDF` finalmente produz um PDF.** `/api/stream/pdf` antes invocava `generate-pdf.mjs` **sem argumentos**; o script imprimia `Usage:` e saía com código 1 — a SPA mostrava um toast verde mas nenhum arquivo chegava ao disco. Agora a rota renderiza `cv.md` para HTML no servidor, escreve em `output/cv-input-<TIMESTAMP>.html` e lança o script com os args posicionais corretos + `--format=a4`. Opcional `?format=letter` para US-letter. Erro claro quando `cv.md` está ausente.
- **`docs/test-scenarios/`** — 21 arquivos de cenários em inglês documentando o contrato de cada página (CV upload, PDF download, filtros de scan, pipeline, evaluate, tracker, activity log, segurança, funil completo).

## Novidades em v1.10.1

- **Segurança: superfície SSRF reforçada.** `isValidJobUrl` agora rejeita RFC1918, link-local (incluindo AWS IMDS `169.254.169.254`), `0.0.0.0`, toda a faixa 127/8, CGNAT `100.64/10` e IPv6 ULA / link-local. O proxy de preview resolve via DNS cada salto e bloqueia se o endereço cair em faixa privada — defesa contra DNS-rebind.
- **Disciplina do log de atividade.** Só registra mudanças de estado bem-sucedidas — sem ruído 4xx. Os eventos `profile.save`, `config.save` e `cv.import` agora aparecem no feed.
- **Help coreano corrigido.** `GET /api/help/ko` agora serve `ko-KR.md` corretamente (antes caía no inglês por um descompasso de nome de arquivo).
- **Prompts LLM respeitam o idioma da UI.** `/api/evaluate`, `/api/deep`, `/api/mode/:slug` e o apply-helper injetam uma diretiva "Respond in X" via `body.lang` / `Accept-Language`. A SPA anexa seu locale em cada requisição.
- **`/api/evaluate` respeita `mode:'manual'`** — copie o prompt no Claude Code sem queimar créditos do Anthropic.
- **`DELETE /api/pipeline`** aceita `?url=` E `body.url`, retorna `404` (não `200` silencioso) quando a URL não estava na caixa de entrada.
- **`scripts/post-qa-cleanup.mjs`** — repete a limpeza após regressão de QA; dry-run por padrão, idempotente.

## Instalação com um comando

```bash
curl -fsSL https://raw.githubusercontent.com/Fighter90/career-ops-ui/main/bin/setup.sh | bash
```

Esse comando clona ambos os repositórios (career-ops + career-ops-ui), instala as dependências e inicia o servidor em http://127.0.0.1:4317.

## Por quê?

[career-ops](https://github.com/santifer/career-ops) é um sistema poderoso de busca de emprego baseado em Claude Code: cole uma JD → receba uma nota de aderência 0-5, um PDF otimizado para ATS e uma entrada no tracker. Funciona muito bem dentro do Claude Code, mas os dados ficam espalhados entre `cv.md`, `data/applications.md`, `reports/*.md`, `data/pipeline.md`, `portals.yml`, `config/profile.yml` — fácil de perder, difícil de revisar.

`career-ops-ui` adiciona uma UI bem feita por cima:

- **Navega** o tracker, os relatórios e o pipeline como um CRM.
- **Dispara** scans (Greenhouse / Ashby / Lever **e** hh.ru / Habr Career) e acompanha logs SSE ao vivo.
- **Avalia** uma JD via API do Gemini ou pega um prompt prontinho para Claude.
- **Edita** `cv.md` com preview markdown lado a lado.
- **Mantém** o sistema: doctor, verify, normalize, dedup, merge — um clique cada.

É puramente aditivo: nada dentro de `career-ops/` é modificado. Suas customizações continuam suas.

## Funções por página

| Página           | O que faz                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Dashboard**    | Contadores agregados (apps / pipeline / relatórios), score médio, breakdown por status, últimas 5 apps + último relatório. |
| **Scan**         | **🌐 Botão único 🌐 Scan** — percorre cada fonte habilitada em uma única passagem (Greenhouse / Ashby / Lever para EN, hh.ru + Habr Career para RU). Streaming SSE ao vivo + tabela de resultados com chips de stack/nível e filtros location / Remote-Hybrid / reloc / source. |
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
