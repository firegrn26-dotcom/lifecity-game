// ===============================
// 🧍 ФИЗИКА И АНИМАЦИЯ ПЕРСОНАЖА
// ===============================
const PLAYER_SIZE = 20;
const PLAYER_MOVE_PHYSICS = {
    acceleration: 0.26,
    braking: 0.20,
    friction: 0.84,
    turnSpeed: 0.18,
    // Больше значение = меньше штраф скорости при повороте.
    moveAfterAngle: 1.18
};

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function angleLerp(current, target, amount) {
    return current + normalizeAngle(target - current) * amount;
}

function getVectorLength(x, y) {
    return Math.sqrt(x * x + y * y);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// плавность других игроков
const remoteSmoothMin = 0.18;
const remoteSmoothMax = 0.55;

// ===============================
// 🎹 КЛАВИШИ
// ===============================
let keys = {};
let nearJob = null;
let lastActionTime = 0;

// ===============================
// 👷 JOB CONFIRM STATE
// ===============================
// Хранит открытое окно подтверждения устройства/увольнения
let jobConfirmOpen = false;
let jobConfirmData = null;

let jobConfirmButtons = {
    accept: { x: 0, y: 0, w: 0, h: 0 },
    cancel: { x: 0, y: 0, w: 0, h: 0 }
};

let trashStationButtons = {
    deposit: { x: 0, y: 0, w: 0, h: 0, active: false },
    shift: { x: 0, y: 0, w: 0, h: 0, active: false }
};

let devMenuOpen = false;
let devModeEnabled = false; // F2 открывает только панель. Сам режим включается отдельным переключателем.
let selectedBuilding = null;

const devOptions = {
    editBuildings: false,
    showRoadBounds: false,
    showGrid: false,
    showDistricts: true,
    showStreetNames: true,
    showCoordinates: false,
    showTrashIds: false,
    showPlayerHitboxes: false
};

let devMenuItems = [];
let devMenuBounds = { x: 22, y: 86, w: 760, h: 520 };

function isDevOptionOn(key) {
    return devModeEnabled && !!devOptions[key];
}

function resetDevEditState() {
    selectedBuilding = null;
    if (typeof devSelectedMapObject !== "undefined") devSelectedMapObject = null;
    resizeModeX = false;
    resizeModeY = false;
}

let dragOffsetX = 0;
let dragOffsetY = 0;

let resizeModeX = false;
let resizeModeY = false;

function isChatDomTarget(target) {
    return !!(chatInputEl && target === chatInputEl);
}

window.addEventListener("keydown", (e) => {
    const code = e.code;
    const key = String(e.key || "").toLowerCase();

    // Управление привязано к физическим клавишам через e.code.
    // Так WASD / E / F / I / H работают одинаково на русской, английской
    // и любой другой раскладке клавиатуры.
    keys[code] = true;
    keys[key] = true; // резерв для служебных клавиш и старых браузеров

    if (!isAuthenticated) {
        // Новый чистый DOM-auth (#lc-auth-root) сам обрабатывает ввод, Enter, клики и переключение режимов.
        // Старый canvas-auth обработчик здесь отключён, чтобы не было двойного ввода/двойной отправки.
        if (e.target && (e.target.closest?.("#lc-auth-root") || lcGet?.("lc-auth-root"))) {
            return;
        }
        return;
    }

    if (chatInputFocused || isChatDomTarget(e.target)) {
        // Когда игрок печатает в чате, не перехватываем буквенные клавиши игры.
        // Так ввод работает на любой раскладке, включая русскую.
        keys[code] = false;
        keys[key] = false;
        return;
    }

    if (["KeyW", "KeyA", "KeyS", "KeyD", "KeyE", "KeyF", "KeyI", "KeyH", "KeyP", "F2"].includes(code)) {
        e.preventDefault();
    }

    if (avatarEditorRequired) {
        return;
    }

    if (code === "KeyE") {
        if (nearbyTrash) {
            tryCleanTrash();
        } else {
            tryJobAction();
        }
    }

    if (code === "KeyF" && nearJob && nearJob.type === "trashStation" && !jobConfirmOpen) {
        socket.emit("toggleCleanerShift");
    }

    if (code === "KeyH") {
        hudCompact = !hudCompact;
    }

    if (code === "KeyI") {
        inventoryOpen = !inventoryOpen;
    }

    if (code === "KeyP") {
        toggleProfile();
    }

    // Подтверждение окна работы через физическую клавишу F
    if (jobConfirmOpen && code === "KeyF") {
        confirmJobAction();
    }

    // Закрытие окна работы через Escape
    if (jobConfirmOpen && code === "Escape") {
        cancelJobAction();
    }

    if (avatarEditorOpen && code === "Escape" && !avatarEditorRequired) {
        avatarEditorOpen = false;
    }

    if (shopOpen && code === "Escape") {
        shopOpen = false;
    }

    if (inventoryOpen && code === "Escape") {
        inventoryOpen = false;
    }

    if (profileOpen && code === "Escape") {
        profileOpen = false;
    }

    if (code === "F2") {
        devMenuOpen = !devMenuOpen;
        resetDevEditState();
    }
});

window.addEventListener("keyup", (e) => {
    const code = e.code;
    const key = String(e.key || "").toLowerCase();
    keys[code] = false;
    keys[key] = false;
});

canvas.addEventListener("mousedown", (e) => {

    if (
        devMenuOpen &&
        e.clientX >= devMenuBounds.x &&
        e.clientX <= devMenuBounds.x + devMenuBounds.w &&
        e.clientY >= devMenuBounds.y &&
        e.clientY <= devMenuBounds.y + devMenuBounds.h
    ) {
        return;
    }

    if (typeof devEditorMouseDown === "function" && devEditorMouseDown(e)) {
        e.preventDefault();
        return;
    }
});

canvas.addEventListener("mousemove", (e) => {

    chatMouse.x = e.clientX;
    chatMouse.y = e.clientY;

    if (typeof devEditorMouseMove === "function" && devEditorMouseMove(e)) {
        return;
    }
});

canvas.addEventListener("mouseup", () => {
    if (typeof devEditorMouseUp === "function" && devEditorMouseUp()) {
        return;
    }
});

// ===============================
// 🧩 HUD BUTTON CLICK
// ===============================
canvas.addEventListener("click", (e) => {
    const mx = e.clientX;
    const my = e.clientY;

    if (!isAuthenticated) {
        // Авторизация теперь полностью DOM-слой #lc-auth-root.
        // Canvas-клики старого auth UI не обрабатываем, чтобы не ловить невидимые/нулевые hitbox.
        return;
    }

    // Модальное окно внешности находится поверх всего HUD,
    // поэтому его кнопки должны обрабатываться первыми.
    if (avatarEditorOpen) {
        if (handleAvatarEditorClick(mx, my)) return;
        if (avatarEditorRequired) return;
    }

    if (shopOpen) {
        if (handleShopClick(mx, my)) return;
    }

    if (handleChatClick(mx, my)) {
        return;
    }

    if (handleDevMenuClick(mx, my)) {
        return;
    }

    // Сначала проверяем окно подтверждения работы
    if (jobConfirmOpen) {
        const accept = jobConfirmButtons.accept;
        const cancel = jobConfirmButtons.cancel;

        if (
            mx >= accept.x &&
            mx <= accept.x + accept.w &&
            my >= accept.y &&
            my <= accept.y + accept.h
        ) {
            confirmJobAction();
            return;
        }

        if (
            mx >= cancel.x &&
            mx <= cancel.x + cancel.w &&
            my >= cancel.y &&
            my <= cancel.y + cancel.h
        ) {
            cancelJobAction();
            return;
        }
    }

    if (nearJob && nearJob.type === "trashStation") {
        for (const actionName of ["deposit", "shift"]) {
            const b = trashStationButtons[actionName];
            if (b && b.active && mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                if (actionName === "deposit") socket.emit("depositTrash");
                if (actionName === "shift") socket.emit("toggleCleanerShift");
                return;
            }
        }
    }

    // Кнопка инвентаря на экране
    if (
        mx >= inventoryButton.x &&
        mx <= inventoryButton.x + inventoryButton.w &&
        my >= inventoryButton.y &&
        my <= inventoryButton.y + inventoryButton.h
    ) {
        inventoryOpen = !inventoryOpen;
        return;
    }

    // Кнопка профиля закреплена под кнопкой инвентаря
    if (
        mx >= profileButton.x &&
        mx <= profileButton.x + profileButton.w &&
        my >= profileButton.y &&
        my <= profileButton.y + profileButton.h
    ) {
        toggleProfile();
        return;
    }

    if (inventoryOpen) {
        if (
            mx >= inventoryCloseButton.x &&
            mx <= inventoryCloseButton.x + inventoryCloseButton.w &&
            my >= inventoryCloseButton.y &&
            my <= inventoryCloseButton.y + inventoryCloseButton.h
        ) {
            inventoryOpen = false;
            return;
        }
    }

    if (profileOpen) {
        if (
            mx >= profileCloseButton.x &&
            mx <= profileCloseButton.x + profileCloseButton.w &&
            my >= profileCloseButton.y &&
            my <= profileCloseButton.y + profileCloseButton.h
        ) {
            profileOpen = false;
            return;
        }
    }

    // Кнопка сворачивания HUD
    if (
        mx >= hudButton.x &&
        mx <= hudButton.x + hudButton.w &&
        my >= hudButton.y &&
        my <= hudButton.y + hudButton.h
    ) {
        hudCompact = !hudCompact;
    }
});

canvas.addEventListener("wheel", (e) => {
    const mx = e.clientX;
    const my = e.clientY;

    if (chatMode !== "hidden" && chatChannel === "private" && mx >= chatPrivateListBounds.x && mx <= chatPrivateListBounds.x + chatPrivateListBounds.w && my >= chatPrivateListBounds.y && my <= chatPrivateListBounds.y + chatPrivateListBounds.h) {
        if (chatPrivateListMaxScroll > 0) {
            e.preventDefault();
            chatPrivateListScroll = Math.max(0, Math.min(chatPrivateListMaxScroll, chatPrivateListScroll + e.deltaY));
        }
        return;
    }

    if (chatMode !== "hidden" && mx >= chatBounds.x && mx <= chatBounds.x + chatBounds.w && my >= chatBounds.y && my <= chatBounds.y + chatBounds.h) {
        if (chatMaxScroll > 0) {
            e.preventDefault();
            chatScroll = Math.max(0, Math.min(chatMaxScroll, chatScroll + e.deltaY));
            chatManualScrollUntil = performance.now() + 60000;
            chatAutoScrollPending = false;
        }
        return;
    }

    if (!profileOpen || profileAnim < 0.05 || profileMaxScroll <= 0) return;

    e.preventDefault();
    profileScroll = Math.max(0, Math.min(profileMaxScroll, profileScroll + e.deltaY));
}, { passive: false });

// ===============================
// 🚶 ДВИЖЕНИЕ (CLIENT PREDICTION)
// ===============================
function updateMovement() {

    if (!isAuthenticated || avatarEditorRequired) return;

    if (Number(myPlayer.cleaningUntil) > Date.now()) {
        myPlayer.velX = 0;
        myPlayer.velY = 0;
        myPlayer.moving = false;
        const now = performance.now();
        if (now - lastMoveSend > 120) {
            socket.emit("move", {
                dirX: 0,
                dirY: 0,
                x: myPlayer.x,
                y: myPlayer.y,
                angle: myPlayer.angle,
                targetAngle: myPlayer.targetAngle,
                velX: 0,
                velY: 0
            });
            lastMoveSend = now;
        }
        return;
    }

    const nowFrame = performance.now();
    const dt = clamp((nowFrame - lastMovementFrameTime) / 16.67, 0.35, 2.2);
    lastMovementFrameTime = nowFrame;

    let dirX = 0;
    let dirY = 0;

    if (keys["KeyW"]) dirY = -1;
    if (keys["KeyS"]) dirY = 1;
    if (keys["KeyA"]) dirX = -1;
    if (keys["KeyD"]) dirX = 1;

    const inputLength = getVectorLength(dirX, dirY);

    if (inputLength > 0) {
        dirX /= inputLength;
        dirY /= inputLength;

        myPlayer.targetAngle = Math.atan2(dirY, dirX);
        myPlayer.angle = angleLerp(
            myPlayer.angle,
            myPlayer.targetAngle,
            PLAYER_MOVE_PHYSICS.turnSpeed * dt
        );

        const angleDiff = Math.abs(normalizeAngle(myPlayer.targetAngle - myPlayer.angle));

        // Персонаж сначала разворачивается лицом к направлению движения,
        // и только после достаточного поворота начинает уверенно идти.
        const turnReady = clamp(
            1 - angleDiff / PLAYER_MOVE_PHYSICS.moveAfterAngle,
            0,
            1
        );

        const targetVelX = Math.cos(myPlayer.angle) * myPlayer.maxSpeed * turnReady;
        const targetVelY = Math.sin(myPlayer.angle) * myPlayer.maxSpeed * turnReady;

        myPlayer.velX += (targetVelX - myPlayer.velX) * PLAYER_MOVE_PHYSICS.acceleration * dt;
        myPlayer.velY += (targetVelY - myPlayer.velY) * PLAYER_MOVE_PHYSICS.acceleration * dt;
    } else {
        myPlayer.velX *= Math.pow(PLAYER_MOVE_PHYSICS.friction, dt);
        myPlayer.velY *= Math.pow(PLAYER_MOVE_PHYSICS.friction, dt);

        if (Math.abs(myPlayer.velX) < 0.015) myPlayer.velX = 0;
        if (Math.abs(myPlayer.velY) < 0.015) myPlayer.velY = 0;
    }

    const nextX = myPlayer.x + myPlayer.velX * dt;
    const nextY = myPlayer.y + myPlayer.velY * dt;

    if (!isCollidingWithBuilding(nextX, myPlayer.y)) {
        myPlayer.x = nextX;
    } else {
        myPlayer.velX = 0;
    }

    if (!isCollidingWithBuilding(myPlayer.x, nextY)) {
        myPlayer.y = nextY;
    } else {
        myPlayer.velY = 0;
    }

    const moveSpeed = getVectorLength(myPlayer.velX, myPlayer.velY);
    const isMoving = moveSpeed > 0.035;

    if (isMoving) {
        myPlayer.walkTime += moveSpeed * 0.115 * dt;
    }

    const now = performance.now();

    if (now - lastMoveSend > 16) {
        const serverDirX = myPlayer.maxSpeed > 0 ? myPlayer.velX / myPlayer.maxSpeed : 0;
        const serverDirY = myPlayer.maxSpeed > 0 ? myPlayer.velY / myPlayer.maxSpeed : 0;
        socket.emit("move", {
            dirX: serverDirX,
            dirY: serverDirY,
            x: myPlayer.x,
            y: myPlayer.y,
            angle: myPlayer.angle,
            targetAngle: myPlayer.targetAngle,
            velX: myPlayer.velX,
            velY: myPlayer.velY
        });
        lastMoveSend = now;
    }

    if (isMoving) {
        wasMoving = true;
    } else if (wasMoving) {
        socket.emit("moveStop", {
            x: myPlayer.x,
            y: myPlayer.y,
            angle: myPlayer.angle,
            targetAngle: myPlayer.targetAngle,
            velX: 0,
            velY: 0
        });

        stopCorrectionUntil = performance.now() + 300;
        wasMoving = false;
    }
}




