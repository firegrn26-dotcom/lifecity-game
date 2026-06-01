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
    // UrbanRebuild V1.2: крупные кварталы. Главные дороги разнесены дальше друг от друга,
    // чтобы между ними появилось больше земли под здания, парковки, дворы и будущий транспорт.
    { name: "пр. Life City", type: "avenue", lanes: 6, width: 144, points: [{x: 720, y: -520}, {x: 720, y: 1740}] },
    { name: "пр. Центральный", type: "avenue", lanes: 6, width: 152, points: [{x: -940, y: 540}, {x: 2700, y: 540}] },
    { name: "ш. Южное", type: "highway", lanes: 6, width: 172, points: [{x: -960, y: 1220}, {x: 2760, y: 1220}] },
    { name: "пр. Северный", type: "avenue", lanes: 4, width: 124, points: [{x: -940, y: 40}, {x: 2700, y: 40}] },
    { name: "ул. Западная", type: "street", lanes: 2, width: 66, points: [{x: 120, y: -460}, {x: 120, y: 1620}] },
    { name: "ул. Деловая", type: "street", lanes: 4, width: 96, points: [{x: 1320, y: -460}, {x: 1320, y: 1620}] },
    { name: "ул. Восточная", type: "street", lanes: 2, width: 72, points: [{x: 1900, y: -460}, {x: 1900, y: 1620}] },
    { name: "ул. Торговая", type: "street", lanes: 3, width: 88, points: [{x: -720, y: 820}, {x: 2520, y: 820}] },
    { name: "пер. Кафейный", type: "lane", lanes: 1, width: 36, points: [{x: 120, y: 360}, {x: 720, y: 360}] },
    { name: "пер. Зеленый", type: "lane", lanes: 1, width: 38, points: [{x: 430, y: 540}, {x: 430, y: 1220}] }
];

let districts = [
    // Районы расширены под новую крупную сетку кварталов.
    { name: "Северо-западный район", x: -1100, y: -650, w: 760, h: 650 },
    { name: "Северный жилой район", x: -340, y: -650, w: 760, h: 650 },
    { name: "Северный центр", x: 420, y: -650, w: 760, h: 650 },
    { name: "Административный район", x: 1180, y: -650, w: 760, h: 650 },
    { name: "Северо-восточный район", x: 1940, y: -650, w: 980, h: 650 },

    { name: "Западный район", x: -1100, y: 0, w: 760, h: 640 },
    { name: "Старый город", x: -340, y: 0, w: 760, h: 640 },
    { name: "Центральный район", x: 420, y: 0, w: 760, h: 640 },
    { name: "Деловой район", x: 1180, y: 0, w: 760, h: 640 },
    { name: "Восточный район", x: 1940, y: 0, w: 980, h: 640 },

    { name: "Юго-западный район", x: -1100, y: 640, w: 760, h: 700 },
    { name: "Рабочий район", x: -340, y: 640, w: 760, h: 700 },
    { name: "Торговый район", x: 420, y: 640, w: 760, h: 700 },
    { name: "Сервисный район", x: 1180, y: 640, w: 760, h: 700 },
    { name: "Промышленный район", x: 1940, y: 640, w: 980, h: 700 },

    { name: "Южный жилой район", x: -1100, y: 1340, w: 760, h: 680 },
    { name: "Южный парк", x: -340, y: 1340, w: 760, h: 680 },
    { name: "Южный центр", x: 420, y: 1340, w: 760, h: 680 },
    { name: "Южная магистраль", x: 1180, y: 1340, w: 760, h: 680 },
    { name: "Юго-восточный район", x: 1940, y: 1340, w: 980, h: 680 }
];

let buildingZones = [
    { name: "Жилой квартал", x: -470, y: 225, w: 310, h: 250 },
    { name: "Кафейный квартал", x: 335, y: 250, w: 255, h: 180 },
    { name: "Административный квартал", x: 860, y: 220, w: 305, h: 220 },
    { name: "Финансовый квартал", x: 860, y: 625, w: 305, h: 170 },
    { name: "Медицинский квартал", x: 895, y: 895, w: 255, h: 190 },
    { name: "Коммунальная зона", x: 485, y: 895, w: 165, h: 135 },
    { name: "Торговый квартал", x: 1420, y: 610, w: 350, h: 210 },
    { name: "Сервисный квартал", x: 1425, y: 900, w: 375, h: 170 },
    { name: "Полицейский квартал", x: 2050, y: 225, w: 335, h: 230 },
    { name: "Промышленная зона переработки", x: 2040, y: 890, w: 800, h: 360 }
];

ensureRecyclingFactoryOnMap();

let parks = [
    // В крупных кварталах появились более широкие зеленые промежутки.
    { name: "Центральный парк", x: 270, y: 115, w: 350, h: 130, fountain: true },
    { name: "Сквер у мэрии", x: 880, y: 90, w: 250, h: 120, fountain: true },
    { name: "Южная лужайка", x: 0, y: 930, w: 300, h: 150, fountain: false },
    { name: "Газон полиции", x: 2090, y: 430, w: 280, h: 120, fountain: false },
    { name: "Восточный газон", x: 1450, y: 250, w: 280, h: 130, fountain: false },
    { name: "Промышленный буфер", x: 1850, y: 900, w: 160, h: 260, fountain: false }
];

let pedestrianPaths = [
 // Тротуары синхронизированы с новой крупной сеткой.
 {points:[{x:-940,y:446},{x:2700,y:446}], width:24},
 {points:[{x:-940,y:634},{x:2700,y:634}], width:24},
 {points:[{x:626,y:-520},{x:626,y:1740}], width:24},
 {points:[{x:814,y:-520},{x:814,y:1740}], width:24},
 {points:[{x:-940,y:-33},{x:2700,y:-33}], width:18},
 {points:[{x:-940,y:113},{x:2700,y:113}], width:18},
 {points:[{x:-960,y:1112},{x:2760,y:1112}], width:24},
 {points:[{x:-960,y:1328},{x:2760,y:1328}], width:24},
 {points:[{x:1258,y:-460},{x:1258,y:1620}], width:18},
 {points:[{x:1382,y:-460},{x:1382,y:1620}], width:18},
 {points:[{x:1847,y:-460},{x:1847,y:1620}], width:18},
 {points:[{x:1953,y:-460},{x:1953,y:1620}], width:18}
];

let crosswalks = [
 {x:720,y:540,angle:0,roadWidth:152,len:176},
 {x:1320,y:540,angle:0,roadWidth:152,len:176},
 {x:1900,y:540,angle:0,roadWidth:152,len:176},
 {x:720,y:1220,angle:0,roadWidth:172,len:196},
 {x:1320,y:1220,angle:0,roadWidth:172,len:196},
 {x:1900,y:1220,angle:0,roadWidth:172,len:196},
 {x:720,y:40,angle:0,roadWidth:124,len:148},
 {x:1320,y:40,angle:0,roadWidth:124,len:148},
 {x:1900,y:40,angle:0,roadWidth:124,len:148},
 {x:120,y:540,angle:0,roadWidth:152,len:168},
 {x:120,y:1220,angle:0,roadWidth:172,len:190}
];

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
                const laneDash = road.type === "highway" || road.type === "avenue" ? [34, 24] : [26, 22];
                drawBrokenSegmentLine(a, b, offset, road, "rgba(245,245,245,0.50)", road.type === "highway" ? 2.4 : 2, laneDash);
            }
        }

        // Более заметная кромка асфальта у широких магистралей.
        const edge = road.width / 2 - 5;
        drawBrokenSegmentLine(a, b, edge, road, "rgba(255,255,255,0.18)", road.type === "highway" ? 2 : 1.4, null);
        drawBrokenSegmentLine(a, b, -edge, road, "rgba(0,0,0,0.24)", road.type === "highway" ? 2 : 1.4, null);
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
    for (const path of pedestrianPaths){ drawPolyline(path.points, path.width+8, "rgba(0,0,0,0.12)","round","round"); drawPolyline(path.points, path.width, "rgba(170,170,170,0.95)","round","round"); }
 for (const c of crosswalks) drawCrosswalk(c);
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


