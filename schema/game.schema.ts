import { bool, component, enumOf, f32, resource, u32, vec2 } from '@gameengine/schema';

const gamePhase = () =>
  enumOf('GamePhase', ['Booting', 'Playing', 'PlayerDead', 'Completed', 'Title', 'Paused'], {
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
    playerPosition: vec2({ default: [0, 0], doc: 'Latest authoritative player position copied for presentation systems.' }),
    playerVelocity: vec2({ default: [0, 0], doc: 'Latest authoritative player velocity copied for presentation systems.' }),
    playerFacing: enumOf('PresentationFacingDirection', ['Left', 'Right'], {
      default: 'Right',
      doc: 'Authoritative facing direction copied for presentation look-ahead and feedback.',
    }),
  },
  { sim: false, doc: 'Read-only presentation snapshot derived from consequential simulation state.' },
);

export const CameraFollowState = resource(
  'CameraFollowState',
  {
    center: vec2({ default: [0, 0], doc: 'Settled presentation camera center applied as a visual offset.' }),
    target: vec2({ default: [0, 0], doc: 'Bounded target after dead-zone and directional look-ahead.' }),
    lookAhead: f32({ default: 0, doc: 'Current horizontal look-ahead in world units.' }),
    settled: bool({ default: false, doc: 'True once the follow rig can stop rewriting camera state.' }),
  },
  { sim: false, doc: 'Presentation-owned camera state excluded from gameplay hashes and queries.' },
);

export const CameraFeedback = resource(
  'CameraFeedback',
  {
    active: bool({ default: false, doc: 'Whether transient feedback still needs presentation frames.' }),
    bump: vec2({ default: [0, 0], doc: 'Short presentation-only camera impulse requested by a feedback adapter.' }),
    shake: f32({ default: 0, min: 0, doc: 'Presentation-only shake strength; never visible to gameplay.' }),
    shakeTime: f32({ default: 0, min: 0, doc: 'Remaining presentation seconds for the current shake.' }),
  },
  { sim: false, doc: 'Transient camera feedback hooks consumed only by LateUpdate.' },
);

export const RoomCameraBounds = resource(
  'RoomCameraBounds',
  {
    left: f32({ default: -8, doc: 'Authored left edge of the room camera envelope.' }),
    right: f32({ default: 8, doc: 'Authored right edge of the room camera envelope.' }),
    bottom: f32({ default: -4.5, doc: 'Authored bottom edge of the room camera envelope.' }),
    top: f32({ default: 4.5, doc: 'Authored top edge of the room camera envelope.' }),
  },
  { sim: false, doc: 'Scene-authored presentation bounds for the active room camera.' },
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

export const ParallaxLayer = component(
  'ParallaxLayer',
  {
    factor: vec2({ default: [1, 1], doc: 'Fraction of camera motion retained by this presentation layer.' }),
  },
  { sim: false, doc: 'Authored presentation-only parallax configuration.' },
);

export const RoomCollisionState = resource(
  'RoomCollisionState',
  {
    built: bool({ default: false, doc: 'Whether the current room tilemap has queued its static collision cells.' }),
    cellCount: u32({ default: 0, doc: 'Expected derived cell count; confirms deferred spawns are visible before play begins.' }),
  },
  { sim: true, doc: 'One-shot deterministic bootstrap state for tilemap-derived collision.' },
);
