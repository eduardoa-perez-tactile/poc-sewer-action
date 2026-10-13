import { defineSystem, query, read } from '@gameengine/runtime';
import { GameState, LevelProgress, MenuIntent, RestartRequested } from '../schema.gen.ts';

/** Reuse recorded keyboard/gamepad confirmation to recover from a level death. */
export const RequestCheckpointRestart = defineSystem({
  name: 'RequestCheckpointRestart', after: ['MapInputActions'], before: ['ResolveWaterContact', 'RestartGame'],
  query: query(read(LevelProgress)), resources: [read(GameState)],
  events: [MenuIntent], runOn: [MenuIntent],
  runIf: [{ resource: GameState, field: 'phase', value: 'PlayerDead' }, { query: query(read(LevelProgress)) }],
  run(ctx) {
    ctx.events.forEach(MenuIntent, intent => {
      if (intent.confirm) ctx.events.emit(RestartRequested, {});
    });
  },
});
