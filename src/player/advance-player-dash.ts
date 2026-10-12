import { defineSystem, query, read, write } from '@gameengine/runtime';
import { GameState, Player, PlayerDashState, PlayerMotion } from '../schema.gen.ts';

export const AdvancePlayerDash = defineSystem({
  name: 'AdvancePlayerDash',
  after: ['MovePlayerHorizontally'],
  query: query(read(Player), write(PlayerDashState), write(PlayerMotion)),
  resources: [read(GameState)],
  runIf: { resource: GameState, field: 'phase', value: 'Playing' },
  run(_ctx, players) {
    for (const chunk of players.chunks()) {
      const config = chunk.col(Player);
      const dash = chunk.col(PlayerDashState);
      const motion = chunk.col(PlayerMotion);

      for (let row = 0; row < chunk.length; row++) {
        const activeSteps = dash.activeStepsRemaining[row]!;
        if (activeSteps > 0) {
          const remaining = activeSteps - 1;
          dash.activeStepsRemaining[row] = remaining;
          if (remaining === 0) {
            dash.active[row] = 0;
            const direction = dash.direction[row] === 0 ? -1 : 1;
            motion.horizontalVelocity[row] = direction * config.maxHorizontalSpeed[row]!;
          }
        }

        const cooldown = dash.cooldownStepsRemaining[row]!;
        if (cooldown > 0) dash.cooldownStepsRemaining[row] = cooldown - 1;

        const controlLock = dash.controlLockStepsRemaining[row]!;
        if (controlLock > 0) dash.controlLockStepsRemaining[row] = controlLock - 1;
      }
    }
  },
});
