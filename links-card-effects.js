(() => {
    const pointerMotion = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const cards = document.querySelectorAll('.links-page .service-link');
    if (!cards.length) return;

    cards.forEach((card) => {
        card.addEventListener('pointerenter', (event) => {
            if (!pointerMotion.matches || event.pointerType !== 'mouse') return;

            if (card.classList.contains('is-spinning')) {
                card.dataset.spinQueued = 'true';
                return;
            }

            card.classList.add('is-spinning');
        });

        card.addEventListener('animationend', (event) => {
            if (event.target !== card || event.animationName !== 'links-card-flip') return;

            if (card.dataset.spinQueued === 'true' && pointerMotion.matches) {
                delete card.dataset.spinQueued;
                card.classList.remove('is-spinning');
                void card.offsetWidth;
                card.classList.add('is-spinning');
                return;
            }

            delete card.dataset.spinQueued;
            card.classList.remove('is-spinning');
        });
    });

    pointerMotion.addEventListener('change', (event) => {
        if (event.matches) return;
        cards.forEach((card) => {
            card.classList.remove('is-spinning');
            delete card.dataset.spinQueued;
        });
    });
})();
