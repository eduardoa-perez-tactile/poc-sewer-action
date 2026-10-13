import { defineSystem, query, read, without } from '@gameengine/runtime';
import { GameState, LevelProgress, MenuIntent, RestartRequested, SessionFlow } from '../schema.gen.ts';

/** Reuse recorded keyboard/gamepad confirmation to recover from a level death. */
export const RequestCheckpointRestart = defineSystem({
  name: 'RequestCheckpointRestart', after: ['MapInputActions'], before: ['ResolveWaterContact', 'RestartGame'],
  query: query(read(LevelProgress), without(SessionFlow)), resources: [read(GameState)],
  events: [MenuIntent], runOn: [MenuIntent],
  runIf: [{ resource: GameState, field: 'phase', value: 'PlayerDead' }, { query: query(read(LevelProgress), without(SessionFlow)) }],
  run(ctx) {
    ctx.events.forEach(MenuIntent, intent => {
      if (intent.confirm) ctx.events.emit(RestartRequested, {});
    });
  },
});
