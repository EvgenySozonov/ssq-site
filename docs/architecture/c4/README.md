# C4-модель сайта (Structurizr DSL)

- Источник истины: `workspace.dsl` (текст в репо, диффится в git).
- Отображает: [../../specs/ssq-site-stack-design.md](../../specs/ssq-site-stack-design.md). При изменении спеки модель правится той же задачей.

# Как рендерить (Structurizr Local в Docker)

```bash
cd docs/architecture/c4
docker run -d --name ssq-c4 -p 8080:8080 -v "$PWD:/usr/local/structurizr" structurizr/structurizr local
# затем открыть http://localhost:8080
```

- Сервер компилирует `workspace.dsl` на загрузке; правки DSL требуют перезапуска: `docker restart ssq-c4`.
- Ошибка компиляции видна тут же: `docker logs ssq-c4 | grep -i exception` (первая строка "Caused by" — суть).
- Образ `structurizr/lite` устарел — используем консолидированный `structurizr/structurizr local`.
- Остановить/удалить: `docker stop ssq-c4 && docker rm ssq-c4`. Контейнер stateless: вся модель — файл в репо.
- Рендер не нужен для CI/деплоя — это визуальный инструмент для просмотра и обсуждения.

# Виды в модели

| Вид (key) | Что показывает |
|---|---|
| `Context` | Посетитель, PO, сайт, Telegram API, GitHub — кто с кем общается |
| `Containers` | Статические страницы (Astro SSG) и CGI contact.py внутри системы |
| `FormFlow` | Динамический вид: шаги POST → honeypot → валидация → Telegram → коды ответов |
| `Production` | Deployment: Apache+CGI на Beget, env-файл вне docroot, счётчики /tmp |
| `DeployPipeline` | Deployment: MacBook → git → rsync → public_html, rollback-снимки releases |

# Правила ведения

- Изменения архитектуры = правка `workspace.dsl` в той же задаче, что и код/спека (см. [../../qa.md](../../qa.md) — дриф-check).
- Не хранить в модели секреты и реальные персональные данные.