---
name: models-3d
version: 1.5.0
tier: optional
description: 3D models, rigs and animation clips in Game Engine — importing FBX (straight from Unity or a DCC tool) and glTF/GLB as mesh assets, .gmeta import settings (lods, max_texture_size, material, FBX scale and rig = "generic"), models as prefabs, skinned meshes, Unity's model@clip.fbx animation files played through `file#clip` in *.animctrl.json, and checking imports with gameengine validate. Use when adding or porting any 3D model, character, rig or animation, and when a model looks wrong (size, orientation, missing texture, not animating).
---

# 3D models and animation clips

Models are mesh assets: drop `.fbx`, `.glb` or `.gltf` under `assets/`, and the engine imports
them (loose files in dev, cooked to `.lmesh` for devices; both go through the same importer, so
what you see in dev is what ships). No conversion step, no Blender round trip.

Every model comes out in the engine's space: **right-handed, Y up, +Z front, metres**. FBX
files are converted from their own axes and units (Maya/Unity centimetres, 3ds Max Z-up,
Blender) on import; glTF already is in that space.

## Import settings (`.gmeta`)

```toml
guid = "…"
importer = "mesh"

[settings]
lods = 2                 # simplified LODs after the full mesh (0–4)
max_texture_size = 2048  # cook-time cap for the model's textures
scale = 1.0              # FBX: multiplies after the unit conversion (Unity's Scale Factor)
rig = "generic"          # FBX: every node is a joint (see "Rigs" below)
material = "materials/toon.material.ts"  # every material of the file draws with this program
```

`material` swaps the shader of a whole model and keeps each of its materials' textures and
values: the `*.material.ts` declares the ones it reads under the built-in names
(`baseColorMap: texture2d()`, `normalMap`, `emissiveMap`, `baseColor`, …) and gets them per
sub-mesh, so a body and its clothes keep their own albedo under one custom shader (Unity: every
renderer's materials on the same custom shader). A `MeshRenderer.material` or `<Model material>`
override still replaces all of them with one material.

Low-end phones (skill `device-tiers`): `[settings.overrides.phone-low]` then `lod_bias = 1`
picks coarser LODs there (each step accepts a LOD with twice the screen error, −4..4), and a
texture's `.gmeta` `[settings.overrides.phone-low] max_size = 512` uploads a smaller mip from the
same cook. Under load the quality governor adds its own `lodBias` step; the phone-low settings
should fit without it. A model with `lods = 0` has nothing to bias: give heavy models LODs.

## Use a model

- **Draw the whole file:** `"MeshRenderer": { "mesh": "models/crate.fbx" }`.
- **One mesh of the file:** `models/crate.fbx#Lid` — FBX meshes are named after their node
  (`~1`, `~2` for repeated names), glTF meshes after the mesh.
- **As a prefab:** name the model file where a prefab goes (`spawnPrefab('assets/models/crate.fbx')`,
  drag it from the Project panel into the scene). A static model becomes a root plus one entity
  per node (`Name`, `LocalTransform`, `Parent`, `MeshRenderer file#Mesh`), with GUIDs from the
  node path, so prefab overrides survive re-imports. A **rigged or animated** model stays one
  entity drawing the whole file (its meshes follow the skeleton).

## Rigs and skinned meshes

The importer builds one skeleton per file from:

- the bones of every skin (FBX clusters, glTF skins), every FBX `LimbNode`, and every animated
  node, plus their ancestors;
- with `rig = "generic"`: **every node**. Use it for models whose clips animate plain transforms
  instead of bones (Unity "Generic" rigs made of separate parts, e.g. a creature built from separate parts): without
  it such a model has no joints for the clip to move.

A mesh that sits under a joint but has no skin follows that joint rigidly (props parented to a
hand, a part of a mechanical rig). Up to 4 weights per vertex are kept (the strongest).

## Animation clips

- Clips are resampled at 30 fps at import and compressed. glTF animations and FBX animation
  stacks (takes) become clips named after the animation/take.
- **Unity's `model@clip.fbx`:** keep the files as they are (`Hero.fbx`, `Hero@Walk.fbx`, …).
  A clip file with one take names its clip after the `@` (`Walk`). Play it on the model by
  naming the file: `"clip": "models/hero/Hero@Walk.fbx#Walk"`. Joints are matched **by
  name**, so any file whose joint names match the model's works (a shared animation library too).
- Animator controllers (`*.animctrl.json`) reference clips by name (`"Idle"`, a clip in the
  entity's own mesh file) or as `file#clip` (another file). Blend trees take either.

```json
{ "name": "Walk", "motion": { "clip": "models/hero/Hero@Walk.fbx#Walk" } }
```

`animClipLength(entity, 'models/hero/Hero@Walk.fbx#Walk')` returns the clip's seconds.

In a UI view (a dialogue portrait, a shop character) the same clips play on a `<Model>` without an
entity: `<Model mesh="models/hero/Hero.fbx" animation="models/hero/Hero@Talk.fbx#Talk" queue="models/hero/Hero@Idle.fbx#Idle" />`
on UI time, with `camera.target` to frame the head (skill `ui-mvc-views`).

## Props on bones (`BoneAttach`)

A separate entity (a hat, a weapon, an item in a hand, a swappable part) follows a joint of a
skinned mesh with `BoneAttach { rig, joint, space }` (ADR 0120): the renderer draws it, and every
mesh under it, where it posed that joint this frame, so clips, blends, layers and IK all carry it.

- `space: 'Joint'` (default) is Unity's "child of a bone": parent the prop to the rig, and its
  `LocalTransform` is its offset from the joint.
- `space: 'Bind'` keeps a prop placed on the rig in its bind pose (e.g. a static mesh exported in the
  rig's space) and moves it as the joint moves from there: rigid skinning to that joint.

```json
{ "name": "Hero", "id": "hero", "Animator": { "controller": "anim/hero.animctrl.json" },
  "LocalTransform": {}, "MeshRenderer": { "mesh": "models/hero.glb" },
  "children": [
    { "name": "Hat", "BoneAttach": { "joint": "Head", "rig": "@hero" },
      "LocalTransform": { "position": [0, 0.24, 0] }, "MeshRenderer": { "mesh": "models/hat.glb" } }
  ] }
```

It is presentation only, like the pose: the prop's `WorldTransform` stays where the sim puts it
(the hash ignores attachments), so sim code cannot read where a hand is. Only meshes follow:
particles, lights and sprites under the prop stay at its sim placement. A wrong joint name logs
`BoneAttach: no joint '…'` and the prop stays put; a rig that is hidden or still loading leaves it
at its sim placement too. Playable ads refuse it, as they refuse `Animator`. Example:
`samples/hero-stage/scenes/props.scene.json`.

## Unity → engine

| Unity | Here |
|---|---|
| Model `.fbx` + its textures | copy the `.fbx` and its texture files; textures are found relative to the FBX, beside it, or in a `Textures/` (or `Texture/`) folder beside it or one level up |
| Model import Scale Factor / Convert Units | automatic unit conversion; `scale` in the `.gmeta` for the Scale Factor |
| Rig: Generic, clips animate the transform hierarchy | `rig = "generic"` on the model's `.gmeta` |
| Rig: Generic/Humanoid with a skinned mesh | nothing to set (skins and bones import) |
| `Model@Clip.fbx` animation files | keep them; reference `Model@Clip.fbx#Clip` from the controller |
| Animation clip split ranges (clipAnimations in the `.meta`) | not imported: one clip per take; export takes separately or split in the DCC tool |
| Humanoid retargeting between different skeletons | not supported: clips play on skeletons with the same joint names (Generic behaviour) |
| Animator Controller | `*.animctrl.json` (parameters, states, transitions, blend trees, layers, events) |
| A `MeshRenderer` parented under a bone (hat, weapon) | an entity parented to the rig with `BoneAttach { rig, joint }` (§ Props on bones) |
| Material colour + albedo texture | base colour and base colour map (FBX colours are read as sRGB, as Unity does); normal and emission maps too |
| Mesh vertex colours (ignored by the Standard shader) | not imported from FBX: meshes come in white, so stray colour sets (Maya's black `SculptFreezeColorTemp`) don't darken them; a material that needs vertex colours takes a glTF/GLB model |
| Custom shaders, PSD/TGA textures | one shader on all of a model's materials, textures kept: `material = "…material.ts"` in its `.gmeta`; one material for everything: `MeshRenderer.material` (skill `vfx-materials`); PSD/TGA: convert to PNG/JPEG |
| `MaterialPropertyBlock` (per-renderer values) | `MaterialParams` component (`params` vec4 read by `instanceParams()`, `depthOffset`); instancing is kept |
| Shader `Cull Off` / `Cull Front` | `cull: 'none'` / `'front'` on the material |
| `RenderSettings.fog` | `Fog` component (linear, exp, exp², height falloff) on the camera or scene-wide |
| URP asset HDR off, Render Scale | `render.tiers.<tier>.hdr: false`, `renderScale` in `project.gameengine.json` |

Mirroring: Unity flips X to go left-handed; the engine is right-handed like glTF, so positions
you copy from a Unity scene need `x → -x` (and rotations mirrored) — the same as for glTF ports.

## Check an import

- `gameengine validate` imports every model as the cook does: `E_MESH` for a file that fails,
  `W_MESH` for an FBX texture it cannot find, and `E_ANIMCTRL` for a `file#clip` whose file is
  not a model or has no such clip (it lists the clips it has).
- `W_MESH` names the texture path the FBX recorded (often an artist's `..\Work\…\Body_4096.png`). The
  file is looked up by that name: when the Unity project holds a renamed or resized copy (`Body_1024.jpg`),
  copy it under the recorded name (PNG or JPEG) or give the model a material.
- Look at it: open a scene with the model and `gameengine screenshot`; wrong size means units
  (`scale`), lying on its side means the source axes were not written to the file (re-export
  with axis conversion, or rotate the entity), a still model means its clip matched no joint
  names (compare with the model's node names) or it needs `rig = "generic"`.

## Not imported

Blend shapes (morph targets), FBX lights and cameras, constraints, vertex caches, and more than
one UV set. Keep those in code or re-author them with engine features.
