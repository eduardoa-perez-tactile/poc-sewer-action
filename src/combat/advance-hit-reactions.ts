import { defineSystem, LocalTransform, query, read, withTag, write } from '@gameengine/runtime';
import { EnemyBrain, GameState, HitReacting, HitReaction, Player, PlayerMotion } from '../schema.gen.ts';

const DECAY = 0.72;

export const AdvanceHitReactions = defineSystem({
  name: 'AdvanceHitReactions',
  after: ['ApplyDamage'],
  queries: {
    players: query(read(Player), write(HitReaction), write(PlayerMotion), withTag(HitReacting)),
    enemies: query(write(EnemyBrain), write(HitReaction), write(LocalTransform), withTag(HitReacting)),
  },
  resources: [read(GameState)],
  runIf: [
    { resource: GameState, field: 'phase', value: 'Playing' },
    { any: [{ query: query(read(Player), withTag(HitReacting)) }, { query: query(read(EnemyBrain), withTag(HitReacting)) }] },
  ],
  run(ctx, { players, enemies }) {
    for (const chunk of players.chunks()) {
      const reactions = chunk.col(HitReaction);
      const motion = chunk.col(PlayerMotion);
      for (let row = 0; row < chunk.length; row++) {
        const remaining = reactions.stepsRemaining[row]!;
        if (remaining === 0) continue;
        motion.horizontalVelocity[row] = reactions.knockback[row * 2]!;
        motion.verticalVelocity[row] = reactions.knockback[row * 2 + 1]!;
        reactions.knockback[row * 2] = reactions.knockback[row * 2]! * DECAY;
        reactions.knockback[row * 2 + 1] = reactions.knockback[row * 2 + 1]! * DECAY;
        reactions.stepsRemaining[row] = remaining - 1;
        if (remaining === 1) ctx.commands.remove(chunk.entity(row), HitReacting);
      }
    }
    for (const chunk of enemies.chunks()) {
      const brain = chunk.col(EnemyBrain);
      const reactions = chunk.col(HitReaction);
      const position = chunk.col(LocalTransform).position;
      for (let row = 0; row < chunk.length; row++) {
        if (reactions.stepsRemaining[row]! > 0 && !chunk.is(EnemyBrain, row, 'state', 'Dead')) {
          chunk.setField(EnemyBrain, row, 'state', 'Stunned');
        }
        const remaining = reactions.stepsRemaining[row]!;
        if (remaining > 0) {
          position[row * 3] = position[row * 3]! + reactions.knockback[row * 2]! * ctx.dt;
          position[row * 3 + 1] = position[row * 3 + 1]! + reactions.knockback[row * 2 + 1]! * ctx.dt;
          reactions.knockback[row * 2] = reactions.knockback[row * 2]! * DECAY;
          reactions.knockback[row * 2 + 1] = reactions.knockback[row * 2 + 1]! * DECAY;
          reactions.stepsRemaining[row] = remaining - 1;
          if (remaining === 1) ctx.commands.remove(chunk.entity(row), HitReacting);
        }
        if (reactions.stepsRemaining[row] === 0 && chunk.is(EnemyBrain, row, 'state', 'Stunned')) {
          chunk.setField(EnemyBrain, row, 'state', brain.targetDetected[row] !== 0 ? 'Chase' : 'Patrol');
        }
      }
    }
  },
});
