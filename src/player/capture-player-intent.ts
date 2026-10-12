import { defineSystem, query, read, write } from '@gameengine/runtime';
import { Player, PlayerControl, PlayerIntent } from '../schema.gen.ts';

export const CapturePlayerIntent = defineSystem({
  name: 'CapturePlayerIntent',
  stage: 'PreUpdate',
  query: query(read(Player), write(PlayerControl)),
  runOn: [PlayerIntent],
  run(ctx, players) {
    let moveX = 0;
    let received = false;
    ctx.events.forEach(PlayerIntent, (intent) => {
      moveX = intent.moveX;
      received = true;
    });
    if (!received) return;

    for (const chunk of players.chunks()) {
      const control = chunk.col(PlayerControl);
      for (let row = 0; row < chunk.length; row++) {
        control.moveX[row] = moveX;
      }
    }
  },
});
