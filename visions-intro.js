(() => {
    'use strict';
    const root = document.documentElement;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return;
    root.classList.add('visions-intro-active', 'visions-intro-loading');
    let intro;
    let timer;
    let frame;
    let finished = false;
    let safetyTimer;
    const finish = () => {
        finished = true;
        clearTimeout(timer);
        clearTimeout(safetyTimer);
        cancelAnimationFrame(frame);
        root.classList.remove('visions-intro-active', 'visions-intro-loading');
        document.querySelectorAll('[data-intro-inert]').forEach(element => {
            element.inert = false;
            element.removeAttribute('data-intro-inert');
        });
        intro?.remove();
    };
    // Always restore access even if an image or an animation cannot complete.
    reducedMotion.addEventListener('change', event => {
        if (event.matches) finish();
    });
    window.addEventListener('pagehide', finish, { once: true });
    document.addEventListener('visions:error', finish, { once: true });
    document.addEventListener('visions:ready', () => {
        if (finished) return;
        root.classList.remove('visions-intro-loading');
        safetyTimer = setTimeout(finish, 16000);
        intro = document.createElement('div');
        intro.className = 'visions-intro';
        const slogan = document.createElement('p');
        slogan.className = 'visions-intro-slogan';
        slogan.setAttribute('aria-label', "WORKING PEOPLE'S HEAVY METAL");
        const steps = [];
        ["WORKING PEOPLE'S", 'HEAVY METAL'].forEach((line, lineIndex) => {
            if (lineIndex) slogan.append(document.createElement('br'));
            for (const character of line) {
                const span = document.createElement('span');
                span.textContent = character;
                span.setAttribute('aria-hidden', 'true');
                slogan.append(span);
                steps.push({ span, character, pauseBefore: lineIndex && steps.length === 16 ? 90 : 0 });
            }
        });
        const logo = document.createElement('img');
        logo.className = 'visions-intro-logo';
        logo.src = 'EMJ_logo2026.png';
        logo.alt = "Eighty's Mind Judgement";
        intro.append(slogan, logo);
        for (const element of document.body.children) {
            if (element.matches('script, .return-link')) continue;
            if (!element.inert) {
                element.inert = true;
                element.setAttribute('data-intro-inert', '');
            }
        }
        document.body.append(intro);
        let index = 0;
        function revealNext() {
            if (finished) return;
            const step = steps[index++];
            step.span.classList.add('is-typed');
            if (index === steps.length) {
                timer = setTimeout(() => {
                    if (finished) return;
                    intro.classList.add('is-showing-logo');
                }, 500);
                return;
            }
            // Match the home's relative, one-character-per-paint typing rhythm.
            timer = setTimeout(() => {
                frame = requestAnimationFrame(revealNext);
            }, (/\s/.test(step.character) ? 22.5 : 42.5) + steps[index].pauseBefore);
        }
        logo.addEventListener('animationend', event => {
            if (event.animationName !== 'visions-intro-logo') return;
            clearTimeout(safetyTimer);
            finish();
        });
        frame = requestAnimationFrame(revealNext);
    }, { once: true });
})();
