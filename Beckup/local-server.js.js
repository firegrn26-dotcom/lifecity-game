// ===============================
// 🚀 LIFE CITY SERVER (CLEAN MMO)
// ===============================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ===============================
// 📁 STATIC FILES
// ===============================
app.use(express.static("public"));

// ===============================
// 🎮 PLAYERS STATE
// ===============================
let players = {};
let inputs = {};


io.on("connection", (socket) => {

    players[socket.id] = {
        x: 100,
        y: 100,
        energy: 100,
        money: 1000,
        name: "Player_" + socket.id.slice(0, 4)
    };

    socket.on("pingCheck", (start) => {
    socket.emit("pongCheck", start);
});

    // MOVE
    socket.on("move", (data) => {
        inputs[socket.id] = {
            dirX: data.dirX || 0,
            dirY: data.dirY || 0,
            timestamp: Date.now()
        };
    });

    // STOP (точная остановка)
    socket.on("moveStop", (data) => {

        const p = players[socket.id];
        if (!p) return;

        const newX = Number(data.x);
        const newY = Number(data.y);

        if (!isNaN(newX)) p.x = newX;
        if (!isNaN(newY)) p.y = newY;

        inputs[socket.id] = {
            dirX: 0,
            dirY: 0,
            timestamp: Date.now()
        };
    });


    // ACTIONS
    socket.on("action", (type) => {

        const p = players[socket.id];
        if (!p) return;

        if (type === "trash" && p.energy >= 10) {
            p.energy -= 10;
            p.money += 50;
        }

        if (type === "heal" && p.energy >= 15) {
            p.energy -= 15;
            p.money += 100;
        }

        if (type === "bank" && p.energy >= 20) {
            p.energy -= 20;
            p.money += 150;
        }

        if (p.energy < 0) p.energy = 0;
    });

    // NAME
    socket.on("setName", (name) => {
        const p = players[socket.id];
        if (!p) return;

        name = String(name || "").trim().slice(0, 12);
        p.name = name || p.name;
    });

    // DISCONNECT
    socket.on("disconnect", () => {
        delete players[socket.id];
        delete inputs[socket.id];
    });
});

let last = Date.now();

// ===============================
// 🔄 SERVER TICK (ONLY ONE SYSTEM)
// ===============================
let tickCount = 0;
let lastTPS = Date.now();
let ticks = 0;
function tick() {

    const now = Date.now();
    const tickStart = performance.now();
    const dt = (now - last) / 1000;
    last = now;

    for (let id in players) {

        const p = players[id];
        if (!p) continue;

        let input = inputs[id];

        const speed = 200;

        if (!input || now - input.timestamp > 120) {
            delete inputs[id];
            input = null;
        }

        if (input) {
            p.x += (input.dirX || 0) * speed * dt;
            p.y += (input.dirY || 0) * speed * dt;
        }

        if (p.energy < 100) {
            p.energy = Math.min(100, p.energy + 0.08);
        }
    }

    io.emit("players", players);

    const tickTime = performance.now() - tickStart;

tickCount++;

if (tickCount % 60 === 0) {
    console.log(
        "Tick:",
        tickTime.toFixed(2) + "ms",
        "| Players:",
        Object.keys(players).length
    );
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

// ===============================
// 🚀 START LOCAL SERVER
// ===============================
const PORT = 3000;

server.listen(PORT, "127.0.0.1", () => {
    console.log("🖥️ Local Life City server running:");
    console.log("http://localhost:" + PORT);
});