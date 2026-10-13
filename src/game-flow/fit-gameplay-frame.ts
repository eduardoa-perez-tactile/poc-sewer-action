import { defineSystem, fitWorldView, query, read, ViewInfo, WorldView, write } from '@gameengine/runtime';
import { SessionFlow } from '../schema.gen.ts';
const FIT = { reserve: { top: 184, left: 24, right: 24 }, uiReference: [1920, 1080] as [number, number] };
export const FitGameplayFrame = defineSystem({
  name: 'FitGameplayFrame', after: ['SetupGame'],
  query: query(read(SessionFlow)), resources: [read(ViewInfo), write(WorldView)],
  runIf: [{ query: query(read(SessionFlow)) }, { changed: [ViewInfo, WorldView] }],
  run(ctx) { fitWorldView(ctx, 0, 0, 12, 6.75, FIT); },
});
