(() => {
    const pointerMotion = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    if (!pointerMotion.matches) return;

    document.querySelectorAll('.links-page .service-link').forEach((card) => {
        card.addEventListener('pointermove', (event) => {
            if (event.pointerType !== 'mouse') return;

            const bounds = card.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width - 0.5;
            const y = (event.clientY - bounds.top) / bounds.height - 0.5;
            card.style.setProperty('--service-card-tilt-x', `${-y * 5}deg`);
            card.style.setProperty('--service-card-tilt-y', `${x * 5}deg`);
        }, { passive: true });

        card.addEventListener('pointerleave', () => {
            card.style.removeProperty('--service-card-tilt-x');
            card.style.removeProperty('--service-card-tilt-y');
        });
    });
})();
