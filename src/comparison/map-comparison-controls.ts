import { ActionState, defineSystem, query, read, write } from '@gameengine/runtime';
import { GameState, GameFeelComparison } from '../schema.gen.ts';
import { comparisonIntent } from './comparison-model.ts';

/** Presentation shortcuts consume press edges; holding a shortcut never replays it on resume. */
export const MapComparisonControls = defineSystem({
  name: 'MapComparisonControls', stage: 'LateUpdate', after: ['ApplyComparison'], before: ['ComparisonUI', 'DriveShotFeedback', 'DriveCameraFeedback', 'DriveCombatEffects', 'DriveWaterSplash', 'DriveEnemyDamagePresentation', 'DriveGameplayAudio'],
  query: query(read(ActionState)), resources: [read(GameState), write(GameFeelComparison)],
  runIf: { any: [{ changed: ActionState }, { changed: GameState }] },
  run(ctx, actions) {
    const state = ctx.get(GameFeelComparison);
    if (!ctx.is(GameState, 'phase', 'Playing')) {
      if (state.open) ctx.setField(GameFeelComparison, 'open', false);
      return;
    }
    if (!state.initialized || state.exposure === 'hidden') return;
    for (const c of actions.chunks()) for (let i = 0; i < c.length; i++) {
      if (!c.col(ActionState).justPressed[i]) continue;
      const action = c.is(ActionState, i, 'name', 'feelToggle') ? state.open ? 'close' : 'open'
        : c.is(ActionState, i, 'name', 'feelBaseline') ? 'baseline'
        : c.is(ActionState, i, 'name', 'feelPolished') ? 'polished' : '';
      if (!action) continue;
      const patch = comparisonIntent(ctx.get(GameFeelComparison), action);
      for (const key of Object.keys(patch) as (keyof typeof patch)[]) {
        const value = patch[key]!;
        if (!ctx.is(GameFeelComparison, key, value)) ctx.setField(GameFeelComparison, key, value);
      }
    }
  },
});
