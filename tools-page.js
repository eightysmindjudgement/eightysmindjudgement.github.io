(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;

    const targets = document.querySelectorAll('.tools-showcase-page [data-reveal]');
    if (!targets.length) return;

    document.body.classList.add('tools-animations-ready');

    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            currentObserver.unobserve(entry.target);
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -6% 0px'
    });

    targets.forEach(target => observer.observe(target));
})();
