#!/usr/bin/env python3
"""CGI-эндпоинт формы заявок SSQ-site. Python 3, только stdlib (голый CGI, не Passenger).

Контракт: docs/specs/ssq-site-stack-design.md §6.2, docs/architecture.md «Форма и заявки».
Серверные испытания контракта (unittest, сеть не трогается): site/tests/test_contact.py.

Логика: POST (JSON или form-encoded) → валидация → доставка в Telegram Bot API.
- Honeypot заполнен → маскированный успех (200 {ok:true}), заявка не доставляется.
- Нарушение лимита / валидации → 400 {ok:false, error: «...»} — текст русский, дружелюбный.
- Отказ доставки (в т.ч. нет секретов, таймаут) → 502 {ok:false}. Тихой потери заявки нет.
"""

from __future__ import annotations

import hashlib
import json
import os
import time
import urllib.parse
import urllib.request
from typing import Callable, Dict, Optional, Tuple, Union

SEND_TIMEOUT_S = 5
RATE_WINDOW_S = 3600
DEFAULT_RATE_LIMIT = 10

DeliverFn = Callable[[Optional[str], Optional[str], str], None]


# ── Чтение и разбор заявки ───────────────────────────────────────────────────

def read_body(environ: Dict[str, str], stdin) -> str:
    length = int(environ.get("CONTENT_LENGTH") or 0)
    return stdin.read(length).decode("utf-8", errors="replace") if length > 0 else ""


def parse_payload(raw_form: str, content_type: str) -> Dict[str, Union[str, bool]]:
    if "application/json" in content_type:
        return _as_payload(json.loads(raw_form))
    fields = urllib.parse.parse_qs(raw_form)
    return _as_payload({key: values[0] for key, values in fields.items()})


def _as_payload(raw: dict) -> Dict[str, Union[str, bool]]:
    agree = raw.get("agree", False)
    if isinstance(agree, str):
        agree = agree.strip().lower() in ("true", "1", "on", "yes", "да")
    phone = str(raw.get("phone") or "")
    # Серверная нормализация — единственная истина для доставки, как и на клиенте:
    # +7 (999) 123-45-67 | +79991234567 | 8 999 123-45-67 → 7XXXXXXXXXX
    digits = "".join(ch for ch in phone if ch.isdigit())
    normalized_phone = ("7" + digits[1:]) if len(digits) == 11 and digits[0] == "8" else digits
    return {
        "name": str(raw.get("name") or "").strip(),
        "phone": phone if not normalized_phone else normalized_phone,  # валидируем по нормализованному
        "comment": str(raw.get("comment") or ""),
        "website": str(raw.get("website") or ""),
        "agree": bool(agree),
        "_phone_digits": normalized_phone,
    }


def is_ru_phone(digits: str) -> bool:
    return len(digits) == 11 and digits[0] == "7"


def validation_error(payload: Dict[str, Union[str, bool]]) -> Optional[str]:
    errors = []
    if not payload["name"]:
        errors.append("Укажите имя — так мы поймём, как к вам обращаться")
    if not is_ru_phone(str(payload["_phone_digits"])):
        errors.append("Проверьте номер телефона — похоже, есть опечатка")
    if not payload["agree"]:
        errors.append("Без согласия на обработку персональных данных заявка не может быть отправлена")
    return "; ".join(errors) if errors else None


def client_ip(environ: Dict[str, str]) -> str:
    forwarded = environ.get("HTTP_X_FORWARDED_FOR") or ""
    first = forwarded.split(",")[0].strip()
    return first or environ.get("REMOTE_ADDR") or "unknown"


# ── Rate limit: счётчик в /tmp, окно 1 час ───────────────────────────────────

def rate_file_path(ip: str, rate_dir: str) -> str:
    digest = hashlib.md5(ip.encode("utf-8")).hexdigest()  # noqa: S324 — не криптография
    return os.path.join(rate_dir, f"ssq-form-rl-{digest}.json")


def rate_limit_exceeded(ip: str, limit: int, rate_dir: str, now: Optional[float] = None) -> bool:
    now = time.time() if now is None else now
    path = rate_file_path(ip, rate_dir)
    try:
        with open(path, encoding="utf-8") as file:
            state = json.load(file)
    except (OSError, ValueError):
        state = {}
    window_start = float(state.get("window_start") or 0)
    count = int(state.get("count") or 0)
    if now - window_start >= RATE_WINDOW_S:
        window_start, count = now, 0
    count += 1
    try:
        with open(path, "w", encoding="utf-8") as file:
            json.dump({"window_start": window_start, "count": count}, file)
    except OSError:
        pass  # недоступен /tmp — лимит не работает, но приём заявок не блокируем
    return count > limit


# ── Секреты: env приоритетнее файла SSQ_ENV_PATH ─────────────────────────────

def load_secrets(environ: Dict[str, str]) -> Tuple[Optional[str], Optional[str]]:
    token = environ.get("TELEGRAM_BOT_TOKEN") or None
    chat_id = environ.get("TELEGRAM_CHAT_ID") or None
    env_path = environ.get("SSQ_ENV_PATH") or ""
    if (not token or not chat_id) and env_path and os.path.isfile(env_path):
        parsed = {}
        try:
            with open(env_path, encoding="utf-8") as file:
                for line in file:
                    key, _, value = line.partition("=")
                    if key.strip() and value.strip():
                        parsed[key.strip()] = value.strip().strip("'\"")
        except OSError:
            parsed = {}
        token = token or parsed.get("TELEGRAM_BOT_TOKEN")
        chat_id = chat_id or parsed.get("TELEGRAM_CHAT_ID")
    return token, chat_id


# ── Доставка в Telegram Bot API ──────────────────────────────────────────────

def _send_telegram(token: Optional[str], chat_id: Optional[str], text: str, timeout: int = SEND_TIMEOUT_S) -> None:
    if not token or not chat_id:
        raise ValueError("Не настроены секреты Telegram (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)")
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    body = urllib.parse.urlencode({"chat_id": chat_id, "text": text}).encode("utf-8")
    request = urllib.request.Request(url, data=body, method="POST")
    with urllib.request.urlopen(request, timeout=timeout) as response:  # noqa: S310 — https, хост фиксирован
        response.read()


def build_message(payload: Dict[str, Union[str, bool]], ip: str) -> str:
    comment = str(payload["comment"]).strip() or "—"
    return (
        "Новая заявка с сайта «Умный квадрат»\n"
        f"Имя: {payload['name']}\n"
        f"Телефон: {payload['phone']}\n"
        f"Комментарий: {comment}\n"
        f"IP: {ip}"
    )


# ── Обработчик: чистая функция, CGI — тонкая обёртка в main() ────────────────

def handle(
    environ: Dict[str, str],
    stdin,
    deliver: Optional[DeliverFn] = None,
    rate_dir: str = "/tmp",
) -> Tuple[int, dict]:
    # Дефолт резолвится при вызове (не при объявлении) — иначе подмена доставки в тестах не срабатывает.
    deliver = deliver or _send_telegram

    if environ.get("REQUEST_METHOD") != "POST":
        return 405, {"ok": False, "error": "Метод не поддерживается. Заявки принимаются по POST."}

    try:
        payload = parse_payload(read_body(environ, stdin), environ.get("CONTENT_TYPE") or "")
    except (json.JSONDecodeError, UnicodeDecodeError, ValueError):
        return 400, {"ok": False, "error": "Не удалось прочитать заявку. Попробуйте отправить ещё раз."}

    ip = client_ip(environ)

    # Honeypot: заполняют только боты. Успех маскируем, ничего не доставляем.
    if payload["website"]:
        return 200, {"ok": True}

    try:
        limit = int(environ.get("FORM_RATE_LIMIT_PER_HOUR") or DEFAULT_RATE_LIMIT)
    except ValueError:
        limit = DEFAULT_RATE_LIMIT
    if rate_limit_exceeded(ip, limit, rate_dir):
        return 400, {
            "ok": False,
            "error": "Слишком много заявок за последний час. Попробуйте позже или позвоните нам.",
        }

    error = validation_error(payload)
    if error:
        return 400, {"ok": False, "error": error}

    token, chat_id = load_secrets(environ)
    try:
        deliver(token, chat_id, build_message(payload, ip))
    except Exception:  # noqa: BLE001 — доставка не удалась: НЕ маскируем успехом
        return 502, {
            "ok": False,
            "error": "Заявка не отправилась: сервер доставки недоступен. Позвоните или напишите нам напрямую.",
        }

    return 200, {"ok": True}


def main() -> None:
    status, result = handle(os.environ, __import__("sys").stdin)
    body = json.dumps(result, ensure_ascii=False)
    print(f"Status: {status} {'OK' if status == 200 else 'Error'}")
    print("Content-Type: application/json; charset=utf-8")
    print("Cache-Control: no-store")
    print()
    print(body)


if __name__ == "__main__":
    main()