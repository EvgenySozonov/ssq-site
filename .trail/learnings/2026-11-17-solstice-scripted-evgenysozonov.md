---
title: "Редизайн Solstice: длинные кириллические файлы пишутся сбоями — только короткие scripted-правки"
author: EvgenySozonov
date: 2026-11-17
branch: main
cost: { minutes: 24, tokens: 12211240 }
id: l-982e9546
scope: repo
status: active
src: agent
touches:
  - site/src/styles/tokens.css
  - site/src/styles/global.css
  - site/src/layouts/BaseLayout.astro
  - site/src/pages/index.astro
  - site/src/pages/contacts.astro
  - site/contacts-head.astro.part
  - site/src/pages/corrupt-test.txt
  - site/src/lib/lines.ts
---

## Decided
Правки .astro/md с кириллицей в SSQ-site делать только малыми дозами: python-скрипты с микро-заменами (по 1–3 пары за запуск, assert count==1, запись в конце = all-or-nothing) вместо Write/heredoc «файл целиком». CSS-файлы Write'ом пишутся надёжно.

## Tried and ruled out
Инкрементальный рестайл contacts.astro через Write и Bash heredoc цельным блоком — отклонён: 4 из 4 длинных блоков деградировали (мусорные токены, обрывы посреди разметки). Пришлось `git checkout -- site/src/pages/contacts.astro` (вернуть из HEAD) и redo через микро-замены — они прошли с первого раза.

## Watch out
- Astro-скип: `<style>` в компоненте получает scoped-селекторы `[data-astro-cid-*]`, и глобальный CSS, подключённый через `<style>@import`, срабатывает только на элементах layout'а. Подключать как frontmatter-import: `import "../styles/global.css";` в шапке BaseLayout.
- Stale dev-сервер (пользовательский `astro dev`-демон) отдаёт старый CSS без HMR после массовых перезаписей файлов — перезапускать `kill <pid>` перед рендер-проверками.

In the code:
- `site/src/layouts/BaseLayout.astro` — frontmatter-import глобального CSS.
- Проверка типа: `curl http://localhost:4321 | grep -c 'min-height: 48px'`.
