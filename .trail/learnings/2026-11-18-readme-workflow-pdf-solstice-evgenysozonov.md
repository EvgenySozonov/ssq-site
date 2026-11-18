---
title: "Прослеживаемость визуал-решений — блок в README-Workflow, не PDF; Solstice получил запись в логе"
author: EvgenySozonov
date: 2026-11-18
branch: redesign/solstice
cost: { minutes: 3, tokens: 680962 }
id: l-7ba00bfd
scope: repo
status: active
src: agent
touches:
  - docs/memory.md
  - README.md
  - docs/design.md
---

Прослеживаемость внепроцессных решений: связка живёт в README-разделе Workflow, не в PDF и не отдельным файлом

## Decided
Владелец (2026-11-18): показать в README, что решения по визуалу/референсам тоже проходят discuss→plan. Форма — блок «Прослеживаемость решений» прямо в разделе «Workflow (GSD Core)» с таблицей из четырёх строк: тема AYOCIN→Solstice (объединены), приёмы GWI, каркас lines.json, контракт формы/CGI. «PDF» в запросе владельца означало planning-артефакты .planning/, а не PDF-файл. Solstice-тема до этого не имела записи в логе решений — добавлена короткая запись от 2026-11-17 (вечер): тема, AA-адаптация oklch(45%)/41% расчётом luminance, канон — docs/design.md.

## Tried and ruled out
Строка в таблице документации → новый файл-трассировщик — отклонено: заводит ещё один док рядом с memory.md, дубль. Абзац в шапке README — отклонено: без таблицы связки не видно. Отдельная строка «AYOCIN» и «Solstice» — объединены одной строкой темы, иначе таблица дута.

## Watch out
Новая строка в логе решений вставляется над предыдущей датой, не под ней (правило «новые сверху»); Solstice-запись датируется 2026-11-17 и живёт между записями 2026-11-18 и 2026-11-17. Ссылка на фазовый PLAN: 01-CONTEXT.md → 01-01-PLAN.md (не 01-PLAN.md).

## In the code
README.md — блок «Прослеживаемость решений» после списка workflow-команд; docs/memory.md — запись темы Solstice; все 6 link-целей проверены pathlib-обходом
