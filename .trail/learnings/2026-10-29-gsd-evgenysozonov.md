---
title: "Бридж контекст-монитора GSD в проектной статус-линии"
author: EvgenySozonov
date: 2026-10-29
branch: main
cost: { minutes: 22, tokens: 3483725 }
touches:
  - ".planning/STATE.md"
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
- Бридж для gsd-context-monitor перенесён в проектную статус-линию: ssq-statusline.mjs пишет /{os.tmpdir()}/claude-ctx-{session_id}.json (формат gsd-statusline.js:1186, шкала до порога auto-compact = окно − 20k − 13k). Так PostToolUse-монитор (~/.claude/settings.json) снова инжектит WARNING(≤35%)/CRITICAL(≤25%) в SSQ-сессии — user-статуслиния тут не активна.
## Tried and ruled out
- Дублировать полную per-model settings-цепочку readAutoCompactWindowSetting в проектный скрипт не стали: в проекте autoCompactWindow не задан, достаточно env CLAUDE_CODE_AUTO_COMPACT_WINDOW + окна модели; вернуться, если появится /autocompact.
## Watch out
- Отладка монитора из CLI: os.tmpdir() на macOS это /var/folders/.../T, НЕ /tmp; watermark-файл называется claude-ctx-{id}-compacted.json (НЕ -watermark.json); симуляция PreCompact удаляет бридж + пишет watermark на 60с COMPACT_GRACE — метрики старше watermark молча отбрасываются, а бридж протухает за STALE_SECONDS=60. Тест: сначала статус-линия (свежий бридж), затем PostToolUse, без прежних sentinel-файлов.
