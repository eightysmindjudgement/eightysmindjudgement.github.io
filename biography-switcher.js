(() => {
    const page = document.querySelector('.biography-page');
    const panels = page?.querySelector('.biography-panels');
    const controls = [...(page?.querySelectorAll('[data-biography-target]') || [])];
    if (!page || !panels || controls.length !== 2) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const duration = reducedMotion.matches ? 0 : 280;
    let activePanel = panels.querySelector(
        window.location.hash === '#about-creator' ? '#about-creator' : '#about-emj'
    );
    let isTransitioning = false;

    if (!activePanel) return;

    const setActivePanel = (panel) => {
        activePanel = panel;
        panels.querySelectorAll('.biography-panel').forEach((item) => {
            const isActive = item === panel;
            item.hidden = !isActive;
            item.inert = !isActive;
            item.setAttribute('aria-hidden', String(!isActive));
        });
        controls.forEach((control) => {
            control.hidden = control.dataset.biographyTarget === panel.id;
        });
    };

    setActivePanel(activePanel);

    controls.forEach((control) => {
        control.addEventListener('click', () => {
            const nextPanel = panels.querySelector(`#${CSS.escape(control.dataset.biographyTarget)}`);
            if (!nextPanel || nextPanel === activePanel || isTransitioning) return;

            const outgoingPanel = activePanel;
            const direction = outgoingPanel.id === 'about-emj' ? 'forward' : 'backward';
            const currentHeight = panels.getBoundingClientRect().height;

            isTransitioning = true;
            panels.classList.add('is-transitioning');
            panels.style.height = `${currentHeight}px`;
            panels.getBoundingClientRect();
            nextPanel.hidden = false;
            nextPanel.inert = false;
            nextPanel.setAttribute('aria-hidden', 'false');
            outgoingPanel.inert = true;
            outgoingPanel.setAttribute('aria-hidden', 'true');

            [outgoingPanel, nextPanel].forEach((panel) => {
                panel.classList.add('is-moving');
                panel.dataset.direction = direction;
            });
            nextPanel.classList.add('is-entering');

            const nextHeight = nextPanel.getBoundingClientRect().height;
            panels.style.height = `${nextHeight}px`;

            const startAnimation = () => {
                outgoingPanel.classList.add('is-exiting');
                nextPanel.classList.remove('is-entering');
            };

            const finishTransition = () => {
                outgoingPanel.hidden = true;
                outgoingPanel.classList.remove('is-moving', 'is-exiting');
                nextPanel.classList.remove('is-moving');
                delete outgoingPanel.dataset.direction;
                delete nextPanel.dataset.direction;
                panels.classList.remove('is-transitioning');
                panels.style.height = '';
                isTransitioning = false;
                activePanel = nextPanel;
                controls.forEach((item) => {
                    item.hidden = item.dataset.biographyTarget === nextPanel.id;
                });
                const nextControl = controls.find((item) => !item.hidden);
                nextControl?.focus({ preventScroll: true });
            };

            if (duration === 0) {
                startAnimation();
                finishTransition();
            } else {
                requestAnimationFrame(startAnimation);
                window.setTimeout(finishTransition, duration);
            }
        });
    });

    page.classList.add('biography-switcher-ready');
})();
