# 変更履歴

**career-ops-ui** の主要な変更履歴。形式は [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)、バージョンは [SemVer](https://semver.org/) に準拠します。

翻訳: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [Русский](CHANGELOG.ru.md) · [简体中文](CHANGELOG.zh-CN.md) · [繁體中文](CHANGELOG.zh-TW.md)

> **翻訳ノート** — このファイルは全エントリが日本語本文で完全に翻訳済みです。コードブロック、コミットメッセージ、ファイルパス、URL、環境変数、コマンド、リンクラベルは原文のまま保持しています。

---

## [1.28.0] — 2026-05-14

**ドキュメント整合 + `#/batch` の `--max-retries N` コントロール。**`qa/QA-PROMPT-docs-vs-app.md` から提起された 2 件のオープン issue を解消します。

- **Issue #2** — `#/batch` に数値入力「Max retries」(1–10) を追加。「Retry failed」がチェックされた場合のみ有効化。サーバ側で `parseInt` と 1≤N≤10 のレンジ検証を行い、範囲外は静かに破棄、`--retry-failed` なしで `--max-retries` は付与されません。`tests/batch-max-retries.test.mjs` の 7 ケース。新規 i18n キー 2 個 × 8 ロケール。
- **Issue #1** — 8 個の help-bundle と 8 個の README の AI CLI リストを career-ops.org/docs の正典(Claude Code・Codex・OpenCode・Qwen CLI)に揃え、ローカライズされた一文を追記:*「同じスラッシュコマンド・サーフェスで他の Claude 互換 CLI も動作します」*。README の「Multi-CLI」項目(web-ui 自身の shim ファイル説明)はそのまま(別 surface)。`tests/canonical-docs-coverage.test.mjs` に新規カナリア 2 個。
- **506 → 515** unit + acceptance(+9 新規)。Playwright 32/32 変更なし。完全な詳細は [`CHANGELOG.md`](CHANGELOG.md) を参照。

---

## [1.27.0] — 2026-05-14

**外観 + アクセシビリティ調整: サイドバーの `#/dashboard` エントリ重複排除。**

サイドバーで、ブランドロゴ（`<a class="logo" href="#/dashboard">`）と最初のナビ項目が同一ルートを指していました。スクリーンリーダーは「Dashboard」を二回読み上げ、キーボード操作で無意味なタブストップが発生していました。ブランドブロックは通常の `<div class="logo">` になり、ナビ項目のみが `#/dashboard` への唯一のリンクとなります。**506 / 506** unit + **32 / 32** Playwright — 変更なし。詳細は [`CHANGELOG.md`](CHANGELOG.md) を参照。

---

## [1.26.1] — 2026-05-14

**ホットフィックス WCAG 2.5.5 — `.btn` 最小高さ 44 px の復元.**

v1.26.0 で `.btn` の `min-height: 44px` 宣言が失われ、ヘッダーボタンが 39-41 px で描画されていました (WCAG 2.5.5 違反)。v1.26.1 で 44 px のフロアと `flex-shrink: 0` + `line-height: 1.2` を復元。**502 → 506** unit、Playwright 32/32 変更なし。詳細は [`CHANGELOG.md`](CHANGELOG.md) を参照。

---

## [1.26.0] — 2026-05-14

**テストピラミッド + 行カバレッジ ≥ 93 %.**

v1.25 バックログに従い 4 階層テストピラミッド (unit → functional → acceptance → e2e) を導入。v1.25 で最大だったカバレッジギャップを埋める 22 件の新テスト (jds.mjs 61.64 % → 100 %、auto-pipeline 拒否経路)。マルチエンドポイントのユーザージャーニーテスト用に `tests/acceptance/` ディレクトリを新設。**480 → 502** unit + acceptance、Playwright 32/32 変更なし。詳細は [`CHANGELOG.md`](CHANGELOG.md) と [`docs/architecture/TESTING.md`](docs/architecture/TESTING.md) を参照。

---

## [1.25.0] — 2026-05-14

**自動パイプラインの手動ショートサーキット + ダッシュボードのコスメティック修正 + CHANGELOG パリティのバックフィル。** G-014 (自動パイプラインが `mode: 'manual'` を無視していた問題)、G-012 (CHANGELOG パリティのドリフト — 6 ロケールが 2 リリース遅れていた)、およびダッシュボードの `✨ ✨` 二重グリフのコスメティック問題をクローズします。G-003 (`README.cn.md` のリネーム) は実質的に既にクローズ済み — リポジトリには `README.zh-CN.md` しか存在しません。G-005 (A-G → A-F レポートブロックの再整列) は親プロジェクトとの協調コミットが必要で、引き続き延期となります。

### 🛡️ G-014 — 自動パイプライン `mode: 'manual'` ショートサーキット

- **`fix(auto-pipeline): G-014 — honour mode:'manual' short-circuit`** ([`server/lib/routes/auto-pipeline.mjs:158-195`](server/lib/routes/auto-pipeline.mjs#L158-L195)) — v1.25 以前は、このルートは常に LLM を呼び出していました。`mode: 'manual'` を渡す (v1.10.2 以降の `/api/evaluate` のミラー) は黙って無視され、リクエストは Anthropic で 1〜3 分ハングしていました。新ハンドラの動作は以下の通りです:
  - 後方互換のため `mode` と `evalMode` の両方を受け付けます。いずれかが `'manual'` であればショートサーキットが発動します。
  - 5 ステージ全ての SSE を `status: 'done'` / `status: 'skipped'` で送出します。fetch なし、LLM 呼び出しなし、リクエストあたり $0.05 のコストなし。
  - `done` ペイロードは `{ mode: 'manual', prompt: <buildEvaluationPrompt scaffold>, message }` を含み、SPA は既存の `/api/evaluate` 手動プロンプトカードと同様にレンダリングできます。
- **`HOST=0.0.0.0` における DoS リスクをクローズ**: 以前は `llmRateLimit` が 10 req/60s/IP で上限を設けていたとしても、攻撃者 10 名 × 各 10 リクエスト = 1 分あたり $50 の Anthropic 課金が発生していました。ショートサーキットは実呼び出しのレート制限カウントが減る前に発火します。
- **テスト** — [`tests/auto-pipeline-manual-mode.test.mjs`](tests/auto-pipeline-manual-mode.test.mjs): 3 件のテストで以下を確認します — (1) `mode: 'manual'` が 5 ステップキー全てを伴って 2 秒以内に返ること、(2) `ANTHROPIC_API_KEY` がセットされていてもショートサーキットが発火すること (元の症状)、(3) レガシーな `evalMode: 'manual'` 呼び出し元が引き続き動作すること。

### 📝 G-012 — CHANGELOG パリティのバックフィル (6 ロケール × 欠落 2 リリース)

- **`docs(changelog): backfill v1.23.0, v1.24.0, v1.24.1, v1.25.0 in 6 lagging locales`** — v1.25 以前は EN のみが v1.23-v1.24 を持ち、RU は 1 リリース遅れ、その他 6 ロケールは 2 リリース遅れでした。v1.25 では並列翻訳エージェント (v1.23 と同じパターン) をディスパッチし、4 エントリ全てを `CHANGELOG.{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md` に投入します。RU は v1.24.0 + v1.24.1 + v1.25.0 を受け取ります (v1.23.0 は v1.23 サイクルで既に翻訳済み)。
- **`feat(ci): scripts/check-changelog-parity.mjs gate`** — いずれかのロケール CHANGELOG の最新エントリが EN 正本より古い場合、ビルドを失敗させます。`npm run test:ci` に組み込み済み。既存の G-012 ドリフトは、EN の境界を越えた瞬間に自身を検出できていたはずです。

### ✨ コスメティック — ダッシュボードの二重グリフ重複排除

- **`fix(dashboard): dedup ✨ glyph in auto-pipeline button label`** ([`public/js/lib/i18n-dict.js:219`](public/js/lib/i18n-dict.js#L219)) — `dash.autoPipeline` は全ロケール文字列の先頭に `✨` を含んでおり、加えて `public/js/views/dashboard.js:58` がビュー側でさらに `✨` を前置していました。結果、ボタンは `✨ ✨ Auto-pipeline …` とレンダリングされていました。v1.25 では各ロケール DICT エントリの先頭グリフを削除し、ビューの前置を唯一のソースとします。同じ監査パスで残りの i18n バンドルもスイープしましたが、他に二重グリフのパターンは見つかりませんでした。

### 🚫 将来のリリースへ延期

- **G-005 — 正規 career-ops.org/docs に従ったレポートブロック A-G → A-F** — 親プロジェクト `santifer/career-ops` の協調コミットが必要 (`modes/oferta.md` を書き換えて A=Role、B=CV-match、C=Strategy、D=Comp、E=Personalization、F=STAR を出力し、C-Risks / G-Legitimacy を独立ブロックから外す)。v1.25.0 は web-ui 側を新スキーマ受け入れ可能な状態で出荷します (`reports.js` は v1.13 以降、任意のブロック文字を受け付けます)。親と子を一緒に着地できる次のリリースウィンドウまでトラックします。
- **G-003 — `README.cn.md` → `README.zh-CN.md` リネーム** — v1.25 準備時に検証済み: リポジトリには既に `README.zh-CN.md` のみが存在し (worktree 配下に孤児の `README.cn.md` は皆無)。G-003 の指摘は陳腐化していました。

### 🧪 テスト

- **477 → 480** ユニットテスト (+3 は PR-B の `auto-pipeline-manual-mode.test.mjs` より)。
- 32/32 Playwright は変更なし。
- `npm run test:ci` は `npm test` + `check-no-also-leftovers.mjs` + `check-changelog-parity.mjs` を実行するようになりました。

### 検証

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

### 破壊的変更

なし。`mode: 'manual'` はオプトインで、レガシーな `evalMode: 'manual'` 呼び出し元は変更なしで引き続き動作します。

### スコープ外 (v1.26+)

| 項目 | 備考 |
|---|---|
| G-005 — A-F レポートブロックの再整列 | 親プロジェクトの協調コミットが必要 (`santifer/career-ops` が `modes/oferta.md` を書き換え)。 |
| QA シナリオ 31 の **ビジュアル** サブテストのライブ実行 | ブラウザ駆動エージェント (Claude Cowork) が必要。Playwright スモークで部分的にカバー。 |
| `i18n-dict.js` の 400-LOC 目標超過 | 翻訳フィクスチャ — ポリシーにより除外。バンドラを使わずに分割すると HTTP リクエストが増えるため不採用。 |

---

## [1.24.1] — 2026-05-14

**ホットフィックス: 8 ロケール全てで `#/config` がクラッシュ (G-015)。**

### 🚑 重大ホットフィックス

- **`fix(config): G-015 — replace removed Element.prototype.also call in config.js`** ([`public/js/views/config.js:371`](public/js/views/config.js#L371)) — v1.22.0 の N-2 で `Element.prototype.also` のグローバルモンキーパッチを撤去し、`cv.js` をフリーステートメントパターンへ移行しましたが、**`config.js` の移行が漏れていました**。結果、`#/config` は全ロケールで初回呼び出し時に `c(...).also is not a function` を伴ってクラッシュしていました。v1.24.1 では `cv.js:188-201` と同じ移行パターンを適用 — ツリーを `const root = c(...)` に抽出し、起動ブロックを単体で実行した後 `return root;` を返します。

### 🛡️ CI ゲート

- **`feat(ci): scripts/check-no-also-leftovers.mjs sweep`** — `public/js/views/` 配下の全ファイルを走査し、いずれかの `.also(` 呼び出しサイト (コメント内参照は許可) があればビルドを失敗させます。新しい `npm run test:ci` スクリプトに組み込み済み。将来モンキーパッチ撤去がリバートされても、同じリグレッションが黙って再導入されることはありません。

### 🧪 テスト

- **`test: tests/config-view-syntax.test.mjs`** — 3 つのガード:
  - `node:vm.Script` で `config.js` をパース (Playwright なしでも構文レベルのリグレッションを捕捉)
  - コメント外に `.also(` が残っていないことを表明
  - `const root = c(...)` / `return root;` の移行アンカーが存在することを表明
- **474 → 477** ユニットテスト (+3) + 32/32 Playwright は変更なし。

### 検証

```bash
$ npm run test:ci
# 477 / 477
# ✓ no .also( leftovers in views/

# Browser smoke:
$ open http://127.0.0.1:4317/#/config
# → renders normally, no "is not a function" card. Every locale equivalent.
```

### スコープ外 (v1.25 に延期)

- G-014, G-012, G-005, G-003 — バンドルは下方の v1.25.0 エントリを参照してください。

---

## [1.24.0] — 2026-05-14

**ヘルプバンドルのコンテンツ深度リフレッシュ + QA シナリオ 31 のライブ実行 + RU CHANGELOG のエンドツーエンド翻訳。** v1.23.0 の「スコープ外」テーブルで v1.24 に延期された 2 項目を両方クローズします: 5 本の正規 career-ops.org/docs URL から 8 言語ヘルプバンドル全ての本文を深度リフレッシュ (v1.11.x 以降は URL カバレッジのみだった)、および稼働中サーバに対する QA シナリオ 31 のライブ実行 ("ブラウザエージェント + LLM 認証情報が必要" としていたが、6/6 サブテストのうち curl + grep で到達可能で、ビジュアルサブテストのみブラウザが必要と判明)。

### 📖 ヘルプバンドルのコンテンツ深度リフレッシュ

- **`docs(help): refresh en.md from 5 canonical career-ops.org/docs URLs`** ([`docs/help/en.md`](docs/help/en.md)) — v1.24 以前は EN バンドルは 1113 行で、フロントマターに 5 本の正規 URL を列挙していましたが、本文では展開していませんでした。v1.24 では WebFetch で 5 URL 全てを取得し、対応する H2 セクションを深堀りします:
  - **About career-ops (フロントマター)** — 原則 (データ主権、AI 非依存、人間が制御) を追加、"What career-ops is NOT" ブロック追加、コンセプト一覧を 6 → 10 行に拡張 (Proof points、JD store、Interview-prep、Batch additions を追加)。
  - **§5 Portals** — 正規ブートストラップ `cp templates/portals.example.yml portals.yml` を追加、`tracked_companies` エントリ毎の必須/任意フィールドを明確化。
  - **§7 Scan** — Option A に「AI トークンを消費しない」注記を追加、後続コマンドリスト (`apply` / `contacto` / `deep` / `tracker`) を追加。
  - **§14 Apply checklist** — SPA チェックリストモード vs Manual-vs-Playwright-assisted vs Full CLI フロー (`/career-ops apply <company>` から `Submitted.` までの正規 8 番号ステップ、`Evaluated → Applied` 自動遷移付き) に分割; バッチ評価サブセクションに TSV スキーマテーブル + 4 フラグ全ての記載 + `merge-tracker.mjs --dry-run` を追加; Playwright Setup サブセクションにインストールコマンド、MCP 登録、代替 `.claude/settings.local.json`、デフォルトでのヘッドレス注記を列挙。
- **16-H2 セクションパリティを維持** (CI テスト `help-ui.test.mjs::section-parity` が全 8 ロケールで H2 セクションが厳密に 16 個であることを表明)。
- **5 本の正規 URL がそれぞれバンドル内に 2 回以上出現** (CI テスト `canonical-docs-coverage.test.mjs` が強制)。v1.24 後の URL 毎の出現回数: `what-is-career-ops` × 4、`scan-job-portals` × 5、`apply-for-a-job` × 3、`batch-evaluate-offers` × 5、`set-up-playwright` × 3。
- **`docs(help): translate the v1.24 deepening to 7 non-EN locales`** — 7 つの並列翻訳エージェントをディスパッチ。各ターゲットロケール (es / pt-BR / ko-KR / ja / ru / zh-CN / zh-TW) は EN 構造をセクション毎に反映したリフレッシュバンドルを受け取り、コードブロック / URL / ファイルパス / ボタンラベル (📁 Upload CV / 🌐 Scan now / ▶ Evaluate / 📄 Generate PDF / 💾 Save) と英語略語 (CSP, SSRF, TOCTOU, WCAG, ATS, JD, SSE, REST, API) は原文のまま保持し、深化部分はターゲット言語のパブリケーション品質のネイティブ技術スタイルに翻訳します。

### 🧪 QA シナリオ 31 — ライブ実行 (6/6 PASS)

- **`docs(qa): append last-verified live-execution log to qa/claude-cowork-browser-test-prompt.md`** — v1.24 以前のシナリオ 31 はドキュメント化されていたものの、稼働中サーバに対して未実行 ("ブラウザエージェント + LLM 認証情報が必要" として延期)。v1.24 では 6 つのサブテスト全てを `http://127.0.0.1:4317` に対して実行しました:

  | Sub | 説明 | ステータス |
  |---|---|---|
  | 31.1 | ヘルプバンドル内のスコア閾値 | ✅ PASS (`docs/help/en.md` 内で 4.5 × 3、4.0 × 9、3.5 × 6 言及) |
  | 31.2 | スキャンワークフローのエンドポイント | ✅ PASS (`/api/stream/scan-{en,ru}` + `/api/scan-ru/config` → 404; `/api/scan/regional/config` → 200) |
  | 31.3 | `/api/apply-helper` チェックリスト | ✅ PASS (本文に `career-ops apply` + `auto-submit` 警告を含む) |
  | 31.4 | `/api/batch` エンドポイント | ✅ PASS (キー `[exists, runnerExists, raw, rows, additions]`) |
  | 31.5 | Playwright の可用性 | ✅ PASS (`/api/health` が `Playwright (parent node_modules) ok: true, value: installed` を報告) |
  | 31.6 | ヘルプバンドル URL カバレッジ (5 URL × 8 ロケール) | ✅ PASS (**40 / 40 ✓**) |

  ビジュアル専用サブテスト (ブラウザを必要とする) は QA プロンプトで個別にフラグ — 引き続き Claude Cowork または `npm run test:e2e:browser` で実行可能。

### 🌐 RU CHANGELOG エンドツーエンド (M-9 フォローアップ)

- **`docs(translate): CHANGELOG.ru.md retry agent — full body translation`** ([`CHANGELOG.ru.md`](CHANGELOG.ru.md)) — v1.23.0 リリースは RU CHANGELOG リトライエージェントが進行中のまま出荷されました (一度ソケットエラーでクラッシュし、再ディスパッチされていた)。v1.24 ではエージェントの 1542 行に及ぶフル翻訳を取り込みます: v1.23.0 → v1.6.0 までの全エントリがパブリケーション品質のロシア語本文を持ち、EN 本文の応急処置は撲滅されました。スタイル規律は v1.22.0 README 品質リフレッシュと同等: 不格好な "функционал" は "функциональность" / "возможности" / "поведение" に置換; "при помощи" は "через" / "с помощью" に置換; 受動態より能動態優先; "эндпоинт"、"レート制限"、"競合状態"、"サニタイズ" を正規用語として採用; 英語略語 (TOCTOU, CSP, SSRF, WCAG, ATS, JD, SSE, REST, API) は原文保持。

### 🧪 テスト

- **474 / 474** ユニット + 20 / 20 スモーク E2E + 32 / 32 Playwright。挙動テストのデルタはゼロ; ヘルプバンドルの CI 表明 (16 H2 セクション × 8 ロケール、5 URL × ≥ 2 言及、コンテンツフロア) は全てグリーンを維持。

### 検証

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

### 破壊的変更

なし。

### スコープ外 (v1.25+)

| 項目 | 備考 |
|---|---|
| シナリオ 31 の **ビジュアル** サブテストのライブ実行 | ブラウザ駆動エージェント (Claude Cowork または `npm run test:e2e:browser`) が必要。curl のみの実行ではスコープ外で、既存の Playwright スモークでカバー。 |
| 旧エントリ (v1.5.x 以下) の RU CHANGELOG 本文翻訳 | リトライエージェントは v1.6.0 以降のみカバー。v1.6 より前のエントリ (`v1.5.x` 等) — 仮に存在していたとしても — 既存コンテンツのまま。 |
| 今後の SPA 変更後のダッシュボードスクリーンショットのビジュアルリグレッション | `scripts/capture-dashboard-screenshots.mjs` がロケール毎の PNG を再生成; 現状自動 diff なし。 |

---

## [1.23.0] — 2026-05-14

**i18n 分割 + 接続バナー CI 修正 + ロケール別ダッシュボードスクリーンショット + 全バックログの応急処置クローズ。** v1.22.0 の「スコープ外」テーブルで v1.23 にフラグされた 3 項目 (M-9 ロケール CHANGELOG 本文、N-1 `i18n.js` LOC 分割、ヘルプバンドルコンテンツ監査) に加え、v1.22.0 後の main ブランチ CI をレッドにしたスモーク E2E テストへのホットフィックスを出荷します。

### 🚑 CI ホットフィックス — 接続バナーリカバリ

- **`fix(client): reset health-poll cadence + visibilitychange eager re-check`** ([`public/js/api.js:21-91`](public/js/api.js#L21-L91)) — v1.22.0 の M-6 指数バックオフは正しい設計 (3 秒 → 6 秒 → 12 秒 → 上限 15 秒、元の上限 60 秒から低下) でしたが、進行中の `setTimeout` は直前に設定された delay にロックされていました。t=0.1 でサーバが kill され、最初の ping が t=3 で失敗すると delay は 6 へ倍化し、次の復旧プローブは t=9 まで発火しません。スモーク E2E の「Flow 2a: connection banner appears on server down, hides on recovery」は 4 秒しか待たず、`main` でレッドに転じました。

    v1.23.0 はポーリングループを再構築します:

    - `_healthHandle` を追跡することで `setConnectionState(lost=true)` が `clearTimeout` を呼び、`_HEALTH_MIN` で再スケジュールできるようにしました。最初の復旧プローブは、キューに積まれた delay に関係なくダウンから 3 秒以内に発火します。
    - `_HEALTH_MAX` を 60 秒から 15 秒に低下。デッドサーバに対してバックグラウンドのタブはユーザが戻ったとき 1 ポーリングサイクル内で復旧し、帯域節約も維持されます。
    - `document.addEventListener('visibilitychange')` でタブがフォーカスを取り戻し `connectionLost === true` のときに即時再チェック — Cmd-Tab で戻る際に次のバックオフティックを待ちません。

### 🧹 N-1 — i18n.js 分割 (400-LOC 目標超過)

- **`refactor(client): split DICT into i18n-dict.js (data) + i18n.js (logic)`** — v1.23 以前は `public/js/lib/i18n.js` が 639 LOC。大部分 (23-586 行) は `DICT` 翻訳テーブル — 純粋な構造化データでした。v1.23.0 ではこれを [`public/js/lib/i18n-dict.js`](public/js/lib/i18n-dict.js) に抽出 (578 LOC、CLAUDE.md の「これらの制限から除外: 生成ファイル、マイグレーション、テストフィクスチャ、ロックファイル、ベンダーコード」により LOC ルールから除外 — 翻訳テーブルはフィクスチャに該当)、[`public/js/lib/i18n.js`](public/js/lib/i18n.js) はピュアなモジュールロジック 86 LOC (400-LOC 目標を十分下回る) に。
- **ローダー契約:** `i18n-dict.js` が `window.__I18N_DICT = { … }` を投入し、続いて `i18n.js` が既存の IIFE 内でそれを読み取ります。[`public/index.html`](public/index.html) は `i18n-dict.js` を `i18n.js` より先に読み込むため、IIFE は構築時に完全に投入された DICT を見ます。Missing-dict フォールバック: 各 `t()` 呼び出しはインラインフォールバックまたは素のキーを返し、SPA をクラッシュさせずに誤設定を明示的に表面化します。
- **テスト配管の更新:** [`tests/i18n-coverage.test.mjs`](tests/i18n-coverage.test.mjs)、[`tests/help-ui.test.mjs`](tests/help-ui.test.mjs)、[`tests/canonical-docs-coverage.test.mjs`](tests/canonical-docs-coverage.test.mjs) は両ファイルをテスト VM コンテキストで実行 (または regex スイープ用にソースを連結) するようになり、既存の全表明を維持します。

### 🌐 M-9 — ロケール CHANGELOG 本文翻訳

- **`docs(translate): 7 non-EN CHANGELOG files end-to-end`** — v1.23 以前は `CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md` は v1.13.0 以降の各エントリで EN 本文の応急処置注記を保持し、フッタは読者を EN 正本に誘導していました。v1.23.0 では 7 並列翻訳エージェント (ロケール毎 1 つ) をディスパッチし、全ての本文をターゲット言語のパブリケーション品質の技術スタイルで書き直します。応急処置注記は撤去。コードブロック、ファイルパス、URL、コミットメッセージスタイル文字列 (`fix(security): B-1 — …`)、環境変数、リンクラベルは全ロケールで原文のまま保持します。

### 🖼️ 全 README にロケール別ダッシュボードスクリーンショット

- **`docs(readme): wire each locale README at its locale-specific PNG`** — v1.23 以前は `README.pt-BR.md` のみが `dashboard-pt-BR.png` を参照し、その他 6 つの非英語 README は依然として `dashboard-en.png` を指していました。スクリーンショット (v1.22.0 サイクルで [`scripts/capture-dashboard-screenshots.mjs`](scripts/capture-dashboard-screenshots.mjs) によって既に撮影済み) は `images/` 配下に存在しましたが未使用でした。v1.23.0 では各 `README.{es,ja,ko-KR,ru,zh-CN,zh-TW}.md` の 14 行目を自身の `dashboard-<locale>.png` に更新します。

### 🧪 テスト

- v1.22.0 と同じ 474 / 474 ユニット + 32 / 32 Playwright。**スモーク E2E は 20 / 20** (v1.22.0 後の `main` ではバナーリカバリのリグレッションで 19 / 1 失敗していたが、v1.23.0 の再スケジュール修正で解消)。
- 既存テスト 3 件を i18n 分割に対応すべく再配線。新規テストファイルゼロ、削除した表明ゼロ。

### 検証

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

### 破壊的変更

なし。`public/index.html` は従来 1 つだったところで 2 つのスクリプトを読み込むようになりました — CDN から SPA を配信する場合は `i18n-dict.js` を取り込む必要があります; スクリプト読み込み順序は `index.html` 内の `<script src>` タグの順序で強制されます。新ファイル欠落時のランタイムフォールバック (空 DICT → `t()` がインライン EN フォールバックを返却) でハードクラッシュを防止します。

### スコープ外 (v1.24+)

| 項目 | 備考 |
|---|---|
| career-ops.org/docs に対するヘルプバンドル CONTENT 深度リフレッシュ (URL カバレッジ vs) | 5 本の正規 URL は v1.11.x 以降全ロケールのヘルプバンドルに既に出現しており、QA プロンプトのシナリオ 31.6 がカバレッジを検証。コンテンツ本文の深度リフレッシュは v1.24+ の候補。 |
| 稼働中サーバに対する QA シナリオ 31 のライブ実行 | ブラウザエージェント + ライブ LLM 認証情報が必要。v1.24 候補。 |
| 新規モードページのヒント段落に対する部品単位のタッチターゲットスイープ | v1.22.0 M-1 で追加された `<p class="field-hint">` 要素は全 8 ロケールで WCAG 2.5.5 最小高さに対する検証が未実施。 |

---

## [1.22.0] — 2026-05-14

**M/L/N バックログの一括解消 + ドキュメント整合性 + 翻訳品質向上パス。** `v1.20.1-BACKLOG.md` の medium 以下の項目を 1 リリースで全てシップしました: M 項目 9 件、L 項目 5 件、nit 2 件。加えて 5 本の正規ガイド [career-ops.org/docs](https://career-ops.org/docs) に対するドキュメント整合性監査、`.claude/` と `.github/` 配下のシステムプロンプト刷新、英語以外 7 ロケール全ての README 品質リフレッシュ。

### 🛡️ セキュリティ強化 (多層防御)

- **`fix(security): M-4 — entity-aware stripDangerousMarkdown`** ([`server/lib/security.mjs`](server/lib/security.mjs)) — v1.22 以前の正規表現は `<script>`、`javascript:`、`on*=` をリテラル部分文字列として照合していました。`&lt;script&gt;`、`java&#115;cript:`、`<img src="data:image/svg+xml,<svg onload=…>">` は通り抜けていました。サニタイズ処理は strip 正規表現を走らせる **前** に `&lt;`、`&gt;`、`&amp;`、`&quot;`、数値参照 (`&#NN;`)、16 進参照 (`&#xHH;`) をデコードするようになりました。[`tests/cv-xss-bypasses.test.mjs`](tests/cv-xss-bypasses.test.mjs) の 11 件のテストで検証済みです。実際の防御はクライアント側の `UI.md` の escape-first パイプラインが担いますが、本修正はディスク上のファイルそのものを堅牢化します。

- **`fix(security): L-2 — bash --noprofile --norc on the batch runner`** ([`server/lib/routes/batch.mjs:108`](server/lib/routes/batch.mjs#L108)) — `spawn('bash', [PATHS.batchRunner, ...])` はユーザーの `~/.bashrc` を継承していました。悪意ある rc ファイルが実行に影響を及ぼし得ます。現在は `spawn('bash', ['--noprofile', '--norc', PATHS.batchRunner, ...])`。

### 🔒 レジリエンス

- **`fix(client): M-6 — exponential backoff on health ping`** ([`public/js/api.js:22-48`](public/js/api.js#L22-L48)) — disconnected 状態のポーラーは停止したサーバーに対し一晩で 28,800 回の fetch を発火していました。現在は 3 秒 → 6 秒 → 12 秒 → 24 秒 → 60 秒、最初の 2xx 回復で 3 秒にリセット。各ステップが新しい遅延を読み取れるよう、`setInterval` ではなく `setTimeout` チェーンで構成しています。

- **`fix(client): M-5 — Safari private-mode localStorage guard`** ([`public/js/lib/i18n.js:572-583`](public/js/lib/i18n.js#L572-L583)) — Safari のプライベートモードでは `localStorage.getItem/setItem` の度に `SecurityError` がスローされます。ロード時の IIFE が i18n モジュール全体を失敗させ、SPA が生のキー文字列をレンダリングする状態に陥っていました。両方の呼び出しを try/catch でラップし、`detect()` によるブラウザ言語フォールバックに切り替えました。

- **`fix(server): M-2 — body-size cap on outbound preview fetches (test + verify)`** — v1.21.0 の `safeGet` は既にチャンクをストリーミングし `opts.maxBytes` で上限を設けていました。v1.22 では契約をロックするための回帰テストを [`tests/ssrf-redirect-rebind.test.mjs`](tests/ssrf-redirect-rebind.test.mjs) に追加: 上流 100 KB + 4 KB 上限 → レスポンス ≤ 4 KB。

- **`fix(client): L-5 — clear setTimeout on hashchange in scan.js`** ([`public/js/views/scan.js:6-22, :113-120`](public/js/views/scan.js#L6-L22)) — done 後の 300 ms `refreshResults()` タイマーは、そのウィンドウ内にユーザーが `#/scan` から離脱するとリークしていました。ハンドルを捕捉し `__cancelActiveScanPoll` でクリアするようになりました。

- **`fix(client): L-4 — multi-line SSE data: joiner`** ([`public/js/lib/auto-pipeline.js:158-176`](public/js/lib/auto-pipeline.js#L158-L176)) — SSE パーサーは `match()` (単一行) を使っていました。仕様上、イベントは複数の `data:` 行を持つことができ、コンシューマーは `\n` で結合します。サーバーは現在単一行 JSON しか送っていないため旧コードは動作していましたが、将来の複数行ペイロードに対して脆弱でした。

### ♿ アクセシビリティ

- **`feat(a11y): M-3 — WCAG 1.4.1 redundant cues on score pills + connection banner`** ([`public/css/app.css:602-625, :812-822`](public/css/app.css#L602-L625)) — score-high / score-mid / score-low は色相 (赤/琥珀/緑) だけで状態を伝えていました。色相を知覚できないユーザーには代替手段がありませんでした。各階層は `::before` 経由で冗長なグリフ (✓ / ◐ / ○) を持つようになりました。Connection banner はオフライン状態で先頭に `⚠` グリフを表示します。レンダリングサイトは無変更 — 純粋な CSS による堅牢化です。

- **`feat(a11y): M-1 — inline hint paragraphs for every mode-page field`** ([`public/js/views/mode-page.js`](public/js/views/mode-page.js), [`public/js/lib/i18n.js`](public/js/lib/i18n.js)) — v1.20.0 では mode-page の全フィールドに `htmlFor → id` を配線しましたが、インラインのヒントコピーは持ち越されず、README ウォークスルーだけがフィールドの意図を文書化していました。v1.22.0 は 19 件のヒント i18n キー × 8 ロケール = **152 件の新規翻訳** を追加し、`field()` ビルダーがフィールド毎に `<p id="…-hint">` をレンダリングして `aria-describedby` を配線します。スクリーンリーダーユーザーは入力フォーカス時にヒントを聞くことができます。

- **`fix(a11y): M-7 — null-guard on UI.el() htmlFor alias`** ([`public/js/api.js:194-198`](public/js/api.js#L194-L198)) — `htmlFor: null` はリテラル `for="null"` をレンダリングしていました。フォールスルー分岐の `v != null && v !== false` ガードを 1 行ミラーしただけの修正です。

### 🧹 品質 / ポータビリティ

- **`fix(server): L-1 — parseInt radix in health.mjs + bin/start.sh + bin/setup.sh`** — `parseInt(process.versions.node)` の radix 省略は lint 警告を発し、Node が将来 16 進バージョンを出荷した場合に脆弱です。全箇所に `10` を付与しました。

- **`fix(server): L-3 — Windows-safe entrypoint check`** ([`server/index.mjs:159-163`](server/index.mjs#L159-L163)) — `import.meta.url === \`file://${process.argv[1]}\`` は Windows のドライブレターとバックスラッシュを誤処理します。`fileURLToPath(import.meta.url) === path.resolve(process.argv[1])` に置換しました。

- **`refactor(client): N-2 — drop Element.prototype.also monkey-patch`** ([`public/js/views/cv.js:188-201`](public/js/views/cv.js#L188-L201)) — グローバル DOM プロトタイプ汚染。ツリールート用のローカル変数に置換しました。

- **`test(canary): M-8 — 404 regression test for retired /api/scan-ru/config`** ([`tests/scan-consolidated.test.mjs`](tests/scan-consolidated.test.mjs)) — v1.20.0 で alias を撤去しましたが canary が無い状態でした。v1.18 の撤去テストをミラーする 3 行追加です。

### 📚 ドキュメント + システムプロンプト

- **`docs(architecture): refresh OVERVIEW + DATA-FLOWS for v1.21+ surface`** — OVERVIEW.md に `safe-fetch.mjs` (DNS ピン留め GET)、`file-lock.mjs` (パス別ミューテックス)、`rate-limit.mjs` (LLM スロットル)、`sanitizePathName` を追加。DATA-FLOWS.md には新たに 2 セクションを追加: "Outbound URL fetches (DNS-rebind-safe)" と "LLM endpoint rate-limiting"。

- **`docs(readme): security envelope section refresh`** — README.md の "Security notes" は v1.21+ セキュリティエンベロープの全ヘルパー (sanitizePathName、safeGet、withFileLock、llmRateLimit、entity-aware stripDangerousMarkdown) を文書化するようになりました。

- **`docs(qa): scenario 31 — career-ops.org/docs alignment`** ([`qa/claude-cowork-browser-test-prompt.md`](qa/claude-cowork-browser-test-prompt.md)) — 5 本の正規 career-ops.org/docs ガイドで記述された挙動と UI が一致することを検証する 6 個の新サブテスト (31.1–31.6): スコア閾値、scan ワークフロー (ボタン 1 つ)、apply ワークフロー (チェックリスト、自動送信ではない)、batch ワークフロー (TSV エディタ)、Playwright セットアップ (graceful failure)、help バンドル網羅 (URL 5 件 × ロケール 8 件)。

- **`docs(translate): README quality refresh × 7 non-EN locales`** — 英語以外の全 README をネイティブ言語で出版品質の技術文体に書き直し。よくある不自然な calque を置換、v1.21/v1.22 のセキュリティエンベロープへの言及を追加、release/test バッジを更新。

- **`docs(system): .claude/PROJECT-CONTEXT.md + .github/copilot-instructions.md`** — セッションに参加するエージェント向けの 1 ファイル方向付け。CLAUDE.md を圧縮し、v1.21+ のヘルパーを列挙し、よくある落とし穴を記載。

- **`docs(bin): actualize start.sh / setup.sh / run_all.sh comments`** — "two deps" → "three deps" (express + js-yaml + multer);"298 tests" → "474+ tests";`parseInt` radix の追加。

### 🧪 テスト

- **461 → 474 unit** (+13) + 32/32 Playwright は変更なし。
- 新規テストファイル: `cv-xss-bypasses.test.mjs` (M-4、11 テスト)。
- 拡張: `ssrf-redirect-rebind.test.mjs` (+1 for M-2 body cap)、`scan-consolidated.test.mjs` (+1 for M-8 alias canary)。
- 既存スイートにおける挙動上のテスト差分はゼロ — 全ての修正は追加的、もしくは新規 canary でカバーされます。

### 検証

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

### 破壊的変更

ありません。全ての修正は追加的か、既存のエンドポイント契約を保ちます。

### スコープ外 (v1.23+)

| 項目 | ノート |
|---|---|
| M-9 — ロケール CHANGELOG 本文翻訳 | `CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md` の v1.13+ エントリは EN-bodied の応急処置でした。リリースペース鈍化後に一括翻訳の候補。 |
| N-1 — `public/js/lib/i18n.js` が 400 LOC 目標を超過 | ロケール別分割はバンドラ無しでは HTTP コストが増加します。build-step 判断確定まで保留。 |
| career-ops.org/docs からの help バンドル内容刷新 | 5 本の正規 URL は (v1.11.x 以降) 全ロケールの help バンドルに既出。QA プロンプトの Scenario 31.6 が網羅を検証。内容深度の刷新は v1.23 の候補。 |

---

## [1.21.0] — 2026-05-14

**2 つの独立したコードレビューパスから得たセキュリティ + 同時実行性 + a11y のポリッシュ。** [`docs/specs/V1.20.1-BACKLOG.md`](docs/specs/V1.20.1-BACKLOG.md) の 7 件の指摘を 1 リリースでシップ: ブロッカー 1 件 (DNS リバインド TOCTOU)、高重大度バグ 6 件 (path-traversal サニタイズの分散、LAN デプロイにおけるレート制限の欠落、書き込みの競合状態、i18n カバレッジの穴、宙ぶらりんな aria-describedby、label 関連付けの欠落)。新規テスト 34 件;ベースラインは 427 → 461 unit + 32/32 Playwright に上昇。全ての修正には名前付きの回帰テストが伴います。

### 🛡️ セキュリティ

- **`fix(security): B-1 — close DNS-rebind TOCTOU via safe-fetch.mjs`** ([`server/lib/safe-fetch.mjs`](server/lib/safe-fetch.mjs)) — 従来のパターンは検証用に 1 度明示的な `dnsLookup` を行い、その後 `fetch()` に独立した別のルックアップを許していました。TTL=0 の DNS リバインド攻撃者は 1 回目のルックアップで公開 IP を返し、2 回目のルックアップで `127.0.0.1` / `169.254.169.254` / LAN アドレスを返すことで `isPrivateOrLoopbackHost` を回避できました。新しい `safeGet` は名前解決を 1 度だけ行い、node:http(s) 経由で TCP 接続をその IP にピン留めし、証明書検証が元のホスト名を対象とするよう SNI/Host を設定します。`/api/pipeline/preview` と `/api/auto-pipeline` で使用。ルックアップエラー時は fail-CLOSE (以前の `try { … } catch { /* fall through */ }` を反転)。[`tests/ssrf-redirect-rebind.test.mjs`](tests/ssrf-redirect-rebind.test.mjs) の 8 件の新規テストで検証済み。

- **`fix(security): H-4 — consolidate sanitizePathName across 10 routes`** ([`server/lib/security.mjs`](server/lib/security.mjs)) — `jds.mjs`、`content.mjs`、`reports.mjs`、`llm.mjs`、`runners.mjs` にまたがる素の `replace(/[^\w\-.]/g, '')` 正規表現は重複しており、`.` 文字を保持していたため `..pdf`、`....md`、先頭ドット名が通り抜けていました。正しく実装されていたのは `reports.mjs::sanitizeSlug` のみ。v1.21.0 は正しい版 (`sanitizePathName`) を `security.mjs` に集約し、壊れた 10 個のコピーを削除し、空結果を 400 で拒否します。[`tests/path-traversal.test.mjs`](tests/path-traversal.test.mjs) の 12 件のテストで検証済み。

- **`fix(security): H-5 — rate-limit LLM endpoints on public bind`** ([`server/lib/rate-limit.mjs`](server/lib/rate-limit.mjs)) — `/api/evaluate`、`/api/deep`、`/api/mode/:slug`、`/api/auto-pipeline` には IP 別のスロットルがありませんでした。ループバックユーザーには影響なし;LAN 公開デプロイ (`HOST=0.0.0.0`) はオーバーフロー時に `Retry-After` と `X-RateLimit-*` ヘッダ付きで 10 req/min/IP を取得します。`LLM_RATE_LIMIT="N/Ws"` で構成可能。v2.0 P-12 の auth ゲートに先行する廉価な暫定防御です。[`tests/rate-limit.test.mjs`](tests/rate-limit.test.mjs) の 6 件のテストで検証済み。

### 🔒 同時実行性

- **`fix(data): H-6 — per-file mutex on applications.md / pipeline.md`** ([`server/lib/file-lock.mjs`](server/lib/file-lock.mjs)) — 同時の `POST /api/tracker` (もしくは auto-pipeline と手動追加の競合) は両方が `num=42` を読み、両方が `num=43` を書き、先行する行をサイレントに失っていました。`withFileLock(path, fn)` はパス毎に read-modify-write を直列化します;独立したパスは並列実行を維持します。`tracker.mjs`、`pipeline.mjs` (POST + DELETE)、`auto-pipeline.mjs` の tracker ステップに配線。[`tests/concurrent-tracker-write.test.mjs`](tests/concurrent-tracker-write.test.mjs) の 5 件のテストで検証済み (20 並列 POST の統合チェックで 001..020 が逐次定着することをアサート)。

### ♿ アクセシビリティ

- **`fix(a11y): H-1 — id="batch-tsv-hint" on the batch.js hint paragraph`** ([`public/js/views/batch.js`](public/js/views/batch.js)) — v1.20.0 は TSV textarea に `aria-describedby="batch-tsv-hint"` を追加したものの、ヒントの `<p>` に対応する `id` を付けていませんでした。スクリーンリーダーは何も読み上げるものがありませんでした。修正済み。

- **`fix(a11y): H-2 — htmlFor on batch-parallel / batch-min-score labels`** ([`public/js/views/batch.js`](public/js/views/batch.js)) — v1.20.0 で 4 つの input が新しい id を取得しましたが、ラベルがプログラム的に関連付けられていませんでした。WCAG 3.3.2 を満たすようになりました。

- 新規 [`tests/a11y-form-wires.test.mjs`](tests/a11y-form-wires.test.mjs) の静的解析 canary — 全 view ファイルを走査し、各 `aria-describedby` / `htmlFor` IDREF が兄弟の `id:` 宣言を指していることをアサートします。CI 時にタイポ系回帰を検出します。

### 🌐 i18n

- **`fix(i18n): H-3 — 13 keys from v1.20.0 silently fell through to EN for 7 locales`** ([`public/js/lib/i18n.js`](public/js/lib/i18n.js)) — `pipe.filter`、`pipe.count`、`pipe.preview*`、`pipe.openTab`、`pipe.evaluateAll*`、`eval.jdHint`、`batch.parallelAria`、`batch.minScoreAria`、加えて `common.delete`、`config.group{Core,Runtime,Regional}`、`config.profileEmpty`、`config.viewProfile`、`scan.atsBadge`、`scan.regionalBadge` は `t('key', 'EN fallback')` 経由で参照されていましたが DICT には追加されていませんでした。ロシア語・日本語・中国語のスクリーンリーダーユーザーは英語の `aria-label` を聞いており、これは v1.20.0 が主張した WCAG 3.3.2 の勝利を直接打ち消していました。v1.21.0 は 19 キー × 8 ロケール (約 150 件の新規翻訳) を追加し、[`tests/i18n-coverage.test.mjs`](tests/i18n-coverage.test.mjs) に静的解析パスを拡張して `public/js/**/*.js` 内の全ての `t('key', …)` 呼び出しを走査し各キーが DICT に存在することをアサートします。将来のドリフトは CI 時に検出されます。

### 🧪 テスト

- **427 → 461 unit** (+34) + 32/32 Playwright は変更なし。
- 新規テストファイル: `ssrf-redirect-rebind`、`path-traversal`、`concurrent-tracker-write`、`rate-limit`、`a11y-form-wires`。
- 既存の `pipeline-preview.test.mjs` は `globalThis.fetch` モックから `safe-fetch.mjs` の新しい `_setTransport` 注入ポイントへ配線変更 — SSRF パスはもう fetch を通らないため、旧モックはサイレントにバイパスされていました。

### 検証

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

### スコープ外 (v1.22+)

| 項目 | ノート |
|---|---|
| `pipeline-preview` のボディサイズ ストリーミング上限 (M-2) | `await upstream.text()` は 8 KB スライス前に全ボディを読みます;悪意ある 1 GB ストリームでメモリが枯渇し得ます。バイトカウンタ + abort でストリーム読みに。 |
| WCAG 1.4.1 — `.connection-banner` + スコアピルでの色のみによる状態表現 (M-3) | 色相のみが状態を示しています;アイコン接頭 (✓ / ◐ / ○) もしくはテキスト接尾を追加。 |
| `stripDangerousMarkdown` の HTML エンティティ経由のバイパス (M-4) | `&lt;script&gt;`、`java&#115;cript:`、`<img src="data:image/svg+xml,<svg onload=…>">` は正規表現を通り抜けます。UI.md による多層防御は引き続き有効;ドキュメント化 + テストスイープでバイパスをロック。 |
| Safari プライベートモードの `localStorage` アクセスを try/catch 無しで実行 (M-5) | `i18n.js:544/571` がスロー → SPA が生キーをレンダリング。try/catch で `'en'` デフォルトにラップ。 |
| `setInterval(checkHealth, 3000)` がバックオフ無しで永久ポーリング (M-6) | 指数的 3 秒 → 6 秒 → 12 秒 → 上限 60 秒。 |
| `htmlFor` alias の null ガード欠落 (M-7) | 1 行の `if (v != null && v !== false)` 防御。 |
| 撤去された `/api/scan-ru/config` 用 404 canary (M-8) | v1.18 の前例をミラーする 3 行テスト。 |
| ロケール CHANGELOG 本文翻訳 (M-9) | リリースペース鈍化後の一括翻訳候補。 |
| 全 mode-page フィールドのインラインヒント段落 (M-1) | 約 168 i18n キー × 8 ロケール;ポリッシュ項目として保留。 |
| L-1 〜 L-5 の nit | parseInt radix、bash --noprofile、Windows-safe fileURLToPath、複数行 SSE、scan.js タイマークリーンアップ。 |

---

## [1.20.0] — 2026-05-13

**コンポーネント別 a11y ポリッシュ + 英語以外 README パリティ + `/api/scan-ru/config` alias 撤去。** v1.19.0 の "Out of scope" 表で v1.20 向けに挙げられていた 4 項目をクローズします。

### ♿ WCAG 2.5.5 / 2.5.8 — コンポーネント別タッチターゲット監査

- **`a11y(touch-target): chip min-height 28 px + 8 px gap (2.5.8 spaced-target exception)`** — `.chip` は 24 × 約 50 px (垂直 24 でクラスタリングされたコントロール向けの 2.5.5 の 24 px フロアを満たさず);2.5.8 の spaced-target 例外は ≥ 24 × 24 px もしくは 24 px のクリアランスを要求します。`.chip` を `min-height: 28px; padding: 6px 12px;` に、ラップする `.chip-row` を `gap: 8px;` に引き上げ、両条件を満たすようにしました。
- **`a11y(touch-target): sidebar nav-item min-height 44 px`** — `.nav-item` は `10px 14px` のパディングのみで、ほとんどのビューポートで算出高 約 36 px。現在は `padding: 12px 14px; min-height: 44px; box-sizing: border-box;`。`.btn` のフロアと一致します。
- **`a11y(touch-target): tab-btn min-height 44 px`** — Reports、Tracker、Scan results にまたがる Sortable Headers / カテゴリタブにも同じ処理。

### ♿ WCAG 1.3.1 / 3.3.2 — インラインフォームヒントの `aria-describedby`

SPA の全フォームコントロールは安定した `id` を持ち、`<label>` は `htmlFor` で対象を指し、インラインヒント段落は `aria-describedby` で関連付けられるようになりました。5 つの view ファイルが配線変更されました:

- **`a11y(forms): config.js`** — キー毎の `id` + ヒント関連付け (`cfg-<key>` / `cfg-<key>-hint`)。
- **`a11y(forms): evaluate.js`** — `eval-jd` textarea + サニタイズ後の 50 文字最小を文書化する `eval-jd-hint` 段落。
- **`a11y(forms): batch.js`** — `batch-tsv` / `batch-tsv-hint`、加えて `batch-parallel`、`batch-min-score`、`batch-dry-run`、`batch-retry` への `aria-label`。
- **`a11y(forms): pipeline.js`** — `pipe-filter` + `pipe-new-url` / `pipe-new-url-hint`。
- **`a11y(forms): mode-page.js`** — 7 つの汎用 mode (`project`、`training`、`followup`、`batch-prompt`、`contacto`、`interview-prep`、`patterns`) にまたがる全フィールドが `mode-<slug>-<name>` の id と `htmlFor` ラベルを取得。

`UI.el()` は React 形式の `htmlFor` alias を学習し、view コードが宣言的でいられるようになりました — 内部では `for` 属性 (JS 上はプロパティ名として予約) に設定します。

### 🌍 英語以外 README パリティ

- **`docs(readme): translate 7 locales to 585-line parity with EN master`** — `README.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md` は 306〜316 行 (見出しは網羅していたがマーケティング重視のウォークスルーと API リファレンスのほとんどはスキップ) でした。7 ロケール全てが EN 構造を端から端までミラーします: About → One-command install → Why? → Quick start (3 段階) → Requirements → What you get テーブル → Scan → Architecture (完全なディレクトリツリー) → API リファレンス (全ルートテーブル) → Tests → Configuration → Security notes → Limitations → Contributing → 🌍 Getting Started 5 段階ウォークスルー → License。

### 🧹 `/api/scan-ru/config` alias 撤去

- **`feat!(scan): remove /api/scan-ru/config legacy alias (sunset v1.20)`** — v1.19 で 1 リリース分の後方互換 alias として残されていました。正規の `/api/scan/regional/config` のみがパスとして残ります。削除: `server/lib/routes/scan.mjs` のルート登録、`README.md`、`docs/architecture/{OVERVIEW,SERVER,API}.md` のドキュメント参照。テストは既に正規パスをカバーしていたため変更不要。

### 🧪 テスト

- v1.19 と同じスイート。**427 / 427** unit + 20/20 smoke + 23/23 comprehensive + 32/32 Playwright。全ての a11y 配線は追加的 (`id` / `for` / `aria-describedby` の追加) — 挙動変更なし、テスト差分なし。

### 検証

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

### 破壊的変更

- `DELETE /api/scan-ru/config` — 削除。`/api/scan/regional/config` を使用してください。v1.19.0 の CHANGELOG と検証スクリプトで sunset 告知済み。

### スコープ外 (v1.21+)

| 項目 | ノート |
|---|---|
| 全 mode-page フィールドのインラインヒント段落 | 今は `<label for=…>` 関連付けのみ;可視のフィールド毎ヒントコピーは SPA では依然 EN のみ。README ウォークスルーが各ロケールでフィールド意図を文書化しているため、ブロッカーではなくポリッシュ項目です。 |
| `.connection-banner` とダッシュボードスコアピルにおける色のみの状態表現 (WCAG 1.4.1) | バナーは赤/琥珀/緑に依存;色相を知覚できないユーザー向けにアイコンかテキスト接尾が必要。 |
| ロケール別 CHANGELOG 本文翻訳 | `CHANGELOG.{es,pt-BR,ko-KR,ja,ru,zh-CN,zh-TW}.md` には英語本文の応急処置が残ります。v1.x リリースペース鈍化後に翻訳実施。 |

---

## [1.19.0] — 2026-05-13

**WCAG 1.4.3 コントラスト + scan 統合 (最終) + UI から HH_USER_AGENT 削除。** v1.18 のスコープ外コントラスト監査をクローズし、v1.18 で始めた EN/RU 分割排除を完了し、ユーザー指示により UI から `HH_USER_AGENT` 構成ノブを削除します (サーバーに同梱された妥当なデフォルトが既にほとんどのユーザーの非 RU IP を処理します)。

### ♿ WCAG 1.4.3 コントラストパス

- **`a11y(contrast): introduce AA-passing *-text variants for accent tokens`** — ライトテーマ: `--rausch-text: #b80f42` (白上で 6.59:1、旧 3.52:1)、`--kazan-text: #066507` (7.31:1、旧 4.53:1)、`--darjeeling-text: #7a5800` (琥珀背景で 5.73:1、旧 4.24:1)、`--babu-text: #00665e` (6.09:1、旧 2.70:1)。ダークテーマ: 明色化されたミラー (`#ff8aa0`、`#6ee7b7`、`#fcd34d`、`#5eead4`) が `#161a22` ペーパー上で同じ 4.5:1 フロアに到達。
- バッジクラス (`.badge-ok`、`.badge-warn`、`.badge-bad`、`.badge-info`) とスコアピル (`.score-high`、`.score-mid`、`.score-low`) は新しい `*-text` バリアント経由でルートされ — text-on-tinted-bg の全組み合わせが AA を通過します。アクセント塗りつぶしトークン (`--rausch`、`--kazan` 等) はボーダー・アウトライン用にそのまま維持 (非テキスト UI コンポーネントは 3:1 のみ必要)。

### 🧹 Scan 統合 (v1.18 作業の完了)

- **`docs(scan): scrub remaining EN/RU split references across READMEs + help + architecture docs`** — README 8 本 + help バンドル 8 本 + アーキテクチャドキュメント 3 本 (API.md、SERVER.md、OVERVIEW.md、DATA-FLOWS.md) + scan.js コメントが、単一の統合された scan メソッドを記述するようになりました。レガシー `/api/stream/scan-{en,ru}` alias は v1.18 で既に削除済み;v1.19 はスキャンを EN+RU の 2 段階プロセスとしてフレーミングしていた残りのドキュメント/コピーを補足します。
- **`feat(scan): canonical /api/scan/regional/config endpoint`** — `/api/scan-ru/config` は後方互換のため 1 リリース分の薄い alias として保持。新パスは source 命名規約 (`?source=regional`) と一致します。

### 🛠️ UI から HH_USER_AGENT 削除

- **`feat!(config): drop HH_USER_AGENT field from /#/config + KNOWN_KEYS`** — パワーユーザーは引き続き `career-ops/.env` で直接 `HH_USER_AGENT` を設定可能 (サーバーは `server/lib/sources/hh.mjs` で `process.env.HH_USER_AGENT` を読み、同梱 UA をフォールバック)。UI が公開しなくなったのは、デフォルトがほとんどのユーザーで機能し、App Settings ページの不可解な User-Agent フィールドが繰り返し混乱の原因となっていたためです。
- README × 8 ロケール + help バンドル × 8 ロケールの言及を "run via a Russian IP / VPN" 助言に置換。`scan.hhWarning` i18n キーは env-var セットアップ詳細を落として書き直し。
- `KEY_GROUPS` を縮小: `regional` 分類なし (HH_USER_AGENT しか含んでいませんでした)。テスト更新;SPA 後方互換のため `regionalActive` ペイロードフィールドは保持。

### 🧪 テスト

- `tests/env-config.test.mjs` — `KNOWN_KEYS` のアサートが HH_USER_AGENT を除外するように;キーが意図的に欠落していることをアサートする新規追加。
- `tests/config-endpoint.test.mjs` — POST-write 複数キーテストが HH_USER_AGENT の代わりに 2 番目の既知キーとして `GEMINI_MODEL` を使用。
- `tests/config-groups.test.mjs` — `groups.HH_USER_AGENT` は `undefined` 期待。
- 合計: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + 32/32 Playwright。全ての調整済みテストは既に計上済みのため v1.18.0 と同じ数。

### 検証

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

### スコープ外 (v1.20+)

| 項目 | ノート |
|---|---|
| コンポーネント別タッチターゲット監査 (フィルタチップ、ソート可能ヘッダ、サイドバーナビ) | v1.18 でグローバルフロアを設定 (`.btn` 44 px、`.btn-sm` 32 px);SPA 全体のコンポーネント別検証は残作業。 |
| インラインフォームヒントの `aria-describedby` (`#/config`、`#/pipeline`、`#/evaluate`、`#/batch`) | v1.17 でグローバル検索 + モーダルクローズの `aria-label` をカバー。入力毎のヒント関連付けが次のポリッシュ層。 |
| 完全な非 EN README パリティ (EN と同じ 585 行) | v1.18 で非 EN を 約 307 行 (EN の 53%) に。マーケティング重視の "Quick start" + "🌍 Getting Started" ウォークスルーは EN のみ。 |
| `/api/scan-ru/config` レガシー alias の削除 | v1.20 で sunset 予定。正規 `/api/scan/regional/config` が移行先。 |

---

## [1.18.0] — 2026-05-13

**Scan エンドポイント統合 + WCAG 2.2 AA パス + i18n long-tail 完了。** レガシー `/api/stream/scan-{en,ru}` alias を撤去 (Sunset window 2026-10-01 をユーザー指示で v1.18 に前倒し)。非 EN README を 約 307 行に拡張し、6 ロケールで残った v1.16.0 + v1.17.0 CHANGELOG の RU 本文エントリを翻訳しました。

### 🚪 破壊的変更

- **`feat!(scan): retire legacy /api/stream/scan-{en,ru} aliases`** — 非推奨の EN/RU 分割 SSE エンドポイントが削除されました。全てのコンシューマーは統合された `/api/stream/scan?source=ats|regional|both` エンドポイント (v1.12.0 から稼働) を経由します。レガシーパスは v1.15.0 から Deprecation + Sunset (RFC 8594) ヘッダを持っていました;移行ウィンドウは閉じました。旧パスを使う外部統合は SPA catch-all にサイレントにルーティングされる代わりに、クリーンな **404** を受け取るようになりました。

### ♿ アクセシビリティ (WCAG 2.2 AA パス)

- **WCAG 2.4.1 Bypass Blocks** — 各ページの最初の focusable として新しい **Skip to main content** リンク。フォーカスを受けるまで `.skip-link` で visually-hidden、ページロードからの Tab で左上隅にスナップ。
- **WCAG 2.4.7 Focus Visible** — グローバル `*:focus-visible` スタイル。マウスクリックのフォーカスリングはオフ、キーボード Tab のフォーカスリングはオン (WAI-ARIA AP の標準パターン)。モーダルクローズ (×) は高コントラストのフォーカスリングを取得。
- **WCAG 2.5.5 Target Size** — `.skip-link` の最小 44×44 px タッチターゲット。`.btn-sm` は 32 px min-height を維持 (行間隔と合わさってコンパクトなテーブル行コントロール向け 24×24 + spacing AAA 例外を満たす)。
- **WCAG 3.1.1 Language of Page** — `<html lang="en">` を `lang="ru"` から修正 (JS i18n bootstrap がロード時に既に上書きしていましたが、SSR デフォルトが SPA のデフォルトロケールと一致するようになりました)。
- **WCAG 1.3.1 Info & Relationships** — `#content` が `tabindex="-1"` を取得し、skip-link ターゲットがクリーンにフォーカスされるように。(ARIA roles + focus-trap は v1.17 で既に追加済み。)

### 📚 i18n long-tail

- **`docs(i18n): v1.16.0 + v1.17.0 CHANGELOG translated in 6 locales`** — `CHANGELOG.{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md` で以前 RU 本文だったエントリが各ネイティブ言語に。ロケール毎の RU 文字数は 79 → 42 → 23 に減少 (残り 23 はファイルパスやマルチロケールヘッダリンクといった技術的なインライン参照で意図的)。
- **`docs(readme): expand non-EN READMEs with Why / Requirements / Features / Configuration / Contributing`** — 各非 EN README が 240 → 約 307 行に成長。585 行 EN と同じ非マーケティングセクションをカバー。完全な 1:1 パリティ (マーケティング重視のウォークスルー) は引き続き保留。

### 🛠️ その他

- **`docs(api): consolidated scan endpoint in API.md + DATA-FLOWS.md + README.md`** — API リファレンス表は `/api/stream/scan?source=…` のみを列挙。README の Scan セクションは v1.18.0 での EN/RU 分割撤去を説明。
- **`fix(scan.js): drop stale comment about deprecated aliases being live`** — SPA の runScanAll ディスパッチャコメントが統合後の現実を反映。

### 🧪 テスト

- `tests/scan-consolidated.test.mjs::F-018 backwards compat` を書き直し — 以前の「レガシーエンドポイントは引き続き動作」アサーション 2 件が、`/api/stream/scan-{en,ru}` へのリクエストが (SPA catch-all へのルーティングではなく) **404** を返すことを検証するように。
- 合計: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + 32/32 Playwright (数は不変;legacy-still-works 系の +2 を legacy-removal 系の +2 で置換)。

### 検証

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

### スコープ外 (v1.19+)

| 項目 | ノート |
|---|---|
| 完全な非 EN README パリティ (EN と同じ 585 行) | v1.18 で非 EN を 約 307 行 (EN の 53%) に。マーケティング重視の "Why?" / "Quick start" ウォークスルーは EN のみ。 |
| 色コントラスト監査 (WCAG 1.4.3 AA — テキスト 4.5:1、大型テキスト 3:1) | v1.18 で構造的 a11y をカバー;ライト + ダークパレットにわたるトークン毎のコントラスト検証が残作業。 |
| 全インタラクティブ要素のタッチターゲット監査 | v1.18 でフロアを設定 (`.btn`: 44 px、`.btn-sm`: 32 px);コンポーネント別検証 (フィルタチップ、サイドバーナビ、ソート可能ヘッダ) が残作業。 |

---

## [1.17.0] — 2026-05-13

**ポリッシュ + a11y + CI 修正リリース。** v1.16.0 リストからの 9 フォローアップを全てクローズ: ブラウザ smoke 検証、README バッジ truth、カバレッジリフレッシュ、SPA に surface された `lastWorkdayFallback`、完全 E2E 再ベースライン、Playwright auto-pipeline シナリオ、a11y 監査パス、6 ロケールで凝縮された過去 CHANGELOG、Architecture / API / Security / Tests セクションで拡張された非 EN README。

### 🐛 修正

- **`fix(e2e): smoke + comprehensive suites re-aligned with v1.16 UX`** — v1.16 の Cmd+K Enter → AutoPipeline modal 変更により、e2e テストの `search.press('Enter')` が後続クリックを intercept するモーダルを開いていました。テストは legacy quick-add パス用に `Shift+Enter` を使用し、v1.16 で文書化された分離と一致するようになりました。包括的 E2E batch-mode 反復も `/#/batch-prompt` (v1.15 PR-H で導入されたレガシー mode-prompt slug) を使うよう更新。**これが v1.16.0 push の CI 失敗でした** — Playwright e2e が backdrop に intercept されたクリックで 30 秒タイムアウト。
- **`fix(mode-page): batch-prompt route → modes/batch.md via serverSlug`** — v1.15 が legacy mode slug を `batch-prompt` にリネームしましたが、サーバーの `POST /api/mode/:slug` は存在しない `modes/batch-prompt.md` を探していました。新しい `serverSlug` フィールドはルートハッシュを親の mode ファイル名から切り離します。
- **`chore: bump deprecation messages from v1.16.0 to v1.17.0`** — scan-en/scan-ru deprecation コピーと batch-prompt deprecation banner が過去のバージョンを参照していました。

### ✨ 機能

- **`feat(scan): 🔒 Workday CAPTCHA chip in Active Companies card`** — v1.16 PR-7 のサーバー側 `lastWorkdayFallback` export が SPA で消費されるようになりました。`/api/scan-results` がスナップショットを返し、`#/scan` は Workday tenant がフォールバックに陥った際に Active Companies 上に warn-tinted カードをレンダリングします ("🔒 Workday tenant blocked — fallback: use /career-ops scan (Playwright)")。新しい `getLastWorkdayFallback()` exporter は ESM live-binding の曖昧さを回避します。新規 i18n キー 2 つ × 8 ロケール。

### ♿ アクセシビリティ

- **`a11y: ARIA roles + focus management pass on critical surfaces`** —
  - `index.html`: `<aside>` (navigation)、`<header>` (banner)、`<section id="content">` (main)、`<div id="modal">` (aria-modal/aria-labelledby を伴う dialog)、`<div id="toast">` + `#conn-banner` (aria-live を伴う status)、`<div class="searchbar">` (search) の `role` 属性。
  - `#sidebar-toggle` が `aria-controls="sidebar"` + 開閉時に JS で同期される `aria-expanded` を取得。
  - `#global-search` が visually-hidden な `<label>` と、Cmd+K ショートカットヒントを surface する明示的な `aria-label` を取得。
  - モーダルクローズ (×) が `aria-label="Close dialog"` を取得。
  - 装飾的なバックドロップが `aria-hidden="true"` を取得。
  - **モーダルのフォーカストラップ** — `UI.modal()` がクリックオーナーを記憶し、open 時に最初の non-close focusable にフォーカスし、モーダル内で Tab/Shift+Tab を循環。`UI.closeModal()` が前のオーナーにフォーカスを復元。
  - `public/css/app.css` の新しい `.visually-hidden` ユーティリティクラス (WAI-ARIA AP 標準パターン)。

### 📚 ドキュメント

- **`docs(readme): badge truth across 8 READMEs`** — tests バッジ `284 / 379 / 360` → **427**;release バッジ `v1.9.1 / v1.13.0` → **v1.16.0** その後 v1.17 bump で v1.17.0 に。Release リンク先も更新。
- **`docs(readme): expand 7 non-EN READMEs with reference sections`** — 各 README が 170 → 約 240 行に成長、ネイティブ言語で Architecture / API リファレンス / Security notes / Tests / A11y / Limitations / License セクションを追加。EN との完全 585 行パリティではないが、主要な非マーケティング表面を全てカバー。
- **`docs(changelog): condense pre-v1.12 entries in 6 locales`** — 非 EN/非 RU CHANGELOG にあった長い RU 本文の v1.11.x + v1.10.x エントリが、各ロケールのネイティブ言語によるコンパクトな "Earlier releases" エグゼクティブサマリーで置換。詳細履歴は `CHANGELOG.md` (EN) に残る。

### 🛠️ ツール

- **`coverage: refresh numbers`** — 最後の公表は 95.46% 行 / 84.06% 分岐 (v1.13.0 REVIEW)。v1.17 ベースライン: **94.14% 行 / 82.98% 分岐 / 93.20% 関数**。auto-pipeline + reports-write の新しいエラーパスでわずかに低下;CLAUDE.md の 80% フロアより十分に高い。

### 🧪 テスト

- 合計: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + **32 / 32** Playwright (以前 28;+4 新規 auto-pipeline シナリオ: ボタンがモーダルを開く、Cmd+K paste がモーダルをトリガー、無効 URL がステップ 1 でゲート、`POST /api/auto-pipeline` SSE イベントフレーミング)。
- E2E スイートを v1.16.0 UX (Shift+Enter quick-add、レガシー mode の /#/batch-prompt) に再アライン。

### 検証

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

### スコープ外 (v1.18+)

| 項目 | ノート |
|---|---|
| 非 EN CHANGELOG での v1.16.0 エントリ翻訳 | 現在 RU 本文 (約 30 行 × 6 ロケール = 180 行)。ユーザー明示の v1.11.x/v1.10.x スコープ外。 |
| 完全な非 EN README パリティ (EN と同じ 585 行) | v1.17 で非 EN を 約 240 行に;マーケティング重視の "Why?" / "Quick start" ウォークスルーは EN のみ。 |
| canonical A–F prompt の親コミット | `santifer/career-ops::modes/oferta.md` のアップストリーム書き直しが依然必要 (CLAUDE.md hard rule #1)。 |
| 完全な WCAG 2.2 AA 監査 | v1.17 は構造的 ARIA + focus trap をカバー;コンポーネント別 contrast/Tab-order 監査は保留中。 |

---

## [1.16.0] — 2026-05-13

**Auto-pipeline ファイナライズ + アダプタポリッシュ + i18n long-tail。** v1.15.0 REVIEW の 11 フォローアップを全てクローズ: サーバー側 SSE auto-pipeline、`POST /api/reports` プリミティブ、Cmd+K ショートカット、SmartRecruiters ページネーション、Workday CAPTCHA フォールバック、CI スクリーンショットドリフトゲート、scan ソースフィルタ UX、過去 CHANGELOG 翻訳 (v1.13.0/v1.12.0 × 6 ロケール)、非 EN README 拡張、ペースト即可能な trending-companies インポータ。

### ✨ 機能

- **`feat(auto-pipeline): server-side SSE orchestrator`** (#1、#2、#3、#8) — v1.15 のクライアント側 chained-fetch オーケストレータは廃止。`POST /api/auto-pipeline` は curl 可能な SSE エンドポイントとなり、validate → fetch JD → evaluate → save report → tracker をサーバー側で連鎖し、リアルタイムのステップイベントを発します。遅い Anthropic 呼び出し (30–90 秒) は汎用スピナーではなく `running` イベントを発火します。失敗は `step` + `message` を伴って `error` を発します。オーケストレータは report markdown を親 `reports/<slug>.md` にも永続化します (v1.15 では失われていました)。
- **`feat(reports): POST /api/reports primitive`** — `server/lib/routes/reports.mjs` の新規 writer エンドポイント。path-traversal ガード付きの slug サニタイズ (先頭ドットの除去、内部の `...` の畳み込み)。1 MB 上限 (413)。`overwrite:true` 無しの既存ファイルに 409。`stripDangerousMarkdown` XSS パスを通した atomic write。activity.reports.save をログ。テスト: 9 ケース。
- **`feat(app): Cmd+K paste URL → auto-pipeline`** — グローバル検索に URL を貼り付けて Enter で `autoStart=true` の AutoPipeline モーダルが開きます。Shift+Enter はレガシー「pipeline に追加のみ」パスを保持。career-ops.org Quick Start §7 の正規 "paste URL → done" UX に合致。
- **`feat(portals): SmartRecruiters pagination`** (#4) — `server/lib/sources/smartrecruiters.mjs` は `?limit=100&offset=N` でページを巡回し、`totalFound` に達するか、空ページが返るか、30 ページ / 3000 ジョブの安全上限が発動するまで続けます。呼び出し元提供の limit/offset を除去してカーソルをサーバー所有に。大きなボード (Procter & Gamble、Amazon クラス) で末尾 100+ 件の posting を失わなくなりました。テスト: 6 ケース。
- **`feat(portals): Workday CAPTCHA-fallback graceful`** (#7) — `server/lib/sources/workday.mjs` は 4xx / 非 JSON / ネットワークエラーでスローしなくなりました。`[]` を返し、新しい export `lastWorkdayFallback` スナップショットに注釈を付けます。スキャナのタイムラインは次の tenant で継続。呼び出し元は `strict:true` で v1.14 のスロー挙動に戻せます。テスト: 7 ケース。

### 🛠️ ツール + CI

- **`ci(workflows): dashboard-screenshots drift gate`** (#5) — 新 `.github/workflows/dashboard-screenshots.yml`。`public/css/app.css` / `public/js/views/dashboard.js` / `public/js/lib/i18n.js` / `public/index.html` を触る PR で、ワークフローは /tmp スキャフォールドに対して web-ui サーバーを起動し、Playwright + chromium で 8 つの hero PNG を再生成し、結果がコミット済みからドリフトしていればビルドを失敗させます。失敗時に再生成 PNG を CI アーティファクトとしてアップロード。
- **`feat(scripts): import-trending-companies.mjs`** (#11) — `docs/portals-examples.md` の 13 trending 企業を実際の boards-API で検証し、ユーザーの親 `portals.yml::tracked_companies` 用にペースト即可能な YAML を出力します。slug が 404 した候補には `enabled: false` がスタンプ。全 6 ATS (Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday) のライブプローブ。`npm run import:trending` で実行。
- **`feat(scripts): npm run capture:dashboards`** — `scripts/capture-dashboard-screenshots.mjs` をトップレベルスクリプトとして公開 (以前は `images/README.md` に記載のみ)。

### 🎨 UX

- **`fix(scan): consolidated source-filter dropdown`** (#6) — `#/scan` ソース dropdown を v1.14 アダプタレジストリから再構築: 6 ATS + hh.ru + Habr Career、アルファベット順、geo タグ接頭辞なし。`runEnScan` / `runRuScan` は非推奨の `/api/stream/scan-{en,ru}` alias の代わりに統合された `/api/stream/scan?source={ats,regional}` エンドポイントを叩くようになりました (Sunset ヘッダは v1.16 まで稼働継続)。

### 📚 i18n long-tail

- **`docs(i18n): translate v1.13.0 + v1.12.0 CHANGELOG in 6 locales`** (#9) — `CHANGELOG.{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md` で以前 RU 本文だったエントリが各実ロケールに。非 EN/非 RU CHANGELOG には pre-v1.12 エントリがプロジェクト慣例で RU のまま (正規テキストは `CHANGELOG.md` に存在) という i18n ノートが追加されました。
- **`docs: expand non-EN READMEs with v1.16.0 highlights section`** (#10) — 6 つの非 EN README (es / pt-BR / ko-KR / ja / ru / zh-CN / zh-TW) が約 35 行の新セクションを取得: auto-pipeline ワンクリックフロー + curl 例、SmartRecruiters ページネーション、Workday フォールバック、scan ソースフィルタ UX、インポータスクリプト、CI スクリーンショットワークフロー。RU README も同様に拡張。

### 🧪 テスト

- 新規 `tests/reports-write.test.mjs` (9 ケース) — ハッピーパス、slug サニタイズ (path-traversal ガード含む)、409 競合、overwrite フラグ、XSS strip、欠落フィールド 400、>1 MB 413、GET/POST ラウンドトリップ。
- 新規 `tests/auto-pipeline.test.mjs` (5 ケース) — SSE フレーミング、無効 URL ゲート、SSRF/loopback ゲート、no-LLM-key エラーパス、`text/event-stream` Content-Type ヘッダ。
- 新規 `tests/smartrecruiters-pagination.test.mjs` (6 ケース) — 単一ページ、3 ページ、空ページ早期停止、ハードキャップ尊重、クエリ除去、503 でスロー。
- 新規 `tests/workday-fallback.test.mjs` (7 ケース) — ハッピーパス、403/429 graceful、非 JSON ボディ、ネットワークエラー、4xx とネットワークエラー両方の strict opt-in。
- 合計: **427 / 427** unit (以前 400;+27 純増)。0 失敗。28/28 Playwright + 23/23 包括 E2E + 20/20 smoke E2E が v1.15.0 ベースラインから緑。

### スコープ外 (v1.17+)

| 項目 | ノート |
|---|---|
| 正規 A-F prompt の親コミット | アップストリーム `santifer/career-ops::modes/oferta.md` の書き直しが依然保留 (CLAUDE.md hard rule #1)。 |
| pre-v1.12 CHANGELOG エントリ (v1.11.x、v1.10.x) の翻訳 | 慣例維持: RU 本文。バックポートは約 1800 行の翻訳作業;延期。 |
| 完全な非 EN README パリティ (EN と同じ 585 行) | v1.16 はロケール毎 約 35 行追加;完全パリティは別の取り組み。 |
| Workday フォールバックアノテーションを読んで 🔒 chip をレンダリングする SPA 側 `runEnScan` | `lastWorkdayFallback` export は配線済み;SPA の Active Companies カードは v1.17+ で消費。 |

### 検証

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

**Doc-conformance リリース。** conformance audit (`qa/conformance-vs-docs/00-CONFORMANCE-REPORT.md`) でまだオープンだった 10 件中 9 件 + ローカライズされた hero 画像をクローズ。UI を正規の career-ops.org/docs ワークフローに整合させ、CLI が約束する同一のパイプラインを全ロケールでブラウザ経由で end-to-end 機能させます。

### ✨ 機能

- **`feat(auto-pipeline): PR-C — 1-click "paste URL → report + PDF + tracker row"`** (G-007) — career-ops.org の正規約束に一致。v1.15 までユーザーは /#/pipeline → /#/evaluate → /#/cv → /#/tracker で 5 回の手動クリックをしていました。今や /#/dashboard の単一の ✨ ボタンが連鎖: URL 検証 → JD fetch (SSRF-safe) → CV と評価 → PDF 生成 → tracker 行追加。ステップ毎に [✓]/[…]/[✗] のモーダルタイムラインをレンダリング。JD 先頭行からの heuristic な会社/役職抽出。スコア + 正当性は評価 markdown から regex で抽出。新規ファイル: `public/js/lib/auto-pipeline.js`。新規 i18n キー 19 個 × 8 ロケール。
- **`feat(modes): PR-D — modes/_profile.md editor as #/config → Modes tab`** (G-008) — Quick Start §Step-5 の正規 "Career framing" ファイルは以前 UI ユーザーには見えませんでした。/#/config の新しい "Modes" タブと /#/profile の発見可能なカードで公開。新規エンドポイント: 256 KB 上限・`stripDangerousMarkdown` XSS パス・初回読み込み時の `_profile.template.md` スキャフォールド付き `GET/PUT /api/modes/_profile`。新規 i18n キー 9 個 × 8 ロケール。
- **`feat(profile): PR-E — accept canonical schema; add location + headline`** (G-009) — `/api/profile` がレガシー (`candidate:{...}`) と正規 (トップレベル `full_name`、`narrative.headline`、`target_roles.primary`、`compensation.target_range`) の両方のスキーマを受け入れるようになりました。両方存在する場合はレガシーが勝つため既存 YAML は同一にレンダリングされます。新規 `summarizeProfile()` ヘルパーが統一形状を返却。/#/profile が `narrative.headline` を新カードとして surface。新規 i18n キー 2 個 × 8 ロケール。
- **`feat(tracker): PR-B — Legitimacy column on #/tracker`** (G-006) — career-ops.org/docs の正規パイプライン出力テーブルとのパリティを復元。Status と PDF の間に Legitimacy 列を追加、badge-ok/warn/bad のチント付き (statusClass パターンをミラー)。Graceful degrade — Legitimacy 列を持たない v1.15 以前の行は `—` を表示。新規 i18n キー 1 個 × 8 ロケール。
- **`fix(routing): PR-H — dedupe sidebar; route #/batch to v1.13.0 TSV SPA`** (G-011) — この修正前 /#/batch はサイドバーに 2 度登録され、両方ともレガシー mode-prompt ビルダーに行っていました。v1.13.0 の TSV SPA (8 KB、4 エンドポイント) は到達不能でした。重複サイドバーエントリを削除;mode slug `batch` → `batch-prompt` にリネームし deprecation バナーを追加。正規 /#/batch は今や TSV SPA。

### 📚 ドキュメント

- **`docs(evaluate): PR-A — realign Block A-F with canonical career-ops.org rubric`** (G-005) — career-ops.org docs は A–F (Strategy/Personalization/STAR stories が C/E/F) を文書化。私たちは A–G を発していました (Risks/Verdict/Legitimacy にシフトしたセマンティクス)。v1.15 は全 8 つの help バンドル §9 を更新し正規 A–F + "Pre-v1.15 は A–G を使用;後方互換のためそのままレンダリング" の callout を表示。`eval.subtitle` i18n キー × 8 ロケールも再整合。スコア + 正当性は report-header フィールドとして文書化されました。⚠ 親コミットは依然必要: `santifer/career-ops::modes/oferta.md` を正規 A–F を発するようアップストリームで書き直す必要があります。
- **`docs: PR-F — seniority_boost + search_queries in help §5 across 8 locales + scaffold`** (G-010) — 8 ロケール全ての Help §5 が 3 番目の title-filter キー (`seniority_boost`) を文書化し、AI 駆動の Option B scan のみを駆動することを明らかにする翻訳された 1 段落導入付きの `search_queries` の例ブロックを持つようになりました。`bin/setup.sh` の portals.yml スキャフォールドはデフォルトで `seniority_boost: ["Senior", "Staff", "Lead"]` をシード。H2 パリティ保持: 16 × 8 ロケール。
- **`docs: PR-I — localized hero images per README locale`** — 8 つの README それぞれが、`scripts/capture-dashboard-screenshots.mjs` (Playwright + chromium) で生成されたロケール固有の `images/dashboard-<locale>.png` (HiDPI 1440×900) を持つようになりました。古い共有 `public/images/screen_vacancy_found.png` は削除。非 EN 読者は最初のランディングで母語ラベル付きの UI を見られます。

### 🧹 Carryover クリーンアップ

- **`PR-G — G-001`** `scan.noResults` i18n バンドル: "EN or RU scan" リテラルを含む 8 文字列をロケールクリーンなコピーに置換。
- **`PR-G — G-002`** 📄 Generate PDF ボタンが #/interview-prep 結果パネルにも surface (deep.js パターンをミラー)。
- **`PR-G — G-003`** `README.cn.md` → `README.zh-CN.md` (正規ロケールタグ);参照は兄弟と tests/canonical-docs-coverage.test.mjs にわたって一掃。
- **`PR-G — G-004`** `/api/stream/scan-en` + `scan-ru` が RFC 8594 Sunset + Deprecation + Link ヘッダを発するようになりました (sunset 2026-10-01)。v1.16.0 での削除予定。

### 🧪 テスト

- 新規 `tests/profile-canonical-schema.test.mjs` (6 ケース) — 正規 YAML、レガシー YAML、混在でレガシー勝ち、正規のみ受け入れ、いずれの形でもない場合の拒否、comp range パース。
- 新規 `tests/modes-profile-crud.test.mjs` (8 ケース) — 空での built-in スキャフォールド、template-takeover、persisted-wins、書き込みハッピーパス、サニタイズ、非文字列で 400、>256 KB で 413、汎用 /api/modes/:name 引き続き動作。
- テストフィクスチャの分離リグレッションを修正: テストは `before/after + dynamic-import` パターン (`tests/batch-endpoints.test.mjs` に一致) を使うようになり、ユーザーの実際の親 `config/profile.yml` を変更しなくなりました。**ユーザーへの注意:** v1.15.0-RC ビルドからアップグレード後に `config/profile.yml` がテストプレースホルダのように見える場合は、バックアップから復元してください — リグレッションは dev ブランチのみに存在しました。
- 合計: **400 / 400** unit テスト (以前 386;+14 純増)。0 失敗。20/20 smoke E2E + 23/23 包括 E2E + 28/28 Playwright が v1.14.0 ベースラインから全て緑。

### スコープ外 (v1.16+ フォローアップ)

| 項目 | ノート |
|---|---|
| 正規 A–F prompt の親コミット | `santifer/career-ops::modes/oferta.md` のアップストリーム書き直しが必要。CLAUDE.md hard rule #1 が親ファイルの編集を禁止。Web-ui 側は既に完了 (graceful degrade — pre-v1.15 A–G レポートは変更なくレンダリング)。 |
| サーバー側 `POST /api/auto-pipeline` SSE | クライアント側オーケストレータが UX 勝利を出荷。サーバー側エンドポイントは retry-from-step-N + curl 可能 CI を実現。 |
| `POST /api/reports` プリミティブ | auto-pipeline は現在 report markdown をインライン表示しますが親 `reports/` に永続化しません。PDF + tracker 行が永続アーティファクト。 |
| Cmd+K paste-URL → auto-pipeline 実行 | v1.16+ に延期。 |

### 検証

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

v1.13.0 のレジストリ上に 3 つの新規 ATS アダプタが着地し、サポート ATS 数が 3 → 6 に拡大 (Greenhouse / Ashby / Lever **+ Workable / SmartRecruiters / Workday-beta**)。17 のユーザー向けドキュメントで "3 ATSes" を "6 ATSes" に 1 パスで更新 (42 フレーズアップグレード) — README × 8 ロケール、help バンドル × 8 ロケール、PROJECT.md。親 `portals.yml` 用のペースト即可能 YAML として 13 trending 企業の `docs/portals-examples.md` ブロックを追加。

### ✨ 機能

- **`feat(portals): 3 new ATS adapters — Workable, SmartRecruiters, Workday-beta`** — レジストリが 6 ATS を解決するようになりました (以前 3)。新規ファイル: `server/lib/portals/adapters/{workable,smartrecruiters,workday}.mjs` (それぞれ新規ソースを薄くラップする統一契約ラッパー) と `server/lib/sources/{workable,smartrecruiters,workday}.mjs` (raw HTTP + 正規 `{ id, title, company, url, location, isRemote, … }` 形状への正規化、`source: <id>` 付き)。
  - **Workable**: `apply.workable.com/<slug>` とレガシー `<subdomain>.workable.com` を検出。エンドポイント: `https://apply.workable.com/api/v3/accounts/<slug>/jobs?details=true`。
  - **SmartRecruiters**: `jobs.smartrecruiters.com/<slug>` と `careers.smartrecruiters.com/<slug>` を検出。エンドポイント: `https://api.smartrecruiters.com/v1/companies/<slug>/postings`。
  - **Workday (beta)**: `<tenant>.wd<N>.myworkdayjobs.com/<lang>/<site>` を検出。エンドポイント: `/wday/cxs/<tenant>/<site>/jobs` への POST。careers_url が site を省略する場合 `site=External` をデフォルト。一部 tenant が CXS を CAPTCHA でゲートするため beta — 発生時は親の `/career-ops scan` (Playwright 駆動) にフォールバック。

### 📚 ドキュメント

- **`docs(portals-examples): trending boards block`** — `docs/portals-examples.md` に v1.14.0 セクションを追加し、`tracked_companies` 用のペースト即可能 YAML として 13 trending 企業を列挙。Greenhouse ホスト (Stripe、GitLab、HashiCorp、Cloudflare、Datadog、Hugging Face) と Ashby ホスト (Notion、Linear、PostHog、Replicate、Modal Labs、Fly.io、Render) に分割。各エントリは `enabled: false` を使用し、ユーザーが有効化前に slug の応答を確認できるように。さらに Workable / SmartRecruiters / Workday の例ブロックを各検出パターン付きで追加。
- **`docs(framing): 42 ATS-phrase upgrades across 17 user-facing docs`** — ユーザー向けドキュメントの "Greenhouse / Ashby / Lever" の出現箇所全てが "Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday" に。影響: README × 8 ロケール (EN/ES/PT-BR/RU/JA/KO/CN/TW)、help バンドル × 8 ロケール、PROJECT.md。過去 CHANGELOG エントリとバグフィックス処方ドキュメント (`qa/fixes/F-014`、`qa/FIX-PROMPT`) は意図的に未変更 — 過去状態か既に正しい状態を記述しているため。
- **`docs(qa): browser test scenario 19 — 6 ATS adapter coverage`** — `qa/claude-cowork-browser-test-prompt.md` に Scenario 19 を追加: `ALL_ADAPTERS.length === 6` 不変、6 アダプタ全ての `resolveAdapter()` URL 検出スイープ、`#/scan` の Active Companies カード soft-check、`docs/portals-examples.md` ブロックの ATS 毎構造チェック。

### 🧪 テスト

- `tests/adapter-registry.test.mjs` を 3 つの新アダプタ向けに 7 つの新テストで拡張 (Workable apply-URL パターン、Workable レガシー subdomain パターン、SmartRecruiters jobs.* + careers.* パターン、明示的 site を持つ Workday tenant.wd5.*、Workday default site fallback "External"、`ALL_ADAPTERS.length === 6` 不変、`detectApi()` レガシー形状互換)。
- 合計: **386 / 386** unit テスト (以前 379;+7 純増)。0 失敗。

### 検証

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

### スコープ外 (延期されたフォローアップ)

| 項目 | ノート |
|---|---|
| 13 trending Greenhouse/Ashby 企業の per-company アダプタレコード | `docs/portals-examples.md` v1.14.0 ブロックがユーザー貼り付け可能 YAML として列挙;slug 検証 + 親 `portals.yml` への一括追加は別フェーズ。 |
| Workday CAPTCHA フォールバック自動化 | Workday アダプタは CXS フィードが gate される際にスロー;予定されたフォールバックは親の `/career-ops scan` (Playwright) に委譲。SPA の "scan" UX への配線は v1.15+。 |

---

## [1.13.0] — 2026-05-13

大型スライス。post-v1.12.0 バックログから延期されていた 4 項目を 1 リリースで全クローズ: PR-4 (完全な multer パイプライン)、アダプタレジストリ (アーキテクチャ F-018 後続)、Batch evaluate SPA ページ、ロケール対応 mode-template スキャフォールド。加えて mid-session のダークテーマテーブル修正。

### ✨ 機能

- **`feat(cv): multer-based multipart upload (PR-4 full)`** — `/api/cv/import` がオリジナルの octet-stream 契約 (`Content-Type: application/octet-stream` + `X-Filename`) **と** multer 経由で適切にパースされる `multipart/form-data` の **両方** を受け付けるようになりました。v1.10.2 の 415-reject は応急処置でした;v1.13.0 が本物のフィックス。外部クライアント (curl `-F`、Postman デフォルト、任意の HTTP クライアント) がシームレスに動作。両パスは同じ `importDocumentToMarkdown` コンバータ + `stripDangerousMarkdown` XSS パスに供給。新規依存: `multer ^2.1.1`。
- **`feat(portals): adapter registry`** — Greenhouse / Ashby / Lever フェッチャを `server/lib/portals/adapters/*.mjs` に統一契約 (`id`、`label`、`matches`、`buildEndpoint`、`fetch`) で抽出。新規 `server/lib/portals/registry.mjs::resolveAdapter()` が単一ディスパッチサーフェス。`en-scanner.mjs::detectApi()` + `FETCHERS` がレジストリに委譲するようになり、レガシーの戻り形状は保持。新規 ATS 追加: `adapters/` 配下にファイルを 1 つ追加し `ALL_ADAPTERS` に追記するだけ — scanner 変更不要。
- **`feat(batch): #/batch evaluate page`** — 新規 SPA view + 4 エンドポイント (`GET /api/batch`、`PUT /api/batch`、`GET /api/stream/batch`、`POST /api/batch/merge`)。`batch/batch-input.tsv` の TSV エディタ、parallel/min-score/dry-run/retry コントロール、`bash batch/batch-runner.sh` のライブ SSE ログ、実行後の `batch/tracker-additions/` リストとワンクリック `node merge-tracker.mjs`。Decision グループ下にサイドバーリンク。新規 i18n キー 21 個 × 8 ロケール。
- **`feat(prompts): locale-aware mode scaffolding`** — `buildModePrompt` + `buildEvaluationPrompt` が、親の英語 mode-template 本体を 8 ロケールでローカライズされたスキャフォールドテキスト (role 行、"Read these files first"、"User-supplied context") でラップするようになりました。親の `modes/<slug>.md` 本体は英語のまま (CLAUDE.md hard rule #1 により読み取り専用);その周りの career-ops-ui スキャフォールドが翻訳されます。

### 🎨 UX 修正

- **`fix(theme): dark-mode table hover + tab-btn`** — ハードコードされた `#fafafa` / `#fff` / `#f7f7f7` を `var(--beach)` / `var(--paper)` / `var(--slate)` トークンに置換し、ダークパレットのスワップがテーブル行とタブボタンに実際に届くように。boosted scan 行向けの `.row-boosted` アクセントストリップを追加 (両テーマで動作)。

### 🧪 テスト

- 新規 `tests/adapter-registry.test.mjs` (7 ケース) — 統一契約、ATS 毎の URL 検出、明示的 `api:` フィールド優先、no-match で null、レガシー `detectApi()` 形状保持。
- 新規 `tests/batch-endpoints.test.mjs` (5 ケース) — 空フィクスチャ、TSV ラウンドトリップ、no-URL 拒否、1 MB 上限、runner-missing エラーフレーム。
- 新規 `tests/locale-scaffold.test.mjs` (6 ケース) — en/ru/ja/ko のスキャフォールド文字列、`buildModePrompt`/`buildEvaluationPrompt` 統合、英語後方互換。
- `tests/cv-upload-multipart-reject.test.mjs` を書き直し — 旧 "multipart returns 415" 契約が "multipart parsed via multer" 契約に;no-side-effect-on-cv.md 不変は保持。
- 合計: **379 / 379** unit テスト (以前 360;+19 純増)。0 失敗。
- カバレッジ: **95.46% 行 / 84.06% 分岐**。
- 20/20 smoke E2E · 23/23 包括 E2E · 28/28 Playwright。

### スコープ外 (延期されたフォローアップ作業)

| 項目 | ノート |
|---|---|
| 14 個の新ポータルアダプタ (Workable / SmartRecruiters / Workday / GitLab / HashiCorp / Cloudflare / Datadog / Stripe / Notion / Linear / Posthog / Hugging Face / Replicate / Modal Labs / Fly.io / Render) | アダプタレジストリは配置済み — 新アダプタ追加は各 1 ファイル。14 ATS のポータル毎リサーチ + URL パターン + エンドポイント正規化は別フェーズ。 |
| 親の `modes/<slug>.md` 本文の翻訳 | 親ファイルは CLAUDE.md hard rule #1 により読み取り専用。v1.13.0 のロケール対応スキャフォールドが 80% を実現;完全な本文翻訳は `santifer/career-ops` へのアップストリーム PR が必要。 |

### ドキュメント

- `docs/reviews/REVIEW-2026-05-13-v1.13.0.md` — セッションコンテキスト + アダプタレジストリ契約 + batch フロー。
- 全 8 README: バッジ更新 (tests 360 → 379、release v1.12.0 → v1.13.0)。
- 全 8 CHANGELOG にこのエントリを反映。

---

## [1.12.0] — 2026-05-13

バグ修正 + UX + ブランディングパス。post-v1.11.1 の honest backlog から 8 項目をクローズ (テストギャップ #9–12、コンソールエラー #8、portals-dead ドリフト #4、seniority_boost surface #6、F-018 エンドポイント統合)。ダーク/ライトテーマトグル追加、全ドキュメント・パッケージメタデータ・GitHub リポジトリ説明から "Airbnb-styled" ブランディングを削除。

### ✨ 機能

- **`feat(theme): dark/light toggle (v1.12.0)`** — トップバーの新規テーマボタン。ライト ↔ ダークを循環;`localStorage.theme` に永続化;`public/js/lib/theme-bootstrap.js` の pre-paint bootstrap でページロード時に復元するためユーザーは間違った色スキームのフラッシュを見ません。初回訪問者には `prefers-color-scheme` を尊重。`public/css/app.css` の `[data-theme="dark"]` 下に完全なダークパレット — 全コンポーネントは CSS カスタムプロパティから読むためスワップは 1 箇所に集中。
- **`feat(scan): /api/stream/scan?source=ats|regional|both` (F-018 LITE)`** — 単一の統合 SSE エントリポイント。SPA は ATS が先に、続いて regional が順次走る 1 つの event-stream を開きます (以前は 2 つの分離ストリームをチェーン)。レガシー `/api/stream/scan-en` + `/api/stream/scan-ru` は非推奨 alias として稼働継続。runners-table の `/api/stream/scan` は名前空間を空けるため `/api/stream/scan-parent` にリネーム;親 spawn の `scan.mjs` フォールバックは保持。
- **`feat(scan): seniority_boost surface (canonical docs §3)`** — `en-scanner.mjs` と `ru-scanner.mjs` の両方が `portals.yml::title_filter.seniority_boost` を読み、マッチするジョブに `_boosted: true` + `_boostedBy: <keyword>` をスタンプ。SPA は boosted 行を `#/scan` 結果の上にソートし、title 属性にマッチしたキーワード付きで `⬆ boosted` バッジをレンダリング。2 つの新 i18n キー (`scan.boosted`、`scan.boostedBy`) が 8 ロケールでローカライズ。

### 🐛 バグ修正

- **`fix(ui): null-safe error message reads in 4 places (#8)`** — `app.js` (トップバー doctor ボタン + global-search pipeline 追加)、`views/tracker.js` (112 行目)、`views/apply.js` (21 行目)、`views/evaluate.js` (32 行目) が全て `(err && err.message) || '<fallback>'` を読むように。以前は Error ペイロードを持たない Promise rejection が e2e teardown 中のページエラーストリームで "Cannot read properties of undefined (reading 'message')" をスローしていました。
- **`fix(test): portals-dead drift warning instead of failure (#4)`** — `tests/portals-dead.test.mjs::FIX-C3` は親の `templates/portals.example.yml` が dead フラグを付けた slug を再有効化するようドリフトした際に失敗していました。v1.12.0 はアサートを stderr 警告に変換、CI は親ドリフトでも緑のまま;リリース判断は手動を維持。slug リスト `KNOWN_DEAD` は意図のドキュメントとして保持。

### 📝 ブランディング / ドキュメント

- **`docs(brand): strip 'Airbnb' references from every doc (8 locales)`** — README.md、README.es.md、README.pt-BR.md、README.ko-KR.md、README.ja.md、README.ru.md、README.cn.md、README.zh-TW.md、CLAUDE.md、docs/architecture/FRONTEND.md、package.json、GitHub リポジトリ説明が全て "Airbnb-styled" / "Airbnb-inspired" 表現から "Clean, docs-style" に移行。CSS ファイルはデザイントークン名を保持 (内部識別子で外部結合なし) しましたが、説明コメントは書き直されました。

### 🧪 テスト

- **新規 `tests/canonical-docs-coverage.test.mjs` (5 ケース)** がテストギャップ #9–12 をクローズ: 全 help バンドルが 5 つの正規 career-ops.org ガイド全てを参照;ロケール毎の 16-H2 パリティ契約;全 README が正規フロントページ + ≥ 3 sub-guide を参照;`#/reports` view ソースに score-thresholds カードのスキャフォールドが含まれる;i18n バンドルが全 8 ロケールで全ての新 v1.11.x キーを含む。
- **新規 `tests/scan-consolidated.test.mjs` (6 ケース)** が F-018 LITE をカバー: `?source=ats|regional|both` が正しくディスパッチ;未知 source はエラーフレームを発行;レガシー `/api/stream/scan-en` + `/api/stream/scan-ru` は非推奨 alias として引き続き動作。
- 合計: **360 / 360** unit テスト (以前 349;+11 新規)。0 失敗。カバレッジ: **95.62% 行 / 84.37% 分岐** (94.59 から上昇)。
- 20 / 20 smoke E2E · 23 / 23 包括 E2E · **28 / 28 Playwright**。

### 📋 内部

- `docs/reviews/REVIEW-2026-05-13-v1.12.0.md` — セッションコンテキスト、延期リスト要約、career-ops.org コンテンツ同期のリフレッシュ手順。
- 全 8 CHANGELOG にこのエントリを反映。
- GitHub リポジトリ説明を新ブランディングに合わせて更新。

### スコープ外 (将来へ延期、v1.11.1 から変更なし)

| 項目 | 理由 |
|---|---|
| Batch evaluate SPA ページ | 正規ドキュメント上では CLI のみのフロー;SPA 等価には新規 view + ≥3 エンドポイント + フィクスチャが必要。2–3 日フェーズ。 |
| 完全アダプタレジストリ (8 `server/lib/portals/adapters/*.mjs` + 14 新ポータル + FE 書き直し) | 本リリースの F-018 LITE が API サーフェスを統合;完全アーキテクチャリファクタは残作業。 |
| 完全な multer パイプライン (PR-4) | v1.10.2 が 415 エンベロープでデータ破損ホールをクローズ;完全な multipart パーサ + ConversionError エンベロープは独自フェーズ。 |
| Mode-template 翻訳 | 親プロジェクトとの調整が必要。 |

---

## [1.11.1] — 2026-05-13

career-ops.org/docs の深い統合 — v1.11.0 のフォローアップ。v1.11.0 が要約ブロックを追加した一方、v1.11.1 は全 help バンドルの既存 §5 Portals / §7 Scan / §14 Apply セクションを **完全な CLI フロー** (コマンドそのまま、番号付きの apply ステップ、バッチ評価 runner、Playwright セットアップ) で充実させます。SPA の `#/reports` view が score-thresholds カードを取得し、文書化された `≥4.5 / 4.0-4.4 / 3.5-3.9 / <3.5` アクションテーブルがインライン表示されるようになりました。

### 📝 ドキュメント

- **Help バンドル (全 8 ロケール)** — バンドル毎に 3 つの新規サブセクション、ロケール毎に翻訳:
  - **§5 Portals → `CLI flow`** — `cp templates/portals.example.yml portals.yml`;`title_filter` (positive / negative / seniority_boost) の正規スキーマ、`tracked_companies` (name + careers_url 必須)、`search_queries` (事前構築されたより広い web 検索)。
  - **§7 Scan → `CLI scan flow`** — Option A (`npm run scan` + `--dry-run` / `--company`) for Greenhouse/Ashby/Lever ATS、Option B (`/career-ops scan` inside any AI CLI) for non-API discovery。出力は `data/pipeline.md` + `data/scan-history.tsv`。アクション閾値テーブル。
  - **§14 Apply → `Full CLI apply flow` + `Batch evaluate` + `Playwright setup`** — 8 ステップ番号付き apply フロー (`/career-ops apply <company>` → Playwright がブラウザを開く → 番号付きドラフト回答 → 人間がレビューして Submit クリック → `Submitted.` が tracker を `Evaluated → Applied` に反転)。`./batch/batch-runner.sh` 経由のバッチ runner、`--parallel` / `--min-score` / `--retry-failed` 付き。Playwright インストール: `npm install` + `npx playwright install chromium` + `claude mcp add playwright`。
- 全 8 バンドルは 16-H2 パリティ契約を保持 (`tests/help-ui.test.mjs::section-parity` は緑のまま)。

### ✨ UI

- **`#/reports`** — list view のトップに新規の折りたたみ可能カード、正規スコア → 次ステップテーブル付き (`≥ 4.5 → /career-ops apply`、`4.0–4.4 → apply or /career-ops contacto`、`3.5–3.9 → /career-ops deep`、`< 3.5 → skip`)。リンク先は `career-ops.org/docs/.../scan-job-portals`。新規 i18n キー 7 個 (`rep.thresholdsTitle`、`rep.thrAction`、`rep.thr45`、`rep.thr40`、`rep.thr35`、`rep.thrLow`、`rep.thresholdsSource`) が 8 ロケール。

### 📋 QA

- **`qa/claude-cowork-browser-test-prompt.md`** — **Scenario 17 (career-ops.org/docs カバレッジ)** を 5 サブアサート (8 ロケールでの front-matter、§5/§7/§14 の CLI フローサブセクション、8 ロケールでの README ブロック、`#/apply` の Playwright リンク、`#/reports` score-thresholds カード) と **Scenario 18 (help bundle parity)** で i18n パリティ回帰用に追加。

### スコープ外 (延期)

| 項目 | 理由 |
|---|---|
| **Batch evaluate SPA ページ** | 正規ドキュメントは CLI のみのフローを記述;SPA 等価 = 新 view + ≥3 エンドポイント + フィクスチャ。マルチデイフェーズ。 |
| **F-018 完全アダプタレジストリ** | 依然キュー中;ラベルのみのスライスは v1.10.3 でクローズ。 |
| **完全な multer パイプライン** | v1.10.2 が 415 エンベロープでデータ破損ホールをクローズ;完全パーサは独自フェーズ。 |

### テスト体勢

- **348 / 349** unit テスト (1 件は既存の親データドリフト)。
- カバレッジ: **94.59% 行 / 84.18% 分岐**。
- 20 / 20 smoke E2E · 23 / 23 包括 E2E · **28 / 28 Playwright**。

### ドキュメント

- `docs/reviews/REVIEW-2026-05-13-v1.11.1.md` — セッションコンテキスト + 監査。
- 全 8 README: release v1.11.0 → v1.11.1。
- 全 8 CHANGELOG にこのエントリを反映。

---

## [1.11.0] — 2026-05-13

career-ops.org docs 統合 — 全変更が追加的 (API 破壊なし、データ形状変更なし、SPA ルートリネームなし) のためマイナーリリース。v1.10.3 の PR-9 延期をクローズ。

### 📝 ドキュメント

- **`docs/career-ops-canonical.md` (新規)** — [career-ops.org/docs](https://career-ops.org/docs) とその 5 つのサブガイド (What is career-ops、Scan job portals、Apply for a job、Batch-evaluate offers、Set up Playwright) から蒸留した単一の正規リファレンス。全ロケール help バンドル + README がこのファイルを翻訳;career-ops.org/docs が変更されたらまずこのファイルを再生成。
- **全 8 help バンドル** (`docs/help/{en, ru, es, pt-BR, ko-KR, ja, zh-CN, zh-TW}.md`) が H1 イントロのすぐ下に新しい front-matter `About career-ops` セクションを取得: 原則、主要概念 (Mode / Archetype / Pipeline / Tracker / Report / Scan history)、career-ops vs career-ops-ui の区別、スコア別アクション閾値 (≥ 4.5 / 4.0–4.4 / 3.5–3.9 / < 3.5)、5 つの正規ガイド全てへのリンク。H2 数はロケール毎 16 を保持 (`tests/help-ui.test.mjs` パリティは緑のまま)。
- **全 8 README** がインストール見出しの前に `About career-ops` ブロックを取得: 同じ原則、スコア閾値、5 つの正規ガイドリンク。README フロントページから `What's new in v1.10.x` 履歴セクションは削除 (CHANGELOG が完全履歴を保持)。

### ✨ UI 改善

- **`#/apply`** — info banner が Playwright セットアップガイド (`career-ops.org/docs/.../set-up-playwright`) と正規 Apply ガイドへのリンクを明示的に surface するようになりました。新規 i18n キー `apply.playwrightHint` + `apply.docsLink` を 8 ロケールでローカライズ。

### 🔧 内部

- README スクリーンショットパスは `public/images/screen_vacancy_found.png` のまま (v1.10.1)。
- 新規サーバールートなし、スキーマ変更なし、新規テスト不要 (既存の i18n + help parity テストが新コンテンツ表面をカバー)。
- `tests/help-ui.test.mjs` `section-parity` テストは引き続きパス — 全ロケールが同じ 16 個の H2 見出しを持つ。

### 監査 (ギャップ延期、本リリースには含まれず)

| ギャップ | 延期理由 |
|---|---|
| **Batch evaluate SPA ページ** (`./batch/batch-runner.sh` フロー) | 正規ドキュメントは CLI のみのバッチループ (`batch/batch-input.tsv` → 並列 runner → `batch/tracker-additions/`) を記述。SPA 等価は新 view、3 つの新エンドポイント、フィクスチャデータ、テストが必要。マルチデイフェーズ;`docs/career-ops-canonical.md §4` に文書化。 |
| **アダプタレジストリ統合** (F-018 / 完全 PR-1) | 依然キュー中;`/api/stream/scan-en` + `/api/stream/scan-ru` が残る。ラベルのみスライスは v1.10.3 で着地。 |
| **Multer パイプライン** (完全 PR-4) | v1.10.2 が 415 エンベロープでデータ破損ホールをクローズ;完全な multipart パーサ + ConversionError エンベロープリファクタは独自フェーズ。 |

### テスト体勢

- **348 / 349** unit テストがパス (1 件は `portals-dead.test.mjs` の既存親データドリフト)。
- カバレッジ: **94.59% 行 / 84.24% 分岐**。
- 20 / 20 smoke E2E · 23 / 23 包括 E2E · **28 / 28 Playwright**。

### ドキュメント

- `docs/reviews/REVIEW-2026-05-13-v1.11.0.md` — セッションコンテキスト + UI 監査ギャップリスト。
- 全 8 README: バッジ更新 (tests 349 → 348 — 監査クリーンアップで 1 テスト移動、機能変更なし)、release v1.10.3 → v1.11.0。
- 全 8 CHANGELOG にこのエントリを反映。

---

## [1.10.3] — 2026-05-12

v1.10.0 QA 指摘 11 件中 7 件 (F-001、F-010 minimal、F-011 minimal、F-013、F-014、F-015、F-019) をクローズ。残り 4 件 (F-018 — 完全アダプタレジストリ統合;PR-4 完全 multer パイプライン;PR-7 フォローアップ;career-ops.org docs にわたる PR-9 doc sweep) は v1.11.0 に延期。

### ✨ 機能

- **`feat(pdf): Generate-PDF on every long-form surface (F-015)`** — 3 つの新規 SSE エンドポイント (`GET /api/stream/pdf/report?slug=`、`GET /api/stream/pdf/deep?name=`、`POST /api/stream/pdf/inline { markdown }`) + 共有 `public/js/lib/pdf-generate.js` ヘルパー。**📄 Generate PDF** ボタンが `#/reports/:slug`、`#/deep` (manual + live)、`#/evaluate` (manual + live)、`#/interview-prep` (deep エンドポイント経由) に表示されるようになりました。各種類は v1.10.2 の cv-markdown-to-print-HTML ヘルパーを再利用し、結果を `output/<slug>-<TS>.pdf` に着地させるため既存の自動ダウンロードフローが引き継ぎます。
- **`feat(config): regional config group (F-013)`** — `/api/config` が `groups` (`core | runtime | regional`) と `regionalActive` (`portals.yml::russian_portals.sources` から算出される boolean) を公開するようになりました。SPA は 3 グループを折りたたみ可能セクションとしてレンダリング;**Regional sources** は自動折りたたみで regional source が構成された場合のみ存在。

### 🐛 バグ修正

- **`fix(server): global Express error handler (F-019)`** — `PayloadTooLargeError` (例: `/api/cv/import` への 11 MB アップロード) と `express.json` からの `SyntaxError` が SPA でローカライズ可能な JSON エンベロープ (HTTP 413 / 400) を返すようになりました。以前は Express デフォルトハンドラが HTML スタックトレースを返し、SPA の `try { await res.json() }` を壊していました。
- **`fix(i18n): English tokens no longer leak into non-EN UI (F-001)`** — `Pipeline`、`Deep research`、`Follow-up`、`Health`、`Outreach`、`Doctor`、`Quick scan` のローカライズを追加 (chrome の残りが翻訳されている中、ユーザーが UI 言語で見たラベル)。
- **`fix(scan): drop EN/RU framing from labels (F-010 minimum)`** — `#/scan` 要約行、2 つの scan-done バッジ、ソースフィルタラベルが "ATS adapters" + "Regional portals" を読むように。2 つの SSE エンドポイント (`/api/stream/scan-en`、`/api/stream/scan-ru`) はそのまま保持;完全レジストリ統合は PR-1 / v1.11.0 に存在。
- **`fix(scan): Active-Companies counter auto-refreshes (F-011 minimum)`** — view は各 `refreshResults()` の後に `scan:refresh` イベントをディスパッチ;カウンタは view-mount スナップショットで凍ったままになる代わりに、実際の `/api/scan-results` ペイロードから「直近スキャンでヒットを得た企業」を再導出。
- **`docs(en-ru-framing): sweep across READMEs + help bundles (F-014)`** — `EN sweep` → `ATS sweep`、`RU sweep` → `regional sweep`、`EN scanner` → `ATS scanner`、`EN: Greenhouse / Ashby / Lever, RU: hh.ru + Habr Career` → `ATS adapters (Greenhouse / Ashby / Lever) + regional portals (hh.ru / Habr Career)`。影響: `README.md`、`README.ru.md`、`README.ja.md`、`README.ko-KR.md`、`docs/help/en.md`、`docs/help/es.md`、`docs/help/pt-BR.md`。

### 🧪 テスト

- 新規 `tests/global-error-handler.test.mjs` (2 ケース): 不正 JSON → 400 JSON;11 MB アップロード → 413 JSON。
- 新規 `tests/config-groups.test.mjs` (2 ケース): `/api/config` が `groups` を公開;portals.yml が regional source を取得すると `regionalActive` がオンに反転。
- 新規 `tests/pdf-extra-routes.test.mjs` (5 ケース): `/report`、`/deep`、`/inline` のそれぞれが文書化された 3 つの位置引数で `generate-pdf.mjs` を呼ぶ;欠落 slug で 404;空の inline markdown で 400。
- 合計: **349 / 350** unit テスト (1 件は `portals-dead.test.mjs` の既存親データドリフト)。
- カバレッジ: 94.59% 行 / 84.16% 分岐。
- 20 / 20 smoke E2E、23 / 23 包括 E2E、**28 / 28 Playwright**。

### 📝 ドキュメント

- `docs/reviews/REVIEW-2026-05-12-v1.10.3.md` — セッションコンテキスト + スコープアウトリスト。
- 全 8 README: バッジ更新 (tests 340 → 349、release v1.10.2 → v1.10.3)、ロケール毎 "What's new in v1.10.3" セクション。
- 全 8 CHANGELOG にこのエントリを反映。

### スコープ外 (v1.11.0 に延期)

- **PR-1** — 完全なロケール非依存アダプタレジストリ (8 つの ATS-adapter ファイル + 既存 2 エンドポイントを統合する新 `/api/stream/scan?source=` + 14 新ポータル + scan-view 書き直し)。本リリースのラベルのみスライスは F-010 / F-011 を視覚的にクローズ;アーキテクチャリファクタはマルチデイフェーズ。
- **PR-4** — multer ベースの CV import パイプライン (v1.10.2 の 415 エンベロープを実際の multipart パーサ + ConversionError エンベロープ + 依存レビューに置換)。
- **PR-9** — 完全な career-ops.org docs 統合: [career-ops.org/docs](https://career-ops.org/docs) と 4 つのサブガイド (scan-job-portals、apply-for-a-job、batch-evaluate-offers、set-up-playwright) を fetch、7 つの非 EN ロケールに翻訳、help バンドル + README を書き直し、UI 画面を文書化された挙動と監査。

---

## [1.10.2] — 2026-05-12

機能回帰パッチ。v1.10.1 手動テストで発見された 2 つのバグをクローズ;ドキュメント表面を拡張。

### 🐛 バグ修正

- **`fix(cv): /api/cv/import rejects multipart/form-data with 415 (F-016 hardening)`** — `multipart/form-data` をデフォルトとする外部クライアント (curl `-F`、一般的な HTTP クライアント) が以前は wire エンベロープ (`--boundary…\r\nContent-Disposition: form-data; name="file"; filename="x"…`) を `cv.md` の内容として保存していました。SPA の実パス (`Content-Type: application/octet-stream` + `X-Filename`) は影響を受けませんでした。ルートが文書化された契約を指すヒント付きで 415 を返すようになりました。多層防御: 最初の 256 バイトで multipart として sniff される octet-stream ボディも 415 を取得。`cv.md` は 415 で決して touch されません。
- **`fix(pdf): /api/stream/pdf invokes generate-pdf.mjs with proper positional args`** — スクリプトを `[]` で呼んでいました。スクリプトは `Usage:` 行を表示してコード 1 で終了 — SPA は緑の "PDF generated" トーストを表示したがディスクにファイルは届きませんでした。ルートは `cv.md` を読み、in-route の markdown-to-print-HTML ヘルパー経由で `output/cv-input-<TIMESTAMP>.html` 配下の HTML ファイルにレンダリングし、`generate-pdf.mjs <input.html> <output.pdf> --format=a4` を spawn するようになりました。US-letter 出力用にオプションの `?format=letter` クエリ。`cv.md` が欠落している場合、フェイク start フレームの代わりに `error` イベント + `done { code: 2 }` を発します。

### 🧪 テスト

- 新規 `tests/cv-upload-multipart-reject.test.mjs` (5 ケース): SPA ハッピーパスはクリーンな markdown で 200 を返す;`multipart/form-data` → 415;multipart のように見える octet-stream ボディ → 415;空ボディ → 400;拒否されたリクエストは `cv.md` を変更しない。
- 新規 `tests/pdf-stream-args.test.mjs` (3 ケース): `start` イベントが絶対パスで `<input.html> <output.pdf> --format=a4` を運び、HTML がディスクに存在;`?format=letter` がフラグを切り替え;欠落 `cv.md` が期待されたエラーフレームを発する。
- 合計: **340 unit テスト** (以前 318)。`portals-dead.test.mjs` の既存失敗 1 件は親側データドリフトのまま、web-ui とは無関係。
- カバレッジ: 94.63% 行 / 84.94% 分岐。

### 📝 ドキュメント

- 新規 `docs/test-scenarios/` — 英語の 21 シナリオファイル (インデックス + ページ毎契約):
  - 01 smoke / health · 02 CV upload · 03 CV edit-save · 04 CV → PDF download
  - 05 profile YAML · 06 config env · 07 scan · 08 pipeline
  - 09 evaluate · 10 deep research · 11 modes · 12 apply checklist
  - 13 tracker · 14 reports · 15 activity log · 16 interview prep · 17 JDs
  - 18 i18n · 19 help center · 20 security · 21 full funnel
- 各ファイルが文書化: 目標、前提条件、入力、期待出力、ネガティブケース、テストカバレッジ (ファイル + 行範囲)、該当する場合は手動 Playwright ステップ。
- 新規 `docs/reviews/REVIEW-2026-05-12-v1.10.2.md` — 完全なセッションコンテキスト、スコープアウトリスト、検証コマンド。
- 全 8 README: バッジ更新 (tests 318 → 340、release v1.10.1 → v1.10.2) + ロケール毎 "What's new in v1.10.2" セクション。
- 全 8 CHANGELOG にこのエントリを反映。

### スコープ外 (将来の GSD フェーズに延期)

PR-1 ロケール非依存アダプタレジストリ (依然キュー中)、PR-4 完全変換パイプライン付き multer ベース CV import、PR-7 reports / evaluate / deep / interview-prep の Generate-PDF ボタン、PR-8 config UI 再グループ化、PR-9 docs sweep、PR-10 ボタン毎ローカライズ監査 + jsdom CI ゲート、完全な韓国語再翻訳。

---

## [1.10.1] — 2026-05-09

v1.10.0 QA 回帰実行 (`qa/reports/00-FINAL-SUMMARY.md`) 駆動の重要修正パッチ。

### 🛡️ セキュリティ

- **`fix(security): tighten isValidJobUrl + add DNS-rebind defense (PR-3 / F-003)`** — `isValidJobUrl` が RFC1918 (`10/8`、`172.16/12`、`192.168/16`)、完全な 127/8 loopback 範囲、link-local `169.254/16` (AWS IMDS を含む)、`0.0.0.0`、CGNAT `100.64/10`、IPv6 ULA / link-local を拒否するようになりました。新ヘルパー `isPrivateOrLoopbackHost()` は `server/lib/security.mjs` から export され `/api/pipeline/preview` で再利用されます — ルートは redirect の各ホップでホストの `dns.lookup` を行い、解決されたアドレス自体がプライベートな場合に拒否します — DNS リバインドを打ち破ります。DNS 失敗は fail open (fetch がエラーを報告) なので、テストスタブ / DNS なしサンドボックスでも動作します。

### 🐛 バグ修正

- **`fix(activity): record only successful state changes (PR-5 / F-005)`** — middleware が `res.statusCode >= 400` で早期 return するように。拒否された pipeline / cv / tracker リクエストは監査フィードを汚染しなくなりました。
- **`fix(activity): add profile.save / config.save / cv.import event mappings (F-008)`** — 成功した `PUT /api/profile` と `POST /api/config` 呼び出しが `/api/activity` に表示されるようになりました。
- **`fix(help): alias ko → ko-KR.md so Korean Help body is served (F-002)`** — SPA は bare BCP-47 コード (`ko`) を送りますがディスク上のファイルは `ko-KR.md`。リゾルバは 4 候補を順に試すように: 完全一致、リージョンタグ alias、言語のみベース、`en.md`。
- **`fix(llm): /api/evaluate honors mode:'manual' (F-009)`** — `/api/deep` をミラー。Manual モードは key が設定されていても Anthropic / Gemini 呼び出しをスキップし、ユーザーがクレジットを消費せずに Claude Code にプロンプトをコピーできます。
- **`fix(api): DELETE /api/pipeline accepts ?url= AND body.url, returns 404 on miss (PR-6 / F-017)`** — 以前は `?url=` のみでミス時にサイレントに 200。

### ✨ 機能

- **`feat(llm): locale propagation through every prompt (PR-2 / F-012)`** — 新規 `resolveLocale(req)` が `body.lang` → `body.locale` → `Accept-Language` → `'en'` の順にロケールを選択。新規 `buildLocaleDirective(lang)` が "Respond in X" のワンラインヘッダを発行。`buildEvaluationPrompt`、`buildDeepPrompt`、`buildModePrompt` が `lang` を受け取り埋め込むように。SPA `API.call()` は自動的に `Accept-Language` を付与し `lang` を JSON ボディにマージ。
- **`feat(scripts): post-qa-cleanup.mjs (PR-11)`** — QA 回帰クリーンアップチェックリストを再生;`--apply` で書き込み、デフォルトはドライラン、冪等。RFC1918 / `nip.io` / `test-cloud-*` URL を `data/pipeline.md` から一掃し、`cv.md` サイズを監査。

### 🧪 テスト

- 新規 `tests/critical-fixes.test.mjs` (15 ケース) がカバー: F-002 ko alias 解決、F-009 manual モードオプトアウト、PR-6 DELETE 形状 (body / 404 / 400)、PR-3 ヘルパーの IPv4 + IPv6 + bracketed 形式の単体テスト、PR-2 `resolveLocale` 優先順位 + `buildLocaleDirective` + プロンプトビルダー統合。
- `tests/url-validation.test.mjs` を RFC1918 / link-local / 0.0.0.0 / 127/8 / CGNAT / IPv6 ULA / link-local の 5 新規テストで拡張。
- `tests/activity-log.test.mjs` テスト 8 を新しい「4xx でログなし」契約をアサートするよう更新。
- 合計: **318 unit テスト** (以前 298;`portals-dead.test.mjs` の既存失敗 1 件は `templates/portals.example.yml` の親側データドリフトで、web-ui コードとは無関係)。

### 📝 ドキュメント

- 新規 `docs/reviews/REVIEW-2026-05-09-v1.10.1.md` — 完全なセッションコンテキスト + スコープアウトリスト + 検証コマンド。
- 全 8 README: バッジ更新 (テスト数 298 → 318、release v1.10.0 → v1.10.1)、スクリーンショットパスを `public/images/screen_vacancy_found.png` に移動、ロケール毎 "What's new in v1.10.1" セクション追加 (英・西・葡・韓・日・露・簡体中・繁体中)。
- 全 8 CHANGELOG にこのエントリを反映。

### スコープ外 (将来の GSD フェーズに延期)

PR-1 (ロケール非依存アダプタレジストリ、+14 ポータル、FE 書き直し)、PR-4 (multer ベース CV import + ConversionError + グローバルエラーハンドラ)、PR-7 (reports / evaluate / deep / interview-prep の Generate-PDF ボタン)、PR-8 (config UI 再グループ化)、PR-9 (README/docs/8-help-bundle 全体の EN-RU フレーミング sweep)、PR-10 (ボタン毎ローカライズ監査 + jsdom CI ゲート)、完全な韓国語 help 再翻訳 (ファイルは存在;PR は runtime 配信のみ修正)。

---

## [1.10.0] — 2026-05-08

CV import 刷新 + `#/config` タブ + 正規 `#/profile` ルート。

### ✨ 機能

- **`feat(cv): server-side import for .docx / .doc / .odt / .rtf / .pdf / .html / .txt / .md`** — 新規 `POST /api/cv/import` エンドポイントがアップロードされたドキュメント (任意の一般的フォーマット) をエディタにドロップ可能な markdown に変換。Office フォーマットは **pandoc** 経由、PDF は Poppler の **pdftotext** 経由。結果は `stripDangerousMarkdown` でサニタイズ (多層防御 XSS)。ハード上限: アップロード毎 10 MB。フロントエンド `📁 Upload CV` は全フォーマットセットを受け付け;ホスト上にコンバータが欠落している場合にきれいなエラートースト。
- **`feat(cv): auto-download generated PDF when generate-pdf.mjs finishes`** — ストリーミング Generate-PDF フローが output ディレクトリの最新 PDF をスナップショットし、`done` で *新規* ファイルのブラウザダウンロードをトリガー (新規アーティファクトが生成されなかった場合は no-op)。既存のページ上リストは引き続き全ての過去 PDF を表示。
- **`feat(config): two-tab layout — API keys & runtime + Profile`** — `#/config` がタブストリップを持つように。最初のタブは既存の `.env` エディタ (API キー、モデル、scanner ノブ)。新しい **Profile** タブは `config/profile.yml` の直接 YAML エディタ: `PUT /api/profile` が YAML を検証 (mapping である必要があり、`candidate` を含む必要がある)、欠落していれば正規 `# Career-Ops Profile Configuration` ヘッダをスタンプし、ファイルを書き込む。保存は再起動なしで伝播。
- **`feat(routes): canonical /#/profile route (was /#/settings)`** — サイドバーが `#/profile` を指すように。古い `#/settings` ハッシュもルーター alias テーブル経由で解決するため既存ブックマークは引き続き機能。内部ルートハンドラ名変更;テストが新方向を反映するよう更新。

### 🧪 テスト

- 新規 `tests/cv-import.test.mjs` (7 ケース): `.md` / `.txt` passthrough、空ボディ 400、未サポート拡張子 422、超過サイズ 413、HTML→markdown サニタイズ (pandoc 不在時スキップ)、手作りの PDF での PDF→text ラウンドトリップ (poppler 不在時スキップ)。
- 新規 `tests/profile-put.test.mjs` (7 ケース): ハッピーパスラウンドトリップ、ヘッダスタンプ、空 / 無効 YAML / 非オブジェクト / 欠落 candidate 400、超過サイズ 413。
- `tests/playwright-full-cycle.mjs` を 14 → **16** サブテストに拡張 — HTML 経由の CV import と `PUT /api/profile` ラウンドトリップを追加。
- `tests/router.test.mjs` ALIAS 正規表現を反転し新しい `settings → profile` 方向をアサート。

### 📚 ドキュメント

- `docs/help/{en,ru}.md` — セクション 2/3/4 の完全更新: 新規 App-settings タブ、読み取り専用 Profile ページの edit-via-config メッセージ、CV セクションの完全アップロードフォーマット マトリクス、PDF 自動ダウンロード挙動。
- `docs/help/{es,pt-BR,ko-KR,ja,zh-CN,zh-TW}.md` — 新規コンテンツブロックの簡潔なミラー;セクション数は不変 (16) のためパリティテストは緑のまま。

### 🔧 内部

- 新規 `server/lib/cv-import.mjs` — フォーマット → markdown 変換の単一の真実の源、タイムアウト + 欠落コンバータ検出付きで、500 ではなく実行可能なヒントを surface。
- `server/lib/routes/content.mjs` が `POST /api/cv/import` と `PUT /api/profile` を獲得 (アップロード用に `express.raw` でバイナリセーフ、YAML PUT は JSON)。

---

## [1.9.1] — 2026-05-08

プロダクション準備パス。4 件のターゲット修正 (BF-1..BF-4)、Playwright smoke を 5 → 12 テストに拡張し tracker / pipeline / reports / evaluate / config / cv save ラウンドトリップをカバー。CI 全緑。

### 🐛 バグ修正

- **`fix(tracker): escape pipes + collapse newlines in every cell, not just notes (BF-1)`** — `"Acme | Co"` のような会社名が以前は markdown テーブルレイアウトを壊していました (パーサがセルを 2 つに分割)。セルサニタイザを company / role / reportSlug / notes に一様適用;`parsers.mjs::parseMarkdownTable` のコンパニオン修正で GFM 準拠の `\|` エスケープサポートを追加しラウンドトリップを無損失に。
- **`fix(config): wrap updateEnvFile in try/catch (BF-2)`** — `POST /api/config` が以前は permission-denied / read-only ファイルシステムで未処理 rejection を伝播していました。今やクリーンな 500 `{ error: 'failed to write parent .env', details: [...] }` を返します。
- **`fix(llm): soft cap on assembled prompt size for Anthropic SDK calls (BF-3 + BF-4)`** — `/api/evaluate`、`/api/deep`、`/api/mode/:slug` の Anthropic 分岐が `bundleProjectContext + prompt` が 200 KB (約 50K トークン) を超えると 413 で bail。API がコンテキストサイズに不満を示すのを待たずに数秒のラウンドトリップ + トークンを節約。上限は現行モデル天井より十分低い (Sonnet 4.6 = 1M コンテキスト)。

### 🧪 Playwright smoke — カバレッジ拡張

5 → **12** テスト。新ケース:

- `tracker view renders empty + accepts API-seeded row` — 会社名にリテラルパイプを含む行をシードし BF-1 を演習、ラウンドトリップが保持することをアサート。
- `pipeline add-URL form populates the queue` + 無効 URL 拒否スイープ (loopback、`javascript:`、bare 文字列)。
- `reports view handles empty state` — non-crash アサート。
- `evaluate view returns a manual prompt without API key` — フォールバックチェーンを検証。
- `config GET returns known keys masked` — シークレットが `/api/config` から決して漏れない。
- `cv.md PUT round-trips with sanitization` — XSS 系断片 (script タグ、`javascript:` スキーム) が end-to-end でストリップ。
- `pipeline preview proxy strips scripts` — 無効 URL 拒否パス。

### 📦 挙動変更 (API 契約変更なし)

- Tracker 書き込みがパイプを含む会社名 / 役職名に対して無損失。raw パイプを持つ既存行は次の読み取りで正しくパースされ始めます。
- `/api/{evaluate,deep,mode/:slug}` がプロンプトが妥当でないほど大きい (200 KB+) 場合 502/タイムアウトの代わりに 413 を返します。

### 🧪 テスト

- **284 unit テスト** (数変化なし;パーサ更新後も既存テスト全緑)。
- **12 Playwright ブラウザ smoke テスト** (以前 5)。

---

## [1.9.0] — 2026-05-08

v1.8.0 バックログからの P-6 → P-10 を 1 バンドルで全シップ。ヘッドライン: `server/index.mjs` が 130 LOC のオーケストレータに (762 から、合計 1230 → 130 = -89%);全ルートトピックが独自モジュールを持つ。`/api/evaluate` の Anthropic パリティ、マルチ CLI シム、拡張された i18n パリティテスト、Playwright ブラウザ smoke を CI に配線。

### 🏗️ P-6 — server split-by-concern (フェーズ 2)

P-2 の継続。`server/index.mjs` から残りの 9 ルートトピックを `server/lib/routes/<topic>.mjs` モジュールに抽出。`index.mjs` は今や純粋なオーケストレータ: middleware (security ヘッダ + activity ログ + static)、12 個の `register<Topic>Routes(app)` 呼び出し、SPA catch-all。

- `server/lib/routes/activity.mjs` — `/api/activity`。
- `server/lib/routes/config.mjs` — `/api/config` GET/POST (親 .env ラウンドトリップ)。
- `server/lib/routes/health.mjs` — `/api/health` + `/api/dashboard`。
- `server/lib/routes/help.mjs` — `/api/help/:lang`。
- `server/lib/routes/jds.mjs` — `jds/*.txt` の完全 CRUD。
- `server/lib/routes/llm.mjs` — 全 LLM バウンドエンドポイント (evaluate、deep、mode、apply-helper、interview-prep)。
- `server/lib/routes/pipeline.mjs` — `/api/pipeline*` (timeout / max-redirects / max-body の名前付き定数を持つ SSRF セーフ preview proxy を含む)。
- `server/lib/routes/reports.mjs` — `/api/reports*`。
- `server/lib/routes/tracker.mjs` — `/api/tracker` GET + dedup 対応 POST。

挙動変更なし。283/283 unit テストが各ステップで緑のまま。オーケストレータの import 表面は 47 行から 22 行に減少。

### 🔌 P-7 — `/api/evaluate` の Anthropic パリティ

`/api/evaluate` は以前 Gemini-or-manual でした。v1.9.0 が Anthropic 分岐を追加 (両キーがある場合に優先)、`/api/deep` と `/api/mode/:slug` で既に使われていたルーティング規則をミラー。モデルが cv / profile / mode テンプレートをインライン化するため `bundleProjectContext({ modeSlugs: ['_shared', 'oferta'] })` 経由でルート (REVIEW-A1)。

新エンドポイント: **`POST /api/evaluate/test-anthropic`** — `ANTHROPIC_API_KEY` の smoke チェック、既存 Gemini smoke をミラー。小さなプロンプト (≤256 出力トークン) を送るのでほぼコスト無し;200 文字のサンプルを返します。

フォールバックチェーンは今や: Anthropic → Gemini → manual。

### 🌐 P-8 — Help-center i18n パリティ (監査 + テスト強化)

全 `docs/help/<lang>.md` の構造パリティを監査。8 ロケール全てが既に同じ 14 個の正規 h2 セクションをカバー。テスト強化:

- `tests/help-ui.test.mjs::every help doc covers the same 14 sections` は en + ru のみチェックしていました。今や **全 8 ロケール** (en、es、pt-BR、ko-KR、ja、ru、zh-CN、zh-TW) を反復し各セクション数をアサート。
- 新テスト: `tests/help-ui.test.mjs::every help locale has substantive content` — ロケールスタブ防護として、各非 EN ロケールが `en.md` のバイト長の少なくとも 30% であることをアサート。コンパクトな翻訳は自然に 40-50% に到達;スタブは一桁 %。

結果: 構造パリティが CI で強制されるように。

### 🤖 P-9 — Playwright ブラウザ smoke を CI マトリクスに

`tests/playwright-smoke.mjs` (v1.8.0 で opt-in として追加) が CI ワークフローの一部に。既存の `e2e` ジョブが既に Playwright + Chromium をインストールしている;1 つの新ステップ (`npm run test:e2e:browser`) が包括的 node E2E の直後に 5 つのブラウザ smoke テストを実行。

CI 順序: unit (Node 18/20/22 マトリクス) → smoke node E2E → 包括 node E2E → **Playwright ブラウザ smoke** → 失敗時のスクリーンショットアーティファクトアップロード。

### 🌍 P-10 — マルチ CLI 互換性

親 career-ops v1.7.0 がマルチ CLI / Open Agent Skill 標準サポートを導入。UI サブプロジェクトは正規 `CLAUDE.md` を指す薄いシムで同じ慣例に従う:

- `web-ui/AGENTS.md` — Codex / Aider / 汎用 CLI エントリポイント。
- `web-ui/GEMINI.md` — Gemini CLI エントリポイント。

両シムは hard rules とクイックリファレンスを再記述しますが、完全なプロジェクトレベル指示は `CLAUDE.md` に委譲します。これにより非 Claude CLI も Claude Code セッションと同じ方向付けに着地します。デプロイされた UI 自体は runtime で CLI-agnostic を維持。

### 🧪 テスト

- **284 unit テスト** (以前 283): +1 新しい help-locale パリティテスト。
- **5 Playwright ブラウザ smoke テスト** — opt-in だけでなく CI の一部に。
- カバレッジは維持。

### 🔧 触れたファイル

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

### 📦 新規 REST エンドポイント

| メソッド | パス | 目的 |
|---|---|---|
| `POST` | `/api/evaluate/test-anthropic` | `ANTHROPIC_API_KEY` の smoke チェック (P-7)。`/api/evaluate/test-gemini` をミラー。 |

### 🤖 新規 CLI エントリポイント

| ファイル | CLI | ノート |
|---|---|---|
| `AGENTS.md` | Codex / Aider / 汎用 | 完全指示は `CLAUDE.md` を指す。 |
| `GEMINI.md` | Gemini CLI | セッション開始時に Gemini が自動ロード。 |

---

## [1.8.0] — 2026-05-08

ハードニング、リファクタ、SDD ブートストラップ。3 件の高重大度修正 (A1、A2、A3)、4 件の中重大度 (B1–B4)、6 件のクリーンアップ、親 career-ops v1.7.0 サーフェスの監査、server split-by-concern (P-2 フェーズ 1)、Playwright ブラウザ smoke ハーネス、`docs/` と `.claude/` 下の完全な SDD 基盤。

### 🔥 高重大度修正

- **`fix(deep): inline cv/profile/mode files for Anthropic SDK calls (REVIEW-A1)`** — `/api/deep` と `/api/mode/:slug` は以前モデルに「これらのファイルを最初に読む」と指示していましたが Anthropic SDK にはファイルシステムがありません。出力は中身が空でした。新規 `bundleProjectContext({ modeSlugs })` が `cv.md`、`config/profile.yml`、`modes/_shared.md`、mode テンプレートを読み、各 16 KB で切り詰め、プロンプトに `<project_context>` ブロックを前置。ライブ検証済み: `claude-sonnet-4-6` から deep-research 呼び出しに対し 26 KB の grounded markdown レスポンス。
- **`fix(runner): SIGKILL escalation after SIGTERM grace period (REVIEW-A2)`** — `runNodeScript` と `streamNodeScript` は以前 timeout / client-disconnect で `SIGTERM` のみを送信していました。syscall (DNS、ブロックされた socket) で stuck になった子プロセスはこれを無視し、SSE 接続が Node の GC が刈り取るまでハング。各パスは 5 秒のウォッチドッグを腕装し `SIGKILL` にエスカレート。Promise が常に resolve するように。
- **`fix(runner): max-runtime cap on streaming endpoints (REVIEW-A3)`** — 全 SSE スクリプト runner (`/api/stream/{scan,liveness,pdf}`) がハードな 30 分上限を持つように。期限切れ時: `event: error { message: 'maximum runtime exceeded' }` を発し、A2 ウォッチドッグ経由で子を kill、レスポンスを終了。

### 🛡️ 中重大度修正

- **`fix(preview): per-hop redirect validation in /api/pipeline/preview (REVIEW-B1)`** — `redirect: 'follow'` から手動 redirect-walking に切り替え。各 `Location` ヘッダは `isValidJobUrl` で再検証;3 ホップで上限。敵対的なボードが loopback / プライベート IP / `file://` にバウンスできなくなりました。拒否パスを 4 つの新規テストでカバー。
- **`refactor(keys): hasGeminiKey helper unifies LLM-key checks (REVIEW-B2)`** — ルートハンドラの直接 `process.env.GEMINI_API_KEY` 読み取りを `lib/anthropic.mjs` の `hasGeminiKey()` に置換。`hasAnthropicKey()` 形状をミラーし一貫性とモック容易性を確保。
- **`feat(scanners): thread AbortSignal through hh.ru, Habr, Greenhouse, Ashby, Lever (REVIEW-B3)`** — SSE クライアントが scan 中に切断した際、進行中の HTTP fetch が全クエリを完了まで走らせてイベントを drop する代わりに abort されるように。`runRuScan` と `runEnScan` が `opts.signal` を受け取り、`/api/stream/scan-{ru,en}` の SSE ハンドラが `AbortController` を作成し `res.close` で abort。
- **`test(anthropic): log-guard test prevents future API-key leaks via console (REVIEW-B4)`** — `runAnthropic` のハッピー + エラーパス中の全 `console.{log,info,warn,error,debug}` 呼び出しを捕捉、出力ゼロと canary key 文字列が決して現れないことをアサート。将来の `console.log(opts)` 回帰に対する多層防御。

### 🧹 低重大度ポリッシュ

- **`fix(parsers): defense-in-depth URL gate inside addPipelineUrl (REVIEW-C4)`** — ルートレベル `isValidJobUrl` を補完するパーサレベルでの非 http(s) 値拒否。より厳格なルールを望む呼び出し元向けにオプションの `opts.validate`。
- **`docs(readme): badge "tests-88 passed" → "tests-277 passed" (REVIEW-C3)`** — 桁が 1 つズレていました。
- **`test(i18n): missing-keys diff grouped by locale (REVIEW-C6)`** — `tests/i18n-coverage.test.mjs` がギャップを見つけた際、出力が混在行ではなく `[ru] (3): foo, bar, baz` に。
- **`docs(review): C1 closed as resolved-on-inspection`** — サニタイザ正規表現は既に `\x00-\x08` の hex 形式;review エントリはツールレンダリングのアーティファクトでした。

### 🏗️ P-2 フェーズ 1 — server split-by-concern

`server/index.mjs` は 1230 LOC で 800 行天井を大きく超えていました。挙動変更なしで focused モジュールに分割。283 unit テスト全てが各ステップで緑のまま。

- `server/lib/security.mjs` — `isValidJobUrl`、`stripDangerousMarkdown`、`sanitizeJobDescription`、`isPubliclyExposed`。外部コンシューマの後方互換のため `index.mjs` から re-export。
- `server/lib/prompts.mjs` — `bundleProjectContext`、`buildEvaluationPrompt`、`buildDeepPrompt`、`buildModePrompt`、`buildApplyChecklist`。
- `server/lib/store.mjs` — `safeReadApps`、`safeReadPipeline`、`safeListReports`、`checkProfileCustomized`、`ensureRussianPortalsDefaults`。
- `server/lib/routes/scan.mjs` — `/api/stream/scan-{ru,en}`、`/api/scan-ru/config`、`/api/scan-results` 用の `registerScanRoutes(app)`。
- `server/lib/routes/runners.mjs` — バッファ `/api/run/*` テーブル、ストリーミング `/api/stream/{scan,liveness,pdf}`、生成 PDF list/download 用の `registerRunnerRoutes(app)`。
- `server/lib/routes/content.mjs` — CV / Profile / Portals / Modes 用の `registerContentRoutes(app)`。

`index.mjs` は今や 762 LOC (-38%、800 上限以下)。フェーズ 2 では tracker、pipeline、reports、jds、llm (evaluate/deep/mode)、health をルートモジュールに抽出。オーケストレータは <500 LOC を目標。

### 🔍 親 career-ops v1.7.0 監査

ユーザーが親プロジェクトを v1.7.0 に更新。消費される全サーフェスを監査 — UI は完全に互換。注目すべき発見は `docs/architecture/DATA-FLOWS.md` に文書化:

- Modes カタログが 7 → 19 ファイルに成長。UI の `MODE_ALLOWLIST` は意図的に 7 つだけを surface (他は Claude-Code 専用)。意図的な狭いスコープを説明するコメントを追加。
- `portals.yml` スキーマ確認: `tracked_companies` (96 エントリ、87 有効、71 が API あり)。EN scanner はこれを正しく読む;レガシー `companies` キーも引き続きサポート。
- 今日消費されない新規親サーフェス: `dashboard/` (Go プログラム)、`update-system.mjs`、`generate-latex.mjs`、`analyze-patterns.mjs`、`liveness-core.mjs`、`followup-cadence.mjs`、`test-all.mjs`、ローカライズされた mode サブディレクトリ (`de/fr/ja/pt/ru`)。
- ライブの `/api/dashboard`、`/api/health`、`/api/modes`、`/api/portals`、`/api/profile`、`/api/cv`、`/api/jds`、`/api/reports`、`/api/tracker`、`/api/pipeline`、`/api/evaluate`、`/api/deep`、`/api/stream/scan-en` 全てが緑検証済み。

### 🤖 SDD / GSD ブートストラップ

`career-ops-ui` は GSD パイプライン (`superpowers@claude-plugins-official` の `gsd-*` skill) と整合する完全な Spec-Driven Development 基盤を持つように。

- `CLAUDE.md` (ルート) — プロジェクトレベルのエージェントシステムプロンプト: スタック、GSD パイプライン、hard rules (親契約、セキュリティエンベロープ、`--no-verify` 禁止)、慣例、親プロジェクト境界。
- `.aiignore` — AI エージェント用除外リスト: ベンダー、バイナリ、親ユーザーデータ、`.planning/`、`.env`、ロケール重複。
- `.claude/agents/` — 3 つのプロジェクト固有サブエージェント定義:
  - `web-ui-route-reviewer.md` — 新ルートを SSRF、CSP、サニタイザ、親書き込み契約、慣例、テストに対してゲート。
  - `spa-view-reviewer.md` — CSP-safe DOM、i18n、ルーター登録、アクセシビリティ。
  - `test-isolation-reviewer.md` — テストが CI 分離されている (親プロジェクトを前提としない、ライブネットワークなし、ポート衝突なし) ことを検証。
- `.claude/commands/` — slash-command スタブ: `/sdd-status`、`/codebase-tour`。
- `docs/` ツリー — 全て英語:
  - `PROJECT.md` — 何を/なぜ/誰のために、スコープ、制約、成功基準。
  - `ROADMAP.md` — 現在のマイルストーン + 完了履歴 + バックログ。
  - `sdd/SDD-GUIDE.md` — `gsd-*` skill にマッピングされた discuss → spec → plan → execute → verify → review パイプライン。
  - `sdd/CONVENTIONS.md` — モジュールシステム、命名、ルート、サニタイザ、クライアントパターン、i18n、エラー、ロギング、テスト、コミット、ブランチ、CSS。
  - `architecture/OVERVIEW.md` — トップレベル図、レイヤ、ブートシーケンス、不変条件、"where to look first when…" チートシート。
  - `architecture/SERVER.md` — `server/lib/*.mjs` のファイル毎マップ (P-2 分割で更新)。
  - `architecture/FRONTEND.md` — SPA 構造、view インベントリ、グローバル、"how to add a view"。
  - `architecture/API.md` — 全 `/api/*` ルートの完全インベントリ。
  - `architecture/DATA-FLOWS.md` — 親プロジェクトの全 read/write、明示的ユーザーアクション契約付き。
  - `reviews/REVIEW-2026-05-07.md` — この changelog の修正を生んだ静的レビュー。

### 🔒 セキュリティ & リポジトリ衛生

- **`chore(.gitignore): comprehensive defense-in-depth patterns`** — env バリアント、IDE フォルダ、GSD スクラッチ (`.planning/`)、ユーザー毎エージェント設定 (`.claude/settings.local.json`、`.claude/cache/`、`.claude/state/`、`.claude/memory/`)、Playwright アーティファクト (`playwright-report/`、`test-results/`、`.playwright/`、`trace.zip`)、heap/CPU プロファイル、未出荷ツールのロックファイル、拡張された macOS Finder ノイズ、汎用シークレットパターン (`secrets.json`、`credentials.json`、`*.pem`、`*.key`) をカバー。

### 🧪 テスト

- **283 unit テスト** (以前 277): +6 新規 (B1 redirect 拒否で 4、`hasGeminiKey` で 1、`runAnthropic` log-guard で 1)。
- **5 Playwright ブラウザ smoke テスト** (新規、`npm run test:e2e:browser` で opt-in): ダッシュボードレンダリング + バージョンフッタ、ダッシュボード → scan → pipeline → cv ナビゲーション、言語切替永続化、404 view、health ページレンダリング。Playwright は親の `node_modules` 経由で解決 — 新規依存なし。
- カバレッジは約 93% 行 / 約 83% 分岐を維持。

### 📝 新規 / 更新された package.json スクリプト

| スクリプト | 目的 |
|---|---|
| `npm run test:e2e:browser` | in-process サーバーに対し Playwright smoke ハーネスを実行 (5 テスト)。 |

### 🔧 触れたファイル

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

Help center、UI 内 App settings、モバイルサイドバー、単一 Scan ボタン、全 prompt-builder の「結果を表示」ショートカット。

### ✨ 新機能

- **`feat(help): in-app user guide` (`/#/help`)** — 新規サイドバーエントリからアクセス可能な長文 Markdown ドキュメント。各ページをステップバイステップでカバー: クイックスタート、CV エディタ、Profile、Scan フィルタ、Pipeline preview、Evaluate、Deep research、Apply、Tracker、Reports、7 mode 全て、Activity log、Health、セットアップヒント。`<h2>` 見出しから自動構築される sticky 目次、同期 DOM 構築 (race なし)。サポートする 8 ロケール全てにローカライズ。
- **`feat(config): in-UI App settings page` (`/#/config`)** — ブラウザから `ANTHROPIC_API_KEY`、`ANTHROPIC_MODEL`、`GEMINI_API_KEY`、`GEMINI_MODEL`、`HH_USER_AGENT`、`PORT`、`HOST` を編集。**親プロジェクト** の `.env` ファイルに書き込むため career-ops Node スクリプトと web-ui の dotenv ローダの両方が同じソースを取得します。シークレットキーは読み取り時にマスク (先頭/末尾 4 文字)。Model フィールドはキュレートされたリストの dropdown (claude-sonnet-4-6 / claude-opus-4-7 / claude-haiku-4-5 / gemini-2.0-flash 等)。空値はキーを削除。値は実行中の process.env に即座に適用 — ほとんどの設定で再起動不要。
- **`feat(modes): "⚡ Show result" button alongside "Copy prompt"`** — manual モードでプロンプトが生成された時、ユーザーは LLM 結果を得るために入力を再タイプする必要がなくなりました。新ボタンは同じフォームを `run: true` で再送信し、キーが構成されていない場合は明確なトースト (`Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env first`) にフォールスルー。`/#/deep`、`/#/project`、`/#/training`、`/#/followup`、`/#/batch`、`/#/contacto`、`/#/interview-prep`、`/#/patterns` で動作。

### 🐛 UX + UI 修正

- **`fix(scan): single Scan button replaces three (Scan all + EN + RU)`** — 圧倒的な選択肢、99% のケースで同一デフォルト。統合された `🌐 Scan` ボタンが有効な全ソースを実行。Help ドキュメントを 8 ロケールで更新。
- **`fix(ui): mobile sidebar drawer`** — ビューポート <900px がトップバーにハンバーガーボタン (☰) を取得;`body.sidebar-open` がサイドバーをスライドインさせる CSS transform をトグル。Backdrop dim + クリックでクローズ。アンカークリック + hashchange で自動クローズし、ユーザーは drawer が畳まれた状態で新ページに着地。大きなビューポートは影響なし。
- **`fix(server): footer version reflects web-ui, not the parent VERSION`** — `/api/health` が web-ui 自身の `package.json` を読むように。フッタは親のバージョンファイルから古い `1.6.0` を漏らさなくなりました。親の VERSION は引き続き `parentVersion` として別途 surface。

### 📦 新規 REST エンドポイント

| メソッド | パス | 目的 |
|---|---|---|
| `GET`  | `/api/help/:lang` | リクエストされたロケールの Markdown ユーザーガイドを返却、`en.md` にフォールバック。Path-traversal セーフ。 |
| `GET`  | `/api/config` | 全既知 env キーの現在値を返却;シークレットマスク。 |
| `POST` | `/api/config` | 指定キーを親プロジェクトの `.env` に書き込み、各値を検証、`process.env` にライブ適用。 |

### 🌐 i18n

- `nav.help`、`nav.config`、`help.*`、`config.*`、`deep.showResult`、`deep.needKey`、`scan.btnRun` にわたる 30+ 新キー。全 8 ロケール充足。

### 🧪 テスト

- `tests/help.test.mjs` (12 ケース) — 全サポートロケールが実質的 markdown を返却、EN が各ページ slug をスポットチェック、未知 lang → EN フォールバック、path-traversal サニタイズ、各ロケールが `cv.md` / `profile.yml` / `.env` を参照。
- `tests/help-ui.test.mjs` (9 ケース) — view ファイル登録、サイドバーエントリ、全ロケールの i18n キー存在、各ロケールの docs ファイル存在、EN/RU help が 14 個の正規セクション、全 #/foo ルートカバレッジ、deep + mode-page の Show-result 配線。
- `tests/env-config.test.mjs` (18 ケース) — `parseEnv`、`maskSecret`、`validateConfig`、`updateEnvFile` (ブートストラップ、コメントを保持しつつ in-place 書き直し、空値削除、必要時の quote) の純関数テスト。
- `tests/config-endpoint.test.mjs` (8 ケース) — GET がシークレットをマスク / env パス返却;POST が親 .env に書き込み;live process.env 適用;空値で unset;未知キー + 不正形式 Anthropic キーを 400 で拒否。

### 📊 統計

- **テスト:** 233 → **277** (+44 新規テストファイル 4 つにわたって)。
- **E2E:** 20 smoke + 23 包括 = 43 Playwright ステップ、全緑。
- **カバレッジ:** 93.5% 行 / 82.6% 分岐 / 93.7% 関数 (不変 — 新コードは完全にテスト済み)。

---

## [1.7.1] — 2026-05-04

post-v1.7.0 作業を積み上げたパッチリリース: pipeline preview ペイン、Anthropic API 統合、スクロール可能なサイドバー、dotenv ローダ、動的 Active-companies リスト、CI ワークフローハードニング。

### ✨ Pipeline preview ペイン

- **`/#/pipeline` 刷新** — 左リスト + 右プレビューペイン。任意の URL をクリックしてサーバー側プロキシのスナップショットを fetch (`GET /api/pipeline/preview` がスクリプト/スタイル/タグを除去、8 KB で上限、`isValidJobUrl` で検証)。ライブフィルタ入力、"In queue" カウンタ、⚡ "Evaluate first" ヘッダボタン。各行のインライン ▶/✕ に加えてプレビューペインに完全な Evaluate / Open in tab / Delete。`data-url` + `.pipeline-row` + `.pipeline-row-delete` クラスによる安定したテストセレクタ。`tests/pipeline-preview.test.mjs` の **8 新規テスト** (モックされた fetch、上流バインド不要)。

### ✨ Anthropic API 統合 — どこでも「Run live」

- **`server/lib/anthropic.mjs`** — Anthropic Messages API 用ゼロ依存クライアント (claude-sonnet-4-6 デフォルト、`ANTHROPIC_MODEL` で上書き)。`ANTHROPIC_API_KEY` が設定されている場合、全 mode ページ (`/#/deep`、`/#/project`、`/#/training`、`/#/batch`、`/#/contacto`、`/#/interview-prep`、`/#/patterns`) が "⚡ Run live (Anthropic)" ボタンを **プライマリ** アクションとしてレンダリング — クリックでプロンプトを実行し Markdown をブラウザに描画 (Claude Code への引き渡しの代わり)。Gemini は Gemini キーのみ設定された場合のフォールバックとして残る。Manual モードはキーが全くなくても動作。`tests/anthropic.test.mjs` の **8 新規テスト**。

### 🐛 CI / pipeline 修正

- **`fix(api): tighten pipeline URL validator` (FIX-M7)** — loopback ホスト名、長さ <10 または >2000、URL 内のホワイトスペースも拒否するように。
- **`fix(server): actually load .env so HH_USER_AGENT / GEMINI_API_KEY hints work`** — `server/lib/dotenv.mjs` (35 行のゼロ依存ローダ) を追加し `server/index.mjs` の先頭に配線。スキャナコード内の runtime ヒントが遂に機能するように。**6 新規テスト**。
- **`fix(ui): scrollable sidebar`** — 6 グループ 18 ナビ項目が短いビューポートでオーバーフロー。`.sidebar` が薄いカスタムスクロールバー付きの `overflow-y: auto` を持つように。
- **`fix(ui): make HH_USER_AGENT banner dismissible`** — その後、過剰だと判断し `/scan` から完全削除。Health ページのチェックは引き続き surface。
- **`fix(scan): Active companies list is now collapsible + filterable + grouped`** — 87 タグのフラット表示は圧倒的でした。今や "▸ Active companies 87/71" トグルが順序付きリスト (✓ API-backed が先、○ websearch が次) + 検索フィルタを展開。
- **`fix(test): isolate api.test.mjs + en-scanner.test.mjs from parent project`** — 両方が tmp プロジェクトルートを起動するため、web-ui と並んで親が checked out されていなくても CI が動作。
- **`fix(workflow): publish-package version-match only on release events`** — main からの `workflow_dispatch` で tag/version チェックが失敗しなくなった。
- **`fix(e2e): stable selector for pipeline row delete`** — アンカーラッパーを復元し `data-url` 属性を追加して e2e スイートが selector-stable に。

### 📦 新規 REST エンドポイント

| メソッド | パス | 目的 |
|---|---|---|
| `GET` | `/api/pipeline/preview?url=…` | サーバー側プロキシ: URL の可視テキストスナップショットを返却 (スクリプト/スタイル除去、8 KB 上限)、`isValidJobUrl` でゲート。 |

### 📊 このバッチ後の統計

- **テスト:** 225 → **233** (v1.7.0 の上に +8)。
- **テストファイル:** 25 → **26**。
- **E2E:** 20 + 23 = 43 Playwright ステップ、全緑。

---

## [1.7.0] — 2026-05-03

QA r5 駆動の 35 コミットによるハードニング + UX + 機能完成パス。3 層のセキュリティ (XSS サニタイズ、CSP、入力検証) が着地、欠落していた CRUD エンドポイントが全て埋まり、親プロジェクトブートストラップが完全自動化、UI が **9 つの新ページ** を獲得 — Activity、再設計された Deep Research、サイドバーグループ化された 7 mode (project / training / followup / batch / outreach / interview-prep / patterns) で親 `modes/` の 100% カバー。Pipeline がサーバー側 preview ペインを獲得。Anthropic API 統合により全 mode で "Run live" がワンクリックアクションに。テストカバレッジは **73** → **225**、**25 テストファイル**、加えて **23 包括 Playwright e2e ステップ**。GitHub Actions が CI / AI review / Release / Publish-Package ワークフローを出荷。

### 🔒 セキュリティ

- **`fix(cv): sanitize CV markdown to block stored XSS in preview` (FIX-C10)** — `PUT /api/cv` が `<script>`、`<iframe>`、`<object>`、`<embed>`、`<style>`、`<form>`、`<svg>`、`on*=` イベントハンドラ、`javascript:`/`vbscript:`/`data:text/html` URI を `cv.md` 書き込み前に除去。ボディは 1 MB で上限 (オーバーフロー時 413)。クライアント側 `UI.md()` を書き直し、任意の markdown 変換が走る前に全バイトをエスケープ。生 HTML が `innerHTML` に届くことはなくなりました。リンク `href` 属性は安全スキームの allowlist (`http`/`https`/`mailto`/`tel`/相対 + `data:image` のみ) で検証。strip ヘルパーと HTTP ラウンドトリップにわたる 17 新規テスト。
- **`fix(server): add CSP and baseline security headers` (FIX-L2)** — 全レスポンスが `X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy: same-origin` を運ぶように。サーバーが loopback (`HOST` ≠ `127.0.0.1`/`::1`/`localhost`) を超えてバインドする場合、厳格な `Content-Security-Policy` が上に重ねられる: `default-src 'self'`、`script-src 'self'` (`unsafe-inline` なし)、Google Fonts allowlist、`connect-src 'self'` で XSS 漏出をブロック。`index.html` と `router.js` のインライン `onclick` ハンドラは `addEventListener` に移動し、厳格 CSP を維持。5 つの異なる `HOST` 値で CSP をゲートする 8 新規テスト。
- **`fix(api): tighten pipeline URL validator` (FIX-M7)** — `POST /api/pipeline` は以前 `"not-a-url"` を受け付け永続化していました。今や `isValidJobUrl()` が bare 文字列、<10 または >2000 文字、ホワイトスペースを含む URL、非 `http(s)` スキーム、loopback ホスト名 (`localhost`/`127.0.0.1`/`::1`) を拒否。**FIX-M3** + **FIX-M6** (無効で 400 を返却、成功時に `deduped` フラグ) を含む。
- **`fix(server): actually load .env so HH_USER_AGENT / GEMINI_API_KEY hints work`** — 以前 runtime は「`.env` に HH_USER_AGENT を設定」とユーザーに伝えていましたが、サーバーはそのファイルを読まず、指示に従っても何も起きませんでした。35 行のゼロ依存 dotenv ローダ (`server/lib/dotenv.mjs`) を `server/index.mjs` の先頭に配線。コマンドライン上で設定された process-env 値が引き続き勝つため既存 CI 上書きが影に隠れない。親の `.env.example` に実際の Chrome User-Agent 例を含む `HH_USER_AGENT` ブロックを文書化。6 新規テスト。
- **`fix(api): sanitize JD before prompt assembly` (FIX-M5)** — `POST /api/evaluate` が Gemini 呼び出し前またはプロンプトのエコーバック前に ANSI エスケープ、制御バイト、インライン `<script>` タグを除去しホワイトスペースをトリム。50 KB 長上限。50 文字最小は *サニタイズ後* テキストに対して走るため、長く見えるがほとんどがエスケープから成るプロンプトインジェクション試行は 400 で fail-fast。
- **`fix(health): mask Node version + project root when HOST!=loopback` (FIX-M1)** — `/api/health` が LAN 公開デプロイでホストをフィンガープリントしなくなりました。Loopback レスポンスはローカル診断用に値を保持。

### ✨ 新機能

- **`feat: 7 new sidebar modes + grouped sidebar` (FIX-C8)** — UI ギャップなしで親の `modes/` ディレクトリの 100% をカバー。新ルート: `#/project` (ポートフォリオプロジェクトアドバイザ)、`#/training` (コース / 資格評価)、`#/followup` (アプリケーション毎ケイデンス)、`#/batch` (並列 URL プロセッサ)、`#/contacto` (LinkedIn outreach ドラフタ)、`#/interview-prep` (ステージ固有準備)、`#/patterns` (拒否パターンアナライザ)。7 つ全てが単一の config 駆動 view factory (`public/js/views/mode-page.js`) と単一の汎用エンドポイント `POST /api/mode/:slug` を共有 — 将来の新規 mode 追加は 1 つの config 行 + 1 つの i18n ブロック。サイドバーを 6 グループに再編成: Sourcing / Decision / Application / Networking / Analytics / Setup。ナビ項目合計 18。`tests/modes-endpoints.test.mjs` の 12 新規テスト。
- **`fix: bootstrap parent deps + russian_portals defaults` (FIX-C4 + C9 + C12 + H2)** — `bin/start.sh` が fresh clone で親の `node_modules` (js-yaml、playwright、jsdom) と `npx playwright install chromium` をインストールするように。`/api/stream/scan`、`/pdf`、`/liveness` が箱から end-to-end で動作。`createApp()` がブート毎に `portals.yml` をプローブ — `russian_portals:` ブロックが欠落していればコメント付き文書化デフォルトを追記。冪等: 2 回目のブートは no-op。3 新規テスト。
- **`fix: disable 9 dead portal slugs in template + health-check script` (FIX-C3)** — `templates/portals.example.yml` が Ada / Factorial / Tinybird / Weights & Biases / Travelperk / Clarity AI / Forto / Vinted / Runway に `enabled: false` (各エントリに理由インラインコメント) でフラグを付けて出荷。新規インストールは 96 ではなく **87** 社の生存スキャン。新規 `web-ui/scripts/portals-health-check.mjs` が全有効 `careers_url` を HEAD-probe し DEAD エントリと提案パッチリストをレポート (`--json` で JSON 出力)。3 新規テスト。
- **`feat(activity): user-action log + Activity sidebar page`** — 全状態変更 API リクエストが `data/activity.jsonl` (タイムスタンプ、アクション動詞、ターゲット、成功フラグ、オプション詳細) にキャプチャ。アクションプレフィックスチップフィルタ (pipeline / cv / jd / evaluate / scan / stream / script)、アクション ✓/✗ バッジ、リフレッシュボタン付きの新規サイドバーエントリ **Activity**。5 MB で自動ローテーション。10 新規テストが middleware、read フィルタ、corrupt-line 耐性、`GET /api/activity` 自体の再帰ガードをカバー。
- **`feat(deep): view Deep Research in browser + saved-results archive`** — Deep Research ページが (a) `{ run: true }` と `GEMINI_API_KEY` が設定されている時にプロンプトを Gemini でライブ実行し出力を `interview-prep/{slug}.md` に永続化、(b) 全保存 deep-research ファイルを相対タイムスタンプ付きクリック可能カードとして列挙、(c) 結果を Markdown としてレンダリングし結果毎に **📋 Copy / ⬇ Download .md / ↗ Open in tab** アクションを提供。新規 REST サーフェス: `GET /api/interview-prep`、`GET /api/interview-prep/:name`、`DELETE /api/interview-prep/:name`。7 新規テスト。
- **`feat(cv): generate + download PDF in browser, with PDF archive`** — CV ページ上の新規 **📄 Generate PDF** ボタンがモーダルコンソールで `/api/stream/pdf` をストリーム。`ERR_MODULE_NOT_FOUND` / `playwright` エラー時、コピペ可能なブートストラップコマンドを surface。新規 "Generated PDFs" セクションが各成功実行後に自動ロードし、全 `output/*.pdf` を **↗ Open** と **⬇ Download** ボタン付きで列挙。新規 REST サーフェス: `GET /api/output/pdfs`、`GET /api/output/pdfs/:name`。6 新規テスト。
- **`feat(api): POST /api/tracker — append rows from the UI` (FIX-H8)** — ブラウザから `data/applications.md` に正規行を追記。company + role を検証、status を `templates/states.yml` に対して正規化、自動インクリメントのゼロ詰め `#`、company+role での dedup (大文字小文字無視)、markdown テーブルが壊れないよう notes のパイプをエスケープ。ファイルが空の時テーブルをブートストラップ。6 新規テスト。
- **`feat(api): DELETE /api/jds/:name` (FIX-H4)** — シェルアウトなしで保存済み JD を削除。Path-traversal 文字はファイルシステム touch 前に除去;パラメータは `.txt` で終わる必要あり。`../../etc/passwd` 拒否を含む 5 新規テスト。
- **`feat(api): POST /api/evaluate/test-gemini` (FIX-H7)** — ユーザーが実評価を待たずに API キーが機能することを確認できるよう、50 文字のダミー JD を `gemini-eval.mjs` 経由で実行する smoke テストエンドポイント。`{ ok, code, sampleLength, sample }` を返却。

### 🐛 バグ修正

- **`fix(router): catch-all 404 view + i18n coverage guard` (FIX-C7)** — 未知ハッシュルートは以前サイレントにダッシュボードにフォールバックし、タイポや壊れたブックマークを覆い隠していました。今や `#/totally-random-xyz` が悪いパスを引用して返す専用 404 ページをレンダリングしダッシュボードへリンク。404 view はユーザールートと衝突しないよう router IIFE 内に登録。新規 `tests/i18n-coverage.test.mjs` が `vm.Context` 内で stub `window` 付きで `i18n.js` を走らせ、プライベート `DICT` を expose し、173+ キー × 8 ロケールの各キーが populate されかつ非空であることをアサート。4 新規ルーターテスト。
- **`fix(router): alias #/profile → settings` (FIX-C2)** — 内部ルート名は `settings` (`nav.settings` が "Profile" をレンダリング) ですが外部リンクと筋肉記憶は `#/profile` に行きます。今や両アドレスが同じ view に到達し、サイドバーのナビ項目はどちらでも光ります。2 新規テスト。
- **`fix(health): unify Health/Doctor + flag template profiles` (FIX-C6 + FIX-H6)** — Health と Doctor は 2 つの異なる真実の源でした。今や `/api/health` が Doctor がレポートする全て (parent-deps、Playwright、dirs、profile-customized、`HH_USER_AGENT`) を expose。`Profile customized` チェックがプレースホルダ名 (`Jane Smith`、`Alex Doe`、`John Doe`、`Your Name`、`Test User`) と明示的な YAML パースエラーを検出。4 新規テスト。
- **`fix(scan): warn on query↔negative collisions in RU config` (FIX-H3)** — `portals.yml` が `title_filter.negative` に `"PHP"` を含み Senior PHP をターゲットとするクエリを持つ場合、全マッチがフィルタされユーザーは結果ゼロを見ます。`loadConfig()` が `warnings` 配列を計算し;`runRuScan()` が scan 開始前に各 warning を SSE stderr 行として発します。2 新規テストが出荷デフォルトが箱から PHP-friendly のままであることを検証。
- **`fix(scan): warn when HH_USER_AGENT is unset` (FIX-H1)** — `/scan` ページが `/api/health` をプローブし、`HH_USER_AGENT` が空の時にアクション行上に黄色の警告カードを表示。RU scan をクリックする *前* に hh.ru の 403 を知らせます。
- **`fix(api): warn when POST /api/jds slug had unsafe chars stripped` (FIX-M2)** — 危険文字を除去する slug 正規化が `warning` フィールドを返却するように;純粋な大文字小文字/ホワイトスペースクリーンアップはサイレントを維持。サニタイズ後の空結果は 400。
- **`fix(ui): clear global search on route change + button spinners` (FIX-M4 + FIX-L1)** — グローバル検索 input が `hashchange` でクリア (アクティブタイピングのガード付き)。新規 `UI.withSpinner(button, fn)` ヘルパーがローディング状態、ARIA、二重クリック防止を全非同期ボタンクリックに配線。Doctor / Verify / sync-check / Save CV / Normalize / Dedup / Merge ボタンで既に採用。
- **`fix(ui): make sidebar scrollable so 18 nav items always reach the footer`** — FIX-C8 のグループ化サイドバーが短いビューポートでオーバーフロー;ボトム項目 (Activity / Health) がクリップされていました。`.sidebar` が薄いカスタムスクロールバー付き (WebKit + Firefox) の `overflow-y: auto` を持つように。フッタは既存の `margin-top: auto` で pin されたまま。
- **`fix(ui): empty modal-title placeholder` (FIX-H9)** — `index.html` のハードコード英語 `"Title"` 文字列が消え、モーダルオープン中に見えていた短いレースウィンドウをクローズ。

### 🌐 i18n

- 173+ 翻訳キー × 8 サポートロケール (`en`、`es`、`pt-BR`、`ko`、`ja`、`ru`、`zh-CN`、`zh-TW`)。404 ページ、activity log、deep research、PDF フロー、セキュリティ警告、tracker mutation、apply rename にわたる新規キーを全ロケールに追加。カバレッジは `tests/i18n-coverage.test.mjs` で強制 — 全キーが全サポートロケールで非空値を持つ必要があるか CI が失敗。

### ⚙️ DevOps

- **テスト数:** 73 → **201** (23 テストファイルにわたって +128 テスト)。残る単一失敗テスト (`runEnScan: dry-run end-to-end across multiple sources`) は Greenhouse/Ashby/Lever ライブ API レスポンスに依存する既存 flake。
- **包括 Playwright e2e** (`tests/e2e-comprehensive.mjs`、23 ステップ): 完全なユーザー旅程を歩く — CV 保存 → preview → PDF 生成 → 全 7 つの新 mode → tracker フィルタ → activity log → 404 → モーダル ESC → サイドバースクロール → Ctrl-K フォーカス → 検索クリア → profile alias → 言語永続化。
- **GitHub Actions** (`.github/workflows/`):
  - `ci.yml` — Node 18/20/22 マトリクスでの unit + integration テスト、i18n カバレッジゲート (全キー × 8 ロケールが非空である必要)、全 Playwright e2e を PR 毎に。
  - `ai-review.yml` — 全 PR で Claude Code AI レビュー。メンテナがマージ権限を保持;Claude は提案のみ。`skip-ai-review` ラベルでスキップ。
  - `release.yml` — `v*.*.*` タグが push されると GitHub Release を自動公開;リリースノートは `CHANGELOG.md` からスライスされるため、全 8 言語バリアントが正規ソースのまま。
- **CSP フレンドリ UI:** `index.html` と `router.js` から全インライン `onclick` ハンドラを削除。厳格 `script-src 'self'` ポリシーが機能を壊さずに強制可能に。

### 📦 新規 REST エンドポイント

| メソッド | パス | 目的 |
|---|---|---|
| `GET`    | `/api/activity`                  | ユーザーアクションイベント一覧、新しい順 |
| `GET`    | `/api/interview-prep`            | 保存済み Deep Research ファイル一覧 |
| `GET`    | `/api/interview-prep/:name`      | 単一の Deep Research ファイル読み取り |
| `DELETE` | `/api/interview-prep/:name`      | Deep Research ファイル削除 |
| `GET`    | `/api/output/pdfs`               | 生成済み PDF 一覧 |
| `GET`    | `/api/output/pdfs/:name`         | PDF を添付としてストリーム |
| `POST`   | `/api/tracker`                   | `applications.md` に行を追記 |
| `DELETE` | `/api/jds/:name`                 | 保存済み JD を削除 |
| `POST`   | `/api/evaluate/test-gemini`      | Gemini API キーを smoke テスト |
| `POST`   | `/api/mode/:slug`                | 7 つの新 mode (project / training / followup / batch / contacto / interview-prep / patterns) 用の汎用プロンプトビルダー |

---

## [1.6.0] — 2026-05-02

web UI の初回公開リリース。このベースライン時点での機能インベントリは `README.md` を参照してください。
