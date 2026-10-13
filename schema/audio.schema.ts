import { array, enumOf, event, resource, u32 } from '@gameengine/schema';

export const AudioCue = event('AudioCue', {
  kind: enumOf('AudioCueKind', ['Shot', 'Laser', 'PlayerDeath', 'EnemyDeath']),
  step: u32(),
}, { sim: false, doc: 'Accepted gameplay consequence, write-only from sim to audio.' });

export const GameplayAudioState = resource('GameplayAudioState', {
  lastSteps: array(u32(), 6),
  nextSteps: array(u32(), 6),
}, { sim: false, doc: 'Fixed-step cue deduplication and absolute cooldown deadlines; never read by gameplay.' });
