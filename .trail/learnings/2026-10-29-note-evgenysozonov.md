---
title: "Автосжатие контекста: скоуп и текущий стек"
author: EvgenySozonov
date: 2026-10-29
branch: main
cost: { minutes: 3, tokens: 133880 }
touches:
  - ".planning/STATE.md"
  - ".planning/codebase/CONCERNS.md"
  - README.md
  - docs/memory.md
  - docs/qa.md
  - docs/specs/ssq-site-stack-design.md
  - site/public/cgi-bin/contact.py
  - site/src/components/ContactForm.astro
  - site/tests/test_contact.py
  - docs/security-checklist.md
---

Пользователь спрашивал про инструменты автосжатия контекста.

## Decided
- Скоуп исследования — только экосистема Claude Code (плагины/MCP/нативный), не весь рынок агентных фреймворков.
- Текущий стек проекта уже покрывает сжатие: встроенная автокомпакция (/compact, /clear, CLAUDE.md) + claude-mem (наблюдения, work_state, handoff) + trail (.trail/ индекс, learnings) + GSD (.planning/ хэндоффы via gsd-pause-work/resume-work).
- Ресёрч-ответы по правилам CLAUDE.md проверять двумя независимыми агентами (обзор + скептик-верификатор).

## Tried and ruled out
- Не расширять обзор на mem0/Zep/LLMLingua и пайплайны — пользователь выбрал «Экосистема Claude Code».

## Watch out
- Рынок плагинов Claude Code быстро меняется: перед рекомендацией проверять дату последней активности репо/маркетплейса; часть memory-приблуд на MCP раздувает контекст вместо экономии.
