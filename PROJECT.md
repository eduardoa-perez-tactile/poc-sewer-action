# SewerAction — project notes

This file is yours. `gameengine skills update` writes it once, when it is missing, and never
touches it again, so this is where everything specific to SewerAction goes. `AGENTS.md`, `CLAUDE.md`
and the skills belong to the engine and are replaced when it updates them; put nothing project-specific there.

Agents read this file before `AGENTS.md`. Where the two disagree, this file wins for this project.

## The game

Sewer Action is a short, responsive 2D run-and-gun platformer built as a production-quality
game-feel showcase. The player crosses a flooded sewer, using movement, jumps, dashes and a
weapon to survive soldiers and environmental hazards before reaching the exit.

The first release targets web architecture and content. The current Game Engine release does
not yet provide a browser build, so actual web packaging is tracked as an external release
blocker while development and verification use the desktop host.

## Conventions

- Landscape presentation with a 16:9 must-see gameplay frame and backgrounds that bleed wider.
- Gameplay is deterministic ECS TypeScript. Presentation feedback never writes gameplay state.
- Source art from the CC0 sewer pack lives in `source-assets/sewers-pack/`; only normalized,
  runtime-ready files belong in `assets/`.
- Preserve the original `poc-game-feel` behaviour as a reference, but do not port Unity
  singletons, `Time`, `Rigidbody2D` behaviour or presentation-driven state.
- Build one verified vertical slice before expanding content.
- Run `./tools/harness fast` while iterating and `./tools/harness prepush` before opening or
  updating a pull request. Release candidates must pass `./tools/harness release`.
- Use short-lived `issue/<number>-<slug>` branches and squash them into protected `main` through
  pull requests. Do not maintain a permanent `develop` branch.

## Decisions

- Engine template: `2d-casual`.
- Initial platform declaration: `web`, per product direction.
- Development host: desktop until the engine ships a browser target.
- Art license: the supplied pack states CC0 and permits redistribution without attribution.
- Initial release scope: one polished level, one player, one soldier enemy family, one final
  encounter, keyboard/gamepad controls, responsive web input, audio, settings and credits.

## Links

- Mechanics reference: https://github.com/eduardoa-perez-tactile/poc-game-feel
- Project repository: https://github.com/eduardoa-perez-tactile/poc-sewer-action
- Engine releases: https://github.com/tactilegames/game-engine-releases
