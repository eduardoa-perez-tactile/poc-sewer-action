import { Clip2D, defineSystem, query, read, write } from '@gameengine/runtime';
import { GameState, SessionFlow } from '../schema.gen.ts';
export const HoldSessionClips = defineSystem({
  name: 'HoldSessionClips', after: ['ResolveDeaths', 'RestartGame', 'AdvanceFinalEncounter'],
  query: query(write(Clip2D)), resources: [read(GameState)],
  runIf: [{ query: query(read(SessionFlow)) }, { changed: GameState }],
  run(ctx, clips) {
    const speed = ctx.is(GameState, 'phase', 'Playing') ? 1 : 0;
    for (const c of clips.chunks()) for (let i = 0; i < c.length; i++) if (c.col(Clip2D).speed[i] !== speed) c.setField(Clip2D, i, 'speed', speed);
  },
});
