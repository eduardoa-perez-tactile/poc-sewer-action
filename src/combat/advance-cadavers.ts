import { defineSystem, LocalTransform, query, read, withTag, write } from '@gameengine/runtime';
import { Cadaver, CadaverSettling, GameState } from '../schema.gen.ts';

const DECAY = 0.65;

export const AdvanceCadavers = defineSystem({
  name: 'AdvanceCadavers',
  after: ['ResolveDeaths'],
  query: query(write(Cadaver), write(LocalTransform), withTag(CadaverSettling)),
  resources: [read(GameState)],
  runIf: [{ resource: GameState, field: 'phase', op: '!=', value: 'Paused' }, { query: query(write(Cadaver), withTag(CadaverSettling)) }],
  run(ctx, cadavers) {
    for (const chunk of cadavers.chunks()) {
      const cadaver = chunk.col(Cadaver);
      const position = chunk.col(LocalTransform).position;
      for (let row = 0; row < chunk.length; row++) {
        const remaining = cadaver.settleStepsRemaining[row]!;
        if (remaining === 0) continue;
        cadaver.ageSteps[row] = cadaver.ageSteps[row]! + 1;
        position[row * 3] = position[row * 3]! + cadaver.velocity[row * 2]! * ctx.dt;
        cadaver.velocity[row * 2] = cadaver.velocity[row * 2]! * DECAY;
        cadaver.velocity[row * 2 + 1] = 0;
        cadaver.settleStepsRemaining[row] = remaining - 1;
        if (remaining === 1) ctx.commands.remove(chunk.entity(row), CadaverSettling);
      }
    }
  },
});
