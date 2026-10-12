import { defineSystem, LoadingResumed, pool, write } from '@gameengine/runtime';
import { ProjectilePoolState } from '../schema.gen.ts';

export const PLAYER_PROJECTILE_POOL = 'player-projectiles';
export const PLAYER_PROJECTILE_PREFAB = 'prefabs/player-projectile.prefab.json';
export const PLAYER_PROJECTILE_POOL_SIZE = 12;

export const WarmProjectilePool = defineSystem({
  name: 'WarmProjectilePool',
  resources: [write(ProjectilePoolState)],
  runOn: [LoadingResumed],
  run(ctx) {
    if (ctx.resource(ProjectilePoolState).warmed[0] !== 0) return;
    pool.warm(PLAYER_PROJECTILE_PREFAB, PLAYER_PROJECTILE_POOL_SIZE, { name: PLAYER_PROJECTILE_POOL });
    ctx.setField(ProjectilePoolState, 'warmed', true);
  },
});
