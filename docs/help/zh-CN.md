# 帮助 — career-ops-ui

从首次启动到面试准备的每个页面的完整指南。每个 `##` 对应侧边栏条目或
工作流的一个阶段。首次运行从上往下阅读;之后通过帮助侧边栏中的 TOC
跳转到所需部分。

> **适用对象:** 刚把这个 UI 放到 `career-ops` checkout 中并运行了
> `bash bin/start.sh` 的人。不假设你了解 career-ops。

---

## 1. 快速入门 — 从「创建 CV」到「申请 + 发送消息」的逐步指南

按钮级官方流程。第一次请按顺序进行。

**A. 设置 (一次性,~5 分钟)**

1. 打开 `http://127.0.0.1:4317` (或在根目录 `bash bin/start.sh`)。
2. 侧栏 **❤ Health** → 所有必需检查为绿色。
3. 侧栏 **⚒ App settings** → *API keys & runtime* 标签 → 粘贴
   `ANTHROPIC_API_KEY` 和/或 `GEMINI_API_KEY` → **💾 Save** →
   **▶ Test Anthropic / Gemini**。
4. 同一页 → *Profile* 标签 → 编辑 `candidate.full_name`、`email`、
   `target.roles`、`target.comp_total_min_usd`、`target.archetypes`
   → **💾 Save**。

**B. CV (一次性,~10 分钟)**

5. 侧栏 **✎ CV** — 打开编辑器。
6. **📁 Upload CV** 上传 `.docx/.doc/.odt/.rtf/.pdf/.html/.txt/.md`
   (服务器转换 + 净化),或直接粘贴 markdown。
7. **💾 Save** (右上角) — 提示「Saved」。
8. (可选) **📄 Generate PDF** — 完成时最新 PDF 自动下载。

**C. 找职位 (每次扫描 ~2 分钟)**

9. 侧栏 **🌐 Scan** → **🌐 Scan now** → 实时 SSE 日志。
10. 点击公司标签筛选; ↗ 在新标签打开招聘页。

**D. 评分 (每个 JD ~30 秒)**

11. 侧栏 **Pipeline** — 点击条目预览 JD。
12. JD 旁的 **▶ Evaluate** → 模型 0–5 评分 →
    `reports/<日期>-<slug>.md`。
13. 侧栏 **Reports** — 检查报告; pursue = 候选清单。

**E. 决策 + 深入研究 (~3 分钟)**

14. 侧栏 **Deep research** → 公司 + 职位 → 7 节简报 →
    `interview-prep/<公司>-<职位>.md`。

**F. 申请 (每次申请 ~5 分钟)**

15. 侧栏 **Apply checklist** → URL + JD → 清单 (cover letter、
    关键词、附件、**绝不自动提交**)。
16. 在新标签打开招聘页 → 手动提交 (附上第 8 步的 PDF)。
17. 侧栏 **Outreach** (`#/contacto`) → 基于第 14 步简报的
    LinkedIn / 邮件 → 个性化后发送。

**G. 跟踪 + 跟进 (持续)**

18. 侧栏 **Tracker** → 添加行: 公司、职位、得分、状态 `Applied`、
    报告链接、简报链接。
19. 一周后: **Follow-up** 模式 → check-in → 状态 `Followed up`。
20. 收到面试邀请: **Interview prep** 模式 → 系统设计 / 行为面 /
    编码的针对性准备。
21. 拿到 offer: 把 Tracker 改为 `Offer` + 重看报告 comp 节。

**TL;DR — 侧栏顺序就是工作流顺序:**
Health → App settings → Profile → CV → Scan → Pipeline → Evaluate
→ Reports → Deep research → Apply checklist → Outreach → Tracker
→ Follow-up → Interview prep → Activity log。

---

## 2. 应用设置和 API 密钥 (`#/config`)

两个标签页:**API keys & runtime** 从浏览器编辑父项目的 `.env`(与
career-ops Node 脚本启动时读取的同一文件);**Profile** 是
`config/profile.yml` 的直接 YAML 编辑器,自动添加规范文件头
`# Career-Ops Profile Configuration` 并验证 `candidate` 键存在。
任一标签页的保存都立即生效——无需重启。

### 识别的密钥

| 密钥 | 作用 | 获取地址 |
|---|---|---|
| `ANTHROPIC_API_KEY` | 启用 Anthropic SDK 实时调用。两个密钥都设置时优先。 | <https://console.anthropic.com/settings/keys> |
| `ANTHROPIC_MODEL` | 覆盖默认 `claude-sonnet-4-6`。 | — |
| `GEMINI_API_KEY` | 没有 Anthropic 时的回退。`gemini-eval.mjs` 用于 `oferta` mode。 | <https://aistudio.google.com/apikey> |
| `GEMINI_MODEL` | 覆盖 Gemini 模型。 | — |
| `HH_USER_AGENT` | 在俄罗斯外扫描 `hh.ru` 时需要。 | dev.hh.ru |
| `PORT` | Express 端口。默认 4317。 | — |
| `HOST` | 绑定。`0.0.0.0` 暴露到 LAN — **尚无 auth gate**。 | — |

### 行为

- **读取** (`GET /api/config`) — 秘密密钥**遮罩**
  (`sk-ant•••••a1b2`)。
- **保存** (`POST /api/config`) — 验证 → 写入 `.env` → 立即应用到
  `process.env`。无需重启。
- **空值删除**密钥。

### Smoke-test 按钮

保存后点击 **▶ Test Anthropic** / **▶ Test Gemini** — 两者都发送
微小的 prompt (≤256 tokens) 确认密钥工作。返回 ~200 字符样本。

---

## 3. Profile (`#/profile` — 也可通过 `#/settings` 访问)

`config/profile.yml` 的只读视图。直接在磁盘上编辑;页面在 reload 时
重新解析。

关键字段:

- `candidate.full_name` — 在每个 prompt 中使用。**在任何真实扫描
  之前替换 `Jane Smith`**。
- `candidate.email`、`linkedin`、`github` — 在 cover letter 和
  apply checklist 中引用。
- `target.roles` — 接受的职位。
- `target.comp_total_min_usd` — 最低总薪酬。每次评估的 D 节标记低于
  此值的 offer。
- `target.archetypes` — *最重要的字段*。每个 JD 都对其匹配,最佳
  archetype 进入报告头部。

`full_name` 仍是已知 placeholder 时,Health 标记 **Profile
customized**。

---

## 4. CV (`#/cv`)

每次评估、deep research 和 cover letter 的真实来源。位于父根的
`cv.md`。

### 编辑选项

- **直接粘贴** — 左侧 textarea 是 markdown 编辑器。
- **📁 Upload CV** — `.md/.markdown/.txt/.html/.htm`(文本)、
  `.docx/.doc/.odt/.rtf`(经 pandoc — `brew install pandoc`)、
  `.pdf`(经 pdftotext — `brew install poppler`)。服务器转为
  markdown 并清理后载入编辑器,**💾 Save** 持久化。上限 10 MB。
- **从 LinkedIn** — 在父项目中打开 Claude Code,运行 `/career-ops`,
  粘贴 LinkedIn URL,要求 `extract my CV from this and write it to
  cv.md`。

### 净化

`stripDangerousMarkdown` 删除 `<script>`、`<iframe>`、`<object>`、
`<embed>`、`<svg>`、`<style>`、`<form>`、内联处理器 (`onclick=`)、
URI `javascript:`/`vbscript:`/`data:text/html`。被删除时响应包含
`sanitized: true`。最大 1 MB。

### 其他按钮

- **sync-check** — `cv-sync-check.mjs`。
- **📄 Generate PDF** — `generate-pdf.mjs` → `output/*.pdf`。需要
  Playwright。

### 格式提示

- 一个 bullet = 一个带指标的成就。
- 节顺序: **Summary**、**Experience**、**Projects**、**Education**、
  **Skills**。
- 保持在 1500 字以内。

---

## 5. 门户和源 (`portals.yml`)

扫描器配置。三节重要:

### `title_filter`

```yaml
title_filter:
  positive: [backend, engineer, senior, tech lead, golang, php]
  negative: [junior, intern, frontend, ios, android, java]
```

vacancy 在其 title 包含**至少一个 positive** 且 **没有任何
negative** 时通过。

### `tracked_companies`

```yaml
tracked_companies:
  - { name: Stripe,    enabled: true, careers_url: https://job-boards.greenhouse.io/stripe }
  - { name: Linear,    enabled: true, careers_url: https://jobs.ashbyhq.com/linear }
  - { name: JetBrains, enabled: true, careers_url: https://jobs.lever.co/jetbrains }
```

EN 扫描器从 URL 模式检测 ATS,直接调用 boards-api。

### `russian_portals`

```yaml
russian_portals:
  sources: [hh, habr]
  area: 113                 # 113=俄罗斯,1001=远程
  per_page: 50
  only_remote: false
  queries:
    - "Senior PHP"
    - "Senior Go"
```

注意 `queries` 与 negative 列表的重叠 — 控制台会警告冲突。

### Bootstrap

首次启动时,如果缺少 `russian_portals:` 块,服务器会追加文档化的
默认值 (idempotent)。

---

## 6. Health (`#/health`)

每个 setup gate 在 OK / OPTIONAL / FAIL 徽章中。

### 必需 (没有这些系统无法工作)

`Node version` ≥ 18、`Project root`、`cv.md`、`config/profile.yml`、
`portals.yml`、`data/applications.md`、`data/pipeline.md`、
`modes/oferta.md`。

### 可选 (仅警告)

`Profile customized`、`GEMINI_API_KEY`、`ANTHROPIC_API_KEY`、
`HH_USER_AGENT`、Playwright、父项目 deps、目录。

`HOST=0.0.0.0` 时,绝对路径和准确的 Node 版本被隐藏。

### 运行按钮

- **▶ Doctor** — `node doctor.mjs`。
- **▶ Verify pipeline** — `node verify-pipeline.mjs`。

---

## 7. Scan (`#/scan`)

扫描器爬取启用的 boards,对历史去重,把命中写入
`data/last-scan.json` 和 `data/pipeline.md`。

### 一键扫描

**🌐 Scan** 一次性运行每个源。实时 SSE 日志在右侧。**Stop** 或离开
中止。

### 结果过滤

- 自由文本。
- Source 下拉。
- Remote / Hybrid / Onsite。
- Stack chips (PHP、Go、Backend、Senior) — 自动检测。
- 动态 chips: 标题最频繁的 capitalized 标记 top-25。

### Active Companies

可折叠卡片:

- ✓ 绿 — 直接 API 支持。
- ○ 灰 — web 搜索回退。

**点击名称** → 填充上方结果过滤器。**点击 ↗** → 在新标签打开
`careers_url`。

---

## 8. Pipeline (`#/pipeline`)

等待评估的 URL inbox。位于 `data/pipeline.md`。

### 添加 URL

三种方式:

- 输入或粘贴 + **+ Add**。
- **Ctrl+K** / **Cmd+K** → 全局搜索 → 粘贴 URL → Enter。
- 运行 Scan — 新命中自动加入 pipeline。

每个 URL 经过服务端的 `isValidJobUrl()`。Loopback、`file://`、
`javascript:`、IP 字面值、模板字符 — 都 400。

### 服务端预览

点击行加载右侧预览。服务器代理,删除 scripts/styles/标签,返回最多
8 KB 纯文本。

预览代理**逐跳 SSRF 验证**手动行走重定向。3 跳上限,15 秒超时。

### 行操作

- **▶** — 跳转 `#/evaluate?url=…`。
- **✕** — 从 pipeline 删除。

### 顶部按钮

- **⚡ Evaluate first** — 在 Evaluate 中打开第一个 URL。
- **Scan** — 回到扫描器。

---

## 9. Evaluate (`#/evaluate`)

针对 `cv.md` 和 `config/profile.yml` 给 JD 评分。返回 `modes/oferta.md`
的 A–G 评估和 0–5 分。

### 输入

把 JD 粘贴到 textarea,或从 `#/pipeline` 用 `?url=…` 到达。

**💾 Save JD** 持久化到 `jds/jd-<date>-<ts>.txt`。

### 回退链

1. **Anthropic** — 设置了 `ANTHROPIC_API_KEY` 时优先。
   `bundleProjectContext` 把 cv + profile + `_shared.md` +
   `oferta.md` 内联到 `<project_context>` 块。每文件 16 KB cap,
   prompt soft-cap 200 KB。
2. **Gemini** — 仅 `GEMINI_API_KEY` 时。spawn `gemini-eval.mjs`。
3. **Manual** — 无密钥。页面返回可粘贴 prompt。

### 输出

A. Role Summary · B. CV Match · C. Risks · D. Compensation · E.
Application Strategy · F. Verdict (0.1 精度 0–5) · G. Posting
Legitimacy。

**💾 Save report** 把 markdown 持久化到
`reports/<date>-<company>-<role>.md`。

---

## 10. Reports (`#/reports`)

浏览每个保存的评估。卡片显示标题、日期、legitimacy 标志、分数
(绿 ≥ 4.0,黄 ≥ 3.0,红更低)。每页 12 个。

单个报告视图: **← All reports**、**🔗 Open JD**。

---

## 11. Tracker (`#/tracker`)

CRM。一行 = 一次申请。位于 `data/applications.md` 的 GFM 表格。

### 状态流

`Evaluated` → `Applied` → `Responded` → `Interview` → `Offer` /
`Rejected` / `Discarded` / `SKIP`。白名单服务端强制。

### 列

| 列 | 内容 |
|---|---|
| `#` | 自动编号。 |
| `Date` | ISO。 |
| `Company` | 自由文本。**管道符和换行符自动转义。** |
| `Role` | 同上。 |
| `Score` | `N/5`。 |
| `Status` | 白名单。 |
| `PDF` | 成功后 ✅。 |
| `Report` | `reports/*.md` 链接。 |
| `Notes` | 自由文本,最多 200 字符。 |

### 过滤

Status、Score (`≥ 4.0`/`≥ 3.0`/`< 3.0`)、Search。每页 25 行。

### 维护

- **▶ Normalize** / **▶ Dedup** / **▶ Merge**。

---

## 12. Deep research (`#/deep`)

生成结构化公司简报: snapshot、工程文化、近期新闻、Glassdoor 情绪、
面试流程、谈判杠杆点、对招聘者提的三个聪明问题。

### 输入

公司 + (可选) 角色。`modes/deep.md` 模板决定结构。

### 输出路径

与 Evaluate 相同的回退链:

1. **Anthropic 实时** (优先) — `bundleProjectContext` 内联 cv +
   profile + `_shared.md` + `deep.md`。10–30 KB grounded markdown
   保存到 `interview-prep/<company>-<role>.md`。
2. **Gemini 实时** — `gemini-eval.mjs`。
3. **Manual prompt** — 给 Claude Code 用的 prompt (用 WebFetch +
   WebSearch 做真正的研究)。

### 提示

- Anthropic `claude-sonnet-4-6` 通常 1–3 分钟返回 ~13 KB。
- Anthropic SDK 没有内置 web search。新闻新鲜度需要时,把 manual
  prompt 粘到 Claude Code。
- 实时调用收费;一次 Sonnet 4.6 deep-research 约 $0.30–0.50。

---

## 13. Mode prompts (七个 `/#/<mode>` 页面)

七个 prompt builder: **Project** 想法、**Training** 计划、
**Follow-up** 邮件、**Batch** 评估、**Outreach** 给招聘者、
**Interview prep** one-pager、**Patterns** 回顾。每个包装一个
`modes/<slug>.md` 模板:

| 页面 | Slug | 用途 |
|---|---|---|
| `#/project` | `project` | 为目标角色定制 portfolio 项目。 |
| `#/training` | `training` | 技能差距分析 → 课程。 |
| `#/followup` | `followup` | 面试后邮件草稿。 |
| `#/batch` | `batch` | 多 JD 批量评估 prompt。 |
| `#/contacto` | `contacto` | 给招聘者 / 推荐人的 outreach 消息。 |
| `#/interview-prep` | `interview-prep` | 特定轮次的 one-pager。 |
| `#/patterns` | `patterns` | "什么模式让我成功?" |

### 共同形态

每个页面: 小表单 + **▶ Generate prompt** (manual) + **⚡ Run live**
(有密钥时为 primary)。

**▶ Generate prompt** → 返回组装的 prompt,把表单值 JSON 化在
`User-supplied context:` 块中。

**⚡ Run live** → 把同一 prompt 发给 Anthropic (或 Gemini),cv +
profile + `_shared.md` 通过 `bundleProjectContext` 内联。结果在页面
渲染、可复制、可下载为 `.md`。

---

## 14. Apply checklist (`#/apply`)

决定申请后,Apply helper 页面生成提交清单。**不会**自动填表 — 那个
流程留在 Claude Code 的 `/career-ops apply` (用父的 Playwright)。

清单覆盖:

0. 在 Claude Code 运行 `/career-ops apply <url>`。
1. 验证 posting 仍在线 (`check-liveness.mjs`)。
2. 确认 CV 是最新 (`cv-sync-check.mjs`,score ≥ 4.0 时 PDF)。
3. 用 `cv.md` 的 STAR+R proof point 定制 cover letter / "Why us?"。
4. 诚实回答 EEO / 担保 / 起始日期问题。
5. 提交前把答案保存到 `interview-prep/{company}-{role}.md`。
6. **绝不自动提交** — 你 (人类) 点击最终按钮。
7. 提交后: 在 `data/applications.md` 加行。

---

## 15. 面试准备

post-research、pre-interview 阶段。这个应用的三件物品汇集:

1. **保存的 deep-research 文件** — `interview-prep/`,每个 company-
   role 对一个。从 Deep research 浏览。
2. **Patterns mode** (`#/patterns`) — "在我最近 N 次面试 / offer /
   拒绝中什么模式持续?" 累积 5+ tracker 行后有用。
3. **Interview-prep mode** (`#/interview-prep`) — 为特定即将到来的
   轮次 (behavioral、technical、system design) 预填充 one-pager。

### 推荐工作流

每次面试:

1. 前一天**重新运行 Deep** (或打开保存的文件)。
2. **`#/interview-prep`** — 为特定轮次生成 one-pager。
3. **System design / coding 轮次** — 打开 `#/training`,要求 30
   分钟针对性 refresher。
4. **Compensation 轮次** — 打开 deep-research 文件,跳到
   "Negotiation leverage points"。带 2–3 个数据点 (Glassdoor 范围、
   最近融资、其他公司可比 offer)。
5. **Behavioral 轮次** — 从 `cv.md` 拉出 STAR+R 故事,落入原始
   Evaluate 报告的 B 节。

面试后立即:

1. 更新 tracker 行: status → `Responded` (然后 `Interview`、
   `Offer` 等)。
2. 运行 `#/followup` 起草感谢邮件。
3. 如有新情报 (薪酬范围、团队构成、tech stack 意外),用
   `## Post-round notes` 编辑保存的
   `interview-prep/<company>-<role>.md`。

---

## 16. Activity 日志 + 故障排除

### Activity 日志 (`#/activity`)

到达服务器的每个状态更改请求的审计日志。秘密
(`ANTHROPIC_API_KEY`、`GEMINI_API_KEY`) 在写入时被编辑 —
你永远不会在 `data/activity.jsonl` 中看到真实密钥值。

按操作前缀过滤 (`pipeline.`、`cv.`、`evaluate`、`scan.`)。每页 25
行;服务器最多返回 500 个最近事件。

### 故障排除

| 症状 | 可能原因 | 解决 |
|---|---|---|
| Health 在 `cv.md` 红色 | 首次运行,文件不存在 | `touch $CAREER_OPS_ROOT/cv.md`,刷新。 |
| Health 在 `Profile customized` 红色 | `full_name` 仍是 `Jane Smith` | 编辑 `config/profile.yml`。 |
| `hh.ru: HTTP 403` | 非俄罗斯 IP,无 `HH_USER_AGENT` | 在 `dev.hh.ru/admin` 注册,设置 `HH_USER_AGENT`。 |
| `gemini-eval.mjs: ERR_MODULE_NOT_FOUND` | 父 deps 未安装 | `cd $CAREER_OPS_ROOT && npm install`。 |
| Generate PDF 错误 | Playwright 未安装 | `npx playwright install chromium`。 |
| 服务器 `EADDRINUSE: 4317` | 旧实例运行 | `pkill -f 'node server/index.mjs'`。 |
| 实时 LLM 调用 > 2 分钟挂起 | prompt 巨大或 Anthropic 慢 | soft-cap 200 KB → 413。 |
| Pipeline 预览 `(unsafe redirect)` | posting 重定向到私有 IP / loopback | 安全特性 (REVIEW-B1)。 |
| Tracker 行破坏表格 | v1.9.1 之前的管道 | 升级到 v1.9.1+ (BF-1)。 |
| `npm test` 在新克隆失败 | 测试假设父布局 | `CAREER_OPS_ROOT=$(mktemp -d)`。 |

深度诊断: 在 Health 上运行 **▶ Doctor**,复制输出,在
<https://github.com/Fighter90/career-ops-ui/issues> 搜索 issue。
