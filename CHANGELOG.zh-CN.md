# 变更日志

**career-ops-ui** 的所有重要变更。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/),版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。

翻译: [English](CHANGELOG.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt-BR.md) · [한국어](CHANGELOG.ko-KR.md) · [日本語](CHANGELOG.ja.md) · [Русский](CHANGELOG.ru.md) · [繁體中文](CHANGELOG.zh-TW.md)

> **i18n 注释** — 从 v1.12.0 起,各条目按语言本地化。之前的条目(v1.11.x、v1.10.x)按项目惯例保留俄文;规范英文正文在 [CHANGELOG.md](CHANGELOG.md)。

---

## [1.19.0] — 2026-05-13

**WCAG 1.4.3 contrast + scan unification (final) + HH_USER_AGENT removed from UI.** Closes the v1.18 out-of-scope contrast audit, finishes the EN/RU split elimination begun in v1.18, and removes the `HH_USER_AGENT` configuration knob from the UI per user direction (a sensible default bundled in the server already handles non-RU IPs for most users).

### ♿ WCAG 1.4.3 contrast pass

- **`a11y(contrast): introduce AA-passing *-text variants for accent tokens`** — light theme: `--rausch-text: #b80f42` (6.59:1 on white, was 3.52:1), `--kazan-text: #066507` (7.31:1, was 4.53:1), `--darjeeling-text: #7a5800` (5.73:1 on amber bg, was 4.24:1), `--babu-text: #00665e` (6.09:1, was 2.70:1). Dark theme: lightened mirrors (`#ff8aa0`, `#6ee7b7`, `#fcd34d`, `#5eead4`) hit the same 4.5:1 floor on `#161a22` paper.
- Badge classes (`.badge-ok`, `.badge-warn`, `.badge-bad`, `.badge-info`) and score pills (`.score-high`, `.score-mid`, `.score-low`) now route through the new `*-text` variants — every text-on-tinted-bg combo passes AA. The accent fill tokens (`--rausch`, `--kazan`, etc.) stay unchanged for borders and outlines (which only need 3:1 for non-text UI components).

### 🧹 Scan unification (finishes v1.18 work)

- **`docs(scan): scrub remaining EN/RU split references across READMEs + help + architecture docs`** — eight READMEs + eight help bundles + three architecture docs (API.md, SERVER.md, OVERVIEW.md, DATA-FLOWS.md) + scan.js comment now describe a single consolidated scan method. The legacy `/api/stream/scan-{en,ru}` aliases were already gone in v1.18; v1.19 catches the doc/copy that still framed scanning as a two-step EN+RU process.
- **`feat(scan): canonical /api/scan/regional/config endpoint`** — `/api/scan-ru/config` kept as a thin alias through one release for back-compat. The new path matches the source-naming convention (`?source=regional`).

### 🛠️ HH_USER_AGENT removed from UI

- **`feat!(config): drop HH_USER_AGENT field from /#/config + KNOWN_KEYS`** — power users can still set `HH_USER_AGENT` directly in `career-ops/.env` (the server reads via `process.env.HH_USER_AGENT` in `server/lib/sources/hh.mjs` with the bundled UA as fallback). The UI no longer exposes it because the default works for most users and seeing an inscrutable User-Agent field in the App Settings page was a recurring source of confusion.
- README mentions across 8 locales + help bundle mentions across 8 locales replaced with "run via a Russian IP / VPN" advice. The `scan.hhWarning` i18n key was rephrased to drop the env-var setup detail.
- `KEY_GROUPS` collapsed: no more `regional` classification (it only had HH_USER_AGENT). Tests updated; `regionalActive` payload field preserved for SPA back-compat.

### 🧪 Tests

- `tests/env-config.test.mjs` — `KNOWN_KEYS` assertion now excludes HH_USER_AGENT; new assertion that the key is intentionally absent.
- `tests/config-endpoint.test.mjs` — POST-write multi-key test uses `GEMINI_MODEL` as the second known key instead of HH_USER_AGENT.
- `tests/config-groups.test.mjs` — `groups.HH_USER_AGENT` is now expected `undefined`.
- Total: **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + 32/32 Playwright. Same counts as v1.18.0 because every adjusted test was already counted.

### Verification

```bash
npm test                              # 427 / 427

# Contrast (Chrome DevTools or axe) on light + dark:
#   .badge-ok / .badge-warn / .badge-bad / .badge-info → AA pass (4.5:1+)
#   .score-high / .score-mid / .score-low → AA pass

# HH_USER_AGENT no longer in /api/config:
curl -s http://127.0.0.1:4317/api/config | jq '.values | keys'
# → ["ANTHROPIC_API_KEY","ANTHROPIC_MODEL","GEMINI_API_KEY","GEMINI_MODEL","HOST","PORT"]
# (no HH_USER_AGENT)

# Canonical regional config endpoint:
curl -s http://127.0.0.1:4317/api/scan/regional/config | jq '.'
# Legacy alias still alive through v1.20:
curl -s http://127.0.0.1:4317/api/scan-ru/config | jq '.'
```

### Out of scope (v1.20+)

| Item | Notes |
|---|---|
| Per-component touch-target audit (filter chips, sortable headers, sidebar nav) | v1.18 set the global floor (`.btn` 44 px, `.btn-sm` 32 px); per-component verification across the SPA remains. |
| `aria-describedby` on inline form hints (`#/config`, `#/pipeline`, `#/evaluate`, `#/batch`) | v1.17 covered `aria-label` on global search + modal close. Per-input hint association is the next polish layer. |
| Full non-EN README parity (585 lines like EN) | v1.18 brought non-EN to ~307 (53 % of EN). Marketing-heavy "Quick start" + "🌍 Getting Started" walkthroughs remain EN-only. |
| Remove `/api/scan-ru/config` legacy alias | Sunset planned for v1.20. The canonical `/api/scan/regional/config` is the migration target. |

---

## [1.18.0] — 2026-05-13

**Scan 端点合并 + WCAG 2.2 AA 通过 + i18n long-tail 完成。** 退役遗留 `/api/stream/scan-{en,ru}` 别名(Sunset 窗口 2026-10-01 根据用户指示提前到 v1.18)。把 non-EN README 提到 ~307 行,并在 6 个 locale 中翻译剩余的 v1.16.0 + v1.17.0 CHANGELOG RU-bodied 条目。

### 🚪 Breaking

- **`feat!(scan): retire legacy /api/stream/scan-{en,ru} aliases`** — 已弃用的 EN/RU 拆分 SSE 端点已移除。每个消费者通过合并的 `/api/stream/scan?source=ats|regional|both` 端点(自 v1.12.0 起活动)。外部集成现在在旧路径上获得清洁的 **404**,而不是被静默路由到 SPA catch-all。

### ♿ 无障碍 (WCAG 2.2 AA 通过)

- **WCAG 2.4.1 Bypass Blocks** — 每页第一个 focusable 的新 **Skip to main content** 链接。
- **WCAG 2.4.7 Focus Visible** — 全局 `*:focus-visible` 样式。
- **WCAG 2.5.5 Target Size** — `.skip-link` 的最小 44×44 px 触控目标。`.btn-sm` 保持 32 px min-height。
- **WCAG 3.1.1 Language of Page** — `<html lang="en">` 从 `lang="ru"` 修正。
- **WCAG 1.3.1 Info & Relationships** — `#content` 获得 `tabindex="-1"`。

### 📚 i18n long-tail

- **`docs(i18n): 在 6 个 locale 中翻译 v1.16.0 + v1.17.0 CHANGELOG`** — 每 locale 的 RU 字符数 79 → 42 → 23。
- **`docs(readme): 用 Why / Requirements / Features / Configuration / Contributing 扩展 non-EN README`** — 每个 non-EN README 从 240 增长到 ~307 行。

### 🧪 测试

- 总计 **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + 32/32 Playwright。

---

## [1.17.0] — 2026-05-13

**Polish + a11y + CI 修复。** 关闭 v1.16.0 REVIEW 的 9 个 follow-up: 浏览器 smoke 验证、README 徽章 truth、coverage 刷新、SPA 中的 `lastWorkdayFallback` 🔒 chip、v1.16 UX 变更后完整 E2E 重新基线、Playwright auto-pipeline 场景、a11y ARIA + focus trap 通过、6 个 locale 中历史 CHANGELOG 压缩、带参考章节的 non-EN README 扩展。

### 🐛 Fixes

- **`fix(e2e): smoke + comprehensive 与 v1.16 UX 重新对齐`** — v1.16 的 Cmd+K Enter → AutoPipeline modal 变更使 e2e 测试的 `search.press('Enter')` 打开一个 modal,其 backdrop 拦截后续点击。测试现在使用 `Shift+Enter` 用于 legacy quick-add 路径。**这就是 v1.16.0 push 上的 CI 失败** — Playwright e2e 在被 backdrop 拦截的点击上 30 秒超时。
- **`fix(mode-page): /#/batch-prompt → modes/batch.md 经 serverSlug`** — v1.15 将 legacy mode slug 重命名为 `batch-prompt`,但服务器 `POST /api/mode/:slug` 在寻找不存在的 `modes/batch-prompt.md`。新 `serverSlug` 字段将路由 hash 与父项目的 mode 文件名解耦。
- **`chore: 将 deprecation 消息从 v1.16.0 → v1.17.0 bump`** — scan-en/scan-ru deprecation 文案和 batch-prompt 横幅引用了过去的版本。

### ✨ Features

- **`feat(scan): Active Companies 卡片中的 🔒 Workday CAPTCHA chip`** — v1.16 PR-7 的 server-side `lastWorkdayFallback` export 现在被 SPA 消费。`/api/scan-results` 返回 snapshot;当 Workday tenant 落入 fallback 时,`#/scan` 在 Active Companies 上方渲染 warn-tinted 卡片("🔒 Workday tenant blocked — fallback: 使用 /career-ops scan (Playwright)")。新 `getLastWorkdayFallback()` exporter 避免 ESM live-binding 模糊。2 个新 i18n 键 × 8 locales。

### ♿ 无障碍

- **`a11y: ARIA roles + focus management 通过`** —
  - `index.html`: `<aside>`(navigation)、`<header>`(banner)、`<section id="content">`(main)、`<div id="modal">`(带 aria-modal/aria-labelledby 的 dialog)、`<div id="toast">` + `#conn-banner`(带 aria-live 的 status)、`<div class="searchbar">`(search) 上的 `role` 属性。
  - `#sidebar-toggle` 获得 `aria-controls="sidebar"` + 由 JS 在 open/close 时同步的 `aria-expanded`。
  - `#global-search` 获得 visually-hidden `<label>` 加上显式 `aria-label`,后者 surface Cmd+K shortcut 提示。
  - Modal 关闭 (×) 获得 `aria-label="Close dialog"`。
  - 装饰性 backdrop 获得 `aria-hidden="true"`。
  - **Modal 焦点陷阱** — `UI.modal()` 记住点击所有者,在 open 时聚焦第一个 non-close focusable,并在 modal 内循环 Tab/Shift+Tab。`UI.closeModal()` 将焦点恢复到先前的所有者。
  - `public/css/app.css` 中的新 `.visually-hidden` utility 类(WAI-ARIA AP 标准模式)。

### 📚 文档

- **`docs(readme): 跨 8 个 README 的徽章 truth`** — tests 徽章 `284 / 379 / 360` → **427**; release 徽章 `v1.9.1 / v1.13.0` → **v1.16.0** 然后 → v1.17.0。
- **`docs(readme): 用参考章节扩展 7 个 non-EN README`** — 每个增长 170 → ~240 行,以原生语言添加 Architecture / API / Security / Tests / A11y / Limitations / License 章节。
- **`docs(changelog): 在 6 个 locale 中压缩 pre-v1.12 条目`** — 长 RU-bodied v1.11.x + v1.10.x 条目现在被替换为每个 locale 原生语言的紧凑 "Earlier releases" 执行摘要。详细历史保留在 `CHANGELOG.md` (EN) 中。

### 🛠️ Tooling

- **`coverage: 刷新数字`** — 最后发布是 95.46% line / 84.06% branch (v1.13.0 REVIEW)。v1.17 基线: **94.14% line / 82.98% branch / 93.20% function**。auto-pipeline + reports-write 中新错误路径导致轻微下降;仍远高于 CLAUDE.md 的 80% 下限。

### 🧪 测试

- 总计 **427 / 427** unit + 20/20 smoke E2E + 23/23 comprehensive E2E + **32 / 32** Playwright (此前 28;+4 个新 auto-pipeline 场景)。
- E2E 套件与 v1.16.0 UX 重新对齐 (Shift+Enter quick-add, /#/batch-prompt 用于 legacy mode)。

### Out of scope (v1.18+)

| 项 | 说明 |
|---|---|
| 在 non-EN CHANGELOGs 中翻译 v1.16.0 条目 | 当前 RU-bodied。 |
| 完整 non-EN README 对等(像 EN 一样 585 行) | v1.17 把 non-EN 提到 ~240;营销重的章节仍仅 EN。 |
| 完整 WCAG 2.2 AA 审计 | v1.17 涵盖结构 ARIA + focus trap;按组件 contrast/Tab-order 审计待办。 |

---

## [1.16.0] — 2026-05-13

**Auto-pipeline 完结 + 适配器抛光 + i18n long-tail。** 关闭 v1.15.0 REVIEW 的 11 个 follow-up: server-side SSE auto-pipeline、`POST /api/reports` primitive、Cmd+K shortcut、SmartRecruiters 分页、Workday CAPTCHA-fallback、CI screenshot-drift gate、scan source filter UX、历史 CHANGELOG 翻译(v1.13.0/v1.12.0 × 6 语言)、non-EN README 扩展、paste-ready trending-companies importer。

### ✨ 功能

- **`feat(auto-pipeline): server-side SSE orchestrator`** (#1, #2, #3, #8) — v1.15 的 client-side chained-fetch orchestrator 已删除。`POST /api/auto-pipeline` 现在是 curl 可用的 SSE 端点,在服务器端实时执行 validate → fetch JD → evaluate → save report → tracker,带实时 step 事件。慢速 Anthropic 调用(30–90 秒)现在发出 `running` 事件而非通用 spinner。失败带 `step` + `message` 发出 `error`。orchestrator 还将 report markdown 持久化到父 `reports/<slug>.md`(v1.15 中丢失)。
- **`feat(reports): POST /api/reports primitive`** — `server/lib/routes/reports.mjs` 中的新 writer。带 path-traversal guard 的 slug 净化。1 MB cap (413)。无 `overwrite:true` 时对 existing file 返回 409。经 `stripDangerousMarkdown` 的 atomic write。activity.reports.save 日志。测试: 9 案例。
- **`feat(app): Cmd+K paste URL → auto-pipeline`** — 在 global search 粘贴 URL + Enter 现在以 `autoStart=true` 打开 AutoPipeline modal。Shift+Enter 保留 legacy "add to pipeline only" 路径。
- **`feat(portals): SmartRecruiters 分页`** (#4) — `server/lib/sources/smartrecruiters.mjs` 通过 `?limit=100&offset=N` 遍历页面,直到达到 `totalFound` 或返回空页面或触发 30 页 / 3000 jobs 安全上限。大型 boards 不再丢失 postings 的尾部。测试: 6 案例。
- **`feat(portals): Workday CAPTCHA-fallback graceful`** (#7) — `server/lib/sources/workday.mjs` 不再在 4xx / non-JSON / network 错误时抛出。返回 `[]` 并注释新 export `lastWorkdayFallback`。扫描器时间线继续到下一个 tenant。可通过 `strict:true` 退回 v1.14 抛出行为。测试: 7 案例。

### 🛠️ Tooling + CI

- **`ci(workflows): dashboard-screenshots drift gate`** (#5) — 新 `.github/workflows/dashboard-screenshots.yml`。在触及 `public/css/app.css`、`public/js/views/dashboard.js`、`public/js/lib/i18n.js` 或 `public/index.html` 的 PR 上,workflow 在 /tmp scaffold 上 boot server,通过 Playwright + chromium 重新生成 8 个 hero PNG,如果结果与 commit 的内容 drift 则构建失败。
- **`feat(scripts): import-trending-companies.mjs`** (#11) — 通过其真实 boards-API 验证 `docs/portals-examples.md` 中的 13 trending 公司,并输出可粘贴到父 `portals.yml::tracked_companies` 的 YAML。slug 404 的候选会被打上 `enabled: false`。通过 `npm run import:trending` 运行。
- **`feat(scripts): npm run capture:dashboards`** — 将 `scripts/capture-dashboard-screenshots.mjs` 公开为顶级 script。

### 🎨 UX

- **`fix(scan): 合并的 source-filter 下拉菜单`** (#6) — `#/scan` source 下拉菜单从 v1.14 adapter registry 重建: 6 ATSes + hh.ru + Habr Career,字母排序,无 geo 前缀。`runEnScan`/`runRuScan` 现在击中合并的 `/api/stream/scan?source={ats,regional}` 端点。

### 📚 i18n long-tail

- **`docs(i18n): 在 6 语言中翻译 v1.13.0 + v1.12.0 CHANGELOG`** (#9) — 之前 RU-bodied 的条目现在在其真实 locale 中。每个 non-EN/non-RU CHANGELOG 也获得 i18n 说明,解释 pre-v1.12 条目按项目约定保留 RU。
- **`docs: 以 v1.16.0 highlights 部分扩展 non-EN README`** (#10) — 7 个 non-EN README 获得约 35 行的新部分,涵盖: 一键 auto-pipeline + curl 示例、SmartRecruiters 分页、Workday fallback、scan source-filter UX、importer 脚本、CI screenshot workflow。

### 🧪 测试

- 新 `tests/reports-write.test.mjs` (9 案例) — happy path、slug 净化(含 path-traversal guard)、409 冲突、overwrite 标志、XSS 剥离、缺失字段 400、>1 MB 413、GET/POST round-trip。
- 新 `tests/auto-pipeline.test.mjs` (5 案例) — SSE framing、无效 URL gate、SSRF/loopback gate、无 LLM key 错误路径、`text/event-stream` Content-Type 头。
- 新 `tests/smartrecruiters-pagination.test.mjs` (6 案例)。
- 新 `tests/workday-fallback.test.mjs` (7 案例)。
- 总计 **427 / 427** 单元(此前 400;+27 净增)。0 失败。

### Out of scope (v1.17+)

| 项 | 说明 |
|---|---|
| 翻译 pre-v1.12 CHANGELOG 条目(v1.11.x, v1.10.x) | 约定保留: RU-bodied。回填需要 ~1800 行翻译;推迟。 |
| 完整 non-EN README 对等(像 EN 一样 585 行) | v1.16 每语言增加 ~35 行;完整镜像是单独的翻译 pass。 |
| SPA Active Companies 卡片的 `lastWorkdayFallback` surface | Server export 已接线;UI 消费为 v1.17。 |
| 9 个已验证 trending 的 per-company `tracked_companies` 批量添加 | `import:trending` 脚本以 1-command + 1-paste 完成。 |

---

## [1.15.0] — 2026-05-13

**Doc-conformance релиз.** Закрывает 9 из 10 открытых findings из conformance audit (`qa/conformance-vs-docs/00-CONFORMANCE-REPORT.md`) плюс локализованные hero-images. Приводит UI в соответствие с canonical career-ops.org/docs workflow — тот же pipeline что обещает CLI, теперь end-to-end через браузер во всех 8 локалях.

### ✨ Фичи

- **`feat(auto-pipeline): PR-C — 1-click "paste URL → report + PDF + tracker row"`** (G-007) — до v1.15 пользователи делали 5 ручных кликов через /#/pipeline → /#/evaluate → /#/cv → /#/tracker. Теперь одна ✨ кнопка на /#/dashboard chain'ит: validate URL → fetch JD (SSRF-safe) → evaluate против CV → generate PDF → добавить tracker row. Step-by-step modal timeline с [✓]/[…]/[✗]. Heuristic company/role extraction. Новый файл: `public/js/lib/auto-pipeline.js`. 19 новых i18n ключей × 8 локалей.
- **`feat(modes): PR-D — modes/_profile.md редактор как #/config → Modes таб`** (G-008) — канонический "Career framing" файл из Quick Start §Step-5 теперь виден в UI. Новые endpoints `GET/PUT /api/modes/_profile` с 256 KB cap, `stripDangerousMarkdown` XSS pass, scaffold из `_profile.template.md`. 9 новых i18n ключей × 8 локалей.
- **`feat(profile): PR-E — canonical schema + location + headline`** (G-009) — `/api/profile` принимает И legacy (`candidate:{...}`) И canonical (top-level `full_name`, `narrative.headline`, `target_roles.primary`, `compensation.target_range`). Legacy выигрывает при коллизии. Новый `summarizeProfile()`. /#/profile показывает `narrative.headline` как новую карточку. 2 новых i18n ключа × 8 локалей.
- **`feat(tracker): PR-B — Legitimacy колонка на #/tracker`** (G-006) — восстанавливает паритет с canonical pipeline output table. Между Status и PDF, badge-ok/warn/bad подсветка. Graceful degrade для pre-v1.15 строк. 1 новый i18n ключ × 8 локалей.
- **`fix(routing): PR-H — dedupe sidebar; #/batch → v1.13.0 TSV SPA`** (G-011) — до фикса /#/batch был ДВАЖДЫ в sidebar И оба пункта вели в legacy mode-prompt builder. v1.13.0 TSV SPA (8 KB) был недоступен. Убран дубликат; legacy переименован в `batch-prompt` с deprecation banner.

### 📚 Документация

- **`docs(evaluate): PR-A — Block A-F realignment`** (G-005) — career-ops.org/docs использует A–F (Strategy/Personalization/STAR stories в C/E/F). Мы эмитили A–G. v1.15 обновляет все 8 help bundles §9 с canonical A–F и callout о back-compat. ⚠ Parent commit ещё требуется: `santifer/career-ops::modes/oferta.md` надо переписать upstream.
- **`docs: PR-F — seniority_boost + search_queries в help §5 × 8 локалей + scaffold`** (G-010) — Help §5 во всех 8 локалях документирует третий title-filter ключ + блок-пример search_queries. `bin/setup.sh` сидит `seniority_boost: ["Senior", "Staff", "Lead"]` по умолчанию.
- **`docs: PR-I — локализованные hero images по локалям README`** — каждый из 8 README имеет locale-specific `images/dashboard-<locale>.png` (HiDPI 1440×900) сгенерированных через `scripts/capture-dashboard-screenshots.mjs`. Старый `public/images/screen_vacancy_found.png` удалён.

### 🧹 Carryover cleanups

- **`PR-G — G-001`** scan.noResults i18n: заменены 8 строк с "EN or RU scan" литералом.
- **`PR-G — G-002`** 📄 Generate PDF теперь surface'ит на #/interview-prep result panel'ях.
- **`PR-G — G-003`** `README.cn.md` → `README.zh-CN.md` (canonical locale tag).
- **`PR-G — G-004`** `/api/stream/scan-en` + `scan-ru` теперь эмитят RFC 8594 Sunset + Deprecation + Link headers (sunset 2026-10-01). Удаление в v1.16.0.

### 🧪 Тесты

- Новый `tests/profile-canonical-schema.test.mjs` (6 кейсов).
- Новый `tests/modes-profile-crud.test.mjs` (8 кейсов).
- Исправлена isolation регрессия в test fixtures: тесты теперь используют `before/after + dynamic-import` pattern, чтобы не мутировать parent `config/profile.yml`.
- Итого: **400 / 400** unit-тестов (было 386; +14). 0 падений.

### Out of scope (v1.16+)

| Item | Notes |
|---|---|
| Parent commit для canonical A–F prompt | `santifer/career-ops::modes/oferta.md` надо переписать upstream. CLAUDE.md hard rule #1 запрещает нам трогать parent. |
| Server-side `POST /api/auto-pipeline` SSE | Client-side orchestrator ships UX win; server-side даст retry-from-step-N + curl-able CI. |
| `POST /api/reports` primitive | Auto-pipeline показывает markdown inline, но не persist'ит в parent `reports/`. |
| Cmd+K paste-URL → run auto-pipeline | Defer to v1.16+. |

---

## [1.14.0] — 2026-05-13

在 v1.13.0 registry 之上新增 3 个 ATS 适配器,支持的 ATS 总数从 3 → 6 (Greenhouse / Ashby / Lever **+ Workable / SmartRecruiters / Workday-beta**)。面向用户的文档在 17 个文件中一次性从 "3 ATSes" 升级为 "6 ATSes"(42 处短语):README × 8 语言、help bundle × 8 语言、PROJECT.md。在 `docs/portals-examples.md` 中加入 13 个 trending 公司的 paste-ready YAML 块,可粘贴到父项目 `portals.yml`。

### ✨ 功能

- **`feat(portals): 3 个新 ATS — Workable, SmartRecruiters, Workday-beta`** — registry 现在解析 6 ATSes(之前 3)。新文件:`server/lib/portals/adapters/{workable,smartrecruiters,workday}.mjs`(uniform contract 薄包装器)+ `server/lib/sources/{workable,smartrecruiters,workday}.mjs`(原始 HTTP + 规范化)。
  - **Workable**:检测 `apply.workable.com/<slug>` 以及 legacy `<subdomain>.workable.com`。Endpoint:`https://apply.workable.com/api/v3/accounts/<slug>/jobs?details=true`。
  - **SmartRecruiters**:检测 `jobs.smartrecruiters.com/<slug>` 以及 `careers.smartrecruiters.com/<slug>`。Endpoint:`https://api.smartrecruiters.com/v1/companies/<slug>/postings`。
  - **Workday (beta)**:检测 `<tenant>.wd<N>.myworkdayjobs.com/<lang>/<site>`。Endpoint:POST 到 `/wday/cxs/<tenant>/<site>/jobs`。URL 无 site 时默认 `site=External`。Beta 是因为部分 tenant 用 CAPTCHA 封锁 CXS feed — fallback 到父项目 `/career-ops scan`(Playwright)。

### 📚 文档

- **`docs(portals-examples): trending boards block`** — `docs/portals-examples.md` 扩展 v1.14.0 部分,把 13 个 trending 公司列为 `tracked_companies` 的 paste-ready YAML:Greenhouse-hosted (Stripe, GitLab, HashiCorp, Cloudflare, Datadog, Hugging Face) + Ashby-hosted (Notion, Linear, PostHog, Replicate, Modal Labs, Fly.io, Render)。全部 `enabled: false` — 用户启用前自行验证 slug。还有 Workable / SmartRecruiters / Workday 示例块。
- **`docs(framing): 17 个面向用户的文件中 42 处 ATS 短语更新`** — 用户文档中每处 "Greenhouse / Ashby / Lever" 现在显示为 "Greenhouse / Ashby / Lever / Workable / SmartRecruiters / Workday"。受影响:README × 8 语言、help bundle × 8 语言、PROJECT.md。历史 CHANGELOG 条目和 bug-fix 处方文档(`qa/fixes/F-014`、`qa/FIX-PROMPT`)有意未触 — 描述过去状态或已正确。
- **`docs(qa): browser test scenario 19`** — `qa/claude-cowork-browser-test-prompt.md` 扩展 Scenario 19:`ALL_ADAPTERS.length === 6` 不变量、对 6 个全部进行 `resolveAdapter()` URL 检测扫描、`#/scan` Active Companies 卡片 soft-check、`docs/portals-examples.md` 结构检查。

### 🧪 测试

- `tests/adapter-registry.test.mjs` 扩展 7 个新案例,覆盖 3 个新适配器(Workable apply-URL、Workable legacy subdomain、SmartRecruiters jobs.* + careers.*、显式 site 的 Workday tenant.wd5.*、Workday default-site fallback、`ALL_ADAPTERS.length === 6` 不变量、`detectApi()` legacy-shape 兼容性)。
- 总计:**386 / 386** unit 测试(之前 379;+7 净增)。0 失败。

### Out of scope

| 项 | 说明 |
|---|---|
| 13 个 trending Greenhouse/Ashby 公司的 per-company 条目 | `docs/portals-examples.md` v1.14.0 块以 paste 可用 YAML 列出;批量加入父项目 `portals.yml` 是独立阶段。 |
| Workday CAPTCHA-fallback 自动化 | Workday adapter 在 CXS feed 被封时抛出;计划的 fallback 委托给父项目 `/career-ops scan`(Playwright)。SPA scan UX 接线为 v1.15+。 |

---

## [1.13.0] — 2026-05-13

大型发布。在一次提交中关闭 4 个延期项: PR-4(完整 multer 管道)、Adapter registry(F-018 架构后续)、Batch evaluate SPA 页面、locale-aware mode-template scaffolding。还有 mid-session 的深色主题表格修复。

### ✨ 功能

- **`feat(cv): multer multipart upload (PR-4 完整)`** — `/api/cv/import` 现在同时接受 octet-stream(原始契约)和 `multipart/form-data`(经 multer)。v1.10.2 的 415-reject 是临时方案;v1.13.0 是真正修复。curl `-F`、Postman 默认、任何 HTTP 客户端都顺畅工作。新依赖:`multer ^2.1.1`。
- **`feat(portals): adapter registry`** — Greenhouse / Ashby / Lever fetcher 抽取到 `server/lib/portals/adapters/*.mjs`,采用统一契约。`server/lib/portals/registry.mjs::resolveAdapter()` 是唯一的 dispatch 点。新增 ATS = `adapters/` 一个文件 + `ALL_ADAPTERS` 一行。
- **`feat(batch): #/batch evaluate page`** — 新 SPA 视图 + 4 个端点(`GET /api/batch`、`PUT /api/batch`、`GET /api/stream/batch`、`POST /api/batch/merge`)。`batch/batch-input.tsv` 的 TSV 编辑器,parallel/min-score/dry-run/retry 控件,`bash batch/batch-runner.sh` 的实时 SSE 日志,`Merge to tracker` 按钮(执行 `node merge-tracker.mjs`)。Sidebar 链接。21 个新 i18n 键 × 8 语言。
- **`feat(prompts): locale-aware mode scaffolding`** — `buildModePrompt` + `buildEvaluationPrompt` 现在用本地化的 scaffolding 文本(role-line、"Read these files first"、"User-supplied context")在 8 个语言中包裹 parent 的 mode-template 英文主体。

### 🎨 UX 修复

- **`fix(theme): 深色模式表格 + tab-btn`** — 硬编码的 `#fafafa` / `#fff` / `#f7f7f7` 替换为 token。深色下的 hover 现在可读。新增 `.row-boosted` accent strip。

### 🧪 测试

- 新增 `tests/adapter-registry.test.mjs` (7)、`tests/batch-endpoints.test.mjs` (5)、`tests/locale-scaffold.test.mjs` (6)。
- `tests/cv-upload-multipart-reject.test.mjs` 按 v1.13.0 契约(multipart parsed properly)重写。
- 总计 **379 / 379** 单元(此前 360;+19)。0 失败。覆盖率 **95.46 % 行 / 84.06 % 分支**。
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright。

### 范围外

- **14 个新 portal adapter** — registry 已就绪;添加 = 每个一个文件;portal-by-portal 调研仍待办。
- **翻译 parent 的 `modes/<slug>.md` 主体** — 需要向 `santifer/career-ops` 提交 upstream PR(CLAUDE.md hard rule #1)。

### 文档

- `docs/reviews/REVIEW-2026-05-13-v1.13.0.md`。
- 完整文本: [CHANGELOG.md](CHANGELOG.md#1130--2026-05-13)。

---

## [1.12.0] — 2026-05-13

错误修复 + UX + 品牌 pass。在 v1.11.1 后关闭 8 个 backlog 项(测试空缺 #9–12、console error #8、portals-dead drift #4、seniority_boost surface #6、F-018 端点合并)。新增主题 day/night 切换,所有文档/包元数据/GitHub 仓库描述中删除 "Airbnb-styled" 提及。

### ✨ 功能

- **`feat(theme): day/night 切换`** — top-bar 新增主题按钮。light ↔ dark 循环,持久化到 `localStorage`,首次绘制前通过 `public/js/lib/theme-bootstrap.js` 还原。首次加载尊重 `prefers-color-scheme`。`public/css/app.css` 中 `[data-theme="dark"]` 下完整深色调色板。
- **`feat(scan): /api/stream/scan?source=ats|regional|both` (F-018 LITE)`** — 单一合并的 SSE 端点。SPA 打开一个 event-stream,顺序执行两阶段(ATS,然后 regional)。旧版 `/api/stream/scan-en` + `/api/stream/scan-ru` 作为 deprecated alias 保留。
- **`feat(scan): seniority_boost surface`** — 两个扫描器都读取 `portals.yml::title_filter.seniority_boost`,在匹配 job 上标记 `_boosted: true`。SPA 将 boosted 行排到顶部并渲染 `⬆ boosted` badge。

### 🐛 修复

- **`fix(ui): 4 处 .message null-safe (#8)`** — `app.js`、`views/tracker.js`、`views/apply.js`、`views/evaluate.js`。此前没有 Error payload 的 Promise rejection 在 e2e teardown 中抛出 "Cannot read properties of undefined"。
- **`fix(test): portals-dead drift 改为 warning 而非 failure (#4)`** — assertion 转为 stderr warning。CI 在 parent drift 上保持绿色;release 决策仍由人工把关。

### 📝 Brand / docs

- **`docs(brand): 所有 doc + package + GitHub 仓库描述中删除 'Airbnb' 引用`** — 8 个 README、CLAUDE.md、FRONTEND.md、package.json 及仓库描述从 "Airbnb-styled" 迁移到 "Clean, docs-style"。

### 🧪 测试

- 新增 `tests/canonical-docs-coverage.test.mjs` (5 案例) 关闭 test gap #9–12。
- 新增 `tests/scan-consolidated.test.mjs` (6 案例) 覆盖 F-018 LITE。
- 总计 **360 / 360** 单元(此前 349;+11 新增)。0 失败。覆盖率:**95.62 % 行 / 84.37 % 分支**。
- 20/20 smoke E2E · 23/23 comprehensive E2E · 28/28 Playwright。

### 文档

- `docs/reviews/REVIEW-2026-05-13-v1.12.0.md`。
- 完整文本: [CHANGELOG.md](CHANGELOG.md#1120--2026-05-13)。

### 范围外 (自 v1.11.1 起无变化)

Batch evaluate SPA 页面;完整 adapter registry(F-018 架构 refactor);完整 multer 管道(PR-4);mode template 翻译。

---

## 之前的发布 (v1.11.x 和 v1.10.x)

v1.11.0 / v1.11.1 / v1.10.0–v1.10.3 的详细条目在 [英文 CHANGELOG](CHANGELOG.md) 中。摘要:

- **v1.11.1 — 2026-05-13** · 抛光: `#/apply` 的 Playwright 提示、统一的 taglines、仪表板 score-thresholds 卡片。349/349 测试。
- **v1.11.0 — 2026-05-13** · 在 8 个 help bundle 和 8 个 README 中集成 career-ops.org/docs。新 `docs/career-ops-canonical.md`。Mode/Archetype/Pipeline/Tracker/Report/Scan history 概念已文档化。348/349 测试。
- **v1.10.3 — 2026-05-12** · 错误修复切片:关闭 v1.10.2 回归运行的 11 个 QA 发现中的 7 个。
- **v1.10.2 — 2026-05-12** · CV multipart 415-拒绝 (v1.13.0 multer 之前的临时补丁);PDF 生成修复。
- **v1.10.1 — 2026-05-09** · 来自 v1.10.0 发布 QA 回归运行的关键补丁。
- **v1.10.0 — 2026-05-08** · `#/profile` 编辑器 + CV 上传 UX (pandoc/pdftotext/passthrough),8 个 locale × 16 H2 help 对等,locale switcher。
