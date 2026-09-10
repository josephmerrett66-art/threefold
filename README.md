# Threefold

A playable first prototype for a godlike civilisation-building sandbox. Starts with three named founders in an isometric valley of woodland, river meadow and upland rock.

## Run locally

Serve `dist/` with any static HTTP server; no installation or build is required. For example, `python3 -m http.server 4173 --directory dist`, then open http://localhost:4173.

## Play

Select a building and click an empty patch of land. Settlers reserve materials, walk to work sites, and construct it. Resources are carried back to the starting clearing or a nearby storehouse. Gardens renew food; homes improve rest; wells shorten water trips; workshops increase gathering yields. A spare housing place plus at least 24 food attracts a settler after 90 seconds of simulation time. Arrivals consume eight food.

The settlement consumes what it gathers. Hearths burn timber every day in proportion to the people and roofs they warm, so the woodpile is a buffer against demand rather than a number to fill once. Buildings wear down and settlers repair them, at a cost in materials, when condition falls below 62%. If the timber runs out the fires go out: spirits fall faster and resting by the campfire barely helps.

Each settler is a particular person. Alda grows, Bram forests, Mira builds; later arrivals bring their own trade. Everyone walks at their own pace, starts ahead in their own craft, and gets better at whatever they actually do. Open a settler to see their trade, their spirits, and how far their skills have come. When there is no pressing work they go and sit at the fire together, and lasting acquaintances are recorded in the chronicle.

The valley is 160 x 160 tiles and has opinions about what you can do where. An upland massif fills the north-west: hard going underfoot, thin soil, and where stone is plentiful. Two watercourses run south through lowland meadow and oak woodland, and the ground beside them carries the richest soil. Pine grows on the tops, broadleaf on good soil, berries on dry ground, and boulders turn up in the lowlands only occasionally. A garden yields in proportion to the soil under it, so where you put one matters as much as whether you build it. Click any patch of ground to read its soil and height, and the hint bar names the soil under the cursor while you site a garden.

Use the Clear tool to mark trees, rock or scrub for felling. A settler fells it, carries everything standing there home, and leaves bare ground you can build on. Woodland can only be worked from its edge, so clearing a dense stand takes several passes inward. Away from buildings and paths, the forest slowly grows back.

Drag to pan, scroll or use +/− to zoom, WASD/arrows to pan, Home to return, Space to pause, 1–7 to choose tools, Escape to observe. Click people or buildings to inspect. Draw free paths by dragging in Path mode, and mark ground by dragging in Clear mode; right-drag to pan in either. Touch supports drag and pinch.

Automatic local saves run every 30 seconds. Save writes a separate checkpoint; Load restores it. Saves belong to the current browser and origin. The local preview and hosted site have separate saves.

## Scope

- 160 x 160 tile valley of upland rock, scree, river meadow and woodland; three founders, growing as far as your housing allows.
- Autonomous needs, resource collection/delivery, construction, rest, hydration, agriculture, socialising, and arrivals.
- Ongoing consumption: hearth fuel, meals, and building upkeep, so a finished settlement still has work to do.
- Terrain that matters: soil quality drives garden yield, high ground slows travel, and stone belongs to the hills.
- Distinct settlers: per-person trade, walking pace, morale, and skills that improve with practice.
- Seven construction tools including land clearing, work priorities, inspection, chronicle, minimap, camera, time controls, and local persistence.
- Original raster building and foliage sprites, textured grass and curved riverbanks, blue-accented animated settlers, and a classic parchment command interface. The sprite atlas is in `dist/assets/retro-atlas.png`.
- No combat, generations, cultural progression, building demolition, or multiple maps yet. Hunger slows movement; nobody dies. The founding campfire is a starting landmark.
- Desktop is the primary play surface. Touch layouts retain construction and camera controls; the detailed settlement sidebar is hidden on narrow screens.
- No external runtime dependencies or web fonts.

## Code

`dist/simulation.mjs` is the deterministic world and simulation. `dist/renderer.mjs` draws the world with Canvas 2D. `dist/game.mjs` connects the interface and input. `dist/agent-tools.mjs` optionally exposes the same game actions through WebMCP.

Run `node tests/simulation.test.mjs` for the simulation checks.

Saves from earlier builds cannot be read. The save version rises whenever the world itself changes, so an old valley is never loaded into a new map; an incompatible autosave is discarded quietly on startup.

Validation: JavaScript syntax and simulation tests cover construction, delivered resources, every building type, growth, renewable food, save/load continuity, cancellation refunds, work priorities, paths, hearth consumption, disrepair and repair, the absence of idle settlers in a settled valley, founder traits and learned skill, and land clearing and regrowth. Native canvas checks verified all six atlas sprites, construction icons, scene rendering, camera coordinate round trips, and cursor-anchored zoom. Browser UI testing was not requested and has not been performed. A live supported WebMCP context was unavailable, so that optional integration has not been verified in a browser.
