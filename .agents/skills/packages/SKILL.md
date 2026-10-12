---
name: packages
version: 1.8.0
tier: optional
description: Using and writing Game Engine packages — shared components, systems, services, native plugins, skills, editor modes, project tools, images and Rust native systems. Built-in packages ship with the engine and a game switches them on in project.gameengine.json "packages"; others are npm packages from the npm registry, a private registry, or private git repositories (e.g. a studio's own GitHub packages). Covers switching built-in packages on, gameengine package add/list/check/update, git pinning, SSH and CI token access, and authoring a package (gameengine field, gen --package, exports, shipping images keyed pkg/<name>/…, a native/ Rust crate, build steps the game or a package runs when the game is built: pre-build and post-build phases, buckets, static analysis of the game's types, artifacts for the build server). Use when adding a shared dependency, making code reusable across games, or when an install or `package check` fails.
---

# Packages

A Game Engine package is a package whose `package.json` has a `gameengine` field. Built-in
packages ship with the engine; a game switches the ones it uses on. Other packages are ordinary
npm packages, installed from wherever npm can: the public registry, a private registry, or git.

## Built-in packages

They live in the engine's `packages/<name>/`, are versioned with the engine and need no install:

```json
// project.gameengine.json
"packages": ["pulse"]
```

`gameengine package list` shows the ones switched on and the ones available. After switching one
on, run `gameengine gen`; the editor's Packages panel does both for a person (a checkbox per
built-in package), and lists the npm packages with their pinning. Then use it exactly as below
(`import … from '@gameengine/pulse'`, images `pkg/@gameengine/pulse/…`). Importing a built-in
package the game does not switch on fails the bundle, naming the switch. Its code ships in the
game's builds; its `editor/`, `tools/`, `dev/`, `tests/` and `build/` never do. Some carry Rust systems: those
are already compiled into the engine, so your game needs no Rust toolchain for them, and your player
gets a package's Rust only when you switch the package on. Some answer a service in their Rust
(`rust: true` in the package's `services/`, e.g. `pulse.measure` behind `measurePulse`): call it from
UI or other non-sim code like any service; it needs no plugin, and test mocks still win over it.
Some have build steps that run when you build the game (pulse turns `pulse.json` into
`src/pulse.gen.ts`): after editing such a file, `gameengine build-steps run` refreshes the generated
file now (every build does it too), and the file you edited never ships (§ Build steps).

## Use an npm package

```sh
gameengine package add @studio/boosters@^1.2              # a registry (public or private)
gameengine package add --git studio/boosters#v1.2.0       # GitHub over SSH
gameengine package add --git studio/boosters#v1.2.0 --https
gameengine package add "github:studio/boosters#semver:^1.2"
gameengine package list                                     # what each package provides
gameengine package check --remote                           # engine range, pinning, git access
```

`add`, `remove` and `update` run the project's package manager (chosen from its lockfile) and
then `gameengine gen`, so package types, services and plugins land in the generated files.
Commit `package.json`, the lockfile and the regenerated files together.

Then:

- **Code:** `import { PulseSystem, Pulse } from '@studio/pulse'`; export its systems from your
  game like your own.
- **Components in scenes:** package components work in `scenes/*.scene.json` and the inspector
  as soon as `gen` has run — no import needed.
- **Services / plugins:** package services appear in `src/services.gen.ts`; enable package
  plugins by id in `project.gameengine.json` `plugins`, like your own.
- **Skills:** installed with `gameengine skills update`.
- **Rust systems:** a package with `gameengine.native` makes the project build its own host and
  player (the first run compiles for a minute or two). Its Rust systems run only in place of the
  TypeScript twins you register: a package system you don't export from your game doesn't run.
  Your own `native/` or transpiled system with the same name wins. `GAMEENGINE_NATIVE_SYSTEMS=off`
  runs the twins.
- **Images:** a package's images have keys `pkg/<npm name>/<path>`:
  `Sprite { image: "pkg/@studio/pulse/glow" }` in a scene, like your own `assets/` keys. Bundle
  and asset-group globs and collections see them as `assets/pkg/<npm name>/…`
  (`"include": ["assets/pkg/@studio/pulse/**"]`). They load in dev runs, tests and every cook
  straight from `node_modules`; never copy them into `assets/`. A file of yours with the same key
  (`assets/pkg/@studio/pulse/glow.png`) wins over the package's, with a warning.

### Pin git dependencies

A git dependency without a ref follows the default branch and changes under you. Always pin:
`#v1.2.0` (tag), `#3f2a9c1` (commit) or `#semver:^1.2` (newest matching tag). `package check`
warns on branches and missing refs. The lockfile records the exact commit either way; `update`
moves it.

### Private packages

The package manager fetches with git's own credentials; the engine stores none.

- **Your machine:** an SSH key with access to the repositories (`ssh -T git@github.com` works),
  and use the default `--git` (SSH) specs.
- **CI:** give git a token and rewrite SSH URLs to HTTPS before installing:

  ```sh
  git config --global url."https://x-access-token:${GH_PACKAGES_TOKEN}@github.com/".insteadOf "ssh://git@github.com/"
  git config --global --add url."https://x-access-token:${GH_PACKAGES_TOKEN}@github.com/".insteadOf "git@github.com:"
  ```

  The token needs read access to every private package repository (a fine-grained token or a
  GitHub App installation token).
- **A private npm registry** (GitHub Packages, Verdaccio, …): scope it in `.npmrc`
  (`@studio:registry=https://npm.pkg.github.com`, `//npm.pkg.github.com/:_authToken=${NPM_TOKEN}`).
  Never commit a token.
- `gameengine package check --remote` runs `git ls-remote` for each git package: a failure there
  is an access problem, not a code problem.

## Write one

```json
{
  "name": "@studio/pulse",
  "version": "1.0.0",
  "type": "module",
  "exports": { ".": "./src/index.ts", "./schema.gen": "./src/schema.gen.ts" },
  "peerDependencies": { "@gameengine/runtime": "*" },
  "peerDependenciesMeta": { "@gameengine/runtime": { "optional": true } },
  "gameengine": { "engine": "^0.1", "schema": "schema", "skills": "skills", "assets": "assets" }
}
```

- `gameengine` lists only what the package has: `schema`, `services`, `plugins`, `skills`,
  `editor`, `tools`, `assets`, `native`, `build` (directories inside the package) and `engine` (a
  semver range).
- **Images:** PNG, JPG and TGA files under `assets/` (any depth). Ship a `.gmeta` beside each
  one (`guid` from `uuidgen`, `importer = "texture"`, `[settings]` as in a project: `atlas`,
  `max_size`, …): the engine never writes into `node_modules`, so a file without one gets a GUID
  derived from its path, which changes if you move it. Only images for now: other files under
  `assets/` are ignored.
- **Schema:** declarations in `schema/*.schema.ts`; run `gameengine gen --package .` and commit
  `src/schema.gen.ts` and `schema.gen.json`. Import tokens from `./schema.gen.ts` in the package's
  code. Name types so they won't clash with a game's (prefix them if generic: `PulseFx`, not `Fx`).
- **Rust systems:** a Cargo crate under `native/` that depends on `gameengine-game = "0.1"` and
  exports `pub static PLUGIN: GamePlugin` (skill `perf-to-rust`). `gameengine gen --package .`
  writes `native/src/schema.gen.rs`; commit it. Keep each system's TypeScript twin, with the same
  name, and prove them equal with `gameengine test <project> --native both --js both`. Ship the
  crate as source (npm installs it, Cargo compiles it into each game); don't publish it to
  crates.io, and don't depend on another package's crate. A built-in package's crate exports
  `pub static PACKAGE: gameengine_game::Package` instead.
- **Rust services (built-in packages only):** declare the service with `rust: true` in
  `services/*.schema.ts`, and give `PACKAGE` a `services` factory returning a
  `gameengine_game::services::Backend` that answers every method of it (`packages/pulse`). The
  package's TypeScript API calls it with `callService`. A session creates the backend only when its
  game switches the package on, and replays never call it. An npm package's service needs a plugin.
  The backend's `reset` runs on every world rebuild (each game test, a hot reload): clear per-session
  state there so tests stay independent. Reach the network through the engine's `net` service
  (`inbox.call("net", …)`), which game tests mock, not a client of your own; never hand the
  backend's `Inbox` to the package's systems (sim code stays free of service outcomes).
- **Build steps:** `"gameengine": { "build": "build" }` and `build/*.build.ts` files (§ Build steps).
- Ship TypeScript source; the game's bundler compiles it. `@gameengine/*` is an optional peer: the
  project's engine provides it, so never bundle or pin your own copy.
- Keep sim code deterministic (skill `determinism`): a package system runs inside every game's
  hash and replays.
- Test it inside a sample or a small test project that depends on it, on both JS engines
  (`gameengine test <project> --js both`).
- Version with semver and tag releases (`v1.2.0`) so git users can pin them. A new major is
  needed when you rename or remove a component, field or service method: games' scenes and
  saves reference them.
- Include a skill (`skills/<name>/SKILL.md`) that tells agents how to use the package.

Example: the built-in `packages/pulse` in the engine repository (`samples/tile-maze` switches it
on); an npm package has the same layout. A package's code ships in the builds of the games that
use it; `examples/services/*` never ship (copy those into the project instead of importing them).

## Build steps

Work that runs when the game is built, never on Play: code generated from a settings file, an
analytics schema from the game's event types, symbols uploaded after the build. A package keeps its
steps in `build/*.build.ts` (with `"gameengine": { "build": "build" }`); the game keeps its own in
`tools/*.build.ts`. Each file exports one or more `defineBuildStep(...)`:

```ts
// tools/events.build.ts: the game's own step, id game/events
import { defineBuildStep } from '@gameengine/tools';

export const events = defineBuildStep({
  name: 'events',
  description: 'The analytics schema from every class extending AnalyticsEvent',
  // phase: 'pre-build' (default) | 'post-build' | 'build-failed'
  // bucket: 'first' | 'before-default' | 'default' (default) | 'after-default' | 'last'
  run(ctx) {
    const { ts, checker, files } = ctx.types(); // the game's src/, type-checked with its tsconfig
    // …find the classes, their properties (checker.getPropertiesOfType) and JSDoc tags…
    ctx.write('src/analytics/events.gen.ts', code); // any project file, in place
    ctx.artifact('analytics-schema.json', schema, { group: 'analytics' }); // for the build server
  },
});
```

- **When:** `gameengine build android|ios` runs the `pre-build` steps first and then reads the
  project's settings, so a step may set the version or an icon. The `post-build` steps run once the
  app is built and within its size budget (`ctx.build.app` is its path, `ctx.build.symbols` the
  iOS dSYMs), and the `build-failed` steps once after any failure (`ctx.build.error`), a budget or
  a store upload included. `platforms: ['ios']` limits a step to some platforms.
  Dry runs run them too, with `ctx.build.dryRun` set: skip uploads and signing then. `gameengine
  build-steps list` shows the steps in order; `gameengine build-steps run [--phase post-build]
  [--platform ios]` runs a phase now.
- **Order:** by bucket, then by id. Never depend on another package's step by name: pick a bucket.
  The game has the last word in `project.gameengine.json`: `"buildSteps": { "pulse/presets": "last",
  "@studio/analytics/upload": false }` moves a step or turns it off. A step's id is `game/<name>`,
  `<built-in package>/<name>` or `<npm name>/<name>`.
- **Context:** `ctx.read(path)` (text, or `null`), `ctx.glob('src/**/*.ts')` and
  `ctx.write(path, content)` for any project file (not `.gameengine/`). `ctx.types()` for static
  analysis: TypeScript's `ts`, `program`, `checker`, the game's source `files` and
  `diagnostics()` (fail when the game doesn't type-check: its types turn `any`), computed once per
  phase. `ctx.artifact(name, content, { group })` and `ctx.addArtifact(path, { group, name })` (a
  file; zip a folder first) put files in the artifacts folder (`--artifacts <dir>`, else
  `<outDir>/artifacts`), listed in `build-report.json` `artifacts` for the build server to collect,
  failed builds included. Two steps can't write the same artifact. `ctx.message('warning', text)`
  adds a line to the build's summary. `ctx.build` has the platform, config, outDir, artifactsDir and
  dryRun; `ctx.log` prints.
- **Files that never ship:** list the files (not folders or patterns) a step reads that must stay
  off devices in `private: ['pulse.json']`. Keep those at the project root or in a folder of their own, never in
  `assets/`, `src/`, `scenes/`, `plugins/` or the settings files. The build fails if one would ship
  (imported by game code, cooked into content, a branding image, `include_bytes!` in native code).
- **Generated files the game imports** (`src/*.gen.ts`): commit them, since Play and tests read what
  is on disk, and keep the output deterministic so a build doesn't churn them.
- Throw to fail the build; the error names the step. Steps run in Node with your permissions:
  write only what the description says. Examples: `packages/pulse/build/presets.build.ts`,
  `samples/tile-maze/tools/events.build.ts`.

## Not yet

Scenes, prefabs, data assets, audio and other non-image assets inside packages; Rust dependencies
between packages; packages from a local folder outside the game.
