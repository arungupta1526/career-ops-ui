# 변경 로그

**career-ops-ui** 의 모든 주요 변경 사항. 형식은 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), 버전은 [SemVer](https://semver.org/) 를 따릅니다.

번역: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

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
