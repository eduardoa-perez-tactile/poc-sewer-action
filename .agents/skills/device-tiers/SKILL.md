---
name: device-tiers
version: 1.3.0
tier: required
description: Cheaper content per device in Game Engine — designing for phone-low first, and the `overrides` block keyed by GPU tier (compat, mobile, desktop) or memory class (phone-low, phone, tablet, desktop, memory.budgets names) in materials, VFX, texture and mesh .gmeta, post profiles, render.tiers and audio; how they merge (class over tier), what may differ (presentation only), quality.device(), the governor's vfx/lodBias steps, and how to check each on a device class (validate, material preview --class / --device, texture inspect, vfx stats --device, memory report --device, renderTest { memory }, --memory-class phone-low). Use when a game runs badly on low-end phones, when adding heavy content (an effect, material, big texture, 3D model, post profile), when adding a cheaper look for phone-low or compat, or when an override does not apply.
---

# Device tiers

Design: `docs/design.md` § 6 "Per-device content" and ADR 0103 in the engine repo. Working
example: `samples/orbit-garden` (`tests/tiers.test.ts`).

## Design for phone-low first

The weakest phone the game ships on sets the design; richer devices get extra, not the other way
round. A `phone-low` phone is about 3 GB of RAM, a Mali-G52-class GPU and a slow CPU, and runs
at **30 fps** unless the project opts up (ADR 0102): one frame is 33 ms for two 60 Hz sim steps
plus presentation. Before adding heavy content, decide what that phone draws:

- **Make a cheaper version** when the content is heavy on the GPU or memory: big alpha quads or
  dense particles (overdraw), multi-texture or lit materials, post profiles, textures at 1024 or
  more, high-poly 3D, many voices. Measure first: `vfx stats --device android-low-compat` over
  the overdraw budget, `memory report --device phone-low` over budget, or `device perf` frames
  over 33 ms (skill `mobile-performance-review`, budgets.md).
- **Keep the same version** when it is cheap already (a small sprite, a flat material): an
  override nobody needs is one more thing to keep in sync.
- **Never cut what the player needs to play**: what a tap hits, what scores, what the board
  shows. Cut density, resolution and polish (glow, secondary particles, post, shadows).

## Keys and merging

A device has two keys:
- its **GPU tier**: `compat`, `mobile`, `desktop` (after any device-profile lowering);
- its **memory class**: `phone-low` (3.3 GB of RAM or less, or any compat GPU), `phone`,
  `tablet`, `desktop`, or a `memory.budgets` name.

Content carries one `overrides` block. On a device the tier's entry merges over the base, then
the class's entry over that, so the class wins where both set a field. Objects merge, `null`
removes a field, anything else replaces. VFX emitters are addressed by name. Overrides resolve
when content loads and when the keys change, never per frame.

## Where it goes

| Content | Example |
|---|---|
| `*.mat.json` | `"overrides": { "phone-low": { "use": "materials/plastic.mat.json" } }` |
| `*.material.ts` | `material('Gem', { …, fallback: 'materials/plastic.mat.json', overrides: { compat: { use: 'materials/flat.material.ts' } } })` |
| `*.vfx.ts` / `*.vfx.json` | `effect('Confetti', [...], { overrides: { 'phone-low': { capacityScale: 0.5, rateScale: 0.5 }, compat: { emitters: { glow: { enabled: false } } } } })` |
| texture `.gmeta` | `[settings.overrides.phone-low]` then `max_size = 512` |
| mesh `.gmeta` | `[settings.overrides.phone-low]` then `lod_bias = 1` |
| `*.post.json` | `"overrides": { "phone-low": { "bloom": { "enabled": false } } }` |
| `render.tiers` in `project.gameengine.json` | `"phone-low": { "post": false, "renderScale": 0.8, "lighting2d": false }` |
| `audio` in `project.gameengine.json` | `"maxVoices": 32, "overrides": { "phone-low": { "maxVoices": 16 } }` |

- **Materials:** `use` draws another material (at most 4 hops). `fallback` is drawn when the
  material cannot load or build on the device. Neither moves `pipelines.json` records. Skill
  `vfx-materials`.
- **VFX:** `capacityScale` and `rateScale` (the rate also scales bursts); emitter fields by name,
  `enabled: false` to drop one; `use` draws another effect. All emitters disabled draws nothing.
  Skill `vfx`.
- **Textures:** `max_size` becomes a mip skip at upload, so one cook serves every device. A
  texture without mips is cooked with extra levels down to its smallest override. **Atlas
  sprites cannot take it** (`W_OVERRIDE_FIELD`): give a phone-low look by a smaller atlas group
  or `max_size` on the whole sprite (skill `atlasing`).
- **Per platform, not per device:** a texture's cooked *format* (and `quality`, `max_size`) can
  differ by iOS / Android / desktop with `[settings.platform.ios]` (`compression = "none"`) or
  the project default `textures.platform.android` in `project.gameengine.json` (ADR 0108). That
  is a cook setting, so it cannot go in `overrides` (`E_OVERRIDE_FIELD`); `gameengine texture
  inspect <key> --device ios,android` shows each platform's result.
- **Meshes:** each `lod_bias` step accepts a LOD with twice the screen error (−4..4). Skill
  `models-3d`.
- **Post:** `render.tiers.<key>.post` is `false` (no post: the lean 2D path) or a profile key
  that replaces every camera's profile.
- **Render settings:** `msaa`, `renderScale`, `post` and `lighting2d` follow a key change at
  run time; `hdr` and `shadow*` apply when the renderer starts.
- **Audio:** `audio.maxVoices` caps every sound's own `maxVoices`; a new sound steals the oldest
  voice of equal or lower priority. Skill `audio`.
- **Not yet:** UI views, fonts and 2D skeletons take no overrides; ship one version sized for
  phone-low.

## Rules

- **Presentation only.** Scenes, prefabs and data assets cannot have overrides
  (`E_OVERRIDE_SIM`): hashes and replays must be identical on every device. Gameplay is the same
  on every phone; only how it looks and sounds differs.
- **`quality.device()` is presentation only.** It returns `{ tier, memoryClass, qualityLevel,
  thermal }` for UI controllers and `LateUpdate` code (e.g. skip a decorative effect). It throws
  in sim systems and the `no-presentation-import-in-sim` lint flags it (skill `sim-boundaries`).
  Prefer an `overrides` block over code: it is checked by `validate` and shows in the reports.
- **The frame rate is a cap, not content.** `render.targetFps` takes the same keys, but the
  lowest applying entry wins. Raise `"phone-low"` only after `gameengine device perf` on such a
  phone shows frames fit 16.6 ms with headroom (skill `mobile-performance-review`).
- **The quality governor stacks on top.** Under load and heat it scales VFX further (`vfx`) and
  biases LODs (`lodBias`): the phone-low version should already fit without it.

## Check it

- `gameengine validate`: `W_OVERRIDE_KEY` (a typo such as `phone_low`, or an emitter name that
  matches nothing), `E_OVERRIDE_FIELD`, `E_OVERRIDE_USE`, `E_OVERRIDE_SIM`.
- `gameengine material preview <key> --tier mobile --class phone-low --out m.png`; add `--device android`
  (or `ios`) to see its textures as that family's cook leaves them (ADR 0107).
- `gameengine texture inspect <key> --device android,android-etc2,ios`: the cooked texels per device
  (`android-etc2`: a compat-tier Android GPU without ASTC, where textures arrive as ETC2), PSNR per
  mip level, and the size each memory class uploads after its `max_size`.
- `gameengine vfx stats <fx> --device android-low-compat` (prints the resolved tier and class).
- `gameengine memory report --device phone-low` (counts texture overrides).
- `gameengine test --memory-class phone-low`, or a `renderTest(…, { memory: 'phone-low' })`,
  resolves every override for that class and enforces its memory budget. To compare in one test,
  call `assets.setDeviceClass('phone-low')` and step.
- On a phone-low phone (`gameengine build android --config probe`, `gameengine device perf`):
  the `setup:` line names the tier and memory class the device resolved.
