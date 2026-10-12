import { defineSystem, query, read, VisualOffset, write } from '@gameengine/runtime';
import { CameraFollowState, ParallaxLayer } from '../schema.gen.ts';

export const DriveParallaxLayers = defineSystem({
  name: 'DriveParallaxLayers',
  stage: 'LateUpdate',
  after: ['FollowPlayerCamera'],
  before: ['DriveCameraFeedback'],
  query: query(read(ParallaxLayer), write(VisualOffset)),
  resources: [read(CameraFollowState)],
  runIf: { changed: CameraFollowState },
  run(ctx, layers) {
    const camera = ctx.get(CameraFollowState).center;
    for (const chunk of layers.chunks()) {
      const parallax = chunk.col(ParallaxLayer);
      const offset = chunk.col(VisualOffset);
      for (let row = 0; row < chunk.length; row++) {
        const x = camera[0] * (1 - parallax.factor[row * 2]!);
        const y = camera[1] * (1 - parallax.factor[row * 2 + 1]!);
        if (offset.position[row * 3] !== x) offset.position[row * 3] = x;
        if (offset.position[row * 3 + 1] !== y) offset.position[row * 3 + 1] = y;
      }
    }
  },
});
