(() => {
    document.querySelectorAll('.tools-page .tool-list').forEach(list => {
    const itemLabel = list.dataset.itemLabel || 'TOOL';
    const itemName = itemLabel.toLowerCase();
    const cards = [...list.querySelectorAll('.tool-card')];
    if (!cards.length) return;
    const carousel = document.createElement('div');
    carousel.className = 'tool-carousel';
    carousel.setAttribute('role', 'region');
    carousel.setAttribute('aria-roledescription', 'carousel');
    carousel.setAttribute('aria-label', list.dataset.selectorLabel || (itemLabel === 'GAME' ? 'Game selector' : 'Tool selector'));
    carousel.tabIndex = 0;
    list.before(carousel);
    carousel.append(list);
    const controls = document.createElement('div');
    controls.className = 'tool-carousel-controls';
    const previous = document.createElement('button');
    previous.type = 'button';
    previous.textContent = '←';
    previous.setAttribute('aria-label', 'Previous ' + itemName);
    const next = document.createElement('button');
    next.type = 'button';
    next.textContent = '→';
    next.setAttribute('aria-label', 'Next ' + itemName);
    const position = document.createElement('span');
    position.className = 'tool-carousel-position';
    position.setAttribute('role', 'status');
    position.setAttribute('aria-atomic', 'true');
    controls.append(previous, position, next);
    const hint = document.createElement('p');
    hint.className = 'tool-carousel-hint';
    hint.textContent = 'SWIPE / ← →';
    carousel.append(controls, hint);
    let selected = 0;
    function select(index) {
        selected = Math.max(0, Math.min(cards.length - 1, index));
        const focusWasInCard = cards.some(card => card.contains(document.activeElement));
        cards.forEach((card, i) => {
            const offset = i - selected;
            const layer = Math.min(3, Math.max(-1, offset));
            const active = offset === 0;
            card.style.setProperty('--layer', layer);
            card.style.setProperty('--scale', active ? 1 : 1 - Math.abs(layer) * .055);
            card.style.setProperty('--brightness', active ? 1 : .94 - Math.abs(layer) * .07);
            card.style.setProperty('--opacity', offset < 0 || offset > 3 ? 0 : 1);
            card.style.setProperty('--depth', active ? cards.length + 1 : cards.length - Math.abs(offset));
            card.dataset.active = String(active);
            card.inert = !active;
            card.setAttribute('aria-hidden', String(!active));
        });
        previous.disabled = selected === 0;
        next.disabled = selected === cards.length - 1;
        position.textContent = `${itemLabel} ${String(selected + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
        if (focusWasInCard) {
            if (cards[selected].matches('a')) cards[selected].focus({ preventScroll: true });
            else carousel.focus({ preventScroll: true });
        }
    }
    previous.addEventListener('click', () => {
        select(selected - 1);
        if (previous.disabled) next.focus({ preventScroll: true });
    });
    next.addEventListener('click', () => {
        select(selected + 1);
        if (next.disabled) previous.focus({ preventScroll: true });
    });
    carousel.addEventListener('keydown', event => {
        const destinations = { ArrowLeft: selected - 1, ArrowRight: selected + 1, Home: 0, End: cards.length - 1 };
        if (!(event.key in destinations) || event.altKey || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        select(destinations[event.key]);
    });
    let gesture = null;
    let suppressClick = false;
    list.addEventListener('pointerdown', event => {
        if (!event.isPrimary || event.button !== 0) return;
        suppressClick = false;
        gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
    });
    window.addEventListener('pointerup', event => {
        if (!gesture || event.pointerId !== gesture.id) return;
        const dx = event.clientX - gesture.x;
        const dy = event.clientY - gesture.y;
        gesture = null;
        if (Math.abs(dx) < 36 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
        suppressClick = true;
        select(selected + (dx < 0 ? 1 : -1));
    });
    window.addEventListener('pointercancel', () => { gesture = null; });
    list.addEventListener('click', event => {
        if (!suppressClick) return;
        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
    }, true);
    list.addEventListener('dragstart', event => event.preventDefault());
    select(0);
    });
})();
