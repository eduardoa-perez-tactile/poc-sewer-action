import { Clip2DEvent, Clip2DFinished, defineSystem, LocalTransform, playClip2D, pool, query, read, write } from '@gameengine/runtime';
import { CombatEffect, EnemyAttackPoolState, EnemyBrain, EnemyProjectile } from '../schema.gen.ts';
import { ENEMY_BOMB_POOL, ENEMY_BULLET_POOL } from './warm-enemy-attack-pools.ts';

const IDLE_CLIP = 'art/soldier/idle.clip2d.json';

export const ResolveSoldierAttackEvents = defineSystem({
  name: 'ResolveSoldierAttackEvents',
  after: ['StartSoldierAttacks'],
  before: ['AdvanceEnemyProjectiles'],
  query: query(write(EnemyBrain), read(LocalTransform)),
  resources: [read(EnemyAttackPoolState)],
  events: [Clip2DEvent, Clip2DFinished],
  runIf: { any: [{ event: Clip2DEvent }, { event: Clip2DFinished }] },
  run(ctx, soldiers) {
    ctx.events.forEach(Clip2DEvent, (event) => {
      for (const chunk of soldiers.chunks()) {
        for (let row = 0; row < chunk.length; row++) {
          if (chunk.entity(row) !== event.entity || !chunk.is(EnemyBrain, row, 'state', 'Attack')) continue;
          const brain = chunk.col(EnemyBrain);
          const transform = chunk.col(LocalTransform);
          const direction = chunk.is(EnemyBrain, row, 'facing', 'Left') ? -1 : 1;
          const bomb = event.name === 'throw-bomb';
          if (!bomb && event.name !== 'fire-bullet' && event.name !== 'fire-crouch-bullet') return;
          const projectile = pool.take(ctx, bomb ? ENEMY_BOMB_POOL : ENEMY_BULLET_POOL);
          if (projectile === null) return;
          const crouch = event.name === 'fire-crouch-bullet';
          const x = transform.position[row * 3]! + direction * (bomb ? 0.48 : 0.62);
          const y = transform.position[row * 3 + 1]! + (bomb ? 1.05 : crouch ? 0.46 : 0.92);
          ctx.commands.set(projectile, LocalTransform, { position: [x, y, 0] });
          ctx.commands.set(projectile, EnemyProjectile, {
            kind: bomb ? 'Bomb' : 'Bullet',
            velocityX: direction * (bomb ? 5 : 10),
            velocityY: bomb ? 6 : 0,
            gravity: bomb ? 15 : 0,
            distanceRemaining: bomb ? 8 : 9,
            lifetimeStepsRemaining: bomb ? 90 : 60,
            damage: 1,
            owner: chunk.entity(row),
          });
          if (!bomb) ctx.events.emit(CombatEffect, { kind: 'muzzle', position: [x, y], step: ctx.step });
          brain.attackTelegraphed[row] = 0;
          return;
        }
      }
    });

    ctx.events.forEach(Clip2DFinished, (event) => {
      for (const chunk of soldiers.chunks()) {
        for (let row = 0; row < chunk.length; row++) {
          if (chunk.entity(row) !== event.entity || !chunk.is(EnemyBrain, row, 'state', 'Attack')) continue;
          const brain = chunk.col(EnemyBrain);
          chunk.setField(EnemyBrain, row, 'state', 'Chase');
          chunk.setField(EnemyBrain, row, 'attackKind', 'None');
          brain.attackCooldownStepsRemaining[row] = brain.attackCooldownSteps[row]!;
          brain.attackTelegraphed[row] = 0;
          playClip2D(ctx, event.entity, IDLE_CLIP, { loop: 'once', restart: true });
          return;
        }
      }
    });
  },
});
