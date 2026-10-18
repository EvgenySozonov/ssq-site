workspace {
  name "SSQ Site"
  description "Архитектура сайта «Умный квадрат» — статика + CGI-форма, деплой на Beget Shared"

  model {
    visitor = person "Посетитель" "Владелец квартиры/дома: смотрит сайт, отправляет заявку"
    po = person "Владелец компании (PO)" "Получает заявки в Telegram, правит контент через git"

    ssq = softwareSystem "Сайт «Умный квадрат»" {
      static = container "Статические страницы" "Astro SSG: маршруты из lines.json, коллекции MDX, JSON-данные" "HTML/CSS/TS"
      form = container "contact.py" "CGI-эндпоинт формы: валидация, honeypot, rate-limit, доставка в Telegram" "Python 3 stdlib"
    }

    tg = softwareSystem "Telegram Bot API" "Доставляет заявки в чат владельца" "Внешняя"
    gh = softwareSystem "GitHub" "Приватный репозиторий исходников" "Внешняя"

    visitor -> static "Просматривает услуги/цены/кейсы" "HTTPS"
    visitor -> form "POST заявки (JSON)" "HTTPS"
    form -> tg "sendMessage — заявка" "HTTPS, таймаут 5 с"
    form -> form "Внутренние проверки: honeypot, валидация, rate-limit" "локально"
    po -> static "git push (контент: JSON/MDX)" "HTTPS"
    po -> static "rsync-деплой dist/ (deploy.sh)" "SSH"

    deploymentEnvironment "Production" {
      beget = deploymentNode "Beget Shared" "Apache + CGI, docroot фиксирован" {
        ci1 = containerInstance static
        ci2 = containerInstance form
        envFile = infrastructureNode "env-ssq" "Секреты вне docroot, chmod 600" "файл"
        tmpc = infrastructureNode "tmp" "Файлы-счётчики rate-limit" "/tmp"
      }
    }

    deploymentEnvironment "DeployPipeline" {
      mac = deploymentNode "MacBook владельца" "Node 24, npm" {
        ci_build = containerInstance static
      }
      ghn = deploymentNode "GitHub" {
        repo = infrastructureNode "ssq-site (private)" "main" "репозиторий"
      }
      beget2 = deploymentNode "Beget Shared" {
        rel = infrastructureNode "releases/backup-ts" "rollback-снимок rsync --backup" "каталог"
        docroot = infrastructureNode "public_html" "статика + cgi-bin/" "docroot"
      }
      ci_build -> repo "git push"
      ci_build -> docroot "deploy.sh: rsync -az --delete --backup"
      ci_build -> rel "снимок предыдущей версии"
    }
  }

  views {
    systemContext ssq "Context" {
      include *
      autolayout
      description "Кто с чем общается"
    }

    container ssq "Containers" {
      include *
      autolayout
      description "Контейнеры сайта: статика и CGI"
    }

    dynamic ssq "FormFlow" {
      visitor -> form "1. POST /cgi-bin/contact.py {name, phone, consent, website(honeypot)}"
      form -> form "2. honeypot не пуст → 200 {ok} молча"
      form -> form "3. валидация / согласие / rate-limit → 400 / 429"
      form -> tg "4. sendMessage → 200 {ok:true}"
      form -> form "5. Telegram недоступен → 502 {ok:false}, не маскируем"
    }

    deployment * "Production" {
      include *
      autolayout
      description "Прод-окружение на Beget"
    }

    deployment * "DeployPipeline" {
      include *
      autolayout
      description "Как релиз попадает в прод"
    }

    styles {
      element "Person" {
        background "#101014"
        color "#eceae6"
      }
      element "Software System" {
        background "#17191d"
        color "#eceae6"
      }
      element "Container" {
        background "#2a2d33"
        color "#eceae6"
      }
      element "External System" {
        background "#5a5245"
        color "#eceae6"
      }
      element "Infrastructure Node" {
        background "#8f7b53"
        color "#101014"
      }
    }
  }
}