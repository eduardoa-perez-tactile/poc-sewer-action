import { defineSystem, LoadingResumed, pool, write } from '@gameengine/runtime';
import { EnemyAttackPoolState } from '../schema.gen.ts';

export const ENEMY_BULLET_POOL = 'enemy-bullets';
export const ENEMY_BOMB_POOL = 'enemy-bombs';

export const WarmEnemyAttackPools = defineSystem({
  name: 'WarmEnemyAttackPools',
  resources: [write(EnemyAttackPoolState)],
  runOn: [LoadingResumed],
  run(ctx) {
    if (ctx.resource(EnemyAttackPoolState).warmed[0] !== 0) return;
    pool.warm('prefabs/enemy-bullet.prefab.json', 8, { name: ENEMY_BULLET_POOL });
    pool.warm('prefabs/enemy-bomb.prefab.json', 4, { name: ENEMY_BOMB_POOL });
    ctx.setField(EnemyAttackPoolState, 'warmed', true);
  },
});
