# career-ops-ui

> [career-ops](https://github.com/santifer/career-ops) AI 구직 파이프라인을 위한 깔끔한 docs-style 웹 인터페이스.
> Claude Code, 터미널, 마크다운 파일 사이를 오가는 대신 — 단일 브라우저 탭에서 모든 채용 공고를 검색, 평가, 심층 조사, 지원, 추적할 수 있습니다.

[English](README.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | **한국어** | [日本語](README.ja.md) | [Русский](README.ru.md) | [简体中文](README.cn.md) | [繁體中文](README.zh-TW.md)

[![tests](https://img.shields.io/badge/tests-284%20passed-brightgreen)](README.md#tests)
[![playwright](https://img.shields.io/badge/playwright-12%20smoke-brightgreen)](#tests)
[![node](https://img.shields.io/badge/node-%E2%89%A518-blue)](README.md#requirements)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![release](https://img.shields.io/badge/release-v1.9.1-blue)](https://github.com/Fighter90/career-ops-ui/releases/tag/v1.9.1)

> 📦 **v1.9.1** — 서버를 130줄 오케스트레이터 + `server/lib/routes/`의 12개 라우트 모듈로 리팩터링. `/api/evaluate`의 Anthropic 패리티(두 키 모두 있을 때 우선). 멀티 CLI 심(`AGENTS.md`, `GEMINI.md`)으로 Codex / Aider / Cursor / Gemini CLI 지원. **unit 284개 + Playwright smoke 12개**. 전체 production-readiness 평가: [`docs/PRODUCTION-READINESS.md`](docs/PRODUCTION-READINESS.md). 싱글 테넌트 loopback 배포 준비 완료; LAN 노출용 auth gate는 v2.0 (P-12)에서 제공.

![career-ops-ui — vacancy search](./public/images/screen_vacancy_found.png)

## career-ops 소개

[career-ops](https://career-ops.org)는 모든 AI 코딩 CLI(Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot CLI) 안에서 슬래시 명령으로 실행되는 오픈소스 구직 시스템입니다. 모델 무관. 각 공고를 6차원 0.0–5.0 루브릭으로 CV와 매칭하고, 맞춤형 PDF 이력서를 생성하며, 모든 지원을 로컬에서 추적합니다 — 클라우드 계정 없음, 텔레메트리 없음, 자동 제출 없음.

**이 저장소(career-ops-ui)**는 CLI 위에 다듬은 웹 인터페이스입니다. CLI는 form-fill(Playwright MCP 경유)과 슬래시 명령 모드를 계속 소유; SPA는 동일한 `cv.md` / `data/applications.md` / `reports/` 위에 CRM 스타일 표면을 제공합니다. 데이터 공유.

**Score 별 액션 임계값** ([career-ops.org/docs](https://career-ops.org/docs)):

| Score | 다음 단계 |
|---|---|
| **≥ 4.5** | `/career-ops apply` — 높은 적합도, 즉시 지원 |
| **4.0 – 4.4** | 지원 또는 `/career-ops contacto` (warm intro) |
| **3.5 – 3.9** | `/career-ops deep` — 먼저 리서치 |
| **< 3.5** | 특별한 이유 없으면 건너뜀 |

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

이 명령은 두 저장소(career-ops + career-ops-ui)를 클론하고, 의존성을 설치하고, http://127.0.0.1:4317에서 서버를 시작합니다.

## 왜?

[career-ops](https://github.com/santifer/career-ops)는 강력한 Claude Code 기반 구직 시스템입니다: JD를 붙여넣으면 → 0-5 적합도 점수, ATS 최적화 PDF, 트래커 항목을 받습니다. Claude Code 내부에서는 잘 작동하지만, 데이터가 `cv.md`, `data/applications.md`, `reports/*.md`, `data/pipeline.md`, `portals.yml`, `config/profile.yml` 사이에 흩어져 있어 — 잃어버리기 쉽고, 훑어보기 어렵습니다.

`career-ops-ui`는 그 위에 세련된 UI를 얹습니다:

- **탐색** — 트래커, 보고서, 파이프라인을 CRM처럼.
- **실행** — 스캔(Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday **및** hh.ru / Habr Career)을 트리거하고 실시간 SSE 로그를 확인.
- **평가** — Gemini API로 JD 평가하거나 Claude용 복붙 프롬프트 받기.
- **편집** — 사이드 바이 사이드 마크다운 미리보기로 `cv.md` 편집.
- **유지보수** — doctor, verify, normalize, dedup, merge — 각각 한 번의 클릭으로.

순수 추가 기능입니다: `career-ops/` 내부는 아무것도 변경되지 않습니다. 커스터마이징은 그대로 유지됩니다.

## 페이지별 기능

| 페이지            | 기능                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Dashboard**    | 집계된 카운트(apps / pipeline / reports), 평균 점수, 상태별 분류, 최근 5개 apps + 최신 보고서.                                  |
| **Scan**         | **🌐 단일 🌐 Scan 버튼** — 한 번에 모든 활성화된 소스를 스캔(ATS adapters (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday) + regional portals (hh.ru / Habr Career)). 실시간 SSE 로그 + stack/level chip 필터와 location / Remote-Hybrid / reloc / source 필터가 있는 결과 테이블. |
| **Pipeline**     | `data/pipeline.md`에 대한 CRUD. URL에서 평가로 바로 점프.                                                                  |
| **Evaluate**     | JD 붙여넣기 → `GEMINI_API_KEY`가 설정되어 있으면 `gemini-eval.mjs` 실행; 없으면 Claude용 복붙 가능 프롬프트 반환.            |
| **Deep research**| 지정된 회사/역할에 대해 `modes/deep.md` 전체 프롬프트 생성.                                                                  |
| **Apply helper** | 지원 체크리스트 생성; 실제 Playwright 폼 채우기는 Claude Code의 `/career-ops apply`에 그대로 유지.                                |
| **Tracker**      | `data/applications.md`에 대한 필터링 가능한 테이블(상태, 점수, 자유 텍스트). normalize/dedup/merge 원클릭 버튼.                |
| **Reports**      | `reports/`의 모든 보고서를 파싱된 헤더(Score / Legitimacy / URL)와 함께 탐색 및 읽기.                                       |
| **CV**           | `cv.md`의 실시간 마크다운 에디터 + 사이드 바이 사이드 미리보기 + sync-check.                                                  |
| **Profile**      | `config/profile.yml` + 아키타입의 read-only 보기.                                                                       |
| **Health**       | OK / OPTIONAL / FAIL 배지로 모든 setup 체크 + `doctor.mjs` 및 `verify-pipeline.mjs` 실행 버튼.                              |

## 요구사항

| | |
| --- | --- |
| **Node.js** | ≥ 18 |
| **career-ops** | 클론되고 onboarded됨 |
| **선택사항** | 원클릭 JD 평가를 위한 `.env`의 `GEMINI_API_KEY` |
| **선택사항** | 러시아 외부에서 실행 중이고 hh.ru API의 403 응답을 줄이고 싶다면 `.env`의 `HH_USER_AGENT` |

## 스택 및 레벨용 칩 필터

채용 공고 테이블에는 다음을 위한 multi-select 칩이 포함되어 있습니다:

- **Stack:** PHP, Symfony, Laravel, Go, Rust, Node.js, TypeScript, Python, Ruby, Java, C#/.NET, C++, Backend, Frontend, Fullstack, Microservices, High-load, Distributed, DevOps/SRE, Data, ML/AI, Mobile, Security, Database, Cloud, API
- **Level:** Lead/Tech Lead, Architect, Manager, Principal/Staff, Senior, Middle, Junior

각 카테고리 내에서 multi-select(OR), 카테고리 간 교차(AND). 카운트가 표시되며, 결과가 있는 칩만 나타납니다.

## 전체 문서

전체 아키텍처, API 레퍼런스, 고급 설정, 보안 노트는 — [영문 README](README.md) 참조.

## 라이선스

MIT. [santifer](https://santifer.io)의 [career-ops](https://github.com/santifer/career-ops) 위에 구축됨.

---

## 🌍 Getting Started — 설치 후 첫 단계

one-command install 후 두 개의 클론된 저장소와 스캐폴드 파일(`cv.md`, `config/profile.yml`, `portals.yml`, `data/applications.md`, `data/pipeline.md` — **EDIT ME** 마커 포함)이 있습니다. Health 페이지가 첫 실행에서 모두 녹색이어야 합니다. 플레이스홀더를 실제 데이터로 교체:

### 1. CV 만들기 (`cv.md`)

- **A — 기존 이력서 붙여넣기:** `career-ops/cv.md`를 깔끔한 markdown으로.
- **B — UI에서 업로드:** **CV** 클릭 → **📁 이력서 업로드** → `.md`/`.txt` 선택 → preview 확인 → **💾 저장** 클릭.
- **C — Claude Code에 LinkedIn 전달:** Claude Code에서 `/career-ops` 실행, "내 CV를 추출해서 cv.md에 작성해줘" 요청.

### 2. 프로필 (`config/profile.yml`)

플레이스홀더 교체: 이름, 이메일, 위치, LinkedIn, 타겟 역할, **archetypes** (가장 중요), 급여 범위.

### 3. 스캐너 (`portals.yml`)

`title_filter.positive`/`negative` 조정. 3개 board(GitLab, Vercel, Linear) 사전 설정. 더 많은 정보: [`docs/portals-examples.md`](docs/portals-examples.md).

### 4. (선택) Gemini API key

```bash
echo "GEMINI_API_KEY=your-key" >> career-ops/.env
```

### 5. 확인 및 시작

Health → 모두 녹색. **🌐 모든 소스 검색** → chip 필터 테이블 → URL 복사 → **Pipeline** → **Evaluate**.

전체 문서 (아키텍처, API, 보안): [영어 README](README.md).
