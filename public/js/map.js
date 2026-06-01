// ===============================
// 🏙️ ГОРОД — LIFE CITY MEGAPOLIS
// Размеры зданий не менялись: изменены только позиции и визуальная среда вокруг них.
// ===============================
let buildings = [
    // UrbanRebuild V1.1: здания отодвинуты внутрь кварталов после расширения магистралей.
    // Назначение зданий сохранено, но фасады больше не стоят вплотную к широкой дороге.
    { name: "Жилой дом", x: -365, y: 205, w: 220, h: 135, color: "#526077" },
    { name: "Кафе", x: -40, y: 205, w: 170, h: 116, color: "#8b5a2b" },
    { name: "Мэрия", x: 805, y: 205, w: 215, h: 135, color: "#4a6fa5" },
    { name: "Банк", x: 820, y: 510, w: 205, h: 84, color: "#243b64" },
    { name: "Аптека", x: 825, y: 720, w: 165, h: 120, color: "#1e6f4a" },
    { name: "Мусорка", x: 560, y: 725, w: 72, h: 54, color: "#4c5962" },
    { name: "Магазин", x: 1190, y: 705, w: 245, h: 110, color: "#8a6218" },
    { name: "Автосервис", x: 1165, y: 780, w: 255, h: 95, color: "#464b55" },
    { name: "Полиция", x: 1610, y: 205, w: 230, h: 125, color: "#1f4d96" },
    { name: "Мусороперерабатывающий завод", x: 1580, y: 705, w: 430, h: 175, color: "#3d5861", type: "recyclingFactory", alwaysVisibleComplex: true },
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
    x: 1580,
    y: 705,
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
