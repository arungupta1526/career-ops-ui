# ヘルプ — career-ops-ui

初回起動から面接準備まで、各ページの完全ガイド。各 `##` はサイドバー
項目またはワークフローのフェーズに対応します。最初は上から下へ読み、
後で必要なセクションへヘルプサイドバーの TOC からジャンプしてください。

> **対象:** この UI を `career-ops` チェックアウト内に置き
> `bash bin/start.sh` を実行した方。career-ops の事前知識は不要です。

---

## 1. クイックスタート (5 分でゼロから)

ループ全体:

1. **Health** (`#/health`) — すべての必須チェックが緑であることを
   確認。`cv.md`、`config/profile.yml`、`portals.yml` が無い場合、
   ページがどのファイルを作るべきか正確に教えます。
2. **App settings** (`#/config`) — `ANTHROPIC_API_KEY` と
   (オプション) `GEMINI_API_KEY` を貼り付け、**Save** をクリック。
   キーは親プロジェクトの `.env` に書き込まれ、career-ops スクリプト
   も同じ値を読みます。
3. **Profile** (`#/profile`) — `config/profile.yml` を確認し、
   テンプレート名 (`Jane Smith`) を本名に置き換えます。
4. **CV** (`#/cv`) — 履歴書を貼り付けまたはアップロード。**💾 Save**
   をクリック — サーバ側のサニタイザが `<script>`、`javascript:`
   URL、`on*=` ハンドラを書き込み前に削除します。
5. **Scan** (`#/scan`) — **🌐 Scan** で有効なすべてのソースを
   一括スキャン (Greenhouse / Ashby / Lever、hh.ru / Habr Career)。
6. **Pipeline** (`#/pipeline`) — スキャナがキューに入れた URL を
   レビュー。クリックで右に JD プレビュー。
7. **Evaluate** (`#/evaluate`) — JD を貼り付け (または pipeline
   から **▶ Evaluate**)。Anthropic / Gemini キーがあれば 0–5 で採点
   され `reports/` に保存。
8. **Tracker** (`#/tracker`) — すべての評価が一行になります。
9. **Apply checklist** (`#/apply`) — 提出チェックリスト生成。
10. **Deep research** (`#/deep`) — 応募を決めたら会社ブリーフを実行。
    `interview-prep/` に保存。

---

## 2. アプリ設定と API キー (`#/config`)

タブが 2 つ:**API keys & runtime** は親プロジェクトの `.env` を
ブラウザから編集 (career-ops Node スクリプトが起動時に読む同じファイル)。
**Profile** は `config/profile.yml` の直接 YAML エディタで、正規
ヘッダ `# Career-Ops Profile Configuration` を自動付与し、`candidate`
キーの存在を検証します。どちらのタブの保存も再起動なしで即時反映。

### 認識されるキー

| キー | 役割 | 取得先 |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic SDK ライブ呼び出しを有効化。両キーがあると優先。 | <https://console.anthropic.com/settings/keys> |
| `ANTHROPIC_MODEL` | デフォルト `claude-sonnet-4-6` を上書き。 | — |
| `GEMINI_API_KEY` | Anthropic 無しのフォールバック。`gemini-eval.mjs` で `oferta` mode に使用。 | <https://aistudio.google.com/apikey> |
| `GEMINI_MODEL` | Gemini モデルを上書き。 | — |
| `HH_USER_AGENT` | ロシア外から `hh.ru` をスキャンする時に必要。 | dev.hh.ru |
| `PORT` | Express ポート。デフォルト 4317。 | — |
| `HOST` | バインド。`0.0.0.0` は LAN 公開 — **auth gate なし**。 | — |

### 動作

- **読み取り** (`GET /api/config`) — シークレットキーは
  マスク (`sk-ant•••••a1b2`)。
- **保存** (`POST /api/config`) — 検証 → `.env` 書き込み → 即時
  `process.env` 適用。再起動不要。
- **空値はキーを削除**。

### Smoke-test ボタン

保存後 **▶ Test Anthropic** / **▶ Test Gemini** — 小さなプロンプト
(≤256 トークン) でキーが動くことを確認。~200 文字サンプル返却。

---

## 3. Profile (`#/profile` — `#/settings` でもアクセス可)

`config/profile.yml` の read-only ビュー。ディスク上で直接編集;
ページは reload で再パース。

主要フィールド:

- `candidate.full_name` — すべてのプロンプトで使用。**実際のスキャン
  前に `Jane Smith` を実名に置き換え**。
- `candidate.email`、`linkedin`、`github` — cover letter と apply
  checklist で参照。
- `target.roles` — 受け入れる職種。
- `target.comp_total_min_usd` — 最低総報酬。各評価のセクション D が
  これより下のオファーをフラグ。
- `target.archetypes` — *最も重要なフィールド*。各 JD がこれに対し
  マッチされ、最良のアーキタイプがレポートヘッダに入ります。

Health は `full_name` が既知のプレースホルダの間 **Profile
customized** チェックを出します。

---

## 4. CV (`#/cv`)

すべての評価、deep research、cover letter の真実の源。親ルートの
`cv.md` に保存。

### 編集オプション

- **直接貼り付け** — 左の textarea は markdown エディタ。
- **📁 Upload CV** — `.md/.markdown/.txt/.html/.htm`(テキスト)、
  `.docx/.doc/.odt/.rtf`(pandoc 経由 — `brew install pandoc`)、
  `.pdf`(pdftotext 経由 — `brew install poppler`)。サーバが
  markdown に変換・サニタイズしてエディタへロード。**💾 Save** で
  永続化。アップロード上限: 10 MB。
- **LinkedIn から** — 親で Claude Code を開き `/career-ops` 実行、
  LinkedIn URL を貼り付け、`extract my CV from this and write it to
  cv.md` と要求。

### サニタイズ

`stripDangerousMarkdown` が `<script>`、`<iframe>`、`<object>`、
`<embed>`、`<svg>`、`<style>`、`<form>`、インラインハンドラ
(`onclick=`)、URI `javascript:`/`vbscript:`/`data:text/html` を削除。
何かが削除された場合、レスポンスに `sanitized: true`。最大 1 MB。

### 他のボタン

- **sync-check** — `cv-sync-check.mjs`。
- **📄 Generate PDF** — `generate-pdf.mjs` → `output/*.pdf`。
  Playwright が必要。

### フォーマットのコツ

- 1 つの bullet = メトリック付きの 1 つの成果。
- セクション順: **Summary**、**Experience**、**Projects**、
  **Education**、**Skills**。
- 1500 単語未満を維持。

---

## 5. ポータルとソース (`portals.yml`)

スキャナの設定。3 つのセクションが重要:

### `title_filter`

```yaml
title_filter:
  positive: [backend, engineer, senior, tech lead, golang, php]
  negative: [junior, intern, frontend, ios, android, java]
```

vacancy はそのタイトルが **少なくとも 1 つの positive** を含み、
**negative は 1 つも含まない** 場合にパス。

### `tracked_companies`

```yaml
tracked_companies:
  - { name: Stripe,    enabled: true, careers_url: https://job-boards.greenhouse.io/stripe }
  - { name: Linear,    enabled: true, careers_url: https://jobs.ashbyhq.com/linear }
  - { name: JetBrains, enabled: true, careers_url: https://jobs.lever.co/jetbrains }
```

EN スキャナは URL パターンから ATS を検出し、各社の公開 boards-api
を直接叩きます。

### `russian_portals`

```yaml
russian_portals:
  sources: [hh, habr]
  area: 113                 # 113=ロシア、1001=リモート
  per_page: 50
  only_remote: false
  queries:
    - "Senior PHP"
    - "Senior Go"
```

`queries` と negative リストの重複に注意 — コンソールが警告します。

### Bootstrap

初回起動時、サーバは `russian_portals:` ブロックが無い場合
ドキュメント化されたデフォルトを追加 (idempotent)。

---

## 6. Health (`#/health`)

すべての setup ゲートが OK / OPTIONAL / FAIL バッジで表示。

### 必須 (これなしではシステムが機能しない)

`Node version` ≥ 18、`Project root`、`cv.md`、
`config/profile.yml`、`portals.yml`、`data/applications.md`、
`data/pipeline.md`、`modes/oferta.md`。

### オプション (警告のみ)

`Profile customized`、`GEMINI_API_KEY`、`ANTHROPIC_API_KEY`、
`HH_USER_AGENT`、Playwright、親 deps、ディレクトリ。

`HOST=0.0.0.0` の時、絶対パスと正確な Node バージョンは隠されます。

### 実行ボタン

- **▶ Doctor** — `node doctor.mjs`。
- **▶ Verify pipeline** — `node verify-pipeline.mjs`。

---

## 7. Scan (`#/scan`)

スキャナが有効な boards をクロールし、履歴に対し dedup し、ヒットを
`data/last-scan.json` と `data/pipeline.md` に書き込みます。

### ワンクリックスキャン

**🌐 Scan** が一回のスイープでサーバを実行 (Greenhouse、Ashby、
Lever、hh.ru、Habr Career)。ライブ SSE ログが右に流れます。**Stop**
またはナビゲーション離脱で中止。

### 結果フィルタ

- フリーテキスト。
- Source ドロップダウン。
- Remote / Hybrid / Onsite。
- Stack chips (PHP、Go、Backend、Senior) — 自動検出。
- 動的 chips: タイトルの最頻出 capitalized トークン top-25。

### Active Companies

折り畳み可能カード:

- ✓ 緑 — 直接 API サポート。
- ○ グレー — web 検索フォールバック。

**名前クリック** → 上の結果フィルタを記入。**↗ クリック** → 新しい
タブで `careers_url`。

---

## 8. Pipeline (`#/pipeline`)

評価待ち URL の inbox。`data/pipeline.md` に保存。

### URL の追加

3 つの方法:

- 入力または貼り付け + **+ Add**。
- **Ctrl+K** / **Cmd+K** → グローバル検索にフォーカス → URL 貼り付
  け → Enter。
- Scan を実行 → 新しいヒットが自動的に pipeline へ。

各 URL はサーバ側で `isValidJobUrl()` を通ります。Loopback、
`file://`、`javascript:`、IP リテラル、テンプレート文字 — すべて
400。

### サーバサイドプレビュー

行をクリックすると右にプレビュー。サーバがプロキシし、
`<script>`/`<style>`/タグを削除し、最大 8 KB の平文を返します。

プレビュープロキシは **ホップごとの SSRF 検証** で手動でリダイレクト
を辿ります。3 ホップ上限、15 秒タイムアウト。

### 行アクション

- **▶** — `#/evaluate?url=…` へ。
- **✕** — pipeline から削除。

### 上部ボタン

- **⚡ Evaluate first** — Evaluate ページで最初の URL を開きます。
- **Scan** — スキャナへ戻る。

---

## 9. Evaluate (`#/evaluate`)

JD を `cv.md` と `config/profile.yml` に対しスコア化。`modes/oferta.md`
に従った A–G 評価 + 0–5 スコア。

### 入力

JD を textarea に貼り付け、または `#/pipeline` から `?url=…` で到達。

**💾 Save JD** で `jds/jd-<date>-<ts>.txt` に永続化。

### Fallback チェーン

1. **Anthropic** — `ANTHROPIC_API_KEY` がセットされている時、優先。
   `bundleProjectContext` が cv + profile + `_shared.md` +
   `oferta.md` を `<project_context>` ブロックにインライン。各
   ファイル 16 KB cap、プロンプト soft-cap 200 KB。
2. **Gemini** — `GEMINI_API_KEY` のみの時。`gemini-eval.mjs` を
   spawn。
3. **Manual** — キーなし。ページがコピー用 prompt を返します。

### 出力

A. Role Summary · B. CV Match · C. Risks · D. Compensation · E.
Application Strategy · F. Verdict (0.1 精度で 0–5) · G. Posting
Legitimacy。

**💾 Save report** で markdown を
`reports/<date>-<company>-<role>.md` に永続化。

---

## 10. Reports (`#/reports`)

すべての保存された評価を閲覧。カードはタイトル、日付、legitimacy
フラグ、スコア (緑 ≥ 4.0、黄 ≥ 3.0、赤 それ以下) を表示。
ページごと 12 件。

単一レポートビュー: **← All reports**、**🔗 Open JD**。

---

## 11. Tracker (`#/tracker`)

CRM。1 行 = 1 応募。`data/applications.md` に GFM テーブルとして保存。

### ステータスフロー

`Evaluated` → `Applied` → `Responded` → `Interview` → `Offer` /
`Rejected` / `Discarded` / `SKIP`。ホワイトリストはサーバで強制。

### カラム

| カラム | 内容 |
|---|---|
| `#` | 自動採番。 |
| `Date` | ISO。 |
| `Company` | フリーテキスト。**パイプと改行は自動エスケープ。** |
| `Role` | 同上。 |
| `Score` | `N/5`。 |
| `Status` | ホワイトリスト。 |
| `PDF` | 成功すると ✅。 |
| `Report` | `reports/*.md` へのリンク。 |
| `Notes` | フリーテキスト、最大 200 文字。 |

### フィルタ

Status、Score (`≥ 4.0`/`≥ 3.0`/`< 3.0`)、Search。ページごと 25 行。

### メンテナンス

- **▶ Normalize** / **▶ Dedup** / **▶ Merge**。

---

## 12. Deep research (`#/deep`)

構造化された会社ブリーフを生成: snapshot、エンジニアリング文化、
最近のニュース、Glassdoor センチメント、面接プロセス、交渉レバレッジ
ポイント、リクルーターに尋ねる 3 つのスマートな質問。

### 入力

会社名 + (オプション) 役割。`modes/deep.md` テンプレートが構造を決定。

### 出力経路

Evaluate と同じフォールバックチェーン:

1. **Anthropic ライブ** (優先) — `bundleProjectContext` が cv +
   profile + `_shared.md` + `deep.md` をインライン。10–30 KB の
   grounded markdown が `interview-prep/<company>-<role>.md` に保存。
2. **Gemini ライブ** — `gemini-eval.mjs`。同じ保存先。
3. **Manual prompt** — Claude Code 用の prompt (WebFetch +
   WebSearch で実際のリサーチ)。

### Tips

- Anthropic `claude-sonnet-4-6` は通常 1–3 分で ~13 KB を返却。
- Anthropic SDK にビルトイン web search はありません。新しいニュース
  には Claude Code 経由で manual prompt を使ってください。
- ライブ実行は有料; 1 回の Sonnet 4.6 deep-research call ≈
  $0.30–0.50。

---

## 13. Mode prompts (7 つの `/#/<mode>` ページ)

7 つのプロンプトビルダー: **Project** アイデア、**Training**
プラン、**Follow-up** メール、**Batch** 評価、**Outreach**
リクルーターへ、**Interview prep** one-pager、**Patterns** 振り返り。
それぞれ `modes/<slug>.md` テンプレートをラップ:

| ページ | Slug | 目的 |
|---|---|---|
| `#/project` | `project` | ターゲット役割向けに portfolio プロジェクトを調整。 |
| `#/training` | `training` | スキルギャップ分析 → カリキュラム。 |
| `#/followup` | `followup` | 面接後メールのドラフト。 |
| `#/batch` | `batch` | マルチ JD バッチ評価 prompt。 |
| `#/contacto` | `contacto` | リクルーター / 紹介への outreach メッセージ。 |
| `#/interview-prep` | `interview-prep` | 特定ラウンドの one-pager prep。 |
| `#/patterns` | `patterns` | 「どのパターンが私を成功させたか?」 |

### 共通の形

各ページ: 小さなフォーム + **▶ Generate prompt** (manual) +
**⚡ Run live** (キーがある時 primary)。

**▶ Generate prompt** → ユーザフォーム値を JSON 化し
`User-supplied context:` ブロックに入れた組み立て prompt を返却。

**⚡ Run live** → 同じ prompt を Anthropic (または Gemini) へ送信、
cv + profile + `_shared.md` を `bundleProjectContext` でインライン。
結果はページに表示、コピー可、`.md` でダウンロード可。

---

## 14. Apply checklist (`#/apply`)

応募を決めたら、Apply helper ページが提出チェックリストを生成します。
フォームを **自動入力しません** — その流れは親の Playwright を使う
Claude Code の `/career-ops apply` に残ります。

チェックリストは:

0. Claude Code で `/career-ops apply <url>` を実行。
1. 投稿がまだアクティブか確認 (`check-liveness.mjs`)。
2. CV が最新か確認 (`cv-sync-check.mjs`、score ≥ 4.0 なら PDF)。
3. cover letter / 「Why us?」を `cv.md` の STAR+R proof point で
   調整。
4. EEO / スポンサーシップ / 開始日の質問に正直に答える。
5. 入力済み回答を `interview-prep/{company}-{role}.md` に保存して
   から提出。
6. **絶対に自動提出しない** — 人間 (あなた) が最終ボタンをクリック。
7. 提出後: `data/applications.md` に行を追加。

---

## 15. 面接準備

post-research、pre-interview フェーズ。このアプリの 3 つの成果物が
集まります:

1. **保存された deep-research ファイル** — `interview-prep/`、
   company-role ペアごとに 1 つ。Deep research ページから検索。
2. **Patterns mode** (`#/patterns`) — 「私の最近の N 回の面接 / オフ
   ァー / 拒否を通じて、どのパターンが続いているか?」5+ tracker 行
   が蓄積されたら有用。
3. **Interview-prep mode** (`#/interview-prep`) — 特定の今度のラウン
   ド (behavioral、technical、system design) のために one-pager を
   事前入力。出力は同じ `interview-prep/` フォルダへ。

### 推奨ワークフロー

各面接で:

1. 前日に **Deep を再実行** (または保存ファイルを開く)。
2. **`#/interview-prep`** — 特定ラウンドの one-pager を生成。
   メモに貼り付け。
3. **System design / coding ラウンド** — `#/training` を開き JD が
   強調する特定サブシステムの 30 分ターゲットリフレッシャー。
4. **Compensation ラウンド** — deep-research ファイルを開き
   「Negotiation leverage points」へジャンプ。2–3 の具体的な data
   point を持参 (Glassdoor band、最近の funding、別社の比較可能な
   オファー)。
5. **Behavioral ラウンド** — オリジナル Evaluate レポートのセクション
   B に着地する STAR+R ストーリーを `cv.md` から引き出します。

面接直後すぐ:

1. tracker 行を更新: status → `Responded` (その後 `Interview`、
   `Offer` など)。
2. `#/followup` を実行して thank-you メールをドラフト。
3. 新しい intel (compensation range、チーム構成、tech stack の意外
   さ) を得たら、保存された `interview-prep/<company>-<role>.md`
   に `## Post-round notes` を編集。

---

## 16. Activity ログ + トラブルシューティング

### Activity ログ (`#/activity`)

サーバに到達するすべての state-changing リクエストの監査ログ。
シークレット (`ANTHROPIC_API_KEY`、`GEMINI_API_KEY`) は入力時に
編集 — `data/activity.jsonl` で実際のキー値を見ることはありません。

action prefix でフィルタ (`pipeline.`、`cv.`、`evaluate`、`scan.`)。
ページごと 25 行; サーバは最新 500 イベントまで返却。

### トラブルシューティング

| 症状 | 考えられる原因 | 修正 |
|---|---|---|
| Health が `cv.md` で赤 | 初回実行、ファイル未存在 | `touch $CAREER_OPS_ROOT/cv.md` + refresh。 |
| Health が `Profile customized` で赤 | `full_name` がまだ `Jane Smith` | `config/profile.yml` を編集。 |
| `hh.ru: HTTP 403` | 非ロシア IP、`HH_USER_AGENT` なし | `dev.hh.ru/admin` で登録、`HH_USER_AGENT` 設定。 |
| `gemini-eval.mjs: ERR_MODULE_NOT_FOUND` | 親の deps 未インストール | `cd $CAREER_OPS_ROOT && npm install`。 |
| Generate PDF エラー | Playwright 未インストール | `npx playwright install chromium`。 |
| サーバ `EADDRINUSE: 4317` | 古いインスタンス実行中 | `pkill -f 'node server/index.mjs'`。 |
| ライブ LLM 呼び出しが 2 分以上ハング | プロンプト巨大または Anthropic 遅い | soft-cap 200 KB → 413。 |
| Pipeline preview が `(unsafe redirect)` | 投稿がプライベート IP / loopback にリダイレクト | セキュリティ機能 (REVIEW-B1)。 |
| Tracker 行がテーブルを壊す | v1.9.1 以前のパイプ | v1.9.1+ にアップデート (BF-1)。 |
| `npm test` がフレッシュクローンで失敗 | テストが親レイアウトを仮定 | `CAREER_OPS_ROOT=$(mktemp -d)`。 |

詳細診断: Health で **▶ Doctor** を実行、出力をコピーし、
<https://github.com/Fighter90/career-ops-ui/issues> で issue を検索。
