import { defineSystem, query, read, Shape, write } from '@gameengine/runtime';
import { FinalCue, FinalEncounter } from '../schema.gen.ts';

/** Two still lamps and the existing outlet arrow expose phases without a completion screen. */
export const DriveFinalCues = defineSystem({
  name: 'DriveFinalCues', stage: 'LateUpdate',
  queries: { encounters: query(read(FinalEncounter)), cues: query(read(FinalCue), write(Shape)) },
  runIf: { changed: FinalEncounter },
  run(ctx, { encounters, cues }) {
    for (const encounter of encounters.chunks()) for (let row = 0; row < encounter.length; row++) {
      const guard = encounter.is(FinalEncounter, row, 'phase', 'Guard');
      const warning = encounter.is(FinalEncounter, row, 'phase', 'Warning');
      const bomb = encounter.is(FinalEncounter, row, 'phase', 'Bombardment');
      const open = encounter.is(FinalEncounter, row, 'phase', 'ExitOpen') || encounter.is(FinalEncounter, row, 'phase', 'Won');
      for (const cue of cues.chunks()) for (let i = 0; i < cue.length; i++) {
        const phase = cue.col(FinalCue).phase[i]!;
        const lit = phase === 0 ? guard : phase === 1 ? warning || bomb : open;
        const color = cue.col(Shape).color;
        color[i * 4] = lit ? (phase === 2 ? 0.57 : 1) : 0.33;
        color[i * 4 + 1] = lit ? (phase === 2 ? 0.85 : warning ? 0.75 : 0.38) : 0.38;
        color[i * 4 + 2] = lit ? (phase === 2 ? 0.64 : 0.15) : 0.42;
        color[i * 4 + 3] = 1;
      }
    }
  },
});
