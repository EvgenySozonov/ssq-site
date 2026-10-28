# Phase 1: Данные и каркас услуг - Pattern Map

**Mapped:** 2026-10-29
**Files analyzed:** 10 (new: 8, modified: 2)
**Analogs found:** 8 / 10 (страницы услуг — аналоги есть: contacts.astro/index.astro; JSON-файлы услуг — новых аналогов нет, контракт в RESEARCH.md)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `site/src/lib/data.ts` | utility (schema + loader) | transform | нет аналога — первый модуль lib/; контракт задан RESEARCH.md Pattern 1 | none (RESEARCH.md) |
| `site/src/lib/data.test.ts` | test (unit) | batch | `site/e2e/form.spec.ts` (только структурно — это Playwright) | none (RESEARCH.md Pattern 4) |
| `site/src/data/services/lines.json` | config (data) | CRUD | — (первый data-файл каталога; sibling `site.json`) | partial |
| `site/src/data/services/elektromontazh.json` | config (data) | CRUD | — | none (контракт спека §4.2) |
| `site/src/data/services/umniy-dom.json` | config (data) | CRUD | — | none |
| `site/src/data/pricing.json` | config (data) | CRUD | — | none (контракт §4.5) |
| `site/src/pages/services/index.astro` | route/page | request-response (SSG) | `site/src/pages/contacts.astro` | exact |
| `site/src/pages/services/[line]/index.astro` | route/page (dynamic) | request-response (SSG) | `site/src/pages/contacts.astro` + RESEARCH Pattern 3 | exact |
| `site/src/pages/services/[line]/[service]/index.astro` | route/page (dynamic) | request-response (SSG) | `site/src/pages/contacts.astro` + RESEARCH Pattern 3 | exact |
| `site/vitest.config.ts` | config | batch | — (нет config-модулей в src; RESEARCH Code Example 3) | none (RESEARCH.md) |
| `site/src/data/site.json` (MODIFY) | config (data) | CRUD | сам файл + потребители | exact |
| `site/package.json` (MODIFY) | config | — | сам файл | exact |
| `site/src/pages/contacts.astro` (MODIFY) | route/page | request-response | сам файл | exact |

## Pattern Assignments

### `site/src/lib/data.ts` (utility, transform)

**Analog:** нет прямого аналога — RESEARCH.md Code Example 1 задаёт полный скелет. Ближайший код-базовый образец дисциплины модулей — JSDoc-шапка со ссылками на контракты (как в ContactForm.astro:3-7).

**Шапка-документация** (из `site/src/components/ContactForm.astro:3-7`):
```typescript
/**
 * Форма заявки — единственная интерактивная kpi-функция сайта (Astro + vanilla JS,
 * React-остров не обоснован: ...).
 * Контракт: docs/architecture.md «Форма и заявки», docs/specs/ssq-site-stack-design.md §6.1.
 * E2E-испытания контракта: site/e2e/form.spec.ts.
 */
```
→ применить к data.ts: контракты §4.1–§4.6, тест добавляемости §3, DEC-react-deferred.

**Ключевое содержимое:** zod-схемы `lineSchema` / `serviceSchema` / `pricingSchema` / `siteSchema`, `z.infer`-типы, `superRefine` уникальности слагов (zod v4: `ctx.addIssue({ code: "custom", input, message })`), fail-fast `parse` при импорте, `import.meta.glob("../data/services/*.json", { eager: true })` с фильтром ключа `lines.json`, чистые `getLineRoutePlan()` / `getServiceRoutePlan()`, `priceLabel` (D-06/D-07). Полный скелет — RESEARCH.md Patterns 1–4 и Code Example 1–2, копировать дословно.

### `site/src/pages/services/index.astro` (page, request-response)

**Analog:** `site/src/pages/contacts.astro`

**Импорты и layout** (contacts.astro:1-5):
```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import ContactForm from "../components/ContactForm.astro";
import siteData from "../data/site.json";
---
```

**Структура секции и токены «Ночная медь»** (contacts.astro:11-21):
```astro
<section class="mx-auto max-w-5xl px-5 py-12 sm:py-16">
  <header class="mb-10 max-w-2xl">
    <p class="mb-2 font-mono text-xs tracking-[0.2em] text-accent uppercase">01 // контакты</p>
    <h1 class="mb-3 font-display text-3xl text-text sm:text-4xl">…</h1>
    <p class="text-text-muted">…</p>
  </header>
```
→ карточки направлений: тот же section/header-паттерн, `.map()` по `lines` из `lib/data.ts`, карточка — `border-l-3 border-accent bg-surface` + `style="border-radius: var(--radius-s)"` (contacts.astro:27-28).

**Props-паттерн данных в шаблон** (contacts.astro:34-39): `{siteData.phone}`, `href={siteData.phoneHref}` — данные только импортом из JSON/lib, ноль хардкода.

### `site/src/pages/services/[line]/index.astro` и `[line]/[service]/index.astro` (page, dynamic SSG)

**Analog:** contacts.astro (визуальный слой) + RESEARCH.md Pattern 3 (getStaticPaths one-liner). Пример из RESEARCH.md Pattern 3:

```astro
---
import { getLineRoutePlan } from "../../../lib/data";
import type { Line } from "../../../lib/data";

export const getStaticPaths = () => getLineRoutePlan();
const line = Astro.props as Line;
---
<BaseLayout title={`${line.title} — услуги`}>
  <!-- сетка услуг, priceLabel(service.priceFrom) -->
</BaseLayout>
```

Жёсткие требования: `params` — только строки (Pitfall 1); логика в lib, page — one-liner (Pitfall 2); `import type` из-за `verbatimModuleSyntax` (Pitfall 6); цены через `priceLabel()`, никогда не `{service.priceFrom}` в шаблоне (Pitfall 9 / D-07).

### `site/vitest.config.ts` (config)

**Analog:** нет; RESEARCH.md Code Example 3 дословно:
```ts
/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: { environment: "node" },
});
```

### `site/package.json` (MODIFY)

**Analog:** сам файл, строки 8-19 (scripts). Добавить по Pitfall 5 (`vitest run`, не `vitest`):
```json
"test": "vitest run",
"test:watch": "vitest"
```

### `site/src/data/site.json` (MODIFY) и потребители

**Analog:** сам файл (текущее содержимое `{name, phone, phoneHref, endpoint}`). Целевой контракт §4.6 и плейсхолдеры ⏳ — RESEARCH.md Pattern 5 (таблица полей). Критичный модифицируемый участок — хардкод в `site/src/pages/contacts.astro:45,49`:
```astro
<p class="text-text">Пн–Сб, 9:00–20:00</p>    <!-- contacts.astro:45 → siteData.workingHours -->
<p class="text-text">Москва и область</p>      <!-- contacts.astro:49 → siteData.address -->
```
ContactForm.astro и BaseLayout.astro хардкода контактов не имеют — не трогать (A5).

## Shared Patterns

### JSON → импорт → данные в разметке (ноль клиентского JS)
**Source:** `site/src/components/ContactForm.astro:8,16-18` + contacts.astro:4,38-39
**Apply to:** все три page-файла услуг
```astro
import siteData from "../data/site.json";
data-endpoint={siteData.endpoint}     <!-- ContactForm.astro:16 -->
{siteData.phone}                       <!-- contacts.astro:39 -->
```

### Токены «Ночной меди» в разметке
**Source:** contacts.astro:31-36 (`font-mono text-xs tracking-[0.15em] text-accent uppercase`), :36 (`hover:text-text motion-safe:transition-colors`), :27-28 (`border-l-3 border-accent bg-surface` + `--radius-s`)
**Apply to:** карточки направлений и услуг; классы Tailwind из токенов, radius только через CSS-переменную.

### Гейты перед завершением правки
**Source:** `.claude/rules/astro-code.md`
**Apply to:** каждый wave-коммит: `npm run lint && npm run check && astro build` в `site/`; новый `npm test` (vitest run) добавляется этой фазой.

### Данные — только через data-файлы; контакты — только site.json
**Source:** `.claude/rules/astro-code.md`; подтверждено grep-проверкой RESEARCH.md Pitfall 7
**Apply to:** `site.json`, все страницы; приёмочный grep `grep -r "Пн–Сб" site/src` должен быть пуст.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `site/src/lib/data.ts` | utility | transform | Первый lib-модуль проекта; скелет задан RESEARCH.md Code Example 1 |
| `site/src/lib/data.test.ts` | test | batch | Первый vitest-файл (e2e/form.spec.ts — другой фреймворк); скелет RESEARCH.md Code Example 4 |
| `site/src/data/services/*.json`, `pricing.json` | config | CRUD | Первые JSON-файлы данных; контракты — спека §4.1/§4.2/§4.5 |
| `site/vitest.config.ts` | config | batch | RESEARCH.md Code Example 3 |

## Metadata

**Analog search scope:** `site/src/pages/`, `site/src/components/`, `site/src/layouts/`, `site/src/data/`, `site/package.json`
**Files scanned:** 7 (ContactForm.astro, BaseLayout.astro, contacts.astro, index.astro, site.json, package.json, rules/astro-code.md)
**Pattern extraction date:** 2026-10-29