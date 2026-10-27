---
last_mapped_commit: 01a325d92ff12c345fd40ed162ac2b26f83cc6c2
last_mapped_at: 2026-10-27
---
# Coding Conventions

**Analysis Date:** 2026-10-27

## Authoritative Sources

- `CLAUDE.md` (корень) — правила нейминга файлов (`[тема] — [тип].md`), запрет эмодзи/декора, запрет коммита `.env`.
- `.claude/skills/ssq-astro-conventions/SKILL.md` — маршрутизация, данные, острова, SEO.
- `.claude/skills/ssq-typescript-strict/SKILL.md` — strict-режим, zod-типизация.
- `.claude/skills/ssq-tailwind-tokens/SKILL.md` — дизайн-токены.
- `.claude/skills/ssq-form-cgi/SKILL.md` — контракт формы/CGI.
- Главнее скиллов: `docs/architecture.md` и `docs/specs/ssq-site-stack-design.md`.

## Naming Patterns

**Files:**
- Astro/TS-компоненты и страницы: `PascalCase` для компонентов (`src/components/ContactForm.astro`), страницы — по имени роута (`src/pages/contacts.astro`, `src/pages/index.astro`).
- Стили: `kebab-case` (`src/styles/tokens.css`, `src/styles/global.css`).
- Данные: `site.json`, `services/lines.json`, `<line>.json` по slug (kebab-case, латиница, уникален).
- Markdown-докменты вне структуры: `[тема] — [тип].md` (правило из CLAUDE.md).
- CGI и тесты: `public/cgi-bin/contact.py`, `site/tests/test_contact.py`, `site/e2e/form.spec.ts`.

**Functions/Variables:**
- TS: `camelCase` (все идентификаторы в `src/`).
- Python (`public/cgi-bin/contact.py`): PEP 8 `snake_case`, типизированные сигнатуры, константы `UPPER_SNAKE` (`SEND_TIMEOUT_S`, `RATE_WINDOW_S`, `DEFAULT_RATE_LIMIT` — `contact.py:19-21`).

**Types:**
- Единственный источник типа = zod-схема через `z.infer`. Ручных дублирующих интерфейсов для тех же структур не создавать.
- Импорт типов — только `import type`.
- Props всех компонентов/Astro — явно типизированный `interface Props` (пример: `src/layouts/BaseLayout.astro:1-4`).

**CSS/Design:**
- Все design-значения — через CSS custom properties в `src/styles/tokens.css` (`@theme`), Tailwind v4 токены (`--color-bg`, `--color-accent`, `--radius-s`, `--font-*`). Хардкод цветов/шрифтов/радиусов в компонентах запрещён; точечные нестандартные радиусы — `style="border-radius: var(--radius-s)"`.

## Code Style

**Formatting:**
- Prettier 3 + `prettier-plugin-astro`; конфиг `site/.prettierrc.json` — единственные настройки: плагин astro, `printWidth: 100`.
- Команды: `npm run format` / `npm run format:check` (`site/package.json`).
- ESLint форматные правила выключены через `eslint-config-prettier` (`site/eslint.config.mjs`).

**Linting:**
- ESLint flat config (`site/eslint.config.mjs`): `js.configs.recommended` + `tseslint.configs.recommended` + `eslint-plugin-astro` recommended + `jsx-a11y-recommended` (a11y-расширения `eslint-plugin-jsx-a11y-x` для ESLint 10).
- React-острова (`src/components/react/**`): `@eslint-react` `recommended-typescript`.
- Ignores: `dist/**`, `.astro/**`, `public/cgi-bin/**` (CGI — Python, вне ESLint).
- Запуск: `npm run lint` / `npm run lint:fix`. Гейт: lint без ошибок; a11y-замечания не глушить без причины.

**TypeScript:**
- `site/tsconfig.json` наследует `astro/tsconfigs/strict` — strict не ослаблять.
- Запрет `any`, `ts-ignore`/`ts-expect-error` без комментария-обоснования.
- `!`-non-null — только при доказуемой невозможности undefined в том же файле; иначе narrowing.
- Браузерные API / сеть — `unknown` → сужение, не `any`.
- Гейт типов: `npm run check` (`astro check`) — типы-чистый; `astro build` с ошибками типов = блокер.

## Import Organization

**Order ( Astro-файлы):**
1. Docstring-комментарий контракта (JSdoc-блок с ссылками на docs, см. Comments)
2. Импорты (типы — `import type`)
3. Данные: `import siteData from "../data/site.json"` (`src/components/ContactForm.astro:7`)
4. `interface Props` / константы
5. Фронтматтер-логика
6. Разметка

**Path Aliases:**
- Не используются — относительные импорты (`../data/site.json`).

## Error Handling

**Frontend (форма, `src/components/ContactForm.astro`):**
- Ошибка поля = `aria-invalid="true"` + текст в связанной `<p id="...-error" aria-...>` (a11y-корректно и тестируемо — контракт в `site/e2e/form.spec.ts`).
- Подтверждение успеха — элемент `role="status"` / `aria-live="polite"`.
- Клиент и сервер используют одинаковую нормализацию телефона (инвариант, покрытый тестами `site/tests/test_contact.py` и `site/e2e/form.spec.ts`).

**CGI (`public/cgi-bin/contact.py`):**
- HTTP-контракт: 200 `{ok:true}`; 400 `{ok:false, error}` с русским дружелюбным текстом (валидация, rate-limit, мусорный JSON); 502 `{ok:false}` при отказе доставки/секретах/таймауте. «Тихой потери заявки нет» — маскированный успех только для honeypot.
- Только stdlib (Python 3), сеть — `urllib`, таймаут `SEND_TIMEOUT_S = 5`.

## Logging

**Framework:** None — консольные логи не используются; статический сайт + CGI без логов в коде. Диагностика через HTTP-коды ответа CGI.

## Comments

**When to Comment:**
- Каждый нетривиальный файл начинается docstring/блоком-контрактом: ссылка на раздел `docs/architecture.md` / `docs/specs/ssq-site-stack-design.md` + краткое решение (примеры: `src/components/ContactForm.astro:1-6`, `public/cgi-bin/contact.py:1-14`, `site/tests/test_contact.py:4-14`).
- Инлайн-комментарии — русские, объясняют «почему» (honeypot в `ContactForm.astro`, секционные разделители `# ── ... ──` в `contact.py`).

**JSDoc/TSDoc:**
- Doc-блоки на helper-функциях тестов (`spyContactEndpoint` в `site/e2e/form.spec.ts`) с описанием роли.

## Language Convention

- Весь пользовательский текст, комментарии, тексты ошибок, label-имена — русские. E2E-селекторы по accessible-именам завязаны на русские тексты лейблов (тексты лейблов = часть контракта).

## Module Design

**Exports:**
- Astro-компоненты — default export компонента; страницы — сам файл-роут.
- React-острова (будущие) — живут в `src/components/react/`, named exports.
- CGI — единственный `handle(environ, stdin, deliver, rate_dir)` — зависимость-инъекция для тестируемости (`public/cgi-bin/contact.py`, используется `site/tests/test_contact.py`).

**Data flow:**
- Активные данные — только в `src/data/site.json` (единственный источник контактов/эндпоинта); хардкод контактов в компонентах = баг.
- Роуты направлений — циклом по `lines.json`, не файлами на каждое направление; добавление направления = строка в JSON, ноль правок кода.

## Function Design

**Size:** CGI — маленькие чистые функции с секционными разделителями; типизированные возвращаемые кортежи (`Tuple`, `Union` в `contact.py`).
**Parameters:** DI-паттерн для побочных эффектов (`deliver`, `rate_dir` — параметры `handle`).
**Return Values:** Структурированные кортежи `(status, payload)`, не строки.

---

*Convention analysis: 2026-10-27*
