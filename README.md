# SSQ-site — сайт компании «Умный квадрат»

Многостраничный сайт услуг: электромонтаж и умный дом. Русскоязычный, тёмный премиум-дизайн.

## Документация

| Документ                                                                                                           | О чём                                                                            |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| [docs/product.md](docs/product.md)                                                                                 | Продукт: цели, аудитория, структура услуг по направлениям                        |
| [.planning/codebase/ARCHITECTURE.md](.planning/codebase/ARCHITECTURE.md)                                           | Архитектура (объединённый док GSD): стек, карта маршрутов, данные, форма, деплой |
| [docs/architecture/c4/](docs/architecture/c4/README.md)                                                            | C4-модель (Structurizr DSL): контекст, контейнеры, поток заявки, деплой          |
| [docs/design.md](docs/design.md)                                                                                   | Дизайн-система: палитра, шрифты, композиция                                      |
| [.planning/ROADMAP.md](.planning/ROADMAP.md)                                                                       | Порядок реализации (фазы v1.0/v1.1), GSD                                         |
| [.planning/archive/plans/ssq-site-implementation-plan.md](.planning/archive/plans/ssq-site-implementation-plan.md) | Детальный план 13 шагов (архив, task-level детали)                               |
| [docs/qa.md](docs/qa.md)                                                                                           | Правила тестирования до автоматизации                                            |
| [docs/security-checklist.md](docs/security-checklist.md)                                                           | Последовательная проверка безопасности перед выкатом (секреты, CGI, деплой, 152-ФЗ) |
| [docs/test-case.md](docs/test-case.md)                                                                             | Сценарии приёмки «что увидеть глазами»                                           |
| [docs/memory.md](docs/memory.md)                                                                                   | Лог решений с обоснованием                                                       |
| [.planning/STATE.md](.planning/STATE.md)                                                                           | Состояние проекта прямо сейчас (GSD)                                             |
| [docs/reports/2026-10-18-отчет-приемки-в-репо.md](docs/reports/2026-10-18-отчет-приемки-в-репо.md)                 | Отчёт приёмки 18.10 + доказательства AI-среды (эксперимент path-scope, скрины)    |
| [docs/content/strategy.md](docs/content/strategy.md)                                                               | Позиционирование и факты компании для страниц сайта                              |
| [docs/reports/](docs/reports/)                                                                                     | Отчёты приёмки по датам (принято / гейты / долги)                                |
| [.planning/codebase/STACK.md](.planning/codebase/STACK.md)                                                         | Полное описание стека и решений                                                  |

## Стек

- Полное описание стека и решений — , [.planning/codebase/STACK.md](.planning/codebase/STACK.md) 


## Структура репозитория

- `site/` — исходники Astro-сайта (`src/`), CGI-эндпоинт (`public/cgi-bin/contact.py`), тесты (`e2e/`, `tests/`).
- `example/` — референс старой визитки (`index.html`); сохраняется, не мигрирует (решение из доков).
- `.planning/` — вся документация, GSD Core: PROJECT, REQUIREMENTS, ROADMAP, STATE, `codebase/` (карта кодбейза), `intel/`, `archive/plans/`, `onboarding/` (обзор — [`onboarding/SUMMARY.md`](.planning/onboarding/SUMMARY.md)).
- `.trail/` — граф кода Trail-code: индекс и learnings в `.trail/learnings/` (коммитятся); прежний `graft/` удалён при миграции 2026-10-19.
- `.claude/` — конфигурация агента: скиллы, правила по путям, хуки, permissions (см. «Как агент работает в проекте»).

## Как агент работает в проекте

Состав (правила и границы — `CLAUDE.md`, главный источник; доказательства работы среды — отчёт приёмки [2026-10-18](docs/reports/2026-10-18-отчет-приемки-в-репо.md)):

- **Правила и границы** — `CLAUDE.md` (главный источник): границы («не удалить/не править вне проекта/не коммитить без спроса»), формат ответа, правило деплоя. Разрешительная политика — `.claude/settings.json` (allow: гейты+коммит; ask: push; deny: `.env` и разрушающие операции).
- **Path-scoped rules** — `.claude/rules/*.md`, зоны через frontmatter `paths:`; при обращении к файлу зоны правило инжектится в контекст (system hook):

| Правило | Зона (`paths:`) | Что enforced |
|---|---|---|
| `astro-code.md` | `site/src/**` | каркас, острова по обоснованию, гейты lint/check/build |
| `typescript-strict.md` | `site/src/**/*.ts(x)` | strict: no `any`/ts-ignore, типы из zod |
| `style-tokens.md` | `site/src/styles/**` | design-значения только из tokens.css, reduced-motion |
| `form-cgi.md` | `site/public/cgi-bin/**`, `site/src/pages/contacts*` | контракт ssq-form-cgi, чек-лист qa.md после правок |
| `deploy-secrets.md` | `deploy.sh`, `.env*`, `site/public/**` | `.env` вне git, секреты вне docroot |
| `docs-truth.md` | `docs/**`, `CLAUDE.md` | синхронность докса и кода, лог решений в memory.md |

- **Скиллы** — `.claude/skills/`; один-лайнеры:
  - `ssq-astro-conventions` — каркас: маршруты из `lines.json`, ноль JS вне островов, данные в `site/src/data/`.
  - `ssq-typescript-strict` — strict TS: типы из zod-схем, запрет `any`/`ts-ignore`.
  - `ssq-tailwind-tokens` — «Ночная медь»: палитра/шрифты/анимации через `tokens.css`.
  - `ssq-form-cgi` — контракт формы: поля, honeypot, rate-limit, 400/502, секреты.
  - `ssq-deploy-beget` — выкат/откат на Beget: гейты, rsync, smoke-тест из прода.
  - (официальный) `webapp-testing` — Playwright-инструментарий браузера для проверок UI.
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