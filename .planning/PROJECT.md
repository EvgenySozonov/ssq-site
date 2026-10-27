# Project: SSQ-site — студия «Умный квадрат» (электромонтаж и умный дом)

## Core Value

Многостраничный сайт компании-подрядчика по электромонтажу и умному дому, который продаёт премиальность работами и ценой (а не скидками) и доставляет заявки в Telegram: без заглушек и плейсхолдеров, с юридическим гейтом 152-ФЗ, готовый к выкату на Beget.

**Метрика успешности (владелец, 2026-10-27):** «Готов к выкату» — полноценный многостраничный сайт без заглушек и плейсхолдеров; форма лидов доставляет до Telegram на проде; e2e (Playwright) и unittest (Python) зелёные; деплой через `deploy.sh` отработал на Beget.

## Контекст

- Brownfield: в `site/` уже есть Astro-каркас (Astro 7.4, Tailwind v4, TS strict): `index.astro` (заглушка), `contacts.astro` + `ContactForm.astro`, `cgi-bin/contact.py` (+ `.htaccess`), `tokens.css` «Ночной меди», Playwright e2e 12/12, unittest 21/21.
- Долги реализации (нет): `lines.json`, zod-схемы `lib/data.ts`, `404.astro`, `/legal/privacy/`, `deploy.sh`, гейт `npm test` (vitest). Дрейф: контракт `site.json` (в коде `name/phone/phoneHref/endpoint` против спеки §4.6), телефон — плейсхолдер.
- Владелец — соло; контент ведёт через git/Markdown, CMS не нужна; Claude Code — исполнитель.

## Scope v1.0 «Первый релиз»

- В объёме: каркас данных услуг (`lines.json` + zod), главная по design.md, направления (2) и услуги, цены, портфолио (пустое — блоки скрываются), о компании, контакты + форма → Telegram, политика ПДн + юрстраницы, 404, честные маршруты-заглушки (/calculator/, /reviews/, /blog/), SEO-база, `deploy.sh` + выкат.
- Вне объёма v1 (YAGNI): React-инфраструктура, блог-контент, калькулятор, CRM-адаптер, личные кабинеты, мультиязычность, dark-mode-переключатель.

## Будущее (v1.1+, фазы остаются в ROADMAP.md)

- Калькулятор и фильтр портфолио — будущие фазы без React-инфраструктуры (DEC-react-deferred).
- Фото объектов (съёмка — действие владельца, 5–7 кадров), блог-контент — статьи-обоснования направлений.

## Requirements

Реестр: `.planning/REQUIREMENTS.md` (6 v1-требований из `docs/product.md`).

<decisions locked="owner">
- DEC-lines-contract (2026-10-27): контракт `lines.json` = `{ slug, title, tagline, order }`; `accentColor` отклонён. Правка `docs/architecture.md` (стр. 61) — синхронно с реализацией.
- DEC-react-deferred (2026-10-27): React вне первого релиза; калькулятор/фильтр остаются в роадмапе как будущие фазы без React-инфраструктуры; `docs/architecture.md` + `docs/memory.md` правятся синхронно.
</decisions>

### Ключевые решения, действующие по умолчанию (источник: docs/memory.md, 2026-10-15…18; формально «proposed», работают как принятые)

| Решение | Суть |
|---|---|
| Стек | Astro SSG + TypeScript strict + Tailwind v4 (CSS-first через `tokens.css`); без React-рантайма в v1 |
| Структура услуг | Иерархия направление → услуга; роуты `/services/[line]/...` циклом по `lines.json`, ноль новых файлов на направление |
| Данные | Единственный источник контактов — `site/src/data/site.json`; хардкод контактов = дефект |
| Лиды | Форма → Python CGI (только stdlib) → Telegram Bot API; эндпоинт-адаптер под будущую CRM |
| Хостинг | Beget Shared; `deploy.sh` (build → rsync), rollback в `~/releases/backup-<ts>/`; без CI |
| Дизайн | «Ночная медь»: bg #101014, accent #c9a15a; Lora/Manrope/JetBrains Mono; все значения — только CSS-переменные |
| Право | Политика ПДн + чекбокс согласия — обязательны до выката формы (152-ФЗ) |
| Качество | Гейты: `check`/`lint`/`build`; vitest для lib-слоя (TDD); Playwright e2e; claude-security:scan перед релизом (CONFIRMED блокирует выкат) |
| Домены | smart-square.ru основной (canonical, sitemap); smart-sq.ru — 301 |
| Копирайтинг | Честный: ни одной неподтверждаемой цифры; `priceFrom: 0` → «по смете», никогда «0 ₽» |

## Constraints (сводка; полный реестр — .planning/intel/constraints.md)

- Гейты итерации: `npm run check`, `npm run lint`, `npm run build`, `npm test` (после введения vitest); мобильные ~400px без горизонтального скролла; `prefers-reduced-motion`.
- Секреты вне docroot: `/home/<user>/.env-ssq`; `.env` не попадает в git (только `.env.example`).
- TS strict не ослаблять; типы из zod через `z.infer`; ESLint flat config, a11y-правила.
- Докс = источник правды: архитектурные решения правят `docs/architecture.md`/`docs/memory.md` синхронно с кодом.