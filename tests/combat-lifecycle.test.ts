import { expect, type TestWorld, worldTest } from './first-room-test.ts';
import { Disabled, entityString, LoadingResumed, LocalTransform, pool } from '@gameengine/runtime';
import {
  Alive,
  Cadaver,
  DamageRequested,
  EnemyBrain,
  EnemyProjectile,
  EnemyRestartState,
  GameState,
  Health,
  HitReaction,
  Player,
  PlayerControl,
  PlayerDashState,
  PlayerMotion,
  PlayerRestartState,
  Projectile,
  RestartRequested,
  RoomCollisionState,
  Weapon,
} from '../src/schema.gen.ts';

async function ready(world: TestWorld, step: (count?: number) => Promise<void>) {
  world.setResource(GameState, { initialized: true, phase: 'Playing' });
  world.setResource(RoomCollisionState, { built: true, cellCount: 0 });
  await step(2);
  const [player] = world.entities(Player);
  const [soldier] = world.entities(EnemyBrain);
  return { player: player!, soldier: soldier! };
}

worldTest('duplicate damage requests in one step apply exactly once', async ({ world, step, input }) => {
  const { player, soldier } = await ready(world, step);
  world.insert(soldier, Health, { current: 3, maximum: 3, invulnerabilitySteps: 6, invulnerableUntilStep: 0 });
  input.emit(DamageRequested, { source: entityString(player), target: entityString(soldier), amount: 1, knockback: [4, 2] });
  input.emit(DamageRequested, { source: entityString(player), target: entityString(soldier), amount: 1, knockback: [4, 2] });
  await step(2);
  expect(world.get(soldier, Health).current).toBe(2);
});

worldTest('invulnerability rejects intervening hits and expires on its exact fixed step', async ({ world, step, input }) => {
  const { player, soldier } = await ready(world, step);
  world.insert(soldier, Health, { current: 3, maximum: 3, invulnerabilitySteps: 3, invulnerableUntilStep: 0 });
  input.emit(DamageRequested, { source: entityString(player), target: entityString(soldier), amount: 1, knockback: [0, 0] });
  await step(1);
  input.emit(DamageRequested, { source: entityString(player), target: entityString(soldier), amount: 1, knockback: [0, 0] });
  await step(2);
  expect(world.get(soldier, Health).current).toBe(2);
  input.emit(DamageRequested, { source: entityString(player), target: entityString(soldier), amount: 1, knockback: [0, 0] });
  await step(1);
  expect(world.get(soldier, Health).current).toBe(1);
});

worldTest('valid damage starts deterministic knockback and a bounded enemy hit reaction', async ({ world, step, input }) => {
  const { player, soldier } = await ready(world, step);
  const before = world.get(soldier, LocalTransform).position;
  input.emit(DamageRequested, { source: entityString(player), target: entityString(soldier), amount: 1, knockback: [6, 3] });
  await step(2);
  expect(world.get(soldier, EnemyBrain).state).toBe('Stunned');
  expect(world.get(soldier, HitReaction).stepsRemaining).toBe(7);
  expect(world.get(soldier, LocalTransform).position[0]).toBeGreaterThan(before[0]!);
  await step(7);
  expect(world.get(soldier, HitReaction).stepsRemaining).toBe(0);
  expect(world.get(soldier, EnemyBrain).state).not.toBe('Stunned');
});

worldTest('enemy death creates a non-combat cadaver that settles and remains in place', async ({ world, step, input }) => {
  const { player, soldier } = await ready(world, step);
  world.insert(soldier, Health, { current: 1, maximum: 3, invulnerabilitySteps: 6, invulnerableUntilStep: 0 });
  input.emit(DamageRequested, { source: entityString(player), target: entityString(soldier), amount: 1, knockback: [8, 2] });
  await step(2);
  expect(world.get(soldier, Health).current).toBe(0);
  expect(world.get(soldier, EnemyBrain).state).toBe('Dead');
  expect(world.has(soldier, Alive)).toBe(false);
  expect(world.has(soldier, Cadaver)).toBe(true);
  const moving = world.get(soldier, LocalTransform).position[0]!;
  await step(12);
  const settled = world.get(soldier, LocalTransform).position[0]!;
  expect(settled).toBeGreaterThan(moving);
  await step(20);
  expect(world.get(soldier, LocalTransform).position[0]).toBe(settled);
  expect(world.get(soldier, Cadaver).ageSteps).toBe(10);
});

worldTest('player death enters the death phase and locks all gameplay input', async ({ world, step, input }) => {
  const { player, soldier } = await ready(world, step);
  world.insert(player, Health, { current: 1, maximum: 5, invulnerabilitySteps: 30, invulnerableUntilStep: 0 });
  input.emit(DamageRequested, { source: entityString(soldier), target: entityString(player), amount: 1, knockback: [-4, 2] });
  await step(2);
  expect(world.resource(GameState).phase).toBe('PlayerDead');
  const deadPosition = world.get(player, LocalTransform).position;
  input.action('moveX', 1);
  input.action('shoot', 1);
  input.action('jump', 1);
  input.action('dash', 1);
  await step(20);
  expect(world.get(player, PlayerControl)).toEqual({ moveX: 0, crouch: false, jumpHeld: false });
  expect(world.get(player, LocalTransform).position).toEqual(deadPosition);
  expect(world.entities(Projectile).filter((entity) => !world.has(entity, Disabled)).length).toBe(0);
});

worldTest('restart performs a deterministic full reset after death', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' });
  const { player, soldier } = await ready(world, step);
  world.insert(player, Health, { current: 1, maximum: 5, invulnerabilitySteps: 30, invulnerableUntilStep: 0 });
  world.insert(player, PlayerMotion, { horizontalVelocity: 7, verticalVelocity: 3, facing: 'Left' });
  world.insert(player, PlayerDashState, { active: true, activeStepsRemaining: 4, cooldownStepsRemaining: 40 });
  world.insert(player, Weapon, { cooldownStepsRemaining: 0 });
  world.insert(player, PlayerRestartState, { facing: 'Left', grounded: false, airJumps: 2 });
  world.insert(soldier, EnemyRestartState, { state: 'Idle', facing: 'Right', attackSequence: 2 });
  world.insert(soldier, Health, { current: 1, maximum: 3, invulnerabilitySteps: 6, invulnerableUntilStep: 0 });
  input.action('shoot', 1);
  input.emit(DamageRequested, { source: entityString(soldier), target: entityString(player), amount: 1, knockback: [-4, 2] });
  input.emit(DamageRequested, { source: entityString(player), target: entityString(soldier), amount: 1, knockback: [4, 2] });
  await step(2);
  expect(world.has(soldier, Cadaver)).toBe(true);
  expect(world.entities(Projectile).filter((entity) => !world.has(entity, Disabled)).length).toBeGreaterThan(0);
  input.emit(RestartRequested, {});
  await step(1);

  expect(world.resource(GameState)).toEqual({ initialized: true, phase: 'Playing' });
  expect(world.get(player, Health).current).toBe(5);
  expect(world.get(player, LocalTransform).position).toEqual([-5.25, -2.5, 0]);
  expect(world.get(player, PlayerMotion).horizontalVelocity).toBe(0);
  expect(world.get(player, PlayerMotion).facing).toBe('Left');
  expect(world.get(player, PlayerMotion).groundedForMovement).toBe(false);
  expect(world.get(player, PlayerMotion).airJumpsRemaining).toBe(2);
  expect(world.get(player, PlayerDashState).active).toBe(false);
  expect(world.get(player, Weapon).cooldownStepsRemaining).toBe(0);
  expect(world.has(player, Alive)).toBe(true);
  expect(world.get(soldier, Health).current).toBe(3);
  expect(world.get(soldier, EnemyBrain).state).toBe('Idle');
  expect(world.get(soldier, EnemyBrain).facing).toBe('Right');
  expect(world.get(soldier, EnemyBrain).attackSequence).toBe(2);
  expect(world.has(soldier, Cadaver)).toBe(false);
  expect(world.entities(Projectile).filter((entity) => !world.has(entity, Disabled)).length).toBe(0);
  expect(world.entities(EnemyProjectile).filter((entity) => !world.has(entity, Disabled)).length).toBe(0);
  expect(pool.stats().every((entry) => entry.misses === 0)).toBe(true);
});

worldTest('combat lifecycle and restart produce a stable deterministic hash', async ({ world, step, input }) => {
  const { player, soldier } = await ready(world, step);
  world.insert(soldier, Health, { current: 1, maximum: 3, invulnerabilitySteps: 4, invulnerableUntilStep: 0 });
  input.emit(DamageRequested, { source: entityString(player), target: entityString(soldier), amount: 1, knockback: [5, 2] });
  await step(18);
  input.emit(RestartRequested, {});
  await step(4);
  expect(world.hash()).toBe('917f8d32661ea03e');
});

worldTest('combat lifecycle replay reaches enemy death and restart through recorded input', async ({ world, step, input }) => {
  await step(2);
  const [player] = world.entities(Player);
  const [soldier] = world.entities(EnemyBrain);
  for (let i = 0; i < 3; i++) {
    input.emit(DamageRequested, { source: entityString(player!), target: entityString(soldier!), amount: 1, knockback: [4, 2] });
    await step(7);
  }
  expect(world.get(soldier!, Health).current).toBe(0);
  expect(world.has(soldier!, Cadaver)).toBe(true);

  input.emit(RestartRequested, {});
  await step(2);
  expect(world.get(soldier!, Health).current).toBe(3);
  expect(world.has(soldier!, Cadaver)).toBe(false);
  expect(world.resource(GameState).phase).toBe('Playing');
});
