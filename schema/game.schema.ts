import { bool, component, enumOf, resource, u32 } from '@gameengine/schema';

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
    dashing: bool({ default: false, doc: 'Presentation-readable active dash flag derived from simulation state.' }),
    dashDirection: enumOf('PresentationDashDirection', ['Left', 'Right'], {
      default: 'Right',
      doc: 'Presentation-readable dash direction for animation and effects.',
    }),
    dashReady: bool({ default: true, doc: 'Whether the deterministic dash cooldown has completed.' }),
  },
  { sim: false, doc: 'Read-only presentation snapshot derived from consequential simulation state.' },
);

export const RoomLandmark = component(
  'RoomLandmark',
  {
    kind: enumOf('RoomLandmarkKind', ['Encounter', 'WaterEdge', 'Exit'], {
      default: 'Encounter',
      doc: 'Authored room landmark used by later gameplay tickets and content verification.',
    }),
  },
  { sim: true, doc: 'A deterministic marker placed in the room scene without duplicating collision geometry.' },
);

export const RoomCollisionState = resource(
  'RoomCollisionState',
  {
    built: bool({ default: false, doc: 'Whether the current room tilemap has queued its static collision cells.' }),
    cellCount: u32({ default: 0, doc: 'Expected derived cell count; confirms deferred spawns are visible before play begins.' }),
  },
  { sim: true, doc: 'One-shot deterministic bootstrap state for tilemap-derived collision.' },
);
