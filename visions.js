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
    const particlePointer = new THREE.Vector3();
    const previousParticlePointer = new THREE.Vector3();
    const cubes = [];
    const endOfSpaceZ = -120;
    const cameraEndZ = endOfSpaceZ + 12;
    const narrowViewport = window.innerWidth <= 700;
    const ambientParticleCount = reduceMotion.matches
        ? (narrowViewport ? 28 : 48)
        : (narrowViewport ? 64 : 140);
    const interactionParticleCount = reduceMotion.matches
        ? (narrowViewport ? 14 : 24)
        : (narrowViewport ? 32 : 72);
    const particleVelocities = [];
    const particleLifetimes = [];
    const particleAges = [];
    const particleCapacity = ambientParticleCount + interactionParticleCount;
    let particlePositions;
    let particleAlphas;
    let particleSizes;
    let particleGeometry;
    let particleMaterial;
    let particleCursor = 0;
    let previousParticleTime = 0;
    let lastParticleEmission = 0;
    let hasPreviousParticlePointer = false;
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
        const cover = new THREE.MeshBasicMaterial({
            map: texture,
            color: 0xffffff,
            toneMapped: false
        });
        const metal = new THREE.MeshStandardMaterial({
            color: 0x65727c,
            metalness: 0.88,
            roughness: 0.3,
            emissive: 0x101c26,
            emissiveIntensity: 0.2
        });
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(2.45, 2.45, 2.45),
            [cover, cover, cover, cover, cover, cover]
        );
        const side = albumIndex % 2 === 0 ? -1 : 1;
        const narrow = window.innerWidth <= 700;
        mesh.userData.baseScale = 0.94 + Math.random() * 0.18;
        mesh.position.set(
            side * ((narrow ? 0.82 : 2.5) + Math.random() * (narrow ? 0.18 : 0.62)),
            (Math.random() - 0.5) * (narrow ? 0.8 : 1.5),
            -8 - albumIndex * 10
        );
        mesh.scale.setScalar(mesh.userData.baseScale);
        mesh.rotation.set(
            (Math.random() - 0.5) * 0.16,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.11
        );
        mesh.userData.albumIndex = albumIndex;
        mesh.userData.baseY = mesh.position.y;
        mesh.userData.baseRotationX = mesh.rotation.x;
        mesh.userData.baseRotationY = mesh.rotation.y;
        mesh.userData.baseRotationZ = mesh.rotation.z;
        scene.add(mesh);
        sceneObjects.push(mesh);
        cubes[albumIndex] = mesh;

        const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(mesh.geometry),
            new THREE.LineBasicMaterial({ color: 0xb5d8e9, transparent: true, opacity: 0.68 })
        );
        mesh.add(edges);
        mesh.userData.edgeMaterial = edges.material;
        mesh.userData.coverMaterial = cover;
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
        const cool = [0.13, 0.29, 0.4];
        const warm = [0.35, 0.13, 0.08];
        for (const x of [-5.5, -4.8, 4.8, 5.5]) {
            addLine([x, -3.7, 2], [x, -3.7, endOfSpaceZ], x < 0 ? cool : warm);
        }
        for (let z = -4; z >= endOfSpaceZ; z -= 4) {
            addLine([-5.5, -3.7, z], [5.5, -3.7, z], cool);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
        geometry.setAttribute("color", new THREE.Float32BufferAttribute(lineColor, 3));
        const grid = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.38
        }));
        scene.add(grid);
        sceneObjects.push(grid);

        particlePositions = new Float32Array(particleCapacity * 3);
        particleAlphas = new Float32Array(particleCapacity);
        particleSizes = new Float32Array(particleCapacity);
        particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute("aAlpha", new THREE.BufferAttribute(particleAlphas, 1));
        particleGeometry.setAttribute("aSize", new THREE.BufferAttribute(particleSizes, 1));

        for (let i = 0; i < ambientParticleCount; i += 1) {
            const offset = i * 3;
            particlePositions[offset] = (Math.random() - 0.5) * 18;
            particlePositions[offset + 1] = (Math.random() - 0.5) * 11;
            particlePositions[offset + 2] = 3 - Math.random() * (3 - endOfSpaceZ);
            particleAlphas[i] = 0.12 + Math.random() * 0.2;
            particleSizes[i] = 0.014 + Math.random() * 0.017;
            particleVelocities[i] = new THREE.Vector3(
                (Math.random() - 0.5) * 0.025,
                (Math.random() - 0.5) * 0.025,
                0.16 + Math.random() * 0.3
            );
        }

        for (let i = ambientParticleCount; i < particleCapacity; i += 1) {
            particleAlphas[i] = 0;
            particleLifetimes[i] = 0;
            particleAges[i] = 0;
            particleVelocities[i] = new THREE.Vector3();
        }

        particleMaterial = new THREE.ShaderMaterial({
            uniforms: { uPixelScale: { value: 1 } },
            vertexShader: `
                attribute float aAlpha;
                attribute float aSize;
                uniform float uPixelScale;
                varying float vAlpha;
                void main() {
                    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
                    vAlpha = aAlpha;
                    gl_PointSize = clamp(aSize * uPixelScale / max(-viewPosition.z, 0.1), 1.0, 10.0);
                    gl_Position = projectionMatrix * viewPosition;
                }
            `,
            fragmentShader: `
                varying float vAlpha;
                void main() {
                    float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
                    float edge = 1.0 - smoothstep(0.34, 0.5, distanceFromCenter);
                    gl_FragColor = vec4(vec3(1.0), vAlpha * edge);
                }
            `,
            transparent: true,
            depthWrite: false,
            toneMapped: false
        });
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);
        sceneObjects.push(particles);
    }

    function emitPointerParticles(position, movement, now) {
        if (now - lastParticleEmission < (narrowViewport ? 28 : 16)) return;
        lastParticleEmission = now;

        const distance = movement.length();
        const direction = distance > 0 ? movement.clone().multiplyScalar(1 / distance) : new THREE.Vector3();
        const count = Math.min(narrowViewport ? 2 : 3, Math.max(1, Math.floor(distance / 0.16)));
        for (let i = 0; i < count; i += 1) {
            const index = ambientParticleCount + particleCursor;
            particleCursor = (particleCursor + 1) % interactionParticleCount;

            const offset = index * 3;
            const trailDistance = Math.random() * Math.min(distance, 0.42);
            particlePositions[offset] = position.x - direction.x * trailDistance;
            particlePositions[offset + 1] = position.y - direction.y * trailDistance;
            particlePositions[offset + 2] = position.z - direction.z * trailDistance;
            particleAges[index] = 0;
            particleLifetimes[index] = 0.7 + Math.random() * 0.55;
            particleAlphas[index] = 0.58 + Math.random() * 0.3;
            particleSizes[index] = 0.018 + Math.random() * 0.026;
            particleVelocities[index].set(
                -direction.x * 0.16 + (Math.random() - 0.5) * 0.12,
                -direction.y * 0.16 + (Math.random() - 0.5) * 0.12,
                0.06 + Math.random() * 0.16
            );
        }
    }

    function updateParticles(time) {
        const delta = previousParticleTime
            ? Math.min((time - previousParticleTime) / 1000, 0.05)
            : 0;
        previousParticleTime = time;
        if (delta === 0) return;

        for (let i = 0; i < ambientParticleCount; i += 1) {
            const offset = i * 3;
            const velocity = particleVelocities[i];
            if (!reduceMotion.matches) {
                particlePositions[offset] += velocity.x * delta;
                particlePositions[offset + 1] += velocity.y * delta;
                particlePositions[offset + 2] += velocity.z * delta;
            }
            if (particlePositions[offset + 2] > camera.position.z + 8) {
                particlePositions[offset] = (Math.random() - 0.5) * 18;
                particlePositions[offset + 1] = (Math.random() - 0.5) * 11;
                particlePositions[offset + 2] = endOfSpaceZ + Math.random() * 8;
            }
        }

        for (let i = ambientParticleCount; i < particleCapacity; i += 1) {
            if (!particleLifetimes[i]) continue;
            const age = particleAges[i] + delta;
            particleAges[i] = age;
            if (age >= particleLifetimes[i]) {
                particleLifetimes[i] = 0;
                particleAlphas[i] = 0;
                continue;
            }

            const offset = i * 3;
            const velocity = particleVelocities[i];
            const movementScale = reduceMotion.matches ? 0.2 : 1;
            particlePositions[offset] += velocity.x * delta * movementScale;
            particlePositions[offset + 1] += velocity.y * delta * movementScale;
            particlePositions[offset + 2] += velocity.z * delta * movementScale;
            particleAlphas[i] = (1 - age / particleLifetimes[i]) * 0.78;
        }

        particleGeometry.attributes.position.needsUpdate = true;
        particleGeometry.attributes.aAlpha.needsUpdate = true;
    }

    function addEndLogo() {
        makeTexture("EMJ-logo1.png").then(texture => {
            if (disposed || !scene) {
                texture.dispose();
                return;
            }

            const logo = new THREE.Mesh(
                new THREE.PlaneGeometry(9, 6.75),
                new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    toneMapped: false
                })
            );
            logo.position.z = endOfSpaceZ;
            scene.add(logo);
            sceneObjects.push(logo);

            const frame = new THREE.Mesh(
                new THREE.TorusGeometry(6.1, 0.04, 8, 96),
                new THREE.MeshBasicMaterial({
                    color: 0xeaf6ff,
                    transparent: true,
                    opacity: 0.7,
                    toneMapped: false
                })
            );
            frame.position.z = endOfSpaceZ + 0.2;
            scene.add(frame);
            sceneObjects.push(frame);
        }).catch(error => {
            console.error("VISIONS could not load the end-of-space logo.", error);
        });
    }

    function updateScrollProgress() {
        const maxScroll = Math.max(1, track.offsetHeight - stage.clientHeight);
        const travelled = Math.max(0, -track.getBoundingClientRect().top);
        scrollProgress = THREE.MathUtils.clamp(travelled / maxScroll, 0, 1);
        prompt.style.opacity = scrollProgress > 0.025 ? "0" : "1";
        prompt.setAttribute("aria-hidden", scrollProgress > 0.025 ? "true" : "false");
    }

    function updateCamera() {
        cameraTarget.set(
            Math.sin(scrollProgress * Math.PI * 4) * (window.innerWidth <= 700 ? 0.35 : 0.78),
            0.12 + Math.sin(scrollProgress * Math.PI * 2) * 0.14,
            2 + (cameraEndZ - 2) * scrollProgress
        );
        cameraLookTarget.set(
            cameraTarget.x + Math.sin(scrollProgress * Math.PI * 3) * 0.12,
            cameraTarget.y,
            cameraTarget.z - 12
        );

        if (selectedIndex >= 0 && cubes[selectedIndex]) {
            const selected = cubes[selectedIndex];
            cameraTarget.set(selected.position.x * 0.55, selected.position.y * 0.25, selected.position.z + 7.5);
            cameraLookTarget.copy(selected.position);
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
        updateCamera();
        updateParticles(time);
        if (!reduceMotion.matches) {
            cubes.forEach((cube, albumIndex) => {
                if (!cube) return;
                const selected = albumIndex === selectedIndex;
                const float = Math.sin(time * 0.00065 + albumIndex * 1.7) * 0.075;
                cube.position.y += (cube.userData.baseY + float - cube.position.y) * 0.035;
                cube.rotation.y = cube.userData.baseRotationY + time * 0.00008;
                cube.rotation.x = cube.userData.baseRotationX + Math.sin(time * 0.00028 + albumIndex * 0.8) * 0.52;
                cube.rotation.z = cube.userData.baseRotationZ + Math.sin(time * 0.00019 + albumIndex * 1.3) * 0.14;
                const targetScale = cube.userData.baseScale * (selected ? 1.14 : 1);
                cube.scale.setScalar(cube.scale.x + (targetScale - cube.scale.x) * 0.06);
                cube.userData.edgeMaterial.opacity = selected ? 0.95 : 0.58;
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
            const targetScroll = stageTop + maxScroll * ((selectedIndex + 0.5) / albums.length);
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
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth <= 700 ? 1.5 : 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        textureAnisotropy = Math.min(3, renderer.capabilities.getMaxAnisotropy());
        addSpaceDetails();
        addEndLogo();

        const resize = () => {
            const width = stage.clientWidth;
            const height = stage.clientHeight;
            if (!width || !height) return;
            camera.aspect = width / height;
            camera.fov = window.innerWidth <= 700 ? 54 : 48;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);
            particleMaterial.uniforms.uPixelScale.value =
                height * renderer.getPixelRatio() / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
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
        Promise.all([Promise.all(coverRequests), detailsRequest]).then(() => {
            if (disposed) return;
            loading.hidden = true;
            if (failed === albums.length) {
                showFallback("Album artwork could not be loaded. Check your connection and try again.");
            }
        });

        const hitTargets = [];
        canvas.addEventListener("pointerdown", event => {
            pointerDown = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
            hasPreviousParticlePointer = false;
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
            const touchInProgress = event.pointerType === "touch"
                && pointerDown?.pointerId === event.pointerId;
            if (event.pointerType !== "touch" || touchInProgress) {
                const rect = canvas.getBoundingClientRect();
                pointer.set(
                    ((event.clientX - rect.left) / rect.width) * 2 - 1,
                    -((event.clientY - rect.top) / rect.height) * 2 + 1
                );
                raycaster.setFromCamera(pointer, camera);
                const planeZ = camera.position.z - 9;
                const distance = (planeZ - raycaster.ray.origin.z) / raycaster.ray.direction.z;
                if (distance > 0) {
                    raycaster.ray.at(distance, particlePointer);
                    if (hasPreviousParticlePointer) {
                        const movement = particlePointer.clone().sub(previousParticlePointer);
                        if (movement.length() > 0.025) {
                            emitPointerParticles(particlePointer, movement, performance.now());
                        }
                    }
                    previousParticlePointer.copy(particlePointer);
                    hasPreviousParticlePointer = true;
                }
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
