import { defineSystem, query, read, write } from '@gameengine/runtime';
import { Player, PlayerActionState, PlayerControl, PlayerIntent } from '../schema.gen.ts';

export const CapturePlayerIntent = defineSystem({
  name: 'CapturePlayerIntent',
  stage: 'PreUpdate',
  after: ['MapInputActions'],
  query: query(read(Player), write(PlayerControl)),
  resources: [read(PlayerActionState)],
  events: [PlayerIntent],
  run(ctx, players) {
    const mapped = ctx.get(PlayerActionState);
    let moveX = mapped.moveX;
    let crouch = mapped.crouch;
    ctx.events.forEach(PlayerIntent, (intent) => {
      moveX = intent.moveX;
      crouch = intent.crouch;
    });

    for (const chunk of players.chunks()) {
      const control = chunk.col(PlayerControl);
      for (let row = 0; row < chunk.length; row++) {
        control.moveX[row] = moveX;
        control.crouch[row] = crouch ? 1 : 0;
      }
    }
  },
});
