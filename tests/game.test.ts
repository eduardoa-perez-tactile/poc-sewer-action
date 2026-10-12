import { expect, worldTest } from '@gameengine/test';
import { ActionState, WorldView } from '@gameengine/runtime';
import {
  GameState,
  GameplayPresentation,
  MenuIntent,
  Player,
  PlayerActionState,
  PlayerControl,
  PlayerIntent,
} from '../src/schema.gen.ts';

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

  input.emit(PlayerIntent, { moveX: -0.75, jump: true, dash: false, fire: true, crouch: true });
  await step(1);

  const [player] = world.entities(Player);
  expect(player).toBeDefined();
  expect(world.get(player!, PlayerControl)).toEqual({ moveX: -0.75, crouch: true });
  expect(world.resource(GameplayPresentation)).toEqual({ phase: 'Playing', moveX: 'Left' });

  await step(1);
  expect(world.get(player!, PlayerControl)).toEqual({ moveX: 0, crouch: false });
});

worldTest('the latest recorded intent wins deterministically within a step', async ({ world, step, input }) => {
  input.emit(PlayerIntent, { moveX: -1, jump: true, dash: false, fire: false, crouch: true });
  input.emit(PlayerIntent, { moveX: 1, jump: false, dash: true, fire: true, crouch: false });
  await step(1);

  const [player] = world.entities(Player);
  expect(world.get(player!, PlayerControl)).toEqual({ moveX: 1, crouch: false });
});

worldTest('mapped actions enter the simulation through the recorded input stream', async ({ world, step, input }) => {
  input.action('moveX', -0.625);
  input.action('crouch', 1);
  input.action('jump', 1);
  input.action('dash', 1);
  input.action('shoot', 1);
  input.action('pause', 1);
  input.action('menuX', -1);
  input.action('menuY', 1);
  input.action('menuConfirm', 1);
  input.action('menuBack', 1);
  await step(1);

  const [player] = world.entities(Player);
  expect(world.get(player!, PlayerControl)).toEqual({ moveX: -0.625, crouch: true });
  expect(world.resource(PlayerActionState)).toEqual({ moveX: -0.625, jump: true, dash: true, fire: true, crouch: true });
  expect(world.events(MenuIntent)).toEqual([{ moveX: -1, moveY: 1, confirm: true, back: true, pause: true }]);

  const actions = world.entities(ActionState).map((entity) => world.get(entity, ActionState));
  expect(actions.find((action) => action.name === 'jump')?.justPressed).toBe(true);

  await step(1);
  expect(world.resource(PlayerActionState)).toEqual({ moveX: 0, jump: false, dash: false, fire: false, crouch: false });
  expect(world.events(MenuIntent)).toEqual([{ moveX: 0, moveY: 0, confirm: false, back: false, pause: false }]);
});

worldTest('released actions clear held controls without becoming stuck', async ({ world, step, input }) => {
  input.action('moveX', 1);
  input.action('crouch', 1);
  await step(1);

  input.action('moveX', 0);
  input.action('crouch', 0);
  await step(1);

  const [player] = world.entities(Player);
  expect(world.get(player!, PlayerControl)).toEqual({ moveX: 0, crouch: false });
});
