import { defineSystem, LocalTransform, query, read, withTag, write } from '@gameengine/runtime';
import { ActorDied, Alive, Cadaver, CadaverSettling, EnemyBrain, GameState, HitReacting, HitReaction, Player, PlayerControl, PlayerMotion } from '../schema.gen.ts';

export const ResolveDeaths = defineSystem({
  name: 'ResolveDeaths',
  after: ['AdvanceHitReactions'],
  queries: {
    players: query(read(Player), write(PlayerControl), write(PlayerMotion), read(HitReaction), withTag(Alive)),
    enemies: query(write(EnemyBrain), read(HitReaction), read(LocalTransform), withTag(Alive)),
  },
  resources: [write(GameState)],
  runOn: [ActorDied],
  run(ctx, { players, enemies }) {
    ctx.events.forEach(ActorDied, (death) => {
      for (const chunk of players.chunks()) {
        for (let row = 0; row < chunk.length; row++) {
          if (chunk.entity(row) !== death.actor) continue;
          const control = chunk.col(PlayerControl);
          const motion = chunk.col(PlayerMotion);
          control.moveX[row] = 0;
          control.crouch[row] = 0;
          control.jumpHeld[row] = 0;
          motion.horizontalVelocity[row] = 0;
          motion.verticalVelocity[row] = 0;
          ctx.commands.remove(death.actor, Alive);
          ctx.commands.remove(death.actor, HitReacting);
          ctx.setField(GameState, 'phase', 'PlayerDead');
          return;
        }
      }

      for (const chunk of enemies.chunks()) {
        for (let row = 0; row < chunk.length; row++) {
          if (chunk.entity(row) !== death.actor) continue;
          const reaction = chunk.col(HitReaction);
          const brain = chunk.col(EnemyBrain);
          chunk.setField(EnemyBrain, row, 'state', 'Dead');
          chunk.setField(EnemyBrain, row, 'attackKind', 'None');
          brain.attackTelegraphed[row] = 0;
          ctx.commands.remove(death.actor, Alive);
          ctx.commands.remove(death.actor, HitReacting);
          ctx.commands.insert(death.actor, Cadaver, {
            ageSteps: 0,
            settleStepsRemaining: 10,
            velocity: [reaction.knockback[row * 2]!, reaction.knockback[row * 2 + 1]!],
          });
          ctx.commands.insert(death.actor, CadaverSettling, {});
          return;
        }
      }
    });
  },
});
