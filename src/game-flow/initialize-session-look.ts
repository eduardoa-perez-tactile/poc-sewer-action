import { added, defineSystem, query, read, write } from '@gameengine/runtime';
import { CameraConsequenceState, CameraFeedback, CameraFollowState, MotionEffectState, Player, PlayerFeelState, RoomCameraBounds, SessionRoom, ShotFeedbackState } from '../schema.gen.ts';
export const InitializeSessionLook = defineSystem({
  name: 'InitializeSessionLook', stage: 'LateUpdate', before: ['FollowPlayerCamera', 'DriveCameraFeedback', 'DrivePlayerAnimation', 'DrivePlayerMotionEffects', 'DriveShotFeedback'],
  query: query(read(SessionRoom)), resources: [write(RoomCameraBounds), write(CameraFollowState), write(CameraFeedback), write(PlayerFeelState), write(MotionEffectState), write(CameraConsequenceState), write(ShotFeedbackState)],
  runIf: { any: [{ query: query(added(SessionRoom)) }, { query: query(added(Player)) }] },
  run(ctx, rooms) {
    for (const c of rooms.chunks()) for (let i = 0; i < c.length; i++) ctx.set(RoomCameraBounds, c.get(SessionRoom, i));
    ctx.set(CameraFollowState, { center: [0, 0], target: [0, 0], lookAhead: 0, settled: false });
    ctx.set(CameraFeedback, { active: false, bump: [0, 0], shake: 0, shakeTime: 0 });
    ctx.set(PlayerFeelState, { initialized: false, active: false, grounded: false, previousHealth: 0, previousVerticalVelocity: 0, shotTime: 0, lastShotStep: ctx.step, takeoffTime: 0, landingTime: 0, landingStrength: 0 });
    ctx.set(MotionEffectState, { active: false, nextSlot: 0, sampleTime: 0, previousTakeoff: 0, previousLanding: 0 });
    ctx.set(CameraConsequenceState, { lastExplosionStep: ctx.step, lastDeathStep: ctx.step });
    ctx.setField(ShotFeedbackState, 'lastStep', ctx.step);
  },
});
