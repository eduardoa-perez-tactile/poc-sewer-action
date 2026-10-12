import { defineSystem, query, read, write, WorldView } from '@gameengine/runtime';
import { GameState, PlatformCollisionCell, RoomCollisionState } from '../schema.gen.ts';

const VIEW_HEIGHT = 9;

export const SetupGame = defineSystem({
  name: 'SetupGame',
  after: ['BuildRoomCollision'],
  query: query(read(PlatformCollisionCell)),
  resources: [write(GameState), read(RoomCollisionState), write(WorldView)],
  runIf: { resource: GameState, field: 'initialized', value: false },
  run(ctx, collisionCells) {
    const collisionState = ctx.get(RoomCollisionState);
    if (!collisionState.built) return;
    let spawnedCellCount = 0;
    for (const chunk of collisionCells.chunks()) spawnedCellCount += chunk.length;
    if (spawnedCellCount !== collisionState.cellCount) return;

    ctx.set(GameState, { initialized: true, phase: 'Playing' });

    const view = ctx.get(WorldView);
    if (view.orthoSize !== VIEW_HEIGHT / 2 || view.designAspect !== 16 / 9 || view.fit !== 'Contain') {
      ctx.set(WorldView, { center: [0, 0], orthoSize: VIEW_HEIGHT / 2, designAspect: 16 / 9, fit: 'Contain' });
    }
  },
});
