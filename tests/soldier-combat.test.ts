import { expect, type TestWorld, worldTest } from './first-room-test.ts';
import { Clip2D, Disabled, LoadingResumed, LocalTransform, pool } from '@gameengine/runtime';
import { EnemyAttackPoolState, EnemyBrain, EnemyProjectile, GameState, Health, Player, RoomCollisionState } from '../src/schema.gen.ts';

function activeEnemyProjectiles(world: TestWorld): number[] {
  return world.entities(EnemyProjectile).filter((entity) => !world.has(entity, Disabled));
}

async function ready(world: TestWorld, step: (count?: number) => Promise<void>, playerX = 4) {
  world.setResource(GameState, { initialized: true, phase: 'Playing' });
  world.setResource(RoomCollisionState, { built: true, cellCount: 0 });
  const [player] = world.entities(Player);
  const [soldier] = world.entities(EnemyBrain);
  world.insert(player!, LocalTransform, { position: [playerX, -2.5, 0] });
  world.insert(player!, Health, { current: 20, maximum: 20 });
  world.insert(soldier!, EnemyBrain, {
    state: 'Chase',
    facing: 'Right',
    targetDetected: true,
    lastKnownTargetX: playerX,
    detectionRangeX: 20,
    attackRange: 10,
    attackCooldownSteps: 2,
    attackCooldownStepsRemaining: 0,
  });
  return { player: player!, soldier: soldier! };
}

worldTest('enemy projectile pools warm once at bounded sizes', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' });
  await step(3);
  expect(world.resource(EnemyAttackPoolState).warmed).toBe(true);
  const bullet = pool.stats().find((entry) => entry.name === 'enemy-bullets')!;
  const bomb = pool.stats().find((entry) => entry.name === 'enemy-bombs')!;
  expect([bullet.size, bullet.free, bullet.misses]).toEqual([8, 8, 0]);
  expect([bomb.size, bomb.free, bomb.misses]).toEqual([4, 4, 0]);
});

worldTest('soldier shot is telegraphed and released only by the authored frame event', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' });
  await step(3);
  const { soldier } = await ready(world, step);

  await step(1);
  expect(world.get(soldier, EnemyBrain).attackKind).toBe('Shoot');
  expect(world.get(soldier, EnemyBrain).attackTelegraphed).toBe(true);
  expect(world.get(soldier, Clip2D).clip).toBe('art/soldier/shoot.clip2d.json');
  expect(activeEnemyProjectiles(world).length).toBe(0);

  await step(5);
  expect(activeEnemyProjectiles(world).length).toBe(0);
  await step(1);
  expect(activeEnemyProjectiles(world).length).toBe(1);
  expect(world.get(soldier, EnemyBrain).attackTelegraphed).toBe(false);
});

worldTest('soldier cycles through standing, crouch and bomb attack states deterministically', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' });
  await step(3);
  const { soldier } = await ready(world, step);

  for (const [sequence, kind, clip] of [
    [0, 'Shoot', 'art/soldier/shoot.clip2d.json'],
    [1, 'CrouchShoot', 'art/soldier/crouch-shoot.clip2d.json'],
    [2, 'Bomb', 'art/soldier/throw.clip2d.json'],
  ] as const) {
    world.insert(soldier, EnemyBrain, { state: 'Chase', attackSequence: sequence, attackCooldownStepsRemaining: 0, targetDetected: true });
    await step(1);
    expect(world.get(soldier, EnemyBrain).attackKind).toBe(kind);
    expect(world.get(soldier, Clip2D).clip).toBe(clip);
  }
});

worldTest('soldier clip completion starts an exact fixed-step cooldown before the next attack', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' });
  await step(3);
  const { soldier } = await ready(world, step);

  await step(1);
  expect(world.get(soldier, EnemyBrain).state).toBe('Attack');
  expect(world.get(soldier, EnemyBrain).attackKind).toBe('Shoot');
  await step(11);
  expect(world.get(soldier, EnemyBrain).state).toBe('Attack');
  await step(1);
  expect(world.get(soldier, EnemyBrain).state).toBe('Chase');
  expect(world.get(soldier, EnemyBrain).attackKind).toBe('None');
  expect(world.get(soldier, EnemyBrain).attackCooldownStepsRemaining).toBe(2);

  await step(1);
  expect(world.get(soldier, EnemyBrain).state).toBe('Chase');
  expect(world.get(soldier, EnemyBrain).attackCooldownStepsRemaining).toBe(1);
  await step(1);
  expect(world.get(soldier, EnemyBrain).state).toBe('Chase');
  expect(world.get(soldier, EnemyBrain).attackCooldownStepsRemaining).toBe(0);
  await step(1);
  expect(world.get(soldier, EnemyBrain).state).toBe('Attack');
  expect(world.get(soldier, EnemyBrain).attackKind).toBe('CrouchShoot');
  expect(world.get(soldier, EnemyBrain).attackTelegraphed).toBe(true);
});

worldTest('enemy bullet moves on fixed steps, impacts health and returns to its pool', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' });
  await step(3);
  const { player } = await ready(world, step, 4.5);
  await step(9);
  expect(activeEnemyProjectiles(world).length).toBe(1);
  const before = world.get(player, Health).current;
  await step(8);
  expect(world.get(player, Health).current).toBe(before - 1);
  expect(activeEnemyProjectiles(world).length).toBe(0);
  const bullet = pool.stats().find((entry) => entry.name === 'enemy-bullets')!;
  expect([bullet.size, bullet.free, bullet.misses, bullet.grown]).toEqual([8, 8, 0, 0]);
});

worldTest('bomb release follows its later clip event and ballistic projectile has bounded cleanup', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' });
  await step(3);
  const { soldier } = await ready(world, step, 9);
  world.insert(soldier, EnemyBrain, { attackSequence: 2 });
  await step(1);
  expect(world.get(soldier, EnemyBrain).attackKind).toBe('Bomb');
  await step(14);
  expect(activeEnemyProjectiles(world).length).toBe(0);
  await step(1);
  const [bomb] = activeEnemyProjectiles(world);
  expect(bomb).toBeDefined();
  const start = world.get(bomb!, LocalTransform).position;
  await step(3);
  const moved = world.get(bomb!, LocalTransform).position;
  expect(moved[0]).toBeGreaterThan(start[0]!);
  expect(moved[1]).toBeGreaterThan(start[1]!);
  await step(100);
  expect(activeEnemyProjectiles(world).length).toBe(0);
  const bombPool = pool.stats().find((entry) => entry.name === 'enemy-bombs')!;
  expect([bombPool.size, bombPool.free, bombPool.misses, bombPool.grown]).toEqual([4, 4, 0, 0]);
});

worldTest('soldier attacks and pooled projectile cleanup have a stable deterministic hash', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' });
  await step(3);
  await ready(world, step, 5);
  await step(160);
  expect(activeEnemyProjectiles(world).length).toBeLessThanOrEqual(1);
  expect(world.hash()).toBe('1eab73fc56ba6776');
});

worldTest('the soldier ranged encounter replay reaches attacks through player input', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' });
  await step(3);
  for (let i = 0; i < 75; i++) {
    input.action('moveX', 1);
    await step(1);
  }
  input.action('moveX', 0);
  await step(150);

  const [player] = world.entities(Player);
  const [soldier] = world.entities(EnemyBrain);
  expect(world.get(player!, LocalTransform).position[0]).toBeGreaterThan(-3.5);
  expect(world.get(soldier!, EnemyBrain).attackSequence).toBeGreaterThan(0);
  const bullet = pool.stats().find((entry) => entry.name === 'enemy-bullets')!;
  const bomb = pool.stats().find((entry) => entry.name === 'enemy-bombs')!;
  expect((bullet.peak ?? 0) + (bomb.peak ?? 0)).toBeGreaterThan(0);
});
