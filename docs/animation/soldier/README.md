# Soldier and combat animation review — issue #22

All 19 frames of `art/aseprite/soldier/soldier.ase` are intentionally represented. The source
canvas is 64×60 px; the presentation sprite uses 1.28×1.20 world units, with a `[0.5, 0]` feet
anchor and the existing `soldier` atlas. The checked-in contact sheets show source frames and
red bars at attack events. No source art was redrawn or resampled.

| Clip | Source master frames | Duration / playback | Meaning |
| --- | --- | --- | --- |
| Idle | 0 | 0.2 s once, hold | Single supplied resting pose |
| Shoot | 1–2 | 10 fps once | `fire-bullet` enters frame 1 at 0.1 s |
| Crouch-shoot | 3–4 | 8 fps once | `fire-crouch-bullet` enters frame 1 at 0.125 s |
| Hurt | 5 | 0.133333 s once | Supplied hit pose while authoritative hit stun remains |
| Jump | 6 | 0.1 s once, hold | Rising pose; AI still has no new jumping behaviour |
| Throw | 7–12 | 12 fps once | `throw-bomb` enters frame 3 at 0.25 s |
| Run | 13–18 | 10 fps loop | Actual horizontal actor displacement |
| Death | intentionally reuses 5 | 0.166667 s settle, hold | No death source tag: squash hurt pose to a still cadaver |

Attack timing intentionally preserves the issue #19 combat contract: crouch is 8 fps and throw
is 12 fps, including the source master's 500 ms first/last throw holds shortened to that cadence.
Retiming those holds here would move the existing bomb release and cooldown.

`DriveSoldierAnimation` samples the actor's existing attack `Clip2D` time, frame and telegraph
tint. It never replaces or advances that clock. Existing projectile releases therefore remain
at steps 6, 8 and 15 after attack entry (the PostUpdate event is consumed on the next Update).
Focused tests assert projectile, visual frame and muzzle cue on those exact boundaries.
Death takes priority over hurt, hurt over attack, then rising, running and idle. Restart clears
the visual clock and scale, and resumes the authored patrol. Single-pose clips hold still.

This vertical slice has exactly one soldier and one Encounter marker. After enemy pools are
created, `WarmSoldierVisual` attaches the visual proxy to that existing marker. The actor's
original sprite is hidden; only presentation sprite and offset fields change. No entity,
transform or pool was added to simulation. **All 79 original per-step hash traces match**, and
existing replay inputs, hashes, goldens and audio remain unchanged. Before adding more soldiers,
author one associated presentation anchor per actor and make lookup/dirty checks actor-specific.

## Inspect and tune

- Open the contact sheets in this directory and `../effects/`; the new combat golden is at
  `tests/goldens/combat_animations_render_bounded_effects_across_landscape_screen_extremes/combat/mobile/metal.png`.
- Start `./tools/gameengine run --headless --paused --tier mobile`, then use
  `./tools/gameengine replay play tests/replays/combat_animation_feedback_replay_warms_soldier_attacks_and_effects.greplay`.
  The editor can play the same replay. Stop a headless session with `./tools/gameengine session stop`.
- Edit `assets/art/soldier/*.clip2d.json` for locomotion/hurt timing. Attack timing and release
  events are gameplay contracts; changing those requires a gameplay review and replay update.
- The death settle scale lives in `DriveSoldierAnimation`; effect size/tint lives in the
  `.vfx.json` assets and their clip timing in the matching `.clip2d.json`. Keep both timings equal.
- Regenerate sheets with `./tools/gameengine clip2d sheet <clip> --out <sheet>` and run
  `./tools/harness prepush`. Review intended golden changes before updating them.

Source sheets were visually reviewed. One combat screenshot exposed an initial missing-transform
prototype; it was replaced by the existing-marker design. The final golden is verified by the
renderer, visible particle counts, bounded cleanup and full sprite/effect safe-area assertions,
without taking a second subjective screenshot.
