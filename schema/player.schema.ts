import { asset, bool, component, enumOf, event, f32, i32, resource, u32 } from '@gameengine/schema';

export const Player = component(
  'Player',
  {
    maxHorizontalSpeed: f32({ default: 8.5, min: 0, doc: 'Maximum horizontal speed in world units per second.' }),
    groundAcceleration: f32({ default: 60, min: 0, doc: 'Grounded acceleration in world units per second squared.' }),
    groundDeceleration: f32({ default: 80, min: 0, doc: 'Grounded braking and reversal rate in world units per second squared.' }),
    airAcceleration: f32({ default: 30, min: 0, doc: 'Airborne acceleration in world units per second squared.' }),
    airDeceleration: f32({ default: 12, min: 0, doc: 'Airborne braking and reversal rate in world units per second squared.' }),
    jumpSpeed: f32({ default: 9.2, min: 0, doc: 'Initial vertical jump speed in world units per second.' }),
    gravity: f32({ default: 24, min: 0, doc: 'Downward acceleration in world units per second squared.' }),
    maxFallSpeed: f32({ default: 18, min: 0, doc: 'Maximum downward speed in world units per second.' }),
    jumpCutMultiplier: f32({ default: 0.5, min: 0, max: 1, doc: 'Upward velocity multiplier applied when jump is released early.' }),
    coyoteSteps: u32({ default: 6, doc: 'Fixed simulation steps after leaving ground in which the ground jump remains available.' }),
    jumpBufferSteps: u32({ default: 6, doc: 'Fixed simulation steps for which a jump edge remains queued.' }),
    airJumps: u32({ default: 1, doc: 'Air jumps restored on grounded contact.' }),
    dashSpeed: f32({ default: 12, min: 0, doc: 'Locked horizontal speed while dashing in world units per second.' }),
    dashDurationSteps: u32({ default: 8, doc: 'Fixed simulation steps for which a dash moves at dash speed.' }),
    dashCooldownSteps: u32({ default: 48, doc: 'Fixed simulation steps from activation until another dash may start.' }),
    dashControlLockSteps: u32({ default: 6, doc: 'Fixed simulation steps after a dash before movement and jump control return.' }),
    dashGravityMultiplier: f32({ default: 0.2, min: 0, max: 1, doc: 'Gravity multiplier while an airborne dash is active.' }),
    collisionHalfWidth: f32({ default: 0.42, min: 0.01, doc: 'Half-width of the deterministic player collision box.' }),
    collisionHeight: f32({ default: 1.2, min: 0.01, doc: 'Height of the deterministic player collision box measured upward from the actor origin.' }),
    maxStepHeight: f32({ default: 0.35, min: 0, doc: 'Maximum ledge height climbed automatically while grounded.' }),
    groundSnapDistance: f32({ default: 0.12, min: 0, doc: 'Maximum downward floor snap used to stay stable over shallow cliff edges.' }),
  },
  { sim: true, doc: 'Player-owned deterministic movement configuration.' },
);

export const PlatformCollisionCell = component(
  'PlatformCollisionCell',
  {
    x: i32({ default: 0, doc: 'Grid-space x coordinate.' }),
    y: i32({ default: 0, doc: 'Grid-space y coordinate.' }),
  },
  { sim: true, doc: 'A solid cell in the deterministic platform collision grid. Rendering is independent.' },
);

export const PlatformCollisionGrid = resource(
  'PlatformCollisionGrid',
  {
    originX: f32({ default: 0, doc: 'World x coordinate of cell (0, 0) lower-left corner.' }),
    originY: f32({ default: -0.5, doc: 'World y coordinate of cell (0, 0) lower-left corner.' }),
    cellSize: f32({ default: 1, min: 0.01, doc: 'Square cell size in world units.' }),
  },
  { sim: true, doc: 'World mapping for deterministic platform collision cells.' },
);

export const PlayerMotion = component(
  'PlayerMotion',
  {
    horizontalVelocity: f32({ default: 0, doc: 'Authoritative horizontal velocity in world units per second.' }),
    verticalVelocity: f32({ default: 0, doc: 'Authoritative vertical velocity in world units per second.' }),
    groundedForMovement: bool({ default: true, doc: 'Movement-interpreted grounded state, one fixed step behind raw collision support.' }),
    facing: enumOf('FacingDirection', ['Left', 'Right'], { default: 'Right' }),
    coyoteStepsRemaining: u32({ default: 0, doc: 'Remaining fixed steps in the grounded grace window.' }),
    jumpBufferStepsRemaining: u32({ default: 0, doc: 'Remaining fixed steps for a queued jump request.' }),
    airJumpsRemaining: u32({ default: 1, doc: 'Air jumps available before the next grounded contact.' }),
    jumpWasHeld: bool({ default: false, doc: 'Jump hold state from the previous fixed step for deterministic release detection.' }),
    ignoreGroundContact: bool({ default: false, doc: 'Whether contact is ignored until the actor has separated after jumping.' }),
  },
  { sim: true, doc: 'Authoritative player movement state. Presentation may observe but never write it.' },
);

export const PlayerControl = component(
  'PlayerControl',
  {
    moveX: f32({ default: 0, min: -1, max: 1, doc: 'Recorded horizontal intent normalized to [-1, 1].' }),
    crouch: bool({ default: false, doc: 'Whether the recorded crouch control is held.' }),
    jumpHeld: bool({ default: false, doc: 'Whether jump is currently held for release-cut detection.' }),
  },
  { sim: true, doc: 'Latest recorded held player control. Action systems consume step-scoped intent events directly.' },
);

export const PlayerDashState = component(
  'PlayerDashState',
  {
    active: bool({ default: false, doc: 'Whether the player is currently in the fixed-step dash movement phase.' }),
    direction: enumOf('DashDirection', ['Left', 'Right'], { default: 'Right' }),
    activeStepsRemaining: u32({ default: 0, doc: 'Dash movement steps remaining, including the current step.' }),
    cooldownStepsRemaining: u32({ default: 0, doc: 'Steps before another dash activation is accepted.' }),
    controlLockStepsRemaining: u32({ default: 0, doc: 'Steps before horizontal and jump control are accepted again.' }),
  },
  { sim: true, doc: 'Authoritative deterministic dash state. Presentation may observe but never write it.' },
);

export const PlayerGroundContact = component(
  'PlayerGroundContact',
  {
    grounded: bool({ default: true, doc: 'Collision-owned ground contact fact consumed by movement.' }),
  },
  { sim: true, doc: 'Deterministic traversal/collision output. Movement reads but never writes this component.' },
);

export const PlayerAnimationPresentation = component(
  'PlayerAnimationPresentation',
  {
    clip: asset('clip2d', { doc: 'Current authored flipbook selected by presentation.' }),
  },
  { sim: false, doc: 'Presentation-only animation controller state; never read by gameplay.' },
);

export const PlayerStepInput = resource(
  'PlayerStepInput',
  {
    jumpRequested: bool({ default: false, doc: 'Jump press for the current fixed step only.' }),
    dashRequested: bool({ default: false, doc: 'Dash press for the current fixed step only.' }),
  },
  { sim: true, doc: 'Unconditionally overwritten input sample consumed in the same fixed step.' },
);

export const PlayerIntent = event(
  'PlayerIntent',
  {
    moveX: f32({ default: 0, min: -1, max: 1 }),
    jump: bool({ default: false }),
    jumpHeld: bool({ default: false }),
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
    jumpHeld: bool({ default: false }),
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
