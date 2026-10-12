import { Camera, defineSystem, query, read, RenderTime, VisualOffset, write } from '@gameengine/runtime';
import type { SystemContext } from '@gameengine/runtime';
import { CameraFeedback, CameraFollowState } from '../schema.gen.ts';

const BUMP_DECAY = 0.72;
const SETTLE_EPSILON = 0.001;

type PresentationContext = Pick<SystemContext, 'get' | 'set'>;

export function bumpCamera(ctx: PresentationContext, x: number, y: number): void {
  const feedback = ctx.get(CameraFeedback);
  ctx.set(CameraFeedback, { active: true, bump: [feedback.bump[0] + x, feedback.bump[1] + y] });
}

export function shakeCamera(ctx: PresentationContext, strength: number, seconds: number): void {
  const feedback = ctx.get(CameraFeedback);
  ctx.set(CameraFeedback, { active: true, shake: Math.max(feedback.shake, strength), shakeTime: Math.max(feedback.shakeTime, seconds) });
}

export const DriveCameraFeedback = defineSystem({
  name: 'DriveCameraFeedback',
  stage: 'LateUpdate',
  after: ['FollowPlayerCamera'],
  query: query(read(Camera), write(VisualOffset)),
  resources: [write(CameraFeedback), read(CameraFollowState), read(RenderTime)],
  runIf: { any: [{ changed: CameraFollowState }, { changed: CameraFeedback }, { resource: CameraFeedback, field: 'active', value: true }] },
  run(ctx, cameras) {
    const feedback = ctx.get(CameraFeedback);
    const follow = ctx.get(CameraFollowState);
    const dt = Math.min(ctx.get(RenderTime).realDelta, 1 / 15);
    const shakeTime = Math.max(0, feedback.shakeTime - dt);
    const shakeScale = feedback.shakeTime > 0 ? shakeTime / feedback.shakeTime : 0;
    const phase = ctx.get(RenderTime).frame;
    const shakeX = shakeTime > 0 ? Math.sin(phase * 2.399) * feedback.shake * shakeScale : 0;
    const shakeY = shakeTime > 0 ? Math.sin(phase * 3.883) * feedback.shake * shakeScale : 0;
    const bumpX = Math.abs(feedback.bump[0]) <= SETTLE_EPSILON ? 0 : feedback.bump[0] * BUMP_DECAY;
    const bumpY = Math.abs(feedback.bump[1]) <= SETTLE_EPSILON ? 0 : feedback.bump[1] * BUMP_DECAY;

    for (const chunk of cameras.chunks()) {
      const offset = chunk.col(VisualOffset);
      for (let row = 0; row < chunk.length; row++) {
        const x = follow.center[0] + bumpX + shakeX;
        const y = follow.center[1] + bumpY + shakeY;
        if (offset.position[row * 3] !== x) offset.position[row * 3] = x;
        if (offset.position[row * 3 + 1] !== y) offset.position[row * 3 + 1] = y;
      }
    }
    const active = bumpX !== 0 || bumpY !== 0 || shakeTime !== 0;
    if (
      feedback.active !== active || feedback.bump[0] !== bumpX || feedback.bump[1] !== bumpY || feedback.shakeTime !== shakeTime ||
      (shakeTime === 0 && feedback.shake !== 0)
    ) {
      ctx.set(CameraFeedback, { active, bump: [bumpX, bumpY], shake: shakeTime === 0 ? 0 : feedback.shake, shakeTime });
    }
  },
});
