import { bool, component, event, f32 } from '@gameengine/schema';

export const Player = component(
  'Player',
  {
    moveSpeed: f32({ default: 8.5, min: 0, doc: 'Maximum horizontal movement speed in world units per second.' }),
    jumpSpeed: f32({ default: 9.2, min: 0, doc: 'Initial vertical jump speed in world units per second.' }),
  },
  { sim: true, doc: 'Player-owned deterministic movement configuration.' },
);

export const PlayerControl = component(
  'PlayerControl',
  {
    moveX: f32({ default: 0, min: -1, max: 1, doc: 'Recorded horizontal intent normalized to [-1, 1].' }),
  },
  { sim: true, doc: 'Latest recorded held player control. Action systems consume step-scoped intent events directly.' },
);

export const PlayerIntent = event(
  'PlayerIntent',
  {
    moveX: f32({ default: 0, min: -1, max: 1 }),
    jump: bool({ default: false }),
    dash: bool({ default: false }),
    fire: bool({ default: false }),
  },
  { sim: true, doc: 'Recorded boundary event produced by keyboard, gamepad, touch, or UI adapters.' },
);
