# career-ops-ui

> [career-ops](https://github.com/santifer/career-ops) AI 求人検索パイプラインのための Airbnb スタイルの Web インターフェース。
> Claude Code、ターミナル、Markdown ファイルの間を行き来する代わりに — 単一のブラウザタブから、すべてのオファーを検索、評価、ディープダイブ、応募、追跡できます。

[English](README.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko-KR.md) | **日本語** | [Русский](README.ru.md) | [简体中文](README.cn.md) | [繁體中文](README.zh-TW.md)

[![tests](https://img.shields.io/badge/tests-284%20passed-brightgreen)](README.md#tests)
[![playwright](https://img.shields.io/badge/playwright-12%20smoke-brightgreen)](#tests)
[![node](https://img.shields.io/badge/node-%E2%89%A518-blue)](README.md#requirements)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![release](https://img.shields.io/badge/release-v1.9.1-blue)](https://github.com/Fighter90/career-ops-ui/releases/tag/v1.9.1)

> 📦 **v1.9.1** — サーバを 130 行のオーケストレータ + `server/lib/routes/` の 12 ルートモジュールに分割。`/api/evaluate` の Anthropic パリティ (両キー存在時は優先)。マルチ CLI シム (`AGENTS.md`、`GEMINI.md`) で Codex / Aider / Cursor / Gemini CLI に対応。**unit 284 + Playwright smoke 12**。Production-readiness 評価: [`docs/PRODUCTION-READINESS.md`](docs/PRODUCTION-READINESS.md)。シングルテナント loopback デプロイ可能。LAN 公開用の auth gate は v2.0 (P-12)。


![career-ops-ui — vacancy search](./public/images/screen_vacancy_found.png)

## v1.10.3 の新機能

- **すべての長尺ページに Generate PDF。** 新しい SSE エンドポイント 3 つ — `GET /api/stream/pdf/report?slug=`、`GET /api/stream/pdf/deep?name=`、`POST /api/stream/pdf/inline { markdown }`。**📄 Generate PDF** ボタンが `#/reports/:slug`、`#/deep` (manual + live)、`#/evaluate` (manual + live)、`#/interview-prep` に表示されます。
- **グローバル Express エラーハンドラー。** `PayloadTooLargeError` と不正な JSON が HTML スタックではなくローカライズ可能な JSON エンベロープを返します (F-019)。
- **`#/config` 再グループ化。** API keys / runtime / regional。`HH_USER_AGENT` は `portals.yml::russian_portals.sources` が空でない場合のみ表示される折りたたまれた「Regional sources」セクションに移動 (F-013)。
- **英語トークンが非 EN UI に漏れなくなりました** — `Pipeline`、`Deep research`、`Follow-up`、`Health`、`Outreach`、`Doctor`、`Quick scan` が適切にローカライズされました (F-001)。
- **`#/scan` から EN/RU フレーミング除去** — ラベルが「ATS adapters」+「Regional portals」、Active companies カウンターが各 `done` 後に実際のスキャンコーパスから再計算 (F-010 + F-011 最小スライス; 完全なアダプターレジストリ統合は PR-1 / v1.11.0)。
- **README + ヘルプバンドルをクリーンアップ** — 8 ロケール全てから EN/RU フレーミングを削除 (F-014)。
- 新規テスト。**349/350** ユニット、94.59 % 行 / 84.16 % ブランチ、23/23 E2E、28/28 Playwright。

## v1.10.2 の新機能

- **CV アップロードで multipart 時に `cv.md` が破損しなくなりました。** `multipart/form-data` をデフォルトとする外部ツール (curl `-F`、一般的な HTTP クライアント) は以前、multipart wire envelope を `cv.md` の内容として保存していました。`POST /api/cv/import` は今や **HTTP 415** とヒントを返します:`Content-Type: application/octet-stream` + `X-Filename: <name>` を使ってください。多層防御:multipart のように*見える* octet-stream ボディ (先頭 256 バイト内に `Content-Disposition: form-data` をスニッフィング) も 415 になります。
- **`📄 Generate PDF` がついに PDF を生成します。** `/api/stream/pdf` は以前、親の `generate-pdf.mjs` を**引数なし**で呼び出していました;スクリプトは `Usage:` を出力して終了コード 1 で終了 — SPA は緑のトーストを表示しましたがファイルはディスクに到達しませんでした。今やルートは `cv.md` をサーバー側で HTML にレンダリングし、`output/cv-input-<TIMESTAMP>.html` に書き込み、正しい位置引数 + `--format=a4` でスクリプトを起動します。US-letter 出力のためのオプション `?format=letter`。`cv.md` がない場合の親切なストリームエラー。
- **`docs/test-scenarios/`** — 各ページの契約を文書化した 21 個の英語シナリオファイル (CV アップロード、PDF ダウンロード、スキャンフィルター、pipeline、evaluate、tracker、activity log、セキュリティ、完全な funnel)。

## v1.10.1 の新機能

- **セキュリティ: SSRF 表面の強化。** `isValidJobUrl` は RFC1918、リンクローカル (AWS IMDS `169.254.169.254` を含む)、`0.0.0.0`、127/8 ループバック全範囲、CGNAT `100.64/10`、IPv6 ULA / リンクローカルを拒否するようになりました。プレビュープロキシは各ホップで DNS を再解決し、アドレスがプライベート範囲に入る場合はブロックします — DNS リバインド対策。
- **アクティビティログの規律。** 成功した状態変更のみが記録されます — 4xx ノイズなし。`profile.save`、`config.save`、`cv.import` イベントがフィードに表示されます。
- **韓国語ヘルプ本文を修正。** `GET /api/help/ko` が `ko-KR.md` を正しく提供するようになりました (以前はファイル名とロケールの不一致により英語にフォールバックしていました)。
- **LLM プロンプトが UI 言語を尊重します。** `/api/evaluate`、`/api/deep`、`/api/mode/:slug`、apply-helper は `body.lang` / `Accept-Language` に基づいて "Respond in X" ディレクティブを挿入します。SPA はすべてのリクエストに現在のロケールを自動的に添付します。
- **`/api/evaluate` が `mode:'manual'` を尊重します** — Anthropic クレジットを消費せずにプロンプトを Claude Code にコピーできます。
- **`DELETE /api/pipeline`** が `?url=` と `body.url` の両方を受け入れ、URL がインボックスにない場合は `404` (静かな `200` ではなく) を返します。
- **`scripts/post-qa-cleanup.mjs`** — QA 回帰後のクリーンアップチェックリストを再実行します; デフォルトはドライラン、冪等。

## ワンコマンドインストール

```bash
curl -fsSL https://raw.githubusercontent.com/Fighter90/career-ops-ui/main/bin/setup.sh | bash
```

このコマンドは両方のリポジトリ(career-ops + career-ops-ui)をクローンし、依存関係をインストールし、http://127.0.0.1:4317 でサーバーを起動します。

## なぜ?

[career-ops](https://github.com/santifer/career-ops) は強力な Claude Code ベースの求人検索システムです: JD を貼り付けると → 0-5 のフィットスコア、ATS 最適化された PDF、トラッカーエントリが得られます。Claude Code 内ではうまく動作しますが、データは `cv.md`、`data/applications.md`、`reports/*.md`、`data/pipeline.md`、`portals.yml`、`config/profile.yml` に分散していて — 失いやすく、ざっと見るのが難しい。

`career-ops-ui` はその上に洗練された UI を載せます:

- **閲覧** — トラッカー、レポート、パイプラインを CRM のように。
- **トリガー** — スキャン(Greenhouse / Ashby / Lever **および** hh.ru / Habr Career)を実行し、ライブ SSE ログを見る。
- **評価** — Gemini API で JD を評価するか、Claude 用のコピペプロンプトを取得。
- **編集** — サイドバイサイドの Markdown プレビュー付きで `cv.md` を編集。
- **メンテナンス** — doctor、verify、normalize、dedup、merge — それぞれワンクリック。

純粋に追加のみです: `career-ops/` 内部は何も変更されません。カスタマイズはそのまま残ります。

## ページごとの機能

| ページ            | 機能                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Dashboard**    | 集計カウント (apps / pipeline / reports)、平均スコア、ステータス内訳、最新 5 件の apps + 最新レポート。                       |
| **Scan**         | **🌐 単一の 🌐 Scan ボタン** — 1 回のスイープで有効なすべてのソースを実行 (EN: Greenhouse / Ashby / Lever、RU: hh.ru + Habr Career)。ライブ SSE ログ + stack/level チップフィルターと location / Remote-Hybrid / reloc / source フィルター付きの結果テーブル。 |
| **Pipeline**     | `data/pipeline.md` への CRUD。URL から評価へ直接ジャンプ。                                                              |
| **Evaluate**     | JD を貼り付け → `GEMINI_API_KEY` が設定されていれば `gemini-eval.mjs` を実行; なければ Claude 用のコピペ可能なプロンプトを返す。 |
| **Deep research**| 指定された会社/役割について、`modes/deep.md` の完全なプロンプトを生成。                                                       |
| **Apply helper** | 応募チェックリストを生成; 実際の Playwright フォーム入力は Claude Code 内の `/career-ops apply` のまま。                       |
| **Tracker**      | `data/applications.md` 上のフィルター可能なテーブル(ステータス、スコア、自由テキスト)。normalize/dedup/merge のワンクリックボタン。 |
| **Reports**      | `reports/` 内のすべてのレポートを、解析済みヘッダー (Score / Legitimacy / URL) 付きで閲覧・読む。                              |
| **CV**           | `cv.md` のライブ Markdown エディター + サイドバイサイドプレビュー + sync-check。                                              |
| **Profile**      | `config/profile.yml` + アーキタイプの読み取り専用ビュー。                                                                  |
| **Health**       | OK / OPTIONAL / FAIL バッジですべてのセットアップチェック + `doctor.mjs` および `verify-pipeline.mjs` 実行ボタン。               |

## 必要要件

| | |
| --- | --- |
| **Node.js** | ≥ 18 |
| **career-ops** | クローン済みで onboarded |
| **オプション** | ワンクリック JD 評価のための `.env` の `GEMINI_API_KEY` |
| **オプション** | ロシア国外で実行していて hh.ru API の 403 を減らしたい場合は `.env` の `HH_USER_AGENT` |

## スタックとレベルのチップフィルター

求人テーブルには以下のマルチセレクトチップが含まれます:

- **Stack:** PHP, Symfony, Laravel, Go, Rust, Node.js, TypeScript, Python, Ruby, Java, C#/.NET, C++, Backend, Frontend, Fullstack, Microservices, High-load, Distributed, DevOps/SRE, Data, ML/AI, Mobile, Security, Database, Cloud, API
- **Level:** Lead/Tech Lead, Architect, Manager, Principal/Staff, Senior, Middle, Junior

各カテゴリ内でマルチセレクト (OR)、カテゴリ間で交差 (AND)。カウントが表示され、結果のあるチップのみが表示されます。

## 完全なドキュメント

完全なアーキテクチャ、API リファレンス、高度な設定、セキュリティノートについては、[英語の README](README.md) を参照してください。

## ライセンス

MIT。[santifer](https://santifer.io) による [career-ops](https://github.com/santifer/career-ops) の上に構築。

---

## 🌍 Getting Started — インストール後の最初のステップ

ワンコマンドインストール後、2 つのクローンされたリポジトリとスキャフォールドファイル(`cv.md`、`config/profile.yml`、`portals.yml`、`data/applications.md`、`data/pipeline.md` — **EDIT ME** マーカー入り)があります。Health ページは初回起動で全て緑のはずです。プレースホルダーを実際のデータに置き換えてください:

### 1. CV を作成 (`cv.md`)

- **A — 既存の履歴書を貼り付け:** `career-ops/cv.md` にクリーンな markdown で。
- **B — UI からアップロード:** **CV** クリック → **📁 履歴書をアップロード** → `.md`/`.txt` 選択 → プレビュー確認 → **💾 保存** クリック。
- **C — Claude Code に LinkedIn を渡す:** Claude Code で `/career-ops` 実行、「CV を抽出して cv.md に書いて」と依頼。

### 2. プロフィール (`config/profile.yml`)

プレースホルダーを置換: 名前、メール、場所、LinkedIn、対象役割、**archetypes** (最重要)、給与範囲。

### 3. スキャナー (`portals.yml`)

`title_filter.positive`/`negative` を調整。3 つの board (GitLab、Vercel、Linear) があらかじめ設定。詳細: [`docs/portals-examples.md`](docs/portals-examples.md)。

### 4. (オプション) Gemini API key

```bash
echo "GEMINI_API_KEY=your-key" >> career-ops/.env
```

### 5. 確認して開始

Health → すべて緑。**🌐 すべてのソースを検索** → チップフィルター付きテーブル → URL コピー → **Pipeline** → **Evaluate**。

完全なドキュメント (アーキテクチャ、API、セキュリティ): [英語の README](README.md)。
