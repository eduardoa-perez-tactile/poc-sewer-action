import { expect, worldTest, renderTest } from '@gameengine/test';
import { views } from '@gameengine/ui';
import { ComparisonRequested, GameFeelComparison, GameState, PlayerActionState } from '../src/schema.gen.ts';
import { comparisonMode } from '../src/comparison/comparison-model.ts';
const RUN = { scene: 'scenes/sewer-run.scene.json' };

worldTest('recovery controls boot polished and keyboard comparison is phase safe', async ({ world, step, input, loaded }) => {
  await loaded(); await step(3);
  expect(comparisonMode(world.resource(GameFeelComparison))).toBe('Polished');
  expect(world.resource(GameFeelComparison).open).toBe(false);
  input.action('feelToggle', 1); await step(1);
  expect(world.resource(GameFeelComparison).open).toBe(true);
  await step(4); expect(world.resource(GameFeelComparison).open).toBe(true);
  input.action('feelBaseline', 1); await step(1);
  expect(comparisonMode(world.resource(GameFeelComparison))).toBe('Baseline');
  input.action('feelPolished', 1); await step(1);
  expect(comparisonMode(world.resource(GameFeelComparison))).toBe('Polished');
  input.action('pause', 1); await step(1);
  expect(world.resource(GameState).phase).toBe('Paused');
  expect(world.resource(GameFeelComparison).open).toBe(false);
  input.action('feelToggle', 0); input.action('feelBaseline', 0); input.action('pause', 0); await step(1);
  input.action('feelToggle', 1); input.action('feelBaseline', 1); input.emit(ComparisonRequested, { action: 'baseline' }); await step(1);
  expect(comparisonMode(world.resource(GameFeelComparison))).toBe('Polished');
  input.action('pause', 1); await step(2);
  expect(world.resource(GameState).phase).toBe('Playing');
  expect(world.resource(GameFeelComparison).open).toBe(false);
  expect(comparisonMode(world.resource(GameFeelComparison))).toBe('Polished');
}, RUN);

worldTest('recovery controls reference keyboard aliases preserve recorded intent', async ({ world, step, input, loaded }) => {
  await loaded(); await step(3);
  input.key(51, true); input.key(37, true); await step(1);
  expect(world.resource(PlayerActionState).moveX).toBe(1);
  expect(world.resource(PlayerActionState).jump).toBe(true);
  input.key(51, false); input.key(37, false); await step(1);
  expect(world.resource(PlayerActionState).moveX).toBe(0);
  expect(world.resource(PlayerActionState).jumpHeld).toBe(false);
  input.key(3, true); await step(1);
  expect(world.resource(GameFeelComparison).open).toBe(true);
  input.key(28, true); await step(1);
  expect(comparisonMode(world.resource(GameFeelComparison))).toBe('Baseline');
  input.key(29, true); await step(1);
  expect(comparisonMode(world.resource(GameFeelComparison))).toBe('Polished');
}, RUN);

worldTest('recovery controls left mouse fires and release clears fire', async ({ world, step, input, loaded }) => {
  await loaded(); await step(3);
  input.pointer('down', 800, 600); await step(1);
  expect(world.resource(PlayerActionState).fire).toBe(true);
  input.pointer('up', 800, 600); await step(1);
  expect(world.resource(PlayerActionState).fire).toBe(false);
}, RUN);

renderTest('recovery controls visible compact launcher and real preset buttons work', async ({ world, step, input, render, ui, loaded }) => {
  input.view(1920, 1080, 1); await loaded(); await step(3);
  render.stats({ width: 1920, height: 1080 });
  expect(ui.rect('flow-hud')!.height).toBeLessThanOrEqual(72);
  expect(ui.rect('comparison-open')).toBeDefined();
  await ui.press('comparison-open'); await step(2); render.stats({ width: 1920, height: 1080 });
  await ui.press('comparison-panel.comparison-baseline'); await step(2);
  expect(comparisonMode(world.resource(GameFeelComparison))).toBe('Baseline');
  render.stats({ width: 1920, height: 1080 });
  await ui.press('comparison-panel.comparison-polished'); await step(2);
  expect(comparisonMode(world.resource(GameFeelComparison))).toBe('Polished');
  input.action('pause', 1); await step(2); render.stats({ width: 1920, height: 1080 });
  expect(views.top()).toBe('Pause');
  expect(ui.interactables().some(c => c.id === 'comparison-open' && c.hittable)).toBe(false);
}, RUN);

worldTest('recovery controls pointer cancel and pause clear held fire without losing keyboard fire', async ({ world, step, input, loaded }) => {
  await loaded(); await step(3);
  input.pointer('down', 800, 600); await step(2);
  expect(world.resource(PlayerActionState).fire).toBe(true);
  input.pointer('cancel', 800, 600); await step(1);
  expect(world.resource(PlayerActionState).fire).toBe(false);
  input.pointer('down', 800, 600); input.action('pause', 1); await step(1);
  input.action('pause', 0); await step(2);
  input.action('pause', 1); await step(1);
  expect(world.resource(GameState).phase).toBe('Playing');
  expect(world.resource(PlayerActionState).fire).toBe(false);
  input.action('shoot', 1); input.pointer('up', 800, 600); await step(1);
  expect(world.resource(PlayerActionState).fire).toBe(true);
}, RUN);

renderTest('recovery controls real HUD targets stay touchable inside eight landscape extremes', async ({ world, step, input, render, ui, loaded }) => {
  await loaded(); await step(3);
  for (const [width, height, scale, safe] of [
    [2316,904,2.625,[84,0,0,0]], [3840,1644,4,[96,0,0,0]],
    [2556,1179,3,[177,0,102,0]], [1334,750,2,[40,0,0,0]],
    [2160,1620,2,[40,0,0,0]], [2176,1812,2.625,[74,0,42,0]],
    [800,600,1,[0,0,0,0]], [2560,1080,1,[0,0,0,0]],
  ] as const) {
    input.view(width,height,scale,[...safe]); await step(2); render.stats({width,height});
    for (const id of ['flow-pause','comparison-open']) {
      const b=ui.rect(id)!;
      expect(b.height/scale).toBeGreaterThanOrEqual(43.9);
      expect(b.x).toBeGreaterThanOrEqual(safe[0]-0.1);
      expect(b.x+b.width).toBeLessThanOrEqual(width-safe[2]+0.1);
      expect(b.y+b.height).toBeLessThanOrEqual(height-safe[3]+0.1);
    }
    const hud=ui.rect('flow-hud')!;
    const [,top]=input.worldToScreen([-6,3.375]);
    expect(top).toBeGreaterThanOrEqual(hud.y+hud.height-0.1);
    await ui.press('comparison-open'); await step(2); render.stats({width,height});
    for (const c of ui.interactables().filter(c=>c.hittable && c.id?.startsWith('comparison-panel.comparison-'))) {
      expect(c.rect.height/scale).toBeGreaterThanOrEqual(43.9);
      expect(c.rect.x).toBeGreaterThanOrEqual(safe[0]-0.1);
      expect(c.rect.x+c.rect.width).toBeLessThanOrEqual(width-safe[2]+0.1);
      expect(c.rect.y+c.rect.height).toBeLessThanOrEqual(height-safe[3]+0.1);
    }
    await ui.press('comparison-panel.comparison-close'); await step(2);
    expect(world.resource(PlayerActionState).fire).toBe(false);
  }
}, RUN);

// TestInput.pointer currently fixes button=0. Queue right-click through its same recorded-input host op.
declare const __gameengine_host: (op: string, arg: string) => string;
worldTest('recovery controls right mouse jumps and cancel or menus clear its held intent', async ({ world, step, loaded, input }) => {
  await loaded(); await step(3);
  const right = (phase: string) => __gameengine_host('test.input', JSON.stringify([{type:'pointer',id:0,phase,x:800,y:600,button:1}]));
  right('down'); await step(1);
  expect(world.resource(PlayerActionState).jump).toBe(true);
  expect(world.resource(PlayerActionState).jumpHeld).toBe(true);
  await step(1); expect(world.resource(PlayerActionState).jump).toBe(false);
  right('cancel'); await step(1); expect(world.resource(PlayerActionState).jumpHeld).toBe(false);
  right('down'); await step(1); input.action('pause',1); await step(1);
  input.action('pause',0); right('down'); await step(1);
  input.action('pause',1); await step(1);
  expect(world.resource(PlayerActionState).jumpHeld).toBe(false);
  expect(world.resource(PlayerActionState).jump).toBe(false);
},RUN);
