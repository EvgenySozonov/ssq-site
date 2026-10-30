---
title: "trail check: ложное срабатывание на TEST_IP в test_contact.py"
author: EvgenySozonov
date: 2026-10-30
branch: main
cost: { minutes: 30, tokens: 1632947 }
touches:
  - ".planning/STATE.md"
  - ".planning/codebase/CONCERNS.md"
  - README.md
  - docs/memory.md
  - docs/qa.md
  - docs/specs/ssq-site-stack-design.md
  - docs/security-checklist.md
  - site/public/cgi-bin/contact.py
  - site/src/components/ContactForm.astro
  - site/tests/test_contact.py
---

## Decided
Перед коммитом/пушем после security-правки формы (29.10, коммит f31235f) trail check выдал 2 конфликта; разобраны так: реальный (statusline, условие возврата из learning'а наступило) — починен; ложный — помечен в commit-сообщении.

## Tried and ruled out
Смена TEST_IP в test_contact.py ради «устранения» конфликта — отклонена: TEST_IP=1.2.3.4 это ровно публичный IP, требуемый learning'ом от 29.10 (TEST-NET 203.0.113.x/198.51.100.x не проходят ipaddress.is_global), менять его нельзя.

## Watch out
trail check бывает ложноположительным: если changed-file совпадает по триггеру, но значение правильное — конфликт не баг, проверяйте код/значение, а не переписывайте под learning. Для test_contact.py известный false-positive: строка TEST_IP=1.2.3.4 (line 35) триггерит learning про TEST-NET, хотя он сам же требует 1.2.3.4.
