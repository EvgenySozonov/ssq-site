---
paths:
  - "site/src/styles/**"
  - "site/tokens.css"
---

# Стили и токены

- Следуй скиллу `ssq-tailwind-tokens` (палитра «Ночная медь»).
- Design-значения (цвета/шрифты/отступы/радиусы) — только через
  `site/src/styles/tokens.css`; в компонентах не хардкодить.
- Нет нужного токена — сначала добавить токен, потом использовать.
- `prefers-reduced-motion: reduce` уважать; контраст muted — WCAG AA.