// ===============================
// ✨ UI POLISH HELPERS
// Единые безопасные функции для текста, hover и карточек.
// ===============================
function isUiHover(x, y, w, h) {
    return chatMouse && chatMouse.x >= x && chatMouse.x <= x + w && chatMouse.y >= y && chatMouse.y <= y + h;
}

function fitText(text, maxWidth, font, suffix = "…") {
    const value = String(text ?? "");
    ctx.save();
    ctx.font = font;
    if (ctx.measureText(value).width <= maxWidth) {
        ctx.restore();
        return value;
    }
    let out = value;
    while (out.length > 0 && ctx.measureText(out + suffix).width > maxWidth) {
        out = out.slice(0, -1);
    }
    ctx.restore();
    return out.trimEnd() + suffix;
}

function drawSafeText(text, x, y, maxWidth, font, color, align = "left", baseline = "middle") {
    const shown = fitText(text, maxWidth, font);
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(shown, x, y);
    ctx.restore();
    return shown;
}

function drawWrappedTextBlock(text, x, y, maxWidth, lineHeight, font, color, maxLines = 3) {
    const lines = wrapTextLines(text, maxWidth, font).slice(0, maxLines);
    if (wrapTextLines(text, maxWidth, font).length > maxLines && lines.length) {
        lines[lines.length - 1] = fitText(lines[lines.length - 1], maxWidth, font);
    }
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x, y + i * lineHeight);
    }
    ctx.restore();
    return lines.length * lineHeight;
}

function drawUiIconBadge(x, y, size, icon, color) {
    ctx.save();
    const pulse = 0.5 + Math.sin(performance.now() / 520) * 0.12;
    roundedRect(x, y, size, size, 11);
    ctx.fillStyle = "rgba(255,255,255,0.065)";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.globalAlpha *= 0.34 + pulse * 0.1;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(x + size * 0.5, y + size * 0.35, 2, x + size * 0.5, y + size * 0.35, size * 0.78);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = g;
    ctx.fillRect(x, y, size, size);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.max(15, size * 0.5)}px 'Segoe UI Emoji', Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icon || "•", x + size / 2, y + size / 2 + 0.5);
    ctx.restore();
}

function drawInfoCard(x, y, w, h, label, value, color = UI.blue, icon = "") {
    ctx.save();
    const hover = isUiHover(x, y, w, h);
    roundedRect(x, y, w, h, 12);
    ctx.fillStyle = hover ? "rgba(255,255,255,0.075)" : "rgba(255,255,255,0.045)";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.globalAlpha *= hover ? 0.46 : 0.24;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (icon) {
        ctx.fillStyle = color;
        ctx.font = "bold 15px 'Segoe UI Emoji', Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(icon, x + 19, y + h / 2);
    }
    const textX = icon ? x + 38 : x + 14;
    drawSafeText(label, textX, y + 14, w - (icon ? 50 : 26), "bold 11px Arial", UI.muted, "left", "middle");
    drawSafeText(value, textX, y + h - 16, w - (icon ? 50 : 26), "bold 15px Arial", color, "left", "middle");
    ctx.restore();
}

function drawPanel(x, y, w, h, title, icon, color) {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;

    roundedRect(x, y, w, h, 14);
    ctx.fillStyle = UI.panel;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = UI.border;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (title) {
        ctx.fillStyle = color;
        ctx.font = "bold 22px 'Segoe UI Emoji', Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(icon, x + 18, y + 28);

        ctx.fillStyle = color;
        ctx.font = "bold 18px Arial";
        ctx.fillText(title, x + 52, y + 28);

        ctx.strokeStyle = UI.line;
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 54);
        ctx.lineTo(x + w - 16, y + 54);
        ctx.stroke();
    }

    ctx.restore();
}

function drawProgressBar(x, y, w, h, percent, color) {
    percent = clamp01(percent);

    roundedRect(x, y, w, h, h / 2);
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (percent > 0) {
        const fillW = Math.max(h, w * percent);

        ctx.save();
        roundedRect(x, y, fillW, h, h / 2);
        ctx.clip();

        const gradient = ctx.createLinearGradient(x, y, x + fillW, y);
        gradient.addColorStop(0, "rgba(255,255,255,0.22)");
        gradient.addColorStop(0.18, color);
        gradient.addColorStop(1, "rgba(255,255,255,0.78)");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, fillW, h);

        const shineX = x + ((performance.now() / 12) % (w + 80)) - 80;
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.beginPath();
        ctx.moveTo(shineX, y);
        ctx.lineTo(shineX + 34, y);
        ctx.lineTo(shineX + 16, y + h);
        ctx.lineTo(shineX - 18, y + h);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

function drawGainTextWithShine(text, x, y, align, fontSize, modeColor) {
    ctx.save();

    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = align || "left";
    ctx.textBaseline = "middle";

    const time = performance.now();
    const metrics = ctx.measureText(text);
    const textW = metrics.width;
    const left = align === "right" ? x - textW : x;
    const right = align === "right" ? x : x + textW;
    const top = y - fontSize * 0.78;
    const height = fontSize * 1.25;

    const pulse = 0.55 + Math.sin(time / 130) * 0.45;
    const shine = (time / 900) % 1;

    // Обрезаем все визуальные эффекты по области текста, чтобы луч/перелив
    // не вылезали за границы строки и корректно наследовали прозрачность.
    ctx.beginPath();
    ctx.rect(left, top, textW, height);
    ctx.clip();

    function sortedStops(baseStops) {
        return baseStops
            .map(([offset, color]) => [clamp01(offset), color])
            .sort((a, b) => a[0] - b[0]);
    }

    let gradient = ctx.createLinearGradient(left, y - fontSize, right, y + fontSize);

    if (modeColor === "gold") {
        const stops = sortedStops([
            [0.00, "#ff9f00"],
            [shine - 0.18, "#ffc400"],
            [shine - 0.06, "#fff0a0"],
            [shine, "#ffffff"],
            [shine + 0.06, "#fff3b8"],
            [shine + 0.18, "#ffd21f"],
            [1.00, "#ff8f00"]
        ]);

        for (const [offset, color] of stops) gradient.addColorStop(offset, color);

        ctx.shadowColor = `rgba(255, 213, 46, ${0.45 + pulse * 0.35})`;
        ctx.shadowBlur = 3 + pulse * 3;

        // Основа и перелив рисуются только самим текстом: никаких отдельных лучей
        // поверх HUD, поэтому эффект не выходит за буквы/цифры.
        ctx.fillStyle = "#ffd22e";
        ctx.fillText(text, x, y);
        ctx.fillStyle = gradient;
        ctx.fillText(text, x, y);
    } else {
        const baseColor = modeColor || UI.purple;
        const stops = sortedStops([
            [0.00, baseColor],
            [shine - 0.20, baseColor],
            [shine - 0.07, "rgba(255,255,255,0.90)"],
            [shine, "#ffffff"],
            [shine + 0.07, "rgba(255,255,255,0.78)"],
            [shine + 0.20, baseColor],
            [1.00, baseColor]
        ]);

        for (const [offset, color] of stops) gradient.addColorStop(offset, color);

        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 3 + pulse * 3;

        ctx.fillStyle = baseColor;
        ctx.fillText(text, x, y);
        ctx.fillStyle = gradient;
        ctx.fillText(text, x, y);
    }

    ctx.restore();
}


// ===============================
// 🪟 MODERN POPUP UI — ЕДИНЫЙ СТИЛЬ ОКОН
// ===============================
function drawPopupPanel(x, y, w, h, title, icon, color, options = {}) {
    const time = performance.now();
    const accent = color || UI.blue;
    const alpha = options.alpha ?? 1;
    const radius = options.radius ?? 18;

    ctx.save();
    const baseAlpha = ctx.globalAlpha * alpha;
    ctx.globalAlpha = baseAlpha;

    ctx.shadowColor = "rgba(0, 0, 0, 0.56)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 7;

    roundedRect(x, y, w, h, radius);
    const bg = ctx.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, "rgba(12, 29, 50, 0.96)");
    bg.addColorStop(0.48, "rgba(6, 18, 32, 0.94)");
    bg.addColorStop(1, "rgba(3, 10, 20, 0.965)");
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.save();
    roundedRect(x, y, w, h, radius);
    ctx.clip();

    const topGlow = ctx.createLinearGradient(x, y, x, y + 92);
    topGlow.addColorStop(0, "rgba(255,255,255,0.105)");
    topGlow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = topGlow;
    ctx.fillRect(x, y, w, 96);

    const accentGlow = ctx.createRadialGradient(x + 36, y + 30, 6, x + 36, y + 30, Math.max(w, h) * 0.72);
    accentGlow.addColorStop(0, hexToRgbaSafe(accent, 0.12));
    accentGlow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = accentGlow;
    ctx.fillRect(x, y, w, h);
    ctx.restore();

    ctx.strokeStyle = "rgba(120,190,255,0.22)";
    ctx.lineWidth = 1;
    roundedRect(x, y, w, h, radius);
    ctx.stroke();

    ctx.strokeStyle = accent;
    ctx.globalAlpha = baseAlpha * 0.22;
    ctx.lineWidth = 1;
    roundedRect(x + 1.5, y + 1.5, w - 3, h - 3, radius - 2);
    ctx.stroke();
    ctx.globalAlpha = baseAlpha;

    if (title) {
        drawUiIconBadge(x + 18, y + 15, 34, icon || "•", accent);
        drawSafeText(title, x + 62, y + 32, w - 86, "bold 17px Arial", accent, "left", "middle");

        // Тонкий верхний акцент вместо длинной линии-разделителя.
        // Старый разделитель проходил через контент в низких popup-окнах.
        const accentLineW = Math.min(84, Math.max(42, w * 0.22));
        const lineY = y + 53;
        const lineGradient = ctx.createLinearGradient(x + 62, lineY, x + 62 + accentLineW, lineY);
        lineGradient.addColorStop(0, hexToRgbaSafe(accent, 0.34));
        lineGradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 62, lineY);
        ctx.lineTo(x + 62 + accentLineW, lineY);
        ctx.stroke();
    }

    ctx.restore();
}

function hexToRgbaSafe(color, alpha) {
    if (!color || color[0] !== "#") return `rgba(120,190,255,${alpha})`;
    const hex = color.replace("#", "");
    const value = hex.length === 3
        ? hex.split("").map(c => c + c).join("")
        : hex.padEnd(6, "0").slice(0, 6);
    const r = parseInt(value.slice(0, 2), 16) || 120;
    const g = parseInt(value.slice(2, 4), 16) || 190;
    const b = parseInt(value.slice(4, 6), 16) || 255;
    return `rgba(${r},${g},${b},${alpha})`;
}

function drawKeyChip(x, y, label, color, size = 34) {
    const baseAlpha = ctx.globalAlpha;
    const h = Math.max(22, size - 8);
    const hover = isUiHover(x, y, size, h);
    ctx.save();
    ctx.globalAlpha = baseAlpha;

    roundedRect(x, y, size, h, 7);
    ctx.fillStyle = hover ? "rgba(255,255,255,0.095)" : "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.globalAlpha = baseAlpha * (hover ? 0.72 : 0.46);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = baseAlpha;

    ctx.fillStyle = color;
    ctx.font = `bold ${Math.max(13, size * 0.42)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + size / 2, y + h / 2 + 0.5);
    ctx.restore();
}

function drawPopupButton(x, y, w, h, text, color, filled = false, disabled = false) {
    const time = performance.now();
    const hover = !disabled && isUiHover(x, y, w, h);
    const baseAlpha = ctx.globalAlpha;
    const alphaMul = disabled ? 0.45 : 1;

    ctx.save();
    ctx.globalAlpha = baseAlpha * alphaMul;

    roundedRect(x, y, w, h, 10);
    const bg = ctx.createLinearGradient(x, y, x, y + h);
    if (filled) {
        bg.addColorStop(0, hover ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.105)");
        bg.addColorStop(1, hover ? "rgba(255,255,255,0.065)" : "rgba(255,255,255,0.045)");
    } else {
        bg.addColorStop(0, hover ? "rgba(255,255,255,0.095)" : "rgba(255,255,255,0.055)");
        bg.addColorStop(1, "rgba(255,255,255,0.035)");
    }
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.globalAlpha = baseAlpha * alphaMul * (filled ? (hover ? 0.82 : 0.62) : (hover ? 0.56 : 0.32));
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = baseAlpha * alphaMul;

    if (filled && !disabled) {
        ctx.save();
        roundedRect(x + 1, y + 1, w - 2, h - 2, 9);
        ctx.clip();
        const shineX = x + (time / 26 % (w + 74)) - 74;
        const g = ctx.createLinearGradient(shineX, y, shineX + 74, y + h);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.52, hover ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.09)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x, y, w, h);
        ctx.restore();
    }

    drawSafeText(text, x + w / 2, y + h / 2 + 0.5, w - 18, `bold ${h >= 36 ? 14 : 13}px Arial`, disabled ? UI.muted : color, "center", "middle");
    ctx.restore();
}

function drawStatusPill(x, y, text, color) {
    const baseAlpha = ctx.globalAlpha;
    ctx.save();
    ctx.globalAlpha = baseAlpha;
    ctx.font = "bold 12px Arial";
    const w = Math.ceil(ctx.measureText(String(text || "")).width) + 18;
    const h = 22;

    roundedRect(x, y, w, h, 7);
    ctx.fillStyle = "rgba(255,255,255,0.048)";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.globalAlpha = baseAlpha * 0.24;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = baseAlpha;

    drawSafeText(text, x + w / 2, y + h / 2 + 0.5, w - 12, "bold 12px Arial", color, "center", "middle");
    ctx.restore();
    return w;
}

function drawEnergyCostPill(x, y, text = "⚡ -10") {
    const baseAlpha = ctx.globalAlpha;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 13px Arial";

    const w = Math.ceil(ctx.measureText(text).width) + 20;
    const h = 24;

    roundedRect(x, y, w, h, 7);
    ctx.fillStyle = "rgba(255, 194, 51, 0.075)";
    ctx.fill();

    ctx.strokeStyle = UI.yellow;
    ctx.globalAlpha *= 0.38;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = baseAlpha;

    ctx.fillStyle = UI.yellow;
    ctx.fillText(text, x + w / 2, y + h / 2 + 0.5);
    ctx.restore();

    return w;
}

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

    drawDevCheckbox(leftX, startY, colW, "Редактировать здания", "editBuildings", "ЛКМ — двигать, Shift — ширина, Ctrl — высота");
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
            ? (devOptions.editBuildings ? "Редактирование активно: результат выводится в Console после отпускания мыши" : "Режим включён: выбери нужные debug-слои галочками")
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
function ensureChatInput() {
    if (chatInputEl) return chatInputEl;

    chatInputEl = document.createElement("input");
    chatInputEl.type = "text";
    chatInputEl.maxLength = 240;
    chatInputEl.placeholder = "Написать сообщение...";
    chatInputEl.style.position = "absolute";
    chatInputEl.style.zIndex = "1001";
    chatInputEl.style.display = "none";
    chatInputEl.style.boxSizing = "border-box";
    chatInputEl.style.border = "1px solid rgba(88,199,255,0.45)";
    chatInputEl.style.borderRadius = "10px";
    chatInputEl.style.background = "rgba(6,16,28,0.94)";
    chatInputEl.style.color = "#f4f7fb";
    chatInputEl.style.outline = "none";
    chatInputEl.style.padding = "0 12px";
    chatInputEl.style.font = "13px Arial";
    chatInputEl.style.boxShadow = "0 0 12px rgba(88,199,255,0.16)";
    chatInputEl.autocomplete = "off";
    chatInputEl.spellcheck = false;

    chatInputEl.addEventListener("focus", () => { chatInputFocused = true; });
    chatInputEl.addEventListener("blur", () => { chatInputFocused = false; });
    chatInputEl.addEventListener("keydown", (e) => {
        // Не даём глобальному обработчику игры перехватывать буквы чата.
        e.stopPropagation();
        if (e.key === "Enter") {
            e.preventDefault();
            sendChatMessage();
        }
        if (e.key === "Escape") {
            chatInputEl.blur();
        }
    });

    document.body.appendChild(chatInputEl);
    return chatInputEl;
}

function updateChatInputPosition() {
    const input = ensureChatInput();
    if (!isAuthenticated || chatMode === "hidden") {
        input.style.display = "none";
        return;
    }

    input.style.display = "block";
    input.style.left = (chatBounds.x + 14) + "px";
    input.style.top = (chatBounds.y + chatBounds.h - 44) + "px";
    input.style.width = (chatBounds.w - 28) + "px";
    input.style.height = "31px";
}

function setChatMode(mode) {
    chatMode = mode;
    if (chatMode === "hidden") {
        chatContextMenu = null;
        chatPrivateListHitboxes = [];
        chatPrivateListOpen = false;
        if (chatInputEl) chatInputEl.blur();
    }
    updateChatInputPosition();
}

function sendChatMessage() {
    const input = ensureChatInput();
    const text = String(input.value || "").trim();
    if (!text) return;

    const payload = {
        channel: chatChannel,
        text,
        replyTo: chatReplyTo ? chatReplyTo.id : null
    };

    // Для личных сообщений серверу обязательно нужен ID получателя.
    // Раньше выбранный игрок отображался в UI, но его playerId не уходил в payload,
    // поэтому сервер отвечал: "Выбери игрока для личного сообщения".
    if (chatChannel === "private") {
        const targetId = Number(chatPrivateTarget?.playerId) || 0;
        if (!targetId) {
            showToast("Сначала выбери игрока", "warning");
            return;
        }
        payload.toPlayerId = targetId;
    }

    socket.emit("sendChatMessage", payload);

    input.value = "";
    chatReplyTo = null;
}

function formatChatTime(ts) {
    const d = new Date(Number(ts) || Date.now());
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function wrapTextLines(text, maxWidth, font) {
    ctx.save();
    ctx.font = font;
    const source = String(text || "").replace(/\s+/g, " ").trim();
    const words = source ? source.split(" ") : [];
    const lines = [];
    let line = "";

    function pushLongWord(word) {
        let part = "";
        for (const ch of word) {
            const test = part + ch;
            if (ctx.measureText(test).width <= maxWidth || !part) {
                part = test;
            } else {
                lines.push(part);
                part = ch;
            }
        }
        return part;
    }

    for (const word of words) {
        const test = line ? line + " " + word : word;
        if (ctx.measureText(test).width <= maxWidth) {
            line = test;
            continue;
        }

        if (line) {
            lines.push(line);
            line = "";
        }

        if (ctx.measureText(word).width > maxWidth) {
            line = pushLongWord(word);
        } else {
            line = word;
        }
    }

    if (line) lines.push(line);
    ctx.restore();
    return lines;
}

function wrapChatInlineText(text, firstWidth, fullWidth, font) {
    ctx.save();
    ctx.font = font;
    const source = String(text || "").replace(/\s+/g, " ").trim();
    const words = source ? source.split(" ") : [];
    const lines = [];
    let line = "";
    let currentWidth = Math.max(30, firstWidth);

    function splitWordToLines(word, width) {
        let part = "";
        for (const ch of word) {
            const test = part + ch;
            if (ctx.measureText(test).width <= width || !part) {
                part = test;
            } else {
                lines.push(part);
                part = ch;
                currentWidth = fullWidth;
            }
        }
        return part;
    }

    for (const word of words) {
        const test = line ? line + " " + word : word;
        if (ctx.measureText(test).width <= currentWidth) {
            line = test;
            continue;
        }

        if (line) {
            lines.push(line);
            line = "";
            currentWidth = fullWidth;
        }

        if (ctx.measureText(word).width > currentWidth) {
            line = splitWordToLines(word, currentWidth);
        } else {
            line = word;
        }
    }

    if (line) lines.push(line);
    ctx.restore();
    return lines.length ? lines : [""];
}


function getPrivatePeerFromMessage(m) {
    if (!m || m.channel !== "private") return null;
    const mine = Number(myPlayer.playerId) || 0;
    if (m.playerId === mine) return { playerId: m.toPlayerId, name: m.toName || "Игрок" };
    return { playerId: m.playerId, name: m.name || "Игрок" };
}

function getPrivateContacts() {
    const map = new Map();
    for (const m of chatMessages) {
        const peer = getPrivatePeerFromMessage(m);
        if (!peer || !peer.playerId) continue;
        const prev = map.get(peer.playerId);
        if (!prev || Number(m.time) > Number(prev.lastTime)) {
            map.set(peer.playerId, {
                playerId: peer.playerId,
                name: peer.name || "Игрок",
                lastTime: Number(m.time) || 0,
                lastText: String(m.text || "")
            });
        }
    }
    return Array.from(map.values()).sort((a, b) => b.lastTime - a.lastTime);
}

function selectPrivateContact(peer) {
    if (!peer || !peer.playerId) return;
    chatPrivateTarget = { playerId: Number(peer.playerId) || 0, name: peer.name || "Игрок" };
    chatChannel = "private";
    chatReplyTo = null;
    chatAutoScrollPending = true;
}

function drawPrivateContactsPanel() {
    chatPrivateListHitboxes = [];
    chatPrivateToggleButton = { x: 0, y: 0, w: 0, h: 0 };
    if (chatChannel !== "private" || chatMode === "hidden") {
        chatPrivateListAnim += (0 - chatPrivateListAnim) * 0.18;
        return;
    }

    chatPrivateListAnim += ((chatPrivateListOpen ? 1 : 0) - chatPrivateListAnim) * 0.18;

    const fullW = 210;
    const collapsedW = 34;
    const gap = 10;
    const w = collapsedW + (fullW - collapsedW) * chatPrivateListAnim;
    const x = chatBounds.x + chatBounds.w + gap;
    const y = chatBounds.y;
    const h = chatBounds.h;
    chatPrivateListBounds = { x, y, w, h };

    ctx.save();
    drawPanel(x, y, w, h, "", "", UI.blue);

    // Кнопка скрытия/показа списка диалогов. Даже в свернутом виде остается аккуратный язычок.
    chatPrivateToggleButton = { x: x + 6, y: y + 10, w: Math.max(22, Math.min(30, w - 12)), h: 28 };
    roundedRect(chatPrivateToggleButton.x, chatPrivateToggleButton.y, chatPrivateToggleButton.w, chatPrivateToggleButton.h, 8);
    ctx.fillStyle = "rgba(88,199,255,0.13)";
    ctx.fill();
    ctx.strokeStyle = "rgba(88,199,255,0.42)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = UI.blue;
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(chatPrivateListOpen ? "‹" : "›", chatPrivateToggleButton.x + chatPrivateToggleButton.w / 2, chatPrivateToggleButton.y + chatPrivateToggleButton.h / 2);

    if (chatPrivateListAnim < 0.22) {
        ctx.restore();
        return;
    }

    const contentAlpha = Math.min(1, (chatPrivateListAnim - 0.22) / 0.78);
    ctx.save();
    roundedRect(x + 4, y + 4, Math.max(1, w - 8), h - 8, 12);
    ctx.clip();
    ctx.globalAlpha = contentAlpha;

    ctx.fillStyle = UI.blue;
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Личные", x + 44, y + 24);

    const contacts = getPrivateContacts();
    const listTop = y + 48;
    const listBottom = y + h - 14;
    const viewH = Math.max(20, listBottom - listTop);
    const rowH = 48;
    const contentH = contacts.length * (rowH + 7);
    chatPrivateListMaxScroll = Math.max(0, contentH - viewH);
    chatPrivateListScroll = Math.max(0, Math.min(chatPrivateListMaxScroll, chatPrivateListScroll));

    ctx.save();
    roundedRect(x + 8, listTop - 4, Math.max(1, w - 16), viewH + 8, 10);
    ctx.clip();

    let cy = listTop - chatPrivateListScroll;
    if (contacts.length === 0) {
        ctx.fillStyle = UI.muted;
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Диалогов пока нет", x + w / 2, listTop + 28);
    }

    for (const peer of contacts) {
        if (cy + rowH < listTop - 8 || cy > listBottom + 8) {
            cy += rowH + 7;
            continue;
        }

        const active = chatPrivateTarget && Number(chatPrivateTarget.playerId) === Number(peer.playerId);
        roundedRect(x + 10, cy, Math.max(1, w - 20), rowH, 11);
        ctx.fillStyle = active ? "rgba(88,199,255,0.18)" : "rgba(255,255,255,0.055)";
        ctx.fill();
        ctx.strokeStyle = active ? "rgba(88,199,255,0.55)" : "rgba(120,190,255,0.22)";
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.fillStyle = active ? UI.blue : UI.text;
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "left";
        ctx.fillText(peer.name, x + 22, cy + 17);

        ctx.fillStyle = UI.muted;
        ctx.font = "11px Arial";
        ctx.textAlign = "right";
        ctx.fillText(formatChatTime(peer.lastTime), x + w - 20, cy + 17);

        ctx.textAlign = "left";
        ctx.font = "11px Arial";
        const maxPreviewChars = Math.max(8, Math.floor((w - 54) / 6));
        const preview = peer.lastText.length > maxPreviewChars ? peer.lastText.slice(0, maxPreviewChars) + "…" : peer.lastText;
        ctx.fillText(preview, x + 22, cy + 35);

        chatPrivateListHitboxes.push({ playerId: peer.playerId, name: peer.name, x: x + 10, y: cy, w: Math.max(1, w - 20), h: rowH });
        cy += rowH + 7;
    }
    ctx.restore();

    if (chatPrivateListMaxScroll > 0) {
        const barH = Math.max(26, viewH * (viewH / contentH));
        const barY = listTop + (viewH - barH) * (chatPrivateListScroll / chatPrivateListMaxScroll);
        roundedRect(x + w - 8, listTop, 4, viewH, 2);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fill();
        roundedRect(x + w - 8, barY, 4, barH, 2);
        ctx.fillStyle = "rgba(88,199,255,0.55)";
        ctx.fill();
    }

    ctx.restore();
    ctx.restore();
}

function drawChatMiniButton() {
    chatButtons = [];
    const w = 112;
    const h = 36;
    chatBounds = { x: 18, y: canvas.height - h - 18, w, h };

    ctx.save();
    roundedRect(chatBounds.x, chatBounds.y, w, h, 10);
    ctx.fillStyle = "rgba(6,16,28,0.90)";
    ctx.fill();
    ctx.strokeStyle = "rgba(88,199,255,0.38)";
    ctx.lineWidth = 1.1;
    ctx.stroke();

    ctx.shadowColor = "rgba(88,199,255,0.18)";
    ctx.shadowBlur = 6;
    ctx.fillStyle = UI.blue;
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("💬 Чат", chatBounds.x + 14, chatBounds.y + h / 2);
    ctx.shadowBlur = 0;

    roundedRect(chatBounds.x + w - 32, chatBounds.y + 7, 22, 22, 7);
    ctx.fillStyle = "rgba(88,199,255,0.12)";
    ctx.fill();
    ctx.strokeStyle = "rgba(88,199,255,0.36)";
    ctx.stroke();
    ctx.fillStyle = UI.blue;
    ctx.textAlign = "center";
    ctx.fillText("▴", chatBounds.x + w - 21, chatBounds.y + h / 2);

    chatButtons.push({ type: "mode", value: "compact", x: chatBounds.x, y: chatBounds.y, w: chatBounds.w, h: chatBounds.h });
    ctx.restore();
}

function drawChatPanel() {
    if (!isAuthenticated) {
        if (chatInputEl) chatInputEl.style.display = "none";
        return;
    }

    if (chatMode === "hidden") {
        drawChatMiniButton();
        if (chatInputEl) chatInputEl.style.display = "none";
        return;
    }

    const full = chatMode === "full";
    chatBounds.x = 18;
    chatBounds.w = 430;
    chatBounds.h = full ? Math.min(canvas.height - 36, 720) : 300;
    chatBounds.y = canvas.height - chatBounds.h - 18;

    updateChatInputPosition();
    chatButtons = [];
    chatMessageHitboxes = [];

    ctx.save();
    drawPanel(chatBounds.x, chatBounds.y, chatBounds.w, chatBounds.h, "", "", UI.blue);

    // Заголовок
    ctx.fillStyle = UI.blue;
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("💬 Онлайн чат", chatBounds.x + 16, chatBounds.y + 24);

    // 3 кнопки размера: свернуть, компакт, развернуть
    const btns = [
        { v: "hidden", t: "—" },
        { v: "compact", t: "▣" },
        { v: "full", t: "▴" }
    ];
    let bx = chatBounds.x + chatBounds.w - 104;
    for (const b of btns) {
        roundedRect(bx, chatBounds.y + 10, 28, 25, 7);
        ctx.fillStyle = chatMode === b.v ? "rgba(88,199,255,0.22)" : "rgba(255,255,255,0.06)";
        ctx.fill();
        ctx.strokeStyle = chatMode === b.v ? UI.blue : UI.border;
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.fillStyle = UI.text;
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.fillText(b.t, bx + 14, chatBounds.y + 23);
        chatButtons.push({ type: "mode", value: b.v, x: bx, y: chatBounds.y + 10, w: 28, h: 25 });
        bx += 34;
    }

    // Вкладки
    let tx = chatBounds.x + 14;
    const tabsY = chatBounds.y + 48;
    for (const tab of CHAT_CHANNELS) {
        const tw = tab.id === "private" ? 72 : tab.id === "admin" ? 78 : tab.id === "news" ? 76 : 70;
        roundedRect(tx, tabsY, tw, 28, 8);
        ctx.fillStyle = chatChannel === tab.id ? "rgba(88,199,255,0.18)" : "rgba(255,255,255,0.055)";
        ctx.fill();
        ctx.strokeStyle = chatChannel === tab.id ? UI.blue : UI.border;
        ctx.globalAlpha = chatChannel === tab.id ? 0.86 : 0.42;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = chatChannel === tab.id ? UI.blue : UI.muted;
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${tab.icon} ${tab.label}`, tx + tw / 2, tabsY + 14);
        chatButtons.push({ type: "channel", value: tab.id, x: tx, y: tabsY, w: tw, h: 28 });
        tx += tw + 7;
    }

    // Ответ на сообщение
    const inputTop = chatBounds.y + chatBounds.h - 44;
    let listTop = chatBounds.y + 86;
    let listBottom = inputTop - 8;

    if (chatReplyTo) {
        const ry = inputTop - 34;
        roundedRect(chatBounds.x + 14, ry, chatBounds.w - 28, 28, 8);
        ctx.fillStyle = "rgba(184,92,255,0.14)";
        ctx.fill();
        ctx.strokeStyle = "rgba(184,92,255,0.38)";
        ctx.stroke();
        ctx.fillStyle = UI.purple;
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`Ответ: ${chatReplyTo.name}`, chatBounds.x + 24, ry + 14);
        ctx.fillStyle = UI.muted;
        ctx.fillText(String(chatReplyTo.text || "").slice(0, 42), chatBounds.x + 112, ry + 14);
        ctx.fillStyle = UI.red;
        ctx.textAlign = "right";
        ctx.fillText("×", chatBounds.x + chatBounds.w - 26, ry + 14);
        chatButtons.push({ type: "replyCancel", x: chatBounds.x + chatBounds.w - 44, y: ry, w: 30, h: 28 });
        listBottom = ry - 8;
    }

    // Список сообщений
    const visibleMessages = chatMessages.filter(m => {
        if (chatChannel === "general") return m.channel === "general" || !m.channel;
        if (chatChannel === "private") {
            if (m.channel !== "private") return false;
            if (!chatPrivateTarget) return false;
            const mine = Number(myPlayer.playerId) || 0;
            return (Number(m.playerId) === mine && Number(m.toPlayerId) === Number(chatPrivateTarget.playerId)) ||
                   (Number(m.playerId) === Number(chatPrivateTarget.playerId) && Number(m.toPlayerId) === mine);
        }
        return m.channel === chatChannel;
    });
    const rowData = [];
    let contentH = 0;
    const msgFont = "13px Arial";
    const timeFont = "bold 12px Arial";
    const nameFont = "bold 12px Arial";
    const cardPadX = 12;
    const cardW = chatBounds.w - 28;
    const fullTextW = cardW - cardPadX * 2;

    for (const m of visibleMessages) {
        const timeText = formatChatTime(m.time);
        const nameText = String(m.name || "Игрок");
        ctx.save();
        ctx.font = timeFont;
        const timeW = ctx.measureText(timeText).width;
        ctx.font = nameFont;
        const nameW = ctx.measureText(nameText + ":").width;
        ctx.restore();

        const firstLineW = Math.max(36, fullTextW - timeW - nameW - 19);
        const lines = wrapChatInlineText(m.text, firstLineW, fullTextW, msgFont);
        const extraH = (m.replyPreview ? 22 : 0);
        const h = 18 + lines.length * 18 + extraH + 14;
        rowData.push({ message: m, lines, y: contentH, h, timeText, nameText: nameText + ":", timeW, nameW, firstLineW });
        contentH += h + 8;
    }

    const viewH = Math.max(10, listBottom - listTop);
    chatMaxScroll = Math.max(0, contentH - viewH);
    if (chatAutoScrollPending && performance.now() > chatManualScrollUntil) {
        chatScroll = chatMaxScroll;
        chatAutoScrollPending = false;
    }
    chatScroll = Math.max(0, Math.min(chatMaxScroll, chatScroll));

    ctx.save();
    roundedRect(chatBounds.x + 10, listTop - 4, chatBounds.w - 20, viewH + 8, 10);
    ctx.clip();

    let baseY = listTop - chatScroll;
    for (const row of rowData) {
        const m = row.message;
        const y = baseY + row.y;
        if (y + row.h < listTop - 12 || y > listBottom + 12) continue;

        const cardX = chatBounds.x + 14;
        const cardY = y;
        const cardW = chatBounds.w - 28;
        const cardRight = cardX + cardW;
        const contentX = cardX + 12;

        roundedRect(cardX, cardY, cardW, row.h, 12);
        ctx.fillStyle = m.playerId === myPlayer.playerId ? "rgba(88,199,255,0.10)" : "rgba(255,255,255,0.055)";
        ctx.fill();
        ctx.strokeStyle = m.channel === "admin" ? UI.red : m.channel === "news" ? UI.yellow : UI.border;
        ctx.globalAlpha = 0.96;
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        const firstY = cardY + 20;
        const timeText = row.timeText || formatChatTime(m.time);
        const nameText = row.nameText || String(m.name || "Игрок");

        ctx.fillStyle = "rgba(230,238,247,0.94)";
        ctx.font = "bold 13px Arial";
        ctx.fillText(timeText, contentX, firstY);

        const nameX = contentX + row.timeW + 6;
        const nameY = firstY;
        ctx.font = "bold 13px Arial";
        const profileHit = { type: "profile", playerId: m.playerId, name: nameText, x: nameX - 3, y: nameY - 10, w: row.nameW + 6, h: 20 };
        const isNameHover = chatMouse.x >= profileHit.x && chatMouse.x <= profileHit.x + profileHit.w && chatMouse.y >= profileHit.y && chatMouse.y <= profileHit.y + profileHit.h;

        if (isNameHover && m.playerId) {
            roundedRect(profileHit.x - 2, profileHit.y + 1, profileHit.w + 4, profileHit.h - 2, 7);
            ctx.fillStyle = "rgba(88,199,255,0.12)";
            ctx.fill();
            ctx.strokeStyle = "rgba(88,199,255,0.42)";
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.shadowColor = "rgba(88,199,255,0.45)";
            ctx.shadowBlur = 8;
        }

        ctx.fillStyle = m.channel === "admin" ? UI.red : m.channel === "news" ? UI.yellow : UI.blue;
        ctx.fillText(nameText.endsWith(":") ? nameText : nameText + ":", nameX, nameY);
        ctx.shadowBlur = 0;
        chatMessageHitboxes.push(profileHit);

        const firstTextX = nameX + row.nameW + 7;
        let textY = firstY;
        ctx.fillStyle = UI.text;
        ctx.font = "13px Arial";
        for (let i = 0; i < row.lines.length; i++) {
            const lineX = i === 0 ? firstTextX : contentX;
            ctx.fillText(row.lines[i], lineX, textY);
            textY += 17;
        }

        if (m.replyPreview) {
            roundedRect(contentX, textY - 8, cardW - 24, 18, 6);
            ctx.fillStyle = "rgba(184,92,255,0.22)";
            ctx.fill();
            ctx.fillStyle = UI.purple;
            ctx.font = "bold 11px Arial";
            const preview = `↪ ${m.replyPreview.name}: ${String(m.replyPreview.text || "")}`;
            const previewLines = wrapTextLines(preview, cardW - 42, "bold 11px Arial");
            ctx.fillText(previewLines[0] || "", contentX + 8, textY + 1);
        }

        chatMessageHitboxes.push({ type: "message", message: m, x: cardX, y, w: cardW, h: row.h });
    }
    ctx.restore();

    // Скроллбар
    if (chatMaxScroll > 0) {
        const barH = Math.max(28, viewH * (viewH / contentH));
        const barY = listTop + (viewH - barH) * (chatScroll / chatMaxScroll);
        roundedRect(chatBounds.x + chatBounds.w - 10, listTop, 4, viewH, 2);
        ctx.fillStyle = "rgba(255,255,255,0.09)";
        ctx.fill();
        roundedRect(chatBounds.x + chatBounds.w - 10, barY, 4, barH, 2);
        ctx.fillStyle = "rgba(88,199,255,0.55)";
        ctx.fill();
    }

    drawPrivateContactsPanel();

    if (chatChannel === "private" && !chatPrivateTarget) {
        ctx.fillStyle = UI.muted;
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Выбери диалог справа", chatBounds.x + chatBounds.w / 2, (listTop + listBottom) / 2);
    }

    if (chatContextMenu) drawChatContextMenu();

    ctx.restore();
}

function drawChatContextMenu() {
    const isNickMenu = chatContextMenu.type === "nick";
    const w = isNickMenu ? 220 : 156;
    const h = isNickMenu ? 88 : 42;
    const x = Math.min(chatContextMenu.x, canvas.width - w - 10);
    const y = Math.min(chatContextMenu.y, canvas.height - h - 10);
    chatContextMenu.bounds = { x, y, w, h };
    chatContextMenu.actions = [];

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.42)";
    ctx.shadowBlur = 10;
    roundedRect(x, y, w, h, 10);
    ctx.fillStyle = "rgba(6,16,28,0.96)";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = isNickMenu ? UI.blue : UI.purple;
    ctx.globalAlpha = 0.96;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (isNickMenu) {
        const a1 = { type: "private", x: x + 10, y: y + 10, w: w - 20, h: 30 };
        const a2 = { type: "profile", x: x + 10, y: y + 48, w: w - 20, h: 30 };
        chatContextMenu.actions.push(a1, a2);

        roundedRect(a1.x, a1.y, a1.w, a1.h, 8);
        ctx.fillStyle = "rgba(88,199,255,0.13)";
        ctx.fill();
        ctx.strokeStyle = "rgba(88,199,255,0.32)";
        ctx.stroke();
        ctx.fillStyle = UI.blue;
        ctx.font = "bold 13px Arial";
        ctx.fillText("✉️ Личное сообщение", a1.x + a1.w / 2, a1.y + a1.h / 2);

        roundedRect(a2.x, a2.y, a2.w, a2.h, 8);
        ctx.fillStyle = "rgba(255,255,255,0.07)";
        ctx.fill();
        ctx.strokeStyle = UI.border;
        ctx.stroke();
        ctx.fillStyle = UI.text;
        ctx.fillText("👤 Открыть профиль", a2.x + a2.w / 2, a2.y + a2.h / 2);
    } else {
        ctx.fillStyle = UI.purple;
        ctx.font = "bold 13px Arial";
        ctx.fillText("↪ Ответить", x + w / 2, y + h / 2);
    }

    ctx.restore();
}

function handleChatClick(mx, my) {
    if (!isAuthenticated) return false;

    if (chatContextMenu?.bounds) {
        const b = chatContextMenu.bounds;
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
            if (chatContextMenu.type === "nick") {
                for (const action of chatContextMenu.actions || []) {
                    if (mx >= action.x && mx <= action.x + action.w && my >= action.y && my <= action.y + action.h) {
                        if (action.type === "private") {
                            selectPrivateContact({ playerId: chatContextMenu.playerId, name: chatContextMenu.name || "Игрок" });
                            chatContextMenu = null;
                            ensureChatInput().focus();
                            return true;
                        }
                        if (action.type === "profile") {
                            profileOpen = true;
                            profileScroll = 0;
                            profileLoading = true;
                            socket.emit("requestProfile", { playerId: chatContextMenu.playerId });
                            chatContextMenu = null;
                            return true;
                        }
                    }
                }
            } else {
                chatReplyTo = chatContextMenu.message;
                chatContextMenu = null;
                ensureChatInput().focus();
                return true;
            }
        }
        chatContextMenu = null;
    }

    if (chatMode === "hidden") {
        if (mx >= chatBounds.x && mx <= chatBounds.x + chatBounds.w && my >= chatBounds.y && my <= chatBounds.y + chatBounds.h) {
            setChatMode("compact");
            return true;
        }
        return false;
    }

    if (chatChannel === "private" && chatMode !== "hidden") {
        const tb = chatPrivateToggleButton;
        if (tb && tb.w && mx >= tb.x && mx <= tb.x + tb.w && my >= tb.y && my <= tb.y + tb.h) {
            chatPrivateListOpen = !chatPrivateListOpen;
            return true;
        }
        for (const h of chatPrivateListHitboxes) {
            if (mx >= h.x && mx <= h.x + h.w && my >= h.y && my <= h.y + h.h) {
                selectPrivateContact(h);
                return true;
            }
        }
    }

    if (mx < chatBounds.x || mx > chatBounds.x + chatBounds.w || my < chatBounds.y || my > chatBounds.y + chatBounds.h) return false;

    for (const b of chatButtons) {
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
            if (b.type === "mode") setChatMode(b.value);
            if (b.type === "channel") {
                chatChannel = b.value;
                if (b.value === "private" && chatMode !== "hidden") chatPrivateListOpen = true;
                chatAutoScrollPending = true;
            }
            if (b.type === "replyCancel") chatReplyTo = null;
            if (b.type === "privateCancel") chatPrivateTarget = null;
            return true;
        }
    }

    // Клик по нику открывает меню: личное сообщение или профиль.
    for (let i = chatMessageHitboxes.length - 1; i >= 0; i--) {
        const h = chatMessageHitboxes[i];
        if (h.type === "profile" && h.playerId && mx >= h.x && mx <= h.x + h.w && my >= h.y && my <= h.y + h.h) {
            chatContextMenu = { type: "nick", x: mx, y: my, playerId: h.playerId, name: h.name || "Игрок" };
            return true;
        }
    }

    // Клик по остальной области сообщения открывает меню ответа.
    for (let i = chatMessageHitboxes.length - 1; i >= 0; i--) {
        const h = chatMessageHitboxes[i];
        if (h.type === "message" && mx >= h.x && mx <= h.x + h.w && my >= h.y && my <= h.y + h.h) {
            chatContextMenu = { x: mx, y: my, message: h.message };
            return true;
        }
    }

    return true;
}

// ===============================
// 🎒 INVENTORY UI — СТИЛЬ LIFE CITY HUD
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
function cleanAuthLoginInput(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9_\-.@]/g, "").slice(0, 18);
}

function cleanAuthPasswordInput(value) {
    return String(value || "").replace(/[^A-Za-z0-9_\-.!@#$%^&*+=?]/g, "").slice(0, 24);
}

function cleanAuthNicknameInput(value) {
    return String(value || "")
        .replace(/[^A-Za-zА-Яа-яЁё0-9 _\-.!@#$%^&*+=?]/g, "")
        .slice(0, 16);
}

function setAuthMode(mode) {
    authMode = mode === "register" ? "register" : "login";
    authMessage = "";
    authFocus = authMode === "register" ? "nickname" : "login";
    syncAuthToDom();
    setTimeout(() => {
        const el = authDom[authFocus];
        if (el && el.style.display !== "none") el.focus();
    }, 0);
}

function submitAuth(mode = authMode) {
    tryStartGameMusic();
    syncAuthFromDom();
    const login = cleanAuthLoginInput(authLogin.trim());
    const password = cleanAuthPasswordInput(authPassword.trim());
    const passwordRepeat = cleanAuthPasswordInput(authPasswordRepeat.trim());
    const nickname = cleanAuthNicknameInput(authNickname.trim());

    authLogin = login;
    authPassword = password;
    authPasswordRepeat = passwordRepeat;
    authNickname = nickname;

    if (login.length < 3 || password.length < 3) {
        authMessage = "Логин и пароль минимум 3 символа";
        authFocus = login.length < 3 ? "login" : "password";
        return;
    }

    if (mode === "register") {
        if (nickname.length < 2) {
            authMessage = "Ник минимум 2 символа";
            authFocus = "nickname";
            return;
        }

        if (password !== passwordRepeat) {
            authMessage = "Пароли не совпадают";
            authFocus = "passwordRepeat";
            return;
        }
    }

    authMode = mode;
    saveAuthSettings(login, password);

    socket.emit(mode === "register" ? "register" : "login", {
        login,
        password,
        passwordRepeat,
        nickname
    });

    authMessage = mode === "register" ? "Создаём персонажа..." : "Входим...";
}

function getAuthFocusOrder() {
    return authMode === "register"
        ? ["nickname", "login", "password", "passwordRepeat"]
        : ["login", "password"];
}

function handleAuthKey(e) {
    const key = e.key;

    if (key === "Tab") {
        e.preventDefault();
        const order = getAuthFocusOrder();
        const index = Math.max(0, order.indexOf(authFocus));
        authFocus = order[(index + 1) % order.length];
        return;
    }

    if (key === "Enter") {
        submitAuth(authMode);
        return;
    }

    if (key === "Backspace") {
        if (authFocus === "nickname") authNickname = authNickname.slice(0, -1);
        if (authFocus === "login") authLogin = authLogin.slice(0, -1);
        if (authFocus === "password") authPassword = authPassword.slice(0, -1);
        if (authFocus === "passwordRepeat") authPasswordRepeat = authPasswordRepeat.slice(0, -1);
        syncAuthToDom();
        return;
    }

    if (key.length === 1) {
        if (authFocus === "nickname") authNickname = cleanAuthNicknameInput(authNickname + key);
        if (authFocus === "login") authLogin = cleanAuthLoginInput(authLogin + key);
        if (authFocus === "password") authPassword = cleanAuthPasswordInput(authPassword + key);
        if (authFocus === "passwordRepeat") authPasswordRepeat = cleanAuthPasswordInput(authPasswordRepeat + key);
        syncAuthToDom();
    }
}

function pointInButton(mx, my, button) {
    return button && mx >= button.x && mx <= button.x + button.w && my >= button.y && my <= button.y + button.h;
}

function handleAuthClick(mx, my) {
    const b = authButtons;

    if (authMode === "register" && pointInButton(mx, my, b.nicknameInput)) {
        authFocus = "nickname";
        syncAuthToDom();
        if (authDom.nickname) authDom.nickname.focus();
        return;
    }

    if (pointInButton(mx, my, b.loginInput)) {
        authFocus = "login";
        syncAuthToDom();
        if (authDom.login) authDom.login.focus();
        return;
    }

    if (pointInButton(mx, my, b.passwordInput)) {
        authFocus = "password";
        syncAuthToDom();
        if (authDom.password) authDom.password.focus();
        return;
    }

    if (authMode === "register" && pointInButton(mx, my, b.passwordRepeatInput)) {
        authFocus = "passwordRepeat";
        syncAuthToDom();
        if (authDom.passwordRepeat) authDom.passwordRepeat.focus();
        return;
    }

    if (pointInButton(mx, my, b.rememberLogin)) {
        syncAuthFromDom();
        authRememberLogin = !authRememberLogin;
        if (!authRememberLogin) authRememberPassword = false;
        saveAuthSettings(authLogin.trim(), authPassword.trim());
        return;
    }

    if (pointInButton(mx, my, b.rememberPassword)) {
        syncAuthFromDom();
        authRememberPassword = !authRememberPassword;
        if (authRememberPassword) authRememberLogin = true;
        saveAuthSettings(authLogin.trim(), authPassword.trim());
        return;
    }

    if (pointInButton(mx, my, b.showPassword)) {
        authShowPassword = !authShowPassword;
        syncAuthToDom();
        return;
    }

    if (pointInButton(mx, my, b.login)) {
        if (authMode !== "login") setAuthMode("login");
        else submitAuth("login");
        return;
    }

    if (pointInButton(mx, my, b.register)) {
        if (authMode !== "register") setAuthMode("register");
        else submitAuth("register");
    }
}


function isAuthDomTarget(target) {
    return !!(target && target.classList && (target.classList.contains("lifecity-auth-input") || target.classList.contains("lifecity-auth-button")));
}

function getAuthDomValue(field) {
    const el = authDom[field];
    return el ? el.value : "";
}

function syncAuthFromDom() {
    if (!authDomReady) return;

    if (authDom.nickname) authNickname = cleanAuthNicknameInput(authDom.nickname.value);
    if (authDom.login) authLogin = cleanAuthLoginInput(authDom.login.value);
    if (authDom.password) authPassword = cleanAuthPasswordInput(authDom.password.value);
    if (authDom.passwordRepeat) authPasswordRepeat = cleanAuthPasswordInput(authDom.passwordRepeat.value);
}

function syncAuthToDom() {
    if (!authDomReady) return;

    if (authDom.nickname && authDom.nickname.value !== authNickname) authDom.nickname.value = authNickname;
    if (authDom.login && authDom.login.value !== authLogin) authDom.login.value = authLogin;
    if (authDom.password && authDom.password.value !== authPassword) authDom.password.value = authPassword;
    if (authDom.passwordRepeat && authDom.passwordRepeat.value !== authPasswordRepeat) authDom.passwordRepeat.value = authPasswordRepeat;

    const passwordType = authShowPassword ? "text" : "password";
    if (authDom.password) authDom.password.type = passwordType;
    if (authDom.passwordRepeat) authDom.passwordRepeat.type = passwordType;
}


function createAuthButtonElement(type) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lifecity-auth-button";
    btn.dataset.type = type;
    btn.style.position = "fixed";
    btn.style.zIndex = 10050;
    btn.style.pointerEvents = "auto";
    btn.style.touchAction = "manipulation";
    btn.style.boxSizing = "border-box";
    btn.style.borderRadius = "14px";
    btn.style.border = "1px solid rgba(185,235,255,0.48)";
    btn.style.color = "#f7fbff";
    btn.style.font = "900 16px Segoe UI, Trebuchet MS, Arial, sans-serif";
    btn.style.letterSpacing = "0.45px";
    btn.style.textTransform = "none";
    btn.style.cursor = "pointer";
    btn.style.userSelect = "none";
    btn.style.overflow = "hidden";
    btn.style.boxShadow = "0 12px 28px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.24), 0 0 22px rgba(88,199,255,0.18)";
    btn.style.backdropFilter = "blur(10px)";
    btn.addEventListener("pointerdown", (e) => {
        btn.classList.add("is-pressed");
        e.stopPropagation();
    });
    btn.addEventListener("pointerup", () => btn.classList.remove("is-pressed"));
    btn.addEventListener("pointerleave", () => btn.classList.remove("is-pressed"));
    btn.addEventListener("mousedown", (e) => {
        e.stopPropagation();
    });
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        tryStartGameMusic();
        syncAuthFromDom();
        if (type === "login") {
            if (authMode !== "login") setAuthMode("login");
            else submitAuth("login");
        }
        if (type === "register") {
            if (authMode !== "register") setAuthMode("register");
            else submitAuth("register");
        }
    });
    document.body.appendChild(btn);
    return btn;
}

function createAuthInputElement(field) {
    const el = document.createElement("input");
    el.className = "lifecity-auth-input";
    el.autocomplete = "off";
    el.spellcheck = false;
    el.dataset.field = field;
    el.style.position = "fixed";
    el.style.zIndex = 10040;
    el.style.pointerEvents = "auto";
    el.style.boxSizing = "border-box";
    el.style.borderRadius = "14px";
    el.style.border = "0";
    el.style.background = "transparent";
    el.style.backgroundSize = "auto";
    el.style.color = "#f7fbff";
    el.style.outline = "none";
    el.style.font = "800 18px Segoe UI, Trebuchet MS, Arial, sans-serif";
    el.style.padding = "25px 18px 6px 18px";
    el.style.caretColor = "#78dcff";
    el.style.boxShadow = "none";
    el.style.transition = "filter .18s ease";

    el.addEventListener("focus", () => {
        authFocus = field;
        el.style.border = "2px solid #8fe7ff";
        el.style.boxShadow = "0 0 24px rgba(88,199,255,0.30), 0 0 40px rgba(88,199,255,0.10), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 0 20px rgba(88,199,255,0.14)";
        el.style.filter = "brightness(1.08)";
    });

    el.addEventListener("blur", () => {
        el.style.border = "0";
        el.style.boxShadow = "none";
        el.style.filter = "brightness(1)";
    });

    el.addEventListener("input", () => {
        const start = el.selectionStart;
        const end = el.selectionEnd;

        if (field === "nickname") el.value = cleanAuthNicknameInput(el.value);
        if (field === "login") el.value = cleanAuthLoginInput(el.value);
        if (field === "password" || field === "passwordRepeat") el.value = cleanAuthPasswordInput(el.value);

        try {
            const pos = Math.min(el.value.length, start ?? el.value.length);
            el.setSelectionRange(Math.min(pos, el.value.length), Math.min(end ?? pos, el.value.length));
        } catch (_) {}

        syncAuthFromDom();
    });

    // Нативные copy/cut/paste/select работают сами, включая Ctrl+C/X/V и меню мыши.
    document.body.appendChild(el);
    return el;
}

function ensureAuthDom() {
    if (authDomReady) return;

    const style = document.createElement("style");
    style.textContent = `
        @keyframes lcHudButtonShine {
            0%, 22% { transform: translateX(-135%) skewX(-18deg); opacity: 0; }
            38% { opacity: .52; }
            58% { transform: translateX(145%) skewX(-18deg); opacity: 0; }
            100% { transform: translateX(145%) skewX(-18deg); opacity: 0; }
        }

        .lifecity-auth-input,
        .lifecity-auth-input:focus,
        .lifecity-auth-input:hover,
        .lifecity-auth-input:active,
        .lifecity-auth-input:-webkit-autofill,
        .lifecity-auth-input:-webkit-autofill:hover,
        .lifecity-auth-input:-webkit-autofill:focus,
        .lifecity-auth-input:-webkit-autofill:active {
            background: transparent !important;
            border: 0 !important;
            outline: 0 !important;
            box-shadow: none !important;
            font-family: "Segoe UI", "Trebuchet MS", Arial, sans-serif !important;
            font-size: 18px !important;
            font-weight: 800 !important;
            line-height: 20px !important;
            letter-spacing: .25px !important;
            color: #f8fdff !important;
            -webkit-text-fill-color: #f8fdff !important;
            caret-color: #86e4ff !important;
            text-shadow: 0 0 10px rgba(80,190,255,.25), 0 1px 2px rgba(0,0,0,.45) !important;
            appearance: none !important;
            -webkit-appearance: none !important;
        }
        .lifecity-auth-input:-webkit-autofill,
        .lifecity-auth-input:-webkit-autofill:hover,
        .lifecity-auth-input:-webkit-autofill:focus,
        .lifecity-auth-input:-webkit-autofill:active {
            transition: background-color 999999s ease-in-out 0s, color 999999s ease-in-out 0s !important;
            -webkit-background-clip: text !important;
            background-clip: text !important;
        }
        .lifecity-auth-input::selection { background: rgba(88,199,255,.45); color: #ffffff; }
        .lifecity-auth-input::-moz-selection { background: rgba(88,199,255,.45); color: #ffffff; }

        .lifecity-auth-button {
            position: fixed !important;
            isolation: isolate !important;
            overflow: hidden !important;
            color: #f8fdff !important;
            -webkit-text-fill-color: #f8fdff !important;
            font-family: "Segoe UI", "Trebuchet MS", Arial, sans-serif !important;
            font-size: 16px !important;
            font-weight: 900 !important;
            letter-spacing: .45px !important;
            text-transform: none !important;
            text-shadow: 0 0 10px rgba(150,230,255,.44), 0 1px 2px rgba(0,0,0,.45) !important;
            background-size: 180% 180% !important;
            transition: transform .12s ease, filter .18s ease, box-shadow .18s ease, border-color .18s ease !important;
        }
        .lifecity-auth-button::before {
            content: "";
            position: absolute;
            top: -45%;
            bottom: -45%;
            left: -32%;
            width: 34%;
            z-index: -1;
            pointer-events: none;
            background: linear-gradient(105deg, transparent 0%, rgba(255,255,255,.08) 30%, rgba(210,250,255,.40) 50%, rgba(255,255,255,.10) 64%, transparent 100%);
            animation: lcHudButtonShine 4.4s ease-in-out infinite;
        }
        .lifecity-auth-button:hover {
            transform: translateY(-1px) !important;
            filter: brightness(1.12) saturate(1.08) !important;
            border-color: rgba(220,248,255,.82) !important;
            box-shadow: 0 14px 30px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.28), 0 0 30px rgba(84,196,255,.28) !important;
        }
        .lifecity-auth-button.is-pressed,
        .lifecity-auth-button:active {
            transform: translateY(2px) scale(.985) !important;
            filter: brightness(.92) !important;
            box-shadow: 0 7px 16px rgba(0,0,0,.38), inset 0 3px 10px rgba(0,0,0,.30), 0 0 15px rgba(88,199,255,.12) !important;
        }
    `;
    document.head.appendChild(style);

    authDom.nickname = createAuthInputElement("nickname");
    authDom.login = createAuthInputElement("login");
    authDom.password = createAuthInputElement("password");
    authDom.passwordRepeat = createAuthInputElement("passwordRepeat");
    authDom.loginButton = createAuthButtonElement("login");
    authDom.registerButton = createAuthButtonElement("register");

    authDomReady = true;
    syncAuthToDom();
}

function hideAuthDom() {
    if (!authDomReady) return;
    for (const key of Object.keys(authDom)) {
        if (authDom[key]) authDom[key].style.display = "none";
    }
}

function positionAuthDomInput(field, rect, visible) {
    const el = authDom[field];
    if (!el) return;

    if (!visible) {
        el.style.display = "none";
        return;
    }

    el.style.display = "block";
    el.style.left = rect.x + "px";
    el.style.top = rect.y + "px";
    el.style.width = rect.w + "px";
    el.style.height = rect.h + "px";
    el.type = (field === "password" || field === "passwordRepeat") && !authShowPassword ? "password" : "text";
    el.placeholder = "";
}


function positionAuthDomButton(type, rect, text, color, active) {
    const btn = type === "login" ? authDom.loginButton : authDom.registerButton;
    if (!btn) return;
    btn.style.display = isAuthenticated ? "none" : "block";
    btn.style.left = rect.x + "px";
    btn.style.top = rect.y + "px";
    btn.style.width = rect.w + "px";
    btn.style.height = rect.h + "px";
    btn.textContent = text;
    const activeGlow = active ? "rgba(88,199,255,0.30)" : "rgba(88,199,255,0.14)";
    btn.style.background = active
        ? "radial-gradient(circle at 24% 0%, rgba(255,255,255,0.22), transparent 35%), linear-gradient(135deg, rgba(93,190,245,0.92), rgba(46,132,207,0.88))"
        : "radial-gradient(circle at 78% 0%, rgba(255,255,255,0.16), transparent 36%), linear-gradient(135deg, rgba(68,142,206,0.78), rgba(38,88,148,0.74))";
    btn.style.borderColor = active ? "rgba(210,246,255,0.72)" : "rgba(170,225,255,0.44)";
    btn.style.boxShadow = `0 12px 28px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 24px ${activeGlow}`;
}

function drawAuthInputLabel(x, y, label, focused) {
    ctx.save();
    ctx.fillStyle = focused ? "#ffffff" : "#f1fbff";
    ctx.shadowColor = focused ? "rgba(88,199,255,0.85)" : "rgba(88,199,255,0.42)";
    ctx.shadowBlur = focused ? 14 : 8;
    ctx.font = "800 14px Segoe UI, Trebuchet MS, Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(label.toUpperCase(), x + 15, y + 17);
    ctx.restore();
}

function drawAuthCheckbox(button, label, checked) {
    ctx.save();
    const box = 18;

    roundedRect(button.x, button.y, box, box, 5);
    ctx.fillStyle = checked ? "rgba(88,199,255,0.20)" : "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.strokeStyle = checked ? UI.blue : UI.border;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    if (checked) {
        ctx.strokeStyle = UI.green;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(button.x + 4, button.y + 9);
        ctx.lineTo(button.x + 8, button.y + 13);
        ctx.lineTo(button.x + 15, button.y + 5);
        ctx.stroke();
    }

    ctx.fillStyle = "#f2fbff";
    ctx.shadowColor = "rgba(88,199,255,0.35)";
    ctx.shadowBlur = 7;
    ctx.font = "800 16px Segoe UI, Trebuchet MS, Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, button.x + 26, button.y + box / 2 + 1);
    ctx.restore();
}

function drawAuthInput(x, y, w, h, label, value, focused, isPassword = false) {
    try { const a = Array.from(arguments); drawLifeCityAuthHudInput(a[0], a[1], a[2], a[3], !!a[4]); } catch(e) {}

    ctx.save();
    roundedRect(x, y, w, h, 12);
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "rgba(74,112,142,0.46)");
    g.addColorStop(0.48, "rgba(42,76,104,0.42)");
    g.addColorStop(1, "rgba(22,50,78,0.46)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = focused ? "rgba(220,248,255,0.92)" : "rgba(172,225,255,0.42)";
    ctx.lineWidth = focused ? 2 : 1.2;
    ctx.stroke();
    ctx.restore();

    drawAuthInputLabel(x, y, label, focused);
}

function drawAuthScreen() {
    const LIFE_CITY_OLD_DRAW_AUTH_SCREEN_DISABLED = true;
    // Старое canvas-окно авторизации не рисуем: работает только чистый DOM-слой #lc-auth-root.
    // Погодный auth FX рисуется один раз в основном draw(), выше HUD.
    try { lcCreateAuthWindow(); lcUpdateAuthWindowVisibility(); } catch(e) {}
}


