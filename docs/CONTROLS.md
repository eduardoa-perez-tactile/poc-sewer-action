# Controls

Sewer Action uses named actions from `input.json`. The engine samples keyboard and standard
gamepad input, records the resulting action values in each fixed-step input frame, and exposes
them as deterministic `ActionState` components. `MapInputActions` converts those values to the
game's device-independent `PlayerActionState` resource and step-scoped `MenuIntent` events;
direct UI adapters use `PlayerIntent`. Gameplay never polls devices.

| Action | Keyboard | Standard gamepad |
| --- | --- | --- |
| Move | `A` / `D` | Left stick |
| Jump | `W` | South / A / Cross |
| Dash | Left Shift | Left shoulder / L1 |
| Shoot | `F` | Right trigger / R2 |
| Crouch | `S` | Right shoulder / R1 |
| Pause | `P` | Start / Options |
| Menu navigation | `W` / `A` / `S` / `D` | Left stick |
| Confirm | Enter | South / A / Cross |
| Back | `Q` | East / B / Circle |

The keyboard layout intentionally avoids browser-reserved navigation controls: Space, arrow keys,
Tab, Backspace and browser shortcuts are not bound. Keys are identified by physical `KeyboardEvent.code`
positions, so the layout remains consistent during action play.

The host owns device lifecycle. When its viewport loses focus or the app is backgrounded it clears
held keyboard and gamepad state before the next recorded input frame. The action adapter derives held
controls from the current `ActionState` every step and keeps action edges (`justPressed`) step-scoped,
so stale input cannot remain latched in simulation state.

The desktop/headless host verifies the action and neutralization contract today. The declared web
target must preserve the same host behavior when the engine's browser build becomes available;
browser packaging and an in-browser focus/blur smoke test remain part of the external web-target
release blocker documented in `PROJECT.md`.
