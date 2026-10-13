import { Button, defineView, Screen, Widget } from '@gameengine/ui';
import { COMPARISON_LAYERS, comparisonMode, type ComparisonModel } from '../comparison/comparison-model.ts';

const original: ComparisonModel = { exposure: 'bonus', open: true, shake: false, recoil: false, particles: true, flashes: true, audio: true };
export const ComparisonView = defineView<ComparisonModel>({
  name: 'Comparison', layer: 'overlay',
  description: 'Optional presentation comparison. Baseline, polished, individual layers and close intents.',
  samples: {
    original, baseline: { ...original, particles: false, flashes: false, audio: false },
    polished: { ...original, shake: true, recoil: true }, launcher: { ...original, open: false },
  },
  render: (model, { intent }) => (
    <Screen safeArea class="comparison-screen">
      <Widget doc="comparison-panel" id="comparison-panel" class={() => model().open ? 'comparison-panel' : 'comparison-hidden'}
        props={{ mode: () => comparisonMode(model()), ...Object.fromEntries(COMPARISON_LAYERS.map((layer) => [layer, () => `${layer[0]!.toUpperCase()}${layer.slice(1)}: ${model()[layer] ? 'ON' : 'OFF'}`])) }}
        onIntent={(_, event) => {
          const action = (event.path[event.path.length - 1] ?? '').replace('comparison-', '');
          const layer = COMPARISON_LAYERS.find((key) => key === action);
          intent(action, layer ? !model()[layer] : undefined);
        }} />
      <Button id="comparison-open" class={() => !model().open && model().exposure === 'bonus' ? 'comparison-launcher' : 'comparison-hidden'} label="Game feel" onPress={() => intent('open')} />
    </Screen>
  ),
});
