import { array, asset, bool, component, entity, event, f32, resource, string, u32, vec2 } from '@gameengine/schema';

export const SoldierVisual = component('SoldierVisual', {
  actor: entity(),
  clip: asset('clip2d', { default: 'art/soldier/idle.clip2d.json' }),
  previousPosition: vec2(),
  initialized: bool({ default: false }),
  flashesApplied: bool({ default: true }),
  time: f32({ default: 0 }),
  frame: u32({ default: 0 }),
}, { sim: false, doc: 'Presentation proxy; the actor retains the authoritative attack Clip2D clock.' });

export const CombatEffect = event('CombatEffect', {
  kind: string(), position: vec2(), step: u32(),
}, { sim: false, doc: 'Write-only feedback from accepted projectile releases and impacts; never consumed by gameplay.' });

export const CombatVisual = component('CombatVisual', {
  kind: string(), remaining: array(f32(), 4),
  bursts: u32({ default: 0 }),
}, { sim: false, doc: 'Fixed presentation effect slot, hidden after its authored one-shot duration.' });

export const CombatVisualState = resource('CombatVisualState', {
  active: bool({ default: false }), lastStep: u32({ default: 0 }),
}, { sim: false, doc: 'Run gate and per-step feedback deduplication.' });

export const SoldierVisualState = resource('SoldierVisualState', {
  active: bool({ default: true }),
}, { sim: false, doc: 'Stops the animation adapter between movement, combat and settling bursts.' });
