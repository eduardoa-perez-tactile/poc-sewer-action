import { defineSystem, query, read, Sprite, write } from '@gameengine/runtime';
import { EnemyBrain } from '../schema.gen.ts';

export const DriveSoldierFacing = defineSystem({
  name: 'DriveSoldierFacing',
  stage: 'LateUpdate',
  query: query(read(EnemyBrain), write(Sprite)),
  skipUnchanged: true,
  run(_ctx, soldiers) {
    for (const chunk of soldiers.chunks()) {
      const sprite = chunk.col(Sprite);
      for (let row = 0; row < chunk.length; row++) {
        const desired = chunk.is(EnemyBrain, row, 'facing', 'Right') ? 1 : 0;
        if (sprite.flipX[row] !== desired) sprite.flipX[row] = desired;
      }
    }
  },
});
