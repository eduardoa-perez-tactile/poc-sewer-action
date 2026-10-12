import { bool, component, entity, event, f32, resource, u16, u32 } from '@gameengine/schema';

export const Health = component(
  'Health',
  { current: u16({ default: 1, min: 0 }), maximum: u16({ default: 1, min: 1 }) },
  { sim: true, doc: 'Single source of truth for actor survivability.' },
);

export const Weapon = component(
  'Weapon',
  {
    fireIntervalSteps: u32({ default: 9, min: 1, doc: 'Fixed simulation steps between accepted shots.' }),
    cooldownStepsRemaining: u32({ default: 0, doc: 'Fixed steps until another shot may be accepted.' }),
    projectileSpeed: f32({ default: 18, min: 0, doc: 'Projectile speed in world units per second.' }),
    projectileRange: f32({ default: 12, min: 0, doc: 'Maximum projectile travel distance in world units.' }),
    recoilSpeed: f32({ default: 1.5, min: 0, doc: 'Horizontal velocity impulse opposite the firing direction.' }),
    damage: u16({ default: 1, min: 1 }),
  },
  { sim: true, doc: 'Deterministic weapon cadence and damage configuration.' },
);

export const Projectile = component(
  'Projectile',
  {
    direction: f32({ default: 1, min: -1, max: 1, doc: 'Horizontal travel direction, always -1 or 1 while active.' }),
    speed: f32({ default: 18, min: 0 }),
    distanceRemaining: f32({ default: 0, min: 0 }),
    damage: u16({ default: 1, min: 1 }),
    owner: entity({ optional: true }),
  },
  { sim: true, doc: 'Pooled fixed-step projectile state.' },
);

export const ProjectilePoolState = resource(
  'ProjectilePoolState',
  { warmed: bool({ default: false, doc: 'Whether the deterministic projectile pool has been queued.' }) },
  { sim: true, doc: 'One-shot projectile pool bootstrap state.' },
);

export const DamageRequested = event(
  'DamageRequested',
  { source: entity(), target: entity(), amount: u16({ min: 1 }) },
  { sim: true, doc: 'Combat and hazards request damage; the health system validates and applies it.' },
);

export const ActorDied = event(
  'ActorDied',
  { actor: entity(), killer: entity({ optional: true }) },
  { sim: true, doc: 'Fact emitted after health reaches zero; game flow and presentation may react.' },
);
