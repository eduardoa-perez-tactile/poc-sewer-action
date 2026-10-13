import { added, defineSystem, query, read, write } from '@gameengine/runtime';
import { CameraFeedback, CameraFollowState, RoomCameraBounds, SessionRoom } from '../schema.gen.ts';
export const InitializeSessionLook = defineSystem({
  name: 'InitializeSessionLook', stage: 'LateUpdate', before: ['FollowPlayerCamera', 'DriveCameraFeedback'],
  query: query(read(SessionRoom)), resources: [write(RoomCameraBounds), write(CameraFollowState), write(CameraFeedback)],
  runIf: { query: query(added(SessionRoom)) },
  run(ctx, rooms) {
    for (const c of rooms.chunks()) for (let i = 0; i < c.length; i++) ctx.set(RoomCameraBounds, c.get(SessionRoom, i));
    ctx.set(CameraFollowState, { center: [0, 0], target: [0, 0], lookAhead: 0, settled: false });
    ctx.set(CameraFeedback, { active: false, bump: [0, 0], shake: 0, shakeTime: 0 });
  },
});
