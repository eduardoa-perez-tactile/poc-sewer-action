---
name: ship-mobile
version: 1.10.1
tier: required
description: Building, running and measuring the game on phones — probe builds, devices, `gameengine device perf`, the T2 lab, OTA updates, what a build ships (bundles, cheats, plugins), the release gate on pipelines.json and the frame-rate cap. Use for anything that must run on a real device.
---

# Shipping to mobile

| Goal | Command |
|---|---|
| Toolchain check | `gameengine doctor` |
| Device build with the debug protocol | `gameengine build android --config probe` (or `ios`) |
| Install, run, inspect | `gameengine device install`, `gameengine device run`, `gameengine device logs --follow`, `gameengine device screenshot` |
| Performance on the phone (Android, dev/probe build) | `gameengine device perf [--seconds 20] [--json]`: the 20 s performance report, CPU per thread, `dumpsys meminfo` |
| All attached phones, one command (builds the probes) | `gameengine lab phones tests/lab/t2.json` (`--dry-run` to see what counts) |
| Parity + budgets on devices | `gameengine lab run tests/lab/t2.json --devices android-low-mid-mali --build android=<apk>` |
| Store build | `gameengine build android --config release --upload` |
| Script-only update | `gameengine ota pack --version N --key key.json` |
| What a build ships (modules, cooked files, features, unused and unshipped assets, cheats) | `gameengine build android --dry-run --config release --report` (`--json` for data) |
| The cooked game boots | `gameengine check` (validate, cook, a headless smoke run of the desktop cook that fails on a data asset or streamed cell read from storage mid-frame, ADR 0089, or an asset-group member it cannot read; a `pipelines` warning), `gameengine test --cooked` |
| Pipeline warm-up for every tier | `gameengine test --tier t1 --record-pipelines` (skill `testing`) |

- Android device builds link a pinned V8 build from the engine repo's private release: run `gh auth login` and `node third_party/fetch.mjs v8` in the engine checkout once; `gameengine doctor` shows whether it is there.
- Budgets per device class live in `tests/budgets/*.json`; the lab fails on script time, GC pauses, heap, frame time.
- **Measure probe builds, not dev builds.** A dev build is a debuggable APK with Dawn validation and debug logging on; a probe build is release-optimised with the debug protocol. On a probe build on the phone: `gameengine device perf` (its `setup:` line says which profile, tier, render scale, msaa, hdr and memory class the device got), a Perfetto trace for the timeline (engine sections `frame`, `sim.step`, `script.*`, `render.*`, `present`), `gameengine device logs` for `hitch pipeline` and `memory` lines. Recipes: skill `mobile-performance-review`.
- **Release builds refuse a pipeline warm-up that is not ready**: `gameengine build android|ios --config release` stops when `pipelines.json` is missing, lacks a GPU tier (desktop, mobile, compat), names a material program no compiled material has, is older than a `*.material.ts`, or nothing can record it (no `tests/budgets/*.json` with a `structural` block and a `replay`). Re-record with `gameengine test --tier t1 --record-pipelines` and commit the file; `--allow-pipeline-issues` ships anyway (devices then compile those pipelines in play). Dev and probe builds and `gameengine check` only warn.
- Run the lab from the checkout that built the probe: its pairing key is what the device accepts.
- Rust systems (`native/`) change the binary: they ship in a store build, not over the air.
- Engine library size: `--report` prints `libgameengine (arm64-v8a): N MB linked and stripped, as the APK carries it` — the static library cargo builds (~300 MB: all of V8, debug info) is linked with unreached code dropped and stripped by the Android build (~41 MB for arm64 at V8 + the engine). The shell hides the static library's symbols, so the linker drops what the `gameengine_*` entry points never reach; `--report --json` has the number as `libs.<abi>.libgameengineLinked` (null without an NDK clang). Compare that number, not the static library, with an APK budget; it needs the NDK, and a `--dry-run` measures the library the last real build left (dev and probe ones carry the debug protocol).
- Device builds ship minified code with `DEV` false: put debug-only presentation code (overlays, extra logs) under `if (DEV)` with `import { DEV } from '@gameengine/runtime'` and it is removed. Never let sim state depend on `DEV`.
- Cheats (`src/**/*.cheats.ts`, skill `cheats`) ship in dev and probe builds and are left out of release builds unless you pass `--cheats` or set `"cheats": { "release": true }`; `--report` says `cheats: included`. Nothing may import a `*.cheats.ts` file: a release build that reaches one fails.
- Low-end phones have their overrides (skill `device-tiers`): `gameengine validate` is clean and
  a T1 run at `--memory-class phone-low` passes; measure a probe build on a `phone-low` phone
  (about 3 GB RAM, Mali-G52-class GPU) before shipping.
- Phones run at most 60 fps whatever the display (ADR 0079), and the `compat` tier and `phone-low` phones (3 GB RAM or less) 30 unless the project sets `render.targetFps.compat` / `render.targetFps["phone-low"]` (ADR 0102; a deliberate per-project choice, measured on such a phone); lower it per screen with `quality.setTargetFps(30)` (skill `mobile-performance-review`).
- `validate` (and so `check` and every build) fails with `E_PLUGIN` when code uses a service no enabled plugin implements; `haptics`, `keyboard` and `net` are built in; `push`, `system`, `cloudsave` and project services need their plugin in `plugins` (skill `platform-services`).
- Cooked builds ship scenes only from `scenes/` and prefabs only from `prefabs/`; the engine refuses other document paths in dev too, and `gameengine check` boots the cooked game before you build. Dev and probe builds draw the latest error as a red banner over the game (release builds only log it): a device stuck on a loading cover shows why.
- Never import `@gameengine/test`, the engine's `examples/services/*` (copy those into the project) or anything from `tests/`, `tools/`, `editor/` or `playable-ads/` in game code: the cook fails. Built-in packages a game switches on (`project.gameengine.json` `packages`) and npm packages ship their code, never their `editor/`, `tools/`, `dev/` or `tests/`.
- `project.gameengine.json`, `input.json`, `pipelines.json` and `services.gen.json` ship to the device as they are: never put secrets there (SDK keys are `"env:NAME"`; store builds drop `services.mocks`). Only files a bundle's `include` matches ship (samples use `"**"`): the cook warns about the rest, and `--report` lists them as "files no bundle includes" next to files nothing names. A bundle's `exclude` globs keep files out on purpose (source art kept for baking): no warning, listed as "files bundles exclude". Smaller textures: `compression = "astc6x6"` in a texture's `.gmeta` (skill `asset-memory`); sounds: skill `audio` (its pre-ship checklist).

## App icons and launch screen (`branding`)

`branding` in `project.gameengine.json` (editor: Build ▸ App Icons & Launch Screen…):

```json
"branding": {
  "icons": { "active": "default", "sets": {
    "default": { "source": "branding/icon.png",
                 "ios": { "dark": "branding/icon-dark.png" },
                 "android": { "foreground": "branding/icon-fg.png", "background": "#1a0f2e" } } } },
  "launch": { "image": "branding/launch.png", "background": "#1a0f2e", "fit": "cover" }
}
```

- `source`: square PNG ≥ 1024 px, full bleed, no transparency (iOS flattens it onto black). Android `foreground`: ≥ 432 px on transparency, art inside the centred 66/108.
- Set ids are lower case (`[a-z][a-z0-9_]*`); non-active sets ship as alternate icons.
- `gameengine build <platform> --dry-run --json` checks the images (errors stop the build) and writes the files; look at `storeIcons` in the report and `<project>/.gameengine/build/<platform>/<config>/store/` for the listing icons.
- Android 12+ splash is a centred icon on `launch.background`; the full `launch.image` is the engine's first frame. The file ships to devices: paths only, never secrets.
