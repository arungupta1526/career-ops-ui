# 변경 로그

**career-ops-ui** 의 모든 주요 변경 사항. 형식은 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), 버전은 [SemVer](https://semver.org/) 를 따릅니다.

번역: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

> **i18n 노트** — v1.12.0 이후 항목은 각 언어로 현지화됩니다. 이전 항목(v1.11.x, v1.10.x)은 프로젝트 관례에 따라 러시아어로 유지됩니다; 정규 영어 본문은 [CHANGELOG.md](CHANGELOG.md)에 있습니다.

---

## [1.20.0] — 2026-05-13

**Per-component a11y polish + non-EN README parity + `/api/scan-ru/config` alias retired.** Closes the four items the v1.19.0 "Out of scope" table flagged for v1.20.

### Highlights

- **WCAG 2.5.5 / 2.5.8 — per-component touch-targets:** `.chip` → `min-height: 28px` + `.chip-row { gap: 8px }` (spaced-target exception). `.nav-item` and `.tab-btn` → `min-height: 44px`.
- **WCAG 1.3.1 / 3.3.2 — `aria-describedby` on form hints:** every form control across `config.js` / `evaluate.js` / `batch.js` / `pipeline.js` / `mode-page.js` now owns a stable `id`, `<label htmlFor=…>`, and `aria-describedby` for inline hints. `UI.el()` learned a React-style `htmlFor` alias.
- **Non-EN README parity:** all 7 locales now mirror the 585-line EN structure end-to-end (Why?, Quick start, full API reference, Architecture, 🌍 Getting Started walkthrough).
- **Alias retired:** `DELETE /api/scan-ru/config`. Use `/api/scan/regional/config`. Sunset was announced in v1.19.0.

### Tests

**427 / 427** unit + 20/20 smoke + 23/23 comprehensive + 32/32 Playwright. All a11y wiring is additive; no behavioral test deltas.

### Breaking changes

- `GET /api/scan-ru/config` — removed (use `/api/scan/regional/config`).

See [`CHANGELOG.md`](CHANGELOG.md) for the full English changelog.

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

**Scan 엔드포인트 통합 + WCAG 2.2 AA 패스 + i18n long-tail 마무리.** 레거시 `/api/stream/scan-{en,ru}` 별칭을 폐기(Sunset window 2026-10-01을 사용자 방향에 따라 v1.18로 앞당김). non-EN README를 ~307줄로 늘리고, 6개 로케일에서 남은 v1.16.0 + v1.17.0 CHANGELOG의 RU-bodied 항목을 번역.

### 🚪 Breaking

- **`feat!(scan): retire legacy /api/stream/scan-{en,ru} aliases`** — 폐기된 EN/RU 분할 SSE 엔드포인트가 사라졌습니다. 모든 컨슈머는 통합 `/api/stream/scan?source=ats|regional|both` 엔드포인트(v1.12.0부터 라이브)를 통과합니다. 외부 통합은 이제 SPA catch-all로 조용히 라우팅되는 대신 **404**를 받습니다.

### ♿ 접근성 (WCAG 2.2 AA 패스)

- **WCAG 2.4.1 Bypass Blocks** — 모든 페이지의 첫 번째 focusable로 새로운 **Skip to main content** 링크.
- **WCAG 2.4.7 Focus Visible** — 글로벌 `*:focus-visible` 스타일.
- **WCAG 2.5.5 Target Size** — `.skip-link`의 최소 44×44 px 터치 타겟. `.btn-sm`은 32 px min-height 유지.
- **WCAG 3.1.1 Language of Page** — `<html lang="en">`을 `lang="ru"`에서 수정.
- **WCAG 1.3.1 Info & Relationships** — `#content`가 `tabindex="-1"`을 받음.

### 📚 i18n long-tail

- **`docs(i18n): 6 로케일에서 v1.16.0 + v1.17.0 CHANGELOG 번역`** — 로케일당 RU-char 개수 79 → 42 → 23으로 감소.
- **`docs(readme): non-EN README를 Why / Requirements / Features / Configuration / Contributing으로 확장`** — 각 non-EN README가 240 → ~307줄로 성장.

### 🧪 테스트

- 총 **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + 32/32 Playwright.

---

## [1.17.0] — 2026-05-13

**Polish + a11y + CI fix.** v1.16.0 REVIEW의 9개 follow-up을 종료: 브라우저 smoke 검증, README badge truth, coverage 갱신, SPA의 `lastWorkdayFallback` 🔒 chip, v1.16 UX 변경 후 전체 E2E 재기준선, Playwright auto-pipeline 시나리오, a11y ARIA + focus trap 패스, 6 로케일에서 과거 CHANGELOG 압축, non-EN README에 reference 섹션 확장.

### 🐛 Fixes

- **`fix(e2e): smoke + comprehensive을 v1.16 UX와 재정렬`** — v1.16의 Cmd+K Enter → AutoPipeline modal 변경으로 e2e 테스트의 `search.press('Enter')`가 backdrop이 후속 클릭을 가로채는 modal을 열게 했습니다. 테스트는 이제 legacy quick-add 경로에 `Shift+Enter`를 사용합니다. **이것이 v1.16.0 push의 CI 실패였습니다** — Playwright e2e가 backdrop에 의해 가로채진 클릭에서 30초 타임아웃.
- **`fix(mode-page): /#/batch-prompt → modes/batch.md via serverSlug`** — v1.15가 legacy mode slug를 `batch-prompt`로 이름 변경했지만, 서버 `POST /api/mode/:slug`가 존재하지 않는 `modes/batch-prompt.md`를 찾고 있었습니다. 새 `serverSlug` 필드는 라우트 해시를 부모의 mode 파일 이름과 분리합니다.
- **`chore: deprecation 메시지를 v1.16.0 → v1.17.0로 bump`** — scan-en/scan-ru deprecation 카피 및 batch-prompt 배너가 지난 버전을 참조했습니다.

### ✨ Features

- **`feat(scan): Active Companies 카드의 🔒 Workday CAPTCHA chip`** — v1.16 PR-7의 server-side `lastWorkdayFallback` export가 이제 SPA에서 소비됩니다. `/api/scan-results`가 snapshot을 반환합니다; `#/scan`은 Workday tenant가 fallback으로 떨어지면 Active Companies 위에 warn-tinted 카드를 렌더링합니다("🔒 Workday tenant blocked — fallback: use /career-ops scan (Playwright)"). 새 `getLastWorkdayFallback()` exporter는 ESM live-binding 모호성을 피합니다. 2개의 새 i18n 키 × 8 로케일.

### ♿ 접근성

- **`a11y: ARIA roles + focus management 패스`** —
  - `index.html`: `<aside>`(navigation), `<header>`(banner), `<section id="content">`(main), `<div id="modal">`(aria-modal/aria-labelledby가 있는 dialog), `<div id="toast">` + `#conn-banner`(aria-live가 있는 status), `<div class="searchbar">`(search)에 `role` 속성.
  - `#sidebar-toggle`은 `aria-controls="sidebar"` + open/close 시 JS로 동기화된 `aria-expanded`를 받습니다.
  - `#global-search`는 visually-hidden `<label>`과 Cmd+K shortcut 힌트를 표시하는 명시적 `aria-label`을 받습니다.
  - Modal close (×)는 `aria-label="Close dialog"`를 받습니다.
  - 장식용 backdrop은 `aria-hidden="true"`를 받습니다.
  - **Modal의 Focus trap** — `UI.modal()`이 클릭 소유자를 기억하고, open 시 첫 번째 non-close focusable에 포커스를 맞추고, modal 내에서 Tab/Shift+Tab을 순환시킵니다. `UI.closeModal()`은 이전 소유자에게 포커스를 복원합니다.
  - `public/css/app.css`의 새 `.visually-hidden` 유틸리티 클래스 (WAI-ARIA AP 표준 패턴).

### 📚 문서

- **`docs(readme): 8 READMEs의 badge truth`** — tests 배지 `284 / 379 / 360` → **427**; release 배지 `v1.9.1 / v1.13.0` → **v1.16.0** → v1.17.0.
- **`docs(readme): 7개 non-EN README에 reference 섹션 확장`** — 각 README가 170 → ~240 줄로 성장, 네이티브 언어로 Architecture / API / Security / Tests / A11y / Limitations / License 섹션 추가.
- **`docs(changelog): 6 로케일에서 pre-v1.12 항목 압축`** — 긴 RU-bodied v1.11.x + v1.10.x 항목이 이제 각 로케일의 네이티브 언어로 "Earlier releases" 압축 요약으로 교체. 상세 이력은 `CHANGELOG.md` (EN)에 유지.

### 🛠️ Tooling

- **`coverage: 숫자 갱신`** — 마지막 공개는 95.46% line / 84.06% branch (v1.13.0 REVIEW). v1.17 baseline: **94.14% line / 82.98% branch / 93.20% function**. auto-pipeline + reports-write의 새 error path로 약간 감소; 여전히 CLAUDE.md의 80% floor 위.

### 🧪 테스트

- 총 **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + **32 / 32** Playwright (이전 28; +4개 신규 auto-pipeline 시나리오).
- v1.16.0 UX에 맞춰 E2E 스위트 재정렬 (Shift+Enter quick-add, legacy mode용 /#/batch-prompt).

### Out of scope (v1.18+)

| 항목 | 비고 |
|---|---|
| non-EN CHANGELOG의 v1.16.0 항목 번역 | 현재 RU-bodied. |
| 전체 non-EN README 패리티 (EN과 같은 585 줄) | v1.17은 non-EN을 ~240으로; 마케팅 무거운 섹션은 EN 전용. |
| 전체 WCAG 2.2 AA 감사 | v1.17은 구조적 ARIA + focus trap 커버; 컴포넌트별 contrast/Tab-order 감사 대기. |

---

## [1.16.0] — 2026-05-13

**Auto-pipeline 마무리 + 어댑터 폴리시 + i18n long-tail.** v1.15.0 REVIEW의 11개 follow-up을 모두 종료: 서버사이드 SSE auto-pipeline, `POST /api/reports` primitive, Cmd+K shortcut, SmartRecruiters 페이지네이션, Workday CAPTCHA-fallback, CI screenshot-drift gate, scan source filter UX, 과거 CHANGELOG 번역(v1.13.0/v1.12.0 × 6 로케일), non-EN README 확장, paste-ready trending-companies importer.

### ✨ 기능

- **`feat(auto-pipeline): server-side SSE orchestrator`** (#1, #2, #3, #8) — v1.15의 client-side chained-fetch orchestrator는 제거되었습니다. `POST /api/auto-pipeline`은 이제 curl 가능한 SSE 엔드포인트로, validate → fetch JD → evaluate → save report → tracker를 서버 측에서 실시간 step 이벤트와 함께 실행합니다. 느린 Anthropic 호출(30–90초)은 일반 spinner 대신 `running` 이벤트를 emit합니다. 실패는 `step` + `message`와 함께 `error`를 emit합니다. orchestrator는 또한 report markdown을 부모 `reports/<slug>.md`에 영속화합니다(v1.15에서는 손실).
- **`feat(reports): POST /api/reports primitive`** — `server/lib/routes/reports.mjs`의 새 writer. path-traversal guard가 있는 slug 정화. 1 MB cap (413). `overwrite:true` 없이 existing file에 대해 409. `stripDangerousMarkdown`을 통한 atomic write. activity.reports.save 로그. 테스트: 9 케이스.
- **`feat(app): Cmd+K paste URL → auto-pipeline`** — global search에 URL을 붙여넣고 Enter는 이제 `autoStart=true`로 AutoPipeline modal을 엽니다. Shift+Enter는 legacy "add to pipeline only" 경로를 보존합니다.
- **`feat(portals): SmartRecruiters 페이지네이션`** (#4) — `server/lib/sources/smartrecruiters.mjs`는 `?limit=100&offset=N`을 통해 `totalFound`에 도달하거나 빈 페이지가 반환되거나 30페이지 / 3000개 잡의 safety cap이 발동될 때까지 페이지를 순회합니다. 큰 보드는 더 이상 postings의 나머지를 잃지 않습니다. 테스트: 6 케이스.
- **`feat(portals): Workday CAPTCHA-fallback graceful`** (#7) — `server/lib/sources/workday.mjs`는 더 이상 4xx / non-JSON / network 오류에 throw하지 않습니다. `[]`를 반환하고 새 export `lastWorkdayFallback`에 주석합니다. 스캐너 타임라인은 다음 tenant로 계속됩니다. v1.14 throw 동작에 `strict:true`로 옵트인할 수 있습니다. 테스트: 7 케이스.

### 🛠️ Tooling + CI

- **`ci(workflows): dashboard-screenshots drift gate`** (#5) — 새 `.github/workflows/dashboard-screenshots.yml`. `public/css/app.css`, `public/js/views/dashboard.js`, `public/js/lib/i18n.js` 또는 `public/index.html`을 건드리는 PR에서 workflow는 /tmp scaffold에 대해 server를 boot하고 Playwright + chromium을 통해 8개 hero PNG를 재생성하며 결과가 커밋된 것에서 drift하면 build를 실패시킵니다.
- **`feat(scripts): import-trending-companies.mjs`** (#11) — `docs/portals-examples.md`의 13개 trending 회사를 실제 boards-API를 통해 검증하고 부모의 `portals.yml::tracked_companies`에 붙여넣을 수 있는 YAML을 출력합니다. slug가 404인 후보에는 `enabled: false`가 찍힙니다. `npm run import:trending`으로 실행.
- **`feat(scripts): npm run capture:dashboards`** — `scripts/capture-dashboard-screenshots.mjs`를 top-level script로 노출.

### 🎨 UX

- **`fix(scan): 통합 source-filter dropdown`** (#6) — `#/scan` source dropdown이 v1.14 adapter registry에서 재구성되었습니다: 6 ATSes + hh.ru + Habr Career, 알파벳 순, geo prefix 없음. `runEnScan`/`runRuScan`은 이제 통합된 `/api/stream/scan?source={ats,regional}` 엔드포인트를 칩니다.

### 📚 i18n long-tail

- **`docs(i18n): 6 로케일에서 v1.13.0 + v1.12.0 CHANGELOG 번역`** (#9) — 이전에 RU-bodied였던 항목들이 이제 실제 로케일에 있습니다. 각 non-EN/non-RU CHANGELOG에는 pre-v1.12 항목이 프로젝트 관례에 따라 RU로 유지된다는 i18n 노트가 있습니다.
- **`docs: v1.16.0 highlights 섹션으로 non-EN README 확장`** (#10) — 7 non-EN README가 ~35 줄의 새 섹션을 받습니다: 원클릭 auto-pipeline + curl 예제, SmartRecruiters 페이지네이션, Workday fallback, scan source-filter UX, importer 스크립트, CI screenshot workflow.

### 🧪 테스트

- 새로운 `tests/reports-write.test.mjs` (9 케이스) — happy path, slug 정화(path-traversal guard 포함), 409 conflict, overwrite flag, XSS strip, 누락 필드 400, >1 MB 413, GET/POST round-trip.
- 새로운 `tests/auto-pipeline.test.mjs` (5 케이스) — SSE framing, invalid URL 게이트, SSRF/loopback 게이트, no-LLM-key 오류 경로, `text/event-stream` Content-Type 헤더.
- 새로운 `tests/smartrecruiters-pagination.test.mjs` (6 케이스).
- 새로운 `tests/workday-fallback.test.mjs` (7 케이스).
- 총 **427 / 427** 유닛 (이전 400; +27 순증). 0 실패.

### Out of scope (v1.17+)

| 항목 | 비고 |
|---|---|
| pre-v1.12 CHANGELOG 항목 번역 (v1.11.x, v1.10.x) | 관례 보존: RU-bodied. 백포트는 ~1800줄 번역; 연기. |
| 전체 non-EN README 패리티(EN처럼 585 줄) | v1.16은 로케일당 ~35 줄 추가; 전체 미러는 별도 번역 패스. |
| SPA Active Companies 카드의 `lastWorkdayFallback` surface | Server export 배선됨; UI 소비는 v1.17. |
| 검증된 9개 trending에 대한 per-company `tracked_companies` bulk add | `import:trending` 스크립트가 1-command + 1-paste로 처리. |

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
