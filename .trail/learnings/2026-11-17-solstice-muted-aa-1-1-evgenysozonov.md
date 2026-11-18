---
title: "Дизайн сайта сменён на Solstice: акцент и muted затемнены ради AA, эталонная палитра темы не 1-в-1"
author: EvgenySozonov
date: 2026-11-17
branch: redesign/solstice
cost: { minutes: 8, tokens: 13292982 }
id: l-ba9876bb
scope: repo
status: active
src: agent
touches:
  - docs/design.md
  - site/src/components/ContactForm.astro
  - site/src/data/services/lines.json
  - site/src/layouts/BaseLayout.astro
  - site/src/lib/lines.ts
  - site/src/pages/contacts.astro
  - site/src/pages/index.astro
  - site/src/pages/portfolio/index.astro
  - "site/src/pages/services/[line]/index.astro"
  - site/src/pages/services/index.astro
---

## Decided
Тема оформления сайта — Solstice (крем-бумага, чернильный ink, вермильон-сигнал, золотые hairline, Yeseva One/Archivo/Archivo Narrow). Эталонные токены темы адаптированы по решению ревью контраста: акцент oklch(45% 0.19 24) вместо 54% и muted 41% вместо 48% — обе правки ради WCAG AA на крем-бумаге. Канон — docs/design.md (переписан под Solstice); при расходе эталона и кода править докс синхронно и обосновывать в комментарии токенов.

## Tried and ruled out
Держать эталонный вермильон oklch(54%) — отклонено: крем-текст на нём даёт ~3.2:1, ниже 4.5:1 для текста кнопок; проверяли расчётом luminance до правки.

## Watch out
Несколько сессий-ревьюеров (Hallmark hero/finish) нашли: холодные/плоские фото ломают тёплую тему — все фото держать с тёплым тинтом (filter в .photo-frame); цену и гарантию держать в первом экране hero. Это гейты приёмки на будущее изменение дизайна.

In the code:
- site/src/styles/tokens.css — токены и комментарии адаптаций
- docs/design.md — новая лок-система
- .hallmark/ — скриншоты до/после и лог ревью (некоммитное)
