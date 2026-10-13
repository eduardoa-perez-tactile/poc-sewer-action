import { defineSystem, loadData, query, read, RenderTime, ViewInfo, write } from '@gameengine/runtime';
import { FinalEncounter, SewerLevelDef, LevelProgress, RestartRequested, CameraFollowState, GameplayPresentation, RoomCameraBounds } from '../schema.gen.ts';

export const CAMERA_VIEW_HEIGHT = 6.75;
export const CAMERA_DESIGN_ASPECT = 16 / 9;

const HORIZONTAL_DEAD_ZONE = 1.15;
const VERTICAL_DEAD_ZONE = 0.85;
const PLAYER_VERTICAL_BIAS = 0.9;
const MAX_LOOK_AHEAD = 1.35;
const LOOK_AHEAD_SPEED = 8.5;
const FOLLOW_RATE = 0.16;
const LOOK_AHEAD_RATE = 0.18;
const SETTLE_EPSILON = 0.002;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function approach(current: number, target: number, rate: number): number {
  const next = current + (target - current) * rate;
  return Math.abs(target - next) <= SETTLE_EPSILON ? target : next;
}

export function cameraCenterBounds(
  viewWidth: number,
  viewHeight: number,
  safeArea: readonly [number, number, number, number],
  room: Readonly<{ left: number; right: number; bottom: number; top: number }>,
): { minX: number; maxX: number; minY: number; maxY: number } {
  const aspect = viewHeight > 0 ? viewWidth / viewHeight : CAMERA_DESIGN_ASPECT;
  const designWidth = CAMERA_VIEW_HEIGHT * CAMERA_DESIGN_ASPECT;
  const pixelsPerWorldUnit = aspect < CAMERA_DESIGN_ASPECT ? viewWidth / designWidth : viewHeight / CAMERA_VIEW_HEIGHT;
  const leftExtent = (viewWidth / 2 - safeArea[0]) / pixelsPerWorldUnit;
  const topExtent = (viewHeight / 2 - safeArea[1]) / pixelsPerWorldUnit;
  const rightExtent = (viewWidth / 2 - safeArea[2]) / pixelsPerWorldUnit;
  const bottomExtent = (viewHeight / 2 - safeArea[3]) / pixelsPerWorldUnit;
  return {
    minX: room.left + leftExtent,
    maxX: room.right - rightExtent,
    minY: room.bottom + bottomExtent,
    maxY: room.top - topExtent,
  };
}

export const FollowPlayerCamera = defineSystem({
  name: 'FollowPlayerCamera',
  stage: 'LateUpdate',
  after: ['BuildGameplayPresentation'],
  queries: { levels: query(read(LevelProgress)), finals: query(read(FinalEncounter), read(LevelProgress)) }, events: [RestartRequested],
  resources: [read(GameplayPresentation), read(RenderTime), read(RoomCameraBounds), read(ViewInfo), write(CameraFollowState)],
  runIf: { any: [{ event: RestartRequested }, { changed: [GameplayPresentation, FinalEncounter] }, { changed: ViewInfo }, { changed: RoomCameraBounds }, { resource: CameraFollowState, field: 'settled', value: false }] },
  run(ctx, { levels, finals }) {
    const state = ctx.get(CameraFollowState);
    const snapshot = ctx.get(GameplayPresentation);
    const view = ctx.get(ViewInfo);
    const room = ctx.get(RoomCameraBounds);
    const bounds = cameraCenterBounds(view.width, view.height, view.safeArea, room);
    const desiredLookAhead = clamp(snapshot.playerVelocity[0] / LOOK_AHEAD_SPEED, -1, 1) * MAX_LOOK_AHEAD;
    const frameScale = Math.min(ctx.get(RenderTime).realDelta * 60, 4);
    const lookAhead = approach(state.lookAhead, desiredLookAhead, 1 - Math.pow(1 - LOOK_AHEAD_RATE, frameScale));

    let targetX = state.target[0];
    const framedX = snapshot.playerPosition[0] + lookAhead;
    if (framedX < targetX - HORIZONTAL_DEAD_ZONE) targetX = framedX + HORIZONTAL_DEAD_ZONE;
    if (framedX > targetX + HORIZONTAL_DEAD_ZONE) targetX = framedX - HORIZONTAL_DEAD_ZONE;

    let targetY = state.target[1];
    const framedY = snapshot.playerPosition[1] + PLAYER_VERTICAL_BIAS;
    if (framedY < targetY - VERTICAL_DEAD_ZONE) targetY = framedY + VERTICAL_DEAD_ZONE;
    if (framedY > targetY + VERTICAL_DEAD_ZONE) targetY = framedY - VERTICAL_DEAD_ZONE;

    for (const chunk of finals.chunks()) for (let row = 0; row < chunk.length; row++) {
      if (chunk.is(FinalEncounter, row, 'phase', 'Waiting')) continue;
      const tuning = loadData(SewerLevelDef, chunk.get(LevelProgress, row).data!).finalEncounter;
      const x = snapshot.playerPosition[0], y = snapshot.playerPosition[1];
      if (x < tuning.triggerX - 0.5 || x > tuning.cameraX + 4.5 || y < tuning.minY || y > tuning.maxY) continue;
      targetX = tuning.cameraX; targetY = tuning.cameraY;
    }
    const roomCenterX = (room.left + room.right) / 2;
    const roomCenterY = (room.bottom + room.top) / 2;
    targetX = bounds.minX > bounds.maxX ? roomCenterX : clamp(targetX, bounds.minX, bounds.maxX);
    targetY = bounds.minY > bounds.maxY ? roomCenterY : clamp(targetY, bounds.minY, bounds.maxY);
    const snap = levels.count > 0 && ctx.events.count(RestartRequested) > 0;
    const followRate = 1 - Math.pow(1 - FOLLOW_RATE, frameScale);
    const centerX = bounds.minX > bounds.maxX ? roomCenterX : clamp(snap ? targetX : approach(state.center[0], targetX, followRate), bounds.minX, bounds.maxX);
    const centerY = bounds.minY > bounds.maxY ? roomCenterY : clamp(snap ? targetY : approach(state.center[1], targetY, followRate), bounds.minY, bounds.maxY);
    const settled = centerX === targetX && centerY === targetY && lookAhead === desiredLookAhead;

    if (
      state.center[0] !== centerX || state.center[1] !== centerY || state.target[0] !== targetX || state.target[1] !== targetY ||
      state.lookAhead !== lookAhead || state.settled !== settled
    ) {
      ctx.set(CameraFollowState, { center: [centerX, centerY], target: [targetX, targetY], lookAhead, settled });
    }
  },
});
