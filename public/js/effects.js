// ===============================
// 🌆 VISUAL OVERHAUL V1
// ===============================
const visualFX={fogOffset:0};
function drawVisualOverhaulV1(){
 ctx.save();
 // vignette
 const vg=ctx.createRadialGradient(canvas.width/2,canvas.height/2,Math.min(canvas.width,canvas.height)*0.25,canvas.width/2,canvas.height/2,Math.max(canvas.width,canvas.height)*0.8);
 vg.addColorStop(0,'rgba(0,0,0,0)');
 vg.addColorStop(1,'rgba(0,0,0,0.48)');
 ctx.fillStyle=vg; ctx.fillRect(0,0,canvas.width,canvas.height);
 // night tint
 ctx.fillStyle='rgba(10,18,34,0.10)'; ctx.fillRect(0,0,canvas.width,canvas.height);
 // moving fog
 visualFX.fogOffset+=0.15;
 ctx.globalAlpha=0.06;
 for(let i=0;i<6;i++){
   const x=((i*340+visualFX.fogOffset*12)%(canvas.width+500))-250;
   const y=80+i*90;
   const g=ctx.createRadialGradient(x,y,10,x,y,180);
   g.addColorStop(0,'rgba(200,220,255,0.45)');
   g.addColorStop(1,'rgba(200,220,255,0)');
   ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,180,0,Math.PI*2); ctx.fill();
 }
 ctx.restore();
}

function drawStreetLightsV1(){
 ctx.save();
 for(const r of roads){
   if(!r.points||r.points.length<2) continue;
   for(let i=0;i<r.points.length;i++){
      const p=r.points[i];
      const sx=p.x-camera.x, sy=p.y-camera.y;
      ctx.fillStyle='rgba(255,210,110,.95)';
      ctx.shadowColor='rgba(255,200,80,.55)'; ctx.shadowBlur=22;
      ctx.beginPath(); ctx.arc(sx,sy,2.2,0,Math.PI*2); ctx.fill();
   }
 }
 ctx.restore();
}


// ===============================
// 🌃 VISUAL OVERHAUL V2
// ===============================
const visualFXV2 = {
    tick: 0,
    rain: Array.from({ length: 95 }, (_, i) => ({
        x: (i * 173) % 2200,
        y: (i * 97) % 1200,
        speed: 6 + (i % 7) * 0.55,
        len: 12 + (i % 5) * 4,
        drift: 1.7 + (i % 4) * 0.25
    })),
    motes: Array.from({ length: 52 }, (_, i) => ({
        x: (i * 211) % 2400,
        y: (i * 149) % 1400,
        size: 1 + (i % 4) * 0.45,
        phase: i * 0.73
    }))
};

function isOnScreenWorld(x, y, pad = 180) {
    return x >= camera.x - pad && x <= camera.x + canvas.width + pad && y >= camera.y - pad && y <= camera.y + canvas.height + pad;
}

function drawWorldGlow(wx, wy, radius, color, alpha = 1) {
    const sx = wx - camera.x;
    const sy = wy - camera.y;
    const g = ctx.createRadialGradient(sx, sy, 1, sx, sy, radius);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}


function drawWorldEllipseGlow(wx, wy, rx, ry, color, alpha = 1, rotation = 0) {
    const sx = wx - camera.x;
    const sy = wy - camera.y;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(sx, sy);
    ctx.rotate(rotation);
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, Math.max(rx, ry));
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(rx, ry), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawLampPost25D(meta) {
    const { x, y, edgeX, edgeY, road, nx, ny, angle, i } = meta;
    const sx = x - camera.x;
    const sy = y - camera.y;
    const pulse = 0.88 + Math.sin(performance.now() / 560 + i * 1.37) * 0.10;
    const isHighway = road && road.type === "highway";
    const poleH = isHighway ? 34 : 28;
    const armLen = isHighway ? 25 : 20;
    const lampX = x + nx * armLen;
    const lampY = y + ny * armLen - poleH;
    const footX = x - camera.x;
    const footY = y - camera.y;
    const topX = x - camera.x;
    const topY = y - camera.y - poleH;

    drawWorldEllipseGlow(lampX, lampY + poleH * 0.64, isHighway ? 86 : 68, isHighway ? 34 : 28, "rgba(255,197,86,0.28)", pulse * 0.70, angle || 0);
    drawWorldGlow(lampX, lampY, isHighway ? 76 : 58, "rgba(255,214,124,0.23)", pulse);

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Мягкая 2.5D тень от столба и консоли.
    ctx.strokeStyle = "rgba(0,0,0,0.26)";
    ctx.lineWidth = isHighway ? 7 : 6;
    ctx.beginPath();
    ctx.moveTo(footX + 9, footY + 8);
    ctx.lineTo(topX + 13, topY + 13);
    ctx.lineTo(lampX - camera.x + 13, lampY - camera.y + 13);
    ctx.stroke();

    // Бордюрная крепежная пластина — фонарь стоит на тротуаре, а не в воздухе.
    roundedRect(sx - 7, sy - 4, 14, 8, 3);
    ctx.fillStyle = "rgba(9,14,22,0.78)";
    ctx.fill();
    ctx.strokeStyle = "rgba(110,135,160,0.42)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Короткий крепеж от края дороги к основанию.
    ctx.strokeStyle = "rgba(8,13,20,0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(edgeX - camera.x, edgeY - camera.y);
    ctx.lineTo(sx, sy);
    ctx.stroke();

    // 2.5D столб: темная сторона + светлая грань.
    const poleGrad = ctx.createLinearGradient(footX - 4, footY, topX + 4, topY);
    poleGrad.addColorStop(0, "rgba(32,42,55,0.98)");
    poleGrad.addColorStop(0.48, "rgba(88,103,121,0.96)");
    poleGrad.addColorStop(1, "rgba(18,25,35,0.98)");
    ctx.strokeStyle = poleGrad;
    ctx.lineWidth = isHighway ? 5 : 4;
    ctx.beginPath();
    ctx.moveTo(footX, footY);
    ctx.lineTo(topX, topY);
    ctx.stroke();

    ctx.strokeStyle = "rgba(190,213,235,0.34)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(footX - 1.5, footY - 1);
    ctx.lineTo(topX - 1.5, topY + 1);
    ctx.stroke();

    // Консоль и головка фонаря вынесены над дорогой.
    const armEndX = lampX - camera.x;
    const armEndY = lampY - camera.y;
    ctx.strokeStyle = "rgba(42,54,69,0.98)";
    ctx.lineWidth = isHighway ? 4 : 3;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo((topX + armEndX) / 2, topY - 7, armEndX, armEndY);
    ctx.stroke();

    ctx.shadowColor = "rgba(255,209,112,0.95)";
    ctx.shadowBlur = isHighway ? 22 : 18;
    roundedRect(armEndX - 8, armEndY - 4, 16, 8, 4);
    ctx.fillStyle = "rgba(255,225,150,0.98)";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,246,205,0.70)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Маленькая декоративная точка питания/индикатор.
    ctx.fillStyle = "rgba(92,205,255,0.65)";
    ctx.beginPath();
    ctx.arc(topX, topY, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawStreetSign25D(meta) {
    const { x, y, edgeX, edgeY, nx, ny, road, angle, i } = meta;
    const sx = x - camera.x;
    const sy = y - camera.y;
    const label = road && road.name ? String(road.name).replace(/^ул\.\s*/i, "УЛ. ").toUpperCase() : (i % 2 === 0 ? "LIFE CITY" : "ЦЕНТР");
    const shortLabel = label.length > 16 ? label.slice(0, 15) + "…" : label;
    const pulse = 0.78 + Math.sin(performance.now() / 900 + i) * 0.07;
    const panelX = x + nx * 22;
    const panelY = y + ny * 22 - 22;
    const psx = panelX - camera.x;
    const psy = panelY - camera.y;
    const w = Math.min(112, Math.max(58, shortLabel.length * 6.8 + 22));
    const h = 24;

    drawWorldGlow(panelX, panelY, 42, "rgba(72,197,255,0.16)", pulse);

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Тень, чтобы табличка стала объемной и привязанной к земле.
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(sx + 6, sy + 7);
    ctx.lineTo(psx + 8, psy + h / 2 + 8);
    ctx.stroke();

    // Крепление от бордюра к стойке.
    ctx.strokeStyle = "rgba(8,13,20,0.70)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(edgeX - camera.x, edgeY - camera.y);
    ctx.lineTo(sx, sy);
    ctx.stroke();

    // Две стойки под табличкой.
    const postGrad = ctx.createLinearGradient(sx - 3, sy, sx + 3, psy);
    postGrad.addColorStop(0, "rgba(24,34,48,0.96)");
    postGrad.addColorStop(0.55, "rgba(92,109,128,0.95)");
    postGrad.addColorStop(1, "rgba(19,29,43,0.98)");
    ctx.strokeStyle = postGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx - 4, sy);
    ctx.lineTo(psx - w * 0.28, psy + h / 2);
    ctx.moveTo(sx + 4, sy);
    ctx.lineTo(psx + w * 0.28, psy + h / 2);
    ctx.stroke();

    // Светящаяся неоновая рамка.
    ctx.shadowColor = "rgba(72,205,255,0.75)";
    ctx.shadowBlur = 16;
    roundedRect(psx - w / 2, psy - h / 2, w, h, 6);
    const panelGrad = ctx.createLinearGradient(psx - w / 2, psy - h / 2, psx + w / 2, psy + h / 2);
    panelGrad.addColorStop(0, "rgba(8,18,31,0.98)");
    panelGrad.addColorStop(0.52, "rgba(18,43,65,0.96)");
    panelGrad.addColorStop(1, "rgba(5,13,24,0.98)");
    ctx.fillStyle = panelGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(98,220,255,0.88)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Верхняя грань 2.5D.
    ctx.fillStyle = "rgba(180,235,255,0.12)";
    roundedRect(psx - w / 2 + 4, psy - h / 2 + 3, w - 8, 4, 2);
    ctx.fill();

    ctx.fillStyle = "rgba(222,247,255,0.96)";
    ctx.font = "bold 8.5px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(shortLabel, psx, psy + 0.5);

    // Маленький направляющий шеврон.
    ctx.fillStyle = "rgba(255,210,105,0.88)";
    ctx.beginPath();
    ctx.moveTo(psx + w / 2 - 12, psy);
    ctx.lineTo(psx + w / 2 - 18, psy - 5);
    ctx.lineTo(psx + w / 2 - 18, psy + 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function getRoadEdgeOffsetV2(road) {
    // Половина ширины дороги + небольшой тротуарный отступ.
    // Так фонари/таблички стоят именно у края дороги, а не на полотне.
    return (road.width || 60) / 2 + (road.type === "lane" ? 9 : 14);
}

function isNearRoadIntersectionV2(x, y, road, safeRadius = 82) {
    // Не ставим объекты прямо в перекрестках — там они визуально съезжают с края дороги.
    for (const other of roads) {
        if (other === road || !other.points || other.points.length < 2) continue;
        let near = false;
        forEachRoadSegment(other, (a, b) => {
            if (near) return;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const lenSq = dx * dx + dy * dy;
            if (lenSq <= 1) return;
            const t = clamp(((x - a.x) * dx + (y - a.y) * dy) / lenSq, 0, 1);
            const px = a.x + dx * t;
            const py = a.y + dy * t;
            const dist = Math.hypot(x - px, y - py);
            const edgeSafe = (other.width || 60) / 2 + safeRadius;
            if (dist < edgeSafe) near = true;
        });
        if (near) return true;
    }
    return false;
}

function forEachRoadLightPoint(step, callback, options = {}) {
    // Универсальная генерация roadside-объектов.
    // Важно: фонари и таблички получают разные phase/sideMode, поэтому больше не появляются в одной точке.
    const minDistance = options.minDistance ?? Math.max(135, step * 0.55);
    const skipIntersections = options.skipIntersections !== false;
    const phase = clamp(options.phase ?? 0, 0, 0.95);
    const sideMode = options.sideMode || "alternate"; // alternate | left | right | outside
    const edgeExtra = options.edgeExtra ?? 0;
    const points = [];

    function isPointFree(x, y, extraRadius = 0) {
        const wantedDistance = minDistance + extraRadius;
        for (const p of points) {
            if (Math.hypot(p.x - x, p.y - y) < wantedDistance) return false;
        }
        return true;
    }

    for (const road of roads) {
        if (!road.points || road.points.length < 2) continue;
        const sideOffset = getRoadEdgeOffsetV2(road) + edgeExtra;

        forEachRoadSegment(road, (a, b, segmentIndex) => {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy);
            if (len < 70) return;

            const ux = dx / len;
            const uy = dy / len;
            const nx = -dy / len;
            const ny = dx / len;
            const usableStart = Math.min(105, len * 0.16);
            const usableEnd = len - usableStart;
            if (usableEnd <= usableStart + 80) return;

            let localIndex = 0;
            for (let dist = usableStart + step * phase; dist <= usableEnd; dist += step) {
                const baseX = a.x + ux * dist;
                const baseY = a.y + uy * dist;

                if (skipIntersections && isNearRoadIntersectionV2(baseX, baseY, road, 54)) continue;

                let side;
                if (sideMode === "left") side = 1;
                else if (sideMode === "right") side = -1;
                else if (sideMode === "outside") {
                    // Для горизонтальных дорог чаще ставим ниже/выше, для вертикальных — снаружи по X.
                    side = Math.abs(dx) >= Math.abs(dy) ? ((segmentIndex + localIndex) % 2 === 0 ? 1 : -1) : ((segmentIndex + localIndex) % 2 === 0 ? -1 : 1);
                } else {
                    side = (localIndex + segmentIndex) % 2 === 0 ? 1 : -1;
                }

                const x = baseX + nx * sideOffset * side;
                const y = baseY + ny * sideOffset * side;

                // Проверяем уже вынесенную точку, а не только центр дороги. Так объекты не попадают на соседнюю дорогу у перекрестков.
                if (skipIntersections && isNearRoadIntersectionV2(x, y, road, 24)) {
                    localIndex++;
                    continue;
                }

                if (!isPointFree(x, y)) {
                    localIndex++;
                    continue;
                }

                points.push({
                    x,
                    y,
                    baseX,
                    baseY,
                    nx: nx * side,
                    ny: ny * side,
                    side,
                    road,
                    i: points.length
                });
                localIndex++;
            }
        });
    }

    for (const p of points) callback(p.x, p.y, p.road, p.i, p);
}

function getRoadsideObjectId25D(kind, road, segmentIndex, localIndex) {
    const roadName = String(road?.name || "road")
        .trim()
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/[^a-zа-я0-9]+/gi, "_")
        .replace(/^_+|_+$/g, "") || "road";
    return `${kind}_${roadName}_${segmentIndex}_${localIndex}`;
}

function applyRoadsideOverride25D(item, override) {
    if (!item || !override) return item;
    if (Number.isFinite(Number(override.x))) item.x = Math.round(Number(override.x));
    if (Number.isFinite(Number(override.y))) item.y = Math.round(Number(override.y));
    if (Number.isFinite(Number(override.edgeX))) item.edgeX = Math.round(Number(override.edgeX));
    if (Number.isFinite(Number(override.edgeY))) item.edgeY = Math.round(Number(override.edgeY));
    item.manual = true;
    return item;
}

function getRoadsideOverrideMap25D(kind) {
    const list = kind === "streetLight" ? (typeof streetLightOverrides !== "undefined" ? streetLightOverrides : []) : (typeof streetSignOverrides !== "undefined" ? streetSignOverrides : []);
    const map = new Map();
    if (Array.isArray(list)) {
        for (const item of list) {
            if (item && item.id) map.set(String(item.id), item);
        }
    }
    return map;
}

let roadsideLayoutV3Cache = null;

function getRoadsideLayoutV3() {
    // Генерируем фонари и таблички вместе, чтобы они не попадали в одну точку.
    // Опорная точка объекта = край дороги/бордюр. Светильник/табличка рисуются уже от этой точки.
    if (roadsideLayoutV3Cache) return roadsideLayoutV3Cache;

    const layout = { lights: [], signs: [] };
    const occupied = [];

    function pointFree(x, y, minDist) {
        for (const p of occupied) {
            if (Math.hypot(p.x - x, p.y - y) < Math.max(minDist, p.r)) return false;
        }
        return true;
    }

    function addOccupied(x, y, r) {
        occupied.push({ x, y, r });
    }

    function addRoadsidePoint(kind, road, a, b, segmentIndex, dist, localIndex, sideBias = 0) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        if (len < 90) return;

        const ux = dx / len;
        const uy = dy / len;
        const nxRaw = -dy / len;
        const nyRaw = dx / len;

        // Сторона чередуется, но для табличек есть сдвиг, чтобы они не совпадали с фонарями.
        const side = ((segmentIndex + localIndex + sideBias) % 2 === 0) ? 1 : -1;
        const nx = nxRaw * side;
        const ny = nyRaw * side;

        const centerX = a.x + ux * dist;
        const centerY = a.y + uy * dist;

        // ВАЖНО: postX/postY — ровно край дороги + маленький бордюрный отступ.
        // Не выносим далеко наружу, чтобы объект визуально стоял на краю дороги.
        const roadHalf = (road.width || 60) / 2;
        const curbOffset = kind === "light" ? 3 : 5;
        const postX = centerX + nx * (roadHalf + curbOffset);
        const postY = centerY + ny * (roadHalf + curbOffset);
        const edgeX = centerX + nx * roadHalf;
        const edgeY = centerY + ny * roadHalf;

        // У перекрестков визуально кажется, что объекты “съехали”, поэтому оставляем маленькую защитную зону.
        if (isNearRoadIntersectionV2(centerX, centerY, road, kind === "light" ? 34 : 42)) return;
        if (!pointFree(postX, postY, kind === "light" ? 108 : 82)) return;

        const item = {
            id: getRoadsideObjectId25D(kind === "light" ? "streetLight" : "streetSign", road, segmentIndex, localIndex),
            kind: kind === "light" ? "streetLight" : "streetSign",
            name: `${kind === "light" ? "Фонарь" : "Табличка"}: ${road.name || "дорога"}`,
            x: postX,
            y: postY,
            edgeX,
            edgeY,
            road,
            roadName: road.name || "",
            nx,
            ny,
            angle: Math.atan2(dy, dx),
            i: occupied.length
        };

        if (kind === "light") {
            layout.lights.push(item);
            addOccupied(postX, postY, 102);
        } else {
            layout.signs.push(item);
            addOccupied(postX, postY, 76);
        }
    }

    for (const road of roads) {
        if (!road.points || road.points.length < 2) continue;
        forEachRoadSegment(road, (a, b, segmentIndex) => {
            const len = Math.hypot(b.x - a.x, b.y - a.y);
            if (len < 120) return;

            const startPad = Math.min(82, len * 0.13);
            const endPad = len - startPad;
            if (endPad <= startPad) return;

            // Чуть больше фонарей и табличек, но без слипания.
            const lightStep = road.type === "highway" ? 225 : 205;
            const signStep = road.type === "highway" ? 330 : 295;

            let lightIndex = 0;
            for (let d = startPad + 28; d <= endPad; d += lightStep) {
                addRoadsidePoint("light", road, a, b, segmentIndex, d, lightIndex, 0);
                lightIndex++;
            }

            let signIndex = 0;
            for (let d = startPad + 118; d <= endPad; d += signStep) {
                addRoadsidePoint("sign", road, a, b, segmentIndex, d, signIndex, 1);
                signIndex++;
            }
        });
    }

    const lightOverrides = getRoadsideOverrideMap25D("streetLight");
    const signOverrides = getRoadsideOverrideMap25D("streetSign");
    layout.lights = layout.lights.map(item => applyRoadsideOverride25D(item, lightOverrides.get(item.id)));
    layout.signs = layout.signs.map(item => applyRoadsideOverride25D(item, signOverrides.get(item.id)));

    roadsideLayoutV3Cache = layout;
    return layout;
}

function drawStreetLightsV2() {
    ctx.save();
    const layout = getRoadsideLayoutV3();
    const sorted = layout.lights.slice().sort((a, b) => (a.y - b.y));
    for (const meta of sorted) {
        if (!isOnScreenWorld(meta.x, meta.y, 300)) continue;
        drawLampPost25D(meta);
    }
    ctx.restore();
}

function drawRoadSurfaceDetailsV2() {
    ctx.save();
    for (const road of roads) {
        if (!road.points || road.points.length < 2) continue;
        forEachRoadSegment(road, (a, b) => {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy);
            if (len < 40) return;
            const angle = Math.atan2(dy, dx);
            const nx = -dy / len;
            const ny = dx / len;
            const count = Math.floor(len / 130);
            for (let i = 0; i < count; i++) {
                const t = (i + 0.38) / count;
                const laneJitter = ((i % 5) - 2) * (road.width * 0.09);
                const wx = a.x + dx * t + nx * laneJitter;
                const wy = a.y + dy * t + ny * laneJitter;
                if (!isOnScreenWorld(wx, wy, 80)) continue;
                ctx.save();
                ctx.translate(wx - camera.x, wy - camera.y);
                ctx.rotate(angle + Math.sin(i) * 0.18);
                ctx.strokeStyle = "rgba(255,255,255,0.045)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-10, 0);
                ctx.quadraticCurveTo(-2, -4, 10, 1);
                ctx.stroke();
                ctx.restore();
            }
        });
    }
    ctx.restore();
}

function drawCityPropsV2() {
    ctx.save();
    const layout = getRoadsideLayoutV3();
    const sorted = layout.signs.slice().sort((a, b) => (a.y - b.y));
    for (const meta of sorted) {
        if (!isOnScreenWorld(meta.x, meta.y, 190)) continue;
        drawStreetSign25D(meta);
    }
    ctx.restore();
}

function drawAmbientParticlesV2() {
    visualFXV2.tick += 1;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const m of visualFXV2.motes) {
        const sx = ((m.x - camera.x * 0.18 + Math.sin(visualFXV2.tick / 90 + m.phase) * 24) % (canvas.width + 140) + canvas.width + 140) % (canvas.width + 140) - 70;
        const sy = ((m.y - camera.y * 0.14 + Math.cos(visualFXV2.tick / 110 + m.phase) * 18) % (canvas.height + 120) + canvas.height + 120) % (canvas.height + 120) - 60;
        ctx.globalAlpha = 0.06 + (m.size * 0.018);
        ctx.fillStyle = "rgba(170,215,255,0.8)";
        ctx.beginPath();
        ctx.arc(sx, sy, m.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawRainV2() {
    ctx.save();
    ctx.strokeStyle = "rgba(158,205,255,0.23)";
    ctx.lineWidth = 1;
    for (const drop of visualFXV2.rain) {
        drop.y += drop.speed;
        drop.x += drop.drift;
        if (drop.y > canvas.height + 40) drop.y = -40;
        if (drop.x > canvas.width + 80) drop.x = -80;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.drift * 2.4, drop.y + drop.len);
        ctx.stroke();
    }
    ctx.restore();
}

function drawCinematicOverlayV2() {
    ctx.save();
    const top = ctx.createLinearGradient(0, 0, 0, canvas.height);
    top.addColorStop(0, "rgba(4,10,22,0.18)");
    top.addColorStop(0.48, "rgba(9,20,37,0.06)");
    top.addColorStop(1, "rgba(1,4,10,0.16)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const vg = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.20, canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.78);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.34)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 0.035;
    ctx.fillStyle = "rgba(88,199,255,0.25)";
    for (let y = 0; y < canvas.height; y += 4) ctx.fillRect(0, y, canvas.width, 1);
    ctx.restore();
}

function drawVisualOverhaulV2WorldPreBuildings() {
    drawRoadSurfaceDetailsV2();
    drawStreetLightsV2();
    drawCityPropsV2();
}


function drawVisualOverhaulV2Screen() {
    drawAmbientParticlesV2();
    drawRainV2();
    drawCinematicOverlayV2();
}


function getRoadColors25D(road) {
    if (road.type === "highway") {
        return { asphalt: "#202428", edgeDark: "#11161a", edgeLight: "#6f7478", sidewalk: "#3a3f43", curb: "#8a8e91" };
    }
    if (road.type === "avenue") {
        return { asphalt: "#262a2e", edgeDark: "#151a1e", edgeLight: "#777b7f", sidewalk: "#3b4044", curb: "#8f9396" };
    }
    if (road.type === "lane") {
        return { asphalt: "#2b2f32", edgeDark: "#181d20", edgeLight: "#696e72", sidewalk: "#34393d", curb: "#7d8286" };
    }
    return { asphalt: "#292d31", edgeDark: "#171c20", edgeLight: "#73777b", sidewalk: "#383d41", curb: "#858a8d" };
}

function drawRoadIntersections25D() {
    // Перекрёстки рисуются отдельными площадками, чтобы дороги выглядели цельной 2.5D-сеткой,
    // а не набором наложенных толстых линий.
    const done = new Set();
    for (let i = 0; i < roads.length; i++) {
        const r1 = roads[i];
        forEachRoadSegment(r1, (a, b) => {
            const h1 = Math.abs(a.y - b.y) < 0.01;
            const v1 = Math.abs(a.x - b.x) < 0.01;
            if (!h1 && !v1) return;
            for (let j = i + 1; j < roads.length; j++) {
                const r2 = roads[j];
                forEachRoadSegment(r2, (c, d) => {
                    const h2 = Math.abs(c.y - d.y) < 0.01;
                    const v2 = Math.abs(c.x - d.x) < 0.01;
                    if (!((h1 && v2) || (v1 && h2))) return;
                    const ix = h1 ? c.x : a.x;
                    const iy = h1 ? a.y : c.y;
                    const minX1 = Math.min(a.x, b.x), maxX1 = Math.max(a.x, b.x);
                    const minY1 = Math.min(a.y, b.y), maxY1 = Math.max(a.y, b.y);
                    const minX2 = Math.min(c.x, d.x), maxX2 = Math.max(c.x, d.x);
                    const minY2 = Math.min(c.y, d.y), maxY2 = Math.max(c.y, d.y);
                    if (ix < minX1 || ix > maxX1 || iy < minY1 || iy > maxY1 || ix < minX2 || ix > maxX2 || iy < minY2 || iy > maxY2) return;
                    const key = `${Math.round(ix)}:${Math.round(iy)}`;
                    if (done.has(key)) return;
                    done.add(key);
                    const pad = Math.max(r1.width, r2.width) * 0.62;
                    const x = ix - camera.x;
                    const y = iy - camera.y;
                    ctx.save();
                    roundedRect(x - pad - 16, y - pad - 16, pad * 2 + 32, pad * 2 + 32, 18);
                    ctx.fillStyle = "rgba(16,20,23,0.52)";
                    ctx.fill();
                    roundedRect(x - pad, y - pad, pad * 2, pad * 2, 14);
                    ctx.fillStyle = "#292d31";
                    ctx.fill();
                    ctx.strokeStyle = "rgba(255,255,255,0.10)";
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.restore();
                });
            }
        });
    }
}

function drawRoadCurbHighlights25D(road) {
    // Верхняя светлая и нижняя темная кромки дают дорогам толщину без изменения коллизий.
    const c = getRoadColors25D(road);
    forEachRoadSegment(road, (a, b) => {
        if (!isAxisAlignedSegment(a, b)) return;
        const horizontal = Math.abs(a.y - b.y) < 0.01;
        const edge = road.width / 2 + 4;
        if (horizontal) {
            drawBrokenSegmentLine(a, b, -edge, road, "rgba(255,255,255,0.22)", 3, null);
            drawBrokenSegmentLine(a, b, edge, road, "rgba(0,0,0,0.30)", 4, null);
            drawBrokenSegmentLine(a, b, -edge - 9, road, c.curb, 3, null);
            drawBrokenSegmentLine(a, b, edge + 9, road, "#1b2024", 3, null);
        } else {
            drawBrokenSegmentLine(a, b, -edge, road, "rgba(255,255,255,0.18)", 3, null);
            drawBrokenSegmentLine(a, b, edge, road, "rgba(0,0,0,0.32)", 4, null);
            drawBrokenSegmentLine(a, b, -edge - 9, road, c.curb, 3, null);
            drawBrokenSegmentLine(a, b, edge + 9, road, "#1b2024", 3, null);
        }
    });
}

function drawMegaCityRoads() {
    // Земля с легкой глубиной вместо плоского однотонного фона.
    const ground = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    ground.addColorStop(0, "#11181b");
    ground.addColorStop(0.55, "#0f1518");
    ground.addColorStop(1, "#0b1113");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawBuildingZones();
    for (let p of parks) drawPark(p);

    // Слой 1: широкая тень дороги и тротуарная плита.
    for (let road of roads) {
        const c = getRoadColors25D(road);
        drawPolyline(road.points, road.width + 38, "rgba(0,0,0,0.24)");
        drawPolyline(road.points, road.width + 30, c.sidewalk);
    }

    // Слой 2: бордюр как физическая толщина дороги.
    for (let road of roads) {
        const c = getRoadColors25D(road);
        drawPolyline(road.points, road.width + 16, c.edgeDark);
        drawPolyline(road.points, road.width + 10, c.edgeLight);
        drawPolyline(road.points, road.width + 4, "rgba(255,255,255,0.08)");
    }

    drawRoadIntersections25D();

    // Слой 3: асфальт.
    for (let road of roads) {
        const c = getRoadColors25D(road);
        drawPolyline(road.points, road.width, c.asphalt);
    }

    for (let road of roads) drawRoadCurbHighlights25D(road);
    for (let road of roads) drawRoadMarkings(road);
    drawVisualOverhaulV2WorldPreBuildings();
}

function closestPointOnSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return { x: ax, y: ay, t: 0 };
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    return { x: ax + dx * t, y: ay + dy * t, t };
}

function distanceToRoad(px, py, road) {
    let best = Infinity;
    forEachRoadSegment(road, (a, b) => {
        const p = closestPointOnSegment(px, py, a.x, a.y, b.x, b.y);
        const d = Math.sqrt((px - p.x) ** 2 + (py - p.y) ** 2);
        if (d < best) best = d;
    });
    return best;
}

function drawRoadDebug() {
    if (!isDevOptionOn("showRoadBounds")) return;
    ctx.save();
    for (let i = 0; i < roads.length; i++) {
        const road = roads[i];
        drawPolyline(road.points, road.width + 2, "rgba(255,230,0,0.26)", "round", "round");
        ctx.fillStyle = "lime";
        ctx.fillRect(road.points[0].x - camera.x - 4, road.points[0].y - camera.y - 4, 8, 8);
        ctx.fillStyle = "red";
        const last = road.points[road.points.length - 1];
        ctx.fillRect(last.x - camera.x - 4, last.y - camera.y - 4, 8, 8);
        ctx.fillStyle = "yellow";
        ctx.font = "12px Arial";
        ctx.fillText(`R${i} ${road.name}`, road.points[0].x - camera.x + 8, road.points[0].y - camera.y - 8);
    }
    ctx.restore();
}

function getCurrentDistrict() {
    const px = myPlayer.x + 10;
    const py = myPlayer.y + 10;
    for (let d of districts) {
        if (px >= d.x && px <= d.x + d.w && py >= d.y && py <= d.y + d.h) return d.name;
    }
    return "Вне района";
}

function getCurrentStreet() {
    const px = myPlayer.x + 10;
    const py = myPlayer.y + 10;
    const nearbyRoads = [];
    for (let r of roads) {
        const dist = distanceToRoad(px, py, r);
        if (dist <= r.width / 2 + 24) nearbyRoads.push({ name: r.name, dist });
    }
    nearbyRoads.sort((a, b) => a.dist - b.dist);
    const uniqueRoads = [];
    for (let road of nearbyRoads) if (!uniqueRoads.includes(road.name)) uniqueRoads.push(road.name);
    if (uniqueRoads.length === 0) return "Неизвестная улица";
    return uniqueRoads.slice(0, 2).join(" / ");
}


// ===============================
// 🧍 ОТРИСОВКА ЧЕЛОВЕКА
// Рисует персонажа из частей тела: голова, тело, руки, ноги и одежда.
// Угол поворота задаёт направление лица, walkTime — фазу шага.
// ===============================
function drawHumanCharacter(player, options = {}) {
    const cx = player.x + PLAYER_SIZE / 2 - camera.x;
    const cy = player.y + PLAYER_SIZE / 2 - camera.y;
    const angle = player.angle ?? -Math.PI / 2;
    const walk = player.walkTime || 0;
    const isLocal = !!options.isLocal;

    const speed = getVectorLength(player.velX || 0, player.velY || 0);
    const walkPower = isLocal ? clamp(speed / (player.maxSpeed || 2.45), 0, 1) : 1;
    const avatar = normalizeAvatarClient(player.avatar);
    const colorObj = AVATAR_CONFIG.clothingColors.find(c => c.value === avatar.clothingColor) || AVATAR_CONFIG.clothingColors[0];
    const isWorkerUniform = avatar.clothingStyle === "worker";
    const clothesColor = isWorkerUniform ? "#ff8a00" : colorObj.color;
    const bodyScale = avatar.bodyType === "slim" ? 0.9 : avatar.bodyType === "strong" ? 1.13 : 1;
    const shoulderScale = avatar.gender === "female" ? 0.92 : 1;

    // Реалистичная походка сверху: левая нога идёт вперёд вместе с правой рукой,
    // правая нога — вместе с левой рукой. Фазы строго противоположные.
    const leftLegPhase = Math.sin(walk);
    const rightLegPhase = -leftLegPhase;
    const leftArmPhase = rightLegPhase;
    const rightArmPhase = leftLegPhase;

    const stride = 5.5 * walkPower;
    const armStride = 4.5 * walkPower;
    const bodyBob = Math.abs(Math.sin(walk * 2)) * 0.75 * walkPower;
    const shoulderSway = Math.sin(walk) * 0.65 * walkPower;

    ctx.save();
    ctx.translate(cx, cy - bodyBob);
    ctx.rotate(angle);
    ctx.scale(bodyScale, shoulderScale);

    // Мягкая тень под персонажем
    ctx.save();
    ctx.rotate(-angle);
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.beginPath();
    ctx.ellipse(0, 8 + bodyBob, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    function drawLimb(points, color, width, glowColor = null) {
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (glowColor) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 4;
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        ctx.restore();
    }

    const nowMs = Date.now();
    const isCleaning = Number(player.cleaningUntil) > nowMs;
    const cleaningStartedAt = Number(player.cleaningStartedAt) || (nowMs - CLEAN_TRASH_DURATION_CLIENT);
    const cleaningProgress = isCleaning
        ? clamp((nowMs - cleaningStartedAt) / Math.max(1, Number(player.cleaningUntil) - cleaningStartedAt), 0, 1)
        : 0;

    function drawBroom(handX, handY, phase, cleaning) {
        const sweep = cleaning ? Math.sin(phase * 7.5) * 4.8 : Math.sin(walk + 0.7) * 1.2 * walkPower;
        const baseX = handX + 1.3;
        const baseY = handY + 0.2;
        const tipX = cleaning ? 16.5 : 11.5;
        const tipY = handY + 8.5 + sweep;

        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = cleaning ? "rgba(255,195,51,0.35)" : "rgba(255,195,51,0.18)";
        ctx.shadowBlur = cleaning ? 7 : 3;

        ctx.strokeStyle = "#b98242";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        ctx.strokeStyle = "#f0c36b";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(baseX - 0.5, baseY);
        ctx.lineTo(tipX - 0.5, tipY);
        ctx.stroke();

        ctx.strokeStyle = "#d9a13d";
        ctx.lineWidth = 1.4;
        for (let i = -3; i <= 3; i += 1.5) {
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(tipX + 5, tipY + i);
            ctx.stroke();
        }

        if (cleaning) {
            ctx.globalAlpha = 0.96 + Math.sin(phase * 14) * 0.12;
            ctx.strokeStyle = "rgba(230,238,247,0.7)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(tipX + 4.5, tipY, 5 + Math.sin(phase * 8) * 1.2, -0.7, 0.7);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Ноги — с коленями и разной фазой шага.
    const pantsColor = isWorkerUniform ? "#20242d" : (avatar.clothingStyle === "business" ? "#20242d" : (avatar.clothingStyle === "sport" ? "#1d3550" : "#26364f"));
    const shoeColor = "#151b24";

    const leftFootX = -9 + leftLegPhase * stride;
    const rightFootX = -9 + rightLegPhase * stride;
    const leftKneeX = -5 + leftLegPhase * stride * 0.45;
    const rightKneeX = -5 + rightLegPhase * stride * 0.45;

    drawLimb([
        { x: -4, y: -4.2 },
        { x: leftKneeX, y: -5.2 - leftLegPhase * 0.7 },
        { x: leftFootX, y: -6.2 }
    ], pantsColor, 4.0);

    drawLimb([
        { x: -4, y: 4.2 },
        { x: rightKneeX, y: 5.2 - rightLegPhase * 0.7 },
        { x: rightFootX, y: 6.2 }
    ], pantsColor, 4.0);

    // Ступни слегка разворачиваются по направлению шага.
    drawLimb([{ x: leftFootX - 1.7, y: -6.2 }, { x: leftFootX + 2.0, y: -6.2 }], shoeColor, 3.1);
    drawLimb([{ x: rightFootX - 1.7, y: 6.2 }, { x: rightFootX + 2.0, y: 6.2 }], shoeColor, 3.1);

    // Руки — противоположны ногам, чтобы не было синхронного "робота".
    const skinColor = "#d6a878";
    const sleeveColor = clothesColor;

    const cleaningPhase = cleaningProgress * Math.PI * 2;
    const leftHandX = isCleaning ? 1.5 + Math.sin(cleaningPhase * 4) * 1.1 : -1 + leftArmPhase * armStride;
    const rightHandX = isCleaning ? 1.5 + Math.sin(cleaningPhase * 4 + Math.PI) * 1.1 : -1 + rightArmPhase * armStride;

    // Короткий рукав
    drawLimb([{ x: 1, y: -8.2 }, { x: -1.5 + shoulderSway, y: -10.1 }], sleeveColor, 4.0, isLocal ? "rgba(88,199,255,0.22)" : null);
    drawLimb([{ x: 1, y: 8.2 }, { x: -1.5 - shoulderSway, y: 10.1 }], sleeveColor, 4.0, isLocal ? "rgba(88,199,255,0.22)" : null);

    // Предплечья
    drawLimb([
        { x: -1.5 + shoulderSway, y: -10.1 },
        { x: leftHandX, y: -12.2 - leftArmPhase * 0.9 }
    ], skinColor, 3.2);

    drawLimb([
        { x: -1.5 - shoulderSway, y: 10.1 },
        { x: rightHandX, y: 12.2 - rightArmPhase * 0.9 }
    ], skinColor, 3.2);

    if (isWorkerUniform) {
        drawBroom(rightHandX, 12.2 - rightArmPhase * 0.9, isCleaning ? cleaningPhase : walk, isCleaning);
    }

    // Тело / одежда
    const bodyGrad = ctx.createLinearGradient(-8, -8, 7, 8);
    bodyGrad.addColorStop(0, clothesColor);
    bodyGrad.addColorStop(0.55, clothesColor);
    bodyGrad.addColorStop(1, avatar.clothingStyle === "business" ? "#111827" : "#0c2f55");

    roundedRect(-7, -8, 15, 16, 6);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = isLocal ? "rgba(126,217,255,0.8)" : "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    if (isWorkerUniform) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 190, 0.92)";
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(-4.2, -6.2);
        ctx.lineTo(3.4, -1.2);
        ctx.moveTo(-4.2, 6.2);
        ctx.lineTo(3.4, 1.2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.72)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-5.5, 0);
        ctx.lineTo(6, 0);
        ctx.stroke();
        ctx.restore();
    }

    // Направление лица: голова впереди по оси X
    ctx.fillStyle = "#f0bf8a";
    ctx.beginPath();
    ctx.arc(10, 0, 5.4, 0, Math.PI * 2);
    ctx.fill();

    // Волосы / головной убор
    const hairColor = isWorkerUniform ? "#ffd34d" : (avatar.hairStyle === "cap" ? clothesColor : "rgba(38,28,20,0.88)");
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    if (isWorkerUniform) {
        ctx.arc(11, -1.5, 4.1, Math.PI * 0.78, Math.PI * 2.12);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(14.3, -0.15, 3.4, 1.25, 0, 0, Math.PI * 2);
    } else if (avatar.hairStyle === "long") {
        ctx.ellipse(8.7, 0, 4.4, 6.2, 0, Math.PI * 0.75, Math.PI * 1.25);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(11, -1.5, 3.8, Math.PI * 0.8, Math.PI * 2.15);
    } else if (avatar.hairStyle === "medium") {
        ctx.arc(10.5, -1.4, 4.1, Math.PI * 0.82, Math.PI * 2.08);
    } else if (avatar.hairStyle === "cap") {
        ctx.arc(11, -1.5, 3.9, Math.PI * 0.8, Math.PI * 2.1);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(14.2, -0.2, 3.2, 1.3, 0, 0, Math.PI * 2);
    } else {
        ctx.arc(11, -1.5, 3.4, Math.PI * 0.95, Math.PI * 2.05);
    }
    ctx.fill();

    // Лицо/нос — маленькая точка направления
    ctx.fillStyle = "rgba(255,245,220,0.9)";
    ctx.beginPath();
    ctx.arc(14.5, 0, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Обводка локального персонажа
    if (isLocal) {
        ctx.strokeStyle = "rgba(88,199,255,0.32)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, 15.5, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();

    if (isCleaning) {
        const barW = 42;
        const barH = 6;
        const bx = cx - barW / 2;
        const by = cy - 36;
        ctx.save();
        roundedRect(bx, by, barW, barH, 4);
        ctx.fillStyle = "rgba(6,16,28,0.88)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,195,51,0.55)";
        ctx.lineWidth = 1;
        ctx.stroke();
        roundedRect(bx + 1, by + 1, (barW - 2) * cleaningProgress, barH - 2, 3);
        const grad = ctx.createLinearGradient(bx, by, bx + barW, by);
        grad.addColorStop(0, "#ffc233");
        grad.addColorStop(0.55, "#81f04f");
        grad.addColorStop(1, "#58c7ff");
        ctx.fillStyle = grad;
        ctx.shadowColor = "rgba(255,195,51,0.45)";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
    }

    // Ник над персонажем
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.font = isLocal ? "bold 12px Arial" : "12px Arial";
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillText(player.name || (isLocal ? "You" : "Player"), cx + 1, cy - 18 + 1);
    ctx.fillStyle = isLocal ? "#ffffff" : "rgba(255,255,255,0.88)";
    ctx.fillText(player.name || (isLocal ? "You" : "Player"), cx, cy - 18);
    ctx.restore();
}

// ===============================
// 🧩 MODERN HUD HELPERS
// ===============================
const UI = {
    panel: "rgba(12, 26, 42, 0.78)",
    border: "rgba(150, 220, 255, 0.42)",
    line: "rgba(255, 255, 255, 0.12)",
    text: "#f4f7fb",
    muted: "rgba(245, 250, 255, 0.82)",
    blue: "#58c7ff",
    green: "#81f04f",
    purple: "#b85cff",
    yellow: "#ffc233",
    red: "#ff4d5a"
};

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function roundedRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}



