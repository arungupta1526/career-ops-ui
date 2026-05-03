# Histórico de mudanças

Todas as mudanças relevantes do **career-ops-ui**. Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), versionamento [SemVer](https://semver.org/lang/pt-BR/).

Traduções: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

---

## [1.7.2] — 2026-05-04

Help center + "Show result" shortcut on every prompt-builder.

### ✨ New features

- **`feat(help): in-app user guide` (`/#/help`)** — long-form Markdown documentation accessible from a new sidebar entry. Covers every page step-by-step: quick start, CV editor, Profile, Scan filters, Pipeline preview, Evaluate, Deep research, Apply, Tracker, Reports, all 7 modes, Activity log, Health, setup hints. Auto-built sticky table of contents from `<h2>` headings. Localized for all 8 supported locales — full versions in `docs/help/{en,ru}.md`, concise but complete versions in `es / pt-BR / ko-KR / ja / zh-CN / zh-TW`.
- **`feat(modes): "⚡ Show result" button alongside "Copy prompt"`** — when a prompt is generated in manual mode, users no longer have to retype their inputs to get the LLM result. The new button re-submits the same form with `run: true`, falling through to a clear toast (`Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env first`) when no key is configured. Works on `/#/deep`, `/#/project`, `/#/training`, `/#/followup`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns`.

### 📦 New REST endpoint

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/help/:lang` | Returns the Markdown user guide for the requested locale, falling back to `en.md`. Path-traversal-safe (regex sanitizer). |

### 🌐 i18n

- 5 new keys: `nav.help`, `help.title`, `help.subtitle`, `help.toc`, `deep.showResult`, `deep.needKey`. All 8 locales populated.

### 🧪 Tests

- `tests/help.test.mjs` (12 cases): every supported locale returns substantive markdown (>500 chars, starts with `#`); EN spot-checks coverage of every page slug; unknown lang falls back to EN; path-traversal sanitized; all 8 files reference `cv.md` / `profile.yml` / `.env`.

### 📊 Stats

- **Tests:** 233 → **237** (+4 net after the 12 help additions de-duplicated against existing).
- **Coverage:** 93.5% line / 82.6% branch / 93.7% funcs (unchanged).

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
