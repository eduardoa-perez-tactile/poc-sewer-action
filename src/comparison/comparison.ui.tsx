import { ViewInfo } from '@gameengine/runtime';
import { hudControlHeight } from '../game-flow/fit-gameplay-frame.ts';
import { createEffect, defineUI, emit, onCleanup, useResource, views, type ViewHandle } from '@gameengine/ui';
import { ComparisonRequested, GameFeelComparison, GameState, type ComparisonRequestedValue } from '../schema.gen.ts';
import { ComparisonView } from '../views/comparison.view.tsx';
import type { ComparisonModel } from './comparison-model.ts';

export const ComparisonUI = defineUI({
  name: 'ComparisonUI',
  root() {
    const state = useResource(GameFeelComparison), game = useResource(GameState), viewport = useResource(ViewInfo);
    let handle: ViewHandle<ComparisonModel> | null = null;
    createEffect(() => {
      const s = state();
      const v = viewport();
      const model: ComparisonModel = { controlHeight: hudControlHeight(v.width, v.height, v.scale), exposure: s.exposure, open: s.open, shake: s.shake, recoil: s.recoil, particles: s.particles, flashes: s.flashes, audio: s.audio };
      const visible = game().phase === 'Playing' && s.initialized && s.exposure !== 'hidden' && (s.open || s.exposure === 'bonus');
      if (!visible) { handle?.close({ immediate: true }); handle = null; return; }
      if (handle) handle.update(model);
      else handle = views.push(ComparisonView, model, { onIntent: (name, payload) => emit(ComparisonRequested, { action: name as ComparisonRequestedValue['action'], enabled: payload === true }) });
    });
    onCleanup(() => handle?.close({ immediate: true }));
    return null;
  },
});
