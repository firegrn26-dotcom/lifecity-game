LifeCity — исправленная версия

Что исправлено:
1. Добавлен server.js как точка входа для Render и других хостингов.
2. package.json теперь запускает проект командой npm start -> node server.js.
3. Регистрация стала принимать nickname, nick и name, а также passwordRepeat/repeat/confirmPassword.
   Это исправляет ошибку "Ник минимум 2 символа", когда ник был введён в новом HTML-окне регистрации.
4. Добавлена проверка проекта: npm run check проверяет server.js, local-server.js и public/game.js.

Как запустить локально:
1. npm install
2. npm start
3. Открыть http://localhost:3000

Для Render:
Build Command: npm install
Start Command: npm start
