---
title: "Правило активных ссылок в SSQ-доках + PostToolUse-чекер; вендор-скиллы вне правила"
author: EvgenySozonov
date: 2026-11-18
branch: redesign/solstice
cost: { minutes: 1, tokens: 1258 }
id: l-1a1f098e
scope: repo
status: active
src: agent
touches:
  - CLAUDE.md
  - site/AGENTS.md
---

Правило и хук активных ссылок в доке SSQ-site: конвенция, границы чекера

## Decided
Владелец (2026-11-18): файл-рефы в любых *.md проекта — активные markdown-ссылки, относительные от файла-доки; file:line — текстом после ссылки (переход по строке в md-ссылках Obsidian/VSCode невозможен). Проверка: PostToolUse-хук гоняет чекер на каждом правленом .md, вывод — предупреждения с file:line, неблокирующий.

## Tried and ruled out
Скан всего репо на каждый хук — отклонён: проверяется один изменённый файл (быстро, без false positives на старых доках). Вендор-скилл webapp-testing исключён из правила: его SKILL.md перезапишется при обновлении, активировать внутренние рефы бессмысленно.

## Watch out
Бэктик-реф внутри текста активной ссылки ([`X.md`](X.md)) — не нарушение; примитивная проверка «40 символов слева от бэктиков» даёт false positive (поймано на таблице конвенций). Глобы (*.json), команды grep/find/npm и содержимое код-блоков — не файл-рефы, чекер их пропускает.

## In the code
.claude/helpers/md-link-check.cjs — чекер (node, без зависимостей; stdin-JSON хука или аргументы-файлы); .claude/settings.json — запись hooks.PostToolUse «Активные ссылки в *.md»; правило текстом — CLAUDE.md (раздел «Правило активных ссылок в *.md»); фикс-проход по 6 докам — README, site/AGENTS.md, INGEST-CONFLICTS, intel/requirements, intel/decisions, ssq-deploy-beget/SKILL.md (битый ../../ → ../../..)
