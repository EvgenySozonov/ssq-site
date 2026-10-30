#!/usr/bin/env python3
"""Серверные испытания cgi-bin/contact.py (qa.md «Форма» пп. 4–6 и смежные).

unittest (stdlib, ноль зависимостей — в духе «только stdlib» у CGI). Сеть никогда
не трогается: доставка подменяется fake-функцией, счётчик rate-limit живёт во
временном каталоге; для испытаний urllib патчится только на уровне urlopen.

Запуск: cd site && python3 tests/test_contact.py  (или npm run test:server)
"""

from __future__ import annotations

import hashlib
import importlib.util
import io
import json
import shutil
import sys
import tempfile
import time
import unittest
import urllib.error
from pathlib import Path
from unittest import mock

CONTACT_PY = Path(__file__).resolve().parent.parent / "public" / "cgi-bin" / "contact.py"
sys.dont_write_bytecode = True  # не оставлять __pycache__ рядом с deploy-артефактом cgi-bin
_spec = importlib.util.spec_from_file_location("contact", CONTACT_PY)
contact = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(contact)

# Тестовые IP — из публичных диапазонов (не TEST-NET/документационные):
# client_ip() отбрасывает незарезервированные для маршрутизации адреса через
# ipaddress.is_global — документационные 203.0.113.x/198.51.100.x он бы отбросил.
TEST_IP = "1.2.3.4"
OTHER_IP = "5.6.7.8"
VALID_PAYLOAD = {
    "name": "Иван Тестов",
    "phone": "+7 (999) 123-45-67",
    "comment": "Нужен расчёт смарт-дома",
    "agree": True,
}


def make_environ(method: str = "POST", content_type: str = "application/json", ip: str = TEST_IP, **extra) -> dict:
    return {
        "REQUEST_METHOD": method,
        "CONTENT_TYPE": content_type,
        "REMOTE_ADDR": ip,
        "HTTP_X_FORWARDED_FOR": f"{ip}, 10.0.0.1",
        # В проде браузер всегда шлёт Origin; по умолчанию — разрешённый домен.
        "HTTP_ORIGIN": "https://smart-square.ru",
        "TELEGRAM_BOT_TOKEN": "test-token",
        "TELEGRAM_CHAT_ID": "test-chat",
        **extra,
    }


class EndpointTestCase(unittest.TestCase):
    """База: свежий rate-каталог на каждый тест и удобный вызов handle()."""

    def setUp(self) -> None:
        self.rate_dir = tempfile.mkdtemp(prefix="ssq-form-test-")
        self.addCleanup(shutil.rmtree, self.rate_dir, ignore_errors=True)
        self.delivered: list[str] = []

    def deliver(self, token, chat_id, text: str) -> None:
        self.delivered.append(text)

    def call(
        self,
        data: dict | None = VALID_PAYLOAD,
        raw: str | None = None,
        content_type: str = "application/json",
        method: str = "POST",
        ip: str = TEST_IP,
        **extra,
    ):
        body = (raw if raw is not None else json.dumps(data, ensure_ascii=False)).encode("utf-8")
        environ = make_environ(method=method, content_type=content_type, ip=ip, **extra)
        environ["CONTENT_LENGTH"] = str(len(body))
        return contact.handle(environ, io.BytesIO(body), deliver=self.deliver, rate_dir=self.rate_dir)

    def rate_state(self, ip: str) -> dict:
        path = contact.rate_file_path(ip, self.rate_dir)
        with open(path, encoding="utf-8") as file:
            return json.load(file)

    def write_rate_state(self, ip: str, state: dict) -> None:
        path = contact.rate_file_path(ip, self.rate_dir)
        with open(path, "w", encoding="utf-8") as file:
            json.dump(state, file)


class HoneypotTest(EndpointTestCase):
    """qa.md п.4: honeypot заполнен → маскированный успех, заявка не доставляется."""

    def test_filled_honeypot_is_masked_success_without_delivery(self):
        status, result = self.call(data={**VALID_PAYLOAD, "website": "http://spam.example"})
        self.assertEqual(status, 200)
        self.assertEqual(result, {"ok": True})
        self.assertEqual(self.delivered, [])

    def test_filled_honeypot_masks_even_invalid_fields(self):
        # Бот не заботится о валидации — всё равно ни отказа, ни доставки.
        status, result = self.call(data={"name": "", "phone": "123", "agree": False, "website": "spam"})
        self.assertEqual(status, 200)
        self.assertEqual(result, {"ok": True})
        self.assertEqual(self.delivered, [])


class RateLimitTest(EndpointTestCase):
    """qa.md п.5: повторные отправки с одного IP чаще лимита — отклоняются."""

    def test_third_submission_within_limit_of_two_is_rejected_like_validation(self):
        limit = {"FORM_RATE_LIMIT_PER_HOUR": "2"}
        self.assertEqual(self.call(rate_dir=self.rate_dir, **limit)[0], 200)
        self.assertEqual(self.call(rate_dir=self.rate_dir, **limit)[0], 200)
        status, result = self.call(rate_dir=self.rate_dir, **limit)
        self.assertEqual(status, 400)
        self.assertFalse(result["ok"])
        self.assertIn("позвоните", result["error"])  # дружелюбный русский текст

    def test_other_ip_is_not_affected(self):
        limit = {"FORM_RATE_LIMIT_PER_HOUR": "1"}
        self.assertEqual(self.call(rate_dir=self.rate_dir, **limit)[0], 200)
        self.assertEqual(self.call(rate_dir=self.rate_dir, **limit)[0], 400)  # тот же IP
        status, _ = self.call(ip=OTHER_IP, **limit)  # другой IP — лимит свой
        self.assertEqual(status, 200)
        self.assertTrue(self.delivered)  # заявка другого IP доставлена

    def test_window_resets_after_an_hour(self):
        limit = {"FORM_RATE_LIMIT_PER_HOUR": "1"}
        self.assertEqual(self.call(rate_dir=self.rate_dir, **limit)[0], 200)
        self.assertEqual(self.call(rate_dir=self.rate_dir, **limit)[0], 400)
        # Час прошёл: подменяем окно в счётчике на прошлое.
        state = self.rate_state(TEST_IP)
        state["window_start"] = time.time() - contact.RATE_WINDOW_S - 1
        self.write_rate_state(TEST_IP, state)
        self.assertEqual(self.call(rate_dir=self.rate_dir, **limit)[0], 200)

    def test_limit_is_configurable_and_broken_env_falls_back_to_default(self):
        for value in ("abc", None):
            extra = {} if value is None else {"FORM_RATE_LIMIT_PER_HOUR": value}
            self.setUp()  # чистый каталог
            statuses = [self.call(rate_dir=self.rate_dir, **extra)[0] for _ in range(11)]
            # Дефолт 10/ч: 10 принимаем, 11-я отклоняется — лимит жив при любом env.
            self.assertEqual(statuses.count(200), 10)
            self.assertEqual(statuses[-1], 400)
            self.setUp()

    def test_counter_keyed_by_rightmost_public_ip_behind_proxy(self):
        # Beget за прокси: REMOTE_ADDR — приватный, правая публичная запись XFF — клиент.
        proxy_env = {"REMOTE_ADDR": "127.0.0.1", "HTTP_X_FORWARDED_FOR": "99.9.9.9, 80.80.80.1"}
        self.assertEqual(self.call(**proxy_env, rate_dir=self.rate_dir)[0], 200)
        self.assertEqual(self.rate_state("80.80.80.1")["count"], 1)
        # Правые записи у разных клиентов не смешиваются в один бакет.
        proxy_env_two = {"REMOTE_ADDR": "127.0.0.1", "HTTP_X_FORWARDED_FOR": "99.9.9.9, 80.80.80.2"}
        self.assertEqual(self.call(**proxy_env_two, rate_dir=self.rate_dir)[0], 200)
        self.assertEqual(self.rate_state("80.80.80.2")["count"], 1)

    def test_spoofed_left_xff_entries_are_ignored_behind_proxy(self):
        # Спуфинг слева не меняет ключ счётчика: правую запись дописал прокси.
        spoofed = {"REMOTE_ADDR": "127.0.0.1", "HTTP_X_FORWARDED_FOR": "9.9.9.9, 80.80.80.1"}
        clean = {"REMOTE_ADDR": "127.0.0.1", "HTTP_X_FORWARDED_FOR": "80.80.80.1"}
        limit = {"FORM_RATE_LIMIT_PER_HOUR": "1"}
        self.assertEqual(self.call(**spoofed, rate_dir=self.rate_dir, **limit)[0], 200)
        self.assertEqual(self.call(**clean, rate_dir=self.rate_dir, **limit)[0], 400)  # тот же правый IP → лимит
        self.assertEqual(self.rate_state("80.80.80.1")["count"], 2)

    def test_proxy_without_public_xff_falls_back_to_remote_addr(self):
        # Угол: XFF без публичной записи → общий бакет REMOTE_ADDR, не обход.
        corner = {"REMOTE_ADDR": "127.0.0.1", "HTTP_X_FORWARDED_FOR": "10.0.0.1"}
        limit = {"FORM_RATE_LIMIT_PER_HOUR": "1"}
        self.assertEqual(self.call(**corner, rate_dir=self.rate_dir, **limit)[0], 200)
        self.assertEqual(self.call(**corner, rate_dir=self.rate_dir, **limit)[0], 400)  # тот же бакет по REMOTE_ADDR
        self.assertEqual(self.rate_state("127.0.0.1")["count"], 2)

    def test_public_remote_addr_ignores_client_xff(self):
        # REMOTE_ADDR публичен → клиентские XFF-заголовки вообще не учитываются.
        self.assertEqual(self.call(**{"HTTP_X_FORWARDED_FOR": "9.9.9.9"}, rate_dir=self.rate_dir)[0], 200)
        self.assertEqual(self.rate_state(TEST_IP)["count"], 1)


class DeliveryFailureTest(EndpointTestCase):
    """qa.md п.6 (+ контракт): отказ доставки — 502, успех не маскируется."""

    def test_telegram_failure_is_502_not_masked_success(self):
        def failing(token, chat_id, text):
            raise RuntimeError("connection refused")

        # Патчим только доставку: сеть не трогается.
        body = io.BytesIO(json.dumps(VALID_PAYLOAD).encode("utf-8"))
        with mock.patch.object(contact, "_send_telegram", failing):
            status, result = contact.handle(
                make_environ(CONTENT_LENGTH=str(len(json.dumps(VALID_PAYLOAD)))),
                body,
                rate_dir=self.rate_dir,
            )
        self.assertEqual(status, 502)
        self.assertFalse(result["ok"])
        self.assertIn("не отправилась", result["error"])
        self.assertEqual(self.delivered, [])

    def test_missing_secrets_raise_instead_of_silent_send(self):
        with self.assertRaises(ValueError):
            contact._send_telegram(None, "chat", "text")  # noqa: SLF001
        with self.assertRaises(ValueError):
            contact._send_telegram("token", None, "text")  # noqa: SLF001

    def test_urllib_errors_from_send_propagate_to_502(self):
        def failing_urlopen(request, timeout=contact.SEND_TIMEOUT_S):
            raise urllib.error.URLError("dns failure")

        with mock.patch.object(contact.urllib.request, "urlopen", failing_urlopen):
            with self.assertRaises(urllib.error.URLError):
                contact._send_telegram("token", "chat", "text")  # noqa: SLF001
        # и через handle — тот же отказ даёт 502, а не 200
        def failing(token, chat_id, text):
            raise urllib.error.URLError("dns failure")

        with mock.patch.object(contact, "_send_telegram", failing):
            status, _ = contact.handle(
                make_environ(CONTENT_LENGTH=str(len(json.dumps(VALID_PAYLOAD)))),
                io.BytesIO(json.dumps(VALID_PAYLOAD).encode("utf-8")),
                rate_dir=self.rate_dir,
            )
        self.assertEqual(status, 502)


class ValidationTest(EndpointTestCase):
    """Валидация: пустые обязательные, формат телефона, согласие — 400 + русский текст."""

    def test_empty_name_rejected(self):
        status, result = self.call(data={**VALID_PAYLOAD, "name": "  "})
        self.assertEqual(status, 400)
        self.assertIn("имя", result["error"])

    def test_invalid_phone_rejected_same_normalization_as_client(self):
        for phone in ("123", "abc", "+7 999 12", "9991234567", ""):
            status, result = self.call(data={**VALID_PAYLOAD, "phone": phone})
            self.assertEqual(status, 400, phone)
            self.assertIn("Проверьте номер телефона", result["error"], phone)

    def test_missing_consent_rejected(self):
        status, result = self.call(data={**VALID_PAYLOAD, "agree": False})
        self.assertEqual(status, 400)
        self.assertIn("согласия", result["error"])

    def test_errors_are_combined(self):
        _, result = self.call(data={"name": "", "phone": "123", "agree": False})
        self.assertIn("имя", result["error"])
        self.assertIn("телефона", result["error"])
        self.assertIn("согласия", result["error"])

    def test_alternative_phone_formats_accepted(self):
        for phone in ("+79991234567", "8 999 123-45-67"):
            self.delivered.clear()
            status, _ = self.call(data={**VALID_PAYLOAD, "phone": phone})
            self.assertEqual(status, 200, phone)
            self.assertIn("79991234567", self.delivered[0])  # в доставке — нормализованный

    def test_form_encoded_body_accepted_as_alternative_to_json(self):
        raw = "name=Иван+Тестов&phone=%2B79991234567&comment=&agree=true&website="
        status, result = self.call(raw=raw, content_type="application/x-www-form-urlencoded")
        self.assertEqual(status, 200)
        self.assertTrue(result["ok"])
        self.assertEqual(len(self.delivered), 1)
        self.assertIn("Иван Тестов", self.delivered[0])

    def test_malformed_json_is_friendly_400_not_500(self):
        status, result = self.call(raw="{not json", content_type="application/json")
        self.assertEqual(status, 400)
        self.assertFalse(result["ok"])
        self.assertIn("Не удалось прочитать", result["error"])

    def test_get_is_rejected_post_only(self):
        status, result = self.call(method="GET", raw="", content_type="")
        self.assertEqual(status, 405)
        self.assertFalse(result["ok"])

    def test_empty_body_is_400_not_500(self):
        status, result = self.call(data={}, raw="", content_type="application/json")
        self.assertEqual(status, 400)
        self.assertFalse(result["ok"])
        self.assertIn("Не удалось прочитать", result["error"])


class OriginGateTest(EndpointTestCase):
    """Строгий Origin-гейт (CONCERNS.md): POST только с разрешённых доменов."""

    def test_missing_origin_and_referer_is_rejected(self):
        environ = make_environ()
        environ.pop("HTTP_ORIGIN")
        body = io.BytesIO(json.dumps(VALID_PAYLOAD).encode("utf-8"))
        environ["CONTENT_LENGTH"] = str(len(body.getvalue()))
        status, result = contact.handle(environ, body, rate_dir=self.rate_dir)
        self.assertEqual(status, 400)
        self.assertIn("только с сайта", result["error"])

    def test_foreign_origin_is_rejected(self):
        status, result = self.call(**{"HTTP_ORIGIN": "https://spam.example"})
        self.assertEqual(status, 400)
        self.assertIn("только с сайта", result["error"])

    def test_referer_fallback_accepts_same_domain_with_path(self):
        # Нет Origin (старые прокси) → Referer с того же домена проходит, путь не важен.
        self.delivered.clear()
        status, _ = self.call(
            **{"HTTP_ORIGIN": "", "HTTP_REFERER": "https://smart-square.ru/contacts/"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(len(self.delivered), 1)

    def test_origin_check_can_be_widened_for_local_debug(self):
        # Локальная отладка/смоук: переопределение через SSQ_FORM_ALLOWED_ORIGINS.
        self.delivered.clear()
        status, _ = self.call(
            **{
                "HTTP_ORIGIN": "http://localhost:4321",
                "SSQ_FORM_ALLOWED_ORIGINS": "http://localhost:4321,http://127.0.0.1:4321",
            },
        )
        self.assertEqual(status, 200)
        self.assertEqual(len(self.delivered), 1)

    def test_case_and_www_variants_are_normalised(self):
        status, result = self.call(**{"HTTP_ORIGIN": "HTTPS://WWW.SMART-SQUARE.RU"})
        self.assertEqual(status, 200)
        self.assertTrue(result["ok"])


class LengthLimitTest(EndpointTestCase):
    """Лимиты длины (CONCERNS.md): name ≤ 100, comment ≤ 1000 — 400, не обрезка."""

    def test_long_name_rejected_with_friendly_message(self):
        status, result = self.call(data={**VALID_PAYLOAD, "name": "И" * 101})
        self.assertEqual(status, 400)
        self.assertIn("Имя длиннее", result["error"])

    def test_long_comment_rejected_with_friendly_message(self):
        status, result = self.call(data={**VALID_PAYLOAD, "comment": "Х" * 1001})
        self.assertEqual(status, 400)
        self.assertIn("Комментарий длиннее", result["error"])

    def test_limit_boundary_is_allowed(self):
        status, _ = self.call(data={**VALID_PAYLOAD, "name": "И" * 100, "comment": "Х" * 1000})
        self.assertEqual(status, 200)

    def test_spam_comment_never_reaches_delivery(self):
        def delivering(token, chat_id, text):
            self.delivered.append(text)

        body = json.dumps({**VALID_PAYLOAD, "comment": "Х" * 1001}).encode("utf-8")
        environ = make_environ(CONTENT_LENGTH=str(len(body)))
        status, _ = contact.handle(environ, io.BytesIO(body), deliver=delivering, rate_dir=self.rate_dir)
        self.assertEqual(status, 400)
        self.assertEqual(self.delivered, [])  # в Telegram длинный спам не уходит


class ValidDeliveryTest(EndpointTestCase):
    """Позитивный путь: валидная заявка доставляется с собранным текстом."""

    def test_valid_submission_is_delivered_once_with_payload(self):
        status, result = self.call()
        self.assertEqual(status, 200)
        self.assertEqual(result, {"ok": True})
        self.assertEqual(len(self.delivered), 1)
        self.assertIn("Иван Тестов", self.delivered[0])
        self.assertIn("79991234567", self.delivered[0])
        self.assertIn("Нужен расчёт смарт-дома", self.delivered[0])
        self.assertIn(TEST_IP, self.delivered[0])

    def test_message_build_is_complete(self):
        message = contact.build_message(
            {"name": "Иван", "phone": "79991234567", "comment": "  ", "agree": True},
            TEST_IP,
        )
        self.assertIn("Комментарий: —", message)  # пустой комментарий не теряется


if __name__ == "__main__":
    unittest.main()