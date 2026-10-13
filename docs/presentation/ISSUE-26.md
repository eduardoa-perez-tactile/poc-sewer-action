# Game-feel comparison

Issue #26 adds an optional comparison ribbon for camera shake, camera recoil presentation,
combat/water particles, soldier damage flashes and consequential audio. Baseline turns all five
off; Polished turns all five on; individual choices display Custom. Gameplay keeps running.
The ribbon occupies less than 23% of the safe viewport height at the tested landscape extremes;
it leaves the lower action area visible without changing WorldView, projection or input mapping.

## Product configuration and inspection

`assets/settings/game-feel.json` is the shipped default. Its `exposure` is an explicit product
choice, used in cooked/release builds exactly as in development:

| Exposure | Behavior |
|---|---|
| `hidden` (default) | No view/launcher; open and comparison intents are rejected. |
| `developer` | No launcher. The optional `feel.open` presentation cheat opens the panel on development/QA builds. Release strips the cheat unless explicitly enabled in build configuration. |
| `bonus` | A Game feel button opens the ribbon. Its Close button restores that launcher. |

The initial layer values retain the pre-#26 look: particles, flashes and audio ON, new shot
shake and camera kick OFF. Choose Polished to enable all five. Change the JSON to `bonus`, then
start/restart Play with `./tools/gameengine run`; click Game feel and either preset. For developer
exposure, `./tools/gameengine cheat run feel.open`, then step the paused session. The hidden policy
also applies to that shortcut. A/D, W, Shift and F retain their existing movement/jump/dash/fire
behavior while the panel is open. Closing the ribbon keeps its layer choices; checkpoint restart
keeps them too, while a fresh world reinitializes from authored content.

`scenes/comparison.scene.json` is a first-room comparison fixture with a presentation-only
configuration reference to `settings/game-feel-bonus.json`. Run it with
`./tools/gameengine run --scene scenes/comparison.scene.json`. The default complete route and
first-room scenes reference the hidden product config explicitly; a test-scene profile cannot
inherit another scene's bonus exposure. No title, HUD, pause, death or completion surface is added.

Tune initial layers/exposure in the settings data. Tune ribbon structure, labels, colors and
button styles in `ui/comparison-panel.ui.json`, `ui/comparison-button.ui.json` and
`ui/comparison.style.css`. Shot camera amplitudes/durations live in
`src/comparison/drive-shot-feedback.ts`. Existing VFX clips/capacities and sound cues remain their
original authored content. Font styling is scoped to `.comparison-screen`, preserving existing
boot-cover/golden pixels. The 35,220-byte Abel font comes from
[Google Fonts](https://github.com/google/fonts/tree/main/ofl/abel), with its SIL OFL license next to it.

One standalone Polished-panel capture was inspected after objective layout/intent checks; it had
no render warnings and readable, separate controls. Preview it in the editor's Views mode as
Comparison, using original/baseline/polished/launcher samples. CLI preview without exporting another
image: `./tools/gameengine view preview Comparison --sample polished`.

## Separation and edge behavior

All mutable choices, initialization/deduplication and effect state live in `sim: false` resources.
The view reads only its model and raises intents. Its controller subscribes only to comparison
fields and sends desired-state presentation requests; retained requests are idempotent. Only
LateUpdate adapters consume those requests/state. No simulation system imports or reads the choices.

The weapon's actual horizontal recoil remains authoritative and identical in every mode. The
comparison recoil is only a small camera bump. Disabled shake/kick clear their transient state
on the presented frame. Disabling particles clears the existing fixed combat hosts and water
splash; suppressed timestamps are consumed so re-enabling cannot resurrect old effects. Disabling
flashes restores normal actor/proxy tint, without removing damage, hit reactions or attack clocks.

Audio OFF skips new cues on all six lanes; already-started finite one-shot tails finish within
1.104 seconds. This is also stated in the panel. The public audio API has no owned-voice stop
operation. Global SFX/Voice bus volumes and player settings are never changed. Re-enabling does
not replay suppressed/retained cues. The existing per-sound caps sum to nine, below phone-low's
12-voice cap; no new audio assets, looping voices, RNG calls or gameplay triggers are introduced.

The panel has no transitions, polling timers, loops, UI particles or continuously changing model.
It updates only when a comparison field changes and closes its own handle on controller disposal.
Inactive feedback systems remain event/change/active-gated; finite effects settle. Enemy tint now
updates only changed actors, with one full refresh when the flash choice changes. The existing
soldier visual lookup stays bounded at eight actors and should be revised before expanding content.

## Verification

Focused tests cover typed product configuration, model presets, each intent and layer, hidden and
developer policies, retained requests, actual hit-tested bonus launcher/controls, continuing
movement, cancellation/re-enable/restart behavior, all audio lanes, capped voices and finite tails.
T1 checks all view samples at landscape fold-cover/21:9/notched/SE/tablet/fold-inner sizes plus
800×600 and 2560×1080 desktop windows. Controls remain inside the safe area and non-overlapping.
A static-panel check holds its model/layout over 240 further steps after feedback/audio settle.
The complete Polished route also samples draw/atlas budgets every step.

Both Baseline and Polished run the original deterministic control pilot through all ordered beats
and final phases. Each asserts the full-route rolling hash digest `8c00b28d`, the same victory and
final snapshot hash, rather than just a final outcome. CLI trace diff also matches the original
706-step stream exactly. Every prior T0 hash trace, replay input/hash/checkpoint, render golden,
atlas/draw budget and pool remains unchanged. The original pilot was extracted into a shared test
helper so comparisons run identical controls and assertions.

The new recorded comparison flow has its own scene profile and structural budget; existing
profiles/budgets remain unchanged. Fresh pipeline recording unions all three scene profiles.
The new optional ribbon has its own draw allowance, without increasing any existing gameplay cap.
Full validation and performance results are recorded below after the final harness run.

V8 is the established Harness. Hermes was attempted and cannot run: missing Hermes host, tracked
by issue #6. The engine still has no browser packaging target. Those are separate from desktop
V8 verification. Real phone GPU timings, thermals, cold loading and actual idle presentation skips
need device/window measurement; headless stable-layout checks do not claim physical frame skipping.

Final local V8 coverage: 138 T0/T1 tests in each of the three authored scene profiles, nine replay
verifications and eight structural budgets. New comparison fixture peak is 9/10 draws; open
Polished over the whole route peaks at 12/12 with no more than five atlas pages. The default
complete route remains 10/10. Every budget has zero play-time pipelines and zero GC pauses over
4 ms. Fresh recording adds only the Text pipeline to the existing union: five records per tier.

One sequential sample per version on Apple M2 Max, release desktop V8, mobile tier, paused
headless/no-GPU sessions with UI layout enabled. The same complete replay was driven as 353
individual two-step calls (706 fixed steps). CLI pauses introduce many idle presentation ticks:
sim step p95 is relative host evidence, while presentation/script percentiles mix active and
paused work. One sample is not a speedup/regression or real-phone compliance claim.

| Metric | Before ef1bad9 | Hidden / original | Open / Polished |
|---|---:|---:|---:|
| Sim step p95 | 0.696 ms | 0.684 ms | 0.729 ms |
| Mixed presentation p95 | 0.370 ms | 0.397 ms | 0.433 ms |
| Mixed script p95 | 0.691 ms | 0.733 ms | 0.732 ms |
| RSS | 72.19 MiB | 74.81 MiB | 74.02 MiB |
| JS heap | 9.12 MiB | 10.59 MiB | 8.42 MiB |
| Maximum GC | 0.749 ms | 0.207 ms | 0.201 ms |
| Hitch steps / GC pauses >4 ms | 0 / 0 | 0 / 0 | 0 / 0 |

After 240 extra settled steps, all 14 gameplay/presentation adapters and ApplyComparison report
zero marker time; ComparisonUI is 0.0295 ms and the existing cheat console 0.001584 ms. This shows
bounded idle script behavior, not skipped physical frames. T1 separately confirms voices/effects
settle and the panel model/layout stays still. No-GPU sessions cannot measure font GPU allocation,
audio output thread, renderer skips, GPU time or thermals.

Android phone-low cook reports unchanged residency 2,905,344 bytes / 192 MiB and audio 297,504 bytes
/ 32 MiB. The report excludes font/glyph `other` bytes from its resident total: additionally account
for 35,220 font bytes plus 335,018 baked glyph bytes (about 0.353 MiB); real GPU glyph pages need a
device measurement. Existing atlas art and pools are unchanged. No package-size claim is made:
the installed engine still lacks its Android package template.

Architecture review has no remaining must/should findings. Mobile performance review has no
blocking finding; its medium observation is tight draw headroom (comparison 9/10, optional complete
12/12, default complete 10/10). Preserve those caps and measure on a phone before adding art or
continuous feedback. The inherited soldier actor-map allocation remains bounded at eight actors.
