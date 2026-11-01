---
title: "Ревью по эвристикам Нильсена: шкала серьёзности 0–4 и файл-отчёт в docs/reports"
author: EvgenySozonov
date: 2026-11-01
branch: main
cost: { minutes: 1, tokens: 82495 }
id: l-9b392f2b
scope: repo
status: active
src: agent
---

## Decided
Формат оформления результатов юзабилити-ревью SSQ-site по эвристикам Нильсена: каждой находке присваивается серьёзность по шкале NN/g 0–4 (0 = не проблема … 4 = катастрофа), находки 3–4, задевающие форму заявок (контракт в ssq-form-cgi) или tel:-ссылку, помечаются «blocks conversion» и правятся первыми. Итог пишется в файл-отчёт, не в чат. Правила живут в скилле ssq-usability-heuristics/SKILL.md в .claude/skills/ (см. «In the code»): 10 эвристик адаптированы под SSQ (статика без JS, форма/tel: как kpi-функции, язык заказчика), границы с соседними скиллами (ssq-tailwind-tokens, frontend-design, ssq-form-cgi) — через указатели, дублей нет.

In the code: файл SKILL.md скилла ssq-usability-heuristics в каталоге .claude/skills/; отчёты ревью складывать в каталог docs/reports (где лежит отчёт приёмки) как YYYY-MM-DD-usability-review-<объект>.md; qa.md остаётся только гейтом сборки/деплоя. Первоисточник и разрешение на использование: nngroup.com/articles/ten-usability-heuristics/ (Nielsen, ред. 2024) — NN/g требует указания авторства. URL шкалы серьёзности проверен: nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/.

## Tried and ruled out
«Ревью без шкалы, кратким списком в чате» — отклонено владельцем: без рейтингования нельзя решать, что править до сдачи, а что в бэклог.
«Шкала 0–4, но результаты не в отдельный файл, а в существующий qa.md» — отклонено владельцем: qa.md остаётся гейтом сборки/деплоя, usability-review — отдельные отчёты по датам/объектам в docs/reports/.
Также отвергнуты варианты «скилл только для ревью» и «скилл только для проектирования» — выбран режим «проектирование + ревью» (один скилл покрывает обе фазы).

## Watch out
Ссылки на глубокие статьи NN/g брать выверкой по HTML первоисточника, не по памяти: у эвристики 5 (Error Prevention) «Full article»-ссылки на странице нет — глубокие материалы там — /articles/slips/, /articles/the-power-of-defaults/, /articles/confirmation-dialog/. Хардкодить URL NN/g по памяти — риск 404.

## False positive note
Чекер «names no file or function» сработал ложно: learning называет .claude/skills/ssq-usability-heuristics/SKILL.md и docs/reports (аналогично прошлому ложному срабатыванию на TEST_IP в test_contact.py от 2026-10-30).
