# Decisions (extracted from ADRs)

Source doc: all from `/Users/mac/Documents/_Projects/SSQ-site/docs/memory.md` (тип ADR, confidence medium, **locked=false** — ни одна запись не имеет Status=Accepted; классификатор: мульти-решенческий лог без полей Status/Context/Decision/Consequences). Записи ниже сохранены по отдельности; синтез выбора — задача роадмаппера, не этого шага.

## 2026-10-15: Старт с одностраничной визиткой на чистом HTML/CSS/JS
- source: docs/memory.md
- status: proposed
- decision: Первый этап — одностраничник без сборки/фреймворков/git; тёмный премиум, референс интерьерной студии. Статус в тексте: выполнено, сохранено как референс `example/index.html`.
- scope: референс-визитка

## 2026-10-16: Мотивация нового стека — три драйвера
- source: docs/memory.md
- status: proposed
- decision: Драйверы: реальная отправка заявок; рост до многостраничного сайта (блог, калькулятор, портфолио); скорость итераций соло-разработчиком с AI. Команда не планируется; контент ведёт владелец через git/Markdown — CMS не нужна.
- scope: обоснование выбора стека

## 2026-10-16: Работа с лидами
- source: docs/memory.md
- status: proposed
- decision: CRM нет; старт — уведомления в Telegram; эндпоинт проектируется как адаптер — при подключении amoCRM/Bitrix24 меняется только тело скрипта. Note: в записи упоминается «тело PHP-скрипта» — устаревший след до решения 2026-10-17 (CGI на Python); автосинхронизировано в INFO-конфликте.
- scope: лиды, CRM-перспектива

## 2026-10-16: Хостинг и деплой
- source: docs/memory.md
- status: proposed
- decision: Хостинг Beget Shared (SSH есть), приватный GitHub + rsync-деплой `deploy.sh`, без CI на старте. Отклонено: Vercel/Netlify/Cloudflare (западные платформы недопустимы для сайта услуг в РФ), Node-контур (Next.js fullstack на VPS) — избыточен.
- scope: хостинг, деплой

## 2026-10-16: Стек — вариант A: Astro + React-острова + TypeScript + Tailwind v4
- source: docs/memory.md
- status: proposed
- decision: Вариант A (Astro SSG + React-острова по месту + TS strict + Tailwind v4 на Beget). Отклонены: B (Next.js static export — избыточен), C (Next.js на VPS — +хостинг и обслуживание без пользы).
- scope: стек

## 2026-10-16: Сайт — многостраничный
- source: docs/memory.md
- status: proposed
- decision: Полноценный многостраничный сайт, не одностраничник; референс-визитка остаётся.
- scope: структура сайта

## 2026-10-16: Структура услуг — блоками по направлению
- source: docs/memory.md
- status: proposed
- decision: Отказ от плоского `/services/[slug]` в пользу иерархии направление → услуга; каркас строит направления циклом по `lines.json`; новая услуга = JSON, ноль кода.
- scope: роутинг услуг, модель данных

## 2026-10-16: Лид на первом экране
- source: docs/memory.md
- status: proposed
- decision: CTA первого экрана — «Бесплатный выезд для замера» (низкий порог входа); премиальность несёт дизайн.
- scope: конверсия, hero

## 2026-10-16: Дизайн-система «Ночная медь»
- source: docs/memory.md
- status: proposed
- decision: Направление «Ночная медь» (A) + инженерные акценты (нумерация, моно, бордеры из B). Акцент — медь #c9a15a. Шрифты: Lora + Manrope + JetBrains Mono (полная кириллица). Hero: full-bleed фото + градиент затемнения, градиент-фоллбек без фото. Редизайн — с нуля.
- scope: дизайн-система

## 2026-10-16: 152-ФЗ
- source: docs/memory.md
- status: proposed
- decision: Политика ПДн + чекбокс согласия обязательны до выката формы — не предмет «потом».
- scope: правовые требования

## 2026-10-17: Форма — Python CGI вместо PHP
- source: docs/memory.md
- status: proposed
- decision: Python 3 CGI на голом stdlib (Beget Shared поддерживает), без venv/ACL/restart.txt Passenger. Секреты — `/home/<user>/.env-ssq` вне docroot. Docker для проекта отложен (YAGNI), compose — когда появится второй процесс (CRM-адаптер).
- scope: форма заявок, хостинг

## 2026-10-17: C4-модель в Structurizr DSL; Docker принят для тулинга
- source: docs/memory.md
- status: proposed
- decision: Structurizr DSL + Structurizr Lite (Docker) вместо Mermaid; Docker — только C4-тулинг, dev-runtime остаётся отложенным (`compose` отдельно). Модель: `docs/architecture/c4/workspace.dsl`, 5 видов (Context, Containers, FormFlow, Production, DeployPipeline).
- scope: архитектурная документация

## 2026-10-18: Режим permissions по умолчанию
- source: docs/memory.md
- status: proposed
- decision: Политика в `.claude/settings.json`: allow — гейты качества + локальные git-операции; ask — `git push` (единственная публикующая операция); deny — доступ к `.env` и `rm -rf`. Осознанные компромиссы зафиксированы (обфускация секретов, `rm -r` без `-f`, `npm install` не в allow).
- scope: AI-среда, безопасность

## 2026-10-18: ESLint в каркасе (сразу, не «по болевому случаю»)
- source: docs/memory.md
- status: proposed
- decision: Flat config `site/eslint.config.mjs`: `@eslint/js` + typescript-eslint (recommended) + eslint-plugin-astro (+ a11y-расширения) + `@eslint-react` для островов + eslint-config-prettier; формат только Prettier. Гейт `npm run lint`. Открытый вопрос Node-версии решён тем же днём: `.nvmrc` = 24; C4-модель (Node 20) подтянуть при следующем обновлении.
- scope: качество кода, гейты

## 2026-10-18: Инструментарий качества
- source: docs/memory.md
- status: proposed
- decision: vitest — тесты lib-слоя (data.ts, format.ts, zod-схемы), TDD для lib; Playwright MCP — UI-приёмка; claude-security:scan перед каждым релизом (CONFIRMED-находки блокируют выкат); fewer-permission-prompts — allowlist операций сессии.
- scope: тестирование, гейты## Решения владельца (2026-10-27, разрешение competing variants из INGEST-CONFLICTS.md)

### DEC-lines-contract
Дословно: «Контракт lines.json — `order` (specs §4.1 + impl-plan Task 2); accentColor из architecture.md отклонён».
Контекст: две одноранговые SPEC давали расходящиеся варианты; файл ещё не существует в коде. После подтверждения правится docs/architecture.md (стр. 61), WARNING снимается.

### DEC-react-deferred
Дословно: «React вне первого релиза: калькулятор/фильтр остаются в роадмапе как будущие фазы, React-инфраструктуры в каркасе нет; docs/architecture.md + docs/memory.md правятся синхронно с этим решением».
Контекст: дрейф докс ↔ код (доки обещают React-острова, в коде их нет); решение снимает WARNING-2.
> 2026-10-28: синхронная правка доков по обоим решениям выполнена (architecture.md, memory.md, plan.md, handoff.md, specs §4.6, скилл ssq-astro-conventions); классификации переименованы по канону `{slug}-{sha256(path)8}.json` — все 14.
