import { defineSystem, query, read, Sprite, write } from '@gameengine/runtime';
import { EnemyFlashState, GameFeelComparison, EnemyBrain, HitReaction } from '../schema.gen.ts';

export const DriveEnemyDamagePresentation = defineSystem({
  name: 'DriveEnemyDamagePresentation',
  stage: 'LateUpdate',
  query: query(read(EnemyBrain), read(HitReaction), write(Sprite)),
  resources: [read(GameFeelComparison), write(EnemyFlashState)],
  runIf: { any: [{ changed: GameFeelComparison }, { changed: EnemyBrain }, { changed: HitReaction }] },
  run(ctx, enemies) {
    const enabled = ctx.is(GameFeelComparison, 'flashes', true);
    const refresh = !ctx.is(EnemyFlashState, 'enabled', enabled);
    if (refresh) ctx.setField(EnemyFlashState, 'enabled', enabled);
    for (const chunk of enemies.chunks()) {
      const reaction = chunk.col(HitReaction);
      const sprite = chunk.col(Sprite);
      for (let row = 0; row < chunk.length; row++) {
        if (!refresh && !chunk.changed(EnemyBrain, row) && !chunk.changed(HitReaction, row)) continue;
        const dead = chunk.is(EnemyBrain, row, 'state', 'Dead');
        const reacting = ctx.is(GameFeelComparison, 'flashes', true) && reaction.stepsRemaining[row]! > 0;
        sprite.color[row * 4] = reacting ? 1 : dead ? 0.82 : 1;
        sprite.color[row * 4 + 1] = reacting ? 0.42 : dead ? 0.82 : 1;
        sprite.color[row * 4 + 2] = reacting ? 0.42 : dead ? 0.82 : 1;
        sprite.color[row * 4 + 3] = dead ? 0.72 : 1;
      }
    }
  },
});
