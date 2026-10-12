import { bool, component, enumOf, event, f32, resource } from '@gameengine/schema';

export const Player = component(
  'Player',
  {
    maxHorizontalSpeed: f32({ default: 8.5, min: 0, doc: 'Maximum horizontal speed in world units per second.' }),
    groundAcceleration: f32({ default: 60, min: 0, doc: 'Grounded acceleration in world units per second squared.' }),
    groundDeceleration: f32({ default: 80, min: 0, doc: 'Grounded braking and reversal rate in world units per second squared.' }),
    airAcceleration: f32({ default: 30, min: 0, doc: 'Airborne acceleration in world units per second squared.' }),
    airDeceleration: f32({ default: 12, min: 0, doc: 'Airborne braking and reversal rate in world units per second squared.' }),
    jumpSpeed: f32({ default: 9.2, min: 0, doc: 'Initial vertical jump speed in world units per second.' }),
  },
  { sim: true, doc: 'Player-owned deterministic movement configuration.' },
);

export const PlayerMotion = component(
  'PlayerMotion',
  {
    horizontalVelocity: f32({ default: 0, doc: 'Authoritative horizontal velocity in world units per second.' }),
    grounded: bool({ default: true, doc: 'Ground contact supplied by deterministic traversal/collision systems.' }),
    facing: enumOf('FacingDirection', ['Left', 'Right'], { default: 'Right' }),
  },
  { sim: true, doc: 'Authoritative player movement state. Presentation may observe but never write it.' },
);

export const PlayerControl = component(
  'PlayerControl',
  {
    moveX: f32({ default: 0, min: -1, max: 1, doc: 'Recorded horizontal intent normalized to [-1, 1].' }),
    crouch: bool({ default: false, doc: 'Whether the recorded crouch control is held.' }),
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
    crouch: bool({ default: false }),
  },
  { sim: true, doc: 'Recorded boundary event produced by keyboard, gamepad, touch, or UI adapters.' },
);

export const PlayerActionState = resource(
  'PlayerActionState',
  {
    moveX: f32({ default: 0, min: -1, max: 1 }),
    jump: bool({ default: false }),
    dash: bool({ default: false }),
    fire: bool({ default: false }),
    crouch: bool({ default: false }),
  },
  { sim: true, doc: 'Current normalized action-map sample. Written from recorded ActionState before gameplay systems run.' },
);

export const MenuIntent = event(
  'MenuIntent',
  {
    moveX: f32({ default: 0, min: -1, max: 1 }),
    moveY: f32({ default: 0, min: -1, max: 1 }),
    confirm: bool({ default: false }),
    back: bool({ default: false }),
    pause: bool({ default: false }),
  },
  { sim: true, doc: 'Recorded, device-independent menu and pause intent produced by the action map.' },
);
