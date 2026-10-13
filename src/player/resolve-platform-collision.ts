import { solidCells } from '../room/solid-cells.ts';
import { defineSystem, LocalTransform, query, read, write } from '@gameengine/runtime';
import {
  LevelCollisionIndex,
  GameState,
  PlatformCollisionCell,
  PlatformCollisionGrid,
  Player,
  PlayerGroundContact,
  PlayerMotion,
} from '../schema.gen.ts';

const EPSILON = 0.00001;

export const ResolvePlatformCollision = defineSystem({
  name: 'ResolvePlatformCollision',
  after: ['MovePlayerHorizontally'],
  before: ['AdvancePlayerDash'],
  queries: {
    players: query(read(Player), write(PlayerGroundContact), write(PlayerMotion), write(LocalTransform)),
    levelIndex: query(read(LevelCollisionIndex)),
    cells: query(read(PlatformCollisionCell)),
  },
  resources: [read(GameState), read(PlatformCollisionGrid)],
  runIf: { resource: GameState, field: 'phase', value: 'Playing' },
  run(ctx, { players, cells, levelIndex }) {
    const grid = ctx.resource(PlatformCollisionGrid);
    const originX = grid.originX[0]!;
    const originY = grid.originY[0]!;
    const cellSize = grid.cellSize[0]!;
    let words: Uint32Array | undefined;
    for (const chunk of levelIndex.chunks()) if (chunk.length > 0) words = chunk.col(LevelCollisionIndex).words;

    for (const chunk of players.chunks()) {
      const config = chunk.col(Player);
      const contact = chunk.col(PlayerGroundContact);
      const motion = chunk.col(PlayerMotion);
      const position = chunk.col(LocalTransform).position;

      for (let row = 0; row < chunk.length; row++) {
        let x = position[row * 3]!;
        let y = position[row * 3 + 1]!;
        let velocityX = motion.horizontalVelocity[row]!;
        let velocityY = motion.verticalVelocity[row]!;
        const halfWidth = config.collisionHalfWidth[row]!;
        const height = config.collisionHeight[row]!;
        const dx = velocityX * ctx.dt;
        const dy = velocityY * ctx.dt;
        let targetX = x + dx;
        let targetY = y + dy;
        let blockedX = false;
        let stepY = y;

        if (dx !== 0) {
          let boundary = targetX;
          for (const coordinate of solidCells(cells, words, originX, originY, cellSize, grid.columns[0]!, grid.rows[0]!, Math.min(x, targetX) - halfWidth, Math.max(x, targetX) + halfWidth, y, y + height)) {
              const left = originX + ((coordinate << 16) >> 16) * cellSize;
              const bottom = originY + (coordinate >> 16) * cellSize;
              const right = left + cellSize;
              const top = bottom + cellSize;
              if (y + height <= bottom + EPSILON || y >= top - EPSILON) continue;

              if (dx > 0 && x + halfWidth <= left + EPSILON && targetX + halfWidth > left) {
                const candidate = left - halfWidth;
                if (!blockedX || candidate < boundary) boundary = candidate;
                blockedX = true;
                const rise = top - y;
                if (motion.groundedForMovement[row] !== 0 && dy <= 0 && rise > EPSILON && rise <= config.maxStepHeight[row]! + EPSILON && top > stepY) {
                  stepY = top;
                }
              } else if (dx < 0 && x - halfWidth >= right - EPSILON && targetX - halfWidth < right) {
                const candidate = right + halfWidth;
                if (!blockedX || candidate > boundary) boundary = candidate;
                blockedX = true;
                const rise = top - y;
                if (motion.groundedForMovement[row] !== 0 && dy <= 0 && rise > EPSILON && rise <= config.maxStepHeight[row]! + EPSILON && top > stepY) {
                  stepY = top;
                }
              }
            }

          if (blockedX && stepY > y) {
            let clear = true;
            for (const coordinate of solidCells(cells, words, originX, originY, cellSize, grid.columns[0]!, grid.rows[0]!, targetX - halfWidth, targetX + halfWidth, stepY, stepY + height)) {
                const left = originX + ((coordinate << 16) >> 16) * cellSize;
                const bottom = originY + (coordinate >> 16) * cellSize;
                const right = left + cellSize;
                const top = bottom + cellSize;
                if (targetX + halfWidth <= left + EPSILON || targetX - halfWidth >= right - EPSILON) continue;
                if (stepY + height <= bottom + EPSILON || stepY >= top - EPSILON) continue;
                clear = false;
              }
            if (clear) {
              y = stepY;
              targetY = stepY;
              blockedX = false;
            }
          }

          x = blockedX ? boundary : targetX;
          if (blockedX) velocityX = 0;
        }

        let grounded = false;
        if (dy > 0) {
          let ceiling = targetY;
          let hit = false;
          for (const coordinate of solidCells(cells, words, originX, originY, cellSize, grid.columns[0]!, grid.rows[0]!, x - halfWidth, x + halfWidth, y, targetY + height)) {
              const left = originX + ((coordinate << 16) >> 16) * cellSize;
              const bottom = originY + (coordinate >> 16) * cellSize;
              const right = left + cellSize;
              if (x + halfWidth <= left + EPSILON || x - halfWidth >= right - EPSILON) continue;
              if (y + height <= bottom + EPSILON && targetY + height > bottom) {
                const candidate = bottom - height;
                if (!hit || candidate < ceiling) ceiling = candidate;
                hit = true;
              }
            }
          y = hit ? ceiling : targetY;
          if (hit) velocityY = 0;
        } else {
          const snap = motion.ignoreGroundContact[row] === 0 && velocityY <= 0 ? config.groundSnapDistance[row]! : 0;
          const floorTarget = targetY - snap;
          let floor = floorTarget;
          let hit = false;
          for (const coordinate of solidCells(cells, words, originX, originY, cellSize, grid.columns[0]!, grid.rows[0]!, x - halfWidth, x + halfWidth, floorTarget - cellSize, y + EPSILON)) {
              const left = originX + ((coordinate << 16) >> 16) * cellSize;
              const top = originY + ((coordinate >> 16) + 1) * cellSize;
              const right = left + cellSize;
              if (x + halfWidth <= left + EPSILON || x - halfWidth >= right - EPSILON) continue;
              if (y >= top - EPSILON && floorTarget <= top + EPSILON) {
                if (!hit || top > floor) floor = top;
                hit = true;
              }
            }
          y = hit ? floor : targetY;
          grounded = hit;
          if (hit && velocityY < 0) velocityY = 0;
        }

        position[row * 3] = x;
        position[row * 3 + 1] = y;
        motion.horizontalVelocity[row] = velocityX;
        motion.verticalVelocity[row] = velocityY;
        contact.grounded[row] = grounded ? 1 : 0;
      }
    }
  },
});
