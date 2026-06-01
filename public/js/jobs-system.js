// ===============================
// 💼 JOBS SYSTEM — работа, действия, коллизии с зданиями
// Вынесено из jobs.js в UrbanRebuild modular refactor.
// ===============================
// 🧱 COLLISION CHECK
// ===============================
function isCollidingWithBuilding(x, y) {

    const playerSize = 20;

    for (let b of buildings) {

        const playerLeft = x;
        const playerRight = x + playerSize;
        const playerTop = y;
        const playerBottom = y + playerSize;

        const buildingLeft = b.x;
        const buildingRight = b.x + b.w;
        const buildingTop = b.y;
        const buildingBottom = b.y + b.h;

        const isColliding =
            playerLeft < buildingRight &&
            playerRight > buildingLeft &&
            playerTop < buildingBottom &&
            playerBottom > buildingTop;

        if (isColliding) {
            return true;
        }
    }

    return false;
}

// ===============================
// 👷 JOB DETECTION
// ===============================
function getNearbyJob() {

    const playerCenterX = myPlayer.x + 10;
    const playerCenterY = myPlayer.y + 10;
    const interactDistance = 20;

    const currentJob = myPlayer.job || "Без работы";
    const hasJob = currentJob !== "Без работы";

    for (let b of buildings) {

        // Ближайшая точка здания к игроку
        const closestX = Math.max(b.x, Math.min(playerCenterX, b.x + b.w));
        const closestY = Math.max(b.y, Math.min(playerCenterY, b.y + b.h));

        const dx = playerCenterX - closestX;
        const dy = playerCenterY - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > interactDistance) continue;

        // ===============================
        // 🧹 МУСОРКА — РАБОТА ДВОРНИКОМ
        // ===============================
        if (b.name === "Мусорка") {

            if (currentJob === "Дворник") {
                const trashCount = myPlayer.inventory?.trash || 0;
                const trashMax = myPlayer.inventory?.trashMax || 10;

                return {
                    type: "trashStation",
                    title: "Мусорка",
                    text: myPlayer.cleanerOnShift ? "Ты на смене" : "Ты не на смене",
                    trashCount,
                    trashMax,
                    onShift: !!myPlayer.cleanerOnShift
                };
            }

            if (hasJob) {
                return {
                    type: "noJob",
                    title: "Мусорка",
                    text: "Сначала уволься с текущей работы"
                };
            }

            return {
                type: "trash",
                title: "Дворник",
                text: "Нажми E — устроиться дворником"
            };
        }

        // ===============================
        // 🧰 АПТЕКА — РАБОТА САНИТАРОМ
        // ===============================
        if (b.name === "Аптека") {

            if (currentJob === "Санитар") {
                return {
                    type: "noJob",
                    title: "Аптека",
                    text: "Ты уже работаешь санитаром"
                };
            }

            if (hasJob) {
                return {
                    type: "noJob",
                    title: "Аптека",
                    text: "Сначала уволься с текущей работы"
                };
            }

            return {
                type: "heal",
                title: "Санитар",
                text: "Нажми E — устроиться санитаром"
            };
        }

        // ===============================
        // 🏛️ МЭРИЯ — УВОЛЬНЕНИЕ
        // ===============================
        if (b.name === "Мэрия") {

            if (!hasJob) {
                return {
                    type: "noJob",
                    title: "Мэрия",
                    text: "Ты безработный"
                };
            }

            const trashCount = myPlayer.inventory?.trash || 0;

            if (currentJob === "Дворник" && trashCount > 0) {
                return {
                    type: "noJob",
                    title: "Мэрия",
                    text: "Сначала сдай мусор"
                };
            }

            return {
                type: "quitJob",
                title: "Мэрия",
                text: "Нажми E — уволиться с работы"
            };
        }

        // ===============================
        // 🛒 МАГАЗИН — ПОКУПКА ПРЕДМЕТОВ
        // ===============================
        if (b.name === "Магазин") {
            return {
                type: "shop",
                title: "Магазин",
                text: "Нажми E — открыть магазин"
            };
        }
    }

    return null;
}

// ===============================
// 👷 JOB ACTION
// ===============================
// Функция открывает окно подтверждения работы или увольнения.
// Если доступного действия нет, клавиша E ничего не делает.
function tryJobAction() {

    if (!nearJob) return;

    if (nearJob.type === "noJob") {
        return;
    }

    if (nearJob.type === "shop") {
        shopOpen = true;
        avatarEditorOpen = false;
        return;
    }

    if (nearJob.type === "depositTrash") {
        const nowDeposit = performance.now();
        if (nowDeposit - lastActionTime < 300) return;
        socket.emit("depositTrash");
        lastActionTime = nowDeposit;
        return;
    }

    if (nearJob.type === "trashStation") {
        const trashCount = Number(myPlayer.inventory?.trash) || 0;
        const nowDeposit = performance.now();

        // Быстрая сдача мусора по E у мусорки.
        // Сервер всё равно финально проверяет профессию, дистанцию и наличие мусора.
        if (trashCount > 0 && nowDeposit - lastActionTime >= 300) {
            socket.emit("depositTrash");
            lastActionTime = nowDeposit;
        }
        return;
    }

    const now = performance.now();

    if (now - lastActionTime < 300) return;

    jobConfirmOpen = true;
    jobConfirmData = nearJob;

    lastActionTime = now;
}

// Функция подтверждает действие: устроиться или уволиться
function confirmJobAction() {

    if (!jobConfirmOpen || !jobConfirmData) return;

    if (jobConfirmData.type === "noJob") {
        cancelJobAction();
        return;
    }

    if (jobConfirmData.type === "buyBackpack") {
        socket.emit("buyBackpack");
    } else {
        socket.emit("action", jobConfirmData.type);
    }

    jobConfirmOpen = false;
    jobConfirmData = null;
}

// Функция закрывает окно подтверждения без действия
function cancelJobAction() {

    jobConfirmOpen = false;
    jobConfirmData = null;
}

