// ===============================
// 🛠️ UI DEV MODE — меню разработчика и координаты
// ===============================
function handleDevMenuClick(mx, my) {
    if (!devMenuOpen) return false;

    if (
        mx < devMenuBounds.x ||
        mx > devMenuBounds.x + devMenuBounds.w ||
        my < devMenuBounds.y ||
        my > devMenuBounds.y + devMenuBounds.h
    ) {
        return false;
    }

    for (const item of devMenuItems) {
        if (
            mx >= item.x &&
            mx <= item.x + item.w &&
            my >= item.y &&
            my <= item.y + item.h
        ) {
            if (item.type === "devToggle") {
                devModeEnabled = !devModeEnabled;
                if (!devModeEnabled) resetDevEditState();
                return true;
            }

            devOptions[item.key] = !devOptions[item.key];

            if (!isDevOptionOn("editBuildings")) {
                resetDevEditState();
            }

            return true;
        }
    }

    return true;
}

function drawDevSwitch(x, y, w, h) {
    devMenuItems.push({ x, y, w, h, type: "devToggle" });

    const active = devModeEnabled;
    const accent = active ? UI.green : UI.red;

    ctx.save();

    roundedRect(x, y, w, h, 16);
    ctx.fillStyle = active ? "rgba(129,240,79,0.12)" : "rgba(255,77,90,0.10)";
    ctx.fill();
    ctx.strokeStyle = active ? "rgba(129,240,79,0.72)" : "rgba(255,77,90,0.58)";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.shadowColor = active ? "rgba(129,240,79,0.35)" : "rgba(255,77,90,0.25)";
    ctx.shadowBlur = 5;
    roundedRect(x + w - 78, y + 9, 60, h - 18, 14);
    ctx.fillStyle = active ? "rgba(129,240,79,0.24)" : "rgba(255,255,255,0.08)";
    ctx.fill();
    ctx.shadowBlur = 0;

    const knobSize = h - 24;
    const knobX = active ? x + w - 18 - knobSize : x + w - 72;
    roundedRect(knobX, y + 12, knobSize, knobSize, knobSize / 2);
    ctx.fillStyle = accent;
    ctx.fill();

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = accent;
    ctx.font = "bold 16px Arial";
    ctx.fillText(active ? "Режим разработчика включён" : "Режим разработчика выключен", x + 18, y + h / 2 - 8);

    ctx.fillStyle = UI.muted;
    ctx.font = "12px Arial";
    ctx.fillText("F2 открывает только это меню. Отладочные слои работают только при включённом режиме.", x + 18, y + h / 2 + 12);

    ctx.restore();
}

function drawDevCheckbox(x, y, w, label, key, hint) {
    const active = !!devOptions[key];
    const enabled = devModeEnabled;
    const visibleActive = enabled && active;
    const box = 22;
    const rowH = 54;

    devMenuItems.push({ x, y: y - rowH / 2, w, h: rowH, key, type: "option" });

    ctx.save();
    ctx.textBaseline = "middle";

    roundedRect(x, y - rowH / 2 + 3, w, rowH - 6, 12);
    ctx.fillStyle = visibleActive ? "rgba(88,199,255,0.08)" : "rgba(255,255,255,0.035)";
    ctx.fill();
    ctx.strokeStyle = visibleActive ? "rgba(88,199,255,0.26)" : "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const boxX = x + 13;
    roundedRect(boxX, y - box / 2, box, box, 6);
    ctx.fillStyle = visibleActive ? "rgba(255,194,51,0.20)" : "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.strokeStyle = visibleActive ? UI.yellow : (active ? "rgba(255,194,51,0.45)" : UI.border);
    ctx.lineWidth = visibleActive ? 2 : 1.2;
    ctx.stroke();

    if (active) {
        ctx.strokeStyle = enabled ? UI.yellow : "rgba(255,194,51,0.35)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(boxX + 5, y);
        ctx.lineTo(boxX + 10, y + 6);
        ctx.lineTo(boxX + 18, y - 7);
        ctx.stroke();
    }

    ctx.fillStyle = enabled ? (active ? UI.text : UI.muted) : "rgba(230,238,247,0.42)";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "left";
    ctx.fillText(label, x + 48, y - 8);

    if (hint) {
        ctx.fillStyle = enabled ? "rgba(230,238,247,0.58)" : "rgba(230,238,247,0.30)";
        ctx.font = "12px Arial";
        ctx.fillText(hint, x + 48, y + 12);
    }

    ctx.restore();
}

function drawDevMenuPanel() {
    if (!devMenuOpen) return;

    devMenuItems = [];

    const w = 760;
    const h = 520;
    const x = 22;
    const y = 86;
    devMenuBounds = { x, y, w, h };

    drawPopupPanel(x, y, w, h, "МЕНЮ РАЗРАБОТЧИКА", "🛠", UI.yellow);

    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    ctx.fillStyle = UI.muted;
    ctx.font = "13px Arial";
    ctx.fillText("F2 — открыть / закрыть панель", x + 28, y + 62);

    drawDevSwitch(x + 28, y + 82, w - 56, 64);

    const leftX = x + 28;
    const rightX = x + 392;
    const colW = 340;
    const startY = y + 184;
    const step = 58;

    drawDevCheckbox(leftX, startY, colW, "Редактировать объекты карты", "editBuildings", "ЛКМ — двигать, Shift — ширина, Ctrl — высота, дороги двигаются целиком");
    drawDevCheckbox(leftX, startY + step, colW, "Границы дорог", "showRoadBounds", "Рамки дорог, START/END и координаты");
    drawDevCheckbox(leftX, startY + step * 2, colW, "Сетка координат", "showGrid", "Сетка 100 px и подписи координат");
    drawDevCheckbox(leftX, startY + step * 3, colW, "Районы", "showDistricts", "Границы и названия районов");
    drawDevCheckbox(leftX, startY + step * 4, colW, "Координаты игрока", "showCoordinates", "Позиция, район и улица");

    drawDevCheckbox(rightX, startY, colW, "Названия улиц", "showStreetNames", "Подписи прямо на дорогах");
    drawDevCheckbox(rightX, startY + step, colW, "ID мусора", "showTrashIds", "Серверные ID у мусора");
    drawDevCheckbox(rightX, startY + step * 2, colW, "Хитбоксы игроков", "showPlayerHitboxes", "Рамки 20×20 для отладки");

    const statusY = y + h - 30;
    ctx.fillStyle = devModeEnabled ? UI.green : UI.red;
    ctx.font = "bold 13px Arial";
    ctx.fillText(
        devModeEnabled
            ? (devOptions.editBuildings ? "Редактирование активно: после отпускания мыши объект сохраняется на сервере" : "Режим включён: выбери нужные debug-слои галочками")
            : "Режим выключен: все debug-слои и редактирование скрыты",
        x + 28,
        statusY
    );

    ctx.restore();
}

function drawDevCoordinatesPanel() {
    if (!isDevOptionOn("showCoordinates")) return;

    const px = Math.round(myPlayer.x);
    const py = Math.round(myPlayer.y);
    const district = getCurrentDistrict();
    const street = getCurrentStreet();

    const w = 330;
    const h = 96;
    const x = 22;
    const y = canvas.height - h - 24;

    drawPopupPanel(x, y, w, h, "КООРДИНАТЫ", "📍", UI.blue);

    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = UI.text;
    ctx.fillText(`X: ${px}   Y: ${py}`, x + 24, y + 57);
    ctx.font = "12px Arial";
    ctx.fillStyle = UI.muted;
    ctx.fillText(`${district} / ${street}`, x + 24, y + 77);
    ctx.restore();
}




// ===============================
// 🛒 МАГАЗИН И КАСТОМИЗАЦИЯ
// ===============================
