import { ActionState, defineSystem, query, read, scenes, write } from '@gameengine/runtime';
import { FinalEncounter, FlowRequested, GamePhase, GameState, Health, RestartRequested, SessionFlow, WaterContact } from '../schema.gen.ts';
import { flowActions, type FlowAction, type FlowPhase } from './flow-actions.ts';

const PHASE_NAMES = Object.keys(GamePhase) as FlowPhase[];

/** Input owns selection; desired-state actions are validated and applied at most once per step. */
export const AdvanceSessionFlow = defineSystem({
  name: 'AdvanceSessionFlow', stage: 'PreUpdate', after: ['MapInputActions'], before: ['CapturePlayerIntent'],
  queries: { actions: query(read(ActionState)), flow: query(write(SessionFlow)), health: query(write(Health)), water: query(write(WaterContact)), finals: query(write(FinalEncounter)) },
  resources: [write(GameState)], events: [FlowRequested],
  runIf: { query: query(read(SessionFlow)) },
  run(ctx, { actions, flow, health, water, finals }) {
    let moveX = 0, moveY = 0, confirm = false, back = false, pause = false;
    for (const c of actions.chunks()) for (let i = 0; i < c.length; i++) {
      const input = c.col(ActionState);
      if (c.is(ActionState, i, 'name', 'menuX')) moveX = input.value[i]!;
      else if (c.is(ActionState, i, 'name', 'menuY')) moveY = input.value[i]!;
      else if (c.is(ActionState, i, 'name', 'menuConfirm')) confirm = input.justPressed[i] !== 0;
      else if (c.is(ActionState, i, 'name', 'menuBack')) back = input.justPressed[i] !== 0;
      else if (c.is(ActionState, i, 'name', 'pause')) pause = input.justPressed[i] !== 0;
    }
    for (const c of flow.chunks()) for (let i = 0; i < c.length; i++) {
      const phase = PHASE_NAMES[ctx.resource(GameState).phase[0]!]!;
      const choices = flowActions(phase);
      const state = c.col(SessionFlow);
      const phaseId = ctx.resource(GameState).phase[0]!;
      if (state.observedPhase[i] !== phaseId) {
        c.setField(SessionFlow, i, 'observedPhase', phaseId);
        c.setField(SessionFlow, i, 'focus', 0);
      }
      let action: FlowAction | null = null;
      {
        const held = Math.abs(moveY) > 0.5 || Math.abs(moveX) > 0.5;
        if (held && !state.menuHeld[i] && choices.length > 1) {
          const direction = (Math.abs(moveY) > 0.5 ? moveY : moveX) > 0 ? 1 : -1;
          c.setField(SessionFlow, i, 'focus', (state.focus[i]! + direction + choices.length) % choices.length);
        }
        c.setField(SessionFlow, i, 'menuHeld', held);
        if (pause) action = phase === 'Playing' ? 'Pause' : phase === 'Paused' ? 'Resume' : null;
        else if (back && phase === 'Paused') action = 'Resume';
        else if (back && (phase === 'PlayerDead' || phase === 'Completed')) action = 'Title';
        else if (confirm && phase !== 'Playing') action = choices[state.focus[i]!] ?? null;
      }
      if (ctx.events.count(FlowRequested) > 0) ctx.events.forEach(FlowRequested, request => { if (choices.includes(String(request.action) as FlowAction)) action = String(request.action) as FlowAction; });
      if (!action) continue;
      if (action === 'Pause') {
        c.setField(SessionFlow, i, 'pausedAt', ctx.step);
        ctx.setField(GameState, 'phase', 'Paused');
      } else if (action === 'Resume') {
        const elapsed = ctx.step - state.pausedAt[i]!;
        // These are the three absolute gameplay deadlines; remaining-step counters never tick while paused.
        for (const h of health.chunks()) for (let r = 0; r < h.length; r++) if (h.col(Health).invulnerableUntilStep[r]! > state.pausedAt[i]!) h.setField(Health, r, 'invulnerableUntilStep', h.col(Health).invulnerableUntilStep[r]! + elapsed);
        for (const w of water.chunks()) for (let r = 0; r < w.length; r++) if (w.col(WaterContact).nextSplashStep[r]! > state.pausedAt[i]!) w.setField(WaterContact, r, 'nextSplashStep', w.col(WaterContact).nextSplashStep[r]! + elapsed);
        for (const f of finals.chunks()) for (let r = 0; r < f.length; r++) if (f.is(FinalEncounter, r, 'phase', 'Warning')) f.setField(FinalEncounter, r, 'deadlineStep', f.col(FinalEncounter).deadlineStep[r]! + elapsed);
        ctx.setField(GameState, 'phase', 'Playing');
      } else if (action === 'Restart') ctx.events.emit(RestartRequested, {});
      else scenes.enter(action === 'Title' ? 'scenes/title.scene.json' : 'scenes/sewer-run.scene.json');
    }
  },
});
