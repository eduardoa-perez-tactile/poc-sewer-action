import { burstAt, defineSystem, LocalTransform, ParticleSystem, query, read, RenderTime, Sprite, VisualOffset, write } from '@gameengine/runtime';
import { FootDust, GameFeelComparison, GameState, MotionEffectState, Player, PlayerDashState, PlayerFeelState, PlayerTrail, RestartRequested } from '../schema.gen.ts';

/** Three retained silhouettes and one twelve-particle host; no allocation during a dash. */
export const DrivePlayerMotionEffects = defineSystem({
  name: 'DrivePlayerMotionEffects', stage: 'LateUpdate', after: ['DrivePlayerAnimation'],
  queries: {
    player: query(read(Player), read(PlayerDashState), read(LocalTransform), read(Sprite)),
    trails: query(write(PlayerTrail), write(Sprite), write(VisualOffset)),
    dust: query(write(FootDust), write(ParticleSystem)),
  },
  resources: [read(GameState), read(GameFeelComparison), read(RenderTime), read(PlayerFeelState), write(MotionEffectState)],
  events: [RestartRequested],
  runIf: { any: [{ changed: GameFeelComparison }, { changed: GameState }, { event: RestartRequested }, { resource: PlayerFeelState, field: 'active', value: true }, { resource: MotionEffectState, field: 'active', value: true }] },
  run(ctx, { player, trails, dust }) {
    const state = ctx.resource(MotionEffectState);
    const feel = ctx.resource(PlayerFeelState);
    const dt = Math.max(0, ctx.resource(RenderTime).realDelta[0]!);
    const clear = ctx.events.count(RestartRequested) > 0 || !ctx.is(GameFeelComparison, 'particles', true) || !ctx.is(GameState, 'phase', 'Playing');
    let active = false;
    for (const chunk of trails.chunks()) for (let row = 0; row < chunk.length; row++) {
      const trail = chunk.col(PlayerTrail);
      trail.remaining[row] = clear ? 0 : Math.max(0, trail.remaining[row]! - dt);
      const remaining = trail.remaining[row]!;
      chunk.col(Sprite).visible[row] = remaining > 0 ? 1 : 0;
      chunk.col(Sprite).color[row * 4 + 3] = 0.32 * remaining / 0.1;
      active ||= remaining > 0;
    }
    for (const chunk of dust.chunks()) for (let row = 0; row < chunk.length; row++) {
      const remaining = clear ? 0 : Math.max(0, chunk.col(FootDust).remaining[row]! - dt);
      chunk.col(FootDust).remaining[row] = remaining;
      if (remaining === 0) chunk.setField(ParticleSystem, row, 'effect', null);
      active ||= remaining > 0;
    }
    state.sampleTime[0] = clear ? 0 : Math.max(0, state.sampleTime[0]! - dt);
    if (!clear) for (const chunk of player.chunks()) for (let row = 0; row < chunk.length; row++) {
      const position = chunk.col(LocalTransform).position;
      const x = position[row * 3]!, y = position[row * 3 + 1]!;
      if (chunk.col(PlayerDashState).active[row] && state.sampleTime[0] === 0) {
        const slot = state.nextSlot[0]!;
        for (const host of trails.chunks()) for (let t = 0; t < host.length; t++) {
          if (host.col(PlayerTrail).slot[t] !== slot) continue;
          host.col(PlayerTrail).remaining[t] = 0.1;
          host.col(VisualOffset).position[t * 3] = x;
          host.col(VisualOffset).position[t * 3 + 1] = y;
          host.col(VisualOffset).scale[t * 3] = 1.2;
          host.col(VisualOffset).scale[t * 3 + 1] = 0.82;
          host.col(Sprite).image[t] = chunk.col(Sprite).image[row]!;
          host.col(Sprite).flipX[t] = chunk.col(Sprite).flipX[row]!;
          host.col(Sprite).visible[t] = 1;
          host.col(Sprite).color[t * 4 + 3] = 0.32;
        }
        state.nextSlot[0] = (slot + 1) % 3;
        state.sampleTime[0] = 0.025;
        active = true;
      }
      const takeoff = feel.takeoffTime[0]!, landing = feel.landingTime[0]!;
      if (takeoff > state.previousTakeoff[0]! || landing > state.previousLanding[0]!) {
        for (const host of dust.chunks()) for (let d = 0; d < host.length; d++) {
          host.col(FootDust).remaining[d] = 0.28;
          host.setField(ParticleSystem, d, 'effect', 'art/effects/foot-dust.vfx.json');
          burstAt(host.entity(d), [[x, y + 0.04]]);
        }
        active = true;
      }
    }
    state.previousTakeoff[0] = feel.takeoffTime[0]!;
    state.previousLanding[0] = feel.landingTime[0]!;
    state.active[0] = active ? 1 : 0;
  },
});
