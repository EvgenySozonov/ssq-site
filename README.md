# SSQ-site — сайт компании «Умный квадрат»

Многостраничный сайт услуг: электромонтаж и умный дом. Русскоязычный, тёмный премиум-дизайн.

## Документация

| Документ | О чём |
|---|---|
| [docs/product.md](docs/product.md) | Продукт: цели, аудитория, структура услуг по направлениям |
| [docs/architecture.md](docs/architecture.md) | Стек, карта маршрутов, данные, форма, деплой |
| [docs/architecture/c4/](docs/architecture/c4/README.md) | C4-модель (Structurizr DSL): контекст, контейнеры, поток заявки, деплой |
| [docs/design.md](docs/design.md) | Дизайн-система: палитра, шрифты, композиция |
| [docs/plan.md](docs/plan.md) | Порядок реализации, чек-лист шагов |
| [docs/qa.md](docs/qa.md) | Правила тестирования до автоматизации |
| [docs/test-case.md](docs/test-case.md) | Сценарии приёмки «что увидеть глазами» |
| [docs/memory.md](docs/memory.md) | Лог решений с обоснованием |
| [docs/handoff.md](docs/handoff.md) | Состояние проекта прямо сейчас |
| [docs/about.md](docs/about.md) | Факты о компании для страниц сайта |

## Стек (решение 2026-10-16, см. docs/memory.md)

- **Astro** + React-острова + TypeScript + Tailwind CSS v4 — сборка в статику.
- Контент: Content Collections (MDX) + JSON-данные (`src/data/`).
- Форма заявок: Python 3 CGI-эндпоинт на хостинге (stdlib) → Telegram.
- Хостинг: Beget Shared; деплой: `astro build` → rsync по SSH.
- Git: приватный GitHub.

## Структура репозитория

- `src/` — референс старой визитки (`index.html`), после старта шага 1 — исходники Astro-сайта.
- `docs/` — вся документация (см. таблицу выше).
- `.superpowers/` — артефакты brainstorm-сессий (не коммитить, в `.gitignore`).
- `graft/` — локальный граф кода (not committed).
- `tmp/`, `src/example/` — черновики, к коду не относятся.

## Запуск для проверки

Пока — только старая визитка: открыть `src/index.html` в браузере, либо:

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

После шага 1 (каркас Astro):

```bash
npm run dev      # дев-сервер Astro
npm run build    # сборка в dist/ (= проверка корректности)
./deploy.sh      # деплой на Beget (после шага 10)
```

## С чего начать

1. [docs/handoff.md](docs/handoff.md) — состояние «прямо сейчас» и следующий шаг.
2. [docs/plan.md](docs/plan.md) — что за чем.