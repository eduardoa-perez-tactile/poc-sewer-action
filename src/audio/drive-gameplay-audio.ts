import { audio, defineSystem, read, write } from '@gameengine/runtime';
import { GameFeelComparison, AudioCue, CombatEffect, GameplayAudioState, RestartRequested, WaterEntered } from '../schema.gen.ts';

// Mixer limits also apply across restart: one-shot tails finish naturally (no loops).
// Explicit buses keep weapons/environment separate from character death vocals.
export const SOUND_CUES = [
  { sound: 'audio/sfx/shot', bus: 'SFX', cooldownSteps: 3, maxVoices: 2, priority: 0 },
  { sound: 'audio/sfx/laser', bus: 'SFX', cooldownSteps: 3, maxVoices: 2, priority: 0 },
  { sound: 'audio/sfx/player-death', bus: 'Voice', cooldownSteps: 6, maxVoices: 1, priority: 10 },
  { sound: 'audio/sfx/enemy-death', bus: 'Voice', cooldownSteps: 5, maxVoices: 1, priority: 5 },
  { sound: 'audio/sfx/explosion', bus: 'SFX', cooldownSteps: 4, maxVoices: 2, priority: 3 },
  { sound: 'audio/sfx/water-splash', bus: 'SFX', cooldownSteps: 6, maxVoices: 1, priority: 1 },
] as const;

export const DriveGameplayAudio = defineSystem({
  name: 'DriveGameplayAudio', stage: 'LateUpdate',
  resources: [write(GameplayAudioState), read(GameFeelComparison)],
  runOn: [AudioCue, CombatEffect, WaterEntered, RestartRequested],
  run(ctx) {
    const state = ctx.resource(GameplayAudioState);
    if (ctx.events.count(RestartRequested) > 0) {
      // Suppress both same-frame and retained pre-restart cues; accept fresh consequences.
      for (let lane = 0; lane < SOUND_CUES.length; lane++) {
        state.lastSteps[lane] = ctx.step;
        state.nextSteps[lane] = 0;
      }
      return;
    }
    const play = (lane: number, step: number) => {
      if (step <= state.lastSteps[lane]!) return;
      state.lastSteps[lane] = step;
      if (step < state.nextSteps[lane]!) return;
      const cue = SOUND_CUES[lane]!;
      state.nextSteps[lane] = step + cue.cooldownSteps;
      if (!ctx.is(GameFeelComparison, 'audio', true)) return;
      audio.play(cue.sound, { bus: cue.bus, maxVoices: cue.maxVoices, priority: cue.priority });
    };
    ctx.events.forEach(AudioCue, (cue) => {
      play(cue.kind === 'Shot' ? 0 : cue.kind === 'Laser' ? 1 : cue.kind === 'PlayerDeath' ? 2 : 3, cue.step);
    });
    ctx.events.forEach(CombatEffect, (effect) => {
      if (effect.kind === 'explosion') play(4, effect.step);
    });
    ctx.events.forEach(WaterEntered, (entry) => play(5, entry.entryStep));
  },
});
