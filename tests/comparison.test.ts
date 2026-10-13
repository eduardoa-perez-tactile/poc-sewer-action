import { expect, worldTest, renderTest } from './first-room-test.ts';
import { worldTest as routeTest, renderTest as routeRenderTest } from './complete-level-test.ts';
import { completeRoute } from './complete-route.ts';
import { entityString, LoadingResumed, LocalTransform, ParticleSystem, Sprite, Camera, VisualOffset } from '@gameengine/runtime';
import { previewView, views } from '@gameengine/ui';
import { GameFeelComparison, ComparisonDef, ComparisonRequested, AudioCue, CameraFeedback, CameraFollowState, CombatEffect, CombatVisual, CombatVisualState, EnemyBrain, GameState, HitReaction, Player, WaterEntered, WaterSplash, WaterSplashState, SoldierVisual, RestartRequested } from '../src/schema.gen.ts';
import { COMPARISON_LAYERS, comparisonIntent, comparisonMode } from '../src/comparison/comparison-model.ts';
import { ComparisonView } from '../src/views/comparison.view.tsx';
import { loadData } from '@gameengine/runtime';

worldTest('comparison content defaults preserve the original presentation and explicitly hide exposure', ({ world }) => {
  const config = loadData(ComparisonDef, 'settings/game-feel.json');
  expect(config.exposure).toBe('hidden');
  expect([config.shake, config.recoil, config.particles, config.flashes, config.audio]).toEqual([false, false, true, true, true]);
  const model = { exposure: 'bonus' as const, open: true, shake: true, recoil: true, particles: true, flashes: true, audio: true };
  expect(comparisonMode(model)).toBe('Polished');
  const baseline = { ...model, ...comparisonIntent(model, 'baseline') };
  expect(comparisonMode(baseline)).toBe('Baseline');
  for (const layer of COMPARISON_LAYERS) {
    const patch = comparisonIntent(baseline, layer, true);
    expect(Object.keys(patch)).toEqual([layer]);
    expect(patch[layer]).toBe(true);
    expect(comparisonMode({ ...baseline, ...patch })).toBe('Custom');
  }
  expect(comparisonIntent({ ...model, exposure: 'hidden' }, 'open')).toEqual({});
  expect(comparisonIntent(model, 'invalid')).toEqual({});
  const hash = world.hash();
  world.setResource(GameFeelComparison, model);
  expect(world.hash()).toBe(hash);
});

worldTest('comparison controller handles every intent once including retained events and hidden policy', async ({ world, step, input }) => {
  await step(3);
  input.emit(ComparisonRequested, { action: 'open' }); await step(2);
  expect(world.resource(GameFeelComparison).open).toBe(false);
  expect(views.top()).toBe(null);
  world.setResource(GameFeelComparison, { exposure: 'developer' });
  input.emit(ComparisonRequested, { action: 'open' }); await step(2);
  expect(world.resource(GameFeelComparison).open).toBe(true);
  expect(views.top()).toBe('Comparison');
  input.emit(ComparisonRequested, { action: 'baseline' }); await step(2);
  for (const layer of COMPARISON_LAYERS) {
    input.emit(ComparisonRequested, { action: layer, enabled: true }); await step(2);
    expect(world.resource(GameFeelComparison)[layer]).toBe(true);
    input.emit(ComparisonRequested, { action: layer, enabled: false }); await step(2);
    expect(world.resource(GameFeelComparison)[layer]).toBe(false);
  }
  input.emit(ComparisonRequested, { action: 'polished' }); await step(2);
  expect(comparisonMode(world.resource(GameFeelComparison))).toBe('Polished');
  input.emit(ComparisonRequested, { action: 'close' }); await step(2);
  expect(views.top()).toBe(null);
});

for (const layer of ['shake', 'recoil'] as const) worldTest(`comparison ${layer} presents accepted shots and immediately clears disabled feedback`, async ({ world, step, input }) => {
  await step(3);
  world.setResource(GameState, { initialized: true, phase: 'PlayerDead' });
  world.setResource(GameFeelComparison, { exposure: 'developer', shake: layer === 'shake', recoil: layer === 'recoil' });
  input.emit(AudioCue, { kind: 'Shot', step: 100 }); await step(1);
  const feedback = world.resource(CameraFeedback);
  expect(layer === 'shake' ? feedback.shakeTime > 0 : Math.abs(feedback.bump[0]) > 0).toBe(true);
  input.emit(ComparisonRequested, { action: layer, enabled: false }); await step(1);
  expect(world.resource(CameraFeedback).active).toBe(false);
  const camera = world.entities(Camera)[0]!;
  expect(world.get(camera, VisualOffset).position.slice(0, 2)).toEqual(world.resource(CameraFollowState).center);
  input.emit(ComparisonRequested, { action: layer, enabled: true }); await step(1);
  expect(world.resource(CameraFeedback).active).toBe(false);
  input.emit(AudioCue, { kind: 'Shot', step: 110 }); await step(1);
  expect(world.resource(CameraFeedback).active).toBe(true);
  await step(90); expect(world.resource(CameraFeedback).active).toBe(false);
});

worldTest('comparison particles cancel bounded combat and water hosts without replaying suppressed entries', async ({ world, step, input }) => {
  await step(3);
  world.setResource(GameState, { initialized: true, phase: 'PlayerDead' });
  world.setResource(GameFeelComparison, { exposure: 'developer' });
  input.emit(CombatEffect, { kind: 'hit', position: [0, 0], step: 100 });
  input.emit(WaterEntered, { player: entityString(world.entities(Player)[0]!), position: [0, 0], entryStep: 100 }); await step(1);
  expect(world.resource(CombatVisualState).active).toBe(true);
  expect(world.resource(WaterSplashState).active).toBe(true);
  input.emit(ComparisonRequested, { action: 'particles', enabled: false }); await step(1);
  expect(world.resource(CombatVisualState).active).toBe(false);
  expect(world.resource(WaterSplashState).active).toBe(false);
  for (const host of world.entities(CombatVisual)) expect(world.get(host, ParticleSystem).effect).toBe(null);
  for (const host of world.entities(WaterSplash)) expect(world.get(host, Sprite).visible).toBe(false);
  input.emit(CombatEffect, { kind: 'hit', position: [0, 0], step: 110 });
  input.emit(WaterEntered, { player: entityString(world.entities(Player)[0]!), position: [0, 0], entryStep: 110 }); await step(1);
  input.emit(ComparisonRequested, { action: 'particles', enabled: true }); await step(1);
  expect(world.resource(CombatVisualState).active).toBe(false);
  expect(world.resource(WaterSplashState).active).toBe(false);
  input.emit(CombatEffect, { kind: 'hit', position: [0, 0], step: 120 }); await step(1);
  expect(world.resource(CombatVisualState).active).toBe(true);
  input.emit(RestartRequested, {}); await step(2);
  expect(world.resource(CombatVisualState).active).toBe(false);
});

worldTest('comparison flashes change only the visible soldier tint during an accepted hit', async ({ world, step, input }) => {
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  world.setResource(GameState, { initialized: true, phase: 'PlayerDead' });
  world.setResource(GameFeelComparison, { exposure: 'developer' });
  const soldier = world.entities(EnemyBrain)[0]!;
  const visual = world.entities(SoldierVisual)[0]!;
  world.insert(soldier, HitReaction, { stepsRemaining: 100 }); await step(1);
  expect(world.get(visual, Sprite).color[1]).toBeCloseTo(0.42);
  const hash = world.hash();
  world.setResource(GameFeelComparison, { flashes: false }); expect(world.hash()).toBe(hash);
  await step(1); expect(world.get(visual, Sprite).color[1]).toBe(1);
  input.emit(ComparisonRequested, { action: 'flashes', enabled: true }); await step(1);
  expect(world.get(visual, Sprite).color[1]).toBeCloseTo(0.42);
});

worldTest('comparison audio suppresses all six cue lanes without stale playback or voice growth', async ({ world, step, input, audio, loaded }) => {
  await loaded();
  world.setResource(GameState, { initialized: true, phase: 'PlayerDead' });
  world.setResource(GameFeelComparison, { exposure: 'developer', audio: false });
  const cues = (stamp: number) => {
    for (const kind of ['Shot', 'Laser', 'PlayerDeath', 'EnemyDeath']) input.emit(AudioCue, { kind, step: stamp });
    input.emit(CombatEffect, { kind: 'explosion', position: [0, 0], step: stamp });
    input.emit(WaterEntered, { player: entityString(world.entities(Player)[0]!), position: [0, 0], entryStep: stamp });
  };
  cues(100); await step(1); expect(audio.sounds().length).toBe(0);
  input.emit(ComparisonRequested, { action: 'audio', enabled: true }); await step(1);
  expect(audio.sounds().length).toBe(0);
  cues(110); await step(1); expect(audio.sounds().length).toBe(6);
  expect(audio.status().voices).toBeLessThanOrEqual(9);
  input.emit(ComparisonRequested, { action: 'audio', enabled: false }); await step(1);
  for (let i = 0; i < 20; i++) { cues(120 + i * 10); await step(1); expect(audio.status().voices).toBeLessThanOrEqual(9); }
  expect(audio.sounds().length).toBe(6);
  await step(120); expect(audio.status().voices).toBe(0);
  input.emit(ComparisonRequested, { action: 'audio', enabled: true }); await step(2);
  expect(audio.sounds().length).toBe(6);
  expect(audio.status().buses.SFX).toBe(1); expect(audio.status().buses.Voice).toBe(1);
});

renderTest('comparison bonus launcher and real panel presses update model and preserve gameplay controls', async ({ world, step, input, render, ui, loaded }) => {
  await loaded(); input.view(1920, 1080, 1); await step(3);
  world.setResource(GameFeelComparison, { exposure: 'bonus' }); await step(1);
  render.stats({ width: 1920, height: 1080 });
  await ui.press('comparison-open'); await step(1); render.stats({ width: 1920, height: 1080 });
  expect(world.resource(GameFeelComparison).open).toBe(true);
  await ui.press('comparison-panel.comparison-baseline'); await step(1);
  expect(comparisonMode(world.resource(GameFeelComparison))).toBe('Baseline');
  for (const layer of COMPARISON_LAYERS) {
    render.stats({ width: 1920, height: 1080 }); await ui.press(`comparison-panel.comparison-${layer}`); await step(2);
    expect(world.resource(GameFeelComparison)[layer]).toBe(true);
  }
  const player = world.entities(Player)[0]!;
  const x = world.get(player, LocalTransform).position[0];
  input.action('moveX', 1); await step(10);
  expect(world.get(player, LocalTransform).position[0]).toBeGreaterThan(x);
  input.action('moveX', 0);
  render.stats({ width: 1920, height: 1080 }); await ui.press('comparison-panel.comparison-close'); await step(2);
  expect(world.resource(GameFeelComparison).open).toBe(false);
  render.stats({ width: 1920, height: 1080 });
  expect(ui.rect('comparison-open')).toBeDefined();
  world.setResource(GameFeelComparison, { exposure: 'hidden' }); await step(1);
  expect(views.top()).toBe(null);
});

renderTest('comparison samples fit all landscape device safe areas and desktop resize extremes', async ({ step, input, render, ui }) => {
  await step(3);
  for (const [width, height, scale, safe] of [
    [2316, 904, 2.625, [84, 0, 0, 0]], [3840, 1644, 4, [96, 0, 0, 0]],
    [2556, 1179, 3, [177, 0, 102, 0]], [1334, 750, 2, [40, 0, 0, 0]],
    [2160, 1620, 2, [40, 0, 0, 0]], [2176, 1812, 2.625, [74, 0, 42, 0]],
    [800, 600, 1, [0, 0, 0, 0]], [2560, 1080, 1, [0, 0, 0, 0]],
  ] as const) {
    input.view(width, height, scale, [...safe]); await step(1);
    for (const sample of Object.keys(ComparisonView.samples)) {
      previewView({ view: 'Comparison', sample });
      const stats = render.stats({ width, height });
      expect(stats.drawCalls).toBeLessThanOrEqual(14);
      const controls = ui.interactables().filter(c => c.hittable && c.id !== 'comparison-panel');
      expect(controls.length).toBe(sample === 'launcher' ? 1 : 8);
      for (const c of controls) {
        expect(c.rect.x).toBeGreaterThanOrEqual(safe[0] - 0.1);
        expect(c.rect.y).toBeGreaterThanOrEqual(safe[1] - 0.1);
        expect(c.rect.x + c.rect.width).toBeLessThanOrEqual(width - safe[2] + 0.1);
        expect(c.rect.y + c.rect.height).toBeLessThanOrEqual(height - safe[3] + 0.1);
      }
      if (sample !== 'launcher') {
        const panel = ui.rect('comparison-panel')!;
        expect(panel.height).toBeLessThanOrEqual(height * 0.23);
        for (let i = 1; i < controls.length; i++) {
          // Neighbouring controls occupy disjoint horizontal boxes.
          const a = controls[i - 1]!.rect, b = controls[i]!.rect;
          expect(a.x + a.width <= b.x + 0.1 || b.x + b.width <= a.x + 0.1).toBe(true);
        }
      }
    }
  }
  previewView({ view: null });
}, { memory: 'phone-low' });

for (const mode of ['baseline', 'polished'] as const) routeTest(`comparison ${mode} complete route keeps every simulation hash and victory`, async (ctx) => {
  let digest = 2166136261;
  const observe = () => {
    for (const char of ctx.world.hash()) { digest ^= char.charCodeAt(0); digest = Math.imul(digest, 16777619) >>> 0; }
  };
  await completeRoute(ctx, () => {
    ctx.world.setResource(GameFeelComparison, { exposure: 'developer', ...comparisonIntent({ ...ctx.world.resource(GameFeelComparison), exposure: 'developer' }, mode) });
  }, observe);
  expect(ctx.world.hash()).toBe('62ac4c0acd9d2d5a');
  expect(digest.toString(16)).toBe('8c00b28d');
});

worldTest('comparison panel replay warms baseline polished and every presentation layer', async ({ world, step, input }) => {
  input.view(1920, 1080, 1);
  input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  expect(world.resource(GameFeelComparison).exposure).toBe('bonus');
  for (const action of ['open', 'baseline', 'polished', 'close', 'open'] as const) {
    input.emit(ComparisonRequested, { action }); await step(2);
  }
  for (const layer of COMPARISON_LAYERS) {
    input.emit(ComparisonRequested, { action: layer, enabled: false }); await step(2);
    input.emit(ComparisonRequested, { action: layer, enabled: true }); await step(2);
  }
  for (let i = 0; i < 20; i++) { input.action('shoot', 1); await step(1); }
  input.action('shoot', 0); await step(90);
  input.emit(ComparisonRequested, { action: 'baseline' }); await step(2);
  input.emit(ComparisonRequested, { action: 'polished' }); await step(2);
  expect(comparisonMode(world.resource(GameFeelComparison))).toBe('Polished');
}, { scene: 'scenes/comparison.scene.json' });

renderTest('comparison static panel holds layout and model while finite feedback and voices settle', async ({ world, step, input, render, ui, audio }) => {
  input.view(1920, 1080, 1); input.emit(LoadingResumed, { name: 'boot' }); await step(3);
  world.setResource(GameFeelComparison, { exposure: 'bonus', open: true, shake: true, recoil: true });
  input.emit(AudioCue, { kind: 'Shot', step: 100 });
  input.emit(CombatEffect, { kind: 'hit', position: [0, 0], step: 100 }); await step(120);
  render.stats({ width: 1920, height: 1080 });
  const state = world.resource(GameFeelComparison);
  const controls = ui.interactables().map(c => ({ id: c.id, rect: c.rect, label: c.label }));
  expect(world.resource(CameraFeedback).active).toBe(false);
  expect(world.resource(CombatVisualState).active).toBe(false);
  expect(audio.status().voices).toBe(0);
  await step(240); render.stats({ width: 1920, height: 1080 });
  expect(world.resource(GameFeelComparison)).toEqual(state);
  expect(ui.interactables().map(c => ({ id: c.id, rect: c.rect, label: c.label }))).toEqual(controls);
  expect(world.resource(CameraFeedback).active).toBe(false);
  expect(world.resource(CombatVisualState).active).toBe(false);
  expect(audio.status().voices).toBe(0);
}, { memory: 'phone-low' });

routeRenderTest('comparison polished full route keeps optional UI draw and atlas headroom', async (ctx) => {
  let peak = 0;
  await completeRoute(ctx, () => {
    ctx.world.setResource(GameFeelComparison, { exposure: 'bonus', open: true, shake: true, recoil: true, particles: true, flashes: true, audio: true });
  }, () => {
    const stats = ctx.render.stats({ width: 960, height: 540 });
    peak = Math.max(peak, stats.drawCalls);
    expect(stats.atlasPages).toBeLessThanOrEqual(5);
    expect(stats.drawCalls).toBeLessThanOrEqual(12);
  });
  console.log(`comparison full-route draw peak ${peak}/12`);
}, { memory: 'phone-low' });
