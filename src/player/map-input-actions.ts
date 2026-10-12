import { ActionState, defineSystem, query, read, write } from '@gameengine/runtime';
import { MenuIntent, PlayerActionState } from '../schema.gen.ts';

interface ActionSnapshot {
  moveX: number;
  jump: boolean;
  dash: boolean;
  shoot: boolean;
  crouch: boolean;
  pause: boolean;
  menuX: number;
  menuY: number;
  menuConfirm: boolean;
  menuBack: boolean;
}

const reset = (actions: ActionSnapshot): void => {
  actions.moveX = 0;
  actions.jump = false;
  actions.dash = false;
  actions.shoot = false;
  actions.crouch = false;
  actions.pause = false;
  actions.menuX = 0;
  actions.menuY = 0;
  actions.menuConfirm = false;
  actions.menuBack = false;
};

export const MapInputActions = defineSystem({
  name: 'MapInputActions',
  stage: 'PreUpdate',
  query: query(read(ActionState)),
  resources: [write(PlayerActionState)],
  run(ctx, actionStates) {
    const actions: ActionSnapshot = {
      moveX: 0,
      jump: false,
      dash: false,
      shoot: false,
      crouch: false,
      pause: false,
      menuX: 0,
      menuY: 0,
      menuConfirm: false,
      menuBack: false,
    };
    reset(actions);

    for (const chunk of actionStates.chunks()) {
      const state = chunk.col(ActionState);
      for (let row = 0; row < chunk.length; row++) {
        if (chunk.is(ActionState, row, 'name', 'moveX')) actions.moveX = state.value[row]!;
        else if (chunk.is(ActionState, row, 'name', 'jump')) actions.jump = state.justPressed[row] !== 0;
        else if (chunk.is(ActionState, row, 'name', 'dash')) actions.dash = state.justPressed[row] !== 0;
        else if (chunk.is(ActionState, row, 'name', 'shoot')) actions.shoot = state.pressed[row] !== 0;
        else if (chunk.is(ActionState, row, 'name', 'crouch')) actions.crouch = state.pressed[row] !== 0;
        else if (chunk.is(ActionState, row, 'name', 'pause')) actions.pause = state.justPressed[row] !== 0;
        else if (chunk.is(ActionState, row, 'name', 'menuX')) actions.menuX = state.value[row]!;
        else if (chunk.is(ActionState, row, 'name', 'menuY')) actions.menuY = state.value[row]!;
        else if (chunk.is(ActionState, row, 'name', 'menuConfirm')) actions.menuConfirm = state.justPressed[row] !== 0;
        else if (chunk.is(ActionState, row, 'name', 'menuBack')) actions.menuBack = state.justPressed[row] !== 0;
      }
    }

    ctx.set(PlayerActionState, {
      moveX: actions.moveX,
      jump: actions.jump,
      dash: actions.dash,
      fire: actions.shoot,
      crouch: actions.crouch,
    });
    ctx.events.emit(MenuIntent, {
      moveX: actions.menuX,
      moveY: actions.menuY,
      confirm: actions.menuConfirm,
      back: actions.menuBack,
      pause: actions.pause,
    });
  },
});
