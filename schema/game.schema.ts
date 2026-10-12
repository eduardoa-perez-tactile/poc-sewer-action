import { bool, enumOf, resource } from '@gameengine/schema';

const gamePhase = () =>
  enumOf('GamePhase', ['Booting', 'Playing', 'PlayerDead', 'Completed'], {
    default: 'Booting',
    doc: 'Authoritative vertical-slice phase.',
  });

export const GameState = resource(
  'GameState',
  {
    initialized: bool({ default: false, doc: 'The deterministic game bootstrap has run.' }),
    phase: gamePhase(),
  },
  { sim: true, doc: 'Simulation-owned level flow. Presentation may observe it but never advance it.' },
);

export const GameplayPresentation = resource(
  'GameplayPresentation',
  {
    phase: gamePhase(),
    moveX: enumOf('MoveDirection', ['Left', 'Neutral', 'Right'], { default: 'Neutral' }),
  },
  { sim: false, doc: 'Read-only presentation snapshot derived from consequential simulation state.' },
);
