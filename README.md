# Sewer Action

A deterministic 2D run-and-gun platformer built with Tactile Game Engine. The project turns the
mechanics explored in `poc-game-feel` into a small, releasable sewer action game using the CC0
Sewers asset pack.

## Status

The repository contains the generated Game Engine foundation and the release backlog. Development
is web-first, but the current engine release has no browser build target; desktop hosts are used
for development until that engine capability lands.

## Local workflow

```sh
gameengine gen
gameengine test --js both
gameengine run --headless
gameengine check --tests
```

Project decisions and conventions live in `PROJECT.md`.
