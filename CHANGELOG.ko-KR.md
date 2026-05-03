# 변경 로그

**career-ops-ui** 의 모든 주요 변경 사항. 형식은 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), 버전은 [SemVer](https://semver.org/) 를 따릅니다.

번역: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

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
