# ヘルプ — career-ops-ui

初回起動から面接準備まで、各ページの完全ガイド。各 `##` はサイドバー
項目またはワークフローのフェーズに対応します。最初は上から下へ読み、
後で必要なセクションへヘルプサイドバーの TOC からジャンプしてください。

> **対象:** この UI を `career-ops` チェックアウト内に置き
> `bash bin/start.sh` を実行した方。career-ops の事前知識は不要です。


### career-ops について

[career-ops](https://career-ops.org) は、AI コーディング CLI (Claude Code、Codex、Cursor、Gemini CLI、GitHub Copilot CLI) 内でスラッシュコマンドとして動作するオープンソースの求職システムです。モデル非依存。6 次元 0.0–5.0 ルーブリックで各求人を CV と照合し、カスタマイズされた PDF レジュメを生成し、すべての応募をローカルで追跡します。

**原則** ([career-ops.org/docs](https://career-ops.org/docs)):

- **オープンソース、本気で** — MIT、有料ティアなし、ウェイトリストなし、テレメトリなし、アカウントなし。
- **データ主権** — `cv.md`、`config/profile.yml`、`data/`、`reports/`、`interview-prep/` は明示的にプッシュしない限りマシンを離れません。
- **人間が送信** — career-ops は回答を起草しフォームを開きますが、**Submit はあなたがクリック**します。自動応募はありません。
- **構造化された検索** — 能動的・意図的な求職活動向け、レコメンドエンジンではありません。

**主要概念**

| 概念 | 内容 |
|---|---|
| **Mode** | `modes/<slug>.md` 配下のプロンプトテンプレート。組込: `oferta`、`deep`、`apply`、`pipeline`、`batch`、`contacto`、`followup`、`interview-prep`、`patterns`、`project`、`training`。 |
| **Archetype** | `config/profile.yml` のターゲットロールプロファイル。ルーブリックがアクティブな archetype に対してスキル一致を重み付け — **最も重要なフィールド**。 |
| **Pipeline** | `data/pipeline.md` — 評価待ちの JD URL の inbox。 |
| **Tracker** | `data/applications.md` — すべての評価/応募ステータスの GFM マークダウンテーブル。 |
| **Report** | `reports/<NNN>-<company>-<DATE>.md` — JD ごとの完全な A–G 評価 + score + legitimacy。 |
| **Scan history** | `data/scan-history.tsv` — append-only ログ、スキャン間の重複を防止。 |

### career-ops と career-ops-ui

| | career-ops (CLI) | career-ops-ui (本アプリ) |
|---|---|---|
| 実行場所 | Claude Code / Codex / Cursor / Gemini CLI 内 | ブラウザの `http://127.0.0.1:4317` |
| 表面 | `/career-ops <mode>` スラッシュコマンド | サイドバー、ワークフローごとに 1 ページ |
| フォーム入力 | あり、Playwright MCP 経由 | なし — チェックリスト生成、CLI で完結 |
| PDF | `generate-pdf.mjs` | `📄 Generate PDF` (`#/cv`、`#/reports/:slug`、`#/evaluate`、`#/deep`、`#/interview-prep`) |
| データファイル | career-ops-ui と共有 | career-ops と共有 |

### Score 別アクション閾値

| Score | 次のステップ |
|---|---|
| **≥ 4.5** | `/career-ops apply` — 高フィット、即応募。 |
| **4.0 – 4.4** | 応募、または `/career-ops contacto` (warm intro)。 |
| **3.5 – 3.9** | `/career-ops deep` — 会社/ロールを調査してから決定。 |
| **< 3.5** | 特別な理由がなければスキップ。 |

### 外部ドキュメント

career-ops エンジンの完全リファレンス (スキャン、ルーブリック、batch、apply、Playwright) は [career-ops.org/docs](https://career-ops.org/docs):

- [What is career-ops](https://career-ops.org/docs/introduction/what-is-career-ops)
- [Scan job portals](https://career-ops.org/docs/introduction/guides/scan-job-portals)
- [Apply for a job](https://career-ops.org/docs/introduction/guides/apply-for-a-job)
- [Batch-evaluate offers](https://career-ops.org/docs/introduction/guides/batch-evaluate-offers)
- [Set up Playwright](https://career-ops.org/docs/introduction/guides/set-up-playwright)

---

## 1. クイックスタート — 「CV 作成」から「応募 + メッセージ送信」までステップごとに

ボタン単位の正規プレイブック。初回は順番通りに進めてください。

**A. セットアップ (一度のみ、~5分)**

1. `http://127.0.0.1:4317` を開く (またはルートで `bash bin/start.sh`)。
2. サイドバー **❤ Health** → 必須チェックすべて緑。
3. サイドバー **⚒ App settings** → *API keys & runtime* タブ →
   `ANTHROPIC_API_KEY` および/または `GEMINI_API_KEY` を貼り付け →
   **💾 Save** → **▶ Test Anthropic / Gemini**。
4. 同じページ → *Profile* タブ → `candidate.full_name`、`email`、
   `target.roles`、`target.comp_total_min_usd`、`target.archetypes`
   を編集 → **💾 Save**。

**B. CV (一度のみ、~10分)**

5. サイドバー **✎ CV** — エディタを開く。
6. **📁 Upload CV** で `.docx/.doc/.odt/.rtf/.pdf/.html/.txt/.md`
   をアップロード (サーバが変換 + サニタイズ)、または markdown を
   直接貼り付け。
7. **💾 Save** (右上) — トースト「Saved」。
8. (任意) **📄 Generate PDF** — 完了時に最新 PDF を自動ダウンロード。

**C. 求人を探す (スキャンあたり ~2分)**

9. サイドバー **🌐 Scan** → **🌐 Scan now** → 実時間 SSE ログ。
10. 会社タグクリックでフィルタ; ↗ で採用ページを開く。

**D. 採点 (JD あたり ~30秒)**

11. サイドバー **Pipeline** — 項目クリックで JD プレビュー。
12. JD 横の **▶ Evaluate** → モデルが 0–5 採点 →
    `reports/<日付>-<slug>.md`。
13. サイドバー **Reports** — レポートを確認; pursue =
    ショートリスト。

**E. 決定 + 深掘りリサーチ (~3分)**

14. サイドバー **Deep research** → 会社名 + 職種 → 7 セクションの
    ブリーフ → `interview-prep/<会社>-<職種>.md`。

**F. 応募 (応募あたり ~5分)**

15. サイドバー **Apply checklist** → URL + JD → チェックリスト
    (カバーレター、キーワード、添付、**自動送信は絶対禁止**)。
16. 採用ページを新タブで開き手動送信 (8 で生成した PDF を添付)。
17. サイドバー **Outreach** (`#/contacto`) → 14 のブリーフから
    LinkedIn / メール → カスタマイズして送信。

**G. トラッキング + フォローアップ (継続的)**

18. サイドバー **Tracker** → 行追加: 会社、役職、スコア、ステータス
    `Applied`、レポート + ブリーフへのリンク。
19. 1 週間後: **Follow-up** モード → チェックイン →
    Tracker `Followed up`。
20. 面接招待: **Interview prep** モード → システムデザイン /
    行動面接 / コーディングのターゲット準備。
21. オファー: Tracker を `Offer` に更新 + レポートの comp
    セクション再確認。

**TL;DR — サイドバー順 = ワークフロー順:**
Health → App settings → Profile → CV → Scan → Pipeline → Evaluate
→ Reports → Deep research → Apply checklist → Outreach → Tracker
→ Follow-up → Interview prep → Activity log。

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


### CLI フロー ([career-ops.org/docs/.../scan-job-portals](https://career-ops.org/docs/introduction/guides/scan-job-portals))

career-ops 標準セットアップ(親ディレクトリで一度実行):

```bash
cp templates/portals.example.yml portals.yml
$EDITOR portals.yml
```

`portals.yml` には 3 つのセクションがあり、career-ops.org の正規スキーマは上記の SPA の 3 セクションと 1:1 で一致します:

- **title_filter** — `positive`、`negative`、`seniority_boost` キーワードリスト(case-insensitive)。求人は `positive` マッチ ≥ 1 件かつ `negative` マッチ 0 件が必要。`seniority_boost` はフィルタせずランクのみ上昇。
- **tracked_companies** — 各エントリは `name` と `careers_url` 必須。任意: `api`(Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday エンドポイント)、`enabled: true|false`。
- **search_queries** — 事前構築されたより広範な Web 検索。デフォルトでほぼ十分。

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


### CLI スキャンフロー ([career-ops.org/docs/.../scan-job-portals](https://career-ops.org/docs/introduction/guides/scan-job-portals))

CLI からスキャンする 2 つの方法(両方とも SPA が読む同じ `data/pipeline.md` に書き込み):

**Option A — 直接スクリプト(~30 秒、AI トークン 0):**

```bash
npm run scan
npm run scan -- --dry-run
npm run scan -- --company Anthropic
```

Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday のみ動作(認識可能な ATS URL)。

**Option B — AI ブラウザスキャン:** Claude Code / Codex / Cursor / Gemini CLI で `/career-ops scan`。モデルトークン使用。`tracked_companies` の各ページを直接訪問し、非 API ボードも発見可能。

**Output(両方)** — 新 JD URL が `data/pipeline.md` に追加、訪問した URL が `data/scan-history.tsv` に記録(将来のすべてのスキャン間で dedup)。

**Score 別アクション閾値:**

| Score | 次のステップ |
|---|---|
| **≥ 4.5** | `/career-ops apply` — 高フィット |
| **4.0 – 4.4** | 応募または `/career-ops contacto` |
| **3.5 – 3.9** | `/career-ops deep` — 先に調査 |
| **< 3.5** | 特別な理由がなければスキップ |

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


### 完全な CLI apply フロー ([career-ops.org/docs/.../apply-for-a-job](https://career-ops.org/docs/introduction/guides/apply-for-a-job))

前提条件: 先に `/career-ops pipeline`(JD に evaluation report が必要); Playwright インストール(`npx playwright install chromium`)推奨; なければ WebFetch にフォールバック。

番号付きフロー:

1. **コマンド実行** `/career-ops apply <company>` (例: `/career-ops apply Anthropic`)。引数なしの場合は次のターンでフォームのスクリーンショット/テキスト/URL を提供。
2. **Playwright がブラウザを自動オープン**しフォームを読み取り。ユーザーはブラウザを開かない。
3. **下書きの回答** フォームフィールド順の番号付きリストとして返却。レポートの proof points と STAR stories から取得。
4. **フラグ付き項目** — salary anchor、欠落 CV フィールド、オプション質問など人間レビュー必要。
5. **各回答をレビュー**、フォーム入力、**Submit は本人がクリック**。career-ops は決して Submit を押さない。
6. **送信確認** チャットで: `Submitted.`
7. **自動更新** — `data/applications.md` で `Evaluated → Applied` に遷移。
8. **Tracker へハンドオフ:** `/career-ops tracker`。

### Batch evaluate ([career-ops.org/docs/.../batch-evaluate-offers](https://career-ops.org/docs/introduction/guides/batch-evaluate-offers))

10 件以上の JD を一度に(SPA の 1 件ずつの `#/evaluate` は非実用的):

1. `batch/batch-input.tsv` をタブ区切り列 `id | url | source | notes` で編集。
2. Dry-run: `./batch/batch-runner.sh --dry-run`。
3. 実行:

   ```bash
   ./batch/batch-runner.sh
   ./batch/batch-runner.sh --parallel 2
   ./batch/batch-runner.sh --parallel 3 --min-score 4.0
   ```

4. リトライ: `./batch/batch-runner.sh --retry-failed --max-retries 3`。
5. **Reports** が `reports/` に(形式 `NNN-company-YYYY-MM-DD.md`); サマリは `batch/tracker-additions/`。
6. マージ: `node merge-tracker.mjs`(または `--dry-run`)。

SPA は結果レポートを `#/reports` に、トラッカー行を `#/tracker` に表示。

### Playwright セットアップ ([career-ops.org/docs/.../set-up-playwright](https://career-ops.org/docs/introduction/guides/set-up-playwright))

```bash
npm install
npx playwright install chromium
claude mcp add playwright npx @playwright/mcp@latest
npm run doctor
```

MCP の代替登録は `.claude/settings.local.json`:

```json
{ "mcpServers": { "playwright": { "command": "npx", "args": ["-y", "@playwright/mcp@latest"] } } }
```

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
