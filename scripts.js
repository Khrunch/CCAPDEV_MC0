(() => {
    // auth for demo purposes only (not secure, do not use in production)
    const AUTH_KEY = "tp_logged_in";

    // role + owner court
    const ROLE_KEY = "tp_role"; // "player" | "owner"
    const OWNER_COURT_KEY = "tp_owner_court"; // e.g. "greenhills2"

    // NEW: store the logged-in username (used by Profile + Reservation)
    const USERNAME_KEY = "tp_username";

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

    // NEW
    const getUsername = () => localStorage.getItem(USERNAME_KEY) || "";

    const setLoggedIn = (value) => {
        if (value) localStorage.setItem(AUTH_KEY, "1");
        else {
            localStorage.removeItem(AUTH_KEY);
            localStorage.removeItem(ROLE_KEY);
            localStorage.removeItem(OWNER_COURT_KEY);
            localStorage.removeItem(USERNAME_KEY); // NEW
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
        updateProfilePage(); // NEW
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

    function updateProfilePage() {
        const nameEl = document.getElementById("profile-name");
        const userEl = document.getElementById("profile-username");
        const avatarEl = document.getElementById("profile-avatar");

        // not on Profile Page
        if (!nameEl && !userEl && !avatarEl) return;

        if (!isLoggedIn()) {
            // keep it simple: if not logged in, go to login
            window.location.href = "Login Page.html";
            return;
        }

        const username = getUsername() || SAMPLE_USER.username;

        if (userEl) userEl.textContent = username;

        // display name fallback (since server only stores username)
        if (nameEl) nameEl.textContent = username;

        if (avatarEl) {
            const initials = username.slice(0, 2).toUpperCase();
            avatarEl.textContent = initials;
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
                    localStorage.setItem(USERNAME_KEY, data.username || ""); // NEW

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
                    localStorage.setItem(USERNAME_KEY, data.username || ""); // NEW

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

    // auto-hide topnav when scrolling down and show it again when scrolling up
    function wireAutoHideTopNav() {
        const topNavEl = document.querySelector(".top-nav");
        if (!topNavEl) return;

        let lastY = window.scrollY;
        let ticking = false;

        const HIDE_AFTER = 20;
        const DELTA = 6;

        function update() {
            const y = window.scrollY;
            const diff = y - lastY;

            if (y < HIDE_AFTER) {
                topNavEl.classList.remove("top-nav--hidden");
            } else if (diff > DELTA) {
                // scrolling down
                topNavEl.classList.add("top-nav--hidden");
            } else if (diff < -DELTA) {
                // scrolling up
                topNavEl.classList.remove("top-nav--hidden");
            }

            lastY = y;
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
    }

    wireAutoHideTopNav();

    function wireMobileNavToggle() {
        const topNav = document.querySelector(".top-nav");
        const toggleBtn = document.querySelector(".nav-toggle");
        const menu = document.getElementById("top-nav-menu");
        if (!topNav || !toggleBtn || !menu) return;

        const setOpen = (open) => {
            topNav.classList.toggle("top-nav--menu-open", open);
            toggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
        };

        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const open = !topNav.classList.contains("top-nav--menu-open");
            setOpen(open);
        });

        // close when clicking outside
        document.addEventListener("click", (e) => {
            if (!topNav.classList.contains("top-nav--menu-open")) return;
            if (topNav.contains(e.target)) return;
            setOpen(false);
        });

        // close after tapping a link (mobile UX)
        menu.addEventListener("click", (e) => {
            const a = e.target.closest("a");
            if (!a) return;
            setOpen(false);
        });

        // close if switching back to desktop width
        window.addEventListener("resize", () => {
            if (window.innerWidth > 768) setOpen(false);
        });
    }

    wireMobileNavToggle();

    async function initReservationPage() {
        const dateInput = document.getElementById("res-date");
        const slotsEl = document.getElementById("time-slots");
        const reserveBtn = document.getElementById("reserve-btn");
        const backBtn = document.getElementById("back-to-court");

        if (!dateInput || !slotsEl || !reserveBtn) return;

        const params = new URLSearchParams(window.location.search);
        const court = params.get("court") || "greenhills2";
        const bookingCourt = document.getElementById("booking-court");
        if (bookingCourt) {
        bookingCourt.textContent = `Booking for: ${court.replace(/_/g, " ")}`;
        }

        if (backBtn) {
            backBtn.href = `Court Profile Page.html?court=${encodeURIComponent(court)}`;
        }

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

    function initWeekCalendarReservation() {
        const calRoot = document.getElementById("reservation-calendar");
        if (!calRoot) return; // not on Court Reservation Page

        const AUTH_KEY = "tp_logged_in";
        const USERNAME_KEY = "tp_username";

        const weekLabel = document.getElementById("week-label");
        const prevBtn = document.getElementById("week-prev");
        const nextBtn = document.getElementById("week-next");

        const courtNameEl = document.getElementById("res-court-name");
        const selectedCountEl = document.getElementById("selected-count");
        const selectedListEl = document.getElementById("selected-list");

        const clearBtn = document.getElementById("clear-selection");
        const reserveBtn = document.getElementById("reserve-selected");

        const params = new URLSearchParams(window.location.search);
        const courtKey = params.get("court") || "greenhills2";
        if (courtNameEl) courtNameEl.textContent = courtKey;

        const isLoggedIn = () => localStorage.getItem(AUTH_KEY) === "1";
        const getUsername = () => localStorage.getItem(USERNAME_KEY) || "";

        // Monday as week start
        const startOfWeek = (d) => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            const day = date.getDay(); // 0 Sun .. 6 Sat
            const diff = (day === 0 ? -6 : 1) - day; // move to Monday
            date.setDate(date.getDate() + diff);
            return date;
        };

        const addDays = (d, n) => {
            const x = new Date(d);
            x.setDate(x.getDate() + n);
            return x;
        };

        const fmtDayHeader = (d) =>
            d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

        const fmtISODate = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${day}`;
        };

        const timeSlots = [];
        // 07:00–21:00, 1-hour slots
        for (let h = 7; h <= 21; h++) {
            timeSlots.push(`${String(h).padStart(2, "0")}:00`);
        }

        let weekStart = startOfWeek(new Date());
        const selected = new Set(); // key = `${isoDate}|${time}`

        const updateSelectedUI = () => {
            if (selectedCountEl) selectedCountEl.textContent = String(selected.size);

            if (selectedListEl) {
                if (selected.size === 0) {
                    selectedListEl.textContent = "No slots selected.";
                } else {
                    const items = [...selected]
                        .sort()
                        .map((k) => {
                            const [date, time] = k.split("|");
                            return `${date} @ ${time}`;
                        });
                    selectedListEl.innerHTML = `Selected:<br>${items.map((x) => `• ${x}`).join("<br>")}`;
                }
            }
        };

        const render = () => {
            const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
            const weekEnd = addDays(weekStart, 6);

            if (weekLabel) {
                const a = weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                const b = weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
                weekLabel.textContent = `${a} – ${b}`;
            }

            // build grid: header row + (timeSlots.length) rows
            calRoot.innerHTML = "";
            const grid = document.createElement("div");
            grid.className = "week-calendar__grid";

            // top-left header (blank)
            const corner = document.createElement("div");
            corner.className = "week-calendar__cell week-calendar__cell--header";
            corner.textContent = "Time";
            grid.appendChild(corner);

            // day headers
            for (const d of days) {
                const hd = document.createElement("div");
                hd.className = "week-calendar__cell week-calendar__cell--header";
                hd.textContent = fmtDayHeader(d);
                grid.appendChild(hd);
            }

            // rows
            for (const t of timeSlots) {
                // left time label
                const tl = document.createElement("div");
                tl.className = "week-calendar__cell week-calendar__cell--time";
                tl.textContent = t;
                grid.appendChild(tl);

                // 7 day slots
                for (const d of days) {
                    const iso = fmtISODate(d);
                    const key = `${iso}|${t}`;

                    const cell = document.createElement("div");
                    cell.className = "week-calendar__cell week-calendar__cell--slot";

                    const cb = document.createElement("input");
                    cb.type = "checkbox";
                    cb.className = "week-calendar__checkbox";
                    cb.checked = selected.has(key);
                    cb.setAttribute("aria-label", `Select ${iso} ${t}`);

                    cb.addEventListener("change", () => {
                        if (cb.checked) selected.add(key);
                        else selected.delete(key);
                        updateSelectedUI();
                    });

                    cell.appendChild(cb);
                    grid.appendChild(cell);
                }
            }

            calRoot.appendChild(grid);
            updateSelectedUI();
        };

        prevBtn?.addEventListener("click", () => {
            weekStart = addDays(weekStart, -7);
            render();
        });

        nextBtn?.addEventListener("click", () => {
            weekStart = addDays(weekStart, 7);
            render();
        });

        clearBtn?.addEventListener("click", () => {
            selected.clear();
            render();
        });

        reserveBtn?.addEventListener("click", async () => {
            if (!isLoggedIn()) {
                window.location.href = "Login Page.html";
                return;
            }
            if (selected.size === 0) {
                alert("Select at least one time slot.");
                return;
            }

            const username = getUsername() || "terryp";
            const slots = [...selected].map((k) => {
                const [date, time] = k.split("|");
                return { date, time };
            });

            try {
                const resp = await fetch("/api/reservations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, courtKey, slots }),
                });

                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                alert("Reservation submitted!");
                selected.clear();
                render();
            } catch {
                alert(`Selected slots (demo):\n${slots.map((s) => `${s.date} @ ${s.time}`).join("\n")}`);
            }
        });

        render();
    }

    async function initReservationPage() {
        const dateInput = document.getElementById("res-date");
        const slotsEl = document.getElementById("time-slots");
        const reserveBtn = document.getElementById("reserve-btn");
        const backBtn = document.getElementById("back-to-court");

        if (!dateInput || !slotsEl || !reserveBtn) return;

        const params = new URLSearchParams(window.location.search);
        const court = params.get("court") || "greenhills2";
        const bookingCourt = document.getElementById("booking-court");
        if (bookingCourt) {
        bookingCourt.textContent = `Booking for: ${court.replace(/_/g, " ")}`;
        }

        if (backBtn) {
            backBtn.href = `Court Profile Page.html?court=${encodeURIComponent(court)}`;
        }

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

    initWeekCalendarReservation();

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

    // auto-hide topnav when scrolling down and show it again when scrolling up
    function wireAutoHideTopNav() {
        const topNavEl = document.querySelector(".top-nav");
        if (!topNavEl) return;

        let lastY = window.scrollY;
        let ticking = false;

        const HIDE_AFTER = 20;
        const DELTA = 6;

        function update() {
            const y = window.scrollY;
            const diff = y - lastY;

            if (y < HIDE_AFTER) {
                topNavEl.classList.remove("top-nav--hidden");
            } else if (diff > DELTA) {
                // scrolling down
                topNavEl.classList.add("top-nav--hidden");
            } else if (diff < -DELTA) {
                // scrolling up
                topNavEl.classList.remove("top-nav--hidden");
            }

            lastY = y;
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
    }

    wireAutoHideTopNav();

})();