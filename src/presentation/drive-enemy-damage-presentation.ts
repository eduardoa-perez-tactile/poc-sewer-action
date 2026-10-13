import { defineSystem, query, read, Sprite, write } from '@gameengine/runtime';
import { EnemyBrain, HitReaction } from '../schema.gen.ts';

export const DriveEnemyDamagePresentation = defineSystem({
  name: 'DriveEnemyDamagePresentation',
  stage: 'LateUpdate',
  query: query(read(EnemyBrain), read(HitReaction), write(Sprite)),
  runIf: { any: [{ changed: EnemyBrain }, { changed: HitReaction }] },
  run(_ctx, enemies) {
    for (const chunk of enemies.chunks()) {
      const reaction = chunk.col(HitReaction);
      const sprite = chunk.col(Sprite);
      for (let row = 0; row < chunk.length; row++) {
        const dead = chunk.is(EnemyBrain, row, 'state', 'Dead');
        const reacting = reaction.stepsRemaining[row]! > 0;
        sprite.color[row * 4] = reacting ? 1 : dead ? 0.82 : 1;
        sprite.color[row * 4 + 1] = reacting ? 0.42 : dead ? 0.82 : 1;
        sprite.color[row * 4 + 2] = reacting ? 0.42 : dead ? 0.82 : 1;
        sprite.color[row * 4 + 3] = dead ? 0.72 : 1;
      }
    }
  },
});
