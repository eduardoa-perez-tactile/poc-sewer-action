# Title, HUD and terminal flow

The shipping entry is `scenes/title.scene.json`. Start and Play again replace the world with
`scenes/sewer-run.scene.json`, which adds session flow to the existing complete sewer layout.
The shared typed room content still owns enemies, water, checkpoints and the final encounter.
The original complete-sewer, first-room and comparison fixtures remain unchanged.
Explicit added-marker initializers reset simulation bootstrap resources and presentation camera
state on each swap: this installed cooked host preserves resource values rather than applying
the scene resource overrides on a switch. The camera envelope is authored in SessionRoom.

## Ownership and controls

- `GameState` owns Title / Playing / Paused / PlayerDead / Completed. Existing health, restart,
  level and final-encounter systems still decide death, recovery and victory.
- `SessionFlow` owns focus, the direction latch and pause step. The input adapter reads recorded
  `ActionState` in PreUpdate before gameplay input capture. This avoids consuming retained menu
  events twice and samples released controls on the first resumed step.
- Engine action entities are marked Persistent before scene switches. This is required by this
  host: otherwise the scene switch despawns them and disconnects the action map.
- `BuildGameplayUI` copies health, maximum health, route beat, dash readiness and focus only when
  their sources change. `GameFlowUI` selects a view and fills its model. Views read models only;
  buttons raise validated desired-state `FlowRequested` input.
- W/S, A/D or the left stick select; Enter / gamepad A confirms; Q / B backs out; P / Start pauses
  or resumes. All menu actions also have hit-tested pointer/touch buttons. Focus is visible and
  direction input requires a neutral crossing before moving again.
- Retry checkpoint restores full health at the accepted recovery point. Play again starts at
  checkpoint zero with a fresh full route. Unsupported actions are ignored in their current phase.

## Pause and idle

Pause gates movement, damage, projectiles, hit reactions and cadaver settling; simulation clip
rates become zero. Already committed clip events may resolve once at the pause boundary. Their
new projectiles stay held until resume. Resume shifts the three absolute deadlines—health
invulnerability, water splash cooldown and final warning—by elapsed paused steps. Remaining-step
counters do not advance. Player presentation clocks stop, soldier clocks freeze, finite effects
and voice tails finish, and camera feedback settles.

Title, pause, death and completion use an opaque static cover, with no CSS loops, particle loops
or per-frame model writes. Soldier presentation and native clips hold on shipping death/completion
screens. The UI controller caps these screens at 30 fps and restores the gameplay cap on resume.
Legacy fixture behaviour remains available for existing presentation tests.

## Layout and art

Every view uses a safe-area Screen, a centred capped card and fitting labels. All controls are at
least 44 points in the device matrix. The HUD occupies a fixed 184-reference-pixel top reserve;
`FitGameplayFrame` fits the entire 12 × 6.75 gameplay rectangle below it, with safe-area and side
margins, using the project's 1920 × 1080 reference resolution. The existing presentation camera
continues to follow the player; it never feeds its state into simulation.

The supplied title art is contained above the card. It shares the small, already boot-loaded
feedback atlas (`effects`) so displaying it cannot add a sixth loaded page to the original
five-page fixture budget. No source image or earlier golden is changed. Appearance remains
editable in `ui/flow-panel.ui.json`, `ui/flow-hud.ui.json` and `ui/flow.style.css`.

## Verification and measurements

Nine focused tests cover real menu input, retained/held direction handling, pointer presses,
long pause/deadline preservation, released controls on resume, checkpoint recovery, a fresh
post-completion run and idle UI/animation clocks. The recorded-input route starts, pauses,
resumes, walks into water, retries, wins the full outlet encounter and plays again. The flow
has a structural budget and an explicit title scene profile. Ten render goldens cover all five
views at 800 × 600 and 1280 × 540. Every sample is asserted across eight landscape extremes:
fold cover, 21:9 phone, notched iPhone, SE, iPad, fold inner, 800 × 600 and desktop 21:9.

All 121 prior logic hash traces remain identical. Earlier replay inputs, hashes, goldens and
structural caps remain unchanged. Flow replay peak is 12 / 16 mobile-tier draws, with zero
play-time pipeline creation and zero GC pauses over 4 ms. Pipeline recording unions every
existing scene profile and the new flow across desktop, mobile and compat.

Relative release desktop V8 / mobile-tier, 600-step samples (headless, no GPU rendering):

| Scenario | Step p95 | Presentation p95 | RSS | Heap |
| --- | ---: | ---: | ---: | ---: |
| Prior complete scene, idle player | 0.239 ms | 0.579 ms | 73.14 MiB | 5.17 MiB |
| New run, idle player | 0.261 ms | 0.411 ms | 74.14 MiB | 4.67 MiB |
| Title | 0.061 ms | 0.083 ms | 71.63 MiB | 4.45 MiB |
| Pause | 0.081 ms | 0.122 ms | 74.25 MiB | 6.34 MiB |

The mixed paused presentation samples are relative host measurements, not phone timings or a
speedup claim. All have zero hitch steps and zero GC pauses over 4 ms; worst final-sample GC is
0.148 ms. Settled GameFlowUI marker is 0.001 ms; changed-only snapshot/clip-hold adapters
report zero. Review removed fresh per-step choice arrays and uses scalar resource views.

Phone-low reported residency is 2.826 MiB / 192 MiB (shared boot/gameplay page references are counted in both groups); decoded audio is 297,504 bytes /
32 MiB. Font and glyph bytes (~0.353 MiB) are omitted by the engine residency total. No new
heavy content, 3D, post effects, audio or unbounded pools are introduced. Mobile/compat retain
MSAA 1 and HDR false. The cooked 120-frame smoke reports 12 / 64 shown UI nodes.

Architecture review has no remaining must/should findings. Mobile review has no blocking
finding; its allocation hygiene finding is fixed. Full V8 harness, existing replay verification, T1 goldens, fresh pipeline union, Android
cooking, all nine cooked-flow tests and cooked check pass. Full prepush passes 147 tests on every
authored scene profile, all earlier replays/budgets and the new flow. Android cooking produces
four asset atlas pages and a 335,721-byte base bundle. The fresh pipeline union is unchanged.

Hermes parity is still unavailable because the installed engine has no Hermes host (issue #6).
The Android package-size dry run still lacks its engine platform template; asset cooking works.
Browser packaging remains unavailable in the current engine. Real phone GPU/fill, sustained
thermals, cold loading, peak process memory and actual idle-frame skipping need a probe/device
run. Headless perf reports idleFrames.enabled=false; stable model/clock tests prove settling,
but do not establish GPU frame skipping. These engine/device limits do not block this MVC work.
