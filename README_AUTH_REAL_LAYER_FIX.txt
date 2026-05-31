LifeCity Auth Real Layer Final Fix

Что было найдено:
- Часть старого окна/заголовков авторизации рисовалась через canvas, поэтому CSS не менял вид активного HUD.
- Дополнительные DOM/CSS правки накладывались поверх canvas, из-за чего появлялись дубли обводок и надписей.
- Надписи "Авторизация" и "Регистрация" справа сверху удалены/скрыты.
- Дубли "Вход в игру" и "Создание персонажа" удалены из canvas/DOM-отрисовки.

Что исправлено:
- Добавлена реальная canvas-отрисовка HUD-панели авторизации.
- Добавлены canvas-отрисовки HUD-полей и HUD-кнопок.
- Скрыты старые верхние auth-tabs/title слои.
- Камера авторизации ещё немного смещена в город и поднята.
- Логика входа/регистрации не менялась.

Отчёт:
Game file: public/game.js
Before occurrences Авторизация: 1
Before occurrences Регистрация: 3
Before occurrences Вход в игру: 0
Before occurrences Создание персонажа: 0
After planned occurrences Авторизация: 1
After planned occurrences Регистрация: 3
After planned occurrences Вход в игру: 0
After planned occurrences Создание персонажа: 0

JS checks:
('local-server.js', 0, '')
('public/game.js', 0, '')