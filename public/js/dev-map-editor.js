// ===============================
// 🛠️ DEV MAP EDITOR — движение объектов карты с сохранением на сервере
// ===============================
let devSelectedMapObject = null;
let devDragOffsetX = 0;
let devDragOffsetY = 0;
let devLastSavedAt = 0;
let devMapSavePending = false;
let devMapStatusText = "";
let devMapStatusUntil = 0;

function devSafeId(text, fallback = "object") {
    return String(text || fallback)
        .trim()
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/[^a-zа-я0-9]+/gi, "_")
        .replace(/^_+|_+$/g, "") || fallback;
}

function devObjectId(kind, obj, index = 0) {
    if (!obj) return `${kind}_${index}`;
    return obj.id || `${kind}_${devSafeId(obj.name || obj.type || "object")}_${index}`;
}

function devGetEditableMapObjects() {
    const result = [];

    if (Array.isArray(buildings)) {
        buildings.forEach((b, index) => {
            if (!b) return;
            result.push({
                kind: "building",
                label: `Здание: ${b.name || b.type || index}`,
                id: devObjectId("building", b, index),
                ref: b,
                x: b.x,
                y: b.y,
                w: b.w,
                h: b.h,
                priority: 4
            });
        });
    }

    if (Array.isArray(parks)) {
        parks.forEach((p, index) => {
            if (!p) return;
            result.push({
                kind: "park",
                label: `Парк/зона: ${p.name || index}`,
                id: devObjectId("park", p, index),
                ref: p,
                x: p.x,
                y: p.y,
                w: p.w,
                h: p.h,
                priority: 2
            });
        });
    }

    if (Array.isArray(buildingZones)) {
        buildingZones.forEach((z, index) => {
            if (!z) return;
            result.push({
                kind: "buildingZone",
                label: `Подложка: ${z.name || index}`,
                id: devObjectId("buildingZone", z, index),
                ref: z,
                x: z.x,
                y: z.y,
                w: z.w,
                h: z.h,
                priority: 1
            });
        });
    }

    if (Array.isArray(roads)) {
        roads.forEach((r, index) => {
            if (!r || !Array.isArray(r.points) || r.points.length < 2) return;
            const xs = r.points.map(p => Number(p.x) || 0);
            const ys = r.points.map(p => Number(p.y) || 0);
            const minX = Math.min(...xs) - (Number(r.width) || 70) / 2;
            const minY = Math.min(...ys) - (Number(r.width) || 70) / 2;
            const maxX = Math.max(...xs) + (Number(r.width) || 70) / 2;
            const maxY = Math.max(...ys) + (Number(r.width) || 70) / 2;
            result.push({
                kind: "road",
                label: `Дорога: ${r.name || index}`,
                id: devObjectId("road", r, index),
                ref: r,
                x: minX,
                y: minY,
                w: maxX - minX,
                h: maxY - minY,
                priority: 0
            });
        });
    }

    return result;
}

function devPointToSegmentDistance(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

function devHitTestRoad(item, wx, wy) {
    const road = item.ref;
    const half = Math.max(18, (Number(road.width) || 72) / 2);
    for (let i = 0; i < road.points.length - 1; i++) {
        const a = road.points[i];
        const b = road.points[i + 1];
        if (devPointToSegmentDistance(wx, wy, a.x, a.y, b.x, b.y) <= half) return true;
    }
    return false;
}

function devFindObjectAt(wx, wy) {
    const objects = devGetEditableMapObjects().sort((a, b) => b.priority - a.priority);
    for (const item of objects) {
        if (item.kind === "road") {
            if (devHitTestRoad(item, wx, wy)) return item;
            continue;
        }
        if (wx >= item.x && wx <= item.x + item.w && wy >= item.y && wy <= item.y + item.h) {
            return item;
        }
    }
    return null;
}

function devCreatePatch(item) {
    const ref = item?.ref;
    if (!ref) return null;

    if (item.kind === "road") {
        return {
            kind: "road",
            id: item.id,
            name: ref.name || item.id,
            lanes: Number(ref.lanes) || 2,
            width: Number(ref.width) || 72,
            points: (ref.points || []).map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }))
        };
    }

    return {
        kind: item.kind,
        id: item.id,
        name: ref.name || item.id,
        type: ref.type || "",
        x: Math.round(Number(ref.x) || 0),
        y: Math.round(Number(ref.y) || 0),
        w: Math.round(Number(ref.w) || 20),
        h: Math.round(Number(ref.h) || 20),
        color: ref.color || ""
    };
}

function devApplyRectPatchToArray(arr, patch, kind) {
    if (!Array.isArray(arr) || !patch) return false;
    const idx = arr.findIndex((obj, index) => devObjectId(kind, obj, index) === patch.id || obj?.name === patch.name);
    if (idx < 0) return false;
    Object.assign(arr[idx], {
        x: patch.x,
        y: patch.y,
        w: patch.w,
        h: patch.h
    });
    if (patch.color) arr[idx].color = patch.color;
    if (patch.type) arr[idx].type = patch.type;
    return true;
}

function devApplyRoadPatch(patch) {
    if (!Array.isArray(roads) || !patch || !Array.isArray(patch.points)) return false;
    const idx = roads.findIndex((road, index) => devObjectId("road", road, index) === patch.id || road?.name === patch.name);
    if (idx < 0) return false;
    roads[idx].points = patch.points.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
    if (patch.width) roads[idx].width = patch.width;
    if (patch.lanes) roads[idx].lanes = patch.lanes;
    roadsideLayoutV3Cache = null;
    return true;
}

function applyDevMapObjectPatch(patch) {
    if (!patch || typeof patch !== "object") return false;
    if (patch.kind === "building") return devApplyRectPatchToArray(buildings, patch, "building");
    if (patch.kind === "park") return devApplyRectPatchToArray(parks, patch, "park");
    if (patch.kind === "buildingZone") return devApplyRectPatchToArray(buildingZones, patch, "buildingZone");
    if (patch.kind === "road") return devApplyRoadPatch(patch);
    return false;
}

function applyDevMapObjectsState(state) {
    if (!state || typeof state !== "object") return;
    for (const patch of Object.values(state.buildings || {})) applyDevMapObjectPatch(patch);
    for (const patch of Object.values(state.parks || {})) applyDevMapObjectPatch(patch);
    for (const patch of Object.values(state.buildingZones || {})) applyDevMapObjectPatch(patch);
    for (const patch of Object.values(state.roads || {})) applyDevMapObjectPatch(patch);
    roadsideLayoutV3Cache = null;
}

function devSaveSelectedMapObject() {
    if (!devSelectedMapObject) return;
    const patch = devCreatePatch(devSelectedMapObject);
    if (!patch) return;

    devMapSavePending = true;
    devLastSavedAt = performance.now();
    devMapStatusText = `Сохранение: ${patch.name || patch.id}`;
    devMapStatusUntil = performance.now() + 2200;

    if (typeof socket !== "undefined" && socket?.emit) {
        socket.emit("devUpdateMapObject", patch);
    } else {
        console.warn("devUpdateMapObject", patch);
    }
}

function devEditorMouseDown(e) {
    if (!isDevOptionOn("editBuildings")) return false;

    const wx = e.clientX + camera.x;
    const wy = e.clientY + camera.y;
    const item = devFindObjectAt(wx, wy);
    if (!item) return false;

    devSelectedMapObject = item;
    selectedBuilding = item.kind === "building" ? item.ref : null;
    resizeModeX = e.shiftKey && item.kind !== "road";
    resizeModeY = e.ctrlKey && item.kind !== "road";

    if (item.kind === "road") {
        devDragOffsetX = wx;
        devDragOffsetY = wy;
    } else {
        devDragOffsetX = wx - item.ref.x;
        devDragOffsetY = wy - item.ref.y;
    }

    devMapStatusText = `${item.label} выбран`;
    devMapStatusUntil = performance.now() + 1800;
    return true;
}

function devEditorMouseMove(e) {
    if (!isDevOptionOn("editBuildings") || !devSelectedMapObject) return false;

    const wx = e.clientX + camera.x;
    const wy = e.clientY + camera.y;
    const item = devSelectedMapObject;
    const ref = item.ref;
    if (!ref) return false;

    if (item.kind === "road") {
        const dx = Math.round(wx - devDragOffsetX);
        const dy = Math.round(wy - devDragOffsetY);
        for (const p of ref.points) {
            p.x = Math.round(p.x + dx);
            p.y = Math.round(p.y + dy);
        }
        devDragOffsetX = wx;
        devDragOffsetY = wy;
        roadsideLayoutV3Cache = null;
        return true;
    }

    if (resizeModeX) {
        ref.w = Math.max(30, Math.round(wx - ref.x));
        return true;
    }

    if (resizeModeY) {
        ref.h = Math.max(30, Math.round(wy - ref.y));
        return true;
    }

    ref.x = Math.round(wx - devDragOffsetX);
    ref.y = Math.round(wy - devDragOffsetY);
    return true;
}

function devEditorMouseUp() {
    if (!devSelectedMapObject) return false;
    devSaveSelectedMapObject();
    devSelectedMapObject = null;
    selectedBuilding = null;
    resizeModeX = false;
    resizeModeY = false;
    return true;
}


function devRequestCommitMapObjectsToSource() {
    if (!devModeEnabled) return;
    devMapSavePending = true;
    devMapStatusText = "Запись координат в основной код...";
    devMapStatusUntil = performance.now() + 3200;

    if (typeof socket !== "undefined" && socket?.emit) {
        socket.emit("devCommitMapObjectsToSource");
    }
}

function devDrawMapEditorOverlay() {
    if (!isDevOptionOn("editBuildings")) return;

    ctx.save();
    const objects = devGetEditableMapObjects();
    for (const item of objects) {
        const isSelected = devSelectedMapObject && devSelectedMapObject.id === item.id && devSelectedMapObject.kind === item.kind;
        const color = item.kind === "road" ? "rgba(88,199,255,0.38)" : item.kind === "building" ? "rgba(255,194,51,0.55)" : "rgba(129,240,79,0.34)";
        ctx.strokeStyle = isSelected ? "rgba(255,255,255,0.92)" : color;
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.setLineDash(isSelected ? [] : [8, 6]);
        ctx.strokeRect(item.x - camera.x, item.y - camera.y, item.w, item.h);

        if (isSelected) {
            ctx.setLineDash([]);
            ctx.fillStyle = "rgba(7,12,22,0.82)";
            ctx.strokeStyle = "rgba(255,255,255,0.24)";
            roundedRect(item.x - camera.x, item.y - camera.y - 30, Math.min(300, Math.max(160, item.label.length * 7 + 24)), 24, 8);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#e8eef7";
            ctx.font = "bold 12px Arial";
            ctx.textBaseline = "middle";
            ctx.fillText(item.label, item.x - camera.x + 10, item.y - camera.y - 18);
        }
    }

    if (devMapStatusText && performance.now() < devMapStatusUntil) {
        const x = 22;
        const y = devMenuOpen ? devMenuBounds.y + devMenuBounds.h + 12 : 88;
        roundedRect(x, y, 360, 42, 12);
        ctx.fillStyle = "rgba(7,12,22,0.82)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,194,51,0.35)";
        ctx.stroke();
        ctx.fillStyle = devMapSavePending ? "#ffc233" : "#81f04f";
        ctx.font = "bold 13px Arial";
        ctx.fillText(devMapStatusText, x + 16, y + 26);
    }

    ctx.restore();
}

if (typeof socket !== "undefined" && socket?.on) {
    socket.on("mapObjectsState", (state) => {
        applyDevMapObjectsState(state);
    });

    socket.on("mapObjectUpdated", (patch) => {
        applyDevMapObjectPatch(patch);
        devMapSavePending = false;
        devMapStatusText = `Карта обновлена: ${patch?.name || patch?.id || "объект"}`;
        devMapStatusUntil = performance.now() + 1800;
    });

    socket.on("devMapObjectsCommitted", (result) => {
        devMapSavePending = false;
        devMapStatusText = result?.ok
            ? `Карта записана в код: ${result.applied || 0} объектов`
            : `Карта не записана: ${result?.message || "нет данных"}`;
        devMapStatusUntil = performance.now() + 4200;
    });

    // Первый пакет от сервера мог прийти до загрузки этого модуля,
    // потому после инициализации редактора запрашиваем сохранённую карту повторно.
    setTimeout(() => socket.emit("requestMapObjectsState"), 80);
}
