import { defineSystem, read, write } from '@gameengine/runtime';
import { AudioCue, CameraFeedback, GameFeelComparison, GameplayPresentation, RestartRequested, ShotFeedbackState } from '../schema.gen.ts';
import { bumpCamera, shakeCamera } from '../presentation/drive-camera-feedback.ts';

export const DriveShotFeedback = defineSystem({
  name: 'DriveShotFeedback', stage: 'LateUpdate', before: ['DriveCameraFeedback'],
  resources: [read(GameFeelComparison), read(GameplayPresentation), write(CameraFeedback), write(ShotFeedbackState)],
  runOn: [AudioCue, RestartRequested],
  run(ctx) {
    if (ctx.events.count(RestartRequested)) { ctx.setField(ShotFeedbackState, 'lastStep', ctx.step); return; }
    ctx.events.forEach(AudioCue, (cue) => {
      if (cue.kind !== 'Shot' || cue.step <= ctx.resource(ShotFeedbackState).lastStep[0]!) return;
      ctx.setField(ShotFeedbackState, 'lastStep', cue.step);
      if (ctx.is(GameFeelComparison, 'recoil', true)) bumpCamera(ctx, ctx.is(GameplayPresentation, 'playerFacing', 'Left') ? 0.035 : -0.035, 0);
      if (ctx.is(GameFeelComparison, 'shake', true)) shakeCamera(ctx, 0.022, 0.075);
    });
  },
});
