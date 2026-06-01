// ===============================
// 🚀 LIFE CITY SERVER + CHARACTER DATABASE
// ===============================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { performance } = require("perf_hooks");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ===============================
// 📁 STATIC FILES
// ===============================
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// 💾 SERVER DATABASE
// Файл создаётся рядом с local-server.js: /data/players-db.json
// Здесь хранятся логин, пароль-хэш, ID игрока, инвентарь, деньги, энергия,
// общий опыт/уровень и опыт/уровни профессий. Данные не сбрасываются при выходе.
// ===============================
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "players-db.json");
const TRASH_DB_FILE = path.join(DATA_DIR, "trash-db.json");
const CHAT_DB_FILE = path.join(DATA_DIR, "chat-db.json");
const MAP_OBJECTS_FILE = path.join(DATA_DIR, "map-objects-db.json");

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function createEmptyDatabase() {
    return {
        version: 1,
        nextPlayerId: 1,
        accounts: {}
    };
}

function loadDatabase() {
    ensureDataDir();

    if (!fs.existsSync(DB_FILE)) {
        const empty = createEmptyDatabase();
        fs.writeFileSync(DB_FILE, JSON.stringify(empty, null, 4), "utf8");
        return empty;
    }

    try {
        const raw = fs.readFileSync(DB_FILE, "utf8");
        const data = JSON.parse(raw || "{}");
        data.version = data.version || 1;
        data.nextPlayerId = data.nextPlayerId || 1;
        data.accounts = data.accounts || {};
        return data;
    } catch (err) {
        console.error("DB load error:", err);
        return createEmptyDatabase();
    }
}


function createEmptyTrashDatabase() {
    return {
        version: 1,
        nextTrashId: 1,
        lastTrashSpawn: Date.now(),
        items: {}
    };
}

function loadTrashDatabase() {
    ensureDataDir();

    if (!fs.existsSync(TRASH_DB_FILE)) {
        const empty = createEmptyTrashDatabase();
        fs.writeFileSync(TRASH_DB_FILE, JSON.stringify(empty, null, 4), "utf8");
        return empty;
    }

    try {
        const raw = fs.readFileSync(TRASH_DB_FILE, "utf8");
        const data = JSON.parse(raw || "{}");
        data.version = data.version || 1;
        data.nextTrashId = Math.max(1, Number(data.nextTrashId) || 1);
        data.lastTrashSpawn = Number(data.lastTrashSpawn) || Date.now();
        data.items = data.items || {};

        // После перезапуска сервера незавершённая уборка не должна оставлять мусор заблокированным.
        for (const item of Object.values(data.items)) {
            if (!item) continue;
            delete item.cleaningBy;
            delete item.cleaningByName;
            delete item.cleaningStartedAt;
            delete item.cleaningUntil;
        }

        // Восстанавливаем счётчик ID, даже если файл был отредактирован вручную.
        for (const id of Object.keys(data.items)) {
            const n = Number(String(id).replace("trash_", ""));
            if (!Number.isNaN(n)) data.nextTrashId = Math.max(data.nextTrashId, n + 1);
        }

        return data;
    } catch (err) {
        console.error("Trash DB load error:", err);
        return createEmptyTrashDatabase();
    }
}

let trashDb = loadTrashDatabase();
let trashSaveTimer = null;

function saveTrashDatabaseNow() {
    ensureDataDir();
    trashDb.items = trashItems;
    trashDb.nextTrashId = trashIdCounter;
    trashDb.lastTrashSpawn = lastTrashSpawn;
    fs.writeFileSync(TRASH_DB_FILE, JSON.stringify(trashDb, null, 4), "utf8");
}

function saveTrashDatabaseDebounced() {
    clearTimeout(trashSaveTimer);
    trashSaveTimer = setTimeout(saveTrashDatabaseNow, 350);
}

let db = loadDatabase();
let saveTimer = null;

function saveDatabaseNow() {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 4), "utf8");
}

function saveDatabaseDebounced() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDatabaseNow, 350);
}


// ===============================
// 🗺️ DEV MAP OBJECTS DATABASE
// Сохраняет правки объектов карты из меню разработчика:
// здания, зоны, парки и дороги. Файл не трогает игровые аккаунты.
// ===============================
function createEmptyMapObjectsDatabase() {
    return {
        version: 1,
        updatedAt: 0,
        objects: {
            buildings: {},
            parks: {},
            buildingZones: {},
            roads: {}
        }
    };
}

function normalizeMapObjectsDatabase(data) {
    const empty = createEmptyMapObjectsDatabase();
    const src = data && typeof data === "object" ? data : {};
    src.version = src.version || empty.version;
    src.updatedAt = Number(src.updatedAt) || 0;
    src.objects = src.objects && typeof src.objects === "object" ? src.objects : {};
    for (const key of ["buildings", "parks", "buildingZones", "roads"]) {
        src.objects[key] = src.objects[key] && typeof src.objects[key] === "object" ? src.objects[key] : {};
    }
    return src;
}

function loadMapObjectsDatabase() {
    ensureDataDir();

    if (!fs.existsSync(MAP_OBJECTS_FILE)) {
        const empty = createEmptyMapObjectsDatabase();
        fs.writeFileSync(MAP_OBJECTS_FILE, JSON.stringify(empty, null, 4), "utf8");
        return empty;
    }

    try {
        return normalizeMapObjectsDatabase(JSON.parse(fs.readFileSync(MAP_OBJECTS_FILE, "utf8") || "{}"));
    } catch (err) {
        console.error("Map objects DB load error:", err);
        return createEmptyMapObjectsDatabase();
    }
}

let mapObjectsDb = loadMapObjectsDatabase();
let mapObjectsSaveTimer = null;

function saveMapObjectsDatabaseNow() {
    ensureDataDir();
    mapObjectsDb.updatedAt = Date.now();
    fs.writeFileSync(MAP_OBJECTS_FILE, JSON.stringify(mapObjectsDb, null, 4), "utf8");
}

function saveMapObjectsDatabaseDebounced() {
    clearTimeout(mapObjectsSaveTimer);
    mapObjectsSaveTimer = setTimeout(saveMapObjectsDatabaseNow, 250);
}

function sanitizeDevMapObjectPatch(raw) {
    if (!raw || typeof raw !== "object") return null;

    const kind = String(raw.kind || "");
    if (!["building", "park", "buildingZone", "road"].includes(kind)) return null;

    const id = String(raw.id || raw.name || "").trim().slice(0, 120);
    if (!id) return null;

    const patch = { kind, id, name: String(raw.name || id).slice(0, 120) };

    if (kind === "road") {
        const points = Array.isArray(raw.points) ? raw.points.slice(0, 12) : [];
        patch.points = points
            .map(pt => ({
                x: Math.round(Number(pt?.x)),
                y: Math.round(Number(pt?.y))
            }))
            .filter(pt => Number.isFinite(pt.x) && Number.isFinite(pt.y));
        patch.width = Math.max(24, Math.min(180, Math.round(Number(raw.width) || 72)));
        patch.lanes = Math.max(1, Math.min(8, Math.round(Number(raw.lanes) || 2)));
        if (patch.points.length < 2) return null;
        return patch;
    }

    for (const key of ["x", "y", "w", "h"]) {
        const value = Math.round(Number(raw[key]));
        if (!Number.isFinite(value)) return null;
        patch[key] = value;
    }

    patch.w = Math.max(20, Math.min(1200, patch.w));
    patch.h = Math.max(20, Math.min(900, patch.h));
    if (typeof raw.color === "string") patch.color = raw.color.slice(0, 32);
    if (typeof raw.type === "string") patch.type = raw.type.slice(0, 80);
    return patch;
}

function applyDevMapObjectPatchToDb(patch) {
    const bucketByKind = {
        building: "buildings",
        park: "parks",
        buildingZone: "buildingZones",
        road: "roads"
    };

    const bucket = bucketByKind[patch.kind];
    if (!bucket) return false;

    mapObjectsDb.objects[bucket][patch.id] = {
        ...patch,
        updatedAt: Date.now()
    };
    return true;
}


function devSafeIdServer(text, fallback = "object") {
    return String(text || fallback)
        .trim()
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/[^a-zа-я0-9]+/gi, "_")
        .replace(/^_+|_+$/g, "") || fallback;
}

function devObjectIdServer(kind, obj, index = 0) {
    if (!obj) return `${kind}_${index}`;
    return obj.id || `${kind}_${devSafeIdServer(obj.name || obj.type || "object")}_${index}`;
}

function parseClientArrayFromFile(filePath, varName) {
    const raw = fs.readFileSync(filePath, "utf8");
    const re = new RegExp(`let\\s+${varName}\\s*=\\s*(\\[[\\s\\S]*?\\n\\];)`, "m");
    const match = raw.match(re);
    if (!match) throw new Error(`Не найден массив ${varName} в ${path.basename(filePath)}`);
    const literal = match[1].replace(/;\s*$/, "");
    // Файлы карты содержат только статические литералы массивов.
    // Function здесь используется локально сервером разработчика, не для пользовательского ввода.
    return Function(`"use strict"; return (${literal});`)();
}

function stringifyClientArray(varName, arr) {
    const lines = [`let ${varName} = [`];
    for (const obj of arr) {
        const entries = Object.entries(obj).filter(([, value]) => value !== undefined);
        const parts = entries.map(([key, value]) => {
            const safeKey = /^[a-zA-Z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
            if (Array.isArray(value)) {
                const compact = JSON.stringify(value).replace(/\{"x":/g, "{x:").replace(/,"y":/g, ", y:").replace(/\}/g, "}").replace(/"/g, "");
                return `${safeKey}: ${compact}`;
            }
            if (typeof value === "string") return `${safeKey}: ${JSON.stringify(value)}`;
            if (typeof value === "boolean") return `${safeKey}: ${value}`;
            if (typeof value === "number") return `${safeKey}: ${Number.isFinite(value) ? value : 0}`;
            return `${safeKey}: ${JSON.stringify(value)}`;
        });
        lines.push(`    { ${parts.join(", ")} },`);
    }
    lines.push(`];`);
    return lines.join("\n");
}

function replaceClientArrayInFile(filePath, varName, arr) {
    const raw = fs.readFileSync(filePath, "utf8");
    const re = new RegExp(`let\\s+${varName}\\s*=\\s*\\[[\\s\\S]*?\\n\\];`, "m");
    if (!re.test(raw)) throw new Error(`Не найден массив ${varName} в ${path.basename(filePath)}`);
    const next = raw.replace(re, stringifyClientArray(varName, arr));
    fs.writeFileSync(filePath, next, "utf8");
}

function applyRectPatchToSourceArray(arr, patch, kind) {
    const idx = arr.findIndex((obj, index) => devObjectIdServer(kind, obj, index) === patch.id || obj?.name === patch.name);
    if (idx < 0) return false;
    arr[idx] = {
        ...arr[idx],
        x: patch.x,
        y: patch.y,
        w: patch.w,
        h: patch.h
    };
    if (patch.color) arr[idx].color = patch.color;
    if (patch.type) arr[idx].type = patch.type;
    return true;
}

function applyRoadPatchToSourceArray(arr, patch) {
    const idx = arr.findIndex((obj, index) => devObjectIdServer("road", obj, index) === patch.id || obj?.name === patch.name);
    if (idx < 0) return false;
    arr[idx] = {
        ...arr[idx],
        points: patch.points.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })),
        width: patch.width || arr[idx].width,
        lanes: patch.lanes || arr[idx].lanes
    };
    return true;
}

function patchRecyclingFactoryConst(filePath, factoryPatch) {
    if (!factoryPatch) return;
    let raw = fs.readFileSync(filePath, "utf8");
    const re = /const\s+recyclingFactory\s*=\s*\{[\s\S]*?\n\};/m;
    if (!re.test(raw)) return;
    const obj = {
        name: "Мусороперерабатывающий завод",
        x: factoryPatch.x,
        y: factoryPatch.y,
        w: factoryPatch.w,
        h: factoryPatch.h,
        color: factoryPatch.color || "#3d5861",
        type: "recyclingFactory",
        alwaysVisibleComplex: true
    };
    const lines = ["const recyclingFactory = {"];
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") lines.push(`    ${key}: ${JSON.stringify(value)},`);
        else lines.push(`    ${key}: ${value},`);
    }
    lines.push("};");
    raw = raw.replace(re, lines.join("\n"));
    fs.writeFileSync(filePath, raw, "utf8");
}

function countMapObjectPatches() {
    return ["buildings", "parks", "buildingZones", "roads"]
        .reduce((sum, key) => sum + Object.keys(mapObjectsDb.objects[key] || {}).length, 0);
}

function commitMapObjectsDbToSourceFiles() {
    const total = countMapObjectPatches();
    if (total <= 0) return { ok: false, message: "Нет сохраненных правок карты для переноса в код." };

    const publicJsDir = path.join(__dirname, "public", "js");
    const mapFile = path.join(publicJsDir, "map.js");
    const cityFile = path.join(publicJsDir, "city-layout.js");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");

    const mapBackup = `${mapFile}.bak-${stamp}`;
    const cityBackup = `${cityFile}.bak-${stamp}`;
    fs.copyFileSync(mapFile, mapBackup);
    fs.copyFileSync(cityFile, cityBackup);

    const buildingsSource = parseClientArrayFromFile(mapFile, "buildings");
    const roadsSource = parseClientArrayFromFile(cityFile, "roads");
    const buildingZonesSource = parseClientArrayFromFile(cityFile, "buildingZones");
    const parksSource = parseClientArrayFromFile(cityFile, "parks");

    let applied = 0;
    let skipped = 0;
    let factoryPatch = null;

    for (const patch of Object.values(mapObjectsDb.objects.buildings || {})) {
        if (applyRectPatchToSourceArray(buildingsSource, patch, "building")) {
            applied++;
            if (patch.type === "recyclingFactory" || patch.name === "Мусороперерабатывающий завод") factoryPatch = patch;
        } else skipped++;
    }
    for (const patch of Object.values(mapObjectsDb.objects.parks || {})) {
        if (applyRectPatchToSourceArray(parksSource, patch, "park")) applied++; else skipped++;
    }
    for (const patch of Object.values(mapObjectsDb.objects.buildingZones || {})) {
        if (applyRectPatchToSourceArray(buildingZonesSource, patch, "buildingZone")) applied++; else skipped++;
    }
    for (const patch of Object.values(mapObjectsDb.objects.roads || {})) {
        if (applyRoadPatchToSourceArray(roadsSource, patch)) applied++; else skipped++;
    }

    replaceClientArrayInFile(mapFile, "buildings", buildingsSource);
    replaceClientArrayInFile(cityFile, "roads", roadsSource);
    replaceClientArrayInFile(cityFile, "buildingZones", buildingZonesSource);
    replaceClientArrayInFile(cityFile, "parks", parksSource);
    patchRecyclingFactoryConst(mapFile, factoryPatch);

    mapObjectsDb = createEmptyMapObjectsDatabase();
    saveMapObjectsDatabaseNow();

    return {
        ok: true,
        applied,
        skipped,
        backups: [path.basename(mapBackup), path.basename(cityBackup)],
        message: `Перенесено в основные координаты: ${applied}. Пропущено: ${skipped}.`
    };
}

function cleanLogin(login) {
    // Логин хранится в нижнем регистре: вход не зависит от регистра.
    // Разрешены только английские буквы, цифры и обычные символы.
    return String(login || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_\-.@]/g, "")
        .slice(0, 18);
}

function cleanPassword(password) {
    // Пароль строг к регистру: Pass123 и pass123 — разные пароли.
    // В отличие от логина, пароль НЕ переводится в нижний регистр.
    return String(password || "")
        .trim()
        .replace(/[^A-Za-z0-9_\-.!@#$%^&*+=?]/g, "")
        .slice(0, 24);
}

function cleanNickname(nickname) {
    return String(nickname || "")
        .trim()
        .replace(/[^A-Za-zА-Яа-яЁё0-9 _\-.!@#$%^&*+=?]/g, "")
        .slice(0, 16);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
    const hash = crypto
        .createHash("sha256")
        .update(String(password || "") + salt)
        .digest("hex");

    return { salt, hash };
}

// ===============================
// ⚖️ BALANCE
// ===============================
const CLEANER_MAX_LEVEL = 10;
const CLEANER_ENERGY_COST = 10;
const CLEANER_BASE_XP_REWARD = 15;
const CLEANER_JOB_XP_REWARD = 25;
const BASE_INVENTORY_SLOTS = 10;
const BACKPACK_BONUS_SLOTS = 5;
const BACKPACK_PRICE = 1000;

const AVATAR_OPTIONS = {
    genders: ["male", "female"],
    bodyTypes: ["slim", "normal", "strong"],
    hairStyles: ["short", "medium", "long", "cap"],
    clothingStyles: ["street", "business", "sport", "worker"]
};

const CLOTHING_COLORS = {
    blue: "#58c7ff",
    black: "#1f2937",
    red: "#ff4d5a",
    green: "#81f04f",
    yellow: "#ffc233",
    orange: "#ff9f1a",
    purple: "#b85cff",
    white: "#e8eef7"
};

function createDefaultAvatar() {
    return {
        gender: "male",
        bodyType: "normal",
        hairStyle: "short",
        clothingStyle: "street",
        clothingColor: "blue",
        setupDone: false
    };
}

function normalizeAvatar(raw) {
    const avatar = Object.assign(createDefaultAvatar(), raw || {});

    if (!AVATAR_OPTIONS.genders.includes(avatar.gender)) avatar.gender = "male";
    if (!AVATAR_OPTIONS.bodyTypes.includes(avatar.bodyType)) avatar.bodyType = "normal";
    if (!AVATAR_OPTIONS.hairStyles.includes(avatar.hairStyle)) avatar.hairStyle = "short";
    if (!AVATAR_OPTIONS.clothingStyles.includes(avatar.clothingStyle)) avatar.clothingStyle = "street";
    if (!CLOTHING_COLORS[avatar.clothingColor]) avatar.clothingColor = "blue";
    avatar.setupDone = !!avatar.setupDone;

    return avatar;
}


function createCleanerWorkAvatar(baseAvatar) {
    const base = normalizeAvatar(baseAvatar || createDefaultAvatar());
    return normalizeAvatar({
        gender: base.gender,
        bodyType: base.bodyType,
        hairStyle: base.hairStyle,
        clothingStyle: "worker",
        clothingColor: "orange",
        setupDone: base.setupDone
    });
}

function getStandardAvatar(player) {
    player.standardAvatar = normalizeAvatar(player.standardAvatar || player.avatar || createDefaultAvatar());
    return player.standardAvatar;
}

function getEffectiveAvatar(player) {
    const base = getStandardAvatar(player);
    if (player.job === "Дворник" && player.cleanerOnShift) {
        return createCleanerWorkAvatar(base);
    }
    return normalizeAvatar(base);
}

function setCleanerShift(player, enabled) {
    getStandardAvatar(player);
    player.cleanerOnShift = player.job === "Дворник" ? !!enabled : false;
    player.avatar = getEffectiveAvatar(player);
}

function createDefaultCharacter(playerId, login, nickname = "") {
    return {
        playerId,
        login,
        name: cleanNickname(nickname) || login || ("Player_" + playerId),

        x: 100,
        y: 100,
        energy: 100,
        money: 1000,

        level: 1,
        xp: 0,

        job: "Без работы",
        cleanerOnShift: false,
        standardAvatar: null,
        jobStats: {
            "Дворник": { level: 1, xp: 0 },
            "Санитар": { level: 1, xp: 0 }
        },

        inventory: {
            slots: BASE_INVENTORY_SLOTS,
            trash: 0,
            trashMax: BASE_INVENTORY_SLOTS,
            baseSlots: BASE_INVENTORY_SLOTS,
            backpackBonus: 0
        },

        hasBackpack: false,

        avatar: createDefaultAvatar(),
        standardAvatar: createDefaultAvatar(),

        lastLogoutAt: null,
        lastLogoutPosition: { x: 100, y: 100 },

        createdAt: Date.now(),
        updatedAt: Date.now()
    };
}

function normalizeJobStats(character) {
    character.jobStats = character.jobStats || {};

    for (const jobName of ["Дворник", "Санитар"]) {
        const stat = character.jobStats[jobName] || {};
        character.jobStats[jobName] = {
            level: Math.max(1, Math.min(CLEANER_MAX_LEVEL, Number(stat.level) || 1)),
            xp: Math.max(0, Number(stat.xp) || 0)
        };
    }
}

function getInventoryMaxSlots(player) {
    return BASE_INVENTORY_SLOTS + (player.hasBackpack ? BACKPACK_BONUS_SLOTS : 0);
}

function ensureInventory(player) {
    normalizeJobStats(player);

    // Общий размер инвентаря может увеличиваться рюкзаком,
    // но переносимый мусор всегда ограничен 10 штуками.
    // Сам мусор хранится одним стаком в одной ячейке: обычной или рюкзачной.
    const maxSlots = getInventoryMaxSlots(player);
    const trashMax = BASE_INVENTORY_SLOTS;

    player.inventory = player.inventory || {};
    player.inventory.slots = maxSlots;
    player.inventory.trashMax = trashMax;
    player.inventory.baseSlots = BASE_INVENTORY_SLOTS;
    player.inventory.backpackBonus = player.hasBackpack ? BACKPACK_BONUS_SLOTS : 0;

    let items = Array.isArray(player.inventory.items) ? player.inventory.items : [];
    items = items.slice(0, maxSlots);
    while (items.length < maxSlots) items.push(null);

    // Миграция старого формата, где мусор был просто числом.
    const legacyTrash = Math.max(0, Math.min(trashMax, Number(player.inventory.trash) || 0));
    let trashSlot = items.findIndex((item) => item && item.type === "trash");

    // Если старый мусор есть, но стака нет — кладём его в первую свободную ячейку.
    if (legacyTrash > 0 && trashSlot === -1) {
        const freeSlot = items.findIndex((item) => !item);
        trashSlot = freeSlot >= 0 ? freeSlot : 0;
        items[trashSlot] = { type: "trash", name: "Мусор", count: legacyTrash, max: trashMax };
    }

    // Если каким-то образом появилось несколько стаков мусора — объединяем в первый найденный.
    let totalTrash = 0;
    let firstTrashSlot = -1;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item || item.type !== "trash") continue;
        if (firstTrashSlot === -1) firstTrashSlot = i;
        totalTrash += Math.max(0, Number(item.count) || 0);
        if (i !== firstTrashSlot) items[i] = null;
    }

    totalTrash = Math.max(0, Math.min(trashMax, totalTrash));
    if (totalTrash > 0) {
        if (firstTrashSlot === -1) {
            const freeSlot = items.findIndex((item) => !item);
            firstTrashSlot = freeSlot >= 0 ? freeSlot : 0;
        }
        items[firstTrashSlot] = { type: "trash", name: "Мусор", count: totalTrash, max: trashMax };
        player.inventory.trashSlot = firstTrashSlot;
    } else {
        if (firstTrashSlot >= 0) items[firstTrashSlot] = null;
        player.inventory.trashSlot = -1;
    }

    player.inventory.items = items;
    player.inventory.trash = totalTrash;

    return player.inventory;
}

function getTrashCount(player) {
    const inventory = ensureInventory(player);
    return Math.max(0, Math.min(inventory.trashMax, Number(inventory.trash) || 0));
}

function findTrashSlot(inventory) {
    if (!inventory || !Array.isArray(inventory.items)) return -1;
    return inventory.items.findIndex((item) => item && item.type === "trash");
}

function addTrashToInventory(player, amount = 1) {
    const inventory = ensureInventory(player);
    const current = getTrashCount(player);
    const add = Math.max(1, Number(amount) || 1);

    if (current + add > inventory.trashMax) return false;

    let trashSlot = findTrashSlot(inventory);
    if (trashSlot === -1) {
        trashSlot = inventory.items.findIndex((item) => !item);
        if (trashSlot === -1) return false;
    }

    const nextCount = current + add;
    inventory.items[trashSlot] = {
        type: "trash",
        name: "Мусор",
        count: nextCount,
        max: inventory.trashMax
    };
    inventory.trash = nextCount;
    inventory.trashSlot = trashSlot;
    return true;
}

function clearTrashFromInventory(player) {
    const inventory = ensureInventory(player);

    for (let i = 0; i < inventory.items.length; i++) {
        if (inventory.items[i] && inventory.items[i].type === "trash") {
            inventory.items[i] = null;
        }
    }

    inventory.trash = 0;
    inventory.trashSlot = -1;
    return inventory;
}

function syncActiveJobStats(player) {
    normalizeJobStats(player);

    if (player.job && player.job !== "Без работы" && player.jobStats[player.job]) {
        player.jobLevel = player.jobStats[player.job].level;
        player.jobXP = player.jobStats[player.job].xp;
    } else {
        player.job = "Без работы";
        player.jobLevel = 1;
        player.jobXP = 0;
    }
}

function normalizeCharacter(character) {
    character.x = Number(character.x) || 100;
    character.y = Number(character.y) || 100;
    character.angle = Number.isFinite(Number(character.angle)) ? Number(character.angle) : -Math.PI / 2;
    character.targetAngle = Number.isFinite(Number(character.targetAngle)) ? Number(character.targetAngle) : character.angle;
    character.velX = Number.isFinite(Number(character.velX)) ? Number(character.velX) : 0;
    character.velY = Number.isFinite(Number(character.velY)) ? Number(character.velY) : 0;
    character.moving = !!character.moving;
    character.cleaningTrashId = character.cleaningTrashId || null;
    character.cleaningStartedAt = Number(character.cleaningStartedAt) || 0;
    character.cleaningUntil = Number(character.cleaningUntil) || 0;
    if (character.cleaningUntil <= Date.now()) clearPlayerCleaningState(character);
    character.energy = Math.max(0, Math.min(100, Number(character.energy) || 100));
    character.money = Math.max(0, Number(character.money) || 0);
    character.level = Math.max(1, Number(character.level) || 1);
    character.xp = Math.max(0, Number(character.xp) || 0);
    character.job = character.job || "Без работы";
    character.cleanerOnShift = character.job === "Дворник" ? !!character.cleanerOnShift : false;
    character.standardAvatar = normalizeAvatar(character.standardAvatar || character.avatar || createDefaultAvatar());
    character.lastLogoutPosition = character.lastLogoutPosition || { x: character.x, y: character.y };
    character.hasBackpack = !!character.hasBackpack;
    character.avatar = getEffectiveAvatar(character);
    ensureInventory(character);
    syncActiveJobStats(character);
    character.updatedAt = Date.now();
    return character;
}

function serializePlayerForClient(player) {
    normalizeCharacter(player);

    return {
        playerId: player.playerId,
        login: player.login,
        x: player.x,
        y: player.y,
        angle: player.angle ?? -Math.PI / 2,
        targetAngle: player.targetAngle ?? player.angle ?? -Math.PI / 2,
        velX: player.velX || 0,
        velY: player.velY || 0,
        moving: !!player.moving,
        cleaningTrashId: player.cleaningTrashId || null,
        cleaningStartedAt: Number(player.cleaningStartedAt) || 0,
        cleaningUntil: Number(player.cleaningUntil) || 0,
        energy: player.energy,
        money: player.money,
        level: player.level,
        xp: player.xp,
        job: player.job,
        cleanerOnShift: !!player.cleanerOnShift,
        jobLevel: player.jobLevel,
        jobXP: player.jobXP,
        jobStats: player.jobStats,
        inventory: player.inventory,
        hasBackpack: player.hasBackpack,
        avatar: getEffectiveAvatar(player),
        standardAvatar: getStandardAvatar(player),
        lastLogoutAt: player.lastLogoutAt || null,
        lastLogoutPosition: player.lastLogoutPosition || { x: player.x, y: player.y },
        name: player.name
    };
}

function serializePlayers() {
    const result = {};

    for (const socketId in players) {
        const player = players[socketId];
        if (!player) continue;
        result[socketId] = serializePlayerForClient(player);
    }

    return result;
}

function savePlayer(player) {
    if (!player || !player.login || !db.accounts[player.login]) return;
    normalizeCharacter(player);
    player.lastLogoutPosition = { x: Math.round(player.x), y: Math.round(player.y) };
    db.accounts[player.login].character = player;
    db.accounts[player.login].updatedAt = Date.now();
    saveDatabaseDebounced();
}

function addXP(player, amount) {
    player.xp += amount;

    while (player.xp >= player.level * 100) {
        const need = player.level * 100;
        player.xp -= need;
        player.level++;
    }
}

function addJobXP(player, amount) {
    if (!player.job || player.job === "Без работы") return;

    normalizeJobStats(player);
    const stat = player.jobStats[player.job];
    if (!stat) return;

    stat.level = Math.max(1, Math.min(CLEANER_MAX_LEVEL, stat.level || 1));

    if (stat.level >= CLEANER_MAX_LEVEL) {
        stat.level = CLEANER_MAX_LEVEL;
        stat.xp = 0;
        syncActiveJobStats(player);
        return;
    }

    stat.xp += amount;

    while (stat.xp >= stat.level * 100 && stat.level < CLEANER_MAX_LEVEL) {
        const need = stat.level * 100;
        stat.xp -= need;
        stat.level++;
    }

    if (stat.level >= CLEANER_MAX_LEVEL) {
        stat.level = CLEANER_MAX_LEVEL;
        stat.xp = 0;
    }

    syncActiveJobStats(player);
}

function getCleanerMoneyReward(player) {
    normalizeJobStats(player);
    const level = player.jobStats["Дворник"]?.level || 1;
    return Math.max(1, Math.min(CLEANER_MAX_LEVEL, level));
}

function isNearRect(player, rect, distance = 28) {
    const px = player.x + 10;
    const py = player.y + 10;

    const closestX = Math.max(rect.x, Math.min(px, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(py, rect.y + rect.h));

    const dx = px - closestX;
    const dy = py - closestY;

    return Math.sqrt(dx * dx + dy * dy) <= distance;
}

// Серверные зоны должны совпадать с клиентскими зданиями.
// Раньше тут были меньшие размеры, из-за чего действие срабатывало на клиенте,
// но отклонялось сервером у части здания.
const TRASH_DEPOSIT_ZONE = { name: "Мусорка", x: 555, y: 700, w: 90, h: 58 };
const SHOP_ZONE = { name: "Магазин", x: 1160, y: 500, w: 260, h: 130 };

// ===============================
// 🎮 ONLINE STATE
// ===============================
let players = {};
let inputs = {};
let trashItems = trashDb.items || {};
let trashIdCounter = Math.max(1, Number(trashDb.nextTrashId) || 1);
let lastTrashSpawn = Number(trashDb.lastTrashSpawn) || Date.now();


// ===============================
// 🧹 CLEANING STATE
// Серверный замок уборки: один мусор может убирать только один дворник.
// Эти функции объявлены до входа игроков, чтобы старые персонажи из базы
// не падали при normalizeCharacter().
// ===============================
const CLEAN_TRASH_DURATION = 1000;
const activeCleaningTimers = new Map();

function clearPlayerCleaningState(player) {
    if (!player) return;
    player.cleaningTrashId = null;
    player.cleaningStartedAt = 0;
    player.cleaningUntil = 0;
}

function clearTrashCleaningLock(trash) {
    if (!trash) return;
    delete trash.cleaningBy;
    delete trash.cleaningByName;
    delete trash.cleaningStartedAt;
    delete trash.cleaningUntil;
}

function isTrashLockedByOther(trash, player) {
    if (!trash) return false;

    const now = Date.now();
    const until = Number(trash.cleaningUntil) || 0;

    // Просроченный замок снимаем автоматически.
    if (until <= now) {
        clearTrashCleaningLock(trash);
        return false;
    }

    const ownerId = Number(trash.cleaningBy) || 0;
    return !!ownerId && ownerId !== Number(player?.playerId || 0);
}

function findOnlinePlayerByPlayerId(playerId) {
    for (const socketId of Object.keys(players)) {
        const p = players[socketId];
        if (p && Number(p.playerId) === Number(playerId)) {
            return { socketId, player: p };
        }
    }
    return null;
}

function finishTrashCleaning(socketId, playerId, trashId) {
    activeCleaningTimers.delete(trashId);

    const trash = trashItems[trashId];
    const online = players[socketId] && Number(players[socketId].playerId) === Number(playerId)
        ? { socketId, player: players[socketId] }
        : findOnlinePlayerByPlayerId(playerId);

    const player = online?.player || null;

    // Если игрок вышел во время уборки — мусор просто разблокируется.
    if (!trash || !player) {
        if (trash) {
            clearTrashCleaningLock(trash);
            saveTrashDatabaseDebounced();
            io.emit("trashItems", trashItems);
        }
        return;
    }

    const isOwner = Number(trash.cleaningBy) === Number(player.playerId);
    if (!isOwner) {
        clearPlayerCleaningState(player);
        io.emit("players", serializePlayers());
        return;
    }

    const inventory = ensureInventory(player);

    if (player.job !== "Дворник" || !player.cleanerOnShift) {
        clearTrashCleaningLock(trash);
        clearPlayerCleaningState(player);
        io.to(online.socketId).emit("inventoryNotice", {
            title: "УБОРКА ОТМЕНЕНА",
            text: "Ты не на смене дворника.",
            color: "yellow",
            icon: "⚠"
        });
        saveTrashDatabaseDebounced();
        io.emit("trashItems", trashItems);
        io.emit("players", serializePlayers());
        return;
    }

    if (getTrashCount(player) >= inventory.trashMax) {
        clearTrashCleaningLock(trash);
        clearPlayerCleaningState(player);
        io.to(online.socketId).emit("inventoryFull", {
            title: "ИНВЕНТАРЬ ЗАПОЛНЕН",
            text: "Сначала сдай мусор."
        });
        saveTrashDatabaseDebounced();
        io.emit("trashItems", trashItems);
        io.emit("players", serializePlayers());
        return;
    }

    if (player.energy < CLEANER_ENERGY_COST) {
        clearTrashCleaningLock(trash);
        clearPlayerCleaningState(player);
        io.to(online.socketId).emit("inventoryNotice", {
            title: "НЕДОСТАТОЧНО ЭНЕРГИИ",
            text: "Для уборки нужно 10 энергии.",
            color: "yellow",
            icon: "⚡"
        });
        saveTrashDatabaseDebounced();
        io.emit("trashItems", trashItems);
        io.emit("players", serializePlayers());
        return;
    }

    player.energy = Math.max(0, player.energy - CLEANER_ENERGY_COST);
    if (!addTrashToInventory(player, 1)) {
        clearTrashCleaningLock(trash);
        clearPlayerCleaningState(player);
        io.to(online.socketId).emit("inventoryFull", {
            title: "ИНВЕНТАРЬ ЗАПОЛНЕН",
            text: "Сначала сдай мусор."
        });
        saveTrashDatabaseDebounced();
        io.emit("trashItems", trashItems);
        io.emit("players", serializePlayers());
        return;
    }
    clearPlayerCleaningState(player);
    delete trashItems[trashId];

    savePlayer(player);
    saveTrashDatabaseDebounced();

    io.to(online.socketId).emit("inventoryNotice", {
        title: "МУСОР ПОДНЯТ",
        text: `В инвентаре: ${getTrashCount(player)}/${inventory.trashMax}`,
        color: "green",
        icon: "🧹"
    });

    io.emit("trashItems", trashItems);
    io.emit("players", serializePlayers());
}

// ===============================
// 🗑️ TRASH SPAWN ZONES — MEGACITY ROADS
// Мусор спавнится только на сервере, внутри полотна дорог/проулков, с учетом изгибов.
// ===============================
const TRASH_ROADS = [
    { name: "пр. Life City", width: 96, points: [{x: 720, y: -360}, {x: 720, y: 1460}] },
    { name: "пр. Центральный", width: 100, points: [{x: -650, y: 420}, {x: 2150, y: 420}] },
    { name: "ш. Южное", width: 112, points: [{x: -700, y: 980}, {x: 2250, y: 980}] },
    { name: "пр. Северный", width: 78, points: [{x: -650, y: 120}, {x: 2150, y: 120}] },
    { name: "ул. Западная", width: 58, points: [{x: 220, y: -300}, {x: 220, y: 1360}] },
    { name: "ул. Деловая", width: 74, points: [{x: 1080, y: -300}, {x: 1080, y: 1360}] },
    { name: "ул. Восточная", width: 60, points: [{x: 1520, y: -300}, {x: 1520, y: 1360}] },
    { name: "ул. Торговая", width: 62, points: [{x: -520, y: 650}, {x: 1960, y: 650}] },
    { name: "пер. Кафейный", width: 32, points: [{x: 220, y: 260}, {x: 720, y: 260}] },
    { name: "пер. Зеленый", width: 34, points: [{x: 430, y: 420}, {x: 430, y: 980}] }
];

const TRASH_EDGE_PADDING = 12;
const TRASH_MIN_DISTANCE = 45;
const TRASH_SPAWN_ATTEMPTS = 80;

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function getRoadSegments(road) {
    const segments = [];
    for (let i = 0; i < road.points.length - 1; i++) {
        const a = road.points[i];
        const b = road.points[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 1) segments.push({ a, b, dx, dy, len });
    }
    return segments;
}

function getRandomPointOnRoad(road) {
    const segments = getRoadSegments(road);
    if (!segments.length) return null;

    const totalLength = segments.reduce((sum, s) => sum + s.len, 0);
    let pick = Math.random() * totalLength;
    let seg = segments[0];

    for (let s of segments) {
        pick -= s.len;
        if (pick <= 0) { seg = s; break; }
    }

    const t = Math.random();
    const centerX = seg.a.x + seg.dx * t;
    const centerY = seg.a.y + seg.dy * t;
    const nx = -seg.dy / seg.len;
    const ny = seg.dx / seg.len;
    const maxOffset = Math.max(0, road.width / 2 - TRASH_EDGE_PADDING);
    const offset = randomBetween(-maxOffset, maxOffset);

    return {
        x: Math.round(centerX + nx * offset),
        y: Math.round(centerY + ny * offset)
    };
}

function isTrashPointFree(point) {
    for (let id in trashItems) {
        const trash = trashItems[id];
        if (!trash) continue;

        const dx = point.x - trash.x;
        const dy = point.y - trash.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < TRASH_MIN_DISTANCE) return false;
    }

    return true;
}

function getRandomTrashSpawnPoint() {
    for (let i = 0; i < TRASH_SPAWN_ATTEMPTS; i++) {
        const road = TRASH_ROADS[Math.floor(Math.random() * TRASH_ROADS.length)];
        const point = getRandomPointOnRoad(road);
        if (isTrashPointFree(point)) return point;
    }

    return null;
}

function spawnTrash() {
    const point = getRandomTrashSpawnPoint();
    if (!point) return false;

    const id = "trash_" + trashIdCounter++;
    trashItems[id] = { id, x: point.x, y: point.y };
    trashDb.items = trashItems;
    trashDb.nextTrashId = trashIdCounter;
    saveTrashDatabaseDebounced();
    return true;
}

function getPlayer(socket) {
    return players[socket.id] || null;
}

function serializeProfileForClient(player) {
    normalizeCharacter(player);

    // В профиль не отправляем логин, пароль, энергию и инвентарь.
    const activeJob = player.job || "Без работы";
    const avatar = normalizeAvatar(player.avatar);

    return {
        playerId: player.playerId,
        name: player.name,
        money: player.money,
        level: player.level,
        xp: player.xp,
        job: activeJob,
        jobLevel: activeJob !== "Без работы" ? player.jobLevel : 0,
        jobXP: activeJob !== "Без работы" ? player.jobXP : 0,
        jobStats: player.jobStats,
        hasBackpack: !!player.hasBackpack,
        avatar,
        position: { x: Math.round(player.x), y: Math.round(player.y) },
        lastLogoutAt: player.lastLogoutAt || null,
        createdAt: player.createdAt || null
    };
}



// ===============================
// 💬 CHAT DATABASE
// Сервер хранит чат, но игрок при входе получает только сообщения за последние 10 минут.
// ===============================
function createEmptyChatDatabase() {
    return {
        version: 1,
        nextMessageId: 1,
        messages: []
    };
}

function loadChatDatabase() {
    ensureDataDir();
    if (!fs.existsSync(CHAT_DB_FILE)) {
        const empty = createEmptyChatDatabase();
        fs.writeFileSync(CHAT_DB_FILE, JSON.stringify(empty, null, 4), "utf8");
        return empty;
    }

    try {
        const raw = fs.readFileSync(CHAT_DB_FILE, "utf8");
        const data = JSON.parse(raw || "{}");
        data.version = data.version || 1;
        data.nextMessageId = Math.max(1, Number(data.nextMessageId) || 1);
        data.messages = Array.isArray(data.messages) ? data.messages : [];
        for (const m of data.messages) {
            const n = Number(String(m.id || "").replace("msg_", ""));
            if (!Number.isNaN(n)) data.nextMessageId = Math.max(data.nextMessageId, n + 1);
        }
        return data;
    } catch (err) {
        console.error("Chat DB load error:", err);
        return createEmptyChatDatabase();
    }
}

let chatDb = loadChatDatabase();
let chatSaveTimer = null;
const CHAT_HISTORY_MS = 10 * 60 * 1000;
const CHAT_CHANNELS_ALLOWED = new Set(["general", "nearby", "news", "admin", "private"]);

function pruneOldChatMessages() {
    const cutoff = Date.now() - CHAT_HISTORY_MS;
    // Общие каналы чистим по времени, личные сообщения не удаляем автоматически.
    const storageCutoff = Date.now() - 24 * 60 * 60 * 1000;
    chatDb.messages = chatDb.messages.filter(m => {
        if (m.channel === "private") return true;
        return Number(m.time) >= storageCutoff;
    });
    return chatDb.messages.filter(m => {
        if (m.channel === "private") return true;
        return Number(m.time) >= cutoff;
    });
}

function saveChatDatabaseNow() {
    ensureDataDir();
    pruneOldChatMessages();
    fs.writeFileSync(CHAT_DB_FILE, JSON.stringify(chatDb, null, 4), "utf8");
}

function saveChatDatabaseDebounced() {
    clearTimeout(chatSaveTimer);
    chatSaveTimer = setTimeout(() => {
        try { saveChatDatabaseNow(); } catch (err) { console.error("Chat DB save error:", err); }
    }, 250);
}

function serializeChatMessage(message) {
    return {
        id: message.id,
        channel: message.channel,
        playerId: message.playerId,
        name: message.name,
        text: message.text,
        time: message.time,
        toPlayerId: message.toPlayerId || null,
        toName: message.toName || null,
        replyTo: message.replyTo || null,
        replyPreview: message.replyPreview || null
    };
}

function getRecentChatForPlayer(player) {
    // Игрок получает общие каналы только за последние 10 минут,
    // а личные диалоги — всю сохранённую историю.
    const recent = pruneOldChatMessages();
    return recent
        .filter(m => canPlayerSeeChatMessage(player, m))
        .map(serializeChatMessage);
}

function canPlayerSeeChatMessage(player, message) {
    if (!player || !message) return false;

    if (message.channel === "private") {
        return message.playerId === player.playerId || message.toPlayerId === player.playerId;
    }

    if (message.channel !== "nearby") return true;

    // Канал рядом виден только в радиусе рядом с отправителем.
    if (message.playerId === player.playerId) return true;
    const dx = (Number(player.x) || 0) - (Number(message.x) || 0);
    const dy = (Number(player.y) || 0) - (Number(message.y) || 0);
    return Math.hypot(dx, dy) <= 520;
}

function emitChatMessageToVisiblePlayers(message) {
    const payload = serializeChatMessage(message);
    for (const socketId of Object.keys(players)) {
        const p = players[socketId];
        if (!p || !canPlayerSeeChatMessage(p, message)) continue;
        io.to(socketId).emit("chatMessage", payload);
    }
}

function cleanChatText(text) {
    return String(text || "")
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .trim()
        .slice(0, 240);
}

// ===============================
// 🔌 SOCKETS
// ===============================
io.on("connection", (socket) => {
    socket.emit("authRequired", { message: "Войди или создай персонажа" });
    socket.emit("trashItems", trashItems);
    socket.emit("mapObjectsState", mapObjectsDb.objects);

    function finishAuth(account) {
        const character = normalizeCharacter(account.character);
        players[socket.id] = character;

        socket.emit("authOk", {
            playerId: character.playerId,
            login: character.login,
            character: serializePlayerForClient(character)
        });
        socket.emit("trashItems", trashItems);
        socket.emit("chatHistory", getRecentChatForPlayer(character));
        io.emit("players", serializePlayers());
        io.emit("onlineCount", Object.keys(players).length);
    }

    socket.on("register", (data) => {
        // Поддерживаем оба окна авторизации:
        // canvas-форма отправляет nickname/passwordRepeat,
        // HTML-форма из последних патчей отправляла nick/name/repeat.
        const login = cleanLogin(data?.login || data?.username);
        const password = cleanPassword(data?.password);
        const passwordRepeat = cleanPassword(data?.passwordRepeat ?? data?.repeat ?? data?.confirmPassword ?? data?.password);
        const nickname = cleanNickname(data?.nickname ?? data?.nick ?? data?.name);

        if (login.length < 3 || password.length < 3) {
            socket.emit("authError", "Логин и пароль минимум 3 символа");
            return;
        }

        if (nickname.length < 2) {
            socket.emit("authError", "Ник минимум 2 символа");
            return;
        }

        if (password !== passwordRepeat) {
            socket.emit("authError", "Пароли не совпадают");
            return;
        }

        if (db.accounts[login]) {
            socket.emit("authError", "Такой логин уже занят");
            return;
        }

        const playerId = db.nextPlayerId++;
        const { salt, hash } = hashPassword(password);

        db.accounts[login] = {
            id: playerId,
            login,
            passwordSalt: salt,
            passwordHash: hash,
            character: createDefaultCharacter(playerId, login, nickname),
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        saveDatabaseNow();
        finishAuth(db.accounts[login]);
    });

    socket.on("login", (data) => {
        const login = cleanLogin(data?.login);
        const password = cleanPassword(data?.password);
        const account = db.accounts[login];

        if (!account) {
            socket.emit("authError", "Персонаж не найден");
            return;
        }

        const { hash } = hashPassword(password, account.passwordSalt);

        if (hash !== account.passwordHash) {
            socket.emit("authError", "Неверный пароль");
            return;
        }

        finishAuth(account);
    });

    socket.on("pingCheck", (start) => {
        socket.emit("pongCheck", start);
    });

    socket.on("requestProfile", (data) => {
        const requester = getPlayer(socket);
        if (!requester) return;

        const requestedId = Number(data?.playerId) || requester.playerId;
        let target = requester;

        for (const id of Object.keys(players)) {
            if (players[id]?.playerId === requestedId) {
                target = players[id];
                break;
            }
        }

        // Если игрок офлайн, ищем его персонажа в базе по ID.
        if (target.playerId !== requestedId) {
            for (const login of Object.keys(db.accounts)) {
                const account = db.accounts[login];
                if (account?.character?.playerId === requestedId) {
                    target = normalizeCharacter(account.character);
                    break;
                }
            }
        }

        socket.emit("profileData", serializeProfileForClient(target));
    });

    socket.on("sendChatMessage", (data) => {
        const p = getPlayer(socket);
        if (!p) return;

        const channel = CHAT_CHANNELS_ALLOWED.has(String(data?.channel)) ? String(data.channel) : "general";
        const text = cleanChatText(data?.text);
        if (!text) return;

        let toPlayerId = null;
        let toName = null;

        if (channel === "private") {
            toPlayerId = Number(data?.toPlayerId) || 0;
            if (!toPlayerId || toPlayerId === p.playerId) {
                socket.emit("chatError", "Выбери игрока для личного сообщения");
                return;
            }

            for (const sid of Object.keys(players)) {
                const candidate = players[sid];
                if (candidate?.playerId === toPlayerId) {
                    toName = candidate.name || "Игрок";
                    break;
                }
            }

            if (!toName) {
                for (const login of Object.keys(db.accounts)) {
                    const account = db.accounts[login];
                    if (account?.character?.playerId === toPlayerId) {
                        toName = account.character.name || "Игрок";
                        break;
                    }
                }
            }

            if (!toName) {
                socket.emit("chatError", "Игрок не найден");
                return;
            }
        }

        // Новости и администрацию оставляем как отдельные каналы на будущее.
        // Пока писать туда можно, но вся проверка проходит через сервер.
        const replyTo = data?.replyTo ? String(data.replyTo) : null;
        let replyPreview = null;
        if (replyTo) {
            const original = chatDb.messages.find(m => m.id === replyTo);
            if (original) {
                replyPreview = {
                    id: original.id,
                    name: original.name,
                    text: String(original.text || "").slice(0, 80)
                };
            }
        }

        const message = {
            id: "msg_" + chatDb.nextMessageId++,
            channel,
            playerId: p.playerId,
            name: p.name || "Игрок",
            text,
            time: Date.now(),
            x: Number(p.x) || 0,
            y: Number(p.y) || 0,
            toPlayerId,
            toName,
            replyTo,
            replyPreview
        };

        chatDb.messages.push(message);
        pruneOldChatMessages();
        saveChatDatabaseDebounced();
        emitChatMessageToVisiblePlayers(message);
    });

    socket.on("move", (data) => {
        const p = getPlayer(socket);
        if (!p) return;

        if (Number(p.cleaningUntil) > Date.now()) {
            p.velX = 0;
            p.velY = 0;
            p.moving = false;
            inputs[socket.id] = {
                dirX: 0,
                dirY: 0,
                angle: p.angle,
                targetAngle: p.targetAngle,
                timestamp: Date.now()
            };
            return;
        }

        const dirX = Number(data?.dirX) || 0;
        const dirY = Number(data?.dirY) || 0;
        const angle = Number(data?.angle);
        const targetAngle = Number(data?.targetAngle);
        const velX = Number(data?.velX);
        const velY = Number(data?.velY);
        const clientX = Number(data?.x);
        const clientY = Number(data?.y);

        if (Number.isFinite(angle)) p.angle = angle;
        if (Number.isFinite(targetAngle)) p.targetAngle = targetAngle;
        if (Number.isFinite(velX)) p.velX = velX;
        if (Number.isFinite(velY)) p.velY = velY;
        p.moving = Math.hypot(dirX, dirY) > 0.02;

        // Мягкая коррекция серверной позиции по данным клиента, без резких телепортов.
        // Сервер всё ещё двигает персонажа по input, но принимает точное направление/анимацию.
        if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
            const dx = clientX - p.x;
            const dy = clientY - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 90) {
                p.x += dx * 0.35;
                p.y += dy * 0.35;
            }
        }

        inputs[socket.id] = {
            dirX,
            dirY,
            angle: Number.isFinite(angle) ? angle : p.angle,
            targetAngle: Number.isFinite(targetAngle) ? targetAngle : p.targetAngle,
            timestamp: Date.now()
        };
    });

    socket.on("moveStop", (data) => {
        const p = getPlayer(socket);
        if (!p) return;

        const newX = Number(data?.x);
        const newY = Number(data?.y);
        const angle = Number(data?.angle);
        const targetAngle = Number(data?.targetAngle);

        if (Number.isFinite(newX)) p.x = newX;
        if (Number.isFinite(newY)) p.y = newY;
        if (Number.isFinite(angle)) p.angle = angle;
        if (Number.isFinite(targetAngle)) p.targetAngle = targetAngle;

        p.velX = 0;
        p.velY = 0;
        p.moving = false;

        inputs[socket.id] = {
            dirX: 0,
            dirY: 0,
            angle: p.angle,
            targetAngle: p.targetAngle,
            timestamp: Date.now()
        };

        // Сразу рассылаем точную остановку, чтобы другие игроки не видели рассинхрон.
        io.emit("players", serializePlayers());
        savePlayer(p);
    });

    socket.on("cleanTrash", (trashId) => {
        const p = getPlayer(socket);
        if (!p) return;

        const trash = trashItems[trashId];
        if (!trash) return;
        if (p.job !== "Дворник") return;
        if (!p.cleanerOnShift) {
            socket.emit("inventoryNotice", { title: "НЕ НА СМЕНЕ", text: "Выйди на смену у мусорки.", color: "yellow", icon: "💼" });
            return;
        }

        const now = Date.now();
        if (Number(p.cleaningUntil) > now) return;

        if (isTrashLockedByOther(trash, p)) {
            socket.emit("inventoryNotice", {
                title: "МУСОР УЖЕ УБИРАЮТ",
                text: `${trash.cleaningByName || "Другой дворник"} уже начал уборку.`,
                color: "yellow",
                icon: "⚠"
            });
            return;
        }

        const inventory = ensureInventory(p);

        if (getTrashCount(p) >= inventory.trashMax) {
            socket.emit("inventoryFull", {
                title: "ИНВЕНТАРЬ ЗАПОЛНЕН",
                text: "Сначала сдай мусор в мусорку."
            });
            return;
        }

        if (p.energy < CLEANER_ENERGY_COST) {
            socket.emit("inventoryNotice", {
                title: "НЕДОСТАТОЧНО ЭНЕРГИИ",
                text: "Для уборки нужно 10 энергии.",
                color: "yellow",
                icon: "⚡"
            });
            return;
        }

        const dx = (p.x + 10) - trash.x;
        const dy = (p.y + 10) - trash.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 20) return;

        const startedAt = Date.now();
        const until = startedAt + CLEAN_TRASH_DURATION;

        trash.cleaningBy = p.playerId;
        trash.cleaningByName = p.name || "Дворник";
        trash.cleaningStartedAt = startedAt;
        trash.cleaningUntil = until;

        p.cleaningTrashId = trashId;
        p.cleaningStartedAt = startedAt;
        p.cleaningUntil = until;
        p.moving = false;
        p.velX = 0;
        p.velY = 0;

        inputs[socket.id] = {
            dirX: 0,
            dirY: 0,
            angle: p.angle,
            targetAngle: p.targetAngle,
            timestamp: Date.now()
        };

        saveTrashDatabaseDebounced();
        io.emit("trashItems", trashItems);
        io.emit("players", serializePlayers());
        io.emit("trashCleaningStarted", {
            trashId,
            playerId: p.playerId,
            socketId: socket.id,
            startedAt,
            until
        });

        if (activeCleaningTimers.has(trashId)) clearTimeout(activeCleaningTimers.get(trashId));
        activeCleaningTimers.set(trashId, setTimeout(() => {
            finishTrashCleaning(socket.id, p.playerId, trashId);
        }, CLEAN_TRASH_DURATION));
    });

    socket.on("depositTrash", () => {
        const p = getPlayer(socket);
        if (!p) return;
        if (p.job !== "Дворник") return;
        if (!isNearRect(p, TRASH_DEPOSIT_ZONE, 34)) return;

        const inventory = ensureInventory(p);
        const count = getTrashCount(p);

        if (count <= 0) {
            socket.emit("inventoryNotice", {
                title: "МУСОРА НЕТ",
                text: "В инвентаре нет мусора для сдачи."
            });
            return;
        }

        clearTrashFromInventory(p);
        p.money += getCleanerMoneyReward(p) * count;
        addXP(p, CLEANER_BASE_XP_REWARD * count);
        addJobXP(p, CLEANER_JOB_XP_REWARD * count);

        savePlayer(p);

        socket.emit("inventoryNotice", {
            title: "МУСОР СДАН",
            text: `Сдано: ${count} шт. Награда начислена.`
        });
    });

    socket.on("buyBackpack", () => {
        const p = getPlayer(socket);
        if (!p) return;
        if (!isNearRect(p, SHOP_ZONE, 34)) return;

        if (p.hasBackpack) {
            socket.emit("inventoryNotice", {
                title: "РЮКЗАК УЖЕ КУПЛЕН",
                text: "Дополнительные слоты уже открыты."
            });
            return;
        }

        if (p.money < BACKPACK_PRICE) {
            socket.emit("inventoryNotice", {
                title: "НЕДОСТАТОЧНО ДЕНЕГ",
                text: `Рюкзак стоит ${BACKPACK_PRICE} монет.`
            });
            return;
        }

        p.money -= BACKPACK_PRICE;
        p.hasBackpack = true;
        ensureInventory(p);
        savePlayer(p);

        socket.emit("inventoryNotice", {
            title: "РЮКЗАК КУПЛЕН",
            text: `Инвентарь увеличен на ${BACKPACK_BONUS_SLOTS} слотов.`
        });
    });

    socket.on("saveAvatar", (data) => {
        const p = getPlayer(socket);
        if (!p) return;

        const fromShop = !!data?.fromShop;
        if (fromShop && !isNearRect(p, SHOP_ZONE, 42)) {
            socket.emit("inventoryNotice", {
                title: "МАГАЗИН ДАЛЕКО",
                text: "Изменить внешность можно только у магазина."
            });
            return;
        }

        p.standardAvatar = normalizeAvatar({
            gender: data?.gender,
            bodyType: data?.bodyType,
            hairStyle: data?.hairStyle,
            clothingStyle: data?.clothingStyle,
            clothingColor: data?.clothingColor,
            setupDone: true
        });
        p.avatar = getEffectiveAvatar(p);

        savePlayer(p);
        socket.emit("avatarSaved", { avatar: p.avatar, standardAvatar: p.standardAvatar, cleanerOnShift: !!p.cleanerOnShift });
        io.emit("players", serializePlayers());
    });

    socket.on("toggleCleanerShift", () => {
        const p = getPlayer(socket);
        if (!p) return;
        if (p.job !== "Дворник") return;
        if (!isNearRect(p, TRASH_DEPOSIT_ZONE, 34)) return;

        const inventory = ensureInventory(p);

        if (p.cleanerOnShift && getTrashCount(p) > 0) {
            socket.emit("inventoryNotice", {
                title: "СНАЧАЛА СДАЙ МУСОР",
                text: "Уйти со смены можно только после сдачи мусора."
            });
            return;
        }

        setCleanerShift(p, !p.cleanerOnShift);
        savePlayer(p);

        socket.emit("inventoryNotice", {
            title: p.cleanerOnShift ? "СМЕНА НАЧАТА" : "СМЕНА ЗАВЕРШЕНА",
            text: p.cleanerOnShift ? "Рабочая форма надета." : "Стандартная одежда возвращена."
        });
        io.emit("players", serializePlayers());
    });

    socket.on("action", (type) => {
        const p = getPlayer(socket);
        if (!p) return;

        const hasJob = p.job && p.job !== "Без работы";

        if (type === "trash") {
            if (hasJob) {
                socket.emit("inventoryNotice", {
                    title: "РАБОТА НЕДОСТУПНА",
                    text: "Сначала уволься с текущей работы.",
                    color: "red",
                    icon: "⚠"
                });
                return;
            }
            p.job = "Дворник";
            setCleanerShift(p, true);
            syncActiveJobStats(p);
            ensureInventory(p);
            savePlayer(p);
            socket.emit("inventoryNotice", {
                title: "РАБОТА ПРИНЯТА",
                text: "Ты устроился дворником. Рабочая форма включена, смена началась.",
                color: "green",
                icon: "💼"
            });
            return;
        }

        if (type === "heal") {
            if (hasJob) {
                socket.emit("inventoryNotice", {
                    title: "РАБОТА НЕДОСТУПНА",
                    text: "Сначала уволься с текущей работы.",
                    color: "red",
                    icon: "⚠"
                });
                return;
            }
            p.job = "Санитар";
            setCleanerShift(p, false);
            syncActiveJobStats(p);
            ensureInventory(p);
            savePlayer(p);
            socket.emit("inventoryNotice", {
                title: "РАБОТА ПРИНЯТА",
                text: "Ты устроился санитаром. Опыт и уровни профессии сохраняются на сервере.",
                color: "green",
                icon: "💼"
            });
            return;
        }

        if (type === "quitJob") {
            if (!hasJob) return;

            const inventory = ensureInventory(p);

            // Дворник не может уволиться, пока в инвентаре есть несданный мусор.
            if (p.job === "Дворник" && getTrashCount(p) > 0) {
                socket.emit("inventoryNotice", {
                    title: "УВОЛЬНЕНИЕ НЕДОСТУПНО",
                    text: "Сначала сдай мусор.",
                    color: "yellow",
                    icon: "⚠"
                });
                return;
            }

            const oldJob = p.job;
            p.job = "Без работы";
            setCleanerShift(p, false);
            syncActiveJobStats(p);
            ensureInventory(p);
            savePlayer(p);
            socket.emit("inventoryNotice", {
                title: "ТЫ УВОЛИЛСЯ",
                text: oldJob ? `Работа ${oldJob} завершена. Опыт и уровни сохранены.` : "Теперь ты безработный.",
                color: "yellow",
                icon: "🏛"
            });
            return;
        }

        p.energy = Math.max(0, p.energy);
    });




    socket.on("devUpdateMapObject", (rawPatch) => {
        const p = players[socket.id];
        if (!p) {
            socket.emit("inventoryNotice", { title: "DEV MODE", text: "Сначала войди в персонажа.", color: "red", icon: "🛠" });
            return;
        }

        const patch = sanitizeDevMapObjectPatch(rawPatch);
        if (!patch) {
            socket.emit("inventoryNotice", { title: "DEV MODE", text: "Некорректные данные объекта карты.", color: "red", icon: "🛠" });
            return;
        }

        if (!applyDevMapObjectPatchToDb(patch)) return;
        saveMapObjectsDatabaseDebounced();

        io.emit("mapObjectUpdated", patch);
        socket.emit("inventoryNotice", {
            title: "КАРТА СОХРАНЕНА",
            text: `${patch.name || patch.id}: координаты сохранены на сервере`,
            color: "green",
            icon: "🛠"
        });
    });

    socket.on("devCommitMapObjectsToSource", () => {
        const p = players[socket.id];
        if (!p) {
            socket.emit("inventoryNotice", { title: "DEV MODE", text: "Сначала войди в персонажа.", color: "red", icon: "🛠" });
            return;
        }

        try {
            const result = commitMapObjectsDbToSourceFiles();
            socket.emit("devMapObjectsCommitted", result);
            socket.emit("mapObjectsState", mapObjectsDb.objects);
            socket.emit("inventoryNotice", {
                title: result.ok ? "КАРТА ЗАПИСАНА В КОД" : "КАРТА НЕ ИЗМЕНЕНА",
                text: result.message,
                color: result.ok ? "green" : "yellow",
                icon: "🛠"
            });
        } catch (err) {
            console.error("devCommitMapObjectsToSource error:", err);
            socket.emit("devMapObjectsCommitted", { ok: false, message: err.message || "Ошибка переноса карты в код." });
            socket.emit("inventoryNotice", { title: "ОШИБКА ЗАПИСИ КАРТЫ", text: err.message || "Не удалось записать координаты в код.", color: "red", icon: "🛠" });
        }
    });

    socket.on("requestMapObjectsState", () => {
        socket.emit("mapObjectsState", mapObjectsDb.objects);
    });

    socket.on("disconnect", () => {
        const p = getPlayer(socket);
        if (p) {
            if (p.cleaningTrashId && trashItems[p.cleaningTrashId]) {
                clearTrashCleaningLock(trashItems[p.cleaningTrashId]);
                if (activeCleaningTimers.has(p.cleaningTrashId)) {
                    clearTimeout(activeCleaningTimers.get(p.cleaningTrashId));
                    activeCleaningTimers.delete(p.cleaningTrashId);
                }
                saveTrashDatabaseDebounced();
                io.emit("trashItems", trashItems);
            }
            clearPlayerCleaningState(p);
            p.lastLogoutAt = Date.now();
            p.lastLogoutPosition = { x: Math.round(p.x), y: Math.round(p.y) };
            savePlayer(p);
        }
        delete players[socket.id];
        delete inputs[socket.id];
        io.emit("onlineCount", Object.keys(players).length);
    });
});

// ===============================
// 🔄 SERVER TICK
// ===============================
let last = Date.now();
let tickCount = 0;
let lastTPS = Date.now();
let ticks = 0;
let lastAutoSave = Date.now();

function tick() {
    const now = Date.now();
    const tickStart = performance.now();
    const dt = (now - last) / 1000;
    last = now;

    for (let id in players) {
        const p = players[id];
        if (!p) continue;

        let input = inputs[id];
        // Скорость синхронизирована с клиентской физикой: медленнее и плавнее.
        const speed = 150;

        if (!input || now - input.timestamp > 160) {
            delete inputs[id];
            input = null;
            p.moving = false;
        }

        if (Number(p.cleaningUntil) > now) {
            delete inputs[id];
            input = null;
            p.velX = 0;
            p.velY = 0;
            p.moving = false;
        }

        if (input) {
            if (Number.isFinite(Number(input.angle))) p.angle = Number(input.angle);
            if (Number.isFinite(Number(input.targetAngle))) p.targetAngle = Number(input.targetAngle);
            p.moving = Math.hypot(input.dirX || 0, input.dirY || 0) > 0.02;
            p.x += (input.dirX || 0) * speed * dt;
            p.y += (input.dirY || 0) * speed * dt;
        }

        if (p.energy < 100) {
            p.energy = Math.min(100, p.energy + 0.08);
        }

        ensureInventory(p);
        syncActiveJobStats(p);
    }

    const online = Object.keys(players).length;
    const maxTrash = Math.max(5, online * 4);
    const spawnDelay = Math.max(1200, 5000 - online * 500);

    if (Object.keys(trashItems).length < maxTrash && Date.now() - lastTrashSpawn > spawnDelay) {
        if (spawnTrash()) io.emit("trashItems", trashItems);
        lastTrashSpawn = Date.now();
        trashDb.lastTrashSpawn = lastTrashSpawn;
        saveTrashDatabaseDebounced();
    }

    if (now - lastAutoSave >= 5000) {
        for (let id in players) savePlayer(players[id]);
        lastAutoSave = now;
    }

    io.emit("players", serializePlayers());
    io.emit("onlineCount", online);

    const tickTime = performance.now() - tickStart;

    tickCount++;
    if (tickCount % 60 === 0) {
        console.log("Tick:", tickTime.toFixed(2) + "ms", "| Players:", online);
    }

    ticks++;
    if (Date.now() - lastTPS >= 1000) {
        console.log("TPS:", ticks);
        ticks = 0;
        lastTPS = Date.now();
    }

    setTimeout(tick, 16);
}

tick();

process.on("SIGINT", () => {
    try {
        saveDatabaseNow();
        saveTrashDatabaseNow();
        saveChatDatabaseNow();
    } finally {
        process.exit(0);
    }
});

process.on("SIGTERM", () => {
    try {
        saveDatabaseNow();
        saveTrashDatabaseNow();
        saveChatDatabaseNow();
    } finally {
        process.exit(0);
    }
});

// ===============================
// 🚀 START SERVER
// ===============================
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log("🚀 Server running on port " + PORT);
});
