## Conflict Detection Report

Набор: 13 доков SSQ-site (1 ADR, 1 PRD, 4 SPEC, 7 DOC). Режим: new. Приоритет по умолчанию [ADR, SPEC, PRD, DOC] — переопределений precedence в классификациях нет. LOCKED-ADR в наборе нет (docs/memory.md классифицирован ADR, locked=false). UNKNOWN/low-confidence не найдено. Проверка против существующего планирования не потребована (EXISTING_CONTEXT пуст: PROJECT.md / REQUIREMENTS.md / ROADMAP.md / STATE.md отсутствуют).

### BLOCKERS (0)

Нет. LOCKED-vs-LOCKED и LOCKED-vs-CONTEXT противоречий нет (источников с locked=true не найдено).

### WARNINGS (2)

[WARNING] Расходящаяся схема lines.json между спецификациями (поле order vs accentColor)
  Found: docs/architecture.md описывает `lines.json` как `{ slug, title, tagline, accentColor }` (стр. 61)
  Found: docs/specs/ssq-site-stack-design.md (§4.1, confidence high) — `{ slug, title, tagline, order }` + zod-схема (slug kebab-case, уникален)
  Found: docs/plans/ssq-site-implementation-plan.md (Task 2) определяет `Line { slug, title, tagline, order }` — совпадает со спецификацией
  Impact: Оба источника одного приоритета (SPEC, precedence не задан); авто-вывод нарушил бы правило приоритета без основания между однотипными спецификациями. Обе версии сохранены в `intel/constraints.md` (SCH-lines с пометкой ВАРИАНТ).
  → Подтвердить владельцем контракту спецификации §4.1 (`order`, без accentColor); затем править architecture.md (по правилу докс = источник правды) и снять WARNING.

[WARNING] Дрейф докс ↔ код: React-острова
  Found: docs/architecture.md (стр. 9, 46) и ADR-запись 2026-10-16 (docs/memory.md, «Стек — вариант A») описывают React-острова как часть стека и каталог `src/components/react/` (калькулятор, фильтр портфолио); docs/product.md §Функциональность повторяет.
  Found: Реальный код — `site/package.json` не содержит React ни в dependencies, ни в devDependencies (исключая eslint-плагин @eslint-react); каталога `src/components/react/` нет; `site/src/components/ContactForm.astro` (стр. 4 комментарий) фиксирует: «React-остров не обоснован: валидация и состояния формы — ~100 строк». Форма работает на обычном `<script>`; и сам план (docs/plans/ssq-site-implementation-plan.md, Architecture) уже пишет «одна React-остров-фильтр, у формы — обычный `<script>`».
  Impact: Роадмап, собранный из дока как есть, запланирует React-инфраструктуру, которой нет и которая, возможно, не нужна; либо реальный выбор «без React» уйдёт в обход официального стека.
  → Решение владельца: (а) подтвердить React-острова только для будущих калькулятора/фильтра и уточнить формулировку в architecture.md, или (б) исключить React из стека и синхронно править architecture.md + memory.md (правило .claude/rules/docs-truth.md: изменение архитектурного решения = правка докса и затронутого скилла синхронно).

### INFO (6)

[INFO] Циклы в cross_ref-графе — не заблокировано, синтез выполнен с оговоркой
  Note: DFS с трёхцветной маркировкой нашёл 12 элементарных циклов; в циклах 10 из 14 узлов (все, кроме handoff.md, plans/ssq-site-implementation-plan.md — см. ниже как односторонний, отчёта приёмки и about.md — на деле about также входит через memory → strategy → about). Примеры: architecture.md ↔ design.md ↔ product.md ↔ plan.md ↔ memory.md ↔ strategy.md; qa.md ↔ test-case.md; plan.md ↔ specs/ssq-site-stack-design.md. По форме шага циклы требовали BLOCKER и остановки синтеза; отклонение зафиксировано сознательно: cross_refs в классификациях — это необработанные списки цитирования (не типизированные зависимости supersede/depends_on), а экстракция — однопроходная по каждому доку без рекурсивного траверса, поэтому цикл цитирования не создаёт того риска «синтез-петли», к которому относится гейт. Если cross_refs несут семантику жёстких зависимостей приоритета — пере-тагировать через --manifest и перезапустить ingest.
  Циклы (сводно): architecture ↔ design; architecture ↔ product; architecture ↔ memory; architecture ↔ plan; architecture ↔ c4/README; memory ↔ handoff; plan ↔ specs; qa ↔ test-case; strategy ↔ design; strategy ↔ product; specs → qa/plan/... обратные связи; impl-plan → specs → plan → impl-plan (3-узловой).

[INFO] Авто-разрешено: ADR-версия Node > спецификация плана «Node ≥ 20.3 (Astro 5)»
  Note: docs/plans/ssq-site-implementation-plan.md (Global Constraints) держит `Node ≥ 20.3 (Astro 5)`; ADR docs/memory.md (2026-10-18, ESLint) решил: `.nvmrc` = 24 (Node 20 за гранью поддержки, плагин требует ≥ 22). По правилу приоритетов ADR > SPEC: ADR-вариант побеждает. Факт кода подтверждает: `site/.nvmrc` = 24, `site/package.json` engines `>=22.22.0`; устаревшее ограничение помечено в intel/constraints.md (CON-implementation-global) как SUPERSEDED.

[INFO] Авто-разрешено (внутри одного ADR-дока, по дате): Python CGI > упоминание PHP
  Note: docs/memory.md, запись 2026-10-16 «Работа с лидами», упоминает «тело PHP-скрипта»; запись 2026-10-17 «Форма — Python CGI вместо PHP» (и конкретный контракт в спецификации §6.2) — более поздняя и явно решает выбор Python CGI. В intel/decisions.md запись 2026-10-16 снабжена пометкой об устаревании; контракт — CSP-form-endpoint.

[INFO] Маркировка маршрутов-заглушек расходится между архитектурой и спецификацией
  Note: docs/architecture.md (карта, стр. 28–31) перечисляет `/calculator/`, `/reviews/`, `/blog/` как полные маршруты без пометки «позже»; docs/specs/ssq-site-stack-design.md (§1/§3) помечает их как заглушки/вне объёма первого релиза (калькулятор — роут-заглушка; отзывы вне объёма; блог — вне объёма). В intel/constraints.md (CON-routes) зафиксированы обе пометки, приоритет на сформулированном контракте спецификации (§3, confidence high); architecture.md не правится на этом шаге.
  → Роадмаперу: считать /calculator/, /reviews/, /blog/ заглушками первого релиза (спецификация §1).

[INFO] Свежесть статуса: снимки план/handoff датированы 2026-10-16, код ушёл вперёд
  Note: docs/plan.md помечает все шаги «не начато», docs/handoff.md заявляет «код нового сайта не начат». Отчёт приёмки 2026-10-18 (доки/reports) и проверка кода этим шагом показывают: каркас, BaseLayout, главная-заглушка, `/contacts/` + ContactForm.astro, `cgi-bin/contact.py`, e2e (12/12) и unittest (21/21) существуют; отсутствуют: `site/src/data/services/lines.json`, zod `lib/data.ts`, коллекции контента, `404.astro`, `/legal/privacy/`, `deploy.sh`. Снимки сохранены в intel/context.md как снимки-кодов-дата; для роадмапа текущее состояние — из отчёта приёмки + факта кода.

[INFO] Контракт site.json / отсутствие vitest/zod — расхождения докс ↔ код, зафиксированы без «поправок»
  Note: Спецификация §4.6 определяет `{ phone, email, address, workingHours, telegram }` (impl-plan Task 2 добавляет `phoneHref`); реальный `site/src/data/site.json` = `{ name, phone, phoneHref, endpoint }` — email/address/workingHours/telegram отсутствуют, ключ `name` нигде не описан. Vitest гейт `npm test` (qa.md пункт 3; ADR 2026-10-18) в `site/package.json` отсутствует (есть `test:e2e`, `test:server`); zod-схем нет (нет ни одного импорта, нет site/src/lib). Телефон `+7 (915) 123-45-67` в site.json — на момент приёмки был плейсхолдер `+7 (495) 000-00-00`; реальность номера в доках не подтверждена (strategy.md ⏳). Часы работы «Пн–Сб, 9:00–20:00» в contacts.astro — придуманы как фоллбек, не утверждены (долги приёмки, п.7). Все факты — в intel/context.md и intel/constraints.md (SCH-sitejson, CON-qa-gates, PRT-deploy) с путями-источниками; роадмапер должен учесть как долги реализации, не как новые требования.

Связанные intel: .planning/intel/{decisions,requirements,constraints,context}.md; сводка — .planning/intel/SYNTHESIS.md