---
last_mapped_commit: 01a325d92ff12c345fd40ed162ac2b26f83cc6c2
last_mapped_at: 2026-10-27
---
<!-- refreshed: 2026-10-27 -->
# Architecture

**Analysis Date:** 2026-10-27

## System Overview

```text
┌──────────────────────────────────────────────────────────────────┐
│                     Статический сайт (SSG, Astro)                │
├──────────────────┬───────────────────┬───────────────────────────┤
│  Страницы        │  Layout/Nav/Footer│  Форма заявки             │
│ site/src/pages/  │ site/src/layouts/ │ site/src/components/      │
│  index.astro     │  BaseLayout.astro │  ContactForm.astro        │
│  contacts.astro  │                   │  (Astro + vanilla JS)     │
└────────┬─────────┴─────────┬─────────┴──────────┬────────────────┘
         │                   │                    │
         ▼                   ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│  Данные и стиль (build-time)                                     │
│  site/src/data/site.json · site/src/styles/tokens.css (Tailwind  │
│  v4 @theme), global.css                                          │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼  astro build → dist/ (включая public/cgi-bin)
┌──────────────────────────────────────────────────────────────────┐
│  Beget Shared хостинг                                            │
│  Статика dist/ + CGI-эндпоинт site/public/cgi-bin/contact.py     │
│  → Telegram Bot API (stdlib urllib)                              │
│  Секреты: вне docroot, /home/<user>/.env-ssq (не в git)          │
└──────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Astro pages | Статические маршруты (SSG) | `site/src/pages/index.astro`, `site/src/pages/contacts.astro` |
| BaseLayout | `<head>`, meta/SEO, nav, footer, подключение global.css | `site/src/layouts/BaseLayout.astro` |
| ContactForm | Единственная интерактивная функция: валидация, honeypot, состояния отправки (vanilla JS, не React-остров — обоснование в докстринге) | `site/src/components/ContactForm.astro` |
| site.json | Активные данные (телефон, endpoint формы) — передаются в форму через data-атрибуты | `site/src/data/site.json` |
| tokens.css | Дизайн-токены «Ночная медь» (Tailwind v4 `@theme`) | `site/src/styles/tokens.css` |
| global.css | Импорт Tailwind + токенов + Google Fonts; базовые стили body; `prefers-reduced-motion` | `site/src/styles/global.css` |
| contact.py | CGI-эндпоинт: приём POST (JSON/form-encoded), валидация, нормализация телефона, honeypot, rate-limit по IP, доставка в Telegram Bot API | `site/public/cgi-bin/contact.py` |
| docs | Единственный источник правды по архитектуре/стеку | `docs/architecture.md`, `README.md`, `docs/specs/ssq-site-stack-design.md`, `docs/architecture/c4/` (C4/Structurizr DSL) |

## Pattern Overview

**Overall:** Статический сайт (SSG) + серверный CGI-синоним к нему. Каркас (skeleton) — собран 2026-10-18; реализованы каркас + форма заявок. Без Node в проде: билд локально/в CI-подобных проверках, в проде только статика + Python CGI.

**Key Characteristics:**
- Сервер-рендер только на этапе билда; прод — полностью статические HTML + один CGI-скрипт.
- Нет клиентского фреймворка по умолчанию: форму намеренно сделано на vanilla JS внутри `.astro` (см. докстринг `ContactForm.astro`), React-острова — потенциально только для калькулятора/фильтра (в целевой модели, см. `docs/architecture.md` «Структура репозиториев»).
- Данные отделены от компонентов (`site/src/data/site.json`), стиль — через токены, без хардкода цветов.

## Layers

**Presentation (static):**
- Purpose: страницы, layout, компоненты
- Location: `site/src/pages/`, `site/src/layouts/`, `site/src/components/`
- Depends on: `site/src/data/`, `site/src/styles/`
- Used by: прод-статика (dist/)

**Data (build-time):**
- Purpose: активные данные сайта
- Location: `site/src/data/site.json`
- Used by: `ContactForm.astro` (через импорт JSON + data-атрибуты)

**Server-side (CGI):**
- Purpose: приём заявок и надёжная доставка в Telegram
- Location: `site/public/cgi-bin/contact.py`
- Depends on: только Python stdlib + Telegram Bot API
- Used by: `ContactForm.astro` (fetch на `/cgi-bin/contact.py`)

**Tests:**
- E2E: `site/e2e/form.spec.ts` (Playwright, Chromium) — клиентский контракт формы
- Server: `site/tests/test_contact.py` (unittest) — серверный контракт contact.py, сеть не трогается

## Data Flow

### Primary Request Path (форма заявки)

1. Пользователь открывает `/contacts/` → статический HTML, собранный из `site/src/pages/contacts.astro` + `ContactForm.astro`
2. Форма получает endpoint/телефон из `site/src/data/site.json` → data-атрибуты (`data-endpoint`, `data-phone`, `data-phone-href`) на теге `<form>`
3. JS формы валидирует поля (в т.ч. нормализация телефона на клиенте), POST JSON на `/cgi-bin/contact.py`
4. `site/public/cgi-bin/contact.py`: parse → honeypot (заполнен → маскированный 200 `{ok:true}`) → rate-limit по IP (в файловом хранилище, по умолчанию 10/час) → валидация + нормализация телефона (`+7 (999) 123-45-67` | `+79991234567` | `8 999 123-45-67` → `7XXXXXXXXXX`) → доставка в Telegram Bot API (timeout 5s)
5. Ответ JSON: успех `{ok:true}` / ошибка `{ok:false, error:"..."}` (400 — валидация/лимит, 502 — отказ доставки). Тихой потери заявки нет.
6. JS формы показывает состояние (отправка → успех / ошибка); при сбое — телефон напрямую.

### Сборка/деплой

1. Локально `cd site && npm run build` → `site/dist/`
2. rsync `dist/` (включая `public/cgi-bin/contact.py`) по SSH на Beget
3. Секреты Telegram-токена — вне docroot (`/home/<user>/.env-ssq`), не в git; в репо — только `.env.example`
4. Домены: основной `smart-square.ru`; `smart-sq.ru` → 301. Canonical/sitemap только на основном.

**State Management:**
- Нет глобального клиентского стора. Состояние только локальное внутри `ContactForm.astro` (vanilla JS, статусы формы на DOM).
- Серверное состояние: rate-limit счётчик contact.py (файлы во временном каталоге хостинга).

## Key Abstractions

**Держатель данных:**
- Purpose: единственный источник активных данных сайта (телефон, endpoint формы)
- Examples: `site/src/data/site.json`
- Pattern: JSON → импорт в `.astro` → data-атрибуты на DOM (не хардкод в компонентах)

**Дизайн-токены:**
- Purpose: единая палитра/типографика «Ночная медь»
- Examples: `site/src/styles/tokens.css` (Tailwind v4 `@theme`), используются в `BaseLayout.astro`, `ContactForm.astro` как Tailwind-классы + `var(--radius-s)` inline
- Pattern: Tailwind v4 — конфиг через CSS, не через `tailwind.config.js`

**CGI-контракт:**
- Purpose: жёсткий контракт формы ↔ бэкенда, зафиксированный тестами с двух сторон
- Examples: `site/public/cgi-bin/contact.py` ↔ `site/tests/test_contact.py` (server) и `site/e2e/form.spec.ts` (client)
- Pattern: test-first контракт → обе стороны держат его синхронным; типизация delivery через `DeliverFn = Callable[[...], None]` (dependency injection для тестов)

## Entry Points

**Astro dev/build (каркас):**
- Location: `site/astro.config.mjs` (`site: "https://smart-square.ru"`, Vite-плагин `@tailwindcss/vite`)
- Triggers: `npm run dev` / `npm run build` / `npm run check` / `npm run lint` / `npm run test:e2e` / `npm run test:server` (scripts в `site/package.json`)
- Responsibilities: SSG-сборка, Tailwind-интеграция, проверки (astro check = сломано, build = сломано)

**CGI endpoint (прод):**
- Location: `site/public/cgi-bin/contact.py`
- Triggers: POST `/cgi-bin/contact.py` (JSON или form-encoded)
- Responsibilities: parse → validate → throttle → Telegram deliver; ответ JSON

## Architectural Constraints

- **Node только на этапе билда:** в проде Beget Shared никакого Node; `dist/` + один Python CGI.
- **Зависимости CGI:** только Python stdlib (требование `docs/architecture.md`), чтобы не было pip на шаред-хостинге.
- **Секреты вне docroot:** токен Telegram-бота в `/home/<user>/.env-ssq`; в git — только `.env.example`. Никогда не коммитить `.env`.
- **Tailwind v4 без config-файла:** все токены в `site/src/styles/tokens.css` через `@theme`; конфиг-файл Tailwind не используется.
- **Prefers-reduced-motion:** все анимации обязаны уважать его (см. `site/src/styles/global.css`, унаследовано от референса).
- **Circular imports:** не обнаружено.

## Anti-Patterns

### Хардкод данных в компонентах

**What happens:** телефон/endpoint/секрет форм вбивается прямо в JSX/Astro-разметку.
**Why it's wrong:** ломает обновление с одного места; нарушает правило `docs/architecture.md` «Активные данные — в data-файлах, не в компонентах».
**Do this instead:** держать данные в `site/src/data/site.json` и прокидывать через props/data-атрибуты (как это делает `site/src/components/ContactForm.astro`).

### Хардкод цветов/шрифтов

**What happens:** в компоненте написан hex-цвет прямо (`#c9a15a`) вместо токена.
**Why it's wrong:** расходится с дизайн-системой «Ночная медь» (`docs/design.md`) и ломает смену темы/акцента.
**Do this instead:** использовать Tailwind-классы от `@theme`-токенов (`bg-bg`, `text-accent` и т.п.) и `var(--radius-s)` для радиусов — так сделано в `BaseLayout.astro`.

### Тихая потеря заявки

**What happens:** CGI молча роняет запрос при сбое доставки в Telegram.
**Why it's wrong:** пользователь не получает ни подтверждения, ни запасного пути.
**Do this instead:** явные HTTP-коды + JSON-ответ с понятной ошибкой; при сбое формы JS показывает телефон напрямую (паттерн `ContactForm.astro`).

## Error Handling

**Strategy:** Форма и CGI — единственные динамические точки; ошибки строго типизированы по HTTP-кодам и JSON-телу.

**Patterns:**
- CGI: 200 `{ok:true}` (включая маскированный honeypot), 400 `{ok:false, error:"..."}` (валидация/rate-limit), 502 `{ok:false}` (отказ доставки/нет секретов/таймаут).
- Клиент: aria-атрибуты (`aria-invalid="true"`, `role="status"`, `aria-live="polite"`) — см. `site/e2e/form.spec.ts` и `ContactForm.astro`.

## Cross-Cutting Concerns

**Logging:** нет выделенного логгера; CGI пишет минимально (маскировка honeypot, отказы доставки). Подробности фиксированы в докстрингах (`site/public/cgi-bin/contact.py`).
**Validation:** клиентская — JS-валидация в `ContactForm.astro`; серверная — дублируется в `contact.py` (сервер — единственная истина, включая нормализацию телефона).
**Authentication:** сайт публичный; аутентификации нет. Telegram-бот авторизуется секретом вне docroot.

---

*Architecture analysis: 2026-10-27*
