import { createEffect, defineUI, emit, onCleanup, useResource, views, type ViewHandle } from '@gameengine/ui';
import { quality, ViewInfo } from '@gameengine/runtime';
import { FlowRequested, GameState, GameplayUI } from '../schema.gen.ts';
import { hudControlHeight } from './fit-gameplay-frame.ts';
import { flowActions, type FlowPhase } from './flow-actions.ts';
import { TitleView, HudView, PauseView, DeathView, CompletionView, type FlowModel } from '../views/game-flow.view.tsx';

export const GameFlowUI = defineUI({
  name: 'GameFlowUI',
  root() {
    const state = useResource(GameState), snapshot = useResource(GameplayUI), viewport = useResource(ViewInfo);
    let handle: ViewHandle<FlowModel> | null = null;
    let shown = '';
    createEffect(() => {
      const s = snapshot();
      if (!s.enabled) { handle?.close({ immediate: true }); handle = null; shown = ''; return; }
      const phase = String(state().phase) as FlowPhase;
      const v = viewport();
      const model: FlowModel = { controlHeight: hudControlHeight(v.width, v.height, v.scale), phase, focus: s.focus, health: s.health, maximum: s.maximum, beat: s.beat, cleared: s.cleared, dashReady: s.dashReady };
      const view = phase === 'Title' ? TitleView : phase === 'Paused' ? PauseView : phase === 'PlayerDead' ? DeathView : phase === 'Completed' ? CompletionView : phase === 'Playing' ? HudView : null;
      if (shown !== phase) { handle?.close({ immediate: true }); handle = null; shown = phase; quality.setTargetFps(phase === 'Playing' ? null : 30); }
      if (!view) return;
      if (handle) handle.update(model);
      else handle = views.push(view, model, { onIntent: name => {
        const action = flowActions(phase).find(a => a === name);
        if (action) emit(FlowRequested, { action });
      } });
    });
    onCleanup(() => { handle?.close({ immediate: true }); quality.setTargetFps(null); });
    return null;
  },
});
