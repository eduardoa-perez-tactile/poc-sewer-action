import { defineSystem, query, read, write } from '@gameengine/runtime';
import { GameState, Player, PlayerControl, PlayerDashState, PlayerMotion } from '../schema.gen.ts';

const moveTowards = (current: number, target: number, maxDelta: number): number => {
  if (current < target) return current + maxDelta < target ? current + maxDelta : target;
  if (current > target) return current - maxDelta > target ? current - maxDelta : target;
  return target;
};

export const MovePlayerHorizontally = defineSystem({
  name: 'MovePlayerHorizontally',
  after: ['MovePlayerVertically'],
  query: query(read(Player), read(PlayerControl), read(PlayerDashState), write(PlayerMotion)),
  resources: [read(GameState)],
  runIf: { resource: GameState, field: 'phase', value: 'Playing' },
  run(ctx, players) {
    for (const chunk of players.chunks()) {
      const config = chunk.col(Player);
      const control = chunk.col(PlayerControl);
      const dash = chunk.col(PlayerDashState);
      const motion = chunk.col(PlayerMotion);

      for (let row = 0; row < chunk.length; row++) {
        if (dash.active[row] !== 0) {
          const direction = dash.direction[row] === 0 ? -1 : 1;
          const dashVelocity = direction * config.dashSpeed[row]!;
          motion.horizontalVelocity[row] = dashVelocity;
          motion.facing[row] = dash.direction[row]!;
          continue;
        }

        if (dash.controlLockStepsRemaining[row]! > 0) {
          continue;
        }

        const input = control.moveX[row]!;
        const velocity = motion.horizontalVelocity[row]!;
        const targetVelocity = input * config.maxHorizontalSpeed[row]!;
        const grounded = motion.groundedForMovement[row] !== 0;
        const reversing = input !== 0 && velocity !== 0 && (input < 0) !== (velocity < 0);
        const rate = grounded
          ? input === 0 || reversing
            ? config.groundDeceleration[row]!
            : config.groundAcceleration[row]!
          : input === 0 || reversing
            ? config.airDeceleration[row]!
            : config.airAcceleration[row]!;
        const nextVelocity = moveTowards(velocity, targetVelocity, rate * ctx.dt);

        motion.horizontalVelocity[row] = nextVelocity;
        if (input < 0) motion.facing[row] = 0;
        else if (input > 0) motion.facing[row] = 1;
      }
    }
  },
});
