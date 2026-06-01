// ===============================
// 💼 UI JOBS — панели действий, работы, сдачи мусора
// ===============================
function drawTrashActionPanel() {
    if (!nearbyTrash) return;

    const trashCount = myPlayer.inventory?.trash || 0;
    const trashMax = myPlayer.inventory?.trashMax || 10;
    const full = trashCount >= trashMax;

    const w = full ? 430 : 455;
    const h = 96;
    const x = canvas.width / 2 - w / 2;
    const y = canvas.height - h - 118;
    const accent = full ? UI.red : UI.green;
    const rowY = y + 73;

    drawPopupPanel(
        x,
        y,
        w,
        h,
        full ? "ИНВЕНТАРЬ ЗАПОЛНЕН" : "ДЕЙСТВИЕ РЯДОМ",
        full ? "🎒" : "🧹",
        accent
    );

    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    if (full) {
        ctx.fillStyle = UI.text;
        ctx.font = "bold 16px Arial";
        ctx.fillText("Сначала сдай мусор", x + 24, rowY);

        drawStatusPill(x + w - 100, rowY - 12, `${trashCount}/${trashMax}`, UI.red);
    } else {
        ctx.fillStyle = UI.text;
        ctx.font = "bold 17px Arial";
        ctx.fillText("Поднять мусор", x + 24, rowY);

        const energyX = x + 164;
        const energyW = drawEnergyCostPill(energyX, rowY - 13, "⚡ -10");
        drawStatusPill(energyX + energyW + 8, rowY - 12, `${trashCount}/${trashMax}`, UI.green);

        drawKeyChip(x + w - 58, rowY - 15, "E", UI.green, 34);
    }

    ctx.restore();
}
function drawHudFloatingTexts(rows, compactAmount) {
    if (compactAmount > 0.35) return;

    for (let key of Object.keys(hudGainFlows)) {
        const item = hudGainFlows[key];
        if (!item || item.remaining <= 0) continue;

        const row = rows[item.row];
        if (!row) continue;

        const now = performance.now();
        const isWaiting = now < item.startAt;
        const visibleValue = Math.ceil(item.remaining);
        const lowValueFade = item.remaining < HUD_GAIN_FADE_AT
            ? clamp01(item.remaining / HUD_GAIN_FADE_AT)
            : 1;

        // Первую секунду после получения награды текст полностью видимый:
        // без перетекания и без исчезновения, даже если значение маленькое.
        const alpha = (isWaiting ? 1 : lowValueFade) * (1 - compactAmount);

        if (alpha <= 0.02) continue;

        const fontSize = item.row === "money"
            ? lerp(25, 21, compactAmount)
            : 15;

        const text = `${item.prefix}${visibleValue}${item.suffix}`;

        ctx.save();
        ctx.globalAlpha = alpha;
        drawGainTextWithShine(
            text,
            row.x,
            row.y,
            row.align || "left",
            fontSize,
            item.color === "gold" ? "gold" : item.color
        );
        ctx.restore();
    }
}

// ===============================
// 🧩 MODERN HUD — ЕДИНЫЙ ИНТЕРФЕЙС ИГРОКА
// Отвечает за деньги, уровни, опыт, энергию, район, улицу, онлайн и пинг.
// HUD плавно сворачивается в компактный режим по клавише H или кнопке.
// ===============================
function drawModernHUD() {
    // 0 = полный HUD, 1 = компактный HUD
    hudAnim += ((hudCompact ? 1 : 0) - hudAnim) * 0.10;

    const t = hudAnim;

    const fullW = 315;
    const miniW = 235;
    const fullH = 246;
    const miniH = 122;

    const panelW = lerp(fullW, miniW, t);
    const panelH = lerp(fullH, miniH, t);
    


    const x = canvas.width - panelW - 18;
    const y = 18;

    hudPanelBounds.x = x;
    hudPanelBounds.y = y;
    hudPanelBounds.w = panelW;
    hudPanelBounds.h = panelH;

    const level = myPlayer.level || 1;
    const xp = myPlayer.xp || 0;
    const xpNeed = level * 100;
    const xpPercent = clamp01(xp / xpNeed);

    const job = myPlayer.job || "Без работы";
    const hasJob = job !== "Без работы";
    const jobLevel = myPlayer.jobLevel || 1;
    const jobXP = myPlayer.jobXP || 0;
    const jobXPNeed = jobLevel * 100;
    const jobPercent = clamp01(jobXP / jobXPNeed);

    const energy = Math.floor(myPlayer.energy || 0);
    const energyPercent = clamp01(energy / 100);

    // Деньги, опыт и шкалы синхронизированы с эффектом «перетекания».
    // Сначала +число ждёт 1 секунду, затем уменьшается, а фактическое значение
    // и заполнение шкалы растут с той же скоростью.
    hudDisplay.xp = updateHudFlowValue("xp", xp);
    hudDisplay.jobXP = updateHudFlowValue("job", jobXP);
    hudDisplay.energy = smoothValue(hudDisplay.energy, energy, 0.12);
    hudDisplay.money = updateHudFlowValue("money", myPlayer.money || 0);

    const displayXP = Math.round(hudDisplay.xp);
    const displayJobXP = Math.round(hudDisplay.jobXP);
    const displayEnergy = Math.round(hudDisplay.energy);
    const displayMoney = Math.round(hudDisplay.money);

    const xpDisplayPercent = clamp01(hudDisplay.xp / xpNeed);
    const jobDisplayPercent = clamp01(hudDisplay.jobXP / jobXPNeed);
    const energyDisplayPercent = clamp01(hudDisplay.energy / 100);

    const money = displayMoney.toLocaleString("en-US");
    const districtName = getCurrentDistrict();
    const streetName = getCurrentStreet();

    // Кнопка сворачивания HUD
    hudButton.w = 30;
    hudButton.h = 26;
    hudButton.x = x + panelW - 42;
    hudButton.y = y + 12;

    ctx.save();

    drawPanel(x, y, panelW, panelH, "", "", UI.blue);

    // ===============================
    // Верхняя строка: деньги, онлайн, пинг, кнопка
    // ===============================
    ctx.textBaseline = "middle";

    ctx.fillStyle = UI.green;
    ctx.font = `bold ${lerp(25, 21, t)}px Arial`;
    ctx.textAlign = "left";
    const moneyText = `$ ${money}`;
    ctx.fillText(moneyText, x + 16, y + 25);
    const moneyGainX = x + 16 + ctx.measureText(moneyText).width + 4;

    const topInfoY = y + 25;

    ctx.font = "bold 18px Arial";
    ctx.textAlign = "right";

    ctx.fillStyle = UI.green;
    ctx.fillText(`👥 ${onlineCount}`, hudButton.x - 62, topInfoY);

    ctx.fillStyle = realPing <= 80 ? UI.green : realPing <= 150 ? UI.yellow : UI.red;
    ctx.fillText(`📶 ${realPing || 0}`, hudButton.x - 8, topInfoY);

    roundedRect(hudButton.x, hudButton.y, hudButton.w, hudButton.h, 7);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();

    ctx.strokeStyle = UI.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = UI.blue;
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
        hudCompact ? "▾" : "▴",
        hudButton.x + hudButton.w / 2,
        hudButton.y + hudButton.h / 2
    );

    // ===============================
    // Позиции строк и баров
    // ===============================
    const iconX = x + 16;
    const fullTextX = x + 16;

    const fullBarX = x + 16;
    const miniBarX = x + 72;
    const barX = lerp(fullBarX, miniBarX, t);

    const fullBarW = panelW - 32;
    const miniBarW = panelW - 88;
    const barW = lerp(fullBarW, miniBarW, t);

    const barH = lerp(8, 9, t);

    const xpTextY = lerp(y + 74, y + 63, t);
    const xpBarY = lerp(y + 88, y + 59, t);

    const jobTextY = lerp(y + 113, y + 84, t);
    const jobBarY = lerp(y + 127, y + 80, t);

    const energyTextY = lerp(y + 152, y + 105, t);
    const energyBarY = lerp(y + 166, y + 101, t);

    // ===============================
    // Уровень игрока
    // ===============================
    ctx.textAlign = "left";
    ctx.fillStyle = UI.purple;
    ctx.font = `bold ${lerp(15, 14, t)}px Arial`;
    ctx.fillText(
        t > 0.65 ? `👤 ${level}` : `👤 УР. ${level}`,
        lerp(fullTextX, iconX, t),
        xpTextY
    );

    if (t < 0.85) {
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle = UI.muted;
        ctx.font = "bold 15px Arial";
        ctx.textAlign = "right";
        ctx.fillText(`${displayXP} / ${xpNeed}`, x + panelW - 16, xpTextY);
        ctx.globalAlpha = 1;
    }

    drawProgressBar(barX, xpBarY, barW, barH, xpDisplayPercent, UI.purple);

    // ===============================
    // Профессия игрока
    // ===============================
    ctx.textAlign = "left";
    ctx.fillStyle = UI.green;
    ctx.font = `bold ${lerp(15, 14, t)}px Arial`;
    ctx.fillText(
        t > 0.65
            ? (hasJob ? `💼 ${jobLevel}` : "💼")
            : (hasJob ? `💼 ${job} Ур. ${jobLevel}` : `💼 ${job}`),
        lerp(fullTextX, iconX, t),
        jobTextY
    );

    if (hasJob && t < 0.85) {
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle = UI.muted;
        ctx.font = "bold 15px Arial";
        ctx.textAlign = "right";
        ctx.fillText(`${displayJobXP} / ${jobXPNeed}`, x + panelW - 16, jobTextY);
        ctx.globalAlpha = 1;
    }

    drawProgressBar(barX, jobBarY, barW, barH, hasJob ? jobDisplayPercent : 0, UI.green);

    // ===============================
    // Энергия игрока
    // ===============================
    ctx.textAlign = "left";
    ctx.fillStyle = UI.yellow;
    ctx.font = `bold ${lerp(15, 14, t)}px Arial`;
    ctx.fillText(
        t > 0.65 ? `⚡ ${displayEnergy}` : "⚡ Энергия",
        lerp(fullTextX, iconX, t),
        energyTextY
    );

    if (t < 0.85) {
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle = UI.muted;
        ctx.font = "bold 15px Arial";
        ctx.textAlign = "right";
        ctx.fillText(`${displayEnergy}/100`, x + panelW - 16, energyTextY);
        ctx.globalAlpha = 1;
    }

    drawProgressBar(barX, energyBarY, barW, lerp(9, 10, t), energyDisplayPercent, UI.yellow);

    drawHudFloatingTexts({
        money: { x: moneyGainX, y: y + 25, align: "left" },
        xp: { x: x + panelW - 92, y: xpTextY, align: "right" },
        job: { x: x + panelW - 92, y: jobTextY, align: "right" }
    }, t);

    // ===============================
    // Район, улица и подсказка H
    // ===============================
    const locationAlpha = 1 - t;

    if (locationAlpha > 0.03) {
        const hudTargetX = hudButton.x + hudButton.w / 2;
        const hudTargetY = hudButton.y + hudButton.h / 2;

        const districtX = lerp(x + 16, hudTargetX - 8, t);
        const streetX = lerp(x + 16, hudTargetX - 5, t);
        const hintX = lerp(x + panelW - 16, hudTargetX + 4, t);

        const districtY = lerp(y + 204, hudTargetY + 7, t);
        const streetY = lerp(y + 226, hudTargetY + 10, t);

        ctx.globalAlpha = locationAlpha;

        ctx.textAlign = "left";
        ctx.fillStyle = UI.blue;
        ctx.font = `bold ${lerp(13, 2, t)}px Arial`;
        ctx.fillText(`📍 ${districtName}`, districtX, districtY);

        ctx.fillStyle = UI.muted;
        ctx.font = `${lerp(13, 1, t)}px Arial`;
        ctx.fillText(`🛣️ ${streetName}`, streetX, streetY);

        ctx.textAlign = "right";
        ctx.fillStyle = UI.muted;
        ctx.font = `bold ${lerp(13, 2, t)}px Arial`;
        ctx.fillText("H - Свернуть HUD", hintX, districtY);

        ctx.globalAlpha = 1;
    }

    ctx.restore();
}


// Функция рисует подсказку работы или информационное сообщение
function drawJobHintPanel() {
    nearJob = getNearbyJob();

    if (jobConfirmOpen && jobConfirmData) {
        drawJobConfirmPanel(jobConfirmData);
        return;
    }

    if (!nearJob) return;

    if (nearJob.type === "trashStation") {
        drawTrashStationPanel(nearJob);
        return;
    }

    const noAction = nearJob.type === "noJob";
    const accent = noAction ? UI.yellow : UI.green;

    const w = 540;
    const h = noAction ? 128 : 104;
    const x = canvas.width / 2 - w / 2;
    const y = canvas.height - h - 28;

    drawPopupPanel(
        x,
        y,
        w,
        h,
        noAction ? "НЕТ ДОСТУПНЫХ ДЕЙСТВИЙ" : "ДЕЙСТВИЕ",
        noAction ? "⚠" : "💼",
        accent
    );

    ctx.save();
    const contentY = y + 78;
    const cardW = noAction ? 196 : 170;
    drawInfoCard(
        x + 22,
        contentY - 24,
        cardW,
        46,
        noAction ? "Статус" : "Объект",
        noAction ? "Причина" : (nearJob.title || "Действие"),
        accent,
        noAction ? "!" : "◆"
    );

    if (noAction) {
        const reason = nearJob.text || "Нет доступных действий";
        drawWrappedTextBlock(reason, x + 238, contentY - 9, w - 264, 18, "bold 14px Arial", UI.yellow, 2);
    } else {
        drawWrappedTextBlock(nearJob.text || "Нажми E", x + 210, contentY - 9, w - 284, 18, "14px Arial", UI.muted, 2);
        drawKeyChip(x + w - 58, contentY - 18, "E", UI.yellow, 34);
    }

    ctx.restore();
}

function drawTrashStationPanel(data) {
    const trashCount = Number(data.trashCount) || 0;
    const trashMax = Number(data.trashMax) || 10;
    const onShift = !!data.onShift;
    const canDeposit = trashCount > 0;
    const canLeaveShift = !onShift || trashCount <= 0;

    const w = 640;
    const h = 176;
    const x = canvas.width / 2 - w / 2;
    const y = canvas.height - h - 28;
    const accent = onShift ? UI.green : UI.yellow;

    drawPopupPanel(x, y, w, h, "МУСОРКА", "🧹", accent);

    ctx.save();
    drawInfoCard(x + 24, y + 70, 180, 54, "Смена", onShift ? "На смене" : "Не на смене", accent, onShift ? "✓" : "•");
    drawInfoCard(x + 218, y + 70, 170, 54, "Мусор", `${trashCount}/${trashMax}`, UI.yellow, "▣");

    const btnY = y + 130;
    const btnH = 36;
    const btnW = 176;
    const gap = 10;

    const depositX = x + w - btnW * 2 - gap - 24;
    const shiftX = x + w - btnW - 24;

    trashStationButtons.deposit = { x: depositX, y: btnY, w: btnW, h: btnH, active: canDeposit };
    trashStationButtons.shift = { x: shiftX, y: btnY, w: btnW, h: btnH, active: canLeaveShift };

    drawPopupButton(depositX, btnY, btnW, btnH, "E — сдать мусор", canDeposit ? UI.green : UI.muted, canDeposit);
    drawPopupButton(shiftX, btnY, btnW, btnH, onShift ? "Уйти со смены" : "Выйти на смену", canLeaveShift ? accent : UI.muted, canLeaveShift);

    const hint = onShift && trashCount > 0
        ? "Сначала сдай мусор, потом можно уйти со смены."
        : "Рабочая форма включается только во время смены.";
    drawWrappedTextBlock(hint, x + 404, y + 78, w - 430, 18, "13px Arial", UI.muted, 2);

    ctx.restore();
}

// Функция рисует окно подтверждения устройства на работу или увольнения
function drawJobConfirmPanel(data) {
    const isQuit = data.type === "quitJob";
    const isBuy = data.type === "buyBackpack";
    const accent = isQuit ? UI.red : (isBuy ? UI.yellow : UI.green);

    const w = 560;
    const h = 178;
    const x = canvas.width / 2 - w / 2;
    const y = canvas.height - h - 28;

    drawPopupPanel(
        x,
        y,
        w,
        h,
        isQuit ? "ПОДТВЕРЖДЕНИЕ" : (isBuy ? "ПОКУПКА" : "РАБОТА"),
        isQuit ? "🏛" : (isBuy ? "🎒" : "💼"),
        accent
    );

    const mainText = isQuit
        ? "Ты действительно хочешь уволиться?"
        : (isBuy ? "Купить рюкзак за 1000 монет?" : `Устроиться на работу: ${data.title}?`);

    const subText = isQuit
        ? "Текущий рабочий статус изменится. Опыт и уровни сохраняются."
        : (isBuy ? "+5 слотов к инвентарю. Купить можно один раз." : "Действие будет обработано сервером.");

    ctx.save();
    drawWrappedTextBlock(mainText, x + 24, y + 78, w - 48, 20, "bold 17px Arial", UI.text, 2);
    drawWrappedTextBlock(subText, x + 24, y + 106, w - 48, 18, "13px Arial", UI.muted, 2);
    ctx.restore();

    const btnW = 128;
    const btnH = 38;
    const gap = 8;
    const buttonsY = y + h - btnH - 18;

    const cancelX = x + w - btnW - 24;
    const acceptX = cancelX - btnW - gap;

    jobConfirmButtons.accept = { x: acceptX, y: buttonsY, w: btnW, h: btnH };
    jobConfirmButtons.cancel = { x: cancelX, y: buttonsY, w: btnW, h: btnH };

    const hintY = buttonsY + Math.round((btnH - 22) / 2);
    const yesPillW = drawStatusPill(x + 24, hintY, "F — да", accent);
    drawStatusPill(x + 24 + yesPillW + 6, hintY, "Esc — нет", UI.muted);

    drawPopupButton(
        acceptX,
        buttonsY,
        btnW,
        btnH,
        isQuit ? "Уволиться" : (isBuy ? "Купить" : "Устроиться"),
        accent,
        true
    );

    drawPopupButton(cancelX, buttonsY, btnW, btnH, "Отмена", UI.muted, false);
}

