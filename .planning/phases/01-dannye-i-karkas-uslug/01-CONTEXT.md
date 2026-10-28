# Phase 1: Данные и каркас услуг - Context

**Gathered:** 2026-10-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Разделы услуг и данные сайта строятся исключительно из JSON: `lines.json` + `<line>.json` + zod-схемы в `site/src/lib/data.ts`, роутинг `/services/[line]/[service]/` циклом, вит-гейт `npm test`, `site.json` приведён к контракту спеки §4.6. Наполнение текстов/контента и React-инфраструктура — вне этой фазы (решение 2026-10-27: React вне v1.0).

</domain>

<decisions>
## Implementation Decisions

### Перечень услуг
- **D-01:** Услуги первого наполнения — заглушки-шаблоны, по 4–5 услуг на каждое из двух направлений (elektromontazh, umniy-dom), с реальными названиями типовых работ жанра «Замена проводки», «Установка щита», «Умное реле освещения». Контент-фаза заменит тексты без правки кода (тест добавляемости — инвариант фазы).
- **D-02:** Слаги услуг — транслит кириллических названий в kebab-case (`zamena-provodki`, `ustanovka-shchita`); совпадает с инвариантом zod slug kebab-case.
- **D-03:** Summary услуги — одно предложение, до ~120 знаков; страница услуги получит развёрнутый текст в контент-фазе.

### Ценовая политика
- **D-04:** Правило цены: типовые позиционные работы — «от … ₽» (замена розеток, монтаж щита, установка смарт-реле); индивидуальные проекты (полная разводка, дом под ключ) — «по смете».
- **D-05:** Цифры `priceFrom` — реалистичные ориентиры рынка электромонтажа 2026, помеченные в JSON как ориентир до утверждения прайса владельцем; правятся одной правкой JSON.
- **D-06:** Цена хранится целым числом (рубли) в JSON; форматирование («от 8 000 ₽», разделитель тысяч, знак ₽) — в одном месте рендера.
- **D-07:** «По смете» кодируется отсутствием `priceFrom` (или `priceFrom: 0`) — одно поле, один инвариант zod (совпадает со success criteria фазы).

### Claude's Discretion
Факты `site.json` (email, address, workingHours, telegram, реальный телефон) не обсуждались: берутся согласованные плейсхолдеры с пометкой ⏳ (долг приёмки №1 и №7 из отчёта 2026-10-18), правка одного JSON без кода.
- Порядок направлений/услуг (поле `order`), поведение пустых состояний (пустые массивы услуг, блок без цен) — на усмотрение Claude по контрактам spec и design.md.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Контракты данных
- `docs/specs/ssq-site-stack-design.md` §4 — контракты lines.json / услуг / pricing.json / site.json §4.6; §3 — тест добавляемости
- `.planning/codebase/ARCHITECTURE.md` — карта маршрутов, модель данных направлений (контракт `order`, реакция на accentColor), целевая структура src/

### Проектные границы и стили
- `.planning/REQUIREMENTS.md` — REQ-services-lines-hierarchy, REQ-growth-extensibility
- `docs/design.md` — дизайн-система «Ночная медь» (токены, состояние сетки)
- `docs/content/strategy.md` — факты компании (позиционирование, реквизиты ⏳)
- `.planning/codebase/CONVENTIONS.md` — TS strict, zod→z.infer, токены

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `site/src/layouts/BaseLayout.astro` — каркас страницы готов, подключает токены и мету
- `site/src/pages/index.astro` — заглушка главной, заменяется разделами из JSON
- `site/src/data/site.json` — расширить до §4.6 (сейчас `{name, phone, phoneHref, endpoint}`)
- `site/src/styles/tokens.css` + Tailwind v4 `@theme` — все стилизация через токены

### Established Patterns
- Данные отделены от компонентов: JSON → импорт → data-атрибуты/props (паттерн ContactForm)
- Vanilla JS, ноль клиентского фреймворка в v1.0 (ContactForm.astro — эталон)
- Гейты: lint/check/build/test:e2e/test:server; vitest-гейт `npm test` — добавляется этой фазой
- Astro SSG + `getStaticPaths` — целевой механизм роутинга услуг

### Integration Points
- Новые страницы попадают в карту маршрутов `.planning/codebase/ARCHITECTURE.md` (роуты `/services/…`)
- `/calculator/`, `/reviews/`, `/blog/` остаются роут-заглушками v1.0
- e2e (Playwright) и unittest контактной формы не трогаются; новый вит-гейт добавляет юнит-слой

</code_context>

<specifics>
## Specific Ideas

- Пример жанра слага: `zamena-provodki`, `ustanovka-shchita` (транслит), не английские `rewiring`
- Формат ценника: «от 8 000 ₽»; «по смете» для проектов и услуг без цены
- Реалистичные ценовые ориентиры: замена розетки — от ₽800–1 500; монтаж щита — от ₽8–15 тыс.

</specifics>

<deferred>
## Deferred Ideas

- Реальный каталог услуг компании (замена заглушек) — контент-фаза, код не правится
- Реальные цифры прайса от владельца — уточнение priceFrom, правка одного JSON
- Факты site.json: email/address/workingHours/telegram/телефон — правка одного JSON (долг приёмки №1/№7)
- Порядок сортировки направлений/услуг и пустые состояния — Claude's Discretion по контрактам spec

</deferred>

---

*Phase: 1-Данные и каркас услуг*
*Context gathered: 2026-10-28*