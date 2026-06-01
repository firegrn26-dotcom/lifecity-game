// ===============================
// 🛣️ ROADS / DISTRICTS RENDER — отрисовка дорог, разметки, переходов, парков
// Использует данные из city-layout.js.
// ===============================
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
    // V1.6.8: подложки кварталов под зданиями отключены.
    // Данные buildingZones оставлены только как служебные координаты/совместимость.
    return;
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


