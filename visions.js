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
    const desertCharacters = [
        {
            name: "Corporate Warrior",
            image: "透過CW.PNG",
            introductionJa: "EMJを象徴する存在。企業組織の中で権限と責任を与えられた中間管理職。変わりゆく社会の中で、自らの不満を胸にしまい、あらゆる方面から寄せられる不満を一手に引き受けながら、自らの責務を全うしようとするプロフェッショナル。First albumから継続的に登場。",
            introductionEn: "An iconic figure of EMJ. A middle manager entrusted with authority and responsibility within a corporate organization. In a changing society, he keeps his own frustrations to himself while taking on complaints from all directions, striving to fulfill his duties as a true professional. He has appeared consistently since the first album.",
            x: -34, z: 50, height: 4.2
        },
        {
            name: "Raijin Girl",
            image: "透過RG.PNG",
            introductionJa: "雷神の血を引く一族の末裔。神の世界から人間界へ降臨したその血統を受け継ぐ。勇気に満ち、強い正義感を持つ女性。First albumに登場。",
            introductionEn: "A descendant of a lineage connected to Raijin, the Japanese god of thunder. She carries the bloodline of those who descended from the divine realm into the human world. Courageous and driven by a strong sense of justice. She appears in the first album.",
            x: -7, z: 32, height: 4.4
        },
        {
            name: "Hard Rock OJISAN",
            image: "透過HROJI.PNG",
            introductionJa: "ハードロック全盛期の1980年代に20代を過ごした会社員。陽気で面倒見が良い。First albumに登場。",
            introductionEn: "A company employee who spent his twenties during the golden age of hard rock in the 1980s. Cheerful and caring, he is always ready to lend a helping hand. He appears in the first album.",
            x: 8, z: 45, height: 4.1
        },
        {
            name: "Cyborg Grandpa",
            image: "透過CGP.PNG",
            introductionJa: "超高齢化社会において、科学の力を借りながらなお働き続けるおじいさん。",
            introductionEn: "An elderly man who continues to work in an aging society, relying on the power of science to keep going.",
            x: 37, z: 67, height: 4.5
        },
        {
            name: "Metal Messiah",
            image: "透過MM.PNG",
            introductionJa: "人類が抱える課題の解決に向け、その鍵を握る救世主。6th albumのジャケットに登場。",
            introductionEn: "A messianic figure holding the key to solving humanity's challenges. Featured on the cover of the sixth album.",
            x: 47, z: 93, height: 4.8
        },
        {
            name: "Chrome Man",
            image: "透過CM.PNG",
            introductionJa: "7th albumの主役。大衆心理を映し出す鏡として誕生した存在。",
            introductionEn: "The central figure of the seventh album. Born as a mirror reflecting the psychology of the masses.",
            x: 27, z: 119, height: 4.3
        },
        {
            name: "EMJ LADY",
            image: "透過EL.PNG",
            introductionJa: "Eighty's Mind Judgementの熱狂的なファンであり、EMJの広告塔。",
            introductionEn: "A devoted fan of Eighty's Mind Judgement and its promotional figure.",
            x: -13, z: 132, height: 4.2
        },
        {
            name: "Corporate Warrior & Corporate Warrior AMERICA",
            image: "透過CW2.PNG",
            introductionJa: "日米のCorporate Warriorが共演。国境を越えて、Corporate Warriorの精神が交差する。",
            introductionEn: "A collaboration between the Japanese and American Corporate Warriors. Across borders, their shared spirit comes together.",
            x: -52, z: 112, height: 5
        }
    ];
    const celestialCharacterIntroductions = {
        metalShogun: {
            name: "Metal Shogun",
            image: "profile-artwork.JPG",
            introductionJa: "Eighty's Mind Judgement誕生の原点となった記念すべき作品に登場。将軍の立場にありながら、民の声に真摯に耳を傾け、自ら先頭に立って行動するリーダー。",
            introductionEn: "Featured in the landmark work that marked the origin of Eighty's Mind Judgement. Despite his position as a shogun, he listens sincerely to the voices of the people and leads by example, taking action at the forefront."
        },
        creator: {
            name: "Creator",
            image: "Creator.PNG",
            introductionJa: "Eighty's Mind Judgementを生み出した創作者。会社員として働く傍ら、ヘヴィメタルを愛し、創作活動を続けている。心に響いた言葉を集めることも趣味のひとつ。",
            introductionEn: "The creator of Eighty's Mind Judgement. A working professional who continues to pursue creative endeavors while embracing a passion for heavy metal. Collecting words that resonate deeply is also one of his hobbies."
        }
    };
    const stage = document.querySelector(".visions-stage");
    const track = document.querySelector(".visions-scroll-track");
    const canvas = document.querySelector(".visions-canvas");
    const loading = document.querySelector(".visions-loading");
    const loadingBar = document.querySelector(".visions-loading-bar");
    const loadingPercent = document.querySelector(".visions-loading-percent");
    let completedLoads = 0;
    function advanceLoadingProgress() {
        // Ten album covers and the track information each count as one task.
        const percent = Math.round(++completedLoads / (albums.length + 1) * 100);
        if (loadingBar) loadingBar.value = percent;
        if (loadingPercent) loadingPercent.textContent = `${percent}%`;
    }
    const prompt = document.querySelector(".visions-scroll-prompt");
    const worldLabel = document.querySelector(".visions-world-label");
    const indexNav = document.querySelector(".visions-index");
    const details = document.querySelector(".visions-details");
    const characterDetails = document.querySelector(".visions-character-details");
    const characterImage = document.querySelector(".visions-character-image");
    const characterTitle = document.querySelector(".visions-character-title");
    const characterIntroductionJa = document.querySelector(".visions-character-introduction-ja");
    const characterIntroductionEn = document.querySelector(".visions-character-introduction-en");
    const fallback = document.querySelector(".visions-fallback");
    const fallbackGrid = document.querySelector(".visions-fallback-grid");
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const abortController = new AbortController();
    const sceneObjects = [];
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const cameraTarget = new THREE.Vector3();
    const cameraLookCurrent = new THREE.Vector3();
    const particlePointer = new THREE.Vector3();
    const previousParticlePointer = new THREE.Vector3();
    const cubes = [];
    const desertSprites = [];
    const desertTextures = [];
    const celestialTargets = [];
    const endOfSpaceZ = -120;
    const cameraEndZ = endOfSpaceZ + 12;
    const narrowViewport = window.innerWidth <= 700;
    const ambientParticleCount = reduceMotion.matches
        ? (narrowViewport ? 900 : 1600)
        : (narrowViewport ? 1800 : 3600);
    const interactionParticleCount = (reduceMotion.matches ? 240 : 1200) * 5;
    const particleVelocities = [];
    const particleLifetimes = [];
    const particleAges = [];
    const particleCapacity = ambientParticleCount + interactionParticleCount;
    let particlePositions;
    let particleAlphas;
    let particleSizes;
    let particleGeometry;
    let particleMaterial;
    let desertParticleMaterial;
    const auroraMaterials = [];
    let starMaterial;
    let shootingStar;
    let shootingStarMaterial;
    let shootingStarStartTime = 0;
    let nextShootingStarTime = 0;
    const shootingStarOrigin = new THREE.Vector3();
    let particleCursor = 0;
    let previousParticleTime = 0;
    let lastParticleEmission = 0;
    let hasPreviousParticlePointer = false;
    let renderer;
    let scene;
    let camera;
    let animationFrame = 0;
    let selectedIndex = -1;
    let selectedCharacterIndex = -1;
    let pinnedCelestialTarget = null;
    let hoveredCharacterIntroduction = null;
    let scrollProgress = 0;
    let pointerDown = null;
    let yawTarget = 0;
    let yawCurrent = 0;
    let pitchTarget = 0;
    let pitchCurrent = 0;
    let currentWorldLabel = "";
    let disposed = false;
    let textureAnisotropy = 1;
    let endLogo;
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
        document.dispatchEvent(new Event("visions:ready"));
    }

    function readAlbumDetails() {
        return fetch(new URL("discography.html", document.baseURI), { signal: AbortSignal.any([abortController.signal, AbortSignal.timeout(20000)]) })
            .then(response => {
                if (!response.ok) throw new Error(`Album information request failed (${response.status}).`);
                return response.text();
            })
            .then(markup => {
                const source = new DOMParser().parseFromString(markup, "text/html");
                const information = new Map();
                source.querySelectorAll("#discography-studio > article").forEach(article => {
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
            const timeout = setTimeout(() => {
                image.onload = image.onerror = null;
                reject(new Error(`Album cover loading timed out: ${imagePath}`));
            }, 20000);
            image.onload = () => {
                clearTimeout(timeout);
                try {
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
                } catch (error) {
                    reject(error);
                }
            };
            image.onerror = () => {
                clearTimeout(timeout);
                reject(new Error(`Could not load album cover: ${imagePath}`));
            };
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
            particlePositions[offset] = (Math.random() - 0.5) * 60;
            particlePositions[offset + 1] = (Math.random() - 0.5) * 40;
            particlePositions[offset + 2] = 3 - Math.random() * (3 - endOfSpaceZ);
            particleAlphas[i] = 0.3 + Math.random() * 0.6;
            particleSizes[i] = 0.018 + Math.random() * 0.045;
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
                    gl_PointSize = clamp(aSize * uPixelScale / max(-viewPosition.z, 0.1), 1.4, 3.5);
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
        // Positions move throughout the journey; the initial bounds become stale.
        particles.frustumCulled = false;
        scene.add(particles);
        sceneObjects.push(particles);
    }

    function desertGroundHeight(x, z) {
        return -3.55
            + Math.sin(x * 0.065 + z * 0.028) * 0.78
            + Math.sin(z * 0.052 - x * 0.021) * 0.48
            + Math.cos(x * 0.13 + z * 0.04) * 0.11;
    }

    function addDesertSurface() {
        const mobile = window.innerWidth <= 700;
        const pointCount = mobile ? 13000 : 30000;
        const positions = new Float32Array(pointCount * 3);
        const colors = new Float32Array(pointCount * 3);
        const sizes = new Float32Array(pointCount);
        for (let i = 0; i < pointCount; i += 1) {
            const x = (Math.random() - 0.5) * 128;
            const z = 12 + Math.random() * 132;
            const offset = i * 3;
            positions[offset] = x;
            positions[offset + 1] = desertGroundHeight(x, z) + (Math.random() - 0.5) * 0.12;
            positions[offset + 2] = z;
            const brightness = 0.62 + Math.random() * 0.38;
            colors[offset] = brightness * 0.88;
            colors[offset + 1] = brightness * 0.92;
            colors[offset + 2] = brightness;
            sizes[i] = 0.055 + Math.random() * 0.105;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
        const material = new THREE.ShaderMaterial({
            uniforms: { uPixelScale: { value: 1 } },
            vertexShader: `
                attribute float aSize;
                uniform float uPixelScale;
                varying vec3 vColor;
                void main() {
                    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
                    vColor = color.rgb;
                    gl_PointSize = clamp(aSize * uPixelScale / max(-viewPosition.z, 1.0), 1.0, 4.0);
                    gl_Position = projectionMatrix * viewPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    float radius = length(gl_PointCoord - vec2(0.5));
                    float alpha = 1.0 - smoothstep(0.25, 0.5, radius);
                    gl_FragColor = vec4(vColor, alpha * 0.9);
                }
            `,
            transparent: true,
            depthWrite: false,
            vertexColors: true,
            toneMapped: false
        });
        const dunes = new THREE.Points(geometry, material);
        desertParticleMaterial = material;
        dunes.frustumCulled = false;
        dunes.userData.isDesertSurface = true;
        scene.add(dunes);
        sceneObjects.push(dunes);
    }

    function addAurora() {
        const curtains = [
            { x: 38, z: 109, width: 32, height: 35, phase: 0.4, speed: 0.074, amplitude: 3.2, strength: 0.34, hue: 0.2 },
            { x: 55, z: 113, width: 32, height: 36, phase: 2.1, speed: 0.087, amplitude: 3.8, strength: 0.3, hue: 0.38 },
            { x: 72, z: 117, width: 32, height: 35, phase: 4.3, speed: 0.068, amplitude: 2.8, strength: 0.25, hue: 0.58 },
            { x: 89, z: 121, width: 32, height: 34, phase: 5.7, speed: 0.081, amplitude: 3.4, strength: 0.2, hue: 0.78 }
        ];
        const positions = [];
        const uvs = [];
        const phases = [];
        const speeds = [];
        const amplitudes = [];
        const strengths = [];
        const hues = [];
        const indices = [];
        const widthSegments = 32;
        const heightSegments = 28;
        let vertexOffset = 0;
        curtains.forEach((curtain, layer) => {
            for (let row = 0; row <= heightSegments; row += 1) {
                const v = row / heightSegments;
                for (let column = 0; column <= widthSegments; column += 1) {
                    const u = column / widthSegments;
                    positions.push(
                        curtain.x + (u - 0.5) * curtain.width,
                        1.5 + layer * 0.4 + v * curtain.height,
                        curtain.z
                    );
                    uvs.push(u, v);
                    phases.push(curtain.phase);
                    speeds.push(curtain.speed);
                    amplitudes.push(curtain.amplitude);
                    strengths.push(curtain.strength);
                    hues.push(curtain.hue);
                    if (row < heightSegments && column < widthSegments) {
                        const a = vertexOffset + row * (widthSegments + 1) + column;
                        const b = a + widthSegments + 1;
                        indices.push(a, a + 1, b, a + 1, b + 1, b);
                    }
                }
            }
            vertexOffset += (widthSegments + 1) * (heightSegments + 1);
        });

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setAttribute("aPhase", new THREE.Float32BufferAttribute(phases, 1));
        geometry.setAttribute("aSpeed", new THREE.Float32BufferAttribute(speeds, 1));
        geometry.setAttribute("aAmplitude", new THREE.Float32BufferAttribute(amplitudes, 1));
        geometry.setAttribute("aStrength", new THREE.Float32BufferAttribute(strengths, 1));
        geometry.setAttribute("aHue", new THREE.Float32BufferAttribute(hues, 1));
        geometry.setIndex(indices);

        const material = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 } },
            vertexShader: `
                uniform float uTime;
                attribute float aPhase;
                attribute float aSpeed;
                attribute float aAmplitude;
                attribute float aStrength;
                attribute float aHue;
                varying vec2 vUv;
                varying float vPhase;
                varying float vSpeed;
                varying float vStrength;
                varying float vHue;
                void main() {
                    float height = uv.y;
                    float phase = uTime * aSpeed + aPhase;
                    float sway = sin(height * 4.4 + uv.x * 2.6 + phase) * aAmplitude
                        + sin(height * 7.1 - uv.x * 2.1 + phase * 0.68 + aPhase) * aAmplitude * 0.42;
                    vec3 displaced = position;
                    displaced.x += sway * (0.2 + height * 0.8);
                    displaced.z += sin(height * 4.2 + uv.x * 2.3 + phase * 0.72) * 1.7 * height;
                    displaced.y += sin(uv.x * 3.2 + height * 4.7 + phase * 0.55) * 0.7;
                    vUv = uv;
                    vPhase = aPhase;
                    vSpeed = aSpeed;
                    vStrength = aStrength;
                    vHue = aHue;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                varying vec2 vUv;
                varying float vPhase;
                varying float vSpeed;
                varying float vStrength;
                varying float vHue;
                void main() {
                    float wave = sin(vUv.y * 4.1 + vPhase + uTime * vSpeed * 1.3) * 0.17
                        + sin(vUv.y * 7.3 - vPhase * 0.7 + uTime * vSpeed * 0.8) * 0.065;
                    float center = 0.5 + wave;
                    float width = 0.23 + 0.02 * sin(vUv.y * 3.8 + vPhase + uTime * vSpeed * 0.7);
                    float distanceFromCenter = abs(vUv.x - center);
                    float curtain = 1.0 - smoothstep(width * 0.52, width, distanceFromCenter);
                    float core = exp(-pow(distanceFromCenter / (width * 0.42), 2.0));
                    float folds = 0.84 + 0.16 * sin(vUv.x * 12.56
                        + sin(vUv.y * 4.6 - uTime * vSpeed * 0.9 + vPhase) * 0.9
                        + uTime * vSpeed * 0.6 + vPhase);
                    float horizontalFade = smoothstep(0.0, 0.08, vUv.x)
                        * (1.0 - smoothstep(0.92, 1.0, vUv.x));
                    float lowerFade = smoothstep(0.0, 0.09, vUv.y);
                    float upperFade = 1.0 - smoothstep(0.88, 1.0, vUv.y);
                    float alpha = horizontalFade * curtain * (0.68 + core * 0.32)
                        * folds * lowerFade * upperFade * vStrength;

                    float hueDrift = sin(uTime * vSpeed * 0.42 + vPhase + vUv.y * 0.8
                        + vUv.x * 1.1) * 0.12;
                    float hue = clamp(vHue + hueDrift + (vUv.x - 0.5) * 0.18, 0.0, 1.0);
                    vec3 emerald = vec3(0.035, 0.7, 0.3);
                    vec3 cyan = vec3(0.04, 0.62, 0.78);
                    vec3 blue = vec3(0.25, 0.42, 0.86);
                    vec3 violet = vec3(0.48, 0.27, 0.68);
                    vec3 color = mix(emerald, cyan, smoothstep(0.12, 0.52, hue));
                    color = mix(color, blue, smoothstep(0.42, 0.72, hue) * 0.66);
                    color = mix(color, violet, smoothstep(0.68, 0.96, hue) * 0.62);
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false,
            toneMapped: false
        });
        const curtain = new THREE.Mesh(geometry, material);
        curtain.frustumCulled = false;
        scene.add(curtain);
        sceneObjects.push(curtain);
        auroraMaterials.push(material);
    }

    function addDesertStars() {
        const count = 24;
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const alphas = new Float32Array(count);
        const phases = new Float32Array(count);
        for (let i = 0; i < count; i += 1) {
            const offset = i * 3;
            positions[offset] = -20 - Math.random() * 38;
            positions[offset + 1] = 27 + Math.random() * 30;
            positions[offset + 2] = 112 + Math.random() * 31;
            sizes[i] = 0.18 + Math.random() * 0.22;
            alphas[i] = 0.12 + Math.random() * 0.16;
            phases[i] = Math.random() * Math.PI * 2;
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
        geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
        starMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uPixelScale: { value: 1 }
            },
            vertexShader: `
                attribute float aSize;
                attribute float aAlpha;
                attribute float aPhase;
                uniform float uTime;
                uniform float uPixelScale;
                varying float vAlpha;
                void main() {
                    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
                    vAlpha = aAlpha * (0.82 + 0.18 * sin(uTime * 0.18 + aPhase));
                    gl_PointSize = clamp(aSize * uPixelScale / max(-viewPosition.z, 1.0), 1.0, 2.2);
                    gl_Position = projectionMatrix * viewPosition;
                }
            `,
            fragmentShader: `
                varying float vAlpha;
                void main() {
                    float radius = length(gl_PointCoord - vec2(0.5));
                    float glow = 1.0 - smoothstep(0.18, 0.5, radius);
                    gl_FragColor = vec4(vec3(0.68, 0.78, 0.96), vAlpha * glow);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false,
            toneMapped: false
        });
        const stars = new THREE.Points(geometry, starMaterial);
        scene.add(stars);
        sceneObjects.push(stars);

        const glowCanvas = document.createElement("canvas");
        glowCanvas.width = 48;
        glowCanvas.height = 48;
        const context = glowCanvas.getContext("2d");
        if (!context) {
            console.error("VISIONS could not prepare the shooting-star texture.");
            return;
        }
        const glow = context.createRadialGradient(24, 24, 0, 24, 24, 24);
        glow.addColorStop(0, "rgba(255, 255, 255, .95)");
        glow.addColorStop(0.2, "rgba(210, 230, 255, .5)");
        glow.addColorStop(1, "rgba(170, 200, 255, 0)");
        context.fillStyle = glow;
        context.fillRect(0, 0, 48, 48);
        const texture = new THREE.CanvasTexture(glowCanvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        desertTextures.push(texture);
        shootingStarMaterial = new THREE.SpriteMaterial({
            map: texture,
            color: 0xddeaff,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fog: false,
            toneMapped: false
        });
        shootingStar = new THREE.Sprite(shootingStarMaterial);
        shootingStar.scale.set(0.72, 0.72, 1);
        shootingStar.visible = false;
        scene.add(shootingStar);
        sceneObjects.push(shootingStar);
        nextShootingStarTime = performance.now() + 9000 + Math.random() * 9000;
    }

    function updateDesertSky(time) {
        const skyTime = reduceMotion.matches ? 0 : time * 0.001;
        auroraMaterials.forEach(material => {
            material.uniforms.uTime.value = skyTime;
        });
        if (starMaterial) starMaterial.uniforms.uTime.value = skyTime;
        if (!shootingStar || reduceMotion.matches) return;

        if (!shootingStar.visible) {
            if (time < nextShootingStarTime) return;
            shootingStarStartTime = time;
            shootingStarOrigin.set(
                -22 - Math.random() * 24,
                34 + Math.random() * 17,
                116 + Math.random() * 20
            );
            shootingStar.position.copy(shootingStarOrigin);
            shootingStar.visible = true;
        }

        const progress = (time - shootingStarStartTime) / 1350;
        if (progress >= 1) {
            shootingStar.visible = false;
            shootingStarMaterial.opacity = 0;
            nextShootingStarTime = time + 12000 + Math.random() * 16000;
            return;
        }
        shootingStar.position.set(
            shootingStarOrigin.x - progress * 3.2,
            shootingStarOrigin.y - progress * 1.5,
            shootingStarOrigin.z + progress * 2.5
        );
        shootingStarMaterial.opacity = Math.sin(progress * Math.PI) * 0.55;
    }

    function addDesertCharacters() {
        const loader = new THREE.TextureLoader();
        desertCharacters.forEach((character, characterIndex) => {
            loader.load(character.image, texture => {
                if (disposed || !scene) {
                    texture.dispose();
                    return;
                }
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.anisotropy = textureAnisotropy;
                texture.needsUpdate = true;
                desertTextures.push(texture);
                const image = texture.image;
                const height = character.height;
                const width = height * image.naturalWidth / image.naturalHeight;
                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    color: 0xffffff,
                    transparent: true,
                    alphaTest: 0.015,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                    fog: false,
                    toneMapped: false
                });
                const sprite = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
                sprite.position.set(
                    character.x,
                    desertGroundHeight(character.x, character.z) + height * 0.4,
                    character.z
                );
                sprite.userData.characterIndex = characterIndex;
                sprite.userData.baseScale = 1;
                scene.add(sprite);
                sceneObjects.push(sprite);
                desertSprites[characterIndex] = sprite;
            }, undefined, error => {
                console.error(`VISIONS could not load "${character.image}".`, error);
            });
        });
    }

    function addDesertMoon() {
        const image = new Image();
        image.onload = () => {
            if (disposed || !scene) return;
            const side = Math.min(image.naturalWidth, image.naturalHeight);
            const size = Math.min(1024, side);
            const canvasArtwork = document.createElement("canvas");
            canvasArtwork.width = size;
            canvasArtwork.height = size;
            const context = canvasArtwork.getContext("2d");
            if (!context) {
                console.error("VISIONS could not prepare the desert moon artwork.");
                return;
            }
            const sourceX = (image.naturalWidth - side) / 2;
            const sourceY = (image.naturalHeight - side) / 2;
            context.filter = "brightness(1.65)";
            context.drawImage(image, sourceX, sourceY, side, side, 0, 0, size, size);
            context.filter = "none";
            context.globalCompositeOperation = "screen";
            context.fillStyle = "rgba(185, 202, 235, .3)";
            context.fillRect(0, 0, size, size);
            const texture = new THREE.CanvasTexture(canvasArtwork);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = textureAnisotropy;
            desertTextures.push(texture);
            const moon = new THREE.Mesh(
                new THREE.CircleGeometry(8.5, 64),
                new THREE.MeshBasicMaterial({
                    map: texture,
                    color: 0xffffff,
                    fog: false,
                    toneMapped: false
                })
            );
            moon.position.set(0, 15, 137);
            moon.userData.isBillboard = true;
            moon.userData.isCelestialTarget = true;
            moon.userData.characterIntroduction = celestialCharacterIntroductions.metalShogun;
            scene.add(moon);
            sceneObjects.push(moon);
            celestialTargets.push(moon);

            const glowCanvas = document.createElement("canvas");
            glowCanvas.width = 256;
            glowCanvas.height = 256;
            const glowContext = glowCanvas.getContext("2d");
            if (!glowContext) return;
            const glow = glowContext.createRadialGradient(128, 128, 18, 128, 128, 128);
            glow.addColorStop(0, "rgba(224, 234, 255, .8)");
            glow.addColorStop(1, "rgba(153, 175, 215, 0)");
            glowContext.fillStyle = glow;
            glowContext.fillRect(0, 0, 256, 256);
            const glowTexture = new THREE.CanvasTexture(glowCanvas);
            desertTextures.push(glowTexture);
            const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: glowTexture,
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthWrite: false,
                fog: false,
                toneMapped: false
            }));
            glowSprite.position.set(0, 15, 137.5);
            glowSprite.scale.set(34, 34, 1);
            scene.add(glowSprite);
            sceneObjects.push(glowSprite);
        };
        image.onerror = error => {
            console.error("VISIONS could not load the desert moon artwork profile-artwork.JPG.", error);
        };
        image.src = "profile-artwork.JPG";
    }

    function addCreatorStar() {
        const image = new Image();
        image.onload = () => {
            if (disposed || !scene) return;
            const side = Math.min(image.naturalWidth, image.naturalHeight);
            const size = Math.min(512, side);
            const artwork = document.createElement("canvas");
            artwork.width = size;
            artwork.height = size;
            const context = artwork.getContext("2d");
            if (!context) {
                console.error("VISIONS could not prepare the Creator star artwork.");
                return;
            }
            context.drawImage(
                image,
                (image.naturalWidth - side) / 2,
                (image.naturalHeight - side) / 2,
                side,
                side,
                0,
                0,
                size,
                size
            );
            const texture = new THREE.CanvasTexture(artwork);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = textureAnisotropy;
            desertTextures.push(texture);
            const star = new THREE.Mesh(
                new THREE.CircleGeometry(2.7, 64),
                new THREE.MeshBasicMaterial({
                    map: texture,
                    color: 0xffffff,
                    fog: false,
                    toneMapped: false
                })
            );
            const creatorStarPosition = new THREE.Vector3(-105, 33, 158);
            star.position.copy(creatorStarPosition);
            star.userData.isBillboard = true;
            star.userData.isCelestialTarget = true;
            star.userData.characterIntroduction = celestialCharacterIntroductions.creator;
            scene.add(star);
            sceneObjects.push(star);
            celestialTargets.push(star);

            const glowCanvas = document.createElement("canvas");
            glowCanvas.width = 128;
            glowCanvas.height = 128;
            const glowContext = glowCanvas.getContext("2d");
            if (!glowContext) {
                console.error("VISIONS could not prepare the Creator star glow.");
                return;
            }
            const glow = glowContext.createRadialGradient(64, 64, 8, 64, 64, 64);
            glow.addColorStop(0, "rgba(220, 231, 255, .4)");
            glow.addColorStop(1, "rgba(153, 175, 215, 0)");
            glowContext.fillStyle = glow;
            glowContext.fillRect(0, 0, 128, 128);
            const glowTexture = new THREE.CanvasTexture(glowCanvas);
            glowTexture.colorSpace = THREE.SRGBColorSpace;
            desertTextures.push(glowTexture);
            const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: glowTexture,
                blending: THREE.AdditiveBlending,
                transparent: true,
                opacity: 0.7,
                depthWrite: false,
                fog: false,
                toneMapped: false
            }));
            glowSprite.position.set(creatorStarPosition.x, creatorStarPosition.y, creatorStarPosition.z + 0.5);
            glowSprite.scale.set(8, 8, 1);
            scene.add(glowSprite);
            sceneObjects.push(glowSprite);
        };
        image.onerror = error => {
            console.error("VISIONS could not load the Creator star artwork Creator.PNG.", error);
        };
        image.src = "Creator.PNG";
    }

    function updateWorldLabel() {
        camera.getWorldDirection(cameraLookCurrent);
        const label = cameraLookCurrent.z >= 0.55 ? "NIGHT DESERT" : "ALBUM SPACE";
        if (label !== currentWorldLabel) {
            currentWorldLabel = label;
            worldLabel.textContent = label;
        }
    }

    function emitPointerParticles(position, movement, now, burst = false) {
        if (!burst && now - lastParticleEmission < 16) return;
        lastParticleEmission = now;

        const distance = movement.length();
        const direction = distance > 0 ? movement.clone().multiplyScalar(1 / distance) : new THREE.Vector3();
        const count = (burst ? 320 : 20) * 5
            * (reduceMotion.matches ? 0.4 : 1);
        for (let i = 0; i < count; i += 1) {
            const index = ambientParticleCount + particleCursor;
            particleCursor = (particleCursor + 1) % interactionParticleCount;

            const offset = index * 3;
            const trailDistance = Math.random() * Math.min(distance, 0.42);
            const angle = Math.random() * Math.PI * 2;
            const spread = Math.sqrt(Math.random()) * (burst ? 0.16 : 0.07);
            particlePositions[offset] = position.x - direction.x * trailDistance + Math.cos(angle) * spread;
            particlePositions[offset + 1] = position.y - direction.y * trailDistance + Math.sin(angle) * spread;
            particlePositions[offset + 2] = position.z - direction.z * trailDistance + (Math.random() - 0.5) * 0.12;
            particleAges[index] = 0;
            particleLifetimes[index] = 0.9 + Math.random() * 0.9;
            particleAlphas[index] = 0.58 + Math.random() * 0.3;
            particleSizes[index] = 0.009 + Math.random() * 0.016;
            const speed = (burst ? 0.25 : 0.08) + Math.random() * (burst ? 1.1 : 0.35);
            particleVelocities[index].set(
                Math.cos(angle) * speed - direction.x * 0.12,
                Math.sin(angle) * speed - direction.y * 0.12,
                (Math.random() - 0.5) * speed
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
                particleAlphas[i] = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(time * 0.0007 + i * 2.399));
            }
            if (!reduceMotion.matches) {
                particlePositions[offset] += velocity.x * delta;
                particlePositions[offset + 1] += velocity.y * delta;
                particlePositions[offset + 2] += velocity.z * delta;
            }
            if (particlePositions[offset + 2] > camera.position.z + 8) {
                particlePositions[offset] = (Math.random() - 0.5) * 60;
                particlePositions[offset + 1] = (Math.random() - 0.5) * 40;
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
        particleGeometry.attributes.aSize.needsUpdate = true;
    }

    function addEndLogo() {
        makeTexture("EMJ-logo1.png").then(texture => {
            if (disposed || !scene) {
                texture.dispose();
                return;
            }

            const logo = new THREE.Mesh(
                new THREE.SphereGeometry(4.4, 64, 48),
                new THREE.ShaderMaterial({
                    uniforms: {
                        uLogo: { value: texture },
                        uAspect: { value: texture.image.width / texture.image.height }
                    },
                    vertexShader: `
                        varying vec3 vSurface;
                        varying vec3 vNormal;
                        varying vec3 vView;
                        void main() {
                            vSurface = normalize(position);
                            vNormal = normalize(normalMatrix * normal);
                            vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
                            vView = -viewPosition.xyz;
                            gl_Position = projectionMatrix * viewPosition;
                        }
                    `,
                    fragmentShader: `
                        uniform sampler2D uLogo;
                        uniform float uAspect;
                        varying vec3 vSurface;
                        varying vec3 vNormal;
                        varying vec3 vView;
                        void main() {
                            vec3 surface = normalize(vSurface);
                            // Wrap the complete artwork around the front of the globe.
                            vec2 logoUV = vec2(
                                atan(surface.x, surface.z) / 2.8 + 0.5,
                                asin(clamp(surface.y, -1.0, 1.0)) * uAspect / 2.8 + 0.5
                            );
                            vec4 artwork = texture2D(uLogo, clamp(logoUV, 0.0, 1.0));
                            float mask = step(0.0, logoUV.x) * step(logoUV.x, 1.0)
                                * step(0.0, logoUV.y) * step(logoUV.y, 1.0);
                            vec3 normal = normalize(vNormal);
                            vec3 view = normalize(vView);
                            vec3 light = normalize(vec3(-0.65, 0.8, 1.2));
                            float diffuse = max(dot(normal, light), 0.0);
                            float rim = pow(1.0 - max(dot(normal, view), 0.0), 3.0);
                            float specular = pow(max(dot(normal, normalize(light + view)), 0.0), 48.0);
                            vec3 base = vec3(0.018, 0.027, 0.043);
                            base = mix(base, artwork.rgb, artwork.a * mask);
                            vec3 color = base * (0.3 + 0.85 * diffuse)
                                + vec3(0.24, 0.38, 0.52) * rim
                                + vec3(0.25) * specular;
                            gl_FragColor = vec4(color, 1.0);
                            #include <tonemapping_fragment>
                            #include <colorspace_fragment>
                        }
                    `
                })
            );
            logo.position.z = endOfSpaceZ;
            scene.add(logo);
            sceneObjects.push(logo);
            endLogo = logo;
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
        const nightDesert = Math.cos(yawCurrent) <= -0.55;
        const travelDistance = Math.abs(cameraEndZ - 2) * scrollProgress;
        cameraTarget.set(
            Math.sin(scrollProgress * Math.PI * 4) * (window.innerWidth <= 700 ? 0.35 : 0.78),
            0.12 + Math.sin(scrollProgress * Math.PI * 2) * 0.14,
            2 + (nightDesert ? travelDistance : -travelDistance)
        );
        if (selectedIndex >= 0 && cubes[selectedIndex]) {
            const selected = cubes[selectedIndex];
            cameraTarget.set(selected.position.x * 0.55, selected.position.y * 0.25, selected.position.z + 7.5);
        }

        const easing = reduceMotion.matches ? 1 : 0.075;
        camera.position.lerp(cameraTarget, easing);
        yawCurrent += Math.atan2(Math.sin(yawTarget - yawCurrent), Math.cos(yawTarget - yawCurrent)) * easing;
        pitchCurrent += (pitchTarget - pitchCurrent) * easing;
        const horizontalScale = Math.cos(pitchCurrent);
        cameraLookCurrent.set(
            camera.position.x + Math.sin(yawCurrent) * horizontalScale,
            camera.position.y + Math.sin(pitchCurrent),
            camera.position.z - Math.cos(yawCurrent) * horizontalScale
        );
        camera.lookAt(cameraLookCurrent);
        updateWorldLabel();
    }

    function animate(time) {
        if (disposed) return;
        animationFrame = requestAnimationFrame(animate);
        if (!renderer || !scene || !camera) return;
        updateCamera();
        updateParticles(time);
        updateDesertSky(time);
        if (endLogo) {
            endLogo.rotation.y = reduceMotion.matches ? 0 : Math.sin(time * 0.00018) * 0.12;
        }
        sceneObjects.forEach(object => {
            if (object.userData.isBillboard || object.userData.characterIndex !== undefined) {
                object.quaternion.copy(camera.quaternion);
            }
        });
        if (desertSprites.length) {
            desertSprites.forEach((sprite, index) => {
                if (!sprite) return;
                const selected = index === selectedCharacterIndex;
                sprite.material.color.setHex(selected ? 0xe7f0ff : 0xffffff);
                sprite.scale.setScalar(selected ? 1.045 : 1);
            });
        }
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
        updateHoveredCharacterIntroduction(null);
        selectedCharacterIndex = -1;
        characterDetails.hidden = true;
        selectedIndex = selectedIndex === albumIndex ? -1 : albumIndex;
        if (selectedIndex >= 0) {
            yawTarget = 0;
            pitchTarget = 0;
        }
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

    function selectCharacter(characterIndex) {
        const character = desertCharacters[characterIndex];
        if (!character) return;
        updateHoveredCharacterIntroduction(null);
        const switching = !characterDetails.hidden;
        selectedIndex = -1;
        selectedCharacterIndex = characterIndex;
        details.hidden = true;
        showCharacterIntroduction(character);
        if (switching && !reduceMotion.matches) {
            characterDetails.animate(
                [{ opacity: 0.72, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }],
                { duration: 220, easing: "ease-out" }
            );
        }
        updateCurrentAlbumButton();
    }

    function showCharacterIntroduction(character, circularImage = false) {
        characterImage.classList.toggle("is-circular", circularImage);
        characterImage.src = character.image;
        characterTitle.textContent = character.name;
        characterIntroductionJa.textContent = character.introductionJa;
        characterIntroductionEn.textContent = character.introductionEn;
        characterDetails.hidden = false;
    }

    function updateHoveredCharacterIntroduction(character) {
        if (hoveredCharacterIntroduction === character) return;
        hoveredCharacterIntroduction = character;
        if (!character) {
            characterDetails.hidden = true;
            return;
        }
        selectedIndex = -1;
        selectedCharacterIndex = -1;
        details.hidden = true;
        showCharacterIntroduction(character, true);
        updateCurrentAlbumButton();
    }

    createAlbumButtons();
    document.querySelector(".visions-close:not(.visions-character-close)").addEventListener("click", () => {
        selectedIndex = -1;
        details.hidden = true;
        updateCurrentAlbumButton();
    }, { signal: abortController.signal });
    document.querySelector(".visions-character-close").addEventListener("click", () => {
        selectedCharacterIndex = -1;
        characterDetails.hidden = true;
    }, { signal: abortController.signal });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            if (!details.hidden) {
                selectedIndex = -1;
                details.hidden = true;
                updateCurrentAlbumButton();
            }
            if (!characterDetails.hidden) {
                selectedCharacterIndex = -1;
                characterDetails.hidden = true;
            }
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
        })
        .finally(advanceLoadingProgress);

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
        camera = new THREE.PerspectiveCamera(48, 1, 0.1, 300);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth <= 700 ? 1.5 : 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        textureAnisotropy = Math.min(3, renderer.capabilities.getMaxAnisotropy());
        addSpaceDetails();
        addDesertSurface();
        addAurora();
        addDesertStars();
        addDesertCharacters();
        addDesertMoon();
        addCreatorStar();
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
            desertParticleMaterial.uniforms.uPixelScale.value =
                height * renderer.getPixelRatio() / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
            starMaterial.uniforms.uPixelScale.value =
                height * renderer.getPixelRatio() / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
        };
        window.addEventListener("resize", resize, { signal: abortController.signal });
        window.addEventListener("scroll", updateScrollProgress, { passive: true, signal: abortController.signal });
        resize();
        updateScrollProgress();

        let failed = 0;
        const coverRequests = albums.map((album, albumIndex) => makeTexture(album.image)
            .then(texture => createCube(album, albumIndex, texture))
            .catch(error => {
                failed += 1;
                console.error(`VISIONS could not load "${album.title}".`, error);
            })
            .finally(() => {
                advanceLoadingProgress();
            }));
        Promise.all([Promise.all(coverRequests), detailsRequest]).then(() => {
            if (disposed) return;
            loading.hidden = true;
            if (failed === albums.length) {
                showFallback("Album artwork could not be loaded. Check your connection and try again.");
            } else {
                document.dispatchEvent(new Event("visions:ready"));
            }
        });

        // Touch events continue during native scrolling after pointercancel.
        function emitTouchParticles(event, burst) {
            const touch = event.touches[0];
            if (!touch) return;
            const rect = canvas.getBoundingClientRect();
            pointer.set(
                ((touch.clientX - rect.left) / rect.width) * 2 - 1,
                -((touch.clientY - rect.top) / rect.height) * 2 + 1
            );
            raycaster.setFromCamera(pointer, camera);
            raycaster.ray.at(9, particlePointer);
            const movement = hasPreviousParticlePointer && !burst
                ? particlePointer.clone().sub(previousParticlePointer)
                : new THREE.Vector3();
            emitPointerParticles(particlePointer, movement, performance.now(), burst);
            previousParticlePointer.copy(particlePointer);
            hasPreviousParticlePointer = true;
        }
        canvas.addEventListener("touchstart", event => emitTouchParticles(event, true),
            { passive: true, signal: abortController.signal });
        canvas.addEventListener("touchmove", event => emitTouchParticles(event, false),
            { passive: true, signal: abortController.signal });
        for (const type of ["touchend", "touchcancel", "pointerleave"]) {
            canvas.addEventListener(type, () => { hasPreviousParticlePointer = false; },
                { passive: true, signal: abortController.signal });
        }

        const hitTargets = [];
        canvas.addEventListener("pointerdown", event => {
            pointerDown = {
                x: event.clientX,
                y: event.clientY,
                lastX: event.clientX,
                lastY: event.clientY,
                pointerId: event.pointerId,
                pointerType: event.pointerType,
                axis: null
            };
            if (event.pointerType === "touch") return;
            canvas.setPointerCapture(event.pointerId);
            hasPreviousParticlePointer = false;
            const rect = canvas.getBoundingClientRect();
            pointer.set(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );
            raycaster.setFromCamera(pointer, camera);
            raycaster.ray.at(9, particlePointer);
            emitPointerParticles(particlePointer, new THREE.Vector3(), performance.now(), true);
            previousParticlePointer.copy(particlePointer);
            hasPreviousParticlePointer = true;
        }, { signal: abortController.signal });
        canvas.addEventListener("pointerup", event => {
            if (!pointerDown || pointerDown.pointerId !== event.pointerId) return;
            const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 9
                || pointerDown.axis === "look";
            pointerDown = null;
            if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
            canvas.style.cursor = "grab";
            if (moved || !camera) return;
            const rect = canvas.getBoundingClientRect();
            pointer.set(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );
            hitTargets.length = 0;
            desertSprites.forEach(sprite => { if (sprite) hitTargets.push(sprite); });
            cubes.forEach(cube => { if (cube) hitTargets.push(cube); });
            celestialTargets.forEach(target => hitTargets.push(target));
            raycaster.setFromCamera(pointer, camera);
            const hit = raycaster.intersectObjects(hitTargets, false)[0];
            if (hit?.object.userData.characterIndex !== undefined) {
                pinnedCelestialTarget = null;
                updateHoveredCharacterIntroduction(null);
                selectCharacter(hit.object.userData.characterIndex);
            } else if (hit?.object.userData.isCelestialTarget) {
                if (event.pointerType === "touch") {
                    const isPinned = pinnedCelestialTarget === hit.object;
                    pinnedCelestialTarget = isPinned ? null : hit.object;
                    updateHoveredCharacterIntroduction(
                        isPinned ? null : hit.object.userData.characterIntroduction || null
                    );
                }
            } else if (hit) {
                pinnedCelestialTarget = null;
                selectAlbum(hit.object.userData.albumIndex, albumInformation);
            } else if (event.pointerType === "touch") {
                pinnedCelestialTarget = null;
                updateHoveredCharacterIntroduction(null);
            }
        }, { signal: abortController.signal });
        canvas.addEventListener("pointercancel", () => { pointerDown = null; }, { signal: abortController.signal });
        canvas.addEventListener("pointermove", event => {
            if (pointerDown && pointerDown.pointerId === event.pointerId) {
                const deltaX = event.clientX - pointerDown.lastX;
                const deltaY = event.clientY - pointerDown.lastY;
                const totalX = event.clientX - pointerDown.x;
                const totalY = event.clientY - pointerDown.y;
                if (!pointerDown.axis && Math.hypot(totalX, totalY) > 8) {
                    if (pointerDown.pointerType === "touch") {
                        pointerDown.axis = Math.abs(totalX) > Math.abs(totalY) * 1.1 ? "look" : "scroll";
                    } else {
                        pointerDown.axis = "look";
                    }
                }
                if (pointerDown.axis === "look") {
                    yawTarget = Math.atan2(
                        Math.sin(yawTarget - deltaX * 0.004),
                        Math.cos(yawTarget - deltaX * 0.004)
                    );
                    pitchTarget = THREE.MathUtils.clamp(pitchTarget - deltaY * 0.003, -0.78, 0.78);
                    updateHoveredCharacterIntroduction(null);
                    canvas.style.cursor = "grabbing";
                }
                pointerDown.lastX = event.clientX;
                pointerDown.lastY = event.clientY;
            }
            if (event.pointerType !== "touch") {
                const rect = canvas.getBoundingClientRect();
                pointer.set(
                    ((event.clientX - rect.left) / rect.width) * 2 - 1,
                    -((event.clientY - rect.top) / rect.height) * 2 + 1
                );
                raycaster.setFromCamera(pointer, camera);
                raycaster.ray.at(9, particlePointer);
                if (hasPreviousParticlePointer) {
                    const movement = particlePointer.clone().sub(previousParticlePointer);
                    if (movement.length() > 0.025) {
                        emitPointerParticles(particlePointer, movement, performance.now());
                    }
                }
                previousParticlePointer.copy(particlePointer);
                hasPreviousParticlePointer = true;
            }
            const rect = canvas.getBoundingClientRect();
            pointer.set(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );
            const hoverTargets = [...desertSprites.filter(Boolean), ...cubes.filter(Boolean)];
            celestialTargets.forEach(target => hoverTargets.push(target));
            raycaster.setFromCamera(pointer, camera);
            if (!pointerDown) {
                const hoveredObject = raycaster.intersectObjects(hoverTargets, false)[0]?.object;
                if (event.pointerType !== "touch") {
                    updateHoveredCharacterIntroduction(hoveredObject?.userData.characterIntroduction || null);
                }
                canvas.style.cursor = hoveredObject ? "pointer" : "grab";
            }
        }, { signal: abortController.signal });
        canvas.addEventListener("pointerleave", event => {
            if (event.pointerType !== "touch") {
                updateHoveredCharacterIntroduction(null);
            }
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
        desertTextures.forEach(texture => texture.dispose());
        renderer?.dispose();
    }, { once: true });
})();
