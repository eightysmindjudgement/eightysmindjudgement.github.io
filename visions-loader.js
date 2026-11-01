(() => {
    'use strict';
    import('./visions.js').catch(error => {
        console.error('VISIONS could not start.', error);
        document.dispatchEvent(new Event('visions:error'));
        const loading = document.querySelector('.visions-loading');
        loading.hidden = true;
        const stage = document.querySelector('.visions-stage');
        stage.classList.add('is-fallback');
        const fallback = document.querySelector('.visions-fallback');
        fallback.hidden = false;
        fallback.querySelector('p').textContent = location.protocol === 'file:'
            ? 'VISIONS requires an HTTP preview. Open this page using your local preview server.'
            : 'VISIONS could not load. Reload the page to try again.';
        const link = document.createElement('a');
        link.href = 'discography.html';
        link.textContent = 'View albums in DISCOGRAPHY';
        fallback.append(link);
    });
})();
