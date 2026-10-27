# Roadmap: SSQ-site (студия «Умный квадрат» — электромонтаж и умный дом)

## Overview

Путь от текущего brownfield-состояния (в `site/` есть каркас Astro 7.4: index-заглушка, контакты с формой + CGI → Telegram, токены «Ночной меди», e2e и unittest) до «готов к выкату»: сначала каркас данных услуг строит разделы из JSON (долги: `lines.json`, zod, vitest-гейт, контракт `site.json`), затем главная превращается в премиальную витрину по design.md с честным копирайтингом, затем достраиваются все маршруты первого релиза с SEO-базой, и финальная фаза закрывает правовой гейт 152-ФЗ и выкатывает сайт на Beget скриптом `deploy.sh` с реальной доставкой заявок в Telegram. Калькулятор, фильтр портфолио, фото и блог остаются за пределами v1.0 как будущие фазы (без React-инфраструктуры — DEC-react-deferred).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): planned milestone work
- Decimal phases (2.1, 2.2): urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Данные и каркас услуг** — разделы услуг строятся из `lines.json`; zod-схемы, vitest-гейт, контракт `site.json`
- [ ] **Phase 2: Премиальная главная** — витрина по design.md: честный копирайтинг, «Ночная медь», скрывающиеся пустые блоки
- [ ] **Phase 3: Страницы релиза и SEO** — все маршруты v1 (цены, портфолио, о компании, 404, заглушки) + мета-разметка
- [ ] **Phase 4: Правовой гейт 152-ФЗ и выкат** — политика ПДн, `deploy.sh`, прод-доставка заявок в Telegram

## Phase Details

### Phase 1: Данные и каркас услуг
**Goal**: Разделы услуг строятся исключительно из JSON — добавление третьего направления это правка одного `lines.json`, ноль правок кода и без React-инфраструктуры.
**Depends on**: Nothing (first phase; brownfield-каркас `site/` уже на месте: e2e, unittest, tokens.css)
**Requirements**: REQ-services-lines-hierarchy, REQ-growth-extensibility
**Success Criteria** (what must be TRUE):
  1. Открыть `/services/` — карточки двух направлений (электромонтаж, умный дом) ведут на посадочные `/services/[line]/`, собранные циклом по `lines.json`; на посадочной — сетка услуг с «от … ₽» или «по смете».
  2. Тест добавляемости зелёный: строка `{ slug, title, tagline, order }` в `lines.json` собирает раздел `/services/<slug>/` с услугами без правки кода.
  3. Гейт `npm test` (vitest) существует в `site/package.json` и зелёный: zod-схемы (`lib/data.ts`) lines.json / услуг / pricing.json, инварианты (slug kebab-case и уникален, `priceFrom: 0` → «по смете»).
  4. `site.json` приведён к контракту спеки §4.6 (`phone`, `email`, `address`, `workingHours`, `telegram`, `phoneHref`); контакты и эндпоинт нигде не хардкодятся.
**Plans**: TBD

Plans:
- [ ] 01-01: TBD

**Примечания**: контракт `lines.json` — DEC-lines-contract (`order`, без `accentColor`); внесён в `.planning/codebase/ARCHITECTURE.md` (2026-10-28). Здесь же — схемы коллекций (portfolio/blog/pricing/reviews по SCH-collections) и React-формулировки (DEC-react-deferred, внесён 2026-10-28).

### Phase 2: Премиальная главная
**Goal**: Главная продаёт премиальность без скидок: структура секций design.md, честный копирайтинг нового бренда, «Ночная медь» — до правового гейта и выката.
**Depends on**: Phase 1
**Requirements**: REQ-premium-positioning
**Success Criteria** (what must be TRUE):
  1. Секции главной в порядке design.md: Hero → Услуги (карточки направлений) → Стандарты работы (4 проверяемых обязательства) → Процесс (5 шагов) → Работы (скрыт при пустой коллекции) → Цены (превью «от …») → Отзывы (скрыт при пустых данных) → FAQ (`<details>`, без JS) → CTA-футер.
  2. Hero — полный-bleed градиент-фоллбек «Ночной меди» (без фото), текст не сдвигается (CLS ≈ 0); все цвета/шрифты/отступы — только через `tokens.css`, хардкода нет.
  3. Ни одной неподтверждаемой цифры («сотни объектов», «N лет», счётчик объектов) и ни одной «0 ₽» вместо «по смете»; CTAHero — «Бесплатный выезд для замера».
  4. ~400px без горизонтального скролла; `prefers-reduced-motion` отключает анимации; контраст меди на тёмном ≥ WCAG AA; навигация с клавиатуры.
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: Страницы релиза и SEO
**Goal**: Все маршруты первого релиза работают в едином шаблоне с корректной мета-разметкой — многостраничный сайт без болванок и пустых обещаний.
**Depends on**: Phase 1, Phase 2
**Requirements**: REQ-multipage-site
**Success Criteria** (what must be TRUE):
  1. `/pricing/` рендерит группы из `pricing.json` («от …» / «по смете»); `/about/` — 4 проверяемых стандарта вместо биографии с цифрами; `/portfolio/` + `/portfolio/[slug]/` открываются с честным пустым состоянием (без секций-фантомов).
  2. Несуществующий URL отвечает из `404.astro` в общем стиле (долг приёмки 2026-10-18 закрыт).
  3. Маршруты-заглушки первого релиза `/calculator/`, `/reviews/`, `/blog/` существуют и честно сообщают, что раздел готовится, без фейковых данных; схема коллекции blog и роут `/blog/[slug]/` подготовлены.
  4. У каждой страницы собственные title/description, `<html lang="ru">`, OG-теги; `sitemap.xml`/`robots.txt` только на smart-square.ru; schema.org `LocalBusiness` (главная, из site.json) и `Service` (направления/услуги).
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

**UI hint**: yes

### Phase 4: Правовой гейт 152-ФЗ и выкат
**Goal**: Сайт легально принимает заявки на проде Beget за один `deploy.sh`: форма доставляет в Telegram, все гейты зелёные — состояние «готов к выкату» владельца подтверждено продом, а не локалью.
**Depends on**: Phase 1, Phase 2, Phase 3
**Requirements**: REQ-leads-telegram-form, REQ-pdn-consent-152fz
**Success Criteria** (what must be TRUE):
  1. `/legal/privacy/` — политика с реквизитами оператора (ИП: ФИО/ИНН/ОГРНИП), чекбокс согласия формы связан с ней; `/legal/terms/` — условия; выкат без политики заблокирован чек-листом выката.
  2. `deploy.sh` отработал end-to-end: `astro build` → rsync `dist/` (включая `cgi-bin/contact.py` + `.htaccess`, без `__pycache__`) → сайт жив на Beget; rollback в `~/releases/backup-<ts>/` проверен обратным rsync.
  3. Прод-smoke с реального устройства: заявка с формы прод-домена приходит в Telegram; без согласия — блокировка; honeypot — маскированная «успех» без доставки; отказ Telegram → 502 и телефон как альтернативный канал; rate-limit по IP активен.
  4. Секреты только в `/home/<user>/.env-ssq` (`.env` не в git); claude-security:scan без CONFIRMED-находок; e2e (Playwright) и unittest (Python) зелёные; Lighthouse mobile ≥ 90 (performance, SEO).
  5. Контактные данные реальны и не заглушки (телефон/email/адрес/часы утверждены владельцем); `smart-sq.ru` отвечает 301 на `smart-square.ru`.
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

**Примечания**: страницы права — на готовом BaseLayout без нового дизайна (UI-спека не нужна); фокус фазы — гейт и выкат. Действия владельца, без которых фаза не стартует: реквизиты ИП и реальные контакты, токены Telegram-бота, включение CGI в панели Beget, DNS/301 smart-sq.ru.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Данные и каркас услуг | 0/TBD | Not started | - |
| 2. Премиальная главная | 0/TBD | Not started | - |
| 3. Страницы релиза и SEO | 0/TBD | Not started | - |
| 4. Правовой гейт 152-ФЗ и выкат | 0/TBD | Not started | - |

## За пределами v1.0 (v1.1 и далее — будущие фазы)

Формализуются при старте следующего milestones (`/gsd-new-milestone`); сейчас зафиксированы решением владельца (2026-10-27) и спекой §10:

- **Фаза 5 (v1.1): Фото объектов и «живой» hero** — съёмка (действие владельца, 5–7 кадров минимум одного объекта), full-bleed фото под текстом без CLS.
- **Фаза 6 (v1.1): Блог** — контент-план и статьи-обоснования направлений; схемы коллекции и роуты подготовлены в v1.0.
- **Фаза 7 (v1.1+): Калькулятор и фильтр портфолио** — интерактив без React-инфраструктуры (vanilla `<script>`-острова по образцу ContactForm); React не добавляется, пока остров не обоснует её необходимость (DEC-react-deferred). CRM-адаптер — отдельным контуром по мере появления второго процесса.