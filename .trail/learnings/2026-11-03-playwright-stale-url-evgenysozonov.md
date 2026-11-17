---
title: "Верификация правок макетов в Playwright: stale-подресурсы из кэша браузера — проверять только через перезапись URL сабресурсов"
author: EvgenySozonov
date: 2026-11-03
branch: main
cost: { minutes: 6, tokens: 2813215 }
id: l-c51f42c4
scope: repo
status: active
src: agent
touches:
  - docs/reports/2026-11-02-usability-review-example-400px-header.png
  - docs/reports/2026-11-02-usability-review-example-index.md
  - example/assets/css/style.css
  - example/assets/js/main.js
---

## Decided
Как верифицировать правку статических CSS/JS (example/, site/dist) в Playwright MCP: простой goto с busting-параметром на HTML недостаточен — <link>/<script> отдаются из кэша браузера по старым URL, и правка выглядит незаприменённой (результат измерений — прежнее поведение). Рабочий приём: page.route('**/assets/**', route => route.continue({ url: route.request().url() + '?v=' + Date.now() })) до goto — тогда подресурсы фетчатся свежими и измерения отвечают реальности. Так проверено исправление шапки (media max-width 520px) и inline-ошибок формы: overflow 0 на срезе 340–560px, сообщения .field-error, фокус на первое невалидное поле, снятие при вводе.

In the code: example/assets/css/style.css, example/assets/js/main.js — правки по находкам 2–3 отчёта docs/reports/2026-11-02-usability-review-example-index.md (раздел «Статус исправлений»).

## Tried and ruled out
page.goto с '?v=' только на HTML — не работает: сабресурсы остаются из кэша.
CDP Network.setCacheDisabled в newCDPSession — не очистил: <link> снова из memory-cache, стили старые (проверено: cssRules без media 520 при свежем содержимом на сервере, curl подтверждает новое в отдаче).

## Watch out
python http.server отдаёт новое содержимое сразу (Если-Модифай-Синс пере-выдаёт 200), «виноват» кэш браузера, не сервер. Синтаксис правленого JS — node --check до открытой верификации.
