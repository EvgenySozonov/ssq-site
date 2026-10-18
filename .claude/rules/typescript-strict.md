---
paths:
  - "site/src/**/*.ts"
  - "site/src/**/*.tsx"
---

# TypeScript strict (site/src ts/tsx)

- Следуй скиллу `ssq-typescript-strict`.
- Strict не ослаблять: no `any`, no `@ts-ignore` без комментария-объяснения,
  `!` только с доказуемым отсутствием null.
- Типы данных — `z.infer` из zod-схем; ручных вторых описаний не создавать.
- Props компонентов и островов — всегда типизированы.