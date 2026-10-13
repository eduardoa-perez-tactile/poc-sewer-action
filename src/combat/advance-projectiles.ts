import { solidCells } from '../room/solid-cells.ts';
import { Bounds2D, defineSystem, entityAt, type EntityId, LocalTransform, NO_ENTITY, pool, query, read, write } from '@gameengine/runtime';
import { LevelCollisionIndex, CombatEffect, DamageRequested, GameState, Health, PlatformCollisionCell, PlatformCollisionGrid, Projectile } from '../schema.gen.ts';

const EPSILON = 0.00001;

export const AdvanceProjectiles = defineSystem({
  name: 'AdvanceProjectiles',
  after: ['FirePlayerWeapon'],
  queries: {
    projectiles: query(write(Projectile), read(Bounds2D), write(LocalTransform)),
    levelIndex: query(read(LevelCollisionIndex)),
    cells: query(read(PlatformCollisionCell)),
    targets: query(read(Health), read(Bounds2D), read(LocalTransform)),
  },
  resources: [read(GameState), read(PlatformCollisionGrid)],
  runIf: { resource: GameState, field: 'phase', value: 'Playing' },
  run(ctx, { projectiles, cells, targets, levelIndex }) {
    const grid = ctx.resource(PlatformCollisionGrid);
    const originX = grid.originX[0]!;
    const originY = grid.originY[0]!;
    const cellSize = grid.cellSize[0]!;
    let words: Uint32Array | undefined;
    for (const chunk of levelIndex.chunks()) if (chunk.length > 0) words = chunk.col(LevelCollisionIndex).words;
    const recycle: EntityId[] = [];

    for (const chunk of projectiles.chunks()) {
      const projectile = chunk.col(Projectile);
      const projectileBounds = chunk.col(Bounds2D);
      const position = chunk.col(LocalTransform).position;
      for (let row = 0; row < chunk.length; row++) {
        const entity = chunk.entity(row);
        const halfWidth = projectileBounds.size[row * 2]! * 0.5;
        const halfHeight = projectileBounds.size[row * 2 + 1]! * 0.5;
        const offsetX = projectileBounds.offset[row * 2]!;
        const offsetY = projectileBounds.offset[row * 2 + 1]!;
        const travel = projectile.speed[row]! * ctx.dt;
        const allowed = travel < projectile.distanceRemaining[row]! ? travel : projectile.distanceRemaining[row]!;
        const fromX = position[row * 3]!;
        const collisionFromX = fromX + offsetX;
        const y = position[row * 3 + 1]! + offsetY;
        const toX = fromX + projectile.direction[row]! * allowed;
        const collisionToX = toX + offsetX;
        let hitWall = false;

        for (const coordinate of solidCells(cells, words, originX, originY, cellSize, grid.columns[0]!, grid.rows[0]!, Math.min(collisionFromX, collisionToX) - halfWidth, Math.max(collisionFromX, collisionToX) + halfWidth, y - halfHeight, y + halfHeight)) {
            const left = originX + ((coordinate << 16) >> 16) * cellSize;
            const bottom = originY + (coordinate >> 16) * cellSize;
            const right = left + cellSize;
            const top = bottom + cellSize;
            if (y + halfHeight <= bottom + EPSILON || y - halfHeight >= top - EPSILON) continue;
            if (projectile.direction[row]! > 0 && collisionFromX + halfWidth <= left + EPSILON && collisionToX + halfWidth >= left) hitWall = true;
            if (projectile.direction[row]! < 0 && collisionFromX - halfWidth >= right - EPSILON && collisionToX - halfWidth <= right) hitWall = true;
          }

        let hitTarget = false;
        if (!hitWall) {
          for (const targetChunk of targets.chunks()) {
            const targetBounds = targetChunk.col(Bounds2D);
            const targetPosition = targetChunk.col(LocalTransform).position;
            const targetHealth = targetChunk.col(Health);
            for (let targetRow = 0; targetRow < targetChunk.length; targetRow++) {
              if (targetHealth.current[targetRow] === 0) continue;
              const target = targetChunk.entity(targetRow);
              if (target === entityAt(projectile.owner, row)) continue;
              if ((projectileBounds.mask[row]! & targetBounds.layer[targetRow]!) === 0) continue;
              if ((targetBounds.mask[targetRow]! & projectileBounds.layer[row]!) === 0) continue;
              const targetX = targetPosition[targetRow * 3]! + targetBounds.offset[targetRow * 2]!;
              const targetY = targetPosition[targetRow * 3 + 1]! + targetBounds.offset[targetRow * 2 + 1]!;
              const targetHalfWidth = targetBounds.size[targetRow * 2]! * 0.5;
              const targetHalfHeight = targetBounds.size[targetRow * 2 + 1]! * 0.5;
              if (y + halfHeight < targetY - targetHalfHeight || y - halfHeight > targetY + targetHalfHeight) continue;
              const minX = collisionFromX < collisionToX ? collisionFromX : collisionToX;
              const maxX = collisionFromX > collisionToX ? collisionFromX : collisionToX;
              if (maxX + halfWidth < targetX - targetHalfWidth || minX - halfWidth > targetX + targetHalfWidth) continue;
              const owner = entityAt(projectile.owner, row);
              ctx.events.emit(DamageRequested, {
                source: owner === NO_ENTITY ? entity : owner,
                target,
                amount: projectile.damage[row]!,
                knockback: [projectile.direction[row]! * 5, 2.5],
              });
              hitTarget = true;
              break;
            }
            if (hitTarget) break;
          }
        }

        const exhausted = allowed + EPSILON >= projectile.distanceRemaining[row]!;
        if (hitWall || hitTarget) ctx.events.emit(CombatEffect, { kind: 'hit', position: [toX, y], step: ctx.step });
        if (hitWall || hitTarget || exhausted) recycle.push(entity);
        else {
          position[row * 3] = toX;
          projectile.distanceRemaining[row] = projectile.distanceRemaining[row]! - allowed;
        }
      }
    }
    pool.giveMany(ctx, recycle);
  },
});
