# LifeCity 2.5D — структура клиента

Клиент больше не использует старые заглушки `public/game.js`, `public/js/jobs.js`, `public/js/ui.js`. Запуск идет напрямую через модули, подключенные в `public/index.html`.

## Основные модули

- `public/js/core.js` — базовые настройки canvas, камера, состояние клиента, общие утилиты.
- `public/js/player.js` — локальный игрок, движение, ввод, персонажи.
- `public/js/network.js` — Socket.IO-события и синхронизация с сервером.
- `public/js/city-layout.js` — кварталы, зоны города, 2.5D layout.
- `public/js/map.js` — здания, районы, позиции объектов карты.
- `public/js/jobs-system.js` — логика работ и интерактивных рабочих зон.
- `public/js/roads-render.js` — дороги, магистрали, тротуары, разметка, переходы, фонари и таблички.
- `public/js/effects.js` — дым, свет, частицы, городские эффекты.
- `public/js/buildings.js` — уникальная 2.5D-отрисовка зданий.
- `public/js/ui-utils.js` — общие UI-хелперы.
- `public/js/ui-jobs.js` — UI работ и действий.
- `public/js/ui-dev.js` — режим разработчика.
- `public/js/ui-avatar-shop.js` — персонаж, внешний вид, магазин.
- `public/js/ui-profile.js` — профиль, уровень, статистика.
- `public/js/ui-chat.js` — чат.
- `public/js/ui-inventory.js` — инвентарь.
- `public/js/ui-auth.js` — авторизация и регистрация.
- `public/js/render-loop.js` — основной игровой цикл и порядок отрисовки.

## Проверка

```bash
npm run check
```

Проверка автоматически:
- прогоняет `node --check` по всем JS-файлам проекта;
- проверяет, что все скрипты из `index.html` реально существуют;
- ищет повторные подключения одного и того же браузерного модуля.
