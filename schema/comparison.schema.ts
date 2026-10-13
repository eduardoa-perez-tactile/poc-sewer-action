import { asset, bool, dataAsset, enumOf, event, p, resource, u32 } from '@gameengine/schema';

export const ComparisonDef = dataAsset('ComparisonDef', {
  exposure: p.oneOf(['hidden', 'developer', 'bonus']),
  shake: p.bool(), recoil: p.bool(), particles: p.bool(), flashes: p.bool(), audio: p.bool(),
}, { doc: 'Shipped product choice. Developer exposure is opened by the optional QA cheat; bonus exposes a launcher.' });

export const GameFeelComparison = resource('GameFeelComparison', {
  config: asset('data', { default: 'settings/game-feel.json' }),
  initialized: bool({ default: false }),
  exposure: enumOf('ComparisonExposure', ['hidden', 'developer', 'bonus'], { default: 'hidden' }),
  open: bool({ default: false }),
  shake: bool({ default: false }), recoil: bool({ default: false }),
  particles: bool({ default: true }), flashes: bool({ default: true }), audio: bool({ default: true }),
}, { sim: false, doc: 'Presentation choices only. No gameplay system reads this resource.' });

export const ComparisonRequested = event('ComparisonRequested', {
  enabled: bool({ default: false }),
  action: enumOf('ComparisonAction', ['open', 'close', 'baseline', 'polished', 'shake', 'recoil', 'particles', 'flashes', 'audio']),
}, { sim: false, doc: 'View/controller presentation intent; never consumed by simulation.' });

export const ShotFeedbackState = resource('ShotFeedbackState', { lastStep: u32({ default: 0 }) }, { sim: false, doc: 'Accepted shot deduplication, including cues suppressed by comparison choices.' });

export const EnemyFlashState = resource('EnemyFlashState', { enabled: bool({ default: true }) }, { sim: false, doc: 'Last applied flash choice; global tint refresh only when this choice changes.' });
