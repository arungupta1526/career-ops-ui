# 変更履歴

**career-ops-ui** の主要な変更履歴。形式は [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)、バージョンは [SemVer](https://semver.org/) に準拠します。

翻訳: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

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
