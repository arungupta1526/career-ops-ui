# 変更履歴

**career-ops-ui** の主要な変更履歴。形式は [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)、バージョンは [SemVer](https://semver.org/) に準拠します。

翻訳: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

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

Большой релиз. Закрывает все 4 отложенных пункта одним коммитом: PR-4 (полный multer pipeline), Adapter registry (архитектурное продолжение F-018), Batch evaluate SPA-страница, и locale-aware mode-template scaffolding. Плюс mid-session фикс таблиц в dark theme.

### ✨ Фичи

- **`feat(cv): multer multipart upload (PR-4 полный)`** — `/api/cv/import` теперь принимает И octet-stream (оригинальный контракт), И `multipart/form-data` через multer. v1.10.2 415-reject был заглушкой; v1.13.0 — настоящий fix. curl `-F`, Postman default, любой HTTP-клиент работают seamlessly. Новая зависимость: `multer ^2.1.1`.
- **`feat(portals): adapter registry`** — Greenhouse / Ashby / Lever fetcher'ы вынесены в `server/lib/portals/adapters/*.mjs` с единым контрактом. `server/lib/portals/registry.mjs::resolveAdapter()` — единая точка диспатча. Добавление нового ATS теперь = один файл в `adapters/` + строчка в `ALL_ADAPTERS`.
- **`feat(batch): #/batch evaluate page`** — новая SPA-view + 4 эндпоинта (`GET /api/batch`, `PUT /api/batch`, `GET /api/stream/batch`, `POST /api/batch/merge`). TSV-редактор для `batch/batch-input.tsv`, контролы parallel/min-score/dry-run/retry, live SSE log `bash batch/batch-runner.sh`, кнопка `Merge to tracker` (запускает `node merge-tracker.mjs`). Sidebar link. 21 новый i18n-ключ × 8 локалей.
- **`feat(prompts): locale-aware mode scaffolding`** — `buildModePrompt` + `buildEvaluationPrompt` теперь оборачивают английское тело parent'овского mode-template'а локализованным scaffolding-текстом (role-line, "Read these files first", "User-supplied context") на 8 локалях.

### 🎨 UX фиксы

- **`fix(theme): dark-mode таблицы + tab-btn`** — захардкоженные `#fafafa` / `#fff` / `#f7f7f7` заменены на токены. Hover на тёмной теме теперь читается. Добавлен `.row-boosted` accent strip.

### 🧪 Тесты

- Новые `tests/adapter-registry.test.mjs` (7), `tests/batch-endpoints.test.mjs` (5), `tests/locale-scaffold.test.mjs` (6).
- `tests/cv-upload-multipart-reject.test.mjs` переписан под v1.13.0 контракт (multipart parsed properly).
- Итого: **379 / 379** юнит-тестов (было 360; +19). 0 failures. Покрытие **95.46% линий / 84.06% веток**.
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright.

### За пределами слайса

- **14 новых portal adapter'ов** — registry готов, добавление = один файл каждый; portal-by-portal research остаётся.
- **Перевод parent's `modes/<slug>.md` тел** — требует PR в upstream `santifer/career-ops` (CLAUDE.md hard rule #1).

### Документация

- `docs/reviews/REVIEW-2026-05-13-v1.13.0.md`.
- Полный текст: [CHANGELOG.md](CHANGELOG.md#1130--2026-05-13).

---

## [1.12.0] — 2026-05-13

Bug-fix + UX + brand pass. Закрывает 8 пунктов backlog'а после v1.11.1 (тестовые дыры #9–12, console error #8, portals-dead drift #4, seniority_boost surface #6, F-018 endpoint consolidation). Добавлен day/night toggle темы, убрано упоминание "Airbnb-styled" из всех документов, package metadata и описания GitHub-репо.

### ✨ Фичи

- **`feat(theme): day/night toggle`** — новая кнопка темы в top-bar. Cycles light ↔ dark, сохраняется в `localStorage`, восстанавливается до рендера через pre-paint bootstrap (`public/js/lib/theme-bootstrap.js`). Уважает `prefers-color-scheme` для первой загрузки. Полная dark-палитра в `public/css/app.css` под `[data-theme="dark"]`.
- **`feat(scan): /api/stream/scan?source=ats|regional|both` (F-018 LITE)`** — один консолидированный SSE endpoint. SPA открывает ОДИН event-stream, который последовательно прогоняет обе фазы (ATS, потом regional). Legacy `/api/stream/scan-en` + `/api/stream/scan-ru` остаются как deprecated aliases.
- **`feat(scan): seniority_boost surface`** — оба сканера читают `portals.yml::title_filter.seniority_boost` и проставляют `_boosted: true` на джобах с матчем. SPA сортирует boosted-строки наверх и рендерит `⬆ boosted` badge.

### 🐛 Фиксы

- **`fix(ui): null-safe .message в 4 местах (#8)`** — `app.js`, `views/tracker.js`, `views/apply.js`, `views/evaluate.js`. Раньше Promise rejection без Error payload бросал "Cannot read properties of undefined" в e2e teardown.
- **`fix(test): portals-dead drift warning instead of failure (#4)`** — конвертирован assertion в stderr warning. CI идёт зелёным на parent drift; release-решения остаются ручными.

### 📝 Brand / docs

- **`docs(brand): убраны 'Airbnb' references из всех doc + package + GitHub repo description`** — 8 README, CLAUDE.md, FRONTEND.md, package.json и описание репо переведены с "Airbnb-styled" на "Clean, docs-style".

### 🧪 Тесты

- Новый `tests/canonical-docs-coverage.test.mjs` (5 кейсов) закрывает test gaps #9–12.
- Новый `tests/scan-consolidated.test.mjs` (6 кейсов) покрывает F-018 LITE.
- Итого: **360 / 360** юнит-тестов (было 349; +11 новых). 0 failures. Покрытие: **95.62 % линий / 84.37 % веток**.
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright.

### Документация

- `docs/reviews/REVIEW-2026-05-13-v1.12.0.md`.
- Полный текст: [CHANGELOG.md](CHANGELOG.md#1120--2026-05-13).

### За пределами слайса (без изменений с v1.11.1)

Batch evaluate SPA-страница; полный adapter registry (F-018 архитектурный рефактор); полный multer pipeline (PR-4); перевод mode templates.

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

機能回帰パッチ。v1.10.1 の手動検証で見つかった 2 件のバグを修正; ドキュメント面を拡充。

### 🐛 バグ修正

- **`fix(cv): /api/cv/import は multipart/form-data を 415 で拒否`** — `multipart/form-data` をデフォルトとする外部クライアントは以前、wire envelope を `cv.md` の内容として保存していました。今や 415 とヒント。SPA のパス(octet-stream + X-Filename)は影響なし。
- **`fix(pdf): /api/stream/pdf は generate-pdf.mjs を正しい位置引数で呼び出す`** — 以前は `[]` で呼び出しており、スクリプトは `Usage:` を出力してコード 1 で終了、PDF は生成されませんでした。今やルートが `cv.md` を HTML にレンダリングし、`output/cv-input-<TIMESTAMP>.html` に書き込み、スクリプトを `<input.html> <output.pdf> --format=a4` で起動します。

### 🧪 テスト

- 新規 `tests/cv-upload-multipart-reject.test.mjs`(5 ケース)、新規 `tests/pdf-stream-args.test.mjs`(3 ケース)。**ユニットテスト 340 件**(以前は 318)。カバレッジ 94.63 % 行 / 84.94 % ブランチ。

### 📝 ドキュメント

- 新規 `docs/test-scenarios/` — 21 個の英語シナリオファイル。
- 新規 `docs/reviews/REVIEW-2026-05-12-v1.10.2.md`。
- 全文は [CHANGELOG.md](CHANGELOG.md#1102--2026-05-12) を参照。

---

## [1.10.1] — 2026-05-09

v1.10.0 QA 回帰結果に基づく重要修正パッチ (`qa/reports/00-FINAL-SUMMARY.md`)。

### 🛡️ セキュリティ

- **`fix(security): SSRF 表面の強化 + DNS リバインド対策 (PR-3 / F-003)`** — `isValidJobUrl` が RFC1918、127/8 全範囲、リンクローカル `169.254/16` (AWS IMDS を含む)、`0.0.0.0`、CGNAT `100.64/10`、IPv6 ULA / リンクローカルを拒否します。新しいヘルパー `isPrivateOrLoopbackHost()`。プレビュープロキシは各ホップで `dns.lookup` を行い、アドレスがプライベート範囲ならブロックします — DNS リバインド対策。

### 🐛 バグ修正

- **`fix(activity)`**: 成功した状態変更のみを記録 (PR-5 / F-005); 4xx で拒否されたリクエストはログされません。`profile.save`、`config.save`、`cv.import` イベントを追加 (F-008)。
- **`fix(help)`**: 韓国語本文が英語にフォールバックしないよう `ko` → `ko-KR.md` のエイリアスを追加 (F-002)。
- **`fix(llm): /api/evaluate が mode:'manual' を尊重`** — `/api/deep` と同じ動作、Anthropic クレジット非消費 (F-009)。
- **`fix(api): DELETE /api/pipeline`** が `?url=` と `body.url` の両方を受け付け、URL がない場合は 404 を返します (PR-6 / F-017)。

### ✨ 機能

- **`feat(llm): すべてのプロンプトにロケール伝播 (PR-2 / F-012)`** — `resolveLocale(req)`、`buildLocaleDirective(lang)`。SPA が `Accept-Language` + `lang` を自動的に添付します。
- **`feat(scripts): post-qa-cleanup.mjs (PR-11)`** — QA 回帰後のクリーンアップチェックリストを再実行; `--apply` で書き込み、デフォルトはドライラン、冪等。

### 🧪 テスト

- 新規 `tests/critical-fixes.test.mjs` (15 ケース)。`tests/url-validation.test.mjs` に 5 件追加。**ユニットテスト 318 件** (以前は 298)。`portals-dead.test.mjs` の既存の失敗は parent の `templates/portals.example.yml` データドリフト — web-ui コードとは無関係。

### 📝 ドキュメント

- 新規 `docs/reviews/REVIEW-2026-05-09-v1.10.1.md`。8 つの README 全てを更新 (バッジ + スクリーンショット + 「v1.10.1 の新機能」セクション)。8 つの CHANGELOG にこのエントリを反映。

---

## [1.10.0] — 2026-05-08

> 全文は [CHANGELOG.md](CHANGELOG.md#1100--2026-05-08) を参照。要約: CV インポート (`.docx`/`.doc`/`.odt`/`.rtf`/`.pdf`/`.html`/`.txt`/`.md`、pandoc + pdftotext 経由、10 MB 上限)、Generate-PDF 後の新規 PDF 自動ダウンロード、`#/config` 二タブ構成 (API keys & runtime + Profile)、`#/profile` を正規ルートに昇格、8 ロケールのヘルプ刷新。

---

## [1.9.1] — 2026-05-08

Production-readiness パス。4 件の的を絞った修正 (BF-1..BF-4)、Playwright スモークを 5 → 12 件に拡充。

### 🐛 バグ修正

- **BF-1 (tracker)**: `|` と改行のエスケープを notes だけでなく全セルに適用。`"Acme | Co"` のような名前でテーブルが壊れなくなりました。`parseMarkdownTable` が GFM の `\|` エスケープをサポート — 損失のない round-trip。
- **BF-2 (config)**: `updateEnvFile` を try/catch でラップ — permission-denied 時に未処理 rejection ではなくクリーンな 500 を返します。
- **BF-3/BF-4 (llm)**: `/api/evaluate`、`/api/deep`、`/api/mode/:slug` の Anthropic 経路で組み立てプロンプトに 200 KB のソフトキャップ — タイムアウトではなく 413。

### 🧪 Playwright スモーク — 5 → 12 件

Tracker (BF-1 round-trip 含む)、pipeline 追加 + 無効 URL 一掃、reports 空状態、evaluate 手動フォールバック、config 秘匿マスキング、CV PUT のサニタイズ、pipeline preview 400。

---

## [1.9.0] — 2026-05-08

v1.8.0 バックログの P-6 → P-10 を一括リリース。要点: `server/index.mjs` は 130 行のオーケストレータ (762 行から、累計 1230 → 130 = -89 %) になり、各ルートトピックは独立モジュール。`/api/evaluate` の Anthropic パリティ、マルチ CLI シム、i18n パリティテスト拡張、Playwright ブラウザスモーク CI 統合。

### 🏗️ P-6 — server/index.mjs 分割フェーズ 2

P-2 の継続。残り 9 ルートトピックを `server/lib/routes/<topic>.mjs` に抽出。`index.mjs` は純粋オーケストレータ: ミドルウェア、12 件の `register<Topic>Routes(app)`、SPA キャッチオール。

モジュール: `activity`、`config`、`health` (+ dashboard)、`help`、`jds`、`llm`、`pipeline` (+ preview)、`reports`、`tracker`。挙動変更なし。各ステップで 283/283 unit tests グリーン。

### 🔌 P-7 — /api/evaluate の Anthropic パリティ

`/api/evaluate` は以前 Gemini-or-manual。v1.9.0 で Anthropic 経路を追加 (両キー存在時は優先)。`bundleProjectContext({ modeSlugs: ['_shared', 'oferta'] })` 経由 — REVIEW-A1 拡張。フォールバック順: Anthropic → Gemini → manual。

新規エンドポイント **`POST /api/evaluate/test-anthropic`** — `ANTHROPIC_API_KEY` のスモークチェック。

### 🌐 P-8 — Help センター i18n パリティ

8 ロケールすべてが同じ 14 個の正規 h2 セクションをカバー済み。テスト強化:

- `tests/help-ui.test.mjs` が全 8 ロケールを反復 (以前は en + ru のみ)。
- 新規: 各ロケール ≥ `en.md` の 30 % — スタブ防止。

### 🤖 P-9 — Playwright ブラウザスモーク CI

`tests/playwright-smoke.mjs` (v1.8.0 で opt-in) が CI ワークフローに統合。

### 🌍 P-10 — マルチ CLI 互換性

`web-ui/AGENTS.md` (Codex / Aider / generic) と `web-ui/GEMINI.md` をシムとして追加し、正規の `CLAUDE.md` を指す。

### 🧪 テスト

- **284 unit tests** (以前は 283): +1 件 (i18n パリティ)。
- **5 件の Playwright スモーク** が CI に統合。

### 📦 新規エンドポイント

| メソッド | パス | 目的 |
|---|---|---|
| `POST` | `/api/evaluate/test-anthropic` | `ANTHROPIC_API_KEY` のスモークチェック (P-7)。 |

---

## [1.8.0] — 2026-05-08

ハードニング、リファクタリング、SDD 基盤の構築。重要度高の修正 3 件 (A1、A2、A3)、中程度 4 件 (B1–B4)、軽微なクリーンアップ 6 件、親プロジェクト career-ops v1.7.0 の監査、`server/index.mjs` 分割 (P-2 フェーズ 1)、Playwright ブラウザスモーク、`docs/` と `.claude/` への完全な SDD 基盤。

### 🔥 重要度高

- **`fix(deep): Anthropic SDK 呼び出しに cv/profile/mode を埋め込み (REVIEW-A1)`** — `/api/deep` と `/api/mode/:slug` は「これらのファイルを先に読め」と指示していたが、Anthropic SDK にはファイルシステムがない。出力が空虚だった。`bundleProjectContext` が `cv.md`、`config/profile.yml`、`modes/_shared.md`、モードテンプレートを読み、各 16 KB に切り詰め、`<project_context>` ブロックをプロンプト前に挿入する。実機検証: `claude-sonnet-4-6` から 26 KB の根拠ある markdown。
- **`fix(runner): grace 期間後に SIGTERM → SIGKILL エスカレーション (REVIEW-A2)`** — システムコールでハングした子プロセスが SSE 接続を保持し続ける問題を解消。両経路で 5 秒の watchdog を起動し `SIGKILL` にエスカレートする。
- **`fix(runner): streaming エンドポイントに最大ランタイム上限 (REVIEW-A3)`** — `/api/stream/{scan,liveness,pdf}` は 30 分の上限を持つ。

### 🛡️ 重要度中

- **`fix(preview): /api/pipeline/preview のホップごと検証 (REVIEW-B1)`** — `redirect: 'follow'` から手動リダイレクト追跡へ。各 `Location` を `isValidJobUrl` で再検証、3 ホップ上限。敵対的な掲示板が loopback / プライベート IP / `file://` にリダイレクトすることを防止。
- **`refactor(keys): hasGeminiKey が LLM キー検査を統一 (REVIEW-B2)`**。
- **`feat(scanners): hh.ru、Habr、Greenhouse、Ashby、Lever に AbortSignal を伝搬 (REVIEW-B3)`** — クライアント切断時、進行中の fetch を中止。
- **`test(anthropic): API キーが console に漏れないことを保証する log-guard (REVIEW-B4)`**。

### 🧹 軽微なクリーンアップ

- **`fix(parsers): defense-in-depth として addPipelineUrl 内に URL ゲート (REVIEW-C4)`**。
- **`docs(readme): バッジ 88 → 277 tests (REVIEW-C3)`**。
- **`test(i18n): 不足キーをロケール別にグループ化 (REVIEW-C6)`**。

### 🏗️ P-2 フェーズ 1 — server/index.mjs 分割 (1230 → 762 LOC, −38 %)

挙動変更なし。各ステップで 283/283 unit tests グリーン。

- `server/lib/security.mjs` — サニタイザと信頼性チェック。
- `server/lib/prompts.mjs` — LLM 向けプロンプトビルダ。
- `server/lib/store.mjs` — 防御的リーダ + 初回ブート。
- `server/lib/routes/{scan,runners,content}.mjs` — `registerXxxRoutes(app)`。

フェーズ 2 で tracker / pipeline / reports / jds / llm / health を抽出。

### 🔍 親プロジェクト career-ops v1.7.0 の監査

UI 互換性確認済み。モードカタログ: 7 → 19 (UI は意図的に 7 のみ公開)。`portals.yml` は `tracked_companies` を使用 (96 エントリ、87 有効、71 API あり)。`docs/architecture/DATA-FLOWS.md` に文書化。

### 🤖 SDD / GSD 基盤

- `CLAUDE.md` (ルート)、`.aiignore`、`.claude/agents/*` (3)、`.claude/commands/*` (2)。
- `docs/` ツリー: PROJECT、ROADMAP、sdd/{SDD-GUIDE, CONVENTIONS}、architecture/{OVERVIEW, SERVER, FRONTEND, API, DATA-FLOWS}、reviews/REVIEW-2026-05-07。

### 🔒 セキュリティとリポジトリ衛生

- **`chore(.gitignore): defense-in-depth パターン拡張`** — env バリアント、IDE、GSD scratch、エージェント私的設定、Playwright 成果物、汎用シークレットパターン。

### 🧪 テスト

- **283 unit tests** (以前は 277): +6 件追加。
- **5 件の Playwright ブラウザスモーク** (新規、`npm run test:e2e:browser` で opt-in)。
- カバレッジ ~93 % line / ~83 % branch。

### 📝 新規 npm スクリプト

| スクリプト | 目的 |
|---|---|
| `npm run test:e2e:browser` | in-process サーバに対して Playwright smoke (5 テスト)。 |

---

## [1.7.2] — 2026-05-04

ヘルプセンター、UI 内アプリ設定、モバイルサイドバー、単一 Scan ボタン、すべての prompt-builder に "結果を表示" ショートカット。

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

QA r5 に基づく 35 コミットのハードニング + UX + 機能完成パス。3 つのセキュリティレイヤーが着地し、欠けていた CRUD エンドポイントが全て埋められ、親プロジェクトのブートストラップが完全自動化、UI に **9 つの新ページ** — Activity、リデザインされた Deep Research、そして 7 つのサイドバーグループモード (project / training / followup / batch / outreach / interview-prep / patterns) が追加され親の `modes/` を 100% カバー。テストカバレッジは **73** から **209** に増加、**24 個のテストファイル** + **23 ステップの包括的 Playwright e2e**。Coverage: **93.5 % 行 / 82.6 % ブランチ**。

### 🔒 セキュリティ

- **`fix(cv): CV プレビューでの保存型 XSS をブロックするための Markdown サニタイズ` (FIX-C10)** — `PUT /api/cv` は `cv.md` への書き込み前に `<script>`、`<iframe>`、`<object>`、`<embed>`、`<style>`、`<form>`、`<svg>`、`on*=` ハンドラ、`javascript:`/`vbscript:`/`data:text/html` URI を除去します。本文 1 MB 上限 (超過で 413)。クライアントの `UI.md()` は markdown 変換 *前* にすべてのバイトをエスケープするよう書き直され、生 HTML が `innerHTML` に到達できなくなりました。リンク `href` は安全なスキームのホワイトリスト (`http`/`https`/`mailto`/`tel`/相対 + `data:image` のみ) で検証されます。新テスト 17 個。
- **`fix(server): CSP + ベースラインのセキュリティヘッダ` (FIX-L2)** — すべてのレスポンスに `X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy: same-origin` が含まれます。サーバが loopback 外でバインドする場合 (`HOST` ≠ `127.0.0.1`/`::1`/`localhost`)、厳格な `Content-Security-Policy` が追加で適用されます: `default-src 'self'`、`script-src 'self'` (`unsafe-inline` なし)、Google Fonts ホワイトリスト、`connect-src 'self'` で exfiltration をブロック。`index.html` と `router.js` のインライン `onclick` は `addEventListener` に移行しました。新テスト 8 個。
- **`fix(api): pipeline URL バリデータの強化` (FIX-M7)** — `POST /api/pipeline` が `"not-a-url"` を受け取り永続化していた問題を修正。`isValidJobUrl()` は今やスキームなしの文字列、長さ <10 または >2000、空白を含む URL、`http(s)` 以外のスキーム、loopback ホスト名を拒否します。**FIX-M3** + **FIX-M6** を含みます。
- **`fix(api): プロンプト組み立て前の JD サニタイズ` (FIX-M5)** — `POST /api/evaluate` は ANSI エスケープ、制御バイト、インライン `<script>` タグを除去し、空白を trim します。50 KB の長さ上限。50 文字最小値は *サニタイズされた* テキストに対してチェックされます。
- **`fix(health): HOST!=loopback で Node バージョン + プロジェクトルートをマスク` (FIX-M1)** — `/api/health` は LAN 公開デプロイメントでホストの fingerprint を露出しなくなりました。

### ✨ 新機能

- **`feat: 7 つの新サイドバーモード + グループサイドバー` (FIX-C8)** — 親 `modes/` を 100% カバー。新ルート: `#/project`, `#/training`, `#/followup`, `#/batch`, `#/contacto`, `#/interview-prep`, `#/patterns`。単一 view ファクトリ + 汎用エンドポイント `POST /api/mode/:slug`。サイドバーを 6 グループに分割。合計 18 項目。新テスト 12 個。
- **`fix: 親 deps + russian_portals デフォルトのブートストラップ` (FIX-C4 + C9 + C12 + H2)** — `bin/start.sh` が新規クローンで親の `node_modules` + Playwright Chromium を自動インストール。`createApp()` が `russian_portals:` ブロックがなければ追加。冪等。新テスト 3 個。
- **`fix: 9 つの死んだポータルスラッグを無効化` (FIX-C3)** — 9 スラッグを `enabled: false` に。新 `scripts/portals-health-check.mjs`。新テスト 3 個。
- **`feat(activity): ユーザーアクションログ + Activity サイドバーページ`** — 状態を変更する API リクエストはすべて `data/activity.jsonl` に記録されます。サイドバーに新項目 **アクティビティ** — アクション prefix チップフィルタ、✓/✗ バッジ、リフレッシュボタン。5 MB で自動ローテーション。新テスト 10 個。
- **`feat(deep): ブラウザで Deep Research を表示 + 保存結果のアーカイブ`** — Deep Research ページは今や (a) `{ run: true }` と `GEMINI_API_KEY` が設定されている場合 Gemini でライブ実行し、`interview-prep/{slug}.md` に永続化; (b) 保存されたすべての deep-research ファイルを相対タイムスタンプ付きカードでリスト表示; (c) 結果を Markdown としてレンダリングし、各結果に **📋 コピー / ⬇ .md をダウンロード / ↗ 新しいタブで開く** アクションを提供。新 REST: `GET /api/interview-prep`、`GET /api/interview-prep/:name`、`DELETE /api/interview-prep/:name`。新テスト 7 個。
- **`feat(cv): ブラウザで PDF 生成 + ダウンロード + PDF アーカイブ`** — CV ページの新 **📄 PDF を生成** ボタンが `/api/stream/pdf` をモーダルコンソールでストリームします。`ERR_MODULE_NOT_FOUND` / `playwright` エラー時にコピペ可能なブートストラップコマンドを表示します。「生成された PDF」セクションは成功後に自動ロードされ、すべての `output/*.pdf` を **↗ 開く** + **⬇ ダウンロード** ボタンと共に表示します。新 REST: `GET /api/output/pdfs`、`GET /api/output/pdfs/:name`。新テスト 6 個。
- **`feat(api): POST /api/tracker — UI から行を追加` (FIX-H8)** — ブラウザから `data/applications.md` に正規行を追加。company + role を検証し、`templates/states.yml` で状態を正規化、ゼロパディングの `#` を自動インクリメント、company+role で大文字小文字を無視して dedup。新テスト 6 個。
- **`feat(api): DELETE /api/jds/:name` (FIX-H4)** — シェルなしで保存済み JD を削除。path-traversal をサニタイズ、`.txt` サフィックス必須。新テスト 5 個。
- **`feat(api): POST /api/evaluate/test-gemini` (FIX-H7)** — 50 文字のダミー JD を `gemini-eval.mjs` に流して API キーの動作を検証する smoke-test エンドポイント。

### 🐛 バグ修正

- **`fix(router): catch-all 404 ビュー + i18n カバレッジガード` (FIX-C7)** — 不明なハッシュルートはもう dashboard に静かにフォールバックしません。専用の 404 ページを表示します。新 `tests/i18n-coverage.test.mjs` がすべての 173+ キー × 8 ロケールを検証します。
- **`fix(router): #/profile → settings エイリアス` (FIX-C2)** — 両アドレスが同じビューに到達し、サイドバーが正しくハイライトされます。
- **`fix(health): Health/Doctor の統合 + テンプレートプロフィールのフラグ` (FIX-C6 + FIX-H6)** — `/api/health` は Doctor が報告していたすべて (parent deps、Playwright、ディレクトリ、profile-customized、`HH_USER_AGENT`) を公開します。
- **`fix(scan): RU 設定の query↔negative 衝突を警告` (FIX-H3)** — `portals.yml` が negative に `"PHP"` を持ち、query が Senior PHP をターゲットする場合に発生する問題。`runRuScan()` が開始前に警告を emit します。
- **`fix(scan): HH_USER_AGENT が未設定の場合に警告` (FIX-H1)** — `/scan` が黄色のカードを表示します。
- **`fix(api): POST /api/jds で slug がサニタイズされた場合に警告` (FIX-M2)** — レスポンスに `warning` フィールド。
- **`fix(ui): ルート変更時のグローバル検索クリア + ボタンスピナー` (FIX-M4 + FIX-L1)** — 新ヘルパー `UI.withSpinner(button, fn)`。
- **`fix(ui): 空の modal-title プレースホルダ` (FIX-H9)** — ハードコードされた英語 `"Title"` を削除。

### 🌐 i18n

- 173+ 翻訳キー × 8 ロケール (`en`、`es`、`pt-BR`、`ko`、`ja`、`ru`、`zh-CN`、`zh-TW`)。すべてのロケールに新キーを追加。カバレッジは `tests/i18n-coverage.test.mjs` で強制されます。

### ⚙️ DevOps

- **テスト:** 73 → **225** (+136 テスト、25 ファイル)。Coverage: 93.5% 行 / 82.6% ブランチ。
- **包括的 Playwright e2e** (`tests/e2e-comprehensive.mjs`、23 ステップ)。
- **GitHub Actions:** `ci.yml`、`ai-review.yml` (Claude Code が全 PR レビュー)、`release.yml`。
- **CSP 互換 UI:** すべてのインライン `onclick` を削除。

### 📦 新 REST エンドポイント

| メソッド | パス | 目的 |
|---|---|---|
| `GET`    | `/api/activity`              | ユーザーアクティビティイベントのリスト |
| `GET`    | `/api/interview-prep`        | 保存された Deep Research のリスト |
| `GET`    | `/api/interview-prep/:name`  | 単一の Deep Research を読む |
| `DELETE` | `/api/interview-prep/:name`  | Deep Research を削除 |
| `GET`    | `/api/output/pdfs`           | 生成された PDF のリスト |
| `GET`    | `/api/output/pdfs/:name`     | PDF をダウンロード (attachment) |
| `POST`   | `/api/tracker`               | `applications.md` に行を追加 |
| `DELETE` | `/api/jds/:name`             | 保存された JD を削除 |
| `POST`   | `/api/evaluate/test-gemini`  | Gemini API キーの smoke-test |

---

## [1.6.0] — 2026-05-02

Web UI の初公開リリース。機能インベントリは `README.md` を参照してください。
