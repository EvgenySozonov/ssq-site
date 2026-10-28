# Phase 1: Данные и каркас услуг - Research

**Researched:** 2026-10-29
**Domain:** Astro 7.4 SSG, JSON-данные + zod-валидация (build-time), динамические маршруты `getStaticPaths`, vitest-гейт
**Confidence:** HIGH

## Summary

Фаза почти целиком определена локальными контрактами проекта (спека §4, CONTEXT.md D-01…D-07) — внешних технологий здесь мало, и все они уже стоят в `site/`: Astro 7.4.0 [VERIFIED: npm registry — `astro@7.4.0` в `site/package.json`], zod 4.6.7 (уже в lockfile транзитивно через astro и @eslint-react) [VERIFIED: npm registry + `npm ls zod`], vitest — единственная новая dev-зависимость. Ключевой технический вопрос фазы — как при добавлении строки в `lines.json` каркас собирает раздел **без правки любого кодового файла** (spec §3, test-case.md шаг 1). Ответ: сервисы направления нельзя импортировать по фиксированным именам (`import elektromontazh from ...`) — нужны и статический импорт `lines.json`, и `import.meta.glob()` поверх каталога `src/data/services/` [CITED: docs.astro.build/en/guides/imports — glob-import], а чистая логика маршрутов должна жить в `site/src/lib/data.ts`, чтобы vitest гонял её без сборки Astro-страниц.

Второй вопрос — вит-гейт `npm test`. Официальный способ Vitest в Astro — `getViteConfig()` из `astro/config` в `vitest.config.ts` [CITED: docs.astro.build/en/guides/testing — Vitest]. Тесты этой фазы — чистые TS-модули (zod-схемы, инварианты, план маршрутов, `import.meta.glob` — Vitest запускается на Vite, так что glob работает и в тестах). Требование `priceFrom: 0 → «по смете»` реализуется zod-инвариантом (0 или отсутствие поля) и одним хелпером `formatPrice`.

Третий блок — дрейф `site.json`: сейчас в файле только `{name, phone, phoneHref, endpoint}`, а `contacts.astro` хардкодит часы работы и регион. Контракт спеки §4.6 требует добавить `email`, `address`, `workingHours`, `telegram` и перевести потребителей (contacts.astro, ContactForm.astro, футер) только на `site.json`. Плейсхолдеры с пометкой ⏳ — согласованное решение (CONTEXT.md, Claude's Discretion).

**Primary recommendation:** zod-схемы и чистые функции маршрутов/цен в `site/src/lib/data.ts` (валидация fail-fast при импорте данных) + `import.meta.glob` для сервисов + три page-файла (`/services/`, `[line]/`, `[line]/[service]/`) с `getStaticPaths` поверх чистого плана маршрутов + vitest (`getViteConfig`) в `npm test` + расширение `site.json` до §4.6.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Контракты данных (lines/services/pricing/site) | Build-time слой (`src/lib/data.ts` + `src/data/`) | — | SSG-статика: валидация выполняется при сборке/dev, в проде только HTML |
| Роутинг `/services/[line]/[service]/` | Build-time (`getStaticPaths` в page-файлах) | Build-time (`lib/data.ts` — чистый план маршрутов) | Astro SSG: маршруты пререндерятся в HTML; логика — в импортируемом модуле для тестируемости |
| Форматирование цен («от … ₽» / «по смете») | Build-time (`lib/data.ts` — хелпер) | — | Требование D-06: форматирование в одном месте; ноль JS на клиенте |
| Invariants + тест добавляемости | Vitest (Node) | — | Чистые функции, без сборки Astro |
| Контактные данные потребителям | Build-time (`site.json` → импорт в .astro) | — | Уже паттерн `ContactForm.astro`: JSON → props/data-атрибуты |
| React-инфраструктура | — | — | Запрещено в фазе (DEC-react-deferred); ноль JS вне формы |

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Перечень услуг**
- **D-01:** Услуги первого наполнения — заглушки-шаблоны, по 4–5 услуг на каждое из двух направлений (elektromontazh, umniy-dom), с реальными названиями типовых работ жанра «Замена проводки», «Установка щита», «Умное реле освещения». Контент-фаза заменит тексты без правки кода (тест добавляемости — инвариант фазы).
- **D-02:** Слаги услуг — транслит кириллических названий в kebab-case (`zamena-provodki`, `ustanovka-shchita`); совпадает с инвариантом zod slug kebab-case.
- **D-03:** Summary услуги — одно предложение, до ~120 знаков; страница услуги получит развёрнутый текст в контент-фазе.

**Ценовая политика**
- **D-04:** Правило цены: типовые позиционные работы — «от … ₽» (замена розеток, монтаж щита, установка смарт-реле); индивидуальные проекты (полная разводка, дом под ключ) — «по смете».
- **D-05:** Цифры `priceFrom` — реалистичные ориентиры рынка электромонтажа 2026, помеченные в JSON как ориентир до утверждения прайса владельцем; правятся одной правкой JSON.
- **D-06:** Цена хранится целым числом (рубли) в JSON; форматирование («от 8 000 ₽», разделитель тысяч, знак ₽) — в одном месте рендера.
- **D-07:** «По смете» кодируется отсутствием `priceFrom` (или `priceFrom: 0`) — одно поле, один инвариант zod (совпадает со success criteria фазы).

### Claude's Discretion
Факты `site.json` (email, address, workingHours, telegram, реальный телефон) не обсуждались: берутся согласованные плейсхолдеры с пометкой ⏳ (долг приёмки №1 и №7 из отчёта 2026-10-18), правка одного JSON без кода.
- Порядок направлений/услуг (поле `order`), поведение пустых состояний (пустые массивы услуг, блок без цен) — на усмотрение Claude по контрактам spec и design.md.

### Deferred Ideas (OUT OF SCOPE)
- Реальный каталог услуг компании (замена заглушек) — контент-фаза, код не правится
- Реальные цифры прайса от владельца — уточнение priceFrom, правка одного JSON
- Факты site.json: email/address/workingHours/telegram/телефон — правка одного JSON (долг приёмки №1/№7)
- Порядок сортировки направлений/услуг и пустые состояния — Claude's Discretion по контрактам spec
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-services-lines-hierarchy | Услуги сгруппированы по направлениям; каждое направление — раздел с посадочной; Направления и услуги — JSON; приёмка: каркас строит направления циклом по `lines.json` | Patterns 2–3: page-файлы `[line]/` и `[line]/[service]/` + `getStaticPaths` поверх чистого плана маршрутов из `lib/data.ts`; контракта JSON §4.1/§4.2 (спека) |
| REQ-growth-extensibility | Новое направление = новая запись в `lines.json`, каркас строит раздел автоматически | Pattern 1: `import.meta.glob` для каталога `services/` (ноль правок кода при новом файле); vitest-инвариант «третье направление в фикстуре даёт маршрут» + ручной сценарий test-case.md шаг 1 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 7.4.0 (установлен) | SSG, маршруты, page-компоненты | Уже в `site/package.json:23` `"astro": "^7.4.0"`; прод — статика + CGI |
| zod | **4.6.7** (пин версии) | Схемы JSON-контрактов, z.infer-типы | Уже в lockfile транзитивно (astro@7.4.0 и @eslint-react), совместимость доказана; добавить как прямую dependency |
| vitest | 5.0.5 latest | Юнит-гейт `npm test` (zod-инварианты, план маршрутов, формат цен) | Официальный тестовый фреймворк Astro [CITED: docs.astro.build/en/guides/testing] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vite `import.meta.glob()` | встроен в Astro (Vite) | Импорт всех `<line>.json` из каталога | Для теста добавляемости — единственный механизм, при котором новый JSON-файл подхватывается без правки кода |
| `Intl`/`toLocaleString('ru-RU')` | встроен в Node 22+/браузеры | Разделитель тысяч в «от 8 000 ₽» | D-06; проверено: `(8000).toLocaleString('ru-RU')` → `"8 000"` [VERIFIED: локальный прогон Node v26.7.0] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Глоб `import.meta.glob` для `<line>.json` | Astro Content Collections с `file()` loader (`astro/loaders`) | `file()` требует уникальное поле `id` в каждой записи [CITED: docs.astro.build/en/guides/content-collections — file loader] и `astro:content` API; **отклонено**: спека и CONTEXT.md фиксируют «JSON + zod в `src/lib/data.ts`», коллекции (`config.ts`) — фаза портфолио/блога. Также glob-решение проще к полному прогону в vitest без контекст-bridge |
| Чистые функции маршрутов в `lib/data.ts` | `getStaticPaths` прямо в .astro-файлах | `getStaticPaths` живёт в изолированной области видимости и не тестируется vitest напрямую [CITED: docs.astro.build/en/reference/routing-reference]; вынос плана маршрутов в модуль даёт юнит-тест добавляемости |

**Installation:**
```bash
cd site
npm install zod@4.6.7        # прямая dependency (сейчас только транзитивная)
npm install -D vitest        # dev-dependency для гейта npm test
```

**Version verification:** выполнено в этой сессии:
- `npm view zod version` → `4.6.7` (modified 2026-10-12) — совпадает с версией в `site/node_modules` (транзитивная); пин `4.6.7`, а не latest-range, чтобы lockfile не резолвил вторую копию zod. [VERIFIED: npm registry + `npm ls zod`]
- `npm view vitest version` → `5.0.5` (modified 2026-10-19). [VERIFIED: npm registry]

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| zod | npm | первый релиз ~2018, свежий релиз 2026-10-12 | ~371M/week | github.com/colinhacks/zod | OK* (seam: **SUS** — «too-new», метка по дате последнего релиза) | Approved — пин `4.6.7`; версия уже в `package-lock.json` (astro@7.4.0), postinstall отсутствует |
| vitest | npm | проект с 2020, свежий релиз 2026-10-15 | ~141M/week | github.com/vitest-dev/vitest | OK* (seam: **SUS** — «too-new», метка по дате последнего релиза) | Flagged — planner вставляет `checkpoint:human-verify` перед установкой |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** zod, vitest (обе — маркеры «too-new» от даты последнего релиза; downloads/репутация/репозитории максимальные, признаков slopsquatting нет). По протоколу planner обязан добавить `checkpoint:human-verify` перед каждой установкой. Дополнительное обоснование для zod: скоуп-версия `4.6.7` уже разрешена и работает в node_modules как зависимость astro — инспекция не нужна.

`npm view <pkg> scripts.postinstall` → null для обоих пакетов (проверено через seam `package-legitimacy check`, сигнал `postinstall: null`). [VERIFIED: npm registry + gsd seam]

## Architecture Patterns

### System Architecture Diagram

```text
site/src/data/
  services/lines.json          ──┐  static import (единственный источник маршрутов)
  services/<line>.json         ──┤  import.meta.glob("{eager}")
  pricing.json                 ──┤  static import
  site.json                    ──┘  static import (контакты)
        │
        ▼
site/src/lib/data.ts           ── zod-схемы → z.infer-типы
        (валидация при импорте,    ├── invariants: slug kebab-case, уникальность,
        fail-fast при сборке)     │   priceFrom 0/absent = «по смете», order
                                  │   ── чистые функции: route plan, priceLabel
                                  ▼
site/src/pages/
  index.astro       (вне фазы — заменяется разделами из JSON в фазе 2)
  services/index.astro             ── карточки направлений ← lines.map
  services/[line]/index.astro      ── getStaticPaths: {line} + props
  services/[line]/[service]/index.astro ── getStaticPaths: flatMap(line × услуги)
        │
        ▼  astro build →
dist/  чистая статика (прод: Beget static + CGI; Node не нужен)
```

Основной сценарий: владелец кладёт строку в `lines.json` (+ опционально `<slug>.json` с услугами) → при `npm run build` zod-валидация пропускает контракт → `getStaticPaths` рендерит `/services/<slug>/` и страницы услуг → `npm test` проверяет инварианты и «третье направление в фикстуре даёт маршрут».

### Recommended Project Structure

```text
site/src/
├── lib/
│   ├── data.ts            # zod-схемы, z.infer-типы, invariants, loaders (glob), route-план, formatPrice
│   └── data.test.ts       # vitest: инварианты, тест добавляемости, priceLabel   ← NEW (или tests/data.test.ts)
├── data/
│   ├── site.json          # расширен до §4.6: + email, address, workingHours, telegram
│   ├── services/
│   │   ├── lines.json         # [{slug,title,tagline,order}] × 2
│   │   ├── elektromontazh.json  # [{slug,title,summary,priceFrom?,order}] × 4–5
│   │   └── umniy-dom.json        # аналогично
│   └── pricing.json      # контракт §4.5 (схема в этой фазе; страница /pricing/ — фаза 3)
├── pages/
│   └── services/
│       ├── index.astro        # обзор направлений  ← NEW
│       └── [line]/
│           ├── index.astro    # посадочная направления ← NEW
│           └── [service]/
│               └── index.astro  # страница услуги ← NEW
└── (vitest.config.ts — корень site/)
```

### Pattern 1: Схема-слой `lib/data.ts` — валидация при импорте, типы из zod

**What:** каждый JSON-контракт получает одну zod-схему; потребители (`pages`, `components`) импортируют типы через `z.infer` (`import type` — требование `verbatimModuleSyntax` в astro tsconfig base [VERIFIED: site/node_modules/astro/tsconfigs/base.json `"resolveJsonModule": true`, `"verbatimModuleSyntax": true`]). Скелет:

```ts
// site/src/lib/data.ts
import { z } from "zod";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/; // D-02: slug kebab-case [ASSUMED: конвенция]

export const lineSchema = z.object({
  slug: z.string().regex(KEBAB, "slug: kebab-case, латиница"),
  title: z.string().min(1),
  tagline: z.string().min(1),
  order: z.number().int(),
});
export type Line = z.infer<typeof lineSchema>;

export const serviceSchema = z.object({
  slug: z.string().regex(KEBAB, "slug: kebab-case, латиница"),
  title: z.string().min(1),
  summary: z.string().max(200),      // D-03: ~120 знаков — жёсткий потолок мягче
  priceFrom: z.number().int().nonnegative().optional(), // D-07: absence = «по смете»
  order: z.number().int(),
});
export type Service = z.infer<typeof serviceSchema>;

// Инвариант уникальности слагов — на уровне массива (spec §4.1)
export const linesArraySchema = z.array(lineSchema).superRefine((arr, ctx) => {
  const slugs = arr.map((l) => l.slug);
  if (new Set(slugs).size !== slugs.length) {
    ctx.addIssue({ code: "custom", input: slugs, message: "lines.json: slug дубль" });
  }
});
export const servicesArraySchema = (...)
```

**Ключевые api-zod-v4:** `.superRefine((val, ctx) => ctx.addIssue({...}))`; в zod v4 `ctx.addIssue` **требует поле `input`**, а `ctx.path` внутри `superRefine` недоступен [CITED: zod.dev/v4 — superRefine drops ctx.path; llms-full.txt UniqueStringArray]. `.check()` — API только ZodMini; в обычном zod остаются dedicated-методы (`.refine`, `.superRefine`) [CITED: zod.dev llms-full.txt].

**Fail-fast:** строки `lib/loaders` валидируют при импорте (`parse` бросает `ZodError` → сборка/dev падает с читаемым русским сообщением, а не тихий undefined в шаблоне). Альтернатива `safeParse` с выбросом понятной ошибки — приемлема; главное — не отдавать невалидный JSON в шаблоны.

### Pattern 2: Импорт `lines.json` статикой, `<line>.json` — через `import.meta.glob`

**What:** `lines.json` импортируется статически (он один); каждый `<line>.json` подбирается glob-ом по каталогу — тогда новый файл услуг не требует правки кода:

```ts
// site/src/lib/data.ts
import linesJson from "../data/services/lines.json";
import pricingJson from "../data/pricing.json";

const modulesByKey = import.meta.glob<{ default: unknown }>(
  "../data/services/*.json",
  { eager: true },
);
// у Astro/Vite glob возвращает Record<key, { default: unknown }> при eager
// [CITED: docs.astro.build/en/guides/imports — import.meta.glob + generic]
```

**Critical:** путь glob — относительный от файла модуля; ключи — пути файлов → slug извлекается из ключа (`/<slug>.json`), а не хардкодом. Обратная совместимость с vitest: Vitest работает поверх Vite, `import.meta.glob` резолвится и в тестах (тот же transform) — можно тестировать через реальный каталог (см. «Тест добавляемости»).

**Ограничение glob по имени `lines`:** glob `*.json` подхватит и `lines.json` — отфильтровать ключ `lines` явно.

### Pattern 3: Роутинг — `getStaticPaths` поверх чистого плана маршрутов

**What:** три page-файла; логика сбора пар (params, props) — в `lib/data.ts` как чистые функции, page-файлы только обёртки:

```astro
---
// site/src/pages/services/[line]/index.astro
import { getLineRoutePlan } from "../../../lib/data";
export const getStaticPaths = () =>
  getLineRoutePlan().map(({ params, props }) => ({ params, props }));
const line = Astro.props;
---
```

```astro
---
// site/src/pages/services/[line]/[service]/index.astro
import { getServiceRoutePlan } from "../../../../lib/data";
export const getStaticPaths = () => getServiceRoutePlan();
const { line, service } = Astro.props;
---
```

**Контракты `getStaticPaths`:** возвращает массив объектов с `params` (все значения — строки, числа не примутся: `get-static-paths-invalid-route-param` [CITED: docs.astro.build — routing-reference / invalid-route-param]); функция выполняется в isolated scope — можно ссылаться только на импорты [CITED: docs.astro.build — routing-reference «caution»]. Поэтому вся логика — в модуле, а page-файл — one-liner. Ручные page-файлы (не «цикл» в буквальном смысле) — это и есть каркас Astro: два файла-шаблона покрывают любое направление без правки кода.

### Pattern 4: Форматирование цен — один хелпер `priceLabel`

**What:** D-06 в одно место: цена хранится `number` (рубли), рендер — `formatPrice` в `lib/data.ts`; инвариант D-07:

```ts
export const NO_PRICE = "по смете" as const;
export function priceLabel(priceFrom: number | undefined): string {
  if (priceFrom === undefined || priceFrom === 0) return NO_PRICE;   // D-07
  return `от ${(priceFrom).toLocaleString("ru-RU")} ₽`;  // «от 8 000 ₽»
}
```

Проверено в Node v26.7.0: `(8000).toLocaleString("ru-RU")` → `"8 000"`; Intl-currency `RUB` → `8 000 ₽` [VERIFIED: локальный прогон Node]. Вариант «просто `toLocaleString`» без Intl-currency — предпочтителен: собственный шаблон «от … ₽» соответствует спеке, Intl-currency добавляет NBSP-отступы к «₽».

### Pattern 5: `site.json` → контракт §4.6

**What:** цель — `{name, phone, phoneHref, endpoint, email, address, workingHours, telegram}`; контакты/эндпоинт нигде не хардкодятся. Плейсхолдеры ⏳ (согласовано в CONTEXT.md):

| Поле | Плейсхолдер-значение (⏳) | Потребители |
|------|--------------------------|-------------|
| name, phone, phoneHref, endpoint | уже верные значения | ContactForm.astro, contacts.astro |
| email | ⏳ placeholder (`mail@smart-square.ru`) | contacts.astro, футер (фаза 2+), микроразметка LocalBusiness (фаза 3) |
| address | ⏳ (`Москва и область`) | contacts.astro (сейчас хардкод на строках 47–49), футер |
| workingHours | ⏳ (`Пн–Сб, 9:00–20:00`) | contacts.astro (хардкод на 45), микроразметка |
| telegram | ⏳ (ник/ссылка `t.me/…`) | футер, контакты |

**Что сейчас хардкодится** (мисграфт, закрывается фазой):
- `site/src/pages/contacts.astro:45` `<p class="text-text">Пн–Сб, 9:00–20:00</p>`
- `site/src/pages/contacts.astro:49` `<p class="text-text">Москва и область</p>`
У `ContactForm.astro` (endpoint/phone/phoneHref) и `BaseLayout.astro` хардкода контактных фактов нет — форма уже читает `site.json` (data-атрибуты `data-endpoint={siteData.endpoint}` и далее).

Не забыть: zod-схема `siteSchema` для `site.json` — тоже контракт в `lib/data.ts` (CONTEXT.md success criterion #3 прямо называет только lines/услуги/pricing, но правило «активные данные только через data-файлы» и шаблон invariants подталкивают включить site.json в ту же схему; минимальный набор — если planner считает это раздуванием, оставьте site.json без схемы, но тогда fail-fast не гарантирован).

### Anti-Patterns to Avoid
- **Статические импорты по именам направлений** (`import elektromontazh from "../data/services/elektromontazh.json"`): ломают тест добавляемости — новый файл не подхватывается. Только glob-паттерн.
- **Логика маршрутов внутри page-файлов** (`getStaticPaths` со сбором пар внутри frontmatter страницы): не тестируется vitest, дублируется между `[line]/` и `[line]/[service]/`. Выносите в чистые функции модуля.
- **Хардкод контактов в компонентах**: нарушение архитектурного правила проекта (`ARCHITECTURE.md` Anti-Patterns, `ssq-astro-conventions`): телефон/endpoint/часы — только через `site.json`.
- **React-остров / `src/components/react/`**: вне v1.0 (DEC-react-deferred), каталог не создаётся; ноль JS вне ContactForm.
- **`priceFrom` в шаблоне напрямую** (`<p>{service.priceFrom} ₽</p>`): выведет «0 ₽» вместо «по смете» и без разделителя тысяч — нарушение D-04/D-06/D-07 и success criterion №3. Только `priceLabel()`.
- **zod-схемы в `content/config.ts`**: этот файл — только коллекции MDX (portfolio/blog, фазы позже). JSON-контракты — в `src/lib/data.ts` (CONVENTIONS.md и `ssq-typescript-strict`).
- **Схема без обработки `order`-дублей**: спека задаёт `order` как обязательное поле сортировки; дубли `order` внутри одного массива — неинвариант, но сортировку надо делать стабильной (sort по `order`, потом по `title` — детерминированно).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Разбор каталога JSON-файлов | Свой `fs.readdirSync` при сборке | `import.meta.glob` (Vite) | fs-скрипты не участвуют в Astro-transform и не подхватятся vitest/dev/build единообразно; glob — нативный механизм Vite, который Astro документирует [CITED: docs.astro.build/en/guides/imports] |
| Форматирование чисел с разделителями | Свой код с пробелами/запятыми | `toLocaleString("ru-RU")` | Локаль браузера и Node уже поддерживают кириллические разделители; собственный код будет ломаться на больших числах |
| Валидация структуры JSON | Свой код if/typeof | zod + z.infer | Проект уже определил это стандартом (CONVENTIONS.md «тип — из zod-схемы») |
| Уникальность слагов | Ручной пробег с флагами | `superRefine` с `Set` | Ошибка всплывает как нормальный zod-issue с читаемым сообщением, а не console.warn |
| Тестовый фреймворк | Свой script на node -e | vitest | Официальный путь Astro [CITED: docs.astro.build/en/guides/testing]; даёт vitest.config.ts, watch-режим, coverage по желанию |

**Key insight:** весь каркас фазы строится на одном принципе Astro SSG: **build-time** код может быть любым (Node, импорт JSON, glob), но он не должен «протекать» в page-файлы — логика собирается в чистом модуле, страницы его только дергают. Это одновременно обеспечивает и тест добавляемости, и vitest без запуска сборки.

## Runtime State Inventory

(фаза — контракт-расширение `site.json` и добавление новых файлов; полноценной rename/migration нет, но категория «Stored data» проверена и заполнена)

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — сайт статический, хранилищ (БД/Chroma/etc.) нет; `dist/` — артефакт сборки, регенерируется | Перезапуск `npm run build` после правки JSON |
| Live service config | None — Beget не участвует в этой фазе (выкат — Phase 4); Telegram-токены не трогаются | — |
| OS-registered state | None — нет pm2/launchd/scheduled tasks для этого проекта | — |
| Secrets/env vars | None затрагивается — `.env`/Telegram-секреты вне скоупа фазы; контактные данные в `site.json` — плейсхолдеры, не секреты | — |
| Build artifacts / installed packages | `site/dist/` — устареет после правок JSON/схем; `__pycache__` из py-тестов — чистится в Phase 4, не здесь | `npm run build` перегенерирует dist; установка vitest/zod как зависимостей обновит package-lock |

**Nothing found in category:** подтверждено чтением карты ARCHITECTURE.md (статический сайт, без Live service config и OS state).

## Common Pitfalls

### Pitfall 1: `getStaticPaths` params не-строка
**What goes wrong:** build падает с ошибкой `get-static-paths-invalid-route-param` или молча теряется роут.
**Why it happens:** params кодируются в URL — поддерживаются только строки.
**How to avoid:** в route-плане (`lib/data.ts`) кастовать `params: { line: l.slug }`, где слаг уже гарантированно строка через zod (`z.string()`).
**Warning signs:** warning при build о ключах params.

### Pitfall 2: `getStaticPaths` в изолированной области видимости
**What goes wrong:** попытка обратиться к переменной вне импорта в теле `getStaticPaths` — не работает.
**Why it happens:** функция выполняется до загрузки страницы в отдельном scope [CITED: docs.astro.build — routing-reference].
**How to avoid:** логика в `lib/data.ts`, page-file — только `import` + `export const getStaticPaths = () => plan.map(...)`.

### Pitfall 3: Тихий подхват `lines.json` glob-ом
**What goes wrong:** glob `../data/services/*.json` включает и `lines.json`, и файлы-услуги → `lines.json` попадёт в список услуг направления.
**Why it happens:** glob не знает о «служебных» файлах.
**How to avoid:** фильтр по ключу (не `endswith("/lines.json")`). Тест на это — прямой юнит-тест `getServices("...")`, где ожидается только содержимое услуг.
**Warning signs:** `/services/elektromontazh/` показывает карточку «Электромонтаж — направление» вместо услуг, или vitest ловит slug-коллизию.

### Pitfall 4: zod v4 `addIssue` без `input` / `ctx.path` в superRefine
**What goes wrong:** ошибка компиляции/рантайма у refine-хелперов, «не работает кастомное сообщение».
**Why it happens:** в zod 4 changed API: `ctx.path` недоступен, `ctx.addIssue` требует поля `input` и `code` [CITED: zod.dev/v4/changelog + llms-full.txt].
**How to avoid:** писать `ctx.addIssue({ code: "custom", input: value, message: "..." })`; уникальность слагов — `Set`-сравнение внутри `superRefine` по массиву.
**Warning signs:** `zod` typescript-ошибки про отсутствующие поля issue.

### Pitfall 5: vitest в watch-режиме и «зависший» `npm test`
**What goes wrong:** `vitest` без флагов заходит в интерактивный watch-режим и не завершается в непрерывной системе/гейтах.
**Why it happens:** дефолт `vitest` = watch; `vitest run` = single pass.
**How to avoid:** `"test": "vitest run"` в `site/package.json` (плюс опциональное `test:watch`). Проверять на CI-подобном запуске `npm test` — он обязан завершаться.
**Warning signs:** `npm test` стоит минуты.

### Pitfall 6: `verbatimModuleSyntax` и типы из JSON
**What goes wrong:** ESLint/typecheck-ошибки на импорте типов данных.
**Why it happens:** astro tsconfig base включает `verbatimModuleSyntax` [VERIFIED: node_modules/astro/tsconfigs/base.json] — типы обязаны импортироваться через `import type`.
**How to avoid:** `import type { Line } from "../lib/data"`; тип — `z.infer<...>` из схемы.
**Warning signs:** error «'Line' is a type and must be imported using a type-only import».

### Pitfall 7: дрейф site.json при расширении — забытые потребители
**What goes wrong:** поле `workingHours` добавлено в JSON, но `contacts.astro` всё ещё хардкодит «Пн–Сб, 9:00–20:00»; проверка success criterion №4 провалена (`контакты нигде не хардкодятся`).
**Why it happens:** расширение контракта затрагивает и JSON, и существующие компоненты; только JSON-правка выглядит «достаточной».
**How to avoid:** явный task «потребители site.json»: `contacts.astro` (телефон — уже из data, часы/регион — хардкод), `BaseLayout.astro` (нет контактов — ок), `ContactForm.astro` (уже из data — ок).
**Warning signs:** `grep -r "Пн–Сб" site/src` находит остатки.

### Pitfall 8: vitest-конфиг не видит `import.meta.glob`
**What goes wrong:** юнит-тест падает на `SyntaxError`/undefined для glob в тестах, если конфиг витест не тот же vite-pipeline.
**Why it happens:** vitest работает на Vite, но конфиг по умолчанию может не включать нужные преобразования для специфичных фич Astro.
**How to avoid:** использовать официальный `getViteConfig` из `astro/config` в `vitest.config.ts` [CITED: docs.astro.build/en/guides/testing] — он переносит astro-config в тестовые env. Альтернатива — в тестах вызывать только чистые функции (без glob), а glob-слой оставить на build-проверку (`astro build`).
**Warning signs:** failing test «import.meta.glob is not a function».

### Pitfall 9: «0 ₽» на странице услуги вместо «по смете»
**What goes wrong:** на посадочной отображается «от 0 ₽» или «0 ₽» для проектов без цены — нарушение D-04/D-07 и честного копирайтинга (spec §4.2).
**Why it happens:** рендер не различает 0 и отсутствующее значение; тест добавляемости не покрывает priceLabel.
**How to avoid:** единый хелпер `priceLabel` + vitest-кейсы: `undefined → «по смете»`, `0 → «по смете»`, `8000 → «от 8 000 ₽»` (см. Code Examples).
**Warning signs:** визуальный прогон `/services/elektromontazh/` показывает 0 ₽.

## Code Examples

### 1. Полный скелет `site/src/lib/data.ts` (контрактный слой)

```ts
/**
 * Слой данных: zod-схемы + инварианты JSON-контрактов.
 * Контракты: docs/specs/ssq-site-stack-design.md §4.1–§4.5 (lines.json, услуги, pricing.json);
 * тест добавляемости — §3 (test-case.md шаг 1).
 * Решение: React-острова вне v1.0 (DEC-react-deferred), ноль JS на клиенте.
 */
import { z } from "zod";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const lineSchema = z.object({
  slug: z.string().regex(KEBAB, "slug: kebab-case латиница (D-02)"),
  title: z.string().min(1),
  tagline: z.string().min(1),
  order: z.number().int(),
});
export type Line = z.infer<typeof lineSchema>;

export const serviceSchema = z.object({
  slug: z.string().regex(KEBAB),
  title: z.string().min(1),
  summary: z.string().max(200), // D-03: ~120 знаков, потолок мягче — см. CONTEXT.md
  priceFrom: z.number().int().nonnegative().optional(),
  order: z.number().int(),
});
export type Service = z.infer<typeof serviceSchema>;

const uniqueSlugs = z.array(z.string()).refine(
  (arr) => new Set(arr).size === arr.length,
  "slug должен быть уникальным",
);

export const linesSchema = z
  .array(lineSchema)
  .superRefine((arr, ctx) => {
    const slugs = arr.map((l) => l.slug);
    if (new Set(slugs).size !== slugs.length) {
      ctx.addIssue({ code: "custom", input: slugs, message: "lines.json: дубль slug" });
    }
  });
export type Lines = z.infer<typeof linesSchema>;

export const servicesSchema = z.array(serviceSchema);
export type Services = z.infer<typeof servicesSchema>;

// §4.5: pricing.json = группы { group, items: [{ name, unit, priceFrom, note? }] }
export const pricingItemSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  priceFrom: z.number().int().nonnegative(),
  note: z.string().optional(),
});
export const pricingSchema = z.array(
  z.object({ group: z.string().min(1), items: z.array(pricingItemSchema) }),
);

// Контакты: contract site.json §4.6 + факт дрейфа (email/address/workingHours/telegram добавлены)
export const siteSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  phoneHref: z.string().startsWith("tel:"),
  endpoint: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(1),
  workingHours: z.string().min(1),
  telegram: z.string().min(1),
});
export type SiteContact = z.infer<typeof siteSchema>;

// ── Форматирование цен (D-06: формат в одном месте) ──
export const NO_PRICE = "по смете" as const;

export function priceLabel(priceFrom: number | undefined): string {
  if (priceFrom === undefined || priceFrom === 0) return NO_PRICE;
  return `от ${priceFrom.toLocaleString("ru-RU")} ₽`;
}
```

### 2. `getStaticPaths` поверх чистого плана

```ts
// продолжение site/src/lib/data.ts — роут-план как чистые функции
export interface RouteEntry<T> { params: Record<string, string>; props: T }

export function getLineRoutePlan(): RouteEntry<Line>[] {
  return [...linesByOrder()].map((line) => ({
    params: { line: line.slug },
    props: line,
  }));
}

export function getServiceRoutePlan(): RouteEntry<{ line: Line; service: Service }>[] {
  return [...linesByOrder()].flatMap((line) =>
    getServices(line.slug).map((service) => ({
      params: { line: line.slug, service: service.slug },
      props: { line, service },
    })),
  );
}
```

```astro
---
// site/src/pages/services/[line]/index.astro
import { getLineRoutePlan } from "../../../lib/data";
import type { Line } from "../../../lib/data";

export const getStaticPaths = () => getLineRoutePlan();
const line = Astro.props as Line;
---
<BaseLayout title={`${line.title} — услуги`}>
  <!-- сетка услуг, priceLabel(service.priceFrom) -->
</BaseLayout>
```

### 3. vitest.config.ts (официальный путь Astro)

```ts
// site/vitest.config.ts
/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    environment: "node", // чистые TS-модули; jsdom не нужен (Astro v6+: node-для-компонент) [CITED: docs.astro.build — upgrade-to/v6]
  },
});
```

```json
// site/package.json — scripts, добавление:
// "test": "vitest run",
// "test:watch": "vitest"
```

### 4. Тест инвариантов + тест добавляемости (vitest)

```ts
// site/src/lib/data.test.ts
import { describe, expect, it } from "vitest";
import { linesSchema, priceLabel, serviceSchema, getServiceRoutePlan } from "./data";

describe("lines.json invariants", () => {
  it("slug kebab-case", () => {
    expect(() => linesSchema.parse([{ slug: "Elektro", title: "x", tagline: "y", order: 1 }])).toThrow();
  });
  it("дубль slug ловится", () => {
    expect(() => linesSchema.parse([
      { slug: "a", title: "x", tagline: "y", order: 1 },
      { slug: "a", title: "x", tagline: "y", order: 2 },
    ])).toThrow();
  });
});

describe("тест добавляемости (REQ-growth-extensibility)", () => {
  // Фикстура: третье направление — то, что владелец добавит по JSON без правки кода
  const third = { slug: "solnechnye-paneli", title: "Солнечные панели", tagline: "…", order: 3 };
  it("третий line даёт маршрут /services/solnechnye-paneli/", () => {
    const plan = buildRoutePlanFromLines([...realLines, third], servicesFixture);
    expect(plan.some((r) => r.params.line === "solnechnye-paneli")).toBe(true);
  });
});

describe("priceLabel (D-04/D-06/D-07)", () => {
  it("по смете для 0 и отсутствия", () => {
    expect(priceLabel(0)).toBe("по смете");
    expect(priceLabel(undefined)).toBe("по смете");
  });
  it("от N ₽ с разделителем", () => {
    expect(priceLabel(8000)).toBe("от 8 000 ₽");
  });
});
```

(Имена `buildRoutePlanFromLines`, сервис-фикстура — параметры planner'а; важное требование — логика добавляемости должна быть чистой функцией, тестируемой без запуска astro build.)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Astro.glob() | `import.meta.glob()` (Vite) | Astro 5 (migration guide) | В Astro 7 — только import.meta.glob; Astro.glob удалён [CITED: docs.astro.build/en/guides/upgrade-to/v5] |
| Astro Collections `loadImage`/astro:content для JSON | `file()`/`glob()` loader'ы в `src/content.config.ts` | Astro 5+ | Не используется в этой фазе (решение спеки); важно знать, что file() требует `id`-поле в каждой записи |
| Vitest client-environment (jsdom) | node-environment | Astro v6 | Тесты на модули — `environment: "node"`; Astro-компоненты в vitest не рендерятся в client-env [CITED: docs.astro.build — upgrade-to/v6] |
| Zod 3 (`ctx.addIssue(code: z.ZodIssueCode.custom)`) | Zod 4 (`code: "custom"`, `input` обязателен, `ctx.path` недоступен) | zod 4.x | Проект тянет zod 4.6.7 — API v4, не v3 |

**Deprecated/outdated:**
- `Astro.glob()` — удалён в Astro 5+; не использовать.
- Написание zod-схем по v3-примерам из интернета — mismatch с установленной v4.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Regex kebab-case `/^[a-z0-9]+(-[a-z0-9]+)*$/` — достаточное определение «kebab-case, латиница» из спеки §4.1 | Standard Stack / Pattern 1 | Слишком строго/широко для какого-то реального слага (например, точка/цифра в начале) — правится одной regex-правкой |
| A2 | `import.meta.glob` с eager:true работает в vitest без спец-конфигурации (Vite-native) | Pattern 2 / Pitfall 8 | Первый vitest-прогон с glob-функциями упадёт; фолбэк — тестировать glob-логику только через build, а чистые функции — в vitest (Pattern 3 это уже гарантирует) |
| A3 | Vitest 5.x совместим с `getViteConfig` в Astro 7.4 (Astro-гайд написан под Vitest 3+; Vitest 5 — свежайший релиз) | Standard Stack | Если API `getViteConfig` ожидает другой интерфейс — упрощение до `defineConfig` из `vitest/config` |
| A4 | Плейсхолдеры email/telegram/address/workingHours (⏳) — точные значения утверждает владелец позже, формат валидации email-строкой zod-схемой достаточен | Pattern 5 | Формат плейслдера-строки может не пройти `z.string().email()` → смягчить на min(1) + отметка ⏳ |
| A5 | «Контакты не хардкодятся» не требует трогать `BaseLayout.astro` (нет контактных фактов) | Pitfall 7 | Если success-criterion трактует шире (в т.ч. имя в заголовке страницы) — дополнительная правка BaseLayout |

## Open Questions (RESOLVED)

> Все три вопроса разрешены при планировании 2026-10-29: решения уже зафиксированы в планах фазы, маркеры RESOLVED ниже лишь ссылаются на принятые решения (тела вопросов сохранены без изменений для истории). Новых ответов не добавлено.

1. **Инвариант перекрёстной уникальности слагов**
   - What we know: спека §4.1/§4.2 гарантирует уникальность внутри `lines.json` и внутри массива услуг направления (kebab-case, уникален).
   - What's unclear: должен ли слаг услуги быть уникален и **между направлениями** (например, `zamena-rozetok` в двух направлениях одновременно — URL их различает по `/services/<line>/`, значит коллизии нет; но для перелинковки с кейсами по полю `line` коллизии не страшны).
   - Recommendation: инвариант уникальности — внутри массива (per-line). Если planner считает нужным — добавить глобальную уникальность в `getServiceRoutePlan` как superRefine.
   - **RESOLVED (2026-10-29, план 01-01 — ASM-01-b в must_haves.assumptions):** уникальность слага — только внутри одного массива (per-line); глобальная перекрёстная уникальность между направлениями НЕ инвариант (URL различает направления по `/services/<line>/`). Surfaced как flagged-допущение, не тихий drop.

2. **`/services/` страница в этой фазе или в Phase 2**
   - What we know: success criterion №1 фазы прямо требует `/services/` с карточками и посадочные; Phase 2 перезанимает главную, а страница `/services/` — её UI-дизайн не определён как премиальный (это «обзор направлений»).
   - What's unclear: насколько детально стилизуется `/services/` и посадочные в фазе 1 (минимум в токенах) vs отложить стилизацию в Phase 2/3.
   - Recommendation: минимальная валидная структура в токенах «Ночной меди» (карточки + сетка услуг), без отдельной UI-спеки — это и есть success criterion №1; премиальный дизайн — Phase 2.
   - **RESOLVED (2026-10-29, план 01-01 — ASM-01-a в must_haves.assumptions):** минимальная валидная структура в токенах «Ночной меди», без отдельной UI-спеки; премиальный дизайн — Phase 2. Продолжено в рендере планом 01-02 (ASM-02-a): пустые состояния честные, без фейковых карточек.

3. **Vitest 5 + `getViteConfig` (A3)**
   - What we know: Astro-гайд документирует `getViteConfig`; версия vitest latest — 5.0.5 (только что вышла).
   - What's unclear: совместимость витест-5 с astro 7.4 `getViteConfig` — не проверена в этом environment.
   - Recommendation: при проверке несовместимости — downgrade до стабильной ветки vitest 4.x (`npm view vitest@4 version`) или `defineConfig` из `vitest/config`. Планировщику стоит включить checkpoint после Wave 0 (установка vitest) с ранним прогоном `npm test`.
   - **RESOLVED (2026-10-29, план 01-01 — Task 2 п.3):** принят путь разрешения: ранний прогон `npm test` сразу после установки vitest; при подтверждённой несовместимости `getViteConfig` с vitest 5 — фолбэк `defineConfig` из `vitest/config` (environment: node сохраняется), отклонение фиксируется в SUMMARY. Итоговый выбор конфига эмпирически проверяется в Wave 0 — Assumption A3 остаётся проверяемым допущением, не открытым вопросом.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| node ≥22.22.0 (engines package.json) | все npm-скрипты | ✓ | 26.7.0 | — |
| npm | установка zod/vitest | ✓ | 12.0.2 | — |
| astro | сборка, SSG, astro check | ✓ | 7.4.0 (exact) | — |
| zod | lib/data.ts схемы | ✓ транзитивно, ✗ как прямая dep | 4.6.7 | `npm install zod@4.6.7` |
| vitest | npm test (гейт фазы) | ✗ | — | install devDep `vitest` (см. Pitfall 11/proposal «checkpoint») |
| python3 | test:server (не трогаем в фазе) | ✓ | системный | — |

**Missing dependencies with no fallback:** none (все недостающие устанавливаются npm-ом в Wave 0).
**Missing dependencies with fallback:** vitest (не установлен → единственная новая dev-зависимость; установка — обычный npm install).

## Validation Architecture

> `.planning/config.json` отсутствует → `workflow.nyquist_validation` считается включённым (absent = enabled).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (новый гейт этой фазы) + существующие: Playwright e2e, Python unittest |
| Config file | `site/vitest.config.ts` (Wave 0, NEW) — `getViteConfig()` |
| Quick run command | `cd site && npm test` |
| Full suite command | `cd site && npm run lint && npm run check && npm test && npm run build` (гейты qa.md/astro-code rule) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-services-lines-hierarchy | `/services/elektromontazh/` и `/services/umniy-dom/` собираются из двух JSON-файлов, сетка услуг с priceLabel | unit (route-план: `getServiceRoutePlan()` содержит по 4–5 маршрутов на направление) + build | `npm test` + `npm run build` (дистрибутив содержит dist/services/elektromontazh/index.html) | ❌ Wave 0 |
| REQ-growth-extensibility | третье направление в фикстуре даёт маршрут + пустые услуги не роняют сборку | unit (фикстура «solnechnye-paneli») | `npm test` | ❌ Wave 0 |
| (SC-3) инварианты | slug kebab-case/уникальность; priceFrom 0/absence → «по смете»; pricing.json schema; order int | unit | `npm test` | ❌ Wave 0 |
| (SC-4) site.json §4.6 | схема site.json валидирует новый контракт; contacts.astro не хардкодит часы/регион | unit (siteSchema.parse) + grep-check в ручной приёмке | `npm test` | ❌ Wave 0 |
| REQ-services-lines-hierarchy (UI) | страницы открываются, тексты различаются, «по смете» не «0 ₽» | manual (test-case.md шаг 1) или e2e-добавка Playwright (crawl /services/ линки) — по решению planner'а; минимально: ручной сценарий | — | manual |

### Sampling Rate
- **Per task commit:** `cd site && npm test` (+ `npm run check` при правке .astro/.ts)
- **Per wave merge:** `npm run lint && npm run check && npm test && npm run build`
- **Phase gate:** полный набор гейтов зелёный перед `/gsd-verify-work` (contract: `.claude/rules/astro-code.md`)

### Wave 0 Gaps
- [ ] `npm install -D vitest` + `npm install zod@4.6.7` (после `checkpoint:human-verify` для vitest — SUS-флаг)
- [ ] `site/vitest.config.ts` — конфиг getViteConfig; ранний прогон `npm test` (Pitfall 5, 8)
- [ ] `site/src/lib/data.ts` — минимальный скелет схем ещё до тестов
- [ ] `site/src/lib/data.test.ts` или `site/tests/data.test.ts` (vitest default include `**/*.test.ts` — любой из путей окей; главное — не попадать в `e2e/` dir, там Playwright)
- [ ] Обновить `site/package.json`: `"test": "vitest run", "test:watch": "vitest"`

*(Если planner решит добавить e2e-смоук краулера — отдельная задача Wave 1, не блокирует остальные.)*

## Security Domain

> `security_enforcement` не отключён в конфиге (config.json отсутствует), раздел обязателен.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | публичный сайт, аутентификации нет |
| V3 Session Management | no | нет состояния |
| V4 Access Control | no | все роуты публичные |
| V5 Input Validation | **yes** | zod-схемы для всех входящих JSON-файлов (`lib/data.ts`), fail-fast при сборке |
| V6 Cryptography | no | секреты (Telegram) вне скоупа фазы |

### Known Threat Patterns for Astro SSG + JSON-данные

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| JSON-строки в HTML → XSS | Tampering | React/Astro экранирует JSX-экспрешшены по умолчанию; **не** использовать `set:html` для данных JSON в шаблонах услуг; zod-схема ограничивает тип поля (string) |
| Спам-контент через правку JSON (внутренний риск, git-источник) | Tampering | JSON в git, review перед merge — вне рантайма |
| Утечка секретов через `site.json` | Information Disclosure | Контракт `site.json` — только публичные контакты; ни токенов, ни endpoint-секретов. Секреты формы — вне docroot (фаза 4/ContactForm — уже реализовано) |
| Сломанный JSON молча отдаёт пустые страницы | Denial of Service (для UX) | fail-fast zod при build (Pattern 1) — сборка падает вместо пустого контента |

## Sources

### Primary (HIGH confidence)
- Локальная код-база (Read): `site/package.json:8-25` (scripts, deps), `site/src/data/site.json:1-6`, `site/src/pages/contacts.astro` (хардкод часов/региона), `site/src/components/ContactForm.astro:8-18` (паттерн data-атрибутов), `site/src/layouts/BaseLayout.astro`, `site/tsconfig.json`, `site/astro.config.mjs`, `node_modules/astro/tsconfigs/base.json` (resolveJsonModule, verbatimModuleSyntax)
- Спека и доки проекта: `docs/specs/ssq-site-stack-design.md` §3, §4.1–4.6, §9; `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONVENTIONS.md`, `.claude/skills/ssq-astro-conventions/SKILL.md`, `.claude/skills/ssq-typescript-strict/SKILL.md`, `.planning/ROADMAP.md` (Phase 1 details), `docs/test-case.md` шаг 1, `docs/design.md`, `docs/content/strategy.md`
- Context7 `/withastro/docs`: routing-reference (getStaticPaths, params, isolated scope, invalid-route-param), guides/imports (import.meta.glob, eager, generic), guides/content-collections (file() loader, id), guides/testing (getViteConfig, node-environment, upgrade-to/v6), upgrade-to/v5 (Astro.glob → import.meta.glob)
- Context7 `/llmstxt/zod_dev_llms-full_txt`: superRefine/UniqueStringArray, error-customization, zod v4 changelog (ctx.path), ZodMini .check()
- npm registry: `npm view zod version` → 4.6.7; `npm view vitest version` → 5.0.5; `npm ls zod` (транзитивная через astro@7.4.0, @eslint-react)

### Secondary (MEDIUM confidence)
- gsd seam `package-legitimacy check` (zod/vitest SUS «too-new», signals: downloads/repo/postinstall)
- Локальный прогон Node v26.7.0: toLocaleString("ru-RU"), Intl.NumberFormat RUB

### Tertiary (LOW confidence)
- Совместимость vitest 5.0.5 ↔ astro 7.4 `getViteConfig` ([ASSUMED] A3 — проверить ранним прогоном в Wave 0)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — все пакеты уже в node_modules или устанавливаются одной командой; версии подтверждены registry + lockfile
- Architecture: HIGH — паттерны взяты из официальной документации Astro (routing, imports, testing) и уже частично реализованы в репо (ContactForm паттерн)
- Pitfalls: HIGH — большинство подтверждены доксами (getStaticPaths params, zod v4 API, Astro.glob deprecation) или локальным кодом (хардкод контактов)
- Vitest compatibility: MEDIUM (A3) — единственная непроверенная точка, покрыта Wave 0 ранним прогоном

**Research date:** 2026-10-29
**Valid until:** 2026-11-28 (стек стабилен: Astro 7.4 фиксирован в package.json; vitest/zod — только свежие релизы, а не breaking)