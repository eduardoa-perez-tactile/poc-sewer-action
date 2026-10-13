import { defineCheat } from '@gameengine/runtime/cheats';
import { emit } from '@gameengine/ui';
import { ComparisonRequested } from '../schema.gen.ts';

export const OpenComparison = defineCheat({
  id: 'feel.open', group: 'Presentation', title: 'Open game-feel comparison', presentation: true,
  run() { emit(ComparisonRequested, { action: 'open' }); },
});
