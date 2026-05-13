# Histórico de mudanças

Todas as mudanças relevantes do **career-ops-ui**. Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), versionamento [SemVer](https://semver.org/lang/pt-BR/).

Traduções: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

> **Nota i18n** — a partir da v1.12.0 as entradas estão localizadas em cada idioma. Entradas anteriores (v1.11.x, v1.10.x) permanecem em russo por convenção do projeto; o conteúdo inglês normativo está em [CHANGELOG.md](CHANGELOG.md).

---

## [1.19.0] — 2026-05-13

**WCAG 1.4.3 contrast + scan unification (final) + HH_USER_AGENT removed from UI.** Closes the v1.18 out-of-scope contrast audit, finishes the EN/RU split elimination begun in v1.18, and removes the `HH_USER_AGENT` configuration knob from the UI per user direction (a sensible default bundled in the server already handles non-RU IPs for most users).

### ♿ WCAG 1.4.3 contrast pass

- **`a11y(contrast): introduce AA-passing *-text variants for accent tokens`** — light theme: `--rausch-text: #b80f42` (6.59:1 on white, was 3.52:1), `--kazan-text: #066507` (7.31:1, was 4.53:1), `--darjeeling-text: #7a5800` (5.73:1 on amber bg, was 4.24:1), `--babu-text: #00665e` (6.09:1, was 2.70:1). Dark theme: lightened mirrors (`#ff8aa0`, `#6ee7b7`, `#fcd34d`, `#5eead4`) hit the same 4.5:1 floor on `#161a22` paper.
- Badge classes (`.badge-ok`, `.badge-warn`, `.badge-bad`, `.badge-info`) and score pills (`.score-high`, `.score-mid`, `.score-low`) now route through the new `*-text` variants — every text-on-tinted-bg combo passes AA. The accent fill tokens (`--rausch`, `--kazan`, etc.) stay unchanged for borders and outlines (which only need 3:1 for non-text UI components).

### 🧹 Scan unification (finishes v1.18 work)

- **`docs(scan): scrub remaining EN/RU split references across READMEs + help + architecture docs`** — eight READMEs + eight help bundles + three architecture docs (API.md, SERVER.md, OVERVIEW.md, DATA-FLOWS.md) + scan.js comment now describe a single consolidated scan method. The legacy `/api/stream/scan-{en,ru}` aliases were already gone in v1.18; v1.19 catches the doc/copy that still framed scanning as a two-step EN+RU process.
- **`feat(scan): canonical /api/scan/regional/config endpoint`** — `/api/scan-ru/config` kept as a thin alias through one release for back-compat. The new path matches the source-naming convention (`?source=regional`).

### 🛠️ HH_USER_AGENT removed from UI

- **`feat!(config): drop HH_USER_AGENT field from /#/config + KNOWN_KEYS`** — power users can still set `HH_USER_AGENT` directly in `career-ops/.env` (the server reads via `process.env.HH_USER_AGENT` in `server/lib/sources/hh.mjs` with the bundled UA as fallback). The UI no longer exposes it because the default works for most users and seeing an inscrutable User-Agent field in the App Settings page was a recurring source of confusion.
- README mentions across 8 locales + help bundle mentions across 8 locales replaced with "run via a Russian IP / VPN" advice. The `scan.hhWarning` i18n key was rephrased to drop the env-var setup detail.
- `KEY_GROUPS` collapsed: no more `regional` classification (it only had HH_USER_AGENT). Tests updated; `regionalActive` payload field preserved for SPA back-compat.

### 🧪 Tests

- `tests/env-config.test.mjs` — `KNOWN_KEYS` assertion now excludes HH_USER_AGENT; new assertion that the key is intentionally absent.
- `tests/config-endpoint.test.mjs` — POST-write multi-key test uses `GEMINI_MODEL` as the second known key instead of HH_USER_AGENT.
- `tests/config-groups.test.mjs` — `groups.HH_USER_AGENT` is now expected `undefined`.
- Total: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + 32/32 Playwright. Same counts as v1.18.0 because every adjusted test was already counted.

### Verification

```bash
npm test                              # 427 / 427

# Contrast (Chrome DevTools or axe) on light + dark:
#   .badge-ok / .badge-warn / .badge-bad / .badge-info → AA pass (4.5:1+)
#   .score-high / .score-mid / .score-low → AA pass

# HH_USER_AGENT no longer in /api/config:
curl -s http://127.0.0.1:4317/api/config | jq '.values | keys'
# → ["ANTHROPIC_API_KEY","ANTHROPIC_MODEL","GEMINI_API_KEY","GEMINI_MODEL","HOST","PORT"]
# (no HH_USER_AGENT)

# Canonical regional config endpoint:
curl -s http://127.0.0.1:4317/api/scan/regional/config | jq '.'
# Legacy alias still alive through v1.20:
curl -s http://127.0.0.1:4317/api/scan-ru/config | jq '.'
```

### Out of scope (v1.20+)

| Item | Notes |
|---|---|
| Per-component touch-target audit (filter chips, sortable headers, sidebar nav) | v1.18 set the global floor (`.btn` 44 px, `.btn-sm` 32 px); per-component verification across the SPA remains. |
| `aria-describedby` on inline form hints (`#/config`, `#/pipeline`, `#/evaluate`, `#/batch`) | v1.17 covered `aria-label` on global search + modal close. Per-input hint association is the next polish layer. |
| Full non-EN README parity (585 lines like EN) | v1.18 brought non-EN to ~307 (53 % of EN). Marketing-heavy "Quick start" + "🌍 Getting Started" walkthroughs remain EN-only. |
| Remove `/api/scan-ru/config` legacy alias | Sunset planned for v1.20. The canonical `/api/scan/regional/config` is the migration target. |

---

## [1.18.0] — 2026-05-13

**Consolidação do endpoint scan + passe WCAG 2.2 AA + finalização i18n long-tail.** Aposenta os aliases legacy `/api/stream/scan-{en,ru}` (janela Sunset 2026-10-01 adiantada para v1.18 por direção do user). Leva os READMEs non-EN a ~307 linhas e traduz as entradas CHANGELOG v1.16.0 + v1.17.0 RU-bodied restantes em 6 locales.

### 🚪 Breaking

- **`feat!(scan): retire legacy /api/stream/scan-{en,ru} aliases`** — os endpoints SSE split EN/RU depreciados se foram. Todo consumidor passa pelo endpoint consolidado `/api/stream/scan?source=ats|regional|both` (vivo desde v1.12.0). Os paths legacy tinham headers Deprecation + Sunset (RFC 8594) desde v1.15.0; a janela de migração está fechada. Integrações externas nos paths antigos recebem um **404** limpo em vez de serem roteadas silenciosamente ao catch-all do SPA.

### ♿ Acessibilidade (passe WCAG 2.2 AA)

- **WCAG 2.4.1 Bypass Blocks** — novo link **Skip to main content** como primeiro focusable em cada página.
- **WCAG 2.4.7 Focus Visible** — estilo global `*:focus-visible`. Modal close (×) recebe um focus ring de maior contraste.
- **WCAG 2.5.5 Target Size** — mínimo 44×44 px touch target em `.skip-link`. `.btn-sm` mantém 32 px min-height.
- **WCAG 3.1.1 Language of Page** — `<html lang="en">` corrigido de `lang="ru"`.
- **WCAG 1.3.1 Info & Relationships** — `#content` recebe `tabindex="-1"` para que o target do skip-link receba focus limpamente.

### 📚 i18n long-tail

- **`docs(i18n): CHANGELOG v1.16.0 + v1.17.0 traduzidos em 6 locales`** — RU-char count por locale caiu 79 → 42 → 23.
- **`docs(readme): expandir READMEs non-EN com Why / Requirements / Features / Configuration / Contributing`** — cada README non-EN cresceu de 240 → ~307 linhas.

### 🧪 Testes

- Total: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + 32/32 Playwright.

---

## [1.17.0] — 2026-05-13

**Polish + a11y + fix de CI.** Fecha 9 follow-ups do REVIEW da v1.16.0: verificação smoke em browser, badge truth nos READMEs, refresh de coverage, chip 🔒 `lastWorkdayFallback` no SPA, re-baseline E2E completo após mudança UX da v1.16, scenarios Playwright para auto-pipeline, passe a11y ARIA + focus trap, condensação do CHANGELOG histórico em 6 locales, expansão de READMEs non-EN com seções de referência.

### 🐛 Fixes

- **`fix(e2e): smoke + comprehensive re-alinhados com UX da v1.16`** — a mudança da v1.16 Cmd+K Enter → modal AutoPipeline fez `search.press('Enter')` em e2e tests abrir um modal que interceptava clicks subsequentes. Tests usam agora `Shift+Enter` para o path legacy quick-add. **Esse foi o falha de CI no push v1.16.0** — Playwright e2e timeout 30s em clicks interceptados pelo backdrop.
- **`fix(mode-page): /#/batch-prompt → modes/batch.md via serverSlug`** — v1.15 renomeou o legacy mode slug para `batch-prompt`, mas o server `POST /api/mode/:slug` procurava `modes/batch-prompt.md` que não existe. Novo campo `serverSlug` desacopla o hash de rota do filename do mode do pai.
- **`chore: bump de mensagens de deprecação de v1.16.0 → v1.17.0`** — o copy de deprecação de scan-en/scan-ru e o banner de batch-prompt referenciavam a versão passada.

### ✨ Features

- **`feat(scan): chip 🔒 Workday CAPTCHA no card Active Companies`** — o export server-side `lastWorkdayFallback` da v1.16 PR-7 é agora consumido pelo SPA. `/api/scan-results` retorna o snapshot; `#/scan` renderiza um card warn-tinted sobre Active Companies quando um tenant Workday caiu no fallback ("🔒 Workday tenant blocked — fallback: use /career-ops scan (Playwright)"). Novo `getLastWorkdayFallback()` evita ambiguidade de live-binding ESM. 2 novas keys i18n × 8 locales.

### ♿ Acessibilidade

- **`a11y: passe de ARIA roles + focus management`** —
  - `index.html`: atributos `role` em `<aside>` (navigation), `<header>` (banner), `<section id="content">` (main), `<div id="modal">` (dialog com aria-modal/aria-labelledby), `<div id="toast">` + `#conn-banner` (status com aria-live), `<div class="searchbar">` (search).
  - `#sidebar-toggle` obtém `aria-controls="sidebar"` + `aria-expanded` sincronizado por JS em open/close.
  - `#global-search` obtém um `<label>` visually-hidden mais um `aria-label` explícito que surface o hint do shortcut Cmd+K.
  - O close do modal (×) obtém `aria-label="Close dialog"`.
  - Backdrops decorativos obtêm `aria-hidden="true"`.
  - **Focus trap no modal** — `UI.modal()` lembra o click owner, focusa o primeiro focusable non-close no open, e cicla Tab/Shift+Tab dentro do modal. `UI.closeModal()` restaura focus ao owner anterior.
  - Nova utility class `.visually-hidden` em `public/css/app.css` (padrão WAI-ARIA AP).

### 📚 Documentação

- **`docs(readme): badge truth através de 8 READMEs`** — badge de tests `284 / 379 / 360` → **427**; badge release `v1.9.1 / v1.13.0` → **v1.16.0** depois → v1.17.0 via o bump da v1.17.
- **`docs(readme): expandir 7 READMEs non-EN com seções de referência`** — cada um cresceu 170 → ~240 linhas com novas seções Architecture / API reference / Security notes / Tests / A11y / Limitations / License no idioma nativo.
- **`docs(changelog): condensar entradas pre-v1.12 em 6 locales`** — as entradas longas RU-bodied v1.11.x + v1.10.x são agora substituídas por um resumo executivo "Earlier releases" compacto no idioma nativo. História detalhada fica em `CHANGELOG.md` (EN).

### 🛠️ Tooling

- **`coverage: refresh de números`** — último publicado foi 95.46 % linha / 84.06 % branch (REVIEW v1.13.0). Baseline v1.17: **94.14 % linha / 82.98 % branch / 93.20 % função**. Queda leve por novos error paths; ainda muito acima do piso 80 % em CLAUDE.md.

### 🧪 Testes

- Total: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + **32 / 32** Playwright (era 28; +4 novos scenarios auto-pipeline).
- Suite E2E re-alinhada com UX da v1.16.0 (Shift+Enter quick-add, /#/batch-prompt para mode legacy).

### Out of scope (v1.18+)

| Item | Notas |
|---|---|
| Traduzir entrada v1.16.0 nos CHANGELOGs non-EN | Atualmente RU-bodied. |
| Paridade completa de README non-EN (585 linhas como EN) | v1.17 trouxe non-EN para ~240 linhas. |
| Audit completo WCAG 2.2 AA | v1.17 cobriu ARIA estrutural + focus trap; audit per-component pendente. |

---

## [1.16.0] — 2026-05-13

**Finalização do auto-pipeline + polish dos adapters + i18n long-tail.** Fecha os 11 follow-ups do REVIEW da v1.15.0: SSE auto-pipeline server-side, primitiva `POST /api/reports`, shortcut Cmd+K, paginação SmartRecruiters, Workday CAPTCHA-fallback, gate CI de drift de screenshots, UX do filtro de source no scan, tradução do CHANGELOG histórico (v1.13.0/v1.12.0 × 6 locales), expansão de READMEs non-EN, importer paste-ready de empresas trending.

### ✨ Features

- **`feat(auto-pipeline): orchestrator SSE server-side`** (#1, #2, #3, #8) — o orchestrator client-side chained-fetch da v1.15 foi removido. `POST /api/auto-pipeline` é agora um endpoint SSE curl-able que executa validate → fetch JD → evaluate → save report → tracker no servidor com eventos step em tempo real. A chamada lenta para Anthropic (30–90 s) emite agora eventos `running` em vez de spinner genérico. Falhas emitem `error` com `step` + `message`. O orchestrator também persiste o markdown do report no pai `reports/<slug>.md` (era perdido na v1.15).
- **`feat(reports): primitiva POST /api/reports`** — novo writer em `server/lib/routes/reports.mjs`. Saneamento de slug com guard de path-traversal. Cap de 1 MB (413). 409 em file existente sem `overwrite:true`. Atomic write através de `stripDangerousMarkdown`. Logs activity.reports.save. Testes: 9 casos.
- **`feat(app): Cmd+K paste URL → auto-pipeline`** — colar URL no global search + Enter abre o modal AutoPipeline com `autoStart=true`. Shift+Enter preserva o caminho legacy "add to pipeline only".
- **`feat(portals): paginação SmartRecruiters`** (#4) — `server/lib/sources/smartrecruiters.mjs` percorre páginas via `?limit=100&offset=N` até alcançar `totalFound` OU página vazia OU safety cap de 30 páginas / 3000 jobs. Boards grandes não perdem mais o resto de seus postings. Testes: 6 casos.
- **`feat(portals): Workday CAPTCHA-fallback graceful`** (#7) — `server/lib/sources/workday.mjs` não lança mais em 4xx / non-JSON / network errors. Retorna `[]` e anota o novo export `lastWorkdayFallback`. A timeline do scanner continua com o próximo tenant. Opt-in ao throw da v1.14 via `strict:true`. Testes: 7 casos.

### 🛠️ Tooling + CI

- **`ci(workflows): drift gate de dashboard-screenshots`** (#5) — novo `.github/workflows/dashboard-screenshots.yml`. Em PRs que tocam `public/css/app.css`, `public/js/views/dashboard.js`, `public/js/lib/i18n.js` ou `public/index.html`, o workflow boota o server contra um /tmp scaffold, regenera os 8 hero PNGs via Playwright + chromium, e falha o build se o resultado drift do que está commitado.
- **`feat(scripts): import-trending-companies.mjs`** (#11) — verifica as 13 empresas trending em `docs/portals-examples.md` via sua boards-API real e emite YAML colável para o `portals.yml::tracked_companies` do pai. `enabled: false` é estampado em candidatos cujo slug 404'eia. Execute via `npm run import:trending`.
- **`feat(scripts): npm run capture:dashboards`** — expõe `scripts/capture-dashboard-screenshots.mjs` como top-level script.

### 🎨 UX

- **`fix(scan): dropdown de filtro source consolidado`** (#6) — o dropdown de source de `#/scan` reconstruído a partir do adapter registry da v1.14: 6 ATSes + hh.ru + Habr Career, alfabético, sem prefixos geo. `runEnScan`/`runRuScan` apontam agora ao endpoint consolidado `/api/stream/scan?source={ats,regional}`.

### 📚 i18n long-tail

- **`docs(i18n): traduzir CHANGELOG v1.13.0 + v1.12.0 em 6 locales`** (#9) — entradas antes RU-bodied em `CHANGELOG.{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md` estão agora em seu locale real. Cada CHANGELOG non-EN/non-RU também recebe uma nota i18n explicando que entradas pre-v1.12 permanecem em RU por convenção do projeto.
- **`docs: expandir READMEs non-EN com seção de highlights v1.16.0`** (#10) — 7 READMEs non-EN recebem uma nova seção de ~35 linhas cobrindo: fluxo one-click auto-pipeline + exemplo curl, paginação SmartRecruiters, Workday fallback, UX do filtro source no scan, script importer, e workflow CI de screenshots.

### 🧪 Testes

- Novo `tests/reports-write.test.mjs` (9 casos) — happy path, slug sanitization (incl. path-traversal guard), conflito 409, flag overwrite, strip XSS, 400 em campos faltantes, 413 em >1 MB, round-trip GET/POST.
- Novo `tests/auto-pipeline.test.mjs` (5 casos) — framing SSE, gate URL inválida, gate SSRF/loopback, rota error sem LLM key, header Content-Type `text/event-stream`.
- Novo `tests/smartrecruiters-pagination.test.mjs` (6 casos).
- Novo `tests/workday-fallback.test.mjs` (7 casos).
- Total: **427 / 427** unit (era 400; +27 líquidos). 0 falhas.

### Out of scope (v1.17+)

| Item | Notas |
|---|---|
| Traduzir entradas pre-v1.12 do CHANGELOG (v1.11.x, v1.10.x) | Convenção preservada: RU-bodied. Backport é ~1800 linhas de tradução; diferido. |
| Paridade completa de README non-EN (585 linhas como EN) | v1.16 adicionou ~35 linhas por locale; mirror completo é um passo de tradução separado. |
| Surface de `lastWorkdayFallback` no card SPA Active Companies | Server export cabeado; consumo UI é v1.17. |
| Bulk add per-company de `tracked_companies` para as 9 trending verificadas | O script `import:trending` faz 1-comando + 1-paste. |

### Verification

```
npm test                              # 427 / 427

curl -N -X POST http://127.0.0.1:4317/api/auto-pipeline \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://job-boards.greenhouse.io/anthropic/jobs/4567"}'
```

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
