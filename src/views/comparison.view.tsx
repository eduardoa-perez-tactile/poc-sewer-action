import { Button, defineView, Screen, Text, View } from '@gameengine/ui';
import { COMPARISON_LAYERS, comparisonMode, type ComparisonModel } from '../comparison/comparison-model.ts';

const original: ComparisonModel = { exposure: 'bonus', open: true, shake: true, recoil: true, particles: true, flashes: true, audio: true };
const LABELS = { shake: 'SHAKE', recoil: 'KICK', particles: 'PARTICLES', flashes: 'FLASHES', audio: 'AUDIO' };
export const ComparisonView = defineView<ComparisonModel>({
  name: 'Comparison', layer: 'overlay',
  description: 'Live game-feel comparison with C, 1 and 2 shortcuts.',
  samples: {
    original, baseline: { ...original, shake: false, recoil: false, particles: false, flashes: false, audio: false },
    polished: original, launcher: { ...original, open: false },
  },
  render: (model, { intent }) => (
    <Screen safeArea class="comparison-screen">
      <View id="comparison-panel" class={() => model().open ? 'comparison-panel' : 'comparison-hidden'}>
        <Text class="comparison-heading">{() => `GAME FEEL  /  ${comparisonMode(model())}`}</Text>
        <View class="comparison-row">
          {(['baseline', 'polished', 'close'] as const).map(action => <Button id={`comparison-panel.comparison-${action}`} class="comparison-control"
            style={() => ({ height: `${Math.max(56, model().controlHeight ?? 44)}px` })}
            label={action === 'baseline' ? 'BASELINE [1]' : action === 'polished' ? 'POLISHED [2]' : 'CLOSE [C]'} onPress={() => intent(action)} />)}
        </View>
        <View class="comparison-row">
          {COMPARISON_LAYERS.map(layer => <Button id={`comparison-panel.comparison-${layer}`} class={() => model()[layer] ? 'comparison-control comparison-on' : 'comparison-control'}
            style={() => ({ height: `${Math.max(56, model().controlHeight ?? 44)}px` })}
            label={() => `${LABELS[layer]} ${model()[layer] ? '+' : '−'}`} onPress={() => intent(layer, !model()[layer])} />)}
        </View>
      </View>
      <Button id="comparison-open" class={() => !model().open && model().exposure === 'bonus' ? 'comparison-launcher' : 'comparison-hidden'}
        style={() => ({ height: `${Math.max(56, model().controlHeight ?? 44)}px` })} label="FEEL [C]" onPress={() => intent('open')} />
    </Screen>
  ),
});
