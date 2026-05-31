// ===============================
// 🎚️ LIFE CITY 2.5D STAGE 3 — ГЛУБИНА, ПЕРСОНАЖ, КАМЕРА
// ===============================
const CAMERA_25D = {
    smooth: 0.105,
    lookAhead: 72,
    verticalOffset: 34,
    maxStep: 80
};

function getWorldBounds25D() {
    const xs = [];
    const ys = [];
    for (const b of buildings || []) {
        xs.push(b.x, b.x + b.w);
        ys.push(b.y, b.y + b.h);
    }
    for (const r of roads || []) {
        for (const pt of r.points || []) {
            xs.push(pt.x);
            ys.push(pt.y);
        }
    }
    if (!xs.length || !ys.length) return { minX: -500, minY: -500, maxX: 2600, maxY: 1900 };
    return {
        minX: Math.min(...xs) - 420,
        minY: Math.min(...ys) - 420,
        maxX: Math.max(...xs) + 420,
        maxY: Math.max(...ys) + 420
    };
}

function clampCamera25D(targetX, targetY) {
    const bounds = getWorldBounds25D();
    const minX = bounds.minX;
    const minY = bounds.minY;
    const maxX = Math.max(minX, bounds.maxX - canvas.width);
    const maxY = Math.max(minY, bounds.maxY - canvas.height);
    return {
        x: clamp(targetX, minX, maxX),
        y: clamp(targetY, minY, maxY)
    };
}

function getPlayerDepth25D(p) {
    return (p.y || 0) + PLAYER_SIZE + 10;
}

function getBuildingDepth25D(b) {
    const heightLift = Math.min(76, Math.max(24, (b.h || 80) * 0.22));
    return (b.y || 0) + (b.h || 0) + heightLift * 0.18;
}

function getTrashDepth25D(t) {
    return (t.y || 0) + 8;
}

function drawCharacterGroundShadow25D(player, options = {}) {
    const cx = player.x + PLAYER_SIZE / 2 - camera.x;
    const cy = player.y + PLAYER_SIZE / 2 - camera.y;
    const isLocal = !!options.isLocal;
    const speed = getVectorLength(player.velX || 0, player.velY || 0);
    const stretch = clamp(speed / (player.maxSpeed || 2.45), 0, 1);

    ctx.save();
    ctx.translate(cx + 2, cy + 13);
    ctx.rotate(0.08);
    const shadow = ctx.createRadialGradient(0, 0, 1, 0, 0, 22);
    shadow.addColorStop(0, isLocal ? "rgba(0,0,0,0.38)" : "rgba(0,0,0,0.30)");
    shadow.addColorStop(0.72, "rgba(0,0,0,0.16)");
    shadow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16 + stretch * 4, 7 + stretch * 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawTrashItem25D(id, t) {
    const nowMs = Date.now();
    const cleaningStartedAt = Number(t.cleaningStartedAt) || nowMs;
    const cleaningUntil = Number(t.cleaningUntil) || 0;
    const cleaningActive = cleaningUntil > nowMs;
    const cleanProgress = cleaningActive
        ? clamp((nowMs - cleaningStartedAt) / Math.max(1, cleaningUntil - cleaningStartedAt), 0, 1)
        : 0;
    const trashAlpha = cleaningActive ? Math.max(0.12, 1 - cleanProgress * 0.88) : 1;
    const trashScale = cleaningActive ? Math.max(0.45, 1 - cleanProgress * 0.48) : 1;

    ctx.save();
    ctx.globalAlpha = trashAlpha;
    ctx.translate(t.x - camera.x, t.y - camera.y);
    ctx.scale(trashScale, trashScale);

    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(1.5, 5.5, 9, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = cleaningActive ? "#6f6f6f" : "#7a7a7a";
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#bdbdbd";
    ctx.beginPath();
    ctx.arc(-3, -2, 3, 0, Math.PI * 2);
    ctx.fill();

    if (cleaningActive) {
        ctx.strokeStyle = "rgba(255,195,51,0.65)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cleanProgress);
        ctx.stroke();
    }

    ctx.restore();

    if (isDevOptionOn("showTrashIds")) {
        ctx.fillStyle = UI.yellow;
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(id, t.x - camera.x, t.y - camera.y - 12);
    }
}

function drawWorldEntity25D(item) {
    if (item.kind === "building") {
        drawStyledBuilding(item.data);
        return;
    }
    if (item.kind === "trash") {
        drawTrashItem25D(item.id, item.data);
        return;
    }
    if (item.kind === "player") {
        drawCharacterGroundShadow25D(item.data, { isLocal: item.isLocal });
        drawHumanCharacter(item.data, { isLocal: item.isLocal });
        if (isDevOptionOn("showPlayerHitboxes")) {
            ctx.strokeStyle = UI.yellow;
            ctx.lineWidth = 1.2;
            ctx.strokeRect(item.data.x - camera.x, item.data.y - camera.y, PLAYER_SIZE, PLAYER_SIZE);
        }
    }
}

function drawDepthSortedWorld25D() {
    const items = [];

    for (const b of buildings) {
        items.push({ kind: "building", data: b, depth: getBuildingDepth25D(b), x: b.x || 0 });
    }

    for (const id in trashItems) {
        const t = trashItems[id];
        items.push({ kind: "trash", id, data: t, depth: getTrashDepth25D(t), x: t.x || 0 });
    }

    for (const id in players) {
        if (id === myId) continue;
        const p = players[id];
        items.push({ kind: "player", id, data: p, isLocal: false, depth: getPlayerDepth25D(p), x: p.x || 0 });
    }

    items.push({ kind: "player", id: "local", data: myPlayer, isLocal: true, depth: getPlayerDepth25D(myPlayer), x: myPlayer.x || 0 });

    items.sort((a, b) => (a.depth - b.depth) || (a.x - b.x));

    for (const item of items) drawWorldEntity25D(item);
}

function drawDepthDebug25D() {
    if (!isDevOptionOn("showPlayerHitboxes")) return;
    ctx.save();
    ctx.fillStyle = "rgba(255,195,51,0.86)";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText("depth", myPlayer.x + PLAYER_SIZE / 2 - camera.x, myPlayer.y + PLAYER_SIZE + 24 - camera.y);
    ctx.restore();
}

// ===============================
// 🎨 РЕНДЕР
// ===============================
function draw() {

    // фон (ОБЯЗАТЕЛЬНО ПЕРВЫМ)
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // районы
if (isDevOptionOn("showDistricts")) {
for (let d of districts) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.fillRect(
        d.x - camera.x,
        d.y - camera.y,
        d.w,
        d.h
    );

    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(
        d.x - camera.x,
        d.y - camera.y,
        d.w,
        d.h
    );

    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.font = "bold 18px Arial";
    ctx.fillText(
        d.name,
        d.x - camera.x + 15,
        d.y - camera.y + 28
    );
}
}

    // мегаполис: дороги, тротуары, парки и разметка
    drawMegaCityRoads();
    drawRoadDebug();


 // названия улиц на самих дорогах
if (isDevOptionOn("showStreetNames")) {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.50)";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let r of roads) {
        if (!r.name || r.points.length < 2) continue;
        const midIndex = Math.floor((r.points.length - 1) / 2);
        const a = r.points[midIndex];
        const b = r.points[midIndex + 1];
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const x = (a.x + b.x) / 2 - camera.x;
        const y = (a.y + b.y) / 2 - camera.y;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillText(r.name, 0, 0);
        ctx.restore();
    }
    ctx.restore();
}

// ===============================
// 🗺 СЕТКА + ПОДПИСИ (DEV)
// ===============================
if (isDevOptionOn("showGrid")) {

const gridSize = 100;
const labelStep = 100;

const left = camera.x;
const right = camera.x + canvas.width;
const top = camera.y;
const bottom = camera.y + canvas.height;

const padding = 200;

// ===============================
// 🟩 СЕТКА
// ===============================

const startX = Math.floor((left - padding) / gridSize) * gridSize;
const endX = Math.ceil((right + padding) / gridSize) * gridSize;

const startY = Math.floor((top - padding) / gridSize) * gridSize;
const endY = Math.ceil((bottom + padding) / gridSize) * gridSize;

ctx.strokeStyle = "#555";
ctx.lineWidth = 1;

// вертикальные линии
for (let x = startX; x <= endX; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x - camera.x, 0);
    ctx.lineTo(x - camera.x, canvas.height);
    ctx.stroke();
}

// горизонтальные линии
for (let y = startY; y <= endY; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y - camera.y);
    ctx.lineTo(canvas.width, y - camera.y);
    ctx.stroke();
}

// ===============================
// 🔢 ПОДПИСИ (OPTIMIZED)
// ===============================

const labelStartX = Math.floor((left - padding) / labelStep) * labelStep;
const labelEndX = Math.ceil((right + padding) / labelStep) * labelStep;

const labelStartY = Math.floor((top - padding) / labelStep) * labelStep;
const labelEndY = Math.ceil((bottom + padding) / labelStep) * labelStep;

ctx.fillStyle = "#888";
ctx.font = "12px Arial";

// X подписи
for (let x = labelStartX; x <= labelEndX; x += labelStep) {

    const screenX = x - camera.x;

    if (screenX < -50 || screenX > canvas.width + 50) continue;

    ctx.fillText(
        x,
        screenX + 5,
        15
    );
}

// Y подписи
for (let y = labelStartY; y <= labelEndY; y += labelStep) {

    const screenY = y - camera.y;

    if (screenY < -50 || screenY > canvas.height + 50) continue;

    ctx.fillText(
        y,
        5,
        screenY - 5
    );
}

}

    // промышленные зоны под зданиями — рисуются отдельно, чтобы завод точно был включён на карте
const activeRecyclingFactory = ensureRecyclingFactoryOnMap();
drawRecyclingFactoryMapZone(activeRecyclingFactory);

    // Единый 2.5D depth-слой: здания, мусор и игроки рисуются в одном порядке.
    // Теперь персонаж частично/полностью уходит за здание, если его Y-глубина дальше фасада.
    drawDepthSortedWorld25D();
    drawDepthDebug25D();

// Если завод сейчас за экраном, показываем направление к нему.
drawRecyclingFactoryScreenMarker(activeRecyclingFactory);

nearbyTrash = getNearbyTrash();
drawTrashActionPanel();

// ===============================
// 🌃 АТМОСФЕРА V2 ТОЛЬКО НА МИРЕ
// ===============================
// Важно: эффекты дождя, дымки и cinematic overlay рисуются ДО HUD,
// чтобы интерфейс не выглядел темным/задымленным.
drawVisualOverhaulV2Screen();

// Погодный слой авторизации плавно исчезает после входа.
if (authWeatherFX.alpha > 0.01) drawAuthWeatherFX();

// ===============================
// 🧩 ЕДИНЫЙ MODERN HUD
// ===============================
// На экране авторизации скрываем весь игровой HUD.
// Музыкальная панель не входит в canvas-HUD и остаётся видимой через DOM.
const hudTargetAlpha = isAuthenticated ? 1 : 0;
gameplayHudAlpha += (hudTargetAlpha - gameplayHudAlpha) * 0.075;
if (gameplayHudAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha *= gameplayHudAlpha;
    drawChatPanel();
    drawJobHintPanel();
    drawDevMenuPanel();
    drawDevCoordinatesPanel();
    drawModernHUD();
    drawInventoryButton();
    drawProfileButton();
    drawInventoryPanel();
    drawProfilePanel();
    drawShopPanel();
    drawAvatarEditorPanel();
    drawInventoryNotice();
    ctx.restore();
}

drawAuthScreen();

}
function updateCamera() {

    const vx = Number(myPlayer.velX) || 0;
    const vy = Number(myPlayer.velY) || 0;
    const speed = getVectorLength(vx, vy);
    const nx = speed > 0.05 ? vx / speed : Math.cos(myPlayer.angle || -Math.PI / 2);
    const ny = speed > 0.05 ? vy / speed : Math.sin(myPlayer.angle || -Math.PI / 2);

    // Камера смотрит чуть вперед по движению и немного выше персонажа — так город читается объемнее.
    const rawTargetX = myPlayer.x + PLAYER_SIZE / 2 + nx * CAMERA_25D.lookAhead - canvas.width / 2;
    const rawTargetY = myPlayer.y + PLAYER_SIZE / 2 + ny * CAMERA_25D.lookAhead - canvas.height / 2 - CAMERA_25D.verticalOffset;
    const target = clampCamera25D(rawTargetX, rawTargetY);

    const dx = target.x - camera.x;
    const dy = target.y - camera.y;
    const limitedDx = clamp(dx * CAMERA_25D.smooth, -CAMERA_25D.maxStep, CAMERA_25D.maxStep);
    const limitedDy = clamp(dy * CAMERA_25D.smooth, -CAMERA_25D.maxStep, CAMERA_25D.maxStep);

    camera.x += limitedDx;
    camera.y += limitedDy;
}
// ===============================
// 🔄 LOOP
// ===============================
function loop() {

    if (isAuthenticated) {
        updateMovement();
        updateRemotePlayers();
        updateCamera();
    } else {
        updateAuthCameraFlight();
    }

    draw();

    requestAnimationFrame(loop);
}


loop();


// ==========================================================
// LifeCity Clean DOM Auth Window Rewrite
// Old canvas auth UI is disabled visually; city/camera/weather remain.
// ==========================================================
const LIFE_CITY_AUTH_REWRITE = true;
const AUTH_CAMERA_REWRITE_SHIFT_X = -1450;
const AUTH_CAMERA_REWRITE_SHIFT_Y = -520;

function lcGet(id) {
    return document.getElementById(id);
}

function lcFirstExisting(ids) {
    for (const id of ids) {
        const el = document.getElementById(id);
        if (el) return el;
    }
    return null;
}

function lcAuthReadValues() {
    return {
        login: (lcGet("lcLoginInput")?.value || "").trim(),
        password: lcGet("lcPasswordInput")?.value || "",
        nick: (lcGet("lcNickInput")?.value || "").trim(),
        repeat: lcGet("lcRepeatPasswordInput")?.value || "",
        saveLogin: !!lcGet("lcSaveLogin")?.checked,
        savePassword: !!lcGet("lcSavePassword")?.checked
    };
}

function lcAuthSetError(text) {
    const el = lcGet("lcAuthError");
    if (el) el.textContent = text || "";
}

function lcSyncAuthToLegacyFields() {
    const v = lcAuthReadValues();
    const loginTargets = ["loginInput", "authLoginInput", "usernameInput", "login", "username"];
    const passTargets = ["passwordInput", "authPasswordInput", "passInput", "password"];
    const nickTargets = ["nickInput", "nicknameInput", "characterNameInput", "registerNickInput"];
    const repeatTargets = ["repeatPasswordInput", "passwordRepeatInput", "confirmPasswordInput", "registerRepeatPasswordInput"];

    for (const id of loginTargets) { const el = lcGet(id); if (el) el.value = v.login; }
    for (const id of passTargets) { const el = lcGet(id); if (el) el.value = v.password; }
    for (const id of nickTargets) { const el = lcGet(id); if (el) el.value = v.nick; }
    for (const id of repeatTargets) { const el = lcGet(id); if (el) el.value = v.repeat; }

    try {
        if (typeof loginValue !== "undefined") loginValue = v.login;
        if (typeof passwordValue !== "undefined") passwordValue = v.password;
        if (typeof nickValue !== "undefined") nickValue = v.nick;
        if (typeof repeatPasswordValue !== "undefined") repeatPasswordValue = v.repeat;
        if (typeof authLogin !== "undefined") authLogin = v.login;
        if (typeof authPassword !== "undefined") authPassword = v.password;
        if (typeof authNick !== "undefined") authNick = v.nick;
        if (typeof authRepeatPassword !== "undefined") authRepeatPassword = v.repeat;
    } catch (e) {}
}

function lcTryStartMusicFromAuth() {
    try {
        if (typeof unlockGameMusic === "function") unlockGameMusic();
        if (typeof startGameMusic === "function") startGameMusic();
        if (typeof ensureGameMusic === "function") ensureGameMusic();
        if (window.gameMusic && typeof window.gameMusic.play === "function") {
            window.gameMusic.muted = false;
            window.gameMusic.play().catch(() => {});
        }
    } catch (e) {}
}

function lcCallExistingAuth(action) {
    lcSyncAuthToLegacyFields();
    lcTryStartMusicFromAuth();

    const candidates = action === "login"
        ? ["login", "doLogin", "tryLogin", "handleLogin", "submitLogin", "authLogin", "loginPlayer"]
        : ["register", "doRegister", "tryRegister", "handleRegister", "submitRegister", "authRegister", "registerPlayer"];

    for (const name of candidates) {
        try {
            if (typeof window[name] === "function") {
                window[name]();
                return true;
            }
        } catch (e) {
            console.error("LifeCity auth function error:", name, e);
            lcAuthSetError("Ошибка авторизации. Проверь консоль.");
            return true;
        }
    }

    // Socket fallback for common LifeCity auth events.
    try {
        if (typeof socket !== "undefined" && socket && typeof socket.emit === "function") {
            const v = lcAuthReadValues();
            if (action === "login") {
                if (!v.login || !v.password) {
                    lcAuthSetError("Введите логин и пароль");
                    return true;
                }
                socket.emit("login", { login: v.login, username: v.login, password: v.password });
                socket.emit("auth:login", { login: v.login, username: v.login, password: v.password });
                return true;
            } else {
                if (!v.login || !v.password || !v.nick || !v.repeat) {
                    lcAuthSetError("Заполните все поля регистрации");
                    return true;
                }
                if (v.password !== v.repeat) {
                    lcAuthSetError("Пароли не совпадают");
                    return true;
                }
                socket.emit("register", { login: v.login, username: v.login, password: v.password, nick: v.nick, name: v.nick });
                socket.emit("auth:register", { login: v.login, username: v.login, password: v.password, nick: v.nick, name: v.nick });
                return true;
            }
        }
    } catch (e) {
        console.error("LifeCity socket auth fallback error:", e);
    }

    lcAuthSetError("Не найден обработчик авторизации");
    return false;
}

function lcHideOldAuthDomLayers() {
    const selectors = [
        "#authPanel", ".auth-panel", "#authBox", ".auth-box",
        "#loginPanel", ".login-panel", "#registerPanel", ".register-panel",
        "#authTabs", ".auth-tabs", ".auth-tab", "#authTopRight",
        "#authModeTitle", ".auth-mode-title", ".auth-duplicate-title"
    ];
    for (const sel of selectors) {
        document.querySelectorAll(sel).forEach((el) => {
            if (el.id === "lc-auth-root" || el.closest("#lc-auth-root")) return;
            el.style.display = "none";
            el.style.pointerEvents = "none";
            el.setAttribute("data-lc-auth-hidden-old", "true");
        });
    }
}


function lcAuthSetMode(mode) {
    const root = lcGet("lc-auth-root");
    if (!root) return;
    const nextMode = mode === "register" ? "register" : "login";
    root.dataset.mode = nextMode;
    lcAuthSetError("");

    const title = lcGet("lcAuthModeTitle");
    const loginBtn = lcGet("lcLoginAuthButton");
    const registerBtn = lcGet("lcRegisterAuthButton");
    const pass = lcGet("lcPasswordInput");

    if (title) title.textContent = nextMode === "register" ? "Создание персонажа" : "Вход в игру";
    // Левая кнопка всегда отвечает за вход: в режиме входа отправляет форму, в регистрации возвращает назад.
    if (loginBtn) loginBtn.textContent = nextMode === "register" ? "Вход" : "Войти";
    // Правая кнопка всегда отвечает за регистрацию: в режиме входа открывает форму, в регистрации отправляет форму.
    if (registerBtn) registerBtn.textContent = nextMode === "register" ? "Зарегистрироваться" : "Регистрация";
    if (pass) pass.autocomplete = nextMode === "register" ? "new-password" : "current-password";

    setTimeout(() => lcGet(nextMode === "register" ? "lcNickInput" : "lcLoginInput")?.focus(), 30);
}

function lcAuthSetPasswordVisible(isVisible) {
    const type = isVisible ? "text" : "password";
    ["lcPasswordInput", "lcRepeatPasswordInput"].forEach((id) => {
        const el = lcGet(id);
        if (el) el.type = type;
    });
    const a = lcGet("lcShowPasswordCheck");
    if (a) a.checked = !!isVisible;
}

function lcCreateAuthWindow() {
    if (lcGet("lc-auth-root")) return;

    lcHideOldAuthDomLayers();

    const root = document.createElement("div");
    root.id = "lc-auth-root";
    root.innerHTML = `
        <div class="lc-auth-shell">
            <div class="lc-auth-content">
                <div class="lc-auth-header">
                    <div class="lc-auth-logo">
                        <div class="lc-auth-logo-main">LIFECITY</div>
                        <div class="lc-auth-logo-sub">online city roleplay</div>
                    </div>
                    <div class="lc-auth-status">Город ждёт тебя</div>
                </div>

                <div class="lc-auth-grid">
                    <section class="lc-auth-card" data-auth-card="single">
                        <h2 class="lc-auth-card-title" id="lcAuthModeTitle">Вход в игру</h2>

                        <div class="lc-auth-field">
                            <label for="lcLoginInput">Логин</label>
                            <input id="lcLoginInput" autocomplete="username" placeholder="Введите логин">
                        </div>

                        <div class="lc-auth-field">
                            <label for="lcPasswordInput">Пароль</label>
                            <input id="lcPasswordInput" type="password" autocomplete="current-password" placeholder="Введите пароль">
                        </div>

                        <div class="lc-auth-field lc-auth-register-only">
                            <label for="lcNickInput">Ник персонажа</label>
                            <input id="lcNickInput" autocomplete="nickname" placeholder="Имя персонажа">
                        </div>

                        <div class="lc-auth-field lc-auth-register-only">
                            <label for="lcRepeatPasswordInput">Повторите пароль</label>
                            <input id="lcRepeatPasswordInput" type="password" autocomplete="new-password" placeholder="Повторите пароль">
                        </div>

                        <div class="lc-auth-options">
                            <label class="lc-auth-check"><input id="lcSaveLogin" type="checkbox">Запомнить логин</label>
                            <label class="lc-auth-check"><input id="lcSavePassword" type="checkbox">Запомнить пароль</label>
                            <label class="lc-auth-check lc-auth-show-password"><input id="lcShowPasswordCheck" type="checkbox">Показать пароль</label>
                        </div>

                        <div class="lc-auth-actions">
                            <button class="lc-auth-btn" id="lcLoginAuthButton" type="button">Войти</button>
                            <button class="lc-auth-btn" id="lcRegisterAuthButton" type="button">Регистрация</button>
                        </div>

                        <div class="lc-auth-error" id="lcAuthError"></div>
                    </section>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(root);
    root.dataset.mode = "login";
    setTimeout(() => lcAuthSetMode("login"), 0);

    const saveLoginFlag = localStorage.getItem("lifecity.saveLogin") === "1" || localStorage.getItem("lifecity_remember_login") === "1";
    const savePasswordFlag = localStorage.getItem("lifecity.savePassword") === "1" || localStorage.getItem("lifecity_remember_password") === "1";
    const savedLogin = saveLoginFlag ? (localStorage.getItem("lifecity.login") || localStorage.getItem("lcLogin") || "") : "";
    const savedPassword = savePasswordFlag ? (localStorage.getItem("lifecity.password") || localStorage.getItem("lcPassword") || "") : "";
    if (lcGet("lcSaveLogin")) lcGet("lcSaveLogin").checked = saveLoginFlag;
    if (lcGet("lcSavePassword")) lcGet("lcSavePassword").checked = savePasswordFlag;
    if (savedLogin && lcGet("lcLoginInput")) lcGet("lcLoginInput").value = savedLogin;
    if (savedPassword && lcGet("lcPasswordInput")) lcGet("lcPasswordInput").value = savedPassword;

    const syncAndMaybeSave = () => {
        lcSyncAuthToLegacyFields();
        const v = lcAuthReadValues();

        if (v.savePassword && !v.saveLogin && lcGet("lcSaveLogin")) {
            lcGet("lcSaveLogin").checked = true;
            v.saveLogin = true;
        }

        localStorage.setItem("lifecity.saveLogin", v.saveLogin ? "1" : "0");
        localStorage.setItem("lifecity.savePassword", v.savePassword ? "1" : "0");
        localStorage.setItem("lifecity_remember_login", v.saveLogin ? "1" : "0");
        localStorage.setItem("lifecity_remember_password", v.savePassword ? "1" : "0");

        if (v.saveLogin) localStorage.setItem("lifecity.login", v.login);
        else localStorage.removeItem("lifecity.login");

        if (v.savePassword) localStorage.setItem("lifecity.password", v.password);
        else localStorage.removeItem("lifecity.password");
    };

    ["lcLoginInput", "lcPasswordInput", "lcNickInput", "lcRepeatPasswordInput"].forEach((id) => {
        const el = lcGet(id);
        if (!el) return;
        el.addEventListener("input", syncAndMaybeSave);
        el.addEventListener("focus", lcTryStartMusicFromAuth);
        el.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                lcCallExistingAuth(lcGet("lc-auth-root")?.dataset?.mode === "register" ? "register" : "login");
            }
        });
    });

    lcGet("lcSaveLogin")?.addEventListener("change", syncAndMaybeSave);
    lcGet("lcSavePassword")?.addEventListener("change", syncAndMaybeSave);

    lcGet("lcShowPasswordCheck")?.addEventListener("change", (e) => lcAuthSetPasswordVisible(e.target.checked));

    lcGet("lcLoginAuthButton")?.addEventListener("click", () => {
        const mode = lcGet("lc-auth-root")?.dataset?.mode === "register" ? "register" : "login";
        if (mode === "login") lcCallExistingAuth("login");
        else lcAuthSetMode("login");
    });

    lcGet("lcRegisterAuthButton")?.addEventListener("click", () => {
        const mode = lcGet("lc-auth-root")?.dataset?.mode === "register" ? "register" : "login";
        if (mode === "register") lcCallExistingAuth("register");
        else lcAuthSetMode("register");
    });

    root.addEventListener("pointerdown", lcTryStartMusicFromAuth, { passive: true });
    syncAndMaybeSave();
}

function lcUpdateAuthWindowVisibility() {
    const root = lcGet("lc-auth-root");
    if (!root) return;
    let shouldShow = true;
    try {
        if (typeof isAuthenticated !== "undefined" && isAuthenticated) shouldShow = false;
        if (typeof gameState !== "undefined") {
            shouldShow = !isAuthenticated && (gameState === "auth" || gameState === "login" || gameState === "register" || gameState === "menu");
        }
        if (typeof isLoggedIn !== "undefined" && isLoggedIn) shouldShow = false;
        if (typeof myPlayer !== "undefined" && myPlayer && (myPlayer.id || myPlayer.name) && typeof gameState !== "undefined" && gameState === "game") shouldShow = false;
    } catch (e) {}

    root.classList.toggle("lc-auth-hidden", !shouldShow);

    // Важно: после входа DOM-окно авторизации не должно оставаться невидимой
    // прослойкой поверх canvas. Иначе оно перехватывает клики по кнопкам
    // изменения персонажа и другим canvas-окнам.
    root.style.display = shouldShow ? "flex" : "none";
    root.style.visibility = shouldShow ? "visible" : "hidden";
    root.style.pointerEvents = shouldShow ? "none" : "none";
}

window.addEventListener("DOMContentLoaded", () => {
    lcCreateAuthWindow();
    lcUpdateAuthWindowVisibility();
});

setTimeout(() => {
    lcCreateAuthWindow();
    lcUpdateAuthWindowVisibility();
}, 50);

setInterval(() => {
    lcHideOldAuthDomLayers();
    lcUpdateAuthWindowVisibility();
}, 500);

