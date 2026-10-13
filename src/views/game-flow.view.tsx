import { Button, defineView, Screen, Sprite, Text, View, Widget } from '@gameengine/ui';
import type { Accessor, ViewIO, UINode } from '@gameengine/ui';
import { flowActions, type FlowPhase } from '../game-flow/flow-actions.ts';

export interface FlowModel { phase: FlowPhase; focus: number; health: number; maximum: number; beat: number; cleared: number; dashReady: boolean; controlHeight?: number }
const sample = (phase: FlowPhase, focus = 0): FlowModel => ({ phase, focus, health: 5, maximum: 5, beat: 0, cleared: 0, dashReady: true });
const LABELS = { Start: 'Start run', Pause: 'Pause', Resume: 'Resume', Restart: 'Retry checkpoint', Title: 'Title' };
const panels = {
  Title: ['A GAME FEEL PLAYGROUND', 'Run. Jump. Dash. Make every shot count.'],
  Paused: ['TAKE A BREATHER', 'The sewer can wait.'],
  PlayerDead: ['YOU FELL', 'Retry from your last checkpoint with full health.'],
  Completed: ['OUTLET CLEARED', 'You survived the sewer and defeated the final encounter.'],
};
function panel(model: Accessor<FlowModel>, { intent }: ViewIO) {
  return <Screen class="flow-cover">
    <Sprite src="art/environment/front" fit="cover" class="flow-backdrop" />
    <Screen safeArea class="flow-safe">
      <View class="flow-logo-frame"><Sprite src="art/start-screen" fit="cover" class="flow-art" /></View>
      <Widget doc="flow-panel" id="flow-panel" class="flow-panel"
        props={{ title: () => panels[model().phase as keyof typeof panels]?.[0] ?? '', detail: () => panels[model().phase as keyof typeof panels]?.[1] ?? '' }}
        codeAreas={{ actions: <View class="flow-actions">{flowActions(model().phase).map((action, index) =>
          <Button id={`flow-${action.toLowerCase()}`} class={() => model().focus === index ? 'flow-button flow-selected' : 'flow-button'}
            style={() => ({ height: `${Math.max(88, model().controlHeight ?? 44)}px` })}
            label={model().phase === 'Completed' && action === 'Start' ? 'Play again' : LABELS[action]} onPress={() => intent(action)} />)}</View> as UINode }} />
    </Screen>
  </Screen>;
}
export const TitleView = defineView<FlowModel>({ name: 'Title', blockInput: true, samples: { start: sample('Title') }, render: panel });
export const PauseView = defineView<FlowModel>({ name: 'Pause', blockInput: true, samples: { resume: sample('Paused'), title: sample('Paused', 1) }, render: panel });
export const DeathView = defineView<FlowModel>({ name: 'Death', blockInput: true, samples: { retry: sample('PlayerDead'), title: sample('PlayerDead', 1) }, render: panel });
export const CompletionView = defineView<FlowModel>({ name: 'Completion', blockInput: true, samples: { again: sample('Completed'), title: sample('Completed', 1) }, render: panel });
export const HudView = defineView<FlowModel>({
  name: 'Hud', samples: { start: sample('Playing'), danger: { ...sample('Playing'), health: 1, beat: 3, cleared: 3, dashReady: false } },
  render: (model, { intent }) => <Screen safeArea class="flow-hud">
    <View id="flow-hud" class="flow-hud-bar" style={() => ({ height: `${(model().controlHeight ?? 44) + 12}px` })}>
      <Text class="hud-health">{() => `HP ${model().health}/${model().maximum}`}</Text>
      <Text class="hud-route">{() => `SECTOR ${Math.min(4, model().beat + 1)}/4`}</Text>
      <Text class="hud-dash">{() => model().dashReady ? 'DASH READY' : 'DASH CHARGING'}</Text>
      <Button id="flow-pause" class="flow-button flow-pause" label="II [ESC]" style={() => ({ height: `${model().controlHeight ?? 44}px` })} onPress={() => intent('Pause')} />
    </View>
  </Screen>,
});
