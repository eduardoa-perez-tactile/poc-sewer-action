import { defineSystem, NavGrid, read, write } from '@gameengine/runtime';
import { PlatformCollisionGrid, RoomCollisionState } from '../schema.gen.ts';

export const FIRST_SEWER_ROOM_TILEMAP = 'rooms/first-sewer-room.tilemap.json';
const STATIC_COLLISION_TILES = new Set([
  22, 23, 24, 26, 27, 28, 30, 31, 32,
  39, 40, 41, 43, 44, 45, 47, 48, 49,
  56, 57, 58, 60, 61, 62, 64, 65, 66,
]);

export const isStaticCollisionTile = (tile: number): boolean => STATIC_COLLISION_TILES.has(tile);

export const BuildRoomCollision = defineSystem({
  name: 'BuildRoomCollision',
  before: ['SetupGame'],
  resources: [write(PlatformCollisionGrid), write(RoomCollisionState)],
  runIf: { resource: RoomCollisionState, field: 'built', value: false },
  run(ctx) {
    const mapping = ctx.get(PlatformCollisionGrid);
    const solids = NavGrid.fromTilemap(FIRST_SEWER_ROOM_TILEMAP, isStaticCollisionTile, {
      origin: [mapping.originX, mapping.originY],
      cellSize: mapping.cellSize,
    });
    if (solids.width > 32 || solids.height > 32) {
      throw new Error(`static collision grid ${solids.width}x${solids.height} exceeds the packed 32x32 limit`);
    }
    const solidRows = new Array<number>(32).fill(0);

    let cellCount = 0;
    for (let y = 0; y < solids.height; y++) {
      for (let x = 0; x < solids.width; x++) {
        if (solids.isWalkable(x, y)) {
          ctx.commands.spawn({ PlatformCollisionCell: { x, y } });
          solidRows[y] = (solidRows[y]! | (1 << x)) >>> 0;
          cellCount += 1;
        }
      }
    }
    ctx.set(PlatformCollisionGrid, {
      originX: mapping.originX,
      originY: mapping.originY,
      cellSize: mapping.cellSize,
      columns: solids.width,
      rows: solids.height,
      solidRows,
    });
    ctx.set(RoomCollisionState, { built: true, cellCount });
  },
});
