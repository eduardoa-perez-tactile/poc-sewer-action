import { bool, component, enumOf, f32, u32 } from '@gameengine/schema';

export const EnemyBrain = component(
  'EnemyBrain',
  {
    state: enumOf('EnemyState', ['Idle', 'Patrol', 'Chase', 'Attack', 'Stunned', 'Dead'], { default: 'Patrol' }),
    facing: enumOf('EnemyFacing', ['Left', 'Right'], { default: 'Left' }),
    patrolMinX: f32({ default: -2, doc: 'Inclusive left edge of the authored patrol route.' }),
    patrolMaxX: f32({ default: 2, doc: 'Inclusive right edge of the authored patrol route.' }),
    patrolSpeed: f32({ default: 1.25, min: 0 }),
    chaseSpeed: f32({ default: 2.75, min: 0 }),
    detectionRangeX: f32({ default: 5, min: 0 }),
    detectionRangeY: f32({ default: 2, min: 0 }),
    stopDistance: f32({ default: 1.25, min: 0 }),
    collisionHalfWidth: f32({ default: 0.35, min: 0 }),
    edgeProbeDistance: f32({ default: 0.08, min: 0 }),
    turnPauseSteps: u32({ default: 18 }),
    turnPauseStepsRemaining: u32({ default: 0 }),
    targetMemorySteps: u32({ default: 90 }),
    targetMemoryStepsRemaining: u32({ default: 0 }),
    targetDetected: bool({ default: false }),
    lastKnownTargetX: f32({ default: 0 }),
  },
  { sim: true, doc: 'Deterministic soldier configuration, decisions and chase memory.' },
);
