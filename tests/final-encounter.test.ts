import { type WorldTestContext, expect } from '@gameengine/test';
import { Bounds2D, Disabled, entityString, LoadingResumed, LocalTransform, loadData, NavGrid, pool, Time, Shape, SpriteAnimation } from '@gameengine/runtime';
import { renderTest, worldTest } from './complete-level-test.ts';
import { ActorDied, ActorSpawn, CameraFollowState, DamageRequested, EnemyBrain, FinalCue, EnemyProjectile, FinalEncounter, FinalSoldier, FinalWarning, GameState, GameplayPresentation, Health, LevelProgress, Player, RestartRequested, SewerLevelDef } from '../src/schema.gen.ts';
import { isStaticCollisionTile } from '../src/room/build-room-collision.ts';
import { validateLevel } from '../src/game-flow/validate-level.ts';

async function checkpoint(ctx: WorldTestContext) {
  const { world, input, step } = ctx;
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  const level = world.entities(LevelProgress)[0]!, player = world.entities(Player)[0]!;
  world.insert(level, LevelProgress, { data: 'rooms/complete-sewer.json', built: true, beat: 3, checkpoint: 3, cleared: 3 });
  world.insert(player, ActorSpawn, { position: [47, -2.5] });
  input.emit(RestartRequested, {}); await step(2);
  const actors = world.entities(FinalSoldier).sort((a, b) => world.get(a, FinalSoldier).phase! - world.get(b, FinalSoldier).phase!);
  return { level, player, guard: actors[0]!, bomber: actors[1]! };
}

function damage(ctx: WorldTestContext, target: number, source: number) {
  ctx.input.emit(DamageRequested, { target: entityString(target), source: entityString(source), amount: 99, bypassInvulnerability: true, knockback: [0, 0] });
}

async function start(ctx: WorldTestContext) {
  const actors = await checkpoint(ctx);
  ctx.world.insert(actors.player, LocalTransform, { position: [47.5, -2.5, 0] });
  await ctx.step(1);
  expect(ctx.world.get(actors.level, FinalEncounter).phase).toBe('Guard');
  return actors;
}

async function bombardment(ctx: WorldTestContext) {
  const actors = await start(ctx);
  damage(ctx, actors.guard, actors.player); await ctx.step(2);
  expect(ctx.world.get(actors.level, FinalEncounter).phase).toBe('Warning');
  await ctx.step(45);
  expect(ctx.world.get(actors.level, FinalEncounter).phase).toBe('Bombardment');
  return actors;
}

worldTest('final encounter validates bounded phase content and actor floor support', async ctx => {
  const { world } = ctx, { level } = await checkpoint(ctx);
  const def = loadData(SewerLevelDef, world.get(level, LevelProgress).data!);
  const grid = NavGrid.fromTilemap(def.tilemap, isStaticCollisionTile, { origin: [-8, -4.5], cellSize: 0.5 });
  for (const actor of def.soldiers.filter(s => s.finalPhase !== undefined)) {
    if (!grid.isWalkable(Math.floor((actor.x + 8) * 2), Math.floor((actor.y + 4.5) * 2) - 1)) throw new Error('Unsupported soldier at ' + JSON.stringify(actor));
  }
  for (const mutation of [
    { finalEncounter: { ...def.finalEncounter, warningSteps: 0 } },
    { finalEncounter: { ...def.finalEncounter, triggerX: 54 } },
    { soldiers: def.soldiers.slice(0, -1) },
    { soldiers: [...def.soldiers.slice(0, -1), { ...def.soldiers[7]!, finalPhase: 0 }] },
  ]) {
    let rejected = false;
    try { validateLevel({ ...def, ...mutation }); } catch { rejected = true; }
    expect(rejected).toBe(true);
  }
});

worldTest('final encounter rejects premature gates dormant damage and duplicate triggers', async ctx => {
  const { world, step, input } = ctx, { level, player, guard, bomber } = await checkpoint(ctx);
  for (const position of [[47.4, -2.5, 0], [54, 3, 0], [56, -2.5, 0]]) {
    world.insert(player, LocalTransform, { position: position as [number, number, number] }); await step(1);
    expect(world.get(level, FinalEncounter).phase).toBe('Waiting');
  }
  damage(ctx, guard, player); damage(ctx, bomber, player); await step(2);
  expect(world.get(guard, Health).current).toBe(4); expect(world.get(bomber, Health).current).toBe(4);
  world.insert(player, LocalTransform, { position: [47.5, -2.5, 0] }); await step(1);
  expect(world.get(guard, FinalSoldier).active).toBe(true); expect(world.get(bomber, FinalSoldier).active).toBe(false);
  await step(1); const sequence = world.get(guard, EnemyBrain).attackSequence;
  await step(1); expect(world.get(guard, EnemyBrain).attackSequence).toBe(sequence);
  damage(ctx, guard, player); await step(2);
  const deadline = world.get(level, FinalEncounter).deadlineStep!;
  expect(world.has(level, FinalWarning)).toBe(true);
  input.emit(ActorDied, { actor: entityString(guard), killer: entityString(player) }); damage(ctx, bomber, player); await step(deadline - Number(world.resource(Time).step) - 1);
  expect(world.resource(Time).step).toBe(deadline - 1);
  expect(world.get(level, FinalEncounter).deadlineStep).toBe(deadline);
  expect(world.get(level, FinalEncounter).phase).toBe('Warning');
  expect(world.get(bomber, Health).current).toBe(4);
  await step(1);
  expect(world.get(level, FinalEncounter).phase).toBe('Bombardment');
  expect(world.has(level, FinalWarning)).toBe(false);
  expect(world.get(bomber, EnemyBrain).attackSequence).toBe(2);
});

worldTest('final encounter bomb opener uses existing pool then alive outlet latches victory', async ctx => {
  const { world, step, input } = ctx, { level, player, bomber } = await bombardment(ctx);
  world.insert(player, LocalTransform, { position: [52.5, -2.5, 0] });
  await step(20);
  expect(world.entities(EnemyProjectile).some(e => world.get(e, EnemyProjectile).kind === 'Bomb')).toBe(true);
  expect(world.get(level, LevelProgress).finished).toBe(false);
  damage(ctx, bomber, player); await step(2);
  expect(world.get(level, FinalEncounter).phase).toBe('ExitOpen');
  expect(world.resource(GameState).phase).toBe('Playing');
  world.insert(player, LocalTransform, { position: [54, 3, 0] }); await step(1);
  expect(world.get(level, FinalEncounter).phase).toBe('ExitOpen');
  world.insert(player, LocalTransform, { position: [54, -2.5, 0] }); await step(1);
  expect(world.get(level, FinalEncounter).phase).toBe('Won');
  expect(world.resource(GameState).phase).toBe('Completed');
  expect(world.resource(GameplayPresentation).phase).toBe('Completed');
  expect(world.get(level, LevelProgress).finished).toBe(true);
  expect(world.entities(EnemyProjectile).filter(e => !world.has(e, Disabled)).length).toBe(0);
  damage(ctx, player, bomber); input.emit(RestartRequested, {}); await step(3);
  expect(world.get(level, FinalEncounter).phase).toBe('Won');
  expect(world.resource(GameState).phase).toBe('Completed');
  for (const stats of pool.stats()) { expect(stats.misses).toBe(0); expect(stats.grown).toBe(0); }
});

for (const phase of ['Guard', 'Warning', 'Bombardment', 'ExitOpen']) worldTest(`final encounter ${phase} death and checkpoint restart reset all phases`, async ctx => {
  const { world, step, input } = ctx;
  const actors = phase === 'Guard' || phase === 'Warning' ? await start(ctx) : await bombardment(ctx);
  const { level, player, guard, bomber } = actors;
  if (phase === 'Warning') { damage(ctx, guard, player); await step(2); }
  if (phase === 'ExitOpen') { damage(ctx, bomber, player); await step(2); }
  expect(world.get(level, FinalEncounter).phase).toBe(phase);
  damage(ctx, player, bomber);
  // Simultaneous final death and arrival must never award a win to a dead player.
  if (phase === 'Bombardment') damage(ctx, bomber, player);
  world.insert(player, LocalTransform, { position: [54, -2.5, 0] }); await step(2);
  expect(world.resource(GameState).phase).toBe('PlayerDead');
  expect(world.get(level, FinalEncounter).phase).toBe('Failed');
  expect(world.get(level, LevelProgress).finished).toBe(false);
  input.action('menuConfirm', 1); await step(3); input.action('menuConfirm', 0); await step(1);
  expect(world.resource(GameState).phase).toBe('Playing');
  expect(world.get(level, FinalEncounter).phase).toBe('Waiting');
  expect(world.get(level, LevelProgress).checkpoint).toBe(3);
  expect(world.get(player, LocalTransform).position).toEqual([47, -2.5, 0]);
  for (const actor of [guard, bomber]) {
    expect(world.get(actor, Health).current).toBe(4);
    expect(world.get(actor, FinalSoldier).active).toBe(false);
    expect(world.get(actor, Bounds2D).mask).toBe(0);
    expect(world.get(actor, EnemyBrain).state).toBe('Idle');
  }
  expect(world.has(level, FinalWarning)).toBe(false);
  expect(world.entities(EnemyProjectile).filter(e => !world.has(e, Disabled)).length).toBe(0);
  world.insert(player, LocalTransform, { position: [47.5, -2.5, 0] }); await step(1);
  expect(world.get(level, FinalEncounter).phase).toBe('Guard');
});

renderTest('final encounter frame shows arena actors and cues inside every landscape safe area', async ctx => {
  await ctx.loaded();
  const { world, step, input, render } = ctx, { level } = await start(ctx);
  for (const [width, height, safe] of [
    [2316, 904, [84, 0, 0, 0]], [3840, 1644, [96, 0, 0, 0]], [2556, 1179, [177, 0, 102, 0]],
    [1334, 750, [40, 0, 0, 0]], [2160, 1620, [40, 0, 0, 0]], [2176, 1812, [74, 0, 42, 0]],
    [2560, 1080, [0, 0, 0, 0]], [800, 600, [0, 0, 0, 0]],
  ] as [number, number, [number, number, number, number]][]) {
    input.view(width, height, 1, safe);
    for (const phase of ['Guard', 'Warning', 'Bombardment', 'ExitOpen', 'Won', 'Failed'] as const) {
      world.insert(level, FinalEncounter, { phase }); await step(60);
      const camera = world.resource(CameraFollowState);
      for (const x of [47, 50.5, 52, 54.4]) for (const y of [-2.5, 0.5]) {
        const [sx, sy] = input.worldToScreen([x - camera.center[0], y - camera.center[1]]);
        expect(sx).toBeGreaterThanOrEqual(safe[0]); expect(sx).toBeLessThanOrEqual(width - safe[2]);
        expect(sy).toBeGreaterThanOrEqual(safe[1]); expect(sy).toBeLessThanOrEqual(height - safe[3]);
      }
      const stats = render.stats({ width, height });
      expect(stats.atlasPages).toBeLessThanOrEqual(5); render.expectDrawCalls('<=', 10, { width, height });
    }
  }
}, { memory: 'phone-low' });

worldTest('final encounter presentation cues never change the deterministic hash', async ctx => {
  const { world, step } = ctx;
  await start(ctx);
  const before = world.hash();
  for (const cue of world.entities(FinalCue)) world.insert(cue, Shape, { size: [0.5, 0.12], color: [1, 0, 0, 1] });
  expect(world.hash()).toBe(before);
  await step(1);
});

renderTest('final encounter retreat keeps the moving player inside the safe frame', async ctx => {
  await ctx.loaded();
  const { world, step, input } = ctx, { player } = await start(ctx);
  input.view(2556, 1179, 1, [177, 0, 102, 0]);
  for (let tick = 0; tick < 40; tick++) {
    input.action('moveX', -1);
    await step(1);
    const p = world.get(player, LocalTransform).position, camera = world.resource(CameraFollowState);
    for (const y of [p[1]!, p[1]! + 1.2]) {
      const [sx, sy] = input.worldToScreen([p[0]! - camera.center[0], y - camera.center[1]]);
      expect(sx).toBeGreaterThanOrEqual(177); expect(sx).toBeLessThanOrEqual(2454);
      expect(sy).toBeGreaterThanOrEqual(0); expect(sy).toBeLessThanOrEqual(1179);
    }
  }
  expect(world.get(player, LocalTransform).position[0]).toBeLessThan(44);
}, { memory: 'phone-low' });

renderTest('final encounter completion settles player animation and holds its pose', async ctx => {
  await ctx.loaded();
  const { world, step } = ctx, { level, player } = await bombardment(ctx);
  const bomber = world.entities(FinalSoldier).find(e => world.get(e, FinalSoldier).phase === 1)!;
  damage(ctx, bomber, player); await step(2);
  world.insert(player, LocalTransform, { position: [54, -2.5, 0] }); await step(1);
  expect(world.get(level, FinalEncounter).phase).toBe('Won');
  await step(120);
  const animation = world.get(player, SpriteAnimation);
  expect(animation.loop).toBe(false); expect(animation.playing).toBe(false);
  await step(60);
  expect(world.get(player, SpriteAnimation).frame).toBe(animation.frame);
  expect(world.get(player, SpriteAnimation).time).toBe(animation.time);
});
