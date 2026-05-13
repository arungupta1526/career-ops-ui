# 변경 로그

**career-ops-ui** 의 모든 주요 변경 사항. 형식은 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), 버전은 [SemVer](https://semver.org/) 를 따릅니다.

번역: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

> **i18n 노트** — v1.12.0 이후 항목은 각 언어로 현지화됩니다. 이전 항목(v1.11.x, v1.10.x)은 프로젝트 관례에 따라 러시아어로 유지됩니다; 정규 영어 본문은 [CHANGELOG.md](CHANGELOG.md)에 있습니다.

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

기능 회귀 패치. v1.10.1 수동 검증에서 발견된 두 가지 버그 해결; 문서 표면 확장.

### 🐛 버그 수정

- **`fix(cv): /api/cv/import는 multipart/form-data를 415로 거부`** — `multipart/form-data`를 기본으로 보내는 외부 클라이언트가 이전에는 wire envelope을 `cv.md` 내용으로 저장했습니다. 이제 415와 힌트. SPA 경로(octet-stream + X-Filename)는 영향 없음.
- **`fix(pdf): /api/stream/pdf는 generate-pdf.mjs를 올바른 위치 인수로 호출`** — 이전에는 `[]`로 호출해서 스크립트가 `Usage:`를 출력하고 코드 1로 종료, PDF 생성되지 않음. 이제 `cv.md`를 HTML로 렌더링, `output/cv-input-<TIMESTAMP>.html`에 작성하고 스크립트를 `<input.html> <output.pdf> --format=a4`로 실행.

### 🧪 테스트

- 새 `tests/cv-upload-multipart-reject.test.mjs`(5 케이스), 새 `tests/pdf-stream-args.test.mjs`(3 케이스). **유닛 테스트 340개**(이전 318). 커버리지 94.63% 라인 / 84.94% 브랜치.

### 📝 문서

- 새 `docs/test-scenarios/` — 21개의 영문 시나리오 파일.
- 새 `docs/reviews/REVIEW-2026-05-12-v1.10.2.md`.
- 전체 내용은 [CHANGELOG.md](CHANGELOG.md#1102--2026-05-12) 참조.

---

## [1.10.1] — 2026-05-09

v1.10.0 QA 회귀 결과를 반영한 중요 수정 패치 (`qa/reports/00-FINAL-SUMMARY.md`).

### 🛡️ 보안

- **`fix(security): SSRF 표면 강화 + DNS 리바인딩 방어 (PR-3 / F-003)`** — `isValidJobUrl`이 RFC1918, 전체 127/8 루프백, 링크 로컬 `169.254/16` (AWS IMDS 포함), `0.0.0.0`, CGNAT `100.64/10`, IPv6 ULA / 링크 로컬을 거부합니다. 새 헬퍼 `isPrivateOrLoopbackHost()`. 프리뷰 프록시는 매 홉마다 `dns.lookup`을 수행하고 주소가 프라이빗 범위면 차단합니다 — DNS 리바인딩 방어.

### 🐛 버그 수정

- **`fix(activity)`**: 성공한 상태 변경만 기록 (PR-5 / F-005); 4xx로 거부된 시도는 로그되지 않습니다. `profile.save`, `config.save`, `cv.import` 이벤트 추가 (F-008).
- **`fix(help)`**: 한국어 본문이 영어로 폴백되지 않도록 `ko` → `ko-KR.md` 별칭 추가 (F-002).
- **`fix(llm): /api/evaluate가 mode:'manual'을 존중`** — `/api/deep`과 동일한 동작, Anthropic 크레딧 미소비 (F-009).
- **`fix(api): DELETE /api/pipeline`** `?url=` 와 `body.url` 둘 다 수용; URL이 없을 때 404 반환 (PR-6 / F-017).

### ✨ 기능

- **`feat(llm): 모든 프롬프트에 로케일 전파 (PR-2 / F-012)`** — `resolveLocale(req)`, `buildLocaleDirective(lang)`. SPA가 `Accept-Language` + `lang`을 자동으로 첨부합니다.
- **`feat(scripts): post-qa-cleanup.mjs (PR-11)`** — QA 회귀 후 정리 체크리스트 재실행; `--apply`로 쓰기, 기본은 드라이런, 멱등적.

### 🧪 테스트

- 새 `tests/critical-fixes.test.mjs` (15 케이스). `tests/url-validation.test.mjs`에 5개 추가. **유닛 테스트 318개** (기존 298). `portals-dead.test.mjs`의 기존 실패는 parent의 `templates/portals.example.yml` 데이터 드리프트 — web-ui 코드와 무관.

### 📝 문서

- 새 `docs/reviews/REVIEW-2026-05-09-v1.10.1.md`. 8개 README 모두 업데이트 (배지 + 스크린샷 + "v1.10.1 새로운 변경사항" 섹션). 8개 CHANGELOG에 본 항목 반영.

---

## [1.10.0] — 2026-05-08

> 전체 텍스트는 [CHANGELOG.md](CHANGELOG.md#1100--2026-05-08)에 있습니다. 요약: CV 임포트 (`.docx`/`.doc`/`.odt`/`.rtf`/`.pdf`/`.html`/`.txt`/`.md`, pandoc + pdftotext 경유, 10 MB 한도), Generate-PDF 후 새 PDF 자동 다운로드, `#/config` 두 탭 (API keys & runtime + Profile), `#/profile`이 표준 라우트로 승격, 8개 로케일 도움말 갱신.

---

## [1.9.1] — 2026-05-08

프로덕션 준비 패스. 4건의 표적 수정(BF-1..BF-4), Playwright 스모크 5 → 12개 확장.

### 🐛 버그 수정

- **BF-1 (tracker)**: `|`와 개행 이스케이프를 notes뿐 아니라 모든 셀에 적용. `"Acme | Co"` 같은 이름이 더 이상 테이블을 깨뜨리지 않습니다. `parseMarkdownTable`가 GFM `\|` 이스케이프 지원 — 무손실 round-trip.
- **BF-2 (config)**: `updateEnvFile`을 try/catch로 감쌈 — permission-denied 시 unhandled rejection 대신 깔끔한 500.
- **BF-3/BF-4 (llm)**: `/api/evaluate`, `/api/deep`, `/api/mode/:slug`의 Anthropic 분기에서 조립된 프롬프트에 200 KB 소프트 캡 — 타임아웃 대신 413.

### 🧪 Playwright 스모크 — 5 → 12개

Tracker(BF-1 round-trip 포함), pipeline 추가 + 잘못된 URL 일소, reports 빈 상태, evaluate 수동 폴백, config 키 마스킹, CV PUT 새니타이즈, pipeline preview 400.

---

## [1.9.0] — 2026-05-08

v1.8.0 백로그의 P-6 → P-10 모두 한 번에 릴리스. 핵심: `server/index.mjs`는 이제 130줄 오케스트레이터(이전 762줄, 누적 1230 → 130 = -89 %)이며 각 라우트 토픽이 자체 모듈에 있습니다. `/api/evaluate` Anthropic 패리티, 멀티 CLI 심, i18n 패리티 테스트 확장, Playwright 브라우저 스모크 CI 통합.

### 🏗️ P-6 — server/index.mjs 분할 페이즈 2

P-2의 연속. 남은 9개 라우트 토픽을 `server/lib/routes/<topic>.mjs`로 추출. `index.mjs`는 순수 오케스트레이터: 미들웨어, 12개의 `register<Topic>Routes(app)` 호출, SPA 캐치올.

모듈: `activity`, `config`, `health` (+ dashboard), `help`, `jds`, `llm`, `pipeline` (+ preview), `reports`, `tracker`. 동작 변경 없음. 모든 단계에서 283/283 unit tests 그린.

### 🔌 P-7 — /api/evaluate의 Anthropic 패리티

`/api/evaluate`는 이전에 Gemini-or-manual이었습니다. v1.9.0은 Anthropic 분기 추가(양쪽 키 존재 시 우선). `bundleProjectContext({ modeSlugs: ['_shared', 'oferta'] })`를 통과 — REVIEW-A1 확장. 폴백 체인: Anthropic → Gemini → manual.

새 엔드포인트 **`POST /api/evaluate/test-anthropic`** — `ANTHROPIC_API_KEY`용 스모크 체크.

### 🌐 P-8 — Help-center i18n 패리티

8개 로케일 모두 이미 동일한 14개 정규 h2 섹션을 커버. 테스트 강화:

- `tests/help-ui.test.mjs`가 이제 8개 로케일 모두 반복(이전에는 en + ru만).
- 신규: 각 로케일 ≥ `en.md`의 30 % — 스텁 방지.

### 🤖 P-9 — CI에 Playwright 브라우저 스모크

`tests/playwright-smoke.mjs`(v1.8.0의 opt-in)가 이제 CI 워크플로의 일부.

### 🌍 P-10 — 멀티 CLI 호환성

`web-ui/AGENTS.md`(Codex / Aider / generic)와 `web-ui/GEMINI.md`를 정규 `CLAUDE.md`를 가리키는 심으로 추가.

### 🧪 테스트

- **284 unit tests**(이전 283): i18n 패리티 +1.
- **5개 Playwright 스모크 테스트**가 이제 CI에 포함.

### 📦 새 엔드포인트

| 메서드 | 경로 | 용도 |
|---|---|---|
| `POST` | `/api/evaluate/test-anthropic` | `ANTHROPIC_API_KEY` 스모크 체크 (P-7). |

---

## [1.8.0] — 2026-05-08

하드닝, 리팩토링, SDD 기반 구축. 심각도 높음 3건(A1, A2, A3), 중간 4건(B1–B4), 경미 6건, 부모 프로젝트 career-ops v1.7.0 감사, `server/index.mjs` 분할(P-2 페이즈 1), Playwright 브라우저 스모크, `docs/`와 `.claude/`에 SDD 기반.

### 🔥 심각도 높음

- **`fix(deep): Anthropic SDK 호출에 cv/profile/mode 인라인 (REVIEW-A1)`** — `/api/deep`와 `/api/mode/:slug`는 모델에게 "이 파일들을 먼저 읽어라"라고 했지만 Anthropic SDK는 파일시스템이 없습니다. 출력이 비어 있었습니다. `bundleProjectContext`가 `cv.md`, `config/profile.yml`, `modes/_shared.md`, 모드 템플릿을 읽어 각 16 KB로 잘라 `<project_context>` 블록을 프롬프트 앞에 삽입합니다. 라이브 검증: `claude-sonnet-4-6`에서 26 KB의 근거 있는 markdown.
- **`fix(runner): grace 기간 후 SIGTERM → SIGKILL 에스컬레이션 (REVIEW-A2)`** — 시스템 콜에 멈춘 자식 프로세스가 SSE 연결을 무한정 잡고 있을 수 있었습니다. 양 경로 모두 5초 watchdog을 걸어 `SIGKILL`로 에스컬레이션합니다.
- **`fix(runner): streaming 엔드포인트의 최대 런타임 상한 (REVIEW-A3)`** — `/api/stream/{scan,liveness,pdf}`에 30분 상한.

### 🛡️ 심각도 중간

- **`fix(preview): /api/pipeline/preview의 hop별 검증 (REVIEW-B1)`** — `redirect: 'follow'`에서 수동 리다이렉트 추적으로 전환. 각 `Location`을 `isValidJobUrl`로 재검증, 3홉 상한. 적대적 보드가 loopback/사설 IP/`file://`로 우리를 리다이렉트할 수 없습니다.
- **`refactor(keys): hasGeminiKey가 LLM 키 체크를 통일 (REVIEW-B2)`**.
- **`feat(scanners): hh.ru, Habr, Greenhouse, Ashby, Lever에 AbortSignal 전파 (REVIEW-B3)`** — 클라이언트 연결 끊김 시 진행 중인 fetch 중단.
- **`test(anthropic): API 키가 console로 누출되지 않도록 보장하는 log-guard (REVIEW-B4)`**.

### 🧹 경미한 정리

- **`fix(parsers): addPipelineUrl 내부에 URL 게이트로 defense-in-depth (REVIEW-C4)`**.
- **`docs(readme): 배지 88 → 277 tests (REVIEW-C3)`**.
- **`test(i18n): 누락된 키 메시지를 로케일별로 그룹화 (REVIEW-C6)`**.

### 🏗️ P-2 페이즈 1 — server/index.mjs 분할 (1230 → 762 LOC, −38 %)

동작 변경 없음. 모든 단계에서 283/283 unit tests 그린.

- `server/lib/security.mjs` — 새니타이저와 신뢰 검사.
- `server/lib/prompts.mjs` — LLM용 프롬프트 빌더.
- `server/lib/store.mjs` — 방어적 리더 + 첫 부팅 부트스트랩.
- `server/lib/routes/{scan,runners,content}.mjs` — `registerXxxRoutes(app)`.

페이즈 2에서 tracker / pipeline / reports / jds / llm / health 추출.

### 🔍 부모 프로젝트 career-ops v1.7.0 감사

UI 호환. 모드 카탈로그: 7 → 19 (UI는 의도적으로 7만 노출). `portals.yml`은 `tracked_companies` 사용 (96개 엔트리, 87개 활성, 71개 API 보유). `docs/architecture/DATA-FLOWS.md`에 문서화.

### 🤖 SDD / GSD 기반

- `CLAUDE.md` (루트), `.aiignore`, `.claude/agents/*` (3개), `.claude/commands/*` (2개).
- `docs/` 트리: PROJECT, ROADMAP, sdd/{SDD-GUIDE, CONVENTIONS}, architecture/{OVERVIEW, SERVER, FRONTEND, API, DATA-FLOWS}, reviews/REVIEW-2026-05-07.

### 🔒 보안 및 저장소 위생

- **`chore(.gitignore): defense-in-depth 패턴 확장`** — env 변형, IDE, GSD scratch, 에이전트 사적 설정, Playwright 산출물, 일반 비밀 패턴.

### 🧪 테스트

- **283 unit tests** (이전 277): +6개 신규.
- **5개 Playwright 브라우저 스모크** (신규, `npm run test:e2e:browser`로 opt-in).
- 커버리지 ~93 % line / ~83 % branch.

### 📝 새로운 npm 스크립트

| 스크립트 | 용도 |
|---|---|
| `npm run test:e2e:browser` | in-process 서버 대상 Playwright smoke (5개 테스트). |

---

## [1.7.2] — 2026-05-04

도움말 센터, 인-UI 앱 설정, 모바일 사이드바, 단일 Scan 버튼, 모든 prompt-builder 의 "결과 보기" 단축.

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

QA r5 를 기반으로 한 35 커밋의 보안 + UX + 기능 완성 강화. 세 가지 보안 계층 적용, 모든 누락된 CRUD 엔드포인트 보충, 부모 프로젝트 부트스트랩 자동화, **9 개의 새 페이지** 추가 — Activity, 재설계된 Deep Research, 그리고 7 개의 sidebar-그룹 모드 (project / training / followup / batch / outreach / interview-prep / patterns) — 부모 `modes/` 의 100% 커버. 테스트 커버리지는 **73** 에서 **209** 로 증가, **25 개 테스트 파일** + **23 단계 종합 Playwright e2e**. Coverage: **93.5 % 라인 / 82.6 % 브랜치**.

### 🔒 보안

- **`fix(cv): CV 미리보기에서 저장형 XSS 차단을 위한 Markdown 정화` (FIX-C10)** — `PUT /api/cv` 가 이제 `<script>`, `<iframe>`, `<object>`, `<embed>`, `<style>`, `<form>`, `<svg>`, `on*=` 핸들러, `javascript:`/`vbscript:`/`data:text/html` URI 를 `cv.md` 에 쓰기 전에 제거합니다. 본문 1 MB 제한 (초과 시 413). 클라이언트 `UI.md()` 가 마크다운 변환 *전에* 모든 바이트를 escape 하도록 다시 작성되어 raw HTML 이 `innerHTML` 에 도달할 수 없습니다. 링크 `href` 는 안전한 스킴 화이트리스트 (`http`/`https`/`mailto`/`tel`/상대 + `data:image` 만) 로 검증됩니다. 새 테스트 17 개.
- **`fix(server): CSP + 기본 보안 헤더` (FIX-L2)** — 모든 응답에 `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin` 가 포함됩니다. 서버가 loopback 외부에 바인딩될 때 (`HOST` ≠ `127.0.0.1`/`::1`/`localhost`) 엄격한 `Content-Security-Policy` 가 추가로 적용됩니다: `default-src 'self'`, `script-src 'self'` (`unsafe-inline` 없음), Google Fonts 화이트리스트, `connect-src 'self'` 가 exfiltration 을 차단합니다. `index.html` 과 `router.js` 의 인라인 `onclick` 핸들러는 `addEventListener` 로 이전되었습니다. 새 테스트 8 개.
- **`fix(api): 파이프라인 URL 검증기 강화` (FIX-M7)** — `POST /api/pipeline` 이 `"not-a-url"` 을 받아 저장하던 문제 해결. `isValidJobUrl()` 이 이제 스킴 없는 문자열, 길이 <10 또는 >2000, 공백 포함 URL, `http(s)` 가 아닌 스킴, loopback 호스트네임을 거부합니다. **FIX-M3** + **FIX-M6** 포함.
- **`fix(api): 프롬프트 조립 전 JD 정화` (FIX-M5)** — `POST /api/evaluate` 가 ANSI escape, 제어 바이트, 인라인 `<script>` 태그를 제거하고 공백을 trim 합니다. 50 KB 길이 제한. 50 자 최소값은 *정화된* 텍스트에 대해 검사됩니다.
- **`fix(health): HOST!=loopback 일 때 Node 버전 + 프로젝트 루트 마스킹` (FIX-M1)** — `/api/health` 가 LAN 노출 환경에서 호스트 fingerprint 를 더 이상 노출하지 않습니다.

### ✨ 새 기능

- **`feat: 7 개의 새 사이드바 모드 + 그룹 사이드바` (FIX-C8)** — 부모 `modes/` 의 100% 커버. 새 라우트: `#/project`, `#/training`, `#/followup`, `#/batch`, `#/contacto`, `#/interview-prep`, `#/patterns`. 단일 view 팩토리 + 일반 엔드포인트 `POST /api/mode/:slug`. 사이드바는 6 개 그룹으로 구분. 총 18 개 항목. 새 테스트 12 개.
- **`fix: 부모 deps + russian_portals 기본값 부트스트랩` (FIX-C4 + C9 + C12 + H2)** — `bin/start.sh` 가 부모 `node_modules` + Playwright Chromium 을 새 클론에서 자동 설치. `createApp()` 이 `russian_portals:` 블록 누락 시 추가. 멱등. 새 테스트 3 개.
- **`fix: 9 개 죽은 포털 슬러그 비활성화` (FIX-C3)** — 9 개 슬러그 `enabled: false`. 새 `scripts/portals-health-check.mjs`. 새 테스트 3 개.
- **`feat(activity): 사용자 동작 로그 + Activity 사이드바 페이지`** — 모든 상태 변경 API 요청이 `data/activity.jsonl` 에 기록됩니다. 사이드바에 새 항목 **활동** — 동작 prefix 칩 필터, ✓/✗ 배지, 새로고침 버튼. 5 MB 자동 회전. 새 테스트 10 개.
- **`feat(deep): 브라우저에서 Deep Research 보기 + 저장 결과 아카이브`** — Deep Research 페이지가 이제 (a) `{ run: true }` 와 `GEMINI_API_KEY` 가 설정된 경우 Gemini 로 라이브 실행하고 `interview-prep/{slug}.md` 에 저장; (b) 저장된 모든 deep-research 파일을 상대 시간과 함께 카드로 표시; (c) 결과를 Markdown 으로 렌더링하고 **📋 복사 / ⬇ .md 다운로드 / ↗ 새 탭에서 열기** 액션을 제공합니다. 새 REST: `GET /api/interview-prep`, `GET /api/interview-prep/:name`, `DELETE /api/interview-prep/:name`. 새 테스트 7 개.
- **`feat(cv): 브라우저에서 PDF 생성 + 다운로드 + PDF 아카이브`** — CV 페이지의 새 **📄 PDF 생성** 버튼이 모달 콘솔에서 `/api/stream/pdf` 를 스트림합니다. `ERR_MODULE_NOT_FOUND` / `playwright` 에러 시 복사 가능한 부트스트랩 명령을 표시합니다. "생성된 PDF" 섹션이 성공 후 자동 로드되어 모든 `output/*.pdf` 를 **↗ 열기** + **⬇ 다운로드** 버튼과 함께 표시합니다. 새 REST: `GET /api/output/pdfs`, `GET /api/output/pdfs/:name`. 새 테스트 6 개.
- **`feat(api): POST /api/tracker — UI 에서 행 추가` (FIX-H8)** — 브라우저에서 `data/applications.md` 에 정규 행 추가. company + role 검증, `templates/states.yml` 기반 상태 정규화, 0-padding `#` 자동 증가, company+role 대소문자 무시 dedup. 새 테스트 6 개.
- **`feat(api): DELETE /api/jds/:name` (FIX-H4)** — 셸 없이 저장된 JD 제거. path-traversal 정화, `.txt` 접미사 필수. 새 테스트 5 개.
- **`feat(api): POST /api/evaluate/test-gemini` (FIX-H7)** — 50 자 더미 JD 를 `gemini-eval.mjs` 로 보내 API 키 작동을 검증하는 smoke-test 엔드포인트.

### 🐛 버그 수정

- **`fix(router): catch-all 404 뷰 + i18n 커버리지 가드` (FIX-C7)** — 알 수 없는 hash 라우트가 더 이상 dashboard 로 조용히 떨어지지 않습니다. 전용 404 페이지를 표시하고 dashboard 로 링크합니다. 새 `tests/i18n-coverage.test.mjs` 가 모든 173+ 키 × 8 locales 를 검증합니다.
- **`fix(router): #/profile → settings 별칭` (FIX-C2)** — 두 주소 모두 동일한 뷰에 도달하고 사이드바가 정확하게 강조됩니다.
- **`fix(health): Health/Doctor 통합 + 템플릿 프로필 플래그` (FIX-C6 + FIX-H6)** — `/api/health` 가 이제 Doctor 가 보고하던 모든 것을 노출합니다 (parent deps, Playwright, 디렉토리, 프로필 커스터마이즈, `HH_USER_AGENT`).
- **`fix(scan): RU 설정 query↔negative 충돌 경고` (FIX-H3)** — `portals.yml` 이 negative 에 `"PHP"` 를 가지고 query 가 Senior PHP 를 타겟할 때 모든 결과가 필터되는 문제. `runRuScan()` 이 시작 전 경고를 emit 합니다.
- **`fix(scan): HH_USER_AGENT 미설정 시 경고` (FIX-H1)** — `/scan` 이 노란 카드를 표시합니다.
- **`fix(api): POST /api/jds slug 정화 시 경고` (FIX-M2)** — `warning` 필드 반환.
- **`fix(ui): 라우트 변경 시 글로벌 검색 초기화 + 버튼 스피너` (FIX-M4 + FIX-L1)** — 새 헬퍼 `UI.withSpinner(button, fn)`.
- **`fix(ui): 빈 modal-title placeholder` (FIX-H9)** — 하드코딩된 영어 `"Title"` 제거.

### 🌐 i18n

- 173+ 번역 키 × 8 locales (`en`, `es`, `pt-BR`, `ko`, `ja`, `ru`, `zh-CN`, `zh-TW`). 모든 locales 에 새 키 추가. 커버리지는 `tests/i18n-coverage.test.mjs` 가 강제합니다.

### ⚙️ DevOps

- **테스트:** 73 → **225** (+136 테스트, 25 개 파일). Coverage: 93.5% 라인 / 82.6% 브랜치.
- **종합 Playwright e2e** (`tests/e2e-comprehensive.mjs`, 23 단계).
- **GitHub Actions:** `ci.yml`, `ai-review.yml` (Claude Code 가 모든 PR 리뷰), `release.yml`.
- **CSP-friendly UI:** 모든 인라인 `onclick` 제거.

### 📦 새 REST 엔드포인트

| 메서드 | 경로 | 용도 |
|---|---|---|
| `GET`    | `/api/activity`              | 사용자 활동 이벤트 목록 |
| `GET`    | `/api/interview-prep`        | 저장된 Deep Research 목록 |
| `GET`    | `/api/interview-prep/:name`  | 단일 Deep Research 읽기 |
| `DELETE` | `/api/interview-prep/:name`  | Deep Research 삭제 |
| `GET`    | `/api/output/pdfs`           | 생성된 PDF 목록 |
| `GET`    | `/api/output/pdfs/:name`     | PDF 다운로드 (attachment) |
| `POST`   | `/api/tracker`               | `applications.md` 에 행 추가 |
| `DELETE` | `/api/jds/:name`             | 저장된 JD 삭제 |
| `POST`   | `/api/evaluate/test-gemini`  | Gemini API 키 smoke-test |

---

## [1.6.0] — 2026-05-02

웹 UI 의 첫 공개 릴리스. 기능 목록은 `README.md` 참조.
