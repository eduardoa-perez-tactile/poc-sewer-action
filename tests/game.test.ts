import { expect, worldTest } from '@gameengine/test';
import { WorldView } from '@gameengine/runtime';
import { GameState, GameplayPresentation, Player, PlayerControl, PlayerIntent } from '../src/schema.gen.ts';

worldTest('boots the sewer action vertical slice', async ({ world, step, input }) => {
  input.view(1920, 1080, 1);
  await step(2);

  expect(world.resource(GameState).initialized).toBe(true);
  expect(world.resource(GameState).phase).toBe('Playing');
  expect(world.entities(Player).length).toBe(1);

  const view = world.resource(WorldView);
  expect(view.designAspect).toBeCloseTo(16 / 9);
  expect(view.fit).toBe('Contain');
});

worldTest('recorded player intent becomes simulation state and a presentation snapshot', async ({ world, step, input }) => {
  input.view(1920, 1080, 1);
  await step(1);

  input.emit(PlayerIntent, { moveX: -0.75, jump: true, dash: false, fire: true });
  await step(1);

  const [player] = world.entities(Player);
  expect(player).toBeDefined();
  expect(world.get(player!, PlayerControl)).toEqual({ moveX: -0.75 });
  expect(world.resource(GameplayPresentation)).toEqual({ phase: 'Playing', moveX: 'Left' });
});

worldTest('the latest recorded intent wins deterministically within a step', async ({ world, step, input }) => {
  input.emit(PlayerIntent, { moveX: -1, jump: true, dash: false, fire: false });
  input.emit(PlayerIntent, { moveX: 1, jump: false, dash: true, fire: true });
  await step(1);

  const [player] = world.entities(Player);
  expect(world.get(player!, PlayerControl)).toEqual({ moveX: 1 });
});
