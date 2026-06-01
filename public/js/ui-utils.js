// ===============================
// 🎛️ UI UTILS — общие helper-функции HUD/панелей/текста
// ===============================
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

