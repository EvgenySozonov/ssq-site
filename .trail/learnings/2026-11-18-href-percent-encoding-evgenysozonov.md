---
title: "Активные ссылки на файлы в доках: строки вне ссылки, скобки в href — percent-encoding"
author: EvgenySozonov
date: 2026-11-18
branch: redesign/solstice
cost: { minutes: 5, tokens: 673437 }
id: l-d87e861c
scope: repo
status: active
src: agent
touches:
  - ".planning/codebase/ARCHITECTURE.md"
  - docs/memory.md
  - site/src/pages/legal/privacy.astro
  - ".planning/phases/01-dannye-i-karkas-uslug/01-PATTERNS.md"
  - README.md
  - docs/ux-patterns.md
---

Активные ссылки на файлы в планировочных доках: file:line остаётся текстом, пути со скобками — percent-encoding

## Decided
Файловые рефы в доке карты — активные markdown-ссылки с путями, относительными от каталога докса (доки/ на файлы site/ — с ../). Номера строк не прячутся в href: в Obsidian и VSCode переход по строке в md-ссылке не работает, поэтому пишутся текстом сразу после ссылки (…/BaseLayout.astro:18-19). Решение владельца 2026-11-18.

## Tried and ruled out
Прятать :строки внутрь href («…astro#L18») — отклонено: GitHub покажет, Obsidian и VSCode не прыгнут; бэктики вокруг ссылки не оставлять — ссылка активной не будет (поймано на «план — `[01-PATTERNS.md]`»).

## Watch out
Пути каталогов с квадратными скобками (services/[line]/) в тексте ссылки экранировать \[line\], в href писать %5Bline%5D — иначе markdown рвёт соседние ячейки таблицы. Глоб-рефы (*.json) и проверочные команды grep/find в код-бэктиках остаются неактивными — осознанно.

## In the code
docs/ux-patterns.md — все 17 href проверены: python unquote + pathlib.exists от docs/; скрипт-проход остался в /tmp/ssq-linkify.py
