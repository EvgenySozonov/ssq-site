# Requirements: SSQ-site

Источник: `docs/product.md` (PRD, high). Всего v1-требований: 6. Конкурирующих вариантов приёмки нет.

## REQ-multipage-site
- **Description:** Полнофункциональный многостраничный сайт «Умный квадрат» — услуги разработки умных домов и электромонтажа. Состав первого релиза: главная, направления услуг, услуги, портфолио (пустое — скрыто), цены, о компании, отзывы (скрыто), контакты, юрстраницы; блог/калькулятор — честные маршруты-заглушки.
- **Acceptance:** Сайт собирается `astro build` без ошибок; Lighthouse на мобильных ≥ 90 (performance, SEO).
- **Scope:** сайт целиком, первый релиз.
- **Phase:** Phase 3.

## REQ-premium-positioning
- **Description:** Премиальное позиционирование — дизайн и кейсы продают вместо скидок; аудитория с чеком от сотен тысяч ₽ (владельцы квартир/домов в ремонте/новостройке, Москва и МО). Поведение: сначала работы и цены, затем контакт; лёгкий вход «бесплатный выезд».
- **Acceptance:** нет в источнике (приёмка — через структуру главной, честный копирайтинг и дизайн-токены «Ночной меди»).
- **Scope:** позиционирование, аудитория.
- **Phase:** Phase 2.

## REQ-leads-telegram-form
- **Description:** Заявки — главный KPI: сообщения с формы → Telegram, звонки, повторные визиты. CTA первого экрана — «Бесплатный выезд для замера». Форма → `cgi-bin/contact.py` (Python CGI, Beget) → Telegram; позже — CRM заменой тела эндпоинта (адаптер).
- **Acceptance:** Форма реально доставляет заявки в Telegram (прод-smoke).
- **Scope:** конверсия, форма заявки.
- **Phase:** Phase 4.

## REQ-services-lines-hierarchy
- **Description:** Услуги сгруппированы по направлениям; каждое направление — раздел с посадочной (`/services/elektromontazh/`, `/services/umniy-dom/`). Направления и услуги — JSON (структурированные данные), статья-обоснование — блог.
- **Acceptance:** каркас строит направления циклом по `lines.json` — правка одного JSON собирает раздел.
- **Scope:** структура услуг, роутинг.
- **Phase:** Phase 1.

## REQ-growth-extensibility
- **Description:** Рост вместе с компанией: новое направление (например, «Солнечные панели») = новая запись в `data/services/lines.json`, каркас строит раздел автоматически.
- **Acceptance:** добавление третьего направления правкой одного JSON (тест добавляемости).
- **Scope:** расширяемость каркаса.
- **Phase:** Phase 1.

## REQ-pdn-consent-152fz
- **Description:** Согласие на обработку персональных данных (чекбокс + политика на `/legal/privacy/` с реквизитами оператора-ИП) — обязательное требование 152-ФЗ до выката формы.
- **Acceptance:** нет в PRD; контракты проверки — `CSP-legal-gate` (.planning/intel/constraints.md), docs/qa.md.
- **Scope:** правовые требования.
- **Phase:** Phase 4.

## Вне v1 (будущие фазы, без v1-REQ)

- Фаза 5 (v1.1): фото объектов и «живой» hero (съёмка — владелец).
- Фаза 6 (v1.1): блог — контент; схемы и роуты готовит каркас v1.
- Фаза 7 (v1.1+): калькулятор и фильтр портфолио — без React-инфраструктуры (DEC-react-deferred).

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-multipage-site | Phase 3 | Pending |
| REQ-premium-positioning | Phase 2 | Pending |
| REQ-leads-telegram-form | Phase 4 | Pending |
| REQ-services-lines-hierarchy | Phase 1 | Pending |
| REQ-growth-extensibility | Phase 1 | Pending |
| REQ-pdn-consent-152fz | Phase 4 | Pending |

Покрытие: 6/6 v1-требований, сирот и дублей нет. Долги реализации (lines.json, zod, 404.astro, /legal/privacy/, deploy.sh, vitest-гейт; дрейф site.json и телефона) распределены по фазам ROADMAP.md, новых требований сверх реестра не вводили.