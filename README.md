# Threefold

A playable first prototype for a godlike civilisation-building sandbox. Starts with three named founders in an isometric woodland valley.

## Run locally

Serve `dist/` with any static HTTP server; no installation or build is required. For example, `python3 -m http.server 4173 --directory dist`, then open http://localhost:4173.

## Play

Select a building and click an empty patch of land. Settlers reserve materials, walk to work sites, and construct it. Resources are carried back to the starting clearing or a nearby storehouse. Gardens renew food; homes improve rest; wells shorten water trips; workshops increase gathering yields. A spare housing place plus at least 24 food attracts a settler after 90 seconds of simulation time. Arrivals consume eight food.

Drag to pan, scroll or use +/− to zoom, WASD/arrows to pan, Home to return, Space to pause, 1–6 to choose buildings, Escape to observe. Click people or buildings to inspect. Draw free paths by dragging in Path mode; right-drag to pan in this mode. Touch supports drag and pinch.

Automatic local saves run every 30 seconds. Save writes a separate checkpoint; Load restores it. Saves belong to the current browser and origin. The local preview and hosted site have separate saves.

## Scope

- 76 × 76 tile valley; three founders, up to 12 settlers.
- Autonomous needs, resource collection/delivery, construction, rest, hydration, agriculture, and arrivals.
- Six construction tools, work priorities, inspection, chronicle, minimap, camera, time controls, and local persistence.
- Original raster building and foliage sprites, textured grass and curved riverbanks, blue-accented animated settlers, and a classic parchment command interface. The sprite atlas is in `dist/assets/retro-atlas.png`.
- No combat, generations, cultural progression, structural demolition, or multiple maps yet. Hunger slows movement; nobody dies. The founding campfire is a starting landmark.
- Desktop is the primary play surface. Touch layouts retain construction and camera controls; the detailed settlement sidebar is hidden on narrow screens.
- No external runtime dependencies or web fonts.

## Code

`dist/simulation.mjs` is the deterministic world and simulation. `dist/renderer.mjs` draws the world with Canvas 2D. `dist/game.mjs` connects the interface and input. `dist/agent-tools.mjs` optionally exposes the same game actions through WebMCP.

Run `node tests/simulation.test.mjs` for the simulation checks.

Validation: JavaScript syntax and simulation tests cover construction, delivered resources, every building type, growth, renewable food, save/load continuity, cancellation refunds, work priorities, and paths. Native canvas checks verified all six atlas sprites, construction icons, scene rendering, camera coordinate round trips, and cursor-anchored zoom. Browser UI testing was not requested and has not been performed. A live supported WebMCP context was unavailable, so that optional integration has not been verified in a browser.
