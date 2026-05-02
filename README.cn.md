# career-ops-ui

> 用于 [career-ops](https://github.com/santifer/career-ops) AI 求职流水线的 Airbnb 风格 Web 界面。
> 在单个浏览器标签中搜索、评估、深入研究、申请和跟踪每个职位 — 而不是在 Claude Code、终端和 markdown 文件之间来回切换。

[English](README.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko-KR.md) | [日本語](README.ja.md) | [Русский](README.ru.md) | **简体中文** | [繁體中文](README.zh-TW.md)

[![tests](https://img.shields.io/badge/tests-87%20passed-brightgreen)](README.md#tests)
[![node](https://img.shields.io/badge/node-%E2%89%A518-blue)](README.md#requirements)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

![career-ops-ui — vacancy search](./screen_vacancy_found.png)

## 一键安装

```bash
curl -fsSL https://raw.githubusercontent.com/Fighter90/career-ops-ui/main/bin/setup.sh | bash
```

此命令克隆两个仓库 (career-ops + career-ops-ui),安装依赖,并在 http://127.0.0.1:4317 启动服务器。

## 为什么?

[career-ops](https://github.com/santifer/career-ops) 是一个强大的基于 Claude Code 的求职系统:粘贴 JD → 获得 0-5 适配评分、ATS 优化的 PDF 和跟踪器条目。在 Claude Code 内部运行良好,但数据分散在 `cv.md`、`data/applications.md`、`reports/*.md`、`data/pipeline.md`、`portals.yml`、`config/profile.yml` — 容易丢失,难以浏览。

`career-ops-ui` 在其上添加一个精致的 UI:

- **浏览** — 像 CRM 一样浏览跟踪器、报告和流水线。
- **触发** — 触发扫描 (Greenhouse / Ashby / Lever **以及** hh.ru / Habr Career) 并查看实时 SSE 日志。
- **评估** — 通过 Gemini API 评估 JD 或获取 Claude 的复制粘贴 prompt。
- **编辑** — 使用并排 markdown 预览编辑 `cv.md`。
- **维护** — doctor、verify、normalize、dedup、merge — 每个一键完成。

纯加法:`career-ops/` 内部不会更改任何内容。你的自定义保持不变。

## 各页面功能

| 页面             | 功能                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Dashboard**    | 聚合计数 (apps / pipeline / reports)、平均分、按状态分类、最新 5 个 apps + 最新报告。                                       |
| **Scan**         | **两个扫描器:** 🌍 EN scan (Greenhouse/Ashby/Lever, 24+ 已验证 board) + 🇷🇺 RU scan (hh.ru API + Habr Career HTML 抓取)。实时 SSE 日志 + 带 stack/level chip 过滤器和 location / Remote-Hybrid / reloc / source 过滤器的可点击结果表。 |
| **Pipeline**     | 对 `data/pipeline.md` 进行 CRUD。从 URL 直接跳转到评估。                                                              |
| **Evaluate**     | 粘贴 JD → 如果设置了 `GEMINI_API_KEY`,运行 `gemini-eval.mjs`;否则返回 Claude 的复制粘贴 prompt。                       |
| **Deep research**| 为指定的公司/角色生成完整的 `modes/deep.md` prompt。                                                                  |
| **Apply helper** | 生成申请清单;实际的 Playwright 表单填写仍在 Claude Code 中的 `/career-ops apply` 中。                                    |
| **Tracker**      | `data/applications.md` 上的可过滤表 (状态、分数、自由文本)。normalize/dedup/merge 一键按钮。                            |
| **Reports**      | 浏览和阅读 `reports/` 中的每个报告,带解析的 header (Score / Legitimacy / URL)。                                       |
| **CV**           | `cv.md` 的实时 markdown 编辑器,带并排预览 + sync-check。                                                              |
| **Profile**      | `config/profile.yml` + 原型的只读视图。                                                                              |
| **Health**       | 所有 setup 检查在 OK / OPTIONAL / FAIL 徽章中 + 运行 `doctor.mjs` 和 `verify-pipeline.mjs` 的按钮。                       |

## 要求

| | |
| --- | --- |
| **Node.js** | ≥ 18 |
| **career-ops** | 已克隆并 onboard |
| **可选** | `.env` 中的 `GEMINI_API_KEY` 用于一键 JD 评估 |
| **可选** | 如果在俄罗斯境外运行并希望 hh.ru API 停止返回 403,请使用 `.env` 中的 `HH_USER_AGENT` |

## stack 和 level 的 chip 过滤器

职位表包含以下内容的 multi-select chip:

- **Stack:** PHP, Symfony, Laravel, Go, Rust, Node.js, TypeScript, Python, Ruby, Java, C#/.NET, C++, Backend, Frontend, Fullstack, Microservices, High-load, Distributed, DevOps/SRE, Data, ML/AI, Mobile, Security, Database, Cloud, API
- **Level:** Lead/Tech Lead, Architect, Manager, Principal/Staff, Senior, Middle, Junior

每个类别内多选 (OR),类别之间交集 (AND)。显示计数;只显示有结果的 chip。

## 完整文档

完整架构、API 参考、高级配置和安全注释 — 请参阅 [英文 README](README.md)。

## 许可证

MIT。基于 [santifer](https://santifer.io) 的 [career-ops](https://github.com/santifer/career-ops) 构建。

---

## 🌍 Getting Started — 安装后的第一步

一键安装后,你有两个克隆的仓库和脚手架文件 (`cv.md`、`config/profile.yml`、`portals.yml`、`data/applications.md`、`data/pipeline.md` — 带 **EDIT ME** 标记)。首次启动时 Health 页面应全部为绿色。用真实数据替换占位符:

### 1. 创建 CV (`cv.md`)

- **A — 粘贴现有简历** 到 `career-ops/cv.md` 中,使用干净的 markdown。
- **B — 从 UI 上传:** 点击 **CV** → **📁 上传简历** → 选择 `.md`/`.txt` → 检查预览 → 点击 **💾 保存**。
- **C — 将 LinkedIn 给 Claude Code:** 在 Claude Code 中运行 `/career-ops`,请求「提取我的 CV 并写入 cv.md」。

### 2. 个人资料 (`config/profile.yml`)

替换占位符:姓名、邮箱、位置、LinkedIn、目标角色、**archetypes** (最重要)、薪资范围。

### 3. 扫描器 (`portals.yml`)

调整 `title_filter.positive`/`negative`。已预设 3 个 board (GitLab、Vercel、Linear)。更多内容:[`docs/portals-examples.md`](docs/portals-examples.md)。

### 4. (可选) Gemini API key

```bash
echo "GEMINI_API_KEY=your-key" >> career-ops/.env
```

### 5. 验证并开始

Health → 全部为绿。**🌐 搜索所有来源** → 带 chip 过滤器的表格 → 复制 URL → **Pipeline** → **Evaluate**。

完整文档 (架构、API、安全):[英文 README](README.md)。
