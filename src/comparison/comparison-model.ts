import type { GameFeelComparisonValue } from '../schema.gen.ts';

export const COMPARISON_LAYERS = ['shake', 'recoil', 'particles', 'flashes', 'audio'] as const;
export type ComparisonModel = Pick<GameFeelComparisonValue, 'exposure' | 'open' | typeof COMPARISON_LAYERS[number]>;

export function comparisonMode(model: ComparisonModel): string {
  if (COMPARISON_LAYERS.every((key) => model[key])) return 'Polished';
  if (COMPARISON_LAYERS.every((key) => !model[key])) return 'Baseline';
  return 'Custom';
}

export function comparisonIntent(model: ComparisonModel, action: string, enabled = false): Partial<ComparisonModel> {
  if (model.exposure === 'hidden') return {};
  if (action === 'open' || action === 'close') return { open: action === 'open' };
  if (action === 'baseline' || action === 'polished') {
    const enabled = action === 'polished';
    return { shake: enabled, recoil: enabled, particles: enabled, flashes: enabled, audio: enabled };
  }
  for (const layer of COMPARISON_LAYERS) if (action === layer) return { [layer]: enabled };
  return {};
}
