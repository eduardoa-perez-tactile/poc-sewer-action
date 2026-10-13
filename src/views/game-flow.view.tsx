import { Button, defineView, Screen, Sprite, View, Widget } from '@gameengine/ui';
import type { Accessor, ViewIO, UINode } from '@gameengine/ui';
import { flowActions, type FlowPhase } from '../game-flow/flow-actions.ts';

export interface FlowModel { phase: FlowPhase; focus: number; health: number; maximum: number; beat: number; cleared: number; dashReady: boolean }
const sample = (phase: FlowPhase, focus = 0): FlowModel => ({ phase, focus, health: 5, maximum: 5, beat: 0, cleared: 0, dashReady: true });
const LABELS = { Start: 'Start run', Pause: 'Pause', Resume: 'Resume', Restart: 'Retry checkpoint', Title: 'Title' };
const panels = {
  Title: ['ENTER THE SEWER', 'Fight through the flooded sewer. Reach the final outlet.'],
  Paused: ['PAUSED', 'Your run is held. Resume when you are ready.'],
  PlayerDead: ['YOU FELL', 'Retry from your last checkpoint with full health.'],
  Completed: ['OUTLET CLEARED', 'You survived the sewer and defeated the final encounter.'],
};
function panel(model: Accessor<FlowModel>, { intent }: ViewIO) {
  return <Screen class="flow-cover">
    <Screen safeArea class="flow-safe">
      <Sprite src="art/start-screen" class="flow-art" />
      <Widget doc="flow-panel" id="flow-panel" class="flow-panel"
        props={{ title: () => panels[model().phase as keyof typeof panels]?.[0] ?? '', detail: () => panels[model().phase as keyof typeof panels]?.[1] ?? '' }}
        codeAreas={{ actions: <View class="flow-actions">{flowActions(model().phase).map((action, index) =>
          <Button id={`flow-${action.toLowerCase()}`} class={() => model().focus === index ? 'flow-button flow-selected' : 'flow-button'}
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
    <Widget doc="flow-hud" id="flow-hud" class="flow-hud-bar" props={{
      health: () => `HEALTH ${model().health} / ${model().maximum}`,
      route: () => `SEWER ${Math.min(4, model().beat + 1)} / 4`,
      dash: () => model().dashReady ? 'DASH READY' : 'DASH RECHARGING',
    }} codeAreas={{ pause: <Button id="flow-pause" class="flow-button flow-pause" label="Pause [P]" onPress={() => intent('Pause')} /> as UINode }} />
  </Screen>,
});
