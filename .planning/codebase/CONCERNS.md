---
last_mapped_commit: 01a325d92ff12c345fd40ed162ac2b26f83cc6c2
last_mapped_at: 2026-10-27
---
# Кодовые проблемы

**Analysis Date:** 2026-10-27

## Техдолг

**Незавершённый каркас сайта (критический):**
- Issue: Есть только страница `/contacts/` с формой и заглушка главной. Реального контента (услуги, о компании, тарифы, SEO-тексты) нет — сайт фактически не пригоден к публикации.
- Files: `site/src/pages/index.astro` (заглушка «Каркас собран», 7 строк), `site/src/pages/contacts.astro`, `site/src/data/site.json`
- Impact: Главная страница содержит только текст «Каркас собран» — публикация недопустима.
- Fix approach: Реализовать контентные страницы по `docs/product.md` и спеке (`docs/specs/ssq-site-stack-design.md`), данные — в `site/src/data/` (site.json, lines.json).

**Плейсхолдер-контакты в данных:**
- Issue: `site.json` содержит телефон `+7 (915) 123-45-67` и часы работы «Пн–Сб, 9:00–20:00» — явно тестовые значения; используются на всех страницах, включая форму-подтверждение.
- Files: `site/src/data/site.json`, `site/src/pages/contacts.astro`
- Impact: Публикация с фейковым телефоном = реальные заявки уходят «в никуда» (плюс CGI-пейджер IP-заглушки).
- Fix approach: Заменить значения перед деплоем; внести проверку «не-плейсхолдер» в деплой-гейты (`site/deploy.sh` если есть, скилл ssq-deploy-beget).

**Дублирование example/ и site/:**
- Issue: Референс-визитка `example/index.html` (306 строк HTML + 550 строк CSS + `example/assets/js/main.js`) дублирует функциональность, которая постепенно переносится в `site/`. Есть вложенный мусорный каталог `example/example/` (скриншоты). Также дублируются контакты: в `example/` свои, в `site/src/data/site.json` — свои.
- Files: `example/index.html`, `example/assets/css/style.css`, `site/src/components/ContactForm.astro`
- Impact: Правки в форме/контенте легко разъезжаются между двумя источниками; README (строки 32, 37, 59) признаёт, что `example/example/` и `tmp/` — мусор.
- Fix approach: Не редактировать example/ — считать его read-only референсом; при полном порте удалить (по согласованию, т.к. правило «не удалять файлы»).

**Дублирование документации (docs/ vs README):**
- Issue: README.md дублирует раздел «Стек» и «Запуск» из `docs/specs/ssq-site-stack-design.md`, `docs/architecture.md`, `docs/product.md`. Декларировано «README первичен», но README короткий (69 строк) и отсылает к docs — риск расхождений при обновлениях.
- Files: `README.md`, `docs/specs/ssq-site-stack-design.md`, `docs/architecture.md`, `CLAUDE.md`
- Impact: Устаревание одних документов при обновлении других; AI-агенты читают разные источники.
- Fix approach: Соблюсти правило CLAUDE.md «README первичен»; в README — только указатели, деталь — в docs/.

**Собранный артефакт dist/ и test-results/ в рабочем дереве:**
- Issue: `site/dist/` (сборочный артефакт, включая копию `cgi-bin/contact.py`) и `site/test-results/` лежат в дереве. Проверить, коммитятся ли они (git ls-files не показал `site/dist` — вероятно, в .gitignore, но физически присутствуют).
- Files: `site/dist/`, `site/test-results/`
- Impact: Риск выката устаревшего `dist/cgi-bin/contact.py` вместо актуального.
- Fix approach: Всегда перегенерировать `astro build` перед rsync (уже заложено в скилле ssq-deploy-beget).

## Известные баги

Явных задокументированных багов в коде не обнаружено. Потенциальные поведенческие проблемы — см. «Хрупкие зоны» ниже.

## Вопросы безопасности

**CGI rate-limit обходим через заголовок X-Forwarded-For (риск — средний/высокий):**
- Risk: `client_ip()` берёт первую часть `HTTP_X_FORWARDED_FOR` без проверки доверенного прокси. На Beget Shared заголовок может прислать любой клиент напрямую или через цепочку.
- Files: `site/public/cgi-bin/contact.py:78-81`
- Current mitigation: Частично — реальный прокси Beget тоже может добавлять/перезаписывать `X-Forwarded-For`; лимит 10/час и honeypot снижают вред.
- Recommendations: Убедиться, что на фронте Apache/nginx Beget всегда перезаписывает `XFF`, а не аппендит; в противном случае использовать `REMOTE_ADDR`. Тест `site/tests/test_contact.py` отправляет XFF как основной IP — это фиксирует текущее поведение, нужно осознанно выбрать одно из двух.

**Нет валидации Origin/Referer (CSRF/спуфинг POST):**
- Risk: POST принимается с любого origin. Атака: спуфинг заявок через rate-лимит по подменяемому XFF — лимит обнулится на другой IP, спам в Telegram через лимит токенов бота.
- Files: `site/public/cgi-bin/contact.py:158-193` (handle), `site/src/components/ContactForm.astro:250` (fetch с того же origin)
- Current mitigation: honeypot + rate limit (мягкие).
- Recommendations: Добавить серверную проверку `HTTP_ORIGIN`/`HTTP_REFERER` на ожидаемый домен; дешёво на чистой stdlib.

**Отправка нефильтрованного пользовательского текста в Telegram:**
- Risk: `name`, `phone`, `comment` летят в Telegram без экранирования/ограничения длины. Telegram SendMessage ограничен 4096 символами; длинный comment может вернуть 400 от Telegram API → обработается как отказ доставки (402), но спам-комментарии уйдут в чат.
- Files: `site/public/cgi-bin/contact.py:145-153` (build_message), `contact.py:52` (phone-нормализация, name/comment — без ограничения длины)
- Current mitigation: Только валидация обязательности name и формата phone. Comment не ограничен даже на клиенте (`site/src/components/ContactForm.astro` — проверять `maxlength`).
- Recommendations: Ввести `max` длины на уровне CGI (name ≤ 100, comment ≤ 1000) и `maxlength` на клиенте; нормализовать пустой payload.

**Rate limit молча отклоняется при отсутствии /tmp:**
- Risk: При недоступности/полном /tmp лимит исчезает (`except OSError: pass`), принимается любое количество заявок. Это осознанное решение (комментарий в `contact.py:108`), но на Beget Shared /tmp общий для процессов.
- Files: `site/public/cgi-bin/contact.py:91-110`
- Recommendations: Задокументировать в деплой-гейтах, рассмотреть файловый счётчик вне /tmp как fallback.

**Секреты:**
- Risk: `.env` в корне содержит токены (файл присутствует; содержимое не читалось по правилам). Он в `.gitignore` (проверено — `git check-ignore .env` подтверждает), но физически в docroot проекта.
- Files: `.env` (существование подтверждено), `.env.example`, `site/public/cgi-bin/contact.py:114-130`
- Current mitigation: `.env` игнорируется git-ом; прод-секреты на Beget — в `~/.env-ssq` вне docroot (правило в `.claude/rules/deploy-secrets.md`); secret-файлы читаются только по пути `SSQ_ENV_PATH`.
- Recommendations: Убедиться, что в tar/rsync-выкат `.env` не включается (`deploy.sh` — проверить гейты). Не читать `.env` в чате даже «для проверки».

## Слабые места (Fragile areas)

**Тонкая связка form UI ↔ CGI-контракт:**
- Files: `site/src/components/ContactForm.astro:231-285`, `site/public/cgi-bin/contact.py:37-75`
- Why fragile: Honeypot-поле `website`, нормализация телефона (двойная — клиент и сервер, «единственная истина — серверная», комментарий `contact.py:49-50`), тексты ошибок дублируются (консент-текст повторяется слово в слово в `ContactForm.astro:239` и `contact.py:74`). Изменение структуры payload ломает обе стороны, типизации нет (JSON руками).
- Safe modification: Менять только при открытом контракте `docs/specs/ssq-site-stack-design.md §6.2`; после правок — полный чек-лист «Форма» из `docs/qa.md`.
- Test coverage: Хорошо покрыто с серверной стороны (`site/tests/test_contact.py`, 281 строк unittest) и e2e (`site/e2e/form.spec.ts`, 211 строк Playwright) — слабое место только в дублировании текстов и рассинхроне нормализации.

**Python-CGI без зависимостей на голой stdlib:**
- Files: `site/public/cgi-bin/contact.py`
- Why fragile: Голый CGI — один процесс на запрос; отсутствует CSRF, отсутствие retry, `urllib.request.urlopen` — синхронный; сбой Telegram API на 5 секунд таймаута (`SEND_TIMEOUT_S = 5`) уже вернёт 502. `main()` использует `__import__("sys")` на месте (`contact.py:208`) — нетипично и легко сломать при рефакторинге.
- Safe modification: Не трогать «чистую функцию handle()» без прогонов `python3 tests/test_contact.py`. Хрупкость — в мутабельной глобальной подмене deliver для тестов.

**Скрипт формы — инлайн `<script>` в .astro:**
- Files: `site/src/components/ContactForm.astro:130-287`
- Why fragile: ~160 строк ванильного JS без типизации/тестов — проверяется только вручную и через e2e. Логика «валидаторы под каждым полем» размазана по хендлеру `input/submit`.
- Safe modification: Правки валидации проверять e2e; любые структурные правки — только с полным прогоном `npm run lint && npm run check && astro build`.

## Масштабирование

- Rate limit: файловый счётчик в `/tmp` (`site/public/cgi-bin/contact.py:86-109`) — работает только в одном файле, без распределённых гонок; достаточно для одного сервера и «10 заявок в час с IP», но не для пула процессов (Beget Shared — обычно один Apache, гонки возможны, но некритичны).
- Telegram Bot API: без очереди и retry — при недоступности API Telegram заявка теряется для клиента (502, клиенту предлагается перезвонить). При росте потока заявок это главный лимит.
- Хостинг: Beget Shared — 1 CPU, общий CGI. Форма несёт минимум логики — производительности достаточно для текущей нагрузки.

## Зависимости под угрозой

- Python на Beget Shared: любой доступный interpreter (обычно 3.x, без возможности выбрать версию через venv CGI) — код написан под 3.7+ (f-strings, `from __future__ import annotations`). Риск минимален, но тесты не прогоняются на хостинге.
- React-острова пока не используются: в `site/src/pages/index.astro` и `site/src/pages/contacts.astro` — только `.astro`. Если появятся острова — новый класс рисков (гидрация, типизация Props), которого сейчас нет.
- Playwright для e2e (`site/tests/test_contact.py`, `site/e2e/form.spec.ts`) — работает локально, CI нет (не выявлено CI-конфигов) — регрессии ловятся руками.

## Отсутствующие компоненты

**Полная реализация сайта:**
- Problem: `site/src/pages/index.astro` — заглушка; нет страницы услуг, «О компании», метаданных SEO, данных каталога (lines.json заявлен в стектек, но не создан).
- Blocks: Публикация, деплой-гейты «продукт готов», SEO.

**CI-конфиги:**
- Problem: нет workflow для Astro-гейтов / Python-тестов.
- Blocks: Автоматическое подтверждение регрессий после PR; всё проверяется руками (`npm run lint && npm run check && astro build` + `python3 tests/test_contact.py`).

## Дефекты покрытия тестами

**Клиентская JS-логика формы вне e2e:**
- What's not tested: unit-слоя для нормализации телефона и текстов валидации в `ContactForm.astro` нет; только e2e через Playwright.
- Files: `site/src/components/ContactForm.astro:130-287`
- Risk: Рассинхрон нормализации «клиент vs сервер» может быть замечен только в бою.
- Priority: Низкая (e2e + серверные тесты частично покрывают).

**Deploy-процесс:**
- What's not tested: гейты деплоя (Beget rsync, секреты) не автоматизированы тестом — зависят от скилла ssq-deploy-beget.
- Files: `docs/qa.md` (чек-лист «Форма» — ручной), `README.md`
- Risk: Деплой-ошибки (выкат старого dist, захват `.env`) ловятся человеком.
- Priority: Средняя.

---

*Инспекция проблем: 2026-10-27*
