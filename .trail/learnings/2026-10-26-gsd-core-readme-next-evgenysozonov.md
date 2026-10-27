---
title: "GSD Core: README next-ветки устарел, установка отложена"
author: EvgenySozonov
date: 2026-10-26
branch: main
cost: { minutes: 7, tokens: 316454 }
touches:
  - site/src/data/site.json
---

## Decided
- Пока не решено, ставить ли @opengsd/gsd-core (GSD Core) в проект; обсуждаем установку глобально vs локально.
## Tried and ruled out
- Ссылка README с ветки next устарела для установки: next = 1.7.0-rc.6, а npm dist-tag latest = 1.19.0 — ставить надо @latest, не по README ветки next.
## Watch out
- В SSQ-site уже 4 слоя оркестрации (superpowers, trail, claude-mem, 5 ssq-скиллов); локальная установка GSD Core в проект даст конфликты и дубли workflow в .claude/. Установщик интерактивный (runtime + global/local) — запускать через "! npx ..." пользователем, не из Bash-сессии.
