# 변경 로그

**career-ops-ui** 의 모든 주요 변경 사항을 기록합니다. 형식은 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) 를 따르며, 버전은 [Semantic Versioning](https://semver.org/) 을 준수합니다.

번역: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

> **i18n 노트** — 이 파일은 완전히 한국어로 번역되었습니다. 모든 버전 항목의 본문이 출판 등급의 한국어로 제공되며, 영어 본문 임시 대체 표기는 더 이상 사용되지 않습니다.

---

## [1.27.0] — 2026-05-14

**겉모양 + 접근성 다듬기: 사이드바 `#/dashboard` 항목 중복 제거.**

사이드바에서 브랜드 로고(`<a class="logo" href="#/dashboard">`)와 첫 번째 내비 항목이 동일 라우트를 가리켰습니다. 스크린리더는 「Dashboard」를 두 번 읽었고 키보드 사용자는 의미 없는 탭 스톱을 하나 더 거쳤습니다. 브랜드 블록은 이제 평범한 `<div class="logo">`이며 내비 항목만이 `#/dashboard`로의 유일한 링크입니다. **506 / 506** unit + **32 / 32** Playwright — 변동 없음. 상세 내역은 [`CHANGELOG.md`](CHANGELOG.md) 참조.

---

## [1.26.1] — 2026-05-14

**핫픽스 WCAG 2.5.5 — `.btn` 최소 높이 44 px 복원.**

v1.26.0에서 `.btn`의 `min-height: 44px` 선언이 누락되어 헤더 버튼이 39-41 px 로 렌더링됐습니다 (WCAG 2.5.5 위반). v1.26.1에서 44 px 하한선 + `flex-shrink: 0` + `line-height: 1.2` 를 복원했습니다. **502 → 506** unit, Playwright 32/32 그대로. 상세 내용은 [`CHANGELOG.md`](CHANGELOG.md) 참조.

---

## [1.26.0] — 2026-05-14

**테스트 피라미드 + 라인 커버리지 ≥ 93 %.**

v1.25 백로그 요구사항에 따라 4단계 테스트 피라미드(unit → functional → acceptance → e2e)를 도입했습니다. v1.25에서 가장 컸던 커버리지 gap을 메우는 22개 신규 테스트 추가 (jds.mjs 61.64 % → 100 %, auto-pipeline 거절 경로). 멀티 엔드포인트 사용자 여정 테스트를 위한 `tests/acceptance/` 디렉토리 신설. **480 → 502** unit + acceptance, Playwright 32/32 그대로. 상세 내용은 [`CHANGELOG.md`](CHANGELOG.md) 및 [`docs/architecture/TESTING.md`](docs/architecture/TESTING.md) 참조.

---

## [1.25.0] — 2026-05-14

**자동 파이프라인 수동 단락 처리 + 대시보드 외관 수정 + CHANGELOG 패리티 백필.** G-014 (auto-pipeline 이 `mode: 'manual'` 을 무시) 와 G-012 (CHANGELOG 패리티 드리프트 — 6개 로케일이 릴리스 2개 뒤처짐), 그리고 대시보드의 `✨ ✨` 이중 글리프 외관 문제를 마무리합니다. G-003 (`README.cn.md` 이름 변경) 은 사실상 이미 종료되어 있었습니다 — 저장소에는 `README.zh-CN.md` 만 존재합니다. G-005 (A-G → A-F 보고서 블록 재정렬) 은 부모 프로젝트와 조율된 커밋이 필요하여 계속 연기합니다.

### 🛡️ G-014 — 자동 파이프라인 `mode: 'manual'` 단락 처리

- **`fix(auto-pipeline): G-014 — honour mode:'manual' short-circuit`** ([`server/lib/routes/auto-pipeline.mjs:158-195`](server/lib/routes/auto-pipeline.mjs#L158-L195)) — v1.25 이전에는 라우트가 언제나 LLM 을 호출했습니다. `mode: 'manual'` 을 전달해도 (v1.10.2 이후 `/api/evaluate` 와 동일한 의미) 조용히 무시되어 요청이 Anthropic 에서 1~3분간 멈췄습니다. 이제 핸들러는:
  - 하위 호환을 위해 `mode` 와 `evalMode` 를 모두 수용합니다. 두 값 중 어느 쪽이든 `'manual'` 이면 단락 처리가 트리거됩니다.
  - 5개의 SSE 단계를 모두 `status: 'done'` / `status: 'skipped'` 로 방출합니다. fetch 없음. LLM 호출 없음. 요청당 $0.05 의 비용도 없음.
  - `done` 페이로드는 `{ mode: 'manual', prompt: <buildEvaluationPrompt scaffold>, message }` 를 운반합니다 — SPA 는 기존 `/api/evaluate` 수동 프롬프트 카드와 동일한 방식으로 렌더링할 수 있습니다.
- **`HOST=0.0.0.0` 환경에서의 DoS 위험 해소**: 기존에는 `llmRateLimit` 이 분당 IP 당 10 요청으로 제한해도 공격자 10명 × 10 요청 = 분당 $50 의 Anthropic 비용 소진이 가능했습니다. 단락 처리는 레이트 리밋의 카운터가 실제 호출을 향해 감소하기 전에 발사됩니다.
- **테스트** — [`tests/auto-pipeline-manual-mode.test.mjs`](tests/auto-pipeline-manual-mode.test.mjs): 3개의 테스트가 (1) `mode: 'manual'` 이 2초 이내에 5개 step 키 전부와 함께 반환되는지, (2) `ANTHROPIC_API_KEY` 가 설정된 상태에서도 단락 처리가 여전히 발사되는지 (원래의 증상), (3) 레거시 `evalMode: 'manual'` 호출자가 계속 동작하는지를 확인합니다.

### 📝 G-012 — CHANGELOG 패리티 백필 (6 로케일 × 누락 릴리스 2건)

- **`docs(changelog): backfill v1.23.0, v1.24.0, v1.24.1, v1.25.0 in 6 lagging locales`** — v1.25 이전에는 EN 만 v1.23-v1.24 를 보유하고 있었으며, RU 는 릴리스 1개 뒤처져 있었고 나머지 6개는 릴리스 2개씩 뒤처져 있었습니다. v1.25 는 병렬 번역 에이전트를 디스패치 (v1.23 패턴을 재현) 하여 네 개의 항목을 모두 `CHANGELOG.{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md` 에 안착시킵니다. RU 는 v1.24.0 + v1.24.1 + v1.25.0 을 받습니다 (v1.23 사이클에서 이미 v1.23.0 을 받았기 때문입니다).
- **`feat(ci): scripts/check-changelog-parity.mjs gate`** — 어떤 로케일 CHANGELOG 의 최신 항목이 EN 정본보다 오래되면 빌드를 실패시킵니다. `npm run test:ci` 에 연결되었습니다. 사전에 존재했던 G-012 드리프트는 EN 경계를 넘는 순간 스스로 탐지되었을 것입니다.

### ✨ 외관 — 대시보드 이중 글리프 제거

- **`fix(dashboard): dedup ✨ glyph in auto-pipeline button label`** ([`public/js/lib/i18n-dict.js:219`](public/js/lib/i18n-dict.js#L219)) — `dash.autoPipeline` 이 모든 로케일 문자열에 선두 `✨` 를 포함하고 있었고, `public/js/views/dashboard.js:58` 의 뷰가 또 다른 `✨` 를 앞에 붙였습니다. 결과적으로 버튼이 `✨ ✨ Auto-pipeline …` 로 렌더링되었습니다. v1.25 는 모든 로케일의 DICT 항목에서 선두 글리프를 제거합니다; 뷰의 접두사가 단일 소스가 됩니다. 동일한 감사 패스로 나머지 i18n 번들도 훑었습니다 — 다른 이중 글리프 패턴은 발견되지 않았습니다.

### 🚫 향후 릴리스로 연기

- **G-005 — 정규 career-ops.org/docs 에 맞춘 A-G → A-F 보고서 블록 재정렬** — 부모 `santifer/career-ops` 프로젝트와 조율된 커밋이 필요합니다 (`modes/oferta.md` 를 재작성하여 A=Role, B=CV-match, C=Strategy, D=Comp, E=Personalization, F=STAR 를 방출 — C-Risks/G-Legitimacy 는 별도 블록에서 제거). v1.25.0 은 새 스키마에 대비한 web-ui 측을 출하합니다 (`reports.js` 는 v1.13 이후 임의 블록 문자를 이미 수용합니다). 부모와 자식이 함께 안착할 수 있는 다음 릴리스 윈도우에서 추적합니다.
- **G-003 — `README.cn.md` → `README.zh-CN.md` 이름 변경** — v1.25 준비 중 검증: 저장소에 이미 `README.zh-CN.md` 가 존재합니다 (워크트리 어디에도 고아 `README.cn.md` 가 없음). G-003 결과는 낡은 발견이었습니다.

### 🧪 테스트

- **477 → 480** 유닛 (PR-B `auto-pipeline-manual-mode.test.mjs` 에서 +3).
- 32/32 Playwright 동일.
- `npm run test:ci` 가 이제 `npm test` + `check-no-also-leftovers.mjs` + `check-changelog-parity.mjs` 를 실행합니다.

### 검증

```bash
$ npm run test:ci
# 480 / 480
# ✓ no .also( leftovers in views/
# ✓ CHANGELOG parity: all 8 locales at v1.25.0

# G-014 — manual mode returns < 2 s even with ANTHROPIC_API_KEY set:
$ ANTHROPIC_API_KEY=sk-ant-test PORT=4317 npm start &
$ sleep 3
$ time curl -sS -X POST -H 'Content-Type: application/json' \
    -d '{"url":"https://job-boards.greenhouse.io/anthropic/jobs/x","mode":"manual"}' \
    http://127.0.0.1:4317/api/auto-pipeline | head -20
# real  0m0.1xx s  (was 1-3 min)
# event: start … event: step (×5) … event: done {"mode":"manual","prompt":"…"}

# G-012 — every locale CHANGELOG carries the v1.25.0 entry:
$ grep -c '^## \[1.25.0\]' CHANGELOG*.md
# 8 files, each → 1

# Cosmetic — dashboard glyph:
$ grep "dash.autoPipeline" public/js/lib/i18n-dict.js
# No leading ✨ in any locale value (view supplies the single glyph)
```

### 비호환 변경

없습니다. `mode: 'manual'` 은 옵트인이며, 레거시 `evalMode: 'manual'` 호출자는 변경 없이 계속 동작합니다.

### 범위 외 (v1.26+)

| 항목 | 비고 |
|---|---|
| G-005 — A-F 보고서 블록 재정렬 | 부모와 조율된 커밋이 필요합니다 (`santifer/career-ops` 가 `modes/oferta.md` 를 재작성). |
| QA 시나리오 31 **시각적** 서브 테스트의 라이브 실행 | 브라우저 기반 에이전트가 필요합니다 (Claude Cowork). Playwright 스모크가 부분적으로 커버합니다. |
| `i18n-dict.js` 의 400 LOC 목표 초과 | 번역 fixture 이며 정책상 면제됩니다. 번들러 없는 분할은 HTTP 요청만 증가시킵니다. |

---

## [1.24.1] — 2026-05-14

**핫픽스: 8개 로케일 모두에서 `#/config` 충돌 (G-015).**

### 🚑 치명적 핫픽스

- **`fix(config): G-015 — replace removed Element.prototype.also call in config.js`** ([`public/js/views/config.js:371`](public/js/views/config.js#L371)) — v1.22.0 N-2 에서 `Element.prototype.also` 전역 멍키 패치를 제거하고 `cv.js` 를 자유 구문 (free-statement) 패턴으로 마이그레이션했으나 **`config.js` 를 누락했습니다**. 결과적으로 `#/config` 는 모든 로케일에서 첫 호출 시 `c(...).also is not a function` 으로 충돌했습니다. v1.24.1 은 `cv.js:188-201` 의 동일한 마이그레이션 패턴을 적용합니다 — 트리를 `const root = c(...)` 로 추출하고, 활성화 블록을 독립적으로 실행한 뒤 `return root;` 로 반환합니다.

### 🛡️ CI 게이트

- **`feat(ci): scripts/check-no-also-leftovers.mjs sweep`** — `public/js/views/` 아래 모든 파일을 순회하며 `.also(` 호출 지점이 있으면 빌드를 실패시킵니다 (주석 처리된 참조는 허용). 신규 `npm run test:ci` 스크립트에 연결되었습니다. 향후 멍키 패치 제거의 되돌림이 동일한 회귀를 조용히 재도입할 수 없습니다.

### 🧪 테스트

- **`test: tests/config-view-syntax.test.mjs`** — 세 개의 가드:
  - `node:vm.Script` 로 `config.js` 를 파싱 (Playwright 없이 구문 수준의 회귀 포착)
  - 주석 밖에서 `.also(` 가 살아남지 않는지 단언
  - `const root = c(...)` / `return root;` 마이그레이션 앵커가 존재하는지 단언
- **474 → 477** 유닛 (+3) + 32/32 Playwright 동일.

### 검증

```bash
$ npm run test:ci
# 477 / 477
# ✓ no .also( leftovers in views/

# Browser smoke:
$ open http://127.0.0.1:4317/#/config
# → renders normally, no "is not a function" card. Every locale equivalent.
```

### 범위 외 (v1.25 로 연기)

- G-014, G-012, G-005, G-003 — 묶음 처리에 대해서는 아래 v1.25.0 항목을 참조하십시오.

---

## [1.24.0] — 2026-05-14

**Help-bundle 콘텐츠 깊이 갱신 + QA 시나리오 31 라이브 실행 + RU CHANGELOG 전체 마무리.** v1.23.0 의 "Out of scope" 표에서 v1.24 로 연기되었던 두 항목을 모두 마무리합니다: 5개의 정규 career-ops.org/docs URL 에서 출발한 8개 help bundle 전체의 콘텐츠 깊이 갱신 (v1.11.x 이후 URL 커버리지만 보장되어 있었음) 과, 실행 중인 서버에 대한 QA 시나리오 31 의 라이브 실행 ("브라우저 에이전트 + LLM 자격 증명 필요" 로 분류되어 있었으나 6/6 서브 테스트 중 시각적 서브 테스트만 브라우저가 필요하고 나머지는 curl + grep 으로 도달 가능함이 밝혀짐).

### 📖 Help-bundle 콘텐츠 깊이 갱신

- **`docs(help): refresh en.md from 5 canonical career-ops.org/docs URLs`** ([`docs/help/en.md`](docs/help/en.md)) — v1.24 이전의 EN 번들은 1113 라인이었고 front-matter 에 5개의 정규 URL 을 나열했지만 본문에서 확장하지는 않았습니다. v1.24 는 5개 URL 을 WebFetch 로 가져와 대응되는 H2 섹션을 심화합니다:
  - **career-ops 소개 (front-matter)** — 원칙 (데이터 주권, AI 비종속, 사람 통제), "career-ops 가 아닌 것" 블록을 추가했고 개념 인벤토리를 6행에서 10행으로 확장했습니다 (Proof points, JD store, Interview-prep, Batch additions 추가).
  - **§5 Portals** — 정규 부트스트랩 `cp templates/portals.example.yml portals.yml` 을 추가했고, `tracked_companies` 항목별 필수 vs 선택 필드를 명확히 했습니다.
  - **§7 Scan** — Option A 에 "AI 토큰 소비 없음" 노트와 후속 명령 목록 (`apply` / `contacto` / `deep` / `tracker`) 을 추가했습니다.
  - **§14 지원 체크리스트** — SPA 체크리스트 모드 vs 수동-vs-Playwright 보조 vs 전체 CLI 흐름으로 분리했습니다 (`/career-ops apply <company>` 부터 `Evaluated → Applied` 자동 전이를 포함한 `Submitted.` 까지 정규 8단계 번호 매기기); batch evaluate 하위 섹션은 이제 TSV 스키마 테이블 + 4개 플래그 전체의 문서화 + `merge-tracker.mjs --dry-run` 을 포함합니다; Playwright 설정 하위 섹션은 설치 명령, MCP 등록, 대체 `.claude/settings.local.json`, 기본 헤드리스 노트를 나열합니다.
- **16개 H2 섹션 패리티 유지** (CI 테스트 `help-ui.test.mjs::section-parity` 가 8개 로케일 전체에서 정확히 16개의 H2 섹션을 단언합니다).
- **5개 정규 URL 각각이 번들에 ≥ 2회 등장** (CI 테스트 `canonical-docs-coverage.test.mjs` 가 강제합니다). v1.24 이후 URL 별 등장 횟수: `what-is-career-ops` × 4, `scan-job-portals` × 5, `apply-for-a-job` × 3, `batch-evaluate-offers` × 5, `set-up-playwright` × 3.
- **`docs(help): translate the v1.24 deepening to 7 non-EN locales`** — 7개의 병렬 번역 에이전트를 디스패치했습니다. 각 대상 로케일 (es / pt-BR / ko-KR / ja / ru / zh-CN / zh-TW) 은 EN 구조를 섹션 단위로 미러링하고, 코드 블록 / URL / 파일 경로 / 버튼 레이블 (📁 Upload CV / 🌐 Scan now / ▶ Evaluate / 📄 Generate PDF / 💾 Save) 과 영어 약어 (CSP, SSRF, TOCTOU, WCAG, ATS, JD, SSE, REST, API) 를 그대로 보존하며, 심화 부분을 대상 언어로 출판 등급 기술 문서 스타일로 번역한 새 번들을 받습니다.

### 🧪 QA 시나리오 31 — 라이브 실행 (6/6 PASS)

- **`docs(qa): append last-verified live-execution log to qa/claude-cowork-browser-test-prompt.md`** — v1.24 이전의 시나리오 31 은 문서화되어 있었으나 실제 서버에 대해 실행된 적이 없었습니다 ("브라우저 에이전트 + LLM 자격 증명 필요" 로 연기). v1.24 는 6개의 서브 테스트를 모두 `http://127.0.0.1:4317` 에 대해 실행했습니다:

  | 서브 | 설명 | 상태 |
  |---|---|---|
  | 31.1 | help bundle 의 점수 임계값 | ✅ PASS (`docs/help/en.md` 에서 4.5 × 3, 4.0 × 9, 3.5 × 6 회 언급) |
  | 31.2 | 스캔 워크플로 엔드포인트 | ✅ PASS (`/api/stream/scan-{en,ru}` + `/api/scan-ru/config` → 404; `/api/scan/regional/config` → 200) |
  | 31.3 | `/api/apply-helper` 체크리스트 | ✅ PASS (본문에 `career-ops apply` + `auto-submit` 경고 포함) |
  | 31.4 | `/api/batch` 엔드포인트 | ✅ PASS (키: `[exists, runnerExists, raw, rows, additions]`) |
  | 31.5 | Playwright 가용성 | ✅ PASS (`/api/health` 가 `Playwright (parent node_modules) ok: true, value: installed` 보고) |
  | 31.6 | help bundle URL 커버리지 (5 URLs × 8 로케일) | ✅ PASS (**40 / 40 ✓**) |

  시각 전용 서브 테스트 (브라우저 필요) 는 QA 프롬프트에 별도 플래그로 표시되었습니다 — Claude Cowork 또는 `npm run test:e2e:browser` 로 여전히 실행 가능합니다.

### 🌐 RU CHANGELOG 전체 마무리 (M-9 후속)

- **`docs(translate): CHANGELOG.ru.md retry agent — full body translation`** ([`CHANGELOG.ru.md`](CHANGELOG.ru.md)) — v1.23.0 릴리스는 RU CHANGELOG 재시도 에이전트가 아직 진행 중인 상태에서 출하되었습니다 (소켓 오류로 한 번 충돌한 뒤 재디스패치됨). v1.24 는 에이전트의 1542 라인 전체 번역을 수령합니다: v1.23.0 → v1.6.0 의 모든 항목이 출판 등급의 러시아어 본문을 갖게 되었고, 영어 본문 임시 대체는 더 이상 존재하지 않습니다. 스타일 규율은 v1.22.0 의 README 품질 갱신과 일치합니다: "функциональность" / "возможности" / "поведение" 가 어색한 "функционал" 을 대체했으며, "через" / "с помощью" 가 "при помощи" 를 대체했고, 능동태가 수동태보다 선호되며, "эндпоинт", "лимит запросов", "состояние гонки", "санитайзинг" 이 정규 용어이고, 영어 약어 (TOCTOU, CSP, SSRF, WCAG, ATS, JD, SSE, REST, API) 는 보존되었습니다.

### 🧪 테스트

- **474 / 474** 유닛 + 20 / 20 스모크 E2E + 32 / 32 Playwright. 동작상 테스트 변경 0건; 모든 help bundle CI 단언 (16개 H2 섹션 × 8개 로케일, 5개 URL × ≥ 2회 등장, 콘텐츠 하한선) 이 여전히 통과합니다.

### 검증

```bash
$ npm test                            # 474 / 474

# Help-bundle deepening:
$ wc -l docs/help/en.md
# ~1270 lines (was 1113 — deepened, not bloated)

$ for url in what-is-career-ops scan-job-portals apply-for-a-job \
             batch-evaluate-offers set-up-playwright; do
    echo -n "$url: "
    grep -c "$url" docs/help/en.md
  done
# what-is-career-ops: 4
# scan-job-portals: 5
# apply-for-a-job: 3
# batch-evaluate-offers: 5
# set-up-playwright: 3

# Scenario 31.6 — 40/40 URL coverage:
$ for lang in en es pt-BR ko ja ru zh-CN zh-TW; do
    echo -n "$lang: "
    for url in what-is-career-ops scan-job-portals apply-for-a-job \
               batch-evaluate-offers set-up-playwright; do
      curl -sS "http://127.0.0.1:4317/api/help/$lang" \
        | python3 -c "import sys,json; print(json.load(sys.stdin).get('markdown',''))" \
        | grep -q "$url" && echo -n "✓ " || echo -n "✗ "
    done
    echo
  done
```

### 비호환 변경

없습니다.

### 범위 외 (v1.25+)

| 항목 | 비고 |
|---|---|
| 시나리오 31 **시각적** 서브 테스트의 라이브 실행 | 브라우저 기반 에이전트가 필요합니다 (Claude Cowork 또는 `npm run test:e2e:browser`). curl 만으로는 범위 밖이며 기존 Playwright 스모크가 커버합니다. |
| RU CHANGELOG **구버전 항목 (v1.5.x 이하) 의 본문 번역** | 재시도 에이전트는 v1.6.0 이상만 다뤘습니다. v1.6 이전 항목 (`v1.5.x` 등) — 만약 존재한 적이 있다면 — 은 사전 콘텐츠로 남습니다. |
| 향후 SPA 변경 후 대시보드 스크린샷의 시각적 회귀 | `scripts/capture-dashboard-screenshots.mjs` 가 로케일별 PNG 를 재생성합니다; 현재 자동 diff 는 없습니다. |

---

## [1.23.0] — 2026-05-14

**i18n 분할 + 연결 배너 CI 수정 + 로케일별 대시보드 스크린샷 + 모든 백로그 임시 대체 마무리.** v1.22.0 의 "Out of scope" 표에서 v1.23 으로 표시되었던 세 항목 (M-9 로케일 CHANGELOG 본문, N-1 `i18n.js` LOC 분할, help bundle 콘텐츠 감사) 과, v1.22.0 이후 메인 브랜치 CI 를 적색으로 바꾼 스모크 E2E 테스트의 핫픽스를 함께 출하합니다.

### 🚑 CI 핫픽스 — 연결 배너 복구

- **`fix(client): reset health-poll cadence + visibilitychange eager re-check`** ([`public/js/api.js:21-91`](public/js/api.js#L21-L91)) — v1.22.0 의 M-6 지수 백오프 (3초 → 6초 → 12초 → 캡 15초, 원래 캡 60초에서 감소) 는 올바른 방향이었으나, 진행 중인 `setTimeout` 이 이전에 설정된 어떤 지연 값에 고정되어 있었습니다. t=0.1 에 죽은 서버에 대해 t=3 에서 첫 핑이 실패하면 지연이 6초로 두 배가 되고, 다음 복구 프로브는 t=9 까지 발사되지 않았습니다. 스모크 E2E 의 "Flow 2a: 서버 다운 시 연결 배너 표시, 복구 시 숨김" 은 4초만 대기했고 `main` 에서 적색이 되었습니다.

    v1.23.0 은 폴링 루프를 재구성합니다:

    - `_healthHandle` 을 추적하여 `setConnectionState(lost=true)` 가 `clearTimeout` 하고 `_HEALTH_MIN` 으로 재스케줄할 수 있습니다. 다운 후 첫 복구 프로브가 이전에 큐에 있던 지연과 무관하게 3초 이내에 발사됩니다.
    - `_HEALTH_MAX` 가 60초에서 15초로 낮아졌습니다. 죽은 서버에 대해 백그라운드 탭이 되어 있어도 사용자가 돌아왔을 때 한 번의 폴링 사이클 내에서 복구되며, 대역폭 절감은 여전히 상당합니다.
    - `document.addEventListener('visibilitychange')` 가 탭이 포커스를 되찾고 `connectionLost === true` 일 때 즉시 재확인합니다 — Cmd-Tab 복귀가 다음 백오프 틱을 기다리지 않습니다.

### 🧹 N-1 — i18n.js 분할 (400 LOC 목표 초과)

- **`refactor(client): split DICT into i18n-dict.js (data) + i18n.js (logic)`** — v1.23 이전의 `public/js/lib/i18n.js` 는 639 LOC 였습니다. 대부분 (23-586 라인) 이 `DICT` 번역 테이블 — 순수 구조화 데이터였습니다. v1.23.0 은 이를 [`public/js/lib/i18n-dict.js`](public/js/lib/i18n-dict.js) (578 LOC, CLAUDE.md 의 "Exempt from these limits: generated files, migrations, test fixtures, lock files, vendored code" 에 따라 LOC 규칙 면제 — 번역 테이블은 fixture 로 분류) 로 추출하고, [`public/js/lib/i18n.js`](public/js/lib/i18n.js) 는 순수 모듈 로직 86 LOC (400 LOC 목표를 한참 밑돔) 로 남깁니다.
- **로더 계약:** `i18n-dict.js` 가 `window.__I18N_DICT = { … }` 를 채우고, `i18n.js` 가 기존 IIFE 내부에서 이를 읽습니다. [`public/index.html`](public/index.html) 이 순서대로 로드합니다 — `i18n.js` 이전에 `i18n-dict.js` 가 — 그래서 IIFE 가 생성 시점에 완전히 채워진 DICT 를 봅니다. 누락된 dict 폴백: 모든 `t()` 호출은 인라인 폴백 또는 키 자체를 반환하므로 SPA 가 충돌하지 않고 잘못된 설정을 큰 소리로 드러냅니다.
- **테스트 배선 갱신:** [`tests/i18n-coverage.test.mjs`](tests/i18n-coverage.test.mjs), [`tests/help-ui.test.mjs`](tests/help-ui.test.mjs), [`tests/canonical-docs-coverage.test.mjs`](tests/canonical-docs-coverage.test.mjs) 가 이제 두 파일을 테스트 VM 컨텍스트에서 모두 실행하거나 (정규표현식 스윕을 위해) 소스를 연결하여 모든 기존 단언을 보존합니다.

### 🌐 M-9 — 로케일 CHANGELOG 본문 번역

- **`docs(translate): 7 non-EN CHANGELOG files end-to-end`** — v1.23 이전의 `CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md` 는 v1.13.0 이후의 모든 항목에 영어 본문 임시 대체 노트를 담고 있었고, EN 정본을 가리키는 푸터를 가지고 있었습니다. v1.23.0 은 로케일당 1개씩 7개의 병렬 번역 에이전트를 디스패치하여 모든 본문을 대상 언어의 출판 등급 기술 문체로 다시 씁니다. 임시 대체 노트가 제거되었습니다. 모든 로케일에서 코드 블록, 파일 경로, URL, 커밋 메시지 스타일 문자열 (`fix(security): B-1 — …`), 환경 변수, 링크 레이블은 그대로 보존됩니다.

### 🖼️ 모든 README 의 로케일별 대시보드 스크린샷

- **`docs(readme): wire each locale README at its locale-specific PNG`** — v1.23 이전에는 `README.pt-BR.md` 만 `dashboard-pt-BR.png` 를 참조했고, 나머지 6개 비영어 README 는 여전히 `dashboard-en.png` 를 가리켰습니다. 스크린샷 자체는 v1.22.0 사이클에서 [`scripts/capture-dashboard-screenshots.mjs`](scripts/capture-dashboard-screenshots.mjs) 로 이미 캡처되어 `images/` 에 있었지만 사용되지 않았습니다. v1.23.0 은 모든 `README.{es,ja,ko-KR,ru,zh-CN,zh-TW}.md` 의 14번 라인을 자체 `dashboard-<locale>.png` 로 갱신합니다.

### 🧪 테스트

- v1.22.0 과 동일한 474 / 474 유닛 + 32 / 32 Playwright. **스모크 E2E 가 이제 20 / 20** (v1.22.0 이후 `main` 에서는 배너 복구 회귀로 19 / 1 실패였음; v1.23.0 의 재스케줄 수정이 이를 마무리합니다).
- 3개의 기존 테스트가 i18n 분할을 처리하도록 재배선되었습니다. 신규 테스트 파일 0건; 삭제된 단언 0건.

### 검증

```bash
$ npm test
# 474 / 474

$ npm run test:e2e
# passed: 20    failed: 0    (was 19/1 on v1.22.0 main)

$ wc -l public/js/lib/i18n.js public/js/lib/i18n-dict.js
#       86 public/js/lib/i18n.js          ← logic, under target
#      578 public/js/lib/i18n-dict.js     ← data fixture, exempt

$ grep -h 'dashboard-' README*.md | sed -E 's/.*(dashboard-[^)]+).*/\1/' | sort -u
# dashboard-en.png    (README.md only)
# dashboard-es.png    dashboard-ja.png
# dashboard-ko-KR.png dashboard-pt-BR.png
# dashboard-ru.png    dashboard-zh-CN.png  dashboard-zh-TW.png

# CHANGELOG translation sanity: each locale file > 200 lines of native content
$ wc -l CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md | grep -v total
```

### 비호환 변경

없습니다. `public/index.html` 이 이전에는 한 개를 로드하던 곳에서 이제 두 개의 스크립트를 로드합니다 — CDN 에서 SPA 를 서빙하는 사용자는 `i18n-dict.js` 도 함께 가져가야 합니다; 스크립트 로드 순서는 `index.html` 의 `<script src>` 태그 순서로 강제됩니다. 런타임 폴백 (빈 DICT → `t()` 가 인라인 EN 폴백을 반환) 이 새 파일 누락 시 하드 크래시를 방지합니다.

### 범위 외 (v1.24+)

| 항목 | 비고 |
|---|---|
| career-ops.org/docs 로부터의 Help-bundle 콘텐츠 깊이 갱신 (URL 커버리지 대비) | 5개의 정규 URL 은 v1.11.x 이후 모든 로케일의 help bundle 에 이미 등장하며 QA 프롬프트의 시나리오 31.6 이 커버리지를 검증합니다. 콘텐츠 본문 깊이 갱신은 v1.24+ 후보입니다. |
| 실행 중인 서버에 대한 QA 시나리오 31 의 라이브 실행 | 브라우저 에이전트 + 라이브 LLM 자격 증명이 필요합니다. v1.24 후보. |
| 신규 mode-page 힌트 단락에 대한 컴포넌트별 터치 타깃 스윕 | v1.22.0 M-1 이 추가한 `<p class="field-hint">` 요소가 8개 로케일 전체에서 WCAG 2.5.5 최소 높이에 대해 검증되지 않았습니다. |

---

## [1.22.0] — 2026-05-14

**M/L/N 백로그 일괄 처리 + 문서 정합성 + 번역 품질 패스.** `v1.20.1-BACKLOG.md` 의 medium 이하 등급 전체를 한 릴리스로 정리했습니다. M 항목 9개, L 항목 5개, 자잘한 nit 2개. 더하여 5개의 정규 [career-ops.org/docs](https://career-ops.org/docs) 가이드에 대한 문서 정합성 감사, `.claude/` 및 `.github/` 하위 시스템 프롬프트 갱신, 7개 비영어 로케일 README 품질 재정비를 포함합니다.

### 🛡️ 보안 강화 (심층 방어)

- **`fix(security): M-4 — entity-aware stripDangerousMarkdown`** ([`server/lib/security.mjs`](server/lib/security.mjs)) — v1.22 이전의 정규표현식은 `<script>`, `javascript:`, `on*=` 를 문자 그대로의 부분 문자열로만 매칭했습니다. `&lt;script&gt;`, `java&#115;cript:`, `<img src="data:image/svg+xml,<svg onload=…>">` 같은 입력이 그대로 통과했습니다. 정화 (sanitization) 로직은 이제 strip 정규표현식이 실행되기 **이전에** `&lt;`, `&gt;`, `&amp;`, `&quot;`, 숫자 (`&#NN;`) 및 16진 (`&#xHH;`) 엔터티를 디코딩합니다. [`tests/cv-xss-bypasses.test.mjs`](tests/cv-xss-bypasses.test.mjs) 의 11개 테스트로 검증했습니다. 실질적인 방어는 여전히 클라이언트의 escape-first 파이프라인 `UI.md` 가 담당하며, 이 변경은 저장된 파일 자체를 견고하게 만듭니다.

- **`fix(security): L-2 — bash --noprofile --norc on the batch runner`** ([`server/lib/routes/batch.mjs:108`](server/lib/routes/batch.mjs#L108)) — `spawn('bash', [PATHS.batchRunner, ...])` 가 사용자 `~/.bashrc` 를 상속받았습니다. 악성 rc 파일이 실행에 영향을 미칠 수 있었습니다. 이제 `spawn('bash', ['--noprofile', '--norc', PATHS.batchRunner, ...])` 형태로 호출합니다.

### 🔒 복원력

- **`fix(client): M-6 — exponential backoff on health ping`** ([`public/js/api.js:22-48`](public/js/api.js#L22-L48)) — 연결이 끊긴 상태의 폴러가 다운된 서버에 야간 동안 28,800회의 fetch 를 발사했습니다. 이제 3초 → 6초 → 12초 → 24초 → 60초로 백오프하며, 첫 2xx 복구 시 3초로 리셋됩니다. 각 단계가 새 지연 값을 반영하도록 `setInterval` 이 아닌 `setTimeout` 체인으로 구성했습니다.

- **`fix(client): M-5 — Safari private-mode localStorage guard`** ([`public/js/lib/i18n.js:572-583`](public/js/lib/i18n.js#L572-L583)) — Safari 사생활 보호 모드는 모든 `localStorage.getItem/setItem` 호출에서 `SecurityError` 를 던집니다. 로드 중 실행되는 IIFE 가 i18n 모듈 전체를 실패시켜 SPA 가 키 원문을 그대로 렌더링했습니다. 두 호출을 모두 try/catch 로 감싸고 `detect()` 의 브라우저 언어 폴백을 사용하도록 변경했습니다.

- **`fix(server): M-2 — body-size cap on outbound preview fetches (test + verify)`** — v1.21.0 의 `safeGet` 은 이미 청크 단위로 스트리밍하고 `opts.maxBytes` 에서 자르도록 구현되어 있었습니다. v1.22 는 [`tests/ssrf-redirect-rebind.test.mjs`](tests/ssrf-redirect-rebind.test.mjs) 에 명시적 회귀 테스트를 추가하여 계약을 고정합니다: 100 KB 업스트림 + 4 KB 캡 → 응답 ≤ 4 KB.

- **`fix(client): L-5 — clear setTimeout on hashchange in scan.js`** ([`public/js/views/scan.js:6-22, :113-120`](public/js/views/scan.js#L6-L22)) — 스캔 완료 후 300 ms `refreshResults()` 타이머가 사용자가 그 시간 안에 `#/scan` 에서 벗어날 경우 누수되었습니다. 핸들을 캡처하여 `__cancelActiveScanPoll` 에서 해제합니다.

- **`fix(client): L-4 — multi-line SSE data: joiner`** ([`public/js/lib/auto-pipeline.js:158-176`](public/js/lib/auto-pipeline.js#L158-L176)) — SSE 파서가 `match()` (단일 라인)를 사용했습니다. 명세에 따르면 한 이벤트는 여러 `data:` 라인을 가질 수 있고 컨슈머가 `\n` 으로 결합해야 합니다. 서버는 현재 단일 라인 JSON 만 보내므로 기존 코드도 동작했으나, 향후 멀티라인 페이로드에 취약했습니다.

### ♿ 접근성

- **`feat(a11y): M-3 — WCAG 1.4.1 redundant cues on score pills + connection banner`** ([`public/css/app.css:602-625, :812-822`](public/css/app.css#L602-L625)) — score-high / score-mid / score-low 가 색상만으로 상태를 전달했습니다 (빨강/주황/녹색). 색상을 인지하지 못하는 사용자는 폴백이 없었습니다. 각 등급에 `::before` 를 통한 중복 글리프 (✓ / ◐ / ○) 를 추가했습니다. 연결 배너는 오프라인 상태에서 선두에 `⚠` 글리프를 가집니다. 렌더링 지점은 손대지 않았고 순수 CSS 강화입니다.

- **`feat(a11y): M-1 — inline hint paragraphs for every mode-page field`** ([`public/js/views/mode-page.js`](public/js/views/mode-page.js), [`public/js/lib/i18n.js`](public/js/lib/i18n.js)) — v1.20.0 은 모든 mode-page 필드에 `htmlFor → id` 를 연결했으나 인라인 힌트 문구는 가져오지 못했습니다. 필드 의도를 문서화한 곳은 README 워크스루뿐이었습니다. v1.22.0 은 힌트 i18n 키 19개 × 8 로케일 = **신규 번역 152개** 를 추가하며, `field()` 빌더는 이제 필드별로 `aria-describedby` 가 연결된 `<p id="…-hint">` 를 렌더링합니다. 스크린 리더 사용자는 입력에 포커스가 갈 때 힌트를 듣습니다.

- **`fix(a11y): M-7 — null-guard on UI.el() htmlFor alias`** ([`public/js/api.js:194-198`](public/js/api.js#L194-L198)) — `htmlFor: null` 이 문자 그대로의 `for="null"` 로 렌더링되었습니다. 폴스루 분기의 `v != null && v !== false` 가드를 한 줄로 미러링했습니다.

### 🧹 품질 / 이식성

- **`fix(server): L-1 — parseInt radix in health.mjs + bin/start.sh + bin/setup.sh`** — `parseInt(process.versions.node)` 의 radix 누락은 린트 경고를 유발하며 Node 가 16진 버전을 사용하기 시작할 경우 취약합니다. 모든 곳에 `10` 을 추가했습니다.

- **`fix(server): L-3 — Windows-safe entrypoint check`** ([`server/index.mjs:159-163`](server/index.mjs#L159-L163)) — `import.meta.url === \`file://${process.argv[1]}\`` 는 Windows 의 드라이브 문자와 백슬래시를 잘못 처리합니다. `fileURLToPath(import.meta.url) === path.resolve(process.argv[1])` 로 교체했습니다.

- **`refactor(client): N-2 — drop Element.prototype.also monkey-patch`** ([`public/js/views/cv.js:188-201`](public/js/views/cv.js#L188-L201)) — 전역 DOM 프로토타입 오염이었습니다. 트리 루트를 위한 로컬 변수로 대체했습니다.

- **`test(canary): M-8 — 404 regression test for retired /api/scan-ru/config`** ([`tests/scan-consolidated.test.mjs`](tests/scan-consolidated.test.mjs)) — v1.20.0 이 별칭을 폐기했으나 카나리아를 추가하지 않았습니다. v1.18 의 폐기 테스트를 미러링하는 3줄 추가입니다.

### 📚 문서 + 시스템 프롬프트

- **`docs(architecture): refresh OVERVIEW + DATA-FLOWS for v1.21+ surface`** — OVERVIEW.md 에 `safe-fetch.mjs` (DNS-pinned GET), `file-lock.mjs` (경로별 뮤텍스), `rate-limit.mjs` (LLM 요청 빈도 제한), `sanitizePathName` 을 추가했습니다. DATA-FLOWS.md 에 두 개의 새 섹션을 추가했습니다: "Outbound URL fetches (DNS-rebind-safe)" 와 "LLM endpoint rate-limiting".

- **`docs(readme): security envelope section refresh`** — README.md 의 "Security notes" 가 이제 v1.21+ 보안 영역의 모든 헬퍼를 문서화합니다 (sanitizePathName, safeGet, withFileLock, llmRateLimit, 엔터티 인식 stripDangerousMarkdown).

- **`docs(qa): scenario 31 — career-ops.org/docs alignment`** ([`qa/claude-cowork-browser-test-prompt.md`](qa/claude-cowork-browser-test-prompt.md)) — 5개의 정규 career-ops.org/docs 가이드에 기술된 동작과 UI 가 일치하는지 검증하는 6개의 신규 서브 테스트 (31.1–31.6) 를 추가했습니다: 점수 임계값, 스캔 워크플로 (단일 버튼), 지원 워크플로 (체크리스트, 자동 제출 아님), 배치 워크플로 (TSV 편집기), Playwright 설정 (graceful 실패), help-bundle 커버리지 (5 URLs × 8 로케일).

- **`docs(translate): README quality refresh × 7 non-EN locales`** — 모든 비영어 README 가 해당 모국어로 출판 등급의 기술 문서 스타일로 재작성되었습니다. 흔한 어색한 직역을 교체했고, v1.21/v1.22 보안 영역 언급을 추가했으며, 릴리스/테스트 배지를 갱신했습니다.

- **`docs(system): .claude/PROJECT-CONTEXT.md + .github/copilot-instructions.md`** — 세션에 합류하는 에이전트를 위한 단일 파일 오리엔테이션입니다. CLAUDE.md 를 압축했고, v1.21+ 헬퍼의 이름을 명시하며, 흔한 함정을 나열합니다.

- **`docs(bin): actualize start.sh / setup.sh / run_all.sh comments`** — "two deps" → "three deps" (express + js-yaml + multer); "298 tests" → "474+ tests"; `parseInt` radix 추가.

### 🧪 테스트

- **461 → 474 유닛** (+13) + 32/32 Playwright 동일.
- 신규 테스트 파일: `cv-xss-bypasses.test.mjs` (M-4, 11 tests).
- 확장: `ssrf-redirect-rebind.test.mjs` (M-2 body cap 용 +1), `scan-consolidated.test.mjs` (M-8 별칭 카나리아 용 +1).
- 기존 스위트에 동작상 테스트 변경이 없습니다 — 모든 수정은 가산적이거나 신규 카나리아로 보호됩니다.

### 검증

```bash
npm test                          # 474 / 474
npm run test:e2e:browser          # 32 / 32

# Entity-encoded XSS strip:
node -e "import('./server/lib/security.mjs').then(({stripDangerousMarkdown}) => console.log(stripDangerousMarkdown('&lt;script&gt;alert(1)&lt;/script&gt;')))"
# → '' (no <script> survives)

# Health-ping backoff (open devtools, kill server, watch network panel):
#   3 s → 6 s → 12 s → 24 s → 60 s, then resets on first successful ping

# Score-pill glyph (open #/reports in light + dark theme):
#   .score-high shows ✓ + numeric score
#   .score-mid  shows ◐ + numeric score
#   .score-low  shows ○ + numeric score

# Mode-page hints (#/contacto, etc):
#   <input aria-describedby="mode-contacto-recipient-hint">  ← targets <p id="…">

# Retired alias:
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4317/api/scan-ru/config
# → 404
```

### Breaking changes

없습니다. 모든 수정은 가산적이거나 기존 엔드포인트 계약을 유지합니다.

### Out of scope (v1.23+)

| 항목 | 비고 |
|---|---|
| M-9 — 로케일 CHANGELOG 본문 번역 | 모든 `CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md` v1.13+ 항목이 영어 본문 임시 대체였습니다. 릴리스 주기가 안정되면 일괄 번역 후보입니다. |
| N-1 — `public/js/lib/i18n.js` 가 400 LOC 목표를 초과 | 로케일별 분할은 번들러 없이는 HTTP 비용을 증가시킵니다. 빌드 단계 결정이 내려질 때까지 연기합니다. |
| career-ops.org/docs 의 Help-bundle 콘텐츠 갱신 | 5개의 정규 URL 은 이미 모든 로케일의 help bundle (v1.11.x 이후) 에 등장합니다. QA 프롬프트의 시나리오 31.6 이 커버리지를 검증합니다. 콘텐츠 깊이 갱신은 v1.23 후보입니다. |

---

## [1.21.0] — 2026-05-14

**두 번의 독립적 코드 리뷰 패스에서 도출된 보안 + 동시성 + 접근성 폴리시.** [`docs/specs/V1.20.1-BACKLOG.md`](docs/specs/V1.20.1-BACKLOG.md) 의 7개 결과를 한 릴리스에 출하했습니다: 블로커 1건 (DNS-rebind TOCTOU), 고위험 버그 6건 (경로 탐색 정화 (sanitization) 분산, LAN 배포에서의 레이트 리밋 공백, 동시 쓰기 경쟁 상태 (race condition), i18n 커버리지 누락, 매달린 aria-describedby, 누락된 label 연결). 신규 테스트 34개; 기준선이 427 → 461 유닛 + 32/32 Playwright 로 상승했습니다. 모든 수정은 명명된 회귀 테스트 뒤에 배치됩니다.

### 🛡️ 보안

- **`fix(security): B-1 — close DNS-rebind TOCTOU via safe-fetch.mjs`** ([`server/lib/safe-fetch.mjs`](server/lib/safe-fetch.mjs)) — 이전 패턴은 검증을 위해 명시적 `dnsLookup` 을 한 번 수행한 뒤 `fetch()` 가 독립적인 조회를 다시 하도록 두었습니다. TTL=0 의 DNS rebind 공격자는 첫 조회에서 공인 IP 를, 두 번째 조회에서 `127.0.0.1` / `169.254.169.254` / LAN 주소를 반환하여 `isPrivateOrLoopbackHost` 를 우회할 수 있었습니다. 신규 `safeGet` 은 호스트를 **한 번만** 해석하고, node:http(s) 를 통해 TCP 연결을 정확히 그 IP 에 고정하며, 인증서 검증이 여전히 원본 호스트네임을 대상으로 하도록 SNI/Host 를 설정합니다. `/api/pipeline/preview` 와 `/api/auto-pipeline` 이 사용합니다. 조회 오류 시 fail-CLOSED (이전의 `try { … } catch { /* fall through */ }` 를 뒤집음). [`tests/ssrf-redirect-rebind.test.mjs`](tests/ssrf-redirect-rebind.test.mjs) 의 신규 테스트 8개로 검증했습니다.

- **`fix(security): H-4 — consolidate sanitizePathName across 10 routes`** ([`server/lib/security.mjs`](server/lib/security.mjs)) — 단순 `replace(/[^\w\-.]/g, '')` 정규표현식이 `jds.mjs`, `content.mjs`, `reports.mjs`, `llm.mjs`, `runners.mjs` 에 중복되어 있었고 `.` 문자를 유지해 `..pdf`, `....md`, 선행 점 이름이 살아남았습니다. `reports.mjs::sanitizeSlug` 만이 올바르게 처리했습니다. v1.21.0 은 올바른 버전 (`sanitizePathName`) 을 `security.mjs` 로 끌어올리고 10개의 잘못된 사본을 삭제했으며 빈 결과는 400 으로 거부합니다. [`tests/path-traversal.test.mjs`](tests/path-traversal.test.mjs) 의 12개 테스트로 검증했습니다.

- **`fix(security): H-5 — rate-limit LLM endpoints on public bind`** ([`server/lib/rate-limit.mjs`](server/lib/rate-limit.mjs)) — `/api/evaluate`, `/api/deep`, `/api/mode/:slug`, `/api/auto-pipeline` 에 IP 별 요청 빈도 제한이 없었습니다. 루프백 사용자는 영향이 없으며, LAN 으로 노출된 배포 (`HOST=0.0.0.0`) 는 분당 IP 당 10 요청을 받고 초과 시 `Retry-After` 및 `X-RateLimit-*` 헤더가 부착됩니다. `LLM_RATE_LIMIT="N/Ws"` 로 설정 가능합니다. v2.0 P-12 인증 게이트 이전의 저비용 중간 방어책입니다. [`tests/rate-limit.test.mjs`](tests/rate-limit.test.mjs) 의 6개 테스트로 검증했습니다.

### 🔒 동시성

- **`fix(data): H-6 — per-file mutex on applications.md / pipeline.md`** ([`server/lib/file-lock.mjs`](server/lib/file-lock.mjs)) — 동시 `POST /api/tracker` (또는 auto-pipeline 과 수동 추가의 경쟁 상태 (race condition)) 가 둘 다 `num=42` 를 읽고 둘 다 `num=43` 을 써서 앞선 행을 조용히 누락시켰습니다. `withFileLock(path, fn)` 은 경로별로 read-modify-write 를 직렬화합니다; 독립적 경로는 여전히 병렬로 실행됩니다. `tracker.mjs`, `pipeline.mjs` (POST + DELETE), `auto-pipeline.mjs` 의 tracker 단계에 연결되어 있습니다. [`tests/concurrent-tracker-write.test.mjs`](tests/concurrent-tracker-write.test.mjs) 의 5개 테스트로 검증했으며, 20개 동시 POST 가 001..020 까지 순차적으로 저장되는지 확인하는 통합 테스트가 포함됩니다.

### ♿ 접근성

- **`fix(a11y): H-1 — id="batch-tsv-hint" on the batch.js hint paragraph`** ([`public/js/views/batch.js`](public/js/views/batch.js)) — v1.20.0 이 TSV 텍스트영역에 `aria-describedby="batch-tsv-hint"` 를 추가했으나 힌트 `<p>` 에 해당 `id` 를 부여하지 않았습니다. 스크린 리더가 발화할 대상이 없었습니다. 수정했습니다.

- **`fix(a11y): H-2 — htmlFor on batch-parallel / batch-min-score labels`** ([`public/js/views/batch.js`](public/js/views/batch.js)) — v1.20.0 의 입력 4개가 새 id 를 받았지만 라벨이 프로그래밍적으로 연결되지 않았습니다. 이제 WCAG 3.3.2 를 충족합니다.

- [`tests/a11y-form-wires.test.mjs`](tests/a11y-form-wires.test.mjs) 의 신규 정적 분석 카나리아 — 모든 뷰 파일을 순회하며 모든 `aria-describedby` / `htmlFor` IDREF 가 형제 `id:` 선언을 가리키는지 단언합니다. 오타성 회귀를 CI 시점에 잡습니다.

### 🌐 i18n

- **`fix(i18n): H-3 — 13 keys from v1.20.0 silently fell through to EN for 7 locales`** ([`public/js/lib/i18n.js`](public/js/lib/i18n.js)) — `pipe.filter`, `pipe.count`, `pipe.preview*`, `pipe.openTab`, `pipe.evaluateAll*`, `eval.jdHint`, `batch.parallelAria`, `batch.minScoreAria`, 그리고 `common.delete`, `config.group{Core,Runtime,Regional}`, `config.profileEmpty`, `config.viewProfile`, `scan.atsBadge`, `scan.regionalBadge` 가 `t('key', 'EN fallback')` 를 통해 참조되었으나 DICT 에는 결코 추가되지 않았습니다. 러시아어, 일본어, 중국어 스크린 리더 사용자는 영어 `aria-label` 을 듣게 되어, v1.20.0 이 주장한 WCAG 3.3.2 성과를 직접적으로 무효화했습니다. v1.21.0 은 19개 키 × 8 로케일 (≈ 신규 번역 150개) 을 모두 추가하고 [`tests/i18n-coverage.test.mjs`](tests/i18n-coverage.test.mjs) 를 확장하여 `public/js/**/*.js` 의 모든 `t('key', …)` 호출을 스캔하고 각 키가 DICT 에 존재하는지 단언하는 정적 분석 패스를 포함합니다. 향후 표류는 CI 시점에 잡힙니다.

### 🧪 테스트

- **427 → 461 유닛** (+34) + 32/32 Playwright 동일.
- 신규 테스트 파일: `ssrf-redirect-rebind`, `path-traversal`, `concurrent-tracker-write`, `rate-limit`, `a11y-form-wires`.
- 기존 `pipeline-preview.test.mjs` 는 `globalThis.fetch` 목에서 `safe-fetch.mjs` 의 신규 `_setTransport` 주입 지점으로 재배선되었습니다 — SSRF 경로가 더 이상 fetch 를 통과하지 않으므로 옛 목이 조용히 우회되었습니다.

### 검증

```bash
npm test                              # 461 / 461
npm run test:e2e:browser              # 32 / 32
node --test tests/ssrf-redirect-rebind.test.mjs tests/path-traversal.test.mjs \
  tests/concurrent-tracker-write.test.mjs tests/rate-limit.test.mjs \
  tests/a11y-form-wires.test.mjs      # 34 new tests, all green

# Path-traversal: every traversal-style :name returns 400 / 404
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4317/api/jds/..pdf
# → 400

# Rate-limit on public bind:
HOST=0.0.0.0 LLM_RATE_LIMIT=3/60s npm start &
for i in 1 2 3 4; do
  curl -sS -o /dev/null -w '%{http_code} ' -X POST -H 'Content-Type: application/json' \
    -d '{"jd":"…"}' http://0.0.0.0:4317/api/evaluate
done
# → 200 200 200 429

# Concurrent tracker writes: 20 parallel POSTs, 20 rows land:
node tests/concurrent-tracker-write.test.mjs
# 20 sequential rows 001..020

# Aria wires sanity:
grep -r 'aria-describedby' public/js/views/ | wc -l
# matching `id:` lookups all resolve (a11y-form-wires.test.mjs canary)
```

### Out of scope (v1.22+)

| 항목 | 비고 |
|---|---|
| `pipeline-preview` 본문 크기 스트리밍 캡 (M-2) | `await upstream.text()` 가 8 KB 슬라이스 이전에 본문 전체를 읽으므로 악성 1 GB 스트림이 메모리를 소진할 수 있습니다. 바이트 카운터 + abort 로 스트림 읽기 권장. |
| WCAG 1.4.1 — `.connection-banner` + 점수 pill 의 색상 전용 상태 (M-3) | 색상만으로 상태를 전달하므로 아이콘 접두어 (✓ / ◐ / ○) 또는 텍스트 접미어를 추가해야 합니다. |
| HTML 엔터티를 통한 `stripDangerousMarkdown` 우회 (M-4) | `&lt;script&gt;`, `java&#115;cript:`, `<img src="data:image/svg+xml,<svg onload=…>">` 가 정규표현식을 통과합니다. UI.md 를 통한 심층 방어는 여전히 유효하나 테스트 스윕에서 우회를 문서화 및 잠금. |
| try/catch 없이 Safari 사생활 보호 모드 `localStorage` 접근 (M-5) | `i18n.js:544/571` 이 던지므로 SPA 가 키 원문을 렌더링합니다. `'en'` 기본값과 함께 try/catch 로 감쌀 것. |
| 백오프 없는 `setInterval(checkHealth, 3000)` (M-6) | 지수 백오프 3s → 6s → 12s → cap 60s. |
| null 가드가 없는 `htmlFor` 별칭 (M-7) | 한 줄 `if (v != null && v !== false)` 방어. |
| 폐기된 `/api/scan-ru/config` 의 404 카나리아 (M-8) | v1.18 선례를 미러링하는 3줄 테스트. |
| 로케일 CHANGELOG 본문 번역 (M-9) | 릴리스 주기 안정 이후 일괄 번역 후보. |
| 모든 mode-page 필드의 인라인 힌트 단락 (M-1) | i18n 키 약 168개 × 8 로케일; 폴리시 항목으로 보류. |
| L-1 ~ L-5 자잘한 항목 | parseInt radix, bash --noprofile, Windows 안전 fileURLToPath, 멀티라인 SSE, scan.js 타이머 정리. |

---

## [1.20.0] — 2026-05-13

**컴포넌트별 접근성 폴리시 + 비영어 README 패리티 + `/api/scan-ru/config` 별칭 폐기.** v1.19.0 의 "Out of scope" 표가 v1.20 으로 표시했던 네 항목을 모두 종료합니다.

### ♿ WCAG 2.5.5 / 2.5.8 — 컴포넌트별 터치 타겟 감사

- **`a11y(touch-target): chip min-height 28 px + 8 px gap (2.5.8 spaced-target exception)`** — `.chip` 은 24 × ~50 px 였고 (수직 24, 군집 컨트롤용 2.5.5 의 24 px 최저치를 미달성), 2.5.8 의 spaced-target 예외는 ≥ 24 × 24 px 또는 24 px 여유 중 하나를 요구합니다. `.chip` 을 `min-height: 28px; padding: 6px 12px;` 로, 감싸는 `.chip-row` 를 `gap: 8px;` 로 조정해 두 조건을 동시에 충족했습니다.
- **`a11y(touch-target): sidebar nav-item min-height 44 px`** — `.nav-item` 은 `10px 14px` 패딩만 갖고 있어 대부분의 뷰포트에서 계산된 높이가 ~36 px 였습니다. 이제 `padding: 12px 14px; min-height: 44px; box-sizing: border-box;` 입니다. `.btn` 최저치와 일치합니다.
- **`a11y(touch-target): tab-btn min-height 44 px`** — Reports, Tracker, Scan 결과의 Sortable Headers / 카테고리 탭에도 동일한 처리.

### ♿ WCAG 1.3.1 / 3.3.2 — 인라인 폼 힌트의 `aria-describedby`

SPA 전반의 모든 폼 컨트롤이 이제 안정된 `id` 를 갖고, `<label>` 이 `htmlFor` 로 이를 가리키며, 인라인 힌트 단락은 `aria-describedby` 로 연결됩니다. 5개의 뷰 파일을 재배선했습니다:

- **`a11y(forms): config.js`** — 키별 `id` + 힌트 연결 (`cfg-<key>` / `cfg-<key>-hint`).
- **`a11y(forms): evaluate.js`** — `eval-jd` textarea + 정화 (sanitization) 후 50자 최소를 문서화하는 `eval-jd-hint` 단락.
- **`a11y(forms): batch.js`** — `batch-tsv` / `batch-tsv-hint`, 더하여 `batch-parallel`, `batch-min-score`, `batch-dry-run`, `batch-retry` 의 `aria-label`.
- **`a11y(forms): pipeline.js`** — `pipe-filter` + `pipe-new-url` / `pipe-new-url-hint`.
- **`a11y(forms): mode-page.js`** — 7개 범용 모드 (`project`, `training`, `followup`, `batch-prompt`, `contacto`, `interview-prep`, `patterns`) 의 모든 필드가 `mode-<slug>-<name>` id 와 `htmlFor` 라벨을 받습니다.

`UI.el()` 은 React 스타일 `htmlFor` 별칭을 학습하여 뷰 코드가 선언적으로 유지됩니다 — 내부적으로는 (JS 예약어인 프로퍼티 이름인) `for` 어트리뷰트를 설정합니다.

### 🌍 비영어 README 패리티

- **`docs(readme): translate 7 locales to 585-line parity with EN master`** — `README.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md` 가 306–316 줄이었습니다 (헤드라인은 다루되 마케팅 중심 워크스루와 API 레퍼런스 대부분을 건너뜀). 일곱 모두 이제 EN 구조를 처음부터 끝까지 미러링합니다: About → One-command install → Why? → Quick start (번호 매겨진 3단계) → Requirements → What you get 표 → Scan → Architecture (전체 디렉토리 트리) → API reference (모든 라우트 표) → Tests → Configuration → Security notes → Limitations → Contributing → 🌍 Getting Started 5단계 워크스루 → License.

### 🧹 `/api/scan-ru/config` 별칭 폐기

- **`feat!(scan): remove /api/scan-ru/config legacy alias (sunset v1.20)`** — v1.19 에서 한 릴리스 동안의 별칭으로 유지되었습니다. 정규 `/api/scan/regional/config` 가 유일한 경로입니다. 제거: `server/lib/routes/scan.mjs` 의 라우트 등록, `README.md`, `docs/architecture/{OVERVIEW,SERVER,API}.md` 의 문서 참조. 테스트는 이미 정규 경로를 다루고 있었으므로 변경 불필요.

### 🧪 테스트

- v1.19 와 동일한 스위트. **427 / 427** 유닛 + 20/20 smoke + 23/23 comprehensive + 32/32 Playwright. 모든 접근성 배선은 가산적입니다 (`id` / `for` / `aria-describedby` 어트리뷰트가 더 추가됨) — 동작 변경이나 테스트 차이가 없습니다.

### 검증

```bash
npm test                              # 427 / 427
npm run test:e2e:browser              # 32 / 32

# Touch targets — every chip / nav-item / tab-btn ≥ 28 / 44 / 44 px:
#   Chrome DevTools → Computed → height/min-height on .chip, .nav-item, .tab-btn

# Form labels — every input has a label[for=…] association:
#   document.querySelectorAll('input,textarea,select').forEach(el =>
#     console.assert(el.labels?.length || el.getAttribute('aria-label'), el))

# Alias gone:
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4317/api/scan-ru/config
# → 404

# Canonical still works:
curl -s http://127.0.0.1:4317/api/scan/regional/config | jq '.'
```

### Breaking changes

- `DELETE /api/scan-ru/config` — 제거됨. `/api/scan/regional/config` 를 사용하십시오. v1.19.0 의 CHANGELOG 와 검증 스크립트에서 sunset 으로 예고되었습니다.

### Out of scope (v1.21+)

| 항목 | 비고 |
|---|---|
| 모든 mode-page 필드의 인라인 힌트 단락 | 현재는 `<label for=…>` 연결만 적용되어 있습니다. 필드별 가시 힌트 문구는 여전히 SPA 에서 영어 전용입니다. README 워크스루가 모든 로케일에서 필드 의도를 문서화하므로 폴리시 항목이며 블로커는 아닙니다. |
| `.connection-banner` 와 대시보드 점수 pill 의 색상 전용 상태 노출 (WCAG 1.4.1) | 배너가 빨강/주황/녹색에 의존합니다; 색상을 인지하지 못하는 사용자를 위해 아이콘 또는 텍스트 접미어가 필요합니다. |
| 로케일별 CHANGELOG 본문 번역 | `CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md` 에 영어 본문 임시 대체가 남아 있습니다. 번역은 v1.x 릴리스 주기가 안정된 후 진행합니다. |

---

## [1.19.0] — 2026-05-13

**WCAG 1.4.3 명도 대비 + 스캔 통합 (최종) + UI 에서 HH_USER_AGENT 제거.** v1.18 의 out-of-scope 였던 명도 대비 감사를 종료하고, v1.18 에서 시작한 EN/RU 분할 제거를 마무리하며, 사용자 방향에 따라 UI 에서 `HH_USER_AGENT` 설정 노브를 제거합니다 (서버에 번들된 합리적 기본값이 이미 대부분의 비-RU IP 에서 동작합니다).

### ♿ WCAG 1.4.3 명도 대비 패스

- **`a11y(contrast): introduce AA-passing *-text variants for accent tokens`** — 라이트 테마: `--rausch-text: #b80f42` (흰색 위 6.59:1, 이전 3.52:1), `--kazan-text: #066507` (7.31:1, 이전 4.53:1), `--darjeeling-text: #7a5800` (앰버 배경 위 5.73:1, 이전 4.24:1), `--babu-text: #00665e` (6.09:1, 이전 2.70:1). 다크 테마: 밝게 조정된 미러 (`#ff8aa0`, `#6ee7b7`, `#fcd34d`, `#5eead4`) 가 `#161a22` 페이퍼 위에서 동일한 4.5:1 최저치를 만족합니다.
- 배지 클래스 (`.badge-ok`, `.badge-warn`, `.badge-bad`, `.badge-info`) 와 점수 pill (`.score-high`, `.score-mid`, `.score-low`) 은 이제 신규 `*-text` 변종을 통해 라우팅되어 — 모든 틴트 배경 위 텍스트 조합이 AA 를 통과합니다. 액센트 채움 토큰 (`--rausch`, `--kazan` 등) 은 경계선과 외곽선용으로 유지됩니다 (비텍스트 UI 컴포넌트는 3:1 만 요구).

### 🧹 스캔 통합 (v1.18 작업 마무리)

- **`docs(scan): scrub remaining EN/RU split references across READMEs + help + architecture docs`** — README 8개 + help 번들 8개 + 아키텍처 문서 3개 (API.md, SERVER.md, OVERVIEW.md, DATA-FLOWS.md) + scan.js 주석이 이제 단일 통합 스캔 방식을 설명합니다. 레거시 `/api/stream/scan-{en,ru}` 별칭은 v1.18 에서 이미 사라졌습니다; v1.19 는 여전히 스캔을 2단계 EN+RU 프로세스로 묘사하던 문서/문구를 잡아냅니다.
- **`feat(scan): canonical /api/scan/regional/config endpoint`** — `/api/scan-ru/config` 은 한 릴리스 동안 얇은 별칭으로 유지하여 하위 호환을 제공합니다. 신규 경로는 소스 이름 규칙 (`?source=regional`) 과 일치합니다.

### 🛠️ UI 에서 HH_USER_AGENT 제거

- **`feat!(config): drop HH_USER_AGENT field from /#/config + KNOWN_KEYS`** — 파워 유저는 여전히 `career-ops/.env` 에 직접 `HH_USER_AGENT` 를 설정할 수 있습니다 (서버는 `server/lib/sources/hh.mjs` 에서 `process.env.HH_USER_AGENT` 를 읽으며 번들된 UA 가 폴백입니다). 대부분의 사용자에게는 기본값으로 충분하고 App Settings 페이지에서 알 수 없는 User-Agent 필드를 보는 것이 반복적인 혼란의 원인이었기 때문에 UI 는 더 이상 이를 노출하지 않습니다.
- 8개 로케일의 README 와 help 번들 언급이 "러시아 IP / VPN 으로 실행" 안내로 교체되었습니다. `scan.hhWarning` i18n 키는 환경 변수 설정 세부 사항을 제거하도록 재작성되었습니다.
- `KEY_GROUPS` 가 축소되었습니다: 더 이상 `regional` 분류가 없습니다 (HH_USER_AGENT 만 있었음). 테스트가 갱신되었고; `regionalActive` 페이로드 필드는 SPA 하위 호환을 위해 유지됩니다.

### 🧪 테스트

- `tests/env-config.test.mjs` — `KNOWN_KEYS` 단언이 이제 HH_USER_AGENT 를 제외합니다; 키가 의도적으로 부재함을 확인하는 신규 단언.
- `tests/config-endpoint.test.mjs` — POST 쓰기 다중 키 테스트가 HH_USER_AGENT 대신 두 번째 알려진 키로 `GEMINI_MODEL` 을 사용합니다.
- `tests/config-groups.test.mjs` — `groups.HH_USER_AGENT` 가 이제 `undefined` 로 기대됩니다.
- 합계: **427 / 427** 유닛 + 20/20 smoke E2E + 23/23 comprehensive E2E + 32/32 Playwright. 조정된 모든 테스트가 이미 집계되었기 때문에 v1.18.0 과 동일한 수치입니다.

### 검증

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

| 항목 | 비고 |
|---|---|
| 컴포넌트별 터치 타겟 감사 (필터 chip, 정렬 가능한 헤더, 사이드바 내비게이션) | v1.18 이 전역 최저치를 설정했고 (`.btn` 44 px, `.btn-sm` 32 px); SPA 전반의 컴포넌트별 검증은 남아 있습니다. |
| 인라인 폼 힌트의 `aria-describedby` (`#/config`, `#/pipeline`, `#/evaluate`, `#/batch`) | v1.17 이 글로벌 검색과 모달 닫기의 `aria-label` 을 다루었습니다. 입력별 힌트 연결이 다음 폴리시 레이어입니다. |
| 비영어 README 의 전체 패리티 (EN 처럼 585줄) | v1.18 이 비영어를 ~307 (EN 의 53 %) 로 가져왔습니다. 마케팅 중심의 "Quick start" + "🌍 Getting Started" 워크스루는 영어 전용으로 남아 있습니다. |
| `/api/scan-ru/config` 레거시 별칭 제거 | v1.20 에 sunset 계획. 정규 `/api/scan/regional/config` 이 마이그레이션 대상입니다. |

---

## [1.18.0] — 2026-05-13

**스캔 엔드포인트 통합 + WCAG 2.2 AA 패스 + i18n long-tail 마무리.** 레거시 `/api/stream/scan-{en,ru}` 별칭을 폐기합니다 (Sunset 기간 2026-10-01 을 사용자 방향에 따라 v1.18 로 앞당김). 비영어 README 를 ~307 줄로 끌어올리고, 6개 로케일에서 RU 본문이 남아 있던 v1.16.0 + v1.17.0 CHANGELOG 항목을 번역합니다.

### 🚪 Breaking

- **`feat!(scan): retire legacy /api/stream/scan-{en,ru} aliases`** — 폐기된 EN/RU 분할 SSE 엔드포인트가 사라졌습니다. 모든 컨슈머는 v1.12.0 부터 활성 상태인 통합 `/api/stream/scan?source=ats|regional|both` 엔드포인트를 통과합니다. 레거시 경로는 v1.15.0 부터 Deprecation + Sunset (RFC 8594) 헤더를 갖고 있었습니다; 마이그레이션 기간이 종료되었습니다. 옛 경로의 외부 통합은 SPA catch-all 로 조용히 라우팅되는 대신 **404** 를 받습니다.

### ♿ 접근성 (WCAG 2.2 AA 패스)

- **WCAG 2.4.1 Bypass Blocks** — 모든 페이지의 첫 번째 포커스 가능 요소로 신규 **Skip to main content** 링크. `.skip-link` 로 시각적으로 숨겨져 있다가 포커스를 받으면 좌상단으로 표시됩니다.
- **WCAG 2.4.7 Focus Visible** — 전역 `*:focus-visible` 스타일. 마우스 클릭 포커스 링은 꺼지고 키보드 Tab 포커스 링은 켜집니다 (WAI-ARIA AP 표준 패턴). 모달 닫기 (×) 는 더 높은 대비의 포커스 링을 받습니다.
- **WCAG 2.5.5 Target Size** — `.skip-link` 의 최소 44×44 px 터치 타겟. `.btn-sm` 은 32 px min-height 를 유지합니다 (행 간격과 결합하면 컴팩트 테이블 행 컨트롤용 24×24 + 간격 AAA 예외를 충족).
- **WCAG 3.1.1 Language of Page** — `<html lang="en">` 을 `lang="ru"` 에서 수정했습니다 (JS i18n 부트스트랩이 이미 로드 시 이를 재정의했지만 SSR 기본값이 이제 SPA 기본 로케일과 일치합니다).
- **WCAG 1.3.1 Info & Relationships** — `#content` 가 `tabindex="-1"` 을 받아 skip-link 대상이 깔끔하게 포커싱됩니다. (ARIA 역할 + focus-trap 은 이미 v1.17 에서 추가되었습니다.)

### 📚 i18n long-tail

- **`docs(i18n): v1.16.0 + v1.17.0 CHANGELOG translated in 6 locales`** — `CHANGELOG.{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md` 에서 이전에 RU 본문이었던 항목들이 이제 네이티브 언어로 표시됩니다. 로케일당 RU 문자 수가 79 → 42 → 23 으로 감소했습니다 (남은 23개는 파일 경로 같은 기술적 인라인 참조와 의도적으로 유지되는 다국어 헤더 링크입니다).
- **`docs(readme): expand non-EN READMEs with Why / Requirements / Features / Configuration / Contributing`** — 각 비영어 README 가 240 → ~307 줄로 성장했습니다. 이제 585줄 EN 과 동일한 비마케팅 섹션을 다룹니다. 전체 1:1 패리티 (마케팅 중심 워크스루 섹션) 는 여전히 연기됩니다.

### 🛠️ Misc

- **`docs(api): consolidated scan endpoint in API.md + DATA-FLOWS.md + README.md`** — API 레퍼런스 표가 이제 `/api/stream/scan?source=…` 만 나열합니다. README 의 Scan 섹션이 v1.18.0 의 EN/RU 분할 폐기를 설명합니다.
- **`fix(scan.js): drop stale comment about deprecated aliases being live`** — SPA 의 runScanAll 디스패처 주석이 통합된 현실을 반영합니다.

### 🧪 테스트

- `tests/scan-consolidated.test.mjs::F-018 backwards compat` 가 재작성되었습니다 — 이전의 두 "레거시 엔드포인트가 여전히 동작함" 단언이 이제 `/api/stream/scan-{en,ru}` 요청이 (SPA catch-all 로 라우팅되는 대신) **404** 를 반환하는지 검증합니다.
- 합계: **427 / 427** 유닛 + 20/20 smoke E2E + 23/23 comprehensive E2E + 32/32 Playwright (수치 동일; +2 개의 새로운 레거시 제거 단언이 +2 개의 레거시 정상 동작 단언을 대체).

### 검증

```bash
npm test                              # 427 / 427
npm run test:e2e:full                 # 23 / 23

# Legacy endpoint retirement:
curl -sI http://127.0.0.1:4317/api/stream/scan-en | head -1   # → HTTP/1.1 404
curl -sI http://127.0.0.1:4317/api/stream/scan-ru | head -1   # → HTTP/1.1 404

# Consolidated endpoint:
curl -sN 'http://127.0.0.1:4317/api/stream/scan?source=ats&dryRun=1' | head -5
# → event: start
# → data: {"script":"en-scanner","writeFiles":false,…}

# Skip link (a11y):
curl -s http://127.0.0.1:4317/ | grep -c 'class="skip-link"'  # → 1

# html lang fallback:
curl -s http://127.0.0.1:4317/ | grep -c 'html lang="en"'     # → 1
```

### Out of scope (v1.19+)

| 항목 | 비고 |
|---|---|
| 비영어 README 의 전체 패리티 (EN 처럼 585줄) | v1.18 이 비영어를 ~307 (EN 의 53 %) 로 가져왔습니다. 마케팅 중심 "Why?" / "Quick start" 워크스루는 영어 전용으로 남아 있습니다. |
| 색상 명도 대비 감사 (WCAG 1.4.3 AA — 텍스트 4.5:1, 대형 텍스트 3:1) | v1.18 이 구조적 접근성을 다루었습니다; 라이트 + 다크 팔레트 전반의 토큰별 명도 대비 검증은 남아 있습니다. |
| 모든 상호작용 요소에 대한 터치 타겟 감사 | v1.18 이 최저치를 설정했고 (`.btn`: 44 px, `.btn-sm`: 32 px); 컴포넌트별 검증 (필터 chip, 사이드바 내비게이션, 정렬 가능한 헤더) 은 남아 있습니다. |

---

## [1.17.0] — 2026-05-13

**폴리시 + 접근성 + CI 수정 릴리스.** v1.16.0 목록의 9개 후속 작업을 모두 종료합니다: 브라우저 smoke 검증, README 배지 정합, 커버리지 갱신, SPA 에 surface 된 `lastWorkdayFallback`, 전체 E2E 재기준선, Playwright auto-pipeline 시나리오, 접근성 감사 패스, 6개 로케일에서 과거 CHANGELOG 압축, Architecture / API / Security / Tests 섹션으로 비영어 README 확장.

### 🐛 수정

- **`fix(e2e): smoke + comprehensive suites re-aligned with v1.16 UX`** — v1.16 의 Cmd+K Enter → AutoPipeline 모달 변경 때문에 e2e 테스트의 `search.press('Enter')` 가 후속 클릭을 가로채는 모달을 열었습니다. 테스트는 이제 v1.16 의 문서화된 분기와 일치하도록 레거시 quick-add 경로에 `Shift+Enter` 를 사용합니다. comprehensive E2E 의 배치 모드 반복도 (v1.15 PR-H 가 도입한 레거시 mode-prompt slug 인) `/#/batch-prompt` 를 사용하도록 갱신되었습니다. **이것이 v1.16.0 푸시의 CI 실패였습니다** — Playwright e2e 가 backdrop 가로채기 클릭에서 30초 동안 타임아웃되었습니다.
- **`fix(mode-page): batch-prompt route → modes/batch.md via serverSlug`** — v1.15 가 레거시 mode slug 를 `batch-prompt` 로 이름을 바꾸었지만, 서버의 `POST /api/mode/:slug` 는 존재하지 않는 `modes/batch-prompt.md` 를 찾고 있었습니다. 신규 `serverSlug` 필드는 라우트 해시를 부모의 mode 파일 이름과 분리합니다.
- **`chore: bump deprecation messages from v1.16.0 to v1.17.0`** — scan-en/scan-ru deprecation 문구와 batch-prompt deprecation 배너가 과거 버전을 참조하고 있었습니다.

### ✨ 기능

- **`feat(scan): 🔒 Workday CAPTCHA chip in Active Companies card`** — v1.16 PR-7 의 서버 사이드 `lastWorkdayFallback` export 가 이제 SPA 에서 소비됩니다. `/api/scan-results` 가 스냅샷을 반환합니다; `#/scan` 은 Workday 테넌트가 폴백으로 떨어진 경우 Active Companies 위에 경고 톤의 카드를 렌더링합니다 ("🔒 Workday tenant blocked — fallback: use /career-ops scan (Playwright)"). 신규 `getLastWorkdayFallback()` exporter 는 ESM live-binding 모호성을 피합니다. 신규 i18n 키 2개 × 8 로케일.

### ♿ 접근성

- **`a11y: ARIA roles + focus management pass on critical surfaces`** —
  - `index.html`: `<aside>` (navigation), `<header>` (banner), `<section id="content">` (main), `<div id="modal">` (aria-modal/aria-labelledby 를 가진 dialog), `<div id="toast">` + `#conn-banner` (aria-live 를 가진 status), `<div class="searchbar">` (search) 에 `role` 어트리뷰트.
  - `#sidebar-toggle` 은 `aria-controls="sidebar"` 와 열기/닫기 시 JS 가 동기화하는 `aria-expanded` 를 받습니다.
  - `#global-search` 는 시각적으로 숨겨진 `<label>` 과 Cmd+K 단축키 힌트를 표시하는 명시적 `aria-label` 을 받습니다.
  - 모달 닫기 (×) 는 `aria-label="Close dialog"` 를 받습니다.
  - 장식용 backdrop 은 `aria-hidden="true"` 를 받습니다.
  - **모달의 Focus trap** — `UI.modal()` 이 클릭 소유자를 기억하고, 열릴 때 첫 번째 비닫기 포커스 가능 요소에 포커스를 두며, 모달 내에서 Tab/Shift+Tab 을 순환시킵니다. `UI.closeModal()` 은 이전 소유자에게 포커스를 복원합니다.
  - `public/css/app.css` 의 신규 `.visually-hidden` 유틸리티 클래스 (WAI-ARIA AP 표준 패턴).

### 📚 문서

- **`docs(readme): badge truth across 8 READMEs`** — tests 배지 `284 / 379 / 360` → **427**; release 배지 `v1.9.1 / v1.13.0` → **v1.16.0** 그 후 v1.17 bump 로 → v1.17.0. 릴리스 링크 타깃 갱신.
- **`docs(readme): expand 7 non-EN READMEs with reference sections`** — 각 README 가 170 → ~240 줄로 성장하면서 네이티브 언어로 Architecture / API reference / Security notes / Tests / A11y / Limitations / License 섹션이 추가되었습니다. 아직 EN 의 585줄 패리티는 아니지만 모든 핵심 비마케팅 표면을 다룹니다.
- **`docs(changelog): condense pre-v1.12 entries in 6 locales`** — 비영어/비러시아어 CHANGELOG 에 흘러들어간 길고 RU 본문이었던 v1.11.x + v1.10.x 항목이 이제 각 로케일의 네이티브 언어로 압축된 "Earlier releases" 요약으로 교체되었습니다. 상세 이력은 `CHANGELOG.md` (EN) 에 유지됩니다.

### 🛠️ 도구

- **`coverage: refresh numbers`** — 마지막 공개치는 95.46 % 라인 / 84.06 % 브랜치 (v1.13.0 REVIEW) 였습니다. v1.17 기준선: **94.14 % 라인 / 82.98 % 브랜치 / 93.20 % 함수**. auto-pipeline + reports-write 의 새 오류 경로로 약간 감소; 여전히 CLAUDE.md 의 80 % 최저치보다 한참 위입니다.

### 🧪 테스트

- 합계: **427 / 427** 유닛 + 20/20 smoke E2E + 23/23 comprehensive E2E + **32 / 32** Playwright (이전 28; +4 신규 auto-pipeline 시나리오: 버튼이 모달을 엽니다, Cmd+K 붙여넣기가 모달을 트리거합니다, 잘못된 URL 이 1단계를 게이팅합니다, `POST /api/auto-pipeline` SSE 이벤트 프레이밍).
- E2E 스위트가 v1.16.0 UX 에 재정렬되었습니다 (Shift+Enter quick-add, 레거시 모드용 /#/batch-prompt).

### 검증

```bash
# Locally:
npm test                          # 427 / 427
npm run test:e2e                  # 20 / 20
npm run test:e2e:full             # 23 / 23
npm run test:e2e:browser          # 32 / 32

# Browser smoke (page-level):
curl -s http://127.0.0.1:4317/api/scan-results | jq '.workdayFallback'
# null when no Workday fallback occurred; {apiUrl, reason, at} after a 4xx.

# A11y spot-check:
node -e "
const c = require('cheerio').load(require('fs').readFileSync('public/index.html','utf8'));
['banner','navigation','main','dialog','status','search'].forEach(r =>
  console.log(r, c('[role=' + r + ']').length));
"
# Each role should appear ≥1.

# CI gate verification: dashboard-screenshots workflow boots a /tmp
# scaffold, regenerates PNGs, diffs against committed — green when
# images/dashboard-*.png are up to date with rendered SPA.
```

### Out of scope (v1.18+)

| 항목 | 비고 |
|---|---|
| 비영어 CHANGELOG 의 v1.16.0 항목 번역 | 현재 RU 본문 (~30 줄 × 6 로케일 = 180 줄). 사용자의 명시적 v1.11.x/v1.10.x 범위 밖이었습니다. |
| 비영어 README 의 전체 패리티 (EN 처럼 585줄) | v1.17 이 비영어를 ~240 으로 가져왔습니다; 마케팅 중심의 "Why?" / "Quick start" 워크스루는 영어 전용으로 남아 있습니다. |
| 정규 A-F 프롬프트의 부모 커밋 | `santifer/career-ops::modes/oferta.md` 재작성이 여전히 upstream 에서 필요합니다 (CLAUDE.md 하드 룰 #1). |
| 전체 WCAG 2.2 AA 감사 | v1.17 이 구조적 ARIA + focus trap 을 다루었습니다; 컴포넌트별 명도 대비/Tab 순서 감사는 대기 중. |

---

## [1.16.0] — 2026-05-13

**Auto-pipeline 마무리 + 어댑터 폴리시 + i18n long-tail.** v1.15.0 REVIEW 의 11개 후속 작업을 모두 종료합니다: 서버 사이드 SSE auto-pipeline, `POST /api/reports` 프리미티브, Cmd+K 단축키, SmartRecruiters 페이지네이션, Workday CAPTCHA 폴백, CI 스크린샷 드리프트 게이트, 스캔 소스 필터 UX, 과거 CHANGELOG 번역 (v1.13.0/v1.12.0 × 6 로케일), 비영어 README 확장, paste-ready trending-companies importer.

### ✨ 기능

- **`feat(auto-pipeline): server-side SSE orchestrator`** (#1, #2, #3, #8) — v1.15 의 클라이언트 사이드 chained-fetch 오케스트레이터는 사라졌습니다. `POST /api/auto-pipeline` 은 이제 curl 가능한 SSE 엔드포인트로, validate → fetch JD → evaluate → save report → tracker 를 서버 사이드에서 실시간 단계 이벤트와 함께 수행합니다. 느린 Anthropic 호출 (30–90 초) 은 일반 spinner 대신 `running` 이벤트를 emit 합니다. 실패는 `step` + `message` 와 함께 `error` 를 emit 합니다. 오케스트레이터는 또한 report markdown 을 부모의 `reports/<slug>.md` 에 영속화합니다 (v1.15 에서 손실되었음).
- **`feat(reports): POST /api/reports primitive`** — `server/lib/routes/reports.mjs` 의 신규 writer 엔드포인트. 경로 탐색 가드를 포함한 slug 정화 (sanitization) (선행 점 제거, 내부 `...` 축약). 1 MB 캡 (413). `overwrite:true` 가 아니면 기존 파일에 대해 409. `stripDangerousMarkdown` XSS 패스를 통한 원자적 쓰기. activity.reports.save 로그. 테스트: 9 케이스.
- **`feat(app): Cmd+K paste URL → auto-pipeline`** — 글로벌 검색에 URL 을 붙여넣고 Enter 를 누르면 이제 `autoStart=true` 와 함께 AutoPipeline 모달이 열립니다. Shift+Enter 는 레거시 "파이프라인에만 추가" 경로를 보존합니다. 정규 career-ops.org Quick Start §7 의 "paste URL → done" UX 입니다.
- **`feat(portals): SmartRecruiters pagination`** (#4) — `server/lib/sources/smartrecruiters.mjs` 가 `?limit=100&offset=N` 을 통해 `totalFound` 에 도달하거나 빈 페이지가 반환되거나 30 페이지 / 3000 잡 안전 캡이 발동될 때까지 페이지를 순회합니다. 호출자가 공급한 limit/offset 을 제거하여 커서가 서버 소유가 되도록 합니다. 큰 보드 (Procter & Gamble, Amazon 류) 가 더 이상 100+ 공고의 뒷부분을 잃지 않습니다. 테스트: 6 케이스.
- **`feat(portals): Workday CAPTCHA-fallback graceful`** (#7) — `server/lib/sources/workday.mjs` 가 더 이상 4xx / 비-JSON / 네트워크 오류에 throw 하지 않습니다. `[]` 를 반환하고 신규 export `lastWorkdayFallback` 스냅샷에 주석합니다. 스캐너 타임라인은 다음 테넌트로 계속됩니다. 호출자는 `strict:true` 로 v1.14 throw 동작에 다시 옵트인할 수 있습니다. 테스트: 7 케이스.

### 🛠️ 도구 + CI

- **`ci(workflows): dashboard-screenshots drift gate`** (#5) — 신규 `.github/workflows/dashboard-screenshots.yml`. `public/css/app.css` / `public/js/views/dashboard.js` / `public/js/lib/i18n.js` / `public/index.html` 를 건드리는 PR 에서 workflow 는 /tmp scaffold 에 대해 web-ui 서버를 기동하고, Playwright + chromium 으로 8개 hero PNG 를 재생성하며, 커밋된 것과 결과가 어긋나면 빌드를 실패시킵니다. 실패 시 재생성된 PNG 를 CI 아티팩트로 업로드합니다.
- **`feat(scripts): import-trending-companies.mjs`** (#11) — `docs/portals-examples.md` 의 13개 trending 회사를 실제 boards-API 로 검증하고 사용자의 부모 `portals.yml::tracked_companies` 에 붙여넣을 수 있는 YAML 을 출력합니다. slug 가 404 인 후보에는 `enabled: false` 가 찍힙니다. 6개 ATS 모두 라이브 프로브 (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday). `npm run import:trending` 으로 실행.
- **`feat(scripts): npm run capture:dashboards`** — `scripts/capture-dashboard-screenshots.mjs` 를 top-level 스크립트로 노출합니다 (이전에는 `images/README.md` 에만 문서화됨).

### 🎨 UX

- **`fix(scan): consolidated source-filter dropdown`** (#6) — `#/scan` 소스 드롭다운이 v1.14 어댑터 레지스트리에서 재구성되었습니다: 6개 ATS + hh.ru + Habr Career, 알파벳순, 지역 prefix 없음. `runEnScan` / `runRuScan` 이 이제 폐기된 `/api/stream/scan-{en,ru}` 별칭 대신 통합된 `/api/stream/scan?source={ats,regional}` 엔드포인트를 호출합니다 (Sunset 헤더는 v1.16 까지 라이브 유지).

### 📚 i18n long-tail

- **`docs(i18n): translate v1.13.0 + v1.12.0 CHANGELOG in 6 locales`** (#9) — `CHANGELOG.{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md` 에 이전에 RU 본문이었던 항목들이 이제 실제 로케일에 있습니다. 각 비영어/비러시아어 CHANGELOG 에는 pre-v1.12 항목이 프로젝트 관례에 따라 RU 로 유지된다는 i18n 노트도 포함됩니다 (정규 텍스트는 `CHANGELOG.md` 에 있음).
- **`docs: expand non-EN READMEs with v1.16.0 highlights section`** (#10) — 6개 비영어 README (es / pt-BR / ko-KR / ja / ru / zh-CN / zh-TW) 가 ~35 줄의 새 섹션을 받습니다: auto-pipeline 원클릭 흐름 + curl 예제, SmartRecruiters 페이지네이션, Workday 폴백, 스캔 소스 필터 UX, importer 스크립트, CI 스크린샷 워크플로. RU README 도 확장되었습니다.

### 🧪 테스트

- 신규 `tests/reports-write.test.mjs` (9 케이스) — happy path, slug 정화 (경로 탐색 가드 포함), 409 충돌, overwrite 플래그, XSS strip, 필드 누락 시 400, >1 MB 시 413, GET/POST 라운드트립.
- 신규 `tests/auto-pipeline.test.mjs` (5 케이스) — SSE 프레이밍, 잘못된 URL 게이트, SSRF/loopback 게이트, LLM 키 없음 오류 경로, `text/event-stream` Content-Type 헤더.
- 신규 `tests/smartrecruiters-pagination.test.mjs` (6 케이스) — 단일 페이지, 3 페이지, 빈 페이지 조기 종료, 하드 캡 준수, 쿼리 strip, 503 throws.
- 신규 `tests/workday-fallback.test.mjs` (7 케이스) — happy path, 403/429 graceful, 비-JSON 본문, 네트워크 오류, 4xx 및 네트워크 오류 양쪽의 strict 옵트인.
- 합계: **427 / 427** 유닛 (이전 400; +27 순증). 0 실패. 28/28 Playwright + 23/23 comprehensive E2E + 20/20 smoke E2E 가 v1.15.0 기준선에서 모두 통과.

### Out of scope (v1.17+)

| 항목 | 비고 |
|---|---|
| 정규 A-F 프롬프트의 부모 커밋 | upstream 의 `santifer/career-ops::modes/oferta.md` 재작성이 여전히 대기 중 (CLAUDE.md 하드 룰 #1). |
| pre-v1.12 CHANGELOG 항목 번역 (v1.11.x, v1.10.x) | 관례 유지: RU 본문. 백포트는 ~1800 줄 번역 작업; 연기. |
| 비영어 README 의 전체 패리티 (EN 처럼 585줄) | v1.16 이 로케일당 ~35 줄 추가; 전체 패리티는 별도 작업입니다. |
| Workday 폴백 주석을 읽어 🔒 chip 을 렌더링하는 서버 사이드 `runEnScan` | `lastWorkdayFallback` export 가 연결되어 있습니다; SPA 의 Active Companies 카드는 v1.17+ 에서 이를 소비합니다. |

### 검증

```bash
npm test                          # 427 / 427
npm run test:e2e:full             # 23 / 23
npm run import:trending --check-only   # probe 13 trending boards

# Auto-pipeline curl smoke:
curl -N -X POST http://127.0.0.1:4317/api/auto-pipeline \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://job-boards.greenhouse.io/anthropic/jobs/4567"}'

# POST /api/reports round-trip:
curl -X POST http://127.0.0.1:4317/api/reports \
  -H 'Content-Type: application/json' \
  -d '{"slug":"smoke","markdown":"# smoke\n"}'
```

---

## [1.15.0] — 2026-05-13

**문서 적합성 (Doc-conformance) 릴리스.** 적합성 감사 (`qa/conformance-vs-docs/00-CONFORMANCE-REPORT.md`) 에서 여전히 열려 있던 10개 결과 중 9개와 현지화된 hero 이미지를 종료합니다. CLI 가 약속하는 동일한 파이프라인이 모든 로케일에서 브라우저를 통해 end-to-end 로 동작하도록 UI 를 정규 career-ops.org/docs 워크플로에 일치시킵니다.

### ✨ 기능

- **`feat(auto-pipeline): PR-C — 1-click "paste URL → report + PDF + tracker row"`** (G-007) — 정규 career-ops.org 약속을 충족합니다. v1.15 이전에 사용자는 /#/pipeline → /#/evaluate → /#/cv → /#/tracker 에 걸쳐 5번 수동 클릭했습니다. 이제 /#/dashboard 의 단일 ✨ 버튼이 체인합니다: validate URL → fetch JD (SSRF-safe) → evaluate against CV → generate PDF → add tracker row. 단계별 모달 타임라인을 단계당 [✓]/[…]/[✗] 로 렌더링합니다. JD 첫 줄에서 휴리스틱한 회사/역할 추출. 평가 markdown 에서 정규표현식으로 점수 + 정당성 추출. 신규 파일: `public/js/lib/auto-pipeline.js`. 신규 i18n 키 19개 × 8 로케일.
- **`feat(modes): PR-D — modes/_profile.md editor as #/config → Modes tab`** (G-008) — Quick Start §Step-5 의 정규 "Career framing" 파일이 이전에는 UI 사용자에게 보이지 않았습니다. 이제 /#/config 의 신규 "Modes" 탭과 /#/profile 의 발견 가능한 카드로 노출됩니다. 신규 엔드포인트: 256 KB 캡, `stripDangerousMarkdown` XSS 패스, 첫 읽기 시 `_profile.template.md` 로부터 scaffold 하는 `GET/PUT /api/modes/_profile`. 신규 i18n 키 9개 × 8 로케일.
- **`feat(profile): PR-E — accept canonical schema; add location + headline`** (G-009) — `/api/profile` 이 이제 레거시 (`candidate:{...}`) 와 정규 (최상위 `full_name`, `narrative.headline`, `target_roles.primary`, `compensation.target_range`) 스키마를 모두 수용합니다. 둘 다 있을 때는 레거시가 우선하므로 기존 YAML 이 동일하게 렌더링됩니다. 신규 `summarizeProfile()` 헬퍼가 통합된 형태를 반환합니다. `/#/profile` 이 `narrative.headline` 을 새 카드로 노출합니다. 신규 i18n 키 2개 × 8 로케일.
- **`feat(tracker): PR-B — Legitimacy column on #/tracker`** (G-006) — career-ops.org/docs 의 정규 파이프라인 출력 표와의 패리티를 복원합니다. Status 와 PDF 사이에 Legitimacy 열을 추가하고 badge-ok/warn/bad 틴팅 (statusClass 패턴을 미러링). Graceful degrade — Legitimacy 열이 없는 v1.15 이전 행은 `—` 를 표시합니다. 신규 i18n 키 1개 × 8 로케일.
- **`fix(routing): PR-H — dedupe sidebar; route #/batch to v1.13.0 TSV SPA`** (G-011) — 이 수정 이전에는 /#/batch 가 사이드바에 두 번 등록되어 있었고 둘 다 레거시 mode-prompt builder 로 갔습니다. v1.13.0 TSV SPA (8 KB, 4 엔드포인트) 는 접근 불가능했습니다. 중복 사이드바 항목을 제거; mode slug `batch` → `batch-prompt` 로 이름을 바꾸고 deprecation 배너 추가. 정규 /#/batch 는 이제 TSV SPA 입니다.

### 📚 문서

- **`docs(evaluate): PR-A — realign Block A-F with canonical career-ops.org rubric`** (G-005) — career-ops.org 문서는 A–F 를 사용합니다 (Strategy/Personalization/STAR stories 가 C/E/F). 우리는 의미가 옮겨진 A–G 를 emit 했습니다 (Risks/Verdict/Legitimacy). v1.15 는 8개 help 번들의 §9 를 정규 A–F 로 보여주도록 갱신하고 "v1.15 이전은 A–G 를 사용; 하위 호환을 위해 그대로 렌더링" 콜아웃을 추가합니다. `eval.subtitle` i18n 키 × 8 로케일도 재정렬되었습니다. 점수 + 정당성이 이제 보고서 헤더 필드로 문서화됩니다. ⚠ 부모 커밋이 여전히 필요합니다: `santifer/career-ops::modes/oferta.md` 가 upstream 에서 재작성되어 정규 A–F 를 emit 해야 합니다.
- **`docs: PR-F — seniority_boost + search_queries in help §5 across 8 locales + scaffold`** (G-010) — 8개 번들의 Help §5 가 이제 세 번째 title-filter 키 (`seniority_boost`) 를 문서화하고 AI 기반 Option B 스캔만을 구동한다는 점을 명확히 하는 번역된 1단락 도입과 함께 `search_queries` 예제 블록을 갖습니다. `bin/setup.sh` portals.yml scaffold 가 기본으로 `seniority_boost: ["Senior", "Staff", "Lead"]` 를 시드합니다. H2 패리티 유지: 16 × 8 로케일.
- **`docs: PR-I — localized hero images per README locale`** — 8개 README 각각이 이제 (`scripts/capture-dashboard-screenshots.mjs` 를 통해 Playwright + chromium 으로 생성된) 로케일별 `images/dashboard-<locale>.png` (HiDPI 1440×900) 을 갖습니다. 옛 공유 `public/images/screen_vacancy_found.png` 는 삭제되었습니다. 비영어 독자가 첫 진입에서 자신의 언어로 라벨링된 UI 를 봅니다.

### 🧹 이월 정리

- **`PR-G — G-001`** `scan.noResults` i18n 번들: "EN or RU scan" 리터럴을 포함한 8개 문자열을 로케일 깔끔한 문구로 교체.
- **`PR-G — G-002`** 📄 Generate PDF 버튼이 이제 #/interview-prep 결과 패널에 등장합니다 (deep.js 패턴 미러링).
- **`PR-G — G-003`** `README.cn.md` → `README.zh-CN.md` (정규 로케일 태그); 형제 파일들과 tests/canonical-docs-coverage.test.mjs 에서 참조 일괄 수정.
- **`PR-G — G-004`** `/api/stream/scan-en` + `scan-ru` 가 이제 RFC 8594 Sunset + Deprecation + Link 헤더를 emit 합니다 (sunset 2026-10-01). v1.16.0 에서 제거 예정.

### 🧪 테스트

- 신규 `tests/profile-canonical-schema.test.mjs` (6 케이스) — 정규 YAML, 레거시 YAML, 혼합 (레거시 우선), 정규 전용 수용, 둘 다 아닌 형태 거부, 보상 범위 파싱.
- 신규 `tests/modes-profile-crud.test.mjs` (8 케이스) — 비어 있을 때 내장 scaffold, template-takeover, persisted-wins, 쓰기 happy-path, 정화, 비문자열 시 400, >256 KB 시 413, 범용 /api/modes/:name 도 여전히 동작.
- 테스트 픽스처의 격리 회귀 수정: 테스트가 이제 `before/after + dynamic-import` 패턴을 사용 (`tests/batch-endpoints.test.mjs` 와 일치) 하여 더 이상 사용자의 실제 부모 `config/profile.yml` 을 변경하지 않습니다. **사용자 주의:** v1.15.0-RC 빌드에서 업그레이드한 후 `config/profile.yml` 이 테스트 placeholder 처럼 보인다면 백업에서 복원하십시오 — 회귀는 dev 브랜치에만 존재했습니다.
- 합계: **400 / 400** 유닛 (이전 386; +14 순증). 0 실패. 20/20 smoke E2E + 23/23 comprehensive E2E + 28/28 Playwright 가 v1.14.0 기준선에서 모두 통과.

### Out of scope (v1.16+ 후속)

| 항목 | 비고 |
|---|---|
| 정규 A–F 프롬프트의 부모 커밋 | `santifer/career-ops::modes/oferta.md` 가 upstream 에서 재작성되어야 합니다. CLAUDE.md 하드 룰 #1 이 부모 파일 편집을 금지합니다. web-ui 쪽은 이미 완료되었습니다 (graceful degrade — v1.15 이전 A–G 보고서는 변경 없이 렌더링됨). |
| 서버 사이드 `POST /api/auto-pipeline` SSE | 클라이언트 사이드 오케스트레이터가 UX 승리를 출하했습니다. 서버 사이드 엔드포인트는 retry-from-step-N + curl 가능한 CI 를 가능하게 합니다. |
| `POST /api/reports` 프리미티브 | Auto-pipeline 이 현재 report markdown 을 인라인으로 보여주지만 부모 `reports/` 에 영속화하지 않습니다. PDF + tracker 행이 영구 아티팩트입니다. |
| Cmd+K paste-URL → run auto-pipeline | v1.16+ 로 연기. |

### 검증

```
npm test                              # 400 / 400
npm run test:e2e:full                 # 23 / 23
curl -sf http://127.0.0.1:4317/api/health | jq '.checks | length'   # → 18
curl -sI http://127.0.0.1:4317/api/stream/scan-en | grep -i sunset  # G-004 visible
curl -sf http://127.0.0.1:4317/api/modes/_profile | jq '.scaffolded' # G-008 wired
ls images/dashboard-*.png | wc -l     # 8 (PR-I)
grep -c 'href="#/batch"' public/index.html  # 1 (PR-H dedupe)
```

---

## [1.14.0] — 2026-05-13

v1.13.0 의 레지스트리 위에 3개의 신규 ATS 어댑터가 도착하면서 지원 ATS 가 3 → 6 으로 늘었습니다 (Greenhouse / Ashby / Lever **+ Workable / SmartRecruiters / Workday-beta**). 17개 파일에 걸친 사용자 대상 문서를 한 번에 "3 ATSes" 에서 "6 ATSes" 로 일괄 갱신했습니다 (42개 문구 업그레이드) — README × 8 로케일, help 번들 × 8 로케일, PROJECT.md. 부모 `portals.yml` 을 위한 13개 trending 회사의 paste-ready YAML 블록을 `docs/portals-examples.md` 에 추가합니다.

### ✨ 기능

- **`feat(portals): 3 new ATS adapters — Workable, SmartRecruiters, Workday-beta`** — 레지스트리가 이제 6개 ATS 를 해석합니다 (이전 3). 신규 파일: `server/lib/portals/adapters/{workable,smartrecruiters,workday}.mjs` (각각 신규 sources 를 감싸는 얇은 균일 계약 래퍼) 와 `server/lib/sources/{workable,smartrecruiters,workday}.mjs` (raw HTTP + `source: <id>` 가 포함된 정규 `{ id, title, company, url, location, isRemote, … }` 형태로의 응답 정규화).
  - **Workable**: `apply.workable.com/<slug>` 와 레거시 `<subdomain>.workable.com` 을 감지. 엔드포인트: `https://apply.workable.com/api/v3/accounts/<slug>/jobs?details=true`.
  - **SmartRecruiters**: `jobs.smartrecruiters.com/<slug>` 와 `careers.smartrecruiters.com/<slug>` 를 감지. 엔드포인트: `https://api.smartrecruiters.com/v1/companies/<slug>/postings`.
  - **Workday (beta)**: `<tenant>.wd<N>.myworkdayjobs.com/<lang>/<site>` 를 감지. 엔드포인트: `/wday/cxs/<tenant>/<site>/jobs` 로 POST. careers_url 이 site 를 생략하면 `site=External` 기본. 일부 테넌트가 CXS 를 CAPTCHA 뒤에 두기 때문에 beta — 그럴 경우 부모의 `/career-ops scan` (Playwright 구동) 으로 폴백합니다.

### 📚 문서

- **`docs(portals-examples): trending boards block`** — `docs/portals-examples.md` 에 v1.14.0 섹션이 추가되어 `tracked_companies` 용 paste-ready YAML 로 13개 trending 회사를 나열합니다: Greenhouse-hosted (Stripe, GitLab, HashiCorp, Cloudflare, Datadog, Hugging Face) 와 Ashby-hosted (Notion, Linear, PostHog, Replicate, Modal Labs, Fly.io, Render). 각 항목은 `enabled: false` 로 표시되어 사용자가 활성화 전에 slug 가 응답하는지 검증하도록 합니다. 더하여 각 패턴을 감지하는 URL 패턴이 포함된 Workable / SmartRecruiters / Workday 예제 블록.
- **`docs(framing): 42 ATS-phrase upgrades across 17 user-facing docs`** — 사용자 대상 문서의 "Greenhouse / Ashby / Lever" 가 등장하는 모든 곳이 이제 "Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday" 로 표시됩니다. 영향: README × 8 로케일 (EN/ES/PT-BR/RU/JA/KO/CN/TW), help 번들 × 8 로케일, PROJECT.md. 과거 CHANGELOG 항목과 버그 수정 처방 문서 (`qa/fixes/F-014`, `qa/FIX-PROMPT`) 는 의도적으로 손대지 않았습니다 — 과거 또는 이미 올바른 상태를 기술합니다.
- **`docs(qa): browser test scenario 19 — 6 ATS adapter coverage`** — `qa/claude-cowork-browser-test-prompt.md` 에 Scenario 19 가 추가되었습니다: `ALL_ADAPTERS.length === 6` 불변성, 6개 어댑터 모두에 대한 `resolveAdapter()` URL 감지 sweep, `#/scan` 의 Active Companies 카드 soft-check, `docs/portals-examples.md` 의 ATS 별 블록 구조 검사.

### 🧪 테스트

- `tests/adapter-registry.test.mjs` 가 3개의 신규 어댑터에 대한 7개 신규 테스트로 확장되었습니다 (Workable apply-URL 패턴, Workable 레거시 서브도메인 패턴, SmartRecruiters jobs.* + careers.* 패턴, 명시적 site 를 가진 Workday tenant.wd5.*, "External" 로의 Workday 기본 site 폴백, `ALL_ADAPTERS.length === 6` 불변성, `detectApi()` 레거시 형태 호환성).
- 합계: **386 / 386** 유닛 (이전 379; +7 순증). 0 실패.

### 검증

```
npm test                        # 386 / 386
node -e "import('./server/lib/portals/registry.mjs').then(m => console.log(m.ALL_ADAPTERS.length))"   # → 6

# Adapter detection sweep:
node -e "import('./server/lib/portals/registry.mjs').then(m => {
  console.log(m.resolveAdapter({ careers_url: 'https://apply.workable.com/foo/' }).adapter.id);          // → workable
  console.log(m.resolveAdapter({ careers_url: 'https://jobs.smartrecruiters.com/Bar' }).adapter.id);     // → smartrecruiters
  console.log(m.resolveAdapter({ careers_url: 'https://baz.wd5.myworkdayjobs.com/en-US' }).adapter.id);  // → workday
})"
```

### Out of scope (연기된 후속)

| 항목 | 비고 |
|---|---|
| 13개 trending Greenhouse/Ashby 회사를 위한 회사별 어댑터 레코드 | `docs/portals-examples.md` v1.14.0 블록이 사용자 paste 가능한 YAML 로 이들을 나열합니다; slug 검증 + 부모 `portals.yml` 로의 일괄 추가는 별도 단계입니다. |
| Workday CAPTCHA 폴백 자동화 | Workday 어댑터는 CXS 피드가 게이팅되면 throw 합니다; 계획된 폴백은 부모의 `/career-ops scan` (Playwright) 에 위임합니다. SPA 의 "scan" UX 에 이를 연결하는 것은 v1.15+ 입니다. |

---

## [1.13.0] — 2026-05-13

큰 슬라이스. v1.12.0 이후 백로그의 연기된 4개 항목을 한 릴리스로 모두 종료합니다: PR-4 (완전한 multer 파이프라인), 어댑터 레지스트리 (아키텍처적 F-018 후속), Batch evaluate SPA 페이지, 로케일 인식 mode-template scaffolding. 더하여 세션 중간에 발견된 다크 테마 테이블 수정.

### ✨ 기능

- **`feat(cv): multer-based multipart upload (PR-4 full)`** — `/api/cv/import` 가 이제 원본 octet-stream 계약 (`Content-Type: application/octet-stream` + `X-Filename`) 과 multer 로 적절히 파싱되는 `multipart/form-data` 양쪽을 수용합니다. v1.10.2 의 415-거부는 임시방편이었습니다; v1.13.0 이 진짜 수정입니다. 외부 클라이언트 (curl `-F`, Postman 기본, 모든 HTTP 클라이언트) 가 매끄럽게 동작합니다. 두 경로 모두 동일한 `importDocumentToMarkdown` 변환기 + `stripDangerousMarkdown` XSS 패스를 거칩니다. 신규 의존성: `multer ^2.1.1`.
- **`feat(portals): adapter registry`** — Greenhouse / Ashby / Lever fetcher 를 균일 계약 (`id`, `label`, `matches`, `buildEndpoint`, `fetch`) 으로 `server/lib/portals/adapters/*.mjs` 에 추출했습니다. 신규 `server/lib/portals/registry.mjs::resolveAdapter()` 가 단일 디스패치 표면입니다. `en-scanner.mjs::detectApi()` + `FETCHERS` 가 이제 레지스트리에 위임합니다; 레거시 반환 형태는 보존됩니다. 새 ATS 추가 = `adapters/` 아래 파일 하나를 떨어뜨리고 `ALL_ADAPTERS` 에 추가 — 스캐너 변경이 필요 없습니다.
- **`feat(batch): #/batch evaluate page`** — 신규 SPA 뷰 + 4개 엔드포인트 (`GET /api/batch`, `PUT /api/batch`, `GET /api/stream/batch`, `POST /api/batch/merge`). `batch/batch-input.tsv` 용 TSV 편집기, parallel/min-score/dry-run/retry 컨트롤, `bash batch/batch-runner.sh` 의 라이브 SSE 로그, 실행 후 `batch/tracker-additions/` 목록과 원클릭 `node merge-tracker.mjs`. Decision 그룹 아래의 사이드바 링크. 신규 i18n 키 21개 × 8 로케일.
- **`feat(prompts): locale-aware mode scaffolding`** — `buildModePrompt` + `buildEvaluationPrompt` 가 이제 부모의 영어 mode-template 본문을 8개 로케일에서 현지화된 scaffolding 텍스트 (역할 줄, "Read these files first", "User-supplied context") 로 감쌉니다. 부모의 `modes/<slug>.md` 본문은 영어로 유지됩니다 (CLAUDE.md 하드 룰 #1 에 따라 읽기 전용); career-ops-ui 의 주변 scaffolding 이 번역됩니다.

### 🎨 UX 수정

- **`fix(theme): dark-mode table hover + tab-btn`** — 하드코딩된 `#fafafa` / `#fff` / `#f7f7f7` 가 `var(--beach)` / `var(--paper)` / `var(--slate)` 토큰으로 교체되어 다크 팔레트 교체가 실제로 테이블 행과 탭 버튼에 도달합니다. boosted 스캔 행을 위한 `.row-boosted` 액센트 strip 을 추가했고 두 테마 모두에서 동작합니다.

### 🧪 테스트

- 신규 `tests/adapter-registry.test.mjs` (7 케이스) — 균일 계약, ATS 별 URL 감지, 명시적 `api:` 필드 우선, 일치 없을 시 null, 레거시 `detectApi()` 형태 보존.
- 신규 `tests/batch-endpoints.test.mjs` (5 케이스) — 빈 픽스처, TSV 라운드트립, URL 없음 거부, 1 MB 캡, 러너 누락 오류 프레임.
- 신규 `tests/locale-scaffold.test.mjs` (6 케이스) — en/ru/ja/ko 의 scaffold 문자열, `buildModePrompt`/`buildEvaluationPrompt` 통합, 영어 하위 호환.
- `tests/cv-upload-multipart-reject.test.mjs` 재작성 — 기존의 "multipart 는 415 를 반환" 계약이 이제 "multipart 가 multer 로 파싱됨" 계약입니다; cv.md 에 부작용 없음 불변성은 보존됩니다.
- 합계: **379 / 379** 유닛 (이전 360; +19 순증). 0 실패.
- 커버리지: **95.46 % 라인 / 84.06 % 브랜치**.
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright.

### Out of scope (연기된 후속 작업)

| 항목 | 비고 |
|---|---|
| 14개 신규 포털 어댑터 (Workable / SmartRecruiters / Workday / GitLab / HashiCorp / Cloudflare / Datadog / Stripe / Notion / Linear / Posthog / Hugging Face / Replicate / Modal Labs / Fly.io / Render) | 어댑터 레지스트리가 자리잡았습니다 — 신규 어댑터 추가는 이제 각각 파일 하나입니다. 14개 ATS 에 대한 포털별 리서치 + URL 패턴 + 엔드포인트 정규화는 별도 단계입니다. |
| 부모의 `modes/<slug>.md` 본문 번역 | 부모 파일은 CLAUDE.md 하드 룰 #1 에 따라 읽기 전용입니다. v1.13.0 의 로케일 인식 scaffolding 이 80 % 를 해결해주며; 전체 본문 번역은 `santifer/career-ops` 로의 upstream PR 이 필요합니다. |

### 문서

- `docs/reviews/REVIEW-2026-05-13-v1.13.0.md` — 세션 컨텍스트 + 어댑터 레지스트리 계약 + batch 흐름.
- 모든 8개 README: 배지 갱신 (tests 360 → 379, release v1.12.0 → v1.13.0).
- 모든 8개 CHANGELOG 가 이 항목을 받습니다.

---

## [1.12.0] — 2026-05-13

버그 수정 + UX + 브랜딩 패스. v1.11.1 이후 정직한 백로그에서 8개 항목을 종료합니다 (테스트 갭 #9–12, 콘솔 오류 #8, portals-dead 드리프트 #4, seniority_boost surface #6, F-018 엔드포인트 통합). 다크/라이트 테마 토글을 추가하고 모든 문서, 패키지 메타데이터, GitHub 저장소 설명에서 "Airbnb-styled" 브랜딩을 제거합니다.

### ✨ 기능

- **`feat(theme): dark/light toggle (v1.12.0)`** — top bar 의 신규 테마 버튼. light ↔ dark 순환; `localStorage.theme` 에 영속; 페이지 로드 시 pre-paint 부트스트랩 (`public/js/lib/theme-bootstrap.js`) 으로 복원되어 사용자가 잘못된 색상 스킴의 플래시를 보지 않습니다. 첫 방문자에게는 `prefers-color-scheme` 을 존중. `public/css/app.css` 의 `[data-theme="dark"]` 아래 전체 다크 팔레트 — 모든 컴포넌트가 CSS 사용자 속성을 읽으므로 교체가 한곳에서 중앙 집중됩니다.
- **`feat(scan): /api/stream/scan?source=ats|regional|both` (F-018 LITE)`** — 단일 통합 SSE 엔트리포인트. SPA 가 이제 두 단계 (ATS 먼저, 그다음 regional) 를 순차 구동하는 하나의 이벤트 스트림을 엽니다. 두 개의 별도 스트림을 체인하는 대신입니다. 레거시 `/api/stream/scan-en` + `/api/stream/scan-ru` 는 폐기된 별칭으로 활성 유지됩니다. runners-table `/api/stream/scan` 이 네임스페이스를 비우기 위해 `/api/stream/scan-parent` 로 이름이 변경되었습니다; 부모가 spawn 하는 `scan.mjs` 폴백은 보존됩니다.
- **`feat(scan): seniority_boost surface (canonical docs §3)`** — `en-scanner.mjs` 와 `ru-scanner.mjs` 모두 이제 `portals.yml::title_filter.seniority_boost` 를 읽고 매칭되는 잡에 `_boosted: true` + `_boostedBy: <keyword>` 를 찍습니다. SPA 는 boosted 행을 `#/scan` 결과 상단으로 정렬하고 title 어트리뷰트에 매칭 키워드를 담은 `⬆ boosted` 배지를 렌더링합니다. 신규 i18n 키 2개 (`scan.boosted`, `scan.boostedBy`) 가 8개 로케일에서 현지화됩니다.

### 🐛 버그 수정

- **`fix(ui): null-safe error message reads in 4 places (#8)`** — `app.js` (top bar doctor 버튼 + global-search pipeline add), `views/tracker.js` (112번 줄), `views/apply.js` (21번 줄), `views/evaluate.js` (32번 줄) 가 모두 이제 `(err && err.message) || '<fallback>'` 를 읽습니다. 이전에는 Error 페이로드 없는 Promise rejection 이 e2e teardown 동안 page-error 스트림에서 "Cannot read properties of undefined (reading 'message')" 를 던졌습니다.
- **`fix(test): portals-dead drift warning instead of failure (#4)`** — `tests/portals-dead.test.mjs::FIX-C3` 이 우리가 dead 로 표시한 slug 를 부모의 `templates/portals.example.yml` 이 다시 활성화시키는 방향으로 표류하면 실패했습니다. v1.12.0 은 그 단언을 stderr 경고로 변환하여 CI 가 부모 드리프트에서 녹색으로 통과합니다; 릴리스 결정은 수동으로 유지됩니다. slug 목록 `KNOWN_DEAD` 는 의도의 문서로서 보존됩니다.

### 📝 브랜딩 / 문서

- **`docs(brand): strip 'Airbnb' references from every doc (8 locales)`** — README.md, README.es.md, README.pt-BR.md, README.ko-KR.md, README.ja.md, README.ru.md, README.cn.md, README.zh-TW.md, CLAUDE.md, docs/architecture/FRONTEND.md, package.json, GitHub 저장소 설명이 모두 "Airbnb-styled" / "Airbnb-inspired" 표현에서 "Clean, docs-style" 로 이동했습니다. CSS 파일은 디자인 토큰 이름을 유지했습니다 (내부 식별자이며 외부 결합 없음) 만, 설명 주석은 재작성되었습니다.

### 🧪 테스트

- **신규 `tests/canonical-docs-coverage.test.mjs` (5 케이스)** 가 테스트 갭 #9–12 를 닫습니다: 모든 help 번들이 5개 정규 career-ops.org 가이드를 참조; 로케일당 16-H2 패리티 계약; 모든 README 가 정규 첫 페이지 + ≥ 3 서브 가이드를 참조; `#/reports` 뷰 소스가 점수 임계값 카드 scaffold 를 포함; i18n 번들이 모든 v1.11.x 신규 키를 8개 로케일 모두에서 포함.
- **신규 `tests/scan-consolidated.test.mjs` (6 케이스)** 가 F-018 LITE 를 다룹니다: `?source=ats|regional|both` 가 올바르게 디스패치; 알 수 없는 소스가 오류 프레임을 emit; 레거시 `/api/stream/scan-en` + `/api/stream/scan-ru` 가 폐기된 별칭으로 여전히 동작.
- 합계: **360 / 360** 유닛 (이전 349; +11 신규). 0 실패. 커버리지: **95.62 % 라인 / 84.37 % 브랜치** (94.59 에서 상승).
- 20 / 20 smoke E2E · 23 / 23 comprehensive E2E · **28 / 28 Playwright**.

### 📋 내부

- `docs/reviews/REVIEW-2026-05-13-v1.12.0.md` — 세션 컨텍스트, 연기 목록 요약, career-ops.org 콘텐츠 동기화를 위한 갱신 절차.
- 모든 8개 CHANGELOG 가 이 항목을 받습니다.
- GitHub 저장소 설명이 새 브랜딩에 맞게 갱신되었습니다.

### Out of scope (연기, v1.11.1 에서 변경 없음)

| 항목 | 이유 |
|---|---|
| Batch evaluate SPA 페이지 | 정규 문서당 CLI 전용 흐름; SPA 등가물은 신규 뷰 + ≥3 엔드포인트 + 픽스처가 필요합니다. 2–3일 단계. |
| 전체 어댑터 레지스트리 (8개 `server/lib/portals/adapters/*.mjs` + 14 신규 포털 + FE 재작성) | 이 릴리스의 F-018 LITE 가 API 표면을 통합합니다; 전체 아키텍처 리팩터는 남아 있습니다. |
| 전체 multer 파이프라인 (PR-4) | v1.10.2 가 415 envelope 로 데이터 손상 구멍을 닫았습니다; 전체 multipart 파서 + ConversionError envelope 는 자체 단계입니다. |
| Mode-template 번역 | 부모 프로젝트와의 조정이 필요합니다. |

---

## 이전 릴리스 (v1.11.x 및 v1.10.x)

v1.11.0 / v1.11.1 / v1.10.0–v1.10.3 의 상세 항목은 [영어 CHANGELOG](CHANGELOG.md) 에 있습니다. 요약:

- **v1.11.1 — 2026-05-13** · 폴리시 슬라이스: `#/apply` 의 Playwright 힌트, 통일된 태그라인, 대시보드 점수 임계값 카드. 349/349 테스트.
- **v1.11.0 — 2026-05-13** · 8개 help 번들과 8개 README 에 career-ops.org/docs 통합. 신규 `docs/career-ops-canonical.md`. Mode/Archetype/Pipeline/Tracker/Report/Scan history 개념 문서화. 348/349 테스트.
- **v1.10.3 — 2026-05-12** · 버그 수정 슬라이스: v1.10.2 회귀 실행의 11개 QA 결과 중 7개 종료.
- **v1.10.2 — 2026-05-12** · CV multipart 415 거부 (v1.13.0 multer 까지의 임시 패치); PDF 생성 수정.
- **v1.10.1 — 2026-05-09** · v1.10.0 릴리스 QA 회귀 실행의 중요 패치.
- **v1.10.0 — 2026-05-08** · `#/profile` 편집기 + CV 업로드 UX (pandoc/pdftotext/passthrough), 8개 로케일 × 16개 H2 help 패리티, 언어 전환기.

---

## [1.9.1] — 2026-05-08

프로덕션 준비도 패스. 표적화된 버그 수정 4건 (BF-1..BF-4), Playwright smoke 가 5에서 12 테스트로 확장되어 tracker / pipeline / reports / evaluate / config / cv 저장 라운드트립을 다룹니다. 모두 CI 에서 통과.

### 🐛 버그 수정

- **`fix(tracker): escape pipes + collapse newlines in every cell, not just notes (BF-1)`** — `"Acme | Co"` 같은 회사 이름이 이전에는 markdown 표 레이아웃을 깨뜨렸습니다 (파서가 셀을 둘로 분할). 셀 정화 (sanitization) 가 이제 company / role / reportSlug / notes 에 균일하게 적용됩니다; `parsers.mjs::parseMarkdownTable` 의 동반 수정이 GFM 준수 `\|` 이스케이프 지원을 추가하여 라운드트립이 무손실입니다.
- **`fix(config): wrap updateEnvFile in try/catch (BF-2)`** — `POST /api/config` 가 이전에는 permission-denied / 읽기 전용 파일시스템에서 처리되지 않은 rejection 을 일으켰습니다. 이제 깔끔한 500 `{ error: 'failed to write parent .env', details: [...] }` 를 반환합니다.
- **`fix(llm): soft cap on assembled prompt size for Anthropic SDK calls (BF-3 + BF-4)`** — `/api/evaluate`, `/api/deep`, `/api/mode/:slug` 의 Anthropic 분기가 이제 `bundleProjectContext + prompt` 가 200 KB (≈50K 토큰) 를 초과하면 413 으로 중단합니다. API 가 컨텍스트 크기 불평을 하도록 두는 대신 다초 라운드트립 + 토큰을 절약합니다. 캡은 어떤 현재 모델 상한보다도 충분히 낮습니다 (Sonnet 4.6 = 1M 컨텍스트).

### 🧪 Playwright smoke — 커버리지 확장

5 → **12** 테스트. 신규 케이스:

- `tracker view renders empty + accepts API-seeded row` — 회사 이름에 리터럴 파이프를 가진 행을 시드하고 라운드트립이 이를 보존하는지 단언하여 BF-1 을 행사.
- `pipeline add-URL form populates the queue` + 잘못된 URL 거부 sweep (loopback, `javascript:`, 빈 문자열).
- `reports view handles empty state` — non-crash 단언.
- `evaluate view returns a manual prompt without API key` — 폴백 체인 검증.
- `config GET returns known keys masked` — 비밀이 `/api/config` 를 통해 절대 누설되지 않음.
- `cv.md PUT round-trips with sanitization` — XSS 류 (script 태그, `javascript:` 스킴) 가 end-to-end 로 strip 됨.
- `pipeline preview proxy strips scripts` — 잘못된 URL 거부 경로.

### 📦 동작 변경 (API 계약 변경 없음)

- Tracker 쓰기가 이제 파이프가 포함된 company / role 이름에 대해 무손실입니다. 원시 파이프를 가진 기존 행은 다음 읽기에서 올바르게 파싱되기 시작합니다.
- `/api/{evaluate,deep,mode/:slug}` 가 이제 비합리적으로 큰 프롬프트 (200 KB+) 에서 502/타임아웃 대신 413 을 반환합니다.

### 🧪 테스트

- **284 유닛 테스트** (수 변경 없음; 파서 갱신 후에도 기존 테스트가 모두 녹색).
- **12 Playwright 브라우저 smoke 테스트** (이전 5).

---

## [1.9.0] — 2026-05-08

v1.8.0 백로그의 P-6 → P-10 이 한 번들로 출하되었습니다. 헤드라인: `server/index.mjs` 가 이제 130-LOC 오케스트레이터입니다 (762 에서 감소, 합계 1230 → 130 = -89%); 모든 라우트 토픽이 자체 모듈을 갖습니다. `/api/evaluate` 의 Anthropic 패리티, 멀티 CLI shim, 확장된 i18n 패리티 테스트, CI 에 연결된 Playwright 브라우저 smoke.

### 🏗️ P-6 — 서버 split-by-concern (phase 2)

P-2 의 연속. 나머지 9개 라우트 토픽을 `server/index.mjs` 에서 `server/lib/routes/<topic>.mjs` 모듈로 추출. `index.mjs` 는 이제 순수 오케스트레이터입니다: 미들웨어 (보안 헤더 + activity 로그 + static), 12개 `register<Topic>Routes(app)` 호출, SPA catch-all.

- `server/lib/routes/activity.mjs` — `/api/activity`.
- `server/lib/routes/config.mjs` — `/api/config` GET/POST (부모 .env 라운드트립).
- `server/lib/routes/health.mjs` — `/api/health` + `/api/dashboard`.
- `server/lib/routes/help.mjs` — `/api/help/:lang`.
- `server/lib/routes/jds.mjs` — `jds/*.txt` 의 전체 CRUD.
- `server/lib/routes/llm.mjs` — 모든 LLM 결합 엔드포인트 (evaluate, deep, mode, apply-helper, interview-prep).
- `server/lib/routes/pipeline.mjs` — 명명된 상수 (timeout / max-redirects / max-body) 가 포함된 SSRF-안전 preview proxy 를 포함한 `/api/pipeline*`.
- `server/lib/routes/reports.mjs` — `/api/reports*`.
- `server/lib/routes/tracker.mjs` — `/api/tracker` GET + dedup 인식 POST.

동작 변경 없음. 모든 단계에서 283/283 유닛 테스트가 녹색을 유지했습니다. 오케스트레이터의 import surface 가 47줄에서 22줄로 떨어졌습니다.

### 🔌 P-7 — `/api/evaluate` 의 Anthropic 패리티

`/api/evaluate` 는 이전에 Gemini 또는 manual 이었습니다. v1.9.0 은 Anthropic 분기를 추가합니다 (두 키가 모두 있을 때 선호). `/api/deep` 와 `/api/mode/:slug` 가 이미 사용하는 라우팅 규칙을 미러링합니다. 모델이 cv / profile / mode 템플릿을 인라인으로 갖도록 `bundleProjectContext({ modeSlugs: ['_shared', 'oferta'] })` 를 통해 라우팅됩니다 (REVIEW-A1).

신규 엔드포인트: **`POST /api/evaluate/test-anthropic`** — `ANTHROPIC_API_KEY` 용 smoke 검사, 기존 Gemini smoke 를 미러링. 작은 프롬프트 (≤256 출력 토큰) 를 보내므로 사실상 비용이 없습니다; 200자 샘플을 반환합니다.

폴백 체인은 이제: Anthropic → Gemini → manual.

### 🌐 P-8 — Help-center i18n 패리티 (감사 + 테스트 강화)

모든 `docs/help/<lang>.md` 의 구조 패리티를 감사했습니다. 8개 로케일이 이미 동일한 14개 정규 h2 섹션을 다룹니다. 테스트 업그레이드:

- `tests/help-ui.test.mjs::every help doc covers the same 14 sections` 가 en + ru 만 확인하고 있었습니다. 이제 **8개 로케일 전체** (en, es, pt-BR, ko-KR, ja, ru, zh-CN, zh-TW) 를 순회하며 각각에 대해 섹션 수를 단언합니다.
- 신규 테스트: `tests/help-ui.test.mjs::every help locale has substantive content` — 각 비영어 로케일이 `en.md` 바이트 길이의 최소 30% 인지 단언하여 로케일 스텁을 방어합니다. 컴팩트 번역은 자연히 40-50% 에 도달합니다; 스텁은 한 자리 % 일 것입니다.

결과: 구조 패리티가 이제 CI 강제됩니다.

### 🤖 P-9 — CI 매트릭스의 Playwright 브라우저 smoke

`tests/playwright-smoke.mjs` (v1.8.0 에서 옵트인으로 추가됨) 가 이제 CI 워크플로의 일부입니다. 기존 `e2e` 잡이 이미 Playwright + Chromium 을 설치합니다; 신규 스텝 (`npm run test:e2e:browser`) 하나가 comprehensive Node E2E 직후에 5개 브라우저 smoke 테스트를 실행합니다.

CI 의 순서: 유닛 (Node 18/20/22 매트릭스) → smoke node E2E → comprehensive node E2E → **Playwright 브라우저 smoke** → 실패 시 스크린샷 아티팩트 업로드.

### 🌍 P-10 — 멀티 CLI 호환성

부모 career-ops v1.7.0 이 멀티 CLI / Open Agent Skill 표준 지원을 도입했습니다. UI 서브 프로젝트는 정규 `CLAUDE.md` 를 가리키는 얇은 shim 으로 동일한 관례를 따릅니다:

- `web-ui/AGENTS.md` — Codex / Aider / 범용 CLI 엔트리포인트.
- `web-ui/GEMINI.md` — Gemini CLI 엔트리포인트.

두 shim 모두 하드 룰과 빠른 참조를 재진술하지만 전체 프로젝트 수준 지침은 `CLAUDE.md` 에 위임하므로 비-Claude CLI 도 Claude Code 세션과 동일한 오리엔테이션에 도착합니다. 배포된 UI 자체는 런타임에서 CLI 무관입니다.

### 🧪 테스트

- **284 유닛 테스트** (이전 283): +1 신규 help-locale 패리티 테스트.
- **5 Playwright 브라우저 smoke 테스트** — 이제 옵트인이 아니라 CI 의 일부.
- 커버리지 유지.

### 🔧 변경된 파일

```
+ server/lib/routes/activity.mjs              + server/lib/routes/config.mjs
+ server/lib/routes/health.mjs                + server/lib/routes/help.mjs
+ server/lib/routes/jds.mjs                   + server/lib/routes/llm.mjs
+ server/lib/routes/pipeline.mjs              + server/lib/routes/reports.mjs
+ server/lib/routes/tracker.mjs
+ AGENTS.md                                   + GEMINI.md

~ server/index.mjs (762 → 130 LOC, -83%)
~ .github/workflows/ci.yml (Playwright smoke step)
~ tests/help-ui.test.mjs (all-8-locales section parity + content-floor)
~ docs/{ROADMAP,architecture/{OVERVIEW,SERVER}}.md
~ docs/sdd/CONVENTIONS.md
~ CLAUDE.md
~ package.json (1.8.0 → 1.9.0)
```

### 📦 신규 REST 엔드포인트

| Method | Path | 용도 |
|---|---|---|
| `POST` | `/api/evaluate/test-anthropic` | `ANTHROPIC_API_KEY` 용 smoke 검사 (P-7). `/api/evaluate/test-gemini` 를 미러링. |

### 🤖 신규 CLI 엔트리포인트

| 파일 | CLI | 비고 |
|---|---|---|
| `AGENTS.md` | Codex / Aider / 범용 | 전체 지침을 위해 `CLAUDE.md` 를 가리킵니다. |
| `GEMINI.md` | Gemini CLI | 세션 시작 시 Gemini 가 자동 로드합니다. |

---

## [1.8.0] — 2026-05-08

강화, 리팩터, SDD 부트스트랩. 고위험 정확성/보안 수정 3건 (A1, A2, A3), 중간 4건 (B1–B4), 정리 6건, 부모 career-ops v1.7.0 표면 감사, 서버 split-by-concern (P-2 phase 1), Playwright 브라우저 smoke 하니스, `docs/` 와 `.claude/` 아래 전체 SDD 기반.

### 🔥 고위험 수정

- **`fix(deep): inline cv/profile/mode files for Anthropic SDK calls (REVIEW-A1)`** — `/api/deep` 와 `/api/mode/:slug` 가 이전에는 모델에게 "이 파일들을 먼저 읽어라" 라고 했지만 Anthropic SDK 에는 파일시스템이 없습니다. 출력이 비어 있었습니다. 신규 `bundleProjectContext({ modeSlugs })` 가 `cv.md`, `config/profile.yml`, `modes/_shared.md`, 그리고 mode 템플릿을 읽고 각각을 16 KB 에서 자른 뒤 프롬프트 앞에 `<project_context>` 블록을 추가합니다. 라이브 검증: `claude-sonnet-4-6` 의 deep-research 호출에서 26 KB 의 근거 있는 markdown 응답.
- **`fix(runner): SIGKILL escalation after SIGTERM grace period (REVIEW-A2)`** — `runNodeScript` 와 `streamNodeScript` 가 이전에는 타임아웃 / 클라이언트 연결 끊김에서 `SIGTERM` 만 보냈습니다. syscall (DNS, 블록된 소켓) 에서 멈춘 자식 프로세스가 이를 무시하여 Node 의 GC 가 회수할 때까지 SSE 연결이 매달렸습니다. 이제 각 경로가 5초 워치독을 무장하여 `SIGKILL` 로 에스컬레이션합니다. Promise 가 항상 해결됩니다.
- **`fix(runner): max-runtime cap on streaming endpoints (REVIEW-A3)`** — 모든 SSE 스크립트 러너 (`/api/stream/{scan,liveness,pdf}`) 가 이제 하드 30분 한도를 갖습니다. 만료 시: `event: error { message: 'maximum runtime exceeded' }` emit, A2 워치독으로 자식 프로세스 종료, 응답 종료.

### 🛡️ 중간 위험 수정

- **`fix(preview): per-hop redirect validation in /api/pipeline/preview (REVIEW-B1)`** — `redirect: 'follow'` 에서 수동 redirect 워킹으로 전환. 각 `Location` 헤더가 `isValidJobUrl` 로 재검증됩니다; 3홉으로 캡. 적대적 보드가 더 이상 loopback / 사설 IP / `file://` 로 우리를 튕길 수 없습니다. 거부 경로를 다루는 신규 테스트 4개.
- **`refactor(keys): hasGeminiKey helper unifies LLM-key checks (REVIEW-B2)`** — 라우트 핸들러의 직접 `process.env.GEMINI_API_KEY` 읽기가 `lib/anthropic.mjs` 의 `hasGeminiKey()` 로 교체되었습니다. 일관성과 더 쉬운 모킹을 위해 `hasAnthropicKey()` 형태를 미러링합니다.
- **`feat(scanners): thread AbortSignal through hh.ru, Habr, Greenhouse, Ashby, Lever (REVIEW-B3)`** — SSE 클라이언트가 스캔 중간에 연결을 끊으면, 진행 중인 HTTP fetch 가 이제 모든 쿼리를 완료까지 실행하고 이벤트를 드롭하는 대신 abort 됩니다. `runRuScan` 과 `runEnScan` 이 `opts.signal` 을 수용합니다; `/api/stream/scan-{ru,en}` 의 SSE 핸들러가 `AbortController` 를 생성하고 `res.close` 에서 abort 합니다.
- **`test(anthropic): log-guard test prevents future API-key leaks via console (REVIEW-B4)`** — `runAnthropic` happy + error 경로 동안 모든 `console.{log,info,warn,error,debug}` 호출을 캡처하여 0 출력과 canary 키 문자열이 절대 등장하지 않음을 단언합니다. 미래의 `console.log(opts)` 회귀에 대한 심층 방어.

### 🧹 저위험 폴리시

- **`fix(parsers): defense-in-depth URL gate inside addPipelineUrl (REVIEW-C4)`** — 라우트 수준 `isValidJobUrl` 을 보완하는 파서 수준의 비-http(s) 값 거부. 더 엄격한 규칙을 원하는 호출자를 위한 옵션 `opts.validate`.
- **`docs(readme): badge "tests-88 passed" → "tests-277 passed" (REVIEW-C3)`** — 자릿수가 틀렸습니다.
- **`test(i18n): missing-keys diff grouped by locale (REVIEW-C6)`** — `tests/i18n-coverage.test.mjs` 가 갭을 찾으면 출력이 이제 혼합된 줄 대신 `[ru] (3): foo, bar, baz` 입니다.
- **`docs(review): C1 closed as resolved-on-inspection`** — 정화 (sanitizer) 정규표현식이 이미 `\x00-\x08` 16진 형태였습니다; 리뷰 항목은 도구 렌더링 아티팩트였습니다.

### 🏗️ P-2 phase 1 — 서버 split-by-concern

`server/index.mjs` 가 1230 LOC 로 800줄 상한을 한참 넘었습니다. 동작 변경 없이 집중된 모듈로 분할했습니다. 모든 단계에서 283 유닛 테스트가 녹색을 유지했습니다.

- `server/lib/security.mjs` — `isValidJobUrl`, `stripDangerousMarkdown`, `sanitizeJobDescription`, `isPubliclyExposed`. 외부 컨슈머와의 하위 호환을 위해 `index.mjs` 에서 재내보냅니다.
- `server/lib/prompts.mjs` — `bundleProjectContext`, `buildEvaluationPrompt`, `buildDeepPrompt`, `buildModePrompt`, `buildApplyChecklist`.
- `server/lib/store.mjs` — `safeReadApps`, `safeReadPipeline`, `safeListReports`, `checkProfileCustomized`, `ensureRussianPortalsDefaults`.
- `server/lib/routes/scan.mjs` — `/api/stream/scan-{ru,en}`, `/api/scan-ru/config`, `/api/scan-results` 용 `registerScanRoutes(app)`.
- `server/lib/routes/runners.mjs` — 버퍼링된 `/api/run/*` 표, 스트리밍 `/api/stream/{scan,liveness,pdf}`, 생성된 PDF 목록/다운로드용 `registerRunnerRoutes(app)`.
- `server/lib/routes/content.mjs` — CV / Profile / Portals / Modes 용 `registerContentRoutes(app)`.

`index.mjs` 는 이제 762 LOC 입니다 (-38%, 800 캡 아래). Phase 2 는 tracker, pipeline, reports, jds, llm (evaluate/deep/mode), health 를 라우트 모듈로 추출할 것입니다. 오케스트레이터의 목표 <500 LOC.

### 🔍 부모 career-ops v1.7.0 감사

사용자가 부모 프로젝트를 v1.7.0 으로 갱신했습니다. 모든 소비 표면을 감사했습니다 — UI 는 완전히 호환됩니다. 주목할 발견은 `docs/architecture/DATA-FLOWS.md` 에 문서화되어 있습니다:

- 모드 카탈로그가 7 → 19 파일로 성장했습니다. UI 의 `MODE_ALLOWLIST` 는 의도적으로 7개만 surface 합니다 (나머지는 Claude-Code 전용). 의도적인 좁은 범위를 설명하는 주석이 추가되었습니다.
- `portals.yml` 스키마 확인: `tracked_companies` (96 항목, 87 활성화, 71 개가 API 보유). EN 스캐너가 이를 올바르게 읽습니다; 레거시 `companies` 키도 여전히 지원됩니다.
- 오늘 소비되지 않는 신규 부모 표면: `dashboard/` (Go 프로그램), `update-system.mjs`, `generate-latex.mjs`, `analyze-patterns.mjs`, `liveness-core.mjs`, `followup-cadence.mjs`, `test-all.mjs`, 현지화된 mode 서브디렉토리 (`de/fr/ja/pt/ru`).
- 라이브 `/api/dashboard`, `/api/health`, `/api/modes`, `/api/portals`, `/api/profile`, `/api/cv`, `/api/jds`, `/api/reports`, `/api/tracker`, `/api/pipeline`, `/api/evaluate`, `/api/deep`, `/api/stream/scan-en` 이 모두 녹색으로 검증되었습니다.

### 🤖 SDD / GSD 부트스트랩

`career-ops-ui` 는 이제 GSD 파이프라인 (`superpowers@claude-plugins-official` 의 `gsd-*` 스킬) 과 정렬된 전체 Spec-Driven Development 기반을 갖습니다.

- `CLAUDE.md` (루트) — 프로젝트 수준 에이전트 시스템 프롬프트: 스택, GSD 파이프라인, 하드 룰 (부모 계약, 보안 영역, `--no-verify` 금지), 관례, 부모 프로젝트 경계.
- `.aiignore` — AI 에이전트용 제외 목록: vendored, 바이너리, 부모 사용자 데이터, `.planning/`, `.env`, 로케일 중복.
- `.claude/agents/` — 세 개의 프로젝트별 서브에이전트 정의:
  - `web-ui-route-reviewer.md` — 신규 라우트를 SSRF, CSP, 정화 (sanitizer), 부모 쓰기 계약, 관례, 테스트에 대해 게이팅합니다.
  - `spa-view-reviewer.md` — CSP 안전 DOM, i18n, 라우터 등록, 접근성.
  - `test-isolation-reviewer.md` — 테스트가 CI 격리되어 있는지 검증합니다 (부모 프로젝트 가정 없음, 라이브 네트워크 없음, 포트 충돌 없음).
- `.claude/commands/` — 슬래시 커맨드 스텁: `/sdd-status`, `/codebase-tour`.
- `docs/` 트리 — 모두 영어로:
  - `PROJECT.md` — what/why/for-whom, 범위, 제약, 성공 기준.
  - `ROADMAP.md` — 현재 마일스톤 + 완료 이력 + 백로그.
  - `sdd/SDD-GUIDE.md` — `gsd-*` 스킬에 매핑된 discuss → spec → plan → execute → verify → review 파이프라인.
  - `sdd/CONVENTIONS.md` — 모듈 시스템, 명명, 라우트, 정화 (sanitizer), 클라이언트 패턴, i18n, 오류, 로깅, 테스트, 커밋, 브랜치, CSS.
  - `architecture/OVERVIEW.md` — 최상위 다이어그램, 계층, 부팅 시퀀스, 불변성, "…일 때 먼저 볼 곳" 치트시트.
  - `architecture/SERVER.md` — `server/lib/*.mjs` 의 파일별 맵 (P-2 분할에 맞게 갱신).
  - `architecture/FRONTEND.md` — SPA 구조, 뷰 인벤토리, 전역, "뷰 추가 방법".
  - `architecture/API.md` — 모든 `/api/*` 라우트의 전체 인벤토리.
  - `architecture/DATA-FLOWS.md` — 명시적 사용자 액션 계약을 가진 모든 부모 프로젝트 읽기/쓰기.
  - `reviews/REVIEW-2026-05-07.md` — 이 변경 로그의 수정을 낳은 정적 리뷰.

### 🔒 보안 & 저장소 위생

- **`chore(.gitignore): comprehensive defense-in-depth patterns`** — env 변종, IDE 폴더, GSD 스크래치 (`.planning/`), 사용자별 에이전트 설정 (`.claude/settings.local.json`, `.claude/cache/`, `.claude/state/`, `.claude/memory/`), Playwright 아티팩트 (`playwright-report/`, `test-results/`, `.playwright/`, `trace.zip`), heap/CPU 프로파일, 미출하 도구의 락 파일, 확장된 macOS Finder 노이즈, 범용 비밀 패턴 (`secrets.json`, `credentials.json`, `*.pem`, `*.key`) 를 다룹니다.

### 🧪 테스트

- **283 유닛 테스트** (이전 277): +6 신규 (B1 redirect 거부용 4개, `hasGeminiKey` 용 1개, `runAnthropic` 로그 가드용 1개).
- **5 Playwright 브라우저 smoke 테스트** (신규, `npm run test:e2e:browser` 를 통한 옵트인): 대시보드 렌더 + 버전 푸터, 대시보드 → 스캔 → 파이프라인 → cv 내비게이션, 언어 전환 영속, 404 뷰, health 페이지 렌더. Playwright 를 부모의 `node_modules` 를 통해 해결합니다 — 신규 의존성 없음.
- 커버리지가 ~93% 라인 / ~83% 브랜치로 유지됩니다.

### 📝 신규 / 갱신된 package.json 스크립트

| 스크립트 | 용도 |
|---|---|
| `npm run test:e2e:browser` | in-process 서버에 대해 Playwright smoke 하니스 실행 (5 테스트). |

### 🔧 변경된 파일

```
+ CLAUDE.md                                    +  .aiignore
+ docs/PROJECT.md                              +  docs/ROADMAP.md
+ docs/sdd/SDD-GUIDE.md                        +  docs/sdd/CONVENTIONS.md
+ docs/architecture/OVERVIEW.md                +  docs/architecture/SERVER.md
+ docs/architecture/FRONTEND.md                +  docs/architecture/API.md
+ docs/architecture/DATA-FLOWS.md              +  docs/reviews/REVIEW-2026-05-07.md
+ .claude/agents/web-ui-route-reviewer.md      +  .claude/agents/spa-view-reviewer.md
+ .claude/agents/test-isolation-reviewer.md
+ .claude/commands/sdd-status.md               +  .claude/commands/codebase-tour.md
+ server/lib/security.mjs                      +  server/lib/prompts.mjs
+ server/lib/store.mjs
+ server/lib/routes/scan.mjs                   +  server/lib/routes/runners.mjs
+ server/lib/routes/content.mjs
+ tests/playwright-smoke.mjs

~ .gitignore                                   ~  README.md (badge fix)
~ package.json (1.7.2 → 1.8.0)
~ server/index.mjs (1230 → 762 LOC)
~ server/lib/runner.mjs (SIGKILL escalation, max-runtime cap)
~ server/lib/anthropic.mjs (hasGeminiKey)
~ server/lib/parsers.mjs (URL gate in addPipelineUrl)
~ server/lib/ru-scanner.mjs                    ~  server/lib/en-scanner.mjs
~ server/lib/sources/{hh,habr,greenhouse,ashby,lever}.mjs (signal threading)
~ tests/anthropic.test.mjs                     ~  tests/i18n-coverage.test.mjs
~ tests/pipeline-preview.test.mjs
```

---

## [1.7.2] — 2026-05-04

Help 센터, in-UI App settings, 모바일 사이드바, 단일 Scan 버튼, 모든 프롬프트 빌더의 "Show result" 단축.

### ✨ 신규 기능

- **`feat(help): in-app user guide` (`/#/help`)** — 신규 사이드바 항목에서 접근 가능한 장문 Markdown 문서. 모든 페이지를 단계별로 다룹니다: 빠른 시작, CV 편집기, Profile, 스캔 필터, Pipeline preview, Evaluate, Deep research, Apply, Tracker, Reports, 모든 7개 모드, Activity log, Health, 설정 힌트. `<h2>` 헤딩에서 자동 구축되는 sticky 목차, 동기적 DOM 빌드 (경쟁 상태 없음). 지원되는 8개 로케일 모두에 현지화.
- **`feat(config): in-UI App settings page` (`/#/config`)** — 브라우저에서 `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `HH_USER_AGENT`, `PORT`, `HOST` 를 편집합니다. **부모 프로젝트의** `.env` 파일에 쓰므로 career-ops Node 스크립트와 web-ui 의 dotenv 로더가 같은 소스를 가져갑니다. 비밀 키는 읽기 시 마스킹됩니다 (앞/뒤 4자). 모델 필드는 큐레이션된 목록의 드롭다운입니다 (claude-sonnet-4-6 / claude-opus-4-7 / claude-haiku-4-5 / gemini-2.0-flash / etc.). 빈 값은 키를 삭제합니다. 값이 즉시 실행 중인 process.env 에 적용됩니다 — 대부분의 설정은 재시작 없음.
- **`feat(modes): "⚡ Show result" button alongside "Copy prompt"`** — manual 모드에서 프롬프트가 생성될 때 사용자가 LLM 결과를 얻기 위해 입력을 재입력하지 않아도 됩니다. 신규 버튼이 동일한 폼을 `run: true` 로 재제출하고, 키가 구성되지 않았을 때는 명확한 toast (`Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env first`) 로 폴스루합니다. `/#/deep`, `/#/project`, `/#/training`, `/#/followup`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns` 에서 동작합니다.

### 🐛 UX + UI 수정

- **`fix(scan): single Scan button replaces three (Scan all + EN + RU)`** — 압도적인 선택이고, 99% 경우 동일한 기본값입니다. 통합된 `🌐 Scan` 버튼이 모든 활성화된 소스를 실행합니다. Help 문서가 8개 로케일에서 갱신되었습니다.
- **`fix(ui): mobile sidebar drawer`** — 뷰포트 <900px 가 이제 top bar 에 햄버거 버튼 (☰) 을 받습니다; `body.sidebar-open` 이 사이드바를 슬라이드 인 시키는 CSS transform 을 토글합니다. backdrop 어둡게 + 아무 곳이나 클릭하면 닫힘. 앵커 클릭 + hashchange 가 자동 닫기를 일으켜 사용자가 drawer 가 접힌 상태로 새 페이지에 도착합니다. 더 큰 뷰포트는 영향이 없습니다.
- **`fix(server): footer version reflects web-ui, not the parent VERSION`** — `/api/health` 가 이제 web-ui 자체의 `package.json` 을 읽습니다. 푸터가 더 이상 부모의 버전 파일에서 오래된 `1.6.0` 을 누설하지 않습니다. 부모의 VERSION 은 여전히 `parentVersion` 으로 별도 노출됩니다.

### 📦 신규 REST 엔드포인트

| Method | Path | 용도 |
|---|---|---|
| `GET`  | `/api/help/:lang` | 요청된 로케일의 Markdown 사용자 가이드를 반환, `en.md` 로 폴백. 경로 탐색 안전. |
| `GET`  | `/api/config` | 모든 알려진 env 키의 현재 값 반환; 비밀 마스킹됨. |
| `POST` | `/api/config` | 주어진 키를 부모 프로젝트의 `.env` 에 쓰고, 각 값을 검증하며, `process.env` 에 라이브 적용. |

### 🌐 i18n

- `nav.help`, `nav.config`, `help.*`, `config.*`, `deep.showResult`, `deep.needKey`, `scan.btnRun` 에 걸쳐 30+ 신규 키. 8개 로케일 모두 채워졌습니다.

### 🧪 테스트

- `tests/help.test.mjs` (12 케이스) — 모든 지원 로케일이 실질적인 markdown 을 반환, EN 이 모든 페이지 slug 를 spot-check, 알 수 없는 lang → EN 폴백, 경로 탐색 정화, 모든 로케일이 `cv.md` / `profile.yml` / `.env` 를 참조.
- `tests/help-ui.test.mjs` (9 케이스) — 뷰 파일 등록, 사이드바 항목, 모든 로케일에 i18n 키 존재, 모든 로케일용 docs 파일 존재, EN/RU help 가 14개 정규 섹션 보유, 모든 #/foo 라우트 커버됨, deep + mode-page 의 Show-result 배선.
- `tests/env-config.test.mjs` (18 케이스) — `parseEnv`, `maskSecret`, `validateConfig`, `updateEnvFile` (부트스트랩, 주석을 보존하는 in-place 재작성, 빈 값 삭제, 필요시 따옴표) 의 순수 함수 테스트.
- `tests/config-endpoint.test.mjs` (8 케이스) — GET 이 비밀 마스킹 / env 경로 반환; POST 가 부모 .env 에 쓰기; 라이브 process.env 적용; 빈 값이 unsets; 알 수 없는 키 + 잘못된 형식의 Anthropic 키를 400 으로 거부.

### 📊 통계

- **테스트:** 233 → **277** (+44, 4개 신규 테스트 파일).
- **E2E:** 20 smoke + 23 comprehensive = 43 Playwright 단계, 모두 녹색.
- **커버리지:** 93.5% 라인 / 82.6% 브랜치 / 93.7% 함수 (변경 없음 — 신규 코드는 완전히 테스트됨).

---

## [1.7.1] — 2026-05-04

v1.7.0 이후 작업을 쌓는 패치 릴리스: 파이프라인 preview 패널, Anthropic API 통합, 스크롤 가능 사이드바, dotenv 로더, 동적 Active-companies 목록, CI 워크플로 강화.

### ✨ 파이프라인 Preview 패널

- **`/#/pipeline` 개편** — 왼쪽 목록 + 오른쪽 preview 패널. 모든 URL 을 클릭하여 서버 사이드 프록시 스냅샷 (`GET /api/pipeline/preview` 가 script/style/태그를 strip 하고 8 KB 에서 캡, `isValidJobUrl` 로 검증) 을 가져옵니다. 라이브 필터 입력, "In queue" 카운터, ⚡ "Evaluate first" 헤더 버튼. 모든 행의 인라인 ▶/✕ 와 preview 패널의 전체 Evaluate / Open in tab / Delete. `data-url` + `.pipeline-row` + `.pipeline-row-delete` 클래스로 안정된 테스트 셀렉터. `tests/pipeline-preview.test.mjs` 의 **8개 신규 테스트** (목 fetch, upstream 바인딩 불필요).

### ✨ Anthropic API 통합 — 모든 곳에서 "Run live"

- **`server/lib/anthropic.mjs`** — Anthropic Messages API 용 제로 의존성 클라이언트 (claude-sonnet-4-6 기본, `ANTHROPIC_MODEL` 로 재정의). `ANTHROPIC_API_KEY` 가 설정되면 모든 모드 페이지 (`/#/deep`, `/#/project`, `/#/training`, `/#/batch`, `/#/contacto`, `/#/interview-prep`, `/#/patterns`) 가 **주요** 액션으로 "⚡ Run live (Anthropic)" 버튼을 렌더링합니다 — 클릭 시 프롬프트를 실행하고 Claude Code 로 핸드오프하는 대신 Markdown 을 브라우저로 다시 렌더링합니다. Gemini 키만 설정된 경우 Gemini 가 폴백으로 유지됩니다. 키가 전혀 없어도 manual 모드는 여전히 동작합니다. `tests/anthropic.test.mjs` 의 **8개 신규 테스트**.

### 🐛 CI / 파이프라인 수정

- **`fix(api): tighten pipeline URL validator` (FIX-M7)** — 이제 loopback 호스트네임, 길이 <10 또는 >2000, URL 내 공백도 거부합니다.
- **`fix(server): actually load .env so HH_USER_AGENT / GEMINI_API_KEY hints work`** — `server/lib/dotenv.mjs` (35줄 제로 의존성 로더) 를 추가하여 `server/index.mjs` 상단에 배선했습니다. 스캐너 코드의 런타임 힌트가 마침내 무언가를 합니다. **6개 신규 테스트**.
- **`fix(ui): scrollable sidebar`** — 6개 그룹의 18개 내비 항목이 짧은 뷰포트를 오버플로우했습니다. `.sidebar` 가 이제 thin 사용자 정의 스타일 스크롤바와 함께 `overflow-y: auto` 를 갖습니다.
- **`fix(ui): make HH_USER_AGENT banner dismissible`** — 그러다 과한 것이라고 판단하여 `/scan` 에서 완전히 제거했습니다. Health 페이지 검사가 여전히 이를 noted 합니다.
- **`fix(scan): Active companies list is now collapsible + filterable + grouped`** — 평면 87 태그는 압도적이었습니다. 이제 "▸ Active companies 87/71" 토글이 정렬된 목록을 펼칩니다 (✓ API 지원 먼저, ○ 웹 검색 두 번째) 더하기 검색 필터.
- **`fix(test): isolate api.test.mjs + en-scanner.test.mjs from parent project`** — 둘 다 이제 tmp 프로젝트 루트를 띄우므로 web-ui 옆에 부모를 체크아웃하지 않고도 CI 가 동작합니다.
- **`fix(workflow): publish-package version-match only on release events`** — main 에서의 `workflow_dispatch` 가 더 이상 tag/version 검사를 실패시키지 않습니다.
- **`fix(e2e): stable selector for pipeline row delete`** — 앵커 래퍼 복원 + `data-url` 어트리뷰트 추가로 e2e 스위트의 셀렉터가 안정됩니다.

### 📦 신규 REST 엔드포인트

| Method | Path | 용도 |
|---|---|---|
| `GET` | `/api/pipeline/preview?url=…` | 서버 사이드 프록시: URL 의 가시 텍스트 스냅샷 반환 (script/style 제거, 8 KB 캡), `isValidJobUrl` 로 게이팅. |

### 📊 이 배치 후 통계

- **테스트:** 225 → **233** (v1.7.0 위에 +8).
- **테스트 파일:** 25 → **26**.
- **E2E:** 20 + 23 = 43 Playwright 단계, 모두 녹색.

---

## [1.7.0] — 2026-05-03

QA r5 가 구동한 35커밋 강화 + UX + 기능 완성 패스. 보안 레이어 3개 (XSS 정화, CSP, 입력 검증) 가 도착했고, 누락된 CRUD 엔드포인트가 채워졌고, 부모 프로젝트 부트스트랩이 이제 완전히 자동화되었으며, UI 는 **신규 페이지 9개** 를 얻었습니다 — Activity, 재설계된 Deep Research, 더하여 부모의 `modes/` 의 100% 를 다루는 7개의 사이드바 그룹화된 모드 (project / training / followup / batch / outreach / interview-prep / patterns). 파이프라인이 서버 사이드 preview 패널을 얻었습니다. Anthropic API 통합이 모든 모드에서 "Run live" 를 원클릭으로 만듭니다. 테스트 커버리지가 **73** 에서 **225** 로, **25개 테스트 파일** 에 걸쳐 갔고, **23개 comprehensive Playwright e2e 단계** 도 있습니다. GitHub Actions 가 CI / AI 리뷰 / Release / Publish-Package 워크플로를 출하합니다.

### 🔒 보안

- **`fix(cv): sanitize CV markdown to block stored XSS in preview` (FIX-C10)** — `PUT /api/cv` 가 이제 `cv.md` 를 쓰기 전에 `<script>`, `<iframe>`, `<object>`, `<embed>`, `<style>`, `<form>`, `<svg>`, `on*=` 이벤트 핸들러, `javascript:`/`vbscript:`/`data:text/html` URI 를 strip 합니다. 본문 1 MB 캡 (오버플로 시 413). 클라이언트 사이드 `UI.md()` 는 어떤 markdown 변환도 실행되기 전에 모든 바이트를 escape 하도록 재작성되어 원시 HTML 이 절대 `innerHTML` 에 도달할 수 없습니다. 링크 `href` 어트리뷰트는 안전한 스킴 (`http`/`https`/`mailto`/`tel`/상대 + `data:image` 만) 의 allowlist 에 대해 검증됩니다. strip 헬퍼와 HTTP 라운드트립에 걸친 신규 테스트 17개.
- **`fix(server): add CSP and baseline security headers` (FIX-L2)** — 모든 응답이 이제 `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin` 을 운반합니다. 서버가 loopback 너머에 바인딩되면 (`HOST` ≠ `127.0.0.1`/`::1`/`localhost`), 엄격한 `Content-Security-Policy` 가 위에 레이어링됩니다: `default-src 'self'`, `script-src 'self'` (no `unsafe-inline`), Google Fonts whitelisted, `connect-src 'self'` 가 XSS 유출을 차단. `index.html` 과 `router.js` 의 인라인 `onclick` 핸들러가 엄격한 CSP 를 손상시키지 않도록 `addEventListener` 로 이동되었습니다. 5개의 다른 `HOST` 값에 걸쳐 CSP 를 게이팅하는 신규 테스트 8개.
- **`fix(api): tighten pipeline URL validator` (FIX-M7)** — `POST /api/pipeline` 가 이전에는 `"not-a-url"` 을 수용하고 영속화했습니다. 이제 `isValidJobUrl()` 이 빈 문자열, <10 또는 >2000 자 입력, 공백 포함 URL, 비-`http(s)` 스킴, loopback 호스트네임 (`localhost`/`127.0.0.1`/`::1`) 을 거부합니다. **FIX-M3** + **FIX-M6** (잘못된 입력에서 400 반환, 더하여 성공 시 `deduped` 플래그) 도 포함합니다.
- **`fix(server): actually load .env so HH_USER_AGENT / GEMINI_API_KEY hints work`** — 이전에는 런타임이 사용자에게 ".env 에 HH_USER_AGENT 를 설정하라" 고 했지만 서버가 그 파일을 읽지 않았으므로 지시를 따라도 아무것도 하지 않았습니다. 35줄의 제로 의존성 dotenv 로더 (`server/lib/dotenv.mjs`) 를 추가하여 `server/index.mjs` 상단에 배선했습니다. 커맨드 라인에 설정된 process-env 값은 여전히 이깁니다. 부모의 `.env.example` 이 이제 실제 Chrome User-Agent 예제가 포함된 문서화된 `HH_USER_AGENT` 블록을 포함합니다. 6개 신규 테스트.
- **`fix(api): sanitize JD before prompt assembly` (FIX-M5)** — `POST /api/evaluate` 가 Gemini 를 호출하거나 프롬프트를 다시 echo 하기 전에 ANSI 이스케이프, 제어 바이트, 인라인 `<script>` 태그를 strip 하고 공백을 trim 합니다. 50 KB 길이 캡. 50자 최소는 *정화된* 텍스트에 대해 실행되므로 충분히 길어 보이지만 대부분 이스케이프로 구성된 프롬프트 주입 시도가 400 으로 fail-fast 됩니다.
- **`fix(health): mask Node version + project root when HOST!=loopback` (FIX-M1)** — `/api/health` 가 LAN 노출 배포에서 더 이상 호스트를 fingerprint 하지 않습니다. Loopback 응답은 로컬 진단을 위해 값을 유지합니다.

### ✨ 신규 기능

- **`feat: 7 new sidebar modes + grouped sidebar` (FIX-C8)** — 부모의 `modes/` 디렉토리의 100% 를 UI 갭 없이 다룹니다. 신규 라우트: `#/project` (포트폴리오 프로젝트 어드바이저), `#/training` (코스/자격 평가), `#/followup` (지원별 cadence), `#/batch` (병렬 URL 프로세서), `#/contacto` (LinkedIn 아웃리치 드래프터), `#/interview-prep` (단계별 준비), `#/patterns` (거절 패턴 분석기). 일곱 모두 단일 config 구동 뷰 팩토리 (`public/js/views/mode-page.js`) 와 단일 범용 엔드포인트 `POST /api/mode/:slug` 를 공유합니다 — 미래에 새 모드를 추가하는 것은 하나의 config 행 + 하나의 i18n 블록입니다. 사이드바가 6개 그룹으로 재구성됨: Sourcing / Decision / Application / Networking / Analytics / Setup. 총 18개 내비 항목. `tests/modes-endpoints.test.mjs` 의 신규 테스트 12개.
- **`fix: bootstrap parent deps + russian_portals defaults` (FIX-C4 + C9 + C12 + H2)** — `bin/start.sh` 가 이제 신규 클론에서 부모의 `node_modules` (js-yaml, playwright, jsdom) 와 `npx playwright install chromium` 을 설치하므로 `/api/stream/scan`, `/pdf`, `/liveness` 가 즉시 end-to-end 로 동작합니다. `createApp()` 이 모든 부팅에서 `portals.yml` 을 프로브합니다 — `russian_portals:` 블록이 없으면 주석과 함께 문서화된 기본을 추가합니다. 멱등성: 두 번째 부팅은 no-op. 3개 신규 테스트.
- **`fix: disable 9 dead portal slugs in template + health-check script` (FIX-C3)** — `templates/portals.example.yml` 이 이제 Ada / Factorial / Tinybird / Weights & Biases / Travelperk / Clarity AI / Forto / Vinted / Runway 를 `enabled: false` 로 표시하여 출하합니다 (각 항목에 인라인 이유 주석). 신규 설치는 96 대신 **87** 개의 활성 회사를 스캔합니다. 신규 `web-ui/scripts/portals-health-check.mjs` 가 활성화된 모든 `careers_url` 을 HEAD 프로브하고 제안된 패치 목록과 함께 DEAD 항목을 보고합니다 (`--json` 을 통한 JSON 출력). 3개 신규 테스트.
- **`feat(activity): user-action log + Activity sidebar page`** — 모든 상태 변경 API 요청이 `data/activity.jsonl` 에 캡처됩니다 (타임스탬프, 액션 동사, 대상, 성공 플래그, 선택적 세부). 액션 접두어 chip 필터 (pipeline / cv / jd / evaluate / scan / stream / script), 액션 ✓/✗ 배지, 새로고침 버튼이 있는 신규 사이드바 항목 **Activity**. 5 MB 에서 자동 회전. 미들웨어, 읽기 필터, 손상된 라인 허용, `GET /api/activity` 자체에 대한 재귀 가드를 다루는 10개 신규 테스트.
- **`feat(deep): view Deep Research in browser + saved-results archive`** — Deep Research 페이지가 이제 (a) `{ run: true }` 와 `GEMINI_API_KEY` 가 설정되면 Gemini 를 통해 프롬프트를 라이브 실행하고 출력을 `interview-prep/{slug}.md` 에 영속화합니다; (b) 저장된 모든 deep-research 파일을 상대 타임스탬프와 함께 클릭 가능한 카드로 나열합니다; (c) 결과를 Markdown 으로 렌더링하며 결과별 **📋 Copy / ⬇ Download .md / ↗ Open in tab** 액션을 제공합니다. 신규 REST 표면: `GET /api/interview-prep`, `GET /api/interview-prep/:name`, `DELETE /api/interview-prep/:name`. 7개 신규 테스트.
- **`feat(cv): generate + download PDF in browser, with PDF archive`** — CV 페이지의 신규 **📄 Generate PDF** 버튼이 모달 콘솔에서 `/api/stream/pdf` 를 스트리밍합니다. `ERR_MODULE_NOT_FOUND` / `playwright` 오류 시 복사-붙여넣기 가능한 부트스트랩 커맨드를 노출합니다. 신규 "Generated PDFs" 섹션이 각 성공 실행 후 자동 로드되어 모든 `output/*.pdf` 를 **↗ Open** 과 **⬇ Download** 버튼과 함께 나열합니다. 신규 REST 표면: `GET /api/output/pdfs`, `GET /api/output/pdfs/:name`. 6개 신규 테스트.
- **`feat(api): POST /api/tracker — append rows from the UI` (FIX-H8)** — 브라우저에서 정규 행을 `data/applications.md` 에 추가합니다. company + role 을 검증하고, `templates/states.yml` 에 대해 상태를 정규화하며, 0 패딩된 `#` 을 자동 증분하고, company+role 로 중복 제거 (대소문자 무시), 노트의 파이프를 이스케이프하여 markdown 표가 깨지지 않도록 합니다. 파일이 비어 있을 때 표를 부트스트랩합니다. 6개 신규 테스트.
- **`feat(api): DELETE /api/jds/:name` (FIX-H4)** — shell out 없이 저장된 JD 를 제거합니다. 어떤 파일시스템 접촉 전에 경로 탐색 문자가 strip 되며; 파라미터는 `.txt` 로 끝나야 합니다. `../../etc/passwd` 거부 포함 5개 신규 테스트.
- **`feat(api): POST /api/evaluate/test-gemini` (FIX-H7)** — `gemini-eval.mjs` 를 통해 50자 더미 JD 를 실행하여 사용자가 실제 평가를 기다리지 않고도 API 키가 동작하는지 확인할 수 있는 smoke-test 엔드포인트. `{ ok, code, sampleLength, sample }` 반환.

### 🐛 버그 수정

- **`fix(router): catch-all 404 view + i18n coverage guard` (FIX-C7)** — 알 수 없는 해시 라우트가 이전에는 조용히 대시보드로 폴백되어 오타와 깨진 북마크를 가렸습니다. 이제 `#/totally-random-xyz` 가 잘못된 경로를 인용하고 대시보드로 링크하는 전용 404 페이지를 렌더링합니다. 404 뷰는 라우터 IIFE 자체 안에 등록되어 어떤 사용자 라우트와도 충돌할 수 없습니다. 신규 `tests/i18n-coverage.test.mjs` 가 `vm.Context` 안에서 stub `window` 와 함께 `i18n.js` 를 실행하고 private `DICT` 를 노출하여 173+ 키 × 8 로케일 각각이 채워지고 비어 있지 않음을 단언합니다. 4개 신규 라우터 테스트.
- **`fix(router): alias #/profile → settings` (FIX-C2)** — 내부 라우트 이름은 `settings` (`nav.settings` 가 "Profile" 을 렌더링) 이지만 외부 링크와 근육 기억은 `#/profile` 로 갑니다. 이제 두 주소가 같은 뷰에 도달하고 사이드바 내비 항목이 어느 쪽이든 강조됩니다. 2개 신규 테스트.
- **`fix(health): unify Health/Doctor + flag template profiles` (FIX-C6 + FIX-H6)** — Health 와 Doctor 가 두 개의 다른 진실 소스였습니다. 이제 `/api/health` 가 Doctor 가 보고하는 모든 것 (parent-deps, Playwright, dirs, profile-customized, `HH_USER_AGENT`) 을 노출합니다. `Profile customized` 검사가 placeholder 이름 (`Jane Smith`, `Alex Doe`, `John Doe`, `Your Name`, `Test User`) 과 명시적 YAML 파싱 오류를 감지합니다. 4개 신규 테스트.
- **`fix(scan): warn on query↔negative collisions in RU config` (FIX-H3)** — `portals.yml` 이 Senior PHP 를 타깃하는 쿼리와 함께 `title_filter.negative` 에 `"PHP"` 를 출하하면 모든 매치가 필터링되어 사용자가 결과 0 을 봅니다. `loadConfig()` 가 이제 `warnings` 배열을 계산합니다; `runRuScan()` 이 스캔이 시작되기 전에 각 경고를 SSE stderr 라인으로 emit 합니다. 출하 기본이 PHP-친화적으로 유지됨을 검증하는 2개 테스트.
- **`fix(scan): warn when HH_USER_AGENT is unset` (FIX-H1)** — `/scan` 페이지가 `/api/health` 를 프로브하고 `HH_USER_AGENT` 가 비어 있으면 액션 행 위에 노란 경고 카드를 표시하여 사용자가 RU 스캔을 클릭하기 *전에* hh.ru 403 을 알도록 합니다.
- **`fix(api): warn when POST /api/jds slug had unsafe chars stripped` (FIX-M2)** — 위험한 문자를 strip 하는 slug 정규화가 이제 `warning` 필드를 반환합니다; 순수 대소문자/공백 정리는 조용히 유지됩니다. 정화 후 빈 결과는 400 을 반환합니다.
- **`fix(ui): clear global search on route change + button spinners` (FIX-M4 + FIX-L1)** — 글로벌 검색 입력이 `hashchange` 에서 클리어됩니다 (활성 입력 가드 포함). 신규 `UI.withSpinner(button, fn)` 헬퍼가 로딩 상태, ARIA, 더블 클릭 방지를 모든 비동기 버튼 클릭에 배선합니다. 이미 Doctor / Verify / sync-check / Save CV / Normalize / Dedup / Merge 버튼에 적용되었습니다.
- **`fix(ui): make sidebar scrollable so 18 nav items always reach the footer`** — FIX-C8 의 그룹화된 사이드바가 짧은 뷰포트를 오버플로우했습니다; 하단 항목 (Activity / Health) 이 잘렸습니다. `.sidebar` 가 이제 thin 사용자 정의 스타일 스크롤바와 함께 `overflow-y: auto` 를 갖습니다 (WebKit + Firefox). 푸터는 기존 `margin-top: auto` 를 통해 핀 유지됩니다.
- **`fix(ui): empty modal-title placeholder` (FIX-H9)** — `index.html` 의 하드코딩된 영어 `"Title"` 문자열이 사라졌으며, 모달이 열리는 동안 보였던 짧은 경쟁 창을 닫습니다.

### 🌐 i18n

- 173+ 번역 키 × 8개 지원 로케일 (`en`, `es`, `pt-BR`, `ko`, `ja`, `ru`, `zh-CN`, `zh-TW`). 모든 로케일에 추가된 신규 키: 404 페이지, activity 로그, deep research, PDF 흐름, 보안 경고, tracker 변경, apply 이름 변경. 커버리지가 이제 `tests/i18n-coverage.test.mjs` 로 강제됩니다 — 모든 키가 모든 지원 로케일에서 비어 있지 않은 값을 가져야 하며 그렇지 않으면 CI 실패합니다.

### ⚙️ DevOps

- **테스트 수:** 73 → **201** (23개 테스트 파일에 걸쳐 +128 테스트). 유일하게 남은 실패 테스트 (`runEnScan: dry-run end-to-end across multiple sources`) 는 Greenhouse/Ashby/Lever 라이브 API 응답에 의존하는 기존 flake 입니다.
- **Comprehensive Playwright e2e** (`tests/e2e-comprehensive.mjs`, 23 단계): 전체 사용자 여정을 걷습니다 — CV 저장 → preview → PDF 생성 → 모든 7개 신규 모드 → tracker 필터 → activity 로그 → 404 → 모달 ESC → 사이드바 스크롤 → Ctrl-K 포커스 → 검색 클리어 → profile alias → 언어 영속.
- **GitHub Actions** (`.github/workflows/`):
  - `ci.yml` — Node 18/20/22 매트릭스의 유닛 + 통합 테스트, 더하여 i18n 커버리지 게이트 (모든 키 × 8 로케일이 비어 있지 않아야 함), 더하여 모든 PR 의 전체 Playwright e2e.
  - `ai-review.yml` — 모든 PR 에 대한 Claude Code AI 리뷰. 메인테이너가 머지 권한을 유지합니다; Claude 는 제안만 합니다. `skip-ai-review` 레이블로 건너뛰기.
  - `release.yml` — `v*.*.*` 태그가 푸시되면 GitHub Release 자동 게시; 릴리스 노트는 `CHANGELOG.md` 에서 슬라이스되므로 8개 언어 변형이 모두 정규 소스로 유지됩니다.
- **CSP 친화적 UI:** 모든 인라인 `onclick` 핸들러가 `index.html` 과 `router.js` 에서 제거되었습니다. 엄격한 `script-src 'self'` 정책이 어떤 기능도 깨뜨리지 않고 이제 강제 가능합니다.

### 📦 신규 REST 엔드포인트

| Method | Path | 용도 |
|---|---|---|
| `GET`    | `/api/activity`                  | 사용자 액션 이벤트 목록, 최신 우선 |
| `GET`    | `/api/interview-prep`            | 저장된 Deep Research 파일 목록 |
| `GET`    | `/api/interview-prep/:name`      | 단일 Deep Research 파일 읽기 |
| `DELETE` | `/api/interview-prep/:name`      | Deep Research 파일 제거 |
| `GET`    | `/api/output/pdfs`               | 생성된 PDF 목록 |
| `GET`    | `/api/output/pdfs/:name`         | 첨부로 PDF 스트리밍 |
| `POST`   | `/api/tracker`                   | `applications.md` 에 행 추가 |
| `DELETE` | `/api/jds/:name`                 | 저장된 JD 제거 |
| `POST`   | `/api/evaluate/test-gemini`      | Gemini API 키 smoke 테스트 |
| `POST`   | `/api/mode/:slug`                | 7개 신규 모드 (project / training / followup / batch / contacto / interview-prep / patterns) 의 범용 프롬프트 빌더 |

---

## [1.6.0] — 2026-05-02

웹 UI 의 초기 공개 릴리스. 이 기준선의 기능 인벤토리는 `README.md` 를 참조하십시오.


