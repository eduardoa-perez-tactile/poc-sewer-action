import { expect, worldTest } from './first-room-test.ts';
import { entityString, LoadingResumed, LocalTransform } from '@gameengine/runtime';
import { AudioCue, CombatEffect, DamageRequested, EnemyBrain, GameState, GameplayAudioState, Health, Player, RestartRequested, WaterEntered } from '../src/schema.gen.ts';

worldTest('audio accepted player shots follow fixed weapon cadence without retained event duplicates', async ({ world, input, step, audio }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  const soldier = world.entities(EnemyBrain)[0]!;
  world.insert(soldier, EnemyBrain, { state: 'Idle', detectionRangeX: 0 });
  for (let i = 0; i < 19; i++) { input.action('shoot', 1); await step(1); }
  expect(audio.sounds().filter((s) => s.sound === 'audio/sfx/shot').length).toBe(3);
  input.action('shoot', 0); await step(20);
  expect(audio.sounds().filter((s) => s.sound === 'audio/sfx/shot').length).toBe(3);
});

worldTest('audio consequential player and enemy deaths play once on Voice and restart permits a new death', async ({ world, input, step, audio }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  const player = world.entities(Player)[0]!;
  const soldier = world.entities(EnemyBrain)[0]!;
  for (const actor of [soldier, player]) input.emit(DamageRequested, { source: entityString(player), target: entityString(actor), amount: 100 });
  await step(30);
  expect(audio.sounds().filter((s) => s.bus === 'Voice').map((s) => s.sound)).toEqual(['audio/sfx/enemy-death', 'audio/sfx/player-death']);
  input.emit(RestartRequested, {}); await step(2);
  input.emit(DamageRequested, { source: entityString(soldier), target: entityString(player), amount: 100 }); await step(2);
  expect(audio.sounds().filter((s) => s.sound === 'audio/sfx/player-death').length).toBe(2);
});

worldTest('audio ranged soldier release plays laser on its authoritative clip release step', async ({ world, input, step, audio }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  const player = world.entities(Player)[0]!;
  const soldier = world.entities(EnemyBrain)[0]!;
  world.insert(player, LocalTransform, { position: [5, -2.5, 0] });
  world.insert(player, Health, { current: 100, maximum: 100 });
  world.insert(soldier, EnemyBrain, { state: 'Chase', targetDetected: true, attackSequence: 0, attackRange: 10, detectionRangeX: 20, attackCooldownStepsRemaining: 0 });
  await step(6);
  expect(audio.sounds().length).toBe(0);
  await step(1);
  expect(audio.sounds()).toEqual([{ sound: 'audio/sfx/laser', bus: 'SFX', volume: 1 }]);
  await step(1); expect(audio.sounds().length).toBe(1);
});

worldTest('audio cue cooldown uses fixed timestamps and accepts the exact boundary without delayed sounds', async ({ world, input, step, audio }) => {
  world.setResource(GameState, { initialized: true, phase: 'PlayerDead' });
  input.emit(AudioCue, { kind: 'Shot', step: 100 });
  input.emit(AudioCue, { kind: 'Shot', step: 100 }); await step(1);
  expect(audio.sounds().length).toBe(1);
  input.emit(AudioCue, { kind: 'Shot', step: 102 }); await step(1);
  expect(audio.sounds().length).toBe(1);
  await step(10); expect(audio.sounds().length).toBe(1);
  input.emit(AudioCue, { kind: 'Shot', step: 103 }); await step(1);
  expect(audio.sounds().length).toBe(2);
});

worldTest('audio routes explosions and splash once and ignores muzzle and ordinary hit visuals', async ({ world, input, step, audio }) => {
  world.setResource(GameState, { initialized: true, phase: 'PlayerDead' });
  for (const kind of ['muzzle', 'hit', 'explosion', 'explosion']) input.emit(CombatEffect, { kind, position: [0, 0], step: 100 });
  input.emit(WaterEntered, { player: entityString(world.entities(Player)[0]!), position: [0, 0], entryStep: 100 });
  await step(2);
  expect(audio.sounds()).toEqual([{ sound: 'audio/sfx/explosion', bus: 'SFX', volume: 1 }, { sound: 'audio/sfx/water-splash', bus: 'SFX', volume: 1 }]);
});

worldTest('audio restart cancels same-frame cues and presentation state never changes the sim hash', async ({ world, input, step, audio }) => {
  await step(3);
  const hash = world.hash();
  world.setResource(GameplayAudioState, { lastSteps: [10, 10, 10, 10, 10, 10], nextSteps: [100, 100, 100, 100, 100, 100] });
  expect(world.hash()).toBe(hash);
  input.emit(AudioCue, { kind: 'Shot', step: 100 });
  input.emit(RestartRequested, {}); await step(1);
  expect(audio.sounds().length).toBe(0);
  expect(world.resource(GameplayAudioState).nextSteps).toEqual([0, 0, 0, 0, 0, 0]);
  await step(1); expect(audio.sounds().length).toBe(0);
});

worldTest('audio mixer caps repeated voices and one-shot tails clean up', async ({ world, input, step, audio, loaded }) => {
  await loaded();
  world.setResource(GameState, { initialized: true, phase: 'PlayerDead' });
  for (let i = 0; i < 20; i++) {
    input.emit(AudioCue, { kind: 'Shot', step: 100 + i * 3 });
    await step(1);
    expect(audio.status().voices).toBeGreaterThan(0);
    expect(audio.status().voices).toBeLessThanOrEqual(2);
  }
  expect(audio.sounds().length).toBe(20);
  await step(120);
  expect(audio.status().voices).toBe(0);
});

worldTest('audio bomb explosion follows consequential projectile expiry and never plays at throw', async ({ world, input, step, audio }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  const player = world.entities(Player)[0]!;
  const soldier = world.entities(EnemyBrain)[0]!;
  world.insert(player, LocalTransform, { position: [9, -2.5, 0] });
  world.insert(player, Health, { current: 100, maximum: 100 });
  world.insert(soldier, EnemyBrain, { state: 'Chase', facing: 'Right', targetDetected: true, lastKnownTargetX: 9, attackSequence: 2, detectionRangeX: 20, attackRange: 10, attackCooldownStepsRemaining: 0 });
  await step(16);
  expect(audio.sounds().filter((s) => s.sound === 'audio/sfx/explosion').length).toBe(0);
  await step(100);
  expect(audio.sounds().filter((s) => s.sound === 'audio/sfx/explosion').length).toBe(1);
});

worldTest('audio mixed cue flood respects individual voice caps across restart and global phone limit', async ({ world, input, step, audio, loaded }) => {
  await loaded();
  world.setResource(GameState, { initialized: true, phase: 'PlayerDead' });
  for (let i = 0; i < 10; i++) {
    for (const kind of ['Shot', 'Laser', 'PlayerDeath', 'EnemyDeath']) input.emit(AudioCue, { kind, step: 100 + i * 10 });
    input.emit(CombatEffect, { kind: 'explosion', position: [0, 0], step: 100 + i * 10 });
    input.emit(WaterEntered, { player: entityString(world.entities(Player)[0]!), position: [0, 0], entryStep: 100 + i * 10 });
    await step(1);
    expect(audio.status().voices).toBeGreaterThan(0);
    expect(audio.status().voices).toBeLessThanOrEqual(9);
  }
  input.emit(RestartRequested, {}); await step(1);
  expect(audio.status().voices).toBeLessThanOrEqual(9);
  await step(120);
  expect(audio.status().voices).toBe(0);
  expect(audio.status().buses.SFX).toBe(1);
  expect(audio.status().buses.Voice).toBe(1);
});

worldTest('audio boot preloads every short mono effect before consequential input', async ({ audio, loaded }) => {
  await loaded();
  expect(audio.status().sounds).toBe(6);
  expect(audio.status().voices).toBe(0);
});
