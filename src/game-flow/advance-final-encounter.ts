import { Bounds2D, defineSystem, loadData, LocalTransform, pool, query, read, withTag, write } from '@gameengine/runtime';
import { ActorDied, EnemyBrain, EnemyProjectile, FinalEncounter, FinalSoldier, FinalWarning, GameState, Health, LevelProgress, Player, PlayerControl, PlayerMotion, Projectile, SewerLevelDef } from '../schema.gen.ts';

/** Bounded final fight: one active soldier at a time, then an alive-player outlet gate. */
export const AdvanceFinalEncounter = defineSystem({
  name: 'AdvanceFinalEncounter', after: ['AdvanceLevel', 'ResolveDeaths'], before: ['RestartGame'],
  queries: {
    levels: query(write(FinalEncounter), write(LevelProgress)),
    players: query(read(Player), read(Health), read(LocalTransform), write(PlayerControl), write(PlayerMotion)),
    soldiers: query(write(FinalSoldier), write(EnemyBrain), read(Health), write(Bounds2D)),
    bullets: query(read(Projectile)), enemyBullets: query(read(EnemyProjectile)),
  },
  resources: [write(GameState)], events: [ActorDied],
  runIf: [{ query: query(read(FinalEncounter)) }, { any: [{ changed: [LevelProgress, LocalTransform, GameState] }, { event: ActorDied }, { query: query(withTag(FinalWarning)) }] }],
  run(ctx, { levels, players, soldiers, bullets, enemyBullets }) {
    for (const level of levels.chunks()) for (let row = 0; row < level.length; row++) {
      const state = level.col(LevelProgress);
      if (state.built[row] === 0 || level.is(FinalEncounter, row, 'phase', 'Won') || level.is(FinalEncounter, row, 'phase', 'Failed')) continue;
      const def = loadData(SewerLevelDef, level.get(LevelProgress, row).data!);
      const tuning = def.finalEncounter;
      if (ctx.is(GameState, 'phase', 'PlayerDead')) {
        if (!level.is(FinalEncounter, row, 'phase', 'Waiting')) {
          level.setField(FinalEncounter, row, 'phase', 'Failed');
          ctx.commands.remove(level.entity(row), FinalWarning);
        }
        continue;
      }
      if (!ctx.is(GameState, 'phase', 'Playing') || state.beat[row] !== 3) continue;
      for (const player of players.chunks()) for (let i = 0; i < player.length; i++) {
        if (player.col(Health).current[i] === 0) continue;
        const x = player.col(LocalTransform).position[i * 3]!, y = player.col(LocalTransform).position[i * 3 + 1]!;
        const inLane = y >= tuning.minY && y <= tuning.maxY;
        let activate = -1;
        if (level.is(FinalEncounter, row, 'phase', 'Waiting')) {
          if (x < tuning.triggerX || x > def.finishX + 1 || !inLane) continue;
          level.setField(FinalEncounter, row, 'phase', 'Guard'); activate = 0;
        } else if (level.is(FinalEncounter, row, 'phase', 'Warning')) {
          if (ctx.step < level.col(FinalEncounter).deadlineStep[row]!) continue;
          level.setField(FinalEncounter, row, 'phase', 'Bombardment'); activate = 1;
          ctx.commands.remove(level.entity(row), FinalWarning);
        } else if (level.is(FinalEncounter, row, 'phase', 'Guard') || level.is(FinalEncounter, row, 'phase', 'Bombardment')) {
          // Death facts, rather than a per-step whole-manifest recount, advance combat phases.
          if (ctx.events.count(ActorDied) === 0) continue;
          const phase = level.is(FinalEncounter, row, 'phase', 'Guard') ? 0 : 1;
          let alive = false;
          for (const soldier of soldiers.chunks()) for (let j = 0; j < soldier.length; j++) if (soldier.col(FinalSoldier).phase[j] === phase && soldier.col(Health).current[j]! > 0) alive = true;
          if (alive) continue;
          if (phase === 0) {
            level.setField(FinalEncounter, row, 'phase', 'Warning');
            ctx.commands.insert(level.entity(row), FinalWarning, {});
            level.setField(FinalEncounter, row, 'deadlineStep', ctx.step + tuning.warningSteps);
          } else {
            level.setField(FinalEncounter, row, 'phase', 'ExitOpen');
            level.setField(LevelProgress, row, 'cleared', 4);
          }
        } else if (level.is(FinalEncounter, row, 'phase', 'ExitOpen') && x >= def.finishX && x <= def.finishX + 1 && inLane) {
          level.setField(FinalEncounter, row, 'phase', 'Won');
          level.setField(LevelProgress, row, 'finished', true);
          ctx.setField(GameState, 'phase', 'Completed');
          player.setField(PlayerControl, i, 'moveX', 0);
          player.setField(PlayerMotion, i, 'horizontalVelocity', 0);
          player.setField(PlayerMotion, i, 'verticalVelocity', 0);
          const recycle: number[] = [];
          for (const chunk of bullets.chunks()) for (let j = 0; j < chunk.length; j++) recycle.push(chunk.entity(j));
          for (const chunk of enemyBullets.chunks()) for (let j = 0; j < chunk.length; j++) recycle.push(chunk.entity(j));
          pool.giveMany(ctx, recycle);
        }
        if (activate >= 0) for (const soldier of soldiers.chunks()) for (let j = 0; j < soldier.length; j++) {
          if (soldier.col(FinalSoldier).phase[j] !== activate || soldier.col(FinalSoldier).active[j] !== 0) continue;
          soldier.setField(FinalSoldier, j, 'active', true);
          soldier.setField(Bounds2D, j, 'mask', 2);
          soldier.setField(EnemyBrain, j, 'state', 'Patrol');
          soldier.setField(EnemyBrain, j, 'attackSequence', activate === 1 ? 2 : 0);
          soldier.setField(EnemyBrain, j, 'attackCooldownStepsRemaining', activate === 0 ? tuning.warningSteps : 0);
        }
      }
    }
  },
});
