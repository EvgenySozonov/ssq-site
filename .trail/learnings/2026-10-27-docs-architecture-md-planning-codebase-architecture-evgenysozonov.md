---
title: docs/architecture.md объединён в .planning/codebase/ARCHITECTURE.md — канон теперь там
author: EvgenySozonov
date: 2026-10-27
branch: main
cost: { minutes: 28, tokens: 3485460 }
touches:
  - ".planning/PROJECT.md"
  - ".planning/ROADMAP.md"
  - ".planning/STATE.md"
  - ".planning/codebase/ARCHITECTURE.md"
  - ".planning/onboarding/SUMMARY.md"
  - CLAUDE.md
  - README.md
  - docs/architecture.md
  - docs/design.md
  - docs/memory.md
---

## Decided
- ВЛАДЕЛЕЦ (2026-10-28): единый док архитектуры = .planning/codebase/ARCHITECTURE.md (карта GSD + перенесённый докс). docs/architecture.md удалён, ~17 ссылок (README, CLAUDE.md, доки, 4 скилла, PROJECT/ROADMAP/STATE/SUMMARY) синхронизированы.
- Правило из лернинга 2026-10-27 «карта = снапшот, истина в docs/» — заменено на этот порядок: объединённый док несёт и решения, и снапшот (пометка merged: в шапке, штамп дрейфа обновлён).

## Tried and ruled out
- Оставлять два файла (снапшот + докс) — владелец целенаправленно ведёт репо к «составу GSD», дубль убран.

## Watch out
- Повторный полный /gsd-map-codebase перезапишет объединённый док снапшотом mapper'ов — решения потеряются. Полный remap в этом репо только с явного утверждения владельца или через --paths; даты/решения — в docs/memory.md, они не потеряются.
- trail check даёт ложные конфликты на любые упоминания «gsd codebase/map» в тексте доков — разрешать объяснением в коммите, не правкой.
