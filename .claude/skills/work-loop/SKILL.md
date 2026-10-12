---
name: work-loop
version: 1.11.0
tier: required
description: The edit → test → inspect loop for a Game Engine game, and the CLI commands for each step. Use at the start of any gameplay, UI or content task.
---

# Work loop

The commands below need `gameengine` on PATH. If the session started with "gameengine is not on PATH", put it there once: `node .gameengine/engine/tools/cli/bin/gameengine.mjs setup --path` (or `node tools/cli/bin/gameengine.mjs setup --path` in the engine checkout; plain `setup` does it too, with the toolchain) writes a launcher into a user bin directory on PATH (`--dir <dir>` picks one; `gameengine doctor` checks it), then start a new session. Until then, `node .gameengine/engine/tools/cli/bin/gameengine.mjs` runs the same CLI.

| Step | Command |
|---|---|
| Logic tests | `gameengine test` (sharded across cores, `--jobs N`; `--js both` runs V8 and Hermes at once; `--filter "*swap*"` for one, `--changed` for the test files you touched). The output starts with `host: <path> (debug|release)`; `gameengine check --rebuild` rebuilds stale engine binaries |
| Prove a change left the sim alone (refactor, optimisation, port to Rust) | before editing `gameengine test --hash-trace .gameengine/base`, after it `gameengine test --hash-trace-baseline .gameengine/base`: `N of N identical` is the proof, a failure names the step, system and components (skill `determinism`). No equivalence fuzzers, second copies of the project or end-of-test hash guessing |
| Render goldens | `gameengine test --tier t0,t1` (`--update-goldens` after an intended change) |
| Start a session | `gameengine run --headless` (`--paused` to step by hand) |
| Advance / look | `gameengine step 60`, `gameengine screenshot out.png`, `gameengine world query Tile --limit 5` |
| Edit live | `gameengine world set <entity> <Comp> '<json>'`, `gameengine cmd scene.createEntity --name Box` |
| Press the UI | `gameengine ui interactables --width 1179 --height 2556` (what takes presses, topmost first), `gameengine ui press <id>` / `ui drag <id> --by 0,300` / `ui type <id> <text>` (hit-tested, through the real input path), raw points on the game too: `ui tap --at x,y`, `ui drag --from x,y --by 0,-300 --duration 0.1` (a flick: timed in sim steps, the same paused or running and in a replay), `gameengine emit <Event> '<json>'` |
| A UI view alone | `gameengine view render Hud --sample midway --out hud.png` (`--model '<json>'` for any state, `--size WxH`, `--safe l,t,r,b`, `--landscape`, `--times` for animations and UI particles) |
| A material alone | `gameengine material preview materials/gem.mat.json --mesh torus --yaw 0.8 --time 1.5 --out m.png` (skill `vfx-materials`) |
| Put the game into a state | `gameengine cheat list`, `gameengine cheat run moves.add amount=3` then `gameengine step 1` (skill `cheats`) |
| Look at one thing | `gameengine mode sprite --entity 5:1`, `gameengine mode particles --entity 7:1`, `gameengine mode physics`, `gameengine mode sim` (no rendering), `gameengine mode full` |
| Play it for real | `gameengine run --perf` (frame times and the worst frames on exit; the game's console on stderr) |
| Replays | `gameengine replay record start --path tests/replays/x.greplay` (restarts the game from a fresh world) … `stop`; `gameengine replay verify <file>` names the first diverging step (and, recorded with `--checkpoint-every 1`, the system and components); skill `determinism` |
| Frame rate | `gameengine run --run-sec 10 --json`: the frame-rate target, the display's refresh rate and measured frame intervals (skill `mobile-performance-review`) |
| Memory and loading | `gameengine memory report --device phone-low` (asset groups against budgets; skill `asset-memory`) |
| Rust systems | `gameengine test --native both` (Rust = its TypeScript twin), `gameengine native asm <System>` (skill `perf-to-rust`) |
| What a build ships | `gameengine build android --config release --dry-run --report` (skill `ship-mobile`) |
| Playable ads | `gameengine playable new` / `run` / `build` / `validate <ad>` (skill `playable-ads`) |
| Stop | `gameengine session stop --all` |
| The editor the user watches | `gameengine editor state`, `gameengine editor mode editor.play`, `gameengine editor play` / `stop`, `gameengine editor stream on` (URL in `editor state`), `gameengine editor call render.stats --role game`, `gameengine editor screenshot out.png` (MCP `editor`, `editor_screenshot`) |
| The editor's console | `gameengine editor console --level error` (`--since <next>` for only new entries, `--follow` to keep reading): script errors, rejected hot reloads, cook failures, stale engine binaries |
| Before handing back | `gameengine check`: validate, cook, and a smoke run of the cooked game (`check.smoke` in `project.gameengine.json`: `frames`, `input`); `--tests` adds the game tests on V8 and Hermes, `gameengine test --cooked` runs them on cooked content |

- Hot reload is on in sessions: save a file, the session keeps its world. A bundle that fails to build or load is rejected and the last good build keeps running; the reason is in the console. In the editor, each reload logs `reloaded: …` (category `hot-reload`): wait for it with `gameengine editor console --since <next>` instead of asking the user to restart anything.
- Session-start config (`project.gameengine.json`, `pipelines.json`, `input.json`) is the exception: a headless session needs `session stop` and `run` again; the editor restarts its edit engine itself and offers Restart Play.
- Every command takes `--json`. Read errors; they name the fix.
- Done means a test or replay shows the behaviour, not that the code compiles.
