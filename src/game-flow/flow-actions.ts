export type FlowPhase = 'Booting' | 'Playing' | 'PlayerDead' | 'Completed' | 'Title' | 'Paused';
export type FlowAction = 'Start' | 'Pause' | 'Resume' | 'Restart' | 'Title';
const CHOICES: Readonly<Record<FlowPhase, readonly FlowAction[]>> = {
  Booting: [], Playing: ['Pause'], PlayerDead: ['Restart', 'Title'],
  Completed: ['Start', 'Title'], Title: ['Start'], Paused: ['Resume', 'Title'],
};
export const flowActions = (phase: FlowPhase): readonly FlowAction[] => CHOICES[phase];
