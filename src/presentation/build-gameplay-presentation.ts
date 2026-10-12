import { defineSystem, query, read, write } from '@gameengine/runtime';
import { GameState, GameplayPresentation, Player, PlayerControl } from '../schema.gen.ts';

export const BuildGameplayPresentation = defineSystem({
  name: 'BuildGameplayPresentation',
  stage: 'LateUpdate',
  query: query(read(Player), read(PlayerControl)),
  resources: [read(GameState), write(GameplayPresentation)],
  skipUnchanged: true,
  run(ctx, players) {
    let moveX = 0;

    for (const chunk of players.chunks()) {
      if (chunk.length === 0) continue;
      const control = chunk.col(PlayerControl);
      moveX = control.moveX[0] ?? 0;
      break;
    }

    ctx.set(GameplayPresentation, {
      phase: ctx.get(GameState).phase,
      moveX: moveX < 0 ? 'Left' : moveX > 0 ? 'Right' : 'Neutral',
    });
  },
});
