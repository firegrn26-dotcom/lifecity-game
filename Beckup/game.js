// ===============================
// 🚀 LIFE CITY CLIENT (CLEAN VERSION)
// ===============================

// ===============================
// 🔌 SOCKET
// ===============================
const socket = io();
let myId = null;

socket.on("connect", () => {
    myId = socket.id;
});

// ===============================
// 📶 PING DEBUG
// ===============================
setInterval(() => {
    const start = performance.now();

    socket.emit("pingCheck", start);
}, 1000);

socket.on("pongCheck", (start) => {
    const ping = Math.round(performance.now() - start);
    console.log("Real Ping:", ping + "ms");
});

// ===============================
// 🎮 CANVAS
// ===============================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

// ===============================
// 🎥 КАМЕРА
// ===============================
let camera = {
    x: 0,
    y: 0
};

// ===============================
// 🧍 ЛОКАЛЬНЫЙ ИГРОК (PREDICTION)
// ===============================
let myPlayer = {
    x: 100,
    y: 100,
    speed: 3.3,

    energy: 100,

    money: 0,

    name: "You"
};


// ===============================
// 🌍 ДРУГИЕ ИГРОКИ
// ===============================
let players = {};
let renderPlayers = {};
let lastMoveSend = 0;
let wasMoving = false;
let stopCorrectionUntil = 0;

// плавность других игроков
const remoteSmoothMin = 0.18;
const remoteSmoothMax = 0.55;

// ===============================
// 🎹 КЛАВИШИ
// ===============================
let keys = {};
let nearJob = null;
let lastActionTime = 0;
let devMode = false;
let selectedBuilding = null;

let dragOffsetX = 0;
let dragOffsetY = 0;

let resizeModeX = false;
let resizeModeY = false;

window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();

    keys[key] = true;

    if (key === "e") {
        tryJobAction();
    }
    if (key === "f2") {
    devMode = !devMode;
    console.log("DEV MODE:", devMode ? "ON" : "OFF");
}
});

window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("mousedown", (e) => {

    if (!devMode) return;

    const mouseX = e.clientX + camera.x;
    const mouseY = e.clientY + camera.y;

    for (let b of buildings) {

        if (
            mouseX >= b.x &&
            mouseX <= b.x + b.w &&
            mouseY >= b.y &&
            mouseY <= b.y + b.h
        ) {

            selectedBuilding = b;

            dragOffsetX = mouseX - b.x;
            dragOffsetY = mouseY - b.y;

            resizeModeX = e.shiftKey;
            resizeModeY = e.ctrlKey;

            break;
        }
    }
});

canvas.addEventListener("mousemove", (e) => {

    if (!devMode || !selectedBuilding) return;

    const mouseX = e.clientX + camera.x;
    const mouseY = e.clientY + camera.y;

    // resize X
    if (resizeModeX) {

        selectedBuilding.w = Math.max(
            30,
            Math.round(mouseX - selectedBuilding.x)
        );

        return;
    }

    // resize Y
    if (resizeModeY) {

        selectedBuilding.h = Math.max(
            30,
            Math.round(mouseY - selectedBuilding.y)
        );

        return;
    }

    // move
    selectedBuilding.x =
        Math.round(mouseX - dragOffsetX);

    selectedBuilding.y =
        Math.round(mouseY - dragOffsetY);
});

canvas.addEventListener("mouseup", () => {

    if (!selectedBuilding) return;

    console.log(
        `{ name: "${selectedBuilding.name}", x: ${selectedBuilding.x}, y: ${selectedBuilding.y}, w: ${selectedBuilding.w}, h: ${selectedBuilding.h}, color: "${selectedBuilding.color}" },`
    );

    selectedBuilding = null;
    resizeModeX = false;
    resizeModeY = false;
});

// ===============================
// 🚶 ДВИЖЕНИЕ (CLIENT PREDICTION)
// ===============================
function updateMovement() {

    const speed = myPlayer.speed;

    let dirX = 0;
    let dirY = 0;

    if (keys["w"]) dirY = -1;
    if (keys["s"]) dirY = 1;
    if (keys["a"]) dirX = -1;
    if (keys["d"]) dirX = 1;

    if (dirX !== 0 && dirY !== 0) {
        dirX *= 0.7071;
        dirY *= 0.7071;
    }

    const isMoving = dirX !== 0 || dirY !== 0;

    const nextX = myPlayer.x + dirX * speed;
    const nextY = myPlayer.y + dirY * speed;

    // движение по X
    if (!isCollidingWithBuilding(nextX, myPlayer.y)) {
        myPlayer.x = nextX;
    } else {
        dirX = 0;
    }

    // движение по Y
    if (!isCollidingWithBuilding(myPlayer.x, nextY)) {
        myPlayer.y = nextY;
    } else {
        dirY = 0;
    }



    const now = performance.now();

    if (now - lastMoveSend > 16) {
        socket.emit("move", { dirX, dirY });
        lastMoveSend = now;
    }

    if (isMoving) {
        wasMoving = true;
    } else {
        if (wasMoving) {
socket.emit("moveStop", {
    x: myPlayer.x,
    y: myPlayer.y
});

// даём серверу время принять точную остановку
stopCorrectionUntil = performance.now() + 300;

wasMoving = false;
        }
    }
}



// ===============================
// 🌐 ПОЛУЧЕНИЕ ИГРОКОВ
// ===============================
socket.on("players", (data) => {

    const newRender = {};

    for (let id in data) {

        const serverPlayer = data[id];

        // локальный игрок
if (id === myId) {
    myPlayer.energy = serverPlayer.energy;
    myPlayer.money = serverPlayer.money;
    myPlayer.name = serverPlayer.name;

    const canCorrectAfterStop = performance.now() > stopCorrectionUntil;

if (!wasMoving && canCorrectAfterStop) {
    myPlayer.x += (serverPlayer.x - myPlayer.x) * 0.15;
    myPlayer.y += (serverPlayer.y - myPlayer.y) * 0.15;
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

                energy: serverPlayer.energy,
                money: serverPlayer.money,
                name: serverPlayer.name
            };
        }

        // серверная цель, к которой будем плавно вести игрока
        p.targetX = serverPlayer.x;
        p.targetY = serverPlayer.y;

        p.energy = serverPlayer.energy;
        p.money = serverPlayer.money;
        p.name = serverPlayer.name;

        newRender[id] = p;
    }

    renderPlayers = newRender;
    players = newRender;
});
function updateRemotePlayers() {

    for (let id in players) {

        const p = players[id];
        if (!p) continue;

        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;

        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 0.5) {
    p.x = p.targetX;
    p.y = p.targetY;
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

// ===============================
// 🏷️ НИК
// ===============================
const nameInput = document.createElement("input");
nameInput.placeholder = "Nickname";
nameInput.style.position = "absolute";
nameInput.style.top = "10px";
nameInput.style.left = "10px";
nameInput.style.zIndex = 999;

document.body.appendChild(nameInput);

let nameTimeout;

nameInput.addEventListener("input", () => {

    clearTimeout(nameTimeout);

    nameTimeout = setTimeout(() => {
        const cleanName = nameInput.value.trim().slice(0, 12);
if (cleanName.length > 0) {
    socket.emit("setName", cleanName);
}
    }, 300);
});

// ===============================
// 🏙️ ГОРОД
// ===============================
let buildings = [
    // старые здания — не двигали
    { name: "Банк", x: 495, y: 245, w: 200, h: 150, color: "red" },
    { name: "Аптека", x: 785, y: 295, w: 120, h: 100, color: "green" },
    { name: "Мусорка", x: 635, y: 485, w: 60, h: 60, color: "gray" },

    // новые здания — выровнены по краям дорог
    { name: "Жилой дом", x: 66, y: 184, w: 110, h: 170, color: "#6b6b6b" },

    { name: "Кафе", x: 246, y: 315, w: 120, h: 80, color: "#8b5a2b" },

    { name: "Мэрия", x: 785, y: 184, w: 170, h: 90, color: "#4a6fa5" },

    { name: "Автосервис", x: 984, y: 603, w: 190, h: 110, color: "#555" },

    { name: "Магазин", x: 1254, y: 635, w: 182, h: 81, color: "#b8860b" },

    { name: "Полиция", x: 1615, y: 186, w: 170, h: 130, color: "#1e3a8a" },
];

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

    for (let b of buildings) {

        // ближайшая точка здания к игроку
        const closestX = Math.max(b.x, Math.min(playerCenterX, b.x + b.w));
        const closestY = Math.max(b.y, Math.min(playerCenterY, b.y + b.h));

        const dx = playerCenterX - closestX;
        const dy = playerCenterY - closestY;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= interactDistance) {

            if (b.name === "Мусорка") {
                return {
                    type: "trash",
                    title: "Дворник",
                    text: "Нажми E — устроиться дворником"
                };
            }

            if (b.name === "Аптека") {
                return {
                    type: "heal",
                    title: "Санитар",
                    text: "Нажми E — устроиться санитаром"
                };
            }
        }
    }

    return null;
}

// ===============================
// 👷 JOB ACTION
// ===============================
function tryJobAction() {

    if (!nearJob) return;

    const now = performance.now();

    if (now - lastActionTime < 700) return;

    socket.emit("action", nearJob.type);

    lastActionTime = now;
}

let roads = [
    // старые дороги — не двигали
    { name: "ул. Центральная", x: 0, y: 400, w: 2000, h: 80 },
    { name: "пр. Life City", x: 700, y: 0, w: 80, h: 2000 },
    
    // новые дороги
    { name: "ул. Северная", x: -500, y: 120, w: 2600, h: 60 },
    { name: "ул. Рабочая", x: -500, y: 720, w: 2600, h: 70 },
    { name: "ул. Южная", x: -500, y: 980, w: 2600, h: 60 },
    { name: "ул. Жилая", x: 180, y: -400, w: 60, h: 1800 },
    { name: "ул. Восточная", x: 1180, y: -400, w: 70, h: 1800 },
    { name: "ул. Окраинная", x: 1550, y: -400, w: 60, h: 1800 }, 
    { name: "ул. Торговая", x: 1250, y: 590, w: 190, h: 40 }
];

let showRoadDebug = true;


// ===============================
// 🛣️ ROAD DEBUG
// ===============================
function drawRoadDebug() {

    if (!showRoadDebug) return;

    ctx.save();

    for (let i = 0; i < roads.length; i++) {

        const r = roads[i];

        const sx = r.x - camera.x;
        const sy = r.y - camera.y;

        const ex = r.x + r.w;
        const ey = r.y + r.h;

        // рамка дороги
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 2;
        ctx.strokeRect(sx, sy, r.w, r.h);

        // начало дороги
        ctx.fillStyle = "lime";
        ctx.fillRect(sx - 4, sy - 4, 8, 8);

        // конец дороги
        ctx.fillStyle = "red";
        ctx.fillRect(ex - camera.x - 4, ey - camera.y - 4, 8, 8);

        // подпись начала
        ctx.fillStyle = "lime";
        ctx.font = "12px Arial";
        ctx.fillText(
            `R${i} START (${r.x}, ${r.y})`,
            sx + 5,
            sy + 15
        );

        // подпись конца
        ctx.fillStyle = "red";
        ctx.font = "12px Arial";
        ctx.fillText(
            `END (${ex}, ${ey})`,
            ex - camera.x - 95,
            ey - camera.y - 8
        );
    }

    ctx.restore();
}

let districts = [
    // верхняя левая часть города
    { name: "Жилой сектор", x: -500, y: -400, w: 680, h: 520 },

    // верхний центр
    { name: "Центральный район", x: 180, y: -400, w: 520, h: 520 },

    // верхняя правая административная часть
    { name: "Административный квартал", x: 700, y: -400, w: 480, h: 520 },

    // восточная часть
    { name: "Северный район", x: 1180, y: -400, w: 930, h: 520 },

    // средняя левая часть
    { name: "Старый город", x: -500, y: 120, w: 680, h: 600 },

    // средний центр
    { name: "Деловой центр", x: 180, y: 120, w: 520, h: 600 },

    // средняя правая часть
    { name: "Торговый район", x: 700, y: 120, w: 480, h: 600 },

    // правый средний сектор
    { name: "Промышленный район", x: 1180, y: 120, w: 930, h: 600 },

    // нижняя левая часть
    { name: "Южный жилой район", x: -500, y: 720, w: 680, h: 700 },

    // нижний центр
    { name: "Рабочая зона", x: 180, y: 720, w: 520, h: 700 },

    // нижняя правая часть
    { name: "Сервисный район", x: 700, y: 720, w: 480, h: 700 },

    // дальний восток
    { name: "Восточный район", x: 1180, y: 720, w: 930, h: 700 }
];


// ===============================
// 📍 LOCATION DETECTION
// ===============================
function getCurrentDistrict() {

    const px = myPlayer.x + 10;
    const py = myPlayer.y + 10;

    for (let d of districts) {

        if (
            px >= d.x &&
            px <= d.x + d.w &&
            py >= d.y &&
            py <= d.y + d.h
        ) {
            return d.name;
        }
    }

    return "Вне района";
}

function getCurrentStreet() {

    const px = myPlayer.x + 10;
    const py = myPlayer.y + 10;

    let closestRoad = null;
    let closestDist = Infinity;

    for (let r of roads) {

        const closestX = Math.max(r.x, Math.min(px, r.x + r.w));
        const closestY = Math.max(r.y, Math.min(py, r.y + r.h));

        const dx = px - closestX;
        const dy = py - closestY;

        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < closestDist) {
            closestDist = dist;
            closestRoad = r;
        }
    }

    if (!closestRoad) return "Неизвестная улица";

    return closestRoad.name || "Безымянная дорога";
}


// ===============================
// 🎨 РЕНДЕР
// ===============================
function draw() {

    // фон (ОБЯЗАТЕЛЬНО ПЕРВЫМ)
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // районы
for (let d of districts) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.fillRect(
        d.x - camera.x,
        d.y - camera.y,
        d.w,
        d.h
    );

    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 2;
    ctx.strokeRect(
        d.x - camera.x,
        d.y - camera.y,
        d.w,
        d.h
    );

    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.font = "bold 18px Arial";
    ctx.fillText(
        d.name,
        d.x - camera.x + 15,
        d.y - camera.y + 28
    );
}

    // дороги
    for (let r of roads) {
        ctx.fillStyle = "#2a2a2a";
        ctx.fillRect(
            r.x - camera.x,
            r.y - camera.y,
            r.w,
            r.h
        );
    }

    drawRoadDebug();


 // названия улиц на самих дорогах
ctx.save();

ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
ctx.font = "bold 14px Arial";
ctx.textAlign = "center";
ctx.textBaseline = "middle";

for (let r of roads) {

    if (!r.name) continue;

    const centerX = r.x + r.w / 2 - camera.x;
    const centerY = r.y + r.h / 2 - camera.y;

    // если вертикальная дорога
    if (r.h > r.w) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(r.name, 0, 0);
        ctx.restore();
    } else {
        ctx.fillText(r.name, centerX, centerY);
    }
}

ctx.restore();

// ===============================
// 🗺 СЕТКА + ПОДПИСИ (OPTIMIZED FIX)
// ===============================

const gridSize = 100;
const labelStep = 100;

const left = camera.x;
const right = camera.x + canvas.width;
const top = camera.y;
const bottom = camera.y + canvas.height;

const padding = 200;

// ===============================
// 🟩 СЕТКА
// ===============================

const startX = Math.floor((left - padding) / gridSize) * gridSize;
const endX = Math.ceil((right + padding) / gridSize) * gridSize;

const startY = Math.floor((top - padding) / gridSize) * gridSize;
const endY = Math.ceil((bottom + padding) / gridSize) * gridSize;

ctx.strokeStyle = "#555";
ctx.lineWidth = 1;

// вертикальные линии
for (let x = startX; x <= endX; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x - camera.x, 0);
    ctx.lineTo(x - camera.x, canvas.height);
    ctx.stroke();
}

// горизонтальные линии
for (let y = startY; y <= endY; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y - camera.y);
    ctx.lineTo(canvas.width, y - camera.y);
    ctx.stroke();
}

// ===============================
// 🔢 ПОДПИСИ (OPTIMIZED)
// ===============================

const labelStartX = Math.floor((left - padding) / labelStep) * labelStep;
const labelEndX = Math.ceil((right + padding) / labelStep) * labelStep;

const labelStartY = Math.floor((top - padding) / labelStep) * labelStep;
const labelEndY = Math.ceil((bottom + padding) / labelStep) * labelStep;

ctx.fillStyle = "#888";
ctx.font = "12px Arial";

// X подписи
for (let x = labelStartX; x <= labelEndX; x += labelStep) {

    const screenX = x - camera.x;

    if (screenX < -50 || screenX > canvas.width + 50) continue;

    ctx.fillText(
        x,
        screenX + 5,
        15
    );
}

// Y подписи
for (let y = labelStartY; y <= labelEndY; y += labelStep) {

    const screenY = y - camera.y;

    if (screenY < -50 || screenY > canvas.height + 50) continue;

    ctx.fillText(
        y,
        5,
        screenY - 5
    );
}

    // здания
for (let b of buildings) {
    const screenX = b.x - camera.x;
    const screenY = b.y - camera.y;

    ctx.fillStyle = b.color;
    ctx.fillRect(
        screenX,
        screenY,
        b.w,
        b.h
    );

    // название здания по центру
    ctx.fillStyle = "white";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        b.name,
        screenX + b.w / 2,
        screenY + b.h / 2
    );

    // возвращаем настройки текста обратно
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

    // игроки
    for (let id in players) {

    if (id === myId) continue;

    let p = players[id];

    ctx.fillStyle = "white";

    ctx.fillRect(
        p.x - camera.x,
        p.y - camera.y,
        20,
        20
    );

    ctx.fillStyle = "white";
    ctx.font = "12px Arial";

    ctx.fillText(
        p.name || "Player",
        p.x - camera.x,
        p.y - camera.y - 10
    );
}
    // ===============================
// 🧍 ЛОКАЛЬНЫЙ ИГРОК
// ===============================

ctx.fillStyle = "lime";

ctx.fillRect(
    myPlayer.x - camera.x,
    myPlayer.y - camera.y,
    20,
    20
);

    ctx.fillStyle = "white";
    ctx.font = "12px Arial";

    ctx.fillText(
    myPlayer.name || "You",
    myPlayer.x - camera.x,
    myPlayer.y - camera.y - 10
);

// ===============================
// 👷 JOB HINT UI
// ===============================
nearJob = getNearbyJob();

if (nearJob) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(canvas.width / 2 - 170, canvas.height - 90, 340, 50);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 - 170, canvas.height - 90, 340, 50);

    ctx.fillStyle = "white";
    ctx.font = "bold 16px Arial";
    ctx.fillText(
        nearJob.text,
        canvas.width / 2 - 140,
        canvas.height - 58
    );
}

// ===============================
// 🛠 DEV MODE UI
// ===============================
if (devMode) {

    ctx.fillStyle = "rgba(0,0,0,0.80)";
    ctx.fillRect(
        20,
        canvas.height - 125,
        460,
        100
    );

    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 2;
    ctx.strokeRect(
        20,
        canvas.height - 125,
        460,
        100
    );

    ctx.fillStyle = "yellow";
    ctx.font = "bold 16px Arial";
    ctx.fillText(
        "DEV MODE ON",
        35,
        canvas.height - 96
    );

    ctx.fillStyle = "white";
    ctx.font = "13px Arial";

    ctx.fillText(
        "ЛКМ = двигать здание",
        35,
        canvas.height - 72
    );

    ctx.fillText(
        "SHIFT + ЛКМ = изменить ширину X",
        35,
        canvas.height - 52
    );

    ctx.fillText(
        "CTRL + ЛКМ = изменить высоту Y",
        35,
        canvas.height - 32
    );

    ctx.fillText(
        "F2 = выключить | результат в Console",
        245,
        canvas.height - 32
    );
}

// ===============================
// 🔋 ENERGY BAR (GTA/RUST STYLE)
// ===============================

// процент энергии
const percent = Math.max(0, Math.min(1, (myPlayer.energy || 0) / 100));

// плавный цвет
const red = Math.floor(255 * (1 - percent));
const green = Math.floor(255 * percent);

// фон
ctx.fillStyle = "#1a1a1a";
ctx.fillRect(canvas.width - 260, 20, 220, 35);

// заполнение
ctx.fillStyle = `rgb(${red}, ${green}, 0)`;

ctx.fillRect(
    canvas.width - 258,
    22,
    percent * 216,
    31
);


// текст
ctx.fillStyle = "white";
ctx.font = "bold 16px Arial";


// рамка
ctx.strokeStyle = "#ffffff";
ctx.lineWidth = 2;
ctx.strokeRect(canvas.width - 260, 20, 220, 35);

// текст
ctx.fillStyle = "#ffffff";
ctx.font = "bold 16px Arial";

ctx.fillText(
    `Энергия: ${Math.floor(myPlayer.energy || 0)}%`,
    canvas.width - 245,
    43
);

    // ===============================
    // 💰 MONEY UI
    // ===============================

    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial";

    ctx.fillText(
        "$ " + Math.floor(myPlayer.money || 0),
        canvas.width - 250,
         90
    );

    // ===============================
// 📍 LOCATION UI
// ===============================
const districtName = getCurrentDistrict();
const streetName = getCurrentStreet();

ctx.fillStyle = "#cccccc";
ctx.font = "14px Arial";

ctx.fillText(
    "Район: " + districtName,
    canvas.width - 250,
    115
);

ctx.fillText(
    "Улица: " + streetName,
    canvas.width - 250,
    135
);
}
function updateCamera() {

    const smooth = 0.08;

    const targetX = myPlayer.x - canvas.width / 2;
    const targetY = myPlayer.y - canvas.height / 2;

    camera.x += (targetX - camera.x) * smooth;
    camera.y += (targetY - camera.y) * smooth;
}
// ===============================
// 🔄 LOOP
// ===============================
function loop() {

    updateMovement();

    updateRemotePlayers();

    updateCamera();

    draw();

    requestAnimationFrame(loop);
}


loop();