import { expect, renderTest, worldTest } from './first-room-test.ts';
import { Clip2D, clip2DInfo, Disabled, entityString, LoadingResumed, LocalTransform, ParticleSystem, Sprite, VisualOffset, WorldTransform } from '@gameengine/runtime';
import { CameraFollowState, CombatEffect, CombatVisual, CombatVisualState, DamageRequested, EnemyBrain, EnemyProjectile, Health, HitReaction, Player, RestartRequested, SoldierVisual } from '../src/schema.gen.ts';

worldTest('soldier and effect clips intentionally cover all supplied source frames', async () => {
  const expected = [
    ['idle', 1, 'once'], ['run', 6, 'loop'], ['jump', 1, 'once'], ['shoot', 2, 'once'],
    ['crouch-shoot', 2, 'once'], ['throw', 6, 'once'], ['hurt', 1, 'once'], ['death', 1, 'once'],
  ] as const;
  for (const [name, frames, loop] of expected) {
    const clip = clip2DInfo(`art/soldier/${name}.clip2d.json`);
    expect(clip.frames.length).toBe(frames); expect(clip.loop).toBe(loop);
  }
  expect(clip2DInfo('art/soldier/death.clip2d.json').frames[0]!.sprite).toBe('art/soldier/hurt');
  for (const [name, count, duration] of [['muzzle', 1, 0.05], ['hit', 2, 0.2], ['explosion', 2, 0.2], ['water-splash', 5, 0.5]] as const) {
    const clip = clip2DInfo(`art/effects/${name}.clip2d.json`);
    expect(clip.frames.length).toBe(count); expect(clip.duration).toBeCloseTo(duration, 5); expect(clip.loop).toBe('once');
  }
});

for (const [sequence, releaseSteps, frame, eventName] of [[0, 6, 1, 'fire-bullet'], [1, 8, 1, 'fire-crouch-bullet'], [2, 15, 3, 'throw-bomb']] as const) {
  worldTest(`soldier attack ${sequence} visual and projectile share the exact release clock`, async ({ world, step, input }) => {
    input.emit(LoadingResumed, { name: 'boot' }); await step(3);
    const soldier = world.entities(EnemyBrain)[0]!;
    const player = world.entities(Player)[0]!;
    world.insert(player, LocalTransform, { position: [5, -2.5, 0] });
    world.insert(player, Health, { current: 100, maximum: 100 });
    world.insert(soldier, EnemyBrain, { state: 'Chase', targetDetected: true, attackSequence: sequence, attackRange: 10, detectionRangeX: 20, attackCooldownStepsRemaining: 0 });
    await step(1);
    const visual = world.entities(SoldierVisual)[0]!;
    const clip = clip2DInfo(world.get(soldier, Clip2D).clip!);
    expect(clip.events[0]!.name).toBe(eventName); expect(clip.events[0]!.frame).toBe(frame);
    await step(releaseSteps - 1);
    expect(world.entities(EnemyProjectile).filter((e) => !world.has(e, Disabled)).length).toBe(0);
    expect(world.events(CombatEffect).length).toBe(0);
    await step(1);
    expect(world.entities(EnemyProjectile).filter((e) => !world.has(e, Disabled)).length).toBe(1);
    expect(world.get(visual, SoldierVisual).frame).toBe(frame);
    if (sequence < 2) {
      expect(world.events(CombatEffect).length).toBe(1);
      const muzzle = world.entities(CombatVisual).filter((e) => world.get(e, CombatVisual).kind === 'muzzle');
      expect(muzzle.length).toBe(1);
      expect(world.get(muzzle[0]!, CombatVisual).bursts).toBe(1);
      const remaining = world.get(muzzle[0]!, CombatVisual).remaining[0]!;
      await step(1);
      expect(world.get(muzzle[0]!, CombatVisual).remaining[0]).toBeLessThan(remaining);
    }
  });
}

worldTest('combat visual slots remain bounded and restart cancels every active clip', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  expect(world.entities(CombatVisual).length).toBe(3);
  for (let i = 0; i < 10; i++) input.emit(CombatEffect, { kind: 'hit', position: [i * 0.1, -1], step: 100 });
  await step(1);
  const hit = world.entities(CombatVisual).find((e) => world.get(e, CombatVisual).kind === 'hit')!;
  expect(world.get(hit, CombatVisual).remaining.filter((time) => time > 0).length).toBe(4);
  expect(world.get(hit, CombatVisual).bursts).toBe(4);
  const before = world.hash();
  for (const e of world.entities(CombatVisual)) world.insert(e, CombatVisual, { remaining: [0, 0, 0, 0] });
  expect(world.hash()).toBe(before);
  input.emit(RestartRequested, {}); await step(1);
  expect(world.resource(CombatVisualState).active).toBe(false);
  expect(world.entities(CombatVisual).every((e) => world.get(e, ParticleSystem).effect === null)).toBe(true);
});

worldTest('soldier hurt death and restart presentation never replace the authoritative attack clip', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  const soldier = world.entities(EnemyBrain)[0]!;
  const visual = world.entities(SoldierVisual)[0]!;
  world.insert(soldier, HitReaction, { stepsRemaining: 8 }); await step(1);
  expect(world.get(visual, SoldierVisual).clip).toBe('art/soldier/hurt.clip2d.json');
  input.emit(DamageRequested, { source: entityString(soldier), target: entityString(soldier), amount: 100 }); await step(24);
  expect(world.get(visual, SoldierVisual).clip).toBe('art/soldier/death.clip2d.json');
  const offset = world.get(visual, VisualOffset);
  await step(60); expect(world.get(visual, VisualOffset)).toEqual(offset);
  input.emit(RestartRequested, {}); await step(2);
  expect(world.get(visual, SoldierVisual).clip).toBe('art/soldier/run.clip2d.json');
  expect(world.get(visual, VisualOffset).scale).toEqual([1, 1, 1]);
});

renderTest('combat animations render bounded effects across landscape screen extremes', async ({ world, step, input, render }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  const soldier = world.entities(EnemyBrain)[0]!;
  const player = world.entities(Player)[0]!;
  world.insert(player, Health, { current: 100, maximum: 100 });
  world.insert(player, LocalTransform, { position: [-1, -2.5, 0] });
  world.insert(soldier, EnemyBrain, { state: 'Idle', detectionRangeX: 0 });
  world.insert(soldier, LocalTransform, { position: [1, -2.5, 0] });
  for (const [kind, x] of [['muzzle', -0.38], ['hit', 1], ['explosion', 2]] as const) input.emit(CombatEffect, { kind, position: [x, -1.6], step: 100 });
  await step(1);
  const visual = world.entities(SoldierVisual)[0]!;
  expect(world.has(visual, WorldTransform)).toBe(true);
  expect(world.get(visual, Sprite).visible).toBe(true);
  expect(world.get(soldier, Sprite).visible).toBe(false);
  expect(world.entities(CombatVisual).filter((e) => world.get(e, CombatVisual).remaining[0]! > 0).length).toBe(3);
  expect(render.stats({ width: 960, height: 540 }).particleInstances).toBe(3);
  render.expectScreenshot('combat', { width: 960, height: 540 });
  for (const [width, height, safe] of [[2316, 904, [84, 0, 0, 0]], [2556, 1179, [177, 0, 102, 0]], [2160, 1620, [40, 0, 0, 0]], [1812, 2176, [0, 74, 0, 42]], [2560, 1080, [0, 0, 0, 0]]] as const) {
    input.view(width, height, 1, [...safe]); await step(1);
    const center = world.resource(CameraFollowState).center;
    for (const [x, y] of [[0.36, -2.5], [1.64, -1.3], [1.36, -2.24], [2.64, -0.96]]) {
      const [screenX, screenY] = input.worldToScreen([x! - center[0], y! - center[1]]);
      expect(screenX).toBeGreaterThanOrEqual(safe[0]); expect(screenX).toBeLessThanOrEqual(width - safe[2]);
      expect(screenY).toBeGreaterThanOrEqual(safe[1]); expect(screenY).toBeLessThanOrEqual(height - safe[3]);
    }
    render.expectDrawCalls('<=', 11, { width, height });
  }
  await step(60);
  expect(world.resource(CombatVisualState).active).toBe(false);
  expect(render.stats({ width: 960, height: 540 }).particleInstances).toBe(0);
});

worldTest('soldier locomotion samples run and jump without changing attack playback', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  const soldier = world.entities(EnemyBrain)[0]!;
  const visual = world.entities(SoldierVisual)[0]!;
  world.insert(soldier, EnemyBrain, { state: 'Patrol', detectionRangeX: 0 });
  await step(2);
  expect(world.get(visual, SoldierVisual).clip).toBe('art/soldier/run.clip2d.json');
  const attackClip = world.get(soldier, Clip2D).clip;
  const position = world.get(soldier, LocalTransform).position;
  world.insert(soldier, EnemyBrain, { state: 'Idle' });
  world.insert(soldier, LocalTransform, { position: [position[0]!, position[1]! + 1, 0] });
  await step(1);
  expect(world.get(visual, SoldierVisual).clip).toBe('art/soldier/jump.clip2d.json');
  expect(world.get(soldier, Clip2D).clip).toBe(attackClip);
});

worldTest('combat animation feedback replay warms soldier attacks and effects', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  for (let i = 0; i < 75; i++) { input.action('moveX', 1); await step(1); }
  input.action('moveX', 0); await step(270);
  for (const kind of ['muzzle', 'hit', 'explosion']) {
    const host = world.entities(CombatVisual).find((e) => world.get(e, CombatVisual).kind === kind)!;
    expect(world.get(host, CombatVisual).bursts).toBeGreaterThan(0);
  }
  for (let i = 0; i < 45; i++) { input.action('fire', 1); await step(1); }
  input.action('fire', 0);
  for (let i = 0; i < 240; i++) { input.action('moveX', 1); await step(1); }
  input.action('moveX', 0); input.emit(RestartRequested, {}); await step(2);
});
