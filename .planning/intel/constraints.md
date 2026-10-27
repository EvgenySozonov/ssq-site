# Constraints (extracted from SPECs)

Присвоенные ID: CSP-* (api-contract), SCH-* (schema), NFR-* (nfr), PRT-* (protocol). Спецификации имеют одинаковый базовый приоритет (SPEC); приоритеты внутри переопределены по каждой отдельной записи не были (все precedence=null). Расхождения между спецификациями не разрешаются автоматически без исключений — там, где две спецификации расходятся, вариант помечен и сообщён отдельно (см. INGEST-CONFLICTS.md).

## CSP-form-client (api-contract)
- source: docs/specs/ssq-site-stack-design.md (§6.1, high)
- content: Поля формы `/contacts/`: имя (обяз.), телефон (обяз., формат РФ), комментарий (оп.), чекбокс согласия ПДн (обяз., ссылка на `/legal/privacy/`). Honeypot-поле `website` — видно только ботам; отправка с заполненным honeypot отвечает «успех» клиенту, но НЕ доставляется. `novalidate`, собственная подсветка ошибок. Состояния: idle → sending → ok (форма сбрасывается) / error (текст + телефон из `site.json` как альтернативный канал).

## CSP-form-endpoint (api-contract)
- source: docs/specs/ssq-site-stack-design.md (§6.2, high)
- content: Эндпоинт `cgi-bin/contact.py` (Beget, Python 3, только stdlib, CGI): `.htaccess` с `AddHandler cgi-script .py` + `ExecCGI`; метод POST, принимает `application/json` или form-encoded; отклоняет пустые обязательные/плохой телефон/несогласие — `400 {ok:false, error:"..."}` (текст русский); rate-limit по IP, `FORM_RATE_LIMIT_PER_HOUR` (по умолчанию 10/ч), счётчик в `/tmp`; доставка — POST в Telegram Bot API (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`), таймаут 5 с, при отказе Telegram — `502 {ok:false}` (успех не маскируется). Секреты вне docroot: `/home/<user>/.env-ssq` (путь через `SSQ_ENV_PATH`), env-переменные имеют приоритет; в репо — `.env.example`. Подключение CRM = замена тела доставки, контракт ответа неизменен.

## CSP-legal-gate (api-contract)
- source: docs/specs/ssq-site-stack-design.md (§6.3, high); подтверждено qa.md и docs/plan.md (границы)
- content: Форма без политики ПДн на `/legal/privacy/` c реквизитами оператора (ИП, ⏳ ФИО/ИНН/ОГРНИП) не выкатывается. Политика входит в объём шага 3 (частично опережает порядок шагов — спека §10). На момент приёмки 2026-10-18 страница не существует (открытый долг, отчёт приёмки в доке п.2) — и в коде так же: `site/src/pages/404.astro` и `/legal/privacy/` отсутствуют.

## SCH-lines (schema)
- source: docs/specs/ssq-site-stack-design.md (§4.1, high); продублировано docs/plans/ssq-site-implementation-plan.md (Task 2)
- content: `src/data/services/lines.json` — массив `{ slug, title, tagline, order }`; zod: slug kebab-case латиницей, уникален. Маршруты `/services/[line]/...` генерируются циклом по этому файлу; тест добавляемости: новая строка собирает раздел без правки кода (test-case.md, шаг 1). ВАРИАНТ: docs/architecture.md описывает `{ slug, title, tagline, accentColor }` — поле accentColor vs order расходится, см. WARNING в отчёте конфликтов.

## SCH-services-per-line (schema)
- source: docs/specs/ssq-site-stack-design.md (§4.2, high)
- content: `src/data/services/<line>.json` — услуги `{ slug, title, summary, priceFrom, order }`. `priceFrom: 0` = «цена по смете» (публично печатается «по смете», цифра — только при > 0; правило честного копирайтинга). Опциональное поле `body` (md-путь) — следующая итерация.

## SCH-collections (schema)
- source: docs/specs/ssq-site-stack-design.md (§4.3–4.5, high)
- content: Astro Content Collections (MDX). portfolio: `title`, `line` (enum по slugs из lines.json), `date`, `photos`, `summary`, `published`; `published: false` не попадает в маршруты; на старте коллекция пуста — фильтр и секция «Работы» скрываются. blog: `title`, `description`, `date`, `tags`, `published` (схема готова, контент позже). `pricing.json`: `{ group, items: [{ name, unit, priceFrom, note? }] }`. `reviews.json`: `{ author, text, date, published }` — секция рендерится только при непустом массиве.

## SCH-sitejson (schema)
- source: docs/specs/ssq-site-stack-design.md (§4.6, high)
- content: `src/data/site.json` — единственный источник контактных данных: `{ phone, email, address, workingHours, telegram }` (impl-plan Task 2 добавляет `phoneHref`); футер, контакты, эндпоинт формы и микроразметка берут отсюда, без хардкода. ФАКТ КОДА: реальный `site/src/data/site.json` имеет ключи `name/phone/phoneHref/endpoint` — поля email/address/workingHours/telegram отсутствуют, поле `name` не описано ни в спеке, ни в плане. Схема данных докс ↔ код расходится; дрейф отражён, не «дописан» в intel.

## CON-design-tokens (nfr)
- source: docs/design.md (medium); продублировано спецификацией §5 (high) и планом (Global Constraints)
- content: Палитра «Ночная медь»: bg #101014, surface #17191d (карточки с левым бордером 3px меди), text #eceae6, muted #9a9a9a, accent #c9a15a, line #2a2d33; radii 2px. Шрифты: Lora (заголовки), Manrope (текст/UI), JetBrains Mono (моно) — все с полной кириллицей, Google Fonts, `font-display: swap`, локальный фоллбек-стек обязателен. Все цвета/шрифты/отступы — только CSS-переменные `tokens.css`, хардкод в компонентах = дефект. Логотип-метка `SSQ //`, нумерация блоков 01/02/03 моно. BEM из референса не переносится — классы даёт Tailwind.

## CON-hero-commitment (nfr)
- source: docs/design.md (medium); продублировано спецификацией §5, §11.1
- content: Hero — full-bleed фото объектов + градиент затемнения; до съёмки (шаг 11, 5–7 кадров минимум одного объекта — обязательный шаг до финала) — тёмно-бронзовый градиент-фоллбек по цепочке референса. Фото дорисовывается без сдвига текста (CLS ≈ 0 — test-case.md, шаг 11).

## CON-homepage-structure (nfr)
- source: docs/design.md (medium); порядок подтверждён test-case.md шагом 2
- content: Структура главной: Hero → Услуги (карточки направлений) → Стандарты работы (4 проверяемых обязательства) → Процесс (5 шагов) → Работы (3 последних кейса; блок выводится только при наличии кейсов) → Цены (превью «от …») → Отзывы (блок скрывается при пустых данных) → FAQ (`<details>`, без JS) → CTA-футер. Каждая секция — отдельный Astro-компонент, данные из `site/src/data/`.

## CON-qa-gates (nfr)
- source: docs/qa.md (DOC, medium) — по таксономии ниже приоритетом SPEC/ADR, но контракты гейтов дублируются в спецификации §9 (high) и в memory.md 2026-10-18 (ADR)
- content: Гейты каждой итерации: `npm run check` (astro check — ошибки типов = блокер, решение владельца 2026-10-18), `npm run build`, `npm run lint` (ESLint, решение 2026-10-18), `npm test` (vitest — zod-схемы, формат цены, инварианты lines.json; обязателен перед коммитом `site/src/lib/` и `site/src/data/`). Мобильные ~400px без горизонтального скролла. Playwright MCP — UI-приёмка после релиза. claude-security:scan перед каждым релизом, CONFIRMED = блокер. Форма (каждый раз после правок): пустые обязательные — блокировка; с чекбоксом — доставка в Telegram; без чекбокса — блокировка; honeypot — маскировка; лимит по IP; ошибка эндпоинта — телефон, не «тишина». A11y: prefers-reduced-motion отключает анимации, навигация с клавиатуры, контраст меди на тёмном ≥ WCAG AA для мелкого текста. ФАКТ КОДА: vitest в `site/package.json` отсутствует, скрипта `test` нет (есть `test:e2e`, `test:server`) — gate `npm test` сегодня невыполним; дрейф помечен.

## PRT-deploy (protocol)
- source: docs/specs/ssq-site-stack-design.md (§8, high); продублировано architecture.md (средняя)
- content: Beget Shared (SSH включён; исполнение CGI .py — включить/проверить в панели до выката). `deploy.sh`: `astro build` → rsync `dist/` (включая `cgi-bin/contact.py` и `.htaccess`) в docroot; секретный `.env-ssq` на сервере вручную, rsync его не трогает. Rollback: `rsync --backup --backup-dir` в `~/releases/backup-<timestamp>/`, откат = обратный rsync; симлинки неприменимы (docroot Beget фиксирован). ФАКТ КОДА: `deploy.sh` в корне проекта отсутствует (подтверждает долг приёмки в доке п.3).

## PRT-domains (protocol)
- source: docs/specs/ssq-site-stack-design.md (§7, §8, high); docs/architecture.md (средняя)
- content: Основной домен `smart-square.ru` (canonical, sitemap только на нём); `smart-sq.ru` — 301-редирект на основной (сторона Beget/DNS — задача владельца, зафиксировано). `<html lang="ru">`. Sitemap (интеграция), robots.txt, OG-теги, schema.org: `LocalBusiness` на главной (из site.json), `Service` на страницах направлений/услуг. Свой title/description на каждой странице.

## CON-scope-first-release (nfr)
- source: docs/specs/ssq-site-stack-design.md (§1, high)
- content: Первому релизу: каркас, главная, направления (2), услуги, цены, портфолио (пустое), о компании, контакты + форма → Telegram, политика ПДн, deploy. Вне объёма (YAGNI): блог (роуты готовит каркас), калькулятор (роут-заглушка), CRM, личные кабинеты, мультиязычность, отзывы (компонент скрывается при пустых данных), dark-mode-переключатель (тема одна). Порядок: каркас → главная → контакты/форма → направления → цены → портфолио → о компании → отзывы → юрстраницы → деплой → фото → блог → калькулятор. Риски спеки: нет фото; ИП не оформлен к шагу 3; Beget Shared без Node (при усложнении CRM — пересмотреть VPS); отзывы/кейсы пусты — закрыто скрывающимися блоками.

## CON-implementation-global (nfr)
- source: docs/plans/ssq-site-implementation-plan.md (medium, Global Constraints + Review Focus)
- content: TypeScript strict. Node ≥ 20.3 (Astro 5) — УСТАРЕЛО: противоречит ADR 2026-10-18 (`.nvmrc` = 24) и реальному `site/package.json` (engines >=22.22.0, site/.nvmrc = 24); ADR-вариант сохранён в intel, разрешено в INFO-конфликте. Контактные данные только из `site.json`. Честный копирайтинг: никаких непроверяемых цифр; `priceFrom: 0` → «По смете», никогда «0 ₽». Разметка референса: карточки #17191d + левый bordер 3px #c9a15a, нумерация 01/02/03, метка `SSQ //`. `.env` в git не попадает. Репозиторий в корне, Astro в `site/`; референс `example/index.html` не трогаем; после Task 1 обновить docs/architecture.md (astro-pages → site). Review Focus (непокрытые тестом классы входов): honeypot-маскировка (Task 7), таймаут Telegram > 5 с → 502 (Task 6/7), пустые данные → блоки отсутствуют (Task 9/4), priceFrom 0 → «По смете» (Task 5/3), 400px + reduced-motion (Task 4). Порядок задач: Task 1 скаффолд, 2 данные, 3 роутинг, 4 главная, 5 цены, 6 клиент формы, 7 CGI, 8 юр+404, 9 портфолио/о компании/отзывы, 10 SEO, 11 деплой, 12 приёмка.

## CON-routes (schema)
- source: docs/architecture.md (medium); продублировано спецификацией §3 (high)
- content: Все страницы — статические (SSG), динамическая сборка только через `getStaticPaths` поверх коллекций/JSON. Маршруты: `/`, `/services/`, `/services/[line]/`, `/services/[line]/[service]/`, `/portfolio/` (фильтр — React-остров по спецификации), `/portfolio/[slug]/`, `/pricing/`, `/calculator/` (позже, заглушка), `/about/`, `/reviews/` (позже, заглушка по спецификации; architecture.md не помечает как заглушку — расхождение, INFO), `/blog/` + `/blog/[slug]/` (позже), `/contacts/`, `/legal/privacy/`, `/legal/terms/`, `/404`. Ключевое требование каркаса: `/services/[line]/...` циклом по `lines.json`, ноль новых файлов роутинга на направление.