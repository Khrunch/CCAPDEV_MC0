(() => {
    // auth for demo purposes only (not secure, do not use in production)
    const AUTH_KEY = "tp_logged_in";

    // NEW: role + owner court
    const ROLE_KEY = "tp_role"; // "player" | "owner"
    const OWNER_COURT_KEY = "tp_owner_court"; // e.g. "greenhills2"

    // sample login
    const SAMPLE_USER = { username: "terryp", password: "pickle123", role: "player" };

    // sample court owner account
    const SAMPLE_OWNER = { username: "owner1", password: "pickle123", role: "owner", courtKey: "greenhills2" };

    const isLoggedIn = () => localStorage.getItem(AUTH_KEY) === "1";

    const getRole = () => localStorage.getItem(ROLE_KEY) || "";
    const setRole = (role) => {
        if (!role) localStorage.removeItem(ROLE_KEY);
        else localStorage.setItem(ROLE_KEY, role);
    };

    const getOwnerCourt = () => localStorage.getItem(OWNER_COURT_KEY) || "";
    const setOwnerCourt = (courtKey) => {
        if (!courtKey) localStorage.removeItem(OWNER_COURT_KEY);
        else localStorage.setItem(OWNER_COURT_KEY, courtKey);
    };

    const setLoggedIn = (value) => {
        if (value) localStorage.setItem(AUTH_KEY, "1");
        else {
            localStorage.removeItem(AUTH_KEY);
            localStorage.removeItem(ROLE_KEY);
            localStorage.removeItem(OWNER_COURT_KEY);
        }
    };

    function updateAuthNav() {
        const loginLink = document.getElementById("nav-login");
        const profileLink = document.getElementById("nav-profile");
        const ownerLink = document.getElementById("nav-owner");
        const primaryBtn = document.getElementById("nav-primary");

        // home page CTA (optional)
        const ctaSignup = document.getElementById("cta-signup");
        const ctaLogin = document.getElementById("cta-login");
        const ctaOwner = document.getElementById("cta-owner"); // NEW
        const ctaProfile = document.getElementById("cta-profile");

        const loggedIn = isLoggedIn();
        const role = getRole();

        if (loginLink) loginLink.style.display = loggedIn ? "none" : "";

        if (profileLink) profileLink.style.display = loggedIn && role !== "owner" ? "" : "none";
        if (ownerLink) ownerLink.style.display = loggedIn && role === "owner" ? "" : "none";

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

        // hide owner registration CTA once logged in (fix for owner accounts)
        if (ctaOwner) ctaOwner.style.display = loggedIn ? "none" : "";

        if (ctaProfile) ctaProfile.style.display = loggedIn && role !== "owner" ? "" : "none";

        updateHomeForRole();
        updateCourtProfileForRole();
    }

    function updateHomeForRole() {
        const featured = document.getElementById("featured-courts");
        const ownerHome = document.getElementById("owner-home");
        const ownerCourtLink = document.getElementById("owner-court-link");

        const loggedIn = isLoggedIn();
        const role = getRole();

        if (!featured && !ownerHome) return;

        if (loggedIn && role === "owner") {
            if (featured) featured.style.display = "none";
            if (ownerHome) ownerHome.style.display = "";
            if (ownerCourtLink) {
                const courtKey = getOwnerCourt() || SAMPLE_OWNER.courtKey;
                ownerCourtLink.href = `Court Profile Page.html?court=${encodeURIComponent(courtKey)}`;
            }
        } else {
            if (featured) featured.style.display = "";
            if (ownerHome) ownerHome.style.display = "none";
        }
    }

    function updateCourtProfileForRole() {
        // only runs meaningfully on Court Profile page (elements may not exist elsewhere)
        const manageBtn = document.getElementById("btn-manage");
        if (!manageBtn) return;

        const loggedIn = isLoggedIn();
        const role = getRole();
        const ownerCourt = getOwnerCourt();

        const params = new URLSearchParams(window.location.search);
        const currentCourt = params.get("court") || "greenhills2";

        const isOwnerViewingOwnCourt =
            loggedIn && role === "owner" && ownerCourt && ownerCourt === currentCourt;

        manageBtn.style.display = isOwnerViewingOwnCourt ? "" : "none";
        if (isOwnerViewingOwnCourt) {
            manageBtn.href = `Owner Dashboard.html?court=${encodeURIComponent(currentCourt)}`;
        }
    }

    async function postForm(url, formEl) {
        const formData = new FormData(formEl);
        const body = new URLSearchParams();
        for (const [k, v] of formData.entries()) body.set(k, String(v));

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
            body: body.toString(),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
            const msg = data?.error || `Request failed (${res.status})`;
            throw new Error(msg);
        }
        return data;
    }

    function wireAuthForms() {
        const loginForm = document.querySelector('form[action="/login"]');
        if (loginForm) {
            loginForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                try {
                    const data = await postForm("/login", loginForm);

                    setLoggedIn(true);
                    setRole(data.role || "");
                    setOwnerCourt(data.ownerCourt || "");

                    updateAuthNav();
                    window.location.href = data.role === "owner" ? "Owner Dashboard.html" : "Profile Page.html";
                } catch (err) {
                    alert(err?.message || "Login failed.");
                }
            });
        }

        const signupForm = document.querySelector('form[action="/signup"]');
        if (signupForm) {
            signupForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                try {
                    const data = await postForm("/signup", signupForm);

                    setLoggedIn(true);
                    setRole(data.role || "");
                    setOwnerCourt(data.ownerCourt || "");

                    updateAuthNav();
                    window.location.href = data.role === "owner" ? "Owner Dashboard.html" : "Profile Page.html";
                } catch (err) {
                    alert(err?.message || "Signup failed.");
                }
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

    async function initReservationPage() {
    const dateInput = document.getElementById("res-date");
    const slotsEl = document.getElementById("time-slots");
    const reserveBtn = document.getElementById("reserve-btn");

    if (!dateInput || !slotsEl || !reserveBtn) return;

    const params = new URLSearchParams(window.location.search);
    const court = params.get("court") || "greenhills2";

    const TIMES = ["5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"];

    let selectedTime = null;

    async function loadAvailability() {
        const date = dateInput.value;
        if (!date) return;

        const res = await fetch(`/availability?court=${court}&date=${date}`);
        const data = await res.json();

        slotsEl.innerHTML = "";
        selectedTime = null;
        reserveBtn.disabled = true;

        TIMES.forEach((t) => {
        const div = document.createElement("div");
        div.className = "time-slot";
        div.textContent = t;

        if (data.booked.includes(t)) {
            div.classList.add("booked");
        } else {
            div.onclick = () => {
            document.querySelectorAll(".time-slot").forEach((el) => el.classList.remove("selected"));
            div.classList.add("selected");
            selectedTime = t;
            reserveBtn.disabled = false;
            };
        }

        slotsEl.appendChild(div);
        });
    }

    dateInput.addEventListener("change", loadAvailability);

    reserveBtn.onclick = async () => {
        const date = dateInput.value;
        const username = localStorage.getItem("tp_username") || "terryp";

        const res = await fetch("/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ court, date, time: selectedTime, username }),
        });

        const data = await res.json();
        if (!data.ok) {
        alert(data.error || "Reservation failed");
        return;
        }

        alert("Reserved successfully!");
        loadAvailability();
    };
    }

    initReservationPage();

})();