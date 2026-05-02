# career-ops-ui

> Веб-интерфейс в стиле Airbnb для AI-пайплайна поиска работы [career-ops](https://github.com/santifer/career-ops).
> Искать, оценивать, делать deep-dive, подавать заявки и трекать каждый оффер из одной вкладки браузера — вместо беготни между Claude Code, терминалами и markdown-файлами.

[English](README.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko-KR.md) | [日本語](README.ja.md) | **Русский** | [简体中文](README.cn.md) | [繁體中文](README.zh-TW.md)

[![tests](https://img.shields.io/badge/tests-87%20passed-brightgreen)](README.md#tests)
[![node](https://img.shields.io/badge/node-%E2%89%A518-blue)](README.md#requirements)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

```
   ┌──────────────────────────────────────────────────────────────────────┐
   │ ◆ Дашборд        │  Командный центр                                  │
   │ ◇ Поиск          │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
   │ ▤ Pipeline       │  │ Заявки  │ │Pipeline │ │ Отчёты  │ │  Score  │  │
   │ ▷ Оценить        │  │   12    │ │    3    │ │   12    │ │   4.2   │  │
   │ ⌕ Deep research  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
   │ → Apply helper   │                                                    │
   │ ≡ Трекер         │  Найденные вакансии  [filters: stack·level·src]   │
   │ ▦ Отчёты         │  ┌────────────────────────────────────────────┐   │
   │ ✎ CV             │  │ Vercel  Software Engineer, Backend  Remote │   │
   │ ⚙ Профиль        │  │ GitLab  Engineering Manager, AI     Remote │   │
   │ ❤ Health         │  │ Stripe  Backend Engineer, Billing   US     │   │
   └──────────────────────────────────────────────────────────────────────┘
```

## Установка одной командой

```bash
curl -fsSL https://raw.githubusercontent.com/Fighter90/career-ops-ui/main/bin/setup.sh | bash
```

Эта команда клонирует оба репо (career-ops + career-ops-ui), ставит зависимости и запускает сервер на http://127.0.0.1:4317.

## Зачем?

[career-ops](https://github.com/santifer/career-ops) — мощная AI-система поиска работы на Claude Code: вставляешь JD → получаешь fit-score 0-5, ATS-оптимизированный PDF и запись в трекере. Внутри Claude Code работает отлично, но данные раскиданы по `cv.md`, `data/applications.md`, `reports/*.md`, `data/pipeline.md`, `portals.yml`, `config/profile.yml` — легко потерять, сложно охватить.

`career-ops-ui` накладывает сверху отполированный UI:

- **Просматривай** трекер, отчёты и pipeline как CRM.
- **Запускай** сканы (Greenhouse / Ashby / Lever **и** hh.ru / Habr Career) с live-логами через SSE.
- **Оценивай** JD через Gemini API или получи готовый промпт для Claude.
- **Редактируй** `cv.md` с side-by-side markdown-превью.
- **Поддерживай** систему: doctor, verify, normalize, dedup, merge — каждый одним кликом.

Чисто аддитивно: внутри `career-ops/` ничего не меняется. Все кастомизации остаются твоими.

## Что есть на каждой странице

| Страница         | Что делает                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Дашборд**      | Агрегированные счётчики (apps / pipeline / отчёты), средний score, разбивка по статусам, последние 5 apps + последний отчёт. |
| **Поиск**        | **Два сканера:** 🌍 EN scan (Greenhouse/Ashby/Lever, 24+ verified board) + 🇷🇺 RU scan (hh.ru API + Habr Career HTML scraping). Live SSE log + кликабельная таблица результатов с chip-фильтрами по стеку/уровню и фильтрами location / Remote-Hybrid / reloc / source. |
| **Pipeline**     | CRUD для `data/pipeline.md`. Прыжок прямо с URL на оценку.                                                          |
| **Оценить**      | Вставь JD → если задан `GEMINI_API_KEY`, запускает `gemini-eval.mjs`; иначе возвращает готовый промпт для Claude. |
| **Deep research**| Генерирует полный промпт `modes/deep.md` для указанной компании/роли.                                              |
| **Apply helper** | Генерирует чек-лист подачи; реальное автозаполнение через Playwright остаётся в `/career-ops apply` внутри Claude Code. |
| **Трекер**       | Filterable таблица по `data/applications.md` (статус, score, free-text). Кнопки one-click для normalize/dedup/merge. |
| **Отчёты**       | Просмотр и чтение каждого отчёта в `reports/` с распарсенным header (Score / Legitimacy / URL).                     |
| **CV**           | Live markdown-редактор для `cv.md` с side-by-side preview + sync-check.                                             |
| **Профиль**      | Read-only вьюха `config/profile.yml` + архетипы.                                                                    |
| **Health**       | Все setup-проверки в badge'ах OK / OPTIONAL / FAIL + кнопки запуска `doctor.mjs` и `verify-pipeline.mjs`.           |

## Требования

| | |
| --- | --- |
| **Node.js** | ≥ 18 |
| **career-ops** | Склонирован и onboarded |
| **Опционально** | `GEMINI_API_KEY` в `.env` для оценки JD одним кликом |
| **Опционально** | `HH_USER_AGENT` в `.env` если запускаешь вне РФ и хочешь, чтобы hh.ru API перестал отвечать 403 |

## Chip-фильтры по стеку и уровню

В таблице вакансий есть multi-select chip'ы для:

- **Стек:** PHP, Symfony, Laravel, Go, Rust, Node.js, TypeScript, Python, Ruby, Java, C#/.NET, C++, Backend, Frontend, Fullstack, Microservices, High-load, Distributed, DevOps/SRE, Data, ML/AI, Mobile, Security, Database, Cloud, API
- **Уровень:** Lead/Tech Lead, Architect, Manager, Principal/Staff, Senior, Middle, Junior

Multi-select внутри категории (OR), пересечение между категориями (AND). Counts показаны; рендерятся только chip'ы с реальными результатами.

## Полная документация

Полная архитектура, API reference, расширенная конфигурация и security notes — см. [English README](README.md).

## Лицензия

MIT. Построено поверх [career-ops](https://github.com/santifer/career-ops) от [santifer](https://santifer.io).
