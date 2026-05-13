# career-ops-ui

> 一个简洁的、docs 风格的 Web 界面,用于 [career-ops](https://github.com/santifer/career-ops) AI 求职流水线。
> 在单个浏览器标签中搜索、评估、深入研究、申请并跟踪每个职位 — 而不是在 Claude Code、终端和 markdown 文件之间来回切换。

[English](README.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko-KR.md) | [日本語](README.ja.md) | [Русский](README.ru.md) | **简体中文** | [繁體中文](README.zh-TW.md)

[![tests](https://img.shields.io/badge/tests-427%20passed-brightgreen)](#tests)
[![playwright](https://img.shields.io/badge/playwright-28%20e2e-brightgreen)](#tests)
[![node](https://img.shields.io/badge/node-%E2%89%A518-blue)](#requirements)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![release](https://img.shields.io/badge/release-v1.19.0-blue)](https://github.com/Fighter90/career-ops-ui/releases/tag/v1.19.0)

![career-ops-ui — 指挥中心](./images/dashboard-en.png)

## 关于 career-ops

[career-ops](https://career-ops.org) 是一个开源求职系统,作为 slash 命令运行在任何 AI 编码 CLI(Claude Code、Codex、Cursor、Gemini CLI、GitHub Copilot CLI)内部。模型无关。它使用六维 0.0–5.0 评分体系将每个职位与你的 CV 进行匹配,生成定制的 PDF 简历,并在本地跟踪每次申请 — 无云账户,无遥测,无自动提交。

**本仓库 (career-ops-ui)** 是其上的精致 Web 界面。CLI 继续负责表单填写(通过 Playwright MCP)和 slash 命令模式;SPA 在同一 `cv.md` / `data/applications.md` / `reports/` 文件之上提供一个 CRM 风格的浏览器界面。两者共享同一份数据。

**按 Score 的行动阈值**(来自 [career-ops.org/docs](https://career-ops.org/docs)):

| Score | 下一步 |
|---|---|
| **≥ 4.5** | `/career-ops apply` — 高度匹配,立即申请 |
| **4.0 – 4.4** | 申请,或 `/career-ops contacto` 进行 warm intro |
| **3.5 – 3.9** | `/career-ops deep` — 先调研 |
| **< 3.5** | 除非有特定理由,否则跳过 |

**规范指南** 位于 [career-ops.org/docs](https://career-ops.org/docs):

- [What is career-ops](https://career-ops.org/docs/introduction/what-is-career-ops)
- [Scan job portals](https://career-ops.org/docs/introduction/guides/scan-job-portals)
- [Apply for a job](https://career-ops.org/docs/introduction/guides/apply-for-a-job)
- [Batch-evaluate offers](https://career-ops.org/docs/introduction/guides/batch-evaluate-offers)
- [Set up Playwright](https://career-ops.org/docs/introduction/guides/set-up-playwright)

## 一键安装

```bash
curl -fsSL https://raw.githubusercontent.com/Fighter90/career-ops-ui/main/bin/setup.sh | bash
```

此命令会克隆两个仓库(career-ops + career-ops-ui)、安装依赖,并在 http://127.0.0.1:4317 启动服务器。

---

## 为什么?

[career-ops](https://github.com/santifer/career-ops) 是一个强大的基于 Claude Code 的求职系统:粘贴 JD → 获得 0-5 适配评分、ATS 优化的 PDF 和跟踪器条目。它在 Claude Code 内部运行良好,但数据分散在 `cv.md`、`data/applications.md`、`reports/*.md`、`data/pipeline.md`、`portals.yml`、`config/profile.yml` 之间 — 容易遗失,难以快速浏览。

`career-ops-ui` 在其上添加一个精致的 UI:

- **浏览** 跟踪器、报告和流水线,像 CRM 一样。
- **触发** 扫描(Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday **以及** hh.ru / Habr Career),并查看实时 SSE 日志。
- **评估** 通过 Anthropic(首选)或 Gemini 实时评估 JD,如果未设置 API key,则获取一个用于 Claude Code 的复制粘贴 prompt。
- **深度研究** 通过 Anthropic SDK 实时研究公司,cv / profile / mode 文件会自动内联。
- **编辑** `cv.md`,带并排 markdown 预览和服务端 XSS 清理。
- **维护** 系统:doctor、verify、normalize、dedup、merge — 每个一键完成。
- **多 CLI:** 从 Claude Code、Codex、Cursor、Aider 或 Gemini CLI 同等驱动 — `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` 垫片指向同一份事实来源。

它纯粹是加法:`career-ops/` 内部不会更改任何内容。你的所有定制都仍然是你的。

---

## 快速开始

### 1. 先安装 career-ops

```bash
git clone https://github.com/santifer/career-ops.git
cd career-ops
```

按照 [career-ops 入门指南](https://github.com/santifer/career-ops#first-run--onboarding) 操作,使 `cv.md`、`config/profile.yml` 和 `portals.yml` 存在。

### 2. 在其中放入 career-ops-ui

```bash
git clone https://github.com/Fighter90/career-ops-ui.git web-ui
```

现在你的目录树看起来像这样:

```
career-ops/
├─ cv.md
├─ portals.yml
├─ config/
├─ data/
├─ modes/
├─ reports/
├─ scan.mjs … doctor.mjs … (etc)
└─ web-ui/                 ← 本仓库
   ├─ bin/start.sh
   ├─ package.json
   ├─ server/
   ├─ public/
   └─ tests/
```

### 3. 启动

```bash
bash web-ui/bin/start.sh
```

该脚本:

1. 检查 Node ≥ 18。
2. `npm install`(仅首次运行,两个依赖 — Express + js-yaml)。
3. 在 `127.0.0.1:4317` 启动 Express 服务器。
4. 在默认浏览器中打开 http://127.0.0.1:4317/。

自定义端口 / 主机:

```bash
PORT=8080 bash web-ui/bin/start.sh
HOST=0.0.0.0 PORT=4317 bash web-ui/bin/start.sh   # 暴露到 LAN
```

如果你将仓库克隆到其他位置(而非 `career-ops/web-ui`),通过环境变量指向 career-ops:

```bash
CAREER_OPS_ROOT=/path/to/career-ops bash bin/start.sh
```

---

## 要求

| | |
| --- | --- |
| **Node.js** | ≥ 18(使用原生 `fetch`、`node:test`) |
| **career-ops** | 已克隆并入门 — 见上文 |
| **可选** | 父项目 `.env` 中的 `GEMINI_API_KEY`(免费层模型 `gemini-2.0-flash`)用于一键 JD 评估。否则 UI 返回一个用于 Claude 的复制粘贴 prompt。 |
| **可选** | 如果 hh.ru 返回 403,从俄罗斯 IP / VPN 运行。Habr Career 从任何 IP 均可工作。 |
| **可选** | Playwright(已是 career-ops 的传递依赖)用于 e2e 测试套件。 |

---

## 各页面功能

| 页面             | 功能说明                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Dashboard**    | 聚合计数(apps / pipeline / reports)、平均分、按状态细分、最新 5 个 apps + 最新报告。                                |
| **Scan**         | **🌐 单个 Scan 按钮** — 一次性运行所有已启用的来源(EN:Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday,RU:hh.ru + Habr Career)。实时 SSE 日志流式 + 带 location / Remote-Hybrid 徽章 / relocation 标记 / 薪资 / 来源过滤器以及动态 stack / level / keyword chip 的可点击结果表格。Active-Companies 卡片列出每个跟踪的 board 及其 API 健康状况。 |
| **Pipeline**     | 对 `data/pipeline.md` 进行 CRUD。服务端预览代理(SSRF-safe、逐跳 redirect 校验、8 KB body 上限)。从 URL 直接跳转到评估。 |
| **Evaluate**     | 粘贴 JD → **Anthropic 优先**(两个 key 同时存在时首选),然后 Gemini,然后手动 prompt 回退。Anthropic 路径自动内联 cv / profile / `_shared.md` / `oferta.md`(REVIEW-A1)。可选将 JD 保存到 `jds/`。 |
| **Deep research**| 与 Evaluate 相同的回退链。实时 Anthropic 返回约 10–30 KB 有依据的 markdown,并保存到 `interview-prep/<company>-<role>.md`。 |
| **Modes**        | 7 个通用 mode 页(`/#/project`、`/#/training`、`/#/followup`、`/#/batch`、`/#/contacto`、`/#/interview-prep`、`/#/patterns`),采用相同的 Anthropic / Gemini / 手动回退链。 |
| **Apply helper** | 生成提交清单;实际的 Playwright 表单填写仍在 Claude Code 中的 `/career-ops apply` 中。                              |
| **Tracker**      | 在 `data/applications.md` 之上的可过滤表格(状态、分数、自由文本)。一键 `normalize-statuses.mjs` / `dedup-tracker.mjs` / `merge-tracker.mjs`。管道符 + 换行符转义符合 GFM — 像 `"Acme \| Co"` 这样的名字可无损往返。 |
| **Reports**      | 浏览和阅读 `reports/` 下的每个报告,带解析的 header(Score / Legitimacy / URL)。                                   |
| **CV**           | `cv.md` 的实时 markdown 编辑器,带并排预览 + 一键 `cv-sync-check.mjs` + 📁 上传 CV。保存时服务端 XSS 清除(`<script>`、`javascript:`、`on*=` handlers)。 |
| **Profile**      | `config/profile.yml` + 原型的只读视图 — UI 友好的摘要。                                                            |
| **App settings** | UI 内编辑父项目的 `.env` keys:`ANTHROPIC_API_KEY`、`GEMINI_API_KEY`、模型覆盖、端口 / 主机。读取时密钥被遮蔽。      |
| **Health**       | 所有 setup 检查显示为 OK / OPTIONAL / FAIL 徽章 + 用于运行 `doctor.mjs` 和 `verify-pipeline.mjs` 的按钮。            |
| **Help**         | 应用内 Markdown 用户指南(`/#/help`),针对所有 8 种支持的语言进行本地化(en / es / pt-BR / ko-KR / ja / ru / zh-CN / zh-TW)。 |
| **Activity log** | 每个状态变更请求(写入、运行、扫描)的审计日志。密钥已脱敏。                                                       |

全局键盘快捷键:

- `Ctrl+K` / `Cmd+K` — 聚焦全局搜索。
- 在全局搜索中粘贴 URL 会自动添加到 pipeline。
- `Esc` — 关闭任何打开的模态框。

---

## Scan

零 token 的 portal 扫描,真正返回职位。UI 中的 **一个 🌐 Scan 按钮** 在单次扫描中运行所有已配置的来源:

- **Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday** — 公开的 boards-api,适用于 `portals.yml::tracked_companies` 中具有可识别 ATS 模式的每家公司。预设列表涵盖 Stripe、GitLab、Vercel、Cloudflare、Datadog、Discord、Elastic、Grafana Labs、CockroachDB、Fastly、Twilio、Coinbase、Reddit、Robinhood、Affirm、Lyft、Linear、Supabase、PostHog、Ramp、Modal Labs、Railway、Browserbase、JetBrains — 可自由扩展或精简。
- **hh.ru** — 公开 API(从非俄罗斯 IP 返回 403;请从俄罗斯 IP / VPN 运行,或跳过 — 同一来源的连续 403 会被合并,扫描过程中该来源会被禁用)。服务器附带合理的默认 User-Agent;高级用户仍可通过俄罗斯 IP / VPN 覆盖。
- **Habr Career** — 对 `career.habr.com/vacancies` 的 HTML 抓取。从任何 IP 均可工作,无需身份验证。

所有来源都通过同一条流水线:normalize → filter(`title_filter.positive` / `title_filter.negative`) → 对照 `data/scan-history.tsv` + `data/pipeline.md` + `data/applications.md` 进行去重 → 追加到 `data/pipeline.md` → 将完整结果集保存到 `data/last-scan.json`,供 UI 的可过滤表格使用。

通过 `portals.yml` 进行配置:

```yaml
title_filter:
  positive: [backend, engineer, senior, tech lead, golang, php]
  negative: [junior, intern, frontend, ios, android]
tracked_companies:
  - { name: Stripe, enabled: true, careers_url: https://job-boards.greenhouse.io/stripe }
  - { name: Linear, enabled: true, careers_url: https://jobs.ashbyhq.com/linear }
  # ...
russian_portals:
  sources: ["hh", "habr"]   # 一个或两个
  area: 113                  # 1=莫斯科,2=圣彼得堡,113=俄罗斯,1001=远程
  per_page: 50
  only_remote: false
  queries: ["Senior PHP", "Senior Go", "Tech Lead"]
```

所有来源流经一个统一的 SSE 端点:`/api/stream/scan?source=ats|regional|both`。**🌐 Scan** UI 按钮调用 `source=both`,这样每个 adapter(Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday + hh.ru + Habr Career)都在一个连接中运行。在客户端断开连接时遵循 `AbortSignal` — 不会有孤立的 fetch。

---

## 架构

```
career-ops-ui/
├─ CLAUDE.md                 # 项目级 agent 说明(规范)
├─ AGENTS.md                 # Codex / Aider / 通用 CLI 垫片 → CLAUDE.md
├─ GEMINI.md                 # Gemini CLI 垫片 → CLAUDE.md
├─ .aiignore                 # AI 工具的排除列表
├─ .claude/                  # Claude Code agent 配置
│  ├─ agents/                # 3 个项目专用子 agent(路由、视图、测试隔离)
│  └─ commands/               # slash 命令存根
├─ bin/start.sh              # 一键启动脚本(Node 检查 → npm install → server → 打开浏览器)
├─ package.json              # 2 个运行时依赖:express、js-yaml
├─ server/
│  ├─ index.mjs              # ~130 LOC 编排器:中间件 + 12 个 register<Topic>Routes(app) 调用 + SPA catch-all
│  └─ lib/
│     ├─ paths.mjs           # career-ops 文件的绝对路径(CAREER_OPS_ROOT 感知)
│     ├─ parsers.mjs         # markdown / pipeline / report 解析器(符合 GFM 的管道符转义)
│     ├─ runner.mjs          # runNodeScript() + streamNodeScript(),带 SIGTERM→SIGKILL 升级 + 30 分钟上限
│     ├─ security.mjs        # isValidJobUrl、stripDangerousMarkdown、sanitizeJobDescription、isPubliclyExposed
│     ├─ prompts.mjs         # bundleProjectContext、buildEvaluationPrompt、buildDeepPrompt、buildModePrompt
│     ├─ store.mjs           # safeReadApps/Pipeline/Reports、checkProfileCustomized、ensureRussianPortalsDefaults
│     ├─ anthropic.mjs       # 最小 Anthropic SDK 适配器(runAnthropic、hasAnthropicKey、hasGeminiKey)
│     ├─ env-config.mjs      # .env 往返,带密钥遮蔽 + 校验
│     ├─ activity-log.mjs    # JSONL 审计日志中间件(密钥已脱敏)
│     ├─ dotenv.mjs          # 小型 dotenv 加载器
│     ├─ en-scanner.mjs      # 进程内 Greenhouse/Ashby/Lever 编排器(AbortSignal 感知)
│     ├─ ru-scanner.mjs      # 进程内 hh.ru + Habr 编排器(AbortSignal 感知)
│     ├─ sources/
│     │  ├─ greenhouse.mjs   # boards-api.greenhouse.io 客户端
│     │  ├─ ashby.mjs        # api.ashbyhq.com 客户端
│     │  ├─ lever.mjs        # api.lever.co 客户端
│     │  ├─ hh.mjs           # api.hh.ru 客户端(UA 感知)
│     │  └─ habr.mjs         # career.habr.com HTML 解析器(无 cheerio,仅 regex)
│     └─ routes/             # 12 个路由模块 — 每个主题一个(P-2)
│        ├─ activity.mjs     # /api/activity
│        ├─ config.mjs       # /api/config(父项目 .env 往返)
│        ├─ content.mjs      # /api/cv、/api/profile、/api/portals、/api/modes
│        ├─ health.mjs       # /api/health、/api/dashboard
│        ├─ help.mjs         # /api/help/:lang
│        ├─ jds.mjs          # /api/jds CRUD
│        ├─ llm.mjs          # /api/evaluate、/api/deep、/api/mode/:slug、/api/apply-helper、/api/interview-prep*
│        ├─ pipeline.mjs     # /api/pipeline + SSRF-safe 预览代理
│        ├─ reports.mjs      # /api/reports
│        ├─ runners.mjs      # /api/run/* + /api/stream/{scan,liveness,pdf} + /api/output/pdfs
│        ├─ scan.mjs         # /api/stream/scan-{ru,en} + /api/scan-results
│        └─ tracker.mjs      # /api/tracker
├─ public/                   # 静态 SPA — 无构建步骤
│  ├─ index.html
│  ├─ css/app.css            # 设计 tokens(docs 风格调色板)
│  └─ js/
│     ├─ api.js              # fetch 封装 + 连接横幅状态 + UI 辅助函数 + 安全 markdown 渲染器
│     ├─ router.js           # 基于 hash 的路由,带 404 回退 + 别名支持
│     ├─ app.js              # 启动 + 全局键盘处理器 + 移动端 sidebar drawer
│     ├─ lib/{i18n,skills}.js
│     └─ views/              # 每页一个文件(dashboard、scan、pipeline、evaluate、deep、apply、tracker、reports、cv、settings、health、config、help、activity、mode-page)
├─ docs/                     # 公共参考:架构、API、数据流、SDD、约定、reviews
│  ├─ PROJECT.md             # 是什么 / 为什么 / 给谁
│  ├─ ROADMAP.md             # 当前 milestone + 已完成历史
│  ├─ PRODUCTION-READINESS.md # 诚实的部署门评估
│  ├─ sdd/{SDD-GUIDE,CONVENTIONS}.md
│  ├─ architecture/{OVERVIEW,SERVER,FRONTEND,API,DATA-FLOWS}.md
│  └─ reviews/REVIEW-*.md
└─ tests/                    # 284 个 unit + 12 个 Playwright + 23 个 e2e:full + 20 个 e2e:smoke
   ├─ parsers.test.mjs       # markdown / pipeline / report 解析器(纯函数)
   ├─ api.test.mjs           # 每个端点,临时服务器,无网络
   ├─ {ru,en}-scanner.test.mjs   # mock fetch
   ├─ pipeline-preview.test.mjs   # 逐跳 redirect 校验(REVIEW-B1)
   ├─ anthropic.test.mjs     # SDK 适配器 + log-guard 测试(REVIEW-B4)
   ├─ url-validation.test.mjs    # SSRF 拒绝扫描(FIX-M3 + M6 + M7)
   ├─ cv-xss.test.mjs        # stripDangerousMarkdown 往返
   ├─ jd-sanitize.test.mjs   # sanitizeJobDescription
   ├─ help.test.mjs / help-ui.test.mjs    # 跨所有 8 种语言环境的 i18n 对等
   ├─ playwright-smoke.mjs   # 12 个浏览器流程(CV 保存、tracker、pipeline、evaluate、config 等)
   └─ e2e{,-comprehensive}.mjs   # 完整 Playwright walkthrough
```

### 为什么没有构建步骤?

原生 HTML/CSS/JS 让表面积保持很小:`npm install` 两个依赖,你就可以运行。无 Webpack,无 Vite,无 doom 般的 `node_modules`。整个 UI 压缩后 < 30 KB。如果你想在开发期间热重载,`npm run dev` 使用 Node 内建的 `--watch`。

### 规范驱动开发(Spec-Driven Development)

非平凡的变更走 GSD 流水线(来自 `superpowers@claude-plugins-official` 的 `gsd-*` 技能):

```
discuss → spec → plan → execute → verify → review
```

公共参考:[`docs/sdd/SDD-GUIDE.md`](docs/sdd/SDD-GUIDE.md)。所有规划产物位于 `.planning/`(已 gitignore)。`docs/` 树是长期存在的公共契约。

---

## API 参考

所有端点位于 `/api/*` 下。除非另有说明,均为 JSON 进 / JSON 出。

### Health & dashboard

| Method | 路径                     | 响应                                                                        |
| ------ | ------------------------ | --------------------------------------------------------------------------- |
| GET    | `/api/health`            | `{ ok, warnings, version, parentVersion, checks: [{name, ok, required, value?}] }` |
| GET    | `/api/dashboard`         | `{ counts, avgScore, byStatus, recent, pipeline, lastReport }`              |
| GET    | `/api/activity?limit&type` | `data/activity.jsonl` 审计日志尾部                                          |
| GET    | `/api/help/:lang`        | 本地化的应用内用户指南(回退:`en.md`)                                     |

### 应用设置(父项目 .env 往返)

| Method | 路径             | 用途                                                                   |
| ------ | ---------------- | ---------------------------------------------------------------------- |
| GET    | `/api/config`    | 已知 env keys,密钥已遮蔽                                              |
| POST   | `/api/config`    | 校验 + 写入父项目 `.env`;就地应用到 `process.env`                     |

### 数据文件

| Method | 路径                                | 用途                                                                   |
| ------ | ----------------------------------- | ---------------------------------------------------------------------- |
| GET    | `/api/tracker`                      | `{ rows: [parsed applications.md] }`                                   |
| POST   | `/api/tracker`                      | body `{ company, role, score?, status?, url?, notes?, date? }` — 感知去重(对 company + role 不区分大小写) |
| GET    | `/api/pipeline`                     | `{ urls: [...] }`                                                      |
| POST   | `/api/pipeline`                     | body `{ url }` → 添加到 `data/pipeline.md`,带去重 + `isValidJobUrl` |
| GET    | `/api/pipeline/preview?url=…`       | 服务端 fetch 代理(逐跳 SSRF 检查,≤3 redirects,8 KB 上限)            |
| DELETE | `/api/pipeline?url=…`               | 移除一个 URL                                                           |
| GET    | `/api/reports`                      | `reports/*.md` 的解析列表                                              |
| GET    | `/api/reports/:slug`                | 完整 markdown + 解析后的 header                                        |
| GET    | `/api/jds`                          | 已保存 JD 文件列表                                                     |
| GET    | `/api/jds/:name`                    | text/plain — 原始 JD                                                   |
| POST   | `/api/jds`                          | body `{ text, slug? }` → 保存到 `jds/`                                 |
| DELETE | `/api/jds/:name`                    | unlink(需要 `.txt` 后缀)                                              |
| GET    | `/api/cv`                           | `{ markdown }`                                                         |
| PUT    | `/api/cv`                           | body `{ markdown }` → 写入 `cv.md`(XSS 已清除,≤1 MB)                |
| GET    | `/api/profile`                      | `{ profile: yaml-parsed, raw: text }`                                  |
| GET    | `/api/portals`                      | `{ portals: yaml-parsed, raw: text }`                                  |
| GET    | `/api/modes`                        | mode 文件列表                                                          |
| GET    | `/api/modes/:name`                  | text/plain — 原始 mode prompt                                          |
| GET    | `/api/output/pdfs`                  | 已生成 PDF 列表                                                        |
| GET    | `/api/output/pdfs/:name`            | 下载(`Content-Disposition: attachment`)                              |
| GET    | `/api/interview-prep`               | 已保存的深度研究文件列表                                               |
| GET    | `/api/interview-prep/:name`         | `{ name, markdown }`                                                   |
| DELETE | `/api/interview-prep/:name`         | unlink(需要 `.md` 后缀)                                               |

### 脚本运行器(buffered、一次性)

| Method | 路径                    | 包装                        |
| ------ | ----------------------- | --------------------------- |
| POST   | `/api/run/doctor`       | `node doctor.mjs`           |
| POST   | `/api/run/verify`       | `node verify-pipeline.mjs`  |
| POST   | `/api/run/normalize`    | `node normalize-statuses.mjs` |
| POST   | `/api/run/dedup`        | `node dedup-tracker.mjs`    |
| POST   | `/api/run/merge`        | `node merge-tracker.mjs`    |
| POST   | `/api/run/sync-check`   | `node cv-sync-check.mjs`    |

所有 buffered 运行上限为 60 秒;5 秒宽限后 SIGTERM → SIGKILL 升级。

### 流(SSE)

| Method | 路径                          | 流式输出                            |
| ------ | ----------------------------- | ----------------------------------- |
| GET    | `/api/stream/scan`            | 旧版 `node scan.mjs`(子进程)      |
| GET    | `/api/stream/scan?source=ats\|regional\|both` | 合并的进程内扫描 SSE — 查询:`dryRun=1`、`company=…`(仅 ATS)。 |
| GET    | `/api/stream/liveness`        | `node check-liveness.mjs`           |
| GET    | `/api/stream/pdf`             | `node generate-pdf.mjs`             |

SSE 事件类型:

```
event: start    data: { script, args?, writeFiles? }
event: log      data: { stream: "stdout"|"stderr", line: string }
event: done     data: { code, counts?, errors? }
event: error    data: { message }
```

### LLM 端点(Anthropic 优先 → Gemini → 手动回退)

| Method | 路径                                | 用途                                                                             |
| ------ | ----------------------------------- | -------------------------------------------------------------------------------- |
| POST   | `/api/evaluate`                     | body `{ jd, save? }` → JD 评估(按 `oferta.md` 的 A–G 章节)                     |
| POST   | `/api/evaluate/test-gemini`         | `GEMINI_API_KEY` 烟雾检查                                                        |
| POST   | `/api/evaluate/test-anthropic`      | `ANTHROPIC_API_KEY` 烟雾检查                                                     |
| POST   | `/api/deep`                         | body `{ company, role?, run? }` → 深度研究 prompt 或实时基于事实的 markdown        |
| POST   | `/api/mode/:slug`                   | 通用 mode 运行器;allowlist:`batch`、`contacto`、`followup`、`interview-prep`、`patterns`、`project`、`training` |
| POST   | `/api/apply-helper`                 | body `{ url, jd? }` → 申请清单                                                   |
| GET    | `/api/scan-results`                 | `{ en: {when, fresh[], filtered[], errors[]}, ru: { ... } }` — 上次扫描          |
| GET    | `/api/scan/regional/config`         | 有效的区域扫描器配置(queries、negatives、sources)。 |

当 `/api/deep` 或 `/api/mode/:slug` 上设置 `run: true` 时,服务器优先使用 Anthropic(两个 key 同时存在时),将 `cv.md` + `config/profile.yml` + `modes/_shared.md` + 相关 mode 模板内联到 `<project_context>` 块中,并直接返回模型基于事实的 markdown。软上限:已组装 prompt 200 KB — 溢出返回 413。

---

## 测试

```bash
npm test                       # 284 个单元/集成测试
npm run test:e2e               # 20 个烟雾 e2e(启动自己的服务器)
npm run test:e2e:full          # 23 个综合 e2e
npm run test:e2e:browser       # 12 个 Playwright 浏览器烟雾
npm run test:coverage          # 同 `npm test` 加 V8 覆盖率
```

| 套件                       | 测试 | 内容                                                                                                       |
| --------------------------- | ----- | ---------------------------------------------------------------------------------------------------------- |
| `node --test tests/*.test.mjs`(unit + integration) | **284** | 每个端点,临时服务器,无网络。包含 parser、scanner(已 mock)、runner、anthropic、安全 header、XSS、JD sanitize、URL 校验、i18n 对等。 |
| `tests/e2e.mjs`(smoke)      | 20    | Playwright headless:每个路由渲染,基本流程。                                                              |
| `tests/e2e-comprehensive.mjs` | 23    | 完整 Playwright walkthrough:11 个路由 + 12 个功能流程。                                                   |
| `tests/playwright-smoke.mjs`(`npm run test:e2e:browser`) | **12** | 浏览器驱动的烟雾:dashboard 渲染、导航、语言切换、404、health、tracker 往返(BF-1)、pipeline 添加 + 无效 URL 扫描、reports 空、evaluate 手动回退、config keys 已遮蔽、CV PUT XSS 清除、pipeline preview 400。 |
| **总计**                   | **339** | **0 失败,0 flake**                                                                                        |

覆盖率:通过 `--experimental-test-coverage` 得 ~93% 行 / ~83% 分支。

解析器是纯函数(无 I/O)— 针对 `applications.md`、`pipeline.md` 和 `reports/*.md` 的真实数据片段进行测试。API 测试在临时端口启动 Express 应用,并对每个端点进行端到端演练。Scanner 测试 mock 了 `fetch`,因此即使 hh.ru 屏蔽你的 IP 也能通过。Playwright 浏览器烟雾针对进程内服务器运行,并通过父项目的 `node_modules` 解析 Playwright — `web-ui/` 中无新依赖。

CI 在每次推送到 `main` 时,针对 Node 18 / 20 / 22 运行 unit + e2e + Playwright 矩阵。

---

## 配置

环境变量(服务器启动时读取,除非另有说明均为可选):

| 变量                 | 默认值             | 用途                                                                              |
| -------------------- | ------------------ | --------------------------------------------------------------------------------- |
| `PORT`               | `4317`             | Express 绑定端口                                                                  |
| `HOST`               | `127.0.0.1`        | Express 绑定主机。非 loopback 时附加 CSP;v2.0.0 计划加入 auth gate。              |
| `CAREER_OPS_ROOT`    | 从脚本起的 `..`    | 在哪里查找 `cv.md`、`data/`、`portals.yml`、`modes/` 等。                          |
| `ANTHROPIC_API_KEY`  | 未设置             | 启用 `/api/evaluate`、`/api/deep`、`/api/mode/:slug` 实时模式(两个 key 同时设置时首选)。 |
| `ANTHROPIC_MODEL`    | `claude-sonnet-4-6` | 覆盖 Anthropic 模型。                                                            |
| `GEMINI_API_KEY`     | 未设置             | 转发给 `gemini-eval.mjs`,并用作 `/api/evaluate` 的回退。                         |
| `GEMINI_MODEL`       | `gemini-2.0-flash` | 覆盖 Gemini 模型。                                                                |
| `(server uses default UA)`      | 未设置  | 覆盖 hh.ru User-Agent(有助于减少来自非俄罗斯 IP 的 403)                          |

本 UI 识别的 `portals.yml` 扩展(添加到父项目中你现有的文件):

```yaml
russian_portals:
  sources: ["hh", "habr"]
  area: 113          # hh.ru area id
  per_page: 50
  only_remote: false
  queries: ["Senior PHP", "Тимлид Go", ...]
```

你也可以为任何公司条目扩展一个显式的 `api:` URL。参见 [`docs/portals-examples.md`](docs/portals-examples.md)(本仓库)了解 24 家已验证公司的现成可粘贴块。

---

## 安全说明

- 默认情况下服务器绑定到 `127.0.0.1` — 除非显式 `HOST=0.0.0.0`,否则永远不会暴露到互联网。
- 来自客户端的所有文件路径输入都被清理(`replace(/[^\w\-.]/g, '')`)。
- 子进程调用使用 `spawn` 和参数数组 — **绝不进行 shell 插值**。
- 流式端点在客户端断开时杀死子进程(无孤儿 scanner)。
- 写入端点仅触碰已知的 career-ops 路径:`data/`、`jds/`、`cv.md`、`config/`、`portals.yml`、`output/`。其他位置一概不动。
- 连接横幅在断开期间每 3 秒 ping 一次 `/api/health`,恢复时自动清除 — 无 toast 刷屏。

---

## 限制

完全 LLM 驱动的 modes(`oferta`、`deep`、`contacto`、`apply`、`batch`、`patterns`、`followup`)需要 LLM 才能真正运行。Web UI 为你提供三个选项:

1. **Anthropic(首选)** — 在父项目的 `.env` 中设置 `ANTHROPIC_API_KEY`。通过 `runAnthropic` 路由,自动内联 `cv.md` / `config/profile.yml` / `modes/_shared.md` / mode 模板(REVIEW-A1)。在 v1.8.0+ 中已使用 `claude-sonnet-4-6` 实测,对一次深度研究调用返回 26 KB 的基于事实的 markdown。
2. **`gemini-eval.mjs`** 作为回退 — 仅设置 `GEMINI_API_KEY` 时开箱即用。
3. **复制粘贴 prompt** — 未设置任何 key 时,UI 生成一个为 Claude Code / ChatGPT / Gemini Web 格式化的可直接使用的 prompt。

Claude Code 中现有的 `/career-ops apply` Playwright 表单填写流程仍是真正自动填写申请表单的唯一方法 — UI 的 *Apply helper* 改为生成一个清单。

关于 production-readiness 评估(部署门、风险登记、推迟工作),请参见 [`docs/PRODUCTION-READINESS.md`](docs/PRODUCTION-READINESS.md)。TL;DR:可用于 single-tenant loopback;LAN 暴露等待 v2.0 P-12 auth gate。

---

## 贡献

欢迎 issues 和 PRs。规则:

- 推送前运行 `npm test` — **284 个检查全绿** 是底线(如果你触碰 UI,还要加上 12 个 Playwright)。
- 非平凡的变更走 GSD 流水线。见 [`docs/sdd/SDD-GUIDE.md`](docs/sdd/SDD-GUIDE.md)。
- 不要从本仓库内部修改父 `career-ops/` 项目中的任何内容。整个重点是这是一个非侵入式叠加层。硬规则见 [`CLAUDE.md`](CLAUDE.md)。
- 约定式提交:`feat`、`fix`、`refactor`、`docs`、`test`、`chore`、`perf`、`ci`。可选 scope:`feat(scan):`。重大变更:`feat!:`。
- 测试必须 CI 隔离 — 通过 `mkdtempSync` 或 `CAREER_OPS_ROOT=$(mktemp -d)` 引导 fixtures。

从非 Claude CLI(Codex、Aider、Cursor、Gemini)驱动仓库?阅读 [`AGENTS.md`](AGENTS.md) 或 [`GEMINI.md`](GEMINI.md) — 两者都垫片到规范的 `CLAUDE.md`。

---

---

## 🌍 Getting Started — 安装后的第一步

一键安装后,你有两个空的 git 克隆,带脚手架的起始 `cv.md`、`config/profile.yml`、`portals.yml`、`data/applications.md` 和 `data/pipeline.md` 文件,其中包含 **EDIT ME** 标记。Health 页面首次启动时应已全部为绿。用你的真实数据替换占位符:

### 1. 创建你的 CV(`cv.md`)

你有三个选项:

- **选项 A — 粘贴现有简历:** 打开 `career-ops/cv.md`,用你的真实简历(干净的 markdown)替换 EDIT-ME 占位符(章节:Summary、Experience、Projects、Education、Skills)。越简单越好 — `career-ops` 将其作为纯文本读取。
- **选项 B — 从 UI 上传:** 点击侧边栏中的 **CV** → **📁 上传 CV** → 选择 `.md` / `.txt` 文件 → 检查预览 → 点击 **💾 保存**。
- **选项 C — 把你的 LinkedIn URL 给 Claude Code:** 在 `career-ops/` 中打开 Claude Code,运行 `/career-ops`,粘贴你的 LinkedIn URL,并请求 *"extract my CV from this and write it to cv.md"*。

让每个指标都具体(例如 *"reduced p99 latency by 38%"* 而非 *"improved performance"*)。评估流水线直接从该文件读取指标。

### 2. 编辑你的 profile(`config/profile.yml`)

```bash
$EDITOR career-ops/config/profile.yml
```

替换全名、邮箱、所在地、LinkedIn、目标角色、archetypes、薪资目标的占位符。**archetypes** 是最重要的字段 — 它们决定每个 JD 如何与你匹配。

### 3. 调整扫描器(`portals.yml`)

```bash
$EDITOR career-ops/portals.yml
```

将 `title_filter.positive`(例如 `"PHP"`、`"Go"`、`"Backend"`、`"Senior"`)和 `title_filter.negative`(例如 `"Junior"`、`"Java"`、`"iOS"`)设置为你的技术栈和资历。预设的 `tracked_companies` 列表已经包含 3 个已验证的 Greenhouse / Ashby boards(GitLab、Vercel、Linear)。更多 24+ 个可直接粘贴的块,见 [`docs/portals-examples.md`](docs/portals-examples.md)。

如果你想扫描 hh.ru / Habr Career,编辑安装脚本创建的 `russian_portals:` 块 — 添加你的搜索查询(例如 `"Senior PHP"`、`"Тимлид Go"`)。

### 4.(可选)LLM API keys

当两者同时存在时,UI 优先使用 Anthropic 而不是 Gemini。任一或都没有都可以 — 没有 key 时,**Evaluate** 改为返回一个用于 Claude Code 的复制粘贴 prompt。

```bash
# Anthropic(首选)
echo "ANTHROPIC_API_KEY=sk-ant-..." >> career-ops/.env
# Gemini(回退)
echo "GEMINI_API_KEY=AIza..." >> career-ops/.env
```

或者通过 UI 中的 **App settings** 页(`/#/config`)设置它们 — 同一个文件,读取时遮蔽,立即应用到 `process.env`。

### 5. 验证并开始工作

刷新 Health 页面 — 每个必需的检查都应为绿。然后:

1. 点击 **🌐 Scan** → 等待约 5 秒 → 扫描 Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday + hh.ru / Habr Career,职位出现在下方表格中。
2. 点击任一标题 → 原始招聘信息在新标签页中打开。
3. 通过 stack chip(PHP / Go / Backend / Senior)过滤,直到看到有希望的职位。
4. 复制 URL → 粘贴到 **Pipeline** → 点击 **Evaluate** 实时打 0-5 分(Anthropic / Gemini),或获取一个手动 prompt。
5. 报告落在 `reports/`,tracker 在 `data/applications.md`,实时深度研究在 `interview-prep/`。所有内容在 UI 中可见。

> 本指南的翻译版本位于每个特定语言的 README 中:
> [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) ·
> [한국어](README.ko-KR.md) · [日本語](README.ja.md) ·
> [Русский](README.ru.md) · [简体中文](README.zh-CN.md) ·
> [繁體中文](README.zh-TW.md)

---

## 许可证

MIT。见 [LICENSE](LICENSE)。

基于 [santifer](https://santifer.io) 的 [career-ops](https://github.com/santifer/career-ops) 构建。感谢这条精彩的流水线。
