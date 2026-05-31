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

let roads = [
    // Более предсказуемая квартальная сетка: прямые магистрали + крупные свободные зоны под здания.
    { name: "пр. Life City", type: "avenue", lanes: 4, width: 96, points: [{x: 720, y: -360}, {x: 720, y: 1460}] },
    { name: "пр. Центральный", type: "avenue", lanes: 4, width: 100, points: [{x: -650, y: 420}, {x: 2150, y: 420}] },
    { name: "ш. Южное", type: "highway", lanes: 4, width: 112, points: [{x: -700, y: 980}, {x: 2250, y: 980}] },
    { name: "пр. Северный", type: "avenue", lanes: 3, width: 78, points: [{x: -650, y: 120}, {x: 2150, y: 120}] },
    { name: "ул. Западная", type: "street", lanes: 2, width: 58, points: [{x: 220, y: -300}, {x: 220, y: 1360}] },
    { name: "ул. Деловая", type: "street", lanes: 3, width: 74, points: [{x: 1080, y: -300}, {x: 1080, y: 1360}] },
    { name: "ул. Восточная", type: "street", lanes: 2, width: 60, points: [{x: 1520, y: -300}, {x: 1520, y: 1360}] },
    { name: "ул. Торговая", type: "street", lanes: 2, width: 62, points: [{x: -520, y: 650}, {x: 1960, y: 650}] },
    { name: "пер. Кафейный", type: "lane", lanes: 1, width: 32, points: [{x: 220, y: 260}, {x: 720, y: 260}] },
    { name: "пер. Зеленый", type: "lane", lanes: 1, width: 34, points: [{x: 430, y: 420}, {x: 430, y: 980}] }
];

let districts = [
    // Районы теперь образуют цельную сетку без зазоров.
    // Они немного выходят за границы города, чтобы игрок всегда находился внутри района.
    { name: "Северо-западный район", x: -900, y: -520, w: 620, h: 520 },
    { name: "Северный жилой район", x: -280, y: -520, w: 620, h: 520 },
    { name: "Северный центр", x: 340, y: -520, w: 620, h: 520 },
    { name: "Административный район", x: 960, y: -520, w: 620, h: 520 },
    { name: "Северо-восточный район", x: 1580, y: -520, w: 820, h: 520 },

    { name: "Западный район", x: -900, y: 0, w: 620, h: 520 },
    { name: "Старый город", x: -280, y: 0, w: 620, h: 520 },
    { name: "Центральный район", x: 340, y: 0, w: 620, h: 520 },
    { name: "Деловой район", x: 960, y: 0, w: 620, h: 520 },
    { name: "Восточный район", x: 1580, y: 0, w: 820, h: 520 },

    { name: "Юго-западный район", x: -900, y: 520, w: 620, h: 520 },
    { name: "Рабочий район", x: -280, y: 520, w: 620, h: 520 },
    { name: "Торговый район", x: 340, y: 520, w: 620, h: 520 },
    { name: "Сервисный район", x: 960, y: 520, w: 620, h: 520 },
    { name: "Промышленный район", x: 1580, y: 520, w: 820, h: 520 },

    { name: "Южный жилой район", x: -900, y: 1040, w: 620, h: 620 },
    { name: "Южный парк", x: -280, y: 1040, w: 620, h: 620 },
    { name: "Южный центр", x: 340, y: 1040, w: 620, h: 620 },
    { name: "Южная магистраль", x: 960, y: 1040, w: 620, h: 620 },
    { name: "Юго-восточный район", x: 1580, y: 1040, w: 820, h: 620 }
];

let buildingZones = [
    { name: "Жилой квартал", x: -215, y: 160, w: 240, h: 230 },
    { name: "Кафейный квартал", x: 435, y: 265, w: 205, h: 145 },
    { name: "Административный квартал", x: 785, y: 165, w: 285, h: 175 },
    { name: "Финансовый квартал", x: 785, y: 465, w: 285, h: 165 },
    { name: "Медицинский квартал", x: 805, y: 690, w: 210, h: 155 },
    { name: "Коммунальная зона", x: 535, y: 680, w: 130, h: 100 },
    { name: "Торговый квартал", x: 1140, y: 480, w: 305, h: 175 },
    { name: "Сервисный квартал", x: 1140, y: 800, w: 315, h: 145 },
    { name: "Полицейский квартал", x: 1580, y: 190, w: 285, h: 205 },
    { name: "Промышленная зона переработки", x: 1565, y: 680, w: 780, h: 305 }
];

ensureRecyclingFactoryOnMap();

let parks = [
    // Парки в отдельных свободных местах, без пересечения с дорогами и зданиями.
    { name: "Центральный парк", x: 295, y: 155, w: 300, h: 85, fountain: true },
    { name: "Сквер у мэрии", x: 815, y: 60, w: 220, h: 95, fountain: true },
    { name: "Южная лужайка", x: 10, y: 735, w: 250, h: 125, fountain: false },
    { name: "Газон полиции", x: 1640, y: 375, w: 245, h: 105, fountain: false },
    { name: "Восточный газон", x: 1210, y: 205, w: 230, h: 100, fountain: false }
];

let pedestrianPaths = [];

let crosswalks = [];

let cityDecor = [];

function forEachRoadSegment(road, cb) {
    for (let i = 0; i < road.points.length - 1; i++) cb(road.points[i], road.points[i + 1], i, road);
}

function drawPolyline(points, width, color, cap = "round", join = "round") {
    if (!points || points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x - camera.x, points[0].y - camera.y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x - camera.x, points[i].y - camera.y);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.lineCap = cap;
    ctx.lineJoin = join;
    ctx.stroke();
}

function isAxisAlignedSegment(a, b) {
    return Math.abs(a.x - b.x) < 0.01 || Math.abs(a.y - b.y) < 0.01;
}

function getSegmentGaps(a, b, road) {
    // Возвращает участки, где разметка должна прерываться на перекрестках.
    const gaps = [];
    const horizontal = Math.abs(a.y - b.y) < 0.01;
    const vertical = Math.abs(a.x - b.x) < 0.01;
    if (!horizontal && !vertical) return gaps;

    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);

    for (const other of roads) {
        if (other === road) continue;
        forEachRoadSegment(other, (c, d) => {
            const otherHorizontal = Math.abs(c.y - d.y) < 0.01;
            const otherVertical = Math.abs(c.x - d.x) < 0.01;

            if (horizontal && otherVertical) {
                const ix = c.x;
                const iy = a.y;
                const otherMinY = Math.min(c.y, d.y);
                const otherMaxY = Math.max(c.y, d.y);
                if (ix >= minX && ix <= maxX && iy >= otherMinY && iy <= otherMaxY) {
                    const gap = other.width / 2 + road.width * 0.18 + 14;
                    gaps.push({ from: ix - gap, to: ix + gap });
                }
            }

            if (vertical && otherHorizontal) {
                const ix = a.x;
                const iy = c.y;
                const otherMinX = Math.min(c.x, d.x);
                const otherMaxX = Math.max(c.x, d.x);
                if (iy >= minY && iy <= maxY && ix >= otherMinX && ix <= otherMaxX) {
                    const gap = other.width / 2 + road.width * 0.18 + 14;
                    gaps.push({ from: iy - gap, to: iy + gap });
                }
            }
        });
    }

    gaps.sort((g1, g2) => g1.from - g2.from);
    return gaps;
}

function drawBrokenSegmentLine(a, b, offset, road, color, width, dash = null) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const horizontal = Math.abs(dy) < 0.01;
    const vertical = Math.abs(dx) < 0.01;
    const gaps = getSegmentGaps(a, b, road);

    const startCoord = horizontal ? Math.min(a.x, b.x) : Math.min(a.y, b.y);
    const endCoord = horizontal ? Math.max(a.x, b.x) : Math.max(a.y, b.y);
    const fixed = horizontal ? a.y : a.x;

    let cursor = startCoord;
    ctx.save();
    if (dash) ctx.setLineDash(dash);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";

    for (const gap of [...gaps, { from: endCoord, to: endCoord }]) {
        const segEnd = Math.max(cursor, Math.min(endCoord, gap.from));
        if (segEnd - cursor > 8) {
            ctx.beginPath();
            if (horizontal) {
                ctx.moveTo(cursor - camera.x, fixed + offset - camera.y);
                ctx.lineTo(segEnd - camera.x, fixed + offset - camera.y);
            } else if (vertical) {
                ctx.moveTo(fixed + offset - camera.x, cursor - camera.y);
                ctx.lineTo(fixed + offset - camera.x, segEnd - camera.y);
            } else {
                const t1 = (cursor - startCoord) / Math.max(1, endCoord - startCoord);
                const t2 = (segEnd - startCoord) / Math.max(1, endCoord - startCoord);
                ctx.moveTo(a.x + dx * t1 + nx * offset - camera.x, a.y + dy * t1 + ny * offset - camera.y);
                ctx.lineTo(a.x + dx * t2 + nx * offset - camera.x, a.y + dy * t2 + ny * offset - camera.y);
            }
            ctx.stroke();
        }
        cursor = Math.max(cursor, gap.to);
        if (cursor >= endCoord) break;
    }
    ctx.restore();
}

function drawRoadMarkings(road) {
    ctx.save();

    const lanes = Math.max(1, Number(road.lanes) || 1);
    const laneW = road.width / lanes;

    forEachRoadSegment(road, (a, b) => {
        if (!isAxisAlignedSegment(a, b)) return;

        if (lanes === 1) {
            drawBrokenSegmentLine(a, b, 0, road, "rgba(245,245,245,0.34)", 2, [18, 18]);
        } else {
            const centerColor = road.type === "highway" || road.type === "avenue"
                ? "rgba(255,211,92,0.62)"
                : "rgba(245,245,245,0.58)";
            drawBrokenSegmentLine(a, b, 0, road, centerColor, road.type === "highway" ? 4 : 3, null);
        }

        if (lanes > 2) {
            for (let i = 1; i < lanes; i++) {
                const offset = -road.width / 2 + laneW * i;
                if (Math.abs(offset) < 2) continue;
                drawBrokenSegmentLine(a, b, offset, road, "rgba(245,245,245,0.44)", 2, [24, 22]);
            }
        }

        // Тонкая кромка асфальта у бордюра.
        const edge = road.width / 2 - 3;
        drawBrokenSegmentLine(a, b, edge, road, "rgba(255,255,255,0.12)", 1, null);
        drawBrokenSegmentLine(a, b, -edge, road, "rgba(0,0,0,0.18)", 1, null);
    });

    ctx.restore();
}

function drawCrosswalk(c) {
    // Переход от края до края дороги. Длина = ширина дороги + тонкие бордюры.
    const stripeCount = Math.max(5, Math.floor((c.len || 80) / 12));
    const stripeW = 5;
    const gap = 7;
    const total = stripeCount * stripeW + (stripeCount - 1) * gap;
    const crossLen = (c.len || c.roadWidth || 80);

    ctx.save();
    ctx.translate(c.x - camera.x, c.y - camera.y);
    ctx.rotate(c.angle || 0);

    // Подложка перехода слегка затемняет асфальт и делает переход читаемым.
    roundedRect(-total / 2 - 5, -crossLen / 2 - 3, total + 10, crossLen + 6, 4);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();

    ctx.fillStyle = "rgba(245,245,245,0.82)";
    for (let i = 0; i < stripeCount; i++) {
        const sx = -total / 2 + i * (stripeW + gap);
        roundedRect(sx, -crossLen / 2, stripeW, crossLen, 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawPedestrianPaths() {
    // Пешеходные дорожки удалены из карты.
}

function drawBuildingZones() {
    if (typeof isDevOptionOn !== "function" || !isDevOptionOn("showDistricts")) return;
    ctx.save();
    for (const z of buildingZones) {
        ctx.fillStyle = "rgba(88,199,255,0.035)";
        ctx.strokeStyle = "rgba(88,199,255,0.16)";
        ctx.lineWidth = 1.5;
        roundedRect(z.x - camera.x, z.y - camera.y, z.w, z.h, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(180,225,255,0.38)";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "left";
        ctx.fillText(z.name, z.x - camera.x + 10, z.y - camera.y + 20);
    }
    ctx.restore();
}

function drawPark(p) {
    const x = p.x - camera.x;
    const y = p.y - camera.y;
    ctx.save();
    roundedRect(x, y, p.w, p.h, 18);
    ctx.fillStyle = "rgba(34, 92, 48, 0.65)";
    ctx.fill();
    ctx.strokeStyle = "rgba(129,240,79,0.22)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.strokeStyle = "rgba(224, 214, 166, 0.35)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x + 18, y + p.h * 0.55);
    ctx.quadraticCurveTo(x + p.w * 0.45, y + 10, x + p.w - 18, y + p.h * 0.55);
    ctx.stroke();

    for (let i = 0; i < Math.floor(p.w / 55); i++) {
        const tx = x + 28 + i * 52;
        const ty = y + p.h - 26 - (i % 2) * 26;
        ctx.fillStyle = "rgba(28, 57, 32, 0.9)";
        ctx.beginPath();
        ctx.arc(tx, ty, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(129,240,79,0.25)";
        ctx.beginPath();
        ctx.arc(tx - 3, ty - 3, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    if (p.fountain) {
        const fx = x + p.w / 2;
        const fy = y + p.h / 2;
        ctx.fillStyle = "rgba(18, 42, 64, 0.85)";
        ctx.beginPath();
        ctx.arc(fx, fy, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(88,199,255,0.65)";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = "rgba(88,199,255,0.55)";
        ctx.beginPath();
        ctx.arc(fx, fy, 7 + Math.sin(performance.now() / 240) * 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}


