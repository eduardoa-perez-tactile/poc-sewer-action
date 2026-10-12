import { defineSystem, LocalTransform, query, read, write } from '@gameengine/runtime';
import { GameState, GameplayPresentation, Player, PlayerControl, PlayerDashState, PlayerMotion } from '../schema.gen.ts';

export const BuildGameplayPresentation = defineSystem({
  name: 'BuildGameplayPresentation',
  stage: 'LateUpdate',
  query: query(read(Player), read(PlayerControl), read(PlayerDashState), read(PlayerMotion), read(LocalTransform)),
  resources: [read(GameState), write(GameplayPresentation)],
  skipUnchanged: true,
  run(ctx, players) {
    let moveX = 0;
    let dashing = false;
    let dashDirection: 'Left' | 'Right' = 'Right';
    let dashReady = true;
    let playerPosition: [number, number] = [0, 0];
    let playerVelocity: [number, number] = [0, 0];
    let playerFacing: 'Left' | 'Right' = 'Right';

    for (const chunk of players.chunks()) {
      if (chunk.length === 0) continue;
      const control = chunk.col(PlayerControl);
      const dash = chunk.col(PlayerDashState);
      const motion = chunk.col(PlayerMotion);
      const transform = chunk.col(LocalTransform);
      moveX = control.moveX[0] ?? 0;
      dashing = dash.active[0] !== 0;
      dashDirection = dash.direction[0] === 0 ? 'Left' : 'Right';
      dashReady = dash.cooldownStepsRemaining[0] === 0;
      playerPosition = [transform.position[0]!, transform.position[1]!];
      playerVelocity = [motion.horizontalVelocity[0]!, motion.verticalVelocity[0]!];
      playerFacing = motion.facing[0] === 0 ? 'Left' : 'Right';
      break;
    }

    ctx.set(GameplayPresentation, {
      phase: ctx.get(GameState).phase,
      moveX: moveX < 0 ? 'Left' : moveX > 0 ? 'Right' : 'Neutral',
      dashing,
      dashDirection,
      dashReady,
      playerPosition,
      playerVelocity,
      playerFacing,
    });
  },
});
