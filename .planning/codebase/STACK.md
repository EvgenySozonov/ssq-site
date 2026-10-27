---
last_mapped_commit: 01a325d92ff12c345fd40ed162ac2b26f83cc6c2
last_mapped_at: 2026-10-27
---
# Technology Stack

**Analysis Date:** 2026-10-27

## Languages

**Primary:**
- TypeScript (strict) — весь код сайта в `site/src/` (`.astro` + `<script>` TS), конфиг `site/tsconfig.json` extends `astro/tsconfigs/strict`
- Astro components (`.astro`) — страницы, layout, компонент формы: `site/src/pages/index.astro`, `site/src/pages/contacts.astro`, `site/src/layouts/BaseLayout.astro`, `site/src/components/ContactForm.astro`

**Secondary:**
- Python 3 — CGI-эндпоинт формы `site/public/cgi-bin/contact.py` (только stdlib), серверные тесты `site/tests/test_contact.py` (unittest)

## Runtime

**Environment:**
- Node.js >= 22.22.0 (зафиксировано в `site/package.json` → `engines`); локально v26.7.0

**Package Manager:**
- npm (lockfile `site/package-lock.json` присутствует)

## Frameworks

**Core:**
- Astro ^7.4.0 — статическая генерация сайта (`site/astro.config.mjs`), `site: https://smart-square.ru`, без адаптеров (полная статика)
- Tailwind CSS ^4.3.3 через `@tailwindcss/vite` (vite-плагин в `site/astro.config.mjs`; отдельного tailwind.config нет — CSS-first конфиг в `site/src/styles/tokens.css`, `@theme`-токены «Ночной меди»)

**Testing:**
- Playwright ^1.64.1 — e2e (`site/playwright.config.ts`, тесты `site/e2e/form.spec.ts`, chromium)
- Python unittest — серверные тесты CGI (`site/tests/test_contact.py`, запуск `npm run test:server`)

**Build/Dev:**
- Astro CLI: `npm run dev` (~http://localhost:4321), `build`, `preview`
- Prettier ^3.9.10 (+ `prettier-plugin-astro`), ESLint ^10 (+ `eslint-plugin-astro`, `@eslint-react/eslint-plugin`, `eslint-plugin-jsx-a11y-x`, `typescript-eslint`; конфиг `site/eslint.config.mjs`)
- `astro check` (`@astrojs/check` + TypeScript ^6.0.3) — типовой гейт

## Key Dependencies

**Critical:**
- `astro` ^7.4.0 — генератор статики, ядро сайта
- `tailwindcss` + `@tailwindcss/vite` ^4.3.3 — единственная система стилей

**Infrastructure:**
- Внешних раннтайм-зависимостей нет: фронт — vanilla JS в `<script>` внутри `.astro` (`site/src/components/ContactForm.astro`), CGI-бэкенд — только stdlib Python (`site/public/cgi-bin/contact.py`)

**Not detected:**
- React (@astrojs/react, react, react-dom) — отсутсвуют в `site/package.json`, нет `.tsx/.jsx`. README упоминает «React-острова», но фактически форма реализована на vanilla JS (самокомментарий в `site/src/components/ContactForm.astro`: «React-остров не обоснован»). Не добавлять React без необходимости.
- MDX / Content Collections — README их упоминает, но зависимостей и `src/content/` нет; данные только `site/src/data/site.json`

## Configuration

**Environment:**
- Секреты формы: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`; опционально `SSQ_ENV_PATH` — путь к файлу секретов на сервере Beget (`.env-ssq` создаётся вручную вне rsync). Файлов `.env` в репозитории нет.
- Все контентные данные — `site/src/data/site.json` (name, phone, phoneHref, endpoint `/cgi-bin/contact.py`)

**Build:**
- `site/astro.config.mjs` — Astro + Tailwind vite-плагин, production site URL
- `site/tsconfig.json` — strict
- `site/eslint.config.mjs` — flat config (astro + react + a11y + TS)
- `site/.prettierrc.json` — форматирование
- `site/playwright.config.ts` — e2e: сборка + preview как webServer

## Platform Requirements

**Development:**
- Node >= 22, Python 3 (локально 3.14) для серверных тестов CGI
- Гейты: `lint`, `check`, `build`, `test:e2e`, `test:server` (см. `README.md`)

**Production:**
- Beget Shared hosting: Apache с CGI — `site/public/cgi-bin/.htaccess` (`AddHandler cgi-script .py`, `Options +ExecCGI`), CGI-скрипт выезжает с `dist/`
- Деплой: `astro build` → rsync по SSH (`deploy.sh` по плану, `docs/specs/ssq-site-stack-design.md` §Деплой); rollback через rsync `--backup-dir` в `~/releases/backup-<timestamp>/` (симлинки неприменимы)

## CI/CD

- Not detected — нет pipeline-конфигов; деплой вручную rsync

---

*Stack analysis: 2026-10-27*
