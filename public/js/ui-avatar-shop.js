// ===============================
// 🧍 UI AVATAR / SHOP — редактор персонажа и магазин
// ===============================
function openAvatarEditor(required = false, fromShop = false) {
    avatarEditorOpen = true;
    avatarEditorRequired = !!required;
    avatarEditorFromShop = !!fromShop;
    shopOpen = false;
    avatarDraft = normalizeAvatarClient(myPlayer.standardAvatar || myPlayer.avatar);
}

function setAvatarOption(key, value) {
    avatarDraft[key] = value;
    avatarDraft = normalizeAvatarClient(avatarDraft);
}

function handleAvatarEditorClick(mx, my) {
    for (const b of avatarButtons) {
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
            if (b.type === "option") setAvatarOption(b.key, b.value);
            if (b.type === "save") socket.emit("saveAvatar", Object.assign({}, avatarDraft, { fromShop: avatarEditorFromShop }));
            if (b.type === "cancel" && !avatarEditorRequired) avatarEditorOpen = false;
            return true;
        }
    }
    return avatarEditorRequired;
}

function drawAvatarOptionButton(x, y, w, h, label, active, color, key, value) {
    avatarButtons.push({ x, y, w, h, type: "option", key, value });
    ctx.save();
    const accent = color || UI.blue;
    roundedRect(x, y, w, h, 11);
    ctx.fillStyle = active ? "rgba(88,199,255,0.14)" : "rgba(255,255,255,0.045)";
    ctx.fill();
    ctx.strokeStyle = active ? accent : "rgba(120,190,255,0.18)";
    ctx.lineWidth = active ? 1.8 : 1.0;
    ctx.stroke();
    if (active) {
        ctx.shadowColor = accent;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    ctx.fillStyle = active ? UI.text : UI.muted;
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + w / 2, y + h / 2);
    ctx.restore();
}

function drawAvatarPreview(px, py, scale = 2.8) {
    const oldCamera = { x: camera.x, y: camera.y };
    const previewPlayer = {
        x: px / scale - PLAYER_SIZE / 2,
        y: py / scale - PLAYER_SIZE / 2,
        angle: -Math.PI / 2,
        walkTime: performance.now() * 0.004,
        velX: 1,
        velY: 0,
        maxSpeed: 1,
        avatar: avatarDraft
    };
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(scale, scale);
    ctx.translate(-px / scale, -py / scale);
    camera.x = 0;
    camera.y = 0;
    drawHumanCharacter(previewPlayer, { isLocal: true });
    camera.x = oldCamera.x;
    camera.y = oldCamera.y;
    ctx.restore();
}

function drawAvatarEditorPanel() {
    if (!avatarEditorOpen) return;
    avatarButtons = [];

    const w = 760;
    const h = 650;
    const x = canvas.width / 2 - w / 2;
    const y = canvas.height / 2 - h / 2;

    ctx.save();
    ctx.fillStyle = avatarEditorRequired ? "rgba(3,8,14,0.64)" : "rgba(3,8,14,0.28)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPopupPanel(x, y, w, h, avatarEditorRequired ? "СОЗДАНИЕ ПЕРСОНАЖА" : "ВНЕШНОСТЬ ПЕРСОНАЖА", "🧍", UI.blue);

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = UI.muted;
    ctx.font = "14px Arial";
    ctx.fillText(avatarEditorRequired ? "Выбери внешность перед входом в город" : "Изменение внешности доступно у магазина", x + 30, y + 64);

    const previewX = x + 120;
    const previewY = y + 300;
    roundedRect(x + 34, y + 96, 210, 400, 22);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fill();
    ctx.strokeStyle = "rgba(88,199,255,0.22)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    drawAvatarPreview(previewX, previewY, 3.2);

    const startX = x + 278;
    let yy = y + 100;
    const rowH = 78;

    function drawGroup(title, key, items, colW = 108) {
        ctx.fillStyle = UI.text;
        ctx.font = "bold 15px Arial";
        ctx.textAlign = "left";
        ctx.fillText(title, startX, yy);
        let bx = startX;
        const by = yy + 18;
        for (const item of items) {
            drawAvatarOptionButton(bx, by, colW, 36, item.label, avatarDraft[key] === item.value, item.color || UI.blue, key, item.value);
            bx += colW + 10;
        }
        yy += rowH;
    }

    drawGroup("Пол", "gender", AVATAR_CONFIG.genders, 130);
    drawGroup("Телосложение", "bodyType", AVATAR_CONFIG.bodyTypes, 130);
    drawGroup("Стиль одежды", "clothingStyle", AVATAR_CONFIG.clothingStyles, 108);
    drawGroup("Причёска", "hairStyle", AVATAR_CONFIG.hairStyles, 108);

    ctx.fillStyle = UI.text;
    ctx.font = "bold 15px Arial";
    ctx.fillText("Цвет одежды", startX, yy);
    let bx = startX;
    const by = yy + 18;
    for (const item of AVATAR_CONFIG.clothingColors) {
        const active = avatarDraft.clothingColor === item.value;
        avatarButtons.push({ x: bx, y: by, w: 48, h: 38, type: "option", key: "clothingColor", value: item.value });
        roundedRect(bx, by, 48, 38, 11);
        ctx.fillStyle = "rgba(255,255,255,0.045)";
        ctx.fill();
        ctx.fillStyle = item.color;
        roundedRect(bx + 10, by + 8, 28, 22, 7);
        ctx.fill();
        ctx.strokeStyle = active ? UI.yellow : "rgba(255,255,255,0.16)";
        ctx.lineWidth = active ? 2.2 : 1;
        roundedRect(bx, by, 48, 38, 11);
        ctx.stroke();
        bx += 58;
    }

    const btnY = y + h - 72;
    const saveW = 220;
    avatarButtons.push({ x: x + w - saveW - 30, y: btnY, w: saveW, h: 44, type: "save" });
    drawPopupButton(x + w - saveW - 30, btnY, saveW, 44, "Сохранить", UI.green, true);

    if (!avatarEditorRequired) {
        avatarButtons.push({ x: x + w - saveW * 2 - 44, y: btnY, w: saveW, h: 44, type: "cancel" });
        drawPopupButton(x + w - saveW * 2 - 44, btnY, saveW, 44, "Отмена", UI.muted, false);
    }

    ctx.restore();
}

function handleShopClick(mx, my) {
    for (const key of Object.keys(shopButtons)) {
        const b = shopButtons[key];
        if (!b) continue;
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
            if (key === "close") shopOpen = false;
            if (key === "backpack") socket.emit("buyBackpack");
            if (key === "avatar") openAvatarEditor(false, true);
            return true;
        }
    }
    return false;
}

function drawShopPanel() {
    if (!shopOpen) return;
    shopButtons = {};
    const w = 590;
    const h = 360;
    const x = canvas.width / 2 - w / 2;
    const y = canvas.height / 2 - h / 2;

    ctx.save();
    ctx.fillStyle = "rgba(3,8,14,0.28)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPopupPanel(x, y, w, h, "МАГАЗИН", "🛒", UI.yellow);

    shopButtons.close = { x: x + w - 56, y: y + 17, w: 36, h: 32 };
    drawPopupButton(shopButtons.close.x, shopButtons.close.y, shopButtons.close.w, shopButtons.close.h, "×", UI.red, false);

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = UI.muted;
    ctx.font = "14px Arial";
    ctx.fillText("Покупки и услуги магазина. Позже здесь появятся новые товары.", x + 30, y + 66);

    const cardW = w - 60;
    const cardH = 86;
    const cardX = x + 30;
    const firstY = y + 100;

    function drawCard(yPos, icon, title, text, buttonText, buttonColor, buttonKey, disabled = false) {
        roundedRect(cardX, yPos, cardW, cardH, 18);
        ctx.fillStyle = "rgba(255,255,255,0.045)";
        ctx.fill();
        ctx.strokeStyle = disabled ? "rgba(255,255,255,0.08)" : "rgba(120,190,255,0.22)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.font = "bold 28px 'Segoe UI Emoji', Arial";
        ctx.fillStyle = UI.text;
        ctx.fillText(icon, cardX + 22, yPos + 44);
        ctx.font = "bold 17px Arial";
        ctx.fillStyle = disabled ? UI.muted : UI.text;
        ctx.fillText(title, cardX + 70, yPos + 30);
        ctx.font = "13px Arial";
        ctx.fillStyle = UI.muted;
        ctx.fillText(text, cardX + 70, yPos + 55);
        const bw = 155;
        const bx = cardX + cardW - bw - 18;
        const by = yPos + 24;
        shopButtons[buttonKey] = { x: bx, y: by, w: bw, h: 40 };
        drawPopupButton(bx, by, bw, 40, buttonText, disabled ? UI.muted : buttonColor, !disabled);
    }

    drawCard(firstY, "🎒", "Рюкзак", myPlayer.hasBackpack ? "Уже куплен: +5 обычных слотов" : "Цена: 1000 монет. Мусор всё равно максимум 10.", myPlayer.hasBackpack ? "Куплено" : "Купить", UI.green, "backpack", myPlayer.hasBackpack);
    drawCard(firstY + 102, "🧍", "Внешность", "Пол, одежда, цвет, причёска и телосложение", "Изменить", UI.blue, "avatar", false);

    ctx.restore();
}

// ===============================
// 👤 PROFILE UI — безопасные данные с сервера
// ===============================
