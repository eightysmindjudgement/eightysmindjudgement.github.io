(() => {
    const tabs = document.querySelector('.discography-page .discography-tabs');
    const stage = document.querySelector('.discography-page .discography-stage');
    if (!tabs || !stage) return;
    const buttons = [...tabs.querySelectorAll('[role="tab"]')];
    const panels = [...stage.querySelectorAll('.discography-layer')];
    if (buttons.length !== 4 || panels.length !== 4) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let current = 0;
    let requested = 0;
    let animating = false;

    const resize = () => { stage.style.height = `${panels[current].getBoundingClientRect().height}px`; };
    panels.forEach((panel, index) => {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', buttons[index].id);
        panel.tabIndex = 0;
        panel.hidden = index !== current;
        panel.inert = index !== current;
    });
    panels[0].classList.add('is-current');
    stage.classList.add('is-enhanced');
    tabs.hidden = false;
    resize();
    const observer = new ResizeObserver(resize);
    panels.forEach(panel => observer.observe(panel));
    window.addEventListener('resize', resize);

    function switchLayer() {
        if (animating || requested === current) return;
        animating = true;
        const next = requested;
        const outgoing = panels[current];
        const incoming = panels[next];
        stage.style.setProperty('--slide-direction', next > current ? 1 : -1);
        // Move focus before making the old panel inert (also covers programmatic clicks).
        if (outgoing.contains(document.activeElement)) buttons[next].focus();
        outgoing.inert = true;
        outgoing.setAttribute('aria-hidden', 'true');
        incoming.hidden = false;
        incoming.inert = false;
        incoming.removeAttribute('aria-hidden');
        incoming.classList.add('is-entering');
        outgoing.classList.remove('is-current');
        incoming.classList.add('is-current');
        buttons.forEach((button, index) => {
            button.setAttribute('aria-selected', String(index === next));
            button.tabIndex = index === next ? 0 : -1;
        });
        current = next;
        // Establish the offstage position before starting the CSS transition.
        void incoming.offsetWidth;
        outgoing.classList.add('is-leaving');
        incoming.classList.remove('is-entering');
        resize();

        let timer;
        function finish(event) {
            if (event && (event.target !== incoming || event.propertyName !== 'transform')) return;
            clearTimeout(timer);
            incoming.removeEventListener('transitionend', finish);
            outgoing.hidden = true;
            outgoing.classList.remove('is-leaving');
            animating = false;
            switchLayer();
        }
        if (reducedMotion.matches) finish();
        else {
            incoming.addEventListener('transitionend', finish);
            // Also finish when transitions are interrupted or the tab is backgrounded.
            timer = setTimeout(finish, 750);
        }
    }

    buttons.forEach((button, index) => {
        button.addEventListener('click', () => {
            requested = index; // Keep only the latest request during a transition.
            switchLayer();
        });
        button.addEventListener('keydown', event => {
            let next;
            if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
            else if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = buttons.length - 1;
            else return;
            event.preventDefault();
            buttons[next].focus();
            buttons[next].click();
        });
    });
})();
