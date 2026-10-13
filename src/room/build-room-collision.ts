import { defineSystem, NavGrid, loadData, query, read, write } from '@gameengine/runtime';
import { LevelCollisionIndex, LevelProgress, SewerLevelDef, PlatformCollisionGrid, RoomCollisionState } from '../schema.gen.ts';

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
  query: query(read(LevelProgress), write(LevelCollisionIndex)),
  resources: [write(PlatformCollisionGrid), write(RoomCollisionState)],
  runIf: { resource: RoomCollisionState, field: 'built', value: false },
  run(ctx, levels) {
    let tilemap = FIRST_SEWER_ROOM_TILEMAP;
    let levelEntity = 0;
    for (const chunk of levels.chunks()) {
      if (chunk.length === 0) continue;
      tilemap = loadData(SewerLevelDef, chunk.get(LevelProgress, 0).data!).tilemap;
      levelEntity = chunk.entity(0);
    }
    const mapping = ctx.get(PlatformCollisionGrid);
    const solids = NavGrid.fromTilemap(tilemap, isStaticCollisionTile, {
      origin: [mapping.originX, mapping.originY],
      cellSize: mapping.cellSize,
    });
    if (solids.width > (levelEntity ? 128 : 32) || solids.height > 32) {
      throw new Error(`static collision grid ${solids.width}x${solids.height} exceeds the packed collision limit`);
    }
    const words = new Array<number>(128).fill(0);
    const solidRows = new Array<number>(32).fill(0);

    let cellCount = 0;
    for (let y = 0; y < solids.height; y++) {
      for (let x = 0; x < solids.width; x++) {
        if (solids.isWalkable(x, y)) {
          ctx.commands.spawn({ PlatformCollisionCell: { x, y } });
          if (x < 32) solidRows[y] = (solidRows[y]! | (1 << x)) >>> 0;
          const word = y * 4 + (x >>> 5);
          words[word] = (words[word]! | (1 << (x & 31))) >>> 0;
          cellCount += 1;
        }
      }
    }
    if (levelEntity) {
      // The installed host does not emit Tilemap geometry. Merge its authored solid runs into
      // static ledge silhouettes so traversal remains readable without per-tile render entities.
      for (let y = 0; y < solids.height; y++) {
        let x = 0;
        while (x < solids.width) {
          if (!solids.isWalkable(x, y)) { x++; continue; }
          const start = x;
          while (x < solids.width && solids.isWalkable(x, y)) x++;
          const width = (x - start) * mapping.cellSize;
          const left = mapping.originX + start * mapping.cellSize;
          const bottom = mapping.originY + y * mapping.cellSize;
          ctx.commands.spawn({
            LocalTransform: { position: [left + width / 2, bottom + mapping.cellSize / 2, 0] },
            Shape: { size: [width, mapping.cellSize], color: '#3f461fff', sortingLayer: 'World' },
            TerrainVisual: { row: y, columns: x - start },
          });
          // Bright finite rim marks the exact collision surface, including raised platforms.
          ctx.commands.spawn({
            LocalTransform: { position: [left + width / 2, bottom + mapping.cellSize - 0.025, 0] },
            Shape: { size: [width, 0.05], color: '#a29650ff', sortingLayer: 'World', order: 1 },
            TerrainVisual: { row: y, columns: x - start },
          });
        }
      }
      ctx.commands.insert(levelEntity, LevelCollisionIndex, { words });
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
