import { defineSystem, fitWorldView, query, read, ViewInfo, WorldView, write } from '@gameengine/runtime';
import { SessionFlow } from '../schema.gen.ts';
export function hudControlHeight(width: number, height: number, scale: number): number {
  const fit = Math.min(width / 1920, height / 1080);
  return Math.max(44, (Math.ceil(44 * scale) + 1) / Math.max(fit, 0.001));
}
export const FitGameplayFrame = defineSystem({
  name: 'FitGameplayFrame', after: ['SetupGame'],
  query: query(read(SessionFlow)), resources: [read(ViewInfo), write(WorldView)],
  runIf: [{ query: query(read(SessionFlow)) }, { changed: [ViewInfo, WorldView] }],
  run(ctx) {
    const v = ctx.get(ViewInfo);
    fitWorldView(ctx, 0, 0, 12, 6.75, { reserve: { top: hudControlHeight(v.width, v.height, v.scale) + 28, left: 16, right: 16 }, uiReference: [1920, 1080] });
  },
});
