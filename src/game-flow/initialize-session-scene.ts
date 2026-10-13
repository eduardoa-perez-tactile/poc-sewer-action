import { added, defineSystem, query, read, write } from '@gameengine/runtime';
import { EnemyAttackPoolState, GameState, LevelProgress, ProjectilePoolState, RoomCollisionState, SessionFlow } from '../schema.gen.ts';

/** Resources survive switches. Reset bootstrap ownership explicitly on the new scene marker,
 * including cooked hosts where scene resource overrides are not applied on a swap. */
export const InitializeSessionScene = defineSystem({
  name: 'InitializeSessionScene', stage: 'PreUpdate', before: ['AdvanceSessionFlow'],
  queries: { flow: query(read(SessionFlow)), levels: query(read(SessionFlow), read(LevelProgress)) },
  resources: [write(GameState), write(RoomCollisionState), write(ProjectilePoolState), write(EnemyAttackPoolState)],
  runIf: { query: query(added(SessionFlow)) },
  run(ctx, { levels }) {
    ctx.set(GameState, { initialized: levels.count === 0, phase: levels.count === 0 ? 'Title' : 'Booting' });
    ctx.set(RoomCollisionState, { built: false, cellCount: 0 });
    ctx.setField(ProjectilePoolState, 'warmed', false);
    ctx.setField(EnemyAttackPoolState, 'warmed', false);
  },
});
