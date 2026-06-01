
function parseHexColor25D(color) {
    const c = String(color || '#ffffff').trim();
    if (c[0] !== '#') return null;
    let h = c.slice(1);
    if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
    const n = parseInt(h.slice(0, 6), 16);
    if (Number.isNaN(n)) return null;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lightenColor(color, amount = 0) {
    const rgb = parseHexColor25D(color);
    if (!rgb) return color || '#ffffff';
    const a = Number(amount) || 0;
    const [r, g, b] = rgb.map(v => Math.max(0, Math.min(255, Math.round(v + (255 - v) * (a / 100)))));
    return `rgb(${r},${g},${b})`;
}

function darkenColor(color, amount = 0) {
    const rgb = parseHexColor25D(color);
    if (!rgb) return color || '#000000';
    const a = Math.max(0, Math.min(100, Number(amount) || 0));
    const [r, g, b] = rgb.map(v => Math.max(0, Math.min(255, Math.round(v * (1 - a / 100)))));
    return `rgb(${r},${g},${b})`;
}


// Utility: hex/rgb color with alpha for 2.5D building glow/strokes.
function colorWithAlpha(color, alpha = 1) {
    const a = Math.max(0, Math.min(1, Number(alpha) || 0));
    if (!color) return `rgba(255,255,255,${a})`;
    const c = String(color).trim();
    if (c.startsWith('rgba(')) return c.replace(/rgba\(([^)]+),\s*[0-9.]+\)/, `rgba($1, ${a})`);
    if (c.startsWith('rgb(')) return c.replace('rgb(', 'rgba(').replace(')', `, ${a})`);
    if (c[0] === '#') {
        let h = c.slice(1);
        if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
        const n = parseInt(h.slice(0, 6), 16);
        if (!Number.isNaN(n)) {
            const r = (n >> 16) & 255;
            const g = (n >> 8) & 255;
            const b = n & 255;
            return `rgba(${r},${g},${b},${a})`;
        }
    }
    return c;
}

// ===============================
// 🏢 ЗДАНИЯ LIFE CITY — TOP-DOWN CITY STYLE
// Вид строго сверху: здание читается по форме крыши, деталям и одной чистой вывеске.
// ВАЖНО: координаты, размеры, названия и смысл зданий не меняются.
// ===============================

function drawTopDownBlock(x, y, w, h, radius, fill, stroke = "rgba(255,255,255,0.12)", lineWidth = 1) {
    roundedRect(x, y, w, h, radius);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }
}

function drawRoofBase(x, y, w, h, p) {
    // V1.6.10: крыши отключены. Оставляем только базовую тень/корпус через 2.5D shell.
    return;
}


// ===============================
// 🏙 LIFE CITY 2.5D RENDER STAGE 1
// Визуальная высота не меняет координаты, коллизии и серверную логику.
// Здания остаются на своих x/y/w/h, но получают объем, фасады и мягкую тень.
// ===============================
const LIFE_CITY_25D_ENABLED = true;
// V1.6.10: крыши домов полностью отключены по запросу.
const LIFE_CITY_BUILDING_ROOFS_ENABLED = false;


function drawRoofSurface25D(x, y, w, h, p) {
    // V1.6.11: верхняя плоскость здания полностью отключена.
    // Это убирает визуальную "крышу", которая раньше была частью корпуса.
    return;
}


function drawBuilding25DShell(x, y, w, h, p, z) {
    const roofY = y - z;
    const r = Math.min(18, w / 8, h / 8);

    ctx.save();

    // Общая падающая тень вправо-вниз. Один слой, чтобы не было ощущения дубля здания.
    const sh = ctx.createLinearGradient(x + 8, y + h * 0.25, x + w + z * 0.95, y + h + z * 0.50);
    sh.addColorStop(0, "rgba(0,0,0,0.20)");
    sh.addColorStop(1, "rgba(0,0,0,0.02)");
    roundedRect(x + z * 0.30, y + z * 0.28, w + z * 0.34, h + z * 0.20, r + 5);
    ctx.fillStyle = sh;
    ctx.fill();

    // Нижний/южный фасад.
    const front = ctx.createLinearGradient(x, roofY + h * 0.65, x, y + h);
    front.addColorStop(0, lightenColor(p.edge, 8));
    front.addColorStop(1, "rgba(8,12,18,0.98)");
    ctx.beginPath();
    ctx.moveTo(x + r * 0.55, roofY + h);
    ctx.lineTo(x + w - r * 0.55, roofY + h);
    ctx.lineTo(x + w - r * 0.55, y + h);
    ctx.lineTo(x + r * 0.55, y + h);
    ctx.closePath();
    ctx.fillStyle = front;
    ctx.fill();

    // Правый/восточный фасад чуть светлее, чтобы читался объем.
    const side = ctx.createLinearGradient(x + w, roofY, x + w, y + h);
    side.addColorStop(0, lightenColor(p.edge, 18));
    side.addColorStop(1, "rgba(13,18,25,0.98)");
    ctx.beginPath();
    ctx.moveTo(x + w, roofY + r * 0.55);
    ctx.lineTo(x + w, roofY + h - r * 0.55);
    ctx.lineTo(x + w, y + h - r * 0.55);
    ctx.lineTo(x + w, y + r * 0.55);
    ctx.closePath();
    ctx.fillStyle = side;
    ctx.fill();

    // Линии этажей на фасаде — дешевый, но хорошо читаемый 2.5D-эффект.
    ctx.strokeStyle = "rgba(255,255,255,0.075)";
    ctx.lineWidth = 1;
    const floors = Math.max(2, Math.min(6, Math.floor(z / 10)));
    for (let i = 1; i < floors; i++) {
        const yy = roofY + h + (z / floors) * i;
        ctx.beginPath();
        ctx.moveTo(x + 8, yy);
        ctx.lineTo(x + w - 8, yy);
        ctx.stroke();
    }

    // Светящиеся окна на видимом фасаде.
    const winCols = Math.max(3, Math.min(8, Math.floor(w / 34)));
    for (let i = 0; i < winCols; i++) {
        const wx = x + 12 + i * ((w - 24) / winCols);
        for (let f = 0; f < Math.min(4, floors); f++) {
            const wy = roofY + h + 7 + f * 10;
            if (wy > y + h - 8) continue;
            drawTopDownBlock(wx, wy, Math.max(7, w / winCols * 0.36), 4, 2, (i + f) % 3 === 0 ? colorWithAlpha(p.accent, 0.35) : "rgba(255,255,255,0.12)", null);
        }
    }

    drawRoofSurface25D(x, roofY, w, h, p);
    ctx.restore();

    return roofY;
}

function drawRoofLabel(x, y, w, h, text, accent, yRatio = 0.65) {
    // V1.6.8: маленькие дубли названий на крышах отключены.
    // Названия зданий теперь показываются только через уникальные 2.5D-вывески/фасады.
    return;
}

function drawRoofUnit(x, y, w, h, accent, alpha = 1, radius = 5) {
    // V1.6.10: все малые roof-блоки/вентиляция/техблоки отключены.
    return;
}

function drawTinyWindows(x, y, w, h, cols, rows, accent) {
    ctx.save();
    const padX = w * 0.10;
    const padY = h * 0.12;
    const gapX = 6;
    const gapY = 6;
    const ww = Math.max(8, (w - padX * 2 - gapX * (cols - 1)) / cols);
    const wh = Math.max(6, Math.min(13, (h - padY * 2 - gapY * (rows - 1)) / rows));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const wx = x + padX + c * (ww + gapX);
            const wy = y + padY + r * (wh + gapY);
            drawTopDownBlock(wx, wy, ww, wh, 3, (r + c) % 3 === 0 ? colorWithAlpha(accent, 0.20) : "rgba(255,255,255,0.09)", "rgba(255,255,255,0.08)", 1);
        }
    }
    ctx.restore();
}

function drawTopDownEntrance(x, y, w, h, accent) {
    ctx.save();
    const ew = Math.max(26, Math.min(58, w * 0.22));
    const eh = Math.max(10, Math.min(16, h * 0.11));
    const ex = x + w / 2 - ew / 2;
    const ey = y + h - eh - 4;
    drawTopDownBlock(ex, ey, ew, eh, 5, "rgba(2,6,14,0.70)", colorWithAlpha(accent, 0.62), 1);
    ctx.restore();
}



function drawRecyclingFactoryMapZone(b) {
    const x = b.x - camera.x;
    const y = b.y - camera.y;
    const zoneW = b.w + 300;
    const zoneH = Math.max(285, b.h + 36);

    if (x + zoneW < -80 || y + zoneH < -80 || x > canvas.width + 80 || y > canvas.height + 80) return;

    ctx.save();
    drawTopDownBlock(x - 16, y - 18, zoneW, zoneH, 18, "rgba(34,48,39,0.42)", "rgba(155,255,108,0.22)", 1.4);
    ctx.setLineDash([12, 9]);
    ctx.strokeStyle = "rgba(155,255,108,0.30)";
    ctx.lineWidth = 2;
    roundedRect(x - 8, y - 10, zoneW - 16, zoneH - 16, 14);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(155,255,108,0.48)";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    // V1.6.8: текстовая подложка промзоны отключена, чтобы не дублировать названия на карте.
    ctx.restore();
}


function drawRecyclingFactoryScreenMarker(factory) {
    if (!factory) return;

    const centerX = factory.x + factory.w / 2;
    const centerY = factory.y + factory.h / 2;
    const sx = centerX - camera.x;
    const sy = centerY - camera.y;
    const visible = sx >= 0 && sx <= canvas.width && sy >= 0 && sy <= canvas.height;

    if (visible) return;

    const pad = 34;
    const markerX = Math.max(pad, Math.min(canvas.width - pad, sx));
    const markerY = Math.max(pad, Math.min(canvas.height - pad, sy));
    const angle = Math.atan2(sy - canvas.height / 2, sx - canvas.width / 2);

    ctx.save();
    ctx.translate(markerX, markerY);
    ctx.rotate(angle);
    ctx.fillStyle = "rgba(155,255,108,0.88)";
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-10, -9);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-10, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "rgba(8,15,12,0.78)";
    ctx.strokeStyle = "rgba(155,255,108,0.45)";
    ctx.lineWidth = 1.2;
    roundedRect(markerX - 70, markerY + 16, 140, 25, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(155,255,108,0.95)";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("♻ ЗАВОД", markerX, markerY + 29);
    ctx.restore();
}

function drawFactoryParkingAndTrucks(x, y, w, h, accent) {
    ctx.save();
    const t = performance.now() / 1000;

    // Парковка вынесена справа от завода, чтобы не попадать под южную магистраль
    // и не сливаться с дорожным полотном. Так объект сразу читается на карте сверху.
    const lotX = x + w + 18;
    const lotY = y + 18;
    const lotW = 250;
    const lotH = Math.max(190, h - 36);

    drawTopDownBlock(lotX - 12, lotY - 10, lotW + 24, lotH + 20, 16, "rgba(12,16,18,0.28)", "rgba(155,255,108,0.12)", 1);
    drawTopDownBlock(lotX, lotY, lotW, lotH, 14, "rgba(32,36,39,0.96)", "rgba(255,255,255,0.14)", 1.2);
    drawTopDownBlock(lotX + 9, lotY + 9, lotW - 18, lotH - 18, 10, "rgba(20,23,26,0.55)", "rgba(255,255,255,0.05)", 1);

    ctx.strokeStyle = "rgba(255,255,255,0.30)";
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    for (let i = 1; i < 4; i++) {
        const py = lotY + i * lotH / 4;
        ctx.beginPath();
        ctx.moveTo(lotX + 16, py);
        ctx.lineTo(lotX + lotW - 16, py);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(155,255,108,0.88)";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ПАРКОВКА ГРУЗОВИКОВ", lotX + lotW / 2, lotY + 16);

    const trucks = [
        { x: lotX + 26, y: lotY + 42, body: "#5a6973", cab: "#7ac56b" },
        { x: lotX + 142, y: lotY + 42, body: "#64707a", cab: "#d6b15d" },
        { x: lotX + 26, y: lotY + 104, body: "#53616a", cab: "#6cb9d8" },
        { x: lotX + 142, y: lotY + 104, body: "#5b636b", cab: "#d56d5f" }
    ];

    for (const tr of trucks) drawParkedGarbageTruck(tr.x, tr.y, 78, 38, tr.body, tr.cab, accent);

    // Места для будущего спавна грузовиков.
    for (let i = 0; i < 2; i++) {
        const sx = lotX + 26 + i * 116;
        const sy = lotY + lotH - 48;
        drawTopDownBlock(sx, sy, 88, 25, 7, "rgba(155,255,108,0.07)", "rgba(155,255,108,0.30)", 1);
        ctx.fillStyle = "rgba(155,255,108,0.46)";
        ctx.font = "bold 10px Arial";
        ctx.fillText("SPAWN", sx + 44, sy + 13 + Math.sin(t * 2 + i) * 1.5);
    }
    ctx.restore();
}

function drawParkedGarbageTruck(x, y, w, h, bodyColor, cabColor, accent) {
    ctx.save();
    const t = performance.now() / 1000;
    const lift = 7;

    // 2.5D тень: грузовик больше не выглядит как плоская наклейка на парковке.
    ctx.save();
    ctx.translate(x + w / 2 + 5, y + h / 2 + 8);
    ctx.scale(1, 0.42);
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.30)";
    ctx.fill();
    ctx.restore();

    // Нижняя темная грань кузова.
    drawTopDownBlock(x + 2, y + lift, w * 0.66, h, 8, "rgba(17,24,27,0.92)", "rgba(0,0,0,0.28)", 1);
    drawTopDownBlock(x + w * 0.58, y + lift + h * 0.09, w * 0.39, h * 0.82, 7, "rgba(18,26,29,0.90)", "rgba(0,0,0,0.25)", 1);

    // Верх кузова и кабины.
    drawTopDownBlock(x, y, w * 0.66, h, 8, bodyColor, "rgba(255,255,255,0.20)", 1.2);
    drawTopDownBlock(x + w * 0.58, y + h * 0.09, w * 0.39, h * 0.82, 7, cabColor, "rgba(255,255,255,0.22)", 1.2);

    // Бункер/контейнер мусоровоза с объемной кромкой.
    drawTopDownBlock(x + w * 0.08, y + h * 0.16, w * 0.43, h * 0.27, 5, "rgba(5,12,14,0.36)", "rgba(255,255,255,0.10)", 1);
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x + w * (0.10 + i * 0.09), y + h * 0.19);
        ctx.lineTo(x + w * (0.10 + i * 0.09), y + h * 0.40);
        ctx.stroke();
    }

    // Кабина: стекло, капот, фары.
    drawTopDownBlock(x + w * 0.65, y + h * 0.17, w * 0.20, h * 0.25, 4, "rgba(110,205,240,0.32)", "rgba(255,255,255,0.24)", 1);
    drawTopDownBlock(x + w * 0.84, y + h * 0.25, w * 0.10, h * 0.50, 5, "rgba(255,255,255,0.09)", "rgba(255,255,255,0.10)", 1);
    ctx.fillStyle = "rgba(255,245,156,0.90)";
    ctx.fillRect(x + w * 0.93, y + h * 0.24, 4, 5);
    ctx.fillRect(x + w * 0.93, y + h * 0.62, 4, 5);

    // Зеленая рабочая полоса и знак переработки.
    ctx.fillStyle = colorWithAlpha(accent, 0.72);
    ctx.fillRect(x + w * 0.14, y + h * 0.55, w * 0.36, 4);
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("♻", x + w * 0.32, y + h * 0.72);

    // Колеса с боковой глубиной.
    const wheels = [
        [x + 12, y - 3], [x + 12, y + h - 2],
        [x + w * 0.55, y - 3], [x + w * 0.55, y + h - 2],
        [x + w - 19, y - 3], [x + w - 19, y + h - 2]
    ];
    for (const [wx, wy] of wheels) {
        ctx.fillStyle = "rgba(4,6,7,0.95)";
        roundedRect(wx, wy, 15, 6, 3);
        ctx.fill();
        ctx.fillStyle = "rgba(95,105,110,0.55)";
        ctx.fillRect(wx + 4, wy + 2, 7, 2);
    }

    // Маячок и легкая анимация готовности к выезду.
    const blink = 0.45 + Math.sin(t * 5 + x * 0.01) * 0.35;
    ctx.fillStyle = `rgba(255,196,55,${blink})`;
    ctx.beginPath();
    ctx.arc(x + w * 0.68, y + h * 0.10, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Небольшой выхлоп/пар у стоящих машин.
    for (let i = 0; i < 3; i++) {
        const life = ((t * 0.35 + i * 0.27 + x * 0.003) % 1);
        ctx.beginPath();
        ctx.arc(x - 4 - life * 12, y + h * 0.50 - life * 8, 2 + life * 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210,220,215,${0.11 * (1 - life)})`;
        ctx.fill();
    }
    ctx.restore();
}

function drawBuildingWorkAnimation25D(x, y, w, h, p) {
    const t = performance.now() / 1000;
    ctx.save();

    if (p.type === "shop") {
        // Живые витрины: мягкое свечение и бегущая вывеска.
        const glow = 0.22 + Math.sin(t * 2.4) * 0.08;
        drawTopDownBlock(x + w * 0.12, y + h * 0.72, w * 0.58, h * 0.08, 6, `rgba(255,218,94,${glow})`, "rgba(255,218,94,0.35)", 1);
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = i === Math.floor((t * 5) % 5) ? colorWithAlpha(p.accent, 0.95) : "rgba(255,255,255,0.18)";
            ctx.fillRect(x + w * (0.18 + i * 0.09), y + h * 0.17, 5, 5);
        }
    }

    if (p.type === "cafe") {
        // Теплая веранда и легкий пар от кухни.
        for (let i = 0; i < 4; i++) {
            const life = ((t * 0.28 + i * 0.21) % 1);
            ctx.beginPath();
            ctx.arc(x + w * 0.68 + Math.sin(t + i) * 5, y + h * 0.28 - life * 30, 4 + life * 9, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,230,180,${0.10 * (1 - life)})`;
            ctx.fill();
        }
        ctx.fillStyle = `rgba(255,190,86,${0.20 + Math.sin(t * 3) * 0.05})`;
        ctx.beginPath();
        ctx.arc(x + w * 0.50, y + h * 0.42, Math.min(w, h) * 0.18, 0, Math.PI * 2);
        ctx.fill();
    }

    if (p.type === "service") {
        // Автосервис: мигающий сварочный свет и ворота.
        const spark = Math.max(0, Math.sin(t * 8));
        ctx.fillStyle = `rgba(100,210,255,${0.08 + spark * 0.28})`;
        ctx.fillRect(x + w * 0.18, y + h * 0.42, w * 0.30, h * 0.11);
        if (spark > 0.72) {
            ctx.strokeStyle = "rgba(180,235,255,0.75)";
            ctx.beginPath();
            ctx.moveTo(x + w * 0.34, y + h * 0.48);
            ctx.lineTo(x + w * 0.42, y + h * 0.41);
            ctx.moveTo(x + w * 0.36, y + h * 0.50);
            ctx.lineTo(x + w * 0.46, y + h * 0.55);
            ctx.stroke();
        }
    }

    if (p.type === "police") {
        // Полиция: сине-красный маяк на крыше.
        const red = 0.25 + Math.max(0, Math.sin(t * 6)) * 0.55;
        const blue = 0.25 + Math.max(0, Math.sin(t * 6 + Math.PI)) * 0.55;
        ctx.fillStyle = `rgba(255,65,80,${red})`;
        ctx.fillRect(x + w * 0.32, y + h * 0.16, w * 0.14, h * 0.07);
        ctx.fillStyle = `rgba(80,180,255,${blue})`;
        ctx.fillRect(x + w * 0.54, y + h * 0.16, w * 0.14, h * 0.07);
    }

    if (p.type === "bank") {
        // Банк: спокойное премиальное подсвечивание входа.
        const pulse = 0.18 + Math.sin(t * 1.4) * 0.05;
        drawTopDownBlock(x + w * 0.36, y + h * 0.72, w * 0.28, h * 0.08, 6, `rgba(255,215,106,${pulse})`, "rgba(255,215,106,0.25)", 1);
    }

    if (p.type === "pharmacy") {
        // Аптека: пульсирующий зеленый крест.
        const a = 0.18 + Math.sin(t * 2.7) * 0.07;
        ctx.fillStyle = colorWithAlpha(p.accent, a);
        ctx.fillRect(x + w * 0.46, y + h * 0.18, w * 0.08, h * 0.48);
        ctx.fillRect(x + w * 0.32, y + h * 0.35, w * 0.36, h * 0.09);
    }

    if (p.type === "home") {
        // Несколько окон слегка меняют яркость, чтобы город был живым.
        for (let i = 0; i < 6; i++) {
            const wx = x + w * (0.16 + (i % 3) * 0.24);
            const wy = y + h * (0.18 + Math.floor(i / 3) * 0.24);
            const lit = 0.08 + Math.max(0, Math.sin(t * 0.9 + i * 1.7)) * 0.16;
            drawTopDownBlock(wx, wy, w * 0.08, h * 0.08, 3, `rgba(255,224,140,${lit})`, null, 1);
        }
    }

    ctx.restore();
}


function drawRoofGeometry25D(x, y, w, h, p) {
    // V1.6.10: крыши зданий удалены полностью.
    return;
}

function drawBuildingFootprint25D(x, y, w, h, p) {
    // Плитка/дворик вокруг здания отделяет его от дороги и убирает ощущение плоского блока.
    ctx.save();
    const pad = Math.max(6, Math.min(16, Math.min(w, h) * 0.08));
    drawTopDownBlock(x - pad, y - pad, w + pad * 2, h + pad * 2, Math.min(20, pad + 8), "rgba(38,43,45,0.42)", "rgba(255,255,255,0.055)", 1);
    ctx.strokeStyle = colorWithAlpha(p.accent, 0.10);
    ctx.lineWidth = 1;
    roundedRect(x - pad + 4, y - pad + 4, w + pad * 2 - 8, h + pad * 2 - 8, Math.min(16, pad + 5));
    ctx.stroke();
    ctx.restore();
}


function drawStyledBuilding(b) {
    const x = b.x - camera.x;
    const y = b.y - camera.y;
    const w = b.w;
    const h = b.h;

    const p = buildingPalette(b.name, b.color);
    const z = LIFE_CITY_25D_ENABLED ? getBuilding25DHeight(b, p) : 0;

    if (x + w < -380 || y + h < -220 || x > canvas.width + 380 || y - z > canvas.height + 220) return;

    ctx.save();

    if (LIFE_CITY_25D_ENABLED) drawBuildingFootprint25D(x, y, w, h, p);

    const roofY = LIFE_CITY_25D_ENABLED
        ? drawBuilding25DShell(x, y, w, h, p, z)
        : (drawRoofBase(x, y, w, h, p), y);

    // V1.6.10: крыши отключены, декоративная roof-геометрия не рисуется.
    // Корпус, фасады, двери, окна и вывески остаются.
    drawRoofGeometry25D(x, roofY, w, h, p);
    drawBuildingTypeDetails(x, roofY, w, h, p);
    if (LIFE_CITY_25D_ENABLED) drawFacadeEntrance25D(x, y, w, h, z, p);
    else drawTopDownEntrance(x, roofY, w, h, p.accent);
    drawRoofLabel(x, roofY, w, h, p.label, p.accent, p.labelY);

    if (isDevOptionOn("editBuildings") && selectedBuilding === b) {
        ctx.strokeStyle = UI.yellow;
        ctx.lineWidth = 3;
        roundedRect(x - 3, y - 3, w + 6, h + 6, Math.min(18, w / 7, h / 7));
        ctx.stroke();
        ctx.fillStyle = "rgba(255,221,87,0.80)";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`2.5D высота: ${z}px`, x + w / 2, y + h + 16);
    }
    ctx.restore();
}




// ===============================
// 🏗️ URBANREBUILD V1.3 — ПОЛНЫЙ УНИКАЛЬНЫЙ 2.5D REBUILD ЗДАНИЙ
// Эти переопределения идут ниже старых функций специально: JS использует последнюю
// декларацию функции, поэтому назначение зданий и серверная логика сохраняются,
// а визуальный стиль каждого типа становится уникальным.
// ===============================
function buildingPalette(name, fallback) {
    const map = {
        "Мэрия": {
            roof: "#2f6fae", edge: "#132d4b", wall: "#244e78", accent: "#d7ecff",
            label: "МЭРИЯ", type: "city", labelY: 0.28, sign: "CITY HALL", heightMul: 0.34
        },
        "Банк": {
            roof: "#17233d", edge: "#07101f", wall: "#24334e", accent: "#ffd76a",
            label: "БАНК", type: "bank", labelY: 0.26, sign: "BANK", heightMul: 0.38
        },
        "Магазин": {
            roof: "#9b6b1c", edge: "#35220a", wall: "#6a4616", accent: "#ffd45a",
            label: "МАГАЗИН", type: "shop", labelY: 0.23, sign: "SHOP", heightMul: 0.27
        },
        "Кафе": {
            roof: "#8f4f25", edge: "#31190b", wall: "#65321a", accent: "#ffc957",
            label: "КАФЕ", type: "cafe", labelY: 0.24, sign: "CAFE", heightMul: 0.28
        },
        "Аптека": {
            roof: "#217a50", edge: "#09281c", wall: "#174934", accent: "#7dff76",
            label: "АПТЕКА", type: "pharmacy", labelY: 0.25, sign: "PHARMACY", heightMul: 0.29
        },
        "Мусорка": {
            roof: "#4b565f", edge: "#172029", wall: "#303942", accent: "#9bff6c",
            label: "МУСОРКА", type: "trash", labelY: 0.30, sign: "UTIL", heightMul: 0.20
        },
        "Автосервис": {
            roof: "#585e68", edge: "#1c222b", wall: "#3c434c", accent: "#ff9d3c",
            label: "АВТОСЕРВИС", type: "service", labelY: 0.25, sign: "SERVICE", heightMul: 0.30
        },
        "Полиция": {
            roof: "#235a9f", edge: "#0b1e40", wall: "#173a6b", accent: "#62caff",
            label: "ПОЛИЦИЯ", type: "police", labelY: 0.25, sign: "POLICE", heightMul: 0.34
        },
        "Жилой дом": {
            roof: "#5a667b", edge: "#202938", wall: "#3f4a5d", accent: "#66cfff",
            label: "ЖИЛОЙ ДОМ", type: "home", labelY: 0.26, sign: "HOME", heightMul: 0.36
        },
        "Мусороперерабатывающий завод": {
            roof: "#3d5d66", edge: "#13252c", wall: "#294349", accent: "#9bff6c",
            label: "МУСОРОПЕРЕРАБАТЫВАЮЩИЙ ЗАВОД", type: "recyclingFactory", labelY: 0.22, sign: "RECYCLING", heightMul: 0.25
        }
    };
    return map[name] || {
        roof: fallback || "#4b5563", edge: "#1c2430", wall: "#333d4a", accent: UI.blue,
        label: String(name || "ЗДАНИЕ").toUpperCase(), type: "default", labelY: 0.28, sign: "BUILDING", heightMul: 0.28
    };
}

function getBuilding25DHeight(b, p) {
    const side = Math.min(b.w || 80, b.h || 60);
    const mul = p && p.heightMul ? p.heightMul : 0.28;
    const base = Math.floor(side * mul);
    if (p.type === "home") return Math.max(56, Math.min(86, base + 18));
    if (p.type === "city") return Math.max(58, Math.min(92, base + 16));
    if (p.type === "bank") return Math.max(52, Math.min(88, base + 18));
    if (p.type === "recyclingFactory") return Math.max(42, Math.min(74, base + 10));
    if (p.type === "trash") return Math.max(22, Math.min(36, base));
    return Math.max(34, Math.min(70, base + 8));
}

function drawUniqueSign2_5D(x, y, w, h, p, text) {
    ctx.save();
    const signW = Math.min(w * 0.72, Math.max(58, String(text).length * 9 + 22));
    const signH = Math.max(18, Math.min(28, h * 0.13));
    const sx = x + w / 2 - signW / 2;
    const sy = y + Math.max(8, h * 0.08);
    drawTopDownBlock(sx + 2, sy + 3, signW, signH, 7, "rgba(0,0,0,0.28)", null);
    drawTopDownBlock(sx, sy, signW, signH, 7, "rgba(3,9,18,0.86)", colorWithAlpha(p.accent, 0.86), 1.2);
    ctx.font = `bold ${Math.max(10, Math.min(15, signH * 0.62))}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.fillText(text, sx + signW / 2, sy + signH / 2 + 0.5);
    ctx.restore();
}

function drawFacadeEntrance25D(x, baseY, w, h, z, p) {
    ctx.save();
    const ew = Math.max(30, Math.min(p.type === "service" ? 92 : 76, w * (p.type === "service" ? 0.34 : 0.25)));
    const eh = Math.max(16, Math.min(30, z * 0.40));
    const ex = x + w / 2 - ew / 2;
    const ey = baseY + h - eh - 2;

    if (p.type === "service") {
        drawTopDownBlock(ex, ey - 4, ew, eh + 4, 4, "rgba(18,22,28,0.92)", colorWithAlpha(p.accent, 0.65), 1.2);
        for (let i = 1; i < 5; i++) {
            ctx.strokeStyle = "rgba(255,255,255,0.16)";
            ctx.beginPath();
            ctx.moveTo(ex + 4, ey - 4 + i * ((eh + 4) / 5));
            ctx.lineTo(ex + ew - 4, ey - 4 + i * ((eh + 4) / 5));
            ctx.stroke();
        }
    } else if (p.type === "trash") {
        drawTopDownBlock(ex, ey, ew, eh, 5, "rgba(14,20,16,0.88)", colorWithAlpha(p.accent, 0.72), 1.1);
        ctx.fillStyle = colorWithAlpha(p.accent, 0.75);
        ctx.fillRect(ex + 6, ey + 4, ew - 12, 4);
    } else {
        drawTopDownBlock(ex + 2, ey + 2, ew, eh, 6, "rgba(0,0,0,0.28)", null);
        drawTopDownBlock(ex, ey, ew, eh, 6, "rgba(3,7,12,0.86)", colorWithAlpha(p.accent, 0.74), 1.2);
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.fillRect(ex + ew / 2 - 1, ey + 3, 2, eh - 6);
    }

    const pathW = Math.max(28, ew * 0.62);
    drawTopDownBlock(x + w / 2 - pathW / 2, baseY + h + 2, pathW, 20, 4, "rgba(88,94,96,0.78)", "rgba(255,255,255,0.11)", 1);
    ctx.restore();
}

function drawBuildingTypeDetails(x, y, w, h, p) {
    // V1.6.11: все элементы, которые читались как крыша/верхняя площадка, отключены.
    // Оставляем только назначение здания через фасадную вывеску или символ.
    ctx.save();

    const labels = {
        home: "ЖИЛОЙ ДОМ",
        cafe: "КАФЕ",
        city: "МЭРИЯ",
        bank: "БАНК",
        pharmacy: "АПТЕКА",
        shop: "МАГАЗИН",
        service: "АВТОСЕРВИС",
        police: "ПОЛИЦИЯ",
        factory: "ЗАВОД"
    };

    if (p.type === "trash") {
        ctx.fillStyle = colorWithAlpha(p.accent, 0.92);
        ctx.font = `bold ${Math.max(18, Math.min(w, h) * 0.24)}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("♻", x + w * 0.50, y + h * 0.50);
    } else if (labels[p.type]) {
        drawUniqueSign2_5D(x, y, w, h, p, labels[p.type]);
    }

    ctx.restore();
}

