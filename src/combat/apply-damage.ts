import { defineSystem, query, write } from '@gameengine/runtime';
import { ActorDied, DamageRequested, Health } from '../schema.gen.ts';

export const ApplyDamage = defineSystem({
  name: 'ApplyDamage',
  after: ['AdvanceProjectiles'],
  query: query(write(Health)),
  runOn: [DamageRequested],
  run(ctx, health) {
    ctx.events.forEach(DamageRequested, (damage) => {
      for (const chunk of health.chunks()) {
        for (let row = 0; row < chunk.length; row++) {
          if (chunk.entity(row) !== damage.target) continue;
          const values = chunk.col(Health);
          const current = values.current[row]!;
          const next = damage.amount >= current ? 0 : current - damage.amount;
          values.current[row] = next;
          if (current > 0 && next === 0) ctx.events.emit(ActorDied, { actor: damage.target, killer: damage.source });
          return;
        }
      }
    });
  },
});
