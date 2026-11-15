(() => {
    const studioPlayers = new Map([
        ['FIRST MELTDOWN', ['3SXWhcGwV1gZvJ7N3pnZK7', 'OLAK5uy_n0yLfP_qCf5fZzEWwP0_8o3o9_6yXplxM']],
        ['EDGE OF THE KNIFE', ['2vtMykeTMRZcbxl26V8wl2', 'OLAK5uy_nIye5ruiDHfEsbMKvHSfyah-RMVI5Luk0']],
        ['HEAVY DUTY', ['4DHLTrMl3GJO1YsI4An266', 'OLAK5uy_n41u5FDOtny4mwIO2AAeKMhzm84jvy2yA']],
        ['AWAKENING OF RECOGNITION', ['6TVUQSdw4BloJDYTcBLMJZ', 'OLAK5uy_mXns-x-UpY8lesd_LIJBnpZhc2qlqkEe0']],
        ['MIGHTY SOULS', ['0LCY8IhvbEdB823aXQrtnd', 'OLAK5uy_nHgZf4qup4g3CSflchZQwC0mkHiNSBYZw']],
        ['MISSION OF HUMANITY', ['3mIWDz6BbLdoeq8I6BrVCC', 'OLAK5uy_lm6-Fn-aPB5o-mbxwItp2K1iFd4wbvPa4']],
        ['WE BECOME WHAT WE SEE', ['6gvcQrzDmLNXYhXFYG9jKi', 'OLAK5uy_lVby7Aua1DEMZjFX5pTyuCsbXb4I5TqFg']],
        ['PRIMAL PULSE', ['0Gp5ghalf7TCGh9yG7Wzj8', 'OLAK5uy_l_tE4JxhuXgfGICs8i0oTmNdBhOErr0c4']],
        ['SHRED WARS', ['6MmsBprck6KYN4rxx6O2Ai', 'OLAK5uy_l6NpcRX2JLHEhkVRX221CaxXQjDJyxUb4']],
        ['MIND WALL RESISTANCE', ['476WpC193UlXdnK4oXFdBh', 'OLAK5uy_njU56phbY3Mpl7YAdF1sZgNANrF5GMxHg']]
    ]);

    function setupPlayer(container, studioExperience) {
        const layer = container.closest('.discography-layer');
        const title = container.dataset.playerTitle || 'Studio album';
        let albumTitle = studioExperience
            ? studioExperience.querySelector('.studio-album-information h3')?.textContent.trim()
            : title;
        let service = 'spotify';
        let active = !layer || !layer.hidden;

        const controls = document.createElement('div');
        controls.className = 'emj-player-controls';
        controls.setAttribute('role', 'group');
        controls.setAttribute('aria-label', `Choose player for ${title}`);

        const frameHost = document.createElement('div');
        frameHost.className = 'emj-player-frame';
        container.append(controls, frameHost);

        function getPlaylist() {
            if (studioExperience) return studioPlayers.get(albumTitle);
            return [container.dataset.spotifyId, container.dataset.youtubePlaylistId];
        }

        function renderPlayer() {
            frameHost.replaceChildren();
            if (!active) return;
            const playlist = getPlaylist();
            if (!playlist || playlist.some(id => !id)) {
                console.error(`Missing player URLs for ${albumTitle}.`);
                return;
            }

            const frame = document.createElement('iframe');
            frame.title = `${albumTitle} on ${service === 'spotify' ? 'Spotify' : 'YouTube'}`;
            frame.width = '100%';
            frame.height = '352';
            frame.loading = 'lazy';
            frame.referrerPolicy = 'strict-origin-when-cross-origin';
            frame.allow = service === 'spotify'
                ? 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'
                : 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            frame.src = service === 'spotify'
                ? `https://open.spotify.com/embed/album/${playlist[0]}`
                : `https://www.youtube.com/embed/videoseries?list=${playlist[1]}`;
            frameHost.append(frame);
        }

        function updateControls() {
            [...controls.children].forEach(button => {
                button.setAttribute('aria-pressed', String(button.dataset.service === service));
            });
        }

        for (const [name, label] of [['spotify', 'SPOTIFY'], ['youtube', 'YOUTUBE']]) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'emj-player-service';
            button.dataset.service = name;
            button.textContent = label;
            button.setAttribute('aria-pressed', String(name === service));
            button.addEventListener('click', () => {
                if (service === name) return;
                service = name;
                updateControls();
                renderPlayer();
            });
            controls.append(button);
        }

        if (studioExperience) {
            studioExperience.addEventListener('studioalbumchange', event => {
                albumTitle = event.detail.title;
                renderPlayer();
            });
        }

        if (layer) {
            layer.addEventListener('discography:deactivate', () => {
                active = false;
                frameHost.replaceChildren();
            });
            layer.addEventListener('discography:activate', () => {
                active = true;
                renderPlayer();
            });
        }

        renderPlayer();
    }

    document.querySelectorAll('.studio-album-experience').forEach(experience => {
        if (experience.dataset.collection === 'compilations') return;
        const container = document.createElement('div');
        container.className = 'emj-player-controller';
        container.dataset.playerKind = 'studio';
        experience.append(container);
        setupPlayer(container, experience);
    });

    document.querySelectorAll('.emj-player-controller[data-player-kind="collaboration"]')
        .forEach(container => setupPlayer(container, null));
})();
