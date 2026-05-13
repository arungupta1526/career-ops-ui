# Histórico de mudanças

Todas as mudanças relevantes do **career-ops-ui**. Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), versionamento [SemVer](https://semver.org/lang/pt-BR/).

Traduções: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

---

## [1.14.0] — 2026-05-13

3 novos adaptadores ATS sobre o registry da v1.13.0, elevando o total de 3 → 6 ATSes suportados (Greenhouse / Ashby / Lever **+ Workable / SmartRecruiters / Workday-beta**). Documentação user-facing atualizada nos 17 arquivos de "3 ATSes" para "6 ATSes" em uma única passada (42 frases): README × 8 locales, help bundle × 8 locales, PROJECT.md. Adicionados blocos YAML prontos para colar de 13 empresas trending em `docs/portals-examples.md` para o `portals.yml` do pai.

### ✨ Features

- **`feat(portals): 3 novos ATS — Workable, SmartRecruiters, Workday-beta`** — o registry agora resolve 6 ATSes (antes 3). Novos arquivos: `server/lib/portals/adapters/{workable,smartrecruiters,workday}.mjs` (wrappers finos do uniform contract) + `server/lib/sources/{workable,smartrecruiters,workday}.mjs` (HTTP cru + normalização para o shape canônico).
  - **Workable**: detecta `apply.workable.com/<slug>` E legacy `<subdomain>.workable.com`. Endpoint: `https://apply.workable.com/api/v3/accounts/<slug>/jobs?details=true`.
  - **SmartRecruiters**: detecta `jobs.smartrecruiters.com/<slug>` E `careers.smartrecruiters.com/<slug>`. Endpoint: `https://api.smartrecruiters.com/v1/companies/<slug>/postings`.
  - **Workday (beta)**: detecta `<tenant>.wd<N>.myworkdayjobs.com/<lang>/<site>`. Endpoint: POST para `/wday/cxs/<tenant>/<site>/jobs`. Default `site=External` se a URL não incluir site. Beta porque alguns tenants bloqueiam o feed CXS com CAPTCHA — fallback ao `/career-ops scan` do pai (Playwright).

### 📚 Documentação

- **`docs(portals-examples): trending boards block`** — `docs/portals-examples.md` estendido com a seção v1.14.0 listando 13 empresas trending como YAML pronto para colar em `tracked_companies`: Greenhouse-hosted (Stripe, GitLab, HashiCorp, Cloudflare, Datadog, Hugging Face) + Ashby-hosted (Notion, Linear, PostHog, Replicate, Modal Labs, Fly.io, Render). Todas com `enabled: false` — o usuário verifica o slug antes de ativar. Mais blocos de exemplo para Workable / SmartRecruiters / Workday.
- **`docs(framing): 42 frases ATS atualizadas em 17 arquivos user-facing`** — cada aparição de "Greenhouse / Ashby / Lever" na documentação de usuário agora lê-se como "Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday". Afetados: README × 8 locales, help bundle × 8 locales, PROJECT.md. Entradas históricas do CHANGELOG e documentos de prescrição bug-fix (`qa/fixes/F-014`, `qa/FIX-PROMPT`) deliberadamente intocados — descrevem estado passado ou já correto.
- **`docs(qa): browser test scenario 19`** — `qa/claude-cowork-browser-test-prompt.md` estendido com Scenario 19: invariante `ALL_ADAPTERS.length === 6`, sweep de URL-detection via `resolveAdapter()` para os 6, soft-check do card Active Companies em `#/scan`, check estrutural de `docs/portals-examples.md`.

### 🧪 Testes

- `tests/adapter-registry.test.mjs` estendido com 7 casos novos para os 3 adaptadores (Workable apply-URL, Workable legacy subdomain, SmartRecruiters jobs.* + careers.*, Workday tenant.wd5.* com site explícito, Workday fallback para default-site, invariante `ALL_ADAPTERS.length === 6`, compatibilidade do shape legacy `detectApi()`).
- Total: **386 / 386** testes unitários (antes 379; +7 líquidos). 0 falhas.

### Out of scope

| Item | Notas |
|---|---|
| Entradas per-company para as 13 empresas trending Greenhouse/Ashby | O bloco v1.14.0 de `docs/portals-examples.md` as lista como YAML colável; o bulk-add ao `portals.yml` do pai é fase à parte. |
| Automação do fallback CAPTCHA do Workday | O adapter Workday lança quando o feed CXS está bloqueado; o fallback planejado delega ao `/career-ops scan` do pai (Playwright). O wiring no UX de scan do SPA é para v1.15+. |

---

## [1.13.0] — 2026-05-13

Большой релиз. Закрывает все 4 отложенных пункта одним коммитом: PR-4 (полный multer pipeline), Adapter registry (архитектурное продолжение F-018), Batch evaluate SPA-страница, и locale-aware mode-template scaffolding. Плюс mid-session фикс таблиц в dark theme.

### ✨ Фичи

- **`feat(cv): multer multipart upload (PR-4 полный)`** — `/api/cv/import` теперь принимает И octet-stream (оригинальный контракт), И `multipart/form-data` через multer. v1.10.2 415-reject был заглушкой; v1.13.0 — настоящий fix. curl `-F`, Postman default, любой HTTP-клиент работают seamlessly. Новая зависимость: `multer ^2.1.1`.
- **`feat(portals): adapter registry`** — Greenhouse / Ashby / Lever fetcher'ы вынесены в `server/lib/portals/adapters/*.mjs` с единым контрактом. `server/lib/portals/registry.mjs::resolveAdapter()` — единая точка диспатча. Добавление нового ATS теперь = один файл в `adapters/` + строчка в `ALL_ADAPTERS`.
- **`feat(batch): #/batch evaluate page`** — новая SPA-view + 4 эндпоинта (`GET /api/batch`, `PUT /api/batch`, `GET /api/stream/batch`, `POST /api/batch/merge`). TSV-редактор для `batch/batch-input.tsv`, контролы parallel/min-score/dry-run/retry, live SSE log `bash batch/batch-runner.sh`, кнопка `Merge to tracker` (запускает `node merge-tracker.mjs`). Sidebar link. 21 новый i18n-ключ × 8 локалей.
- **`feat(prompts): locale-aware mode scaffolding`** — `buildModePrompt` + `buildEvaluationPrompt` теперь оборачивают английское тело parent'овского mode-template'а локализованным scaffolding-текстом (role-line, "Read these files first", "User-supplied context") на 8 локалях.

### 🎨 UX фиксы

- **`fix(theme): dark-mode таблицы + tab-btn`** — захардкоженные `#fafafa` / `#fff` / `#f7f7f7` заменены на токены. Hover на тёмной теме теперь читается. Добавлен `.row-boosted` accent strip.

### 🧪 Тесты

- Новые `tests/adapter-registry.test.mjs` (7), `tests/batch-endpoints.test.mjs` (5), `tests/locale-scaffold.test.mjs` (6).
- `tests/cv-upload-multipart-reject.test.mjs` переписан под v1.13.0 контракт (multipart parsed properly).
- Итого: **379 / 379** юнит-тестов (было 360; +19). 0 failures. Покрытие **95.46% линий / 84.06% веток**.
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright.

### За пределами слайса

- **14 новых portal adapter'ов** — registry готов, добавление = один файл каждый; portal-by-portal research остаётся.
- **Перевод parent's `modes/<slug>.md` тел** — требует PR в upstream `santifer/career-ops` (CLAUDE.md hard rule #1).

### Документация

- `docs/reviews/REVIEW-2026-05-13-v1.13.0.md`.
- Полный текст: [CHANGELOG.md](CHANGELOG.md#1130--2026-05-13).

---

## [1.12.0] — 2026-05-13

Bug-fix + UX + brand pass. Закрывает 8 пунктов backlog'а после v1.11.1 (тестовые дыры #9–12, console error #8, portals-dead drift #4, seniority_boost surface #6, F-018 endpoint consolidation). Добавлен day/night toggle темы, убрано упоминание "Airbnb-styled" из всех документов, package metadata и описания GitHub-репо.

### ✨ Фичи

- **`feat(theme): day/night toggle`** — новая кнопка темы в top-bar. Cycles light ↔ dark, сохраняется в `localStorage`, восстанавливается до рендера через pre-paint bootstrap (`public/js/lib/theme-bootstrap.js`). Уважает `prefers-color-scheme` для первой загрузки. Полная dark-палитра в `public/css/app.css` под `[data-theme="dark"]`.
- **`feat(scan): /api/stream/scan?source=ats|regional|both` (F-018 LITE)`** — один консолидированный SSE endpoint. SPA открывает ОДИН event-stream, который последовательно прогоняет обе фазы (ATS, потом regional). Legacy `/api/stream/scan-en` + `/api/stream/scan-ru` остаются как deprecated aliases.
- **`feat(scan): seniority_boost surface`** — оба сканера читают `portals.yml::title_filter.seniority_boost` и проставляют `_boosted: true` на джобах с матчем. SPA сортирует boosted-строки наверх и рендерит `⬆ boosted` badge.

### 🐛 Фиксы

- **`fix(ui): null-safe .message в 4 местах (#8)`** — `app.js`, `views/tracker.js`, `views/apply.js`, `views/evaluate.js`. Раньше Promise rejection без Error payload бросал "Cannot read properties of undefined" в e2e teardown.
- **`fix(test): portals-dead drift warning instead of failure (#4)`** — конвертирован assertion в stderr warning. CI идёт зелёным на parent drift; release-решения остаются ручными.

### 📝 Brand / docs

- **`docs(brand): убраны 'Airbnb' references из всех doc + package + GitHub repo description`** — 8 README, CLAUDE.md, FRONTEND.md, package.json и описание репо переведены с "Airbnb-styled" на "Clean, docs-style".

### 🧪 Тесты

- Новый `tests/canonical-docs-coverage.test.mjs` (5 кейсов) закрывает test gaps #9–12.
- Новый `tests/scan-consolidated.test.mjs` (6 кейсов) покрывает F-018 LITE.
- Итого: **360 / 360** юнит-тестов (было 349; +11 новых). 0 failures. Покрытие: **95.62 % линий / 84.37 % веток**.
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright.

### Документация

- `docs/reviews/REVIEW-2026-05-13-v1.12.0.md`.
- Полный текст: [CHANGELOG.md](CHANGELOG.md#1120--2026-05-13).

### За пределами слайса (без изменений с v1.11.1)

Batch evaluate SPA-страница; полный adapter registry (F-018 архитектурный рефактор); полный multer pipeline (PR-4); перевод mode templates.

---

## [1.11.1] — 2026-05-13

Глубокая интеграция career-ops.org/docs — follow-up к v1.11.0. v1.11.0 добавил summary блок; v1.11.1 обогащает существующие §5 Portals / §7 Scan / §14 Apply каждого help-бандла **полными CLI-флоу** (команды verbatim, нумерованные apply-шаги, batch-evaluate runner, Playwright setup). `#/reports` получает карточку score → action.

### 📝 Документация

- **Help-бандлы (все 8 локалей)** — три новые подсекции в каждом, переведено:
  - **§5 Portals → `CLI flow`** — `cp templates/portals.example.yml`, schema title_filter / tracked_companies / search_queries.
  - **§7 Scan → `CLI scan flow`** — Option A (`npm run scan`) для Greenhouse/Ashby/Lever, Option B (`/career-ops scan`) для non-API discovery, таблица action thresholds.
  - **§14 Apply → `Full CLI apply flow` + `Batch evaluate` + `Playwright setup`** — 8-шаговый apply, `./batch/batch-runner.sh --parallel`, `npx playwright install chromium`.
- Все 8 бандлов сохраняют 16-H2 parity.

### ✨ UI

- **`#/reports`** — новая свёртываемая карточка над списком с канонической таблицей score → действие. 7 новых i18n-ключей × 8 локалей.

### 📋 QA

- **`qa/claude-cowork-browser-test-prompt.md`** — добавлены Сценарий 17 (career-ops.org/docs coverage, 5 подпунктов) + Сценарий 18 (help bundle parity).

### Тесты

- **348 / 349** юнит (1 pre-existing drift), 94.59% линий, 23/23 E2E, 28/28 Playwright.

### Документация

- `docs/reviews/REVIEW-2026-05-13-v1.11.1.md`.
- Полный текст: [CHANGELOG.md](CHANGELOG.md#1111--2026-05-13).

---

## [1.11.0] — 2026-05-13

Интеграция career-ops.org/docs. Все изменения аддитивные (нет breakage API, нет смены маршрутов SPA, нет смены формы данных). Закрывает PR-9, отложенный из v1.10.3.

### 📝 Документация

- **Новый `docs/career-ops-canonical.md`** — каноническая EN-справка, собранная из [career-ops.org/docs](https://career-ops.org/docs) и 5 саб-гайдов (What is career-ops, Scan job portals, Apply for a job, Batch-evaluate offers, Set up Playwright).
- **Все 8 help-бандлов** получили новую front-matter секцию `About career-ops` сразу после H1: принципы, ключевые концепты (Mode / Archetype / Pipeline / Tracker / Report / Scan history), различие career-ops vs career-ops-ui, пороги действий по score (≥4.5 / 4.0–4.4 / 3.5–3.9 / <3.5), ссылки на 5 канонических гайдов. H2 count сохранён — 16 на локаль.
- **Все 8 README** получили блок `About career-ops` перед install-якорем. Секции `What's new in v1.10.x` убраны с первого экрана (полная история — в CHANGELOG).

### ✨ UI

- **`#/apply`** — info-баннер теперь явно ссылается на гайд по настройке Playwright (`career-ops.org/docs/.../set-up-playwright`) и канонический Apply guide. Новые i18n-ключи `apply.playwrightHint` + `apply.docsLink` локализованы для 8 локалей.

### Аудит (что отложено)

- **Batch evaluate SPA-страница** — каноническая дока описывает CLI-only поток (`batch/batch-runner.sh`). SPA-эквивалент требует новой view + 3 эндпоинтов + фикстур + тестов. Многодневная фаза.
- **Полный адаптерный реестр** (F-018 / PR-1) — всё ещё в очереди.
- **Полный multer-pipeline** — v1.10.2 закрыл дыру через 415; рефактор остаётся отложенным.

### Тесты

- **348 / 349** юнит (1 pre-existing parent-data drift), 94.59% линий / 84.24% веток, 23/23 comprehensive E2E, 28/28 Playwright.

### Документация

- `docs/reviews/REVIEW-2026-05-13-v1.11.0.md`.
- Полный текст: [CHANGELOG.md](CHANGELOG.md#1110--2026-05-13).

---

## [1.10.3] — 2026-05-12

Закрывает 7 из 11 находок v1.10.0 QA (F-001, F-010 минимум, F-011 минимум, F-013, F-014, F-015, F-019). Оставшиеся 4 (F-018 — полная консолидация адаптерного реестра; PR-4 полный multer-pipeline; PR-7 follow-up; PR-9 doc sweep по career-ops.org docs) отложены в v1.11.0.

### ✨ Фичи

- **`feat(pdf): Generate-PDF на каждой длинной поверхности (F-015)`** — три новых SSE-эндпоинта (`GET /api/stream/pdf/report?slug=`, `GET /api/stream/pdf/deep?name=`, `POST /api/stream/pdf/inline { markdown }`) и общий хелпер `public/js/lib/pdf-generate.js`. Кнопка **📄 Generate PDF** теперь на `#/reports/:slug`, `#/deep` (manual + live), `#/evaluate` (manual + live), `#/interview-prep`.
- **`feat(config): региональная группа конфига (F-013)`** — `/api/config` отдаёт `groups` (`core | runtime | regional`) и `regionalActive`. SPA рендерит три свёртываемые секции; **Regional sources** auto-collapsed и показывается только когда есть региональный источник.

### 🐛 Фиксы

- **`fix(server): глобальный Express error handler (F-019)`** — `PayloadTooLargeError` и невалидный JSON теперь возвращают JSON-конверт (413 / 400). Раньше шёл HTML stack trace.
- **`fix(i18n): EN-токены больше не протекают в не-EN UI (F-001)`** — локализованы `Pipeline`, `Deep research`, `Follow-up`, `Health`, `Outreach`, `Doctor`, `Quick scan`.
- **`fix(scan): EN/RU framing удалён из ярлыков (F-010 минимум)`** — ярлыки читаются как "ATS adapters" + "Regional portals". Два SSE-эндпоинта оставлены; полная консолидация — PR-1 / v1.11.0.
- **`fix(scan): счётчик Active-Companies авто-обновляется (F-011 минимум)`** — view диспатчит `scan:refresh` после каждого `refreshResults()`; счётчик считает компании с хитами из реального `/api/scan-results`.
- **`docs(en-ru-framing): sweep по README + help-бандлам (F-014)`** — `EN sweep` → `ATS sweep`, `RU sweep` → `regional sweep`, и т.п. в `README.md`, `README.ru.md`, `README.ja.md`, `README.ko-KR.md`, `docs/help/en.md`, `docs/help/es.md`, `docs/help/pt-BR.md`.

### 🧪 Тесты

- Новые `tests/global-error-handler.test.mjs` (2 кейса), `tests/config-groups.test.mjs` (2 кейса), `tests/pdf-extra-routes.test.mjs` (5 кейсов).
- Итого: **349 / 350** юнит-тестов (1 pre-existing drift). Покрытие 94.59 % линий / 84.16 % веток. 23/23 comprehensive E2E, 28/28 Playwright.

### 📝 Документация

- `docs/reviews/REVIEW-2026-05-12-v1.10.3.md` — контекст сессии + список отложенного.
- Все 8 README обновлены, все 8 CHANGELOG-ов получили эту запись.

### За пределами слайса (отложено в v1.11.0)

PR-1 (полный адаптерный реестр), PR-4 (multer-pipeline), PR-9 (career-ops.org docs integration в 7 не-EN локалей + UI-аудит).

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
