import { defineSystem, read, write } from '@gameengine/runtime';
import { GameState, PlayerActionState, PointerControlState } from '../schema.gen.ts';

/** Recorded, UI-filtered mouse input shares the existing keyboard intent path. */
export const MapPointerControls = defineSystem({
  name: 'MapPointerControls', stage: 'PreUpdate', after: ['MapInputActions', 'AdvanceSessionFlow'], before: ['CapturePlayerIntent'],
  resources: [read(GameState), write(PlayerActionState), write(PointerControlState)],
  runIf: { any: [{ resource: GameState, field: 'phase', value: 'Playing' }, { changed: GameState }, { resource: PointerControlState, field: 'playing', value: true }] },
  run(ctx) {
    const playing = ctx.is(GameState, 'phase', 'Playing');
    const state = ctx.resource(PointerControlState);
    const wasPlaying = state.playing[0] !== 0;
    if (!playing) {
      if (state.fire[0]) ctx.setField(PointerControlState, 'fire', false);
      if (state.jumpHeld[0]) ctx.setField(PointerControlState, 'jumpHeld', false);
      if (wasPlaying) ctx.setField(PointerControlState, 'playing', false);
      return;
    }
    let fire = wasPlaying && state.fire[0] !== 0;
    let jumpHeld = wasPlaying && state.jumpHeld[0] !== 0;
    let jump = false;
    for (const event of ctx.input) {
      if (event.type !== 'pointer') continue;
      if (event.phase === 'cancel') { fire = false; jumpHeld = false; continue; }
      if (event.button === 0 && event.phase !== 'move') fire = event.phase === 'down';
      if (event.button === 1 && event.phase !== 'move') {
        jump = jump || (event.phase === 'down' && !jumpHeld);
        jumpHeld = event.phase === 'down';
      }
    }
    if ((state.fire[0] !== 0) !== fire) ctx.setField(PointerControlState, 'fire', fire);
    if ((state.jumpHeld[0] !== 0) !== jumpHeld) ctx.setField(PointerControlState, 'jumpHeld', jumpHeld);
    if (!wasPlaying) ctx.setField(PointerControlState, 'playing', true);
    const mapped = ctx.resource(PlayerActionState);
    if (fire) ctx.setField(PlayerActionState, 'fire', true);
    if (jumpHeld) ctx.setField(PlayerActionState, 'jumpHeld', true);
    if (jump && !mapped.jump[0]) ctx.setField(PlayerActionState, 'jump', true);
  },
});
