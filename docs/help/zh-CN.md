# 帮助 — career-ops-ui

每个页面的逐步指南。名称与左侧栏菜单一致。

---

## 1. 快速开始

5 分钟完成全流程:

1. **CV** (`#/cv`) — 粘贴或上传 Markdown 简历。点击 **💾 保存**。
2. **配置** (`#/settings`) — 编辑 `config/profile.yml`: 姓名、邮箱、目标薪资、地点。
3. **Health** (`#/health`) — 检查所有必需卡片是否绿色。可选项 (Gemini / Anthropic / HH_USER_AGENT) 仅在使用相应功能时需要。
4. **Scan** (`#/scan`) — 点击 **🌐 Scan all** 抓取所有启用的招聘网站。或通过 Ctrl+K → Enter 粘贴单个 URL。
5. **Pipeline** (`#/pipeline`) — 查看扫描器入队项。点击任一 URL → 右侧预览。点击 **▶ Evaluate** 与 CV 对比打分。
6. **Tracker** (`#/tracker`) — 所有评估到这里。按分数、状态、文本过滤。生成定制 PDF、申请、更新状态。

---

## 2. CV (`#/cv`)

每次评估的真实来源。按钮: **📁 Upload CV**、**sync-check**、**📄 Generate PDF**、**💾 保存**。右侧实时预览。

## 3. 配置 (`#/settings`, 也可 `#/profile`)

显示解析后的 `config/profile.yml`。直接在磁盘编辑;重载捕获更改。Health 页 **Profile customized** 检查会标记 `Jane Smith` 等模板值。

## 4. Scan (`#/scan`)

招聘网站爬虫。**🌐 Scan** runs everything (需要 `HH_USER_AGENT`)。按文本、远程/混合/搬迁、来源、技术/级别 chip 过滤。

## 5. Pipeline (`#/pipeline`)

URL 收件箱。通过 input + **+ Add** 或 Ctrl+K 添加。点击 URL → 右侧 server-side 预览。行操作: **▶** Evaluate, **✕** Delete。实时过滤 + 计数器。

## 6. Evaluate (`#/evaluate`)

将 JD 与 `cv.md` + `profile.yml` 对比打分。无 API key → Claude Code 的 manual prompt;设置 `ANTHROPIC_API_KEY`/`GEMINI_API_KEY` → 服务器端执行并渲染 Markdown。**💾 Save JD** 归档到 `jds/*.txt`。

## 7. Deep research (`#/deep`)

公司简报: 团队、文化、新闻、谈判杠杆、聪明问题。**⚡ Run live** 执行 + 保存到 `interview-prep/{slug}.md`。**▶ Generate prompt** 生成手动 prompt;**显示结果** 配置 key 后重新运行。

## 8. Apply checklist (`#/apply`)

可粘贴清单。真实表单填写仅在 Claude Code 中: `/career-ops apply <url>`。

## 9. Tracker (`#/tracker`)

申请登记 — `data/applications.md`。按状态 / 分数段 / 文本过滤。按钮: **Normalize**、**Dedup**、**Merge TSV**。

## 10. Reports (`#/reports`)

`reports/` 下所有 A-G 报告。点击渲染 Markdown (XSS 安全)。

## 11. Modes (`#/project`、`#/training`、`#/followup`、`#/batch`、`#/contacto`、`#/interview-prep`、`#/patterns`)

7 个专门 prompt-builder。相同 UX: 填表单 → **▶ Generate prompt** 或 **⚡ Run live** (有 key 时) → Markdown / 📋 Copy / ⬇ Download。

| 模式 | 生成内容 |
|---|---|
| **Project** | 作品集构想的 scope + signal-fit 反馈。 |
| **Training** | 决定课程/认证是否值得时间投入。 |
| **Follow-up** | 申请节奏: 何时催促、说什么。 |
| **Batch** | `batch/run.mjs` 用 prompt — 并行评估。 |
| **Outreach** | LinkedIn 外联: 找到合适联系人 + 起草信息。 |
| **Interview prep** | 面试阶段特定准备。 |
| **Patterns** | 过往申请的反复弱点模式。 |

## 12. Activity (`#/activity`)

每个状态变更 API 调用的审计日志。`data/activity.jsonl`。按操作 prefix chip 过滤。5 MB 自动轮转。

## 13. Health (`#/health`)

设置诊断。绿 = 就绪、黄 = 可选缺失、红 = 必需缺失。**Doctor** + **Verify** 按钮。

## 14. 配置提示

- **`.env`** — 从 `.env.example` 复制。`ANTHROPIC_API_KEY`/`GEMINI_API_KEY` 启用实时执行。`HH_USER_AGENT` 用于 hh.ru。
- **语言切换** 在 sidebar footer — 8 locales,持久化到 localStorage。
- **Ctrl+K** 聚焦全局搜索。URL → Enter → pipeline。文本 → Enter → tracker。
- **Esc** 关闭打开的模态。
