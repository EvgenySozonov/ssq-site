---
title: "vitest в Astro-проекте: ограничить include на src/**, иначе он подбирает playwright-спеки e2e"
author: EvgenySozonov
date: 2026-11-17
branch: main
cost: { minutes: 11, tokens: 4770929 }
id: l-b363f741
scope: repo
status: active
src: agent
touches:
  - site/src/lib/lines.ts
  - site/src/lib/lines.test.ts
  - site/src/data/services/lines.json
  - site/src/data/services/elektromontazh.json
  - site/src/data/services/umniy-dom.json
  - site/vitest.config.ts
  - site/src/layouts/BaseLayout.astro
  - site/src/pages/index.astro
  - site/src/pages/services/index.astro
  - "site/src/pages/services/[line]/index.astro"
---

Первый запуск vitest в site/ после установки: 1 файл упал — vitest по умолчанию подобрал Playwright-спеки site/e2e/form.spec.ts (describe/test — это API playwright, для vitest они неимпортированы) и попытался запустить их как юнит-тесты.

## Decided
В vitest include — только src/**/*.test.ts (site/vitest.config.ts): юнит-слой zod-схем и данных против Playwright-спеки не пересекается. Разделение слоёв тестов: vitest — src/, Playwright — e2e/ (npm run test:e2e), unittest — tests/ (npm run test:server).

## Tried and ruled out
Игнорировать e2e-каталог через exclude по одному файлу — не фиксировано: конфиг с явным include устойчивее к будущим каталогам.

## Watch out
После установки vitest в Astro-проекте без конфига qa-гейт № 3 выглядит красным, хотя его причина — подбор чужих спек, а не падение реальных тестов.

In the code:
- site/vitest.config.ts: test.include = ["src/**/*.test.ts"]
- npm run test (vitest run) | npm run test:e2e (playwright) | npm run test:server (unittest)
