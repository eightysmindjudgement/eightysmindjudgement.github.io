(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionPreference.matches || !('IntersectionObserver' in window)) return;

    const blocks = document.querySelectorAll('.biography-page main h2, .biography-page main h3, .biography-page main p, .home-page .digital-philosophy h2, .home-page .digital-philosophy h3, .home-page .digital-philosophy p');
    let elements = [];
    const staggerHome = document.body.classList.contains('home-page');
    const pending = new Set();
    let revealTimer;
    const reveal = (element) => {
        element.classList.add('is-visible');
        observer.unobserve(element);
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            if (staggerHome) pending.add(entry.target);
            else reveal(entry.target);
        });
        if (staggerHome && !revealTimer) revealNextLine();
    }, { rootMargin: '0px 0px -32px 0px', threshold: 0 });

    function revealNextLine() {
        revealTimer = undefined;
        if (staggerHome) {
            elements.forEach(element => {
                if (!element.classList.contains('is-visible') && element.getBoundingClientRect().bottom <= 0) {
                    pending.delete(element);
                    reveal(element);
                }
            });
        }
        // Follow document order, even when one scroll brings many lines into view.
        const next = elements.find(element => pending.has(element));
        if (!next) return;
        pending.delete(next);
        reveal(next);
        revealTimer = setTimeout(revealNextLine, 180);
    }

    if (staggerHome) {
        let scrollFrame;
        window.addEventListener('scroll', () => {
            if (scrollFrame) return;
            scrollFrame = requestAnimationFrame(() => {
                scrollFrame = undefined;
                if (revealTimer) return;
                clearTimeout(revealTimer);
                revealNextLine();
            });
        }, { passive: true });
    }

    const prepareLines = () => {
        observer.disconnect();
        clearTimeout(revealTimer);
        revealTimer = undefined;
        pending.clear();
        const visibleBlocks = new Set([...blocks].filter((block) => {
            const lines = block.querySelectorAll('.biography-reveal');
            return lines.length && [...lines].every((line) => line.classList.contains('is-visible'));
        }));
        elements.forEach((element) => element.replaceWith(...element.childNodes));
        blocks.forEach((block) => block.normalize());
        elements = [];

        // Measure actual rendered lines before changing the DOM. Keep links and emphasis intact.
        const jobs = [];
        blocks.forEach((block) => {
            const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
            const range = document.createRange();
            let node;
            while ((node = walker.nextNode())) {
                if (!node.textContent.trim()) continue;
                const chunks = [];
                let start = 0;
                let previousTop;
                for (let offset = 0; offset < node.length;) {
                    const length = node.textContent.codePointAt(offset) > 0xffff ? 2 : 1;
                    range.setStart(node, offset);
                    range.setEnd(node, offset + length);
                    const rect = range.getBoundingClientRect();
                    const top = Math.round(rect.top);
                    if (previousTop !== undefined && Math.abs(top - previousTop) > 2 && rect.height) {
                        chunks.push(node.textContent.slice(start, offset));
                        start = offset;
                    }
                    if (rect.height) previousTop = top;
                    offset += length;
                }
                chunks.push(node.textContent.slice(start));
                jobs.push({ node, chunks, visible: visibleBlocks.has(block) });
            }
        });
        jobs.forEach(({ node, chunks, visible }) => {
            const fragment = document.createDocumentFragment();
            chunks.forEach((text) => {
                const span = document.createElement('span');
                span.className = 'biography-reveal' + (visible ? ' is-visible' : '');
                span.textContent = text;
                fragment.append(span);
                elements.push(span);
            });
            node.replaceWith(fragment);
        });
        elements.forEach((element) => {
            if (!element.classList.contains('is-visible')) observer.observe(element);
        });
    };
    prepareLines();

    let previousWidth = document.documentElement.clientWidth;
    let resizeTimer;
    window.addEventListener('resize', () => {
        if (document.documentElement.clientWidth === previousWidth) return;
        previousWidth = document.documentElement.clientWidth;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(prepareLines, 150);
    });
    if (document.fonts) document.fonts.ready.then(prepareLines);

    // Keep keyboard navigation and changes to motion preferences accessible.
    document.addEventListener('focusin', (event) => {
        const element = event.target.closest('.biography-reveal');
        if (element) reveal(element);
    });
    motionPreference.addEventListener('change', (event) => {
        if (event.matches) {
            clearTimeout(revealTimer);
            pending.clear();
            elements.forEach(reveal);
            observer.disconnect();
        }
    });
})();
