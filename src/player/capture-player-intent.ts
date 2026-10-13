import { defineSystem, query, read, write } from '@gameengine/runtime';
import { GameState, Player, PlayerActionState, PlayerControl, PlayerIntent, PlayerStepInput } from '../schema.gen.ts';

export const CapturePlayerIntent = defineSystem({
  name: 'CapturePlayerIntent',
  stage: 'PreUpdate',
  after: ['MapInputActions'],
  query: query(read(Player), write(PlayerControl)),
  resources: [read(GameState), read(PlayerActionState), write(PlayerStepInput)],
  events: [PlayerIntent],
  runIf: [
    { resource: GameState, field: 'phase', op: '!=', value: 'Title' },
    { resource: GameState, field: 'phase', op: '!=', value: 'Paused' },
    { resource: GameState, field: 'phase', op: '!=', value: 'PlayerDead' },
    { resource: GameState, field: 'phase', op: '!=', value: 'Completed' },
  ],
  run(ctx, players) {
    const mapped = ctx.get(PlayerActionState);
    let moveX = mapped.moveX;
    let crouch = mapped.crouch;
    let jumpPressed = mapped.jump;
    let jumpHeld = mapped.jumpHeld;
    let dashPressed = mapped.dash;
    ctx.events.forEach(PlayerIntent, (intent) => {
      moveX = intent.moveX;
      crouch = intent.crouch;
      jumpPressed = intent.jump;
      jumpHeld = intent.jumpHeld;
      dashPressed = intent.dash;
    });
    ctx.setField(PlayerStepInput, 'jumpRequested', jumpPressed);
    ctx.setField(PlayerStepInput, 'dashRequested', dashPressed);

    for (const chunk of players.chunks()) {
      const control = chunk.col(PlayerControl);
      for (let row = 0; row < chunk.length; row++) {
        control.moveX[row] = moveX;
        control.crouch[row] = crouch ? 1 : 0;
        control.jumpHeld[row] = jumpHeld ? 1 : 0;
      }
    }
  },
});
