LifeCity 2.5D — Stage 5 Architecture Cleanup

Клиентский public/game.js разделен на модули:

public/js/core.js
- socket, авторизация, музыка, canvas, камера, базовые состояния HUD/чата/инвентаря.

public/js/player.js
- физика движения, обработка клавиш, client prediction, анимация игрока.

public/js/network.js
- получение игроков, синхронизация профиля, сетевые события клиента.

public/js/map.js
- карта города, здания, завод, восстановление recyclingFactory.

public/js/jobs.js
- коллизии, определение работы, действия по клавише E, job confirm логика.

public/js/effects.js
- визуальные эффекты, атмосфера, частицы, рисование персонажа.

public/js/buildings.js
- 2.5D-отрисовка зданий, крыш, фасадов, входов и depth-визуал.

public/js/ui.js
- HUD, окна, магазин, профиль, чат, инвентарь, авторизация.

public/js/render-loop.js
- stage 3 depth/camera, общий render, grid/dev labels, основной loop.

public/game.js оставлен как совместимый placeholder, чтобы старые deploy-настройки не ломались.
Порядок подключения задан в public/index.html.

Серверная логика local-server.js не менялась.
