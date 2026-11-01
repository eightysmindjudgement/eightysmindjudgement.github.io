(() => {
    const cue = document.querySelector('.home-scroll-cue');
    const target = document.getElementById('home-mission');
    if (!cue || !target) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const slogan = document.querySelector('.home-slogan');
    const visions = document.querySelector('.visions-entry');
    const albums = [...document.querySelectorAll('.home-album')];
    let sloganStarted = reducedMotion.matches;
    let glowStarted = reducedMotion.matches;
    let finishTyping = () => {};
    let nextEffectAt = 0;
    let effectTimer;
    function waitForNextEffect(delay) {
        nextEffectAt = performance.now() + delay;
        clearTimeout(effectTimer);
        effectTimer = setTimeout(updateEffects, delay + 20);
    }
    const typingSteps = [];
    let typingPause = 0;
    if (slogan && !sloganStarted) {
        const ink = document.createElement('span');
        ink.className = 'slogan-ink';
        // Keep the heading readable as a complete phrase for assistive technology.
        slogan.setAttribute('aria-label', slogan.textContent.replace(/\s+/g, ' ').trim());
        ink.setAttribute('aria-hidden', 'true');
        ink.append(...slogan.childNodes);
        slogan.append(ink);
        const walker = document.createTreeWalker(ink, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(node => {
            if (node.nodeName === 'BR') { typingPause += 90; return; }
            if (node.nodeType !== 3) return;
            const fragment = document.createDocumentFragment();
            for (const character of node.textContent) {
                const span = document.createElement('span');
                span.className = 'slogan-character';
                span.textContent = character;
                fragment.append(span);
                typingSteps.push({ element: span, pauseBefore: typingPause, hold: /\s/.test(character) ? 22.5 : 42.5 });
                typingPause = 0;
            }
            node.replaceWith(fragment);
        });
        slogan.classList.add('slogan-pending');
    }
    if (glowStarted) visions?.classList.add('glow-started');
    albums.forEach(album => {
        if (!reducedMotion.matches) album.classList.add('slide-pending');
    });
    let albumRows = [];
    function measureAlbumRows() {
        albumRows = [];
        albums.forEach(album => {
            let row = albumRows[albumRows.length - 1];
            if (!row || Math.abs(row.top - album.offsetTop) > 2) {
                row = { top: album.offsetTop, items: [] };
                albumRows.push(row);
            }
            row.items.push(album);
            album.style.setProperty('--album-enter-x', albumRows.length % 2 ? '-56px' : '56px');
        });
    }
    measureAlbumRows();

    function typeSlogan() {
        if (!slogan || reducedMotion.matches) {
            slogan?.classList.remove('slogan-pending');
            return;
        }
        let index = 0;
        let timer;
        let frame;
        let finished = false;
        finishTyping = () => {
            finished = true;
            clearTimeout(timer);
            cancelAnimationFrame(frame);
            typingSteps.forEach(step => step.element.classList.add('is-typed'));
            slogan.classList.remove('slogan-pending', 'slogan-typing');
            revealMission();
        };
        // Reveal one character per paint, then wait before scheduling the next.
        // Relative waits prevent late frames from revealing the remaining text in a batch.
        function revealNext() {
            if (finished) return;
            if (index >= typingSteps.length) { finishTyping(); return; }
            const step = typingSteps[index++];
            step.element.classList.add('is-typed');
            if (index === typingSteps.length) { finishTyping(); return; }
            const nextPause = typingSteps[index]?.pauseBefore || 0;
            timer = setTimeout(() => {
                frame = requestAnimationFrame(revealNext);
            }, step.hold + nextPause);
        }
        slogan.classList.remove('slogan-pending');
        slogan.classList.add('slogan-typing');
        frame = requestAnimationFrame(revealNext);
    }
    function reachedTriggerLine(element, viewportRatio = 2 / 3) {
        const rect = element.getBoundingClientRect();
        return (rect.top + rect.bottom) / 2 <= window.innerHeight * viewportRatio;
    }
    function sloganHasEntered() {
        const firstCharacter = slogan.querySelector('.slogan-character') || slogan;
        const rect = firstCharacter.getBoundingClientRect();
        return rect.top < window.innerHeight - 16 && rect.bottom > 0;
    }
    function updateEffects() {
        if (visions && glowStarted) {
            const rect = visions.getBoundingClientRect();
            visions.classList.toggle('glow-paused', rect.bottom < 0 || rect.top > window.innerHeight || document.hidden);
        }
        if (document.hidden) return;
        if (reducedMotion.matches) return;
        // Complete entrances that have already passed above the viewport.
        if (slogan && slogan.getBoundingClientRect().bottom <= 0 && slogan.classList.contains('slogan-pending')) {
            sloganStarted = true;
            typingSteps.forEach(step => step.element.classList.add('is-typed'));
            slogan.classList.remove('slogan-pending');
            revealMission();
            nextEffectAt = 0;
        } else if (slogan && slogan.getBoundingClientRect().bottom <= 0 && slogan.classList.contains('slogan-typing')) {
            finishTyping();
            nextEffectAt = 0;
        }
        missionItems.forEach(item => {
            if (item.getBoundingClientRect().bottom <= 0) item.classList.remove('mission-slide-pending', 'mission-slide-visible');
        });
        if (visions && visions.getBoundingClientRect().bottom <= 0) {
            glowStarted = true;
            visions.classList.add('glow-started', 'glow-paused');
            nextEffectAt = 0;
        }
        albums.forEach(album => {
            if (album.getBoundingClientRect().bottom <= 0) album.classList.remove('slide-pending', 'slide-visible');
        });
        if (performance.now() < nextEffectAt) return;
        if (slogan && !sloganStarted && sloganHasEntered()) {
            sloganStarted = true;
            typeSlogan();
            return;
        }
        // Finish the slogan and mission entrance before starting lower sections.
        if (slogan && (!sloganStarted || !missionRevealed)) return;
        if (visions && !glowStarted && reachedTriggerLine(visions)) {
            glowStarted = true;
            visions.classList.add('glow-started');
            waitForNextEffect(700);
            return;
        }
        if (visions && !glowStarted) return;
        for (const row of albumRows) {
            if (!row.items.some(item => item.classList.contains('slide-pending'))) continue;
            if (row.items.some(item => !item.querySelector('img').complete)) return;
            if (!reachedTriggerLine(row.items[0], .75)) return;
            row.items.forEach(item => {
                item.classList.remove('slide-pending');
                item.classList.add('slide-visible');
            });
            waitForNextEffect(1150);
            return;
        }
    }
    function remeasureEffects() {
        measureAlbumRows();
        updateEffects();
    }
    window.addEventListener('resize', remeasureEffects);
    albums.forEach(album => {
        const image = album.querySelector('img');
        image.addEventListener('load', () => { measureAlbumRows(); updateEffects(); });
        image.addEventListener('error', () => { measureAlbumRows(); updateEffects(); });
    });
    document.addEventListener('visibilitychange', updateEffects);
    reducedMotion.addEventListener('change', event => {
        if (!event.matches) return;
        clearTimeout(effectTimer);
        sloganStarted = true;
        glowStarted = true;
        visions?.classList.add('glow-started');
        finishTyping();
        slogan?.classList.remove('slogan-pending');
        albums.forEach(album => album.classList.remove('slide-pending'));
    });
    const missionText = [...target.querySelectorAll('.home-mission-ja, .home-mission-en')];
    const missionLabel = missionText[0]?.previousElementSibling;
    const missionItems = missionLabel?.classList.contains('home-mission-label')
        ? [missionLabel, ...missionText] : missionText;
    let missionRevealed = reducedMotion.matches || !missionItems.length;
    if (!missionRevealed) missionItems.forEach(item => item.classList.add('mission-slide-pending'));

    function revealMission() {
        if (missionRevealed) return;
        missionRevealed = true;
        missionItems.forEach(item => {
            item.classList.remove('mission-slide-pending');
            item.classList.add('mission-slide-visible');
        });
        waitForNextEffect(1100);
    }

    reducedMotion.addEventListener('change', event => {
        if (event.matches) revealMission();
    });
    let queued = false;
    function update() {
        const hidden = window.scrollY > 64;
        cue.classList.toggle('is-dismissed', hidden);
        cue.inert = hidden;
        cue.setAttribute('aria-hidden', String(hidden));
        updateEffects();
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
