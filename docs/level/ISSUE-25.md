# Final outlet encounter

Issue #25 replaces the quiet outlet hook with a compact final fight using the shipped soldiers,
weapon clips, ballistic bomb pool, terrain, audio and impact effects. No enemy or asset family,
completion screen, title screen or pause UI is added. Issue #27 owns those screens.

| Phase | Rule and readable feedback |
|---|---|
| Waiting | Route beats 0–2 must be cleared and checkpoint 47 accepted. The outlet arrow is gray. Both final actors are preallocated, hidden and protected from damage. |
| Guard | Enter x47.5–55 with feet y-2.75–1. The raised-ledge guard appears, its lamp turns amber and its attack grace lasts 45 fixed steps. Defeat it through existing combat. |
| Warning | Guard death starts an absolute 45-step deadline. The second lamp turns yellow; the bomber remains hidden and cannot take damage. Duplicate triggers/death facts do not reset the deadline. |
| Bombardment | The lower-lane soldier appears with the existing bomb throw as its first attack. The lamp turns amber; existing attack animation telegraphs projectile release. Defeat the soldier. |
| ExitOpen | Both combat phases are cleared. The outlet arrow turns green. Player movement continues; reaching x54–55 at feet y-2.75–1 while alive accepts the outlet. |
| Won | `FinalEncounter.phase = Won`, `LevelProgress.finished = true` and `GameState.phase = Completed` latch together. Gameplay stops, active projectiles return to their pools and player art settles into a finite held pose. `GameplayPresentation.phase` exposes completion for issue #27. |
| Failed | Player death during any active phase wins over a simultaneous enemy kill/outlet arrival. Enter/gamepad confirm restores checkpoint 47, full player/enemy health, dormant actors, deadlines and pools, while retaining the six earlier clears. The whole final fight restarts. |

Victory ignores stale damage/death/restart requests. A future explicit new-run flow belongs to
issue #27. Leaving the arena permits retreat: the camera follows the player outside its final
framing envelope, then frames the arena again on return.

## Inspect and tune

`./tools/gameengine run` opens the default complete route. A/D move, W jumps (press again for the
air jump), Shift dashes and F fires. Enter/gamepad confirm recovers after death. Keep distance from
the bomber's release point and shoot between its throws. The verified pilot waits for the first
throw, observes an active bomb, clears all phases and wins in 706 fixed steps (about 11.8 seconds).
It uses recorded controls, without teleports, health writes or injected combat facts.

Edit `assets/rooms/complete-sewer.json`: `finalEncounter` owns trigger X, accepted feet-height
range, warning/guard-grace steps and camera center. `soldiers` with `finalPhase: 0/1` own each
phase's spawn, patrol, health and cadence. Keep one actor per phase, safe supported spawn positions,
a 30–120-step warning and the manifest cap of eight soldiers. Restart Play after authoring to
rebuild the manifest. FinalCue phase 0/1 lamps and phase 2 outlet arrows are in the complete scene.
The green/gray arrow and two still lamps add no texture or continuous animation.

The final bomb/exit phases reserve the existing ten-draw cap for projectile, hit and explosion
feedback by suppressing decorative muzzle particles. Shot audio and visible projectiles remain;
all first-room cosmetic behavior is preserved. No pool grows and no new pipeline is needed.

A single diagnostic screenshot of recorded step 661 showed the amber bomb lamp, thrower, bomb,
player and gray closed outlet within the frame. Objective framing tests cover all six landscape
device shapes, notched safe areas, desktop sizes, all phases and actual retreat input. To inspect
that same moment, load the checked-in complete replay with protocol `replay.load`, then
`./tools/gameengine step 661`; `replay.load` resets and pauses at the start, and stepping uses the
recorded inputs. The normal `replay play` command verifies and plays through victory.

## Verification and measurements

`./tools/harness prepush` passes 124 V8 T0/T1 tests in both existing scene profiles, every checked-in
replay, all seven structural budgets and `gameengine check` (typecheck, validate, desktop cook,
cooked smoke and pipeline coverage). Focused tests cover content/support, gates, inactive damage,
phase order, exact deadline, duplicate triggers, actual bomb-pool use, win, simultaneous death,
failure/recovery from every active phase, presentation/hash separation, framing, retreat and
finite completion playback. The complete replay has per-step hash checkpoints. All 97 prior
first-room logic traces are identical; six complete-level traces intentionally change with the
new actors and encounter state. Seven prior replay files, all goldens, budgets and atlas art are
unchanged. Fresh pipeline profile recording preserves the existing union; play creates none.

Three sequential samples per version on Apple M2 Max, release desktop V8, mobile rendering tier,
paused headless sessions. Baseline is clean bb6cb3d and its 608-step route; after is the 706-step
winning route. Medians are relative host evidence, not phone CPU/GPU compliance or a speedup claim.

| Metric | Before | After / gate |
|---|---:|---:|
| Active sim step p95 | 2.904 ms | 2.451 ms / about 8 ms phone-low guidance |
| Active presentation p95 | 1.704 ms | 1.430 ms |
| Script p95 | 3.481 ms | 2.712 ms |
| RSS | 89.44 MiB | 90.91 MiB / 350 MiB device gate |
| JS heap | 9.95 MiB | 10.68 MiB / 32 MiB |
| CLI startup to three sim steps | 650.48 ms | 652.80 ms |
| Android cooked residency | 2.77 MiB | 2.77 MiB / 192 MiB |
| Complete structural draw peak | 10 | 10 / 10 |
| Play-time pipelines / GC pauses >4 ms | 0 / 0 | 0 / 0 |

The final owner system's median p95 is 0.140 ms; worst measured after-capture GC is 0.612 ms.
The step-661 render snapshot has eight draws, five atlas pages, 46 instances and no validation
errors. Headless sessions draw only on request, so steady capture drawCallsMax=0 is not a GPU
measurement; the draw verdict comes from T1 replay budgets. Native loadMs is unavailable, so
startup includes the CLI bridge and is only a readiness proxy. Snapshot memory includes capture
render-target/upload costs and is not comparable to steady RSS.

Architecture review has no remaining must/should findings. Performance review has no blocker;
10/10 draw headroom is its medium observation. Existing per-step AI scans stay bounded at eight
actors; filter active actors before expanding that scale. Real phone GPU, thermals, cold loading,
memory pressure and idle-frame skipping remain unmeasured. Hermes parity is blocked by issue #6
(missing Hermes host), independently of unavailable browser packaging. Android assets cook;
package-size verification remains unavailable because the engine lacks its Android template.
