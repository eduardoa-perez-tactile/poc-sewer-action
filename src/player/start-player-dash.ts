import { defineSystem, query, read, write } from '@gameengine/runtime';
import { GameState, Player, PlayerControl, PlayerDashState, PlayerMotion, PlayerStepInput } from '../schema.gen.ts';

export const StartPlayerDash = defineSystem({
  name: 'StartPlayerDash',
  after: ['CapturePlayerIntent'],
  before: ['MovePlayerVertically'],
  query: query(read(Player), read(PlayerControl), write(PlayerDashState), write(PlayerMotion)),
  resources: [read(GameState), read(PlayerStepInput)],
  runIf: [
    { resource: GameState, field: 'phase', value: 'Playing' },
    { resource: PlayerStepInput, field: 'dashRequested' },
  ],
  run(ctx, players) {
    for (const chunk of players.chunks()) {
      const config = chunk.col(Player);
      const control = chunk.col(PlayerControl);
      const dash = chunk.col(PlayerDashState);
      const motion = chunk.col(PlayerMotion);

      for (let row = 0; row < chunk.length; row++) {
        if (dash.active[row] !== 0 || dash.cooldownStepsRemaining[row]! > 0) continue;

        const moveX = control.moveX[row]!;
        const direction = moveX < 0 ? 0 : moveX > 0 ? 1 : motion.facing[row]!;
        const duration = config.dashDurationSteps[row]!;
        if (duration === 0) continue;

        dash.active[row] = 1;
        dash.direction[row] = direction;
        dash.activeStepsRemaining[row] = duration;
        dash.cooldownStepsRemaining[row] = config.dashCooldownSteps[row]!;
        dash.controlLockStepsRemaining[row] = duration + config.dashControlLockSteps[row]!;
        motion.facing[row] = direction;
      }
    }
  },
});
