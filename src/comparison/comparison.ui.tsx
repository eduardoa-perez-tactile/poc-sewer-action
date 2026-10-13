import { createEffect, defineUI, emit, onCleanup, useResource, views, type ViewHandle } from '@gameengine/ui';
import { ComparisonRequested, GameFeelComparison, type ComparisonRequestedValue } from '../schema.gen.ts';
import { ComparisonView } from '../views/comparison.view.tsx';
import type { ComparisonModel } from './comparison-model.ts';

export const ComparisonUI = defineUI({
  name: 'ComparisonUI',
  root() {
    const state = useResource(GameFeelComparison);
    let handle: ViewHandle<ComparisonModel> | null = null;
    createEffect(() => {
      const s = state();
      const model: ComparisonModel = { exposure: s.exposure, open: s.open, shake: s.shake, recoil: s.recoil, particles: s.particles, flashes: s.flashes, audio: s.audio };
      const visible = s.initialized && s.exposure !== 'hidden' && (s.open || s.exposure === 'bonus');
      if (!visible) { handle?.close({ immediate: true }); handle = null; return; }
      if (handle) handle.update(model);
      else handle = views.push(ComparisonView, model, { onIntent: (name, payload) => emit(ComparisonRequested, { action: name as ComparisonRequestedValue['action'], enabled: payload === true }) });
    });
    onCleanup(() => handle?.close({ immediate: true }));
    return null;
  },
});
