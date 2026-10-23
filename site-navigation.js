(() => {
    const menu = [...document.querySelectorAll('body > nav')].find(nav => !nav.classList.contains('digital-philosophy-nav'));
    const header = document.querySelector('body > header');
    if (!menu || !header) return;

    menu.setAttribute('aria-label', 'Main navigation');
    menu.setAttribute('aria-hidden', 'true');
    menu.inert = true;
    document.body.classList.add('site-menu-ready');

    let toggle = header.querySelector('.site-menu-toggle');
    if (!toggle) {
        toggle = document.createElement('button');
        toggle.className = 'site-menu-toggle';
        toggle.type = 'button';
        toggle.setAttribute('aria-label', 'Open menu');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<span></span><span></span><span></span>';
        header.prepend(toggle);
    }
    toggle.setAttribute('aria-controls', 'site-navigation');
    menu.id = 'site-navigation';
    let backdrop = document.querySelector('.site-menu-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'site-menu-backdrop';
        backdrop.hidden = true;
        document.body.insertBefore(backdrop, menu);
    }

    let close = menu.querySelector('.site-menu-close');
    if (!close) {
        close = document.createElement('button');
        close.className = 'site-menu-close';
        close.type = 'button';
        menu.prepend(close);
    }
    close.setAttribute('aria-label', 'Close menu');
    close.textContent = String.fromCharCode(0x00D7);

    const links = [...menu.querySelectorAll('a')];
    let returnFocus = toggle;
    let closeTimer;

    function openMenu() {
        clearTimeout(closeTimer);
        returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : toggle;
        backdrop.hidden = false;
        menu.inert = false;
        menu.setAttribute('aria-hidden', 'false');
        document.body.classList.add('site-menu-open');
        toggle.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(() => {
            backdrop.classList.add('is-visible');
            menu.classList.add('is-open');
            close.focus();
        });
    }

    function closeMenu(restoreFocus = true) {
        menu.classList.remove('is-open');
        backdrop.classList.remove('is-visible');
        toggle.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
        menu.inert = true;
        document.body.classList.remove('site-menu-open');
        closeTimer = setTimeout(() => { backdrop.hidden = true; }, 270);
        if (restoreFocus) returnFocus.focus();
    }

    toggle.addEventListener('click', openMenu);
    close.addEventListener('click', () => closeMenu());
    backdrop.addEventListener('click', () => closeMenu());
    links.forEach(link => link.addEventListener('click', () => closeMenu(false)));

    document.addEventListener('keydown', event => {
        if (!menu.classList.contains('is-open')) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            closeMenu();
        } else if (event.key === 'Tab') {
            const focusable = [close, ...links];
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault(); last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault(); first.focus();
            }
        }
    });
})();
