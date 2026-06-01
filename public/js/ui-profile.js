// ===============================
// 👤 UI PROFILE — профиль игрока и статистика
// ===============================
function requestProfileData(force = false) {
    if (!isAuthenticated) return;

    const now = performance.now();
    if (!force && now - lastProfileRequest < 700) return;

    lastProfileRequest = now;
    profileLoading = true;
    socket.emit("requestProfile", {});
}

function toggleProfile() {
    profileOpen = !profileOpen;
    if (profileOpen) {
        profileScroll = 0;
        requestProfileData(true);
    }
}

function drawProfileButton() {
    profileButton.w = inventoryButton.w;
    profileButton.h = 34;
    profileButton.x = inventoryButton.x;
    profileButton.y = inventoryButton.y + inventoryButton.h + 8;

    ctx.save();

    const pulse = 0.5 + Math.sin(performance.now() * 0.0055) * 0.5;
    const accent = UI.purple;

    ctx.shadowColor = accent;
    ctx.shadowBlur = profileOpen ? 7 + pulse * 4 : 2 + pulse * 1.5;

    roundedRect(profileButton.x, profileButton.y, profileButton.w, profileButton.h, 11);
    ctx.fillStyle = profileOpen ? "rgba(184,92,255,0.14)" : "rgba(6, 16, 28, 0.84)";
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = accent;
    ctx.globalAlpha = profileOpen ? 0.8 : 0.52;
    ctx.lineWidth = 1.15;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "bold 17px 'Segoe UI Emoji', Arial";
    ctx.fillStyle = UI.text;
    ctx.fillText("👤", profileButton.x + 12, profileButton.y + profileButton.h / 2);

    ctx.font = "bold 12px Arial";
    ctx.fillStyle = accent;
    ctx.fillText("Профиль", profileButton.x + 36, profileButton.y + profileButton.h / 2);

    ctx.restore();
}

function formatProfileDate(ts) {
    if (!ts) return "—";
    try {
        return new Date(ts).toLocaleDateString("ru-RU");
    } catch {
        return "—";
    }
}

function getProfileJobSummary(data) {
    const stats = data?.jobStats || {};
    const baseNames = ["Дворник", "Санитар"];
    const names = [];

    for (let name of baseNames) {
        if (!names.includes(name)) names.push(name);
    }

    for (let name of Object.keys(stats)) {
        if (!names.includes(name)) names.push(name);
    }

    const palette = [UI.green, UI.blue, UI.yellow, UI.purple, UI.red];

    return names.map((name, index) => {
        const item = stats[name] || { level: 1, xp: 0 };
        return {
            name,
            level: item.level || 1,
            xp: item.xp || 0,
            color: palette[index % palette.length]
        };
    });
}

function fitCanvasText(text, maxWidth) {
    text = String(text ?? "—");
    if (ctx.measureText(text).width <= maxWidth) return text;

    const ellipsis = "…";
    let left = 0;
    let right = text.length;

    while (left < right) {
        const mid = Math.ceil((left + right) / 2);
        const candidate = text.slice(0, mid) + ellipsis;
        if (ctx.measureText(candidate).width <= maxWidth) {
            left = mid;
        } else {
            right = mid - 1;
        }
    }

    return text.slice(0, Math.max(0, left)) + ellipsis;
}

function drawProfileInfoRow(x, y, w, label, value, color = UI.text) {
    const h = 28;

    ctx.save();
    roundedRect(x, y - h / 2, w, h, 9);
    ctx.fillStyle = "rgba(255,255,255,0.045)";
    ctx.fill();
    ctx.strokeStyle = "rgba(120,190,255,0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = UI.muted;
    ctx.font = "bold 12px Arial";
    const labelText = fitCanvasText(label, w * 0.42);
    ctx.fillText(labelText, x + 10, y);

    ctx.textAlign = "right";
    ctx.fillStyle = color;
    ctx.font = "bold 14px Arial";
    const valueText = fitCanvasText(value, w * 0.50);
    ctx.fillText(valueText, x + w - 10, y);
    ctx.restore();
}

function drawProfileRow(x, y, label, value, color = UI.text, rowW = 206) {
    drawProfileInfoRow(x - 4, y, rowW, label, value, color);
}

function drawProfilePanel() {
    profileAnim += ((profileOpen ? 1 : 0) - profileAnim) * 0.16;
    if (profileAnim < 0.015) return;

    const t = profileAnim;
    const data = profileData || {};
    const avatar = data.avatar || myPlayer.avatar || {};
    const jobs = getProfileJobSummary(data);

    const w = Math.min(640, canvas.width - 48);
    const baseContentH = 404;
    const jobsContentH = 58 + jobs.length * 46;
    const footerH = 58;
    const desiredH = 92 + 124 + 28 + 176 + 24 + jobsContentH + footerH;
    const h = Math.min(Math.max(540, Math.min(desiredH, 720)), canvas.height - 56);
    const x = canvas.width / 2 - w / 2;
    const y = canvas.height / 2 - h / 2;
    const scale = 0.96 + t * 0.04;
    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.save();
    ctx.globalAlpha = t;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);

    drawPopupPanel(x, y, w, h, "ПРОФИЛЬ", "👤", UI.purple, { alpha: 0.98 });

    profileCloseButton = { x: x + w - 56, y: y + 17, w: 36, h: 32 };
    drawPopupButton(profileCloseButton.x, profileCloseButton.y, profileCloseButton.w, profileCloseButton.h, "×", UI.red, false);

    if (profileLoading && !profileData) {
        ctx.fillStyle = UI.muted;
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Загрузка профиля с сервера...", x + w / 2, y + h / 2 + 20);
        ctx.restore();
        return;
    }

    const contentTop = y + 72;
    const footerTop = y + h - 52;
    const viewH = footerTop - contentTop - 10;
    const contentH = 124 + 28 + 176 + 24 + jobsContentH;
    profileMaxScroll = Math.max(0, contentH - viewH);
    profileScroll = Math.max(0, Math.min(profileScroll, profileMaxScroll));

    ctx.save();
    roundedRect(x + 18, contentTop - 2, w - 36, viewH + 4, 18);
    ctx.clip();
    ctx.translate(0, -profileScroll);

    const cardX = x + 28;
    const cardY = contentTop + 8;
    const cardW = w - 56;

    roundedRect(cardX, cardY, cardW, 120, 20);
    ctx.fillStyle = "rgba(255,255,255,0.045)";
    ctx.fill();
    ctx.strokeStyle = "rgba(184,92,255,0.32)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Профильный аватар должен быть закреплен в экранных координатах карточки.
    // Раньше он рисовался через мировые координаты + camera transform, из-за чего
    // значок мог "убегать" при движении камеры/масштабировании панели.
    const avatarScreenX = cardX + 58;
    const avatarScreenY = cardY + 62;
    const previewPlayer = Object.assign({}, myPlayer, {
        x: camera.x + avatarScreenX - PLAYER_SIZE / 2,
        y: camera.y + avatarScreenY - PLAYER_SIZE / 2,
        angle: Math.PI / 2,
        moving: false,
        velX: 0,
        velY: 0,
        walkTime: 0,
        avatar
    });

    ctx.save();
    roundedRect(cardX + 18, cardY + 18, 82, 84, 18);
    ctx.clip();
    ctx.fillStyle = "rgba(8,16,30,0.46)";
    ctx.fillRect(cardX + 18, cardY + 18, 82, 84);
    ctx.translate(avatarScreenX, avatarScreenY);
    ctx.scale(1.55, 1.55);
    ctx.translate(-avatarScreenX, -avatarScreenY);
    drawHumanCharacter(previewPlayer, { isLocal: false, hideName: true });
    ctx.restore();

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = UI.text;
    ctx.font = "bold 22px Arial";
    ctx.fillText(fitCanvasText(data.name || myPlayer.name || "Персонаж", cardW - 150), cardX + 104, cardY + 34);

    ctx.fillStyle = UI.muted;
    ctx.font = "14px Arial";
    ctx.fillText(fitCanvasText(`ID персонажа: ${data.playerId || myPlayer.playerId || "—"}`, cardW - 150), cardX + 104, cardY + 62);

    const activeJob = data.job || myPlayer.job || "Без работы";
    drawStatusPill(cardX + 104, cardY + 78, activeJob, activeJob === "Без работы" ? UI.muted : UI.green);
    if (data.hasBackpack || myPlayer.hasBackpack) {
        drawStatusPill(cardX + 216, cardY + 78, "Рюкзак", UI.yellow);
    }

    const gap = 18;
    const leftX = x + 34;
    const blockY = cardY + 150;
    const blockW = Math.floor((w - 68 - gap) / 2);
    const rightX = leftX + blockW + gap;

    function drawSectionBox(sx, sy, sw, sh, title, color) {
        roundedRect(sx, sy, sw, sh, 18);
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fill();
        ctx.strokeStyle = "rgba(120,190,255,0.18)";
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(title, sx + 16, sy + 26);
    }

    drawSectionBox(leftX, blockY, blockW, 158, "Основное", UI.blue);
    drawProfileInfoRow(leftX + 14, blockY + 60, blockW - 28, "Уровень", data.level || myPlayer.level || 1, UI.purple);
    drawProfileInfoRow(leftX + 14, blockY + 94, blockW - 28, "Опыт", `${data.xp ?? myPlayer.xp ?? 0} / ${(data.level || myPlayer.level || 1) * 100}`, UI.purple);
    drawProfileInfoRow(leftX + 14, blockY + 128, blockW - 28, "Деньги", `$ ${Math.floor(data.money ?? myPlayer.money ?? 0).toLocaleString("en-US")}`, UI.green);

    drawSectionBox(rightX, blockY, blockW, 158, "Персонаж", UI.yellow);
    drawProfileInfoRow(rightX + 14, blockY + 60, blockW - 28, "Пол", avatar.gender === "female" ? "Женский" : "Мужской", UI.text);
    drawProfileInfoRow(rightX + 14, blockY + 94, blockW - 28, "Одежда", avatar.clothingStyle || "street", UI.text);
    drawProfileInfoRow(rightX + 14, blockY + 128, blockW - 28, "Создан", formatProfileDate(data.createdAt), UI.muted);

    const jobY = blockY + 182;
    const jobH = jobsContentH;
    roundedRect(leftX, jobY, w - 68, jobH, 18);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fill();
    ctx.strokeStyle = "rgba(129,240,79,0.18)";
    ctx.lineWidth = 1.1;
    ctx.stroke();

    ctx.fillStyle = UI.green;
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Профессии", leftX + 16, jobY + 28);

    for (let i = 0; i < jobs.length; i++) {
        const j = jobs[i];
        const rowY = jobY + 62 + i * 46;
        const rowX = leftX + 14;
        const rowW = w - 96;

        roundedRect(rowX, rowY - 17, rowW, 34, 10);
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = j.color;
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "left";
        ctx.fillText(fitCanvasText(`${j.name} · Ур. ${j.level}`, 150), rowX + 10, rowY);

        const xpNeed = j.level * 100;
        const pct = clamp01((j.xp || 0) / Math.max(1, xpNeed));
        const barX = rowX + 172;
        const barW = Math.max(110, rowW - 274);
        drawProgressBar(barX, rowY - 7, barW, 10, pct, j.color);

        ctx.textAlign = "right";
        ctx.fillStyle = UI.muted;
        ctx.font = "bold 12px Arial";
        ctx.fillText(`${j.xp || 0}/${xpNeed}`, rowX + rowW - 10, rowY);
    }

    ctx.restore();

    if (profileMaxScroll > 0) {
        const trackX = x + w - 18;
        const trackY = contentTop + 12;
        const trackH = viewH - 24;
        const thumbH = Math.max(36, trackH * (viewH / (viewH + profileMaxScroll)));
        const thumbY = trackY + (trackH - thumbH) * (profileScroll / profileMaxScroll);

        roundedRect(trackX, trackY, 5, trackH, 3);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fill();
        roundedRect(trackX, thumbY, 5, thumbH, 3);
        ctx.fillStyle = "rgba(184,92,255,0.62)";
        ctx.fill();
    }

    drawStatusPill(x + 30, footerTop + 12, profileMaxScroll > 0 ? "Колесо — прокрутка" : "P / Esc", UI.blue);
    ctx.fillStyle = UI.muted;
    ctx.font = "12px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(fitCanvasText("Логин, пароль, энергия и инвентарь не отображаются", w - 190), x + w - 30, footerTop + 24);

    ctx.restore();
}


// ===============================
// 💬 ONLINE CHAT UI — СТИЛЬ LIFE CITY HUD
// ===============================
