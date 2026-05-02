# career-ops-ui

> [career-ops](https://github.com/santifer/career-ops) AI 求人検索パイプラインのための Airbnb スタイルの Web インターフェース。
> Claude Code、ターミナル、Markdown ファイルの間を行き来する代わりに — 単一のブラウザタブから、すべてのオファーを検索、評価、ディープダイブ、応募、追跡できます。

[English](README.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko-KR.md) | **日本語** | [Русский](README.ru.md) | [简体中文](README.cn.md) | [繁體中文](README.zh-TW.md)

[![tests](https://img.shields.io/badge/tests-87%20passed-brightgreen)](README.md#tests)
[![node](https://img.shields.io/badge/node-%E2%89%A518-blue)](README.md#requirements)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

![career-ops-ui — vacancy search](./screen_vacancy_found.png)

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
| **Scan**         | **2 つのスキャナー:** 🌍 EN scan (Greenhouse/Ashby/Lever、24+ 検証済み board) + 🇷🇺 RU scan (hh.ru API + Habr Career HTML スクレイピング)。ライブ SSE ログ + stack/level チップフィルターと location / Remote-Hybrid / reloc / source フィルター付きの結果テーブル。 |
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
