---
title: Hallmark установлен глобально без браузер-чеков; npx-установщик конфликтует с хуком trail
author: EvgenySozonov
date: 2026-11-17
branch: main
cost: { minutes: 1, tokens: 532 }
id: l-d510964b
scope: repo
status: active
src: agent
---

Скилл дизайна hallmark (Nutlope/hallmark, анти-AI-slop гейты, 50 тем) установлен 2026-11-18 глобально в ~/.claude/skills/hallmark (Claude Code), без puppeteer-core.

## Decided
- Область установки — глобально (владелец выбрал): скилл доступен во всех проектах, README рекомендует так.
- Браузерные чеки не устанавливать (владелец выбрал): npm i -g puppeteer-core — зависимость машины, нужна только для sloplint --render (рендер страниц в Chrome на 8 ширинах); статические гейты работают без неё.
- Ставить по README-пути «From a clone»: клон репо + node skills/hallmark/scripts/install.mjs --claude — скрипт сам валидирует все 50 тем перед копированием; установлен SKILL.md + references/themes + scripts + agents (8,5 МБ), v2.0.0.
- В проекте SSQ приоритет проектных скиллов: токены «Ночной меди» (ssq-tailwind-tokens) обязательны — hallmark их не знает; hallmark — для новых построек / redesign / audit.

## Tried and ruled out
- Официальный npx-установщик (пакет skills, арг add nutlope/hallmark) — заблокирован: PreToolUse-хук trail распознаёт в любой команде сочетание «skills add» свою команду trail-скилл-реестра (false positive). Не обходить хук маскировкой — clone-путь и так предложен README.
- Установка в проект (.claude/skills рядом с 6 кастомными SSQ) — отклонена владельцем: не нужна копия в каждом проекте.
- Установка как Claude Code plugin (plugin marketplace add) — отклонена владельцем.

## Watch out
- Без puppeteer-core и Chrome sloplint --render и скриншот-проверки падают — это ожидаемо, не баг; при первом запросе рендер-проверок ставить puppeteer-core глобально только с явного разрешения (правило проекта: зависимости — с разрешения).
- Обновления: свежий клон + install.mjs (сам валидирует темы); временный клон в /tmp самочистится.
- Триггеры hallmark близки к frontend-design и проектным дизайн-скиллам; разведены правилом «проектные токи обязательны, hallmark — для новых построек». При первой жалобе на double-trigger — развести description-триггеры.
