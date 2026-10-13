import { bool, component, f32, resource, u32 } from '@gameengine/schema';

export const PlayerFeelState = resource('PlayerFeelState', {
  initialized: bool(), active: bool(), grounded: bool(),
  previousHealth: u32(), previousVerticalVelocity: f32(),
  shotTime: f32(), lastShotStep: u32(),
  takeoffTime: f32(), landingTime: f32(), landingStrength: f32(),
}, { sim: false, doc: 'Bounded single-player pose envelopes derived only from accepted gameplay facts.' });

export const CameraConsequenceState = resource('CameraConsequenceState', {
  lastExplosionStep: u32(), lastDeathStep: u32(),
}, { sim: false, doc: 'Deduplicates accepted impact and death camera impulses without changing simulation.' });

export const PlayerTrail = component('PlayerTrail', {
  slot: u32(), remaining: f32(),
}, { sim: false, doc: 'Three authored sprite hosts cap the finite dash silhouette trail.' });

export const FootDust = component('FootDust', { remaining: f32() }, { sim: false });

export const MotionEffectState = resource('MotionEffectState', {
  active: bool(), nextSlot: u32(), sampleTime: f32(), previousTakeoff: f32(), previousLanding: f32(),
}, { sim: false, doc: 'Presentation-only bounded trail sampler and footfall deduplication.' });
