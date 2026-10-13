# Complete sewer level

Issue #24 builds the intake-to-outlet route. The final encounter and win flow remain issue #25.

| Beat | Route | Combat | Traversal |
|---|---|---|---|
| Onboarding | Intake, x -8 to 8; spawn -5.25 | One 2-health soldier, 90-step cadence | Safe floor, then 1.5-unit flooded gap |
| Development | Floodworks, x 8 to 27; checkpoint 9 | Two 3-health soldiers, 72/64-step cadence | Raised ledge, then 3-unit gap |
| Climax | Pump gauntlet, x 27 to 46; checkpoint 28 | Three 3-health soldiers, 56/48/48-step cadence | 4-unit gap combines jump, air jump and dash |
| Resolution | Outlet, x 46 to 56; checkpoint 47 | Quiet recovery lane | Raised ledge, green outlet arrow at 54 |

Encounters activate in order. Clearing the current encounter and reaching the next checkpoint
advances progression; crossing the outlet early cannot finish. Restart returns the player to the
last accepted checkpoint, restores the active/future soldiers and pools, and retains earlier clears.
At the outlet `LevelProgress.finished` becomes true and the definition's `transition` is
`final-encounter`. GameState stays Playing; no boss, reward, win screen or automatic next-scene load
is implemented here.

## Inspect and tune

Run `./tools/gameengine run` to play the default complete scene. A/D move, W jumps (press again for
the air jump), Shift dashes and F fires. After death, Enter/gamepad confirm returns to the checkpoint;
the camera snaps to the recovery frame. Gamepad mappings remain in input.json. The recorded pilot
completes the route in 608 fixed steps, about 10.1 seconds; manual play can take longer.

Use the editor's Tilemap panel on `scenes/complete-sewer.scene.json` for the route. Edit
`assets/rooms/complete-sewer.json` for beat/checkpoint positions, soldier spawns, patrol ranges,
health/cadence and water spans. The typed definition is validated at boot; its focused test also
checks checkpoint floor support. The map supports at most 128 columns by 32 rows, 8 soldiers and
8 water spans; water spans must be at most 4 world units wide. Keep checkpoints on safe floor.
After editing layout/spawns, restart Play to rebuild the boot-derived collision and actor manifest.

One diagnostic screenshot after objective checks exposed that the installed host emits no native
Tilemap geometry; its first-room golden had the same limitation. The complete scene therefore
creates 52 static ledge/rim rectangles from merged contiguous solid runs of that same map.
Render batches confirm visible terrain at the outlet (26 visible terrain shapes), and T1 checks
require visible geometry at all five checkpoint/outlet positions across four landscape extremes.
Static green arrows provide route/finish cues without relying on the host's unconfigured Text2D font.
No second subjective screenshot was taken. The supplied sewer art remains the background and actor
art; the fallback adds no texture or continuous animation.

## Verification and replay scene profiles

`./tools/harness fast` runs logic while iterating. `./tools/harness prepush` runs the full V8
T0/T1 suite and gameengine check. Phone-low coverage:

```sh
./tools/gameengine test --tier t0,t1 --js v8 --memory-class phone-low
./tools/gameengine replay verify tests/replays/complete_sewer_start_to_finish_replay_clears_ordered_encounters_and_checkpoints.greplay
./tools/gameengine test --tier t1 --js v8 --record-pipelines
```

The installed engine's replay/budget runner assumes project.startScene and ignores replay scene
metadata. Native replay verification of an unchanged first-room replay against the new default
scene diverges at step 0; changing its header sceneId does not help. `tools/gameengine` therefore
routes T1 runs and checked-in replay verification through `tools/test-scenes`. It creates temporary
project profiles with symlinks to unchanged content and the correct start scene, never modifying
the live project's configuration. Tests explicitly select their authored fixture scenes. Every
replay and structural budget must appear exactly once in `tools/replay-scenes.json`; new unassigned
scenarios fail the harness. Recording pipelines takes the fresh union of all scenarios and tiers.
Use the checked-in launcher for these commands; the raw installed CLI does not provide this
multi-scene replay compatibility. All original input recordings, hash pins and golden files are
preserved, with their original structural caps.

## Measurements

Release V8 on Apple M2 Max, headless desktop host, mobile rendering tier. These are relative host
measurements, not phone CPU/GPU or thermal results.

| Metric | Before / representative first room | Complete level |
|---|---:|---:|
| Pre-edit idle step p95, 600 steps | 0.169 ms | 0.217 ms (before final static terrain fallback) |
| Active replay step p95 | 1.653 ms | 1.714 ms |
| Active presentation p95 | 1.186 ms | 1.118 ms |
| Active RSS | 86.75 MiB | 87.52 MiB |
| Active JS heap | 10.08 MiB | 9.60 MiB / 32 MiB device gate |
| Cold host startup to three sim steps, 3 samples | 617 ms | 613 ms |
| Cooked phone-low residency | 2.77 MiB | 2.77 MiB / 192 MiB |
| Structural draw peak | 7 in original combat replay | 10 / 10 |
| Pipelines created during play | 0 | 0 |
| GC pauses over 4 ms | 0 | 0 |

The pre-edit idle sample was captured before implementation. Active samples compare the retained
635-step first-room combat scenario and the 608-step complete route on the final code; both verified
without divergence. Startup measurements include the CLI bridge and three simulation steps; native
perf.loadMs was unavailable, so this is a host readiness proxy, not device cold loading. GPU timing
was unavailable. The complete draw cap deliberately leaves little content headroom; keep batching
and remeasure before adding effects or actors. The generic phone-low draw guidance is 50.

Architecture review has no remaining must/should findings. Performance review finds no CPU/memory
blocker at this authored scale, with the draw-cap headroom observation above. Real phone GPU,
sustained thermals, cold device loading and idle frame skipping remain unmeasured. Hermes parity is
blocked by issue #6 (missing Hermes host), independently of unavailable browser packaging. Android
asset cooking passes; package-size dry-run is unavailable because the engine has no Android template.
