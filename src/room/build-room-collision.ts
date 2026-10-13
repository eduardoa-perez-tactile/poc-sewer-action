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
    // Native tilemap geometry is absent on this host. Each row run uses an authored strip
    // baked from the same occupancy; edge cells use supplied left/right corner tiles.
    // One sprite per run keeps the terrain on the existing environment atlas, with no
    // stretched source texels and no per-step work. First-room and full-route share it.
    const terrainSet = tilemap.includes('complete-sewer') ? 'complete-sewer' : 'first-sewer-room';
    for (let y = 0; y < solids.height; y++) {
      let x = 0;
      while (x < solids.width) {
        if (!solids.isWalkable(x, y)) { x++; continue; }
        const start = x;
        while (x < solids.width && x < start + 64 && solids.isWalkable(x, y)) x++;
        const width = (x - start) * mapping.cellSize;
        const left = mapping.originX + start * mapping.cellSize;
        const bottom = mapping.originY + y * mapping.cellSize;
        ctx.commands.spawn({
          LocalTransform: { position: [left + width / 2, bottom + mapping.cellSize / 2, 0] },
          Sprite: { image: `art/environment/terrain/${terrainSet}-${y}-${start}`, size: [width, mapping.cellSize], sortingLayer: 'World' },
          TerrainVisual: { row: y, columns: x - start },
        });
      }
    }
    if (levelEntity) ctx.commands.insert(levelEntity, LevelCollisionIndex, { words });
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
