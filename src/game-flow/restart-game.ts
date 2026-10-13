import { defineSystem, LocalTransform, pool, query, read, write } from '@gameengine/runtime';
import {
  ActorSpawn,
  Alive,
  Cadaver,
  CadaverSettling,
  EnemyBrain,
  EnemyProjectile,
  EnemyRestartState,
  GameState,
  Health,
  HitReaction,
  HitReacting,
  Player,
  PlayerControl,
  PlayerDashState,
  PlayerGroundContact,
  PlayerMotion,
  PlayerRestartState,
  PlayerStepInput,
  Projectile,
  RestartRequested,
  Weapon,
  WaterContact,
} from '../schema.gen.ts';

export const RestartGame = defineSystem({
  name: 'RestartGame',
  after: ['AdvanceCadavers'],
  queries: {
    players: query(read(Player), read(PlayerRestartState), read(ActorSpawn), write(Health), write(HitReaction), write(LocalTransform), write(PlayerControl), write(PlayerDashState), write(PlayerGroundContact), write(PlayerMotion), write(Weapon), write(WaterContact)),
    enemies: query(write(EnemyBrain), read(EnemyRestartState), read(ActorSpawn), write(Health), write(HitReaction), write(LocalTransform)),
    cadavers: query(read(Cadaver)),
    projectiles: query(read(Projectile)),
    enemyProjectiles: query(read(EnemyProjectile)),
  },
  resources: [write(GameState), write(PlayerStepInput)],
  runOn: [RestartRequested],
  run(ctx, { players, enemies, cadavers, projectiles, enemyProjectiles }) {
    for (const chunk of players.chunks()) {
      const spawn = chunk.col(ActorSpawn);
      const restart = chunk.col(PlayerRestartState);
      const health = chunk.col(Health);
      for (let row = 0; row < chunk.length; row++) {
        const entity = chunk.entity(row);
        chunk.set(LocalTransform, row, { position: [spawn.position[row * 2]!, spawn.position[row * 2 + 1]!, 0] });
        chunk.set(Health, row, { current: health.maximum[row]!, maximum: health.maximum[row]!, invulnerabilitySteps: health.invulnerabilitySteps[row]!, invulnerableUntilStep: 0 });
        chunk.set(HitReaction, row, { steps: chunk.col(HitReaction).steps[row]!, stepsRemaining: 0, knockback: [0, 0] });
        chunk.set(PlayerControl, row, { moveX: 0, crouch: false, jumpHeld: false });
        const facing = restart.facing[row] === 0 ? 'Left' : 'Right';
        const grounded = restart.grounded[row] !== 0;
        chunk.set(PlayerDashState, row, { active: false, direction: facing, activeStepsRemaining: 0, cooldownStepsRemaining: 0, controlLockStepsRemaining: 0 });
        chunk.set(PlayerGroundContact, row, { grounded });
        chunk.set(PlayerMotion, row, { horizontalVelocity: 0, verticalVelocity: 0, groundedForMovement: grounded, facing, coyoteStepsRemaining: 0, jumpBufferStepsRemaining: 0, airJumpsRemaining: restart.airJumps[row]!, jumpWasHeld: false, ignoreGroundContact: false });
        chunk.setField(Weapon, row, 'cooldownStepsRemaining', 0);
        chunk.setField(WaterContact, row, 'inside', false);
        chunk.setField(WaterContact, row, 'nextSplashStep', 0);
        ctx.commands.insert(entity, Alive, {});
      }
    }

    for (const chunk of enemies.chunks()) {
      const spawn = chunk.col(ActorSpawn);
      const restart = chunk.col(EnemyRestartState);
      const health = chunk.col(Health);
      const reaction = chunk.col(HitReaction);
      const brain = chunk.col(EnemyBrain);
      for (let row = 0; row < chunk.length; row++) {
        const entity = chunk.entity(row);
        chunk.set(LocalTransform, row, { position: [spawn.position[row * 2]!, spawn.position[row * 2 + 1]!, 0] });
        chunk.set(Health, row, { current: health.maximum[row]!, maximum: health.maximum[row]!, invulnerabilitySteps: health.invulnerabilitySteps[row]!, invulnerableUntilStep: 0 });
        chunk.set(HitReaction, row, { steps: reaction.steps[row]!, stepsRemaining: 0, knockback: [0, 0] });
        chunk.set(EnemyBrain, row, {
          state: restart.state[row] === 0 ? 'Idle' : restart.state[row] === 1 ? 'Patrol' : 'Chase', facing: restart.facing[row] === 0 ? 'Left' : 'Right', patrolMinX: brain.patrolMinX[row]!, patrolMaxX: brain.patrolMaxX[row]!, patrolSpeed: brain.patrolSpeed[row]!, chaseSpeed: brain.chaseSpeed[row]!,
          detectionRangeX: brain.detectionRangeX[row]!, detectionRangeY: brain.detectionRangeY[row]!, stopDistance: brain.stopDistance[row]!, collisionHalfWidth: brain.collisionHalfWidth[row]!, edgeProbeDistance: brain.edgeProbeDistance[row]!,
          turnPauseSteps: brain.turnPauseSteps[row]!, turnPauseStepsRemaining: 0, targetMemorySteps: brain.targetMemorySteps[row]!, targetMemoryStepsRemaining: 0, targetDetected: false, lastKnownTargetX: 0,
          attackKind: 'None', attackSequence: restart.attackSequence[row]!, attackRange: brain.attackRange[row]!, attackCooldownSteps: brain.attackCooldownSteps[row]!, attackCooldownStepsRemaining: 0, attackTelegraphed: false,
        });
        ctx.commands.insert(entity, Alive, {});
      }
    }

    for (const chunk of cadavers.chunks()) for (let row = 0; row < chunk.length; row++) ctx.commands.remove(chunk.entity(row), Cadaver);
    for (const chunk of players.chunks()) for (let row = 0; row < chunk.length; row++) ctx.commands.remove(chunk.entity(row), HitReacting);
    for (const chunk of enemies.chunks()) for (let row = 0; row < chunk.length; row++) {
      ctx.commands.remove(chunk.entity(row), HitReacting);
      ctx.commands.remove(chunk.entity(row), CadaverSettling);
    }
    const active: number[] = [];
    for (const chunk of projectiles.chunks()) for (let row = 0; row < chunk.length; row++) active.push(chunk.entity(row));
    for (const chunk of enemyProjectiles.chunks()) for (let row = 0; row < chunk.length; row++) active.push(chunk.entity(row));
    pool.giveMany(ctx, active);
    ctx.set(PlayerStepInput, { jumpRequested: false, dashRequested: false });
    ctx.set(GameState, { initialized: true, phase: 'Playing' });
  },
});
