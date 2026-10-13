import { expect, renderTest, type TestWorld, worldTest } from './first-room-test.ts';
import { ActionState, Bounds2D, Camera, clip2DInfo, Disabled, LoadingResumed, LocalTransform, NavGrid, pool, Sprite, SpriteAnimation, Tilemap, VisualOffset, WorldView } from '@gameengine/runtime';
import {
  CameraFeedback,
  GameFeelComparison,
  CameraFollowState,
  GameState,
  GameplayPresentation,
  Health,
  Hazard,
  MenuIntent,
  ParallaxLayer,
  PlatformCollisionCell,
  PlatformCollisionGrid,
  Player,
  PlayerActionState,
  PlayerAnimationPresentation,
  PlayerControl,
  PlayerDashState,
  PlayerGroundContact,
  PlayerIntent,
  PlayerMotion,
  Projectile,
  ProjectilePoolState,
  RoomCollisionState,
  RoomCameraBounds,
  RoomLandmark,
  Weapon,
} from '../src/schema.gen.ts';
import { cameraCenterBounds } from '../src/presentation/follow-player-camera.ts';
import { FIRST_SEWER_ROOM_TILEMAP, isStaticCollisionTile } from '../src/room/build-room-collision.ts';

const activeProjectiles = (world: TestWorld) => world.entities(Projectile).filter((entity) => !world.has(entity, Disabled));

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

worldTest('the first sewer tilemap deterministically derives every static collision cell', async ({ world, step }) => {
  await step(2);

  const [tilemapEntity] = world.entities(Tilemap);
  expect(tilemapEntity).toBeDefined();
  const tilemap = world.get(tilemapEntity!, Tilemap);
  const mapping = world.resource(PlatformCollisionGrid);
  const transform = world.get(tilemapEntity!, LocalTransform);
  expect(tilemap.data).toBe(FIRST_SEWER_ROOM_TILEMAP);
  expect(transform.position.slice(0, 2)).toEqual([mapping.originX, mapping.originY]);
  expect(tilemap.tileSize).toEqual([mapping.cellSize, mapping.cellSize]);
  expect(isStaticCollisionTile(22)).toBe(true);
  expect(isStaticCollisionTile(66)).toBe(true);
  expect(isStaticCollisionTile(18)).toBe(false);
  expect(isStaticCollisionTile(-1)).toBe(false);

  const grid = NavGrid.fromTilemap(FIRST_SEWER_ROOM_TILEMAP, isStaticCollisionTile, {
    origin: [mapping.originX, mapping.originY],
    cellSize: mapping.cellSize,
  });
  const expected = new Set<string>();
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.isWalkable(x, y)) expected.add(`${x},${y}`);
    }
  }

  const actual = new Set(
    world.entities(PlatformCollisionCell).map((entity) => {
      const cell = world.get(entity, PlatformCollisionCell);
      return `${cell.x},${cell.y}`;
    }),
  );
  expect(world.entities(PlatformCollisionCell).length).toBe(expected.size);
  expect(actual.size).toBe(expected.size);
  expect([...actual].sort()).toEqual([...expected].sort());
  expect(mapping.columns).toBe(32);
  expect(mapping.rows).toBe(18);
  const expectedSolidRows = new Array<number>(32).fill(0);
  for (const coordinate of expected) {
    const [x, y] = coordinate.split(',').map(Number);
    expectedSolidRows[y!] = (expectedSolidRows[y!]! | (1 << x!)) >>> 0;
  }
  expect(mapping.solidRows).toEqual(expectedSolidRows);
  expect(actual.has('5,3')).toBe(true);
  expect(actual.has('10,8')).toBe(true);
  expect(actual.has('24,8')).toBe(true);
  expect(actual.has('28,3')).toBe(false);
});

worldTest('the first sewer room exposes spawn, encounter, water edge and exit landmarks', async ({ world, step }) => {
  await step(2);

  const [player] = world.entities(Player);
  expect(world.get(player!, LocalTransform).position).toEqual([-5.25, -2.5, 0]);

  const landmarks = new Map(
    world.entities(RoomLandmark).map((entity) => {
      const kind = world.get(entity, RoomLandmark).kind;
      return [kind, world.get(entity, LocalTransform).position] as const;
    }),
  );
  expect(landmarks.get('Encounter')).toEqual([1.5, -2.5, 0]);
  expect(landmarks.get('WaterEdge')).toEqual([5.5, -3, 0]);
  expect(landmarks.get('Exit')).toEqual([7, -1.5, 0]);
});

worldTest('the vertical slice replay traverses the first room with the complete movement kit', async ({ world, step, input }) => {
  input.view(1920, 1080, 1);
  await step(2);

  const [player] = world.entities(Player);
  expect(player).toBeDefined();
  const landmarks = new Map(
    world.entities(RoomLandmark).map((entity) => [
      world.get(entity, RoomLandmark).kind,
      world.get(entity, LocalTransform).position[0]!,
    ] as const),
  );
  const encounterX = landmarks.get('Encounter')!;
  const waterEdgeX = landmarks.get('WaterEdge')!;
  const exitX = landmarks.get('Exit')!;
  let reachedEncounter = false;
  let reachedWaterEdge = false;
  let usedDoubleJump = false;
  let usedBufferedJump = false;
  let usedCoyoteJump = false;
  let usedDash = false;
  let traversalStep = 0;
  let previousX = world.get(player!, LocalTransform).position[0]!;
  const crossings = new Map<string, { step: number; x: number; y: number; clip: string }>();
  const orderedLandmarks = [
    ['Encounter', encounterX],
    ['WaterEdge', waterEdgeX],
    ['Exit', exitX],
  ] as const;
  const locomotionClips = new Set([
    'art/player/idle.clip2d.json',
    'art/player/run.clip2d.json',
    'art/player/jump.clip2d.json',
    'art/player/fall.clip2d.json',
  ]);

  const advance = async (actions: { moveX?: number; jump?: number; dash?: number } = {}) => {
    input.action('moveX', actions.moveX ?? 1);
    if (actions.jump !== undefined) input.action('jump', actions.jump);
    if (actions.dash !== undefined) input.action('dash', actions.dash);
    await step(1);
    traversalStep += 1;
    const position = world.get(player!, LocalTransform).position;
    const x = position[0]!;
    expect(Math.abs(x - previousX)).toBeLessThanOrEqual(12 / 60 + 0.00001);
    const presentation = world.resource(GameplayPresentation);
    expect(presentation.playerPosition).toEqual(position.slice(0, 2));
    const clip = world.get(player!, PlayerAnimationPresentation).clip ?? '';
    expect(locomotionClips.has(clip)).toBe(true);
    const camera = world.resource(CameraFollowState);
    const room = world.resource(RoomCameraBounds);
    const cameraBounds = cameraCenterBounds(1920, 1080, [0, 0, 0, 0], room);
    expect(camera.center[0]!).toBeGreaterThanOrEqual(cameraBounds.minX);
    expect(camera.center[0]!).toBeLessThanOrEqual(cameraBounds.maxX);
    expect(camera.center[1]!).toBeGreaterThanOrEqual(cameraBounds.minY);
    expect(camera.center[1]!).toBeLessThanOrEqual(cameraBounds.maxY);
    expect(Math.abs(x - camera.center[0]!)).toBeLessThanOrEqual(6);
    for (const [kind, landmarkX] of orderedLandmarks) {
      if (!crossings.has(kind) && previousX < landmarkX && x >= landmarkX) {
        crossings.set(kind, { step: traversalStep, x, y: position[1]!, clip });
      }
    }
    previousX = x;
    reachedEncounter ||= x >= encounterX;
    reachedWaterEdge ||= x >= waterEdgeX;
  };

  for (let i = 0; i < 18; i++) await advance();
  await advance({ moveX: 0, jump: 1 });
  for (let i = 0; i < 4; i++) await advance({ moveX: 0, jump: 1 });
  await advance({ moveX: 0, jump: 0 });
  await advance({ moveX: 0, jump: 1 });
  usedDoubleJump = world.get(player!, PlayerMotion).airJumpsRemaining === 0;
  await advance({ moveX: 0, jump: 0 });

  let queuedBufferedJump = false;
  for (let i = 0; i < 180 && !usedBufferedJump; i++) {
    const motion = world.get(player!, PlayerMotion);
    const contact = world.get(player!, PlayerGroundContact);
    const y = world.get(player!, LocalTransform).position[1]!;
    if (!queuedBufferedJump && !contact.grounded && motion.airJumpsRemaining === 0 && motion.verticalVelocity < 0 && y < -2) {
      await advance({ moveX: 0, jump: 1 });
      queuedBufferedJump = world.get(player!, PlayerMotion).jumpBufferStepsRemaining > 0;
      await advance({ moveX: 0, jump: 0 });
      continue;
    }
    await advance({ moveX: 0 });
    const next = world.get(player!, PlayerMotion);
    usedBufferedJump = queuedBufferedJump && next.airJumpsRemaining === 1 && next.verticalVelocity > 0;
  }

  await advance({ dash: 1 });
  usedDash = world.get(player!, PlayerDashState).active;
  await advance({ dash: 0 });

  for (let i = 0; i < 240 && world.get(player!, LocalTransform).position[0]! < exitX; i++) {
    const before = world.get(player!, PlayerMotion);
    const contact = world.get(player!, PlayerGroundContact);
    if (!usedCoyoteJump && !contact.grounded && before.coyoteStepsRemaining > 0 && before.verticalVelocity <= 0) {
      await advance({ jump: 1 });
      usedCoyoteJump = world.get(player!, PlayerMotion).verticalVelocity > 0;
      await advance({ jump: 0 });
    } else {
      await advance();
    }
  }

  const finish = world.get(player!, LocalTransform).position;
  const encounter = crossings.get('Encounter')!;
  const waterEdge = crossings.get('WaterEdge')!;
  const exit = crossings.get('Exit')!;
  expect(reachedEncounter).toBe(true);
  expect(reachedWaterEdge).toBe(true);
  expect(finish[0]!).toBeGreaterThanOrEqual(exitX);
  expect(encounter.step).toBeLessThan(waterEdge.step);
  expect(waterEdge.step).toBeLessThan(exit.step);
  expect(encounter.x - encounterX).toBeLessThanOrEqual(12 / 60 + 0.00001);
  expect(waterEdge.x - waterEdgeX).toBeLessThanOrEqual(12 / 60 + 0.00001);
  expect(exit.x - exitX).toBeLessThanOrEqual(12 / 60 + 0.00001);
  expect([encounter.y, waterEdge.y, exit.y].every((y) => y >= -4.5 && y <= 4.5)).toBe(true);
  expect(usedDoubleJump).toBe(true);
  expect(usedBufferedJump).toBe(true);
  expect(usedCoyoteJump).toBe(true);
  expect(usedDash).toBe(true);
});

worldTest('recorded player intent becomes simulation state and a presentation snapshot', async ({ world, step, input }) => {
  input.view(1920, 1080, 1);
  await step(1);

  input.emit(PlayerIntent, { moveX: -0.75, jump: true, dash: false, fire: true, crouch: true });
  await step(1);

  const [player] = world.entities(Player);
  expect(player).toBeDefined();
  expect(world.get(player!, PlayerControl)).toEqual({ moveX: -0.75, crouch: true, jumpHeld: false });
  const snapshot = world.resource(GameplayPresentation);
  expect(snapshot.phase).toBe('Playing');
  expect(snapshot.moveX).toBe('Left');
  expect(snapshot.playerPosition).toEqual(world.get(player!, LocalTransform).position.slice(0, 2));
  expect(snapshot.playerVelocity).toEqual([
    world.get(player!, PlayerMotion).horizontalVelocity,
    world.get(player!, PlayerMotion).verticalVelocity,
  ]);
  expect(snapshot.playerFacing).toBe('Left');

  await step(1);
  expect(world.get(player!, PlayerControl)).toEqual({ moveX: 0, crouch: false, jumpHeld: false });
});

worldTest('player animation follows deterministic locomotion and ignores raw combat intent', async ({ world, step, input }) => {
  await step(2);
  const [player] = world.entities(Player);
  expect(world.get(player!, PlayerAnimationPresentation).clip).toBe('art/player/idle.clip2d.json');
  expect(world.get(player!, Sprite).anchor).toEqual([0.5, 0]);
  const idleAnimation = world.get(player!, SpriteAnimation);
  expect(idleAnimation.frames).toBe('art/player/idle/idle1,art/player/idle/idle2,art/player/idle/idle3,art/player/idle/idle4,art/player/idle/idle5,art/player/idle/idle6');
  expect(idleAnimation.fps).toBeCloseTo(1 / 0.222);
  expect(idleAnimation.loop).toBe(true);
  expect(idleAnimation.events).toBe('');

  input.emit(PlayerIntent, { moveX: 0, jump: false, jumpHeld: false, dash: false, fire: false, crouch: true });
  await step(1);
  expect(world.get(player!, PlayerAnimationPresentation).clip).toBe('art/player/crouch.clip2d.json');

  input.emit(PlayerIntent, { moveX: 1, jump: false, jumpHeld: false, dash: false, fire: true, crouch: false });
  await step(1);
  expect(world.get(player!, PlayerAnimationPresentation).clip).toBe('art/player/run.clip2d.json');
  expect(world.get(player!, Sprite).flipX).toBe(false);

  input.emit(PlayerIntent, { moveX: -1, jump: false, jumpHeld: false, dash: false, fire: false, crouch: false });
  await step(1);
  expect(world.get(player!, Sprite).flipX).toBe(true);

  input.emit(PlayerIntent, { moveX: 0, jump: true, jumpHeld: true, dash: false, fire: false, crouch: false });
  await step(1);
  expect(world.get(player!, PlayerAnimationPresentation).clip).toBe('art/player/jump.clip2d.json');

  while (world.get(player!, PlayerMotion).verticalVelocity > 0.05) await step(1);
  expect(world.get(player!, PlayerAnimationPresentation).clip).toBe('art/player/fall.clip2d.json');
});

worldTest('authored player clips preserve reviewed timing, looping and feedback events', async () => {
  const idle = clip2DInfo('art/player/idle.clip2d.json');
  const run = clip2DInfo('art/player/run.clip2d.json');
  const jump = clip2DInfo('art/player/jump.clip2d.json');
  const fall = clip2DInfo('art/player/fall.clip2d.json');
  const crouch = clip2DInfo('art/player/crouch.clip2d.json');
  const shoot = clip2DInfo('art/player/shoot.clip2d.json');
  const hurt = clip2DInfo('art/player/hurt.clip2d.json');

  expect([idle.frames.length, run.frames.length, jump.frames.length, fall.frames.length, crouch.frames.length, shoot.frames.length, hurt.frames.length]).toEqual([
    6, 6, 2, 3, 1, 1, 1,
  ]);
  expect([idle.loop, run.loop, jump.loop, fall.loop, crouch.loop, shoot.loop, hurt.loop]).toEqual([
    'loop', 'loop', 'once', 'once', 'loop', 'once', 'once',
  ]);
  expect(idle.frames.every((frame) => Math.abs(frame.duration - 0.222) < 0.0001)).toBe(true);
  expect(run.frames.every((frame) => Math.abs(frame.duration - 0.1) < 0.0001)).toBe(true);
  expect(run.events.map((event) => [event.frame, event.name])).toEqual([
    [1, 'footstep'],
    [4, 'footstep'],
  ]);
  expect(jump.events.map((event) => event.name)).toEqual(['takeoff-feedback']);
  expect(shoot.events.map((event) => event.name)).toEqual(['muzzle-feedback']);
  expect(hurt.events.map((event) => event.name)).toEqual(['hurt-feedback']);
});

worldTest('water splash keeps a reusable one-shot presentation contract', async () => {
  const splash = clip2DInfo('art/effects/water-splash.clip2d.json');

  expect(splash.frames.length).toBe(5);
  expect(splash.loop).toBe('once');
  expect(splash.duration).toBeCloseTo(0.5);
});

worldTest('parallax factors and water startup animation settle at bounded cost', async ({ world, step }) => {
  await step(2);
  const layers = world.entities(ParallaxLayer).map((entity) => ({
    factor: world.get(entity, ParallaxLayer).factor,
    sortingLayer: world.get(entity, Sprite).sortingLayer,
    order: world.get(entity, Sprite).order,
  }));
  expect(layers.filter((layer) => layer.order === -30)).toEqual([
    { factor: [0.12, 0.08], sortingLayer: 'Background', order: -30 },
    { factor: [0.12, 0.08], sortingLayer: 'Background', order: -30 },
    { factor: [0.12, 0.08], sortingLayer: 'Background', order: -30 },
  ]);
  expect(layers.filter((layer) => layer.order === -20)).toEqual([
    { factor: [0.32, 0.18], sortingLayer: 'Background', order: -20 },
  ]);
  expect(layers.filter((layer) => layer.order === -10)).toEqual([
    { factor: [0.5, 0.32], sortingLayer: 'Background', order: -10 },
    { factor: [0.5, 0.32], sortingLayer: 'Background', order: -10 },
  ]);
  expect(layers.filter((layer) => layer.order === 0)).toEqual([
    { factor: [0.82, 0.72], sortingLayer: 'Background', order: 0 },
  ]);
  const frontWater = layers.filter((layer) => layer.order === 10);
  expect(frontWater.length).toBe(2);
  expect(frontWater.every(
    (layer) => layer.sortingLayer === 'World' && layer.order === 10 && layer.factor[0] === 1 && layer.factor[1] === 1,
  )).toBe(true);

  const animatedWater = world.entities(SpriteAnimation).filter((entity) => {
    const frames = world.get(entity, SpriteAnimation).frames;
    return frames.includes('environment/') && frames.includes('water');
  });
  expect(animatedWater.length).toBe(4);
  expect(animatedWater.map((entity) => world.get(entity, SpriteAnimation).fps).sort()).toEqual([4, 4, 6, 6]);
  expect(animatedWater.every((entity) => world.get(entity, SpriteAnimation).loop === false)).toBe(true);
  await step(60);
  expect(animatedWater.every((entity) => world.get(entity, SpriteAnimation).playing === false)).toBe(true);
  const settledFrames = animatedWater.map((entity) => world.get(entity, SpriteAnimation).frame);
  await step(60);
  expect(animatedWater.map((entity) => world.get(entity, SpriteAnimation).frame)).toEqual(settledFrames);
});

worldTest('camera-relative parallax stays presentation-only', async ({ world, step }) => {
  await step(2);
  const hash = world.hash();
  world.setResource(CameraFollowState, { center: [2, -1], target: [2, -1], lookAhead: 0, settled: true });
  expect(world.hash()).toBe(hash);
  await step(1);

  const offsets = world.entities(ParallaxLayer).map((entity) => ({
    factor: world.get(entity, ParallaxLayer).factor,
    offset: world.get(entity, VisualOffset).position,
  }));
  for (const layer of offsets) {
    expect(layer.offset[0]).toBeCloseTo(2 * (1 - layer.factor[0]));
    expect(layer.offset[1]).toBeCloseTo(-1 * (1 - layer.factor[1]));
  }
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

worldTest('held fire obeys fixed-step cadence, applies recoil, and reuses the warmed projectile pool', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' });
  await step(3);
  const [player] = world.entities(Player);
  expect(world.resource(ProjectilePoolState).warmed).toBe(true);
  const initialPool = pool.stats().find((entry) => entry.name === 'player-projectiles')!;
  expect([initialPool.size, initialPool.free, initialPool.misses]).toEqual([12, 12, 0]);

  input.action('shoot', 1);
  await step(1);
  expect(activeProjectiles(world).length).toBe(1);
  expect(world.get(player!, Weapon).cooldownStepsRemaining).toBe(9);
  expect(world.get(player!, PlayerMotion).horizontalVelocity).toBeCloseTo(-1.5);

  for (let i = 0; i < 8; i++) {
    input.action('shoot', 1);
    await step(1);
  }
  expect(activeProjectiles(world).length).toBe(1);
  expect(world.get(player!, Weapon).cooldownStepsRemaining).toBe(1);

  input.action('shoot', 1);
  await step(1);
  expect(activeProjectiles(world).length).toBe(2);
  expect(world.get(player!, Weapon).cooldownStepsRemaining).toBe(9);
  const firingPool = pool.stats().find((entry) => entry.name === 'player-projectiles')!;
  expect([firingPool.size, firingPool.free, firingPool.misses]).toEqual([12, 10, 0]);
  expect(world.hash()).toBe('c8e224939d86afc4');
});

worldTest('projectiles hit deterministic wall cells and return cleanly to the pool', async ({ world, step, input }) => {
  world.setResource(GameState, { initialized: true, phase: 'Playing' });
  world.setResource(RoomCollisionState, { built: true, cellCount: 0 });
  world.setResource(PlatformCollisionGrid, { originX: 0, originY: 0, cellSize: 1 });
  input.emit(LoadingResumed, { name: 'boot' });
  await step(2);
  const [player] = world.entities(Player);
  world.insert(player!, LocalTransform, { position: [20, 0, 0] });
  world.insert(player!, Player, { gravity: 0 });
  world.spawn({ PlatformCollisionCell: { x: 22, y: 0 } });

  input.action('shoot', 1);
  await step(1);
  expect(activeProjectiles(world).length).toBe(1);
  await step(5);
  expect(activeProjectiles(world).length).toBe(0);
  const wallPool = pool.stats().find((entry) => entry.name === 'player-projectiles')!;
  expect([wallPool.size, wallPool.free, wallPool.misses]).toEqual([12, 12, 0]);
});

worldTest('projectile range expires on a fixed step and repeated cleanup never grows the pool', async ({ world, step, input }) => {
  // Isolate the movement/weapon contract from the authored drowning volume.
  for (const water of world.entities(Hazard)) world.insert(water, Hazard, { kind: 'Contact' });
  world.setResource(GameState, { initialized: true, phase: 'Playing' });
  world.setResource(RoomCollisionState, { built: true, cellCount: 0 });
  input.emit(LoadingResumed, { name: 'boot' });
  await step(2);
  const [player] = world.entities(Player);
  world.insert(player!, Weapon, { fireIntervalSteps: 1, projectileRange: 0.6, projectileSpeed: 12, recoilSpeed: 0 });

  for (let shot = 0; shot < 20; shot++) {
    input.action('shoot', 1);
    await step(1);
    input.action('shoot', 0);
    await step(4);
    expect(activeProjectiles(world).length).toBe(0);
  }
  const rangePool = pool.stats().find((entry) => entry.name === 'player-projectiles')!;
  expect([rangePool.size, rangePool.free, rangePool.misses, rangePool.grown]).toEqual([12, 12, 0, 0]);
});

worldTest('projectile damage is requested and applied inside the fixed-step simulation', async ({ world, step, input }) => {
  world.setResource(GameState, { initialized: true, phase: 'Playing' });
  world.setResource(RoomCollisionState, { built: true, cellCount: 0 });
  input.emit(LoadingResumed, { name: 'boot' });
  await step(2);
  const [player] = world.entities(Player);
  world.insert(player!, LocalTransform, { position: [30, 0, 0] });
  world.insert(player!, Player, { gravity: 0 });
  const target = world.spawn({
    LocalTransform: { position: [31.5, 0.76, 0] },
    Bounds2D: { shape: 'Aabb', size: [0.8, 1.2], layer: 4, mask: 2 },
    Health: { current: 3, maximum: 3 },
  });

  input.action('shoot', 1);
  await step(8);
  expect(world.get(target, Health).current).toBe(2);
  expect(activeProjectiles(world).length).toBe(0);
});

worldTest('neutral horizontal input keeps a stationary player still', async ({ world, step }) => {
  await step(2);
  const [player] = world.entities(Player);
  const before = world.get(player!, LocalTransform).position;

  await step(30);

  expect(world.get(player!, PlayerMotion)).toEqual({
    horizontalVelocity: 0,
    verticalVelocity: 0,
    groundedForMovement: true,
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
  // Isolate the movement/weapon contract from the authored drowning volume.
  for (const water of world.entities(Hazard)) world.insert(water, Hazard, { kind: 'Contact' });
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
    PlayerDashState: {},
    PlayerGroundContact: { grounded: false },
    PlayerMotion: { groundedForMovement: false },
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
  expect(first.groundedForMovement).toBe(false);
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
    PlayerDashState: {},
    PlayerGroundContact: { grounded: false },
    PlayerMotion: { groundedForMovement: false, coyoteStepsRemaining: 1, airJumpsRemaining: 0 },
  });
  const expired = world.spawn({
    LocalTransform: {},
    Player: {},
    PlayerControl: {},
    PlayerDashState: {},
    PlayerGroundContact: { grounded: false },
    PlayerMotion: { groundedForMovement: false, coyoteStepsRemaining: 0, airJumpsRemaining: 0 },
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
    PlayerDashState: {},
    PlayerGroundContact: { grounded: false },
    PlayerMotion: { groundedForMovement: false, coyoteStepsRemaining: 0, airJumpsRemaining: 0 },
  });

  input.action('jump', 1);
  await step(1);
  expect(world.get(player, PlayerMotion).jumpBufferStepsRemaining).toBe(6);

  world.insert(player, PlayerGroundContact, { grounded: true });
  await step(1);

  const landedJump = world.get(player, PlayerMotion);
  expect(landedJump.groundedForMovement).toBe(false);
  expect(landedJump.jumpBufferStepsRemaining).toBe(0);
  expect(landedJump.verticalVelocity).toBeGreaterThan(0);
});

worldTest('an expired jump buffer does not fire on later grounded contact', async ({ world, step, input }) => {
  await step(1);
  const player = world.spawn({
    LocalTransform: {},
    Player: {},
    PlayerControl: {},
    PlayerDashState: {},
    PlayerGroundContact: { grounded: false },
    PlayerMotion: { groundedForMovement: false, coyoteStepsRemaining: 0, airJumpsRemaining: 0 },
  });

  input.action('jump', 1);
  await step(7);
  expect(world.get(player, PlayerMotion).jumpBufferStepsRemaining).toBe(0);

  world.insert(player, PlayerGroundContact, { grounded: true });
  await step(1);
  const landed = world.get(player, PlayerMotion);
  expect(landed.groundedForMovement).toBe(true);
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

worldTest('gravity carries a jump through its apex and lands on deterministic geometry', async ({ world, step, input }) => {
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
  const landed = world.get(player!, PlayerMotion);
  expect(landed.verticalVelocity).toBe(0);
  expect(landed.groundedForMovement).toBe(true);
  expect(world.get(player!, LocalTransform).position[1]!).toBe(startY);
});

worldTest('platform collision lands on floors and owns grounded transitions', async ({ world, step }) => {
  world.setResource(GameState, { initialized: true, phase: 'Playing' });
  world.setResource(RoomCollisionState, { built: true, cellCount: 0 });
  world.setResource(PlatformCollisionGrid, { originX: 0, originY: -0.5, cellSize: 1 });
  await step(1);
  world.spawn({ PlatformCollisionCell: { x: 20, y: 0 } });
  const player = world.spawn({
    LocalTransform: { position: [20.5, 3, 0] },
    Player: {},
    PlayerControl: {},
    PlayerDashState: {},
    PlayerGroundContact: { grounded: false },
    PlayerMotion: { groundedForMovement: false, verticalVelocity: -18 },
  });

  await step(12);

  expect(world.get(player, LocalTransform).position[1]).toBeCloseTo(0.5);
  expect(world.get(player, PlayerGroundContact).grounded).toBe(true);
  expect(world.get(player, PlayerMotion).verticalVelocity).toBe(0);
  await step(1);
  expect(world.get(player, PlayerMotion).groundedForMovement).toBe(true);
});

worldTest('platform collision stops upward motion at ceilings', async ({ world, step }) => {
  world.setResource(GameState, { initialized: true, phase: 'Playing' });
  world.setResource(RoomCollisionState, { built: true, cellCount: 0 });
  world.setResource(PlatformCollisionGrid, { originX: 0, originY: -0.5, cellSize: 1 });
  await step(1);
  world.spawn({ PlatformCollisionCell: { x: 22, y: 3 } });
  const player = world.spawn({
    LocalTransform: { position: [22.5, 0.5, 0] },
    Player: { gravity: 0 },
    PlayerControl: {},
    PlayerDashState: {},
    PlayerGroundContact: { grounded: false },
    PlayerMotion: { groundedForMovement: false, verticalVelocity: 120 },
  });

  await step(1);

  expect(world.get(player, LocalTransform).position[1]).toBeCloseTo(1.3);
  expect(world.get(player, PlayerMotion).verticalVelocity).toBe(0);
  expect(world.get(player, PlayerGroundContact).grounded).toBe(false);
});

worldTest('platform collision stops at walls and cannot tunnel at extreme dash speed', async ({ world, step }) => {
  world.setResource(GameState, { initialized: true, phase: 'Playing' });
  world.setResource(RoomCollisionState, { built: true, cellCount: 0 });
  world.setResource(PlatformCollisionGrid, { originX: 0, originY: -0.5, cellSize: 1 });
  await step(1);
  world.spawn({ PlatformCollisionCell: { x: 25, y: 1 } });
  const player = world.spawn({
    LocalTransform: { position: [22.5, 1.1, 0] },
    Player: { dashSpeed: 240, gravity: 0 },
    PlayerControl: {},
    PlayerDashState: { active: true },
    PlayerGroundContact: { grounded: false },
    PlayerMotion: { groundedForMovement: false },
  });

  await step(1);

  expect(world.get(player, LocalTransform).position[0]).toBeCloseTo(24.58);
  expect(world.get(player, PlayerMotion).horizontalVelocity).toBe(0);
  expect(world.hash()).toBe('9a252842c58c1a3b');
});

worldTest('platform collision resolves a diagonal floor-wall corner without penetration', async ({ world, step }) => {
  world.setResource(GameState, { initialized: true, phase: 'Playing' });
  world.setResource(RoomCollisionState, { built: true, cellCount: 0 });
  world.setResource(PlatformCollisionGrid, { originX: 0, originY: -0.5, cellSize: 1 });
  await step(1);
  world.spawn({ PlatformCollisionCell: { x: 30, y: 0 } });
  world.spawn({ PlatformCollisionCell: { x: 31, y: 1 } });
  const player = world.spawn({
    LocalTransform: { position: [29.5, 0.7, 0] },
    Player: { gravity: 0 },
    PlayerControl: {},
    PlayerDashState: {},
    PlayerGroundContact: { grounded: false },
    PlayerMotion: { horizontalVelocity: 120, verticalVelocity: -60, groundedForMovement: false },
  });

  await step(1);

  const position = world.get(player, LocalTransform).position;
  expect(position[0]).toBeCloseTo(30.58);
  expect(position[1]).toBeCloseTo(0.5);
  expect(world.get(player, PlayerGroundContact).grounded).toBe(true);
  expect(world.hash()).toBe('c71d0cbfa61ae794');
});

worldTest('small-step assistance climbs only ledges within its configured boundary', async ({ world, step, input }) => {
  world.setResource(GameState, { initialized: true, phase: 'Playing' });
  world.setResource(RoomCollisionState, { built: true, cellCount: 0 });
  world.setResource(PlatformCollisionGrid, { originX: 0, originY: 0, cellSize: 0.25 });
  await step(1);
  for (let x = 160; x <= 168; x++) world.spawn({ PlatformCollisionCell: { x, y: 0 } });
  world.spawn({ PlatformCollisionCell: { x: 164, y: 1 } });
  world.spawn({ PlatformCollisionCell: { x: 168, y: 1 } });
  world.spawn({ PlatformCollisionCell: { x: 168, y: 2 } });
  world.spawn({ PlatformCollisionCell: { x: 168, y: 3 } });
  const player = world.spawn({
    LocalTransform: { position: [40.5, 0.25, 0] },
    Player: { gravity: 0, maxHorizontalSpeed: 30, groundAcceleration: 1800, maxStepHeight: 0.35 },
    PlayerControl: {},
    PlayerDashState: {},
    PlayerGroundContact: { grounded: true },
    PlayerMotion: { groundedForMovement: true },
  });

  input.action('moveX', 1);
  await step(1);
  expect(world.get(player, LocalTransform).position[1]).toBeCloseTo(0.5);
  for (let i = 0; i < 3; i++) {
    input.action('moveX', 1);
    await step(1);
  }
  expect(world.get(player, LocalTransform).position[0]).toBeLessThanOrEqual(41.58);
  expect(world.get(player, LocalTransform).position[1]).toBeCloseTo(0.5);
  expect(world.hash()).toBe('019cb81f3ca1b877');
});

worldTest('cliff edges end ground contact exactly after support and preserve coyote integration', async ({ world, step, input }) => {
  world.setResource(GameState, { initialized: true, phase: 'Playing' });
  world.setResource(RoomCollisionState, { built: true, cellCount: 0 });
  world.setResource(PlatformCollisionGrid, { originX: 0, originY: -0.5, cellSize: 1 });
  await step(1);
  world.spawn({ PlatformCollisionCell: { x: 44, y: 0 } });
  const player = world.spawn({
    LocalTransform: { position: [44.5, 0.5, 0] },
    Player: { gravity: 0, maxHorizontalSpeed: 15, groundAcceleration: 900 },
    PlayerControl: {},
    PlayerDashState: {},
    PlayerGroundContact: { grounded: true },
    PlayerMotion: { groundedForMovement: true },
  });

  for (let i = 0; i < 3; i++) {
    input.action('moveX', 1);
    await step(1);
    expect(world.get(player, PlayerGroundContact).grounded).toBe(true);
  }
  input.action('moveX', 1);
  await step(1);
  expect(world.get(player, PlayerGroundContact).grounded).toBe(false);
  expect(world.get(player, PlayerMotion).coyoteStepsRemaining).toBeGreaterThan(0);

  input.action('jump', 1);
  await step(1);
  expect(world.get(player, PlayerMotion).verticalVelocity).toBeGreaterThan(0);
});

worldTest('dash activates from a press edge and chooses input before facing fallback', async ({ world, step, input }) => {
  await step(1);
  const [player] = world.entities(Player);

  input.action('moveX', -1);
  input.action('dash', 1);
  await step(1);

  expect(world.get(player!, PlayerDashState)).toEqual({
    active: true,
    direction: 'Left',
    activeStepsRemaining: 7,
    cooldownStepsRemaining: 47,
    controlLockStepsRemaining: 13,
  });
  expect(world.get(player!, PlayerMotion).horizontalVelocity).toBe(-12);

  await step(48);
  input.action('dash', 0);
  input.action('moveX', 0);
  await step(1);
  input.action('dash', 1);
  await step(1);

  expect(world.get(player!, PlayerDashState).direction).toBe('Left');
});

worldTest('dash movement lasts exactly eight steps then clamps to run speed through control lock', async ({ world, step, input }) => {
  await step(1);
  const [player] = world.entities(Player);
  const startX = world.get(player!, LocalTransform).position[0]!;

  input.action('dash', 1);
  await step(1);
  await step(6);
  expect(world.get(player!, PlayerDashState).active).toBe(true);
  expect(world.get(player!, PlayerDashState).activeStepsRemaining).toBe(1);

  await step(1);
  const ended = world.get(player!, PlayerDashState);
  expect(ended.active).toBe(false);
  expect(ended.activeStepsRemaining).toBe(0);
  expect(ended.controlLockStepsRemaining).toBe(6);
  expect(world.get(player!, LocalTransform).position[0]!).toBeCloseTo(startX + (8 * 12) / 60);
  expect(world.get(player!, PlayerMotion).horizontalVelocity).toBe(8.5);

  input.action('moveX', -1);
  await step(5);
  expect(world.get(player!, PlayerDashState).controlLockStepsRemaining).toBe(1);
  expect(world.get(player!, PlayerMotion).horizontalVelocity).toBe(8.5);

  await step(1);
  expect(world.get(player!, PlayerDashState).controlLockStepsRemaining).toBe(0);
  expect(world.get(player!, PlayerMotion).horizontalVelocity).toBe(8.5);
  await step(1);
  expect(world.get(player!, PlayerMotion).horizontalVelocity).toBeLessThan(8.5);
});

worldTest('dash cooldown rejects its final blocked step and recovers on the next edge', async ({ world, step, input }) => {
  await step(1);
  const [player] = world.entities(Player);

  input.emit(PlayerIntent, { moveX: 1, jump: false, jumpHeld: false, dash: true, fire: false, crouch: false });
  await step(1);
  await step(46);
  expect(world.get(player!, PlayerDashState).cooldownStepsRemaining).toBe(1);

  input.emit(PlayerIntent, { moveX: -1, jump: false, jumpHeld: false, dash: true, fire: false, crouch: false });
  await step(1);
  expect(world.get(player!, PlayerDashState).active).toBe(false);
  expect(world.get(player!, PlayerDashState).cooldownStepsRemaining).toBe(0);

  input.emit(PlayerIntent, { moveX: -1, jump: false, jumpHeld: false, dash: true, fire: false, crouch: false });
  await step(1);
  expect(world.get(player!, PlayerDashState).active).toBe(true);
  expect(world.get(player!, PlayerDashState).direction).toBe('Left');
});

worldTest('ground and air dashes share eligibility while air dash suppresses rise and reduces gravity', async ({ world, step, input }) => {
  await step(1);
  const [grounded] = world.entities(Player);
  const airborne = world.spawn({
    LocalTransform: {},
    Player: {},
    PlayerControl: {},
    PlayerDashState: {},
    PlayerGroundContact: { grounded: false },
    PlayerMotion: { groundedForMovement: false, verticalVelocity: 9 },
  });

  input.action('dash', 1);
  await step(1);

  expect(world.get(grounded!, PlayerDashState).active).toBe(true);
  expect(world.get(grounded!, PlayerMotion).verticalVelocity).toBe(0);
  expect(world.get(airborne, PlayerDashState).active).toBe(true);
  expect(world.get(airborne, PlayerMotion).verticalVelocity).toBeCloseTo(-(24 * 0.2) / 60);
});

worldTest('dash locks jump and horizontal steering without leaving a held dash edge sticky', async ({ world, step, input }) => {
  await step(1);
  const [player] = world.entities(Player);

  input.action('dash', 1);
  await step(1);
  input.action('moveX', -1);
  input.action('jump', 1);
  await step(8);

  expect(world.get(player!, PlayerDashState).active).toBe(false);
  expect(world.get(player!, PlayerMotion).groundedForMovement).toBe(true);
  expect(world.get(player!, PlayerMotion).verticalVelocity).toBe(0);
  expect(world.get(player!, PlayerMotion).horizontalVelocity).toBe(8.5);

  await step(6);
  expect(world.get(player!, PlayerDashState).active).toBe(false);
  expect(world.get(player!, PlayerDashState).cooldownStepsRemaining).toBeGreaterThan(0);
  expect(world.get(player!, PlayerMotion).verticalVelocity).toBe(0);
});

worldTest('dash mechanics produce a stable deterministic state hash', async ({ world, step, input }) => {
  await step(1);
  input.action('moveX', -0.75);
  input.action('dash', 1);
  await step(5);
  input.action('dash', 0);
  input.action('jump', 1);
  await step(11);
  input.action('jump', 0);
  await step(34);
  input.action('moveX', 0);
  input.action('dash', 1);
  await step(9);

  expect(world.hash()).toBe('22cb38ccc86c0e33');
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

  expect(world.hash()).toBe('a4dcf36c4df1fbc1');
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

  expect(world.hash()).toBe('988f2c881d47d826');
});

worldTest('camera look-ahead follows authoritative velocity and reverses direction', async ({ world, step, input }) => {
  input.view(1920, 1080, 1);
  await step(2);
  for (let i = 0; i < 30; i++) {
    input.action('moveX', 1);
    await step(1);
  }
  expect(world.resource(CameraFollowState).lookAhead).toBeGreaterThan(0.9);

  for (let i = 0; i < 50; i++) {
    input.action('moveX', -1);
    await step(1);
  }
  expect(world.resource(CameraFollowState).lookAhead).toBeLessThan(-0.9);
});

worldTest('camera follow clamps to room bounds and settles without continuous writes', async ({ world, step, input }) => {
  input.view(1920, 1080, 1);
  await step(2);
  const [player] = world.entities(Player);
  const room = world.resource(RoomCameraBounds);
  world.insert(player!, LocalTransform, { position: [room.right - 0.5, room.top - 1, 0] });
  await step(120);

  const state = world.resource(CameraFollowState);
  const bounds = cameraCenterBounds(1920, 1080, [0, 0, 0, 0], room);
  expect(state.center[0]).toBeLessThanOrEqual(bounds.maxX);
  expect(state.center[1]).toBeLessThanOrEqual(bounds.maxY);
  expect(state.settled).toBe(true);
  const settled = [...state.center];
  await step(30);
  expect(world.resource(CameraFollowState).center).toEqual(settled);
});

worldTest('a settled camera immediately re-clamps after a live safe-area resize', async ({ world, step, input }) => {
  input.view(1920, 1080, 1);
  await step(2);
  const [player] = world.entities(Player);
  const room = world.resource(RoomCameraBounds);
  world.insert(player!, LocalTransform, { position: [room.right - 0.5, -2.5, 0] });
  await step(120);
  const before = world.resource(CameraFollowState).center[0];

  input.view(2560, 1080, 1, [177, 0, 102, 0]);
  await step(1);
  const bounds = cameraCenterBounds(2560, 1080, [177, 0, 102, 0], room);
  expect(world.resource(CameraFollowState).center[0]).toBeLessThanOrEqual(bounds.maxX + 0.001);
  expect(world.resource(CameraFollowState).center[0]).toBeLessThan(before);
});

worldTest('presentation camera feedback is invisible to simulation hashes', async ({ world, step }) => {
  await step(2);
  const hash = world.hash();
  world.setResource(GameFeelComparison, { shake: true, recoil: true });
  world.setResource(CameraFeedback, { active: true, bump: [0.7, -0.2], shake: 0.4, shakeTime: 0.3 });
  world.setResource(CameraFollowState, { center: [1.25, -0.5], target: [1.25, -0.5], lookAhead: 1, settled: true });
  expect(world.hash()).toBe(hash);

  await step(1);
  const [camera] = world.entities(Camera);
  const offset = world.get(camera!, VisualOffset).position;
  expect(offset[0]).not.toBe(1.25);
  expect(offset[1]).not.toBe(-0.5);

  await step(120);
  expect(world.resource(CameraFeedback)).toEqual({ active: false, bump: [0, 0], shake: 0, shakeTime: 0 });
  const finalOffset = [...world.get(camera!, VisualOffset).position];
  await step(30);
  expect(world.get(camera!, VisualOffset).position).toEqual(finalOffset);
});

renderTest('the vertical slice stays within its 2D draw-call budget', async ({ step, render }) => {
  await step(2);

  const stats = render.stats({ width: 1920, height: 1080 });
  expect(stats.atlasPages).toBeLessThanOrEqual(5);
  render.expectDrawCalls('<=', 4, { width: 1920, height: 1080 });
});

renderTest('the complete first sewer room matches its golden frame', async ({ step, render, input }) => {
  input.view(1920, 1080, 1);
  await step(2);
  render.expectScreenshot('first-sewer-room', { width: 960, height: 540 });
});

renderTest('player locomotion transitions preserve the authored feet anchor', async ({ world, step, render, input }) => {
  input.view(1920, 1080, 1);
  await step(2);
  const [player] = world.entities(Player);
  expect(world.get(player!, Sprite).anchor).toEqual([0.5, 0]);
  render.expectScreenshot('player-idle', { width: 960, height: 540 });

  input.emit(PlayerIntent, { moveX: 1, jump: false, jumpHeld: false, dash: false, fire: false, crouch: false });
  await step(1);
  expect(world.get(player!, PlayerAnimationPresentation).clip).toBe('art/player/run.clip2d.json');
  render.expectScreenshot('player-run', { width: 960, height: 540 });

  input.emit(PlayerIntent, { moveX: 0, jump: true, jumpHeld: true, dash: false, fire: false, crouch: false });
  await step(1);
  expect(world.get(player!, PlayerAnimationPresentation).clip).toBe('art/player/jump.clip2d.json');
  render.expectScreenshot('player-jump', { width: 960, height: 540 });
});

for (const viewport of [
  { name: 'narrow landscape', width: 1024, height: 768, safe: [0, 0, 0, 0] },
  { name: 'standard landscape', width: 1920, height: 1080, safe: [0, 0, 0, 0] },
  { name: 'ultrawide landscape', width: 2560, height: 1080, safe: [0, 0, 0, 0] },
  { name: 'notched landscape', width: 2556, height: 1179, safe: [177, 0, 102, 0] },
] as const) {
  renderTest(`camera preserves the gameplay frame at ${viewport.name}`, async ({ world, step, render, input }) => {
    input.view(viewport.width, viewport.height, 1, [...viewport.safe]);
    await step(90);

    const follow = world.resource(CameraFollowState);
    const [player] = world.entities(Player);
    const position = world.get(player!, LocalTransform).position;
    const [screenX, screenY] = input.worldToScreen([position[0]! - follow.center[0], position[1]! - follow.center[1]]);
    expect(screenX).toBeGreaterThanOrEqual(viewport.safe[0]);
    expect(screenX).toBeLessThanOrEqual(viewport.width - viewport.safe[2]);
    expect(screenY).toBeGreaterThanOrEqual(viewport.safe[1]);
    expect(screenY).toBeLessThanOrEqual(viewport.height - viewport.safe[3]);
    const bounds = cameraCenterBounds(viewport.width, viewport.height, viewport.safe, world.resource(RoomCameraBounds));
    expect(follow.center[0]).toBeGreaterThanOrEqual(Math.min(bounds.minX, bounds.maxX) - 0.001);
    expect(follow.center[0]).toBeLessThanOrEqual(Math.max(bounds.minX, bounds.maxX) + 0.001);
    render.expectScreenshot(`camera-${viewport.name.replaceAll(' ', '-')}`, {
      width: Math.round(viewport.width / 2),
      height: Math.round(viewport.height / 2),
    });
  });
}
