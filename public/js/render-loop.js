// ===============================
// 🎚️ LIFE CITY 2.5D STAGE 3 — ГЛУБИНА, ПЕРСОНАЖ, КАМЕРА
// ===============================
const CAMERA_25D = {
    smooth: 0.105,
    lookAhead: 72,
    verticalOffset: 34,
    maxStep: 80
};

function getWorldBounds25D() {
    const xs = [];
    const ys = [];
    for (const b of buildings || []) {
        xs.push(b.x, b.x + b.w);
        ys.push(b.y, b.y + b.h);
    }
    for (const r of roads || []) {
        for (const pt of r.points || []) {
            xs.push(pt.x);
            ys.push(pt.y);
        }
    }
    if (!xs.length || !ys.length) return { minX: -500, minY: -500, maxX: 2600, maxY: 1900 };
    return {
        minX: Math.min(...xs) - 420,
        minY: Math.min(...ys) - 420,
        maxX: Math.max(...xs) + 420,
        maxY: Math.max(...ys) + 420
    };
}

function clampCamera25D(targetX, targetY) {
    const bounds = getWorldBounds25D();
    const minX = bounds.minX;
    const minY = bounds.minY;
    const maxX = Math.max(minX, bounds.maxX - canvas.width);
    const maxY = Math.max(minY, bounds.maxY - canvas.height);
    return {
        x: clamp(targetX, minX, maxX),
        y: clamp(targetY, minY, maxY)
    };
}

function getPlayerDepth25D(p) {
    return (p.y || 0) + PLAYER_SIZE + 10;
}

function getBuildingDepth25D(b) {
    const heightLift = Math.min(76, Math.max(24, (b.h || 80) * 0.22));
    return (b.y || 0) + (b.h || 0) + heightLift * 0.18;
}

function getTrashDepth25D(t) {
    return (t.y || 0) + 8;
}

function drawCharacterGroundShadow25D(player, options = {}) {
    const cx = player.x + PLAYER_SIZE / 2 - camera.x;
    const cy = player.y + PLAYER_SIZE / 2 - camera.y;
    const isLocal = !!options.isLocal;
    const speed = getVectorLength(player.velX || 0, player.velY || 0);
    const stretch = clamp(speed / (player.maxSpeed || 2.45), 0, 1);

    ctx.save();
    ctx.translate(cx + 2, cy + 13);
    ctx.rotate(0.08);
    const shadow = ctx.createRadialGradient(0, 0, 1, 0, 0, 22);
    shadow.addColorStop(0, isLocal ? "rgba(0,0,0,0.38)" : "rgba(0,0,0,0.30)");
    shadow.addColorStop(0.72, "rgba(0,0,0,0.16)");
    shadow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16 + stretch * 4, 7 + stretch * 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawTrashItem25D(id, t) {
    const nowMs = Date.now();
    const cleaningStartedAt = Number(t.cleaningStartedAt) || nowMs;
    const cleaningUntil = Number(t.cleaningUntil) || 0;
    const cleaningActive = cleaningUntil > nowMs;
    const cleanProgress = cleaningActive
        ? clamp((nowMs - cleaningStartedAt) / Math.max(1, cleaningUntil - cleaningStartedAt), 0, 1)
        : 0;
    const trashAlpha = cleaningActive ? Math.max(0.12, 1 - cleanProgress * 0.88) : 1;
    const trashScale = cleaningActive ? Math.max(0.45, 1 - cleanProgress * 0.48) : 1;

    ctx.save();
    ctx.globalAlpha = trashAlpha;
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(trashScale, trashScale);

    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(1.5, 5.5, 9, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = cleaningActive ? "#6f6f6f" : "#7a7a7a";
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#bdbdbd";
    ctx.beginPath();
    ctx.arc(-3, -2, 3, 0, Math.PI * 2);
    ctx.fill();

    if (cleaningActive) {
        ctx.strokeStyle = "rgba(255,195,51,0.65)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cleanProgress);
        ctx.stroke();
    }

    ctx.restore();

    if (isDevOptionOn("showTrashIds")) {
        ctx.fillStyle = UI.yellow;
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(id, t.x - camera.x, t.y - camera.y - 12);
    }
}

function drawWorldEntity25D(item) {
    if (item.kind === "building") {
        drawStyledBuilding(item.data);
        return;
    }
    if (item.kind === "trash") {
        drawTrashItem25D(item.id, item.data);
        return;
    }
    if (item.kind === "player") {
        drawCharacterGroundShadow25D(item.data, { isLocal: item.isLocal });
        drawHumanCharacter(item.data, { isLocal: item.isLocal });
        if (isDevOptionOn("showPlayerHitboxes")) {
            ctx.strokeStyle = UI.yellow;
            ctx.lineWidth = 1.2;
            ctx.strokeRect(item.data.x - camera.x, item.data.y - camera.y, PLAYER_SIZE, PLAYER_SIZE);
        }
    }
}

function drawDepthSortedWorld25D() {
    const items = [];

    for (const b of buildings) {
        items.push({ kind: "building", data: b, depth: getBuildingDepth25D(b), x: b.x || 0 });
    }

    for (const id in trashItems) {
        const t = trashItems[id];
        items.push({ kind: "trash", id, data: t, depth: getTrashDepth25D(t), x: t.x || 0 });
    }

    for (const id in players) {
        if (id === myId) continue;
        const p = players[id];
        items.push({ kind: "player", id, data: p, isLocal: false, depth: getPlayerDepth25D(p), x: p.x || 0 });
    }

    items.push({ kind: "player", id: "local", data: myPlayer, isLocal: true, depth: getPlayerDepth25D(myPlayer), x: myPlayer.x || 0 });

    items.sort((a, b) => (a.depth - b.depth) || (a.x - b.x));

    for (const item of items) drawWorldEntity25D(item);
}

function drawDepthDebug25D() {
    if (!isDevOptionOn("showPlayerHitboxes")) return;
    ctx.save();
    ctx.fillStyle = "rgba(255,195,51,0.86)";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText("depth", myPlayer.x + PLAYER_SIZE / 2 - camera.x, myPlayer.y + PLAYER_SIZE + 24 - camera.y);
    ctx.restore();
}

// ===============================
// 🎨 РЕНДЕР
// ===============================
function draw() {

    // фон (ОБЯЗАТЕЛЬНО ПЕРВЫМ)
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // районы
if (isDevOptionOn("showDistricts")) {
for (let d of districts) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.fillRect(
        d.x - camera.x,
        d.y - camera.y,
        d.w,
        d.h
    );

    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1.2;
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
}

    // мегаполис: дороги, тротуары, парки и разметка
    drawMegaCityRoads();
    drawRoadDebug();


 // названия улиц на самих дорогах
if (isDevOptionOn("showStreetNames")) {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.50)";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let r of roads) {
        if (!r.name || r.points.length < 2) continue;
        const midIndex = Math.floor((r.points.length - 1) / 2);
        const a = r.points[midIndex];
        const b = r.points[midIndex + 1];
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const x = (a.x + b.x) / 2 - camera.x;
        const y = (a.y + b.y) / 2 - camera.y;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillText(r.name, 0, 0);
        ctx.restore();
    }
    ctx.restore();
}

// ===============================
// 🗺 СЕТКА + ПОДПИСИ (DEV)
// ===============================
if (isDevOptionOn("showGrid")) {

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

}

    // промышленные зоны под зданиями — рисуются отдельно, чтобы завод точно был включён на карте
const activeRecyclingFactory = ensureRecyclingFactoryOnMap();
drawRecyclingFactoryMapZone(activeRecyclingFactory);

    // Единый 2.5D depth-слой: здания, мусор и игроки рисуются в одном порядке.
    // Теперь персонаж частично/полностью уходит за здание, если его Y-глубина дальше фасада.
    drawDepthSortedWorld25D();
    drawDepthDebug25D();

// Если завод сейчас за экраном, показываем направление к нему.
drawRecyclingFactoryScreenMarker(activeRecyclingFactory);

nearbyTrash = getNearbyTrash();
drawTrashActionPanel();

// ===============================
// 🌃 АТМОСФЕРА V2 ТОЛЬКО НА МИРЕ
// ===============================
// Важно: эффекты дождя, дымки и cinematic overlay рисуются ДО HUD,
// чтобы интерфейс не выглядел темным/задымленным.
drawVisualOverhaulV2Screen();

// Auth background must stay transparent: город должен быть виден во время авторизации.
// Старый погодный fullscreen-слой затемнял весь canvas и визуально перекрывал город,
// поэтому для DOM-авторизации он отключен. Камера авторизации продолжает летать над городом.
// if (authWeatherFX.alpha > 0.01) drawAuthWeatherFX();

// ===============================
// 🧩 ЕДИНЫЙ MODERN HUD
// ===============================
// На экране авторизации скрываем весь игровой HUD.
// Музыкальная панель не входит в canvas-HUD и остаётся видимой через DOM.
const hudTargetAlpha = isAuthenticated ? 1 : 0;
gameplayHudAlpha += (hudTargetAlpha - gameplayHudAlpha) * 0.075;
if (gameplayHudAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha *= gameplayHudAlpha;
    drawChatPanel();
    drawJobHintPanel();
    drawDevMenuPanel();
    drawDevCoordinatesPanel();
    drawModernHUD();
    drawInventoryButton();
    drawProfileButton();
    drawInventoryPanel();
    drawProfilePanel();
    drawShopPanel();
    drawAvatarEditorPanel();
    drawInventoryNotice();
    ctx.restore();
}

drawAuthScreen();

}
function updateCamera() {

    const vx = Number(myPlayer.velX) || 0;
    const vy = Number(myPlayer.velY) || 0;
    const speed = getVectorLength(vx, vy);
    const nx = speed > 0.05 ? vx / speed : Math.cos(myPlayer.angle || -Math.PI / 2);
    const ny = speed > 0.05 ? vy / speed : Math.sin(myPlayer.angle || -Math.PI / 2);

    // Камера смотрит чуть вперед по движению и немного выше персонажа — так город читается объемнее.
    const rawTargetX = myPlayer.x + PLAYER_SIZE / 2 + nx * CAMERA_25D.lookAhead - canvas.width / 2;
    const rawTargetY = myPlayer.y + PLAYER_SIZE / 2 + ny * CAMERA_25D.lookAhead - canvas.height / 2 - CAMERA_25D.verticalOffset;
    const target = clampCamera25D(rawTargetX, rawTargetY);

    const dx = target.x - camera.x;
    const dy = target.y - camera.y;
    const limitedDx = clamp(dx * CAMERA_25D.smooth, -CAMERA_25D.maxStep, CAMERA_25D.maxStep);
    const limitedDy = clamp(dy * CAMERA_25D.smooth, -CAMERA_25D.maxStep, CAMERA_25D.maxStep);

    camera.x += limitedDx;
    camera.y += limitedDy;
}
// ===============================
// 🔄 LOOP
// ===============================
function loop() {

    if (isAuthenticated) {
        updateMovement();
        updateRemotePlayers();
        updateCamera();
    } else {
        updateAuthCameraFlight();
    }

    draw();

    requestAnimationFrame(loop);
}


loop();
