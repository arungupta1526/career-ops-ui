# 变更日志

**career-ops-ui** 的所有重要变更。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/),版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。

翻译: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [繁體中文](CHANGELOG.zh-TW.md)

---

## [1.10.2] — 2026-05-12

功能回归补丁。修复 v1.10.1 手动验证中发现的两个 bug;扩展文档面。

### 🐛 修复

- **`fix(cv): /api/cv/import 用 415 拒绝 multipart/form-data`** — 默认发送 `multipart/form-data` 的外部客户端以前会把 wire envelope 写入 `cv.md`。现在 415 加提示。SPA 路径(octet-stream + X-Filename)不受影响。
- **`fix(pdf): /api/stream/pdf 用正确的位置参数调用 generate-pdf.mjs`** — 以前用 `[]` 调用,脚本打印 `Usage:` 并以代码 1 退出,不生成 PDF。现在路由把 `cv.md` 渲染为 HTML,写入 `output/cv-input-<TIMESTAMP>.html`,然后用 `<input.html> <output.pdf> --format=a4` 启动脚本。

### 🧪 测试

- 新增 `tests/cv-upload-multipart-reject.test.mjs`(5 用例),新增 `tests/pdf-stream-args.test.mjs`(3 用例)。**单元测试 340 个**(原 318)。覆盖率 94.63 % 行 / 84.94 % 分支。

### 📝 文档

- 新增 `docs/test-scenarios/` — 21 个英文场景文件。
- 新增 `docs/reviews/REVIEW-2026-05-12-v1.10.2.md`。
- 完整文本见 [CHANGELOG.md](CHANGELOG.md#1102--2026-05-12)。

---

## [1.10.1] — 2026-05-09

基于 v1.10.0 QA 回归结果的关键修复补丁 (`qa/reports/00-FINAL-SUMMARY.md`)。

### 🛡️ 安全

- **`fix(security): SSRF 攻击面收紧 + DNS 重绑定防御 (PR-3 / F-003)`** — `isValidJobUrl` 现拒绝 RFC1918、整个 127/8 回环、链路本地 `169.254/16`（含 AWS IMDS）、`0.0.0.0`、CGNAT `100.64/10`、IPv6 ULA / 链路本地。新增辅助函数 `isPrivateOrLoopbackHost()`。预览代理在每一跳进行 `dns.lookup`,地址落入私有范围即阻断 — 防御 DNS 重绑定。

### 🐛 修复

- **`fix(activity)`**: 仅记录成功的状态变更 (PR-5 / F-005);4xx 拒绝的请求不再写日志。新增 `profile.save`、`config.save`、`cv.import` 事件 (F-008)。
- **`fix(help)`**: 添加 `ko` → `ko-KR.md` 别名,使韩语正文不再回退到英文 (F-002)。
- **`fix(llm): /api/evaluate 尊重 mode:'manual'`** — 与 `/api/deep` 行为一致,不消耗 Anthropic 额度 (F-009)。
- **`fix(api): DELETE /api/pipeline`** 同时接受 `?url=` 与 `body.url`;URL 不存在时返回 404 (PR-6 / F-017)。

### ✨ 功能

- **`feat(llm): 所有提示注入 locale (PR-2 / F-012)`** — `resolveLocale(req)`、`buildLocaleDirective(lang)`。SPA 自动附加 `Accept-Language` + `lang`。
- **`feat(scripts): post-qa-cleanup.mjs (PR-11)`** — 重放 QA 回归后清理清单;`--apply` 写入,默认 dry-run,幂等。

### 🧪 测试

- 新增 `tests/critical-fixes.test.mjs`(15 用例)。`tests/url-validation.test.mjs` 扩展 5 个用例。**单元测试 318 个**(原 298)。`portals-dead.test.mjs` 中已有失败源于 parent 的 `templates/portals.example.yml` 数据漂移 — 与 web-ui 代码无关。

### 📝 文档

- 新增 `docs/reviews/REVIEW-2026-05-09-v1.10.1.md`。所有 8 个 README 已更新(徽章 + 截图 + "v1.10.1 新增内容"章节)。所有 8 个 CHANGELOG 收录此条目。

---

## [1.10.0] — 2026-05-08

> 完整文本见 [CHANGELOG.md](CHANGELOG.md#1100--2026-05-08)。摘要:CV 导入(`.docx`/`.doc`/`.odt`/`.rtf`/`.pdf`/`.html`/`.txt`/`.md`,经 pandoc + pdftotext,上限 10 MB)、Generate-PDF 后自动下载新 PDF、`#/config` 双标签页(API keys & runtime + Profile)、`#/profile` 正式成为规范路由、8 个 locale 帮助文档刷新。

---

## [1.9.1] — 2026-05-08

生产就绪通过。4 项定向修复(BF-1..BF-4),Playwright 烟雾测试从 5 个扩展到 12 个。

### 🐛 修复

- **BF-1 (tracker)**: `|` 和换行的转义现在应用于所有单元格,不仅是 notes。`"Acme | Co"` 这样的名称不会再破坏表格。`parseMarkdownTable` 支持 GFM 的 `\|` 转义 — 无损 round-trip。
- **BF-2 (config)**: `updateEnvFile` 包裹在 try/catch 中 — 权限拒绝时返回干净的 500 而不是未处理的 rejection。
- **BF-3/BF-4 (llm)**: 在 `/api/evaluate`、`/api/deep`、`/api/mode/:slug` 的 Anthropic 分支上对组装的 prompt 设 200 KB 软上限 — 返回 413 而不是超时。

### 🧪 Playwright 烟雾测试 — 5 → 12 个

Tracker(含 BF-1 round-trip)、pipeline 添加 + 无效 URL 扫除、reports 空状态、evaluate 手动回退、config 密钥掩码、CV PUT 净化、pipeline preview 400。

---

## [1.9.0] — 2026-05-08

v1.8.0 待办列表中的 P-6 → P-10 全部一次性发布。要点:`server/index.mjs` 现在是 130 行的编排器(原 762 行,累计 1230 → 130 = -89 %),每个路由主题各自一个模块。`/api/evaluate` 的 Anthropic 对等支持、多 CLI 桥接文件、扩展的 i18n 对等测试,以及 CI 中的 Playwright 浏览器烟雾测试。

### 🏗️ P-6 — server/index.mjs 拆分第二阶段

P-2 的延续。剩下的 9 个路由主题已抽到 `server/lib/routes/<topic>.mjs`。`index.mjs` 现在是纯编排器:中间件、12 个 `register<Topic>Routes(app)` 调用、SPA 兜底路由。

模块:`activity`、`config`、`health`(含 dashboard)、`help`、`jds`、`llm`、`pipeline`(含 preview)、`reports`、`tracker`。行为不变。每一步 283/283 unit tests 全绿。

### 🔌 P-7 — `/api/evaluate` 的 Anthropic 对等

`/api/evaluate` 之前是 Gemini 或 manual。v1.9.0 加入 Anthropic 分支(两把 key 同时存在时优先)。通过 `bundleProjectContext({ modeSlugs: ['_shared', 'oferta'] })` — REVIEW-A1 扩展。回退顺序:Anthropic → Gemini → manual。

新端点 **`POST /api/evaluate/test-anthropic`** — 针对 `ANTHROPIC_API_KEY` 的烟雾检测。

### 🌐 P-8 — Help 中心 i18n 对等

8 个 locale 都已覆盖同样的 14 个规范 h2 段落。测试加强:

- `tests/help-ui.test.mjs` 现在遍历全部 8 个 locale(此前只有 en + ru)。
- 新增:每个 locale 不少于 `en.md` 的 30 % — 防止 stub。

### 🤖 P-9 — CI 加入 Playwright 浏览器烟雾测试

`tests/playwright-smoke.mjs`(v1.8.0 的 opt-in)现在已是 CI 工作流的一部分。

### 🌍 P-10 — 多 CLI 兼容

新增 `web-ui/AGENTS.md`(Codex / Aider / 通用)与 `web-ui/GEMINI.md` 作为指向规范 `CLAUDE.md` 的桥接文件。

### 🧪 测试

- **284 unit tests**(原 283):新增 1 个 i18n 对等测试。
- **5 个 Playwright 烟雾测试** 现已纳入 CI。

### 📦 新端点

| 方法 | 路径 | 用途 |
|---|---|---|
| `POST` | `/api/evaluate/test-anthropic` | `ANTHROPIC_API_KEY` 烟雾检测 (P-7)。 |

---

## [1.8.0] — 2026-05-08

加固、重构与 SDD 基础。三项高严重性修复(A1、A2、A3)、四项中等(B1–B4)、六项轻微清理、父项目 career-ops v1.7.0 审计、`server/index.mjs` 拆分(P-2 第 1 阶段)、Playwright 浏览器烟雾测试,以及 `docs/` 与 `.claude/` 中的完整 SDD 基础。

### 🔥 高严重性修复

- **`fix(deep): 在 Anthropic SDK 调用中内联 cv/profile/mode 文件 (REVIEW-A1)`** — `/api/deep` 与 `/api/mode/:slug` 之前指示模型"先读取这些文件",但 Anthropic SDK 没有文件系统。输出空洞。`bundleProjectContext` 读取 `cv.md`、`config/profile.yml`、`modes/_shared.md` 与模式模板,各截取至 16 KB,在提示前插入 `<project_context>` 块。实测:`claude-sonnet-4-6` 返回 26 KB 有依据的 markdown。
- **`fix(runner): 宽限期后 SIGTERM → SIGKILL 升级 (REVIEW-A2)`** — 卡在系统调用的子进程会无限挂起 SSE 连接。两条路径都启动 5 秒 watchdog 升级到 `SIGKILL`。
- **`fix(runner): streaming 端点的最大运行时上限 (REVIEW-A3)`** — `/api/stream/{scan,liveness,pdf}` 设 30 分钟上限。

### 🛡️ 中等严重性

- **`fix(preview): /api/pipeline/preview 的逐跳验证 (REVIEW-B1)`** — 从 `redirect: 'follow'` 切换到手动重定向遍历。每个 `Location` 都通过 `isValidJobUrl` 重新验证,3 跳上限。敌意板不能再将我们重定向到 loopback / 私有 IP / `file://`。
- **`refactor(keys): hasGeminiKey 统一 LLM 密钥检查 (REVIEW-B2)`**。
- **`feat(scanners): 通过 hh.ru、Habr、Greenhouse、Ashby、Lever 传递 AbortSignal (REVIEW-B3)`** — 客户端断开时,飞行中 fetch 被中止。
- **`test(anthropic): log-guard 防止 API 密钥未来通过 console 泄漏 (REVIEW-B4)`**。

### 🧹 轻微清理

- **`fix(parsers): addPipelineUrl 内部的 URL 闸门作为纵深防御 (REVIEW-C4)`**。
- **`docs(readme): 徽章 88 → 277 tests (REVIEW-C3)`**。
- **`test(i18n): 缺失键消息按 locale 分组 (REVIEW-C6)`**。

### 🏗️ P-2 第 1 阶段 — server/index.mjs 拆分 (1230 → 762 LOC, −38 %)

行为不变。每一步 283/283 unit tests 全绿。

- `server/lib/security.mjs` — 净化器与信任检查。
- `server/lib/prompts.mjs` — LLM 提示构建器。
- `server/lib/store.mjs` — 防御性读取器 + 首次启动引导。
- `server/lib/routes/{scan,runners,content}.mjs` — `registerXxxRoutes(app)`。

第 2 阶段将提取 tracker / pipeline / reports / jds / llm / health。

### 🔍 父项目 career-ops v1.7.0 审计

UI 兼容。模式目录:7 → 19(UI 故意只暴露 7 个)。`portals.yml` 使用 `tracked_companies`(96 条目,87 启用,71 含 API)。在 `docs/architecture/DATA-FLOWS.md` 中记录。

### 🤖 SDD / GSD 基础

- `CLAUDE.md`(根)、`.aiignore`、`.claude/agents/*`(3 个)、`.claude/commands/*`(2 个)。
- `docs/` 树:PROJECT、ROADMAP、sdd/{SDD-GUIDE, CONVENTIONS}、architecture/{OVERVIEW, SERVER, FRONTEND, API, DATA-FLOWS}、reviews/REVIEW-2026-05-07。

### 🔒 安全与仓库卫生

- **`chore(.gitignore): 扩展纵深防御模式`** — env 变体、IDE、GSD scratch、代理私有配置、Playwright 产物、通用密钥模式。

### 🧪 测试

- **283 unit tests**(原为 277):新增 6 个。
- **5 个 Playwright 浏览器烟雾测试**(新增,通过 `npm run test:e2e:browser` opt-in)。
- 覆盖率 ~93 % line / ~83 % branch。

### 📝 新增 npm 脚本

| 脚本 | 用途 |
|---|---|
| `npm run test:e2e:browser` | 针对 in-process 服务器的 Playwright smoke(5 个测试)。 |

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
