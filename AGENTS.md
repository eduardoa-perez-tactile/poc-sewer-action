# SewerAction — working notes for agents

A Game Engine game. Gameplay is TypeScript on a deterministic ECS; UI is MVC views; the
engine is Rust. Everything you do goes through the `gameengine` CLI (add `--json` for machine output).

**Read `PROJECT.md` first.** It holds what is specific to this game (what it is, its conventions,
decisions already made) and wins over this file where they disagree. This file, `CLAUDE.md` and the
skills come from the engine and are replaced when it updates them, so project notes go in `PROJECT.md`,
which the engine creates once and never overwrites.

## Platforms

Check `platforms` in `project.gameengine.json` (`mobile`, `desktop`, `web`; absent means `mobile`)
and make sure your change caters to each one listed:

- **mobile**: low-end phone budgets (skill `mobile-performance-review`), 9:22 to 3:4 screens
  inside the safe area (skill `screen-fit`), touch input.
- **desktop**: resizable windows up to 21:9, keyboard and mouse.
- **web**: the engine has no browser build yet (design.md D1), so flag browser-only work.

## The loop

1. Change code or content.
2. `gameengine test` — logic tests (T0), fast and deterministic. `gameengine test --tier t0,t1` adds render goldens.
3. `gameengine run --headless` starts a session you can inspect: `gameengine world query <Comp>`, `gameengine screenshot`, `gameengine view render <View>`.
4. Prove behaviour with a test or a replay, not by reading code.
5. `gameengine check` before you hand back: engine binaries built and current, typecheck, `validate`, a desktop cook and a headless smoke run of the cooked game (`--tests` adds the game tests on V8 and Hermes). Fix what it reports.

## Rules

- Sim code is deterministic: `ctx.rng`, `ctx.dt`, `ctx.step`. Never `Math.random`, `Date`, timers; real time (production, daily rewards) comes in as the recorded `WallClock` resource (skill `meta-economy`).
- State lives in components and resources (`schema/*.schema.ts`, then `gameengine gen`), never in module variables.
- UI never reads the world directly: a controller fills a view's model; the view raises intents.
- Input → sim → presentation, never back: sim systems never read cameras, UI, real time or `sim: false` state (skill `sim-boundaries`).
- Every gameplay screen and view fits every screen shape its platforms have (mobile: 9:22 phones to 3:4 tablets and fold inner screens; desktop: resizable windows): the board stays whole and clear of the HUD and safe area, and views never clip. Check the extremes before handing back (skill `screen-fit`).
- Scenes live in `scenes/`, prefabs in `prefabs/`: builds ship documents only from there, so the engine refuses other paths in dev too (`E_DOCUMENT_PATH`).
- Debug and QA shortcuts are cheats: `defineCheat` in a `src/**/*.cheats.ts` file that nothing imports; release builds leave them out (skill `cheats`). Never branch sim code on `DEV`.
- A platform service works on a device only with its plugin enabled; `validate` fails with `E_PLUGIN` otherwise (skill `platform-services`).
- **Design for phone-low first**: the weakest supported phone (about 3 GB RAM, a Mali-G52-class GPU, 30 fps: two sim steps plus presentation in 33 ms) sets the design; heavy content gets a cheaper version for it in its `overrides` block, never a sim branch (skill `device-tiers`). Before shipping, measure a probe build on such a phone (`gameengine device perf`), or at least run `gameengine test --memory-class phone-low`.
- **Idle screens don't animate continuously**: menus and waiting boards animate in short bursts and then hold still, so the engine can skip their frames and the phone stays cool (skill `mobile-performance-review`).
- **Sim systems declare when they run**: `runIf`, `runOn` or `{ changed: T }` where they can, `skipUnchanged: true` only for systems that are a function of what they declare; per-step work updates what changed (a dirty flag), never the whole board or model (skill `ecs-systems`).
- A slow system moves to Rust with its TypeScript twin kept as the reference (skill `perf-to-rust`; see Performance comes first).

## Performance comes first

Performance is part of every task, not a polish pass. The game has to hold its frame rate on
low-end phones within tight CPU, GPU, memory and thermal budgets; a design that is slow at the
scale the game needs is wrong even when it works. Before anything heavy — a system that runs
every step over many entities, spawning or despawning at scale, a new effect, material, shader
or UI screen, lots of sprites or models, a big level or loading — read the matching skills
below first, measure before and after (`gameengine call perf.stats`, `render.stats`,
`profile.markers`), and put the numbers in your summary.

| Doing | Read first |
|---|---|
| Any heavy change, and a review before handing it back | `mobile-performance-review` (budgets per device class, measure first, the checklist); the `mobile-performance-reviewer` agent runs it |
| A system that is hot or over budget | `perf-to-rust`: fix it in TypeScript first, split hot and cold data, move it to a Rust native system, run it in parallel ranges (`par_for_each`), check vectorisation with `gameengine native asm` |
| Work every step over queries | `ecs-systems` (run conditions, `skipUnchanged`, `changed()` filters, events instead of polling) and `determinism` (an optimisation never changes the hash: take `gameengine test --hash-trace .gameengine/base` before, compare with `--hash-trace-baseline .gameengine/base` after; a mismatch names the step, system and components) |
| Short-lived objects, levels, loading, memory | `asset-memory`: pools (`pool.warm/take/give`), asset groups, memory budgets, level switches without peaks |
| Sprites and UI art, draw calls | `atlasing`: atlases and why batches break (`gameengine profile batches`) |
| A cheaper look for low-end phones | `device-tiers`: per-device `overrides` in materials, effects, textures, meshes, post and audio; `quality.device()` in presentation only |
| Effects, materials, many 3D instances | `vfx` (particle and overdraw budgets, `gameengine vfx stats`), `vfx-materials` (per-instance `MaterialParams` instead of material copies, culling), `models-3d` (LODs) |
| Proximity, triggers, big worlds | `overlap-queries` / `SpatialHash` instead of O(n²) loops; `open-world-streaming` (cells with read-ahead, dormancy, LOD) |
| Sounds and music | `audio`: decoded cost (96 KB/s mono, 192 KB/s stereo), `mono = true`, banks and groups, streamed music, triggers that must be preloaded |
| A new screen, material, effect or level flow | `testing` (pipeline warm-up): give the flow a budget replay and re-record `pipelines.json` with `gameengine test --tier t1 --record-pipelines`; a release build refuses a missing, partial or stale one |
| Numbers from a phone | `ship-mobile` / `mobile-performance-review`: a probe build (not dev), then `gameengine device perf` (frame report, CPU per thread, memory) and Perfetto |

## The live project

The user may have this project open in the editor or running while you work. The editor follows
the files on disk, so a project change never needs the editor restarted, by you or the user:

- Scripts (`src/`, `schema/`, `ui/`, regenerated `*.gen.ts`) hot reload. Assets, scenes, prefabs, locales, styles and `haptics.json` reload in place, and content re-cooks. Editor lists (Project browser, scenes, playable ads, textures, skills, cheats) relist by themselves.
- `project.gameengine.json`, `pipelines.json` and `input.json` are read when a session starts. When one changes, the editor restarts its edit engine itself (unsaved edits kept) and offers Restart Play while the game runs.
- Confirm a change landed with `gameengine editor console --since <next>`: category `hot-reload` logs `reloaded: …` per reload, or why it was rejected (the last good build keeps running). Keep every save compiling, or work in a copy and apply the change in one go.
- The open scene follows its file while the editor has no unsaved edits of it, and prefab instances follow their prefab files. With unsaved edits the editor keeps its copy and logs a warning (a save would overwrite your file), so prefer editing the open scene through the editor (`gameengine editor call cmd.execute …`).
- Never run importers that delete or rewrite assets while the game is playing.
- Only a change to the engine itself (its Rust binaries) needs a restart: rebuild every binary that reads the changed format (`gameengine doctor` lists stale ones), then ask the user to restart the editor.
- To make `gameengine check` a gate, add a Stop hook to `.claude/settings.json`. It blocks finishing once when the check fails; if it still fails, the agent stops and reports what is failing:
  `"Stop": [{ "hooks": [{ "type": "command", "command": "gameengine check --hook", "timeout": 900 }] }]`

## Skills

In `.claude/skills/` (Claude Code) and the same copies in `.agents/skills/` (Codex): `animation-2d-agent`, `architecture-review`, `asset-memory`, `atlasing`, `audio`, `cheats`, `content-database`, `dependency-injection`, `determinism`, `device-tiers`, `ecs-systems`, `editor-modes`, `editor-windows`, `flipbook-2d`, `haptics`, `mcp-tools`, `meta-economy`, `mobile-performance-review`, `models-3d`, `multiplayer`, `navigation-3d`, `open-world-streaming`, `overlap-queries`, `packages`, `perf-to-rust`, `physics`, `platform-services`, `playable-ad-porting`, `playable-ads`, `project-tools`, `rollback-multiplayer`, `screen-fit`, `ship-mobile`, `signals`, `sim-boundaries`, `skeleton-2d`, `spine-import`, `story-dialogue`, `testing`, `tilemaps-nav`, `ui-mvc-views`, `vfx`, `vfx-materials`, `video`, `work-loop`.

They update themselves when a Claude Code session starts (`gameengine skills update --auto`, a hook
in `.claude/settings.json`) and when the editor opens the project. Codex has no such hook: run
`gameengine skills update --auto` at the start of a Codex session. The two folders are separate
copies: updates keep your edits in either one, but do not copy them to the other. Every skill is
installed in every project for now; see them with `gameengine skills list`.

## MCP

The `gameengine` MCP server (the CLI as tools, skill `mcp-tools`) is registered for sessions started
at the project root: `.mcp.json` for Claude Code (approve it once) and `.codex/config.toml` for Codex
(read once the project is trusted), both kept current by `gameengine skills update`.

## Reviewer agents

`architecture-reviewer` and `mobile-performance-reviewer` are in `.claude/agents/` (Claude Code) and
`.codex/agents/` (Codex custom agents), kept current by `gameengine skills update`. Spawn one where
this file or a skill says to; when you cannot spawn subagents, follow its instructions yourself.
