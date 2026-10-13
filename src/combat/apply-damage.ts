import { defineSystem, query, write } from '@gameengine/runtime';
import { ActorDied, DamageRequested, Health, HitReacting, HitReaction } from '../schema.gen.ts';

export const ApplyDamage = defineSystem({
  name: 'ApplyDamage',
  after: ['AdvanceProjectiles', 'AdvanceEnemyProjectiles'],
  queries: {
    health: query(write(Health)),
    reactions: query(write(HitReaction)),
  },
  runOn: [DamageRequested],
  run(ctx, { health, reactions }) {
    ctx.events.forEach(DamageRequested, (damage) => {
      for (const chunk of health.chunks()) {
        for (let row = 0; row < chunk.length; row++) {
          if (chunk.entity(row) !== damage.target) continue;
          const values = chunk.col(Health);
          const current = values.current[row]!;
          if (current === 0 || ctx.step < values.invulnerableUntilStep[row]!) return;
          const next = damage.amount >= current ? 0 : current - damage.amount;
          values.current[row] = next;
          values.invulnerableUntilStep[row] = ctx.step + values.invulnerabilitySteps[row]!;
          for (const reactionChunk of reactions.chunks()) {
            for (let reactionRow = 0; reactionRow < reactionChunk.length; reactionRow++) {
              if (reactionChunk.entity(reactionRow) !== damage.target) continue;
              const reaction = reactionChunk.col(HitReaction);
              reaction.stepsRemaining[reactionRow] = reaction.steps[reactionRow]!;
              reaction.knockback[reactionRow * 2] = damage.knockback[0];
              reaction.knockback[reactionRow * 2 + 1] = damage.knockback[1];
              ctx.commands.insert(damage.target, HitReacting, {});
              break;
            }
          }
          if (current > 0 && next === 0) ctx.events.emit(ActorDied, { actor: damage.target, killer: damage.source });
          return;
        }
      }
    });
  },
});
