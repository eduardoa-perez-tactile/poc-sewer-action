# Sewer Action release plan

## Release definition

Version 1.0 is a polished, short landscape run-and-gun game with one complete sewer level,
keyboard/gamepad controls, responsive browser input, an animated player, soldier enemies,
projectiles, bombs, water hazards, audio, settings, credits, deterministic tests and a verified
start-to-finish replay.

## Delivery stages

1. Foundation: project configuration, source assets, CI and deterministic smoke test.
2. Vertical slice: movement, jump, dash, camera and one representative room.
3. Combat: shooting, soldier behaviour, damage, death and restart.
4. Presentation: flipbooks, effects, audio, parallax, water and game-feel toggles.
5. Product: menus, settings, accessibility, complete level and credits.
6. Release: compatibility, performance, browser packaging, telemetry, QA and launch checklist.

## External blocker

The project declares `web`, but the current Game Engine release does not produce browser builds.
All game code and content should remain web-compatible; the browser build and hosting issue cannot
close until the engine exposes and documents that target.
