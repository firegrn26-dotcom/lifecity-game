// ===============================
// 💬 UI CHAT — чат, личные сообщения, контакты
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
