---
title: "GSD Core онбординг SSQ-site: маршрут запущен, карта .planning/codebase/ — следующий шаг"
author: EvgenySozonov
date: 2026-10-27
branch: main
cost: { minutes: 3, tokens: 114950 }
touches:
  - site/src/data/site.json
  - docs/specs/ssq-site-stack-design.md
  - docs/architecture.md
  - docs/product.md
---

## Decided
- Адаптация SSQ-site под GSD Core идёт через `/gsd-onboard` (brownfield-маршрут). Проекция `init onboard` подтвердила: `.planning/` нет, код есть, next_action = map-codebase.
- Выбран порядок: 1) `/gsd-map-codebase` → 2) повторный `/gsd-onboard` → 3) `/gsd-ingest-docs` (2 кандидата: docs/specs/ssq-site-stack-design.md, docs/reports/2026-10-18-отчет-приемки…) → 4) `/gsd-new-project`.
- Предложено (ждёт ответа пользователя) разделение источников: `.planning/codebase/*.md` — снапшот для GSD-агентов (обновляется маппингом), истина остаётся в README + docs/architecture.md + docs/specs.

## Tried and ruled out
- Вкладывать `/gsd-map-codebase` внутрь сессии онбординга — нельзя по контракту воркфлоу: онбординг передаёт выполнение наружу и завершается (handoff, не nesting).

## Watch out
- gsd-tools резолвится глобально из `~/.claude/gsd-core/bin/gsd-tools.cjs` (project-local gsd-core/ и .claude/gsd-core/ в репо отсутствуют); identity-чек `runtime-identity` = ok (@opengsd/gsd-core).
- Карта GSD (STACK/INTEGRATIONS/ARCHITECTURE/STRUCTURE + полный вариант с CONVENTIONS/TESTING/CONCERNS) частично дублирует docs/architecture.md, docs/product.md и README — в проекте правило «дублей не плодим», после онбординга нужно зафиксировать, где истина.
- `commit_docs: true` — projection коммитит .planning-доки автоматически у воркфлоу, которые это умеют; учитывать при «не коммитить без спроса».
