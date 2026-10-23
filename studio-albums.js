(async () => {
    const experience = document.querySelector('.studio-album-experience');
    if (!experience) return;

    let sourceAlbums;
    try {
        const response = await fetch('albums.html');
        if (!response.ok) return;
        const albumDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
        sourceAlbums = [...albumDocument.querySelectorAll('main section article')];
        if (sourceAlbums.length !== 10) return;
    } catch {
        return;
    }

    const albums = sourceAlbums.map(article => {
        const headings = [...article.querySelectorAll('h3')];
        const image = article.querySelector('img');
        const trackParagraph = article.querySelector('p');
        const trackText = trackParagraph.cloneNode(true);
        trackText.querySelectorAll('br').forEach(lineBreak => lineBreak.replaceWith('\n'));
        return {
            title: headings[1].textContent.trim(),
            image,
            tracks: trackText.textContent.split('\n').map(line => line.trim()).filter(Boolean)
        };
    });

    const carousel = document.createElement('div');
    carousel.className = 'studio-album-carousel';
    carousel.setAttribute('role', 'region');
    carousel.setAttribute('aria-label', 'Studio albums');
    carousel.tabIndex = 0;

    const ring = document.createElement('div');
    ring.className = 'studio-album-ring';
    ring.setAttribute('aria-live', 'off');
    const cards = albums.map((album, index) => {
        const card = document.createElement('button');
        card.className = 'studio-album-card';
        card.type = 'button';
        card.setAttribute('aria-label', `Select ${album.title}`);
        card.dataset.albumIndex = String(index);
        const cover = album.image.cloneNode(true);
        cover.alt = '';
        card.append(cover);
        card.addEventListener('click', () => selectAlbum(index));
        ring.append(card);
        return card;
    });
    carousel.append(ring);

    const information = document.createElement('div');
    information.className = 'studio-album-information';
    information.setAttribute('aria-live', 'polite');
    const title = document.createElement('h3');
    const trackHeading = document.createElement('h4');
    trackHeading.textContent = 'TRACKLIST';
    const trackList = document.createElement('ol');
    trackList.className = 'studio-album-tracklist';
    information.append(title, trackHeading, trackList);
    experience.append(carousel, information);

    let rotation = 0;
    let activeIndex = 0;
    let pointerStartX = 0;
    let pointerStartRotation = 0;
    let dragging = false;
    let moved = false;
    const step = 360 / albums.length;

    function showTracks(index) {
        if (activeIndex === index && trackList.childElementCount) return;
        activeIndex = index;
        title.textContent = albums[index].title;
        trackList.replaceChildren(...albums[index].tracks.map(track => {
            const item = document.createElement('li');
            const match = track.match(/^(\d{2})\.\s*(.*)$/);
            if (match) {
                const number = document.createElement('span');
                number.className = 'studio-track-number';
                number.textContent = `${match[1]}.`;
                item.append(number, document.createTextNode(match[2]));
            } else {
                item.textContent = track;
            }
            return item;
        }));
    }

    function render(animate = true) {
        const nearestIndex = ((Math.round(-rotation / step) % albums.length) + albums.length) % albums.length;
        ring.classList.toggle('is-moving', !animate);
        cards.forEach((card, index) => {
            const angle = index * step + rotation;
            const depth = Math.cos(angle * Math.PI / 180);
            const scale = 0.72 + (depth + 1) * 0.14;
            const opacity = 0.55 + (depth + 1) * 0.22;
            card.style.setProperty('--album-angle', `${angle}deg`);
            card.style.setProperty('--album-depth', String(depth));
            card.style.setProperty('--album-scale', String(scale));
            card.style.setProperty('--album-opacity', String(opacity));
            card.style.zIndex = String(Math.round((depth + 1) * 50));
            card.classList.toggle('is-selected', index === nearestIndex);
            card.setAttribute('aria-pressed', String(index === nearestIndex));
        });
        if (animate) showTracks(nearestIndex);
        requestAnimationFrame(() => ring.classList.remove('is-moving'));
    }

    function selectAlbum(index) {
        if (moved) return;
        rotation = -index * step;
        render();
    }

    const randomIndex = Math.floor(Math.random() * albums.length);
    rotation = -randomIndex * step;
    activeIndex = -1;
    render(false);
    showTracks(randomIndex);

    carousel.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        dragging = true;
        moved = false;
        pointerStartX = event.clientX;
        pointerStartRotation = rotation;
        carousel.setPointerCapture(event.pointerId);
    });

    carousel.addEventListener('pointermove', event => {
        if (!dragging) return;
        const delta = event.clientX - pointerStartX;
        if (Math.abs(delta) > 5) moved = true;
        if (!moved) return;
        const degreesPerPixel = 180 / Math.max(carousel.clientWidth, 1);
        rotation = pointerStartRotation + delta * degreesPerPixel;
        render(false);
    });

    function finishDrag() {
        if (!dragging) return;
        dragging = false;
        rotation = Math.round(rotation / step) * step;
        render();
        if (moved) setTimeout(() => { moved = false; }, 0);
    }

    carousel.addEventListener('pointerup', finishDrag);
    carousel.addEventListener('pointercancel', finishDrag);
    carousel.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? -1 : 1;
        const nextIndex = (activeIndex + direction + albums.length) % albums.length;
        selectAlbum(nextIndex);
    });

})();
