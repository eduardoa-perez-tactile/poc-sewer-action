import { expect, renderTest, worldTest } from '@gameengine/test';
import { ActionState, LocalTransform, WorldView } from '@gameengine/runtime';
import {
  GameState,
  GameplayPresentation,
  MenuIntent,
  Player,
  PlayerActionState,
  PlayerControl,
  PlayerGroundContact,
  PlayerIntent,
  PlayerMotion,
} from '../src/schema.gen.ts';

worldTest('boots the sewer action vertical slice', async ({ world, step, input }) => {
  input.view(1920, 1080, 1);
  await step(2);

  expect(world.resource(GameState).initialized).toBe(true);
  expect(world.resource(GameState).phase).toBe('Playing');
  expect(world.entities(Player).length).toBe(1);

  const view = world.resource(WorldView);
  expect(view.designAspect).toBeCloseTo(16 / 9);
  expect(view.fit).toBe('Contain');
});

worldTest('recorded player intent becomes simulation state and a presentation snapshot', async ({ world, step, input }) => {
  input.view(1920, 1080, 1);
  await step(1);

  input.emit(PlayerIntent, { moveX: -0.75, jump: true, dash: false, fire: true, crouch: true });
  await step(1);

  const [player] = world.entities(Player);
  expect(player).toBeDefined();
  expect(world.get(player!, PlayerControl)).toEqual({ moveX: -0.75, crouch: true, jumpHeld: false });
  expect(world.resource(GameplayPresentation)).toEqual({ phase: 'Playing', moveX: 'Left' });

  await step(1);
  expect(world.get(player!, PlayerControl)).toEqual({ moveX: 0, crouch: false, jumpHeld: false });
});

worldTest('the latest recorded intent wins deterministically within a step', async ({ world, step, input }) => {
  input.emit(PlayerIntent, { moveX: -1, jump: true, dash: false, fire: false, crouch: true });
  input.emit(PlayerIntent, { moveX: 1, jump: false, dash: true, fire: true, crouch: false });
  await step(1);

  const [player] = world.entities(Player);
  expect(world.get(player!, PlayerControl)).toEqual({ moveX: 1, crouch: false, jumpHeld: false });
});

worldTest('mapped actions enter the simulation through the recorded input stream', async ({ world, step, input }) => {
  input.action('moveX', -0.625);
  input.action('crouch', 1);
  input.action('jump', 1);
  input.action('dash', 1);
  input.action('shoot', 1);
  input.action('pause', 1);
  input.action('menuX', -1);
  input.action('menuY', 1);
  input.action('menuConfirm', 1);
  input.action('menuBack', 1);
  await step(1);

  const [player] = world.entities(Player);
  expect(world.get(player!, PlayerControl)).toEqual({ moveX: -0.625, crouch: true, jumpHeld: true });
  expect(world.resource(PlayerActionState)).toEqual({ moveX: -0.625, jump: true, jumpHeld: true, dash: true, fire: true, crouch: true });
  expect(world.events(MenuIntent)).toEqual([{ moveX: -1, moveY: 1, confirm: true, back: true, pause: true }]);

  const actions = world.entities(ActionState).map((entity) => world.get(entity, ActionState));
  expect(actions.find((action) => action.name === 'jump')?.justPressed).toBe(true);

  await step(1);
  expect(world.resource(PlayerActionState)).toEqual({ moveX: 0, jump: false, jumpHeld: false, dash: false, fire: false, crouch: false });
  expect(world.events(MenuIntent)).toEqual([{ moveX: 0, moveY: 0, confirm: false, back: false, pause: false }]);
});

worldTest('released actions clear held controls without becoming stuck', async ({ world, step, input }) => {
  input.action('moveX', 1);
  input.action('crouch', 1);
  await step(1);

  input.action('moveX', 0);
  input.action('crouch', 0);
  await step(1);

  const [player] = world.entities(Player);
  expect(world.get(player!, PlayerControl)).toEqual({ moveX: 0, crouch: false, jumpHeld: false });
});

worldTest('neutral horizontal input keeps a stationary player still', async ({ world, step }) => {
  await step(2);
  const [player] = world.entities(Player);
  const before = world.get(player!, LocalTransform).position;

  await step(30);

  expect(world.get(player!, PlayerMotion)).toEqual({
    horizontalVelocity: 0,
    verticalVelocity: 0,
    grounded: true,
    facing: 'Right',
    coyoteStepsRemaining: 6,
    jumpBufferStepsRemaining: 0,
    airJumpsRemaining: 1,
    jumpWasHeld: false,
    ignoreGroundContact: false,
  });
  expect(world.get(player!, LocalTransform).position).toEqual(before);
});

worldTest('horizontal input accelerates and faces in both directions', async ({ world, step, input }) => {
  await step(1);
  const [player] = world.entities(Player);

  for (let i = 0; i < 4; i++) {
    input.action('moveX', 1);
    await step(1);
  }
  expect(world.get(player!, PlayerMotion).horizontalVelocity).toBeCloseTo(4);
  expect(world.get(player!, PlayerMotion).facing).toBe('Right');

  for (let i = 0; i < 4; i++) {
    input.action('moveX', -1);
    await step(1);
  }
  expect(world.get(player!, PlayerMotion).horizontalVelocity).toBeLessThan(0);
  expect(world.get(player!, PlayerMotion).facing).toBe('Left');
});

worldTest('horizontal speed is capped by the player configuration', async ({ world, step, input }) => {
  await step(1);
  const [player] = world.entities(Player);

  for (let i = 0; i < 120; i++) {
    input.action('moveX', 1);
    await step(1);
  }
  expect(world.get(player!, PlayerMotion).horizontalVelocity).toBeCloseTo(8.5);

  for (let i = 0; i < 120; i++) {
    input.action('moveX', -1);
    await step(1);
  }
  expect(world.get(player!, PlayerMotion).horizontalVelocity).toBeCloseTo(-8.5);
});

worldTest('reversal brakes before accelerating and neutral input stops exactly', async ({ world, step, input }) => {
  await step(1);
  const [player] = world.entities(Player);

  for (let i = 0; i < 6; i++) {
    input.action('moveX', 1);
    await step(1);
  }
  expect(world.get(player!, PlayerMotion).horizontalVelocity).toBeCloseTo(6);

  input.action('moveX', -1);
  await step(1);
  expect(world.get(player!, PlayerMotion).horizontalVelocity).toBeCloseTo(6 - 80 / 60);

  await step(10);
  expect(world.get(player!, PlayerMotion).horizontalVelocity).toBe(0);
});

worldTest('airborne movement uses reduced acceleration and braking', async ({ world, step, input }) => {
  await step(1);
  const airborne = world.spawn({
    LocalTransform: {},
    Player: {},
    PlayerControl: {},
    PlayerGroundContact: { grounded: false },
    PlayerMotion: { grounded: false },
  });

  for (let i = 0; i < 4; i++) {
    input.action('moveX', 1);
    await step(1);
  }
  expect(world.get(airborne, PlayerMotion).horizontalVelocity).toBeCloseTo(2);

  await step(1);
  expect(world.get(airborne, PlayerMotion).horizontalVelocity).toBeCloseTo(1.8);
});

worldTest('a grounded jump uses the configured speed and only its press edge', async ({ world, step, input }) => {
  await step(1);
  const [player] = world.entities(Player);

  input.action('jump', 1);
  await step(1);
  const first = world.get(player!, PlayerMotion);
  expect(first.grounded).toBe(false);
  expect(first.verticalVelocity).toBeCloseTo(9.2 - 24 / 60);
  expect(first.airJumpsRemaining).toBe(1);

  for (let i = 0; i < 3; i++) {
    input.action('jump', 1);
    await step(1);
  }
  const held = world.get(player!, PlayerMotion);
  expect(held.airJumpsRemaining).toBe(1);
  expect(held.verticalVelocity).toBeCloseTo(first.verticalVelocity - (3 * 24) / 60);
});

worldTest('releasing jump early cuts upward velocity once', async ({ world, step, input }) => {
  await step(1);
  const [player] = world.entities(Player);

  input.action('jump', 1);
  await step(1);
  const heldVelocity = world.get(player!, PlayerMotion).verticalVelocity;

  input.action('jump', 0);
  await step(1);
  const cutVelocity = world.get(player!, PlayerMotion).verticalVelocity;
  expect(cutVelocity).toBeCloseTo(heldVelocity * 0.5 - 24 / 60);

  await step(1);
  expect(world.get(player!, PlayerMotion).verticalVelocity).toBeCloseTo(cutVelocity - 24 / 60);
});

worldTest('coyote time accepts its final eligible step and then expires', async ({ world, step, input }) => {
  await step(1);
  const eligible = world.spawn({
    LocalTransform: {},
    Player: {},
    PlayerControl: {},
    PlayerGroundContact: { grounded: false },
    PlayerMotion: { grounded: false, coyoteStepsRemaining: 1, airJumpsRemaining: 0 },
  });
  const expired = world.spawn({
    LocalTransform: {},
    Player: {},
    PlayerControl: {},
    PlayerGroundContact: { grounded: false },
    PlayerMotion: { grounded: false, coyoteStepsRemaining: 0, airJumpsRemaining: 0 },
  });

  input.action('jump', 1);
  await step(1);

  expect(world.get(eligible, PlayerMotion).verticalVelocity).toBeGreaterThan(0);
  expect(world.get(expired, PlayerMotion).verticalVelocity).toBeLessThan(0);
});

worldTest('a buffered jump fires on grounded contact within the configured window', async ({ world, step, input }) => {
  await step(1);
  const player = world.spawn({
    LocalTransform: {},
    Player: {},
    PlayerControl: {},
    PlayerGroundContact: { grounded: false },
    PlayerMotion: { grounded: false, coyoteStepsRemaining: 0, airJumpsRemaining: 0 },
  });

  input.action('jump', 1);
  await step(1);
  expect(world.get(player, PlayerMotion).jumpBufferStepsRemaining).toBe(6);

  world.insert(player, PlayerGroundContact, { grounded: true });
  await step(1);

  const landedJump = world.get(player, PlayerMotion);
  expect(landedJump.grounded).toBe(false);
  expect(landedJump.jumpBufferStepsRemaining).toBe(0);
  expect(landedJump.verticalVelocity).toBeGreaterThan(0);
});

worldTest('an expired jump buffer does not fire on later grounded contact', async ({ world, step, input }) => {
  await step(1);
  const player = world.spawn({
    LocalTransform: {},
    Player: {},
    PlayerControl: {},
    PlayerGroundContact: { grounded: false },
    PlayerMotion: { grounded: false, coyoteStepsRemaining: 0, airJumpsRemaining: 0 },
  });

  input.action('jump', 1);
  await step(7);
  expect(world.get(player, PlayerMotion).jumpBufferStepsRemaining).toBe(0);

  world.insert(player, PlayerGroundContact, { grounded: true });
  await step(1);
  const landed = world.get(player, PlayerMotion);
  expect(landed.grounded).toBe(true);
  expect(landed.verticalVelocity).toBe(0);
});

worldTest('one air jump is available and grounded contact restores it', async ({ world, step, input }) => {
  await step(1);
  const [player] = world.entities(Player);

  input.action('jump', 1);
  await step(1);
  input.action('jump', 0);
  await step(1);
  input.action('jump', 1);
  await step(1);

  const doubleJump = world.get(player!, PlayerMotion);
  expect(doubleJump.airJumpsRemaining).toBe(0);
  expect(doubleJump.verticalVelocity).toBeCloseTo(9.2 - 24 / 60);

  input.action('jump', 0);
  await step(1);
  input.action('jump', 1);
  await step(1);
  const rejectedVelocity = world.get(player!, PlayerMotion).verticalVelocity;
  expect(rejectedVelocity).toBeLessThan(9.2 - 24 / 60);

  input.action('jump', 0);
  await step(7);
  world.insert(player!, PlayerGroundContact, { grounded: false });
  await step(1);
  world.insert(player!, PlayerGroundContact, { grounded: true });
  await step(1);
  expect(world.get(player!, PlayerMotion).airJumpsRemaining).toBe(1);
  expect(world.get(player!, PlayerMotion).verticalVelocity).toBe(0);
});

worldTest('gravity carries a jump through its apex and clamps falling speed', async ({ world, step, input }) => {
  await step(1);
  const [player] = world.entities(Player);
  const startY = world.get(player!, LocalTransform).position[1]!;

  input.action('jump', 1);
  await step(1);
  for (let i = 0; i < 23; i++) {
    input.action('jump', 1);
    await step(1);
  }
  const apexY = world.get(player!, LocalTransform).position[1]!;
  expect(apexY).toBeGreaterThan(startY);
  expect(world.get(player!, PlayerMotion).verticalVelocity).toBeLessThan(0);

  await step(90);
  const falling = world.get(player!, PlayerMotion);
  expect(falling.verticalVelocity).toBe(-18);
  expect(world.get(player!, LocalTransform).position[1]!).toBeLessThan(apexY);
});

worldTest('jump mechanics produce a stable deterministic state hash', async ({ world, step, input }) => {
  await step(1);
  input.action('jump', 1);
  await step(5);
  input.action('jump', 0);
  await step(3);
  input.action('jump', 1);
  await step(11);
  input.action('moveX', -0.75);
  await step(17);

  expect(world.hash()).toBe('202e7c0977b18f8e');
});

worldTest('horizontal movement produces a stable deterministic state hash', async ({ world, step, input }) => {
  await step(1);
  for (let i = 0; i < 17; i++) {
    input.action('moveX', 0.75);
    await step(1);
  }
  for (let i = 0; i < 9; i++) {
    input.action('moveX', -0.5);
    await step(1);
  }
  await step(5);

  expect(world.hash()).toBe('f9ae30e76c8ffed1');
});

renderTest('the vertical slice stays within its 2D draw-call budget', async ({ step, render }) => {
  await step(2);

  const stats = render.stats({ width: 1920, height: 1080 });
  expect(stats.atlasPages).toBeLessThanOrEqual(5);
  render.expectDrawCalls('<=', 4, { width: 1920, height: 1080 });
});
