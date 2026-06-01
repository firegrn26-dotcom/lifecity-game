// ===============================
// 🎒 UI INVENTORY — инвентарь и уведомления
// ===============================
function drawInventoryButton() {
    const trashCount = myPlayer.inventory?.trash || 0;
    const trashMax = myPlayer.inventory?.trashMax || 10;
    const isCleaner = myPlayer.job === "Дворник";

    inventoryButton.w = isCleaner ? 108 : 104;
    inventoryButton.h = isCleaner ? 44 : 34;
    inventoryButton.x = hudPanelBounds.x + hudPanelBounds.w - inventoryButton.w;
    inventoryButton.y = hudPanelBounds.y + hudPanelBounds.h + 8;

    ctx.save();

    const pulse = 0.5 + Math.sin(performance.now() * 0.006) * 0.5;
    const accent = trashCount >= trashMax && isCleaner ? UI.red : UI.blue;

    ctx.shadowColor = accent;
    ctx.shadowBlur = 2 + pulse * 2;

    roundedRect(inventoryButton.x, inventoryButton.y, inventoryButton.w, inventoryButton.h, 11);
    ctx.fillStyle = "rgba(6, 16, 28, 0.84)";
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.96;
    ctx.lineWidth = 1.15;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "bold 17px 'Segoe UI Emoji', Arial";
    ctx.fillStyle = UI.text;
    ctx.fillText("🎒", inventoryButton.x + 12, inventoryButton.y + inventoryButton.h / 2);

    ctx.font = "bold 12px Arial";
    ctx.fillStyle = accent;
    ctx.fillText("Инвентарь", inventoryButton.x + 36, inventoryButton.y + (isCleaner ? 15 : inventoryButton.h / 2));

    if (isCleaner) {
        ctx.font = "bold 11px Arial";
        ctx.fillStyle = trashCount >= trashMax ? UI.red : UI.green;
        ctx.fillText(`Мусор ${trashCount}/${trashMax}`, inventoryButton.x + 36, inventoryButton.y + 30);
    }

    ctx.restore();
}
function getInventoryItems() {
    const slotsTotal = Math.max(10, myPlayer.inventory?.slots || myPlayer.inventory?.trashMax || 10);
    let items = Array.isArray(myPlayer.inventory?.items) ? myPlayer.inventory.items.slice(0, slotsTotal) : [];
    while (items.length < slotsTotal) items.push(null);

    // Совместимость со старым форматом: если сервер ещё отдаёт только count мусора,
    // показываем его одним стаком в одной ячейке, а не по всем слотам.
    const trashCount = Math.max(0, Number(myPlayer.inventory?.trash) || 0);
    const hasTrashStack = items.some((item) => item && item.type === "trash");
    if (trashCount > 0 && !hasTrashStack) {
        const preferred = Number.isInteger(myPlayer.inventory?.trashSlot) && myPlayer.inventory.trashSlot >= 0
            ? myPlayer.inventory.trashSlot
            : items.findIndex((item) => !item);
        const slotIndex = preferred >= 0 && preferred < slotsTotal ? preferred : 0;
        items[slotIndex] = { type: "trash", name: "Мусор", count: trashCount, max: myPlayer.inventory?.trashMax || 10 };
    }
    return items;
}

function drawInventoryPanel() {
    inventoryAnim += ((inventoryOpen ? 1 : 0) - inventoryAnim) * 0.16;
    if (inventoryAnim < 0.015) return;

    const jobName = myPlayer.job || "Без работы";
    const hasJob = jobName !== "Без работы";
    const isCleaner = jobName === "Дворник";

    const t = inventoryAnim;
    const slotsTotal = Math.max(10, myPlayer.inventory?.slots || myPlayer.inventory?.trashMax || 10);
    const cols = 5;
    const rows = Math.ceil(slotsTotal / cols);
    const hasWorkInfo = hasJob;
    const w = 500;
    const gridBlockH = rows * 62 + (rows - 1) * 12;
    const h = 112 + gridBlockH + (hasWorkInfo ? 116 : 42);
    const x = canvas.width / 2 - w / 2;
    const y = canvas.height / 2 - h / 2;
    const scale = 0.96 + t * 0.04;
    const cx = x + w / 2;
    const cy = y + h / 2;

    const trashCount = myPlayer.inventory?.trash || 0;
    const trashMax = myPlayer.inventory?.trashMax || slotsTotal;
    const trashPercent = clamp01(trashCount / Math.max(1, trashMax));
    const full = trashCount >= trashMax;
    const accent = full ? UI.red : UI.green;

    ctx.save();
    ctx.globalAlpha = t;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);

    drawPopupPanel(x, y, w, h, "ИНВЕНТАРЬ", "🎒", UI.blue, { alpha: 0.98 });

    inventoryCloseButton = { x: x + w - 56, y: y + 17, w: 36, h: 32 };
    drawPopupButton(inventoryCloseButton.x, inventoryCloseButton.y, inventoryCloseButton.w, inventoryCloseButton.h, "×", UI.red, false);

    // Слоты доступны всегда. Рюкзак увеличивает общее количество слотов.
    // Мусор занимает отдельные слоты по порядку, но максимум мусора всегда 10.
    const gridX = x + 28;
    const gridY = y + 82;
    const slot = 62;
    const gap = 12;

    const inventoryItems = getInventoryItems();

    for (let i = 0; i < slotsTotal; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const sx = gridX + col * (slot + gap);
        const sy = gridY + row * (slot + gap);
        const item = inventoryItems[i];
        const isTrashSlot = !!(item && item.type === "trash");
        const isBackpackSlot = i >= 10;
        const slotAccent = isTrashSlot ? accent : (isBackpackSlot ? UI.yellow : UI.border);

        ctx.save();
        ctx.shadowColor = isTrashSlot ? accent : "rgba(0,0,0,0.35)";
        ctx.shadowBlur = isTrashSlot ? (full ? 16 : 11) : 4;
        roundedRect(sx, sy, slot, slot, 15);
        ctx.fillStyle = isTrashSlot
            ? (full ? "rgba(255,77,90,0.13)" : "rgba(129,240,79,0.11)")
            : (isBackpackSlot ? "rgba(255,194,51,0.045)" : "rgba(255,255,255,0.045)");
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = slotAccent;
        ctx.globalAlpha = isTrashSlot ? 0.76 : (isBackpackSlot ? 0.28 : 0.32);
        ctx.lineWidth = isTrashSlot ? 1.55 : 1.1;
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (isTrashSlot) {
            const count = Math.max(0, Number(item.count) || trashCount);
            ctx.font = "bold 24px 'Segoe UI Emoji', Arial";
            ctx.fillStyle = UI.text;
            ctx.fillText("🗑️", sx + slot / 2, sy + 27);

            ctx.font = "bold 13px Arial";
            ctx.fillStyle = accent;
            ctx.fillText(`×${count}`, sx + slot / 2, sy + 49);
        } else {
            ctx.font = isBackpackSlot ? "bold 12px Arial" : "bold 18px Arial";
            ctx.fillStyle = isBackpackSlot ? "rgba(255,194,51,0.30)" : "rgba(255,255,255,0.16)";
            ctx.fillText(isBackpackSlot ? "рюкзак" : "+", sx + slot / 2, sy + slot / 2);
        }
        ctx.restore();
    }

    const afterGridY = gridY + rows * slot + (rows - 1) * gap;

    if (hasJob) {
        const infoX = gridX;
        const infoY = afterGridY + 32;

        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = UI.text;
        ctx.font = "bold 18px Arial";
        ctx.fillText(isCleaner ? "Собранный мусор" : `Работа: ${jobName}`, infoX, infoY);

        if (isCleaner) {
            ctx.textAlign = "right";
            ctx.fillStyle = accent;
            ctx.font = "bold 16px Arial";
            ctx.fillText(`${trashCount} / ${trashMax} шт.`, x + w - 28, infoY);

            drawProgressBar(infoX, infoY + 22, w - 56, 14, trashPercent, accent);

            const statusText = full ? "Заполнено" : (trashCount > 0 ? "Можно сдавать" : "Пусто");
            const statusColor = full ? UI.red : (trashCount > 0 ? UI.green : UI.muted);
            const statusW = drawStatusPill(infoX, infoY + 50, statusText, statusColor);
            drawStatusPill(infoX + statusW + 6, infoY + 50, "I / Esc", UI.blue);
        } else {
            ctx.fillStyle = UI.muted;
            ctx.font = "14px Arial";
            ctx.fillText("Дополнительных предметов для этой работы пока нет", infoX, infoY + 28);
            drawStatusPill(infoX, infoY + 56, "I / Esc", UI.blue);
        }
    } else {
        const hintY = afterGridY + 28;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = UI.muted;
        ctx.font = "bold 14px Arial";
        ctx.fillText(`${slotsTotal} свободных слотов`, gridX, hintY);
        if (myPlayer.hasBackpack) {
            drawStatusPill(gridX + 142, hintY - 12, "+5 рюкзак", UI.yellow);
        }
        drawStatusPill(x + w - 106, hintY - 12, "I / Esc", UI.blue);
    }

    ctx.restore();
}
function drawInventoryNotice() {
    if (!inventoryNotice) return;

    const now = performance.now();
    const age = now - inventoryNotice.createdAt;
    const duration = inventoryNotice.duration || 3000;

    if (age > duration) {
        inventoryNotice = null;
        return;
    }

    const fadeIn = clamp01(age / 180);
    const fadeOut = clamp01((duration - age) / 420);
    const alpha = Math.min(fadeIn, fadeOut);

    const w = 480;
    const h = 96;
    const x = canvas.width / 2 - w / 2;
    const y = 92;

    ctx.save();
    ctx.globalAlpha = alpha;
    drawPopupPanel(x, y, w, h, inventoryNotice.title, inventoryNotice.icon || "ℹ", inventoryNotice.color || UI.yellow);

    ctx.fillStyle = UI.text;
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    drawWrappedTextBlock(
        String(inventoryNotice.text || ""),
        x + 24,
        y + 65,
        w - 48,
        18,
        "bold 15px Arial",
        UI.text,
        2
    );
    ctx.restore();
}


// ===============================
// 🔐 AUTH UI
// ===============================
