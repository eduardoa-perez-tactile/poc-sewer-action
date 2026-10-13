import { bool, component, entity, enumOf, event, f32, resource, u16, u32, vec2 } from '@gameengine/schema';

export const Hazard = component(
  'Hazard',
  {
    kind: enumOf('HazardKind', ['Water', 'Explosive', 'Contact'], { default: 'Contact' }),
    damage: u16({ default: 1, min: 1 }),
    repeatSeconds: f32({ default: 0, min: 0, doc: 'Simulation-time interval; zero means one hit per contact.' }),
  },
  { sim: true, doc: 'Data-driven environmental damage contract.' },
);

export const WaterContact = component(
  'WaterContact',
  {
    inside: bool({ default: false }),
    splashCooldownSteps: u32({ default: 30, min: 1 }),
    nextSplashStep: u32({ default: 0 }),
  },
  { sim: true, doc: 'Player contact with the union of water volumes. Entry damage is independent of splash cooldown.' },
);

export const WaterEntered = event(
  'WaterEntered',
  { player: entity(), position: vec2(), entryStep: u32() },
  { sim: true, doc: 'Accepted water entry fact; presentation observes this without affecting the hazard outcome.' },
);

export const WaterSplash = component(
  'WaterSplash',
  { secondsRemaining: f32({ default: 0, min: 0 }), lastEntryStep: u32({ default: 0 }) },
  { sim: false, doc: 'One preallocated splash slot for the single-player slice, hidden when its one-shot clip ends.' },
);

export const WaterSplashState = resource(
  'WaterSplashState',
  { active: bool({ default: false }) },
  { sim: false, doc: 'Run gate for bounded splash presentation; stops all adapter work once hidden.' },
);
