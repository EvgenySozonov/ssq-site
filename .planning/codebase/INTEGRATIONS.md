---
last_mapped_commit: 01a325d92ff12c345fd40ed162ac2b26f83cc6c2
last_mapped_at: 2026-10-27
---
# External Integrations

**Analysis Date:** 2026-10-27

## APIs & External Services

**Telegram Bot API (единственная внешняя интеграция):**
- Назначение: доставка заявок с формы на `/contacts/` в чат компании
- Реализация: `site/public/cgi-bin/contact.py` — вызов `https://api.telegram.org/bot{token}/sendMessage` через `urllib.request` (stdlib), таймаут `SEND_TIMEOUT_S = 5`
- Auth: `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` — env-переменные процессов CGI; приоритет env, иначе чтение файла секретов по пути из `SSQ_ENV_PATH` (`.env-ssq` на сервере Beget, конфигурируется вручную, rsync не трогает — `contact.py:112-130`)
- Сценарий: POST `/cgi-bin/contact.py` (JSON или form-encoded) → валидация (имя, нормализация телефона до `7XXXXXXXXXX`, honeypot-поле `website`, `agree`) → sendMessage. Honeypot заполнен → маскированный успех 200 `{ok:true}` без доставки; лимит/валидация → 400 `{ok:false, error}`; отказ доставки/нет секретов → 502 `{ok:false}`

Клиент: `site/src/components/ContactForm.astro` — vanilla `fetch(endpoint)` на `data-endpoint` из `site/src/data/site.json` (`/cgi-bin/contact.py`).

## Data Storage

**Databases:**
- Not applicable — базы данных нет; все данные статичны в `site/src/data/site.json`

**File Storage:**
- Статика отдаётся Apache Beget из docroot (результат `astro build` → `dist/`)

**Caching:**
- Not detected

## Authentication & Identity

**Auth Provider:**
- Not detected — сайт публичный, без аутентификации пользователей

## Monitoring & Observability

**Error Tracking:**
- Not detected

**Logs:**
- stderr CGI / логи Apache Beget; специальных логов нет

## CI/CD & Deployment

**Hosting:**
- Beget Shared (Apache static + CGI)

**CI Pipeline:**
- Not detected — деплой вручную: `astro build` → rsync по SSH (`deploy.sh` по `docs/specs/ssq-site-stack-design.md`); rollback обратным rsync из `~/releases/backup-<timestamp>/`

## Environment Configuration

**Required env vars:**
- `TELEGRAM_BOT_TOKEN` — токен бота
- `TELEGRAM_CHAT_ID` — целевой чат заявок
- `SSQ_ENV_PATH` (опционально) — путь к файлу секретов на сервере
- `PYTHONDONTWRITEBYTECODE=1` — только для `npm run test:server`

**Secrets location:**
- Локально: env-переменные сессии (файлов `.env` в репо нет)
- Сервер: `.env-ssq` в недоступной-вебу директории Beget, задаётся один раз вручную

## Webhooks & Callbacks

**Incoming:**
- `POST /cgi-bin/contact.py` (`site/public/cgi-bin/contact.py`, обработчик CGI, Apache handler через `site/public/cgi-bin/.htaccess`)
- Rate limit: 10 заявок/IP/час (`DEFAULT_RATE_LIMIT = 10`, окно `RATE_WINDOW_S = 3600`, `HTTP_X_FORWARDED_FOR` учитывается)

**Outgoing:**
- Только Telegram Bot API sendMessage (см. выше)

---

*Integration audit: 2026-10-27*
