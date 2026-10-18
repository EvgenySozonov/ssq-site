# План реализации сайта «Умный квадрат» (первый релиз)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Многостраничный статический сайт с иерархией услуг «направление → услуга», реальной формой заявок (Python CGI → Telegram) и деплоем на Beget Shared.

**Architecture:** Astro SSG в каталоге `site/`, всё собирается в статику; интерактив минимальный (одна React-остров-фильтр, у формы — обычный `<script>`); данные — JSON в `site/src/data`, validated zod-схемами; роутинг услуг строится из `lines.json`; форма — Python 3 CGI (stdlib) на хостинге, контракты ответов в спеке.

**Tech Stack:** Astro 5, TypeScript strict, Tailwind CSS v4, zod (сборка через Astro), React (остров), Python 3 stdlib (CGI на хостинге), rsync.

**Spec:** `docs/specs/ssq-site-stack-design.md` (план ссылается на неё; тексты копирайта — `docs/about.md`, дизайн — `docs/design.md`).

## Global Constraints

- TypeScript `strict`. Node ≥ 20.3 (Astro 5).
- Все цвета/шрифты/отступы — только CSS-переменные из `site/src/styles/tokens.css`; хардкод цветов в компонентах = дефект.
- `html lang="ru"`; canonical и sitemap только на `https://smart-square.ru`.
- Контактные данные (телефон, адрес, часы) — только из `site/src/data/site.json`, в компонентах не дублируются.
- Анимации отключаются при `prefers-reduced-motion: reduce`.
- Честный копирайтинг (docs/about.md): никаких непроверяемых цифр; страницы без реальных данных показывают осмысленные формулировки, не нули и не «N лет».
- Разметка копирует референс-дизайн: карточки `#17191d` с левым бордером 3px меди `#c9a15a`, нумерация `01/02/03` моно-шрифтом, логотип-метка `SSQ //`.
- Каждая секция главной — отдельный компонент, данные из `site/src/data/`.
- `.env` в git не попадает (в `.gitignore` уже есть). Коммиты — частые, по одному на задачу с проверенными шагами; каждая строка `git commit` завершается `-m "Co-Authored-By: Claude Code <noreply@anthropic.com>"`.
- Репозиторий в корне проекта; Astro — в `site/`; референс `example/index.html` не трогаем. После Task 1 обновить `docs/architecture.md` (раздел «Структура»): `astro-pages/` → `site/`.

## Review Focus

(не покрытые тестами классы входов; каждому назначен тест в задаче — строкой `Test:`)

1. Форма: honeypot (`website` заполнен) — клиенту «успех», заявка НЕ доставляется в Telegram. Test: Task 7, шаг 3 (первый assert).
2. Форма: Telegram API недоступен/долгий (>5 с) — `502 {ok:false}`, не «тихая потеря»; клиент показывает телефон. Test: Task 7, шаг 3; Task 6, шаг 4.
3. Пустые данные: коллекция портфолио/отзывы пусты — блок «Работы»/«Отзывы» на главной отсутствует, страницы содержат осмысленное сообщение, не пустые секции. Test: Task 9, шаг 2; Task 4, шаг 5.
4. `priceFrom: 0` → выводится «По смете», никогда «0 ₽». Test: Task 5, шаг 2; Task 3, шаг 4 (страница услуги).
5. Мобильная вёрстка ~400px без горизонтального скролла; анимации гаснут при reduced-motion. Test: Task 4, шаг 7 (ручной сценарий qa.md).

---

### Task 1: Скаффолд Astro-проекта в `site/`

**Files:**
- Create: `site/package.json` (npm create), `site/astro.config.mjs`, `site/tsconfig.json`, `site/eslint.config.mjs`, `site/src/styles/tokens.css`, `site/src/styles/global.css`, `site/src/layouts/BaseLayout.astro`, `site/src/pages/index.astro` (заглушка), `site/.prettierrc.json`
- Modify: `docs/architecture.md` (структура → `site/`), `.gitignore` (`site/node_modules/`, `site/dist/`, `site/.astro/`)

**Interfaces:**
- Produces: `BaseLayout.astro` с пропсами `{ title: string; description?: string; og?: boolean }` — им пользуются все следующие задачи; токены секции §5 спеки доступны как CSS-переменные (`--color-bg`, `--color-accent`, `--font-display`, `--font-mono` и т.д.).

- [x] **Шаг 1: Инициализировать git и первый коммит текущего состояния**

```bash
cd /Users/mac/Documents/_Projects/SSQ-site
git init -b main
git add docs CLAUDE.md README.md .gitignore .env.example src
git commit -m "docs: спека и документация сайта; референс-визитка" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

`.env` не добавляется (проверить: `git status` — не в списке).

- [x] **Шаг 2: Скаффолд Astro**

```bash
npm create astro@latest site -- --template minimal --typescript strict --install --no-git --yes
```

- [x] **Шаг 3: Tailwind v4 + Prettier** _(готово; ESLint-стек: jsx-a11y-x вместо классического по решению владельца; lint clean, check clean_)

```bash
cd site
npm install tailwindcss @tailwindcss/vite
npm install -D prettier prettier-plugin-astro
```

`astro.config.mjs` полностью:

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://smart-square.ru',
  vite: { plugins: [tailwindcss()] },
});
```

`site/.prettierrc.json`:

```json
{ "plugins": ["prettier-plugin-astro"], "printWidth": 100 }
```

В `site/package.json` в scripts: `"format": "prettier --write .", "format:check": "prettier --check ."`, `"check": "astro check"` (гейт типов, решение владельца 2026-10-18 — qa.md, спека §9), `"lint": "eslint ."`, `"lint:fix": "eslint --fix ."` (решение «ESLint в каркасе» 2026-10-18 — docs/memory.md), `"test": "vitest run"` (vitest появится в Task 2). Добавить `site/.nvmrc` с содержимым `24` (обновление решения «Docker отложен» 2026-10-18: bump с 20 — Node 20 за гранью поддержки к октябрю 2026, актуальный eslint-plugin-astro требует Node ≥ 22; выбран активный LTS 24).

ESLint (flat config, ESLint 9-совместимый набор):

```bash
cd site
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-astro eslint-plugin-jsx-a11y-x @eslint-react/eslint-plugin eslint-config-prettier globals
```

_(правка против первоначального плана: классический `eslint-plugin-jsx-a11y` не поддерживает ESLint 10 (требование plugin-astro); по решению владельца 2026-10-18 поставлен форк `eslint-plugin-jsx-a11y-x` — поддержан в peerDeps plugin-astro. Дополнительно к списку: `@astrojs/check` + `typescript` — требование скрипта `check`. Дополнительно при пуске: `@eslint-react`-плагин регистрируется в том же объекте конфига, где применяется его правило (ESLint 10), `globals` не нужен — см. фактический конфиг ниже._)
```

`site/eslint.config.mjs`:

```js
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import eslintReact from '@eslint-react/eslint-plugin';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/**', '.astro/**', 'public/cgi-bin/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // .astro: синтаксис + jsx-a11y-расширения (требует eslint-plugin-jsx-a11y)
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-recommended'],
  // React-острова: hooks-правила и ключи списков
  {
    files: ['src/components/react/**/*.{ts,tsx}'],
    ...eslintReact.configs['recommended-typescript'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  { rules: { '@eslint-react/no-missing-key': 'warn' } },
  // формат — за Prettier; ESLint форматные правила выключены
  prettier,
);
```

Первый прогон `npm run lint` обязателен ещё до Task 2; замечания a11y-правил в шаблонах `.astro` — не глушить без комментария-объяснения (qa.md «Доступность и рендер»).

- [x] **Шаг 4: Токены и глобальные стили** _(правка против плана: в global.css добавлен @import "./tokens.css" — без него Tailwind v4 не генерил утилиты; проверено билдом)_

`site/src/styles/tokens.css` (значения — дословно из спеки §5):

```css
@theme {
  --color-bg: #101014;
  --color-surface: #17191d;
  --color-text: #eceae6;
  --color-text-muted: #9a9a9a;
  --color-accent: #c9a15a;
  --color-accent-contrast: #101014;
  --color-line: #2a2d33;
  --radius-s: 2px;
  --font-display: 'Lora', Georgia, serif;
  --font-sans: 'Manrope', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

`site/src/styles/global.css`:

```css
@import 'tailwindcss';
@import 'https://fonts.googleapis.com/css2?family=Lora:wght@500;600&family=Manrope:wght@400;600&family=JetBrains+Mono:wght@400;500&display=swap';

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- [x] **Шаг 5: BaseLayout.astro**

`site/src/layouts/BaseLayout.astro` — полностью:

```astro
---
interface Props { title: string; description?: string }
const { title, description = 'Электромонтаж и умный дом под ключ — проект, монтаж, автоматизация. Москва и область. Гарантия по договору.' } = Astro.props;
---
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title} — Умный квадрат</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={new URL(Astro.url.pathname, Astro.site)} />
    <meta name="theme-color" content="#101014" />
    <style> @import '../styles/global.css'; </style>
  </head>
  <body class="bg-bg text-text font-sans font-normal">
    <header class="border-b border-line">
      <nav class="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <a href="/" class="font-mono text-sm tracking-[0.2em] text-accent uppercase">SSQ //</a>
        <ul class="flex gap-6 font-mono text-xs uppercase tracking-[0.15em] text-text-muted">
          <li><a href="/services/" class="hover:text-text">Услуги</a></li>
          <li><a href="/pricing/" class="hover:text-text">Цены</a></li>
          <li><a href="/portfolio/" class="hidden sm:list-item hover:text-text">Работы</a></li>
          <li><a href="/contacts/" class="text-text">Контакты</a></li>
        </ul>
      </nav>
    </header>
    <main><slot /></main>
    <footer class="border-t border-line py-8 text-center font-mono text-xs text-text-muted">
      <slot name="footer">
        <p>Умный квадрат · электромонтаж и умный дом · Москва и область</p>
      </slot>
    </footer>
  </body>
</html>
```

`site/src/pages/index.astro` — заглушка до Task 4:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Умный квадрат"><div class="p-10">Каркас собран</div></BaseLayout>
```

- [x] **Шаг 6: Проверка** _(build ✓, format:check ✓, скриншот task1-acceptance.png — фон #101014/медь #c9a15a/Manrope ✓)_

```bash
cd site && npx astro build
```

Expected: сборка без ошибок; открыть `dist/index.html` в браузере — тёмный фон, медная метка `SSQ //.`
Также: `npm run format && npm run format:check` — проходит.

- [~] **Шаг 7: Синхронизировать docs и закоммитить** _(докс синхронизированы; коммит ниже)_

В `docs/architecture.md` заменить `astro-pages/` на `site/`; в `.gitignore` дописать `site/node_modules/`, `site/dist/`, `site/.astro/`.

```bash
git add -A
git commit -m "feat: каркас Astro+Tailwind v4, токены, BaseLayout" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: Модель данных и zod-схемы

**Files:**
- Create: `site/src/data/site.json`, `site/src/data/services/lines.json`, `site/src/data/services/elektromontazh.json`, `site/src/data/services/umniy-dom.json`, `site/src/data/pricing.json`, `site/src/data/reviews.json`, `site/src/data/home/standards.json`, `site/src/data/home/process.json`, `site/src/data/home/faq.json`
- Create: `site/src/lib/data.ts` (типы + zod + доступ к данным)

**Interfaces:**
- Produces (обязательные для будущих задач): `getLines(): Line[]`, `getServices(line: string): Service[]`, `getSite(): SiteInfo`, `getPricing(): PricingGroup[]`, `getReviews()`, `getStandards()`, `getProcess()`, `getFaq()`. Типы: `Line { slug: string; title: string; tagline: string; order: number }`, `Service { slug: string; title: string; summary: string; priceFrom: number; order: number }`, `SiteInfo { phone: string; phoneHref: string; email: string; address: string; workingHours: string; telegram: string }`.

- [ ] **Шаг 1: JSON-файлы**

`site/src/data/site.json`:

```json
{
  "phone": "+7 (000) 000-00-00",
  "phoneHref": "tel:+70000000000",
  "email": "hello@smart-square.ru",
  "address": "Москва и область — выезжаем на объект",
  "workingHours": "Ежедневно 9:00–21:00",
  "telegram": "https://t.me/ssq_placeholder"
}
```

`site/src/data/services/lines.json` — дословно из спеки §4.1 (elektromontazh, umniy-dom).

`site/src/data/services/elektromontazh.json`:

```json
[
  { "slug": "razvodka-elektriki", "title": "Разводка электрики", "summary": "Скрытая разводка по проекту с фотофиксацией каждого этапа", "priceFrom": 0, "order": 1 },
  { "slug": "shchity", "title": "Сборка и замена щитов", "summary": "Щит по схеме: подписи, номиналы, прозрачная защита", "priceFrom": 0, "order": 2 },
  { "slug": "osveshchenie", "title": "Освещение", "summary": "Свет сценами: рабочее, фоновое, акцентное — и управление", "priceFrom": 0, "order": 3 }
]
```

`site/src/data/services/umniy-dom.json`:

```json
[
  { "slug": "svet-automatika", "title": "Автоматизация освещения", "summary": "Сцены, диммирование, датчики — свет, который подстраивается", "priceFrom": 0, "order": 1 },
  { "slug": "klimat", "title": "Управление климатом", "summary": "Тёплые полы и кондиционирование под контролем", "priceFrom": 0, "order": 2 },
  { "slug": "proekt-umnyj-dom", "title": "Проект умного дома", "summary": "Схема, протокол, спецификация — до покупки оборудования", "priceFrom": 0, "order": 3 }
]
```

`site/src/data/pricing.json`, `reviews.json`, `home/standards.json`, `home/process.json`, `home/faq.json` — состав по копирайту `docs/about.md` и тексту ниже; во всех ценах `priceFrom: 0` (значит «По смете»):

```json
// pricing.json
[
  { "group": "Электромонтаж", "items": [
    { "name": "Разводка электрики", "unit": "точка", "priceFrom": 0 },
    { "name": "Сборка щита", "unit": "объект", "priceFrom": 0 },
    { "name": "Замена щита", "unit": "объект", "priceFrom": 0 }
  ]},
  { "group": "Умный дом", "items": [
    { "name": "Автоматизация освещения", "unit": "группа света", "priceFrom": 0 },
    { "name": "Климат", "unit": "контур", "priceFrom": 0 },
    { "name": "Проект умного дома", "unit": "объект", "priceFrom": 0 }
  ]}
]

// reviews.json — пусто (блок скрывается)
[]

// home/standards.json — дословно из about.md
[
  { "n": "01", "title": "Фиксированная смета до начала работ", "text": "Цена утверждается до монтажа; внеплановых доплат по ходу не существует." },
  { "n": "02", "title": "Фотофиксация скрытых работ", "text": "Этап перед закрытием штробы или стяжки фотографируется — вы видите, что остаётся в стенах." },
  { "n": "03", "title": "Документация остаётся у вас", "text": "Схему щита и линий передаём заказчику вместе с объектом." },
  { "n": "04", "title": "Гарантия по договору — 3 года", "text": "Срок и условия прописаны в договоре, а не обещаны голосом." }
]

// home/process.json
[
  { "n": "01", "title": "Заявка", "text": "Оставляете контакты — согласовываем выезд на замер." },
  { "n": "02", "title": "Замер и проект", "text": "Считаем нагрузки, рисуем схему, обсуждаем сценарии." },
  { "n": "03", "title": "Смета и договор", "text": "Фиксируем цену и сроки до первого платежа." },
  { "n": "04", "title": "Монтаж", "text": "Фотофиксация скрытых работ на каждом этапе." },
  { "n": "05", "title": "Сдача и гарантия", "text": "Сдаём схемy, показываем управление, подписываем гарантом договор гарантии." }
]

// home/faq.json
[
  { "q": "Сколько стоит?", "a": "Цена утверждается в смете после бесплатного выезда. До замера честно отвечаем: фиксированных «прайс-листьев» не обещаем." },
  { "q": "Как не потерять контроль над ценой?", "a": "Смета фиксируется до монтажа. Дописывающие «доп-работы по ходу» исключены процессом." },
  { "q": "Проект обязателен?", "a": "Да. Монтаж без расчётов — как здание без фундамента. Проект остаётся у вас." },
  { "q": "Что с гарантией?", "a": "Три года по договору. Условия и критерии отказа прописаны, а не оговорены голосом." },
  { "q": "Можно делать в несколько этапов?", "a": "Да: например, сначала электрика, авоматизация позже — проект сразу делаем с этим заделом." }
]
```

(Порядок в JSON-комментариях не валиден — в файле их нет; это разметка задачи. В `faq.json` — 5 вопросов, не 6.)

- [ ] **Шаг 2: `site/src/lib/data.ts` — zod + доступ**

```ts
import { z } from 'astro/zod';
import siteJson from '../data/site.json';
import linesJson from '../data/services/lines.json';
import pricingJson from '../data/pricing.json';
import reviewsJson from '../data/reviews.json';
import standardsJson from '../data/home/standards.json';
import processJson from '../data/home/process.json';
import faqJson from '../data/home/faq.json';

const LineSchema = z.object({ slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/), title: z.string(), tagline: z.string(), order: z.number() });
export type Line = z.infer<typeof LineSchema>;

const ServiceSchema = z.object({ slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/), title: z.string(), summary: z.string(), priceFrom: z.number().min(0), order: z.number() });
export type Service = z.infer<typeof ServiceSchema>;

const SiteSchema = z.object({ phone: z.string(), phoneHref: z.string(), email: z.string().email(), address: z.string(), workingHours: z.string(), telegram: z.string().url() });
export type SiteInfo = z.infer<typeof SiteSchema>;

const PricingItem = z.object({ name: z.string(), unit: z.string(), priceFrom: z.number().min(0) });
const PricingSchema = z.array(z.object({ group: z.string(), items: z.array(PricingItem) }));
const ReviewSchema = z.object({ author: z.string(), text: z.string(), date: z.string(), published: z.boolean() });
const StandardSchema = z.object({ n: z.string(), title: z.string(), text: z.string() });
export type Standard = z.infer<typeof StandardSchema>;
const ProcessSchema = z.object({ n: z.string(), title: z.string(), text: z.string() });
export type ProcessStep = z.infer<typeof ProcessSchema>;
const FaqSchema = z.object({ q: z.string(), a: z.string() });
export type Faq = z.infer<typeof FaqSchema>;

export const getSite = (): SiteInfo => SiteSchema.parse(siteJson);
export const getLines = (): Line[] => z.array(LineSchema).parse(linesJson).sort((a, b) => a.order - b.order);
export const getLine = (slug: string): Line | undefined => getLines().find((l) => l.slug === slug);
export const getPricing = () => PricingSchema.parse(pricingJson);
export const getReviews = () => z.array(ReviewSchema).parse(reviewsJson).filter((r) => r.published);
export const getStandards = (): Standard[] => z.array(StandardSchema).parse(standardsJson);
export const getProcess = (): ProcessStep[] => z.array(ProcessSchema).parse(processJson);
export const getFaq = (): Faq[] => z.array(FaqSchema).parse(faqJson);

// getServices — JSON-импорт по имени файла; слаг валидируем схемой
const serviceCache = new Map<string, Service[]>();
export async function getServices(line: string): Promise<Service[]> {
  if (serviceCache.has(line)) return serviceCache.get(line)!;
  const mod = (await import(`../data/services/${line}.json`)) as { default: Service[] };
  const parsed = z.array(ServiceSchema).parse(mod.default).sort((a, b) => a.order - b.order);
  serviceCache.set(line, parsed);
  return parsed;
}
```

- [ ] **Шаг 3: vitest для lib-слоя**

```bash
cd site && npm install -D vitest
```

`site/src/lib/data.test.ts` — по правилу TDD: тесты пишутся до использования схем в UI:

```ts
import { describe, it, expect } from 'vitest';
import { getLines, getLine, getSite, getStandards, getFaq, getReviews } from './data';

describe('model lines', () => {
  it('возвращает два направления, отсортированные по order', () => {
    const lines = getLines();
    expect(lines.map((l) => l.slug)).toEqual(['elektromontazh', 'umniy-dom']);
  });
  it('getLine находит по slug и undefined на неизвестный', () => {
    expect(getLine('elektromontazh')?.title).toBe('Электромонтаж');
    expect(getLine('nope')).toBeUndefined();
  });
  it('слаги строго kebab-case — мусор в lines.json валит сборку тестом', () => {
    expect(getLines().every((l) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(l.slug))).toBe(true);
  });
});

describe('model misc', () => {
  it('site.json читается схемой', () => {
    expect(getSite().phoneHref.startsWith('tel:')).toBe(true);
  });
  it('стандарты, FAQ, отзывы: формы данных валидны', () => {
    expect(getStandards().length).toBe(4);
    expect(getFaq().length).toBe(5);
    expect(getReviews()).toEqual([]);
  });
});
```

- [ ] **Шаг 4: Проверка и коммит**

```bash
cd site && npm test && npx astro build   # тесты и сборка зелёные: TS проверяет JSON-импорты и zod-схемы
```

```bash
git add site/src site/package.json site/package-lock.json
git commit -m "feat: модель данных — lines, services, pricing, сайт-инфо, zod, vitest" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: Роутинг услуг из lines.json

**Files:**
- Create: `site/src/pages/services/index.astro`, `site/src/pages/services/[line]/index.astro`, `site/src/pages/services/[line]/[service]/index.astro`, `site/src/components/PageHeader.astro`
- Modify: `src/pages/index.astro` — нет; `site/src/layouts/BaseLayout.astro` — нет

**Interfaces:**
- Consumes: `getLines()`, `getLine(slug)`, `getServices(line)` из Task 2; `BaseLayout`.
- Produces: маршруты `/services/`, `/services/elektromontazh/`, `/services/elektromontazh/razvodka-elektriki/` (и т.д. по данным); формат цены «По смете» (общий) — вынесен в `PageHeader`-хелпер `formatPrice(priceFrom: number): string` рядом со списком (см. ниже).

- [ ] **Шаг 1: Хелпер цены** — `site/src/lib/format.ts`:

```ts
export function formatPrice(priceFrom: number): string {
  return priceFrom > 0 ? `от ${priceFrom.toLocaleString('ru-RU')} ₽` : 'По смете';
}
```

`site/src/lib/format.test.ts` (TDD: сначала тест, затем уже написанный хелпер — проверить оба правила):

```ts
import { describe, it, expect } from 'vitest';
import { formatPrice } from './format';

describe('formatPrice', () => {
  it('0 никогда не выводится как «0 ₽» (Review Focus п.4)', () => {
    expect(formatPrice(0)).toBe('По смете');
  });
  it('число → «от N ₽» с русским форматом разрядов', () => {
    expect(formatPrice(1234)).toBe('от 1 234 ₽');
  });
});
```

- [ ] **Шаг 2: Компонент PageHeader.astro** — заголовок раздела + подзаголовок:

```astro
---
interface Props { title: string; subtitle?: string }
const { title, subtitle } = Astro.props;
---
<div class="mx-auto max-w-5xl px-5 pt-12">
  <h1 class="font-display text-3xl md:text-4xl">{title}</h1>
  {subtitle && <p class="mt-3 max-w-xl text-sm text-text-muted">{subtitle}</p>}
</div>
```

- [ ] **Шаг 3: `/services/`** — обзор направлений:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PageHeader from '../../components/PageHeader.astro';
import { getLines } from '../../lib/data';
const lines = getLines();
---
<BaseLayout title="Услуги" description="Направления: электромонтаж и умный дом — проект, монтаж, автоматизация под ключ.">
  <PageHeader title="Услуги" subtitle="Два направления — электрика и автоматика. Новые добавляем, когда выходим на них." />
  <div class="mx-auto grid max-w-5xl gap-4 px-5 py-10 sm:grid-cols-2">
    {lines.map((line) => (
      <a href={`/services/${line.slug}/`} class="group block border-l-[3px] border-line bg-surface p-5 transition-colors hover:border-accent" style="border-left-color: var(--color-accent);">
        <div class="font-mono text-xs text-accent">{String(lines.indexOf(line) + 1).padStart(2, '0')}</div>
        <h2 class="mt-2 font-display text-xl">{line.title}</h2>
        <p class="mt-2 text-sm text-text-muted">{line.tagline}</p>
      </a>
    ))}
  </div>
</BaseLayout>
```

- [ ] **Шаг 4: `/services/[line]/` и `/services/[line]/[service]/`**

`[line]/index.astro`:

```astro
---
import BaseLayout from '../../../layouts/BaseLayout.astro';
import PageHeader from '../../../components/PageHeader.astro';
import { getLines, getServices } from '../../../lib/data';
import { formatPrice } from '../../../lib/format';

export async function getStaticPaths() {
  const lines = getLines();
  return lines.map((line) => ({ params: { line: line.slug }, props: { line } }));
}
const { line } = Astro.props as { line: ReturnType<typeof getLines>[number] };
const services = await getServices(line.slug);
---
<BaseLayout title={line.title} description={line.tagline}>
  <PageHeader title={line.title} subtitle={line.tagline} />
  <div class="mx-auto max-w-5xl divide-y divide-line px-5 py-10">
    {services.map((s) => (
      <a href={`/services/${line.slug}/${s.slug}/`} class="block cursor-pointer py-5">
        <div class="flex items-baseline justify-between gap-4">
          <h2 class="font-display text-lg">{s.title}</h2>
          <span class="shrink-0 font-mono text-sm text-accent">{formatPrice(s.priceFrom)}</span>
        </div>
        <p class="mt-1 text-sm text-text-muted">{s.summary}</p>
      </a>
    ))}
  </div>
</BaseLayout>
```

`[line]/[service]/index.astro`:

```astro
---
import BaseLayout from '../../../../layouts/BaseLayout.astro';
import PageHeader from '../../../../components/PageHeader.astro';
import { getLines, getServices, getSite } from '../../../../lib/data';
import { formatPrice } from '../../../../lib/format';

export async function getStaticPaths() {
  const lines = getLines();
  const out = [];
  for (const line of lines) {
    for (const service of await getServices(line.slug)) {
      out.push({ params: { line: line.slug, service: service.slug }, props: { line, service } });
    }
  }
  return out;
}
const { line, service } = Astro.props;
const site = getSite();
---
<BaseLayout title={`${service.title} — ${line.title}`} description={service.summary}>
  <PageHeader title={service.title} subtitle={line.tagline} />
  <div class="mx-auto max-w-5xl px-5 py-10">
    <p class="font-mono text-sm text-accent">{formatPrice(service.priceFrom)}</p>
    <p class="mt-6 text-sm leading-relaxed text-text-muted">{service.summary}. Точное количество работ и цену фиксируем в смете после бесплатного выезда.</p>
    <a href="/contacts/" class="mt-8 inline-block bg-accent px-5 py-3 text-sm font-semibold text-accent-contrast">Бесплатный выезд →</a>
    <p class="mt-3 text-sm text-text-muted">или позвоните: <a class="font-mono text-text" href={site.phoneHref}>{site.phone}</a></p>
  </div>
</BaseLayout>
```

- [ ] **Шаг 5: Тест добавляемости направления** (сценарий test-case.md, шаг 1)

В `lines.json` добавить третье направление `{ "slug": "test", "title": "Тест", "tagline": "test", "order": 3 }`:

```bash
npx astro build
```

Expected: собрался `/services/test/index.html` — правки кода не потребовалось. Вернуть `lines.json`, пересобрать, проверить отсутствие `/services/test/`.

- [ ] **Шаг 6: Коммит**

```bash
git add -A && git commit -m "feat: роутинг услуг, генерируемый из lines.json" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: Главная — секции

**Files:**
- Create: `site/src/components/sections/Hero.astro`, `ServicesBlock.astro`, `Standards.astro`, `Process.astro`, `WorksBlock.astro`, `PricingPreview.astro`, `ReviewsBlock.astro`, `Faq.astro`, `CtaFooter.astro`
- Modify: `site/src/pages/index.astro` (заменить заглушку композицией секций), `site/src/content.config.ts` (коллекция portfolio — нужна WorksBlock для «пусто → скрыть»)

**Interfaces:**
- Consumes: `getLines/getServices/getSite/getPricing/getReviews/getStandards/getProcess/getFaq`, `formatPrice`, коллекция `portfolio`.
- Produces: композиция index.astro в порядке §6 design.md; компоненты `Hero` и `CtaFooter` использует только главная.

- [ ] **Шаг 1: collection config**

`site/src/content.config.ts`:

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const portfolio = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/portfolio' }),
  schema: z.object({
    title: z.string(),
    line: z.string(),
    date: z.coerce.date(),
    photos: z.array(z.string()).default([]),
    summary: z.string(),
    published: z.boolean().default(false),
  }),
});
export const collections = { portfolio };
```

(Каталог `src/content/portfolio/` пустой; mdx не создаём — коллекция «пустой валидна».)

- [ ] **Шаг 2: Hero.astro** — full-bleed с градиентным фоллбеком, CTA «Бесплатный выезд →», телефон из site.json:

```astro
---
import { getSite } from '../../lib/data';
const site = getSite();
---
<section class="relative isolate min-h-[70vh] overflow-hidden" style="background: linear-gradient(160deg, #2a251c 0%, #191714 45%, #241f18 100%);">
  <div class="absolute inset-0" aria-hidden="true" data-photo-slot="hero"></div>
  <div class="relative mx-auto flex max-w-5xl flex-col justify-end px-5 pt-40 md:pt-56 pb-16">
    <h1 class="max-w-3xl font-display text-4xl md:text-6xl leading-[1.1]">Электрика и умный дом под ключ</h1>
    <p class="mt-4 max-w-xl text-sm md:text-base text-text-muted">Проект · монтаж · автоматизация. Москва и область. Гарантия по договору.</p>
    <div class="mt-8 flex flex-wrap items-center gap-5">
      <a href="/contacts/" class="bg-accent px-6 py-3 text-sm font-semibold text-accent-contrast">Бесплатный выезд →</a>
      <a href={site.phoneHref} class="font-mono text-sm text-text-muted underline decoration-dashed underline-offset-4 decoration-accent">{site.phone}</a>
    </div>
  </div>
</section>
```

`data-photo-slot"` — точка крепления будущего фото (шаг 11), в CSS не стилизуем.

- [ ] **Шаг 3: Секции через данные** — `Standards.astro`, `Process.astro`, `Faq.astro`, `ServicesBlock.astro`, `PricingPreview.astro`. Все — один паттерн «перечень из data», показываю один представитель (Standards), остальные — та же структура с их данными и заголовками (Услуги → `getLines`, Процесс → `getProcess`, FAQ → `getFaq` + `<details>`, Цены → `getPricing()` первые 3 позиции → `/pricing/`):

```astro
---
import { getStandards } from '../../lib/data';
const items = getStandards();
---
<section class="mx-auto max-w-5xl px-5 py-16">
  <h2 class="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">Стандарты работы</h2>
  <div class="mt-8 grid gap-4 sm:grid-cols-2">
    {items.map((s) => (
      <article class="border-l-[3px] border-accent bg-surface p-5">
        <div class="font-mono text-sm text-accent">{s.n}</div>
        <h3 class="mt-2 font-display text-lg">{s.title}</h3>
        <p class="mt-2 text-sm text-text-muted">{s.text}</p>
      </article>
    ))}
  </div>
</section>
```

FAQ:

```astro
---
import { getFaq } from '../../lib/data';
const faq = getFaq();
---
<section class="mx-auto max-w-5xl px-5 py-16">
  <h2 class="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">Вопросы</h2>
  <div class="mt-6 divide-y divide-line border border-line">
    {faq.map((f) => (
      <details class="group px-5 py-4">
        <summary class="cursor-pointer font-sans text-sm font-semibold">{f.q}</summary>
        <p class="mt-2 text-sm text-text-muted">{f.a}</p>
      </details>
    ))}
  </div>
</section>
```

- [ ] **Шаг 4: WorksBlock.astro и ReviewsBlock.astro — «пусто → не рендерить»**

```astro
---
import { getCollection } from 'astro:content';
const entries = (await getCollection('portfolio')).filter((e) => e.data.published).slice(0, 3);
if (entries.length === 0) return null;  // блок отсутствует целиком при пустых данных
---
<section class="mx-auto max-w-5xl px-5 py-16">
  <div class="flex items-baseline justify-between">
    <h2 class="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">Работы</h2>
    <a href="/portfolio/" class="font-mono text-xs text-accent">Все работы →</a>
  </div>
  <div class="mt-6 grid gap-4 sm:grid-cols-3">
    {entries.map((e) => (
      <a href={`/portfolio/${e.id}/`} class="block bg-surface p-5 border-l-[3px] border-accent">
        <h3 class="font-display">{e.data.title}</h3>
        <p class="mt-2 text-sm text-text-muted">{e.data.summary}</p>
      </a>
    ))}
  </div>
</section>
```

`ReviewsBlock.astro` — аналогично `getReviews()`; `if (reviews.length === 0) return null;`.

- [ ] **Шаг 5: CtaFooter.astro и index.astro**

`CtaFooter.astro`: секция «Обсудим ваш проект?» + кнопка на `/contacts/`. `index.astro` — композиция в порядке design.md:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/sections/Hero.astro';
import ServicesBlock from '../components/sections/ServicesBlock.astro';
import Standards from '../components/sections/Standards.astro';
import Process from '../components/sections/Process.astro';
import WorksBlock from '../components/sections/WorksBlock.astro';
import PricingPreview from '../components/sections/PricingPreview.astro';
import ReviewsBlock from '../components/sections/ReviewsBlock.astro';
import Faq from '../components/sections/Faq.astro';
import CtaFooter from '../components/sections/CtaFooter.astro';
---
<BaseLayout title="Электромонтаж и умный дом под ключ">
  <Hero /><ServicesBlock /><Standards /><Process /><WorksBlock /><PricingPreview /><ReviewsBlock /><Faq /><CtaFooter />
</BaseLayout>
```

- [ ] **Шаг 6: Сборка** — `npx astro build` — без ошибок, в `dist/index.html` нет блоков «Работы»/«Отзывы» (пустые данные), FAQ — `<details>`.
- [ ] **Шаг 7: Ручной сценарий** (Review Focus п.5): `python3 -m http.server -d dist 8000`, окно ~400px — нет горизонтального скролла; DevTools → `prefers-reduced-motion: reduce` + скролл-анимации отсутствуют (их здесь нет, проверить отсутствие ошибок консоли).
- [ ] **Шаг 8: Коммит**

```bash
git add -A && git commit -m "feat: главная — секции, скрытие пустых блоков, FAQ без JS" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: Страница цен

**Files:**
- Create: `site/src/pages/pricing/index.astro`

- [ ] **Шаг 1: Реализация** — `getPricing()` → группы → таблица-перечень; каждая позиция: название, единица, цена `formatPrice()`. Вверху честная формулировка:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PageHeader from '../../components/PageHeader.astro';
import { getPricing } from '../../lib/data';
import { formatPrice } from '../../lib/format';
const groups = getPricing();
---
<BaseLayout title="Цены" description="Стоимость работ: фиксируем в смете после бесплатного выезда. Здесь — единицы и подход.">
  <PageHeader title="Цены" subtitle="Прячать цены «для галочки» не хочу: единицы и расценки появятся вместе со сметами первых объектов. Сейчас корректный ответ — «по смете», и он честнее придуманной цифры." />
  <div class="mx-auto max-w-5xl px-5 py-10">
    {groups.map((g) => (
      <section class="mb-10">
        <h2 class="font-display text-xl">{g.group}</h2>
        <ul class="mt-4 divide-y divide-line border border-line">
          {g.items.map((i) => (
            <li class="flex items-baseline justify-between gap-4 px-5 py-3">
              <span class="text-sm">{i.name}</span>
              <span class="shrink-0 font-mono text-xs text-accent">{formatPrice(i.priceFrom)} · {i.unit}</span>
            </li>
          ))}
        </ul>
      </section>
    ))}
  </div>
</BaseLayout>
```

(опечатка в subtitle «Прячесть» — при реализации написать «Пряча»; стиль `--color-placeholder` — мусор, в финальном коде убрать строку. Правка по самопроверке — ниже в пункте «Замечания при написании».)

- [ ] **Шаг 2: Проверка Review Focus п.4** — открыть `/pricing/`: нигде нет строки «0 ₽»; везде «По смете».
- [ ] **Шаг 3: Коммит**

```bash
git add -A && git commit -m "feat: страница цен" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 6: Контакты + форма (клиент)

**Files:**
- Create: `site/src/pages/contacts/index.astro`, `site/src/components/ContactForm.astro`

**Interfaces:**
- Consumes: `getSite()`.
- Produces: форма шлёт `POST` на `/cgi-bin/contact.py` JSON `{name, phone, message, consent, website}` (website — honeypot), читает ответ `{ok:boolean, error?:string}`. Контракт эндпоинта — спека §6.2; серверная часть — Task 7.

- [ ] **Шаг 1: ContactForm.astro** — полный код:

```astro
---
---
<form id="lead-form" novalidate class="max-w-xl">
  <div class="grid gap-4">
    <label class="block">
      <span class="font-mono text-xs uppercase tracking-[0.15em] text-text-muted">Имя</span>
      <input name="name" type="text" required class="mt-1 w-full border border-line bg-surface px-4 py-3 text-sm text-text focus:border-accent focus:outline-none" />
    </label>
    <label class="block">
      <span class="font-mono text-xs uppercase tracking-[0.15em] text-text-muted">Телефон</span>
      <input name="phone" type="tel" required class="mt-1 w-full border border-line bg-surface px-4 py-3 text-sm text-text focus:border-accent focus:outline-none" placeholder="+7 (___) ___-__-__" />
    </label>
    <label class="block">
      <span class="font-mono text-xs uppercase tracking-[0.15em] text-text-muted">Что нужно</span>
      <textarea name="message" rows="4" class="mt-1 w-full border border-line bg-surface px-4 py-3 text-sm text-text focus:border-accent focus:outline-none"></textarea>
    </label>
    <label class="flex items-start gap-3 text-sm text-text-muted">
      <input type="checkbox" name="consent" required class="mt-1 accent-[var(--color-accent)]" />
      <span>Согласен с <a href="/legal/privacy/" class="text-accent underline">политикой обработки персональных данных</a></span>
    </label>
    <input type="text" name="website" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true" />
    <button type="submit" class="bg-accent px-6 py-3 text-sm font-semibold text-accent-contrast disabled:opacity-50">Отправить заявку</button>
    <p id="form-status" class="text-sm" role="status"></p>
  </div>
</form>

<script>
  const form = document.getElementById('lead-form') as HTMLFormElement;
  const status = document.getElementById('form-status') as HTMLParagraphElement;
  const btn = form.querySelector('button') as HTMLButtonElement;

  function markInvalid(name: string): void {
    const el = form.elements.namedItem(name) as HTMLElement;
    el.classList.add('border-red-700');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    for (const [k, ok] of Object.entries({
      name: (form.elements.namedItem('name') as HTMLInputElement).value.trim().length >= 2,
      phone: /^[+\d\s()\-]{7,20}$/.test((form.elements.namedItem('phone') as HTMLInputElement).value.trim()),
      consent: (form.elements.namedItem('consent') as HTMLInputElement).checked,
    })) {
      if (!ok) {
        markInvalid(k);
        status.textContent = k === 'consent' ? 'Нужно согласие на обработку данных.' : 'Заполните обязательные поля.';
        status.className = 'text-sm text-red-400';
        return;
      }
    }
    btn.disabled = true; status.textContent = 'Отправляем…';
    try {
      const res = await fetch('/cgi-bin/contact.py', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: (form.elements.namedItem('name') as HTMLInputElement).value.trim(),
          phone: (form.elements.namedItem('phone') as HTMLInputElement).value.trim(),
          message: (form.elements.namedItem('message') as HTMLTextAreaElement).value.trim(),
          consent: 'yes',
          website: (form.elements.namedItem('website') as HTMLInputElement).value,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        form.reset();
        status.textContent = 'Заявка принята — свяжемся в ближайшее время.';
        status.className = 'text-sm text-accent';
      } else {
        status.textContent = data.error ?? 'Не удалось отправить. Позвоните нам напрямую.';
        status.className = 'text-sm text-red-400';
      }
    } catch {
      status.textContent = 'Сервис недоступен. Позвоните: ' + (form.dataset.phone ?? '');
      status.className = 'text-sm text-red-400';
    } finally {
      btn.disabled = false;
    }
  });
</script>
```

`form.dataset.phone` — на `<form … data-phone={site.phone}>` прокинут из родителя.

- [ ] **Шаг 2: `/contacts/index.astro`** — `BaseLayout` + контактные данные из `getSite()` + `ContactForm`; телефоно-альтернатива рядом с формой.
- [ ] **Шаг 3: Проверка вручную (эндпоинта пока нет)** — `npx astro build && npx serve dist` (или http.server). Отправка пустой формы → подсветка + текст; заполненная → текст «Сервис недоступен. Позвоните…» (fetch на несуществующую страницу = 404, JSON.parse падает → catch).
- [ ] **Шаг 4: Коммит**

```bash
git add -A && git commit -m "feat: контакты и клиент формы (валидация, honeypot, состояния)" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 7: CGI-эндпоинт формы (Python 3, только stdlib)

**Files:**
- Create: `site/public/cgi-bin/contact.py` (попадает в `dist/cgi-bin/` при сборке), `site/public/.htaccess`

**Interfaces:**
- Consumes: контракт из спеки §6.2; секреты из окружения CGI или файла `/home/<user>/.env-ssq` (путь переопределяется `SSQ_ENV_PATH`).
- Produces: URL `POST /cgi-bin/contact.py`, ответ `{ok:boolean, error?:string}`; файл `.htaccess` включает исполнение `.py` как CGI.

- [ ] **Шаг 1: Полный код `site/public/cgi-bin/contact.py`**

```python
#!/usr/bin/env python3
"""CGI-эндпоинт формы «Умный квадрат» — только stdlib (без venv/Passenger).
Контракт ответов: docs/specs/ssq-site-stack-design.md §6.2."""
import hashlib, json, os, re, sys, time, urllib.request
from urllib.parse import parse_qs


def _secrets() -> dict:
    s = {'TELEGRAM_BOT_TOKEN': '', 'TELEGRAM_CHAT_ID': '', 'FORM_RATE_LIMIT_PER_HOUR': ''}
    for k in s:
        if os.environ.get(k):
            s[k] = os.environ[k]
    path = os.path.expanduser(os.environ.get('SSQ_ENV_PATH', '~/.env-ssq'))
    if not s['TELEGRAM_BOT_TOKEN'] and os.path.islink(path) is False and os.path.isfile(path):
        with open(path, encoding='utf-8') as fh:
            for ln in fh:
                ln = ln.strip()
                if ln and not ln.startswith('#') and '=' in ln:
                    k, v = ln.split('=', 1)
                    if not s[k.strip()]:
                        s[k.strip()] = v.strip()
    return s


def out(code: int, payload: dict) -> None:
    sys.stdout.write('Status: %d\r\nContent-Type: application/json; charset=utf-8\r\n\r\n' % code)
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))
    sys.exit(0)


def handle(data: dict, secrets: dict) -> tuple:
    if not secrets['TELEGRAM_BOT_TOKEN'] or not secrets['TELEGRAM_CHAT_ID']:
        return 500, {'ok': False, 'error': 'Сервис настроен не полностью. Позвоните нам напрямую.'}
    if str(data.get('website', '')).strip():  # honeypot: маскированный успех, не доставляем
        return 200, {'ok': True}
    name = str(data.get('name', '')).strip()
    phone = str(data.get('phone', '')).strip()
    message = str(data.get('message', '')).strip()
    consent = data.get('consent')
    if len(name) < 2:
        return 400, {'ok': False, 'error': 'Укажите имя.'}
    if not re.fullmatch(r'[+\d\s()\-]{7,20}', phone):
        return 400, {'ok': False, 'error': 'Укажите корректный телефон.'}
    if consent != 'yes':
        return 400, {'ok': False, 'error': 'Нужно согласие на обработку данных.'}

    # rate-limit по IP, окно — час, файл-счётчик в /tmp
    ip = os.environ.get('REMOTE_ADDR') or 'unknown'
    cnt_file = '/tmp/ssq-' + hashlib.md5(ip.encode()).hexdigest()
    st = {}
    try:
        with open(cnt_file, encoding='utf-8') as fh:
            st = json.loads(fh.read() or '{}')
    except OSError:
        pass
    now = time.time()
    if not isinstance(st, dict) or now - float(st.get('t', 0)) > 3600:
        st = {'n': 0, 't': now}
    st['n'] = int(st['n']) + 1
    with open(cnt_file, 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(st))
    if st['n'] > int(secrets['FORM_RATE_LIMIT_PER_HOUR'] or 10):
        return 429, {'ok': False, 'error': 'Слишком много отправок с этого адреса. Позвоните нам.'}

    # доставка в Telegram, честный отказ не маскируется
    text = 'Заявка с сайта\nИмя: %s\nТелефон: %s' % (name, phone)
    if message:
        text += '\nСообщение: ' + message
    req = urllib.request.Request(
        'https://api.telegram.org/bot%s/sendMessage' % secrets['TELEGRAM_BOT_TOKEN'],
        data=json.dumps({'chat_id': secrets['TELEGRAM_CHAT_ID'], 'text': text}).encode('utf-8'),
        headers={'Content-Type': 'application/json'})
    try:
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        return 502, {'ok': False, 'error': 'Не удалось отправить заявку. Позвоните нам напрямую.'}
    return 200, {'ok': True}


def main() -> None:
    length = int(os.environ.get('CONTENT_LENGTH') or 0)
    raw = sys.stdin.read(length)
    data = {}
    try:
        data = json.loads(raw)
    except ValueError:
        data = {k: v[0] for k, v in parse_qs(raw).items()}
    code, payload = handle(data if isinstance(data, dict) else {}, _secrets())
    out(code, payload)


if __name__ == '__main__':
    main()
```

- [ ] **Шаг 2: `site/public/.htaccess`**

```apache
AddHandler cgi-script .py
Options +ExecCGI
DirectoryIndex index.html
```

- [ ] **Шаг 3: Локальный тест логики** (без сети и CGI-сервера; покрывает honeypot — Review Focus п.1, честный 502 — п.2, лимит 429):

```bash
cd /Users/mac/Documents/_Projects/SSQ-site
python3 - <<'PY'
import importlib.util, os
spec = importlib.util.spec_from_file_location('contact', 'site/public/cgi-bin/contact.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
os.environ['REMOTE_ADDR'] = 'test-ip'
s = {'TELEGRAM_BOT_TOKEN': 'dummy', 'TELEGRAM_CHAT_ID': 'dummy', 'FORM_RATE_LIMIT_PER_HOUR': '10'}
assert m.handle({'website': 'x'}, s) == (200, {'ok': True})                       # honeypot: успех без доставки
assert m.handle({'name': 'И', 'phone': '+7 900 111-22-33', 'consent': 'yes'}, s)[0] == 400
assert m.handle({'name': 'Иван', 'phone': '1', 'consent': 'yes'}, s)[0] == 400
assert m.handle({'name': 'Иван', 'phone': '', 'consent': 'yes'}, s)[0] == 400
assert m.handle({'name': 'Иван', 'phone': '+7 900 111-22-33', 'consent': 'no'}, s)[0] == 400
for i in range(11):  # 11-я отправка в пределах часа — 429 (лимит 10)
    code, _ = m.handle({'name': 'Иван', 'phone': '+7 900 111-22-33', 'consent': 'yes'}, s)
assert code == 429, code
code, payload = m.handle({'name': 'Иван Тест', 'phone': '+7 999 123-45-67', 'consent': 'yes'}, s)
assert code == 502 and payload['ok'] is False   # dummy-токен = честный отказ, никогда не "ok"
os.system('rm -f /tmp/ssq-$(echo -n test-ip | md5 -q 2>/dev/null || true >/dev/null); true')
print('CGI logic OK')
PY
```

Expected: `CGI logic OK`, все assert прошли. (Файл-счётчик `/tmp/ssq-…` — мусор от теста; при повторе теста окно часа учесть или сменить `REMOTE_ADDR`.)

- [ ] **Шаг 4: Права на исполнение и коммит**

```bash
chmod +x site/public/cgi-bin/contact.py
git add site/public/cgi-bin/contact.py site/public/.htaccess && git commit -m "feat: CGI-эндпоинт формы (Python stdlib) с honeypot, rate limit и Telegram" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

- [ ] **Шаг 5: CGI-связка с Apache — проверить на Beget** до основного выката: в панели/по SSH положить на тестовый каталог (`test.smart-square.ru` или `/check-form/`) `cgi-bin/contact.py` + `.htaccess`, curl на `POST https://…/cgi-bin/contact.py` — вернуть 200/4xx по контракту. Если `.py` не исполняется — в панели Beget включить поддержку CGI (`/usr/bin/env python3` может не резолвиться → shebang заменить на фактический путь python3 с хостинга, узнать `which python3`). Итог проверить в `docs/deploy-runbook.md` (Task 11).
### Task 8: Юридические страницы и 404

**Files:**
- Create: `site/src/pages/legal/privacy.astro`, `site/src/pages/legal/terms.astro` (роут `/legal/terms/`), `site/src/pages/404.astro`

- [ ] **Шаг 1: `/legal/privacy/`** — текст политики: оператор — ИП (заглушки `⏳ ФИО / ИНН / ОГРНИП` прямо в тексте страницы, заменить при наличии); собираем (имя, телефон, комментарий), цель (связь по заявке), основание — согласие, срок (до отзыва), правa субъекта, контакты оператора (site.json email). Плюс заметка вверху «ЧЕРНОВИК: реквизиты ИП в процессе оформления» — удаляется владельцем. Структура — обычный контент, стилистика типографики из глобальных токенов.
- [ ] **Шаг 2: `/legal/terms/`** — условия: договор на каждый объект, предоплата по этапам, гарантия 3 года, порядок приёмки. Формулировки — черновик, помеченный вверху тем же «ЧЕРНОВИК».
- [ ] **Шаг 3: 404.astro** — «Страница не найдена», ссылки: услуги, работы, контакты.
- [ ] **Шаг 4: Сборка + коммит** — `npx astro build`; в build 404 генерируется автоматически.

```bash
git add -A && git commit -m "feat: политика ПДн, условия, 404" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 9: Портфолио, о компании, отзывы

**Files:**
- Create: `site/src/pages/portfolio/index.astro`, `site/src/pages/portfolio/[slug].astro`, `site/src/components/react/PortfolioFilter.tsx`, `site/src/pages/about/index.astro`, `site/src/pages/reviews/index.astro`
- Create: `site/src/content/portfolio/README.md` (пояснение формата кейса)

**Interfaces:**
- Consumes: коллекция `portfolio` (Task 4, шаг 1), `getLines`, `getReviews`, копирайт `docs/about.md`.

- [ ] **Шаг 1: `PortfolioFilter.tsx`** (остров, показывается только при наличии кейсов; при пустой коллекции страница рендерит сообщение-пустоту):

```tsx
import { useState } from 'react';

export default function PortfolioFilter({ lines, items }: {
  lines: { slug: string; title: string }[];
  items: { href: string; title: string; summary: string; line: string; date: string }[];
}) {
  const [filter, setFilter] = useState('all');
  const shown = items.filter((i) => filter === 'all' || i.line === filter);
  return (
    <>
      <div className="flex flex-wrap gap-2 font-mono text-xs uppercase tracking-wide">
        <button onClick={() => setFilter('all')} className={filter === 'all' ? 'text-accent' : 'text-text-muted'}>Все</button>
        {lines.map((l) => (
          <button key={l.slug} onClick={() => setFilter(l.slug)} className={filter === l.slug ? 'text-accent' : 'text-text-muted'}>{l.title}</button>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {shown.map((i) => (
          <a key={i.href} href={i.href} className="block border-l-[3px] border-accent bg-surface p-5">
            <h3 className="font-display text-lg">{i.title}</h3>
            <p className="mt-2 text-sm text-text-muted">{i.summary}</p>
          </a>
        ))}
      </div>
      {shown.length === 0 && <p className="mt-6 text-sm text-text-muted">В этом направлении пока нет опубликованных кейсов.</p>}
    </>
  );
}
```

- [ ] **Шаг 2: `/portfolio/index.astro` и `/portfolio/[slug].astro`**

`site/src/pages/portfolio/index.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PageHeader from '../../components/PageHeader.astro';
import PortfolioFilter from '../../components/react/PortfolioFilter';
import { getLines } from '../../lib/data';
import { getCollection } from 'astro:content';
const lines = getLines();
const entries = (await getCollection('portfolio')).filter((e) => e.data.published)
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
const items = entries.map((e) => ({
  href: `/portfolio/${e.id}/`,
  title: e.data.title,
  summary: e.data.summary,
  line: e.data.line,
  date: e.data.date.toISOString(),
}));
---
<BaseLayout title="Работы" description="Кейсы: электромонтаж и умный дом — фото, решения, сроки.">
  <PageHeader title="Работы" subtitle="Кейсы документируем с первого объекта — фото, решения, сроки." />
  <div class="mx-auto max-w-5xl px-5 py-10">
    {items.length === 0 ? (
      <p class="text-sm text-text-muted">Первые кейсы появятся вместе с первыми объектами. Мы снимаем на камеру каждый скрытый этап — их и покажем.</p>
    ) : (
      <PortfolioFilter client:load lines={lines.map(({ slug, title }) => ({ slug, title }))} items={items} />
    )}
  </div>
</BaseLayout>
```

`site/src/pages/portfolio/[slug].astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PageHeader from '../../components/PageHeader.astro';
import { getCollection } from 'astro:content';
import { getLine, getSite } from '../../lib/data';

export async function getStaticPaths() {
  const entries = (await getCollection('portfolio')).filter((e) => e.data.published);
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}
const { entry } = Astro.props;
const line = getLine(entry.data.line);
const site = getSite();
const { Content } = await entry.render();
---
<BaseLayout title={entry.data.title} description={entry.data.summary}>
  <PageHeader title={entry.data.title} subtitle={line?.title} />
  <div class="mx-auto max-w-3xl px-5 py-10">
    {entry.data.photos?.map((src) => <img src={src} alt="" class="mt-4 w-full" loading="lazy" />)}
    <article class="mt-6 text-sm leading-relaxed text-text-muted not-prose"><Content /></article>
    <a href="/contacts/" class="mt-8 inline-block bg-accent px-5 py-3 text-sm font-semibold text-accent-contrast">Обсудить похожий объект →</a>
  </div>
</BaseLayout>
```
- [ ] **Шаг 3: `/about/`** — текст из `docs/about.md`: главная мысль «новая инженерная компания…», стандарты (Standards.astro уже есть — переиспользовать), предложение «почему вас должно хватать», «работаем с 2026». Без счётчиков.
- [ ] **Шаг 4: `/reviews/`** — пустой (reviews.json пуст) → «Отзывы появятся с первыми объектами»; данные → карточки.
- [ ] **Шаг 5: Проверка Review Focus п.3** — открыть `/portfolio/`, `/reviews/`, главную: пустые данные → сообщения, а не пустое; блоки с главной не рендерятся.
- [ ] **Шаг 6: Коммит**

```bash
git add -A && git commit -m "feat: портфолио с фильтром, о компании, отзывы, пустые-состояния" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 10: SEO-обвязка

**Files:**
- Modify: `site/astro.config.mjs` (интеграция sitemap), `site/src/layouts/BaseLayout.astro` (OG-теги, JSON-LD хук)
- Create: `site/public/robots.txt`, `site/src/components/Seo.astro`, `site/src/components/JsonLd.astro`, `site/public/og-default.svg`

- [ ] **Шаг 1: Sitemap** — `npm install @astrojs/sitemap`; в конфиг `integrations: [sitemap()]`; `robots.txt`: `User-agent: *` `Allow: /` `Sitemap: https://smart-square.ru/sitemap-index.xml` + `Disallow: /cgi-bin/`.
- [ ] **Шаг 2: Seo.astro** — OG-теги (og:title, og:description, og:url, og:image = `/og-default.svg`, og:type) — в `<head>`, вызывается из BaseLayout (описание уже есть, добавить теги).
- [ ] **Шаг 3: `og-default.svg`** — простая графика: фон #101014, монограмма `SSQ //`, медная линия; 1200×630.
- [ ] **Шаг 4: JsonLd.astro** — JSON-LD `LocalBusiness` на главной (name «Умный квадрат», url, telephone, address из site.json, openingHours) и `Service` на страницах направлений (`/services/[line]/`). Встраивание: `<script type="application/ld+json" set:html={JSON.stringify(schema)} />`.
- [ ] **Шаг 5: Сборка и проверка** — `npx astro build`: `dist/sitemap-index.xml` и `robots.txt` на месте; валидатор schema.org (https://validator.schema.org — вручную открыть `dist/index.html`) — 0 ошибок.
- [ ] **Шаг 6: Коммит**

```bash
git add -A && git commit -m "feat: sitemap, robots, OG, JSON-LD LocalBusiness/Service" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 11: Деплой

**Files:**
- Create: `deploy.sh` (корень репо), `docs/deploy-runbook.md`

- [ ] **Шаг 1: deploy.sh** — полный код:

```bash
#!/usr/bin/env bash
# Деплой статики на Beget Shared. Заполнить три переменные один раз.
set -euo pipefail
SSH_USER="CHANGE_ME"                       # логин Beget
SSH_HOST="CHANGE_ME"                       # host, обычно логин.beget.tech
REMOTE="/home/${SSH_USER}/smart-square.ru/public_html"

cd "$(dirname "$0")/site"
npm ci
npm run build

ts=$(date +%Y%m%d-%H%M%S)
# откат: перед выкатом старое содержимое складывается в удалённый ~/releases/backup-<ts>
rsync -az --delete \
  --backup --backup-dir="/home/${SSH_USER}/releases/backup-${ts}" \
  dist/ "${SSH_USER}@${SSH_HOST}:${REMOTE}/"
echo "Deployed ${ts}. Откат: rsync -az --delete ${SSH_USER}@$SSH_HOST:~/releases/backup-${ts}/ ${REMOTE}/"
```

- [ ] **Шаг 2: Секреты на сервере** — по SSH на Beget: создать `/home/<user>/.env-ssq` (вне docroot, чтобы rsync `--delete` не мог снести) и вставить реальные `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `FORM_RATE_LIMIT_PER_HOUR`; `contact.py` читает этот файл автоматически (см. `_secrets()` в Task 7). Проверить права: `chmod 600 .env-ssq`.
- [ ] **Шаг 3: GitHub** — владелец создаёт приватный репо `ssq-site`; локально:

```bash
git remote add origin git@github.com:<user>/ssq-site.git
git push -u origin main
```

(выполняется владельцем или агент после передачи токена; проверить, что в истории нет `.env` — `git log --all --full-history -- .env` пуст.)
- [ ] **Шаг 4: Beget** — в панели: домен smart-square.ru → docroot public_html; smart-sq.ru → направить 301 на `https://smart-square.ru` (панель «Перенаправления», код 301, с сохранением пути); CGI для `.py` — включить (если панель не позволяет — связку проверить по шагу 5 Task 7); SSH — включен.
- [ ] **Шаг 5: Первый выкат** — `bash deploy.sh`; открыть `https://smart-square.ru` — главная; форма → реальная заявка в Telegram (шаг 3 test-case.md); `https://smart-sq.ru/services/` → 301 на `https://smart-square.ru/services/`.
- [ ] **Шаг 6: Приёмка** — по test-case.md «Шаг 10» полностью; при успехе — отметить пункты в plan.md и записать фактический путь деплоя в `docs/deploy-runbook.md` (файл с 3 разделами: как выкатить, как откатить, где секреты).
- [ ] **Шаг 7: Коммит**

```bash
git add deploy.sh docs/deploy-runbook.md && git commit -m "feat: деплой на Beget (rsync + rollback-runbook)" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 12: Финальная приёмка первого релиза

**Files:** без кодовых изменений; обновления — `docs/handoff.md`, `docs/plan.md` (статусы).

- [ ] **Шаг 1: Полный чек-лист qa.md** — все пункты, отмечать ✅/❌ прямо в тексте test-case.md в конце каждой секции (черновик-отметки, не правки правил).
- [ ] **Шаг 2: Автоматические проверки** — `npm run format:check && npm test && npx astro build` — зелёные.
- [ ] **Шаг 3: UI-приёмка через Playwright** (рутину вместо рук; «увидеть глазами» — финальные снапшоты остаются владельцу):

1. `python3 -m http.server -d site/dist 8800` — сервер дист-сборки.
2. `browser_navigate` на `/`, `browser_resize` 400×800 → `browser_evaluate` `document.documentElement.scrollWidth <= window.innerWidth` — true (нет h-скролла).
3. Прогнать `/services/elektromontazh/`, `/pricing/`, `/portfolio/`, `/contacts/` — все 200, навигация по ссылкам в снапшоте существует.
4. Форма: `browser_fill_form` (имя/телефон/чекбокс) → `browser_click` «Отправить» → статус «Сервис недоступен…» (эндпоинта в `http.server` нет) — проверяется именно error-ветка, не молчание.
5. FAQ: `browser_click` на `<summary>` → ответ появляется (details раскрывается).
6. `browser_take_screenshot` главной и `/pricing/` (владельцу на «увидеть глазами»).
- [ ] **Шаг 4: Security-скан перед релизом** — invoke `claude-security:claude-security` (скан `site/` + `contact.py`): фокус — секреты (не в git/дисте), honeypot/rate-limit-эротия, заголовки эндпоинта, XSS-поверхность MDX. Результат — короткий отчёт; все CONFIRMED-находки исправить до релиза, помеченные вердикты — в handoff.
- [ ] **Шаг 5: handoff.md** — переписать секцию «Состояние»: первый релиз собран и выкачен; следующие шаги — фото (шаг 11), блог, калькулятор, реквизиты ИП в политике, реальные тексты.
- [ ] **Шаг 6: Финальный коммит**

```bash
git add -A && git commit -m "chore: приёмка первого релиза, обновление документации" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```