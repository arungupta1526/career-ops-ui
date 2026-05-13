# career-ops-ui

> [career-ops](https://github.com/santifer/career-ops) AI 구직 파이프라인을 위한 깔끔한 docs-style 웹 인터페이스.
> Claude Code, 터미널, 마크다운 파일 사이를 오가는 대신 — 단일 브라우저 탭에서 모든 채용 공고를 검색, 평가, 심층 조사, 지원, 추적할 수 있습니다.

[English](README.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | **한국어** | [日本語](README.ja.md) | [Русский](README.ru.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

[![tests](https://img.shields.io/badge/tests-427%20passed-brightgreen)](#tests)
[![playwright](https://img.shields.io/badge/playwright-28%20e2e-brightgreen)](#tests)
[![node](https://img.shields.io/badge/node-%E2%89%A518-blue)](#requirements)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![release](https://img.shields.io/badge/release-v1.19.0-blue)](https://github.com/Fighter90/career-ops-ui/releases/tag/v1.19.0)

![career-ops-ui — 커맨드 센터](./images/dashboard-en.png)

## career-ops 소개

[career-ops](https://career-ops.org)는 모든 AI 코딩 CLI(Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot CLI) 내부에서 슬래시 명령으로 실행되는 오픈소스 구직 시스템입니다. 모델 무관(model-agnostic). 6차원 0.0–5.0 루브릭으로 각 채용 공고를 CV와 매칭하여 평가하고, 맞춤형 PDF 이력서를 생성하며, 모든 지원을 로컬에서 추적합니다 — 클라우드 계정 없음, 텔레메트리 없음, 자동 제출 없음.

**이 저장소(career-ops-ui)**는 그 위에 얹은 다듬어진 웹 인터페이스입니다. CLI는 form-fill(Playwright MCP 경유)과 슬래시 명령 모드를 계속 담당하며, SPA는 동일한 `cv.md` / `data/applications.md` / `reports/` 파일 위에 CRM 스타일의 브라우저 표면을 제공합니다. 두 도구는 같은 데이터를 공유합니다.

**Score 별 액션 임계값** ([career-ops.org/docs](https://career-ops.org/docs) 출처):

| Score | 다음 단계 |
|---|---|
| **≥ 4.5** | `/career-ops apply` — 높은 적합도, 즉시 지원 |
| **4.0 – 4.4** | 지원하거나 `/career-ops contacto`로 warm intro |
| **3.5 – 3.9** | `/career-ops deep` — 먼저 리서치 |
| **< 3.5** | 특별한 이유가 없는 한 건너뜀 |

**캐노니컬 가이드** ([career-ops.org/docs](https://career-ops.org/docs)):

- [What is career-ops](https://career-ops.org/docs/introduction/what-is-career-ops)
- [Scan job portals](https://career-ops.org/docs/introduction/guides/scan-job-portals)
- [Apply for a job](https://career-ops.org/docs/introduction/guides/apply-for-a-job)
- [Batch-evaluate offers](https://career-ops.org/docs/introduction/guides/batch-evaluate-offers)
- [Set up Playwright](https://career-ops.org/docs/introduction/guides/set-up-playwright)

## 한 줄 설치

```bash
curl -fsSL https://raw.githubusercontent.com/Fighter90/career-ops-ui/main/bin/setup.sh | bash
```

이 명령은 두 저장소(career-ops + career-ops-ui)를 클론하고, 의존성을 설치하고, http://127.0.0.1:4317 에서 서버를 시작합니다.

---

## 왜?

[career-ops](https://github.com/santifer/career-ops)는 강력한 Claude Code 기반 구직 시스템입니다: JD를 붙여넣으면 → 0-5 적합도 점수, ATS 최적화 PDF, 트래커 항목을 얻습니다. Claude Code 내부에서는 훌륭하게 작동하지만, 데이터가 `cv.md`, `data/applications.md`, `reports/*.md`, `data/pipeline.md`, `portals.yml`, `config/profile.yml` 사이에 흩어져 있어 — 잃어버리기 쉽고 훑어보기 어렵습니다.

`career-ops-ui`는 그 위에 다듬어진 UI를 얹습니다:

- **탐색** — 트래커, 보고서, 파이프라인을 CRM처럼 살펴봅니다.
- **트리거** — 스캔(Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday **및** hh.ru / Habr Career)을 실행하고 실시간 SSE 로그를 확인합니다.
- **평가** — Anthropic(우선) 또는 Gemini로 JD를 라이브 평가하거나, API 키가 없으면 Claude Code용 복붙 프롬프트를 받습니다.
- **딥 리서치** — Anthropic SDK 경유 라이브 회사 리서치, cv / profile / mode 파일을 자동 인라인 처리합니다.
- **편집** — `cv.md`를 사이드-바이-사이드 마크다운 미리보기와 서버 사이드 XSS 새니타이즈로 편집합니다.
- **유지보수** — doctor, verify, normalize, dedup, merge — 각각 원클릭.
- **멀티 CLI** — Claude Code, Codex, Cursor, Aider, Gemini CLI 모두에서 동일하게 작동 — `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` 심(shim)이 단일 소스 오브 트루스를 가리킵니다.

순수 추가물입니다: `career-ops/` 내부는 아무것도 변경되지 않습니다. 모든 커스터마이징은 그대로 유지됩니다.

---

## 빠른 시작

### 1. 먼저 career-ops 설치

```bash
git clone https://github.com/santifer/career-ops.git
cd career-ops
```

[career-ops 온보딩](https://github.com/santifer/career-ops#first-run--onboarding)에 따라 `cv.md`, `config/profile.yml`, `portals.yml`이 존재하도록 만듭니다.

### 2. 그 안에 career-ops-ui 배치

```bash
git clone https://github.com/Fighter90/career-ops-ui.git web-ui
```

이제 트리는 다음과 같습니다:

```
career-ops/
├─ cv.md
├─ portals.yml
├─ config/
├─ data/
├─ modes/
├─ reports/
├─ scan.mjs … doctor.mjs … (등)
└─ web-ui/                 ← 이 저장소
   ├─ bin/start.sh
   ├─ package.json
   ├─ server/
   ├─ public/
   └─ tests/
```

### 3. 실행

```bash
bash web-ui/bin/start.sh
```

스크립트는 다음을 수행합니다:

1. Node ≥ 18 확인.
2. `npm install` (첫 실행 시에만, deps 2개 — Express + js-yaml).
3. `127.0.0.1:4317`에서 Express 서버 시작.
4. 기본 브라우저에서 http://127.0.0.1:4317/ 열기.

커스텀 port / host:

```bash
PORT=8080 bash web-ui/bin/start.sh
HOST=0.0.0.0 PORT=4317 bash web-ui/bin/start.sh   # LAN에 노출
```

저장소를 `career-ops/web-ui` 외 다른 위치에 클론했다면 env로 career-ops를 가리키게 합니다:

```bash
CAREER_OPS_ROOT=/path/to/career-ops bash bin/start.sh
```

---

## 요구사항

| | |
| --- | --- |
| **Node.js** | ≥ 18 (네이티브 `fetch`, `node:test` 사용) |
| **career-ops** | 클론 + 온보딩됨 — 위 참조 |
| **선택사항** | 원클릭 JD 평가를 위해 부모 프로젝트의 `.env`에 `GEMINI_API_KEY` (무료 티어 모델 `gemini-2.0-flash`). 없으면 UI는 Claude용 복붙 프롬프트를 반환합니다. |
| **선택사항** | hh.ru가 403을 반환하면 러시아 IP / VPN에서 실행. Habr Career는 IP 관계없이 작동합니다. |
| **선택사항** | e2e 테스트 스위트용 Playwright (이미 career-ops의 transitive dep). |

---

## 페이지별 기능

| 페이지            | 기능                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Dashboard**    | 집계된 카운트(apps / pipeline / reports), 평균 점수, 상태 분류, 최근 5개 apps + 최신 보고서.                                  |
| **Scan**         | **🌐 단일 Scan 버튼** — 활성화된 모든 소스를 한 번에 실행(EN은 Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday, RU는 hh.ru + Habr Career). 실시간 SSE 로그 스트리밍 + 클릭 가능한 결과 테이블, location / Remote-Hybrid 배지 / relocation 플래그 / 급여 / source 필터와 동적 stack / level / keyword chip. Active-Companies 카드는 추적되는 모든 board와 API health를 나열. |
| **Pipeline**     | `data/pipeline.md`에 대한 CRUD. 서버 사이드 미리보기 프록시(SSRF-safe, per-hop redirect 검증, 8 KB body cap). URL에서 바로 평가로 점프. |
| **Evaluate**     | JD 붙여넣기 → **Anthropic 우선**(두 키 모두 있을 때 선호), 그다음 Gemini, 그다음 수동 프롬프트 폴백. Anthropic 경로는 cv / profile / `_shared.md` / `oferta.md`를 자동 인라인(REVIEW-A1). JD를 `jds/`에 저장 선택. |
| **Deep research**| Evaluate와 동일한 폴백 체인. 라이브 Anthropic은 ~10-30 KB의 grounded markdown을 `interview-prep/<company>-<role>.md`에 저장. |
| **Modes**        | 7개의 generic mode 페이지(`/#/project`, `/#/training`, `/#/followup`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns`)가 동일한 Anthropic / Gemini / manual 폴백을 사용. |
| **Apply helper** | 제출 체크리스트 생성; 실제 Playwright 폼 채우기는 Claude Code의 `/career-ops apply`에 그대로 유지. |
| **Tracker**      | `data/applications.md`에 대한 필터 가능 테이블(status, score, free-text). 원클릭 `normalize-statuses.mjs` / `dedup-tracker.mjs` / `merge-tracker.mjs`. Pipe + newline 이스케이프가 GFM 준수 — `"Acme \| Co"` 같은 이름도 무손실 라운드트립. |
| **Reports**      | `reports/`의 모든 보고서를 파싱된 헤더(Score / Legitimacy / URL)와 함께 탐색 및 읽기.                       |
| **CV**           | `cv.md` 라이브 마크다운 에디터 + 사이드-바이-사이드 미리보기 + 원클릭 `cv-sync-check.mjs` + 📁 Upload CV. 저장 시 서버 사이드 XSS 스트립(`<script>`, `javascript:`, `on*=` 핸들러). |
| **Profile**      | `config/profile.yml` + archetypes의 read-only 뷰 — UI 친화적 요약.                                         |
| **App settings** | 부모 `.env` 키의 인-UI 에디터: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, model overrides, port / host. 시크릿은 읽을 때 마스킹. |
| **Health**       | 모든 setup 체크를 OK / OPTIONAL / FAIL 배지로 + `doctor.mjs`와 `verify-pipeline.mjs` 실행 버튼.           |
| **Help**         | 인앱 마크다운 사용자 가이드(`/#/help`), 지원되는 8개 언어 모두로 현지화(en / es / pt-BR / ko-KR / ja / ru / zh-CN / zh-TW). |
| **Activity log** | 상태 변경 요청(writes, runs, scans)의 모든 감사 추적. 시크릿 redact. |

전역 키보드 단축키:

- `Ctrl+K` / `Cmd+K` — 전역 검색에 포커스.
- 전역 검색에 URL 붙여넣으면 자동으로 파이프라인에 추가.
- `Esc` — 열린 모달 닫기.

---

## Scan

실제로 채용 공고를 반환하는 제로 토큰 포털 스캔. UI의 **🌐 Scan 버튼 하나**가 설정된 모든 소스를 단일 스윕으로 실행합니다:

- **Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday** — `portals.yml::tracked_companies`의 모든 회사에 대해 인식 가능한 ATS 패턴이 있는 공개 boards-api. 번들 목록은 Stripe, GitLab, Vercel, Cloudflare, Datadog, Discord, Elastic, Grafana Labs, CockroachDB, Fastly, Twilio, Coinbase, Reddit, Robinhood, Affirm, Lyft, Linear, Supabase, PostHog, Ramp, Modal Labs, Railway, Browserbase, JetBrains를 포함 — 자유롭게 확장/축소.
- **hh.ru** — 공개 API (RU 외 IP에서는 403; 러시아 IP / VPN에서 실행하거나 건너뜀 — 한 소스에서 반복되는 403은 합쳐지고 해당 소스는 실행 중에 비활성화됨). 서버는 합리적인 기본 User-Agent를 제공; 파워 유저는 여전히 러시아 IP / VPN으로 override 가능.
- **Habr Career** — `career.habr.com/vacancies`의 HTML 스크레이프. 모든 IP에서 작동, 인증 없음.

모든 소스는 동일한 파이프라인을 통과합니다: 정규화 → 필터(`title_filter.positive` / `title_filter.negative`) → `data/scan-history.tsv` + `data/pipeline.md` + `data/applications.md`에 대한 dedup → `data/pipeline.md`에 append → 전체 결과셋을 UI 필터 가능 테이블용 `data/last-scan.json`에 저장.

`portals.yml`을 통해 설정:

```yaml
title_filter:
  positive: [backend, engineer, senior, tech lead, golang, php]
  negative: [junior, intern, frontend, ios, android]
tracked_companies:
  - { name: Stripe, enabled: true, careers_url: https://job-boards.greenhouse.io/stripe }
  - { name: Linear, enabled: true, careers_url: https://jobs.ashbyhq.com/linear }
  # ...
russian_portals:
  sources: ["hh", "habr"]   # 하나 또는 둘 다
  area: 113                  # 1=Moscow, 2=SPb, 113=Russia, 1001=remote
  per_page: 50
  only_remote: false
  queries: ["Senior PHP", "Senior Go", "Tech Lead"]
```

모든 소스는 단일 SSE 엔드포인트를 통해 흐릅니다: `/api/stream/scan?source=ats|regional|both`. **🌐 Scan** UI 버튼은 `source=both`를 호출하여 모든 어댑터(Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday + hh.ru + Habr Career)가 한 연결로 실행됩니다. 클라이언트 연결 해제 시 `AbortSignal`을 honor — orphan fetch 없음.

---

## 아키텍처

```
career-ops-ui/
├─ CLAUDE.md                 # 프로젝트 레벨 에이전트 지침 (캐노니컬)
├─ AGENTS.md                 # Codex / Aider / 범용 CLI 심 → CLAUDE.md
├─ GEMINI.md                 # Gemini CLI 심 → CLAUDE.md
├─ .aiignore                 # AI 도구용 제외 목록
├─ .claude/                  # Claude Code 에이전트 설정
│  ├─ agents/                # 3개의 프로젝트별 서브에이전트 (route, view, test isolation)
│  └─ commands/               # 슬래시 명령 stub
├─ bin/start.sh              # 원샷 런처 (Node 체크 → npm install → 서버 → 브라우저 열기)
├─ package.json              # 2개의 런타임 deps: express, js-yaml
├─ server/
│  ├─ index.mjs              # ~130 LOC 오케스트레이터: 미들웨어 + 12개 register<Topic>Routes(app) 호출 + SPA catch-all
│  └─ lib/
│     ├─ paths.mjs           # career-ops 파일의 절대 경로 (CAREER_OPS_ROOT 인식)
│     ├─ parsers.mjs         # markdown / pipeline / report 파서 (GFM 호환 파이프 이스케이프)
│     ├─ runner.mjs          # runNodeScript() + streamNodeScript()와 SIGTERM→SIGKILL 에스컬레이션 + 30분 캡
│     ├─ security.mjs        # isValidJobUrl, stripDangerousMarkdown, sanitizeJobDescription, isPubliclyExposed
│     ├─ prompts.mjs         # bundleProjectContext, buildEvaluationPrompt, buildDeepPrompt, buildModePrompt
│     ├─ store.mjs           # safeReadApps/Pipeline/Reports, checkProfileCustomized, ensureRussianPortalsDefaults
│     ├─ anthropic.mjs       # 최소 Anthropic SDK 어댑터 (runAnthropic, hasAnthropicKey, hasGeminiKey)
│     ├─ env-config.mjs      # 시크릿 마스킹 + 검증과 함께 .env 라운드트립
│     ├─ activity-log.mjs    # JSONL 감사 추적 미들웨어 (시크릿 redact)
│     ├─ dotenv.mjs          # 작은 dotenv 로더
│     ├─ en-scanner.mjs      # 인프로세스 Greenhouse/Ashby/Lever 오케스트레이터 (AbortSignal 인식)
│     ├─ ru-scanner.mjs      # 인프로세스 hh.ru + Habr 오케스트레이터 (AbortSignal 인식)
│     ├─ sources/
│     │  ├─ greenhouse.mjs   # boards-api.greenhouse.io 클라이언트
│     │  ├─ ashby.mjs        # api.ashbyhq.com 클라이언트
│     │  ├─ lever.mjs        # api.lever.co 클라이언트
│     │  ├─ hh.mjs           # api.hh.ru 클라이언트 (UA 인식)
│     │  └─ habr.mjs         # career.habr.com HTML 파서 (cheerio 없음, 정규식만)
│     └─ routes/             # 12개 라우트 모듈 — 토픽당 하나 (P-2)
│        ├─ activity.mjs     # /api/activity
│        ├─ config.mjs       # /api/config (부모 .env 라운드트립)
│        ├─ content.mjs      # /api/cv, /api/profile, /api/portals, /api/modes
│        ├─ health.mjs       # /api/health, /api/dashboard
│        ├─ help.mjs         # /api/help/:lang
│        ├─ jds.mjs          # /api/jds CRUD
│        ├─ llm.mjs          # /api/evaluate, /api/deep, /api/mode/:slug, /api/apply-helper, /api/interview-prep*
│        ├─ pipeline.mjs     # /api/pipeline + SSRF-safe 미리보기 프록시
│        ├─ reports.mjs      # /api/reports
│        ├─ runners.mjs      # /api/run/* + /api/stream/{scan,liveness,pdf} + /api/output/pdfs
│        ├─ scan.mjs         # /api/stream/scan-{ru,en} + /api/scan-results
│        └─ tracker.mjs      # /api/tracker
├─ public/                   # 정적 SPA — 빌드 스텝 없음
│  ├─ index.html
│  ├─ css/app.css            # 디자인 토큰 (docs-style 팔레트)
│  └─ js/
│     ├─ api.js              # fetch 래퍼 + connection-banner 상태 + UI 헬퍼 + 안전한 markdown 렌더러
│     ├─ router.js           # 404 fallback + alias 지원이 있는 hash 기반 라우터
│     ├─ app.js              # 부트 + 전역 키보드 핸들러 + 모바일 사이드바 drawer
│     ├─ lib/{i18n,skills}.js
│     └─ views/              # 페이지당 하나의 파일 (dashboard, scan, pipeline, evaluate, deep, apply, tracker, reports, cv, settings, health, config, help, activity, mode-page)
├─ docs/                     # 공개 레퍼런스: 아키텍처, API, 데이터 플로우, SDD, 컨벤션, 리뷰
│  ├─ PROJECT.md             # 무엇 / 왜 / 누구를 위해
│  ├─ ROADMAP.md             # 현재 milestone + 완료된 이력
│  ├─ PRODUCTION-READINESS.md # 정직한 배포 게이트 평가
│  ├─ sdd/{SDD-GUIDE,CONVENTIONS}.md
│  ├─ architecture/{OVERVIEW,SERVER,FRONTEND,API,DATA-FLOWS}.md
│  └─ reviews/REVIEW-*.md
└─ tests/                    # 284 unit + 12 Playwright + 23 e2e:full + 20 e2e:smoke
   ├─ parsers.test.mjs       # markdown / pipeline / report 파서 (순수 함수)
   ├─ api.test.mjs           # 모든 엔드포인트, 임시 서버, 네트워크 없음
   ├─ {ru,en}-scanner.test.mjs   # mocked fetch
   ├─ pipeline-preview.test.mjs   # per-hop redirect 검증 (REVIEW-B1)
   ├─ anthropic.test.mjs     # SDK 어댑터 + log-guard 테스트 (REVIEW-B4)
   ├─ url-validation.test.mjs    # SSRF 거부 스윕 (FIX-M3 + M6 + M7)
   ├─ cv-xss.test.mjs        # stripDangerousMarkdown 라운드트립
   ├─ jd-sanitize.test.mjs   # sanitizeJobDescription
   ├─ help.test.mjs / help-ui.test.mjs    # 모든 8개 로케일에서 i18n 패리티
   ├─ playwright-smoke.mjs   # 12 브라우저 플로우 (CV save, tracker, pipeline, evaluate, config 등)
   └─ e2e{,-comprehensive}.mjs   # 전체 Playwright 워크스루
```

### 빌드 스텝이 없는 이유?

Vanilla HTML/CSS/JS는 표면적을 작게 유지합니다: 두 deps의 `npm install` 한 번이면 실행됩니다. Webpack 없음, Vite 없음, doom의 `node_modules` 없음. 전체 UI는 minified 30 KB 미만입니다. 개발 중 hot-reload를 원하면 `npm run dev`가 Node의 내장 `--watch`를 사용합니다.

### 스펙 주도 개발 (Spec-Driven Development)

Non-trivial한 변경은 GSD 파이프라인(`superpowers@claude-plugins-official`의 `gsd-*` 스킬)을 거칩니다:

```
discuss → spec → plan → execute → verify → review
```

공개 레퍼런스: [`docs/sdd/SDD-GUIDE.md`](docs/sdd/SDD-GUIDE.md). 모든 계획 산출물은 `.planning/` 아래(gitignored)에 있습니다. `docs/` 트리는 장기 공개 계약입니다.

---

## API 레퍼런스

모든 엔드포인트는 `/api/*` 아래. 명시되지 않은 한 JSON in / JSON out.

### Health & dashboard

| Method | Path                     | 응답                                                                    |
| ------ | ------------------------ | --------------------------------------------------------------------------- |
| GET    | `/api/health`            | `{ ok, warnings, version, parentVersion, checks: [{name, ok, required, value?}] }` |
| GET    | `/api/dashboard`         | `{ counts, avgScore, byStatus, recent, pipeline, lastReport }`              |
| GET    | `/api/activity?limit&type` | `data/activity.jsonl` 감사 추적의 tail                                 |
| GET    | `/api/help/:lang`        | 현지화된 인앱 사용자 가이드 (fallback: `en.md`)                             |

### App settings (부모 .env 라운드트립)

| Method | Path             | 목적                                                                |
| ------ | ---------------- | ---------------------------------------------------------------------- |
| GET    | `/api/config`    | 시크릿이 마스킹된 알려진 env 키                                     |
| POST   | `/api/config`    | 검증 + 부모 `.env` 쓰기; `process.env`에 즉시 적용      |

### 데이터 파일

| Method | Path                                | 목적                                                                |
| ------ | ----------------------------------- | ---------------------------------------------------------------------- |
| GET    | `/api/tracker`                      | `{ rows: [parsed applications.md] }`                                   |
| POST   | `/api/tracker`                      | body `{ company, role, score?, status?, url?, notes?, date? }` — dedup 인식 (company + role 대소문자 무관) |
| GET    | `/api/pipeline`                     | `{ urls: [...] }`                                                      |
| POST   | `/api/pipeline`                     | body `{ url }` → dedup + `isValidJobUrl`로 `data/pipeline.md`에 추가 |
| GET    | `/api/pipeline/preview?url=…`       | 서버 사이드 fetch 프록시 (per-hop SSRF 체크, ≤3 redirect, 8 KB 캡) |
| DELETE | `/api/pipeline?url=…`               | URL 제거                                                          |
| GET    | `/api/reports`                      | `reports/*.md`의 파싱된 목록                                          |
| GET    | `/api/reports/:slug`                | 전체 markdown + 파싱된 헤더                                          |
| GET    | `/api/jds`                          | 저장된 JD 파일 목록                                                 |
| GET    | `/api/jds/:name`                    | text/plain — raw JD                                                    |
| POST   | `/api/jds`                          | body `{ text, slug? }` → `jds/`에 저장                               |
| DELETE | `/api/jds/:name`                    | unlink (`.txt` suffix 필수)                                        |
| GET    | `/api/cv`                           | `{ markdown }`                                                         |
| PUT    | `/api/cv`                           | body `{ markdown }` → `cv.md` 쓰기 (XSS 스트립, ≤1 MB)             |
| GET    | `/api/profile`                      | `{ profile: yaml-parsed, raw: text }`                                  |
| GET    | `/api/portals`                      | `{ portals: yaml-parsed, raw: text }`                                  |
| GET    | `/api/modes`                        | mode 파일 목록                                                     |
| GET    | `/api/modes/:name`                  | text/plain — raw mode 프롬프트                                           |
| GET    | `/api/output/pdfs`                  | 생성된 PDF 목록                                                 |
| GET    | `/api/output/pdfs/:name`            | 다운로드 (`Content-Disposition: attachment`)                          |
| GET    | `/api/interview-prep`               | 저장된 deep-research 파일 목록                                      |
| GET    | `/api/interview-prep/:name`         | `{ name, markdown }`                                                   |
| DELETE | `/api/interview-prep/:name`         | unlink (`.md` suffix 필수)                                         |

### 스크립트 러너 (버퍼, 원샷)

| Method | Path                    | 래핑하는 명령                       |
| ------ | ----------------------- | --------------------------- |
| POST   | `/api/run/doctor`       | `node doctor.mjs`           |
| POST   | `/api/run/verify`       | `node verify-pipeline.mjs`  |
| POST   | `/api/run/normalize`    | `node normalize-statuses.mjs` |
| POST   | `/api/run/dedup`        | `node dedup-tracker.mjs`    |
| POST   | `/api/run/merge`        | `node merge-tracker.mjs`    |
| POST   | `/api/run/sync-check`   | `node cv-sync-check.mjs`    |

모든 버퍼 실행은 60초로 제한; 5초 grace 후 SIGTERM → SIGKILL 에스컬레이션.

### 스트림 (SSE)

| Method | Path                          | 스트리밍                            |
| ------ | ----------------------------- | ---------------------------------- |
| GET    | `/api/stream/scan`            | legacy `node scan.mjs` (서브프로세스)|
| GET    | `/api/stream/scan?source=ats\|regional\|both` | 통합 인프로세스 스캐너 SSE — query: `dryRun=1`, `company=…` (ATS only). |
| GET    | `/api/stream/liveness`        | `node check-liveness.mjs`          |
| GET    | `/api/stream/pdf`             | `node generate-pdf.mjs`            |

SSE 이벤트 타입:

```
event: start    data: { script, args?, writeFiles? }
event: log      data: { stream: "stdout"|"stderr", line: string }
event: done     data: { code, counts?, errors? }
event: error    data: { message }
```

### LLM 엔드포인트 (Anthropic 우선 → Gemini → manual fallback)

| Method | Path                                | 목적                                                                          |
| ------ | ----------------------------------- | -------------------------------------------------------------------------------- |
| POST   | `/api/evaluate`                     | body `{ jd, save? }` → JD 평가 (`oferta.md` 기준 A–G 섹션)              |
| POST   | `/api/evaluate/test-gemini`         | `GEMINI_API_KEY` 스모크 체크                                                     |
| POST   | `/api/evaluate/test-anthropic`      | `ANTHROPIC_API_KEY` 스모크 체크                                                  |
| POST   | `/api/deep`                         | body `{ company, role?, run? }` → deep-research 프롬프트 또는 라이브 grounded markdown |
| POST   | `/api/mode/:slug`                   | 범용 mode 러너; allowlist: `batch`, `contacto`, `followup`, `interview-prep`, `patterns`, `project`, `training` |
| POST   | `/api/apply-helper`                 | body `{ url, jd? }` → 지원 체크리스트                                      |
| GET    | `/api/scan-results`                 | `{ en: {when, fresh[], filtered[], errors[]}, ru: { ... } }` — 마지막 스캔         |
| GET    | `/api/scan/regional/config`         | 적용 중인 regional-scanner 설정 (queries, negatives, sources). |

`/api/deep` 또는 `/api/mode/:slug`에 `run: true`가 설정되면, 서버는 Anthropic을 선호하며(두 키 모두 있을 때), `cv.md` + `config/profile.yml` + `modes/_shared.md` + 관련 mode 템플릿을 `<project_context>` 블록에 인라인하고, 모델의 grounded markdown을 직접 반환합니다. Soft cap: 어셈블된 프롬프트 200 KB — 초과 시 413 반환.

---

## 테스트

```bash
npm test                       # 284 unit/integration 테스트
npm run test:e2e               # 20 smoke e2e (자체 서버 부팅)
npm run test:e2e:full          # 23 comprehensive e2e
npm run test:e2e:browser       # 12 Playwright browser-smoke
npm run test:coverage          # `npm test`와 동일 + V8 coverage
```

| Suite                       | Tests | 내용                                                                                                       |
| --------------------------- | ----- | ---------------------------------------------------------------------------------------------------------- |
| `node --test tests/*.test.mjs` (unit + integration) | **284** | 모든 엔드포인트, 임시 서버, 네트워크 없음. parser, scanner (mocked), runner, anthropic, security headers, XSS, JD sanitize, URL validation, i18n 패리티 포함. |
| `tests/e2e.mjs` (smoke)      | 20    | Playwright headless: 모든 라우트 렌더링, 기본 플로우.                                                     |
| `tests/e2e-comprehensive.mjs` | 23    | 전체 Playwright 워크스루: 11개 라우트 + 12개 기능 플로우.                                              |
| `tests/playwright-smoke.mjs` (`npm run test:e2e:browser`) | **12** | 브라우저 주도 smoke: dashboard render, navigation, language switch, 404, health, tracker round-trip (BF-1), pipeline add + invalid-URL 스윕, reports empty, evaluate manual fallback, config keys masked, CV PUT XSS strip, pipeline preview 400. |
| **Total**                   | **339** | **0 fails, 0 flakes**                                                                                    |

Coverage: `--experimental-test-coverage` 경유 ~93% 라인 / ~83% 브랜치.

파서는 순수 함수(I/O 없음) — `applications.md`, `pipeline.md`, `reports/*.md`의 실제 데이터 fragment로 테스트됩니다. API 테스트는 Express 앱을 임시 포트에서 부팅하고 모든 엔드포인트를 end-to-end로 운동시킵니다. 스캐너 테스트는 `fetch`를 mock하여 hh.ru가 IP를 차단해도 통과합니다. Playwright 브라우저 smoke는 인프로세스 서버에 대해 실행되고 부모 프로젝트의 `node_modules`를 통해 Playwright를 해결합니다 — `web-ui/`에 새 의존성 없음.

CI는 `main`에 푸시할 때마다 Node 18 / 20 / 22에서 unit + e2e + Playwright 매트릭스를 실행합니다.

---

## 설정

환경 변수 (서버 시작 시 읽음, 명시된 경우 외에는 모두 선택사항):

| Var                  | 기본값            | 목적                                                                            |
| -------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| `PORT`               | `4317`             | Express 바인드 포트                                                                  |
| `HOST`               | `127.0.0.1`        | Express 바인드 호스트. 비-loopback일 때 CSP 첨부; v2.0.0에서 auth gate 계획.   |
| `CAREER_OPS_ROOT`    | 스크립트 기준 `..`   | `cv.md`, `data/`, `portals.yml`, `modes/` 등의 위치.                      |
| `ANTHROPIC_API_KEY`  | 미설정              | `/api/evaluate`, `/api/deep`, `/api/mode/:slug` 라이브 모드 활성화 (두 키 모두 있을 때 선호). |
| `ANTHROPIC_MODEL`    | `claude-sonnet-4-6` | Anthropic 모델 override.                                                         |
| `GEMINI_API_KEY`     | 미설정              | `gemini-eval.mjs`로 전달되며 `/api/evaluate`의 fallback으로 사용.           |
| `GEMINI_MODEL`       | `gemini-2.0-flash` | Gemini 모델 override.                                                             |
| `(server uses default UA)`      | 미설정              | hh.ru User-Agent override (비-RU IP에서 403 감소에 도움)                       |

이 UI가 인식하는 `portals.yml` 확장(부모 프로젝트의 기존 파일에 추가):

```yaml
russian_portals:
  sources: ["hh", "habr"]
  area: 113          # hh.ru area id
  per_page: 50
  only_remote: false
  queries: ["Senior PHP", "Тимлид Go", ...]
```

회사 항목을 명시적 `api:` URL로 확장할 수도 있습니다. 24개 검증된 회사의 즉시 붙여넣기 가능 블록은 [`docs/portals-examples.md`](docs/portals-examples.md)(이 저장소)를 참조하세요.

---

## 보안 노트

- 서버는 기본적으로 `127.0.0.1`에 바인드 — 명시적 `HOST=0.0.0.0` 없이는 인터넷에 노출되지 않음.
- 클라이언트의 모든 파일 경로 입력은 새니타이즈(`replace(/[^\w\-.]/g, '')`).
- 서브프로세스 호출은 arg 배열로 `spawn` 사용 — **shell interpolation 절대 없음**.
- 스트리밍 엔드포인트는 클라이언트 연결 해제 시 자식 프로세스 종료 (orphan 스캐너 없음).
- 쓰기 엔드포인트는 알려진 career-ops 경로만 건드림: `data/`, `jds/`, `cv.md`, `config/`, `portals.yml`, `output/`. 그 외 어디에도 절대 없음.
- 연결 배너는 연결 해제 시 3초마다 `/api/health` ping을 보내고 복구 시 자동으로 사라짐 — toast 스팸 없음.

---

## 제한 사항

완전 LLM 주도 모드(`oferta`, `deep`, `contacto`, `apply`, `batch`, `patterns`, `followup`)는 실제 실행에 LLM이 필요합니다. 웹 UI는 세 가지 옵션을 제공합니다:

1. **Anthropic (우선)** — 부모 프로젝트의 `.env`에 `ANTHROPIC_API_KEY` 설정. `cv.md` / `config/profile.yml` / `modes/_shared.md` / mode 템플릿이 자동 인라인되는 `runAnthropic`을 통해 라우팅(REVIEW-A1). v1.8.0+에서 `claude-sonnet-4-6`이 deep-research 호출에 대해 26 KB의 grounded markdown을 반환하며 라이브 검증됨.
2. **`gemini-eval.mjs`** fallback — `GEMINI_API_KEY`만 설정되어 있을 때 별도 작업 없이 작동.
3. **복붙 프롬프트** — 키가 설정되지 않았을 때, UI가 Claude Code / ChatGPT / Gemini Web용으로 포맷된 ready 프롬프트를 생성.

Claude Code 내부의 기존 `/career-ops apply` Playwright 폼 채우기 플로우는 실제로 지원 양식을 자동 채우는 유일한 방법으로 남아 있습니다 — UI의 *Apply helper*는 대신 체크리스트를 생성합니다.

production-readiness 평가(배포 게이트, 위험 등록부, 보류된 작업)는 [`docs/PRODUCTION-READINESS.md`](docs/PRODUCTION-READINESS.md)를 참조하세요. TL;DR: 싱글 테넌트 loopback 준비 완료; LAN 노출은 v2.0 P-12 auth gate를 대기 중.

---

## 기여하기

이슈와 PR 환영. 하우스 룰:

- 푸시 전 `npm test` 실행 — **284 checks green**이 기준 (UI를 건드리면 + 12 Playwright).
- Non-trivial 변경은 GSD 파이프라인을 거침. [`docs/sdd/SDD-GUIDE.md`](docs/sdd/SDD-GUIDE.md) 참조.
- 이 저장소 내부에서 부모 `career-ops/` 프로젝트의 어떤 것도 수정하지 말 것. 핵심은 이것이 비침습적 오버레이라는 점입니다. [`CLAUDE.md`](CLAUDE.md)의 hard rule.
- Conventional commits: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`. 선택적 스코프: `feat(scan):`. Breaking change: `feat!:`.
- 테스트는 CI 격리되어야 함 — `mkdtempSync` 또는 `CAREER_OPS_ROOT=$(mktemp -d)`로 fixture 부트스트랩.

Claude 외 CLI(Codex, Aider, Cursor, Gemini)에서 저장소를 운전하나요? [`AGENTS.md`](AGENTS.md) 또는 [`GEMINI.md`](GEMINI.md)를 읽어보세요 — 둘 다 캐노니컬 `CLAUDE.md`로 심(shim)됩니다.

---

---

## 🌍 Getting Started — 설치 후 첫 단계

one-command install 후 두 개의 빈 git 클론이 있으며, **EDIT ME** 마커가 포함된 시작 `cv.md`, `config/profile.yml`, `portals.yml`, `data/applications.md`, `data/pipeline.md` 파일로 스캐폴드되어 있습니다. Health 페이지는 첫 실행에서 이미 모두 녹색이어야 합니다. 플레이스홀더를 실제 데이터로 교체하세요:

### 1. CV 만들기 (`cv.md`)

세 가지 옵션이 있습니다:

- **옵션 A — 기존 이력서 붙여넣기:** `career-ops/cv.md`를 열고, EDIT-ME
  플레이스홀더를 깔끔한 markdown의 실제 이력서로 교체
  (섹션: Summary, Experience, Projects, Education, Skills). 단순할수록
  좋습니다 — `career-ops`는 이를 plain text로 읽습니다.
- **옵션 B — UI에서 업로드:** 사이드바에서 **CV** 클릭 →
  **📁 Upload CV** → `.md` / `.txt` 파일 선택 → 미리보기 확인 →
  **💾 Save** 클릭.
- **옵션 C — Claude Code에 LinkedIn URL 전달:** `career-ops/`에서 Claude Code를 열고
  `/career-ops` 실행, LinkedIn URL 붙여넣기,
  *"이것에서 내 CV를 추출해 cv.md에 작성해줘"* 요청.

모든 지표를 구체적으로 만드세요 (예: *"p99 지연을 38% 감소"*가 아닌
*"성능을 개선"*). 평가 파이프라인은 이 파일에서
지표를 바로 읽습니다.

### 2. 프로필 편집 (`config/profile.yml`)

```bash
$EDITOR career-ops/config/profile.yml
```

플레이스홀더 교체: 전체 이름, 이메일, 위치, LinkedIn, 타겟
역할, archetypes, 급여 목표. **archetypes**가 가장 중요한
필드입니다 — 모든 JD가 당신과 매칭되는 방식입니다.

### 3. 스캐너 튜닝 (`portals.yml`)

```bash
$EDITOR career-ops/portals.yml
```

`title_filter.positive` (예: `"PHP"`, `"Go"`, `"Backend"`, `"Senior"`)와
`title_filter.negative` (예: `"Junior"`, `"Java"`, `"iOS"`)를 자신의
스택과 시니어리티에 맞게 설정. 번들된 `tracked_companies` 목록은 이미
3개의 검증된 Greenhouse / Ashby board(GitLab, Vercel, Linear)를 포함합니다. 24개 이상의
즉시 붙여넣기 가능 블록은 [`docs/portals-examples.md`](docs/portals-examples.md)를 참조.

hh.ru / Habr Career 스캔을 원하면, setup 스크립트가 생성한
`russian_portals:` 블록을 편집 — 검색 쿼리 추가 (예: `"Senior PHP"`,
`"Тимлид Go"`).

### 4. (선택) LLM API 키

UI는 둘 다 있을 때 Anthropic을 Gemini보다 선호합니다. 하나만
또는 하나도 없어도 작동합니다 — 키가 없으면 **Evaluate**는
Claude Code용 복붙 프롬프트를 반환합니다.

```bash
# Anthropic (선호)
echo "ANTHROPIC_API_KEY=sk-ant-..." >> career-ops/.env
# Gemini (fallback)
echo "GEMINI_API_KEY=AIza..." >> career-ops/.env
```

또는 UI의 **App settings** 페이지(`/#/config`)에서 설정 — 동일한
파일, 읽을 때 마스킹, `process.env`에 즉시 적용.

### 5. 검증하고 작업 시작

Health 페이지를 새로고침 — 모든 필수 체크가 녹색이어야 합니다. 그런 다음:

1. **🌐 Scan** 클릭 → ~5초 대기 → Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday +
   hh.ru / Habr Career가 스캔되고, 채용 공고가 아래 테이블에 나타납니다.
2. 아무 제목 클릭 → 원본 공고가 새 탭에서 열립니다.
3. 유망한 것이 보일 때까지 stack 칩(PHP / Go / Backend / Senior)으로
   필터.
4. URL 복사 → **Pipeline**에 붙여넣기 → **Evaluate** 클릭 →
   0-5로 라이브 점수 매기기(Anthropic / Gemini) 또는 수동 프롬프트 받기.
5. 보고서는 `reports/`에, tracker는 `data/applications.md`에,
   라이브 deep-research는 `interview-prep/`에 저장됩니다. 모두 UI에서 볼 수 있습니다.

> 이 가이드의 번역은 각 언어별 README에 있습니다:
> [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) ·
> [한국어](README.ko-KR.md) · [日本語](README.ja.md) ·
> [Русский](README.ru.md) · [简体中文](README.zh-CN.md) ·
> [繁體中文](README.zh-TW.md)

---

## License

MIT. [LICENSE](LICENSE) 참조.

[santifer](https://santifer.io)의 [career-ops](https://github.com/santifer/career-ops) 위에 구축. 훌륭한 파이프라인에 감사드립니다.
