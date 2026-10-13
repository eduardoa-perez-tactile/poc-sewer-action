import { defineSystem, read, write } from '@gameengine/runtime';
import { AudioCue, CameraConsequenceState, CameraFeedback, CombatEffect, GameFeelComparison, GameplayPresentation, RestartRequested, ShotFeedbackState } from '../schema.gen.ts';
import { bumpCamera, shakeCamera } from '../presentation/drive-camera-feedback.ts';

export const DriveShotFeedback = defineSystem({
  name: 'DriveShotFeedback', stage: 'LateUpdate', before: ['DriveCameraFeedback'],
  resources: [read(GameFeelComparison), read(GameplayPresentation), write(CameraFeedback), write(ShotFeedbackState), write(CameraConsequenceState)],
  runOn: [AudioCue, CombatEffect, RestartRequested],
  run(ctx) {
    if (ctx.events.count(RestartRequested)) {
      ctx.setField(ShotFeedbackState, 'lastStep', ctx.step);
      ctx.setField(CameraConsequenceState, 'lastExplosionStep', ctx.step);
      ctx.setField(CameraConsequenceState, 'lastDeathStep', ctx.step);
      ctx.set(CameraFeedback, { active: false, bump: [0, 0], shake: 0, shakeTime: 0 });
      return;
    }
    const deathStep = ctx.resource(CameraConsequenceState).lastDeathStep[0]!;
    ctx.events.forEach(AudioCue, (cue) => {
      if ((cue.kind === 'PlayerDeath' || cue.kind === 'EnemyDeath') && cue.step > deathStep) {
        ctx.setField(CameraConsequenceState, 'lastDeathStep', cue.step);
        if (ctx.is(GameFeelComparison, 'shake', true)) shakeCamera(ctx, cue.kind === 'PlayerDeath' ? 0.15 : 0.055, cue.kind === 'PlayerDeath' ? 0.3 : 0.12);
      }
      if (cue.kind !== 'Shot' || cue.step <= ctx.resource(ShotFeedbackState).lastStep[0]!) return;
      ctx.setField(ShotFeedbackState, 'lastStep', cue.step);
      if (ctx.is(GameFeelComparison, 'recoil', true)) bumpCamera(ctx, ctx.is(GameplayPresentation, 'playerFacing', 'Left') ? 0.035 : -0.035, 0);
      if (ctx.is(GameFeelComparison, 'shake', true)) shakeCamera(ctx, 0.022, 0.075);
    });
    const explosionStep = ctx.resource(CameraConsequenceState).lastExplosionStep[0]!;
    ctx.events.forEach(CombatEffect, (effect) => {
      if (effect.kind !== 'explosion' || effect.step <= explosionStep) return;
      ctx.setField(CameraConsequenceState, 'lastExplosionStep', effect.step);
      const player = ctx.resource(GameplayPresentation).playerPosition;
      const distance = Math.abs(player[0]! - effect.position[0]) + Math.abs(player[1]! - effect.position[1]);
      const weight = Math.max(0, 1 - distance / 10);
      if (weight && ctx.is(GameFeelComparison, 'shake', true)) shakeCamera(ctx, 0.12 * weight, 0.2);
      if (weight && ctx.is(GameFeelComparison, 'recoil', true)) bumpCamera(ctx, 0, 0.04 * weight);
    });
  },
});
