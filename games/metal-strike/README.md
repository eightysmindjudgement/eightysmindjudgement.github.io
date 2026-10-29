# METAL STRIKE

Open metal-strike.html, or select METAL STRIKE on the GAMES page.
Uses the existing site header, navigation, sharing controls, footer and bilingual notes.
No new dependencies or remote assets.

- engine.js: deterministic normalized-position model and centralized tuning constants.
- game.js: Canvas rendering, Pointer Events, focused keyboard controls, results and best-score storage.
- game.css: responsive game layout.
- preview.svg: local vector artwork for the GAMES card.

Controls: click/tap the ball's horizontal position at the near strike line. Move the mouse or use left/right arrows to aim; press Space to strike. Keyboard input is scoped to the focused canvas.

Tests: node scripts/metal-strike.test.cjs (from the site root).
Six model tests cover timing, position, scoring, misses, end conditions, retry, record retention, speed and frame independence.
A mocked Canvas/DOM smoke run also checked desktop/mobile drawing, unavailable localStorage, retry and input handlers. Visual browser and physical touch verification remains required.

Publishing: follow the root AGENTS.md. Copy games.html and games/metal-strike/ into _github_publish_work, inspect the diff, then commit/push only when publication is requested.
