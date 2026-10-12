import { component, enumOf, f32 } from '@gameengine/schema';

export const EnemyBrain = component(
  'EnemyBrain',
  {
    state: enumOf('EnemyState', ['Idle', 'Patrol', 'Attack', 'Stunned', 'Dead'], { default: 'Idle' }),
    decisionRemaining: f32({ default: 0, min: 0, doc: 'Simulation-time delay until the next decision.' }),
  },
  { sim: true, doc: 'Deterministic soldier decision state; visuals derive animation from it.' },
);
