import { type Chunk, type EntityId, assetKey, Bounds2D, Clip2D, clip2DFrame, clip2DInfo, defineSystem, entityAt, LocalTransform, query, read, RenderTime, Sprite, VisualOffset, write } from '@gameengine/runtime';
import { GameplayUI, GameState, GameFeelComparison, EnemyBrain, Health, HitReaction, RestartRequested, SoldierVisual, SoldierVisualState } from '../schema.gen.ts';

/** The attack clock remains on the actor. This proxy samples that clock without advancing it. */
export const DriveSoldierAnimation = defineSystem({
  name: 'DriveSoldierAnimation', stage: 'LateUpdate',
  queries: {
    actors: query(read(Bounds2D), read(EnemyBrain), read(Health), read(HitReaction), read(Clip2D), read(LocalTransform), write(Sprite)),
    visuals: query(write(SoldierVisual), read(LocalTransform), write(Sprite), write(VisualOffset)),
  },
  resources: [read(RenderTime), write(SoldierVisualState), read(GameFeelComparison), read(GameState), read(GameplayUI)], events: [RestartRequested],
  after: ['DriveEnemyDamagePresentation'],
  runIf: [{ any: [{ resource: GameplayUI, field: 'enabled', value: false }, { resource: GameState, field: 'phase', op: '!=', value: 'PlayerDead' }] }, { any: [{ resource: GameplayUI, field: 'enabled', value: false }, { resource: GameState, field: 'phase', op: '!=', value: 'Completed' }] }, { resource: GameState, field: 'phase', op: '!=', value: 'Paused' }, { any: [{ changed: GameFeelComparison }, { changed: [EnemyBrain, Health, HitReaction, Clip2D, LocalTransform] }, { event: RestartRequested }, { resource: SoldierVisualState, field: 'active', value: true }] }],
  run(ctx, { actors, visuals }) {
    let active = false;
    const actorRows = new Map<EntityId, { chunk: Chunk; row: number }>();
    for (const chunk of actors.chunks()) for (let row = 0; row < chunk.length; row++) actorRows.set(chunk.entity(row), { chunk, row });
    const delta = ctx.resource(RenderTime).realDelta[0]!;
    for (const visual of visuals.chunks()) for (let row = 0; row < visual.length; row++) {
      const state = visual.col(SoldierVisual);
      const actor = entityAt(state.actor, row);
      const actorRow = actorRows.get(actor);
      if (!actorRow) continue;
      {
        const chunk = actorRow.chunk, i = actorRow.row;
        const visible = chunk.col(Bounds2D).mask[i] !== 0;
        visual.setField(Sprite, row, 'visible', visible);
        if (!visible) continue;
        const previousClip = assetKey(state.clip[row]!) ?? 'art/soldier/idle.clip2d.json';
        const previousInfo = clip2DInfo(previousClip);
        const unfinished = previousInfo.loop === 'loop' || state.time[row]! < previousInfo.duration;
        const flashes = ctx.resource(GameFeelComparison).flashes[0]!;
        const dirty = !state.initialized[row] || state.flashesApplied[row] !== flashes || ctx.events.count(RestartRequested) > 0 || chunk.changed(EnemyBrain, i) || chunk.changed(Health, i) || chunk.changed(HitReaction, i) || chunk.changed(Clip2D, i) || chunk.changed(LocalTransform, i);
        if (!dirty && !unfinished) continue;
        const p = chunk.col(LocalTransform).position;
        const x = p[i * 3]!, y = p[i * 3 + 1]!;
        const attacking = chunk.is(EnemyBrain, i, 'state', 'Attack');
        const dead = chunk.col(Health).current[i] === 0;
        const hurt = chunk.col(HitReaction).stepsRemaining[i]! > 0;
        const dx = x - state.previousPosition[row * 2]!;
        const dy = y - state.previousPosition[row * 2 + 1]!;
        let clip = 'art/soldier/idle.clip2d.json';
        if (dead) clip = 'art/soldier/death.clip2d.json';
        else if (hurt) clip = 'art/soldier/hurt.clip2d.json';
        else if (attacking) clip = assetKey(chunk.col(Clip2D).clip[i]!) ?? clip;
        else if (state.initialized[row] !== 0 && dy > 0.001) clip = 'art/soldier/jump.clip2d.json';
        else if (state.initialized[row] !== 0 && Math.abs(dx) > 0.001) clip = 'art/soldier/run.clip2d.json';
        const changed = !visual.is(SoldierVisual, row, 'clip', clip) || ctx.events.count(RestartRequested) > 0;
        if (changed) { visual.setField(SoldierVisual, row, 'clip', clip); state.time[row] = 0; }
        else state.time[row] = state.time[row]! + delta;
        const info = clip2DInfo(clip);
        const time = attacking && !hurt && !dead ? chunk.col(Clip2D).time[i]! : state.time[row]!;
        const sampleTime = info.loop === 'loop' ? time % info.duration : Math.min(time, info.duration);
        let frame = 0;
        for (let f = 1; f < info.frames.length; f++) if (sampleTime >= info.frames[f]!.start) frame = f;
        state.time[row] = info.loop === 'loop' ? sampleTime : Math.min(state.time[row]!, info.duration);
        active ||= info.loop === 'loop' || sampleTime < info.duration;
        state.frame[row] = frame;
        visual.setField(Sprite, row, 'image', info.frames[frame]!.sprite);
        visual.setField(Sprite, row, 'flipX', chunk.is(EnemyBrain, i, 'facing', 'Right'));
        // The sole supplied hurt pose becomes a short squash into a still cadaver.
        const settle = dead ? Math.min(1, time / info.duration) : 0;
        const offset = visual.col(VisualOffset);
        offset.position[row * 3] = x - visual.col(LocalTransform).position[row * 3]!;
        offset.position[row * 3 + 1] = y - visual.col(LocalTransform).position[row * 3 + 1]!;
        offset.scale[row * 3] = 1 + settle * 0.25;
        offset.scale[row * 3 + 1] = 1 - settle * 0.65;
        state.flashesApplied[row] = flashes;
        state.previousPosition[row * 2] = x; state.previousPosition[row * 2 + 1] = y; state.initialized[row] = 1;
        chunk.setField(Sprite, i, 'visible', false);
        const color = chunk.col(Sprite).color;
        const visualColor = visual.col(Sprite).color;
        const tint = attacking && !dead && !hurt ? clip2DFrame(actor).tint : null;
        for (let lane = 0; lane < 4; lane++) visualColor[row * 4 + lane] = color[i * 4 + lane]! * (tint?.[lane] ?? 1);
      }
    }
    if (!ctx.is(SoldierVisualState, 'active', active)) ctx.setField(SoldierVisualState, 'active', active);
  },
});
