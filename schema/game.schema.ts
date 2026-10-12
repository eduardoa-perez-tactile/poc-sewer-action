import { bool, component, f32, resource } from '@gameengine/schema';

export const GameState = resource(
  'GameState',
  { initialized: bool({ default: false, doc: 'The deterministic game bootstrap has run.' }) },
  { sim: true },
);

export const Player = component(
  'Player',
  {
    moveSpeed: f32({ default: 8.5, doc: 'Maximum horizontal movement speed.' }),
    jumpSpeed: f32({ default: 9.2, doc: 'Initial vertical jump speed.' }),
  },
  { sim: true },
);
