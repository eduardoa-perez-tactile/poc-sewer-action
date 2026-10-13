import { bool, component, enumOf, event, f32, resource, u32 } from '@gameengine/schema';

export const SessionFlow = component('SessionFlow', {
  focus: u32(), observedPhase: u32(), menuHeld: bool(), pausedAt: u32(),
}, { sim: true, doc: 'Authored only in the shipping flow scenes. Owns recorded menu selection and pause timing.' });

export const FlowRequested = event('FlowRequested', {
  action: enumOf('FlowAction', ['Start', 'Pause', 'Resume', 'Restart', 'Title']),
}, { sim: true, doc: 'Desired flow action from an MVC view; simulation validates the current phase.' });

export const GameplayUI = resource('GameplayUI', {
  enabled: bool(), focus: u32(), health: u32(), maximum: u32(), beat: u32(), cleared: u32(), dashReady: bool({ default: true }),
}, { sim: false, doc: 'Changed-only HUD snapshot. Excluded from simulation and legacy fixtures.' });

export const SessionRoom = component('SessionRoom', {
  left: f32({ default: -8 }), right: f32({ default: 56 }), bottom: f32({ default: -4.5 }), top: f32({ default: 4.5 }),
}, { sim: false, doc: 'Authored camera envelope for shipping session scenes; applied on each new run, including cooked swaps.' });
