# Issue #22 verification and review

- `./tools/harness prepush`: 96 V8 T0/T1 tests and six structural budgets pass; generated bindings,
  formatting, typecheck, validation, pipeline coverage, desktop cook and cooked smoke pass.
- Phone-low residency/T0/T1: pass. Original 79 per-step hash traces are identical to the baseline
  captured at `572904e`; all six existing replays and both existing golden files remain unchanged.
- New 635-step input replay verifies without divergence. Budget warm-up covers desktop, mobile
  and compat; each tier records four pipeline keys. Every final structural scenario reports zero
  pipelines created during play and zero GC pauses over 4 ms.
- Exact release tests cover standing/crouch/throw frame indices 1/1/3 and fixed steps 6/8/15;
  duplicate next-step presentation visibility does not replay muzzle feedback.
- Contact sheets for all eight soldier clips and four effect clips were reviewed. The combat
  golden has actual particle-count, cleanup, world-transform and safe-area geometry assertions.
  The single subjective screenshot limit was respected; see the soldier README for its correction.

## Architecture

Independent architecture review: no must/should findings. Gameplay owns attack clocks and health;
LateUpdate owns proxy sampling and feedback. No new simulation entities or transforms, services,
module state, input rules or content outside scene/prefab directories were introduced. Expansion
past the current one-soldier slice needs actor-associated anchors and actor-specific dirty work;
that constraint and tuning surface are documented.

## Performance

Independent mobile review: no blocking findings at the intended slice scale. Desktop release V8
headless measurements are relative CPU/memory evidence, not real phone GPU or thermal evidence.

| Measurement | Before / final | Guidance or structural ceiling |
| --- | --- | --- |
| Player-weapon peak draws | ceiling 5 → measured 6, ceiling 6 | One new muzzle draw |
| Soldier-attack peak draws | ceiling 6 → measured 7, ceiling 7 | Bounded combat feedback |
| New combat replay peak draws | 7 | 8; phone-low general guidance 50 |
| Pipelines created during play | 0 | 0 |
| GC pauses over 4 ms | 0 | 0 |
| Active replay step p95 | 2.102 ms (635 steps, checkpoint replay) | 8 ms phone-low guidance |
| Presentation p95 | 1.183 ms | Part of 33.3 ms phone frame |
| Active replay RSS / JS heap | 86.1 / 9.36 MiB | 350 / 32 MiB |
| GC max | 0.506 ms | 8 ms |
| Phone-low cooked residency peak | 2.54 MiB | 192 MiB |
| Effect peak per burst | 1 particle / 1 emitter draw | 300 particles / 4 draws |

The effects atlas is one 176×96 page; the soldier atlas is one 236×176 page. Batch inspection
finds no interleaved pages, standalone textures or oversized textures. The hit sheet is untrimmed.
No cheaper art/effect variant is needed for these small source assets. Existing pools and mono
splash audio are preserved. Explicit per-frame vector/object allocations were removed; one
`clip2DInfo` metadata call per active soldier/frame remains an optional caching improvement if
actor count grows. Tight feature ceilings deliberately catch every unexpected extra batch.

Stopped visual-system markers are zero. Actual idle-frame skipping remains unverified because
paused headless capture disables it. Device GPU time, sustained thermals and phone load times
still require a probe build on real hardware.

Hermes was explicitly attempted and is blocked by open issue #6 (missing Hermes host). Browser
packaging remains separately unavailable in this engine. Neither blocker is represented as a
passing lane or included in this ticket's changes.
