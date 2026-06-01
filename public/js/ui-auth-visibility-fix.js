// ===============================
// 🔐 AUTH VISIBILITY FIX
// ===============================
// После чистки модулей окно авторизации могло скрываться из-за gameState/myPlayer
// или оставаться под старым canvas-auth слоем. Этот модуль принудительно держит
// новый DOM-auth видимым до успешной авторизации и не трогает серверную логику.
(function () {
    function isAuthPassed() {
        try {
            if (typeof window.isAuthenticated !== "undefined" && window.isAuthenticated) return true;
            if (typeof isAuthenticated !== "undefined" && isAuthenticated) return true;
            if (typeof window.isLoggedIn !== "undefined" && window.isLoggedIn) return true;
            if (typeof isLoggedIn !== "undefined" && isLoggedIn) return true;
        } catch (err) {}
        return false;
    }

    function hideLegacyCanvasAuthControls() {
        const selectors = [
            ".lifecity-auth-input",
            ".lifecity-auth-button",
            "#authPanel",
            ".auth-panel",
            "#loginPanel",
            ".login-panel",
            "#registerPanel",
            ".register-panel"
        ];
        document.querySelectorAll(selectors.join(",")).forEach((el) => {
            if (el.id === "lc-auth-root" || el.closest("#lc-auth-root")) return;
            el.style.display = "none";
            el.style.visibility = "hidden";
            el.style.pointerEvents = "none";
        });
    }

    function ensureAuthVisible() {
        try {
            if (typeof window.lcCreateAuthWindow === "function") window.lcCreateAuthWindow();
            else if (typeof lcCreateAuthWindow === "function") lcCreateAuthWindow();
        } catch (err) {}

        hideLegacyCanvasAuthControls();

        const root = document.getElementById("lc-auth-root");
        if (!root) return;

        const shouldShow = !isAuthPassed();
        root.classList.toggle("lc-auth-hidden", !shouldShow);
        root.style.display = shouldShow ? "flex" : "none";
        root.style.visibility = shouldShow ? "visible" : "hidden";
        root.style.opacity = shouldShow ? "1" : "0";
        root.style.pointerEvents = shouldShow ? "auto" : "none";
        root.style.zIndex = "10050";

        const shell = root.querySelector(".lc-auth-shell");
        if (shell) {
            shell.style.pointerEvents = shouldShow ? "auto" : "none";
            shell.style.visibility = shouldShow ? "visible" : "hidden";
        }
    }

    // Переопределяем более хрупкую проверку из render-loop.js: окно не должно
    // зависеть от gameState или стандартного имени myPlayer.name = "You".
    window.lcUpdateAuthWindowVisibility = ensureAuthVisible;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", ensureAuthVisible);
    } else {
        ensureAuthVisible();
    }

    window.addEventListener("load", ensureAuthVisible);
    setTimeout(ensureAuthVisible, 50);
    setTimeout(ensureAuthVisible, 250);
    setInterval(ensureAuthVisible, 600);
})();
