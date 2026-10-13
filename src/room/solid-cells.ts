import type { Query } from '@gameengine/runtime';
import { PlatformCollisionCell } from '../schema.gen.ts';

/** Stable integer coordinates; full levels visit only the swept cells, fixtures retain authored order. */
export function* solidCells(
  cells: Query, words: Uint32Array | undefined,
  originX: number, originY: number, cellSize: number, columns: number, rows: number,
  minX: number, maxX: number, minY: number, maxY: number,
): Generator<number> {
  if (!words) {
    for (const chunk of cells.chunks()) {
      const cell = chunk.col(PlatformCollisionCell);
      for (let row = 0; row < chunk.length; row++) yield (cell.y[row]! << 16) | (cell.x[row]! & 0xffff);
    }
    return;
  }
  const firstX = Math.max(0, Math.floor((minX - originX) / cellSize));
  const lastX = Math.min(columns - 1, Math.floor((maxX - originX) / cellSize));
  const firstY = Math.max(0, Math.floor((minY - originY) / cellSize));
  const lastY = Math.min(rows - 1, Math.floor((maxY - originY) / cellSize));
  for (let y = firstY; y <= lastY; y++) for (let x = firstX; x <= lastX; x++) {
    if (((words[y * 4 + (x >>> 5)]! >>> (x & 31)) & 1) !== 0) yield (y << 16) | x;
  }
}
