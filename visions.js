import * as THREE from "./vendor/three.module.min.js";

(() => {
    "use strict";

    const albums = [
        { title: "First Meltdown", image: "First Meltdown.JPEG" },
        { title: "Edge of the Knife", image: "Edge of the Knife.JPEG" },
        { title: "Heavy Duty", image: "Heavy Duty.JPEG" },
        { title: "Awakening of Recognition", image: "Awakening of Recognition.JPEG" },
        { title: "Mighty Souls", image: "Mighty Souls.JPEG" },
        { title: "Mission of Humanity", image: "Mission of Humanity.JPEG" },
        { title: "We Become What We See", image: "We Become What We See.JPEG" },
        { title: "Primal Pulse", image: "Primal Pulse.JPEG" },
        { title: "Shred Wars", image: "Shred Wars.JPEG" },
        { title: "Mind Wall Resistance", image: "Mind Wall Resistance.jpg" }
    ];
    const stage = document.querySelector(".visions-stage");
    const track = document.querySelector(".visions-scroll-track");
    const canvas = document.querySelector(".visions-canvas");
    const loading = document.querySelector(".visions-loading");
    const prompt = document.querySelector(".visions-scroll-prompt");
    const indexNav = document.querySelector(".visions-index");
    const details = document.querySelector(".visions-details");
    const fallback = document.querySelector(".visions-fallback");
    const fallbackGrid = document.querySelector(".visions-fallback-grid");
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const abortController = new AbortController();
    const sceneObjects = [];
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const cameraTarget = new THREE.Vector3();
    const cameraLookTarget = new THREE.Vector3();
    const cameraLookCurrent = new THREE.Vector3();
    const cubes = [];
    const carousel = new THREE.Group();
    let renderer;
    let scene;
    let camera;
    let animationFrame = 0;
    let selectedIndex = -1;
    let scrollProgress = 0;
    let pointerDown = null;
    let disposed = false;
    let textureAnisotropy = 1;
    const textures = [];

    if (!stage || !canvas || !track) return;

    function createAlbumButtons() {
        albums.forEach((album, albumIndex) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = String(albumIndex + 1).padStart(2, "0");
            button.setAttribute("aria-label", `Select ${album.title}`);
            button.addEventListener("click", () => selectAlbum(albumIndex), { signal: abortController.signal });
            indexNav.append(button);

            const fallbackButton = document.createElement("button");
            fallbackButton.className = "visions-fallback-card";
            fallbackButton.type = "button";
            fallbackButton.addEventListener("click", () => selectAlbum(albumIndex), { signal: abortController.signal });
            const image = document.createElement("img");
            image.src = album.image;
            image.alt = "";
            image.loading = "lazy";
            const title = document.createElement("span");
            title.textContent = album.title;
            fallbackButton.append(image, title);
            fallbackGrid.append(fallbackButton);
        });
    }

    function updateCurrentAlbumButton() {
        [...indexNav.children].forEach((button, albumIndex) => {
            if (albumIndex === selectedIndex) button.setAttribute("aria-current", "true");
            else button.removeAttribute("aria-current");
        });
    }

    function showFallback(message) {
        stage.classList.add("is-fallback");
        fallback.hidden = false;
        loading.hidden = true;
        fallback.querySelector("p").textContent = message;
        canvas.setAttribute("aria-hidden", "true");
    }

    function readAlbumDetails() {
        return fetch(new URL("albums.html", document.baseURI), { signal: abortController.signal })
            .then(response => {
                if (!response.ok) throw new Error(`Album information request failed (${response.status}).`);
                return response.text();
            })
            .then(markup => {
                const source = new DOMParser().parseFromString(markup, "text/html");
                const information = new Map();
                source.querySelectorAll("main > section > article").forEach(article => {
                    const headings = [...article.querySelectorAll("h3")];
                    const trackParagraph = article.querySelector("p");
                    if (headings.length < 2 || !trackParagraph) return;
                    const paragraph = trackParagraph.cloneNode(true);
                    paragraph.querySelectorAll("br").forEach(lineBreak => lineBreak.replaceWith(document.createTextNode("\n")));
                    const tracks = paragraph.textContent.split("\n").map(line => line.trim()).filter(Boolean);
                    information.set(headings[1].textContent.trim().toUpperCase(), {
                        release: headings[0].textContent.trim(),
                        tracks
                    });
                });
                if (information.size !== albums.length) {
                    throw new Error(`Expected track information for ${albums.length} albums; found ${information.size}.`);
                }
                return information;
            });
    }

    function showAlbumDetails(albumIndex, information) {
        const album = albums[albumIndex];
        const albumInfo = information.get(album.title.toUpperCase());
        document.querySelector(".visions-release").textContent = albumInfo?.release ?? "ALBUM";
        document.querySelector(".visions-title").textContent = album.title;
        const list = document.querySelector(".visions-tracklist");
        list.replaceChildren();
        if (!albumInfo) {
            const item = document.createElement("li");
            item.textContent = "Track information could not be loaded.";
            list.append(item);
        } else {
            albumInfo.tracks.forEach(track => {
                const item = document.createElement("li");
                const match = track.match(/^(\d{2})\.\s*(.*)$/);
                if (match) {
                    const number = document.createElement("span");
                    number.className = "visions-track-number";
                    number.textContent = `${match[1]}.`;
                    item.append(number, document.createTextNode(match[2]));
                } else {
                    item.textContent = track;
                }
                list.append(item);
            });
        }
        details.hidden = false;
    }

    function makeTexture(imagePath) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                const maxSize = window.innerWidth <= 700 ? 512 : 1024;
                const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
                const width = Math.max(1, Math.round(image.naturalWidth * scale));
                const height = Math.max(1, Math.round(image.naturalHeight * scale));
                const bitmap = document.createElement("canvas");
                bitmap.width = width;
                bitmap.height = height;
                const context = bitmap.getContext("2d");
                if (!context) {
                    reject(new Error(`Could not prepare album cover: ${imagePath}`));
                    return;
                }
                context.drawImage(image, 0, 0, width, height);
                const texture = new THREE.CanvasTexture(bitmap);
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.anisotropy = textureAnisotropy;
                texture.needsUpdate = true;
                textures.push(texture);
                resolve(texture);
            };
            image.onerror = () => reject(new Error(`Could not load album cover: ${imagePath}`));
            image.src = imagePath;
        });
    }

    function createCube(album, albumIndex, texture) {
        if (disposed || !scene) {
            texture.dispose();
            return;
        }
        const cover = new THREE.MeshStandardMaterial({
            map: texture,
            emissiveMap: texture,
            color: 0xffffff,
            emissive: 0xffffff,
            metalness: 0.16,
            roughness: 0.52,
            emissiveIntensity: 0.18
        });
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(2.45, 2.45, 2.45),
            [cover, cover, cover, cover, cover, cover]
        );
        const narrow = window.innerWidth <= 700;
        const ringRadius = narrow ? 6.1 : 8;
        const ringAngle = albumIndex / albums.length * Math.PI * 2;
        mesh.userData.baseScale = 0.94 + Math.random() * 0.18;
        mesh.position.set(
            Math.cos(ringAngle) * ringRadius,
            Math.sin(ringAngle) * ringRadius,
            0
        );
        mesh.scale.setScalar(mesh.userData.baseScale);
        mesh.rotation.set(
            (Math.random() - 0.5) * 0.16,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.11
        );
        mesh.userData.baseRotationX = mesh.rotation.x;
        mesh.userData.baseRotationY = mesh.rotation.y;
        mesh.userData.dragRotationX = 0;
        mesh.userData.dragRotationY = 0;
        mesh.userData.albumIndex = albumIndex;
        mesh.userData.basePositionY = mesh.position.y;
        carousel.add(mesh);
        cubes[albumIndex] = mesh;

        const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(mesh.geometry),
            new THREE.LineBasicMaterial({ color: 0x9bc9e0, transparent: true, opacity: 0.58 })
        );
        mesh.add(edges);
        mesh.userData.edgeMaterial = edges.material;
        mesh.userData.coverMaterial = cover;
    }

    function createEndLogo(texture) {
        if (disposed || !scene) {
            texture.dispose();
            return;
        }
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            toneMapped: false
        });
        const logo = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), material);
        logo.position.set(0, 0, -9.2);
        logo.renderOrder = -1;
        scene.add(logo);
        sceneObjects.push(logo);
    }

    function addSpaceDetails() {
        scene.background = new THREE.Color(0x07090c);
        scene.fog = new THREE.FogExp2(0x07090c, 0.013);
        scene.add(new THREE.HemisphereLight(0x9ab6cb, 0x08090c, 1.45));

        const keyLight = new THREE.PointLight(0x9edcff, 38, 35, 1.8);
        keyLight.position.set(-4, 4, -8);
        scene.add(keyLight);
        const warmLight = new THREE.PointLight(0xd87946, 18, 28, 2);
        warmLight.position.set(4, -1, -34);
        scene.add(warmLight);

        const lines = [];
        const lineColor = [];
        const addLine = (a, b, color) => {
            lines.push(...a, ...b);
            lineColor.push(...color, ...color);
        };
        const cyan = [0.08, 0.72, 1];
        const pink = [1, 0.06, 0.42];
        const floorY = -8.5;
        for (const z of [-18, 4]) {
            addLine([-14, floorY, z], [14, floorY, z], z < -7 ? cyan : pink);
        }
        let crossLine = 0;
        for (let x = -14; x <= 14; x += 4) {
            addLine([x, floorY, -18], [x, floorY, 4], crossLine % 2 === 0 ? cyan : pink);
            crossLine += 1;
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
        geometry.setAttribute("color", new THREE.Float32BufferAttribute(lineColor, 3));
        const grid = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false
        }));
        const gridGlow = new THREE.LineSegments(geometry.clone(), new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.22,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false
        }));
        scene.add(grid);
        scene.add(gridGlow);
        sceneObjects.push(grid, gridGlow);

        const starCount = window.innerWidth <= 700 ? 110 : 240;
        const starPositions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i += 1) {
            starPositions[i * 3] = (Math.random() - 0.5) * 38;
            starPositions[i * 3 + 1] = (Math.random() - 0.5) * 24;
            starPositions[i * 3 + 2] = -30 + Math.random() * 34;
        }
        const starsGeometry = new THREE.BufferGeometry();
        starsGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
        const starGlow = new THREE.Points(starsGeometry.clone(), new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.14,
            transparent: true,
            opacity: 0.28,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false
        }));
        const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.055,
            transparent: true,
            opacity: 1,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false
        }));
        scene.add(stars);
        scene.add(starGlow);
        sceneObjects.push(stars, starGlow);
    }

    function updateScrollProgress() {
        const maxScroll = Math.max(1, track.offsetHeight - stage.clientHeight);
        const travelled = Math.max(0, -track.getBoundingClientRect().top);
        scrollProgress = THREE.MathUtils.clamp(travelled / maxScroll, 0, 1);
        prompt.style.opacity = scrollProgress > 0.025 ? "0" : "1";
        prompt.setAttribute("aria-hidden", scrollProgress > 0.025 ? "true" : "false");
    }

    function updateCamera() {
        cameraTarget.set(0, 4, 14);
        cameraLookTarget.set(0, 0, -7);

        if (selectedIndex >= 0 && cubes[selectedIndex]) {
            const selected = cubes[selectedIndex].getWorldPosition(new THREE.Vector3());
            cameraTarget.set(selected.x, selected.y, selected.z + 7.5);
            cameraLookTarget.copy(selected);
        }

        const easing = reduceMotion.matches ? 1 : 0.075;
        camera.position.lerp(cameraTarget, easing);
        cameraLookCurrent.lerp(cameraLookTarget, easing);
        camera.lookAt(cameraLookCurrent);
    }

    function animate(time) {
        if (disposed) return;
        animationFrame = requestAnimationFrame(animate);
        if (!renderer || !scene || !camera) return;
        carousel.rotation.set(
            0.12,
            -Math.PI / 2 - scrollProgress * Math.PI * 2,
            0.14
        );
        updateCamera();
        cubes.forEach((cube, albumIndex) => {
            if (!cube) return;
            const selected = albumIndex === selectedIndex;
            cube.rotation.y = cube.userData.baseRotationY
                + cube.userData.dragRotationY
                + (reduceMotion.matches || selected ? 0 : Math.sin(time * 0.00018 + albumIndex) * 0.13);
            cube.rotation.x = cube.userData.baseRotationX
                + cube.userData.dragRotationX
                + (reduceMotion.matches || selected ? 0 : Math.sin(time * 0.00023 + albumIndex * 0.8) * 0.08);
        });
        if (!reduceMotion.matches) {
            cubes.forEach((cube, albumIndex) => {
                if (!cube) return;
                const selected = albumIndex === selectedIndex;
                const float = Math.sin(time * 0.00065 + albumIndex * 1.7) * 0.075;
                cube.position.y += (cube.userData.basePositionY + (selected ? 0 : float) - cube.position.y) * 0.035;
                const targetScale = cube.userData.baseScale * (selected ? 1.14 : 1);
                cube.scale.setScalar(cube.scale.x + (targetScale - cube.scale.x) * 0.06);
                cube.userData.edgeMaterial.opacity = selected ? 0.95 : 0.58;
                cube.userData.coverMaterial.emissiveIntensity = selected ? 0.32 : 0.18;
            });
        }
        renderer.render(scene, camera);
    }

    function selectAlbum(albumIndex, information = albumInformation) {
        selectedIndex = selectedIndex === albumIndex ? -1 : albumIndex;
        updateCurrentAlbumButton();
        if (selectedIndex < 0) {
            details.hidden = true;
            return;
        }
        showAlbumDetails(selectedIndex, information);
        if (!stage.classList.contains("is-fallback")) {
            const stageTop = track.getBoundingClientRect().top + window.scrollY;
            const maxScroll = Math.max(1, track.offsetHeight - stage.clientHeight);
            const targetScroll = stageTop + maxScroll * (selectedIndex / albums.length);
            window.scrollTo({ top: targetScroll, behavior: reduceMotion.matches ? "auto" : "smooth" });
        }
    }

    createAlbumButtons();
    document.querySelector(".visions-close").addEventListener("click", () => {
        selectedIndex = -1;
        details.hidden = true;
        updateCurrentAlbumButton();
    }, { signal: abortController.signal });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !details.hidden) {
            selectedIndex = -1;
            details.hidden = true;
            updateCurrentAlbumButton();
        }
    }, { signal: abortController.signal });

    let albumInformation = new Map();
    const detailsRequest = readAlbumDetails()
        .then(information => {
            albumInformation = information;
            if (selectedIndex >= 0) showAlbumDetails(selectedIndex, albumInformation);
        })
        .catch(error => {
            if (error.name !== "AbortError") {
                console.error("VISIONS could not load album track information.", error);
                if (selectedIndex >= 0) showAlbumDetails(selectedIndex, albumInformation);
            }
        });

    try {
        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: window.innerWidth > 700,
            alpha: false,
            powerPreference: "low-power"
        });
    } catch (error) {
        console.error("VISIONS could not initialize WebGL; showing album image fallback.", error);
        showFallback("3D is unavailable on this device. Choose an album image to view its details.");
    }

    if (renderer) {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(48, 1, 0.1, 150);
        camera.position.set(0, 4, 14);
        scene.add(carousel);
        carousel.position.z = -7;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth <= 700 ? 1.5 : 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        textureAnisotropy = Math.min(3, renderer.capabilities.getMaxAnisotropy());
        addSpaceDetails();

        const resize = () => {
            const width = stage.clientWidth;
            const height = stage.clientHeight;
            if (!width || !height) return;
            camera.aspect = width / height;
            camera.fov = window.innerWidth <= 700 ? 58 : 48;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);
        };
        window.addEventListener("resize", resize, { signal: abortController.signal });
        window.addEventListener("scroll", updateScrollProgress, { passive: true, signal: abortController.signal });
        resize();
        updateScrollProgress();

        let loaded = 0;
        let failed = 0;
        const coverRequests = albums.map((album, albumIndex) => makeTexture(album.image)
            .then(texture => createCube(album, albumIndex, texture))
            .catch(error => {
                failed += 1;
                console.error(`VISIONS could not load "${album.title}".`, error);
            })
            .finally(() => {
                loaded += 1;
                if (loading) {
                    loading.textContent = failed
                        ? `Loading albums ${loaded} / ${albums.length} — some covers are unavailable.`
                        : `Loading albums ${loaded} / ${albums.length}...`;
                }
            }));
        const logoRequest = makeTexture("EMJ-logo1.png")
            .then(createEndLogo)
            .catch(error => {
                console.error("VISIONS could not load the end-of-gallery logo.", error);
            });
        Promise.all([Promise.all(coverRequests), detailsRequest, logoRequest]).then(() => {
            if (disposed) return;
            loading.hidden = true;
            if (failed === albums.length) {
                showFallback("Album artwork could not be loaded. Check your connection and try again.");
            }
        });

        const hitTargets = [];
        canvas.addEventListener("pointerdown", event => {
            pointerDown = {
                x: event.clientX,
                y: event.clientY,
                lastX: event.clientX,
                lastY: event.clientY,
                pointerId: event.pointerId
            };
        }, { signal: abortController.signal });
        canvas.addEventListener("pointerup", event => {
            if (!pointerDown || pointerDown.pointerId !== event.pointerId) return;
            const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 9;
            pointerDown = null;
            if (moved || !camera) return;
            const rect = canvas.getBoundingClientRect();
            pointer.set(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );
            hitTargets.length = 0;
            cubes.forEach(cube => { if (cube) hitTargets.push(cube); });
            raycaster.setFromCamera(pointer, camera);
            const hit = raycaster.intersectObjects(hitTargets, false)[0];
            if (hit) selectAlbum(hit.object.userData.albumIndex, albumInformation);
        }, { signal: abortController.signal });
        canvas.addEventListener("pointercancel", () => { pointerDown = null; }, { signal: abortController.signal });
        canvas.addEventListener("pointermove", event => {
            if (pointerDown?.pointerId === event.pointerId && !reduceMotion.matches) {
                const deltaX = event.clientX - pointerDown.lastX;
                const deltaY = event.clientY - pointerDown.lastY;
                cubes.forEach(cube => {
                    if (!cube) return;
                    cube.userData.dragRotationY += deltaX * 0.025;
                    cube.userData.dragRotationX += deltaY * 0.025;
                });
                pointerDown.lastX = event.clientX;
                pointerDown.lastY = event.clientY;
            }
            const rect = canvas.getBoundingClientRect();
            pointer.set(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );
            const hitTargets = cubes.filter(Boolean);
            raycaster.setFromCamera(pointer, camera);
            canvas.style.cursor = raycaster.intersectObjects(hitTargets, false).length ? "pointer" : "grab";
        }, { signal: abortController.signal });
        animationFrame = requestAnimationFrame(animate);
    }

    window.addEventListener("pagehide", () => {
        disposed = true;
        cancelAnimationFrame(animationFrame);
        abortController.abort();
        sceneObjects.forEach(object => {
            object.geometry?.dispose();
            if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
            else object.material?.dispose();
        });
        cubes.forEach(cube => {
            if (!cube) return;
            cube.geometry.dispose();
            cube.material.forEach(material => material.dispose());
            cube.userData.edgeMaterial.dispose();
            cube.traverse(child => {
                if (child !== cube) child.geometry?.dispose();
            });
        });
        textures.forEach(texture => texture.dispose());
        renderer?.dispose();
    }, { once: true });
})();
