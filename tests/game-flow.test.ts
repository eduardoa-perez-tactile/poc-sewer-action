import { expect, worldTest, renderTest } from '@gameengine/test';
import { Disabled, Clip2D, entityString, LocalTransform, SpriteAnimation, Time, quality } from '@gameengine/runtime';
import { previewView, views } from '@gameengine/ui';
import { CameraFollowState, RoomCameraBounds, DamageRequested, EnemyBrain, FinalEncounter, FinalWarning, FlowRequested, GameState, GameplayUI, Health, LevelProgress, Player, PlayerControl, PlayerDashState, PlayerMotion, Projectile, SessionFlow, WaterContact, Weapon, SoldierVisual } from '../src/schema.gen.ts';
import { TitleView, HudView, PauseView, DeathView, CompletionView } from '../src/views/game-flow.view.tsx';
import { completeRoute } from './complete-route.ts';
import { hudControlHeight } from '../src/game-flow/fit-gameplay-frame.ts';
const TITLE = { scene: 'scenes/title.scene.json' };
const RUN = { scene: 'scenes/sewer-run.scene.json' };

worldTest('flow title confirm starts a fresh run and pause navigation returns to title without a pointer', async ({ world, step, input, loaded }) => {
  await loaded(); await step(2);
  expect(views.top()).toBe('Title'); expect(quality.targetFps().cap).toBe(30);
  input.action('menuConfirm', 1); await step(4); input.action('menuConfirm', 0); await step(2);
  expect(world.resource(GameState).phase).toBe('Playing'); expect(views.top()).toBe('Comparison');
  expect(world.entities(Player).length).toBe(1); expect(quality.targetFps().cap).toBe(null);
  input.action('pause', 1); await step(1); input.action('pause', 0); await step(1);
  expect(views.top()).toBe('Pause');
  input.action('menuY', 1); await step(1);
  const flow = world.entities(SessionFlow)[0]!;
  expect(world.get(flow, SessionFlow).focus).toBe(1);
  for (let i = 0; i < 20; i++) { input.action('menuY', 1); await step(1); }
  expect(world.get(flow, SessionFlow).focus).toBe(1);
  input.action('menuY', 0); input.action('menuConfirm', 1); await step(4);
  input.action('menuConfirm', 0); await step(2);
  expect(views.top()).toBe('Title'); expect(world.entities(Player).length).toBe(0);
  input.emit(FlowRequested, { action: 'Start' }); await step(5);
  expect(world.resource(GameState).phase).toBe('Playing'); expect(world.entities(Player).length).toBe(1);
  expect(world.get(world.entities(LevelProgress)[0]!, LevelProgress).checkpoint).toBe(0);
}, TITLE);

worldTest('flow pause preserves actors counters attack clips and absolute deadlines across a long wait', async ({ world, step, input }) => {
  await step(3); const player = world.entities(Player)[0]!, level = world.entities(LevelProgress)[0]!;
  const stamp = world.resource(Time).step;
  world.insert(player, Health, { invulnerableUntilStep: stamp + 40 });
  world.insert(player, WaterContact, { nextSplashStep: stamp + 30 });
  world.insert(level, FinalEncounter, { phase: 'Warning', deadlineStep: stamp + 45 });
  world.insert(level, FinalWarning, {});
  input.action('pause', 1); await step(1); input.action('pause', 0); await step(1);
  const flow = world.entities(SessionFlow)[0]!, pausedAt = world.get(flow, SessionFlow).pausedAt;
  const components = [PlayerControl, PlayerDashState, PlayerMotion, Weapon, LocalTransform] as const;
  const before = components.map(t => world.get(player, t));
  const clips = world.entities(Clip2D).map(e => [e, world.get(e, Clip2D)] as const);
  for (let i = 0; i < 240; i++) { input.action('moveX', 1); input.action('shoot', 1); input.action('jump', 1); await step(1); }
  expect(components.map(t => world.get(player, t))).toEqual(before);
  for (const [e, clip] of clips) expect(world.get(e, Clip2D)).toEqual(clip);
  expect(world.entities(Projectile).filter(e => !world.has(e, Disabled)).length).toBe(0);
  input.emit(DamageRequested, { target: entityString(player), amount: 5 }); await step(1);
  expect(world.get(player, Health).current).toBe(5);
  input.action('moveX', 0); input.action('shoot', 0); input.action('jump', 0);
  input.action('menuBack', 1); await step(1);
  const elapsed = world.resource(Time).step - pausedAt;
  expect(world.resource(GameState).phase).toBe('Playing');
  expect(world.get(player, Health).invulnerableUntilStep).toBe(stamp + 40 + elapsed);
  expect(world.get(player, WaterContact).nextSplashStep).toBe(stamp + 30 + elapsed);
  expect(world.get(level, FinalEncounter).deadlineStep).toBe(stamp + 45 + elapsed);
}, RUN);

worldTest('flow death confirm retries once with full health and completion offers a completely new run', async (ctx) => {
  const { world, step, input } = ctx;
  await step(3); const player = world.entities(Player)[0]!;
  input.emit(DamageRequested, { target: entityString(player), amount: 5, bypassInvulnerability: true }); await step(2);
  expect(views.top()).toBe('Death'); expect(world.resource(GameState).phase).toBe('PlayerDead');
  input.action('menuConfirm', 1); await step(1); input.action('menuConfirm', 0); await step(2);
  expect(views.top()).toBe('Comparison'); expect(world.get(player, Health).current).toBe(5);
  // Completion remains simulation-owned; a terminal fixture isolates menu validation and full reset.
  world.setResource(GameState, { phase: 'Completed' });
  world.insert(world.entities(LevelProgress)[0]!, LevelProgress, { finished: true, checkpoint: 3, cleared: 4 });
  await step(2); expect(views.top()).toBe('Completion');
  input.emit(FlowRequested, { action: 'Restart' }); await step(1);
  expect(world.resource(GameState).phase).toBe('Completed');
  input.action('menuConfirm', 1); await step(5); input.action('menuConfirm', 0); await step(2);
  expect(world.resource(GameState).phase).toBe('Playing');
  expect(world.get(world.entities(LevelProgress)[0]!, LevelProgress).checkpoint).toBe(0);
  expect(world.get(world.entities(Player)[0]!, Health).current).toBe(5);
  expect(world.entities(EnemyBrain).length).toBe(8);
}, RUN);

worldTest('flow recorded route starts pauses resumes dies retries wins and plays again', async ctx => {
  const { world, input, step } = ctx;
  input.view(1920, 1080, 1); await step(2);
  input.action('menuConfirm', 1); await step(5); input.action('menuConfirm', 0); await step(2);
  input.action('pause', 1); await step(2); input.action('pause', 0); await step(12);
  input.action('menuBack', 1); await step(2); input.action('menuBack', 0); await step(2);
  // Walk into the first authored water hazard, then retry with the actual confirm control.
  input.action('moveX', 1);
  for (let i = 0; i < 300 && world.resource(GameState).phase !== 'PlayerDead'; i++) { input.action('moveX', 1); await step(1); }
  input.action('moveX', 0); await step(2); expect(views.top()).toBe('Death');
  input.action('menuConfirm', 1); await step(1); input.action('menuConfirm', 0); await step(2);
  await completeRoute(ctx); expect(views.top()).toBe('Completion');
  expect(world.resource(CameraFollowState).center[0]).toBeGreaterThan(45);
  expect(world.resource(RoomCameraBounds).right).toBe(56);
  input.action('menuConfirm', 1); await step(5); input.action('menuConfirm', 0); await step(2);
  expect(world.get(world.entities(LevelProgress)[0]!, LevelProgress).checkpoint).toBe(0);
  expect(views.top()).toBe('Comparison');
}, TITLE);

renderTest('flow pointer presses reach start pause resume death retry and completion actions', async ({ world, input, step, render, ui, loaded }) => {
  await loaded(); input.view(1920, 1080, 1); await step(2);
  const press = async (id: string) => { render.stats({ width: 1920, height: 1080 }); await ui.press(id); await step(5); };
  await press('flow-start'); expect(views.top()).toBe('Comparison');
  await press('flow-pause'); expect(views.top()).toBe('Pause');
  await press('flow-resume'); expect(views.top()).toBe('Comparison');
  const p = world.entities(Player)[0]!;
  input.emit(DamageRequested, { target: entityString(p), amount: 5, bypassInvulnerability: true }); await step(2);
  await press('flow-restart'); expect(world.get(p, Health).current).toBe(5);
  world.setResource(GameState, { phase: 'Completed' }); await step(2);
  await press('flow-title'); expect(views.top()).toBe('Title');
}, { ...TITLE, memory: 'phone-low' });

renderTest('flow every view sample fits landscape safe areas and reserves the complete gameplay frame', async ({ input, step, render, ui }) => {
  await step(3);
  for (const [width, height, scale, safe] of [
    [2316, 904, 2.625, [84, 0, 0, 0]], [3840, 1644, 4, [96, 0, 0, 0]],
    [2556, 1179, 3, [177, 0, 102, 0]], [1334, 750, 2, [40, 0, 0, 0]],
    [2160, 1620, 2, [40, 0, 0, 0]], [2176, 1812, 2.625, [74, 0, 42, 0]],
    [800, 600, 1, [0, 0, 0, 0]], [2560, 1080, 1, [0, 0, 0, 0]],
  ] as const) {
    input.view(width, height, scale, [...safe]); await step(1);
    for (const view of [TitleView, HudView, PauseView, DeathView, CompletionView]) for (const sample of Object.keys(view.samples)) {
      previewView({ view: view.name, model: { ...view.samples[sample], controlHeight: hudControlHeight(width, height, scale) } });
      const stats = render.stats({ width, height }); expect(stats.drawCalls).toBeLessThanOrEqual(16);
      const buttons = ui.interactables().filter(c => c.hittable && c.id?.startsWith('flow-') && c.id !== 'flow-panel' && c.id !== 'flow-hud');
      expect(buttons.length).toBe(view === TitleView || view === HudView ? 1 : 2);
      for (const b of buttons) {
        expect(b.rect.x).toBeGreaterThanOrEqual(safe[0] - 0.1); expect(b.rect.y).toBeGreaterThanOrEqual(safe[1] - 0.1);
        expect(b.rect.x + b.rect.width).toBeLessThanOrEqual(width - safe[2] + 0.1); expect(b.rect.y + b.rect.height).toBeLessThanOrEqual(height - safe[3] + 0.1);
        expect(b.rect.height / scale).toBeGreaterThanOrEqual(44);
      }
      if (view === HudView) {
        const hud = ui.rect('flow-hud')!;
        const [x0, y0] = input.worldToScreen([-6, 3.375]), [x1, y1] = input.worldToScreen([6, -3.375]);
        expect(x0).toBeGreaterThanOrEqual(safe[0] - 0.1); expect(x1).toBeLessThanOrEqual(width - safe[2] + 0.1);
        expect(y0).toBeGreaterThanOrEqual(hud.y + hud.height - 0.1); expect(y1).toBeLessThanOrEqual(height - safe[3] + 0.1);
      }
    }
  }
  previewView({ view: null });
}, { ...RUN, memory: 'phone-low' });

renderTest('flow title and pause settle with unchanged models layout and presentation clocks', async ({ world, step, input, render, ui, loaded }) => {
  await loaded(); input.view(1920, 1080, 1); await step(3);
  for (const phase of ['Title', 'Paused', 'PlayerDead', 'Completed']) {
    if (phase === 'Paused') { input.emit(FlowRequested, { action: 'Start' }); await step(5); input.emit(FlowRequested, { action: 'Pause' }); await step(2); }
    if (phase === 'PlayerDead') { input.emit(FlowRequested, { action: 'Resume' }); await step(2); input.emit(DamageRequested, { target: entityString(world.entities(Player)[0]!), amount: 5, bypassInvulnerability: true }); await step(3); }
    if (phase === 'Completed') { world.setResource(GameState, { phase: 'Completed' }); await step(2); }
    await step(120); render.stats({ width: 1920, height: 1080 });
    const snapshot = world.resource(GameplayUI), controls = ui.interactables();
    const animations = world.entities(SpriteAnimation).map(e => world.get(e, SpriteAnimation));
    const soldiers = world.entities(SoldierVisual).map(e => world.get(e, SoldierVisual));
    await step(240); render.stats({ width: 1920, height: 1080 });
    expect(world.resource(GameplayUI)).toEqual(snapshot); expect(ui.interactables()).toEqual(controls);
    expect(world.entities(SpriteAnimation).map(e => world.get(e, SpriteAnimation))).toEqual(animations);
    expect(world.entities(SoldierVisual).map(e => world.get(e, SoldierVisual))).toEqual(soldiers);
    expect(quality.targetFps().cap).toBe(30);
  }
}, { ...TITLE, memory: 'phone-low' });

renderTest('flow five views keep stable narrow and wide landscape render goldens', async ({ input, step, render }) => {
  await step(3);
  for (const [width, height] of [[800, 600], [1280, 540]] as const) {
    input.view(width, height, 1); await step(1);
    for (const view of [TitleView, HudView, PauseView, DeathView, CompletionView]) {
      previewView({ view: view.name, sample: Object.keys(view.samples)[0]! });
      render.expectScreenshot(`${view.name}-${width}`, { width, height });
    }
  }
  previewView({ view: null });
}, { ...RUN, memory: 'phone-low' });

worldTest('flow resume samples released controls before movement jump dash or fire can run', async ({ world, step, input }) => {
  await step(3); const p = world.entities(Player)[0]!;
  input.action('moveX', 1); await step(1);
  input.action('moveX', 1); input.action('jump', 1); input.action('dash', 1); input.action('pause', 1); await step(1);
  expect(world.resource(GameState).phase).toBe('Paused'); await step(20);
  input.action('menuBack', 1); await step(1);
  expect(world.resource(GameState).phase).toBe('Playing');
  expect(world.get(p, PlayerControl)).toEqual({ moveX: 0, crouch: false, jumpHeld: false });
  expect(world.get(p, PlayerDashState).active).toBe(false);
  expect(world.get(p, PlayerMotion).jumpBufferStepsRemaining).toBe(0);
}, RUN);

