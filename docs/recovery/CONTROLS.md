# Recovery #68 — controls and gameplay-first UI

The run boots with all five presentation choices enabled and the comparison panel closed.
The visible FEEL [C] launcher opens an optional compact panel; C closes it, 1 selects Baseline,
and 2 selects Polished. Both presets are also real pointer/touch buttons. Individual controls
show their enabled state. No audio tail implementation timings appear in the player UI.

Keyboard: arrows or A/D move, Up/W/Space jump, Down/S crouch, either Shift dashes, F fires,
Escape/P pauses. Left mouse fires while held; right mouse jumps with hold-sensitive jump height.
Existing gamepad bindings remain, X also dashes and Select toggles comparison. Enter/A confirms
menus; arrows/W/S/stick select; Q/B returns. Existing WASD/F/P controls are retained.

The installed action-map parser supports keys, key axes, gamepad buttons and axes, but rejects
mouse binding variants. MapPointerControls therefore consumes the engine's recorded and UI-filtered
pointer events in PreUpdate, after flow changes and before player intent capture. Its three small
schema booleans are deterministic recorded state. Pointer cancel clears both controls. Menus clear
held pointer state, and resuming does not resurrect a mouse press from a previous gameplay phase.
Keyboard and mouse combine without a pointer release cancelling keyboard fire or jump.

MapComparisonControls consumes action press edges in LateUpdate. Shortcuts and view intents are
accepted only while Playing. Leaving Playing closes the panel and removes its launcher; stale
menu presses cannot change choices or reopen it on resume. Comparison choices remain presentation
only and do not change movement/combat rules.

Desktop HUD reserve drops from 184 reference pixels to 73 at 1920x1080/scale1: the HUD contains
health, sector, dash state and pause in one compact row. At dense phone sizes the controller
computes the minimum reference height needed to keep real controls at least 44 logical points,
then FitGameplayFrame reserves that exact height. Safe area, full 12x6.75 gameplay frame and
44-point controls are tested at eight landscape extremes. Static views use retained model updates;
there is no continuously animated menu chrome.

Focused validation:

    SEWER_SCENE_PROFILE=1 ./tools/gameengine test --filter 'recovery controls*' --tier t0,t1 --jobs 1 --json

Seven focused V8 tests pass: polished defaults, normal keyboard aliases, shortcut phase safety,
left mouse fire/release, pointer cancel/pause/keyboard combination, actual UI preset clicks and
all eight real HUD/comparison safe-area extremes, and right mouse jump/cancel/menu clearing.
The right mouse test uses the same `test.input` host op as TestInput.pointer because that helper
currently fixes button to zero. This direct host access is test-only.

Integration: export MapComparisonControls and MapPointerControls from main.ts. The coordinator
owns final whole-game checks, refreshed visual samples/goldens and pipeline recording. Prior UI
tests that assume hidden comparison or the old enormous HUD must be adapted to the new accepted
product behavior; preview-only models need a viewport-derived `controlHeight` when checking
phone touch targets. Browser delivery remains an engine limitation, unchanged by this ticket.
