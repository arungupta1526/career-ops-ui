# 도움말 — career-ops-ui

각 페이지에 대한 단계별 가이드. 이름은 좌측 사이드바 메뉴와 일치합니다.

---

## 1. 빠른 시작

전체 사이클을 5분 안에 완료:

1. **CV** (`#/cv`) — Markdown 으로 이력서를 붙여넣거나 업로드. **💾 저장** 클릭.
2. **프로필** (`#/settings`) — `config/profile.yml` 편집: 이름, 이메일, 목표 연봉, 위치.
3. **Health** (`#/health`) — 모든 필수 카드가 녹색인지 확인. 선택적 항목 (Gemini / Anthropic / HH_USER_AGENT) 은 해당 기능 사용시에만 필요.
4. **Scan** (`#/scan`) — **🌐 Scan all** 클릭으로 활성화된 모든 채용 사이트 크롤. 또는 Ctrl+K → Enter 로 단일 URL 붙여넣기.
5. **Pipeline** (`#/pipeline`) — 스캐너가 큐에 넣은 항목 검토. URL 클릭 → 우측 미리보기. **▶ Evaluate** 로 CV 대비 평가.
6. **Tracker** (`#/tracker`) — 모든 평가가 여기로. 점수, 상태, 텍스트로 필터링. 맞춤 PDF 생성, 지원, 상태 업데이트.

---

## 2. CV (`#/cv`)

모든 평가의 단일 진실 출처. 버튼: **📁 Upload CV**, **sync-check**, **📄 Generate PDF**, **💾 저장**. 우측에 실시간 미리보기.

## 3. 프로필 (`#/settings`, `#/profile` 도 가능)

파싱된 `config/profile.yml` 표시. 디스크에서 직접 편집; reload 시 변경 반영. Health 페이지의 **Profile customized** 체크가 `Jane Smith` 같은 placeholder 값을 플래그합니다.

## 4. Scan (`#/scan`)

채용 사이트 크롤러. **🌐 Scan** runs everything (`HH_USER_AGENT` 필요). 텍스트, 원격/하이브리드/이주, 소스, 기술/레벨 chip 필터.

## 5. Pipeline (`#/pipeline`)

URL 인박스. input + **+ Add** 로 추가하거나 Ctrl+K. URL 클릭 → 우측 server-side 미리보기. 행별 액션: **▶** Evaluate, **✕** Delete. 실시간 필터 + 카운터.

## 6. Evaluate (`#/evaluate`)

JD 를 `cv.md` + `profile.yml` 대비 평가. API key 없음 → Claude Code 용 manual prompt; `ANTHROPIC_API_KEY`/`GEMINI_API_KEY` 설정 → 서버에서 실행 후 Markdown 렌더. **💾 Save JD** 로 `jds/*.txt` 에 보관.

## 7. Deep research (`#/deep`)

회사 브리핑: 팀, 문화, 뉴스, 협상 지렛대, smart questions. **⚡ Run live** 실행 + `interview-prep/{slug}.md` 저장. **▶ Generate prompt** 수동 prompt; **결과 보기** 로 key 설정 후 재실행.

## 8. Apply checklist (`#/apply`)

붙여넣기 가능한 체크리스트. 실제 폼 자동 입력은 Claude Code 에서만: `/career-ops apply <url>`.

## 9. Tracker (`#/tracker`)

지원 레지스터 — `data/applications.md`. 상태 / score band / 텍스트로 필터. 버튼: **Normalize**, **Dedup**, **Merge TSV**.

## 10. Reports (`#/reports`)

`reports/` 의 모든 A-G 보고서. 클릭하면 Markdown 렌더 (XSS-safe).

## 11. Modes (`#/project`, `#/training`, `#/followup`, `#/batch`, `#/contacto`, `#/interview-prep`, `#/patterns`)

7 개의 전문 prompt-builder. 같은 UX: 폼 작성 → **▶ Generate prompt** 또는 **⚡ Run live** (key 있을 때) → Markdown / 📋 Copy / ⬇ Download.

| 모드 | 생성하는 것 |
|---|---|
| **Project** | 포트폴리오 아이디어의 scope + signal-fit 피드백. |
| **Training** | 코스/인증이 시간 가치 있는지 결정. |
| **Follow-up** | 지원별 cadence: 언제 푸쉬, 무엇을 말할지. |
| **Batch** | `batch/run.mjs` 용 prompt — 병렬 평가. |
| **Outreach** | LinkedIn outreach: 적절한 컨택 + 메시지 작성. |
| **Interview prep** | 인터뷰 단계별 맞춤 준비. |
| **Patterns** | 과거 지원의 반복 약점 패턴. |

## 12. Activity (`#/activity`)

각 state-changing API 호출의 audit log. `data/activity.jsonl`. 액션 prefix chip 필터. 5 MB 자동 회전.

## 13. Health (`#/health`)

설정 진단. 녹색 = 준비됨, 노랑 = 선택사항 누락, 빨강 = 필수 누락. **Doctor** + **Verify** 버튼.

## 14. 설정 팁

- **`.env`** — `.env.example` 에서 복사. `ANTHROPIC_API_KEY`/`GEMINI_API_KEY` 로 라이브 실행. `HH_USER_AGENT` 로 hh.ru.
- **언어 전환기** 사이드바 footer — 8 locales, localStorage 에 저장.
- **Ctrl+K** 로 글로벌 검색 포커스. URL → Enter → pipeline. 텍스트 → Enter → tracker.
- **Esc** 로 열린 모달 닫기.
