import { ActionState, defineSystem, Persistent, query, read, without } from '@gameengine/runtime';
import { SessionFlow } from '../schema.gen.ts';
/** The engine action-map owns these entities for the session, across scene switches. */
export const PreserveFlowInputs = defineSystem({
  name: 'PreserveFlowInputs', stage: 'PreUpdate', after: ['MapInputActions'], before: ['AdvanceSessionFlow'],
  query: query(read(ActionState), without(Persistent)),
  runIf: [{ query: query(read(SessionFlow)) }, { query: query(read(ActionState), without(Persistent)) }],
  run(ctx, actions) { for (const c of actions.chunks()) for (let i = 0; i < c.length; i++) ctx.commands.insert(c.entity(i), Persistent, {}); },
});
