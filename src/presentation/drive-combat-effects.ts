import { burstAt, clip2DInfo, defineSystem, ParticleSystem, query, read, RenderTime, write } from '@gameengine/runtime';
import { GameFeelComparison, CombatEffect, CombatVisual, CombatVisualState, RestartRequested } from '../schema.gen.ts';

export const DriveCombatEffects = defineSystem({
  name: 'DriveCombatEffects', stage: 'LateUpdate',
  query: query(write(CombatVisual), write(ParticleSystem)),
  resources: [read(RenderTime), write(CombatVisualState), read(GameFeelComparison)], events: [CombatEffect, RestartRequested],
  runIf: { any: [{ changed: GameFeelComparison }, { event: CombatEffect }, { event: RestartRequested }, { resource: CombatVisualState, field: 'active', value: true }] },
  run(ctx, hosts) {
    const restart = ctx.events.count(RestartRequested) > 0;
    const enabled = ctx.is(GameFeelComparison, 'particles', true);
    const lastStep = ctx.resource(CombatVisualState).lastStep[0]!;
    let newestStep = lastStep;
    const delta = ctx.resource(RenderTime).realDelta[0]!;
    let active = false;
    for (const chunk of hosts.chunks()) for (let row = 0; row < chunk.length; row++) {
      const state = chunk.col(CombatVisual);
      for (let slot = 0; slot < 4; slot++) state.remaining[row * 4 + slot] = restart || !enabled ? 0 : Math.max(0, state.remaining[row * 4 + slot]! - delta);
      if (restart || !enabled) chunk.setField(ParticleSystem, row, 'effect', null);
    }
    if (!restart) ctx.events.forEach(CombatEffect, (event) => {
      if (event.step <= lastStep) return;
      newestStep = Math.max(newestStep, event.step);
      if (!enabled) return;
      for (const chunk of hosts.chunks()) for (let row = 0; row < chunk.length; row++) {
        if (!chunk.is(CombatVisual, row, 'kind', event.kind)) continue;
        const state = chunk.col(CombatVisual);
        const capacity = event.kind === 'hit' ? 4 : 2;
        for (let slot = 0; slot < capacity; slot++) {
          if (state.remaining[row * 4 + slot]! > 0) continue;
          state.remaining[row * 4 + slot] = clip2DInfo(`art/effects/${event.kind}.clip2d.json`).duration;
          chunk.setField(ParticleSystem, row, 'effect', `art/effects/${event.kind}.vfx.json`);
          burstAt(chunk.entity(row), [[event.position[0], event.position[1]]]);
          state.bursts[row] = state.bursts[row]! + 1;
          return;
        }
        // Drop feedback at capacity; gameplay has already resolved the outcome.
      }
    });
    for (const chunk of hosts.chunks()) for (let row = 0; row < chunk.length; row++) for (let slot = 0; slot < 4; slot++) active ||= chunk.col(CombatVisual).remaining[row * 4 + slot]! > 0;
    if (!ctx.is(CombatVisualState, 'active', active)) ctx.setField(CombatVisualState, 'active', active);
    if (!ctx.is(CombatVisualState, 'lastStep', newestStep)) ctx.setField(CombatVisualState, 'lastStep', newestStep);
  },
});
