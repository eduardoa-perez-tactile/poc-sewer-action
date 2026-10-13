import { expect, renderTest, worldTest } from './first-room-test.ts';
import { entityString, LoadingResumed, VisualOffset } from '@gameengine/runtime';
import { AudioCue, CameraConsequenceState, CameraFeedback, CombatEffect, CombatVisual, DamageRequested, EnemyBrain, FinalEncounter, FootDust, FlowRequested, GameFeelComparison, GameState, Health, Player, PlayerAnimationPresentation, PlayerFeelState, PlayerTrail, MotionEffectState, RestartRequested } from '../src/schema.gen.ts';
import { cameraImpulseDecay } from '../src/presentation/drive-camera-feedback.ts';

worldTest('recovery feedback accepted shots hold a finite distinct pose and reject duplicate cues', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  const player = world.entities(Player)[0]!;
  const enemy = world.entities(EnemyBrain)[0]!;
  world.insert(enemy, EnemyBrain, { detectionRangeX: 0 });
  input.action('shoot', 1); await step(1); input.action('shoot', 0);
  expect(world.get(player, PlayerAnimationPresentation).clip).toBe('art/player/shoot.clip2d.json');
  const cueStep = world.resource(PlayerFeelState).lastShotStep;
  expect(world.get(player, VisualOffset).position[0]).toBeLessThan(0);
  await step(8);
  expect(world.get(player, PlayerAnimationPresentation).clip).toBe('art/player/idle.clip2d.json');
  expect(world.resource(PlayerFeelState).shotTime).toBe(0);
  input.emit(AudioCue, { kind: 'Shot', step: cueStep }); await step(1);
  expect(world.get(player, PlayerAnimationPresentation).clip).toBe('art/player/idle.clip2d.json');
  expect(world.get(player, VisualOffset).scale).toEqual([1, 1, 1]);
});

worldTest('recovery feedback dash and jump have direction and weight then settle', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  const player = world.entities(Player)[0]!;
  world.insert(world.entities(EnemyBrain)[0]!, EnemyBrain, { detectionRangeX: 0 });
  input.action('dash', 1); await step(1); input.action('dash', 0);
  const dash = world.get(player, VisualOffset);
  expect(dash.scale[0]).toBeGreaterThan(1.2); expect(dash.scale[1]).toBeLessThan(0.85);
  expect(dash.rotation[2]).toBeLessThan(0);
  expect(world.entities(PlayerTrail).filter((e) => world.get(e, PlayerTrail).remaining > 0).length).toBe(1);
  await step(4);
  expect(world.entities(PlayerTrail).filter((e) => world.get(e, PlayerTrail).remaining > 0).length).toBe(3);
  await step(18);
  input.action('jump', 1); await step(2);
  expect(world.resource(PlayerFeelState).takeoffTime).toBeGreaterThan(0);
  expect(world.get(world.entities(FootDust)[0]!, FootDust).remaining).toBeGreaterThan(0);
  expect(world.get(player, VisualOffset).scale[1]).toBeGreaterThan(1);
  input.action('jump', 0);
  let sawLanding = false;
  for (let i = 0; i < 80; i++) {
    await step(1);
    if (world.resource(PlayerFeelState).landingTime > 0) sawLanding = true;
  }
  expect(sawLanding).toBe(true);
  expect(world.get(player, VisualOffset).scale).toEqual([1, 1, 1]);
  expect(world.resource(PlayerFeelState).active).toBe(false);
  expect(world.resource(MotionEffectState).active).toBe(false);
  expect(world.entities(PlayerTrail).every((e) => world.get(e, PlayerTrail).remaining === 0)).toBe(true);
});

worldTest('recovery feedback accepted damage shakes once and rejected invulnerable hits do not replay it', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  const player = world.entities(Player)[0]!;
  world.insert(world.entities(EnemyBrain)[0]!, EnemyBrain, { detectionRangeX: 0 });
  world.insert(player, Health, { current: 10, maximum: 10, invulnerabilitySteps: 60 }); await step(1);
  world.setResource(GameFeelComparison, { shake: true, recoil: true });
  input.emit(DamageRequested, { source: entityString(player), target: entityString(player), amount: 1 }); await step(1);
  expect(world.resource(CameraFeedback).shakeTime).toBeGreaterThan(0.1);
  const hp = world.get(player, Health).current;
  const firstTime = world.resource(CameraFeedback).shakeTime;
  input.emit(DamageRequested, { source: entityString(player), target: entityString(player), amount: 1 }); await step(1);
  expect(world.get(player, Health).current).toBe(hp);
  expect(world.resource(CameraFeedback).shakeTime).toBeLessThan(firstTime);
  input.emit(RestartRequested, {}); await step(1);
  expect(world.resource(PlayerFeelState).shotTime).toBe(0);
  expect(world.resource(CameraFeedback).active).toBe(false);
});

worldTest('recovery feedback recoil decay is invariant to presentation rate', async () => {
  const thirty = Math.pow(cameraImpulseDecay(1 / 30), 30);
  const sixty = Math.pow(cameraImpulseDecay(1 / 60), 60);
  const oneTwenty = Math.pow(cameraImpulseDecay(1 / 120), 120);
  expect(thirty).toBeCloseTo(sixty, 12); expect(oneTwenty).toBeCloseTo(sixty, 12);
  expect(cameraImpulseDecay(0)).toBe(1);
});

worldTest('recovery feedback muzzle impact and explosion hosts stay finite without adding entities', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  world.setResource(GameFeelComparison, { particles: true });
  const hosts = world.entities(CombatVisual);
  expect(hosts.length).toBe(3);
  const hash = world.hash();
  world.setResource(PlayerFeelState, { shotTime: 0.05, active: true });
  expect(world.hash()).toBe(hash);
  for (const kind of ['muzzle', 'hit', 'explosion']) input.emit(CombatEffect, { kind, position: [-5, -1.5], step: 100 });
  await step(1);
  expect(hosts.filter((host) => world.get(host, CombatVisual).remaining[0]! > 0).length).toBe(3);
  await step(30);
  expect(hosts.every((host) => world.get(host, CombatVisual).remaining.every((time) => time === 0))).toBe(true);
});

renderTest('recovery feedback final fight retains muzzle and bounds particles to existing hosts', async ({ world, step, input, render }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  world.setResource(GameFeelComparison, { particles: true });
  const final = world.entities(FinalEncounter)[0]!;
  world.insert(final, FinalEncounter, { phase: 'Bombardment' });
  const muzzle = world.entities(CombatVisual).find((host) => world.get(host, CombatVisual).kind === 'muzzle')!;
  const before = world.get(muzzle, CombatVisual).bursts;
  input.emit(CombatEffect, { kind: 'muzzle', position: [-4, -1.5], step: 10000 });
  input.emit(CombatEffect, { kind: 'hit', position: [-3, -1.5], step: 10000 });
  input.emit(CombatEffect, { kind: 'explosion', position: [-2, -1.5], step: 10000 });
  await step(1);
  expect(world.get(muzzle, CombatVisual).bursts).toBe(before + 1);
  const stats = render.stats({ width: 960, height: 540 });
  expect(stats.particleInstances).toBe(3);
  render.expectDrawCalls('<=', 20, { width: 960, height: 540 });
  await step(30);
  expect(render.stats({ width: 960, height: 540 }).particleInstances).toBe(0);
}, { scene: 'scenes/complete-sewer.scene.json' });

renderTest('recovery feedback authored shot dash jump and landing have visible distinct silhouettes', async ({ world, step, input, render }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  const player = world.entities(Player)[0]!;
  world.insert(world.entities(EnemyBrain)[0]!, EnemyBrain, { detectionRangeX: 0 });
  world.setResource(GameFeelComparison, { shake: false, recoil: false });
  input.action('shoot', 1); await step(1); input.action('shoot', 0);
  expect(world.get(player, PlayerAnimationPresentation).clip).toBe('art/player/shoot.clip2d.json');
  render.expectScreenshot('accepted-shot', { width: 960, height: 540 });
  await step(8);
  input.action('dash', 1); await step(3); input.action('dash', 0);
  expect(world.entities(PlayerTrail).filter((e) => world.get(e, PlayerTrail).remaining > 0).length).toBeGreaterThan(0);
  render.expectScreenshot('dash-trails', { width: 960, height: 540 });
  world.setResource(GameFeelComparison, { particles: false }); await step(1);
  expect(world.entities(PlayerTrail).every((e) => world.get(e, PlayerTrail).remaining === 0)).toBe(true);
  expect(world.resource(MotionEffectState).active).toBe(false);
  world.setResource(GameFeelComparison, { particles: true }); await step(20);
  input.action('jump', 1); await step(3); input.action('jump', 0);
  expect(world.get(world.entities(FootDust)[0]!, FootDust).remaining).toBeGreaterThan(0);
  expect(render.stats({ width: 960, height: 540 }).particleInstances).toBeGreaterThan(0);
  render.expectScreenshot('takeoff-dust', { width: 960, height: 540 });
  let landed = false;
  for (let i = 0; i < 80; i++) {
    await step(1);
    if (world.resource(PlayerFeelState).landingTime > 0.1) { landed = true; break; }
  }
  expect(landed).toBe(true);
  await step(2);
  expect(world.get(player, VisualOffset).scale[1]).toBeLessThan(1);
  expect(world.get(world.entities(FootDust)[0]!, FootDust).remaining).toBeGreaterThan(0);
  render.expectScreenshot('landing-dust', { width: 960, height: 540 });
  await step(40);
  expect(render.stats({ width: 960, height: 540 }).particleInstances).toBe(0);
  expect(world.resource(MotionEffectState).active).toBe(false);
});

worldTest('recovery feedback pause holds pose envelopes and skips the active frame gate', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  world.insert(world.entities(EnemyBrain)[0]!, EnemyBrain, { detectionRangeX: 0 });
  input.action('shoot', 1); await step(1); input.action('shoot', 0);
  const remaining = world.resource(PlayerFeelState).shotTime;
  expect(remaining).toBeGreaterThan(0);
  world.setResource(GameState, { phase: 'Paused' }); await step(10);
  expect(world.resource(PlayerFeelState).active).toBe(false);
  expect(world.resource(PlayerFeelState).shotTime).toBe(remaining);
  expect(world.resource(MotionEffectState).active).toBe(false);
  world.setResource(GameState, { phase: 'Playing' }); await step(8);
  expect(world.resource(PlayerFeelState).shotTime).toBe(0);
});

worldTest('recovery feedback scene entry resets retained envelopes and cue timestamps', async ({ world, step, input, loaded }) => {
  await loaded(); await step(2);
  world.setResource(PlayerFeelState, { active: true, initialized: true, shotTime: 5, takeoffTime: 5, landingTime: 5, lastShotStep: 10000 });
  world.setResource(MotionEffectState, { active: true, sampleTime: 5, nextSlot: 2 });
  world.setResource(CameraConsequenceState, { lastDeathStep: 10000, lastExplosionStep: 10000 });
  input.emit(FlowRequested, { action: 'Start' }); await step(5);
  expect(world.resource(GameState).phase).toBe('Playing');
  expect(world.resource(PlayerFeelState).shotTime).toBe(0);
  expect(world.resource(PlayerFeelState).landingTime).toBe(0);
  expect(world.resource(PlayerFeelState).takeoffTime).toBe(0);
  expect(world.resource(MotionEffectState).active).toBe(false);
  expect(world.resource(MotionEffectState).sampleTime).toBe(0);
  expect(world.resource(CameraConsequenceState).lastDeathStep).toBeLessThan(10000);
}, { scene: 'scenes/title.scene.json' });

worldTest('recovery feedback retained death cue cannot request a second camera boost', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  world.setResource(GameFeelComparison, { shake: true });
  input.emit(AudioCue, { kind: 'EnemyDeath', step: 100 }); await step(1);
  const firstTime = world.resource(CameraFeedback).shakeTime;
  await step(1);
  expect(world.resource(CameraFeedback).shakeTime).toBeLessThan(firstTime);
  input.emit(AudioCue, { kind: 'EnemyDeath', step: 100 }); await step(1);
  expect(world.resource(CameraFeedback).shakeTime).toBeLessThan(firstTime - 0.02);
});
