import { Bounds2D, defineSystem, entityAt, type EntityId, LocalTransform, pool, query, read, write } from '@gameengine/runtime';
import { DamageRequested, EnemyProjectile, GameState, Health, PlatformCollisionGrid } from '../schema.gen.ts';

const EPSILON = 0.00001;

export const AdvanceEnemyProjectiles = defineSystem({
  name: 'AdvanceEnemyProjectiles',
  after: ['ResolveSoldierAttackEvents'],
  queries: {
    projectiles: query(write(EnemyProjectile), read(Bounds2D), write(LocalTransform)),
    targets: query(read(Health), read(Bounds2D), read(LocalTransform)),
  },
  resources: [read(GameState), read(PlatformCollisionGrid)],
  runIf: [
    { resource: GameState, field: 'phase', value: 'Playing' },
    { query: query(read(EnemyProjectile)) },
  ],
  run(ctx, { projectiles, targets }) {
    const grid = ctx.resource(PlatformCollisionGrid);
    const originX = grid.originX[0]!;
    const originY = grid.originY[0]!;
    const cellSize = grid.cellSize[0]!;
    const recycle: EntityId[] = [];

    for (const chunk of projectiles.chunks()) {
      const projectile = chunk.col(EnemyProjectile);
      const bounds = chunk.col(Bounds2D);
      const position = chunk.col(LocalTransform).position;
      for (let row = 0; row < chunk.length; row++) {
        const entity = chunk.entity(row);
        const owner = entityAt(projectile.owner, row);
        const fromX = position[row * 3]!;
        const fromY = position[row * 3 + 1]!;
        const velocityX = projectile.velocityX[row]!;
        let velocityY = projectile.velocityY[row]!;
        if (chunk.is(EnemyProjectile, row, 'kind', 'Bomb')) velocityY -= projectile.gravity[row]! * ctx.dt;
        const toX = fromX + velocityX * ctx.dt;
        const toY = fromY + velocityY * ctx.dt;
        const radius = bounds.radius[row]! > 0 ? bounds.radius[row]! : bounds.size[row * 2]! * 0.5;
        const halfHeight = bounds.radius[row]! > 0 ? bounds.radius[row]! : bounds.size[row * 2 + 1]! * 0.5;
        let hitWall = false;

        const minX = (fromX < toX ? fromX : toX) - radius;
        const maxX = (fromX > toX ? fromX : toX) + radius;
        const minY = (fromY < toY ? fromY : toY) - halfHeight;
        const maxY = (fromY > toY ? fromY : toY) + halfHeight;
        const firstColumn = Math.max(0, Math.floor((minX - originX) / cellSize));
        const lastColumn = Math.min(grid.columns[0]! - 1, Math.floor((maxX - originX) / cellSize));
        const firstRow = Math.max(0, Math.floor((minY - originY) / cellSize));
        const lastRow = Math.min(grid.rows[0]! - 1, Math.floor((maxY - originY) / cellSize));
        for (let gridRow = firstRow; gridRow <= lastRow && !hitWall; gridRow++) {
          const solid = grid.solidRows[gridRow]!;
          for (let column = firstColumn; column <= lastColumn; column++) {
            if (((solid >>> column) & 1) !== 0) {
              hitWall = true;
              break;
            }
          }
        }

        let hitTarget = false;
        if (!hitWall) {
          for (const targetChunk of targets.chunks()) {
            const targetBounds = targetChunk.col(Bounds2D);
            const targetPosition = targetChunk.col(LocalTransform).position;
            for (let targetRow = 0; targetRow < targetChunk.length; targetRow++) {
              const target = targetChunk.entity(targetRow);
              if (target === owner) continue;
              if ((bounds.mask[row]! & targetBounds.layer[targetRow]!) === 0 || (targetBounds.mask[targetRow]! & bounds.layer[row]!) === 0) continue;
              const targetX = targetPosition[targetRow * 3]! + targetBounds.offset[targetRow * 2]!;
              const targetY = targetPosition[targetRow * 3 + 1]! + targetBounds.offset[targetRow * 2 + 1]!;
              const targetHalfWidth = targetBounds.size[targetRow * 2]! * 0.5;
              const targetHalfHeight = targetBounds.size[targetRow * 2 + 1]! * 0.5;
              const minX = fromX < toX ? fromX : toX;
              const maxX = fromX > toX ? fromX : toX;
              const minY = fromY < toY ? fromY : toY;
              const maxY = fromY > toY ? fromY : toY;
              if (maxX + radius < targetX - targetHalfWidth || minX - radius > targetX + targetHalfWidth) continue;
              if (maxY + halfHeight < targetY - targetHalfHeight || minY - halfHeight > targetY + targetHalfHeight) continue;
              ctx.events.emit(DamageRequested, { source: owner, target, amount: projectile.damage[row]! });
              hitTarget = true;
              break;
            }
            if (hitTarget) break;
          }
        }

        const dx = velocityX * ctx.dt;
        const dy = velocityY * ctx.dt;
        const absDx = dx < 0 ? -dx : dx;
        const absDy = dy < 0 ? -dy : dy;
        const travelled = absDx > absDy ? absDx : absDy;
        const exhausted = travelled + EPSILON >= projectile.distanceRemaining[row]!;
        const lifetime = projectile.lifetimeStepsRemaining[row]!;
        if (hitWall || hitTarget || exhausted || lifetime <= 1) recycle.push(entity);
        else {
          position[row * 3] = toX;
          position[row * 3 + 1] = toY;
          projectile.velocityY[row] = velocityY;
          projectile.distanceRemaining[row] = projectile.distanceRemaining[row]! - travelled;
          projectile.lifetimeStepsRemaining[row] = lifetime - 1;
        }
      }
    }
    pool.giveMany(ctx, recycle);
  },
});
