---
title: "Референс GWI: глубина обхода — ключевые страницы (~10), не полный crawl"
author: EvgenySozonov
date: 2026-11-17
branch: main
cost: { minutes: 1, tokens: 1248 }
id: l-8dead3af
scope: repo
status: active
src: agent
---

Скрейп референса конкурента globalwaveintegration.com для досье docs/references/globalwaveintegration-reference.md (создано в сессии 2026-11-17): выбранная глубина.

## Decided
Глубина сбора — после карты URL (map, ~1 кредит) выбрать ~10 каркасных страниц для batch-scrape в markdown + скриншот главной. Каркас находить фильтрацией карты: отбрасывать geo-шаблоны и сравнительные посты по слагам (los-angeles, vs-, best-, how-to и т.п.), оставлять страницы навигации.

## Tried and ruled out
Полный crawl — отклонено: 478 URL, ~350 из них однотипные geo-посадочные smart-home-{город}; кредиты горят на дублях шаблона. Только главная — отклонено: структура услуг/портфолио остаётся за кадром, досье неполно.

## Watch out
Цена: 12 кредитов (10 страниц + скриншот) при остатке ~1000 в цикле. Страницы с интерактивом на JS (калькуляторы вида /smart-home-budget-calculator) приходят пустыми в markdown (~122 символа) — нужен interact или браузер.

In the code:
- npx firecrawl-cli map https://globalwaveintegration.com > /tmp/map.txt; фильтр grep -vE 'geo-слаги'
- npx firecrawl-cli batch-scrape --wait --format markdown <список URL> (сохраняет в .firecrawl/, ответ — JSON с markdown в stdout)
