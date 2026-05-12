# Histórico de mudanças

Todas as mudanças relevantes do **career-ops-ui**. Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), versionamento [SemVer](https://semver.org/lang/pt-BR/).

Traduções: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

---

## [1.10.2] — 2026-05-12

Patch de regressão funcional. Dois bugs descobertos durante a verificação manual de v1.10.1 fechados; superfície de docs ampliada.

### 🐛 Correções

- **`fix(cv): /api/cv/import rejeita multipart/form-data com 415`** — clientes externos que enviavam `multipart/form-data` por padrão gravavam o wire envelope como conteúdo de `cv.md`. Agora 415 com dica. O caminho do SPA (octet-stream + X-Filename) não muda.
- **`fix(pdf): /api/stream/pdf invoca generate-pdf.mjs com args posicionais corretos`** — antes chamava o script com `[]` e ele imprimia `Usage:` saindo com código 1, sem produzir PDF. Agora renderiza `cv.md` para HTML, escreve em `output/cv-input-<TIMESTAMP>.html` e lança o script com `<input.html> <output.pdf> --format=a4`.

### 🧪 Tests

- Novos `tests/cv-upload-multipart-reject.test.mjs` (5 casos) e `tests/pdf-stream-args.test.mjs` (3 casos). **340 unit tests** (antes 318). Coverage 94.63 % linha / 84.94 % branch.

### 📝 Docs

- Novo `docs/test-scenarios/` — 21 arquivos de cenários em inglês.
- Novo `docs/reviews/REVIEW-2026-05-12-v1.10.2.md`.
- Texto completo em [CHANGELOG.md](CHANGELOG.md#1102--2026-05-12).

---

## [1.10.1] — 2026-05-09

Patch de correções críticas após a regressão QA de v1.10.0 (`qa/reports/00-FINAL-SUMMARY.md`).

### 🛡️ Segurança

- **`fix(security): superfície SSRF reforçada + defesa DNS-rebind (PR-3 / F-003)`** — `isValidJobUrl` rejeita RFC1918, todo 127/8, link-local `169.254/16` (incl. AWS IMDS), `0.0.0.0`, CGNAT `100.64/10`, IPv6 ULA / link-local. Novo helper `isPrivateOrLoopbackHost()`. O proxy de preview faz `dns.lookup` em cada salto e bloqueia se o endereço cair em range privado — defesa DNS-rebind.

### 🐛 Correções

- **`fix(activity)`**: registra somente mudanças de estado bem-sucedidas (PR-5 / F-005); tentativas rejeitadas com 4xx não geram mais log. Adicionados eventos `profile.save`, `config.save`, `cv.import` (F-008).
- **`fix(help)`**: alias `ko` → `ko-KR.md` para o corpo coreano não cair em inglês (F-002).
- **`fix(llm): /api/evaluate respeita mode:'manual'`** — espelha o comportamento de `/api/deep`, sem queimar créditos (F-009).
- **`fix(api): DELETE /api/pipeline`** aceita `?url=` E `body.url`; retorna 404 quando a URL não estava (PR-6 / F-017).

### ✨ Funcionalidades

- **`feat(llm): propagação de locale em todos os prompts (PR-2 / F-012)`** — `resolveLocale(req)`, `buildLocaleDirective(lang)`. A SPA anexa `Accept-Language` + `lang` automaticamente.
- **`feat(scripts): post-qa-cleanup.mjs (PR-11)`** — reproduz a limpeza após QA; `--apply` escreve, default dry-run, idempotente.

### 🧪 Tests

- Novo `tests/critical-fixes.test.mjs` (15 casos). `tests/url-validation.test.mjs` estendido com 5 novos. **318 unit tests** (antes 298). Uma falha pré-existente em `portals-dead.test.mjs` por drift em `templates/portals.example.yml` do parent — não é código do web-ui.

### 📝 Docs

- Novo `docs/reviews/REVIEW-2026-05-09-v1.10.1.md`. Os 8 READMEs atualizados (badges + screenshot + seção "Novidades em v1.10.1"). Os 8 CHANGELOGs recebem esta entrada.

---

## [1.10.0] — 2026-05-08

> Texto completo em [CHANGELOG.md](CHANGELOG.md#1100--2026-05-08). Resumo: importação de CV (`.docx`/`.doc`/`.odt`/`.rtf`/`.pdf`/`.html`/`.txt`/`.md` via pandoc + pdftotext, limite 10 MB), auto-download do PDF novo após Generate-PDF, `#/config` com duas abas (API keys & runtime + Profile), `#/profile` agora canônico, help docs atualizados em todas as 8 locales.

---

## [1.9.1] — 2026-05-08

Pass de production-readiness. 4 correções pontuais (BF-1..BF-4), Playwright smoke ampliado de 5 para 12 tests.

### 🐛 Correções

- **BF-1 (tracker)**: escape de `|` e quebras de linha em todas as células, não só notes. Nomes como `"Acme | Co"` não quebram mais a tabela. `parseMarkdownTable` suporta escape GFM `\|` — round-trip sem perdas.
- **BF-2 (config)**: `updateEnvFile` envolto em try/catch — retorna 500 limpo em vez de rejection não tratada.
- **BF-3/BF-4 (llm)**: teto suave de 200 KB no prompt montado nos ramos Anthropic de `/api/evaluate`, `/api/deep`, `/api/mode/:slug` — 413 em vez de timeout.

### 🧪 Playwright smoke — 5 → 12 tests

Tracker (incl. round-trip BF-1), pipeline add + varredura de URLs inválidas, reports estado vazio, evaluate fallback manual, config keys mascaradas, CV PUT com sanitização, pipeline preview 400.

---

## [1.9.0] — 2026-05-08

P-6 → P-10 do backlog v1.8.0 — todos em uma release. Destaque: `server/index.mjs` agora é um orquestrador de 130 linhas (era 762, total 1230 → 130 = -89 %); cada tema de rota em seu próprio módulo. Paridade Anthropic para `/api/evaluate`, shims multi-CLI, teste ampliado de paridade i18n, Playwright browser-smoke no CI.

### 🏗️ P-6 — fase 2 da divisão de server/index.mjs

Continuação de P-2. As 9 rotas restantes movidas para `server/lib/routes/<topic>.mjs`. `index.mjs` agora é orquestrador puro: middleware, 12 chamadas `register<Topic>Routes(app)`, catch-all SPA.

Módulos: `activity`, `config`, `health` (+ dashboard), `help`, `jds`, `llm`, `pipeline` (+ preview), `reports`, `tracker`. Comportamento inalterado. 283/283 unit tests verdes a cada passo.

### 🔌 P-7 — Paridade Anthropic para /api/evaluate

`/api/evaluate` antes era Gemini-or-manual. v1.9.0 adiciona ramo Anthropic (preferido quando ambas as chaves presentes). Passa por `bundleProjectContext({ modeSlugs: ['_shared', 'oferta'] })` — REVIEW-A1 estendido. Fallback: Anthropic → Gemini → manual.

Novo endpoint **`POST /api/evaluate/test-anthropic`** — smoke-check para `ANTHROPIC_API_KEY`.

### 🌐 P-8 — Paridade i18n do help-center

Os 8 locales já cobrem as mesmas 14 seções h2 canônicas. Testes reforçados:

- `tests/help-ui.test.mjs` agora itera todos os 8 locales (antes só en + ru).
- Novo: cada locale ≥ 30 % de `en.md` — proteção contra stubs.

### 🤖 P-9 — Playwright browser smoke no CI

`tests/playwright-smoke.mjs` (opt-in em v1.8.0) agora faz parte do workflow CI.

### 🌍 P-10 — Compatibilidade multi-CLI

`web-ui/AGENTS.md` (Codex / Aider / genérico) e `web-ui/GEMINI.md` adicionados como shims apontando para o canônico `CLAUDE.md`.

### 🧪 Testes

- **284 unit tests** (era 283): +1 novo de paridade i18n.
- **5 smoke tests Playwright** agora no CI.

### 📦 Novo endpoint

| Método | Rota | Propósito |
|---|---|---|
| `POST` | `/api/evaluate/test-anthropic` | Smoke-check para `ANTHROPIC_API_KEY` (P-7). |

---

## [1.8.0] — 2026-05-08

Hardening, refactor e fundação SDD. Três correções de severidade alta (A1, A2, A3), quatro médias (B1–B4), seis limpezas, auditoria do projeto pai career-ops v1.7.0, divisão de `server/index.mjs` (P-2 fase 1), smoke com Playwright e fundamento SDD completo em `docs/` e `.claude/`.

### 🔥 Severidade alta

- **`fix(deep): inline cv/profile/mode em chamadas Anthropic SDK (REVIEW-A1)`** — `/api/deep` e `/api/mode/:slug` mandavam o modelo "leia esses arquivos primeiro", mas o SDK Anthropic não tem sistema de arquivos. A saída ficava vazia. `bundleProjectContext` lê `cv.md`, `config/profile.yml`, `modes/_shared.md` e o template do modo, trunca a 16 KB e adiciona um bloco `<project_context>`. Verificado ao vivo: 26 KB de markdown bem fundamentado de `claude-sonnet-4-6`.
- **`fix(runner): escalada SIGTERM → SIGKILL após período de graça (REVIEW-A2)`** — um filho preso em chamada de sistema podia travar a conexão SSE. Agora ambos os caminhos armam um watchdog de 5s que escala para `SIGKILL`.
- **`fix(runner): teto de runtime em endpoints streaming (REVIEW-A3)`** — `/api/stream/{scan,liveness,pdf}` têm teto de 30 minutos.

### 🛡️ Severidade média

- **`fix(preview): validação por hop em /api/pipeline/preview (REVIEW-B1)`** — mudança de `redirect: 'follow'` para caminhamento manual. Cada `Location` é revalidado por `isValidJobUrl`; teto de 3 saltos. Boards hostis não conseguem mais redirecionar para loopback / IP privado / `file://`.
- **`refactor(keys): hasGeminiKey unifica checagens de chave LLM (REVIEW-B2)`**.
- **`feat(scanners): AbortSignal através de hh.ru, Habr, Greenhouse, Ashby, Lever (REVIEW-B3)`** — quando o cliente desconecta, fetches em voo são abortados.
- **`test(anthropic): log-guard impede vazamento futuro da API key via console (REVIEW-B4)`**.

### 🧹 Limpezas

- **`fix(parsers): porta URL em addPipelineUrl como defesa em profundidade (REVIEW-C4)`**.
- **`docs(readme): badge 88 → 277 tests (REVIEW-C3)`**.
- **`test(i18n): mensagens de chaves ausentes agrupadas por locale (REVIEW-C6)`**.

### 🏗️ P-2 fase 1 — divisão de server/index.mjs (1230 → 762 LOC, −38 %)

Sem mudança de comportamento. 283/283 unit tests verdes em cada passo.

- `server/lib/security.mjs` — sanitizadores e trust-checks.
- `server/lib/prompts.mjs` — construtores de prompt para LLM.
- `server/lib/store.mjs` — leitores defensivos + bootstrap inicial.
- `server/lib/routes/{scan,runners,content}.mjs` — `registerXxxRoutes(app)`.

Fase 2 extrairá tracker / pipeline / reports / jds / llm / health.

### 🔍 Auditoria do projeto pai career-ops v1.7.0

UI compatível. Catálogo de modos: 7 → 19 (UI expõe 7 propositalmente). `portals.yml` usa `tracked_companies` (96 entradas, 87 habilitadas, 71 com API). Documentado em `docs/architecture/DATA-FLOWS.md`.

### 🤖 Fundamento SDD / GSD

- `CLAUDE.md` (raiz), `.aiignore`, `.claude/agents/*` (3), `.claude/commands/*` (2).
- Árvore `docs/`: PROJECT, ROADMAP, sdd/{SDD-GUIDE, CONVENTIONS}, architecture/{OVERVIEW, SERVER, FRONTEND, API, DATA-FLOWS}, reviews/REVIEW-2026-05-07.

### 🔒 Segurança e higiene do repo

- **`chore(.gitignore): padrões defense-in-depth ampliados`** — variantes de env, IDE, scratch GSD, configs privadas do agente, artefatos Playwright, padrões genéricos de segredos.

### 🧪 Testes

- **283 unit tests** (era 277): +6 novos.
- **5 smoke tests Playwright** (novos, opt-in via `npm run test:e2e:browser`).
- Cobertura ~93 % linha / ~83 % branch.

### 📝 Novos scripts npm

| Script | Propósito |
|---|---|
| `npm run test:e2e:browser` | Playwright smoke contra o servidor in-process (5 tests). |

---

## [1.7.2] — 2026-05-04

Centro de ajuda, configurações na UI, sidebar móvel, botão único Scan, atalho "Mostrar resultado".

### ✨ New features

- **`feat(help): in-app user guide` (`/#/help`)** — long-form Markdown documentation accessible from a new sidebar entry. Covers every page step-by-step: quick start, CV editor, Profile, Scan filters, Pipeline preview, Evaluate, Deep research, Apply, Tracker, Reports, all 7 modes, Activity log, Health, setup hints. Auto-built sticky table of contents from `<h2>` headings, synchronous DOM build (no race). Localized for all 8 supported locales.
- **`feat(config): in-UI App settings page` (`/#/config`)** — edit `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `HH_USER_AGENT`, `PORT`, `HOST` from the browser. Writes to the **parent project's** `.env` file so career-ops Node scripts AND web-ui's dotenv loader pick up the same source. Secret keys masked on read (first/last 4 chars). Model fields are dropdowns with curated lists (claude-sonnet-4-6 / claude-opus-4-7 / claude-haiku-4-5 / gemini-2.0-flash / etc.). Empty value deletes the key. Values applied to running process.env immediately — no restart for most settings.
- **`feat(modes): "⚡ Show result" button alongside "Copy prompt"`** — when a prompt is generated in manual mode, users no longer have to retype their inputs to get the LLM result. The new button re-submits the same form with `run: true`, falling through to a clear toast (`Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env first`) when no key is configured. Works on `/#/deep`, `/#/project`, `/#/training`, `/#/followup`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns`.

### 🐛 UX + UI fixes

- **`fix(scan): single Scan button replaces three (Scan all + EN + RU)`** — overwhelming choice, identical default in 99% of cases. The unified `🌐 Scan` button runs every enabled source. Help docs updated across 8 locales.
- **`fix(ui): mobile sidebar drawer`** — viewport <900px now gets a hamburger button (☰) in the topbar; `body.sidebar-open` toggles a CSS transform that slides the sidebar in. Backdrop dim + click-anywhere closes it. Anchor click + hashchange auto-close so the user lands on the new page with the drawer tucked away. Larger viewports unaffected.
- **`fix(server): footer version reflects web-ui, not the parent VERSION`** — `/api/health` now reads web-ui's own `package.json`. The footer no longer leaks a stale `1.6.0` from the parent's version file. Parent's VERSION is still surfaced separately as `parentVersion`.

### 📦 New REST endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/api/help/:lang` | Returns the Markdown user guide for the requested locale, falling back to `en.md`. Path-traversal-safe. |
| `GET`  | `/api/config` | Returns current values for all known env keys; secrets masked. |
| `POST` | `/api/config` | Writes the given keys into the parent project's `.env`, validates each value, applies live to `process.env`. |

### 🌐 i18n

- 30+ new keys across `nav.help`, `nav.config`, `help.*`, `config.*`, `deep.showResult`, `deep.needKey`, `scan.btnRun`. All 8 locales populated.

### 🧪 Tests

- `tests/help.test.mjs` (12 cases) — every supported locale returns substantive markdown, EN spot-checks every page slug, unknown lang → EN fallback, path-traversal sanitized, every locale references `cv.md` / `profile.yml` / `.env`.
- `tests/help-ui.test.mjs` (9 cases) — view file registration, sidebar entry, i18n keys present in every locale, docs files exist for every locale, EN/RU help has 14 canonical sections, every #/foo route covered, Show-result wiring on deep + mode-page.
- `tests/env-config.test.mjs` (18 cases) — pure-function tests for `parseEnv`, `maskSecret`, `validateConfig`, `updateEnvFile` (bootstrap, in-place rewrite preserving comments, empty-value delete, quote-when-needed).
- `tests/config-endpoint.test.mjs` (8 cases) — GET masks secrets / returns env path; POST writes to parent .env; live process.env application; empty-value unsets; rejects unknown keys + malformed Anthropic keys with 400.

### 📊 Stats

- **Tests:** 233 → **277** (+44 across 4 new test files).
- **E2E:** 20 smoke + 23 comprehensive = 43 Playwright steps, all green.
- **Coverage:** 93.5% line / 82.6% branch / 93.7% funcs (unchanged — new code is fully tested).

---

## [1.7.1] — 2026-05-04

Patch release stacking the post-v1.7.0 work: pipeline preview pane, Anthropic API integration, scrollable sidebar, dotenv loader, dynamic Active-companies list, CI workflow hardening.

### ✨ Pipeline preview pane

- `/#/pipeline` overhaul — left list + right preview pane. Click any URL to fetch a server-side proxied snapshot (`GET /api/pipeline/preview` strips scripts/styles/tags, caps at 8 KB, validated through `isValidJobUrl`). Live filter input, "In queue" counter, ⚡ "Evaluate first" header button. Inline ▶/✕ on every row plus full Evaluate / Open in tab / Delete on the preview pane. **8 new tests** in `tests/pipeline-preview.test.mjs`.

### ✨ Anthropic API integration — "Run live" everywhere

- `server/lib/anthropic.mjs` — zero-dependency client for Anthropic Messages API. When `ANTHROPIC_API_KEY` is set, every mode page (`/#/deep`, `/#/project`, `/#/training`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns`) renders **⚡ Run live (Anthropic)** as the primary action — clicking executes the prompt and renders Markdown back into the browser. Gemini stays as fallback when only its key is set. **8 new tests** in `tests/anthropic.test.mjs`.

### 🐛 CI / pipeline / UX fixes

- `fix(api): tighten pipeline URL validator` (FIX-M7) — rejects loopback hostnames, length <10 or >2000, whitespace inside URLs.
- `fix(server): actually load .env so HH_USER_AGENT / GEMINI_API_KEY hints work` — added `server/lib/dotenv.mjs` (35-line zero-dep loader). 6 new tests.
- `fix(ui): scrollable sidebar` — `.sidebar` now has `overflow-y: auto`. 18 nav items always reach the footer.
- `fix(ui): make HH_USER_AGENT banner dismissible`, then removed entirely from `/scan`. Health page check still surfaces it.
- `fix(scan): Active companies list collapsible + filterable + grouped` (✓ API-backed first, ○ websearch second).
- `fix(test): isolate api.test.mjs + en-scanner.test.mjs from parent project` — both now spin up tmp project roots so CI works without parent checked out alongside web-ui.
- `fix(workflow): publish-package version-match only on release events` — `workflow_dispatch` from main no longer fails the tag/version check.
- `fix(e2e): stable selector for pipeline row delete` — `.pipeline-row[data-url=…] .pipeline-row-delete`.

### 📦 New REST endpoint

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/pipeline/preview?url=…` | Server-side proxy: visible-text snapshot (scripts/styles stripped, 8 KB cap), gated by `isValidJobUrl`. |

### 📊 Stats

- **Tests:** 225 → **233** (+8 on top of v1.7.0).
- **Test files:** 25 → **26**.
- **E2E:** 20 + 23 = 43 Playwright steps, all green.
- **Coverage:** 93.5% line · 82.6% branch · 93.7% funcs.

---

## [1.7.0] — 2026-05-03

Passagem de 35 commits de hardening + UX + completude de features orientada pelo QA r5. Pousaram três camadas de segurança, foram completados todos os endpoints CRUD, o bootstrap do projeto pai ficou automatizado, e a UI ganhou **9 páginas novas**: Activity, Deep Research redesenhado e 7 modos agrupados na sidebar (project / training / followup / batch / outreach / interview-prep / patterns) cobrindo 100% de `modes/` do pai. Cobertura: **73** → **209** testes em **25 arquivos** + **23 passos de Playwright e2e abrangente**. Coverage: **93.5 % linhas / 82.6 % branches**.

### 🔒 Segurança

- **`fix(cv): sanitizar Markdown do CV para bloquear XSS persistente` (FIX-C10)** — `PUT /api/cv` remove `<script>`, `<iframe>`, `<object>`, `<embed>`, `<style>`, `<form>`, `<svg>`, handlers `on*=` e URIs `javascript:`/`vbscript:`/`data:text/html` antes de gravar `cv.md`. Limite de 1 MB (413 ao exceder). O `UI.md()` cliente foi reescrito para escapar tudo *antes* das transformações markdown — HTML cru nunca chega ao `innerHTML`. `href` validados por whitelist (`http`/`https`/`mailto`/`tel`/relativos + apenas `data:image`). 17 novos testes.
- **`fix(server): cabeçalhos CSP + segurança baseline` (FIX-L2)** — toda resposta carrega `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`. Quando o servidor escuta além de loopback, aplica CSP estrito: `default-src 'self'`, `script-src 'self'` (sem `unsafe-inline`), Google Fonts permitido, `connect-src 'self'` bloqueia exfiltração. Handlers `onclick` inline migrados para `addEventListener`. 8 novos testes.
- **`fix(api): apertar validador de URL no pipeline` (FIX-M7)** — `POST /api/pipeline` aceitava `"not-a-url"` e persistia. Agora `isValidJobUrl()` rejeita strings sem scheme, comprimento <10 ou >2000, URLs com espaços, schemes não-`http(s)`, hostnames loopback. Inclui **FIX-M3** + **FIX-M6**.
- **`fix(api): sanitizar JD antes do prompt` (FIX-M5)** — `POST /api/evaluate` remove escapes ANSI, bytes de controle, `<script>` inline. Limite 50 KB. Mínimo de 50 chars verificado contra texto *sanitizado*.
- **`fix(health): mascarar Node version + project root quando HOST!=loopback` (FIX-M1)** — `/api/health` deixa de revelar fingerprint em deploys LAN.

### ✨ Novas funcionalidades

- **`feat: 7 modos novos na sidebar agrupada` (FIX-C8)** — cobertura 100% de `modes/` do pai. Novas rotas: `#/project`, `#/training`, `#/followup`, `#/batch`, `#/contacto`, `#/interview-prep`, `#/patterns`. Uma única fábrica de view + endpoint genérico `POST /api/mode/:slug`. Sidebar com 6 grupos. 18 itens. 12 testes novos.
- **`fix: bootstrap do pai + russian_portals defaults` (FIX-C4 + C9 + C12 + H2)** — `bin/start.sh` instala `node_modules` do pai e Playwright Chromium em clones novos. `createApp()` adiciona bloco `russian_portals:` se ausente. 3 testes novos.
- **`fix: desabilitar 9 portais mortos` (FIX-C3)** — 9 slugs marcados `enabled: false`. Novo `scripts/portals-health-check.mjs`. 3 testes.
- **`feat(activity): registro de ações + página Activity`** — toda requisição que muta estado é registrada em `data/activity.jsonl`. Nova entrada na sidebar **Atividade** com filtros tipo chip, badges ✓/✗ e botão refresh. Auto-rotação a 5 MB. 10 novos testes.
- **`feat(deep): Deep Research no navegador + arquivo salvo`** — a página Deep Research agora (a) executa via Gemini com `{ run: true }` e `GEMINI_API_KEY`, persistindo em `interview-prep/{slug}.md`; (b) lista arquivos salvos como cards com timestamps relativos; (c) renderiza resultado como Markdown com **📋 Copiar / ⬇ Baixar .md / ↗ Abrir em aba**. Novos endpoints `GET /api/interview-prep`, `GET /api/interview-prep/:name`, `DELETE /api/interview-prep/:name`. 7 novos testes.
- **`feat(cv): gerar + baixar PDF no navegador, com arquivo PDF`** — botão **📄 Gerar PDF** na página de CV transmite `/api/stream/pdf` em console modal. Se faltar Playwright, mostra o comando exato para instalar. Seção "PDFs gerados" se autocarrega após cada sucesso. Novos endpoints `GET /api/output/pdfs`, `GET /api/output/pdfs/:name`. 6 novos testes.
- **`feat(api): POST /api/tracker — adicionar linhas pela UI` (FIX-H8)** — adiciona linha canônica em `data/applications.md` do navegador. Valida company + role, normaliza status, autoincrementa `#`, dedup por company+role. 6 novos testes.
- **`feat(api): DELETE /api/jds/:name` (FIX-H4)** — apaga JDs salvos sem shell. 5 novos testes.
- **`feat(api): POST /api/evaluate/test-gemini` (FIX-H7)** — endpoint de smoke-test do Gemini.

### 🐛 Correções

- **`fix(router): view 404 catch-all + guarda de cobertura i18n` (FIX-C7)** — rotas desconhecidas exibem agora página 404 dedicada. Novo `tests/i18n-coverage.test.mjs` valida cada chave × 8 locales.
- **`fix(router): alias #/profile → settings` (FIX-C2)** — ambos endereços chegam à mesma view.
- **`fix(health): unificar Health/Doctor + flag de templates` (FIX-C6 + FIX-H6)** — `/api/health` expõe tudo o que Doctor mostrava.
- **`fix(scan): avisar colisão query↔negative na config RU` (FIX-H3)** — `runRuScan()` emite warnings antes de iniciar.
- **`fix(scan): avisar quando HH_USER_AGENT não está definido` (FIX-H1)** — `/scan` mostra card amarelo.
- **`fix(api): warning quando POST /api/jds sanitiza slug` (FIX-M2)** — campo `warning` no response.
- **`fix(ui): limpar busca global ao trocar rota + spinners em botões` (FIX-M4 + FIX-L1)** — novo helper `UI.withSpinner(button, fn)`.
- **`fix(ui): placeholder modal-title vazio` (FIX-H9)** — string `"Title"` removida.

### 🌐 i18n

- 173+ chaves × 8 locales. Cobertura imposta por `tests/i18n-coverage.test.mjs`.

### ⚙️ DevOps

- **Testes:** 73 → **225** (+136 testes em 25 arquivos). Coverage: 93.5% linhas / 82.6% branches.
- **Playwright e2e abrangente** (`tests/e2e-comprehensive.mjs`, 23 passos).
- **GitHub Actions:** `ci.yml`, `ai-review.yml` (Claude Code revisa cada PR), `release.yml`.
- **UI compatível com CSP:** todos `onclick` inline removidos.

### 📦 Novos endpoints REST

| Método | Rota | Função |
|---|---|---|
| `GET`    | `/api/activity`              | Lista de eventos |
| `GET`    | `/api/interview-prep`        | Lista de Deep Research |
| `GET`    | `/api/interview-prep/:name`  | Ler arquivo Deep Research |
| `DELETE` | `/api/interview-prep/:name`  | Apagar Deep Research |
| `GET`    | `/api/output/pdfs`           | Lista de PDFs gerados |
| `GET`    | `/api/output/pdfs/:name`     | Baixar PDF |
| `POST`   | `/api/tracker`               | Adicionar linha em `applications.md` |
| `DELETE` | `/api/jds/:name`             | Apagar JD salvo |
| `POST`   | `/api/evaluate/test-gemini`  | Smoke-test da API key |

---

## [1.6.0] — 2026-05-02

Lançamento inicial do web UI. Inventário de features em `README.md`.
