(() => {
    // auth for demo purposes only (not secure, do not use in production)
    const AUTH_KEY = "tp_logged_in";

    // sample login
    const SAMPLE_USER = { username: "terryp", password: "pickle123" };

    const isLoggedIn = () => localStorage.getItem(AUTH_KEY) === "1";
    const setLoggedIn = (value) => {
        if (value) localStorage.setItem(AUTH_KEY, "1");
        else localStorage.removeItem(AUTH_KEY);
    };

    function updateAuthNav() {
        const loginLink = document.getElementById("nav-login");
        const profileLink = document.getElementById("nav-profile");
        const primaryBtn = document.getElementById("nav-primary");

        // home page CTA (optional)
        const ctaSignup = document.getElementById("cta-signup");
        const ctaLogin = document.getElementById("cta-login");
        const ctaProfile = document.getElementById("cta-profile");

        const loggedIn = isLoggedIn();

        if (loginLink) loginLink.style.display = loggedIn ? "none" : "";
        if (profileLink) profileLink.style.display = loggedIn ? "" : "none";

        if (primaryBtn) {
            if (loggedIn) {
                primaryBtn.textContent = "Log out";
                primaryBtn.href = "#";
                primaryBtn.dataset.action = "logout";
            } else {
                primaryBtn.textContent = "Sign Up";
                primaryBtn.href = "Signup Page.html";
                delete primaryBtn.dataset.action;
            }
        }

        if (ctaSignup) ctaSignup.style.display = loggedIn ? "none" : "";
        if (ctaLogin) ctaLogin.style.display = loggedIn ? "none" : "";
        if (ctaProfile) ctaProfile.style.display = loggedIn ? "" : "none";
    }

    function wireAuthForms() {
        const loginForm = document.querySelector('form[action="/login"]');
        if (loginForm) {
            loginForm.addEventListener("submit", (e) => {
                e.preventDefault();

                const username = loginForm.querySelector('input[name="username"]')?.value?.trim() ?? "";
                const password = loginForm.querySelector('input[name="password"]')?.value ?? "";

                if (username === SAMPLE_USER.username && password === SAMPLE_USER.password) {
                    setLoggedIn(true);
                    updateAuthNav();
                    window.location.href = "Profile Page.html";
                } else {
                    alert(`Invalid demo credentials.\nTry: ${SAMPLE_USER.username} / ${SAMPLE_USER.password}`);
                }
            });
        }

        const signupForm = document.querySelector('form[action="/signup"]');
        if (signupForm) {
            signupForm.addEventListener("submit", (e) => {
                e.preventDefault();
                setLoggedIn(true);
                updateAuthNav();
                window.location.href = "Profile Page.html";
            });
        }
    }

    // logout handler (works for navbar + profile page button)
    document.addEventListener("click", (e) => {
        const logoutEl = e.target.closest('[data-action="logout"]');
        if (!logoutEl) return;

        e.preventDefault();
        setLoggedIn(false);
        updateAuthNav();
        window.location.href = "Home Page.html";
    });

    updateAuthNav();
    wireAuthForms();

    // hide topnav when scrolling down and show it again when scrolling up
    const nav = document.querySelector(".top-nav");
    if (!nav) return;

    let lastY = window.scrollY;
    let ticking = false;

    const HIDE_AFTER = 20;
    const DELTA = 6;

    function update() {
        const y = window.scrollY;
        const diff = y - lastY;

        if (y <= HIDE_AFTER) {
            nav.classList.remove("top-nav--hidden");
            lastY = y;
            ticking = false;
            return;
        }

        if (Math.abs(diff) >= DELTA) {
            if (diff > 0) nav.classList.add("top-nav--hidden");
            else nav.classList.remove("top-nav--hidden");
            lastY = y;
        }

        ticking = false;
    }

    window.addEventListener(
        "scroll",
        () => {
            if (!ticking) {
                window.requestAnimationFrame(update);
                ticking = true;
            }
        },
        { passive: true }
    );
})();