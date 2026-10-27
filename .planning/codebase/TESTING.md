---
last_mapped_commit: 01a325d92ff12c345fd40ed162ac2b26f83cc6c2
last_mapped_at: 2026-10-27
---
# Testing Patterns

**Analysis Date:** 2026-10-27

## Test Framework

**No unit-test runner for JS/TS** — no vitest/jest config in the repo (vitest упомянут в скилле как будущий гейт, инфраструктуры ещё нет).
Виды тестов:
- **ESM-контракт формы** — Playwright (`site/e2e/form.spec.ts`).
- **Серверный CGI-контракт** — Python stdlib `unittest` (`site/tests/test_contact.py`).

**Runner (E2E):**
- `@playwright/test` ^1.64.1
- Config: `site/playwright.config.ts`

**Run Commands** (`site/package.json`):
```bash
npm run test:e2e      # Playwright: build + preview + прогон spec'ов
npm run test:server   # PYTHONDONTWRITEBYTECODE=1 python3 tests/test_contact.py
npm run lint          # ESLint (гейт качества)
npm run check         # astro check (типы, гейт)
```

## Playwright Config (`site/playwright.config.ts`)

- `testDir: "./e2e"`, `fullyParallel: true`, `retries: 0`
- Projects: только `chromium` (Desktop Chrome)
- `trace: "on-first-retry"`, `screenshot: "only-on-failure"`
- Reporter: `list` + `html` → `../tmp/playwright-report`
- `webServer`: `npm run build && npm run preview` на `http://localhost:4321`, `reuseExistingServer: true`, timeout 120s — продакшен-подобный статический прогон, включая `public/cgi-bin` как раздаваемую статику.

## Test File Organization

**Location:** отдельно от исходников — `site/e2e/` для Playwright, `site/tests/` для Python. Не co-located.

**Naming:** `<domain>.spec.ts` ( Playwright), `test_<module>.py` (Python).

**Structure:**
```
site/
├── e2e/form.spec.ts      # E2E: контракт формы (test-first, «красные до реализации»)
└── tests/test_contact.py # серверные unittest: honeypot, rate-limit, delivery, validation
```

## Test Structure

**Playwright suite (`site/e2e/form.spec.ts`, 211 строк):**
- Файл открывается contract-блоком: источник требований (docs/architecture.md, спека §6.1, qa.md) и зафиксированные решения спецификации (селекторы по accessible-именам, `aria-invalid`, `role="status"`).
- Фикстуры-данные как константы верхнего уровня: `FORM_URL`, `SUBMIT_PATH`, `VALID`, `VALID_PHONE_FORMATS`, `INVALID_PHONE_FORMATS`.
- Helper-функции: `fillForm(page, data, agree)`, `submit(page)`, `spyContactEndpoint(page, response?)`.

**Python suite (`site/tests/test_contact.py`, 281 строка, unittest):**
- Наследование от базового `EndpointTestCase` (свежий rate-каталог в `setUp` + `addCleanup(shutil.rmtree)`, шпион-доставка `self.delivered`).
- Группировка тест-классами по сквозному поведению: `HoneypotTest`, `RateLimitTest`, `DeliveryFailureTest`, `ValidationTest`.
- Загрузка тестируемого модуля: `importlib.util.spec_from_file_location("contact", CONTACT_PY)` — прямо из deploy-артефакта `public/cgi-bin/contact.py`, без копий.
- `sys.dont_write_bytecode = True` — не оставлять `__pycache__` рядом с артефактом.

## Mocking

**Playwright — `page.route`-шпион:**
```typescript
// site/e2e/form.spec.ts — spyContactEndpoint
page.route(`**${SUBMIT_PATH}*`, async (route) => {
  requests.push({ url, json: req.postDataJSON(), text });
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
});
```
Сеть к CGI подменяется на мок; собирают тело POST-запросов для assertions на контракт payload'а.

**Python — инъекция зависимостей вместо monkeypatching сети:**
- `contact.handle(environ, stdin, deliver=self.deliver, rate_dir=self.rate_dir)` — доставка подменяется шпионом-колбеком, rate-каталог — временный каталог.
- `unittest.mock.patch` на `contact.urlopen` — только там, где нужен сценарий отказа сети (класс `DeliveryFailureTest`).
- Секреты в тестах — фиктивные env (`TELEGRAM_BOT_TOKEN: "test-token"` в `make_environ`) — реальные сети и секреты никогда не трогаются.

**What to Mock:** CGI-эндпоинт в E2E (изолировать клиентский контракт); доставку в Telegram и файловую систему rate-limit'а в серверных тестах.

**What NOT to Mock:** разметку формы и тексты лейблов — это часть контракта; нормализацию телефона (сервер и клиент обязаны совпадать — покрыто обеими сторонами).

## Fixtures and Factories

**Test Data:** константы верхнего уровня рядом с тестами — `VALID_PAYLOAD` / `make_environ` (`site/tests/test_contact.py`), `VALID` / массивы форматов телефона (`site/e2e/form.spec.ts`). Отдельных каталогов фикстур нет.

## Coverage

**Requirements:** None enforced (нет coverage-инструмента). Гейты качества вместо coverage: `npm run lint`, `npm run check`, `npm run build`, e2e + server-тесты, чек-лист qa.md.

**View Coverage:** недоступно.

## Test Types

**Unit / Server-integration (`site/tests/test_contact.py`):** валидация полей, объединение ошибок, альтернативные форматы телефона, honeypot-маскировка, rate-limit (окно, per-IP по `X-Forwarded-For`, конфигурируемость), ошибки доставки → 502, GET/пустое тело/malformed JSON → дружелюбный 400.

**E2E (`site/e2e/form.spec.ts`):** рендер всех полей формы, клиентская валидация (`aria-invalid`), тела POST-запросов, success-состояние (`role="status"`), honeypot присутствует и скрыт. Серверные сценарии в E2E не проверяются.

**Smoke/прогон сайта:** `npm run build && npm run preview` — все страницы карты маршрутов, оформленный 404, отсутствие горизонтального скролла на ~400px (ручной чек-лист qa.md).

**E2E-юнит для zod-схем:** «Not yet» — vitest запланирован скиллом (гейт при правках `src/lib/`, `src/data/`), инфраструктура не создана.

## Common Patterns

**Async Testing (Playwright):** везде `await` на локатор-акциях; ожидание состояния через `expect(...).toBeVisible()` (auto-wait), не sleep.

**Error Testing:**
```python
# site/tests/test_contact.py — сценарий отказа, маскировки, невалидных данных
with mock.patch.object(contact, "urlopen", side_effect=...):
    status, payload = self.call(...)
self.assertEqual(status, 502)
```
```typescript
// site/e2e/form.spec.ts — spyContactEndpoint(page, { status: 500, body: { ok: false, error: "..." } })
```

**Rule:** новый сценарий формы — сначала тест в `form.spec.ts` (test-first контракт), затем реализация в `ContactForm.astro` / `contact.py`.

---

*Testing analysis: 2026-10-27*
