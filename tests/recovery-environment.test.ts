import { expect, worldTest, renderTest } from './complete-level-test.ts';
import { worldTest as firstRoomTest } from './first-room-test.ts';
import { LocalTransform, Sprite, Shape, VisualOffset } from '@gameengine/runtime';
import { TerrainVisual, PlatformCollisionGrid, PlatformCollisionCell, Player } from '../src/schema.gen.ts';

worldTest('recovery environment textured terrain covers authoritative collision cells exactly', async ({ world, step }) => {
  await step(3);
  const grid = world.resource(PlatformCollisionGrid);
  const covered = new Set<string>();
  for (const entity of world.entities(TerrainVisual)) {
    expect(world.has(entity, Sprite)).toBe(true);
    expect(world.has(entity, Shape)).toBe(false);
    const terrain = world.get(entity, TerrainVisual);
    const sprite = world.get(entity, Sprite);
    const position = world.get(entity, LocalTransform).position!;
    expect(sprite.size).toEqual([terrain.columns! * grid.cellSize!, grid.cellSize]);
    expect(terrain.columns).toBeLessThanOrEqual(64);
    const start = Math.round((position[0] - sprite.size![0] / 2 - grid.originX!) / grid.cellSize!);
    for (let x = start; x < start + terrain.columns!; x++) covered.add(`${x}:${terrain.row}`);
  }
  expect(world.entities(TerrainVisual).length).toBe(29);
  const cells = world.entities(PlatformCollisionCell);
  expect(covered.size).toBe(cells.length);
  for (const entity of cells) {
    const cell = world.get(entity, PlatformCollisionCell);
    expect(covered.has(`${cell.x}:${cell.y}`)).toBe(true);
  }
  const [player] = world.entities(Player);
  expect(world.has(player!, VisualOffset)).toBe(true);
  expect(world.get(player!, Sprite).size).toEqual([1.28, 1.54]);
});

firstRoomTest('recovery environment first room also draws textured collision terrain', async ({ world, step }) => {
  await step(3);
  expect(world.entities(TerrainVisual).length).toBeGreaterThan(0);
  for (const entity of world.entities(TerrainVisual)) expect(world.has(entity, Sprite)).toBe(true);
});

renderTest('recovery environment terrain sprites stay bounded at the initial camera', async ({ step, render, loaded }) => {
  await loaded(); await step(3);
  render.expectDrawCalls('<=', 16, { width: 1280, height: 720 });
});
