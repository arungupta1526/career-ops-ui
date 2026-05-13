# Histórico de mudanças

Todas as mudanças relevantes do **career-ops-ui**. Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), versionamento [SemVer](https://semver.org/lang/pt-BR/).

Traduções: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

> **Nota i18n** — a partir da v1.12.0 as entradas estão localizadas em cada idioma. Entradas anteriores (v1.11.x, v1.10.x) permanecem em russo por convenção do projeto; o conteúdo inglês normativo está em [CHANGELOG.md](CHANGELOG.md).

---

## [1.17.0] — 2026-05-13

**Polish + a11y + CI fix release.** Closes 9 follow-ups from v1.16.0 REVIEW: browser smoke verify, README badge truth, coverage refresh, `lastWorkdayFallback` 🔒 chip в SPA, full E2E re-baseline после v1.16 UX-change, Playwright auto-pipeline scenarios, a11y ARIA + focus trap pass, condensed historical CHANGELOG в 6 локалях, expanded non-EN READMEs с reference sections.

### 🐛 Fixes

- **`fix(e2e): smoke + comprehensive re-aligned с v1.16 UX`** — v1.16 Cmd+K Enter → AutoPipeline modal изменение сделало `search.press('Enter')` в e2e тестах открывающим modal. Тесты теперь используют `Shift+Enter` для legacy quick-add path. **Это и был CI failure на push v1.16.0** — Playwright e2e таймаутил 30s на backdrop-intercepted кликах.
- **`fix(mode-page): /#/batch-prompt → modes/batch.md via serverSlug`** — v1.15 переименовал legacy mode slug в `batch-prompt`, но server `POST /api/mode/:slug` искал `modes/batch-prompt.md`. Новое поле `serverSlug` развязывает route hash от parent mode filename.
- **`chore: bump deprecation messages с v1.16.0 → v1.17.0`** — scan-en/scan-ru deprecation copy + batch-prompt banner ссылались на прошедшую версию.

### ✨ Features

- **`feat(scan): 🔒 Workday CAPTCHA chip в Active Companies card`** — server-side `lastWorkdayFallback` export из v1.16 PR-7 теперь consumed в SPA. `/api/scan-results` возвращает snapshot; `#/scan` рендерит warn-tinted card сверху при Workday fallback.

### ♿ Accessibility

- **`a11y: ARIA roles + focus management pass`** —
  - `index.html`: `role` attrs на `<aside>` (navigation), `<header>` (banner), `<section id="content">` (main), `<div id="modal">` (dialog + aria-modal + aria-labelledby), toast/banner (status + aria-live), searchbar (search).
  - `#sidebar-toggle`: `aria-controls` + `aria-expanded` sync.
  - `#global-search`: visually-hidden `<label>` + `aria-label` с Cmd+K hint.
  - Decorative backdrops: `aria-hidden="true"`.
  - **Focus trap в modal** через `UI.modal()` — запоминает click owner, фокусит первый non-close focusable на open, циклит Tab/Shift+Tab внутри modal. `UI.closeModal()` восстанавливает focus.
  - Новый `.visually-hidden` utility class (WAI-ARIA AP стандарт).

### 📚 Документация

- **`docs(readme): badge truth × 8 READMEs`** — tests `284/379/360` → **427**; release `v1.9.1/v1.13.0` → **v1.16.0** → v1.17.0.
- **`docs(readme): расширены 7 non-EN READMEs с reference sections`** — каждый вырос 170 → ~240 строк с Architecture / API / Security / Tests / A11y / Limitations / License разделами на native language.
- **`docs(changelog): condensed pre-v1.12 в 6 локалях`** — длинные RU-bodied v1.11.x + v1.10.x записи заменены на компактный "Earlier releases" exec summary на native language.

### 🛠️ Tooling

- **`coverage: refresh numbers`** — последний публичный был 95.46 % / 84.06 % (v1.13.0 REVIEW). v1.17 baseline: **94.14 % линий / 82.98 % веток / 93.20 % функций**. Slight drop от новых error paths в auto-pipeline + reports-write; всё ещё выше 80 % floor.

### 🧪 Тесты

- Итого: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + **32 / 32** Playwright (было 28; +4 новых auto-pipeline scenarios).

### Out of scope (v1.18+)

| Item | Notes |
|---|---|
| Translate v1.16.0 в non-EN CHANGELOGs | Сейчас RU-bodied (~30 строк × 6 = 180). Был вне явного scope (только v1.11.x/v1.10.x). |
| Full non-EN README parity (585 строк как EN) | v1.17 принёс non-EN до ~240; marketing-heavy секции остаются EN-only. |
| Parent commit для canonical A-F prompt | Всё ещё ждёт upstream rewrite `santifer/career-ops::modes/oferta.md`. |
| Full WCAG 2.2 AA audit | v1.17 покрыл structural ARIA + focus trap; per-component contrast/Tab-order — отложено. |

---

## [1.16.0] — 2026-05-13

**Auto-pipeline finalization + adapter polish + i18n long-tail.** Закрывает все 11 follow-up из v1.15.0 REVIEW: server-side SSE auto-pipeline, `POST /api/reports` primitive, Cmd+K shortcut, SmartRecruiters пагинация, Workday CAPTCHA-fallback, CI screenshot-drift gate, scan source filter UX, перевод исторического CHANGELOG (v1.13.0/v1.12.0 × 6 локалей), расширение non-EN READMEs, paste-ready trending-companies importer.

### ✨ Фичи

- **`feat(auto-pipeline): server-side SSE orchestrator`** (#1, #2, #3, #8) — v1.15 client-side chained-fetch orchestrator удалён. `POST /api/auto-pipeline` теперь curl-able SSE endpoint, гоняющий chain validate → fetch JD → evaluate → save report → tracker server-side с real-time step events. Медленный Anthropic call (30–90 с) теперь эмитит `running` event вместо generic спиннера. Failures эмитят `error` с `step` + `message`. Orchestrator также persist'ит report markdown в parent `reports/<slug>.md` (терялось в v1.15).
- **`feat(reports): POST /api/reports primitive`** — новый writer в `server/lib/routes/reports.mjs`. Slug sanitization с path-traversal guard. 1 MB cap (413). 409 на existing file без `overwrite:true`. Atomic write через `stripDangerousMarkdown`. Тесты: 9 кейсов.
- **`feat(app): Cmd+K paste URL → auto-pipeline`** — paste URL в global search + Enter теперь открывает AutoPipeline modal с `autoStart=true`. Shift+Enter сохраняет legacy "add to pipeline only" поведение.
- **`feat(portals): SmartRecruiters пагинация`** (#4) — обходит ВСЕ страницы, не только первые 100. Safety cap: 30 страниц / 3000 jobs. Strip caller-supplied limit/offset. Тесты: 6 кейсов.
- **`feat(portals): Workday CAPTCHA-fallback graceful`** (#7) — не throws на 4xx / non-JSON / network errors. Возвращает `[]` и аннотирует `lastWorkdayFallback`. Опт-ин обратно через `strict:true`. Тесты: 7 кейсов.

### 🛠️ Tooling + CI

- **`ci(workflows): dashboard-screenshots drift gate`** (#5) — `.github/workflows/dashboard-screenshots.yml` регенерит 8 hero PNGs и валит build при visual drift'е.
- **`feat(scripts): import-trending-companies.mjs`** (#11) — верифицирует 13 trending компаний из `docs/portals-examples.md` и эмитит paste-ready YAML. Запуск: `npm run import:trending`.
- **`feat(scripts): npm run capture:dashboards`** — exposes Playwright capture как top-level script.

### 🎨 UX

- **`fix(scan): consolidated source-filter dropdown`** (#6) — dropdown пересобран из v1.14 adapter registry: 6 ATSes + hh.ru + Habr Career, алфавитный порядок, без geo-префиксов. `runEnScan`/`runRuScan` теперь используют `/api/stream/scan?source={ats,regional}` consolidated endpoint.

### 📚 i18n long-tail

- **`docs(i18n): translate v1.13.0 + v1.12.0 CHANGELOG в 6 локалях`** (#9) — записи переведены на их фактический язык. Каждая локаль также получает i18n note о том что pre-v1.12 записи остаются RU-bodied per project convention.
- **`docs: expand non-EN READMEs с v1.16.0 highlights section`** (#10) — 6 non-EN READMEs + RU READMEs получают ~35-line section про auto-pipeline + curl example + остальные v1.16 фичи.

### 🧪 Тесты

- Новые `tests/reports-write.test.mjs` (9), `tests/auto-pipeline.test.mjs` (5), `tests/smartrecruiters-pagination.test.mjs` (6), `tests/workday-fallback.test.mjs` (7).
- Итого: **427 / 427** unit (было 400; +27). 0 failures.

### Out of scope (v1.17+)

| Item | Notes |
|---|---|
| Parent commit для canonical A-F prompt | Всё ещё ждёт upstream rewrite `santifer/career-ops::modes/oferta.md` (CLAUDE.md hard rule #1). |
| Translate pre-v1.12 CHANGELOG (v1.11.x, v1.10.x) | Сохранена convention: RU-bodied. ~1800 строк перевода — отложено. |
| Full non-EN README паритет (585 строк как EN) | v1.16 добавил ~35 строк per locale; полный паритет — отдельный effort. |

---

## [1.15.0] — 2026-05-13

**Doc-conformance релиз.** Закрывает 9 из 10 открытых findings из conformance audit (`qa/conformance-vs-docs/00-CONFORMANCE-REPORT.md`) плюс локализованные hero-images. Приводит UI в соответствие с canonical career-ops.org/docs workflow — тот же pipeline что обещает CLI, теперь end-to-end через браузер во всех 8 локалях.

### ✨ Фичи

- **`feat(auto-pipeline): PR-C — 1-click "paste URL → report + PDF + tracker row"`** (G-007) — до v1.15 пользователи делали 5 ручных кликов через /#/pipeline → /#/evaluate → /#/cv → /#/tracker. Теперь одна ✨ кнопка на /#/dashboard chain'ит: validate URL → fetch JD (SSRF-safe) → evaluate против CV → generate PDF → добавить tracker row. Step-by-step modal timeline с [✓]/[…]/[✗]. Heuristic company/role extraction. Новый файл: `public/js/lib/auto-pipeline.js`. 19 новых i18n ключей × 8 локалей.
- **`feat(modes): PR-D — modes/_profile.md редактор как #/config → Modes таб`** (G-008) — канонический "Career framing" файл из Quick Start §Step-5 теперь виден в UI. Новые endpoints `GET/PUT /api/modes/_profile` с 256 KB cap, `stripDangerousMarkdown` XSS pass, scaffold из `_profile.template.md`. 9 новых i18n ключей × 8 локалей.
- **`feat(profile): PR-E — canonical schema + location + headline`** (G-009) — `/api/profile` принимает И legacy (`candidate:{...}`) И canonical (top-level `full_name`, `narrative.headline`, `target_roles.primary`, `compensation.target_range`). Legacy выигрывает при коллизии. Новый `summarizeProfile()`. /#/profile показывает `narrative.headline` как новую карточку. 2 новых i18n ключа × 8 локалей.
- **`feat(tracker): PR-B — Legitimacy колонка на #/tracker`** (G-006) — восстанавливает паритет с canonical pipeline output table. Между Status и PDF, badge-ok/warn/bad подсветка. Graceful degrade для pre-v1.15 строк. 1 новый i18n ключ × 8 локалей.
- **`fix(routing): PR-H — dedupe sidebar; #/batch → v1.13.0 TSV SPA`** (G-011) — до фикса /#/batch был ДВАЖДЫ в sidebar И оба пункта вели в legacy mode-prompt builder. v1.13.0 TSV SPA (8 KB) был недоступен. Убран дубликат; legacy переименован в `batch-prompt` с deprecation banner.

### 📚 Документация

- **`docs(evaluate): PR-A — Block A-F realignment`** (G-005) — career-ops.org/docs использует A–F (Strategy/Personalization/STAR stories в C/E/F). Мы эмитили A–G. v1.15 обновляет все 8 help bundles §9 с canonical A–F и callout о back-compat. ⚠ Parent commit ещё требуется: `santifer/career-ops::modes/oferta.md` надо переписать upstream.
- **`docs: PR-F — seniority_boost + search_queries в help §5 × 8 локалей + scaffold`** (G-010) — Help §5 во всех 8 локалях документирует третий title-filter ключ + блок-пример search_queries. `bin/setup.sh` сидит `seniority_boost: ["Senior", "Staff", "Lead"]` по умолчанию.
- **`docs: PR-I — локализованные hero images по локалям README`** — каждый из 8 README имеет locale-specific `images/dashboard-<locale>.png` (HiDPI 1440×900) сгенерированных через `scripts/capture-dashboard-screenshots.mjs`. Старый `public/images/screen_vacancy_found.png` удалён.

### 🧹 Carryover cleanups

- **`PR-G — G-001`** scan.noResults i18n: заменены 8 строк с "EN or RU scan" литералом.
- **`PR-G — G-002`** 📄 Generate PDF теперь surface'ит на #/interview-prep result panel'ях.
- **`PR-G — G-003`** `README.cn.md` → `README.zh-CN.md` (canonical locale tag).
- **`PR-G — G-004`** `/api/stream/scan-en` + `scan-ru` теперь эмитят RFC 8594 Sunset + Deprecation + Link headers (sunset 2026-10-01). Удаление в v1.16.0.

### 🧪 Тесты

- Новый `tests/profile-canonical-schema.test.mjs` (6 кейсов).
- Новый `tests/modes-profile-crud.test.mjs` (8 кейсов).
- Исправлена isolation регрессия в test fixtures: тесты теперь используют `before/after + dynamic-import` pattern, чтобы не мутировать parent `config/profile.yml`.
- Итого: **400 / 400** unit-тестов (было 386; +14). 0 падений.

### Out of scope (v1.16+)

| Item | Notes |
|---|---|
| Parent commit для canonical A–F prompt | `santifer/career-ops::modes/oferta.md` надо переписать upstream. CLAUDE.md hard rule #1 запрещает нам трогать parent. |
| Server-side `POST /api/auto-pipeline` SSE | Client-side orchestrator ships UX win; server-side даст retry-from-step-N + curl-able CI. |
| `POST /api/reports` primitive | Auto-pipeline показывает markdown inline, но не persist'ит в parent `reports/`. |
| Cmd+K paste-URL → run auto-pipeline | Defer to v1.16+. |

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

Grande release. Fecha os 4 itens adiados em um único commit: PR-4 (pipeline multer completo), Adapter registry (continuação arquitetural do F-018), página SPA Batch evaluate, e locale-aware mode-template scaffolding. Mais um fix mid-session de tabelas em dark theme.

### ✨ Features

- **`feat(cv): multer multipart upload (PR-4 completo)`** — `/api/cv/import` agora aceita TANTO octet-stream (contrato original) QUANTO `multipart/form-data` via multer. O 415-reject da v1.10.2 era um stopgap; v1.13.0 é o fix real. curl `-F`, default do Postman, qualquer cliente HTTP funcionam sem atrito. Nova dependência: `multer ^2.1.1`.
- **`feat(portals): adapter registry`** — fetchers de Greenhouse / Ashby / Lever extraídos para `server/lib/portals/adapters/*.mjs` com contrato uniforme. `server/lib/portals/registry.mjs::resolveAdapter()` é o único ponto de dispatch. Adicionar um novo ATS = um arquivo em `adapters/` + uma linha em `ALL_ADAPTERS`.
- **`feat(batch): #/batch evaluate page`** — nova view SPA + 4 endpoints (`GET /api/batch`, `PUT /api/batch`, `GET /api/stream/batch`, `POST /api/batch/merge`). Editor TSV para `batch/batch-input.tsv`, controles parallel/min-score/dry-run/retry, log SSE ao vivo de `bash batch/batch-runner.sh`, botão `Merge to tracker` (executa `node merge-tracker.mjs`). Link no sidebar. 21 chaves i18n novas × 8 locales.
- **`feat(prompts): locale-aware mode scaffolding`** — `buildModePrompt` + `buildEvaluationPrompt` agora envolvem o corpo inglês do mode-template do parent com scaffolding localizado (role-line, "Read these files first", "User-supplied context") em 8 locales.

### 🎨 UX fixes

- **`fix(theme): tabelas dark-mode + tab-btn`** — `#fafafa` / `#fff` / `#f7f7f7` hardcoded substituídos por tokens. Hover em dark agora legível. Adicionado `.row-boosted` accent strip.

### 🧪 Testes

- Novos `tests/adapter-registry.test.mjs` (7), `tests/batch-endpoints.test.mjs` (5), `tests/locale-scaffold.test.mjs` (6).
- `tests/cv-upload-multipart-reject.test.mjs` reescrito ao contrato v1.13.0 (multipart parsed properly).
- Total: **379 / 379** unit (era 360; +19). 0 falhas. Cobertura **95.46 % linhas / 84.06 % branches**.
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright.

### Fora de escopo

- **14 adapters de portal novos** — registry pronto; adicionar = um arquivo cada; pesquisa portal-by-portal continua pendente.
- **Traduzir corpos de `modes/<slug>.md` do parent** — requer PR upstream para `santifer/career-ops` (CLAUDE.md hard rule #1).

### Documentação

- `docs/reviews/REVIEW-2026-05-13-v1.13.0.md`.
- Texto completo: [CHANGELOG.md](CHANGELOG.md#1130--2026-05-13).

---

## [1.12.0] — 2026-05-13

Pass de bug-fix + UX + brand. Fecha 8 itens do backlog após v1.11.1 (gaps de teste #9–12, console error #8, drift portals-dead #4, surface seniority_boost #6, consolidação de endpoint F-018). Adicionado toggle day/night de tema, removida a menção "Airbnb-styled" de todos os docs, metadata do package e descrição do repo GitHub.

### ✨ Features

- **`feat(theme): toggle day/night`** — novo botão de tema na top-bar. Ciclo light ↔ dark, persiste em `localStorage`, restaurado antes do primeiro pintado via `public/js/lib/theme-bootstrap.js`. Respeita `prefers-color-scheme` no primeiro load. Paleta dark completa em `public/css/app.css` sob `[data-theme="dark"]`.
- **`feat(scan): /api/stream/scan?source=ats|regional|both` (F-018 LITE)`** — um endpoint SSE consolidado. O SPA abre UM único event-stream que executa sequencialmente ambas as fases (ATS, depois regional). Legacy `/api/stream/scan-en` + `/api/stream/scan-ru` permanecem como deprecated aliases.
- **`feat(scan): seniority_boost surface`** — ambos os scanners leem `portals.yml::title_filter.seniority_boost` e marcam `_boosted: true` em jobs coincidentes. O SPA ordena as linhas boosted no topo e renderiza um badge `⬆ boosted`.

### 🐛 Fixes

- **`fix(ui): .message null-safe em 4 lugares (#8)`** — `app.js`, `views/tracker.js`, `views/apply.js`, `views/evaluate.js`. Antes um Promise rejection sem Error payload lançava "Cannot read properties of undefined" em e2e teardown.
- **`fix(test): drift portals-dead como warning, não failure (#4)`** — assertion convertida em warning no stderr. CI continua verde em parent drift; decisões de release são manuais.

### 📝 Brand / docs

- **`docs(brand): removidas referências 'Airbnb' de todos os doc + package + descrição do repo GitHub`** — 8 README, CLAUDE.md, FRONTEND.md, package.json e a descrição do repo migrados de "Airbnb-styled" para "Clean, docs-style".

### 🧪 Testes

- Novo `tests/canonical-docs-coverage.test.mjs` (5 casos) fecha test gaps #9–12.
- Novo `tests/scan-consolidated.test.mjs` (6 casos) cobre F-018 LITE.
- Total: **360 / 360** unit (era 349; +11 novos). 0 falhas. Cobertura: **95.62 % linhas / 84.37 % branches**.
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright.

### Documentação

- `docs/reviews/REVIEW-2026-05-13-v1.12.0.md`.
- Texto completo: [CHANGELOG.md](CHANGELOG.md#1120--2026-05-13).

### Fora de escopo (sem mudanças desde v1.11.1)

Página SPA Batch evaluate; adapter registry completo (refactor arquitetural F-018); pipeline multer completo (PR-4); tradução de mode templates.

---

## Releases anteriores (v1.11.x e v1.10.x)

As entradas detalhadas para v1.11.0 / v1.11.1 / v1.10.0–v1.10.3 vivem no [CHANGELOG EN](CHANGELOG.md). Resumo executivo:

- **v1.11.1 — 2026-05-13** · Polish: dica Playwright em `#/apply`, taglines unificadas, score-thresholds card no dashboard. 349/349 testes.
- **v1.11.0 — 2026-05-13** · Integração career-ops.org/docs em todas as 8 help bundles e nos 8 README. Novo `docs/career-ops-canonical.md`. Conceitos Mode/Archetype/Pipeline/Tracker/Report/Scan history documentados. 348/349 testes.
- **v1.10.3 — 2026-05-12** · Bug-fix slice: fecha 7 de 11 achados QA do run de regressão v1.10.2.
- **v1.10.2 — 2026-05-12** · CV multipart 415-reject (correção temporária até o multer da v1.13.0); fix de geração de PDF.
- **v1.10.1 — 2026-05-09** · Patch crítico do QA regression run da v1.10.0.
- **v1.10.0 — 2026-05-08** · Editor `#/profile` + UX de upload de CV (pandoc/pdftotext/passthrough), 8 locales × 16 H2 help parity, locale switcher.
