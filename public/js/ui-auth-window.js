// ===============================
// 🔐 CLEAN DOM AUTH WINDOW
// ===============================
// Восстанавливает нормальное окно входа/регистрации поверх летающей камеры города.
// Город и intro-render остаются на canvas, этот модуль отвечает только за DOM-панель.
(function () {
    function byId(id) { return document.getElementById(id); }

    function safeCleanLogin(value) {
        if (typeof cleanAuthLoginInput === "function") return cleanAuthLoginInput(value);
        return String(value || "").toLowerCase().replace(/[^a-z0-9_\-.@]/g, "").slice(0, 18);
    }

    function safeCleanPassword(value) {
        if (typeof cleanAuthPasswordInput === "function") return cleanAuthPasswordInput(value);
        return String(value || "").replace(/[^A-Za-z0-9_\-.!@#$%^&*+=?]/g, "").slice(0, 24);
    }

    function safeCleanNickname(value) {
        if (typeof cleanAuthNicknameInput === "function") return cleanAuthNicknameInput(value);
        return String(value || "").replace(/[^A-Za-zА-Яа-яЁё0-9 _\-.!@#$%^&*+=?]/g, "").slice(0, 16);
    }

    function isAuthPassed() {
        try { return !!isAuthenticated; } catch (err) { return false; }
    }

    function getMode() {
        try { return authMode === "register" ? "register" : "login"; } catch (err) { return "login"; }
    }

    function setMode(mode) {
        authMode = mode === "register" ? "register" : "login";
        authFocus = authMode === "register" ? "nickname" : "login";
        authMessage = "";
        lcCreateAuthWindow();
        lcAuthRefreshWindow();
        setTimeout(() => {
            const focusId = authFocus === "passwordRepeat" ? "lc-auth-password-repeat" : `lc-auth-${authFocus}`;
            const el = byId(focusId);
            if (el) el.focus();
        }, 0);
    }

    function readFieldsToGlobals() {
        const nickname = byId("lc-auth-nickname");
        const login = byId("lc-auth-login");
        const password = byId("lc-auth-password");
        const passwordRepeat = byId("lc-auth-password-repeat");
        const rememberLogin = byId("lc-auth-remember-login");
        const rememberPassword = byId("lc-auth-remember-password");
        const showPassword = byId("lc-auth-show-password");

        authNickname = safeCleanNickname(nickname ? nickname.value : authNickname);
        authLogin = safeCleanLogin(login ? login.value : authLogin);
        authPassword = safeCleanPassword(password ? password.value : authPassword);
        authPasswordRepeat = safeCleanPassword(passwordRepeat ? passwordRepeat.value : authPasswordRepeat);
        authRememberLogin = !!(rememberLogin && rememberLogin.checked);
        authRememberPassword = !!(rememberPassword && rememberPassword.checked);
        authShowPassword = !!(showPassword && showPassword.checked);
    }

    function writeGlobalsToFields() {
        const fields = {
            "lc-auth-nickname": authNickname || "",
            "lc-auth-login": authLogin || "",
            "lc-auth-password": authPassword || "",
            "lc-auth-password-repeat": authPasswordRepeat || ""
        };
        Object.entries(fields).forEach(([id, value]) => {
            const el = byId(id);
            if (el && document.activeElement !== el) el.value = value;
        });

        const rememberLogin = byId("lc-auth-remember-login");
        const rememberPassword = byId("lc-auth-remember-password");
        const showPassword = byId("lc-auth-show-password");
        if (rememberLogin) rememberLogin.checked = !!authRememberLogin;
        if (rememberPassword) rememberPassword.checked = !!authRememberPassword;
        if (showPassword) showPassword.checked = !!authShowPassword;

        const passType = authShowPassword ? "text" : "password";
        const password = byId("lc-auth-password");
        const passwordRepeat = byId("lc-auth-password-repeat");
        if (password) password.type = passType;
        if (passwordRepeat) passwordRepeat.type = passType;
    }

    function submit(mode) {
        try { tryStartGameMusic(); } catch (err) {}
        readFieldsToGlobals();
        authMode = mode === "register" ? "register" : "login";
        if (typeof submitAuth === "function") submitAuth(authMode);
        else {
            socket.emit(authMode === "register" ? "register" : "login", {
                login: authLogin,
                password: authPassword,
                passwordRepeat: authPasswordRepeat,
                nickname: authNickname
            });
        }
        lcAuthRefreshWindow();
    }

    function field(label, id, type, placeholder, registerOnly) {
        return `
            <label class="lc-auth-field ${registerOnly ? "lc-auth-register-only" : ""}">
                <span>${label}</span>
                <input id="${id}" type="${type}" placeholder="${placeholder}" autocomplete="${type === "password" ? "current-password" : "username"}">
            </label>`;
    }

    function makeRoot() {
        const root = document.createElement("div");
        root.id = "lc-auth-root";
        root.innerHTML = `
            <div class="lc-auth-shell">
                <div class="lc-auth-content">
                    <div class="lc-auth-header">
                        <div class="lc-auth-logo">
                            <strong>LIFE CITY</strong>
                            <span>онлайн-город 2.5D</span>
                        </div>
                        <div class="lc-auth-chip">Город загружается на фоне</div>
                    </div>
                    <div class="lc-auth-grid">
                        <div class="lc-auth-card">
                            <div class="lc-auth-card-title" id="lc-auth-title">Вход в город</div>
                            ${field("Ник", "lc-auth-nickname", "text", "Имя персонажа", true)}
                            ${field("Логин", "lc-auth-login", "text", "Введите логин", false)}
                            ${field("Пароль", "lc-auth-password", "password", "Введите пароль", false)}
                            ${field("Повтор пароля", "lc-auth-password-repeat", "password", "Повторите пароль", true)}
                            <div class="lc-auth-options">
                                <label><input id="lc-auth-remember-login" type="checkbox"> запомнить логин</label>
                                <label><input id="lc-auth-remember-password" type="checkbox"> запомнить пароль</label>
                                <label><input id="lc-auth-show-password" type="checkbox"> показать пароль</label>
                            </div>
                            <div class="lc-auth-error" id="lc-auth-error"></div>
                            <div class="lc-auth-actions">
                                <button class="lc-auth-btn" id="lc-auth-login-btn" type="button">Войти</button>
                                <button class="lc-auth-btn" id="lc-auth-register-btn" type="button">Регистрация</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(root);
        return root;
    }

    function bindRoot(root) {
        if (!root || root.dataset.bound === "1") return;
        root.dataset.bound = "1";

        ["nickname", "login", "password", "password-repeat"].forEach((name) => {
            const el = byId(`lc-auth-${name}`);
            if (!el) return;
            el.addEventListener("input", () => {
                readFieldsToGlobals();
                lcAuthRefreshWindow();
            });
            el.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    submit(getMode());
                }
            });
        });

        const showPassword = byId("lc-auth-show-password");
        if (showPassword) showPassword.addEventListener("change", () => {
            readFieldsToGlobals();
            lcAuthRefreshWindow();
        });

        const loginBtn = byId("lc-auth-login-btn");
        const registerBtn = byId("lc-auth-register-btn");
        if (loginBtn) loginBtn.addEventListener("click", () => {
            if (getMode() !== "login") setMode("login");
            else submit("login");
        });
        if (registerBtn) registerBtn.addEventListener("click", () => {
            if (getMode() !== "register") setMode("register");
            else submit("register");
        });
    }

    function lcCreateAuthWindow() {
        if (isAuthPassed()) return null;
        let root = byId("lc-auth-root");
        if (!root) root = makeRoot();
        bindRoot(root);
        root.style.display = "flex";
        root.style.visibility = "visible";
        root.style.opacity = "1";
        root.style.pointerEvents = "auto";
        root.style.background = "transparent";
        root.style.zIndex = "10050";
        root.classList.remove("lc-auth-hidden");
        document.body.classList.add("lc-auth-active");
        document.body.classList.remove("lc-auth-passed");
        lcAuthRefreshWindow();
        return root;
    }

    function lcAuthSetError(message) {
        authMessage = String(message || "");
        lcAuthRefreshWindow();
    }

    function lcAuthRefreshWindow() {
        const root = byId("lc-auth-root");
        if (!root || isAuthPassed()) return;
        const mode = getMode();
        root.dataset.mode = mode;
        writeGlobalsToFields();

        const title = byId("lc-auth-title");
        const loginBtn = byId("lc-auth-login-btn");
        const registerBtn = byId("lc-auth-register-btn");
        const error = byId("lc-auth-error");

        if (title) title.textContent = mode === "register" ? "Регистрация персонажа" : "Вход в город";
        if (loginBtn) loginBtn.textContent = mode === "login" ? "Войти" : "Вход";
        if (registerBtn) registerBtn.textContent = mode === "register" ? "Зарегистрироваться" : "Регистрация";
        if (error) {
            error.textContent = authMessage || "";
            error.style.display = authMessage ? "block" : "none";
        }
    }

    window.lcCreateAuthWindow = lcCreateAuthWindow;
    window.lcAuthSetError = lcAuthSetError;
    window.lcAuthRefreshWindow = lcAuthRefreshWindow;

    // Сохраняем старые имена, чтобы другие модули не падали.
    window.syncAuthFromDom = readFieldsToGlobals;
    window.syncAuthToDom = writeGlobalsToFields;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", lcCreateAuthWindow);
    } else {
        lcCreateAuthWindow();
    }
})();
