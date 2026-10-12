# Sewer Action

A deterministic 2D run-and-gun platformer built with Tactile Game Engine. The project turns the
mechanics explored in `poc-game-feel` into a small, releasable sewer action game using its own
pixel-art sewer world, characters and effects.

## Status

The repository contains the generated Game Engine foundation and the release backlog. Development
is web-first, but the current engine release has no browser build target; desktop hosts are used
for development until that engine capability lands.

## Local workflow

```sh
./tools/harness fast
./tools/harness inspect
./tools/harness prepush
```

The complete verification contract is in `docs/DEVELOPMENT_HARNESS.md`. Branching, pull requests
and releases are defined in `docs/GITFLOW.md`. Project decisions and conventions live in
`PROJECT.md`.

## Continuous integration

Pull requests and pushes to `main` run the same `./tools/harness prepush` gate used locally. The
workflow installs the Apple-silicon Game Engine version pinned in `.gameengine-version`, verifies
the release archive checksum, and retains the complete harness output as a downloadable artifact
for 14 days, including failed runs.

CI intentionally selects V8 because the current engine distribution has no Hermes host. This is
not a fallback: `HARNESS_JS=v8` is explicit in the workflow, while `./tools/harness release` still
requires both runtimes and fails when Hermes is unavailable. Issue #6 tracks that external host
blocker. Update `.gameengine-version` and the matching checksum in `tools/ci/install-gameengine`
together when upgrading the engine.
