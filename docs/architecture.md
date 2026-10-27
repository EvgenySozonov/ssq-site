# Назначение файла

- Описание стека, где что лежит, как устроены маршруты и данные, как разворачивается.
- C4-модель (Structurizr DSL) — [architecture/c4/](architecture/c4/README.md): визуальный слой этой же архитектуры; правится вместе с изменениями здесь.
- См. также: [product.md](product.md) — цели и структура услуг; [design.md](design.md) — дизайн-система; `.planning/ROADMAP.md` — порядок реализации (фазы).

# Стек (решение от 2026-10-16)

- **Astro** (генератор статических сайтов) + **TypeScript** (strict). React-острова — только для будущих интерактивных секций (калькулятор, фильтр портфолио), **вне первого релиза** (решение 2026-10-27 — см. [memory.md](memory.md)); в каркасе v1.0 React-зависимостей нет.
- **Tailwind CSS v4** — стилизация; дизайн-токены как CSS-переменные (см. design.md).
- Контент: **Content Collections** — MDX для портфолио и блога, JSON для структурированных данных.
- Форма: **Python 3 CGI-скрипт (только stdlib) на хостинге Beget Shared** → Telegram. Никакого Node в проде.
- Деплой: `deploy.sh` — `astro build` → rsync по SSH на Beget. Git: приватный репозиторий GitHub.
- Обоснование выбора и отклонённые альтернативы — [memory.md](memory.md), решение «стек A».

# Карта маршрутов (иерархия по направлениям услуг)

Все страницы — статические (SSG). Динамическая сборка — только через `getStaticPaths` поверх коллекций и JSON.

```
/                              # главная (лендинг)
/services/                     # обзор направлений услуг
/services/[line]/              # посадочная направления: elektromontazh, umniy-dom
/services/[line]/[service]/    # страница отдельной услуги внутри направления
/portfolio/                    # работы, фильтр по направлению
/portfolio/[slug]/             # кейс (MDX, поле line)
/pricing/                      # цены
/calculator/                   # калькулятор стоимости (React-остров, v1.1+) — заглушка в v1.0
/about/                        # о компании
/reviews/                      # отзывы
/blog/ + /blog/[slug]/         # блог (эз-SEO, позже)
/contacts/                     # контакты + форма
/legal/privacy/                # политика ПДн (обязательна, 152-ФЗ)
/legal/terms/                  # условия работ
/404                           # оформленная 404
```

Ключевое требование каркаса: **роут `/services/[line]/...` строится циклом по `lines.json`**, а не отдельными файлами на каждое направление. Добавление направления = правка одного JSON, ноль новых файлов роутинга.

# Структура репозиториев (целевая для src/ нового сайта)

```
site/
├── src/pages/                  # маршруты из карты выше
├── src/components/             # Astro-компоненты секций (hero, services-блок, process...)
├── src/components/react/       # React-острова (калькулятор, фильтр) — v1.1+, в v1.0 каталога нет
├── src/layouts/Base.astro      # общий каркас страницы: head, nav, footer, meta
├── src/content/                # Content Collections: portfolio/*.mdx, blog/*.mdx
├── src/data/                   # данные:
│   ├── services/lines.json     # направления услуг (единый источник маршрутов)
│   ├── services/elektromontazh.json   # услуги направления
│   ├── services/umniy-dom.json        # услуги направления
│   ├── pricing.json
│   └── reviews.json
├── src/styles/tokens.css       # дизайн-токены (см. design.md)
└── public/cgi-bin/contact.py   # форма-эндпоинт (CGI), уходит в депой с dist/
```

# Модель данных направлений

- `lines.json`: массив `{ slug, title, tagline, order }` (контракт — [specs/ssq-site-stack-design.md](specs/ssq-site-stack-design.md) §4.1; `accentColor` из этого дока отклонён владельцем 2026-10-27). Третье направление позже = новая запись.
- `<line>.json`: список услуг `{ slug, title, summary, priceFrom?, order }`; страница услуги при наличии перелинковывается с кейсами и статьями по полю `line`.
- Коллекции `portfolio`/`blog` (схема zod): заголовок, `line` (ссылка на направление), фото, текст.

# Форма и заявки

- Эндпоинт: `cgi-bin/contact.py` на Beget (Python 3 stdlib, CGI) — honeypot против ботов, лимит частоты по IP, согласие на ПДн проверяется обязательным чекбоксом.
- Секреты (токен Telegram-бота) — вне docroot (`/home/<user>/.env-ssq`), вне git; в репо — `.env.example`.
- Ответ — JSON; JS показывает состояния (отправка → успех/ошибка), при сбое — телефон напрямую.
- Развитие: при подключении CRM меняется только тело скрипта — форма неизменна.

# SEO и метаданные

- Sitemap, OG-теги, schema.org `LocalBusiness`. У каждого `/services/[line]/[service]/` — своя пара title/description.
- Направления услуг (`/services/elektromontazh/`, `/services/umniy-dom/`) — отдельные посадочные под поисковые запросы.

# Деплой и окружение

- Beget Shared, SSH включён, CGI для `.py` — включить/проверить (панель или тест из Task 7).
- Домены: есть `smart-square.ru` и `smart-sq.ru`. Основной — `smart-square.ru` (полное совпадение с названием «Умный квадрат»); `smart-sq.ru` — 301-редирект на основной, чтобы не плодить дубли для SEO. Canonical и sitemap — только на основном домене.
- `deploy.sh`: `astro build` → rsync собранного `dist/` (включая `cgi-bin/contact.py`) на хостинг.
- Проверки вместо CI: `astro check` (ошибки типов = сломано), `astro build` (не собирается = сломано), ESLint `npm run lint` (включён в каркас, решение 2026-10-18 — memory.md), Prettier. ESLint-стек: flat config — `@eslint/js` + `typescript-eslint` + `eslint-plugin-astro` (+ jsx-a11y) + `@eslint-react` для островов + eslint-config-prettier.

# Конвенции

- Компоненты: Astro (`src/components/`); React — только острова там, где нужна интерактивность, и только с v1.1+ (решение 2026-10-27) — в v1.0 форма и интерактив на `<script>`.
- Токены: все цвета/шрифты/отступы — CSS-переменные из `tokens.css`, в компонентах не хардкодить.
- Анимации уважают `prefers-reduced-motion` (унаследовано с референса).
- Активные данные (телефон, адрес, соцсети) — в data-файлах, не в компонентах.