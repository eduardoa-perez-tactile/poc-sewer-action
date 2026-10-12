import { defineSystem, write, WorldView } from '@gameengine/runtime';
import { GameState } from './schema.gen.ts';

const VIEW_HEIGHT = 10;

export const SetupGame = defineSystem({
  name: 'SetupGame',
  resources: [write(GameState), write(WorldView)],
  run(ctx) {
    if (!ctx.get(GameState).initialized) ctx.set(GameState, { initialized: true });

    const view = ctx.get(WorldView);
    if (view.orthoSize !== VIEW_HEIGHT / 2 || view.designAspect !== 16 / 9) {
      ctx.set(WorldView, {
        center: [0, 0],
        orthoSize: VIEW_HEIGHT / 2,
        designAspect: 16 / 9,
        fit: 'Contain',
      });
    }
  },
});
