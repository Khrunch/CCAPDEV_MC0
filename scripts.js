(() => {
    // hide topnav when scrolling down and show it again when scrolling up
    const nav = document.querySelector(".top-nav");
    if (!nav) return;

    let lastY = window.scrollY;
    let ticking = false;

    const HIDE_AFTER = 20; // don't hide at the very top
    const DELTA = 6;       // ignore tiny scroll jitter

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
            if (diff > 0) nav.classList.add("top-nav--hidden"); // scrolling down
            else nav.classList.remove("top-nav--hidden");        // scrolling up
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