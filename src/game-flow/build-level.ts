import { added, defineSystem, loadData, query, read, write } from '@gameengine/runtime';
import { validateLevel } from './validate-level.ts';
import { LevelProgress, SewerLevelDef } from '../schema.gen.ts';

export const BuildLevel = defineSystem({
  name: 'BuildLevel', before: ['BuildRoomCollision'],
  query: query(write(LevelProgress)),
  runIf: { query: query(added(LevelProgress)) },
  run(ctx, levels) {
    for (const chunk of levels.chunks()) for (let row = 0; row < chunk.length; row++) {
      if (chunk.col(LevelProgress).built[row] !== 0) continue;
      const def = loadData(SewerLevelDef, chunk.get(LevelProgress, row).data!);
      validateLevel(def);
      for (const spawn of def.soldiers) {
        const actor = ctx.commands.spawn({
          ActorSpawn: { position: [spawn.x, spawn.y] }, Alive: {},
          Bounds2D: { shape: 'Aabb', size: [0.7, 1.5], offset: [0, 0.75], layer: 4, mask: 2 },
          Clip2D: { clip: 'art/soldier/idle.clip2d.json' },
          EnemyBrain: { state: 'Idle', patrolMinX: spawn.patrolMinX, patrolMaxX: spawn.patrolMaxX, attackCooldownSteps: spawn.cooldown },
          EnemyRestartState: { state: 'Idle' }, EncounterMember: { beat: spawn.beat },
          Health: { current: spawn.health, maximum: spawn.health }, HitReaction: {},
          LocalTransform: { position: [spawn.x, spawn.y, 0] },
          Sprite: { image: 'art/soldier/idle', size: [1.28, 1.54], anchor: [0.5, 0], sortingLayer: 'Characters', visible: false },
        });
        ctx.commands.spawn({
          LocalTransform: {}, SoldierVisual: { actor }, VisualOffset: {},
          Sprite: { image: 'art/soldier/idle', size: [1.28, 1.2], anchor: [0.5, 0], sortingLayer: 'Characters' },
        });
      }
      for (const water of def.water) ctx.commands.spawn({
        LocalTransform: { position: [water.x, water.surfaceY, 0] },
        Bounds2D: { shape: 'Aabb', size: [water.width, 1.5], offset: [0, -0.75], layer: 16, mask: 1 },
        Hazard: { kind: 'Water', damage: 5 },
      });
      chunk.setField(LevelProgress, row, 'built', true);
    }
  },
});
