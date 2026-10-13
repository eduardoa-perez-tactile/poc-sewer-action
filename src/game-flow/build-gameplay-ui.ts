import { defineSystem, query, read, write } from '@gameengine/runtime';
import { GameState, GameplayUI, Health, LevelProgress, Player, PlayerDashState, SessionFlow } from '../schema.gen.ts';

export const BuildGameplayUI = defineSystem({
  name: 'BuildGameplayUI', stage: 'LateUpdate', before: ['GameFlowUI'],
  queries: { flow: query(read(SessionFlow)), players: query(read(Player), read(Health), read(PlayerDashState)), levels: query(read(LevelProgress)) },
  resources: [read(GameState), write(GameplayUI)],
  runIf: [{ query: query(read(SessionFlow)) }, { any: [{ changed: [SessionFlow, Health, PlayerDashState, LevelProgress, GameState] }] }],
  run(ctx, { flow, players, levels }) {
    for (const c of flow.chunks()) for (let i = 0; i < c.length; i++) ctx.setField(GameplayUI, 'focus', c.col(SessionFlow).focus[i]!);
    for (const c of players.chunks()) for (let i = 0; i < c.length; i++) {
      ctx.setField(GameplayUI, 'health', c.col(Health).current[i]!);
      ctx.setField(GameplayUI, 'maximum', c.col(Health).maximum[i]!);
      ctx.setField(GameplayUI, 'dashReady', c.col(PlayerDashState).cooldownStepsRemaining[i] === 0);
    }
    for (const c of levels.chunks()) for (let i = 0; i < c.length; i++) {
      ctx.setField(GameplayUI, 'beat', c.col(LevelProgress).beat[i]!);
      ctx.setField(GameplayUI, 'cleared', c.col(LevelProgress).cleared[i]!);
    }
  },
});
