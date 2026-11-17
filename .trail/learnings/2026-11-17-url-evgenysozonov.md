---
title: "Досье по референсу: числа из слагов URL — не контент; проверять цитаты по скрейпам"
author: EvgenySozonov
date: 2026-11-17
branch: main
cost: { minutes: 3, tokens: 494864 }
id: l-b2c5dcf4
scope: repo
status: active
src: agent
touches:
  - docs/reports/2026-11-02-usability-review-example-index.md
  - docs/reports/2026-11-03-usability-fix-example-check.png
  - example/assets/css/style.css
  - example/assets/js/main.js
  - docs/references/globalwaveintegration-home.png
  - docs/references/globalwaveintegration-reference.md
  - docs/references/smart-home-sites-benchmark.md
---

Сбор досье docs/references/globalwaveintegration-reference.md (2026-11-17): черновик досье назвал «428+ luxury residences» — число существовало только в слаге gwi-400-luxury-residences; в реальном контенте везде «400+».

## Decided
Факты досье писать только из скачанного markdown-контента; числа из слагов/заголовков URL — не факты. Перед сдачей досье — независимая сверка цитат по сырым скрейпам (агент получает черновик + страницы, возвращает файл:строку по каждому пункту).

## Tried and ruled out
Взятие чисел «по карте URL» — отклонено: слаг придуман их SEO-машиной, контентного подтверждения нет.

## Watch out
Programmatic-SEO сайты часто внутренне противоречивы (у GWI: 25/19 лет + «over a decade» на одной странице) — противоречия фиксировать в досье, они сами по себе ценный вывод.

In the code:
- Сырье скрейпов: /tmp/gwi-ref/pages/*.md; проверка — grep по числу/цитате в этих файлах перед записью в docs/references/.
