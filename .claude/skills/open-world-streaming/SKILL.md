---
name: open-world-streaming
version: 1.3.0
tier: optional
description: Big worlds in Game Engine — cells streamed around the player with @gameengine/stream (defineStreaming, StreamFocus, StreamCell, Dormant), saved changes per cell, the floating origin, SpatialHash, and how systems must treat far or unloaded content. Use for any level larger than a screen or two, or anything with "open world", "chunks", "regions" or "LOD".
---

# Open worlds: streaming, dormancy, floating origin

## Streaming or a scene switch

| Use | When |
|---|---|
| **Streaming cells** (this skill) | One continuous space the player walks through: no cut, no loading screen; cells load and unload around `StreamFocus` while play goes on. |
| **`scenes.enter` behind `loading.run`** (skill `asset-memory`) | Separate places: levels, a town → a dungeon, menus → play. The sim holds under the cover while groups load, then swaps the whole scene. |

Both combine: each area is a scene entered behind a loading screen; inside it, cells stream.
Put the area's shared art in its asset group and let cells stream the rest. Streaming state
(`stream:cell:*` documents) is world state and survives a switch like every document.

## Layout

- The world is a grid of square **cells**; each cell is a scene (`scenes/cells/<x>_<y>.scene.json`)
  authored in **absolute** coordinates. Generate or edit them like any scene; keep entity ids
  unique per cell (prefix with the cell).
- Put `StreamFocus` on the player (and anything else that must keep its surroundings loaded).

```ts
import { defineStreaming } from '@gameengine/stream';

export const streaming = defineStreaming({
  cellSize: 12,
  loadRadius: 1,        // rings of cells kept loaded around each focus
  activeRadius: 1,      // rings that simulate; the rest are tagged Dormant
  unloadMargin: 1,      // hysteresis: no thrashing at a border
  cellPath: (x, y) => (inWorld(x, y) ? `scenes/cells/${x}_${y}.scene.json` : null),
  rebaseDistance: 24,   // floating origin (optional)
});
export const Streaming = streaming.system;   // export it like any system (runs in PostUpdate)
```

`cellSize` must be positive and the radii/margin whole numbers of cells, or `defineStreaming` throws.

## Rules for gameplay systems

- **Skip far things:** query `without(Dormant)` in anything that costs per entity (AI, animation,
  pickups). Dormant entities keep their state and wake when you come back.
- **Never hold entity ids across frames for streamed content** — cells unload. Keep GUIDs
  (`SceneEntity.guid`) or cell-relative ids in documents instead.
- **Runtime spawns that belong to a place** (a dropped item) get `StreamCell { cell: 'x,y' }`, so
  they unload and come back with that cell. Anything without it stays loaded forever.
- **Coordinates:** with a floating origin, `LocalTransform` of root entities is relative to
  `streaming.origin()`. Store absolute positions (targets, waypoints, quest markers) and convert
  with `streaming.toLocal(p)` / `streaming.toWorld(p)`. Taps arrive in local coordinates.
- **Rebasing happens at the end of a step** (Streaming runs in PostUpdate) and moves `WorldView`
  with everything else, so within a step every position and this step's taps share one origin:
  `streaming.toWorld(tap.world)` is right even on the step the origin moves.
- **Camera:** follow with the `WorldView` resource (`center` = the player's local position).
- **Loading is ahead of you:** in cooked builds the engine reads the cells around the start
  before the first frame and, each time the player enters another cell, the next ring on the IO
  thread, so a cell load never waits on storage. Enter a streamed world from another scene with
  a loading screen whose `load` groups hold the world's scene
  (`loading.run({ load: ['world'], swap: 'scenes/world.scene.json' })`): under the cover it reads
  the cells around that scene's player and swaps once they are in. A cell that is read on the spot
  (the player outran the reads, or `scenes.enter` without a cover) logs `cell scene '…' read from
  storage on the frame thread` and fails `gameengine check`'s smoke run: raise `loadRadius` rather
  than making cells heavy. `streaming.readAhead()` counts those misses (tests, profiling).

## Saves

A cell that changed while loaded (coin picked up, door opened, crate moved) is saved whole
into its own world document `stream:cell:<key>` when it unloads, and loads from there next time;
unchanged cells reload from their scene. That document is part of the world, so save slots
and replays carry it. Float noise under 0.001 does not count as a change.

## Nearby queries

```ts
const near = new SpatialHash(4);             // @gameengine/runtime; rebuild each step
for (...) near.insert(entity, x, y);
near.near(px, py, 3);                        // nearest first, deterministic
```

## Test it

```ts
worldTest('the coin stays taken', async ({ world, step }) => {
  // walk away until its cell unloads, walk back, count coins in that cell
});
```

Assert on `streaming.loaded()`, `Dormant` on far entities, `savedCells()` from `@gameengine/stream` (only changed
cells), and `streaming.toWorld(local)` after rebasing. Sample: `samples/open-world`.
