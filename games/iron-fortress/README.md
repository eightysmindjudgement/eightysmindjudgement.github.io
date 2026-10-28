# IRON FORTRESS

Static, original low-poly 3D rail shooter. Open `games.html`, choose IRON FORTRESS with the carousel arrow, and click the card. Both direct HTML opening (`file://`) and HTTP hosting are supported. Keep the game folder and its files together.

- `iron-fortness.html`, `game.css`: PUZZLE-style site shell, sharing, HUD and mobile controls.
- `main.js`: editable game state, input, combat, lifecycle and UI.
- `game.js`: generated classic browser bundle, including local Three.js, for direct HTML opening. After changing any source JavaScript, run `node scripts/build-iron-fortress.cjs` from the site root. No external build dependencies are needed.
- `scene.js`: original procedural models and scene rendering.
- `config.js`: stage timings, weapons, enemy definitions, difficulty and local records.
- `audio.js`: optional synthesized Web Audio effects.
- `preview.jpg`: screenshot of the game for the GAMES card.

Uses the existing local **Three.js r180** files at `../../vendor/three.module.min.js` and `../../vendor/three.core.min.js`, with the existing `THREE-LICENSE.txt`. Keep these two library files on the same version. No CDN, build, account or network service is required.

Drag to move; hold FIRE to shoot. Keyboard: arrows/WASD, Space, Escape. The stage enters the fortress at 36 seconds, the core at 65 seconds, and the boss at 100 seconds. Three lives, 1.6-second damage shield; EASY, NORMAL and HARD have separate best scores stored locally. Sound can be muted.

Browser regression checks: `node scripts/iron-fortress.test.cjs` from the site root with Playwright available. Optional `PLAYWRIGHT_MODULE` and `BROWSER_PATH` environment variables select an existing installation. The test starts its own local HTTP server and injects test hooks into responses only; no test interface is shipped in the game.

Validated in headless Edge with WebGL, including GAMES-to-game navigation and START via direct local HTML opening: stage progression and boss clear using accelerated simulation, shooting/scoring, enemy projectile and obstacle collision, game over, repeated retry, pause, keyboard movement, simultaneous touch movement and shooting, input release, 390px layout, unavailable storage, WebGL failure, GAMES link and existing PUZZLE load. Physical phones, audible sound output and production GitHub Pages hosting have not been tested. Publishing has not been performed.

The start screen lists smartphone and PC movement/shooting controls in Japanese and English. The player ship has an EMJ marking on the rear fuselage face. Web Audio context activation and sound generation after START, and suppression while muted, have been verified in the browser; physical speaker output depends on the device volume and browser settings.

Game entry page: `games/iron-fortress/iron-fortness.html` (filename as requested). The site HOME remains `/index.html`.
