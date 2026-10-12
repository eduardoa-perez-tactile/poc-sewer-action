# Development harness

## Purpose

The harness is the shared edit, test and inspection contract for humans, agents and CI. A feature
is complete only when its behavior is exercised through player input or an approved cheat and the
appropriate harness gate passes. Reading code or compiling alone is not evidence.

The entry point is `./tools/harness`. `./tools/gameengine` resolves the CLI from `PATH` or from the
installed macOS editor, so commands do not depend on one developer's shell configuration.

## Gates

| Gate | Command | Use |
| --- | --- | --- |
| Fast | `./tools/harness fast` | During implementation. Checks generated files, formatting and changed T0 logic tests. |
| Visual | `./tools/harness visual` | After changing scenes, sprites, animation, VFX, materials or UI. Runs T0 and T1 tests. |
| Inspect | `./tools/harness inspect` | Starts a headless session for stepping, querying, screenshots and real input. |
| Pre-push | `./tools/harness prepush` | Required before a pull request update. Runs all T0/T1 tests on the selected local runtime, then the cooked smoke gate. |
| Release | `./tools/harness release` | Required for a release candidate. Runs V8 and Hermes, phone-low memory mode, cooked tests and smoke checks. |

`HARNESS_JS` selects the local runtime for fast, visual and pre-push gates. It defaults to `v8`.
Use `HARNESS_JS=both ./tools/harness prepush` when Hermes is available. The release gate always
requires both runtimes and must never silently downgrade. Issue #6 tracks the currently missing
Hermes host in the installed engine package.

## Inner development loop

1. Start from an issue with explicit acceptance criteria.
2. For a bug, write the failing test first.
3. Run `./tools/harness fast` to establish the baseline.
4. Make one coherent change while keeping saved files compilable.
5. Run the smallest relevant test with `gameengine test --filter` while iterating.
6. Start `./tools/harness inspect`; use `gameengine step`, `world query`, real UI input and
   screenshots to verify behavior instead of inferring it from source.
7. Add or update T0 tests, T1 goldens or replays as required by the evidence matrix.
8. Run the pre-push gate and include its result in the pull request.

## Evidence matrix

| Change | Required evidence |
| --- | --- |
| Deterministic gameplay | T0 `worldTest` driven through recorded input, on both runtimes before release. |
| Bug fix | A test that fails before the fix and passes after it. |
| Refactor or optimization | Hash trace before and baseline comparison after; behavior must remain identical. |
| Scene, sprite, animation, VFX or material | T1 render test or reviewed golden plus visual inspection. |
| UI | MVC model test, hit-tested interaction and landscape aspect/safe-area render coverage. |
| Complete flow | Recorded replay verified from a fresh world. |
| Performance-sensitive work | Before/after frame, draw-call, memory or asset measurements at the relevant scale. |
| Release content | Cooked test and smoke run, current pipeline recording and release budget scenario. |

## Headless inspection

After `./tools/harness inspect` starts a session, use another terminal:

```sh
./tools/gameengine step 60
./tools/gameengine world query Player
./tools/gameengine screenshot build/inspection.png
./tools/gameengine session stop --all
```

Use real input commands for behavior. World mutation is reserved for diagnosis; cheats are used to
create repeatable QA states and live only in `src/**/*.cheats.ts`.

## Replays and goldens

- Commit a replay for every release-critical flow: boot, vertical slice, combat peak, death,
  restart and completion.
- Re-record only when behavior intentionally changes, and review the first divergent step.
- Update goldens only after inspecting the output image.
- Budget replays are also the source for `pipelines.json`; release candidates cannot bypass stale
  or missing pipeline data.

## Definition of done

A pull request is ready when its issue acceptance criteria are met, required evidence is committed,
the pre-push gate passes, no unrelated files changed, and the PR describes behavior, verification
and performance impact. A release is ready only when the release gate passes without exceptions.
