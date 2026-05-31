// ===============================
// 🚀 LIFE CITY CLIENT (CLEAN VERSION)
// ===============================

// ===============================
// 🔌 SOCKET
// ===============================
const socket = io();
let myId = null;
let realPing = 0;
let onlineCount = 1;

// ===============================
// 🔐 AUTH STATE — ВХОД / РЕГИСТРАЦИЯ
// ===============================
let isAuthenticated = false;
let authMode = "login";
let authLogin = "";
let authPassword = "";
let authPasswordRepeat = "";
let authNickname = "";
let authFocus = "login";
let authMessage = "";
let authRememberLogin = false;
let authRememberPassword = false;
let authShowPassword = false;

// ===============================
// 🧍 CUSTOMIZATION STATE
// ===============================
const AVATAR_CONFIG = {
    genders: [
        { value: "male", label: "Мужской" },
        { value: "female", label: "Женский" }
    ],
    bodyTypes: [
        { value: "slim", label: "Худощавый" },
        { value: "normal", label: "Обычный" },
        { value: "strong", label: "Крепкий" }
    ],
    clothingStyles: [
        { value: "street", label: "Уличный" },
        { value: "business", label: "Деловой" },
        { value: "sport", label: "Спорт" },
        { value: "worker", label: "Рабочий" }
    ],
    hairStyles: [
        { value: "short", label: "Короткая" },
        { value: "medium", label: "Средняя" },
        { value: "long", label: "Длинная" },
        { value: "cap", label: "Кепка" }
    ],
    clothingColors: [
        { value: "blue", label: "Синий", color: "#58c7ff" },
        { value: "black", label: "Чёрный", color: "#1f2937" },
        { value: "red", label: "Красный", color: "#ff4d5a" },
        { value: "green", label: "Зелёный", color: "#81f04f" },
        { value: "yellow", label: "Жёлтый", color: "#ffc233" },
        { value: "orange", label: "Оранжевый", color: "#ff9f1a" },
        { value: "purple", label: "Фиолетовый", color: "#b85cff" },
        { value: "white", label: "Белый", color: "#e8eef7" }
    ]
};

function createDefaultAvatarClient() {
    return { gender: "male", bodyType: "normal", clothingStyle: "street", clothingColor: "blue", hairStyle: "short", setupDone: false };
}

function normalizeAvatarClient(raw) {
    const avatar = Object.assign(createDefaultAvatarClient(), raw || {});
    const hasValue = (list, value) => list.some(item => item.value === value);
    if (!hasValue(AVATAR_CONFIG.genders, avatar.gender)) avatar.gender = "male";
    if (!hasValue(AVATAR_CONFIG.bodyTypes, avatar.bodyType)) avatar.bodyType = "normal";
    if (!hasValue(AVATAR_CONFIG.clothingStyles, avatar.clothingStyle)) avatar.clothingStyle = "street";
    if (!hasValue(AVATAR_CONFIG.hairStyles, avatar.hairStyle)) avatar.hairStyle = "short";
    if (!hasValue(AVATAR_CONFIG.clothingColors, avatar.clothingColor)) avatar.clothingColor = "blue";
    avatar.setupDone = !!avatar.setupDone;
    return avatar;
}

let avatarEditorOpen = false;
let avatarEditorRequired = false;
let avatarEditorFromShop = false;
let avatarDraft = createDefaultAvatarClient();
let avatarButtons = [];
let shopOpen = false;
let shopButtons = {};

// DOM-поля авторизации: дают настоящий текстовый курсор, выделение мышкой,
// копирование/вырезание/вставку мышкой и горячими клавишами.
let authDomReady = false;
let authDom = {};
let authDomLastLayout = null;

let authButtons = {
    login: { x: 0, y: 0, w: 0, h: 0 },
    register: { x: 0, y: 0, w: 0, h: 0 },
    loginInput: { x: 0, y: 0, w: 0, h: 0 },
    passwordInput: { x: 0, y: 0, w: 0, h: 0 },
    passwordRepeatInput: { x: 0, y: 0, w: 0, h: 0 },
    nicknameInput: { x: 0, y: 0, w: 0, h: 0 },
    rememberLogin: { x: 0, y: 0, w: 0, h: 0 },
    rememberPassword: { x: 0, y: 0, w: 0, h: 0 },
    showPassword: { x: 0, y: 0, w: 0, h: 0 }
};

function loadSavedAuthSettings() {
    try {
        authRememberLogin = localStorage.getItem("lifecity_remember_login") === "1";
        authRememberPassword = localStorage.getItem("lifecity_remember_password") === "1";
        if (authRememberLogin) authLogin = localStorage.getItem("lifecity_saved_login") || "";
        if (authRememberPassword) authPassword = localStorage.getItem("lifecity_saved_password") || "";
    } catch (err) {}
}

function saveAuthSettings(login, password) {
    try {
        localStorage.setItem("lifecity_remember_login", authRememberLogin ? "1" : "0");
        localStorage.setItem("lifecity_remember_password", authRememberPassword ? "1" : "0");

        if (authRememberLogin) localStorage.setItem("lifecity_saved_login", login || "");
        else localStorage.removeItem("lifecity_saved_login");

        if (authRememberPassword) localStorage.setItem("lifecity_saved_password", password || "");
        else localStorage.removeItem("lifecity_saved_password");
    } catch (err) {}
}

loadSavedAuthSettings();


// ===============================
// 🎵 GAME MUSIC
// ===============================
const MUSIC_STORAGE_KEYS = {
    volume: "lifecity_music_volume",
    muted: "lifecity_music_muted"
};

let gameMusicStarted = false;
let gameMusicUnlocked = false;
let gameMusicUserMuted = false;
let gameMusicWantedVolume = 0.45;

function clampMusicVolume(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0.45;
    return Math.max(0, Math.min(1, n));
}

function getSavedMusicVolume() {
    try {
        const saved = localStorage.getItem(MUSIC_STORAGE_KEYS.volume);
        if (saved !== null) return clampMusicVolume(saved);
    } catch (err) {}
    return 0.45;
}

function getSavedMusicMuted() {
    try {
        return localStorage.getItem(MUSIC_STORAGE_KEYS.muted) === "1";
    } catch (err) {
        return false;
    }
}

function saveMusicSettings(audio) {
    if (!audio) return;
    try {
        localStorage.setItem(MUSIC_STORAGE_KEYS.volume, String(clampMusicVolume(gameMusicWantedVolume)));
        localStorage.setItem(MUSIC_STORAGE_KEYS.muted, gameMusicUserMuted ? "1" : "0");
    } catch (err) {}
}

function updateMusicUi() {
    const muteBtn = document.getElementById("musicMuteBtn");
    const volumeInput = document.getElementById("musicVolume");
    const volumeText = document.getElementById("musicVolumeText");
    if (!muteBtn || !volumeInput || !volumeText) return;

    const percent = Math.round(clampMusicVolume(gameMusicWantedVolume) * 100);
    volumeInput.value = String(percent);
    const isSilent = gameMusicUserMuted || gameMusicWantedVolume <= 0;
    volumeText.textContent = `${isSilent ? 0 : percent}%`;
    muteBtn.textContent = isSilent ? "🔇" : "🔊";
    muteBtn.title = isSilent ? "Включить музыку" : "Выключить музыку";
}

function tryPlayMusicMutedAutoplay() {
    const audio = document.getElementById("gameMusic");
    if (!audio) return;

    // В современных браузерах звук без клика запрещен, но muted autoplay разрешен.
    // Поэтому трек сразу грузится/крутится в фоне без звука, а звук включается
    // автоматически при первом действии игрока: ввод логина, клик, Enter и т.д.
    audio.volume = gameMusicWantedVolume;
    audio.muted = true;
    audio.play().then(() => {
        gameMusicStarted = true;
    }).catch(() => {
        gameMusicStarted = false;
    });
}

function unlockGameMusic() {
    const audio = document.getElementById("gameMusic");
    if (!audio) return;

    gameMusicUnlocked = true;
    audio.volume = gameMusicWantedVolume;
    audio.muted = gameMusicUserMuted || gameMusicWantedVolume <= 0;

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === "function") {
        playPromise
            .then(() => { gameMusicStarted = true; })
            .catch(() => { gameMusicStarted = false; });
    } else {
        gameMusicStarted = true;
    }
    updateMusicUi();
}

// Совместимость для кнопок авторизации: старые обработчики вызывают tryStartGameMusic.
// Раньше этой функции не было, из-за этого кнопки Вход/Регистрация падали с ReferenceError.
function tryStartGameMusic() {
    unlockGameMusic();
}

function applyMusicState() {
    const audio = document.getElementById("gameMusic");
    if (!audio) return;

    audio.volume = gameMusicWantedVolume;
    audio.muted = !gameMusicUnlocked || gameMusicUserMuted || gameMusicWantedVolume <= 0;

    if (gameMusicUnlocked) unlockGameMusic();
    else tryPlayMusicMutedAutoplay();

    saveMusicSettings(audio);
    updateMusicUi();
}

function initGameMusic() {
    const audio = document.getElementById("gameMusic");
    const muteBtn = document.getElementById("musicMuteBtn");
    const volumeInput = document.getElementById("musicVolume");
    const panel = document.getElementById("musicPanel");
    if (!audio || !muteBtn || !volumeInput) return;

    gameMusicWantedVolume = getSavedMusicVolume();
    gameMusicUserMuted = getSavedMusicMuted();
    audio.volume = gameMusicWantedVolume;
    audio.muted = true;
    updateMusicUi();

    muteBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        gameMusicUnlocked = true;
        gameMusicUserMuted = !gameMusicUserMuted;
        if (!gameMusicUserMuted && gameMusicWantedVolume <= 0) gameMusicWantedVolume = 0.45;
        applyMusicState();
    });

    volumeInput.addEventListener("input", (e) => {
        e.stopPropagation();
        gameMusicUnlocked = true;
        gameMusicWantedVolume = clampMusicVolume(Number(volumeInput.value) / 100);
        gameMusicUserMuted = gameMusicWantedVolume <= 0;
        applyMusicState();
    });

    if (panel) {
        ["click", "mousedown", "mouseup", "mousemove", "wheel", "touchstart"].forEach(eventName => {
            panel.addEventListener(eventName, (e) => e.stopPropagation(), { passive: eventName !== "wheel" });
        });
    }

    ["pointerdown", "mousedown", "touchstart", "keydown", "input"].forEach(eventName => {
        window.addEventListener(eventName, unlockGameMusic, { once: true, passive: true });
    });

    // Пытаемся стартовать сразу при открытии страницы. Если браузер разрешит — трек пойдет.
    // Если запретит — он включится на первом действии игрока без дополнительного клика по карте.
    tryPlayMusicMutedAutoplay();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGameMusic, { once: true });
} else {
    initGameMusic();
}

// ===============================
// 🧩 HUD STATE
// ===============================
let hudCompact = false;
let hudAnim = 0;
let gameplayHudAlpha = 0;

let hudButton = {
    x: 0,
    y: 0,
    w: 34,
    h: 28
};

let hudPanelBounds = {
    x: 0,
    y: 0,
    w: 315,
    h: 246
};

let hudDisplay = {
    xp: 0,
    jobXP: 0,
    energy: 100,
    money: 0
};

let hudPreviousStats = null;

// ===============================
// 🧩 HUD GAIN FLOW STATE
// ===============================
// Полученные деньги/опыт копятся в одной строке, ждут 1 секунду,
// затем плавно «перетекают» в фактическое значение. Если во время
// перетекания пришла новая награда — она суммируется с остатком.
let hudGainFlows = {
    money: null,
    xp: null,
    job: null
};

const HUD_GAIN_DELAY = 1000;
const HUD_GAIN_FLOW_DURATION = 2600;
const HUD_GAIN_FADE_AT = 2;

let hudGainSync = {
    startAt: 0,
    flowStartedAt: 0
};

function easeOutCubic(t) {
    t = clamp01(t);
    return 1 - Math.pow(1 - t, 3);
}

function getHudGainProgress(now = performance.now()) {
    if (!hudGainSync.startAt || now < hudGainSync.startAt) return 0;

    const raw = (now - hudGainSync.startAt) / HUD_GAIN_FLOW_DURATION;
    return easeOutCubic(raw);
}

function updateAllHudGainFlows(now = performance.now()) {
    const progress = getHudGainProgress(now);

    for (let key of Object.keys(hudGainFlows)) {
        const flow = hudGainFlows[key];
        if (!flow) continue;

        if (now >= hudGainSync.startAt) {
            flow.remaining = Math.max(0, flow.fromRemaining * (1 - progress));

            if (progress >= 1 || flow.remaining < 0.05) {
                flow.remaining = 0;
                hudGainFlows[key] = null;
            }
        }
    }
}

function restartHudGainSync(now = performance.now()) {
    hudGainSync.startAt = now + HUD_GAIN_DELAY;
    hudGainSync.flowStartedAt = hudGainSync.startAt;

    for (let key of Object.keys(hudGainFlows)) {
        const flow = hudGainFlows[key];
        if (!flow) continue;

        flow.fromRemaining = flow.remaining;
        flow.startAt = hudGainSync.startAt;
    }
}

function addHudFloatingText(amount, color, row, prefix = "+", suffix = "") {
    const value = Math.max(0, Number(amount) || 0);
    if (value <= 0) return;

    const now = performance.now();

    // Перед добавлением новой награды фиксируем текущее состояние всех строк,
    // чтобы деньги, обычный XP, XP профессии и шкалы дальше шли одним таймингом.
    updateAllHudGainFlows(now);

    const current = hudGainFlows[row];

    if (current) {
        current.amount += value;
        current.remaining += value;
        current.fromRemaining = current.remaining;
        current.color = color;
        current.prefix = prefix;
        current.suffix = suffix;
    } else {
        hudGainFlows[row] = {
            amount: value,
            remaining: value,
            fromRemaining: value,
            color,
            row,
            prefix,
            suffix,
            startAt: now + HUD_GAIN_DELAY
        };
    }

    // Любое новое получение перезапускает общую задержку и синхронное перетекание
    // для всех активных прибавок. Если сумма маленькая, она всё равно не дёргается сразу.
    restartHudGainSync(now);
}

function updateHudFlowValue(row, actualValue) {
    actualValue = Number(actualValue) || 0;

    updateAllHudGainFlows();

    const flow = hudGainFlows[row];
    if (!flow) {
        return smoothValue(hudDisplay[row === "job" ? "jobXP" : row], actualValue, 0.035);
    }

    // Синхронизация: оставшаяся прибавка удерживается в +числе,
    // а основная цифра и шкала получают ровно ту же долю прогресса.
    return Math.max(0, actualValue - flow.remaining);
}

function smoothValue(current, target, speed) {
    current = Number(current) || 0;
    target = Number(target) || 0;

    const diff = target - current;

    if (Math.abs(diff) < 0.05) {
        return target;
    }

    return current + diff * speed;
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

socket.on("connect", () => {
    myId = socket.id;
});

socket.on("authRequired", (data) => {
    isAuthenticated = false;
    authMessage = data?.message || "";
});

socket.on("authOk", (data) => {
    isAuthenticated = true;
    authMessage = "";
    try { lcUpdateAuthWindowVisibility(); } catch(e) {}

    if (data?.character) {
        const c = data.character;
        myPlayer.playerId = c.playerId ?? myPlayer.playerId;
        myPlayer.x = c.x ?? myPlayer.x;
        myPlayer.y = c.y ?? myPlayer.y;
        myPlayer.energy = c.energy ?? myPlayer.energy;
        myPlayer.money = c.money ?? myPlayer.money;
        myPlayer.level = c.level ?? myPlayer.level;
        myPlayer.xp = c.xp ?? myPlayer.xp;
        myPlayer.job = c.job ?? myPlayer.job;
        myPlayer.jobLevel = c.jobLevel ?? myPlayer.jobLevel;
        myPlayer.jobXP = c.jobXP ?? myPlayer.jobXP;
        myPlayer.inventory = c.inventory ?? myPlayer.inventory;
        myPlayer.hasBackpack = !!c.hasBackpack;
        myPlayer.cleanerOnShift = !!c.cleanerOnShift;
        myPlayer.avatar = normalizeAvatarClient(c.avatar);
        myPlayer.standardAvatar = normalizeAvatarClient(c.standardAvatar || c.avatar);
        myPlayer.name = c.name || myPlayer.name;

        if (!myPlayer.avatar.setupDone) {
            openAvatarEditor(true, false);
        }
    }
});


socket.on("chatHistory", (messages) => {
    chatMessages = Array.isArray(messages) ? messages : [];
    chatAutoScrollPending = true;
    chatManualScrollUntil = 0;
});

socket.on("chatMessage", (message) => {
    if (!message || !message.id) return;
    if (!chatMessages.some(m => m.id === message.id)) chatMessages.push(message);
    const cutoff = Date.now() - 10 * 60 * 1000;
    chatMessages = chatMessages.filter(m => m.channel === "private" || Number(m.time) >= cutoff);

    // Автопрокрутка вниз работает только если игрок сам не прокручивал чат последнюю минуту.
    if (performance.now() > chatManualScrollUntil) {
        chatAutoScrollPending = true;
    }
});

socket.on("chatError", (text) => {
    showInventoryNotice("ЧАТ", String(text || "Сообщение не отправлено"), UI.red);
});


socket.on("avatarSaved", (data) => {
    myPlayer.avatar = normalizeAvatarClient(data?.avatar);
    myPlayer.standardAvatar = normalizeAvatarClient(data?.standardAvatar || data?.avatar || myPlayer.standardAvatar);
    myPlayer.cleanerOnShift = !!data?.cleanerOnShift;
    avatarEditorOpen = false;
    avatarEditorRequired = false;
    avatarEditorFromShop = false;
    showInventoryNotice("ВНЕШНОСТЬ СОХРАНЕНА", "Параметры персонажа обновлены.", UI.green);
});

socket.on("authError", (message) => {
    isAuthenticated = false;
    authMessage = String(message || "Ошибка входа");
    try { lcAuthSetError(authMessage); lcUpdateAuthWindowVisibility(); } catch(e) {}
});

// ===============================
// 📶 PING DEBUG
// ===============================
setInterval(() => {
    const start = performance.now();

    socket.emit("pingCheck", start);
}, 1000);

socket.on("pongCheck", (start) => {
    const ping = Math.round(performance.now() - start);
    realPing = ping;
    console.log("Real Ping:", ping + "ms");
});

socket.on("onlineCount", (count) => {
    const value = Number(count);
    onlineCount = Number.isFinite(value) && value > 0 ? value : 1;
});


// ===============================
// 🎮 CANVAS
// ===============================
const canvas = document.getElementById("game");

// LifeCity HUD Auth Style Patch: shift login camera toward city center
const AUTH_CAMERA_CITY_SHIFT_X = -1450;
const AUTH_CAMERA_CITY_SHIFT_Y = -520;
let authCameraHudOffsetApplied = true;
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

// ===============================
// 🌧 AUTH WEATHER FX — эффект за окном авторизации
// ===============================
const authWeatherFX = {
    alpha: 1,
    targetAlpha: 1,
    tick: 0,
    rain: Array.from({ length: 90 }, (_, i) => ({
        x: (i * 149) % 1800,
        y: (i * 83) % 1000,
        speed: 5.2 + (i % 6) * 0.55,
        len: 13 + (i % 5) * 4,
        drift: 1.2 + (i % 4) * 0.28
    })),
    snow: Array.from({ length: 42 }, (_, i) => ({
        x: (i * 197) % 1900,
        y: (i * 113) % 1100,
        speed: 0.65 + (i % 5) * 0.18,
        size: 1.2 + (i % 4) * 0.55,
        phase: i * 0.62
    })),
    leaves: Array.from({ length: 18 }, (_, i) => ({
        x: (i * 251) % 1900,
        y: (i * 161) % 1100,
        speed: 1.25 + (i % 4) * 0.28,
        size: 4 + (i % 4),
        phase: i * 0.91,
        rot: i * 0.4
    }))
};

function updateAuthWeatherFxAlpha() {
    authWeatherFX.targetAlpha = isAuthenticated ? 0 : 1;
    const fadeSpeed = isAuthenticated ? 0.035 : 0.08;
    authWeatherFX.alpha += (authWeatherFX.targetAlpha - authWeatherFX.alpha) * fadeSpeed;
    if (Math.abs(authWeatherFX.alpha - authWeatherFX.targetAlpha) < 0.01) {
        authWeatherFX.alpha = authWeatherFX.targetAlpha;
    }
}



function drawAuthPanelRays(x, y, w, h, t = performance.now() * 0.001) {
    if (!ctx) return;
    ctx.save();
    ctx.beginPath();
    if (typeof roundRectPath === "function") {
        roundRectPath(ctx, x, y, w, h, 22);
    } else {
        ctx.rect(x, y, w, h);
    }
    ctx.clip();
    ctx.globalAlpha = 0.20;
    for (let i = 0; i < 3; i++) {
        const rx = x - w * 0.35 + ((t * 55 + i * w * 0.48) % (w * 1.75));
        const g = ctx.createLinearGradient(rx, y, rx + w * 0.28, y + h);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.48, "rgba(160,225,255,0.30)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.translate(rx + w * 0.1, y + h * 0.5);
        ctx.rotate(-0.32);
        ctx.fillRect(-w * 0.08, -h, w * 0.10, h * 2);
        ctx.rotate(0.32);
        ctx.translate(-(rx + w * 0.1), -(y + h * 0.5));
    }
    ctx.restore();
}

function drawAuthWeatherFX() {
    updateAuthWeatherFxAlpha();
    const a = authWeatherFX.alpha;
    if (a <= 0.01) return;

    authWeatherFX.tick += 1;
    ctx.save();
    ctx.globalAlpha = a;

    // Холодное стекло/город за окном авторизации.
    const bg = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.45, 80, canvas.width * 0.5, canvas.height * 0.5, Math.max(canvas.width, canvas.height) * 0.78);
    bg.addColorStop(0, 'rgba(44,92,128,0.18)');
    bg.addColorStop(0.55, 'rgba(8,20,38,0.20)');
    bg.addColorStop(1, 'rgba(2,6,14,0.06)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Дождь.
    ctx.strokeStyle = 'rgba(154,210,255,0.30)';
    ctx.lineWidth = 1;
    for (const drop of authWeatherFX.rain) {
        drop.y += drop.speed;
        drop.x += drop.drift;
        if (drop.y > canvas.height + 50) { drop.y = -50; drop.x = (drop.x + 233) % (canvas.width + 100) - 50; }
        if (drop.x > canvas.width + 70) drop.x = -70;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.drift * 2.4, drop.y + drop.len);
        ctx.stroke();
    }

    // Лёгкий снег/пыль в воздухе.
    ctx.fillStyle = 'rgba(235,248,255,0.72)';
    for (const flake of authWeatherFX.snow) {
        flake.y += flake.speed;
        const sx = flake.x + Math.sin(authWeatherFX.tick / 42 + flake.phase) * 18;
        if (flake.y > canvas.height + 20) { flake.y = -20; flake.x = (flake.x + 317) % canvas.width; }
        ctx.beginPath();
        ctx.arc(sx, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Листва — редкие тёплые акценты, чтобы экран входа не был серым.
    for (const leaf of authWeatherFX.leaves) {
        leaf.y += leaf.speed;
        leaf.x += Math.sin(authWeatherFX.tick / 38 + leaf.phase) * 0.9;
        leaf.rot += 0.035;
        if (leaf.y > canvas.height + 30) { leaf.y = -30; leaf.x = (leaf.x + 421) % canvas.width; }
        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.rot);
        ctx.fillStyle = leaf.size % 2 === 0 ? 'rgba(255,172,70,0.58)' : 'rgba(255,216,105,0.48)';
        ctx.beginPath();
        ctx.ellipse(0, 0, leaf.size * 1.15, leaf.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    ctx.restore();
}


// ===============================
// 🎥 КАМЕРА
// ===============================
let camera = {
    x: 0,
    y: 0
};

// Плавный полет камеры над городом на экране авторизации.
const authCameraFlight = {
    t: 0,
    baseX: 120,
    // Камера авторизации поднята ещё выше: больше обзора города сверху, без лишнего HUD.
    baseY: 230,
    rangeX: 130,
    rangeY: 45
};

function updateAuthCameraFlight() {
    authCameraFlight.t += 0.006;
    const targetX = authCameraFlight.baseX + Math.sin(authCameraFlight.t) * authCameraFlight.rangeX + Math.sin(authCameraFlight.t * 0.37) * 34;
    const targetY = authCameraFlight.baseY + Math.cos(authCameraFlight.t * 0.82) * authCameraFlight.rangeY + Math.sin(authCameraFlight.t * 0.43) * 24;
    camera.x += (targetX - camera.x) * 0.018;
    camera.y += (targetY - camera.y) * 0.018;
}

// ===============================
// 🧍 ЛОКАЛЬНЫЙ ИГРОК (PREDICTION)
// ===============================
let myPlayer = {
    playerId: null,
    x: 100,
    y: 100,
    // Максимальная скорость теперь считается через физику движения персонажа.
    speed: 2.45,
    maxSpeed: 2.45,
    velX: 0,
    velY: 0,
    angle: -Math.PI / 2,
    targetAngle: -Math.PI / 2,
    walkTime: 0,
    cleaningTrashId: null,
    cleaningStartedAt: 0,
    cleaningUntil: 0,

    energy: 100,

    money: 0,
    level: 1,
    xp: 0,
    job: "Без работы",
    jobLevel: 1,
    jobXP: 0,
    inventory: { trash: 0, trashMax: 10, slots: 10 },
    hasBackpack: false,
    cleanerOnShift: false,
    avatar: createDefaultAvatarClient(),
    standardAvatar: createDefaultAvatarClient(),

    name: "You"
};


// ===============================
// 🌍 ДРУГИЕ ИГРОКИ
// ===============================
let players = {};
let renderPlayers = {};
// ===============================
// 🗑️ МУСОР НА УЛИЦАХ
// ===============================
let trashItems = {};
let nearbyTrash = null;
let lastTrashPickupAttempt = 0;
let trashPickupLockedUntil = 0;
let lastTrashPickupId = null;
const CLEAN_TRASH_DURATION_CLIENT = 1000;

// ===============================
// 🎒 ИНВЕНТАРЬ
// ===============================
let inventoryOpen = false;
let inventoryAnim = 0;
let inventoryButton = { x: 0, y: 0, w: 46, h: 46 };
let inventoryCloseButton = { x: 0, y: 0, w: 34, h: 30 };
let inventoryNotice = null;

// ===============================
// 👤 ПРОФИЛЬ ИГРОКА
// ===============================
let profileOpen = false;
let profileAnim = 0;
let profileButton = { x: 0, y: 0, w: 104, h: 34 };
let profileCloseButton = { x: 0, y: 0, w: 34, h: 30 };
let profileData = null;
let profileLoading = false;
let profileScroll = 0;
let profileMaxScroll = 0;


// ===============================
// 💬 ONLINE CHAT STATE
// ===============================
let chatMode = "compact"; // hidden | compact | full
let chatChannel = "general";
let chatMessages = [];
let chatScroll = 0;
let chatMaxScroll = 0;
let chatBounds = { x: 18, y: 18, w: 430, h: 300 };
let chatButtons = [];
let chatMessageHitboxes = [];
let chatReplyTo = null;
let chatContextMenu = null;
let chatPrivateTarget = null;
let chatAutoScrollPending = true;
let chatManualScrollUntil = 0;
let chatInputEl = null;
let chatInputFocused = false;
let chatMouse = { x: -9999, y: -9999 };
let chatHoverProfileHitbox = null;
let chatPrivateListBounds = { x: 0, y: 0, w: 0, h: 0 };
let chatPrivateListHitboxes = [];
let chatPrivateListScroll = 0;
let chatPrivateListMaxScroll = 0;
let chatPrivateListOpen = true;
let chatPrivateListAnim = 1;
let chatPrivateToggleButton = { x: 0, y: 0, w: 0, h: 0 };

const CHAT_CHANNELS = [
    { id: "general", label: "Общий", icon: "🌐" },
    { id: "nearby", label: "Рядом", icon: "📍" },
    { id: "news", label: "Новости", icon: "📰" },
    { id: "admin", label: "Админ", icon: "🛡️" },
    { id: "private", label: "Личные", icon: "✉️" }
];

function getChatChannelMeta(id) {
    return CHAT_CHANNELS.find(c => c.id === id) || CHAT_CHANNELS[0];
}

let lastProfileRequest = 0;

let lastMoveSend = 0;
let wasMoving = false;
let stopCorrectionUntil = 0;
let lastMovementFrameTime = performance.now();

// ===============================
// 🧍 ФИЗИКА И АНИМАЦИЯ ПЕРСОНАЖА
// ===============================
const PLAYER_SIZE = 20;
const PLAYER_MOVE_PHYSICS = {
    acceleration: 0.26,
    braking: 0.20,
    friction: 0.84,
    turnSpeed: 0.18,
    // Больше значение = меньше штраф скорости при повороте.
    moveAfterAngle: 1.18
};

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function angleLerp(current, target, amount) {
    return current + normalizeAngle(target - current) * amount;
}

function getVectorLength(x, y) {
    return Math.sqrt(x * x + y * y);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// плавность других игроков
const remoteSmoothMin = 0.18;
const remoteSmoothMax = 0.55;

// ===============================
// 🎹 КЛАВИШИ
// ===============================
let keys = {};
let nearJob = null;
let lastActionTime = 0;

// ===============================
// 👷 JOB CONFIRM STATE
// ===============================
// Хранит открытое окно подтверждения устройства/увольнения
let jobConfirmOpen = false;
let jobConfirmData = null;

let jobConfirmButtons = {
    accept: { x: 0, y: 0, w: 0, h: 0 },
    cancel: { x: 0, y: 0, w: 0, h: 0 }
};

let trashStationButtons = {
    deposit: { x: 0, y: 0, w: 0, h: 0, active: false },
    shift: { x: 0, y: 0, w: 0, h: 0, active: false }
};

let devMenuOpen = false;
let devModeEnabled = false; // F2 открывает только панель. Сам режим включается отдельным переключателем.
let selectedBuilding = null;

const devOptions = {
    editBuildings: false,
    showRoadBounds: false,
    showGrid: false,
    showDistricts: true,
    showStreetNames: true,
    showCoordinates: false,
    showTrashIds: false,
    showPlayerHitboxes: false
};

let devMenuItems = [];
let devMenuBounds = { x: 22, y: 86, w: 760, h: 520 };

function isDevOptionOn(key) {
    return devModeEnabled && !!devOptions[key];
}

function resetDevEditState() {
    selectedBuilding = null;
    resizeModeX = false;
    resizeModeY = false;
}

let dragOffsetX = 0;
let dragOffsetY = 0;

let resizeModeX = false;
let resizeModeY = false;

function isChatDomTarget(target) {
    return !!(chatInputEl && target === chatInputEl);
}

window.addEventListener("keydown", (e) => {
    const code = e.code;
    const key = String(e.key || "").toLowerCase();

    // Управление привязано к физическим клавишам через e.code.
    // Так WASD / E / F / I / H работают одинаково на русской, английской
    // и любой другой раскладке клавиатуры.
    keys[code] = true;
    keys[key] = true; // резерв для служебных клавиш и старых браузеров

    if (!isAuthenticated) {
        // Новый чистый DOM-auth (#lc-auth-root) сам обрабатывает ввод, Enter, клики и переключение режимов.
        // Старый canvas-auth обработчик здесь отключён, чтобы не было двойного ввода/двойной отправки.
        if (e.target && (e.target.closest?.("#lc-auth-root") || lcGet?.("lc-auth-root"))) {
            return;
        }
        return;
    }

    if (chatInputFocused || isChatDomTarget(e.target)) {
        // Когда игрок печатает в чате, не перехватываем буквенные клавиши игры.
        // Так ввод работает на любой раскладке, включая русскую.
        keys[code] = false;
        keys[key] = false;
        return;
    }

    if (["KeyW", "KeyA", "KeyS", "KeyD", "KeyE", "KeyF", "KeyI", "KeyH", "KeyP", "F2"].includes(code)) {
        e.preventDefault();
    }

    if (avatarEditorRequired) {
        return;
    }

    if (code === "KeyE") {
        if (nearbyTrash) {
            tryCleanTrash();
        } else {
            tryJobAction();
        }
    }

    if (code === "KeyF" && nearJob && nearJob.type === "trashStation" && !jobConfirmOpen) {
        socket.emit("toggleCleanerShift");
    }

    if (code === "KeyH") {
        hudCompact = !hudCompact;
    }

    if (code === "KeyI") {
        inventoryOpen = !inventoryOpen;
    }

    if (code === "KeyP") {
        toggleProfile();
    }

    // Подтверждение окна работы через физическую клавишу F
    if (jobConfirmOpen && code === "KeyF") {
        confirmJobAction();
    }

    // Закрытие окна работы через Escape
    if (jobConfirmOpen && code === "Escape") {
        cancelJobAction();
    }

    if (avatarEditorOpen && code === "Escape" && !avatarEditorRequired) {
        avatarEditorOpen = false;
    }

    if (shopOpen && code === "Escape") {
        shopOpen = false;
    }

    if (inventoryOpen && code === "Escape") {
        inventoryOpen = false;
    }

    if (profileOpen && code === "Escape") {
        profileOpen = false;
    }

    if (code === "F2") {
        devMenuOpen = !devMenuOpen;
        resetDevEditState();
    }
});

window.addEventListener("keyup", (e) => {
    const code = e.code;
    const key = String(e.key || "").toLowerCase();
    keys[code] = false;
    keys[key] = false;
});

canvas.addEventListener("mousedown", (e) => {

    if (
        devMenuOpen &&
        e.clientX >= devMenuBounds.x &&
        e.clientX <= devMenuBounds.x + devMenuBounds.w &&
        e.clientY >= devMenuBounds.y &&
        e.clientY <= devMenuBounds.y + devMenuBounds.h
    ) {
        return;
    }

    if (!isDevOptionOn("editBuildings")) return;

    const mouseX = e.clientX + camera.x;
    const mouseY = e.clientY + camera.y;

    for (let b of buildings) {

        if (
            mouseX >= b.x &&
            mouseX <= b.x + b.w &&
            mouseY >= b.y &&
            mouseY <= b.y + b.h
        ) {

            selectedBuilding = b;

            dragOffsetX = mouseX - b.x;
            dragOffsetY = mouseY - b.y;

            resizeModeX = e.shiftKey;
            resizeModeY = e.ctrlKey;

            break;
        }
    }
});

canvas.addEventListener("mousemove", (e) => {

    chatMouse.x = e.clientX;
    chatMouse.y = e.clientY;

    if (!isDevOptionOn("editBuildings") || !selectedBuilding) return;

    const mouseX = e.clientX + camera.x;
    const mouseY = e.clientY + camera.y;

    // resize X
    if (resizeModeX) {

        selectedBuilding.w = Math.max(
            30,
            Math.round(mouseX - selectedBuilding.x)
        );

        return;
    }

    // resize Y
    if (resizeModeY) {

        selectedBuilding.h = Math.max(
            30,
            Math.round(mouseY - selectedBuilding.y)
        );

        return;
    }

    // move
    selectedBuilding.x =
        Math.round(mouseX - dragOffsetX);

    selectedBuilding.y =
        Math.round(mouseY - dragOffsetY);
});

canvas.addEventListener("mouseup", () => {

    if (!selectedBuilding) return;

    console.log(
        `{ name: "${selectedBuilding.name}", x: ${selectedBuilding.x}, y: ${selectedBuilding.y}, w: ${selectedBuilding.w}, h: ${selectedBuilding.h}, color: "${selectedBuilding.color}" },`
    );

    selectedBuilding = null;
    resizeModeX = false;
    resizeModeY = false;
});

// ===============================
// 🧩 HUD BUTTON CLICK
// ===============================
canvas.addEventListener("click", (e) => {
    const mx = e.clientX;
    const my = e.clientY;

    if (!isAuthenticated) {
        // Авторизация теперь полностью DOM-слой #lc-auth-root.
        // Canvas-клики старого auth UI не обрабатываем, чтобы не ловить невидимые/нулевые hitbox.
        return;
    }

    // Модальное окно внешности находится поверх всего HUD,
    // поэтому его кнопки должны обрабатываться первыми.
    if (avatarEditorOpen) {
        if (handleAvatarEditorClick(mx, my)) return;
        if (avatarEditorRequired) return;
    }

    if (shopOpen) {
        if (handleShopClick(mx, my)) return;
    }

    if (handleChatClick(mx, my)) {
        return;
    }

    if (handleDevMenuClick(mx, my)) {
        return;
    }

    // Сначала проверяем окно подтверждения работы
    if (jobConfirmOpen) {
        const accept = jobConfirmButtons.accept;
        const cancel = jobConfirmButtons.cancel;

        if (
            mx >= accept.x &&
            mx <= accept.x + accept.w &&
            my >= accept.y &&
            my <= accept.y + accept.h
        ) {
            confirmJobAction();
            return;
        }

        if (
            mx >= cancel.x &&
            mx <= cancel.x + cancel.w &&
            my >= cancel.y &&
            my <= cancel.y + cancel.h
        ) {
            cancelJobAction();
            return;
        }
    }

    if (nearJob && nearJob.type === "trashStation") {
        for (const actionName of ["deposit", "shift"]) {
            const b = trashStationButtons[actionName];
            if (b && b.active && mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                if (actionName === "deposit") socket.emit("depositTrash");
                if (actionName === "shift") socket.emit("toggleCleanerShift");
                return;
            }
        }
    }

    // Кнопка инвентаря на экране
    if (
        mx >= inventoryButton.x &&
        mx <= inventoryButton.x + inventoryButton.w &&
        my >= inventoryButton.y &&
        my <= inventoryButton.y + inventoryButton.h
    ) {
        inventoryOpen = !inventoryOpen;
        return;
    }

    // Кнопка профиля закреплена под кнопкой инвентаря
    if (
        mx >= profileButton.x &&
        mx <= profileButton.x + profileButton.w &&
        my >= profileButton.y &&
        my <= profileButton.y + profileButton.h
    ) {
        toggleProfile();
        return;
    }

    if (inventoryOpen) {
        if (
            mx >= inventoryCloseButton.x &&
            mx <= inventoryCloseButton.x + inventoryCloseButton.w &&
            my >= inventoryCloseButton.y &&
            my <= inventoryCloseButton.y + inventoryCloseButton.h
        ) {
            inventoryOpen = false;
            return;
        }
    }

    if (profileOpen) {
        if (
            mx >= profileCloseButton.x &&
            mx <= profileCloseButton.x + profileCloseButton.w &&
            my >= profileCloseButton.y &&
            my <= profileCloseButton.y + profileCloseButton.h
        ) {
            profileOpen = false;
            return;
        }
    }

    // Кнопка сворачивания HUD
    if (
        mx >= hudButton.x &&
        mx <= hudButton.x + hudButton.w &&
        my >= hudButton.y &&
        my <= hudButton.y + hudButton.h
    ) {
        hudCompact = !hudCompact;
    }
});

canvas.addEventListener("wheel", (e) => {
    const mx = e.clientX;
    const my = e.clientY;

    if (chatMode !== "hidden" && chatChannel === "private" && mx >= chatPrivateListBounds.x && mx <= chatPrivateListBounds.x + chatPrivateListBounds.w && my >= chatPrivateListBounds.y && my <= chatPrivateListBounds.y + chatPrivateListBounds.h) {
        if (chatPrivateListMaxScroll > 0) {
            e.preventDefault();
            chatPrivateListScroll = Math.max(0, Math.min(chatPrivateListMaxScroll, chatPrivateListScroll + e.deltaY));
        }
        return;
    }

    if (chatMode !== "hidden" && mx >= chatBounds.x && mx <= chatBounds.x + chatBounds.w && my >= chatBounds.y && my <= chatBounds.y + chatBounds.h) {
        if (chatMaxScroll > 0) {
            e.preventDefault();
            chatScroll = Math.max(0, Math.min(chatMaxScroll, chatScroll + e.deltaY));
            chatManualScrollUntil = performance.now() + 60000;
            chatAutoScrollPending = false;
        }
        return;
    }

    if (!profileOpen || profileAnim < 0.05 || profileMaxScroll <= 0) return;

    e.preventDefault();
    profileScroll = Math.max(0, Math.min(profileMaxScroll, profileScroll + e.deltaY));
}, { passive: false });

// ===============================
// 🚶 ДВИЖЕНИЕ (CLIENT PREDICTION)
// ===============================
function updateMovement() {

    if (!isAuthenticated || avatarEditorRequired) return;

    if (Number(myPlayer.cleaningUntil) > Date.now()) {
        myPlayer.velX = 0;
        myPlayer.velY = 0;
        myPlayer.moving = false;
        const now = performance.now();
        if (now - lastMoveSend > 120) {
            socket.emit("move", {
                dirX: 0,
                dirY: 0,
                x: myPlayer.x,
                y: myPlayer.y,
                angle: myPlayer.angle,
                targetAngle: myPlayer.targetAngle,
                velX: 0,
                velY: 0
            });
            lastMoveSend = now;
        }
        return;
    }

    const nowFrame = performance.now();
    const dt = clamp((nowFrame - lastMovementFrameTime) / 16.67, 0.35, 2.2);
    lastMovementFrameTime = nowFrame;

    let dirX = 0;
    let dirY = 0;

    if (keys["KeyW"]) dirY = -1;
    if (keys["KeyS"]) dirY = 1;
    if (keys["KeyA"]) dirX = -1;
    if (keys["KeyD"]) dirX = 1;

    const inputLength = getVectorLength(dirX, dirY);

    if (inputLength > 0) {
        dirX /= inputLength;
        dirY /= inputLength;

        myPlayer.targetAngle = Math.atan2(dirY, dirX);
        myPlayer.angle = angleLerp(
            myPlayer.angle,
            myPlayer.targetAngle,
            PLAYER_MOVE_PHYSICS.turnSpeed * dt
        );

        const angleDiff = Math.abs(normalizeAngle(myPlayer.targetAngle - myPlayer.angle));

        // Персонаж сначала разворачивается лицом к направлению движения,
        // и только после достаточного поворота начинает уверенно идти.
        const turnReady = clamp(
            1 - angleDiff / PLAYER_MOVE_PHYSICS.moveAfterAngle,
            0,
            1
        );

        const targetVelX = Math.cos(myPlayer.angle) * myPlayer.maxSpeed * turnReady;
        const targetVelY = Math.sin(myPlayer.angle) * myPlayer.maxSpeed * turnReady;

        myPlayer.velX += (targetVelX - myPlayer.velX) * PLAYER_MOVE_PHYSICS.acceleration * dt;
        myPlayer.velY += (targetVelY - myPlayer.velY) * PLAYER_MOVE_PHYSICS.acceleration * dt;
    } else {
        myPlayer.velX *= Math.pow(PLAYER_MOVE_PHYSICS.friction, dt);
        myPlayer.velY *= Math.pow(PLAYER_MOVE_PHYSICS.friction, dt);

        if (Math.abs(myPlayer.velX) < 0.015) myPlayer.velX = 0;
        if (Math.abs(myPlayer.velY) < 0.015) myPlayer.velY = 0;
    }

    const nextX = myPlayer.x + myPlayer.velX * dt;
    const nextY = myPlayer.y + myPlayer.velY * dt;

    if (!isCollidingWithBuilding(nextX, myPlayer.y)) {
        myPlayer.x = nextX;
    } else {
        myPlayer.velX = 0;
    }

    if (!isCollidingWithBuilding(myPlayer.x, nextY)) {
        myPlayer.y = nextY;
    } else {
        myPlayer.velY = 0;
    }

    const moveSpeed = getVectorLength(myPlayer.velX, myPlayer.velY);
    const isMoving = moveSpeed > 0.035;

    if (isMoving) {
        myPlayer.walkTime += moveSpeed * 0.115 * dt;
    }

    const now = performance.now();

    if (now - lastMoveSend > 16) {
        const serverDirX = myPlayer.maxSpeed > 0 ? myPlayer.velX / myPlayer.maxSpeed : 0;
        const serverDirY = myPlayer.maxSpeed > 0 ? myPlayer.velY / myPlayer.maxSpeed : 0;
        socket.emit("move", {
            dirX: serverDirX,
            dirY: serverDirY,
            x: myPlayer.x,
            y: myPlayer.y,
            angle: myPlayer.angle,
            targetAngle: myPlayer.targetAngle,
            velX: myPlayer.velX,
            velY: myPlayer.velY
        });
        lastMoveSend = now;
    }

    if (isMoving) {
        wasMoving = true;
    } else if (wasMoving) {
        socket.emit("moveStop", {
            x: myPlayer.x,
            y: myPlayer.y,
            angle: myPlayer.angle,
            targetAngle: myPlayer.targetAngle,
            velX: 0,
            velY: 0
        });

        stopCorrectionUntil = performance.now() + 300;
        wasMoving = false;
    }
}




// ===============================
// 🌐 ПОЛУЧЕНИЕ ИГРОКОВ
// ===============================
socket.on("players", (data) => {

    const newRender = {};

    for (let id in data) {

        const serverPlayer = data[id];

        // локальный игрок
if (id === myId) {
    const nextMoney = Number(serverPlayer.money) || 0;
    const nextXP = Number(serverPlayer.xp) || 0;
    const nextLevel = Number(serverPlayer.level) || 1;
    const nextJobXP = Number(serverPlayer.jobXP) || 0;
    const nextJobLevel = Number(serverPlayer.jobLevel) || 1;

    if (!hudPreviousStats) {
        // Первый пакет от сервера не считается получением награды.
        // HUD сразу принимает реальные значения, чтобы не было ложной анимации при входе.
        hudDisplay.money = nextMoney;
        hudDisplay.xp = nextXP;
        hudDisplay.jobXP = nextJobXP;
        hudDisplay.energy = Number(serverPlayer.energy) || 100;
    } else {
        const moneyGain = nextMoney - hudPreviousStats.money;
        if (moneyGain > 0) {
            addHudFloatingText(moneyGain, "gold", "money", "+$", "");
        }

        const levelGain = nextLevel - hudPreviousStats.level;
        const xpGain = levelGain > 0
            ? nextXP + (hudPreviousStats.level * 100 - hudPreviousStats.xp)
            : nextXP - hudPreviousStats.xp;

        if (xpGain > 0) {
            addHudFloatingText(xpGain, UI.purple, "xp", "+", " XP");
        }

        const jobLevelGain = nextJobLevel - hudPreviousStats.jobLevel;
        const jobXPGain = jobLevelGain > 0
            ? nextJobXP + (hudPreviousStats.jobLevel * 100 - hudPreviousStats.jobXP)
            : nextJobXP - hudPreviousStats.jobXP;

        if (jobXPGain > 0) {
            addHudFloatingText(jobXPGain, UI.green, "job", "+", " XP");
        }
    }

    hudPreviousStats = {
        money: nextMoney,
        xp: nextXP,
        level: nextLevel,
        jobXP: nextJobXP,
        jobLevel: nextJobLevel
    };

    myPlayer.energy = serverPlayer.energy;
    myPlayer.money = serverPlayer.money;
    myPlayer.level = serverPlayer.level;
    myPlayer.xp = serverPlayer.xp;
    myPlayer.job = serverPlayer.job;
    myPlayer.jobLevel = serverPlayer.jobLevel;
    myPlayer.jobXP = serverPlayer.jobXP;
    myPlayer.inventory = serverPlayer.inventory || { trash: 0, trashMax: 10, slots: 10 };
    myPlayer.hasBackpack = !!serverPlayer.hasBackpack;
    myPlayer.cleanerOnShift = !!serverPlayer.cleanerOnShift;

    // Серверная синхронизация процесса уборки.
    // Без этих полей локальный игрок продолжал ходить,
    // а шкала/анимация уборки не включались.
    const prevLocalCleaningUntil = Number(myPlayer.cleaningUntil) || 0;
    myPlayer.cleaningTrashId = serverPlayer.cleaningTrashId || null;
    myPlayer.cleaningStartedAt = Number(serverPlayer.cleaningStartedAt) || 0;
    myPlayer.cleaningUntil = Number(serverPlayer.cleaningUntil) || 0;
    if (myPlayer.cleaningUntil > Date.now()) {
        myPlayer.velX = 0;
        myPlayer.velY = 0;
        myPlayer.moving = false;
        wasMoving = false;
    } else if (prevLocalCleaningUntil > 0 && prevLocalCleaningUntil <= Date.now()) {
        myPlayer.cleaningTrashId = null;
        myPlayer.cleaningStartedAt = 0;
        myPlayer.cleaningUntil = 0;
    }

    myPlayer.avatar = normalizeAvatarClient(serverPlayer.avatar);
    myPlayer.standardAvatar = normalizeAvatarClient(serverPlayer.standardAvatar || serverPlayer.avatar);
    myPlayer.name = serverPlayer.name;

    const canCorrectAfterStop = performance.now() > stopCorrectionUntil;

if (!wasMoving && canCorrectAfterStop) {
    myPlayer.x += (serverPlayer.x - myPlayer.x) * 0.15;
    myPlayer.y += (serverPlayer.y - myPlayer.y) * 0.15;
    if (Number.isFinite(Number(serverPlayer.angle))) {
        myPlayer.angle = angleLerp(myPlayer.angle, Number(serverPlayer.angle), 0.18);
        myPlayer.targetAngle = Number(serverPlayer.targetAngle ?? serverPlayer.angle);
    }
}

    continue;
    }

        let p = renderPlayers[id];

        // если игрок появился впервые
        if (!p) {
            p = {
                x: serverPlayer.x,
                y: serverPlayer.y,

                targetX: serverPlayer.x,
                targetY: serverPlayer.y,
                angle: Number.isFinite(Number(serverPlayer.angle)) ? Number(serverPlayer.angle) : -Math.PI / 2,
                targetAngle: Number.isFinite(Number(serverPlayer.targetAngle)) ? Number(serverPlayer.targetAngle) : (Number.isFinite(Number(serverPlayer.angle)) ? Number(serverPlayer.angle) : -Math.PI / 2),
                serverMoving: !!serverPlayer.moving,
                walkTime: 0,
                cleaningTrashId: serverPlayer.cleaningTrashId || null,
                cleaningStartedAt: Number(serverPlayer.cleaningStartedAt) || 0,
                cleaningUntil: Number(serverPlayer.cleaningUntil) || 0,

                energy: serverPlayer.energy,
                money: serverPlayer.money,
                name: serverPlayer.name,
                avatar: normalizeAvatarClient(serverPlayer.avatar)
            };
        }

        // серверная цель, к которой будем плавно вести игрока
        p.targetX = serverPlayer.x;
        p.targetY = serverPlayer.y;
        p.serverAngle = Number.isFinite(Number(serverPlayer.angle)) ? Number(serverPlayer.angle) : p.targetAngle;
        p.serverTargetAngle = Number.isFinite(Number(serverPlayer.targetAngle)) ? Number(serverPlayer.targetAngle) : p.serverAngle;
        p.serverMoving = !!serverPlayer.moving;
        p.cleaningTrashId = serverPlayer.cleaningTrashId || null;
        p.cleaningStartedAt = Number(serverPlayer.cleaningStartedAt) || 0;
        p.cleaningUntil = Number(serverPlayer.cleaningUntil) || 0;

        if (Number(p.cleaningUntil) > Date.now()) {
            p.serverMoving = false;
        }

        p.energy = serverPlayer.energy;
        p.money = serverPlayer.money;
        p.name = serverPlayer.name;
        p.avatar = normalizeAvatarClient(serverPlayer.avatar);

        newRender[id] = p;
    }

    renderPlayers = newRender;
    players = newRender;
});


socket.on("trashCleaningStarted", (data) => {
    const until = Number(data?.until) || 0;
    const startedAt = Number(data?.startedAt) || Date.now();
    const trashId = data?.trashId || null;

    if (data?.socketId === myId || Number(data?.playerId) === Number(myPlayer.playerId || 0)) {
        myPlayer.cleaningTrashId = trashId;
        myPlayer.cleaningStartedAt = startedAt;
        myPlayer.cleaningUntil = until;
        myPlayer.velX = 0;
        myPlayer.velY = 0;
        myPlayer.moving = false;
        wasMoving = false;
    }

    for (const id in renderPlayers) {
        const p = renderPlayers[id];
        if (!p) continue;
        if (id === data?.socketId || Number(p.playerId || 0) === Number(data?.playerId || -1)) {
            p.cleaningTrashId = trashId;
            p.cleaningStartedAt = startedAt;
            p.cleaningUntil = until;
            p.serverMoving = false;
            break;
        }
    }
});

socket.on("trashItems", (data) => {
    trashItems = data || {};

    // Если сервер уже удалил мусор после поднятия, сразу очищаем локальную цель.
    // Это убирает повторную отрисовку действия и повторные попытки поднятия.
    if (nearbyTrash && nearbyTrash.id && !trashItems[nearbyTrash.id]) {
        nearbyTrash = null;
        lastTrashPickupId = null;
    }
});

socket.on("profileData", (data) => {
    profileData = data || null;
    profileLoading = false;
});

function showInventoryNotice(title, text, color = UI.yellow, icon = "ℹ") {
    inventoryNotice = {
        title,
        text,
        color,
        icon,
        createdAt: performance.now(),
        duration: 3200
    };
}

socket.on("inventoryFull", (data) => {
    trashPickupLockedUntil = performance.now() + 250;
    showInventoryNotice(
        data?.title || "ИНВЕНТАРЬ ЗАПОЛНЕН",
        data?.text || "Больше мусор поднять нельзя.",
        UI.red,
        data?.icon || "⚠"
    );
});

socket.on("inventoryNotice", (data) => {
    trashPickupLockedUntil = performance.now() + 250;
    showInventoryNotice(
        data?.title || "ИНВЕНТАРЬ",
        data?.text || "Действие выполнено.",
        data?.color === "red" ? UI.red : data?.color === "yellow" ? UI.yellow : UI.green,
        data?.icon || "ℹ"
    );
});

function getNearbyTrash() {
    if (myPlayer.job !== "Дворник" || !myPlayer.cleanerOnShift) return null;
    if (Number(myPlayer.cleaningUntil) > Date.now()) return null;

    const px = myPlayer.x + 10;
    const py = myPlayer.y + 10;

    for (let id in trashItems) {
        const t = trashItems[id];

        const dx = px - t.x;
        const dy = py - t.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 16) {
            return t;
        }
    }

    return null;
}

function tryCleanTrash() {
    if (!nearbyTrash || !nearbyTrash.id) return;

    const now = performance.now();

    // Защита от зависаний/спама: keydown может повторяться десятки раз,
    // пока клавиша E зажата. Одно поднятие мусора = один серверный запрос.
    if (now < trashPickupLockedUntil) return;
    if (lastTrashPickupId === nearbyTrash.id && now - lastTrashPickupAttempt < 700) return;

    lastTrashPickupAttempt = now;
    trashPickupLockedUntil = now + 1100;
    lastTrashPickupId = nearbyTrash.id;

    socket.emit("cleanTrash", nearbyTrash.id);
}

function updateRemotePlayers() {

    for (let id in players) {

        const p = players[id];
        if (!p) continue;

        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        // Направление других игроков больше не вычисляется только по координатам.
        // Сервер присылает фактический угол, особенно важный при остановке.
        const desiredAngle = Number.isFinite(Number(p.serverAngle))
            ? Number(p.serverAngle)
            : (distance > 0.35 ? Math.atan2(dy, dx) : (p.angle ?? -Math.PI / 2));

        p.targetAngle = desiredAngle;
        p.angle = angleLerp(p.angle ?? desiredAngle, desiredAngle, 0.16);

        if (p.serverMoving || distance > 0.6) {
            p.walkTime = (p.walkTime || 0) + Math.min(distance, 10) * 0.014;
        }

        if (distance < 0.5) {
    p.x = p.targetX;
    p.y = p.targetY;
    if (!p.serverMoving) p.angle = angleLerp(p.angle ?? desiredAngle, desiredAngle, 0.20);
    continue;
}

        if (distance > 200) {
            p.x = p.targetX;
            p.y = p.targetY;
            continue;
        }

const smooth = Math.min(
    remoteSmoothMax,
    remoteSmoothMin + distance / 180
);

        p.x += dx * smooth;
        p.y += dy * smooth;
    }
}

// ===============================
// 🏙️ ГОРОД — LIFE CITY MEGAPOLIS
// Размеры зданий не менялись: изменены только позиции и визуальная среда вокруг них.
// ===============================
let buildings = [
    // Новая расстановка: здания находятся в свободных кварталах рядом с дорогами.
    // Размеры обновлены вместе с коллизиями, так как коллизия берётся из этих же w/h.
    { name: "Жилой дом", x: -185, y: 180, w: 180, h: 185, color: "#526077" },
    { name: "Кафе", x: 455, y: 285, w: 160, h: 105, color: "#8b5a2b" },
    { name: "Мэрия", x: 805, y: 185, w: 245, h: 135, color: "#4a6fa5" },
    { name: "Банк", x: 805, y: 480, w: 245, h: 130, color: "#243b64" },
    { name: "Аптека", x: 825, y: 705, w: 165, h: 120, color: "#1e6f4a" },
    { name: "Мусорка", x: 555, y: 700, w: 90, h: 58, color: "#4c5962" },
    { name: "Магазин", x: 1160, y: 500, w: 260, h: 130, color: "#8a6218" },
    { name: "Автосервис", x: 1160, y: 815, w: 270, h: 105, color: "#464b55" },
    { name: "Полиция", x: 1600, y: 210, w: 235, h: 165, color: "#1f4d96" },
];

// Защита от случайного дубля здания при будущих правках карты.
// Ключ учитывает название и координаты, чтобы один и тот же дом не рисовался слоями.
buildings = buildings.filter((b, index, arr) => {
    const key = `${b.name}|${b.x}|${b.y}|${b.w}|${b.h}`;
    return arr.findIndex(item => `${item.name}|${item.x}|${item.y}|${item.w}|${item.h}` === key) === index;
});

// ===============================
// 🧱 COLLISION CHECK
// ===============================
function isCollidingWithBuilding(x, y) {

    const playerSize = 20;

    for (let b of buildings) {

        const playerLeft = x;
        const playerRight = x + playerSize;
        const playerTop = y;
        const playerBottom = y + playerSize;

        const buildingLeft = b.x;
        const buildingRight = b.x + b.w;
        const buildingTop = b.y;
        const buildingBottom = b.y + b.h;

        const isColliding =
            playerLeft < buildingRight &&
            playerRight > buildingLeft &&
            playerTop < buildingBottom &&
            playerBottom > buildingTop;

        if (isColliding) {
            return true;
        }
    }

    return false;
}

// ===============================
// 👷 JOB DETECTION
// ===============================
function getNearbyJob() {

    const playerCenterX = myPlayer.x + 10;
    const playerCenterY = myPlayer.y + 10;
    const interactDistance = 20;

    const currentJob = myPlayer.job || "Без работы";
    const hasJob = currentJob !== "Без работы";

    for (let b of buildings) {

        // Ближайшая точка здания к игроку
        const closestX = Math.max(b.x, Math.min(playerCenterX, b.x + b.w));
        const closestY = Math.max(b.y, Math.min(playerCenterY, b.y + b.h));

        const dx = playerCenterX - closestX;
        const dy = playerCenterY - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > interactDistance) continue;

        // ===============================
        // 🧹 МУСОРКА — РАБОТА ДВОРНИКОМ
        // ===============================
        if (b.name === "Мусорка") {

            if (currentJob === "Дворник") {
                const trashCount = myPlayer.inventory?.trash || 0;
                const trashMax = myPlayer.inventory?.trashMax || 10;

                return {
                    type: "trashStation",
                    title: "Мусорка",
                    text: myPlayer.cleanerOnShift ? "Ты на смене" : "Ты не на смене",
                    trashCount,
                    trashMax,
                    onShift: !!myPlayer.cleanerOnShift
                };
            }

            if (hasJob) {
                return {
                    type: "noJob",
                    title: "Мусорка",
                    text: "Сначала уволься с текущей работы"
                };
            }

            return {
                type: "trash",
                title: "Дворник",
                text: "Нажми E — устроиться дворником"
            };
        }

        // ===============================
        // 🧰 АПТЕКА — РАБОТА САНИТАРОМ
        // ===============================
        if (b.name === "Аптека") {

            if (currentJob === "Санитар") {
                return {
                    type: "noJob",
                    title: "Аптека",
                    text: "Ты уже работаешь санитаром"
                };
            }

            if (hasJob) {
                return {
                    type: "noJob",
                    title: "Аптека",
                    text: "Сначала уволься с текущей работы"
                };
            }

            return {
                type: "heal",
                title: "Санитар",
                text: "Нажми E — устроиться санитаром"
            };
        }

        // ===============================
        // 🏛️ МЭРИЯ — УВОЛЬНЕНИЕ
        // ===============================
        if (b.name === "Мэрия") {

            if (!hasJob) {
                return {
                    type: "noJob",
                    title: "Мэрия",
                    text: "Ты безработный"
                };
            }

            const trashCount = myPlayer.inventory?.trash || 0;

            if (currentJob === "Дворник" && trashCount > 0) {
                return {
                    type: "noJob",
                    title: "Мэрия",
                    text: "Сначала сдай мусор"
                };
            }

            return {
                type: "quitJob",
                title: "Мэрия",
                text: "Нажми E — уволиться с работы"
            };
        }

        // ===============================
        // 🛒 МАГАЗИН — ПОКУПКА ПРЕДМЕТОВ
        // ===============================
        if (b.name === "Магазин") {
            return {
                type: "shop",
                title: "Магазин",
                text: "Нажми E — открыть магазин"
            };
        }
    }

    return null;
}

// ===============================
// 👷 JOB ACTION
// ===============================
// Функция открывает окно подтверждения работы или увольнения.
// Если доступного действия нет, клавиша E ничего не делает.
function tryJobAction() {

    if (!nearJob) return;

    if (nearJob.type === "noJob") {
        return;
    }

    if (nearJob.type === "shop") {
        shopOpen = true;
        avatarEditorOpen = false;
        return;
    }

    if (nearJob.type === "depositTrash") {
        const nowDeposit = performance.now();
        if (nowDeposit - lastActionTime < 300) return;
        socket.emit("depositTrash");
        lastActionTime = nowDeposit;
        return;
    }

    if (nearJob.type === "trashStation") {
        const trashCount = Number(myPlayer.inventory?.trash) || 0;
        const nowDeposit = performance.now();

        // Быстрая сдача мусора по E у мусорки.
        // Сервер всё равно финально проверяет профессию, дистанцию и наличие мусора.
        if (trashCount > 0 && nowDeposit - lastActionTime >= 300) {
            socket.emit("depositTrash");
            lastActionTime = nowDeposit;
        }
        return;
    }

    const now = performance.now();

    if (now - lastActionTime < 300) return;

    jobConfirmOpen = true;
    jobConfirmData = nearJob;

    lastActionTime = now;
}

// Функция подтверждает действие: устроиться или уволиться
function confirmJobAction() {

    if (!jobConfirmOpen || !jobConfirmData) return;

    if (jobConfirmData.type === "noJob") {
        cancelJobAction();
        return;
    }

    if (jobConfirmData.type === "buyBackpack") {
        socket.emit("buyBackpack");
    } else {
        socket.emit("action", jobConfirmData.type);
    }

    jobConfirmOpen = false;
    jobConfirmData = null;
}

// Функция закрывает окно подтверждения без действия
function cancelJobAction() {

    jobConfirmOpen = false;
    jobConfirmData = null;
}

let roads = [
    // Более предсказуемая квартальная сетка: прямые магистрали + крупные свободные зоны под здания.
    { name: "пр. Life City", type: "avenue", lanes: 4, width: 96, points: [{x: 720, y: -360}, {x: 720, y: 1460}] },
    { name: "пр. Центральный", type: "avenue", lanes: 4, width: 100, points: [{x: -650, y: 420}, {x: 2150, y: 420}] },
    { name: "ш. Южное", type: "highway", lanes: 4, width: 112, points: [{x: -700, y: 980}, {x: 2250, y: 980}] },
    { name: "пр. Северный", type: "avenue", lanes: 3, width: 78, points: [{x: -650, y: 120}, {x: 2150, y: 120}] },
    { name: "ул. Западная", type: "street", lanes: 2, width: 58, points: [{x: 220, y: -300}, {x: 220, y: 1360}] },
    { name: "ул. Деловая", type: "street", lanes: 3, width: 74, points: [{x: 1080, y: -300}, {x: 1080, y: 1360}] },
    { name: "ул. Восточная", type: "street", lanes: 2, width: 60, points: [{x: 1520, y: -300}, {x: 1520, y: 1360}] },
    { name: "ул. Торговая", type: "street", lanes: 2, width: 62, points: [{x: -520, y: 650}, {x: 1960, y: 650}] },
    { name: "пер. Кафейный", type: "lane", lanes: 1, width: 32, points: [{x: 220, y: 260}, {x: 720, y: 260}] },
    { name: "пер. Зеленый", type: "lane", lanes: 1, width: 34, points: [{x: 430, y: 420}, {x: 430, y: 980}] }
];

let districts = [
    // Районы теперь образуют цельную сетку без зазоров.
    // Они немного выходят за границы города, чтобы игрок всегда находился внутри района.
    { name: "Северо-западный район", x: -900, y: -520, w: 620, h: 520 },
    { name: "Северный жилой район", x: -280, y: -520, w: 620, h: 520 },
    { name: "Северный центр", x: 340, y: -520, w: 620, h: 520 },
    { name: "Административный район", x: 960, y: -520, w: 620, h: 520 },
    { name: "Северо-восточный район", x: 1580, y: -520, w: 820, h: 520 },

    { name: "Западный район", x: -900, y: 0, w: 620, h: 520 },
    { name: "Старый город", x: -280, y: 0, w: 620, h: 520 },
    { name: "Центральный район", x: 340, y: 0, w: 620, h: 520 },
    { name: "Деловой район", x: 960, y: 0, w: 620, h: 520 },
    { name: "Восточный район", x: 1580, y: 0, w: 820, h: 520 },

    { name: "Юго-западный район", x: -900, y: 520, w: 620, h: 520 },
    { name: "Рабочий район", x: -280, y: 520, w: 620, h: 520 },
    { name: "Торговый район", x: 340, y: 520, w: 620, h: 520 },
    { name: "Сервисный район", x: 960, y: 520, w: 620, h: 520 },
    { name: "Промышленный район", x: 1580, y: 520, w: 820, h: 520 },

    { name: "Южный жилой район", x: -900, y: 1040, w: 620, h: 620 },
    { name: "Южный парк", x: -280, y: 1040, w: 620, h: 620 },
    { name: "Южный центр", x: 340, y: 1040, w: 620, h: 620 },
    { name: "Южная магистраль", x: 960, y: 1040, w: 620, h: 620 },
    { name: "Юго-восточный район", x: 1580, y: 1040, w: 820, h: 620 }
];

let buildingZones = [
    { name: "Жилой квартал", x: -215, y: 160, w: 240, h: 230 },
    { name: "Кафейный квартал", x: 435, y: 265, w: 205, h: 145 },
    { name: "Административный квартал", x: 785, y: 165, w: 285, h: 175 },
    { name: "Финансовый квартал", x: 785, y: 465, w: 285, h: 165 },
    { name: "Медицинский квартал", x: 805, y: 690, w: 210, h: 155 },
    { name: "Коммунальная зона", x: 535, y: 680, w: 130, h: 100 },
    { name: "Торговый квартал", x: 1140, y: 480, w: 305, h: 175 },
    { name: "Сервисный квартал", x: 1140, y: 800, w: 315, h: 145 },
    { name: "Полицейский квартал", x: 1580, y: 190, w: 285, h: 205 }
];

let parks = [
    // Парки в отдельных свободных местах, без пересечения с дорогами и зданиями.
    { name: "Центральный парк", x: 295, y: 155, w: 300, h: 85, fountain: true },
    { name: "Сквер у мэрии", x: 815, y: 60, w: 220, h: 95, fountain: true },
    { name: "Южная лужайка", x: 10, y: 735, w: 250, h: 125, fountain: false },
    { name: "Газон полиции", x: 1640, y: 375, w: 245, h: 105, fountain: false },
    { name: "Восточный газон", x: 1210, y: 205, w: 230, h: 100, fountain: false }
];

let pedestrianPaths = [];

let crosswalks = [];

let cityDecor = [];

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
                drawBrokenSegmentLine(a, b, offset, road, "rgba(245,245,245,0.44)", 2, [24, 22]);
            }
        }

        // Тонкая кромка асфальта у бордюра.
        const edge = road.width / 2 - 3;
        drawBrokenSegmentLine(a, b, edge, road, "rgba(255,255,255,0.12)", 1, null);
        drawBrokenSegmentLine(a, b, -edge, road, "rgba(0,0,0,0.18)", 1, null);
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
    // Пешеходные дорожки удалены из карты.
}

function drawBuildingZones() {
    if (typeof isDevOptionOn !== "function" || !isDevOptionOn("showDistricts")) return;
    ctx.save();
    for (const z of buildingZones) {
        ctx.fillStyle = "rgba(88,199,255,0.035)";
        ctx.strokeStyle = "rgba(88,199,255,0.16)";
        ctx.lineWidth = 1.5;
        roundedRect(z.x - camera.x, z.y - camera.y, z.w, z.h, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(180,225,255,0.38)";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "left";
        ctx.fillText(z.name, z.x - camera.x + 10, z.y - camera.y + 20);
    }
    ctx.restore();
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


// ===============================
// 🌆 VISUAL OVERHAUL V1
// ===============================
const visualFX={fogOffset:0};
function drawVisualOverhaulV1(){
 ctx.save();
 // vignette
 const vg=ctx.createRadialGradient(canvas.width/2,canvas.height/2,Math.min(canvas.width,canvas.height)*0.25,canvas.width/2,canvas.height/2,Math.max(canvas.width,canvas.height)*0.8);
 vg.addColorStop(0,'rgba(0,0,0,0)');
 vg.addColorStop(1,'rgba(0,0,0,0.48)');
 ctx.fillStyle=vg; ctx.fillRect(0,0,canvas.width,canvas.height);
 // night tint
 ctx.fillStyle='rgba(10,18,34,0.10)'; ctx.fillRect(0,0,canvas.width,canvas.height);
 // moving fog
 visualFX.fogOffset+=0.15;
 ctx.globalAlpha=0.06;
 for(let i=0;i<6;i++){
   const x=((i*340+visualFX.fogOffset*12)%(canvas.width+500))-250;
   const y=80+i*90;
   const g=ctx.createRadialGradient(x,y,10,x,y,180);
   g.addColorStop(0,'rgba(200,220,255,0.45)');
   g.addColorStop(1,'rgba(200,220,255,0)');
   ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,180,0,Math.PI*2); ctx.fill();
 }
 ctx.restore();
}

function drawStreetLightsV1(){
 ctx.save();
 for(const r of roads){
   if(!r.points||r.points.length<2) continue;
   for(let i=0;i<r.points.length;i++){
      const p=r.points[i];
      const sx=p.x-camera.x, sy=p.y-camera.y;
      ctx.fillStyle='rgba(255,210,110,.95)';
      ctx.shadowColor='rgba(255,200,80,.55)'; ctx.shadowBlur=22;
      ctx.beginPath(); ctx.arc(sx,sy,2.2,0,Math.PI*2); ctx.fill();
   }
 }
 ctx.restore();
}


// ===============================
// 🌃 VISUAL OVERHAUL V2
// ===============================
const visualFXV2 = {
    tick: 0,
    rain: Array.from({ length: 95 }, (_, i) => ({
        x: (i * 173) % 2200,
        y: (i * 97) % 1200,
        speed: 6 + (i % 7) * 0.55,
        len: 12 + (i % 5) * 4,
        drift: 1.7 + (i % 4) * 0.25
    })),
    motes: Array.from({ length: 52 }, (_, i) => ({
        x: (i * 211) % 2400,
        y: (i * 149) % 1400,
        size: 1 + (i % 4) * 0.45,
        phase: i * 0.73
    }))
};

function isOnScreenWorld(x, y, pad = 180) {
    return x >= camera.x - pad && x <= camera.x + canvas.width + pad && y >= camera.y - pad && y <= camera.y + canvas.height + pad;
}

function drawWorldGlow(wx, wy, radius, color, alpha = 1) {
    const sx = wx - camera.x;
    const sy = wy - camera.y;
    const g = ctx.createRadialGradient(sx, sy, 1, sx, sy, radius);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function getRoadEdgeOffsetV2(road) {
    // Половина ширины дороги + небольшой тротуарный отступ.
    // Так фонари/таблички стоят именно у края дороги, а не на полотне.
    return (road.width || 60) / 2 + (road.type === "lane" ? 9 : 14);
}

function isNearRoadIntersectionV2(x, y, road, safeRadius = 82) {
    // Не ставим объекты прямо в перекрестках — там они визуально съезжают с края дороги.
    for (const other of roads) {
        if (other === road || !other.points || other.points.length < 2) continue;
        let near = false;
        forEachRoadSegment(other, (a, b) => {
            if (near) return;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const lenSq = dx * dx + dy * dy;
            if (lenSq <= 1) return;
            const t = clamp(((x - a.x) * dx + (y - a.y) * dy) / lenSq, 0, 1);
            const px = a.x + dx * t;
            const py = a.y + dy * t;
            const dist = Math.hypot(x - px, y - py);
            const edgeSafe = (other.width || 60) / 2 + safeRadius;
            if (dist < edgeSafe) near = true;
        });
        if (near) return true;
    }
    return false;
}

function forEachRoadLightPoint(step, callback, options = {}) {
    // Универсальная генерация roadside-объектов.
    // Важно: фонари и таблички получают разные phase/sideMode, поэтому больше не появляются в одной точке.
    const minDistance = options.minDistance ?? Math.max(135, step * 0.55);
    const skipIntersections = options.skipIntersections !== false;
    const phase = clamp(options.phase ?? 0, 0, 0.95);
    const sideMode = options.sideMode || "alternate"; // alternate | left | right | outside
    const edgeExtra = options.edgeExtra ?? 0;
    const points = [];

    function isPointFree(x, y, extraRadius = 0) {
        const wantedDistance = minDistance + extraRadius;
        for (const p of points) {
            if (Math.hypot(p.x - x, p.y - y) < wantedDistance) return false;
        }
        return true;
    }

    for (const road of roads) {
        if (!road.points || road.points.length < 2) continue;
        const sideOffset = getRoadEdgeOffsetV2(road) + edgeExtra;

        forEachRoadSegment(road, (a, b, segmentIndex) => {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy);
            if (len < 70) return;

            const ux = dx / len;
            const uy = dy / len;
            const nx = -dy / len;
            const ny = dx / len;
            const usableStart = Math.min(105, len * 0.16);
            const usableEnd = len - usableStart;
            if (usableEnd <= usableStart + 80) return;

            let localIndex = 0;
            for (let dist = usableStart + step * phase; dist <= usableEnd; dist += step) {
                const baseX = a.x + ux * dist;
                const baseY = a.y + uy * dist;

                if (skipIntersections && isNearRoadIntersectionV2(baseX, baseY, road, 54)) continue;

                let side;
                if (sideMode === "left") side = 1;
                else if (sideMode === "right") side = -1;
                else if (sideMode === "outside") {
                    // Для горизонтальных дорог чаще ставим ниже/выше, для вертикальных — снаружи по X.
                    side = Math.abs(dx) >= Math.abs(dy) ? ((segmentIndex + localIndex) % 2 === 0 ? 1 : -1) : ((segmentIndex + localIndex) % 2 === 0 ? -1 : 1);
                } else {
                    side = (localIndex + segmentIndex) % 2 === 0 ? 1 : -1;
                }

                const x = baseX + nx * sideOffset * side;
                const y = baseY + ny * sideOffset * side;

                // Проверяем уже вынесенную точку, а не только центр дороги. Так объекты не попадают на соседнюю дорогу у перекрестков.
                if (skipIntersections && isNearRoadIntersectionV2(x, y, road, 24)) {
                    localIndex++;
                    continue;
                }

                if (!isPointFree(x, y)) {
                    localIndex++;
                    continue;
                }

                points.push({
                    x,
                    y,
                    baseX,
                    baseY,
                    nx: nx * side,
                    ny: ny * side,
                    side,
                    road,
                    i: points.length
                });
                localIndex++;
            }
        });
    }

    for (const p of points) callback(p.x, p.y, p.road, p.i, p);
}

let roadsideLayoutV3Cache = null;

function getRoadsideLayoutV3() {
    // Генерируем фонари и таблички вместе, чтобы они не попадали в одну точку.
    // Опорная точка объекта = край дороги/бордюр. Светильник/табличка рисуются уже от этой точки.
    if (roadsideLayoutV3Cache) return roadsideLayoutV3Cache;

    const layout = { lights: [], signs: [] };
    const occupied = [];

    function pointFree(x, y, minDist) {
        for (const p of occupied) {
            if (Math.hypot(p.x - x, p.y - y) < Math.max(minDist, p.r)) return false;
        }
        return true;
    }

    function addOccupied(x, y, r) {
        occupied.push({ x, y, r });
    }

    function addRoadsidePoint(kind, road, a, b, segmentIndex, dist, localIndex, sideBias = 0) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        if (len < 90) return;

        const ux = dx / len;
        const uy = dy / len;
        const nxRaw = -dy / len;
        const nyRaw = dx / len;

        // Сторона чередуется, но для табличек есть сдвиг, чтобы они не совпадали с фонарями.
        const side = ((segmentIndex + localIndex + sideBias) % 2 === 0) ? 1 : -1;
        const nx = nxRaw * side;
        const ny = nyRaw * side;

        const centerX = a.x + ux * dist;
        const centerY = a.y + uy * dist;

        // ВАЖНО: postX/postY — ровно край дороги + маленький бордюрный отступ.
        // Не выносим далеко наружу, чтобы объект визуально стоял на краю дороги.
        const roadHalf = (road.width || 60) / 2;
        const curbOffset = kind === "light" ? 3 : 5;
        const postX = centerX + nx * (roadHalf + curbOffset);
        const postY = centerY + ny * (roadHalf + curbOffset);
        const edgeX = centerX + nx * roadHalf;
        const edgeY = centerY + ny * roadHalf;

        // У перекрестков визуально кажется, что объекты “съехали”, поэтому оставляем маленькую защитную зону.
        if (isNearRoadIntersectionV2(centerX, centerY, road, kind === "light" ? 34 : 42)) return;
        if (!pointFree(postX, postY, kind === "light" ? 108 : 82)) return;

        const item = {
            x: postX,
            y: postY,
            edgeX,
            edgeY,
            road,
            nx,
            ny,
            angle: Math.atan2(dy, dx),
            i: occupied.length
        };

        if (kind === "light") {
            layout.lights.push(item);
            addOccupied(postX, postY, 102);
        } else {
            layout.signs.push(item);
            addOccupied(postX, postY, 76);
        }
    }

    for (const road of roads) {
        if (!road.points || road.points.length < 2) continue;
        forEachRoadSegment(road, (a, b, segmentIndex) => {
            const len = Math.hypot(b.x - a.x, b.y - a.y);
            if (len < 120) return;

            const startPad = Math.min(82, len * 0.13);
            const endPad = len - startPad;
            if (endPad <= startPad) return;

            // Чуть больше фонарей и табличек, но без слипания.
            const lightStep = road.type === "highway" ? 225 : 205;
            const signStep = road.type === "highway" ? 330 : 295;

            let lightIndex = 0;
            for (let d = startPad + 28; d <= endPad; d += lightStep) {
                addRoadsidePoint("light", road, a, b, segmentIndex, d, lightIndex, 0);
                lightIndex++;
            }

            let signIndex = 0;
            for (let d = startPad + 118; d <= endPad; d += signStep) {
                addRoadsidePoint("sign", road, a, b, segmentIndex, d, signIndex, 1);
                signIndex++;
            }
        });
    }

    roadsideLayoutV3Cache = layout;
    return layout;
}

function drawStreetLightsV2() {
    ctx.save();
    const layout = getRoadsideLayoutV3();
    for (const meta of layout.lights) {
        const { x, y, edgeX, edgeY, road, nx, ny, i } = meta;
        if (!isOnScreenWorld(x, y, 240)) continue;

        const pulse = 0.82 + Math.sin(performance.now() / 740 + i) * 0.08;
        const lampX = x + nx * 6;
        const lampY = y + ny * 6;

        drawWorldGlow(lampX, lampY, road.type === "highway" ? 92 : 72, "rgba(255,196,92,0.30)", pulse);

        ctx.save();
        ctx.translate(0, 0);

        // Тонкая ножка от края дороги до столба — теперь видно, что фонарь привязан к бордюру.
        ctx.strokeStyle = "rgba(8,13,20,0.82)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(edgeX - camera.x, edgeY - camera.y);
        ctx.lineTo(x - camera.x, y - camera.y);
        ctx.lineTo(lampX - camera.x, lampY - camera.y);
        ctx.stroke();

        ctx.shadowColor = "rgba(255,205,115,0.78)";
        ctx.shadowBlur = 17;
        ctx.fillStyle = "rgba(255,224,150,0.96)";
        ctx.beginPath();
        ctx.arc(lampX - camera.x, lampY - camera.y, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    ctx.restore();
}

function drawRoadSurfaceDetailsV2() {
    ctx.save();
    for (const road of roads) {
        if (!road.points || road.points.length < 2) continue;
        forEachRoadSegment(road, (a, b) => {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy);
            if (len < 40) return;
            const angle = Math.atan2(dy, dx);
            const nx = -dy / len;
            const ny = dx / len;
            const count = Math.floor(len / 130);
            for (let i = 0; i < count; i++) {
                const t = (i + 0.38) / count;
                const laneJitter = ((i % 5) - 2) * (road.width * 0.09);
                const wx = a.x + dx * t + nx * laneJitter;
                const wy = a.y + dy * t + ny * laneJitter;
                if (!isOnScreenWorld(wx, wy, 80)) continue;
                ctx.save();
                ctx.translate(wx - camera.x, wy - camera.y);
                ctx.rotate(angle + Math.sin(i) * 0.18);
                ctx.strokeStyle = "rgba(255,255,255,0.045)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-10, 0);
                ctx.quadraticCurveTo(-2, -4, 10, 1);
                ctx.stroke();
                ctx.restore();
            }
        });
    }
    ctx.restore();
}

function drawCityPropsV2() {
    ctx.save();
    const layout = getRoadsideLayoutV3();
    for (const meta of layout.signs) {
        const { x, y, edgeX, edgeY, nx, ny, i } = meta;
        if (!isOnScreenWorld(x, y, 150)) continue;

        const sx = x - camera.x;
        const sy = y - camera.y;
        const label = i % 3 === 0 ? "LIFE" : i % 3 === 1 ? "CITY" : "RP";
        const panelX = nx * 16;
        const panelY = ny * 16;

        ctx.save();

        // Стойка начинается от края дороги, а сама табличка вынесена наружу от дороги.
        ctx.strokeStyle = "rgba(10,16,24,0.76)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(edgeX - camera.x, edgeY - camera.y);
        ctx.lineTo(sx, sy);
        ctx.lineTo(sx + panelX, sy + panelY);
        ctx.stroke();

        ctx.translate(sx + panelX, sy + panelY);
        roundedRect(-21, -10, 42, 20, 5);
        ctx.fillStyle = "rgba(12,22,34,0.92)";
        ctx.fill();
        ctx.strokeStyle = "rgba(88,199,255,0.42)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "rgba(205,240,255,0.92)";
        ctx.font = "bold 8px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, 0, 0);
        ctx.restore();
    }
    ctx.restore();
}

function drawAmbientParticlesV2() {
    visualFXV2.tick += 1;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const m of visualFXV2.motes) {
        const sx = ((m.x - camera.x * 0.18 + Math.sin(visualFXV2.tick / 90 + m.phase) * 24) % (canvas.width + 140) + canvas.width + 140) % (canvas.width + 140) - 70;
        const sy = ((m.y - camera.y * 0.14 + Math.cos(visualFXV2.tick / 110 + m.phase) * 18) % (canvas.height + 120) + canvas.height + 120) % (canvas.height + 120) - 60;
        ctx.globalAlpha = 0.06 + (m.size * 0.018);
        ctx.fillStyle = "rgba(170,215,255,0.8)";
        ctx.beginPath();
        ctx.arc(sx, sy, m.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawRainV2() {
    ctx.save();
    ctx.strokeStyle = "rgba(158,205,255,0.23)";
    ctx.lineWidth = 1;
    for (const drop of visualFXV2.rain) {
        drop.y += drop.speed;
        drop.x += drop.drift;
        if (drop.y > canvas.height + 40) drop.y = -40;
        if (drop.x > canvas.width + 80) drop.x = -80;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.drift * 2.4, drop.y + drop.len);
        ctx.stroke();
    }
    ctx.restore();
}

function drawCinematicOverlayV2() {
    ctx.save();
    const top = ctx.createLinearGradient(0, 0, 0, canvas.height);
    top.addColorStop(0, "rgba(4,10,22,0.18)");
    top.addColorStop(0.48, "rgba(9,20,37,0.06)");
    top.addColorStop(1, "rgba(1,4,10,0.16)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const vg = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.20, canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.78);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.34)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 0.035;
    ctx.fillStyle = "rgba(88,199,255,0.25)";
    for (let y = 0; y < canvas.height; y += 4) ctx.fillRect(0, y, canvas.width, 1);
    ctx.restore();
}

function drawVisualOverhaulV2WorldPreBuildings() {
    drawRoadSurfaceDetailsV2();
    drawStreetLightsV2();
    drawCityPropsV2();
}


function drawVisualOverhaulV2Screen() {
    drawAmbientParticlesV2();
    drawRainV2();
    drawCinematicOverlayV2();
}


function drawMegaCityRoads() {
    // Земля/асфальтовая основа
    ctx.fillStyle = "#101519";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Крупные зоны под застройку видны только в dev-режиме через слой районов.
    drawBuildingZones();

    // Парки и газоны не пересекаются со зданиями.
    for (let p of parks) drawPark(p);

    // Тротуарная подложка: достаточно узкая, чтобы оставлять большие зоны под здания.
    for (let road of roads) drawPolyline(road.points, road.width + 24, "#34383c");
    // Тонкий объёмный бордюр: тень + верхняя кромка.
    for (let road of roads) drawPolyline(road.points, road.width + 8, "#22262a");
    for (let road of roads) drawPolyline(road.points, road.width + 4, "#73777b");
    // Полотно дороги
    for (let road of roads) drawPolyline(road.points, road.width, road.type === "highway" ? "#24272b" : "#2c2f33");
    // Разметка прерывается на перекрёстках и продолжается после них.
    for (let road of roads) drawRoadMarkings(road);
    drawVisualOverhaulV2WorldPreBuildings();
}

function closestPointOnSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return { x: ax, y: ay, t: 0 };
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    return { x: ax + dx * t, y: ay + dy * t, t };
}

function distanceToRoad(px, py, road) {
    let best = Infinity;
    forEachRoadSegment(road, (a, b) => {
        const p = closestPointOnSegment(px, py, a.x, a.y, b.x, b.y);
        const d = Math.sqrt((px - p.x) ** 2 + (py - p.y) ** 2);
        if (d < best) best = d;
    });
    return best;
}

function drawRoadDebug() {
    if (!isDevOptionOn("showRoadBounds")) return;
    ctx.save();
    for (let i = 0; i < roads.length; i++) {
        const road = roads[i];
        drawPolyline(road.points, road.width + 2, "rgba(255,230,0,0.26)", "round", "round");
        ctx.fillStyle = "lime";
        ctx.fillRect(road.points[0].x - camera.x - 4, road.points[0].y - camera.y - 4, 8, 8);
        ctx.fillStyle = "red";
        const last = road.points[road.points.length - 1];
        ctx.fillRect(last.x - camera.x - 4, last.y - camera.y - 4, 8, 8);
        ctx.fillStyle = "yellow";
        ctx.font = "12px Arial";
        ctx.fillText(`R${i} ${road.name}`, road.points[0].x - camera.x + 8, road.points[0].y - camera.y - 8);
    }
    ctx.restore();
}

function getCurrentDistrict() {
    const px = myPlayer.x + 10;
    const py = myPlayer.y + 10;
    for (let d of districts) {
        if (px >= d.x && px <= d.x + d.w && py >= d.y && py <= d.y + d.h) return d.name;
    }
    return "Вне района";
}

function getCurrentStreet() {
    const px = myPlayer.x + 10;
    const py = myPlayer.y + 10;
    const nearbyRoads = [];
    for (let r of roads) {
        const dist = distanceToRoad(px, py, r);
        if (dist <= r.width / 2 + 24) nearbyRoads.push({ name: r.name, dist });
    }
    nearbyRoads.sort((a, b) => a.dist - b.dist);
    const uniqueRoads = [];
    for (let road of nearbyRoads) if (!uniqueRoads.includes(road.name)) uniqueRoads.push(road.name);
    if (uniqueRoads.length === 0) return "Неизвестная улица";
    return uniqueRoads.slice(0, 2).join(" / ");
}


// ===============================
// 🧍 ОТРИСОВКА ЧЕЛОВЕКА
// Рисует персонажа из частей тела: голова, тело, руки, ноги и одежда.
// Угол поворота задаёт направление лица, walkTime — фазу шага.
// ===============================
function drawHumanCharacter(player, options = {}) {
    const cx = player.x + PLAYER_SIZE / 2 - camera.x;
    const cy = player.y + PLAYER_SIZE / 2 - camera.y;
    const angle = player.angle ?? -Math.PI / 2;
    const walk = player.walkTime || 0;
    const isLocal = !!options.isLocal;

    const speed = getVectorLength(player.velX || 0, player.velY || 0);
    const walkPower = isLocal ? clamp(speed / (player.maxSpeed || 2.45), 0, 1) : 1;
    const avatar = normalizeAvatarClient(player.avatar);
    const colorObj = AVATAR_CONFIG.clothingColors.find(c => c.value === avatar.clothingColor) || AVATAR_CONFIG.clothingColors[0];
    const isWorkerUniform = avatar.clothingStyle === "worker";
    const clothesColor = isWorkerUniform ? "#ff8a00" : colorObj.color;
    const bodyScale = avatar.bodyType === "slim" ? 0.9 : avatar.bodyType === "strong" ? 1.13 : 1;
    const shoulderScale = avatar.gender === "female" ? 0.92 : 1;

    // Реалистичная походка сверху: левая нога идёт вперёд вместе с правой рукой,
    // правая нога — вместе с левой рукой. Фазы строго противоположные.
    const leftLegPhase = Math.sin(walk);
    const rightLegPhase = -leftLegPhase;
    const leftArmPhase = rightLegPhase;
    const rightArmPhase = leftLegPhase;

    const stride = 5.5 * walkPower;
    const armStride = 4.5 * walkPower;
    const bodyBob = Math.abs(Math.sin(walk * 2)) * 0.75 * walkPower;
    const shoulderSway = Math.sin(walk) * 0.65 * walkPower;

    ctx.save();
    ctx.translate(cx, cy - bodyBob);
    ctx.rotate(angle);
    ctx.scale(bodyScale, shoulderScale);

    // Мягкая тень под персонажем
    ctx.save();
    ctx.rotate(-angle);
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.beginPath();
    ctx.ellipse(0, 8 + bodyBob, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    function drawLimb(points, color, width, glowColor = null) {
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (glowColor) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 4;
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        ctx.restore();
    }

    const nowMs = Date.now();
    const isCleaning = Number(player.cleaningUntil) > nowMs;
    const cleaningStartedAt = Number(player.cleaningStartedAt) || (nowMs - CLEAN_TRASH_DURATION_CLIENT);
    const cleaningProgress = isCleaning
        ? clamp((nowMs - cleaningStartedAt) / Math.max(1, Number(player.cleaningUntil) - cleaningStartedAt), 0, 1)
        : 0;

    function drawBroom(handX, handY, phase, cleaning) {
        const sweep = cleaning ? Math.sin(phase * 7.5) * 4.8 : Math.sin(walk + 0.7) * 1.2 * walkPower;
        const baseX = handX + 1.3;
        const baseY = handY + 0.2;
        const tipX = cleaning ? 16.5 : 11.5;
        const tipY = handY + 8.5 + sweep;

        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = cleaning ? "rgba(255,195,51,0.35)" : "rgba(255,195,51,0.18)";
        ctx.shadowBlur = cleaning ? 7 : 3;

        ctx.strokeStyle = "#b98242";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        ctx.strokeStyle = "#f0c36b";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(baseX - 0.5, baseY);
        ctx.lineTo(tipX - 0.5, tipY);
        ctx.stroke();

        ctx.strokeStyle = "#d9a13d";
        ctx.lineWidth = 1.4;
        for (let i = -3; i <= 3; i += 1.5) {
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(tipX + 5, tipY + i);
            ctx.stroke();
        }

        if (cleaning) {
            ctx.globalAlpha = 0.96 + Math.sin(phase * 14) * 0.12;
            ctx.strokeStyle = "rgba(230,238,247,0.7)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(tipX + 4.5, tipY, 5 + Math.sin(phase * 8) * 1.2, -0.7, 0.7);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Ноги — с коленями и разной фазой шага.
    const pantsColor = isWorkerUniform ? "#20242d" : (avatar.clothingStyle === "business" ? "#20242d" : (avatar.clothingStyle === "sport" ? "#1d3550" : "#26364f"));
    const shoeColor = "#151b24";

    const leftFootX = -9 + leftLegPhase * stride;
    const rightFootX = -9 + rightLegPhase * stride;
    const leftKneeX = -5 + leftLegPhase * stride * 0.45;
    const rightKneeX = -5 + rightLegPhase * stride * 0.45;

    drawLimb([
        { x: -4, y: -4.2 },
        { x: leftKneeX, y: -5.2 - leftLegPhase * 0.7 },
        { x: leftFootX, y: -6.2 }
    ], pantsColor, 4.0);

    drawLimb([
        { x: -4, y: 4.2 },
        { x: rightKneeX, y: 5.2 - rightLegPhase * 0.7 },
        { x: rightFootX, y: 6.2 }
    ], pantsColor, 4.0);

    // Ступни слегка разворачиваются по направлению шага.
    drawLimb([{ x: leftFootX - 1.7, y: -6.2 }, { x: leftFootX + 2.0, y: -6.2 }], shoeColor, 3.1);
    drawLimb([{ x: rightFootX - 1.7, y: 6.2 }, { x: rightFootX + 2.0, y: 6.2 }], shoeColor, 3.1);

    // Руки — противоположны ногам, чтобы не было синхронного "робота".
    const skinColor = "#d6a878";
    const sleeveColor = clothesColor;

    const cleaningPhase = cleaningProgress * Math.PI * 2;
    const leftHandX = isCleaning ? 1.5 + Math.sin(cleaningPhase * 4) * 1.1 : -1 + leftArmPhase * armStride;
    const rightHandX = isCleaning ? 1.5 + Math.sin(cleaningPhase * 4 + Math.PI) * 1.1 : -1 + rightArmPhase * armStride;

    // Короткий рукав
    drawLimb([{ x: 1, y: -8.2 }, { x: -1.5 + shoulderSway, y: -10.1 }], sleeveColor, 4.0, isLocal ? "rgba(88,199,255,0.22)" : null);
    drawLimb([{ x: 1, y: 8.2 }, { x: -1.5 - shoulderSway, y: 10.1 }], sleeveColor, 4.0, isLocal ? "rgba(88,199,255,0.22)" : null);

    // Предплечья
    drawLimb([
        { x: -1.5 + shoulderSway, y: -10.1 },
        { x: leftHandX, y: -12.2 - leftArmPhase * 0.9 }
    ], skinColor, 3.2);

    drawLimb([
        { x: -1.5 - shoulderSway, y: 10.1 },
        { x: rightHandX, y: 12.2 - rightArmPhase * 0.9 }
    ], skinColor, 3.2);

    if (isWorkerUniform) {
        drawBroom(rightHandX, 12.2 - rightArmPhase * 0.9, isCleaning ? cleaningPhase : walk, isCleaning);
    }

    // Тело / одежда
    const bodyGrad = ctx.createLinearGradient(-8, -8, 7, 8);
    bodyGrad.addColorStop(0, clothesColor);
    bodyGrad.addColorStop(0.55, clothesColor);
    bodyGrad.addColorStop(1, avatar.clothingStyle === "business" ? "#111827" : "#0c2f55");

    roundedRect(-7, -8, 15, 16, 6);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = isLocal ? "rgba(126,217,255,0.8)" : "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    if (isWorkerUniform) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 190, 0.92)";
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(-4.2, -6.2);
        ctx.lineTo(3.4, -1.2);
        ctx.moveTo(-4.2, 6.2);
        ctx.lineTo(3.4, 1.2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.72)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-5.5, 0);
        ctx.lineTo(6, 0);
        ctx.stroke();
        ctx.restore();
    }

    // Направление лица: голова впереди по оси X
    ctx.fillStyle = "#f0bf8a";
    ctx.beginPath();
    ctx.arc(10, 0, 5.4, 0, Math.PI * 2);
    ctx.fill();

    // Волосы / головной убор
    const hairColor = isWorkerUniform ? "#ffd34d" : (avatar.hairStyle === "cap" ? clothesColor : "rgba(38,28,20,0.88)");
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    if (isWorkerUniform) {
        ctx.arc(11, -1.5, 4.1, Math.PI * 0.78, Math.PI * 2.12);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(14.3, -0.15, 3.4, 1.25, 0, 0, Math.PI * 2);
    } else if (avatar.hairStyle === "long") {
        ctx.ellipse(8.7, 0, 4.4, 6.2, 0, Math.PI * 0.75, Math.PI * 1.25);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(11, -1.5, 3.8, Math.PI * 0.8, Math.PI * 2.15);
    } else if (avatar.hairStyle === "medium") {
        ctx.arc(10.5, -1.4, 4.1, Math.PI * 0.82, Math.PI * 2.08);
    } else if (avatar.hairStyle === "cap") {
        ctx.arc(11, -1.5, 3.9, Math.PI * 0.8, Math.PI * 2.1);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(14.2, -0.2, 3.2, 1.3, 0, 0, Math.PI * 2);
    } else {
        ctx.arc(11, -1.5, 3.4, Math.PI * 0.95, Math.PI * 2.05);
    }
    ctx.fill();

    // Лицо/нос — маленькая точка направления
    ctx.fillStyle = "rgba(255,245,220,0.9)";
    ctx.beginPath();
    ctx.arc(14.5, 0, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Обводка локального персонажа
    if (isLocal) {
        ctx.strokeStyle = "rgba(88,199,255,0.32)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, 15.5, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();

    if (isCleaning) {
        const barW = 42;
        const barH = 6;
        const bx = cx - barW / 2;
        const by = cy - 36;
        ctx.save();
        roundedRect(bx, by, barW, barH, 4);
        ctx.fillStyle = "rgba(6,16,28,0.88)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,195,51,0.55)";
        ctx.lineWidth = 1;
        ctx.stroke();
        roundedRect(bx + 1, by + 1, (barW - 2) * cleaningProgress, barH - 2, 3);
        const grad = ctx.createLinearGradient(bx, by, bx + barW, by);
        grad.addColorStop(0, "#ffc233");
        grad.addColorStop(0.55, "#81f04f");
        grad.addColorStop(1, "#58c7ff");
        ctx.fillStyle = grad;
        ctx.shadowColor = "rgba(255,195,51,0.45)";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
    }

    // Ник над персонажем
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.font = isLocal ? "bold 12px Arial" : "12px Arial";
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillText(player.name || (isLocal ? "You" : "Player"), cx + 1, cy - 18 + 1);
    ctx.fillStyle = isLocal ? "#ffffff" : "rgba(255,255,255,0.88)";
    ctx.fillText(player.name || (isLocal ? "You" : "Player"), cx, cy - 18);
    ctx.restore();
}

// ===============================
// 🧩 MODERN HUD HELPERS
// ===============================
const UI = {
    panel: "rgba(12, 26, 42, 0.78)",
    border: "rgba(150, 220, 255, 0.42)",
    line: "rgba(255, 255, 255, 0.12)",
    text: "#f4f7fb",
    muted: "rgba(245, 250, 255, 0.82)",
    blue: "#58c7ff",
    green: "#81f04f",
    purple: "#b85cff",
    yellow: "#ffc233",
    red: "#ff4d5a"
};

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function roundedRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}



// ===============================
// 🏢 ЗДАНИЯ LIFE CITY — ПОЛНЫЙ TOP-DOWN REBUILD
// Вид строго сверху: узнаваемость через крышу, форму, детали, цвет и одну русскую вывеску.
// Коллизии берутся из массива buildings, поэтому визуальные размеры = реальные размеры.
// ===============================
function buildingPalette(name, fallback) {
    const map = {
        "Мэрия":      { roof: "#2b5f98", edge: "#14304f", accent: "#d7ecff", label: "МЭРИЯ", type: "city" },
        "Банк":       { roof: "#1b2c48", edge: "#0d1728", accent: "#ffd76a", label: "БАНК", type: "bank" },
        "Магазин":    { roof: "#8d651d", edge: "#3b290d", accent: "#ffd45a", label: "МАГАЗИН", type: "shop" },
        "Кафе":       { roof: "#8a4f25", edge: "#3a2112", accent: "#ffc957", label: "КАФЕ", type: "cafe" },
        "Аптека":     { roof: "#21734e", edge: "#0f3023", accent: "#86ff78", label: "АПТЕКА", type: "pharmacy" },
        "Мусорка":    { roof: "#48525b", edge: "#1e252c", accent: "#9bff6c", label: "МУСОРКА", type: "trash" },
        "Автосервис": { roof: "#555b66", edge: "#20252c", accent: "#ff9d3c", label: "СЕРВИС", type: "service" },
        "Полиция":    { roof: "#24579d", edge: "#0d2145", accent: "#62caff", label: "ПОЛИЦИЯ", type: "police" },
        "Жилой дом":  { roof: "#566276", edge: "#222b39", accent: "#66cfff", label: "ЖИЛОЙ ДОМ", type: "home" }
    };
    return map[name] || { roof: fallback || "#4b5563", edge: "#1c2430", accent: UI.blue, label: String(name || "ЗДАНИЕ").toUpperCase(), type: "default" };
}

function drawTopDownBuildingGlow(x, y, w, h, accent) {
    // Один аккуратный контур без тяжелого свечения. Так здания не выглядят
    // наложенными друг на друга и не дублируют собственные окна.
    ctx.save();
    ctx.globalAlpha = 0.12;
    roundedRect(x - 1, y - 1, w + 2, h + 2, Math.min(18, w / 7, h / 7));
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
}

function drawRoofBase(x, y, w, h, p) {
    ctx.save();

    // Нижняя тень, чтобы здание читалось сверху и не казалось плоским.
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    roundedRect(x + 3, y + 4, w, h, Math.min(18, w / 7, h / 7));
    ctx.fill();

    drawTopDownBuildingGlow(x, y, w, h, p.accent);

    const roof = ctx.createLinearGradient(x, y, x + w, y + h);
    roof.addColorStop(0, lightenColor(p.roof, 18));
    roof.addColorStop(0.46, p.roof);
    roof.addColorStop(1, p.edge);

    roundedRect(x, y, w, h, Math.min(18, w / 7, h / 7));
    ctx.fillStyle = roof;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Внутренний кант крыши.
    roundedRect(x + 7, y + 7, w - 14, h - 14, Math.min(13, w / 8, h / 8));
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Верхний холодный блик.
    ctx.save();
    roundedRect(x, y, w, h, Math.min(18, w / 7, h / 7));
    ctx.clip();
    const shine = ctx.createLinearGradient(x, y, x + w, y + h);
    shine.addColorStop(0, "rgba(255,255,255,0.18)");
    shine.addColorStop(0.26, "rgba(255,255,255,0.04)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = shine;
    ctx.fillRect(x, y, w, h);
    ctx.restore();

    ctx.restore();
}

function drawRoofLabel(x, y, w, h, text, accent) {
    ctx.save();
    const safeText = String(text || "").toUpperCase();
    const boxW = Math.min(w - 18, Math.max(72, safeText.length * 12 + 28));
    const boxH = Math.min(30, Math.max(22, h * 0.18));
    const lx = x + w / 2 - boxW / 2;
    const ly = y + h / 2 - boxH / 2;

    roundedRect(lx, ly, boxW, boxH, 8);
    ctx.fillStyle = "rgba(3, 10, 22, 0.78)";
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.96;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 9;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    const fontSize = Math.max(10, Math.min(15, Math.floor((boxW - 16) / Math.max(3.2, safeText.length * 0.55))));
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.fillText(safeText, lx + boxW / 2, ly + boxH / 2 + 0.5);

    ctx.restore();
}

function drawRoofUnit(x, y, w, h, accent, alpha = 1) {
    ctx.save();
    roundedRect(x, y, w, h, 5);
    ctx.fillStyle = `rgba(5, 10, 18, ${0.44 * alpha})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${0.16 * alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.26 * alpha;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h / 2);
    ctx.lineTo(x + w - 4, y + h / 2);
    ctx.moveTo(x + w / 2, y + 4);
    ctx.lineTo(x + w / 2, y + h - 4);
    ctx.stroke();
    ctx.restore();
}

function drawRooftopWindows(x, y, w, h, cols, rows, accent) {
    ctx.save();
    const padX = w * 0.12;
    const padY = h * 0.14;
    const gap = 7;
    const ww = Math.max(12, (w - padX * 2 - gap * (cols - 1)) / cols);
    const wh = Math.max(9, Math.min(15, (h - padY * 2 - gap * (rows - 1)) / rows));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const wx = x + padX + c * (ww + gap);
            const wy = y + padY + r * (wh + gap);
            roundedRect(wx, wy, ww, wh, 3);
            ctx.fillStyle = (r + c) % 2 === 0 ? "rgba(120,210,255,0.22)" : "rgba(255,255,255,0.10)";
            ctx.fill();
            ctx.strokeStyle = accent;
            ctx.globalAlpha = 0.24;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
    ctx.restore();
}

function drawTopDownEntrance(x, y, w, h, accent) {
    ctx.save();
    const ew = Math.max(26, Math.min(58, w * 0.22));
    const eh = Math.max(12, Math.min(18, h * 0.12));
    const ex = x + w / 2 - ew / 2;
    const ey = y + h - eh - 4;
    roundedRect(ex, ey, ew, eh, 5);
    ctx.fillStyle = "rgba(2, 6, 14, 0.70)";
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.96;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.restore();
}

function drawBuildingTypeDetails(x, y, w, h, p) {
    ctx.save();

    if (p.type === "city") {
        // Административное здание: симметричная крыша, центральный купол/зал.
        roundedRect(x + w * 0.18, y + h * 0.16, w * 0.64, h * 0.56, 10);
        ctx.fillStyle = "rgba(216,237,255,0.12)";
        ctx.fill();
        ctx.strokeStyle = "rgba(216,237,255,0.30)";
        ctx.stroke();
        for (let i = 0; i < 5; i++) {
            const px = x + w * (0.22 + i * 0.14);
            drawRoofUnit(px, y + h * 0.28, w * 0.07, h * 0.28, p.accent, 0.9);
        }
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.18, Math.min(w, h) * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(216,237,255,0.34)";
        ctx.fill();
        ctx.strokeStyle = p.accent;
        ctx.stroke();
    }

    if (p.type === "bank") {
        // Банк: строгие секции и золотой сейфовый акцент.
        roundedRect(x + w * 0.18, y + h * 0.18, w * 0.64, h * 0.14, 7);
        ctx.fillStyle = "rgba(255,215,106,0.18)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,215,106,0.45)";
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
            drawRoofUnit(x + w * (0.20 + i * 0.18), y + h * 0.42, w * 0.10, h * 0.26, p.accent, 0.9);
        }
        ctx.beginPath();
        ctx.arc(x + w * 0.82, y + h * 0.50, Math.min(w, h) * 0.08, 0, Math.PI * 2);
        ctx.strokeStyle = p.accent;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    if (p.type === "shop") {
        // Магазин: полосатый навес сверху и витринная зона.
        const awnY = y + h * 0.13;
        const stripeW = w / 8;
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = i % 2 === 0 ? "rgba(255,212,90,0.80)" : "rgba(58,41,13,0.78)";
            ctx.fillRect(x + i * stripeW, awnY, stripeW + 1, h * 0.11);
        }
        roundedRect(x + w * 0.13, y + h * 0.58, w * 0.56, h * 0.18, 7);
        ctx.fillStyle = "rgba(100,210,255,0.16)";
        ctx.fill();
        ctx.strokeStyle = "rgba(100,210,255,0.35)";
        ctx.stroke();
        drawRoofUnit(x + w * 0.75, y + h * 0.43, w * 0.13, h * 0.20, p.accent, 0.8);
    }

    if (p.type === "cafe") {
        // Кафе: тёплая крыша, круглый столик/зона посадки сверху.
        const awnY = y + h * 0.18;
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = i % 2 === 0 ? "rgba(255,201,87,0.78)" : "rgba(255,255,255,0.58)";
            ctx.fillRect(x + i * (w / 6), awnY, w / 6 + 1, h * 0.12);
        }
        ctx.beginPath();
        ctx.arc(x + w * 0.50, y + h * 0.58, Math.min(w, h) * 0.13, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,201,87,0.18)";
        ctx.fill();
        ctx.strokeStyle = p.accent;
        ctx.stroke();
        drawRoofUnit(x + w * 0.18, y + h * 0.48, w * 0.16, h * 0.22, p.accent, 0.7);
    }

    if (p.type === "pharmacy") {
        // Аптека: зелёный медицинский крест на крыше.
        const cx = x + w / 2;
        const cy = y + h * 0.48;
        ctx.shadowColor = p.accent;
        ctx.shadowBlur = 8;
        ctx.fillStyle = "rgba(134,255,120,0.80)";
        roundedRect(cx - 8, cy - 30, 16, 60, 5);
        ctx.fill();
        roundedRect(cx - 30, cy - 8, 60, 16, 5);
        ctx.fill();
        ctx.shadowBlur = 0;
        drawRoofUnit(x + w * 0.12, y + h * 0.16, w * 0.18, h * 0.20, p.accent, 0.75);
        drawRoofUnit(x + w * 0.70, y + h * 0.16, w * 0.18, h * 0.20, p.accent, 0.75);
    }

    if (p.type === "trash") {
        // Коммунальная зона: контейнерный силуэт, но одна русская надпись.
        roundedRect(x + w * 0.24, y + h * 0.25, w * 0.52, h * 0.45, 6);
        ctx.fillStyle = "rgba(155,255,108,0.13)";
        ctx.fill();
        ctx.strokeStyle = p.accent;
        ctx.stroke();
        ctx.fillStyle = p.accent;
        ctx.globalAlpha = 0.96;
        ctx.fillRect(x + w * 0.22, y + h * 0.20, w * 0.56, 5);
        ctx.globalAlpha = 1;
        for (let i = 1; i < 4; i++) {
            ctx.strokeStyle = "rgba(255,255,255,0.18)";
            ctx.beginPath();
            ctx.moveTo(x + w * (0.24 + i * 0.13), y + h * 0.32);
            ctx.lineTo(x + w * (0.24 + i * 0.13), y + h * 0.66);
            ctx.stroke();
        }
    }

    if (p.type === "service") {
        // Автосервис: широкий гаражный блок и тех. элементы крыши.
        roundedRect(x + w * 0.10, y + h * 0.36, w * 0.48, h * 0.35, 8);
        ctx.fillStyle = "rgba(5,10,18,0.45)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.16)";
        ctx.stroke();
        for (let i = 1; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(x + w * 0.12, y + h * (0.36 + i * 0.08));
            ctx.lineTo(x + w * 0.56, y + h * (0.36 + i * 0.08));
            ctx.stroke();
        }
        drawRoofUnit(x + w * 0.70, y + h * 0.30, w * 0.15, h * 0.28, p.accent, 0.9);
    }

    if (p.type === "police") {
        // Полиция: сине-красный маяк и звезда на крыше.
        drawRooftopWindows(x, y + h * 0.10, w, h * 0.42, 3, 2, p.accent);
        roundedRect(x + w * 0.34, y + h * 0.52, w * 0.32, h * 0.22, 11);
        ctx.fillStyle = "rgba(98,202,255,0.16)";
        ctx.fill();
        ctx.strokeStyle = p.accent;
        ctx.stroke();
        ctx.fillStyle = p.accent;
        ctx.font = `bold ${Math.max(16, h / 6)}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("★", x + w / 2, y + h * 0.63);
        ctx.fillStyle = "rgba(255,72,86,0.9)";
        ctx.fillRect(x + w * 0.38, y + 7, w * 0.10, 5);
        ctx.fillStyle = "rgba(98,202,255,0.95)";
        ctx.fillRect(x + w * 0.52, y + 7, w * 0.10, 5);
    }

    if (p.type === "home") {
        // Жилой дом: сетка жилых секций на крыше.
        drawRooftopWindows(x, y, w, h * 0.78, 3, 5, p.accent);
        drawRoofUnit(x + w * 0.36, y + h * 0.72, w * 0.28, h * 0.13, p.accent, 0.8);
        drawRoofUnit(x + w * 0.12, y + h * 0.10, w * 0.18, h * 0.16, p.accent, 0.6);
    }

    if (p.type === "default") {
        drawRooftopWindows(x, y, w, h, 3, 3, p.accent);
    }

    ctx.restore();
}

function drawStyledBuilding(b) {
    const x = b.x - camera.x;
    const y = b.y - camera.y;
    const w = b.w;
    const h = b.h;

    if (x + w < -100 || y + h < -100 || x > canvas.width + 100 || y > canvas.height + 100) return;

    const p = buildingPalette(b.name, b.color);

    ctx.save();
    drawRoofBase(x, y, w, h, p);
    drawBuildingTypeDetails(x, y, w, h, p);
    drawTopDownEntrance(x, y, w, h, p.accent);

    // Единственная вывеска: только русское название, без дублей и английских знаков.
    drawRoofLabel(x, y, w, h, p.label, p.accent);

    if (isDevOptionOn("editBuildings") && selectedBuilding === b) {
        ctx.strokeStyle = UI.yellow;
        ctx.lineWidth = 3;
        roundedRect(x - 3, y - 3, w + 6, h + 6, Math.min(18, w / 7, h / 7));
        ctx.stroke();
    }
    ctx.restore();
}

function lightenColor(hex, percent) {
    const safe = String(hex || "#555555").replace("#", "");
    const num = parseInt(safe.length === 3 ? safe.split("").map(ch => ch + ch).join("") : safe, 16);
    if (Number.isNaN(num)) return hex;
    let r = (num >> 16) + percent;
    let g = ((num >> 8) & 0x00FF) + percent;
    let b = (num & 0x0000FF) + percent;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `rgb(${r},${g},${b})`;
}



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

    // здания — стилизованная отрисовка без изменения размеров и коллизий
for (let b of buildings) {
    drawStyledBuilding(b);
}

    // игроки
    for (let id in players) {

    if (id === myId) continue;

    let p = players[id];

    drawHumanCharacter(p, { isLocal: false });

    if (isDevOptionOn("showPlayerHitboxes")) {
        ctx.strokeStyle = UI.yellow;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(p.x - camera.x, p.y - camera.y, PLAYER_SIZE, PLAYER_SIZE);
    }
}

for (let id in trashItems) {
    const t = trashItems[id];
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

nearbyTrash = getNearbyTrash();
drawTrashActionPanel();

    // ===============================
// 🧍 ЛОКАЛЬНЫЙ ИГРОК
// ===============================

drawHumanCharacter(myPlayer, { isLocal: true });

if (isDevOptionOn("showPlayerHitboxes")) {
    ctx.strokeStyle = UI.yellow;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(myPlayer.x - camera.x, myPlayer.y - camera.y, PLAYER_SIZE, PLAYER_SIZE);
}

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

    const smooth = 0.08;

    const targetX = myPlayer.x - canvas.width / 2;
    const targetY = myPlayer.y - canvas.height / 2;

    camera.x += (targetX - camera.x) * smooth;
    camera.y += (targetY - camera.y) * smooth;
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

