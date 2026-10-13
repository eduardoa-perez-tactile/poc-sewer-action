import { worldTest as registerWorld, renderTest as registerRender, type TestOptions, type WorldTestContext } from '@gameengine/test';
export { expect } from '@gameengine/test';
export const worldTest = (name: string, fn: (ctx: WorldTestContext) => Promise<void> | void, opts?: TestOptions) => registerWorld(name, fn, { scene: 'scenes/complete-sewer.scene.json', ...opts });
export const renderTest = (name: string, fn: (ctx: WorldTestContext) => Promise<void> | void, opts?: TestOptions) => registerRender(name, fn, { scene: 'scenes/complete-sewer.scene.json', ...opts });
