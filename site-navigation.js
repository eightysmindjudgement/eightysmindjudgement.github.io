(() => {
    const currentYear = new Date().getFullYear();
    const footers = document.querySelectorAll('footer');
    footers.forEach(footer => {
        const textNodes = document.createTreeWalker(footer, NodeFilter.SHOW_TEXT);
        let textNode;
        while ((textNode = textNodes.nextNode())) {
            textNode.nodeValue = textNode.nodeValue.replace(
                /([℗©]\s*)(\d{4})(?=\s+Eighty's Mind Judgement)/g,
                (match, prefix, startYear) => Number(startYear) < currentYear
                    ? `${prefix}${startYear} - ${currentYear}`
                    : match
            );
        }
    });

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
    document.body.append(toggle);
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

    const gamesLink = [...menu.querySelectorAll('a')].find(link =>
        /(^|\/)games\.html(?:[?#]|$)/.test(link.getAttribute('href') || '')
    );
    if (gamesLink && !menu.querySelector('.site-games-group')) {
        const gamesPath = gamesLink.getAttribute('href');
        const gamesPrefix = gamesPath.replace(/games\.html(?:[?#].*)?$/, '');
        const games = [
            { name: 'EMJ PUZZLE', href: 'emj-puzzle.html' },
            { name: 'METAL STRIKE', href: 'games/metal-strike/metal-strike.html' },
            { name: 'IRON FORTRESS', href: 'games/iron-fortress/iron-fortness.html' }
        ];
        const group = document.createElement('div');
        group.className = 'site-games-group';

        const gamesToggle = document.createElement('button');
        gamesToggle.className = 'site-games-toggle';
        gamesToggle.type = 'button';
        gamesToggle.setAttribute('aria-expanded', 'false');
        gamesToggle.setAttribute('aria-controls', 'site-games-submenu');
        gamesToggle.innerHTML = '<span>GAMES</span><span class="site-games-indicator" aria-hidden="true">+</span>';

        const submenu = document.createElement('div');
        submenu.className = 'site-games-submenu';
        submenu.id = 'site-games-submenu';
        submenu.setAttribute('aria-hidden', 'true');
        submenu.inert = true;

        const submenuContent = document.createElement('div');
        submenuContent.className = 'site-games-submenu-content';
        games.forEach(game => {
            const link = document.createElement('a');
            link.href = `${gamesPrefix}${game.href}`;
            link.textContent = game.name;
            submenuContent.append(link);
        });

        gamesLink.textContent = 'EMJ ARCADE';
        gamesLink.classList.add('site-games-index');
        gamesLink.before(group);
        submenuContent.append(gamesLink);
        submenu.append(submenuContent);
        group.append(gamesToggle, submenu);

        gamesToggle.addEventListener('click', () => {
            const expanded = gamesToggle.getAttribute('aria-expanded') !== 'true';
            gamesToggle.setAttribute('aria-expanded', String(expanded));
            gamesToggle.querySelector('.site-games-indicator').textContent = expanded ? '−' : '+';
            submenu.setAttribute('aria-hidden', String(!expanded));
            submenu.inert = !expanded;
            group.classList.toggle('is-expanded', expanded);
        });
    }

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
            const focusable = [...menu.querySelectorAll('button:not(.site-menu-close), a[href]')]
                .filter(element => !element.closest('[inert]') && !element.hasAttribute('disabled'));
            focusable.unshift(close);
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
