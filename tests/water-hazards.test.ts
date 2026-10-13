import { expect, renderTest, type TestWorld, worldTest } from './first-room-test.ts';
import { Bounds2D, Disabled, LocalTransform, Sprite, SpriteAnimation, VisualOffset } from '@gameengine/runtime';
import { Alive, CameraFollowState, GameState, Hazard, Health, Player, PlayerMotion, RestartRequested, RoomCollisionState, WaterContact, WaterEntered, WaterSplash, WaterSplashState } from '../src/schema.gen.ts';

async function ready(world: TestWorld, step: (count?: number) => Promise<void>) {
  world.setResource(GameState, { initialized: true, phase: 'Playing' });
  world.setResource(RoomCollisionState, { built: true, cellCount: 0 });
  await step(2);
  const player = world.entities(Player)[0]!;
  const water = world.entities(Hazard)[0]!;
  world.insert(player, Player, { gravity: 0 });
  world.insert(player, Health, { current: 100, maximum: 100, invulnerabilitySteps: 0 });
  world.insert(player, LocalTransform, { position: [3, 0, 0] });
  world.insert(water, Hazard, { kind: 'Water', damage: 1 });
  world.insert(water, LocalTransform, { position: [0, 0, 0] });
  world.insert(water, Bounds2D, { shape: 'Aabb', size: [2, 2], offset: [0, 0], layer: 16, mask: 1 });
  return { player, water, splash: world.entities(WaterSplash)[0]! };
}

function place(world: TestWorld, player: number, x: number) {
  world.insert(player, LocalTransform, { position: [x, 0, 0] });
}

worldTest('water entry and exit apply one damage and one splash for sustained contact', async ({ world, step, audio }) => {
  const { player, splash } = await ready(world, step);
  place(world, player, 0);
  await step(1);
  expect(world.get(player, WaterContact).inside).toBe(true);
  expect(world.events(WaterEntered).length).toBe(1);
  expect(world.get(splash, Sprite).visible).toBe(true);
  expect(world.get(splash, VisualOffset).position).toEqual([0, 1, 0]);
  await step(60);
  expect(world.get(player, Health).current).toBe(99);
  expect(audio.sounds().filter((sound) => sound.sound === 'audio/sfx/water-splash').length).toBe(1);
  expect(world.get(splash, Sprite).visible).toBe(false);
  expect(world.get(splash, SpriteAnimation).playing).toBe(false);
  expect(world.resource(WaterSplashState).active).toBe(false);
  place(world, player, 3);
  await step(1);
  expect(world.get(player, WaterContact).inside).toBe(false);
});

worldTest('water cooldown suppresses rapid re-entry without postponing a splash during overlap', async ({ world, step, audio }) => {
  const { player } = await ready(world, step);
  world.insert(player, WaterContact, { splashCooldownSteps: 3 });
  place(world, player, 0);
  await step(1);
  const deadline = world.get(player, WaterContact).nextSplashStep;
  place(world, player, 3);
  await step(1);
  place(world, player, 0);
  await step(1);
  expect(world.events(WaterEntered).length).toBe(0);
  await step(1);
  expect(world.get(player, Health).current).toBe(98);
  expect(world.get(player, WaterContact).nextSplashStep).toBe(deadline);
  await step(10);
  expect(audio.sounds().length).toBe(1);
  place(world, player, 3);
  await step(1);
  place(world, player, 0);
  await step(1);
  expect(world.events(WaterEntered).length).toBe(1);
  await step(1);
  expect(world.get(player, Health).current).toBe(97);
});

worldTest('water re-entry accepts a splash on the exact fixed-step cooldown boundary', async ({ world, step }) => {
  const { player } = await ready(world, step);
  world.insert(player, WaterContact, { splashCooldownSteps: 2 });
  place(world, player, 0);
  await step(1);
  const deadline = world.get(player, WaterContact).nextSplashStep;
  place(world, player, 3);
  await step(1);
  place(world, player, 0);
  await step(1);
  expect(world.events(WaterEntered).length).toBe(1);
  expect(world.get(player, WaterContact).nextSplashStep).toBe(deadline + 2);
});

worldTest('overlapping water volumes share one entry and respect masks and disabled volumes', async ({ world, step }) => {
  const { player, water } = await ready(world, step);
  const secondWater = world.spawn({ Hazard: { kind: 'Water', damage: 20 }, Bounds2D: { shape: 'Aabb', size: [2, 2], offset: [0, 0], layer: 16, mask: 1 }, LocalTransform: {} });
  place(world, player, 0);
  await step(1);
  expect(world.events(WaterEntered).length).toBe(1);
  await step(1);
  expect(world.get(player, Health).current).toBe(99);
  world.insert(water, Bounds2D, { mask: 0 });
  await step(1);
  expect(world.get(player, Health).current).toBe(99);
  world.insert(secondWater, Disabled, {});
  await step(1);
  expect(world.get(player, WaterContact).inside).toBe(false);
});

worldTest('authored water consequence enters player death and restart clears contact and active splash', async ({ world, step, input, audio }) => {
  await step(2);
  const player = world.entities(Player)[0]!;
  const splash = world.entities(WaterSplash)[0]!;
  world.insert(player, LocalTransform, { position: [5.5, -3.1, 0] });
  await step(3);
  expect(world.get(player, Health).current).toBe(0);
  expect(world.resource(GameState).phase).toBe('PlayerDead');
  expect(world.has(player, Alive)).toBe(false);
  expect(world.get(splash, Sprite).visible).toBe(true);
  const dead = world.get(player, LocalTransform).position;
  input.action('moveX', 1);
  await step(2);
  expect(world.get(player, LocalTransform).position).toEqual(dead);
  input.emit(RestartRequested, {});
  await step(1);
  expect(world.resource(GameState).phase).toBe('Playing');
  expect(world.get(player, Health).current).toBe(5);
  expect(world.get(player, WaterContact)).toEqual({ inside: false, splashCooldownSteps: 30, nextSplashStep: 0 });
  expect(world.get(splash, Sprite).visible).toBe(false);
  expect(world.resource(WaterSplashState).active).toBe(false);
  input.action('moveX', 0);
  world.insert(player, LocalTransform, { position: [5.5, -3.1, 0] });
  await step(1);
  expect(world.events(WaterEntered).length).toBe(1);
  expect(audio.sounds().length).toBe(2);
});

worldTest('water restart on an entry step cancels all entry damage and splash facts', async ({ world, step, input, audio }) => {
  const { player } = await ready(world, step);
  place(world, player, 0);
  input.emit(RestartRequested, {});
  await step(1);
  expect(world.events(WaterEntered).length).toBe(0);
  expect(world.get(player, Health).current).toBe(100);
  expect(world.get(player, WaterContact).inside).toBe(false);
  expect(audio.sounds().length).toBe(0);
});

worldTest('water presentation changes cannot alter the deterministic state hash', async ({ world, step }) => {
  const { splash } = await ready(world, step);
  const hash = world.hash();
  world.insert(splash, WaterSplash, { secondsRemaining: 0.4 });
  world.insert(splash, VisualOffset, { position: [100, -100, 0] });
  world.insert(splash, Sprite, { visible: true });
  world.insert(splash, SpriteAnimation, { playing: true, time: 0.2 });
  world.setResource(WaterSplashState, { active: true });
  expect(world.hash()).toBe(hash);
});

worldTest('water hazard replay reaches death and restart through recorded movement', async ({ world, step, input }) => {
  await step(2);
  for (let i = 0; i < 240; i++) {
    input.action('moveX', 1);
    await step(1);
  }
  const player = world.entities(Player)[0]!;
  expect(world.resource(GameState).phase).toBe('PlayerDead');
  expect(world.get(player, Health).current).toBe(0);
  expect(world.get(player, WaterContact).inside).toBe(true);
  input.action('moveX', 0);
  input.emit(RestartRequested, {});
  await step(2);
  expect(world.get(player, Health).current).toBe(5);
  expect(world.get(player, LocalTransform).position).toEqual([-5.25, -2.5, 0]);
  expect(world.get(player, WaterContact).inside).toBe(false);
  expect(world.hash()).toBe('3ad86aa723e2e023');
});

renderTest('water splash has bounded rendering and fits landscape screen extremes', async ({ world, step, render, input }) => {
  await step(2);
  const player = world.entities(Player)[0]!;
  world.insert(player, LocalTransform, { position: [5.5, -3.1, 0] });
  await step(2);
  const splash = world.entities(WaterSplash)[0]!;
  expect(world.get(splash, Sprite).visible).toBe(true);
  for (const [width, height, safe] of [[1024, 768, [0, 0, 0, 0]], [2560, 1080, [0, 0, 0, 0]], [2556, 1179, [177, 0, 102, 0]]] as const) {
    input.view(width, height, 1, [...safe]);
    await step(1);
    const offset = world.get(splash, VisualOffset).position;
    const center = world.resource(CameraFollowState).center;
    const [x, y] = input.worldToScreen([offset[0]! - center[0], offset[1]! - center[1]]);
    expect(x).toBeGreaterThanOrEqual(safe[0]);
    expect(x).toBeLessThanOrEqual(width - safe[2]);
    expect(y).toBeGreaterThanOrEqual(safe[1]);
    expect(y).toBeLessThanOrEqual(height - safe[3]);
    render.expectDrawCalls('<=', 7, { width, height });
  }
  render.expectScreenshot('water-splash', { width: 960, height: 540 });
  await step(60);
  expect(world.get(splash, Sprite).visible).toBe(false);
  render.expectDrawCalls('<=', 6);
});

worldTest('water entry bypasses combat invulnerability but keeps damage in the health owner', async ({ world, step }) => {
  const { player } = await ready(world, step);
  world.insert(player, Health, { invulnerableUntilStep: 1000 });
  place(world, player, 0);
  await step(2);
  expect(world.get(player, Health).current).toBe(99);
});

worldTest('removing the final water volume clears contact and allows the next volume entry', async ({ world, step }) => {
  const { player, water } = await ready(world, step);
  place(world, player, 0);
  await step(2);
  expect(world.get(player, WaterContact).inside).toBe(true);
  world.despawn(water);
  await step(1);
  expect(world.get(player, WaterContact).inside).toBe(false);
  world.spawn({ Hazard: { kind: 'Water', damage: 1 }, Bounds2D: { shape: 'Aabb', size: [2, 2], layer: 16, mask: 1 }, LocalTransform: {} });
  await step(2);
  expect(world.get(player, WaterContact).inside).toBe(true);
  expect(world.get(player, Health).current).toBe(98);
});
