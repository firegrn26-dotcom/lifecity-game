// ===============================
// 🌐 ПОЛУЧЕНИЕ ИГРОКОВ
// ===============================
socket.on("players", (data) => {

    const newRender = {};

    for (let id in data) {

        const serverPlayer = data[id];

        // локальный игрок
if (id === myId) {
    const nextMoney = Number(serverPlayer.money) || 0;
    const nextXP = Number(serverPlayer.xp) || 0;
    const nextLevel = Number(serverPlayer.level) || 1;
    const nextJobXP = Number(serverPlayer.jobXP) || 0;
    const nextJobLevel = Number(serverPlayer.jobLevel) || 1;

    if (!hudPreviousStats) {
        // Первый пакет от сервера не считается получением награды.
        // HUD сразу принимает реальные значения, чтобы не было ложной анимации при входе.
        hudDisplay.money = nextMoney;
        hudDisplay.xp = nextXP;
        hudDisplay.jobXP = nextJobXP;
        hudDisplay.energy = Number(serverPlayer.energy) || 100;
    } else {
        const moneyGain = nextMoney - hudPreviousStats.money;
        if (moneyGain > 0) {
            addHudFloatingText(moneyGain, "gold", "money", "+$", "");
        }

        const levelGain = nextLevel - hudPreviousStats.level;
        const xpGain = levelGain > 0
            ? nextXP + (hudPreviousStats.level * 100 - hudPreviousStats.xp)
            : nextXP - hudPreviousStats.xp;

        if (xpGain > 0) {
            addHudFloatingText(xpGain, UI.purple, "xp", "+", " XP");
        }

        const jobLevelGain = nextJobLevel - hudPreviousStats.jobLevel;
        const jobXPGain = jobLevelGain > 0
            ? nextJobXP + (hudPreviousStats.jobLevel * 100 - hudPreviousStats.jobXP)
            : nextJobXP - hudPreviousStats.jobXP;

        if (jobXPGain > 0) {
            addHudFloatingText(jobXPGain, UI.green, "job", "+", " XP");
        }
    }

    hudPreviousStats = {
        money: nextMoney,
        xp: nextXP,
        level: nextLevel,
        jobXP: nextJobXP,
        jobLevel: nextJobLevel
    };

    myPlayer.energy = serverPlayer.energy;
    myPlayer.money = serverPlayer.money;
    myPlayer.level = serverPlayer.level;
    myPlayer.xp = serverPlayer.xp;
    myPlayer.job = serverPlayer.job;
    myPlayer.jobLevel = serverPlayer.jobLevel;
    myPlayer.jobXP = serverPlayer.jobXP;
    myPlayer.inventory = serverPlayer.inventory || { trash: 0, trashMax: 10, slots: 10 };
    myPlayer.hasBackpack = !!serverPlayer.hasBackpack;
    myPlayer.cleanerOnShift = !!serverPlayer.cleanerOnShift;

    // Серверная синхронизация процесса уборки.
    // Без этих полей локальный игрок продолжал ходить,
    // а шкала/анимация уборки не включались.
    const prevLocalCleaningUntil = Number(myPlayer.cleaningUntil) || 0;
    myPlayer.cleaningTrashId = serverPlayer.cleaningTrashId || null;
    myPlayer.cleaningStartedAt = Number(serverPlayer.cleaningStartedAt) || 0;
    myPlayer.cleaningUntil = Number(serverPlayer.cleaningUntil) || 0;
    if (myPlayer.cleaningUntil > Date.now()) {
        myPlayer.velX = 0;
        myPlayer.velY = 0;
        myPlayer.moving = false;
        wasMoving = false;
    } else if (prevLocalCleaningUntil > 0 && prevLocalCleaningUntil <= Date.now()) {
        myPlayer.cleaningTrashId = null;
        myPlayer.cleaningStartedAt = 0;
        myPlayer.cleaningUntil = 0;
    }

    myPlayer.avatar = normalizeAvatarClient(serverPlayer.avatar);
    myPlayer.standardAvatar = normalizeAvatarClient(serverPlayer.standardAvatar || serverPlayer.avatar);
    myPlayer.name = serverPlayer.name;

    const canCorrectAfterStop = performance.now() > stopCorrectionUntil;

if (!wasMoving && canCorrectAfterStop) {
    myPlayer.x += (serverPlayer.x - myPlayer.x) * 0.15;
    myPlayer.y += (serverPlayer.y - myPlayer.y) * 0.15;
    if (Number.isFinite(Number(serverPlayer.angle))) {
        myPlayer.angle = angleLerp(myPlayer.angle, Number(serverPlayer.angle), 0.18);
        myPlayer.targetAngle = Number(serverPlayer.targetAngle ?? serverPlayer.angle);
    }
}

    continue;
    }

        let p = renderPlayers[id];

        // если игрок появился впервые
        if (!p) {
            p = {
                x: serverPlayer.x,
                y: serverPlayer.y,

                targetX: serverPlayer.x,
                targetY: serverPlayer.y,
                angle: Number.isFinite(Number(serverPlayer.angle)) ? Number(serverPlayer.angle) : -Math.PI / 2,
                targetAngle: Number.isFinite(Number(serverPlayer.targetAngle)) ? Number(serverPlayer.targetAngle) : (Number.isFinite(Number(serverPlayer.angle)) ? Number(serverPlayer.angle) : -Math.PI / 2),
                serverMoving: !!serverPlayer.moving,
                walkTime: 0,
                cleaningTrashId: serverPlayer.cleaningTrashId || null,
                cleaningStartedAt: Number(serverPlayer.cleaningStartedAt) || 0,
                cleaningUntil: Number(serverPlayer.cleaningUntil) || 0,

                energy: serverPlayer.energy,
                money: serverPlayer.money,
                name: serverPlayer.name,
                avatar: normalizeAvatarClient(serverPlayer.avatar)
            };
        }

        // серверная цель, к которой будем плавно вести игрока
        p.targetX = serverPlayer.x;
        p.targetY = serverPlayer.y;
        p.serverAngle = Number.isFinite(Number(serverPlayer.angle)) ? Number(serverPlayer.angle) : p.targetAngle;
        p.serverTargetAngle = Number.isFinite(Number(serverPlayer.targetAngle)) ? Number(serverPlayer.targetAngle) : p.serverAngle;
        p.serverMoving = !!serverPlayer.moving;
        p.cleaningTrashId = serverPlayer.cleaningTrashId || null;
        p.cleaningStartedAt = Number(serverPlayer.cleaningStartedAt) || 0;
        p.cleaningUntil = Number(serverPlayer.cleaningUntil) || 0;

        if (Number(p.cleaningUntil) > Date.now()) {
            p.serverMoving = false;
        }

        p.energy = serverPlayer.energy;
        p.money = serverPlayer.money;
        p.name = serverPlayer.name;
        p.avatar = normalizeAvatarClient(serverPlayer.avatar);

        newRender[id] = p;
    }

    renderPlayers = newRender;
    players = newRender;
});


socket.on("trashCleaningStarted", (data) => {
    const until = Number(data?.until) || 0;
    const startedAt = Number(data?.startedAt) || Date.now();
    const trashId = data?.trashId || null;

    if (data?.socketId === myId || Number(data?.playerId) === Number(myPlayer.playerId || 0)) {
        myPlayer.cleaningTrashId = trashId;
        myPlayer.cleaningStartedAt = startedAt;
        myPlayer.cleaningUntil = until;
        myPlayer.velX = 0;
        myPlayer.velY = 0;
        myPlayer.moving = false;
        wasMoving = false;
    }

    for (const id in renderPlayers) {
        const p = renderPlayers[id];
        if (!p) continue;
        if (id === data?.socketId || Number(p.playerId || 0) === Number(data?.playerId || -1)) {
            p.cleaningTrashId = trashId;
            p.cleaningStartedAt = startedAt;
            p.cleaningUntil = until;
            p.serverMoving = false;
            break;
        }
    }
});

socket.on("trashItems", (data) => {
    trashItems = data || {};

    // Если сервер уже удалил мусор после поднятия, сразу очищаем локальную цель.
    // Это убирает повторную отрисовку действия и повторные попытки поднятия.
    if (nearbyTrash && nearbyTrash.id && !trashItems[nearbyTrash.id]) {
        nearbyTrash = null;
        lastTrashPickupId = null;
    }
});

socket.on("profileData", (data) => {
    profileData = data || null;
    profileLoading = false;
});

function showInventoryNotice(title, text, color = UI.yellow, icon = "ℹ") {
    inventoryNotice = {
        title,
        text,
        color,
        icon,
        createdAt: performance.now(),
        duration: 3200
    };
}

socket.on("inventoryFull", (data) => {
    trashPickupLockedUntil = performance.now() + 250;
    showInventoryNotice(
        data?.title || "ИНВЕНТАРЬ ЗАПОЛНЕН",
        data?.text || "Больше мусор поднять нельзя.",
        UI.red,
        data?.icon || "⚠"
    );
});

socket.on("inventoryNotice", (data) => {
    trashPickupLockedUntil = performance.now() + 250;
    showInventoryNotice(
        data?.title || "ИНВЕНТАРЬ",
        data?.text || "Действие выполнено.",
        data?.color === "red" ? UI.red : data?.color === "yellow" ? UI.yellow : UI.green,
        data?.icon || "ℹ"
    );
});

function getNearbyTrash() {
    if (myPlayer.job !== "Дворник" || !myPlayer.cleanerOnShift) return null;
    if (Number(myPlayer.cleaningUntil) > Date.now()) return null;

    const px = myPlayer.x + 10;
    const py = myPlayer.y + 10;

    for (let id in trashItems) {
        const t = trashItems[id];

        const dx = px - t.x;
        const dy = py - t.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 16) {
            return t;
        }
    }

    return null;
}

function tryCleanTrash() {
    if (!nearbyTrash || !nearbyTrash.id) return;

    const now = performance.now();

    // Защита от зависаний/спама: keydown может повторяться десятки раз,
    // пока клавиша E зажата. Одно поднятие мусора = один серверный запрос.
    if (now < trashPickupLockedUntil) return;
    if (lastTrashPickupId === nearbyTrash.id && now - lastTrashPickupAttempt < 700) return;

    lastTrashPickupAttempt = now;
    trashPickupLockedUntil = now + 1100;
    lastTrashPickupId = nearbyTrash.id;

    socket.emit("cleanTrash", nearbyTrash.id);
}

function updateRemotePlayers() {

    for (let id in players) {

        const p = players[id];
        if (!p) continue;

        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        // Направление других игроков больше не вычисляется только по координатам.
        // Сервер присылает фактический угол, особенно важный при остановке.
        const desiredAngle = Number.isFinite(Number(p.serverAngle))
            ? Number(p.serverAngle)
            : (distance > 0.35 ? Math.atan2(dy, dx) : (p.angle ?? -Math.PI / 2));

        p.targetAngle = desiredAngle;
        p.angle = angleLerp(p.angle ?? desiredAngle, desiredAngle, 0.16);

        if (p.serverMoving || distance > 0.6) {
            p.walkTime = (p.walkTime || 0) + Math.min(distance, 10) * 0.014;
        }

        if (distance < 0.5) {
    p.x = p.targetX;
    p.y = p.targetY;
    if (!p.serverMoving) p.angle = angleLerp(p.angle ?? desiredAngle, desiredAngle, 0.20);
    continue;
}

        if (distance > 200) {
            p.x = p.targetX;
            p.y = p.targetY;
            continue;
        }

const smooth = Math.min(
    remoteSmoothMax,
    remoteSmoothMin + distance / 180
);

        p.x += dx * smooth;
        p.y += dy * smooth;
    }
}

