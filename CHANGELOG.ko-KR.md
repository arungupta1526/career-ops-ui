# 변경 로그

**career-ops-ui** 의 모든 주요 변경 사항. 형식은 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), 버전은 [SemVer](https://semver.org/) 를 따릅니다.

번역: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

> **i18n 노트** — v1.12.0 이후 항목은 각 언어로 현지화됩니다. 이전 항목(v1.11.x, v1.10.x)은 프로젝트 관례에 따라 러시아어로 유지됩니다; 정규 영어 본문은 [CHANGELOG.md](CHANGELOG.md)에 있습니다.

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

v1.13.0 registry 위에 3개의 신규 ATS 어댑터, 지원 ATS 수가 3 → 6으로 확장 (Greenhouse / Ashby / Lever **+ Workable / SmartRecruiters / Workday-beta**). 사용자 대상 문서 17개 파일에서 "3 ATSes"를 "6 ATSes"로 한 번의 패스로 업데이트(42 문구): README × 8 로케일, help bundle × 8 로케일, PROJECT.md. 부모 `portals.yml`을 위한 13개 trending 회사의 paste-ready YAML 블록을 `docs/portals-examples.md`에 추가.

### ✨ 기능

- **`feat(portals): 3개의 신규 ATS — Workable, SmartRecruiters, Workday-beta`** — registry가 이제 6 ATSes 해결(이전 3). 신규 파일: `server/lib/portals/adapters/{workable,smartrecruiters,workday}.mjs` (uniform contract 얇은 래퍼) + `server/lib/sources/{workable,smartrecruiters,workday}.mjs` (raw HTTP + 정규화).
  - **Workable**: `apply.workable.com/<slug>` 및 legacy `<subdomain>.workable.com` 감지. Endpoint: `https://apply.workable.com/api/v3/accounts/<slug>/jobs?details=true`.
  - **SmartRecruiters**: `jobs.smartrecruiters.com/<slug>` 및 `careers.smartrecruiters.com/<slug>` 감지. Endpoint: `https://api.smartrecruiters.com/v1/companies/<slug>/postings`.
  - **Workday (beta)**: `<tenant>.wd<N>.myworkdayjobs.com/<lang>/<site>` 감지. Endpoint: `/wday/cxs/<tenant>/<site>/jobs`로 POST. URL에 site가 없으면 `site=External` 기본. 일부 tenant가 CXS 피드를 CAPTCHA로 차단하기 때문에 beta — 부모의 `/career-ops scan`로 fallback (Playwright).

### 📚 문서

- **`docs(portals-examples): trending boards block`** — `docs/portals-examples.md`에 v1.14.0 섹션 추가, `tracked_companies`용 paste-ready YAML로 13개 trending 회사 나열: Greenhouse-hosted (Stripe, GitLab, HashiCorp, Cloudflare, Datadog, Hugging Face) + Ashby-hosted (Notion, Linear, PostHog, Replicate, Modal Labs, Fly.io, Render). 모두 `enabled: false` — 사용자가 활성화 전 slug 검증. 더하여 Workable / SmartRecruiters / Workday 예시 블록.
- **`docs(framing): 17개 user-facing 파일에서 42개 ATS 문구 업데이트`** — 사용자 문서의 모든 "Greenhouse / Ashby / Lever"가 이제 "Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday"로 표시. 영향: README × 8 로케일, help bundle × 8 로케일, PROJECT.md. 과거 CHANGELOG 항목과 bug-fix 처방 문서(`qa/fixes/F-014`, `qa/FIX-PROMPT`)는 의도적으로 건드리지 않음 — 과거 상태이거나 이미 올바름.
- **`docs(qa): browser test scenario 19`** — `qa/claude-cowork-browser-test-prompt.md`에 Scenario 19 추가: `ALL_ADAPTERS.length === 6` 불변, 6개 모두에 대한 `resolveAdapter()` URL 감지 sweep, `#/scan`의 Active Companies 카드 soft-check, `docs/portals-examples.md` 구조 검사.

### 🧪 테스트

- `tests/adapter-registry.test.mjs`에 3개 신규 어댑터에 대한 7개 신규 케이스 추가 (Workable apply-URL, Workable legacy subdomain, SmartRecruiters jobs.* + careers.*, 명시적 site가 있는 Workday tenant.wd5.*, Workday default-site fallback, `ALL_ADAPTERS.length === 6` 불변, `detectApi()` legacy-shape 호환성).
- 총: **386 / 386** unit 테스트(이전 379; +7 순증). 0 실패.

### Out of scope

| 항목 | 비고 |
|---|---|
| 13개 trending Greenhouse/Ashby 회사에 대한 per-company 항목 | `docs/portals-examples.md` v1.14.0 블록이 paste 가능한 YAML로 나열; 부모 `portals.yml`으로 bulk-add는 별도 단계. |
| Workday CAPTCHA-fallback 자동화 | Workday adapter는 CXS 피드가 차단되면 throw; 계획된 fallback은 부모 `/career-ops scan` (Playwright)에 위임. SPA scan UX 배선은 v1.15+. |

---

## [1.13.0] — 2026-05-13

큰 릴리스. 4개의 지연된 아이템을 하나의 커밋으로 종료: PR-4 (완전한 multer 파이프라인), Adapter registry (F-018 아키텍처 후속), Batch evaluate SPA 페이지, locale-aware mode-template scaffolding. 추가로 mid-session 다크 테마 테이블 수정.

### ✨ 기능

- **`feat(cv): multer multipart upload (PR-4 완전)`** — `/api/cv/import`가 이제 octet-stream(원래 계약)과 `multipart/form-data`(multer 경유) 모두 수용합니다. v1.10.2의 415-reject는 임시방편이었습니다; v1.13.0은 진짜 수정. curl `-F`, Postman 기본, 모든 HTTP 클라이언트가 매끄럽게 동작. 새 종속성: `multer ^2.1.1`.
- **`feat(portals): adapter registry`** — Greenhouse / Ashby / Lever fetcher를 `server/lib/portals/adapters/*.mjs`에 균일한 계약으로 추출. `server/lib/portals/registry.mjs::resolveAdapter()`가 단일 디스패치 지점. 새 ATS 추가 = `adapters/`의 파일 하나 + `ALL_ADAPTERS`의 한 줄.
- **`feat(batch): #/batch evaluate page`** — 새 SPA 뷰 + 4개 엔드포인트(`GET /api/batch`, `PUT /api/batch`, `GET /api/stream/batch`, `POST /api/batch/merge`). `batch/batch-input.tsv`용 TSV 편집기, parallel/min-score/dry-run/retry 컨트롤, `bash batch/batch-runner.sh` 라이브 SSE 로그, `Merge to tracker` 버튼(`node merge-tracker.mjs` 실행). Sidebar 링크. 21개 새 i18n 키 × 8 로케일.
- **`feat(prompts): locale-aware mode scaffolding`** — `buildModePrompt` + `buildEvaluationPrompt`가 이제 parent의 mode-template 영어 본문을 로케일화된 scaffolding 텍스트(role-line, "Read these files first", "User-supplied context")로 8 로케일에서 감쌉니다.

### 🎨 UX 수정

- **`fix(theme): 다크 모드 테이블 + tab-btn`** — 하드코딩된 `#fafafa` / `#fff` / `#f7f7f7`를 토큰으로 교체. 다크에서 hover가 이제 가독성 있음. `.row-boosted` accent strip 추가.

### 🧪 테스트

- 새로운 `tests/adapter-registry.test.mjs` (7), `tests/batch-endpoints.test.mjs` (5), `tests/locale-scaffold.test.mjs` (6).
- `tests/cv-upload-multipart-reject.test.mjs`가 v1.13.0 계약(multipart parsed properly)에 맞게 재작성됨.
- 총 **379 / 379** 유닛 (이전 360; +19). 0 실패. 커버리지 **95.46 % 라인 / 84.06 % 브랜치**.
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright.

### 범위 외

- **14개의 새 포털 어댑터** — registry 준비됨; 추가 = 각각 한 파일; portal-by-portal 리서치는 남아 있음.
- **Parent `modes/<slug>.md` 본문 번역** — `santifer/career-ops`에 upstream PR 필요 (CLAUDE.md hard rule #1).

### 문서

- `docs/reviews/REVIEW-2026-05-13-v1.13.0.md`.
- 전체 텍스트: [CHANGELOG.md](CHANGELOG.md#1130--2026-05-13).

---

## [1.12.0] — 2026-05-13

버그 수정 + UX + 브랜드 패스. v1.11.1 이후 8개 백로그 항목 종료(테스트 갭 #9–12, console error #8, portals-dead drift #4, seniority_boost surface #6, F-018 엔드포인트 통합). 테마 day/night 토글 추가, 모든 문서/패키지 메타데이터/GitHub 저장소 설명에서 "Airbnb-styled" 언급 제거.

### ✨ 기능

- **`feat(theme): day/night 토글`** — top-bar에 새 테마 버튼. light ↔ dark 순환, `localStorage`에 저장, 첫 페인트 전 복원(`public/js/lib/theme-bootstrap.js`). 첫 로드에서 `prefers-color-scheme` 존중. `public/css/app.css`의 `[data-theme="dark"]` 아래 완전한 다크 팔레트.
- **`feat(scan): /api/stream/scan?source=ats|regional|both` (F-018 LITE)`** — 단일 통합 SSE 엔드포인트. SPA가 단 하나의 event-stream을 열어 두 단계(ATS, 그다음 regional)를 순차적으로 실행. 레거시 `/api/stream/scan-en` + `/api/stream/scan-ru`는 deprecated alias로 유지.
- **`feat(scan): seniority_boost surface`** — 두 스캐너 모두 `portals.yml::title_filter.seniority_boost`를 읽고 일치하는 job에 `_boosted: true`를 표시. SPA는 boosted 행을 위로 정렬하고 `⬆ boosted` badge를 렌더링.

### 🐛 수정

- **`fix(ui): 4곳에서 .message null-safe (#8)`** — `app.js`, `views/tracker.js`, `views/apply.js`, `views/evaluate.js`. 이전에는 Error payload 없는 Promise rejection이 e2e teardown에서 "Cannot read properties of undefined" 던졌습니다.
- **`fix(test): portals-dead drift를 failure 대신 warning으로 (#4)`** — assertion이 stderr warning으로 변환. CI는 parent drift에서 녹색; release 결정은 수동입니다.

### 📝 Brand / docs

- **`docs(brand): 모든 doc + package + GitHub 저장소 설명에서 'Airbnb' 참조 제거`** — 8 README, CLAUDE.md, FRONTEND.md, package.json과 저장소 설명을 "Airbnb-styled"에서 "Clean, docs-style"로 마이그레이션.

### 🧪 테스트

- 새로운 `tests/canonical-docs-coverage.test.mjs` (5 케이스) test gap #9–12 닫음.
- 새로운 `tests/scan-consolidated.test.mjs` (6 케이스) F-018 LITE 커버.
- 총 **360 / 360** 유닛(이전 349; +11 신규). 0 실패. 커버리지: **95.62 % 라인 / 84.37 % 브랜치**.
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright.

### 문서

- `docs/reviews/REVIEW-2026-05-13-v1.12.0.md`.
- 전체 텍스트: [CHANGELOG.md](CHANGELOG.md#1120--2026-05-13).

### 범위 외 (v1.11.1 이후 변경 없음)

Batch evaluate SPA 페이지; 완전한 adapter registry(F-018 아키텍처 리팩터); 완전한 multer 파이프라인(PR-4); mode template 번역.

---

## 이전 릴리스 (v1.11.x 및 v1.10.x)

v1.11.0 / v1.11.1 / v1.10.0–v1.10.3 상세 항목은 [영어 CHANGELOG](CHANGELOG.md)에 있습니다. 요약:

- **v1.11.1 — 2026-05-13** · 폴리시: `#/apply`의 Playwright 힌트, 통일된 태그라인, 대시보드 score-thresholds 카드. 349/349 테스트.
- **v1.11.0 — 2026-05-13** · 8 help 번들 및 8 README에 career-ops.org/docs 통합. 새 `docs/career-ops-canonical.md`. Mode/Archetype/Pipeline/Tracker/Report/Scan history 개념 문서화. 348/349 테스트.
- **v1.10.3 — 2026-05-12** · 버그 수정 슬라이스: v1.10.2 회귀 실행의 11개 QA 결과 중 7개 종료.
- **v1.10.2 — 2026-05-12** · CV multipart 415-거부 (v1.13.0 multer까지의 임시 패치); PDF 생성 수정.
- **v1.10.1 — 2026-05-09** · v1.10.0 릴리스 QA 회귀 실행의 중요 패치.
- **v1.10.0 — 2026-05-08** · `#/profile` 에디터 + CV 업로드 UX (pandoc/pdftotext/passthrough), 8 locale × 16 H2 help 패리티, locale switcher.
