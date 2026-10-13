# Recovery feedback — ticket #67

The player now has an accepted-shot silhouette, dash stretch and retained silhouettes,
a stretched takeoff, and a speed-weighted landing squash. Camera reactions distinguish
weapon recoil, accepted damage, death and nearby explosions. The final encounter retains
muzzle feedback instead of suppressing it to meet the previous ten-draw budget.

## Tuning and bounds

- Accepted `AudioCue.Shot` holds the supplied shoot pose for 0.095 seconds, with a 0.07-world-unit
  backwards visual impulse and finite lean. A duplicate cue never restarts the pose.
- Active dash stretches the player to 1.30 × 0.78 with a directional 0.16-radian lean. Three
  authored presentation hosts sample a silhouette every 0.025 seconds and fade over 0.1 seconds.
  Their sprites use the existing player atlas. They are hidden when idle or particles are OFF.
- Takeoff stretches over 0.11 seconds. Landing squashes over 0.14 seconds, weighted by the actual
  previous downward velocity (full weight at 12 units/second), with an optional 0.028-unit camera dip.
- One authored foot-dust host emits six soft-dot grit particles per accepted takeoff/landing;
  lifetime is 0.18–0.28 seconds, capacity twelve. It uses no new texture and settles completely.
- A real health reduction requests shake; an invulnerability-rejected damage request does not.
  Surviving damage requests 0.095 units/0.16 seconds, lethal damage 0.15/0.3. Nearby explosion shake
  is distance-weighted up to 0.12/0.2. Death adds a bounded 0.055/0.12 reaction.
- Camera impulse decay is `pow(0.72, realDelta * 60)`, preserving the 60 Hz envelope at other
  presentation rates. Shake/recoil/particles continue to respect their existing comparison toggles.
- Existing muzzle/hit/explosion hosts remain fixed at two/four/two burst slots. Muzzle capacity
  is now two so concurrent bursts share its one emitter. Final-fight muzzle suppression is removed.

All pose/trail/camera/effect state is `sim:false`. The new adapter reads authoritative facts and
writes only Sprite, SpriteAnimation, VisualOffset and ParticleSystem. It performs no structural
commands, physics writes, input edits, or gameplay changes. Four authored visual hosts per gameplay
scene intentionally change initial entity allocation; the coordinator validates and re-records
those scene hashes while preserving recorded controls and gameplay outcomes.

## Verification

`./tools/gameengine test --tier t0,t1 --filter 'recovery feedback' --json` contains ten focused tests (eight T0 and two T1):
accepted shot/dedup/return to idle; directional dash/takeoff/landing/settle; accepted-versus-rejected
health reactions; 30/60/120 Hz recoil equivalence; fixed effect hosts; final-fight muzzle/particle
bounds; four synchronous rendered feedback states with particles-OFF cancellation; pause envelope/gate handling; fresh scene resets; and retained death-cue deduplication. The eight T0 tests pass. Both focused T1 bodies pass; the project wrapper additionally verifies all existing scene replays, whose intentional scene/input hash changes are owned by integration.

New render evidence is under
`tests/goldens/recovery_feedback_authored_shot_dash_jump_and_landing_have_visible_distinct_silhouettes/`:
`accepted_shot`, `dash_trails`, `takeoff_dust`, and `landing_dust` at 960×540. Each was visually
inspected. The final-fight three-effect check has exactly three live effect particles, settles to
zero, and stays within twenty draws. Integration captures the complete route's actual draw peak
and pipeline union separately; this test does not claim the whole game fits its legacy ten-draw cap.

`gameengine vfx validate` passes. `gameengine vfx stats foot-dust --device android-low-compat`
reports peak six / capacity twelve, one analytic emitter draw, average isolated-effect overdraw
0.11, coverage 0.08; no warnings. The contact sheet is `.gameengine/recovery-foot-dust.png`.
These are engine/reference structural numbers, not physical phone GPU or thermal measurements.

No full suite, existing budget rewrite or existing golden re-recording was performed by this
worker. Only the four new recovery snapshots were recorded. Camera shake/recoil are disabled for those image captures so render-frame phase cannot make their pixels nondeterministic; camera response remains covered separately. Scene entry resets all new resources, and pausing holds envelope times while disabling active polling. The coordinator owns the combined typecheck/cook/check, legacy outcome/hash verification,
whole-game render budget and pipeline capture.
