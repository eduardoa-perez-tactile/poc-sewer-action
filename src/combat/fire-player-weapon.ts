import { defineSystem, LocalTransform, pool, query, read, write } from '@gameengine/runtime';
import { GameState, Player, PlayerActionState, PlayerMotion, Projectile, ProjectilePoolState, Weapon } from '../schema.gen.ts';
import { PLAYER_PROJECTILE_POOL } from './warm-projectile-pool.ts';

const MUZZLE_FORWARD = 0.62;
const MUZZLE_HEIGHT = 0.76;

export const FirePlayerWeapon = defineSystem({
  name: 'FirePlayerWeapon',
  after: ['WarmProjectilePool', 'ResolvePlatformCollision'],
  before: ['AdvanceProjectiles'],
  query: query(read(Player), read(LocalTransform), write(PlayerMotion), write(Weapon)),
  resources: [read(GameState), read(PlayerActionState), read(ProjectilePoolState)],
  runIf: { resource: GameState, field: 'phase', value: 'Playing' },
  run(ctx, players) {
    const fireHeld = ctx.resource(PlayerActionState).fire[0] !== 0;
    const warmed = ctx.resource(ProjectilePoolState).warmed[0] !== 0;
    for (const chunk of players.chunks()) {
      const transform = chunk.col(LocalTransform);
      const motion = chunk.col(PlayerMotion);
      const weapon = chunk.col(Weapon);
      for (let row = 0; row < chunk.length; row++) {
        const remaining = weapon.cooldownStepsRemaining[row]!;
        const nextCooldown = remaining > 0 ? remaining - 1 : 0;
        if (remaining > 0) weapon.cooldownStepsRemaining[row] = nextCooldown;
        if (!fireHeld || !warmed || nextCooldown > 0) continue;

        const projectile = pool.take(ctx, PLAYER_PROJECTILE_POOL);
        if (projectile === null) continue;
        const direction = motion.facing[row] === 0 ? -1 : 1;
        const x = transform.position[row * 3]! + direction * MUZZLE_FORWARD;
        const y = transform.position[row * 3 + 1]! + MUZZLE_HEIGHT;
        ctx.commands.set(projectile, LocalTransform, { position: [x, y, 0] });
        ctx.commands.set(projectile, Projectile, {
          direction,
          speed: weapon.projectileSpeed[row]!,
          distanceRemaining: weapon.projectileRange[row]!,
          damage: weapon.damage[row]!,
          owner: chunk.entity(row),
        });
        weapon.cooldownStepsRemaining[row] = weapon.fireIntervalSteps[row]!;
        motion.horizontalVelocity[row] = motion.horizontalVelocity[row]! - direction * weapon.recoilSpeed[row]!;
      }
    }
  },
});
