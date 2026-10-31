(() => {
    const page = document.body;
    if (!getComputedStyle(page).getPropertyValue('--page-background-image').trim()) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 767px)');
    let frame = 0;
    function update() {
        frame = 0;
        page.classList.toggle('page-parallax-active', !reducedMotion.matches);
        if (reducedMotion.matches) {
            page.style.removeProperty('--page-parallax-y');
            return;
        }
        const subtle = page.matches('.home-page, .tools-page, .links-page');
        const limit = mobile.matches ? 24 : subtle ? 40 : 64;
        const speed = mobile.matches ? 0.045 : subtle ? 0.065 : 0.1;
        // Smoothly approach a bounded offset so long pages cannot expose an edge.
        const offset = limit * (1 - Math.exp(-Math.max(0, window.scrollY) * speed / limit));
        page.style.setProperty('--page-parallax-y', `${-offset.toFixed(2)}px`);
    }
    function schedule() {
        if (!frame) frame = requestAnimationFrame(update);
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pageshow', schedule);
    reducedMotion.addEventListener('change', schedule);
    mobile.addEventListener('change', schedule);
    update();
})();
