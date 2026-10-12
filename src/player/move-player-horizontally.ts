import { defineSystem, LocalTransform, query, read, write } from '@gameengine/runtime';
import { GameState, Player, PlayerControl, PlayerMotion } from '../schema.gen.ts';

const moveTowards = (current: number, target: number, maxDelta: number): number => {
  if (current < target) return current + maxDelta < target ? current + maxDelta : target;
  if (current > target) return current - maxDelta > target ? current - maxDelta : target;
  return target;
};

export const MovePlayerHorizontally = defineSystem({
  name: 'MovePlayerHorizontally',
  after: ['CapturePlayerIntent'],
  query: query(read(Player), read(PlayerControl), write(PlayerMotion), write(LocalTransform)),
  resources: [read(GameState)],
  runIf: { resource: GameState, field: 'phase', value: 'Playing' },
  run(ctx, players) {
    for (const chunk of players.chunks()) {
      const config = chunk.col(Player);
      const control = chunk.col(PlayerControl);
      const motion = chunk.col(PlayerMotion);
      const position = chunk.col(LocalTransform).position;

      for (let row = 0; row < chunk.length; row++) {
        const input = control.moveX[row]!;
        const velocity = motion.horizontalVelocity[row]!;
        const targetVelocity = input * config.maxHorizontalSpeed[row]!;
        const grounded = motion.grounded[row] !== 0;
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
        position[row * 3] = position[row * 3]! + nextVelocity * ctx.dt;
      }
    }
  },
});
