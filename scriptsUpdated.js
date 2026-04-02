(() => {
    const AUTH_KEY = "tp_logged_in";
    const ROLE_KEY = "tp_role"; 
    const OWNER_COURT_KEY = "tp_owner_court"; 
    const USERNAME_KEY = "tp_username";

    const isLoggedIn = () => localStorage.getItem(AUTH_KEY) === "1";
    const getRole = () => localStorage.getItem(ROLE_KEY) || "";
    const setRole = (role) => role ? localStorage.setItem(ROLE_KEY, role) : localStorage.removeItem(ROLE_KEY);
    const getOwnerCourt = () => localStorage.getItem(OWNER_COURT_KEY) || "";
    const setOwnerCourt = (courtKey) => courtKey ? localStorage.setItem(OWNER_COURT_KEY, courtKey) : localStorage.removeItem(OWNER_COURT_KEY);
    const getUsername = () => localStorage.getItem(USERNAME_KEY) || "";

    const setLoggedIn = (value) => {
        if (value) localStorage.setItem(AUTH_KEY, "1");
        else {
            localStorage.removeItem(AUTH_KEY);
            localStorage.removeItem(ROLE_KEY);
            localStorage.removeItem(OWNER_COURT_KEY);
            localStorage.removeItem(USERNAME_KEY); 
        }
    };

    function updateAuthNav() {
        const loginLink = document.getElementById("nav-login");
        const profileLink = document.getElementById("nav-profile");
        const ownerLink = document.getElementById("nav-owner");
        const primaryBtn = document.getElementById("nav-primary");
        const ctaSignup = document.getElementById("cta-signup");
        const ctaLogin = document.getElementById("cta-login");
        const ctaOwner = document.getElementById("cta-owner"); 
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
        if (ctaOwner) ctaOwner.style.display = loggedIn ? "none" : "";
        if (ctaProfile) ctaProfile.style.display = loggedIn && role !== "owner" ? "" : "none";
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
        if (!res.ok || !data.ok) throw new Error(data?.error || `Request failed (${res.status})`);
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
                    localStorage.setItem(USERNAME_KEY, data.username || "");
                    updateAuthNav();
                    window.location.href = data.role === "owner" ? "Owner Dashboard.html" : "Profile Page.html";
                } catch (err) { alert(err?.message || "Login failed."); }
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
                    localStorage.setItem(USERNAME_KEY, data.username || "");
                    updateAuthNav();
                    window.location.href = data.role === "owner" ? "Owner Dashboard.html" : "Profile Page.html";
                } catch (err) { alert(err?.message || "Signup failed."); }
            });
        }
    }

    function wireMobileNav() {
        const navs = document.querySelectorAll(".top-nav");
        if (!navs.length) return;

        navs.forEach((nav) => {
            const toggleBtn = nav.querySelector(".nav-toggle");
            const menu = nav.querySelector(".top-nav-right");
            if (!toggleBtn || !menu) return;

            toggleBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();

                const isOpen = nav.classList.toggle("top-nav--menu-open");
                toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
            });

            menu.addEventListener("click", (e) => {
                e.stopPropagation();
            });
        });

        document.addEventListener("click", () => {
            navs.forEach((nav) => {
                nav.classList.remove("top-nav--menu-open");
                const toggleBtn = nav.querySelector(".nav-toggle");
                if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
            });
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 900) {
                navs.forEach((nav) => {
                    nav.classList.remove("top-nav--menu-open");
                    const toggleBtn = nav.querySelector(".nav-toggle");
                    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
                });
            }
        });
    }

    function wireLogoutButtons() {
        const logoutButtons = document.querySelectorAll('[data-action="logout"]');
        if (!logoutButtons.length) return;

        logoutButtons.forEach((logoutEl) => {
            logoutEl.addEventListener("click", (e) => {
                e.preventDefault();

                setLoggedIn(false);
                updateAuthNav();

                const nav = logoutEl.closest(".top-nav");
                if (nav) {
                    nav.classList.remove("top-nav--menu-open");
                    const toggleBtn = nav.querySelector(".nav-toggle");
                    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
                }

                window.location.href = "Home Page.html";
            });
        });
    }

    // ==========================================
    // Profile Management 
    // ==========================================
    async function initProfileManagement() {
        const username = getUsername();
        if (!username) return;

        const hiddenUserField = document.getElementById("edit-username-hidden");
        const displayUserField = document.getElementById("display-username");
        if (hiddenUserField) hiddenUserField.value = username;
        if (displayUserField) displayUserField.value = username;

        const els = {
            name: document.getElementById("profile-name"),
            user: document.getElementById("profile-username"),
            avatar: document.getElementById("profile-avatar"),
            editAvatar: document.getElementById("edit-profile-avatar"),
            bio: document.getElementById("profile-bio-text"),
            bioTextarea: document.getElementById("bio"),
            year: document.getElementById("profile-member-since"),
            statTotal: document.getElementById("stat-total-bookings"),
            statFav: document.getElementById("stat-favorites"),
            statUp: document.getElementById("stat-upcoming"),
            gridUp: document.getElementById("upcoming-bookings-grid"),
            gridFav: document.getElementById("saved-courts-grid")
        };

        if (els.name) els.name.textContent = username;
        if (els.user) els.user.textContent = username;
        if (els.avatar) els.avatar.textContent = username.slice(0, 2).toUpperCase();
        if (els.editAvatar) els.editAvatar.textContent = username.slice(0, 2).toUpperCase();

        try {
            const res = await fetch(`/api/user-profile-full/${username}`);
            if (!res.ok) throw new Error("Could not fetch profile");
            const data = await res.json();
            
            if (data.ok) {
                if (els.bio) els.bio.textContent = data.bio || "No bio set yet.";
                if (els.bioTextarea) els.bioTextarea.value = data.bio || "";
                if (els.year && data.memberSince) els.year.textContent = new Date(data.memberSince).getFullYear();

                if (els.statTotal) els.statTotal.textContent = data.stats.total || 0;
                if (els.statFav) els.statFav.textContent = data.stats.favorites || 0;
                if (els.statUp) els.statUp.textContent = data.stats.upcoming || 0;

                if (els.gridUp) {
                    if (!data.bookings || data.bookings.length === 0) {
                        els.gridUp.innerHTML = '<p class="card-text" style="grid-column: 1 / -1;">No upcoming bookings.</p>';
                    } else {
                        els.gridUp.innerHTML = "";
                        data.bookings.forEach(b => {
                            const date = new Date(b.startTime).toLocaleDateString();
                            const time = new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const card = document.createElement("article");
                            card.className = "card";
                            card.innerHTML = `
                                <h3 class="card-title">${b.courtId.name.replace(/_/g, ' ')}</h3>
                                <p class="card-text">${date} · ${time}</p>
                                <a class="card-link" href="Court Profile Page.html?court=${b.courtId.name}">View details</a>
                                <button class="btn btn-ghost cancel-reservation-btn" data-reservation-id="${b._id}" style="margin-top: 10px; color: #e74c3c; border-color: #e74c3c; cursor: pointer;">Cancel Reservation</button>
                            `;
                            els.gridUp.appendChild(card);
                        });

                        // Attach cancel event listeners
                        els.gridUp.querySelectorAll(".cancel-reservation-btn").forEach(btn => {
                            btn.addEventListener("click", async (e) => {
                                const reservationId = e.target.dataset.reservationId;
                                if (!confirm("Are you sure you want to cancel this reservation?")) return;

                                try {
                                    const resp = await fetch(`/api/reservations/${reservationId}/cancel`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ username: getUsername() })
                                    });
                                    const result = await resp.json();
                                    if (resp.ok && result.ok) {
                                        alert("Reservation cancelled successfully.");
                                        initProfileManagement();
                                    } else {
                                        alert(result.error || "Failed to cancel reservation.");
                                    }
                                } catch (err) {
                                    alert("Error cancelling reservation: " + err.message);
                                }
                            });
                        });
                    }
                }

                if (els.gridFav) {
                    if (!data.favorites || data.favorites.length === 0) {
                        els.gridFav.innerHTML = '<p class="card-text" style="grid-column: 1 / -1;">No favorites saved.</p>';
                    } else {
                        els.gridFav.innerHTML = "";
                        data.favorites.forEach(f => {
                            els.gridFav.innerHTML += `<article class="card"><h3 class="card-title">${f.name.replace(/_/g, ' ')}</h3><p class="card-text">${f.type} · ${f.location.address}</p><a class="card-link" href="Court Profile Page.html?court=${f.name}">Book now</a></article>`;
                        });
                    }
                }
            }
        } catch (err) { console.error(err); }
    }

    // ==========================================
    // PRE-FILL EDIT COURT PAGE
    // ==========================================
    async function initEditCourtPage() {
        const originalNameHidden = document.getElementById("edit-original-court-name");
        if (!originalNameHidden) return; 

        const courtKey = getOwnerCourt();
        if (!courtKey) return;
        
        // Immediately set the hidden ID so the form doesn't fail if saved quickly
        originalNameHidden.value = courtKey; 

        try {
            const res = await fetch(`/api/courts/${courtKey}`);
            const data = await res.json();
            
            if (data.ok) {
                const court = data.court;
                const heroName = document.getElementById("edit-court-name-header");
                const heroMeta = document.getElementById("edit-court-meta");
                const heroAvatar = document.getElementById("edit-court-avatar");
                
                if(heroName) heroName.textContent = court.name.replace(/_/g, ' ');
                if(heroMeta) heroMeta.innerHTML = `Location: <strong>${court.location.address}</strong>`;
                if(heroAvatar) heroAvatar.textContent = court.name.slice(0, 2).toUpperCase();

                document.getElementById("court-name").value = court.name.replace(/_/g, ' ');
                document.getElementById("location").value = court.location.address || "";
                document.getElementById("description").value = court.description || "";
                document.getElementById("amenities").value = (court.amenities || []).join(", ");
                document.getElementById("rates").value = court.rates?.weekday || "";
            }
        } catch (err) { console.error("Edit court load error:", err); }
    }

    // ==========================================
    // Reservation Grid Logic (Respects capacity)
    // ==========================================
    async function initWeekCalendarReservation() {
        const calRoot = document.getElementById("reservation-calendar");
        if (!calRoot) return; 

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
        if (courtNameEl) courtNameEl.textContent = courtKey.replace(/_/g, ' ');

        // Fetch venue capacity (totalCourts) for checking slot availability
        let venueCapacity = 1;
        try {
            const courtRes = await fetch(`/api/courts/${courtKey}`);
            const courtData = await courtRes.json();
            if (courtData.ok && courtData.court) {
                venueCapacity = courtData.court.totalCourts || 1;
            }
        } catch (e) { console.error("Capacity fetch failed."); }

        const startOfWeek = (d) => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            const day = date.getDay(); 
            const diff = (day === 0 ? -6 : 1) - day; 
            date.setDate(date.getDate() + diff);
            return date;
        };

        const addDays = (d, n) => {
            const x = new Date(d);
            x.setDate(x.getDate() + n);
            return x;
        };

        const fmtDayHeader = (d) => d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
        const fmtISODate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        const timeSlots = [];
        for (let h = 7; h <= 21; h++) timeSlots.push(`${String(h).padStart(2, "0")}:00`);

        let weekStart = startOfWeek(new Date());
        const selected = new Set(); 

        const updateSelectedUI = () => {
            if (selectedCountEl) selectedCountEl.textContent = String(selected.size);
            if (selectedListEl) {
                if (selected.size === 0) {
                    selectedListEl.textContent = "No slots selected.";
                } else {
                    const items = [...selected].sort().map((k) => {
                        const [date, time] = k.split("|");
                        return `${date} @ ${time}`;
                    });
                    selectedListEl.innerHTML = `Selected:<br>${items.map((x) => `• ${x}`).join("<br>")}`;
                }
            }
        };

        const render = async () => {
            const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
            const weekEnd = addDays(weekStart, 6);

            if (weekLabel) {
                weekLabel.textContent = `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
            }

            let bookedSlots = [];
            try {
                const res = await fetch(`/availability?court=${encodeURIComponent(courtKey)}&startDate=${fmtISODate(days[0])}&endDate=${fmtISODate(weekEnd)}`);
                const data = await res.json();
                if (data.ok) bookedSlots = data.booked;
            } catch (err) { console.error(err); }

            calRoot.innerHTML = "";
            const grid = document.createElement("div");
            grid.className = "week-calendar__grid";

            const corner = document.createElement("div");
            corner.className = "week-calendar__cell week-calendar__cell--header";
            corner.textContent = "Time";
            grid.appendChild(corner);

            for (const d of days) {
                const hd = document.createElement("div");
                hd.className = "week-calendar__cell week-calendar__cell--header";
                hd.textContent = fmtDayHeader(d);
                grid.appendChild(hd);
            }

            for (const t of timeSlots) {
                const tl = document.createElement("div");
                tl.className = "week-calendar__cell week-calendar__cell--time";
                tl.textContent = t;
                grid.appendChild(tl);

                for (const d of days) {
                    const iso = fmtISODate(d);
                    const key = `${iso}|${t}`;
                    const currentBookings = bookedSlots.filter(s => s === key).length;

                    const cell = document.createElement("div");
                    cell.className = "week-calendar__cell week-calendar__cell--slot";

                    const cb = document.createElement("input");
                    cb.type = "checkbox";
                    cb.className = "week-calendar__checkbox";

                    // Respect venue capacity: Only disable if all physical courts are booked
                    if (currentBookings >= venueCapacity) { 
                        cb.disabled = true;
                        cb.checked = false;
                        cb.title = "Venue fully booked for this hour";
                        cell.style.backgroundColor = "#f9f9f9";
                        cell.style.cursor = "not-allowed";
                    } else {
                        cb.checked = selected.has(key);
                        cb.addEventListener("change", () => {
                            if (cb.checked) selected.add(key);
                            else selected.delete(key);
                            updateSelectedUI();
                        });
                    }
                    cell.appendChild(cb);
                    grid.appendChild(cell);
                }
            }
            calRoot.appendChild(grid);
            updateSelectedUI();
        };

        prevBtn?.addEventListener("click", () => { weekStart = addDays(weekStart, -7); render(); });
        nextBtn?.addEventListener("click", () => { weekStart = addDays(weekStart, 7); render(); });
        clearBtn?.addEventListener("click", () => { selected.clear(); render(); });

        reserveBtn?.addEventListener("click", async () => {
            if (!isLoggedIn()) return window.location.href = "Login Page.html";
            if (selected.size === 0) return alert("Select at least one time slot.");

            const username = getUsername();
            try {
                for (const slotKey of [...selected]) {
                    const [date, time] = slotKey.split("|");
                    const resp = await fetch("/reserve", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ court: courtKey, date, time, username }),
                    });
                    
                    let rawText = await resp.text();
                    let data;
                    try { data = JSON.parse(rawText); } 
                    catch(e) { throw new Error(`Server error: ${rawText}`); }

                    if (!resp.ok || !data.ok) throw new Error(data.error || `Slot ${slotKey} failed.`);
                } 
                alert("Reservations requested successfully!");
                selected.clear();
                render();
             } catch (err) { alert(`Reservation failed:\n\n${err.message}`); }
        });

        render();
    }

    // ==========================================
    // Dynamic Court Page, Reviews, & Homepage
    // ==========================================
    async function initDynamicCourtPage() {
        const nameEl = document.getElementById("court-name");
        if (!nameEl) return; 

        const params = new URLSearchParams(window.location.search);
        const courtKey = params.get("court") || "greenhills2";
        
        const saveBtn = document.getElementById("btn-save-court");
        const bookBtn = document.getElementById("btn-book");
        const manageBtn = document.getElementById("btn-manage");
        const username = getUsername();

        if (isLoggedIn()) {
            if (bookBtn) bookBtn.href = `Court Reservation Page.html?court=${encodeURIComponent(courtKey)}`;
            if (saveBtn) {
                saveBtn.style.display = "inline-block";
                fetch(`/api/user-profile-full/${username}`).then(r=>r.json()).then(d => {
                    if(d.ok && d.favorites.some(f => f.name === courtKey)) saveBtn.innerHTML = "⭐ Saved";
                });
                saveBtn.onclick = async () => {
                    const res = await fetch('/api/save-court', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, courtName: courtKey })
                    });
                    const data = await res.json();
                    if (data.ok) {
                        saveBtn.innerHTML = data.isSaved ? "⭐ Saved" : "☆ Save Court";
                        alert(data.isSaved ? "Saved to Favorites!" : "Removed from Favorites");
                    }
                };
            }
        }

        if (manageBtn && getRole() === "owner" && getOwnerCourt() === courtKey) {
            manageBtn.style.display = "inline-block";
            manageBtn.href = `Owner Dashboard.html?court=${encodeURIComponent(courtKey)}`;
        }

        try {
            const res = await fetch(`/api/courts/${courtKey}`);
            const data = await res.json();
            if (data.ok) {
                const court = data.court;
                nameEl.textContent = court.name.replace(/_/g, ' ');
                document.getElementById("court-avatar").textContent = court.name.slice(0, 2).toUpperCase();
                document.getElementById("court-meta").innerHTML = `<strong>${court.type}</strong> · <strong>${court.totalCourts} courts</strong><br>${court.location.address}`;
                document.getElementById("court-amenities").innerHTML = (court.amenities || []).map(x => `<p class="card-text">${x}</p>`).join("") || "Standard amenities";
                document.getElementById("court-rules").innerHTML = (court.rules || []).map(x => `<p class="card-text">${x}</p>`).join("") || "Standard rules apply";
            }
        } catch (err) { console.error("Court load error:", err); }

        const reviewsGrid = document.getElementById("court-reviews");
        if(reviewsGrid) {
            try {
                const rRes = await fetch(`/api/reviews/${courtKey}`);
                const rData = await rRes.json();
                if(rData.ok && rData.reviews.length > 0) {
                    reviewsGrid.innerHTML = rData.reviews.map(r => `
                        <article class="card">
                            <h3 class="card-title">${r.userId?.username || 'User'} · ${r.rating}/5 ⭐</h3>
                            <p class="card-text">"${r.comment}"</p>
                        </article>
                    `).join("");
                } else {
                    reviewsGrid.innerHTML = "<p class='card-text'>No reviews yet.</p>";
                }
            } catch(e) {}
        }
    }

    async function initHomePage() {
        const featuredGrid = document.getElementById("featured-courts-grid");
        const reviewsGrid = document.getElementById("latest-reviews-grid");
        
        if (featuredGrid) {
            try {
                const res = await fetch('/api/courts/all');
                const data = await res.json();
                if(data.ok && data.courts.length > 0) {
                    const sorted = data.courts.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
                    featuredGrid.innerHTML = sorted.map(c => `
                        <article class="card">
                            <h3 class="card-title">${(c.name || '').replace(/_/g, ' ')}</h3>
                            <p class="card-text">${c.type} · ${c.totalCourts} courts · ${c.averageRating || 0} ⭐</p>
                            <a class="card-link" href="Court Profile Page.html?court=${c.name}">View court</a>
                        </article>
                    `).join("");
                } else {
                    featuredGrid.innerHTML = "<p class='card-text'>No courts found in database.</p>";
                }
            } catch(e) { featuredGrid.innerHTML = "<p class='card-text'>Error loading courts.</p>"; }
        }

        if (reviewsGrid) {
            try {
                const res = await fetch('/api/reviews/latest');
                const data = await res.json();
                if (data.ok && data.reviews.length > 0) {
                    reviewsGrid.innerHTML = data.reviews.map(r => `
                        <article class="card">
                            <h3 class="card-title">${r.courtId?.name.replace(/_/g, ' ') || 'Court'}</h3>
                            <p class="card-text">" ${r.comment} "</p>
                            <p class="card-text" style="font-size: 12px; color: #888;">- ${r.userId?.username || 'User'} (${r.rating}/5 ⭐)</p>
                        </article>
                    `).join("");
                } else { reviewsGrid.innerHTML = "<p class='card-text'>No reviews yet.</p>"; }
            } catch(e) {}
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        updateAuthNav();
        wireAuthForms();
        wireMobileNav();
        wireLogoutButtons();
        initProfileManagement();
        initDynamicCourtPage();
        initEditCourtPage();
        initWeekCalendarReservation();
        initHomePage();
    });
})();