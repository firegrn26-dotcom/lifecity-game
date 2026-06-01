// ===============================
// 🏙️ ГОРОД — LIFE CITY MEGAPOLIS
// Размеры зданий не менялись: изменены только позиции и визуальная среда вокруг них.
// ===============================
let buildings = [
    // UrbanRebuild V1.2: кварталы укрупнены — здания разнесены дальше от магистралей.
    // Назначение сохранено, позиции обновлены под более просторную городскую сетку.
    { name: "Жилой дом", x: -430, y: 260, w: 220, h: 135, color: "#526077" },
    { name: "Кафе", x: 365, y: 285, w: 170, h: 116, color: "#8b5a2b" },
    { name: "Мэрия", x: 890, y: 260, w: 215, h: 135, color: "#4a6fa5" },
    { name: "Банк", x: 900, y: 660, w: 205, h: 84, color: "#243b64" },
    { name: "Аптека", x: 930, y: 930, w: 165, h: 120, color: "#1e6f4a" },
    { name: "Мусорка", x: 510, y: 930, w: 72, h: 54, color: "#4c5962" },
    { name: "Магазин", x: 1460, y: 650, w: 245, h: 110, color: "#8a6218" },
    { name: "Автосервис", x: 1465, y: 930, w: 255, h: 95, color: "#464b55" },
    { name: "Полиция", x: 2090, y: 260, w: 230, h: 125, color: "#1f4d96" },
    { name: "Мусороперерабатывающий завод", x: 2070, y: 930, w: 430, h: 175, color: "#3d5861", type: "recyclingFactory", alwaysVisibleComplex: true },
];

// Защита от случайного дубля здания при будущих правках карты.
// Ключ учитывает название и координаты, чтобы один и тот же дом не рисовался слоями.
buildings = buildings.filter((b, index, arr) => {
    const key = `${b.name}|${b.x}|${b.y}|${b.w}|${b.h}`;
    return arr.findIndex(item => `${item.name}|${item.x}|${item.y}|${item.w}|${item.h}` === key) === index;
});

// ===============================
// ♻️ МУСОРОПЕРЕРАБАТЫВАЮЩИЙ ЗАВОД — ГАРАНТИРОВАННОЕ ВКЛЮЧЕНИЕ НА КАРТЕ
// Раньше завод был только обычной записью buildings с type: "recyclingFactory".
// Если при будущей правке карту пересоберут или потеряют type, комплекс исчезнет.
// Эта проверка всегда восстанавливает завод, парковку и промзону до запуска рендера.
// ===============================
const recyclingFactory = {
    name: "Мусороперерабатывающий завод",
    x: 2070,
    y: 930,
    w: 430,
    h: 175,
    color: "#3d5861",
    type: "recyclingFactory",
    alwaysVisibleComplex: true
};

function ensureRecyclingFactoryOnMap() {
    let factory = buildings.find(b => b.type === "recyclingFactory" || b.name === recyclingFactory.name);

    if (!factory) {
        factory = { ...recyclingFactory };
        buildings.push(factory);
    } else {
        // Не перезаписываем координаты и размер: dev-map-editor может сохранять завод на сервере.
        // Здесь только гарантируем идентичность и обязательные флаги комплекса.
        factory.name = recyclingFactory.name;
        factory.color = factory.color || recyclingFactory.color;
        factory.type = "recyclingFactory";
        factory.alwaysVisibleComplex = true;
        factory.w = Math.max(120, Number(factory.w) || recyclingFactory.w);
        factory.h = Math.max(80, Number(factory.h) || recyclingFactory.h);
    }

    if (Array.isArray(buildingZones) && !buildingZones.some(z => z.name === "Промышленная зона переработки")) {
        buildingZones.push({
            name: "Промышленная зона переработки",
            x: factory.x - 20,
            y: factory.y - 28,
            w: factory.w + 320,
            h: Math.max(300, factory.h + 64)
        });
    }

    return factory;
}


// ===============================
