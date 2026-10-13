import { defineSystem, loadData, read, write } from '@gameengine/runtime';
import { ComparisonDef, ComparisonRequested, GameFeelComparison, GameState } from '../schema.gen.ts';
import { comparisonIntent } from './comparison-model.ts';

export const ApplyComparison = defineSystem({
  name: 'ApplyComparison', stage: 'LateUpdate',
  before: ['ComparisonUI', 'DriveCameraFeedback', 'DriveShotFeedback', 'DriveCombatEffects', 'DriveWaterSplash', 'DriveEnemyDamagePresentation', 'DriveGameplayAudio'],
  resources: [read(GameState), write(GameFeelComparison)], events: [ComparisonRequested],
  runIf: { any: [{ resource: GameFeelComparison, field: 'initialized', value: false }, { event: ComparisonRequested }] },
  run(ctx) {
    if (!ctx.is(GameFeelComparison, 'initialized', true)) {
      const config = loadData(ComparisonDef, ctx.get(GameFeelComparison).config!);
      ctx.set(GameFeelComparison, { exposure: config.exposure, shake: config.shake, recoil: config.recoil, particles: config.particles, flashes: config.flashes, audio: config.audio, initialized: true });
    }
    if (!ctx.is(GameState, 'phase', 'Playing')) return;
    ctx.events.forEach(ComparisonRequested, (request) => {
      // Requests set the desired state, so retained UI events are idempotent.
      const patch = comparisonIntent(ctx.get(GameFeelComparison), String(request.action), request.enabled);
      for (const key of Object.keys(patch) as (keyof typeof patch)[]) {
        const value = patch[key]!;
        if (!ctx.is(GameFeelComparison, key, value)) ctx.setField(GameFeelComparison, key, value);
      }
    });
  },
});
