import { defineSystem, write, WorldView } from '@gameengine/runtime';
import { GameState } from '../schema.gen.ts';

const VIEW_HEIGHT = 10;

export const SetupGame = defineSystem({
  name: 'SetupGame',
  resources: [write(GameState), write(WorldView)],
  runIf: { resource: GameState, field: 'initialized', value: false },
  run(ctx) {
    ctx.set(GameState, { initialized: true, phase: 'Playing' });

    const view = ctx.get(WorldView);
    if (view.orthoSize !== VIEW_HEIGHT / 2 || view.designAspect !== 16 / 9 || view.fit !== 'Contain') {
      ctx.set(WorldView, { center: [0, 0], orthoSize: VIEW_HEIGHT / 2, designAspect: 16 / 9, fit: 'Contain' });
    }
  },
});
