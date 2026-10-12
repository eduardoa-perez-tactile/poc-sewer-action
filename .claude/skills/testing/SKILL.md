---
name: testing
version: 1.11.0
tier: required
description: Writing Game Engine tests — worldTest for logic, replays for recorded play, goldens for rendering, recording pipelines.json, cheats and service mocks to set a test up, and tests on cooked content. Use when adding behaviour or fixing a bug.
---

# Testing

**Logic (T0)**, `tests/*.test.ts`:

```ts
worldTest('tapping a bubble pops it', async ({ world, step, input, tap }) => {
  input.view(1080, 1920, 3);
  await step(40);
  const [bubble] = world.entities(Bubble);
  const [x, y] = world.get(bubble!, LocalTransform).position;
  await tap([x!, y!]);
  await step(2);
  expect(world.resource(Game).score).toBe(1);
});
```

- Drive input the way a player would (`tap`, `swipe`, `input.*`), then `step`. Assert on world state.
- Fix a bug by first writing the test that fails.
- **Set up a state with a cheat** instead of playing to it: `await cheat(AddMoves, { amount: 7 })` runs the cheat as the console would, plus one step (skill `cheats`). `spawnPrefab('prefabs/bomb.prefab.json', overrides)` places a prefab.
- **Services** answer from their schema mocks; script one with `services.mock('iap.purchase', { error: 'E_CANCELLED: …' })`, check `services.calls()`. A service whose plugin the project does not enable answers `E_UNAVAILABLE`, as on a device; `services.mock('push.*', { error: 'E_UNAVAILABLE: …' })` models a build without it (skill `platform-services`).
- **Presentation numbers** are testable too: `quality.targetFps().cap` after a screen caps its frame rate, `render.stats()` and `render.expectDrawCalls(...)` in T1 (`uiModelsRendered` to pin that a still UI model is not re-rendered).
- **Per device**: a `renderTest(…, { memory: 'phone-low' })`, or `gameengine test --memory-class phone-low`, resolves content overrides for that class and enforces its memory budget; `assets.setDeviceClass('phone-low')` inside a test switches the class and re-resolves content (skill `device-tiers`; engine example `samples/orbit-garden/tests/tiers.test.ts`).
- **Replays**: `gameengine test --record-replays --filter "<test>"` writes `tests/replays/<test>.greplay`; `worldTest.replay(path)` checks the whole hash stream. A failing replay names the step where playback left the recording; recorded with `--checkpoint-every 1` it also names the system and components (`gameengine replay verify <file>` adds each system's recorded and playback hash). Checkpoints are off by default: they slow recording and grow replays 10–15×.
- **Same behaviour after a refactor**: `gameengine test --hash-trace .gameengine/base` before the change, `--hash-trace-baseline .gameengine/base` after: a test that left the baseline fails at its first diverging step, with the system and components (skill `determinism`).
- **Goldens (T1)**: `gameengine test --tier t1`; after an intended visual change `--update-goldens` and look at the images (it rewrites only goldens that fail or are missing).
- **UI**: `ui.press('<id>')` is hit-tested like a finger: it fails when the element's centre lands on nothing or on another element drawn over it (a modal, an overlay). `ui.interactables()` lists what takes presses, topmost first. `ui.drag('<id>', dx, dy, steps?)` drags from the element's centre (dragging a `<ScrollView>` row scrolls the list and taps nothing; wait some steps for a fling to settle before tapping a row), and `input.wheel(dx, dy)` scrolls the list under the mouse; `ui.rect` follows the scroll. UI is laid out when a frame renders: call `render.stats()` first in a `renderTest`.
- **Wall clock**: `gameengine.clock.wallNow()` is fixed at `TEST_WALL_MS` (2025-06-15, UTC; `clock.tzOffset()` is 0 and tests run with `TZ=UTC`). Move it with the context's `clock.set(ms)` / `clock.advance(ms)` to test lives regen, timers and day rollover. With `wallClock.feed()` in the game, each move also reaches the sim's `WallClock` resource at the next step (and the test's start time at the first).
- **Saves and backgrounding**: storage starts empty in every test. Write a slot before the first step to start from a save, check writes with `services.calls('storage.write')`, and call `app.background()` for what the game writes when the app goes to the background (persisted meta, skill `meta-economy`). `app.foreground()` sends the return (listeners added with `app.onLifecycle` hear `'foreground'`; persisted meta writes nothing then).
- **Pipeline warm-up** (`pipelines.json`, what devices build while loading): `gameengine test --tier t1 --record-pipelines` plays every `tests/budgets/*.json` budget with a `structural` block and a `replay`, once per GPU tier (desktop, mobile, compat; `--gpu-tier` for one), and **replaces** each tier it records with what that run built (records of changed or removed materials go). So the budget replays together must reach every flow that draws something new: menus and popups, every level type and its effects, win/lose screens, the shop. Record one replay per flow (`--record-replays --filter`) and give each a budget file; re-record after adding a material, effect or screen, and commit `pipelines.json`. A release build refuses a missing, partial or stale file (skill `ship-mobile`). Materials loaded by a group or scene warm themselves either way; the recording adds 2D, particle and post pipelines.
- **Render budgets**: `render.expectDrawCalls('<=', 30, { width: 1080, height: 1920 })`, `render.expectTriangles(...)`, `render.expectPipelines(...)` (default size 360×640), on the mobile GPU tier unless `--gpu-tier`. These check the one frame they render; for the **peak** over a scenario, sample `render.stats()` in a `renderTest` as it plays (`for (let i = 0; i < 20; i++) { await step(15); peak = Math.max(peak, render.stats().drawCalls); }`, then `expect(peak).toBeLessThanOrEqual(30)`).
- **Audio**: `audio.status()` gives bus volumes, voices and the music track, played on an offline mixer from the game's audio events. `audio.sounds()` lists the presentation sounds of the test so far (`audio.play`, Button sounds: `[{ sound, bus, volume }]`); they are not sim events, so `world.events(PlaySound)` never has them. `input.emit(Event, fields)` raises a sim event as a UI `emit` does.
- **Logs**: `console.*` (typed through `@gameengine/test`) from the test body and the game shows under each test in `gameengine test` output (and `logs` in `--json`).
- **Loading screens and scene switches** (skill `asset-memory`): while `loading.held()`, `step(1)` advances a frame but no sim step (`Time.step` stays put), so count steps from `Time`, not from `step` calls. Drive through with `while (loading.active()) await step(1)`, or `await loaded()` (the test context: frames until no loading screen is up, at least one, so a `loading.boot` cover the first frame starts is included) before input that must land on playable steps. A switch reaches the sim as two recorded inputs only, `EnterScene` on the swap step and `LoadingResumed { name }` on the step play continues (a boot cover: `LoadingResumed` only); assert on those, `scenes.current()` and `pool.stats()`. Record the switch as a replay (`--record-replays --filter "<test>"`): it replays without the IO, however long loading took.
- Tests read loose project files; devices read cooked bundles. `gameengine test --cooked` runs the same tests on a fresh desktop cook (T1 too), and `gameengine check` smoke-runs the cooked game (`check.smoke`: `frames`, `input`), failing on any script error, logged error or a loading screen that never lifts.
- **Speed**: `gameengine test` splits the tests across host processes, one per core (`--jobs N`; `--jobs 1` runs them all in one host), and `--js both` runs both engines at once; results and hashes are the same either way, because each test builds its own world and resets services, mocks, saves, loaded asset groups and the clock. Keep it so: a test may not rely on another test having run, and test names are unique. While iterating, `--filter "<name>"` or `--changed` (the test files git sees changed; every test once code, scenes or assets changed).
- **Which host**: the output starts with `host: <path> (debug|release)`. The newest build that is not older than its sources runs; a host too old for the runtime (`has no host op …`) says how to rebuild it, and `gameengine check --rebuild` builds stale engine binaries first.
- Run `gameengine test --js both` before calling a change done.
