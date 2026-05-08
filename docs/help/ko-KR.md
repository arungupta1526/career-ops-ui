# 도움말 — career-ops-ui

첫 실행부터 인터뷰 준비까지 각 페이지에 대한 완전한 가이드. 각 `##`는
사이드바 항목 또는 워크플로의 한 단계에 해당합니다. 처음에는 위에서
아래로 읽고, 나중에는 도움말 사이드바의 TOC를 통해 원하는 섹션으로
바로 이동하세요.

> **대상:** 이 UI를 `career-ops` 체크아웃 안에 두고 `bash bin/start.sh`를
> 실행한 분. career-ops에 대한 사전 지식은 가정하지 않습니다.

---

## 1. 빠른 시작 (5분 안에)

전체 사이클:

1. **Health** (`#/health`) — 모든 필수 검사가 초록인지 확인. `cv.md`,
   `config/profile.yml`, `portals.yml`이 없으면 페이지가 정확히 어떤
   파일을 만들어야 하는지 알려줍니다.
2. **App settings** (`#/config`) — `ANTHROPIC_API_KEY`와 (선택)
   `GEMINI_API_KEY`를 붙여넣고 **Save**. 키는 부모 프로젝트의 `.env`에
   저장되어 career-ops 스크립트도 같은 값을 읽습니다.
3. **Profile** (`#/profile`) — `config/profile.yml`을 검토하고
   템플릿 이름(`Jane Smith`)을 실제 이름으로 교체.
4. **CV** (`#/cv`) — 이력서를 붙여넣거나 업로드하고 **💾 Save**.
   서버 sanitizer가 `<script>`, `javascript:` URL, `on*=` 핸들러를
   기록 전에 제거합니다.
5. **Scan** (`#/scan`) — **🌐 Scan** 클릭으로 모든 활성 소스를 한 번에
   스캔(Greenhouse / Ashby / Lever, hh.ru / Habr Career).
6. **Pipeline** (`#/pipeline`) — 스캐너가 큐에 넣은 URL을 검토.
   클릭하면 오른쪽에 JD 미리보기.
7. **Evaluate** (`#/evaluate`) — JD를 붙여넣음(또는 pipeline의
   **▶ Evaluate** 클릭). Anthropic / Gemini 키가 있으면 모델이 0–5
   점수를 매기고 결과는 `reports/`에 저장.
8. **Tracker** (`#/tracker`) — 모든 평가는 한 행을 받습니다.
9. **Apply checklist** (`#/apply`) — 제출 체크리스트 생성.
10. **Deep research** (`#/deep`) — 지원을 결정한 후 회사 브리프 실행.
    `interview-prep/`에 저장.

---

## 2. 앱 설정 & API 키 (`#/config`)

브라우저에서 부모 프로젝트의 `.env`를 편집. career-ops Node 스크립트가
부팅 시 읽는 같은 파일이므로 여기서 저장하면 즉시 양쪽에 반영됩니다.

### 인식되는 키

| 키 | 역할 | 발급처 |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic SDK 라이브 호출 활성화. 양쪽 키가 모두 있을 때 우선됨. | <https://console.anthropic.com/settings/keys> |
| `ANTHROPIC_MODEL` | 기본값 `claude-sonnet-4-6` 재정의. | — |
| `GEMINI_API_KEY` | Anthropic 없을 때 fallback. `gemini-eval.mjs`에서 사용. | <https://aistudio.google.com/apikey> |
| `GEMINI_MODEL` | Gemini 모델 재정의. | — |
| `HH_USER_AGENT` | 러시아 외 IP에서 `hh.ru` 스캔 시 필요. | dev.hh.ru |
| `PORT` | Express 포트. 기본 4317. | — |
| `HOST` | 바인드. 기본 `127.0.0.1`. `0.0.0.0`은 LAN 노출 — **auth gate 아직 없음**. | — |

### 동작

- **읽기** (`GET /api/config`) — 시크릿 키는 마스킹됨
  (`sk-ant•••••a1b2`).
- **저장** (`POST /api/config`) — 검증 → `.env` 기록 → 즉시
  `process.env`에 적용. 재시작 불필요.
- **빈 값은 키 삭제**.

### Smoke-test 버튼

저장 후 **▶ Test Anthropic** / **▶ Test Gemini** — 작은 prompt
(≤256 토큰)으로 키가 작동하는지 확인. ~200자 샘플 반환.

---

## 3. Profile (`#/profile` — `#/settings`로도 접근 가능)

`config/profile.yml`의 read-only 뷰. 디스크에서 직접 편집;
페이지는 reload에 다시 파싱.

핵심 필드:

- `candidate.full_name` — 모든 prompt에서 사용. **실제 스캔 전에
  `Jane Smith`를 실제 이름으로 교체**.
- `candidate.email`, `linkedin`, `github` — cover letter와 apply
  checklist에서 참조.
- `target.roles` — 받아들일 수 있는 직책.
- `target.comp_total_min_usd` — 최소 보상. 각 평가의 D 섹션이 이
  값보다 낮은 오퍼를 표시.
- `target.archetypes` — *가장 중요한 필드*. 모든 JD가 이에 대해
  매칭되고 가장 잘 맞는 아키타입이 리포트 헤더에 들어갑니다.

Health는 `full_name`이 알려진 placeholder일 때 **Profile customized**
체크를 표시합니다.

---

## 4. CV (`#/cv`)

모든 평가, deep research, cover letter의 진실의 원천. 부모 루트의
`cv.md`에 저장.

### 편집 옵션

- **직접 붙여넣기** — 왼쪽 textarea는 markdown 에디터.
- **📁 Upload CV** — `.md`, `.txt`, `.html`; **💾 Save**로 저장.
- **LinkedIn에서** — 부모에서 Claude Code 열고 `/career-ops` 실행,
  LinkedIn URL 붙여넣고 `extract my CV from this and write it to
  cv.md` 요청.

### 새니타이즈

`stripDangerousMarkdown`이 `<script>`, `<iframe>`, `<object>`,
`<embed>`, `<svg>`, `<style>`, `<form>`, 인라인 핸들러
(`onclick=`), URI `javascript:`/`vbscript:`/`data:text/html`을
제거. 응답은 무언가 제거된 경우 `sanitized: true`. 최대 1 MB.

### 다른 버튼

- **sync-check** — `cv-sync-check.mjs`.
- **📄 Generate PDF** — `generate-pdf.mjs` → `output/*.pdf`.
  Playwright 필요.

### 형식 팁

- 한 bullet = 메트릭이 있는 한 가지 성과.
- 섹션 순서: **Summary**, **Experience**, **Projects**,
  **Education**, **Skills**.
- 1500단어 미만으로 유지.

---

## 5. 포털 & 소스 (`portals.yml`)

스캐너 설정. 세 섹션이 중요:

### `title_filter`

```yaml
title_filter:
  positive: [backend, engineer, senior, tech lead, golang, php]
  negative: [junior, intern, frontend, ios, android, java]
```

스캔된 vacancy는 title이 **하나 이상의 positive**를 포함하고 **어떤
negative도 없을 때** 통과.

### `tracked_companies`

```yaml
tracked_companies:
  - { name: Stripe,    enabled: true, careers_url: https://job-boards.greenhouse.io/stripe }
  - { name: Linear,    enabled: true, careers_url: https://jobs.ashbyhq.com/linear }
  - { name: JetBrains, enabled: true, careers_url: https://jobs.lever.co/jetbrains }
```

EN 스캐너는 URL 패턴에서 ATS를 감지하고 boards-api를 직접 호출.

### `russian_portals`

```yaml
russian_portals:
  sources: [hh, habr]
  area: 113                 # 113=러시아, 1001=원격
  per_page: 50
  only_remote: false
  queries:
    - "Senior PHP"
    - "Senior Go"
```

`queries`와 negative 리스트의 충돌을 주의 — 콘솔이 경고합니다.

### Bootstrap

첫 부팅에서 서버는 `russian_portals:` 블록이 없으면 자동 추가
(idempotent).

---

## 6. Health (`#/health`)

모든 setup 게이트가 OK / OPTIONAL / FAIL 배지로 표시.

### 필수 (없으면 시스템이 작동 안 함)

`Node version` ≥ 18, `Project root`, `cv.md`, `config/profile.yml`,
`portals.yml`, `data/applications.md`, `data/pipeline.md`,
`modes/oferta.md`.

### 선택 (경고만)

`Profile customized`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`,
`HH_USER_AGENT`, Playwright, 부모 deps, 디렉토리.

`HOST=0.0.0.0`일 때 절대 경로와 정확한 Node 버전은 숨겨집니다.

### 실행 버튼

- **▶ Doctor** — `node doctor.mjs`.
- **▶ Verify pipeline** — `node verify-pipeline.mjs`.

---

## 7. Scan (`#/scan`)

스캐너가 활성 보드를 순회하고 히스토리에 대해 dedup하고 hits를
`data/last-scan.json`과 `data/pipeline.md`에 기록.

### 원클릭 스캔

**🌐 Scan**이 한 번에 모든 소스를 실행. 라이브 SSE 로그가
오른쪽에 표시. **Stop** 또는 페이지 떠나기로 중단.

### 결과 필터

- 자유 텍스트.
- Source 드롭다운.
- Remote / Hybrid / Onsite.
- Stack chips (PHP, Go, Backend, Senior) 자동 감지.
- 동적 chips: title의 가장 빈번한 capitalized 토큰 top-25.

### Active Companies

접을 수 있는 카드:

- ✓ 녹색 — 직접 API 지원.
- ○ 회색 — 웹 검색 fallback.

**이름 클릭** → 위 결과 필터를 채움. **↗ 클릭** → 새 탭에서
`careers_url`.

---

## 8. Pipeline (`#/pipeline`)

평가 대기 URL의 inbox. `data/pipeline.md`에 저장.

### URL 추가

- 입력하거나 붙여넣고 **+ Add**.
- **Ctrl+K** / **Cmd+K** → 글로벌 검색에 포커스 → URL 붙여넣고
  Enter.
- Scan 실행 → 새 hits가 자동으로 추가.

각 URL은 서버 측 `isValidJobUrl()`을 통과. Loopback, `file://`,
`javascript:`, IP 리터럴, 템플릿 문자 — 모두 400.

### 서버 측 미리보기

행 클릭 시 오른쪽에 미리보기. 서버가 프록시하고
`<script>`/`<style>`/태그를 제거하고 최대 8 KB 평문을 반환.

리다이렉트는 **hop별 SSRF 검증**으로 수동 추적. 캡 3홉, 15초 timeout.

### 행 액션

- **▶** — `#/evaluate?url=…`로 이동.
- **✕** — pipeline에서 제거.

### 상단 버튼

- **⚡ Evaluate first** — 첫 URL을 Evaluate에서 엽니다.
- **Scan** — 스캐너로 돌아가기.

---

## 9. Evaluate (`#/evaluate`)

JD를 `cv.md`와 `config/profile.yml`에 대해 점수화. `modes/oferta.md`
당 A–G 평가 + 0–5 점수 반환.

### 입력

JD를 textarea에 붙여넣거나 `#/pipeline`에서 `?url=…`로 도착.

**💾 Save JD** → `jds/jd-<date>-<ts>.txt`에 저장.

### Fallback 체인

1. **Anthropic** — `ANTHROPIC_API_KEY`가 설정되면 우선됨.
   `bundleProjectContext`가 cv + profile + `_shared.md` +
   `oferta.md`를 인라인. 각 파일 16 KB 캡, 프롬프트 soft-cap 200 KB.
2. **Gemini** — `GEMINI_API_KEY`만 있을 때. `gemini-eval.mjs`
   spawn.
3. **Manual** — 키 없음. 페이지가 복사할 prompt 반환.

### 출력

A. Role Summary · B. CV Match · C. Risks · D. Compensation · E.
Application Strategy · F. Verdict (0.1 정밀도 0–5) · G. Posting
Legitimacy.

**💾 Save report** → `reports/<date>-<company>-<role>.md`.

---

## 10. Reports (`#/reports`)

저장된 모든 평가 탐색. 카드는 title, 날짜, legitimacy 플래그, 점수
(녹색 ≥ 4.0, 노란색 ≥ 3.0, 빨간색 미만)를 표시. 페이지당 12개.

단일 리포트 뷰: **← All reports**, **🔗 Open JD**.

---

## 11. Tracker (`#/tracker`)

CRM. 한 행 = 한 지원. `data/applications.md`에 GFM 테이블로 저장.

### 상태 흐름

`Evaluated` → `Applied` → `Responded` → `Interview` → `Offer` /
`Rejected` / `Discarded` / `SKIP`. 화이트리스트 서버 측 강제.

### 컬럼

| 컬럼 | 의미 |
|---|---|
| `#` | 자동 번호. |
| `Date` | ISO. |
| `Company` | 자유 텍스트. **파이프와 줄바꿈 이스케이프됨.** |
| `Role` | 동일. |
| `Score` | `N/5`. |
| `Status` | 화이트리스트. |
| `PDF` | ✅ 성공 시. |
| `Report` | `reports/*.md` 링크. |
| `Notes` | 자유 텍스트, 최대 200자. |

### 필터

Status, Score (`≥ 4.0`/`≥ 3.0`/`< 3.0`), Search. 페이지당 25행.

### 유지보수

- **▶ Normalize** / **▶ Dedup** / **▶ Merge**.

---

## 12. Deep research (`#/deep`)

회사 구조화 브리프 생성: snapshot, 엔지니어링 문화, 최근 뉴스,
Glassdoor 정서, 인터뷰 프로세스, 협상 레버리지, 리크루터에게 할 세
가지 똑똑한 질문.

### 입력

회사명 + (선택) 역할. `modes/deep.md` 템플릿이 구조를 결정.

### 출력 경로

Evaluate와 동일한 fallback 체인:

1. **Anthropic live** — `bundleProjectContext`가 cv + profile +
   `_shared.md` + `deep.md` 인라인. 10–30 KB grounded markdown을
   `interview-prep/<company>-<role>.md`에 저장.
2. **Gemini live** — `gemini-eval.mjs`.
3. **Manual** — Claude Code용 prompt (WebFetch + WebSearch로 실제
   리서치).

### 팁

- Anthropic `claude-sonnet-4-6`은 보통 1–3분에 ~13 KB.
- 라이브 호출은 유료; 한 Sonnet 4.6 deep-research 호출 ≈ $0.30–0.50.

---

## 13. Mode prompts (일곱 페이지 `/#/<mode>`)

일곱 가지 prompt 빌더: **Project** 아이디어, **Training** 계획,
**Follow-up** 이메일, **Batch** 평가, **Outreach** 리크루터에게,
**Interview prep** one-pager, **Patterns** 회고. 각각
`modes/<slug>.md` 템플릿을 감쌉니다:

| 페이지 | Slug | 용도 |
|---|---|---|
| `#/project` | `project` | 타깃 역할에 맞춘 포트폴리오 프로젝트. |
| `#/training` | `training` | 스킬 갭 분석 → 커리큘럼. |
| `#/followup` | `followup` | 인터뷰 후 이메일 초안. |
| `#/batch` | `batch` | 멀티 JD 배치 평가 prompt. |
| `#/contacto` | `contacto` | 리크루터 / 추천 outreach 메시지. |
| `#/interview-prep` | `interview-prep` | 특정 라운드 one-pager. |
| `#/patterns` | `patterns` | "어떤 패턴이 나를 성공시켰는가?" |

### 공통 형태

각 페이지: 작은 form + **▶ Generate prompt** (manual) +
**⚡ Run live** (키가 있을 때 primary).

**▶ Generate prompt** → 사용자 form 값을 JSON으로 `User-supplied
context:` 블록에 직렬화한 조립 prompt 반환.

**⚡ Run live** → 같은 prompt를 Anthropic (또는 Gemini)에 전송, cv +
profile + `_shared.md`가 `bundleProjectContext`로 인라인. 결과는
페이지에서 렌더링되고 복사 가능, `.md`로 다운로드 가능.

---

## 14. Apply checklist (`#/apply`)

지원하기로 결정한 후 Apply helper 페이지가 제출 체크리스트를 생성.
폼을 자동 채우지 **않음** — 그 흐름은 부모의 Playwright를 사용하는
Claude Code의 `/career-ops apply`에 남습니다.

체크리스트:

0. Claude Code에서 `/career-ops apply <url>` 실행.
1. 게시물이 여전히 활성인지 확인 (`check-liveness.mjs`).
2. CV가 최신인지 확인 (`cv-sync-check.mjs`, score ≥ 4.0이면 PDF).
3. cover letter / "Why us?" 답변을 `cv.md`의 STAR+R proof point로
   맞춤화.
4. EEO / 스폰서십 / 시작일 질문에 정직하게.
5. 답변을 `interview-prep/{company}-{role}.md`에 저장 후 제출.
6. **자동 제출 절대 안 됨** — 사람(당신)이 마지막 버튼 클릭.
7. 제출 후: `data/applications.md`에 행 추가.

---

## 15. 인터뷰 준비

post-research, pre-interview 단계. 이 앱의 세 가지 아티팩트가
수렴:

1. **저장된 deep-research 파일** — `interview-prep/`. Deep research
   페이지에서 검색.
2. **Patterns mode** (`#/patterns`) — "최근 N 인터뷰 / 오퍼 / 거절을
   가로질러 어떤 패턴이 유지되는가?" 5+ tracker 행이 있을 때 유용.
3. **Interview-prep mode** (`#/interview-prep`) — 다가오는 특정
   라운드(behavioral, technical, system design)를 위한 one-pager
   사전 작성.

### 권장 워크플로

각 인터뷰:

1. 전날 Deep을 다시 실행하거나 저장된 파일 열기.
2. `#/interview-prep` — 특정 라운드용 one-pager 생성.
3. System design / coding — `#/training`에서 30분 타깃 리프레셔.
4. Compensation — deep-research 파일 열고 "Negotiation leverage
   points"로 점프. 2–3 datapoint(Glassdoor 밴드, 최근 펀딩, 비교
   가능한 오퍼)를 가져옵니다.
5. Behavioral — `cv.md`에서 STAR+R 스토리를 꺼내 원래 Evaluate
   리포트의 B 섹션에 들어가게 합니다.

인터뷰 직후:

1. tracker 행 업데이트: status → `Responded` (이후 `Interview`,
   `Offer`).
2. `#/followup`을 실행하여 thank-you 이메일 초안.
3. 새 정보(보상 범위, 팀 구성, 예상치 못한 tech stack)가 있으면
   `interview-prep/<company>-<role>.md`에 `## Post-round notes`로
   편집.

---

## 16. Activity 로그 + 트러블슈팅

### Activity 로그 (`#/activity`)

서버에 도달하는 모든 state-changing 요청의 audit trail. 시크릿
(`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`)은 진입 시 redact —
`data/activity.jsonl`에서 실제 키 값을 절대 볼 수 없습니다.

action prefix로 필터(`pipeline.`, `cv.`, `evaluate`, `scan.`).
페이지당 25행; 서버는 최대 500개의 가장 최근 이벤트를 반환.

### 트러블슈팅

| 증상 | 가능한 원인 | 해결 |
|---|---|---|
| Health가 `cv.md`에서 빨강 | 첫 실행, 파일 없음 | `touch $CAREER_OPS_ROOT/cv.md` + refresh. |
| `Profile customized`가 빨강 | `full_name`이 여전히 `Jane Smith` | `config/profile.yml` 편집. |
| `hh.ru: HTTP 403` | 비-러시아 IP, `HH_USER_AGENT` 없음 | `dev.hh.ru/admin`에 등록, `HH_USER_AGENT` 설정. |
| `gemini-eval.mjs: ERR_MODULE_NOT_FOUND` | 부모 deps 미설치 | `cd $CAREER_OPS_ROOT && npm install`. |
| Generate PDF 에러 | Playwright 미설치 | `npx playwright install chromium`. |
| `EADDRINUSE: 4317` | 옛 인스턴스 실행 중 | `pkill -f 'node server/index.mjs'`. |
| 라이브 LLM 호출 2분 이상 멈춤 | 거대한 prompt 또는 Anthropic 느림 | soft-cap 200 KB → 413. |
| Pipeline 미리보기 `(unsafe redirect)` | 게시물이 사설 IP / loopback으로 리다이렉트 | 보안 기능 (REVIEW-B1). |
| Tracker 행이 테이블 깨뜨림 | v1.9.1 이전 파이프 | v1.9.1+로 업데이트 (BF-1). |
| `npm test` fresh clone에서 실패 | 테스트가 부모 레이아웃 가정 | `CAREER_OPS_ROOT=$(mktemp -d)`. |

심층 진단: Health에서 **▶ Doctor** 실행하고 출력을 복사해서
<https://github.com/Fighter90/career-ops-ui/issues>에서 검색.
