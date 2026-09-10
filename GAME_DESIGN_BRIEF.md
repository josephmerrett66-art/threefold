# Civilisation sandbox — initial design brief

Status: a starting proposal. The core vision below comes from the founder; the suggested systems and prototype scope are working decisions to refine through play.

## Core vision

Begin with three people in an uninhabited world. Help them establish a home, then grow a civilisation whose layout, livelihood, culture, and relationship with its landscape emerge from the player's choices.

There is no required victory condition, prescribed civilisation, or correct way to live. The reward is watching a place become something recognisably yours: seeing its people use the spaces you designed, following its history, and zooming out to appreciate what three settlers became.

The player is a godlike presence overseeing a living society. Whether that includes literal supernatural powers remains an open design question.

## What the reference games contribute

- Cities: Skylines: settlement planning, infrastructure, interconnected services, and the pleasure of watching a city work.
- Zoo Tycoon and RollerCoaster Tycoon: fine control over place-making, paths, landscaping, and the lived experience of inhabitants.
- Age of Empires: readable people working in the landscape, gathering resources, constructing buildings, and transforming a settlement over time.
- Factorio: the desired sense of material detail, purposeful animation, and tiny workers within a much larger landscape. The proposed projection is explicitly isometric; the reference does not determine the technical camera system.

These are ingredients, not a commitment to reproduce each game's full systems. In particular, warfare, timed objectives, and a linear age ladder are not assumed requirements.

## Essential design pillars

### A place that belongs to you

Ownership should come from authorship and history. Players choose where and how to build, and the resulting settlement retains traces of those decisions. A founding shelter might survive beside a later square; a winding route to the first woodland might become the main street.

Buildings should allow meaningful variation in orientation, materials, adjoining spaces, and eventual expansion. Decorative control should reinforce a functioning settlement rather than become a separate dollhouse mode.

### People make the settlement believable

Citizens visibly gather, carry, construct, eat, rest, and socialise. Materials move through the world rather than appearing magically at destinations. Essential activity should be legible without opening menus.

The founding three should be identifiable individuals. For the prototype, names, occupations, a few needs, and simple personal histories are sufficient. Complex personality simulation is a later possibility, not a prerequisite.

### Different choices produce different societies

Civilisations diverge through repeated practical decisions, not a starting faction selection or a single branching menu. Geography, food production, access to materials, settlement density, public spaces, and investment in knowledge can influence what develops.

The system must avoid quietly making one settlement type best at everything. Benefits need corresponding costs, while several approaches remain viable.

### Detail within a vast world

The close view rewards observation; the distant view reveals settlement structure and the scale of the wilderness. People retain believable proportions against trees, buildings, fields, and terrain. Do not enlarge characters into mascots merely to keep them readable at every zoom level.

At distant zoom, landscape, roofs, paths, smoke, and patterns of activity take over from individual character details.

## The player and the citizens

Suggested division of control:

- The player plans buildings, paths, landscape changes, work priorities, and community investments.
- Citizens choose and perform tasks within those priorities, subject to needs, skills, resources, and travel time.
- The player can inspect a person or building and understand why work is happening or has stopped.

Start with indirect management. Requiring continual individual orders would undermine the pleasure of watching a society live on its own.

## A proposed play loop

1. Observe the landscape and the needs of the three settlers.
2. Choose where to establish shelter, food production, and storage.
3. Lay out work areas and paths, then allocate priorities.
4. Watch people gather, transport, construct, and use the settlement.
5. Respond to the opportunities and constraints created by that layout.
6. Expand, specialise, redesign, or simply enjoy the place.

Growth creates possibilities; it should not be mandatory. A small, comfortable community should remain a satisfying outcome. Time controls and optional pressures can support different play styles, but difficulty modes need not be built in the first prototype.

## How civilisations could diverge

The following are illustrative outcomes, not fixed classes or separate tech trees:

| Repeated choices | Emerging settlement | Useful tradeoff |
| --- | --- | --- |
| Local food, timber, dispersed homes, limited clearing | A woodland society of connected hamlets | Short access to nearby resources, longer service and transport routes |
| Irrigation, grain storage, dense housing, communal works | A river-based agricultural city | Supports concentration, depends on maintaining shared infrastructure |
| Quarrying, workshops, transport routes, specialist labour | A stone-built manufacturing centre | Strong production, substantial material and provisioning demands |
| Modest expansion, gardens, gathering spaces, learning | A small community focused on shared life and knowledge | High investment per inhabitant, slower growth in production capacity |

Trade-led cities could become another direction if other settlements or outside trade are introduced later. They are not assumed in the initial empty-world prototype.

Initially, divergence should be visible in layout, resource use, building materials, and daily activity. Cultural labels and deeper institutions can follow once those underlying differences actually exist in the simulation.

Avoid moral scores. Choices can have consequences for inhabitants without the game declaring one cultural identity the correct answer.

## Art direction

Target: restrained, materially believable pixel art in a top-down isometric world. Realism comes from scale, construction logic, lighting, texture, and motion—not simply adding more pixels.

- **Proportion:** small human figures, substantial trees, believable doors, working spaces, and roof spans. Avoid oversized heads and toy-like silhouettes.
- **Palette:** grounded greens, earth, weathered wood, stone, and restrained accents. Distinguish materials without outlining everything in heavy black.
- **Buildings:** show structural supports, roof edges, joints, entrances, storage, extensions, and signs of occupation. Buildings should look assembled and used.
- **Animation:** purposeful walking, tool use, carrying, staged construction, smoke, foliage movement, and occasional domestic activity. Start with a few excellent actions.
- **Landscape:** coherent terrain and vegetation with irregular edges and natural variation. Empty land must be worth looking at before the player builds anything.
- **Lighting:** consistent light direction and readable shadows. Effects should preserve the pixel-art language.
- **Interface:** quiet overlays and contextual information. Allow players to inspect their civilisation with the interface hidden.

Before commissioning a large asset set, establish a scale sheet containing one person, a doorway, a home, a mature tree, a path, and a work site. Then test the same small scene at close, settlement, and regional zoom.

Technical art questions to resolve through that test: sprite resolution, isometric tile ratio, asset sorting, animation directions, camera zoom filtering, and distant-view detail reduction. Continuous zoom and crisp pixel art can conflict; the camera treatment needs to be judged in motion.

## First playable prototype

Build one beautiful, functioning settlement scene before attempting a full civilisation simulator.

Suggested contents:

- A bounded landscape large enough for the starting camp to feel small.
- Three named settlers with autonomous task execution.
- Pan, zoom, pause, and time-speed controls.
- Wood and food as the initial usable resources.
- A shelter, stockpile, food-growing plot, and a simple shared gathering place.
- Building placement, paths, work priorities, and visible construction progress.
- Gathering, carrying, building, eating, resting, and one social behaviour.
- Simple inspection explaining needs, assigned work, and missing requirements.
- Save and load, so the prototype can become a place the player returns to.

The prototype should support at least two arrangements, such as a compact camp and a dispersed woodland settlement. Travel and access should make them behave differently without rendering either immediately unviable.

Population growth belongs in the next slice once the founding three work convincingly. Births, migration, and the passage of generations need an explicit timescale decision.

Defer combat, diplomacy, elaborate religion, multiple ages, multiplayer, procedural architecture, and world-scale simulation. Each could fit later, but none proves the central experience.

## What success looks like

- Watching the three settlers work is enjoyable without continually issuing commands.
- A player can explain how their layout affected daily life.
- The same starting landscape supports visibly and functionally different settlements.
- At close zoom, construction and activity feel believable rather than cartoonish.
- At distant zoom, the civilisation feels like a small human achievement within a large world.
- Returning to a saved settlement produces recognition and attachment.

## Next decisions

1. Establish the visual target with a representative scene and scale sheet.
2. Decide whether the player has literal divine powers or acts as an unseen settlement planner.
3. Select the development engine after confirming target platform, existing skills, and rendering needs.
4. Build the three-person simulation and test whether watching it is satisfying.
5. Expand only after the visual direction and basic settlement behaviour work together.
