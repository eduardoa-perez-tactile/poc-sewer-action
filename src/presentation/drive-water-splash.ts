import { clip2DInfo, defineSystem, query, RenderTime, read, Sprite, SpriteAnimation, VisualOffset, write } from '@gameengine/runtime';
import { GameFeelComparison, RestartRequested, WaterEntered, WaterSplash, WaterSplashState } from '../schema.gen.ts';

export const DriveWaterSplash = defineSystem({
  name: 'DriveWaterSplash',
  stage: 'LateUpdate',
  query: query(write(WaterSplash), write(Sprite), write(SpriteAnimation), write(VisualOffset)),
  resources: [read(RenderTime), write(WaterSplashState), read(GameFeelComparison)],
  events: [WaterEntered, RestartRequested],
  runIf: { any: [
    { changed: GameFeelComparison }, { event: WaterEntered }, { event: RestartRequested },
    { resource: WaterSplashState, field: 'active', value: true },
  ] },
  run(ctx, slots) {
    const restart = ctx.events.count(RestartRequested) !== 0;
    let active = false;
    for (const chunk of slots.chunks()) {
      const remaining = chunk.col(WaterSplash).secondsRemaining;
      for (let row = 0; row < chunk.length; row++) {
        if (restart || !ctx.is(GameFeelComparison, 'particles', true)) {
          remaining[row] = 0;
          chunk.setField(Sprite, row, 'visible', false);
          chunk.setField(SpriteAnimation, row, 'playing', false);
          ctx.events.forEach(WaterEntered, (entry) => {
            if (entry.entryStep > chunk.col(WaterSplash).lastEntryStep[row]!) chunk.col(WaterSplash).lastEntryStep[row] = entry.entryStep;
          });
          continue;
        }
        if (remaining[row]! > 0) {
          remaining[row] = Math.max(0, remaining[row]! - ctx.resource(RenderTime).realDelta[0]!);
          if (remaining[row] === 0) {
            chunk.setField(Sprite, row, 'visible', false);
            chunk.setField(SpriteAnimation, row, 'playing', false);
          }
        }
        ctx.events.forEach(WaterEntered, (entry) => {
          // Sim events remain readable on the following step; present each entry only once.
          if (entry.entryStep <= chunk.col(WaterSplash).lastEntryStep[row]!) return;
          chunk.col(WaterSplash).lastEntryStep[row] = entry.entryStep;
          const clip = clip2DInfo('art/effects/water-splash.clip2d.json');
          remaining[row] = clip.duration;
          chunk.set(SpriteAnimation, row, { frames: clip.frames.map((frame) => frame.sprite).join(','), fps: 1 / clip.frames[0]!.duration, loop: false, playing: true, time: 0, frame: 0 });
          chunk.set(VisualOffset, row, { position: [entry.position[0], entry.position[1], 0] });
          chunk.setField(Sprite, row, 'visible', true);
        });
        active ||= remaining[row]! > 0;
      }
    }
    if (ctx.is(WaterSplashState, 'active', active) === false) ctx.setField(WaterSplashState, 'active', active);
  },
});
