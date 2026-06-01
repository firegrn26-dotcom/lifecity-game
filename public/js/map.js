// ===============================
// 🏙️ ГОРОД — LIFE CITY MEGAPOLIS
// Размеры зданий не менялись: изменены только позиции и визуальная среда вокруг них.
// ===============================
let buildings = [
    // Новая расстановка: здания находятся в свободных кварталах рядом с дорогами.
    // Размеры обновлены вместе с коллизиями, так как коллизия берётся из этих же w/h.
    { name: "Жилой дом", x: -320, y: 160, w: 220, h: 210, color: "#526077" },
    { name: "Кафе", x: 360, y: 200, w: 190, h: 125, color: "#8b5a2b" },
    { name: "Мэрия", x: 860, y: 160, w: 280, h: 170, color: "#4a6fa5" },
    { name: "Банк", x: 860, y: 540, w: 280, h: 160, color: "#243b64" },
    { name: "Аптека", x: 825, y: 705, w: 165, h: 120, color: "#1e6f4a" },
    { name: "Мусорка", x: 555, y: 700, w: 90, h: 58, color: "#4c5962" },
    { name: "Магазин", x: 1240, y: 500, w: 300, h: 170, color: "#8a6218" },
    { name: "Автосервис", x: 1160, y: 815, w: 270, h: 105, color: "#464b55" },
    { name: "Полиция", x: 1600, y: 210, w: 235, h: 165, color: "#1f4d96" },
    { name: "Мусороперерабатывающий завод", x: 1545, y: 710, w: 430, h: 240, color: "#3d5861", type: "recyclingFactory", alwaysVisibleComplex: true },
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
    x: 1545,
    y: 710,
    w: 430,
    h: 240,
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
        Object.assign(factory, {
            name: recyclingFactory.name,
            x: recyclingFactory.x,
            y: recyclingFactory.y,
            w: recyclingFactory.w,
            h: recyclingFactory.h,
            color: recyclingFactory.color,
            type: "recyclingFactory",
            alwaysVisibleComplex: true
        });
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
