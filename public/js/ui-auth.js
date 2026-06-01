// ===============================
// 🔐 UI AUTH — вход, регистрация, DOM-поля авторизации
// ===============================
function cleanAuthLoginInput(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9_\-.@]/g, "").slice(0, 18);
}

function cleanAuthPasswordInput(value) {
    return String(value || "").replace(/[^A-Za-z0-9_\-.!@#$%^&*+=?]/g, "").slice(0, 24);
}

function cleanAuthNicknameInput(value) {
    return String(value || "")
        .replace(/[^A-Za-zА-Яа-яЁё0-9 _\-.!@#$%^&*+=?]/g, "")
        .slice(0, 16);
}

function setAuthMode(mode) {
    authMode = mode === "register" ? "register" : "login";
    authMessage = "";
    authFocus = authMode === "register" ? "nickname" : "login";
    syncAuthToDom();
    setTimeout(() => {
        const el = authDom[authFocus];
        if (el && el.style.display !== "none") el.focus();
    }, 0);
}

function submitAuth(mode = authMode) {
    tryStartGameMusic();
    syncAuthFromDom();
    const login = cleanAuthLoginInput(authLogin.trim());
    const password = cleanAuthPasswordInput(authPassword.trim());
    const passwordRepeat = cleanAuthPasswordInput(authPasswordRepeat.trim());
    const nickname = cleanAuthNicknameInput(authNickname.trim());

    authLogin = login;
    authPassword = password;
    authPasswordRepeat = passwordRepeat;
    authNickname = nickname;

    if (login.length < 3 || password.length < 3) {
        authMessage = "Логин и пароль минимум 3 символа";
        authFocus = login.length < 3 ? "login" : "password";
        return;
    }

    if (mode === "register") {
        if (nickname.length < 2) {
            authMessage = "Ник минимум 2 символа";
            authFocus = "nickname";
            return;
        }

        if (password !== passwordRepeat) {
            authMessage = "Пароли не совпадают";
            authFocus = "passwordRepeat";
            return;
        }
    }

    authMode = mode;
    saveAuthSettings(login, password);

    socket.emit(mode === "register" ? "register" : "login", {
        login,
        password,
        passwordRepeat,
        nickname
    });

    authMessage = mode === "register" ? "Создаём персонажа..." : "Входим...";
}

function getAuthFocusOrder() {
    return authMode === "register"
        ? ["nickname", "login", "password", "passwordRepeat"]
        : ["login", "password"];
}

function handleAuthKey(e) {
    const key = e.key;

    if (key === "Tab") {
        e.preventDefault();
        const order = getAuthFocusOrder();
        const index = Math.max(0, order.indexOf(authFocus));
        authFocus = order[(index + 1) % order.length];
        return;
    }

    if (key === "Enter") {
        submitAuth(authMode);
        return;
    }

    if (key === "Backspace") {
        if (authFocus === "nickname") authNickname = authNickname.slice(0, -1);
        if (authFocus === "login") authLogin = authLogin.slice(0, -1);
        if (authFocus === "password") authPassword = authPassword.slice(0, -1);
        if (authFocus === "passwordRepeat") authPasswordRepeat = authPasswordRepeat.slice(0, -1);
        syncAuthToDom();
        return;
    }

    if (key.length === 1) {
        if (authFocus === "nickname") authNickname = cleanAuthNicknameInput(authNickname + key);
        if (authFocus === "login") authLogin = cleanAuthLoginInput(authLogin + key);
        if (authFocus === "password") authPassword = cleanAuthPasswordInput(authPassword + key);
        if (authFocus === "passwordRepeat") authPasswordRepeat = cleanAuthPasswordInput(authPasswordRepeat + key);
        syncAuthToDom();
    }
}

function pointInButton(mx, my, button) {
    return button && mx >= button.x && mx <= button.x + button.w && my >= button.y && my <= button.y + button.h;
}

function handleAuthClick(mx, my) {
    const b = authButtons;

    if (authMode === "register" && pointInButton(mx, my, b.nicknameInput)) {
        authFocus = "nickname";
        syncAuthToDom();
        if (authDom.nickname) authDom.nickname.focus();
        return;
    }

    if (pointInButton(mx, my, b.loginInput)) {
        authFocus = "login";
        syncAuthToDom();
        if (authDom.login) authDom.login.focus();
        return;
    }

    if (pointInButton(mx, my, b.passwordInput)) {
        authFocus = "password";
        syncAuthToDom();
        if (authDom.password) authDom.password.focus();
        return;
    }

    if (authMode === "register" && pointInButton(mx, my, b.passwordRepeatInput)) {
        authFocus = "passwordRepeat";
        syncAuthToDom();
        if (authDom.passwordRepeat) authDom.passwordRepeat.focus();
        return;
    }

    if (pointInButton(mx, my, b.rememberLogin)) {
        syncAuthFromDom();
        authRememberLogin = !authRememberLogin;
        if (!authRememberLogin) authRememberPassword = false;
        saveAuthSettings(authLogin.trim(), authPassword.trim());
        return;
    }

    if (pointInButton(mx, my, b.rememberPassword)) {
        syncAuthFromDom();
        authRememberPassword = !authRememberPassword;
        if (authRememberPassword) authRememberLogin = true;
        saveAuthSettings(authLogin.trim(), authPassword.trim());
        return;
    }

    if (pointInButton(mx, my, b.showPassword)) {
        authShowPassword = !authShowPassword;
        syncAuthToDom();
        return;
    }

    if (pointInButton(mx, my, b.login)) {
        if (authMode !== "login") setAuthMode("login");
        else submitAuth("login");
        return;
    }

    if (pointInButton(mx, my, b.register)) {
        if (authMode !== "register") setAuthMode("register");
        else submitAuth("register");
    }
}


function isAuthDomTarget(target) {
    return !!(target && target.classList && (target.classList.contains("lifecity-auth-input") || target.classList.contains("lifecity-auth-button")));
}

function getAuthDomValue(field) {
    const el = authDom[field];
    return el ? el.value : "";
}

function syncAuthFromDom() {
    if (!authDomReady) return;

    if (authDom.nickname) authNickname = cleanAuthNicknameInput(authDom.nickname.value);
    if (authDom.login) authLogin = cleanAuthLoginInput(authDom.login.value);
    if (authDom.password) authPassword = cleanAuthPasswordInput(authDom.password.value);
    if (authDom.passwordRepeat) authPasswordRepeat = cleanAuthPasswordInput(authDom.passwordRepeat.value);
}

function syncAuthToDom() {
    if (!authDomReady) return;

    if (authDom.nickname && authDom.nickname.value !== authNickname) authDom.nickname.value = authNickname;
    if (authDom.login && authDom.login.value !== authLogin) authDom.login.value = authLogin;
    if (authDom.password && authDom.password.value !== authPassword) authDom.password.value = authPassword;
    if (authDom.passwordRepeat && authDom.passwordRepeat.value !== authPasswordRepeat) authDom.passwordRepeat.value = authPasswordRepeat;

    const passwordType = authShowPassword ? "text" : "password";
    if (authDom.password) authDom.password.type = passwordType;
    if (authDom.passwordRepeat) authDom.passwordRepeat.type = passwordType;
}


function createAuthButtonElement(type) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lifecity-auth-button";
    btn.dataset.type = type;
    btn.style.position = "fixed";
    btn.style.zIndex = 10050;
    btn.style.pointerEvents = "auto";
    btn.style.touchAction = "manipulation";
    btn.style.boxSizing = "border-box";
    btn.style.borderRadius = "14px";
    btn.style.border = "1px solid rgba(185,235,255,0.48)";
    btn.style.color = "#f7fbff";
    btn.style.font = "900 16px Segoe UI, Trebuchet MS, Arial, sans-serif";
    btn.style.letterSpacing = "0.45px";
    btn.style.textTransform = "none";
    btn.style.cursor = "pointer";
    btn.style.userSelect = "none";
    btn.style.overflow = "hidden";
    btn.style.boxShadow = "0 12px 28px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.24), 0 0 22px rgba(88,199,255,0.18)";
    btn.style.backdropFilter = "blur(10px)";
    btn.addEventListener("pointerdown", (e) => {
        btn.classList.add("is-pressed");
        e.stopPropagation();
    });
    btn.addEventListener("pointerup", () => btn.classList.remove("is-pressed"));
    btn.addEventListener("pointerleave", () => btn.classList.remove("is-pressed"));
    btn.addEventListener("mousedown", (e) => {
        e.stopPropagation();
    });
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        tryStartGameMusic();
        syncAuthFromDom();
        if (type === "login") {
            if (authMode !== "login") setAuthMode("login");
            else submitAuth("login");
        }
        if (type === "register") {
            if (authMode !== "register") setAuthMode("register");
            else submitAuth("register");
        }
    });
    document.body.appendChild(btn);
    return btn;
}

function createAuthInputElement(field) {
    const el = document.createElement("input");
    el.className = "lifecity-auth-input";
    el.autocomplete = "off";
    el.spellcheck = false;
    el.dataset.field = field;
    el.style.position = "fixed";
    el.style.zIndex = 10040;
    el.style.pointerEvents = "auto";
    el.style.boxSizing = "border-box";
    el.style.borderRadius = "14px";
    el.style.border = "0";
    el.style.background = "transparent";
    el.style.backgroundSize = "auto";
    el.style.color = "#f7fbff";
    el.style.outline = "none";
    el.style.font = "800 18px Segoe UI, Trebuchet MS, Arial, sans-serif";
    el.style.padding = "25px 18px 6px 18px";
    el.style.caretColor = "#78dcff";
    el.style.boxShadow = "none";
    el.style.transition = "filter .18s ease";

    el.addEventListener("focus", () => {
        authFocus = field;
        el.style.border = "2px solid #8fe7ff";
        el.style.boxShadow = "0 0 24px rgba(88,199,255,0.30), 0 0 40px rgba(88,199,255,0.10), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 0 20px rgba(88,199,255,0.14)";
        el.style.filter = "brightness(1.08)";
    });

    el.addEventListener("blur", () => {
        el.style.border = "0";
        el.style.boxShadow = "none";
        el.style.filter = "brightness(1)";
    });

    el.addEventListener("input", () => {
        const start = el.selectionStart;
        const end = el.selectionEnd;

        if (field === "nickname") el.value = cleanAuthNicknameInput(el.value);
        if (field === "login") el.value = cleanAuthLoginInput(el.value);
        if (field === "password" || field === "passwordRepeat") el.value = cleanAuthPasswordInput(el.value);

        try {
            const pos = Math.min(el.value.length, start ?? el.value.length);
            el.setSelectionRange(Math.min(pos, el.value.length), Math.min(end ?? pos, el.value.length));
        } catch (_) {}

        syncAuthFromDom();
    });

    // Нативные copy/cut/paste/select работают сами, включая Ctrl+C/X/V и меню мыши.
    document.body.appendChild(el);
    return el;
}

function ensureAuthDom() {
    if (authDomReady) return;

    const style = document.createElement("style");
    style.textContent = `
        @keyframes lcHudButtonShine {
            0%, 22% { transform: translateX(-135%) skewX(-18deg); opacity: 0; }
            38% { opacity: .52; }
            58% { transform: translateX(145%) skewX(-18deg); opacity: 0; }
            100% { transform: translateX(145%) skewX(-18deg); opacity: 0; }
        }

        .lifecity-auth-input,
        .lifecity-auth-input:focus,
        .lifecity-auth-input:hover,
        .lifecity-auth-input:active,
        .lifecity-auth-input:-webkit-autofill,
        .lifecity-auth-input:-webkit-autofill:hover,
        .lifecity-auth-input:-webkit-autofill:focus,
        .lifecity-auth-input:-webkit-autofill:active {
            background: transparent !important;
            border: 0 !important;
            outline: 0 !important;
            box-shadow: none !important;
            font-family: "Segoe UI", "Trebuchet MS", Arial, sans-serif !important;
            font-size: 18px !important;
            font-weight: 800 !important;
            line-height: 20px !important;
            letter-spacing: .25px !important;
            color: #f8fdff !important;
            -webkit-text-fill-color: #f8fdff !important;
            caret-color: #86e4ff !important;
            text-shadow: 0 0 10px rgba(80,190,255,.25), 0 1px 2px rgba(0,0,0,.45) !important;
            appearance: none !important;
            -webkit-appearance: none !important;
        }
        .lifecity-auth-input:-webkit-autofill,
        .lifecity-auth-input:-webkit-autofill:hover,
        .lifecity-auth-input:-webkit-autofill:focus,
        .lifecity-auth-input:-webkit-autofill:active {
            transition: background-color 999999s ease-in-out 0s, color 999999s ease-in-out 0s !important;
            -webkit-background-clip: text !important;
            background-clip: text !important;
        }
        .lifecity-auth-input::selection { background: rgba(88,199,255,.45); color: #ffffff; }
        .lifecity-auth-input::-moz-selection { background: rgba(88,199,255,.45); color: #ffffff; }

        .lifecity-auth-button {
            position: fixed !important;
            isolation: isolate !important;
            overflow: hidden !important;
            color: #f8fdff !important;
            -webkit-text-fill-color: #f8fdff !important;
            font-family: "Segoe UI", "Trebuchet MS", Arial, sans-serif !important;
            font-size: 16px !important;
            font-weight: 900 !important;
            letter-spacing: .45px !important;
            text-transform: none !important;
            text-shadow: 0 0 10px rgba(150,230,255,.44), 0 1px 2px rgba(0,0,0,.45) !important;
            background-size: 180% 180% !important;
            transition: transform .12s ease, filter .18s ease, box-shadow .18s ease, border-color .18s ease !important;
        }
        .lifecity-auth-button::before {
            content: "";
            position: absolute;
            top: -45%;
            bottom: -45%;
            left: -32%;
            width: 34%;
            z-index: -1;
            pointer-events: none;
            background: linear-gradient(105deg, transparent 0%, rgba(255,255,255,.08) 30%, rgba(210,250,255,.40) 50%, rgba(255,255,255,.10) 64%, transparent 100%);
            animation: lcHudButtonShine 4.4s ease-in-out infinite;
        }
        .lifecity-auth-button:hover {
            transform: translateY(-1px) !important;
            filter: brightness(1.12) saturate(1.08) !important;
            border-color: rgba(220,248,255,.82) !important;
            box-shadow: 0 14px 30px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.28), 0 0 30px rgba(84,196,255,.28) !important;
        }
        .lifecity-auth-button.is-pressed,
        .lifecity-auth-button:active {
            transform: translateY(2px) scale(.985) !important;
            filter: brightness(.92) !important;
            box-shadow: 0 7px 16px rgba(0,0,0,.38), inset 0 3px 10px rgba(0,0,0,.30), 0 0 15px rgba(88,199,255,.12) !important;
        }
    `;
    document.head.appendChild(style);

    authDom.nickname = createAuthInputElement("nickname");
    authDom.login = createAuthInputElement("login");
    authDom.password = createAuthInputElement("password");
    authDom.passwordRepeat = createAuthInputElement("passwordRepeat");
    authDom.loginButton = createAuthButtonElement("login");
    authDom.registerButton = createAuthButtonElement("register");

    authDomReady = true;
    syncAuthToDom();
}

function hideAuthDom() {
    if (!authDomReady) return;
    for (const key of Object.keys(authDom)) {
        if (authDom[key]) authDom[key].style.display = "none";
    }
}

function positionAuthDomInput(field, rect, visible) {
    const el = authDom[field];
    if (!el) return;

    if (!visible) {
        el.style.display = "none";
        return;
    }

    el.style.display = "block";
    el.style.left = rect.x + "px";
    el.style.top = rect.y + "px";
    el.style.width = rect.w + "px";
    el.style.height = rect.h + "px";
    el.type = (field === "password" || field === "passwordRepeat") && !authShowPassword ? "password" : "text";
    el.placeholder = "";
}


function positionAuthDomButton(type, rect, text, color, active) {
    const btn = type === "login" ? authDom.loginButton : authDom.registerButton;
    if (!btn) return;
    btn.style.display = isAuthenticated ? "none" : "block";
    btn.style.left = rect.x + "px";
    btn.style.top = rect.y + "px";
    btn.style.width = rect.w + "px";
    btn.style.height = rect.h + "px";
    btn.textContent = text;
    const activeGlow = active ? "rgba(88,199,255,0.30)" : "rgba(88,199,255,0.14)";
    btn.style.background = active
        ? "radial-gradient(circle at 24% 0%, rgba(255,255,255,0.22), transparent 35%), linear-gradient(135deg, rgba(93,190,245,0.92), rgba(46,132,207,0.88))"
        : "radial-gradient(circle at 78% 0%, rgba(255,255,255,0.16), transparent 36%), linear-gradient(135deg, rgba(68,142,206,0.78), rgba(38,88,148,0.74))";
    btn.style.borderColor = active ? "rgba(210,246,255,0.72)" : "rgba(170,225,255,0.44)";
    btn.style.boxShadow = `0 12px 28px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 24px ${activeGlow}`;
}

function drawAuthInputLabel(x, y, label, focused) {
    ctx.save();
    ctx.fillStyle = focused ? "#ffffff" : "#f1fbff";
    ctx.shadowColor = focused ? "rgba(88,199,255,0.85)" : "rgba(88,199,255,0.42)";
    ctx.shadowBlur = focused ? 14 : 8;
    ctx.font = "800 14px Segoe UI, Trebuchet MS, Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(label.toUpperCase(), x + 15, y + 17);
    ctx.restore();
}

function drawAuthCheckbox(button, label, checked) {
    ctx.save();
    const box = 18;

    roundedRect(button.x, button.y, box, box, 5);
    ctx.fillStyle = checked ? "rgba(88,199,255,0.20)" : "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.strokeStyle = checked ? UI.blue : UI.border;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    if (checked) {
        ctx.strokeStyle = UI.green;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(button.x + 4, button.y + 9);
        ctx.lineTo(button.x + 8, button.y + 13);
        ctx.lineTo(button.x + 15, button.y + 5);
        ctx.stroke();
    }

    ctx.fillStyle = "#f2fbff";
    ctx.shadowColor = "rgba(88,199,255,0.35)";
    ctx.shadowBlur = 7;
    ctx.font = "800 16px Segoe UI, Trebuchet MS, Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, button.x + 26, button.y + box / 2 + 1);
    ctx.restore();
}

function drawAuthInput(x, y, w, h, label, value, focused, isPassword = false) {
    try { const a = Array.from(arguments); drawLifeCityAuthHudInput(a[0], a[1], a[2], a[3], !!a[4]); } catch(e) {}

    ctx.save();
    roundedRect(x, y, w, h, 12);
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "rgba(74,112,142,0.46)");
    g.addColorStop(0.48, "rgba(42,76,104,0.42)");
    g.addColorStop(1, "rgba(22,50,78,0.46)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = focused ? "rgba(220,248,255,0.92)" : "rgba(172,225,255,0.42)";
    ctx.lineWidth = focused ? 2 : 1.2;
    ctx.stroke();
    ctx.restore();

    drawAuthInputLabel(x, y, label, focused);
}

function drawAuthScreen() {
    const LIFE_CITY_OLD_DRAW_AUTH_SCREEN_DISABLED = true;
    // Старое canvas-окно авторизации не рисуем: работает только чистый DOM-слой #lc-auth-root.
    // Погодный auth FX рисуется один раз в основном draw(), выше HUD.
    try { lcCreateAuthWindow(); lcUpdateAuthWindowVisibility(); } catch(e) {}
}


