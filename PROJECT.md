# SewerAction — project notes

This file is yours. `gameengine skills update` writes it once, when it is missing, and never
touches it again, so this is where everything specific to SewerAction goes. `AGENTS.md`, `CLAUDE.md`
and the skills belong to the engine and are replaced when it updates them; put nothing project-specific there.

Agents read this file before `AGENTS.md`. Where the two disagree, this file wins for this project.

## The game

Sewer Action is a short, responsive 2D run-and-gun platformer built as a production-quality
game-feel showcase. The player crosses a flooded sewer, using movement, jumps, dashes and a
weapon to survive soldiers and environmental hazards before reaching the exit.

The first release targets web architecture and content. The current Game Engine release does
not yet provide a browser build, so actual web packaging is tracked as an external release
blocker while development and verification use the desktop host.

## Conventions

- Landscape presentation with a 16:9 must-see gameplay frame and backgrounds that bleed wider.
- Gameplay is deterministic ECS TypeScript. Presentation feedback never writes gameplay state.
- Shipping visual art lives in `assets/art/`; editable Aseprite masters live in `art/aseprite/`.
  The sewer artwork is first-party project art and should be used directly in scenes, clips and UI.
- Preserve the original `poc-game-feel` behaviour as a reference, but do not port Unity
  singletons, `Time`, `Rigidbody2D` behaviour or presentation-driven state.
- Build one verified vertical slice before expanding content.
- Run `./tools/harness fast` while iterating and `./tools/harness prepush` before opening or
  updating a pull request. Release candidates must pass `./tools/harness release`.
- Use short-lived `issue/<number>-<slug>` branches and squash them into protected `main` through
  pull requests. Do not maintain a permanent `develop` branch.
- Use one fresh Codex chat per development ticket. Finish, verify and merge the current ticket
  before creating the next ticket's chat. Give the new chat a concise handoff containing the
  product brief, ticket scope, dependencies, branch name and verification requirements; use the
  supervisory chat for direction and corrections rather than accumulating implementation context.

## Decisions

- Engine template: `2d-casual`.
- Initial platform declaration: `web`, per product direction.
- Development host: desktop until the engine ships a browser target.
- Art ownership: the supplied sewer artwork is treated as first-party project art.
- Initial release scope: one polished level, one player, one soldier enemy family, one final
  encounter, keyboard/gamepad controls, responsive web input, audio, settings and credits.

## Links

- Mechanics reference: https://github.com/eduardoa-perez-tactile/poc-game-feel
- Project repository: https://github.com/eduardoa-perez-tactile/poc-sewer-action
- Engine releases: https://github.com/tactilegames/game-engine-releases

## Water hazards (issue #21)

- The authored water surface is y = -3 across the first room. Player entry requests 5 damage through the health owner, bypassing combat invulnerability so a recent soldier hit cannot prevent drowning. Water is an entry hazard: sustained contact does not repeat damage.
- Contact treats overlapping water volumes as one region. A 30-step absolute splash cooldown suppresses rapid exit/re-entry; suppressed entries never produce delayed splashes while still submerged. Restart clears contact/deadline and hides the preallocated splash slot.
- The supplied five-frame, 0.5-second splash clip and mono sound run only in presentation. Entry-step deduplication prevents replaying the same event on the following frame. Contact and inactive presentation skip unchanged work; 12 focused hash traces matched before/after the contact optimization.
- Existing replay inputs and golden pixels were preserved; replay hashes/checkpoints and pinned test hashes were updated for the authored simulation schema/state. Water adds a recorded movement/death/restart replay, a single reviewed splash golden and a structural budget.
- Architecture review: no remaining must/should findings. Performance review at one player/one water volume: water replay peaks at 6/7 draws, zero pipelines created during play and zero GC pauses over 4 ms; preserve batching as content grows. Release desktop V8 mobile-tier sample: step p95 0.313 ms, water marker 0.0092 ms, inactive splash 0 ms, RSS about 70.2 MiB and heap about 3.5 MiB. These are desktop relative measurements; real GPU/thermal/phone timings remain unmeasured.
- V8 and phone-low residency/render coverage are supported. Hermes parity remains blocked by open issue #6 (missing Hermes host). Browser packaging remains separately unavailable in the engine. Android package-size dry-run is unavailable because the installed engine lacks its platform template; Android asset cooking succeeded.

## Soldier and combat presentation (issue #22)

- All 19 supplied soldier master frames have clips; the sole hurt pose is intentionally reused
  for a 10-step visual death settle, and both supplied hit cels for a larger amber explosion.
  Source contacts, tuning instructions and review are in `docs/animation/`.
- The one-soldier slice uses its existing Encounter marker as a presentation proxy. Attack
  `Clip2D` state, frame events and projectile release steps 6/8/15 stay authoritative and unchanged.
  Three stopped effect hosts reuse scene entities and cap bursts at 2 muzzle / 4 hit / 2 explosion.
  No new simulation entity/transform is needed; all 79 original hash traces are identical, with
  existing replays, goldens, pools and splash audio preserved.
- Before expanding soldier count, author associated presentation anchors and actor-specific
  lookup/dirty work. Current architecture review has no must/should findings; performance review
  has no blocking findings. New combat peaks at 7/8 draws, zero play-time pipeline creations and
  zero GC pauses over 4 ms. Desktop release V8 active replay step p95 is 2.102 ms, presentation
  p95 1.183 ms, RSS 86.1 MiB, heap 9.36 MiB; phone-low cooked residency is 2.54 MiB. Real phone
  GPU/thermal/idle-skipping measurements remain outstanding; Hermes #6 and web packaging remain
  separate blockers.

## Consequential audio (issue #23)

- Six boot-preloaded mono effects route weapons/environment to SFX and death vocals to Voice.
  Accepted gameplay facts feed one event-only audio adapter; six fixed presentation lanes
  suppress timestamp duplicates and cooldown cues. Sim never reads mixer state.
- Per-sound voice caps sum to 9, below phone-low's 12. Restart cancels same-frame/stale cues;
  finite existing tails finish within 1.104 seconds under the same caps. Idle audio does no work.
- The supplied 75-second stereo laser recording remains source-only; a derived 0.35-second
  mono cue bounds its playback and memory. Proven preload, derivation, routing, cooldowns,
  reports and device limitations are documented in `docs/audio/ISSUE-23.md`.
- Phone-low decoded audio is 297,504 bytes / 32 MiB; total cooked residency 2.771 MiB / 192 MiB.
  All 87 prior hash traces, replays, goldens, atlases, pools and pipeline warm-ups are preserved.
  V8 and cooked phone-low checks pass; Hermes #6, browser packaging and the missing Android
  package template remain separate verification limits.

## Complete sewer route (issue #24)

- Default play uses `scenes/complete-sewer.scene.json`: four ordered beats, six soldiers, three
  widening water gaps and three recovery checkpoints. Typed content owns spawns/patrols/cadence,
  water and checkpoints; the 608-step recorded-input route clears every encounter and finishes.
- The outlet exposes `LevelProgress.finished` plus the `final-encounter` content hook. Issue #25
  retains ownership of the final encounter/win flow. Restart restores the last accepted checkpoint
  and active/future encounters while preserving earlier clears; Enter/gamepad confirm requests recovery
  after death and the camera snaps to the checkpoint frame.
- Extended 128x32 collision pages bound soldier support and projectile sweeps. Boot merges the
  same occupancy into 52 static visible ledge/rim Shapes because this host emits no Tilemap geometry.
  Actor-specific visual lookup and death-driven progression avoid per-step whole-encounter recounts.
- Original first-room tests, replay inputs/hashes, goldens and budgets remain intact. The installed
  replay/budget runner assumes startScene; `tools/gameengine` selects isolated scene profiles for T1
  and recorded replay verification. Assign new scenarios in `tools/replay-scenes.json`; never loosen
  earlier budgets to compensate for playing the wrong scene. Pipeline recording unions fresh profiles.
- Release desktop/mobile-tier relative samples: active step p95 1.653 → 1.714 ms, presentation p95
  1.186 → 1.118 ms, RSS 86.75 → 87.52 MiB, heap 10.08 → 9.60 MiB; host readiness proxy 617 → 613 ms.
  Residency stays 2.77 MiB/192 MiB. Complete structural draw peak is 10/10, with zero pipelines
  created during play and zero GC pauses over 4 ms. Preserve this tight cap as content grows.
- Authoring, inspection and exact measurement limits: `docs/level/ISSUE-24.md`. Real phone GPU,
  thermals/cold loading/frame skipping remain unmeasured; Hermes #6 and web packaging remain separate.

## Final outlet encounter (issue #25)

- Two existing soldiers implement Guard → 45-step Warning → Bombardment → ExitOpen. The
  bomber opens with the shipped throw clip and ballistic bomb pool. Both actors allocate at boot;
  inactive phases are hidden/protected. Content and tuning live in `rooms/complete-sewer.json`.
- `FinalEncounter` owns the phase/deadline. Both clears plus a living player at the outlet latch
  Won / `LevelProgress.finished` / `GameState.Completed`; `GameplayPresentation.phase` is the
  minimal completion hook. Title/completion/pause/new-run UI remain issue #27. Terminal victory
  ignores stale restart/damage/death inputs and holds a finite player pose.
- Death from any active phase, including simultaneous final kill/arrival, enters Failed. Confirm
  restarts the whole final fight at checkpoint 47 with cleared earlier beats retained. Retreat is
  allowed; the camera follows outside the arena instead of losing the player offscreen.
- The complete 706-step control replay observes the bomb opener and wins through every ordered
  phase. Focused tests cover both paths, exact deadlines/duplicates, content/support, pools,
  framing/retreat, terminal idle playback and presentation/hash separation. All 97 prior first-room
  logic traces, seven earlier replay files, goldens and budgets remain intact. Full V8 prepush
  passes 124 tests and cooked check. Fresh pipeline union is unchanged; zero play-time creation.
- Final bomb/exit presentation omits decorative muzzle particles to preserve the existing 10-draw
  cap while retaining shot audio, projectile sprites and impacts/explosions. Peak remains 10/10;
  assets remain 2.77 MiB/192 MiB, with no pool growth/misses or GC pauses over 4 ms.
- Quiet release desktop/mobile-tier medians: sim step p95 2.904 → 2.451 ms, presentation p95
  1.704 → 1.430 ms, RSS 89.44 → 90.91 MiB, heap 9.95 → 10.68 MiB and readiness proxy
  650.48 → 652.80 ms. Different route lengths mean no speedup claim. Architecture has no
  must/should findings; performance has no blocker and notes the tight draw headroom.
- Inspection/tuning and measurement limits: `docs/level/ISSUE-25.md`. Real phone GPU/thermal,
  cold loading and idle skipping remain unmeasured; Hermes #6, browser packaging and the
  missing Android package template remain separate limits.

## Optional presentation comparison (issue #26)

- Typed `settings/game-feel.json` chooses hidden/developer/bonus exposure in every build. Default
  hidden retains prior presentation; bonus exposes the MVC ribbon, developer uses optional
  `feel.open` QA cheat. Baseline/Polished and five independent choices affect only LateUpdate:
  shot shake, camera kick, fixed combat/water particles, soldier flashes and consequential audio.
  Real weapon recoil, input mapping and every simulation rule remain unchanged.
- Desired-state intents are idempotent. Disabled effects clear finite hosts and consume timestamps;
  re-enabling cannot replay stale feedback. Audio OFF skips new cues; existing one-shot tails
  finish within 1.104 seconds (stated in the panel); bus/settings ownership and nine-voice caps stay
  intact. Static model/layout and finite feedback settle; no continuous panel animation is added.
- 138 V8 tests cover both modes, intents/layers, eight screen extremes, voices, idle state and full
  route render budgets. All 111 earlier T0 traces are identical; the 706-step Polished route also
  matches the original trace at every step. Both modes pin rolling digest `8c00b28d`. Existing
  replays, goldens, pools, atlases and gameplay caps remain unchanged. Comparison has its own
  recorded flow/profile; fresh pipeline union adds Text (five records per tier), zero play-time
  creation. Draws: fixture 9/10, optional open Polished full route 12/12, default complete 10/10.
- One relative release desktop/no-GPU V8 sample before/hidden/open Polished: sim step p95
  0.696/0.684/0.729 ms, mixed paused presentation p95 0.370/0.397/0.433 ms, RSS
  72.19/74.81/74.02 MiB, heap 9.12/10.59/8.42 MiB; zero hitch steps or GC pauses >4 ms.
  Settled adapters report zero time; ComparisonUI 0.0295 ms. These are relative host numbers, not
  phone GPU/thermal/idle-skip evidence. Reported residency stays 2.77 MiB/192 MiB plus font/glyph
  bytes omitted from that engine total (~0.353 MiB); audio remains 297,504 bytes/32 MiB.
- Architecture has no must/should findings; performance has no blocker and notes tight draw
  headroom. Inspect/tune through `docs/presentation/ISSUE-26.md`. Hermes #6, browser packaging,
  real phone measurement and the missing Android package template remain separate limits.

## MVC view flow (issue #27)

- Shipping boot shows the Title view; Start and Play again enter a fresh sewer-run scene using
  the existing full-route content. HUD shows health, route beat and dash readiness. Pause/resume,
  death/checkpoint retry and completion/title/play-again all have visible keyboard/gamepad focus
  plus pointer/touch buttons. Controllers fill models; views observe no ECS state.
- Recorded action entities persist across scene switches. PreUpdate flow decisions precede input
  capture so released controls cannot leak into resume. Added-marker initializers explicitly reset bootstrap
  resources and authored camera bounds on cooked scene swaps. Pause holds native attack clips, gameplay
  counters and cadavers; resume compensates health/water/final-warning absolute deadlines.
- All screen samples fit eight landscape safe-area extremes with 44-point controls. A fixed HUD
  reserve preserves the complete 16:9 frame. Static opaque menu/terminal covers cap at 30 fps;
  player/soldier clocks hold, finite feedback settles, and models update on changed facts only.
- Nine focused tests, ten narrow/wide goldens and a start/pause/death/retry/full-win/play-again
  input replay prove the flow. All 121 prior logic traces remain identical; existing replay,
  golden and structural budgets are preserved. Flow peaks at 12/16 draws with zero play-time
  pipeline creation and zero GC pauses over 4 ms. Title art shares the small boot feedback page
  to preserve five-page residency; source art is unchanged.
- Relative release desktop/mobile-tier idle-player step p95 is 0.239 → 0.261 ms, title 0.061 ms,
  pause 0.081 ms, RSS peak 74.25 MiB and heap peak 6.34 MiB. These are host comparisons, not phone
  GPU/thermal/idle-frame-skipping evidence. Architecture has no remaining must/should findings;
  performance has no blocker after removing fresh menu-choice allocations.
- Ownership, tuning, reports and exact limits: `docs/ui/ISSUE-27.md`. Hermes #6, browser packaging,
  real phone measurements and the absent Android package template remain separate limitations.
