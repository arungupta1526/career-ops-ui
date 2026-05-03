# 变更日志

**career-ops-ui** 的所有重要变更。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/),版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。

翻译: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [繁體中文](CHANGELOG.zh-TW.md)

---

## [1.7.2] — 2026-05-04

帮助中心、UI 内应用设置、移动端侧边栏、单一 Scan 按钮、所有 prompt-builder 的"显示结果"快捷方式。

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

基于 QA r5 的 35 次提交的安全加固 + UX + 功能完善。三层安全落地,所有缺失的 CRUD 端点补齐,父项目 bootstrap 完全自动化,UI 新增 **9 个页面** — Activity、重新设计的 Deep Research,以及 7 个分组侧边栏模式 (project / training / followup / batch / outreach / interview-prep / patterns) 覆盖父 `modes/` 的 100%。测试覆盖率从 **73** 增加到 **209**,**24 个测试文件** + **23 步综合 Playwright e2e**。Coverage: **93.5 % 行 / 82.6 % 分支**。

### 🔒 安全

- **`fix(cv): 净化 CV Markdown 以阻止预览中的存储型 XSS` (FIX-C10)** — `PUT /api/cv` 在写入 `cv.md` 之前去除 `<script>`、`<iframe>`、`<object>`、`<embed>`、`<style>`、`<form>`、`<svg>`、`on*=` 处理器以及 `javascript:`/`vbscript:`/`data:text/html` URI。请求体限制 1 MB(超出返回 413)。客户端 `UI.md()` 重写为在任何 markdown 转换 *之前* 转义所有字节,原始 HTML 永远无法到达 `innerHTML`。链接 `href` 通过安全 scheme 白名单 (`http`/`https`/`mailto`/`tel`/相对 + 仅 `data:image`) 校验。新增 17 个测试。
- **`fix(server): CSP + 基线安全头` (FIX-L2)** — 每个响应都携带 `X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy: same-origin`。当服务器绑定到 loopback 之外 (`HOST` ≠ `127.0.0.1`/`::1`/`localhost`) 时,在其上叠加严格的 `Content-Security-Policy`: `default-src 'self'`、`script-src 'self'` (无 `unsafe-inline`)、Google Fonts 加入白名单、`connect-src 'self'` 阻断 XSS 数据外渗。`index.html` 和 `router.js` 的内联 `onclick` 处理器迁移到 `addEventListener`。新增 8 个测试。
- **`fix(api): 加强 pipeline URL 验证器` (FIX-M7)** — `POST /api/pipeline` 曾接受 `"not-a-url"` 并持久化它。现在 `isValidJobUrl()` 拒绝裸字符串、长度 <10 或 >2000、含空白的 URL、非 `http(s)` scheme、loopback 主机名。包含 **FIX-M3** + **FIX-M6**。
- **`fix(api): 在组装 prompt 之前净化 JD` (FIX-M5)** — `POST /api/evaluate` 去除 ANSI 转义、控制字节、内联 `<script>` 标签,trim 空白。50 KB 长度上限。50 字符的最低值在 *净化后的* 文本上检查。
- **`fix(health): HOST!=loopback 时遮蔽 Node 版本 + 项目根` (FIX-M1)** — `/api/health` 不再在 LAN 暴露的部署中泄露主机指纹。

### ✨ 新功能

- **`feat: 7 个新侧边栏模式 + 分组侧边栏` (FIX-C8)** — 100% 覆盖父 `modes/`。新路由: `#/project`、`#/training`、`#/followup`、`#/batch`、`#/contacto`、`#/interview-prep`、`#/patterns`。单一 view 工厂 + 通用端点 `POST /api/mode/:slug`。侧边栏分 6 组。共 18 项。12 个新测试。
- **`fix: 父依赖 + russian_portals 默认值 bootstrap` (FIX-C4 + C9 + C12 + H2)** — `bin/start.sh` 在新克隆上自动安装父 `node_modules` + Playwright Chromium。`createApp()` 在 `russian_portals:` 块缺失时追加。幂等。3 个新测试。
- **`fix: 禁用 9 个死链接 portal slugs` (FIX-C3)** — 9 个 slugs 标记为 `enabled: false`。新 `scripts/portals-health-check.mjs`。3 个新测试。
- **`feat(activity): 用户操作日志 + Activity 侧边栏页面`** — 每个状态变更的 API 请求都被记录到 `data/activity.jsonl`。新侧边栏项 **活动** — 操作前缀 chip 过滤器、✓/✗ 徽章、刷新按钮。5 MB 自动轮转。新增 10 个测试。
- **`feat(deep): 在浏览器中查看 Deep Research + 已保存结果存档`** — Deep Research 页面现在 (a) 当 `{ run: true }` 且设置了 `GEMINI_API_KEY` 时通过 Gemini 实时执行,持久化到 `interview-prep/{slug}.md`;(b) 以带相对时间戳的卡片列出所有已保存的 deep-research 文件;(c) 将结果渲染为 Markdown,每个结果提供 **📋 复制 / ⬇ 下载 .md / ↗ 在新标签打开** 操作。新 REST: `GET /api/interview-prep`、`GET /api/interview-prep/:name`、`DELETE /api/interview-prep/:name`。新增 7 个测试。
- **`feat(cv): 在浏览器中生成 + 下载 PDF + PDF 存档`** — CV 页面新 **📄 生成 PDF** 按钮在模态控制台中流式传输 `/api/stream/pdf`。`ERR_MODULE_NOT_FOUND` / `playwright` 错误时显示可复制粘贴的引导命令。"已生成的 PDF" 部分在每次成功后自动加载,列出所有 `output/*.pdf` 及 **↗ 打开** + **⬇ 下载** 按钮。新 REST: `GET /api/output/pdfs`、`GET /api/output/pdfs/:name`。新增 6 个测试。
- **`feat(api): POST /api/tracker — 从 UI 添加行` (FIX-H8)** — 从浏览器在 `data/applications.md` 中追加规范行。校验 company + role,根据 `templates/states.yml` 规范化状态,自动递增零填充 `#`,按 company+role 不区分大小写去重。新增 6 个测试。
- **`feat(api): DELETE /api/jds/:name` (FIX-H4)** — 无需 shell 即可删除已保存的 JD。path-traversal 净化、必须 `.txt` 后缀。新增 5 个测试。
- **`feat(api): POST /api/evaluate/test-gemini` (FIX-H7)** — 通过 `gemini-eval.mjs` 推送 50 字符的虚拟 JD,以便用户验证 API key 是否生效的 smoke-test 端点。

### 🐛 Bug 修复

- **`fix(router): catch-all 404 视图 + i18n 覆盖率守护` (FIX-C7)** — 未知 hash 路由不再静默回落到 dashboard。显示专门的 404 页面。新 `tests/i18n-coverage.test.mjs` 验证所有 173+ 键 × 8 locales。
- **`fix(router): #/profile → settings 别名` (FIX-C2)** — 两个地址都到达同一视图,侧边栏正确高亮。
- **`fix(health): 统一 Health/Doctor + 标记模板配置` (FIX-C6 + FIX-H6)** — `/api/health` 现在公开 Doctor 报告的全部内容 (parent deps、Playwright、目录、profile-customized、`HH_USER_AGENT`)。
- **`fix(scan): RU 配置的 query↔negative 冲突警告` (FIX-H3)** — 当 `portals.yml` 的 negative 含 `"PHP"` 而查询面向 Senior PHP 时会过滤所有结果。`runRuScan()` 在开始前 emit 警告。
- **`fix(scan): HH_USER_AGENT 未设置时警告` (FIX-H1)** — `/scan` 显示黄色卡片。
- **`fix(api): POST /api/jds slug 净化时警告` (FIX-M2)** — 响应中返回 `warning` 字段。
- **`fix(ui): 路由切换时清空全局搜索 + 按钮加载圈` (FIX-M4 + FIX-L1)** — 新辅助函数 `UI.withSpinner(button, fn)`。
- **`fix(ui): 空 modal-title 占位符` (FIX-H9)** — 移除硬编码英文 `"Title"`。

### 🌐 i18n

- 173+ 翻译键 × 8 locales (`en`、`es`、`pt-BR`、`ko`、`ja`、`ru`、`zh-CN`、`zh-TW`)。所有 locales 添加新键。覆盖率由 `tests/i18n-coverage.test.mjs` 强制。

### ⚙️ DevOps

- **测试数:** 73 → **225**(+152 个测试,25 个文件)。Coverage: 93.5% 行 / 82.6% 分支。
- **综合 Playwright e2e**(`tests/e2e-comprehensive.mjs`,23 步)。
- **GitHub Actions:** `ci.yml`、`ai-review.yml`(Claude Code 审查每个 PR)、`release.yml`。
- **CSP 友好 UI:** 移除所有内联 `onclick`。

### 📦 新 REST 端点

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET`    | `/api/activity`              | 用户活动事件列表 |
| `GET`    | `/api/interview-prep`        | 已保存 Deep Research 列表 |
| `GET`    | `/api/interview-prep/:name`  | 读取单个 Deep Research |
| `DELETE` | `/api/interview-prep/:name`  | 删除 Deep Research |
| `GET`    | `/api/output/pdfs`           | 已生成 PDF 列表 |
| `GET`    | `/api/output/pdfs/:name`     | 下载 PDF (attachment) |
| `POST`   | `/api/tracker`               | 向 `applications.md` 添加行 |
| `DELETE` | `/api/jds/:name`             | 删除已保存 JD |
| `POST`   | `/api/evaluate/test-gemini`  | Gemini API key smoke-test |

---

## [1.6.0] — 2026-05-02

Web UI 首次公开发布。功能清单见 `README.md`。
