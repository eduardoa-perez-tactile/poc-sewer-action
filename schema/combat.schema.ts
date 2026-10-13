import { bool, component, entity, enumOf, event, f32, resource, tag, u16, u32, vec2 } from '@gameengine/schema';

export const Alive = tag('Alive', { sim: true, doc: 'Present only while an actor can receive hits and participate in combat.' });
export const HitReacting = tag('HitReacting', { sim: true, doc: 'Present only while fixed-step knockback remains active.' });
export const CadaverSettling = tag('CadaverSettling', { sim: true, doc: 'Present only during the bounded cadaver settling burst.' });

export const Health = component(
  'Health',
  {
    current: u16({ default: 1, min: 0 }),
    maximum: u16({ default: 1, min: 1 }),
    invulnerabilitySteps: u32({ default: 6, doc: 'Fixed steps between accepted hits.' }),
    invulnerableUntilStep: u32({ default: 0, doc: 'First fixed step on which another hit is valid.' }),
  },
  { sim: true, doc: 'Single source of truth for actor survivability.' },
);

export const HitReaction = component(
  'HitReaction',
  {
    steps: u32({ default: 8, min: 1 }),
    stepsRemaining: u32({ default: 0 }),
    knockback: vec2({ default: [0, 0], doc: 'Current deterministic world-space knockback velocity.' }),
  },
  { sim: true, doc: 'Fixed-step hit stun and knockback owned by gameplay.' },
);

export const ActorSpawn = component(
  'ActorSpawn',
  { position: vec2({ default: [0, 0], doc: 'Authored restart position for this actor.' }) },
  { sim: true, doc: 'Stable authored state used by deterministic full restart.' },
);

export const Cadaver = component(
  'Cadaver',
  {
    ageSteps: u32({ default: 0 }),
    settleStepsRemaining: u32({ default: 10 }),
    velocity: vec2({ default: [0, 0] }),
  },
  { sim: true, doc: 'Non-combat enemy corpse that settles deterministically and then remains still.' },
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

export const EnemyProjectile = component(
  'EnemyProjectile',
  {
    kind: enumOf('EnemyProjectileKind', ['Bullet', 'Bomb'], { default: 'Bullet' }),
    velocityX: f32({ default: 0 }),
    velocityY: f32({ default: 0 }),
    gravity: f32({ default: 0, min: 0 }),
    distanceRemaining: f32({ default: 0, min: 0 }),
    lifetimeStepsRemaining: u32({ default: 0 }),
    damage: u16({ default: 1, min: 1 }),
    owner: entity({ optional: true }),
  },
  { sim: true, doc: 'Pooled fixed-step enemy bullet or ballistic bomb state.' },
);

export const EnemyAttackPoolState = resource(
  'EnemyAttackPoolState',
  { warmed: bool({ default: false }) },
  { sim: true, doc: 'One-shot enemy bullet and bomb pool bootstrap state.' },
);

export const DamageRequested = event(
  'DamageRequested',
  {
    source: entity(),
    target: entity(),
    amount: u16({ min: 1 }),
    bypassInvulnerability: bool({ default: false, doc: 'Environmental entry damage must not leave an invulnerable player stranded alive in water.' }),
    knockback: vec2({ default: [0, 0] }),
  },
  { sim: true, doc: 'Combat and hazards request damage; the health system validates and applies it.' },
);

export const ActorDied = event(
  'ActorDied',
  { actor: entity(), killer: entity({ optional: true }) },
  { sim: true, doc: 'Fact emitted after health reaches zero; game flow and presentation may react.' },
);

export const RestartRequested = event(
  'RestartRequested',
  {},
  { sim: true, doc: 'Recorded intent to rebuild the current encounter from authored state.' },
);
