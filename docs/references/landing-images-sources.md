# Изображения лендинга — источники и лицензии

Формат: [тема] — [тип].md · Создано 2026-11-17 при подборе картинок для лендинга.

## Встроенные (в `site/public/images/`)

| Файл | Источник | Лицензия | Ссылка | Использование |
|---|---|---|---|---|
| `hero-pendant-lights.jpg` | StockSnap VN3XVDEZJS | CC0 | https://stocksnap.io/photo/pendant-lights-VN3XVDEZJS | hero главной — заменён 2026-11-18 (см. ниже) |
| `direction-electromontazh.jpg` | StockSnap QJ55PI34SY | CC0 | https://stocksnap.io/photo/electrician-electricity-QJ55PI34SY | карточка «Электромонтаж» |
| `direction-umniy-dom.jpg` | StockSnap DYTXNUKGP2 | CC0 | https://stocksnap.io/photo/dining-room-DYTXNUKGP2 | карточка «Умный дом» |
| `hero-living-room.jpg` | rawpixel #6043312 | CC0 | https://www.rawpixel.com/image/6043312 | hero главной, с 2026-11-18 — «уютный люкс», гостиная с камином |

CC0 не требует атрибуции; источники записаны для прослеживаемости. Найдено через Openverse API
(api.openverse.org, source=stocksnap, license=cc0), 2026-11-17. Скачаны версии 960w JPG
(44–644 КБ), в вёрстке заданы width/height, карточки — с loading="lazy".

## Методика

- Unsplash/Pexels CDN с этой машины недоступны (таймауты) — потому StockSnap через Openverse.
  Замена 2026-11-18: StockSnap CDN начал отдавать Cloudflare-челлендж на plain curl — работает
  с браузерными заголовками (User-Agent, Accept). Расширили поиск до всех CC0-источников
  Openverse (выборка «luxury interior» почти пуста на StockSnap, основной — rawpixel); rawpixel
  отдаёт WebP с расширением .jpg — после скачивания конвертировать в JPEG (sips).
- Отбор по стилистике AYOCIN (design.md): тёплый нейтральный фон, «объект на светлом поле». Из
  30+ кандидатов просмотрено 12 → выбраны 3 (StockSnap, 2026-11-17); при замене hero просмотрено
  23 (серии rawpixel «люкс-интерьеры», 2026-11-18). Альтернатива осталась в /tmp (Light Switch
  GCFFRMA9VR).
- В вёрстке — hero (скрыт на мобильных, где и так плотный первый экран) и изображения карточек
  направлений с aspect-[4/3] + object-cover.

## Замена на реальные фото

При появлении реальных съёмок SSQ: заменить 3 файла и альт-тексты — сток не выдавать за объекты
компании (план-обязательство design.md остаётся: 5–7 кадров до релиза).
