import { expect, type TestWorld, worldTest } from '@gameengine/test';
import { LocalTransform } from '@gameengine/runtime';
import { EnemyBrain, GameState, PlatformCollisionCell, PlatformCollisionGrid, Player, PlayerMotion } from '../src/schema.gen.ts';

const FLOOR_Y = 1;

function prepareScenario(world: TestWorld, playerX: number, floorEnd = 10): number {
  world.setResource(GameState, { initialized: true, phase: 'Playing' });
  const solidRows = new Array<number>(32).fill(0);
  solidRows[0] = floorEnd === 31 ? 0xffffffff : (1 << (floorEnd + 1)) - 1;
  world.setResource(PlatformCollisionGrid, { originX: 0, originY: 0, cellSize: 1, columns: floorEnd + 1, rows: 1, solidRows });
  const [player] = world.entities(Player);
  world.insert(player!, Player, { gravity: 0 });
  world.insert(player!, PlayerMotion, {});
  world.insert(player!, LocalTransform, { position: [playerX, FLOOR_Y, 0] });
  for (let x = 0; x <= floorEnd; x++) world.spawn({ PlatformCollisionCell: { x, y: 0 } });
  return player!;
}

function spawnSoldier(world: TestWorld, x: number, overrides: Record<string, unknown> = {}): number {
  return world.spawn({
    LocalTransform: { position: [x, FLOOR_Y, 0] },
    EnemyBrain: {
      patrolMinX: 0.5,
      patrolMaxX: 5.5,
      patrolSpeed: 3,
      chaseSpeed: 6,
      detectionRangeX: 5,
      detectionRangeY: 1,
      stopDistance: 1,
      collisionHalfWidth: 0.2,
      edgeProbeDistance: 0.05,
      turnPauseSteps: 3,
      targetMemorySteps: 4,
      facing: 'Right',
      ...overrides,
    },
  });
}

worldTest('soldier patrols between authored limits and pauses before turning', async ({ world, step }) => {
  await step(2);
  prepareScenario(world, 20);
  const soldier = spawnSoldier(world, 1, { patrolMaxX: 1.05 });

  await step(1);
  expect(world.get(soldier, LocalTransform).position[0]).toBeCloseTo(1.05);
  await step(1);
  expect(world.get(soldier, EnemyBrain).facing).toBe('Left');
  expect(world.get(soldier, EnemyBrain).turnPauseStepsRemaining).toBe(3);

  const pausedX = world.get(soldier, LocalTransform).position[0]!;
  await step(3);
  expect(world.get(soldier, LocalTransform).position[0]).toBe(pausedX);
  await step(1);
  expect(world.get(soldier, LocalTransform).position[0]).toBeLessThan(pausedX);
});

worldTest('soldier acquires a player deterministically and chases to its stop distance', async ({ world, step }) => {
  await step(2);
  prepareScenario(world, 4);
  const soldier = spawnSoldier(world, 1);

  await step(1);
  expect(world.get(soldier, EnemyBrain).state).toBe('Chase');
  expect(world.get(soldier, EnemyBrain).targetDetected).toBe(true);
  expect(world.get(soldier, EnemyBrain).lastKnownTargetX).toBe(4);
  expect(world.get(soldier, LocalTransform).position[0]).toBeGreaterThan(1);

  await step(40);
  const distance = 4 - world.get(soldier, LocalTransform).position[0]!;
  expect(distance).toBeGreaterThan(0);
  expect(distance).toBeLessThanOrEqual(1.1);
});

worldTest('soldier detection cancels a patrol turn pause and starts chase immediately', async ({ world, step }) => {
  await step(2);
  prepareScenario(world, 4);
  const soldier = spawnSoldier(world, 1, { turnPauseStepsRemaining: 10 });

  await step(1);
  expect(world.get(soldier, EnemyBrain).state).toBe('Chase');
  expect(world.get(soldier, EnemyBrain).turnPauseStepsRemaining).toBe(0);
  expect(world.get(soldier, LocalTransform).position[0]).toBeGreaterThan(1);
});

worldTest('soldier remembers a lost target for fixed steps before returning to patrol', async ({ world, step }) => {
  await step(2);
  const player = prepareScenario(world, 3);
  const soldier = spawnSoldier(world, 1, { targetMemorySteps: 3 });

  await step(1);
  expect(world.get(soldier, EnemyBrain).state).toBe('Chase');
  world.insert(player, LocalTransform, { position: [20, FLOOR_Y, 0] });

  await step(2);
  expect(world.get(soldier, EnemyBrain).state).toBe('Chase');
  expect(world.get(soldier, EnemyBrain).targetMemoryStepsRemaining).toBe(1);
  await step(1);
  expect(world.get(soldier, EnemyBrain).state).toBe('Patrol');
  expect(world.get(soldier, EnemyBrain).targetMemoryStepsRemaining).toBe(0);
  expect(world.get(soldier, EnemyBrain).turnPauseStepsRemaining).toBe(3);
});

worldTest('soldier stops at an unsupported platform edge and turns without falling', async ({ world, step }) => {
  await step(2);
  prepareScenario(world, 20, 0);
  const soldier = spawnSoldier(world, 0.65, {
    patrolMaxX: 5,
    patrolSpeed: 12,
    collisionHalfWidth: 0.2,
    edgeProbeDistance: 0.05,
  });

  await step(1);
  expect(world.get(soldier, LocalTransform).position).toEqual([0.65, FLOOR_Y, 0]);
  expect(world.get(soldier, EnemyBrain).facing).toBe('Left');
  expect(world.get(soldier, EnemyBrain).turnPauseStepsRemaining).toBe(3);
});

worldTest('soldier patrol detection and chase memory produce a stable deterministic hash', async ({ world, step }) => {
  await step(2);
  const player = prepareScenario(world, 4);
  spawnSoldier(world, 1, { targetMemorySteps: 5 });

  await step(12);
  world.insert(player, LocalTransform, { position: [20, FLOOR_Y, 0] });
  await step(8);
  expect(world.hash()).toBe('749f8f9b16a72eb3');
});
