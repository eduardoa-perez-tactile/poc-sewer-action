---
name: vfx-materials
version: 1.12.1
tier: optional
description: Authoring particle effects (*.vfx.json data, or *.vfx.ts code) and materials (*.material.ts, *.mat.json) in Game Engine — per-entity values (MaterialParams), camera inputs, culling, fog, decals and depth offsets, slider ranges for the editor's Shader Lab, `gameengine material preview` (on the model a material is drawn on, as a device cooks its textures, with the UV checker), `material uses` and `texture inspect`. Use for visual effects, shaders and look development, and when porting Unity materials; the `vfx` skill has the effect workflow in depth.
---

# VFX and materials

**Effects** (`assets/fx/*.vfx.json`), GPU on mobile and up, CPU on compat. The data form is the
default: the editor's VFX mode and `gameengine vfx set|preview|stats` edit and check it. The
**`vfx` skill** has the preview → adjust loop, recipes and mobile budgets.

```json
{ "$schemaVersion": 1, "name": "Sparks", "emitters": [
  { "name": "burst", "capacity": 256, "bursts": [{ "at": 0, "count": 80 }], "loop": false,
    "shape": { "kind": "cone", "angle": 0.3, "radius": 0.1 }, "lifetime": [0.4, 0.8], "speed": [3, 6],
    "gravity": [0, -9.8, 0], "size": [0.05, 0.1], "color": [1, 0.651, 0.147, 1],
    "colorOverLife": [[0, 1, 1, 1, 1], [1, 1, 0.147, 0.042, 0]], "blend": "additive" } ] }
```

Code-driven effects use the DSL in `*.vfx.ts` (`pnpm gen` compiles them to `*.vfx.gen.json`;
`gameengine vfx convert` turns one into data):

```ts
export default effect('Sparks', [
  emitter('burst', {
    capacity: 256, bursts: [{ at: 0, count: 80 }], loop: false,
    shape: cone(0.3, 0.1), lifetime: [0.4, 0.8], speed: [3, 6], gravity: [0, -9.8, 0],
    size: [0.05, 0.1], color: '#ffd36b', colorOverLife: gradient([0, '#ffffff', 1], [1, '#ff6b3a', 0]),
    blend: 'additive',
  }),
]);
```

- Effects are presentation only: they never change sim state.
- Many instances of one effect share one draw per emitter, and `burstAt(system, positions)` plays
  many pops from one stopped system; the rules are in skill `vfx` (ADR 0092).
- Look at every change: `gameengine vfx preview <effect> --out fx.png` (contact sheet), and
  `gameengine vfx stats <effect> --device android-low-compat` before shipping.
- **Materials** (`assets/materials/*.material.ts`) compile to WGSL for every tier. Check with `gameengine material validate` and look with `gameengine material preview <key> --out m.png`
  (`--mesh sphere|cube|plane|cylinder|torus|cloth|quad|<mesh key>|used`, `--yaw`/`--pitch` radians, `--time s` for animated
  shaders, `--light studio|flat`, `--environment env/x.hdr --background environment`; MCP `material_preview`).
  Look after every edit, and at two or three times when the shader animates. The editor's **Shader Lab** mode
  follows your edits live: it hot-reloads the preview, highlights what changed and keeps a version history.
- **Preview on the right model, as a device sees it** (ADR 0107): `--mesh used` previews on the model the
  material is drawn on (`gameengine material uses <key>` lists the scene, prefab and data-asset sites and models that fit,
  and says when a mesh lacks UVs or vertex colours the material reads; MCP `material_uses`). `--device
  android|android-etc2|ios|desktop` shows textures as that device's GPU samples them after the cook (`android-etc2`:
  an Android GPU without ASTC, where the universal cook becomes ETC2; `compare`: the editor's look, Android's with
  and without ASTC, and iOS's side by side in one image; add `--class phone-low` for that class's overrides): compressed and decoded back, with the
  mipmaps and colour space their `.gmeta` gives. `--test-texture` draws the built-in UV checker
  (`builtin:uv-checker`, tiles A1–H8, a fine-stripe row) in the albedo slots; `--mesh cloth` is a draped
  panel with clean UVs. The Shader Lab has all three (mesh list "Used by this material", "Textures", "UV
  checker").
- **Textures for materials:** give each one `kind = "texture"` in its `.gmeta` (the default `sprite` cooks
  without mipmaps: smooth in the editor, shimmering on a phone) and `srgb = false` for normal maps and masks;
  `gameengine validate` warns about both (`W_TEXTURE_MIPS`, `W_TEXTURE_SRGB`) and about one-texel stripes and
  checks that compression smears (`W_TEXTURE_DETAIL`). `gameengine texture inspect <key> --device android,ios`
  writes the cooked texels, the difference from the source, every mip level and the size each memory class
  uploads (`--sheet file.png`: source, cooked and difference in one image; MCP `texture_inspect` returns it).
- **A visual bug seen on a phone** (shimmer, moiré, blocky or wrong colours): `material_preview` with `device:
  "compare"`, `deviceClass: "phone-low"`, `mesh: "used"` shows it next to the editor's look, and its warnings say
  which `.gmeta` setting causes it; fix, preview again, then `gameengine validate`.
- **Cheaper on low-end phones** (skill `device-tiers`): `material('Gem', { …, fallback:
  'materials/plastic.mat.json', overrides: { compat: { use: 'materials/flat.material.ts' } } })`.
  `use` draws another material on that tier or memory class; `fallback` is drawn when the material
  cannot load or build on the device. A `.mat.json` takes `"overrides": { "phone-low": { "use":
  "…" } }` or per-device `params`. Look at each version with `gameengine material preview <key>
  --tier mobile --class phone-low`; `validate` reports a missing target (`E_OVERRIDE_USE`). Neither
  moves `pipelines.json` records.
- **Hand-tunable params:** give scalar params a slider range, which the Shader Lab shows:
  `glow: uniform.f32(0.6, { min: 0, max: 2, step: 0.05, doc: 'emission strength' })`. Colours
  (`uniform.color`) get a picker. Designers tune values in `*.mat.json` instances
  (`{ "material": "materials/x.material.ts", "params": { "glow": 1.2 } }`), which need no compile.
- **Per-frame globals** (Unity's `Shader.SetGlobalVector`): material params are fixed per asset,
  so values that change every frame go in the presentation resource `MaterialGlobals`
  (`v0`…`v7`, `vec4`, zeros until set). A `LateUpdate` system writes it; any material reads
  `materialGlobal(i)` (`vec4f`, `i` 0–7) — in the forward, prepass and shadow passes alike.
  Never write it from sim code. A hole in the ground:

```ts
// assets/materials/hole_ground.material.ts — cut a disc (centre .xz, radius .w)
export default material('HoleGround', {
  blend: 'mask',
  surface: () => {
    const hole = materialGlobal(0);
    const d = length(worldPosition().swizzle('xz').sub(hole.swizzle('xz')));
    return pbr({ baseColor: color('#6a8f4e').rgb, alpha: smoothstep(hole.w, hole.w.add(0.02), d) });
  },
});

// src/hole.ts — Hole is a game component on the hole entity
export const HoleGlobals = defineSystem({
  name: 'HoleGlobals',
  stage: 'LateUpdate',
  query: query(read(Hole), read(WorldTransform)),
  resources: [write(MaterialGlobals)],
  run(ctx, q) {
    for (const c of q.chunks()) {
      const m = c.col(WorldTransform).matrix; // column-major: translation at 12..14
      if (c.length > 0) ctx.set(MaterialGlobals, { v0: [m[12]!, 0, m[14]!, c.col(Hole).radius[0]!] });
    }
  },
});
```
- **Vertex offset** (wind, sway, spirals): `vertexOffset: (params) => vec3` adds a world-space
  offset to each vertex, in the lit and shadow passes alike. It reads `uv()`, `worldPosition()`,
  `worldNormal()`, `vertexColor()`, `time()`, params and `materialGlobal(i)`; no textures.
  **Decals**: `depthOffset: 0.01` (world units towards the camera) wins the depth test against the
  surface underneath without lifting the decal. Coplanar surfaces with equal depth offsets resolve
  the same on every tier (the later draw wins); pick a winner with `depthOffset`, not draw order.
  **Screen space**: `screenUV()` (0..1, y down).
  **Two-sided**: `frontFacing()` (1 or 0) with `doubleSided: true`. **Object space** (both
  stages): `objectPosition()` (pivot in world space), `objectToWorld(v)` (object-space direction
  → world, rotated and scaled), `objectScale()`; e.g. a liquid level that stays level:
  `step(worldPosition().y.sub(objectPosition().y), objectScale().y.mul(fill))`.
- **Per-entity values** (Unity's `MaterialPropertyBlock`): put `MaterialParams` next to the
  `MeshRenderer` — `params` (a `vec4`, read with `instanceParams()` in both stages) and
  `depthOffset` (added to the material's). Entities sharing mesh and material still draw as one
  instanced batch. Do not pack values into `MeshRenderer.color`; that stays the tint.
- **Camera** (both stages): `cameraPosition()`, `cameraForward()`, `cameraRight()`, `cameraUp()`,
  `worldToView(p)`. Shadow passes see the camera the shadows are for. A billboard in
  `vertexOffset`: `cameraRight().mul(uv().x.sub(0.5)).add(cameraUp().mul(uv().y.sub(0.5)))`.
- **Culling**: `cull: 'back' | 'front' | 'none'` (`none` = `doubleSided: true`); a `*.mat.json`
  instance may override `cull`. `front` draws the inside of a shell (a sky dome, a portal).
- **Fog**: a `Fog` component (on a camera, or anywhere for every camera) fogs every 3D material
  in the forward pass — linear, exponential or exponential squared, with height falloff. Opt out
  with `fog: false` and apply `fogFactor()` yourself (0..1). Sky, sprites and particles are not
  fogged.

```ts
export default material('Grass', {
  params: { sway: uniform.f32(0.15) },
  surface: () => pbr({ baseColor: color('#4f8a3a').rgb }),
  // vertex colour r: 0 at the root, 1 at the tip
  vertexOffset: ({ sway }) => vec3(sin(time().mul(2).add(worldPosition().x)).mul(sway).mul(vertexColor().r), 0, 0),
});
```
- Keep draw calls inside the budget (`drawCallsMax`); `gameengine test --tier t1` reports it.
- **Loading views** (`RenderStatus`, presentation resource, written before `LateUpdate`):
  `frame`, `pendingAssets` (assets the last rendered frame waited for), `pendingPipelines`
  (warm-up pipelines not compiled yet). Show a loading view until `frame` has passed the frame
  the level spawned on and `pendingAssets + pendingPipelines` has stayed 0 for a few frames.
  Headless sessions, tests and no-GPU hosts report 0 and keep counting frames.

```ts
// src/loading.ts — LoadingState is a game resource ({ spawnFrame, quietFrames, visible })
export const LoadingView = defineSystem({
  name: 'LoadingView',
  stage: 'LateUpdate',
  resources: [read(RenderStatus), write(LoadingState)],
  run(ctx) {
    const s = ctx.get(RenderStatus);
    const l = ctx.get(LoadingState);
    if (!l.visible) return;
    const quiet = s.frame > l.spawnFrame && s.pendingAssets + s.pendingPipelines === 0 ? l.quietFrames + 1 : 0;
    ctx.set(LoadingState, { quietFrames: quiet, visible: quiet < 3 }); // the UI controller hides the view
  },
});
```
