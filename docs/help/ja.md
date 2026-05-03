# ヘルプ — career-ops-ui

各ページのステップバイステップガイド。名前は左サイドバーメニューと一致します。

---

## 1. クイックスタート

5 分でフルサイクル:

1. **CV** (`#/cv`) — Markdown で履歴書を貼り付けまたはアップロード。**💾 保存** をクリック。
2. **プロフィール** (`#/settings`) — `config/profile.yml` を編集: 名前、メール、目標給与、所在地。
3. **Health** (`#/health`) — すべての必須カードが緑であることを確認。オプション (Gemini / Anthropic / HH_USER_AGENT) は対応機能を使う場合のみ。
4. **Scan** (`#/scan`) — **🌐 Scan all** で有効な全求人サイトをクロール。または Ctrl+K → Enter で 1 つの URL を貼り付け。
5. **Pipeline** (`#/pipeline`) — スキャナーがキューに入れたものをレビュー。URL をクリック → 右にプレビュー。**▶ Evaluate** で CV に対して採点。
6. **Tracker** (`#/tracker`) — すべての評価がここに着地。スコア、ステータス、テキストでフィルタ。カスタム PDF 生成、応募、ステータス更新。

---

## 2. CV (`#/cv`)

すべての評価の真実のソース。ボタン: **📁 Upload CV**、**sync-check**、**📄 Generate PDF**、**💾 保存**。右側にライブプレビュー。

## 3. プロフィール (`#/settings`、`#/profile` も可)

パース済みの `config/profile.yml` を表示。ディスク上で直接編集; リロードで変更反映。Health ページの **Profile customized** チェックが `Jane Smith` 等のテンプレ値をフラグ。

## 4. Scan (`#/scan`)

求人サイトクローラー。**🌐 Scan** runs everything (`HH_USER_AGENT` 必要)。テキスト、リモート/ハイブリッド/移住、ソース、技術/レベルチップフィルタ。

## 5. Pipeline (`#/pipeline`)

URL インボックス。input + **+ Add** または Ctrl+K で追加。URL クリック → 右にサーバーサイドプレビュー。行アクション: **▶** Evaluate、**✕** Delete。ライブフィルタ + カウンター。

## 6. Evaluate (`#/evaluate`)

JD を `cv.md` + `profile.yml` に対して採点。API キーなし → Claude Code 用のマニュアルプロンプト;`ANTHROPIC_API_KEY`/`GEMINI_API_KEY` 設定 → サーバーサイド実行と Markdown レンダリング。**💾 Save JD** で `jds/*.txt` にアーカイブ。

## 7. Deep research (`#/deep`)

会社ブリーフィング: チーム、文化、ニュース、交渉のレバレッジ、スマート質問。**⚡ Run live** で実行 + `interview-prep/{slug}.md` に保存。**▶ Generate prompt** でマニュアルプロンプト;**結果を表示** でキー設定後に再実行。

## 8. Apply checklist (`#/apply`)

貼り付け可能なチェックリスト。実際のフォーム入力は Claude Code のみ: `/career-ops apply <url>`。

## 9. Tracker (`#/tracker`)

応募レジスタ — `data/applications.md`。ステータス / スコア帯 / テキストでフィルタ。ボタン: **Normalize**、**Dedup**、**Merge TSV**。

## 10. Reports (`#/reports`)

`reports/` 配下の全 A-G レポート。クリックで Markdown レンダリング (XSS-safe)。

## 11. Modes (`#/project`、`#/training`、`#/followup`、`#/batch`、`#/contacto`、`#/interview-prep`、`#/patterns`)

7 つの専門プロンプトビルダー。同じ UX: フォーム入力 → **▶ Generate prompt** または **⚡ Run live** (キーあり) → Markdown / 📋 Copy / ⬇ Download。

| モード | 生成するもの |
|---|---|
| **Project** | ポートフォリオアイデアの scope + signal-fit フィードバック。 |
| **Training** | コース/資格が時間の価値があるか判断。 |
| **Follow-up** | 応募ごとのケイデンス: いつ突くか、何を言うか。 |
| **Batch** | `batch/run.mjs` 用プロンプト — 並列評価。 |
| **Outreach** | LinkedIn アウトリーチ: 適切なコンタクト + メッセージ作成。 |
| **Interview prep** | 面接ステージ別の準備。 |
| **Patterns** | 過去の応募の繰り返しの弱点パターン。 |

## 12. Activity (`#/activity`)

すべての state-changing API 呼び出しの監査ログ。`data/activity.jsonl`。アクション prefix チップフィルタ。5 MB で自動ローテーション。

## 13. Health (`#/health`)

セットアップ診断。緑 = 準備完了、黄 = オプション欠落、赤 = 必須欠落。**Doctor** + **Verify** ボタン。

## 14. 設定のヒント

- **`.env`** — `.env.example` からコピー。`ANTHROPIC_API_KEY`/`GEMINI_API_KEY` でライブ実行。`HH_USER_AGENT` で hh.ru。
- **言語切替** サイドバーフッター — 8 ロケール、localStorage に保存。
- **Ctrl+K** でグローバル検索フォーカス。URL → Enter → pipeline。テキスト → Enter → tracker。
- **Esc** で開いているモーダルを閉じる。
