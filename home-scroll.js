(() => {
    const cue = document.querySelector('.home-scroll-cue');
    const target = document.getElementById('home-mission');
    if (!cue || !target) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let queued = false;
    function update() {
        const hidden = window.scrollY > 64;
        cue.classList.toggle('is-dismissed', hidden);
        cue.inert = hidden;
        cue.setAttribute('aria-hidden', String(hidden));
        queued = false;
    }
    window.addEventListener('scroll', () => {
        if (!queued) {
            queued = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });
    window.addEventListener('pageshow', update);
    update();

    cue.addEventListener('click', event => {
        event.preventDefault();
        target.focus({ preventScroll: true });
        target.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
    });
})();
