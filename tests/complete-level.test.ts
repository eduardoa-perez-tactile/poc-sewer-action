import { completeRoute } from './complete-route.ts';
import { expect, worldTest, renderTest } from './complete-level-test.ts';
import { Shape, Query, LoadingResumed, parseEntity, LocalTransform, loadData, NavGrid, Disabled } from '@gameengine/runtime';
import { FinalEncounter, FinalSoldier, TerrainVisual, LevelCollisionIndex, CameraFollowState, RoomCameraBounds, ActorSpawn, EnemyBrain, EncounterMember, GameState, Health, LevelProgress, EnemyProjectile, Player, PlatformCollisionGrid, SewerLevelDef, SoldierVisual, RestartRequested } from '../src/schema.gen.ts';
import { solidCells } from '../src/room/solid-cells.ts';
import { validateLevel } from '../src/game-flow/validate-level.ts';
import { cameraCenterBounds } from '../src/presentation/follow-player-camera.ts';
import { isStaticCollisionTile } from '../src/room/build-room-collision.ts';

worldTest('complete sewer manifest has safe checkpoints and bounded encounter content', async ({ world, step }) => {
  await step(3);
  const [level] = world.entities(LevelProgress);
  const def = loadData(SewerLevelDef, world.get(level!, LevelProgress).data!);
  validateLevel(def);
  expect(world.entities(EncounterMember).length).toBe(8);
  expect(world.entities(SoldierVisual).length).toBe(8);
  const grid = NavGrid.fromTilemap(def.tilemap, isStaticCollisionTile, { origin: [-8, -4.5], cellSize: 0.5 });
  expect(def.beats.map(cp => [cp.checkpointX, grid.isWalkable(Math.floor((cp.checkpointX + 8) * 2), Math.floor((cp.checkpointY + 4.5) * 2) - 1)])).toEqual([[-5.25, true], [9, true], [28, true], [47, true]]);
  expect(world.resource(PlatformCollisionGrid).columns).toBe(128);
  expect(world.entities(TerrainVisual).length).toBeLessThanOrEqual(64);
  expect(world.entities(TerrainVisual).length).toBeGreaterThan(0);
  for (const visual of world.entities(SoldierVisual)) expect(world.has(parseEntity(world.get(visual, SoldierVisual).actor as unknown as string), EncounterMember)).toBe(true);
});

worldTest('complete sewer start to finish replay clears ordered encounters and checkpoints', completeRoute);

worldTest('complete sewer checkpoint restart retains cleared encounters and resets the active fight', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  const [player] = world.entities(Player), [level] = world.entities(LevelProgress);
  // A focused checkpoint fixture; the full recorded route separately proves checkpoint acquisition.
  world.insert(level!, LevelProgress, { data: 'rooms/complete-sewer.json', built: true, beat: 2, checkpoint: 2, cleared: 2 });
  world.insert(player!, ActorSpawn, { position: [28, -2.5] });
  for (const enemy of world.entities(EncounterMember)) {
    world.insert(enemy, Health, { current: 0, maximum: world.get(enemy, Health).maximum! });
    world.insert(enemy, EnemyBrain, { state: 'Dead' });
  }
  input.emit(RestartRequested, {}); await step(1);
  expect(world.get(player!, LocalTransform).position).toEqual([28, -2.5, 0]);
  expect(world.get(player!, Health).current).toBe(5);
  expect(world.get(level!, LevelProgress).checkpoint).toBe(2);
  for (const enemy of world.entities(EncounterMember)) {
    const prior = world.get(enemy, EncounterMember).beat < 2;
    expect(world.get(enemy, Health).current).toBe(prior ? 0 : world.get(enemy, Health).maximum!);
    expect(world.get(enemy, EnemyBrain).state).toBe(prior ? 'Dead' : 'Idle');
  }
  await step(1);
  for (const enemy of world.entities(EncounterMember)) if (world.get(enemy, EncounterMember).beat === 2) expect(world.get(enemy, EncounterMember).activated).toBe(true);
});

worldTest('complete sewer gates reject skipping uncleared encounters and premature finish', async ({ world, step }) => {
  await step(3);
  const [player] = world.entities(Player), [level] = world.entities(LevelProgress);
  world.insert(player!, LocalTransform, { position: [54, -2.5, 0] });
  await step(2);
  expect(world.get(level!, LevelProgress).beat).toBe(0);
  expect(world.get(level!, LevelProgress).checkpoint).toBe(0);
  expect(world.get(level!, LevelProgress).finished).toBe(false);
});

renderTest('complete sewer camera draw and residency budgets hold at every checkpoint and screen extreme', async ({ world, step, input, render, loaded }) => {
  await loaded(); await step(3);
  const [player] = world.entities(Player);
  for (const viewport of [
    [1024, 768, 0, 0], [2556, 1179, 177, 102], [2560, 1080, 0, 0], [2200, 900, 100, 100],
  ]) {
    const [width, height, left, right] = viewport as [number, number, number, number];
    const top = left > 0 ? 24 : 0, bottom = right > 0 ? 24 : 0;
    input.view(width, height, 1, [left, top, right, bottom]);
    for (const x of [-5.25, 9, 28, 47, 54]) {
      world.insert(player!, LocalTransform, { position: [x, -2.5, 0] });
      await step(90);
      const camera = world.resource(CameraFollowState);
      const bounds = cameraCenterBounds(width, height, [left, top, right, bottom], world.resource(RoomCameraBounds));
      expect(camera.center[0]).toBeGreaterThanOrEqual(bounds.minX - 0.001);
      expect(camera.center[0]).toBeLessThanOrEqual(bounds.maxX + 0.001);
      for (const y of [-2.5, -1.3]) {
        const [sx, sy] = input.worldToScreen([x - camera.center[0], y - camera.center[1]]);
        expect(sx).toBeGreaterThanOrEqual(left);
        expect(sx).toBeLessThanOrEqual(width - right);
        expect(sy).toBeGreaterThanOrEqual(top);
        expect(sy).toBeLessThanOrEqual(height - bottom);
      }
      const stats = render.stats({ width, height });
      expect(stats.atlasPages).toBeLessThanOrEqual(5);
      expect(stats.instances).toBeGreaterThanOrEqual(18);
      render.expectDrawCalls('<=', 10, { width, height });
    }
  }
}, { memory: 'phone-low' });

worldTest('complete sewer packed terrain visits only swept cells across word boundaries', async ({ world, step }) => {
  await step(3);
  const [level] = world.entities(LevelCollisionIndex);
  const words = new Uint32Array(world.get(level!, LevelCollisionIndex).words);
  const cells = new Query();
  const selected = [...solidCells(cells, words, -8, -4.5, 0.5, 128, 18, 27, 28, -3, -2.5)];
  expect(selected.length).toBe(3);
  expect(selected.map(c => (c << 16) >> 16)).toEqual([70, 71, 72]);
  expect([...solidCells(cells, words, -8, -4.5, 0.5, 128, 18, 38, 39, -3, -2.5)].length).toBe(0);
});

worldTest('complete sewer water death returns to the authored checkpoint through restart input', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  const [player] = world.entities(Player), [level] = world.entities(LevelProgress);
  world.insert(level!, LevelProgress, { data: 'rooms/complete-sewer.json', built: true, beat: 1, checkpoint: 1, cleared: 2, activationPending: false });
  world.insert(player!, ActorSpawn, { position: [9, -2.5] });
  world.insert(player!, LocalTransform, { position: [18.5, -2.5, 0] });
  for (const enemy of world.entities(EncounterMember)) {
    world.insert(enemy, EnemyBrain, { state: 'Dead' });
    world.insert(enemy, Health, { current: 0, maximum: world.get(enemy, Health).maximum! });
  }
  for (let tick = 0; tick < 50; tick++) { input.action('moveX', 1); await step(1); }
  expect(world.resource(GameState).phase).toBe('PlayerDead');
  expect(world.get(level!, LevelProgress).checkpoint).toBe(1);
  input.action('moveX', 0); input.action('menuConfirm', 1); await step(3);
  expect(world.resource(GameState).phase).toBe('Playing');
  expect(world.get(player!, LocalTransform).position).toEqual([9, -2.5, 0]);
  expect(Math.abs(world.resource(CameraFollowState).center[0] - 9)).toBeLessThanOrEqual(6);
  expect(world.get(player!, Health).current).toBe(5);
});
