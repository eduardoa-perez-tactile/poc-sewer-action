import { added, without, defineSystem, LocalTransform, query, read, Sprite, VisualOffset } from '@gameengine/runtime';
import { EncounterMember, EnemyBrain, EnemyProjectile, RoomLandmark, SoldierVisual } from '../schema.gen.ts';

/** Reserve presentation on the existing encounter marker: no new entities or hashed transforms. */
export const WarmSoldierVisual = defineSystem({
  name: 'WarmSoldierVisual', stage: 'PostUpdate',
  queries: { actors: query(read(EnemyBrain), without(EncounterMember)), anchors: query(read(RoomLandmark), read(LocalTransform)) },
  runIf: { query: query(added(EnemyProjectile), { includeDisabled: true }) },
  run(ctx, { actors, anchors }) {
    for (const chunk of actors.chunks()) for (let row = 0; row < chunk.length; row++) {
      for (const anchor of anchors.chunks()) for (let i = 0; i < anchor.length; i++) {
        if (!anchor.is(RoomLandmark, i, 'kind', 'Encounter')) continue;
        const entity = anchor.entity(i);
        ctx.commands.insert(entity, SoldierVisual, { actor: chunk.entity(row) });
        ctx.commands.insert(entity, Sprite, { image: 'art/soldier/idle', size: [1.28, 1.2], anchor: [0.5, 0], sortingLayer: 'Characters' });
        ctx.commands.insert(entity, VisualOffset, {});
        return;
      }
    }
  },
});
