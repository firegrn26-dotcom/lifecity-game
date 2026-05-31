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

