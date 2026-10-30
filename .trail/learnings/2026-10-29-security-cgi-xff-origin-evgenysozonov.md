---
title: "Закрытие security-рисков CGI: XFF-резолв, Origin-гейт, лимиты длины"
author: EvgenySozonov
date: 2026-10-29
branch: main
cost: { minutes: 19, tokens: 2201269 }
touches:
  - ".planning/codebase/CONCERNS.md"
  - README.md
  - docs/memory.md
  - docs/qa.md
  - docs/specs/ssq-site-stack-design.md
  - site/public/cgi-bin/contact.py
  - site/src/components/ContactForm.astro
  - site/tests/test_contact.py
  - docs/security-checklist.md
---

## Decided
- Закрытие рисков CONCERNS.md (2026-10-29): IP для rate-limit — правая публичная запись XFF за приватным REMOTE_ADDR (левые записи клиенту подконтрольны), публичный REMOTE_ADDR — клиент; Origin/Referer строгий гейт (пустой/чужой → 400, отладка через SSQ_FORM_ALLOWED_ORIGINS); лимиты name≤100/comment≤1000 → 400 (не обрезка) + maxlength в ContactForm; /tmp fail-open сохранён + stderr в error-log.
## Tried and ruled out
- «Первая запись XFF» — спуфится слева; «только REMOTE_ADDR» — на Beget CGI видит прокси → один бакет 10/ч на весь сайт (DoS качества заявок). Тихая обрезка длины отклонена — молча теряется текст заявки; fallback-каталог в docroot отклонён как собственный риск с непроверенными правами Beget.
## Watch out
- ipaddress.is_global в Python: TEST-NET-диапазоны 203.0.113.x и 198.51.100.x НЕ глобальные — тесты с ними падают («counter file not created»), у contact.py тестовые IP только реально публичные (TEST_IP=1.2.3.4). Ловушка-сосед: в тестах call(**extra) rate_dir ловится kwargs и НЕ доходит до handle — он и так передаётся явно; а FORM_RATE_LIMIT_PER_HOUR при 2 заявках в тесте надо опускать явно (дефолт 10/ч).
