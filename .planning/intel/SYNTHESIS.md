# SYNTHESIS.md

Точка входа для gsd-roadmapper. Режим: new. Дата синтеза: 2026-10-27.

## Доки по типам

- ADR: 1 — docs/memory.md (лог 15 решений, locked=false, статус каждой записи proposed)
- PRD: 1 — docs/product.md (high)
- SPEC: 4 — docs/specs/ssq-site-stack-design.md (high), docs/architecture.md (medium), docs/design.md (medium), docs/plans/ssq-site-implementation-plan.md (medium)
- DOC: 7 — docs/about.md (high), docs/handoff.md, docs/plan.md, docs/qa.md, docs/test-case.md, docs/content/strategy.md, docs/architecture/c4/README.md (medium), плюс docs/reports/2026-10-18-отчет-приемки-в-репо.md (DOC medium) — итого 8 файлов DOC при 7 заявленных классификатором группах; счёт по классификатору: 13 классификаций потреблено, 13+0 пропущено.
- UNKNOWN/low-confidence: нет.

## Решения (locked)

- LOCKED-ADR: 0 (все записи memory.md proposed; Status=Accepted в источнике отсутствует — потому нет ни одного решения, защищённого от переопределения).
- Ключевая масса решений: `intel/decisions.md`, 15 записей 2026-10-15 … 2026-10-18 (стек A, многостраничность, иерархия услуг поверх lines.json, Python CGI→Telegram, Beget Shared, «Ночная медь», 152-ФЗ гейт, ESLint/гейты, C4, permissions, тулинг качества).

## Требования

- 6 требований из единственного PRD: REQ-multipage-site, REQ-premium-positioning, REQ-leads-telegram-form, REQ-services-lines-hierarchy, REQ-growth-extensibility, REQ-pdn-consent-152fz — `intel/requirements.md`. Конкурирующих вариантов приёмки нет.

## Ограничения

- 14 записей в `intel/constraints.md`: api-contract 3 (CSP-form-client, CSP-form-endpoint, CSP-legal-gate), schema 5 (SCH-lines, SCH-services-per-line, SCH-collections, SCH-sitejson, CON-routes помечен как schema/карта), nfr 5 (CON-design-tokens, CON-hero-commitment, CON-homepage-structure, CON-qa-gates, CON-scope-first-release, CON-implementation-global — итого 6), protocol 2 (PRT-deploy, PRT-domains). Точный подсчёт по заголовкам файла.

## Контекст

- 9 тематических блоков в `intel/context.md` (позиционирование/копирайтинг, AI-среда, снапшот 2026-10-16, порядок шагов, QA, сценарии приёмки, C4 runbook, отчёт приёмки 2026-10-18, верифицированный дрейф докс↔код).

## Конфликты

- BLOCKERS: 0
- Competing-variants (WARNING): 2 — lines.json schema (order vs accentColor); React-острова докс ↔ код (см. .planning/INGEST-CONFLICTS.md)
- Auto-resolved (INFO): 6 — включая циклы cross_refs (обработаны как цитатная сетка, оговорка в отчёте), Node-версию (ADR > SPEC), PHP→Python, пометки заглушек маршрутов, свежесть снапшотов, дрейф site.json/vitest/zod.
- Детали: .planning/INGEST-CONFLICTS.md

## Файлы

- .planning/intel/decisions.md … decisions (ADR)
- .planning/intel/requirements.md … requirements (PRD)
- .planning/intel/constraints.md … constraints (SPEC)
- .planning/intel/context.md … context (DOC + факт кода)
- .planning/INGEST-CONFLICTS.md … отчёт конфликтов (3 бакета)
- Этот файл — единственная точка входа.