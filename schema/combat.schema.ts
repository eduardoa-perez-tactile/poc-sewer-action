import { component, entity, event, f32, u16 } from '@gameengine/schema';

export const Health = component(
  'Health',
  { current: u16({ default: 1, min: 0 }), maximum: u16({ default: 1, min: 1 }) },
  { sim: true, doc: 'Single source of truth for actor survivability.' },
);

export const Weapon = component(
  'Weapon',
  {
    cooldownSeconds: f32({ default: 0.15, min: 0 }),
    cooldownRemaining: f32({ default: 0, min: 0 }),
    damage: u16({ default: 1, min: 1 }),
  },
  { sim: true, doc: 'Deterministic weapon cadence and damage configuration.' },
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
