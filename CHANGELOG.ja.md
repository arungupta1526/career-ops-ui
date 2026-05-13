# 変更履歴

**career-ops-ui** の主要な変更履歴。形式は [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)、バージョンは [SemVer](https://semver.org/) に準拠します。

翻訳: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

> **i18n ノート** — v1.12.0 以降のエントリは各言語にローカライズされています。それ以前のエントリ(v1.11.x、v1.10.x)はプロジェクトの慣習によりロシア語のままです;正規の英語本文は [CHANGELOG.md](CHANGELOG.md) にあります。

---

## [1.18.0] — 2026-05-13

**Scan エンドポイント統合 + WCAG 2.2 AA パス + i18n long-tail 完了。** レガシー `/api/stream/scan-{en,ru}` エイリアスを廃止(Sunset window 2026-10-01 をユーザー指示で v1.18 に前倒し)。non-EN README を ~307 行に拡張し、6 ロケールで残った v1.16.0 + v1.17.0 CHANGELOG の RU-bodied エントリを翻訳。

### 🚪 Breaking

- **`feat!(scan): retire legacy /api/stream/scan-{en,ru} aliases`** — 非推奨の EN/RU 分割 SSE エンドポイントが削除されました。すべての消費者は統合された `/api/stream/scan?source=ats|regional|both` エンドポイント(v1.12.0 から稼働)を通過します。外部統合は SPA catch-all に静かにルーティングされる代わりに **404** を受け取るようになりました。

### ♿ アクセシビリティ (WCAG 2.2 AA パス)

- **WCAG 2.4.1 Bypass Blocks** — 各ページの最初の focusable として新しい **Skip to main content** リンク。
- **WCAG 2.4.7 Focus Visible** — グローバル `*:focus-visible` スタイル。
- **WCAG 2.5.5 Target Size** — `.skip-link` の最小 44×44 px タッチターゲット。`.btn-sm` は 32 px min-height を維持。
- **WCAG 3.1.1 Language of Page** — `<html lang="en">` を `lang="ru"` から修正。
- **WCAG 1.3.1 Info & Relationships** — `#content` が `tabindex="-1"` を取得。

### 📚 i18n long-tail

- **`docs(i18n): 6 ロケールで v1.16.0 + v1.17.0 CHANGELOG を翻訳`** — ロケールあたり RU-char カウントが 79 → 42 → 23 に減少。
- **`docs(readme): Why / Requirements / Features / Configuration / Contributing で non-EN README を拡張`** — 各 non-EN README が 240 → ~307 行に成長。

### 🧪 テスト

- 合計 **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + 32/32 Playwright。

---

## [1.17.0] — 2026-05-13

**Polish + a11y + CI fix.** v1.16.0 REVIEW の 9 follow-up を完了: ブラウザ smoke 検証、README バッジ truth、coverage リフレッシュ、SPA の `lastWorkdayFallback` 🔒 chip、v1.16 UX 変更後の完全 E2E 再ベースライン、Playwright auto-pipeline シナリオ、a11y ARIA + focus trap パス、6 ロケールでの過去 CHANGELOG 凝縮、reference セクション付き non-EN README 拡張。

### 🐛 Fixes

- **`fix(e2e): smoke + comprehensive を v1.16 UX に再アライン`** — v1.16 の Cmd+K Enter → AutoPipeline modal 変更により、e2e テストの `search.press('Enter')` が後続クリックを backdrop が intercept する modal を開いていました。テストは legacy quick-add 経路に `Shift+Enter` を使用するようになりました。**これが v1.16.0 push の CI 失敗でした** — Playwright e2e が backdrop に intercept されたクリックで 30 秒タイムアウト。
- **`fix(mode-page): /#/batch-prompt → modes/batch.md via serverSlug`** — v1.15 が legacy mode slug を `batch-prompt` にリネームしましたが、サーバー `POST /api/mode/:slug` は存在しない `modes/batch-prompt.md` を探していました。新しい `serverSlug` フィールドはルートハッシュを親の mode ファイル名から切り離します。
- **`chore: deprecation メッセージを v1.16.0 → v1.17.0 に bump`** — scan-en/scan-ru deprecation コピーと batch-prompt バナーが過去のバージョンを参照していました。

### ✨ Features

- **`feat(scan): Active Companies カードの 🔒 Workday CAPTCHA chip`** — v1.16 PR-7 の server-side `lastWorkdayFallback` export が SPA で消費されるようになりました。`/api/scan-results` が snapshot を返します;`#/scan` は Workday tenant が fallback に陥ったときに Active Companies の上に warn-tinted カードをレンダリングします("🔒 Workday tenant blocked — fallback: use /career-ops scan (Playwright)")。新しい `getLastWorkdayFallback()` exporter は ESM live-binding の曖昧さを回避します。2 つの新しい i18n キー × 8 ロケール。

### ♿ アクセシビリティ

- **`a11y: ARIA roles + focus management パス`** —
  - `index.html`: `<aside>`(navigation)、`<header>`(banner)、`<section id="content">`(main)、`<div id="modal">`(aria-modal/aria-labelledby 付き dialog)、`<div id="toast">` + `#conn-banner`(aria-live 付き status)、`<div class="searchbar">`(search) に `role` 属性。
  - `#sidebar-toggle` が `aria-controls="sidebar"` + open/close 時に JS で同期される `aria-expanded` を取得。
  - `#global-search` が visually-hidden `<label>` プラス Cmd+K ショートカットヒントを surface する明示的な `aria-label` を取得。
  - Modal close (×) が `aria-label="Close dialog"` を取得。
  - 装飾的な backdrop が `aria-hidden="true"` を取得。
  - **Modal のフォーカストラップ** — `UI.modal()` がクリックオーナーを記憶し、open 時に最初の non-close focusable にフォーカスし、modal 内で Tab/Shift+Tab をサイクルします。`UI.closeModal()` が前のオーナーにフォーカスを復元します。
  - `public/css/app.css` の新しい `.visually-hidden` ユーティリティクラス(WAI-ARIA AP 標準パターン)。

### 📚 ドキュメント

- **`docs(readme): 8 READMEs にわたるバッジ truth`** — tests バッジ `284 / 379 / 360` → **427**; release バッジ `v1.9.1 / v1.13.0` → **v1.16.0** その後 → v1.17.0。
- **`docs(readme): 7 つの non-EN README を reference セクションで拡張`** — 各 README が 170 → ~240 行に成長、ネイティブ言語で Architecture / API / Security / Tests / A11y / Limitations / License セクションを追加。
- **`docs(changelog): 6 ロケールで pre-v1.12 エントリを凝縮`** — 長い RU-bodied v1.11.x + v1.10.x エントリが各ロケールのネイティブ言語での "Earlier releases" 簡潔エグゼクティブサマリーに置換。詳細履歴は `CHANGELOG.md` (EN) に残ります。

### 🛠️ Tooling

- **`coverage: 数字リフレッシュ`** — 最後公表は 95.46% line / 84.06% branch (v1.13.0 REVIEW)。v1.17 ベースライン: **94.14% line / 82.98% branch / 93.20% function**。auto-pipeline + reports-write の新しいエラーパスでわずかな低下;CLAUDE.md の 80% フロアより十分高い。

### 🧪 テスト

- 合計 **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + **32 / 32** Playwright(以前 28;+4 新規 auto-pipeline シナリオ)。
- E2E スイートを v1.16.0 UX に再アライン(Shift+Enter quick-add、legacy mode 用の /#/batch-prompt)。

### Out of scope (v1.18+)

| Item | Notes |
|---|---|
| non-EN CHANGELOGs での v1.16.0 エントリ翻訳 | 現在 RU-bodied。 |
| 完全な non-EN README パリティ (EN と同じ 585 行) | v1.17 が non-EN を ~240 に;マーケティング重いセクションは EN のみ。 |
| 完全な WCAG 2.2 AA 監査 | v1.17 は構造的 ARIA + focus trap をカバー;コンポーネントごとの contrast/Tab-order 監査は保留中。 |

---

## [1.16.0] — 2026-05-13

**Auto-pipeline ファイナライズ + アダプタポリッシュ + i18n long-tail.** v1.15.0 REVIEW の 11 follow-up を全て完了: サーバーサイド SSE auto-pipeline、`POST /api/reports` primitive、Cmd+K shortcut、SmartRecruiters ページネーション、Workday CAPTCHA-fallback、CI screenshot-drift gate、scan source filter UX、過去 CHANGELOG 翻訳(v1.13.0/v1.12.0 × 6 ロケール)、non-EN README 拡張、paste-ready trending-companies importer。

### ✨ 機能

- **`feat(auto-pipeline): server-side SSE orchestrator`** (#1, #2, #3, #8) — v1.15 の client-side chained-fetch orchestrator は削除されました。`POST /api/auto-pipeline` は curl 可能な SSE エンドポイントで、validate → fetch JD → evaluate → save report → tracker をサーバー側で実時間 step イベント付きで実行します。遅い Anthropic 呼び出し(30–90 秒)は汎用スピナーではなく `running` イベントを emit します。失敗は `step` + `message` 付きで `error` を emit します。orchestrator は report markdown を親 `reports/<slug>.md` にも永続化します(v1.15 では失われていました)。
- **`feat(reports): POST /api/reports primitive`** — `server/lib/routes/reports.mjs` の新 writer。path-traversal ガード付き slug サニタイズ。1 MB cap (413)。`overwrite:true` なしの existing file に 409。`stripDangerousMarkdown` 経由の atomic write。activity.reports.save のログ。テスト: 9 ケース。
- **`feat(app): Cmd+K paste URL → auto-pipeline`** — global search に URL を貼り付けて Enter で `autoStart=true` の AutoPipeline modal を開きます。Shift+Enter は legacy "add to pipeline only" 経路を保持。
- **`feat(portals): SmartRecruiters ページネーション`** (#4) — `server/lib/sources/smartrecruiters.mjs` は `?limit=100&offset=N` 経由で `totalFound` に到達するか空のページが返るか 30 ページ / 3000 ジョブの safety cap が発動するまでページを巡回します。大きなボードは postings の残りを失わなくなりました。テスト: 6 ケース。
- **`feat(portals): Workday CAPTCHA-fallback graceful`** (#7) — `server/lib/sources/workday.mjs` は 4xx / non-JSON / network エラーで throw しなくなりました。`[]` を返し、新しい export `lastWorkdayFallback` に注釈します。スキャナータイムラインは次の tenant で続行します。v1.14 の throw 動作に `strict:true` でオプトイン可能。テスト: 7 ケース。

### 🛠️ Tooling + CI

- **`ci(workflows): dashboard-screenshots drift gate`** (#5) — 新 `.github/workflows/dashboard-screenshots.yml`。`public/css/app.css`、`public/js/views/dashboard.js`、`public/js/lib/i18n.js`、`public/index.html` を触る PR で、workflow は /tmp scaffold に対して server を boot し、Playwright + chromium 経由で 8 hero PNG を再生成し、結果がコミットされたものから drift していれば build を失敗させます。
- **`feat(scripts): import-trending-companies.mjs`** (#11) — `docs/portals-examples.md` の 13 trending 企業を実際の boards-API 経由で検証し、親の `portals.yml::tracked_companies` に貼り付け可能な YAML を出力します。slug が 404 する候補には `enabled: false` がスタンプされます。`npm run import:trending` で実行。
- **`feat(scripts): npm run capture:dashboards`** — `scripts/capture-dashboard-screenshots.mjs` を top-level script として公開。

### 🎨 UX

- **`fix(scan): 統合 source-filter dropdown`** (#6) — `#/scan` source dropdown が v1.14 adapter registry から再構築されました: 6 ATSes + hh.ru + Habr Career、アルファベット順、geo prefix なし。`runEnScan`/`runRuScan` は今では統合された `/api/stream/scan?source={ats,regional}` エンドポイントを叩きます。

### 📚 i18n long-tail

- **`docs(i18n): 6 ロケールで v1.13.0 + v1.12.0 CHANGELOG を翻訳`** (#9) — 以前 RU-bodied だったエントリが実際のロケールになっています。各 non-EN/non-RU CHANGELOG には pre-v1.12 エントリがプロジェクト慣例により RU のままという i18n ノートがあります。
- **`docs: v1.16.0 highlights セクションで non-EN README を拡張`** (#10) — 7 non-EN README が ~35 行の新セクションを受け取ります: ワンクリック auto-pipeline + curl 例、SmartRecruiters ページネーション、Workday fallback、scan source-filter UX、importer スクリプト、CI screenshot workflow。

### 🧪 テスト

- 新規 `tests/reports-write.test.mjs` (9 ケース) — happy path、slug サニタイズ(path-traversal ガード含む)、409 conflict、overwrite フラグ、XSS strip、欠落フィールド 400、>1 MB 413、GET/POST round-trip。
- 新規 `tests/auto-pipeline.test.mjs` (5 ケース) — SSE framing、invalid URL ゲート、SSRF/loopback ゲート、no-LLM-key エラー経路、`text/event-stream` Content-Type ヘッダ。
- 新規 `tests/smartrecruiters-pagination.test.mjs` (6 ケース)。
- 新規 `tests/workday-fallback.test.mjs` (7 ケース)。
- 合計 **427 / 427** ユニット(以前 400; +27 純増)。0 失敗。

### Out of scope (v1.17+)

| Item | Notes |
|---|---|
| pre-v1.12 CHANGELOG エントリ翻訳 (v1.11.x, v1.10.x) | 慣例保持: RU-bodied。バックポートは ~1800 行の翻訳;延期。 |
| 完全な non-EN README パリティ(EN と同じ 585 行) | v1.16 はロケールあたり ~35 行追加;完全ミラーは別の翻訳パス。 |
| SPA Active Companies カードの `lastWorkdayFallback` surface | Server export は配線済み;UI 消費は v1.17。 |
| 検証済み 9 trending の per-company `tracked_companies` 一括追加 | `import:trending` スクリプトが 1-command + 1-paste で処理。 |

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

v1.13.0 registry の上に 3 つの新 ATS アダプタ、サポート ATS 数が 3 → 6 に拡大 (Greenhouse / Ashby / Lever **+ Workable / SmartRecruiters / Workday-beta**). ユーザー向けドキュメント 17 ファイルで "3 ATSes" を "6 ATSes" に 1 パスで更新(42 フレーズ): README × 8 ロケール、help bundle × 8 ロケール、PROJECT.md. 親 `portals.yml` 用に 13 trending 企業の paste-ready YAML ブロックを `docs/portals-examples.md` に追加。

### ✨ 機能

- **`feat(portals): 3 つの新 ATS — Workable, SmartRecruiters, Workday-beta`** — registry は 6 ATSes を解決するようになった(以前 3)。新ファイル: `server/lib/portals/adapters/{workable,smartrecruiters,workday}.mjs` (uniform contract の薄いラッパー) + `server/lib/sources/{workable,smartrecruiters,workday}.mjs` (raw HTTP + 正規化).
  - **Workable**: `apply.workable.com/<slug>` および legacy `<subdomain>.workable.com` を検出。Endpoint: `https://apply.workable.com/api/v3/accounts/<slug>/jobs?details=true`.
  - **SmartRecruiters**: `jobs.smartrecruiters.com/<slug>` および `careers.smartrecruiters.com/<slug>` を検出。Endpoint: `https://api.smartrecruiters.com/v1/companies/<slug>/postings`.
  - **Workday (beta)**: `<tenant>.wd<N>.myworkdayjobs.com/<lang>/<site>` を検出。Endpoint: `/wday/cxs/<tenant>/<site>/jobs` への POST。URL に site が無い場合 `site=External` デフォルト。一部 tenant は CXS フィードを CAPTCHA でブロックするため beta — 親の `/career-ops scan` (Playwright) にフォールバック。

### 📚 ドキュメント

- **`docs(portals-examples): trending boards block`** — `docs/portals-examples.md` に v1.14.0 セクション、`tracked_companies` 用 paste-ready YAML として 13 trending 企業を列挙: Greenhouse-hosted (Stripe, GitLab, HashiCorp, Cloudflare, Datadog, Hugging Face) + Ashby-hosted (Notion, Linear, PostHog, Replicate, Modal Labs, Fly.io, Render). すべて `enabled: false` — ユーザーが有効化前に slug を検証。さらに Workable / SmartRecruiters / Workday の例示ブロック。
- **`docs(framing): 17 ユーザー向けファイルで 42 ATS フレーズを更新`** — ユーザードキュメントの "Greenhouse / Ashby / Lever" 全箇所が "Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday" に。影響: README × 8 ロケール、help bundle × 8 ロケール、PROJECT.md。過去の CHANGELOG エントリと bug-fix 処方ドキュメント (`qa/fixes/F-014`, `qa/FIX-PROMPT`) は意図的に変更せず — 過去状態またはすでに正しい。
- **`docs(qa): browser test scenario 19`** — `qa/claude-cowork-browser-test-prompt.md` に Scenario 19 を追加: `ALL_ADAPTERS.length === 6` 不変、6 つすべてに対する `resolveAdapter()` URL 検出 sweep、`#/scan` の Active Companies カード soft-check、`docs/portals-examples.md` 構造チェック。

### 🧪 テスト

- `tests/adapter-registry.test.mjs` に 3 つの新アダプタに対する 7 つの新ケース (Workable apply-URL、Workable legacy subdomain、SmartRecruiters jobs.* + careers.*、明示的 site を持つ Workday tenant.wd5.*、Workday default-site fallback、`ALL_ADAPTERS.length === 6` 不変、`detectApi()` legacy-shape 互換性).
- 合計: **386 / 386** unit テスト (以前 379; +7 純増)。0 失敗。

### Out of scope

| Item | Notes |
|---|---|
| 13 trending Greenhouse/Ashby 企業の per-company エントリ | `docs/portals-examples.md` v1.14.0 ブロックが paste 可能 YAML として列挙; 親 `portals.yml` への bulk-add は別フェーズ。 |
| Workday CAPTCHA-fallback の自動化 | Workday adapter は CXS フィードがブロックされると throw; 予定された fallback は親 `/career-ops scan` (Playwright) に委譲。SPA scan UX への配線は v1.15+。 |

---

## [1.13.0] — 2026-05-13

大型リリース。4 つの先送り項目を 1 つのコミットで完了: PR-4(完全な multer パイプライン)、Adapter registry(F-018 のアーキテクチャ後続)、Batch evaluate SPA ページ、locale-aware mode-template scaffolding。さらに mid-session のダークテーマ・テーブル修正。

### ✨ 機能

- **`feat(cv): multer multipart upload (PR-4 完全)`** — `/api/cv/import` が octet-stream(オリジナル契約)と `multipart/form-data`(multer 経由)の両方を受け付けます。v1.10.2 の 415-reject は応急処置でしたが、v1.13.0 が本物のフィックス。curl `-F`、Postman デフォルト、すべての HTTP クライアントがスムーズに動作。新規依存: `multer ^2.1.1`。
- **`feat(portals): adapter registry`** — Greenhouse / Ashby / Lever fetcher を `server/lib/portals/adapters/*.mjs` に統一契約で抽出。`server/lib/portals/registry.mjs::resolveAdapter()` が単一のディスパッチポイント。新 ATS 追加 = `adapters/` の 1 ファイル + `ALL_ADAPTERS` の 1 行。
- **`feat(batch): #/batch evaluate page`** — 新しい SPA ビュー + 4 エンドポイント(`GET /api/batch`、`PUT /api/batch`、`GET /api/stream/batch`、`POST /api/batch/merge`)。`batch/batch-input.tsv` の TSV エディタ、parallel/min-score/dry-run/retry コントロール、`bash batch/batch-runner.sh` のライブ SSE ログ、`Merge to tracker` ボタン(`node merge-tracker.mjs` 実行)。Sidebar リンク。21 新 i18n キー × 8 ロケール。
- **`feat(prompts): locale-aware mode scaffolding`** — `buildModePrompt` + `buildEvaluationPrompt` が parent の mode-template の英語本体をロケール化された scaffolding テキスト(role-line、"Read these files first"、"User-supplied context")で 8 ロケールでラップします。

### 🎨 UX 修正

- **`fix(theme): ダークモード テーブル + tab-btn`** — ハードコードされた `#fafafa` / `#fff` / `#f7f7f7` をトークンに置換。ダークでの hover が読みやすくなりました。`.row-boosted` accent strip 追加。

### 🧪 テスト

- 新規 `tests/adapter-registry.test.mjs` (7)、`tests/batch-endpoints.test.mjs` (5)、`tests/locale-scaffold.test.mjs` (6)。
- `tests/cv-upload-multipart-reject.test.mjs` を v1.13.0 契約(multipart parsed properly)に書き直し。
- 合計 **379 / 379** 単体(以前 360; +19)。0 失敗。カバレッジ **95.46 % 行 / 84.06 % ブランチ**。
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright。

### スコープ外

- **14 個の新ポータルアダプタ** — registry は準備済み; 追加 = 各 1 ファイル; portal-by-portal リサーチが残っています。
- **Parent `modes/<slug>.md` 本体の翻訳** — `santifer/career-ops` への upstream PR が必要(CLAUDE.md hard rule #1)。

### ドキュメント

- `docs/reviews/REVIEW-2026-05-13-v1.13.0.md`。
- 全文: [CHANGELOG.md](CHANGELOG.md#1130--2026-05-13)。

---

## [1.12.0] — 2026-05-13

バグ修正 + UX + ブランドパス。v1.11.1 以降の 8 つのバックログ項目を完了(テストギャップ #9–12、console error #8、portals-dead drift #4、seniority_boost surface #6、F-018 エンドポイント統合)。テーマ day/night トグル追加、すべてのドキュメント/パッケージメタデータ/GitHub リポジトリ説明から "Airbnb-styled" の言及を削除。

### ✨ 機能

- **`feat(theme): day/night トグル`** — top-bar に新しいテーマボタン。light ↔ dark を循環、`localStorage` に永続化、最初のペイント前に `public/js/lib/theme-bootstrap.js` で復元。初回ロード時の `prefers-color-scheme` を尊重。`public/css/app.css` の `[data-theme="dark"]` 下に完全なダークパレット。
- **`feat(scan): /api/stream/scan?source=ats|regional|both` (F-018 LITE)`** — 単一の統合 SSE エンドポイント。SPA は 1 つの event-stream を開き、両フェーズ(ATS、続いて regional)を順次実行します。レガシー `/api/stream/scan-en` + `/api/stream/scan-ru` は deprecated alias として残ります。
- **`feat(scan): seniority_boost surface`** — 両スキャナーが `portals.yml::title_filter.seniority_boost` を読み、一致するジョブに `_boosted: true` をマーク。SPA は boosted 行を上にソートし、`⬆ boosted` バッジをレンダリング。

### 🐛 修正

- **`fix(ui): 4 箇所で .message null-safe (#8)`** — `app.js`、`views/tracker.js`、`views/apply.js`、`views/evaluate.js`。以前は Error payload のない Promise rejection が e2e teardown で "Cannot read properties of undefined" をスロー。
- **`fix(test): portals-dead drift を failure ではなく warning に (#4)`** — assertion を stderr warning に変換。CI は parent drift で緑のまま;release の判断は手動です。

### 📝 Brand / docs

- **`docs(brand): すべての doc + package + GitHub リポジトリ説明から 'Airbnb' 参照を削除`** — 8 つの README、CLAUDE.md、FRONTEND.md、package.json およびリポジトリ説明を "Airbnb-styled" から "Clean, docs-style" に移行。

### 🧪 テスト

- 新規 `tests/canonical-docs-coverage.test.mjs` (5 ケース) が test gap #9–12 を閉じる。
- 新規 `tests/scan-consolidated.test.mjs` (6 ケース) が F-018 LITE をカバー。
- 合計 **360 / 360** 単体(以前 349; +11 新規)。0 失敗。カバレッジ: **95.62 % 行 / 84.37 % ブランチ**。
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright。

### ドキュメント

- `docs/reviews/REVIEW-2026-05-13-v1.12.0.md`。
- 全文: [CHANGELOG.md](CHANGELOG.md#1120--2026-05-13)。

### スコープ外 (v1.11.1 以降変更なし)

Batch evaluate SPA ページ; 完全な adapter registry(F-018 アーキテクチャ refactor); 完全な multer パイプライン(PR-4); mode template の翻訳。

---

## 過去のリリース (v1.11.x および v1.10.x)

v1.11.0 / v1.11.1 / v1.10.0–v1.10.3 の詳細エントリは [英語 CHANGELOG](CHANGELOG.md) にあります。サマリー:

- **v1.11.1 — 2026-05-13** · ポリッシュ: `#/apply` の Playwright ヒント、統一されたタグライン、ダッシュボードの score-thresholds カード。349/349 テスト。
- **v1.11.0 — 2026-05-13** · 8 つの help バンドルと 8 つの README に career-ops.org/docs を統合。新規 `docs/career-ops-canonical.md`。Mode/Archetype/Pipeline/Tracker/Report/Scan history の概念を文書化。348/349 テスト。
- **v1.10.3 — 2026-05-12** · バグ修正スライス: v1.10.2 リグレッション実行の 11 件中 7 件をクローズ。
- **v1.10.2 — 2026-05-12** · CV multipart 415-リジェクト (v1.13.0 multer までの一時パッチ);PDF 生成修正。
- **v1.10.1 — 2026-05-09** · v1.10.0 リリースの QA リグレッション実行からの重要パッチ。
- **v1.10.0 — 2026-05-08** · `#/profile` エディタ + CV アップロード UX (pandoc/pdftotext/passthrough)、8 ロケール × 16 H2 help パリティ、locale switcher。
