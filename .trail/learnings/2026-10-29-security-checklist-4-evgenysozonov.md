---
title: "Security-checklist отсутствует, разбросан по 4 местам"
author: EvgenySozonov
date: 2026-10-29
branch: main
cost: { minutes: 1, tokens: 81690 }
touches:
  - docs/qa.md
  - CLAUDE.md
  - ".planning/codebase/CONCERNS.md"
---

## Decided
- Отдельного файла security-checklist в проекте нет; предложил собрать docs/security-checklist.md, сводящий разрозненные требования.
## Tried and ruled out
- Проверено: упоминания security разбросаны по 4 местам — docs/qa.md:18 (claude-security:scan как релизный гейт), .claude/skills/ssq-form-cgi/SKILL.md (honeypot/rate-limit/секреты формы), CLAUDE.md (правило про .env), .planning/codebase/CONCERNS.md (анализ, не чек-лист).
## Watch out
- Файлы *checklist*/*securit* через find не находятся — нет ни одного; при создании нового поместить в docs/ по формуле нейминга [тема] — [тип].md.
