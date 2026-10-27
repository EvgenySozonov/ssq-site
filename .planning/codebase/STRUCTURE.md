---
last_mapped_commit: 01a325d92ff12c345fd40ed162ac2b26f83cc6c2
last_mapped_at: 2026-10-27
---
# Codebase Structure

**Analysis Date:** 2026-10-27

## Directory Layout

```text
SSQ-site/
├── README.md                  # первоисточник: стек, структура, команды, ссылки на доки
├── CLAUDE.md                  # правила работы агента, границы, конвенции
├── site/                      # Astro 7 каркас (основной сайт)
│   ├── package.json           # скрипты: dev, build, check, lint, test:e2e, test:server
│   ├── astro.config.mjs       # site: smart-square.ru, @tailwindcss/vite
│   ├── tsconfig.json          # extends astro/tsconfigs/strict
│   ├── eslint.config.mjs      # flat config: js + typescript-eslint + astro + react + a11y
│   ├── playwright.config.ts
│   ├── public/
│   │   ├── favicon.ico, favicon.svg
│   │   └── cgi-bin/contact.py # CGI-эндпоинт (уходит в dist при билде)
│   ├── src/
│   │   ├── layouts/BaseLayout.astro
│   │   ├── pages/index.astro, contacts.astro
│   │   ├── components/ContactForm.astro
│   │   ├── data/site.json
│   │   └── styles/tokens.css, global.css
│   ├── e2e/form.spec.ts       # Playwright: клиентский контракт формы
│   ├── tests/test_contact.py  # unittest: серверный контракт contact.py
│   └── dist/                  # сборка (gitignored артефакт)
├── example/                   # референс старой визитки (index.html + assets)
├── docs/                      # вся документация (индекс в README.md)
│   ├── architecture/c4/       # C4-модель (Structurizr DSL)
│   ├── design.md, product.md, qa.md, test-case.md
│   ├── memory.md              # лог решений
│   ├── specs/ssq-site-stack-design.md
│   ├── content/strategy.md    # материалы для контента страниц
│   ├── img/                   # снимки AI-среды и приёмки
│   └── reports/               # отчёты приёмки (2026-10-18 — с доказательствами AI-среды)
├── .planning/codebase/        # карты GSD (этот файл и соседние; ARCHITECTURE/STACK — канонные доки)
├── .planning/archive/plans/   # архив детального плана 13 шагов
├── .claude/skills/            # 5 кастомных скиллов SSQ (astro, tailwind, form-cgi, deploy-beget, typescript-strict)
├── .planning/codebase/        # карты GSD (этот файл и соседние)
├── .claude/skills/            # 5 кастомных скиллов SSQ (astro, tailwind, form-cgi, deploy-beget, typescript-strict)
├── .trail/                    # trail-code: learnings, cache (не относится к коду)
└── tmp/                       # черновики
```

## Directory Purposes

**`site/src/pages/`:**
- Purpose: маршруты сайта (SSG)
- Contains: `.astro`-файлы страниц
- Key files: `site/src/pages/index.astro` (главная, каркас), `site/src/pages/contacts.astro` (контакты + форма)

**`site/src/layouts/`:**
- Purpose: общий каркас страницы (head/SEO/nav/footer)
- Key files: `site/src/layouts/BaseLayout.astro` (64 строки; принимает `title`, `description`)

**`site/src/components/`:**
- Purpose: компоненты секций
- Key files: `site/src/components/ContactForm.astro` (287 строк; форма заявки + vanilla JS)

**`site/src/data/`:**
- Purpose: активные данные (не хардкод в компонентах)
- Key files: `site/src/data/site.json` (name, phone, phoneHref, endpoint формы)

**`site/src/styles/`:**
- Purpose: дизайн-токены и глобальные стили, Tailwind v4 через `@theme`
- Key files: `site/src/styles/tokens.css` (палитра «Ночная медь», radius, шрифты), `site/src/styles/global.css`

**`site/public/cgi-bin/`:**
- Purpose: серверная часть (CGI-скрипт копируется в dist при билде)
- Key files: `site/public/cgi-bin/contact.py` (~500 строк, Python 3 stdlib → Telegram Bot API)

**`site/e2e/`, `site/tests/`:**
- Purpose: контрактные тесты формы с двух сторон
- Key files: `site/e2e/form.spec.ts` (Playwright, 12 спеков), `site/tests/test_contact.py` (unittest, сеть не трогается)

**`docs/`:**
- Purpose: вся документация проекта; `docs/architecture.md` — первоисточник архитектуры, README — первоисточник стека
- Generated: No; Committed: Yes

**`example/`:**
- Purpose: референс старой визитки (открыть `example/index.html` в браузере)
- Generated: No; Committed: Yes

**`.planning/codebase/`:** карты GSD (эти директории снапшоты, обновляются командой map-codebase)

## Key File Locations

**Entry Points:**
- `site/src/pages/index.astro`: главная страница (сейчас заглушка «Каркас собран»)
- `site/src/pages/contacts.astro`: страница контактов с формой заявки
- `site/public/cgi-bin/contact.py`: продовый CGI-эндпоинт формы (POST /cgi-bin/contact.py)

**Configuration:**
- `site/astro.config.mjs`: конфиг Astro (site-URL, Vite-плагин Tailwind)
- `site/tsconfig.json`: strict-режим TypeScript (`extends: astro/tsconfigs/strict`)
- `site/eslint.config.mjs`: flat-config ESLint
- `site/playwright.config.ts`: конфиг e2e
- `site/src/styles/tokens.css`: дизайн-токены (Tailwind v4 @theme)
- `CLAUDE.md`: правила работы агента

**Core Logic:**
- `site/src/components/ContactForm.astro`: клиентская валидация/состояния формы
- `site/public/cgi-bin/contact.py`: валидация сервера, honeypot, rate-limit, доставка в Telegram

**Data:**
- `site/src/data/site.json`: телефон, endpoint формы (источник правды для активных данных)

**Testing:**
- `site/e2e/form.spec.ts`: Playwright-контракт формы (Chromium)
- `site/tests/test_contact.py`: unittest-контракт CGI (сеть подменяется)

## Naming Conventions

**Files:**
- Astro-компоненты: PascalCase-файлы (`.astro`) — `BaseLayout.astro`, `ContactForm.astro`
- Страницы: kebab/lowercase по маршруту — `index.astro`, `contacts.astro`
- Данные: kebab-case JSON — `site.json`, целевые `lines.json`, `pricing.json` (по `docs/architecture.md`)

**Directories:**
- kebab-case — `cgi-bin`, `docs/reports`, `.planning/codebase`

**Routes (целевая карта, docs/architecture.md):**
- `/services/[line]/` и `/services/[line]/[service]/` строятся циклом по `lines.json`, а не отдельными файлами роутинга

## Where to Add New Code

**New Page (Astro):**
- Implementation: `site/src/pages/<route>.astro`
- Layout: импортировать `site/src/layouts/BaseLayout.astro`
- Секционные компоненты: `site/src/components/`

**New Form/Interactive:**
- Обновить `site/src/components/ContactForm.astro` (клиентский контракт: `site/e2e/form.spec.ts`)
- Обновить `site/public/cgi-bin/contact.py` (серверный контракт: `site/tests/test_contact.py`)
- Оба контракта синхронизировать: правка на одной стороне требует зеркальной на другой + обновления докстрингов (ссылки на `docs/specs/ssq-site-stack-design.md` §6.1/§6.2)

**New Data:**
- `site/src/data/<name>.json`; доступ через импорт в `.astro` (pattern `ContactForm.astro`), не через хардкод в компонентах

**New Service Line (целевая модель):**
- Только запись в `site/src/data/services/lines.json` — роуты `/services/[line]/` строятся динамически, ноль новых файлов роутинга

**Styles:**
- Токены: `site/src/styles/tokens.css` (`@theme`)
- Глобальные стили/шрифты: `site/src/styles/global.css`
- В компонентах: Tailwind-классы от токенов; не хардкодить `#hex`

**Tests:**
- Клиент: `site/e2e/*.spec.ts` (Playwright)
- Сервер CGI: `site/tests/test_*.py` (unittest, сеть всегда подменяется)

## Special Directories

**`site/dist/`:**
- Purpose: сборка Astro
- Generated: Yes; Committed: No (gitignored)

**`site/test-results/`:**
- Purpose: артефакты Playwright
- Generated: Yes; Committed: No

**`example/`:**
- Purpose: эталон дизайна/поведения старой визитки; только чтение
- Generated: No; Committed: Yes

**`.planning/`:**
- Purpose: GSD-планирование и карты кодовой базы
- Generated: частично; Committed: частично

**`.trail/`, `tmp/`, `example/example/`:**
- Purpose: служебные/черновые, к коду не относятся
- Committed: .trail — частично (learnings), tmp — нет

---

*Structure analysis: 2026-10-27*
