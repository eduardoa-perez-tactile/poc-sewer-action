import { defineSystem, loadData, LocalTransform, query, read, write } from '@gameengine/runtime';
import { ActorDied, ActorSpawn, EnemyBrain, EncounterMember, GameState, Health, LevelProgress, Player, SewerLevelDef } from '../schema.gen.ts';

/** Ordered gates require the current encounter to be cleared before checkpoint/finish acceptance. */
export const AdvanceLevel = defineSystem({
  name: 'AdvanceLevel', after: ['ResolveDeaths'], before: ['RestartGame'],
  queries: {
    levels: query(write(LevelProgress)),
    players: query(read(Player), read(LocalTransform), write(ActorSpawn)),
    soldiers: query(write(EncounterMember), write(EnemyBrain), read(Health)),
  },
  resources: [read(GameState)], events: [ActorDied],
  runIf: [{ query: query(read(LevelProgress)) }, { resource: GameState, field: 'phase', value: 'Playing' }, { any: [{ event: ActorDied }, { changed: LevelProgress }, { changed: LocalTransform }] }],
  run(ctx, { levels, players, soldiers }) {
    for (const level of levels.chunks()) for (let row = 0; row < level.length; row++) {
      const state = level.col(LevelProgress);
      if (state.beat[row] === 3) continue; // FinalEncounter owns the outlet beat and finish.
      if (state.built[row] === 0 || state.finished[row] !== 0) continue;
      const def = loadData(SewerLevelDef, level.get(LevelProgress, row).data!);
      let beat = state.beat[row]!;
      let remaining = 0;
      // Once cleared, traversal checks only the player; unchanged fights do not recount health.
      const recount = state.activationPending[row] !== 0 || ctx.events.count(ActorDied) > 0;
      if (state.cleared[row]! <= beat && !recount) continue;
      if (state.cleared[row]! <= beat) for (const chunk of soldiers.chunks()) for (let i = 0; i < chunk.length; i++) {
        const member = chunk.col(EncounterMember);
        if (member.beat[i] !== beat) continue;
        if (chunk.col(Health).current[i]! > 0) {
          remaining++;
          if (member.activated[i] === 0) {
            chunk.setField(EncounterMember, i, 'activated', true);
            chunk.setField(EnemyBrain, i, 'state', 'Patrol');
          }
        }
      }
      if (state.activationPending[row] !== 0) level.setField(LevelProgress, row, 'activationPending', false);
      if (remaining > 0) continue;
      if (state.cleared[row]! <= beat) level.setField(LevelProgress, row, 'cleared', beat + 1);
      for (const player of players.chunks()) for (let i = 0; i < player.length; i++) {
        const x = player.col(LocalTransform).position[i * 3]!;
        const next = def.beats[beat + 1];
        if (next && x >= next.checkpointX) {
          beat++;
          level.setField(LevelProgress, row, 'beat', beat);
          level.setField(LevelProgress, row, 'activationPending', true);
          level.setField(LevelProgress, row, 'checkpoint', beat);
          player.set(ActorSpawn, i, { position: [next.checkpointX, next.checkpointY] });
        } else if (!next && x >= def.finishX) {
          level.setField(LevelProgress, row, 'finished', true);
        }
      }
    }
  },
});
