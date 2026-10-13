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
- Shipping visual art lives in `assets/art/`; editable Aseprite masters live in `art/aseprite/`.
  The sewer artwork is first-party project art and should be used directly in scenes, clips and UI.
- Preserve the original `poc-game-feel` behaviour as a reference, but do not port Unity
  singletons, `Time`, `Rigidbody2D` behaviour or presentation-driven state.
- Build one verified vertical slice before expanding content.
- Run `./tools/harness fast` while iterating and `./tools/harness prepush` before opening or
  updating a pull request. Release candidates must pass `./tools/harness release`.
- Use short-lived `issue/<number>-<slug>` branches and squash them into protected `main` through
  pull requests. Do not maintain a permanent `develop` branch.
- Use one fresh Codex chat per development ticket. Finish, verify and merge the current ticket
  before creating the next ticket's chat. Give the new chat a concise handoff containing the
  product brief, ticket scope, dependencies, branch name and verification requirements; use the
  supervisory chat for direction and corrections rather than accumulating implementation context.

## Decisions

- Engine template: `2d-casual`.
- Initial platform declaration: `web`, per product direction.
- Development host: desktop until the engine ships a browser target.
- Art ownership: the supplied sewer artwork is treated as first-party project art.
- Initial release scope: one polished level, one player, one soldier enemy family, one final
  encounter, keyboard/gamepad controls, responsive web input, audio, settings and credits.

## Links

- Mechanics reference: https://github.com/eduardoa-perez-tactile/poc-game-feel
- Project repository: https://github.com/eduardoa-perez-tactile/poc-sewer-action
- Engine releases: https://github.com/tactilegames/game-engine-releases

## Water hazards (issue #21)

- The authored water surface is y = -3 across the first room. Player entry requests 5 damage through the health owner, bypassing combat invulnerability so a recent soldier hit cannot prevent drowning. Water is an entry hazard: sustained contact does not repeat damage.
- Contact treats overlapping water volumes as one region. A 30-step absolute splash cooldown suppresses rapid exit/re-entry; suppressed entries never produce delayed splashes while still submerged. Restart clears contact/deadline and hides the preallocated splash slot.
- The supplied five-frame, 0.5-second splash clip and mono sound run only in presentation. Entry-step deduplication prevents replaying the same event on the following frame. Contact and inactive presentation skip unchanged work; 12 focused hash traces matched before/after the contact optimization.
- Existing replay inputs and golden pixels were preserved; replay hashes/checkpoints and pinned test hashes were updated for the authored simulation schema/state. Water adds a recorded movement/death/restart replay, a single reviewed splash golden and a structural budget.
- Architecture review: no remaining must/should findings. Performance review at one player/one water volume: water replay peaks at 6/7 draws, zero pipelines created during play and zero GC pauses over 4 ms; preserve batching as content grows. Release desktop V8 mobile-tier sample: step p95 0.313 ms, water marker 0.0092 ms, inactive splash 0 ms, RSS about 70.2 MiB and heap about 3.5 MiB. These are desktop relative measurements; real GPU/thermal/phone timings remain unmeasured.
- V8 and phone-low residency/render coverage are supported. Hermes parity remains blocked by open issue #6 (missing Hermes host). Browser packaging remains separately unavailable in the engine. Android package-size dry-run is unavailable because the installed engine lacks its platform template; Android asset cooking succeeded.
