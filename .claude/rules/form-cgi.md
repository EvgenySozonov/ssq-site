---
paths:
  - "site/public/cgi-bin/**"
  - "site/src/components/**/*form*"
  - "site/src/pages/contacts*"
---

# Контракт формы заявок

- Следуй скиллу `ssq-form-cgi` — он единственный источник контракта формы
  (поля, валидация, honeypot, rate-limit, доставка Telegram, 400/502).
- Гейты после правок формы: чек-лист «Форма» из docs/qa.md целиком.
- `.env` не читается из docroot; секреты — вне него (см. ssq-deploy-beget).