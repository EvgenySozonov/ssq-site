---
title: "Инжест GSD: синхронизация доков + канон хэшей классификаций"
author: EvgenySozonov
date: 2026-10-27
branch: main
cost: { minutes: 26, tokens: 2485088 }
touches:
  - site/src/data/site.json
  - "\".planning/intel/classifications/2026-10-18-\\320\\276\\321\\202\\321\\207\\320\\265\\321\\202-\\320\\277\\321\\200\\320\\270\\320\\265\\320\\274\\320\\272\\320\\270-\\320\\262-\\321\\200\\320\\265\\320\\277\\320\\276-52f7043f.json\""
  - ".planning/intel/classifications/README-408657e8.json"
  - ".planning/intel/classifications/about-28bc2175.json"
  - ".planning/intel/classifications/architecture-551ddf8c.json"
  - ".planning/intel/classifications/design-5c07455c.json"
  - ".planning/intel/classifications/handoff-ae36654d.json"
  - ".planning/intel/classifications/memory-e7ac3d6c.json"
  - ".planning/intel/classifications/plan-c50c9e80.json"
  - ".planning/intel/classifications/product-84186b69.json"
---

## Decided
- Разрешённые владельцем (2026-10-27) варианты залочены в .planning/intel/decisions.md и синхронно внесены в доки (2026-10-28, коммит 7c367aa): lines.json = {slug,title,tagline,order}; React вне первого релиза (v1.0 без React-инфраструктуры, калькулятор/фильтр — v1.1+).
- Канон имени классификаций: {slug}-{первые 8 hex SHA-256 полного POSIX-пути}.json, slug = имя без расширения, кириллица сохраняется. Проверено против контракта в ~/.claude/agents/gsd-doc-classifier.md:220.

## Tried and ruled out
- Доверять «похожим на хэш» сегментам из имён классификатора — нельзя: оба «конформных» (architecture-6c9df1aa, product-c9a1c4b0) — галлюцинация haiku (sha256 полного пути даёт 551ddf8c/84186b69; хэш контента в json-файле (в т.ч.) — нет). Все 14 имён перегенерированы единой конвенцией.
- Считать слёг с расширением → получалось architecture-md-…; расширение вычитается до замены не-ASCII.

## Watch out
- product.md React не упоминает ни разу: утверждение первого отчёта конфликтов («product.md повторяет») было неточным — не правилось.
- Реальный site.json = {name, phone, phoneHref, endpoint}; specs §4.6 приведён к факту кода, email/address/workingHours/telegram — долг фазы v1.0 (ROADMAP).
- Хэши-плейсхолдеры из классификаторов (00000000, sourcehash-unavailable) — маркер деградации агентов без Bash; при будущих инжестах хэши считать orchestrator'ом, не доверять именам.
