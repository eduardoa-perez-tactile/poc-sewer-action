import { expect } from './complete-level-test.ts';
import { LoadingResumed, LocalTransform, Disabled } from '@gameengine/runtime';
import { FinalEncounter, FinalSoldier, EnemyBrain, EncounterMember, GameState, Health, LevelProgress, EnemyProjectile, Player } from '../src/schema.gen.ts';
import type { WorldTestContext } from '@gameengine/test';

export const completeRoute = async ({ world, step, input }: WorldTestContext, ready?: () => void, observe?: () => void) => {
  input.view(1920, 1080, 1);
  input.emit(LoadingResumed, { name: 'boot' });
  await step(3);
  ready?.(); observe?.();
  const [player] = world.entities(Player);
  const [level] = world.entities(LevelProgress);
  const visited = [0];
  let lastBeat = 0;
  const phases = ['Waiting'];
  let sawFinalBomb = false;
  let bombPhaseTicks = 0;
  // A deterministic pilot records real controls; no teleports, health writes or damage injections.
  for (let tick = 0; tick < 2400; tick++) {
    const p = world.get(player!, LocalTransform).position;
    const state = world.get(level!, LevelProgress);
    if (state.finished) break;
    const enemies = world.entities(EncounterMember).filter(e => world.get(e, EncounterMember).beat === state.beat && world.get(e, Health).current > 0 && (!world.has(e, FinalSoldier) || world.get(e, FinalSoldier).active));
    const nearest = enemies.sort((a, b) => world.get(a, LocalTransform).position[0]! - world.get(b, LocalTransform).position[0]!)[0];
    const target = nearest === undefined ? 54 : world.get(nearest, LocalTransform).position[0]!;
    const distance = target - p[0]!;
    input.action('moveX', nearest !== undefined && Math.abs(distance) < (state.beat === 3 && world.get(level!, FinalEncounter).phase !== 'Bombardment' ? 0.75 : 2.5) ? (distance < 0 ? -0.05 : 0.05) : distance < 0 ? -1 : 1);
    if (world.get(level!, FinalEncounter).phase === 'Bombardment') bombPhaseTicks++;
    input.action('shoot', nearest !== undefined && (world.get(level!, FinalEncounter).phase !== 'Bombardment' || bombPhaseTicks > 22) ? 1 : 0);
    // Fixed jump windows traverse the three flooded gaps and elevated ledges.
    const atGap = [[5, 8], [9, 13], [19, 27], [36, 42], [47, 51]].some(([a, b]) => p[0]! >= a! && p[0]! < b!);
    input.action('jump', atGap && tick % 36 < 22 ? 1 : 0);
    input.action('dash', atGap && tick % 60 === 32 ? 1 : 0);
    await step(1); observe?.();
    if (world.resource(GameState).phase === 'PlayerDead') throw new Error(JSON.stringify({ tick, p, phases, enemies: enemies.map(e => [world.get(e, LocalTransform).position, world.get(e, EnemyBrain).state]) }));
    const phase = String(world.get(level!, FinalEncounter).phase!);
    if (phases[phases.length - 1] !== phase) phases.push(phase);
    if (phase === 'Bombardment' && world.entities(EnemyProjectile).some(e => !world.has(e, Disabled) && world.get(e, EnemyProjectile).kind === 'Bomb')) sawFinalBomb = true;
    const after = world.get(level!, LevelProgress);
    if (after.beat !== lastBeat) {
      expect(after.beat).toBe(lastBeat + 1);
      expect(after.cleared).toBe(after.beat);
      expect(after.checkpoint).toBe(after.beat);
      visited.push(after.beat); lastBeat = after.beat;
    }
  }
  expect(world.get(player!, LocalTransform).position[0]).toBeGreaterThan(53);
  expect(visited).toEqual([0, 1, 2, 3]);
  expect(sawFinalBomb).toBe(true);
  expect(phases).toEqual(['Waiting', 'Guard', 'Warning', 'Bombardment', 'ExitOpen', 'Won']);
  expect(world.resource(GameState).phase).toBe('Completed');
  expect(world.get(level!, LevelProgress).finished).toBe(true);
  expect(world.get(level!, LevelProgress).cleared).toBe(4);
  for (const enemy of world.entities(EncounterMember)) expect(world.get(enemy, Health).current).toBe(0);
};
