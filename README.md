# SSQ-site — сайт компании «Умный квадрат»

Многостраничный сайт услуг: электромонтаж и умный дом. Русскоязычный, тёмный премиум-дизайн.

## Документация

| Документ | О чём |
|---|---|
| [docs/product.md](docs/product.md) | Продукт: цели, аудитория, структура услуг по направлениям |
| [.planning/codebase/ARCHITECTURE.md](.planning/codebase/ARCHITECTURE.md) | Архитектура (объединённый док GSD): стек, карта маршрутов, данные, форма, деплой |
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

## Стек (решение 2026-10-16, уточнения 2026-10-27 — см. docs/memory.md)

- **Astro 7.4** + TypeScript strict + Tailwind CSS v4 — сборка в статику (исходники: `site/`).
- React — **вне первого релиза** (решение 2026-10-27): в каркасе v1.0 React-зависимостей нет, интерактив формы — `<script>`; калькулятор/фильтр — фазы v1.1+.
- Данные: JSON (`site/src/data/`) по контрактам spec §4 (zod-схемы — долг текущей фазы); Content Collections (MDX) — фазы портфолио/блога.
- Форма заявок: Python 3 CGI-эндпоинт `site/public/cgi-bin/contact.py` (только stdlib) → Telegram.
- Хостинг: Beget Shared; деплой: `astro build` → rsync по SSH.
- Git: приватный GitHub.

## Структура репозитория

- `site/` — исходники Astro-сайта (`src/`), CGI-эндпоинт (`public/cgi-bin/contact.py`), тесты (`e2e/`, `tests/`).
- `example/` — референс старой визитки (`index.html`); сохраняется, не мигрирует (решение из доков).
- `.planning/` — вся документация, GSD Core: PROJECT, REQUIREMENTS, ROADMAP, STATE, `codebase/` (карта кодбейза), `intel/`, `archive/plans/`, `onboarding/` (обзор — [`onboarding/SUMMARY.md`](.planning/onboarding/SUMMARY.md)).
- `.trail/` — граф кода Trail-code: индекс и learnings в `.trail/learnings/` (коммитятся); прежний `graft/` удалён при миграции 2026-10-19.
- `.claude/` — конфигурация агента: скиллы, правила по путям, хуки, permissions (см. «Как агент работает в проекте»).

## Как агент работает в проекте

Полное описание AI-среды и доказательства работы — [docs/about.md](docs/about.md); состав:

- **Правила и границы** — `CLAUDE.md` (главный источник): границы («не удалить/не править вне проекта/не коммитить без спроса»), формат ответа, правило деплоя. Разрешительная политика — `.claude/settings.json` (allow: гейты+коммит; ask: push; deny: `.env` и разрушающие операции).
- **Path-scoped rules** — `.claude/rules/*.md`: правило со своей зоны (`site/src/**`, `site/public/cgi-bin/**`, `docs/**`…) инжектится в контекст при обращении к файлу этой зоны — каркас Astro, strict TS, design-токены, контракт формы, секреты, синхронность доков.
- **Скиллы** — `.claude/skills/`: 5 проектных (`ssq-astro-conventions`, `ssq-typescript-strict`, `ssq-tailwind-tokens`, `ssq-form-cgi`, `ssq-deploy-beget`) + официальный `webapp-testing` (Playwright).
- **Стек AI-среды**: Trail-code (`.trail/` — граф кода и learnings; поиск по коду — `trail ask`/`trail grep`), claude-mem (перекрёстная сессийная память и to-do-стейт), superpowers (процессные скиллы: brainstorm → план → test-first), GSD Core (фазовый workflow — см. выше), Playwright MCP (браузерные проверки).
- **Гейты перед завершением любой правки** — `lint`, `check`, `build`, `test:e2e`, `test:server` (команды — ниже, «Запуск для проверки»).

## Workflow (GSD Core)

Работа ведётся по фазам из `.planning/ROADMAP.md` (4 фазы v1.0 + 3 фазы v1.1+):

1. `/gsd-plan-phase 1` — план фазы (`PLAN.md` в `.planning/phases/…`).
2. `/gsd-execute-phase 1` — исполнение (атомарные коммиты, гейты).
3. `/gsd-verify-work` / `/gsd-ship` — приёмка и выкат.
- Ситуативный вход: `/gsd-next` (определяет состояние и маршрут) и `/gsd-manager` (командный центр).

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