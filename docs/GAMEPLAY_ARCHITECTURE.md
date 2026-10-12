# Deterministic gameplay architecture

## Purpose

Sewer Action uses a fixed-step ECS with a strict one-way dependency rule:

```text
device and UI adapters -> recorded intent events -> simulation state -> presentation models -> rendering/audio/UI
```

Only simulation state decides outcomes. Cameras, animation progress, frame time, wall-clock time,
services and UI state cannot influence movement, damage, enemy decisions, hazards or level flow.
This keeps desktop development representative of the future web target and makes sessions replayable
across runtimes.

## Ownership and contracts

| Feature | Consequential state owner | Inputs | Outputs |
| --- | --- | --- | --- |
| Game flow | `GameState` resource | spawn/death/exit facts | authoritative phase observed by presentation |
| Player | `Player`, `PlayerControl` and `PlayerStepInput` | recorded `PlayerIntent` | held movement/jump state and the current step's action sample |
| Movement | `PlayerMotion` plus actor transforms | `PlayerControl`, `PlayerGroundContact`, `PlayerStepInput`, `ctx.dt` | transforms, velocity and facing state |
| Combat | `Health` and `Weapon` components | fire intent, hit facts, `DamageRequested` | cooldown state and `ActorDied` facts |
| Enemies | `EnemyBrain` component | sim transforms, collision facts and seeded `ctx.rng` | movement/fire requests |
| Hazards | `Hazard` component plus per-contact sim state | deterministic contact facts | `DamageRequested` |
| Presentation | `GameplayPresentation` and later MVC models (`sim: false`) | read-only sim state | sprites, camera, audio, VFX and UI; never gameplay writes |

Schema is split by feature under `schema/`. Runtime modules mirror those features under `src/`.
Each feature exports a small set of systems from `src/main.ts`; internal helpers remain inside the
feature. Cross-feature behavior uses schema contracts and events rather than importing another
feature's system internals.

## System stages

| Stage | Responsibility |
| --- | --- |
| `PreUpdate` | Consume recorded input events and store intent. `CapturePlayerIntent` is the executable boundary example. |
| `Update` | Advance movement, weapons, projectiles, enemy decisions and hazards from sim state and fixed `ctx.dt`. |
| `PostUpdate` | Resolve damage/death, evaluate exit/death flow, and emit outcome facts after gameplay updates. |
| `LateUpdate` | Derive presentation-only state, camera, sprites, animation, audio, VFX and MVC view models. It may not write sim state. |

Ordering is explicit with stable system names and `after` dependencies. A feature should use
`runOn`, `runIf`, changed queries or `skipUnchanged` when its declared inputs permit it. Structural
changes go through the command buffer and become visible at the documented end-of-step boundary.

## Input boundary

Keyboard and gamepad bindings live in `input.json`. The engine records their named action values in
the fixed-step input frame and exposes deterministic `ActionState` components. `MapInputActions`
normalizes those device-independent states into `PlayerActionState` and `MenuIntent`; direct UI
adapters may emit `PlayerIntent`. `CapturePlayerIntent` then writes `PlayerControl` from either
source, with direct intents taking precedence. The simulation never
polls DOM, keyboard, gamepad, UI or service APIs directly.

An adapter emits the normalized held movement value in `[-1, 1]`, held crouch/fire/jump state and
jump, dash, pause and menu action edges. `CapturePlayerIntent` stores held movement and crouch plus
the jump edge and held state separately. The resolved edge is unconditionally overwritten in
`PlayerStepInput` and consumed in the same fixed step, so vertical movement can buffer only the edge
and apply a deterministic early-release cut from the held transition. An edge cannot remain sticky
across later fixed steps. If multiple
samples arrive in one step, their recorded order is authoritative and the last held movement sample
wins. Menus and MVC views request a sim change by emitting an intent event; they do not mutate the
world.

## Simulation rules

- Store every value that can change an outcome in a `sim: true` component, resource, event or
  versioned document. Module variables may contain immutable constants or fully overwritten scratch
  buffers only.
- Use `ctx.step`, fixed `ctx.dt`, `ctx.rng` and deterministic `math.*`. Do not use wall clocks,
  timers, `Math.random`, render frames or unordered collections.
- Prefer facts over commands between features: combat emits `ActorDied`; game flow decides whether
  that means retry, completion or another phase.
- Content values belong in components, prefabs, scenes or tunable data rather than per-level code.
- `Player` owns horizontal speed, acceleration, braking, air-control, jump, gravity, grace-window and
  air-jump configuration. `PlayerMotion` owns authoritative horizontal/vertical velocity, grounded
  state, facing and the fixed-step coyote/buffer/air-jump counters. Collision code owns only
  `PlayerGroundContact`; vertical movement reads that fact, owns the derived grounded state and
  ignores stale contact until separation after a jump. It remains independent of collision and
  presentation.
- Sim systems never read `sim: false` types. Presentation systems may read sim state but can return
  requests only through recorded input events.

## Presentation boundary

`BuildGameplayPresentation` demonstrates the allowed direction by copying observable held movement state and
phase into the non-hashed `GameplayPresentation` resource during `LateUpdate`. Future controllers
will map sim state into typed MVC models; views render those models and raise intents. Animation,
camera smoothing, screenshake, particles, audio variation and device-quality choices stay entirely
on this side of the boundary.

Presentation can drop or interpolate frames without changing a result. Gameplay never waits for an
animation or reads a camera transform; matching simulation timers own those decisions.

## Test contract

T0 `worldTest`s drive `PlayerIntent` through the recorded input API and assert simulation state.
The boundary tests also assert the derived presentation snapshot and the deterministic ordering rule
for multiple intents in one step. Gameplay additions must extend this pattern with outcome tests;
complete release-critical flows gain replays, while visual behavior uses T1 render tests and reviewed
goldens. V8/Hermes parity and cooked smoke checks remain release gates.

## Growth rules

Add behavior inside the owning feature, not to a central gameplay switch. Add a schema contract only
when another feature needs to observe a stable fact. Keep systems single-purpose so hot loops can be
measured and moved to Rust later without changing the TypeScript reference. The first vertical slice
should validate these boundaries before reusable packages or generalized framework layers are
introduced.
