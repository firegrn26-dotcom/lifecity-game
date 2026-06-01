// ===============================
// 🔐 AUTH VISIBILITY / OVERLAY FIX
// ===============================
// Исправляет ситуацию, когда после модульной чистки полноэкранный auth-слой
// оставался поверх игры и перекрывал canvas. После успешного входа DOM-auth
// полностью удаляется из страницы, поэтому фон/панель не могут закрывать карту.
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
            "#authBox",
            ".auth-box",
            "#loginPanel",
            ".login-panel",
            "#registerPanel",
            ".register-panel",
            ".auth-tabs",
            ".auth-tab",
            "#authTabs",
            "#authTopRight",
            "#authModeTitle"
        ];
        document.querySelectorAll(selectors.join(",")).forEach((el) => {
            if (el.id === "lc-auth-root" || el.closest("#lc-auth-root")) return;
            el.style.display = "none";
            el.style.visibility = "hidden";
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
            el.setAttribute("aria-hidden", "true");
            el.setAttribute("data-lc-auth-hidden-old", "true");
        });
    }

    function removeAuthOverlay() {
        const root = document.getElementById("lc-auth-root");
        if (root) root.remove();

        // На случай, если браузер/старый код успел создать отдельные элементы.
        document.querySelectorAll(".lc-auth-shell,.lc-auth-content,.lc-auth-card").forEach((el) => {
            if (!el.closest("#lc-auth-root")) return;
            el.remove();
        });

        document.body.classList.remove("lc-auth-active");
        document.body.classList.add("lc-auth-passed");
    }

    function ensureAuthVisible() {
        const authenticated = isAuthPassed();

        if (authenticated) {
            removeAuthOverlay();
            hideLegacyCanvasAuthControls();
            return;
        }

        try {
            if (typeof window.lcCreateAuthWindow === "function") window.lcCreateAuthWindow();
            else if (typeof lcCreateAuthWindow === "function") lcCreateAuthWindow();
        } catch (err) {}

        hideLegacyCanvasAuthControls();

        const root = document.getElementById("lc-auth-root");
        if (!root) return;

        document.body.classList.add("lc-auth-active");
        document.body.classList.remove("lc-auth-passed");

        root.classList.remove("lc-auth-hidden");
        root.style.display = "flex";
        root.style.visibility = "visible";
        root.style.opacity = "1";
        root.style.pointerEvents = "auto";
        root.style.background = "transparent";
        root.style.zIndex = "10050";
        root.removeAttribute("aria-hidden");

        const shell = root.querySelector(".lc-auth-shell");
        if (shell) {
            shell.style.pointerEvents = "auto";
            shell.style.visibility = "visible";
            shell.style.opacity = "1";
        }
    }

    // Переопределяем более хрупкую проверку из render-loop.js.
    window.lcUpdateAuthWindowVisibility = ensureAuthVisible;
    window.lcRemoveAuthOverlay = removeAuthOverlay;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", ensureAuthVisible);
    } else {
        ensureAuthVisible();
    }

    window.addEventListener("load", ensureAuthVisible);
    window.addEventListener("focus", ensureAuthVisible);
    setTimeout(ensureAuthVisible, 50);
    setTimeout(ensureAuthVisible, 250);
    setTimeout(ensureAuthVisible, 800);
    setInterval(ensureAuthVisible, 700);
})();
