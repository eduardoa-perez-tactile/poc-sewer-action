import { component, enumOf, f32, u16 } from '@gameengine/schema';

export const Hazard = component(
  'Hazard',
  {
    kind: enumOf('HazardKind', ['Water', 'Explosive', 'Contact'], { default: 'Contact' }),
    damage: u16({ default: 1, min: 1 }),
    repeatSeconds: f32({ default: 0, min: 0, doc: 'Simulation-time interval; zero means one hit per contact.' }),
  },
  { sim: true, doc: 'Data-driven environmental damage contract.' },
);
