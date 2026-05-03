# Histórico de mudanças

Todas as mudanças relevantes do **career-ops-ui**. Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), versionamento [SemVer](https://semver.org/lang/pt-BR/).

Traduções: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

---

## [1.7.0] — 2026-05-03

Passagem de hardening + UX de 21 commits orientada pelo relatório de QA do v1.6.0. Pousaram três camadas de segurança (sanitização XSS, CSP, validação de entrada), foram completados os endpoints CRUD que faltavam (DELETE jds, POST tracker), e a UI ganhou duas páginas novas: **Activity** e um **Deep Research** redesenhado que roda no navegador. Cobertura de testes saiu de **73** para **177**, com **14 arquivos de teste novos**.

### 🔒 Segurança

- **`fix(cv): sanitizar Markdown do CV para bloquear XSS persistente` (FIX-C10)** — `PUT /api/cv` remove `<script>`, `<iframe>`, `<object>`, `<embed>`, `<style>`, `<form>`, `<svg>`, handlers `on*=` e URIs `javascript:`/`vbscript:`/`data:text/html` antes de gravar `cv.md`. Limite de 1 MB (413 ao exceder). O `UI.md()` cliente foi reescrito para escapar tudo *antes* das transformações markdown — HTML cru nunca chega ao `innerHTML`. `href` validados por whitelist (`http`/`https`/`mailto`/`tel`/relativos + apenas `data:image`). 17 novos testes.
- **`fix(server): cabeçalhos CSP + segurança baseline` (FIX-L2)** — toda resposta carrega `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`. Quando o servidor escuta além de loopback, aplica CSP estrito: `default-src 'self'`, `script-src 'self'` (sem `unsafe-inline`), Google Fonts permitido, `connect-src 'self'` bloqueia exfiltração. Handlers `onclick` inline migrados para `addEventListener`. 8 novos testes.
- **`fix(api): apertar validador de URL no pipeline` (FIX-M7)** — `POST /api/pipeline` aceitava `"not-a-url"` e persistia. Agora `isValidJobUrl()` rejeita strings sem scheme, comprimento <10 ou >2000, URLs com espaços, schemes não-`http(s)`, hostnames loopback. Inclui **FIX-M3** + **FIX-M6**.
- **`fix(api): sanitizar JD antes do prompt` (FIX-M5)** — `POST /api/evaluate` remove escapes ANSI, bytes de controle, `<script>` inline. Limite 50 KB. Mínimo de 50 chars verificado contra texto *sanitizado*.
- **`fix(health): mascarar Node version + project root quando HOST!=loopback` (FIX-M1)** — `/api/health` deixa de revelar fingerprint em deploys LAN.

### ✨ Novas funcionalidades

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

- **Testes:** 73 → **177** (+104 testes em 14 arquivos novos).
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
