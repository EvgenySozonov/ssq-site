# SSQ-site — сайт компании «Умный квадрат»

Многостраничный сайт услуг: электромонтаж и умный дом. Русскоязычный, тёмный премиум-дизайн.

## Документация

| Документ | О чём |
|---|---|
| [docs/product.md](docs/product.md) | Продукт: цели, аудитория, структура услуг по направлениям |
| [docs/architecture.md](docs/architecture.md) | Стек, карта маршрутов, данные, форма, деплой |
| [docs/architecture/c4/](docs/architecture/c4/README.md) | C4-модель (Structurizr DSL): контекст, контейнеры, поток заявки, деплой |
| [docs/design.md](docs/design.md) | Дизайн-система: палитра, шрифты, композиция |
| [.planning/ROADMAP.md](.planning/ROADMAP.md) | Порядок реализации (фазы v1.0/v1.1), GSD |
| [.planning/archive/plans/ssq-site-implementation-plan.md](.planning/archive/plans/ssq-site-implementation-plan.md) | Детальный план 13 шагов (архив, task-level детали) |
| [docs/qa.md](docs/qa.md) | Правила тестирования до автоматизации |
| [docs/test-case.md](docs/test-case.md) | Сценарии приёмки «что увидеть глазами» |
| [docs/memory.md](docs/memory.md) | Лог решений с обоснованием |
| [.planning/STATE.md](.planning/STATE.md) | Состояние проекта прямо сейчас (GSD) |
| [docs/about.md](docs/about.md) | AI-среда проекта: стек, правила, скиллы, доказательства работы |
| [docs/content/strategy.md](docs/content/strategy.md) | Позиционирование и факты компании для страниц сайта |
| [docs/reports/](docs/reports/) | Отчёты приёмки по датам (принято / гейты / долги) |

## Стек (решение 2026-10-16, см. docs/memory.md)

- **Astro** + React-острова + TypeScript + Tailwind CSS v4 — сборка в статику.
- Контент: Content Collections (MDX) + JSON-данные (`site/src/data/`).
- Форма заявок: Python 3 CGI-эндпоинт на хостинге (stdlib) → Telegram.
- Хостинг: Beget Shared; деплой: `astro build` → rsync по SSH.
- Git: приватный GitHub.

## Структура репозитория

- `example/` — референс старой визитки (`index.html`); исходники Astro-сайта — в `site/src/`.
- `docs/` — вся документация (см. таблицу выше).
- `.claude/` — конфигурация агента: скиллы, правила по путям, хуки, permissions (см. «Как агент работает в проекте»).
- `.superpowers/` — артефакты brainstorm-сессий (не коммитить, в `.gitignore`).
- `graft/` — локальный граф кода (not committed).
- `tmp/`, `example/example/` — черновики, к коду не относятся.

## Как агент работает в проекте

Полное описание AI-среды — [docs/about.md](docs/about.md); краткие указатели:

- Правила работы и границы агента — `CLAUDE.md` (главный источник).
- Скиллы, правила по путям, хуки — `.claude/skills/`, `.claude/rules/`, `.claude/hooks/`.
- Памятка гейтов: `lint`, `check`, `build`, `test:e2e`, `test:server` — перед завершением любой правки (запуск — ниже, «Запуск для проверки»).

## Запуск для проверки

Новый сайт (Astro, каталог `site/`):

```bash
cd site && npm run dev          # дев-сервер → http://localhost:4321
npm run build                   # сборка в dist/ (= проверка корректности)
npm run lint && npm run check   # ESLint + astro check
npm run test:e2e                # Playwright: 12 специ-тестов формы (Chromium)
npm run test:server             # unittest cgi-bin/contact.py (сеть не трогается)
```

Референс старой визитки (`example/`): открыть `example/index.html` в браузере, либо:

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

`./deploy.sh` — деплой на Beget (скрипт из плана шага 10, в репо ещё не создан).

## С чего начать

1. [.planning/STATE.md](.planning/STATE.md) — состояние «прямо сейчас» и следующий шаг.
2. [.planning/ROADMAP.md](.planning/ROADMAP.md) — что за чем.