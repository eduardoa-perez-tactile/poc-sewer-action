import { defineSystem, query, read, write } from '@gameengine/runtime';
import { GameState, GameplayPresentation, Player, PlayerControl, PlayerDashState } from '../schema.gen.ts';

export const BuildGameplayPresentation = defineSystem({
  name: 'BuildGameplayPresentation',
  stage: 'LateUpdate',
  query: query(read(Player), read(PlayerControl), read(PlayerDashState)),
  resources: [read(GameState), write(GameplayPresentation)],
  skipUnchanged: true,
  run(ctx, players) {
    let moveX = 0;
    let dashing = false;
    let dashDirection: 'Left' | 'Right' = 'Right';
    let dashReady = true;

    for (const chunk of players.chunks()) {
      if (chunk.length === 0) continue;
      const control = chunk.col(PlayerControl);
      const dash = chunk.col(PlayerDashState);
      moveX = control.moveX[0] ?? 0;
      dashing = dash.active[0] !== 0;
      dashDirection = dash.direction[0] === 0 ? 'Left' : 'Right';
      dashReady = dash.cooldownStepsRemaining[0] === 0;
      break;
    }

    ctx.set(GameplayPresentation, {
      phase: ctx.get(GameState).phase,
      moveX: moveX < 0 ? 'Left' : moveX > 0 ? 'Right' : 'Neutral',
      dashing,
      dashDirection,
      dashReady,
    });
  },
});
