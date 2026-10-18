---
name: ssq-typescript-strict
description: "TypeScript strict в SSQ-site: конфиг Astro strict-mode, типы из zod-схем (z.infer), типизация Props островов и компонентов, запреты any/ts-ignore. Использовать при создании/правке любых .ts и .astro файлов, React-островов, zod-схем контент-коллекций, при ошибках типов и вопросах про типизацию данных (lines.json, JSON-данные, frontmatter) — даже если пользователь не сказал «типы» и не упомянул TypeScript."
---

# TypeScript strict — SSQ-site

Источники решений: `docs/architecture.md` («TypeScript (strict)») и
`docs/specs/ssq-site-stack-design.md` (§2, «TypeScript, strict»). Докс там
главнее скилла; при расхождении — править оба и сказать владельцу. Скилл —
правила применения strict-режима; общего TS-документа в проекте нет, при
спорах о поведении языка — `context7` по TypeScript, не догадки.

## Конфиг

- `tsconfig` наследует `astro/tsconfigs/strict` (Astro-шаблон strict-набора).
- Strict не ослаблять: no `strict: false`, no `ts-ignore`/`ts-expect-error`
  без комментария, объясняющего почему.
- `!`-утверждения (non-null) — только когда отсутствие значения доказуемо
  невозможно в том же файле; иначе narrowing.

## Типы данных — из zod-схем

- Одна схема = источник и валидации, и типа: `z.infer`, никаких вторых
  ручных описаний тех же структур.
- Схемы контент-коллекций — в `src/content/config.ts`; JSON-данные
  (`src/data/**/*.json`) валидируются zod-схемами в `src/lib/` (см.
  ssq-astro-conventions); типы потребители берут из схемы.
- Импорт типов данных — через `import type`.

## React-острова и компоненты

- Props всегда типизированы, тип — явно, дефолты объявлены в соответствии
  с типом (не «объект любой формы с дефолтами на удачу»).
- Обработчики событий React — типы из `React.*` (`ChangeEvent<...>` и т.п.),
  без implicit any.
- Границы с браузерными API (localStorage, fetch) — типизация `unknown` →
  сужение, не `any`.

## Проверки

1. `astro check` типы-чистый; включён в гейты выката (решение владельца
   2026-10-18, отражено в qa.md и спеке §9); запуск — `npm run check`
   (контракт скрипта в qa.md; работает с шага 1 каркаса)
2. `npm run lint` без ошибок; ESLint — typescript-eslint recommended, правила
   реакта (hooks/keys) — `@eslint-react` в островах (конфиг — Task 1 плана,
   решение «ESLint в каркасе» 2026-10-18 в docs/memory.md)
2. `astro build` проходит — ошибки типов блокер, «собирается с warnings»
   ошибкой не считается
3. Новые структуры данных — добавлен zod-вывод типа, а не ручной интерфейс