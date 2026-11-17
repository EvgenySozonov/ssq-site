# Global Wave Integration — досье-референс

# Назначение

- Глубокая проработка одного референса из бенчмарка (см. [smart-home-sites-benchmark.md](smart-home-sites-benchmark.md), раздел 1): структура, подача, приёмы и что переносимо в SSQ-site.
- Формат: [тема] — [тип].md. Собрано прямым скрейпом Firecrawl CLI 2026-11-17 (высокая достоверность — все цитаты из полученного контента). Методология в конце.

# 1. Сводка

- Компания: Global Wave Integration (GWI), Лос-Анджелес — luxury-интегратор умного дома, позиционирование «imagination driven».
- Сайт: WordPress, ~478 URL по карте (2026-11-17), из них ~350 — однотипные geo-посадочные `smart-home-{город}`: SEO-программа охвата городов LA, Калифорнии и курортных регионов США (Аспен, Майами, Лас-Вегас, Кабо-Сан-Лукас; до Сиэтла — Lake Oswego).
- Ядро сайта — компактный каркас из ~10 страниц (см. раздел 2); вся остальная масса — programmatic SEO.
- Фирменный слой: бренд **Wave of Wellness™** (wellness-сценарий: циркадный свет, воздух, вода, сон, EMF) + AI-платформа **Waverly AI** как «интеллектуальный слой дома».

# 2. Каркас навигации (со скриншота шапки главной)

`HOME · ABOUT US · SERVICES · PORTFOLIO · PRESS & MEDIA · TESTIMONIALS · BLOG · WAVE OF WELLNESS™ · COMMERCIAL · CONTACT US`

- Плавающая «таблетка»-шапка на тёмном фоне (скриншот: [globalwaveintegration-home.png](globalwaveintegration-home.png)).
- Десять пунктов — много; два ключевых CTA вынесены из меню в hero: «Experience Our Work» и «Book a Showroom Visit» (белая + зелёная таблетки).

Первый экран:
- Огромный serif-заголовок «WHERE IMAGINATION DRIVES EXPERIENCES.»
- Подача ценности через ощущение, не технику: «They ask how a room should feel before they ask where to put the TV» — позиционирование «технология исчезает в архитектуре», подключение на schematic phase.
- Строка доверия под заголовком: **CEDIA AWARD WINNER · AS FEATURED IN ARCHITECTURAL DIGEST · AS QUOTED IN FORBES · 33 INDUSTRY AWARDS**.
- Сервис-грид на главной: 4 группы (Home Automation / Home Entertainment / Lighting Design / Wellness) → иконки-плитки → якоря `/featured-services/#*` и страницы wellness.

# 3. Ключевые страницы (что именно сделано)

## `/featured-services` — услуги одной якорной страницей

- Вся таксономия услуг — **10 секций-якорей в одном URL**: Lighting & Shades, Home Networks, Audio, A/V Systems, Home Theater, Outdoor Experience, Wellness Living, Home Automation, Home Security, Cybersecurity.
- Навигатор сверху: «What Services are you looking for?» — список-оглавление (тот же приём, что «What's most important to you?» у Lifetronic, бенчмарк п. 5.5).
- Каждая секция: заголовок-ценность + 3 подзаголовка-буллета, и на каждой — кнопка **«Request Demo» → globalwaveintegration.as.me** (внешний планировщик, Calendly-типа). CTA услуги = бронирование демо, а не «оставить заявку».
- Cybersecurity и Home Networks как отдельные услуги — редко у интеграторов; для premium-аудитории приватность = сервис.

## `/projects` — портфолио = доказательства наград

- 3 детальных кейса с историей: Brentwood (4 награды CEDIA Expo 2025, DCI-compliant video wall, «Wave of Wellness app»), Hillsboro Beach (5 наград CEDIA 2021, Crestron, «Global Best Integrated Home»), Melhill (скрытый проектор через 16ft drop-down screen).
- Каждый кейс: локация + «задача-решение-результат» + фотогалереи по темам (Outdoor technology / Home Theaters / Racks and Equipment).
- Секция «Racks and Equipment» — фото серверных стоек как демонстрация качества монтажа: сильный сигнал для инженерной аудитории (архитекторы/строители).
- CTA после портфолио: «Dreaming about us completing your project…» → форма.

## `/our-process` — процесс из 4 шагов

- Consultation → Custom Design → Bring It to Life → Support + «Global Wave Pledge» (гарантийное обещание).
- Каждый шаг — абзац ценности, без цен и сроков. Слабая сторона: «Support» без цен на планы (они есть, на отдельной geo-странице).

## `/who-we-are`

- Миссия + видео, акцент на privacy: строгие политики конфиденциальности как аргумент доверия для luxury-клиента.
- Ключевая формулировка миссии: low-voltage integrator для built environment; экология и sustainability как ценность.

## `/explore-our-showroom` («Imaginarium», Burbank)

- Шоурум как продукт: фото с подписями конкретных артефактов (Ketra A20 в подвесе, 144″ экран, hidden audio), адрес + Google Maps ссылка.
- **Букинг демо с механизмом**: «Reserve your showroom demo» → as.me; описан сценарий визита (чек-ин, 60 минут демо, next steps). Демонстрация вместо рассказа — «clients are much more visual in their decision-making process» (цитата из отзывов).

## `/testimonials`

- Заголовок сегментирует аудиторию: «Trusted by homeowners, architects, designers, and builders».
- Формат: длинные, подробные, именные отзывы с конкретикой (сроки, имена сотрудников, «interviewed 3 companies over 6 months», «coffee is very good»). Много — скролл-лента. Той же формы с полем «How did you find us?» в подвале.

## `/gwi-service-support-plans` — geo-SEO страница с реальным продуктом

- Страница одного типа с `smart-home-{город}`, но несёт контент сервисных планов: Priority Support (same/next business day), Remote Diagnostics, Annual Review, Software & Firmware updates.
- **FAQ отвечает на 4 реальных возражения**: поддержка после установки, состав плана, поломка Crestron/Lutron, «возьмёте ли сервис чужой системы» (да — take-over от других интеграторов).
- Цены на планы — «contact us for current plan options and pricing». Строка доверия: «19 years. 400+ luxury residences. 33 industry awards.»

## `/get-in-touch-with-global-wave-integration`

- Форма: First/Last Name, Email Address, Message + обязательный квалификатор **«How did you find us?»** (Google / Houzz / Social Media / Referral / Other) — атрибуция каналов прямо в форме (совпадает с приёмом Lifetronic, бенчмарк п. 5.5).
- Подвал-форма продублирована на каждой ключевой странице. Телефона в шапке нет — только форма (контраст с RU-рынком, где tel: обязателен).

# 4. Программатик-SEO машина (структурный приём)

- ~350 geo-посадочных `smart-home-{город}` + `home-automation-{город}`, дубли пар `smart-home-x`/`x-2` — плотный охват ЛА и курортов.
- Контентные кластеры сравнений и вопросов: `savant-vs-crestron`, `crestron-vs-control4`, `joshai-vs-savant`, `eero-vs-ubiquiti`, `lutron-radiora3-vs-ketra`, `how-much-does-control4-cost`, `who-installs-smart-homes-los-angeles` — перехват запросов на этапе выбора интегратора/платформы.
- Тот же движок производит и «продуктовые» страницы: `smart-home-budget-calculator`, `healthy-home-score`, `schematic-phase-technology-design`, `waverly-ai-platform`.
- Побочный эффект: числа на сайте противоречивы уже в трёх слоях — «25 years» (hero главной, title about) vs «19 years» (service plans, дважды) vs «over a decade of experience» в теле `/who-we-are`; на страницах везде «400+ installations/residences» (число 428 встречается только в слаге `gwi-400-luxury-residences`, в контенте его нет) — при programmatic-генерации типовой уход от консистентности.

# 5. Wave of Wellness™ — фирменный бренд-слой

- Отдельный пункт меню и собственная линейка страниц (`wellness-offerings`, `wave-of-wellness-*`, `healthy-home-score`, `sleep-optimization-technology`, `waverly-ai-platform`).
- Позиционирование: «not a control system — the intelligence layer that orchestrates your home»: циркадный свет, терморежим сна, качество воздуха в реальном времени, биометрия.
- Практический ход: собственный товарный бренд поверх вендорских платформ + AI-партнёр (FutureCare/futurecare.ai упомянут напрямую с главной).
- Цитата президента компании в Forbes (февраль 2026) вынесена на главную — PR → доверие → CTA.

# 6. Что брать в SSQ, что — нет

**Переносимые приёмы (для каркаса SSQ-site):**
1. **Один CTA-глагол на каждый сегмент пути**: «посмотреть работы» vs «забронировать визит/замер» — два разных продукта входа; у SSQ это «Смотреть проекты» vs «Выезд специалиста».
2. **Секция-оглавление «Что вы ищете?»** на странице услуг (якорная навигация) — дешевле и юзабельнее плоского списка (совпадает с выводом 5.5 бенчмарка).
3. **Booking-механика визита**: описанный сценарий визита (сколько минут, что происходит по шагам) снимает страх «непонятного званка». Для SSQ — сценарий бесплатного выезда замерщика.
4. **FAQ = ответы на конкретные возражения** (не общие вопросы): «возьмёте ли сервис чужой системы» → для SSQ аналог «сделаете ли умный дом в уже построенном доме».
5. **Фото серверных стоек/щитов в портфолио** — визуальное доказательство качества монтажа для инженерной аудитории (прямой аналог SSQ: фото щитов, как у comf.life).
6. **Квалификатор источника в форме** («Как вы нас нашли?») — дешёвая аналитика каналов; совместимо с формой SSQ (см. [[ssq-form-cgi]]-контракт, honeypot уже есть).
7. **Geo-шаблон посадочных** — подтверждённый паттерн (бенчмарк п. 5.5) на массе 350 страниц; при выходе SSQ за Москву и область.
8. **Сервисные планы / поддержка отдельным продуктом** — recurring-выручка; для SSQ «потом» (совместимо с «услуги расширятся»).

**Что НЕ копировать:**
1. **Претензии наград и «25 years»** — у SSQ нет CEDIA/Architectural Digest; подмена доверия «числами с потолка» считается аудиторией мгновенно (а их собственные числа противоречивы — 19/25 лет).
2. **Wave of Wellness™ на старте** — это продукт с AI-платформой и PR-машиной, а не слоган; SSQ нечем закрыть.
3. **Претензии чисел без консистентности** — GWI сам расходится (19/25 лет, «over a decade»); SSQ: любое число на сайте должно сходиться между страницами.
4. **350 geo-страниц до наличия инфраструктуры** — у GWI это работает на 25-летней брендовой базе; для нового домена риск thin-content-фильтра.
5. **Отсутствие телефона**: GWI может себе позволить форму 24/7; RU-аудитория expects tel: (см. юзабилити-ревью example/index.html — tel: добавлен в шапку).
6. **Отсутствие цен нигде** — это уход от прозрачности, а не стратегия; SSQ выбрал открытые цены (вывод 5.1 бенчмарка).

# 7. Методология и достоверность

- Сбор: `firecrawl map` (478 URL) + batch-scrape 10 ключевых страниц в markdown + скриншот главной desktop 1920px. 12 кредитов Firecrawl (остаток ~1013).
- Все цитаты — из полученного скрейпа 2026-11-17; факт о 350 geo-страницах — подсчёт по карте URL. Высокая достоверность для разделов 1–4.
- Раздел 5 (Wave of Wellness) — по 3 скрейпнутым страницам + текстам ссылок; средняя достоверность детализации платформы (Waverly AI не скрейпился отдельно).
- Анализ раздела 6 — интерпретация автора досье; спорные места прогнаны независимой перепроверкой (см. лог проверки claude-mem).
- Сырые скрейпы: `/tmp/gwi-ref/pages/*.md` (10 файлов) — не в репозитории.
