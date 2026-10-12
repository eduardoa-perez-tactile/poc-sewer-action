import { expect, worldTest } from '@gameengine/test';
import { WorldView } from '@gameengine/runtime';
import { GameState, Player } from '../src/schema.gen.ts';

worldTest('boots the sewer action vertical slice', async ({ world, step, input }) => {
  input.view(1920, 1080, 1);
  await step(2);

  expect(world.resource(GameState).initialized).toBe(true);
  expect(world.entities(Player).length).toBe(1);

  const view = world.resource(WorldView);
  expect(view.designAspect).toBeCloseTo(16 / 9);
  expect(view.fit).toBe('Contain');
});
