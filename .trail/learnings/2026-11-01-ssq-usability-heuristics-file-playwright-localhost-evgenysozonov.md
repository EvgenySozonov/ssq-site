---
title: "Пробное ревью ssq-usability-heuristics: file:// в Playwright заблокирован — макеты ревьюить через localhost, тест-сервер на эфемерном порту"
author: EvgenySozonov
date: 2026-11-01
branch: main
cost: { minutes: 2, tokens: 908273 }
id: l-75231f9d
scope: repo
status: active
src: agent
touches:
  - docs/reports/2026-11-02-usability-review-example-index.md
  - example/index.html
  - example/assets/js/main.js
---

## Decided
Как проверять статические макеты (example/, прод-страницы site/dist при qa) в Playwright MCP: протокол file:// блокирован сервером браузера. Рабочий путь — поднять example/ временно через python3 -m http.server <порт> и открывать http://localhost:<порт>. Пробное ревью референс-страницы example/index.html прошло по скиллу ssq-usability-heuristics и подтвердило работоспособность: 8 находок, топ — tel: отсутствует в шапке/футере и горизонтальный скролл 428px на 400px (нет media-сворачивания site-head__nav). Полные находки — в отчёте docs/reports/2026-11-02-usability-review-example-index.md.

In the code: example/index.html, example/assets/js/main.js, docs/reports/2026-11-02-usability-review-example-index.md, .claude/skills/ssq-usability-heuristics/SKILL.md.

## Tried and ruled out
Открывать file:///…/example/index.html в Playwright — отклонено средой: доступ к file: заблокирован.

## Watch out
Горизонтальный скролл искать у конкретных элементов, не только у html: у html может быть auto-scroll через прокрутку родителя; рабочий приём — обход document.querySelectorAll('*') с сравнением scrollWidth и clientWidth корня (в ревью overflow виновник — HEADER.site-head, 428>400).
